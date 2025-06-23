/**
 * Environment Management Example
 * 
 * This example demonstrates how to manage different environments
 * (development, staging, production) using SDI's tag discovery
 * for environment-specific service configuration and loading.
 */

import SDI from '../../index.js';

// ============ ENVIRONMENT CONFIGURATION ============

const ENVIRONMENTS = {
    development: {
        name: 'development',
        database: {
            host: 'localhost',
            port: 5432,
            name: 'myapp_dev',
            ssl: false,
            pool: { min: 2, max: 10 }
        },
        cache: {
            host: 'localhost',
            port: 6379,
            ttl: 300
        },
        logging: {
            level: 'debug',
            console: true,
            file: false
        },
        features: {
            debugMode: true,
            mockPayments: true,
            seedData: true,
            hotReload: true
        },
        external: {
            apiUrl: 'http://localhost:3001',
            timeout: 30000
        }
    },
    staging: {
        name: 'staging',
        database: {
            host: 'staging-db.example.com',
            port: 5432,
            name: 'myapp_staging',
            ssl: true,
            pool: { min: 5, max: 20 }
        },
        cache: {
            host: 'staging-redis.example.com',
            port: 6379,
            ttl: 600
        },
        logging: {
            level: 'info',
            console: true,
            file: true
        },
        features: {
            debugMode: false,
            mockPayments: false,
            seedData: false,
            hotReload: false
        },
        external: {
            apiUrl: 'https://staging-api.example.com',
            timeout: 15000
        }
    },
    production: {
        name: 'production',
        database: {
            host: 'prod-db.example.com',
            port: 5432,
            name: 'myapp_prod',
            ssl: true,
            pool: { min: 10, max: 50 }
        },
        cache: {
            host: 'prod-redis.example.com',
            port: 6379,
            ttl: 3600
        },
        logging: {
            level: 'warn',
            console: false,
            file: true
        },
        features: {
            debugMode: false,
            mockPayments: false,
            seedData: false,
            hotReload: false
        },
        external: {
            apiUrl: 'https://api.example.com',
            timeout: 10000
        }
    }
};

// ============ ENVIRONMENT-SPECIFIC SERVICES ============

// Database Services
class PostgreSQLDatabase {
    constructor({ config }) {
        this.config = config.database;
        this.environment = config.name;
        this.connectionPool = null;
    }

    async connect() {
        console.log(`🐘 Connecting to PostgreSQL (${this.environment})`);
        console.log(`   Host: ${this.config.host}:${this.config.port}`);
        console.log(`   Database: ${this.config.name}`);
        console.log(`   SSL: ${this.config.ssl ? 'enabled' : 'disabled'}`);
        
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 100));
        this.connectionPool = { connected: true, environment: this.environment };
        
        console.log(`✅ PostgreSQL connected (${this.environment})`);
        return this;
    }

    async query(sql, params = []) {
        if (!this.connectionPool) {
            throw new Error('Database not connected');
        }
        
        console.log(`🔍 Executing query in ${this.environment}: ${sql}`);
        
        // Simulate query execution
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return {
            rows: [{ id: 1, data: 'sample' }],
            rowCount: 1,
            environment: this.environment
        };
    }

    getStats() {
        return {
            environment: this.environment,
            connected: !!this.connectionPool,
            config: this.config
        };
    }
}

class SQLiteDatabase {
    constructor({ config }) {
        this.config = config.database;
        this.environment = config.name;
        this.db = null;
    }

    async connect() {
        console.log(`💾 Connecting to SQLite (${this.environment})`);
        console.log(`   File: ${this.config.file || ':memory:'}`);
        
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 50));
        this.db = { connected: true, environment: this.environment };
        
        console.log(`✅ SQLite connected (${this.environment})`);
        return this;
    }

    async query(sql, params = []) {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        
        console.log(`🔍 Executing SQLite query in ${this.environment}: ${sql}`);
        
        // Simulate query execution
        await new Promise(resolve => setTimeout(resolve, 20));
        
        return {
            rows: [{ id: 1, data: 'sample' }],
            rowCount: 1,
            environment: this.environment
        };
    }

    getStats() {
        return {
            environment: this.environment,
            connected: !!this.db,
            config: this.config
        };
    }
}

// Cache Services
class RedisCache {
    constructor({ config }) {
        this.config = config.cache;
        this.environment = config.name;
        this.client = null;
    }

    async connect() {
        console.log(`🔴 Connecting to Redis (${this.environment})`);
        console.log(`   Host: ${this.config.host}:${this.config.port}`);
        console.log(`   TTL: ${this.config.ttl}s`);
        
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 80));
        this.client = { connected: true, environment: this.environment };
        
        console.log(`✅ Redis connected (${this.environment})`);
        return this;
    }

    async set(key, value, ttl = null) {
        const effectiveTtl = ttl || this.config.ttl;
        console.log(`💾 Redis SET ${key} (TTL: ${effectiveTtl}s) in ${this.environment}`);
        
        // Simulate set operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
    }

    async get(key) {
        console.log(`🔍 Redis GET ${key} in ${this.environment}`);
        
        // Simulate get operation
        await new Promise(resolve => setTimeout(resolve, 5));
        return `cached_value_${key}_${this.environment}`;
    }

    getStats() {
        return {
            environment: this.environment,
            connected: !!this.client,
            config: this.config
        };
    }
}

class MemoryCache {
    constructor({ config }) {
        this.config = config.cache;
        this.environment = config.name;
        this.cache = new Map();
        this.ttl = new Map();
    }

    async connect() {
        console.log(`🧠 Memory cache initialized (${this.environment})`);
        console.log(`   TTL: ${this.config.ttl}s`);
        return this;
    }

    async set(key, value, ttl = null) {
        const effectiveTtl = ttl || this.config.ttl;
        console.log(`💾 Memory SET ${key} (TTL: ${effectiveTtl}s) in ${this.environment}`);
        
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + (effectiveTtl * 1000));
        return true;
    }

    async get(key) {
        console.log(`🔍 Memory GET ${key} in ${this.environment}`);
        
        if (!this.cache.has(key)) return null;
        
        const expiry = this.ttl.get(key);
        if (Date.now() > expiry) {
            this.cache.delete(key);
            this.ttl.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    getStats() {
        return {
            environment: this.environment,
            keys: this.cache.size,
            config: this.config
        };
    }
}

// Logger Services
class FileLogger {
    constructor({ config }) {
        this.config = config.logging;
        this.environment = config.name;
        this.logFile = `logs/${this.environment}.log`;
    }

    log(level, message, data = {}) {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${this.environment}] ${message}`;
            
            if (this.config.console) {
                console.log(logEntry, data);
            }
            
            if (this.config.file) {
                // Simulate file writing
                console.log(`📝 Writing to ${this.logFile}: ${logEntry}`);
            }
        }
    }

    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const configLevel = levels[this.config.level] || 1;
        const messageLevel = levels[level] || 1;
        return messageLevel >= configLevel;
    }

    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }

    getStats() {
        return {
            environment: this.environment,
            level: this.config.level,
            outputs: {
                console: this.config.console,
                file: this.config.file
            }
        };
    }
}

class ConsoleLogger {
    constructor({ config }) {
        this.config = config.logging;
        this.environment = config.name;
    }

    log(level, message, data = {}) {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const emoji = { debug: '🐛', info: 'ℹ️', warn: '⚠️', error: '❌' }[level] || 'ℹ️';
            console.log(`${emoji} [${this.environment}] ${message}`, data);
        }
    }

    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const configLevel = levels[this.config.level] || 1;
        const messageLevel = levels[level] || 1;
        return messageLevel >= configLevel;
    }

    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }

    getStats() {
        return {
            environment: this.environment,
            level: this.config.level,
            outputs: { console: true, file: false }
        };
    }
}

// Payment Services
class RealPaymentService {
    constructor({ config, logger }) {
        this.config = config;
        this.logger = logger;
        this.environment = config.name;
    }

    async processPayment(amount, paymentMethod) {
        this.logger.info(`Processing real payment: $${amount}`, { paymentMethod });
        
        // Simulate real payment processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const success = Math.random() > 0.05; // 95% success rate
        const result = {
            id: `real_${Date.now()}`,
            amount,
            paymentMethod,
            success,
            environment: this.environment,
            processedAt: new Date().toISOString()
        };
        
        if (success) {
            this.logger.info(`Payment successful: ${result.id}`);
        } else {
            this.logger.error(`Payment failed: ${result.id}`);
        }
        
        return result;
    }

    getStats() {
        return {
            environment: this.environment,
            type: 'real',
            features: this.config.features
        };
    }
}

class MockPaymentService {
    constructor({ config, logger }) {
        this.config = config;
        this.logger = logger;
        this.environment = config.name;
    }

    async processPayment(amount, paymentMethod) {
        this.logger.debug(`Processing mock payment: $${amount}`, { paymentMethod });
        
        // Simulate instant mock processing
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const result = {
            id: `mock_${Date.now()}`,
            amount,
            paymentMethod,
            success: true, // Always succeed in mock
            environment: this.environment,
            processedAt: new Date().toISOString(),
            mock: true
        };
        
        this.logger.debug(`Mock payment completed: ${result.id}`);
        return result;
    }

    getStats() {
        return {
            environment: this.environment,
            type: 'mock',
            features: this.config.features
        };
    }
}

// External API Services
class ExternalApiService {
    constructor({ config, logger }) {
        this.config = config.external;
        this.logger = logger;
        this.environment = config.name;
    }

    async makeRequest(endpoint, data = {}) {
        const url = `${this.config.apiUrl}${endpoint}`;
        this.logger.info(`Making API request to ${url}`, { environment: this.environment });
        
        // Simulate API call with timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        );
        
        const requestPromise = new Promise(resolve => 
            setTimeout(() => resolve({
                url,
                data,
                environment: this.environment,
                timestamp: new Date().toISOString()
            }), Math.random() * 200)
        );
        
        try {
            const result = await Promise.race([requestPromise, timeoutPromise]);
            this.logger.info(`API request successful: ${endpoint}`);
            return result;
        } catch (error) {
            this.logger.error(`API request failed: ${endpoint}`, { error: error.message });
            throw error;
        }
    }

    getStats() {
        return {
            environment: this.environment,
            apiUrl: this.config.apiUrl,
            timeout: this.config.timeout
        };
    }
}

// ============ ENVIRONMENT MANAGER ============

class EnvironmentManager {
    constructor({ container }) {
        this.container = container;
        this.currentEnvironment = null;
        this.loadedServices = new Map();
    }

    async loadEnvironment(environmentName) {
        console.log(`\n🌍 === LOADING ENVIRONMENT: ${environmentName.toUpperCase()} ===`);
        
        const config = ENVIRONMENTS[environmentName];
        if (!config) {
            throw new Error(`Unknown environment: ${environmentName}`);
        }

        this.currentEnvironment = environmentName;
        
        // Register environment-specific configuration
        this.container.value('environmentConfig', config);
        
        // Discover and load environment-specific services
        const envServices = this.container.getServicesByTags([environmentName], 'AND');
        console.log(`Found ${envServices.length} services for ${environmentName} environment`);
        
        // Initialize services
        const initPromises = envServices.map(async service => {
            try {
                const instance = this.container.resolve(service.name);
                
                // Connect services that have a connect method
                if (typeof instance.connect === 'function') {
                    await instance.connect();
                }
                
                this.loadedServices.set(service.name, instance);
                return { name: service.name, success: true };
            } catch (error) {
                console.error(`❌ Failed to load ${service.name}:`, error.message);
                return { name: service.name, success: false, error: error.message };
            }
        });
        
        const results = await Promise.all(initPromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);
        
        console.log(`✅ Environment loaded: ${successful}/${results.length} services successful`);
        if (failed.length > 0) {
            console.log(`❌ Failed services: ${failed.map(f => f.name).join(', ')}`);
        }
        
        return { successful, failed: failed.length, environment: environmentName };
    }

    async switchEnvironment(newEnvironment) {
        console.log(`\n🔄 === SWITCHING FROM ${this.currentEnvironment?.toUpperCase()} TO ${newEnvironment.toUpperCase()} ===`);
        
        // Cleanup current environment
        if (this.currentEnvironment) {
            await this.cleanupEnvironment();
        }
        
        // Load new environment
        return await this.loadEnvironment(newEnvironment);
    }

    async cleanupEnvironment() {
        console.log(`🧹 Cleaning up ${this.currentEnvironment} environment`);
        
        // Disconnect services that have a disconnect method
        for (const [name, service] of this.loadedServices) {
            if (typeof service.disconnect === 'function') {
                try {
                    await service.disconnect();
                    console.log(`🔌 Disconnected ${name}`);
                } catch (error) {
                    console.error(`❌ Failed to disconnect ${name}:`, error.message);
                }
            }
        }
        
        this.loadedServices.clear();
    }

    getEnvironmentInfo() {
        return {
            current: this.currentEnvironment,
            config: ENVIRONMENTS[this.currentEnvironment],
            loadedServices: Array.from(this.loadedServices.keys()),
            serviceCount: this.loadedServices.size
        };
    }

    async testEnvironment() {
        console.log(`\n🧪 === TESTING ${this.currentEnvironment?.toUpperCase()} ENVIRONMENT ===`);
        
        const results = {};
        
        // Test database
        try {
            const database = this.loadedServices.get('database');
            if (database) {
                const result = await database.query('SELECT 1 as test');
                results.database = { success: true, result };
                console.log(`✅ Database test passed`);
            }
        } catch (error) {
            results.database = { success: false, error: error.message };
            console.log(`❌ Database test failed: ${error.message}`);
        }
        
        // Test cache
        try {
            const cache = this.loadedServices.get('cache');
            if (cache) {
                await cache.set('test_key', 'test_value');
                const value = await cache.get('test_key');
                results.cache = { success: value === 'test_value', value };
                console.log(`✅ Cache test passed`);
            }
        } catch (error) {
            results.cache = { success: false, error: error.message };
            console.log(`❌ Cache test failed: ${error.message}`);
        }
        
        // Test payment service
        try {
            const paymentService = this.loadedServices.get('paymentService');
            if (paymentService) {
                const payment = await paymentService.processPayment(10.00, 'test_card');
                results.payment = { success: payment.success, payment };
                console.log(`✅ Payment test ${payment.success ? 'passed' : 'failed'}`);
            }
        } catch (error) {
            results.payment = { success: false, error: error.message };
            console.log(`❌ Payment test failed: ${error.message}`);
        }
        
        // Test external API
        try {
            const apiService = this.loadedServices.get('externalApi');
            if (apiService) {
                const response = await apiService.makeRequest('/health');
                results.externalApi = { success: true, response };
                console.log(`✅ External API test passed`);
            }
        } catch (error) {
            results.externalApi = { success: false, error: error.message };
            console.log(`❌ External API test failed: ${error.message}`);
        }
        
        const successCount = Object.values(results).filter(r => r.success).length;
        const totalTests = Object.keys(results).length;
        
        console.log(`🎯 Environment test summary: ${successCount}/${totalTests} tests passed`);
        return results;
    }

    async getSystemStats() {
        const stats = {
            environment: this.currentEnvironment,
            services: {},
            summary: {
                totalServices: this.loadedServices.size,
                healthyServices: 0,
                environment: this.currentEnvironment
            }
        };
        
        for (const [name, service] of this.loadedServices) {
            try {
                if (typeof service.getStats === 'function') {
                    stats.services[name] = service.getStats();
                    stats.summary.healthyServices++;
                } else {
                    stats.services[name] = { status: 'no stats available' };
                }
            } catch (error) {
                stats.services[name] = { error: error.message };
            }
        }
        
        return stats;
    }
}

// ============ MAIN EXECUTION ============

async function demonstrateEnvironmentManagement() {
    try {
        console.log('🚀 === ENVIRONMENT MANAGEMENT DEMO ===');
        
        const container = new SDI({ verbose: false });

        // Register development environment services
        container.register(SQLiteDatabase, 'database')
            .withTags('database', 'development', 'sqlite', 'local')
            .asSingleton();

        container.register(MemoryCache, 'cache')
            .withTags('cache', 'development', 'memory', 'local')
            .asSingleton();

        container.register(ConsoleLogger, 'logger')
            .withTags('logger', 'development', 'console', 'debug')
            .asSingleton();

        container.register(MockPaymentService, 'paymentService')
            .withTags('payment', 'development', 'mock', 'testing')
            .asSingleton();

        container.register(ExternalApiService, 'externalApi')
            .withTags('api', 'development', 'external', 'http')
            .asSingleton();

        // Register staging environment services
        container.register(PostgreSQLDatabase, 'stagingDatabase')
            .withTags('database', 'staging', 'postgresql', 'remote')
            .asSingleton();

        container.register(RedisCache, 'stagingCache')
            .withTags('cache', 'staging', 'redis', 'remote')
            .asSingleton();

        container.register(FileLogger, 'stagingLogger')
            .withTags('logger', 'staging', 'file', 'persistent')
            .asSingleton();

        container.register(RealPaymentService, 'stagingPaymentService')
            .withTags('payment', 'staging', 'real', 'secure')
            .asSingleton();

        // Register production environment services
        container.register(PostgreSQLDatabase, 'productionDatabase')
            .withTags('database', 'production', 'postgresql', 'secure', 'ha')
            .asSingleton();

        container.register(RedisCache, 'productionCache')
            .withTags('cache', 'production', 'redis', 'secure', 'ha')
            .asSingleton();

        container.register(FileLogger, 'productionLogger')
            .withTags('logger', 'production', 'file', 'secure', 'audit')
            .asSingleton();

        container.register(RealPaymentService, 'productionPaymentService')
            .withTags('payment', 'production', 'real', 'secure', 'pci')
            .asSingleton();

        // Create environment manager
        const envManager = new EnvironmentManager({ container });

        // Test each environment
        const environments = ['development', 'staging', 'production'];
        
        for (const env of environments) {
            console.log(`\n${'='.repeat(60)}`);
            
            // Load environment
            const loadResult = await envManager.loadEnvironment(env);
            
            // Get environment info
            const envInfo = envManager.getEnvironmentInfo();
            console.log(`\n📋 Environment Info:`);
            console.log(`   Current: ${envInfo.current}`);
            console.log(`   Services: ${envInfo.serviceCount}`);
            console.log(`   Config: ${JSON.stringify(envInfo.config.features)}`);
            
            // Test environment
            await envManager.testEnvironment();
            
            // Get system stats
            const stats = await envManager.getSystemStats();
            console.log(`\n📊 System Stats:`);
            console.log(`   Healthy Services: ${stats.summary.healthyServices}/${stats.summary.totalServices}`);
            
            // Service discovery by environment
            const envServices = container.getServicesByTags([env], 'AND');
            console.log(`\n🔍 Environment Service Discovery:`);
            envServices.forEach(service => {
                const tags = Array.from(service.service.tags);
                console.log(`   - ${service.name}: [${tags.join(', ')}]`);
            });
            
            // Cleanup before next environment
            await envManager.cleanupEnvironment();
        }

        // Demonstrate environment switching
        console.log(`\n${'='.repeat(60)}`);
        console.log('🔄 === ENVIRONMENT SWITCHING DEMO ===');
        
        await envManager.loadEnvironment('development');
        console.log('✅ Development environment loaded');
        
        await envManager.switchEnvironment('production');
        console.log('✅ Switched to production environment');
        
        await envManager.switchEnvironment('development');
        console.log('✅ Switched back to development environment');

        // Advanced tag-based queries
        console.log('\n🏷️ === ADVANCED TAG-BASED QUERIES ===');
        
        const databaseServices = container.getServicesByTags(['database'], 'AND');
        const secureServices = container.getServicesByTags(['secure'], 'AND');
        const localServices = container.getServicesByTags(['local'], 'AND');
        const remoteServices = container.getServicesByTags(['remote'], 'AND');
        
        console.log(`Database services: ${databaseServices.length}`);
        console.log(`Secure services: ${secureServices.length}`);
        console.log(`Local services: ${localServices.length}`);
        console.log(`Remote services: ${remoteServices.length}`);
        
        // Service comparison across environments
        console.log('\n📊 === SERVICE COMPARISON ===');
        const serviceTypes = ['database', 'cache', 'logger', 'payment'];
        
        serviceTypes.forEach(type => {
            const services = container.getServicesByTags([type], 'AND');
            console.log(`\n${type.toUpperCase()} Services:`);
            services.forEach(service => {
                const envTags = Array.from(service.service.tags).filter(tag => 
                    ['development', 'staging', 'production'].includes(tag)
                );
                console.log(`   - ${service.name}: ${envTags.join(', ')}`);
            });
        });

        console.log('\n✅ Environment management demonstration completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Execute the demo
demonstrateEnvironmentManagement(); 