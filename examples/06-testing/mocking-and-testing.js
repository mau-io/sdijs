/**
 * Mocking and Testing Example
 * 
 * This example demonstrates:
 * - Using SDI for testable code
 * - Creating mock services for testing
 * - Test isolation with separate containers
 * - Stubbing external dependencies
 * - Integration testing with DI
 */

import { createContainer } from '../../index.js';

// Production services
class EmailService {
    constructor({ config }) {
        this.apiKey = config.email.apiKey;
        this.baseUrl = config.email.baseUrl;
        console.log('📧 Email service initialized');
    }

    async sendEmail(to, subject, body) {
        console.log(`📤 Sending email to ${to}: ${subject}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate potential failure
        if (to.includes('invalid')) {
            throw new Error('Invalid email address');
        }
        
        return {
            messageId: `email_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            timestamp: new Date().toISOString()
        };
    }

    async sendBulkEmails(emails) {
        const results = [];
        
        for (const email of emails) {
            try {
                const result = await this.sendEmail(email.to, email.subject, email.body);
                results.push({ ...result, to: email.to });
            } catch (error) {
                results.push({
                    to: email.to,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return results;
    }
}

class DatabaseService {
    constructor({ config }) {
        this.connectionString = config.database.connectionString;
        this.users = new Map([
            [1, { id: 1, name: 'John Doe', email: 'john@example.com', subscribed: true }],
            [2, { id: 2, name: 'Jane Smith', email: 'jane@example.com', subscribed: false }]
        ]);
        console.log('🗄️ Database service initialized');
    }

    async findUser(id) {
        await new Promise(resolve => setTimeout(resolve, 10));
        return this.users.get(id) || null;
    }

    async findUsersBySubscription(subscribed) {
        await new Promise(resolve => setTimeout(resolve, 15));
        return Array.from(this.users.values()).filter(user => user.subscribed === subscribed);
    }

    async updateUser(id, updates) {
        await new Promise(resolve => setTimeout(resolve, 12));
        
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }
        
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
    }

    async createUser(userData) {
        await new Promise(resolve => setTimeout(resolve, 20));
        
        const id = Math.max(...this.users.keys()) + 1;
        const user = { id, ...userData };
        this.users.set(id, user);
        return user;
    }
}

class LoggingService {
    constructor() {
        this.logs = [];
        console.log('📝 Logging service initialized');
    }

    log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata
        };
        
        this.logs.push(logEntry);
        console.log(`[${level.toUpperCase()}] ${message}`, metadata);
    }

    info(message, metadata) {
        this.log('info', message, metadata);
    }

    error(message, metadata) {
        this.log('error', message, metadata);
    }

    warn(message, metadata) {
        this.log('warn', message, metadata);
    }

    getLogs() {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }
}

// Business logic service that depends on other services
class NotificationService {
    constructor({ emailService, databaseService, loggingService }) {
        this.emailService = emailService;
        this.databaseService = databaseService;
        this.loggingService = loggingService;
        
        this.loggingService.info('Notification service initialized');
    }

    async sendWelcomeEmail(userId) {
        this.loggingService.info('Sending welcome email', { userId });
        
        try {
            const user = await this.databaseService.findUser(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }
            
            const result = await this.emailService.sendEmail(
                user.email,
                'Welcome!',
                `Hello ${user.name}, welcome to our service!`
            );
            
            this.loggingService.info('Welcome email sent successfully', {
                userId,
                messageId: result.messageId
            });
            
            return result;
            
        } catch (error) {
            this.loggingService.error('Failed to send welcome email', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    async sendNewsletterToSubscribers() {
        this.loggingService.info('Starting newsletter campaign');
        
        try {
            const subscribers = await this.databaseService.findUsersBySubscription(true);
            
            if (subscribers.length === 0) {
                this.loggingService.warn('No subscribers found for newsletter');
                return { sent: 0, failed: 0 };
            }
            
            const emails = subscribers.map(user => ({
                to: user.email,
                subject: 'Monthly Newsletter',
                body: `Hello ${user.name}, here's your monthly newsletter!`
            }));
            
            const results = await this.emailService.sendBulkEmails(emails);
            
            const sent = results.filter(r => r.status === 'sent').length;
            const failed = results.filter(r => r.status === 'failed').length;
            
            this.loggingService.info('Newsletter campaign completed', {
                totalSubscribers: subscribers.length,
                sent,
                failed
            });
            
            return { sent, failed, results };
            
        } catch (error) {
            this.loggingService.error('Newsletter campaign failed', {
                error: error.message
            });
            throw error;
        }
    }

    async updateSubscriptionPreference(userId, subscribed) {
        this.loggingService.info('Updating subscription preference', { userId, subscribed });
        
        try {
            const updatedUser = await this.databaseService.updateUser(userId, { subscribed });
            
            // Send confirmation email
            const emailSubject = subscribed ? 'Subscription Confirmed' : 'Unsubscribed Successfully';
            const emailBody = subscribed 
                ? `Hello ${updatedUser.name}, you have been subscribed to our newsletter!`
                : `Hello ${updatedUser.name}, you have been unsubscribed from our newsletter.`;
            
            await this.emailService.sendEmail(updatedUser.email, emailSubject, emailBody);
            
            this.loggingService.info('Subscription preference updated', {
                userId,
                subscribed,
                email: updatedUser.email
            });
            
            return updatedUser;
            
        } catch (error) {
            this.loggingService.error('Failed to update subscription preference', {
                userId,
                error: error.message
            });
            throw error;
        }
    }
}

// Mock services for testing
class MockEmailService {
    constructor() {
        this.sentEmails = [];
        this.shouldFail = false;
        this.failureMessage = 'Mock email failure';
        console.log('📧 Mock email service initialized');
    }

    async sendEmail(to, subject, body) {
        if (this.shouldFail) {
            throw new Error(this.failureMessage);
        }
        
        const email = {
            to,
            subject,
            body,
            messageId: `mock_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            timestamp: new Date().toISOString()
        };
        
        this.sentEmails.push(email);
        return email;
    }

    async sendBulkEmails(emails) {
        const results = [];
        
        for (const email of emails) {
            try {
                const result = await this.sendEmail(email.to, email.subject, email.body);
                results.push({ ...result, to: email.to });
            } catch (error) {
                results.push({
                    to: email.to,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Test helper methods
    getSentEmails() {
        return [...this.sentEmails];
    }

    clearSentEmails() {
        this.sentEmails = [];
    }

    setFailure(shouldFail, message = 'Mock email failure') {
        this.shouldFail = shouldFail;
        this.failureMessage = message;
    }

    getEmailsSentTo(email) {
        return this.sentEmails.filter(e => e.to === email);
    }

    getEmailsWithSubject(subject) {
        return this.sentEmails.filter(e => e.subject === subject);
    }
}

class MockDatabaseService {
    constructor() {
        this.users = new Map([
            [1, { id: 1, name: 'Test User 1', email: 'test1@example.com', subscribed: true }],
            [2, { id: 2, name: 'Test User 2', email: 'test2@example.com', subscribed: false }],
            [3, { id: 3, name: 'Test User 3', email: 'test3@example.com', subscribed: true }]
        ]);
        this.shouldFail = false;
        this.failureMessage = 'Mock database failure';
        console.log('🗄️ Mock database service initialized');
    }

    async findUser(id) {
        if (this.shouldFail) {
            throw new Error(this.failureMessage);
        }
        
        return this.users.get(id) || null;
    }

    async findUsersBySubscription(subscribed) {
        if (this.shouldFail) {
            throw new Error(this.failureMessage);
        }
        
        return Array.from(this.users.values()).filter(user => user.subscribed === subscribed);
    }

    async updateUser(id, updates) {
        if (this.shouldFail) {
            throw new Error(this.failureMessage);
        }
        
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }
        
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
    }

    async createUser(userData) {
        if (this.shouldFail) {
            throw new Error(this.failureMessage);
        }
        
        const id = Math.max(...this.users.keys()) + 1;
        const user = { id, ...userData };
        this.users.set(id, user);
        return user;
    }

    // Test helper methods
    setFailure(shouldFail, message = 'Mock database failure') {
        this.shouldFail = shouldFail;
        this.failureMessage = message;
    }

    addUser(user) {
        this.users.set(user.id, user);
    }

    removeUser(id) {
        this.users.delete(id);
    }

    reset() {
        this.users.clear();
        this.users.set(1, { id: 1, name: 'Test User 1', email: 'test1@example.com', subscribed: true });
        this.users.set(2, { id: 2, name: 'Test User 2', email: 'test2@example.com', subscribed: false });
        this.users.set(3, { id: 3, name: 'Test User 3', email: 'test3@example.com', subscribed: true });
    }
}

class MockLoggingService {
    constructor() {
        this.logs = [];
        console.log('📝 Mock logging service initialized');
    }

    log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata
        };
        
        this.logs.push(logEntry);
    }

    info(message, metadata) {
        this.log('info', message, metadata);
    }

    error(message, metadata) {
        this.log('error', message, metadata);
    }

    warn(message, metadata) {
        this.log('warn', message, metadata);
    }

    getLogs() {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }

    // Test helper methods
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    getLogsContaining(text) {
        return this.logs.filter(log => log.message.includes(text));
    }
}

// Test runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log(`\n🧪 Running ${this.tests.length} tests...\n`);
        
        for (const test of this.tests) {
            try {
                console.log(`▶️ ${test.name}`);
                await test.testFn();
                console.log(`✅ ${test.name} - PASSED\n`);
                this.results.push({ name: test.name, status: 'PASSED' });
            } catch (error) {
                console.log(`❌ ${test.name} - FAILED: ${error.message}\n`);
                this.results.push({ name: test.name, status: 'FAILED', error: error.message });
            }
        }
        
        this.printSummary();
    }

    printSummary() {
        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        
        console.log('=== Test Summary ===');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${this.results.length}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed tests:');
            this.results.filter(r => r.status === 'FAILED').forEach(result => {
                console.log(`  - ${result.name}: ${result.error}`);
            });
        }
    }
}

// Helper function to create test container
function createTestContainer() {
    const container = createContainer();
    
    // Mock configuration
    container.value('config', {
        email: {
            apiKey: 'test-api-key',
            baseUrl: 'https://api.test-email.com'
        },
        database: {
            connectionString: 'test-connection-string'
        }
    });
    
    // Register mock services
    container.singleton('emailService', MockEmailService);
    container.singleton('databaseService', MockDatabaseService);
    container.singleton('loggingService', MockLoggingService);
    container.singleton('notificationService', NotificationService);
    
    return container;
}

// Assertion helpers
function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function assertNotNull(value, message = '') {
    if (value === null || value === undefined) {
        throw new Error(`Assertion failed: ${message}\nExpected non-null value, got: ${value}`);
    }
}

function assertThrows(fn, expectedMessage = '', message = '') {
    try {
        fn();
        throw new Error(`Assertion failed: ${message}\nExpected function to throw, but it didn't`);
    } catch (error) {
        if (expectedMessage && !error.message.includes(expectedMessage)) {
            throw new Error(`Assertion failed: ${message}\nExpected error message to contain: ${expectedMessage}\nActual: ${error.message}`);
        }
    }
}

async function assertThrowsAsync(fn, expectedMessage = '', message = '') {
    try {
        await fn();
        throw new Error(`Assertion failed: ${message}\nExpected function to throw, but it didn't`);
    } catch (error) {
        if (expectedMessage && !error.message.includes(expectedMessage)) {
            throw new Error(`Assertion failed: ${message}\nExpected error message to contain: ${expectedMessage}\nActual: ${error.message}`);
        }
    }
}

// Test suite
async function runTests() {
    const runner = new TestRunner();
    
    // Test 1: Welcome email success
    runner.test('should send welcome email successfully', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const emailService = container.resolve('emailService');
        
        const result = await notificationService.sendWelcomeEmail(1);
        
        assertNotNull(result.messageId, 'Should return message ID');
        assertEqual(result.status, 'sent', 'Should have sent status');
        
        const sentEmails = emailService.getSentEmails();
        assertEqual(sentEmails.length, 1, 'Should send exactly one email');
        assertEqual(sentEmails[0].to, 'test1@example.com', 'Should send to correct email');
        assertEqual(sentEmails[0].subject, 'Welcome!', 'Should have correct subject');
    });
    
    // Test 2: Welcome email with non-existent user
    runner.test('should handle non-existent user for welcome email', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        
        await assertThrowsAsync(
            () => notificationService.sendWelcomeEmail(999),
            'User not found',
            'Should throw error for non-existent user'
        );
    });
    
    // Test 3: Newsletter to subscribers
    runner.test('should send newsletter to all subscribers', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const emailService = container.resolve('emailService');
        
        const result = await notificationService.sendNewsletterToSubscribers();
        
        assertEqual(result.sent, 2, 'Should send to 2 subscribers');
        assertEqual(result.failed, 0, 'Should have no failures');
        
        const sentEmails = emailService.getSentEmails();
        assertEqual(sentEmails.length, 2, 'Should send exactly 2 emails');
        
        const newsletterEmails = emailService.getEmailsWithSubject('Monthly Newsletter');
        assertEqual(newsletterEmails.length, 2, 'Should send 2 newsletter emails');
    });
    
    // Test 4: Email service failure
    runner.test('should handle email service failure', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const emailService = container.resolve('emailService');
        
        emailService.setFailure(true, 'Email service unavailable');
        
        await assertThrowsAsync(
            () => notificationService.sendWelcomeEmail(1),
            'Email service unavailable',
            'Should propagate email service error'
        );
    });
    
    // Test 5: Database service failure
    runner.test('should handle database service failure', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const databaseService = container.resolve('databaseService');
        
        databaseService.setFailure(true, 'Database connection lost');
        
        await assertThrowsAsync(
            () => notificationService.sendWelcomeEmail(1),
            'Database connection lost',
            'Should propagate database error'
        );
    });
    
    // Test 6: Subscription preference update
    runner.test('should update subscription preference and send confirmation', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const emailService = container.resolve('emailService');
        const databaseService = container.resolve('databaseService');
        
        const result = await notificationService.updateSubscriptionPreference(2, true);
        
        assertEqual(result.subscribed, true, 'Should update subscription status');
        
        const sentEmails = emailService.getSentEmails();
        assertEqual(sentEmails.length, 1, 'Should send confirmation email');
        assertEqual(sentEmails[0].subject, 'Subscription Confirmed', 'Should have correct subject');
        
        const updatedUser = await databaseService.findUser(2);
        assertEqual(updatedUser.subscribed, true, 'Should persist subscription change');
    });
    
    // Test 7: Logging verification
    runner.test('should log all operations correctly', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const loggingService = container.resolve('loggingService');
        
        await notificationService.sendWelcomeEmail(1);
        
        const logs = loggingService.getLogs();
        const infoLogs = loggingService.getLogsByLevel('info');
        
        // Should have initialization log + operation logs
        assertEqual(infoLogs.length >= 3, true, 'Should have multiple info logs');
        
        // Check for welcome email related logs (case insensitive)
        const welcomeEmailLogs = logs.filter(log => 
            log.message.toLowerCase().includes('welcome email') || 
            log.message.toLowerCase().includes('sending welcome')
        );
        assertEqual(welcomeEmailLogs.length >= 2, true, 'Should log welcome email operations');
    });
    
    // Test 8: Integration test with multiple operations
    runner.test('should handle complex workflow correctly', async () => {
        const container = createTestContainer();
        const notificationService = container.resolve('notificationService');
        const emailService = container.resolve('emailService');
        const loggingService = container.resolve('loggingService');
        
        // Clear any existing state
        emailService.clearSentEmails();
        loggingService.clearLogs();
        
        // Perform multiple operations
        await notificationService.sendWelcomeEmail(1);
        await notificationService.updateSubscriptionPreference(2, true);
        const newsletterResult = await notificationService.sendNewsletterToSubscribers();
        
        // Verify email counts
        const sentEmails = emailService.getSentEmails();
        assertEqual(sentEmails.length, 5, 'Should send 5 emails total'); // 1 welcome + 1 confirmation + 3 newsletters
        
        // Verify newsletter results (3 subscribers: user 1, user 2 (now subscribed), and user 3)
        assertEqual(newsletterResult.sent, 3, 'Should send newsletter to 3 subscribers');
        
        // Verify logging
        const logs = loggingService.getLogs();
        assertEqual(logs.length >= 6, true, 'Should have comprehensive logging');
    });
    
    await runner.run();
}

// Example usage
async function main() {
    try {
        console.log('=== Mocking and Testing Example ===');
        console.log('This example demonstrates how to use SDI for testable code with mocks\n');
        
        // Show production vs test container setup
        console.log('🏭 Production Container Setup:');
        const prodContainer = createContainer();
        prodContainer.value('config', {
            email: { apiKey: 'prod-key', baseUrl: 'https://api.sendgrid.com' },
            database: { connectionString: 'postgresql://prod-db' }
        });
        prodContainer.singleton('emailService', EmailService);
        prodContainer.singleton('databaseService', DatabaseService);
        prodContainer.singleton('loggingService', LoggingService);
        prodContainer.singleton('notificationService', NotificationService);
        
        console.log('🧪 Test Container Setup:');
        const testContainer = createTestContainer();
        
        console.log('Services registered in production container:', prodContainer.getServiceNames());
        console.log('Services registered in test container:', testContainer.getServiceNames());
        
        console.log('\n=== Running Test Suite ===');
        await runTests();
        
        console.log('\n=== Demonstrating Mock Capabilities ===');
        
        const mockEmailService = testContainer.resolve('emailService');
        const mockDatabaseService = testContainer.resolve('databaseService');
        
        console.log('\n📧 Mock Email Service capabilities:');
        await mockEmailService.sendEmail('test@example.com', 'Test', 'Test body');
        console.log('Sent emails:', mockEmailService.getSentEmails().length);
        console.log('Emails to test@example.com:', mockEmailService.getEmailsSentTo('test@example.com').length);
        
        console.log('\n🗄️ Mock Database Service capabilities:');
        const user = await mockDatabaseService.findUser(1);
        console.log('Found user:', user?.name);
        
        mockDatabaseService.addUser({ id: 99, name: 'Test User', email: 'test99@example.com', subscribed: true });
        const newUser = await mockDatabaseService.findUser(99);
        console.log('Added user:', newUser?.name);
        
        console.log('\n✅ Example completed successfully');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Export for use in other test files
export {
    MockEmailService,
    MockDatabaseService,
    MockLoggingService,
    createTestContainer,
    TestRunner,
    assertEqual,
    assertNotNull,
    assertThrows,
    assertThrowsAsync
};

// Run example if this file is executed directly
// Run the tests
main(); 