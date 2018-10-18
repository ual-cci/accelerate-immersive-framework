import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Unit | Service | documents', function(hooks) {
  setupTest(hooks);

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

  test('makeNewDoc', function(assert) {
    let service = this.owner.lookup('service:documents');
    let session = this.owner.lookup('service:session');
    run(()=> {
      var done = assert.async(2);
      session.authenticate('authenticator:oauth2', "louis", "123")
      .then((response) => {
        console.log("SIGNED IN", response);
        const data = {
          source : "< some code >",
          isPrivate: true,
          name: "test-doc",
          tags: ["this-is-a-test"],
          assets: []
        }
        done();
        service.makeNewDoc(data).then((resp)=> {
          assert.equals(resp.data.source, data.source);
          assert.equals(resp.data.isPrivate, data.isPrivate);
          done();
        })
      }).catch((err) => {
        assert.ok( false, "false fails" );
      });
    });
  });
});
