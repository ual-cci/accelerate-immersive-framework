let recorderLib = document.createElement('script');
recorderLib.type = 'text/javascript';
recorderLib.async = true;
let btn;
recorderLib.onload = function(){
  try {
    onRecordLoad()
  } catch (err) {
    console.log(err)
  }
};
let origin = document.location.origin
if(origin.includes("file"))
{
  origin = "http://127.0.0.1:4200"
}
recorderLib.src = origin + '/libs/recorder.js';
document.getElementsByTagName('head')[0].appendChild(recorderLib);

const initRecorder = (node)=> {
  let recorder;
  console.log("recorderLib onload!");
  const container = document.createElement("div")
  container.style.width = "97%";
  container.style.height = "30px"
  container.style["border"] = "5px solid black";
  container.style["padding-top"]= "10px"
  container.style["padding-bottom"]= "10px"
  btn = document.createElement("BUTTON")
  btn.style.width = "100px";
  btn.style.height = "30px";
  btn.style.margin = "auto"
  btn.style.display = "block";
  btn.style.top = "10px"
  btn.innerHTML = "Record";
  const element = document.body;
  container.appendChild(btn);
  element.insertBefore(container, element.firstChild);
  try {
    recorder = new Recorder(node);
  } catch(err) {
    console.log(err);
  }
  btn.onclick = ()=> {
    if(recorder === undefined)
    {
      recorder = new Recorder(window.node);
    }
    if(recorder.recording)
    {
      recorder.stop();
      btn.innerHTML = "Record";
      download()
    }
    else
    {
      recorder.record();
      btn.innerHTML = "Stop";
    }
  }

  const download = ()=> {

  recorder.exportWAV((blob)=> {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = 'output.wav';
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

}
