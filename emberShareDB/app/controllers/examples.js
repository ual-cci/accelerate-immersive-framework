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
    {docid:"5ed346fe-f7d5-b7ce-87a4-df6e352dbb4a",
    thumbnailId:"breakcore.jpg"},
    //spectral delay
    {docid:"d5499af6-f4f3-2683-0c05-b700f1a9f1b1",
    thumbnailId:"spectrogram.jpeg"},
    //markov
    {docid:"01925a11-daee-a454-f2ca-3f729a707781",
    thumbnailId:"808.png"},
    //vec
    {docid:"77eeec9b-0ba7-0987-0aad-d90eb52c62a7",
    thumbnailId:"front-page.png"},
    //evolib
    {docid:"723f4078-b9c2-de8d-4970-fb41609213e2",
    thumbnailId:"hybrid.jpeg"},
  ],
  actions: {
    onClick(example) {
      console.log("clicked", example.docid)
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
