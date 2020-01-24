importScripts("https://www.doc.gold.ac.uk/eavi/rapidmix/RapidLib.js");
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
