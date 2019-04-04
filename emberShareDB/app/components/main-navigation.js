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
          this.sendAction('onCreateDoc');
      });
    },
    login() {
      this.sendAction('onLogin');
    },
    logout() {
      this.get('session').invalidate();
    },
    docs() {
      this.sendAction('onDocs')
    },
    about() {
      this.sendAction('onAbout')
    },
    gettingStarted() {
      this.sendAction('onGettingStarted')
    },
    examples() {
      this.sendAction('onExamples')
    },
    guides() {
      this.sendAction('onGuides')
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
