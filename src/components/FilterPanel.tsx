import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AthleteResult } from '@/types/vasaloppet';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  gender: 'all' | 'M' | 'F';
  startGroups: string[];
  ageGroups: string[];
  finishersOnly: boolean;
}

interface FilterPanelProps {
  athlete: AthleteResult;
  availableStartGroups: string[];
  availableAgeGroups: string[];
  onChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  athlete,
  availableStartGroups,
  availableAgeGroups,
  onChange,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    gender: 'all',
    startGroups: [],
    ageGroups: [],
    finishersOnly: true
  });

  // When athlete changes, reset filters
  useEffect(() => {
    setFilters({
      gender: 'all',
      startGroups: [],
      ageGroups: [],
      finishersOnly: true
    });
  }, [athlete.id]);

  // When filters change, notify parent
  useEffect(() => {
    onChange(filters);
  }, [filters, onChange]);

  const handleGenderChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      gender: value as 'all' | 'M' | 'F'
    }));
  };
  
  const handleFinishersOnlyChange = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      finishersOnly: checked
    }));
  };
  
  const handleStartGroupSelect = (value: string) => {
    // Check if already selected
    const isSelected = filters.startGroups.includes(value);
    
    if (isSelected) {
      // Remove from selection
      setFilters(prev => ({
        ...prev,
        startGroups: prev.startGroups.filter(group => group !== value)
      }));
    } else {
      // Add to selection
      setFilters(prev => ({
        ...prev,
        startGroups: [...prev.startGroups, value]
      }));
    }
  };
  
  const handleAgeGroupSelect = (value: string) => {
    // Check if already selected
    const isSelected = filters.ageGroups.includes(value);
    
    if (isSelected) {
      // Remove from selection
      setFilters(prev => ({
        ...prev,
        ageGroups: prev.ageGroups.filter(group => group !== value)
      }));
    } else {
      // Add to selection
      setFilters(prev => ({
        ...prev,
        ageGroups: [...prev.ageGroups, value]
      }));
    }
  };
  
  const clearStartGroups = () => {
    setFilters(prev => ({
      ...prev,
      startGroups: []
    }));
  };
  
  const clearAgeGroups = () => {
    setFilters(prev => ({
      ...prev,
      ageGroups: []
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      gender: 'all',
      startGroups: [],
      ageGroups: [],
      finishersOnly: true
    });
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Comparison Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Gender filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Gender</Label>
          <RadioGroup
            defaultValue="all"
            value={filters.gender}
            onValueChange={handleGenderChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="M" id="men" />
              <Label htmlFor="men" className="cursor-pointer">Men</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="F" id="women" />
              <Label htmlFor="women" className="cursor-pointer">Women</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Start groups multi-select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Start Groups</Label>
            {filters.startGroups.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearStartGroups} 
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between",
                  filters.startGroups.length > 0
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {filters.startGroups.length > 0
                  ? `${filters.startGroups.length} selected`
                  : "Select start groups"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search groups..." />
                <CommandList>
                  <CommandEmpty>No groups found.</CommandEmpty>
                  <CommandGroup>
                    {availableStartGroups.map((group) => (
                      <CommandItem
                        key={group}
                        value={group}
                        onSelect={() => handleStartGroupSelect(group)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.startGroups.includes(group)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {group}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {filters.startGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.startGroups.map(group => (
                <Badge key={group} variant="secondary" className="px-2 py-1">
                  {group}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleStartGroupSelect(group)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Age groups multi-select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Age Categories</Label>
            {filters.ageGroups.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAgeGroups} 
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between",
                  filters.ageGroups.length > 0
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {filters.ageGroups.length > 0
                  ? `${filters.ageGroups.length} selected`
                  : "Select age categories"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandList>
                  <CommandEmpty>No categories found.</CommandEmpty>
                  <CommandGroup>
                    {availableAgeGroups.map((category) => (
                      <CommandItem
                        key={category}
                        value={category}
                        onSelect={() => handleAgeGroupSelect(category)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.ageGroups.includes(category)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {category}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {filters.ageGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.ageGroups.map(category => (
                <Badge key={category} variant="secondary" className="px-2 py-1">
                  {category}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleAgeGroupSelect(category)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Finishers Only checkbox */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="finishers-only" 
              checked={filters.finishersOnly}
              onCheckedChange={handleFinishersOnlyChange}
            />
            <Label htmlFor="finishers-only" className="cursor-pointer">Show finishers only</Label>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button
          variant="outline"
          className="w-full"
          onClick={resetFilters}
        >
          Reset All Filters
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FilterPanel; 