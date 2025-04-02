import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { scaleLinear } from 'd3-scale';
import { max, min, mean, median, bin } from 'd3-array';
import { FilterOptions } from './FilterPanel';

interface FinishTimeDistributionProps {
  athlete: AthleteResult;
  comparisonAthletes: AthleteResult[];
  filters: FilterOptions;
}

// Helper function to format seconds to HH:MM:SS
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Helper function to format seconds to H:MM
const formatTimeShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

const FinishTimeDistribution: React.FC<FinishTimeDistributionProps> = ({ athlete, comparisonAthletes, filters }) => {
  // Filter out DNF athletes
  const finishers = comparisonAthletes.filter(a => a.finishTimeSeconds > 0);
  
  if (finishers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Not enough data to display finish time distribution.</p>
      </div>
    );
  }
  
  // Extract finish times
  const finishTimes = finishers.map(a => a.finishTimeSeconds);
  
  // Dimensions - adjusted for better fit
  const width = 850;
  const height = 380;
  const margin = { top: 50, right: 30, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Calculate statistics
  const minTime = min(finishTimes) || 0;
  const maxTime = max(finishTimes) || 0;
  const meanTime = mean(finishTimes) || 0;
  const medianTime = median(finishTimes) || 0;
  const athleteTime = athlete.finishTimeSeconds;
  
  // Determine bin count - fewer bins for a smoother curve
  const binCount = Math.min(30, Math.max(10, Math.ceil(finishers.length / 50)));
  
  // Create histogram bins - with padding for cleaner display
  const timeBins = bin<number>()
    .domain([minTime * 0.98, maxTime * 1.02]) // Reduce padding to keep times more accurate
    .thresholds(binCount)
    (finishTimes);
  
  // Scale setup
  const xScale = scaleLinear()
    .domain([minTime * 0.98, maxTime * 1.02]) // Match the bin domain exactly
    .range([0, innerWidth]);
  
  const maxCount = max(timeBins, d => d.length) || 0;
  const yScale = scaleLinear()
    .domain([0, maxCount * 1.1]) // Add some space at the top
    .range([innerHeight, 0]);
  
  // Create distribution plot path with a smoother curve
  let areaPath = "";
  
  // First point at the bottom
  areaPath = `M ${xScale(timeBins[0].x0 || 0)},${innerHeight}`;
  
  // Draw the top of the curve using actual bin values
  timeBins.forEach((bin, i) => {
    const x = xScale(bin.x0 || 0);
    const y = yScale(bin.length);
    if (i === 0) {
      areaPath += ` M ${x},${innerHeight} L ${x},${y}`;
    } else {
      areaPath += ` L ${x},${y}`;
    }
    
    // Add the right edge of the bin
    if (i === timeBins.length - 1) {
      const lastX = xScale(bin.x1 || 0);
      areaPath += ` L ${lastX},${y} L ${lastX},${innerHeight}`;
    }
  });
  
  // Close the path
  areaPath += " Z";
  
  // Create X-axis ticks with better spacing
  const xTicks = 8; // Fewer ticks for cleaner display
  const xTickValues = Array.from({ length: xTicks + 1 }, (_, i) => 
    minTime + ((maxTime - minTime) * (i / xTicks))
  );
  
  // Format the labels to show rounded times
  const formattedXTicks = xTickValues.map(tick => ({
    value: tick,
    label: formatTimeShort(tick)
  }));
  
  return (
    <div>
      <div className="mb-3">
        <div className="text-base font-semibold">
          Finish Time Distribution 
          <span className="text-sm font-normal text-gray-500 ml-2">
            (based on {finishers.length} athletes)
          </span>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-lg">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Distribution area */}
            <path
              d={areaPath}
              fill="rgba(0, 83, 165, 0.2)"
              stroke="rgb(0, 83, 165, 0.8)"
              strokeWidth="1.5"
            />
            
            {/* Grid lines */}
            {yScale.ticks(5).map((tick, i) => (
              <line
                key={`grid-${i}`}
                x1="0"
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke="#e5e5e5"
                strokeWidth="1"
              />
            ))}
            
            {/* X axis */}
            <g transform={`translate(0,${innerHeight})`}>
              <line
                x1="0"
                y1="0"
                x2={innerWidth}
                y2="0"
                stroke="#888"
                strokeWidth="1"
              />
              
              {formattedXTicks.map((tick, i) => (
                <g key={`x-tick-${i}`} transform={`translate(${xScale(tick.value)},0)`}>
                  <line y2="6" stroke="#888" />
                  <text
                    y="20"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#666"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
              
              <text
                x={innerWidth / 2}
                y="45"
                textAnchor="middle"
                fontSize="14"
                fill="#444"
              >
                Finish Time
              </text>
            </g>
            
            {/* Y axis */}
            <g>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={innerHeight}
                stroke="#888"
                strokeWidth="1"
              />
              
              {yScale.ticks(5).map((tick, i) => (
                <g key={`y-tick-${i}`} transform={`translate(0,${yScale(tick)})`}>
                  <line x2="-6" stroke="#888" />
                  <text
                    x="-10"
                    dy="0.32em"
                    textAnchor="end"
                    fontSize="12"
                    fill="#666"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              
              <text
                transform="rotate(-90)"
                y="-45"
                x={-innerHeight / 2}
                textAnchor="middle"
                fontSize="14"
                fill="#444"
              >
                Number of Athletes
              </text>
            </g>
            
            {/* Median line */}
            <line
              x1={xScale(medianTime)}
              y1="0"
              x2={xScale(medianTime)}
              y2={innerHeight}
              stroke="#333"
              strokeWidth="1.5"
            />
            
            {/* Mean line */}
            <line
              x1={xScale(meanTime)}
              y1="0"
              x2={xScale(meanTime)}
              y2={innerHeight}
              stroke="#666"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            
            {/* Athlete's time line */}
            {athleteTime > 0 && (
              <line
                x1={xScale(athleteTime)}
                y1="0"
                x2={xScale(athleteTime)}
                y2={innerHeight}
                stroke="#F2BB30"
                strokeWidth="2"
              />
            )}
            
            {/* Labels at the top */}
            <g>
              {medianTime > 0 && (
                <text
                  x={xScale(medianTime)}
                  y="-20"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="500"
                  fill="#333"
                >
                  Median: {formatTimeShort(medianTime)}
                </text>
              )}
              
              {meanTime > 0 && (
                <text
                  x={xScale(meanTime)}
                  y="-5"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#666"
                >
                  Mean: {formatTimeShort(meanTime)}
                </text>
              )}
              
              {athleteTime > 0 && (
                <text
                  x={xScale(athleteTime)}
                  y="-35"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#F2BB30"
                >
                  Your Time: {formatTimeShort(athleteTime)}
                </text>
              )}
            </g>
            
            {/* Legend */}
            <g transform={`translate(${innerWidth - 140}, 10)`}>
              <rect width="140" height="74" fill="white" fillOpacity="0.85" stroke="#e5e5e5" rx="4" />
              <g transform="translate(10, 15)">
                <line x1="0" y1="0" x2="20" y2="0" stroke="#333" strokeWidth="1.5" />
                <text x="30" y="4" fontSize="12" fill="#333">Median Time</text>
                
                <line x1="0" y1="20" x2="20" y2="20" stroke="#666" strokeWidth="1" strokeDasharray="4,4" />
                <text x="30" y="24" fontSize="12" fill="#666">Mean Time</text>
                
                <line x1="0" y1="40" x2="20" y2="40" stroke="#F2BB30" strokeWidth="2" />
                <text x="30" y="44" fontSize="12" fill="#333">Your Time</text>
              </g>
            </g>
          </g>
        </svg>
      </div>
      
      {/* Stats summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Median Time</p>
          <p className="text-xl font-semibold">{formatTime(medianTime)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Mean Time</p>
          <p className="text-xl font-semibold">{formatTime(meanTime)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Your Time</p>
          <p className="text-xl font-semibold">
            {athlete.finishTimeSeconds > 0 
              ? formatTime(athlete.finishTimeSeconds) 
              : 'DNF'}
          </p>
        </div>
      </div>
      
      {/* Explanation text */}
      <div className="mt-3 text-sm text-gray-500">
        <p>This chart shows the distribution of finish times among {finishers.length} athletes
        {filters.gender !== 'all' ? ` (${filters.gender === 'M' ? 'men' : 'women'})` : ''}
        {filters.startGroups.length > 0 ? ` in start group${filters.startGroups.length > 1 ? 's' : ''} ${filters.startGroups.join(', ')}` : ''}
        {filters.ageGroups.length > 0 ? ` in age categor${filters.ageGroups.length > 1 ? 'ies' : 'y'} ${filters.ageGroups.join(', ')}` : ''}.</p>
        <p className="mt-1">The height of the curve indicates how many athletes finished with that time.</p>
        {athlete.finishTimeSeconds === 0 && (
          <p className="mt-2 text-amber-600 font-medium">This athlete did not finish the race.</p>
        )}
      </div>
    </div>
  );
};

export default FinishTimeDistribution; 