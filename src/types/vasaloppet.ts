
export interface AthleteResult {
  id: number;
  bibNumber: number;
  name: string;
  club: string;
  nationality: string;
  finishTime: string; // Format: "HH:MM:SS"
  finishTimeSeconds: number;
  position: number;
  gender: "M" | "F";
  category: string;
  year: number;
  checkpoints: CheckpointTime[];
}

export interface CheckpointTime {
  name: string;
  distance: number; // km from start
  time: string; // Format: "HH:MM:SS"
  timeSeconds: number;
  position: number;
  relativeToBest: number; // seconds behind the best at this checkpoint
  relativeToAverage: number; // seconds relative to average (negative = faster)
}

export interface AthleteStat {
  name: string;
  value: string | number;
  comparison?: {
    value: string | number;
    type: "better" | "worse" | "neutral";
    percentage?: number;
  };
}

export interface DataRange {
  min: number;
  max: number;
  avg: number;
}

export interface RaceStatistics {
  finishTimes: DataRange;
  paces: DataRange; // in seconds per km
  totalFinishers: number;
  dnfCount: number;
  checkpointStats: Record<string, DataRange>;
}
