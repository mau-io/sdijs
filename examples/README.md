# SDI Examples

This directory contains comprehensive examples demonstrating the full potential of the **SDI (Simple Dependency Injection)** library. Each example is designed to showcase different aspects and use cases of dependency injection in modern JavaScript applications.

## 📁 Directory Structure

```
examples/
├── 01-basic/              # Fundamental concepts and basic usage
├── 02-advanced/           # Advanced features and patterns
├── 03-patterns/           # Design patterns implementation
├── 04-enterprise/         # Enterprise-grade applications
├── 05-web-app/           # Web application integration
├── 06-testing/           # Testing strategies with DI
├── 07-advanced/          # Advanced features and patterns
└── README.md             # This file
```

## 🚀 Getting Started

All examples are ready to run with Node.js 16+ and use ES modules. To run any example:

```bash
# Navigate to the project root
cd sdijs

# Run any example directly
node examples/01-basic/simple-di.js
node examples/02-advanced/factory-functions.js
node examples/03-patterns/strategy-pattern.js
# ... and so on
```

## 📚 Examples Overview

### 01-basic/ - Fundamental Concepts

**File**: `simple-di.js`

**What you'll learn**:
- Creating and configuring containers
- Registering services (singleton, transient, value)
- The elegant destructuring syntax `{service1, service2}`
- Basic dependency resolution
- Service lifecycle management

**Key concepts demonstrated**:
```javascript
// The signature destructuring syntax
class UserService {
    constructor({ database, logger, config }) {
        // Dependencies automatically injected
    }
}

container.singleton('userService', UserService);
const userService = container.resolve('userService');
```

### 02-advanced/ - Advanced Features

#### `factory-functions.js`
**Advanced dynamic service creation**

**What you'll learn**:
- Factory functions with dependency injection
- Environment-based service creation
- Complex initialization logic
- Conditional service instantiation

**Key features**:
```javascript
// Factory with full DI support
container.factory('cache', ({ config, environment }) => {
    switch (config[environment].cache.type) {
        case 'redis': return new RedisCache(config);
        case 'memory': return new MemoryCache(config);
        default: throw new Error('Unknown cache type');
    }
});
```

#### `scopes-and-hooks.js`
**Request-scoped services and lifecycle management**

**What you'll learn**:
- Scoped services for web applications
- Lifecycle hooks (beforeCreate, afterCreate, beforeResolve, afterResolve)
- Request isolation and cleanup
- Resource management

**Key features**:
```javascript
// Request-scoped services
const requestScope = container.createScope('request');
requestScope.scoped('userSession', UserSession);

// Lifecycle hooks
container.addHook('beforeCreate', (serviceName, serviceType) => {
    console.log(`Creating ${serviceType} service: ${serviceName}`);
});
```

### 03-patterns/ - Design Patterns

#### `strategy-pattern.js`
**Strategy pattern with enhanced service discovery**

**What you'll learn**:
- Implementing Strategy pattern with tags
- Complete tag-based service discovery API
- Multiple implementations of same interface
- Dynamic strategy selection
- Advanced filtering with AND/OR modes

**Key features**:
```javascript
// Register strategies with multiple tags efficiently
container.register(StripePaymentStrategy, 'stripePayment')
    .withTags('payment', 'strategy', 'card')
    .asSingleton();

// Discover services with flexible search modes
const paymentStrategies = container.getServicesByTags(['payment', 'strategy'], 'AND');
const digitalPayments = container.getServicesByTags(['card', 'wallet'], 'OR');

// Get comprehensive service information
const allTags = container.getAllTags();
const servicesByTag = container.getServicesByTag();

// Resolve services directly for immediate use
const resolvedPayments = container.resolveServicesByTags(['payment'], 'AND');
```

#### `decorator-pattern.js`
**Service decoration and enhancement**

**What you'll learn**:
- Decorator pattern with dependency injection
- Service composition and chaining
- Cross-cutting concerns (logging, caching, validation)
- Builder pattern for service configuration

**Key features**:
```javascript
// Chainable decorators
const decoratedService = builder
    .withBaseService(coreService)
    .withValidation()
    .withCaching()
    .withLogging()
    .withMetrics()
    .build();
```

### 04-enterprise/ - Enterprise Applications

#### `microservices-communication.js`
**Enterprise microservices architecture**

**What you'll learn**:
- Service registry and discovery
- Circuit breaker pattern for resilience
- Message queuing with DI
- Configuration management
- Health checks and monitoring

**Key features**:
```javascript
// Service registry
serviceRegistry.register('user-service', {
    host: 'localhost', port: 3001, version: '1.0.0'
});

// Circuit breaker
const result = await circuitBreaker.execute(() => 
    httpClient.call('external-service', '/api/data')
);

// Message queuing
messageQueue.publish('user.created', { userId: 123 });
messageQueue.subscribe('user.created', handleUserCreated);
```

### 05-web-app/ - Web Application Integration

#### `express-integration.js`
**Express.js integration with scoped services**

**What you'll learn**:
- Integrating SDI with Express.js
- Request-scoped dependency injection
- Middleware for DI container management
- Authentication and authorization with DI
- Error handling in DI context

**Key features**:
```javascript
// DI middleware
app.use(createDIMiddleware(container));

// Route handlers with DI
app.get('/api/users', auth, async (req, res, next) => {
    const userService = req.container.resolve('userService');
    const users = await userService.getAllUsers();
    res.json({ users });
});
```

### 06-testing/ - Testing Strategies

#### `mocking-and-testing.js`
**Comprehensive testing with mocks and stubs**

**What you'll learn**:
- Creating testable code with DI
- Mock services for unit testing
- Test isolation with separate containers
- Integration testing strategies
- Test utilities and helpers

**Key features**:
```javascript
// Test container with mocks
function createTestContainer() {
    const container = createContainer();
    container.singleton('emailService', MockEmailService);
    container.singleton('databaseService', MockDatabaseService);
    return container;
}

// Test isolation
const testContainer = createTestContainer();
const service = testContainer.resolve('notificationService');
```

### 07-advanced/ - Advanced Features

#### `tag-discovery.js`
**Comprehensive tag-based service discovery and architecture management**

**What you'll learn**:
- Complete tag discovery API usage
- Multi-layer architecture with tags
- Environment-specific service selection
- Plugin system with dynamic discovery
- Service composition based on tags
- Performance analysis and monitoring
- Advanced filtering and querying

**Key features**:
```javascript
// Multi-layer service registration
container.register(PostgreSQLRepository, 'postgresRepository')
    .withTags('repository', 'database', 'sql', 'production')
    .asSingleton();

// Environment-specific service resolution
const envServices = container.resolveServicesByTags(['development'], 'AND');

// Plugin ecosystem management
const plugins = container.getServicesByTags(['plugin'], 'AND');

// Advanced architectural analysis
const overview = container.generateArchitectureOverview();
```

### 08-real-world/ - Production-Ready Examples

#### `microservices-architecture.js`
**Complete microservices system with service discovery**

**What you'll learn**:
- Microservices architecture patterns
- Service registry and discovery
- Load balancing strategies
- Inter-service communication
- Event-driven architecture
- Health monitoring integration

#### `plugin-system.js`
**Dynamic plugin ecosystem with hot-loading**

**What you'll learn**:
- Plugin architecture patterns
- Dynamic plugin discovery and loading
- Plugin lifecycle management
- Category-based plugin execution
- Plugin health monitoring

#### `environment-management.js`
**Multi-environment service management**

**What you'll learn**:
- Environment-specific service loading
- Configuration management per environment
- Service health validation
- Environment switching capabilities

#### `performance-analysis.js`
**Comprehensive performance monitoring**

**What you'll learn**:
- Performance categorization of services
- Automated benchmarking
- Load testing capabilities
- Memory usage analysis
- Performance trend analysis

#### `health-monitoring.js`
**Enterprise-grade health monitoring**

**What you'll learn**:
- Automatic service discovery for monitoring
- Health check automation
- Alert management system
- Health trend analysis
- Service dependency monitoring

## 🔬 Advanced Tag Discovery Use Cases

The enhanced tag discovery API enables powerful architectural patterns:

### 1. **Environment-Specific Service Loading**
```javascript
// Load different services based on environment
const envServices = container.resolveServicesByTags([process.env.NODE_ENV], 'AND');
console.log(`Loaded ${envServices.length} services for ${process.env.NODE_ENV}`);
```

### 2. **Plugin Ecosystem Management**
```javascript
// Discover and execute all notification plugins
const notificationPlugins = container.resolveServicesByTags(['plugin', 'notification'], 'AND');
for (const plugin of notificationPlugins) {
    await plugin.instance.execute('broadcast', { message: 'System update' });
}
```

### 3. **Layered Architecture Analysis**
```javascript
// Analyze service distribution across architectural layers
const layers = ['repository', 'service', 'infrastructure'];
const analysis = layers.map(layer => ({
    layer,
    services: container.getServiceNamesByTags([layer], 'AND').length
}));
```

### 4. **Dynamic Workflow Composition**
```javascript
// Compose workflows based on available capabilities
const workflows = {
    'user-onboarding': ['service', 'notification'],
    'data-processing': ['repository', 'cache'],
    'monitoring': ['infrastructure', 'metrics']
};

Object.entries(workflows).forEach(([workflow, requiredTags]) => {
    const services = container.getServicesByTags(requiredTags, 'OR');
    const isReady = services.length >= requiredTags.length;
    console.log(`${workflow}: ${isReady ? 'READY' : 'PARTIAL'}`);
});
```

### 5. **Feature Flag Implementation**
```javascript
// Enable/disable features based on available services
const features = {
    caching: container.getServicesByTags(['cache'], 'AND').length > 0,
    monitoring: container.getServicesByTags(['metrics'], 'AND').length > 0,
    notifications: container.getServicesByTags(['notification'], 'OR').length > 0
};
```

### 6. **Service Health Monitoring**
```javascript
// Monitor services by category
const monitoringServices = container.resolveServicesByTags(['monitoring'], 'AND');
const healthReport = await Promise.all(
    monitoringServices.map(async service => ({
        name: service.name,
        status: await service.instance.checkHealth()
    }))
);
```

## 🎯 Key Features Demonstrated

### 1. **Elegant Destructuring Syntax**
The signature feature that makes SDI unique:
```javascript
class Service {
    constructor({ dep1, dep2, dep3 }) {
        // Dependencies automatically resolved and injected
    }
}
```

### 2. **Service Tags and Discovery**
Organize and discover services by tags with enhanced API:
```javascript
// Register services with multiple tags efficiently
container.register(PaymentService, 'stripePayment')
    .withTags('payment', 'strategy', 'card')
    .asSingleton();

container.register(EmailService, 'emailService')
    .withTags('notification', 'communication', 'email')
    .asSingleton();

// Discover services by tags with AND/OR modes
const paymentServices = container.getServicesByTags(['payment', 'strategy'], 'AND');
const communicationServices = container.getServicesByTags(['email', 'sms'], 'OR');

// Get just service names
const serviceNames = container.getServiceNamesByTags(['notification'], 'AND');

// Resolve services directly
const resolvedServices = container.resolveServicesByTags(['payment'], 'AND');

// Get all unique tags
const allTags = container.getAllTags();

// Get services grouped by tag
const servicesByTag = container.getServicesByTag();
```

### 3. **Complete Tag Discovery API**
SDI provides a comprehensive set of methods for tag-based service discovery:

| Method | Description | Returns |
|--------|-------------|---------|
| `getServicesByTags(tags, mode)` | Find services by tags | Array of service info objects |
| `getServiceNamesByTags(tags, mode)` | Get just service names | Array of strings |
| `resolveServicesByTags(tags, mode, scope)` | Resolve services directly | Array of resolved instances |
| `getAllTags()` | Get all unique tags | Sorted array of tag names |
| `getServicesByTag()` | Group services by tag | Object mapping tags to service arrays |
| `withTags(...tags)` | Add multiple tags to service | ServiceBuilder for chaining |

**Search Modes:**
- `'AND'` - Service must have ALL specified tags
- `'OR'` - Service must have ANY of the specified tags

### 4. **Scoped Services**
Perfect for web applications:
```javascript
const requestScope = container.createScope('request');
requestScope.scoped('userSession', UserSession);
// Automatic cleanup when scope is disposed
```

### 5. **Factory Functions**
Dynamic service creation:
```javascript
container.factory('service', ({ config, env }) => {
    return env === 'prod' ? new ProdService(config) : new DevService(config);
});
```

### 6. **Lifecycle Hooks**
Monitor and enhance service creation:
```javascript
container.addHook('beforeCreate', (name, type) => console.log(`Creating ${name}`));
container.addHook('afterResolve', (name, instance) => setupMonitoring(instance));
```

## 🏗️ Architecture Patterns

### Layered Architecture
```
Controllers → Services → Repositories → Database
     ↓           ↓            ↓           ↓
   HTTP      Business      Data       Storage
  Layer       Logic       Access      Layer
```

### Microservices Communication
```
Service A → Service Registry → Service B
    ↓              ↓              ↓
Message Queue ← Circuit Breaker → Health Check
```

### Testing Pyramid
```
E2E Tests (Integration Container)
    ↓
Integration Tests (Mixed Real/Mock)
    ↓
Unit Tests (Full Mock Container)
```

## 🔧 Advanced Techniques

### 1. **Service Composition**
```javascript
// Compose complex services from simpler ones
const complexService = container.resolve('complexService');
// Automatically resolves: logger, cache, database, validator, etc.
```

### 2. **Conditional Registration**
```javascript
if (process.env.NODE_ENV === 'production') {
    container.singleton('analytics', ProductionAnalytics);
} else {
    container.singleton('analytics', MockAnalytics);
}
```

### 3. **Service Overrides**
```javascript
// Override services for testing
container.override('emailService', MockEmailService);
```

### 4. **Multiple Containers**
```javascript
const mainContainer = createContainer();
const testContainer = createContainer();
const requestContainer = mainContainer.createScope('request');
```

## 📊 Performance Considerations

- **Singleton vs Transient**: Choose based on state requirements
- **Scoped Services**: Automatic cleanup prevents memory leaks
- **Factory Functions**: Lazy initialization for expensive services
- **Service Tags**: Efficient service discovery and organization

## 🔒 Security Features

- **Prototype Pollution Protection**: Built-in security against malicious inputs
- **Memory Limits**: Configurable limits prevent DoS attacks
- **Input Validation**: Comprehensive validation on all public methods
- **Safe Cloning**: Secure object cloning with fallbacks

## 🚨 Error Handling

All examples demonstrate proper error handling:
- **Circular Dependencies**: Clear error messages with dependency chain
- **Missing Services**: Helpful suggestions for typos
- **Validation Errors**: Detailed validation failure information
- **Resource Cleanup**: Proper disposal of resources in error scenarios

## 📈 Monitoring and Observability

Examples show how to implement:
- **Service Metrics**: Performance monitoring with hooks
- **Health Checks**: Service availability monitoring
- **Logging Integration**: Centralized logging with request correlation
- **Distributed Tracing**: Request tracking across services

## 🎓 Learning Path

**Beginner** → **Intermediate** → **Advanced** → **Expert**

1. Start with `01-basic/simple-di.js`
2. Move to `02-advanced/factory-functions.js`
3. Explore `03-patterns/strategy-pattern.js`
4. Study `05-web-app/express-integration.js`
5. Master `06-testing/mocking-and-testing.js`
6. Complete with `04-enterprise/microservices-communication.js`

## 💡 Best Practices

### Service Design
- Keep services focused and cohesive
- Use interfaces for better testability
- Implement proper error handling
- Design for dependency injection from the start

### Container Management
- Use scopes for request isolation
- Register services at application startup
- Dispose of scopes properly
- Monitor service creation and resolution

### Testing Strategy
- Use separate containers for testing
- Create comprehensive mock services
- Test both success and failure scenarios
- Verify service interactions

### Performance
- Use singletons for stateless services
- Use transients for stateful services
- Implement lazy loading with factories
- Monitor service creation performance

## 🤝 Contributing

Feel free to contribute additional examples! Each example should:
- Demonstrate a specific concept or pattern
- Include comprehensive comments
- Show both success and error scenarios
- Follow the established code style
- Include practical, real-world use cases

## 📞 Support

If you have questions about any example:
1. Check the inline comments for detailed explanations
2. Review the main README.md for API documentation
3. Look at similar patterns in other examples
4. Create an issue for clarification

---

**Happy coding with SDI!** 🚀 