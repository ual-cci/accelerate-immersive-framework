import Route from '@ember/routing/route';
import config from  '../config/environment';
import { inject } from '@ember/service';

export default Route.extend({
  examples:inject(),
  cs: inject('console'),
  model(params) {
    const examples = this.get('examples').examples;
    this.get('cs').log(examples, params);
    for(let i = 0; i < examples.length; i++)
    {
      let group = examples[i]
      for (let j = 0; j < group.examples.length; j++)
      {
        let example = group.examples[j];
        if(example.id == params.topic)
        {
          this.get('cs').log("EARLY RETURNING");
          return example;
        }
      }
    }
    return examples
  }
});
