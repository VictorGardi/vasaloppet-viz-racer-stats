import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AthleteResult } from '@/types/vasaloppet';
import { FilterOptions } from './FilterPanel';
import FilterPanel from './FilterPanel';
import PaceViolinPlot from './PaceViolinPlot';
import FinishTimeDistribution from './FinishTimeDistribution';

interface AthleteStatisticsProps {
  athlete: AthleteResult;
  comparisonAthletes: AthleteResult[];
  availableStartGroups: string[];
  availableAgeGroups: string[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  isLoading: boolean;
}

const AthleteStatistics: React.FC<AthleteStatisticsProps> = ({ 
  athlete,
  comparisonAthletes,
  availableStartGroups,
  availableAgeGroups,
  filters,
  onFilterChange,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <FilterPanel 
            athlete={athlete} 
            availableStartGroups={availableStartGroups} 
            availableAgeGroups={availableAgeGroups}
            onChange={onFilterChange}
          />
        </div>
        <div className="md:col-span-2">
          <Card className="bg-white shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-lg">Statistical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Loading comparison data...</p>
                </div>
              ) : comparisonAthletes.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No athletes match the current filters. Try adjusting your filters.</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border rounded-md">
                      <p className="text-sm text-gray-500">Comparison Group</p>
                      <p className="text-2xl font-bold">{comparisonAthletes.length}</p>
                      <p className="text-xs text-gray-400">athletes</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm text-gray-500">Your Percentile</p>
                      <p className="text-2xl font-bold">
                        {athlete.finishTimeSeconds > 0 ? 
                          calculatePercentile(athlete, comparisonAthletes) : 
                          "DNF"}
                      </p>
                      <p className="text-xs text-gray-400">among comparison group</p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="text-sm text-gray-500">Time vs. Median</p>
                      <p className="text-2xl font-bold">
                        {athlete.finishTimeSeconds > 0 ? 
                          formatTimeDifference(athlete, comparisonAthletes) : 
                          "DNF"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {athlete.finishTimeSeconds > 0 && calculateTimeDiff(athlete, comparisonAthletes) < 0 
                          ? "faster than median" 
                          : "slower than median"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm mb-4">
                      Your results are being compared with {comparisonAthletes.length} athletes
                      {filters.gender !== 'all' ? ` (${filters.gender === 'M' ? 'men' : 'women'})` : ''}
                      {filters.startGroups.length > 0 ? ` in start group${filters.startGroups.length > 1 ? 's' : ''} ${filters.startGroups.join(', ')}` : ''}
                      {filters.ageGroups.length > 0 ? ` in age categor${filters.ageGroups.length > 1 ? 'ies' : 'y'} ${filters.ageGroups.join(', ')}` : ''}.
                    </p>
                  </div>
                  
                  <Tabs defaultValue="finish-time" className="w-full mt-8">
                    <TabsList className="mb-6">
                      <TabsTrigger value="finish-time">Finish Time Distribution</TabsTrigger>
                      <TabsTrigger value="pace">Pace by Checkpoint</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="finish-time" className="pt-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-96">
                          <p className="text-gray-500">Loading finish time distribution...</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden">
                          <FinishTimeDistribution 
                            athlete={athlete} 
                            comparisonAthletes={comparisonAthletes}
                            filters={filters}
                          />
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="pace" className="pt-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-96">
                          <p className="text-gray-500">Loading pace distribution...</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden">
                          <PaceViolinPlot 
                            athlete={athlete}
                            comparisonAthletes={comparisonAthletes}
                            filters={filters}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate percentile
const calculatePercentile = (athlete: AthleteResult, comparisonAthletes: AthleteResult[]): string => {
  if (athlete.finishTimeSeconds === 0 || comparisonAthletes.length === 0) {
    return 'N/A';
  }
  
  // Count how many athletes have slower time (higher value)
  const slowerCount = comparisonAthletes.filter(a => 
    a.finishTimeSeconds > athlete.finishTimeSeconds && a.finishTimeSeconds > 0
  ).length;
  
  // Only count finishers for percentile
  const finishers = comparisonAthletes.filter(a => a.finishTimeSeconds > 0).length;
  
  if (finishers === 0) return 'N/A';
  
  const percentile = (slowerCount / finishers) * 100;
  return `${Math.round(percentile)}%`;
};

// Helper function to calculate time difference from median
const calculateTimeDiff = (athlete: AthleteResult, comparisonAthletes: AthleteResult[]): number => {
  if (athlete.finishTimeSeconds === 0 || comparisonAthletes.length === 0) {
    return 0;
  }
  
  // Get finish times of athletes who finished
  const finishTimes = comparisonAthletes
    .map(a => a.finishTimeSeconds)
    .filter(time => time > 0)
    .sort((a, b) => a - b);
  
  if (finishTimes.length === 0) return 0;
  
  // Calculate median finish time
  const mid = Math.floor(finishTimes.length / 2);
  const medianTime = finishTimes.length % 2 === 0
    ? (finishTimes[mid - 1] + finishTimes[mid]) / 2
    : finishTimes[mid];
  
  // Return difference in seconds
  return athlete.finishTimeSeconds - medianTime;
};

// Helper function to format time difference
const formatTimeDifference = (athlete: AthleteResult, comparisonAthletes: AthleteResult[]): string => {
  const diff = calculateTimeDiff(athlete, comparisonAthletes);
  
  if (diff === 0) return 'On par';
  
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60);
  const seconds = Math.floor(absDiff % 60);
  
  return `${diff < 0 ? '-' : '+'}${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default AthleteStatistics; 