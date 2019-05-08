import Service from '@ember/service';

export default Service.extend({
  libraryMap: [
    {title:"MMLL", id:"mmll", url:"MMLL.js"},
    {title:"Marked", id:"Marked", url:"marked.js"},
    {title:"maximillian.js", id:"maximillian", url:"maximillian.js"},
    {title:"Nexus", id:"nexusUI", url:"nexusUI.min.js"},
    {title:"Processing", id:"processing.js", url:"processing.js"},
    {title:"p5", id:"p5", url:"p5.min.js"},
    {title:"SoundJS", id:"SoundJS", url:"soundjs.js"}
  ],
  url(id) {
    let url = ""
    this.get('libraryMap').forEach((lib)=>{
      console.log("comparing", lib.id, id)
      if(lib.id == id) {
        url = lib.url
      }
    })
    return url;
  },
});
