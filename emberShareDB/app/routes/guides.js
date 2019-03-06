import Route from '@ember/routing/route';
import config from  '../config/environment';

export default Route.extend({
  guides:[
    {id:"mmll", name:"Musical Machine Listening with MMLL.js", url:config.localOrigin + "/guides/mmll"},
    {id:"maximJS", name:"Making Music in the Browser with maximJS", url:config.localOrigin + "/guides/maximJS"}
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
