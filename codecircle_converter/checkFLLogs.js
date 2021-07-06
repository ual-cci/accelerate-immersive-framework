var http = require('http');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const USER_NAME = "api-user"
const PASSWORD = "itsasecurepassword"
const MIMIC_API_URL = "https://mimic-238710.appspot.com";
const fs = require('fs')
const DATA_PATH = "flData.json"

//const MIMIC_API_URL = "http://localhost:8080"
// const USER_NAME = "louis-dev"
// const PASSWORD = "123"
let token = "";

var getToken = ()=> {
  return new Promise((resolve, reject)=> {
    var tokenHTTP = new XMLHttpRequest();
    var data = 'client_id=application&'+
    'client_secret=secret&' +
    'grant_type=password&'+
    'username='+USER_NAME+'&'+
    'password='+PASSWORD
    tokenHTTP.onreadystatechange = ()=> {
        if (tokenHTTP.readyState == 4 && tokenHTTP.status == 200)
        {
          token =  JSON.parse(tokenHTTP.responseText).access_token
          console.log("success token", token)
          resolve()
        }
    }
    tokenHTTP.onerror = (err)=> {
      console.log("ERROR", err)
    }
    tokenHTTP.open("POST", MIMIC_API_URL + "/oauth/token", true);
    tokenHTTP.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    tokenHTTP.send(data);
  })
}

const ids = [
  "ba532449-be46-2d30-70c4-1317839eadcf",
  "604160d7-316e-58dd-219c-ec910f4fa2e4",
  "ce1c782f-2e17-7b10-3857-a51f85cb81d8"
]

getToken().then(()=>{
  let res = ids.map((id)=>{return getLogs(id)})
  Promise.all(res).then((all_res)=> {
    all_res = [].concat.apply([], all_res);
    fs.writeFileSync(DATA_PATH, JSON.stringify(all_res))
  })
});


//MFCCS
let DOC_ID = "ba532449-be46-2d30-70c4-1317839eadcf";
//Video
DOC_ID = "604160d7-316e-58dd-219c-ec910f4fa2e4";
////mouse
//DOC_ID = "ce1c782f-2e17-7b10-3857-a51f85cb81d8";

var getLogs = (docId)=> {
  console.log("getting logs for " docId)
  return new Promise((resolve, reject)=> {
    var logHTTP = new XMLHttpRequest();
    logHTTP.onreadystatechange = async ()=> {
      if (logHTTP.readyState == 4 && logHTTP.status == 200)
      {
        //console.log("log success", logHTTP.responseText)
        ops = JSON.parse(logHTTP.responseText).data
        let data = []
        ops.forEach((op)=> {
          if(op.op !== undefined)
          {
            if(op.op[0].p[0] === "stats" && op.op[0].oi[0] === "fl_stats") {
              const stats = op.op[0].oi[1];
              data.push(JSON.parse(stats))
              console.log(JSON.parse(stats))
            }
          }
        })
        resolve(data)
      }
    }
    logHTTP.open("GET", MIMIC_API_URL + '/documents/ops/' + docId , true);
    logHTTP.setRequestHeader("Content-Type", "application/json");
    logHTTP.setRequestHeader('Authorization', 'Bearer ' + token);
    logHTTP.send();
  })

}
