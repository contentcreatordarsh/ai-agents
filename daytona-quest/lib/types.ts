export type MissionDifficulty = "easy" | "medium" | "hard";

export type MissionDocRef = {
  section: string;
  path: string;
};

export type Mission = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  difficulty: MissionDifficulty;
  xp: number;
  docRef: MissionDocRef;
  order: number;
};

export type MissionRunResult = {
  missionId: string;
  title: string;
  success: boolean;
  xpEarned: number;
  durationMs: number;
  sandboxId?: string;
  output?: string;
  error?: string;
  completedAt: string;
};

export type PlayerState = {
  totalXp: number;
  level: number;
  completedMissions: string[];
  runs: MissionRunResult[];
  sandboxesSpawned: number;
};
