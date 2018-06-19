import Route from '@ember/routing/route';

export default Route.extend({
  model(params) {
    console.log("code-editor model hook");

    return this.get('store').findRecord('document', params.documentId);
  },
  setupController: function(controller, model){
    this._super(controller, model);
    if(controller)
    {
      controller.send('refresh');
    }
  },
  afterModel() {
    this._super();
    console.log("code-editor aftermodel hook");
  },
  activate: function() {
    this._super();
    console.log("entering code-editor");
  },
  deactivate: function() {
    console.log("leaving code-editor");
    this._super();
    this.get('controller').send('cleanUp');
  },
});
