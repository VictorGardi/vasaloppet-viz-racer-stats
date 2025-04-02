import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FilterOptions } from './FilterPanel';

interface ProgressChartProps {
  athlete: AthleteResult;
  comparisonAthletes?: AthleteResult[];
  filters?: FilterOptions;
  isLoading?: boolean;
}

// Custom tooltip component to show checkpoint name
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const checkpoint = payload[0].payload;
    
    // Don't show tooltip for the synthetic start point
    if (checkpoint.synthetic) {
      return null;
    }
    
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
        <p className="font-bold text-sm text-gray-700">{checkpoint.name} ({checkpoint.distance} km)</p>
        <p className="text-xs text-vasablue-dark">Position: #{checkpoint.position}</p>
        <p className="text-xs text-vasagold-dark">
          Time vs Avg: {checkpoint.relativeToAverage < 0 ? 
            `${Math.abs(checkpoint.relativeToAverage)}s faster` : 
            checkpoint.relativeToAverage > 0 ?
            `${checkpoint.relativeToAverage}s slower` :
            'on pace'
          }
        </p>
      </div>
    );
  }

  return null;
};

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  athlete, 
  comparisonAthletes = [], 
  filters = {
    gender: 'all',
    startGroups: [],
    ageGroups: [],
    finishersOnly: true,
    compareMode: 'all'
  },
  isLoading = false
}) => {
  // Check if this is a DNF athlete
  const isFinished = athlete.checkpoints.some(cp => cp.name === "Finish");
  
  // Skip the start checkpoint (distance 0) and sort by distance
  const checkpointData = athlete.checkpoints
    .filter(cp => cp.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .map(cp => ({
      name: cp.name,
      distance: cp.distance,
      position: cp.position,
      relativeToAverage: cp.relativeToAverage,
      // Create a formatted label with checkpoint name and distance
      label: `${cp.name.substring(0, 8)}${cp.name.length > 8 ? '...' : ''} (${cp.distance}km)`,
      synthetic: false
    }));

  // If loading or we don't have enough data points, show a message
  if (isLoading) {
    return (
      <Card className="bg-white shadow-md w-full">
        <CardHeader>
          <CardTitle className="text-lg">Race Progress</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading progress data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checkpointData.length < 2) {
    return (
      <Card className="bg-white shadow-md w-full">
        <CardHeader>
          <CardTitle className="text-lg">Race Progress</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Not enough checkpoint data to display a progress chart.</p>
            <p className="text-sm text-gray-500 mt-2">This athlete only has data for {checkpointData.length} checkpoint(s).</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Add a synthetic starting point at distance 0 to ensure chart starts at 0
  const firstCheckpoint = checkpointData[0];
  const startPoint = {
    name: "Start",
    distance: 0,
    position: firstCheckpoint.position, // Use first checkpoint position
    relativeToAverage: 0, // At start, time difference is 0
    label: "Start (0km)",
    synthetic: true // Mark as synthetic to handle specially
  };
  
  // Add the start point at the beginning
  const enhancedData = [startPoint, ...checkpointData];

  // Find min and max for better domain configuration
  const positionMin = Math.min(...checkpointData.map(cp => cp.position));
  const positionMax = Math.max(...checkpointData.map(cp => cp.position));
  
  // Add padding to position domain
  const positionPadding = Math.max(5, Math.round(positionMax * 0.1));
  const positionDomain = [
    Math.max(1, positionMin - positionPadding), 
    positionMax + positionPadding
  ];

  // For relativeToAverage, we want to find the min/max but ensure 0 is always in the domain
  const relativeMin = Math.min(0, ...checkpointData.map(cp => cp.relativeToAverage));
  const relativeMax = Math.max(0, ...checkpointData.map(cp => cp.relativeToAverage));
  
  // Create a balanced domain for relative times
  const relativePadding = Math.max(10, Math.round(Math.max(Math.abs(relativeMin), relativeMax) * 0.1));
  const relativeDomain = [
    Math.floor(relativeMin - relativePadding), 
    Math.ceil(relativeMax + relativePadding)
  ];

  // Create filter description for the title
  let filterDescription = '';
  if (filters) {
    if (filters.gender !== 'all') {
      filterDescription += ` (${filters.gender === 'M' ? 'Men' : 'Women'})`;
    }
    if (filters.startGroups.length > 0) {
      filterDescription += ` in ${filters.startGroups.join(', ')}`;
    }
  }

  return (
    <Card className="bg-white shadow-md w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          Race Progress{filterDescription} {!isFinished && <span className="text-red-500 text-sm ml-2">(DNF - Did Not Finish)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <div className="text-xs text-gray-500 mb-1">Hover over points to see checkpoint details</div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={enhancedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 50,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="distance" 
              label={{ value: 'Distance (km)', position: 'bottom', offset: 0 }}
              tick={{ fontSize: 10 }}
              domain={[0, 'dataMax']}
              type="number"
              allowDataOverflow={true}
            />
            <YAxis 
              yAxisId="left"
              orientation="left" 
              label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
              reversed
              domain={positionDomain}
            />
            <YAxis 
              yAxisId="right"
              orientation="right" 
              label={{ value: 'Seconds vs Average', angle: -90, position: 'insideRight' }}
              domain={relativeDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeDasharray="3 3" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="position"
              stroke="#0053A5"
              activeDot={{ r: 8 }}
              name="Position"
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="relativeToAverage"
              stroke="#F2BB30"
              name="Seconds vs Average"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
