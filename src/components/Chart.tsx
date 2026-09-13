import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';

interface ChartProps {
  data: { t: number; price: number }[];
  positive: boolean;
}

export default function Chart({ data, positive }: ChartProps) {
  const stroke = positive ? '#35d07f' : '#f2545b';
  const gradientId = positive ? 'trendPositive' : 'trendNegative';

  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip
            contentStyle={{
              background: '#111828',
              border: '1px solid #1f2a3d',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            labelFormatter={() => ''}
            formatter={((value: unknown) => [`$${Number(value ?? 0).toFixed(2)}`, 'Price']) as never}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={stroke}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
