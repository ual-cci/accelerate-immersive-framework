import Route from '@ember/routing/route';

export default Route.extend({
  queryParams: {
    showCode: {
      replace:true
    },
    embed: {
      replace:true
    }
  },
  model: function(params) {
    return this.get('store').findRecord('document', params.documentId);
  },
  setupController: function(controller, model){
    this._super(controller, model);
    if(model)
    {
      controller.send('refresh');
    }
  },
  deactivate: function() {
    console.log("leaving code-editor");
    this._super();
    this.get('controller').send('cleanUp');
  },
  actions: {
    error(error, transition) {
      if (error.errors[0].status === '404') {
          this.replaceWith('application');
      } else {
        return true;
      }
    }
  }
});
