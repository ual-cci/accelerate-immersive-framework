import Component from '@ember/component';
import { computed } from '@ember/object';
export default Component.extend({
  didReceiveAttrs() {
    this._super(...arguments);
    const tabid ="tab" + (this.get('tabIndex')+1) % 4;
    this.set('tabID', tabid)
  },
  actions: {
    onSelect() {
      console.log("tab item selected", this.get('id'))
      this.get('onSelect')(this.get('id'));
    },
    onDelete() {
      this.get('onDelete')(this.get('id'));
    }
  }
});
