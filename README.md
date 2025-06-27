# SDIJS v2.1 🚀

**Modern Dependency Injection for Node.js** - A powerful, enterprise-ready DI container with fluent API, decorators, and universal validation while maintaining the elegant `{a,b,c}` destructuring syntax.

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/mau-io/sdijs)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![ES Modules](https://img.shields.io/badge/ES-Modules-yellow.svg)](https://nodejs.org/api/esm.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-112%20passing-brightgreen.svg)](#testing)
[![Examples](https://img.shields.io/badge/examples-10%20working-green.svg)](#examples)
[![Security](https://img.shields.io/badge/security-hardened-red.svg)](#security-features)

## Features

**Core DI Features:**
- **Fluent/Chainable API** - Modern, readable service registration  
- **Destructuring Support** - Keep your elegant `{service, config}` syntax  
- **Tag-based Discovery** - Find services by tags with AND/OR logic  
- **Scoped Dependencies** - Request/session scoped services  
- **Factory Functions** - With full dependency injection  
- **Circular Dependency Detection** - Automatic detection and helpful errors  
- **Lifecycle Hooks** - beforeCreate, afterCreate, etc.  

**NEW in v2.1 - Advanced Decorator System:**
- **Service Decorators** - Services that decorate other services with DI
- **Custom Function Decorators** - Flexible function-based decoration
- **Universal Method Validation** - Works with ANY method names automatically
- **Batch Registration** - Declarative service configuration
- **Interface Preservation** - Automatic validation of service interfaces
- **Smart Error Detection** - Intelligent signature change warnings

**Enterprise Features:**
- **TypeScript Ready** - Full type definitions included  
- **Zero Dependencies** - Lightweight and secure  
- **Security Hardened** - Prototype pollution protection & memory limits
- **Verbose Logging** - Clear `[SDIJS:CATEGORY]` logging for debugging
- **Performance Optimized** - Efficient caching and tag discovery

### Why Dependency Injection?

The Dependency Injection pattern separates object instantiation from business logic, providing:

- **Explicit dependencies** - Clear understanding of service relationships
- **Code reuse** - Services decoupled from specific implementations  
- **Easy testing** - Mock dependencies effortlessly
- **Better architecture** - Clean, maintainable code structure

## 📦 Installation

```bash
# Install from npm (recommended)
npm install sdijs

# Or clone the repository for development
git clone https://github.com/mau-io/sdijs.git
cd sdijs

# Install dependencies
npm install

# Run tests
npm test

# Run example
node example.js
```

**Requirements:** Node.js 16+ (ES Modules support)

## 🎯 Quick Start

```js
import { createContainer } from 'sdijs';

// Create container with modern API
const container = createContainer({ 
  verbose: true, 
  autoBinding: true,
  strictMode: false
});

// Sample services with {destructuring} - MAINTAINED!
class Database {
  constructor({config, logger}) {  // ← Still works!
    this.config = config;
    this.logger = logger;
  }
  
  async query(sql) {
    this.logger.info(`Executing: ${sql}`);
    return [];
  }
}

class UserService {
  constructor({database, logger}) {  // ← Destructuring preserved!
    this.database = database;
    this.logger = logger;
  }
  
  async findUser(id) {
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Fluent API - Much more powerful!
container
  .value('config', { dbUrl: 'postgresql://...' })
  .factory('logger', ({config}) => ({
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  }))
  .singleton(Database)
  .singleton(UserService);

// Use your services
const userService = container.resolve('userService');
const user = await userService.findUser(123);
```

## 🎨 Decorator System (NEW in v2.1)

The decorator system allows you to add cross-cutting concerns like logging, caching, and metrics to any service without modifying the original code.

### Basic Decorator Usage

```js
// Create decorator services
class LoggingDecorator {
  decorate(serviceInstance) {
    return {
      ...serviceInstance, // Preserve all properties
      findUser: async (id) => {
        console.log(`Finding user ${id}`);
        const result = await serviceInstance.findUser(id);
        console.log(`User ${id} found`);
        return result;
      }
    };
  }
}

class TimingDecorator {
  decorate(serviceInstance) {
    return {
      ...serviceInstance,
      findUser: async (id) => {
        const start = Date.now();
        const result = await serviceInstance.findUser(id);
        console.log(`findUser took ${Date.now() - start}ms`);
        return result;
      }
    };
  }
}

// Register decorators and apply them
container
  .register(LoggingDecorator, 'loggingDecorator').asSingleton()
  .register(TimingDecorator, 'timingDecorator').asSingleton()
  .register(UserService, 'userService')
  .decorateWith(['loggingDecorator', 'timingDecorator'])
  .asSingleton();
```

### Batch Registration

Register multiple services with decorators using declarative configuration:

```js
const serviceConfigs = [
  {
    class: OrderService,
    name: 'orderService',
    decorators: ['logging', 'metrics', 'cache'],
    lifecycle: 'singleton',
    tags: ['business', 'critical']
  },
  {
    class: UserService,
    name: 'userService', 
    decorators: ['logging', 'metrics'],
    lifecycle: 'singleton',
    tags: ['business', 'user']
  },
  {
    class: ReportingService,
    name: 'reportingService',
    decorators: ['logging', 'cache'],
    lifecycle: 'singleton',
    tags: ['analytics', 'heavy']
  }
];

container.batchRegister(serviceConfigs);
```

### Custom Function Decorators

For more flexibility, use custom function decorators:

```js
const cacheDecorator = (serviceInstance) => {
  const cache = new Map();
  
  return {
    ...serviceInstance,
    findUser: async (id) => {
      if (cache.has(id)) {
        return cache.get(id);
      }
      
      const result = await serviceInstance.findUser(id);
      cache.set(id, result);
      return result;
    }
  };
};

container
  .register(UserService, 'userService')
  .decorate(cacheDecorator)
  .decorateWith(['logging'])  // Mix function and service decorators
  .asSingleton();
```

### Smart Decorators with Dependency Injection

Decorators can receive their own dependencies:

```js
class UniversalCacheDecorator {
  constructor({ cache, logger }) {
    this.cache = cache;
    this.logger = logger;
  }

  decorate(serviceInstance) {
    const decoratedMethods = {};
    
    // Get ALL public methods dynamically
    const publicMethods = this._getPublicMethods(serviceInstance);
    
    for (const methodName of publicMethods) {
      const originalMethod = serviceInstance[methodName].bind(serviceInstance);
      decoratedMethods[methodName] = async (...args) => {
        const cacheKey = `${serviceInstance.constructor.name}.${methodName}:${JSON.stringify(args)}`;
        
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.logger.info(`Cache hit for ${methodName}`);
          return cached;
        }
        
        const result = await originalMethod(...args);
        await this.cache.set(cacheKey, result);
        return result;
      };
    }

    return { ...serviceInstance, ...decoratedMethods };
  }
  
  _getPublicMethods(serviceInstance) {
    // Implementation to discover all public methods
    // Works with ANY method names automatically
  }
}
```

## 📚 API Reference

### Container Creation

```js
import { createContainer } from 'sdijs';

// Factory function (RECOMMENDED)
const container = createContainer({
  verbose: false,        // Enable/disable logging
  autoBinding: true,     // Auto-bind class methods
  strictMode: false,     // Strict registration rules
  maxServices: 1000,     // Memory limit for services
  maxInstances: 5000,    // Memory limit for instances
  maxScopes: 100,        // Memory limit for scopes
  maxHooksPerEvent: 50   // Memory limit for hooks
});
```

### Service Registration

#### Fluent Registration API

```js
// Basic registration with lifecycle
container.singleton(UserService);           // Singleton class
container.transient(NotificationService);   // New instance each time
container.value('config', configObject);    // Direct value

// Advanced registration with builder pattern
container
  .register(AdminService)
  .withTag('admin')
  .withTag('security')
  .when(() => process.env.NODE_ENV === 'production')
  .asSingleton();

// Factory functions with DI
container.factory('emailService', ({config, logger}) => {
  return {
    send: async (to, subject, body) => {
      logger.info(`Sending email to ${to}`);
      return { sent: true, to, subject };
    }
  };
}).asSingleton();

// Decorator registration
container
  .register(UserService, 'userService')
  .decorateWith(['loggingDecorator', 'cachingDecorator'])
  .decorate(customTimingDecorator)
  .withTags('business', 'critical')
  .asSingleton();

// Batch registration
container.batchRegister([
  { class: OrderService, name: 'orderService', decorators: ['logging'] },
  { class: UserService, name: 'userService', decorators: ['logging', 'cache'] }
]);
```

#### Service Lifecycles

| Lifecycle | Description | Method |
|-----------|-------------|---------|
| **Singleton** | One instance, cached globally | `.singleton()` |
| **Transient** | New instance every time | `.transient()` |
| **Scoped** | One instance per scope | `.register().asScoped()` |
| **Value** | Direct value, no instantiation | `.value()` |

### Service Resolution

```js
// Basic resolution
const userService = container.resolve('userService');

// Multiple resolution
const {database, logger, config} = container.resolveAll([
  'database', 'logger', 'config'
]);

// Lazy resolution
const getUserService = container.getResolver('userService');
const service = getUserService(); // Resolved when called

// Scoped resolution
const requestService = requestScope.resolve('requestService');
```

### Scoped Dependencies

Perfect for web applications with request/session-specific data:

```js
// Create scopes
const requestScope = container.createScope('request');
const sessionScope = container.createScope('session');

// Register scoped services
class RequestContext {
  constructor({}) {
    this.requestId = Math.random().toString(36).substr(2, 9);
    this.startTime = Date.now();
  }
  
  getElapsed() {
    return Date.now() - this.startTime;
  }
}

container.register(RequestContext).asScoped();

// Use in different scopes
const ctx1 = requestScope.resolve('requestContext');
const ctx2 = requestScope.resolve('requestContext');
console.log(ctx1 === ctx2); // true - same instance within scope

// Clean up when done
requestScope.dispose();
```

### Lifecycle Hooks

```js
container
  .hook('beforeCreate', ({service}) => {
    console.log(`Creating ${service.name}`);
  })
  .hook('afterCreate', ({service, instance}) => {
    console.log(`Created ${service.name}`);
  });

// Clean up hooks when needed
container.clearHooks('beforeCreate');
```

### Tag-based Service Discovery

Tag-based service discovery enables powerful architectural patterns like plugin systems, environment-specific services, and layered architectures:

```js
// Register services with multiple tags
container
  .register(DatabaseRepository)
  .withTag('repository')
  .withTag('persistence')
  .withTag('production')
  .withTag('database')
  .asSingleton();

container
  .register(ApiRepository)
  .withTag('repository')
  .withTag('http')
  .withTag('external')
  .withTag('api')
  .asSingleton();

container
  .register(CacheService)
  .withTag('cache')
  .withTag('performance')
  .withTag('memory')
  .asSingleton();

// POWERFUL TAG-BASED SERVICE DISCOVERY

// 1. Find services with ALL specified tags (AND mode - default)
const prodRepositories = container.getServicesByTags(['repository', 'production']);
// Returns: [{ name: 'databaseRepository', service: {...}, tags: [...], lifecycle: 'singleton' }]

// 2. Find services with ANY specified tags (OR mode)  
const dataServices = container.getServicesByTags(['repository', 'cache'], 'OR');
// Returns: All repositories AND cache services

// 3. Get just the service names (simplified)
const repoNames = container.getServiceNamesByTags(['repository']);
// Returns: ['databaseRepository', 'apiRepository']

// 4. Resolve services directly by tags
const resolvedRepos = container.resolveServicesByTags(['repository']);
// Returns: [{ name: 'databaseRepository', instance: <resolved>, tags: [...] }]

// 5. Get all available tags (sorted)
const allTags = container.getAllTags();
console.log(allTags); 
// ['api', 'cache', 'database', 'external', 'http', 'memory', 'persistence', 'production', 'repository']

// 6. Get services grouped by tag
const grouped = container.getServicesByTag();
console.log(grouped.repository); // ['databaseRepository', 'apiRepository']
console.log(grouped.cache);      // ['cacheService']
```

**Tag Discovery Methods:**

| Method | Purpose | Returns |
|--------|---------|---------|
| `getServicesByTags(tags, mode)` | Full service metadata | `Array<{name, service, tags, lifecycle}>` |
| `getServiceNamesByTags(tags, mode)` | Just service names | `string[]` |
| `resolveServicesByTags(tags, mode, scope)` | Resolved instances | `Array<{name, instance, tags}>` |
| `getAllTags()` | All unique tags | `string[]` (sorted) |
| `getServicesByTag()` | Services grouped by tag | `Record<string, string[]>` |

#### Real-World Tag Use Cases

Tags enable enterprise-grade architectural patterns:

```js
// 1. ENVIRONMENT-SPECIFIC SERVICES
// Register different implementations for different environments
container.register(MockPaymentService).withTags('payment', 'development').asSingleton();
container.register(StripePaymentService).withTags('payment', 'production').asSingleton();
container.register(TestEmailService).withTags('email', 'test').asSingleton();
container.register(SendGridEmailService).withTags('email', 'production').asSingleton();

// Load environment-specific services
const env = process.env.NODE_ENV || 'development';
const paymentService = container.getServicesByTags(['payment', env])[0];
const emailServices = container.resolveServicesByTags(['email', env]);

// 2. LAYERED ARCHITECTURE
// Organize services by architectural layers
container.register(UserRepository).withTags('repository', 'data-layer').asSingleton();
container.register(ProductRepository).withTags('repository', 'data-layer').asSingleton();
container.register(UserService).withTags('service', 'business-layer').asSingleton();
container.register(OrderService).withTags('service', 'business-layer').asSingleton();
container.register(UserController).withTags('controller', 'presentation-layer').asSingleton();

// Load entire layers
const dataLayer = container.resolveServicesByTags(['data-layer']);
const businessLayer = container.resolveServicesByTags(['business-layer']);

// 3. PLUGIN SYSTEM
// Dynamic plugin discovery and initialization
container.register(AuthPlugin).withTags('plugin', 'security').asSingleton();
container.register(LoggingPlugin).withTags('plugin', 'monitoring').asSingleton();
container.register(CachePlugin).withTags('plugin', 'performance').asSingleton();

// Initialize all plugins
const plugins = container.resolveServicesByTags(['plugin']);
plugins.forEach(plugin => {
  console.log(`Initializing plugin: ${plugin.name}`);
  plugin.instance.initialize();
});

// 4. STRATEGY PATTERN IMPLEMENTATION
// Multiple payment strategies
container.register(CreditCardPayment).withTags('payment', 'strategy', 'card').asSingleton();
container.register(PayPalPayment).withTags('payment', 'strategy', 'paypal').asSingleton();
container.register(CryptoPayment).withTags('payment', 'strategy', 'crypto').asSingleton();

// Get all payment strategies
const allPaymentStrategies = container.getServicesByTags(['payment', 'strategy']);
console.log(`Available payment methods: ${allPaymentStrategies.map(s => s.name).join(', ')}`);

// Get specific payment type
const cardPayments = container.resolveServicesByTags(['payment', 'card']);
```

**Pro Tips for Tag Usage:**

- **Use hierarchical tags**: `['service', 'user-service']` for better organization
- **Combine environment + feature**: `['cache', 'redis', 'production']`
- **Use descriptive names**: `['repository', 'read-only']` vs `['repo', 'ro']`
- **Group by capability**: `['serializer', 'json']`, `['serializer', 'xml']`
- **Version your APIs**: `['api', 'v1']`, `['api', 'v2']`

### Conditional Registration

```js
container
  .register(MockEmailService)
  .when(() => process.env.NODE_ENV === 'test')
  .asSingleton();

container
  .register(SendGridEmailService)
  .when(() => process.env.NODE_ENV === 'production')
  .asSingleton();
```

## 🔒 Security Features

SDIJS includes enterprise-grade security features:

```js
// Prototype pollution protection
class VulnerableService {
  constructor(deps) {
    deps.__proto__; // Throws: Dangerous property access blocked
    deps.constructor; // Throws: Dangerous property access blocked
  }
}

// Memory limits prevent DoS attacks
const limitedContainer = createContainer({
  maxServices: 100,      // Max registered services
  maxInstances: 500,     // Max cached instances
  maxScopes: 10,         // Max concurrent scopes
  maxHooksPerEvent: 20   // Max hooks per event
});

// Input validation on all methods
container.value('', 'test'); // Throws: Service name must be non-empty
container.factory('test', 'not-a-function'); // Throws: Factory must be a function
```

## 💎 Destructuring Support

The key feature that makes SDIJS special - **your destructuring syntax remains unchanged**:

```js
// All of these still work exactly the same!

class UserService {
  constructor({database, logger, config, emailService}) {
    this.database = database;
    this.logger = logger;
    this.config = config;
    this.emailService = emailService;
  }
}

class PaymentService {
  constructor({userService, database, logger}) {
    // Your existing code doesn't change!
  }
}

// Factory functions too
const utils = ({config, logger}) => {
  return {
    formatUser: (user) => `${user.name} <${user.email}>`,
    logAction: (action) => logger.info(action)
  };
};
```

## 🛠️ Utility Methods

```js
// Service management
container.has('serviceName');           // Check if registered
container.unregister('serviceName');    // Remove service
container.clear();                      // Clear all services
container.getServiceNames();            // List all service names

// Scope management
const scope = container.createScope('myScope');
scope.dispose();                        // Clean up scope
scope.getInstances();                   // Get all instances in scope

// Hook management
container.clearHooks('beforeCreate');   // Remove all hooks for event
```

## 🔍 Error Handling & Debugging

SDIJS provides helpful error messages and verbose logging:

```js
// Verbose logging with clear categories
const container = createContainer({ verbose: true });

// Logs show clear categories:
// [SDIJS:REGISTER] Service 'userService' [singleton] with decorators
// [SDIJS:RESOLVE] Resolving dependency: database
// [SDIJS:DECORATOR] Applied decorator 'logging' to service 'userService'
// [SDIJS:VALIDATION] Decorator 'logging' successfully preserved service interface...

// Service not found
container.resolve('nonExistent');
// Error: Service 'nonExistent' not found. Did you forget to register it?

// Circular dependency
container.singleton(ServiceA).singleton(ServiceB);
// Error: Circular dependency detected: serviceA → serviceB → serviceA

// Decorator validation errors
// Error: Decorator 'badDecorator' removed public method(s) from service 'userService': findUser
// Warning: Decorator 'timingDecorator' changed 'findUser' method signature. Original: 1 params, Decorated: 3 params

// Memory limits exceeded
container.value('service1000', {}); 
// Error: Memory limit exceeded for services. Max: 1000

// Security violations
class BadService {
  constructor(deps) {
    deps.__proto__; // Error: Dangerous property access blocked: '__proto__'
  }
}
```

## 🚀 Migration from v2.0

**New Features in v2.1 (Non-breaking):**
- Service decorators with `.decorateWith()` and `.decorate()`
- Universal method validation (works with any method names)
- Batch registration with `container.batchRegister()`
- Enhanced verbose logging with clear categories
- Interface preservation validation
- Smart signature change detection

**Your existing v2.0 code works unchanged!**

## 📝 Examples

### Main Example
Check out [`example.js`](./example.js) for a comprehensive demonstration of all features.

### Comprehensive Examples Directory
Explore the [`examples/`](./examples/) directory with specialized examples:

```bash
# If you cloned the repository
cd examples

# Run individual examples
node 01-basic/simple-di.js              # Basic DI concepts
node 02-advanced/factory-functions.js   # Factory functions
node 02-advanced/scopes-and-hooks.js    # Scoped dependencies & hooks
node 03-patterns/strategy-pattern.js    # Strategy pattern with tags
node 03-patterns/decorator-pattern.js   # Decorator pattern
node 04-enterprise/microservices-communication.js # Enterprise microservices
node 05-web-app/express-integration.js  # Express.js integration
node 06-testing/mocking-and-testing.js  # Testing with mocks
node 07-advanced/tag-discovery.js       # Advanced tag-based discovery
node 09-decorators/basic-decorator-usage.js        # NEW: Basic decorators
node 09-decorators/advanced-decorator-features.js  # NEW: Advanced decorators
```

**NEW Decorator Examples:**
- **Basic Decorator Usage** - Simple logging, timing, and caching decorators
- **Advanced Decorator Features** - Universal validation, batch registration, enterprise patterns

## 🔗 TypeScript

Full TypeScript support included with comprehensive type definitions:

```typescript
import { createContainer, ServiceConfig } from 'sdijs';

interface IUserService {
  findUser(id: number): Promise<User>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const container = createContainer({ verbose: true });

// Batch registration with types
const configs: ServiceConfig[] = [
  { 
    class: UserService, 
    name: 'userService',
    decorators: ['logging', 'cache'],
    lifecycle: 'singleton',
    tags: ['business']
  }
];

container.batchRegister(configs);
const userService = container.resolve<IUserService>('userService');
```

## 📊 Performance

SDIJS v2.1 is designed for enterprise performance:

- **Lazy resolution** - Services created only when needed
- **Efficient caching** - Singleton instances cached with WeakMap
- **Memory limits** - Configurable limits prevent memory leaks
- **Auto-binding** - Optional method binding with caching
- **Minimal overhead** - Zero dependencies, pure JavaScript
- **Fast tag discovery** - Optimized Set operations for tag matching
- **Scalable architecture** - Performance tested with 55+ services and 100+ tags
- **Universal validation** - Efficient method discovery with prototype chain walking
- **Smart decorator caching** - Optimized decorator application and validation

**Performance Results:**
- Tag discovery: <100ms for 100+ tags
- Service registration: <1000ms for 55+ services  
- Universal method validation: <10ms per service
- Decorator application: <5ms per decorator

---

**SDIJS v2.1** - Modern DI with advanced decorators that grows with your application while keeping your code clean, secure, and testable. 🚀