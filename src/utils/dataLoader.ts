type EventIndex = {
  [year: string]: {
    [eventId: string]: string
  }
};

type SplitData = {
  time: number;  // Time in seconds
  pace: number;  // Pace in minutes (fractional)
};

type EventData = {
  bib_number: string;
  age_class: string;
  start_group: string;
  splits: {
    [location: string]: SplitData;
  };
};

export async function getEventIndex(): Promise<EventIndex> {
  try {
    console.log('Fetching index.json...');
    const response = await fetch('/data/index.json');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error fetching index.json:', response.statusText);
      throw new Error(`Failed to load event index: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully loaded index data:', data);
    return data;
  } catch (error) {
    console.error('Error loading event index:', error);
    throw error;
  }
}

export async function getEventData(year: string, eventId: string): Promise<EventData[]> {
  try {
    // Updated path to match the real data structure
    const url = `/data/events/${year}/${eventId}.json`;
    console.log('Fetching event data from:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error(`Failed to load data for event ${eventId} from year ${year}: ${response.statusText}`);
      throw new Error(`Failed to load data for event ${eventId} from year ${year}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully loaded event data: ${eventId}, entries:`, data.length);
    return data;
  } catch (error) {
    console.error(`Error loading event data for ${year}/${eventId}:`, error);
    throw error;
  }
}

// Helper function to check if data is available
export async function isDataAvailable(): Promise<boolean> {
  try {
    const index = await getEventIndex();
    return Object.keys(index).length > 0;
  } catch (error) {
    console.error('Error checking data availability:', error);
    return false;
  }
}

// Helper functions to format data
export function formatTimeFromSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function formatPace(pace: number): string {
  if (!pace || isNaN(pace)) return "0:00";
  
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}