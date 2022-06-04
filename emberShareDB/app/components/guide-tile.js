import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import config from  '../config/environment';

import RSVP from 'rsvp';
export default Component.extend({
  guide:'',
  description:computed('guide', function() {
    return this.get('guide').desc
  }),
  name:computed('guide', function() {
    return this.get('guide').name
  }),
  author:computed('guide', function() {
    return this.get('guide').author
  }),
  isSelected:false,
  store:inject('store'),
  index: 0,
  colourId:computed('index', function() {
    return 'tile' + this.get('index') % 5;
  }),
  actions:{
    onClick() {
      this.get('onClick')(this.get('guide'))
    },
    onover() {
      this.set('isSelected', true);
    },
    onout() {
      this.set('isSelected', false);
    }
  }
});
