import Controller from '@ember/controller';
import { computed, set } from '@ember/object';
export default Controller.extend({
  examples:computed(()=>{return[
    {title:"Mouse Input", docs:[
      //Mouse
      {docid:"3738a892-330f-15ae-673e-5cb38f25a8e8",desc:"Just the bare minimum recording mouse X and Y"},
      //Series
      {docid:"741e7565-62fb-2998-8bf7-e86f9e365ea8",desc:"Mouse X and Y for Series Classification"},
    ]},
    {title:"Audio",docs:[
      //MFCCs
      {docid:"6b8d12a6-9310-1f20-b506-6bb697e6c8de",desc:"Combining MMLL and maximilian.js to get MFCCs, a great timbral feature for classifying audio."},
      //Audio features
      {docid:"c339340d-bd82-f0e1-5929-edb9a206b319",desc:"An example of using Nick Collins MMLL.js library to get a range of audio features from either the microphone or audio file. Features include spectral percentile, sensory dissonance and brightness (spectral centroid)"},
      //Chords
      {docid:"db87ed04-9d7a-5cfc-a218-dd9cc9580929",desc:"An example of using Nick Collins MMLL.js library to get a chords and tempo from either the microphone or audio file. Chords are recorded every time they change, along with the time interval since the last change."},
      //pitch
      {docid:"41a3320b-d2d1-983a-05db-8f9f6ce8d693",desc:"An example of using Nick Collins MMLL.js library to get a pitch and tempo from either the microphone or audio file. Pitch is recorded on each beat."},
      //Chromagram
      {docid:"9be12ec5-4a2b-b4d8-b041-3e589ebaef5f",desc:"A Chromagram example based on Mick Grierson's original code. This splits audio into 12 different classes, closely related to the pitches in equal tempered scales."},
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
      //Coco Object Detection
      {docid:"f0f185b8-4b13-8f83-f815-872d6556c47e",desc:"Uses the Tensorflow Coco object detector. Provides labels and bounding boxes for objects, this example adds the bounding box for any objects identified as people."},

    ]},
    {title:"Sensors", docs:[
      //Iphone
      {docid:"674412e2-d4b6-ae40-8d5c-cddc1d271d17",desc:"Connect the motion sensors on your iphone. Requires free Motion sender app (https://apps.apple.com/gb/app/motionsender/id1315005698), values sent over OSC (via websockets)"},
      //Android
      {docid:"c678fa6c-bd17-7d9c-4df1-a92e7b02cb70",desc:"Connect the motion sensors on your Android. Requires free oscHook app (https://play.google.com/store/apps/details?id=com.hollyhook.oscHook), values sent over OSC (via websockets)"},
      //Microbit
      {docid:"f7686716-7c64-c87c-b413-07fb8828fafc",desc:"Connect to a BBC Micro:bit using WebBLE. Records accelerometer values. Code modified from https://github.com/antefact/microBit.js. Visit here to download firmware to upload onto your microbit"},
    ]},
    {title:"External", docs:[
      //Microbit
      {docid:"9f017abd-11ea-8d49-6e4f-6b16061cff5b",desc:"Record MIDI CC values into a dataset"},
      {docid:"10fe5752-913e-71d8-3fd4-0ec0f0b9f4f3",desc:"Record values sent over OSC (via websockets) into a dataset"},
    ]},
    {title:"Text", docs:[
      //Sentiment
      {docid:"62050fce-d4a9-7aaa-e563-51a8992e1d45",desc:"Uses a Sentiment analysis model from Tensorflow. Three text boxes are used as input and their respective sentiments are used as inputs to the model / dataset"},
      //Toxicity
      {docid:"c6c5ab4d-d7fa-a4c5-1793-dc1f99d1f16e",desc:"Uses a Toxicity analysis model from Tensorflow. Text input is used and the respective toxicity probabilities for 7 categories are used as inputs to the model / dataset"},
    ]},

  ]}),
  actions: {
    onClick(example) {
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
