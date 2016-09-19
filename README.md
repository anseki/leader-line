# LeaderLine

Draw leader line between two elements in your web page.

```html
<div id="start">start</div>
<div id="end">end</div>
```

```js
var start = document.getElementById('start'),
  end = document.getElementById('end');
new LeaderLine(start, end); // Add new line from `start` to `end`.
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

The constructor accepts options also.

```js
new LeaderLine(start, end, {color: 'red', size: 8});
```

Also, the options can be accessed via properties of the instance (readable and writable).

```js
var line = new LeaderLine(start, end);
line.color = 'red';
line.size++;
console.log(line.size);
```

You can change a color of the leader line via [`color` option](#color).

```js
line.color = 'blue';
```

And more options for the style are available.

```js
new LeaderLine(start, end, {
  color: 'rgba(255, 255, 255, 0.4)',
  outline: true,
  endPlugOutline: true,
  endPlugSize: 1.5
});
```

You can add [effect](#effects) to the leader line via some options.

```js
new LeaderLine(start1, end, {
  startPlugColor: '#555',
  endPlugColor: '#555',
  gradient: true,
  dropShadow: true
});

new LeaderLine(start2, end, {
  dash: true
});

new LeaderLine(start3, end, {
  dash: {animation: true}
});

new LeaderLine(start4, end, {
  outline: true,
  dash: {len: 15, gap: 5}
});
```

You can change symbols that are shown at the end of the leader line via [`startPlug` and `endPlug` options](#endplug).

```js
new LeaderLine(start, end, {
  startPlug: 'square',
  endPlug: 'hand'
});
```

You can indicate a point or area of an element instead of the element via [`pointAnchor`](#pointanchor) or [`areaAnchor`](#areaanchor) attachments.

```js
new LeaderLine(start1, LeaderLine.pointAnchor({element: end1, x: 999, y: 999}));
new LeaderLine(start2, LeaderLine.pointAnchor({
  element: end2,
  x: 999,
  y: 999,
  width: 999,
  height: 999,
  radius: 999
}));
```

You can show and hide the leader line with effect via [`show` and `hide` methods](#show-hide).  
[`mouseHoverAnchor` attachment](#mousehoveranchor) allows it to implement showing and hiding with mouse moving easily.

```js
new LeaderLine(LeaderLine.mouseHoverAnchor({element: start}), end);
```

[`captionLabel`](#captionlabel) or [`pathLabel`](#pathlabel) attachments allow it to show additional labels.

```js
new LeaderLine(start, end, {
  endLabel: LeaderLine.pathLabel({text: 'xxx'})
});
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

`start` and `end` arguments are shortcut to `options.start` and `options.end`. That is, following two codes work same.

```js
new LeaderLine({start: element1, end: element2})
```

```js
new LeaderLine(element1, element2)
```

The instance has properties that have the same name as the option to get or set those (other than [`hide` option](#hide-option)).

```js
var line = new LeaderLine(start, end);
upButton.addEventListener('mousedown', function() {
  if (line.size < 20) { line.size++; }
});
downButton.addEventListener('mousedown', function() {
  if (line.size > 4) { line.size--; }
});
```

If you want to set multiple options after it was constructed, using [`setOptions` method](#setoptions) instead of the properties is better for performance.

### `hide` option

Only the constructor accepts `hide` option. That is, the instance don't have `hide` property.  
If `true` is specified, the leader line is not shown, it is shown by [`show` method](#show-hide).  
This is used to hide it without [`hide` method](#show-hide), it is not shown at all until [`show` method](#show-hide) is called.

```js
// The leader line is never shown until the button is clicked.
var line = new LeaderLine(start, end, {hide: true});
button.addEventListener('click', function() { line.show(); });
```

## Methods

## `setOptions`

## `show`, `hide`

## `position`

## `remove`

## Options

### `start`, `end`
### `color`
### `size`
### `path`
### `startSocket`, `endSocket`
### `startSocketGravity`, `endSocketGravity`
### `startPlug`, `endPlug`
### `startPlugColor`, `endPlugColor`
### `startPlugSize`, `endPlugSize`
### `outline`
### `outlineColor`
### `outlineSize`
### `startPlugOutline`, `endPlugOutline`
### `startPlugOutlineColor`, `endPlugOutlineColor`
### `startPlugOutlineSize`, `endPlugOutlineSize`
### `startLabel`, `middleLabel`, `endLabel`
### `dash` (effect)
### `gradient` (effect)
### `dropShadow` (effect)

## Attachments

### `pointAnchor`
### `areaAnchor`
### `mouseHoverAnchor`
### `captionLabel`
### `pathLabel`
