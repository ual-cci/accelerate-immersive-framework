
/*
When writing the help file for this class remember to mention the direct
access to indevice and outdevice from the calling class (for unusual methods)
*/

class MIDI {

	constructor(){
		this.outputPorts = [];
		this.inputPorts = [];
		let midiclass = this;
        let nexusUI = document.createElement('script');
        let webmidi = document.createElement('script');
        webmidi.type = 'text/javascript';
        webmidi.async = true;
        webmidi.onload = ()=>{
          console.log("webmidi onload!");
          this.wm = WebMidi;
          this.wm.enable( (err)=> {
            if (err) {
              console.log("WebMidi could not be enabled.", err);
            } else {
              console.log("WebMidi enabled!");
              midiclass.inDevices();
              midiclass.outDevices();
              midiclass.setInDevice(0);
              midiclass.setOutDevice(0);
            }
          });
        };
        webmidi.src = 'https://cdn.jsdelivr.net/npm/webmidi@2.0.0';
        document.getElementsByTagName('head')[0].appendChild(webmidi);
	}

	inDevices(){
		var inputsString = "MIDI input devices are: \n";
		for (var i = 0; i < WebMidi.inputs.length; i++) {
			this.inputPorts[i] = WebMidi.inputs[i].name;
			inputsString = inputsString + "device " + i.toString() + ": " + WebMidi.inputs[i].name + "\n";
		}
		console.log(inputsString);
		return this.inputPorts;
	}

	outDevices(){
		var outputsString = "MIDI output devices are: \n";
		for (var i = 0; i < WebMidi.outputs.length; i++) {
			this.outputPorts[i] = WebMidi.outputs[i].name;
			outputsString = outputsString + "device " + i.toString() + ": " + WebMidi.outputs[i].name + "\n";
		}
		console.log(outputsString);
		return this.outputPorts;
	}

	setInDevice(device, remove=true){
		if(this.wm.enabled === false){
			console.log("setInDevice Message: Webmidi is not enabled yet!");
		} else {
			// in case the user does not want to remove the previous device
			if(remove === true && this.input !== undefined) {this.input.removeListener()};
			this.input = WebMidi.inputs[device];
			this.indevice = this.input;
		}
	}

	getInDevice(){
		console.log(this.input.name);
		return this.input.name;
	}

	setOutDevice(device){
		this.output = WebMidi.outputs[device];
		this.outdevice = this.output;
		return this.output;
	}

	getOutDevice(){
		console.log(this.input.name);
		return this.input.name;
	}

	//////////------------------------- SENDING MIDI OUT -----------------------
	noteOn(note, vel, channel, dur, time) {
		console.log("output Device : " + this.output.name);
		if(!vel) {vel = 60;}
		if(!channel) {channel = "all";}
		this.output.playNote(note, channel, {rawVelocity: vel, duration:dur, time: WebMidi.time + time});
	}

	noteOff(note, vel, channel, dur, time){
		if(!note) { // stop all sounds if there is no note specified // like midiflush
			for (var i = 0; i < 126; i++) {
				this.output.stopNote(i+1);
			}
		} else {
			if(!vel) {vel = 60;}
			if(!channel) {channel = "all";}
			this.output.stopNote(note, channel, {rawVelocity: vel, duration:dur, time: WebMidi.time + time});
		}
	}

	control(controller = 0, val = 0, channel = 1) {
		if(!channel) {channel = "all";}
		this.output.sendControlChange(controller, val, channel);
	}

	pitchBend(val, channel, dur, time){
		if(!channel) {channel = "all";}
		this.output.sendPitchBend(val, channel, { duration:dur, time: WebMidi.time + time}); // pitch bend values are between -1 and 1
	}

	afterTouch(note, val, channel, dur, time){
		if(!vel) {vel = 0.5;}
		if(!channel) {channel = "all";}
		this.output.sendKeyAftertouch(note, channel, val, { duration:dur, time: WebMidi.time + time});
	}

	channelAfterTouch(pressure, channel, dur, time){
		if(!channel) {channel = "all";}
		this.output.sendKeyAftertouch(pressure, channel, { duration:dur, time: WebMidi.time + time});
	}

	programChange(program, channel, dur, time){
		if(!channel) {channel = "all";}
		this.output.sendProgramChange(program, channel, { duration:dur, time: WebMidi.time + time});
	}

	midiflush(){
		for (var i = 0; i < 126; i++) {
			this.output.stopNote(i+1);
		}
	}
	//////////------------------------- RECEIVING MIDI IN -----------------------
	// Generating live-codeable wrappers for the MIDI listeners of incoming MIDI
	onNoteOn(func){
		if(this.wm.enabled === false){
				console.log("onNoteOn Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('noteon', "all",
				function (e) {
					func(e.note.number, e.rawVelocity, e.channel);
					console.log("Received 'noteon' message (" + e.note.name + e.note.octave + ").");
			});
		}
	}

	onNoteOff(func){
		if(this.wm.enabled === false){
				console.log("onNoteOff Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('noteoff', "all",
				function (e) {
					func(e.note.number, e.rawVelocity, e.channel);
			});
		}
	}

	onControl(func){
		if(this.wm.enabled === false){
				console.log("onControl Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('controlchange', "all",
				function (e) {
					// value, knob number, midi channel,
					func(e.value, e.controller.number, e.channel, e.type);
			});
		}
	}

	onPitchBend(func){
		if(this.wm.enabled === false){
				console.log("onPitchBend Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('pitchbend', "all",
				function (e) {
					// value, midi channel, type
					func(e.value, e.channel, e.type);
			});
		}
	}

	onAfterTouch(func){
		if(this.wm.enabled === false){
				console.log("onAfterTouch Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('keyaftertouch', "all",
				function (e) {
					// note number, value (0..1), midi channel, type
					func(e.note.number, e.value, e.channel, e.type);
			});
		}
	}

	onControlChange(func){
		if(this.wm.enabled === false){
				console.log("onControlChange Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('controlchange', "all",
				function (e) {
					// event value, controller.number, midi channel, type
					func(e.value, e.controller.number, e.channel, e.type);
			});
		}
	}

	onProgramChange(func){
		if(this.wm.enabled === false){
				console.log("onProgramChange Message: Webmidi is not enabled yet!");
		} else {
			this.input.addListener('programchange', "all",
				function (e) {
					// event value, controller.number, midi channel, type
					func(e.value, e.controller.number, e.channel, e.type);
			});
		}
	}
}
