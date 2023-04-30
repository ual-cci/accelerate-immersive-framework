/* global AFRAME, */
AFRAME.registerComponent('random-color', {
  init: function() {
    this.el.setAttribute('material', {
      color: this.getRandomColor()
    })
  },

  getRandomColor: function() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
  }
});
