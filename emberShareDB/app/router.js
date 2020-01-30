import EmberRouter from '@ember/routing/router';
import config from './config/environment';
import GoogleAnalyticsRoute from 'ember-tracker/mixins/google-analytics-route';

const Router = EmberRouter.extend(GoogleAnalyticsRoute, {
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
  this.route('getting-started', { path: '/getting-started/:topic' });
  this.route('guides', { path: '/guides/:topic' });
  this.route('examples');
  this.route('api', {path:'/api/*endpoint'});
  this.route('inputs');
});

export default Router;
