import Controller from '@ember/controller';
import config from  '../config/environment';
export default Controller.extend({
  url:config.localOrigin,
});
