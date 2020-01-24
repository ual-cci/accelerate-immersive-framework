import Service from '@ember/service';
import config from  '../config/environment';

export default Service.extend({
  guides:[
    {id:"mmll", name:"Musical Machine Listening with MMLL.js", url:config.localOrigin + "/guides/mmll"},
    {id:"maximJS", name:"Making Music in the Browser with maxmilian.js", url:config.localOrigin + "/guides/maximJS"},
    {id:"kadenze", name:"Machine Learning for Musicians and Artists alongside Kadenze", url:config.localOrigin + "/guides/kadenze"},
    {id:"evolib", name:"Evolutionary Sound Synthesis with Evolib.js", url:config.localOrigin + "/guides/evolib"},
    {id:"RAPIDMIX", name:"Using RapidLib.js for Machine Learning", url:config.localOrigin + "/guides/RAPIDMIX"},
    {id:"learner", name:"Building Mappings by Example with Learner.js", url:config.localOrigin + "/guides/learner"},
    {id:"maxi-instrument", name:"AudioWorklet Backed Synths and Samplers with MaxiInstuments.js", url:config.localOrigin + "/guides/maxi-instrument"}
  ]
});
