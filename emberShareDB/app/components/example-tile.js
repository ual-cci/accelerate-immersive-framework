import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import config from  '../config/environment';

import RSVP from 'rsvp';
export default Component.extend({
  example:"",
  store:inject('store'),
  docid:computed('example', function() {
    return this.get('example').docid
  }),
  thumbnailUrl:computed('example', function() {
    return config.localOrigin + "/images/" + this.get('example').thumbnailId
  }),
  didReceiveAttrs() {
    this._super(...arguments);
    this.get('store').findRecord('document', this.get('example').docid)
    .then((doc) => {
      console.log(doc.data.name)
      this.set('name',doc.data.name);
    });
  },
  actions:{
    onClick() {
      this.get('onClick')(this.get("example"))
    }
  }
});
