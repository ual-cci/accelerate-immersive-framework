import Controller from '@ember/controller';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';
import { inject }  from '@ember/service';
export default Controller.extend({
  topic:"",
  cs: inject('console'),
  url:config.localOrigin,
  isExample:computed('model', function() {
    this.get('cs').log("isExample", this.get('model'),Array.isArray(this.get('model')))
    return !Array.isArray(this.get('model'))
  }),
  isMagnet:computed('model', function() {
    this.get('cs').log("example model", this.get('model'))
    return this.get('model').id == "magnet"
  }),
  isBBcut:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "bbcut"
  }),
  isEvolib:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "evolib"
  }),
  isMario:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "mario"
  }),
  isMerk:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "merk"
  }),
  isMarkov:computed('model', function() {
    this.get('cs').log(this.get('model'))
    return this.get('model').id == "markov"
  }),
  isAudiotrig:computed('model', function() {
    return this.get('model').id == "audio-trigger"
  }),
  isFace:computed('model', function() {
    return this.get('model').id == "facesynth"
  }),
  isRhythm:computed('model', function() {
    return this.get('model').id == "rhythm-remixer"
  }),
  isConceptular:computed('model', function() {
    return this.get('model').id == "conceptular"
  }),
  isSpec:computed('model', function() {
    return this.get('model').id == "specdelay"
  }),
  isLyric:computed('model', function() {
    return this.get('model').id == "lyrics"
  }),
  actions: {
    onClick(example) {
      this.transitionToRoute('examples', example.id)
    }
  }
});
