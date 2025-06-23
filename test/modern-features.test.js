/**
 * SDI v2.0 Modern Features Tests
 * Testing new capabilities while maintaining destructuring
 */

import assert from 'assert';
import SDI, { LIFECYCLE, createContainer } from '../index.js';

describe('SDI v2.0 Modern Features', () => {

  let container;

  beforeEach(() => {
    container = new SDI({ verbose: false });
  });

  describe('🚀 Fluent API', () => {
    
    it('should support method chaining', () => {
      const result = container
        .value('config', { test: true })
        .singleton(class TestService {
          constructor({config}) {
            this.config = config;
          }
        });
      
      assert.strictEqual(result, container, 'Should return container for chaining');
    });

    it('should support createContainer factory', () => {
      const newContainer = createContainer({ verbose: true });
      assert.ok(newContainer instanceof SDI);
    });

  });

  describe('🔄 Scoped Dependencies', () => {

    it('should create and manage scopes', () => {
      const scope = container.createScope('request');
      assert.strictEqual(scope.name, 'request');
      assert.strictEqual(container.scope('request'), scope);
    });

    it('should isolate instances between scopes', () => {
      class ScopedService {
        constructor({}) {
          this.id = Math.random();
        }
      }

      container.register(ScopedService).asScoped();
      
      const scope1 = container.createScope('scope1');
      const scope2 = container.createScope('scope2');
      
      const instance1 = scope1.resolve('scopedService');
      const instance2 = scope2.resolve('scopedService');
      
      assert.notStrictEqual(instance1, instance2);
      assert.notStrictEqual(instance1.id, instance2.id);
    });

  });

  describe('🏭 Factory Functions', () => {

    it('should support factory functions with DI', () => {
      container.value('config', { prefix: 'TEST' });
      
      container.factory('logger', ({config}) => {
        return {
          log: (msg) => `${config.prefix}: ${msg}`,
          config: config
        };
      }).asSingleton();

      const logger = container.resolve('logger');
      assert.strictEqual(logger.log('Hello'), 'TEST: Hello');
      assert.strictEqual(logger.config.prefix, 'TEST');
    });

  });

  describe('🪝 Lifecycle Hooks', () => {

    it('should call hooks in correct order', () => {
      const events = [];

      container
        .hook('beforeResolve', ({name}) => events.push(`beforeResolve:${name}`))
        .hook('afterResolve', ({name}) => events.push(`afterResolve:${name}`))
        .hook('beforeCreate', ({service}) => events.push(`beforeCreate:${service.name}`))
        .hook('afterCreate', ({service}) => events.push(`afterCreate:${service.name}`));

      class TestService {
        constructor({}) {}
      }

      container.singleton(TestService);
      container.resolve('testService');

      assert.deepStrictEqual(events, [
        'beforeResolve:testService',
        'beforeCreate:testService',
        'afterCreate:testService',
        'afterResolve:testService'
      ]);
    });

  });

  describe('🏷️ Service Builder Features', () => {

    it('should support tags', () => {
      class TaggedService {
        constructor({}) {}
      }

      const builder = container
        .register(TaggedService, 'tagged')
        .withTag('api')
        .withTag('service')
        .asSingleton();

      const service = container._services.get('tagged');
      assert.strictEqual(service.tags.has('api'), true);
      assert.strictEqual(service.tags.has('service'), true);
    });

    it('should support conditional registration', () => {
      let condition = false;

      class ConditionalService {
        constructor({}) {}
      }

      // Should not register when condition is false
      container
        .register(ConditionalService, 'conditional1')
        .when(() => condition)
        .asSingleton();

      assert.strictEqual(container.has('conditional1'), false);

      // Should register when condition is true
      condition = true;
      container
        .register(ConditionalService, 'conditional2')
        .when(() => condition)
        .asSingleton();

      assert.strictEqual(container.has('conditional2'), true);
    });

    it('should support service override', () => {
      class OriginalService {
        constructor({}) {
          this.version = 1;
        }
      }

      class UpdatedService {
        constructor({}) {
          this.version = 2;
        }
      }

      // Register original service
      container.singleton('testService', OriginalService);
      let service = container.resolve('testService');
      assert.strictEqual(service.version, 1);

      // Override with new implementation
      container
        .register(UpdatedService, 'testService')
        .override()
        .asSingleton();

      service = container.resolve('testService');
      assert.strictEqual(service.version, 2);
    });

    it('should support multiple tags with withTags', () => {
      class MultiTagService {
        constructor({}) {}
      }

      container
        .register(MultiTagService, 'multiTag')
        .withTags('tag1', 'tag2', 'tag3')
        .asSingleton();

      const service = container._services.get('multiTag');
      assert.strictEqual(service.tags.has('tag1'), true);
      assert.strictEqual(service.tags.has('tag2'), true);
      assert.strictEqual(service.tags.has('tag3'), true);
      assert.strictEqual(service.tags.size, 3);
    });

  });

  describe('🔍 Advanced Resolution', () => {

    it('should resolve multiple services', () => {
      container
        .value('config', { test: true })
        .value('logger', { log: () => {} });

      const services = container.resolveAll(['config', 'logger']);
      
      assert.strictEqual(typeof services, 'object');
      assert.strictEqual(services.config.test, true);
      assert.strictEqual(typeof services.logger.log, 'function');
    });

    it('should provide resolver functions', () => {
      container.value('testValue', 42);
      
      const resolver = container.getResolver('testValue');
      assert.strictEqual(typeof resolver, 'function');
      assert.strictEqual(resolver(), 42);
    });

    it('should detect circular dependencies', () => {
      class ServiceA {
        constructor({serviceB}) {
          this.serviceB = serviceB;
        }
      }

      class ServiceB {
        constructor({serviceA}) {
          this.serviceA = serviceA;
        }
      }

      container.singleton(ServiceA).singleton(ServiceB);

      assert.throws(() => {
        container.resolve('serviceA');
      }, /Circular dependency detected/);
    });

  });

  describe('💎 Destructuring Compatibility', () => {

    it('should maintain {a,b,c} destructuring syntax', () => {
      container
        .value('config', { value: 42 })
        .value('logger', { info: (msg) => msg })
        .value('helper', { format: (str) => str.toUpperCase() });

      class ModernService {
        // ✅ MAINTAINS {a,b,c} destructuring!
        constructor({config, logger, helper}) {
          this.config = config;
          this.logger = logger;
          this.helper = helper;
          this.initialized = true;
        }

        getResult() {
          return this.config.value + this.helper.format('test');
        }
      }

      container.singleton(ModernService);
      const service = container.resolve('modernService');

      assert.strictEqual(service.initialized, true);
      assert.strictEqual(service.config.value, 42);
      assert.strictEqual(service.getResult(), '42TEST');
    });

  });

  describe('🛠️ Utility Methods', () => {

    it('should check service existence', () => {
      assert.strictEqual(container.has('nonExistent'), false);
      
      container.value('test', 123);
      assert.strictEqual(container.has('test'), true);
    });

    it('should list service names', () => {
      container
        .value('service1', 1)
        .value('service2', 2);
      
      const names = container.getServiceNames();
      assert.strictEqual(names.length, 2);
      assert.strictEqual(names.includes('service1'), true);
      assert.strictEqual(names.includes('service2'), true);
    });

    it('should clear all services', () => {
      container
        .value('test1', 1)
        .value('test2', 2);
      
      assert.strictEqual(container.getServiceNames().length, 2);
      
      container.clear();
      assert.strictEqual(container.getServiceNames().length, 0);
    });

    it('should unregister specific services', () => {
      container
        .value('keep', 'this')
        .value('remove', 'this');
      
      assert.strictEqual(container.has('keep'), true);
      assert.strictEqual(container.has('remove'), true);
      
      container.unregister('remove');
      
      assert.strictEqual(container.has('keep'), true);
      assert.strictEqual(container.has('remove'), false);
    });

  });

  describe('⚡ Performance & Auto-binding', () => {

    it('should auto-bind class methods', () => {
      container.options.autoBinding = true;

      class TestService {
        constructor({}) {
          this.value = 42;
        }

        getValue() {
          return this.value;
        }
      }

      container.singleton(TestService);
      const service = container.resolve('testService');
      
      const { getValue } = service;
      assert.strictEqual(getValue(), 42, 'Method should be auto-bound');
    });

  });

  describe('❌ Error Handling', () => {

    it('should provide helpful error messages', () => {
      assert.throws(() => {
        container.resolve('nonExistent');
      }, /Service 'nonExistent' not found. Did you forget to register it\?/);
    });

    it('should prevent setting values on dependency proxy', () => {
      class TestService {
        constructor(deps) {
          assert.throws(() => {
            deps.someValue = 'test';
          }, /Dependencies are read-only/);
        }
      }

      container.singleton(TestService);
      container.resolve('testService');
    });

    it('should provide helpful scope error messages', () => {
      assert.throws(() => {
        container.scope('nonExistentScope');
      }, /Scope 'nonExistentScope' not found. Create it first with createScope\(\)/);
    });

    it('should prevent duplicate registration in strict mode', () => {
      const strictContainer = createContainer({ strictMode: true });
      
      class TestService {
        constructor({}) {}
      }

      strictContainer.singleton('duplicate', TestService);
      
      assert.throws(() => {
        strictContainer.singleton('duplicate', TestService);
      }, /Service 'duplicate' is already registered. Use override\(\) to replace it\./);
    });

  });

  describe('📦 Constants and Exports', () => {

    it('should export LIFECYCLE constants', () => {
      assert.strictEqual(LIFECYCLE.SINGLETON, 'singleton');
      assert.strictEqual(LIFECYCLE.TRANSIENT, 'transient');
      assert.strictEqual(LIFECYCLE.SCOPED, 'scoped');
      assert.strictEqual(LIFECYCLE.VALUE, 'value');
    });

  });

  describe('⚙️ Container Options', () => {

    it('should support verbose mode', () => {
      const verboseContainer = createContainer({ verbose: true });
      
      // Capture console.log output
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));

      try {
        // Register a value and a service that depends on it
        verboseContainer.value('config', { test: true });
        
        class VerboseTestService {
          constructor({config}) {
            this.config = config;
          }
        }
        
        verboseContainer.singleton(VerboseTestService);
        verboseContainer.resolve('verboseTestService');
        
        assert.strictEqual(logs.some(log => log.includes('📝 Registered: config [value]')), true);
        assert.strictEqual(logs.some(log => log.includes('📝 Registered: verboseTestService [singleton]')), true);
        assert.strictEqual(logs.some(log => log.includes('🔍 Resolving dependency: config')), true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should support autoBinding option', () => {
      const noAutoBindContainer = createContainer({ autoBinding: false });
      
      class TestService {
        constructor({}) {
          this.value = 42;
        }
        
        getValue() {
          return this.value;
        }
      }

      noAutoBindContainer.singleton(TestService);
      const service = noAutoBindContainer.resolve('testService');
      
      const { getValue } = service;
      // Without auto-binding, 'this' context is lost
      assert.throws(() => {
        getValue();
      }, /Cannot read.*undefined/);
    });

    it('should support strictMode option', () => {
      const strictContainer = createContainer({ strictMode: true });
      
      class TestService {
        constructor({}) {}
      }

      strictContainer.singleton('test', TestService);
      
      // Should throw in strict mode without override()
      assert.throws(() => {
        strictContainer.singleton('test', TestService);
      }, /Service 'test' is already registered/);
    });

  });

  describe('🔒 Security Features', () => {

    it('should block dangerous property access', () => {
      class DangerousService {
        constructor(deps) {
          // Try to access dangerous properties
          assert.throws(() => {
            const proto = deps.__proto__;
          }, /Dangerous property access blocked: '__proto__'/);
          
          assert.throws(() => {
            const constructor = deps.constructor;
          }, /Dangerous property access blocked: 'constructor'/);
          
          assert.throws(() => {
            const prototype = deps.prototype;
          }, /Dangerous property access blocked: 'prototype'/);
        }
      }

      container.singleton(DangerousService);
      container.resolve('dangerousService');
    });

    it('should prevent memory exhaustion with service limits', () => {
      const limitedContainer = createContainer({ maxServices: 2 });
      
      limitedContainer.value('service1', 1);
      limitedContainer.value('service2', 2);
      
      assert.throws(() => {
        limitedContainer.value('service3', 3);
      }, /Memory limit exceeded for services. Max: 2/);
    });

    it('should prevent memory exhaustion with hook limits', () => {
      const limitedContainer = createContainer({ maxHooksPerEvent: 2 });
      
      limitedContainer.hook('beforeCreate', () => {});
      limitedContainer.hook('beforeCreate', () => {});
      
      assert.throws(() => {
        limitedContainer.hook('beforeCreate', () => {});
      }, /Hook limit exceeded. Max: 2 hooks per event/);
    });

    it('should support hook cleanup', () => {
      container.hook('beforeCreate', () => {});
      container.hook('beforeCreate', () => {});
      
      assert.strictEqual(container._hooks.beforeCreate.length, 2);
      
      container.clearHooks('beforeCreate');
      assert.strictEqual(container._hooks.beforeCreate.length, 0);
    });

  });

  describe('✅ Input Validation', () => {

    it('should validate service names', () => {
      assert.throws(() => {
        container.value('', 'test');
      }, /Service name must be a non-empty string/);
      
      assert.throws(() => {
        container.value(null, 'test');
      }, /Service name must be a non-empty string/);
    });

    it('should validate factory functions', () => {
      assert.throws(() => {
        container.factory('test', 'not-a-function');
      }, /Factory must be a function/);
    });

    it('should validate scope names', () => {
      assert.throws(() => {
        container.createScope('');
      }, /Scope name must be a non-empty string/);
      
      assert.throws(() => {
        container.createScope(null);
      }, /Scope name must be a non-empty string/);
    });

    it('should prevent duplicate scope names', () => {
      container.createScope('testScope');
      
      assert.throws(() => {
        container.createScope('testScope');
      }, /Scope 'testScope' already exists/);
    });

    it('should validate hook parameters', () => {
      assert.throws(() => {
        container.hook('', () => {});
      }, /Hook event must be a non-empty string/);
      
      assert.throws(() => {
        container.hook('test', 'not-a-function');
      }, /Hook callback must be a function/);
    });

    it('should validate tags', () => {
      assert.throws(() => {
        container.register(class Test {}, 'test').withTag('');
      }, /Tag must be a non-empty string/);
      
      assert.throws(() => {
        container.register(class Test {}, 'test').withTag(null);
      }, /Tag must be a non-empty string/);
    });

  });

  describe('🔍 Tag-based Service Discovery', () => {

    beforeEach(() => {
      // Register services with various tags for testing
      container.register(class PaymentService {}, 'paymentService')
        .withTag('payment')
        .withTag('service')
        .withTag('core')
        .asSingleton();

      container.register(class EmailService {}, 'emailService')
        .withTag('email')
        .withTag('service')
        .withTag('notification')
        .asSingleton();

      container.register(class DatabaseRepository {}, 'databaseRepository')
        .withTag('repository')
        .withTag('database')
        .withTag('persistence')
        .asSingleton();

      container.register(class ApiRepository {}, 'apiRepository')
        .withTag('repository')
        .withTag('api')
        .withTag('external')
        .asSingleton();
    });

    it('should get services by tags with AND mode', () => {
      const results = container.getServicesByTags(['service', 'payment']);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, 'paymentService');
      assert.strictEqual(results[0].tags.includes('payment'), true);
      assert.strictEqual(results[0].tags.includes('service'), true);
    });

    it('should get services by tags with OR mode', () => {
      const results = container.getServicesByTags(['payment', 'email'], 'OR');
      
      assert.strictEqual(results.length, 2);
      const names = results.map(r => r.name);
      assert.strictEqual(names.includes('paymentService'), true);
      assert.strictEqual(names.includes('emailService'), true);
    });

    it('should get service names by tags', () => {
      const names = container.getServiceNamesByTags(['repository']);
      
      assert.strictEqual(names.length, 2);
      assert.strictEqual(names.includes('databaseRepository'), true);
      assert.strictEqual(names.includes('apiRepository'), true);
    });

    it('should resolve services by tags', () => {
      const resolved = container.resolveServicesByTags(['service']);
      
      assert.strictEqual(resolved.length, 2);
      assert.strictEqual(typeof resolved[0].instance, 'object');
      assert.strictEqual(typeof resolved[0].name, 'string');
      assert.strictEqual(Array.isArray(resolved[0].tags), true);
    });

    it('should get all unique tags', () => {
      const allTags = container.getAllTags();
      
      assert.strictEqual(allTags.includes('payment'), true);
      assert.strictEqual(allTags.includes('service'), true);
      assert.strictEqual(allTags.includes('repository'), true);
      assert.strictEqual(allTags.includes('database'), true);
      assert.strictEqual(allTags.includes('api'), true);
      
      // Check if sorted
      const sorted = [...allTags].sort();
      assert.deepStrictEqual(allTags, sorted);
    });

    it('should get services grouped by tag', () => {
      const grouped = container.getServicesByTag();
      
      assert.strictEqual(grouped.service.includes('paymentService'), true);
      assert.strictEqual(grouped.service.includes('emailService'), true);
      assert.strictEqual(grouped.repository.includes('databaseRepository'), true);
      assert.strictEqual(grouped.repository.includes('apiRepository'), true);
    });

    it('should validate tag search parameters', () => {
      assert.throws(() => {
        container.getServicesByTags('not-array');
      }, /Tags must be an array/);

      assert.throws(() => {
        container.getServicesByTags([]);
      }, /At least one tag must be provided/);

      assert.throws(() => {
        container.getServicesByTags(['test'], 'INVALID');
      }, /Mode must be 'AND' or 'OR'/);
    });

    it('should handle no matches gracefully', () => {
      const results = container.getServicesByTags(['nonexistent']);
      assert.strictEqual(results.length, 0);
    });

    it('should work with scoped services', () => {
      // Register a scoped service with tags
      container.register(class ScopedTaggedService {
        constructor({}) {
          this.id = Math.random();
        }
      }, 'scopedTaggedService')
        .withTag('scoped')
        .withTag('test')
        .asScoped();

      const scope = container.createScope('testScope');
      
      // Resolve services by tags within scope
      const resolved = container.resolveServicesByTags(['scoped'], 'AND', 'testScope');
      assert.strictEqual(resolved.length, 1);
      assert.strictEqual(resolved[0].name, 'scopedTaggedService');
      
      // Verify it's the same instance within scope
      const instance1 = scope.resolve('scopedTaggedService');
      const instance2 = scope.resolve('scopedTaggedService');
      assert.strictEqual(instance1.id, instance2.id);
      
      scope.dispose();
    });

    it('should handle complex tag combinations', () => {
      // Register services with overlapping tags
      container.register(class ServiceA {}, 'serviceA')
        .withTag('layer1')
        .withTag('feature1')
        .withTag('env1')
        .asSingleton();

      container.register(class ServiceB {}, 'serviceB')
        .withTag('layer1')
        .withTag('feature2')
        .withTag('env1')
        .asSingleton();

      container.register(class ServiceC {}, 'serviceC')
        .withTag('layer2')
        .withTag('feature1')
        .withTag('env2')
        .asSingleton();

      // Test complex AND queries
      const layer1Env1 = container.getServicesByTags(['layer1', 'env1'], 'AND');
      assert.strictEqual(layer1Env1.length, 2);

      const feature1Only = container.getServicesByTags(['feature1'], 'AND');
      assert.strictEqual(feature1Only.length, 2);

      // Test complex OR queries
      const multiLayer = container.getServicesByTags(['layer1', 'layer2'], 'OR');
      assert.strictEqual(multiLayer.length, 3);

      const specificFeatures = container.getServicesByTags(['feature1', 'feature2'], 'OR');
      assert.strictEqual(specificFeatures.length, 3);
    });

    it('should handle empty tag sets correctly', () => {
      const allTags = container.getAllTags();
      const grouped = container.getServicesByTag();
      
      // Clear container and verify empty state
      container.clear();
      
      const emptyTags = container.getAllTags();
      const emptyGrouped = container.getServicesByTag();
      
      assert.strictEqual(emptyTags.length, 0);
      assert.deepStrictEqual(emptyGrouped, {});
    });

    it('should maintain tag information in service metadata', () => {
      const services = container.getServicesByTags(['service'], 'AND');
      
      services.forEach(service => {
        assert.strictEqual(typeof service.name, 'string');
        assert.strictEqual(Array.isArray(service.tags), true);
        assert.strictEqual(typeof service.lifecycle, 'string');
        assert.strictEqual(typeof service.factory, 'boolean');
        assert.strictEqual(service.service !== null, true);
      });
    });

    it('should work with factory services', () => {
      // Register a factory service with tags
      container.factory('factoryTaggedService', ({}) => {
        return { type: 'factory', id: Math.random() };
      })
        .withTag('factory')
        .withTag('dynamic')
        .asSingleton();

      const factoryServices = container.getServicesByTags(['factory'], 'AND');
      assert.strictEqual(factoryServices.length, 1);
      assert.strictEqual(factoryServices[0].factory, true);

      const resolved = container.resolveServicesByTags(['factory'], 'AND');
      assert.strictEqual(resolved[0].instance.type, 'factory');
    });

    it('should handle case sensitivity correctly', () => {
      container.register(class CaseService {}, 'caseService')
        .withTag('CamelCase')
        .withTag('lowercase')
        .withTag('UPPERCASE')
        .asSingleton();

      // Tags should be case-sensitive
      const camelCase = container.getServicesByTags(['CamelCase'], 'AND');
      const wrongCase = container.getServicesByTags(['camelcase'], 'AND');
      
      assert.strictEqual(camelCase.length, 1);
      assert.strictEqual(wrongCase.length, 0);
      
      const allTags = container.getAllTags();
      assert.strictEqual(allTags.includes('CamelCase'), true);
      assert.strictEqual(allTags.includes('lowercase'), true);
      assert.strictEqual(allTags.includes('UPPERCASE'), true);
    });

    it('should handle services with many tags efficiently', () => {
      // Test performance with many tags
      const manyTags = [];
      for (let i = 0; i < 50; i++) {
        manyTags.push(`tag${i}`);
      }

      let builder = container.register(class ManyTagsService {}, 'manyTagsService');
      manyTags.forEach(tag => {
        builder = builder.withTag(tag);
      });
      builder.asSingleton();

      // Test retrieval
      const services = container.getServicesByTags(['tag0', 'tag25', 'tag49'], 'AND');
      assert.strictEqual(services.length, 1);
      assert.strictEqual(services[0].tags.length, 50);

      const allTags = container.getAllTags();
      assert.strictEqual(allTags.length >= 50, true);
    });

    it('should handle 50+ services with 100+ tags efficiently (Performance Test)', () => {
      // Create a clean container for performance testing
      const perfContainer = createContainer();
      const startTime = Date.now();
      
      // Register 50+ services with multiple tags each to reach 100+ unique tags
      for (let i = 0; i < 55; i++) {
        const serviceClass = class {
          constructor({}) {
            this.id = i;
          }
        };
        Object.defineProperty(serviceClass, 'name', { value: `Service${i}` });
        
        let builder = perfContainer.register(serviceClass, `service${i}`);
        
        // Add multiple unique tags per service to ensure 100+ total
        builder = builder.withTag(`category${i % 10}`);      // 10 unique category tags
        builder = builder.withTag(`type${i % 15}`);          // 15 unique type tags  
        builder = builder.withTag(`level${i % 8}`);          // 8 unique level tags
        builder = builder.withTag(`env${i % 5}`);            // 5 unique env tags
        if (i % 3 === 0) builder = builder.withTag(`special${i}`);  // ~18 special tags
        if (i % 2 === 0) builder = builder.withTag(`even${i}`);     // ~27 even tags
        builder = builder.withTag(`service${i}`);            // 55 unique service tags
        
        builder.asSingleton();
      }
      
      const registrationTime = Date.now() - startTime;
      
      // Verify we have 50+ services
      const serviceNames = perfContainer.getServiceNames();
      assert.strictEqual(serviceNames.length >= 50, true);
      
      // Verify we have 100+ unique tags
      const allTags = perfContainer.getAllTags();
      const hasEnoughTags = allTags.length >= 100;
      
      // Test tag discovery performance
      const discoveryStartTime = Date.now();
      
      // Test various tag queries
      const categoryServices = perfContainer.getServicesByTags(['category0'], 'AND');
      const typeServices = perfContainer.getServicesByTags(['type0'], 'AND');
      const complexQuery = perfContainer.getServicesByTags(['category1', 'type2'], 'OR');
      const resolvedServices = perfContainer.resolveServicesByTags(['category0'], 'AND');
      
      const discoveryTime = Date.now() - discoveryStartTime;
      
      console.log(`📊 Performance Test Results:
        - Services registered: ${serviceNames.length}
        - Unique tags: ${allTags.length}
        - Registration time: ${registrationTime}ms
        - Discovery time: ${discoveryTime}ms`);
      
      // Performance assertions - should complete quickly
      assert.strictEqual(registrationTime < 1000, true, 'Registration should be fast');
      assert.strictEqual(discoveryTime < 100, true, 'Tag discovery should be fast');
      
      // Scale assertions
      assert.strictEqual(serviceNames.length, 55, 'Should have exactly 55 services');
      assert.strictEqual(hasEnoughTags, true, `Should have 100+ tags, got ${allTags.length}`);
      
      // Functional assertions
      assert.strictEqual(categoryServices.length > 0, true);
      assert.strictEqual(typeServices.length > 0, true);
      assert.strictEqual(complexQuery.length > 0, true);
      assert.strictEqual(resolvedServices.length > 0, true);
    });

    it('should support tag-based service override scenarios', () => {
      // Use a clean container for this test
      const cleanContainer = createContainer();
      
      // Register original service
      cleanContainer.register(class OriginalTaggedService {
        getValue() { return 'original'; }
      }, 'taggedService')
        .withTag('version1')
        .withTag('service')
        .asSingleton();

      // Override with new version
      cleanContainer.register(class UpdatedTaggedService {
        getValue() { return 'updated'; }
      }, 'taggedService')
        .withTag('version2')
        .withTag('service')
        .override()
        .asSingleton();

      const services = cleanContainer.getServicesByTags(['service'], 'AND');
      assert.strictEqual(services.length, 1);
      assert.strictEqual(services[0].tags.includes('version2'), true);
      assert.strictEqual(services[0].tags.includes('version1'), false);

      const resolved = cleanContainer.resolve('taggedService');
      assert.strictEqual(resolved.getValue(), 'updated');
    });

  });

  describe('🎯 Advanced Tag Integration Tests', () => {

    it('should support plugin architecture pattern', () => {
      // Register plugin interfaces
      class EmailPlugin {
        getName() { return 'email'; }
        send(message) { return `Email: ${message}`; }
      }

      class SmsPlugin {
        getName() { return 'sms'; }
        send(message) { return `SMS: ${message}`; }
      }

      class PushPlugin {
        getName() { return 'push'; }
        send(message) { return `Push: ${message}`; }
      }

      // Register plugins with tags
      container.register(EmailPlugin, 'emailPlugin')
        .withTag('plugin')
        .withTag('notification')
        .withTag('email')
        .asSingleton();

      container.register(SmsPlugin, 'smsPlugin')
        .withTag('plugin')
        .withTag('notification')
        .withTag('mobile')
        .asSingleton();

      container.register(PushPlugin, 'pushPlugin')
        .withTag('plugin')
        .withTag('notification')
        .withTag('mobile')
        .asSingleton();

      // Plugin manager that discovers plugins
      class PluginManager {
        constructor(container) {
          this.container = container;
          this.plugins = new Map();
        }

        loadPlugins() {
          const plugins = this.container.resolveServicesByTags(['plugin'], 'AND');
          plugins.forEach(plugin => {
            this.plugins.set(plugin.instance.getName(), plugin.instance);
          });
          return this.plugins.size;
        }

        getMobilePlugins() {
          const mobilePlugins = this.container.resolveServicesByTags(['mobile', 'plugin'], 'AND');
          return mobilePlugins.map(p => p.instance);
        }
      }

      const pluginManager = new PluginManager(container);
      const loadedCount = pluginManager.loadPlugins();
      const mobilePlugins = pluginManager.getMobilePlugins();

      assert.strictEqual(loadedCount, 3);
      assert.strictEqual(mobilePlugins.length, 2);
      assert.strictEqual(mobilePlugins.some(p => p.getName() === 'sms'), true);
      assert.strictEqual(mobilePlugins.some(p => p.getName() === 'push'), true);
    });

    it('should support environment-based service selection', () => {
      // Development services
      class DevLogger {
        log(msg) { return `DEV: ${msg}`; }
      }

      class DevDatabase {
        connect() { return 'dev-db-connection'; }
      }

      // Production services
      class ProdLogger {
        log(msg) { return `PROD: ${msg}`; }
      }

      class ProdDatabase {
        connect() { return 'prod-db-connection'; }
      }

      // Register with environment tags
      container.register(DevLogger, 'devLogger')
        .withTag('logger')
        .withTag('development')
        .asSingleton();

      container.register(DevDatabase, 'devDatabase')
        .withTag('database')
        .withTag('development')
        .asSingleton();

      container.register(ProdLogger, 'prodLogger')
        .withTag('logger')
        .withTag('production')
        .asSingleton();

      container.register(ProdDatabase, 'prodDatabase')
        .withTag('database')
        .withTag('production')
        .asSingleton();

      // Environment manager
      class EnvironmentManager {
        constructor(container, environment) {
          this.container = container;
          this.environment = environment;
        }

        getServices() {
          return this.container.resolveServicesByTags([this.environment], 'AND');
        }

        getLogger() {
          const loggers = this.container.getServicesByTags(['logger', this.environment], 'AND');
          return loggers.length > 0 ? this.container.resolve(loggers[0].name) : null;
        }
      }

      const devManager = new EnvironmentManager(container, 'development');
      const prodManager = new EnvironmentManager(container, 'production');

      const devServices = devManager.getServices();
      const prodServices = prodManager.getServices();

      assert.strictEqual(devServices.length, 2);
      assert.strictEqual(prodServices.length, 2);

      const devLogger = devManager.getLogger();
      const prodLogger = prodManager.getLogger();

      assert.strictEqual(devLogger.log('test'), 'DEV: test');
      assert.strictEqual(prodLogger.log('test'), 'PROD: test');
    });

    it('should support layered architecture pattern', () => {
      // Data layer
      class UserRepository {
        findAll() { return ['user1', 'user2']; }
      }

      class OrderRepository {
        findAll() { return ['order1', 'order2']; }
      }

      // Service layer
      class UserService {
        constructor({ userRepository }) {
          this.userRepository = userRepository;
        }
        getUsers() { return this.userRepository.findAll(); }
      }

      class OrderService {
        constructor({ orderRepository }) {
          this.orderRepository = orderRepository;
        }
        getOrders() { return this.orderRepository.findAll(); }
      }

      // Controller layer
      class UserController {
        constructor({ userService }) {
          this.userService = userService;
        }
        handleRequest() { return this.userService.getUsers(); }
      }

      // Register with layer tags
      container.register(UserRepository, 'userRepository')
        .withTag('repository')
        .withTag('data-layer')
        .asSingleton();

      container.register(OrderRepository, 'orderRepository')
        .withTag('repository')
        .withTag('data-layer')
        .asSingleton();

      container.register(UserService, 'userService')
        .withTag('service')
        .withTag('business-layer')
        .asSingleton();

      container.register(OrderService, 'orderService')
        .withTag('service')
        .withTag('business-layer')
        .asSingleton();

      container.register(UserController, 'userController')
        .withTag('controller')
        .withTag('presentation-layer')
        .asSingleton();

      // Architecture analyzer
      class ArchitectureAnalyzer {
        constructor(container) {
          this.container = container;
        }

        getLayerServices(layer) {
          return this.container.getServicesByTags([layer], 'AND');
        }

        validateArchitecture() {
          const dataLayer = this.getLayerServices('data-layer');
          const businessLayer = this.getLayerServices('business-layer');
          const presentationLayer = this.getLayerServices('presentation-layer');

          return {
            dataLayer: dataLayer.length,
            businessLayer: businessLayer.length,
            presentationLayer: presentationLayer.length,
            totalServices: dataLayer.length + businessLayer.length + presentationLayer.length
          };
        }
      }

      const analyzer = new ArchitectureAnalyzer(container);
      const architecture = analyzer.validateArchitecture();

      assert.strictEqual(architecture.dataLayer, 2);
      assert.strictEqual(architecture.businessLayer, 2);
      assert.strictEqual(architecture.presentationLayer, 1);
      assert.strictEqual(architecture.totalServices, 5);

      // Test actual functionality
      const userController = container.resolve('userController');
      const users = userController.handleRequest();
      assert.deepStrictEqual(users, ['user1', 'user2']);
    });

    it('should handle tag-based conditional loading', () => {
      // Feature flags simulation
      const features = {
        caching: true,
        monitoring: false,
        analytics: true
      };

      class CacheService {
        get() { return 'cached-data'; }
      }

      class MonitoringService {
        track() { return 'tracking'; }
      }

      class AnalyticsService {
        record() { return 'recorded'; }
      }

      // Register services with feature tags
      container.register(CacheService, 'cacheService')
        .withTag('feature')
        .withTag('caching')
        .when(() => features.caching)
        .asSingleton();

      container.register(MonitoringService, 'monitoringService')
        .withTag('feature')
        .withTag('monitoring')
        .when(() => features.monitoring)
        .asSingleton();

      container.register(AnalyticsService, 'analyticsService')
        .withTag('feature')
        .withTag('analytics')
        .when(() => features.analytics)
        .asSingleton();

      // Feature manager
      class FeatureManager {
        constructor(container) {
          this.container = container;
        }

        getEnabledFeatures() {
          const allFeatures = this.container.getServicesByTags(['feature'], 'AND');
          return allFeatures.filter(service => {
            try {
              this.container.resolve(service.name);
              return true;
            } catch {
              return false;
            }
          });
        }
      }

      const featureManager = new FeatureManager(container);
      const enabledFeatures = featureManager.getEnabledFeatures();

      // Should have caching and analytics (monitoring is disabled)
      assert.strictEqual(enabledFeatures.length, 2);
      
      const featureNames = enabledFeatures.map(f => f.name);
      assert.strictEqual(featureNames.includes('cacheService'), true);
      assert.strictEqual(featureNames.includes('analyticsService'), true);
      assert.strictEqual(featureNames.includes('monitoringService'), false);
    });

  });

});