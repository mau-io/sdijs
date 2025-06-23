/**
 * SDI v2.0 Example - Modern API with maintained {a,b,c} destructuring
 */

// For local development, use relative import
// For production usage, use: import { createContainer } from 'sdijs';
import { createContainer } from './index.js';

// ============ SAMPLE SERVICES ============

const CONFIG = {
  apiUrl: 'https://api.example.com',
  dbUrl: 'mongodb://localhost:27017',
  debug: true,
  version: '2.0.0'
};

// Factory function - receives dependencies via destructuring
const logger = ({config}) => {
  if (!config) throw new Error('Config is required for logger');
  
  return {
    info: (msg) => config.debug && console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`)
  };
};

// Class - receives dependencies via destructuring {a,b,c}
class Database {
  constructor({config, logger}) {
    if (!config || !logger) {
      throw new Error('Database requires config and logger');
    }
    
    this.config = config;
    this.logger = logger;
    this.connected = false;
    this.logger.info('Database initialized');
  }

  async connect() {
    if (this.connected) return 'already-connected';
    
    try {
      this.logger.info(`Connecting to ${this.config.dbUrl}`);
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100));
      this.connected = true;
      return 'connected';
    } catch (error) {
      this.logger.error(`Database connection failed: ${error.message}`);
      throw error;
    }
  }

  async query(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error('SQL query must be a non-empty string');
    }
    
    if (!this.connected) {
      await this.connect();
    }
    
    this.logger.info(`Executing: ${sql}`);
    // Simulate query execution
    return Promise.resolve([{ id: 1, name: 'John Doe', email: 'john@example.com' }]);
  }

  async disconnect() {
    if (this.connected) {
      this.logger.info('Disconnecting from database');
      this.connected = false;
    }
  }
}

class ApiClient {
  constructor({config, logger}) {
    if (!config || !logger) {
      throw new Error('ApiClient requires config and logger');
    }
    
    this.config = config;
    this.logger = logger;
    this.logger.info('ApiClient initialized');
  }

  async get(endpoint) {
    if (!endpoint) throw new Error('Endpoint is required');
    
    try {
      this.logger.info(`GET ${this.config.apiUrl}${endpoint}`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 50));
      return { 
        data: { message: 'mock data', timestamp: Date.now() }, 
        status: 200,
        endpoint 
      };
    } catch (error) {
      this.logger.error(`API call failed: ${error.message}`);
      throw error;
    }
  }
}

class UserService {
  constructor({database, apiClient, logger}) {
    if (!database || !apiClient || !logger) {
      throw new Error('UserService requires database, apiClient, and logger');
    }
    
    this.database = database;
    this.apiClient = apiClient;
    this.logger = logger;
    this.logger.info('UserService initialized');
  }

  async findUser(id) {
    if (!id || typeof id !== 'number') {
      throw new Error('User ID must be a valid number');
    }
    
    try {
      await this.database.connect();
      const dbResult = await this.database.query(`SELECT * FROM users WHERE id = ${id}`);
      const apiResult = await this.apiClient.get(`/users/${id}`);
      
      this.logger.info(`Found user ${id}`);
      return { dbResult, apiResult, userId: id };
    } catch (error) {
      this.logger.error(`Failed to find user ${id}: ${error.message}`);
      throw error;
    }
  }

  async createUser(userData) {
    if (!userData || !userData.name || !userData.email) {
      throw new Error('User data must include name and email');
    }
    
    try {
      this.logger.info(`Creating user: ${userData.name}`);
      const newUser = { 
        id: Date.now(), 
        ...userData,
        createdAt: new Date().toISOString()
      };
      
      // Simulate saving to database
      await this.database.query(`INSERT INTO users (name, email) VALUES ('${userData.name}', '${userData.email}')`);
      
      return newUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }
}

class NotificationService {
  constructor({logger}) {
    if (!logger) throw new Error('NotificationService requires logger');
    
    this.logger = logger;
    this.logger.info('NotificationService initialized');
  }

  async sendEmail(to, subject, body) {
    if (!to || !subject || !body) {
      throw new Error('Email requires to, subject, and body');
    }
    
    try {
      this.logger.info(`Sending email to ${to}: ${subject}`);
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return { sent: true, to, subject, timestamp: Date.now() };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}

// ============ NEW vs OLD API DEMONSTRATION ============

console.log('🚀 SDI v2.0 - Modern Dependency Injection');
console.log('='.repeat(50));

// Create container with new modern API - FIXED: Use createContainer factory
const container = createContainer({ 
  verbose: true, 
  autoBinding: true,
});

// ✅ NEW FLUENT API - Much more elegant!
container
  .value('config', CONFIG)
  .factory('logger', logger).asSingleton()
  .singleton(Database)
  .singleton(ApiClient)  
  .singleton(UserService)
  .transient(NotificationService);

console.log('\n💎 DESTRUCTURING STILL WORKS:');

class ExampleService {
  // ✅ STILL USES {a,b,c} destructuring! 
  constructor({userService, database, logger, config}) {
    if (!userService || !database || !logger || !config) {
      throw new Error('ExampleService requires all dependencies');
    }
    
    this.userService = userService;
    this.database = database;
    this.logger = logger;
    this.config = config;
    
    this.logger.info('ExampleService created with destructuring!');
  }

  async doSomething() {
    try {
      const user = await this.userService.findUser(123);
      return user;
    } catch (error) {
      this.logger.error(`ExampleService.doSomething failed: ${error.message}`);
      throw error;
    }
  }
}

container.singleton(ExampleService);

// ============ ADVANCED FEATURES SHOWCASE ============

console.log('\n🎯 NEW FEATURES DEMO:');

// 1. Scoped Dependencies
const requestScope = container.createScope('request');

class RequestContext {
  constructor({}) {
    this.requestId = Math.random().toString(36).substr(2, 9);
    this.startTime = Date.now();
    this.metadata = { version: CONFIG.version };
    console.log(`📝 Created RequestContext: ${this.requestId}`);
  }

  getElapsed() {
    return Date.now() - this.startTime;
  }

  dispose() {
    console.log(`🗑️  Disposing RequestContext: ${this.requestId}`);
  }
}

container.register(RequestContext).asScoped();

// 2. Lifecycle Hooks
container
  .hook('beforeCreate', ({service}) => {
    console.log(`🏗️  Creating: ${service.name}`);
  })
  .hook('afterCreate', ({service, instance}) => {
    console.log(`✅ Created: ${service.name}`);
  });

// 3. Multiple Resolution
console.log('\n📦 Multiple Service Resolution:');
const services = container.resolveAll(['userService', 'database', 'logger']);
console.log(`✨ Resolved ${Object.keys(services).length} services at once!`);

// ============ USAGE EXAMPLES ============

async function demonstrateUsage() {
  console.log('\n🎬 Running demonstration...');
  
  // Track created scopes for cleanup
  const createdScopes = [];
  
  try {
    // Basic resolution
    const userService = container.resolve('userService');
    const exampleService = container.resolve('exampleService');
    
    // Use services with realistic data
    console.log('\n👤 User Operations:');
    const userId = 123;
    const user = await userService.findUser(userId);
    console.log('📋 User found:', {
      id: user.userId,
      data: user.apiResult.data,
      status: user.apiResult.status
    });
    
    const userData = { 
      name: 'Jane Doe', 
      email: 'jane@example.com',
      department: 'Engineering'
    };
    const newUser = await userService.createUser(userData);
    console.log('👤 User created:', {
      id: newUser.id,
      name: newUser.name,
      createdAt: newUser.createdAt
    });
    
    // Scoped resolution
    console.log('\n🔄 Scoped Dependencies:');
    const context1 = requestScope.resolve('requestContext');
    const context2 = requestScope.resolve('requestContext');
    
    console.log(`🔄 Same scope instances: ${context1 === context2}`);
    console.log(`⏱️  Request ${context1.requestId} elapsed: ${context1.getElapsed()}ms`);
    
    // Different scope
    const scope2 = container.createScope('request2');
    createdScopes.push(scope2);
    const context3 = scope2.resolve('requestContext');
    console.log(`🔄 Different scope instances: ${context1 !== context3}`);
    console.log(`📊 Metadata: ${JSON.stringify(context3.metadata)}`);
    
    // Factory with dependencies
    console.log('\n📧 Factory Functions:');
    container.factory('emailService', ({logger, config}) => {
      if (!logger || !config) {
        throw new Error('EmailService factory requires logger and config');
      }
      
      return {
        send: async (to, subject, body) => {
          logger.info(`📧 Sending email via ${config.apiUrl}/email`);
          await new Promise(resolve => setTimeout(resolve, 50));
          return { sent: true, to, subject, timestamp: Date.now() };
        }
      };
    }).asSingleton();
    
    const emailService = container.resolve('emailService');
    const emailResult = await emailService.send('test@example.com', 'Welcome!', 'Hello World');
    console.log('📧 Email sent:', emailResult);
    
    // Demonstrate error handling
    console.log('\n⚠️  Error Handling:');
    try {
      await userService.findUser('invalid'); // Should fail
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    console.log('\n🎉 All features working perfectly!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup resources
    console.log('\n🧹 Cleaning up resources...');
    
    try {
      // Dispose scopes
      requestScope.dispose();
      createdScopes.forEach(scope => scope.dispose());
      
      // Disconnect database
      const database = container.resolve('database');
      await database.disconnect();
      
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError.message);
    }
  }
}

// ============ COMPARISON SUMMARY ============

console.log('\n📊 IMPROVEMENT SUMMARY:');
console.log(`
OLD API (v1.x):                   NEW API (v2.0):
❌ $Inject.addSingleton()         ✅ container.singleton()
❌ $Inject.addTransient()         ✅ container.transient()
❌ $Inject.addValue()             ✅ container.value()
❌ No chaining                    ✅ Fluent chaining
❌ No scopes                      ✅ Scoped dependencies
❌ No factory functions           ✅ Factory with DI
❌ No circular detection          ✅ Automatic detection
❌ No hooks                       ✅ Lifecycle hooks
❌ No tags/metadata               ✅ Service tags
❌ Basic errors                   ✅ Helpful error messages
`);

// Run the demonstration
demonstrateUsage();