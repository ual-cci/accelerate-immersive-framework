import Route from '@ember/routing/route';

export default Route.extend({
  model(params) {
    console.log("code-editor model hook");
    const controller = this.get('controller');
    if(controller)
    {
      controller.send('refresh');
    }
    return this.get('store').findRecord('document', params.documentId);
  },
  activate: function() {
    console.log("entering code-editor");
  },
  deactivate: function() {
    console.log("leaving code-editor");
    this._super();
    this.get('controller').send('cleanUp');
  },
  didTransition() {
   this._super(...arguments)
   console.log("didTransition code-editor");
   //this.get('controller').send('refresh');
 }
});
