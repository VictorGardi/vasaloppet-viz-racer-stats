import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import { FilterOptions } from './FilterPanel';

interface CheckpointTableProps {
  athlete: AthleteResult;
  comparisonAthletes?: AthleteResult[];
  filters?: FilterOptions;
  isLoading?: boolean;
}

const CheckpointTable: React.FC<CheckpointTableProps> = ({ 
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
  const checkpoints = athlete.checkpoints;
  
  // Check if the athlete finished the race
  const didFinish = checkpoints.some(cp => cp.name === "Finish");
  
  // Sort checkpoints by distance
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.distance - b.distance);
  
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
  
  if (isLoading) {
    return (
      <Card className="bg-white shadow-md w-full">
        <CardHeader>
          <CardTitle className="text-lg">Checkpoint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600">Loading checkpoint data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white shadow-md w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Checkpoint Details{filterDescription}
          </CardTitle>
          {!didFinish && (
            <div className="flex items-center text-sm text-red-500">
              <AlertTriangle size={16} className="mr-1" />
              Did Not Finish
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {checkpoints.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600">No checkpoint data available for this athlete.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Checkpoint</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>vs. Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCheckpoints.map((cp, index) => (
                  <TableRow key={cp.name}>
                    <TableCell className="font-medium text-vasablue">{cp.name}</TableCell>
                    <TableCell>{cp.distance} km</TableCell>
                    <TableCell>{cp.time}</TableCell>
                    <TableCell>#{cp.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {cp.relativeToAverage < 0 ? (
                          <>
                            <ArrowDown className="text-green-500 mr-1" size={14} />
                            <span className="text-green-600">
                              {Math.abs(cp.relativeToAverage)}s faster
                            </span>
                          </>
                        ) : cp.relativeToAverage > 0 ? (
                          <>
                            <ArrowUp className="text-red-500 mr-1" size={14} />
                            <span className="text-red-600">
                              {cp.relativeToAverage}s slower
                            </span>
                          </>
                        ) : (
                          <span>On pace</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!didFinish && checkpoints.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Note:</strong> This athlete did not finish the race. Data is only available for {checkpoints.length} checkpoint(s).
              The position shown might not reflect the actual ranking at that checkpoint.
            </p>
          </div>
        )}
        
        {comparisonAthletes.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Comparison based on {comparisonAthletes.length} athletes{filterDescription}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckpointTable;
