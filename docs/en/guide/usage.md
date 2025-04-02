# Usage

Display time line in chart.

## Basic

Basic usage.

:::demo You need to set attribute `getRowId`, `columns` and `rows` first, don't forget set parent node's `height` in css, then the gantt will display correctly.

basic

:::

## Change gantt row height

If you need change gantt row's height, pass the `rowHeight` property to the gantt.

:::demo `rowHeight` default value is 25.

changeHeight

:::

## Gantt style

You can pass the `styleOption` property to define some style in the gantt. Most styles can be modified by changing the css.

:::demo `styleOption` has `barColor`, `showHorizontalGridLines`, `barsLabeling`, `timePointSize` and `showTimePoints` properties.

styleOption

:::

## Empty row

Rows will not fill the whole area if the number of rows is small. Pass the `getEmptyRows` to provide rows for gantt.

:::demo `getEmptyRows` need return rows data which just provide id.

emptyRow

:::

## Row Selection

Row selection is configured with the `rowSelection` gantt property.

:::demo `rowSelection` has `single`, `multiple` and `none` properties. Setting `rowSelection` to `none` will disable the row selection. You can use drag, `ctrl` or `shift` to multiselect rows when `rowSelection` is in multiple mode. Gantt also expose a `selectChange` event, let you know which rows have been selected.

rowSelection

:::

## Add or remove row

Add or remove the row data inside the gantt by updating the rows gantt property.

:::demo You should use `shallowRef` to define rows data that means you could't push or remove row data directly, you can shallow copy rows data, then redefine rows.

addorRemove

:::

## Update row

You can update the row data directly, then call `freshRowNodes` to fresh view.

:::demo You can create a cell editor component, provide it in `defaultCol` or `columns`. Here is a smaple component for cell edit, see [CellRender](https://github.com/xhxhxhxh/vue-gantt-3/blob/master/play/src/components/CellRender.vue)

updateRow

:::

## Time scale

You can use `shift` + `mouse wheel` to scale the time.

:::demo Set property `defaultPerHourSpacing` to define per hour's spacing, or you can set `defaultTimeScale` which value can be `day`, `week`, `month` ,`quarter` and `year`. `defaultTimeScale` has a higher priority than `defaultPerHourSpacing`.

timeScale

:::

## Stretch and move time line

Move the timeline to where you want it.

:::demo You can listen event `timeLineStretchChange` and `timeLineMoveChange` when time line change. Gantt will not update date in origial data directly, you should update date by yourself.

stretchAndMove

:::

::: tip
Gantt will combine time lines auto if two time lines date overlap.
:::

## Time points

Gantt support show time points in time line.

:::demo Set time point data in row's timeLine data. You can set `timePointComp` property by provide a custom component, then set timeLine's `useTimePointComp` to `true`, and provide any params you want in timeLine's `compParams`. You can listen event `timePointMoveFinished` when time point move.

timePoints

:::

## Tree data

Gantt support display tree structure data.

:::demo When `row` contains the `children` field, it is treated as nested data.

treeData

:::

::: info
If a row has children, its display date will depend on its children's date.
:::

