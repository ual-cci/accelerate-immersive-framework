let audioContext;
let synths = [];
let voices = 1;
let synthElement;
let customProcessorName = 'maxi-processor';

class MaxiSynth {

  constructor(audioContext, customProcessorName) {
    this.context = audioContext;
    this.node = new AudioWorkletNode(audioContext, customProcessorName);
    this.node.onprocessorerror = event => {
      console.log(`MaxiProcessor Error detected: ` + event.data);
    }
    this.node.onprocessorstatechange = event => {
      console.log(`MaxiProcessor state change detected: ` + audioWorkletNode.processorState);
    }
    this.node.port.onmessage = event => {
      console.log(`Message from processor: ` + event.data);
    };
    this.node.port.onmessageerror = event => {
      console.log(`Error message from port: ` + event.data);
    };
    this.node.connect(audioContext.destination);
    this.mapped = [];
    this.outputGUI = [];
    this.parameters = [
      "frequency", "frequency2", "attack", "decay", "sustain", "release",
      "lfoFrequency", "lfoPitchMod", "lfoFilterMod", "lfoAmpMod", "adsrAmpMod",
      "adsrPitchMod", "adsrFilterMod", "cutoff", "Q"
    ];
    this.scale = {
      "frequency":{scale:1000, translate:0},
      "frequency2":{scale:1000, translate:0},
      "attack":{scale:1500, translate:0},
      "decay":{scale:1500, translate:0},
      "sustain":{scale:1, translate:0},
      "release":{scale:1500, translate:0},
      "lfoFrequency":{scale:10, translate:0},
      "lfoPitchMod":{scale:1000, translate:0},
      "lfoFilterMod":{scale:8000, translate:0},
      "lfoAmpMod":{scale:1, translate:0},
      "adsrAmpMod":{scale:1, translate:0},
      "adsrPitchMod":{scale:1000, translate:0},
      "adsrFilterMod":{scale:1, translate:0},
      "cutoff":{scale:2000, translate:40},
      "Q":{scale:2, translate:0}
    };
  }

  addGUI(element) {
    const rowLength = 4;
    const title = document.createElement('p');
    title.innerHTML = "MaxiSynth";
    title.style.fontSize = "10pt";
    title.style.margin = "3pt";
    element.appendChild(title);
    const table = document.createElement("TABLE");
    element.appendChild(table);
    let row;
    table.style.border = "1px solid black"
    for(let i = 0; i < this.parameters.length; i++)
    {
      let p = this.parameters[i];
      if(i % rowLength === 0)
      {
        row = table.insertRow();
      }
      const cell = row.insertCell();
      cell.classList.add("cell_" + p);
      cell.style.border = "1px solid black";
      let val = this.node.parameters.get(p).defaultValue;
      val = (val - this.scale[p].translate) / this.scale[p].scale;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 1;
      slider.step = 0.01;
      slider.value = val;
      this.outputGUI[p] = slider;
      slider.onchange = ()=> {
      	this.onGUIChange(slider.value, i);
   	  }
      cell.appendChild(slider);
      const label = document.createElement('p');
      label.innerHTML = p;
      label.style.width = "100px";
      label.style.fontSize = "8pt";
      label.style.margin = "2px";
      cell.appendChild(label);
    }
  }

  onGUIChange(val, index) {
    this.onChange(val, this.parameters[index]);
  }

  onMLChange(val, index) {
    this.outputGUI[this.mapped[index]].value = val;
    this.onChange(val, this.mapped[index]);
  }

  onChange(val, key) {
    const scaled = (this.scale[key].scale * val) + this.scale[key].translate;
    const param = this.node.parameters.get(key);
    if(param)
    {
      param.setValueAtTime(scaled, this.context.currentTime)
    }
  }

  getMappedParameters() {
    let vals = [];
    this.mapped.forEach((key)=> {
      vals.push(this.outputGUI[key].value);
    })
    return vals;
  }

  setOsc(osc) {
    const param = this.node.parameters.get("oscFn");
    if(param)
    {
      param.setValueAtTime(osc, this.context.currentTime)
    }
  }

  setPoly(p) {
    const param = this.node.parameters.get("poly");
    if(param)
    {
      param.setValueAtTime(p ? 1 : 0, this.context.currentTime)
    }
    const vis = p ? "hidden" : "visible"
    let elem = document.getElementsByClassName("cell_frequency");
    for (let e of elem) {
      e.style.visibility = vis;
    };
    elem = document.getElementsByClassName("cell_frequency2");
    for (let e of elem) {
      e.style.visibility = vis;
    };
  }

  noteon(freq = 1) {
    this.node.port.postMessage({noteon:freq});
  }

  noteoff(freq = 1) {
    this.node.port.postMessage({noteoff:freq});
  }

  setSequence(seq, len) {
    //Look for notes with dur property and add corresponding note off
    let toAdd = [];
    for(let i = 0; i < seq.length; i++)
    {
      if(seq[i].dur)
      {
        toAdd.push({cmd:"noteoff", t:seq[i].t + seq[i].dur, f:seq[i].f});
      }
    }
    seq = seq.concat(toAdd);
    //Sort by time
    seq.sort((a, b)=> {
      return a.t - b.t;
    });
    this.node.port.postMessage({sequence:seq});
    if(len)
    {
      this.node.port.postMessage({length:len});
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setButtonEventHandlers();
});

function setButtonEventHandlers() {
  const playButton = document.getElementById('playButton');
  playButton.addEventListener("click", () =>  playAudio());

  const stopButton = document.getElementById('stopButton');
  stopButton.addEventListener("click", () => stopAudio());
}

function playAudio() {
  console.log("play audio");
  if (audioContext === undefined) {
    try {
      audioContext = new AudioContext();
      console.log("adding module");
      audioContext.audioWorklet.addModule(workletUrl).then(() => {
        console.log("added module, making nodes");
        for(let i =0; i < voices; i++)
        {
          let synth = new MaxiSynth(audioContext, customProcessorName);
          console.log("made nodes");
          if(synthElement)
          {
            synth.addGUI(synthElement);
          }
          synths.push(synth);
        }
        if(onSetSynths)
        {
          onSetSynths();
        }
      }).catch((e) => {
        console.log("Error on loading worklet: ", e)
      });
    } catch (err) {
      //console.log("AudioWorklet not supported in this browser: ", err.message);
    }
  }
  else
  {
    if (audioContext.state !== "suspended")
    {
      stopAudio();
    }
    else
    {
      audioContext.resume();
    }
  }
}

function updateSynthParameters(data)
{
  let param;
  let val = 0;
  let outputCtr = 0;
  let synthCtr = 0;
  let done = false;
  while(!done && synthCtr < synths.length)
  {
    const s = synths[synthCtr];
    if(data.index >= outputCtr && data.index < outputCtr + s.mapped.length)
    {
      s.onMLChange(parseFloat(data.data), data.index - outputCtr);
      done = true;
    }
    synthCtr++;
    outputCtr += s.mapped.length;
  }
}

function stopAudio() {
  if (synths !== undefined) {
    audioContext.suspend();
  }
}
