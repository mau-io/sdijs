# DiJs
A Simple Dependency Injection (DI) Library for NodeJs. It’s lightweight, written in vanilla JavaScript, designed to inyect. No less, no more.

## Lifetime Types

There are 2 lifetime types available.

TRANSIENT: The registration is resolved every time it is needed. This means if you resolve a class more than once, you will get back a new instance every time.

SINGLETON: The registration is always reused no matter what - that means that the resolved value is cached in the container.