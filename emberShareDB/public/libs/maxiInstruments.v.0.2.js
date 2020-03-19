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
    nexusUI.src = document.location.origin + '/libs/nexusUI.js';
    document.getElementsByTagName('head')[0].appendChild(nexusUI);
    this.version = "v.0.1";
  }

  getSynthName()
  {
    return document.location.origin == "https://mimicproject.com" ? document.location.origin + "/libs/maxiSynthProcessor." + this.version + ".js" : synthWorkletUrl;
  }

  getSamplerName()
  {
    return document.location.origin == "https://mimicproject.com" ? document.location.origin + "/libs/maxiSamplerProcessor." + this.version + ".js" : samplerWorkletUrl;
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
          this.audioContext = new AudioContext({latencyHint:'playback', sample: 44100});
          Promise.all([
			 this.loadModule(this.getSynthName()),
             this.loadModule(this.getSamplerName())
          ]).then(()=> {
            resolve();
          }).catch((err)=> {
            reject(err);
          });
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

  setSequence(seq, instruments = [], muteDrums = false) {
    let asTime;
    try {
      asTime = mm.sequences.unquantizeSequence(seq)
    } catch (err) {
      asTime = seq;
    }
    const notes = asTime.notes;
    const len = asTime.totalTime * 44100;
   	let toAdd = [];
    notes.forEach((n)=> {
      let doAdd = true;
      if(instruments.length > 0)
      {
		doAdd = instruments.includes(n.instrument);
      }
      //If instrument selected, check for drums
      if(doAdd && muteDrums)
      {
      	doAdd = !n.isDrum;
      }
      if(doAdd)
      {
      	toAdd.push({cmd:"noteon", f:this.getFreq(n.pitch), t:n.startTime * 44100});
      	toAdd.push({cmd:"noteoff", f:this.getFreq(n.pitch), t:n.endTime * 44100});
      }
    });
    toAdd.sort((a, b)=> {
      return a.t - b.t;
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

  randomise() {
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

  setParam(name, val) {
    const param = this.node.parameters.get(name);
    if(param)
    {
      param.setValueAtTime(val, this.context.currentTime)
    }
  }

  getParamKey() {
    return "key";
  }

  saveParamValues() {
    const key = this.getParamKey();
    window.localStorage.setItem(key, JSON.stringify(this.getParamValues()));
  }

  loadParamValues() {
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

  getParamValues() {
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
    this.parameters = [
      "frequency", "frequency2", "attack", "decay", "sustain", "release",
      "lfoFrequency", "lfoPitchMod", "lfoFilterMod", "lfoAmpMod", "adsrAmpMod",
      "adsrPitchMod", "adsrFilterMod", "cutoff", "Q", "oscFn"
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
      "Q":{scale:2, translate:0},
      "oscFn":{scale:1, translate:0}
    };
  }

  setOsc(osc) {
    const param = this.node.parameters.get("oscFn");
    if(param)
    {
      param.setValueAtTime(osc, this.context.currentTime)
    }
  }

  getParamKey() {
    return window.frameElement.name + "_synth_" + this.index;
  }

  getFreq(n) {
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

    const randomButton = document.createElement("BUTTON");
    randomButton.innerHTML = "Randomise"
    randomButton.onclick = ()=>{
      this.randomise();
    }

    const oscillatorSelector = document.createElement("select");
    ["sin", "tri", "saw", "noise"].forEach((osc, i)=> {
      const option = document.createElement("option");
      option.value = i;
      option.text = osc;
      oscillatorSelector.appendChild(option);
    });
    oscillatorSelector.onchange = ()=> {
      const index = parseInt(oscillatorSelector.selectedIndex);
      this.onGUIChange(index, this.parameters.length - 1);
    }
    this.outputGUI.oscFn = oscillatorSelector;

    const printParamsButton = document.createElement("BUTTON");
    printParamsButton.innerHTML = "Dump"
    printParamsButton.onclick = ()=>{
      let str = "vals:{\n";
      const vals = this.getParamValues();
      Object.keys(vals).forEach((key)=>{
		str += "\t" + key + ":" + vals[key] + ",\n"
      });
      str += "}"
      console.log(str)
    }

    const presets = [
          {title:"--presets--"},
          {title:"Snare",
            vals:{
                oscFn:3,
                frequency:0.44,
                frequency2:0.22,
                attack:0.03,
                decay:0.26,
                sustain:0.12,
                release:0.28,
                lfoFrequency:0,
                lfoPitchMod:0,
                lfoFilterMod:0,
                lfoAmpMod:0,
                adsrAmpMod:1,
                adsrPitchMod:0,
                adsrFilterMod:0,
                cutoff:0.91,
                Q:0.3,
            }
          },
          {title:"Factory",
            vals:{
                oscFn:2,
                frequency:0.44,
                frequency2:0.22,
                attack:1,
                decay:0.07,
                sustain:0.35,
                release:0.04,
                lfoFrequency:0,
                lfoPitchMod:0,
                lfoFilterMod:0,
                lfoAmpMod:0.18,
                adsrAmpMod:1,
                adsrPitchMod:1,
                adsrFilterMod:1,
                cutoff:1,
                Q:0.5,
            }
          },
          {title:"Strings",
          	vals:{
                oscFn:2,
                frequency:0.44,
                frequency2:0.22,
                attack:0.67,
                decay:0.67,
                sustain:1,
                release:0.67,
                lfoFrequency:0,
                lfoPitchMod:0,
                lfoFilterMod:0,
                lfoAmpMod:0,
                adsrAmpMod:1,
                adsrPitchMod:0,
                adsrFilterMod:1,
                cutoff:1,
                Q:0.5,
            }
          },
          {title:"Underwater",
            vals:{
              oscFn:0,
              frequency:0.44,
              frequency2:0.22,
              attack:1,
              decay:0.58,
              sustain:0.22,
              release:0.16,
              lfoFrequency:0.88,
              lfoPitchMod:0,
              lfoFilterMod:0.08,
              lfoAmpMod:0,
              adsrAmpMod:1,
              adsrPitchMod:0,
              adsrFilterMod:0,
              cutoff:0.23,
              Q:0.36,
            }
          },
          {title:"Squelch",
            vals:{
                oscFn:2,
                frequency:0.44,
                frequency2:0.22,
                attack:0.06,
                decay:0.58,
                sustain:0.22,
                release:0.41,
                lfoFrequency:1,
                lfoPitchMod:0,
                lfoFilterMod:0.13,
                lfoAmpMod:0,
                adsrAmpMod:1,
                adsrPitchMod:0,
                adsrFilterMod:0,
                cutoff:1,
                Q:0.93,
            }
          },
          {title:"Fairground",
          	vals:{
              oscFn:0,
              frequency:0.44,
              frequency2:0.22,
              attack:0.67,
              decay:0.67,
              sustain:0.7,
              release:0.67,
              lfoFrequency:0.97,
              lfoPitchMod:0,
              lfoFilterMod:0,
              lfoAmpMod:0.18,
              adsrAmpMod:1,
              adsrPitchMod:0,
              adsrFilterMod:1,
              cutoff:1,
              Q:0.5
            }
          },
          {title:"Raymond",
            vals:{
              oscFn:2,
              frequency:0.44,
              frequency2:0.22,
              attack:0.26,
              decay:0.67,
              sustain:0.7,
              release:0.13,
              lfoFrequency:0.97,
              lfoPitchMod:0,
              lfoFilterMod:0.88,
              lfoAmpMod:0,
              adsrAmpMod:1,
              adsrPitchMod:0,
              adsrFilterMod:1,
              cutoff:1,
              Q:0.5
          	},
          },
          {title:"Skep",
          vals:{
            oscFn:1,
            frequency:0.44,
            frequency2:0.22,
            attack:0.08,
            decay:0.22,
            sustain:0.13,
            release:1,
            lfoFrequency:0.05,
            lfoPitchMod:0,
            lfoFilterMod:0,
            lfoAmpMod:0.07,
            adsrAmpMod:1,
            adsrPitchMod:0.06,
            adsrFilterMod:0,
            cutoff:0.86,
            Q:0.25
          	}
          }
        ];
    const presetSelector = document.createElement("select");
    presets.forEach((preset)=> {
      const option = document.createElement("option");
      option.value = 0;
      option.text = preset.title;
      presetSelector.appendChild(option);
    });
    presetSelector.onchange = ()=> {
      const index = parseInt(presetSelector.selectedIndex);
      if(index > 0)
      {
        const preset = presets[index];
        Object.keys(preset.vals).forEach((key)=>{
          const val = preset.vals[key];
          this.outputGUI[key].value = val;
          this.onChange(val, key);
        });
      }
    }

    let cell = row.insertCell();
    cell.appendChild(title);
    cell = row.insertCell();
    cell.appendChild(randomButton);
    cell.appendChild(oscillatorSelector);
    cell = row.insertCell();
    cell.colSpan = "2"
    cell.appendChild(presetSelector);
    cell = row.insertCell();
    cell.appendChild(printParamsButton);

    for(let i = 0; i < this.parameters.length; i++)
    {
      let p = this.parameters[i];
      if(p !== "oscFn")
      {
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
