export as namespace LeaderLine;
export = LeaderLine;

declare namespace LeaderLine {
    export type Element = HTMLElement | SVGElement;
    export type PlugType = 'disc' | 'square' | 'arrow1' | 'arrow2' | 'arrow3' | 'hand' | 'crosshair' | 'behind';
    export type PathType = 'straight' | 'arc' | 'fluid' | 'magnet' | 'grid';
    export type SocketType = 'top' | 'right' | 'bottom' | 'left' | 'auto';
    export type ShowEffectName = 'none' | 'fade' | 'draw';
    export type AreaAnchorShape = 'rect' | 'circle' | 'polygon';

    export interface LabelFontOptions {
        fontFamily?: any;
        fontStyle?: any;
        fontVariant?: any;
        fontWeight?: any;
        fontStretch?: any;
        fontSize?: any;
        fontSizeAdjust?: any;
        kerning?: any;
        letterSpacing?: any;
        wordSpacing?: any;
        textDecoration?: any;
    }

    export interface Options {
        end?: Element | AnchorAttachment;
        start?: Element | AnchorAttachment;

        size?: number;
        color?: string;
        path?: PathType;
        startSocket?: SocketType;
        endSocket?: SocketType;
        startSocketGravity?: number | string | Array<string | number>;
        endSocketGravity?: number | string | Array<string | number>;

        startPlug?: PlugType;
        endPlug?: PlugType;
        startPlugColor?: string;
        endPlugColor?: string;

        startPlugSize?: number;
        endPlugSize?: number;
        outline?: boolean;
        outlineColor?: string;
        outlineSize?: number;

        startPlugOutline?: boolean;
        endPlugOutline?: boolean;

        startPlugOutlineColor?: string;
        endPlugOutlineColor?: string;

        startPlugOutlineSize?: number;
        endPlugOutlineSize?: number;

        startLabel?: string | LeaderLine.LabelAttachment;
        middleLabel?: string | LeaderLine.LabelAttachment;
        endLabel?: string | LeaderLine.LabelAttachment;

        dash?: boolean | DashOptions;
        gradient?: boolean | GradientOptions;
        dropShadow?: boolean | DropShadowOptions;

        show?: boolean;
        hide?: boolean;
    }

    export interface DashOptions {
        len?: number | string;
        gap?: number | string;

        animation?: boolean | AnimationOptions;
    }

    export interface GradientOptions {
        startColor?: string;
        endColor?: string;
    }

    export interface DropShadowOptions {
        dx?: number;
        dy?: number;
        blur?: number;
        color?: string;
        opacity?: number;
    }

    export interface AnimationOptions {
        timing?: 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | Array<number>;
        duration?: number;
    }

    export interface PointAnchorOptions {
        x?: string | number;
        y?: string | number;
        element?: Element;
    }

    export interface AreaAnchorOptions {
        x?: number | string;
        y?: number | string;
        shape?: AreaAnchorShape;
        width?: number | string;
        radius?: number;
        height?: number | string;
        element?: Element;
        points?: Array<[number|string, number|string]>;
        color?: string;
        fillColor?: string;
        size?: number;
        dash?: boolean | LeaderLine.DashOptions;
    }

    export interface MouseHoverAnchorOptions {
        element?: Element;
        showEffectName?: ShowEffectName,
        animOptions?: AnimationOptions,
        style?: { [key: string]: any };
        hoverStyle?: { [key: string]: any };
        onSwitch?: (event: MouseEvent) => any;
    }

    export interface CaptionLabelOptions extends LabelFontOptions {
        text?: string;
        offset?: Array<number>;
        lineOffset?: number;
        color?: string;
        outlineColor?: string;
    }

    export interface PathLabelOptions extends LabelFontOptions {
        text?: string;
        lineOffset?: number;
        color?: string;
        outlineColor?: string;
    }

    export class LabelAttachment { }

    export class AnchorAttachment { }

}

declare class LeaderLine {
    end: Element | LeaderLine.AnchorAttachment;
    start: Element | LeaderLine.AnchorAttachment;
    size: number;
    color: string;
    startSocketGravity: string;
    endSocketGravity: string;
    startPlugColor: string;
    endPlugColor: string;
    startPlugSize: number;
    endPlugSize: number;
    outline: boolean;
    outlineColor: string;
    outlineSize: number;
    startPlugOutline: boolean;
    endPlugOutline: boolean;
    startPlugOutlineColor: string;
    endPlugOutlineColor: string;
    startPlugOutlineSize: number;
    endPlugOutlineSize: number;
    path: LeaderLine.PathType;
    startSocket: LeaderLine.SocketType;
    endSocket: LeaderLine.SocketType;
    startPlug: LeaderLine.PlugType;
    endPlug: LeaderLine.PlugType;
    dash: boolean | LeaderLine.DashOptions;
    gradient: boolean | LeaderLine.GradientOptions;
    dropShadow: boolean;
    startLabel: string | LeaderLine.LabelAttachment;
    endLabel: string | LeaderLine.LabelAttachment;
    middleLabel: string | LeaderLine.LabelAttachment;

    constructor(options: LeaderLine.Options);
    constructor(start: Element | LeaderLine.AnchorAttachment, end: Element | LeaderLine.AnchorAttachment, options?: LeaderLine.Options);

    static pointAnchor(options: LeaderLine.PointAnchorOptions): LeaderLine.AnchorAttachment;
    static pointAnchor(element: LeaderLine.Element, options?: LeaderLine.PointAnchorOptions): LeaderLine.AnchorAttachment;

    static areaAnchor(options: LeaderLine.AreaAnchorOptions): LeaderLine.AnchorAttachment;
    static areaAnchor(element: LeaderLine.Element, options?: LeaderLine.AreaAnchorOptions): LeaderLine.AnchorAttachment;
    static areaAnchor(element: LeaderLine.Element, shape?: LeaderLine.AreaAnchorShape, options?: LeaderLine.AreaAnchorOptions): LeaderLine.AnchorAttachment;

    static mouseHoverAnchor(options: LeaderLine.MouseHoverAnchorOptions): LeaderLine.AnchorAttachment;
    static mouseHoverAnchor(element: LeaderLine.Element, showEffectName?: LeaderLine.ShowEffectName, options?: LeaderLine.MouseHoverAnchorOptions): LeaderLine.AnchorAttachment;

    static captionLabel(options: any): LeaderLine.LabelAttachment;
    static captionLabel(text?: string, options?: any): LeaderLine.LabelAttachment;

    static pathLabel(options: LeaderLine.PathLabelOptions): LeaderLine.LabelAttachment;
    static pathLabel(text: string, options?: LeaderLine.PathLabelOptions): LeaderLine.LabelAttachment;

    hide(showEffectName?: LeaderLine.ShowEffectName, animOptions?: LeaderLine.AnimationOptions): void;
    show(showEffectName?: LeaderLine.ShowEffectName, animOptions?: LeaderLine.AnimationOptions): void;
    remove(): void;
    position(): void;
    setOptions(options: LeaderLine.Options): void;
}
