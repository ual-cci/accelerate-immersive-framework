import Ember from 'ember';
import layout from '../templates/components/base-token';

export default Ember.Component.extend({
    //Component properties
    layout, // For more info: https://discuss.emberjs.com/t/layout-property-for-declaring-html-in-component/12844/2
    classNames: ['uncharted-token'],
    classNameBindings: ['isSelected:uncharted-selected-token'],

    // Properties
    token: null,
    index: null,
    selectedTokenIndex: null,

    // State
    isSelected: Ember.computed('index', 'selectedTokenIndex', function() {
        return this.get('index') === this.get('selectedTokenIndex');
    }),

    // Actions
    actions: {
        removeToken() {
            this.removeToken();
        }
    }
});
