let url = "https://mimicproject.com/libs/rapidLib.js"
try {
  importScripts(url);
} catch (err) {
  let url = "http://localhost:4200/libs/rapidLib.js"
  importScripts(url);
}
const rapidLib = RapidLib();
let myClassification = new rapidLib.Classification();
function setOptions() {
  if(myRegression !== undefined)
  {
    console.log("setting options")
    if(options.k !== undefined)
    {
      myRegression.setK(options.k)
    }
  }
}
self.addEventListener('message', function(e) {
  if(e.data.action == "train") {
    //Respond to train msg
    rapidLib = RapidLib();
    myClassification = new rapidLib.Regression();
    setOptions()
    self.postMessage("trainingend");
  }
  if(e.data.action == "options") {
    //Respond to train msg
    let options = e.data.data
    setOptions()
  }
  if(e.data.action == "run") {
    //Respond to run msg
    let c = myClassification.run(e.data.data);
    self.postMessage(c);
  }
}, false);
