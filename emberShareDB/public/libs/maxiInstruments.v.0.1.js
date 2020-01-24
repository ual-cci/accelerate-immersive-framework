class MaxiInstruments {

  constructor() {
    this.samplers = [];
    this.synths = [];
    // this.synthProcessorName = 'maxi-synth-processor';
    // this.samplerProcessorName = 'maxi-sampler-processor';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){
      console.log("onload!");
    };
    script.src = 'https://mimicproject.com/libs/nexusUI.js';
    document.getElementsByTagName('head')[0].appendChild(script);
    this.synthWorkletUrl = "https://mimicproject.com/libs/maxiSynthProcessor.v.0.1.js";
    this.samplerWorkletUrl = "https://mimicproject.com/libs/maxiSamplerProcessor.v.0.1.js";
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
          //
          this.audioContext = new AudioContext({latencyHint:'playback', sample: 44100});
          Promise.all([
              this.loadModule(synthWorkletUrl),
              this.loadModule(samplerWorkletUrl)
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
    let outputCtr = 0;
    let instrumentCtr = 0;
    const instruments = this.samplers.concat(this.synths);
   	data.forEach((val)=> {
      let found = false;
      while(!found && instrumentCtr < instruments.length)
      {
        const s = instruments[instrumentCtr];
        if(s.mapped.length > 0)
        {
          s.onMLChange(val, outputCtr)
		  found = true;
        }
        outputCtr++;
        if(outputCtr >= s.mapped.length)
        {
          instrumentCtr++;
          outputCtr = 0;
        }
      }
    });
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

  setParam(name, val)
  {
    const param = this.node.parameters.get(name);
    if(param)
    {
      param.setValueAtTime(val, this.context.currentTime)
    }
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
    const core = [
      "gain", "rate", "start", "end"
    ];
    this.parameters = [];
    for(let i = 0; i < 4; i++)
    {
      core.forEach((v)=> {
        this.parameters.push(v+"_"+i);
      });
    }
    this.scale = {
      "gain":{scale:1, translate:0},
      "attack":{scale:1500, translate:0},
      "decay":{scale:1500, translate:0},
      "cutoff":{scale:2000, translate:40},
      "rate":{scale:5, translate:0},
      "end":{scale:1, translate:0},
      "start":{scale:1, translate:0}
    };
  }

  addGUI(element) {
    const rowLength = 8;
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
      const just_name = p.substring(0, p.length - 2)
      const scaledVal = (val - this.scale[just_name].translate) / this.scale[just_name].scale;
      //console.log("justname", p, just_name, val, scaledVal);
      const numBox = document.createElement('div');
      cell.appendChild(numBox);
      numBox.setAttribute("id", p);
      var number = new Nexus.Number("#"+p,{
        'size': [30, 20],
        'value': scaledVal,
        'min': 0,
        'max': 1,
        'step': 0.05
      });
      this.outputGUI[p] = number;
      number.on('change', (v)=> {
      	this.onGUIChange(v, i);
      })
      const label = document.createElement('p');
      label.innerHTML = p;
      label.style.width = "30px";
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
    const just_name = key.substring(0, key.length - 2)
    const scaled = (this.scale[just_name].scale * val) + this.scale[just_name].translate;
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

  setParam(name, val)
  {
    const param = this.node.parameters.get(name);
    if(param)
    {
      param.setValueAtTime(val, this.context.currentTime)
    }
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
