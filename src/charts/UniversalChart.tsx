import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComputedWidgetData, formatValue } from '../lib/dataEngine/aggregator';
import { DashboardWidget } from '../lib/dataEngine/types';

interface UniversalChartProps {
  widget: DashboardWidget;
  data: ComputedWidgetData;
  theme?: 'light' | 'dark';
  onCrossFilter?: (field: string, value: any) => void;
  activeFilterValue?: any;
}

const PALETTES = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#F97316', // Orange
];

export const UniversalChart: React.FC<UniversalChartProps> = ({
  widget,
  data,
  theme = 'light',
  onCrossFilter,
  activeFilterValue,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, theme === 'dark' ? 'dark' : undefined, {
        renderer: 'canvas',
      });

      // Cross-filter click listener
      chartInstance.current.on('click', (params: any) => {
        if (onCrossFilter && widget.x) {
          const clickedValue = params.name || params.data?.[2] || params.value;
          if (clickedValue !== undefined && clickedValue !== 'Other') {
            onCrossFilter(widget.x, clickedValue);
          }
        }
      });
    }

    const chart = chartInstance.current;
    const isDark = theme === 'dark';
    const textColor = isDark ? '#E2E8F0' : '#475569';
    const gridLineColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const primaryColor = widget.style?.color || PALETTES[0];

    // Build ECharts option
    let option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 400,
      tooltip: {
        trigger: widget.type === 'pie' || widget.type === 'donut' ? 'item' : 'axis',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        textStyle: { color: isDark ? '#F8FAFC' : '#0F172A', fontSize: 12 },
        confine: true,
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '8%',
        top: widget.style?.legend ? '16%' : '8%',
        containLabel: true,
      },
    };

    // --- BAR / HORIZONTAL BAR / STACKED BAR / GROUPED BAR ---
    if (
      widget.type === 'bar' ||
      widget.type === 'bar_horizontal' ||
      widget.type === 'bar_stacked' ||
      widget.type === 'bar_grouped'
    ) {
      const isHorizontal = widget.type === 'bar_horizontal';
      const isStacked = widget.type === 'bar_stacked';

      const xAxisConfig = {
        type: isHorizontal ? ('value' as const) : ('category' as const),
        data: isHorizontal ? undefined : data.categories,
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          rotate: !isHorizontal && data.categories.length > 6 ? 25 : 0,
        },
        splitLine: isHorizontal ? { lineStyle: { color: gridLineColor } } : { show: false },
      };

      const yAxisConfig = {
        type: isHorizontal ? ('category' as const) : ('value' as const),
        data: isHorizontal ? data.categories : undefined,
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: isHorizontal ? undefined : (val: number) => formatValue(val),
        },
        splitLine: isHorizontal ? { show: false } : { lineStyle: { color: gridLineColor } },
      };

      option.xAxis = xAxisConfig as any;
      option.yAxis = yAxisConfig as any;

      option.series = data.series.map((s, idx) => ({
        name: s.name,
        type: 'bar',
        stack: isStacked ? 'total' : undefined,
        data: s.data.map((val, catIdx) => {
          const catName = data.categories[catIdx];
          const isSelected = activeFilterValue === catName;
          return {
            value: val,
            itemStyle: {
              color: isSelected
                ? '#F59E0B'
                : PALETTES[idx % PALETTES.length] || primaryColor,
              borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
            },
          };
        }),
      }));
    }

    // --- LINE / AREA ---
    else if (widget.type === 'line' || widget.type === 'area') {
      const isArea = widget.type === 'area';
      option.xAxis = {
        type: 'category',
        data: data.categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, fontSize: 11, rotate: data.categories.length > 8 ? 30 : 0 },
      };
      option.yAxis = {
        type: 'value',
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, fontSize: 11, formatter: (val: number) => formatValue(val) },
        splitLine: { lineStyle: { color: gridLineColor } },
      };

      option.series = data.series.map((s, idx) => {
        const color = PALETTES[idx % PALETTES.length];
        return {
          name: s.name,
          type: 'line',
          smooth: true,
          showSymbol: data.categories.length < 25,
          itemStyle: { color },
          lineStyle: { width: 2.5, color },
          areaStyle: isArea
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: `${color}66` },
                  { offset: 1, color: `${color}00` },
                ]),
              }
            : undefined,
          data: s.data,
        };
      });
    }

    // --- COMBO (BAR + LINE) ---
    else if (widget.type === 'combo') {
      option.xAxis = {
        type: 'category',
        data: data.categories,
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, fontSize: 11 },
      };
      option.yAxis = [
        {
          type: 'value',
          name: data.series[0]?.name || '',
          axisLabel: { color: textColor, formatter: (v: number) => formatValue(v) },
          splitLine: { lineStyle: { color: gridLineColor } },
        },
        {
          type: 'value',
          name: data.series[1]?.name || '',
          axisLabel: { color: textColor, formatter: (v: number) => formatValue(v) },
          splitLine: { show: false },
        },
      ];

      option.series = data.series.map((s, idx) => ({
        name: s.name,
        type: idx === 0 ? 'bar' : 'line',
        yAxisIndex: idx === 0 ? 0 : 1,
        itemStyle: {
          color: PALETTES[idx % PALETTES.length],
          borderRadius: idx === 0 ? [4, 4, 0, 0] : undefined,
        },
        data: s.data,
      }));
    }

    // --- PIE / DONUT ---
    else if (widget.type === 'pie' || widget.type === 'donut') {
      const isDonut = widget.type === 'donut';
      const pieData = data.categories.map((cat, idx) => ({
        name: cat,
        value: data.series[0]?.data[idx] ?? 0,
        itemStyle: {
          color: PALETTES[idx % PALETTES.length],
        },
      }));

      option.series = [
        {
          name: widget.title,
          type: 'pie',
          radius: isDonut ? ['42%', '72%'] : '68%',
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? '#1E293B' : '#FFFFFF',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 11,
            color: textColor,
          },
          data: pieData,
        },
      ];
    }

    // --- SCATTER / BUBBLE ---
    else if (widget.type === 'scatter' || widget.type === 'bubble') {
      const points = data.scatterPoints || [];
      option.xAxis = {
        type: 'value',
        name: widget.x,
        splitLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, formatter: (v: number) => formatValue(v) },
      };
      option.yAxis = {
        type: 'value',
        name: widget.y?.[0]?.field,
        splitLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, formatter: (v: number) => formatValue(v) },
      };

      option.series = [
        {
          type: 'scatter',
          symbolSize: (val: any) => Math.max(8, Math.min(35, (val[3] || 10) / 5)),
          itemStyle: {
            color: '#6366F1',
            opacity: 0.75,
            borderColor: '#4338CA',
            borderWidth: 1,
          },
          data: points.map((p) => [p[0], p[1], p[2], p[3]]),
          tooltip: {
            formatter: (param: any) => {
              const [x, y, label] = param.data;
              return `<strong>${label}</strong><br/>${widget.x}: ${formatValue(x)}<br/>${widget.y?.[0]?.field}: ${formatValue(y)}`;
            },
          },
        },
      ];
    }

    // --- HISTOGRAM ---
    else if (widget.type === 'histogram') {
      option.xAxis = {
        type: 'category',
        data: data.categories,
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, fontSize: 10, rotate: 20 },
      };
      option.yAxis = {
        type: 'value',
        name: 'Frequency',
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, fontSize: 11 },
        splitLine: { lineStyle: { color: gridLineColor } },
      };
      option.series = [
        {
          name: 'Frequency',
          type: 'bar',
          barWidth: '95%',
          itemStyle: { color: '#06B6D4', borderRadius: [3, 3, 0, 0] },
          data: data.series[0]?.data || [],
        },
      ];
    }

    // --- WATERFALL ---
    else if (widget.type === 'waterfall') {
      const waterfallData = data.waterfallData || [];
      const base: number[] = [];
      const delta: number[] = [];
      let currentBase = 0;

      waterfallData.forEach((d) => {
        if (d.isTotal) {
          base.push(0);
          delta.push(d.value);
        } else if (d.value >= 0) {
          base.push(currentBase);
          delta.push(d.value);
          currentBase += d.value;
        } else {
          currentBase += d.value;
          base.push(currentBase);
          delta.push(-d.value);
        }
      });

      option.xAxis = {
        type: 'category',
        data: waterfallData.map((d) => d.name),
        axisLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, fontSize: 11 },
      };
      option.yAxis = {
        type: 'value',
        axisLine: { lineStyle: { color: gridLineColor } },
        splitLine: { lineStyle: { color: gridLineColor } },
        axisLabel: { color: textColor, formatter: (v: number) => formatValue(v) },
      };

      option.series = [
        {
          name: 'Placeholder',
          type: 'bar',
          stack: 'all',
          itemStyle: { borderColor: 'transparent', color: 'transparent' },
          data: base,
        },
        {
          name: 'Value',
          type: 'bar',
          stack: 'all',
          itemStyle: {
            color: (params: any) => {
              const isTot = waterfallData[params.dataIndex]?.isTotal;
              const val = waterfallData[params.dataIndex]?.value;
              if (isTot) return '#3B82F6';
              return val >= 0 ? '#10B981' : '#EF4444';
            },
            borderRadius: [4, 4, 0, 0],
          },
          data: delta,
        },
      ];
    }

    // --- FUNNEL ---
    else if (widget.type === 'funnel') {
      const funnelItems = data.funnelData || [];
      option.series = [
        {
          name: widget.title,
          type: 'funnel',
          left: '10%',
          top: 30,
          bottom: 30,
          width: '80%',
          sort: 'descending',
          gap: 4,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}: {c}',
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          data: funnelItems.map((f, idx) => ({
            name: f.name,
            value: f.value,
            itemStyle: { color: PALETTES[idx % PALETTES.length] },
          })),
        },
      ];
    }

    chart.setOption(option, true);

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [widget, data, theme, activeFilterValue]);

  return <div ref={chartRef} className="w-full h-full min-h-[220px]" />;
};
