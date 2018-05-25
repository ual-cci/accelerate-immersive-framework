import Component from '@ember/component';
import { inject as service } from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import ShareDBAce from 'npm:sharedb-ace';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    const ace = this.$(".ace_editor").get(0);
    const options = {
      namespace:"MIMIC",
      WsUrl:'ws://localhost:8080'
    }
    //const shareDB = ShareDBAce("doc-2",options);
    // ShareDBAce.on('ready', function() {
    //   ShareDBAce.add(editor, [], [ Plugins, Here ]);
    // });
  },
  actions: {
    valueUpdated()  {
      console.log("editor updated");
    },

  }
});
