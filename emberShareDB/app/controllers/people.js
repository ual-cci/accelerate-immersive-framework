import Controller from '@ember/controller';
import { computed, set } from '@ember/object';
import config from  '../config/environment';
export default Controller.extend({
  people:computed(()=>{return [
    {name:"Mick Grierson", role:"Primary Investigator", imgURL:"https://www.arts.ac.uk/__data/assets/image/0024/168135/1340.png", personalURL:"https://www.arts.ac.uk/research/ual-staff-researchers/mick-grierson"},
    {name:"Thor Magnusson", role:"Co Investigator", imgURL:"https://profiles.sussex.ac.uk/p164902-thor-magnusson/photo", personalURL:"https://twitter.com/thormagnusson"},
    {name:"Nick Collins", role:"Co Investigator", imgURL:"https://www.dur.ac.uk/images/music/NEW-WEB/staff/Nick-Collins.jpg", personalURL:"https://composerprogrammer.com/"},
    {name:"Matthew Yee-King", role:"Co Investigator", imgURL:"https://www.gold.ac.uk/media/images-by-section/departments/computing/research/people/matthew.jpg", personalURL:"http://www.yeeking.net/"},
    {name:"Rebecca Fiebrink", role:"Co Investigator", imgURL:"https://www.arts.ac.uk/__data/assets/image/0029/198281/Rebecca.jpg", personalURL:"https://www.arts.ac.uk/creative-computing-institute/people/rebecca-fiebrink"},
    {name:"Chris Kiefer", role:"Co Investigator", imgURL:"https://profiles.sussex.ac.uk/p208667-chris-kiefer/photo", personalURL:"https://profiles.sussex.ac.uk/p208667-chris-kiefer"},
    {name:"Louis McCallum", role:"Post Doc", imgURL:"https://www.gold.ac.uk/media/images-by-section/departments/computing/LouisMcCallum_380.png", personalURL:"http://louismccallum.com"},
    {name:"Shelly Knotts", role:"Post Doc", imgURL:"https://shellyknotts.files.wordpress.com/2019/06/054.jpg?w=1200", personalURL:"https://shellyknotts.wordpress.com/"},
    {name:"Francisco Bernardo", role:"Post Doc", imgURL:config.localOrigin + "/images/francisco.png", personalURL:"https://frantic0.com/"},
    {name:"Gabriel Vigliensoni", role:"Post Doc", imgURL:"https://i1.sndcdn.com/avatars-000137340251-uhrx0j-t500x500.jpg", personalURL:"https://www.vigliensoni.com/"},
    {name:"Vit Ruzicka", role:"Post Doc", imgURL:"https://people.phys.ethz.ch/~ruzickav/img/vr.jpg", personalURL:"https://people.phys.ethz.ch/~ruzickav/"},
  ]}),
  actions:{
    onClick(person) {
      this.transitionToRoute('code-editor', example.docid)
    }
  }
});
