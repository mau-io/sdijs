/**
 * Basic Dependency Injection Example
 * 
 * This example demonstrates the fundamental concepts of SDI:
 * - Creating a container
 * - Registering services (singleton, transient, value)
 * - Resolving dependencies
 * - The elegant destructuring syntax
 */

import { createContainer } from '../../index.js';

// Create a container
const container = createContainer();

// 1. Register values (configuration, constants)
container.value('config', {
    database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp'
    },
    apiKey: 'secret-key-123'
});

// 2. Register a singleton service (shared across the app)
class DatabaseConnection {
    constructor({ config }) {
        this.host = config.database.host;
        this.port = config.database.port;
        this.database = config.database.name;
        this.connected = false;
    }

    connect() {
        console.log(`Connecting to ${this.host}:${this.port}/${this.database}`);
        this.connected = true;
        return this;
    }

    query(sql) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        console.log(`Executing query: ${sql}`);
        return { rows: [], count: 0 };
    }
}

container.singleton('database', DatabaseConnection);

// 3. Register a transient service (new instance each time)
class Logger {
    constructor() {
        this.timestamp = new Date().toISOString();
    }

    log(message) {
        console.log(`[${this.timestamp}] ${message}`);
    }
}

container.transient('logger', Logger);

// 4. Register a service that depends on other services
class UserService {
    constructor({ database, logger, config }) {
        this.database = database;
        this.logger = logger;
        this.apiKey = config.apiKey;
    }

    async createUser(userData) {
        this.logger.log('Creating new user');
        
        // Connect to database if not connected
        if (!this.database.connected) {
            this.database.connect();
        }

        // Simulate user creation
        const result = this.database.query(
            `INSERT INTO users (name, email) VALUES ('${userData.name}', '${userData.email}')`
        );

        this.logger.log(`User created successfully`);
        return { id: Math.random(), ...userData };
    }

    async findUser(id) {
        this.logger.log(`Finding user with id: ${id}`);
        
        const result = this.database.query(`SELECT * FROM users WHERE id = ${id}`);
        return result.rows[0] || null;
    }
}

container.singleton('userService', UserService);

// 5. Resolve and use services
async function main() {
    try {
        console.log('=== Basic Dependency Injection Example ===\n');

        // Resolve the user service (all dependencies are automatically injected)
        const userService = container.resolve('userService');

        // Use the service
        const newUser = await userService.createUser({
            name: 'John Doe',
            email: 'john@example.com'
        });

        console.log('Created user:', newUser);

        // Find the user
        const foundUser = await userService.findUser(newUser.id);
        console.log('Found user:', foundUser);

        console.log('\n=== Demonstrating Singleton vs Transient ===\n');

        // Singleton: same instance every time
        const db1 = container.resolve('database');
        const db2 = container.resolve('database');
        console.log('Database instances are the same:', db1 === db2); // true

        // Transient: new instance every time
        const logger1 = container.resolve('logger');
        const logger2 = container.resolve('logger');
        console.log('Logger instances are different:', logger1 !== logger2); // true
        console.log('Logger1 timestamp:', logger1.timestamp);
        console.log('Logger2 timestamp:', logger2.timestamp);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the example
main(); 