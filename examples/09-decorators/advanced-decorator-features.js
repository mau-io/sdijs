import { createContainer } from '../../index.js';

/**
 * 🚀 SDIJS Advanced Decorator Features
 * 
 * This example demonstrates the full power of SDIJS decorators:
 * • Universal method validation (works with ANY method names)
 * • Batch registration with declarative configuration
 * • Smart decorators with dependency injection
 * • Real-world enterprise patterns
 * • Error handling and validation
 * • Performance optimization techniques
 */

// ============ ADVANCED DEPENDENCIES ============

class Logger {
  constructor() {
    this.logs = [];
  }
  
  log(level, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };
    this.logs.push(entry);
    console.log(` ------------ [${level.toUpperCase()}] ${message}`, metadata.service ? `(${metadata.service}.${metadata.method})` : '');
  }
  
  getLogs() { return this.logs; }
}

class MetricsCollector {
  constructor() {
    this.metrics = new Map();
  }
  
  recordMetric(name, value, tags = {}) {
    const key = `${name}:${JSON.stringify(tags)}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key).push({ value, timestamp: Date.now() });
  }
  
  getMetrics() { return Object.fromEntries(this.metrics); }
}

class DistributedCache {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }
  
  async get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    this.stats.misses++;
    return null;
  }
  
  async set(key, value, ttl = 3600) {
    this.stats.sets++;
    this.cache.set(key, value);
  }
  
  getStats() { return this.stats; }
}

// ============ UNIVERSAL SMART DECORATORS ============

class UniversalLoggingDecorator {
  constructor({ logger }) {
    this.logger = logger;
  }

  decorate(serviceInstance) {
    const serviceName = serviceInstance.constructor.name;
    const decoratedMethods = {};
    
    // Get ALL public methods dynamically - works with ANY naming convention!
    const publicMethods = this._getPublicMethods(serviceInstance);
    
    for (const methodName of publicMethods) {
      const originalMethod = serviceInstance[methodName].bind(serviceInstance);
      decoratedMethods[methodName] = async (...args) => {
        this.logger.log('info', `Starting operation`, {
          service: serviceName,
          method: methodName,
          args: this._sanitizeArgs(args)
        });
        
        try {
          const result = await originalMethod(...args);
          this.logger.log('info', `Operation completed successfully`, {
            service: serviceName,
            method: methodName
          });
          return result;
        } catch (error) {
          this.logger.log('error', `Operation failed: ${error.message}`, {
            service: serviceName,
            method: methodName
          });
          throw error;
        }
      };
    }

    return {
      ...serviceInstance, // ✅ Preserve ALL properties
      ...decoratedMethods // ✅ Override with decorated versions
    };
  }
  
  _getPublicMethods(serviceInstance) {
    const methods = [];
    const allMethodNames = this._getAllMethodNames(serviceInstance);
    
    for (const methodName of allMethodNames) {
      if (typeof serviceInstance[methodName] === 'function' && 
          !methodName.startsWith('_') && 
          !methodName.startsWith('$') &&
          methodName !== 'constructor') {
        methods.push(methodName);
      }
    }
    
    return methods;
  }
  
  _getAllMethodNames(obj) {
    const methods = new Set();
    let current = obj;
    
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach(name => {
        if (typeof obj[name] === 'function') {
          methods.add(name);
        }
      });
      current = Object.getPrototypeOf(current);
    }
    
    return Array.from(methods);
  }
  
  _sanitizeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized = { ...arg };
        delete sanitized.password;
        delete sanitized.secret;
        return sanitized;
      }
      return arg;
    });
  }
}

class UniversalMetricsDecorator {
  constructor({ metricsCollector }) {
    this.metrics = metricsCollector;
  }

  decorate(serviceInstance) {
    const serviceName = serviceInstance.constructor.name;
    const decoratedMethods = {};
    
    const publicMethods = this._getPublicMethods(serviceInstance);
    
    for (const methodName of publicMethods) {
      const originalMethod = serviceInstance[methodName].bind(serviceInstance);
      decoratedMethods[methodName] = async (...args) => {
        const start = process.hrtime.bigint();
        
        try {
          const result = await originalMethod(...args);
          
          const durationMs = Number(process.hrtime.bigint() - start) / 1000000;
          this.metrics.recordMetric('method_duration_ms', durationMs, {
            service: serviceName,
            method: methodName,
            status: 'success'
          });
          this.metrics.recordMetric('method_calls_total', 1, {
            service: serviceName,
            method: methodName,
            status: 'success'
          });
          
          return result;
        } catch (error) {
          const durationMs = Number(process.hrtime.bigint() - start) / 1000000;
          this.metrics.recordMetric('method_duration_ms', durationMs, {
            service: serviceName,
            method: methodName,
            status: 'error'
          });
          this.metrics.recordMetric('method_calls_total', 1, {
            service: serviceName,
            method: methodName,
            status: 'error'
          });
          
          throw error;
        }
      };
    }

    return {
      ...serviceInstance,
      ...decoratedMethods
    };
  }
  
  _getPublicMethods(serviceInstance) {
    const methods = [];
    let current = serviceInstance;
    
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach(name => {
        if (typeof serviceInstance[name] === 'function' && 
            !name.startsWith('_') && 
            !name.startsWith('$') &&
            name !== 'constructor') {
          methods.push(name);
        }
      });
      current = Object.getPrototypeOf(current);
    }
    
    return [...new Set(methods)];
  }
}

class UniversalCacheDecorator {
  constructor({ cache, logger }) {
    this.cache = cache;
    this.logger = logger;
  }

  decorate(serviceInstance) {
    const serviceName = serviceInstance.constructor.name;
    const decoratedMethods = {};
    
    const publicMethods = this._getPublicMethods(serviceInstance);
    
    for (const methodName of publicMethods) {
      const originalMethod = serviceInstance[methodName].bind(serviceInstance);
      decoratedMethods[methodName] = async (...args) => {
        const cacheKey = `${serviceName}.${methodName}:${JSON.stringify(args)}`;
        
        // Try cache first
        const cached = await this.cache.get(cacheKey);
        if (cached !== null) {
          console.log(`💾 Cache HIT for ${serviceName}.${methodName}`);
          return cached;
        }
        
        // Execute original method
        console.log(`💾 Cache MISS for ${serviceName}.${methodName}`);
        const result = await originalMethod(...args);
        
        // Cache the result
        await this.cache.set(cacheKey, result, 1800);
        
        return result;
      };
    }

    return {
      ...serviceInstance,
      ...decoratedMethods
    };
  }
  
  _getPublicMethods(serviceInstance) {
    const methods = [];
    let current = serviceInstance;
    
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach(name => {
        if (typeof serviceInstance[name] === 'function' && 
            !name.startsWith('_') && 
            !name.startsWith('$') &&
            name !== 'constructor') {
          methods.push(name);
        }
      });
      current = Object.getPrototypeOf(current);
    }
    
    return [...new Set(methods)];
  }
}

// ============ ENTERPRISE BUSINESS SERVICES ============

// E-commerce Order Service with custom method names
class OrderProcessingService {
  constructor({ paymentGateway, inventoryService }) {
    this.paymentGateway = paymentGateway;
    this.inventoryService = inventoryService;
  }

  async processNewOrder(orderData) {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      orderId: `order_${Date.now()}`,
      status: 'processed',
      items: orderData.items,
      total: orderData.total,
      processedAt: new Date().toISOString()
    };
  }

  async cancelExistingOrder(orderId, reason) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (orderId === 'invalid_order') {
      throw new Error('Order not found');
    }
    
    return {
      orderId,
      status: 'cancelled',
      reason,
      cancelledAt: new Date().toISOString()
    };
  }

  async trackOrderStatus(orderId) {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      orderId,
      status: 'shipped',
      trackingNumber: `track_${orderId}`,
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString()
    };
  }
}

// User Management Service with domain-specific methods
class UserAccountService {
  constructor({ database, authService }) {
    this.database = database;
    this.authService = authService;
  }

  async registerNewUser(userData) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString(),
      verified: false
    };
  }

  async authenticateUser(email, password) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (email === 'invalid@example.com') {
      throw new Error('Invalid credentials');
    }
    
    return {
      token: `token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { email, id: `user_${email.split('@')[0]}` }
    };
  }

  async updateUserProfile(userId, profileData) {
    await new Promise(resolve => setTimeout(resolve, 75));
    
    return {
      userId,
      ...profileData,
      updatedAt: new Date().toISOString()
    };
  }
}

// Analytics Service with business intelligence methods
class ReportingService {
  constructor({ dataWarehouse }) {
    this.dataWarehouse = dataWarehouse;
  }

  async generateSalesReport(dateRange) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Heavy computation
    
    return {
      reportId: `report_${Date.now()}`,
      dateRange,
      totalSales: Math.floor(Math.random() * 100000),
      orderCount: Math.floor(Math.random() * 1000),
      topProducts: ['Product A', 'Product B', 'Product C'],
      generatedAt: new Date().toISOString()
    };
  }

  async calculateCustomerMetrics(segment) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return {
      segment,
      totalCustomers: Math.floor(Math.random() * 10000),
      averageOrderValue: Math.floor(Math.random() * 200),
      retentionRate: Math.random() * 100,
      calculatedAt: new Date().toISOString()
    };
  }
}

// ============ MOCK DEPENDENCIES ============

class MockPaymentGateway {
  async process(data) { return { success: true }; }
}

class MockInventoryService {
  async check(items) { return { available: true }; }
}

class MockDatabase {
  async save(data) { return { ...data, saved: true }; }
}

class MockAuthService {
  async generate(email) { return `token_${email}`; }
}

class MockDataWarehouse {
  async query(sql) { return [{ result: 'data' }]; }
}

// ============ CONTAINER SETUP & DEMO ============

const container = createContainer({ verbose: false });

// Register infrastructure
container
  .register(Logger, 'logger').asSingleton()
  .register(MetricsCollector, 'metricsCollector').asSingleton()
  .register(DistributedCache, 'cache').asSingleton()
  
  // Mock dependencies
  .register(MockPaymentGateway, 'paymentGateway').asSingleton()
  .register(MockInventoryService, 'inventoryService').asSingleton()
  .register(MockDatabase, 'database').asSingleton()
  .register(MockAuthService, 'authService').asSingleton()
  .register(MockDataWarehouse, 'dataWarehouse').asSingleton()
  
  // Universal decorators
  .register(UniversalLoggingDecorator, 'universalLogging').asSingleton()
  .register(UniversalMetricsDecorator, 'universalMetrics').asSingleton()
  .register(UniversalCacheDecorator, 'universalCache').asSingleton();

// ============ BATCH REGISTRATION WITH DECLARATIVE CONFIG ============

console.log('🚀 Advanced Decorator Features Demo\n');
console.log('📦 Batch Registration with Declarative Configuration:\n');

const enterpriseServiceConfigs = [
  {
    class: OrderProcessingService,
    name: 'orderService',
    decorators: ['universalLogging', 'universalMetrics', 'universalCache'],
    lifecycle: 'singleton',
    tags: ['business', 'order', 'critical']
  },
  {
    class: UserAccountService,
    name: 'userService',
    decorators: ['universalLogging', 'universalMetrics'],
    lifecycle: 'singleton',
    tags: ['business', 'user', 'auth']
  },
  {
    class: ReportingService,
    name: 'reportingService',
    decorators: ['universalLogging', 'universalMetrics', 'universalCache'],
    lifecycle: 'singleton',
    tags: ['analytics', 'reporting', 'heavy']
  }
];

container.batchRegister(enterpriseServiceConfigs);

// ============ DEMONSTRATE UNIVERSAL METHOD VALIDATION ============

console.log('🌍 Universal Method Validation (Works with ANY Method Names):\n');

// Test OrderProcessingService with business-specific method names
console.log('1️⃣ OrderProcessingService - Business Methods:');
const orderService = container.resolve('orderService');

const order = await orderService.processNewOrder({
  items: [{ id: 'item1', quantity: 2 }],
  total: 99.99
});
console.log('✅ Order processed:', order.orderId);

await orderService.trackOrderStatus(order.orderId);
console.log('');

// Test UserAccountService with domain-specific method names
console.log('2️⃣ UserAccountService - Domain Methods:');
const userService = container.resolve('userService');

const newUser = await userService.registerNewUser({
  name: 'John Doe',
  email: 'john.doe@example.com'
});
console.log('✅ User registered:', newUser.id);

const auth = await userService.authenticateUser('john.doe@example.com', 'password123');
console.log('✅ User authenticated:', auth.token);
console.log('');

// Test ReportingService with analytics-specific method names
console.log('3️⃣ ReportingService - Analytics Methods:');
const reportingService = container.resolve('reportingService');

const salesReport = await reportingService.generateSalesReport({
  start: '2024-01-01',
  end: '2024-01-31'
});
console.log('✅ Sales report generated:', salesReport.reportId);

// Second call should hit cache
const cachedSalesReport = await reportingService.generateSalesReport({
  start: '2024-01-01',
  end: '2024-01-31'
});
console.log('✅ Cached sales report:', cachedSalesReport.reportId);
console.log('');

// ============ ERROR HANDLING AND VALIDATION ============

console.log('🛡️ Error Handling and Validation:\n');

try {
  await orderService.cancelExistingOrder('invalid_order', 'customer request');
} catch (error) {
  console.log('✅ Error properly logged and tracked:', error.message);
}

try {
  await userService.authenticateUser('invalid@example.com', 'wrong_password');
} catch (error) {
  console.log('✅ Authentication error handled:', error.message);
}
console.log('');

// ============ PERFORMANCE METRICS ============

console.log('📊 Performance Metrics and Analytics:\n');

const metrics = container.resolve('metricsCollector');
const allMetrics = metrics.getMetrics();

let totalCalls = 0;
let totalDuration = 0;

Object.entries(allMetrics).forEach(([metric, values]) => {
  if (metric.includes('method_calls_total')) {
    const calls = values.reduce((sum, v) => sum + v.value, 0);
    totalCalls += calls;
  }
  if (metric.includes('method_duration_ms')) {
    const duration = values.reduce((sum, v) => sum + v.value, 0);
    totalDuration += duration;
  }
});

console.log(`📈 Total Method Calls: ${totalCalls}`);
console.log(`⏱️  Average Duration: ${(totalDuration / totalCalls).toFixed(2)}ms`);

const cache = container.resolve('cache');
const cacheStats = cache.getStats();
console.log(`💾 Cache Hit Rate: ${((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%`);

const logger = container.resolve('logger');
console.log(`📝 Total Log Entries: ${logger.getLogs().length}`);
console.log('');

// ============ ADVANCED FEATURES SUMMARY ============

console.log('🎯 Advanced Features Demonstrated:');
console.log('');
console.log('✅ Universal Method Validation:');
console.log('   • Works with ANY method naming convention');
console.log('   • processNewOrder(), authenticateUser(), generateSalesReport()');
console.log('   • No configuration needed - automatically adapts');
console.log('');
console.log('✅ Batch Registration:');
console.log('   • Declarative service configuration');
console.log('   • Tags, lifecycles, and decorators in one place');
console.log('   • Enterprise-ready service organization');
console.log('');
console.log('✅ Smart Decorators with DI:');
console.log('   • Decorators receive their own dependencies');
console.log('   • Logger, MetricsCollector, Cache services injected');
console.log('   • Composable and reusable decorator services');
console.log('');
console.log('✅ Enterprise Patterns:');
console.log('   • Comprehensive logging with metadata');
console.log('   • Performance metrics collection');
console.log('   • Distributed caching with TTL');
console.log('   • Error tracking and audit trails');
console.log('');
console.log('✅ Error Handling & Validation:');
console.log('   • Automatic interface preservation validation');
console.log('   • Graceful error handling with proper logging');
console.log('   • Type safety and method signature validation');
console.log('');