declare module "leader-line";

declare class LeaderLine implements LeaderLine.Options {
  constructor(
    options: LeaderLine.StartEndOptions & Partial<LeaderLine.Options> & Partial<LeaderLine.ConstructorOnlyOptions>
  );
  constructor(
    start: Element | LeaderLine.Attachment,
    end: Element | LeaderLine.Attachment,
    options?: Partial<LeaderLine.Options> & Partial<LeaderLine.ConstructorOnlyOptions>
  );

  hide(showEffectName?: LeaderLine.ShowHideEffect, animOptions?: Partial<LeaderLine.AnimationOptions>): void;
  position(): void;
  remove(): void;
  setOptions(options: LeaderLine.Options): void;
  show(showEffectName?: LeaderLine.ShowHideEffect, animOptions?: Partial<LeaderLine.AnimationOptions>): void;

  end: Element | LeaderLine.Attachment;
  start: Element | LeaderLine.Attachment;

  color: string;
  dash: boolean | { animation: boolean; gap: number | "auto"; len: number | "auto" };
  dropShadow: boolean | { blur: number; color: string; dx: number; dy: number; opacity: number };
  endLabel: string | LeaderLine.Attachment;
  endPlug: LeaderLine.Plug;
  endPlugColor: string | "auto";
  endPlugOutline: boolean;
  endPlugOutlineColor: string | "auto";
  endPlugOutlineSize: number;
  endPlugSize: number;
  endSocket: LeaderLine.Socket;
  endSocketGravity: number | Array<number> | "auto";
  gradient: boolean | { startColor: string; endColor: string };
  middleLabel: string | LeaderLine.Attachment;
  outline: boolean;
  outlineColor: string;
  outlineSize: number;
  path: "straight" | "arc" | "fluid" | "magnet" | "grid";
  size: number;
  startLabel: string | LeaderLine.Attachment;
  startPlug: LeaderLine.Plug;
  startPlugColor: string | "auto";
  startPlugOutline: boolean;
  startPlugOutlineColor: string | "auto";
  startPlugOutlineSize: number;
  startPlugSize: number;
  startSocket: LeaderLine.Socket;
  startSocketGravity: number | Array<number> | "auto";
}

declare namespace LeaderLine {
  type Plug = "disc" | "square" | "arrow1" | "arrow2" | "arrow3" | "hand" | "crosshair" | "behind";
  type Easing = "ease" | "linear" | "ease-in" | "ease-out" | "ease-in-out";
  type Socket = "auto" | "top" | "right" | "bottom" | "left";
  type Shape = "rect" | "circle" | "polygon";
  type ShowHideEffect = "none" | "fade" | "draw";

  type AnimationOptions = { duration: number; timing: Array<number> | LeaderLine.Easing };

  type Attachment = {
    remove(): void;
  };

  type StartEndOptions = {
    end: Element | Attachment;
    start: Element | Attachment;
  };

  type ConstructorOnlyOptions = {
    hide: boolean;
  };

  type Options = {
    color: string;
    dash: boolean | { animation: boolean; gap: number | "auto"; len: number | "auto" };
    dropShadow: boolean | { blur: number; color: string; dx: number; dy: number; opacity: number };
    endLabel: string | Attachment;
    endPlug: Plug;
    endPlugColor: string | "auto";
    endPlugOutline: boolean;
    endPlugOutlineColor: string | "auto";
    endPlugOutlineSize: number;
    endPlugSize: number;
    endSocket: Socket;
    endSocketGravity: number | Array<number> | "auto";
    gradient: boolean | { startColor: string; endColor: string };
    middleLabel: string | Attachment;
    outline: boolean;
    outlineColor: string;
    outlineSize: number;
    path: "straight" | "arc" | "fluid" | "magnet" | "grid";
    size: number;
    startLabel: string | Attachment;
    startPlug: Plug;
    startPlugColor: string | "auto";
    startPlugOutline: boolean;
    startPlugOutlineColor: string | "auto";
    startPlugOutlineSize: number;
    startPlugSize: number;
    startSocket: Socket;
    startSocketGravity: number | Array<number> | "auto";
  };

  let positionByWindowResize: boolean;

  type PointAnchorOptions = {
    element: Element;
    x: number;
    y: number;
  };

  function pointAnchor(options: PointAnchorOptions): Attachment;
  function pointAnchor(element: Element, options: Omit<PointAnchorOptions, "element">): Attachment;

  type AreaAnchorOptions = {
    element: Element;
    shape: Shape;
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
    radius: number;
    points: Array<[number | string, number | string]>;
    color: string;
    fillColor: string;
    size: number;
    dash: boolean;
    len: number;
    gap: number;
  };

  function areaAnchor(options: AreaAnchorOptions): Attachment;
  function areaAnchor(
    element: Element,
    options: Partial<Omit<AreaAnchorOptions, "element">>
  ): Attachment;
  function areaAnchor(
    element: Element,
    shape: string,
    options: Omit<AreaAnchorOptions, "element" | "shape">
  ): Attachment;

  type MouseHoverAnchorOptions = {
    element: Element;
    showEffectName: ShowHideEffect;
    animOptions: AnimationOptions;
    style: Record<string, string | number | null> | undefined;
    hoverStyle: Record<string, string | number | null> | undefined;
    onSwitch: (event: Event) => void;
  };

  function mouseHoverAnchor(options: Partial<MouseHoverAnchorOptions>): Attachment;
  function mouseHoverAnchor(
    element: Element,
    options: Partial<Omit<MouseHoverAnchorOptions, "element">>
  ): Attachment;
  function mouseHoverAnchor(
    element: Element,
    showEffectName: ShowHideEffect,
    options: Partial<Omit<MouseHoverAnchorOptions, "element" | "showEffectName">>
  ): Attachment;

  type LabelOptions = {
    fontFamily: string;
    fontStyle: string;
    fontVariant: string;
    fontWeight: string;
    fontStretch: string;
    fontSize: string;
    fontSizeAdjust: string;
    kerning: string;
    letterSpacing: string;
    wordSpacing: string;
    textDecoration: string;
  };

  type CaptionLabelOptions = {
    text: string;
    offset: [number, number];
    lineOffset: number;
    color: string;
    outlineColor: string;
  } & LabelOptions;

  function captionLabel(options: Partial<CaptionLabelOptions>): Attachment;
  function captionLabel(
    text: string,
    options: Partial<Omit<CaptionLabelOptions, "text">>
  ): Attachment;

  type PathLabelOptions = {
    text: string;
    lineOffset: number;
    color: string;
    outlineColor: string;
  } & LabelOptions;

  function pathLabel(options: Partial<PathLabelOptions>): Attachment;
  function pathLabel(text: string, options: Partial<Omit<PathLabelOptions, "text">>): Attachment;
}
