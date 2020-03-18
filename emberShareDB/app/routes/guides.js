import Route from '@ember/routing/route';
import config from  '../config/environment';
import { inject } from '@ember/service';

export default Route.extend({
  guides:inject(),
  cs: inject('console'),
  model(params) {
    const guides = this.get('guides').guides;
    this.get('cs').log(guides, params);
    for(let i = 0; i < guides.length; i++)
    {
      let group = guides[i]
      for (let j = 0; j < group.guides.length; j++)
      {
        let guide = group.guides[j];
        this.get('cs').log(guide.id == params.topic,guide.id,params.topic);
        if(guide.id == params.topic)
        {
          this.get('cs').log("EARLY RETURNIGN");
          return guide;
        }
      }
    }
    return guides
  }
});
