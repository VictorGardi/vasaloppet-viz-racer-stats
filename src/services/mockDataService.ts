
import { AthleteResult, CheckpointTime, RaceStatistics } from "../types/vasaloppet";

// Checkpoints in Vasaloppet
const checkpoints = [
  { name: "Start (Sälen)", distance: 0 },
  { name: "Smågan", distance: 11 },
  { name: "Mångsbodarna", distance: 24 },
  { name: "Risberg", distance: 35 },
  { name: "Evertsberg", distance: 48 },
  { name: "Oxberg", distance: 62 },
  { name: "Hökberg", distance: 71 },
  { name: "Eldris", distance: 81 },
  { name: "Finish (Mora)", distance: 90 }
];

// Helper function to convert HH:MM:SS to seconds
const timeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

// Helper function to convert seconds to HH:MM:SS
const secondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Generate random checkpoint times for an athlete
const generateCheckpointTimes = (
  basePaceSecondsPerKm: number, 
  deteriorationFactor: number
): CheckpointTime[] => {
  const checkpointTimes: CheckpointTime[] = [];
  let cumulativeTime = 0;
  
  checkpoints.forEach((checkpoint, index) => {
    if (index === 0) { // Start
      checkpointTimes.push({
        name: checkpoint.name,
        distance: checkpoint.distance,
        time: "00:00:00",
        timeSeconds: 0,
        position: Math.floor(Math.random() * 50) + 1,
        relativeToBest: 0,
        relativeToAverage: 0
      });
      return;
    }
    
    const segmentDistance = checkpoint.distance - checkpoints[index - 1].distance;
    const paceForSegment = basePaceSecondsPerKm * (1 + (deteriorationFactor * (index / checkpoints.length)));
    const segmentTimeSeconds = Math.floor(segmentDistance * paceForSegment);
    cumulativeTime += segmentTimeSeconds;
    
    const position = Math.floor(Math.random() * 100) + (index * 5);
    const relativeToBest = Math.floor(Math.random() * 600) + (index * 120);
    const relativeToAverage = Math.floor((Math.random() * 400) - 200);
    
    checkpointTimes.push({
      name: checkpoint.name,
      distance: checkpoint.distance,
      time: secondsToTime(cumulativeTime),
      timeSeconds: cumulativeTime,
      position,
      relativeToBest,
      relativeToAverage
    });
  });
  
  return checkpointTimes;
};

// Create a set of mock athlete results
const generateMockAthletes = (count: number): AthleteResult[] => {
  const athletes: AthleteResult[] = [];
  const firstNames = ["Erik", "Anders", "Johan", "Lars", "Nils", "Maria", "Anna", "Eva", "Karin", "Sofia", "Oskar", "Gustav"];
  const lastNames = ["Johansson", "Andersson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson"];
  const clubs = ["IFK Stockholm", "Mora IK", "Falun-Borlänge SK", "Åre Slalomklubb", "Uppsala SK", "Sundsvall SK"];
  const nationalities = ["SWE", "NOR", "FIN", "RUS", "ITA", "GER", "FRA"];
  const currentYear = new Date().getFullYear();
  
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = firstName.endsWith('a') ? "F" : "M" as "M" | "F";
    const basePace = Math.floor(Math.random() * 60) + 180; // 3-4 minutes per km
    const deterioration = Math.random() * 0.3; // 0-30% deterioration as race progresses
    const checkpointResults = generateCheckpointTimes(basePace, deterioration);
    const finishTime = checkpointResults[checkpointResults.length - 1].time;
    const finishTimeSeconds = checkpointResults[checkpointResults.length - 1].timeSeconds;
    
    athletes.push({
      id: i,
      bibNumber: i * 100 + Math.floor(Math.random() * 100),
      name: `${firstName} ${lastName}`,
      club: clubs[Math.floor(Math.random() * clubs.length)],
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      finishTime,
      finishTimeSeconds,
      position: i,
      gender,
      category: gender === "M" ? "Men " + (Math.floor(i / 20) + 1) : "Women " + (Math.floor(i / 10) + 1),
      year: currentYear,
      checkpoints: checkpointResults
    });
  }
  
  // Sort by finish time
  athletes.sort((a, b) => a.finishTimeSeconds - b.finishTimeSeconds);
  
  // Update positions
  athletes.forEach((athlete, index) => {
    athlete.position = index + 1;
  });
  
  return athletes;
};

// Generate statistics for the race
const generateRaceStatistics = (athletes: AthleteResult[]): RaceStatistics => {
  const finishTimes = athletes.map(a => a.finishTimeSeconds);
  const paces = athletes.map(a => a.finishTimeSeconds / 90); // 90 km race
  
  const checkpointStats: Record<string, { min: number; max: number; avg: number }> = {};
  
  if (athletes.length > 0 && athletes[0].checkpoints) {
    athletes[0].checkpoints.forEach(cp => {
      if (cp.distance > 0) { // Skip start
        const times = athletes.map(a => {
          const checkpoint = a.checkpoints.find(c => c.name === cp.name);
          return checkpoint ? checkpoint.timeSeconds : 0;
        }).filter(t => t > 0);
        
        checkpointStats[cp.name] = {
          min: Math.min(...times),
          max: Math.max(...times),
          avg: times.reduce((sum, time) => sum + time, 0) / times.length
        };
      }
    });
  }
  
  return {
    finishTimes: {
      min: Math.min(...finishTimes),
      max: Math.max(...finishTimes),
      avg: finishTimes.reduce((sum, time) => sum + time, 0) / finishTimes.length
    },
    paces: {
      min: Math.min(...paces),
      max: Math.max(...paces),
      avg: paces.reduce((sum, pace) => sum + pace, 0) / paces.length
    },
    totalFinishers: athletes.length,
    dnfCount: Math.floor(athletes.length * 0.1), // 10% DNF rate
    checkpointStats
  };
};

// Generate mock data
const mockAthletes = generateMockAthletes(200);
const mockStatistics = generateRaceStatistics(mockAthletes);

// Service functions
export const getAthleteByBib = (bibNumber: number): AthleteResult | undefined => {
  return mockAthletes.find(athlete => athlete.bibNumber === bibNumber);
};

export const searchAthletes = (query: string): AthleteResult[] => {
  const normalizedQuery = query.toLowerCase();
  return mockAthletes.filter(athlete => 
    athlete.name.toLowerCase().includes(normalizedQuery) || 
    athlete.bibNumber.toString() === normalizedQuery
  );
};

export const getTopAthletes = (count: number = 10): AthleteResult[] => {
  return mockAthletes.slice(0, count);
};

export const getRaceStatistics = (): RaceStatistics => {
  return mockStatistics;
};

export const getComparisonToField = (athleteResult: AthleteResult): Record<string, number> => {
  const comparison: Record<string, number> = {};
  
  // Calculate percentile
  const position = athleteResult.position;
  const percentile = 100 - ((position / mockAthletes.length) * 100);
  comparison.percentile = Math.round(percentile);
  
  // Time diff to winner
  const winnerTime = mockAthletes[0].finishTimeSeconds;
  comparison.diffToWinner = athleteResult.finishTimeSeconds - winnerTime;
  
  // Time diff to average
  comparison.diffToAverage = athleteResult.finishTimeSeconds - mockStatistics.finishTimes.avg;
  
  return comparison;
};
