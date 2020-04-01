let url = "https://mimicproject.com/libs/rapidLib.js"
try {
  importScripts(url);
} catch (err) {
  let url = "http://localhost:4200/libs/rapidLib.js"
  importScripts(url);
}
const rapidLib = RapidLib();
const myClassification = new rapidLib.Classification();
self.addEventListener('message', function(e) {
  if(e.data.action == "train") {
    //Respond to train msg
    myClassification.train(e.data.data);
    self.postMessage("trainingend");
  }
  if(e.data.action == "run") {
    //Respond to run msg
    let c = myClassification.run(e.data.data);
    self.postMessage(c);
  }
}, false);
