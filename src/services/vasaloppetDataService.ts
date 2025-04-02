import { getEventIndex, getEventData, formatTimeFromSeconds, formatPace } from "@/utils/dataLoader";
import { AthleteResult, CheckpointTime, RaceStatistics } from "@/types/vasaloppet";
import { FilterOptions } from '@/components/FilterPanel';

// Cache for loaded data
let athletesCache: AthleteResult[] | null = null;
let statisticsCache: RaceStatistics | null = null;
let selectedYear: string | null = null;
let selectedEvent: string | null = null;

/**
 * Sets the selected year and event for data loading
 */
export async function setSelectedEvent(year: string, eventId: string): Promise<void> {
  selectedYear = year;
  selectedEvent = eventId;
  // Clear caches when changing events
  athletesCache = null;
  statisticsCache = null;
}

/**
 * Get available events from the index
 */
export async function getAvailableEvents() {
  try {
    console.log('Loading event index from:', '/data/index.json');
    const index = await getEventIndex();
    console.log('Loaded events index:', index);
    return index;
  } catch (error) {
    console.error('Error loading event index:', error);
    return {};
  }
}

/**
 * Transforms raw scraped data into athlete results format
 */
function transformData(rawData: any[]): AthleteResult[] {
  // Convert the raw data to our application's format
  return rawData.map((item, index) => {
    // Extract checkpoint data from splits
    const checkpointEntries = Object.entries(item.splits || {});
    
    // Create standard checkpoints
    const checkpoints: CheckpointTime[] = checkpointEntries.map(([location, data]: [string, any], idx) => {
      // Extract rough distance from checkpoint name
      let distance = 0;
      // Map common checkpoint names to approximate distances
      if (location === "Högsta punkten") distance = 3;
      else if (location === "Smågan") distance = 11;
      else if (location === "Mångsbodarna") distance = 24;
      else if (location === "Risberg") distance = 35;
      else if (location === "Evertsberg") distance = 47;
      else if (location === "Oxberg") distance = 62;
      else if (location === "Hökberg") distance = 71;
      else if (location === "Eldris") distance = 81;
      else if (location === "Mora Förvarning") distance = 89;
      else if (location === "Finish") distance = 90;
      
      return {
        name: location,
        distance: distance,
        time: formatTimeFromSeconds(data.time),
        timeSeconds: data.time,
        position: 0, // Will calculate later
        relativeToBest: 0, // Will calculate later
        relativeToAverage: 0 // Will calculate later
      };
    });

    // Sort checkpoints by time (earlier checkpoints first)
    checkpoints.sort((a, b) => a.timeSeconds - b.timeSeconds);
    
    // Determine if the athlete finished (has a "Finish" checkpoint)
    const finishCheckpoint = checkpoints.find(cp => cp.name === "Finish");
    // If no finish checkpoint, set finishTimeSeconds to 0 to indicate DNF
    const finishTimeSeconds = finishCheckpoint ? finishCheckpoint.timeSeconds : 0;

    // Figure out gender based on age class
    const gender = item.age_class?.startsWith('D') ? 'F' : 'M';
    
    // Generate a unique ID if not present
    const id = `${item.bib_number}-${selectedYear}-${selectedEvent}`;
    
    // Handle bib number properly - keep original format if it exists
    let bibNumber = "0";
    if (item.bib_number && item.bib_number !== "nan") {
      // Keep the original string value
      bibNumber = String(item.bib_number);
    } else {
      // Generate a placeholder for missing bibs
      bibNumber = "?";
    }
    
    // For name display, use original bib if available, otherwise create a placeholder
    const displayName = item.bib_number && item.bib_number !== "nan" 
      ? `Athlete ${item.bib_number}` 
      : `Athlete (no bib)`;
    
    // Extract other information
    return {
      id: id,
      bibNumber: bibNumber,
      name: displayName,
      club: item.team || '',
      nationality: '',
      category: item.age_class || '',
      startGroup: item.start_group || '',
      year: selectedYear ? parseInt(selectedYear) : new Date().getFullYear(),
      eventId: selectedEvent || '',
      gender: gender,
      position: 0, // Will calculate later
      finishTimeSeconds,
      finishTime: formatTimeFromSeconds(finishTimeSeconds),
      checkpoints,
    };
  });
}

/**
 * Calculate race statistics from a set of athletes
 */
function calculateStatistics(athletes: AthleteResult[]): RaceStatistics {
  // Get finish times
  const finishTimes = athletes.map(a => a.finishTimeSeconds).filter(time => time > 0);
  
  // Calculate min/max/avg
  const min = Math.min(...finishTimes);
  const max = Math.max(...finishTimes);
  const avg = finishTimes.reduce((sum, time) => sum + time, 0) / finishTimes.length;

  // Calculate pace data (seconds per km)
  const paces: number[] = [];
  athletes.forEach(athlete => {
    if (athlete.checkpoints.length > 0) {
      const lastCheckpoint = athlete.checkpoints[athlete.checkpoints.length - 1];
      if (lastCheckpoint.distance > 0) {
        const paceInSeconds = athlete.finishTimeSeconds / lastCheckpoint.distance;
        paces.push(paceInSeconds);
      }
    }
  });

  const minPace = paces.length > 0 ? Math.min(...paces) : 0;
  const maxPace = paces.length > 0 ? Math.max(...paces) : 0;
  const avgPace = paces.length > 0 
    ? paces.reduce((sum, pace) => sum + pace, 0) / paces.length 
    : 0;

  // Calculate checkpoint statistics
  const checkpointStats: Record<string, { min: number; max: number; avg: number }> = {};
  
  // Get all checkpoint names
  const checkpointNames = new Set<string>();
  athletes.forEach(athlete => {
    athlete.checkpoints.forEach(cp => {
      checkpointNames.add(cp.name);
    });
  });
  
  // Calculate stats for each checkpoint
  checkpointNames.forEach(name => {
    const times = athletes
      .flatMap(a => a.checkpoints.filter(cp => cp.name === name))
      .map(cp => cp.timeSeconds)
      .filter(time => time > 0);
    
    if (times.length > 0) {
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      checkpointStats[name] = { min, max, avg };
    }
  });

  // Calculate relative times to best and average for each athlete
  athletes.forEach(athlete => {
    athlete.checkpoints.forEach(cp => {
      const stats = checkpointStats[cp.name];
      if (stats) {
        cp.relativeToBest = cp.timeSeconds - stats.min;
        cp.relativeToAverage = cp.timeSeconds - stats.avg;
      }
    });
  });

  return {
    finishTimes: { min, max, avg },
    paces: { min: minPace, max: maxPace, avg: avgPace },
    totalFinishers: athletes.filter(a => a.finishTimeSeconds > 0).length,
    dnfCount: athletes.filter(a => a.finishTimeSeconds === 0).length,
    checkpointStats
  };
}

/**
 * Loads athlete data from the selected event
 */
export async function loadAthletes(): Promise<AthleteResult[]> {
  if (athletesCache) {
    return athletesCache;
  }
  
  console.log('Loading athletes, selected year:', selectedYear, 'selected event:', selectedEvent);
  
  // Check if an event is selected
  if (!selectedYear || !selectedEvent) {
    console.log('No event selected, trying to load from index');
    const index = await getEventIndex();
    console.log('Loaded index for auto-selection:', index);
    // Use first available event if none selected
    const years = Object.keys(index);
    if (years.length === 0) {
      console.error('No years available in index');
      throw new Error("No events available");
    }
    
    // Sort years in descending order to get the most recent first
    years.sort((a, b) => parseInt(b) - parseInt(a));
    selectedYear = years[0];
    
    const events = Object.keys(index[selectedYear]);
    if (events.length === 0) {
      console.error(`No events available for year ${selectedYear}`);
      throw new Error(`No events available for year ${selectedYear}`);
    }
    
    // Try to find main Vasaloppet event first, otherwise take first event
    selectedEvent = events.find(e => e.startsWith('VL_')) || events[0];
    console.log('Auto-selected year:', selectedYear, 'event:', selectedEvent);
  }
  
  try {
    console.log(`Loading data for ${selectedYear}/${selectedEvent}`);
    const rawData = await getEventData(selectedYear, selectedEvent);
    console.log(`Loaded raw data, length: ${rawData.length}`);
    
    const athletes = transformData(rawData);
    console.log(`Transformed data into ${athletes.length} athletes`);
    
    // Sort athletes by finish time and assign overall positions
    athletes.sort((a, b) => a.finishTimeSeconds - b.finishTimeSeconds);
    athletes.forEach((athlete, index) => {
      athlete.position = index + 1;
    });
    
    // Calculate checkpoint positions for each checkpoint name
    const checkpointNames = new Set<string>();
    athletes.forEach(athlete => {
      athlete.checkpoints.forEach(cp => {
        checkpointNames.add(cp.name);
      });
    });
    
    // For each checkpoint, sort athletes by their time at that checkpoint and assign positions
    checkpointNames.forEach(checkpointName => {
      // Collect all athletes' data for this checkpoint
      const checkpointData = athletes
        .map(athlete => {
          const checkpoint = athlete.checkpoints.find(cp => cp.name === checkpointName);
          return checkpoint ? { athlete, checkpoint } : null;
        })
        .filter(data => data !== null && data.checkpoint.timeSeconds > 0);
      
      // Sort by time at this checkpoint
      checkpointData.sort((a, b) => a!.checkpoint.timeSeconds - b!.checkpoint.timeSeconds);
      
      // Assign position at this checkpoint
      checkpointData.forEach((data, index) => {
        if (data) {
          data.checkpoint.position = index + 1;
        }
      });
    });
    
    // Calculate statistics first to populate relative values
    const stats = calculateStatistics(athletes);
    console.log('Calculated statistics');
    
    athletesCache = athletes;
    return athletes;
  } catch (error) {
    console.error("Error loading athletes data:", error);
    throw error;
  }
}

/**
 * Loads race statistics
 */
export async function loadRaceStatistics(): Promise<RaceStatistics> {
  if (statisticsCache) {
    return statisticsCache;
  }
  
  try {
    // Make sure we have a selected event
    if (!selectedYear || !selectedEvent) {
      const index = await getEventIndex();
      const years = Object.keys(index);
      years.sort((a, b) => parseInt(b) - parseInt(a));
      selectedYear = years[0];
      const events = Object.keys(index[selectedYear]);
      selectedEvent = events.find(e => e.startsWith('VL_')) || events[0];
    }
    
    // Calculate statistics from athletes
    const athletes = await loadAthletes();
    const statistics = calculateStatistics(athletes);
    statisticsCache = statistics;
    return statistics;
  } catch (error) {
    console.error("Error loading race statistics:", error);
    throw error;
  }
}

/**
 * Gets an athlete by bib number
 */
export async function getAthleteByBib(bibNumber: number | string): Promise<AthleteResult | undefined> {
  const athletes = await loadAthletes();
  return athletes.find(athlete => athlete.bibNumber === String(bibNumber));
}

/**
 * Searches athletes by name or bib number
 */
export async function searchAthletes(query: string): Promise<AthleteResult[]> {
  const athletes = await loadAthletes();
  const normalizedQuery = query.toLowerCase();
  return athletes.filter(athlete => 
    athlete.name.toLowerCase().includes(normalizedQuery) || 
    athlete.bibNumber.toLowerCase() === normalizedQuery.toLowerCase()
  );
}

/**
 * Gets the top N athletes, optionally filtered by gender
 */
export async function getTopAthletes(count: number = 10, gender?: 'M' | 'F'): Promise<AthleteResult[]> {
  const athletes = await loadAthletes();
  
  // Filter out DNF athletes (those with finishTimeSeconds = 0)
  let finishers = athletes.filter(athlete => athlete.finishTimeSeconds > 0);
  
  // Apply gender filter if specified
  if (gender) {
    finishers = finishers.filter(athlete => athlete.gender === gender);
    
    // Recalculate positions for gender-specific rankings
    // Make a deep copy of the filtered athletes to avoid modifying the cached data
    finishers = finishers.map((athlete, index) => ({
      ...athlete,
      position: index + 1 // Assign positions 1-N within this gender group
    }));
  }
  
  // Return the top N finishers
  return finishers.slice(0, count);
}

/**
 * Gets comparison metrics for an athlete compared to the field
 */
export async function getComparisonToField(athleteResult: AthleteResult): Promise<Record<string, number>> {
  const athletes = await loadAthletes();
  const statistics = await loadRaceStatistics();
  
  const comparison: Record<string, number> = {};
  
  // Calculate percentile
  const position = athleteResult.position;
  const percentile = 100 - ((position / athletes.length) * 100);
  comparison.percentile = Math.round(percentile);
  
  // Time diff to winner - filtering out DNF athletes
  const finishers = athletes.filter(athlete => athlete.finishTimeSeconds > 0);
  const winnerTime = finishers.length > 0 
    ? Math.min(...finishers.map(a => a.finishTimeSeconds))
    : 0;
  comparison.diffToWinner = athleteResult.finishTimeSeconds - winnerTime;
  
  // Time diff to average
  comparison.diffToAverage = athleteResult.finishTimeSeconds - statistics.finishTimes.avg;
  
  return comparison;
}

/**
 * Gets available start groups from the current event
 */
export async function getAvailableStartGroups(): Promise<string[]> {
  const athletes = await loadAthletes();
  
  // Extract unique start groups
  const startGroups = new Set<string>();
  athletes.forEach(athlete => {
    if (athlete.startGroup) {
      startGroups.add(athlete.startGroup);
    }
  });
  
  // Convert to array and sort numerically
  return Array.from(startGroups).sort((a, b) => {
    // Extract numbers from the strings
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    
    // If both are numbers, sort numerically
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // If one or both are not numbers (e.g., "Elite"), use string comparison
    return a.localeCompare(b);
  });
}

/**
 * Gets available age categories from the current event
 */
export async function getAvailableAgeCategories(): Promise<string[]> {
  const athletes = await loadAthletes();
  
  // Extract unique age categories
  const categories = new Set<string>();
  athletes.forEach(athlete => {
    if (athlete.category) {
      categories.add(athlete.category);
    }
  });
  
  // Convert to array and sort
  return Array.from(categories).sort();
}

/**
 * Gets comparison athletes based on filter options
 */
export async function getComparisonAthletes(
  currentAthlete: AthleteResult,
  filters: FilterOptions
): Promise<AthleteResult[]> {
  const athletes = await loadAthletes();
  
  // Don't include the current athlete in the comparison group
  let filtered = athletes.filter(a => a.id !== currentAthlete.id);
  
  // Apply gender filter
  if (filters.gender !== 'all') {
    filtered = filtered.filter(a => a.gender === filters.gender);
  }
  
  // Apply start group filter if any are selected
  if (filters.startGroups.length > 0) {
    filtered = filtered.filter(a => filters.startGroups.includes(a.startGroup));
  }
  
  // Apply age category filter if any are selected
  if (filters.ageGroups.length > 0) {
    filtered = filtered.filter(a => filters.ageGroups.includes(a.category));
  }
  
  // Apply finishers only filter
  if (filters.finishersOnly) {
    filtered = filtered.filter(a => a.finishTimeSeconds > 0);
  }
  
  return filtered;
}