
import React, { useState } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import AthleteCard from '@/components/AthleteCard';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import ProgressChart from '@/components/ProgressChart';
import CheckpointTable from '@/components/CheckpointTable';
import WelcomeScreen from '@/components/WelcomeScreen';
import { getAthleteByBib, searchAthletes } from '@/services/mockDataService';
import { AthleteResult } from '@/types/vasaloppet';

const Index = () => {
  const [athlete, setAthlete] = useState<AthleteResult | null>(null);

  const handleSearch = (query: string) => {
    // Check if the query is a number (bib number)
    const bibNumber = parseInt(query);
    if (!isNaN(bibNumber)) {
      const foundAthlete = getAthleteByBib(bibNumber);
      if (foundAthlete) {
        setAthlete(foundAthlete);
        toast.success(`Found athlete: ${foundAthlete.name}`);
      } else {
        toast.error(`No athlete found with bib number ${bibNumber}`);
      }
    } else {
      // Name search (simplified implementation)
      const results = searchAthletes(query);
      if (results.length > 0) {
        setAthlete(results[0]);
        toast.success(`Found athlete: ${results[0].name}`);
        if (results.length > 1) {
          toast.info(`${results.length - 1} more athletes match your search`);
        }
      } else {
        toast.error(`No athletes found matching "${query}"`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-vasasnow-dark">
      <Header onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8">
        {athlete ? (
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
