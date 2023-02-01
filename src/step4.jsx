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

/**
 *
 * @param {*} fiber
 * @returns node
 * 接收一个fiber结构，返回完整的dom节点
 */
function createDom(fiber) {
  const tag = fiber.type;
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(tag);

  Object.keys(fiber.props)
    .filters((item) => item !== 'children')
    .forEach((item) => {
      dom[item] = fiber.props[item];
    });

  return dom;
}

let nextUnitOfWork = null;

// 此处接收的element是以jsx 或直接生成的 createElement函数 return的拥有节点属性的对象
function render(element, container) {
  /**
   * 1、我需要设置第一个nextUnitOfWork为fiber树的root节点。
   * unitOfWork 其实就是为了切分原本的dom树添加到真实dom节点中的过程
   * 所以unitofWork 应该只做一件事：把单个fiber节点添加到对应的dom当中
   * 所以unitOfWork需要有的属性 真实dom节点(container)
   * props中 会有指针指向 first child sibling parent
   * children属性 用于判断本次unitOfWork应该将哪些内容添加到dom节点中
   * 在第一次nextUnitOfWork中，被添加的dom节点是我们要渲染的根节点，要添加的内容只有一个节点，即fiber树的根节点（本例子中为div），因为children可能为多个，所以要以数组形式存在，只是第一次工作切片的children一定是单个节点（根节点）
   */
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

function workLoop(deadLine) {
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadLine.timeRemaining() > 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  /**
   * 1、生成真实dom，并且加入已有dom结构中
   */
  if (!fiber.dom) {
    fiber.dom = createDom(fiber); // 首次工作切片的fiber结构和后续生成的newFiber的结构略有不同，但首次工作切片的fiber一定有dom结构不会走进这段逻辑，所以不影响。
  }
  /**
   * 做真实dom节点的挂载
   */
  if (fiber.parent) {
    fiber.parent.dom.appendChild = fiber.dom;
  }

  /**
   * 2、为该fiber节点的所有子元素生成fiber节点，并将每一个fiber节点的三个指针（child, sibling and parent）指向正确的fiber结构。
   */
  const elements = fiber.props.children;
  // 定义一个对象用于保存上一个fiber节点，这样在遍历到下一个fiber节点的时候就可以把这个fiber节点作为上一个fiber节点的sibling节点
  let prevSibling = null;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const newFiber = {
      type: element.type,
      parent: fiber,
      dom: null,
      props: element.props,
    };
    if (i === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    // 在此把新生成的fiber定义给上一个fiber，用于在后续遍历过程中挂载sibling。
    prevSibling = newFiber;
  }

  /**
   * 3、返回下一个unitOfWork
   * 找到下一次应该去实际挂在的fiber节点
   */
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
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
preact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  rootElement
);
