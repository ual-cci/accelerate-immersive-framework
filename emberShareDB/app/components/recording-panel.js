import Component from '@ember/component';

export default Component.extend({
  showUserInput:false,
  updateOptions:function() {
    this.onOptionsChanged({
      isRecording:this.get("isRecording"),
      node:this.get("selectedNode")
    })
  },
  actions:{
    toggleRecording() {
      this.toggleProperty('isRecording')
      this.updateOptions()
    },
    onSelectNode(index) {
      const node = this.get('possibleNodes')[parseInt(index)]
      console.log(index, node)
      this.set('selectedNode', node)
      this.set('showUserInput', index === "none")
      console.log(this.get('selectedNode'))
      this.updateOptions()
    },
    endEdittingUserNode() {
      const newName = this.get('userNode');
      console.log(newName)
      this.set('selectedNode', {library:"user", variable:newName})
      this.updateOptions()
    },
  }
});
