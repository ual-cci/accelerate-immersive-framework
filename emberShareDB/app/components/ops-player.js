import Component from '@ember/component';

export default Component.extend({
  isPlaying:false,
  init() {
    this._super(...arguments);
    console.log("init op player", this.get('isPlaying'))
  },
  didUpdateAttrs() {
    this._super(...arguments);
    console.log("did upate op player", this.get('isPlaying'))
  },
  actions:{
    prev() {
      this.get('onSkip')(true);
    },
    next() {
      this.get('onSkip')(false);
    },
    play() {
      if(!this.get('isPlaying'))
      {
        this.get('onPlay')();
      }
    },
    pause() {
      if(this.get('isPlaying'))
      {
        this.get('onPause')();
      }
    },
    rewind() {
      this.get('onRewind')();
    }
  }
});
