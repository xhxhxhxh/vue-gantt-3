import { TimeLine, RowData } from 'vue-gantt-3/types';

export interface Row extends RowData {
  id: string;
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  timeLines?: TimeLine[],
  isEmpty?: boolean,
  children?: Row[]
}

