import Module from 'https://mimicproject.com/libs/maximilian.wasmmodule.js';
class MaxiSamplerProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
        name: 'gain',
        defaultValue: 0.5
      },
      {
        name: 'attack',
        defaultValue: 1.0
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
        name: 'cutoff',
        defaultValue: 4000
      },
      {
        name: 'Q',
        defaultValue: 1.0
      },
      {
        name: 'rate',
        defaultValue: 1.0
      },
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
    this.samples = [];
    this.adsr = [];
    for(let i = 0; i < voices; i++)
    {
      this.samples.push(new Module.maxiSample());
      this.adsr.push(new Module.maxiEnv());
    }
    this.dcf = new Module.maxiFilter();
    this.timer = new Module.maxiOsc();
    this.length = Number.MAX_SAFE_INTEGER;
    this.ptr = 0;
    this.seqPtr = 0;
    this.sequence = [];
    this.port.onmessage = (event) => {
      if(event.data.sequence !== undefined)
      {
        this.sequence = event.data.sequence;
      }
      if(event.data.length !== undefined)
      {
        this.length = event.data.length;
      }
      if(event.data.noteon !== undefined)
      {
		this.handleNoteOn(event.data.noteon);
      }
      if(event.data.audioBlob !== undefined)
      {
        const data = this.translateFloat32ArrayToBuffer(event.data.audioBlob);
		this.samples[event.data.index].setSample(data);
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

  doTrig() {
    let trig = false;
    if(this.seqPtr < this.sequence.length)
    {
      trig = this.sequence[this.seqPtr].t <= this.ptr;
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
        this.adsr[f].setAttack(this.parameters.attack[0]);
        this.adsr[f].setDecay(this.parameters.decay[0]);
        this.adsr[f].setSustain(this.parameters.sustain[0]);
        this.adsr[f].setRelease(this.parameters.release[0]);
        this.adsr[f].trigger = 1;
        console.log("trigger",f);
        this.samples[f].trigger();
      }
    }
  }

  handleLoop() {
    this.ptr++;
    if(this.ptr > this.length)
    {
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

  handleScheduling() {
    this.handleSeq();
    this.handleLoop();
  }

  signal(parameters) {
    this.parameters = parameters;
    this.handleScheduling();
    this.dcoOut = 0;
    let index = 0;
    for(let s of this.samples)
    {
      if(s.isReady())
      {
        //console.log("ready", index);
        const envOut = this.adsr[index].adsr(1, this.adsr[index].trigger);
      	this.dcoOut += (s.playOnce(parameters.rate[0]) * envOut);
      }
      this.adsr[index].trigger = 0;
      index++;

    }

    //Filter
    const filterEnv = 1;
    let cutoff = parameters.cutoff[0];
    cutoff = (cutoff * filterEnv);
    if (cutoff > 20000) {
      cutoff = 20000;
    }
    if (cutoff < 40) {
      cutoff = 40;
    }
    this.dcfOut = this.dcf.lores(this.dcoOut, cutoff, parameters.Q[0]);
   	return this.dcfOut;
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

registerProcessor("maxi-sampler-processor", MaxiSamplerProcessor);
