class MaxiInstruments {

  constructor() {
    this.samplers = [];
    this.synths = [];
    this.synthProcessorName = 'maxi-synth-processor';
    let nexusUI = document.createElement('script');
    nexusUI.type = 'text/javascript';
    nexusUI.async = true;
    nexusUI.onload = function(){
      console.log("nexusUI onload!");
    };
    nexusUI.src = document.location.origin + '/libs/nexusUI.js';
    document.getElementsByTagName('head')[0].appendChild(nexusUI);
    this.version = "v.0.3";
  }

  getSynthName()
  {
    return document.location.origin + "/libs/maxiSynthProcessor." + this.version + ".js";
  }

  getInstruments() {
    return this.samplers.concat(this.synths);
  }

  getNumMappedOutputs() {
    return this.getInstruments().reduce((c, s) => c + s.mapped.length, 0);
  }

  addSampler() {
    if (this.audioContext !== undefined) {
      this.node.port.postMessage({addSampler:true});
      let sampler = new MaxiSampler(
        this.node,
        this.samplers.length,
        "sampler",
      	this.audioContext
      );
      if(this.guiElement !== undefined)
      {
        sampler.addGUI(this.guiElement);
      }
      this.samplers.push(sampler);
    }
  }

  addSynth() {
    if(this.audioContext !== undefined) {
      this.node.port.postMessage({addSynth:true});
      let synth = new MaxiSynth(
        this.node,
        this.synths.length,
        "synth",
      	this.audioContext
      );
      if(this.guiElement !== undefined)
      {
        synth.addGUI(this.guiElement);
      }
      this.synths.push(synth);
    }
  }

  setParam(name, val) {
    let param = this.node.parameters.get(name);
    if(param)
    {
      param.setValueAtTime(val, this.audioContext.currentTime)
    }
  }

  setLoop(val) {
    this.setParam("loop", val - 1);
  }

  setTempo(tempo) {
    this.node.port.postMessage({tempo:tempo});
  }

  getMappedOutputs() {
	let y = [];
    this.getInstruments().forEach((s)=> {
    	y = y.concat(s.getMappedParameters());
    });
    return y;
  }

  createNode() {
    return new Promise((resolve, reject)=> {
     this.node = new AudioWorkletNode(
        this.audioContext,
        this.synthProcessorName,
        {
          processorOptions: {}
        }
      );
      this.node.onprocessorerror = event => {
        console.log(`MaxiProcessor Error detected: ` + event.data);
      }
      this.node.onprocessorstatechange = event => {
        console.log(`MaxiProcessor state change detected: ` + audioWorkletNode.processorState);
      }
      this.node.port.onmessage = event => {
        //this.onTick(event.data.playHead);
      };
      this.node.port.onmessageerror = event => {
        console.log(`Error message from port: ` + event.data);
      };
      this.node.connect(this.audioContext.destination);
      resolve()
    });

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
          this.audioContext = new AudioContext({
            latencyHint:'playback',
            sample: 44100
          });
         this.loadModule(synthWorkletUrl).then(()=> {
            this.createNode().then(resolve);
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

  constructor(node, index, instrument, audioContext) {
    this.node = node;
    this.index = index;
    this.instrument = instrument;
    this.audioContext = audioContext;
    this.mapped = [];
    this.outputGUI = [];
  }
  noteon(freq = 1) {
    this.node.port.postMessage({
      noteon:{
        instrument:this.instrument,
        index:this.index,
        val:freq
      }
    });
  }

  noteoff(freq = 1) {
    this.node.port.postMessage({
      noteoff:{
        instrument:this.instrument,
        index:this.index,
        val:freq
      }
    });
  }

  setSequence(seq, instruments = [], muteDrums = false) {
    const notes = seq.notes;
   	let toAdd = [];
    let mul = 1;
    if(seq.quantizationInfo)
    {
		mul = 24 / seq.quantizationInfo.stepsPerQuarter;
    }
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
        const start = n.quantizedStartStep;
        const end = n.quantizedEndStep ? n.quantizedEndStep : start + 1;
      	toAdd.push({cmd:"noteon", f:this.getFreq(n.pitch), t:start * mul});
      	toAdd.push({cmd:"noteoff", f:this.getFreq(n.pitch), t:end * mul});
      }
    });
    toAdd.sort((a, b)=> {
      return a.t - b.t;
    });
    this.node.port.postMessage({
      sequence:{
        instrument:this.instrument,
        index:this.index,
        val:toAdd
      }
    });
  }

  onGUIChange(val, index) {
    this.onChange(val, Object.keys(this.parameters)[index]);
    this.saveParamValues();
  }

  onMLChange(val, index) {
    this.outputGUI[this.mapped[index]].value = val;
    this.onChange(val, this.mapped[index]);
  }

  onChange(val, key) {
    const scaled = (this.parameters[key].scale * val) + this.parameters[key].translate;
    this.setParam(key, scaled);
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
    let param = this.node.parameters.get(name);
    if(param)
    {
      param.setValueAtTime(val, this.context.currentTime)
    }
    else if (this.parameters[name])
    {
      this.parameters[name].val = val;
      this.node.port.postMessage({
        "parameters":{
          instrument:this.instrument,
          index:this.index,
          val:this.parameters
        }
      });
    }
  }

  getParamKey() {
    return "key";
  }

  saveParamValues() {
    const key = this.getParamKey();
    window.localStorage.setItem(
      key,
      JSON.stringify(this.getParamValues())
    );
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

  constructor(node, index, instrument, audioContext) {
    super(node, index, instrument, audioContext);

    this.parameters = {
      "frequency":{scale:1000, translate:0, val:440, default:440},
      "frequency2":{scale:1000, translate:0, val:440, default:440},
      "attack":{scale:1500, translate:0, val:1000, default:1000},
      "decay":{scale:1500, translate:0, val:1000, default:1000},
      "sustain":{scale:1, translate:0, val:1, default:1},
      "release":{scale:1500, translate:0, val:1000, default:1000},
      "lfoFrequency":{scale:10, translate:0, val:0, default:0},
      "lfoPitchMod":{scale:100, translate:0, val:1, default:1},
      "lfoFilterMod":{scale:8000, translate:0, val:1, default:1},
      "lfoAmpMod":{scale:1, translate:0, val:0, default:0},
      "adsrAmpMod":{scale:1, translate:0, val:1, default:1},
      "adsrPitchMod":{scale:100, translate:0, val:1, default:1},
      "adsrFilterMod":{scale:1, translate:0, val:1, default:1},
      "cutoff":{scale:3000, translate:40, val:2000, default:2000},
      "Q":{scale:2, translate:0, val:1, default:1},
      "poly":{scale:1, translate:0, val:0, default:0},
      "oscFn":{scale:1, translate:0, val:0, default:0},
    }
  }

  setOsc(osc) {
    this.setParam("oscFn", osc);
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
      this.onGUIChange(index, Object.keys(this.parameters).length - 1);
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
      {title:"Peep",
       vals:{
            oscFn:1,
            frequency:0.44,
            frequency2:0.22,
            attack:0.06,
            decay:0.04,
            sustain:0.02,
            release:0.03,
            lfoFrequency:0,
            lfoPitchMod:0,
            lfoFilterMod:0,
            lfoAmpMod:0.18,
            adsrAmpMod:1,
            adsrPitchMod:0.45,
            adsrFilterMod:1,
            cutoff:1,
            Q:0,
        }
      },
      {title:"Accordion",
         vals:{
          oscFn:1,
          frequency:0.44,
          frequency2:0.22,
          attack:0.65,
          decay:0.02,
          sustain:0.01,
          release:0.07,
          lfoFrequency:0.79,
          lfoPitchMod:0,
          lfoFilterMod:0,
          lfoAmpMod:0,
          adsrAmpMod:1,
          adsrPitchMod:0,
          adsrFilterMod:1,
          cutoff:1,
          Q:1,
    	}
      },
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

    for(let i = 0; i < Object.keys(this.parameters).length; i++)
    {
      let p = Object.keys(this.parameters)[i];
      if(p !== "oscFn" && p !== "poly")
      {
        if(i % rowLength === 0)
        {
          row = table.insertRow();
        }
        cell = row.insertCell();
        cell.classList.add("cell_" + p);
        cell.style.border = "1px solid black";
        let val = this.parameters[p].default;
        val = (val - this.parameters[p].translate) / this.parameters[p].scale;
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

  useFreqSliders(useSliders) {
    this.setParam("poly", useSliders ? 0 : 1)
    const vis = useSliders ? "visible" : "hidden"
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

   constructor(node, index, instrument, audioContext) {
    super(node, index, instrument, audioContext);
    const core = {
      "gain":{scale:1, translate:0, min:0, max:1, val:0.5},
      "rate":{scale:1, translate:0, min:0, max:4, val:1},
      "end":{scale:1, translate:0, min:0, max:1, val:1},
      "start":{scale:1, translate:0, min:0, max:1, val:0}
    };
    this.parameters = {};
    for(let i = 0; i < 4; i++)
    {
      Object.keys(core).forEach((v)=> {
        this.parameters[v+"_"+i] = core[v]
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
    for(let i = 0; i < Object.keys(this.parameters).length; i++)
    {
      let p = Object.keys(this.parameters)[i];
      if(i % rowLength === 0)
      {
        row = table.insertRow();
      }
      const cell = row.insertCell();
      cell.classList.add("cell_" + p);
      cell.style.border = "1px solid black";
      let val = this.parameters[p].val;
      //const just_name = p.substring(0, p.length - 2)
      const scaledVal = (val - this.parameters[p].translate) / this.parameters[p].scale;
      const numBox = document.createElement('div');
      cell.appendChild(numBox);
      numBox.setAttribute("id", p);
      var number = new Nexus.Number("#"+p,{
        'size': [30, 20],
        'value': scaledVal,
        'min': this.parameters[p].min,
        'max': this.parameters[p].max,
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
    console.log("loadSamples", this.index);
    if (this.audioContext !== undefined) {
      loadSampleToArray(this.audioContext, index, url, this.sendAudioArray, this.node, this.index);
    } else throw "Audio Context is not initialised!";
  }

  sendAudioArray(sampleWorkletObjectName, float32Array, node) {
    console.log("sendAudioArray");
    if (float32Array !== undefined && node !== undefined) {
      node.port.postMessage({
        audio:{
          instrument:"sampler",
          index:0,
          val:{
            audioBlob: float32Array,
        	index:parseInt(sampleWorkletObjectName)
          }
        }
      });
    }
  }
}
