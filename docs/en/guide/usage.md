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

:::demo `styleOption` has `barColor`, `showHorizontalGridLines`, `barsLabeling`, `timePointSize` and `showTimePoints` five properties.

styleOption

:::

## Empty row

Rows will not fill the whole area if the number of rows is small. Pass the `getEmptyRows` to provide rows for gantt.

:::demo `getEmptyRows` need return rows data which just provide id.

emptyRow

:::

## Row Selection

Row selection is configured with the `rowSelection` gantt property.

:::demo `rowSelection` has `single`, `multiple` and `none` three properties. Setting `rowSelection` to `none` will disable the row selection. You can use drag, `ctrl` or `shift` to multiselect rows when `rowSelection` is in multiple mode. Gantt also expose a `selectChange` event, let you know which rows have been selected.

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


