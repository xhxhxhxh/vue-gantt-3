# API

## 属性

| Name | Description  | Type | Default |
| :-------------: | :-----------: | :----: | :----: |
| getRowId | 返回行id | `() => string` | — |
| rows | 行数据 | `RowData[]` | — |
| columns | 表格部分的列数据, 可查阅[ag-grid](https://www.ag-grid.com/archive/30.0.6/vue-data-grid/) v30.0.6 | `ColDef[]` | — |
| defaultCol | 默认列数据 | `DefaultColDef` | — |
| rowHeight | 每行的高度 | `number` | 25 |
| headerHeight | 甘特图头部高度 | `number` | 25 |
| rowBuffer | 渲染区域之外的行缓存数 | `number` | 5 |
| rowSelection | 行选择 | `single / multiple / none` | multiple |
| defaultTableViewWidth | 表格默认宽度 | `number` | 350 | 
| maxTableViewWidth | 表格最大宽度 | `number` | 1000 |
| defaultPerHourSpacing | 每小时的显示间距 | `number` | 0.1 |
| defaultTimeScale | 默认的时间轴单位 | `day / week / month / quarter/ year` | — |
| styleOption | 甘特图全局样式 | `GanttStyleOption` | — |
| defaultShowFirstLevel | 默认是否显示第一级头部 | `boolean` | true |
| locale | 国际化 | `en / zh-cn` | browser's language |
| timePointComp | 时间点组件 | `Comp` | — |
| getEmptyRows | 返回空白行 | `(count: number) => RowData[]` | — |
| timeLineRender | 自定义时间线组件 | `Comp` | — |
| timeLineRenderParams | 自定义时间线组件参数 | `Record<string, any>` | — |

## 事件

| Name | Description  | Type |
| :-------------: | :-----------: | :----: |
| select-change | 当用户点击行时触发 | `(selectedIds: string[]) => void` |
| expand-change | 当行的展开状态变化时触发 | `(unExpandRowIds: string[]) => void` |
| row-context-menu | 当用户右键点击行时触发 | `(e: MouseEvent, rowId?: string \| null) => void` |
| cell-double-clicked | 当用户双击行时触发 | `(rowData: RowData \| undefined, columnData?: ColDef) => void` |
| gantt-mouse-down | 当用户按下鼠标时触发 | `(e: MouseEvent, rowId?: string \| null) => void` |
| time-point-move-finished | 当时间点移动后触发 | `(timePoint: TimePoint, date: dayjs.Dayjs) => void` |
| per-hour-spacing-change | 当时间轴变化时触发 | `(perHourSpacing: number) => void` |
| time-point-context-menu | 当用户右键点击时间点时触发 | `(e: MouseEvent, timePoints: TimePoint[], rowData?: RowData) => void` |
| time-line-stretch-change | 当时间线被拉伸时触发 | `(rowId: string, timeLineIds: string[], startDate: dayjs.Dayjs \| null, endDate: dayjs.Dayjs \| null) => void` |
| time-line-move-change | 当时间线被移动时触发 | `(rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]) => void` |
| view-port-changed | 当渲染区域的行发生变化时触发 | `(data: RowData[]) => void \| Promise<void>` |

## Exposes

| Method | Description  | Type |
| :-------------: | :-----------: | :----: |
| getRowNode | 根据行id获取行节点 | `(id: string) => GanttRowNode<RowData> \| undefined` |
| getRowNodeChildren | 获取行的子节点 | `(parentId?: string) => GanttRowNode<RowData>[]` |
| getRowDataList | 以平摊数组的形式返回行原始数据 | `() => RowData[]` |
| freshRowNodes | 当行数据更新时刷新显示 | `(rows: RowData[]) => void` |
| refreshCells | 刷新单元格显示 | ` (ids: string[], force?: boolean) => void` |
| getDisplayRows | 获取渲染区域的行数据 | `() => RowData[] \| null` |
| expandAll | 展开所有行 | `() => void` |
| freshTimeLines | 刷新时间线显示(当时间点变化时) | `(rowIds: string[]) => void` |
| selectRows | 根据id选择指定行 | `(ids: string[]) => void` |
