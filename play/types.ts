import { GanttRowData, TimeLine } from 'vue-gantt-3/types';

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