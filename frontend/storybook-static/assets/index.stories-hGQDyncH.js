import{j as a}from"./iframe-CW2YhqHW.js";import{R as o,o as n}from"./index-BX4A-tzm.js";import"./preload-helper-PPVm8Dsz.js";import"./swapi-xj6YmQMa.js";import"./index-xWzQQM10.js";import"./index-CtXQr83s.js";import"./Text-C3Oa1qhK.js";const d={title:"Modal/RelatedItems",component:o,tags:["autodocs"],parameters:{docs:{description:{component:"Relationship shortcut used at the bottom of detail modals. The stories show the three meaningful states: decorative empty, direct navigation for one item, and menu-driven navigation for many items."}}},args:{label:"Films",count:0,icon:a.jsx(n,{size:28,weight:"duotone"}),items:[]}},e={},t={args:{label:"Homeworld",count:1,items:[{url:"https://swapi.info/api/planets/1",name:"Tatooine"}]}},s={args:{count:3,items:[{url:"https://swapi.info/api/films/1",name:"A New Hope"},{url:"https://swapi.info/api/films/2",name:"The Empire Strikes Back"},{url:"https://swapi.info/api/films/3",name:"Return of the Jedi"}]}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Homeworld',
    count: 1,
    items: [{
      url: 'https://swapi.info/api/planets/1',
      name: 'Tatooine'
    }]
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    count: 3,
    items: [{
      url: 'https://swapi.info/api/films/1',
      name: 'A New Hope'
    }, {
      url: 'https://swapi.info/api/films/2',
      name: 'The Empire Strikes Back'
    }, {
      url: 'https://swapi.info/api/films/3',
      name: 'Return of the Jedi'
    }]
  }
}`,...s.parameters?.docs?.source}}};const f=["Empty","SingleLink","MenuOfLinks"];export{e as Empty,s as MenuOfLinks,t as SingleLink,f as __namedExportsOrder,d as default};
