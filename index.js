/**
 * SDI v2.0 - Modern Dependency Injection for Node.js
 * 
 * Features:
 * - Maintains destructuring {a,b,c} syntax for constructor parameters
 * - Fluent API for service registration and configuration
 * - Tag-based service discovery for architectural patterns
 * - Scoped dependency management for web applications
 * - Factory functions with full dependency injection
 * - Lifecycle hooks for monitoring and debugging
 * - Security hardening against prototype pollution
 * - Memory limits to prevent resource exhaustion
 * - TypeScript definitions included
 * 
 * @example
 * ```javascript
 * import { createContainer } from './index.js';
 * 
 * const container = createContainer();
 * 
 * // Register services with tags
 * container.register(DatabaseService)
 *   .withTag('repository')
 *   .withTag('persistence')
 *   .asSingleton();
 * 
 * // Use destructuring in constructors
 * class UserService {
 *   constructor({databaseService, logger}) {
 *     this.db = databaseService;
 *     this.logger = logger;
 *   }
 * }
 * 
 * // Discover services by tags
 * const repos = container.getServicesByTags(['repository']);
 * ```
 */

/**
 * Service lifecycle constants
 * @readonly
 * @enum {string}
 */
export const LIFECYCLE = {
  /** Single shared instance across the entire application */
  SINGLETON: 'singleton',
  /** New instance created every time the service is resolved */
  TRANSIENT: 'transient', 
  /** One instance per scope (useful for request-scoped services) */
  SCOPED: 'scoped',
  /** Direct value registration without instantiation */
  VALUE: 'value'
};

const ERRORS = {
  MODULE_NOT_FOUND: (name) => `Service '${name}' not found. Did you forget to register it?`,
  CIRCULAR_DEPENDENCY: (cycle) => `Circular dependency detected: ${cycle.join(' → ')}`,
  INVALID_LIFECYCLE: (lifecycle) => `Invalid lifecycle '${lifecycle}'. Use: ${Object.values(LIFECYCLE).join(', ')}`,
  SCOPE_NOT_FOUND: (scope) => `Scope '${scope}' not found. Create it first with createScope()`,
  ALREADY_REGISTERED: (name) => `Service '${name}' is already registered. Use override() to replace it.`,
  DANGEROUS_KEY: (key) => `Dangerous property access blocked: '${key}'`,
  MEMORY_LIMIT: (type, limit) => `Memory limit exceeded for ${type}. Max: ${limit}`,
  HOOK_LIMIT: (limit) => `Hook limit exceeded. Max: ${limit} hooks per event`
};

// Security: Dangerous keys that could lead to prototype pollution
const DANGEROUS_KEYS = new Set([
  '__proto__', 
  'constructor', 
  'prototype',
  'valueOf',
  'toString',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable'
]);

/**
 * Main SDI Container Class
 * 
 * Provides dependency injection with support for:
 * - Destructuring syntax {a,b,c} in constructors
 * - Multiple lifecycle patterns (singleton, transient, scoped, value)
 * - Tag-based service discovery
 * - Scoped dependency management
 * - Factory functions and conditional registration
 * - Lifecycle hooks for debugging and monitoring
 * 
 * @class SDI
 */
class SDI {
  /**
   * Create a new SDI container
   * 
   * @param {Object} [options={}] - Container configuration options
   * @param {boolean} [options.verbose=false] - Enable detailed logging
   * @param {boolean} [options.autoBinding=true] - Auto-bind class methods
   * @param {boolean} [options.strictMode=false] - Prevent duplicate registrations
   * @param {boolean} [options.allowOverrides=false] - Allow service overrides
   * @param {number} [options.maxServices=1000] - Maximum services limit
   * @param {number} [options.maxInstances=5000] - Maximum instances limit
   * @param {number} [options.maxScopes=100] - Maximum scopes limit
   * @param {number} [options.maxHooksPerEvent=50] - Maximum hooks per event
   * 
   * @example
   * ```javascript
   * const container = new SDI({
   *   verbose: true,
   *   strictMode: true,
   *   maxServices: 500
   * });
   * ```
   */
  constructor(options = {}) {
    this.options = {
      verbose: false,
      autoBinding: true,
      strictMode: false,
      allowOverrides: false,
      maxServices: 1000,        // Memory limit
      maxInstances: 5000,       // Memory limit
      maxScopes: 100,           // Memory limit
      maxHooksPerEvent: 50,     // Hook limit
      ...options
    };
    
    this._services = new Map();
    this._instances = new Map();
    this._scopes = new Map();
    this._currentResolutionStack = null; // Current resolution context
    this._hooks = {
      beforeCreate: [],
      afterCreate: [],
      beforeResolve: [],
      afterResolve: []
    };
  }

  // ============ FLUENT REGISTRATION API ============
  
  /**
   * Register a service with fluent API
   * @param {Function|Object|*} implementation - The service implementation
   * @param {string} [name] - Optional name, auto-inferred from class/function name
   * @returns {ServiceBuilder} Fluent builder for configuration
   */
  register(implementation, name) {
    this._checkMemoryLimits('services');
    return new ServiceBuilder(this, implementation, name);
  }

  /**
   * Register multiple services at once
   * @param {Object} services - Object with name: implementation pairs
   * @returns {SDI} For chaining
   */
  registerAll(services) {
    if (!services || typeof services !== 'object') {
      throw new Error('registerAll requires an object with service definitions');
    }
    
    Object.entries(services).forEach(([name, impl]) => {
      this.register(impl, name).asSingleton();
    });
    return this;
  }

  /**
   * Register a value directly
   * @param {string} name - Service name
   * @param {*} value - Any value to register
   * @returns {SDI} For chaining
   */
  value(name, value) {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    this.register(value, name).asValue();
    return this;
  }

  /**
   * Register a factory function
   * @param {string} name - Service name  
   * @param {Function} factory - Factory function that receives dependencies
   * @returns {ServiceBuilder} For further configuration
   */
  factory(name, factory) {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    if (typeof factory !== 'function') {
      throw new Error('Factory must be a function');
    }
    return this.register(factory, name).asFactory();
  }

  /**
   * Register a singleton service
   * @param {string|Function|Object} nameOrImplementation - Service name or implementation
   * @param {Function|Object} [implementation] - Service implementation (if first param is name)
   * @returns {SDI} For chaining
   */
  singleton(nameOrImplementation, implementation) {
    if (typeof nameOrImplementation === 'string') {
      // New API: singleton('name', implementation)
      this.register(implementation, nameOrImplementation).asSingleton();
    } else {
      // Old API: singleton(implementation) - infer name from class
      this.register(nameOrImplementation).asSingleton();
    }
    return this;
  }

  /**
   * Register a transient service
   * @param {string|Function|Object} nameOrImplementation - Service name or implementation
   * @param {Function|Object} [implementation] - Service implementation (if first param is name)
   * @returns {SDI} For chaining
   */
  transient(nameOrImplementation, implementation) {
    if (typeof nameOrImplementation === 'string') {
      // New API: transient('name', implementation)
      this.register(implementation, nameOrImplementation).asTransient();
    } else {
      // Old API: transient(implementation) - infer name from class
      this.register(nameOrImplementation).asTransient();
    }
    return this;
  }

  /**
   * Register services in batch with decorator configuration
   * @param {Array} serviceConfigs - Array of service configuration objects
   * @returns {SDI} For chaining
   * 
   * @example
   * container.batchRegister([
   *   { class: ViewUseCase, name: 'viewUseCase', decorators: ['cacheDecorator', 'timingDecorator'] },
   *   { class: UserService, name: 'userService', lifecycle: 'transient' }
   * ]);
   */
  batchRegister(serviceConfigs) {
    if (!Array.isArray(serviceConfigs)) {
      throw new Error('batchRegister requires an array of service configurations');
    }

    serviceConfigs.forEach(config => {
      if (!config || typeof config !== 'object') {
        throw new Error('Each service configuration must be an object');
      }

      if (!config.class) {
        throw new Error('Service configuration must have a "class" property');
      }

      const name = config.name || this._formatName(config.class.name);
      const lifecycle = config.lifecycle || 'singleton';
      
      let builder = this.register(config.class, name);

      // Apply decorators if specified
      if (config.decorators && config.decorators.length > 0) {
        builder = builder.decorateWith(config.decorators);
      }

      // Apply custom decorators if specified
      if (config.customDecorators && config.customDecorators.length > 0) {
        config.customDecorators.forEach(decoratorFn => {
          builder = builder.decorate(decoratorFn);
        });
      }

      // Apply tags if specified
      if (config.tags && config.tags.length > 0) {
        builder = builder.withTags(...config.tags);
      }

      // Apply lifecycle
      switch (lifecycle.toLowerCase()) {
        case 'singleton':
          builder.asSingleton();
          break;
        case 'transient':
          builder.asTransient();
          break;
        case 'scoped':
          builder.asScoped();
          break;
        case 'value':
          builder.asValue();
          break;
        case 'factory':
          builder.asFactory().asSingleton();
          break;
        default:
          throw new Error(`Unknown lifecycle: ${lifecycle}`);
      }
    });

    return this;
  }

  // ============ SCOPE MANAGEMENT ============
  
  /**
   * Create a new scope
   * @param {string} name - Scope name
   * @returns {Scope} New scope instance
   */
  createScope(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Scope name must be a non-empty string');
    }
    
    this._checkMemoryLimits('scopes');
    
    if (this._scopes.has(name)) {
      throw new Error(`Scope '${name}' already exists. Use a different name or dispose the existing scope.`);
    }
    
    const scope = new Scope(this, name);
    this._scopes.set(name, scope);
    return scope;
  }

  /**
   * Get an existing scope
   * @param {string} name - Scope name
   * @returns {Scope} Existing scope
   */
  scope(name) {
    const scope = this._scopes.get(name);
    if (!scope) throw new Error(ERRORS.SCOPE_NOT_FOUND(name));
    return scope;
  }

  // ============ RESOLUTION ============

  /**
   * Resolve a service by name
   * @param {string} name - Service name
   * @param {string} [scopeName] - Optional scope name
   * @returns {*} Resolved service instance
   */
  resolve(name, scopeName = null) {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    
    this._callHooks('beforeResolve', { name, scopeName });
    
    const scope = scopeName ? this.scope(scopeName) : null;
    const result = this._resolve(name, scope);
    
    this._callHooks('afterResolve', { name, scopeName, result });
    return result;
  }

  /**
   * Resolve multiple services at once
   * @param {string[]} names - Array of service names
   * @param {string} [scopeName] - Optional scope name
   * @returns {Object} Object with resolved services
   */
  resolveAll(names, scopeName = null) {
    if (!Array.isArray(names)) {
      throw new Error('resolveAll requires an array of service names');
    }
    
    const resolved = {};
    names.forEach(name => {
      resolved[name] = this.resolve(name, scopeName);
    });
    return resolved;
  }

  /**
   * Get a resolver function that can be called later
   * @param {string} name - Service name
   * @returns {Function} Resolver function
   */
  getResolver(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    return (scopeName = null) => this.resolve(name, scopeName);
  }

  // ============ ADVANCED FEATURES ============

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean} True if registered
   */
  has(name) {
    return this._services.has(name);
  }

  /**
   * Remove a service registration
   * @param {string} name - Service name
   * @returns {SDI} For chaining
   */
  unregister(name) {
    this._services.delete(name);
    this._instances.delete(name);
    // Clear from all scopes
    this._scopes.forEach(scope => {
      scope._instances.delete(name);
    });
    return this;
  }

  /**
   * Clear all registrations
   * @returns {SDI} For chaining
   */
  clear() {
    this._services.clear();
    this._instances.clear();
    this._scopes.clear();
    this._currentResolutionStack = null;
    return this;
  }

  /**
   * Get all registered service names
   * @returns {string[]} Array of service names
   */
  getServiceNames() {
    return Array.from(this._services.keys());
  }

  /**
   * Get services by tags
   * @param {string[]} tags - Array of tags to search for
   * @param {string} [mode='AND'] - Search mode: 'AND' (all tags) or 'OR' (any tag)
   * @returns {Object[]} Array of objects with {name, service, tags}
   */
  getServicesByTags(tags, mode = 'AND') {
    if (!Array.isArray(tags)) {
      throw new Error('Tags must be an array');
    }
    if (tags.length === 0) {
      throw new Error('At least one tag must be provided');
    }
    if (mode !== 'AND' && mode !== 'OR') {
      throw new Error("Mode must be 'AND' or 'OR'");
    }

    const results = [];
    
    this._services.forEach((serviceRegistration, serviceName) => {
      const serviceTags = serviceRegistration.tags;
      let matches = false;

      if (mode === 'AND') {
        // Service must have ALL specified tags
        matches = tags.every(tag => serviceTags.has(tag));
      } else { // mode === 'OR'
        // Service must have ANY of the specified tags
        matches = tags.some(tag => serviceTags.has(tag));
      }

      if (matches) {
        results.push({
          name: serviceName,
          service: serviceRegistration,
          tags: Array.from(serviceTags),
          lifecycle: serviceRegistration.lifecycle,
          factory: serviceRegistration.factory
        });
      }
    });

    return results;
  }

  /**
   * Get service names by tags (simplified version)
   * @param {string[]} tags - Array of tags to search for
   * @param {string} [mode='AND'] - Search mode: 'AND' (all tags) or 'OR' (any tag)
   * @returns {string[]} Array of service names
   */
  getServiceNamesByTags(tags, mode = 'AND') {
    return this.getServicesByTags(tags, mode).map(result => result.name);
  }

  /**
   * Resolve services by tags
   * @param {string[]} tags - Array of tags to search for
   * @param {string} [mode='AND'] - Search mode: 'AND' (all tags) or 'OR' (any tag) 
   * @param {string} [scopeName] - Optional scope name
   * @returns {Object[]} Array of objects with {name, instance, tags}
   */
  resolveServicesByTags(tags, mode = 'AND', scopeName = null) {
    const serviceInfos = this.getServicesByTags(tags, mode);
    
    return serviceInfos.map(serviceInfo => ({
      name: serviceInfo.name,
      instance: this.resolve(serviceInfo.name, scopeName),
      tags: serviceInfo.tags,
      lifecycle: serviceInfo.lifecycle
    }));
  }

  /**
   * Get all unique tags from registered services
   * @returns {string[]} Array of all unique tags
   */
  getAllTags() {
    const allTags = new Set();
    
    this._services.forEach(serviceRegistration => {
      serviceRegistration.tags.forEach(tag => {
        allTags.add(tag);
      });
    });
    
    return Array.from(allTags).sort();
  }

  /**
   * Get services grouped by tag
   * @returns {Object} Object where keys are tags and values are arrays of service names
   */
  getServicesByTag() {
    const tagGroups = {};
    
    this._services.forEach((serviceRegistration, serviceName) => {
      serviceRegistration.tags.forEach(tag => {
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        tagGroups[tag].push(serviceName);
      });
    });
    
    return tagGroups;
  }

  /**
   * Add lifecycle hooks
   * @param {string} event - Hook event name
   * @param {Function} callback - Hook callback
   * @returns {SDI} For chaining
   */
  hook(event, callback) {
    if (!event || typeof event !== 'string') {
      throw new Error('Hook event must be a non-empty string');
    }
    if (typeof callback !== 'function') {
      throw new Error('Hook callback must be a function');
    }
    
    if (this._hooks[event]) {
      if (this._hooks[event].length >= this.options.maxHooksPerEvent) {
        throw new Error(ERRORS.HOOK_LIMIT(this.options.maxHooksPerEvent));
      }
      this._hooks[event].push(callback);
    }
    return this;
  }

  /**
   * Remove all hooks for an event
   * @param {string} event - Hook event name
   * @returns {SDI} For chaining
   */
  clearHooks(event) {
    if (this._hooks[event]) {
      this._hooks[event] = [];
    }
    return this;
  }

  // ============ INTERNAL METHODS ============

  _resolve(name, scope = null) {
    // Use a simpler approach for circular dependency detection
    // Create a resolution context if it doesn't exist
    if (!this._currentResolutionStack) {
      this._currentResolutionStack = new Set();
    }
    
    // Check for circular dependencies
    if (this._currentResolutionStack.has(name)) {
      const cycle = Array.from(this._currentResolutionStack).concat(name);
      throw new Error(ERRORS.CIRCULAR_DEPENDENCY(cycle));
    }

    const service = this._services.get(name);
    if (!service) {
      throw new Error(ERRORS.MODULE_NOT_FOUND(name));
    }

    // Check scope cache first
    if (scope && scope._instances.has(name)) {
      return scope._instances.get(name);
    }

    // Check singleton cache
    if (service.lifecycle === LIFECYCLE.SINGLETON && this._instances.has(name)) {
      return this._instances.get(name);
    }

    this._currentResolutionStack.add(name);
    
    try {
      const instance = this._createInstance(service, scope);
      
      // Cache based on lifecycle
      if (service.lifecycle === LIFECYCLE.SINGLETON) {
        this._checkMemoryLimits('instances');
        this._instances.set(name, instance);
      } else if (service.lifecycle === LIFECYCLE.SCOPED && scope) {
        scope._instances.set(name, instance);
      }
      
      return instance;
    } finally {
      this._currentResolutionStack.delete(name);
      // Clean up the resolution stack when we're done with the top-level resolution
      if (this._currentResolutionStack.size === 0) {
        this._currentResolutionStack = null;
      }
    }
  }

  _createInstance(service, scope) {
    this._callHooks('beforeCreate', { service, scope });

    let instance;

    if (service.lifecycle === LIFECYCLE.VALUE) {
      instance = service.implementation;
    } else if (service.factory) {
      // Factory function
      instance = service.implementation.call(null, this._createDependencyProxy(scope));
    } else if (this._isClass(service.implementation)) {
      // Class constructor - MAINTAINS {a,b,c} DESTRUCTURING
      const deps = this._createDependencyProxy(scope);
      instance = new service.implementation(deps);
      
      // Auto-binding if enabled
      if (this.options.autoBinding) {
        instance = this._createAutoBindProxy(instance);
      }
    } else if (typeof service.implementation === 'function') {
      // Function - return result and clone if transient
      const result = service.implementation.call(null, this._createDependencyProxy(scope));
      instance = service.lifecycle === LIFECYCLE.TRANSIENT 
        ? this._safeClone(result)
        : result;
    } else {
      // Object - clone for transient
      instance = service.lifecycle === LIFECYCLE.TRANSIENT 
        ? this._safeClone(service.implementation)
        : service.implementation;
    }

    // Apply decorators if any are defined
    instance = this._applyDecorators(instance, service, scope);

    this._callHooks('afterCreate', { service, scope, instance });
    return instance;
  }

  /**
   * Apply decorators to a service instance
   * @param {*} instance - The service instance to decorate
   * @param {Object} service - The service configuration
   * @param {Object} scope - The current scope
   * @returns {*} The decorated instance
   */
  _applyDecorators(instance, service, scope) {
    let decoratedInstance = instance;

    // Apply decorator services (resolved from container)
    if (service.decorators && service.decorators.length > 0) {
      for (const decoratorName of service.decorators) {
        try {
          const decoratorService = this._resolve(decoratorName, scope);
          
          // Validate decorator service
          this._validateDecoratorService(decoratorService, decoratorName, service.name);
          
          // Apply decoration
          const previousInstance = decoratedInstance;
          decoratedInstance = decoratorService.decorate(decoratedInstance);
          
          // Validate decoration result
          this._validateDecorationResult(decoratedInstance, previousInstance, decoratorName, service.name);
          
          if (this.options.verbose) {
            console.log(`[SDIJS:DECORATOR] Applied decorator '${decoratorName}' to service '${service.name}'`);
          }
        } catch (error) {
          throw new Error(`Failed to apply decorator '${decoratorName}' to service '${service.name}': ${error.message}`);
        }
      }
    }

    // Apply custom decorator functions
    if (service.customDecorators && service.customDecorators.length > 0) {
      for (let i = 0; i < service.customDecorators.length; i++) {
        const decoratorFn = service.customDecorators[i];
        try {
          // Validate custom decorator function
          this._validateCustomDecorator(decoratorFn, i, service.name);
          
          const previousInstance = decoratedInstance;
          decoratedInstance = decoratorFn(decoratedInstance);
          
          // Validate decoration result
          this._validateDecorationResult(decoratedInstance, previousInstance, `custom#${i}`, service.name);
          
          if (this.options.verbose) {
            console.log(`[SDIJS:DECORATOR] Applied custom decorator to service '${service.name}'`);
          }
        } catch (error) {
          throw new Error(`Failed to apply custom decorator #${i} to service '${service.name}': ${error.message}`);
        }
      }
    }

    return decoratedInstance;
  }

  /**
   * Validate that a decorator service follows the correct pattern
   * @param {*} decoratorService - The decorator service to validate
   * @param {string} decoratorName - Name of the decorator for error messages
   * @param {string} serviceName - Name of the target service for error messages
   */
  _validateDecoratorService(decoratorService, decoratorName, serviceName) {
    if (!decoratorService) {
      throw new Error(`Decorator service '${decoratorName}' is null or undefined`);
    }

    // Check if it has a decorate method
    if (typeof decoratorService.decorate !== 'function') {
      if (typeof decoratorService === 'function') {
        throw new Error(
          `Decorator service '${decoratorName}' is a function but should be an object with a 'decorate' method. ` +
          `Did you mean to use .decorate(${decoratorName}) instead of .decorateWith(['${decoratorName}'])?`
        );
      }
      throw new Error(
        `Decorator service '${decoratorName}' must have a 'decorate' method. ` +
        `Expected: { decorate(instance) { return decoratedInstance; } }`
      );
    }

    // Check method signature
    if (decoratorService.decorate.length === 0) {
      console.warn(
        `⚠️  Decorator '${decoratorName}' decorate() method takes no parameters. ` +
        `Expected: decorate(serviceInstance) { ... }`
      );
    }
  }

  /**
   * Validate that a custom decorator function follows the correct pattern
   * @param {Function} decoratorFn - The decorator function to validate
   * @param {number} index - Index of the decorator for error messages
   * @param {string} serviceName - Name of the target service for error messages
   */
  _validateCustomDecorator(decoratorFn, index, serviceName) {
    if (typeof decoratorFn !== 'function') {
      throw new Error(
        `Custom decorator #${index} must be a function. ` +
        `Expected: (serviceInstance) => decoratedInstance`
      );
    }

    if (decoratorFn.length === 0) {
      console.warn(
        `⚠️  Custom decorator #${index} for service '${serviceName}' takes no parameters. ` +
        `Expected: (serviceInstance) => decoratedInstance`
      );
    }
  }

  /**
   * Validate the result of applying a decorator
   * @param {*} decoratedInstance - The result after decoration
   * @param {*} originalInstance - The instance before decoration
   * @param {string} decoratorName - Name of the decorator for error messages
   * @param {string} serviceName - Name of the target service for error messages
   */
  _validateDecorationResult(decoratedInstance, originalInstance, decoratorName, serviceName) {
    // Check that decorator returned something
    if (decoratedInstance === undefined || decoratedInstance === null) {
      throw new Error(
        `Decorator '${decoratorName}' returned ${decoratedInstance}. ` +
        `Decorators must return the decorated service instance.`
      );
    }

    // Check that it's still an object (unless original was primitive)
    if (typeof originalInstance === 'object' && typeof decoratedInstance !== 'object') {
      throw new Error(
        `Decorator '${decoratorName}' changed service type from object to ${typeof decoratedInstance}. ` +
        `Decorators should preserve the service interface.`
      );
    }

    // Universal method validation - validate ALL public methods
    if (originalInstance && typeof originalInstance === 'object') {
      const publicMethods = this._getPublicMethods(originalInstance);
      const removedMethods = [];
      const changedSignatures = [];
      
      for (const methodName of publicMethods) {
        // Check if method was removed
        if (typeof decoratedInstance[methodName] !== 'function') {
          removedMethods.push(methodName);
        } else {
          // Check if signature changed significantly
          const originalParams = originalInstance[methodName].length;
          const decoratedParams = decoratedInstance[methodName].length;
          
          // Only warn if there's a real signature change (but smart about rest parameters)
          if (originalParams !== decoratedParams) {
            // Check if the decorated method uses rest parameters
            const decoratedMethodStr = decoratedInstance[methodName].toString();
            const usesRestParams = /\(\s*\.\.\./.test(decoratedMethodStr);
            
            // Only warn if it's NOT using rest parameters (which would make 0 params acceptable)
            if (!usesRestParams || decoratedParams > 0) {
              changedSignatures.push({
                method: methodName,
                original: originalParams,
                decorated: decoratedParams
              });
            }
          }
        }
      }

      // Throw error if any public methods were removed
      if (removedMethods.length > 0) {
        throw new Error(
          `Decorator '${decoratorName}' removed public method(s) from service '${serviceName}': ${removedMethods.join(', ')}. ` +
          `Decorators must preserve the original service interface.`
        );
      }

      // Warn about signature changes
      for (const change of changedSignatures) {
        console.warn(
          `⚠️  Decorator '${decoratorName}' changed '${change.method}' method signature for service '${serviceName}'. ` +
          `Original: ${change.original} params, Decorated: ${change.decorated} params`
        );
      }

      // Warn if important properties were lost
      const originalKeys = Object.keys(originalInstance);
      const decoratedKeys = Object.keys(decoratedInstance);
      const lostKeys = originalKeys.filter(key => !(key in decoratedInstance));
      
      if (lostKeys.length > 0) {
        console.warn(
          `⚠️  Decorator '${decoratorName}' removed properties from service '${serviceName}': ${lostKeys.join(', ')}. ` +
          `Consider using { ...originalInstance, ...decoratedProperties } to preserve all properties.`
        );
      }

      // Success validation in verbose mode
      if (this.options.verbose && publicMethods.length > 0) {
        console.log(`[SDIJS:VALIDATION] Decorator '${decoratorName}' successfully preserved service interface for '${serviceName}' (${publicMethods.length} methods: ${publicMethods.join(', ')})`);
      }
    }
  }

  /**
   * Get all public methods from a service instance
   * Public methods: functions that don't start with _ or $ and aren't constructor
   * @param {Object} serviceInstance - The service instance to analyze
   * @returns {string[]} Array of public method names
   */
  _getPublicMethods(serviceInstance) {
    const methods = [];
    const allMethodNames = this._getAllMethodNames(serviceInstance);
    
    for (const methodName of allMethodNames) {
      if (typeof serviceInstance[methodName] === 'function' && 
          !methodName.startsWith('_') && 
          !methodName.startsWith('$') &&
          methodName !== 'constructor') {
        methods.push(methodName);
      }
    }
    
    return methods;
  }

  /**
   * Get all method names including inherited ones from the prototype chain
   * @param {Object} obj - The object to analyze
   * @returns {string[]} Array of all method names
   */
  _getAllMethodNames(obj) {
    const methods = new Set();
    
    // Walk up the prototype chain
    let current = obj;
    while (current && current !== Object.prototype) {
      // Get own property names (non-inherited)
      Object.getOwnPropertyNames(current).forEach(name => {
        if (typeof obj[name] === 'function') {
          methods.add(name);
        }
      });
      
      // Move up the prototype chain
      current = Object.getPrototypeOf(current);
    }
    
    return Array.from(methods);
  }

  _createDependencyProxy(scope) {
    return new Proxy({}, {
      get: (target, key) => {
        const keyStr = String(key);
        
        // Security: Block dangerous property access
        if (DANGEROUS_KEYS.has(keyStr)) {
          throw new Error(ERRORS.DANGEROUS_KEY(keyStr));
        }
        
        // Block Symbol properties except for well-known ones
        if (typeof key === 'symbol' && key !== Symbol.toPrimitive && key !== Symbol.iterator) {
          return undefined;
        }
        
        if (this.options.verbose) {
          console.log(`[SDIJS:RESOLVE] Resolving dependency: ${keyStr}`);
        }
        
        return this._resolve(keyStr, scope);
      },
      set: () => {
        throw new Error("Dependencies are read-only");
      },
      has: (target, key) => {
        const keyStr = String(key);
        return this._services.has(keyStr) && !DANGEROUS_KEYS.has(keyStr);
      },
      ownKeys: () => {
        return this.getServiceNames();
      },
      getOwnPropertyDescriptor: (target, key) => {
        const keyStr = String(key);
        if (this._services.has(keyStr) && !DANGEROUS_KEYS.has(keyStr)) {
          return { enumerable: true, configurable: true };
        }
        return undefined;
      }
    });
  }

  _createAutoBindProxy(instance) {
    const cache = new WeakMap();
    return new Proxy(instance, {
      get(target, propertyKey) {
        const value = Reflect.get(target, propertyKey);
        if (typeof value !== 'function') return value;
        
        if (!cache.has(value)) {
          cache.set(value, value.bind(target));
        }
        return cache.get(value);
      }
    });
  }

  _isClass(definition) {
    if (typeof definition !== 'function') return false;
  
    // Use string representation to avoid executing arbitrary code
    const str = definition.toString();
  
    // Check for native class syntax
    if (/^class\s/.test(str)) return true;
  
    // Heuristic for functions intended as classes (e.g., transpiled classes)
    // Check for function keyword, capitalized name, and a valid prototype
    return /^\s*function\s+[A-Z]/.test(str) &&
           definition.prototype &&
           definition.prototype.constructor === definition;
  }

  _formatName(name) {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  _callHooks(event, data) {
    this._hooks[event]?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.warn(`Hook ${event} failed:`, error);
      }
    });
  }

  _checkMemoryLimits(type) {
    const limits = {
      services: { map: this._services, max: this.options.maxServices },
      instances: { map: this._instances, max: this.options.maxInstances },
      scopes: { map: this._scopes, max: this.options.maxScopes }
    };
    
    const limit = limits[type];
    if (limit && limit.map.size >= limit.max) {
      throw new Error(ERRORS.MEMORY_LIMIT(type, limit.max));
    }
  }

  _safeClone(obj) {
    try {
      return structuredClone(obj);
    } catch (error) {
      // Fallback for objects that can't be structured cloned
      if (typeof obj === 'object' && obj !== null) {
        return JSON.parse(JSON.stringify(obj));
      }
      return obj;
    }
  }
}

// ============ SERVICE BUILDER (FLUENT API) ============

class ServiceBuilder {
  constructor(container, implementation, name) {
    this.container = container;
    this.implementation = implementation;
    this.name = name || this._inferName(implementation);
    this.lifecycle = LIFECYCLE.SINGLETON; // Default
    this.factory = false;
    this.conditions = [];
    this.tags = new Set();
    this.decorators = []; // Array of decorator service names
    this.customDecorators = []; // Array of custom decorator functions
  }

  /**
   * Set as singleton lifecycle
   * @returns {SDI} Container for method chaining
   */
  asSingleton() {
    this.lifecycle = LIFECYCLE.SINGLETON;
    return this._register();
  }

  /**
   * Set as transient lifecycle
   * @returns {SDI} Container for method chaining
   */
  asTransient() {
    this.lifecycle = LIFECYCLE.TRANSIENT;
    return this._register();
  }

  /**
   * Set as scoped lifecycle
   * @returns {SDI} Container for method chaining
   */
  asScoped() {
    this.lifecycle = LIFECYCLE.SCOPED;
    return this._register();
  }

  /**
   * Set as value (no instantiation)
   * @returns {SDI} Container for method chaining
   */
  asValue() {
    this.lifecycle = LIFECYCLE.VALUE;
    return this._register();
  }

  /**
   * Mark as factory function
   * @returns {ServiceBuilder} For chaining
   */
  asFactory() {
    this.factory = true;
    return this;
  }

  /**
   * Add a tag to this service
   * @param {string} tag - Tag name
   * @returns {ServiceBuilder} For chaining
   */
  withTag(tag) {
    if (!tag || typeof tag !== 'string') {
      throw new Error('Tag must be a non-empty string');
    }
    this.tags.add(tag);
    return this;
  }

  /**
   * Add multiple tags
   * @param {string[]} tags - Array of tags
   * @returns {ServiceBuilder} For chaining
   */
  withTags(...tags) {
    tags.forEach(tag => this.withTag(tag));
    return this;
  }

  /**
   * Add a condition for registration
   * @param {Function} condition - Condition function
   * @returns {ServiceBuilder} For chaining
   */
  when(condition) {
    if (typeof condition !== 'function') {
      throw new Error('Condition must be a function');
    }
    this.conditions.push(condition);
    return this;
  }

  /**
   * Override existing registration
   * @returns {ServiceBuilder} For chaining
   */
  override() {
    this._allowOverride = true;
    return this;
  }

  /**
   * Finish configuration and return to container
   * @returns {SDI} Container for method chaining
   */
  build() {
    return this.container;
  }

  /**
   * Add decorators to this service
   * @param {string|string[]|Function} decorators - Decorator service names or function
   * @returns {ServiceBuilder} For chaining
   */
  decorateWith(decorators) {
    if (Array.isArray(decorators)) {
      decorators.forEach(decorator => {
        if (typeof decorator === 'string') {
          this.decorators.push(decorator);
        } else if (typeof decorator === 'function') {
          this.customDecorators.push(decorator);
        } else {
          throw new Error('Decorators must be service names (strings) or functions');
        }
      });
    } else if (typeof decorators === 'string') {
      this.decorators.push(decorators);
    } else if (typeof decorators === 'function') {
      this.customDecorators.push(decorators);
    } else {
      throw new Error('Decorators must be service names (strings) or functions');
    }
    return this;
  }

  /**
   * Add a custom decorator function (escape hatch)
   * @param {Function} decoratorFn - Function that takes a service and returns decorated service
   * @returns {ServiceBuilder} For chaining
   */
  decorate(decoratorFn) {
    if (typeof decoratorFn !== 'function') {
      throw new Error('Decorator must be a function');
    }
    this.customDecorators.push(decoratorFn);
    return this;
  }

  // ============ CONTAINER METHODS FOR CHAINING ============

  /**
   * Register a value directly (for chaining)
   * @param {string} name - Service name
   * @param {*} value - Any value to register
   * @returns {ServiceBuilder} For chaining
   */
  value(name, value) {
    return this.container.value(name, value);
  }

  /**
   * Register a factory function (for chaining)
   * @param {string} name - Service name  
   * @param {Function} factory - Factory function that receives dependencies
   * @returns {ServiceBuilder} For chaining
   */
  factory(name, factory) {
    return this.container.factory(name, factory);
  }

  /**
   * Register a singleton service (for chaining)
   * @param {string|Function|Object} nameOrImplementation - Service name or implementation
   * @param {Function|Object} [implementation] - Service implementation
   * @returns {ServiceBuilder} For chaining
   */
  singleton(nameOrImplementation, implementation) {
    return this.container.singleton(nameOrImplementation, implementation);
  }

  /**
   * Register a transient service (for chaining)
   * @param {string|Function|Object} nameOrImplementation - Service name or implementation
   * @param {Function|Object} [implementation] - Service implementation
   * @returns {ServiceBuilder} For chaining
   */
  transient(nameOrImplementation, implementation) {
    return this.container.transient(nameOrImplementation, implementation);
  }

  _register() {
    // Check if already registered and not allowing overrides
    if (this.container.has(this.name) && 
        !this._allowOverride && 
        this.container.options.strictMode) {
      throw new Error(ERRORS.ALREADY_REGISTERED(this.name));
    }

    // Check conditions
    if (this.conditions.length > 0) {
      const shouldRegister = this.conditions.every(condition => {
        try {
          return condition();
        } catch (error) {
          console.warn(`Condition check failed for ${this.name}:`, error);
          return false;
        }
      });
      if (!shouldRegister) return this.container;
    }

    // If overriding, clear cached instances
    if (this._allowOverride && this.container.has(this.name)) {
      this.container._instances.delete(this.name);
      // Clear from all scopes too
      this.container._scopes.forEach(scope => {
        scope._instances.delete(this.name);
      });
    }

    this.container._services.set(this.name, {
      implementation: this.implementation,
      lifecycle: this.lifecycle,
      factory: this.factory,
      tags: this.tags,
      name: this.name,
      decorators: this.decorators,
      customDecorators: this.customDecorators
    });

    if (this.container.options.verbose) {
      console.log(`[SDIJS:REGISTER] Service '${this.name}' [${this.lifecycle}]${this.decorators.length || this.customDecorators.length ? ' with decorators' : ''}`);
    }

    return this.container;
  }

  _inferName(implementation) {
    if (typeof implementation === 'function' && implementation.name) {
      return this.container._formatName(implementation.name);
    }
    throw new Error('Service name is required when implementation has no name');
  }
}

// ============ SCOPE CLASS ============

class Scope {
  constructor(container, name) {
    this.container = container;
    this.name = name;
    this._instances = new Map();
  }

  /**
   * Resolve a service within this scope
   * @param {string} name - Service name
   * @returns {*} Resolved service
   */
  resolve(name) {
    return this.container.resolve(name, this.name);
  }

  /**
   * Clear this scope (dispose scoped instances)
   * @returns {Scope} For chaining
   */
  dispose() {
    // Call dispose methods on instances if they exist
    this._instances.forEach((instance, name) => {
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose();
        } catch (error) {
          console.warn(`Failed to dispose ${name}:`, error);
        }
      }
    });
    
    this._instances.clear();
    return this;
  }

  /**
   * Get all instances in this scope
   * @returns {Map} Instances map
   */
  getInstances() {
    return new Map(this._instances);
  }
}

// ============ EXPORTS ============

export default SDI;
export const createContainer = (options) => new SDI(options);