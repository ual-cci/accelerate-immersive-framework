export function initialize(instance) {
  const applicationRoute = instance.lookup('route:application');
  const session = instance.lookup('service:session');
  session.on('authenticationSucceeded', function() {
    console.log('authenticationSucceeded callback');
    applicationRoute.transitionTo('application');
  });
  session.on('invalidationSucceeded', function() {
    console.log('invalidationSucceeded callback');
    applicationRoute.transitionTo('application');
  });
}

export default {
  initialize,
  name:  'session-events',
  after: 'ember-simple-auth'
};
