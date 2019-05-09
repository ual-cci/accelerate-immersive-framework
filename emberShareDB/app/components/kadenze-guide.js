import Component from '@ember/component';
import config from  '../config/environment';

export default Component.extend({
  url:config.localOrigin
});
