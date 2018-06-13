import Route from '@ember/routing/route';

export default Route.extend({
  model(params) {
    return this.get('store').findRecord('document', params.documentId);
  },
  activate: function() {
    console.log("entering code-editor");
  },
  deactivate: function() {
    console.log("leaving code-editor");
    this._super();
    this.get('controller').send('cleanUp');
  }
});
