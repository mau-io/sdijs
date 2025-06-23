/**
 * Strategy Pattern with Tags Example
 * 
 * This example demonstrates:
 * - Using tags to implement the Strategy pattern
 * - Multiple implementations of the same interface
 * - Dynamic strategy selection based on configuration
 * - Service discovery by tags
 */

import { createContainer } from '../../index.js';

const container = createContainer();

// Configuration for different payment strategies
container.value('config', {
    payment: {
        defaultStrategy: 'stripe',
        enabledStrategies: ['stripe', 'paypal', 'bank'],
        limits: {
            stripe: 10000,
            paypal: 5000,
            bank: 50000
        }
    }
});

// Payment strategy interface (all strategies must implement these methods)
class PaymentStrategy {
    constructor(name) {
        this.name = name;
    }

    async processPayment(amount, paymentData) {
        throw new Error('processPayment must be implemented');
    }

    async validatePayment(paymentData) {
        throw new Error('validatePayment must be implemented');
    }

    async refund(transactionId, amount) {
        throw new Error('refund must be implemented');
    }

    getMaxAmount() {
        throw new Error('getMaxAmount must be implemented');
    }
}

// Stripe payment strategy
class StripePaymentStrategy extends PaymentStrategy {
    constructor({ config }) {
        super('stripe');
        this.apiKey = 'sk_test_stripe_key';
        this.maxAmount = config.payment.limits.stripe;
        console.log('🔵 Stripe payment strategy initialized');
    }

    async processPayment(amount, paymentData) {
        console.log(`💳 Processing Stripe payment: $${amount}`);
        
        // Simulate Stripe API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (amount > this.maxAmount) {
            throw new Error(`Amount exceeds Stripe limit of $${this.maxAmount}`);
        }

        const transactionId = `stripe_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            success: true,
            transactionId,
            provider: 'stripe',
            amount,
            fee: amount * 0.029 + 0.30, // Stripe fees
            timestamp: new Date().toISOString()
        };
    }

    async validatePayment(paymentData) {
        console.log('🔍 Validating Stripe payment data');
        
        const required = ['cardNumber', 'expiryMonth', 'expiryYear', 'cvv'];
        for (const field of required) {
            if (!paymentData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Simulate card validation
        if (paymentData.cardNumber.length !== 16) {
            throw new Error('Invalid card number');
        }
        
        return true;
    }

    async refund(transactionId, amount) {
        console.log(`↩️ Processing Stripe refund: ${transactionId} - $${amount}`);
        
        await new Promise(resolve => setTimeout(resolve, 80));
        
        return {
            success: true,
            refundId: `stripe_refund_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            timestamp: new Date().toISOString()
        };
    }

    getMaxAmount() {
        return this.maxAmount;
    }
}

// PayPal payment strategy
class PayPalPaymentStrategy extends PaymentStrategy {
    constructor({ config }) {
        super('paypal');
        this.clientId = 'paypal_client_id';
        this.maxAmount = config.payment.limits.paypal;
        console.log('🟡 PayPal payment strategy initialized');
    }

    async processPayment(amount, paymentData) {
        console.log(`💰 Processing PayPal payment: $${amount}`);
        
        await new Promise(resolve => setTimeout(resolve, 120));
        
        if (amount > this.maxAmount) {
            throw new Error(`Amount exceeds PayPal limit of $${this.maxAmount}`);
        }

        const transactionId = `paypal_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            success: true,
            transactionId,
            provider: 'paypal',
            amount,
            fee: amount * 0.034 + 0.49, // PayPal fees
            timestamp: new Date().toISOString()
        };
    }

    async validatePayment(paymentData) {
        console.log('🔍 Validating PayPal payment data');
        
        const required = ['email', 'password'];
        for (const field of required) {
            if (!paymentData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Simulate email validation
        if (!paymentData.email.includes('@')) {
            throw new Error('Invalid email address');
        }
        
        return true;
    }

    async refund(transactionId, amount) {
        console.log(`↩️ Processing PayPal refund: ${transactionId} - $${amount}`);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
            success: true,
            refundId: `paypal_refund_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            timestamp: new Date().toISOString()
        };
    }

    getMaxAmount() {
        return this.maxAmount;
    }
}

// Bank transfer payment strategy
class BankTransferPaymentStrategy extends PaymentStrategy {
    constructor({ config }) {
        super('bank');
        this.bankCode = 'BANK001';
        this.maxAmount = config.payment.limits.bank;
        console.log('🏦 Bank transfer payment strategy initialized');
    }

    async processPayment(amount, paymentData) {
        console.log(`🏛️ Processing bank transfer: $${amount}`);
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Bank transfers are slower
        
        if (amount > this.maxAmount) {
            throw new Error(`Amount exceeds bank transfer limit of $${this.maxAmount}`);
        }

        const transactionId = `bank_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            success: true,
            transactionId,
            provider: 'bank',
            amount,
            fee: 15.00, // Flat fee for bank transfers
            timestamp: new Date().toISOString(),
            processingTime: '1-3 business days'
        };
    }

    async validatePayment(paymentData) {
        console.log('🔍 Validating bank transfer data');
        
        const required = ['accountNumber', 'routingNumber', 'accountType'];
        for (const field of required) {
            if (!paymentData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Simulate account validation
        if (paymentData.accountNumber.length < 8) {
            throw new Error('Invalid account number');
        }
        
        return true;
    }

    async refund(transactionId, amount) {
        console.log(`↩️ Processing bank transfer refund: ${transactionId} - $${amount}`);
        
        await new Promise(resolve => setTimeout(resolve, 250));
        
        return {
            success: true,
            refundId: `bank_refund_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            timestamp: new Date().toISOString(),
            processingTime: '3-5 business days'
        };
    }

    getMaxAmount() {
        return this.maxAmount;
    }
}

// Register payment strategies with tags
container.register(StripePaymentStrategy, 'stripePayment').withTags('payment', 'strategy', 'card').asSingleton();
container.register(PayPalPaymentStrategy, 'paypalPayment').withTags('payment', 'strategy', 'wallet').asSingleton();
container.register(BankTransferPaymentStrategy, 'bankPayment').withTags('payment', 'strategy', 'bank').asSingleton();

// Payment service that uses strategies
class PaymentService {
    constructor({ config }) {
        this.config = config;
        this.strategies = new Map();
        this.defaultStrategy = config.payment.defaultStrategy;
        
        console.log('💼 Payment service initialized');
    }

    // Register a payment strategy
    registerStrategy(name, strategy) {
        this.strategies.set(name, strategy);
        console.log(`📝 Registered payment strategy: ${name}`);
    }

    // Get strategy by name
    getStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Payment strategy not found: ${strategyName}`);
        }
        return strategy;
    }

    // Get all available strategies
    getAvailableStrategies() {
        return Array.from(this.strategies.keys());
    }

    // Select best strategy based on amount and preferences
    selectBestStrategy(amount, preferences = {}) {
        const availableStrategies = this.getAvailableStrategies();
        
        // Filter by amount limits
        const suitableStrategies = availableStrategies.filter(name => {
            const strategy = this.strategies.get(name);
            return strategy.getMaxAmount() >= amount;
        });

        if (suitableStrategies.length === 0) {
            throw new Error(`No payment strategy available for amount: $${amount}`);
        }

        // Prefer user's preferred strategy if available
        if (preferences.preferred && suitableStrategies.includes(preferences.preferred)) {
            return preferences.preferred;
        }

        // Use default strategy if suitable
        if (suitableStrategies.includes(this.defaultStrategy)) {
            return this.defaultStrategy;
        }

        // Return first suitable strategy
        return suitableStrategies[0];
    }

    // Process payment using selected strategy
    async processPayment(amount, paymentData, strategyName = null) {
        try {
            // Select strategy
            const selectedStrategy = strategyName || this.selectBestStrategy(amount, paymentData.preferences);
            const strategy = this.getStrategy(selectedStrategy);
            
            console.log(`🎯 Selected payment strategy: ${selectedStrategy}`);
            
            // Validate payment data
            await strategy.validatePayment(paymentData);
            
            // Process payment
            const result = await strategy.processPayment(amount, paymentData);
            
            console.log(`✅ Payment processed successfully: ${result.transactionId}`);
            return result;
            
        } catch (error) {
            console.log(`❌ Payment failed: ${error.message}`);
            throw error;
        }
    }

    // Refund payment
    async refundPayment(transactionId, amount) {
        // Extract provider from transaction ID
        const provider = transactionId.split('_')[0];
        const strategyName = provider === 'stripe' ? 'stripe' : 
                           provider === 'paypal' ? 'paypal' : 'bank';
        
        const strategy = this.getStrategy(strategyName);
        return await strategy.refund(transactionId, amount);
    }

    // Get payment statistics
    getPaymentStats() {
        const stats = {};
        this.strategies.forEach((strategy, name) => {
            stats[name] = {
                maxAmount: strategy.getMaxAmount(),
                provider: strategy.name
            };
        });
        return stats;
    }
}

container.singleton('paymentService', PaymentService);

// Strategy manager that discovers and registers strategies using tags
class PaymentStrategyManager {
    constructor({ paymentService }) {
        this.paymentService = paymentService;
        console.log('🔧 Payment strategy manager initialized');
    }

    // Discover and register all payment strategies using tags
    discoverStrategies(container) {
        console.log('🔍 Discovering payment strategies...');
        
        // ✨ NEW: Use tag-based service discovery!
        const paymentServices = container.getServicesByTags(['payment', 'strategy'], 'AND');
        
        console.log(`Found ${paymentServices.length} payment strategies`);
        
        paymentServices.forEach(serviceInfo => {
            const strategy = container.resolve(serviceInfo.name);
            const strategyName = serviceInfo.name.replace('Payment', ''); // Remove 'Payment' suffix
            
            this.paymentService.registerStrategy(strategyName, strategy);
        });
    }

    // Get strategies by category using tags
    getStrategiesByCategory(container, category) {
        // ✨ NEW: Use tag-based filtering!
        const strategies = container.getServicesByTags([category, 'strategy'], 'AND');
        
        return strategies.map(serviceInfo => ({
            name: serviceInfo.name.replace('Payment', ''),
            service: container.resolve(serviceInfo.name)
        }));
    }

    // Get all available strategy categories
    getAvailableCategories(container) {
        const allTags = container.getAllTags();
        
        // Filter out non-category tags
        const categoryTags = allTags.filter(tag => 
            !['payment', 'strategy'].includes(tag)
        );
        
        return categoryTags;
    }

    // Get comprehensive strategy information
    getStrategyInfo(container) {
        const paymentServices = container.getServicesByTags(['payment', 'strategy'], 'AND');
        
        return paymentServices.map(serviceInfo => ({
            name: serviceInfo.name.replace('Payment', ''),
            serviceName: serviceInfo.name,
            tags: serviceInfo.tags,
            lifecycle: serviceInfo.lifecycle,
            categories: serviceInfo.tags.filter(tag => 
                !['payment', 'strategy'].includes(tag)
            )
        }));
    }
}

container.singleton('strategyManager', PaymentStrategyManager);

// Example usage
async function main() {
    try {
        console.log('=== Strategy Pattern with Tags Example ===\n');

        // Initialize services
        const paymentService = container.resolve('paymentService');
        const strategyManager = container.resolve('strategyManager');

        // Discover and register strategies
        strategyManager.discoverStrategies(container);

        console.log('\n=== Available Payment Strategies ===');
        const availableStrategies = paymentService.getAvailableStrategies();
        console.log('Strategies:', availableStrategies);

        console.log('\n=== Payment Statistics ===');
        const stats = paymentService.getPaymentStats();
        console.log(JSON.stringify(stats, null, 2));

        console.log('\n=== Processing Different Payments ===');

        // Test different payment scenarios
        const payments = [
            {
                amount: 100,
                data: {
                    cardNumber: '1234567890123456',
                    expiryMonth: '12',
                    expiryYear: '2025',
                    cvv: '123'
                },
                strategy: 'stripe'
            },
            {
                amount: 250,
                data: {
                    email: 'user@example.com',
                    password: 'password123'
                },
                strategy: 'paypal'
            },
            {
                amount: 5000,
                data: {
                    accountNumber: '123456789',
                    routingNumber: '987654321',
                    accountType: 'checking'
                },
                strategy: 'bank'
            }
        ];

        const results = [];
        
        for (const payment of payments) {
            try {
                const result = await paymentService.processPayment(
                    payment.amount,
                    payment.data,
                    payment.strategy
                );
                results.push(result);
            } catch (error) {
                console.log(`Payment failed: ${error.message}`);
            }
        }

        console.log('\n=== Payment Results ===');
        results.forEach((result, index) => {
            console.log(`Payment ${index + 1}:`, {
                transactionId: result.transactionId,
                provider: result.provider,
                amount: result.amount,
                fee: result.fee
            });
        });

        console.log('\n=== Testing Strategy Selection ===');
        
        // Test automatic strategy selection
        const autoStrategies = [
            { amount: 100, preferences: {} },
            { amount: 7000, preferences: { preferred: 'paypal' } },
            { amount: 15000, preferences: {} }
        ];

        for (const test of autoStrategies) {
            try {
                const selectedStrategy = paymentService.selectBestStrategy(test.amount, test.preferences);
                console.log(`Amount: $${test.amount}, Selected: ${selectedStrategy}`);
            } catch (error) {
                console.log(`Amount: $${test.amount}, Error: ${error.message}`);
            }
        }

        console.log('\n=== Testing Refunds ===');
        
        // Test refunds
        for (const result of results.slice(0, 2)) {
            try {
                const refund = await paymentService.refundPayment(result.transactionId, result.amount);
                console.log(`Refund processed: ${refund.refundId} for ${result.transactionId}`);
            } catch (error) {
                console.log(`Refund failed: ${error.message}`);
            }
        }

        console.log('\n=== Strategy Categories ===');
        
        // Get strategies by category
        const cardStrategies = strategyManager.getStrategiesByCategory(container, 'card');
        const walletStrategies = strategyManager.getStrategiesByCategory(container, 'wallet');
        const bankStrategies = strategyManager.getStrategiesByCategory(container, 'bank');

        console.log('Card strategies:', cardStrategies.map(s => s.name));
        console.log('Wallet strategies:', walletStrategies.map(s => s.name));
        console.log('Bank strategies:', bankStrategies.map(s => s.name));

        console.log('\n=== ✨ NEW: Tag-based Service Discovery ===');
        
        // Demonstrate new tag-based discovery features
        console.log('\n🏷️ All available tags:');
        const allTags = container.getAllTags();
        console.log(allTags);

        console.log('\n📊 Services grouped by tag:');
        const groupedByTag = container.getServicesByTag();
        Object.entries(groupedByTag).forEach(([tag, services]) => {
            console.log(`  ${tag}: [${services.join(', ')}]`);
        });

        console.log('\n🔍 Finding services with "payment" AND "strategy" tags:');
        const paymentStrategies = container.getServicesByTags(['payment', 'strategy'], 'AND');
        paymentStrategies.forEach(service => {
            console.log(`  - ${service.name}: [${service.tags.join(', ')}]`);
        });

        console.log('\n🔍 Finding services with "card" OR "wallet" tags:');
        const digitalPayments = container.getServicesByTags(['card', 'wallet'], 'OR');
        digitalPayments.forEach(service => {
            console.log(`  - ${service.name}: [${service.tags.join(', ')}]`);
        });

        console.log('\n📋 Comprehensive strategy information:');
        const strategyInfo = strategyManager.getStrategyInfo(container);
        strategyInfo.forEach(info => {
            console.log(`  ${info.name}:`);
            console.log(`    Service: ${info.serviceName}`);
            console.log(`    Lifecycle: ${info.lifecycle}`);
            console.log(`    Categories: [${info.categories.join(', ')}]`);
            console.log(`    All Tags: [${info.tags.join(', ')}]`);
        });

        console.log('\n🎯 Available strategy categories:');
        const categories = strategyManager.getAvailableCategories(container);
        console.log(categories);

        console.log('\n✅ Tag-based service discovery completed!');

        console.log('\n=== ✨ NEW: Complete Tag Discovery API ===');
        
        // Demonstrate all new tag-based discovery methods
        console.log('\n🔍 1. getServicesByTags() - Find services by tags:');
        const paymentStrategiesAND = container.getServicesByTags(['payment', 'strategy'], 'AND');
        console.log(`   AND mode: Found ${paymentStrategiesAND.length} services with BOTH 'payment' AND 'strategy' tags`);
        
        const digitalPaymentsOR = container.getServicesByTags(['card', 'wallet'], 'OR');
        console.log(`   OR mode: Found ${digitalPaymentsOR.length} services with EITHER 'card' OR 'wallet' tags`);

        console.log('\n📝 2. getServiceNamesByTags() - Get just the names:');
        const paymentNames = container.getServiceNamesByTags(['payment'], 'AND');
        console.log(`   Payment service names: [${paymentNames.join(', ')}]`);

        console.log('\n⚡ 3. resolveServicesByTags() - Resolve services directly:');
        const resolvedPayments = container.resolveServicesByTags(['payment', 'strategy'], 'AND');
        console.log(`   Resolved ${resolvedPayments.length} payment strategy instances`);
        resolvedPayments.forEach(resolved => {
            console.log(`   - ${resolved.name}: ${resolved.instance.name} (max: $${resolved.instance.getMaxAmount()})`);
        });

        console.log('\n🏷️ 4. getAllTags() - All unique tags in the container:');
        const allUniqueTags = container.getAllTags();
        console.log(`   Total unique tags: ${allUniqueTags.length}`);
        console.log(`   Tags: [${allUniqueTags.join(', ')}]`);

        console.log('\n📊 5. getServicesByTag() - Services grouped by tag:');
        const servicesByTag = container.getServicesByTag();
        Object.entries(servicesByTag).forEach(([tag, services]) => {
            console.log(`   ${tag}: [${services.join(', ')}]`);
        });

        console.log('\n🎯 6. Advanced filtering examples:');
        
        // Find all card-based payment methods
        const cardPayments = container.getServicesByTags(['card'], 'AND');
        console.log(`   Card payments: ${cardPayments.length} services`);
        
        // Find all wallet-based payment methods  
        const walletPayments = container.getServicesByTags(['wallet'], 'AND');
        console.log(`   Wallet payments: ${walletPayments.length} services`);
        
        // Find all bank-based payment methods
        const bankPayments = container.getServicesByTags(['bank'], 'AND');
        console.log(`   Bank payments: ${bankPayments.length} services`);

        console.log('\n✅ Complete tag discovery API demonstration finished!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 