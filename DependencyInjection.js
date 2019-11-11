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
// app.js
class App {
  constructor({tweeter, timeline}) {
    this.tweeter = tweeter;
    this.timeline = timeline;
   }
}

//HttpClient.js
class HttpClient {
  constructor({database, valuedirect, 'config chida': config}) {
    this.value = "Valor Original";
    this.bd = database;
    this.valuedirect = valuedirect;
    this.config = config;
  }
  test(){
    return "se ejecuto test";
  }
}

class TwitterApi {
   constructor({client}) {
       this.client = client;
       this.hola = "api";
   }
}

class Timeline {
   constructor({api}) {
       this.api = api;
   }
}

class Tweeter {
   constructor({api, client}) {
       this.api = api;
       this.client = client;
   }
}

class Database {
  constructor({'config chida': alias }) {
      this.name = "bd";
      this.config = alias;
  }
}

// startup.js
// Ok so now for the business end of the injector!
const $Inject = new DependencyInjection();

$Inject.addService('client', HttpClient);
$Inject.addService('database', Database);
$Inject.addService('api', TwitterApi);
$Inject.addService('tweeter', Tweeter);
$Inject.addService('timeline', Timeline);

$Inject.addSingleton('config chida', {
  values: 1,
  configuration:2
});

$Inject.addService('valuedirect', 42);

$Inject.addService('app', App);

var app = $Inject.resolve('app');

console.log("Same instance? " + (app.tweeter.client === app.tweeter.api.client)); 
console.log(app.tweeter.api.client.test())
console.log(app.tweeter.client.test())

app.tweeter.api.client.value = "Valor Modificado";
app.valuedirect = 666
app.tweeter.api.client.config.values = 777;
console.log(app.tweeter.api.client.value)
console.log(app.tweeter.client.value)

console.log(JSON.stringify(app, null, 2));

// https://github.com/jeffijoe/awilix/blob/master/package.json#containerloadmodules