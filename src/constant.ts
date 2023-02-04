type IProps = {
  [t: string]: string;
};

type TEffectTag = 'UPDATE' | 'PLACEMENT' | 'DELETION';

type IPropsHasChildren = {
  children: Array<IElement>;
  [t: string]: any;
};

interface createElement {
  (type: string, props: IProps, ...children: Array<createElement>): IElement;
}

interface IElement {
  type: string;
  props: IPropsHasChildren;
}

interface IFiber extends IElement {
  dom: HTMLElement;
  child?: IFiber;
  sibling?: IFiber;
  parent?: IFiber;

  alternate: IFiber;
  effectTag: TEffectTag;
}

interface IWipRoot {
  dom: HTMLElement;
  props: { children: Array<IElement> };
  alternme: null;
}
