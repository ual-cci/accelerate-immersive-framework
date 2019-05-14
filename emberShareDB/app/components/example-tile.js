import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import config from  '../config/environment';

import RSVP from 'rsvp';
export default Component.extend({
  example:"",
  isSelected:false,
  store:inject('store'),
  docid:computed('example', function() {
    return this.get('example').docid
  }),
  index: 0,
  thumbnailUrl:computed('example', function() {
    return config.localOrigin + "/images/" + this.get('example').thumbnailId
  }),
  colourId:computed('index', function() {
    return "tile" + this.get('index') % 5;
  }),
  tags:[],
  didReceiveAttrs() {
    this._super(...arguments);
    this.get('store').findRecord('document', this.get('example').docid)
    .then((doc) => {
      console.log(doc.get('data.name'))
      this.set('name',doc.get('data.name'));
      this.set('tags', doc.get('data.tags'));
    });
  },
  actions:{
    onClick() {
      this.get('onClick')(this.get("example"))
    },
    onover() {
      this.set('isSelected', true);
    },
    onout() {
      this.set('isSelected', false);
    }
  }
});
