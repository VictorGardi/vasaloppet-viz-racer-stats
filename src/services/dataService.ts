
import { AthleteResult, CheckpointTime, RaceStatistics } from "../types/vasaloppet";

// Cache for loaded data
let athletesCache: AthleteResult[] | null = null;
let statisticsCache: RaceStatistics | null = null;

/**
 * Loads JSON data from a file in the public folder
 */
async function loadJsonData<T>(filename: string): Promise<T> {
  const response = await fetch(`/data/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load data from ${filename}: ${response.statusText}`);
  }
  return await response.json() as T;
}

/**
 * Loads athlete data from JSON file
 */
export async function loadAthletes(): Promise<AthleteResult[]> {
  if (athletesCache) {
    return athletesCache;
  }
  
  try {
    const athletes = await loadJsonData<AthleteResult[]>("athletes.json");
    athletesCache = athletes;
    return athletes;
  } catch (error) {
    console.error("Error loading athletes data:", error);
    throw error;
  }
}

/**
 * Loads race statistics from JSON file
 */
export async function loadRaceStatistics(): Promise<RaceStatistics> {
  if (statisticsCache) {
    return statisticsCache;
  }
  
  try {
    const statistics = await loadJsonData<RaceStatistics>("statistics.json");
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
export async function getAthleteByBib(bibNumber: number): Promise<AthleteResult | undefined> {
  const athletes = await loadAthletes();
  return athletes.find(athlete => athlete.bibNumber === bibNumber);
}

/**
 * Searches athletes by name or bib number
 */
export async function searchAthletes(query: string): Promise<AthleteResult[]> {
  const athletes = await loadAthletes();
  const normalizedQuery = query.toLowerCase();
  return athletes.filter(athlete => 
    athlete.name.toLowerCase().includes(normalizedQuery) || 
    athlete.bibNumber.toString() === normalizedQuery
  );
}

/**
 * Gets the top N athletes
 */
export async function getTopAthletes(count: number = 10): Promise<AthleteResult[]> {
  const athletes = await loadAthletes();
  return athletes.slice(0, count);
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
  
  // Time diff to winner
  const winnerTime = athletes[0].finishTimeSeconds;
  comparison.diffToWinner = athleteResult.finishTimeSeconds - winnerTime;
  
  // Time diff to average
  comparison.diffToAverage = athleteResult.finishTimeSeconds - statistics.finishTimes.avg;
  
  return comparison;
}
