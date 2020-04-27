const assert = require('assert');
const sdijs = require("../index.js");

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
   getAll() {
    return {
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
  home() {
    return this.service.getAll();
  }
}

//App.js Class
class App {
  constructor({controller, config, utils}) {
    this.config = config;
    this.controller = controller;
    this.utils = utils;
  }

  router() {
    return {
      home: this.controller.home()
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

describe('Inyection Test', () => {
  
  describe('app tree', () => {

    it('should be exists app', done => {
      assert.equal(typeof app, 'object');
      assert.equal(typeof app.config, 'object');
      assert.equal(typeof app.utils, 'object');
      assert.equal(typeof app.utils.test, 'function')
      assert.equal(typeof app.router, 'function');
      done();
    });

    it('should be exists app.controller', done => {
      assert.equal(typeof app.controller, 'object');
      assert.equal(typeof app.controller.home, 'function');
      done();
    });

    it('should be exists app.controller.service', done => {
      assert.equal(typeof app.controller.service, 'object');
      assert.equal(typeof app.controller.service.getAll, 'function');
      done();
    });

    it('should be exists app.controller.service.repository', done => {
      assert.equal(typeof app.controller.service.repository, 'object');
      assert.equal(typeof app.controller.service.repository.getUser, 'function');
      done();
    });

    it('should be exists app.controller.service.repository.database', done => {
      assert.equal(typeof app.controller.service.repository.database, 'object');
      assert.equal(typeof app.controller.service.repository.database.query, 'function');
      done();
    });

    it('should be exists app.controller.service.httpClient', done => {
      assert.equal(typeof app.controller.service.httpClient, 'object');
      assert.equal(typeof app.controller.service.httpClient.getInfo, 'function');
      done();
    });

    it('should be equal object', done => {
      assert.deepEqual(app.config, CONFIG);
      done();
    });

    it('should be equal result', done => {
      assert.equal(app.utils.test(), int * int);
      done();
    });

  });

});