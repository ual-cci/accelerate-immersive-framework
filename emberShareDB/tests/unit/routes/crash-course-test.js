import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | crash-course', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:crash-course');
    assert.ok(route);
  });
});
