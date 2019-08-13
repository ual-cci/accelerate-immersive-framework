'use strict';

define('ember-share-db/tests/app.lint-test', [], function () {
  'use strict';

  QUnit.module('ESLint | app');

  QUnit.test('adapters/account.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/account.js should pass ESLint\n\n');
  });

  QUnit.test('adapters/document.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/document.js should pass ESLint\n\n');
  });

  QUnit.test('app.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'app.js should pass ESLint\n\n');
  });

  QUnit.test('authenticators/oauth2.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'authenticators/oauth2.js should pass ESLint\n\n');
  });

  QUnit.test('components/base-token.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/base-token.js should pass ESLint\n\n4:16 - Use import Component from \'@ember/component\'; instead of using Ember.Component (ember/new-module-imports)\n16:17 - Use import { computed } from \'@ember/object\'; instead of using Ember.computed (ember/new-module-imports)');
  });

  QUnit.test('components/document-list-item.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/document-list-item.js should pass ESLint\n\n33:9 - Unexpected console statement. (no-console)');
  });

  QUnit.test('components/download-button.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/download-button.js should pass ESLint\n\n4:8 - \'config\' is defined but never used. (no-unused-vars)');
  });

  QUnit.test('components/file-upload.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/file-upload.js should pass ESLint\n\n18:7 - Unexpected console statement. (no-console)\n20:9 - Unexpected console statement. (no-console)\n24:9 - Unexpected console statement. (no-console)\n28:9 - Unexpected console statement. (no-console)');
  });

  QUnit.test('components/main-navigation.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/main-navigation.js should pass ESLint\n\n13:7 - Use closure actions, unless you need bubbling (ember/closure-actions)\n19:7 - Use closure actions, unless you need bubbling (ember/closure-actions)\n22:7 - Unexpected console statement. (no-console)');
  });

  QUnit.test('components/modal-preview-body.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/modal-preview-body.js should pass ESLint\n\n');
  });

  QUnit.test('components/ops-player.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/ops-player.js should pass ESLint\n\n');
  });

  QUnit.test('components/tokenfield-input.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'components/tokenfield-input.js should pass ESLint\n\n7:10 - \'A\' is defined but never used. (no-unused-vars)\n53:32 - Use import { A } from \'@ember/array\'; instead of using Ember.A (ember/new-module-imports)\n60:27 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n60:27 - \'$\' is not defined. (no-undef)');
  });

  QUnit.test('controllers/application.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/application.js should pass ESLint\n\n');
  });

  QUnit.test('controllers/code-editor.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'controllers/code-editor.js should pass ESLint\n\n31:3 - Only string, number, symbol, boolean, null, undefined, and function are allowed as default properties (ember/avoid-leaking-state-in-ember-objects)\n83:5 - Unexpected console statement. (no-console)\n100:5 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n100:5 - \'$\' is not defined. (no-undef)\n120:9 - Unexpected console statement. (no-console)\n146:5 - Unexpected console statement. (no-console)\n150:9 - Unexpected console statement. (no-console)\n162:11 - Unexpected console statement. (no-console)\n171:11 - Unexpected console statement. (no-console)\n180:11 - Unexpected console statement. (no-console)\n189:11 - Unexpected console statement. (no-console)\n194:9 - Unexpected console statement. (no-console)\n204:5 - Unexpected console statement. (no-console)\n213:9 - Unexpected console statement. (no-console)\n218:9 - Unexpected console statement. (no-console)\n224:13 - \'session\' is assigned a value but never used. (no-unused-vars)\n228:9 - Unexpected console statement. (no-console)\n240:9 - Unexpected console statement. (no-console)\n253:64 - \'editor\' is not defined. (no-undef)\n254:9 - \'session\' is not defined. (no-undef)\n278:5 - Unexpected console statement. (no-console)\n309:11 - Unexpected console statement. (no-console)\n312:11 - Unexpected console statement. (no-console)\n355:7 - Unexpected console statement. (no-console)\n376:5 - Unexpected console statement. (no-console)\n418:9 - Unexpected console statement. (no-console)\n448:2 - Mixed spaces and tabs. (no-mixed-spaces-and-tabs)\n449:2 - Mixed spaces and tabs. (no-mixed-spaces-and-tabs)\n450:2 - Mixed spaces and tabs. (no-mixed-spaces-and-tabs)\n466:13 - \'doc\' is assigned a value but never used. (no-unused-vars)\n501:15 - \'err\' is defined but never used. (no-unused-vars)\n502:7 - Unexpected console statement. (no-console)\n507:11 - \'doc\' is assigned a value but never used. (no-unused-vars)\n533:7 - Unexpected console statement. (no-console)\n542:9 - Unexpected console statement. (no-console)\n578:5 - Unexpected console statement. (no-console)\n581:7 - Unexpected console statement. (no-console)\n614:7 - Unexpected console statement. (no-console)\n620:13 - \'doc\' is assigned a value but never used. (no-unused-vars)\n628:11 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n628:11 - \'$\' is not defined. (no-undef)\n634:13 - \'doc\' is assigned a value but never used. (no-unused-vars)\n661:17 - \'err\' is defined but never used. (no-unused-vars)\n685:11 - Unexpected console statement. (no-console)\n699:7 - \'$\' is not defined. (no-undef)\n699:7 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n703:7 - Unexpected console statement. (no-console)\n706:9 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n706:9 - \'$\' is not defined. (no-undef)\n707:9 - \'$\' is not defined. (no-undef)\n707:9 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n711:9 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n711:9 - \'$\' is not defined. (no-undef)\n715:7 - Unexpected console statement. (no-console)\n716:7 - \'$\' is not defined. (no-undef)\n716:7 - Do not use global `$` or `jQuery` (ember/no-global-jquery)\n728:11 - Unexpected console statement. (no-console)\n736:11 - Unexpected console statement. (no-console)\n828:7 - Unexpected console statement. (no-console)\n840:13 - Unexpected console statement. (no-console)\n845:9 - Unexpected console statement. (no-console)\n869:13 - \'e\' is defined but never used. (no-unused-vars)');
  });

  QUnit.test('controllers/documents.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'controllers/documents.js should pass ESLint\n\n39:5 - Unexpected console statement. (no-console)\n54:11 - Unexpected console statement. (no-console)\n58:11 - Unexpected console statement. (no-console)\n77:13 - Unexpected console statement. (no-console)\n85:15 - Unexpected console statement. (no-console)\n90:13 - Unexpected console statement. (no-console)');
  });

  QUnit.test('controllers/login.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'controllers/login.js should pass ESLint\n\n31:7 - Unexpected console statement. (no-console)\n33:9 - Unexpected console statement. (no-console)\n42:7 - Unexpected console statement. (no-console)\n51:11 - Unexpected console statement. (no-console)\n54:11 - Unexpected console statement. (no-console)\n65:9 - Unexpected console statement. (no-console)\n68:9 - Unexpected console statement. (no-console)');
  });

  QUnit.test('controllers/password-reset.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'controllers/password-reset.js should pass ESLint\n\n13:5 - Unexpected console statement. (no-console)');
  });

  QUnit.test('instance-initializers/session-events.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'instance-initializers/session-events.js should pass ESLint\n\n5:5 - Unexpected console statement. (no-console)\n9:5 - Unexpected console statement. (no-console)');
  });

  QUnit.test('models/account.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/account.js should pass ESLint\n\n');
  });

  QUnit.test('models/asset.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/asset.js should pass ESLint\n\n');
  });

  QUnit.test('models/document.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/document.js should pass ESLint\n\n');
  });

  QUnit.test('resolver.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'resolver.js should pass ESLint\n\n');
  });

  QUnit.test('router.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'router.js should pass ESLint\n\n11:37 - Use snake case in dynamic segments of routes (ember/routes-segments-snake-case)');
  });

  QUnit.test('routes/about.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/about.js should pass ESLint\n\n');
  });

  QUnit.test('routes/application.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'routes/application.js should pass ESLint\n\n7:5 - Unexpected console statement. (no-console)\n12:5 - Unexpected console statement. (no-console)\n20:5 - Unexpected console statement. (no-console)');
  });

  QUnit.test('routes/code-editor.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'routes/code-editor.js should pass ESLint\n\n23:5 - Unexpected console statement. (no-console)\n28:18 - \'transition\' is defined but never used. (no-unused-vars)');
  });

  QUnit.test('routes/documents.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'routes/documents.js should pass ESLint\n\n12:11 - \'sort\' is assigned a value but never used. (no-unused-vars)\n21:5 - Unexpected console statement. (no-console)\n25:18 - \'transition\' is defined but never used. (no-unused-vars)\n26:7 - Unexpected console statement. (no-console)\n31:13 - Unexpected console statement. (no-console)');
  });

  QUnit.test('routes/index.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/index.js should pass ESLint\n\n');
  });

  QUnit.test('routes/login.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/login.js should pass ESLint\n\n');
  });

  QUnit.test('routes/password-reset.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'routes/password-reset.js should pass ESLint\n\n4:40 - \'model\' is defined but never used. (no-unused-vars)');
  });

  QUnit.test('routes/terms.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/terms.js should pass ESLint\n\n');
  });

  QUnit.test('serializers/document.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'serializers/document.js should pass ESLint\n\n');
  });

  QUnit.test('services/assets.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'services/assets.js should pass ESLint\n\n10:5 - Unexpected console statement. (no-console)\n14:7 - \'$\' is not defined. (no-undef)\n19:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n19:11 - Unexpected console statement. (no-console)\n22:11 - Unexpected console statement. (no-console)\n28:5 - Unexpected console statement. (no-console)\n35:9 - Unexpected console statement. (no-console)\n43:9 - Unexpected console statement. (no-console)\n60:7 - Unexpected console statement. (no-console)\n68:5 - Unexpected console statement. (no-console)\n69:39 - \'reject\' is defined but never used. (no-unused-vars)\n86:5 - Unexpected console statement. (no-console)');
  });

  QUnit.test('services/code-parsing.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'services/code-parsing.js should pass ESLint\n\n24:9 - Unexpected console statement. (no-console)\n189:7 - Unexpected console statement. (no-console)');
  });

  QUnit.test('services/documents.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'services/documents.js should pass ESLint\n\n21:24 - \'response\' is defined but never used. (no-unused-vars)\n22:9 - Unexpected console statement. (no-console)\n24:17 - \'err\' is defined but never used. (no-unused-vars)\n25:9 - Unexpected console statement. (no-console)\n39:7 - \'$\' is not defined. (no-undef)\n44:18 - \'res\' is defined but never used. (no-unused-vars)\n53:7 - \'$\' is not defined. (no-undef)\n57:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n57:11 - Unexpected console statement. (no-console)\n75:11 - Unexpected console statement. (no-console)\n76:11 - \'$\' is not defined. (no-undef)\n80:22 - \'res\' is defined but never used. (no-unused-vars)\n81:15 - Unexpected console statement. (no-console)\n81:15 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n86:15 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n88:15 - Unexpected console statement. (no-console)\n100:5 - Unexpected console statement. (no-console)\n102:7 - \'$\' is not defined. (no-undef)\n106:18 - \'res\' is defined but never used. (no-unused-vars)');
  });

  QUnit.test('services/ops-player.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'services/ops-player.js should pass ESLint\n\n31:7 - \'$\' is not defined. (no-undef)\n35:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n36:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n115:13 - Unexpected console statement. (no-console)');
  });

  QUnit.test('services/password-reset.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'services/password-reset.js should pass ESLint\n\n8:5 - Unexpected console statement. (no-console)\n10:7 - \'$\' is not defined. (no-undef)\n15:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n15:11 - Unexpected console statement. (no-console)\n18:11 - Unexpected console statement. (no-console)\n24:5 - Unexpected console statement. (no-console)\n26:7 - \'$\' is not defined. (no-undef)\n31:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n31:11 - Unexpected console statement. (no-console)\n34:11 - Unexpected console statement. (no-console)\n40:5 - Unexpected console statement. (no-console)\n42:7 - \'$\' is not defined. (no-undef)\n47:11 - Unexpected console statement. (no-console)\n47:11 - Don\'t use jQuery without Ember Run Loop (ember/jquery-ember-run)\n50:11 - Unexpected console statement. (no-console)');
  });

  QUnit.test('services/session-account.js', function (assert) {
    assert.expect(1);
    assert.ok(false, 'services/session-account.js should pass ESLint\n\n41:9 - Unexpected console statement. (no-console)');
  });
});
define('ember-share-db/tests/components/ember-ace', ['exports', 'ember-ace/test-support/components/ember-ace'], function (exports, _emberAce) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberAce.default;
    }
  });
});
define('ember-share-db/tests/helpers/ember-simple-auth', ['exports', 'ember-simple-auth/authenticators/test'], function (exports, _test) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.authenticateSession = authenticateSession;
  exports.currentSession = currentSession;
  exports.invalidateSession = invalidateSession;


  const TEST_CONTAINER_KEY = 'authenticator:test';

  function ensureAuthenticator(app, container) {
    const authenticator = container.lookup(TEST_CONTAINER_KEY);
    if (!authenticator) {
      app.register(TEST_CONTAINER_KEY, _test.default);
    }
  }

  function authenticateSession(app, sessionData) {
    const { __container__: container } = app;
    const session = container.lookup('service:session');
    ensureAuthenticator(app, container);
    session.authenticate(TEST_CONTAINER_KEY, sessionData);
    return app.testHelpers.wait();
  }

  function currentSession(app) {
    return app.__container__.lookup('service:session');
  }

  function invalidateSession(app) {
    const session = app.__container__.lookup('service:session');
    if (session.get('isAuthenticated')) {
      session.invalidate();
    }
    return app.testHelpers.wait();
  }
});
define('ember-share-db/tests/integration/components/ace-editor-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | ace-editor', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "KghNmMp1",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"ace-editor\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JftFk8in",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"ace-editor\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/document-list-item-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | document-list-item', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "15rZY42B",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"document-list-item\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "XBV2kGO+",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"document-list-item\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/download-button-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | download-button', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "+7UDuaKY",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"download-button\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ngHbNMl1",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"download-button\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/file-upload-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | file-upload', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "uwoNnWn/",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"file-upload\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YyP7xmNI",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"file-upload\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/main-navigation-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | main-navigation', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "UH/9KtZ/",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"main-navigation\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "5e70IS+p",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"main-navigation\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/modal-preview-body-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | modal-preview-body', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "fOT6vHyA",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"modal-preview-body\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "OLBMflxn",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"modal-preview-body\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/my-ace-editor-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | my-ace-editor', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "VRqOVdOc",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"my-ace-editor\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "etYFShzI",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"my-ace-editor\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/ops-player-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | ops-player', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "VJVzsMH9",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"ops-player\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YfA1uEVs",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"ops-player\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/text-area-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | text-area', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YEcotdI3",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"text-area\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "lJvXUE66",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"text-area\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/components/token-field-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Component | token-field', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    (0, _qunit.test)('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "7J4ueq9l",
        "block": "{\"symbols\":[],\"statements\":[[1,[20,\"token-field\"],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '');

      // Template block usage:
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "jDFZIOJC",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"token-field\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), 'template block text');
    });
  });
});
define('ember-share-db/tests/integration/helpers/if-equal-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Helper | if-equal', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('inputValue', '1234');

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ELYxakBl",
        "block": "{\"symbols\":[],\"statements\":[[1,[26,\"if-equal\",[[22,[\"inputValue\"]]],null],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '1234');
    });
  });
});
define('ember-share-db/tests/integration/helpers/modulo-test', ['qunit', 'ember-qunit', '@ember/test-helpers'], function (_qunit, _emberQunit, _testHelpers) {
  'use strict';

  (0, _qunit.module)('Integration | Helper | modulo', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('inputValue', '1234');

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "U1/eTaph",
        "block": "{\"symbols\":[],\"statements\":[[1,[26,\"modulo\",[[22,[\"inputValue\"]]],null],false]],\"hasEval\":false}",
        "meta": {}
      }));

      assert.equal(this.element.textContent.trim(), '1234');
    });
  });
});
define('ember-share-db/tests/test-helper', ['ember-share-db/app', 'ember-share-db/config/environment', '@ember/test-helpers', 'ember-qunit'], function (_app, _environment, _testHelpers, _emberQunit) {
  'use strict';

  (0, _testHelpers.setApplication)(_app.default.create(_environment.default.APP));

  (0, _emberQunit.start)();
});
define('ember-share-db/tests/tests.lint-test', [], function () {
  'use strict';

  QUnit.module('ESLint | tests');

  QUnit.test('integration/components/ace-editor-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/ace-editor-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/document-list-item-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/document-list-item-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/download-button-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/download-button-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/file-upload-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/file-upload-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/main-navigation-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/main-navigation-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/modal-preview-body-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/modal-preview-body-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/my-ace-editor-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/my-ace-editor-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/ops-player-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/ops-player-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/text-area-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/text-area-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/components/token-field-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/token-field-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/helpers/if-equal-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/helpers/if-equal-test.js should pass ESLint\n\n');
  });

  QUnit.test('integration/helpers/modulo-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/helpers/modulo-test.js should pass ESLint\n\n');
  });

  QUnit.test('test-helper.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'test-helper.js should pass ESLint\n\n');
  });

  QUnit.test('unit/adapters/account-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/adapters/account-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/adapters/code-document-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/adapters/code-document-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/controllers/code-editor-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/controllers/code-editor-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/controllers/login-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/controllers/login-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/controllers/password-reset-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/controllers/password-reset-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/initializers/websocket-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/initializers/websocket-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/instance-initializers/session-events-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/instance-initializers/session-events-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/models/account-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/models/account-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/models/asset-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/models/asset-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/models/code-document-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/models/code-document-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/about-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/about-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/code-editor-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/code-editor-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/documents-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/documents-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/index-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/index-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/login-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/login-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/password-reset-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/password-reset-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/terms-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/terms-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/routes/text-area-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/routes/text-area-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/serializers/document-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/serializers/document-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/assets-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/assets-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/code-parsing-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/code-parsing-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/documents-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/documents-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/mimic-api-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/mimic-api-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/ops-player-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/ops-player-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/password-reset-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/password-reset-test.js should pass ESLint\n\n');
  });

  QUnit.test('unit/services/session-account-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/services/session-account-test.js should pass ESLint\n\n');
  });
});
define('ember-share-db/tests/unit/adapters/account-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Adapter | account', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let adapter = this.owner.lookup('adapter:account');
      assert.ok(adapter);
    });
  });
});
define('ember-share-db/tests/unit/adapters/code-document-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Adapter | code document', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let adapter = this.owner.lookup('adapter:document');
      assert.ok(adapter);
    });
  });
});
define('ember-share-db/tests/unit/controllers/code-editor-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Controller | code-editor', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:code-editor');
      assert.ok(controller);
    });
  });
});
define('ember-share-db/tests/unit/controllers/login-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Controller | login', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:login');
      assert.ok(controller);
    });
  });
});
define('ember-share-db/tests/unit/controllers/password-reset-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Controller | password-reset', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:password-reset');
      assert.ok(controller);
    });
  });
});
define('ember-share-db/tests/unit/initializers/websocket-test', ['ember-share-db/initializers/websocket', 'qunit', 'ember-qunit'], function (_websocket, _qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Initializer | websocket', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    hooks.beforeEach(function () {
      this.TestApplication = Ember.Application.extend();
      this.TestApplication.initializer({
        name: 'initializer under test',
        initialize: _websocket.initialize
      });

      this.application = this.TestApplication.create({ autoboot: false });
    });

    hooks.afterEach(function () {
      Ember.run(this.application, 'destroy');
    });

    // Replace this with your real tests.
    (0, _qunit.test)('it works', async function (assert) {
      await this.application.boot();

      assert.ok(true);
    });
  });
});
define('ember-share-db/tests/unit/instance-initializers/session-events-test', ['ember-share-db/instance-initializers/session-events', 'qunit', 'ember-qunit'], function (_sessionEvents, _qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Instance Initializer | session-events', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    hooks.beforeEach(function () {
      this.TestApplication = Ember.Application.extend();
      this.TestApplication.instanceInitializer({
        name: 'initializer under test',
        initialize: _sessionEvents.initialize
      });
      this.application = this.TestApplication.create({ autoboot: false });
      this.instance = this.application.buildInstance();
    });
    hooks.afterEach(function () {
      Ember.run(this.application, 'destroy');
      Ember.run(this.instance, 'destroy');
    });

    // Replace this with your real tests.
    (0, _qunit.test)('it works', async function (assert) {
      await this.instance.boot();

      assert.ok(true);
    });
  });
});
define('ember-share-db/tests/unit/models/account-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Model | account', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let store = this.owner.lookup('service:store');
      let model = Ember.run(() => store.createRecord('account', {}));
      assert.ok(model);
    });
  });
});
define('ember-share-db/tests/unit/models/asset-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Model | asset', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let store = this.owner.lookup('service:store');
      let model = Ember.run(() => store.createRecord('asset', {}));
      assert.ok(model);
    });
  });
});
define('ember-share-db/tests/unit/models/code-document-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Model | code document', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let store = this.owner.lookup('service:store');
      let model = Ember.run(() => store.createRecord('document', {}));
      assert.ok(model);
    });
  });
});
define('ember-share-db/tests/unit/routes/about-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | about', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:about');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/code-editor-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | code-editor', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:code-editor');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/documents-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | documents', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:documents');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/index-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | index', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:index');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/login-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | login', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:login');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/password-reset-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | password-reset', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:password-reset');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/terms-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | terms', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:terms');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/routes/text-area-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Route | textArea', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:text-area');
      assert.ok(route);
    });
  });
});
define('ember-share-db/tests/unit/serializers/document-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Serializer | document', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let store = this.owner.lookup('service:store');
      let serializer = store.serializerFor('document');

      assert.ok(serializer);
    });

    (0, _qunit.test)('it serializes records', function (assert) {
      let store = this.owner.lookup('service:store');
      let record = Ember.run(() => store.createRecord('document', {}));

      let serializedRecord = record.serialize();

      assert.ok(serializedRecord);
    });
  });
});
define('ember-share-db/tests/unit/services/assets-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | assets', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:assets');
      assert.ok(service);
    });
  });
});
define('ember-share-db/tests/unit/services/code-parsing-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | code-parsing', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:code-parsing');
      assert.ok(service);
    });
  });
});
define('ember-share-db/tests/unit/services/documents-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | documents', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:documents');
      assert.ok(service);
    });
  });
});
define('ember-share-db/tests/unit/services/mimic-api-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | mimic-api', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:mimic-api');
      assert.ok(service);
    });
  });
});
define('ember-share-db/tests/unit/services/ops-player-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | ops-player', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:ops-player');
      assert.ok(service);
    });
  });
});
define('ember-share-db/tests/unit/services/password-reset-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | password-reset', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:password-reset');
      assert.ok(service);
    });
  });
});
define('ember-share-db/tests/unit/services/session-account-test', ['qunit', 'ember-qunit'], function (_qunit, _emberQunit) {
  'use strict';

  (0, _qunit.module)('Unit | Service | sessionAccount', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);

    // Replace this with your real tests.
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:sessionAccount');
      assert.ok(service);
    });
  });
});
define('ember-share-db/config/environment', [], function() {
  var prefix = 'ember-share-db';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

require('ember-share-db/tests/test-helper');
EmberENV.TESTS_FILE_LOADED = true;
//# sourceMappingURL=tests.map
