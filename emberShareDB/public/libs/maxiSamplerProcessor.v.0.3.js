import Module from "https://mimicproject.com/libs/maximilian.wasmmodule.js"
class MaxiAudioProcessor extends AudioWorkletProcessor {

}
class MaxiSamplerProcessor extends MaxiAudioProcessor {
  static get parameterDescriptors() {
    const core = [{
        name: 'gain',
        defaultValue: 0.5
      },
      {
        name: 'rate',
        defaultValue: 1.0
      },
      {
        name: 'start',
        defaultValue: 0.0
      },
      {
        name: 'end',
        defaultValue: 0.0
      },
    ];

    let param = [];
    for(let i = 0; i < 4; i++)
    {
      core.forEach((v)=> {
        param.push({name:v.name+"_"+i, defaultValue:v.defaultValue});
      });
    }
    param.push({
      name: 'playHead',
      defaultValue: 0.0
    });
     param.push({
      name: 'loop',
      defaultValue: 96.0
    });
    return param;
  }

  constructor(options) {
    super();
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
    this.publisher = options.processorOptions.publisher;
    if(this.publisher)
    {
      console.log("making clock")
      this.myClock = new Module.maxiClock();
      this.myClock.setTempo(80);
      this.myClock.setTicksPerBeat(24);
    }
    this.dcf = new Module.maxiFilter();
    this.length = Number.MAX_SAFE_INTEGER;
    this.seqPtr = 0;
    this.sequence = [];
    this.port.onmessage = (event) => {
      if(event.data.sequence !== undefined)
      {
        this.sequence = event.data.sequence;
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
      if(event.data.tempo)
      {
		    this.myClock.setTempo(event.data.tempo)
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
      trig = this.sequence[this.seqPtr].t <= this.playHead;
    }
    return trig;
  }

  handleNoteOn(freq)
  {
    console.log("handleNoteOn", freq);
  	this.handleCmd({cmd:"noteon", f:freq});
  }

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

  updateSeq() {
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

  handleSeq() {
    if(this.myClock)
    {
      this.myClock.ticker();
      if(this.myClock.tick)
      {
        this.playHead = this.myClock.playHead;
        this.updateSeq();
        this.port.postMessage({playHead:this.playHead});
        if(this.myClock.playHead >= this.parameters.loop[0])
        {
          this.myClock.playHead = -1;
        }
      }
    }
    else
    {
      this.playHead = this.parameters.playHead[0];
      if(this.playHead !== this.prevPlayHead)
      {
        this.updateSeq();
      }
    }
  }

  remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
  }

  handleScheduling() {
    this.handleSeq();
  }

  signal(parameters) {
    this.parameters = parameters;
    this.handleScheduling();
    this.dcoOut = 0;
    let index = 0;
    for(let i = 0; i < this.samples.length; i++)
    {
      const s = this.samples[i];
      if(s.isReady())
      {
        let end = parameters['end_'+i][0];
        if(end == 0)
        {
          end = s.getLength();
        }
        let start = parameters['start_'+i][0];
        let rate = parameters['rate_'+i][0]
        let gain = parameters['gain_' + i][0];
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

        if (parameters.gain_0.length === 1) {
          for (let i = 0; i < 128; ++i) {
            outputChannel[i] = this.signal(parameters);
          }
        } else {
          for (let i = 0; i < 128; ++i) {
            outputChannel[i] = this.signal(parameters);
          }
        }
      }
    }
    return true;
  }

}

registerProcessor("maxi-sampler-processor", MaxiSamplerProcessor);
