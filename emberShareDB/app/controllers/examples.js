import Controller from '@ember/controller';

export default Controller.extend({
  examples:[
    // //Shelly 1
    // {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd",
    // thumbnailId:"beatbox.png"},
    // //Shelly 2
    // {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd",
    // thumbnailId:"beatbox.png"},
    //FaceAPI
    {docid:"9dc4eaf4-93db-26e8-9357-155eb152ea44",
    thumbnailId:"beatbox.png"},
    //LSTM
    {docid:"b530ba9e-dfd9-0440-8358-86b6420b210d",
    thumbnailId:"beatbox.png"},
    //audio triggers
    {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd",
    thumbnailId:"beatbox.png"},
    //merk
    {docid:"305ac2de-3362-6c8d-e04c-d5a1072cc1c5",
    thumbnailId:"wiley.jpeg"},
    //mario
    {docid:"a8baea19-711f-4e43-46ab-71e5212ed5db",
    thumbnailId:"mario.jpeg"},
    //bbcut
    {docid:"a9e1808c-8c5e-2634-9f6f-d0197b123b34",
    thumbnailId:"breakcore.jpg"},
    //spectral delay
    {docid:"23a98909-eb83-e718-0765-eec49b66d3c1",
    thumbnailId:"spectrogram.jpeg"},
    //markov
    {docid:"01925a11-daee-a454-f2ca-3f729a707781",
    thumbnailId:"808.png"},
    //vec
    {docid:"66a88951-a7d6-cc9f-0d8b-b043e4b952b0",
    thumbnailId:"front-page.png"},
    //evolib
    {docid:"3e67cfd2-c171-5bf1-db4c-a5b0cde68e7e",
    thumbnailId:"hybrid.jpeg"},
    //conceptualr synth
    {docid:"83b58e5e-487f-fd88-158e-239d85202bce",
    thumbnailId:"hybrid.jpeg"}
  ],
  actions: {
    onClick(example) {
      console.log("clicked", example.docid)
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
