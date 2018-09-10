import Component from '@ember/component';

export default Component.extend({
  didReceiveAttrs() {
    this._super(...arguments);
    console.log("TAB:", this.get('name'));
  },
  actions: {
    onSelect() {
      this.get('onSelect')(this.get('id'));
    }
  }
});
