import { GanttRowData, TimeLine } from 'vue3-gantt-chart/types';

export interface Row {
  id: string;
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  timeLines?: TimeLine[],
  isEmpty?: boolean,
  children?: Row[]
}

export type RowData = GanttRowData<Row>