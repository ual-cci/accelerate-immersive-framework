import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  filter: null,
  killAnimation() {
    if(!isEmpty(this.get('animationInterval')))
    {
      clearInterval(this.get('animationInterval'))
    }
  },
  updateAnimationState() {
    this.killAnimation();
    if(this.get('filter').isSelected && !this.get('filter').id.includes('tag'))
    {
      this.set('animationInterval', setInterval(()=> {
        var sh = this.get('shapes')
        var newSh = Array(sh.length)
        for(var i = 0; i < sh.length; i++)
        {
          var s = sh[i];
          var newS = {x:s.x, y:s.y, r:s.r, dy:s.dy, dx:s.dx, isCircle:s.isCircle,isRect:s.isRect};
          //var x = parseFloat(s.x.substring(0, s.x.length-1))
          var x = s.x
          x = x + s.dx;
          //var y = parseFloat(s.y.substring(0, s.y.length-1))
          var y = s.y
          y = y + s.dy;
          if(x >= 100-s.r || x<= 0)  {
            newS.dx = -newS.dx;
          }
          if(y >= 60 || y <= 0) {
            newS.dy = -newS.dy;
          }
          newS.x = x
          newS.y = y
          newS.yr = y - s.r
          newS.xr = x + s.r
          newS.x2r = x + s.r / 2
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
        isCircle:this.get('filter').id == "sortByRecent" || this.get('filter').id == "sortByEditted",
        isRect:this.get('filter').id == "sortByPopular" || this.get('filter').id == "sortByUpdated",
        r:20,
        x:(Math.random()*80),
        y:(Math.random()*40),
        dx: Math.random() < 0.5 ? Math.random() : -1 * Math.random(),
        dy: Math.random() < 0.5 ? Math.random() : -1 * Math.random()}
      });
      sh.forEach((i)=>{
        i.yr = i.y - i.r
        i.xr = i.x + i.r
        i.x2r = i.x + i.r / 2
      })
      console.log(sh)
      this.set('shapes', sh);
      this.updateAnimationState();
    }
  },
  willDestroyElement(){
    this._super(...arguments);
    this.killAnimation();
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
