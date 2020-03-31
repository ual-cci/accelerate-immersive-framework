import Controller from '@ember/controller';
import config from  '../config/environment';
import { inject } from '@ember/service';

export default Controller.extend({
  url:config.localOrigin + "/images",
  docURL:config.localOrigin + "/d/ /0/views",
  termsURL:config.localOrigin + "/terms",
  peopleURL:config.localOrigin + "/people",
  mediaQueries:inject(),
  actions:{
    refresh() {

    }
  }
});
