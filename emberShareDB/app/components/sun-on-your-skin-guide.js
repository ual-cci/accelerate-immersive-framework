import Component from '@ember/component';
import config from  '../config/environment';
export default Component.extend({
  guideUrl:config.localOrigin + '/guides/',
});
