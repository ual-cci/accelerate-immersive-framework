class MaxiInstruments {

  constructor() {
    this.samplers = [];
    this.synths = [];
    this.synthProcessorName = 'maxi-synth-processor';
    this.samplerProcessorName = 'maxi-sampler-processor';
    this.synthWorkletUrl = "https://mimicproject.com/libs/maxiSynthProcessor.js";
    this.samplerWorkletUrl = "https://mimicproject.com/libs/maxiSamplerProcessor.js";
  }

  getInstruments() {
    return this.samplers.concat(this.synths);
  }

  getNumMappedOutputs() {
    return this.getInstruments().reduce((c, s) => c + s.mapped.length, 0);
  }

  addSampler() {
    if (this.audioContext !== undefined) {
      let sampler = new MaxiSampler(this.audioContext, this.samplerProcessorName);
      if(this.guiElement !== undefined)
      {
        sampler.addGUI(this.guiElement);
      }
      this.samplers.push(sampler);
    }
  }

  addSynth() {
    if (this.audioContext !== undefined) {
      let synth = new MaxiSynth(this.audioContext, this.synthProcessorName);
      if(this.guiElement !== undefined)
      {
        synth.addGUI(this.guiElement);
      }
      this.synths.push(synth);
    }
  }

  getMappedOutputs() {
	let y = [];
    this.getInstruments().forEach((s)=> {
    	y = y.concat(s.getMappedParameters());
    });
    return y;
  }

  loadModule(url) {
    return new Promise((resolve, reject)=> {
      console.log("adding module", url);
      this.audioContext.audioWorklet.addModule(url).then(() => {
        console.log("added module");
        resolve();
      }).catch((e) => {
        console.log("Error on loading worklet: ", e)
        reject(e);
      });
    });
  }

  loadModules() {
    return new Promise((resolve, reject)=> {
      if (this.audioContext === undefined) {
        try {
          this.audioContext = new AudioContext();
          Promise.all([
              this.loadModule(this.synthWorkletUrl),
              this.loadModule(this.samplerWorkletUrl)
          ]).then(()=> {
            resolve();
          }).catch((err)=> {
            reject(err);
          });;
        } catch (err) {
          reject(err);
        }
      }
      else
      {
        reject("audio context already exists");
      }
    });
  }

  updateMappedOutputs(data)
  {
    let param;
    let val = 0;
    let outputCtr = 0;
    let synthCtr = 0;
    let done = false;
    const instruments = this.samplers.concat(this.synths);
    while(!done && synthCtr < instruments.length)
    {
      const s = instruments[synthCtr];
      if(data.index >= outputCtr && data.index < outputCtr + s.mapped.length)
      {
        s.onMLChange(parseFloat(data.data), data.index - outputCtr);
        done = true;
      }
      synthCtr++;
      outputCtr += s.mapped.length;
    }
  }

  stopAudio() {
    if (this.audioContext !== undefined) {
      this.audioContext.suspend();
    }
  }

}

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

  useFreqSliders(p) {
    const param = this.node.parameters.get("poly");
    if(param)
    {
      param.setValueAtTime(p ? 0 : 1, this.context.currentTime)
    }
    const vis = p ? "visible" : "hidden"
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

class MaxiSampler {

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
      "attack", "decay", "sustain", "release","cutoff", "Q","rate"
    ];
    this.scale = {
      "attack":{scale:1500, translate:0},
      "decay":{scale:1500, translate:0},
      "sustain":{scale:1, translate:0},
      "release":{scale:1500, translate:0},
      "cutoff":{scale:2000, translate:40},
      "Q":{scale:2, translate:0},
      "rate":{scale:5, translate:-2}
    };
  }

  addGUI(element) {
    const rowLength = 4;
    const title = document.createElement('p');
    title.innerHTML = "MaxiSampler";
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

  noteon(freq = 1) {
    this.node.port.postMessage({noteon:freq});
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

  loadSample(url, index) {
    console.log("loadSamples");
    if (this.context !== undefined) {
      loadSampleToArray(this.context, index, url, this.sendAudioArray, this.node);
    } else throw "Audio Context is not initialised!";
  }

  sendAudioArray(sampleWorkletObjectName, float32Array, node) {
    console.log("sendAudioArray");
    if (float32Array !== undefined && node !== undefined) {
      // console.log('f32array: ' + float32Array);
      node.port.postMessage({
        audioBlob: float32Array,
        index:parseInt(sampleWorkletObjectName)
      });
    }
  }
}
