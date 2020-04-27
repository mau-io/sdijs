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
module.exports = class DependencyInjection {
  
  constructor({verbose = false } = {}) {
    this._verbose = verbose;
    this._services = new Map();
    this._singletons = new Map();
  }

  resolve(name) {
    const module = this._services.get(name);
    if(!module) throw new Error(`${ANSI.red} Module - ${name} - doesn't exist! ${ANSI.reset}`);
    return this.getInjector(module, name);
  }

  AddTransient(service, alias) {
    this.register(service, alias, false);
  }

  addSingleton(service, alias) {
    this.register(service, alias, true);
  }

  register(service, alias, singleton){
    const type = this._isClass(service) ? 'class' : typeof service;
    const name = alias || this._formatName(service.name);
    this._services.set(name, {
      type, 
      service, 
      singleton
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
 
    if(this._isFunction(module.service)) {
      if(module.singleton) {
        const singletonInstance = this._singletons.get(name);

        if(singletonInstance) {
          return singletonInstance;
        } else {
          // Create Instance
          const newSingletonInstance = this._isClass(module.service) ? 
            new module.service(paramParser) : 
            module.service.call(null, paramParser);
          // Save Instance
          this._singletons.set(name, newSingletonInstance);
          // Send Instance
          return newSingletonInstance;
        }
  
      }else{
        // Create and Send Instance
        return  this._isClass(module.service)   ? 
                new module.service(paramParser) : 
                module.service.call(null, paramParser);
      }
    } else {

      return  module.singleton  ? 
              module.service    : // Send reference object
              structuredClone(module.service) // Send a deep copy object
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
      const T = `${ANSI.blue} [T] ${ANSI.reset}`;
      const S = `${ANSI.green} [S] ${ANSI.reset}`;
      const type = this._services.get(name).type;
      const from = `${this._services.get(name).singleton ? S : T} (${type}) ${name}`;  
      const to = `${module.singleton ? S : T} ${module.service.name}`;
      const arrow =  ANSI.red + '>'.padStart(25 - name.length - this._services.get(name).type.length, '-')
      console.info(`${from} ${arrow} ${to}`);
    } catch (error) {
      console.error(error);
    }
  }

}