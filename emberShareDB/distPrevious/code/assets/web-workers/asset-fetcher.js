
self.addEventListener('message', function(e) {
  var data = e.data;
  var port = e.ports[0];
  console.log("here", data);
  // Do your stuff here.
  if (port) {
    // Message sended throught a worker created with 'open' method.
    port.postMessage({ foo: 'foo' });
  } else {
    // Message sended throught a worker created with 'send' or 'on' method.
    preloadAssets(data.assets, function() {
      postMessage({ bar: 'bar' });
    });

  }
}, false);

// Ping the Ember service to say that everything is ok.
postMessage(true);

var _fetchAsset = function(asset, ctr, callback) {
  console.log("fetch function",asset);
  const fileId = asset.fileId;
  const fileName = asset.name;
  const fileType = asset.fileType;
  // const inStoreAsset = this.get('store').peekRecord('asset',fileId);
  // if(!isEmpty(inStoreAsset) && !isEmpty(inStoreAsset.b64data))
  // {
  //     console.log("asset already preloaded:"+fileId);
  //     callback(ctr);
  //     return;
  // }
  var xhr = new XMLHttpRequest();
  var url = "http://localhost:8080" + "/asset/"+fileId;
  console.log(url);
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log("fetched asset:"+fileId);
      var data = {data:[{
          id:fileId,
          type:"asset",
          attributes:{
            fileId:fileId,
            name:fileName,
            b64data:_b64e(xhr.responseText),
            type:fileType
          }
        }]
      };
      callback(ctr, data);
    }
  };
  xhr.onerror = () => {
    console.log("error fetching/converting asset:"+fileId);
    callback(ctr, null);
  };
  xhr.overrideMimeType("text/plain; charset=x-user-defined");
  xhr.open("GET", url, true);
  console.log("fetching asset:"+fileId);
  xhr.send(null);
};

var preloadAssets = function(assets, finalCallback) {
  console.log("preloading assets:",assets);
  var ctr = 0;
  var loaded = [];
  var callback = (newCtr, data) => {
    newCtr++;
    loaded.push(data);
    console.log("callback",newCtr);
    if(newCtr == assets.length)
    {
      finalCallback();
    }
    else
    {
      _fetchAsset(assets[newCtr], newCtr, callback);
    }
  }
  console.log("preloading asset:",assets[ctr]);
  _fetchAsset(assets[ctr], ctr, callback);
};

var _b64e = function (str) {
  console.log("converting to base64");
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
};
