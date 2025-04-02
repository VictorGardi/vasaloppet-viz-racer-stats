import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { useQuery } from '@tanstack/react-query';
import { getAvailableEvents, getComparisonAthletes } from '@/services/vasaloppetDataService';

interface AthleteCardProps {
  athlete: AthleteResult;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete }) => {
  // Get event name from index
  const eventQuery = useQuery({
    queryKey: ['eventIndex'],
    queryFn: getAvailableEvents,
    staleTime: Infinity,
  });

  // Get finisher count to calculate actual position (excluding DNFs)
  const comparisonQuery = useQuery({
    queryKey: ['comparisonAthletes', athlete.id, 'all'],
    queryFn: () => getComparisonAthletes(athlete, {
      gender: 'all',
      startGroups: [],
      ageGroups: [],
      finishersOnly: true
    }),
    enabled: !!athlete.id,
  });

  // Calculate actual position among finishers
  const calculateActualPosition = () => {
    if (!athlete.finishTimeSeconds) return "DNF";
    
    if (comparisonQuery.isLoading) return "...";
    
    if (comparisonQuery.data) {
      // Count how many athletes finished faster than this athlete
      const fasterFinishers = comparisonQuery.data.filter(a => 
        a.finishTimeSeconds > 0 && a.finishTimeSeconds < athlete.finishTimeSeconds
      ).length;
      
      // Add 1 to get position (1-indexed)
      return `#${fasterFinishers + 1}`;
    }
    
    // Fallback to the original position
    return `#${athlete.position}`;
  };

  // Check if the athlete has a Finish checkpoint
  const hasFinished = athlete.checkpoints.some(cp => cp.name === "Finish");
  
  // Get event name or a default
  const getEventName = () => {
    if (eventQuery.data && athlete.year && athlete.eventId) {
      const yearStr = String(athlete.year);
      return eventQuery.data[yearStr]?.[athlete.eventId] || `Event: ${athlete.eventId}`;
    }
    return athlete.eventId ? `Event: ${athlete.eventId}` : "Unknown Event";
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="bg-vasablue text-white pb-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-vasasnow-light/80">
              {athlete.bibNumber && athlete.bibNumber !== "?" 
                ? `BIB #${athlete.bibNumber}` 
                : athlete.startGroup === "Elit" 
                  ? "ELITE ATHLETE" 
                  : "NO BIB ASSIGNED"}
            </p>
            <CardTitle className="text-xl font-bold">{athlete.name}</CardTitle>
          </div>
          <div className="bg-vasagold text-black py-1 px-3 rounded-md text-sm font-bold">
            {hasFinished ? calculateActualPosition() : "DNF"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-3 text-xs border-b pb-2">
          <span className="font-semibold">Year:</span> {athlete.year} - <span className="font-semibold">Event:</span> {getEventName()}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Start Group</p>
            <p className="font-medium">{athlete.startGroup || "Not specified"}</p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium">{athlete.category || "Not specified"}</p>
          </div>
          <div>
            <p className="text-gray-500">Finish Time</p>
            <p className="font-bold text-vasablue-dark">
              {hasFinished ? athlete.finishTime : <span className="text-red-500">Did Not Finish</span>}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Gender</p>
            <p className="font-medium">{athlete.gender === 'M' ? 'Male' : 'Female'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteCard;
