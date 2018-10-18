import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Unit | Service | documents', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('getPopularTags', function(assert) {
    let service = this.owner.lookup('service:documents');
    run(()=> {
      var done = assert.async();
      service.getPopularTags(5).then((resp)=> {
        console.log("NUM TAGS", resp.data.length);
        assert.equal(resp.data.length,5);
        done();
      }).catch((err)=> {
        assert.ok( false, "false fails" );
      });
    });
  });
});
