import Component from '@ember/component';
import config from  '../config/environment';
export default Component.extend({
  url:config.localOrigin + "/images/",
  guideUrl:config.localOrigin + "/guides/",
  exampleUrl:config.localOrigin + "/examples/",
});
