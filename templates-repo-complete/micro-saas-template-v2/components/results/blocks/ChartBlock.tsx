'use client';
import type { ChartBlock as T } from '@/config/result.schema';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';

const COLORS = ['#000', '#666', '#999', '#bbb', '#444', '#888'];

export default function ChartBlock({ block }: { block: T }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold">{block.title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          {renderChart(block)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(block: T) {
  const { chartType, data, xKey, yKeys } = block;
  switch (chartType) {
    case 'bar':
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />)}
        </BarChart>
      );
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((k, i) => <Line key={k} dataKey={k} stroke={COLORS[i % COLORS.length]} />)}
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((k, i) => <Area key={k} dataKey={k} fill={COLORS[i % COLORS.length]} stroke={COLORS[i % COLORS.length]} />)}
        </AreaChart>
      );
    case 'pie':
      return (
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      );
  }
}
