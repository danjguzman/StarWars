import{L as t}from"./index-fvkOXnmG.js";import"./iframe-BY3f0CZh.js";import"./preload-helper-PPVm8Dsz.js";import"./CircleNotch.esm-DI_9GBZF.js";import"./index-CPnmPE0q.js";import"./index-BkQN4ZLX.js";const{action:r}=__STORYBOOK_MODULE_ACTIONS__,p=[{url:"https://swapi.info/api/people/1",name:"Luke Skywalker"},{url:"https://swapi.info/api/people/2",name:"C-3PO"},{url:"https://swapi.info/api/people/3",name:"R2-D2"},{url:"https://swapi.info/api/people/4",name:"Darth Vader"}],d={title:"Collections/ListTemplate",component:t,tags:["autodocs"],parameters:{docs:{description:{component:"Grid list used for browse pages. The documented states cover the most meaningful collection behaviors: populated results, active infinite loading, and the completed browse state."}}},args:{items:p,entityKey:"people",hasMore:!1,loadingMore:!1,onLoadMore:r("load-more"),onItemClick:r("item-click")}},e={},a={args:{hasMore:!0,loadingMore:!0}},s={args:{hasMore:!1,loadingMore:!1}},o={args:{items:[{url:"https://swapi.info/api/people/5",name:"Leia Organa"},{url:"https://swapi.info/api/people/6",name:""},{url:"https://swapi.info/api/people/7",name:"Beru Whitesun lars"}]}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    hasMore: true,
    loadingMore: true
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    hasMore: false,
    loadingMore: false
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    items: [{
      url: 'https://swapi.info/api/people/5',
      name: 'Leia Organa'
    }, {
      url: 'https://swapi.info/api/people/6',
      name: ''
    }, {
      url: 'https://swapi.info/api/people/7',
      name: 'Beru Whitesun lars'
    }]
  }
}`,...o.parameters?.docs?.source}}};const g=["Populated","LoadingMore","Complete","WithMissingNames"];export{s as Complete,a as LoadingMore,e as Populated,o as WithMissingNames,g as __namedExportsOrder,d as default};
