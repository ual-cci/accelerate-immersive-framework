import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('login');
  this.route('code-editor', { path: '/d/:documentId' });
  this.route('documents', { path: '/d' });
  this.route('password-reset');
});

export default Router;
