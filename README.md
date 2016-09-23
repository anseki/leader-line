# LeaderLine

Draw leader line in your web page.

```html
<div id="start">start</div>
<div id="end">end</div>
```

```js
// Add new leader line from `start` to `end`.
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

Pass two DOM elements to `LeaderLine` constructor. Then a leader line is drawn between those.

```js
new LeaderLine(
  document.getElementById('element-1'),
  document.getElementById('element-2')
);
```

Any element that has bounding-box is accepted. For example, `<div>`, `<button>`, `<td>`, and also, elements in another window (i.e. `<iframe>`).

And, the constructor accepts options.

```js
// New leader line has red color and size 8.
new LeaderLine(start, end, {color: 'red', size: 8});
```

Also, the options can be accessed via properties of the instance (readable and writable).

```js
var line = new LeaderLine(start, end);
line.color = 'red'; // Change color to red.
line.size++; // Up size.
console.log(line.size); // Output current size.
```

You can style the leader line via [`color`](#color), [`size`](#size), [`outlineColor`](#outlinecolor), and more [options](#options).

```js
new LeaderLine(start, end, {
  color: 'rgba(255, 255, 255, 0.4)',
  outline: true,
  endPlugOutline: true,
  endPlugSize: 1.5
});
```

You can add effects to the leader line via some options.

```js
new LeaderLine(start1, end, {
  startPlugColor: '#555',
  endPlugColor: '#555',
  gradient: true
});
new LeaderLine(start2, end, {dash: true});
new LeaderLine(start3, end, {dash: {animation: true}});
new LeaderLine(start4, end, {dropShadow: true});
```

You can change symbols that are shown at the end of the leader line via [`startPlug` and `endPlug` options](#startplug-endplug).

```js
new LeaderLine(start, end, {
  startPlug: 'square',
  endPlug: 'hand'
});
```

You can indicate a point or area of an element instead of an element via [`pointAnchor`](#pointanchor) or [`areaAnchor`](#areaanchor) attachments.  
You can specify additional labels via [`startLabel`, `middleLabel` and `endLabel` options](#startlabel-middlelabel-endlabel). Also, [`captionLabel`](#captionlabel) or [`pathLabel`](#pathlabel) attachments can be specified as labels.

```js
new LeaderLine(start1, LeaderLine.pointAnchor({
  element: end1,
  x: 999,
  y: 999
}), {
  endLabel: 'xxx'
});

new LeaderLine(start2, LeaderLine.areaAnchor({
  element: end2,
  x: 999,
  y: 999,
  width: 999,
  height: 999,
}), {
  endLabel: LeaderLine.pathLabel({text: 'xxx'})
});
```

You can show and hide the leader line with effect via [`show` and `hide` methods](#show-hide).  
[`mouseHoverAnchor` attachment](#mousehoveranchor) allows it to implement showing and hiding with mouse moving easily.

```js
new LeaderLine(LeaderLine.mouseHoverAnchor({element: start}), end);
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

The `options` argument is an Object that can have properties as [Options](#options). [`hide` option](#hide-option) also can be contained.

`start` and `end` arguments are shortcuts to `options.start` and `options.end`. Following two codes work same.

```js
new LeaderLine({start: element1, end: element2})
```

```js
new LeaderLine(element1, element2)
```

The instance has properties that have the same name as each option to get or set those (other than [`hide` option](#hide-option)).

```js
var line = new LeaderLine(start, end);
upButton.addEventListener('mousedown', function() {
  if (line.size < 20) { line.size++; }
}, false);
downButton.addEventListener('mousedown', function() {
  if (line.size > 4) { line.size--; }
}, false);
```

If you want to set multiple options after it was constructed, using [`setOptions` method](#setoptions) instead of the properties may give better performance.

### `hide` option

Only the constructor accepts `hide` option. That is, the instance doesn't have `hide` property.  
If `true` is specified, the leader line is not shown, it is shown by [`show` method](#show-hide).  
This is used to hide it without [`hide` method](#show-hide), it is not shown at all until `show` method is called.

```js
// The leader line is never shown until the button is clicked.
var line = new LeaderLine(start, end, {hide: true});
button.addEventListener('click', function() { line.show(); }); // first showing
```

## Methods

## `setOptions`

```js
self = line.setOptions(options)
```

Set one or more options.  
The `options` argument is an Object that can have properties as [Options](#options). This may give better performance when multiple options are set.

## `show`, `hide`

```js
self = line.show([showEffectName[, animOptions]])
```

```js
self = line.hide([showEffectName[, animOptions]])
```

Show or hide the leader line.

```js
var line = new LeaderLine(start, end, {hide: true});
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
When the elements as [`start` or `end`](#start-end) were moved, you should call this method to reset each position. For example, you move the element as animation, you make the leader line follow the element that is scrolled, or the elements might be moved by resizing window.

```js
```

## `remove`

```js
line.remove()
```

Remove the leader line from the web page. The removed instance can't be used anymore.

## Options

The following options are specified by [constructor](#constructor) or [`setOptions` method](#setoptions). And also, those are accessed via each property of instance.

### `start`, `end`

*Type:* DOM element or [Attachment](#attachments)  

The leader line is drawn from `start` to `end`.  
Any element that has bounding-box is accepted. For example, `<div>`, `<button>`, `<td>`, and also, elements in another window (i.e. `<iframe>`).

```js
```

Or you can specify an [attachment](#attachments) instead of DOM element to indicate something.

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

If `'auto'` is specified, a value that is suited to [`path`](#path) is set automatically.

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
[`startPlugOutline` or `endPlugOutline`](#startplugoutline-endplugoutline) is ignored  
[`startPlugColor` or `endPlugColor`](#startplugcolor-endplugcolor) is ignored
- `crosshair`  
[`startPlugOutline` or `endPlugOutline`](#startplugoutline-endplugoutline) is ignored

### `startPlugColor`, `endPlugColor`

*Type:* string  
*Default:* `'auto'`

A color (See [Color Value](#color-value)) of a plug.  
It is painted separately from the line. Therefore one of [`color`](#color) and `startPlugColor`/`endPlugColor` or both can have opacity.  
If `'auto'` is specified, a value of [`color`](#color) is set synchronously (i.e. it is changed when `color` was changed).

```js
// only endPlugColor has opacity
```

### `startPlugSize`, `endPlugSize`

*Type:* number  
*Default:* `1`

A multiplying factor of the size of a plug.  
The plugs are resized with [`size`](#size) synchronously.

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

A color (See [Color Value](#color-value)) of an outline of the leader line.  
It is painted separately from inside of the line. Therefore one of [`color`](#color) and `outlineColor` or both can have opacity.  
If [`outline`](#outline) is disabled, it is ignored.

```js
// only outlineColor has opacity
```

### `outlineSize`

*Type:* number  
*Default:* `0.25`

A multiplying factor of the size of an outline of the leader line.  
The outline is resized with [`size`](#size) synchronously.

Outline Size: `size` * `outlineSize`

### `startPlugOutline`, `endPlugOutline`

*Type:* boolean  
*Default:* `false`

If `true` is specified, an outline of the plug is enabled.

```js
```

### `startPlugOutlineColor`, `endPlugOutlineColor`

*Type:* string  
*Default:* `'auto'`

A color (See [Color Value](#color-value)) of an outline of the plug.  
It is painted separately from inside of the plug. Therefore one of [`startPlugColor`/`endPlugColor`](#startplugcolor-endplugcolor) and `startPlugOutlineColor`/`endPlugOutlineColor` or both can have opacity.  
If `'auto'` is specified, a value of [`outlineColor`](#outlinecolor) is set synchronously (i.e. it is changed when `outlineColor` was changed).  
If [`startPlugOutline`/`endPlugOutline`](#startplugoutline-endplugoutline`) is disabled, it is ignored.

```js
// only endPlugOutlineColor has opacity
```

### `startPlugOutlineSize`, `endPlugOutlineSize`

*Type:* number  
*Default:* `1`

A multiplying factor of the size of an outline of the plug.  
The outline is resized with [`size`](#size) synchronously.

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

The size of parts of the dashed line.  
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

The X and Y offset of the drop shadow.

#### `blur`

*Type:* number  
*Default:* `3`

The standard deviation for the blur operation in the drop shadow.

#### `color`

*Type:* string  
*Default:* `'#000'`

A color (See [Color Value](#color-value)) of the drop shadow.  
Alpha channel can be contained but it is specified for [`opacity` option](#opacity).

#### `opacity`

*Type:* number  
*Default:* `0.8`

The transparency of the drop shadow, clipped in the range `[0,1]`.

## Attachments

Attachments are passed to the leader line via some options, and those make that option do special behavior.

You can make new attachment instance by individual method.  
For example, `LeaderLine.pointAnchor` method makes new [`pointAnchor`](#pointanchor) attachment instance. And you can pass the instance to the leader line for [`start` or `end`](#start-end) option.

```js
new LeaderLine(start, LeaderLine.pointAnchor({element: end}));
```

In the case of the plan to use the attachment afterward.

```js
var line = new LeaderLine(start, end),
  attachment = LeaderLine.pointAnchor({element: end});

function attach() {
  line.end = attachment;
}
```

The new attachment instance is shared between two leader lines.

```js
line1.end = line2.end = LeaderLine.pointAnchor({element: end});
```

The `line1`'s attachment instance is shared with `line2`.

```js
line1.end = LeaderLine.pointAnchor({element: end});
line2.end = line1.end;
```

### `pointAnchor`



### `areaAnchor`
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
