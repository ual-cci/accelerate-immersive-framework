import Service from '@ember/service';
import config from  '../config/environment';
import { computed, set } from '@ember/object';

export default Service.extend({
  output:'--MIMIC--',
  init() {
    this._super(...arguments);
    this.set('observers', []);
    console.log('DEBUG INIT',config.debugConsole);
    this.setDebugMode(config.debugConsole);
  },
  clearObservers() {
    this.set('observers', []);
  },
  clear() {
    this.set('output', '--MIMIC--');
  },
  append(msg) {
    this.set('output', this.get('output') + '\n' + msg);
    const observers = this.get('observers');
    for(let i = 0; i < observers.length; i++)
    {
      observers[i].update();
    }
  },
  logToScreen() {
    const msgs = arguments;
    for(let i = 0; i < msgs.length; i++)
    {
      console.log(msgs[i]);
      this.append(msgs[i]);
    }
  },
  log(){

  },
  setDebugMode(debugEnabled) {
    if(debugEnabled && (typeof console != 'undefined')) {
      this.set('log',console.log.bind(console));
    }
    else {
      this.set('log',function(message) {});
    }
  }

});
