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
class DependencyInjection  {
  
  constructor({verbose = false } = {}) {
    this._services = new Map();
    this._singletons = new Map();
    this._verbose = verbose;
  }

  resolve(name){
    const module = this._services.get(name);
    if(!module) throw new Error(`${ANSI.red} Module - ${name} - doesn't exist! ${ANSI.reset}`);
    return this.getInjector(module, name);
  }

  addService(service, alias) {
    let name = alias ? alias : this._formatName(service.name);
    this._services.set(name, {service, singleton: false})
  }

  addSingleton(service, alias) {
    let name = alias ? alias : this._formatName(service.name);
    this._services.set(name, {service, singleton: true})
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
    
    if(!container._isClass(module.service)){
      if(module.singleton) {
        return module.service; // Send reference object
      }else{
        return {...module.service} // Send a copy object with ES6 style
      }
    } 
    
    if(module.singleton) {
      const singletonInstance = container._singletons.get(name);

      if(singletonInstance) {
        return singletonInstance;
      } else {
        // Create Instance
        const newSingletonInstance = new module.service(paramParser);
        // Save Instance
        container._singletons.set(name, newSingletonInstance);
        // Send Instance
        return newSingletonInstance;
      }

    }else{
      // Create and Send Instance
      return new module.service(paramParser);
    }
		
  }
  _isClass(definition) {
		return typeof definition === 'function'
      && /^class\s/.test(Function.prototype.toString.call(definition));
  }
  _formatName(string){
    return string.charAt(0).toLowerCase() + string.substr(1);
  }
  _log(name, module) {
    if(this._verbose){

      try {
        let from = `${this._services.get(name).singleton ? (ANSI.red + '[S]') : '[T]'} ${name}`;  
        let to = `${module.singleton ? (ANSI.red + '[S]') : '[T]'} ${module.service.name}`;
        console.info(`${ANSI.white} ${from} ${ANSI.blue} ${'>'.padStart(20 - name.length, '-')} ${ANSI.green} ${to} ${ANSI.reset}`);
      } catch (error) {
        
      }
      
    }
  }
}

module.exports = DependencyInjection;