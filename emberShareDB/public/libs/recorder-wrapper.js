let recorderLib = document.createElement('script');
recorderLib.type = 'text/javascript';
recorderLib.async = true;
recorderLib.onload = function(){
  console.log("recorderLib onload!");
  onRecordLoad();
};
let origin = document.location.origin
if(origin.includes("file"))
{
  origin = "http://127.0.0.1:4200"
}
recorderLib.src = origin + '/libs/recorder.js';
document.getElementsByTagName('head')[0].appendChild(recorderLib);
const initRecorder = (node, element)=> {
  var recorder = new Recorder(node);
  const btn = document.createElement("BUTTON")
  btn.innerHTML = "Record";
  if(!element)
  {
    element = document.body;
  }
  element.insertBefore(btn, element.firstChild);
  btn.onclick = ()=> {
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
