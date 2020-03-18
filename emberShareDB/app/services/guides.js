import Service from '@ember/service';
import config from  '../config/environment';

export default Service.extend({
  guides:[
      {title:"Interactive Machine Learning",guides:[
        {id:"learner",name:"Building Mappings by Example with Learner.js", desc:"Learner.js provides an interface that allows you to easily record in examples of input and output pairings. You can then train a model to respond with new outputs when you provide new inputs. We take care of all the storage, threading and GUI needs and all you have to do is pick what you want to control!", author:"Louis McCallum"},
        {id:"kadenze",name:"Machine Learning for Musicians and Artists alongside Kadenze", desc:"Translating Wekinator based exercises to the MIMIC platform from Rebecca Fiebrink's excellent Kadenze course",author:"Louis McCallum"},
        {id:"RAPIDMIX",name:"Using RapidLib.js for Machine Learning", desc:" This page provides a minimal guide on how to use the RapidLib, showing how to use simple machine learning objects in five steps with two simple examples of applied Machine Learning tasks.",author:"Franciso Bernardo"},
      ]},
      {title:"Making Music",guides:[
        {id:"maxi-instrument",name:"AudioWorklet Backed Synths and Samplers with MaxiInstuments.js", desc:"MaxiInstruments is a class of simple synths and samplers that are designed to so that their parameters can be easily controlled using the Learner.js library. They are AudioWorklets backed so do not get interrupted by beefy feature extractors one might use an an input or the running of a model to do the mapping. ", author:"Louis McCallum"},
        {id:"maximJS",name:"Making Music in the Browser with maxmilian.js", desc:"Maximilian.js is a javascript library for sound analysis and synthesis. This document is a reference to the maxmilian.js API, illustrated with examples.", author:"Chris Kiefer"},
        {id:"evolib",name:"Evolutionary Sound Synthesis with Evolib.js", desc:"How about using a machine intelligence technique to help us to program a modular synthesizer? In this guide, we'll show you how", author:"Matthew Yee-King"},
      ]},
      {title:"Musical Analysis",guides:[
        {id:"mmll",name:"Musical Machine Listening with MMLL.js", desc:"Machine listening is the attempt to make computers hear sound intelligently. The interest of the MIMIC project is in musical machine listening, that is, the computer understanding of musical audio signals, and the Musical Machine Listening Library introduced here (subsequently MMLL) is a javascript library to do just that, in the web browser. ",author:"Nick Collins"},
      ]},
  ]
});
