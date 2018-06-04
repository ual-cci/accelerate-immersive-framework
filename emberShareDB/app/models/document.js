import DS from 'ember-data';

export default DS.Model.extend({
  source:DS.attr('string'),
  owner:DS.attr('string'),
  name:DS.attr('string'),
  created:DS.attr('date'),
  public:DS.attr('boolean')
});
