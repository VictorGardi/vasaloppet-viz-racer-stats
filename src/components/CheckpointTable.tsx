
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface CheckpointTableProps {
  athlete: AthleteResult;
}

const CheckpointTable: React.FC<CheckpointTableProps> = ({ athlete }) => {
  const checkpoints = athlete.checkpoints;

  return (
    <Card className="bg-white shadow-md w-full">
      <CardHeader>
        <CardTitle className="text-lg">Checkpoint Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Checkpoint</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>vs. Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkpoints.map((cp) => (
                <TableRow key={cp.name}>
                  <TableCell className="font-medium">{cp.name}</TableCell>
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
      </CardContent>
    </Card>
  );
};

export default CheckpointTable;
