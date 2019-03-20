import Controller from '@ember/controller';

export default Controller.extend({
  examples:[
    {docid:"1d9d2530-39b4-737e-91d3-750b433c98a7",
    thumbnailId:"front-page.png"},
    {docid:"1d9d2530-39b4-737e-91d3-750b433c98a7",
    thumbnailId:"front-page.png"},
    {docid:"1d9d2530-39b4-737e-91d3-750b433c98a7",
    thumbnailId:"front-page.png"},
    {docid:"1d9d2530-39b4-737e-91d3-750b433c98a7",
    thumbnailId:"front-page.png"}
  ],
  actions: {
    onClick(example) {
      console.log("clicked", example.docid)
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
