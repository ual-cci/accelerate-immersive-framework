'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
    ace: {
      themes: ['monokai'],
      modes: ['html', 'javascript'],
      workers: ['html', 'javascript'],
      exts: ['language_tools']
    },
    codemirror: {
      addons: ['mode/simple.js', 'mode/multiplex.js', 'comment/comment.js'],
      modes: ['xml', 'javascript', 'handlebars', 'htmlmixed', 'css'],
      themes: ['monokai'],
      keymaps: ['sublime']
    },

    'ember-bootstrap': {
      'bootstrapVersion': 3,
      'importBootstrapFont': true,
      'importBootstrapCSS': false
    }
  });

  // app.import('vendor/code-mirror/lib/codemirror.js', {
  //   using: [
  //     { transformation: 'amd', as: 'codemirror' }
  //   ]
  // });
  // app.import('vendor/code-mirror/lib/codemirror.css');
  // app.import('vendor/code-mirror/theme/monokai.css');
  // app.import('vendor/code-mirror/mode/javascript/javascript.js', {
  //   using: [
  //     { transformation: 'amd', as: 'javascript' }
  //   ]
  // });


  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
