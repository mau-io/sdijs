/**
 * SDI v2.0 TypeScript Definitions
 * Type-safe dependency injection with maintained destructuring
 */

/** Service lifecycle types */
export type Lifecycle = 'singleton' | 'transient' | 'scoped' | 'value';

/** Container configuration options */
export interface SDIOptions {
  /** Enable verbose logging for debugging */
  verbose?: boolean;
  /** Automatically bind class methods to their instance */
  autoBinding?: boolean;
  /** Prevent duplicate service registration without override */
  strictMode?: boolean;
  /** Allow service overrides globally */
  allowOverrides?: boolean;
  /** Maximum number of services that can be registered */
  maxServices?: number;
  /** Maximum number of singleton instances to cache */
  maxInstances?: number;
  /** Maximum number of scopes that can be created */
  maxScopes?: number;
  /** Maximum number of hooks per event type */
  maxHooksPerEvent?: number;
}

/** Internal service registration metadata */
export interface ServiceRegistration<T = any> {
  /** The service implementation (class, function, or value) */
  implementation: T;
  /** Service lifecycle management strategy */
  lifecycle: Lifecycle;
  /** Whether this service uses a factory function */
  factory: boolean;
  /** Set of tags associated with this service */
  tags: ReadonlySet<string>;
  /** Unique service name */
  name: string;
}

/** Data passed to lifecycle hooks */
export interface HookData {
  /** Service registration metadata */
  service?: ServiceRegistration;
  /** Current scope (if applicable) */
  scope?: Scope;
  /** Created service instance */
  instance?: any;
  /** Service name being resolved */
  name?: string;
  /** Scope name being used */
  scopeName?: string;
  /** Resolution result */
  result?: any;
}

/** Lifecycle hook callback function */
export type HookCallback = (data: HookData) => void;

/** Constructor function interface */
export interface Constructor<T = {}> {
  new (deps: any): T;
}

/** Factory function interface */
export interface ServiceFactory<T> {
  (deps: any): T;
}

/** 
 * Main SDI container class
 * Provides dependency injection with destructuring support {a,b,c}
 */
export declare class SDI {
  /** Container configuration options */
  readonly options: SDIOptions;
  
  /** 
   * Create a new SDI container
   * @param options Container configuration options
   */
  constructor(options?: SDIOptions);
  
  // ============ FLUENT REGISTRATION API ============
  
  /** 
   * Register a service with fluent API
   * @param implementation The service implementation (class, function, or value)
   * @param name Optional service name (auto-inferred if not provided)
   * @returns ServiceBuilder for fluent configuration
   */
  register<T>(implementation: Constructor<T> | ServiceFactory<T> | T, name?: string): ServiceBuilder<T>;
  
  /** 
   * Register multiple services at once
   * @param services Object with name: implementation pairs
   * @returns Container for chaining
   */
  registerAll(services: Record<string, any>): SDI;
  
  /** 
   * Register a value directly (no instantiation)
   * @param name Service name
   * @param value Value to register
   * @returns Container for chaining
   */
  value<T>(name: string, value: T): SDI;
  
  /** 
   * Register a factory function
   * @param name Service name
   * @param factory Factory function that receives dependencies
   * @returns ServiceBuilder for further configuration
   */
  factory<T>(name: string, factory: ServiceFactory<T>): ServiceBuilder<T>;
  
  /** 
   * Register a singleton service (one instance shared)
   * @param implementation Service implementation or name
   * @param name Service name (if first param is implementation)
   * @returns ServiceBuilder for chaining
   */
  singleton<T>(implementation: Constructor<T> | ServiceFactory<T>, name?: string): ServiceBuilder<T>;
  
  /** 
   * Register a transient service (new instance each time)
   * @param implementation Service implementation or name
   * @param name Service name (if first param is implementation)
   * @returns ServiceBuilder for chaining
   */
  transient<T>(implementation: Constructor<T> | ServiceFactory<T>, name?: string): ServiceBuilder<T>;
  
  // ============ SCOPE MANAGEMENT ============
  
  /** 
   * Create a new dependency scope
   * @param name Unique scope name
   * @returns New scope instance
   */
  createScope(name: string): Scope;
  
  /** 
   * Get an existing scope
   * @param name Scope name
   * @returns Existing scope
   */
  scope(name: string): Scope;
  
  // ============ RESOLUTION ============
  
  /** 
   * Resolve a service by name
   * @param name Service name
   * @param scopeName Optional scope name for scoped resolution
   * @returns Resolved service instance
   */
  resolve<T = any>(name: string, scopeName?: string): T;
  
  /** 
   * Resolve multiple services at once
   * @param names Array of service names
   * @param scopeName Optional scope name
   * @returns Object with resolved services
   */
  resolveAll<T extends Record<string, any>>(names: string[], scopeName?: string): T;
  
  /** 
   * Get a resolver function for lazy resolution
   * @param name Service name
   * @returns Function that resolves the service when called
   */
  getResolver<T = any>(name: string): (scopeName?: string) => T;
  
  // ============ ADVANCED FEATURES ============
  
  /** 
   * Check if a service is registered
   * @param name Service name
   * @returns True if service is registered
   */
  has(name: string): boolean;
  
  /** 
   * Remove a service registration
   * @param name Service name
   * @returns Container for chaining
   */
  unregister(name: string): SDI;
  
  /** 
   * Clear all registrations and instances
   * @returns Container for chaining
   */
  clear(): SDI;
  
  /** 
   * Get all registered service names
   * @returns Array of service names
   */
  getServiceNames(): string[];
  
  // ============ TAG-BASED SERVICE DISCOVERY ============
  
  /** 
   * Find services by tags with AND/OR logic
   * @param tags Array of tags to search for
   * @param mode Search mode: 'AND' (all tags) or 'OR' (any tag)
   * @returns Array of matching services with metadata
   */
  getServicesByTags(tags: string[], mode?: 'AND' | 'OR'): Array<{
    name: string;
    service: ServiceRegistration;
    tags: string[];
    lifecycle: Lifecycle;
    factory: boolean;
  }>;
  
  /** 
   * Get service names by tags (simplified version)
   * @param tags Array of tags to search for
   * @param mode Search mode: 'AND' or 'OR'
   * @returns Array of matching service names
   */
  getServiceNamesByTags(tags: string[], mode?: 'AND' | 'OR'): string[];
  
  /** 
   * Resolve services by tags
   * @param tags Array of tags to search for
   * @param mode Search mode: 'AND' or 'OR'
   * @param scopeName Optional scope name
   * @returns Array of resolved services with metadata
   */
  resolveServicesByTags(tags: string[], mode?: 'AND' | 'OR', scopeName?: string): Array<{
    name: string;
    instance: any;
    tags: string[];
    lifecycle: Lifecycle;
  }>;
  
  /** 
   * Get all unique tags from registered services
   * @returns Sorted array of all unique tags
   */
  getAllTags(): string[];
  
  /** 
   * Get services grouped by tag
   * @returns Object where keys are tags and values are service name arrays
   */
  getServicesByTag(): Record<string, string[]>;
  
  // ============ LIFECYCLE HOOKS ============
  
  /** 
   * Add a lifecycle hook
   * @param event Hook event type
   * @param callback Hook callback function
   * @returns Container for chaining
   */
  hook(event: 'beforeCreate' | 'afterCreate' | 'beforeResolve' | 'afterResolve', callback: HookCallback): SDI;
  
  /** 
   * Remove all hooks for an event
   * @param event Hook event name
   * @returns Container for chaining
   */
  clearHooks(event: string): SDI;
}

/** 
 * Service builder for fluent API configuration
 * Provides method chaining for service registration
 */
export declare class ServiceBuilder<T> {
  /** Container reference for chaining */
  readonly container: SDI;
  /** Service implementation */
  readonly implementation: T;
  /** Service name */
  readonly name: string;
  /** Current lifecycle setting */
  lifecycle: Lifecycle;
  /** Whether service uses factory pattern */
  isFactory: boolean;
  /** Set of tags associated with service */
  readonly tags: ReadonlySet<string>;
  
  // ============ LIFECYCLE CONFIGURATION ============
  
  /** 
   * Register as singleton (shared instance)
   * @returns Container for chaining
   */
  asSingleton(): SDI;
  
  /** 
   * Register as transient (new instance each time)
   * @returns Container for chaining
   */
  asTransient(): SDI;
  
  /** 
   * Register as scoped (one instance per scope)
   * @returns Container for chaining
   */
  asScoped(): SDI;
  
  /** 
   * Register as value (no instantiation)
   * @returns Container for chaining
   */
  asValue(): SDI;
  
  /** 
   * Mark as factory function
   * @returns ServiceBuilder for further configuration
   */
  asFactory(): ServiceBuilder<T>;
  
  // ============ TAGGING AND METADATA ============
  
  /** 
   * Add a single tag to this service
   * @param tag Tag name
   * @returns ServiceBuilder for chaining
   */
  withTag(tag: string): ServiceBuilder<T>;
  
  /** 
   * Add multiple tags to this service
   * @param tags Array of tag names
   * @returns ServiceBuilder for chaining
   */
  withTags(...tags: string[]): ServiceBuilder<T>;
  
  // ============ CONDITIONAL REGISTRATION ============
  
  /** 
   * Add condition for registration
   * @param condition Function that returns boolean
   * @returns ServiceBuilder for chaining
   */
  when(condition: () => boolean): ServiceBuilder<T>;
  
  /** 
   * Allow overriding existing registration
   * @returns ServiceBuilder for chaining
   */
  override(): ServiceBuilder<T>;
  
  /** 
   * Complete configuration and return container
   * @returns Container for method chaining
   */
  build(): SDI;
  
  // ============ CHAINING METHODS ============
  
  /** 
   * Register another value (for chaining)
   * @param name Service name
   * @param value Value to register
   * @returns ServiceBuilder for chaining
   */
  value<U>(name: string, value: U): ServiceBuilder<U>;
  
  /** 
   * Register another factory (for chaining)
   * @param name Service name
   * @param factoryFn Factory function
   * @returns ServiceBuilder for chaining
   */
  factory<U>(name: string, factoryFn: ServiceFactory<U>): ServiceBuilder<U>;
  
  /** 
   * Register another singleton (for chaining)
   * @param nameOrImplementation Service name or implementation
   * @param implementation Service implementation
   * @returns ServiceBuilder for chaining
   */
  singleton<U>(nameOrImplementation: Constructor<U> | ServiceFactory<U> | string, implementation?: Constructor<U> | ServiceFactory<U>): ServiceBuilder<U>;
  
  /** 
   * Register another transient (for chaining)
   * @param nameOrImplementation Service name or implementation
   * @param implementation Service implementation
   * @returns ServiceBuilder for chaining
   */
  transient<U>(nameOrImplementation: Constructor<U> | ServiceFactory<U> | string, implementation?: Constructor<U> | ServiceFactory<U>): ServiceBuilder<U>;
}

/** 
 * Dependency scope for managing scoped service instances
 * Provides isolated service instances within a specific context
 */
export declare class Scope {
  /** Container reference */
  readonly container: SDI;
  /** Unique scope name */
  readonly name: string;
  
  /** 
   * Resolve a service within this scope
   * @param name Service name
   * @returns Resolved service instance
   */
  resolve<T = any>(name: string): T;
  
  /** 
   * Dispose all instances in this scope
   * Calls dispose() method on instances if available
   * @returns Scope for chaining
   */
  dispose(): Scope;
  
  /** 
   * Get all instances currently in this scope
   * @returns Map of service names to instances
   */
  getInstances(): ReadonlyMap<string, any>;
}

/** 
 * Factory function for creating SDI containers
 * @param options Container configuration options
 * @returns New SDI container instance
 */
export declare function createContainer(options?: SDIOptions): SDI;

/** 
 * Service lifecycle constants
 */
export declare const LIFECYCLE: {
  /** Single shared instance */
  SINGLETON: 'singleton';
  /** New instance each time */
  TRANSIENT: 'transient';
  /** One instance per scope */
  SCOPED: 'scoped';
  /** Direct value (no instantiation) */
  VALUE: 'value';
};

/** Default export - SDI class */
declare const _default: typeof SDI;
export default _default; 