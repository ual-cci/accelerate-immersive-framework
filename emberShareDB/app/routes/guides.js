import Route from '@ember/routing/route';
import config from  '../config/environment';
import { inject } from '@ember/service';

export default Route.extend({
  guides:inject(),
  model(params) {
    const guides = this.get('guides').guides;
    for(let i = 0; i < guides.length;i++)
    {
      if(guides[i].id == params.topic)
      {
        return guides[i]
      }
    }
    return guides
  }
});
