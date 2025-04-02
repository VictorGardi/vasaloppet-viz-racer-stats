
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRaceStatistics, getTopAthletes } from '@/services/mockDataService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const WelcomeScreen: React.FC = () => {
  const statistics = getRaceStatistics();
  const topAthletes = getTopAthletes(5);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold text-vasablue-dark">
          Welcome to Vasaloppet Analytics
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Search for a bib number above to analyze a racer's performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader className="bg-vasablue-light text-white">
            <CardTitle className="text-center">Race Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Finishers</p>
                <p className="text-2xl font-bold text-vasablue">
                  {statistics.totalFinishers}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Did Not Finish (DNF)</p>
                <p className="text-2xl font-bold text-vasablue">
                  {statistics.dnfCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Winning Time</p>
                <p className="text-2xl font-bold text-vasablue">
                  {formatTime(statistics.finishTimes.min)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Time</p>
                <p className="text-2xl font-bold text-vasablue">
                  {formatTime(statistics.finishTimes.avg)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white shadow-md">
          <CardHeader className="bg-vasablue-light text-white">
            <CardTitle className="text-center">Top 5 Finishers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Bib</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Finish Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAthletes.map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell className="font-medium">#{athlete.position}</TableCell>
                      <TableCell>{athlete.bibNumber}</TableCell>
                      <TableCell>{athlete.name}</TableCell>
                      <TableCell>{athlete.nationality}</TableCell>
                      <TableCell className="font-bold">{athlete.finishTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-vasasnow shadow-md border border-vasablue-light/20">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-vasablue-dark mb-2">About Vasaloppet</h2>
          <p className="text-gray-700">
            Vasaloppet is one of the world's oldest, longest, and biggest cross-country ski races.
            It is held annually on the first Sunday of March in northwestern Dalarna, Sweden, and covers a distance of 90 kilometers between the village of Sälen and town of Mora.
          </p>
          <p className="text-gray-700 mt-3">
            The race follows the route used by Gustav Vasa in 1520 when he was fleeing from Christian II's soldiers during the war between Sweden and Denmark.
          </p>
          <p className="text-gray-700 mt-3">
            Search for a bib number above to analyze a racer's performance throughout the 90km journey!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeScreen;
