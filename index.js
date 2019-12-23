const ANSI = {
  reset: '\033[0m',

  // Text color
  red: '\033[31m',
  green: '\033[32m',
  yellow: '\033[33m',
  blue: '\033[34m',
  magenta: '\033[35m',
  cyan: '\033[36m',
  white: '\033[37m',
}
module.exports = class DependencyInjection {
  
  constructor({verbose = false } = {}) {
    this._services = new Map();
    this._singletons = new Map();
    this._verbose = verbose;
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
    let name = alias ? alias : this._formatName(service.name);
    this._services.set(name, {type, service, singleton})
  }

  getInjector(module, name) {

		let container = this;
		
		let paramParser = new Proxy({}, {
			// The "get" handler is invoked whenever a get-call for
			// "injector.*" is made. We make a call to an external service
			// to actually hand back in the configured service. The proxy
			// allows us to bypass parsing the function params using
			// taditional regex or even the newer parser.
			get: (target, key) => { 
        container._log(key, module);
				return container.resolve(key);
			},

			// You shouldn't be able to set values on the injector.
			set: (target, key, value) => {
				throw new Error(`Don't try to set ${key}!`);
			}

    });
 
    if(container._isFunction(module.service)) {
      if(module.singleton) {
        const singletonInstance = container._singletons.get(name);

        if(singletonInstance) {
          return singletonInstance;
        } else {
          // Create Instance
          const newSingletonInstance = container._isClass(module.service) ? 
            new module.service(paramParser) : module.service.call(null, paramParser);
          // Save Instance
          container._singletons.set(name, newSingletonInstance);
          // Send Instance
          return newSingletonInstance;
        }
  
      }else{
        // Create and Send Instance
        return container._isClass(module.service) ? 
          new module.service(paramParser) : module.service.call(null, paramParser);
      }
    } else {

      return  module.singleton  ? 
              module.service    : // Send reference object 
        { ...module.service }     // Send a copy object with ES6 style
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
    if(this._verbose){
      try {
        let from = `${this._services.get(name).singleton ? ANSI.cyan + '[S]' : '[T]'} (${this._services.get(name).type}) ${name}`;  
        let to = `${module.singleton ? (ANSI.cyan + '[S]') : '[T]'} ${module.service.name}`;
        console.info(`${ANSI.white} ${from} ${ANSI.blue} ${'>'.padStart(20 - name.length - this._services.get(name).type.length, '-')} ${ANSI.green} ${to} ${ANSI.reset}`);
      } catch (error) {
        
      }
      
    }
  }
}