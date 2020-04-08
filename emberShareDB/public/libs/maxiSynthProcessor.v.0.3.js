//import Maximilian from "https://mimicproject.com/libs/maximilian.wasmmodule.v.0.3.js"
import Maximilian from "http://localhost:4200/libs/maximilian.wasmmodule.v.0.3.js"

class ParameterWriter {
 // From a RingBuffer, build an object that can enqueue a parameter change in
 // the queue.
 constructor(ringbuf) {
   if (ringbuf.type() != "Uint8Array") {
     throw "This class requires a ring buffer of Uint8Array";
   }
   const SIZE_ELEMENT = 5;
   this.ringbuf = ringbuf;
   this.mem = new ArrayBuffer(SIZE_ELEMENT);
   this.array = new Uint8Array(this.mem);
   this.view = new DataView(this.mem);
 }
 // Enqueue a parameter change for parameter of index `index`, with a new value
 // of `value`.
 // Returns true if enqueuing suceeded, false otherwise.
 enqueue_change(index, value) {
   const SIZE_ELEMENT = 5;
   this.view.setUint8(0, index);
   this.view.setFloat32(1, value);
   if (this.ringbuf.available_write() < SIZE_ELEMENT) {
     return false;
   }
   return this.ringbuf.push(this.array) == SIZE_ELEMENT;
 }
}

class ParameterReader {
 constructor(ringbuf) {
   const SIZE_ELEMENT = 5;
   this.ringbuf = ringbuf;
   this.mem = new ArrayBuffer(SIZE_ELEMENT);
   this.array = new Uint8Array(this.mem);
   this.view = new DataView(this.mem);
 }
 dequeue_change(o) {
   if (this.ringbuf.empty()) {
     return false;
   }
   var rv = this.ringbuf.pop(this.array);
   o.index = this.view.getUint8(0);
   o.value = this.view.getFloat32(1);

   return true;
 }
}

class RingBuffer {
 static getStorageForCapacity(capacity, type) {
   if (!type.BYTES_PER_ELEMENT) {
     throw "Pass in a ArrayBuffer subclass";
   }
   var bytes = 8 + (capacity + 1) * type.BYTES_PER_ELEMENT;
   return new SharedArrayBuffer(bytes);
 }
 // `sab` is a SharedArrayBuffer with a capacity calculated by calling
 // `getStorageForCapacity` with the desired capacity.
 constructor(sab, type) {
   if (!ArrayBuffer.__proto__.isPrototypeOf(type) &&
     type.BYTES_PER_ELEMENT !== undefined) {
     throw "Pass a concrete typed array class as second argument";
   }

   // Maximum usable size is 1<<32 - type.BYTES_PER_ELEMENT bytes in the ring
   // buffer for this version, easily changeable.
   // -4 for the write ptr (uint32_t offsets)
   // -4 for the read ptr (uint32_t offsets)
   // capacity counts the empty slot to distinguish between full and empty.
   this._type = type;
   this.capacity = (sab.byteLength - 8) / type.BYTES_PER_ELEMENT;
   this.buf = sab;
   this.write_ptr = new Uint32Array(this.buf, 0, 1);
   this.read_ptr = new Uint32Array(this.buf, 4, 1);
   this.storage = new type(this.buf, 8, this.capacity);
 }
 // Returns the type of the underlying ArrayBuffer for this RingBuffer. This
 // allows implementing crude type checking.
 type() {
   return this._type.name;
 }
 // Push bytes to the ring buffer. `bytes` is an typed array of the same type
 // as passed in the ctor, to be written to the queue.
 // Returns the number of elements written to the queue.
 push(elements) {
   var rd = Atomics.load(this.read_ptr, 0);
   var wr = Atomics.load(this.write_ptr, 0);

   if ((wr + 1) % this._storage_capacity() == rd) {
     // full
     return 0;
   }

   let to_write = Math.min(this._available_write(rd, wr), elements.length);
   let first_part = Math.min(this._storage_capacity() - wr, to_write);
   let second_part = to_write - first_part;

   this._copy(elements, 0, this.storage, wr, first_part);
   this._copy(elements, first_part, this.storage, 0, second_part);

   // publish the enqueued data to the other side
   Atomics.store(
     this.write_ptr,
     0,
     (wr + to_write) % this._storage_capacity()
   );

   return to_write;
 }
 // Read `elements.length` elements from the ring buffer. `elements` is a typed
 // array of the same type as passed in the ctor.
 // Returns the number of elements read from the queue, they are placed at the
 // beginning of the array passed as parameter.
 pop(elements) {
   var rd = Atomics.load(this.read_ptr, 0);
   var wr = Atomics.load(this.write_ptr, 0);

   if (wr == rd) {
     return 0;
   }

   let to_read = Math.min(this._available_read(rd, wr), elements.length);

   let first_part = Math.min(this._storage_capacity() - rd, elements.length);
   let second_part = to_read - first_part;

   this._copy(this.storage, rd, elements, 0, first_part);
   this._copy(this.storage, 0, elements, first_part, second_part);

   Atomics.store(this.read_ptr, 0, (rd + to_read) % this._storage_capacity());

   return to_read;
 }

 // True if the ring buffer is empty false otherwise. This can be late on the
 // reader side: it can return true even if something has just been pushed.
 empty() {
   var rd = Atomics.load(this.read_ptr, 0);
   var wr = Atomics.load(this.write_ptr, 0);

   return wr == rd;
 }

 // True if the ring buffer is full, false otherwise. This can be late on the
 // write side: it can return true when something has just been poped.
 full() {
   var rd = Atomics.load(this.read_ptr, 0);
   var wr = Atomics.load(this.write_ptr, 0);

   return (wr + 1) % this.capacity != rd;
 }

 // The usable capacity for the ring buffer: the number of elements that can be
 // stored.
 capacity() {
   return this.capacity - 1;
 }

 // Number of elements available for reading. This can be late, and report less
 // elements that is actually in the queue, when something has just been
 // enqueued.
 available_read() {
   var rd = Atomics.load(this.read_ptr, 0);
   var wr = Atomics.load(this.write_ptr, 0);
   return this._available_read(rd, wr);
 }

 // Number of elements available for writing. This can be late, and report less
 // elements that is actually available for writing, when something has just
 // been dequeued.
 available_write() {
   var rd = Atomics.load(this.read_ptr, 0);
   var wr = Atomics.load(this.write_ptr, 0);
   return this._available_write(rd, wr);
 }

 // private methods //

 // Number of elements available for reading, given a read and write pointer..
 _available_read(rd, wr) {
   if (wr > rd) {
     return wr - rd;
   } else {
     return wr + this._storage_capacity() - rd;
   }
 }

 // Number of elements available from writing, given a read and write pointer.
 _available_write(rd, wr) {
   let rv = rd - wr - 1;
   if (wr >= rd) {
     rv += this._storage_capacity();
   }
   return rv;
 }

 // The size of the storage for elements not accounting the space for the index.
 _storage_capacity() {
   return this.capacity;
 }

 // Copy `size` elements from `input`, starting at offset `offset_input`, to
 // `output`, starting at offset `offset_output`.
 _copy(input, offset_input, output, offset_output, size) {
   for (var i = 0; i < size; i++) {
     output[offset_output + i] = input[offset_input + i];
   }
 }
}

class MaxiSamplerProcessor {
   constructor() {
    //Max polyphony
    const voices = 8;
    this.sampleRate = 44100;
    this.DAC = [0];
    this.dcoOut = 0;
    //this.dcfOut = 0;
    this.samples = [];
    this.adsr = [];
    this.playHead = 0;
    this.prevPlayHead = 0;
    for(let i = 0; i < voices; i++)
    {
      this.samples.push(new Maximilian.maxiSample());
      this.adsr.push(new Maximilian.maxiEnv());
    }
    //this.dcf = new Maximilian.maxiFilter();
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

  externalNoteOn(freq)
  {
  	this.handleCmd({cmd:"noteon", f:freq});
  }

  //Execute noteon/noteoffs (whether sequenced or manually triggered)
  handleCmd(nextCmd) {
    if(this.parameters)
    {
      const f = nextCmd.f;
      if(nextCmd.cmd === "noteon")
      {
        this.samples[f].trigger();
      }
    }
  }

  handleLoop() {
    this.seqPtr = 0;
  }

  tick(playHead, loopEnd) {
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

  //CURRENTLY UNUSED STUBS
  onSample() {}
  onStop() {}

  signal(parameters) {
    this.dcoOut = 0;
    if(this.parameters)
    {
      for(let i = 0; i < this.samples.length; i++)
      {
        const s = this.samples[i];
        if(s.isReady())
        {
          // let end = this.parameters['end_'+i].val;
          // if(end == 0)
          // {
          //   end = s.getLength();
          // }
          // let start = this.parameters['start_'+i].val;
          let rate = this.parameters['rate_'+i].val
          let gain = this.parameters['gain_' + i].val;
          //let gain = i == 0 ? 1:0;
          this.dcoOut += s.playOnce(rate) * gain;
        }
        this.adsr[i].trigger = 0;
      }
    }
    else {
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
      this.dco.push(new Maximilian.maxiOsc());
      this.adsr.push(new Maximilian.maxiEnv());
    }
    this.lfo = new Maximilian.maxiOsc();
    this.dcf = new Maximilian.maxiFilter();
    this.seqPtr = 0;
    this.samplePtr = 0;
    this.sequence = [];
    this.playHead = 0;
    this.prevPlayHead = 0;
  }

    //Find the oscillator to release for freq (for noteoff)
  getTriggeredForFreq(f) {
    let osc;
    for(let i = 0; i < this.triggered.length; i++)
    {
      if(this.triggered[i].f == f)
      {
        osc = this.triggered[i];
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
    if(this.parameters.poly.val == 1)
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
  externalNoteOn(freq)
  {
    if(!this.isFreqTriggered(freq))
    {
      if(this.parameters.poly.val == 1)
      {
        this.handleCmd({cmd:"noteon", f:freq});
      }
      else if(this.parameters)
      {
        this.handleCmd({cmd:"noteon", f:this.parameters.frequency.val});
        this.handleCmd({cmd:"noteon", f:this.parameters.frequency2.val});
      }
    }
  }

  //Only release if freq triggered
  externalNoteOff(freq)
  {
    if(this.parameters.poly.val == 1)
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

  triggerNoteOn(freq)
  {
    const o = this.getAvailableOsc();
    //This will be -1 if no available oscillators
    if(o >= 0)
    {
      //
      this.adsr[o].setAttack(this.parameters.attack.val);
      this.adsr[o].setDecay(this.parameters.decay.val);
      this.adsr[o].setSustain(this.parameters.sustain.val);
      this.adsr[o].setRelease(this.parameters.release.val);
      this.triggered.push({o:o, f:freq});
      this.adsr[o].trigger = 1;
      //console.log("triggering", freq, o);
    }
  }

  //Execute noteon/noteoffs (whether sequenced or manually triggered)
  handleCmd(nextCmd) {
    if(this.parameters)
    {
      const f = nextCmd.f;
      if(nextCmd.cmd === "noteon")
      {
        if(this.parameters.poly.val == 1)
        {
          this.triggerNoteOn(f)
        }
        else
        {
          this.releaseAll();
          this.triggerNoteOn(f)
          this.triggerNoteOn(f)
        }
      }
      else if(nextCmd.cmd === "noteoff")
      {
        let release = -1;
        if(this.parameters.poly.val == 1)
        {
          //Release based on freq match
          release = this.getOscToRelease(f)
          if(release >= 0)
          {
            this.adsr[release].trigger = 0;
            const t =  this.getTriggeredForFreq(f);
            let releaseTime = this.samplePtr +
              ((this.parameters.release.val / 1000) * this.sampleRate);
            releaseTime = Math.round(releaseTime)
            this.released.push({f:f, o:release, off:releaseTime});
            //console.log("releasing", this.parameters.release.val, releaseTime, this.samplePtr, this.sampleRate)
            this.remove(this.triggered, t);
          }
        }
        else if(this.triggered.length >= 2)
        {
          this.releaseAll();
        }
      }
    }
  }

  releaseAll() {
    //Just release the oscilators that are on, freq doesnt matter
    const releaseTime = (this.samplePtr + (this.parameters.release.val / 1000 * this.sampleRate));
    for(let i = 0; i < this.triggered.length; i++)
    {
      const release = this.triggered[i].o;
      this.adsr[release].trigger = 0;
      this.released.push({f:0, o:release, off:releaseTime});
    }
    for(let i = 0; i < this.released.length; i++)
    {
      this.remove(this.triggered, this.triggered[i]);
    }
  }

  handleLoop(loopEnd) {
	  //Wrap around any release times
    for(let i = 0; i < this.released.length; i++)
    {
      this.released[i].off = this.released[i].off % loopEnd;
      //console.log("wrapping round", this.released[i].off, this.released[i].f)
    }
    this.midiPanic();
    //Restart loop
    //console.log(this.samplePtr)
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

  tick(playHead, loopEnd) {
    this.playHead = playHead;
    //console.log(playHead)
    if(this.playHead == 0 && this.prevPlayHead > 0)
    {
      this.handleLoop(loopEnd);
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
      //Because of the way maxi adsr works, check envelope has actually
      //finished releasing
      if(this.samplePtr >= (o.off + 1) && o.lastVol < 0.00001)
      {
        //console.log("removing", o.off, o.lastVol)
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

  onStop() {
    this.midiPanic();
  }

  midiPanic() {
    this.triggered.forEach((trig)=> {
      this.externalNoteOff(trig.f);
    });
  }

  signal() {
    if(this.parameters)
    {
      const poly = this.parameters.poly.val == 1;

      const lfoOut = this.lfo.sinewave(this.parameters.lfoFrequency.val);
      const oscFn = this.getOscFn(this.parameters.oscFn.val);
      this.dcoOut = 0;
      const out = this.triggered.concat(this.released);

      for(let o of out)
      {
        const envOut = this.adsr[o.o].adsr(1, this.adsr[o.o].trigger);
        o.lastVol = envOut;
        const pitchMod = (this.parameters.adsrPitchMod.val * envOut) + (lfoOut * this.parameters.lfoPitchMod.val);
        const ampOsc =  ((lfoOut + 1 ) / 2) * this.parameters.lfoAmpMod.val;
        const normalise = poly ? this.dco.length : 2.0;
        const ampMod = (envOut + (ampOsc * envOut)) / 3;
        //const ampMod = envOut / 3;
        let f = poly ? o.f : o.o % 2 == 0 ? this.parameters.frequency.val : this.parameters.frequency2.val;
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
        this.dcoOut += (osc * ampMod * this.parameters.gain.val);
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
      //console.log("just 0")
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
      let core =  [
        {
          name: 'loop',
          defaultValue: Number.MAX_SAFE_INTEGER
        },
        {
          name: 'playHead',
          defaultValue: 0.0
        }
      ];
      return core;
    }

   constructor(options) {
    super();
    //Max polyphony
    this.instruments = {synth:[], sampler:[]};
    this.TICKS_PER_BEAT = 24;
    this.myClock = new Maximilian.maxiClock();
    this.myClock.setTempo(80);
    this.myClock.setTicksPerBeat(this.TICKS_PER_BEAT);
    this.isPlaying = true;
    this.o = { index: 0, value: 0 };
    this.port.onmessage = (event) => {
      if (event.data.type === "recv-param-queue") {
        const b = new RingBuffer(event.data.data, Uint8Array);
        this._param_reader = new ParameterReader(b);
      }
      else if(event.data.sequence !== undefined)
      {
        const data = event.data.sequence;
        this.instruments[data.instrument][data.index].sequence = data.val;
      }
      else if(event.data.addSynth !== undefined)
      {
        console.log("ADDING SYNTH");
        this.instruments["synth"].push(new MaxiSynthProcessor());
      }
      else if(event.data.addSampler !== undefined)
      {
        console.log("ADDING SAMPLER");
        this.instruments["sampler"].push(new MaxiSamplerProcessor());
      }
      else if(event.data.noteon !== undefined)
      {
        const data = event.data.noteon;
        this.instruments[data.instrument][data.index].externalNoteOn(data.val);
      }
      else if(event.data.noteoff !== undefined)
      {
        const data = event.data.noteoff;
        this.instruments[data.instrument][data.index].externalNoteOff(data.val);
      }
      else if(event.data.tempo !== undefined)
      {
		    this.myClock.setTempo(event.data.tempo)
      }
      else if(event.data.parameters !== undefined)
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
      else if(event.data.togglePlaying !== undefined)
      {
        this.toggleIsPlaying();
      }
      else if(event.data.rewind !== undefined)
      {
        this.rewind();
      }
    }
  }

 translateFloat32ArrayToBuffer(audioFloat32Array) {

    var maxiSampleBufferData = new Maximilian.VectorDouble();
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

  toggleIsPlaying() {
    console.log("PAUSE/PLAY")
    this.isPlaying = !this.isPlaying;
    if(!this.isPlaying)
    {
      this.getInstruments().forEach((s)=> {
        s.onStop()
      })
    }
  }

  rewind() {
    this.myClock.playHead = -1;
  }

  onSample() {
    this.getInstruments().forEach((s)=> {
      s.onSample()
    })
    this.handleClock();
    this.handleRingBuf();
  }

  handleRingBuf() {
    let index, value;
    if(this._param_reader !== undefined)
    {
      if (this._param_reader.dequeue_change(this.o)) {
        console.log("param change: ", this.o.index, this.o.value);
        this.amp = this.o.value;
      }
    }
  }

  handleClock() {
    if(this.myClock && this.isPlaying)
    {
      this.myClock.ticker();
      if(this.myClock.tick)
      {
        const loopEnd = this.staticParameters.loop[0];
        const beatLength = 60 / this.myClock.bpm;
        const loopInSamples = (loopEnd / 24) * beatLength * 44100;
        this.getInstruments().forEach((s)=> {
          s.tick(this.myClock.playHead, loopInSamples);
        })
        //this.port.postMessage({playHead:this.myClock.playHead});
        if(this.myClock.playHead >= loopEnd)
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
            outputChannel[i] += s.signal();
          });
        }
      }
    }
    return true;
  }

}
registerProcessor("maxi-synth-processor", MaxiInstrumentsProcessor);
