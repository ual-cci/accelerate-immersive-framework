import Route from '@ember/routing/route';
import config from  '../config/environment';

export default Route.extend({
  guides:[
    {id:"mmll", name:"Musical Machine Listening with MMLL.js", url:config.localOrigin + "/guides/mmll"},
    {id:"maximJS", name:"Making Music in the Browser with maximJS", url:config.localOrigin + "/guides/maximJS"},
    {id:"rapidLib", name:"Building Interactive Machine Learning Tools with RapidLib", url:config.localOrigin + "/guides/rapidlib"},
    {id:"kadenze", name:"Machine Learning as a Design Tool", url:config.localOrigin + "/guides/kadenze"}
  ],
  model(params) {
    for(let i = 0; i < this.get('guides').length;i++)
    {
      if(this.get('guides')[i].id == params.topic)
      {
        return this.get('guides')[i]
      }
    }
    return this.get('guides')
  }
});
