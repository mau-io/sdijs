# 🌍 Real-World Examples

This directory contains comprehensive, production-ready examples that demonstrate how to use SDI's tag discovery capabilities for real-world architectural patterns and enterprise scenarios.

## 📁 Examples Overview

### 🏗️ [`microservices-architecture.js`](./microservices-architecture.js)
**Complete microservices architecture implementation**

Demonstrates how to build a scalable microservices system using SDI's tag discovery for service orchestration, health monitoring, and inter-service communication.

**Key Features:**
- Service registry and discovery
- Load balancing strategies
- Health monitoring
- Event-driven architecture
- Business service isolation
- Infrastructure service management

**Technologies Simulated:**
- PostgreSQL/MongoDB databases
- Redis/Memory caching
- RabbitMQ messaging
- Service mesh concepts

### 🔌 [`plugin-system.js`](./plugin-system.js)
**Dynamic plugin ecosystem with hot-loading**

Shows how to create a flexible plugin architecture that can discover, load, and manage plugins dynamically using tag-based service discovery.

**Key Features:**
- Dynamic plugin discovery
- Plugin lifecycle management
- Category-based plugin execution
- Plugin health monitoring
- Hot-reload capabilities
- Plugin dependency resolution

**Plugin Types Included:**
- Notification plugins (Email, SMS, Push)
- Analytics plugins (Google Analytics, Mixpanel)
- Storage plugins (AWS S3, local storage)
- Authentication plugins
- Payment processing plugins

### 🌍 [`environment-management.js`](./environment-management.js)
**Multi-environment service management**

Demonstrates how to manage different deployment environments (development, staging, production) with environment-specific service configurations and automatic service loading.

**Key Features:**
- Environment-specific service loading
- Configuration management per environment
- Service health validation per environment
- Environment switching capabilities
- Service compatibility checking

**Environments Covered:**
- **Development**: SQLite, Memory cache, Console logging, Mock services
- **Staging**: PostgreSQL, Redis, File logging, Real services with test data
- **Production**: PostgreSQL HA, Redis Cluster, Audit logging, Production services

### 📊 [`performance-analysis.js`](./performance-analysis.js)
**Comprehensive performance monitoring and analysis**

Shows how to implement performance monitoring, benchmarking, and optimization using tag-based service categorization for different performance characteristics.

**Key Features:**
- Service performance categorization
- Automated benchmarking
- Load testing capabilities
- Memory usage analysis
- Performance trend analysis
- Bottleneck identification

**Performance Categories:**
- **Fast Services**: Sub-10ms operations
- **Slow Services**: Heavy computational tasks
- **I/O Services**: Database and network operations
- **Memory Services**: Caching and data storage

### 🏥 [`health-monitoring.js`](./health-monitoring.js)
**Enterprise-grade health monitoring system**

Implements a comprehensive health monitoring solution that automatically discovers services, monitors their health, and provides alerting capabilities.

**Key Features:**
- Automatic service discovery for monitoring
- Health check automation
- Alert management system
- Health trend analysis
- Service dependency monitoring
- Performance threshold monitoring

**Monitoring Capabilities:**
- Database connection health
- Cache performance monitoring
- External API availability
- Message queue health
- Memory usage tracking
- Response time analysis

## 🚀 Running the Examples

### Prerequisites
```bash
# From the examples directory
npm install
```

### Individual Examples
```bash
# Microservices architecture
npm run example:microservices-arch

# Plugin system
npm run example:plugin-system

# Environment management
npm run example:environment-mgmt

# Performance analysis
npm run example:performance-analysis

# Health monitoring
npm run example:health-monitoring
```

### Run All Real-World Examples
```bash
npm run example:real-world-all
```

## 🎯 Key Learning Objectives

### 1. **Tag-Based Architecture Patterns**
Learn how to use tags to organize and discover services based on:
- **Functional categories** (business, infrastructure, integration)
- **Performance characteristics** (fast, slow, memory-intensive)
- **Environment requirements** (development, staging, production)
- **Criticality levels** (critical, optional, monitoring)

### 2. **Service Discovery Patterns**
Master advanced service discovery techniques:
```javascript
// Discover services by multiple criteria
const criticalServices = container.getServicesByTags(['critical', 'production'], 'AND');
const monitoringServices = container.getServicesByTags(['monitoring'], 'AND');
const fastServices = container.getServicesByTags(['fast', 'performance'], 'AND');

// Dynamic service composition
const workflowServices = container.getServicesByTags(['workflow', 'async'], 'OR');
```

### 3. **Enterprise Architecture Patterns**
Understand how to implement:
- **Microservices communication** with service discovery
- **Plugin architectures** with dynamic loading
- **Multi-tenant environments** with service isolation
- **Performance monitoring** with automated analysis
- **Health monitoring** with intelligent alerting

### 4. **Production-Ready Patterns**
Learn production considerations:
- Error handling and resilience
- Performance optimization
- Memory management
- Monitoring and observability
- Configuration management
- Security considerations

## 🏷️ Tag Discovery Patterns Used

### Service Categories
```javascript
// Business logic services
container.register(UserService, 'userService')
    .withTags('business', 'domain', 'users', 'core');

// Infrastructure services  
container.register(DatabaseService, 'database')
    .withTags('infrastructure', 'data', 'persistence', 'critical');

// Integration services
container.register(ExternalApiService, 'externalApi')
    .withTags('integration', 'external', 'network', 'optional');
```

### Performance Categories
```javascript
// Fast, optimized services
container.register(CacheService, 'cache')
    .withTags('performance', 'fast', 'memory', 'optimization');

// Heavy computational services
container.register(AnalyticsService, 'analytics')
    .withTags('performance', 'slow', 'computation', 'batch');
```

### Environment-Specific Services
```javascript
// Development environment
container.register(MockPaymentService, 'payment')
    .withTags('payment', 'development', 'mock', 'testing');

// Production environment
container.register(RealPaymentService, 'payment')
    .withTags('payment', 'production', 'secure', 'pci');
```

### Monitoring Categories
```javascript
// Critical services requiring monitoring
container.register(DatabaseService, 'database')
    .withTags('monitorable', 'critical', 'health-check', 'database');

// Performance-sensitive services
container.register(CacheService, 'cache')
    .withTags('monitorable', 'performance', 'metrics', 'cache');
```

## 🔧 Advanced Features Demonstrated

### 1. **Dynamic Service Discovery**
```javascript
// Discover services based on runtime conditions
const environment = process.env.NODE_ENV;
const envServices = container.getServicesByTags([environment], 'AND');

// Load balancing across similar services
const databaseServices = container.getServicesByTags(['database', 'available'], 'AND');
const selectedDB = loadBalancer.select(databaseServices);
```

### 2. **Plugin Architecture**
```javascript
// Discover and load plugins by category
const notificationPlugins = container.getServicesByTags(['plugin', 'notification'], 'AND');
for (const plugin of notificationPlugins) {
    await pluginManager.loadPlugin(plugin.name);
}

// Execute plugins by capability
const analyticsPlugins = container.getServicesByTags(['analytics', 'tracking'], 'AND');
await pluginManager.executePluginsByCategory('analytics', 'track', eventData);
```

### 3. **Health Monitoring**
```javascript
// Auto-discover monitorable services
const monitorableServices = container.getServicesByTags(['monitorable'], 'AND');
for (const service of monitorableServices) {
    healthMonitor.registerHealthCheck(service);
}

// Monitor by criticality
const criticalServices = container.getServicesByTags(['critical'], 'AND');
healthMonitor.setCheckInterval(criticalServices, 30000); // 30 seconds
```

### 4. **Performance Analysis**
```javascript
// Categorize services for performance testing
const performanceCategories = ['fast', 'slow', 'io', 'memory'];
for (const category of performanceCategories) {
    const services = container.getServicesByTags([category, 'performance'], 'AND');
    await performanceAnalyzer.benchmarkCategory(category, services);
}
```

## 📈 Production Considerations

### Scalability
- Services are designed to handle high load
- Connection pooling and resource management
- Efficient tag-based queries for large service counts

### Reliability
- Circuit breaker patterns for external services
- Health check implementations for all critical services
- Graceful degradation strategies

### Observability
- Comprehensive logging and metrics
- Performance monitoring and alerting
- Health status tracking and reporting

### Security
- Service isolation and access control
- Secure configuration management
- Audit logging for critical operations

## 🎓 Next Steps

After working through these examples, you'll be ready to:

1. **Design microservices architectures** using SDI's service discovery
2. **Implement plugin systems** for extensible applications
3. **Manage multi-environment deployments** with confidence
4. **Monitor and optimize performance** systematically
5. **Build production-ready systems** with comprehensive health monitoring

These examples provide the foundation for building enterprise-grade applications with proper service organization, discovery, and management using SDI's powerful tag-based architecture. 