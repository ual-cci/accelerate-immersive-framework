let recorderLib = document.createElement('script');
recorderLib.type = 'text/javascript';
recorderLib.async = true;
let btn, label;
recorderLib.onload = function(){
  try {
    onRecordLoad()
  } catch (err) {
    setError(err);
  }
};
let origin = document.location.origin
if(origin.includes("file"))
{
  origin = "http://127.0.0.1:4200"
}
recorderLib.src = origin + '/libs/recorder.js';
document.getElementsByTagName('head')[0].appendChild(recorderLib);

const setError = (err)=> {
  //label.innerHTML = err;
}

const initRecorder = (node)=> {
  let recorder;
  console.log("recorderLib onload!");
  const container = document.createElement("div")
  container.style.width = "72px";
  container.style.height = "72px"
  container.style["border-radius"] = "36px"
  container.style["border"] = "5px solid red";
  container.style.margin = "5px";
  btn = document.createElement("BUTTON")
  btn.style.width = "64px";
  btn.style.height = "64px";
  btn.style.top = "10px"
  btn.style.color = "white";
  btn.style["margin-left"] = btn.style["margin-right"] = "auto";
  btn.style["margin-top"] = "4px";
  btn.style.display = "block";
  btn.innerHTML = "Record";
  btn.style["background-color"] = "red";
  btn.style["border-radius"] = "32px";
  const element = document.body;
  container.appendChild(btn);

  label = document.createElement('span');

  container.appendChild(label);
  element.insertBefore(container, element.firstChild);
  //console.log(node)
  try {
    recorder = new Recorder(node);
  } catch(err) {
    setError(err);
    window.node = node;
  }
  let attemptedNode = node;
  btn.onclick = ()=> {
    if(recorder === undefined)
    {
      try {
        recorder = new Recorder(attemptedNode);
      } catch(err) {
        setError(err);
        try {
          recorder = new Recorder(window.node);
        } catch(err) {
          setError(err);
        }
      }
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
