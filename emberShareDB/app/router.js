import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('login');
  this.route('code-editor', { path: '/code/:documentId' });
  this.route('documents', { path: '/d/:search/:page' });
  this.route('password-reset');
});

export default Router;
