# DependencyInjectionJS
A dependency-free Dependency Injection (DI) for JavaScript/Node. It’s lightweight, written in vanilla JavaScript, designed to inyect. No less, no more.

## Lifetime Types

There are 2 lifetime types available.

TRANSIENT: This is the default, the registration is resolved every time it is needed. This means if you resolve a class more than once, you will get back a new instance every time.

SINGLETON: The registration is always reused no matter what - that means that the resolved value is cached in the container.

BASED ON
https://github.com/jeffijoe/awilix