import Component from '@ember/component';

export default Component.extend({
  doPlay:true,
  actions:{
    prev() {
      this.get('onSkip')(true);
    },
    next() {
      this.get('onSkip')(false);
    },
    playOrPause() {
      let button = document.getElementById("ops-play-btn");
      if(this.get('doPlay'))
      {
        this.get('onPlay')();
        $(button).find(".glyphicon").removeClass("glyphicon-play").addClass("glyphicon-pause");
      }
      else
      {
        this.get('onPause')();
        $(button).find(".glyphicon").removeClass("glyphicon-pause").addClass("glyphicon-play");
      }
      this.toggleProperty('doPlay')
    },
    rewind() {
      this.get('onRewind')();
    }
  }
});
