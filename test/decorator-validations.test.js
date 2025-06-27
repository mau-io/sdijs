import { createContainer } from '../index.js';
import { strict as assert } from 'assert';

describe('Decorator Validations Tests', () => {
  let container;

  beforeEach(() => {
    container = createContainer({ verbose: false });
  });

  describe('Decorator Service Validations', () => {
    class TestService {
      execute(params) {
        return `TestService: ${JSON.stringify(params)}`;
      }
    }

    it('should reject decorator service without decorate method', () => {
      class InvalidDecorator {
        // Missing decorate method
        constructor() {}
      }

      container
        .register(InvalidDecorator, 'invalidDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['invalidDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /must have a 'decorate' method/);
    });

    it('should provide helpful error when decorator is a function instead of service', () => {
      const functionDecorator = (instance) => instance;

      container
        .value('functionDecorator', functionDecorator)
        .register(TestService, 'testService')
        .decorateWith(['functionDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /is a function but should be an object with a 'decorate' method/);
      
      assert.throws(() => {
        container.resolve('testService');
      }, /Did you mean to use \.decorate\(functionDecorator\)/);
    });

    it('should warn when decorate method takes no parameters', () => {
      let warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);

      class NoParamsDecorator {
        decorate() { // Should take serviceInstance parameter
          return { execute: () => 'decorated' };
        }
      }

      try {
        container
          .register(NoParamsDecorator, 'noParamsDecorator').asSingleton()
          .register(TestService, 'testService')
          .decorateWith(['noParamsDecorator'])
          .asSingleton();

        container.resolve('testService');

        assert(warnings.some(w => w.includes('takes no parameters')));
        assert(warnings.some(w => w.includes('Expected: decorate(serviceInstance)')));
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should reject decorator that returns null or undefined', () => {
      class NullDecorator {
        decorate(instance) {
          return null; // Invalid!
        }
      }

      container
        .register(NullDecorator, 'nullDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['nullDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /returned null.*must return the decorated service instance/);
    });

    it('should reject decorator that changes service type', () => {
      class TypeChangingDecorator {
        decorate(instance) {
          return 'string instead of object'; // Invalid!
        }
      }

      container
        .register(TypeChangingDecorator, 'typeChangingDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['typeChangingDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /changed service type from object to string/);
    });

    it('should reject decorator that removes public methods', () => {
      class ExecuteRemovingDecorator {
        decorate(instance) {
          return { notExecute: 'wrong' }; // Removed execute method!
        }
      }

      container
        .register(ExecuteRemovingDecorator, 'executeRemovingDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['executeRemovingDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /removed public method\(s\).*execute/);
    });

    it('should warn when method signatures change', () => {
      let warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);

      class SignatureChangingDecorator {
        decorate(instance) {
          return {
            ...instance,
            execute: (param1, param2, param3) => 'different signature'
          };
        }
      }

      try {
        container
          .register(SignatureChangingDecorator, 'signatureChangingDecorator').asSingleton()
          .register(TestService, 'testService')
          .decorateWith(['signatureChangingDecorator'])
          .asSingleton();

        container.resolve('testService');

        assert(warnings.some(w => w.includes('changed \'execute\' method signature')));
        assert(warnings.some(w => w.includes('Original: 1 params, Decorated: 3 params')));
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should warn when properties are lost', () => {
      let warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);

      class ServiceWithProps {
        constructor() {
          this.importantProperty = 'important';
          this.anotherProperty = 'another';
        }
        execute() { return 'result'; }
      }

      class PropertyLosingDecorator {
        decorate(instance) {
          return {
            execute: instance.execute,
            // Lost importantProperty and anotherProperty!
          };
        }
      }

      try {
        container
          .register(PropertyLosingDecorator, 'propertyLosingDecorator').asSingleton()
          .register(ServiceWithProps, 'serviceWithProps')
          .decorateWith(['propertyLosingDecorator'])
          .asSingleton();

        container.resolve('serviceWithProps');

        assert(warnings.some(w => w.includes('removed properties')));
        assert(warnings.some(w => w.includes('importantProperty, anotherProperty')));
        assert(warnings.some(w => w.includes('Consider using { ...originalInstance')));
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('Custom Decorator Function Validations', () => {
    class TestService {
      execute() { return 'test'; }
    }

    it('should reject non-function custom decorators', () => {
      assert.throws(() => {
        container
          .register(TestService, 'testService')
          .decorate('not a function') // Invalid!
          .asSingleton();
      }, /Decorator must be a function/);
    });

    it('should warn when custom decorator takes no parameters', () => {
      let warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);

      const noParamsDecorator = () => ({ execute: () => 'decorated' });

      try {
        container
          .register(TestService, 'testService')
          .decorate(noParamsDecorator)
          .asSingleton();

        container.resolve('testService');

        assert(warnings.some(w => w.includes('takes no parameters')));
        assert(warnings.some(w => w.includes('(serviceInstance) => decoratedInstance')));
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should validate custom decorator results same as service decorators', () => {
      const nullReturningDecorator = (instance) => null;

      container
        .register(TestService, 'testService')
        .decorate(nullReturningDecorator)
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /returned null.*must return the decorated service instance/);
    });
  });

  describe('Success Cases with Verbose Logging', () => {
    it('should log success when decorators are valid', () => {
      let logs = [];
      const originalLog = console.log;
      console.log = (msg) => logs.push(msg);

      const container = createContainer({ verbose: true });

      class ValidDecorator {
        decorate(instance) {
          return {
            ...instance,
            execute: (params) => `Decorated: ${instance.execute(params)}`
          };
        }
      }

      class TestService {
        execute(params) { return `Original: ${params}`; }
      }

      try {
        container
          .register(ValidDecorator, 'validDecorator').asSingleton()
          .register(TestService, 'testService')
          .decorateWith(['validDecorator'])
          .asSingleton();

        const service = container.resolve('testService');
        const result = service.execute('test');

        assert.equal(result, 'Decorated: Original: test');
        assert(logs.some(log => log.includes('[SDIJS:VALIDATION] Decorator \'validDecorator\' successfully preserved service interface')));
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Real-world Decorator Patterns', () => {
    it('should validate correct cache decorator pattern', () => {
      class MockCache {
        constructor() { this.storage = new Map(); }
        get(key) { return this.storage.get(key); }
        set(key, value) { this.storage.set(key, value); }
        has(key) { return this.storage.has(key); }
      }

      class CacheDecorator {
        constructor({ cache }) {
          this.cache = cache;
        }

        decorate(serviceInstance) {
          const originalExecute = serviceInstance.execute.bind(serviceInstance);
          
          return {
            ...serviceInstance, // ✅ Preserves all properties
            execute: async (params) => {
              const key = JSON.stringify(params);
              if (this.cache.has(key)) {
                return this.cache.get(key);
              }
              const result = await originalExecute(params);
              this.cache.set(key, result);
              return result;
            }
          };
        }
      }

      class TestService {
        async execute(params) {
          return `Result for ${JSON.stringify(params)}`;
        }
      }

      // Should not throw any validation errors
      assert.doesNotThrow(() => {
        container
          .register(MockCache, 'cache').asSingleton()
          .register(CacheDecorator, 'cacheDecorator').asSingleton()
          .register(TestService, 'testService')
          .decorateWith(['cacheDecorator'])
          .asSingleton();

        const service = container.resolve('testService');
        return service.execute({ test: 'data' });
      });
    });

    it('should provide helpful error messages with context', () => {
      class BadDecorator {
        decorate(instance) {
          return { wrongMethod: 'not execute' };
        }
      }

      container
        .register(BadDecorator, 'badDecorator').asSingleton()
        .register(TestService, 'myImportantService')
        .decorateWith(['badDecorator'])
        .asSingleton();

      try {
        container.resolve('myImportantService');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error.message.includes('badDecorator'));
        assert(error.message.includes('myImportantService'));
        assert(error.message.includes('removed public method(s)'));
        assert(error.message.includes('execute'));
      }
    });
  });



  describe('Universal Method Detection', () => {
    it('should detect and validate ALL public methods regardless of name', () => {
      class UserService {
        getUserById(id) { return { id, name: `User ${id}` }; }
        findUsersByEmail(email) { return [{ email }]; }
        createNewUser(userData) { return { id: Date.now(), ...userData }; }
        updateUserProfile(id, data) { return { id, ...data }; }
        deleteUser(id) { return { deleted: true, id }; }
        calculateUserScore(id) { return Math.random() * 100; }
        sendWelcomeEmail(user) { return `Email sent to ${user.email}`; }
        validateUserData(data) { return data.email && data.name; }
        _internalMethod() { return 'private'; } // Should be ignored
        $systemMethod() { return 'system'; }   // Should be ignored
      }

      class RemoveMethodsDecorator {
        decorate(instance) {
          return { 
            getUserById: instance.getUserById,
            findUsersByEmail: instance.findUsersByEmail,
            // Missing other methods!
          };
        }
      }

      container
        .register(RemoveMethodsDecorator, 'removeMethodsDecorator').asSingleton()
        .register(UserService, 'userService')
        .decorateWith(['removeMethodsDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('userService');
      }, /removed public method\(s\).*createNewUser, updateUserProfile, deleteUser, calculateUserScore, sendWelcomeEmail, validateUserData/);
    });

    it('should work with any method name pattern', () => {
      class WeirdService {
        doSomethingVerySpecific() { return 'specific'; }
        performComplexCalculation() { return 42; }
        handleWeirdBusinessLogic() { return 'weird'; }
        xyz123Method() { return 'numbers'; }
        methodWithCamelCase() { return 'camel'; }
        method_with_underscores() { return 'snake'; }
      }

      class RemoveWeirdDecorator {
        decorate(instance) {
          return { 
            doSomethingVerySpecific: instance.doSomethingVerySpecific,
            // Missing all other methods!
          };
        }
      }

      container
        .register(RemoveWeirdDecorator, 'removeWeirdDecorator').asSingleton()
        .register(WeirdService, 'weirdService')
        .decorateWith(['removeWeirdDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('weirdService');
      }, /removed public method\(s\)/);
      
      assert.throws(() => {
        container.resolve('weirdService');
      }, /performComplexCalculation, handleWeirdBusinessLogic, xyz123Method, methodWithCamelCase, method_with_underscores/);
    });

    it('should preserve ALL public methods correctly', () => {
      let logs = [];
      const originalLog = console.log;
      console.log = (msg) => logs.push(msg);

      const container = createContainer({ verbose: true });

      class CompleteService {
        methodA() { return 'A'; }
        methodB() { return 'B'; }
        methodC() { return 'C'; }
        _privateMethod() { return 'private'; }
      }

      class ProperUniversalDecorator {
        decorate(instance) {
          return {
            ...instance, // ✅ Preserves everything
            methodA: () => `decorated ${instance.methodA()}`,
            methodB: () => `decorated ${instance.methodB()}`,
            methodC: () => `decorated ${instance.methodC()}`,
          };
        }
      }

      try {
        container
          .register(ProperUniversalDecorator, 'properUniversalDecorator').asSingleton()
          .register(CompleteService, 'completeService')
          .decorateWith(['properUniversalDecorator'])
          .asSingleton();

        const service = container.resolve('completeService');
        
        // Verify all methods work
        assert.equal(service.methodA(), 'decorated A');
        assert.equal(service.methodB(), 'decorated B');
        assert.equal(service.methodC(), 'decorated C');

        // Should log success with ALL public methods
        const successLog = logs.find(log => log.includes('successfully preserved service interface'));
        assert(successLog);
        assert(successLog.includes('3 methods: methodA, methodB, methodC'));
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle services with no public methods gracefully', () => {
      class DataOnlyService {
        constructor() {
          this.data = 'value';
        }
        // No public methods, only private
        _internalProcess() { return 'internal'; }
      }

      class ValidDataDecorator {
        decorate(instance) {
          return {
            ...instance,
            data: `decorated ${instance.data}`
          };
        }
      }

      // Should not throw - no public methods to validate
      assert.doesNotThrow(() => {
        container
          .register(ValidDataDecorator, 'validDataDecorator').asSingleton()
          .register(DataOnlyService, 'dataOnlyService')
          .decorateWith(['validDataDecorator'])
          .asSingleton();

        const service = container.resolve('dataOnlyService');
        assert.equal(service.data, 'decorated value');
      });
    });

    it('should warn about signature changes for any method', () => {
      let warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);

      class AnyMethodService {
        customBusinessMethod(param1) { return param1; }
        anotherSpecialMethod(p1, p2) { return [p1, p2]; }
      }

      class SignatureChangingDecorator {
        decorate(instance) {
          return {
            ...instance,
            customBusinessMethod: (p1, p2, p3) => `decorated ${instance.customBusinessMethod(p1)}`,
            anotherSpecialMethod: () => `decorated ${instance.anotherSpecialMethod('a', 'b')}`
          };
        }
      }

      try {
        container
          .register(SignatureChangingDecorator, 'signatureChangingDecorator').asSingleton()
          .register(AnyMethodService, 'anyMethodService')
          .decorateWith(['signatureChangingDecorator'])
          .asSingleton();

        container.resolve('anyMethodService');

        assert(warnings.some(w => w.includes('customBusinessMethod') && w.includes('Original: 1 params, Decorated: 3 params')));
        assert(warnings.some(w => w.includes('anotherSpecialMethod') && w.includes('Original: 2 params, Decorated: 0 params')));
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should detect and validate inherited methods', () => {
      class BaseService {
        baseMethod() { return 'base'; }
      }

      class ExtendedService extends BaseService {
        extendedMethod() { return 'extended'; }
      }

      class RemoveInheritedDecorator {
        decorate(instance) {
          return { 
            extendedMethod: instance.extendedMethod,
            // Missing baseMethod from parent!
          };
        }
      }

      container
        .register(RemoveInheritedDecorator, 'removeInheritedDecorator').asSingleton()
        .register(ExtendedService, 'extendedService')
        .decorateWith(['removeInheritedDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('extendedService');
      }, /removed public method\(s\).*baseMethod/);
    });
  });

  // Helper class for tests
  class TestService {
    execute() { return 'test'; }
  }
}); 