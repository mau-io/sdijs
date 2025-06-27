import { createContainer } from '../../index.js';

/**
 * 🎯 SDIJS Basic Decorator Usage
 * 
 * This example shows the simplest way to use decorators in SDIJS:
 * 1. Create decorator services
 * 2. Register them in the container
 * 3. Apply them to your services
 * 
 * Perfect for getting started with decorators!
 */

// ============ BASIC SERVICE ============

class UserService {
  async getUser(id) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      createdAt: new Date().toISOString()
    };
  }
}

// ============ SIMPLE DECORATORS ============

class LoggingDecorator {
  decorate(serviceInstance) {
    return {
      ...serviceInstance, // ✅ Keep all original properties
      getUser: async (id) => {
        console.log(`📝 Calling getUser(${id})`);
        const result = await serviceInstance.getUser(id);
        console.log(`✅ getUser(${id}) completed`);
        return result;
      }
    };
  }
}

class TimingDecorator {
  decorate(serviceInstance) {
    return {
      ...serviceInstance, // ✅ Keep all original properties
      getUser: async (id) => {
        const start = Date.now();
        const result = await serviceInstance.getUser(id);
        const duration = Date.now() - start;
        console.log(`⏱️ getUser(${id}) took ${duration}ms`);
        return result;
      }
    };
  }
}

// ============ SETUP ============

const container = createContainer({ verbose: true });

// Register decorators
container
  .register(LoggingDecorator, 'loggingDecorator').asSingleton()
  .register(TimingDecorator, 'timingDecorator').asSingleton();

// ============ EXAMPLE 1: Single Decorator ============

console.log('🎯 Example 1: Single Decorator\n');

container
  .register(UserService, 'userServiceWithLogging')
  .decorateWith(['loggingDecorator'])
  .asSingleton();

const userWithLogging = container.resolve('userServiceWithLogging');
await userWithLogging.getUser(123);

console.log('');

// ============ EXAMPLE 2: Multiple Decorators ============

console.log('🎯 Example 2: Multiple Decorators (Order Matters)\n');

container
  .register(UserService, 'userServiceWithBoth')
  .decorateWith(['loggingDecorator', 'timingDecorator']) // Logging first, then timing
  .asSingleton();

const userWithBoth = container.resolve('userServiceWithBoth');
await userWithBoth.getUser(456);

console.log('');

// ============ EXAMPLE 3: Custom Function Decorator ============

console.log('🎯 Example 3: Custom Function Decorator\n');

const cacheDecorator = (serviceInstance) => {
  const cache = new Map();
  
  return {
    ...serviceInstance,
    getUser: async (id) => {
      // Check cache first
      if (cache.has(id)) {
        console.log(`💾 Cache HIT for user ${id}`);
        return cache.get(id);
      }
      
      // Call original method
      console.log(`💾 Cache MISS for user ${id}`);
      const result = await serviceInstance.getUser(id);
      
      // Store in cache
      cache.set(id, result);
      return result;
    }
  };
};

container
  .register(UserService, 'userServiceWithCache')
  .decorate(cacheDecorator) // Custom function decorator
  .decorateWith(['timingDecorator']) // Plus service decorator
  .asSingleton();

const userWithCache = container.resolve('userServiceWithCache');

// First call - cache miss
await userWithCache.getUser(789);

// Second call - cache hit
await userWithCache.getUser(789);

console.log('');

// ============ SUMMARY ============

console.log('📚 Summary:');
console.log('');
console.log('✅ Three ways to apply decorators:');
console.log('   1. Single decorator: .decorateWith([\'decoratorName\'])');
console.log('   2. Multiple decorators: .decorateWith([\'first\', \'second\'])');
console.log('   3. Custom functions: .decorate(functionDecorator)');
console.log('');
console.log('🔑 Key Points:');
console.log('   • Decorators are services with decorate() method');
console.log('   • Always use { ...serviceInstance } to preserve interface');
console.log('   • Order matters: first decorator wraps the original, second wraps the first');
console.log('   • Mix service decorators and function decorators freely');
console.log('');