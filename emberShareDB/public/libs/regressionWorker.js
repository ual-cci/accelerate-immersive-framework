importScripts("https://www.doc.gold.ac.uk/eavi/rapidmix/RapidLib.js");
const rapidLib = RapidLib();
const myRegresion = new rapidLib.Regression();
self.addEventListener('message', function(e) {
  if(e.data.action == "train") {
    //Respond to train msg
    myRegresion.train(e.data.data);
  }
  if(e.data.action == "run") {
    //Respond to run msg
    let c = myRegresion.run(e.data.data);
    self.postMessage(c);
  }
}, false);
