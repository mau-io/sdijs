/**
 * Performance Analysis Example
 * 
 * This example demonstrates how to use SDI for performance monitoring,
 * analysis, and optimization using tag-based service discovery to
 * categorize and measure different types of services.
 */

import SDI from '../../index.js';

// ============ PERFORMANCE MONITORING UTILITIES ============

class PerformanceTimer {
    constructor(name) {
        this.name = name;
        this.startTime = null;
        this.endTime = null;
        this.measurements = [];
    }

    start() {
        this.startTime = process.hrtime.bigint();
        return this;
    }

    stop() {
        this.endTime = process.hrtime.bigint();
        const duration = Number(this.endTime - this.startTime) / 1000000; // Convert to milliseconds
        this.measurements.push(duration);
        return duration;
    }

    getStats() {
        if (this.measurements.length === 0) return null;
        
        const sorted = [...this.measurements].sort((a, b) => a - b);
        return {
            name: this.name,
            count: this.measurements.length,
            min: Math.min(...this.measurements),
            max: Math.max(...this.measurements),
            avg: this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }
}

class PerformanceCollector {
    constructor() {
        this.timers = new Map();
        this.counters = new Map();
        this.gauges = new Map();
        this.startTime = Date.now();
    }

    timer(name) {
        if (!this.timers.has(name)) {
            this.timers.set(name, new PerformanceTimer(name));
        }
        return this.timers.get(name);
    }

    increment(name, value = 1) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
    }

    gauge(name, value) {
        this.gauges.set(name, value);
    }

    getAllStats() {
        const stats = {
            uptime: Date.now() - this.startTime,
            timers: {},
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges)
        };

        this.timers.forEach((timer, name) => {
            stats.timers[name] = timer.getStats();
        });

        return stats;
    }

    reset() {
        this.timers.clear();
        this.counters.clear();
        this.gauges.clear();
        this.startTime = Date.now();
    }
}

// ============ PERFORMANCE-MONITORED SERVICES ============

class FastService {
    constructor({ performanceCollector }) {
        this.name = 'FastService';
        this.perf = performanceCollector;
        this.operationCount = 0;
    }

    async quickOperation(data) {
        const timer = this.perf.timer('fast_service_operation').start();
        this.perf.increment('fast_service_calls');
        
        // Simulate fast operation (1-10ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 1));
        
        this.operationCount++;
        this.perf.gauge('fast_service_operations', this.operationCount);
        
        const duration = timer.stop();
        console.log(`⚡ FastService operation completed in ${duration.toFixed(2)}ms`);
        
        return { result: 'fast', duration, data };
    }

    async batchOperation(items) {
        const timer = this.perf.timer('fast_service_batch').start();
        this.perf.increment('fast_service_batch_calls');
        
        const results = [];
        for (const item of items) {
            const result = await this.quickOperation(item);
            results.push(result);
        }
        
        const duration = timer.stop();
        console.log(`⚡ FastService batch (${items.length} items) completed in ${duration.toFixed(2)}ms`);
        
        return results;
    }

    getMetrics() {
        return {
            name: this.name,
            operationCount: this.operationCount,
            type: 'fast'
        };
    }
}

class SlowService {
    constructor({ performanceCollector }) {
        this.name = 'SlowService';
        this.perf = performanceCollector;
        this.operationCount = 0;
    }

    async heavyOperation(data) {
        const timer = this.perf.timer('slow_service_operation').start();
        this.perf.increment('slow_service_calls');
        
        // Simulate heavy operation (100-500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
        
        this.operationCount++;
        this.perf.gauge('slow_service_operations', this.operationCount);
        
        const duration = timer.stop();
        console.log(`🐌 SlowService operation completed in ${duration.toFixed(2)}ms`);
        
        return { result: 'heavy', duration, data };
    }

    async complexCalculation(iterations = 1000) {
        const timer = this.perf.timer('slow_service_calculation').start();
        this.perf.increment('slow_service_calculations');
        
        // Simulate CPU-intensive calculation
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.sin(i);
        }
        
        const duration = timer.stop();
        console.log(`🧮 SlowService calculation (${iterations} iterations) completed in ${duration.toFixed(2)}ms`);
        
        return { result, duration, iterations };
    }

    getMetrics() {
        return {
            name: this.name,
            operationCount: this.operationCount,
            type: 'slow'
        };
    }
}

class DatabaseService {
    constructor({ performanceCollector }) {
        this.name = 'DatabaseService';
        this.perf = performanceCollector;
        this.queryCount = 0;
        this.connectionPool = { active: 0, idle: 10, max: 20 };
    }

    async query(sql, params = []) {
        const timer = this.perf.timer('database_query').start();
        this.perf.increment('database_queries');
        
        // Simulate database query (10-100ms)
        this.connectionPool.active++;
        this.connectionPool.idle--;
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 90 + 10));
        
        this.connectionPool.active--;
        this.connectionPool.idle++;
        this.queryCount++;
        
        this.perf.gauge('database_active_connections', this.connectionPool.active);
        this.perf.gauge('database_total_queries', this.queryCount);
        
        const duration = timer.stop();
        console.log(`🗄️ Database query completed in ${duration.toFixed(2)}ms`);
        
        return {
            rows: [{ id: 1, data: 'sample' }],
            duration,
            sql: sql.substring(0, 50) + '...'
        };
    }

    async transaction(queries) {
        const timer = this.perf.timer('database_transaction').start();
        this.perf.increment('database_transactions');
        
        console.log(`🔄 Starting transaction with ${queries.length} queries`);
        
        const results = [];
        for (const query of queries) {
            const result = await this.query(query);
            results.push(result);
        }
        
        const duration = timer.stop();
        console.log(`✅ Transaction completed in ${duration.toFixed(2)}ms`);
        
        return { results, duration, queryCount: queries.length };
    }

    getMetrics() {
        return {
            name: this.name,
            queryCount: this.queryCount,
            connectionPool: this.connectionPool,
            type: 'database'
        };
    }
}

class CacheService {
    constructor({ performanceCollector }) {
        this.name = 'CacheService';
        this.perf = performanceCollector;
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
    }

    async get(key) {
        const timer = this.perf.timer('cache_get').start();
        this.perf.increment('cache_operations');
        
        // Simulate cache lookup (1-5ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 4 + 1));
        
        const value = this.cache.get(key);
        if (value) {
            this.hits++;
            this.perf.increment('cache_hits');
        } else {
            this.misses++;
            this.perf.increment('cache_misses');
        }
        
        this.perf.gauge('cache_hit_rate', this.hits / (this.hits + this.misses));
        this.perf.gauge('cache_size', this.cache.size);
        
        const duration = timer.stop();
        const status = value ? 'HIT' : 'MISS';
        console.log(`💾 Cache ${status} for ${key} in ${duration.toFixed(2)}ms`);
        
        return value;
    }

    async set(key, value, ttl = 3600) {
        const timer = this.perf.timer('cache_set').start();
        this.perf.increment('cache_operations');
        
        // Simulate cache write (2-8ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 6 + 2));
        
        this.cache.set(key, { value, expires: Date.now() + (ttl * 1000) });
        this.perf.gauge('cache_size', this.cache.size);
        
        const duration = timer.stop();
        console.log(`💾 Cache SET ${key} in ${duration.toFixed(2)}ms`);
        
        return true;
    }

    async bulkGet(keys) {
        const timer = this.perf.timer('cache_bulk_get').start();
        
        const results = {};
        for (const key of keys) {
            results[key] = await this.get(key);
        }
        
        const duration = timer.stop();
        console.log(`💾 Cache bulk GET (${keys.length} keys) in ${duration.toFixed(2)}ms`);
        
        return results;
    }

    getMetrics() {
        return {
            name: this.name,
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses) || 0,
            type: 'cache'
        };
    }
}

class NetworkService {
    constructor({ performanceCollector }) {
        this.name = 'NetworkService';
        this.perf = performanceCollector;
        this.requestCount = 0;
        this.errorCount = 0;
    }

    async httpRequest(url, options = {}) {
        const timer = this.perf.timer('network_request').start();
        this.perf.increment('network_requests');
        
        // Simulate network request (50-300ms)
        const delay = Math.random() * 250 + 50;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Simulate occasional errors (5% failure rate)
        const success = Math.random() > 0.05;
        
        this.requestCount++;
        if (!success) {
            this.errorCount++;
            this.perf.increment('network_errors');
        }
        
        this.perf.gauge('network_error_rate', this.errorCount / this.requestCount);
        
        const duration = timer.stop();
        const status = success ? 'SUCCESS' : 'ERROR';
        console.log(`🌐 Network request to ${url} ${status} in ${duration.toFixed(2)}ms`);
        
        if (!success) {
            throw new Error(`Network request failed: ${url}`);
        }
        
        return {
            url,
            status: 200,
            duration,
            data: { response: 'ok' }
        };
    }

    async parallelRequests(urls) {
        const timer = this.perf.timer('network_parallel').start();
        
        console.log(`🌐 Making ${urls.length} parallel requests`);
        
        const promises = urls.map(url => 
            this.httpRequest(url).catch(error => ({ url, error: error.message }))
        );
        
        const results = await Promise.all(promises);
        const duration = timer.stop();
        
        const successful = results.filter(r => !r.error).length;
        console.log(`🌐 Parallel requests completed: ${successful}/${urls.length} successful in ${duration.toFixed(2)}ms`);
        
        return results;
    }

    getMetrics() {
        return {
            name: this.name,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: this.errorCount / this.requestCount || 0,
            type: 'network'
        };
    }
}

// ============ PERFORMANCE ANALYZER ============

class PerformanceAnalyzer {
    constructor({ container, performanceCollector }) {
        this.container = container;
        this.perf = performanceCollector;
        this.testResults = [];
    }

    async analyzeServicesByCategory() {
        console.log('\n📊 === PERFORMANCE ANALYSIS BY CATEGORY ===');
        
        const categories = ['fast', 'slow', 'database', 'cache', 'network'];
        const results = {};
        
        for (const category of categories) {
            console.log(`\n🔍 Analyzing ${category} services...`);
            
            const services = this.container.getServicesByTags([category], 'AND');
            const categoryResults = [];
            
            for (const serviceInfo of services) {
                const service = this.container.resolve(serviceInfo.name);
                const result = await this.benchmarkService(service, category);
                categoryResults.push(result);
            }
            
            results[category] = categoryResults;
        }
        
        return results;
    }

    async benchmarkService(service, category) {
        console.log(`⏱️ Benchmarking ${service.name}...`);
        
        const iterations = 10;
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            try {
                let result;
                const startTime = process.hrtime.bigint();
                
                switch (category) {
                    case 'fast':
                        result = await service.quickOperation(`test_${i}`);
                        break;
                    case 'slow':
                        result = await service.heavyOperation(`test_${i}`);
                        break;
                    case 'database':
                        result = await service.query(`SELECT * FROM test WHERE id = ${i}`);
                        break;
                    case 'cache':
                        await service.set(`key_${i}`, `value_${i}`);
                        result = await service.get(`key_${i}`);
                        break;
                    case 'network':
                        result = await service.httpRequest(`https://api.example.com/test/${i}`);
                        break;
                    default:
                        throw new Error(`Unknown category: ${category}`);
                }
                
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                results.push({ success: true, duration, result });
                
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        
        const successful = results.filter(r => r.success);
        const durations = successful.map(r => r.duration);
        
        const stats = {
            service: service.name,
            category,
            iterations,
            successful: successful.length,
            failed: results.length - successful.length,
            successRate: successful.length / results.length,
            performance: durations.length > 0 ? {
                min: Math.min(...durations),
                max: Math.max(...durations),
                avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
            } : null
        };
        
        console.log(`   ✅ ${service.name}: ${stats.successful}/${stats.iterations} successful, avg: ${stats.performance?.avg.toFixed(2)}ms`);
        
        return stats;
    }

    async loadTest() {
        console.log('\n🚀 === LOAD TESTING ===');
        
        const loadTestResults = {};
        const concurrency = 5;
        const iterations = 20;
        
        // Test each service type under load
        const serviceTypes = [
            { tag: 'fast', method: 'quickOperation' },
            { tag: 'cache', method: 'get' },
            { tag: 'database', method: 'query' }
        ];
        
        for (const { tag, method } of serviceTypes) {
            console.log(`\n⚡ Load testing ${tag} services...`);
            
            const services = this.container.getServicesByTags([tag], 'AND');
            
            for (const serviceInfo of services) {
                const service = this.container.resolve(serviceInfo.name);
                const result = await this.runLoadTest(service, method, concurrency, iterations);
                loadTestResults[service.name] = result;
            }
        }
        
        return loadTestResults;
    }

    async runLoadTest(service, method, concurrency, iterations) {
        console.log(`   🔥 Load testing ${service.name} (${concurrency} concurrent, ${iterations} total)`);
        
        const startTime = Date.now();
        const promises = [];
        
        for (let i = 0; i < iterations; i++) {
            const promise = this.executeServiceMethod(service, method, i)
                .then(result => ({ success: true, result, iteration: i }))
                .catch(error => ({ success: false, error: error.message, iteration: i }));
            
            promises.push(promise);
            
            // Control concurrency
            if (promises.length >= concurrency) {
                await Promise.race(promises);
            }
        }
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        
        const successful = results.filter(r => r.success).length;
        const totalTime = endTime - startTime;
        const throughput = successful / (totalTime / 1000);
        
        console.log(`   📊 ${service.name}: ${successful}/${iterations} successful, ${throughput.toFixed(2)} ops/sec`);
        
        return {
            service: service.name,
            concurrency,
            iterations,
            successful,
            failed: iterations - successful,
            totalTime,
            throughput,
            avgResponseTime: totalTime / iterations
        };
    }

    async executeServiceMethod(service, method, index) {
        switch (method) {
            case 'quickOperation':
                return await service.quickOperation(`load_test_${index}`);
            case 'get':
                // First set a value, then get it
                await service.set(`load_key_${index}`, `load_value_${index}`);
                return await service.get(`load_key_${index}`);
            case 'query':
                return await service.query(`SELECT * FROM load_test WHERE id = ${index}`);
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }

    async memoryAnalysis() {
        console.log('\n🧠 === MEMORY ANALYSIS ===');
        
        const memBefore = process.memoryUsage();
        console.log('Memory before operations:');
        console.log(`   RSS: ${(memBefore.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Used: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Total: ${(memBefore.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        
        // Perform memory-intensive operations
        const cacheServices = this.container.getServicesByTags(['cache'], 'AND');
        
        for (const serviceInfo of cacheServices) {
            const service = this.container.resolve(serviceInfo.name);
            
            // Fill cache with data
            console.log(`   📦 Filling ${service.name} with test data...`);
            for (let i = 0; i < 1000; i++) {
                await service.set(`memory_test_${i}`, {
                    data: 'x'.repeat(100),
                    timestamp: Date.now(),
                    index: i
                });
            }
        }
        
        const memAfter = process.memoryUsage();
        console.log('\nMemory after operations:');
        console.log(`   RSS: ${(memAfter.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Used: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Total: ${(memAfter.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        
        const memDiff = {
            rss: memAfter.rss - memBefore.rss,
            heapUsed: memAfter.heapUsed - memBefore.heapUsed,
            heapTotal: memAfter.heapTotal - memBefore.heapTotal
        };
        
        console.log('\nMemory difference:');
        console.log(`   RSS: ${(memDiff.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Used: ${(memDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Heap Total: ${(memDiff.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        
        return { before: memBefore, after: memAfter, diff: memDiff };
    }

    generateReport() {
        console.log('\n📋 === PERFORMANCE REPORT ===');
        
        const stats = this.perf.getAllStats();
        
        console.log(`\nSystem Uptime: ${stats.uptime}ms`);
        
        console.log('\nOperation Timers:');
        Object.entries(stats.timers).forEach(([name, timer]) => {
            if (timer) {
                console.log(`   ${name}:`);
                console.log(`     Count: ${timer.count}`);
                console.log(`     Avg: ${timer.avg.toFixed(2)}ms`);
                console.log(`     Min: ${timer.min.toFixed(2)}ms`);
                console.log(`     Max: ${timer.max.toFixed(2)}ms`);
                console.log(`     P95: ${timer.p95.toFixed(2)}ms`);
            }
        });
        
        console.log('\nCounters:');
        Object.entries(stats.counters).forEach(([name, value]) => {
            console.log(`   ${name}: ${value}`);
        });
        
        console.log('\nGauges:');
        Object.entries(stats.gauges).forEach(([name, value]) => {
            console.log(`   ${name}: ${typeof value === 'number' ? value.toFixed(4) : value}`);
        });
        
        // Service-specific metrics
        console.log('\nService Metrics:');
        const allServices = this.container.getServicesByTags(['fast', 'slow', 'database', 'cache', 'network'], 'OR');
        
        allServices.forEach(serviceInfo => {
            const service = this.container.resolve(serviceInfo.name);
            if (typeof service.getMetrics === 'function') {
                const metrics = service.getMetrics();
                console.log(`   ${metrics.name} (${metrics.type}):`);
                Object.entries(metrics).forEach(([key, value]) => {
                    if (key !== 'name' && key !== 'type') {
                        console.log(`     ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
                    }
                });
            }
        });
        
        return stats;
    }
}

// ============ MAIN EXECUTION ============

async function demonstratePerformanceAnalysis() {
    try {
        console.log('🚀 === PERFORMANCE ANALYSIS DEMO ===');
        
        const container = new SDI({ verbose: false });
        const performanceCollector = new PerformanceCollector();

        // Register performance collector
        container.value('performanceCollector', performanceCollector);

        // Register fast services
        container.register(FastService, 'fastService')
            .withTags('service', 'fast', 'performance', 'optimized')
            .asSingleton();

        // Register slow services
        container.register(SlowService, 'slowService')
            .withTags('service', 'slow', 'performance', 'heavy')
            .asSingleton();

        // Register database services
        container.register(DatabaseService, 'databaseService')
            .withTags('service', 'database', 'performance', 'io')
            .asSingleton();

        // Register cache services
        container.register(CacheService, 'cacheService')
            .withTags('service', 'cache', 'performance', 'memory')
            .asSingleton();

        // Register network services
        container.register(NetworkService, 'networkService')
            .withTags('service', 'network', 'performance', 'io')
            .asSingleton();

        // Create performance analyzer
        const analyzer = new PerformanceAnalyzer({ container, performanceCollector });

        // Warm up services
        console.log('\n🔥 === WARMING UP SERVICES ===');
        const allServices = container.getServicesByTags(['performance'], 'AND');
        console.log(`Found ${allServices.length} performance-monitored services`);
        
        for (const serviceInfo of allServices) {
            const service = container.resolve(serviceInfo.name);
            console.log(`   ✅ Warmed up ${service.name}`);
        }

        // Run performance analysis
        const categoryResults = await analyzer.analyzeServicesByCategory();
        
        // Run load tests
        const loadTestResults = await analyzer.loadTest();
        
        // Memory analysis
        const memoryResults = await analyzer.memoryAnalysis();
        
        // Generate comprehensive report
        const performanceReport = analyzer.generateReport();

        // Service discovery performance analysis
        console.log('\n🔍 === SERVICE DISCOVERY PERFORMANCE ===');
        
        const discoveryTimer = performanceCollector.timer('service_discovery').start();
        
        // Test various tag queries
        const queries = [
            ['performance'],
            ['fast', 'service'],
            ['slow', 'heavy'],
            ['io'],
            ['memory', 'cache'],
            ['database', 'performance'],
            ['network', 'service']
        ];
        
        for (const tags of queries) {
            const queryTimer = performanceCollector.timer(`discovery_${tags.join('_')}`).start();
            const services = container.getServicesByTags(tags, 'AND');
            const queryDuration = queryTimer.stop();
            
            console.log(`   Query [${tags.join(', ')}]: ${services.length} services in ${queryDuration.toFixed(2)}ms`);
        }
        
        const totalDiscoveryTime = discoveryTimer.stop();
        console.log(`   Total discovery time: ${totalDiscoveryTime.toFixed(2)}ms`);

        // Performance recommendations
        console.log('\n💡 === PERFORMANCE RECOMMENDATIONS ===');
        
        const recommendations = [];
        
        // Analyze response times
        Object.entries(performanceReport.timers).forEach(([operation, stats]) => {
            if (stats && stats.avg > 100) {
                recommendations.push(`⚠️ ${operation} is slow (avg: ${stats.avg.toFixed(2)}ms) - consider optimization`);
            }
            if (stats && stats.p95 > 500) {
                recommendations.push(`🚨 ${operation} has high P95 latency (${stats.p95.toFixed(2)}ms) - investigate bottlenecks`);
            }
        });
        
        // Analyze error rates
        Object.entries(performanceReport.gauges).forEach(([metric, value]) => {
            if (metric.includes('error_rate') && value > 0.05) {
                recommendations.push(`🚨 High error rate detected in ${metric}: ${(value * 100).toFixed(2)}%`);
            }
        });
        
        // Memory recommendations
        if (memoryResults.diff.heapUsed > 50 * 1024 * 1024) {
            recommendations.push(`🧠 High memory usage detected: ${(memoryResults.diff.heapUsed / 1024 / 1024).toFixed(2)}MB increase`);
        }
        
        if (recommendations.length === 0) {
            console.log('✅ All systems performing within acceptable parameters');
        } else {
            recommendations.forEach(rec => console.log(`   ${rec}`));
        }

        // Performance summary
        console.log('\n📊 === PERFORMANCE SUMMARY ===');
        
        const summary = {
            totalOperations: Object.values(performanceReport.counters).reduce((a, b) => a + b, 0),
            averageResponseTime: Object.values(performanceReport.timers)
                .filter(t => t)
                .reduce((sum, timer) => sum + timer.avg, 0) / Object.keys(performanceReport.timers).length,
            systemUptime: performanceReport.uptime,
            servicesAnalyzed: allServices.length,
            memoryImpact: memoryResults.diff.heapUsed / 1024 / 1024
        };
        
        console.log(`   Total Operations: ${summary.totalOperations}`);
        console.log(`   Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
        console.log(`   System Uptime: ${summary.systemUptime}ms`);
        console.log(`   Services Analyzed: ${summary.servicesAnalyzed}`);
        console.log(`   Memory Impact: ${summary.memoryImpact.toFixed(2)}MB`);

        console.log('\n✅ Performance analysis demonstration completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Execute the demo
demonstratePerformanceAnalysis(); 