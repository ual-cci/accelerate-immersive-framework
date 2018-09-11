import Component from '@ember/component';

export default Component.extend({
  actions: {
    onSelect() {
      this.get('onSelect')(this.get('id'));
    }
  }
});
