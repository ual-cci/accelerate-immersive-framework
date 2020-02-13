import { computed } from '@ember/object';
import Component from '@ember/component';
import layout from '../templates/components/base-token';

export default Component.extend({
    //Component properties
    layout, // For more info: https://discuss.emberjs.com/t/layout-property-for-declaring-html-in-component/12844/2
    classNames: ['uncharted-token'],
    classNameBindings: ['isSelected:uncharted-selected-token'],
    didUpdateAttrs() {
      this._super(...arguments);
    },
    // Properties
    token: null,
    index: null,
    selectedTokenIndex: null,
    canDelete:true,
    // State
    isSelected: computed('index', 'selectedTokenIndex', function() {
        return this.get('index') === this.get('selectedTokenIndex');
    }),

    // Actions
    actions: {
        removeToken() {
          this.removeToken();
        },
        selectToken() {
          this.mouseDown();
        },
        onDelete() {
          this.removeToken();
        }
    }
});
