
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AthleteResult } from '@/types/vasaloppet';

interface AthleteCardProps {
  athlete: AthleteResult;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete }) => {
  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="bg-vasablue text-white pb-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-vasasnow-light/80">BIB #{athlete.bibNumber}</p>
            <CardTitle className="text-xl font-bold">{athlete.name}</CardTitle>
          </div>
          <div className="bg-vasagold text-black py-1 px-3 rounded-md text-sm font-bold">
            #{athlete.position}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Club</p>
            <p className="font-medium">{athlete.club}</p>
          </div>
          <div>
            <p className="text-gray-500">Nationality</p>
            <p className="font-medium">{athlete.nationality}</p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium">{athlete.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Finish Time</p>
            <p className="font-bold text-vasablue-dark">{athlete.finishTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteCard;
