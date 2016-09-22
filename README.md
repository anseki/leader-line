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

You can add [effects](#effects) to the leader line via some options.

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

You can change symbols that are shown at the end of the leader line via [`startPlug` and `endPlug` options](#endplug).

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

The `options` argument is an object that can have properties as [Options](#options). [`hide` option](#hide-option) also can be contained.

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
This is used to hide it without [`hide` method](#show-hide), it is not shown at all until [`show` method](#show-hide) is called.

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
The `options` argument is an object that can have properties as [Options](#options). This may give better performance when multiple options are set.

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

See [Animation Options](#animation-options).

## `position`

```js
self = line.position()
```

Fix each position of the end of the leader line with current position of the elements.  
When the elements as `options.start` or `options.end` were moved, you should call this method to reset each position. For example, you move the element as animation, you make the leader line follow the element that is scrolled, or the elements might be moved by resizing window.

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
Or you can specify an [attachment](#attachments) instead of DOM element to indicate something.

### `color`

*Type:* string  
*Default:* `'coral'`

A color of the leader line.  
CSS color notations with alpha channel are accepted. For example, `hsl(200, 70%, 58%)`, `rgba(73, 172, 223, 0.5)`, `#49acdf`, `skyblue`, etc. Some browsers support `hwb()`, `device-cmyk()` and `gray()` also.

### `size`

*Type:* number  
*Default:* `4`

The width of the leader line, in pixels.

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

### `startSocketGravity`, `endSocketGravity`

*Type:* number, string or Array  
*Default:* `'auto'`

The force of gravity at a socket.
the direction of gravity

### `startPlug`, `endPlug`

*Type:* string  
*Default:* `startPlug`: `'behind'`, `endPlug`: `'arrow1'`

### `startPlugColor`, `endPlugColor`

*Type:* string  
*Default:* `'auto'`

### `startPlugSize`, `endPlugSize`

*Type:* number  
*Default:* `startPlugSize`: `1`, `endPlugSize`: `1`

### `outline`

*Type:* boolean  
*Default:* `false`

### `outlineColor`

*Type:* string  
*Default:* `'indianred'`

### `outlineSize`

*Type:* number  
*Default:* `0.25`

### `startPlugOutline`, `endPlugOutline`

*Type:* string  
*Default:* `startPlugOutline`: `false`, `endPlugOutline`: `false`

### `startPlugOutlineColor`, `endPlugOutlineColor`

*Type:* string  
*Default:* `'auto'`

### `startPlugOutlineSize`, `endPlugOutlineSize`

*Type:* number  
*Default:* `startPlugOutlineSize`: `1`, `endPlugOutlineSize`: `1`

### `startLabel`, `middleLabel`, `endLabel`

*Type:* string  
*Default:* `startLabel`: `''`, `middleLabel`: `''`, `endLabel`: `''`

### `dash` (effect)

*Type:* boolean or Object  
*Default:* `false`

### `gradient` (effect)

*Type:* boolean or Object  
*Default:* `false`

### `dropShadow` (effect)

*Type:* boolean or Object  
*Default:* `false`


## Attachments

### `pointAnchor`
### `areaAnchor`
### `mouseHoverAnchor`
### `captionLabel`
### `pathLabel`

## Animation Options

An object that can have following properties:

### `duration`

*Type:* string  
*Default:* `'loading'`

### `timing`

*Type:* string  
*Default:* `'loading'`
