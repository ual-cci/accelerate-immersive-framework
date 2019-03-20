import Component from '@ember/component';
import { inject } from '@ember/service';
export default Component.extend({
  mediaQueries:inject(),
  colours:[
    "#ED3D05F2","#FFCE00F2","#0ED779F2","#F79994F2","#4D42EBF2"
  ],
  didRender() {
    this._super(...arguments);
    let colour1 = Math.floor(Math.random() * 5);
    let colour2 = Math.floor(Math.random() * 5);
    while(colour2 == colour1) {
      colour2 = Math.floor(Math.random() * 5);
    }
    document.getElementById('about-overlay-title').style['background-color'] = this.get('colours')[colour1];
    document.getElementById('about-overlay-desc').style['background-color'] = this.get('colours')[colour2];
    console.log("REFRESH", colour1, colour2)
  }
});
