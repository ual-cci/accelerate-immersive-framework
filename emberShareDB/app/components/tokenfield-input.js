import Ember from 'ember';
import layout from '../templates/components/tokenfield-input';
import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { isNone, isEmpty } from '@ember/utils';
import { schedule } from '@ember/runloop';
import { A } from '@ember/array';
import { notEmpty } from '@ember/object/computed';

export const KEYCODE = {
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

export default Component.extend({
    // Component properties
    layout,
    classNames: ['uncharted-tokenfield-input'],
    classNameBindings: ['isFocused:uncharted-focus', 'disabled'],
    attributeBindings: ['tabindex'],
    tabindex: 0,

    // Properties
    tokens: null,
    placeholder: null,
    addTokenOnBlur: true,
    allowDuplicates: false,
    editable:true,
    tokenComponent: 'base-token',

    tokenfieldId: computed('elementId', function () {
        return `${this.elementId}-tokenfield`;
    }),

    // State
    inputValue: null,
    isFocused: null,
    hasTokens: notEmpty('tokens'),
    selectedTokenIndex: null,
    showDuplicateMessage: false,

    // Lifecycle
    init() {
        this._super(...arguments);
        if (isNone(this.get('tokens'))) {
            this.set('tokens', Ember.A());
        }
    },

    didInsertElement() {
        this._super(...arguments);

        const textInput = this.$(`#${this.get('tokenfieldId')}`);
        this._textInputElement = textInput;

        textInput
            .on('keydown', this._keydownHandler.bind(this))
            .on('focus', this._focusHandler.bind(this))
            .on('blur', this._inputWasBlurred.bind(this));

        this.$()
            .on('keydown', this._tokenNavigationHandler.bind(this))
            .on('focus', this._focusHandler.bind(this))
            .on('blur', this._componentWasBlurred.bind(this));
    },

    willDestroyElement() {
        this._super(...arguments);

        this._textInputElement
            .off('keydown', this._keydownHandler.bind(this))
            .off('focus', this._focusHandler.bind(this))
            .off('blur', this._inputWasBlurred.bind(this));

        this.$()
            .off('keydown', this._tokenNavigationHandler.bind(this))
            .off('focus', this._focusHandler.bind(this))
            .off('blur', this._componentWasBlurred.bind(this));
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

    _onDisabledChanged: observer('disabled', function () {
        if (this.get('disabled')) {
            this._blurComponent();
        }
    }),

    _onInputValueChanged: observer('inputValue', function () {
        const value = this.get('inputValue');
        if (value.indexOf(',') > -1) {
            const values = value.split(',');
            values
                .forEach(this._addToken.bind(this));
            this.set('inputValue', '');
        }
    }),

    // Event handlers
    _keydownHandler(e) {
        const wasEnterKey = e.which === KEYCODE.ENTER;
        const wasTabKey = e.which === KEYCODE.TAB;
        const hasValue = !isEmpty(this.get('inputValue'));
        const shouldCreateToken = wasEnterKey || (wasTabKey && hasValue);

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
        if (!this.get('isFocused') || this.get('disabled')) {
            return;
        }
        // Highlight text hit backspace wtf?!?!
        const cursorIndex = e.target.selectionStart;
        const cursorIsAtStart = cursorIndex === 0;
        const hasSelectedToken = !isNone(this.get('selectedTokenIndex'));
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
                } else if (isEmpty(this.get('inputValue')) && cursorIsAtStart) {
                    this._setSelectedTokenIndex(this.get('tokens.length') - 1);
                    e.preventDefault();
                }
                break;
            case KEYCODE.ENTER:
                if (hasSelectedToken) {
                    const tokenValue = this.get('tokens').objectAt(this.get('selectedTokenIndex'));
                    this._editToken(tokenValue);
                } else if (!isEmpty(this.get('inputValue'))) {
                    this._createToken(this.get('inputValue'));
                }
                break;
            case KEYCODE.LEFT_ARROW:
                if (hasSelectedToken) {
                    const prevTokenIndex = this.get('selectedTokenIndex') - 1;
                    if (prevTokenIndex > -1) {
                        this._setSelectedTokenIndex(prevTokenIndex);
                    }
                } else if (isEmpty(this.get('inputValue'))) {
                    this._setSelectedTokenIndex(this.get('tokens.length') - 1);
                }
                break;
            case KEYCODE.RIGHT_ARROW: {
                const selectedTokenIndex = this.get('selectedTokenIndex');
                if (isNone(selectedTokenIndex)) {
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
                } else if (!isEmpty(this.get('inputValue'))) {
                    this._createToken(this.get('inputValue'));
                }
                break;
        }
    },

    _focusHandler(e) {
        if (this.get('disabled')) {
            return;
        }
        this.set('isFocused', true);
        if (e.target === this.element) {
            // Div focus event
            if (isNone(this.get('selectedTokenIndex'))) {
                this._focusTextInput();
            }
        } else {
            // Input focus event
            this.set('selectedTokenIndex', null);
        }
    },

    _componentWasBlurred() {
        this.set('isFocused', false);
        this.set('selectedTokenIndex', null);
    },

    _inputWasBlurred() {
        if (isNone(this.get('selectedTokenIndex'))) {
            this._blurComponent();
        }
    },

    // Internal methods
    _focusComponent() {
        this.$().focus();
    },

    _focusTextInput() {
        this._textInputElement.focus();
    },

    _blurComponent() {
        if (this.get('addTokenOnBlur') && !isEmpty(this.get('inputValue'))) {
            this._addToken(this.get('inputValue'));
        }
        this.set('isFocused', false);
        this.set('selectedTokenIndex', null);
    },

    _setSelectedTokenIndex(index) {
        this.set('selectedTokenIndex', index);
        this._textInputElement.blur();
        if (!isNone(index)) {
            this._focusComponent();
        }
    },

    _removeToken(value) {
        this.get('tokens').removeObject(value);
        this.set('selectedTokenIndex', null);
        this.get('tokensChanged')(this.get('tokens'));
    },

    _addToken(value) {
        if (!isNone(value)) {
            value = value.trim();
            const isDuplicate = this.get('tokens')
                .map(token => token.toLowerCase())
                .includes(value.toLowerCase());
            const allowDuplicates = this.get('allowDuplicates');
            const hasValue = !isEmpty(value);
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
        this._removeToken(value);
        if (!isNone(this.get('inputValue'))) {
            this._addToken(this.get('inputValue'));
        }
        this.set('inputValue', value);
        schedule('afterRender', this, function () {
            this._textInputElement.focus();
            this._textInputElement.select();
        });
    }
});
