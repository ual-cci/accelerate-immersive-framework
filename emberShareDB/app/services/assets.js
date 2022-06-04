import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';
import { isEmpty } from '@ember/utils';
import { bind } from '@ember/runloop';

export default Service.extend({
  sessionAccount:inject('session-account'),
  store:inject('store'),
  cs:inject('console'),
  deleteAsset(fileName, doc = this.get('sessionAccount').currentDoc) {
    this.get('cs').log('deleteAsset for ' + fileName);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: 'DELETE',
          url: config.serverHost + '/asset/'+doc+'/'+fileName,
          headers: {'Authorization': 'Bearer ' + this.get('sessionAccount.bearerToken')}
        }).then(bind((res) => {
          this.get('cs').log('success deleting asset');
          resolve();
        })).catch(bind((err) => {
          this.get('cs').log('error',err);
          reject(err);
        }));
    });
  },
  isMedia: function(fileType)
  {
    return (fileType.includes('audio') ||
    fileType.includes('image') ||
    fileType.includes('video'))
  },
  //Dont base64 big files
  isTooBig: function(fileSize)
  {
    return fileSize > 1800000;
  },
  fetchAsset: async function(asset, docId) {
    return new RSVP.Promise((resolve, reject) => {
      const fileId = asset.fileId;
      const fileName = asset.name;
      const fileType = asset.fileType;
      const inStoreAsset = this.get('store').peekRecord('asset',fileId);
      this.get('cs').log('asset', asset)
      if(!isEmpty(inStoreAsset) && !isEmpty(inStoreAsset.b64data))
      {
          this.get('cs').log('asset already preloaded:'+fileId);
          resolve();
          return;
      }
      var xhr = new XMLHttpRequest();
      var url = config.serverHost + '/asset/'+docId+'/'+fileName;
      this.get('cs').log('fetching asset: '+asset+' from ' + url);
      xhr.onload = () => {
        this.get('cs').log(xhr.readyState, xhr.status == 200);
        if (xhr.readyState == 4 && xhr.status == 200) {
          this.get('cs').log('fetched asset:'+fileId);
          this.get('store').push({
            data:[{
              id:fileId,
              type:'asset',
              attributes:{
                size:asset.size,
                fileId:fileId,
                name:fileName,
                b64data:this._b64e(xhr.responseText),
                fileType:fileType
              }
            }]
          });
          resolve();
        }
      };
      xhr.onerror = () => {
        this.get('cs').log('error fetching/converting asset:'+fileId);
        reject('error fetching/converting asset:'+fileId);
      };
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
      xhr.open('GET', url, true);
      xhr.send(null);
    })

  },
  preloadAssets(assets, docId) {
    this.get('cs').log('preloadAssets:'+assets);
    return new RSVP.Promise((resolve, reject) => {
      const getAllASync = async (c) => {
        for(const a of assets) {
          if(this.isMedia(a.fileType))
          {
            await this.fetchAsset(a, docId).catch((err)=> {
              this.get('cs').log('ERROR IN FETCHING ASSET')
              reject(err)
              return
            });
          }
        }
        resolve();
      };
      getAllASync();
    })
  },
  _b64e(str) {
    this.get('cs').log('converting to base64');
    // from this SO question
    // http://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de
      let CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let out = '', i = 0, len = str.length, c1, c2, c3;
      while (i < len) {
          c1 = str.charCodeAt(i++) & 0xff;
          if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt((c1 & 0x3) << 4);
              out += '==';
              break;
          }
          c2 = str.charCodeAt(i++);
          if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
              out += CHARS.charAt((c2 & 0xF) << 2);
              out += '=';
              break;
          }
          c3 = str.charCodeAt(i++);
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
          out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
          out += CHARS.charAt(c3 & 0x3F);
      }
      this.get('cs').log('converted to b64e')
      return out;
  },
});
