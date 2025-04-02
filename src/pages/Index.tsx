import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import AthleteCard from '@/components/AthleteCard';
import ProgressChart from '@/components/ProgressChart';
import CheckpointTable from '@/components/CheckpointTable';
import WelcomeScreen from '@/components/WelcomeScreen';
import AthleteStatistics from '@/components/AthleteStatistics';
import FilterPanel from '@/components/FilterPanel';
import FinishTimeDistribution from '@/components/FinishTimeDistribution';
import PaceViolinPlot from '@/components/PaceViolinPlot';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getAthleteByBib, searchAthletes, getAvailableEvents, setSelectedEvent, getComparisonAthletes, getAvailableStartGroups, getAvailableAgeCategories } from '@/services/vasaloppetDataService';
import { AthleteResult } from '@/types/vasaloppet';
import { useQuery } from '@tanstack/react-query';
import { FilterOptions } from '@/components/FilterPanel';

const Index = () => {
  const [athlete, setAthlete] = useState<AthleteResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [searchBib, setSearchBib] = useState<number | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [comparisonFilters, setComparisonFilters] = useState<FilterOptions>({
    gender: 'all',
    startGroups: [],
    ageGroups: [],
    finishersOnly: true
  });

  // Query for getting athlete by bib number
  const bibQuery = useQuery({
    queryKey: ['athlete', 'bib', searchBib],
    queryFn: async () => {
      if (!searchBib) return null;
      
      try {
        console.log('Searching for athlete with bib number:', searchBib);
        const result = await getAthleteByBib(searchBib);
        console.log('Search result:', result);
        return result;
      } catch (error) {
        console.error('Error searching for athlete:', error);
        setSearchError(`Error searching for athlete: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    },
    enabled: searchBib !== null,
    retry: 1,
  });

  // Query for searching athletes by name
  const nameQuery = useQuery({
    queryKey: ['athletes', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      try {
        console.log('Searching for athletes matching:', searchQuery);
        const results = await searchAthletes(searchQuery);
        console.log('Search results:', results);
        return results;
      } catch (error) {
        console.error('Error searching for athletes:', error);
        setSearchError(`Error searching for athletes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return [];
      }
    },
    enabled: searchQuery !== null,
    retry: 1,
  });

  // Fetch available start groups
  const startGroupsQuery = useQuery({
    queryKey: ['startGroups'],
    queryFn: getAvailableStartGroups,
    enabled: athlete !== null,
  });

  // Fetch available age categories
  const categoriesQuery = useQuery({
    queryKey: ['ageCategories'],
    queryFn: getAvailableAgeCategories,
    enabled: athlete !== null,
  });

  // Fetch comparison athletes based on filters
  const comparisonQuery = useQuery({
    queryKey: ['comparisonAthletes', athlete?.id, comparisonFilters],
    queryFn: () => athlete ? getComparisonAthletes(athlete, comparisonFilters) : Promise.resolve([]),
    enabled: athlete !== null,
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setComparisonFilters(newFilters);
  };

  // Handle successful bib query
  useEffect(() => {
    if (!bibQuery.isPending) {
      if (bibQuery.data) {
        setAthlete(bibQuery.data);
        setSearchError(null);
        toast.success(`Found athlete: ${bibQuery.data.name}`);
      } else if (bibQuery.isError) {
        setSearchError("Error searching for athlete.");
        toast.error(`Error searching for athlete`);
      } else if (searchBib !== null && !bibQuery.isLoading) {
        setSearchError(`No athlete found with bib number ${searchBib}`);
        toast.error(`No athlete found with bib number ${searchBib}`);
      }
    }
  }, [bibQuery.data, bibQuery.isPending, bibQuery.isError, searchBib]);

  // Handle successful name query
  useEffect(() => {
    if (!nameQuery.isPending) {
      if (nameQuery.data && nameQuery.data.length > 0) {
        setAthlete(nameQuery.data[0]);
        setSearchError(null);
        toast.success(`Found athlete: ${nameQuery.data[0].name}`);
        if (nameQuery.data.length > 1) {
          toast.info(`${nameQuery.data.length - 1} more athletes match your search`);
        }
      } else if (nameQuery.isError) {
        setSearchError("Error searching for athlete.");
        toast.error(`Error searching for athlete`);
      } else if (searchQuery && !nameQuery.isLoading && nameQuery.data.length === 0) {
        setSearchError(`No athletes found matching "${searchQuery}"`);
        toast.error(`No athletes found matching "${searchQuery}"`);
      }
    }
  }, [nameQuery.data, nameQuery.isPending, nameQuery.isError, searchQuery]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If Escape key is pressed and an athlete is being displayed, return home
      if (event.key === 'Escape' && athlete !== null) {
        handleReturnHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [athlete]); // Re-add listener if athlete changes

  const handleSearch = async (query: string) => {
    // Reset state
    setAthlete(null);
    setSearchError(null);
    setSearchPerformed(true);
    
    console.log('Search query:', query);
    
    // Check if the query is a pure number, if so, search by bib number
    const isNumeric = /^\d+$/.test(query);
    
    if (isNumeric) {
      // Search by numeric bib
      setSearchQuery(null);
      setSearchBib(parseInt(query));
    } else {
      // Could be an alphanumeric bib (like M14) or a name
      // First check if it matches a bibNumber pattern
      const isBibPattern = /^[A-Za-z]\d+$/.test(query); // Pattern like M14, F9, etc.
      
      if (isBibPattern) {
        // Likely an elite bib number
        setSearchQuery(null);
        setSearchBib(query);
      } else {
        // Regular name search
        setSearchBib(null);
        setSearchQuery(query);
      }
    }
  };

  const isLoading = (bibQuery.isLoading || nameQuery.isLoading) && searchPerformed;
  const isComparisonLoading = startGroupsQuery.isLoading || 
                          categoriesQuery.isLoading || 
                          comparisonQuery.isLoading;
  
  const availableStartGroups = startGroupsQuery.data || [];
  const availableAgeGroups = categoriesQuery.data || [];
  const comparisonAthletes = comparisonQuery.data || [];

  const handleReturnHome = () => {
    // Clear athlete data and reset state to show the welcome screen
    setAthlete(null);
    setSearchQuery(null);
    setSearchBib(null);
    setSearchError(null);
    setSearchPerformed(false);
    
    // Reset filters
    setComparisonFilters({
      gender: 'all',
      startGroups: [],
      ageGroups: [],
      finishersOnly: true
    });
    
    // Optionally, update the URL to reflect the home state
    window.history.pushState({}, '', '/');
    
    // Show success toast
    toast.info("Returned to home page");
  };

  return (
    <div className="min-h-screen bg-vasasnow-dark">
      <Header 
        onSearch={handleSearch} 
        onReturnHome={handleReturnHome} 
        isAthleteView={athlete !== null} 
      />
      
      <main className="container mx-auto px-4 py-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-xl text-vasablue-dark">Loading athlete data...</p>
          </div>
        ) : searchError ? (
          <div className="text-center py-8 bg-red-100 p-4 rounded">
            <p className="text-xl text-red-600">{searchError}</p>
            <p className="mt-2">Try selecting an event first, then search again.</p>
          </div>
        ) : athlete ? (
          <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <span 
                className="hover:text-vasablue cursor-pointer" 
                onClick={handleReturnHome}
              >
                Home
              </span>
              <span className="mx-2">›</span>
              <span className="text-vasablue-dark font-medium">Athlete Details</span>
            </div>
            
            {/* Grid layout with athlete info on left, data content on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left column: Athlete card and filters */}
              <div className="lg:col-span-3 space-y-4">
                <AthleteCard athlete={athlete} />
                
                {/* Filter panel */}
                <div className="sticky top-4">
                  <FilterPanel 
                    athlete={athlete} 
                    availableStartGroups={availableStartGroups}
                    availableAgeGroups={availableAgeGroups}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              {/* Right column: Charts and data */}
              <div className="lg:col-span-9 space-y-4">
                {/* Statistical visualizations */}
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Statistical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isComparisonLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-gray-500">Loading comparison data...</p>
                      </div>
                    ) : comparisonAthletes.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-gray-500">No athletes match the current filters. Try adjusting your filters.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Filter description */}
                        <div className="mb-4">
                          <p className="text-sm mb-2">
                            Your results are being compared with {comparisonAthletes.length} athletes
                            {comparisonFilters.gender !== 'all' ? ` (${comparisonFilters.gender === 'M' ? 'men' : 'women'})` : ''}
                            {comparisonFilters.startGroups.length > 0 ? ` in start group${comparisonFilters.startGroups.length > 1 ? 's' : ''} ${comparisonFilters.startGroups.join(', ')}` : ''}
                            {comparisonFilters.ageGroups.length > 0 ? ` in age categor${comparisonFilters.ageGroups.length > 1 ? 'ies' : 'y'} ${comparisonFilters.ageGroups.join(', ')}` : ''}.
                          </p>
                        </div>
                        
                        {/* Data visualization tabs */}
                        <Tabs defaultValue="finish-time" className="w-full">
                          <TabsList className="mb-4">
                            <TabsTrigger value="finish-time">Finish Time Distribution</TabsTrigger>
                            <TabsTrigger value="pace">Pace by Checkpoint</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="finish-time" className="pt-2">
                            <div className="overflow-hidden">
                              <FinishTimeDistribution 
                                athlete={athlete} 
                                comparisonAthletes={comparisonAthletes}
                                filters={comparisonFilters}
                              />
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="pace" className="pt-2">
                            <div className="overflow-hidden">
                              <PaceViolinPlot 
                                athlete={athlete}
                                comparisonAthletes={comparisonAthletes}
                                filters={comparisonFilters}
                              />
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Race progress chart - moved to top */}
                <ProgressChart 
                  athlete={athlete} 
                  comparisonAthletes={comparisonAthletes}
                  filters={comparisonFilters}
                  isLoading={isComparisonLoading}
                />
                
                
                {/* Checkpoint table */}
                <CheckpointTable 
                  athlete={athlete} 
                  comparisonAthletes={comparisonAthletes}
                  filters={comparisonFilters}
                  isLoading={isComparisonLoading}
                />
              </div>
            </div>
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </main>
      
      <footer className="bg-vasablue text-white p-4 mt-6">
        <div className="container mx-auto text-center text-sm">
          <p>Vasaloppet Analytics — Data visualization for the world's largest cross-country ski race</p>
          <p className="text-xs mt-1 text-vasasnow-light/60">
            © {new Date().getFullYear()} — Using real data from Vasaloppet.se
          </p>
        </div>
      </footer>
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

export default Index;
