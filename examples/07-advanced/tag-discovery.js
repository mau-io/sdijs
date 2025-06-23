/**
 * Advanced Tag-based Service Discovery Example
 * 
 * This example demonstrates advanced use cases for tag-based service discovery:
 * - Multi-layer architecture with tags
 * - Environment-specific service selection
 * - Plugin system with dynamic discovery
 * - Service composition based on tags
 * - Performance monitoring with tagged services
 */

import { createContainer } from '../../index.js';

const container = createContainer({ verbose: false });

// Configuration
container.value('config', {
    environment: 'development',
    features: {
        caching: true,
        monitoring: true,
        logging: true
    },
    database: {
        primary: 'postgresql',
        cache: 'redis'
    }
});

// ============ DATA LAYER SERVICES ============

class PostgreSQLRepository {
    constructor({ config }) {
        this.connectionString = config.database.primary;
        console.log('🐘 PostgreSQL repository initialized');
    }

    async findAll(table) {
        console.log(`📊 PostgreSQL: SELECT * FROM ${table}`);
        return [{ id: 1, name: 'PostgreSQL Data' }];
    }
}

class MongoRepository {
    constructor({ config }) {
        this.connectionString = config.database.mongo || 'mongodb://localhost';
        console.log('🍃 MongoDB repository initialized');
    }

    async findAll(collection) {
        console.log(`📊 MongoDB: db.${collection}.find({})`);
        return [{ _id: '507f1f77bcf86cd799439011', name: 'MongoDB Data' }];
    }
}

class RedisCache {
    constructor({ config }) {
        this.host = config.database.cache;
        console.log('🔴 Redis cache initialized');
    }

    async get(key) {
        console.log(`🔍 Redis GET: ${key}`);
        return null; // Cache miss simulation
    }

    async set(key, value) {
        console.log(`💾 Redis SET: ${key}`);
    }
}

class MemoryCache {
    constructor({}) {
        this.cache = new Map();
        console.log('🧠 Memory cache initialized');
    }

    async get(key) {
        console.log(`🔍 Memory GET: ${key}`);
        return this.cache.get(key);
    }

    async set(key, value) {
        console.log(`💾 Memory SET: ${key}`);
        this.cache.set(key, value);
    }
}

// Register data layer services
container.register(PostgreSQLRepository, 'postgresRepository')
    .withTags('repository', 'database', 'sql', 'production')
    .asSingleton();

container.register(MongoRepository, 'mongoRepository')
    .withTags('repository', 'database', 'nosql', 'development')
    .asSingleton();

container.register(RedisCache, 'redisCache')
    .withTags('cache', 'external', 'production')
    .asSingleton();

container.register(MemoryCache, 'memoryCache')
    .withTags('cache', 'internal', 'development')
    .asSingleton();

// ============ BUSINESS LOGIC LAYER ============

class UserService {
    constructor({ config }) {
        this.config = config;
        console.log('👤 User service initialized');
    }

    async getUsers() {
        console.log('📋 Getting all users');
        return [{ id: 1, name: 'John', email: 'john@example.com' }];
    }
}

class OrderService {
    constructor({ config }) {
        this.config = config;
        console.log('📦 Order service initialized');
    }

    async getOrders() {
        console.log('📋 Getting all orders');
        return [{ id: 1, userId: 1, total: 99.99 }];
    }
}

class PaymentService {
    constructor({ config }) {
        this.config = config;
        console.log('💳 Payment service initialized');
    }

    async processPayment(amount) {
        console.log(`💰 Processing payment: $${amount}`);
        return { success: true, transactionId: 'tx_123' };
    }
}

// Register business services
container.register(UserService, 'userService')
    .withTags('service', 'business', 'core')
    .asSingleton();

container.register(OrderService, 'orderService')
    .withTags('service', 'business', 'core')
    .asSingleton();

container.register(PaymentService, 'paymentService')
    .withTags('service', 'business', 'financial')
    .asSingleton();

// ============ INFRASTRUCTURE SERVICES ============

class FileLogger {
    constructor({ config }) {
        this.logFile = '/var/log/app.log';
        console.log('📄 File logger initialized');
    }

    log(level, message) {
        console.log(`📄 [${level.toUpperCase()}] ${message}`);
    }
}

class ConsoleLogger {
    constructor({}) {
        console.log('🖥️ Console logger initialized');
    }

    log(level, message) {
        console.log(`🖥️ [${level.toUpperCase()}] ${message}`);
    }
}

class MetricsCollector {
    constructor({ config }) {
        this.enabled = config.features.monitoring;
        console.log('📊 Metrics collector initialized');
    }

    track(event, data) {
        if (this.enabled) {
            console.log(`📊 METRIC: ${event}`, data);
        }
    }
}

class HealthChecker {
    constructor({}) {
        console.log('🏥 Health checker initialized');
    }

    async checkHealth() {
        return { status: 'healthy', timestamp: new Date().toISOString() };
    }
}

// Register infrastructure services
container.register(FileLogger, 'fileLogger')
    .withTags('logger', 'infrastructure', 'production')
    .asSingleton();

container.register(ConsoleLogger, 'consoleLogger')
    .withTags('logger', 'infrastructure', 'development')
    .asSingleton();

container.register(MetricsCollector, 'metricsCollector')
    .withTags('monitoring', 'infrastructure', 'optional')
    .asSingleton();

container.register(HealthChecker, 'healthChecker')
    .withTags('monitoring', 'infrastructure', 'core')
    .asSingleton();

// ============ PLUGIN SYSTEM ============

class EmailPlugin {
    constructor({}) {
        console.log('📧 Email plugin loaded');
    }

    getName() {
        return 'email';
    }

    async execute(action, data) {
        console.log(`📧 Email plugin: ${action}`, data);
        return { success: true };
    }
}

class SmsPlugin {
    constructor({}) {
        console.log('📱 SMS plugin loaded');
    }

    getName() {
        return 'sms';
    }

    async execute(action, data) {
        console.log(`📱 SMS plugin: ${action}`, data);
        return { success: true };
    }
}

class PushNotificationPlugin {
    constructor({}) {
        console.log('🔔 Push notification plugin loaded');
    }

    getName() {
        return 'push';
    }

    async execute(action, data) {
        console.log(`🔔 Push plugin: ${action}`, data);
        return { success: true };
    }
}

// Register plugins
container.register(EmailPlugin, 'emailPlugin')
    .withTags('plugin', 'notification', 'email')
    .asSingleton();

container.register(SmsPlugin, 'smsPlugin')
    .withTags('plugin', 'notification', 'sms')
    .asSingleton();

container.register(PushNotificationPlugin, 'pushPlugin')
    .withTags('plugin', 'notification', 'push')
    .asSingleton();

// ============ SERVICE DISCOVERY AND COMPOSITION ============

class ServiceDiscovery {
    constructor() {
        console.log('🔍 Service discovery initialized');
    }

    // Get services by environment
    getServicesByEnvironment(container, environment) {
        console.log(`\n🌍 Discovering services for environment: ${environment}`);
        
        const services = container.getServicesByTags([environment], 'AND');
        return services.map(service => ({
            name: service.name,
            tags: service.tags,
            categories: service.tags.filter(tag => 
                !['development', 'production', 'staging'].includes(tag)
            )
        }));
    }

    // Get services by layer
    getServicesByLayer(container, layer) {
        console.log(`\n🏗️ Discovering services for layer: ${layer}`);
        
        const layerTags = {
            'data': ['repository', 'cache', 'database'],
            'business': ['service', 'business'],
            'infrastructure': ['logger', 'monitoring', 'infrastructure']
        };

        const tags = layerTags[layer] || [layer];
        return container.getServicesByTags(tags, 'OR');
    }

    // Get all plugins
    getPlugins(container) {
        console.log(`\n🔌 Discovering plugins...`);
        
        const plugins = container.resolveServicesByTags(['plugin'], 'AND');
        return plugins.map(plugin => ({
            name: plugin.instance.getName(),
            serviceName: plugin.name,
            tags: plugin.tags,
            instance: plugin.instance
        }));
    }

    // Get services with specific capabilities
    getServicesByCapability(container, capability) {
        console.log(`\n⚡ Finding services with capability: ${capability}`);
        
        return container.getServicesByTags([capability], 'AND');
    }

    // Generate architecture overview
    generateArchitectureOverview(container) {
        console.log(`\n🏛️ Generating architecture overview...`);
        
        const allTags = container.getAllTags();
        const servicesByTag = container.getServicesByTag();
        
        const layers = ['repository', 'service', 'infrastructure', 'plugin'];
        const environments = ['development', 'production'];
        
        const overview = {
            totalServices: container.getServiceNames().length,
            totalTags: allTags.length,
            layers: {},
            environments: {},
            capabilities: {}
        };

        // Analyze layers
        layers.forEach(layer => {
            if (servicesByTag[layer]) {
                overview.layers[layer] = servicesByTag[layer].length;
            }
        });

        // Analyze environments
        environments.forEach(env => {
            if (servicesByTag[env]) {
                overview.environments[env] = servicesByTag[env].length;
            }
        });

        // Analyze capabilities
        const capabilities = allTags.filter(tag => 
            !layers.includes(tag) && 
            !environments.includes(tag) &&
            !['core', 'optional', 'external', 'internal'].includes(tag)
        );
        
        capabilities.forEach(capability => {
            if (servicesByTag[capability]) {
                overview.capabilities[capability] = servicesByTag[capability].length;
            }
        });

        return overview;
    }
}

container.singleton(ServiceDiscovery);

// ============ APPLICATION ORCHESTRATOR ============

class ApplicationOrchestrator {
    constructor({ serviceDiscovery, config }) {
        this.serviceDiscovery = serviceDiscovery;
        this.config = config;
        console.log('🎭 Application orchestrator initialized');
    }

    async initializeApplication(container) {
        console.log('\n🚀 Initializing application...');

        // Get environment-specific services
        const environmentServices = this.serviceDiscovery.getServicesByEnvironment(
            container, 
            this.config.environment
        );

        console.log(`\n📋 Environment services (${this.config.environment}):`);
        environmentServices.forEach(service => {
            console.log(`  - ${service.name}: [${service.categories.join(', ')}]`);
        });

        // Initialize core business services
        const businessServices = container.resolveServicesByTags(['business', 'core'], 'AND');
        console.log(`\n💼 Initialized ${businessServices.length} core business services`);

        // Load plugins
        const plugins = this.serviceDiscovery.getPlugins(container);
        console.log(`\n🔌 Loaded ${plugins.length} plugins:`);
        plugins.forEach(plugin => {
            console.log(`  - ${plugin.name} (${plugin.serviceName})`);
        });

        // Setup monitoring if enabled
        if (this.config.features.monitoring) {
            const monitoringServices = container.resolveServicesByTags(['monitoring'], 'AND');
            console.log(`\n📊 Monitoring enabled: ${monitoringServices.length} services`);
        }

        return {
            environment: this.config.environment,
            businessServices: businessServices.length,
            plugins: plugins.length,
            monitoring: this.config.features.monitoring
        };
    }

    async executeWorkflow(container, workflowName) {
        console.log(`\n⚡ Executing workflow: ${workflowName}`);

        // Get required services based on workflow
        const workflowServices = {
            'user-registration': ['service', 'notification'],
            'order-processing': ['service', 'financial', 'notification'],
            'system-maintenance': ['monitoring', 'infrastructure']
        };

        const requiredTags = workflowServices[workflowName] || ['service'];
        const services = container.resolveServicesByTags(requiredTags, 'OR');

        console.log(`📋 Using ${services.length} services for workflow`);
        
        // Simulate workflow execution
        for (const service of services) {
            console.log(`  ✓ Service: ${service.name} [${service.tags.join(', ')}]`);
        }

        return { workflow: workflowName, servicesUsed: services.length };
    }
}

container.singleton(ApplicationOrchestrator);

// ============ MAIN DEMONSTRATION ============

async function main() {
    try {
        console.log('=== Advanced Tag-based Service Discovery Example ===\n');

        const serviceDiscovery = container.resolve('serviceDiscovery');
        const orchestrator = container.resolve('applicationOrchestrator');

        // 1. Architecture Overview
        console.log('📊 === ARCHITECTURE OVERVIEW ===');
        const overview = serviceDiscovery.generateArchitectureOverview(container);
        console.log(JSON.stringify(overview, null, 2));

        // 2. Environment-specific Discovery
        console.log('\n🌍 === ENVIRONMENT-SPECIFIC DISCOVERY ===');
        const devServices = serviceDiscovery.getServicesByEnvironment(container, 'development');
        const prodServices = serviceDiscovery.getServicesByEnvironment(container, 'production');
        
        console.log(`Development services: ${devServices.length}`);
        console.log(`Production services: ${prodServices.length}`);

        // 3. Layer-based Discovery
        console.log('\n🏗️ === LAYER-BASED DISCOVERY ===');
        const dataLayer = serviceDiscovery.getServicesByLayer(container, 'data');
        const businessLayer = serviceDiscovery.getServicesByLayer(container, 'business');
        const infraLayer = serviceDiscovery.getServicesByLayer(container, 'infrastructure');

        console.log(`Data layer: ${dataLayer.length} services`);
        console.log(`Business layer: ${businessLayer.length} services`);
        console.log(`Infrastructure layer: ${infraLayer.length} services`);

        // 4. Plugin Discovery
        console.log('\n🔌 === PLUGIN DISCOVERY ===');
        const plugins = serviceDiscovery.getPlugins(container);
        console.log(`Found ${plugins.length} plugins`);

        // Test plugin execution
        for (const plugin of plugins) {
            await plugin.instance.execute('test', { message: 'Hello from discovery!' });
        }

        // 5. Capability-based Discovery
        console.log('\n⚡ === CAPABILITY-BASED DISCOVERY ===');
        const notificationServices = serviceDiscovery.getServicesByCapability(container, 'notification');
        const monitoringServices = serviceDiscovery.getServicesByCapability(container, 'monitoring');
        
        console.log(`Notification capabilities: ${notificationServices.length} services`);
        console.log(`Monitoring capabilities: ${monitoringServices.length} services`);

        // 6. Application Initialization
        console.log('\n🚀 === APPLICATION INITIALIZATION ===');
        const initResult = await orchestrator.initializeApplication(container);
        console.log('Initialization result:', initResult);

        // 7. Workflow Execution
        console.log('\n⚡ === WORKFLOW EXECUTION ===');
        const workflows = ['user-registration', 'order-processing', 'system-maintenance'];
        
        for (const workflow of workflows) {
            const result = await orchestrator.executeWorkflow(container, workflow);
            console.log(`${workflow} result:`, result);
        }

        // 8. Advanced Tag Queries
        console.log('\n🔍 === ADVANCED TAG QUERIES ===');
        
        // Find services that are both core AND production-ready
        const coreProductionServices = container.getServicesByTags(['core', 'production'], 'AND');
        console.log(`\nCore + Production services: ${coreProductionServices.length}`);
        coreProductionServices.forEach(service => {
            console.log(`  - ${service.name}: [${service.tags.join(', ')}]`);
        });

        // Find services that provide caching OR logging
        const utilityServices = container.getServicesByTags(['cache', 'logger'], 'OR');
        console.log(`\nUtility services (cache OR logger): ${utilityServices.length}`);
        utilityServices.forEach(service => {
            console.log(`  - ${service.name}: [${service.tags.join(', ')}]`);
        });

        // Get all tags and group analysis
        console.log('\n📊 === TAG ANALYSIS ===');
        const allTags = container.getAllTags();
        const groupedServices = container.getServicesByTag();
        
        console.log(`\nTotal unique tags: ${allTags.length}`);
        console.log('All tags:', allTags);
        
        console.log('\nServices per tag:');
        Object.entries(groupedServices).forEach(([tag, services]) => {
            console.log(`  ${tag}: ${services.length} services`);
        });

        console.log('\n✅ Advanced tag-based service discovery completed!');

        // ============ ADVANCED TAG DISCOVERY USE CASES ============
        console.log('\n🔬 === ADVANCED TAG DISCOVERY USE CASES ===');

        // Use Case 1: Environment-specific service resolution
        console.log('\n🌍 Use Case 1: Environment-specific service resolution');
        const currentEnv = container.resolve('config').environment;
        const envServices = container.resolveServicesByTags([currentEnv], 'AND');
        console.log(`Resolved ${envServices.length} services for ${currentEnv} environment:`);
        envServices.forEach(service => {
            console.log(`  ✓ ${service.name} [${service.tags.join(', ')}]`);
        });

        // Use Case 2: Feature-based service discovery
        console.log('\n⚡ Use Case 2: Feature-based capability discovery');
        const capabilities = ['cache', 'logger', 'monitoring'];
        capabilities.forEach(capability => {
            const capabilityServices = container.getServiceNamesByTags([capability], 'AND');
            console.log(`  ${capability}: ${capabilityServices.length} services [${capabilityServices.join(', ')}]`);
        });

        // Use Case 3: Service composition by tags
        console.log('\n🔧 Use Case 3: Dynamic service composition');
        const compositionRules = [
            { name: 'Data Layer', tags: ['repository', 'cache'], mode: 'OR' },
            { name: 'Business Layer', tags: ['service', 'business'], mode: 'AND' },
            { name: 'Infrastructure Layer', tags: ['infrastructure'], mode: 'AND' },
            { name: 'Plugin System', tags: ['plugin'], mode: 'AND' }
        ];
        
        compositionRules.forEach(rule => {
            const services = container.getServicesByTags(rule.tags, rule.mode);
            console.log(`  ${rule.name}: ${services.length} services (${rule.mode} mode)`);
        });

        // Use Case 4: Conditional service loading
        console.log('\n🔀 Use Case 4: Conditional service loading based on tags');
        const conditionalLoading = {
            'Development Tools': ['development'],
            'Production Services': ['production'],
            'Optional Features': ['optional'],
            'Core Services': ['core']
        };
        
        Object.entries(conditionalLoading).forEach(([category, tags]) => {
            const services = container.getServicesByTags(tags, 'AND');
            const shouldLoad = services.length > 0;
            console.log(`  ${category}: ${shouldLoad ? '✅ LOAD' : '❌ SKIP'} (${services.length} services)`);
        });

        // Use Case 5: Service health monitoring by tags
        console.log('\n🏥 Use Case 5: Service health monitoring');
        const healthMonitoringServices = container.resolveServicesByTags(['monitoring'], 'AND');
        console.log(`Health monitoring with ${healthMonitoringServices.length} services:`);
        
        for (const service of healthMonitoringServices) {
            if (service.instance.checkHealth) {
                const health = await service.instance.checkHealth();
                console.log(`  ${service.name}: ${health.status} (${health.timestamp})`);
            } else {
                console.log(`  ${service.name}: Available for monitoring`);
            }
        }

        // Use Case 6: Plugin ecosystem management
        console.log('\n🔌 Use Case 6: Plugin ecosystem management');
        const pluginEcosystem = container.getServicesByTag();
        const pluginCategories = Object.keys(pluginEcosystem).filter(tag => 
            pluginEcosystem[tag].some(serviceName => 
                container.resolve(serviceName).getName ? true : false
            )
        );
        
        console.log(`Plugin categories available: [${pluginCategories.join(', ')}]`);
        
        // Execute all notification plugins
        const notificationPlugins = container.resolveServicesByTags(['notification', 'plugin'], 'AND');
        console.log(`\nExecuting ${notificationPlugins.length} notification plugins:`);
        
        for (const plugin of notificationPlugins) {
            if (plugin.instance.execute) {
                const result = await plugin.instance.execute('broadcast', { 
                    message: 'System maintenance scheduled',
                    priority: 'high'
                });
                console.log(`  ✓ ${plugin.instance.getName()}: ${result.success ? 'Success' : 'Failed'}`);
            }
        }

        // Use Case 7: Performance analysis by service categories
        console.log('\n📊 Use Case 7: Performance analysis by categories');
        const performanceAnalysis = {};
        const allTagsForAnalysis = container.getAllTags();
        
        allTagsForAnalysis.forEach(tag => {
            const taggedServices = container.getServiceNamesByTags([tag], 'AND');
            performanceAnalysis[tag] = {
                count: taggedServices.length,
                services: taggedServices
            };
        });
        
        // Show top categories
        const topCategories = Object.entries(performanceAnalysis)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 5);
            
        console.log('Top service categories:');
        topCategories.forEach(([tag, data], index) => {
            console.log(`  ${index + 1}. ${tag}: ${data.count} services`);
        });

        // Use Case 8: Dynamic service discovery for workflows
        console.log('\n⚡ Use Case 8: Dynamic workflow service discovery');
        const dynamicWorkflows = {
            'user-onboarding': ['service', 'notification'],
            'data-processing': ['repository', 'cache'],
            'system-monitoring': ['monitoring', 'infrastructure'],
            'payment-processing': ['financial', 'service']
        };
        
        Object.entries(dynamicWorkflows).forEach(([workflow, requiredTags]) => {
            const availableServices = container.getServicesByTags(requiredTags, 'OR');
            const readiness = availableServices.length >= requiredTags.length ? '✅ READY' : '⚠️ PARTIAL';
            console.log(`  ${workflow}: ${readiness} (${availableServices.length}/${requiredTags.length} services)`);
        });

        console.log('\n🎯 === TAG DISCOVERY SUMMARY ===');
        const finalSummary = {
            totalServices: container.getServiceNames().length,
            totalTags: container.getAllTags().length,
            taggedServices: container.getServiceNames().filter(name => {
                const service = container._services.get(name);
                return service && service.tags.size > 0;
            }).length
        };
        
        console.log(`📈 Container Statistics:`);
        console.log(`   Total Services: ${finalSummary.totalServices}`);
        console.log(`   Total Unique Tags: ${finalSummary.totalTags}`);
        console.log(`   Tagged Services: ${finalSummary.taggedServices}`);
        console.log(`   Tag Coverage: ${((finalSummary.taggedServices / finalSummary.totalServices) * 100).toFixed(1)}%`);

        console.log('\n✨ All advanced tag discovery use cases completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

main(); 