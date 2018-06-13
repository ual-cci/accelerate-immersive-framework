import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';

export default Service.extend({
  sessionAccount:inject('session-account'),
  store:inject('store'),
  deleteAsset(fileId) {
    console.log("deleteAsset for " + fileId);
    let doc = this.get('sessionAccount').currentDoc;
    let data = {documentId:doc};
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "DELETE",
          url: config.serverHost + "/asset/"+fileId,
          data: data
        }).then((res) => {
          console.log("success",res);
          resolve();
        }).catch((err) => {
          console.log("error",err);
          reject(err);
        });
    });
  },
  preloadAssets(assets) {
    console.log("getting assets");
    let ctr = assets.length;
    return new RSVP.Promise((resolve, reject) => {
      for(var i = 0; i < assets.length; i++)
      {
        const fileId = assets[i].fileId;
        const fileName = assets[i].name;
        const fileType = assets[i].fileType;
        console.log("fetching asset:"+fileId);
        var xhr = new XMLHttpRequest();
        var url = config.serverHost + "/asset/"+fileId;
        xhr.onload = () => {
          if (xhr.readyState == 4 && xhr.status == 200) {
            this.get('store').push({
              data:[{
                id:fileId,
                type:"asset",
                attributes:{
                  fileId:fileId,
                  name:fileName,
                  b64data:this.b64e(xhr.responseText),
                  type:fileType
                }
              }]
            });
            ctr--;
            if(ctr == 0)
            {
              resolve();
            }
          }
        };
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
        xhr.open("GET", url, true);
        xhr.send(null);
      }
    });
  },
  b64e: function (str) {
    // from this SO question
    // http://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de
      let CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let out = "", i = 0, len = str.length, c1, c2, c3;
      while (i < len) {
          c1 = str.charCodeAt(i++) & 0xff;
          if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt((c1 & 0x3) << 4);
              out += "==";
              break;
          }
          c2 = str.charCodeAt(i++);
          if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
              out += CHARS.charAt((c2 & 0xF) << 2);
              out += "=";
              break;
          }
          c3 = str.charCodeAt(i++);
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
          out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
          out += CHARS.charAt(c3 & 0x3F);
      }
      return out;
  },
});
