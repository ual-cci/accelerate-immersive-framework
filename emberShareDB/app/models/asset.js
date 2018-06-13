import DS from 'ember-data';
const { attr, Model } = DS;

export default DS.Model.extend({
  type: attr('string'),
  fileId: attr('string'),
  size: attr('string'),
  b64data: attr('string'),
  name: attr('string')
});
