import DS from 'ember-data';

export default DS.Model.extend({
  source:DS.attr('string'),
  owner:DS.attr('string'),
  name:DS.attr('string'),
  created:DS.attr('date'),
  isPrivate:DS.attr('boolean'),
  readOnly:DS.attr('boolean'),
  documentId:DS.attr('string'),
  lastEdited:DS.attr('date'),
  assets:DS.attr(),
  tags:DS.attr(),
  forkedFrom:DS.attr('string'),
  savedVals:DS.attr(),
  newEval:DS.attr('string'),
  stats:DS.attr(),
  flags:DS.attr('number'),
  dontPlay:DS.attr('boolean'),
  children:DS.attr(),
  parent:DS.attr('string')
});
