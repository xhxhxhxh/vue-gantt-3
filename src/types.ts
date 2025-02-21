import dayjs from 'dayjs';
import type { ILoadingCellRendererParams, LoadingCellRendererSelectorResult } from "ag-grid-community";

interface CellStyle {
  [cssProperty: string]: string | number;
}

export interface TimeLineStyle {
  [cssProperty: string]: string | number;
}

export interface TimePoint {
  date: string,
  id: string,
  icon?: string,
  useTimePointComp?: boolean,
  compParams?: any,
  [propName: string]: any,
}

export interface TimePointNode {
  translateX: number,
  date: dayjs.Dayjs,
  id: string,
  data: TimePoint,
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
  styleOption?: TimeLineStyle
}

export interface TimeLineNode {
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  id: string,
  timePointNodes?: TimePointNode[],
  styleOption?: TimeLineStyle,
  isSameDate?: boolean,
  hasChildren?: boolean,
  icon?: string,
  label?: string,
}

export interface RowData {
  [propName: string]: any,
  timeLines?: TimeLine[],
  children?: RowData[],
  isEmpty?: boolean
}

export interface GanttRowNode {
  id: string,
  level: number,
  data: RowData,
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
  children?: GanttRowNode[],
  timeLineNodes?: TimeLineNode[],
}

export interface MGanttRowNode<TData extends RowData> extends GanttRowNode {
  data: TData
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
  icon?: string,
  label?: string,
  styleOption?: TimeLineStyle,
  timePointNodes?: TimePointNode[],
  type: 'parentTimeLineNode' | 'sameDateTimeLineNode' | 'normal'
}

export interface ColumnData {
  headerName?: string,
  field: string,
  width?: number,
  flex?: number,
  resizable?: boolean,
  cellStyle?: CellStyle,
  cellRenderer?: any,
  cellRendererParams?: Record<string, any>,
  suppressMovable?: boolean,
}

export interface ColumnNode extends ColumnData {
  cellRendererSelector?: (params: ILoadingCellRendererParams<RowData>) => LoadingCellRendererSelectorResult | undefined,
}

export interface FirstColumnCellRenderParams {
  component?: any,
  rowNode?: GanttRowNode,
  [key: string]: any
}

export type DefaultCol = Omit<ColumnData, 'field'>

export interface VerticalLine {
  id: number,
  left: number
}

export interface GanttBodyStartInfo{
  startLeft: number;
  startMonthDate: dayjs.Dayjs;
}

export type GanttHeaderUnit = | 'hour' | 'day' | 'month' | 'year' | "week" | "quarter"

declare module 'dayjs' {
  interface Dayjs {
    add(value: number, unit: GanttHeaderUnit): Dayjs,
    subtract(value: number, unit: GanttHeaderUnit): Dayjs
  }
}

export interface BlockItem{
  left: number,
  width: number,
  text: number | string,
  key: number,
  tip: string
}

export interface MGanttStyleOption {
  barColor?: string,
  showHorizontalGridLines?: boolean,
  barsLabeling?: 'none' | 'insideBarWithIcon' | 'insideBarWithoutIcon' | 'beforeTheBar' | 'afterTheBar',
  timePointSize?: number,
  showTimePoints?: boolean
}
