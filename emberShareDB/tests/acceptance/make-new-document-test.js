import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Acceptance | make new document', function(hooks) {
  setupApplicationTest(hooks);

  test('make-new-document', async function(assert) {
    let service = this.owner.lookup('service:documents');
    let session = this.owner.lookup('service:session');
    run(()=> {
      session.authenticate('authenticator:oauth2', "louis", "123")
      .then((response) => {
        const data = {
          source : "< some code >",
          isPrivate: true,
          name: "test-doc",
          tags: ["this-is-a-test"],
          assets: []
        }
        service.makeNewDoc(data).then((resp)=> {
          assert.equals(resp.data.source, data.source);
          assert.equals(resp.data.isPrivate, data.isPrivate);
        })
      }).catch((err) => {});
    });
  });
});
