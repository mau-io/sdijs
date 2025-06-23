/**
 * Express.js Integration Example
 * 
 * This example demonstrates:
 * - Integrating SDI with Express.js
 * - Request-scoped services
 * - Middleware for dependency injection
 * - Clean separation of concerns
 * - Error handling with DI
 */

import express from 'express';
import { createContainer } from '../../index.js';

// Create the main container
const container = createContainer();

// Configuration
container.value('config', {
    server: {
        port: 3000,
        host: 'localhost'
    },
    database: {
        host: 'localhost',
        port: 5432,
        name: 'webapp_db'
    },
    auth: {
        jwtSecret: 'your-secret-key',
        tokenExpiry: '1h'
    },
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Database service (singleton)
class DatabaseService {
    constructor({ config }) {
        this.config = config.database;
        this.isConnected = false;
        this.users = new Map([
            [1, { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' }],
            [2, { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }]
        ]);
        
        console.log('🗄️ Database service initialized');
    }

    async connect() {
        if (!this.isConnected) {
            console.log(`🔌 Connecting to database at ${this.config.host}:${this.config.port}`);
            // Simulate connection
            await new Promise(resolve => setTimeout(resolve, 100));
            this.isConnected = true;
            console.log('✅ Database connected');
        }
    }

    async disconnect() {
        if (this.isConnected) {
            console.log('🔌 Disconnecting from database');
            this.isConnected = false;
        }
    }

    async findUser(id) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
        return this.users.get(id) || null;
    }

    async findUserByEmail(email) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        await new Promise(resolve => setTimeout(resolve, 15));
        return Array.from(this.users.values()).find(user => user.email === email) || null;
    }

    async createUser(userData) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        await new Promise(resolve => setTimeout(resolve, 20));
        
        const id = Math.max(...this.users.keys()) + 1;
        const user = {
            id,
            ...userData,
            createdAt: new Date().toISOString()
        };
        
        this.users.set(id, user);
        return user;
    }

    async updateUser(id, userData) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        await new Promise(resolve => setTimeout(resolve, 15));
        
        const existingUser = this.users.get(id);
        if (!existingUser) {
            return null;
        }
        
        const updatedUser = {
            ...existingUser,
            ...userData,
            updatedAt: new Date().toISOString()
        };
        
        this.users.set(id, updatedUser);
        return updatedUser;
    }

    async deleteUser(id) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        await new Promise(resolve => setTimeout(resolve, 12));
        return this.users.delete(id);
    }
}

container.singleton('database', DatabaseService);

// Request context (request-scoped)
class RequestContext {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.startTime = Date.now();
        this.user = null;
        this.metadata = new Map();
        
        console.log(`📝 Request context created: ${this.id}`);
    }

    setUser(user) {
        this.user = user;
    }

    getUser() {
        return this.user;
    }

    setMetadata(key, value) {
        this.metadata.set(key, value);
    }

    getMetadata(key) {
        return this.metadata.get(key);
    }

    getElapsedTime() {
        return Date.now() - this.startTime;
    }
}

// Authentication service (request-scoped)
class AuthService {
    constructor({ config, requestContext }) {
        this.jwtSecret = config.auth.jwtSecret;
        this.tokenExpiry = config.auth.tokenExpiry;
        this.requestContext = requestContext;
        this.tokens = new Map(); // In production, use Redis or similar
        
        console.log(`🔐 Auth service initialized for request: ${requestContext.id}`);
    }

    generateToken(user) {
        const token = Math.random().toString(36).substr(2, 15);
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
        
        this.tokens.set(token, {
            user,
            expiresAt
        });
        
        return token;
    }

    validateToken(token) {
        if (!token) {
            throw new Error('Token is required');
        }
        
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

    login(email, password) {
        // Simulate authentication (in production, hash passwords)
        if (email === 'john@example.com' && password === 'password') {
            const user = { id: 1, name: 'John Doe', email, role: 'admin' };
            const token = this.generateToken(user);
            this.requestContext.setUser(user);
            return { user, token };
        }
        
        if (email === 'jane@example.com' && password === 'password') {
            const user = { id: 2, name: 'Jane Smith', email, role: 'user' };
            const token = this.generateToken(user);
            this.requestContext.setUser(user);
            return { user, token };
        }
        
        throw new Error('Invalid credentials');
    }
}

// User repository (request-scoped)
class UserRepository {
    constructor({ database, requestContext }) {
        this.database = database;
        this.requestContext = requestContext;
        
        console.log(`📊 User repository initialized for request: ${requestContext.id}`);
    }

    async findById(id) {
        return await this.database.findUser(id);
    }

    async findByEmail(email) {
        return await this.database.findUserByEmail(email);
    }

    async create(userData) {
        return await this.database.createUser(userData);
    }

    async update(id, userData) {
        return await this.database.updateUser(id, userData);
    }

    async delete(id) {
        return await this.database.deleteUser(id);
    }
}

// User service (request-scoped)
class UserService {
    constructor({ userRepository, authService, requestContext }) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.requestContext = requestContext;
        
        console.log(`👥 User service initialized for request: ${requestContext.id}`);
    }

    async getAllUsers() {
        // In a real app, this would paginate
        const users = [];
        for (let i = 1; i <= 10; i++) {
            const user = await this.userRepository.findById(i);
            if (user) users.push(user);
        }
        return users;
    }

    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async createUser(userData) {
        // Check permissions
        const currentUser = this.requestContext.getUser();
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error('Insufficient permissions');
        }

        // Validate data
        if (!userData.name || !userData.email) {
            throw new Error('Name and email are required');
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        return await this.userRepository.create(userData);
    }

    async updateUser(id, userData) {
        const currentUser = this.requestContext.getUser();
        
        // Users can update themselves, admins can update anyone
        if (!currentUser || (currentUser.id !== id && currentUser.role !== 'admin')) {
            throw new Error('Insufficient permissions');
        }

        const updatedUser = await this.userRepository.update(id, userData);
        if (!updatedUser) {
            throw new Error('User not found');
        }

        return updatedUser;
    }

    async deleteUser(id) {
        const currentUser = this.requestContext.getUser();
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error('Insufficient permissions');
        }

        const success = await this.userRepository.delete(id);
        if (!success) {
            throw new Error('User not found');
        }

        return { success: true };
    }
}

// Register request-scoped services
container.register(RequestContext, 'requestContext').asScoped();
container.register(AuthService, 'authService').asScoped();
container.register(UserRepository, 'userRepository').asScoped();
container.register(UserService, 'userService').asScoped();

// Express middleware for dependency injection
function createDIMiddleware(container) {
    return (req, res, next) => {
        // Create a new scope for this request
        const requestScope = container.createScope(`request-${Date.now()}`);
        
        // Attach the scope to the request
        req.scope = requestScope;
        req.container = requestScope;
        
        // Clean up scope when response finishes
        res.on('finish', () => {
            console.log(`🧹 Disposing request scope for ${req.method} ${req.path}`);
            requestScope.dispose();
        });
        
        next();
    };
}

// Authentication middleware
function createAuthMiddleware() {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization token required' });
            }
            
            const token = authHeader.substring(7);
            const authService = req.container.resolve('authService');
            const user = authService.validateToken(token);
            
            // User is automatically set in request context by auth service
            next();
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    };
}

// Error handling middleware
function createErrorMiddleware() {
    return (error, req, res, next) => {
        console.error('❌ Request error:', error.message);
        
        // Log error with request context if available
        if (req.container) {
            try {
                const requestContext = req.container.resolve('requestContext');
                console.error(`Request ${requestContext.id} failed after ${requestContext.getElapsedTime()}ms`);
            } catch (e) {
                // Ignore if request context is not available
            }
        }
        
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        
        if (error.message.includes('permissions') || error.message.includes('Unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        
        if (error.message.includes('required') || error.message.includes('Invalid')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    };
}

// Route handlers
const authRoutes = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            
            const authService = req.container.resolve('authService');
            const result = authService.login(email, password);
            
            res.json({
                message: 'Login successful',
                user: result.user,
                token: result.token
            });
        } catch (error) {
            next(error);
        }
    }
};

const userRoutes = {
    async getUsers(req, res, next) {
        try {
            const userService = req.container.resolve('userService');
            const users = await userService.getAllUsers();
            
            res.json({ users });
        } catch (error) {
            next(error);
        }
    },

    async getUser(req, res, next) {
        try {
            const { id } = req.params;
            const userService = req.container.resolve('userService');
            const user = await userService.getUserById(parseInt(id));
            
            res.json({ user });
        } catch (error) {
            next(error);
        }
    },

    async createUser(req, res, next) {
        try {
            const userService = req.container.resolve('userService');
            const user = await userService.createUser(req.body);
            
            res.status(201).json({ user });
        } catch (error) {
            next(error);
        }
    },

    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const userService = req.container.resolve('userService');
            const user = await userService.updateUser(parseInt(id), req.body);
            
            res.json({ user });
        } catch (error) {
            next(error);
        }
    },

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            const userService = req.container.resolve('userService');
            const result = await userService.deleteUser(parseInt(id));
            
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
};

// Create Express app
function createApp() {
    const app = express();
    
    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    app.use((req, res, next) => {
        const config = container.resolve('config');
        res.header('Access-Control-Allow-Origin', config.cors.origin);
        res.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
    });
    
    // Dependency injection middleware
    app.use(createDIMiddleware(container));
    
    // Routes
    app.post('/api/auth/login', authRoutes.login);
    
    // Protected routes
    const auth = createAuthMiddleware();
    app.get('/api/users', auth, userRoutes.getUsers);
    app.get('/api/users/:id', auth, userRoutes.getUser);
    app.post('/api/users', auth, userRoutes.createUser);
    app.put('/api/users/:id', auth, userRoutes.updateUser);
    app.delete('/api/users/:id', auth, userRoutes.deleteUser);
    
    // Health check
    app.get('/health', (req, res) => {
        const requestContext = req.container.resolve('requestContext');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            requestId: requestContext.id,
            uptime: process.uptime()
        });
    });
    
    // Error handling
    app.use(createErrorMiddleware());
    
    return app;
}

// Example usage and testing
async function main() {
    try {
        console.log('=== Express.js Integration Example ===\n');

        // Initialize database
        const database = container.resolve('database');
        await database.connect();

        // Create Express app
        const app = createApp();
        const config = container.resolve('config');

        console.log('🚀 Starting Express server...');
        
        // In a real application, you would start the server:
        // const server = app.listen(config.server.port, config.server.host, () => {
        //     console.log(`✅ Server running at http://${config.server.host}:${config.server.port}`);
        // });

        // For this example, we'll simulate HTTP requests
        console.log('📡 Simulating HTTP requests...\n');

        // Simulate request processing
        const simulateRequest = async (method, path, body = {}, headers = {}) => {
            console.log(`\n🌐 ${method} ${path}`);
            
            // Create mock request and response objects
            const req = {
                method,
                path,
                body,
                headers,
                params: {}
            };
            
            const res = {
                status: (code) => ({ json: (data) => console.log(`Response ${code}:`, data) }),
                json: (data) => console.log('Response 200:', data),
                header: () => {}
            };
            
            // Extract path parameters
            if (path.includes('/users/')) {
                const id = path.split('/users/')[1];
                req.params.id = id;
            }
            
            try {
                // Apply DI middleware
                const diMiddleware = createDIMiddleware(container);
                await new Promise((resolve) => {
                    res.on = (event, callback) => {
                        if (event === 'finish') {
                            setTimeout(callback, 100); // Simulate response finish
                        }
                    };
                    diMiddleware(req, res, resolve);
                });
                
                // Route the request
                if (path === '/api/auth/login' && method === 'POST') {
                    await authRoutes.login(req, res, (err) => {
                        if (err) console.log('Error:', err.message);
                    });
                } else if (path === '/api/users' && method === 'GET') {
                    // Apply auth middleware
                    const authMiddleware = createAuthMiddleware();
                    await new Promise((resolve) => {
                        authMiddleware(req, res, resolve);
                    });
                    await userRoutes.getUsers(req, res, (err) => {
                        if (err) console.log('Error:', err.message);
                    });
                } else if (path.startsWith('/api/users/') && method === 'GET') {
                    const authMiddleware = createAuthMiddleware();
                    await new Promise((resolve) => {
                        authMiddleware(req, res, resolve);
                    });
                    await userRoutes.getUser(req, res, (err) => {
                        if (err) console.log('Error:', err.message);
                    });
                }
                
            } catch (error) {
                console.log('Request error:', error.message);
            }
        };

        // Test login
        await simulateRequest('POST', '/api/auth/login', {
            email: 'john@example.com',
            password: 'password'
        });

        // Test authenticated request
        await simulateRequest('GET', '/api/users', {}, {
            authorization: 'Bearer mock-token-for-demo'
        });

        // Test user detail
        await simulateRequest('GET', '/api/users/1', {}, {
            authorization: 'Bearer mock-token-for-demo'
        });

        console.log('\n=== Container Statistics ===');
        console.log('Global services:', container.getServiceNames().length);
        
        // Clean up
        await database.disconnect();
        console.log('\n✅ Example completed');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Export for use in other files
export { createApp, container, createDIMiddleware, createAuthMiddleware };

// Run the example
main(); 