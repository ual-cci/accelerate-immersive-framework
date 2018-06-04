import Service, { inject } from '@ember/service';
import config from  '../config/environment';

export default Service.extend({
  requestReset(username) {
    console.log("reset pword for " + username);
    $.ajax({
        type: "POST",
        url: config.serverHost + "/resetPassword",
        data: { username: username }
      });
  }
});
