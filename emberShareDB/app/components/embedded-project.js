import Component from '@ember/component';
import config from  '../config/environment';

export default Component.extend({
  docId:"",
  url:config.localOrigin,
  height:"440px"
});
