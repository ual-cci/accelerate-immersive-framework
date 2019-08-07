"use strict";



define('ember-share-db/adapters/account', ['exports', 'ember-data', 'ember-share-db/config/environment'], function (exports, _emberData, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.JSONAPIAdapter.extend({
    host: _environment.default.serverHost
  });
});
define('ember-share-db/adapters/document', ['exports', 'ember-data', 'ember-share-db/config/environment'], function (exports, _emberData, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.JSONAPIAdapter.extend({
    host: _environment.default.serverHost,
    sessionAccount: Ember.inject.service('session-account'),
    headers: Ember.computed('sessionAccount.bearerToken', function () {
      return {
        'Authorization': 'Bearer ' + this.get('sessionAccount.bearerToken')
      };
    })
  });
});
define('ember-share-db/app', ['exports', 'ember-share-db/resolver', 'ember-load-initializers', 'ember-share-db/config/environment'], function (exports, _resolver, _emberLoadInitializers, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  exports.default = App;
});
define('ember-share-db/authenticators/oauth2', ['exports', 'ember-simple-auth/authenticators/oauth2-password-grant', 'ember-share-db/config/environment'], function (exports, _oauth2PasswordGrant, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _oauth2PasswordGrant.default.extend({
    serverTokenEndpoint: `${_environment.default.oauthHost}/token`,
    serverTokenRevocationEndpoint: `${_environment.default.oauthHost}/revoke`,
    authenticate(identification, password, scope = [], headers = {}) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const data = { 'grant_type': 'password', username: identification, password };
        const serverTokenEndpoint = this.get('serverTokenEndpoint');
        const useResponse = this.get('rejectWithResponse');
        const scopesString = Ember.makeArray(scope).join(' ');
        if (!Ember.isEmpty(scopesString)) {
          data.scope = scopesString;
        }
        this.makeRequest(serverTokenEndpoint, data, headers).then(response => {
          Ember.run(() => {
            if (!this._validate(response)) {
              reject('access_token is missing in server response');
            }

            const expiresAt = this._absolutizeExpirationTime(response['expires_in']);
            this._scheduleAccessTokenRefresh(response['expires_in'], expiresAt, response['refresh_token']);
            if (!Ember.isEmpty(expiresAt)) {
              response = Ember.assign(response, { 'expires_at': expiresAt });
            }
            response = Ember.assign(response, { 'user_id': identification });
            resolve(response);
          });
        }, response => {
          Ember.run(null, reject, useResponse ? response : response.responseJSON || response.responseText);
        });
      });
    },
    makeRequest: function (url, data) {
      var client_id = 'application';
      var client_secret = 'secret';
      return Ember.$.ajax({
        url: this.serverTokenEndpoint,
        type: 'POST',
        data: data,
        contentType: 'application/x-www-form-urlencoded',
        headers: {
          Authorization: "Basic " + btoa(client_id + ":" + client_secret)
        }
      });
    }
  });
});
define('ember-share-db/components/base-token', ['exports', 'ember-share-db/templates/components/base-token'], function (exports, _baseToken) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = Ember.Component.extend({
        //Component properties
        layout: _baseToken.default, // For more info: https://discuss.emberjs.com/t/layout-property-for-declaring-html-in-component/12844/2
        classNames: ['uncharted-token'],
        classNameBindings: ['isSelected:uncharted-selected-token'],

        // Properties
        token: null,
        index: null,
        selectedTokenIndex: null,

        // State
        isSelected: Ember.computed('index', 'selectedTokenIndex', function () {
            return this.get('index') === this.get('selectedTokenIndex');
        }),

        // Actions
        actions: {
            removeToken() {
                this.removeToken();
            }
        }
    });
});
define('ember-share-db/components/bs-accordion', ['exports', 'ember-bootstrap/components/bs-accordion'], function (exports, _bsAccordion) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsAccordion.default;
    }
  });
});
define('ember-share-db/components/bs-accordion/item', ['exports', 'ember-bootstrap/components/bs-accordion/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
define('ember-share-db/components/bs-accordion/item/body', ['exports', 'ember-bootstrap/components/bs-accordion/item/body'], function (exports, _body) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _body.default;
    }
  });
});
define('ember-share-db/components/bs-accordion/item/title', ['exports', 'ember-bootstrap/components/bs-accordion/item/title'], function (exports, _title) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _title.default;
    }
  });
});
define('ember-share-db/components/bs-alert', ['exports', 'ember-bootstrap/components/bs-alert'], function (exports, _bsAlert) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsAlert.default;
    }
  });
});
define('ember-share-db/components/bs-button-group', ['exports', 'ember-bootstrap/components/bs-button-group'], function (exports, _bsButtonGroup) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsButtonGroup.default;
    }
  });
});
define('ember-share-db/components/bs-button-group/button', ['exports', 'ember-bootstrap/components/bs-button-group/button'], function (exports, _button) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _button.default;
    }
  });
});
define('ember-share-db/components/bs-button', ['exports', 'ember-bootstrap/components/bs-button'], function (exports, _bsButton) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsButton.default;
    }
  });
});
define('ember-share-db/components/bs-carousel', ['exports', 'ember-bootstrap/components/bs-carousel'], function (exports, _bsCarousel) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsCarousel.default;
    }
  });
});
define('ember-share-db/components/bs-carousel/slide', ['exports', 'ember-bootstrap/components/bs-carousel/slide'], function (exports, _slide) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _slide.default;
    }
  });
});
define('ember-share-db/components/bs-collapse', ['exports', 'ember-bootstrap/components/bs-collapse'], function (exports, _bsCollapse) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsCollapse.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown', ['exports', 'ember-bootstrap/components/bs-dropdown'], function (exports, _bsDropdown) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsDropdown.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown/button', ['exports', 'ember-bootstrap/components/bs-dropdown/button'], function (exports, _button) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _button.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown/menu', ['exports', 'ember-bootstrap/components/bs-dropdown/menu'], function (exports, _menu) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _menu.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown/menu/divider', ['exports', 'ember-bootstrap/components/bs-dropdown/menu/divider'], function (exports, _divider) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _divider.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown/menu/item', ['exports', 'ember-bootstrap/components/bs-dropdown/menu/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown/menu/link-to', ['exports', 'ember-bootstrap/components/bs-dropdown/menu/link-to'], function (exports, _linkTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
define('ember-share-db/components/bs-dropdown/toggle', ['exports', 'ember-bootstrap/components/bs-dropdown/toggle'], function (exports, _toggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
});
define('ember-share-db/components/bs-form', ['exports', 'ember-bootstrap/components/bs-form'], function (exports, _bsForm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsForm.default;
    }
  });
});
define('ember-share-db/components/bs-form/element', ['exports', 'ember-bootstrap/components/bs-form/element'], function (exports, _element) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/control', ['exports', 'ember-bootstrap/components/bs-form/element/control'], function (exports, _control) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _control.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/control/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/control/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/control/input', ['exports', 'ember-bootstrap/components/bs-form/element/control/input'], function (exports, _input) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _input.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/control/textarea', ['exports', 'ember-bootstrap/components/bs-form/element/control/textarea'], function (exports, _textarea) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _textarea.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/errors', ['exports', 'ember-bootstrap/components/bs-form/element/errors'], function (exports, _errors) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _errors.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/feedback-icon', ['exports', 'ember-bootstrap/components/bs-form/element/feedback-icon'], function (exports, _feedbackIcon) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _feedbackIcon.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/help-text', ['exports', 'ember-bootstrap/components/bs-form/element/help-text'], function (exports, _helpText) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _helpText.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/label', ['exports', 'ember-bootstrap/components/bs-form/element/label'], function (exports, _label) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _label.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/layout/horizontal', ['exports', 'ember-bootstrap/components/bs-form/element/layout/horizontal'], function (exports, _horizontal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _horizontal.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/layout/horizontal/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/layout/horizontal/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/layout/inline', ['exports', 'ember-bootstrap/components/bs-form/element/layout/inline'], function (exports, _inline) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _inline.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/layout/inline/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/layout/inline/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/layout/vertical', ['exports', 'ember-bootstrap/components/bs-form/element/layout/vertical'], function (exports, _vertical) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _vertical.default;
    }
  });
});
define('ember-share-db/components/bs-form/element/layout/vertical/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/layout/vertical/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
define('ember-share-db/components/bs-form/group', ['exports', 'ember-bootstrap/components/bs-form/group'], function (exports, _group) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _group.default;
    }
  });
});
define('ember-share-db/components/bs-modal-simple', ['exports', 'ember-bootstrap/components/bs-modal-simple'], function (exports, _bsModalSimple) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsModalSimple.default;
    }
  });
});
define('ember-share-db/components/bs-modal', ['exports', 'ember-bootstrap/components/bs-modal'], function (exports, _bsModal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsModal.default;
    }
  });
});
define('ember-share-db/components/bs-modal/body', ['exports', 'ember-bootstrap/components/bs-modal/body'], function (exports, _body) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _body.default;
    }
  });
});
define('ember-share-db/components/bs-modal/dialog', ['exports', 'ember-bootstrap/components/bs-modal/dialog'], function (exports, _dialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dialog.default;
    }
  });
});
define('ember-share-db/components/bs-modal/footer', ['exports', 'ember-bootstrap/components/bs-modal/footer'], function (exports, _footer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _footer.default;
    }
  });
});
define('ember-share-db/components/bs-modal/header', ['exports', 'ember-bootstrap/components/bs-modal/header'], function (exports, _header) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _header.default;
    }
  });
});
define('ember-share-db/components/bs-modal/header/close', ['exports', 'ember-bootstrap/components/bs-modal/header/close'], function (exports, _close) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _close.default;
    }
  });
});
define('ember-share-db/components/bs-modal/header/title', ['exports', 'ember-bootstrap/components/bs-modal/header/title'], function (exports, _title) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _title.default;
    }
  });
});
define('ember-share-db/components/bs-nav', ['exports', 'ember-bootstrap/components/bs-nav'], function (exports, _bsNav) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsNav.default;
    }
  });
});
define('ember-share-db/components/bs-nav/item', ['exports', 'ember-bootstrap/components/bs-nav/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
define('ember-share-db/components/bs-nav/link-to', ['exports', 'ember-bootstrap/components/bs-nav/link-to'], function (exports, _linkTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
define('ember-share-db/components/bs-navbar', ['exports', 'ember-bootstrap/components/bs-navbar'], function (exports, _bsNavbar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsNavbar.default;
    }
  });
});
define('ember-share-db/components/bs-navbar/content', ['exports', 'ember-bootstrap/components/bs-navbar/content'], function (exports, _content) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _content.default;
    }
  });
});
define('ember-share-db/components/bs-navbar/link-to', ['exports', 'ember-bootstrap/components/bs-navbar/link-to'], function (exports, _linkTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
define('ember-share-db/components/bs-navbar/nav', ['exports', 'ember-bootstrap/components/bs-navbar/nav'], function (exports, _nav) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _nav.default;
    }
  });
});
define('ember-share-db/components/bs-navbar/toggle', ['exports', 'ember-bootstrap/components/bs-navbar/toggle'], function (exports, _toggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
});
define('ember-share-db/components/bs-popover', ['exports', 'ember-bootstrap/components/bs-popover'], function (exports, _bsPopover) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsPopover.default;
    }
  });
});
define('ember-share-db/components/bs-popover/element', ['exports', 'ember-bootstrap/components/bs-popover/element'], function (exports, _element) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
define('ember-share-db/components/bs-progress', ['exports', 'ember-bootstrap/components/bs-progress'], function (exports, _bsProgress) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsProgress.default;
    }
  });
});
define('ember-share-db/components/bs-progress/bar', ['exports', 'ember-bootstrap/components/bs-progress/bar'], function (exports, _bar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bar.default;
    }
  });
});
define('ember-share-db/components/bs-tab', ['exports', 'ember-bootstrap/components/bs-tab'], function (exports, _bsTab) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsTab.default;
    }
  });
});
define('ember-share-db/components/bs-tab/pane', ['exports', 'ember-bootstrap/components/bs-tab/pane'], function (exports, _pane) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pane.default;
    }
  });
});
define('ember-share-db/components/bs-tooltip', ['exports', 'ember-bootstrap/components/bs-tooltip'], function (exports, _bsTooltip) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsTooltip.default;
    }
  });
});
define('ember-share-db/components/bs-tooltip/element', ['exports', 'ember-bootstrap/components/bs-tooltip/element'], function (exports, _element) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
define('ember-share-db/components/check-box', ['exports', 'ember-railio-grid/components/check-box'], function (exports, _checkBox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkBox.default;
    }
  });
});
define('ember-share-db/components/data-actions', ['exports', 'ember-railio-grid/components/data-actions'], function (exports, _dataActions) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataActions.default;
    }
  });
});
define('ember-share-db/components/data-col', ['exports', 'ember-railio-grid/components/data-col'], function (exports, _dataCol) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataCol.default;
    }
  });
});
define('ember-share-db/components/data-grid', ['exports', 'ember-railio-grid/components/data-grid'], function (exports, _dataGrid) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataGrid.default;
    }
  });
});
define('ember-share-db/components/data-row', ['exports', 'ember-railio-grid/components/data-row'], function (exports, _dataRow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataRow.default;
    }
  });
});
define('ember-share-db/components/document-list-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    document: null,
    documentService: Ember.inject.service('documents'),
    store: Ember.inject.service('store'),
    sessionAccount: Ember.inject.service('session-account'),
    canEdit: Ember.computed('document', function () {
      return this.get('sessionAccount').currentUserName == this.get('document').owner;
    }),
    doPlay: Ember.computed('document', function () {
      //console.log("computing dont play", this.get('document').dontPlay);
      return !this.get('document').dontPlay;
    }),
    index: 0,
    actions: {
      open() {
        this.get('onOpen')(this.get('document').documentId);
      },
      delete() {
        this.get('onDelete')(this.get('document').documentId);
      },
      toggleDontPlay() {
        const docId = this.get('document').documentId;
        this.get('store').findRecord('document', docId).then(doc => {
          const toggled = !doc.data.dontPlay;
          const op = { p: ["dontPlay"], oi: toggled ? "true" : "false" };
          this.get('documentService').submitOp(op, docId);
        }).catch(err => {
          console.log("ERROR", err);
        });
      }
    }
  });
});
define('ember-share-db/components/download-button', ['exports', 'ember-cli-file-saver/mixins/file-saver', 'npm:jszip', 'ember-share-db/config/environment'], function (exports, _fileSaver, _npmJszip, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend(_fileSaver.default, {
    doc: null,
    classNames: ['inline-view'],
    assetService: Ember.inject.service('assets'),
    store: Ember.inject.service('store'),
    actions: {
      download() {
        const doc = this.get('doc').data;
        let zip = new _npmJszip.default();
        zip.file("index.html", doc.source, { type: 'string' });
        for (let asset of doc.assets) {
          const storeAsset = this.get('store').peekRecord('asset', asset.fileId);
          if (storeAsset) {
            zip.file(asset.name, storeAsset.b64data, { base64: true });
          }
        }
        zip.generateAsync({ type: "blob" }).then(blob => {
          this.saveFileAs(doc.name + "-MIMIC.zip", blob, 'application/zip');
        });
      }
    }
  });
});
define('ember-share-db/components/ember-ace-completion-tooltip', ['exports', 'ember-ace/components/ember-ace-completion-tooltip'], function (exports, _emberAceCompletionTooltip) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberAceCompletionTooltip.default;
    }
  });
});
define('ember-share-db/components/ember-ace', ['exports', 'ember-ace/components/ember-ace'], function (exports, _emberAce) {
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
define('ember-share-db/components/ember-popper-targeting-parent', ['exports', 'ember-popper/components/ember-popper-targeting-parent'], function (exports, _emberPopperTargetingParent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopperTargetingParent.default;
    }
  });
});
define('ember-share-db/components/ember-popper', ['exports', 'ember-popper/components/ember-popper'], function (exports, _emberPopper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopper.default;
    }
  });
});
define('ember-share-db/components/file-field', ['exports', 'ember-uploader/components/file-field'], function (exports, _fileField) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _fileField.default;
});
define('ember-share-db/components/file-upload', ['exports', 'ember-uploader', 'ember-share-db/config/environment'], function (exports, _emberUploader, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberUploader.default.FileField.extend({
    sessionAccount: Ember.inject.service('session-account'),
    url: _environment.default.serverHost + "/asset",
    filesDidChange(files) {
      const uploader = _emberUploader.default.Uploader.create({
        url: this.get('url')
      });
      if (!Ember.isEmpty(files)) {
        let user = this.get('sessionAccount').currentUserName;
        let doc = this.get('sessionAccount').currentDoc;
        let data = { username: user, documentId: doc };
        console.log(data);
        uploader.on('progress', e => {
          console.log('progress', e);
          this.get('onProgress')(e);
        });
        uploader.on('didUpload', e => {
          console.log('didUpload', e);
          this.get('onCompletion')(e);
        });
        uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
          console.log('didError', jqXHR, textStatus, errorThrown);
          this.get('onError')(errorThrown);
        });
        uploader.upload(files[0], data);
      }
    }
  });
});
define('ember-share-db/components/filter-bar', ['exports', 'ember-railio-grid/components/filter-bar'], function (exports, _filterBar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filterBar.default;
    }
  });
});
define('ember-share-db/components/lazy-number', ['exports', 'ember-railio-grid/components/lazy-number'], function (exports, _lazyNumber) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lazyNumber.default;
    }
  });
});
define('ember-share-db/components/main-navigation', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    session: Ember.inject.service('session'),
    sessionAccount: Ember.inject.service('session-account'),
    store: Ember.inject.service('store'),
    ownedDocuments: Ember.computed('sessionAccount.ownedDocuments', function () {
      return this.get('sessionAccount').ownedDocuments;
    }),
    actions: {
      login() {
        this.sendAction('onLogin');
      },
      logout() {
        this.get('session').invalidate();
      },
      home() {
        this.sendAction('onHome');
      },
      openDoc(doc) {
        console.log(doc);
        this.get('openDoc')(doc);
      }
    }
  });
});
define('ember-share-db/components/main-paginator', ['exports', 'ember-railio-grid/components/main-paginator'], function (exports, _mainPaginator) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mainPaginator.default;
    }
  });
});
define('ember-share-db/components/modal-preview-body', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({});
});
define('ember-share-db/components/modals-container', ['exports', 'ember-bootstrap-modals-manager/components/modals-container'], function (exports, _modalsContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _modalsContainer.default;
    }
  });
});
define('ember-share-db/components/modals-container/alert', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/alert'], function (exports, _alert) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _alert.default;
    }
  });
});
define('ember-share-db/components/modals-container/base', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/base'], function (exports, _base) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _base.default;
    }
  });
});
define('ember-share-db/components/modals-container/check-confirm', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/check-confirm'], function (exports, _checkConfirm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkConfirm.default;
    }
  });
});
define('ember-share-db/components/modals-container/confirm', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/confirm'], function (exports, _confirm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _confirm.default;
    }
  });
});
define('ember-share-db/components/modals-container/process', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/process'], function (exports, _process) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _process.default;
    }
  });
});
define('ember-share-db/components/modals-container/progress', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/progress'], function (exports, _progress) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _progress.default;
    }
  });
});
define('ember-share-db/components/modals-container/prompt-confirm', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/prompt-confirm'], function (exports, _promptConfirm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _promptConfirm.default;
    }
  });
});
define('ember-share-db/components/modals-container/prompt', ['exports', 'ember-bootstrap-modals-manager/components/modals-container/prompt'], function (exports, _prompt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _prompt.default;
    }
  });
});
define('ember-share-db/components/ops-player', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      prev() {
        this.get('onSkip')(true);
      },
      next() {
        this.get('onSkip')(false);
      },
      play() {
        this.get('onPlay')();
      },
      rewind() {
        this.get('onRewind')();
      },
      pause() {
        this.get('onPause')();
      }
    }
  });
});
define('ember-share-db/components/page-picker-paginator', ['exports', 'ember-railio-grid/components/page-picker-paginator'], function (exports, _pagePickerPaginator) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pagePickerPaginator.default;
    }
  });
});
define('ember-share-db/components/page-size-picker', ['exports', 'ember-railio-grid/components/page-size-picker'], function (exports, _pageSizePicker) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pageSizePicker.default;
    }
  });
});
define('ember-share-db/components/tokenfield-input', ['exports', 'ember-share-db/templates/components/tokenfield-input'], function (exports, _tokenfieldInput) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.KEYCODE = undefined;
    const KEYCODE = exports.KEYCODE = {
        ENTER: 13,
        DELETE: 46,
        S: 83,
        s: 115,
        LEFT_ARROW: 37,
        RIGHT_ARROW: 39,
        BACKSPACE: 8,
        TAB: 9,
        COMMA: 188
    };

    exports.default = Ember.Component.extend({
        // Component properties
        layout: _tokenfieldInput.default,
        classNames: ['uncharted-tokenfield-input'],
        classNameBindings: ['isFocused:uncharted-focus'],
        attributeBindings: ['tabindex'],
        tabindex: 0,

        // Properties
        tokens: null,
        placeholder: null,
        addTokenOnBlur: true,
        allowDuplicates: false,
        editable: true,
        tokenComponent: 'base-token',

        tokenfieldId: Ember.computed('elementId', function () {
            return `${this.elementId}-tokenfield`;
        }),

        // State
        inputValue: null,
        isFocused: null,
        hasTokens: Ember.computed.notEmpty('tokens'),
        selectedTokenIndex: null,
        showDuplicateMessage: false,

        // Lifecycle
        init() {
            this._super(...arguments);
            if (Ember.isNone(this.get('tokens'))) {
                this.set('tokens', Ember.A());
            }
        },

        didInsertElement() {
            this._super(...arguments);

            const textInput = $(".uncharted-token-input");
            this._textInputElement = textInput;
            textInput.on('keydown', this._keydownHandler.bind(this)).on('focus', this._focusHandler.bind(this)).on('blur', this._inputWasBlurred.bind(this));

            this.$().on('keydown', this._tokenNavigationHandler.bind(this)).on('focus', this._focusHandler.bind(this)).on('blur', this._componentWasBlurred.bind(this));
        },

        willDestroyElement() {
            this._super(...arguments);

            this._textInputElement.off('keydown', this._keydownHandler.bind(this)).off('focus', this._focusHandler.bind(this)).off('blur', this._inputWasBlurred.bind(this));

            this.$().off('keydown', this._tokenNavigationHandler.bind(this)).off('focus', this._focusHandler.bind(this)).off('blur', this._componentWasBlurred.bind(this));
        },

        // Actions
        actions: {
            editToken(token) {
                this._editToken(token);
            },

            removeToken(token) {
                this._removeToken(token);
                this._focusTextInput();
            },

            createToken(token) {
                this._addToken(token);
                this._focusTextInput();
            },

            selectToken(token, index) {
                this.set('selectedTokenIndex', index);
            }
        },

        _onDisabledChanged: Ember.observer('disabled', function () {
            if (!this.get('editable')) {
                this._blurComponent();
            }
        }),

        _onInputValueChanged: Ember.observer('inputValue', function () {
            if (!this.get('editable')) {
                return;
            }
            const value = this.get('inputValue');
            if (value.indexOf(',') > -1) {
                const values = value.split(',');
                values.forEach(this._addToken.bind(this));
                this.set('inputValue', '');
            }
        }),

        // Event handlers
        _keydownHandler(e) {
            if (!this.get('editable')) {
                return;
            }
            const wasEnterKey = e.which === KEYCODE.ENTER;
            const wasTabKey = e.which === KEYCODE.TAB;
            const hasValue = !Ember.isEmpty(this.get('inputValue'));
            const shouldCreateToken = wasEnterKey || wasTabKey && hasValue;

            if (this.get('showDuplicateMessage')) {
                this.set('showDuplicateMessage', false);
            }

            if (shouldCreateToken) {
                this._addToken(this.get('inputValue'));
                e.preventDefault();
                e.stopPropagation();
            }
        },

        _tokenNavigationHandler(e) {
            if (!this.get('editable')) {
                return;
            }
            // Highlight text hit backspace wtf?!?!
            const cursorIndex = e.target.selectionStart;
            const cursorIsAtStart = cursorIndex === 0;
            const hasSelectedToken = !Ember.isNone(this.get('selectedTokenIndex'));
            switch (e.which) {
                case KEYCODE.BACKSPACE:
                    if (hasSelectedToken) {
                        const prevTokenIndex = this.get('selectedTokenIndex') - 1;
                        this._removeToken(this.get('tokens').objectAt(this.get('selectedTokenIndex')));
                        if (prevTokenIndex > -1) {
                            this._setSelectedTokenIndex(prevTokenIndex);
                            e.preventDefault();
                        } else {
                            this._focusTextInput();
                        }
                    } else if (Ember.isEmpty(this.get('inputValue')) && cursorIsAtStart) {
                        this._setSelectedTokenIndex(this.get('tokens.length') - 1);
                        e.preventDefault();
                    }
                    break;
                case KEYCODE.ENTER:

                    if (hasSelectedToken) {
                        const tokenValue = this.get('tokens').objectAt(this.get('selectedTokenIndex'));
                        this._editToken(tokenValue);
                    } else if (!Ember.isEmpty(this.get('inputValue'))) {
                        this._addToken(this.get('inputValue'));
                    }
                    break;
                case KEYCODE.LEFT_ARROW:
                    if (hasSelectedToken) {
                        const prevTokenIndex = this.get('selectedTokenIndex') - 1;
                        if (prevTokenIndex > -1) {
                            this._setSelectedTokenIndex(prevTokenIndex);
                        }
                    } else if (Ember.isEmpty(this.get('inputValue'))) {
                        this._setSelectedTokenIndex(this.get('tokens.length') - 1);
                    }
                    break;
                case KEYCODE.RIGHT_ARROW:
                    {
                        const selectedTokenIndex = this.get('selectedTokenIndex');
                        if (Ember.isNone(selectedTokenIndex)) {
                            break;
                        }

                        if (selectedTokenIndex >= this.get('tokens.length') - 1) {
                            // We were at the last token so lets focus the text input
                            this._setSelectedTokenIndex(null);
                            this._focusTextInput();
                        } else {
                            this._setSelectedTokenIndex(selectedTokenIndex + 1);
                        }
                        break;
                    }
                case KEYCODE.TAB:
                    if (hasSelectedToken) {
                        this._blurComponent();
                    } else if (!Ember.isEmpty(this.get('inputValue'))) {
                        this._addToken(this.get('inputValue'));
                    }
                    break;
            }
        },

        _focusHandler(e) {
            if (!this.get('editable')) {
                return;
            }
            this.set('isFocused', true);
            if (e.target === this.element) {
                // Div focus event
                if (Ember.isNone(this.get('selectedTokenIndex'))) {
                    this._focusTextInput();
                }
            } else {
                // Input focus event
                this.set('selectedTokenIndex', null);
            }
        },

        _componentWasBlurred() {
            if (!this.get('editable')) {
                return;
            }
            this.set('isFocused', false);
            this.set('selectedTokenIndex', null);
        },

        _inputWasBlurred() {
            if (Ember.isNone(this.get('selectedTokenIndex'))) {
                this._blurComponent();
            }
        },

        // Internal methods
        _focusComponent() {
            this.$().focus();
        },

        _focusTextInput() {
            if (!this.get('editable')) {
                return;
            }
            this._textInputElement.focus();
        },

        _blurComponent() {
            if (!this.get('editable')) {
                return;
            }
            if (this.get('addTokenOnBlur') && !Ember.isEmpty(this.get('inputValue'))) {
                this._addToken(this.get('inputValue'));
            }
            this.set('isFocused', false);
            this.set('selectedTokenIndex', null);
        },

        _setSelectedTokenIndex(index) {
            if (!this.get('editable')) {
                return;
            }
            this.set('selectedTokenIndex', index);
            this._textInputElement.blur();
            if (!Ember.isNone(index)) {
                this._focusComponent();
            }
        },

        _removeToken(value) {
            if (!this.get('editable')) {
                return;
            }
            this.get('tokens').removeObject(value);
            this.set('selectedTokenIndex', null);
            this.get('tokensChanged')(this.get('tokens'));
        },

        _addToken(value) {
            if (!this.get('editable')) {
                return;
            }
            if (!Ember.isNone(value)) {
                value = value.trim();
                const isDuplicate = this.get('tokens').map(token => token.toLowerCase()).includes(value.toLowerCase());
                const allowDuplicates = this.get('allowDuplicates');
                const hasValue = !Ember.isEmpty(value);
                const willAdd = hasValue && (allowDuplicates || !isDuplicate);

                if (willAdd) {
                    this.get('tokens').pushObject(value);
                    this.set('inputValue', '');
                    this.get('tokensChanged')(this.get('tokens'));
                } else if (!allowDuplicates && isDuplicate) {
                    this.set('showDuplicateMessage', true);
                }
            }
        },

        _editToken(value) {
            if (!this.get('editable')) {
                return;
            }
            this._removeToken(value);
            if (!Ember.isNone(this.get('inputValue'))) {
                this._addToken(this.get('inputValue'));
            }
            this.set('inputValue', value);
            Ember.run.schedule('afterRender', this, function () {
                this._textInputElement.focus();
                this._textInputElement.select();
            });
        }
    });
});
define('ember-share-db/components/welcome-page', ['exports', 'ember-welcome-page/components/welcome-page'], function (exports, _welcomePage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _welcomePage.default;
    }
  });
});
define('ember-share-db/controllers/application', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    actions: {
      store: Ember.inject.service(),
      transitionToLoginRoute() {
        this.transitionToRoute('login');
      },
      transitionToIndexRoute() {
        this.transitionToRoute('index');
      },
      transitionToDoc(doc) {
        this.transitionToRoute('code-editor', doc);
      }
    }
  });
});
define('ember-share-db/controllers/code-editor', ['exports', 'npm:sharedb/lib/client', 'ember-share-db/config/environment'], function (exports, _client, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    //Query Params
    queryParams: ["hideEditor", "embed"],

    //Services
    websockets: Ember.inject.service('websockets'),
    sessionAccount: Ember.inject.service('session-account'),
    assetService: Ember.inject.service('assets'),
    store: Ember.inject.service('store'),
    session: Ember.inject.service('session'),
    codeParser: Ember.inject.service('code-parsing'),
    modalsManager: Ember.inject.service('modalsManager'),
    documentService: Ember.inject.service('documents'),
    opsPlayer: Ember.inject.service('ops-player'),

    //Parameters
    con: null,
    doc: null,
    editor: null,
    suppress: false,
    codeTimer: new Date(),
    renderedSource: "",
    isNotEdittingDocName: true,
    canEditDoc: false,
    isOwner: false,
    allowDocDelete: false,
    allowAssetDelete: false,
    assetToDelete: "",
    autoRender: false,
    collapsed: true,
    showShare: false,
    showAssets: false,
    showPreview: false,
    showTokens: false,
    showOpPlayer: false,
    showCodeOptions: false,
    isShowingCode: true,
    isDragging: false,
    startWidth: 0,
    startX: 0,
    aceW: 700,
    savedVals: null,
    hideEditor: 'false',
    embed: 'false',
    showName: true,
    wsAvailable: true,
    editCtr: 0,
    fontSize: 14,
    fetchingDoc: false,

    //Computed parameters
    aceStyle: Ember.computed('aceW', 'displayEditor', function () {
      const aceW = this.get('aceW');
      const displayEditor = this.get('displayEditor');
      const display = displayEditor ? "inline" : "none";
      return Ember.String.htmlSafe("width: " + aceW + "px; display: " + display + ";");
    }),
    displayEditor: Ember.computed('hideEditor', function () {
      return this.get('hideEditor') != "true";
    }),
    editLink: Ember.computed('model', function () {
      return _environment.default.localOrigin + "/code/" + this.get('model').id;
    }),
    embedLink: Ember.computed('editLink', function () {
      return this.get('editLink') + "?embed=true";
    }),
    displayLink: Ember.computed('editLink', function () {
      return this.get('editLink') + "?hideEditor=true";
    }),

    //Functions
    initShareDB: function () {
      console.log('initShareDB');
      this.initWebSockets();
      this.initAceEditor();
      this.addWindowListener();
      this.initUI();
    },
    initUI: function () {
      this.set('allowDocDelete', false);
      this.set('allowAssetDelete', false);
      this.set('showAssets', false);
      this.set('showPreview', false);
      this.set('collapsed', true);
      this.set('showShare', false);
      this.set('showTokens', false);
      this.set('showOpPlayer', false);
      this.set('showCodeOptions', false);
      const embed = this.get('embed') == "true";
      $("#mimic-navbar").css("display", embed ? "none" : "block");
      if (embed) {
        this.set('displayEditor', !embed);
        this.set('showName', !embed);
      }
    },
    initAceEditor: function () {
      const editor = this.get('editor');
      const session = editor.getSession();
      editor.commands.addCommand({
        name: "executeLines",
        exec: () => {
          this.updateIFrame(true);
        },
        bindKey: { mac: "shift-enter", win: "shift-enter" }
      });
      editor.commands.addCommand({
        name: "pause",
        exec: () => {
          console.log("pause");
          this.set('renderedSource', "");
        },
        bindKey: { mac: "cmd-.", win: "ctrl-." }
      });
      editor.commands.addCommand({
        name: "zoom-in",
        exec: () => {
          this.zoomIn();
        },
        bindKey: { mac: "cmd-=", win: "ctrl-=" }
      });
      editor.commands.addCommand({
        name: "zoom-out",
        exec: () => {
          this.zoomOut();
        },
        bindKey: { mac: "cmd--", win: "ctrl--" }
      });
      session.on('change', delta => {
        this.onSessionChange(delta);
      });
      session.setMode("ace/mode/html");
    },
    initWebSockets: function () {
      let socket = this.get('socket');
      console.log("init websockets", socket);
      if (!Ember.isEmpty(socket) && socket.state == 1) {
        socket.onclose = () => {
          console.log("websocket closed");
          this.set('socket', null);
          this.initWebSockets();
        };
        socket.close();
      } else {
        try {
          socket = new WebSocket(_environment.default.wsHost);
          this.set('socket', socket);
          socket.onopen = () => {
            console.log("web socket open");
            this.set('wsAvailable', true);
            if (!this.get('fetchingDoc')) {
              this.initDoc();
            }
          };

          socket.onerror = () => {
            console.log("web socket error");
            this.set('wsAvailable', false);
            if (!this.get('fetchingDoc')) {
              this.initDoc();
            }
          };

          socket.onclose = () => {
            console.log("web socket close");
            this.set('wsAvailable', false);
            if (!this.get('fetchingDoc')) {
              this.initDoc();
            }
          };

          socket.onmessage = event => {
            console.log("web socket message", event);
          };
        } catch (err) {
          console.log("web sockets not available");
          this.set('wsAvailable', false);
          if (!this.get('fetchingDoc')) {
            this.initDoc();
          }
        }
      }
    },
    initDoc: function () {
      console.log("init doc");
      this.set('fetchingDoc', true);
      this.get('opsPlayer').reset();
      if (this.get('wsAvailable')) {
        const socket = this.get('socket');
        let con = this.get('connection');
        if (Ember.isEmpty(con)) {
          console.log('connecting to ShareDB');
          con = new _client.default.Connection(socket);
        }
        if (Ember.isEmpty(con) || con.state == "disconnected") {
          console.log("failed to connect to ShareDB");
          this.set('wsAvailable', false);
        }
        this.set('connection', con);
        const doc = con.get(_environment.default.contentCollectionName, this.get('model').id);
        const editor = this.get('editor');
        const session = editor.getSession();

        doc.subscribe(err => {
          if (err) throw err;
          console.log("subscribed to doc", doc.data.dontPlay);
          if (!Ember.isEmpty(doc.data)) {
            this.set('doc', doc);
            this.didReceiveDoc();
          }
        });
        doc.on('op', (ops, source) => {
          this.didReceiveOp(ops, source);
        });
      } else {
        this.get('store').findRecord('document', this.get('model').id).then(doc => {
          console.log("found record", doc.data);
          this.set('doc', doc);
          this.didReceiveDoc();
        });
      }
    },
    didReceiveOp: function (ops, source) {
      const embed = this.get('embed') == "true";
      if (!embed && ops.length > 0) {
        if (!source && ops[0].p[0] == "source") {
          this.set('surpress', true);
          const deltas = this.get('codeParser').opTransform(ops, editor);
          session.getDocument().applyDeltas(deltas);
          this.set('surpress', false);
        } else if (ops[0].p[0] == "assets") {
          this.get('store').findRecord('document', this.get('model').id).then(toChange => {
            toChange.set('assets', ops[0].oi);
          });
          this.preloadAssets();
        } else if (!source && ops[0].p[0] == "newEval") {
          document.getElementById("output-iframe").contentWindow.eval(ops[0].oi);
        }
      }
    },
    didReceiveDoc: function () {
      const doc = this.get('doc');
      const editor = this.get('editor');
      const session = editor.getSession();
      this.set('surpress', true);
      session.setValue(doc.data.source);
      this.set('surpress', false);
      this.set('savedVals', doc.data.savedVals);
      console.log("did receive doc");
      this.setCanEditDoc();
      let stats = doc.data.stats ? doc.data.stats : { views: 0, forks: 0, edits: 0 };
      stats.views = parseInt(stats.views) + 1;
      this.submitOp({ p: ['stats'], oi: stats }, { source: true });
      editor.setReadOnly(!this.get('canEditDoc'));
      this.preloadAssets();
      this.get('sessionAccount').set('currentDoc', this.get('model').id);
      this.set('fetchingDoc', false);
    },
    submitOp: function (op) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const doc = this.get('doc');
        if (this.get('wsAvailable')) {
          doc.submitOp(op, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          this.get('documentService').submitOp(op).then(() => {
            console.log("did sumbit op", op);
            resolve();
          }).catch(err => {
            console.log("ERROR Not submitted");
            reject(err);
          });
        }
      });
    },
    zoomIn: function () {
      const editor = this.get("editor");
      this.incrementProperty('fontSize');
      editor.setFontSize(this.get('fontSize'));
    },
    zoomOut: function () {
      const editor = this.get("editor");
      this.decrementProperty('fontSize');
      if (this.get('fontSize') < 1) {
        this.set('fontSize', 1);
      }
      editor.setFontSize(this.get('fontSize'));
    },
    doPlay: function () {
      const doc = this.get('doc');
      const embed = this.get('embed') == "true";
      const displayEditor = this.get('displayEditor');
      const dontPlay = doc.data.dontPlay == "true" || doc.data.dontPlay;
      if (embed || !displayEditor) {
        return true;
      }
      return !dontPlay;
    },
    preloadAssets: function () {
      const doc = this.get('doc');
      if (!Ember.isEmpty(doc.data.assets)) {
        this.get('assetService').preloadAssets(doc.data.assets).then(() => {
          if (this.doPlay()) {
            this.updateIFrame();
          }
        });
      } else {
        console.log("no assets to preload", this.doPlay());
        if (this.doPlay()) {
          this.updateIFrame();
        }
      }
    },
    getSelectedText: function () {
      const editor = this.get('editor');
      let selectionRange = editor.getSelectionRange();
      if (selectionRange.start.row == selectionRange.end.row && selectionRange.start.column == selectionRange.end.column) {
        selectionRange.start.column = 0;
        selectionRange.end.column = editor.session.getLine(selectionRange.start.row).length;
      }
      const content = editor.session.getTextRange(selectionRange);
      return content;
    },
    updateIFrame: function (selection = false) {
      console.log("updating iframe");
      this.updateSavedVals();
      const savedVals = this.get('savedVals');
      const doc = this.get('doc');
      const editor = this.get('editor');
      const mainText = this.get('wsAvailable') ? doc.data.source : editor.session.getValue();
      let toRender = selection ? this.getSelectedText() : mainText;
      toRender = this.get('codeParser').replaceAssets(toRender, this.get('model').assets);
      toRender = this.get('codeParser').insertStatefullCallbacks(toRender, savedVals);
      //console.log(toRender);
      if (selection) {
        this.submitOp({ p: ['newEval'], oi: toRender }, { source: true });
        document.getElementById("output-iframe").contentWindow.eval(toRender);
      } else {
        this.set('renderedSource', toRender);
      }
    },
    autoExecuteCode: function () {
      if (this.get('codeTimer')) {
        clearTimeout(this.get('codeTimer'));
      }
      this.set('codeTimer', setTimeout(() => {
        this.updateIFrame();
        this.set('codeTimer', null);
      }, 1500));
    },
    onSessionChange: function (delta) {
      const surpress = this.get('surpress');
      const doc = this.get('doc');
      if (!surpress) {
        const editor = this.editor;
        const session = editor.getSession();

        this.incrementProperty('editCtr');

        if (!this.get('opsPlayer').atHead()) {
          console.log("not at head");
          this.submitOp({ p: ["source", 0], sd: doc.data.source });
          this.submitOp({ p: ["source", 0], si: session.getValue() });
        }
        this.get('opsPlayer').reset();

        const aceDoc = session.getDocument();
        const op = {};
        const start = aceDoc.positionToIndex(delta.start);
        op.p = ['source', parseInt(start)];
        let action;
        if (delta.action === 'insert') {
          action = 'si';
        } else if (delta.action === 'remove') {
          action = 'sd';
        } else {
          throw new Error(`action ${action} not supported`);
        }
        const str = delta.lines.join('\n');
        op[action] = str;
        this.submitOp(op);
        if (this.get('autoRender')) {
          this.autoExecuteCode();
        }
      }
    },
    addWindowListener: function () {
      this.removeWindowListener();
      var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
      var eventer = window[eventMethod];
      var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
      eventer(messageEvent, e => {
        this.handleWindowEvent(e);
      });
    },
    removeWindowListener: function () {
      var eventMethod = window.removeEventListener ? "removeEventListener" : "detachEvent";
      var eventer = window[eventMethod];
      var messageEvent = eventMethod === "detachEvent" ? "onmessage" : "message";
      eventer(messageEvent, e => {
        this.handleWindowEvent(e);
      });
    },
    handleWindowEvent: function (e) {
      const embed = this.get('embed') == "true";
      if (e.origin === _environment.default.localOrigin && !embed) {
        const doc = this.get('doc');
        let savedVals = this.get('savedVals');
        savedVals[e.data[0]] = e.data[1];
        this.set('savedVals', savedVals);
      }
    },
    setCanEditDoc: function () {
      const currentUser = this.get('sessionAccount').currentUserName;
      const doc = this.get('doc');
      if (Ember.isEmpty(currentUser) || Ember.isEmpty(doc.data)) {
        this.set('canEditDoc', false);
        this.set('isOwner', false);
        return;
      }
      if (currentUser != doc.data.owner) {
        this.set('isOwner', false);
        if (doc.data.readOnly) {
          this.set('canEditDoc', false);
          return;
        }
      } else {
        this.set('isOwner', true);
      }
      this.set('canEditDoc', this.get('displayEditor'));
    },
    deleteCurrentDocument: function () {
      const doc = this.get('doc');
      this.get('documentService').deleteDoc(doc.id).then(() => {
        this.transitionToRoute('application');
      }).catch(err => {
        console.log("error deleting doc");
      });
    },
    skipOp: function (prev, rewind = false) {
      const editor = this.get('editor');
      const doc = this.get('doc').id;
      const fn = deltas => {
        this.set('surpress', true);
        editor.session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      };
      if (prev) {
        this.get('opsPlayer').prevOp(editor, rewind).then(deltas => {
          fn(deltas);
        });
      } else {
        this.get('opsPlayer').nextOp(editor, rewind).then(deltas => {
          fn(deltas);
        });
      }
    },
    getDefaultSource: function () {
      return "<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body></html>";
    },
    updateSavedVals: function () {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const doc = this.get('doc');
        const savedVals = this.get('savedVals');
        console.log('updatingSavedVals, doc', doc, 'savedVals', savedVals);
        if (Ember.isEmpty(savedVals)) {
          resolve();
        } else {
          const vals = Object.keys(savedVals).map(key => savedVals[key]);
          const hasVals = vals.length > 0;
          console.log('vals', vals);
          if (hasVals) {
            this.submitOp({ p: ['savedVals'], oi: savedVals }).then(() => {
              resolve();
            }).catch(err => {
              reject(err);
            });
          } else {
            resolve();
          }
        }
      });
    },
    updateEditStats: function () {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const doc = this.get('doc');
        let stats = doc.data.stats ? doc.data.stats : { views: 0, forks: 0, edits: 0 };
        stats.edits = parseInt(stats.edits) + this.get('editCtr');
        const actions = [this.submitOp({ p: ['stats'], oi: stats }, { source: true }), this.submitOp({ p: ['lastEdited'], oi: new Date() }, { source: true })];
        Promise.all(actions).then(() => {
          this.set('editCtr', 0);
          resolve();
        }).catch(err => {
          reject(err);
        });
      });
    },
    refreshDoc: function () {
      const doc = this.get('doc');
      console.log('refreshing', doc);
      if (!Ember.isEmpty(doc)) {
        console.log('refreshing doc not empty', doc);
        const fn = () => {
          this.get('opsPlayer').reset();
          this.set('renderedSource', "");
          if (this.get('wsAvailable')) {
            doc.destroy();
          }
          this.set('doc', null);
          if (!Ember.isEmpty(this.get('editor'))) {
            this.initDoc();
          }
        };
        const actions = [this.updateEditStats(), this.updateSavedVals()];
        Promise.all(actions).then(() => {
          fn();
        }).catch(() => {
          fn();
        });
      }
    },
    showFeedback: function (msg) {
      this.set('feedbackMessage', msg);
      setTimeout(() => {
        this.set('feedbackMessage', null);
      }, 5000);
    },
    pauseOps: function () {
      if (this.get('opsInterval')) {
        clearInterval(this.get('opsInterval'));
      }
    },
    actions: {
      editorReady(editor) {
        this.set('editor', editor);
        console.log('editor ready');
        this.initShareDB();
      },

      //Doc properties
      tagsChanged(tags) {
        const doc = this.get('doc');
        this.submitOp({ p: ['tags'], oi: tags }, { source: true });
      },
      doEditDocName() {
        if (this.get('canEditDoc')) {
          this.set('isNotEdittingDocName', false);
          Ember.run.scheduleOnce('afterRender', function () {
            $('#doc-name-input').focus();
          });
        }
      },
      endEdittingDocName() {
        this.set('isNotEdittingDocName', true);
        const doc = this.get('doc');
        const newName = this.get('model').name;
        this.submitOp({ p: ['name'], oi: newName }, { source: true });
      },
      deleteDoc() {
        if (this.get('canEditDoc')) {
          this.deleteCurrentDocument();
        }
      },
      download() {
        this.get('assetService').zip();
      },
      flagDocument() {
        this.get('documentService').flagDoc().then(() => {
          const doc = this.get('doc');
          let flags = parseInt(doc.data.flags);
          if (flags < 2) {
            flags = flags + 1;
            this.submitOp({ p: ['flags'], oi: flags }, { source: true });
          } else {
            this.deleteCurrentDocument();
          }
        }).catch(err => {
          alert("Already flagged");
        });
      },
      forkDocument() {
        const currentUser = this.get('sessionAccount').currentUserName;
        const doc = this.get('doc');
        let stats = doc.data.stats ? doc.data.stats : { views: 0, forks: 0, edits: 0 };
        stats.forks = parseInt(stats.forks) + 1;
        this.submitOp({ p: ['stats'], oi: stats }, { source: true });
        let newDoc = this.get('store').createRecord('document', {
          source: doc.data.source,
          owner: currentUser,
          isPrivate: doc.data.isPrivate,
          name: doc.data.name,
          documentId: null,
          forkedFrom: doc.id,
          assets: doc.data.assets,
          tags: doc.data.tags
        });
        newDoc.save().then(response => {
          this.get('store').query('document', {
            filter: { search: currentUser, page: 0, currentUser: currentUser, sortBy: 'date' }
          }).then(documents => {
            console.log("new doc created", response, documents);
            this.get('sessionAccount').updateOwnedDocuments();
            this.transitionToRoute('code-editor', documents.firstObject.documentId);
          });
          this.showFeedback("Here is your very own new copy!");
        }).catch(err => {
          newDoc.deleteRecord();
          this.get('sessionAccount').updateOwnedDocuments();
          this.set('feedbackMessage', err.errors[0]);
        });
      },

      //Assets
      assetError(err) {
        $("#asset-progress").css("display", "none");
        alert("Error" + err);
      },
      assetProgress(e) {
        console.log("assetProgress", e);
        if (parseInt(e.percent) < 100) {
          $("#asset-progress").css("display", "block");
          $("#asset-progress").css("width", parseInt(e.percent) / 2 + "vw");
        } else {
          $("#asset-progress").css("display", "none");
        }
      },
      assetUploaded(e) {
        console.log("assetComplete", e);
        $("#asset-progress").css("display", "none");
        if (!this.get('wsAvailable')) {
          this.refreshDoc();
        }
      },
      deleteAsset() {
        if (this.get('canEditDoc')) {
          this.get('assetService').deleteAsset(this.get('assetToDelete')).then(() => {
            console.log('deleted asset', this.get('assetToDelete'));
            this.set('assetToDelete', "");
            this.toggleProperty('allowAssetDelete');
            if (!this.get('wsAvailable')) {
              this.refreshDoc();
            }
          }).catch(err => {
            console.log('ERROR deleting asset', err, this.get('assetToDelete'));
          });
        }
      },
      previewAsset(asset) {
        var url = _environment.default.serverHost + "/asset/" + asset.fileId;
        const isImage = asset.fileType.includes("image");
        const isAudio = asset.fileType.includes("audio");
        const isVideo = asset.fileType.includes("video");
        this.get('modalsManager').alert({ title: asset.name,
          bodyComponent: 'modal-preview-body',
          assetURL: url,
          assetType: asset.fileType,
          isImage: isImage,
          isAudio: isAudio,
          isVideo: isVideo }).then(() => {});
        this.toggleProperty('showPreview');
      },

      //SHOW AND HIDE MENUS
      togglePrivacy() {
        if (this.get('canEditDoc')) {
          let doc = this.get('doc');
          doc.data.isPrivate = !doc.data.isPrivate;
          this.set('doc', doc);
          this.submitOp({ p: ['isPrivate'], oi: doc.data.isPrivate }, { source: true });
        }
      },
      toggleReadOnly() {
        if (this.get('canEditDoc')) {
          let doc = this.get('doc');
          doc.data.readOnly = !doc.data.readOnly;
          this.set('doc', doc);
          this.submitOp({ p: ['readOnly'], oi: doc.data.readOnly }, { source: true });
        }
      },
      toggleAllowDocDelete() {
        if (this.get('canEditDoc')) {
          this.toggleProperty('allowDocDelete');
        }
      },
      toggleAllowAssetDelete(asset) {
        if (this.get('canEditDoc')) {
          this.set('assetToDelete', asset);
          this.toggleProperty('allowAssetDelete');
        }
      },
      toggleCollapsed() {
        this.toggleProperty('collapsed');
      },
      toggleAutoRender() {
        this.toggleProperty('autoRender');
      },
      toggleShowShare() {
        this.toggleProperty('showShare');
      },
      toggleShowCodeOptions() {
        this.toggleProperty('showCodeOptions');
      },
      toggleShowTokens() {
        this.toggleProperty('showTokens');
      },
      toggleShowOpPlayer() {
        this.toggleProperty('showOpPlayer');
      },
      toggleShowAssets() {
        this.toggleProperty('showAssets');
      },
      enterFullscreen() {
        var target = document.getElementById("output-iframe");
        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (target.msRequestFullscreen) {
          target.msRequestFullscreen();
        } else if (target.mozRequestFullScreen) {
          target.mozRequestFullScreen();
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      },

      //TIDYING UP ON EXIT / REFRESH
      cleanUp() {
        console.log('cleaning up');
        const fn = () => {
          this.set('renderedSource', "");
          if (this.get('wsAvailable')) {
            this.get('socket').onclose = () => {
              this.get('socket').onclose = null;
              this.get('socket').onopen = null;
              this.get('socket').onmessage = null;
              this.get('socket').onerror = null;
              this.set('socket', null);
              this.set('connection', null);
              console.log("websocket closed");
            };
            this.get('doc').destroy();
            this.get('socket').close();
          }
          console.log('cleaned up');
          this.set('doc', null);
          this.removeWindowListener();
        };
        const actions = [this.updateEditStats(), this.updateSavedVals()];
        Promise.all(actions).then(() => {
          fn();
        }).catch(() => {
          fn();
        });
      },
      refresh() {
        this.refreshDoc();
      },

      //MOUSE LISTENERS
      mouseDown(e) {
        //console.log('mouseDown',e.target);
        this.set('isDragging', true);
        const startWidth = document.querySelector('.ace-container').clientWidth;
        const startX = e.clientX;
        this.set('startWidth', startWidth);
        this.set('startX', startX);
        let overlay = document.querySelector('#output-iframe');
        overlay.style["pointer-events"] = "none";
        let overlay2 = document.querySelector('.output-container');
        overlay2.style["pointer-events"] = "auto";
      },
      mouseUp(e) {
        //console.log('mouseup',e.target);
        this.set('isDragging', false);
        let overlay = document.querySelector('#output-iframe');
        overlay.style["pointer-events"] = "auto";
        let overlay2 = document.querySelector('.output-container');
        overlay2.style["pointer-events"] = "none";
      },
      mouseMove(e) {
        if (this.get('isDragging')) {
          //console.log('mouseMove',e.target);
          this.set('aceW', this.get('startWidth') - e.clientX + this.get('startX'));
        }
      },

      //OPERATIONS ON CODE
      renderCode() {
        this.updateIFrame();
      },
      pauseCode() {
        this.set('renderedSource', "");
      },
      hideCode() {
        var hide = () => {
          let aceW = this.get('aceW');
          if (aceW > 0.0) {
            setTimeout(() => {
              this.set('aceW', Math.max(0.0, aceW - 10));
              hide();
            }, 2);
          } else {
            this.set('isShowingCode', false);
          }
        };
        hide();
      },
      showCode() {
        var show = () => {
          let aceW = this.get('aceW');
          if (aceW < 700) {
            setTimeout(() => {
              this.set('aceW', Math.min(700, aceW + 10));
              show();
            }, 2);
          } else {
            this.set('isShowingCode', true);
          }
        };
        show();
      },

      //OP PLAYBACK
      skipOp(prev) {
        this.skipOp(prev);
      },
      rewindOps() {
        this.set('surpress', true);
        this.get('editor').session.setValue("");
        this.set('renderedSource', "");
        this.set('surpress', false);
        this.skipOp(false, true);
      },
      playOps() {
        this.pauseOps();
        this.set('opsInterval', setInterval(() => {
          if (!this.get('opsPlayer').reachedEnd) {
            this.skipOp(false);
          } else {
            clearInterval(this.get('opsInterval'));
          }
        }, 100));
      },
      pauseOps() {
        this.pauseOps();
      },
      zoomOut() {
        this.zoomOut();
      },
      zoomIn() {
        this.zoomIn();
      }
    }
  });
});
define('ember-share-db/controllers/documents', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    store: Ember.inject.service(),
    session: Ember.inject.service('session'),
    documentService: Ember.inject.service('documents'),
    docName: "",
    isPrivate: true,
    feedbackMessage: "",
    sort: "views",
    page: 0,
    sessionAccount: Ember.inject.service('session-account'),
    canGoBack: Ember.computed('page', function () {
      return this.get('page') > 0;
    }),
    canGoForwards: Ember.computed('model', function () {
      return this.get('model').length >= 20;
    }),
    hasNoDocuments: Ember.computed('model', function () {
      return this.get('model').length == 0;
    }),
    tags: Ember.computed('model', function () {
      this.get('documentService').getPopularTags(12).then(results => {
        this.set('tags', results.data);
      });
      return [];
    }),
    updateResults() {
      let searchTerm = this.get('searchTerm');
      if (Ember.isEmpty(searchTerm)) {
        searchTerm = " ";
      }
      console.log('transitionToRoute', 'documents', searchTerm, this.get('page'), this.get('sort'));
      this.transitionToRoute('documents', searchTerm, this.get('page'), this.get('sort'));
    },
    getDefaultSource: function () {
      return "<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body></html>";
    },
    actions: {
      openDocument(documentId) {
        this.transitionToRoute("code-editor", documentId);
      },
      deleteDocument(documentId) {
        if (confirm('Are you sure you want to delete?')) {
          this.get('documentService').deleteDoc(documentId).then(() => {
            console.log("deleted, updating results");
            this.set('searchTerm', this.get('sessionAccount').currentUserName);
            this.updateResults();
          }).catch(err => {
            console.log("error deleting", err);
            this.set('feedbackMessage', err.errors[0]);
          });
        }
      },
      checkboxClicked() {
        this.toggleProperty('isPrivate');
      },
      createNewDocument() {
        let docName = this.get('docName');
        docName = docName.replace(/\s/g, "-");
        const isPrivate = this.get('isPrivate');
        if (docName.length > 1) {
          this.get('documentService').makeNewDoc(docName, isPrivate, this.getDefaultSource(), null).then(() => {
            console.log("new doc created");
            const currentUser = this.get('sessionAccount').currentUserName;
            this.get('store').query('document', {
              filter: { search: docName,
                page: 0,
                currentUser: currentUser,
                sortBy: 'date' }
            }).then(documents => {
              console.log("new doc found, transitioning", documents);
              this.get('sessionAccount').updateOwnedDocuments();
              this.transitionToRoute('code-editor', documents.firstObject.documentId);
            });
          }).catch(err => {
            console.log("error making doc", err);
            this.set('feedbackMessage', err);
          });
        } else {
          this.set('feedbackMessage', 'Please enter a name');
        }
      },
      search() {
        this.set('page', 0);
        this.updateResults();
      },
      nextPage() {
        this.incrementProperty('page');
        this.updateResults();
      },
      prevPage() {
        this.decrementProperty('page');
        this.updateResults();
      },
      recent() {
        //this.set('searchTerm', " ");
        this.set('page', 0);
        this.set('sort', "date");
        this.updateResults();
      },
      popular() {
        //this.set('searchTerm', " ");
        this.set('page', 0);
        this.set('sort', "views");
        this.updateResults();
      },
      forked() {
        //this.set('searchTerm', " ");
        this.set('page', 0);
        this.set('sort', "forks");
        this.updateResults();
      },
      editted() {
        //this.set('searchTerm', " ");
        this.set('page', 0);
        this.set('sort', "edits");
        this.updateResults();
      },
      updated() {
        //this.set('searchTerm', " ");
        this.set('page', 0);
        this.set('sort', "updated");
        this.updateResults();
      },
      tag(tag) {
        this.set('searchTerm', tag);
        this.set('page', 0);
        this.set('sort', "views");
        this.updateResults();
      }
    }
  });
});
define('ember-share-db/controllers/login', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    session: Ember.inject.service('session'),
    sessionAccount: Ember.inject.service('session-account'),
    passwordReset: Ember.inject.service('password-reset'),
    store: Ember.inject.service(),
    validateRegistration: function () {
      return new Ember.RSVP.Promise((resolve, reject) => {
        let { newUsername, newUserPassword, newUserPasswordAgain } = this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
        if (!newUsername || !newUserPassword || !newUserPasswordAgain) {
          reject("please provide correct info");
        }
        if (newUserPassword != newUserPasswordAgain) {
          reject("passwords do not match");
        }
        resolve();
      });
    },
    actions: {
      invalidateSession() {
        this.get('session').invalidate();
      },
      authenticate() {
        let { identification, password } = this.getProperties('identification', 'password');
        console.log(identification, password);
        this.get('session').authenticate('authenticator:oauth2', identification, password).then(response => {
          console.log("authenticated", response);
          this.set('loginErrorMessage', "authenticated");
        }).catch(err => {
          this.set('loginErrorMessage', err.error_description);
        });
      },
      createNewUser() {
        let { newUsername, newUserEmail, newUserPassword, newUserPasswordAgain } = this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
        console.log(newUsername, newUserEmail, newUserPassword, newUserPasswordAgain);
        this.validateRegistration().then(() => {
          let user = this.get('store').createRecord('account', {
            username: newUsername,
            password: newUserPassword,
            email: newUserEmail,
            created: new Date()
          });
          user.save().then(() => {
            console.log("user created");
            this.set('registerMessage', 'user created');
          }).catch(err => {
            console.log(err);
            this.set('registerMessage', 'Error:' + err.errors[0].detail);
          });
        }).catch(err => {
          this.set('registerMessage', 'Error:' + err);
        });
      },
      resetPassword() {
        let username = this.get('resetUsername');
        this.get('passwordReset').requestReset(username).then(() => {
          console.log("password reset");
          this.set('resetMessage', 'password reset link generated');
        }).catch(err => {
          console.log(err);
          this.set('resetMessage', 'Error:' + err.errors[0].detail);
        });
      }
    }
  });
});
define('ember-share-db/controllers/password-reset', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    queryParams: ['username', 'token'],
    passwordReset: Ember.inject.service('password-reset'),
    hasValidToken: false,
    resetMessage: "",
    isTokenValid() {
      let username = this.get('username');
      let token = this.get('token');
      console.log('checking valid ', username, token);
      this.get('passwordReset').checkToken(username, token).then(() => {
        this.set('hasValidToken', true);
      }).catch(() => {
        this.set('hasValidToken', false);
      });
    },
    validatePasswords: function () {
      return new Ember.RSVP.Promise((resolve, reject) => {
        let { password, passwordAgain } = this.getProperties('password', 'passwordAgain');
        if (!password || !passwordAgain) {
          reject("please provide correct info");
        }
        if (password != passwordAgain) {
          reject("passwords do not match");
        }
        resolve();
      });
    },
    actions: {
      resetPassword() {
        let password = this.get('password');
        this.validatePasswords().then(() => {
          let username = this.get('username');
          let token = this.get('token');
          this.get('passwordReset').updatePassword(username, token, password).then(() => {
            this.set('resetMessage', 'Password updated successfuly');
          }).catch(err => {
            this.set('resetMessage', 'Error:' + err.responseText);
          });
        }).catch(err => {
          this.set('resetMessage', 'Error:' + err.responseText);
        });
      }
    }
  });
});
define('ember-share-db/helpers/abs', ['exports', 'ember-math-helpers/helpers/abs'], function (exports, _abs) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _abs.default;
    }
  });
  Object.defineProperty(exports, 'abs', {
    enumerable: true,
    get: function () {
      return _abs.abs;
    }
  });
});
define('ember-share-db/helpers/acos', ['exports', 'ember-math-helpers/helpers/acos'], function (exports, _acos) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _acos.default;
    }
  });
  Object.defineProperty(exports, 'acos', {
    enumerable: true,
    get: function () {
      return _acos.acos;
    }
  });
});
define('ember-share-db/helpers/acosh', ['exports', 'ember-math-helpers/helpers/acosh'], function (exports, _acosh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _acosh.default;
    }
  });
  Object.defineProperty(exports, 'acosh', {
    enumerable: true,
    get: function () {
      return _acosh.acosh;
    }
  });
});
define('ember-share-db/helpers/add', ['exports', 'ember-math-helpers/helpers/add'], function (exports, _add) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _add.default;
    }
  });
  Object.defineProperty(exports, 'add', {
    enumerable: true,
    get: function () {
      return _add.add;
    }
  });
});
define('ember-share-db/helpers/app-version', ['exports', 'ember-share-db/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;
  function appVersion(_, hash = {}) {
    const version = _environment.default.APP.version;
    // e.g. 1.0.0-alpha.1+4jds75hf

    // Allow use of 'hideSha' and 'hideVersion' For backwards compatibility
    let versionOnly = hash.versionOnly || hash.hideSha;
    let shaOnly = hash.shaOnly || hash.hideVersion;

    let match = null;

    if (versionOnly) {
      if (hash.showExtended) {
        match = version.match(_regexp.versionExtendedRegExp); // 1.0.0-alpha.1
      }
      // Fallback to just version
      if (!match) {
        match = version.match(_regexp.versionRegExp); // 1.0.0
      }
    }

    if (shaOnly) {
      match = version.match(_regexp.shaRegExp); // 4jds75hf
    }

    return match ? match[0] : version;
  }

  exports.default = Ember.Helper.helper(appVersion);
});
define('ember-share-db/helpers/asin', ['exports', 'ember-math-helpers/helpers/asin'], function (exports, _asin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _asin.default;
    }
  });
  Object.defineProperty(exports, 'asin', {
    enumerable: true,
    get: function () {
      return _asin.asin;
    }
  });
});
define('ember-share-db/helpers/asinh', ['exports', 'ember-math-helpers/helpers/asinh'], function (exports, _asinh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _asinh.default;
    }
  });
  Object.defineProperty(exports, 'asinh', {
    enumerable: true,
    get: function () {
      return _asinh.asinh;
    }
  });
});
define('ember-share-db/helpers/atan', ['exports', 'ember-math-helpers/helpers/atan'], function (exports, _atan) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _atan.default;
    }
  });
  Object.defineProperty(exports, 'atan', {
    enumerable: true,
    get: function () {
      return _atan.atan;
    }
  });
});
define('ember-share-db/helpers/atan2', ['exports', 'ember-math-helpers/helpers/atan2'], function (exports, _atan) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _atan.default;
    }
  });
  Object.defineProperty(exports, 'atan2', {
    enumerable: true,
    get: function () {
      return _atan.atan2;
    }
  });
});
define('ember-share-db/helpers/atanh', ['exports', 'ember-math-helpers/helpers/atanh'], function (exports, _atanh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _atanh.default;
    }
  });
  Object.defineProperty(exports, 'atanh', {
    enumerable: true,
    get: function () {
      return _atanh.atanh;
    }
  });
});
define('ember-share-db/helpers/bs-contains', ['exports', 'ember-bootstrap/helpers/bs-contains'], function (exports, _bsContains) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsContains.default;
    }
  });
  Object.defineProperty(exports, 'bsContains', {
    enumerable: true,
    get: function () {
      return _bsContains.bsContains;
    }
  });
});
define('ember-share-db/helpers/bs-eq', ['exports', 'ember-bootstrap/helpers/bs-eq'], function (exports, _bsEq) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsEq.default;
    }
  });
  Object.defineProperty(exports, 'eq', {
    enumerable: true,
    get: function () {
      return _bsEq.eq;
    }
  });
});
define('ember-share-db/helpers/cancel-all', ['exports', 'ember-concurrency/helpers/cancel-all'], function (exports, _cancelAll) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cancelAll.default;
    }
  });
  Object.defineProperty(exports, 'cancelAll', {
    enumerable: true,
    get: function () {
      return _cancelAll.cancelAll;
    }
  });
});
define('ember-share-db/helpers/cbrt', ['exports', 'ember-math-helpers/helpers/cbrt'], function (exports, _cbrt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cbrt.default;
    }
  });
  Object.defineProperty(exports, 'cbrt', {
    enumerable: true,
    get: function () {
      return _cbrt.cbrt;
    }
  });
});
define('ember-share-db/helpers/ceil', ['exports', 'ember-math-helpers/helpers/ceil'], function (exports, _ceil) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _ceil.default;
    }
  });
  Object.defineProperty(exports, 'ceil', {
    enumerable: true,
    get: function () {
      return _ceil.ceil;
    }
  });
});
define('ember-share-db/helpers/clz32', ['exports', 'ember-math-helpers/helpers/clz32'], function (exports, _clz) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _clz.default;
    }
  });
  Object.defineProperty(exports, 'clz32', {
    enumerable: true,
    get: function () {
      return _clz.clz32;
    }
  });
});
define('ember-share-db/helpers/cos', ['exports', 'ember-math-helpers/helpers/cos'], function (exports, _cos) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cos.default;
    }
  });
  Object.defineProperty(exports, 'cos', {
    enumerable: true,
    get: function () {
      return _cos.cos;
    }
  });
});
define('ember-share-db/helpers/cosh', ['exports', 'ember-math-helpers/helpers/cosh'], function (exports, _cosh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cosh.default;
    }
  });
  Object.defineProperty(exports, 'cosh', {
    enumerable: true,
    get: function () {
      return _cosh.cosh;
    }
  });
});
define('ember-share-db/helpers/div', ['exports', 'ember-math-helpers/helpers/div'], function (exports, _div) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _div.default;
    }
  });
  Object.defineProperty(exports, 'div', {
    enumerable: true,
    get: function () {
      return _div.div;
    }
  });
});
define('ember-share-db/helpers/exp', ['exports', 'ember-math-helpers/helpers/exp'], function (exports, _exp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _exp.default;
    }
  });
  Object.defineProperty(exports, 'exp', {
    enumerable: true,
    get: function () {
      return _exp.exp;
    }
  });
});
define('ember-share-db/helpers/expm1', ['exports', 'ember-math-helpers/helpers/expm1'], function (exports, _expm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _expm.default;
    }
  });
  Object.defineProperty(exports, 'expm1', {
    enumerable: true,
    get: function () {
      return _expm.expm1;
    }
  });
});
define('ember-share-db/helpers/floor', ['exports', 'ember-math-helpers/helpers/floor'], function (exports, _floor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _floor.default;
    }
  });
  Object.defineProperty(exports, 'floor', {
    enumerable: true,
    get: function () {
      return _floor.floor;
    }
  });
});
define('ember-share-db/helpers/fround', ['exports', 'ember-math-helpers/helpers/fround'], function (exports, _fround) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _fround.default;
    }
  });
  Object.defineProperty(exports, 'fround', {
    enumerable: true,
    get: function () {
      return _fround.fround;
    }
  });
});
define('ember-share-db/helpers/hypot', ['exports', 'ember-math-helpers/helpers/hypot'], function (exports, _hypot) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hypot.default;
    }
  });
  Object.defineProperty(exports, 'hypot', {
    enumerable: true,
    get: function () {
      return _hypot.hypot;
    }
  });
});
define('ember-share-db/helpers/imul', ['exports', 'ember-math-helpers/helpers/imul'], function (exports, _imul) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _imul.default;
    }
  });
  Object.defineProperty(exports, 'imul', {
    enumerable: true,
    get: function () {
      return _imul.imul;
    }
  });
});
define('ember-share-db/helpers/in-list', ['exports', 'ember-railio-grid/helpers/in-list'], function (exports, _inList) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _inList.default;
    }
  });
  Object.defineProperty(exports, 'inList', {
    enumerable: true,
    get: function () {
      return _inList.inList;
    }
  });
});
define('ember-share-db/helpers/is-equal', ['exports', 'ember-railio-grid/helpers/is-equal'], function (exports, _isEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isEqual.default;
    }
  });
});
define('ember-share-db/helpers/log-e', ['exports', 'ember-math-helpers/helpers/log-e'], function (exports, _logE) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _logE.default;
    }
  });
  Object.defineProperty(exports, 'logE', {
    enumerable: true,
    get: function () {
      return _logE.logE;
    }
  });
});
define('ember-share-db/helpers/log10', ['exports', 'ember-math-helpers/helpers/log10'], function (exports, _log) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _log.default;
    }
  });
  Object.defineProperty(exports, 'log10', {
    enumerable: true,
    get: function () {
      return _log.log10;
    }
  });
});
define('ember-share-db/helpers/log1p', ['exports', 'ember-math-helpers/helpers/log1p'], function (exports, _log1p) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _log1p.default;
    }
  });
  Object.defineProperty(exports, 'log1p', {
    enumerable: true,
    get: function () {
      return _log1p.log1p;
    }
  });
});
define('ember-share-db/helpers/log2', ['exports', 'ember-math-helpers/helpers/log2'], function (exports, _log) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _log.default;
    }
  });
  Object.defineProperty(exports, 'log2', {
    enumerable: true,
    get: function () {
      return _log.log2;
    }
  });
});
define('ember-share-db/helpers/max', ['exports', 'ember-math-helpers/helpers/max'], function (exports, _max) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _max.default;
    }
  });
  Object.defineProperty(exports, 'max', {
    enumerable: true,
    get: function () {
      return _max.max;
    }
  });
});
define('ember-share-db/helpers/min', ['exports', 'ember-math-helpers/helpers/min'], function (exports, _min) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _min.default;
    }
  });
  Object.defineProperty(exports, 'min', {
    enumerable: true,
    get: function () {
      return _min.min;
    }
  });
});
define('ember-share-db/helpers/mod', ['exports', 'ember-math-helpers/helpers/mod'], function (exports, _mod) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mod.default;
    }
  });
  Object.defineProperty(exports, 'mod', {
    enumerable: true,
    get: function () {
      return _mod.mod;
    }
  });
});
define('ember-share-db/helpers/mult', ['exports', 'ember-math-helpers/helpers/mult'], function (exports, _mult) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mult.default;
    }
  });
  Object.defineProperty(exports, 'mult', {
    enumerable: true,
    get: function () {
      return _mult.mult;
    }
  });
});
define('ember-share-db/helpers/perform', ['exports', 'ember-concurrency/helpers/perform'], function (exports, _perform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _perform.default;
    }
  });
  Object.defineProperty(exports, 'perform', {
    enumerable: true,
    get: function () {
      return _perform.perform;
    }
  });
});
define('ember-share-db/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _pluralize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _pluralize.default;
});
define('ember-share-db/helpers/pow', ['exports', 'ember-math-helpers/helpers/pow'], function (exports, _pow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pow.default;
    }
  });
  Object.defineProperty(exports, 'pow', {
    enumerable: true,
    get: function () {
      return _pow.pow;
    }
  });
});
define('ember-share-db/helpers/random', ['exports', 'ember-math-helpers/helpers/random'], function (exports, _random) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _random.default;
    }
  });
  Object.defineProperty(exports, 'random', {
    enumerable: true,
    get: function () {
      return _random.random;
    }
  });
});
define('ember-share-db/helpers/round', ['exports', 'ember-math-helpers/helpers/round'], function (exports, _round) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _round.default;
    }
  });
  Object.defineProperty(exports, 'round', {
    enumerable: true,
    get: function () {
      return _round.round;
    }
  });
});
define('ember-share-db/helpers/route-action', ['exports', 'ember-route-action-helper/helpers/route-action'], function (exports, _routeAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _routeAction.default;
    }
  });
});
define('ember-share-db/helpers/sign', ['exports', 'ember-math-helpers/helpers/sign'], function (exports, _sign) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sign.default;
    }
  });
  Object.defineProperty(exports, 'sign', {
    enumerable: true,
    get: function () {
      return _sign.sign;
    }
  });
});
define('ember-share-db/helpers/sin', ['exports', 'ember-math-helpers/helpers/sin'], function (exports, _sin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sin.default;
    }
  });
  Object.defineProperty(exports, 'sin', {
    enumerable: true,
    get: function () {
      return _sin.sin;
    }
  });
});
define('ember-share-db/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _singularize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _singularize.default;
});
define('ember-share-db/helpers/sqrt', ['exports', 'ember-math-helpers/helpers/sqrt'], function (exports, _sqrt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sqrt.default;
    }
  });
  Object.defineProperty(exports, 'sqrt', {
    enumerable: true,
    get: function () {
      return _sqrt.sqrt;
    }
  });
});
define('ember-share-db/helpers/sub', ['exports', 'ember-math-helpers/helpers/sub'], function (exports, _sub) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sub.default;
    }
  });
  Object.defineProperty(exports, 'sub', {
    enumerable: true,
    get: function () {
      return _sub.sub;
    }
  });
});
define('ember-share-db/helpers/tan', ['exports', 'ember-math-helpers/helpers/tan'], function (exports, _tan) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tan.default;
    }
  });
  Object.defineProperty(exports, 'tan', {
    enumerable: true,
    get: function () {
      return _tan.tan;
    }
  });
});
define('ember-share-db/helpers/tanh', ['exports', 'ember-math-helpers/helpers/tanh'], function (exports, _tanh) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tanh.default;
    }
  });
  Object.defineProperty(exports, 'tanh', {
    enumerable: true,
    get: function () {
      return _tanh.tanh;
    }
  });
});
define('ember-share-db/helpers/task', ['exports', 'ember-concurrency/helpers/task'], function (exports, _task) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _task.default;
    }
  });
  Object.defineProperty(exports, 'task', {
    enumerable: true,
    get: function () {
      return _task.task;
    }
  });
});
define('ember-share-db/helpers/trunc', ['exports', 'ember-math-helpers/helpers/trunc'], function (exports, _trunc) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _trunc.default;
    }
  });
  Object.defineProperty(exports, 'trunc', {
    enumerable: true,
    get: function () {
      return _trunc.trunc;
    }
  });
});
define('ember-share-db/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'ember-share-db/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let name, version;
  if (_environment.default.APP) {
    name = _environment.default.APP.name;
    version = _environment.default.APP.version;
  }

  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});
define('ember-share-db/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize() {
      let app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('ember-share-db/initializers/ember-concurrency', ['exports', 'ember-concurrency/initializers/ember-concurrency'], function (exports, _emberConcurrency) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberConcurrency.default;
    }
  });
  Object.defineProperty(exports, 'initialize', {
    enumerable: true,
    get: function () {
      return _emberConcurrency.initialize;
    }
  });
});
define('ember-share-db/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data'], function (exports, _setupContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-data',
    initialize: _setupContainer.default
  };
});
define('ember-share-db/initializers/ember-simple-auth', ['exports', 'ember-share-db/config/environment', 'ember-simple-auth/configuration', 'ember-simple-auth/initializers/setup-session', 'ember-simple-auth/initializers/setup-session-service', 'ember-simple-auth/initializers/setup-session-restoration'], function (exports, _environment, _configuration, _setupSession, _setupSessionService, _setupSessionRestoration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize(registry) {
      const config = _environment.default['ember-simple-auth'] || {};
      config.baseURL = _environment.default.rootURL || _environment.default.baseURL;
      _configuration.default.load(config);

      (0, _setupSession.default)(registry);
      (0, _setupSessionService.default)(registry);
      (0, _setupSessionRestoration.default)(registry);
    }
  };
});
define('ember-share-db/initializers/export-application-global', ['exports', 'ember-share-db/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function () {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('ember-share-db/initializers/load-bootstrap-config', ['exports', 'ember-share-db/config/environment', 'ember-bootstrap/config'], function (exports, _environment, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() /* container, application */{
    _config.default.load(_environment.default['ember-bootstrap'] || {});
  }

  exports.default = {
    name: 'load-bootstrap-config',
    initialize
  };
});
define("ember-share-db/instance-initializers/ember-data", ["exports", "ember-data/initialize-store-service"], function (exports, _initializeStoreService) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: "ember-data",
    initialize: _initializeStoreService.default
  };
});
define('ember-share-db/instance-initializers/ember-simple-auth', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize() {}
  };
});
define('ember-share-db/instance-initializers/session-events', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize(instance) {
    const applicationRoute = instance.lookup('route:application');
    const session = instance.lookup('service:session');
    session.on('authenticationSucceeded', function () {
      console.log('authenticationSucceeded callback');
      applicationRoute.transitionTo('application');
    });
    session.on('invalidationSucceeded', function () {
      console.log('invalidationSucceeded callback');
      applicationRoute.transitionTo('application');
    });
  }

  exports.default = {
    initialize,
    name: 'session-events',
    after: 'ember-simple-auth'
  };
});
define('ember-share-db/models/account', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const { attr, Model } = _emberData.default;

  exports.default = Model.extend({
    username: attr('string'),
    password: attr('string'),
    email: attr('string'),
    created: attr('date'),
    accountId: attr('string')
  });
});
define('ember-share-db/models/asset', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  const { attr } = _emberData.default;

  exports.default = _emberData.default.Model.extend({
    fileType: attr('string'),
    fileId: attr('string'),
    size: attr('string'),
    b64data: attr('string'),
    name: attr('string')
  });
});
define('ember-share-db/models/document', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    source: _emberData.default.attr('string'),
    owner: _emberData.default.attr('string'),
    name: _emberData.default.attr('string'),
    created: _emberData.default.attr('date'),
    isPrivate: _emberData.default.attr('boolean'),
    readOnly: _emberData.default.attr('boolean'),
    documentId: _emberData.default.attr('string'),
    lastEdited: _emberData.default.attr('date'),
    assets: _emberData.default.attr(),
    tags: _emberData.default.attr(),
    forkedFrom: _emberData.default.attr('string'),
    savedVals: _emberData.default.attr(),
    newEval: _emberData.default.attr('string'),
    stats: _emberData.default.attr(),
    flags: _emberData.default.attr('number'),
    dontPlay: _emberData.default.attr('boolean')
  });
});
define('ember-share-db/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});
define('ember-share-db/router', ['exports', 'ember-share-db/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const Router = Ember.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  });

  Router.map(function () {
    this.route('login');
    this.route('code-editor', { path: '/code/:documentId' });
    this.route('documents', { path: '/d/:search/:page/:sort' });
    this.route('password-reset');
    this.route('about');
    this.route('terms');
  });

  exports.default = Router;
});
define('ember-share-db/routes/about', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({});
});
define('ember-share-db/routes/application', ['exports', 'ember-simple-auth/mixins/application-route-mixin'], function (exports, _applicationRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_applicationRouteMixin.default, {
    activate() {
      console.log('entering application route');
    },
    sessionAccount: Ember.inject.service('session-account'),
    session: Ember.inject.service('session'),
    beforeModel() {
      console.log('beforeModel application route');
      this._loadCurrentUser();
    },
    sessionAuthenticated() {
      this._super(...arguments);
      this._loadCurrentUser();
    },
    _loadCurrentUser() {
      console.log('loading current user');
      this.get('sessionAccount').loadCurrentUser().then(() => {
        this.get('sessionAccount').updateOwnedDocuments();
      }).catch(() => {
        this.get('session').invalidate();
      });
    }
  });
});
define('ember-share-db/routes/code-editor', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    queryParams: {
      hideEditor: {
        replace: true
      },
      embed: {
        replace: true
      }
    },
    model: function (params) {
      return this.get('store').findRecord('document', params.documentId);
    },
    setupController: function (controller, model) {
      this._super(controller, model);
      if (model) {
        controller.send('refresh');
      }
    },
    deactivate: function () {
      console.log("leaving code-editor");
      this._super();
      this.get('controller').send('cleanUp');
    },
    actions: {
      error(error, transition) {
        if (error.errors[0].status === '404') {
          this.replaceWith('application');
        } else {
          return true;
        }
      }
    }
  });
});
define('ember-share-db/routes/documents', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    sessionAccount: Ember.inject.service("session-account"),
    model(params) {
      let currentUser = this.get('sessionAccount').currentUserName;
      if (!currentUser) {
        currentUser = "";
      }
      const sort = params.sort ? params.sort : "views";
      const filter = {
        filter: {
          search: params.search,
          page: params.page,
          currentUser: currentUser,
          sortBy: params.sort
        }
      };
      console.log('reloading document model');
      return this.get('store').query('document', filter);
    },
    actions: {
      error(error, transition) {
        console.log("ERROR", error);
        const err = error.errors ? error.errors : error;
        if (error) {
          if (err.status === '404') {
            console.log("ERROR 404");
            this.replaceWith('application');
          } else {
            return true;
          }
        }
      }
    }
  });
});
define('ember-share-db/routes/index', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    beforeModel() {
      this.transitionTo('documents', " ", 0, "views");
    }
  });
});
define('ember-share-db/routes/login', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend();
});
define('ember-share-db/routes/password-reset', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({
    setupController: function (controller, model) {
      controller.isTokenValid();
    }
  });
});
define('ember-share-db/routes/terms', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend({});
});
define('ember-share-db/serializers/document', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.JSONAPISerializer.extend({
    keyForAttribute(attr) {
      if (attr == 'document-Id') return 'documentId';else {
        return attr;
      }
    }
  });
});
define('ember-share-db/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _ajax) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _ajax.default;
    }
  });
});
define('ember-share-db/services/assets', ['exports', 'ember-share-db/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    sessionAccount: Ember.inject.service('session-account'),
    store: Ember.inject.service('store'),
    deleteAsset(fileId) {
      console.log("deleteAsset for " + fileId);
      let doc = this.get('sessionAccount').currentDoc;
      let data = { documentId: doc };
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "DELETE",
          url: _environment.default.serverHost + "/asset/" + fileId,
          data: data
        }).then(res => {
          console.log("success", res);
          resolve();
        }).catch(err => {
          console.log("error", err);
          reject(err);
        });
      });
    },
    _fetchAsset(asset, ctr, callback) {
      console.log("fetching asset:" + asset);
      const fileId = asset.fileId;
      const fileName = asset.name;
      const fileType = asset.fileType;
      const inStoreAsset = this.get('store').peekRecord('asset', fileId);
      if (!Ember.isEmpty(inStoreAsset) && !Ember.isEmpty(inStoreAsset.b64data)) {
        console.log("asset already preloaded:" + fileId);
        callback(ctr);
        return;
      }
      var xhr = new XMLHttpRequest();
      var url = _environment.default.serverHost + "/asset/" + fileId;
      xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          console.log("fetched asset:" + fileId);
          this.get('store').push({
            data: [{
              id: fileId,
              type: "asset",
              attributes: {
                fileId: fileId,
                name: fileName,
                b64data: this._b64e(xhr.responseText),
                fileType: fileType
              }
            }]
          });
          callback(ctr);
        }
      };
      xhr.onerror = () => {
        console.log("error fetching/converting asset:" + fileId);
        callback(ctr);
      };
      xhr.overrideMimeType("text/plain; charset=x-user-defined");
      xhr.open("GET", url, true);
      xhr.send(null);
    },
    preloadAssets(assets) {
      console.log("preloadAssets:" + assets);
      return new Ember.RSVP.Promise((resolve, reject) => {
        var ctr = 0;
        var callback = newCtr => {
          newCtr++;
          if (newCtr == assets.length) {
            resolve();
          } else {
            this._fetchAsset(assets[newCtr], newCtr, callback);
          }
        };
        this._fetchAsset(assets[ctr], ctr, callback);
      });
    },
    _b64e(str) {
      console.log("converting to base64");
      // from this SO question
      // http://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de
      let CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let out = "",
          i = 0,
          len = str.length,
          c1,
          c2,
          c3;
      while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt((c1 & 0x3) << 4 | (c2 & 0xF0) >> 4);
          out += CHARS.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt((c1 & 0x3) << 4 | (c2 & 0xF0) >> 4);
        out += CHARS.charAt((c2 & 0xF) << 2 | (c3 & 0xC0) >> 6);
        out += CHARS.charAt(c3 & 0x3F);
      }
      return out;
    }
  });
});
define('ember-share-db/services/code-parsing', ['exports', 'npm:acorn'], function (exports, _npmAcorn) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    store: Ember.inject.service('store'),
    script: "",
    savedVals: null,
    hasPVals: false,
    insertStatefullCallbacks(src, savedVals) {
      let newSrc = "";
      this.set('savedVals', savedVals);
      this.set('hasPVals', false);
      const scripts = this.getScripts(src);
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        this.set('script', script);
        newSrc = newSrc + script.preamble;
        let parsed;
        try {
          parsed = _npmAcorn.default.parse(script.script);
        } catch (err) {
          console.log("Error parsing script", script.script);
        }
        if (parsed) {
          for (let j = 0; j < parsed.body.length; j++) {
            newSrc = newSrc + this.parseNode(parsed.body[j]);
          }
        }
        newSrc = newSrc + script.post;
      }
      //console.log(newSrc);
      return this.get('hasPVals') ? newSrc : src;
    },
    getScripts(source) {
      let searchIndex = 0,
          index = 0,
          ptr = 0,
          prevEnd = 0,
          startIndex = 0;
      let searchStrs = ['<script', ">", "</script>"];
      let scripts = [];
      let preamble = "";
      while ((index = source.indexOf(searchStrs[ptr], searchIndex)) > -1) {
        searchIndex = index + searchStrs[ptr].length;
        if (ptr == 1) {
          startIndex = searchIndex;
          preamble = source.substring(prevEnd, searchIndex);
        } else if (ptr == 2) {
          scripts.push({
            preamble: preamble,
            script: source.substring(startIndex, index - 1),
            post: "\n</script>"
          });
          prevEnd = searchIndex;
        }
        ptr = (ptr + 1) % searchStrs.length;
      }
      if (scripts.length > 0) {
        scripts[scripts.length - 1].post = scripts[scripts.length - 1].post + source.substr(prevEnd);
      }
      return scripts;
    },
    parseNode(node, fromAlt = false) {
      //console.log(node)
      const script = this.get('script');
      let newSrc = "";
      let parsed = false;
      try {
        if (node.type == "VariableDeclaration" && node.declarations) {
          //console.log("VariableDeclaration");
          newSrc = newSrc + this.parseDeclaration(node, newSrc);
          parsed = true;
        } else if (node.params && node.type.includes("Function")) {
          //console.log("Function");
          newSrc = newSrc + this.parseFunction(node, newSrc);
          parsed = true;
        } else if (node.type.includes("Expression")) {
          if (node.expression) {
            newSrc = newSrc + this.parseNode(node.expression, newSrc);
          } else {
            newSrc = newSrc + this.parseExpression(node, newSrc);
          }
          parsed = true;
        } else if (node.consequent) {
          //console.log("Conditional");
          newSrc = newSrc + this.parseConditional(node, newSrc, fromAlt);
          parsed = true;
        } else if (node.type == "ReturnStatement") {
          //console.log("ReturnStatement");
          newSrc = newSrc + this.parseReturnStatement(node, newSrc);
          parsed = true;
        } else if (node.type == "ForStatement") {
          //console.log("ForStatement");
          let exp = "for(" + script.script.substring(node.init.start, node.init.end) + ";";
          exp = exp + script.script.substring(node.test.start, node.test.end) + ";";
          exp = exp + script.script.substring(node.update.start, node.update.end);
          exp = exp + ")\n{\n";
          newSrc = this.insert(newSrc, exp);
          newSrc = newSrc + this.parseNode(node.body);
          newSrc = this.insert(newSrc, "}");
          parsed = true;
        } else if (node.type == "ForInStatement") {
          //console.log("ForInStatement");
          const right = this.getName(node.right);
          const left = node.left.kind + " " + node.left.declarations[0].id.name;
          let exp = "for(" + left + " in " + right + ")\n{";
          newSrc = this.insert(newSrc, exp);
          newSrc = newSrc + this.parseNode(node.body);
          newSrc = this.insert(newSrc, "}");
          parsed = true;
        } else if (node.type == "DoWhileStatement") {
          //console.log("DoWhileStatement");
          newSrc = this.insert(newSrc, "do {");
          newSrc = newSrc + this.parseNode(node.body);
          newSrc = this.insert(newSrc, "}");
          newSrc = this.insert(newSrc, "while(");
          newSrc = newSrc + script.script.substring(node.test.start, node.test.end);
          newSrc = newSrc + ")";
          parsed = true;
        } else if (node.type == "WhileStatement") {
          //console.log("WhileStatement");
          let exp = "while(" + script.script.substring(node.test.start, node.test.end);
          exp = exp + ")\n{\n";
          newSrc = this.insert(newSrc, exp);
          newSrc = newSrc + this.parseNode(node.body);
          newSrc = this.insert(newSrc, "}");
          parsed = true;
        } else if (node.type == "TryStatement") {
          //console.log("TryStatement");
          newSrc = this.insert(newSrc, "try {\n");
          newSrc = newSrc + this.parseNode(node.block);
          newSrc = this.insert(newSrc, "\n} catch(");
          newSrc = newSrc + node.handler.param.name + ") {\n";
          newSrc = newSrc + this.parseNode(node.handler.body);
          newSrc = this.insert(newSrc, "}");
          if (node.finalizer) {
            newSrc = this.insert(newSrc, "finally {\n");
            newSrc = newSrc + this.parseNode(node.finalizer);
            newSrc = this.insert(newSrc, "}");
          }
          parsed = true;
        } else if (node.body && node.type == "BlockStatement") {
          //console.log("BlockStatement");
          for (let i = 0; i < node.body.length; i++) {
            newSrc = newSrc + this.parseNode(node.body[i]);
          }
          parsed = true;
        } else if (node.type == "Literal") {
          //console.log("Literal");
          newSrc = newSrc + node.raw;
          parsed = true;
        }
      } catch (err) {
        console.log(node, err);
        parsed = false;
      }
      //If not parsed, insert verbatim
      if (!parsed) {
        //console.log("Not parsed");
        const exp = script.script.substring(node.start, node.end);
        newSrc = newSrc + exp;
      }
      return newSrc;
    },
    insert(source, item) {
      return source + "\n" + item;
    },
    getName(node) {
      let name = node.name;
      let exp = "";
      if (!name && node.property) {
        let object = node;
        while (!name) {
          const prop = object.property;
          const propName = prop.name ? prop.name : prop.value;
          if (object.computed) {
            exp = "[" + propName + "]" + exp;
          } else {
            exp = "." + propName + exp;
          }
          object = object.object;
          name = object.name;
        }
        exp = object.name + exp;
      } else {
        exp = name;
      }
      return exp;
    },
    parseDeclaration(node, newSrc) {
      const script = this.get('script');
      newSrc = this.insert(newSrc, node.kind + " ");
      for (let i = 0; i < node.declarations.length; i++) {
        const dec = node.declarations[i];
        const name = dec.id.name;
        const init = dec.init;
        let savedVal = this.get('savedVals')[name];
        const delim = i >= node.declarations.length - 1 ? ";" : ",";
        let exp = script.script.substring(dec.start, dec.end) + delim;
        if (name.substring(0, 2) == "p_") {
          if (!init) {
            savedVal = savedVal ? savedVal : 0;
            exp = name + " = " + savedVal + delim;
            newSrc = newSrc + exp;
          } else {
            newSrc = newSrc + exp;
            const msg = "parent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");";
            newSrc = this.insert(newSrc, msg);
          }
          this.set('hasPVals', true);
        } else {
          if (init) {
            newSrc = newSrc + name + " = ";
            newSrc = newSrc + this.parseNode(init);
          } else {
            newSrc = newSrc + exp;
          }
        }
      }
      return newSrc;
    },
    parseExpression(node) {
      let newSrc = "";
      if (node.type == "FunctionExpression" || node.type == "ArrowFunctionExpression") {
        newSrc = newSrc + this.parseNode(node);
      } else if (node.type == "ObjectExpression") {
        newSrc = newSrc + " {";
        for (let j = 0; j < node.properties.length; j++) {
          const prop = node.properties[j];
          newSrc = newSrc + prop.key.name + ":";
          newSrc = newSrc + this.parseNode(prop.value);
          const delim = j < node.properties.length - 1 ? "," : "";
          newSrc = newSrc + delim;
        }
        newSrc = newSrc + "}";
      } else if (node.type == "NewExpression") {
        const constructorName = this.getName(node.callee);
        let exp = " new " + constructorName;
        exp = exp + this.parseArgs(node.arguments);
        newSrc = newSrc + exp;
      } else if (node.type == "ArrayExpression") {
        newSrc = newSrc + " [";
        for (let j = 0; j < node.elements.length; j++) {
          const element = node.elements[j];
          newSrc = newSrc + this.parseNode(element);
          const delim = j < node.elements.length - 1 ? "," : "";
          newSrc = newSrc + delim;
        }
        newSrc = newSrc + "]";
      } else if (node.type == "AssignmentExpression") {
        newSrc = newSrc + this.parseAssignment(node, newSrc);
      } else if (node.type == "CallExpression") {
        newSrc = newSrc + this.parseCallExpression(node, newSrc);
      } else {
        const script = this.get('script');
        const exp = script.script.substring(node.start, node.end);
        newSrc = this.insert(newSrc, exp);
      }
      return newSrc;
    },
    parseAssignment(node, newSrc) {
      const script = this.get('script');
      const exp = script.script.substring(node.start, node.end);
      newSrc = this.insert(newSrc, exp);
      let left = node.left;
      let name = left.name;
      while (!name) {
        if (left.object) {
          left = left.object;
        } else {
          name = left.name;
        }
      }
      //If an object or a property of it is changed, update with a JSON version of the WHOLE object
      if (name.substring(0, 2) == "p_") {
        this.set('hasPVals', true);
        const msg = "parent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");";
        newSrc = this.insert(newSrc, msg);
      }
      return newSrc;
    },
    parseArgs(args) {
      let exp = "(";
      for (let i = 0; i < args.length; i++) {
        exp = exp + this.parseNode(args[i]);
        const delim = i < args.length - 1 ? "," : "";
        exp = exp + delim;
      }
      exp = exp + ")";
      return exp;
    },
    parseCallExpression(node, newSrc) {
      let callee = node.callee;
      let exp = this.getName(callee);
      exp = exp + this.parseArgs(node.arguments);
      newSrc = this.insert(newSrc, exp);
      return newSrc;
    },
    parseFunction(node, newSrc) {
      const arrowFn = node.type == "ArrowFunctionExpression" || node.type == "ArrowFunctionDeclaration";
      let exp = arrowFn ? "" : "function ";
      if (node.id) {
        exp = exp + node.id.name;
      }
      exp = exp + "(";
      newSrc = this.insert(newSrc, exp);
      if (node.params.length > 0) {
        for (let i = 0; i < node.params.length; i++) {
          newSrc = newSrc + node.params[i].name;
          if (i < node.params.length - 1) {
            newSrc = newSrc + ",";
          }
        }
      }
      newSrc = newSrc + ")";
      if (arrowFn) {
        newSrc = newSrc + " => ";
      }
      newSrc = newSrc + " {\n";
      for (let i = 0; i < node.body.body.length; i++) {
        newSrc = newSrc + this.parseNode(node.body.body[i]);
      }
      newSrc = this.insert(newSrc, "}");
      return newSrc;
    },
    parseConditional(node, newSrc, fromAlt) {
      const script = this.get('script');
      const alt = node.alternate;
      let test = "if(" + script.script.substring(node.test.start, node.test.end) + ") {\n";
      if (fromAlt) {
        test = "else " + test;
      }
      newSrc = this.insert(newSrc, test);
      newSrc = newSrc + this.parseNode(node.consequent);
      newSrc = this.insert(newSrc, "}");
      if (alt) {
        if (!alt.test) {
          newSrc = this.insert(newSrc, "else {\n");
          newSrc = newSrc + this.parseNode(alt, true);
          newSrc = this.insert(newSrc, "}");
        } else {
          newSrc = newSrc + this.parseNode(alt, true);
        }
      }
      return newSrc;
    },
    parseReturnStatement(node, newSrc) {
      newSrc = this.insert(newSrc, "return ");
      if (node.argument) {
        newSrc = newSrc + this.parseNode(node.argument);
      }
      return newSrc;
    },
    replaceAssets(source, assets) {
      for (let i = 0; i < assets.length; i++) {
        const fileId = assets[i].fileId;
        const toFind = assets[i].name;
        const fileType = assets[i].fileType;
        const asset = this.get('store').peekRecord('asset', fileId);
        if (!Ember.isEmpty(asset)) {
          const b64 = "data:" + fileType + ";charset=utf-8;base64," + asset.b64data;
          source = source.replace(new RegExp(toFind, "gm"), b64);
        }
      }
      return source;
    },
    opTransform(ops, editor) {
      function opToDelta(op) {
        const index = op.p[op.p.length - 1];
        const session = editor.getSession();
        const pos = session.doc.indexToPosition(index, 0);
        const start = pos;
        let action;
        let lines;
        let end;
        if ('sd' in op) {
          action = 'remove';
          lines = op.sd.split('\n');
          const count = lines.reduce((total, line) => total + line.length, lines.length - 1);
          end = session.doc.indexToPosition(index + count, 0);
        } else if ('si' in op) {
          action = 'insert';
          lines = op.si.split('\n');
          if (lines.length === 1) {
            end = {
              row: start.row,
              column: start.column + op.si.length
            };
          } else {
            end = {
              row: start.row + (lines.length - 1),
              column: lines[lines.length - 1].length
            };
          }
        } else {
          throw new Error(`Invalid Operation: ${JSON.stringify(op)}`);
        }
        const delta = {
          start,
          end,
          action,
          lines
        };
        return delta;
      }
      const deltas = ops.map(opToDelta);
      return deltas;
    }
  });
});
define('ember-share-db/services/cookies', ['exports', 'ember-cookies/services/cookies'], function (exports, _cookies) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _cookies.default;
});
define('ember-share-db/services/documents', ['exports', 'ember-share-db/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    assetService: Ember.inject.service('assets'),
    store: Ember.inject.service('store'),
    sessionAccount: Ember.inject.service('session-account'),
    makeNewDoc(docName, isPrivate, source, forkedFrom) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const currentUser = this.get('sessionAccount').currentUserName;
        let doc = this.get('store').createRecord('document', {
          source: source,
          owner: currentUser,
          isPrivate: isPrivate,
          name: docName,
          documentId: null,
          forkedFrom: forkedFrom
        });
        doc.save().then(response => {
          console.log("saved new doc");
          resolve();
        }).catch(err => {
          console.log("error creating record");
          doc.deleteRecord();
          this.get('sessionAccount').updateOwnedDocuments();
          reject("error creating document, are you signed in?");
        });
      });
    },
    submitOp(op, doc) {
      if (Ember.isEmpty(doc)) {
        doc = this.get('sessionAccount').currentDoc;
      }
      const token = "Bearer " + this.get('sessionAccount').bearerToken;
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "POST",
          url: _environment.default.serverHost + "/submitOp",
          beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', token);
          },
          data: { op: op, documentId: doc }
        }).then(res => {
          resolve();
        }).catch(err => {
          reject(err);
        });
      });
    },
    getPopularTags(limit) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "GET",
          url: _environment.default.serverHost + "/tags?limit=" + limit
        }).then(res => {
          console.log("tags", res);
          resolve(res);
        }).catch(err => {
          reject(err);
        });
      });
    },
    deleteDoc(docId) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        this.get('store').findRecord('document', docId).then(doc => {
          let fn = asset => {
            return this.get('assetService').deleteAsset(asset.fileId);
          };
          var actions = doc.data.assets.map(fn);
          Promise.all(actions).then(() => {
            const token = "Bearer " + this.get('sessionAccount').bearerToken;
            console.log('deleting doc', docId);
            $.ajax({
              type: "DELETE",
              url: _environment.default.serverHost + "/documents/" + docId,
              beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', token);
              }
            }).then(res => {
              console.log('deleted', docId);
              const actions = [doc.deleteRecord(), this.get('sessionAccount').updateOwnedDocuments()];
              Promise.all(actions).then(resolve).catch(reject);
            }).catch(err => {
              console.log('error deleting', docId);
              reject(err);
            });
          });
        });
      });
    },
    flagDoc() {
      const doc = this.get('sessionAccount').currentDoc;
      const user = this.get('sessionAccount').currentUserName;
      const token = "Bearer " + this.get('sessionAccount').bearerToken;
      const params = "?user=" + user + "&documentId=" + doc;
      console.log('flagging doc', { user: user, documentId: doc });
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "GET",
          url: _environment.default.serverHost + "/canFlag" + params,
          beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', token);
          }
        }).then(res => {
          resolve();
        }).catch(err => {
          reject(err);
        });
      });
    }
  });
});
define('ember-share-db/services/modals-manager', ['exports', 'ember-bootstrap-modals-manager/services/modals-manager'], function (exports, _modalsManager) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _modalsManager.default;
    }
  });
});
define('ember-share-db/services/ops-player', ['exports', 'ember-share-db/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    parser: Ember.inject.service('code-parsing'),
    sessionAccount: Ember.inject.service('session-account'),
    ops: null,
    opsToApply: null,
    ptr: 0,
    prevDir: null,
    atHead: function () {
      const ptr = this.get('ptr');
      if (Ember.isEmpty(this.get('ops'))) {
        return true;
      } else {
        return ptr >= this.get('ops').length - 1;
      }
    },
    reset: function () {
      this.set('ptr', 0);
      this.set('ops', null);
    },
    loadOps: function () {
      const doc = this.get('sessionAccount').currentDoc;
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "GET",
          url: _environment.default.serverHost + "/documents/ops/" + doc
        }).then(res => {
          this.set('ops', res.data);
          this.set('ptr', this.get('ops').length);
          resolve(res.data);
        }).catch(err => {
          reject(err);
        });
      });
    },
    shift: function (prev, editor, rewind = false) {
      this.set('reachedEnd', false);
      return new Ember.RSVP.Promise((resolve, reject) => {
        const fetch = () => {
          if (rewind) {
            this.set('prevDir', null);
            this.set('ptr', 0);
          }
          this.updateOps(prev);
          resolve(this.getTransform(editor));
        };
        if (Ember.isEmpty(this.get('ops'))) {
          this.loadOps().then(() => {
            fetch();
          }).catch(err => {
            reject(err);
          });
        } else {
          fetch();
        }
      });
    },
    inBounds: function (ptr) {
      const ops = this.get('ops');
      const inBounds = ptr >= 0 && ptr < ops.length;
      return inBounds;
    },
    updateOps(prev) {
      this.set('opsToApply', null);
      let newPtr = this.get('ptr');
      if (!Ember.isEmpty(this.get('prevDir'))) {
        if (prev != this.get('prevDir')) {
          newPtr = prev ? newPtr + 1 : newPtr - 1;
        }
      }
      this.set('prevDir', prev);
      let hasHitBounds = false;
      while (!hasHitBounds && Ember.isEmpty(this.get('opsToApply'))) {
        newPtr = prev ? newPtr - 1 : newPtr + 1;
        if (this.inBounds(newPtr)) {
          const ops = this.get('ops')[newPtr];
          if (!Ember.isEmpty(ops.op)) {
            let toApply = [];
            for (let j = 0; j < ops.op.length; j++) {
              let op = ops.op[j];
              if (op.p[0] == "source") {
                //INVERT
                if (prev) {
                  if (op.si) {
                    op = { p: op.p, sd: op.si };
                  } else if (op.sd) {
                    op = { p: op.p, si: op.sd };
                  }
                }
                toApply.push(op);
              }
            }
            if (toApply.length > 0) {
              console.log(toApply);
              this.set('opsToApply', toApply);
            }
          }
        } else {
          hasHitBounds = true;
        }
      }
      if (this.inBounds(newPtr)) {
        this.set('ptr', newPtr);
      } else {
        this.set('reachedEnd', true);
      }
    },
    clamp(num, min, max) {
      return num <= min ? min : num >= max ? max : num;
    },
    prevOp: function (editor, rewind = false) {
      return this.shift(true, editor, rewind);
    },
    nextOp: function (editor, rewind = false) {
      return this.shift(false, editor, rewind);
    },
    getTransform: function (editor) {
      if (!Ember.isEmpty(this.get('opsToApply'))) {
        return this.get('parser').opTransform(this.get('opsToApply'), editor);
      } else {
        return [];
      }
    }
  });
});
define('ember-share-db/services/password-reset', ['exports', 'ember-share-db/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    sessionAccount: Ember.inject.service('session-account'),
    requestReset(username) {
      console.log("reset pword for " + username);
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "POST",
          url: _environment.default.serverHost + "/resetPassword",
          data: { username: username }
        }).then(res => {
          console.log("success", res);
          resolve();
        }).catch(err => {
          console.log("error", err);
          reject(err);
        });
      });
    },
    updatePassword(username, token, newPassword) {
      console.log("updatePassword to " + newPassword + " with " + token + " for " + username);
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "POST",
          url: _environment.default.serverHost + "/updatePassword",
          data: { username: username, token: token, password: newPassword }
        }).then(res => {
          console.log("success", res);
          resolve();
        }).catch(err => {
          console.log("error", err);
          reject(err);
        });
      });
    },
    checkToken(username, token) {
      console.log("check token " + token + " for " + username);
      return new Ember.RSVP.Promise((resolve, reject) => {
        $.ajax({
          type: "POST",
          url: _environment.default.serverHost + "/checkPasswordToken",
          data: { username: username, token: token }
        }).then(res => {
          console.log("success", res);
          resolve();
        }).catch(err => {
          console.log("error", err);
          reject(err);
        });
      });
    }
  });
});
define('ember-share-db/services/session-account', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    session: Ember.inject.service('session'),
    store: Ember.inject.service(),
    currentUserName: "",
    bearerToken: "",
    currentDoc: "",
    ownedDocuments: null,
    updateOwnedDocuments() {
      return new Ember.RSVP.Promise((resolve, reject) => {
        let currentUser = this.get('currentUserName');
        if (!currentUser) {
          currentUser = "";
        }
        const filter = {
          filter: { search: currentUser, page: 0, currentUser: currentUser }
        };
        this.get('store').query('document', filter).then(results => {
          var myDocs = results.map(function (doc) {
            return { id: doc.get('id'), name: doc.get('name') };
          });
          this.set('ownedDocuments', myDocs);
          resolve();
        }).catch(err => {
          reject(err);
        });
      });
    },
    loadCurrentUser() {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const currentUserName = this.get('session.data.authenticated.user_id');
        this.set('bearerToken', this.get('session.data.authenticated.access_token'));
        if (!Ember.isEmpty(currentUserName)) {
          this.set('currentUserName', currentUserName);
          resolve();
        } else {
          console.log('currentUserName empty, rejecting');
          reject();
        }
      });
    }
  });
});
define('ember-share-db/services/session', ['exports', 'ember-simple-auth/services/session'], function (exports, _session) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _session.default;
});
define('ember-share-db/services/socket-io', ['exports', 'ember-websockets/services/socket-io'], function (exports, _socketIo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _socketIo.default;
    }
  });
});
define('ember-share-db/services/websockets', ['exports', 'ember-websockets/services/websockets'], function (exports, _websockets) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _websockets.default;
    }
  });
});
define('ember-share-db/session-stores/application', ['exports', 'ember-simple-auth/session-stores/adaptive'], function (exports, _adaptive) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _adaptive.default.extend();
});
define("ember-share-db/templates/about", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "M3zsTnUM", "block": "{\"symbols\":[],\"statements\":[[0,\"THIS IS MIMIC\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/about.hbs" } });
});
define("ember-share-db/templates/application", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "PsoY74MJ", "block": "{\"symbols\":[],\"statements\":[[1,[26,\"main-navigation\",null,[[\"onLogin\",\"onHome\",\"openDoc\"],[\"transitionToLoginRoute\",\"transitionToIndexRoute\",[26,\"action\",[[21,0,[]],\"transitionToDoc\"],null]]]],false],[0,\"\\n\"],[6,\"div\"],[10,\"style\",\"display:inline;\"],[8],[0,\"\\n  \"],[1,[20,\"outlet\"],false],[0,\"\\n  \"],[1,[20,\"modals-container\"],false],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/application.hbs" } });
});
define("ember-share-db/templates/code-editor", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "vDRZTwtN", "block": "{\"symbols\":[\"asset\"],\"statements\":[[6,\"div\"],[8],[0,\"\\n  \"],[6,\"div\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"showName\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"isNotEdittingDocName\"]]],null,{\"statements\":[[0,\"      \"],[6,\"h2\"],[8],[6,\"span\"],[10,\"class\",\"label label-default\"],[10,\"for\",\"doc-name\"],[3,\"action\",[[21,0,[]],\"doEditDocName\"]],[8],[1,[22,[\"model\",\"name\"]],false],[9],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[1,[26,\"input\",null,[[\"value\",\"type\",\"id\",\"name\",\"focusOut\"],[[22,[\"model\",\"name\"]],\"form-control\",\"doc-name-input\",\"doc-name-input\",[26,\"action\",[[21,0,[]],\"endEdittingDocName\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    by \"],[4,\"link-to\",[\"documents\",[22,[\"model\",\"owner\"]],0,\"views\"],[[\"id\"],[\"code-name-label\"]],{\"statements\":[[1,[22,[\"model\",\"owner\"]],false],[0,\" \"]],\"parameters\":[]},null],[0,\"\\n    \"],[6,\"h4\"],[8],[6,\"span\"],[8],[1,[20,\"feedbackMessage\"],false],[9],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"displayEditor\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"settings\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"active\",\"icon\",\"onClick\"],[[22,[\"notCollapsed\"]],\"glyphicon glyphicon-cog\",[26,\"action\",[[21,0,[]],\"toggleCollapsed\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Settings\"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-play\",[26,\"action\",[[21,0,[]],\"renderCode\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Render Code\"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-pause\",[26,\"action\",[[21,0,[]],\"pauseCode\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Pause Code\"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-fullscreen\",[26,\"action\",[[21,0,[]],\"enterFullscreen\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Enter Fullscreen\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"canEditDoc\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"autoRenderCheckbox\"],[8],[0,\"Auto Render?\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"type\",\"id\",\"checked\",\"click\"],[\"checkbox\",\"autoRenderCheckbox\",[22,[\"autoRender\"]],[26,\"action\",[[21,0,[]],\"toggleAutoRender\"],null]]]],false],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Render Code Whilst Typing\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"forkDocument\"],null]]],{\"statements\":[[0,\"Fork\"]],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Make Your Own Copy\"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"flagDocument\"],null]]],{\"statements\":[[0,\"Flag\"]],\"parameters\":[]},null],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Report as Inappropriate\"],[9],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[1,[26,\"download-button\",null,[[\"doc\"],[[22,[\"doc\"]]]]],false],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Download Project as Zip\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-collapse\",null,[[\"collapsed\"],[[22,[\"collapsed\"]]]],{\"statements\":[[0,\"      \"],[6,\"div\"],[10,\"class\",\"well\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"isOwner\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n          \"],[6,\"label\"],[10,\"for\",\"privacyCheckbox\"],[8],[0,\"Private?\"],[9],[0,\"\\n          \"],[1,[26,\"input\",null,[[\"type\",\"id\",\"checked\",\"click\"],[\"checkbox\",\"privacyCheckbox\",[22,[\"model\",\"isPrivate\"]],[26,\"action\",[[21,0,[]],\"togglePrivacy\"],null]]]],false],[0,\"\\n          \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Other users can discover\"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n          \"],[6,\"label\"],[10,\"for\",\"readOnlyCheckbox\"],[8],[0,\"Read Only?\"],[9],[0,\"\\n          \"],[1,[26,\"input\",null,[[\"type\",\"id\",\"checked\",\"click\"],[\"checkbox\",\"readOnlyCheckbox\",[22,[\"model\",\"readOnly\"]],[26,\"action\",[[21,0,[]],\"toggleReadOnly\"],null]]]],false],[0,\"\\n          \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"WARNING! Other users can edit your code\"],[9],[0,\"\\n        \"],[9],[0,\"\\n          \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n\"],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"primary\",[26,\"action\",[[21,0,[]],\"toggleShowAssets\"],null]]],{\"statements\":[[0,\"              Files\\n\"]],\"parameters\":[]},null],[0,\"            \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Add Files to Use\"],[9],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"primary\",[26,\"action\",[[21,0,[]],\"toggleShowShare\"],null]]],{\"statements\":[[0,\"          Share\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"primary\",[26,\"action\",[[21,0,[]],\"toggleShowCodeOptions\"],null]]],{\"statements\":[[0,\"          Code\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"primary\",[26,\"action\",[[21,0,[]],\"toggleShowTokens\"],null]]],{\"statements\":[[0,\"          Tags\\n\"]],\"parameters\":[]},null],[0,\"        \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n\"],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"primary\",[26,\"action\",[[21,0,[]],\"toggleShowOpPlayer\"],null]]],{\"statements\":[[0,\"            Playback\\n\"]],\"parameters\":[]},null],[0,\"          \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Step Through or Watch The Doc's History\"],[9],[0,\"\\n        \"],[9],[0,\"\\n\\n\"],[4,\"if\",[[22,[\"isOwner\"]]],null,{\"statements\":[[4,\"bs-button\",null,[[\"class\",\"type\",\"icon\",\"onClick\"],[\"btn-confirm\",\"danger\",\"glyphicon glyphicon-remove\",[26,\"action\",[[21,0,[]],\"toggleAllowDocDelete\"],null]]],{\"statements\":[[0,\"            Delete\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"        \"],[6,\"div\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"showOpPlayer\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[8],[0,\"\\n          \"],[6,\"h5\"],[8],[0,\"Playback your coding\"],[9],[0,\"\\n          \"],[1,[26,\"ops-player\",null,[[\"onSkip\",\"onPlay\",\"onRewind\",\"onPause\"],[[26,\"action\",[[21,0,[]],\"skipOp\"],null],[26,\"action\",[[21,0,[]],\"playOps\"],null],[26,\"action\",[[21,0,[]],\"rewindOps\"],null],[26,\"action\",[[21,0,[]],\"pauseOps\"],null]]]],false],[0,\"\\n        \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"showShare\"]]],null,{\"statements\":[[0,\"          \"],[6,\"label\"],[10,\"for\",\"edit-link\"],[8],[0,\"Editable Link\"],[9],[0,\"\\n          \"],[1,[26,\"input\",null,[[\"value\",\"type\",\"id\",\"name\"],[[22,[\"editLink\"]],\"form-control\",\"edit-link\",\"edit-link\"]]],false],[0,\"\\n          \"],[6,\"label\"],[10,\"for\",\"display-link\"],[8],[0,\"Just Display Link\"],[9],[0,\"\\n          \"],[1,[26,\"input\",null,[[\"value\",\"type\",\"id\",\"name\"],[[22,[\"displayLink\"]],\"form-control\",\"display-link\",\"display-link\"]]],false],[0,\"\\n          \"],[6,\"label\"],[10,\"for\",\"embed-link\"],[8],[0,\"Embed Link\"],[9],[0,\"\\n          \"],[1,[26,\"input\",null,[[\"value\",\"type\",\"id\",\"name\"],[[22,[\"embedLink\"]],\"form-control\",\"embed-link\",\"embed-link\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"showCodeOptions\"]]],null,{\"statements\":[[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-zoom-in\",[26,\"action\",[[21,0,[]],\"zoomIn\"],null]]],{\"statements\":[],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-zoom-out\",[26,\"action\",[[21,0,[]],\"zoomOut\"],null]]],{\"statements\":[],\"parameters\":[]},null]],\"parameters\":[]},null],[4,\"if\",[[22,[\"showTokens\"]]],null,{\"statements\":[[0,\"        \"],[6,\"div\"],[8],[0,\"\\n          \"],[1,[26,\"tokenfield-input\",null,[[\"tokens\",\"allowDuplicates\",\"placeholder\",\"editable\",\"tokensChanged\"],[[22,[\"model\",\"tags\"]],false,\"Enter Tags\",[22,[\"canEditDoc\"]],[26,\"action\",[[21,0,[]],\"tagsChanged\"],null]]]],false],[0,\"\\n          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"allowDocDelete\"]]],null,{\"statements\":[[0,\"          \"],[6,\"div\"],[8],[0,\"\\n            Are you sure?\\n\"],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"success\",[26,\"action\",[[21,0,[]],\"deleteDoc\"],null]]],{\"statements\":[[0,\"              Yes\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"danger\",[26,\"action\",[[21,0,[]],\"toggleAllowDocDelete\"],null]]],{\"statements\":[[0,\"              No\\n\"]],\"parameters\":[]},null],[0,\"          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"showAssets\"]]],null,{\"statements\":[[0,\"          \"],[6,\"div\"],[10,\"class\",\"file-upload-container\"],[8],[0,\"\\n            Files:\\n\"],[4,\"each\",[[22,[\"model\",\"assets\"]]],null,{\"statements\":[[0,\"              \"],[1,[21,1,[\"name\"]],false],[0,\"\\n\"],[4,\"bs-button\",null,[[\"class\",\"type\",\"icon\",\"onClick\"],[\"btn-confirm\",\"danger\",\"glyphicon glyphicon-remove\",[26,\"action\",[[21,0,[]],\"toggleAllowAssetDelete\",[21,1,[\"fileId\"]]],null]]],{\"statements\":[],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"class\",\"type\",\"icon\",\"onClick\"],[\"btn-confirm\",\"primary\",\"glyphicon glyphicon-eye-open\",[26,\"action\",[[21,0,[]],\"previewAsset\",[21,1,[]]],null]]],{\"statements\":[],\"parameters\":[]},null]],\"parameters\":[1]},null],[4,\"if\",[[22,[\"allowAssetDelete\"]]],null,{\"statements\":[[0,\"              \"],[6,\"div\"],[8],[0,\"\\n                Are you sure you want to delete this file?\\n\"],[4,\"bs-button\",null,[[\"class\",\"type\",\"icon\",\"onClick\"],[\"btn-confirm\",\"success\",\"glyphicon glyphicon-remove\",[26,\"action\",[[21,0,[]],\"deleteAsset\"],null]]],{\"statements\":[[0,\"                  Yes\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-confirm\",\"danger\",[26,\"action\",[[21,0,[]],\"toggleAllowAssetDelete\"],null]]],{\"statements\":[[0,\"                  No\\n\"]],\"parameters\":[]},null],[0,\"              \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"canEditDoc\"]]],null,{\"statements\":[[0,\"            \"],[6,\"div\"],[10,\"id\",\"asset-progress\"],[8],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"file-upload\"],[8],[0,\"\\n              \"],[1,[26,\"file-upload\",null,[[\"onProgress\",\"onCompletion\",\"onError\"],[[26,\"action\",[[21,0,[]],\"assetProgress\"],null],[26,\"action\",[[21,0,[]],\"assetUploaded\"],null],[26,\"action\",[[21,0,[]],\"assetError\"],null]]]],false],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"          \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"showPreview\"]]],null,{\"statements\":[],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"  \"],[6,\"div\"],[10,\"class\",\"main-container\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"output-container\"],[11,\"onmouseup\",[26,\"action\",[[21,0,[]],\"mouseUp\"],null],null],[11,\"onmousemove\",[26,\"action\",[[21,0,[]],\"mouseMove\"],null],null],[8],[0,\"\\n      \"],[6,\"iframe\"],[10,\"id\",\"output-iframe\"],[11,\"srcdoc\",[20,\"renderedSource\"],null],[8],[9],[0,\"\\n    \"],[9],[0,\"\\n      \"],[6,\"div\"],[10,\"class\",\"ace-container\"],[11,\"style\",[20,\"aceStyle\"],null],[11,\"onmouseup\",[26,\"action\",[[21,0,[]],\"mouseUp\"],null],null],[11,\"onmousemove\",[26,\"action\",[[21,0,[]],\"mouseMove\"],null],null],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"isShowingCode\"]]],null,{\"statements\":[[0,\"          \"],[4,\"bs-button\",null,[[\"class\",\"icon\",\"onClick\"],[\"hide-code-btn\",\"glyphicon glyphicon-menu-right\",[26,\"action\",[[21,0,[]],\"hideCode\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[4,\"bs-button\",null,[[\"class\",\"icon\",\"onClick\"],[\"hide-code-btn\",\"glyphicon glyphicon-menu-left\",[26,\"action\",[[21,0,[]],\"showCode\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[6,\"div\"],[10,\"class\",\"drag-button\"],[11,\"onmousedown\",[26,\"action\",[[21,0,[]],\"mouseDown\"],null],null],[11,\"onmouseup\",[26,\"action\",[[21,0,[]],\"mouseUp\"],null],null],[11,\"onmousemove\",[26,\"action\",[[21,0,[]],\"mouseMove\"],null],null],[8],[9],[0,\"\\n        \"],[1,[26,\"ember-ace\",null,[[\"lines\",\"value\",\"ready\",\"theme\"],[50,[22,[\"value\"]],[26,\"action\",[[21,0,[]],\"editorReady\"],null],\"ace/theme/monokai\"]]],false],[0,\"\\n      \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/code-editor.hbs" } });
});
define("ember-share-db/templates/components/base-token", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "0zusc8Ty", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"uncharted-token-label\"],[8],[1,[20,\"token\"],false],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"uncharted-token-actions\"],[8],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"fa fa-times uncharted-remove-action\"],[3,\"action\",[[21,0,[]],\"removeToken\"]],[8],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/base-token.hbs" } });
});
define("ember-share-db/templates/components/data-col", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "R7ZqiwK8", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"_property\",\"component\"]]],null,{\"statements\":[[0,\"  \"],[1,[26,\"component\",[[22,[\"_property\",\"component\"]]],[[\"value\",\"object\",\"propertyPath\",\"properties\"],[[22,[\"value\"]],[22,[\"item\"]],[22,[\"property\",\"key\"]],[22,[\"_property\",\"componentProperties\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[1,[20,\"value\"],false],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/data-col.hbs" } });
});
define("ember-share-db/templates/components/document-list-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "wyfem+Np", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"col-md-3 document-list-item\"],[8],[0,\"\\n  \"],[4,\"link-to\",[\"code-editor\",[22,[\"document\",\"documentId\"]]],[[\"class\"],[\"document-link\"]],{\"statements\":[[1,[22,[\"document\",\"name\"]],false],[0,\" \"]],\"parameters\":[]},null],[0,\"\\n  by \"],[4,\"link-to\",[\"documents\",[22,[\"document\",\"owner\"]],0,\"views\"],[[\"class\"],[\"document-link\"]],{\"statements\":[[1,[22,[\"document\",\"owner\"]],false],[0,\" \"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"document\",\"readOnly\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"glyphicon glyphicon-lock\"],[10,\"aria-hidden\",\"true\"],[8],[9],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Read Only\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"document\",\"isPrivate\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"glyphicon glyphicon-eye-close\"],[10,\"aria-hidden\",\"true\"],[8],[9],[0,\"\\n    \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Private\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"canEdit\"]]],null,{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"glyphicon glyphicon-play\"],[10,\"aria-hidden\",\"true\"],[8],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"type\",\"checked\",\"click\"],[\"checkbox\",[22,[\"doPlay\"]],[26,\"action\",[[21,0,[]],\"toggleDontPlay\"],null]]]],false],[0,\"\\n      \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Play on Open\"],[9],[0,\"\\n    \"],[9],[0,\"\\n\"],[4,\"bs-button\",null,[[\"class\",\"icon\",\"onClick\"],[\"main-delete-button\",\"glyphicon glyphicon-trash\",[26,\"action\",[[21,0,[]],\"delete\"],null]]],{\"statements\":[],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/document-list-item.hbs" } });
});
define("ember-share-db/templates/components/download-button", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "p1JhoIoE", "block": "{\"symbols\":[],\"statements\":[[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"download-button\",[26,\"action\",[[21,0,[]],\"download\"],null]]],{\"statements\":[[0,\"Download\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/download-button.hbs" } });
});
define('ember-share-db/templates/components/ember-popper-targeting-parent', ['exports', 'ember-popper/templates/components/ember-popper-targeting-parent'], function (exports, _emberPopperTargetingParent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopperTargetingParent.default;
    }
  });
});
define('ember-share-db/templates/components/ember-popper', ['exports', 'ember-popper/templates/components/ember-popper'], function (exports, _emberPopper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopper.default;
    }
  });
});
define("ember-share-db/templates/components/file-upload", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jved6Gxb", "block": "{\"symbols\":[\"&default\"],\"statements\":[[13,1]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/file-upload.hbs" } });
});
define("ember-share-db/templates/components/main-navigation", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "dh+t7VtN", "block": "{\"symbols\":[\"nav\",\"dd\",\"ddm\",\"doc\"],\"statements\":[[6,\"div\"],[10,\"id\",\"mimic-navbar\"],[8],[0,\"\\n\"],[4,\"bs-nav\",null,[[\"type\"],[\"pills\"]],{\"statements\":[[0,\" \"],[4,\"component\",[[21,1,[\"item\"]]],null,{\"statements\":[[4,\"component\",[[21,1,[\"link-to\"]],\"index\"],null,{\"statements\":[[0,\"Home\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n \"],[4,\"component\",[[21,1,[\"item\"]]],null,{\"statements\":[[4,\"component\",[[21,1,[\"link-to\"]],\"about\"],null,{\"statements\":[[0,\"About\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n \"],[4,\"component\",[[21,1,[\"item\"]]],null,{\"statements\":[[4,\"component\",[[21,1,[\"link-to\"]],\"terms\"],null,{\"statements\":[[0,\"Terms\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[22,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"    \"],[6,\"a\"],[10,\"class\",\"btn btn-danger navbar-btn navbar-right\"],[3,\"action\",[[21,0,[]],\"logout\"]],[8],[0,\"Logout\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"sessionAccount\",\"currentUserName\"]]],null,{\"statements\":[[0,\"     \"],[6,\"p\"],[10,\"class\",\"navbar-text pull-right\"],[8],[0,\"Signed in as \"],[4,\"component\",[[21,1,[\"link-to\"]],\"login\"],null,{\"statements\":[[1,[22,[\"sessionAccount\",\"currentUserName\"]],false]],\"parameters\":[]},null],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"dropdown\"]]],null,{\"statements\":[[0,\"     \"],[4,\"component\",[[21,2,[\"toggle\"]]],null,{\"statements\":[[0,\"My Documents \"],[6,\"span\"],[10,\"class\",\"caret\"],[8],[9]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[21,2,[\"menu\"]]],null,{\"statements\":[[4,\"each\",[[22,[\"ownedDocuments\"]]],null,{\"statements\":[[4,\"component\",[[21,3,[\"item\"]]],null,{\"statements\":[[0,\"           \"],[6,\"a\"],[10,\"class\",\"dropdown-item\"],[3,\"action\",[[21,0,[]],\"openDoc\",[21,4,[\"id\"]]]],[8],[1,[21,4,[\"name\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[4]},null]],\"parameters\":[3]},null]],\"parameters\":[2]},null]],\"parameters\":[]},{\"statements\":[[0,\"   \"],[6,\"a\"],[10,\"class\",\"btn btn-success navbar-btn navbar-right\"],[3,\"action\",[[21,0,[]],\"login\"]],[8],[0,\"Login\"],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[1]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/main-navigation.hbs" } });
});
define("ember-share-db/templates/components/modal-preview-body", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Gi1yQ9Ti", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"options\",\"isImage\"]]],null,{\"statements\":[[6,\"img\"],[10,\"class\",\"preview-image\"],[11,\"src\",[22,[\"options\",\"assetURL\"]],null],[8],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"options\",\"isAudio\"]]],null,{\"statements\":[[6,\"audio\"],[10,\"controls\",\"\"],[8],[0,\"\\n \"],[6,\"source\"],[11,\"src\",[22,[\"options\",\"assetURL\"]],null],[8],[9],[0,\"\\nYour browser does not support the audio element.\\n\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"options\",\"isVideo\"]]],null,{\"statements\":[[6,\"video\"],[10,\"class\",\"preview-video\"],[10,\"loop\",\"\"],[10,\"autoplay\",\"\"],[10,\"controls\",\"true\"],[11,\"type\",[22,[\"options\",\"assetType\"]],null],[8],[0,\"\\n  \"],[6,\"source\"],[11,\"src\",[22,[\"options\",\"assetURL\"]],null],[8],[9],[0,\"\\n  Your browser does not support the video tag.\\n\"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modal-preview-body.hbs" } });
});
define("ember-share-db/templates/components/modals-container/alert", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XDdVSm2R", "block": "{\"symbols\":[\"modal\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\",\"confirm\"],[[22,[\"options\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"footer\"]],false],[9],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"type\",\"onClick\"],[\"primary\",[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"confirm\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/alert.hbs" } });
});
define("ember-share-db/templates/components/modals-container/base", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "wMIS1Cbk", "block": "{\"symbols\":[\"&default\"],\"statements\":[[13,1]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/base.hbs" } });
});
define("ember-share-db/templates/components/modals-container/check-confirm", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "eA6rr9Ob", "block": "{\"symbols\":[\"modal\",\"form\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\",\"updatePromptValue\"],[[22,[\"options\"]],[26,\"action\",[[21,0,[]],\"updatePromptValue\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"],[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[21,0,[]],[26,\"action\",[[21,0,[]],\"confirm\"],null]]],{\"statements\":[[0,\"        \"],[1,[26,\"component\",[[21,2,[\"element\"]]],[[\"controlType\",\"property\",\"label\"],[\"checkbox\",\"promptValue\",[22,[\"options\",\"inputLabel\"]]]]],false],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\",\"confirmDisabled\",\"confirm\",\"decline\"],[[22,[\"options\"]],[22,[\"confirmDisabled\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null],[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"footer\"]],false],[9],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"decline\"]],false]],\"parameters\":[]},null],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"type\",\"disabled\",\"onClick\"],[\"primary\",[22,[\"confirmDisabled\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"confirm\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/check-confirm.hbs" } });
});
define("ember-share-db/templates/components/modals-container/confirm", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "GrtpmEtK", "block": "{\"symbols\":[\"modal\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\",\"confirm\",\"decline\"],[[22,[\"options\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null],[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"footer\"]],false],[9],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"decline\"]],false]],\"parameters\":[]},null],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"type\",\"onClick\"],[\"primary\",[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"confirm\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/confirm.hbs" } });
});
define("ember-share-db/templates/components/modals-container/process", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "8UZdVnn2", "block": "{\"symbols\":[\"modal\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"keyboard\",\"backdropClose\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],false,false,[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],[[\"closeButton\"],[false]],{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"options\",\"iconClass\"]]],null,{\"statements\":[[0,\"        \"],[6,\"p\"],[10,\"class\",\"text-center\"],[8],[6,\"i\"],[11,\"class\",[22,[\"options\",\"iconClass\"]],null],[8],[9],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/process.hbs" } });
});
define("ember-share-db/templates/components/modals-container/progress", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2vFSonqJ", "block": "{\"symbols\":[\"modal\",\"p\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"keyboard\",\"backdropClose\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],false,false,[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],[[\"closeButton\"],[false]],{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\",\"progress\",\"done\",\"overall\"],[[22,[\"options\"]],[22,[\"progress\"]],[22,[\"done\"]],[22,[\"promisesCount\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"],[4,\"bs-progress\",null,null,{\"statements\":[[0,\"        \"],[1,[26,\"component\",[[21,2,[\"bar\"]]],[[\"value\",\"showLabel\",\"striped\",\"animate\",\"type\"],[[22,[\"progress\"]],[22,[\"options\",\"showLabel\"]],[22,[\"options\",\"striped\"]],[22,[\"options\",\"animate\"]],[22,[\"options\",\"type\"]]]]],false],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[22,[\"options\",\"cancelable\"]]],null,{\"statements\":[[0,\"        \"],[4,\"bs-button\",null,[[\"onClick\",\"disabled\"],[[26,\"action\",[[21,0,[]],\"cancel\"],null],[22,[\"canceled\"]]]],{\"statements\":[[1,[22,[\"options\",\"cancel\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/progress.hbs" } });
});
define("ember-share-db/templates/components/modals-container/prompt-confirm", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/q5Gvyce", "block": "{\"symbols\":[\"modal\",\"form\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\",\"updatePromptValue\"],[[22,[\"options\"]],[26,\"action\",[[21,0,[]],\"updatePromptValue\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"],[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[21,0,[]],[26,\"action\",[[21,0,[]],\"confirm\"],null]]],{\"statements\":[[0,\"        \"],[1,[26,\"component\",[[21,2,[\"element\"]]],[[\"property\",\"label\"],[\"promptValue\",[22,[\"options\",\"inputLabel\"]]]]],false],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\",\"confirmDisabled\",\"confirm\",\"decline\"],[[22,[\"options\"]],[22,[\"confirmDisabled\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null],[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"footer\"]],false],[9],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"decline\"]],false]],\"parameters\":[]},null],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"type\",\"disabled\",\"onClick\"],[\"primary\",[22,[\"confirmDisabled\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"confirm\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/prompt-confirm.hbs" } });
});
define("ember-share-db/templates/components/modals-container/prompt", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "EFUAEhq2", "block": "{\"symbols\":[\"modal\",\"form\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHide\"],[[22,[\"modalIsOpened\"]],[26,\"action\",[[21,0,[]],\"confirm\"],null],[26,\"action\",[[21,0,[]],\"decline\"],null]]],{\"statements\":[[4,\"component\",[[21,1,[\"header\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"titleComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"titleComponent\"]]],[[\"options\"],[[22,[\"options\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[4,\"bs-modal/header/title\",null,null,{\"statements\":[[1,[22,[\"options\",\"title\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"bodyComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"bodyComponent\"]]],[[\"options\",\"updatePromptValue\"],[[22,[\"options\"]],[26,\"action\",[[21,0,[]],\"updatePromptValue\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"body\"]],false],[9],[0,\"\\n\"],[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[21,0,[]],[26,\"action\",[[21,0,[]],\"confirm\"],null]]],{\"statements\":[[0,\"        \"],[1,[26,\"component\",[[21,2,[\"element\"]]],[[\"property\",\"label\"],[\"promptValue\",[22,[\"options\",\"inputLabel\"]]]]],false],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[21,1,[\"footer\"]]],null,{\"statements\":[[4,\"if\",[[22,[\"options\",\"footerComponent\"]]],null,{\"statements\":[[0,\"      \"],[1,[26,\"component\",[[22,[\"options\",\"footerComponent\"]]],[[\"options\",\"confirmDisabled\",\"confirm\",\"decline\"],[[22,[\"options\"]],[22,[\"confirmDisabled\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null],[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[6,\"p\"],[8],[1,[22,[\"options\",\"footer\"]],false],[9],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],[21,1,[\"close\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"decline\"]],false]],\"parameters\":[]},null],[0,\"\\n      \"],[4,\"bs-button\",null,[[\"type\",\"disabled\",\"onClick\"],[\"primary\",[22,[\"confirmDisabled\"]],[26,\"action\",[[21,0,[]],[21,1,[\"submit\"]]],null]]],{\"statements\":[[1,[22,[\"options\",\"confirm\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/modals-container/prompt.hbs" } });
});
define("ember-share-db/templates/components/ops-player", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ARSr22+R", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"prev\"],null]]],{\"statements\":[[0,\"Prev\"]],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Step Back\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"next\"],null]]],{\"statements\":[[0,\"Next\"]],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Step Forwards\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-play\",[26,\"action\",[[21,0,[]],\"play\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Play to End\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-pause\",[26,\"action\",[[21,0,[]],\"pause\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Pause playback\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"tooltip\"],[8],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"icon\",\"onClick\"],[\"glyphicon glyphicon-fast-backward\",[26,\"action\",[[21,0,[]],\"rewind\"],null]]],{\"statements\":[],\"parameters\":[]},null],[0,\"\\n  \"],[6,\"span\"],[10,\"class\",\"tooltiptext\"],[8],[0,\"Rewind to Beginning\"],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/ops-player.hbs" } });
});
define("ember-share-db/templates/components/tokenfield-input", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "VsgDXwTi", "block": "{\"symbols\":[\"token\",\"index\"],\"statements\":[[6,\"div\"],[10,\"class\",\"uncharted-form-control\"],[8],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"uncharted-token-container\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"tokens\"]]],null,{\"statements\":[[0,\"            \"],[1,[26,\"component\",[[22,[\"tokenComponent\"]]],[[\"token\",\"index\",\"existingTokens\",\"allowDuplicates\",\"selectedTokenIndex\",\"createToken\",\"removeToken\",\"mouseDown\",\"doubleClick\"],[[21,1,[]],[21,2,[]],[22,[\"tokens\"]],[22,[\"allowDuplicates\"]],[22,[\"selectedTokenIndex\"]],[26,\"action\",[[21,0,[]],\"createToken\"],null],[26,\"action\",[[21,0,[]],\"removeToken\",[21,1,[]]],null],[26,\"action\",[[21,0,[]],\"selectToken\",[21,1,[]],[21,2,[]]],null],[26,\"action\",[[21,0,[]],\"editToken\",[21,1,[]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[1,2]},null],[4,\"if\",[[22,[\"editable\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"input\",null,[[\"type\",\"class\",\"id\",\"placeholder\",\"value\"],[\"text\",\"uncharted-token-input\",[22,[\"tokenfieldId\"]],[22,[\"placeholder\"]],[22,[\"inputValue\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"showDuplicateMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[10,\"class\",\"uncharted-duplicate-message\"],[8],[0,\"\\n        \"],[6,\"span\"],[10,\"class\",\"fa fa-exclamation-circle\"],[8],[9],[0,\"\\n        Duplicate values are not allowed\\n    \"],[9],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/components/tokenfield-input.hbs" } });
});
define("ember-share-db/templates/documents", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xjq1D4JF", "block": "{\"symbols\":[\"document\",\"index\",\"tag\"],\"statements\":[[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n\"],[4,\"if\",[[22,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"  \"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"createNewDocument\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n    \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"value\"],[\"docName\",\"Doc Name\",[22,[\"docName\"]]]]],false],[0,\"\\n    \"],[6,\"label\"],[10,\"for\",\"isPrivate\"],[8],[0,\"Private?\"],[9],[0,\"\\n    \"],[1,[26,\"input\",null,[[\"type\",\"id\",\"checked\",\"click\"],[\"checkbox\",\"isPrivate\",true,[26,\"action\",[[21,0,[]],\"checkboxClicked\"],null]]]],false],[0,\"\\n    \"],[6,\"button\"],[10,\"type\",\"submit\"],[8],[0,\"Create New Document\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"feedbackMessage\"]]],null,{\"statements\":[[0,\"  \"],[6,\"label\"],[8],[1,[20,\"feedbackMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n\"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"search\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n  \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"value\",\"key-press\"],[\"searchTerm\",\"Search...\",[22,[\"searchTerm\"]],\"search\"]]],false],[0,\"\\n  \"],[6,\"button\"],[10,\"type\",\"submit\"],[8],[0,\"Search\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"hasNoDocuments\"]]],null,{\"statements\":[[0,\"    \"],[6,\"h2\"],[10,\"style\",\"text-align:center;\"],[8],[0,\"No Results\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"center\"],[8],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"recent\"],null]]],{\"statements\":[[0,\" Newest \"]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"popular\"],null]]],{\"statements\":[[0,\" Popular \"]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"updated\"],null]]],{\"statements\":[[0,\" Updated \"]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"forked\"],null]]],{\"statements\":[[0,\" Most Remixed \"]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"editted\"],null]]],{\"statements\":[[0,\" Most Worked-on \"]],\"parameters\":[]},null],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"center\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"tags\"]]],null,{\"statements\":[[0,\"    \"],[4,\"bs-button\",null,[[\"onClick\"],[[26,\"action\",[[21,0,[]],\"tag\",[21,3,[\"_id\"]]],null]]],{\"statements\":[[0,\" \"],[1,[21,3,[\"_id\"]],false],[0,\" \"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[3]},null],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"container-fluid\"],[8],[0,\"\\n  \"],[6,\"div\"],[10,\"class\",\"row\"],[8],[0,\"\\n\"],[4,\"each\",[[22,[\"model\"]]],null,{\"statements\":[[0,\"        \"],[1,[26,\"document-list-item\",null,[[\"document\",\"index\",\"onOpen\",\"onDelete\"],[[21,1,[]],[21,2,[]],[26,\"action\",[[21,0,[]],\"openDocument\",[21,1,[\"documentId\"]]],null],[26,\"action\",[[21,0,[]],\"deleteDocument\",[21,1,[\"documentId\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"  \"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"canGoBack\"]]],null,{\"statements\":[[0,\"    \"],[6,\"button\"],[3,\"action\",[[21,0,[]],\"prevPage\"]],[8],[0,\"Prev Page\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[22,[\"canGoForwards\"]]],null,{\"statements\":[[0,\"    \"],[6,\"button\"],[3,\"action\",[[21,0,[]],\"nextPage\"]],[8],[0,\"Next Page\"],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/documents.hbs" } });
});
define("ember-share-db/templates/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "8ACj0Q6T", "block": "{\"symbols\":[],\"statements\":[[1,[20,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/index.hbs" } });
});
define("ember-share-db/templates/login", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hlkwUt2v", "block": "{\"symbols\":[],\"statements\":[[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n\"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"authenticate\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n  \"],[6,\"ui\"],[10,\"class\",\"list-group\"],[8],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"identification\"],[8],[0,\"Username\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"value\"],[\"identification\",\"Enter Login\",[22,[\"identification\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"password\"],[8],[0,\"Password\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"type\",\"value\"],[\"password\",\"Enter Password\",\"password\",[22,[\"password\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n  \"],[6,\"p\"],[8],[6,\"button\"],[10,\"type\",\"submit\"],[8],[0,\"Login\"],[9],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"loginErrorMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[8],[1,[20,\"loginErrorMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n\"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"createNewUser\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n  \"],[6,\"ui\"],[10,\"class\",\"list-group\"],[8],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"newUsername\"],[8],[0,\"Username\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"value\"],[\"newUsername\",\"Username\",[22,[\"newUsername\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"newUserEmail\"],[8],[0,\"Email (optional)\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"value\"],[\"newUserEmail\",\"Email\",[22,[\"newUserEmail\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"newUserPassword\"],[8],[0,\"Password\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"type\",\"value\"],[\"newUserPassword\",\"Enter Password\",\"password\",[22,[\"newUserPassword\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"newUserPasswordAgain\"],[8],[0,\"Password (again)\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"type\",\"value\"],[\"newUserPasswordAgain\",\"Enter Password (again)\",\"password\",[22,[\"newUserPasswordAgain\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n    \"],[6,\"p\"],[8],[6,\"button\"],[10,\"type\",\"submit\"],[8],[0,\"Create New User\"],[9],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"registerMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[8],[1,[20,\"registerMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"],[9],[0,\"\\n\"],[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n\"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"resetPassword\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n  \"],[6,\"ui\"],[10,\"class\",\"list-group\"],[8],[0,\"\\n    \"],[6,\"li\"],[10,\"class\",\"list-group-item\"],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"resetUsername\"],[8],[0,\"Username\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"value\"],[\"resetUsername\",\"Username\",[22,[\"resetUsername\"]]]]],false],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n  \"],[6,\"p\"],[8],[6,\"button\"],[10,\"type\",\"submit\"],[8],[0,\"Reset Password\"],[9],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"resetMessage\"]]],null,{\"statements\":[[0,\"    \"],[6,\"p\"],[8],[1,[20,\"resetMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[9],[0,\"\\n\"],[9],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/login.hbs" } });
});
define("ember-share-db/templates/password-reset", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "S2ZnQcxE", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[22,[\"hasValidToken\"]]],null,{\"statements\":[[0,\"  \"],[6,\"div\"],[8],[0,\"\\n    \"],[6,\"h1\"],[8],[0,\"RESET YOUR PASSWORD\"],[9],[0,\"\\n    \"],[6,\"div\"],[10,\"class\",\"container\"],[8],[0,\"\\n    \"],[6,\"form\"],[3,\"action\",[[21,0,[]],\"resetPassword\"],[[\"on\"],[\"submit\"]]],[8],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"password\"],[8],[0,\"Password\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"type\",\"value\"],[\"password\",\"Enter Password\",\"password\",[22,[\"password\"]]]]],false],[0,\"\\n      \"],[6,\"label\"],[10,\"for\",\"passwordAgain\"],[8],[0,\"Password (again)\"],[9],[0,\"\\n      \"],[1,[26,\"input\",null,[[\"id\",\"placeholder\",\"type\",\"value\"],[\"passwordAgain\",\"Enter Password (again)\",\"password\",[22,[\"passwordAgain\"]]]]],false],[0,\"\\n      \"],[6,\"button\"],[10,\"type\",\"submit\"],[8],[0,\"Reset Password\"],[9],[0,\"\\n\"],[4,\"if\",[[22,[\"resetMessage\"]]],null,{\"statements\":[[0,\"        \"],[6,\"p\"],[8],[1,[20,\"resetMessage\"],false],[9],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[9],[0,\"\\n    \"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[6,\"div\"],[8],[0,\"\\n    \"],[6,\"h1\"],[8],[0,\"NICE TRY\"],[9],[0,\"\\n  \"],[9],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/password-reset.hbs" } });
});
define("ember-share-db/templates/terms", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "JMtoaaZI", "block": "{\"symbols\":[],\"statements\":[[0,\"WE TAKE NO RESPONSIBILITY FOR ANYTHING\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "ember-share-db/templates/terms.hbs" } });
});
define('ember-share-db/utils/api-data-manager', ['exports', 'ember-railio-grid/utils/api-data-manager'], function (exports, _apiDataManager) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _apiDataManager.default;
    }
  });
});
define('ember-share-db/utils/array-data-manager', ['exports', 'ember-railio-grid/utils/array-data-manager'], function (exports, _arrayDataManager) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _arrayDataManager.default;
    }
  });
});
define('ember-share-db/utils/data-manager', ['exports', 'ember-railio-grid/utils/data-manager'], function (exports, _dataManager) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataManager.default;
    }
  });
});
define('ember-share-db/utils/filterer', ['exports', 'ember-railio-grid/utils/filterer'], function (exports, _filterer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filterer.default;
    }
  });
});
define('ember-share-db/utils/filtering-handler', ['exports', 'ember-railio-grid/utils/filtering-handler'], function (exports, _filteringHandler) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filteringHandler.default;
    }
  });
});
define('ember-share-db/utils/paginating-handler', ['exports', 'ember-railio-grid/utils/paginating-handler'], function (exports, _paginatingHandler) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _paginatingHandler.default;
    }
  });
});
define('ember-share-db/utils/paginator', ['exports', 'ember-railio-grid/utils/paginator'], function (exports, _paginator) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _paginator.default;
    }
  });
});
define('ember-share-db/utils/sorter', ['exports', 'ember-railio-grid/utils/sorter'], function (exports, _sorter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sorter.default;
    }
  });
});
define('ember-share-db/utils/sorting-handler', ['exports', 'ember-railio-grid/utils/sorting-handler'], function (exports, _sortingHandler) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sortingHandler.default;
    }
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

if (!runningTests) {
  require("ember-share-db/app")["default"].create({"name":"ember-share-db","version":"0.0.0+e82c6c6b"});
}
//# sourceMappingURL=ember-share-db.map
