
import {
  Engine,
  Learner,
} from "./index.mjs";

import RingBuffer from "./ringbuf.js";

//const origin = "https://mimicproject.com/libs";
const origin = "http://localhost:4200/libs";
var head = document.getElementsByTagName('HEAD')[0];
var meta = document.createElement('meta');
meta.httpEquiv = "origin-trial";
meta.content = "AipZcFrgMg9ylKLo57EBO0tGMBmsXqFLzwuJJP20GXbHuST7hB1MuUjHX8j3+wbFQot8LyYvaDmS1rONKHvSzwwAAAB6eyJvcmlnaW4iOiJodHRwczovL21pbWljcHJvamVjdC5jb206NDQzIiwiZmVhdHVyZSI6IlVucmVzdHJpY3RlZFNoYXJlZEFycmF5QnVmZmVyIiwiZXhwaXJ5IjoxNjM5NTI2Mzk5LCJpc1N1YmRvbWFpbiI6dHJ1ZX0=";
head.appendChild(meta);

export let maxi;
let dspCode = "";
maxi = new Engine();
await maxi.init(origin);
maxi.play();
let learner = new Learner();
maxi.addLearner('l1', learner);
maxi.addSample = (name, url)=> {
  maxi.loadSample(name + "----", url, true)
}
//What happens is we do a dacOut on the play function
dspCode = {
  setup: `() => {
    let q=this.newq();
    let createDSPLoop = ()=> {
      return ()=>{return 0}
    }
    q.play = createDSPLoop();
    return q;
  }`,
  loop: `(q, inputs, mem) => {
    var sig = q.play();
    if(Array.isArray(sig)) {
      for(let i = 0; i < sig.length; i++) {
        this.dacOut(sig[i], i);
      }
    } else {
      this.dacOutAll(q.play());
    }
  }`
}

// dspCode = {
//   setup: `() => {let q=this.newq();  q.b0u10 = new Module.maxiSample();\n                      q.b0u10.setSample(this.getSampleBuffer('kick1'));; ;; return q;}`,
//   loop: `(q, inputs, mem) => {this.dacOutAll((q.b0u10.isReady() ? q.b0u10.playOnZX(1) : 0.0));}`
// }
//
// setTimeout(()=>{maxi.eval(dspCode)},2000);




maxi.addEventListener('onSharedBuffer', (e) => {
    console.log(e)
    let ringbuf = new RingBuffer(e.sab, Float64Array);
    maxi.sharedArrayBuffers[e.channelID] = {
      sab: e.sab,
      rb: ringbuf,
      blocksize:e.blocksize
    };
});

function sabPrinter() {
  try {
    for (let v in maxi.sharedArrayBuffers) {
      let avail = maxi.sharedArrayBuffers[v].rb.available_read();
      if ( avail > 0 && avail != maxi.sharedArrayBuffers[v].rb.capacity) {
        for (let i = 0; i < avail; i += maxi.sharedArrayBuffers[v].blocksize) {
          let elements = new Float64Array(maxi.sharedArrayBuffers[v].blocksize);
          let val = maxi.sharedArrayBuffers[v].rb.pop(elements);
          if(maxi.onInput) {
            maxi.onInput(v,elements)
          }
        }
      }
    }
    setTimeout(sabPrinter, 20);
  } catch (error) {
    setTimeout(sabPrinter, 20);
  }
}
sabPrinter()

maxi.send = (id, data)=> {
  if(maxi.sharedArrayBuffers[id] === undefined) {
    maxi.createSharedBuffer(id, "ML", data.length);
    console.log(maxi.sharedArrayBuffers)
  }
  maxi.pushDataToSharedBuffer(id, data);
}

maxi.setAudioCode = async (location)=>{

  const executeCode = (userCode)=> {
    userCode = userCode.replace(/Maximilian/g, "Module");
    const code = `()=>{
      let q = this.newq();
      let createDSPLoop = ()=> {` +
        userCode +
      ` return play;
      }
      q.play = createDSPLoop();
      return q;
    }`
    console.log(code)
    dspCode.setup = code;
    //with newer versions of the sema-engine.js, there needs to be a delay
    //Between making the engine and updating the code. (13/7/21)
    setTimeout(()=>{maxi.eval(dspCode)},200);
  }
  //Try script element
  let scriptElement = document.getElementById(location)
  if(scriptElement)
  {
    executeCode(scriptElement.innerHTML)
  }
  else
  {
    //Else try url
    let response = await fetch(location);
    if (response.ok) {
      let text = await response.text();
      executeCode(text)
    } else {
      //Else use string literal
      console.log("HTTP-Error: " + response.status);
      executeCode(location)
    }
  }
}
