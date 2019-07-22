import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject }  from '@ember/service';

export default Component.extend({
  cs: inject('console'),
  didReceiveAttrs() {
    this._super(...arguments);
    const tabid ="tab" + (this.get('tabIndex')+1) % 5;
    this.set('tabID', tabid)
  },
  actions: {
    onSelect() {
      this.get('cs').log("tab item selected", this.get('id'))
      this.get('onSelect')(this.get('id'));
    },
    onDelete() {
      this.get('onDelete')(this.get('id'));
    }
  }
});
