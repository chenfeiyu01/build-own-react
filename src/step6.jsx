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
    .filter((item) => item !== 'children')
    .forEach((item) => {
      dom[item] = fiber.props[item];
    });

  return dom;
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletion = [];

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

  /**
   * 我们需要追踪根节点的工作进度
   */
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // root的alternate其实就是null
  };
  nextUnitOfWork = wipRoot;
  deletion = [];
}

/**
 * 提交完整的fiber树来渲染真实dom
 */
function commitRoot() {
  deletion.forEach(commitWork);
  commitWork(wipRoot.child);
  wipRoot = null;
  currentRoot = wipRoot;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  const parentDom = fiber.parent.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'DELETION' && fiber.dom) {
    parentDom.removeChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function updateDom(dom, prevProps, nextprops) {
  // 事件的处理会特殊一些
  const isEvent = (key) => key.startsWith('on');

  // 排除掉children和事件
  const isProperty = (key) => key !== 'children' && !isEvent(key);
  const isNew = (prev, next) => (key) => prev[key] !== next[key];
  const isGone = (prev, next) => (key) => !(key in next);

  /** start {处理事件，移除原本的事件监听，重新绑定} */
  // 移除原有事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isNew(prevProps, nextprops)(key) || !(key in nextprops))
    .forEach((name) => {
      const eventType = name.substring(2).toLowerCase();
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 重新绑定事件
  Object.keys(nextprops)
    .filter(isEvent)
    .filter(isNew(prevProps, nextprops))
    .forEach((name) => {
      const eventType = name.substring(2).toLowerCase();
      dom.addEventListener(eventType, nextprops);
    });
  /** end */

  /** start {处理属性，先做删除后做增改} */
  // 删除已经不存在的属性
  Object.keys(nextprops)
    .filter(isProperty)
    .filter(isGone(prevProps, nextprops))
    .forEach((name) => {
      dom[name] = '';
    });

  // 设置新增的或改变的属性
  Object.keys(nextprops)
    .filter(isProperty)
    .filter(isNew(prevProps, nextprops))
    .filter((name) => {
      dom[name] = nextprops[name];
    });
  /** end */
}

function workLoop(deadLine) {
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadLine.timeRemaining() > 1;
  }
  /**
   * 因为在performUnitOfWork中删除了真实dom的渲染
   * 需要在没有nextUnitOfWork（所有工作完成）后，执行commitRoot
   */
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

/**
 *
 * @param {*} wipFiber
 * @param {*} elements
 * 为该fiber节点的所有子元素生成fiber节点，并将每一个fiber节点的三个指针（child, sibling and parent）指向正确的fiber结构。
 */
function reconcileChildren(wipFiber, elements) {
  // 定义一个对象用于保存上一个fiber节点，这样在遍历到下一个fiber节点的时候就可以把这个fiber节点作为上一个fiber节点的sibling节点
  /* let prevSibling = null;
  let oldFiber = wipFiber.alternate?.child;

  for (let i = 0; i < elements.length; i++) {
    if (oldFiber) {
      const element = elements[i];
      const newFiber = {
        type: element.type,
        parent: fiber,
        dom: null,
        props: element.props,
      };

      if (oldFiber) {
      }
      if (i === 0) {
        fiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      // 在此把新生成的fiber定义给上一个fiber，用于在后续遍历过程中挂载sibling。
      prevSibling = newFiber;
    }
  } */
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate?.child;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    /* const newFiber = {
      type: element.type,
      props: element.props,
      parent: wipFiber,
      dom: null,
    }; */
    let newFiber = null;
    /** start {cpmpare oldFiber to element} */
    // 通过老fiber节点和新的element节点的type 判断dom是否可以复用
    const sameType = oldFiber && element && oldFiber.type === element.type;
    if (sameType) {
      // 复用dom修改属性 重置事件
      newFiber = {
        dom: oldFiber.dom,
        type: oldFiber.type,

        props: element.props,
        parent: wipFiber,

        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      // 新增
      newFiber = {
        type: element.type,
        props: element.props,

        dom: null,
        alternate: null,

        parent: wipFiber,

        effectTag: 'PLACEMENT',
      };
    }
    if (oldFiber && !sameType) {
      // 删除老fiber节点
      oldFiber.effectTag = 'DELETION';
      deletion.push(oldFiber);
    }

    /** end */
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

function performUnitOfWork(fiber) {
  /**
   * 1、生成真实dom，并且加入已有dom结构中
   */
  if (!fiber.dom) {
    fiber.dom = createDom(fiber); // 首次工作切片的fiber结构和后续生成的newFiber的结构略有不同，但首次工作切片的fiber一定有dom结构不会走进这段逻辑，所以不影响。
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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
      <p >p123123123</p>
      <a href='javascript:;' >123123123</a>
    </h1>
    <h2 >h2 title</h2>
  </div>,
  rootElement
);
