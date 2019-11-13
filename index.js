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
let DependencyInjection = require("./DependencyInjection.js");
// Ok so now for the business end of the injector!
const $Inject = new DependencyInjection();

$Inject.addSingleton('client', HttpClient);
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

//console.log(JSON.stringify(app, null, 2));