import Route from '@ember/routing/route';
import config from  '../config/environment';

export default Route.extend({
  endpoint:'',
  model: function(params) {
    this.set('endpoint', params.endpoint)
    return params.endpoint;
  },
  redirect: function() {
    window.location = config.serverHost + "/" + this.get('endpoint');
  }
});
