import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  filter: null,
  updateAnimationState() {
    if(!isEmpty(this.get('animationInterval')))
    {
      clearInterval(this.get('animationInterval'))
    }
    if(this.get('filter').isSelected && !this.get('filter').id.includes('tag'))
    {
      this.set('animationInterval', setInterval(()=> {
        var sh = this.get('shapes')
        var newSh = Array(sh.length)
        for(var i = 0; i < sh.length; i++)
        {
          var s = sh[i];
          var newS = {x:s.x, y:s.y, r:s.r, dy:s.dy, dx:s.dx};
          var x = parseInt(s.x.substring(0, s.x.length-1))
          x = x + s.dx;
          var y = parseInt(s.y.substring(0, s.y.length-1))
          y = y + s.dy;
          if(x > 100 || x< 0)  {
            newS.dx = -newS.dx;
          }
          if(y > 100 || y < 0) {
            newS.dy = -newS.dy;
          }
          newS.x = x+"\%"
          newS.y = y+"\%"
          newSh[i] = newS;
        }
        this.set('shapes',newSh)
      }, 70));
    }
  },
  initShapes() {
    if(isEmpty(this.get('shapes')) && !this.get('filter').id.includes('tag'))
    {
      const sh = Array(10).fill(1).map((i)=>{
      return {
        r:"5",
        x:(Math.random()*100) + "\%",
        y:(Math.random()*100) + "\%",
        dx: Math.random() < 0.5 ? 1 : -1,
        dy: Math.random() < 0.5 ? 1 : -1}
      });
      this.set('shapes', sh);
      this.updateAnimationState();
    }
  },
  didUpdateAttrs() {
    this._super(...arguments);
    this.initShapes();
    this.updateAnimationState();
  },
  didReceiveAttrs() {
    this._super(...arguments);
    this.initShapes();
  },
  actions: {
    onFilter() {
      console.log("FILTER", this.get('filter').id)
      this.get('onFilter')(this.get('filter'));
    },
  }
});
