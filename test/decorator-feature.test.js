import { createContainer } from '../index.js';
import { strict as assert } from 'assert';

describe('Decorator Feature Tests', () => {
  let container;

  beforeEach(() => {
    container = createContainer({ verbose: false });
  });

  describe('Basic Decorator Functionality', () => {
    // Mock services for testing
    class TestService {
      execute(params) {
        return `TestService executed with ${JSON.stringify(params)}`;
      }
    }

    class CacheDecorator {
      constructor({ cache }) {
        this.cache = cache;
      }

      decorate(service) {
        return {
          execute: (params) => {
            const key = JSON.stringify(params);
            if (this.cache.has(key)) {
              return this.cache.get(key);
            }
            const result = service.execute(params);
            this.cache.set(key, result);
            return result;
          }
        };
      }
    }

    class LoggingDecorator {
      constructor({ logger }) {
        this.logger = logger;
      }

      decorate(service) {
        return {
          execute: (params) => {
            this.logger.log('Before execution');
            const result = service.execute(params);
            this.logger.log('After execution');
            return result;
          }
        };
      }
    }

    // Mock dependencies
    class MockCache {
      constructor() {
        this.storage = new Map();
      }
      get(key) { return this.storage.get(key); }
      set(key, value) { this.storage.set(key, value); }
      has(key) { return this.storage.has(key); }
    }

    class MockLogger {
      constructor() {
        this.logs = [];
      }
      log(message) { this.logs.push(message); }
    }

    it('should decorate service with single decorator', () => {
      const cache = new MockCache();
      
      container
        .register(MockCache, 'cache').asValue()
        .register(CacheDecorator, 'cacheDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['cacheDecorator'])
        .asSingleton();

      container._services.get('cache').implementation = cache;

      const service = container.resolve('testService');
      
      // First call - should execute and cache
      const result1 = service.execute({ test: 'data' });
      assert.equal(result1, 'TestService executed with {"test":"data"}');
      
      // Second call - should return cached result
      const result2 = service.execute({ test: 'data' });
      assert.equal(result2, result1);
      assert.ok(cache.has('{"test":"data"}'));
    });

    it('should decorate service with multiple decorators in order', () => {
      const cache = new MockCache();
      const logger = new MockLogger();
      
      container
        .register(MockCache, 'cache').asValue()
        .register(MockLogger, 'logger').asValue()
        .register(CacheDecorator, 'cacheDecorator').asSingleton()
        .register(LoggingDecorator, 'loggingDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['cacheDecorator', 'loggingDecorator'])
        .asSingleton();

      container._services.get('cache').implementation = cache;
      container._services.get('logger').implementation = logger;

      const service = container.resolve('testService');
      service.execute({ test: 'data' });
      
      assert.equal(logger.logs.length, 2);
      assert.equal(logger.logs[0], 'Before execution');
      assert.equal(logger.logs[1], 'After execution');
    });

    it('should support custom decorator functions', () => {
      const customDecorator = (service) => ({
        execute: (params) => {
          const result = service.execute(params);
          return `CUSTOM: ${result}`;
        }
      });

      container
        .register(TestService, 'testService')
        .decorate(customDecorator)
        .asSingleton();

      const service = container.resolve('testService');
      const result = service.execute({ test: 'data' });
      
      assert.equal(result, 'CUSTOM: TestService executed with {"test":"data"}');
    });

    it('should support mixed decorator types', () => {
      const cache = new MockCache();
      const customDecorator = (service) => ({
        execute: (params) => `CUSTOM: ${service.execute(params)}`
      });

      container
        .register(MockCache, 'cache').asValue()
        .register(CacheDecorator, 'cacheDecorator').asSingleton()
        .register(TestService, 'testService')
        .decorateWith(['cacheDecorator'])
        .decorate(customDecorator)
        .asSingleton();

      container._services.get('cache').implementation = cache;

      const service = container.resolve('testService');
      const result = service.execute({ test: 'data' });
      
      assert.ok(result.startsWith('CUSTOM:'));
    });
  });

  describe('Batch Registration', () => {
    class ServiceA {
      getName() { return 'ServiceA'; }
    }

    class ServiceB {
      getName() { return 'ServiceB'; }
    }

    class ServiceC {
      getName() { return 'ServiceC'; }
    }

    class TestDecorator {
      decorate(service) {
        return {
          getName: () => `Decorated ${service.getName()}`
        };
      }
    }

    it('should register services in batch without decorators', () => {
      const serviceConfigs = [
        { class: ServiceA, name: 'serviceA' },
        { class: ServiceB, name: 'serviceB', lifecycle: 'transient' },
        { class: ServiceC }  // Should auto-infer name
      ];

      container
        .batchRegister(serviceConfigs);

      assert.ok(container.has('serviceA'));
      assert.ok(container.has('serviceB'));
      assert.ok(container.has('serviceC'));

      const serviceA = container.resolve('serviceA');
      assert.equal(serviceA.getName(), 'ServiceA');
    });

    it('should register services in batch with decorators', () => {
      const serviceConfigs = [
        { 
          class: ServiceA, 
          name: 'serviceA', 
          decorators: ['testDecorator'] 
        },
        { 
          class: ServiceB, 
          name: 'serviceB',
          decorators: ['testDecorator'],
          lifecycle: 'transient'
        }
      ];

      container
        .register(TestDecorator, 'testDecorator').asSingleton()
        .batchRegister(serviceConfigs);

      const serviceA = container.resolve('serviceA');
      const serviceB = container.resolve('serviceB');
      
      assert.equal(serviceA.getName(), 'Decorated ServiceA');
      assert.equal(serviceB.getName(), 'Decorated ServiceB');
    });

    it('should register services with custom decorators in batch', () => {
      const customDecorator = (service) => ({
        getName: () => `Custom ${service.getName()}`
      });

      const serviceConfigs = [
        { 
          class: ServiceA, 
          name: 'serviceA', 
          customDecorators: [customDecorator]
        }
      ];

      container.batchRegister(serviceConfigs);

      const serviceA = container.resolve('serviceA');
      assert.equal(serviceA.getName(), 'Custom ServiceA');
    });

    it('should handle batch registration errors gracefully', () => {
      assert.throws(() => {
        container.batchRegister('not an array');
      }, /batchRegister requires an array/);

      assert.throws(() => {
        container.batchRegister([{ name: 'test' }]); // Missing class
      }, /must have a "class" property/);

      assert.throws(() => {
        container.batchRegister([
          { class: ServiceA, lifecycle: 'invalid' }
        ]);
      }, /Unknown lifecycle: invalid/);
    });
  });

  describe('Decorator Error Handling', () => {
    class TestService {
      execute() { return 'test'; }
    }

    it('should throw error for invalid decorator service', () => {
      container
        .register(TestService, 'testService')
        .decorateWith(['nonExistentDecorator'])
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /Service 'nonExistentDecorator' not found/);
    });

    it('should throw error for decorator without decorate method', () => {
      class InvalidDecorator {
        // Missing decorate method
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

    it('should throw error for invalid decorator function', () => {
      assert.throws(() => {
        container
          .register(TestService, 'testService')
          .decorate('not a function')
          .asSingleton();
      }, /Decorator must be a function/);
    });

    it('should throw error when decorator function fails', () => {
      const failingDecorator = () => {
        throw new Error('Decorator failed');
      };

      container
        .register(TestService, 'testService')
        .decorate(failingDecorator)
        .asSingleton();

      assert.throws(() => {
        container.resolve('testService');
      }, /Failed to apply custom decorator.*Decorator failed/);
    });
  });

  describe('Integration with Existing Features', () => {
    class TaggedService {
      execute() { return 'tagged'; }
    }

    class ConditionalService {
      execute() { return 'conditional'; }
    }

    class TestDecorator {
      decorate(service) {
        return {
          execute: () => `Decorated ${service.execute()}`
        };
      }
    }

    it('should work with tags', () => {
      container
        .register(TestDecorator, 'testDecorator').asSingleton()
        .register(TaggedService, 'taggedService')
        .decorateWith(['testDecorator'])
        .withTag('performance')
        .asSingleton();

      const services = container.getServicesByTags(['performance']);
      assert.equal(services.length, 1);

      const service = container.resolve('taggedService');
      assert.equal(service.execute(), 'Decorated tagged');
    });

    it('should work with conditions', () => {
      let shouldRegister = true;

      container
        .register(TestDecorator, 'testDecorator').asSingleton()
        .register(ConditionalService, 'conditionalService')
        .decorateWith(['testDecorator'])
        .when(() => shouldRegister)
        .asSingleton();

      assert.ok(container.has('conditionalService'));
      
      const service = container.resolve('conditionalService');
      assert.equal(service.execute(), 'Decorated conditional');
    });

    it('should work with scoped services', () => {
      container
        .register(TestDecorator, 'testDecorator').asSingleton()
        .register(TaggedService, 'scopedService')
        .decorateWith(['testDecorator'])
        .asScoped()
        .createScope('testScope');

      const scope = container.scope('testScope');
      const service = scope.resolve('scopedService');
      
      assert.equal(service.execute(), 'Decorated tagged');
    });
  });

  describe('Real-world Example Migration', () => {
    // Simulate your current decorator functions
    function addCacheToUseCase(UseCaseClass, cache) {
      return class extends UseCaseClass {
        constructor(...args) {
          super(...args);
          this.cache = cache;
        }

        async execute(params) {
          const key = JSON.stringify(params);
          if (this.cache.has(key)) {
            return this.cache.get(key);
          }
          const result = await super.execute(params);
          this.cache.set(key, result);
          return result;
        }
      };
    }

    function addTimingToUseCase(UseCaseClass, logger) {
      return class extends UseCaseClass {
        constructor(...args) {
          super(...args);
          this.logger = logger;
        }

        async execute(params) {
          const start = Date.now();
          const result = await super.execute(params);
          const duration = Date.now() - start;
          this.logger.log(`Executed in ${duration}ms`);
          return result;
        }
      };
    }

    // Your use cases
    class ViewUseCase {
      async execute(params) {
        return `View result for ${JSON.stringify(params)}`;
      }
    }

    class TextualSearchUseCase {
      async execute(params) {
        return `Search result for ${JSON.stringify(params)}`;
      }
    }

    it('should migrate from current decorator system', async () => {
      // Mock dependencies
      const cache = new Map();
      const logger = { logs: [], log(msg) { this.logs.push(msg); } };

      // Create decorator services that work with INSTANCES, not classes
      class CacheDecoratorService {
        constructor({ cache }) {
          this.cache = cache;
        }

        decorate(serviceInstance) {
          // Wrap the instance, not extend the class
          const originalExecute = serviceInstance.execute.bind(serviceInstance);
          return {
            ...serviceInstance,
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

      class TimingDecoratorService {
        constructor({ logger }) {
          this.logger = logger;
        }

        decorate(serviceInstance) {
          // Wrap the instance, not extend the class
          const originalExecute = serviceInstance.execute.bind(serviceInstance);
          return {
            ...serviceInstance,
            execute: async (params) => {
              const start = Date.now();
              const result = await originalExecute(params);
              const duration = Date.now() - start;
              this.logger.log(`Executed in ${duration}ms`);
              return result;
            }
          };
        }
      }

      // Register dependencies and decorators
      container
        .value('cache', cache)
        .value('logger', logger)
        .register(CacheDecoratorService, 'cacheDecorator').asSingleton()
        .register(TimingDecoratorService, 'timingDecorator').asSingleton();

      // Use new decorator system
      const serviceConfigs = [
        {
          class: ViewUseCase,
          name: 'viewUseCase',
          decorators: ['cacheDecorator', 'timingDecorator']
        },
        {
          class: TextualSearchUseCase,
          name: 'textualSearchUseCase', 
          decorators: ['timingDecorator']
        }
      ];

      container.batchRegister(serviceConfigs);

      // Test that it works
      const viewService = container.resolve('viewUseCase');
      const searchService = container.resolve('textualSearchUseCase');

      const viewResult = await viewService.execute({ view: 'test' });
      const searchResult = await searchService.execute({ search: 'test' });

      assert.ok(viewResult.includes('View result'));
      assert.ok(searchResult.includes('Search result'));
      assert.ok(logger.logs.length > 0);
      assert.ok(cache.size > 0);
    });
  });
}); 