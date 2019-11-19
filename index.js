// app.js
class App {
  constructor({tweeter, timeline, config}) {
    this.tweeter = tweeter;
    this.timeline = timeline;
    this.config = config
   }
}

//HttpClient.js
class HttpClient {
  constructor({database, valuedirect, config}) {
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
  constructor({'config': alias }) {
      this.name = "bd";
      this.config = alias;
  }
}

let config = {
  values: 10,
  configuration: 2
}

// startup.js
let DependencyInjection = require("./DependencyInjection.js");
// Ok so now for the business end of the injector!
const $Inject = new DependencyInjection({verbose:true});

$Inject.addSingleton(HttpClient, 'client');
$Inject.addService(Database);
$Inject.addService(TwitterApi, 'api');
$Inject.addService(Tweeter);
$Inject.addService(Timeline);

$Inject.addService(config, 'config');

$Inject.addService(42, 'valuedirect');

$Inject.addService(App);

var app = $Inject.resolve('app');

console.log("Same instance? " + (app.tweeter.client === app.tweeter.api.client)); 
console.log(app.tweeter.api.client.test());
console.log(app.tweeter.client.test());

app.valuedirect = 666;

app.config.values = 1000;
console.log(app.config.values);
console.log(app.tweeter.api.client.config.values);

app.tweeter.api.client.value = "Valor Modificado";
console.log(app.tweeter.api.client.value);
console.log(app.tweeter.client.value);

//console.log(JSON.stringify(app, null, 2));