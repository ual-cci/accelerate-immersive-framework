import Component from '@ember/component';

export default Component.extend({
  actions:{
    prev() {
      this.get('onSkip')(true);
    },
    next() {
      this.get('onSkip')(false);
    },
    play() {
      this.get('onPlay')();
    },
    rewind() {
      this.get('onRewind')();
    }
  }
});
