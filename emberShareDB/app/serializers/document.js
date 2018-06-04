import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  keyForAttribute(attr) {
    if(attr == 'document-Id')
      return 'documentId';
    else
    {
      return attr;
    }
  }
});
