
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  athlete: AthleteResult;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ athlete }) => {
  // Skip the start checkpoint (distance 0)
  const checkpointData = athlete.checkpoints
    .filter(cp => cp.distance > 0)
    .map(cp => ({
      name: cp.name,
      distance: cp.distance,
      position: cp.position,
      relativeToAverage: cp.relativeToAverage,
    }));

  return (
    <Card className="bg-white shadow-md w-full">
      <CardHeader>
        <CardTitle className="text-lg">Race Progress</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={checkpointData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 25,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="distance" 
              label={{ value: 'Distance (km)', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left" 
              label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
              reversed
            />
            <YAxis 
              yAxisId="right"
              orientation="right" 
              label={{ value: 'Seconds vs Average', angle: -90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="position"
              stroke="#0053A5"
              activeDot={{ r: 8 }}
              name="Position"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="relativeToAverage"
              stroke="#F2BB30"
              name="Seconds vs Average"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
