
import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  filter: null,
  willDestroyElement(){
    this._super(...arguments);
  },
  didUpdateAttrs() {
    this._super(...arguments);
  },
  didReceiveAttrs() {
    this._super(...arguments);
  },
  actions: {
    onFilter() {
      this.get('onFilter')(this.get('filter'));
    },
  }
});
