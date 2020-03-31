import Controller from '@ember/controller';
import { computed, set } from '@ember/object';
export default Controller.extend({
  examples:computed(()=>{return [
    {title:"Audio Remix",docs:[
      //LSTM
      {docid:"84bf177b-af84-85c3-4933-32076561aca0",desc:" This demonstrates an LSTM audio generation process using MAGNet, a spectral approach to audio analysis and generation with neural networks. The techniques included here were used as part of the Mezzanine Vs. MAGNet project featured as part of the Barbican's AI: More than Human exhibition. Here you can try out some pre-trained models. "},
      //bbcut
      {docid:"50568259-fd05-e122-aa39-d3e39e39a6c0",desc:"BBCut is a remix library based on MMLL.js for beat tracking. The input is cut up live into stuttering buffers, with the cut points determined by tracking of the primary metrical level in the music."},
    ]},
    {title:"Generative Music", docs:[
      //mario
      {docid:"a8baea19-711f-4e43-46ab-71e5212ed5db",desc:"What if AI finished the Mario theme song? Use Magenta's MusicRNN model to experiment with different continuations of the catchiest computer game music"},
      //merk
      {docid:"305ac2de-3362-6c8d-e04c-d5a1072cc1c5",desc:"A Remapping of Magenta's MusicVAE drum models from London, UK. We sample the latent space, squish the hihats and play around with the drum mappings to see what happens if we make things a little bit more grimey. "},
      //markov
      {docid:"5f827ca2-aae0-b755-e432-f815c00a482a",desc:"Quickly build your own generative drum models using keyboard input."},
    ]},
    {title:"User Input",docs:[
      //audio triggers
      {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd",desc:"Train an audio classifier on your own percussive sounds and use it to reconfigure music tracks live."},
      //shelly drum machine
      {docid:"c89860a4-824a-5dfc-ff90-412f58531f5a",desc:"Play in rhythms using your microphone and have them remixed into new beats."},
      //FaceAPI
      {docid:"9dc4eaf4-93db-26e8-9357-155eb152ea44",desc:"Train a granular sythesiser to respond to the emotions of your face."},
    ]},
    {title:"Synthesis", docs:[
      //evolib
      {docid:"3e67cfd2-c171-5bf1-db4c-a5b0cde68e7e",desc:"Evolib.js is a library for using a genetic algorithm to breed virtual modular synthesizer patches. Breed sounds together to make new ones!"},
      //conceptualr synth
      {docid:"83b58e5e-487f-fd88-158e-239d85202bce",desc:"Conceptular Beat Synthesiser is a drum machine powered by machine learning.  There are no samples, instead the system uses neural network models of sounds. The real power of this synthesiser lies in the way you can manipulate the sound models using parameterised envelopes."},
    ]},
    {title:"Audio FX",docs:[
      //spectral delay
      {docid:"e8524aa9-d6a6-0809-83ef-e7b0891802bc",desc:"Spectral delay based on spectral resynthesis. The input is analysed by FFT, then particular spectral bins can be independently delayed and fed back on themselves to make a diffuse delayed filterbank."},
    ]},
    {title:"Text",docs:[
      //lyrics
      {docid:"66a88951-a7d6-cc9f-0d8b-b043e4b952b0",desc:"Having trouble writing the lyrics to your song? Using a pre-trained model on common English words, we can find similar words , find an \"average\" of two words, and \"solve\" two words like an analogy "},
    ]}
  ]}),
  actions: {
    onClick(example) {
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
