// app.js
class App {
  constructor({tweeter, timeline, config, ff}) {
    this.tweeter = tweeter;
    this.timeline = timeline;
    this.config = config;
    this.ff = ff;
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
    return "test return";
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
  configuration: 10
}

let ff = ({config}) => {
 
  return {
    test: function () {
      return config.values * config.configuration;
    },
    saveUser: function () {
      return 'test saveUser';
    }
  };
}


// startup.js
let DependencyInjection = require("./index.js");
// Ok so now for the business end of the injector!
const $Inject = new DependencyInjection({verbose:true});

$Inject.addSingleton(HttpClient, 'client');
$Inject.AddTransient(Database);
$Inject.AddTransient(TwitterApi, 'api');
$Inject.AddTransient(Tweeter);
$Inject.AddTransient(Timeline);

$Inject.AddTransient(config, 'config');

$Inject.AddTransient(42, 'valuedirect');

$Inject.AddTransient(App);
$Inject.addSingleton(ff);

var app = $Inject.resolve('app');

console.log("Same instance? " + (app.tweeter.client === app.tweeter.api.client)); 
console.log(app.tweeter.api.client.test());
console.log(app.tweeter.client.test());

console.log(app.ff.test());
console.log(app.ff.saveUser());

app.valuedirect = 666;

app.config.values = 1000;
console.assert(app.config.values = app.tweeter.api.client.config.values, "Should be different");

app.tweeter.api.client.value = "Value changed";
console.assert(app.tweeter.api.client.value == app.tweeter.client.value, app.tweeter.api.client.value);

//console.log(JSON.stringify(app, null, 2));