import Module from "https://mimicproject.com/libs/maximilian.wasmmodule.js"

class MaxiSamplerProcessor {
   constructor() {
    //Max polyphony
    const voices = 4;
    this.sampleRate = 44100;
    this.DAC = [0];
    this.dcoOut = 0;
    this.dcfOut = 0;
    this.samples = [];
    this.adsr = [];
    this.playHead = 0;
    this.prevPlayHead = 0;
    for(let i = 0; i < voices; i++)
    {
      this.samples.push(new Module.maxiSample());
      this.adsr.push(new Module.maxiEnv());
    }
    this.dcf = new Module.maxiFilter();
    this.seqPtr = 0;
    this.sequence = [];
  }

  doTrig() {
    let trig = false;
    if(this.seqPtr < this.sequence.length)
    {
      trig = this.sequence[this.seqPtr].t <= this.playHead;
    }
    return trig;
  }

  handleNoteOn(freq)
  {
    console.log("handleNoteOn", freq);
  	this.handleCmd({cmd:"noteon", f:freq});
  }

  //Execute noteon/noteoffs (whether sequenced or manually triggered)
  handleCmd(nextCmd) {
    if(this.parameters)
    {
      const f = nextCmd.f;
      console.log(nextCmd)
      if(nextCmd.cmd === "noteon")
      {
        console.log("trigger",f);
        this.samples[f].trigger();
      }
    }
  }

  handleLoop() {
    this.seqPtr = 0;
  }

  tick(playHead) {
    this.playHead = playHead;
    if(this.playHead == 0 && this.prevPlayHead > 0)
    {
      this.handleLoop();
    }

    while(this.doTrig())
    {
      const nextCmd = this.sequence[this.seqPtr]
      this.handleCmd(nextCmd);
      this.seqPtr++;
    }
    this.prevPlayHead = this.playHead;
  }

  remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
  }

  onSample() {

  }

  signal(parameters) {
    this.dcoOut = 0;
    let index = 0;
    for(let i = 0; i < this.samples.length; i++)
    {
      const s = this.samples[i];
      if(s.isReady())
      {
        let end = this.parameters['end_'+i].val;
        if(end == 0)
        {
          end = s.getLength();
        }
        let start = this.parameters['start_'+i].val;
        let rate = this.parameters['rate_'+i].val
        let gain = this.parameters['gain_' + i].val;
        //let gain = i == 0 ? 1:0;
      	this.dcoOut += s.playOnce(rate) * gain;
      }
      this.adsr[index].trigger = 0;
      index++;

    }
   	return this.dcoOut;
  }

  logGain(gain) {
    return 0.0375 * Math.exp(gain * 0.465);
  }
}

class MaxiSynthProcessor {

  constructor() {
    const voices = 8;
    this.sampleRate = 44100;
    this.DAC = [0];
    this.dcoOut = 0;
    this.dcfOut = 0;
    this.dco = [];
    this.adsr = [];
    this.triggered = [];
    this.released = [];
    for(let i = 0; i < voices; i++)
    {
      this.dco.push(new Module.maxiOsc());
      this.adsr.push(new Module.maxiEnv());
    }
    this.lfo = new Module.maxiOsc();
    this.dcf = new Module.maxiFilter();
    this.seqPtr = 0;
    this.samplePtr = 0;
    this.sequence = [];
    this.poly = false;
    this.playHead = 0;
    this.prevPlayHead = 0;
  }

    //Find the oscillator to release for freq (for noteoff)
  getTriggeredForFreq(f) {
    let osc = -1;
    for(let i = 0; i < this.triggered.length; i++)
    {
      if(this.triggered[i].f === f)
      {
        osc = i;
        break;
      }
    }
    return osc;
  }

  //Find the oscillator to release for freq (for noteoff)
  getOscToRelease(f) {
    let osc = -1;
    for(let i = 0; i < this.triggered.length; i++)
    {
      if(this.triggered[i].f === f)
      {
        osc = this.triggered[i].o;
        break;
      }
    }
    return osc;
  }

  isFreqTriggered(f) {
    if(this.poly)
    {
      return this.triggered.map(a => a.f).includes(f);
    }
    else
    {
      return this.triggered.length > 0;
    }

  }

  //Get next available oscillator
  //Oscillators are not available until they have finished releasing
  getAvailableOsc() {
    let osc = -1;
    let inUse = this.triggered.concat(this.released).map(a => a.o);
    if(inUse.length >= this.dco.length)
    {
      console.log("all oscs in use, popping release early", inUse.length);
      this.released.shift();
      inUse = this.triggered.concat(this.released).map(a => a.o);
    }
    for(let i = 0; i < this.dco.length; i++)
    {
      if(!inUse.includes(i))
      {
        osc = i;
        break;
      }
    }
    return osc;
  }

  //Dont retrigger if freq already playing
  handleNoteOn(freq)
  {
    if(!this.isFreqTriggered(freq))
    {
      if(this.poly)
      {
        this.handleCmd({cmd:"noteon", f:freq});
      }
      else if(this.parameters)
      {
        this.handleCmd({cmd:"noteon", f:this.parameters.frequency.val});
        this.handleCmd({cmd:"noteon", f:this.parameters.frequency2.val});
      }
    }
    else
    {
      console.log("cant noteon", this.triggered);
    }
  }

  //Only release if freq triggered
  handleNoteOff(freq)
  {
    if(this.poly)
    {
      const o = this.getOscToRelease(freq);
      if(o >= 0)
      {
        this.handleCmd({cmd:"noteoff", f:freq});
      }
    }
	else if(this.parameters)
    {
      this.handleCmd({cmd:"noteoff", f:this.parameters.frequency.val});
      this.handleCmd({cmd:"noteoff", f:this.parameters.frequency2.val});;
    }
  }

  //Execute noteon/noteoffs (whether sequenced or manually triggered)
  handleCmd(nextCmd) {
    if(this.parameters)
    {
      const f = nextCmd.f;
      console.log("Synth cmd", nextCmd.cmd, nextCmd.f);
      if(nextCmd.cmd === "noteon")
      {
        const o =  this.getAvailableOsc();
        //console.log("on", f, o);
        //This will be -1 if no available oscillators
        if(o >= 0)
        {
          this.adsr[o].setAttack(this.parameters.attack.val);
          this.adsr[o].setDecay(this.parameters.decay.val);
          this.adsr[o].setSustain(this.parameters.sustain.val);
          this.adsr[o].setRelease(this.parameters.release.val);
          this.triggered.push({o:o, f:f});
          this.adsr[o].trigger = 1;
        }
        else
        {
          //console.log("no free osc for",f);
        }
      }
      else if(nextCmd.cmd === "noteoff")
      {
        let release = -1;
        const releaseTime = (this.samplePtr + (this.parameters.release.val/ 1000 * this.sampleRate));
        if(this.poly)
        {
          //Release based on freq match
          release = this.getOscToRelease(f)
          if(release >= 0)
          {
            this.adsr[release].trigger = 0;
            //console.log("off", f, release);
            const t =  this.getTriggeredForFreq(f);
            this.released.push({f:f, o:release, off:releaseTime});
            this.remove(this.triggered, this.triggered[t]);
          }
        }
        else if(this.triggered.length == 2)
        {
          //Just release the two oscilators that are on, freq doesnt matter
          for(let i = 0; i < 2; i++)
          {
            release = this.triggered[i].o;
            console.log("off", f, release);
          	this.adsr[release].trigger = 0;
            this.released.push({f:f, o:release, off:releaseTime});
          }
          this.remove(this.triggered, this.triggered[0]);
          this.remove(this.triggered, this.triggered[1]);
        }
      }
    }
  }

  handleLoop() {
	//Wrap around any release times
    for(let i = 0; i < this.released.length; i++)
    {
      this.released[i].off = this.released[i].off % this.length;
    }
    //MIDIPANIC
    this.triggered.forEach((trig)=> {
      this.handleNoteOff(trig.f);
    });
    //Restart loop
    this.samplePtr = this.seqPtr = 0;
  }

  //If theres a command to trigger in the sequence
  doTrig() {
    let trig = false;
    if(this.seqPtr < this.sequence.length)
    {
      trig = this.sequence[this.seqPtr].t <= this.playHead;
    }
    return trig;
  }

  tick(playHead) {
    this.playHead = playHead;
    if(this.playHead == 0 && this.prevPlayHead > 0)
    {
      this.handleLoop();
    }
    while(this.doTrig())
    {
      const nextCmd = this.sequence[this.seqPtr];
      this.handleCmd(nextCmd);
      this.seqPtr++;
    }
    this.prevPlayHead = this.playHead;
  }

  remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
  }

  removeReleased() {
    let toRemove = [];
    this.released.forEach((o, i)=>{
      if(this.samplePtr >= o.off)
      {
        toRemove.push(o);
      }
    });
    for(let i = 0; i < toRemove.length; i++)
    {
      this.remove(this.released, toRemove[i]);
    }
  }

  onSample() {
    this.samplePtr++;
    this.removeReleased();
  }

  signal() {
    if(this.parameters)
    {
      this.poly = this.parameters.poly.val == 1;

      const lfoOut = this.lfo.sinewave(this.parameters.lfoFrequency.val);
      const oscFn = this.getOscFn(this.parameters.oscFn.val);
      this.dcoOut = 0;
      const out = this.triggered.concat(this.released);

      for(let o of out)
      {
        //console.log(o.o, o.f);
        const envOut = this.adsr[o.o].adsr(1, this.adsr[o.o].trigger);
        const pitchMod = (this.parameters.adsrPitchMod.val * envOut) + (lfoOut * this.parameters.lfoPitchMod.val);
        const ampOsc =  (lfoOut * this.parameters.lfoAmpMod.val)
        const normalise = this.poly ? this.dco.length : 2.0;
        const ampMod = ((envOut * this.parameters.adsrAmpMod.val) + (ampOsc * envOut)) / normalise;
        let f = this.poly ? o.f : o.o % 2 == 0 ? this.parameters.frequency.val : this.parameters.frequency2.val;
        f = f < 0 ? 0 : f;
        let osc;
        if(oscFn === "noise")
        {
          osc = this.dco[o.o].noise();
        }
        else
        {
          osc = this.dco[o.o][oscFn](f + pitchMod);
          //osc = this.dco[o.o][oscFn](f);
        }
        this.dcoOut += (osc * ampMod);
      }

      //Filter

      let filterEnv = 1;
      const filterOsc = lfoOut * this.parameters.lfoFilterMod.val;
      let cutoff = this.parameters.cutoff.val;
      cutoff = (cutoff * filterEnv) + filterOsc;
      if (cutoff > 2000) {
        cutoff = 2000;
      }
      if (cutoff < 40) {
        cutoff = 40;
      }
      this.dcfOut = this.dcf.lores(this.dcoOut, cutoff, this.parameters.Q.val);
      return this.dcfOut;
    }
	else {
      console.log("just 0")
      return 0;
    }
  }

  getOscFn(o)
  {
    let oscFn;
    switch(o) {
      case 0:
        oscFn = "sinewave"; break;
      case 1:
        oscFn = "triangle"; break;
      case 2:
        oscFn = "saw"; break;
      case 3:
        oscFn = "noise"; break;
      default:
        oscFn = "sinewave"; break;
    }
    return oscFn;
  }
}

class MaxiInstrumentsProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      let core =  [{
          name: 'gain',
          defaultValue: 0.5
        },
        {
          name: 'loop',
          defaultValue: 96.0
        },
        {
          name: 'playHead',
          defaultValue: 0.0
        },
      ];
      return core;
    }

   constructor(options) {
    super();
    console.log("options", options)
    //Max polyphony
    this.instruments = {synth:[], sampler:[]};
    console.log("making clock")
    this.myClock = new Module.maxiClock();
    this.myClock.setTempo(80);
    this.myClock.setTicksPerBeat(24);
    this.playHead = 0;
    this.port.onmessage = (event) => {
      if(event.data.sequence)
      {
        console.log("sequnce", event.data.sequence);
        const data = event.data.sequence;
        this.instruments[data.instrument][data.index].sequence = data.val;
      }
      else if(event.data.addSynth)
      {
        console.log("ADDING SYNTH");
        this.instruments.synth.push(new MaxiSynthProcessor());
      }
      else if(event.data.addSampler)
      {
        console.log("ADDING SAMPLER");
        this.instruments.sampler.push(new MaxiSamplerProcessor());
      }
      else if(event.data.noteon)
      {
        const data = event.data.noteon;
        this.instruments[data.instrument][data.index].handleNoteOn(data.val);
      }
      else if(event.data.noteoff)
      {
        const data = event.data.noteoff;
        this.instruments[data.instrument][data.index].handleNoteOff(data.val);
      }
      else if(event.data.tempo)
      {
		this.myClock.setTempo(event.data.tempo)
      }
      else if(event.data.parameters)
      {
		    const data = event.data.parameters;
        this.instruments[data.instrument][data.index].parameters = data.val
      }
      else if(event.data.audio !== undefined)
      {
        const data = event.data.audio;
        const audioData = this.translateFloat32ArrayToBuffer(data.val.audioBlob);
        this.instruments.sampler[data.index].samples[data.val.index].setSample(audioData);
      }
    }
  }

 translateFloat32ArrayToBuffer(audioFloat32Array) {

    var maxiSampleBufferData = new Module.VectorDouble();
    for (var i = 0; i < audioFloat32Array.length; i++) {
      maxiSampleBufferData.push_back(audioFloat32Array[i]);
    }
    return maxiSampleBufferData;
  }

  logGain(gain) {
    return 0.175 * Math.exp(gain * 0.465);
  }

  getInstruments() {
    return this.instruments.synth.concat(this.instruments.sampler)
  }

  onSample() {
    this.getInstruments().forEach((s)=> {
      s.onSample()
    })
    if(this.myClock)
    {
      this.myClock.ticker();
      if(this.myClock.tick)
      {
        this.playHead = this.myClock.playHead;
        this.getInstruments().forEach((s)=> {
          s.tick(this.playHead);
        })
        this.port.postMessage({playHead:this.playHead});
        if(this.myClock.playHead >= this.staticParameters.loop[0])
        {
          this.myClock.playHead = -1;
        }
      }
    }
  }

  process(inputs, outputs, parameters)
  {
    this.staticParameters = parameters;
    const outputsLength = outputs.length;
    for (let outputId = 0; outputId < outputsLength; ++outputId) {
      let output = outputs[outputId];

      for (let channel = 0; channel < output.length; ++channel) {
        let outputChannel;

        if (this.DAC === undefined || this.DAC.length === 0) {
          outputChannel = output[channel];
        } else {
          if (this.DAC[channel] === undefined)
            break;
          else {
            if (output[this.DAC[channel]] !== undefined) {
              outputChannel = output[this.DAC[channel]];
            } else {
              continue;
            }
          }
        }
        for (let i = 0; i < 128; ++i) {
          this.onSample();
          this.getInstruments().forEach((s)=> {
            outputChannel[i] += s.signal() * this.logGain(parameters.gain[0]);
          });
        }
      }
    }
    return true;
  }

}
registerProcessor("maxi-synth-processor", MaxiInstrumentsProcessor);
