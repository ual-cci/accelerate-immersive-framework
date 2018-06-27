import DS from 'ember-data';
const { attr } = DS;

export default DS.Model.extend({
  fileType: attr('string'),
  fileId: attr('string'),
  size: attr('string'),
  b64data: attr('string'),
  name: attr('string')
});
