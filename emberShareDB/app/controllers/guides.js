import Controller from '@ember/controller';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default Controller.extend({
  topic:"",
  url:config.localOrigin,
  isGuide:computed('model', function() {
    console.log(this.get('model'),this.get('model').length == 1)
    return !Array.isArray(this.get('model'))
  }),
  isMMLL:computed('model', function() {
    console.log(this.get('model'))
    return this.get('model').id == "mmll"
  }),
  isEvolib:computed('model', function() {
    console.log(this.get('model'))
    return this.get('model').id == "evolib"
  }),
  isMaxim:computed('model', function() {
    console.log(this.get('model'))
    return this.get('model').id == "maximJS"
  }),
});
