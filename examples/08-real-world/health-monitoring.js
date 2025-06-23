/**
 * Health Monitoring Example
 * 
 * This example demonstrates how to implement comprehensive health monitoring
 * using SDI's tag discovery to automatically discover and monitor services,
 * track their health status, and provide alerting capabilities.
 */

import SDI from '../../index.js';

// ============ HEALTH STATUS DEFINITIONS ============

const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy',
    UNKNOWN: 'unknown'
};

const HEALTH_LEVELS = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    INFO: 'info'
};

// ============ HEALTH CHECK INTERFACES ============

class HealthCheck {
    constructor(name, checkFunction, options = {}) {
        this.name = name;
        this.checkFunction = checkFunction;
        this.timeout = options.timeout || 5000;
        this.interval = options.interval || 30000;
        this.retries = options.retries || 3;
        this.lastCheck = null;
        this.lastStatus = HEALTH_STATUS.UNKNOWN;
        this.consecutiveFailures = 0;
        this.history = [];
        this.maxHistory = options.maxHistory || 100;
    }

    async execute() {
        const startTime = Date.now();
        
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Health check timeout')), this.timeout)
            );
            
            const checkPromise = this.checkFunction();
            const result = await Promise.race([checkPromise, timeoutPromise]);
            
            const duration = Date.now() - startTime;
            const status = result.healthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY;
            
            this.updateStatus(status, result, duration);
            
            return {
                name: this.name,
                status,
                duration,
                timestamp: new Date().toISOString(),
                details: result.details || {},
                error: null
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateStatus(HEALTH_STATUS.UNHEALTHY, null, duration, error);
            
            return {
                name: this.name,
                status: HEALTH_STATUS.UNHEALTHY,
                duration,
                timestamp: new Date().toISOString(),
                details: {},
                error: error.message
            };
        }
    }

    updateStatus(status, result, duration, error = null) {
        this.lastCheck = Date.now();
        this.lastStatus = status;
        
        if (status === HEALTH_STATUS.UNHEALTHY) {
            this.consecutiveFailures++;
        } else {
            this.consecutiveFailures = 0;
        }
        
        // Add to history
        this.history.push({
            timestamp: this.lastCheck,
            status,
            duration,
            error: error?.message,
            details: result?.details
        });
        
        // Trim history
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(-this.maxHistory);
        }
    }

    getStats() {
        if (this.history.length === 0) return null;
        
        const recentHistory = this.history.slice(-10);
        const healthyChecks = recentHistory.filter(h => h.status === HEALTH_STATUS.HEALTHY).length;
        const avgDuration = recentHistory.reduce((sum, h) => sum + h.duration, 0) / recentHistory.length;
        
        return {
            name: this.name,
            lastStatus: this.lastStatus,
            lastCheck: this.lastCheck,
            consecutiveFailures: this.consecutiveFailures,
            successRate: healthyChecks / recentHistory.length,
            averageDuration: avgDuration,
            totalChecks: this.history.length
        };
    }
}

// ============ MONITORABLE SERVICES ============

class DatabaseService {
    constructor({ config }) {
        this.name = 'DatabaseService';
        this.config = config;
        this.connected = true;
        this.connectionPool = {
            active: 0,
            idle: 10,
            max: 20,
            errors: 0
        };
        this.queryCount = 0;
        this.lastQueryTime = Date.now();
        this.intervals = [];
        
        // Simulate occasional connection issues
        const connectionInterval = setInterval(() => {
            if (Math.random() < 0.02) { // 2% chance of temporary issue
                this.connected = false;
                setTimeout(() => { this.connected = true; }, 5000);
            }
        }, 10000);
        this.intervals.push(connectionInterval);
    }

    cleanup() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }

    async healthCheck() {
        const startTime = Date.now();
        
        try {
            // Check database connection
            if (!this.connected) {
                return {
                    healthy: false,
                    details: {
                        error: 'Database connection lost',
                        connectionPool: this.connectionPool
                    }
                };
            }
            
            // Check connection pool
            const poolUtilization = this.connectionPool.active / this.connectionPool.max;
            if (poolUtilization > 0.9) {
                return {
                    healthy: false,
                    details: {
                        error: 'Connection pool nearly exhausted',
                        utilization: poolUtilization,
                        connectionPool: this.connectionPool
                    }
                };
            }
            
            // Simulate health check query
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
            
            const queryAge = Date.now() - this.lastQueryTime;
            const isStale = queryAge > 300000; // 5 minutes
            
            return {
                healthy: !isStale,
                details: {
                    connected: this.connected,
                    connectionPool: this.connectionPool,
                    queryCount: this.queryCount,
                    lastQueryAge: queryAge,
                    poolUtilization: poolUtilization
                }
            };
            
        } catch (error) {
            return {
                healthy: false,
                details: {
                    error: error.message,
                    connectionPool: this.connectionPool
                }
            };
        }
    }

    async query(sql) {
        this.connectionPool.active++;
        this.connectionPool.idle--;
        
        try {
            // Simulate query execution
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 20));
            
            this.queryCount++;
            this.lastQueryTime = Date.now();
            
            return { rows: [{ id: 1, data: 'test' }] };
        } finally {
            this.connectionPool.active--;
            this.connectionPool.idle++;
        }
    }

    getMetrics() {
        return {
            name: this.name,
            connected: this.connected,
            connectionPool: this.connectionPool,
            queryCount: this.queryCount,
            lastQueryTime: this.lastQueryTime
        };
    }
}

class CacheService {
    constructor({ config }) {
        this.name = 'CacheService';
        this.config = config;
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
        this.maxSize = config.maxSize || 1000;
        this.connected = true;
        this.intervals = [];
        
        // Simulate occasional cache issues
        const cacheInterval = setInterval(() => {
            if (Math.random() < 0.01) { // 1% chance of temporary issue
                this.connected = false;
                setTimeout(() => { this.connected = true; }, 3000);
            }
        }, 15000);
        this.intervals.push(cacheInterval);
    }

    cleanup() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }

    async healthCheck() {
        try {
            if (!this.connected) {
                return {
                    healthy: false,
                    details: {
                        error: 'Cache connection lost',
                        stats: this.stats
                    }
                };
            }
            
            // Check cache size
            const sizeUtilization = this.cache.size / this.maxSize;
            if (sizeUtilization > 0.95) {
                return {
                    healthy: false,
                    details: {
                        error: 'Cache nearly full',
                        utilization: sizeUtilization,
                        size: this.cache.size,
                        maxSize: this.maxSize
                    }
                };
            }
            
            // Check hit rate
            const totalRequests = this.stats.hits + this.stats.misses;
            const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 1;
            
            const isHealthy = hitRate > 0.5; // Expect at least 50% hit rate
            
            return {
                healthy: isHealthy,
                details: {
                    connected: this.connected,
                    size: this.cache.size,
                    maxSize: this.maxSize,
                    utilization: sizeUtilization,
                    hitRate: hitRate,
                    stats: this.stats
                }
            };
            
        } catch (error) {
            return {
                healthy: false,
                details: {
                    error: error.message,
                    stats: this.stats
                }
            };
        }
    }

    async get(key) {
        if (!this.connected) throw new Error('Cache not connected');
        
        if (this.cache.has(key)) {
            this.stats.hits++;
            return this.cache.get(key);
        } else {
            this.stats.misses++;
            return null;
        }
    }

    async set(key, value) {
        if (!this.connected) throw new Error('Cache not connected');
        
        this.cache.set(key, value);
        this.stats.sets++;
        
        // Handle eviction if cache is full
        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.stats.evictions++;
        }
    }

    getMetrics() {
        return {
            name: this.name,
            connected: this.connected,
            size: this.cache.size,
            maxSize: this.maxSize,
            stats: this.stats
        };
    }
}

class ExternalApiService {
    constructor({ config }) {
        this.name = 'ExternalApiService';
        this.config = config;
        this.baseUrl = config.apiUrl || 'https://api.example.com';
        this.timeout = config.timeout || 5000;
        this.requestCount = 0;
        this.errorCount = 0;
        this.lastSuccessfulRequest = Date.now();
        this.intervals = [];
        
        // Simulate API availability issues
        this.available = true;
        const apiInterval = setInterval(() => {
            if (Math.random() < 0.03) { // 3% chance of API being down
                this.available = false;
                setTimeout(() => { this.available = true; }, 1000);
            }
        }, 20000);
        this.intervals.push(apiInterval);
    }

    cleanup() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }

    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            
            const timeSinceLastSuccess = Date.now() - this.lastSuccessfulRequest;
            const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
            
            const isHealthy = this.available && 
                             errorRate < 0.1 && 
                             timeSinceLastSuccess < 300000; // 5 minutes
            
            return {
                healthy: isHealthy,
                details: {
                    available: this.available,
                    requestCount: this.requestCount,
                    errorCount: this.errorCount,
                    errorRate: errorRate,
                    timeSinceLastSuccess: timeSinceLastSuccess,
                    baseUrl: this.baseUrl,
                    response: response
                }
            };
            
        } catch (error) {
            return {
                healthy: false,
                details: {
                    error: error.message,
                    available: this.available,
                    requestCount: this.requestCount,
                    errorCount: this.errorCount,
                    baseUrl: this.baseUrl
                }
            };
        }
    }

    async makeRequest(endpoint) {
        this.requestCount++;
        
        if (!this.available) {
            this.errorCount++;
            throw new Error('External API unavailable');
        }
        
        // Simulate network request
        const delay = Math.random() * 200 + 50;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
            this.errorCount++;
            throw new Error('API request failed');
        }
        
        this.lastSuccessfulRequest = Date.now();
        
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            endpoint
        };
    }

    getMetrics() {
        return {
            name: this.name,
            available: this.available,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
            lastSuccessfulRequest: this.lastSuccessfulRequest
        };
    }
}

class MessageQueueService {
    constructor({ config }) {
        this.name = 'MessageQueueService';
        this.config = config;
        this.queue = [];
        this.processed = 0;
        this.failed = 0;
        this.maxQueueSize = config.maxQueueSize || 1000;
        this.connected = true;
        this.processing = false;
        this.intervals = [];
        
        // Start processing messages
        this.startProcessing();
        
        // Simulate connection issues
        const connectionInterval = setInterval(() => {
            if (Math.random() < 0.015) { // 1.5% chance of connection issue
                this.connected = false;
                setTimeout(() => { this.connected = true; }, 1000);
            }
        }, 2500);
        this.intervals.push(connectionInterval);
    }

    cleanup() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }

    async healthCheck() {
        try {
            const queueUtilization = this.queue.length / this.maxQueueSize;
            const errorRate = (this.processed + this.failed) > 0 ? this.failed / (this.processed + this.failed) : 0;
            
            let healthy = this.connected && queueUtilization < 0.9 && errorRate < 0.05;
            
            // Check if processing is stuck
            if (this.queue.length > 0 && !this.processing) {
                healthy = false;
            }
            
            return {
                healthy: healthy,
                details: {
                    connected: this.connected,
                    queueLength: this.queue.length,
                    maxQueueSize: this.maxQueueSize,
                    queueUtilization: queueUtilization,
                    processed: this.processed,
                    failed: this.failed,
                    errorRate: errorRate,
                    processing: this.processing
                }
            };
            
        } catch (error) {
            return {
                healthy: false,
                details: {
                    error: error.message,
                    queueLength: this.queue.length,
                    processed: this.processed,
                    failed: this.failed
                }
            };
        }
    }

    async addMessage(message) {
        if (!this.connected) throw new Error('Queue not connected');
        
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error('Queue is full');
        }
        
        this.queue.push({
            id: Date.now() + Math.random(),
            message,
            timestamp: Date.now()
        });
    }

    async startProcessing() {
        const processingInterval = setInterval(async () => {
            if (this.connected && this.queue.length > 0) {
                this.processing = true;
                
                try {
                    const message = this.queue.shift();
                    
                    // Simulate message processing
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
                    
                    // Simulate occasional processing failures
                    if (Math.random() < 0.02) { // 2% failure rate
                        this.failed++;
                        throw new Error('Message processing failed');
                    }
                    
                    this.processed++;
                    
                } catch (error) {
                    console.log(`Message processing error: ${error.message}`);
                } finally {
                    this.processing = false;
                }
            }
        }, 200);
        this.intervals.push(processingInterval);
    }

    getMetrics() {
        return {
            name: this.name,
            connected: this.connected,
            queueLength: this.queue.length,
            processed: this.processed,
            failed: this.failed,
            processing: this.processing
        };
    }
}

// ============ HEALTH MONITORING SYSTEM ============

class HealthMonitor {
    constructor({ container }) {
        this.container = container;
        this.healthChecks = new Map();
        this.alerts = [];
        this.monitoring = false;
        this.checkInterval = 30000; // 30 seconds
        this.alertThresholds = {
            consecutiveFailures: 3,
            errorRate: 0.1,
            responseTime: 5000
        };
    }

    async discoverServices() {
        console.log('\n🔍 === DISCOVERING MONITORABLE SERVICES ===');
        
        const monitorableServices = this.container.getServicesByTags(['monitorable'], 'AND');
        console.log(`Found ${monitorableServices.length} monitorable services`);
        
        for (const serviceInfo of monitorableServices) {
            const service = this.container.resolve(serviceInfo.name);
            
            if (typeof service.healthCheck === 'function') {
                const healthCheck = new HealthCheck(
                    service.name,
                    () => service.healthCheck(),
                    {
                        timeout: 5000,
                        interval: this.checkInterval,
                        retries: 3
                    }
                );
                
                this.healthChecks.set(service.name, healthCheck);
                console.log(`   ✅ Registered health check for ${service.name}`);
            } else {
                console.log(`   ⚠️ ${service.name} does not implement healthCheck()`);
            }
        }
        
        return this.healthChecks.size;
    }

    async startMonitoring() {
        if (this.monitoring) {
            console.log('⚠️ Monitoring already started');
            return;
        }
        
        console.log('\n🏥 === STARTING HEALTH MONITORING ===');
        this.monitoring = true;
        
        // Initial health check
        await this.performHealthChecks();
        
        // Schedule periodic health checks
        this.monitoringInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, this.checkInterval);
        
        console.log(`✅ Health monitoring started (interval: ${this.checkInterval}ms)`);
    }

    async stopMonitoring() {
        if (!this.monitoring) return;
        
        console.log('\n🛑 === STOPPING HEALTH MONITORING ===');
        this.monitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('✅ Health monitoring stopped');
    }

    async performHealthChecks() {
        const results = new Map();
        
        console.log(`\n🏥 Performing health checks for ${this.healthChecks.size} services...`);
        
        const checkPromises = Array.from(this.healthChecks.values()).map(async (healthCheck) => {
            try {
                const result = await healthCheck.execute();
                results.set(healthCheck.name, result);
                
                // Check for alerts
                await this.checkForAlerts(healthCheck, result);
                
                const emoji = result.status === HEALTH_STATUS.HEALTHY ? '✅' : 
                             result.status === HEALTH_STATUS.DEGRADED ? '⚠️' : '❌';
                console.log(`   ${emoji} ${healthCheck.name}: ${result.status} (${result.duration}ms)`);
                
                return result;
            } catch (error) {
                console.log(`   ❌ ${healthCheck.name}: Error - ${error.message}`);
                return {
                    name: healthCheck.name,
                    status: HEALTH_STATUS.UNHEALTHY,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        await Promise.all(checkPromises);
        return results;
    }

    async checkForAlerts(healthCheck, result) {
        const stats = healthCheck.getStats();
        if (!stats) return;
        
        // Check for consecutive failures
        if (stats.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
            await this.createAlert({
                service: healthCheck.name,
                level: HEALTH_LEVELS.CRITICAL,
                message: `Service has failed ${stats.consecutiveFailures} consecutive health checks`,
                details: { consecutiveFailures: stats.consecutiveFailures, lastResult: result }
            });
        }
        
        // Check for low success rate
        if (stats.successRate < (1 - this.alertThresholds.errorRate)) {
            await this.createAlert({
                service: healthCheck.name,
                level: HEALTH_LEVELS.WARNING,
                message: `Service has low success rate: ${(stats.successRate * 100).toFixed(1)}%`,
                details: { successRate: stats.successRate, lastResult: result }
            });
        }
        
        // Check for slow response times
        if (stats.averageDuration > this.alertThresholds.responseTime) {
            await this.createAlert({
                service: healthCheck.name,
                level: HEALTH_LEVELS.WARNING,
                message: `Service has slow response times: ${stats.averageDuration.toFixed(0)}ms avg`,
                details: { averageDuration: stats.averageDuration, lastResult: result }
            });
        }
    }

    async createAlert(alert) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullAlert = {
            id: alertId,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false,
            ...alert
        };
        
        this.alerts.push(fullAlert);
        
        const emoji = alert.level === HEALTH_LEVELS.CRITICAL ? '🚨' : 
                     alert.level === HEALTH_LEVELS.WARNING ? '⚠️' : 'ℹ️';
        console.log(`   ${emoji} ALERT [${alert.level.toUpperCase()}] ${alert.service}: ${alert.message}`);
        
        // Keep only recent alerts (last 100)
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
        
        return fullAlert;
    }

    getSystemHealth() {
        const healthSummary = {
            overall: HEALTH_STATUS.HEALTHY,
            services: {},
            summary: {
                total: this.healthChecks.size,
                healthy: 0,
                degraded: 0,
                unhealthy: 0,
                unknown: 0
            },
            alerts: {
                total: this.alerts.length,
                critical: this.alerts.filter(a => a.level === HEALTH_LEVELS.CRITICAL && !a.resolved).length,
                warning: this.alerts.filter(a => a.level === HEALTH_LEVELS.WARNING && !a.resolved).length,
                unacknowledged: this.alerts.filter(a => !a.acknowledged && !a.resolved).length
            }
        };
        
        this.healthChecks.forEach((healthCheck, serviceName) => {
            const stats = healthCheck.getStats();
            const status = healthCheck.lastStatus;
            
            healthSummary.services[serviceName] = {
                status: status,
                lastCheck: healthCheck.lastCheck,
                consecutiveFailures: healthCheck.consecutiveFailures,
                stats: stats
            };
            
            healthSummary.summary[status]++;
        });
        
        // Determine overall health
        if (healthSummary.summary.unhealthy > 0) {
            healthSummary.overall = HEALTH_STATUS.UNHEALTHY;
        } else if (healthSummary.summary.degraded > 0) {
            healthSummary.overall = HEALTH_STATUS.DEGRADED;
        }
        
        return healthSummary;
    }

    getAlerts(filter = {}) {
        let filteredAlerts = [...this.alerts];
        
        if (filter.level) {
            filteredAlerts = filteredAlerts.filter(a => a.level === filter.level);
        }
        
        if (filter.service) {
            filteredAlerts = filteredAlerts.filter(a => a.service === filter.service);
        }
        
        if (filter.unresolved) {
            filteredAlerts = filteredAlerts.filter(a => !a.resolved);
        }
        
        if (filter.unacknowledged) {
            filteredAlerts = filteredAlerts.filter(a => !a.acknowledged);
        }
        
        return filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            console.log(`✅ Alert ${alertId} acknowledged`);
            return true;
        }
        return false;
    }

    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date().toISOString();
            console.log(`✅ Alert ${alertId} resolved`);
            return true;
        }
        return false;
    }

    generateHealthReport() {
        const systemHealth = this.getSystemHealth();
        const recentAlerts = this.getAlerts({ unresolved: true });
        
        console.log('\n📋 === HEALTH MONITORING REPORT ===');
        
        console.log(`\nSystem Overall Health: ${systemHealth.overall.toUpperCase()}`);
        
        console.log('\nService Health Summary:');
        console.log(`   Total Services: ${systemHealth.summary.total}`);
        console.log(`   ✅ Healthy: ${systemHealth.summary.healthy}`);
        console.log(`   ⚠️ Degraded: ${systemHealth.summary.degraded}`);
        console.log(`   ❌ Unhealthy: ${systemHealth.summary.unhealthy}`);
        console.log(`   ❓ Unknown: ${systemHealth.summary.unknown}`);
        
        console.log('\nAlert Summary:');
        console.log(`   Total Alerts: ${systemHealth.alerts.total}`);
        console.log(`   🚨 Critical: ${systemHealth.alerts.critical}`);
        console.log(`   ⚠️ Warning: ${systemHealth.alerts.warning}`);
        console.log(`   📢 Unacknowledged: ${systemHealth.alerts.unacknowledged}`);
        
        console.log('\nService Details:');
        Object.entries(systemHealth.services).forEach(([serviceName, serviceHealth]) => {
            const emoji = serviceHealth.status === HEALTH_STATUS.HEALTHY ? '✅' : 
                         serviceHealth.status === HEALTH_STATUS.DEGRADED ? '⚠️' : '❌';
            console.log(`   ${emoji} ${serviceName}:`);
            console.log(`      Status: ${serviceHealth.status}`);
            console.log(`      Consecutive Failures: ${serviceHealth.consecutiveFailures}`);
            if (serviceHealth.stats) {
                console.log(`      Success Rate: ${(serviceHealth.stats.successRate * 100).toFixed(1)}%`);
                console.log(`      Avg Response: ${serviceHealth.stats.averageDuration.toFixed(0)}ms`);
            }
        });
        
        if (recentAlerts.length > 0) {
            console.log('\nActive Alerts:');
            recentAlerts.slice(0, 10).forEach(alert => {
                const emoji = alert.level === HEALTH_LEVELS.CRITICAL ? '🚨' : '⚠️';
                console.log(`   ${emoji} [${alert.level.toUpperCase()}] ${alert.service}: ${alert.message}`);
                console.log(`      Time: ${alert.timestamp}`);
                console.log(`      Acknowledged: ${alert.acknowledged ? 'Yes' : 'No'}`);
            });
        }
        
        return systemHealth;
    }
}

// ============ MAIN EXECUTION ============

async function demonstrateHealthMonitoring() {
    try {
        console.log('🚀 === HEALTH MONITORING DEMO ===');
        
        const container = new SDI({ verbose: false });

        // Register configuration
        container.value('config', {
            database: { maxConnections: 20 },
            cache: { maxSize: 1000 },
            api: { 
                apiUrl: 'https://api.example.com',
                timeout: 5000 
            },
            messageQueue: { maxQueueSize: 1000 }
        });

        // Register monitorable services
        container.register(DatabaseService, 'databaseService')
            .withTags('service', 'database', 'monitorable', 'critical')
            .asSingleton();

        container.register(CacheService, 'cacheService')
            .withTags('service', 'cache', 'monitorable', 'performance')
            .asSingleton();

        container.register(ExternalApiService, 'externalApiService')
            .withTags('service', 'external', 'monitorable', 'integration')
            .asSingleton();

        container.register(MessageQueueService, 'messageQueueService')
            .withTags('service', 'messaging', 'monitorable', 'async')
            .asSingleton();

        // Create health monitor
        const healthMonitor = new HealthMonitor({ container });

        // Discover and register health checks
        const discoveredServices = await healthMonitor.discoverServices();
        console.log(`✅ Discovered ${discoveredServices} monitorable services`);

        // Start monitoring
        await healthMonitor.startMonitoring();

        // Simulate some service activity to generate realistic health data
        console.log('\n⚡ === SIMULATING SERVICE ACTIVITY ===');
        
        const databaseService = container.resolve('databaseService');
        const cacheService = container.resolve('cacheService');
        const apiService = container.resolve('externalApiService');
        const queueService = container.resolve('messageQueueService');

        // Generate some load
        for (let i = 0; i < 20; i++) {
            await Promise.all([
                databaseService.query(`SELECT * FROM test WHERE id = ${i}`).catch(() => {}),
                cacheService.set(`key_${i}`, `value_${i}`).catch(() => {}),
                cacheService.get(`key_${i}`).catch(() => {}),
                apiService.makeRequest(`/test/${i}`).catch(() => {}),
                queueService.addMessage(`test message ${i}`).catch(() => {})
            ]);
            
            // Add some delay between operations
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for a few monitoring cycles
        console.log('\n⏳ Waiting for monitoring cycles...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Perform manual health check
        console.log('\n🔍 === MANUAL HEALTH CHECK ===');
        await healthMonitor.performHealthChecks();

        // Generate health report
        const healthReport = healthMonitor.generateHealthReport();

        // Demonstrate alert management
        console.log('\n🚨 === ALERT MANAGEMENT ===');
        const alerts = healthMonitor.getAlerts({ unresolved: true });
        
        if (alerts.length > 0) {
            console.log(`Found ${alerts.length} unresolved alerts`);
            
            // Acknowledge first alert
            const firstAlert = alerts[0];
            healthMonitor.acknowledgeAlert(firstAlert.id);
            
            // Resolve second alert if exists
            if (alerts.length > 1) {
                healthMonitor.resolveAlert(alerts[1].id);
            }
        } else {
            console.log('No unresolved alerts found');
        }

        // Service discovery for monitoring
        console.log('\n🔍 === MONITORING SERVICE DISCOVERY ===');
        const criticalServices = container.getServicesByTags(['critical'], 'AND');
        const performanceServices = container.getServicesByTags(['performance'], 'AND');
        const integrationServices = container.getServicesByTags(['integration'], 'AND');
        
        console.log(`Critical services: ${criticalServices.length}`);
        criticalServices.forEach(service => {
            console.log(`   - ${service.name}: [${Array.from(service.service.tags).join(', ')}]`);
        });
        
        console.log(`Performance services: ${performanceServices.length}`);
        console.log(`Integration services: ${integrationServices.length}`);

        // Advanced monitoring queries
        console.log('\n📊 === ADVANCED MONITORING ANALYSIS ===');
        
        const monitorableServices = container.getServicesByTags(['monitorable'], 'AND');
        console.log(`\nMonitorable Services Analysis:`);
        
        monitorableServices.forEach(serviceInfo => {
            const service = container.resolve(serviceInfo.name);
            const metrics = service.getMetrics();
            console.log(`   ${metrics.name}:`);
            Object.entries(metrics).forEach(([key, value]) => {
                if (key !== 'name') {
                    console.log(`     ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
                }
            });
        });

        // Health trends analysis
        console.log('\n📈 === HEALTH TRENDS ===');
        healthMonitor.healthChecks.forEach((healthCheck, serviceName) => {
            const stats = healthCheck.getStats();
            if (stats) {
                console.log(`${serviceName}:`);
                console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
                console.log(`   Avg Response Time: ${stats.averageDuration.toFixed(0)}ms`);
                console.log(`   Total Checks: ${stats.totalChecks}`);
                console.log(`   Consecutive Failures: ${stats.consecutiveFailures}`);
            }
        });

        // Stop monitoring
        await healthMonitor.stopMonitoring();

        // Cleanup all services to stop intervals
        console.log('\n🧹 === CLEANING UP SERVICES ===');
        const allServices = [databaseService, cacheService, apiService, queueService];
        allServices.forEach(service => {
            if (typeof service.cleanup === 'function') {
                service.cleanup();
                console.log(`✅ Cleaned up ${service.name}`);
            }
        });

        console.log('\n✅ Health monitoring demonstration completed!');
        
        // Force exit to ensure the process terminates
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Execute the demo
demonstrateHealthMonitoring(); 