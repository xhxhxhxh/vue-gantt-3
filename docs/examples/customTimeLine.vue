<template>
  <div class="vg-doc-gantt-container">
    <VueGantt3
      ref="vgGanttRef"
      :getRowId="getRowId"
      :columns="columns"
      :rows="rows"
      :timeLineRender="TimeLineRender"
      :timeLineRenderParams="timeLineRenderParams"
      @time-line-move-change="onTimeLineMoveChange"
    ></VueGantt3>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, defineComponent, watch, h } from 'vue';
import { ColDef, RowData, TimeLine as GanttTimeLine, VisibleTimeLine, GanttRowNode, MovedTimeLineData } from 'vue-gantt-3/types';
import dayjs, { Dayjs } from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import VueGantt3Instance from 'vue-gantt-3';

dayjs.extend(minMax);

const vgGanttRef = ref<InstanceType<typeof VueGantt3Instance> | undefined>();

export interface TimeLine extends GanttTimeLine {
  actualDate?: string
}

export interface Row extends RowData {
  id: string;
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  timeLines?: TimeLine[],
  children?: Row[]
}

const TimeLineRender = defineComponent(
  (props: { params, visibleTimeLine: VisibleTimeLine, rowNode: GanttRowNode<Row>, timeLineWidth: number }) => {
    const barWidth = ref(0);

    const onMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
      const startClientX = e.clientX;
      const startOffsetX = e.offsetX;
      handleMouseEvent(startOffsetX)

      const onMouseMove = (e: MouseEvent) => {
        handleMouseEvent(startOffsetX + e.clientX - startClientX)
      
      }
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }



    const handleMouseEvent = (offsetX: number) => {
      const { width, timeLineNode } = props.visibleTimeLine;
      const timeLineRenderParams = props.params;
      const rowNode = props.rowNode;
      barWidth.value = Math.min(offsetX, width);
      const diffSeconds = timeLineNode.endDate.diff(timeLineNode.startDate, 'second', true);
      const addedSeconds = barWidth.value / width * diffSeconds;
      const currentDate = timeLineNode.startDate.add(addedSeconds, 'second');

      const dateObj: Record<string, Dayjs> = {};
      if (timeLineNode.isMerge) {
        const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes || [];
        mergedTimeLineNodes.forEach((node) => {
          const timeLineData = node.data as TimeLine;
          if (timeLineData) {
            const actualDate = timeLineData.actualDate ? dayjs(timeLineData.actualDate) : null;
            if (!currentDate.isSame(actualDate)) {
              if (currentDate.isAfter(node.endDate)) {
                dateObj[node.id] = node.endDate;
              } else if (currentDate.isBefore(node.startDate)) {
                dateObj[node.id] = node.startDate;
              } else {
                dateObj[node.id] = currentDate;
              }
            }
          }
        });
      } else {
        dateObj[timeLineNode.id] = currentDate;
      }
      timeLineRenderParams?.onActualDateChange && timeLineRenderParams.onActualDateChange(rowNode.data, dateObj);

    }

    watch([() => props.timeLineWidth, () => props.visibleTimeLine.timeLineNode.mergedTimeLineNodes?.length], () => {
      const { width, timeLineNode } = props.visibleTimeLine;
      const { startDate, endDate, isMerge, data: timeLineData } = timeLineNode;
      let maxActualDate: Dayjs | null = null;
      if (isMerge) {
        const mergedTimeLineNodes = timeLineNode.mergedTimeLineNodes || [];
        const actualDateArr: Dayjs[] = [];
        mergedTimeLineNodes.forEach((node) => {
          const timeLineData = node.data as TimeLine;
          if (timeLineData) {
            const actualDate = timeLineData.actualDate ? dayjs(timeLineData.actualDate) : null;
            if (actualDate) {
              actualDateArr.push(actualDate);
            }
          }
        });
        maxActualDate = dayjs.max(actualDateArr);
      } else {
        const actualDate = (timeLineData as TimeLine ).actualDate
        maxActualDate = actualDate ? dayjs(actualDate) : null;
      }

      if (maxActualDate) {
        const diffSeconds = endDate.diff(startDate, 'second', true);
        const addedSeconds = maxActualDate.diff(startDate, 'second', true);
        const offsetX = (addedSeconds / diffSeconds) * width;
        barWidth.value = Math.min(offsetX, width);
      }
    }, { immediate: true });
    
    return () => {
      return h('div', { class: 'vg-time-line-render' }, [
        h('div', { onMousedown: onMouseDown, class: 'vg-time-line-process' }, [
          h('div', { class: 'vg-time-line-process-bar', style: { width: `${barWidth.value}px` } }),
        ])
      ]);
    };
  },
  {
    props: ['params', 'visibleTimeLine', 'rowNode', 'timeLineWidth'],
  }
);

const getRowId = (rowData: Row) => rowData.id;
const columns = ref<ColDef[]>([
  {
    field: 'name',
    headerName: 'name',
    cellRendererParams: { expandable: true },
  },
  {
    field: 'displayStartDate',
    headerName: 'start date',
  },
  {
    field: 'displayEndDate',
    headerName: 'end date',
  },
  {
    field: 'blank',
    headerName: '',
    cellStyle: { borderRight: 0 }
  }
]);

// For a large amount of data, shallowRef should be used here,
// which can greatly improve the performance of initial Gantt
const rows = shallowRef<Row[]>([
  {
    id: '1',
    name: 'person 01',
    displayStartDate: '2025-01-01',
    displayEndDate: '2025-05-01',
    timeLines: [{
      id: '1',
      startDate: '2025-01-01',
      endDate: '2025-05-01'
    }],
    children: [
      {
        id: 'child-1-1',
        name: 'child-1-1',
        displayStartDate: '2025-02-01',
        displayEndDate: '2025-03-01',
        timeLines: [
          {
            id: '1',
            startDate: '2025-02-01',
            endDate: '2025-02-28',
            actualDate: '2025-02-15'
          },
          {
            id: '2',
            startDate: '2025-03-10',
            endDate: '2025-04-25'
          }
        ],
      }
    ]
  },
  {
    id: '2',
    name: 'person 02',
    displayStartDate: '2025-03-01',
    displayEndDate: '2025-08-01',
    timeLines: [{
      id: '2',
      startDate: '2025-03-01',
      endDate: '2025-08-01'
    }],
    children: [
      {
        id: 'child-2-1',
        name: 'child-2-1',
        displayStartDate: '2025-03-01',
        displayEndDate: '2025-06-01',
        timeLines: [
          {
            id: '1',
            startDate: '2025-03-05',
            endDate: '2025-04-10',
            actualDate: '2025-03-15'
          },
          {
            id: '2',
            startDate: '2025-04-20',
            endDate: '2025-05-25'
          }
        ],
      }
    ]
  },
  {
    id: '3',
    name: 'person 03',
    displayStartDate: '2025-05-01',
    displayEndDate: '2025-12-01',
    timeLines: [{
      id: '3',
      startDate: '2025-05-01',
      endDate: '2025-12-01'
    }],
    children: [
      {
        id: 'child-3-1',
        name: 'child-3-1',
        displayStartDate: '2025-05-20',
        displayEndDate: '2025-09-01',
        timeLines: [
          {
            id: '1',
            startDate: '2025-06-05',
            endDate: '2025-07-10',
            actualDate: '2025-07-01'
          },
          {
            id: '2',
            startDate: '2025-08-01',
            endDate: '2025-10-25'
          }
        ],
      }
    ]
  }
]);

const onActualDateChange = (row: Row, dateObj: Record<string, Dayjs>) => {
  row.timeLines?.forEach((timeLine) => {
    if (timeLine.id in dateObj) {
      timeLine.actualDate = dateObj[timeLine.id].format('YYYY-MM-DD HH:mm:ss');
    }
  })
}

const timeLineRenderParams = { onActualDateChange }

const onTimeLineMoveChange = (rowId: string, timeLineIds: string[], movedTimeData: MovedTimeLineData[]) => {
  if (!vgGanttRef.value) return;
  const currentRow = vgGanttRef.value.getRowNode(rowId).data as Row;
  if (currentRow) {
    const timeLines = currentRow.timeLines || [];
    const movedTimeDataMap = new Map<string, MovedTimeLineData>();
    movedTimeData.forEach((item) => {
      movedTimeDataMap.set(item.timeLineId, item);
    });
    timeLines.forEach((timeLine) => {
      if (movedTimeDataMap.has(timeLine.id)) {
        const newTimeData = movedTimeDataMap.get(timeLine.id)!;
        const diffSeconds = newTimeData.startDate.diff(timeLine.startDate, 'second', true);
        
        timeLine.startDate = newTimeData.startDate.format('YYYY-MM-DD');
        timeLine.endDate = newTimeData.endDate.format('YYYY-MM-DD');

        if (timeLine.actualDate) {
          timeLine.actualDate = dayjs(timeLine.actualDate).add(diffSeconds, 'second').format('YYYY-MM-DD HH:mm:ss');
        }
      }
    });
    vgGanttRef.value && vgGanttRef.value.refreshCells([rowId], true);
  }
};

</script>
<style lang="scss">
.vg-doc-gantt-container {
  height: 300px;
  .vg-time-line-render {
    height: 16px;
    border-radius: 6px;
    border: 1px solid #000;
    background: #fff;
    position: relative;
    .vg-time-line-process {
      height: 4px;
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 100%;
      cursor: col-resize;
      .vg-time-line-process-bar {
        background-color: orange;
        height: 100%;
      }
    }
  }
}
</style>
