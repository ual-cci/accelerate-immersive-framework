import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | nime2020', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:nime2020');
    assert.ok(route);
  });
});
