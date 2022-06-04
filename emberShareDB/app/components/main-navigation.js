import { inject } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import config from  '../config/environment';
export default Component.extend({

  session: inject('session'),
  documentService: inject('documents'),
  mediaQueries:inject(),
  sessionAccount: inject('session-account'),
  store: inject('store'),
  cs: inject('console'),
  logoURL:config.localOrigin + '/images/logo-animation-cropped.gif',
  url:config.localOrigin,
  ownedDocuments: computed('sessionAccount.ownedDocuments', function(){
    return this.get('sessionAccount').ownedDocuments;
  }),
  guides:inject(),
  actions: {
    createDoc() {
      const src = this.get('documentService').getDefaultSource();
      const data = {name:'New Project', isPrivate:false, source:src}
      this.get('documentService').makeNewDoc(data).then(() => {
          this.get('onCreateDoc')();
      });
    },
    allDocs() {
      this.get('cs').log(this.get('sessionAccount').currentUserName);
      this.get('openUserDocs')(this.get('sessionAccount').currentUserName);
    },
    login() {
      this.get('onLogin')();
    },
    logout() {
      this.get('session').invalidate();
    },
    docs() {
      this.get('onDocs')();
    },
    about() {
      this.get('onAbout')();
    },
    gettingStarted() {
      this.get('onGettingStarted')();
    },
    people() {
      this.get('onPeople')();
    },
    examples() {
      this.get('onExamples')();
    },
    inputs() {
      this.get('onInputs')();
    },
    outputs() {
      this.get('onOutputs')();
    },
    guides() {
      this.get('onGuides')();
    },
    openDoc(doc){
      this.get('cs').log(doc);
      this.get('openDoc')(doc);
    },
    openGuide(guide){
      this.get('cs').log(guide);
      this.get('openGuide')(guide);
    }
  }
});
