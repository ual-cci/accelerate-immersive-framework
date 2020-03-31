import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import config from  '../config/environment';

export default Component.extend({
  isSelected:false,
  store:inject('store'),
  index: 0,
  svgClass:"shape-svg people-shape-svg",
  colourId:computed('index', function() {
    return "tile" + this.get('index') % 5;
  }),
  actions:{
    onClick() {
      window.open(this.get("person.personalURL"))
    },
    onover() {
      this.set('isSelected', true);
    },
    onout() {
      this.set('isSelected', false);
    }
  }
});
