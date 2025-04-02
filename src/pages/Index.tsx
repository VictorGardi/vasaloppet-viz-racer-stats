
import React, { useState } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import AthleteCard from '@/components/AthleteCard';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import ProgressChart from '@/components/ProgressChart';
import CheckpointTable from '@/components/CheckpointTable';
import WelcomeScreen from '@/components/WelcomeScreen';
import { getAthleteByBib, searchAthletes } from '@/services/dataService';
import { AthleteResult } from '@/types/vasaloppet';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const [athlete, setAthlete] = useState<AthleteResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [searchBib, setSearchBib] = useState<number | null>(null);

  // Query for getting athlete by bib number
  const bibQuery = useQuery({
    queryKey: ['athlete', 'bib', searchBib],
    queryFn: () => searchBib ? getAthleteByBib(searchBib) : null,
    enabled: searchBib !== null,
    onSuccess: (data) => {
      if (data) {
        setAthlete(data);
        toast.success(`Found athlete: ${data.name}`);
      } else {
        toast.error(`No athlete found with bib number ${searchBib}`);
      }
    }
  });

  // Query for searching athletes by name
  const nameQuery = useQuery({
    queryKey: ['athletes', 'search', searchQuery],
    queryFn: () => searchQuery ? searchAthletes(searchQuery) : [],
    enabled: searchQuery !== null,
    onSuccess: (data) => {
      if (data.length > 0) {
        setAthlete(data[0]);
        toast.success(`Found athlete: ${data[0].name}`);
        if (data.length > 1) {
          toast.info(`${data.length - 1} more athletes match your search`);
        }
      } else {
        toast.error(`No athletes found matching "${searchQuery}"`);
      }
    }
  });

  const handleSearch = (query: string) => {
    // Check if the query is a number (bib number)
    const bibNumber = parseInt(query);
    if (!isNaN(bibNumber)) {
      setSearchQuery(null);
      setSearchBib(bibNumber);
    } else {
      // Name search
      setSearchBib(null);
      setSearchQuery(query);
    }
  };

  const isLoading = bibQuery.isLoading || nameQuery.isLoading;

  return (
    <div className="min-h-screen bg-vasasnow-dark">
      <Header onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-xl text-vasablue-dark">Loading athlete data...</p>
          </div>
        ) : athlete ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <AthleteCard athlete={athlete} />
              </div>
              <div className="md:col-span-2">
                <PerformanceMetrics athlete={athlete} />
              </div>
            </div>
            
            <ProgressChart athlete={athlete} />
            <CheckpointTable athlete={athlete} />
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </main>
      
      <footer className="bg-vasablue text-white p-4 mt-12">
        <div className="container mx-auto text-center text-sm">
          <p>Vasaloppet Analytics — Data visualization for the world's largest cross-country ski race</p>
          <p className="text-xs mt-1 text-vasasnow-light/60">
            © {new Date().getFullYear()} — This is a demo application with mock data
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
