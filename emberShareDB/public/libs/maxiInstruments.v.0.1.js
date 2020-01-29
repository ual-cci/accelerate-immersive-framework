class MaxiInstruments {

  constructor() {
    this.samplers = [];
    this.synths = [];
    this.synthProcessorName = 'maxi-synth-processor';
    this.samplerProcessorName = 'maxi-sampler-processor';
    let nexusUI = document.createElement('script');
    nexusUI.type = 'text/javascript';
    nexusUI.async = true;
    nexusUI.onload = function(){
      console.log("nexusUI onload!");
    };
    nexusUI.src = 'https://mimicproject.com/libs/nexusUI.js';
    document.getElementsByTagName('head')[0].appendChild(nexusUI);
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
      let sampler = new MaxiSampler(this.audioContext, this.samplerProcessorName, this.samplers.length);
      if(this.guiElement !== undefined)
      {
        sampler.addGUI(this.guiElement);
      }
      this.samplers.push(sampler);
    }
  }

  addSynth() {
    if (this.audioContext !== undefined) {
      let synth = new MaxiSynth(this.audioContext, this.synthProcessorName, this.synths.length);
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

class MaxiInstrument {

  constructor(audioContext, customProcessorName, index) {
    console.log("super constructor", audioContext)
    this.context = audioContext;
    this.customProcessorName = customProcessorName;
    this.index = index;

  }
  noteon(freq = 1) {
    this.node.port.postMessage({noteon:freq});
  }

  noteoff(freq = 1) {
    this.node.port.postMessage({noteoff:freq});
  }

  setSequence(seq) {
    const asTime = mm.sequences.unquantizeSequence(seq)
    const notes = asTime.notes;
    const len = asTime.totalTime * 44100;
   	let toAdd = [];
    notes.forEach((n)=> {
      toAdd.push({cmd:"noteon", f:this.getFreq(n.pitch), t:n.startTime * 44100});
      toAdd.push({cmd:"noteoff", f:this.getFreq(n.pitch), t:n.endTime * 44100});
    });
    this.node.port.postMessage({sequence:toAdd});
    this.node.port.postMessage({length:len});
  }

  onGUIChange(val, index) {
    this.onChange(val, this.parameters[index]);
    this.saveParamValues();
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

  randomise()
  {
    this.mapped.forEach((key)=> {
      const val = Math.random();
      this.outputGUI[key].value = val;
      this.onChange(val, key);
    })
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

  getParamKey()
  {
    return "key";
  }

  saveParamValues()
  {
    const key = this.getParamKey();
    window.localStorage.setItem(key, JSON.stringify(this.getParamValues()));
  }

  loadParamValues()
  {
    const key = this.getParamKey();
    const vals = JSON.parse(window.localStorage.getItem(key))
    if(vals)
    {
      Object.keys(vals).forEach((key)=>{
        const val = parseFloat(vals[key]);
        this.outputGUI[key].value = val;
        this.onChange(val, key);
      });
    }
  }

  getParamValues()
  {
    let vals = {};
   	Object.keys(this.outputGUI).forEach((p)=> {
    	vals[p] = this.outputGUI[p].value;
    })
    return vals;
  }
}

class MaxiSynth extends MaxiInstrument {

  constructor(audioContext, customProcessorName, index) {
    super(audioContext, customProcessorName, index);
    this.node = new AudioWorkletNode(this.context, this.customProcessorName);
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
    this.node.connect(this.context.destination);
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

  getParamKey()
  {
    return window.frameElement.name + "_synth_" + this.index;
  }

  getFreq(n)
  {
    return Nexus.mtof(n);
  }

  addGUI(element) {
    const rowLength = 4;
    const table = document.createElement("TABLE");
    let row = table.insertRow();
    element.appendChild(table);
    table.style.border = "1px solid black"

    const title = document.createElement('p');
    title.innerHTML = "MaxiSynth";
    title.style.fontSize = "10pt";
    title.style.margin = "3pt";
    const button = document.createElement("BUTTON");
    button.innerHTML = "Randomise"
    button.onclick = ()=>{
      this.randomise();
    }
    let cell = row.insertCell();
    cell.appendChild(title);
    cell = row.insertCell();
    cell.appendChild(button);

    for(let i = 0; i < this.parameters.length; i++)
    {
      let p = this.parameters[i];
      if(i % rowLength === 0)
      {
        row = table.insertRow();
      }
      cell = row.insertCell();
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
    this.loadParamValues();
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
}

class MaxiSampler extends MaxiInstrument {

   constructor(audioContext, customProcessorName, index) {
    super(audioContext, customProcessorName, index);
    this.node = new AudioWorkletNode(this.context, customProcessorName);
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
    this.node.connect(this.context.destination);
    this.mapped = [];
    this.outputGUI = [];
    const core = [
      "gain", "rate", "start", "end"
    ];
     const coreScale = {
      "gain":{scale:1, translate:0, min:0, max:1},
      "rate":{scale:1, translate:0, min:0, max:4},
      "end":{scale:1, translate:0, min:0, max:1},
      "start":{scale:1, translate:0, min:0, max:1}
    };
    this.scale = {};
    this.parameters = [];
    for(let i = 0; i < 4; i++)
    {
      core.forEach((v)=> {
        this.parameters.push(v+"_"+i);
        this.scale[v+"_"+i] = coreScale[v]
      });
    }
  }

  getFreq(n)
  {
    return n;
  }

  getParamKey()
  {
    return window.frameElement.name + "_sampler_" + this.index;
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
      //const just_name = p.substring(0, p.length - 2)
      const scaledVal = (val - this.scale[p].translate) / this.scale[p].scale;
      const numBox = document.createElement('div');
      cell.appendChild(numBox);
      numBox.setAttribute("id", p);
      var number = new Nexus.Number("#"+p,{
        'size': [30, 20],
        'value': scaledVal,
        'min': this.scale[p].min,
        'max': this.scale[p].max,
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
    this.loadParamValues();
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
