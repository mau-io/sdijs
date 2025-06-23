# Changelog

## [2.0.0] - 2025 - 🚀 **MAJOR RELEASE**

### ✅ **BREAKING CHANGES** 

- **ES Modules**: Converted from CommonJS to ES Modules
  - `require('sdijs')` → `import SDI from 'sdijs'`
  - Requires Node.js 16+
- **API Redesign**: Complete API overhaul while maintaining destructuring
  - `new sdijs()` → `new SDI()`
  - `$Inject.addSingleton()` → `container.singleton()`
  - `$Inject.addTransient()` → `container.transient()`
  - `$Inject.addValue()` → `container.value()`

### 🚀 **NEW FEATURES**

#### **Fluent/Chainable API**
```js
container
  .value('config', config)
  .singleton(Database)
  .transient(NotificationService)
  .factory('logger', createLogger);
```

#### **Scoped Dependencies**
```js
const requestScope = container.createScope('request');
container.register(RequestContext).asScoped();
```

#### **Factory Functions with DI**
```js
container.factory('emailService', ({config, logger}) => {
  return new EmailService(config.smtp, logger);
}).asSingleton();
```

#### **Circular Dependency Detection**
- Automatic detection with helpful error messages
- Stack trace showing dependency chain

#### **Lifecycle Hooks**
```js
container
  .hook('beforeCreate', ({service}) => console.log(`Creating ${service.name}`))
  .hook('afterCreate', ({instance}) => console.log('Service ready'));
```

#### **Advanced Service Builder**
```js
container
  .register(AdminService)
  .withTag('admin')
  .withTag('security')
  .when(() => process.env.NODE_ENV === 'production')
  .asSingleton();
```

#### **Enhanced Error Messages**
- "Service 'name' not found. Did you forget to register it?"
- "Circular dependency detected: serviceA → serviceB → serviceA"

#### **Multiple Service Resolution**
```js
const {database, logger, config} = container.resolveAll([
  'database', 'logger', 'config'
]);
```

### 💎 **MAINTAINED FEATURES**

- **✅ Destructuring Support**: `{a,b,c}` syntax unchanged
- **✅ Auto-binding**: Class methods automatically bound
- **✅ Zero Dependencies**: Still lightweight and secure
- **✅ All Lifecycles**: Singleton, Transient, Value, + new Scoped

### 🛠️ **IMPROVEMENTS**

- **TypeScript Support**: Full type definitions included
- **Better Performance**: Optimized resolution and caching
- **Structured Clone**: Modern, secure object cloning
- **Enhanced Logging**: Better debugging information
- **Utility Methods**: `has()`, `clear()`, `getServiceNames()`

### 📚 **MIGRATION GUIDE**

#### **Basic Migration**
```js
// OLD (v1.x)
const sdijs = require('sdijs');
const $Inject = new sdijs();
$Inject.addSingleton(Service);

// NEW (v2.0)
import SDI from 'sdijs';
const container = new SDI();
container.singleton(Service);
```

#### **Service Classes** 
```js
// ✅ NO CHANGES NEEDED!
class UserService {
  constructor({database, logger, config}) {  // Still works!
    this.database = database;
    this.logger = logger;
    this.config = config;
  }
}
```
