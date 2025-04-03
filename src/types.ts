import dayjs from 'dayjs';
import type { ILoadingCellRendererParams, LoadingCellRendererSelectorResult, ColDef as AgColDef } from "ag-grid-community";
export type { ValueSetterParams } from "ag-grid-community";

export type ColDef = Omit<AgColDef, 'pivotValueColumn' | 'columnsMenuParams'>
export interface TimeLineStyle {
  [cssProperty: string]: string | number;
}

export interface TimePoint {
  date: string,
  id: string,
  icon?: string,
  useTimePointComp?: boolean,
  compParams?: any,
}

export interface TimePointNode<T extends TimePoint = TimePoint> {
  translateX: number,
  date: dayjs.Dayjs,
  id: string,
  data: T,
  icon?: string,
  useTimePointComp?: boolean,
  compParams?: any,
}

export interface TimeLine {
  startDate: string,
  endDate: string,
  id: string,
  icon?: string,
  label?: string,
  timePoints?: TimePoint[],
  styleOption?: TimeLineStyle,
  disableStretch?: boolean,
  disableMove?: boolean,
}

export interface TimeLineNode {
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  id: string,
  isMerge?: boolean,
  mergedTimeLineNodes?: TimeLineNode[],
  timePointNodes?: TimePointNode[],
  styleOption?: TimeLineStyle,
  isSameDate?: boolean,
  hasChildren?: boolean,
  icon?: string,
  label?: string,
  disableStretch?: boolean,
  disableMove?: boolean,
}

export interface RowData {
  timeLines?: TimeLine[],
  isEmpty?: boolean,
  children?: RowData[],
}

export interface GanttRowNode<T extends RowData = RowData> {
  id: string,
  level: number,
  data: T,
  startDate: dayjs.Dayjs | null,
  endDate: dayjs.Dayjs | null,
  oldStartDate?: dayjs.Dayjs | null,
  oldEndDate?: dayjs.Dayjs | null,
  hasChildren: boolean,
  expand: boolean,
  setExpand: (id: string, expand: boolean) => void,
  setSelect: (id: string) => void,
  parentId?: string,
  hide?: boolean,
  readOnly?: boolean,
  children?: GanttRowNode<T>[],
  timeLineNodes?: TimeLineNode[],
}

export interface VisibleRow {
  id: string,
  rowNode: GanttRowNode,
  translateY: number,
}

export interface VisibleTimeLine {
  id: string,
  translateX: number,
  width: number,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  timeLineNode: TimeLineNode,
  moving?: boolean,
  icon?: string,
  label?: string,
  styleOption?: TimeLineStyle,
  timePointNodes?: TimePointNode[],
  type: 'parentTimeLineNode' | 'sameDateTimeLineNode' | 'normal',
  disableStretch?: boolean,
  disableMove?: boolean,
}

export interface ColumnNode extends ColDef {
  cellRendererSelector?: (params: ILoadingCellRendererParams<RowData>) => LoadingCellRendererSelectorResult | undefined,
}

export interface FirstColumnCellRenderParams {
  component?: any,
  rowNode?: GanttRowNode,
  [key: string]: any
}

export type DefaultColDef = Omit<ColDef, 'field'>

export interface VerticalLine {
  id: number,
  left: number
}

export interface GanttBodyStartInfo{
  startLeft: number;
  startMonthDate: dayjs.Dayjs;
}

export type GanttHeaderUnit = 'hour' | 'day' | 'month' | 'year' | "week" | "quarter"

declare module 'dayjs' {
  interface Dayjs {
    add(value: number, unit: GanttHeaderUnit): dayjs.Dayjs,
    subtract(value: number, unit: GanttHeaderUnit):dayjs.Dayjs
  }
}

export interface BlockItem{
  left: number,
  width: number,
  text: number | string,
  key: number,
  tip: string,
  hideRightBorder?: boolean,
}

export interface GanttStyleOption {
  barColor?: string,
  showHorizontalGridLines?: boolean,
  barsLabeling?: 'none' | 'insideBarWithIcon' | 'insideBarWithoutIcon' | 'beforeTheBar' | 'afterTheBar',
  timePointSize?: number,
  showTimePoints?: boolean,
  disableStretch?: boolean,
  disableMove?: boolean,
}

export interface MovedTimeLineData {
  timeLineId: string,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
}

export type TimeScale = 'day' | 'week' | 'month' | 'quarter'| 'year'

// GlobalComponents for Volar
declare module 'vue' {
  export interface GlobalComponents {
    VueGantt3: typeof import('./Gantt.vue')['default']
  }
}