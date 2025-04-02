import React from 'react';
import { Search, ChevronLeft, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSearch: (query: string) => void;
  onReturnHome?: () => void;
  isAthleteView?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onReturnHome, isAthleteView = false }) => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleLogoClick = () => {
    if (onReturnHome) {
      onReturnHome();
    }
  };

  return (
    <header className="bg-vasablue text-white p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            {isAthleteView && onReturnHome && (
              <Button 
                variant="ghost" 
                className="mr-2 text-white hover:bg-vasablue-dark hover:text-white"
                onClick={onReturnHome}
              >
                <ChevronLeft size={20} className="mr-1" />
                <span>Back</span>
              </Button>
            )}
            <div 
              className="flex flex-col cursor-pointer" 
              onClick={handleLogoClick}
              title="Return to Home"
            >
              <h1 className="text-2xl md:text-3xl font-bold">Vasaloppet Analytics</h1>
              <p className="text-sm md:text-base text-vasasnow-light/80">
                Visualize and compare race performance
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="w-full md:w-auto flex">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search by bib number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-black border-0 focus:ring-2 focus:ring-vasablue-light w-full md:w-64"
              />
            </div>
            <Button 
              type="submit"
              className="ml-2 bg-vasagold hover:bg-vasagold-dark text-black"
              disabled={!searchQuery.trim()}
            >
              <Search size={18} className="mr-1" />
              <span>Search</span>
            </Button>
            {isAthleteView && onReturnHome && (
              <Button 
                type="button"
                className="ml-2 bg-vasablue-light hover:bg-vasablue-dark text-white"
                onClick={onReturnHome}
              >
                <Home size={18} className="mr-1" />
                <span className="hidden md:inline">Home</span>
              </Button>
            )}
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
