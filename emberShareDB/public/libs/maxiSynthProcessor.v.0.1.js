import Module from 'https://mimicproject.com/libs/maximilian.wasmmodule.js';
class MaxiSynthProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
        name: 'gain',
        defaultValue: 0.5
      },
      {
        name: 'poly',
        defaultValue: 0.0
      },
      {
        name: 'oscFn',
        defaultValue: 0
      },
      {
        name: 'frequency',
        defaultValue: 440.0
      },
      {
        name: 'frequency2',
        defaultValue: 220.0,
      },
      {
        name: 'attack',
        defaultValue: 1000.0
      },
      {
        name: 'decay',
        defaultValue: 1000.0
      },
      {
        name: 'sustain',
        defaultValue: 1.0
      },
      {
        name: 'release',
        defaultValue: 1000.0
      },
      {
        name: 'lfoFrequency',
        defaultValue: 0.0
      },
      {
        name: 'lfoPitchMod',
        defaultValue: 1.0
      },
      {
        name: 'lfoFilterMod',
        defaultValue: 1.0
      },
      {
        name: 'lfoAmpMod',
        defaultValue: 0.0
      },
      {
        name: 'adsrAmpMod',
        defaultValue: 1.0
      },
      {
        name: 'adsrPitchMod',
        defaultValue: 1.0
      },
      {
        name: 'adsrFilterMod',
        defaultValue: 1.0
      },
      {
        name: 'cutoff',
        defaultValue: 4000
      },
      {
        name: 'Q',
        defaultValue: 1.0
      }
    ];
  }

  constructor() {
    super();
    //Max polyphony
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
    this.timer = new Module.maxiOsc();
    this.length = Number.MAX_SAFE_INTEGER;
    this.ptr = 0;
    this.seqPtr = 0;
    this.sequence = [];
    this.poly = false;
    this.port.onmessage = (event) => {
      if(event.data.sequence)
      {
        this.sequence = event.data.sequence;
      }
      else if(event.data.length)
      {
        this.length = event.data.length;
      }
      else if(event.data.noteon)
      {
		this.handleNoteOn(event.data.noteon);
      }
      else if(event.data.noteoff)
      {
		this.handleNoteOff(event.data.noteoff);
      }
    }
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
      console.log("all oscs in use, popping release early");
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

  //If theres a command to trigger in the sequence
  doTrig() {
    let trig = false;
    if(this.seqPtr < this.sequence.length)
    {
      trig = this.sequence[this.seqPtr].t <= this.ptr;
    }
    return trig;
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
        this.handleCmd({cmd:"noteon", f:this.parameters.frequency[0]});
        this.handleCmd({cmd:"noteon", f:this.parameters.frequency2[0]});
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
      this.handleCmd({cmd:"noteoff", f:this.parameters.frequency[0]});
      this.handleCmd({cmd:"noteoff", f:this.parameters.frequency2[0]});;
    }
  }

  //Execute noteon/noteoffs (whether sequenced or manually triggered)
  handleCmd(nextCmd) {
    if(this.parameters)
    {
      const f = nextCmd.f;
      if(nextCmd.cmd === "noteon")
      {
        const o =  this.getAvailableOsc();
        //console.log("on", f, o);
        if(o >= 0)
        {
          this.adsr[o].setAttack(this.parameters.attack[0]);
          this.adsr[o].setDecay(this.parameters.decay[0]);
          this.adsr[o].setSustain(this.parameters.sustain[0]);
          this.adsr[o].setRelease(this.parameters.release[0]);
          this.triggered.push({o:o, f:f});
          this.adsr[o].trigger = 1;
        }
      }
      else if(nextCmd.cmd === "noteoff")
      {
        let release = -1;
        const releaseTime = (this.ptr + (this.parameters.release[0] / 1000 * this.sampleRate));
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
    this.ptr++;
    if(this.ptr > this.length)
    {
      //Wrap around any release times
      for(let i = 0; i < this.released.length; i++)
      {
        this.released[i].off = this.released[i].off % this.length;
      }
      //Restart loop
      this.ptr = this.seqPtr = 0;
    }
  }

  handleSeq() {
    while(this.doTrig())
    {
      const nextCmd = this.sequence[this.seqPtr]
      this.handleCmd(nextCmd);
      this.seqPtr++;
    }
  }

  remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
  }

  removeReleased() {
    let toRemove = [];
    this.released.forEach((o, i)=>{
      if(this.ptr >= o.off)
      {
        toRemove.push(o);
      }
    });
    for(let i = 0; i < toRemove.length; i++)
    {
      this.remove(this.released, toRemove[i]);
    }
  }

  handleScheduling() {
    this.removeReleased();
    this.handleSeq();
    this.handleLoop();
  }

  signal(parameters) {
    this.parameters = parameters;
    this.poly = this.parameters.poly[0] == 1;
    this.handleScheduling();

    const lfoOut = this.lfo.sinewave(parameters.lfoFrequency[0]);
    const oscFn = this.getOscFn(parameters.oscFn[0]);
    this.dcoOut = 0;
    const out = this.triggered.concat(this.released);

    for(let o of out)
    {
      //console.log(o.o, o.f);
      const envOut = this.adsr[o.o].adsr(1, this.adsr[o.o].trigger);
      const pitchMod = (parameters.adsrPitchMod[0] * envOut) + (lfoOut * parameters.lfoPitchMod[0]);
      const ampOsc =  (lfoOut * parameters.lfoAmpMod[0])
      const ampMod = (envOut * parameters.adsrAmpMod[0]) + (ampOsc * envOut);
      const f = this.poly ? o.f : o.o % 2 == 0 ? parameters.frequency[0] : parameters.frequency2[0];
      let osc;
      if(oscFn === "noise")
      {
        osc = this.dco[o.o].noise();
      }
      else
      {
        osc = this.dco[o.o][oscFn](f + pitchMod);
      }
      this.dcoOut += (osc * ampMod);
    }

    //Filter
	//let filterEnv = envOut * parameters.adsrFilterMod[0]
    const filterEnv = 1;
    const filterOsc = lfoOut * parameters.lfoFilterMod[0];
    let cutoff = parameters.cutoff[0];
    cutoff = (cutoff * filterEnv) + filterOsc;
    if (cutoff > 20000) {
      cutoff = 20000;
    }
    if (cutoff < 40) {
      cutoff = 40;
    }
    this.dcfOut = this.dcf.lores(this.dcoOut, cutoff, parameters.Q[0]);
   	return this.dcfOut;
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

  logGain(gain) {
    return 0.0375 * Math.exp(gain * 0.465);
  }

  process(inputs, outputs, parameters)
  {
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

        if (parameters.gain.length === 1) {
          for (let i = 0; i < 128; ++i) {
            outputChannel[i] = this.signal(parameters) * this.logGain(parameters.gain[0]);
          }
        } else {
          for (let i = 0; i < 128; ++i) {
            outputChannel[i] = this.signal(parameters) * this.logGain(parameters.gain[i]);
          }
        }
      }
    }
    return true;
  }

}

registerProcessor("maxi-synth-processor", MaxiSynthProcessor);
