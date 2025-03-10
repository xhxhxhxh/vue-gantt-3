import { RowData } from 'vue3-gantt-chart/types';
import dayjs from 'dayjs';

type TimeSpanUnit = 'day' | 'month' | 'year'

export const getSingleRow = () => {
  return createRows(1, 1, 'day');
};

export const getMultiRows = () => {
  return createRows(12, 1, 'month');
};

export const getLargeNumRows = () => {
  return createRows(20, 10, 'month', true);
};

const createRows = (number: number, timeLineNum: number, timeSpanUnit: TimeSpanUnit, createChildren = false) => {
  const rowDatas: RowData[] = [];
  for (let i = 0; i < number; i++) {
    const newRow = createSingleRow(i + 1, timeLineNum, timeSpanUnit);
    if (createChildren) {
      newRow.children = [createSingleRow('firstChild' + i, timeLineNum, timeSpanUnit), createSingleRow('secondChild' + i, timeLineNum, timeSpanUnit)];
      newRow.children[0].children = [createSingleRow('thirdChild' + i, timeLineNum, timeSpanUnit)];
    }
    rowDatas.push(newRow);
  }
  return rowDatas;
};

const createSingleRow = (id: string | number, timeLineNum: number, timeSpanUnit: TimeSpanUnit): RowData => {
  const randomDay = getRandomTimeSpan('day');
  return {
    id: id.toString(),
    name: 'person' + id,
    displayStartDate: dayjs().format('YYYY-MM-DD'),
    displayEndDate: dayjs().add(randomDay, 'day').format('YYYY-MM-DD'),
    timeLines: createTimeLine(timeLineNum, timeSpanUnit),
  };
};

const createTimeLine = (num = 10, timeSpanUnit: TimeSpanUnit) => {
  const timeLines: any[] = [];
  let firstTimeSpan = getRandomTimeSpan(timeSpanUnit);
  for (let i = 1; i <= num; i++) {
    const startDate = dayjs().add(firstTimeSpan, timeSpanUnit).format('YYYY-MM-DD');
    const secondTimeSpan = firstTimeSpan + getRandomTimeSpan(timeSpanUnit);
    const endDate = dayjs().add(secondTimeSpan, timeSpanUnit).format('YYYY-MM-DD');
    firstTimeSpan += getRandomTimeSpan(timeSpanUnit);
    timeLines.push({
      startDate,
      endDate,
      timePoints: [],
      id: 'timeline' + i
    });
  }
  return timeLines;
};

const getRandomTimeSpan = (timeSpanUnit: 'day' | 'month' | 'year') => {
  if (timeSpanUnit === 'day') {
    return Math.ceil(Math.random() * 30);
  } else if (timeSpanUnit === 'month') {
    return Math.ceil(Math.random() * 12);
  } else if (timeSpanUnit === 'year') {
    return Math.ceil(Math.random() * 6);
  }
  return 0;
};

export const getEmptyRows = (emptyRowCount: number) => {
  const newEmptyRows: RowData[] = [];
  for (let i = 0; i < emptyRowCount; i++) {
    newEmptyRows.push({ id: 'empty-row-' + i });
  }
  return newEmptyRows;
};