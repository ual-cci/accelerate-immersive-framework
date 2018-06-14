'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'ember-share-db',
    environment,
    rootURL: '/',
    locationType: 'auto',
    contentSecurityPolicy: {
     'default-src': "'none'",
     'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
     'font-src': "'self'",
     'connect-src': "'self' ws://localhost:8080 localhost:8080",
     'img-src': "'self'",
     'report-uri':"'localhost'",
     'style-src': "'self' 'unsafe-inline'",
     'frame-src': "'none'"
    },
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },
    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    }
  };

  if (environment === 'development') {
    ENV.contentDBName = 'sharedb_docs';
    ENV.oauthHost = 'http://localhost:8080/oauth';
    ENV.serverHost = 'http://localhost:8080';
    ENV.wsHost = 'ws://localhost:8080';
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
    ENV.contentDBName ='sharedb_docs';
    ENV.oauthHost = 'http://172.19.102.105:8080/oauth';
    ENV.serverHost = 'http://172.19.102.105:8080';
    ENV.wsHost = 'ws://172.19.102.105:8080';
  }

  return ENV;
};
