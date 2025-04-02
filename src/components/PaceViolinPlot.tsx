import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { scaleLinear, scaleBand } from 'd3-scale';
import { max, min, mean, median, range, quantile } from 'd3-array';
import { FilterOptions } from './FilterPanel';

interface PaceViolinPlotProps {
  athlete: AthleteResult;
  comparisonAthletes: AthleteResult[];
  filters: FilterOptions;
}

interface CheckpointPace {
  checkpoint: string;
  distance: number;
  paces: number[];
  athletePace?: number;
}

// Helper function to calculate the paces
const calculatePaces = (athletes: AthleteResult[], mainAthlete?: AthleteResult): CheckpointPace[] => {
  // Get all checkpoint names
  const checkpointNames = new Set<string>();
  athletes.forEach(athlete => {
    athlete.checkpoints.forEach(cp => {
      checkpointNames.add(cp.name);
    });
  });

  // Calculate paces for each checkpoint
  return Array.from(checkpointNames)
    .filter(name => name !== 'Start' && name !== 'Finish')
    .map(checkpoint => {
      // Collect pace values for this checkpoint
      const paces: number[] = [];
      const checkpointData: CheckpointPace = {
        checkpoint,
        distance: 0,
        paces: [],
      };
      
      // Calculate pace for each athlete at this checkpoint
      athletes.forEach(athlete => {
        const cp = athlete.checkpoints.find(c => c.name === checkpoint);
        if (cp && cp.timeSeconds > 0 && cp.distance > 0) {
          const pace = cp.timeSeconds / cp.distance; // seconds per km
          paces.push(pace);
          checkpointData.distance = cp.distance; // Save checkpoint distance
        }
      });
      
      // Set athlete's own pace if available
      if (mainAthlete) {
        const athleteCP = mainAthlete.checkpoints.find(c => c.name === checkpoint);
        if (athleteCP && athleteCP.timeSeconds > 0 && athleteCP.distance > 0) {
          checkpointData.athletePace = athleteCP.timeSeconds / athleteCP.distance;
        }
      }
      
      checkpointData.paces = paces;
      return checkpointData;
    })
    .filter(cp => cp.paces.length > 0) // Only keep checkpoints with data
    .sort((a, b) => a.distance - b.distance); // Sort by distance
};

// Helper function to calculate violin plot paths with smoother edges
const calculateViolinPath = (paces: number[], width: number, height: number): string => {
  // Kernel density estimation for smoother violin plot
  
  // Group paces into bins (use fewer bins for smoother appearance)
  const numBins = 15;
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const binWidth = (maxPace - minPace) / numBins;
  
  const bins = Array(numBins).fill(0);
  paces.forEach(pace => {
    const binIndex = Math.min(
      Math.floor((pace - minPace) / binWidth),
      numBins - 1
    );
    bins[binIndex]++;
  });
  
  // Apply light smoothing
  const smoothedBins = [...bins];
  for (let i = 1; i < numBins - 1; i++) {
    smoothedBins[i] = (bins[i-1] + bins[i] * 2 + bins[i+1]) / 4;
  }
  
  // Scale bins
  const maxBinHeight = Math.max(...smoothedBins);
  const scaledBins = smoothedBins.map(count => 
    Math.max((count / maxBinHeight) * (width / 2), 2) // Ensure minimum width
  );
  
  // Calculate violin path
  let path = '';
  
  // Left side (mirrored)
  for (let i = 0; i < numBins; i++) {
    const y = (i / numBins) * height;
    const x = width / 2 - scaledBins[i];
    if (i === 0) {
      path += `M ${x},${y}`;
    } else {
      path += ` L ${x},${y}`;
    }
  }
  
  // Right side
  for (let i = numBins - 1; i >= 0; i--) {
    const y = (i / numBins) * height;
    const x = width / 2 + scaledBins[i];
    path += ` L ${x},${y}`;
  }
  
  path += ' Z'; // Close the path
  return path;
};

// Format seconds as MM:SS
const formatPace = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
};

// Format checkpoint name to include distance
const formatCheckpoint = (cp: CheckpointPace): string => {
  return `${cp.checkpoint} (${cp.distance}km)`;
};

const PaceViolinPlot: React.FC<PaceViolinPlotProps> = ({ athlete, comparisonAthletes, filters }) => {
  // Calculate paces for each checkpoint
  const checkpointPaces = calculatePaces(comparisonAthletes, athlete);
  
  if (checkpointPaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Not enough data to display pace distribution.</p>
      </div>
    );
  }
  
  // Dimensions - adjusted for better display
  const width = 850;
  const height = 380;
  const margin = { top: 50, right: 30, bottom: 80, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // X scale - Checkpoint names with distances
  const checkpointLabels = checkpointPaces.map(cp => formatCheckpoint(cp));
  const xScale = scaleBand()
    .domain(checkpointLabels)
    .range([0, innerWidth])
    .padding(0.3); // More padding between violins
  
  // Y scale - Pace values with some padding
  const allPaces = checkpointPaces.flatMap(cp => cp.paces);
  const minPace = min(allPaces) || 0;
  const maxPace = max(allPaces) || 300;
  const paddedMin = Math.max(0, minPace - 20); // Add padding, but don't go below 0
  const paddedMax = maxPace + 20;
  
  const yScale = scaleLinear()
    .domain([paddedMin, paddedMax])
    .range([innerHeight, 0]);
  
  // Calculate statistics and violin width
  const violinWidth = xScale.bandwidth();
  
  // Get athlete's paces for highlighting
  const athletePaces = checkpointPaces.reduce((acc, cp) => {
    if (cp.athletePace) {
      acc[cp.checkpoint] = cp.athletePace;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div>
      <div className="mb-3">
        <div className="text-base font-semibold">
          Pace Distribution by Checkpoint
          <span className="text-sm font-normal text-gray-500 ml-2">
            (comparing with {comparisonAthletes.length} athletes)
          </span>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-lg">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
            {yScale.ticks(6).map((tick, i) => (
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
              {/* Axis line */}
              <line
                x1="0"
                y1="0"
                x2={innerWidth}
                y2="0"
                stroke="#888"
                strokeWidth="1"
              />
              
              {/* Checkpoint labels - with better rotation */}
              {checkpointLabels.map((cp, i) => {
                const x = xScale(cp)! + xScale.bandwidth() / 2;
                return (
                  <g key={`x-tick-${i}`} transform={`translate(${x},0)`}>
                    <line y2="6" stroke="#888" />
                    <text
                      y="10"
                      textAnchor="end"
                      fontSize="12"
                      transform="rotate(-45)"
                      dy="-0.5em"
                      dx="-0.5em"
                      fill="#666"
                    >
                      {cp}
                    </text>
                  </g>
                );
              })}
              
              <text
                x={innerWidth / 2}
                y="60"
                textAnchor="middle"
                fontSize="14"
                fill="#444"
              >
                Checkpoints
              </text>
            </g>
            
            {/* Y axis */}
            <g>
              {/* Axis line */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={innerHeight}
                stroke="#888"
                strokeWidth="1"
              />
              
              {/* Pace labels */}
              {yScale.ticks(6).map((tick, i) => (
                <g key={`y-tick-${i}`} transform={`translate(0,${yScale(tick)})`}>
                  <line x2="-6" stroke="#888" />
                  <text
                    x="-10"
                    dy="0.32em"
                    textAnchor="end"
                    fontSize="12"
                    fill="#666"
                  >
                    {formatPace(tick)}
                  </text>
                </g>
              ))}
              
              <text
                transform="rotate(-90)"
                y="-50"
                x={-innerHeight / 2}
                textAnchor="middle"
                fontSize="14"
                fill="#444"
              >
                Pace (min/km)
              </text>
            </g>
            
            {/* Violin plots */}
            {checkpointPaces.map(({ checkpoint, paces, athletePace }) => {
              const cp = formatCheckpoint({ checkpoint, distance: checkpointPaces.find(c => c.checkpoint === checkpoint)?.distance || 0, paces });
              const violinPath = calculateViolinPath(paces, violinWidth, innerHeight);
              const medianPace = median(paces) || 0;
              const q1 = quantile(paces, 0.25) || 0;
              const q3 = quantile(paces, 0.75) || 0;
              
              return (
                <g key={checkpoint} transform={`translate(${xScale(cp)!},0)`}>
                  {/* Violin shape with gradient fill */}
                  <path
                    d={violinPath}
                    fill="rgba(0, 83, 165, 0.25)"
                    stroke="rgba(0, 83, 165, 0.8)"
                    strokeWidth="1.5"
                  />
                  
                  {/* IQR box */}
                  <line
                    x1={violinWidth * 0.3}
                    y1={yScale(q1)}
                    x2={violinWidth * 0.7}
                    y2={yScale(q1)}
                    stroke="#666"
                    strokeWidth="1"
                  />
                  <line
                    x1={violinWidth * 0.3}
                    y1={yScale(q3)}
                    x2={violinWidth * 0.7}
                    y2={yScale(q3)}
                    stroke="#666"
                    strokeWidth="1"
                  />
                  <line
                    x1={violinWidth * 0.3}
                    y1={yScale(q1)}
                    x2={violinWidth * 0.3}
                    y2={yScale(q3)}
                    stroke="#666"
                    strokeWidth="1"
                  />
                  <line
                    x1={violinWidth * 0.7}
                    y1={yScale(q1)}
                    x2={violinWidth * 0.7}
                    y2={yScale(q3)}
                    stroke="#666"
                    strokeWidth="1"
                  />
                  
                  {/* Median line */}
                  <line
                    x1={violinWidth * 0.3}
                    y1={yScale(medianPace)}
                    x2={violinWidth * 0.7}
                    y2={yScale(medianPace)}
                    stroke="#333"
                    strokeWidth="2"
                  />
                  
                  {/* Athlete's dot with better visibility */}
                  {athletePace && (
                    <>
                      <circle
                        cx={violinWidth / 2}
                        cy={yScale(athletePace)}
                        r="5"
                        fill="#F2BB30"
                        stroke="#333"
                        strokeWidth="1.5"
                      />
                      {/* Highlight line */}
                      <line
                        x1={0}
                        y1={yScale(athletePace)}
                        x2={violinWidth}
                        y2={yScale(athletePace)}
                        stroke="#F2BB30"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        opacity="0.7"
                      />
                    </>
                  )}
                </g>
              );
            })}
            
            {/* Legend with background */}
            <g transform={`translate(${innerWidth - 160}, 10)`}>
              <rect width="160" height="95" fill="white" fillOpacity="0.85" stroke="#e5e5e5" rx="4" />
              <g transform="translate(10, 15)">
                <rect x="0" y="-7" width="20" height="14" fill="#666" fillOpacity="0.2" stroke="#666" strokeWidth="1" />
                <line x1="0" y1="0" x2="20" y2="0" stroke="#333" strokeWidth="2" />
                <text x="30" y="4" fontSize="12" fill="#333">Median Pace</text>
                
                <g transform="translate(0, 25)">
                  <rect x="0" y="-7" width="20" height="14" fill="transparent" stroke="#666" strokeWidth="1" />
                  <text x="30" y="4" fontSize="12" fill="#666">IQR (25-75%)</text>
                </g>
                
                <g transform="translate(0, 50)">
                  <circle cx="10" cy="0" r="5" fill="#F2BB30" stroke="#333" strokeWidth="1.5" />
                  <line x1="0" y1="0" x2="20" y2="0" stroke="#F2BB30" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="30" y="4" fontSize="12" fill="#333">Your Pace</text>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
      
      {/* Explanation text */}
      <div className="mt-3 text-sm text-gray-500">
        <p>This chart shows the distribution of pace (time per kilometer) at each checkpoint for {comparisonAthletes.length} athletes
        {filters.gender !== 'all' ? ` (${filters.gender === 'M' ? 'men' : 'women'})` : ''}
        {filters.startGroups.length > 0 ? ` in start group${filters.startGroups.length > 1 ? 's' : ''} ${filters.startGroups.join(', ')}` : ''}
        {filters.ageGroups.length > 0 ? ` in age categor${filters.ageGroups.length > 1 ? 'ies' : 'y'} ${filters.ageGroups.join(', ')}` : ''}.</p>
        <p className="mt-1">The width of each violin shows how many athletes achieved that pace. The box shows the interquartile range (middle 50% of athletes), and the horizontal line shows the median pace.</p>
      </div>
    </div>
  );
};

export default PaceViolinPlot; 