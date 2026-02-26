import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import {
  InterviewState,
  OdysseyRatings,
  CareerCanvasData,
  NextStep,
  loadInterviewState,
  saveInterviewState,
  clearInterviewState,
} from './interview-store';

type Action =
  | { type: 'LOAD'; payload: InterviewState }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'START_INTERVIEW' }
  | { type: 'SET_ANSWER'; questionId: number; answer: string }
  | { type: 'SET_AI_RESPONSE'; questionId: number; response: string }
  | { type: 'SET_CURRENT_QUESTION'; questionId: number }
  | { type: 'COMPLETE_SECTION'; sectionId: number }
  | { type: 'SET_ODYSSEY_PATH'; pathId: 'path_a' | 'path_b' | 'path_c'; text: string }
  | { type: 'SET_ODYSSEY_RATING'; pathId: keyof OdysseyRatings; dimension: string; value: number }
  | { type: 'SET_CAREER_CANVAS'; field: keyof CareerCanvasData; value: string }
  | { type: 'SET_NEXT_STEP'; index: number; step: NextStep }
  | { type: 'SET_COMPLETE' }
  | { type: 'RESET' };

function reducer(state: InterviewState, action: Action): InterviewState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload };
    case 'START_INTERVIEW':
      return { ...state, startedAt: new Date().toISOString() };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
      };
    case 'SET_AI_RESPONSE':
      return {
        ...state,
        aiResponses: { ...state.aiResponses, [action.questionId]: action.response },
      };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestionId: action.questionId };
    case 'COMPLETE_SECTION':
      if (state.completedSections.includes(action.sectionId)) return state;
      return {
        ...state,
        completedSections: [...state.completedSections, action.sectionId],
      };
    case 'SET_ODYSSEY_PATH':
      return {
        ...state,
        odysseyPaths: { ...state.odysseyPaths, [action.pathId]: action.text },
      };
    case 'SET_ODYSSEY_RATING':
      return {
        ...state,
        odysseyRatings: {
          ...state.odysseyRatings,
          [action.pathId]: {
            ...state.odysseyRatings[action.pathId],
            [action.dimension]: action.value,
          },
        },
      };
    case 'SET_CAREER_CANVAS':
      return {
        ...state,
        careerCanvas: { ...state.careerCanvas, [action.field]: action.value },
      };
    case 'SET_NEXT_STEP': {
      const steps = [...state.nextSteps];
      steps[action.index] = action.step;
      return { ...state, nextSteps: steps };
    }
    case 'SET_COMPLETE':
      return { ...state, isComplete: true };
    case 'RESET':
      return {
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
    default:
      return state;
  }
}

interface InterviewContextValue {
  state: InterviewState;
  isLoaded: boolean;
  setUserName: (name: string) => void;
  startInterview: () => void;
  setAnswer: (questionId: number, answer: string) => void;
  setAiResponse: (questionId: number, response: string) => void;
  setCurrentQuestion: (questionId: number) => void;
  completeSection: (sectionId: number) => void;
  setOdysseyPath: (pathId: 'path_a' | 'path_b' | 'path_c', text: string) => void;
  setOdysseyRating: (pathId: keyof OdysseyRatings, dimension: string, value: number) => void;
  setCareerCanvas: (field: keyof CareerCanvasData, value: string) => void;
  setNextStep: (index: number, step: NextStep) => void;
  setComplete: () => void;
  reset: () => void;
}

const InterviewContext = createContext<InterviewContextValue | null>(null);

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
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
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadInterviewState().then((loaded) => {
      dispatch({ type: 'LOAD', payload: loaded });
      setIsLoaded(true);
    });
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveInterviewState(state);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, isLoaded]);

  const setUserName = useCallback((name: string) => dispatch({ type: 'SET_USER_NAME', payload: name }), []);
  const startInterview = useCallback(() => dispatch({ type: 'START_INTERVIEW' }), []);
  const setAnswer = useCallback((questionId: number, answer: string) => dispatch({ type: 'SET_ANSWER', questionId, answer }), []);
  const setAiResponse = useCallback((questionId: number, response: string) => dispatch({ type: 'SET_AI_RESPONSE', questionId, response }), []);
  const setCurrentQuestion = useCallback((questionId: number) => dispatch({ type: 'SET_CURRENT_QUESTION', questionId }), []);
  const completeSection = useCallback((sectionId: number) => dispatch({ type: 'COMPLETE_SECTION', sectionId }), []);
  const setOdysseyPath = useCallback((pathId: 'path_a' | 'path_b' | 'path_c', text: string) => dispatch({ type: 'SET_ODYSSEY_PATH', pathId, text }), []);
  const setOdysseyRating = useCallback((pathId: keyof OdysseyRatings, dimension: string, value: number) => dispatch({ type: 'SET_ODYSSEY_RATING', pathId, dimension, value }), []);
  const setCareerCanvas = useCallback((field: keyof CareerCanvasData, value: string) => dispatch({ type: 'SET_CAREER_CANVAS', field, value }), []);
  const setNextStep = useCallback((index: number, step: NextStep) => dispatch({ type: 'SET_NEXT_STEP', index, step }), []);
  const setComplete = useCallback(() => dispatch({ type: 'SET_COMPLETE' }), []);
  const reset = useCallback(() => {
    clearInterviewState();
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <InterviewContext.Provider
      value={{
        state,
        isLoaded,
        setUserName,
        startInterview,
        setAnswer,
        setAiResponse,
        setCurrentQuestion,
        completeSection,
        setOdysseyPath,
        setOdysseyRating,
        setCareerCanvas,
        setNextStep,
        setComplete,
        reset,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
}
