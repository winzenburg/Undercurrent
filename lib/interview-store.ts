import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'career_discovery_interview';

export interface OdysseyRatings {
  path_a: { engagement: number; energy: number; confidence: number; coherence: number };
  path_b: { engagement: number; energy: number; confidence: number; coherence: number };
  path_c: { engagement: number; energy: number; confidence: number; coherence: number };
}

export interface CareerCanvasData {
  key_resources: string;
  key_activities: string;
  value_proposition: string;
  customers: string;
  channels: string;
  revenue_streams: string;
  key_partners: string;
  cost_structure: string;
}

export interface NextStep {
  action: string;
  deadline: string;
}

export interface InterviewState {
  userName: string;
  startedAt: string | null;
  currentQuestionId: number;
  completedSections: number[];
  answers: Record<number, string>;
  aiResponses: Record<number, string>;
  odysseyPaths: {
    path_a: string;
    path_b: string;
    path_c: string;
  };
  odysseyRatings: OdysseyRatings;
  careerCanvas: CareerCanvasData;
  nextSteps: NextStep[];
  isComplete: boolean;
}

const DEFAULT_STATE: InterviewState = {
  userName: '',
  startedAt: null,
  currentQuestionId: 1,
  completedSections: [],
  answers: {},
  aiResponses: {},
  odysseyPaths: { path_a: '', path_b: '', path_c: '' },
  odysseyRatings: {
    path_a: { engagement: 0, energy: 0, confidence: 0, coherence: 0 },
    path_b: { engagement: 0, energy: 0, confidence: 0, coherence: 0 },
    path_c: { engagement: 0, energy: 0, confidence: 0, coherence: 0 },
  },
  careerCanvas: {
    key_resources: '',
    key_activities: '',
    value_proposition: '',
    customers: '',
    channels: '',
    revenue_streams: '',
    key_partners: '',
    cost_structure: '',
  },
  nextSteps: [
    { action: '', deadline: '' },
    { action: '', deadline: '' },
    { action: '', deadline: '' },
  ],
  isComplete: false,
};

export async function loadInterviewState(): Promise<InterviewState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveInterviewState(state: InterviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save interview state', e);
  }
}

export async function clearInterviewState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear interview state', e);
  }
}

export function hasProgress(state: InterviewState): boolean {
  return (
    state.startedAt !== null &&
    (Object.keys(state.answers).length > 0 || state.currentQuestionId > 1)
  );
}
