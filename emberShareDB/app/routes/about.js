import Route from '@ember/routing/route';

export default Route.extend({
  setupController: function(controller, model){
    this._super(controller, model);
    controller.send('refresh');
  },
});
