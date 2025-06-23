/**
 * Decorator Pattern with Dependency Injection Example
 * 
 * This example demonstrates:
 * - Using dependency injection to implement the Decorator pattern
 * - Chaining decorators with different behaviors
 * - Service composition and enhancement
 * - Conditional decoration based on configuration
 */

import { createContainer } from '../../index.js';

const container = createContainer();

// Configuration for decorators
container.value('config', {
    features: {
        caching: true,
        logging: true,
        validation: true,
        metrics: true,
        retries: true
    },
    cache: {
        ttl: 300, // 5 minutes
        maxSize: 1000
    },
    retries: {
        maxAttempts: 3,
        delay: 1000
    },
    metrics: {
        enabled: true,
        endpoint: '/metrics'
    }
});

// Base user service interface
class UserService {
    async getUser(id) {
        throw new Error('getUser must be implemented');
    }

    async createUser(userData) {
        throw new Error('createUser must be implemented');
    }

    async updateUser(id, userData) {
        throw new Error('updateUser must be implemented');
    }

    async deleteUser(id) {
        throw new Error('deleteUser must be implemented');
    }
}

// Core user service implementation
class CoreUserService extends UserService {
    constructor() {
        super();
        this.users = new Map([
            [1, { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' }],
            [2, { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }],
            [3, { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }]
        ]);
        console.log('👤 Core user service initialized');
    }

    async getUser(id) {
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const user = this.users.get(id);
        if (!user) {
            throw new Error(`User not found: ${id}`);
        }
        
        return { ...user };
    }

    async createUser(userData) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const id = Math.max(...this.users.keys()) + 1;
        const user = {
            id,
            ...userData,
            createdAt: new Date().toISOString()
        };
        
        this.users.set(id, user);
        return { ...user };
    }

    async updateUser(id, userData) {
        await new Promise(resolve => setTimeout(resolve, 75));
        
        const existingUser = this.users.get(id);
        if (!existingUser) {
            throw new Error(`User not found: ${id}`);
        }
        
        const updatedUser = {
            ...existingUser,
            ...userData,
            updatedAt: new Date().toISOString()
        };
        
        this.users.set(id, updatedUser);
        return { ...updatedUser };
    }

    async deleteUser(id) {
        await new Promise(resolve => setTimeout(resolve, 60));
        
        if (!this.users.has(id)) {
            throw new Error(`User not found: ${id}`);
        }
        
        this.users.delete(id);
        return { success: true, id };
    }
}

// Caching decorator
class CachingUserServiceDecorator extends UserService {
    constructor({ userService, config }) {
        super();
        this.userService = userService;
        this.cache = new Map();
        this.ttl = config.cache.ttl * 1000; // Convert to milliseconds
        this.maxSize = config.cache.maxSize;
        
        console.log('💾 Caching decorator initialized');
    }

    _getCacheKey(method, ...args) {
        return `${method}:${JSON.stringify(args)}`;
    }

    _isExpired(timestamp) {
        return Date.now() - timestamp > this.ttl;
    }

    _evictExpired() {
        for (const [key, value] of this.cache.entries()) {
            if (this._isExpired(value.timestamp)) {
                this.cache.delete(key);
            }
        }
    }

    _ensureCacheSize() {
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entries
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.1));
            toRemove.forEach(([key]) => this.cache.delete(key));
        }
    }

    async getUser(id) {
        const cacheKey = this._getCacheKey('getUser', id);
        const cached = this.cache.get(cacheKey);
        
        if (cached && !this._isExpired(cached.timestamp)) {
            console.log(`💾 Cache hit for user ${id}`);
            return cached.data;
        }
        
        console.log(`💾 Cache miss for user ${id}`);
        const result = await this.userService.getUser(id);
        
        this._evictExpired();
        this._ensureCacheSize();
        
        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    }

    async createUser(userData) {
        const result = await this.userService.createUser(userData);
        
        // Cache the created user
        const cacheKey = this._getCacheKey('getUser', result.id);
        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    }

    async updateUser(id, userData) {
        const result = await this.userService.updateUser(id, userData);
        
        // Update cache
        const cacheKey = this._getCacheKey('getUser', id);
        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    }

    async deleteUser(id) {
        const result = await this.userService.deleteUser(id);
        
        // Remove from cache
        const cacheKey = this._getCacheKey('getUser', id);
        this.cache.delete(cacheKey);
        
        return result;
    }
}

// Logging decorator
class LoggingUserServiceDecorator extends UserService {
    constructor({ userService }) {
        super();
        this.userService = userService;
        console.log('📝 Logging decorator initialized');
    }

    _log(method, args, result, error, duration) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            method,
            args: args.length > 0 ? args : undefined,
            success: !error,
            error: error?.message,
            duration: `${duration}ms`,
            result: error ? undefined : (typeof result === 'object' ? Object.keys(result) : result)
        };
        
        if (error) {
            console.log(`❌ [${timestamp}] ${method} failed:`, logEntry);
        } else {
            console.log(`✅ [${timestamp}] ${method} succeeded:`, logEntry);
        }
    }

    async _executeWithLogging(method, args, fn) {
        const startTime = Date.now();
        let result, error;
        
        try {
            result = await fn();
            return result;
        } catch (err) {
            error = err;
            throw err;
        } finally {
            const duration = Date.now() - startTime;
            this._log(method, args, result, error, duration);
        }
    }

    async getUser(id) {
        return this._executeWithLogging('getUser', [id], () => this.userService.getUser(id));
    }

    async createUser(userData) {
        return this._executeWithLogging('createUser', [userData], () => this.userService.createUser(userData));
    }

    async updateUser(id, userData) {
        return this._executeWithLogging('updateUser', [id, userData], () => this.userService.updateUser(id, userData));
    }

    async deleteUser(id) {
        return this._executeWithLogging('deleteUser', [id], () => this.userService.deleteUser(id));
    }
}

// Validation decorator
class ValidationUserServiceDecorator extends UserService {
    constructor({ userService }) {
        super();
        this.userService = userService;
        console.log('✅ Validation decorator initialized');
    }

    _validateUserId(id) {
        if (!id || typeof id !== 'number' || id <= 0) {
            throw new Error('Invalid user ID: must be a positive number');
        }
    }

    _validateUserData(userData) {
        if (!userData || typeof userData !== 'object') {
            throw new Error('Invalid user data: must be an object');
        }

        if (userData.name && typeof userData.name !== 'string') {
            throw new Error('Invalid name: must be a string');
        }

        if (userData.email && !this._isValidEmail(userData.email)) {
            throw new Error('Invalid email format');
        }

        if (userData.role && !['admin', 'user', 'moderator'].includes(userData.role)) {
            throw new Error('Invalid role: must be admin, user, or moderator');
        }
    }

    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async getUser(id) {
        this._validateUserId(id);
        return this.userService.getUser(id);
    }

    async createUser(userData) {
        this._validateUserData(userData);
        
        if (!userData.name) {
            throw new Error('Name is required');
        }
        
        if (!userData.email) {
            throw new Error('Email is required');
        }
        
        return this.userService.createUser(userData);
    }

    async updateUser(id, userData) {
        this._validateUserId(id);
        this._validateUserData(userData);
        
        return this.userService.updateUser(id, userData);
    }

    async deleteUser(id) {
        this._validateUserId(id);
        return this.userService.deleteUser(id);
    }
}

// Metrics decorator
class MetricsUserServiceDecorator extends UserService {
    constructor({ userService, config }) {
        super();
        this.userService = userService;
        this.enabled = config.metrics.enabled;
        this.metrics = {
            calls: new Map(),
            errors: new Map(),
            totalDuration: new Map(),
            lastCall: new Map()
        };
        
        console.log('📊 Metrics decorator initialized');
    }

    _recordMetric(method, duration, success) {
        if (!this.enabled) return;

        // Record call count
        this.metrics.calls.set(method, (this.metrics.calls.get(method) || 0) + 1);
        
        // Record errors
        if (!success) {
            this.metrics.errors.set(method, (this.metrics.errors.get(method) || 0) + 1);
        }
        
        // Record duration
        this.metrics.totalDuration.set(method, (this.metrics.totalDuration.get(method) || 0) + duration);
        
        // Record last call time
        this.metrics.lastCall.set(method, Date.now());
    }

    getMetrics() {
        const result = {};
        
        for (const [method, calls] of this.metrics.calls.entries()) {
            const errors = this.metrics.errors.get(method) || 0;
            const totalDuration = this.metrics.totalDuration.get(method) || 0;
            const lastCall = this.metrics.lastCall.get(method);
            
            result[method] = {
                calls,
                errors,
                successRate: ((calls - errors) / calls * 100).toFixed(2) + '%',
                averageDuration: Math.round(totalDuration / calls) + 'ms',
                lastCall: lastCall ? new Date(lastCall).toISOString() : null
            };
        }
        
        return result;
    }

    async _executeWithMetrics(method, fn) {
        const startTime = Date.now();
        let success = true;
        
        try {
            const result = await fn();
            return result;
        } catch (error) {
            success = false;
            throw error;
        } finally {
            const duration = Date.now() - startTime;
            this._recordMetric(method, duration, success);
        }
    }

    async getUser(id) {
        return this._executeWithMetrics('getUser', () => this.userService.getUser(id));
    }

    async createUser(userData) {
        return this._executeWithMetrics('createUser', () => this.userService.createUser(userData));
    }

    async updateUser(id, userData) {
        return this._executeWithMetrics('updateUser', () => this.userService.updateUser(id, userData));
    }

    async deleteUser(id) {
        return this._executeWithMetrics('deleteUser', () => this.userService.deleteUser(id));
    }
}

// Retry decorator
class RetryUserServiceDecorator extends UserService {
    constructor({ userService, config }) {
        super();
        this.userService = userService;
        this.maxAttempts = config.retries.maxAttempts;
        this.delay = config.retries.delay;
        
        console.log('🔄 Retry decorator initialized');
    }

    async _executeWithRetry(method, fn) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                const result = await fn();
                
                if (attempt > 1) {
                    console.log(`🔄 ${method} succeeded on attempt ${attempt}`);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                if (attempt < this.maxAttempts) {
                    console.log(`🔄 ${method} failed on attempt ${attempt}, retrying in ${this.delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.delay));
                } else {
                    console.log(`🔄 ${method} failed after ${this.maxAttempts} attempts`);
                }
            }
        }
        
        throw lastError;
    }

    async getUser(id) {
        return this._executeWithRetry('getUser', () => this.userService.getUser(id));
    }

    async createUser(userData) {
        return this._executeWithRetry('createUser', () => this.userService.createUser(userData));
    }

    async updateUser(id, userData) {
        return this._executeWithRetry('updateUser', () => this.userService.updateUser(id, userData));
    }

    async deleteUser(id) {
        return this._executeWithRetry('deleteUser', () => this.userService.deleteUser(id));
    }
}

// Service builder for creating decorated services
class DecoratedUserServiceBuilder {
    constructor({ config }) {
        this.config = config;
        this.baseService = null;
        this.decorators = [];
    }

    withBaseService(service) {
        this.baseService = service;
        return this;
    }

    withCaching() {
        if (this.config.features.caching) {
            this.decorators.push('caching');
        }
        return this;
    }

    withLogging() {
        if (this.config.features.logging) {
            this.decorators.push('logging');
        }
        return this;
    }

    withValidation() {
        if (this.config.features.validation) {
            this.decorators.push('validation');
        }
        return this;
    }

    withMetrics() {
        if (this.config.features.metrics) {
            this.decorators.push('metrics');
        }
        return this;
    }

    withRetries() {
        if (this.config.features.retries) {
            this.decorators.push('retries');
        }
        return this;
    }

    build() {
        if (!this.baseService) {
            throw new Error('Base service is required');
        }

        let service = this.baseService;

        // Apply decorators in order
        for (const decorator of this.decorators) {
            switch (decorator) {
                case 'validation':
                    service = new ValidationUserServiceDecorator({ userService: service });
                    break;
                case 'caching':
                    service = new CachingUserServiceDecorator({ userService: service, config: this.config });
                    break;
                case 'logging':
                    service = new LoggingUserServiceDecorator({ userService: service });
                    break;
                case 'metrics':
                    service = new MetricsUserServiceDecorator({ userService: service, config: this.config });
                    break;
                case 'retries':
                    service = new RetryUserServiceDecorator({ userService: service, config: this.config });
                    break;
            }
        }

        return service;
    }
}

// Register services
container.singleton('coreUserService', CoreUserService);
container.singleton('decoratedUserServiceBuilder', DecoratedUserServiceBuilder);

// Factory for creating fully decorated user service
container.factory('userService', ({ coreUserService, decoratedUserServiceBuilder }) => {
    return decoratedUserServiceBuilder
        .withBaseService(coreUserService)
        .withValidation()
        .withCaching()
        .withLogging()
        .withMetrics()
        .withRetries()
        .build();
}).asSingleton();

// Example usage
async function main() {
    try {
        console.log('=== Decorator Pattern with Dependency Injection Example ===\n');

        const userService = container.resolve('userService');

        console.log('=== Testing Decorated User Service ===\n');

        // Test various operations
        const operations = [
            async () => {
                console.log('--- Getting existing user ---');
                return await userService.getUser(1);
            },
            async () => {
                console.log('--- Getting same user (should hit cache) ---');
                return await userService.getUser(1);
            },
            async () => {
                console.log('--- Creating new user ---');
                return await userService.createUser({
                    name: 'Alice Cooper',
                    email: 'alice@example.com',
                    role: 'user'
                });
            },
            async () => {
                console.log('--- Updating user ---');
                return await userService.updateUser(2, {
                    name: 'Jane Doe',
                    email: 'jane.doe@example.com'
                });
            },
            async () => {
                console.log('--- Testing validation (invalid email) ---');
                try {
                    return await userService.createUser({
                        name: 'Invalid User',
                        email: 'invalid-email',
                        role: 'user'
                    });
                } catch (error) {
                    return { error: error.message };
                }
            },
            async () => {
                console.log('--- Testing validation (invalid ID) ---');
                try {
                    return await userService.getUser(-1);
                } catch (error) {
                    return { error: error.message };
                }
            },
            async () => {
                console.log('--- Getting non-existent user ---');
                try {
                    return await userService.getUser(999);
                } catch (error) {
                    return { error: error.message };
                }
            }
        ];

        // Execute operations
        for (let i = 0; i < operations.length; i++) {
            try {
                console.log(`\n${i + 1}. ${operations[i].name || 'Operation'}`);
                const result = await operations[i]();
                console.log('Result:', result);
            } catch (error) {
                console.log('Error:', error.message);
            }
            
            // Add delay between operations
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n=== Metrics Report ===');
        
        // Get metrics from the decorated service
        // We need to access the metrics decorator
        let currentService = userService;
        let metricsDecorator = null;
        
        // Find the metrics decorator in the chain
        while (currentService && !metricsDecorator) {
            if (currentService instanceof MetricsUserServiceDecorator) {
                metricsDecorator = currentService;
                break;
            }
            currentService = currentService.userService;
        }
        
        if (metricsDecorator) {
            const metrics = metricsDecorator.getMetrics();
            console.log(JSON.stringify(metrics, null, 2));
        }

        console.log('\n=== Testing Different Decorator Combinations ===');
        
        // Create different combinations
        const builder = container.resolve('decoratedUserServiceBuilder');
        const coreService = container.resolve('coreUserService');
        
        // Minimal service (only validation)
        const minimalService = builder
            .withBaseService(coreService)
            .withValidation()
            .build();
        
        console.log('\nTesting minimal service (validation only):');
        try {
            const result = await minimalService.getUser(1);
            console.log('Success:', result.name);
        } catch (error) {
            console.log('Error:', error.message);
        }
        
        // Performance service (caching + metrics)
        const performanceService = new DecoratedUserServiceBuilder({ config: container.resolve('config') })
            .withBaseService(coreService)
            .withCaching()
            .withMetrics()
            .build();
        
        console.log('\nTesting performance service (caching + metrics):');
        await performanceService.getUser(1); // First call
        await performanceService.getUser(1); // Should hit cache
        
        const perfMetrics = performanceService.getMetrics();
        console.log('Performance metrics:', perfMetrics);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 