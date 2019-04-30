import Controller from '@ember/controller';

export default Controller.extend({
  examples:[
    //Shelly 1
    {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd",
    thumbnailId:"beatbox.png"},
    //Shelly 2
    {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd",
    thumbnailId:"beatbox.png"},
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
    {docid:"6f9951c9-88c3-dd1d-f348-69a31ba77a97",
    thumbnailId:"spectrogram.jpeg"},
    //markov
    {docid:"01925a11-daee-a454-f2ca-3f729a707781",
    thumbnailId:"808.png"},
    //vec
    {docid:"52196ad0-ff26-da74-90f6-64bf8af6f5b2",
    thumbnailId:"front-page.png"},
    //evolib
    {docid:"6f17f8c6-3147-44e1-3855-d189b7f5007c",
    thumbnailId:"hybrid.jpeg"},
  ],
  actions: {
    onClick(example) {
      console.log("clicked", example.docid)
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
