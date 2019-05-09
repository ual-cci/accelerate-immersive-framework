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
  logoURL:config.localOrigin + "/images/logo-animation-cropped.gif",
  url:config.localOrigin,
  ownedDocuments: computed('sessionAccount.ownedDocuments', function(){
    return this.get('sessionAccount').ownedDocuments;
  }),
  guides:inject(),
  actions: {
    createDoc() {
      const src = this.get('documentService').getDefaultSource();
      const data = {name:"New Project", isPrivate:true, source:src}
      this.get('documentService').makeNewDoc(data).then(() => {
          this.get('onCreateDoc')();
      });
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
    examples() {
      this.get('onExamples')();
    },
    guides() {
      this.get('onGuides')();
    },
    openDoc(doc){
      console.log(doc);
      this.get('openDoc')(doc);
    },
    openGuide(guide){
      console.log(guide);
      this.get('openGuide')(guide);
    }
  }
});
