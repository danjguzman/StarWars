import{L as r}from"./index-ClCBAsG-.js";import"./iframe-D9hsRjIN.js";import"./preload-helper-PPVm8Dsz.js";import"./CircleNotch.esm-D3C5Ek7Q.js";import"./index-DI9ASCjh.js";import"./index-CZWWVQiQ.js";const{action:o}=__STORYBOOK_MODULE_ACTIONS__,t=[{url:"https://swapi.info/api/people/1",name:"Luke Skywalker"},{url:"https://swapi.info/api/people/2",name:"C-3PO"},{url:"https://swapi.info/api/people/3",name:"R2-D2"},{url:"https://swapi.info/api/people/4",name:"Darth Vader"}],d={title:"Collections/ListTemplate",component:r,tags:["autodocs"],globals:{viewport:{value:"responsive",isRotated:!1}},parameters:{docs:{description:{component:"Grid list used for browse pages. The documented states cover the most meaningful collection behaviors: active infinite loading, completed browse results, and missing display labels."}}},args:{items:t,entityKey:"people",hasMore:!1,loadingMore:!1,showCompletionIndicator:!1,onLoadMore:o("load-more"),onItemClick:o("item-click")}},e={args:{hasMore:!0,loadingMore:!0}},a={args:{hasMore:!1,loadingMore:!1}},s={args:{items:[{url:"https://swapi.info/api/people/5",name:"Leia Organa"},{url:"https://swapi.info/api/people/6",name:""},{url:"https://swapi.info/api/people/7",name:"Beru Whitesun lars"}]}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    hasMore: true,
    loadingMore: true
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    hasMore: false,
    loadingMore: false
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const u=["LoadingMore","Complete","WithMissingNames"];export{a as Complete,e as LoadingMore,s as WithMissingNames,u as __namedExportsOrder,d as default};
