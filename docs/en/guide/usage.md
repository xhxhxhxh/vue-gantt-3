# Usage

Display time line in chart.

## Import
::: code-group
```ts [main.ts]
import { createApp } from 'vue';
import App from './App.vue';
import VueGantt3 from 'vue-gantt-3';
import 'vue-gantt-3/es/vue-gantt-3.css';

const app = createApp(App);
app.use(VueGantt3);
app.mount('#app');
```
:::

## Basic

Basic usage.

:::demo You need to set attribute `getRowId`, `columns` and `rows` first, don't forget set parent node's `height` using css, then the gantt will display correctly.

basic

:::

## Change gantt row height

If you need change gantt row's height, set attribute `rowHeight` in the gantt.

:::demo `rowHeight` default value is 25.

changeHeight

:::

## Gantt style

You can set attribute `styleOption` to define some styles in the gantt. Most styles can be modified in css.

:::demo `styleOption` has many properties include `barColor`, `showHorizontalGridLines`, `barsLabeling`, `timePointSize` and `showTimePoints` etc.

styleOption

:::

## Empty row

Rows will not fill the whole area if the number of rows is small. Set attribute `getEmptyRows` to provide rows for gantt.

:::demo `getEmptyRows` need return rows data which just need to provide id.

emptyRow

:::

## Row Selection

Row selection is configured with the `rowSelection` gantt property.

:::demo `rowSelection` can be set to  `single`, `multiple` or `none`. Setting `rowSelection` to `none` will disable the row selection. You can use drag, `ctrl` or `shift` to multiselect rows when `rowSelection` is in multiple mode. Gantt also expose a `selectChange` event, let you know which rows have been selected.

rowSelection

:::

## Add or remove row

Add or remove the row data inside the gantt by updating the rows gantt property.

:::demo You should use `shallowRef` to define rows data that means you could't push or remove row data directly, you can copy rows data shallowly, then redefine is.

addorRemove

:::

## Update row

You can update the row data directly, then call `freshRowNodes` method to refresh the view.

:::demo You can create a cell editor component, setting it in `defaultCol` or `columns`. Here is a sample component for cell editor, see [CellRender](https://github.com/xhxhxhxh/vue-gantt-3/blob/master/play/src/components/CellRender.vue).

updateRow

:::

## Time scale

You can use `shift` + `mouse wheel` to scale the time.

:::demo Setting property `defaultPerHourSpacing` to define per hour's spacing, or you can set `defaultTimeScale` which value can be set to `day`, `week`, `month` ,`quarter` or `year`. `defaultTimeScale` has a higher priority than `defaultPerHourSpacing`.

timeScale

:::

## Stretch and move time line

Move the timeline to where you want it.

:::demo You can listen event `timeLineStretchChange` and `timeLineMoveChange` when time line is changed. Gantt will not update date in origial data directly, you should update date by yourself.

stretchAndMove

:::

::: tip
Gantt will combine time lines auto if two time lines' date overlap.
:::

## Time points

Gantt support show time points on time line.

:::demo Setting time point data in row's timeLine. You can set arrtibute `timePointComp` to a custom component, then set timeLine's `useTimePointComp` be `true`, and add some params you want in timeLine's `compParams`. You can also listen event `timePointMoveFinished` when time point has been moved.

timePoints

:::

## Tree data

Gantt support display tree structure data.

:::demo When `row` contains the `children` field, it is treated as nested data.

treeData

:::

::: info
If a row has children, its display date will depend on its children.
:::

## Custom time line

Using a component to cover time line's default behavior.

:::demo Setting component in `timeLineRender`, you can also set params in `timeLineRenderParams`.  Here is a sample component for custom time line, see [TimeLineRender](https://github.com/xhxhxhxh/vue-gantt-3/blob/master/play/src/components/TimeLineRender.vue).

customTimeLine

:::

