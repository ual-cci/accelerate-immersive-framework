import Service from '@ember/service';
import config from  '../config/environment';

export default Service.extend({
  guides:[
    {id:"mmll", name:"Musical Machine Listening with MMLL.js", url:config.localOrigin + "/guides/mmll"},
    {id:"maximJS", name:"Making Music in the Browser with maximJS", url:config.localOrigin + "/guides/maximJS"},
    {id:"rapidLib", name:"Building Interactive Machine Learning Tools with RapidLib", url:config.localOrigin + "/guides/rapidlib"},
    {id:"kadenze", name:"Machine Learning for Musicians and Artists", url:config.localOrigin + "/guides/kadenze"},
    {id:"evolib", name:"Evolutionary sound synthesis with Evolib", url:config.localOrigin + "/guides/evolib"}
  ]
});
