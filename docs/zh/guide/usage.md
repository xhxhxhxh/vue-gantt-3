# 用法

用于显示时间线的图表。

## 引入
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

## 基础

基础用法。

:::demo 你需要先设置 `getRowId`、 `columns` 和 `rows` 属性, 不要忘记在css中设置父节点的 `height` 属性, 这样甘特图就可以正常显示了。

basic

:::

## 改变甘特图行高

如果你需要改变甘特图行高, 将 `rowHeight` 属性传递到组件中。

:::demo `rowHeight` 默认值是25。

changeHeight

:::

## 甘特图样式

你可以通过设置 `styleOption` 属性定义甘特图样式。多数样式可通过css进行修改。

:::demo `styleOption` 包含 `barColor` `showHorizontalGridLines`、`barsLabeling`、`timePointSize` 和 `showTimePoints` 等多个属性。

styleOption

:::

## 空行

如果行数很少，甘特图不会自动填充空白部分。通过 `getEmptyRows` 返回行数据可生成空白行。

:::demo `getEmptyRows` 返回的行数据只需提供行id即可。

emptyRow

:::

## 行选择

行选择通化 `rowSelection` 属性来配置.

:::demo `rowSelection` 包含 `single`、`multiple` 和 `none` 属性。设置 `rowSelection` 为 `none` 表示禁用行选择功能。 当`rowSelection` 是多选模式时，可以通过拖动、按住 `ctrl` 或 `shift` 来进行多选。甘特图还暴露了 `selectChange` 事件, 可以通过该事件获取到选择行。

rowSelection

:::

## 新增或删除行

甘特图中可通过改变行数据来新增或删除行。

:::demo 你应该使用 `shallowRef` 来定义行数据，这就意味着你不能直接在原数据上进行新增和删除操作。你可以通过浅拷贝的方式对行数据进行重新赋值。

addorRemove

:::

## 更新行

你可以直接改变行数据, 然后调用 `freshRowNodes` 方法来刷新视图显示。

:::demo 你可以创建一个单元格编辑组件, 传递给 `defaultCol` 或 `columns`。[CellRender](https://github.com/xhxhxhxh/vue-gantt-3/blob/master/play/src/components/CellRender.vue)是一个简单的行编辑组件。

updateRow

:::

## 时间缩放

你可以使用 `shift` + `mouse wheel` 的方式缩放时间轴。

:::demo 设置 `defaultPerHourSpacing` 可以定义每小时的轴长度, 或者可以设置 `defaultTimeScale` 来定义初始时间轴的尺，它的值可以为 `day`、`week`、`month`、`quarter` 和 `year`。 `defaultTimeScale` 的优先级比 `defaultPerHourSpacing` 高。

timeScale

:::

## 伸缩和移动时间线

可以对时间线进行伸缩和移动。

:::demo 你可以通过监听 `timeLineStretchChange` 和 `timeLineMoveChange` 来知道时间线变化。甘特图不会直接修改原始数据, 你必须自己来修改原时间数据。

stretchAndMove

:::

::: tip
如果两天时间线发生重叠，甘特图会自动将他们合并。
:::

## Time points

甘特图支持在时间线上显示时间点。

:::demo 在行数据中设置时间点属性。你可以通过 `timePointComp` 属性来提供一个自定义时间线组件, 然后设置时间线的 `useTimePointComp` 为 `true`, 将需要的参数放到时间线的 `compParams` 属性中。可以通过监听 `timePointMoveFinished` 事件来知道时间点的变化。

timePoints

:::

## 树数据

甘特图支持显示树形结构数据。

:::demo 当 `row` 中包含 `children` 字段时，被视为树形数据。

treeData

:::

::: info
如果行有子级, 它的时间线是根据子级的时间来显示的。
:::

## 自定义时间线

提供一个组件覆盖默认的时间线.

:::demo 通过 `timeLineRender` 设置时间线组件, 你也可以将需要的参数放入 `timeLineRenderParams` 中. [TimeLineRender](https://github.com/xhxhxhxh/vue-gantt-3/blob/master/play/src/components/TimeLineRender.vue) 是一个简单的时间线组件，用以显示实际完成时间.

customTimeLine

:::
