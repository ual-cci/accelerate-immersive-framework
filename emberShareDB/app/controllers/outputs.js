import Controller from '@ember/controller';
import { computed, set } from '@ember/object';
export default Controller.extend({
  examples:computed(()=>{return [
    {title:"External", docs:[
      //OSC
      {docid:"247e4538-0366-b735-9052-0e875a96a140",desc:"As you cannot OSC directly form a browser, this connects to a local Node.js program via webosckets then forwards the data out via OSC, where you can do with it what you will."},
      //MIDI
      {docid:"034ea170-483e-229a-f0e2-837d76c721c0",desc:"This uses WebMidi to send the output values as control changes. Note WebMidi is curently only supported in Chrome. You can send to external devices or connect to your internal MIDI bus. First refresh devices, select your output device and channel from the dropdown"},
    ]},
    {title:"MaxiInstrument Examples",docs:[
      //MIDI
      {docid:"73d93516-e0de-a85c-5fc7-c6cc03f4666b",desc:"Using AudioWorklet backed synthesiser and sampler. This uses WebMidi to send the output values as control changes. Note WebMidi is curently only supported in Chrome. You can send to external devices or connect to your internal MIDI bus. First refresh devices, then select your MIDI source from the dropdown"},
      //NEXUS
      {docid:"d57c9d9b-284d-9ab3-8118-e7c33eafeeaf",desc:"Using AudioWorklet backed synthesiser and sampler. This allows you use a one-shot sequencer to program a tune yourself, whilst mapping the parameters of the synths to one of the inputs. "},
      //MAGENTA
      {docid:"fa99819f-775c-2552-198c-2340739a1b5c",desc:"Using AudioWorklet backed synthesiser and sampler. This shows you how you generate a sequence using Google's Magenta models and plug that straight into a synth"},
      //MIDIFILE
      {docid:"1cc85746-67d2-0cef-7f69-a238c6d2b489",desc:"Using AudioWorklet backed synthesiser and sampler. Upload a MIDI file as an asset andd playback on a MaxiSynth"},
      //Handcode
      {docid:"f6bdb7ad-4cb0-8652-0dee-f0c7db9fede5",desc:"Using AudioWorklet backed synthesiser and sampler. Handcode a sequence to playback on an instrument."},
    ]},
  ]}),
  actions: {
    onClick(example) {
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
