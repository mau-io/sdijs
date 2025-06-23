/**
 * Microservices Communication Example
 * 
 * This example demonstrates:
 * - Service discovery and communication between microservices
 * - Circuit breaker pattern for resilience
 * - Message queuing with dependency injection
 * - Health checks and monitoring
 * - Configuration management across services
 */

import { createContainer } from '../../index.js';

// Service registry for microservices discovery
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.healthChecks = new Map();
        console.log('🌐 Service registry initialized');
    }

    register(serviceName, serviceInfo) {
        this.services.set(serviceName, {
            ...serviceInfo,
            registeredAt: new Date().toISOString(),
            lastHeartbeat: Date.now()
        });
        
        console.log(`📝 Registered service: ${serviceName} at ${serviceInfo.host}:${serviceInfo.port}`);
    }

    discover(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        
        // Check if service is healthy (heartbeat within last 30 seconds)
        if (Date.now() - service.lastHeartbeat > 30000) {
            throw new Error(`Service unhealthy: ${serviceName}`);
        }
        
        return service;
    }

    heartbeat(serviceName) {
        const service = this.services.get(serviceName);
        if (service) {
            service.lastHeartbeat = Date.now();
        }
    }

    getHealthyServices() {
        const healthy = [];
        const now = Date.now();
        
        for (const [name, service] of this.services.entries()) {
            if (now - service.lastHeartbeat <= 30000) {
                healthy.push({ name, ...service });
            }
        }
        
        return healthy;
    }

    unregister(serviceName) {
        this.services.delete(serviceName);
        console.log(`🗑️ Unregistered service: ${serviceName}`);
    }
}

// Circuit breaker for resilient service communication
class CircuitBreaker {
    constructor(serviceName, { threshold = 5, timeout = 60000, resetTimeout = 30000 } = {}) {
        this.serviceName = serviceName;
        this.threshold = threshold;
        this.timeout = timeout;
        this.resetTimeout = resetTimeout;
        
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        
        console.log(`⚡ Circuit breaker initialized for ${serviceName}`);
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log(`🔄 Circuit breaker for ${this.serviceName} is now HALF_OPEN`);
            } else {
                throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
            }
        }

        try {
            const result = await Promise.race([
                operation(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
                )
            ]);

            if (this.state === 'HALF_OPEN') {
                this.reset();
            }

            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            console.log(`🚨 Circuit breaker for ${this.serviceName} is now OPEN`);
        }
    }

    reset() {
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED';
        console.log(`✅ Circuit breaker for ${this.serviceName} is now CLOSED`);
    }

    getState() {
        return {
            serviceName: this.serviceName,
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime
        };
    }
}

// HTTP client for service-to-service communication
class ServiceHttpClient {
    constructor({ serviceRegistry }) {
        this.serviceRegistry = serviceRegistry;
        this.circuitBreakers = new Map();
        console.log('🌐 Service HTTP client initialized');
    }

    getCircuitBreaker(serviceName) {
        if (!this.circuitBreakers.has(serviceName)) {
            this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
        }
        return this.circuitBreakers.get(serviceName);
    }

    async call(serviceName, endpoint, options = {}) {
        const service = this.serviceRegistry.discover(serviceName);
        const circuitBreaker = this.getCircuitBreaker(serviceName);
        
        const operation = async () => {
            const url = `http://${service.host}:${service.port}${endpoint}`;
            console.log(`📡 Calling ${serviceName}: ${options.method || 'GET'} ${url}`);
            
            // Simulate HTTP call
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            
            // Simulate occasional failures
            if (Math.random() < 0.1) {
                throw new Error(`Network error calling ${serviceName}`);
            }
            
            return {
                status: 200,
                data: options.mockResponse || { message: 'Success', timestamp: new Date().toISOString() }
            };
        };

        return await circuitBreaker.execute(operation);
    }

    getCircuitBreakerStates() {
        const states = {};
        for (const [serviceName, breaker] of this.circuitBreakers.entries()) {
            states[serviceName] = breaker.getState();
        }
        return states;
    }
}

// Message queue for asynchronous communication
class MessageQueue {
    constructor() {
        this.queues = new Map();
        this.subscribers = new Map();
        console.log('📬 Message queue initialized');
    }

    createQueue(queueName) {
        if (!this.queues.has(queueName)) {
            this.queues.set(queueName, []);
            console.log(`📥 Created queue: ${queueName}`);
        }
    }

    publish(queueName, message) {
        this.createQueue(queueName);
        
        const envelope = {
            id: Math.random().toString(36).substr(2, 9),
            message,
            timestamp: new Date().toISOString(),
            attempts: 0
        };
        
        this.queues.get(queueName).push(envelope);
        console.log(`📤 Published message to ${queueName}: ${envelope.id}`);
        
        // Notify subscribers
        this.notifySubscribers(queueName, envelope);
        
        return envelope.id;
    }

    subscribe(queueName, handler) {
        if (!this.subscribers.has(queueName)) {
            this.subscribers.set(queueName, []);
        }
        
        this.subscribers.get(queueName).push(handler);
        console.log(`👂 Subscribed to queue: ${queueName}`);
    }

    async notifySubscribers(queueName, envelope) {
        const handlers = this.subscribers.get(queueName) || [];
        
        for (const handler of handlers) {
            try {
                await handler(envelope.message, envelope);
            } catch (error) {
                console.log(`❌ Handler failed for queue ${queueName}: ${error.message}`);
                envelope.attempts++;
                
                // Simple retry logic
                if (envelope.attempts < 3) {
                    setTimeout(() => this.notifySubscribers(queueName, envelope), 1000);
                }
            }
        }
    }

    getQueueStats() {
        const stats = {};
        for (const [queueName, messages] of this.queues.entries()) {
            stats[queueName] = {
                messageCount: messages.length,
                subscriberCount: (this.subscribers.get(queueName) || []).length
            };
        }
        return stats;
    }
}

// Configuration service for centralized config management
class ConfigurationService {
    constructor() {
        this.configs = new Map();
        this.watchers = new Map();
        console.log('⚙️ Configuration service initialized');
    }

    set(key, value, serviceName = 'global') {
        const configKey = `${serviceName}:${key}`;
        const oldValue = this.configs.get(configKey);
        
        this.configs.set(configKey, {
            value,
            updatedAt: new Date().toISOString(),
            serviceName
        });
        
        console.log(`⚙️ Configuration updated: ${configKey} = ${JSON.stringify(value)}`);
        
        // Notify watchers
        this.notifyWatchers(configKey, value, oldValue);
    }

    get(key, serviceName = 'global') {
        const configKey = `${serviceName}:${key}`;
        const config = this.configs.get(configKey);
        return config ? config.value : null;
    }

    watch(key, callback, serviceName = 'global') {
        const configKey = `${serviceName}:${key}`;
        
        if (!this.watchers.has(configKey)) {
            this.watchers.set(configKey, []);
        }
        
        this.watchers.get(configKey).push(callback);
        console.log(`👀 Watching configuration: ${configKey}`);
    }

    notifyWatchers(configKey, newValue, oldValue) {
        const callbacks = this.watchers.get(configKey) || [];
        
        for (const callback of callbacks) {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.log(`❌ Configuration watcher failed: ${error.message}`);
            }
        }
    }

    getAllConfigs() {
        const configs = {};
        for (const [key, config] of this.configs.entries()) {
            configs[key] = config;
        }
        return configs;
    }
}

// User service (microservice)
class UserService {
    constructor({ serviceHttpClient, messageQueue, configService }) {
        this.httpClient = serviceHttpClient;
        this.messageQueue = messageQueue;
        this.configService = configService;
        
        this.users = new Map([
            [1, { id: 1, name: 'John Doe', email: 'john@example.com' }],
            [2, { id: 2, name: 'Jane Smith', email: 'jane@example.com' }]
        ]);
        
        console.log('👤 User service initialized');
    }

    async getUser(id) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error(`User not found: ${id}`);
        }
        
        // Call notification service to log user access
        try {
            await this.httpClient.call('notification-service', '/log-access', {
                method: 'POST',
                mockResponse: { logged: true }
            });
        } catch (error) {
            console.log(`⚠️ Failed to log user access: ${error.message}`);
        }
        
        return user;
    }

    async createUser(userData) {
        const id = Math.max(...this.users.keys()) + 1;
        const user = { id, ...userData };
        
        this.users.set(id, user);
        
        // Publish user creation event
        this.messageQueue.publish('user.created', {
            userId: id,
            userData: user
        });
        
        console.log(`✅ User created: ${id}`);
        return user;
    }

    async updateUser(id, updates) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error(`User not found: ${id}`);
        }
        
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        
        // Publish user update event
        this.messageQueue.publish('user.updated', {
            userId: id,
            oldData: user,
            newData: updatedUser
        });
        
        console.log(`✅ User updated: ${id}`);
        return updatedUser;
    }
}

// Notification service (microservice)
class NotificationService {
    constructor({ serviceHttpClient, messageQueue, configService }) {
        this.httpClient = serviceHttpClient;
        this.messageQueue = messageQueue;
        this.configService = configService;
        this.accessLogs = [];
        
        // Subscribe to user events
        this.messageQueue.subscribe('user.created', this.handleUserCreated.bind(this));
        this.messageQueue.subscribe('user.updated', this.handleUserUpdated.bind(this));
        
        console.log('📧 Notification service initialized');
    }

    async logAccess(data) {
        this.accessLogs.push({
            ...data,
            timestamp: new Date().toISOString()
        });
        
        console.log('📝 User access logged');
        return { logged: true };
    }

    async handleUserCreated(message) {
        console.log(`📧 Sending welcome email for user ${message.userId}`);
        
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Call analytics service
        try {
            await this.httpClient.call('analytics-service', '/track-event', {
                method: 'POST',
                mockResponse: { tracked: true }
            });
        } catch (error) {
            console.log(`⚠️ Failed to track user creation: ${error.message}`);
        }
    }

    async handleUserUpdated(message) {
        console.log(`📧 Sending update notification for user ${message.userId}`);
        
        // Only send notification if email changed
        if (message.oldData.email !== message.newData.email) {
            console.log('📧 Email changed, sending verification email');
        }
    }

    getAccessLogs() {
        return [...this.accessLogs];
    }
}

// Analytics service (microservice)
class AnalyticsService {
    constructor({ messageQueue, configService }) {
        this.messageQueue = messageQueue;
        this.configService = configService;
        this.events = [];
        
        // Subscribe to all user events
        this.messageQueue.subscribe('user.created', this.trackUserEvent.bind(this));
        this.messageQueue.subscribe('user.updated', this.trackUserEvent.bind(this));
        
        console.log('📊 Analytics service initialized');
    }

    async trackEvent(eventData) {
        this.events.push({
            ...eventData,
            timestamp: new Date().toISOString()
        });
        
        console.log('📊 Event tracked');
        return { tracked: true };
    }

    async trackUserEvent(message, envelope) {
        const eventType = envelope.message === message ? 'user.created' : 'user.updated';
        
        this.events.push({
            type: eventType,
            userId: message.userId,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📊 User event tracked: ${eventType}`);
    }

    getAnalytics() {
        const analytics = {
            totalEvents: this.events.length,
            eventTypes: {},
            recentEvents: this.events.slice(-10)
        };
        
        for (const event of this.events) {
            analytics.eventTypes[event.type] = (analytics.eventTypes[event.type] || 0) + 1;
        }
        
        return analytics;
    }
}

// Health check service
class HealthCheckService {
    constructor({ serviceRegistry, serviceHttpClient }) {
        this.serviceRegistry = serviceRegistry;
        this.httpClient = serviceHttpClient;
        this.checks = new Map();
        
        console.log('🏥 Health check service initialized');
    }

    registerHealthCheck(serviceName, checkFunction) {
        this.checks.set(serviceName, checkFunction);
        console.log(`🏥 Registered health check for ${serviceName}`);
    }

    async checkHealth(serviceName) {
        const check = this.checks.get(serviceName);
        if (!check) {
            return { status: 'unknown', message: 'No health check registered' };
        }
        
        try {
            const result = await check();
            return { status: 'healthy', ...result };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkAllServices() {
        const results = {};
        
        for (const [serviceName, check] of this.checks.entries()) {
            results[serviceName] = await this.checkHealth(serviceName);
        }
        
        return results;
    }

    async performSystemHealthCheck() {
        const serviceHealth = await this.checkAllServices();
        const circuitBreakerStates = this.httpClient.getCircuitBreakerStates();
        const healthyServices = this.serviceRegistry.getHealthyServices();
        
        return {
            timestamp: new Date().toISOString(),
            overallStatus: Object.values(serviceHealth).every(h => h.status === 'healthy') ? 'healthy' : 'degraded',
            services: serviceHealth,
            circuitBreakers: circuitBreakerStates,
            registeredServices: healthyServices.length
        };
    }
}

// Create microservices container
function createMicroservicesContainer() {
    const container = createContainer();
    
    // Register core infrastructure services
    container.singleton('serviceRegistry', ServiceRegistry);
    container.singleton('serviceHttpClient', ServiceHttpClient);
    container.singleton('messageQueue', MessageQueue);
    container.singleton('configService', ConfigurationService);
    container.singleton('healthCheckService', HealthCheckService);
    
    // Register business services
    container.singleton('userService', UserService);
    container.singleton('notificationService', NotificationService);
    container.singleton('analyticsService', AnalyticsService);
    
    return container;
}

// Example usage
async function main() {
    try {
        console.log('=== Microservices Communication Example ===\n');

        const container = createMicroservicesContainer();
        
        // Initialize services
        const serviceRegistry = container.resolve('serviceRegistry');
        const configService = container.resolve('configService');
        const healthCheckService = container.resolve('healthCheckService');
        const userService = container.resolve('userService');
        const notificationService = container.resolve('notificationService');
        const analyticsService = container.resolve('analyticsService');
        const messageQueue = container.resolve('messageQueue');
        
        console.log('=== Service Registration ===');
        
        // Register services in service registry
        serviceRegistry.register('user-service', {
            host: 'localhost',
            port: 3001,
            version: '1.0.0',
            endpoints: ['/users', '/users/:id']
        });
        
        serviceRegistry.register('notification-service', {
            host: 'localhost',
            port: 3002,
            version: '1.0.0',
            endpoints: ['/log-access', '/send-email']
        });
        
        serviceRegistry.register('analytics-service', {
            host: 'localhost',
            port: 3003,
            version: '1.0.0',
            endpoints: ['/track-event', '/analytics']
        });
        
        console.log('\n=== Configuration Management ===');
        
        // Set some configurations
        configService.set('email.provider', 'sendgrid', 'notification-service');
        configService.set('analytics.enabled', true, 'analytics-service');
        configService.set('rate.limit', 100, 'global');
        
        // Watch for configuration changes
        configService.watch('rate.limit', (newValue, oldValue) => {
            console.log(`🔄 Rate limit changed from ${oldValue} to ${newValue}`);
        });
        
        console.log('\n=== Health Checks ===');
        
        // Register health checks
        healthCheckService.registerHealthCheck('user-service', async () => {
            return { message: 'User service is healthy', uptime: '24h' };
        });
        
        healthCheckService.registerHealthCheck('notification-service', async () => {
            return { message: 'Notification service is healthy', emailsQueued: 0 };
        });
        
        healthCheckService.registerHealthCheck('analytics-service', async () => {
            return { message: 'Analytics service is healthy', eventsProcessed: analyticsService.events.length };
        });
        
        console.log('\n=== Microservice Operations ===');
        
        // Simulate some operations that trigger inter-service communication
        console.log('\n1. Creating a new user...');
        const newUser = await userService.createUser({
            name: 'Alice Johnson',
            email: 'alice@example.com'
        });
        
        console.log('\n2. Getting user (triggers logging)...');
        const user = await userService.getUser(1);
        
        console.log('\n3. Updating user (triggers notifications)...');
        await userService.updateUser(1, {
            email: 'john.doe@example.com'
        });
        
        // Wait for async message processing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('\n=== System Status ===');
        
        // Check system health
        const systemHealth = await healthCheckService.performSystemHealthCheck();
        console.log('System Health:', JSON.stringify(systemHealth, null, 2));
        
        console.log('\n=== Message Queue Statistics ===');
        const queueStats = messageQueue.getQueueStats();
        console.log('Queue Stats:', queueStats);
        
        console.log('\n=== Analytics Report ===');
        const analytics = analyticsService.getAnalytics();
        console.log('Analytics:', JSON.stringify(analytics, null, 2));
        
        console.log('\n=== Access Logs ===');
        const accessLogs = notificationService.getAccessLogs();
        console.log('Access Logs:', accessLogs.length, 'entries');
        
        console.log('\n=== Configuration Dump ===');
        const allConfigs = configService.getAllConfigs();
        console.log('All Configurations:', JSON.stringify(allConfigs, null, 2));
        
        console.log('\n=== Simulating Configuration Change ===');
        configService.set('rate.limit', 200, 'global'); // This will trigger the watcher
        
        console.log('\n=== Testing Circuit Breaker ===');
        const httpClient = container.resolve('serviceHttpClient');
        
        // Simulate multiple failures to trigger circuit breaker
        for (let i = 0; i < 7; i++) {
            try {
                await httpClient.call('unreliable-service', '/test');
            } catch (error) {
                console.log(`Attempt ${i + 1} failed: ${error.message}`);
            }
        }
        
        const circuitStates = httpClient.getCircuitBreakerStates();
        console.log('Circuit Breaker States:', JSON.stringify(circuitStates, null, 2));
        
        console.log('\n✅ Microservices example completed');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Export for use in other files
export {
    ServiceRegistry,
    CircuitBreaker,
    ServiceHttpClient,
    MessageQueue,
    ConfigurationService,
    createMicroservicesContainer
};

// Run the example
main(); 