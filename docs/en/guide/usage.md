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



