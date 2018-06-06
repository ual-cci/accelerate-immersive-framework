import { inject } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  actions: {
    login() {
      this.sendAction('onLogin');
    },
    logout() {
      this.get('session').invalidate();
    },
    home() {
      this.sendAction('onHome')
    }
  }
});
