import MediaQueriesService from 'ember-cli-media-queries/services/media-queries';

export default MediaQueriesService.extend({
  media: {
    xs:'(max-width: 575px)',
    sm:'(min-width: 576px) and (max-width: 767px)',
    md:'(min-width: 768px) and (max-width: 991px)',
    lg:'(min-width: 992px) and (max-width: 1999px)',
    xl:'(min-width: 1200px)',
    mobile: '(max-width: 767px)',
    desktop: '(min-width: 768px)'
  },
});
