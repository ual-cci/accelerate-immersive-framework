let url = "https://mimicproject.com/libs/rapidLib.js"
try {
  importScripts(url);
} catch (err) {
  let url = "http://localhost:4200/libs/rapidLib.js"
  importScripts(url);
}
const rapidLib = RapidLib();
const myRegresion = new rapidLib.Regression();
self.addEventListener('message', function(e) {
  if(e.data.action == "train") {
    //Respond to train msg
    myRegresion.train(e.data.data);
    self.postMessage("trainingend");
  }
  if(e.data.action == "run") {
    //Respond to run msg
    let c = myRegresion.run(e.data.data);
    self.postMessage(c);
  }
}, false);
