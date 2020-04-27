const assert = require('assert');
const DiJs = require("../index.js");

const $Inject = new DiJs({
  verbose: true
});

// ======================================================
// Config Object
const CONFIG_SINGLETON = {
  int: 10,
  string: 'foo',
  array: [1 ,2 ,3],
  db: {
    name: 'dev',
    url: 'http://127.0.0.1:1234'
  }
}

// Config Object
const CONFIG_TRANSIENT = {
  int: 10,
  string: 'foo',
  array: [1 ,2 ,3],
  db: {
    name: 'dev',
    url: 'http://127.0.0.1:1234'
  }
}

// TransientClass.js Class
class TransientClass {
  constructor() {
    this.value = 'original';
  }
}

// SingletonClass.js Class
class SingletonClass {
  constructor() {
    this.value = 'original';
  }
}

class ServiceA {
  constructor({configSingleton, configTransient, singletonClass, transientClass}) {
    this.configSingleton = configSingleton;
    this.configTransient = configTransient;
    this.singletonClass = singletonClass;
    this.transientClass = transientClass;
  }
  get() {
    return "get action";
  }
  post() {
    return "post action";
  }
}

class ServiceB {
  constructor({configSingleton, configTransient, singletonClass, transientClass}) {
    this.configSingleton = configSingleton;
    this.configTransient = configTransient;
    this.singletonClass = singletonClass;
    this.transientClass = transientClass;
  }
  get() {
    return "get action";
  }
  post() {
    return "post action";
  }
}

//App.js Class
class App {
  constructor({serviceA, serviceB, configSingleton, configTransient}) {
    this.configSingleton = configSingleton;
    this.configTransient = configTransient;
    this.serviceA = serviceA;
    this.serviceB = serviceB;
  }
}

$Inject.addSingleton(CONFIG_SINGLETON, 'configSingleton');
$Inject.AddTransient(CONFIG_TRANSIENT, 'configTransient');

$Inject.addSingleton(SingletonClass);
$Inject.AddTransient(TransientClass);

$Inject.addSingleton(ServiceA);
$Inject.AddTransient(ServiceB);

// RESOLVE
$Inject.addSingleton(App);
const app = $Inject.resolve('app');

describe('Inyection Type Test', () => {
  
  describe('app tree', () => {
    it('It should be same instance', done => {
      assert.equal(app.serviceA.singletonClass === app.serviceB.singletonClass, true);
      assert.equal(app.serviceA.configSingleton === app.serviceB.configSingleton, true);
      done();
    });

    it('It should be diferent instance', done => {
      assert.equal(app.serviceA.transientClass !== app.serviceB.transientClass, true);
      assert.equal(app.serviceA.configTransient !== app.serviceB.configTransient, true);
      done();
    });

    it('It should be same value', done => {
      app.configSingleton.db.name = 'singleton edited';

      assert.equal(app.configSingleton.db.name === app.serviceA.configSingleton.db.name, true);
      assert.equal(app.configSingleton.db.name, CONFIG_SINGLETON.db.name);
      assert.equal( app.serviceA.configSingleton.db.name, CONFIG_SINGLETON.db.name);
      done();
    });

    it('It should be diferent value', done => {
      app.configTransient.db.name = 'transient edited';

      assert.equal(app.configTransient.db.name !== app.serviceA.configTransient.db.name, true);
      assert.equal(app.configTransient.db.name, 'transient edited');
      assert.equal(app.serviceA.configTransient.db.name, CONFIG_TRANSIENT.db.name);
      done();
    });
  });
  
});