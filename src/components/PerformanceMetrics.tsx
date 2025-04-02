import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { FilterOptions } from './FilterPanel';

interface PerformanceMetricsProps {
  athlete: AthleteResult;
  comparisonAthletes?: AthleteResult[];
  filters?: FilterOptions;
  isLoading?: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
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
  const formatTimeDiff = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = Math.floor(absSeconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate metrics based on comparison athletes
  const calculatePercentile = (): number => {
    if (athlete.finishTimeSeconds === 0 || comparisonAthletes.length === 0) {
      return 0;
    }
    
    // Count how many athletes have slower time (higher value)
    const slowerCount = comparisonAthletes.filter(a => 
      a.finishTimeSeconds > athlete.finishTimeSeconds && a.finishTimeSeconds > 0
    ).length;
    
    // Only count finishers for percentile
    const finishers = comparisonAthletes.filter(a => a.finishTimeSeconds > 0).length;
    
    if (finishers === 0) return 0;
    
    const percentile = (slowerCount / finishers) * 100;
    return Math.round(percentile);
  };

  const calculateDiffToWinner = (): number => {
    if (athlete.finishTimeSeconds === 0 || comparisonAthletes.length === 0) {
      return 0;
    }
    
    // Get the winner's time (minimum finish time among comparison athletes)
    const finishTimes = comparisonAthletes
      .map(a => a.finishTimeSeconds)
      .filter(time => time > 0);
    
    if (finishTimes.length === 0) return 0;
    
    const winnerTime = Math.min(...finishTimes);
    return athlete.finishTimeSeconds - winnerTime;
  };

  const calculateDiffToAverage = (): number => {
    if (athlete.finishTimeSeconds === 0 || comparisonAthletes.length === 0) {
      return 0;
    }
    
    // Get average finish time of comparison athletes
    const finishTimes = comparisonAthletes
      .map(a => a.finishTimeSeconds)
      .filter(time => time > 0);
    
    if (finishTimes.length === 0) return 0;
    
    const avgTime = finishTimes.reduce((sum, time) => sum + time, 0) / finishTimes.length;
    return athlete.finishTimeSeconds - avgTime;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="pt-6 pb-6 text-center">
            <p>Loading performance metrics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const percentile = calculatePercentile();
  const diffToWinner = calculateDiffToWinner();
  const diffToAverage = calculateDiffToAverage();
  
  // Create filter description
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Percentile{filterDescription}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-vasablue">
              {percentile}%
            </span>
            <span className="text-sm text-gray-500 ml-2">
              top performer
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Better than {percentile}% of {comparisonAthletes.length} comparison athletes
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Time Behind Winner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-vasablue">
              {formatTimeDiff(diffToWinner)}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              min:sec
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <ArrowUp className="text-red-500 mr-1" size={12} />
            <span className="text-gray-500">
              {Math.round(diffToWinner / 60)} minutes slower
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Compared to Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-vasablue">
              {formatTimeDiff(Math.abs(diffToAverage))}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              min:sec
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {diffToAverage < 0 ? (
              <>
                <ArrowDown className="text-green-500 mr-1" size={12} />
                <span className="text-gray-500">
                  {Math.round(Math.abs(diffToAverage) / 60)} minutes faster
                </span>
              </>
            ) : (
              <>
                <ArrowUp className="text-red-500 mr-1" size={12} />
                <span className="text-gray-500">
                  {Math.round(diffToAverage / 60)} minutes slower
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;
