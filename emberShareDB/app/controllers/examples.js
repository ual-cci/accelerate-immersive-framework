import Controller from '@ember/controller';

export default Controller.extend({
  examples:[
    //LSTM
    {docid:"84bf177b-af84-85c3-4933-32076561aca0"},
    //mario
    {docid:"a8baea19-711f-4e43-46ab-71e5212ed5db"},
    //bbcut
    {docid:"50568259-fd05-e122-aa39-d3e39e39a6c0"},
    //evolib
    {docid:"3e67cfd2-c171-5bf1-db4c-a5b0cde68e7e"},
    //spectral delay
    {docid:"e8524aa9-d6a6-0809-83ef-e7b0891802bc"},
    //merk
    {docid:"305ac2de-3362-6c8d-e04c-d5a1072cc1c5"},
    //audio triggers
    {docid:"585ecea5-4841-6ae5-a8c1-4a0ddb8975fd"},
    //shelly drum machine
    {docid:"c89860a4-824a-5dfc-ff90-412f58531f5a"},
    //FaceAPI
    {docid:"9dc4eaf4-93db-26e8-9357-155eb152ea44"},
    //markov
    {docid:"01925a11-daee-a454-f2ca-3f729a707781"},
    //lyrics
    {docid:"66a88951-a7d6-cc9f-0d8b-b043e4b952b0"},
    // //conceptualr synth
    // {docid:"83b58e5e-487f-fd88-158e-239d85202bce"}
  ],
  actions: {
    onClick(example) {
      console.log("clicked", example.docid)
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
