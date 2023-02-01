/** @jsx preact.createElement */

import React from 'react';
import { createRoot } from 'react-dom/client';
// const element = <h1 title="foo">Hello</h1>;
// const element = React.createElement('h1', {
//   title: 'foo'
// }, 'hello');

// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     chidren: "hello"
//   }
// };

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((item) => {
        return typeof item === 'object' ? item : createTextElement(item);
      }),
    },
  };
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function render(element, container) {
  const tag = element.type;
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(tag);
  Object.keys(element.props)
    .filter((item) => item !== 'children')
    .forEach((item) => {
      dom[item] = element.props[item];
    });

  element.props.children.map((item) => {
    render(item, dom);
  });

  container.appendChild(dom);
}

function workLoop(deadLine) {
  let nextUnitOfWork = null;
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadLine.timeRemaining() > 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork) {
  // TODO: 
}

const preact = {
  createElement,
  render,
};

// const element = preact.createElement(
//   "div",
//   {
//     id: "foo"
//   },
//   preact.createElement("a", null, "bar"),
//   preact.createElement("b")
// );
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

console.log('elementis ', element);
const rootElement = document.getElementById('root');
preact.render(element, rootElement);
