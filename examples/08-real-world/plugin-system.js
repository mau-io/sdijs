/**
 * Dynamic Plugin System Example
 * 
 * This example demonstrates how to create a flexible plugin system
 * using SDI's tag discovery capabilities for dynamic plugin loading,
 * management, and execution.
 */

import SDI from '../../index.js';

// ============ PLUGIN INTERFACES ============

class BasePlugin {
    constructor(name, version = '1.0.0') {
        this.name = name;
        this.version = version;
        this.enabled = true;
        this.loadTime = Date.now();
        this.executionCount = 0;
        this.metadata = {};
    }

    async initialize(context) {
        console.log(`🔌 Initializing plugin: ${this.name} v${this.version}`);
        this.context = context;
        await this.onInitialize();
        console.log(`✅ Plugin ${this.name} ready`);
    }

    async onInitialize() {
        // Override in subclasses
    }

    async execute(action, data = {}) {
        if (!this.enabled) {
            throw new Error(`Plugin ${this.name} is disabled`);
        }

        this.executionCount++;
        console.log(`⚡ Executing ${this.name}.${action}()`);
        
        const result = await this.onExecute(action, data);
        
        return {
            plugin: this.name,
            action,
            success: true,
            result,
            executedAt: new Date().toISOString()
        };
    }

    async onExecute(action, data) {
        throw new Error(`Action ${action} not implemented in ${this.name}`);
    }

    getInfo() {
        return {
            name: this.name,
            version: this.version,
            enabled: this.enabled,
            executionCount: this.executionCount,
            uptime: Date.now() - this.loadTime,
            metadata: this.metadata
        };
    }

    enable() {
        this.enabled = true;
        console.log(`✅ Plugin ${this.name} enabled`);
    }

    disable() {
        this.enabled = false;
        console.log(`❌ Plugin ${this.name} disabled`);
    }
}

// ============ NOTIFICATION PLUGINS ============

class EmailPlugin extends BasePlugin {
    constructor() {
        super('EmailPlugin', '2.1.0');
        this.metadata = {
            category: 'notification',
            protocols: ['smtp', 'ses'],
            maxRecipients: 1000
        };
    }

    async onInitialize() {
        // Simulate email service connection
        await new Promise(resolve => setTimeout(resolve, 100));
        this.emailService = { connected: true };
    }

    async onExecute(action, data) {
        switch (action) {
            case 'send':
                return await this.sendEmail(data);
            case 'sendBulk':
                return await this.sendBulkEmail(data);
            case 'validateEmail':
                return this.validateEmail(data.email);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async sendEmail(data) {
        const { to, subject, body } = data;
        console.log(`📧 Sending email to ${to}: ${subject}`);
        
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return {
            messageId: `email_${Date.now()}`,
            to,
            subject,
            status: 'sent'
        };
    }

    async sendBulkEmail(data) {
        const { recipients, subject, body } = data;
        console.log(`📧 Sending bulk email to ${recipients.length} recipients: ${subject}`);
        
        const results = [];
        for (const recipient of recipients) {
            const result = await this.sendEmail({ to: recipient, subject, body });
            results.push(result);
        }
        
        return { sent: results.length, results };
    }

    validateEmail(email) {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return { email, valid: isValid };
    }
}

class SmsPlugin extends BasePlugin {
    constructor() {
        super('SmsPlugin', '1.5.2');
        this.metadata = {
            category: 'notification',
            providers: ['twilio', 'nexmo'],
            countries: ['US', 'CA', 'UK', 'FR']
        };
    }

    async onInitialize() {
        // Simulate SMS service connection
        await new Promise(resolve => setTimeout(resolve, 80));
        this.smsService = { connected: true };
    }

    async onExecute(action, data) {
        switch (action) {
            case 'send':
                return await this.sendSms(data);
            case 'sendBulk':
                return await this.sendBulkSms(data);
            case 'validatePhone':
                return this.validatePhone(data.phone);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async sendSms(data) {
        const { to, message } = data;
        console.log(`📱 Sending SMS to ${to}: ${message}`);
        
        // Simulate SMS sending
        await new Promise(resolve => setTimeout(resolve, 30));
        
        return {
            messageId: `sms_${Date.now()}`,
            to,
            message,
            status: 'delivered'
        };
    }

    async sendBulkSms(data) {
        const { recipients, message } = data;
        console.log(`📱 Sending bulk SMS to ${recipients.length} recipients`);
        
        const results = [];
        for (const recipient of recipients) {
            const result = await this.sendSms({ to: recipient, message });
            results.push(result);
        }
        
        return { sent: results.length, results };
    }

    validatePhone(phone) {
        const isValid = /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
        return { phone, valid: isValid };
    }
}

class PushNotificationPlugin extends BasePlugin {
    constructor() {
        super('PushNotificationPlugin', '3.0.1');
        this.metadata = {
            category: 'notification',
            platforms: ['ios', 'android', 'web'],
            maxPayload: 4096
        };
    }

    async onInitialize() {
        // Simulate push service connection
        await new Promise(resolve => setTimeout(resolve, 120));
        this.pushService = { connected: true };
    }

    async onExecute(action, data) {
        switch (action) {
            case 'send':
                return await this.sendPush(data);
            case 'sendToTopic':
                return await this.sendToTopic(data);
            case 'subscribe':
                return this.subscribeToTopic(data);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async sendPush(data) {
        const { deviceToken, title, body, payload } = data;
        console.log(`🔔 Sending push notification to ${deviceToken}: ${title}`);
        
        // Simulate push sending
        await new Promise(resolve => setTimeout(resolve, 40));
        
        return {
            messageId: `push_${Date.now()}`,
            deviceToken,
            title,
            body,
            status: 'sent'
        };
    }

    async sendToTopic(data) {
        const { topic, title, body } = data;
        console.log(`🔔 Sending push to topic ${topic}: ${title}`);
        
        // Simulate topic push
        await new Promise(resolve => setTimeout(resolve, 60));
        
        return {
            messageId: `topic_${Date.now()}`,
            topic,
            title,
            estimatedRecipients: Math.floor(Math.random() * 1000) + 100,
            status: 'sent'
        };
    }

    subscribeToTopic(data) {
        const { deviceToken, topic } = data;
        console.log(`📝 Subscribing ${deviceToken} to topic ${topic}`);
        
        return {
            deviceToken,
            topic,
            subscribed: true
        };
    }
}

// ============ ANALYTICS PLUGINS ============

class GoogleAnalyticsPlugin extends BasePlugin {
    constructor() {
        super('GoogleAnalyticsPlugin', '4.2.0');
        this.metadata = {
            category: 'analytics',
            provider: 'google',
            features: ['events', 'conversions', 'audiences']
        };
    }

    async onExecute(action, data) {
        switch (action) {
            case 'track':
                return this.trackEvent(data);
            case 'identify':
                return this.identifyUser(data);
            case 'page':
                return this.trackPageView(data);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    trackEvent(data) {
        const { event, properties } = data;
        console.log(`📊 GA: Tracking event ${event}`, properties);
        
        return {
            provider: 'google-analytics',
            event,
            properties,
            tracked: true
        };
    }

    identifyUser(data) {
        const { userId, traits } = data;
        console.log(`👤 GA: Identifying user ${userId}`, traits);
        
        return {
            provider: 'google-analytics',
            userId,
            traits,
            identified: true
        };
    }

    trackPageView(data) {
        const { page, title } = data;
        console.log(`📄 GA: Page view ${page} - ${title}`);
        
        return {
            provider: 'google-analytics',
            page,
            title,
            tracked: true
        };
    }
}

class MixpanelPlugin extends BasePlugin {
    constructor() {
        super('MixpanelPlugin', '2.8.1');
        this.metadata = {
            category: 'analytics',
            provider: 'mixpanel',
            features: ['events', 'funnels', 'retention']
        };
    }

    async onExecute(action, data) {
        switch (action) {
            case 'track':
                return this.trackEvent(data);
            case 'identify':
                return this.identifyUser(data);
            case 'alias':
                return this.aliasUser(data);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    trackEvent(data) {
        const { event, properties } = data;
        console.log(`📈 Mixpanel: Tracking event ${event}`, properties);
        
        return {
            provider: 'mixpanel',
            event,
            properties,
            tracked: true
        };
    }

    identifyUser(data) {
        const { userId, traits } = data;
        console.log(`👤 Mixpanel: Identifying user ${userId}`, traits);
        
        return {
            provider: 'mixpanel',
            userId,
            traits,
            identified: true
        };
    }

    aliasUser(data) {
        const { userId, alias } = data;
        console.log(`🔗 Mixpanel: Aliasing ${userId} to ${alias}`);
        
        return {
            provider: 'mixpanel',
            userId,
            alias,
            aliased: true
        };
    }
}

// ============ STORAGE PLUGINS ============

class S3StoragePlugin extends BasePlugin {
    constructor() {
        super('S3StoragePlugin', '1.4.3');
        this.metadata = {
            category: 'storage',
            provider: 'aws',
            features: ['upload', 'download', 'delete', 'presigned-urls']
        };
    }

    async onExecute(action, data) {
        switch (action) {
            case 'upload':
                return await this.uploadFile(data);
            case 'download':
                return await this.downloadFile(data);
            case 'delete':
                return this.deleteFile(data);
            case 'generateUrl':
                return this.generatePresignedUrl(data);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async uploadFile(data) {
        const { key, content, contentType } = data;
        console.log(`☁️ S3: Uploading file ${key} (${contentType})`);
        
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
            provider: 's3',
            key,
            contentType,
            size: content.length,
            etag: `etag_${Date.now()}`,
            uploaded: true
        };
    }

    async downloadFile(data) {
        const { key } = data;
        console.log(`☁️ S3: Downloading file ${key}`);
        
        // Simulate download
        await new Promise(resolve => setTimeout(resolve, 150));
        
        return {
            provider: 's3',
            key,
            content: `File content for ${key}`,
            contentType: 'application/octet-stream',
            downloaded: true
        };
    }

    deleteFile(data) {
        const { key } = data;
        console.log(`☁️ S3: Deleting file ${key}`);
        
        return {
            provider: 's3',
            key,
            deleted: true
        };
    }

    generatePresignedUrl(data) {
        const { key, expiration = 3600 } = data;
        console.log(`☁️ S3: Generating presigned URL for ${key} (expires in ${expiration}s)`);
        
        return {
            provider: 's3',
            key,
            url: `https://bucket.s3.amazonaws.com/${key}?signature=abc123`,
            expiration,
            generated: true
        };
    }
}

// ============ PLUGIN MANAGER ============

class PluginManager {
    constructor({ container }) {
        this.container = container;
        this.plugins = new Map();
        this.categories = new Map();
        this.hooks = new Map();
        this.context = {
            config: container.resolve('config'),
            logger: container.resolve('logger')
        };
    }

    async discoverPlugins() {
        console.log('\n🔍 === PLUGIN DISCOVERY ===');
        
        const pluginServices = this.container.getServicesByTags(['plugin'], 'AND');
        console.log(`Found ${pluginServices.length} plugins`);
        
        const pluginsByCategory = this.container.getServicesByTag();
        const categories = Object.keys(pluginsByCategory).filter(tag => 
            ['notification', 'analytics', 'storage', 'auth', 'payment'].includes(tag)
        );
        
        console.log(`Plugin categories: [${categories.join(', ')}]`);
        
        return pluginServices;
    }

    async loadPlugin(pluginName) {
        console.log(`🔌 Loading plugin: ${pluginName}`);
        
        try {
            const plugin = this.container.resolve(pluginName);
            await plugin.initialize(this.context);
            
            this.plugins.set(pluginName, plugin);
            
            // Categorize plugin
            const category = plugin.metadata.category || 'general';
            if (!this.categories.has(category)) {
                this.categories.set(category, []);
            }
            this.categories.get(category).push(pluginName);
            
            console.log(`✅ Plugin ${pluginName} loaded successfully`);
            return plugin;
            
        } catch (error) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, error.message);
            throw error;
        }
    }

    async loadAllPlugins() {
        console.log('\n📦 === LOADING ALL PLUGINS ===');
        
        const pluginServices = await this.discoverPlugins();
        const loadPromises = pluginServices.map(service => 
            this.loadPlugin(service.name).catch(error => ({
                name: service.name,
                error: error.message
            }))
        );
        
        const results = await Promise.all(loadPromises);
        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error);
        
        console.log(`✅ Successfully loaded: ${successful} plugins`);
        if (failed.length > 0) {
            console.log(`❌ Failed to load: ${failed.length} plugins`);
            failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
        }
        
        return { successful, failed: failed.length };
    }

    getPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} not found or not loaded`);
        }
        return plugin;
    }

    getPluginsByCategory(category) {
        const pluginNames = this.categories.get(category) || [];
        return pluginNames.map(name => this.plugins.get(name)).filter(Boolean);
    }

    async executePlugin(pluginName, action, data = {}) {
        const plugin = this.getPlugin(pluginName);
        return await plugin.execute(action, data);
    }

    async executePluginsByCategory(category, action, data = {}) {
        const plugins = this.getPluginsByCategory(category);
        console.log(`⚡ Executing ${action} on ${plugins.length} ${category} plugins`);
        
        const results = await Promise.all(
            plugins.map(async plugin => {
                try {
                    return await plugin.execute(action, data);
                } catch (error) {
                    return {
                        plugin: plugin.name,
                        action,
                        success: false,
                        error: error.message
                    };
                }
            })
        );
        
        return results;
    }

    enablePlugin(name) {
        const plugin = this.getPlugin(name);
        plugin.enable();
    }

    disablePlugin(name) {
        const plugin = this.getPlugin(name);
        plugin.disable();
    }

    getPluginInfo(name) {
        const plugin = this.getPlugin(name);
        return plugin.getInfo();
    }

    getAllPluginsInfo() {
        const info = {};
        this.plugins.forEach((plugin, name) => {
            info[name] = plugin.getInfo();
        });
        return info;
    }

    getSystemOverview() {
        const overview = {
            totalPlugins: this.plugins.size,
            categories: {},
            enabledPlugins: 0,
            totalExecutions: 0
        };
        
        this.categories.forEach((plugins, category) => {
            overview.categories[category] = plugins.length;
        });
        
        this.plugins.forEach(plugin => {
            if (plugin.enabled) overview.enabledPlugins++;
            overview.totalExecutions += plugin.executionCount;
        });
        
        return overview;
    }

    // Hook system for plugin events
    addHook(event, callback) {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        this.hooks.get(event).push(callback);
    }

    async executeHooks(event, data) {
        const hooks = this.hooks.get(event) || [];
        await Promise.all(hooks.map(hook => hook(data)));
    }
}

// ============ LOGGER SERVICE ============

class Logger {
    constructor({ config }) {
        this.config = config;
        this.level = config.logLevel || 'info';
    }

    info(message, data = {}) {
        console.log(`ℹ️ ${message}`, data);
    }

    error(message, error = null) {
        console.error(`❌ ${message}`, error);
    }

    debug(message, data = {}) {
        if (this.level === 'debug') {
            console.log(`🐛 ${message}`, data);
        }
    }
}

// ============ MAIN EXECUTION ============

async function demonstratePluginSystem() {
    try {
        console.log('🚀 === DYNAMIC PLUGIN SYSTEM DEMO ===');
        
        const container = new SDI({ verbose: false });

        // Register configuration and logger
        container.value('config', {
            logLevel: 'info',
            plugins: {
                autoLoad: true,
                categories: ['notification', 'analytics', 'storage']
            }
        });

        container.register(Logger, 'logger')
            .withTags('infrastructure', 'logging')
            .asSingleton();

        // Register notification plugins
        container.register(EmailPlugin, 'emailPlugin')
            .withTags('plugin', 'notification', 'email', 'communication')
            .asSingleton();

        container.register(SmsPlugin, 'smsPlugin')
            .withTags('plugin', 'notification', 'sms', 'communication')
            .asSingleton();

        container.register(PushNotificationPlugin, 'pushPlugin')
            .withTags('plugin', 'notification', 'push', 'communication')
            .asSingleton();

        // Register analytics plugins
        container.register(GoogleAnalyticsPlugin, 'googleAnalyticsPlugin')
            .withTags('plugin', 'analytics', 'google', 'tracking')
            .asSingleton();

        container.register(MixpanelPlugin, 'mixpanelPlugin')
            .withTags('plugin', 'analytics', 'mixpanel', 'tracking')
            .asSingleton();

        // Register storage plugins
        container.register(S3StoragePlugin, 's3StoragePlugin')
            .withTags('plugin', 'storage', 'aws', 's3', 'cloud')
            .asSingleton();

        // Initialize plugin manager
        const pluginManager = new PluginManager({ container });
        
        // Load all plugins
        const loadResults = await pluginManager.loadAllPlugins();
        console.log(`\n📊 Plugin loading summary: ${loadResults.successful} successful, ${loadResults.failed} failed`);

        // Demonstrate plugin execution by category
        console.log('\n📧 === NOTIFICATION PLUGINS DEMO ===');
        const notificationResults = await pluginManager.executePluginsByCategory('notification', 'send', {
            to: 'user@example.com',
            subject: 'Plugin System Test',
            message: 'Hello from the plugin system!',
            title: 'Test Notification',
            body: 'This is a test notification from our plugin system.'
        });
        
        console.log(`Notification results: ${notificationResults.filter(r => r.success).length}/${notificationResults.length} successful`);

        // Demonstrate analytics plugins
        console.log('\n📊 === ANALYTICS PLUGINS DEMO ===');
        const analyticsResults = await pluginManager.executePluginsByCategory('analytics', 'track', {
            event: 'plugin_demo_executed',
            properties: {
                category: 'demo',
                timestamp: new Date().toISOString(),
                pluginCount: pluginManager.plugins.size
            }
        });
        
        console.log(`Analytics results: ${analyticsResults.filter(r => r.success).length}/${analyticsResults.length} successful`);

        // Demonstrate storage plugin
        console.log('\n☁️ === STORAGE PLUGIN DEMO ===');
        const storageResult = await pluginManager.executePlugin('s3StoragePlugin', 'upload', {
            key: 'demo/test-file.txt',
            content: 'This is test content for our plugin demo',
            contentType: 'text/plain'
        });
        
        console.log(`Storage result: ${storageResult.success ? 'Success' : 'Failed'}`);

        // Plugin management demonstration
        console.log('\n⚙️ === PLUGIN MANAGEMENT DEMO ===');
        
        // Get plugin info
        const emailPluginInfo = pluginManager.getPluginInfo('emailPlugin');
        console.log(`Email plugin info: v${emailPluginInfo.version}, executed ${emailPluginInfo.executionCount} times`);
        
        // Disable and re-enable a plugin
        pluginManager.disablePlugin('smsPlugin');
        try {
            await pluginManager.executePlugin('smsPlugin', 'send', { to: '+1234567890', message: 'Test' });
        } catch (error) {
            console.log(`Expected error when executing disabled plugin: ${error.message}`);
        }
        
        pluginManager.enablePlugin('smsPlugin');
        const smsResult = await pluginManager.executePlugin('smsPlugin', 'send', { 
            to: '+1234567890', 
            message: 'Plugin re-enabled successfully!' 
        });
        console.log(`SMS plugin re-enabled: ${smsResult.success}`);

        // System overview
        console.log('\n📈 === SYSTEM OVERVIEW ===');
        const overview = pluginManager.getSystemOverview();
        console.log('Plugin System Statistics:');
        console.log(`  Total Plugins: ${overview.totalPlugins}`);
        console.log(`  Enabled Plugins: ${overview.enabledPlugins}`);
        console.log(`  Total Executions: ${overview.totalExecutions}`);
        console.log('  Categories:');
        Object.entries(overview.categories).forEach(([category, count]) => {
            console.log(`    ${category}: ${count} plugins`);
        });

        // Plugin discovery by tags
        console.log('\n🔍 === TAG-BASED PLUGIN DISCOVERY ===');
        const communicationPlugins = container.getServicesByTags(['communication'], 'AND');
        const trackingPlugins = container.getServicesByTags(['tracking'], 'AND');
        const cloudPlugins = container.getServicesByTags(['cloud'], 'AND');
        
        console.log(`Communication plugins: ${communicationPlugins.length}`);
        console.log(`Tracking plugins: ${trackingPlugins.length}`);
        console.log(`Cloud plugins: ${cloudPlugins.length}`);

        // Advanced plugin filtering
        const allPluginTags = container.getAllTags().filter(tag => 
            container.getServicesByTags([tag, 'plugin'], 'AND').length > 0
        );
        console.log(`Plugin-related tags: [${allPluginTags.join(', ')}]`);

        console.log('\n✅ Dynamic plugin system demonstration completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Execute the demo
demonstratePluginSystem(); 