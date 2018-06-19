import { inject } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
export default Component.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  store: inject('store'),
  ownedDocuments: Ember.computed('sessionAccount.ownedDocuments', function(){
    return this.get('sessionAccount').ownedDocuments;
  }),
  actions: {
    login() {
      this.sendAction('onLogin');
    },
    logout() {
      this.get('session').invalidate();
    },
    home() {
      this.sendAction('onHome')
    },
    openDoc(doc){
      console.log(doc);
      this.get('openDoc')(doc);
    }
  }
});
