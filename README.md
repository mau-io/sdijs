# SDI v2.0 🚀

**Modern Dependency Injection for Node.js** - A powerful, enterprise-ready DI container with fluent API while maintaining the elegant `{a,b,c}` destructuring syntax.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/mau-io/sdijs)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![ES Modules](https://img.shields.io/badge/ES-Modules-yellow.svg)](https://nodejs.org/api/esm.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-71%20passing-brightgreen.svg)](#-testing)
[![Examples](https://img.shields.io/badge/examples-9%20working-green.svg)](#-examples)
[![Security](https://img.shields.io/badge/security-hardened-red.svg)](#-security-features)

## ✨ Features

✅ **Fluent/Chainable API** - Modern, readable service registration  
✅ **Destructuring Support** - Keep your elegant `{service, config}` syntax  
✅ **🏷️ Tag-based Discovery** - Find services by tags with AND/OR logic  
✅ **Scoped Dependencies** - Request/session scoped services  
✅ **Factory Functions** - With full dependency injection  
✅ **Circular Dependency Detection** - Automatic detection and helpful errors  
✅ **Lifecycle Hooks** - beforeCreate, afterCreate, etc.  
✅ **TypeScript Ready** - Full type definitions included  
✅ **Zero Dependencies** - Lightweight and secure  
✅ **Enterprise Ready** - Plugin systems, layered architecture, strategy patterns  
✅ **Security Hardened** - Prototype pollution protection & memory limits  

### Why Dependency Injection?

The Dependency Injection pattern separates object instantiation from business logic, providing:

- **🔍 Explicit dependencies** - Clear understanding of service relationships
- **♻️ Code reuse** - Services decoupled from specific implementations  
- **🧪 Easy testing** - Mock dependencies effortlessly
- **🏗️ Better architecture** - Clean, maintainable code structure

## 📦 Installation

```bash
# Clone the repository
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
import SDI, { createContainer } from './index.js'; // For local development

// Create container with modern API - RECOMMENDED
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

// ✨ NEW FLUENT API - Much more powerful!
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

## 📚 API Reference

### 🏗️ Container Creation

```js
import SDI, { createContainer } from './index.js';

// Method 1: Constructor
const container = new SDI({
  verbose: false,        // Enable/disable logging
  autoBinding: true,     // Auto-bind class methods
  strictMode: false,     // Strict registration rules
  allowOverrides: false, // Allow service overrides
  maxServices: 1000,     // Memory limit for services
  maxInstances: 5000,    // Memory limit for instances
  maxScopes: 100,        // Memory limit for scopes
  maxHooksPerEvent: 50   // Memory limit for hooks
});

// Method 2: Factory function (RECOMMENDED)
const container = createContainer({ verbose: true });
```

### 🔧 Service Registration

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
      // Implementation here
      return { sent: true, to, subject };
    }
  };
}).asSingleton();

// Multiple service registration
container.registerAll({
  config: configObject,
  logger: loggerInstance,
  cache: cacheService
});
```

#### Service Lifecycles

| Lifecycle | Description | Method |
|-----------|-------------|---------|
| **Singleton** | One instance, cached globally | `.singleton()` |
| **Transient** | New instance every time | `.transient()` |
| **Scoped** | One instance per scope | `.register().asScoped()` |
| **Value** | Direct value, no instantiation | `.value()` |

### 🎯 Service Resolution

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

// Scoped resolution (see Scopes section)
const requestService = requestScope.resolve('requestService');
```

### 🔄 Scoped Dependencies

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

const ctx3 = sessionScope.resolve('requestContext');
console.log(ctx1 === ctx3); // false - different scope

// Clean up when done
requestScope.dispose();
```

### 🪝 Lifecycle Hooks

```js
container
  .hook('beforeCreate', ({service}) => {
    console.log(`Creating ${service.name}`);
  })
  .hook('afterCreate', ({service, instance}) => {
    console.log(`Created ${service.name}`);
  })
  .hook('beforeResolve', ({name}) => {
    console.log(`Resolving ${name}`);
  })
  .hook('afterResolve', ({name, result}) => {
    console.log(`Resolved ${name}`);
  });

// Clean up hooks when needed
container.clearHooks('beforeCreate');
```

### 🏷️ Advanced Features

#### Service Tags & Discovery

**🔥 NEW in v2.0:** Tag-based service discovery enables powerful architectural patterns like plugin systems, environment-specific services, and layered architectures.

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

// ✨ POWERFUL TAG-BASED SERVICE DISCOVERY

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

**📊 Tag Discovery Methods:**

| Method | Purpose | Returns |
|--------|---------|---------|
| `getServicesByTags(tags, mode)` | Full service metadata | `Array<{name, service, tags, lifecycle}>` |
| `getServiceNamesByTags(tags, mode)` | Just service names | `string[]` |
| `resolveServicesByTags(tags, mode, scope)` | Resolved instances | `Array<{name, instance, tags}>` |
| `getAllTags()` | All unique tags | `string[]` (sorted) |
| `getServicesByTag()` | Services grouped by tag | `Record<string, string[]>` |

#### 🎯 Real-World Tag Use Cases

Tags enable enterprise-grade architectural patterns. Here are 5 powerful use cases:

```js
// 🌍 1. ENVIRONMENT-SPECIFIC SERVICES
// Register different implementations for different environments
container.register(MockPaymentService).withTags('payment', 'development').asSingleton();
container.register(StripePaymentService).withTags('payment', 'production').asSingleton();
container.register(TestEmailService).withTags('email', 'test').asSingleton();
container.register(SendGridEmailService).withTags('email', 'production').asSingleton();

// Load environment-specific services
const env = process.env.NODE_ENV || 'development';
const paymentService = container.getServicesByTags(['payment', env])[0];
const emailServices = container.resolveServicesByTags(['email', env]);

// 🏗️ 2. LAYERED ARCHITECTURE
// Organize services by architectural layers
container.register(UserRepository).withTags('repository', 'data-layer').asSingleton();
container.register(ProductRepository).withTags('repository', 'data-layer').asSingleton();
container.register(UserService).withTags('service', 'business-layer').asSingleton();
container.register(OrderService).withTags('service', 'business-layer').asSingleton();
container.register(UserController).withTags('controller', 'presentation-layer').asSingleton();

// Load entire layers
const dataLayer = container.resolveServicesByTags(['data-layer']);
const businessLayer = container.resolveServicesByTags(['business-layer']);

// 🔌 3. PLUGIN SYSTEM
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

// Load specific plugin categories
const securityPlugins = container.resolveServicesByTags(['plugin', 'security']);

// ⚡ 4. STRATEGY PATTERN IMPLEMENTATION
// Multiple payment strategies
container.register(CreditCardPayment).withTags('payment', 'strategy', 'card').asSingleton();
container.register(PayPalPayment).withTags('payment', 'strategy', 'paypal').asSingleton();
container.register(CryptoPayment).withTags('payment', 'strategy', 'crypto').asSingleton();

// Get all payment strategies
const allPaymentStrategies = container.getServicesByTags(['payment', 'strategy']);
console.log(`Available payment methods: ${allPaymentStrategies.map(s => s.name).join(', ')}`);

// Get specific payment type
const cardPayments = container.resolveServicesByTags(['payment', 'card']);

// 🚩 5. FEATURE FLAGS AND CAPABILITIES
// Conditional feature loading
container.register(BasicAnalytics).withTags('analytics', 'basic').asSingleton();
container.register(AdvancedAnalytics).withTags('analytics', 'premium').asSingleton();
container.register(MonitoringService).withTags('monitoring', 'optional').asSingleton();
container.register(A11yService).withTags('accessibility', 'optional').asSingleton();

// Load features based on subscription level
const userTier = 'premium'; // from user session
const analytics = container.getServicesByTags(['analytics', userTier]);

// Load optional features if enabled
const optionalFeatures = container.resolveServicesByTags(['optional']);
optionalFeatures.forEach(feature => {
  if (isFeatureEnabled(feature.name)) {
    feature.instance.enable();
  }
});
```

**💡 Pro Tips for Tag Usage:**

- **Use hierarchical tags**: `['service', 'user-service']` for better organization
- **Combine environment + feature**: `['cache', 'redis', 'production']`
- **Use descriptive names**: `['repository', 'read-only']` vs `['repo', 'ro']`
- **Group by capability**: `['serializer', 'json']`, `['serializer', 'xml']`
- **Version your APIs**: `['api', 'v1']`, `['api', 'v2']`

#### Conditional Registration

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

#### Service Overrides

```js
// Strict mode prevents accidental overrides
const strictContainer = createContainer({ strictMode: true });

strictContainer.singleton(Service, 'myService');
strictContainer.singleton(NewService, 'myService'); // ❌ Throws error

// Explicit override
strictContainer
  .register(NewService, 'myService')
  .override()
  .asSingleton(); // ✅ Works
```

## 🔒 Security Features

SDI v2.0 includes enterprise-grade security features:

```js
// Prototype pollution protection
class VulnerableService {
  constructor(deps) {
    deps.__proto__; // ❌ Throws: Dangerous property access blocked
    deps.constructor; // ❌ Throws: Dangerous property access blocked
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
container.value('', 'test'); // ❌ Throws: Service name must be a non-empty string
container.factory('test', 'not-a-function'); // ❌ Throws: Factory must be a function
```

## 💎 Destructuring Support

The key feature that makes SDI special - **your destructuring syntax remains unchanged**:

```js
// ✅ All of these still work exactly the same!

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

SDI v2.0 provides helpful error messages:

```js
// ❌ Service not found
container.resolve('nonExistent');
// Error: Service 'nonExistent' not found. Did you forget to register it?

// ❌ Circular dependency
container.singleton(ServiceA).singleton(ServiceB);
// Error: Circular dependency detected: serviceA → serviceB → serviceA

// ❌ Read-only dependencies
class Service {
  constructor(deps) {
    deps.someValue = 'test'; // Error: Dependencies are read-only
  }
}

// ❌ Memory limits exceeded
container.value('service1000', {}); // Error: Memory limit exceeded for services. Max: 1000

// ❌ Security violations
class BadService {
  constructor(deps) {
    deps.__proto__; // Error: Dangerous property access blocked: '__proto__'
  }
}
```

## 🧪 Testing

```bash
npm test
```

**Test Results:** 71 tests passing ✅
- Basic functionality: 8 tests
- Modern features: 33 tests  
- Security features: 4 tests
- Input validation: 6 tests
- **Tag-based discovery: 17 tests** (including performance test)
- **Advanced tag integration: 4 tests**
- **Performance validation: 55 services, 140 tags in <1ms**
- **Plus:** 8/8 tests passing in examples/testing

Example test with SDI:

```js
import { expect } from 'chai';
import { createContainer } from './index.js';

describe('UserService', () => {
  let container;
  
  beforeEach(() => {
    container = createContainer();
    
    // Mock dependencies
    container
      .value('config', { apiUrl: 'http://test.api' })
      .value('logger', { 
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg)
      })
      .singleton(MockDatabase)
      .singleton(UserService);
  });
  
  it('should find user', async () => {
    const userService = container.resolve('userService');
    const user = await userService.findUser(123);
    
    expect(user).to.be.ok;
  });
});
```

## 🚀 Migration from v1.x

| Old API (v1.x) | New API (v2.0) | Notes |
|----------------|----------------|-------|
| `new sdijs()` | `createContainer()` | Recommended factory |
| `$Inject.addSingleton()` | `container.singleton()` | Fluent API |
| `$Inject.addTransient()` | `container.transient()` | Fluent API |
| `$Inject.addValue()` | `container.value()` | Fluent API |
| `require('sdijs')` | `import SDI from './index.js'` | ES Modules |

**Good news:** Your service classes with `{destructuring}` need **zero changes**! 🎉

### Breaking Changes in v2.0

- **ES Modules only** - No more CommonJS support
- **Node.js 16+** - Requires modern Node.js
- **Import syntax** - Must use ES6 imports
- **New API** - Old `$Inject` global removed

### Migration Steps

1. **Update Node.js** to version 16 or higher
2. **Convert to ES Modules** - Add `"type": "module"` to package.json
3. **Update imports** - Change `require()` to `import`
4. **Update API calls** - Use new fluent API
5. **Test thoroughly** - Run your test suite

## 📝 Examples

### Main Example
Check out [`example.js`](./example.js) for a comprehensive demonstration of all features:

```bash
node example.js
```

### Comprehensive Examples Directory
Explore the [`examples/`](./examples/) directory with 9 specialized examples:

```bash
cd examples

# Run individual examples
npm run example:basic        # Basic DI concepts
npm run example:factory      # Factory functions
npm run example:scopes       # Scoped dependencies & hooks
npm run example:strategy     # Strategy pattern with tags
npm run example:decorator    # Decorator pattern
npm run example:microservices # Enterprise microservices
npm run example:express      # Express.js integration
npm run example:testing      # Testing with mocks (8/8 tests pass)
npm run example:tags         # Advanced tag-based discovery

# Run all examples at once
npm run example:all
```

The examples include:
- Basic service registration and resolution
- Scoped dependencies and lifecycle hooks
- Factory functions with full DI
- Design patterns (Strategy, Decorator)
- Enterprise patterns (Microservices communication)
- Web application integration (Express.js)
- Comprehensive testing with mocks
- **🏷️ Advanced tag-based service discovery** (NEW!)
- Security features demonstration

## 🔗 TypeScript

Full TypeScript support included with `index.d.ts`:

```typescript
import SDI, { SDIOptions, ServiceBuilder, LIFECYCLE } from './index.js';

interface IUserService {
  findUser(id: number): Promise<User>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const container = new SDI({ verbose: true });
const userService = container.resolve<IUserService>('userService');
```

## 📊 Performance

SDI v2.0 is designed for performance:

- **Lazy resolution** - Services created only when needed
- **Efficient caching** - Singleton instances cached with WeakMap
- **Memory limits** - Configurable limits prevent memory leaks
- **Auto-binding** - Optional method binding with caching
- **Minimal overhead** - Zero dependencies, pure JavaScript
- **🏷️ Fast tag discovery** - Optimized Set operations for tag matching
- **Scalable architecture** - Performance tested with 55 services and 100+ tags
- **Quick operations** - Tag discovery <100ms, registration <1000ms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

MIT - see [LICENCE.md](LICENCE.md) file for details.

---

**SDI v2.0** - Modern DI that grows with your application while keeping your code clean, secure, and testable. 🚀