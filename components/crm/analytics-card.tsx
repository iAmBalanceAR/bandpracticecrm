import * as React from "react";
import CustomCard from '@/components/common/CustomCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

// Add this interface before the generateData function
interface DataPoint {
  week: string;
  Meals: number;
  Fuel: number;
  Accommodations: number;
  OtherExpenses: number;
  TotalExpenses: number;
  TotalOutbound: number;
  GigPayments: number;
  Profit: number;
}

const generateData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  for (let i = 1; i <= 26; i++) {
    const meals = Math.floor(Math.random() * (400 - 250 + 1) + 250);
    const fuel = Math.floor(Math.random() * (500 - 350 + 1) + 350);
    const accommodations = Math.floor(Math.random() * (600 - 450 + 1) + 450);
    const otherExpenses = Math.floor(Math.random() * (300 - 150 + 1) + 150);
    const totalExpenses = meals + fuel + accommodations + otherExpenses;
    const gigPayments = Math.floor(Math.random() * (2200 - 1800 + 1) + 1800);
    const profit = gigPayments - totalExpenses;

    data.push({
      week: `Week ${i}`,
      Meals: meals,
      Fuel: fuel,
      Accommodations: accommodations,
      OtherExpenses: otherExpenses,
      TotalExpenses: totalExpenses,
      TotalOutbound: totalExpenses,
      GigPayments: gigPayments,
      Profit: profit
    });
  }
  return data;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const totalOutbound = payload.find((p) => p.dataKey === 'TotalOutbound')?.value ?? 0;
    const gigPayments = payload.find((p) => p.dataKey === 'GigPayments')?.value ?? 0;
    const profit = gigPayments - totalOutbound;

    return (
      <div className="bg-white text-black p-4 border border-gray-300 rounded-md shadow-lg w-[250px]">
        <h3 className="text-lg font-semibold mb-2">{label}</h3>
        <table className="text-sm">
          <tbody>
            {payload.map((entry) => (
              <tr key={entry.dataKey}>
                <td className="pr-2">{entry.dataKey}:</td>
                <td className="text-right">${entry.value.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-300 font-semibold">
              <td className="pr-2 pt-2">Profit:</td>
              <td className="text-right pt-2" style={{ color: profit >= 0 ? 'green' : 'red' }}>
                ${profit.toFixed(2)} ({((profit / gigPayments) * 100).toFixed(2)}%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

const data = generateData();

export default function AnalyticsCard({ analyticsData, chartConfig, getTotalAndAverage }: any) {
  return (
    <CustomCard title="Analytics / Tracking" cardColor="[#008ffb]">
      <ChartContainer config={chartConfig}>
        <div className="h-[430px] p-0 m-0 w-fill">
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: -0,
                left: -30,
                bottom: 15,
              }}
            >
              <XAxis dataKey="week" stroke="grey" />
              <YAxis stroke="gray" />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{
                  visibility: 'visible',
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  zIndex: 100,
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="Meals" stroke="hsl(var(--chart-1))" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="Fuel" stroke="hsl(var(--chart-2))" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="Accommodations" stroke="#4ade80" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="OtherExpenses" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="TotalExpenses" stroke="hsl(var(--chart-6))" strokeWidth={3} dot={false} />
              <Line
                type="monotone"
                dataKey="TotalOutbound"
                stroke="#FF69B4"
                strokeWidth={3}
                dot={false}
                name="Total Outbound"
              />
              <Line type="monotone" dataKey="GigPayments" stroke="hsl(var(--chart-5))" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </CustomCard>
  );
}