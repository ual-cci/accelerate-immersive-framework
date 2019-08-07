import Controller from '@ember/controller';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';
import { inject }  from '@ember/service';
export default Controller.extend({
  topic:"",
  cs: inject('console'),
  url:config.localOrigin,
  isGuide:computed('model', function() {
    this.get('cs').log(this.get('model'),Array.isArray(this.get('model')))
    return !Array.isArray(this.get('model'))
  }),
  isRAPIDMIX:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "RAPIDMIX"
  }),
  isMMLL:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "mmll"
  }),
  isEvolib:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "evolib"
  }),
  isMaxim:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "maximJS"
  }),
  isKadenze:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "kadenze"
  }),
});
