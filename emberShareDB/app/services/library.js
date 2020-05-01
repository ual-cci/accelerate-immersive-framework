import Service from '@ember/service';
import { computed, set } from '@ember/object';

export default Service.extend({
  libraryMap: computed(()=>{return [
    {title:"MMLL", id:"mmll", url:"MMLL.js"},
    {title:"Marked", id:"Marked", url:"marked.js"},
    {title:"maximilian.js", id:"maximilian", url:"maximilian.js"},
    {title:"Nexus", id:"nexusUI", url:"nexusUI.js"},
    {title:"Processing", id:"processing.js", url:"processing.js"},
    {title:"p5", id:"p5", url:"p5.min.js"},
    {title:"SoundJS", id:"SoundJS", url:"soundjs.js"},
    {title:"EvoLib", id:"evolib", url:"evolib.js"},
    {title:"Chrome Auto Player", id:"chromeplayer", url:"chrome-player.js"},
    {title:"RapidLib", id:"rapidlib", url:"rapidLib.js"},
    {title:"Learner.js", id:"learner", url:"learner.v.0.2.js"},
    {title:"Maxi Instrument", id:"maxiinstrument", url:"maxiInstruments.v.0.4.js"},
    {title:"MIMIC Samples", id:"mimicSamples", url:"mimicSamples.js"},
  ]}),
  url(id) {
    let url = ""
    this.get('libraryMap').forEach((lib)=>{
      if(lib.id == id) {
        url = lib.url
      }
    })
    return url;
  },
});
