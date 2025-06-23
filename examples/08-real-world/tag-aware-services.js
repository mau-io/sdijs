/**
 * Tag-Aware Services Example
 * 
 * This example demonstrates how services can access and use their own tags
 * and discover other services by tags to modify their behavior dynamically.
 */

// For production usage: import SDI from 'sdijs';
import SDI from '../../index.js';

// ============ BASE TAG-AWARE SERVICE ============

class TagAwareService {
    constructor({ container, serviceName, tags }) {
        this.container = container;
        this.serviceName = serviceName;
        this.myTags = tags || [];
        this.initialized = false;
    }



    hasTag(tag) {
        return this.myTags.includes(tag);
    }

    hasAnyTag(tags) {
        return tags.some(tag => this.myTags.includes(tag));
    }

    hasAllTags(tags) {
        return tags.every(tag => this.myTags.includes(tag));
    }

    async initialize() {
        if (this.initialized) return;
        
        console.log(`🔧 Initializing ${this.constructor.name} with tags: [${this.myTags.join(', ')}]`);
        
        // Modify behavior based on tags
        await this.configureByTags();
        
        this.initialized = true;
        console.log(`✅ ${this.constructor.name} initialized`);
    }

    async configureByTags() {
        // Override in subclasses
    }
}

// ============ ENVIRONMENT-AWARE DATABASE SERVICE ============

class DatabaseService extends TagAwareService {
    constructor(dependencies) {
        // Get container from dependencies (SDI injects 'container' automatically)
        const container = dependencies.container || dependencies;
        const tags = dependencies.tags || [];
        super({ container, serviceName: 'databaseService', tags });
        this.config = dependencies.config;
        this.connectionString = '';
        this.poolSize = 10;
        this.sslEnabled = false;
        this.queryTimeout = 30000;
        this.features = new Set();
    }

    async configureByTags() {
        console.log(`   🗄️ Configuring database based on tags...`);
        
        // Configure based on environment tags
        if (this.hasTag('development')) {
            this.connectionString = 'sqlite:memory:';
            this.poolSize = 5;
            this.sslEnabled = false;
            this.queryTimeout = 60000; // More timeout for debugging
            this.features.add('debug-logging');
            this.features.add('query-profiling');
            console.log(`      🏗️ Development mode: SQLite in-memory, debug enabled`);
            
        } else if (this.hasTag('staging')) {
            this.connectionString = 'postgresql://staging-db:5432/myapp';
            this.poolSize = 15;
            this.sslEnabled = true;
            this.queryTimeout = 30000;
            this.features.add('query-caching');
            console.log(`      🧪 Staging mode: PostgreSQL with caching`);
            
        } else if (this.hasTag('production')) {
            this.connectionString = 'postgresql://prod-cluster:5432/myapp';
            this.poolSize = 50;
            this.sslEnabled = true;
            this.queryTimeout = 15000;
            this.features.add('read-replicas');
            this.features.add('connection-pooling');
            this.features.add('query-optimization');
            console.log(`      🚀 Production mode: Clustered PostgreSQL with optimizations`);
        }

        // Configure based on performance tags
        if (this.hasTag('high-performance')) {
            this.poolSize *= 2;
            this.features.add('query-parallelization');
            this.features.add('result-streaming');
            console.log(`      ⚡ High-performance mode: Enhanced settings`);
        }

        // Configure based on security tags
        if (this.hasTag('secure')) {
            this.sslEnabled = true;
            this.features.add('query-sanitization');
            this.features.add('access-logging');
            this.features.add('encryption-at-rest');
            console.log(`      🔒 Secure mode: Enhanced security features`);
        }

        // Discover and configure related services
        await this.discoverRelatedServices();
    }

    async discoverRelatedServices() {
        console.log(`   🔍 Discovering related services...`);
        
        // Find monitoring services if we're tagged as critical
        if (this.hasTag('critical')) {
            const monitoringServices = this.container.getServicesByTags(['monitoring'], 'AND');
            if (monitoringServices.length > 0) {
                this.monitoringService = this.container.resolve(monitoringServices[0].name);
                this.features.add('health-monitoring');
                console.log(`      📊 Connected to monitoring service: ${monitoringServices[0].name}`);
            }
        }
        
        // Note: Cache service connection would be done lazily to avoid circular dependencies
        console.log(`      📝 Cache service connection will be established lazily`);
    }

    async query(sql, params = []) {
        if (!this.initialized) await this.initialize();
        
        const startTime = Date.now();
        
        // Apply features based on tags
        if (this.features.has('debug-logging')) {
            console.log(`🔍 [DEBUG] Executing query: ${sql}`);
        }

        if (this.features.has('query-sanitization')) {
            sql = this.sanitizeQuery(sql);
        }

        // Check cache first if available (lazy discovery)
        if (!this.cacheService && this.shouldConnectToCache()) {
            this.cacheService = this.discoverCacheService();
            if (this.cacheService) {
                this.features.add('result-caching');
            }
        }
        
        if (this.features.has('result-caching') && this.cacheService) {
            const cacheKey = this.generateCacheKey(sql, params);
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                console.log(`💾 Cache hit for query`);
                return cached;
            }
        }

        // Simulate query execution
        const timeout = this.queryTimeout;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 10));
        
        const result = {
            rows: [{ id: 1, data: 'sample data', environment: this.getEnvironment() }],
            executionTime: Date.now() - startTime,
            features: Array.from(this.features)
        };

        // Cache result if caching is enabled
        if (this.features.has('result-caching') && this.cacheService) {
            const cacheKey = this.generateCacheKey(sql, params);
            await this.cacheService.set(cacheKey, result, 300); // 5 minutes
        }

        // Report to monitoring if available
        if (this.features.has('health-monitoring') && this.monitoringService) {
            this.monitoringService.recordMetric('database_query_time', result.executionTime);
        }

        return result;
    }

    getEnvironment() {
        const environmentTags = ['development', 'staging', 'production'];
        return this.myTags.find(tag => environmentTags.includes(tag)) || 'unknown';
    }

    sanitizeQuery(sql) {
        // Simple sanitization for demo
        return sql.replace(/[';]/g, '');
    }

    generateCacheKey(sql, params) {
        return `query:${sql}:${JSON.stringify(params)}`;
    }

    shouldConnectToCache() {
        // Connect to cache if we're in development or staging, or if we're high-performance
        return this.hasAnyTag(['development', 'staging']) || this.hasTag('high-performance');
    }

    discoverCacheService() {
        try {
            // Find cache services in same environment
            const cacheServices = this.container.getServicesByTags(['cache'], 'AND')
                .filter(s => {
                    const serviceTags = Array.from(s.service.tags);
                    const environmentTags = ['development', 'staging', 'production'];
                    const myEnv = this.myTags.find(tag => environmentTags.includes(tag));
                    return serviceTags.includes(myEnv);
                });
            
            if (cacheServices.length > 0) {
                const cacheService = this.container.resolve(cacheServices[0].name);
                console.log(`      💾 Lazy-connected to cache service: ${cacheServices[0].name}`);
                return cacheService;
            }
        } catch (e) {
            console.warn(`⚠️ Could not connect to cache service: ${e.message}`);
        }
        return null;
    }

    getStatus() {
        return {
            service: 'DatabaseService',
            tags: this.myTags,
            environment: this.getEnvironment(),
            features: Array.from(this.features),
            config: {
                connectionString: this.connectionString.replace(/\/\/.*@/, '//***@'), // Hide credentials
                poolSize: this.poolSize,
                sslEnabled: this.sslEnabled,
                queryTimeout: this.queryTimeout
            }
        };
    }
}

// ============ ADAPTIVE CACHE SERVICE ============

class CacheService extends TagAwareService {
    constructor(dependencies) {
        const container = dependencies.container || dependencies;
        const tags = dependencies.tags || [];
        super({ container, serviceName: 'cacheService', tags });
        this.config = dependencies.config;
        this.cache = new Map();
        this.ttlMap = new Map();
        this.maxSize = 1000;
        this.defaultTtl = 3600;
        this.strategy = 'lru';
        this.features = new Set();
    }

    async configureByTags() {
        console.log(`   💾 Configuring cache based on tags...`);

        // Configure based on environment
        if (this.hasTag('development')) {
            this.maxSize = 100;
            this.defaultTtl = 300; // 5 minutes
            this.strategy = 'simple';
            this.features.add('debug-mode');
            console.log(`      🏗️ Development: Small cache, short TTL`);
            
        } else if (this.hasTag('staging')) {
            this.maxSize = 1000;
            this.defaultTtl = 1800; // 30 minutes
            this.strategy = 'lru';
            console.log(`      🧪 Staging: Medium cache with LRU`);
            
        } else if (this.hasTag('production')) {
            this.maxSize = 10000;
            this.defaultTtl = 3600; // 1 hour
            this.strategy = 'lfu'; // Least Frequently Used
            this.features.add('compression');
            this.features.add('persistence');
            console.log(`      🚀 Production: Large cache with LFU and persistence`);
        }

        // Configure based on performance tags
        if (this.hasTag('high-performance')) {
            this.maxSize *= 2;
            this.features.add('background-refresh');
            this.features.add('predictive-loading');
            console.log(`      ⚡ High-performance: Doubled size with predictive features`);
        }

        // Configure based on memory tag
        if (this.hasTag('memory-optimized')) {
            this.features.add('compression');
            this.features.add('memory-monitoring');
            console.log(`      🧠 Memory-optimized: Compression enabled`);
        }

        // Discover related services
        await this.discoverRelatedServices();
    }

    async discoverRelatedServices() {
        console.log(`   🔍 Discovering cache-related services...`);
        
        // Find persistence services if we have persistence feature
        if (this.features.has('persistence')) {
            const storageServices = this.container.getServicesByTags(['storage', 'persistence'], 'AND');
            if (storageServices.length > 0) {
                this.storageService = this.container.resolve(storageServices[0].name);
                console.log(`      💿 Connected to storage service: ${storageServices[0].name}`);
            }
        }

        // Find monitoring services
        const monitoringServices = this.container.getServicesByTags(['monitoring'], 'AND');
        if (monitoringServices.length > 0) {
            this.monitoringService = this.container.resolve(monitoringServices[0].name);
            console.log(`      📊 Connected to monitoring service: ${monitoringServices[0].name}`);
        }
    }

    async get(key) {
        if (!this.initialized) await this.initialize();
        
        const startTime = Date.now();
        
        if (this.features.has('debug-mode')) {
            console.log(`🔍 [CACHE] Getting key: ${key}`);
        }

        // Check if key exists and is not expired
        if (this.cache.has(key)) {
            const ttl = this.ttlMap.get(key);
            if (!ttl || Date.now() < ttl) {
                const value = this.cache.get(key);
                
                // Update access pattern for LFU strategy
                if (this.strategy === 'lfu') {
                    this.updateAccessFrequency(key);
                }
                
                // Report hit to monitoring
                if (this.monitoringService) {
                    this.monitoringService.recordMetric('cache_hit', 1);
                }
                
                return this.features.has('compression') ? this.decompress(value) : value;
            } else {
                // Expired key
                this.cache.delete(key);
                this.ttlMap.delete(key);
            }
        }

        // Report miss to monitoring
        if (this.monitoringService) {
            this.monitoringService.recordMetric('cache_miss', 1);
        }

        return null;
    }

    async set(key, value, ttl = null) {
        if (!this.initialized) await this.initialize();
        
        const effectiveTtl = ttl || this.defaultTtl;
        const expirationTime = Date.now() + (effectiveTtl * 1000);
        
        if (this.features.has('debug-mode')) {
            console.log(`🔍 [CACHE] Setting key: ${key}, TTL: ${effectiveTtl}s`);
        }

        // Apply compression if enabled
        const storedValue = this.features.has('compression') ? this.compress(value) : value;
        
        // Check if we need to evict
        if (this.cache.size >= this.maxSize) {
            await this.evict();
        }

        this.cache.set(key, storedValue);
        this.ttlMap.set(key, expirationTime);
        
        // Initialize access frequency for LFU
        if (this.strategy === 'lfu') {
            this.initializeAccessFrequency(key);
        }

        // Persist if enabled
        if (this.features.has('persistence') && this.storageService) {
            await this.storageService.persist(key, storedValue, expirationTime);
        }

        return true;
    }

    async evict() {
        let keyToEvict;
        
        switch (this.strategy) {
            case 'lru':
                keyToEvict = this.cache.keys().next().value; // First = oldest
                break;
            case 'lfu':
                keyToEvict = this.getLeastFrequentlyUsedKey();
                break;
            default:
                keyToEvict = this.cache.keys().next().value;
        }
        
        if (keyToEvict) {
            this.cache.delete(keyToEvict);
            this.ttlMap.delete(keyToEvict);
            
            if (this.features.has('debug-mode')) {
                console.log(`🗑️ [CACHE] Evicted key: ${keyToEvict} (strategy: ${this.strategy})`);
            }
        }
    }

    compress(value) {
        // Simple compression simulation
        return { compressed: true, data: JSON.stringify(value) };
    }

    decompress(value) {
        if (value && value.compressed) {
            return JSON.parse(value.data);
        }
        return value;
    }

    updateAccessFrequency(key) {
        // LFU implementation would track frequency here
    }

    initializeAccessFrequency(key) {
        // LFU implementation would initialize frequency counter here
    }

    getLeastFrequentlyUsedKey() {
        // LFU implementation would return least frequently used key
        return this.cache.keys().next().value;
    }

    getStatus() {
        return {
            service: 'CacheService',
            tags: this.myTags,
            environment: this.getEnvironment(),
            features: Array.from(this.features),
            config: {
                maxSize: this.maxSize,
                defaultTtl: this.defaultTtl,
                strategy: this.strategy,
                currentSize: this.cache.size
            }
        };
    }

    getEnvironment() {
        const environmentTags = ['development', 'staging', 'production'];
        return this.myTags.find(tag => environmentTags.includes(tag)) || 'unknown';
    }
}

// ============ ADAPTIVE LOGGER SERVICE ============

class LoggerService extends TagAwareService {
    constructor(dependencies) {
        const container = dependencies.container || dependencies;
        const tags = dependencies.tags || [];
        super({ container, serviceName: 'loggerService', tags });
        this.config = dependencies.config;
        this.level = 'info';
        this.outputs = [];
        this.features = new Set();
        this.formatters = new Map();
    }

    async configureByTags() {
        console.log(`   📝 Configuring logger based on tags...`);

        // Configure based on environment
        if (this.hasTag('development')) {
            this.level = 'debug';
            this.outputs = ['console'];
            this.features.add('colorized');
            this.features.add('stack-traces');
            console.log(`      🏗️ Development: Debug level, console output`);
            
        } else if (this.hasTag('staging')) {
            this.level = 'info';
            this.outputs = ['console', 'file'];
            this.features.add('structured');
            console.log(`      🧪 Staging: Info level, console + file`);
            
        } else if (this.hasTag('production')) {
            this.level = 'warn';
            this.outputs = ['file', 'remote'];
            this.features.add('structured');
            this.features.add('encrypted');
            this.features.add('rotation');
            console.log(`      🚀 Production: Warn level, file + remote`);
        }

        // Configure based on security tags
        if (this.hasTag('secure')) {
            this.features.add('data-sanitization');
            this.features.add('audit-trail');
            console.log(`      🔒 Secure: Data sanitization enabled`);
        }

        // Configure based on performance tags
        if (this.hasTag('high-performance')) {
            this.features.add('async-logging');
            this.features.add('batching');
            console.log(`      ⚡ High-performance: Async + batching enabled`);
        }

        // Setup formatters based on features
        this.setupFormatters();
        
        // Discover related services
        await this.discoverRelatedServices();
    }

    setupFormatters() {
        if (this.features.has('structured')) {
            this.formatters.set('structured', (level, message, data) => {
                return JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level,
                    message,
                    data,
                    service: 'LoggerService',
                    environment: this.getEnvironment(),
                    tags: this.myTags
                });
            });
        }

        if (this.features.has('colorized')) {
            this.formatters.set('colorized', (level, message, data) => {
                const colors = {
                    debug: '\x1b[36m', // Cyan
                    info: '\x1b[32m',  // Green
                    warn: '\x1b[33m',  // Yellow
                    error: '\x1b[31m'  // Red
                };
                const reset = '\x1b[0m';
                return `${colors[level] || ''}[${level.toUpperCase()}] ${message}${reset}`;
            });
        }
    }

    async discoverRelatedServices() {
        console.log(`   🔍 Discovering logging-related services...`);
        
        // Find alerting services for error logs
        const alertServices = this.container.getServicesByTags(['alert', 'notification'], 'AND');
        if (alertServices.length > 0) {
            this.alertService = this.container.resolve(alertServices[0].name);
            this.features.add('error-alerting');
            console.log(`      🚨 Connected to alert service: ${alertServices[0].name}`);
        }

        // Find storage services for log persistence
        if (this.outputs.includes('remote')) {
            const storageServices = this.container.getServicesByTags(['storage', 'remote'], 'AND');
            if (storageServices.length > 0) {
                this.storageService = this.container.resolve(storageServices[0].name);
                console.log(`      ☁️ Connected to remote storage: ${storageServices[0].name}`);
            }
        }
    }

    log(level, message, data = {}) {
        if (!this.shouldLog(level)) return;
        
        let formattedMessage = message;
        
        // Apply data sanitization if enabled
        if (this.features.has('data-sanitization')) {
            data = this.sanitizeData(data);
        }

        // Apply appropriate formatter
        if (this.features.has('structured')) {
            formattedMessage = this.formatters.get('structured')(level, message, data);
        } else if (this.features.has('colorized')) {
            formattedMessage = this.formatters.get('colorized')(level, message, data);
        }

        // Output to configured destinations
        this.outputs.forEach(output => {
            switch (output) {
                case 'console':
                    console.log(formattedMessage);
                    break;
                case 'file':
                    this.writeToFile(formattedMessage);
                    break;
                case 'remote':
                    this.sendToRemote(formattedMessage);
                    break;
            }
        });

        // Send alerts for errors if configured
        if (level === 'error' && this.features.has('error-alerting') && this.alertService) {
            this.alertService.sendAlert({
                level: 'critical',
                message: `Error logged: ${message}`,
                data,
                service: 'LoggerService',
                environment: this.getEnvironment()
            });
        }
    }

    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.level];
    }

    sanitizeData(data) {
        // Simple data sanitization for demo
        const sanitized = { ...data };
        ['password', 'token', 'secret', 'key'].forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        });
        return sanitized;
    }

    writeToFile(message) {
        // File writing simulation
        console.log(`📁 [FILE] ${message}`);
    }

    sendToRemote(message) {
        // Remote logging simulation
        if (this.storageService) {
            this.storageService.store('logs', message);
        }
    }

    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }

    getStatus() {
        return {
            service: 'LoggerService',
            tags: this.myTags,
            environment: this.getEnvironment(),
            features: Array.from(this.features),
            config: {
                level: this.level,
                outputs: this.outputs
            }
        };
    }

    getEnvironment() {
        const environmentTags = ['development', 'staging', 'production'];
        return this.myTags.find(tag => environmentTags.includes(tag)) || 'unknown';
    }
}

// ============ SIMPLE SUPPORTING SERVICES ============

class MonitoringService {
    recordMetric(name, value) {
        console.log(`📊 [METRIC] ${name}: ${value}`);
    }
}

class AlertService {
    sendAlert(alert) {
        console.log(`🚨 [ALERT] ${alert.level}: ${alert.message}`);
    }
}

class StorageService {
    async persist(key, value, expiration) {
        console.log(`💿 [STORAGE] Persisted ${key}`);
    }

    async store(collection, data) {
        console.log(`💿 [STORAGE] Stored in ${collection}`);
    }
}

// ============ SERVICE INSPECTOR ============

class ServiceInspector {
    constructor(dependencies) {
        this.container = dependencies.container || dependencies;
    }

    inspectTagAwareServices() {
        console.log('\n🔍 === SERVICE TAG INSPECTION ===');
        
        const tagAwareServices = this.container.getServicesByTags(['tag-aware'], 'AND');
        
        tagAwareServices.forEach(serviceInfo => {
            const service = this.container.resolve(serviceInfo.name);
            if (typeof service.getStatus === 'function') {
                const status = service.getStatus();
                
                console.log(`\n📋 ${status.service}:`);
                console.log(`   🏷️ Tags: [${status.tags.join(', ')}]`);
                console.log(`   🌍 Environment: ${status.environment}`);
                console.log(`   ⚙️ Features: [${status.features.join(', ')}]`);
                console.log(`   📊 Config:`, status.config);
            }
        });
    }

    demonstrateTagQueries() {
        console.log('\n🔍 === TAG QUERY DEMONSTRATIONS ===');
        
        // Query by environment
        const environments = ['development', 'staging', 'production'];
        environments.forEach(env => {
            const services = this.container.getServicesByTags([env], 'AND');
            console.log(`\n🌍 ${env.toUpperCase()} services: ${services.length}`);
            services.forEach(s => {
                console.log(`   - ${s.name}: [${Array.from(s.service.tags).join(', ')}]`);
            });
        });

        // Query by capability
        const capabilities = ['high-performance', 'secure', 'memory-optimized'];
        capabilities.forEach(capability => {
            const services = this.container.getServicesByTags([capability], 'AND');
            if (services.length > 0) {
                console.log(`\n⚡ ${capability.toUpperCase()} services: ${services.length}`);
                services.forEach(s => {
                    console.log(`   - ${s.name}: [${Array.from(s.service.tags).join(', ')}]`);
                });
            }
        });
    }
}

// ============ MAIN EXECUTION ============

async function demonstrateTagAwareServices() {
    try {
        console.log('🚀 === TAG-AWARE SERVICES DEMO ===');
        
        const container = new SDI({ verbose: false });

        // Register the container itself so services can access it
        container.value('container', container);

        // Register configuration
        container.value('config', {
            database: { host: 'localhost', port: 5432 },
            cache: { maxSize: 1000 },
            logging: { level: 'info' }
        });

        // Register supporting services
        container.register(MonitoringService, 'monitoringService')
            .withTags('monitoring', 'infrastructure', 'support')
            .asSingleton();

        container.register(AlertService, 'alertService')
            .withTags('alert', 'notification', 'infrastructure')
            .asSingleton();

        container.register(StorageService, 'storageService')
            .withTags('storage', 'persistence', 'remote', 'infrastructure')
            .asSingleton();

        // Register tag-aware services for different environments

        // Development environment
        container.factory('devDatabaseService', (deps) => {
            const tags = ['database', 'development', 'tag-aware', 'sqlite'];
            return new DatabaseService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('database', 'development', 'tag-aware', 'sqlite').asSingleton();

        container.factory('devCacheService', (deps) => {
            const tags = ['cache', 'development', 'tag-aware', 'memory'];
            return new CacheService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('cache', 'development', 'tag-aware', 'memory').asSingleton();

        container.factory('devLoggerService', (deps) => {
            const tags = ['logging', 'development', 'tag-aware', 'console'];
            return new LoggerService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('logging', 'development', 'tag-aware', 'console').asSingleton();

        // Staging environment  
        container.factory('stagingDatabaseService', (deps) => {
            const tags = ['database', 'staging', 'tag-aware', 'postgresql', 'secure'];
            return new DatabaseService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('database', 'staging', 'tag-aware', 'postgresql', 'secure').asSingleton();

        container.factory('stagingCacheService', (deps) => {
            const tags = ['cache', 'staging', 'tag-aware', 'redis', 'high-performance'];
            return new CacheService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('cache', 'staging', 'tag-aware', 'redis', 'high-performance').asSingleton();

        container.factory('stagingLoggerService', (deps) => {
            const tags = ['logging', 'staging', 'tag-aware', 'structured'];
            return new LoggerService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('logging', 'staging', 'tag-aware', 'structured').asSingleton();

        // Production environment
        container.factory('prodDatabaseService', (deps) => {
            const tags = ['database', 'production', 'tag-aware', 'postgresql', 'secure', 'high-performance', 'critical'];
            return new DatabaseService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('database', 'production', 'tag-aware', 'postgresql', 'secure', 'high-performance', 'critical').asSingleton();

        container.factory('prodCacheService', (deps) => {
            const tags = ['cache', 'production', 'tag-aware', 'redis', 'high-performance', 'memory-optimized'];
            return new CacheService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('cache', 'production', 'tag-aware', 'redis', 'high-performance', 'memory-optimized').asSingleton();

        container.factory('prodLoggerService', (deps) => {
            const tags = ['logging', 'production', 'tag-aware', 'structured', 'secure'];
            return new LoggerService({ 
                container: deps.container, 
                config: deps.config, 
                tags 
            });
        }).withTags('logging', 'production', 'tag-aware', 'structured', 'secure').asSingleton();

        // Initialize services by environment
        const environments = ['development', 'staging', 'production'];
        
        for (const env of environments) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🌍 === INITIALIZING ${env.toUpperCase()} ENVIRONMENT ===`);
            
            // Get services for this environment
            const envServices = container.getServicesByTags([env, 'tag-aware'], 'AND');
            console.log(`Found ${envServices.length} tag-aware services for ${env}`);
            
            if (envServices.length === 0) {
                console.log(`⚠️ No services found for environment: ${env}`);
                continue;
            }
            
            // Initialize each service (this triggers tag-based configuration)
            for (const serviceInfo of envServices) {
                console.log(`   🔧 About to resolve and initialize: ${serviceInfo.name}`);
                try {
                    const service = container.resolve(serviceInfo.name);
                    await service.initialize();
                } catch (error) {
                    console.error(`❌ Error initializing ${serviceInfo.name}:`, error.message);
                }
            }

            // Demonstrate service usage
            console.log(`\n⚡ === TESTING ${env.toUpperCase()} SERVICES ===`);
            
            const dbService = container.resolve(`${env === 'development' ? 'dev' : env === 'production' ? 'prod' : env}DatabaseService`);
            const cacheService = container.resolve(`${env === 'development' ? 'dev' : env === 'production' ? 'prod' : env}CacheService`);
            const loggerService = container.resolve(`${env === 'development' ? 'dev' : env === 'production' ? 'prod' : env}LoggerService`);

            // Test database
            const queryResult = await dbService.query('SELECT * FROM users WHERE active = true');
            console.log(`   🗄️ Database query completed in ${queryResult.executionTime}ms`);

            // Test cache
            await cacheService.set('user:123', { name: 'John Doe', email: 'john@example.com' });
            const cachedUser = await cacheService.get('user:123');
            console.log(`   💾 Cache operation completed, retrieved:`, cachedUser ? 'SUCCESS' : 'FAILED');

            // Test logger
            loggerService.info('Environment initialization completed', { 
                environment: env, 
                services: envServices.length 
            });
            loggerService.debug('Debug information', { timestamp: Date.now() });
        }

        // Service inspection
        const inspector = new ServiceInspector({ container });
        inspector.inspectTagAwareServices();
        inspector.demonstrateTagQueries();

        // Advanced tag-based service composition
        console.log('\n🔧 === ADVANCED TAG-BASED COMPOSITION ===');
        
        // Find all secure services
        const secureServices = container.getServicesByTags(['secure'], 'AND');
        console.log(`\n🔒 Found ${secureServices.length} secure services:`);
        secureServices.forEach(s => {
            console.log(`   - ${s.name}: [${Array.from(s.service.tags).join(', ')}]`);
        });

        // Find all high-performance services
        const performanceServices = container.getServicesByTags(['high-performance'], 'AND');
        console.log(`\n⚡ Found ${performanceServices.length} high-performance services:`);
        performanceServices.forEach(s => {
            console.log(`   - ${s.name}: [${Array.from(s.service.tags).join(', ')}]`);
        });

        // Find services that are both secure AND high-performance
        const secureAndFast = container.getServicesByTags(['secure', 'high-performance'], 'AND');
        console.log(`\n🚀 Found ${secureAndFast.length} services that are BOTH secure AND high-performance:`);
        secureAndFast.forEach(s => {
            console.log(`   - ${s.name}: [${Array.from(s.service.tags).join(', ')}]`);
        });

        console.log('\n✅ Tag-aware services demonstration completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Execute the demo
demonstrateTagAwareServices(); 