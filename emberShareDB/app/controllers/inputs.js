import Controller from '@ember/controller';

export default Controller.extend({
  examples:[
    {title:"Mouse Input", docs:[
      //Microbit
      {docid:"3738a892-330f-15ae-673e-5cb38f25a8e8",desc:"Just the bare minimum recording mouse X and Y"},
    ]},
    {title:"Audio",docs:[
      //Chromagram
      {docid:"9be12ec5-4a2b-b4d8-b041-3e589ebaef5f",desc:"A Chromagram example based on Mick Grierson's original code. This splits audio into 12 different classes, closely related to the pitches in equal tempered scales."},
      //Audio features
      {docid:"c339340d-bd82-f0e1-5929-edb9a206b319",desc:"An example of using Nick Collins MMLL.js library to get a range of audio features from either the microphone or audio file. Features include spectral percentile, sensory dissonance and brightness (spectral centroid)"},
      //Chords
      {docid:"db87ed04-9d7a-5cfc-a218-dd9cc9580929",desc:"An example of using Nick Collins MMLL.js library to get a chords and tempo from either the microphone or audio file. Chords are recorded on each beat."},
      //Speech to Text
      {docid:"9f28c6b2-eb52-141c-a447-472f2e9e2669",desc:"Using the native in browser speech to text. Each time you speak, the text is transcribed, encoded into a vector and inputted into the dataset / model"},
    ]},
    {title:"Video", docs:[
      //Mobilenet
      {docid:"45e317ca-2edb-f7a0-141c-a6e462f9243d",desc:"MobileNet features. This uses a pretrained model (trained on the ImageNet dataset) to provide 1000 features from video that will be useful for typical image classification tasks. Aside: This is what teachable machine uses under the hood"},
      //BodyPix
      {docid:"90def343-a896-31d4-d818-20d89b9bc631",desc:"Uses the BodyPix model to provide full skeleton / body segmentation, possible for multi person"},
      //Posenet
      {docid:"48d5b6d9-794e-97d4-a16e-4780cf6c4a8c",desc:"Uses the ml5 / tensorflow Posenet model to provide full skeleton, possible for multi person"},
      //Emotions
      {docid:"d87b4f42-c131-ca7a-127f-c6df8f475329",desc:"Uses FaceAPI to provide inputs for 9 emotion categories from face analysis"},
    ]},
    {title:"Sensors", docs:[
      //Microbit
      {docid:"90def343-a896-31d4-d818-20d89b9bc631",desc:"Uses the BodyPix model to provide full skeleton / body segmentation, possible for multi person"},
    ]},
    {title:"Text", docs:[
      //Sentiment
      {docid:"90def343-a896-31d4-d818-20d89b9bc631",desc:"Uses the BodyPix model to provide full skeleton / body segmentation, possible for multi person"},
      //Toxicity
      {docid:"90def343-a896-31d4-d818-20d89b9bc631",desc:"Uses the BodyPix model to provide full skeleton / body segmentation, possible for multi person"},
    ]},

  ],
  actions: {
    onClick(example) {
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
