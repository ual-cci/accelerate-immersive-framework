import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Controller.extend({
  store:inject(),
  session:inject('session'),
  cs:inject('console'),
  mediaQueries:inject(),
  resizeService:inject('resize'),
  documentService: inject('documents'),
  docName:"",
  isPrivate:true,
  isPrivateText:computed('isPrivate', function() {
    return this.get('isPrivate') ? "private":"public";
  }),
  searchTerm:computed('model', function() {
    return this.get('model').query.filter.search;
  }),
  feedbackMessage: "",
  sort:"views",
  page:0,
  sessionAccount: inject('session-account'),
  canGoBack:computed('page', function() {
    return this.get('page') > 0;
  }),
  canGoForwards:computed('model', function() {
    return this.get('model').length >= 20;
  }),
  hasNoDocuments:computed('model', function() {
    return this.get('model').length == 0;
  }),
  isMore:true,
  loadMoreCtr:0,
  sortingFilters:[
    {title:"NEWEST", id:"date", isSelected:false, highlightTitle:false},
    {title:"POPULAR", id:"views", isSelected:false, highlightTitle:false},
    {title:"MOST REMIXED", id:"forks", isSelected:false, highlightTitle:false},
    {title:"MOST EDITED", id:"edits", isSelected:false, highlightTitle:false},
    // {title:"UPDATED", id:"updated", isSelected:false, highlightTitle:false},
  ],
  allFilters:[],
  showingFilters:computed('model', function() {
    this.get('documentService').getPopularTags(11)
    .then((results) => {
      var all = this.get('sortingFilters');
      let tags = results.data.map((t, i)=> {
        return {
          title:"#"+t._id, id:"tag-item", isSelected:false, highlightTitle:false
        }
      });
      all = all.concat(tags);
      this.set('allFilters', all)
      this.updateFiltersToShow()
    });
    return [];
  }),
  init: function () {
    this._super();
    this.get('resizeService').on('didResize', event => {
      this.updateFiltersToShow();
    })
  },
  updateSelectedFilter() {
    var newF = []
    this.get('showingFilters').forEach((f)=> {
      Ember.set(f, "isSelected", f.id == this.get('sort'));
      Ember.set(f, "highlightTitle", f.id == this.get('sort') || f.title == this.get('searchTerm'));
      newF.push(f)
    })
    Ember.run(()=> {
      this.set('showingFilters', newF);
    });
  },
  updateFiltersToShow() {
     var toShow = 5;
     if(this.get('mediaQueries.isXs'))
     {
       toShow = 2
     }
     else if (this.get('mediaQueries.isSm'))
     {
       toShow = 3
     }
     else if(this.get('mediaQueries.isMd'))
     {
       toShow = 4
     }
     toShow += this.get('loadMoreCtr')
     if(toShow >= this.get('allFilters').length)
     {
       this.set('isMore', false)
       toShow = this.get('allFilters').length
     }
     else
     {
       this.set('isMore', true)
     }
     this.set('showingFilters', this.get('allFilters').slice(0, toShow-1))
     this.updateSelectedFilter();
  },
  updateResults()
  {
    $("#document-container").addClass("fading-out")
    setTimeout(()=> {
      this.get('sessionAccount').getUserFromName();
      let searchTerm = this.get('searchTerm');
      if(isEmpty(searchTerm))
      {
        searchTerm = " ";
      }
      this.get('cs').log('transitionToRoute', 'documents', searchTerm, this.get('page'), this.get('sort'));
      this.updateSelectedFilter();
      this.transitionToRoute('documents', searchTerm, this.get('page'), this.get('sort'));
    }, 400)
  },
  recent() {
    //this.set('searchTerm', " ");
    this.set('page', 0);
    this.set('sort', "date");
    this.updateResults();
  },
  popular() {
    //this.set('searchTerm', " ");
    this.set('page', 0);
    this.set('sort', "views");
    this.updateResults();
  },
  forked() {
    //this.set('searchTerm', " ");
    this.set('page', 0);
    this.set('sort', "forks");
    this.updateResults();
  },
  editted() {
    //this.set('searchTerm', " ");
    this.set('page', 0);
    this.set('sort', "edits");
    this.updateResults();
  },
  updated() {
    //this.set('searchTerm', " ");
    this.set('page', 0);
    this.set('sort', "updated");
    this.updateResults();
  },
  tag(tag) {
    this.set('searchTerm', tag.substr(1));
    this.set('page', 0);
    this.updateResults();
  },
  actions: {
    updateSelectedFilter(sort) {
      this.set('sort', sort)
      this.updateSelectedFilter();
    },
    openDocument(documentId) {
      this.transitionToRoute("code-editor", documentId);
    },
    deleteDocument(documentId) {
      if (confirm('Are you sure you want to delete?')) {
        this.get('documentService').deleteDoc(documentId)
        .then(() => {
          this.get('cs').log("deleted, updating results");
          this.set('searchTerm', this.get('sessionAccount').currentUserName);
          this.updateResults();
        }).catch((err) => {
          this.get('cs').log("error deleting", err);
          this.set('feedbackMessage',err.errors[0]);
        });
      }
    },
    isPrivateChanged() {
      this.toggleProperty('isPrivate');
    },
    createNewDocument() {
      let docName = this.get('docName');
      const isPrivate = this.get('isPrivate');
      this.get('cs').log("new doc", docName);
      if(docName.length > 1)
      {
        const src = this.get('documentService').getDefaultSource();
        const data = {name:docName, isPrivate:isPrivate, source:src}
        this.get('documentService').makeNewDoc(data)
          .then(() => {
            this.get('cs').log("new doc created");
            const currentUserId = this.get('sessionAccount').currentUserId;
            this.get('store').query('document', {
              filter: {search: docName,
                page: 0,
                currentUser: currentUserId,
                sortBy: 'date'}
            }).then((documents) => {
              this.get('cs').log("new doc found, transitioning", documents);
              this.get('sessionAccount').updateOwnedDocuments();
              this.transitionToRoute('code-editor', documents.firstObject.documentId);
            });
          }).catch((err) => {
            this.get('cs').log("error making doc", err);
            this.set('feedbackMessage', err);
          });
      }
      else
      {
        this.set('feedbackMessage', 'Please enter a name');
      }
    },
    search() {
      this.set('page', 0);
      if(!isEmpty(this.get('searchTimeout')))
      {
        clearTimeout(this.get('searchTimeout'))
      }
      this.set('searchTimeout', setTimeout(()=> {
        this.updateResults();
        this.set('searchTimeout', nil);
      }, 500))
    },
    nextPage() {
      this.incrementProperty('page');
      this.updateResults();
    },
    prevPage() {
      this.decrementProperty('page');
      this.updateResults();
    },
    filter(f) {
      if(f.id == "forks")
      {
        this.forked()
      }
      else if(f.id == "date")
      {
        this.recent()
      }
      else if(f.id == "views")
      {
        this.popular()
      }
      else if(f.id == "edits")
      {
        this.editted()
      }
      else if(f.id == "updated")
      {
        this.updated()
      }
      else
      {
        this.tag(f.title)
      }
    },
    loadMore(numMore) {
      this.set('loadMoreCtr', this.get('loadMoreCtr')+ numMore)
      this.updateFiltersToShow();
    },
    loadLess() {
      this.set('loadMoreCtr', 0)
      this.updateFiltersToShow();
    },
    flashResults()
    {
      this.get('cs').log("flashing results")
      $("#document-container").addClass("fading-in")
      $("#document-container").removeClass("fading-out")
      if(!isEmpty(this.get('fadeTimeout')))
      {
        clearTimeout(this.get('fadeTimeout'))
      }
      this.set('fadeTimeout', setTimeout(()=> {
        $("#document-container").removeClass("fading-out")
        $("#document-container").removeClass("fading-in")
        this.set('fadeTimeout', null);
      }, 500));
    }
  }
});
