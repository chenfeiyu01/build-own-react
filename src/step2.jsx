/** @jsx preact.createElement */

import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

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
        return typeof item === 'object'
          ? children
          : createTextElement(children);
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

const preact = {
  createElement,
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
console.log('rootElement is ', rootElement);
/* const root = createRoot(rootElement);

// root.render(element);
const trueElement = document.createElement(element.type);
trueElement["title"] = element.props.title;
const text = document.createTextNode("");

text["nodeValue"] = element.props.chidren;
trueElement.appendChild(text);

rootElement.appendChild(trueElement); */

// rootElement.appendChild(element);
const root = createRoot(rootElement);
root.render(<App />);
