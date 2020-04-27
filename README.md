# sdijs

A Simple Dependency Injection (DI) library for NodeJs. It’s lightweight, zero dependency, written in vanilla JavaScript, designed to inyect. No less, No more.

### Why Dependency Injection ?

The Dependency Injection pattern is about separating the instantiation of objects from the actual logic and behavior that they encapsulate. This pattern has many benefits such as:

- **explicit dependencies** - all dependencies are passed in as constructor arguments, which makes it easy to understand how particular object depends on the rest of the environment,
- **code reuse** - such an object is much easier to reuse in other environments, because it is not coupled to a specific implementation of its dependencies,
- and **much easier to test**, because testing is essentially about instantiating a single object without the rest of the environment.

## Example

```js
const sdijs = require("./index.js");

// Initialize a new dijs instance.
const $Inject = new sdijs({
  verbose: true
});

const CONFIG = {
  int: 10,
  string: 'foo',
  array: [1 ,2 ,3],
  db: {
    name: 'dev',
    url: 'http://127.0.0.1:1234'
  }
}

class ServiceA {
  constructor({config}) {
    this.config = config;
  }
  index() {
    return 'index action from ServiceA ' + this.config.int;
  }
}

class ServiceB {
   constructor({config}) {
    this.config = config;
  }
  index() {
    return 'index action from ServiceB ' + this.config.string;
  }
}

//App.js Class
class App {
  constructor({serviceA, serviceB}) {
    this.serviceA = serviceA;
    this.serviceB = serviceB;
  }
  foo() {
    return this.serviceA.index();
  }
  bar() {
    return this.serviceB.index();
  }
}

$Inject.addSingleton(CONFIG, 'config');
$Inject.addSingleton(ServiceA);
$Inject.AddTransient(ServiceB);
$Inject.addSingleton(App);

// Resolves the dependency graph.
const app = $Inject.resolve('app');

console.log(app.foo());
console.log(app.bar());
```
Terminal output
``` bash
 [S]  (class) serviceA ----------->  [S]  App
 [S]  (object) config ------------>  [S]  ServiceA
 [T]  (class) serviceB ----------->  [S]  App
 [S]  (object) config ------------>  [T]  ServiceB
index action from ServiceA 10
index action from ServiceB foo
```

### Lifetime Types
There are 2 lifetime types available.

__TRANSIENT:__ The registration is resolved every time it is needed. This means if you resolve a class more than once, you will get back a new instance every time.

```js
$Inject.AddTransient(Service);
```

__SINGLETON:__ The registration is always reused no matter what - that means that the resolved value is cached in the container.

```js
$Inject.addSingleton(Service);
```

# Usage

## new sdijs(options)
Returns a new dijs instance with the given methods.
````js
const sdijs = require("./index.js");

// Initialize a new dijs instance.
const $Inject = new sdijs({
  verbose: true
});
````

## Instance methods

### $addSingleton(value, alias)

Sets a value in the namespace.

### $AddTransient(value, alias)

Sets a value in the namespace.


### $resolve(name)

Resolves the dependency graph.

## Run tests

```
npm tun test
```

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).