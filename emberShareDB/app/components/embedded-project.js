import Component from '@ember/component';
import config from  '../config/environment';
import { computed } from '@ember/object';

export default Component.extend({
  docId:"",
  url:config.localOrigin,
  height:"490px",
  loaded:false,
  manualLoad:false,
  srcURL:"about:none",
  buttonTop:computed('height', function() {
    let height = this.get('height');
    height = height.substring(0, height.length - 2);
    height = parseInt(height)
    return height / 2 + "px";
  }),
  didInsertElement() {
    this._super(...arguments);
    if(!this.get('manualLoad')) {
      this.observe()
    }
  },
  observe:function() {
    var options = {
      root:document.querySelector('#scrollArea'),
    }

    var observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {

        if(!this.get('loaded') &&  entry.intersectionRatio > 0) {
          let src = this.get("url") + "/code/" + this.get("docId") +  "?embed=true&showCode=true";
          console.log("onscreen", src);
          this.set("srcURL", src)
          this.set("loaded", true);
        }
      });
    }, options);

    observer.observe(document.getElementById(this.elementId));
 },
 actions:{
   loadProject() {
     this.set("manualLoad", false);
     let src = this.get("url") + "/code/" + this.get("docId") +  "?embed=true&showCode=true";
     this.set("srcURL", src)
     this.set("loaded", true);
   }
 }
 });
