
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-vasablue text-white p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold">Vasaloppet Analytics</h1>
            <p className="text-sm md:text-base text-vasasnow-light/80">
              Visualize and compare race performance
            </p>
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
            >
              <Search size={18} className="mr-1" />
              <span>Search</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
