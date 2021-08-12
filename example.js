const sdijs = require("./index.js");

const $Inject = new sdijs({
  verbose: true
});

// ======================================================
// Config Object
const int = 10;
const CONFIG = {
  int,
  url: 'foo',
  db: {
    name: 'dev',
    url: 'http://127.0.0.1:1234'
  }
}

// utils.js function
const utils = ({config}) => {
 
  return {
    test: () => {
      return config.int * config.int;
    }
  };
}

//Database.js Class
class Database {
  constructor({'config': configAlias, utils}) {
    this.config = configAlias;
    this.utils = utils;
  }

  query(type) {
    return this.config.db;
  }
}

//HttpClient.js Class
class HttpClient {
  constructor({config, utils}) {
    this.config = config;
    this.utils = utils;
  }
  getInfo() {
    return 'get ' + this.config.url;
  }
}

//Repository.js Class
class Repository {
  constructor({database}) {
    this.database = database;
  }
  getUser() {
    return this.database.query('user');
  }
}

//Service.js Class
class Service {
  constructor({repository, httpClient}) {
    this.repository = repository;
    this.httpClient = httpClient;
  }
  getAll(filter) {
    return {
      filter,
      users: this.repository.getUser(),
      info: this.httpClient.getInfo()
    }
  }
}

//Controller.js Class
class Controller {
  constructor({service}) {
    this.service = service;
  }
  home(filter) {
    return this.service.getAll(filter);
  }
}

//App.js Class
class App {
  constructor({controller, config, utils}) {
    this.config = config;
    this.controller = controller;
    this.utils = utils;
  }

  router(filter) {
    return {
      home: this.controller.home(filter)
    };
  }
}

$Inject.addSingleton(CONFIG, 'config');
$Inject.addSingleton(utils, 'utils');
$Inject.addSingleton(HttpClient);
$Inject.addSingleton(Database);
$Inject.addSingleton(Repository);
$Inject.addSingleton(Service);
$Inject.addSingleton(Controller);

// RESOLVE
$Inject.addSingleton(App);
const app = $Inject.resolve('app');

console.log(app.router('foo'));
console.log(app.controller.home('bar'));