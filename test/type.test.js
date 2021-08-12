const assert = require('assert');
const sdijs = require("../index.js");

const $Inject = new sdijs({
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

// Function
const useCase = () => true;

// Entity.js Class
class Entity {
  constructor({id, name, email}) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

// TransientClass.js Class
class TransientClass {
  constructor({entity}) {
    this.entity = entity;
    this.value = 'original';
  }
}

// SingletonClass.js Class
class SingletonClass {
  constructor({entity, useCase}) {
    this.entity = entity;
    this.useCase = useCase;
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
$Inject.addTransient(CONFIG_TRANSIENT, 'configTransient');

$Inject.addSingleton(SingletonClass);
$Inject.addTransient(TransientClass);
$Inject.addValue(Entity, 'entity');
$Inject.addValue(useCase, 'useCase');

$Inject.addSingleton(ServiceA);
$Inject.addTransient(ServiceB);

// RESOLVE
$Inject.addSingleton(App);
const app = $Inject.resolve('app');

describe('Inyection Type Test', () => {
  
  describe('app tree', () => {

    it('It should be raw values', done => {
      assert.equal(new app.serviceA.singletonClass.entity({id: 1, name:'person', email:'person@email.com'}) instanceof Entity, true);
      assert.equal(new app.serviceA.transientClass.entity({id: 1, name:'person', email:'person@email.com'}) instanceof Entity, true);
      assert.equal(app.serviceA.singletonClass.entity === Entity, true);
      assert.equal(app.serviceA.transientClass.entity === Entity, true);

      assert.equal(app.serviceA.singletonClass.useCase(), true);
      done();
    });

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