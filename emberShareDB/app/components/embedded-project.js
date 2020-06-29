import Component from '@ember/component';
import config from  '../config/environment';

export default Component.extend({
  docId:"",
  url:config.localOrigin,
  height:"440px",
  loaded:false,
  srcURL:"about:none",
  didInsertElement() {
    this._super(...arguments);
    console.log('element id: ' + this.elementId);
    this.observe()
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
 }
 });
