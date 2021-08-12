const v8 = require('v8');

const structuredClone = obj => {
  return v8.deserialize(v8.serialize(obj));
};

const ANSI = {
  reset: '\033[0m',
  // Text color
  red: '\033[31m',
  green: '\033[32m',
  blue: '\033[34m',
}

const selfish = (target) => {
  const cache = new WeakMap();
  const handler = {
    get (target, propertyKey) {
      const value = Reflect.get(target, propertyKey);
      if(typeof value !== 'function') {
        return value;
      }
      if(!cache.has(value)) {
        cache.set(value, value.bind(target));
      }
      return cache.get(value);
    }
  };
  const proxy = new Proxy(target, handler);
  return proxy;
}
module.exports = class DependencyInjection {
  
  constructor({verbose = false } = {}) {
    this._verbose = verbose;
    this._services = new Map();
    this._singletons = new Map();
    this._values = new Map();
  }

  resolve(name) {
    const module = this._services.get(name);
    if(!module) throw new Error(`${ANSI.red} Module - ${name} - doesn't exist! ${ANSI.reset}`);
    return this.getInjector(module, name);
  }

  addTransient(service, alias) {
    this.register(service, alias, 'transient');
  }

  addSingleton(service, alias) {
    this.register(service, alias, 'singleton');
  }

  addValue(value, alias) {
    this.register(value, alias, 'value');
  }

  register(service, alias, mode){
    const type = this._isClass(service) ? 'class' : typeof service;
    const name = alias || this._formatName(service.name);
    this._services.set(name, {
      type, 
      service, 
      mode
    });
  }

  getInjector(module, name) {

    const paramParser = new Proxy({}, {
      // The "get" handler is invoked whenever a get-call for
      // "injector.*" is made. We make a call to an external service
      // to actually hand back in the configured service. The proxy
      // allows us to bypass parsing the function params using
      // taditional regex or even the newer parser.
      get: (target, key) => { 
        this._verbose && this._log(key, module);
        return this.resolve(key);
      },

      // You shouldn't be able to set values on the injector.
      set: (target, key, value) => {
        throw new Error(`Don't try to set ${key}!`);
      }

    });

    if(module.mode === 'value') { 
      // Save the value
      return this._services.get(name).service;
    }
 
    if(this._isFunction(module.service)) {

      if(module.mode === 'singleton') {
        const singletonInstance = this._singletons.get(name);

        if(singletonInstance) {
          return singletonInstance;
        } else {
          // Create Instance
          const newSingletonInstance = this._isClass(module.service)
            ? selfish(new module.service(paramParser))  // Auto binding
            : module.service.call(null, paramParser);
          // Save Instance
          this._singletons.set(name, newSingletonInstance);
          // Send Instance
          return newSingletonInstance;
        }
  
      }

      if(module.mode === 'transient') { 
        // Create and Send Instance
        return  this._isClass(module.service)
          ? selfish(new module.service(paramParser)) // Auto binding
          : module.service.call(null, paramParser);
      }
     
    } else {

      return  module.mode === 'singleton'
        ? module.service // Send reference object
        : structuredClone(module.service) // Send a deep copy object 
    }
    
  }

  _isClass(definition) {
    return typeof definition === 'function'
      && /^class\s/.test(Function.prototype.toString.call(definition));
  }
  _isFunction(definition) {
    return typeof definition === 'function';
  }

  _formatName(string) {
    return string.charAt(0).toLowerCase() + string.substr(1);
  }

  _log(name, module) {
    try {

      const icon = {
        singleton: `${ANSI.green} [S] ${ANSI.reset}`,
        transient: `${ANSI.blue} [T] ${ANSI.reset}`,
        value:     `${ANSI.red} [V] ${ANSI.reset}`
      };

      const type = this._services.get(name).type;
      const from = `${icon[this._services.get(name).mode]} (${type}) ${name}`;  
      const to   = `${icon[module.mode]} ${module.service.name}`;
      const arrow =  ANSI.red + '>'.padStart(30 - name.length - this._services.get(name).type.length, '-')
      console.info(`${from} ${arrow} ${to}`);
    } catch (error) {
      console.error(error);
    }
  }

}