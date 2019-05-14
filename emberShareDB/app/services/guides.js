import Service from '@ember/service';
import config from  '../config/environment';

export default Service.extend({
  guides:[
    {id:"mmll", name:"Musical Machine Listening with MMLL.js", url:config.localOrigin + "/guides/mmll"},
    {id:"maximJS", name:"Making Music in the Browser with maxmilian.js", url:config.localOrigin + "/guides/maximJS"},
    {id:"rapidLib", name:"Using RapidLib for Machine Learning", url:config.localOrigin + "/guides/rapidlib"},
    {id:"kadenze", name:"Machine Learning for Musicians and Artists", url:config.localOrigin + "/guides/kadenze"},
    {id:"evolib", name:"Evolutionary Sound Synthesis with Evolib", url:config.localOrigin + "/guides/evolib"}
  ]
});
