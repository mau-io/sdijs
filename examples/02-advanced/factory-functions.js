/**
 * Factory Functions Example
 * 
 * This example demonstrates:
 * - Factory functions with dependency injection
 * - Dynamic service creation based on configuration
 * - Complex initialization logic
 * - Conditional service creation
 */

import { createContainer } from '../../index.js';

const container = createContainer();

// Configuration for different environments
container.value('environment', process.env.NODE_ENV || 'development');

container.value('config', {
    development: {
        cache: { type: 'memory', ttl: 300 },
        storage: { type: 'file', path: './data' },
        logging: { level: 'debug', output: 'console' }
    },
    production: {
        cache: { type: 'redis', host: 'redis.example.com', ttl: 3600 },
        storage: { type: 's3', bucket: 'my-app-data' },
        logging: { level: 'error', output: 'file' }
    },
    test: {
        cache: { type: 'mock', ttl: 60 },
        storage: { type: 'memory' },
        logging: { level: 'silent', output: 'null' }
    }
});

// Cache implementations
class MemoryCache {
    constructor(ttl = 300) {
        this.cache = new Map();
        this.ttl = ttl * 1000; // Convert to milliseconds
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

class RedisCache {
    constructor(host, ttl = 3600) {
        this.host = host;
        this.ttl = ttl;
        console.log(`Connected to Redis at ${host}`);
    }

    set(key, value) {
        console.log(`Redis SET ${key} (TTL: ${this.ttl}s)`);
    }

    get(key) {
        console.log(`Redis GET ${key}`);
        return null; // Simulated
    }

    clear() {
        console.log('Redis FLUSHALL');
    }
}

class MockCache {
    constructor(ttl = 60) {
        this.ttl = ttl;
        console.log(`Mock cache initialized with TTL: ${ttl}s`);
    }

    set(key, value) {
        console.log(`Mock SET ${key}`);
    }

    get(key) {
        console.log(`Mock GET ${key}`);
        return null;
    }

    clear() {
        console.log('Mock cache cleared');
    }
}

// Factory function for cache creation
container.factory('cache', ({ config, environment }) => {
    const cacheConfig = config[environment].cache;
    
    console.log(`Creating ${cacheConfig.type} cache for ${environment} environment`);
    
    switch (cacheConfig.type) {
        case 'memory':
            return new MemoryCache(cacheConfig.ttl);
        case 'redis':
            return new RedisCache(cacheConfig.host, cacheConfig.ttl);
        case 'mock':
            return new MockCache(cacheConfig.ttl);
        default:
            throw new Error(`Unknown cache type: ${cacheConfig.type}`);
    }
}).asSingleton();

// Storage implementations
class FileStorage {
    constructor(path) {
        this.path = path;
        console.log(`File storage initialized at: ${path}`);
    }

    save(key, data) {
        console.log(`Saving ${key} to file: ${this.path}/${key}.json`);
        return Promise.resolve();
    }

    load(key) {
        console.log(`Loading ${key} from file: ${this.path}/${key}.json`);
        return Promise.resolve(null);
    }
}

class S3Storage {
    constructor(bucket) {
        this.bucket = bucket;
        console.log(`S3 storage initialized with bucket: ${bucket}`);
    }

    save(key, data) {
        console.log(`Saving ${key} to S3 bucket: ${this.bucket}`);
        return Promise.resolve();
    }

    load(key) {
        console.log(`Loading ${key} from S3 bucket: ${this.bucket}`);
        return Promise.resolve(null);
    }
}

class MemoryStorage {
    constructor() {
        this.storage = new Map();
        console.log('Memory storage initialized');
    }

    save(key, data) {
        this.storage.set(key, data);
        console.log(`Saved ${key} to memory storage`);
        return Promise.resolve();
    }

    load(key) {
        const data = this.storage.get(key);
        console.log(`Loaded ${key} from memory storage`);
        return Promise.resolve(data);
    }
}

// Factory function for storage creation
container.factory('storage', ({ config, environment }) => {
    const storageConfig = config[environment].storage;
    
    console.log(`Creating ${storageConfig.type} storage for ${environment} environment`);
    
    switch (storageConfig.type) {
        case 'file':
            return new FileStorage(storageConfig.path);
        case 's3':
            return new S3Storage(storageConfig.bucket);
        case 'memory':
            return new MemoryStorage();
        default:
            throw new Error(`Unknown storage type: ${storageConfig.type}`);
    }
}).asSingleton();

// Logger factory with complex initialization
container.factory('logger', ({ config, environment }) => {
    const logConfig = config[environment].logging;
    
    return {
        level: logConfig.level,
        output: logConfig.output,
        
        log(level, message) {
            if (this.shouldLog(level)) {
                const timestamp = new Date().toISOString();
                const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
                
                switch (this.output) {
                    case 'console':
                        console.log(logEntry);
                        break;
                    case 'file':
                        console.log(`Writing to log file: ${logEntry}`);
                        break;
                    case 'null':
                        // Silent logging
                        break;
                }
            }
        },
        
        shouldLog(level) {
            const levels = ['silent', 'error', 'warn', 'info', 'debug'];
            const currentLevelIndex = levels.indexOf(this.level);
            const messageLevelIndex = levels.indexOf(level);
            return messageLevelIndex <= currentLevelIndex && currentLevelIndex > 0;
        },
        
        error(message) { this.log('error', message); },
        warn(message) { this.log('warn', message); },
        info(message) { this.log('info', message); },
        debug(message) { this.log('debug', message); }
    };
}).asSingleton();

// Service that uses the factory-created dependencies
class DataService {
    constructor({ cache, storage, logger }) {
        this.cache = cache;
        this.storage = storage;
        this.logger = logger;
        
        this.logger.info('DataService initialized');
    }

    async getData(key) {
        this.logger.debug(`Getting data for key: ${key}`);
        
        // Try cache first
        let data = this.cache.get(key);
        if (data) {
            this.logger.debug(`Cache hit for key: ${key}`);
            return data;
        }
        
        // Load from storage
        this.logger.debug(`Cache miss for key: ${key}, loading from storage`);
        data = await this.storage.load(key);
        
        if (data) {
            // Cache the data
            this.cache.set(key, data);
            this.logger.debug(`Data cached for key: ${key}`);
        }
        
        return data;
    }

    async setData(key, data) {
        this.logger.debug(`Setting data for key: ${key}`);
        
        // Save to storage
        await this.storage.save(key, data);
        
        // Update cache
        this.cache.set(key, data);
        
        this.logger.info(`Data saved for key: ${key}`);
    }

    clearCache() {
        this.logger.info('Clearing cache');
        this.cache.clear();
    }
}

container.singleton('dataService', DataService);

// Conditional factory - only create if needed
container.factory('analyticsService', ({ environment, logger }) => {
    if (environment === 'production') {
        logger.info('Creating analytics service for production');
        return {
            track(event, data) {
                logger.info(`Analytics: ${event}`, data);
            },
            flush() {
                logger.info('Analytics: flushing events');
            }
        };
    } else {
        logger.debug('Analytics service disabled for non-production environment');
        return {
            track() { /* no-op */ },
            flush() { /* no-op */ }
        };
    }
}).asSingleton();

// Example usage
async function main() {
    try {
        console.log('=== Factory Functions Example ===\n');

        const environment = container.resolve('environment');
        console.log(`Running in ${environment} environment\n`);

        // Resolve services (factories will be called automatically)
        const dataService = container.resolve('dataService');
        const analytics = container.resolve('analyticsService');

        // Use the services
        await dataService.setData('user:123', { name: 'John', email: 'john@example.com' });
        
        const userData = await dataService.getData('user:123');
        console.log('Retrieved user data:', userData);

        // Track analytics
        analytics.track('user_retrieved', { userId: '123' });

        // Demonstrate cache behavior
        console.log('\n=== Cache Behavior ===');
        await dataService.getData('user:123'); // Should hit cache
        
        dataService.clearCache();
        await dataService.getData('user:123'); // Should miss cache

        console.log('\n=== Different Environment Example ===');
        
        // Create a new container for different environment
        const prodContainer = createContainer();
        prodContainer.value('environment', 'production');
        prodContainer.value('config', container.resolve('config'));
        
        // Register the same factories (need to re-define them)
        prodContainer.factory('cache', ({ config, environment }) => {
            const cacheConfig = config[environment].cache;
            console.log(`Creating ${cacheConfig.type} cache for ${environment} environment`);
            
            switch (cacheConfig.type) {
                case 'memory':
                    return new MemoryCache(cacheConfig.ttl);
                case 'redis':
                    return new RedisCache(cacheConfig.host, cacheConfig.ttl);
                case 'mock':
                    return new MockCache(cacheConfig.ttl);
                default:
                    throw new Error(`Unknown cache type: ${cacheConfig.type}`);
            }
        }).asSingleton();
        
        prodContainer.factory('logger', ({ config, environment }) => {
            const logConfig = config[environment].logging;
            
            return {
                level: logConfig.level,
                output: logConfig.output,
                
                log(level, message) {
                    if (this.shouldLog(level)) {
                        const timestamp = new Date().toISOString();
                        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
                        
                        switch (this.output) {
                            case 'console':
                                console.log(logEntry);
                                break;
                            case 'file':
                                console.log(`Writing to log file: ${logEntry}`);
                                break;
                            case 'null':
                                break;
                        }
                    }
                },
                
                shouldLog(level) {
                    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
                    const currentLevelIndex = levels.indexOf(this.level);
                    const messageLevelIndex = levels.indexOf(level);
                    return messageLevelIndex <= currentLevelIndex && currentLevelIndex > 0;
                },
                
                error(message) { this.log('error', message); },
                warn(message) { this.log('warn', message); },
                info(message) { this.log('info', message); },
                debug(message) { this.log('debug', message); }
            };
        }).asSingleton();
        
        prodContainer.factory('analyticsService', ({ environment, logger }) => {
            if (environment === 'production') {
                logger.info('Creating analytics service for production');
                return {
                    track(event, data) {
                        logger.info(`Analytics: ${event}`, data);
                    },
                    flush() {
                        logger.info('Analytics: flushing events');
                    }
                };
            } else {
                logger.debug('Analytics service disabled for non-production environment');
                return {
                    track() { /* no-op */ },
                    flush() { /* no-op */ }
                };
            }
        }).asSingleton();
        
        const prodLogger = prodContainer.resolve('logger');
        const prodAnalytics = prodContainer.resolve('analyticsService');
        
        prodLogger.info('Production logger initialized');
        prodAnalytics.track('production_event', { data: 'test' });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 