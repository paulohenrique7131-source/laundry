'use client';

import React from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { BarChart, LineChart, PieChart, TreemapChart } from 'echarts/charts';
import type { EChartsOption } from 'echarts';
import { CanvasRenderer } from 'echarts/renderers';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';

echarts.use([
  BarChart,
  CanvasRenderer,
  GridComponent,
  LabelLayout,
  LegendComponent,
  LineChart,
  PieChart,
  TooltipComponent,
  TreemapChart,
  UniversalTransition,
]);

interface EChartRendererProps {
  option: EChartsOption;
}

export default function EChartRenderer({ option }: EChartRendererProps) {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={false}
      lazyUpdate={true}
      opts={{ renderer: 'canvas' }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
