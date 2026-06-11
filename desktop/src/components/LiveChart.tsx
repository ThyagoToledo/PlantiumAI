// Wrapper fino do ECharts para gráficos de linha em tempo real.
import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

export interface Series {
  name: string;
  color: string;
  data: [number, number][]; // [ts, valor]
}

interface Props {
  series: Series[];
  height?: number;
  unit?: string;
  zoom?: boolean;
}

export default function LiveChart({ series, height = 260, unit = "", zoom = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption({
      backgroundColor: "transparent",
      animation: false,
      grid: { left: 48, right: 16, top: 32, bottom: zoom ? 64 : 28 },
      legend: {
        textStyle: { color: "#9ca3af", fontSize: 11 },
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 4,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1c2128",
        borderColor: "#2d333b",
        textStyle: { color: "#e5e7eb", fontSize: 12 },
        valueFormatter: (v: number) => `${typeof v === "number" ? v.toFixed(1) : v}${unit}`,
      },
      xAxis: {
        type: "time",
        axisLine: { lineStyle: { color: "#2d333b" } },
        axisLabel: { color: "#6b7280", fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { color: "#6b7280", fontSize: 10, formatter: `{value}${unit}` },
        splitLine: { lineStyle: { color: "#21262d" } },
      },
      dataZoom: zoom
        ? [
            { type: "inside" },
            { type: "slider", height: 20, bottom: 8, borderColor: "#2d333b" },
          ]
        : [],
      series: series.map((s) => ({
        name: s.name,
        type: "line",
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: s.color },
        itemStyle: { color: s.color },
        areaStyle: { opacity: 0.06, color: s.color },
        data: s.data,
      })),
    });
  }, [series, unit, zoom]);

  return <div ref={ref} style={{ height }} />;
}
