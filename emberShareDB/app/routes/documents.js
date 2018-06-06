import Route from '@ember/routing/route';

export default Route.extend({
  model(params) {
    console.log(params);
    return this.get('store').query('document', {
      filter:{search:params.search,page:params.page}
    });
  }
});
