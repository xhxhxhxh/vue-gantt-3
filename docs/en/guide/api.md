# API

## Attributes

| Name | Description  | Type | Default |
| :-------------: | :-----------: | :----: | :----: |
| getRowId | return row's id | `() => string` | — |
| rows | row data | `RowData[]` | — |
| columns | table columns, refer to [ag-grid](https://www.ag-grid.com/archive/30.0.6/vue-data-grid/) v30.0.6 | `ColDef[]` | — |
| defaultCol | a default column definition. Items defined in the actual column definitions get precedence. | `DefaultColDef` | — |
| rowHeight | every row's height | `number` | 25 |
| headerHeight | table and gantt view header height | `number` | 25 |
| rowBuffer | the number of rows rendered outside the viewable area the gantt renders | `number` | 5 |
| rowSelection | row selection | `single / multiple / none` | multiple |
| defaultTableViewWidth | table view width | `number` | 350 | 
| maxTableViewWidth | max table view width | `number` | 1000 |
| defaultPerHourSpacing | per hour spacing | `number` | 0.1 |
| defaultTimeScale | time scale | `day / week / month / quarter/ year` | — |
| styleOption | gantt global style option | `GanttStyleOption` | — |
| defaultShowFirstLevel | show gantt first level header | `boolean` | true |
| locale | internationalization | `en / zh-cn` | browser's language |
| timePointComp | time point component | `Comp` | — |
| getEmptyRows | return rows data | `(count: number) => RowData[]` | — |
| timeLineRender | custom time line component | `Comp` | — |
| timeLineRenderParams | time line component params | `Record<string, any>` | — |

## Events

| Name | Description  | Type |
| :-------------: | :-----------: | :----: |
| select-change | triggers when user clicks the row | `(selectedIds: string[]) => void` |
| expand-change | triggers when user expands or collapses a row | `(unExpandRowIds: string[]) => void` |
| row-context-menu | triggers when user right clicks the row | `(e: MouseEvent, rowId?: string \| null) => void` |
| cell-double-clicked | triggers when user double clicks the row | `(rowData: RowData \| undefined, columnData?: ColDef) => void` |
| gantt-mouse-down | triggers when user mouse down the row | `(e: MouseEvent, rowId?: string \| null) => void` |
| time-point-move-finished | triggers after a time point has moved | `(timePoint: TimePoint, date: dayjs.Dayjs) => void` |
| per-hour-spacing-change | triggers when time has scaled | `(perHourSpacing: number) => void` |
| time-point-context-menu | triggers when right click a time point | `(e: MouseEvent, timePoints: TimePoint[], rowData?: RowData) => void` |
| time-line-stretch-change | triggers after a time line has stretched | `(rowId: string, timeLineIds: string[], startDate: dayjs.Dayjs \| null, endDate: dayjs.Dayjs \| null) => void` |
| time-line-move-change | triggers after a time line has moved | `(rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]) => void` |
| view-port-changed | which rows are rendered in the DOM has changed | `(data: RowData[]) => void \| Promise<void>` |

## Exposes

| Method | Description  | Type |
| :-------------: | :-----------: | :----: |
| getRowNode | get row node by id | `(id: string) => GanttRowNode<RowData> \| undefined` |
| getRowNodeChildren | get row's children row nodes | `(parentId?: string) => GanttRowNode<RowData>[]` |
| getRowDataList | get rows original data | `() => RowData[]` |
| freshRowNodes | refresh rows which have been updated | `(rows: RowData[]) => void` |
| refreshCells | refresh row's cell | ` (ids: string[], force?: boolean) => void` |
| getDisplayRows | get rows which rendered in the DOM | `() => RowData[] \| null` |
| expandAll | expand all rows | `() => void` |
| freshTimeLines | refresh time lines when time points have been updated | `(rowIds: string[]) => void` |
| selectRows | select rows by id | `(ids: string[]) => void` |
