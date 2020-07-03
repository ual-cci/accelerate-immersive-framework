let url = "https://mimicproject.com/libs/rapidLib.js"
try {
  importScripts(url);
} catch (err) {
  let url = "http://localhost:4200/libs/rapidLib.js"
  importScripts(url);
}
var options = {}
var rapidLib = RapidLib();
var mySeries = new rapidLib.SeriesClassification();
self.addEventListener('message', function(e) {
  if(e.data.action == "train") {
    //Respond to train msg
    if(mySeries !== undefined)
    {
      console.log(e.data.data)
      mySeries.train(e.data.data);
      console.log("training end in worker")
    }
    self.postMessage("trainingend");
  }
  if(e.data.action == "run") {
    //Respond to run msg
    let c = mySeries.run(e.data.data);
    self.postMessage(c);
  }
}, false);
