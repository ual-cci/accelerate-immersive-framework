import DS from 'ember-data';

const { attr, Model } = DS;

export default Model.extend({
  username: attr('string'),
  password: attr('string'),
  email: attr('string'),
  created: attr('date'),
  account_id: attr('string')
});
