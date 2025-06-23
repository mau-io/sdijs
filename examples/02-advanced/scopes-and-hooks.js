/**
 * Scopes and Lifecycle Hooks Example
 * 
 * This example demonstrates:
 * - Scoped services for web applications
 * - Lifecycle hooks (beforeCreate, afterCreate, beforeResolve, afterResolve)
 * - Request-scoped services
 * - Proper scope disposal and cleanup
 */

import { createContainer } from '../../index.js';

const container = createContainer();

// Global configuration
container.value('config', {
    database: { host: 'localhost', port: 5432 },
    session: { timeout: 3600000 }, // 1 hour
    security: { tokenExpiry: 900000 } // 15 minutes
});

// Add lifecycle hooks for monitoring and logging
container.hook('beforeCreate', ({ service }) => {
    console.log(`🔧 Creating ${service.lifecycle} service: ${service.name}`);
});

container.hook('afterCreate', ({ service, result }) => {
    console.log(`✅ Created ${service.lifecycle} service: ${service.name}`);
    
    // Add creation timestamp to all services
    if (result && typeof result === 'object') {
        result._createdAt = new Date().toISOString();
    }
});

container.hook('beforeResolve', ({ name }) => {
    console.log(`🔍 Resolving service: ${name}`);
});

container.hook('afterResolve', ({ name, result }) => {
    console.log(`✨ Resolved service: ${name}`);
});

// Global singleton services
class DatabaseConnection {
    constructor({ config }) {
        this.host = config.database.host;
        this.port = config.database.port;
        this.connectionPool = [];
        this.isConnected = false;
    }

    connect() {
        if (!this.isConnected) {
            console.log(`🔌 Connecting to database at ${this.host}:${this.port}`);
            this.isConnected = true;
            // Simulate connection pool
            for (let i = 0; i < 5; i++) {
                this.connectionPool.push({ id: i, inUse: false });
            }
        }
        return this;
    }

    getConnection() {
        const connection = this.connectionPool.find(conn => !conn.inUse);
        if (connection) {
            connection.inUse = true;
            return connection;
        }
        throw new Error('No available database connections');
    }

    releaseConnection(connection) {
        connection.inUse = false;
    }

    disconnect() {
        console.log('🔌 Disconnecting from database');
        this.isConnected = false;
        this.connectionPool = [];
    }
}

container.singleton('database', DatabaseConnection);

// Request-scoped services
class RequestContext {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.startTime = Date.now();
        this.user = null;
        this.session = null;
        this.metadata = new Map();
        
        console.log(`📝 Request context created: ${this.id}`);
    }

    setUser(user) {
        this.user = user;
        console.log(`👤 User set in request ${this.id}: ${user.name}`);
    }

    setSession(session) {
        this.session = session;
        console.log(`🔐 Session set in request ${this.id}: ${session.id}`);
    }

    getElapsedTime() {
        return Date.now() - this.startTime;
    }

    cleanup() {
        console.log(`🧹 Cleaning up request context ${this.id} (${this.getElapsedTime()}ms)`);
        this.metadata.clear();
    }
}

// User session service (request-scoped)
class UserSession {
    constructor({ config }) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.timeout = config.session.timeout;
        this.createdAt = Date.now();
        this.lastAccessed = Date.now();
        this.data = new Map();
        
        console.log(`🔐 User session created: ${this.id}`);
    }

    set(key, value) {
        this.data.set(key, value);
        this.lastAccessed = Date.now();
    }

    get(key) {
        this.lastAccessed = Date.now();
        return this.data.get(key);
    }

    isExpired() {
        return Date.now() - this.lastAccessed > this.timeout;
    }

    cleanup() {
        console.log(`🧹 Cleaning up user session: ${this.id}`);
        this.data.clear();
    }
}

// Authentication service (request-scoped)
class AuthService {
    constructor({ config }) {
        this.tokenExpiry = config.security.tokenExpiry;
        this.tokens = new Map();
        
        console.log(`🔒 Auth service initialized for request`);
    }

    authenticate(username, password) {
        // Simulate authentication
        if (username === 'admin' && password === 'secret') {
            const token = Math.random().toString(36).substr(2, 15);
            const user = {
                id: 1,
                name: username,
                role: 'admin',
                permissions: ['read', 'write', 'admin']
            };
            
            this.tokens.set(token, {
                user,
                expiresAt: Date.now() + this.tokenExpiry
            });
            
            console.log(`✅ User authenticated: ${username}`);
            return { token, user };
        }
        
        console.log(`❌ Authentication failed: ${username}`);
        throw new Error('Invalid credentials');
    }

    validateToken(token) {
        const tokenData = this.tokens.get(token);
        if (!tokenData) {
            throw new Error('Invalid token');
        }
        
        if (Date.now() > tokenData.expiresAt) {
            this.tokens.delete(token);
            throw new Error('Token expired');
        }
        
        return tokenData.user;
    }

    cleanup() {
        console.log(`🧹 Cleaning up auth service (${this.tokens.size} tokens)`);
        this.tokens.clear();
    }
}

// Repository service (request-scoped, uses database connection)
class UserRepository {
    constructor({ database, requestContext }) {
        this.database = database;
        this.requestContext = requestContext;
        this.connection = null;
        
        console.log(`📊 User repository initialized for request: ${requestContext.id}`);
    }

    async findById(id) {
        this.connection = this.database.getConnection();
        
        try {
            console.log(`🔍 Finding user ${id} (connection: ${this.connection.id})`);
            
            // Simulate database query
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const user = {
                id,
                name: `User ${id}`,
                email: `user${id}@example.com`,
                createdAt: new Date().toISOString()
            };
            
            return user;
        } finally {
            this.database.releaseConnection(this.connection);
            this.connection = null;
        }
    }

    async save(user) {
        this.connection = this.database.getConnection();
        
        try {
            console.log(`💾 Saving user ${user.id} (connection: ${this.connection.id})`);
            
            // Simulate database save
            await new Promise(resolve => setTimeout(resolve, 15));
            
            return { ...user, updatedAt: new Date().toISOString() };
        } finally {
            this.database.releaseConnection(this.connection);
            this.connection = null;
        }
    }

    cleanup() {
        if (this.connection) {
            this.database.releaseConnection(this.connection);
            this.connection = null;
        }
        console.log(`🧹 User repository cleaned up`);
    }
}

// Business logic service (request-scoped)
class UserService {
    constructor({ userRepository, userSession, authService, requestContext }) {
        this.userRepository = userRepository;
        this.userSession = userSession;
        this.authService = authService;
        this.requestContext = requestContext;
        
        console.log(`👥 User service initialized for request: ${requestContext.id}`);
    }

    async loginUser(username, password) {
        try {
            const { token, user } = this.authService.authenticate(username, password);
            
            // Set user in request context
            this.requestContext.setUser(user);
            this.requestContext.setSession(this.userSession);
            
            // Store user in session
            this.userSession.set('user', user);
            this.userSession.set('token', token);
            
            return { token, user };
        } catch (error) {
            console.log(`❌ Login failed: ${error.message}`);
            throw error;
        }
    }

    async getCurrentUser(token) {
        const user = this.authService.validateToken(token);
        
        // Get full user data
        const fullUser = await this.userRepository.findById(user.id);
        
        // Update session
        this.userSession.set('lastAccess', new Date().toISOString());
        
        return fullUser;
    }

    async updateUser(token, userData) {
        const user = this.authService.validateToken(token);
        
        if (!user.permissions.includes('write')) {
            throw new Error('Insufficient permissions');
        }
        
        const updatedUser = await this.userRepository.save({
            ...userData,
            id: user.id
        });
        
        // Update session
        this.userSession.set('user', updatedUser);
        
        return updatedUser;
    }

    cleanup() {
        console.log(`🧹 User service cleaned up`);
    }
}

// Register request-scoped services with the main container
container.register(RequestContext, 'requestContext').asScoped();
container.register(UserSession, 'userSession').asScoped();
container.register(AuthService, 'authService').asScoped();
container.register(UserRepository, 'userRepository').asScoped();
container.register(UserService, 'userService').asScoped();

// Simulate web request handling
async function handleRequest(requestData) {
    console.log(`\n🌐 === Handling Request: ${requestData.method} ${requestData.path} ===`);
    
    // Create a new scope for this request (with unique name)
    const scopeName = `request-${Math.random().toString(36).substr(2, 9)}`;
    const requestScope = container.createScope(scopeName);
    
    try {
        // Resolve scoped services within this request scope
        const userService = requestScope.resolve('userService');
        const requestContext = requestScope.resolve('requestContext');
        
        let result;
        
        // Handle different request types
        switch (requestData.path) {
            case '/login':
                result = await userService.loginUser(
                    requestData.body.username,
                    requestData.body.password
                );
                break;
                
            case '/user/me':
                result = await userService.getCurrentUser(requestData.headers.authorization);
                break;
                
            case '/user/update':
                result = await userService.updateUser(
                    requestData.headers.authorization,
                    requestData.body
                );
                break;
                
            default:
                throw new Error('Not found');
        }
        
        console.log(`✅ Request completed successfully in ${requestContext.getElapsedTime()}ms`);
        return { status: 200, data: result };
        
    } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
        return { status: 400, error: error.message };
        
    } finally {
        // Clean up request scope
        console.log(`🧹 Disposing request scope...`);
        requestScope.dispose();
        console.log(`✅ Request scope disposed\n`);
    }
}

// Example usage
async function main() {
    try {
        console.log('=== Scopes and Lifecycle Hooks Example ===');
        
        // Initialize global services
        const database = container.resolve('database');
        database.connect();
        
        // Simulate multiple concurrent requests
        const requests = [
            {
                method: 'POST',
                path: '/login',
                body: { username: 'admin', password: 'secret' },
                headers: {}
            },
            {
                method: 'GET',
                path: '/user/me',
                headers: { authorization: 'token123' },
                body: {}
            },
            {
                method: 'PUT',
                path: '/user/update',
                headers: { authorization: 'token456' },
                body: { name: 'Updated Name', email: 'updated@example.com' }
            }
        ];
        
        // Handle requests concurrently to show scope isolation
        const results = await Promise.allSettled(
            requests.map(request => handleRequest(request))
        );
        
        console.log('=== Request Results ===');
        results.forEach((result, index) => {
            console.log(`Request ${index + 1}:`, result.status === 'fulfilled' ? result.value : result.reason);
        });
        
        // Demonstrate hook management
        console.log('\n=== Hook Management ===');
        console.log('Current hooks:', {
            beforeCreate: container._hooks.beforeCreate.length,
            afterCreate: container._hooks.afterCreate.length,
            beforeResolve: container._hooks.beforeResolve.length,
            afterResolve: container._hooks.afterResolve.length
        });
        
        // Clear hooks to prevent memory leaks
        container.clearHooks('beforeCreate');
        container.clearHooks('afterCreate');
        container.clearHooks('beforeResolve');
        container.clearHooks('afterResolve');
        console.log('Hooks cleared');
        
        // Clean up global services
        database.disconnect();
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 