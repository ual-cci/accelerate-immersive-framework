export function initialize(instance) {
  const applicationRoute = instance.lookup('route:application');
  const session = instance.lookup('service:session');
  session.on('authenticationSucceeded', function() {
    console.log('authenticationSucceeded callback');
    applicationRoute.transitionTo('index');
  });
  session.on('invalidationSucceeded', function() {
    applicationRoute.transitionTo('bye');
  });
}

export default {
  initialize,
  name:  'session-events',
  after: 'ember-simple-auth'
};
