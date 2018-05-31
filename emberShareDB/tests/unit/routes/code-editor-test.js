import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | code-editor', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:code-editor');
    assert.ok(route);
  });
});
