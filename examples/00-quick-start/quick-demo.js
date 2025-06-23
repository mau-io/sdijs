/**
 * Quick Demo - SDI in Action
 * 
 * This is a simple, working demonstration of SDI's main features.
 * Perfect for getting started quickly!
 */

import { createContainer } from '../../index.js';

console.log('🚀 SDI Quick Demo Starting...\n');

// Create container
const container = createContainer();

// 1. Register a simple value
container.value('appName', 'My Awesome App');
container.value('version', '1.0.0');

// 2. Register configuration
container.value('config', {
    database: { host: 'localhost', port: 5432 },
    api: { timeout: 5000, retries: 3 }
});

// 3. Simple service with dependencies
class Logger {
    constructor({ appName, version }) {
        this.appName = appName;
        this.version = version;
        console.log(`📝 Logger initialized for ${appName} v${version}`);
    }

    info(message) {
        console.log(`[INFO] ${this.appName}: ${message}`);
    }

    error(message) {
        console.log(`[ERROR] ${this.appName}: ${message}`);
    }
}

container.singleton('logger', Logger);

// 4. Database service
class Database {
    constructor({ config, logger }) {
        this.config = config.database;
        this.logger = logger;
        this.connected = false;
        this.logger.info(`Database service created for ${this.config.host}:${this.config.port}`);
    }

    connect() {
        this.connected = true;
        this.logger.info('Database connected successfully');
        return this;
    }

    query(sql) {
        if (!this.connected) {
            this.logger.error('Database not connected!');
            throw new Error('Database not connected');
        }
        this.logger.info(`Executing query: ${sql}`);
        return { rows: [{ id: 1, name: 'John Doe' }], count: 1 };
    }
}

container.singleton('database', Database);

// 5. Business service
class UserService {
    constructor({ database, logger }) {
        this.database = database;
        this.logger = logger;
        this.logger.info('UserService initialized');
    }

    async getUsers() {
        this.logger.info('Getting all users...');
        
        // Connect if not connected
        if (!this.database.connected) {
            this.database.connect();
        }

        const result = this.database.query('SELECT * FROM users');
        this.logger.info(`Found ${result.count} users`);
        return result.rows;
    }

    async createUser(name, email) {
        this.logger.info(`Creating user: ${name} (${email})`);
        
        if (!this.database.connected) {
            this.database.connect();
        }

        const result = this.database.query(`INSERT INTO users (name, email) VALUES ('${name}', '${email}')`);
        this.logger.info('User created successfully');
        return { id: Date.now(), name, email };
    }
}

container.singleton('userService', UserService);

// 6. Demo function
async function runDemo() {
    console.log('=== Resolving Services ===');
    
    // Resolve services - dependencies are automatically injected!
    const userService = container.resolve('userService');
    
    console.log('\n=== Using Services ===');
    
    // Use the services
    const users = await userService.getUsers();
    console.log('Users:', users);
    
    const newUser = await userService.createUser('Alice Smith', 'alice@example.com');
    console.log('New user:', newUser);
    
    console.log('\n=== Demonstrating Singleton Behavior ===');
    
    // Get the same service again - should be same instance
    const userService2 = container.resolve('userService');
    const logger1 = container.resolve('logger');
    const logger2 = container.resolve('logger');
    
    console.log('UserService instances are same:', userService === userService2);
    console.log('Logger instances are same:', logger1 === logger2);
    
    console.log('\n=== Demonstrating Transient Services ===');
    
    // Register a transient service
    class RequestId {
        constructor() {
            this.id = Math.random().toString(36).substr(2, 9);
            console.log(`🆔 RequestId created: ${this.id}`);
        }
    }
    
    container.transient('requestId', RequestId);
    
    const req1 = container.resolve('requestId');
    const req2 = container.resolve('requestId');
    
    console.log('Request IDs are different:', req1.id !== req2.id);
    console.log('Request 1 ID:', req1.id);
    console.log('Request 2 ID:', req2.id);
    
    console.log('\n=== Factory Functions ===');
    
    // Factory function that creates different services based on environment
    container.factory('cache', ({ config }) => {
        console.log('🏭 Cache factory called');
        return {
            type: 'memory',
            data: new Map(),
            set(key, value) {
                this.data.set(key, value);
                console.log(`💾 Cached: ${key}`);
            },
            get(key) {
                const value = this.data.get(key);
                console.log(`🔍 Cache ${value ? 'hit' : 'miss'}: ${key}`);
                return value;
            }
        };
    }).asSingleton();
    
    const cache = container.resolve('cache');
    cache.set('user:1', { name: 'John' });
    const cachedUser = cache.get('user:1');
    console.log('Cached user:', cachedUser);
    
    console.log('\n=== Service Tags ===');
    
    // Register services with tags
    class EmailService {
        send(to, subject, body) {
            console.log(`📧 Email sent to ${to}: ${subject}`);
        }
    }
    
    class SmsService {
        send(to, message) {
            console.log(`📱 SMS sent to ${to}: ${message}`);
        }
    }
    
    container.register(EmailService, 'emailService').withTags('notification', 'email').asSingleton();
    container.register(SmsService, 'smsService').withTags('notification', 'sms').asSingleton();
    
    // Use the notification services
    const emailService = container.resolve('emailService');
    const smsService = container.resolve('smsService');
    
    emailService.send('user@example.com', 'Welcome', 'Welcome to our service!');
    smsService.send('+1234567890', 'Welcome! Thanks for joining.');
    
    console.log('\n=== Multiple Service Resolution ===');
    
    const services = container.resolveAll(['logger', 'database', 'userService']);
    console.log('Resolved services:', Object.keys(services));
    
    console.log('\n=== Container Information ===');
    
    console.log('Registered services:', container.getServiceNames());
    console.log('Service exists check - logger:', container.has('logger'));
    console.log('Service exists check - nonexistent:', container.has('nonexistent'));
    
    console.log('\n✅ Demo completed successfully!');
}

// Run the demo
runDemo().catch(error => {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
}); 