import Controller from '@ember/controller';
import config from  '../config/environment';

export default Controller.extend({
  supervisedLearningURL:config.localOrigin + '/images/supervisedlearning.png',
  mimicSupervisedLearningURL:config.localOrigin + '/images/supervisedlearninglearnermimic.png',
  demoOneURL:config.localOrigin + '',
  demoTwoURL:config.localOrigin + '',
});
