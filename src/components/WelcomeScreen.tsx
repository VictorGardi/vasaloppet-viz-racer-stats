import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTopAthletes, loadRaceStatistics, getAvailableEvents, setSelectedEvent } from '@/services/vasaloppetDataService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WelcomeScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEventLoaded, setSelectedEventLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventIndex, setEventIndex] = useState<Record<string, Record<string, string>>>({});
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Load available events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const index = await getAvailableEvents();
        setEventIndex(index);
        
        // Sort years in descending order (newest first)
        const sortedYears = Object.keys(index).sort((a, b) => parseInt(b) - parseInt(a));
        setYears(sortedYears);
        
        if (sortedYears.length > 0) {
          const year = sortedYears[0];
          setSelectedYear(year);
          
          // Try to find the main Vasaloppet event first, or use the first event
          const events = Object.keys(index[year]);
          if (events.length > 0) {
            const defaultEvent = events.find(e => e.startsWith('VL_')) || events[0];
            setSelectedEventId(defaultEvent);
            await setSelectedEvent(year, defaultEvent);
            setSelectedEventLoaded(true);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        setLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  // When year changes, select first event for that year
  useEffect(() => {
    if (selectedYear && eventIndex[selectedYear]) {
      const events = Object.keys(eventIndex[selectedYear]);
      if (events.length > 0) {
        const defaultEvent = events.find(e => e.startsWith('VL_')) || events[0];
        setSelectedEventId(defaultEvent);
      }
    }
  }, [selectedYear, eventIndex]);

  const handleSelectYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    console.log('Selected year:', year);
    if (years.includes(year)) {
      setSelectedYear(year);
    }
  };

  const handleSelectEvent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    console.log('Selected event:', eventId);
    setSelectedEventId(eventId);
  };

  const handleLoadEvent = async () => {
    if (selectedYear && selectedEventId) {
      console.log('Loading event data for:', selectedYear, selectedEventId);
      await setSelectedEvent(selectedYear, selectedEventId);
      // Invalidate queries to reload data with the new event
      queryClient.invalidateQueries({ queryKey: ['raceStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['topMaleAthletes'] });
      queryClient.invalidateQueries({ queryKey: ['topFemaleAthletes'] });
      setSelectedEventLoaded(true);
    }
  };

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['raceStatistics'],
    queryFn: loadRaceStatistics,
    enabled: selectedEventLoaded
  });

  const { data: topMaleAthletes, isLoading: maleAthletesLoading } = useQuery({
    queryKey: ['topMaleAthletes'],
    queryFn: () => getTopAthletes(5, 'M'),
    enabled: selectedEventLoaded
  });

  const { data: topFemaleAthletes, isLoading: femaleAthletesLoading } = useQuery({
    queryKey: ['topFemaleAthletes'],
    queryFn: () => getTopAthletes(5, 'F'),
    enabled: selectedEventLoaded
  });

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isDataLoading = statsLoading || maleAthletesLoading || femaleAthletesLoading;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Vasaloppet Data Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Welcome to the Vasaloppet Data Explorer. This application allows you to analyze results from the world's oldest, longest, and largest cross-country ski race.
          </p>
          <p>
            Select an event below to get started, or search for a specific athlete using the search box above.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year-select">Year</Label>
              {loading ? (
                <div>Loading years...</div>
              ) : (
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={handleSelectYear}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-select">Event</Label>
              {loading ? (
                <div>Loading events...</div>
              ) : (
                <select
                  id="event-select"
                  value={selectedEventId}
                  onChange={handleSelectEvent}
                  disabled={!selectedYear || !eventIndex[selectedYear]}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedYear && eventIndex[selectedYear] &&
                    Object.entries(eventIndex[selectedYear]).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))
                  }
                </select>
              )}
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                onClick={handleLoadEvent}
                disabled={!selectedYear || !selectedEventId || loading}
                className="w-full"
              >
                Load Event Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDataLoading && selectedEventLoaded ? (
        <div className="text-center py-12">
          <p className="text-xl text-vasablue-dark">Loading race data...</p>
        </div>
      ) : selectedEventLoaded && !statistics ? (
        <div className="text-center py-12 bg-red-100 p-4 rounded">
          <p className="text-xl text-red-600">Error loading data. Please check the browser console for errors.</p>
        </div>
      ) : statistics && topMaleAthletes && topFemaleAthletes ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Race Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded p-4 text-center">
                  <h3 className="text-sm uppercase text-gray-500 mb-1">Participants</h3>
                  <p className="text-2xl font-bold">{statistics.totalFinishers}</p>
                </div>
                <div className="border rounded p-4 text-center">
                  <h3 className="text-sm uppercase text-gray-500 mb-1">Winner Time</h3>
                  <p className="text-2xl font-bold">{formatTime(statistics.finishTimes.min)}</p>
                </div>
                <div className="border rounded p-4 text-center">
                  <h3 className="text-sm uppercase text-gray-500 mb-1">Average Time</h3>
                  <p className="text-2xl font-bold">{formatTime(statistics.finishTimes.avg)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Finishers</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="men" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="men">Men</TabsTrigger>
                  <TabsTrigger value="women">Women</TabsTrigger>
                </TabsList>
                <TabsContent value="men">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Bib</TableHead>
                        <TableHead>Start Group</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topMaleAthletes && topMaleAthletes.length > 0 ? (
                        topMaleAthletes.map((athlete) => (
                          <TableRow key={athlete.id}>
                            <TableCell>#{athlete.position}</TableCell>
                            <TableCell>
                              {athlete.bibNumber && athlete.bibNumber !== "?" 
                                ? athlete.bibNumber 
                                : <span className="text-gray-500">-</span>}
                            </TableCell>
                            <TableCell>{athlete.startGroup || "Unknown"}</TableCell>
                            <TableCell>
                              {athlete.finishTimeSeconds > 0 
                                ? athlete.finishTime 
                                : <span className="text-red-500">DNF</span>}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No male finishers found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="women">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Bib</TableHead>
                        <TableHead>Start Group</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topFemaleAthletes && topFemaleAthletes.length > 0 ? (
                        topFemaleAthletes.map((athlete) => (
                          <TableRow key={athlete.id}>
                            <TableCell>#{athlete.position}</TableCell>
                            <TableCell>
                              {athlete.bibNumber && athlete.bibNumber !== "?" 
                                ? athlete.bibNumber 
                                : <span className="text-gray-500">-</span>}
                            </TableCell>
                            <TableCell>{athlete.startGroup || "Unknown"}</TableCell>
                            <TableCell>
                              {athlete.finishTimeSeconds > 0 
                                ? athlete.finishTime 
                                : <span className="text-red-500">DNF</span>}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No female finishers found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default WelcomeScreen;
