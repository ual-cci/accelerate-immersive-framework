import Component from '@ember/component';
import { computed } from '@ember/object';
import config from  '../config/environment';

export default Component.extend({
  showUserInput:false,
  url:config.localOrigin,
  didRender() {
    this._super(...arguments);
    if(!this.get('showUserInput'))
    {
      this.updateSelectedNode();
    }
  },
  isRecording:computed('options', {
    get() {
      return this.get('options.isRecording')
    },
    set(key, value) {
      return this._isRecording = value;
    }
  }),
  selectedNode:computed('options', {
    get() {
      return this.get('options.node')
    },
    set(key, value) {
      return this._selectedNode = value;
    }
  }),
  updateOptions:function() {
    this.onOptionsChanged({
      isRecording:this.get("isRecording"),
      node:this.get("selectedNode")
    })
  },
  updateSelectedNode:function() {
    if(this.get('isRecording'))
    {
      let i = this.get('options.node.index');
      if(i === undefined)
      {
        i = 0
      }
      document.getElementById("rec-select").selectedIndex = i;
      this.set('showUserInput', i === this.get('possibleNodes').length + 1)
      if(this.get('showUserInput'))
      {
        this.set('userNode', this.get('selectedNode.variable'))
      }
    }
  },
  userNodeSelected:function() {
    const node = {
      library:"user",
      index:this.get('possibleNodes').length + 1,
      variable:this.get('userNode')
    }
    this.set('selectedNode', node);
    this.updateOptions();
  },
  actions:{
    toggleRecording() {
      this.toggleProperty('isRecording')
      this.updateOptions()
    },
    onSelectNode(index) {
      if(index === "user")
      {
        this.userNodeSelected()
      }
      else
      {
        const i = parseInt(index);
        const node = this.get('possibleNodes')[i]
        node.index = i + 1
        this.set('selectedNode', node)
        this.updateOptions();
      }
      this.set('showUserInput', this.get('selectedNode').index === this.get('possibleNodes').length + 1)
    },
    endEdittingUserNode() {
      this.userNodeSelected();
    },
  }
});
