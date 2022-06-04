import Service from '@ember/service';
import { computed } from '@ember/object';

export default Service.extend({
  examples:computed(()=>{return [
    {title:'User Input',examples:[
      //
      {id:'kick-classifier', docid:'a4c91621-199c-65b5-e355-2aadfc27c33f',desc:'Control this audio track with objects and your webcam'},
      //
      {id:'sun-on-your-skin', docid:'2fdd8ba2-3cb8-1838-49a5-fe9cfe6650ed',desc:'Map the movements of your body to a synth soundscape.'},
      {id:'space-drum', docid:'fd439a02-9ca3-b9db-9054-40aa3aa5cbb5',desc:'What if the drum machine can understand your tapping and make up all the details for you?'},
      {id:'auto-pilot', docid:'37bd95c1-c1ff-a09a-55eb-eb8cc4884e88',desc:'Make a 2D parameter map for theis synth then plot journeys around it!'}

    ]},
    {title:'Generative Music', examples:[

      //merk
      {id:'merk', docid:'305ac2de-3362-6c8d-e04c-d5a1072cc1c5',desc:'A Remapping of Magenta\'s MusicVAE drum models from London, UK. We sample the latent space, squish the hihats and play around with the drum mappings to see what happens if we make things a little bit more grimey. '},
      //mario
      {id:'mario',docid:'a8baea19-711f-4e43-46ab-71e5212ed5db',desc:'What if AI finished the Mario theme song? Use Magenta\'s MusicRNN model to experiment with different continuations of the catchiest computer game music'},
      //markov
      {id:'markov', docid:'5f827ca2-aae0-b755-e432-f815c00a482a',desc:'Quickly build your own generative drum models using keyboard input.'},
    ]},

    {title:'Audio Remix',examples:[
      //LSTM
      {id:'magnet', docid:'84bf177b-af84-85c3-4933-32076561aca0',desc:' This demonstrates an LSTM audio generation process using MAGNet, a spectral approach to audio analysis and generation with neural networks. The techniques included here were used as part of the Mezzanine Vs. MAGNet project featured as part of the Barbican\'s AI: More than Human exhibition. Here you can try out some pre-trained models. '},
      //bbcut
      {id:'bbcut',docid:'50568259-fd05-e122-aa39-d3e39e39a6c0',desc:'BBCut is a remix library based on MMLL.js for beat tracking. The input is cut up live into stuttering buffers, with the cut points determined by tracking of the primary metrical level in the music.'},
    ]},
    {title:'Synthesis', examples:[
      //evolib
      {id:'evolib', docid:'3e67cfd2-c171-5bf1-db4c-a5b0cde68e7e',desc:'Evolib.js is a library for using a genetic algorithm to breed virtual modular synthesizer patches. Breed sounds together to make new ones!'},
      //conceptualr synth
      {id:'conceptular', docid:'83b58e5e-487f-fd88-158e-239d85202bce',desc:'Conceptular Beat Synthesiser is a drum machine powered by machine learning.  There are no samples, instead the system uses neural network models of sounds. The real power of this synthesiser lies in the way you can manipulate the sound models using parameterised envelopes.'},
    ]},
    {title:'Audio FX',examples:[
      //spectral delay
      {id:'specdelay', docid:'e8524aa9-d6a6-0809-83ef-e7b0891802bc',desc:'Spectral delay based on spectral resynthesis. The input is analysed by FFT, then particular spectral bins can be independently delayed and fed back on themselves to make a diffuse delayed filterbank.'},
    ]},
    {title:'Text',examples:[
      //lyrics
      {id:'lyrics', docid:'66a88951-a7d6-cc9f-0d8b-b043e4b952b0',desc:'Having trouble writing the lyrics to your song? Using a pre-trained model on common English words, we can find similar words , find an "average" of two words, and "solve" two words like an analogy '},
    ]}
  ]}),
});
