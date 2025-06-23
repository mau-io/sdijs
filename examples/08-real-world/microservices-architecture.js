/**
 * Microservices Architecture Example
 * 
 * This example demonstrates how to use SDI for microservices architecture
 * with service discovery, load balancing, and inter-service communication.
 */

import SDI from '../../index.js';

// ============ SERVICE INTERFACES ============

class BaseService {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.status = 'initializing';
        this.startTime = Date.now();
        this.requestCount = 0;
    }

    async initialize() {
        console.log(`🚀 ${this.name} service starting...`);
        await this.simulateStartup();
        this.status = 'running';
        console.log(`✅ ${this.name} service ready`);
    }

    async simulateStartup() {
        // Simulate startup time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }

    getHealth() {
        return {
            service: this.name,
            status: this.status,
            uptime: Date.now() - this.startTime,
            requestCount: this.requestCount,
            timestamp: new Date().toISOString()
        };
    }

    incrementRequestCount() {
        this.requestCount++;
    }
}

// ============ USER SERVICE ============

class UserService extends BaseService {
    constructor({ database, cache, eventBus, config }) {
        super('UserService', config);
        this.database = database;
        this.cache = cache;
        this.eventBus = eventBus;
    }

    async createUser(userData) {
        this.incrementRequestCount();
        console.log(`👤 Creating user: ${userData.email}`);
        
        // Save to database
        const user = await this.database.save('users', {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString()
        });

        // Cache user data
        await this.cache.set(`user:${user.id}`, user, 3600);

        // Publish event
        await this.eventBus.publish('user.created', { userId: user.id, email: user.email });

        return user;
    }

    async getUser(userId) {
        this.incrementRequestCount();
        
        // Try cache first
        let user = await this.cache.get(`user:${userId}`);
        if (user) {
            console.log(`💾 User ${userId} retrieved from cache`);
            return user;
        }

        // Fallback to database
        user = await this.database.findById('users', userId);
        if (user) {
            await this.cache.set(`user:${userId}`, user, 3600);
            console.log(`🗄️ User ${userId} retrieved from database`);
        }

        return user;
    }
}

// ============ ORDER SERVICE ============

class OrderService extends BaseService {
    constructor({ database, userService, paymentService, eventBus, config }) {
        super('OrderService', config);
        this.database = database;
        this.userService = userService;
        this.paymentService = paymentService;
        this.eventBus = eventBus;
    }

    async createOrder(orderData) {
        this.incrementRequestCount();
        console.log(`📦 Creating order for user: ${orderData.userId}`);

        // Verify user exists
        const user = await this.userService.getUser(orderData.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Create order
        const order = await this.database.save('orders', {
            id: Date.now(),
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        // Process payment
        const payment = await this.paymentService.processPayment({
            orderId: order.id,
            amount: order.total,
            userId: order.userId
        });

        if (payment.success) {
            order.status = 'confirmed';
            order.paymentId = payment.id;
            await this.database.update('orders', order.id, order);
            
            // Publish event
            await this.eventBus.publish('order.confirmed', { 
                orderId: order.id, 
                userId: order.userId,
                total: order.total 
            });
        }

        return order;
    }

    async getOrder(orderId) {
        this.incrementRequestCount();
        return await this.database.findById('orders', orderId);
    }
}

// ============ PAYMENT SERVICE ============

class PaymentService extends BaseService {
    constructor({ database, eventBus, config }) {
        super('PaymentService', config);
        this.database = database;
        this.eventBus = eventBus;
    }

    async processPayment(paymentData) {
        this.incrementRequestCount();
        console.log(`💳 Processing payment for order: ${paymentData.orderId}`);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 200));

        const payment = {
            id: `pay_${Date.now()}`,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            status: Math.random() > 0.1 ? 'success' : 'failed', // 90% success rate
            processedAt: new Date().toISOString()
        };

        await this.database.save('payments', payment);

        // Publish event
        await this.eventBus.publish('payment.processed', {
            paymentId: payment.id,
            orderId: payment.orderId,
            status: payment.status
        });

        return {
            success: payment.status === 'success',
            id: payment.id,
            status: payment.status
        };
    }
}

// ============ NOTIFICATION SERVICE ============

class NotificationService extends BaseService {
    constructor({ eventBus, config }) {
        super('NotificationService', config);
        this.eventBus = eventBus;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.eventBus.subscribe('user.created', this.handleUserCreated.bind(this));
        this.eventBus.subscribe('order.confirmed', this.handleOrderConfirmed.bind(this));
        this.eventBus.subscribe('payment.processed', this.handlePaymentProcessed.bind(this));
    }

    async handleUserCreated(event) {
        this.incrementRequestCount();
        console.log(`📧 Sending welcome email to user: ${event.email}`);
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    async handleOrderConfirmed(event) {
        this.incrementRequestCount();
        console.log(`📱 Sending order confirmation for order: ${event.orderId}`);
        // Simulate notification sending
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    async handlePaymentProcessed(event) {
        this.incrementRequestCount();
        if (event.status === 'success') {
            console.log(`✅ Payment successful notification for order: ${event.orderId}`);
        } else {
            console.log(`❌ Payment failed notification for order: ${event.orderId}`);
        }
    }
}

// ============ INFRASTRUCTURE SERVICES ============

class Database {
    constructor({ config }) {
        this.config = config;
        this.data = new Map();
        this.collections = new Map();
        console.log(`🗄️ Database initialized (${config.type})`);
    }

    async save(collection, data) {
        if (!this.collections.has(collection)) {
            this.collections.set(collection, new Map());
        }
        this.collections.get(collection).set(data.id, data);
        return data;
    }

    async findById(collection, id) {
        const coll = this.collections.get(collection);
        return coll ? coll.get(id) : null;
    }

    async update(collection, id, data) {
        const coll = this.collections.get(collection);
        if (coll && coll.has(id)) {
            coll.set(id, data);
            return data;
        }
        return null;
    }

    getStats() {
        const stats = {};
        this.collections.forEach((data, collection) => {
            stats[collection] = data.size;
        });
        return stats;
    }
}

class Cache {
    constructor({ config }) {
        this.config = config;
        this.data = new Map();
        this.ttl = new Map();
        console.log(`💾 Cache initialized (${config.type})`);
    }

    async set(key, value, ttlSeconds = 3600) {
        this.data.set(key, value);
        this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
        return true;
    }

    async get(key) {
        if (!this.data.has(key)) return null;
        
        const expiry = this.ttl.get(key);
        if (Date.now() > expiry) {
            this.data.delete(key);
            this.ttl.delete(key);
            return null;
        }
        
        return this.data.get(key);
    }

    getStats() {
        return {
            keys: this.data.size,
            hitRate: Math.random() * 0.3 + 0.7 // Simulate 70-100% hit rate
        };
    }
}

class EventBus {
    constructor({ config }) {
        this.config = config;
        this.subscribers = new Map();
        this.eventCount = 0;
        console.log(`📡 EventBus initialized (${config.type})`);
    }

    subscribe(event, handler) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(handler);
    }

    async publish(event, data) {
        this.eventCount++;
        const handlers = this.subscribers.get(event) || [];
        console.log(`📢 Publishing event: ${event} (${handlers.length} subscribers)`);
        
        await Promise.all(handlers.map(handler => handler(data)));
    }

    getStats() {
        return {
            totalEvents: this.eventCount,
            subscribers: Array.from(this.subscribers.keys()).length
        };
    }
}

// ============ SERVICE REGISTRY ============

class ServiceRegistry {
    constructor({ config }) {
        this.config = config;
        this.services = new Map();
        this.healthChecks = new Map();
        console.log(`📋 Service Registry initialized`);
    }

    register(serviceName, serviceInstance) {
        this.services.set(serviceName, {
            instance: serviceInstance,
            registeredAt: Date.now(),
            lastHealthCheck: null
        });
        console.log(`📝 Registered service: ${serviceName}`);
    }

    async discoverServices(tags = []) {
        // This would typically query the container's tag discovery
        const availableServices = Array.from(this.services.keys());
        console.log(`🔍 Discovered services: [${availableServices.join(', ')}]`);
        return availableServices;
    }

    async healthCheck() {
        const results = new Map();
        
        for (const [name, service] of this.services) {
            try {
                const health = service.instance.getHealth();
                results.set(name, health);
                service.lastHealthCheck = Date.now();
            } catch (error) {
                results.set(name, {
                    service: name,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        }
        
        return results;
    }
}

// ============ LOAD BALANCER ============

class LoadBalancer {
    constructor({ serviceRegistry, config }) {
        this.serviceRegistry = serviceRegistry;
        this.config = config;
        this.requestCounts = new Map();
        console.log(`⚖️ Load Balancer initialized (${config.strategy})`);
    }

    async getService(serviceName) {
        // In a real implementation, this would select from multiple instances
        const service = this.serviceRegistry.services.get(serviceName);
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }

        // Track request distribution
        const count = this.requestCounts.get(serviceName) || 0;
        this.requestCounts.set(serviceName, count + 1);

        return service.instance;
    }

    getStats() {
        return {
            strategy: this.config.strategy,
            requestDistribution: Object.fromEntries(this.requestCounts)
        };
    }
}

// ============ MICROSERVICES ORCHESTRATOR ============

class MicroservicesOrchestrator {
    constructor({ container }) {
        this.container = container;
        this.services = new Map();
    }

    async initializeServices() {
        console.log('\n🏗️ === MICROSERVICES INITIALIZATION ===');
        
        // Get all business services
        const businessServices = this.container.getServicesByTags(['business'], 'AND');
        console.log(`Found ${businessServices.length} business services`);

        // Initialize services in dependency order
        const initOrder = ['UserService', 'PaymentService', 'OrderService', 'NotificationService'];
        
        for (const serviceName of initOrder) {
            const service = this.container.resolve(serviceName.toLowerCase());
            await service.initialize();
            this.services.set(serviceName, service);
        }

        console.log('✅ All microservices initialized');
    }

    async simulateWorkload() {
        console.log('\n📊 === SIMULATING MICROSERVICES WORKLOAD ===');

        const userService = this.services.get('UserService');
        const orderService = this.services.get('OrderService');

        // Create users
        const users = [];
        for (let i = 0; i < 3; i++) {
            const user = await userService.createUser({
                email: `user${i + 1}@example.com`,
                name: `User ${i + 1}`
            });
            users.push(user);
        }

        // Create orders
        const orders = [];
        for (let i = 0; i < 5; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            try {
                const order = await orderService.createOrder({
                    userId: user.id,
                    items: [`Item ${i + 1}`],
                    total: Math.floor(Math.random() * 200) + 50
                });
                orders.push(order);
            } catch (error) {
                console.log(`❌ Order creation failed: ${error.message}`);
            }
        }

        return { users, orders };
    }

    async getSystemHealth() {
        console.log('\n🏥 === SYSTEM HEALTH CHECK ===');
        
        const serviceRegistry = this.container.resolve('serviceRegistry');
        const healthResults = await serviceRegistry.healthCheck();
        
        console.log('Service Health Status:');
        healthResults.forEach((health, serviceName) => {
            const status = health.status === 'running' ? '✅' : '❌';
            console.log(`  ${status} ${serviceName}: ${health.status} (${health.requestCount} requests)`);
        });

        return healthResults;
    }

    async getSystemMetrics() {
        console.log('\n📈 === SYSTEM METRICS ===');
        
        const database = this.container.resolve('database');
        const cache = this.container.resolve('cache');
        const eventBus = this.container.resolve('eventBus');
        const loadBalancer = this.container.resolve('loadBalancer');

        const metrics = {
            database: database.getStats(),
            cache: cache.getStats(),
            eventBus: eventBus.getStats(),
            loadBalancer: loadBalancer.getStats()
        };

        console.log('Infrastructure Metrics:');
        console.log(`  Database: ${JSON.stringify(metrics.database)}`);
        console.log(`  Cache: ${JSON.stringify(metrics.cache)}`);
        console.log(`  EventBus: ${JSON.stringify(metrics.eventBus)}`);
        console.log(`  LoadBalancer: ${JSON.stringify(metrics.loadBalancer)}`);

        return metrics;
    }
}

// ============ MAIN EXECUTION ============

async function demonstrateMicroservicesArchitecture() {
    try {
        console.log('🚀 === MICROSERVICES ARCHITECTURE DEMO ===');
        
        const container = new SDI({ verbose: false });

        // Register configuration
        container.value('config', {
            database: { type: 'postgresql', host: 'localhost', port: 5432 },
            cache: { type: 'redis', host: 'localhost', port: 6379 },
            eventBus: { type: 'rabbitmq', host: 'localhost', port: 5672 },
            loadBalancer: { strategy: 'round-robin' }
        });

        // Register infrastructure services
        container.register(Database, 'database')
            .withTags('infrastructure', 'data', 'persistence')
            .asSingleton();

        container.register(Cache, 'cache')
            .withTags('infrastructure', 'performance', 'caching')
            .asSingleton();

        container.register(EventBus, 'eventBus')
            .withTags('infrastructure', 'messaging', 'async')
            .asSingleton();

        container.register(ServiceRegistry, 'serviceRegistry')
            .withTags('infrastructure', 'discovery', 'registry')
            .asSingleton();

        container.register(LoadBalancer, 'loadBalancer')
            .withTags('infrastructure', 'networking', 'balancing')
            .asSingleton();

        // Register business services
        container.register(UserService, 'userService')
            .withTags('business', 'domain', 'users', 'microservice')
            .asSingleton();

        container.register(OrderService, 'orderService')
            .withTags('business', 'domain', 'orders', 'microservice')
            .asSingleton();

        container.register(PaymentService, 'paymentService')
            .withTags('business', 'domain', 'payments', 'microservice')
            .asSingleton();

        container.register(NotificationService, 'notificationService')
            .withTags('business', 'domain', 'notifications', 'microservice')
            .asSingleton();

        // Register services with service registry
        const serviceRegistry = container.resolve('serviceRegistry');
        const microservices = container.getServicesByTags(['microservice'], 'AND');
        
        microservices.forEach(service => {
            const instance = container.resolve(service.name);
            serviceRegistry.register(service.name, instance);
        });

        // Initialize orchestrator
        const orchestrator = new MicroservicesOrchestrator({ container });
        await orchestrator.initializeServices();

        // Simulate workload
        const workloadResults = await orchestrator.simulateWorkload();
        console.log(`\n📊 Workload completed: ${workloadResults.users.length} users, ${workloadResults.orders.length} orders`);

        // Health check
        await orchestrator.getSystemHealth();

        // System metrics
        await orchestrator.getSystemMetrics();

        // Service discovery demonstration
        console.log('\n🔍 === SERVICE DISCOVERY ===');
        const businessServices = container.getServicesByTags(['business'], 'AND');
        const infrastructureServices = container.getServicesByTags(['infrastructure'], 'AND');
        
        console.log(`Business Services: ${businessServices.length}`);
        businessServices.forEach(service => {
            console.log(`  - ${service.name}: [${Array.from(service.service.tags).join(', ')}]`);
        });

        console.log(`Infrastructure Services: ${infrastructureServices.length}`);
        infrastructureServices.forEach(service => {
            console.log(`  - ${service.name}: [${Array.from(service.service.tags).join(', ')}]`);
        });

        console.log('\n✅ Microservices architecture demonstration completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Execute the demo
demonstrateMicroservicesArchitecture(); 