import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('login');
  this.route('code-editor', { path: '/code/:documentId' });
  this.route('documents', { path: '/d/:search/:page/:sort' });
  this.route('password-reset');
  this.route('about');
  this.route('terms');
  this.route('getting-started');
  this.route('guides', { path: '/guides/:topic' });
  this.route('examples');
});

export default Router;
