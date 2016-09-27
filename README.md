# LeaderLine

Draw leader line in your web page.

```html
<div id="start">start</div>
<div id="end">end</div>
```

```js
// Add new leader line from `start` to `end` (HTML/SVG elements).
new LeaderLine(
  document.getElementById('start'),
  document.getElementById('end')
);
```

Options to customize are supported.

## Usage

Load a file `leader-line.min.js` only into your web page.

```html
<script src="leader-line.min.js"></script>
```

Pass two HTML elements to `LeaderLine` constructor. Then a leader line is drawn between those.

```js
new LeaderLine(
  document.getElementById('element-1'),
  document.getElementById('element-2')
);
```

Any element that has bounding-box is accepted. For example, `<div>`, `<button>`, `<td>`, and also, elements in another window (i.e. `<iframe>`).

And, the constructor accepts options.

```js
var startElement = document.getElementById('element-1'),
  endElement = document.getElementById('element-2');

// New leader line has red color and size 8.
new LeaderLine(startElement, endElement, {color: 'red', size: 8});
```

Also, the options can be accessed via properties of the instance (readable and writable).

```js
var line = new LeaderLine(startElement, endElement);
line.color = 'red'; // Change the color to red.
line.size++; // Up size.
console.log(line.size); // Output current size.
```

You can style the leader line via [`color`](#color), [`size`](#size), [`outlineColor`](#outlinecolor), and more [options](#options).

```js
new LeaderLine(startElement, endElement, {
  color: 'rgba(255, 255, 255, 0.4)',
  outline: true,
  endPlugOutline: true,
  endPlugSize: 1.5
});
```

You can add effects to the leader line via some options.

```js
new LeaderLine(startElement1, endElement, {
  startPlugColor: '#555',
  endPlugColor: '#555',
  gradient: true
});
new LeaderLine(startElement2, endElement, {dash: true});
new LeaderLine(startElement3, endElement, {dash: {animation: true}});
new LeaderLine(startElement4, endElement, {dropShadow: true});
```

You can change symbols that are shown at the end of the leader line via [`startPlug` and `endPlug`](#startplug-endplug) options.

```js
new LeaderLine(startElement, endElement, {
  startPlug: 'square',
  endPlug: 'hand'
});
```

You can indicate a point or area of an element instead of the element via [`pointAnchor`](#pointanchor) or [`areaAnchor`](#areaanchor) attachment.

You can specify additional labels via [`startLabel`, `middleLabel` and `endLabel`](#startlabel-middlelabel-endlabel) options. Also, [`captionLabel`](#captionlabel) and [`pathLabel`](#pathlabel) attachments can be specified as labels.

```js
new LeaderLine(
  startElement1,
  LeaderLine.pointAnchor(endElement1, {
    x: 999,
    y: 999
  }),
  {endLabel: 'xxx'}
);

new LeaderLine(
  startElement2,
  LeaderLine.areaAnchor(endElement2, {
    x: 999,
    y: 999,
    width: 999,
    height: 999,
  }),
  {endLabel: LeaderLine.pathLabel('xxx')}
);
```

You can show and hide the leader line with effect by [`show` and `hide`](#show-hide) methods.  
[`mouseHoverAnchor`](#mousehoveranchor) attachment allows it to implement showing and hiding with mouse moving easily.

```js
new LeaderLine(LeaderLine.mouseHoverAnchor(startElement), endElement);
```

For more details, refer to the following.

## Constructor

```js
line = new LeaderLine(options)
```

Or

```js
line = new LeaderLine(start, end[, options])
```

The `options` argument is an Object that can have properties as [options](#options). [`hide`](#hide-option) option also can be contained.

The `start` and `end` arguments are shortcuts to `options.start` and `options.end`. Following two codes work same.

```js
new LeaderLine({start: element1, end: element2});
new LeaderLine({start: element3, end: element4, color: 'red'});
```

```js
new LeaderLine(element1, element2);
new LeaderLine(element3, element4, {color: 'red'});
```

The instance has properties that have the same name as each option to get or set those values (other than [`hide`](#hide-option) option).

```js
var line = new LeaderLine(startElement, endElement);

upButton.addEventListener('mousedown', function() {
  if (line.size < 20) { line.size++; }
}, false);

downButton.addEventListener('mousedown', function() {
  if (line.size > 4) { line.size--; }
}, false);
```

If you want to set multiple options after it was constructed, using [`setOptions`](#setoptions) method instead of the properties may give better performance.

### `hide` option

Only the constructor accepts `hide` option. That is, the instance doesn't have `hide` property. (Note that the instance has [`hide`](#show-hide) method.)  
If `true` is specified, the leader line is not shown, it is shown by [`show`](#show-hide) method.  
This is used to hide it without using [`hide`](#show-hide) method, it is not shown at all until `show` method is called.

```js
// The leader line is never shown until the button is clicked.
var line = new LeaderLine(startElement, endElement, {hide: true});
button.addEventListener('click', function() { line.show(); }); // first showing
```

## Methods

## `setOptions`

```js
self = line.setOptions(options)
```

Set one or more options.  
The `options` argument is an Object that can have properties as [options](#options).

Since this method updates a view once after it sets all specified options, it may give better performance than setting options via the properties when multiple options are set to the instance that already exists.

## `show`, `hide`

```js
self = line.show([showEffectName[, animOptions]])
```

```js
self = line.hide([showEffectName[, animOptions]])
```

Show or hide the leader line.

```js
var line = new LeaderLine(startElement, endElement, {hide: true});
showButton.addEventListener('click', function() { line.show(); }, false);
hideButton.addEventListener('click', function() { line.hide(); }, false);
```

### `showEffectName`

*Type:* string  
*Default:* Value that was specified last time, or `fade` at first time

One of the following effect names:

- `none`
- `fade`  
Default `animOptions`: `{duration: 300, timing: 'linear'}`
- `draw`  
Default `animOptions`: `{duration: 500, timing: [0.58, 0, 0.42, 1]}`

### `animOptions`

*Type:* Object  
*Default:* See above

An Object that can have properties as [Animation Options](#animation-options).

## `position`

```js
self = line.position()
```

Fix each position of the end of the leader line with current position of the elements.  
When the elements as [`start` or `end`](#start-end) option were moved, you should call this method to reset each position. For example, you move the element as animation, you make the leader line follow the element that is scrolled, or the elements might be moved by resizing window.

```js
```

## `remove`

```js
line.remove()
```

Remove the leader line from the web page. The removed instance can't be used anymore.

## Options

The following options are specified by [constructor](#constructor) or [`setOptions`](#setoptions) method. And also, those are accessed via each property of instance.

### `start`, `end`

*Type:* HTML element or [Attachment](#attachments)

The leader line is drawn from the `start` element to the `end` element.  
Any element that has bounding-box is accepted. For example, `<div>`, `<button>`, `<td>`, and also, elements in another window (i.e. `<iframe>`).

```js
```

Or you can specify an [attachment](#attachments) instead of HTML element to indicate something.

### `color`

*Type:* string  
*Default:* `'coral'`

A color (See [Color Value](#color-value)) of the leader line.

```js
```

### `size`

*Type:* number  
*Default:* `4`

The width of the leader line, in pixels.

```js
```

### `path`

*Type:* string  
*Default:* `'fluid'`

One of the following path names:

- `straight`
- `arc`
- `fluid`
- `magnet`
- `grid`

### `startSocket`, `endSocket`

*Type:* string  
*Default:* `'auto'`

The string that indicates which side of the element the leader line connects, it can be `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.  
If `'auto'` is specified, the closest side is chosen automatically.

```js
```

### `startSocketGravity`, `endSocketGravity`

*Type:* number, Array or string  
*Default:* `'auto'`

The force of gravity at a socket.

If a number is specified, the leader line is pulled in the direction of the socket. The number is pull strength.

```js
```

If an Array that is coordinates `[x, y]` is specified, the leader line is pulled in the direction of the coordinates. The distance between the coordinates and `[0, 0]` is pull strength.  
For example, if `[50, -100]` is specified, it is pulled in the direction of the rightward and upward (The strength in the Y axis direction is larger than the X axis direction). If `[-50, 0]` is specified, it is pulled in the direction of the rightward (no strength in the Y axis direction).

```js
```

If `'auto'` is specified, it is adjusted to gravity suitable for current [`path`](#path) option automatically.

### `startPlug`, `endPlug`

*Type:* string  
*Default:* `startPlug`: `'behind'` | `endPlug`: `'arrow1'`

One of the following plug (symbol that is shown at the end of the leader line) names:

- `disc`
- `square`
- `arrow1`
- `arrow2`
- `arrow3`
- `hand`  
[`startPlugOutline`/`endPlugOutline`](#startplugoutline-endplugoutline) option is ignored  
[`startPlugColor`/`endPlugColor`](#startplugcolor-endplugcolor) option is ignored
- `crosshair`  
[`startPlugOutline`/`endPlugOutline`](#startplugoutline-endplugoutline) option is ignored
- `behind`

### `startPlugColor`, `endPlugColor`

*Type:* string  
*Default:* `'auto'`

Each option for when a value other than `behind` is specified for [`startPlug`/`endPlug`](#startplug-endplug) option.

A color (See [Color Value](#color-value)) of a plug.  
It is painted separately from the line (i.e. Those don't overlap each other). Therefore one of [`color`](#color) and `startPlugColor`/`endPlugColor` or both options can have opacity.  
If `'auto'` is specified, a value of `color` option is set synchronously (i.e. it is changed when `color` was changed).

```js
// only endPlugColor has opacity
```

### `startPlugSize`, `endPlugSize`

*Type:* number  
*Default:* `1`

Each option for when a value other than `behind` is specified for [`startPlug`/`endPlug`](#startplug-endplug) option.

A multiplying factor of the size of a plug.  
The plugs are resized synchronously, with following options that contain [`size`](#size):

Plug Size: `size` * [default-plug-scale] * [`startPlugSize` or `endPlugSize`]

```js
```

### `outline`

*Type:* boolean  
*Default:* `false`

If `true` is specified, an outline of the leader line is enabled.

```js
```

### `outlineColor`

*Type:* string  
*Default:* `'indianred'`

An option for when `true` is specified for [`outline`](#outline) option.

A color (See [Color Value](#color-value)) of an outline of the leader line.  
It is painted separately from inside of the line (i.e. Those don't overlap each other). Therefore one of [`color`](#color) and `outlineColor` or both options can have opacity.

```js
// only outlineColor has opacity
```

### `outlineSize`

*Type:* number  
*Default:* `0.25`

An option for when `true` is specified for [`outline`](#outline) option.

A multiplying factor of the size of an outline of the leader line.  
The outline is resized synchronously, with following options that contain [`size`](#size):

Outline Size: `size` * `outlineSize`

### `startPlugOutline`, `endPlugOutline`

*Type:* boolean  
*Default:* `false`

Each option for when a value other than `behind` is specified for [`startPlug`/`endPlug`](#startplug-endplug) option.

If `true` is specified, an outline of the plug is enabled.

```js
```

### `startPlugOutlineColor`, `endPlugOutlineColor`

*Type:* string  
*Default:* `'auto'`

Each option for when a value other than `behind` is specified for [`startPlug`/`endPlug`](#startplug-endplug) option, withal `true` is specified for [`startPlugOutline`/`endPlugOutline`](#startplugoutline-endplugoutline) option.

A color (See [Color Value](#color-value)) of an outline of the plug.  
It is painted separately from inside of the plug (i.e. Those don't overlap each other). Therefore one of [`startPlugColor`/`endPlugColor`](#startplugcolor-endplugcolor) and `startPlugOutlineColor`/`endPlugOutlineColor` or both options can have opacity.  
If `'auto'` is specified, a value of [`outlineColor`](#outlinecolor) option is set synchronously (i.e. it is changed when `outlineColor` was changed).

```js
// only endPlugOutlineColor has opacity
```

### `startPlugOutlineSize`, `endPlugOutlineSize`

*Type:* number  
*Default:* `1`

Each option for when a value other than `behind` is specified for [`startPlug`/`endPlug`](#startplug-endplug) option, withal `true` is specified for [`startPlugOutline`/`endPlugOutline`](#startplugoutline-endplugoutline) option.

A multiplying factor of the size of an outline of the plug.  
The outline is resized synchronously, with following options that contain [`size`](#size):

Plug Outline Size: `size` * [default-plug-scale] * [[`startPlugSize` or `endPlugSize`](#startplugsize-endplugsize)] * [default-plug-outline-scale] * [`startPlugOutlineSize` or `endPlugOutlineSize`]

### `startLabel`, `middleLabel`, `endLabel`

*Type:* string or [Attachment](#attachments)  
*Default:* `''`

An additional label that is shown on the leader line.

```js
```

Or you can specify an [attachment](#attachments) instead of a string.

### `dash` (effect)

*Type:* boolean or Object  
*Default:* `false`

Enable the effect with specified Object that can have properties as following options.  
Or `true` to enable it with all default options.

#### `len`, `gap`

*Type:* number  
*Default:* `len`: [`size`](#size) * 2 (synchronously) | `gap`: `size` (synchronously)

The size of parts of the dashed line, in pixels.  
`len` is length of drawn lines, `gap` is gap between drawn lines.

#### `animation`

*Type:* boolean or Object  
*Default:* `false`

An Object that can have properties as [Animation Options](#animation-options) to animate the effect.  
Or `true` to animate it with all default options.

Default Animation Options: `{duration: 1000, timing: 'linear'}`

```js
```

### `gradient` (effect)

*Type:* boolean or Object  
*Default:* `false`

Enable the effect with specified Object that can have properties as following options.  
Or `true` to enable it with all default options.

#### `startColor`, `endColor`

*Type:* string  
*Default:* [`startPlugColor`/`endPlugColor`](#startplugcolor-endplugcolor) (synchronously)

The start color (See [Color Value](#color-value)) and end color of the gradient.

### `dropShadow` (effect)

*Type:* boolean or Object  
*Default:* `false`

Enable the effect with specified Object that can have properties as following options.  
Or `true` to enable it with all default options.

#### `dx`, `dy`

*Type:* number  
*Default:* `dx`: `2` | `dy`: `4`

The X and Y offset of the drop shadow, in pixels.

#### `blur`

*Type:* number  
*Default:* `3`

The standard deviation for the blur operation in the drop shadow.

#### `color`

*Type:* string  
*Default:* `'#000'`

A color (See [Color Value](#color-value)) of the drop shadow.  
Alpha channel can be contained but it is specified for [`opacity`](#opacity) option.

#### `opacity`

*Type:* number  
*Default:* `0.8`

The transparency of the drop shadow, clipped in the range `[0,1]`.

## Attachments

Attachments are passed to the leader line via some options, and those make that option do special behavior.

You can get new attachment instance by individual method.  
For example, `LeaderLine.pointAnchor` method makes new [`pointAnchor`](#pointanchor) attachment instance. The instance is passed to the leader line via [`start` or `end`](#start-end) option.

```js
new LeaderLine(startElement, LeaderLine.pointAnchor(endElement));
```

In the case of the plan to use the attachment afterward.

```js
var attachment = LeaderLine.pointAnchor(endElement);

function attach() {
  line.end = attachment;
}
```

The new attachment instance is shared between two leader lines.

```js
line1.end = line2.end = LeaderLine.pointAnchor(endElement);
```

The `line1`'s attachment instance is shared with `line2`, in the `share` function.

```js
line1.end = LeaderLine.pointAnchor(endElement);

function share() {
  line2.end = line1.end;
}
```

### `pointAnchor`

```js
attachment = LeaderLine.pointAnchor(options)
```

Or

```js
attachment = LeaderLine.pointAnchor(element[, options])
```

An attachment that is specified instead of a HTML element for the `start` or `end` option of the leader line, for indicating a point instead of the element.  
The `options` argument is an Object that can have properties as options that are described later.

The `element` argument is shortcut to `options.element`. Following two codes work same.

```js
attachment1 = LeaderLine.pointAnchor({element: element1});
attachment2 = LeaderLine.pointAnchor({element: element2, x: 16, y: 32});
```

```js
attachment1 = LeaderLine.pointAnchor(element1);
attachment2 = LeaderLine.pointAnchor(element2, {x: 16, y: 32});
```

#### <a name="attachments-pointanchor-element"></a>`element`

*Type:* HTML element

An element that is a base of the point. See [`x` and `y`](#attachments-pointanchor-x-y) options.

#### <a name="attachments-pointanchor-x-y"></a>`x`, `y`

*Type:* number or string  
*Default:* `'50%'`

The X and Y coordinates for the point, in pixels, relative to the left-top corner of the specified element for [`element`](#attachments-pointanchor-element) option.  
Each value can be a percentage of the element's width or height. For example, `{x: '50%', y: '50%'}` indicates the center of the element, `{x: '100%', y: 0}` indicates the right-top corner.  
And also, each value can be a negative value or a value over the element's width or height, it indicates the outside of the element.

### `areaAnchor`

```js
attachment = LeaderLine.areaAnchor(options)
```

Or

```js
attachment = LeaderLine.areaAnchor(element[, shape][, options])
```

An attachment that is specified instead of a HTML element for the `start` or `end` option of the leader line, for indicating an area instead of the element.  
The `options` argument is an Object that can have properties as options that are described later.

The `element` and `shape` arguments are shortcuts to `options.element` and `options.shape`. Following two codes work same.

```js
attachment1 = LeaderLine.areaAnchor({element: element1});
attachment2 = LeaderLine.areaAnchor({
  element: element2, x: 16, y: 32, width: 48, height: 48
});
attachment3 = LeaderLine.areaAnchor({element: element3, shape: 'circle'});
attachment4 = LeaderLine.areaAnchor({
  element: element4, shape: 'circle', x: 16, y: 32, width: 48, height: 48
});
```

```js
attachment1 = LeaderLine.areaAnchor(element1);
attachment2 = LeaderLine.areaAnchor(element2, {
  x: 16, y: 32, width: 48, height: 48
});
attachment3 = LeaderLine.areaAnchor(element3, 'circle');
attachment4 = LeaderLine.areaAnchor(element4, 'circle', {
  x: 16, y: 32, width: 48, height: 48
});
```

#### <a name="attachments-areaanchor-element"></a>`element`

*Type:* HTML element

An element that is a base of the area. See [`x`, `y`](#attachments-areaanchor-x-y), [`width` and `height`](#width-height) options.

#### `shape`

*Type:* string  
*Default:* `'rect'`

One of the following shape names:

- `rect`
- `circle`
- `polygon`

#### <a name="attachments-areaanchor-x-y"></a>`x`, `y`

*Type:* number or string  
*Default:* `'-5%'`

An option for when `rect` or `circle` is specified for [`shape`](#shape) option.

The X and Y coordinates for the left-top corner of the area, in pixels, relative to the left-top corner of the specified element for [`element`](#attachments-areaanchor-element) option.  
Each value can be a percentage of the element's width or height. For example, `{x: '50%', y: '50%'}` indicates the center of the element, `{x: '100%', y: 0}` indicates the right-top corner.  
And also, each value can be a negative value or a value over the element's width or height, it indicates the outside of the element.

#### `width`, `height`

*Type:* number or string  
*Default:* `'110%'`

An option for when `rect` or `circle` is specified for [`shape`](#shape) option.

The width and height of the area, in pixels.  
Each value can be a percentage of the element's width or height. For example, `{x: '50%', y: 0, width: '50%', height: '100%'}` indicates the right half of the element.  
And also, each value can be a value over the element's width or height, it indicates the outside of the element.

#### `radius`

*Type:* number  
*Default:* `0`

An option for when `rect` is specified for [`shape`](#shape) option.

The radius to round corners of the area, in pixels.

#### `points`

*Type:* Array  

An option for when `polygon` is specified for [`shape`](#shape) option.

An Array that contains three or more points of the polygon. Each item that is a point is an Array that contains the X and Y coordinates for the point. That is, it is Array that contains Array, like `[[x1, y1], [x2, y2], ...]`.  
The X and Y coordinates are handled as same as [`x` and `y`](#attachments-areaanchor-x-y) options.

#### `color`

*Type:* number or string  
*Default:* `'xxx'`

#### `fillColor`

*Type:* number or string  
*Default:* `'xxx'`

#### `size`

*Type:* number or string  
*Default:* `'xxx'`

#### `dash`

*Type:* number or string  
*Default:* `'xxx'`

### `mouseHoverAnchor`
### `captionLabel`
### `pathLabel`

## Animation Options

### `duration`

*Type:* string  
*Default:* `'loading'`

### `timing`

*Type:* string  
*Default:* `'loading'`

## Color Value

CSS color notations with alpha channel are accepted. For example, `hsl(200, 70%, 58%)`, `rgba(73, 172, 223, 0.5)`, `#49acdf`, `skyblue`, etc. Some browsers support `hwb()`, `device-cmyk()` and `gray()` also.
