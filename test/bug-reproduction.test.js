import { createContainer } from '../index.js';
import { strict as assert } from 'assert';

/**
 * Test to reproduce the bugs identified in SDIJS v2.0.1
 */

describe('Bug Fix Verification Tests', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  describe('Bug #1 & #2 Fix: _inferName method', () => {
    it('should succeed with automatic name inference', () => {
      class TestService {
        constructor() {
          this.name = 'TestService';
        }
      }

      // This should now work without throwing an error
      assert.doesNotThrow(() => {
        container.register(TestService).asSingleton();
      }, 'Automatic name inference should not fail for named classes.');
      
      const instance = container.resolve('testService');
      assert.ok(instance instanceof TestService, 'Instance should be resolved correctly.');
    });

    it('should still work with explicit names', () => {
      class TestService {
        constructor() {
          this.name = 'TestService';
        }
      }
      
      assert.doesNotThrow(() => {
        container.register(TestService, 'explicitTestService').asSingleton();
      });

      const instance = container.resolve('explicitTestService');
      assert.ok(instance instanceof TestService);
    });
  });

  describe('Bug #3 Fix: Safe class detection', () => {
    it('should NOT execute functions during class detection', () => {
      let executed = false;
      
      function NotAClassButLooksLikeOne() {
        executed = true; // This should NOT be executed.
      }
      NotAClassButLooksLikeOne.prototype = {};
      NotAClassButLooksLikeOne.prototype.constructor = NotAClassButLooksLikeOne;

      // The new _isClass implementation should not execute the function
      container._isClass(NotAClassButLooksLikeOne);
      
      assert.strictEqual(executed, false, 'Bug fix failed: _isClass should not execute functions.');
    });

    it('should still properly detect real classes', () => {
      class RealClass {}
      const isClass = container._isClass(RealClass);
      assert.strictEqual(isClass, true, 'Real classes should be detected correctly.');
    });
  });

  describe('Final behavior verification', () => {
    it('should work with automatic name inference after fix', () => {
      class UserService {
        constructor() {
          this.name = 'UserService';
        }
      }

      assert.doesNotThrow(() => {
        container.register(UserService).asSingleton();
      });

      const instance = container.resolve('userService');
      assert.ok(instance instanceof UserService);
      assert.strictEqual(instance.name, 'UserService');
    });
  });
}); 