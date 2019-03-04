import Service from '@ember/service';

export default Service.extend({
  libraryMap: [
    {title:"MMLL", id:"mmll", url:"MMLL.js"},
    {title:"Marked", id:"marked", url:"marked.js"},
    {title:"MaxiLib", id:"maxilib", url:"maxiLib.js"},
    {title:"Maxim.js", id:"maxim", url:"maxim.js"},
    {title:"Nexus", id:"nexus", url:"nexusUI.min.js"},
    {title:"Processing", id:"processing", url:"processing.js"},
    {title:"p5", id:"p5", url:"p5.min.js"},
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
