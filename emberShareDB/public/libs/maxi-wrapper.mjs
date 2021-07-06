
// import {
//   Engine,
//   Learner,
// } from "http://localhost:4200/libs/sema-engine.mjs";
// const origin = "http://localhost:4200/libs";
import {
  Engine,
  Learner,
} from "https://mimicproject.com/libs/sema-engine.mjs";
const origin = "https://mimicproject.com/libs";

export let maxi;
let dspCode = "";
maxi = new Engine();
await maxi.init(origin);
maxi.play();
let learner = new Learner();
maxi.addLearner('l1', learner);
dspCode = {
setup: `() => {
	let q=this.newq();
  let createDSPLoop = ()=> {
    return ()=>{return 0}
  }
  q.play = createDSPLoop();
  return q;
}`,
loop: `(q, inputs, mem) => {this.dacOutAll(q.play());}`
}

function sabPrinter() {
  try {
    for (let v in maxi.sharedArrayBuffers) {
      let avail = maxi.sharedArrayBuffers[v].rb.available_read();
      if ( avail > 0 && avail != maxi.sharedArrayBuffers[v].rb.capacity) {
        for (let i = 0; i < avail; i += maxi.sharedArrayBuffers[v].blocksize) {
          let elements = new Float64Array(maxi.sharedArrayBuffers[v].blocksize);
          let val = engine.sharedArrayBuffers[v].rb.pop(elements);
          console.log(v,elements);
        }
      }
    }
    setTimeout(sabPrinter, 100);
  } catch (error) {
    // console.log(error);
    setTimeout(sabPrinter, 100);
  }
}
sabPrinter()

maxi.makeSender = (id)=> {

}

maxi.sendData = (id, data)=> {
  if(maxi.sharedArrayBuffers[id] === undefined) {
    maxi.createSharedBuffer(id, "ML", data.length);
    console.log(maxi.sharedArrayBuffers)
  }
  maxi.pushDataToSharedBuffer(id, data);
}

maxi.updateCode = (tag)=>{
  let fromTag = document.getElementById(tag).innerHTML;
  const code = `()=>{
    let q = this.newq();
    let createDSPLoop = ()=> {` +
      fromTag +
    ` return play;
    }
    q.play = createDSPLoop();
    return q;
  }`
  console.log(code)
  dspCode.setup = code;
  maxi.eval(dspCode);
}
