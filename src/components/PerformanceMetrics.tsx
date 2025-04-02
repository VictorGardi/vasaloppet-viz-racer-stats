
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { getComparisonToField } from '@/services/mockDataService';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PerformanceMetricsProps {
  athlete: AthleteResult;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ athlete }) => {
  const comparison = getComparisonToField(athlete);
  
  const formatTimeDiff = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Percentile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-vasablue">
              {comparison.percentile}%
            </span>
            <span className="text-sm text-gray-500 ml-2">
              top performer
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Better than {comparison.percentile}% of all finishers
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
              {formatTimeDiff(comparison.diffToWinner)}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              min:sec
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <ArrowUp className="text-red-500 mr-1" size={12} />
            <span className="text-gray-500">
              {Math.round(comparison.diffToWinner / 60)} minutes slower
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
              {formatTimeDiff(Math.abs(comparison.diffToAverage))}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              min:sec
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {comparison.diffToAverage < 0 ? (
              <>
                <ArrowDown className="text-green-500 mr-1" size={12} />
                <span className="text-gray-500">
                  {Math.round(Math.abs(comparison.diffToAverage) / 60)} minutes faster
                </span>
              </>
            ) : (
              <>
                <ArrowUp className="text-red-500 mr-1" size={12} />
                <span className="text-gray-500">
                  {Math.round(comparison.diffToAverage / 60)} minutes slower
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
