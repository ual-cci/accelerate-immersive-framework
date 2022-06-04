import Controller from '@ember/controller';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default Controller.extend({
  url:config.localOrigin + '/images/',
  beginnerProjectUrl:config.localOrigin + '/code/a7f6b1a0-74a4-236e-f3c1-24962f45213d',
  advancedProjectUrl:config.localOrigin + '/code/5d9933c7-5c98-217b-b640-64bd9438799f',
  advancedurl:config.localOrigin + '/getting-started/advanced',
  guideurl:config.localOrigin + '/guides/root',
  isAdvanced:computed('model', function() {
    return this.get('model') == 'advanced'
  }),
});
