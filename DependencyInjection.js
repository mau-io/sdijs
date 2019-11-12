class DependencyInjection  {
  
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
  }

  resolve(name){
    const module = this._services.get(name);
    if(!module) throw new Error(`Module - ${name} - doesn't exist!`);
    return this.getInjector(module, name);
  }

  addService(name, service) {
    this._services.set(name, {service, singleton: false})
  }

  addSingleton(name, service) {
    this._services.set(name, {service, singleton: true})
  }

  getInjector(module, name) {

		var container = this;
		
		var paramParser = new Proxy({}, {
			// The `get` handler is invoked whenever a get-call for
			// `injector.*` is made. We make a call to an external service
			// to actually hand back in the configured service. The proxy
			// allows us to bypass parsing the function params using
			// taditional regex or even the newer parser.
			get: (target, name) => {
				console.log(module.service.name, "<".padEnd(25 - module.service.name.length, "-"), name)
				return container.resolve(name);
			},

			// You shouldn't be able to set values on the injector.
			set: (target, name, value) => {
				throw new Error(`Don't try to set ${name}!`);
			}

		});
    
    if(!container._isClass(module.service)){
      if(module.singleton) {
        return {...module.service} // Send a copy object with ES6 style
      }else{
        return module.service; // Send reference object
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
    return typeof definition === 'function';
  }
}

module.exports = DependencyInjection;