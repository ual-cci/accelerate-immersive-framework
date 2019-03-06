import Controller from '@ember/controller';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default Controller.extend({
  topic:"",
  isGuide:computed('model', function() {
    console.log(this.get('model'),this.get('model').length == 1)
    return !Array.isArray(this.get('model'))
  }),
});
