import { inject } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import config from  '../config/environment';
export default Component.extend({
  session: inject('session'),
  mediaQueries:inject(),
  sessionAccount: inject('session-account'),
  store: inject('store'),
  logoURL:config.localOrigin + "/images/logo-animation-cropped.gif",
  ownedDocuments: computed('sessionAccount.ownedDocuments', function(){
    return this.get('sessionAccount').ownedDocuments;
  }),
  guides:[
    {id:"mmll", name:"Musical Machine Listening with MMLL.js"},
    {id:"maximJS", name:"Making Music in the Browser with maximJS"}
  ],
  actions: {
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
