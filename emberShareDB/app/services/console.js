import Service from '@ember/service';

export default Service.extend({
  output:"--MIMIC--",
  observers:[],
  clearObservers() {
    this.set('observers', []);
  },
  clear() {
    this.set('output', "--MIMIC--");
  },
  append(msg) {
    this.set('output', this.get('output') + "\n" + msg);
    const observers = this.get('observers');
    for(let i = 0; i < observers.length; i++)
    {
      observers[i].update();
    }
  },
  log() {
    const msgs = arguments;
    for(let i = 0; i < msgs.length; i++)
    {
      console.log(msgs[i]);
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

});
