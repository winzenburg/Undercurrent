export type Framework =
  | 'Hedgehog'
  | 'Ikigai'
  | 'Design Your Life'
  | 'Zone of Genius'
  | 'Strengths'
  | 'Career Canvas';

export interface Question {
  id: number;
  sectionId: number;
  question: string;
  frameworks: Framework[];
  followUps: string[];
  aiNote?: string;
  isOdysseyPlans?: boolean;
  isOdysseyRating?: boolean;
}

export interface Section {
  id: number;
  number: string;
  title: string;
  subtitle: string;
  color: string;
}

export const SECTIONS: Section[] = [
  {
    id: 1,
    number: '01',
    title: 'The Warm-Up',
    subtitle: 'Understanding where you are right now',
    color: '#1B2A4A',
  },
  {
    id: 2,
    number: '02',
    title: 'Passion & Energy',
    subtitle: 'Discovering what lights you up vs. what drains you',
    color: '#2A3F6F',
  },
  {
    id: 3,
    number: '03',
    title: 'Skills & Genius',
    subtitle: 'Separating what you\'re great at from what makes you come alive',
    color: '#1E4D6B',
  },
  {
    id: 4,
    number: '04',
    title: 'Purpose & The World',
    subtitle: 'Connecting your drive to something bigger',
    color: '#2D5A4A',
  },
  {
    id: 5,
    number: '05',
    title: 'The Economic Engine',
    subtitle: 'Getting real about money and market value',
    color: '#4A3A1B',
  },
  {
    id: 6,
    number: '06',
    title: 'Prototyping the Future',
    subtitle: 'Moving from thinking to doing',
    color: '#3A1B4A',
  },
  {
    id: 7,
    number: '07',
    title: 'Career Canvas',
    subtitle: 'Mapping the business model of you',
    color: '#1B3A4A',
  },
  {
    id: 8,
    number: '08',
    title: 'Synthesis',
    subtitle: 'Connecting the dots',
    color: '#1B2A4A',
  },
];

export const QUESTIONS: Question[] = [
  // Section 1: The Warm-Up
  {
    id: 1,
    sectionId: 1,
    question: "Tell me about where you are right now in your career. What's the honest version?",
    frameworks: ['Hedgehog', 'Ikigai'],
    followUps: [
      "What does a typical week look like?",
      "If you had to rate your satisfaction from 1–10, what number comes to mind?",
      "What's the thing that's been nagging at you most?",
    ],
    aiNote: "Listen for energy shifts. Where do they light up? Where do they deflate?",
  },
  {
    id: 2,
    sectionId: 1,
    question: "When you imagine being stuck in your current situation five years from now, what feeling comes up?",
    frameworks: ['Design Your Life'],
    followUps: [
      "Is it the work itself, the environment, the people, or something else?",
      "What would you miss if you left tomorrow?",
    ],
  },
  {
    id: 3,
    sectionId: 1,
    question: "Who in your life has a career that makes you think 'I want something like that'? What specifically appeals to you about it?",
    frameworks: ['Ikigai', 'Zone of Genius'],
    followUps: [
      "Is it what they do, how they do it, or the life it gives them?",
      "What do they seem to have that you feel you're missing?",
    ],
  },
  // Section 2: Passion & Energy
  {
    id: 4,
    sectionId: 2,
    question: "Think about the last time you were so absorbed in something that you lost track of time. What were you doing?",
    frameworks: ['Hedgehog', 'Zone of Genius'],
    followUps: [
      "Was this at work or outside of work?",
      "What specifically about it pulled you in?",
      "How often does that feeling happen in your current role?",
    ],
    aiNote: "This is flow state — a strong signal for Zone of Genius territory.",
  },
  {
    id: 5,
    sectionId: 2,
    question: "What parts of your current or past work give you energy, even when they're hard?",
    frameworks: ['Zone of Genius', 'Strengths'],
    followUps: [
      "Think about specific tasks, not job titles.",
      "What's the difference between work that's hard-and-satisfying vs. hard-and-draining?",
    ],
  },
  {
    id: 6,
    sectionId: 2,
    question: "What do people always come to you for help with? And do you actually enjoy that thing?",
    frameworks: ['Strengths', 'Hedgehog'],
    followUps: [
      "Is there anything you're known for that you secretly wish you could stop doing?",
      "What would you want to be known for instead?",
    ],
    aiNote: "The gap between 'what I'm asked to do' and 'what I love doing' is often where people get stuck in their Zone of Excellence.",
  },
  {
    id: 7,
    sectionId: 2,
    question: "Outside of work, what do you spend your time and money learning about? What YouTube rabbit holes do you go down?",
    frameworks: ['Ikigai', 'Hedgehog'],
    followUps: [
      "If you had a fully-funded sabbatical year, what would you study or build?",
      "What topics can you talk about for hours without getting bored?",
    ],
  },
  // Section 3: Skills & Genius
  {
    id: 8,
    sectionId: 3,
    question: "What are you genuinely one of the best at in your professional world? Not just good — where do you have an unfair advantage?",
    frameworks: ['Hedgehog', 'Strengths'],
    followUps: [
      "What comes naturally to you that seems to be hard for others?",
      "What did you learn faster than your peers?",
      "If you had to teach a masterclass, what would the topic be?",
    ],
  },
  {
    id: 9,
    sectionId: 3,
    question: "Now the harder question: What are you excellent at that you'd be relieved to never do again?",
    frameworks: ['Zone of Genius'],
    followUps: [
      "This is the trap — your Zone of Excellence. You get paid well, get praised, but it quietly drains you.",
      "What would you delegate tomorrow if you could?",
      "What do you do on autopilot that impresses people but bores you?",
    ],
    aiNote: "This is often the most revelatory question. Many people have never given themselves permission to name this.",
  },
  {
    id: 10,
    sectionId: 3,
    question: "Think about your top three strengths. For each one, tell me: is it a natural talent or a skill you built through discipline?",
    frameworks: ['Strengths', 'Career Canvas'],
    followUps: [
      "Which ones feel effortless? Which ones feel earned?",
      "Which ones would you want to keep building on for the next decade?",
    ],
  },
  // Section 4: Purpose & The World
  {
    id: 11,
    sectionId: 4,
    question: "What problem in the world makes you angry or frustrated enough that you'd want to work on it even if the pay wasn't great?",
    frameworks: ['Ikigai'],
    followUps: [
      "Think about industries, communities, or causes.",
      "When you read the news, what stories pull you in?",
      "Is there a group of people you feel drawn to help?",
    ],
  },
  {
    id: 12,
    sectionId: 4,
    question: "If you could wave a magic wand and your work directly improved 1,000 people's lives, what would that improvement look like?",
    frameworks: ['Ikigai', 'Hedgehog'],
    followUps: [
      "What would those people thank you for?",
      "How would their lives be different because of your work?",
    ],
  },
  {
    id: 13,
    sectionId: 4,
    question: "What does 'meaningful work' actually mean to you? Be specific — not the Instagram version.",
    frameworks: ['Ikigai', 'Design Your Life'],
    followUps: [
      "Is meaning about impact, mastery, autonomy, connection, or something else?",
      "Have you ever had meaningful work? What made it feel that way?",
      "How much does meaning matter vs. compensation in your next move?",
    ],
  },
  // Section 5: The Economic Engine
  {
    id: 14,
    sectionId: 5,
    question: "What's your financial floor? What's the minimum income you need to feel stable and not stressed?",
    frameworks: ['Hedgehog', 'Career Canvas'],
    followUps: [
      "And what's your target — the number that would make you feel like you're thriving?",
      "How flexible is that number? Could you trade income for freedom or meaning?",
    ],
  },
  {
    id: 15,
    sectionId: 5,
    question: "Right now, what are people and companies actually willing to pay top dollar for that you can deliver?",
    frameworks: ['Hedgehog', 'Career Canvas'],
    followUps: [
      "What skills or expertise do you have that are in high demand?",
      "Where does your experience command a premium?",
      "Is there a gap between what you're paid for now and what you'd want to be paid for?",
    ],
  },
  {
    id: 16,
    sectionId: 5,
    question: "If you had to make money three completely different ways using only your existing skills, what would those three paths be?",
    frameworks: ['Career Canvas', 'Design Your Life'],
    followUps: [
      "Don't filter for 'realistic' yet — just brainstorm.",
      "Which of these excites you most? Which would you start tomorrow?",
    ],
    aiNote: "This is a lightweight version of the Odyssey Plans exercise. Take note of which path makes them lean forward.",
  },
  // Section 6: Prototyping the Future
  {
    id: 17,
    sectionId: 6,
    question: "Let's build three possible five-year futures. No judgments, no filtering.",
    frameworks: ['Design Your Life'],
    followUps: [
      "Path A: You continue on your current trajectory but make smart tweaks. What does that look like?",
      "Path B: Your current path disappears tomorrow. What do you do instead?",
      "Path C: Money and other people's opinions don't matter. What's the wildcard?",
    ],
    aiNote: "These are Odyssey Plans from Design Your Life. Push them to be specific: where they live, what a Tuesday looks like, who they work with.",
    isOdysseyPlans: true,
  },
  {
    id: 18,
    sectionId: 6,
    question: "For each of those three paths, let's rate them on four dimensions from 1 to 5.",
    frameworks: ['Design Your Life', 'Ikigai'],
    followUps: [],
    isOdysseyRating: true,
  },
  {
    id: 19,
    sectionId: 6,
    question: "What's the smallest possible experiment you could run in the next two weeks to test your most exciting path?",
    frameworks: ['Design Your Life'],
    followUps: [
      "Could you have a coffee chat with someone in that world?",
      "Could you take on a side project or volunteer opportunity?",
      "What would you need to learn, and how could you learn it fast?",
    ],
    aiNote: "The goal is action, not more thinking. Help them define something concrete with a deadline.",
  },
];

export const FRAMEWORK_COLORS: Record<Framework, string> = {
  'Hedgehog': '#C9A84C',
  'Ikigai': '#E8734A',
  'Design Your Life': '#4A9E8A',
  'Zone of Genius': '#7B5EA7',
  'Strengths': '#4A7FBF',
  'Career Canvas': '#2D9E6B',
};

export const CAREER_CANVAS_BLOCKS = [
  {
    id: 'key_resources',
    title: 'KEY RESOURCES',
    description: 'Your skills, talents, strengths, knowledge, network, reputation',
    placeholder: 'What do you bring to the table?',
  },
  {
    id: 'key_activities',
    title: 'KEY ACTIVITIES',
    description: 'The work that energizes you and uses your Zone of Genius',
    placeholder: 'What work makes you come alive?',
  },
  {
    id: 'value_proposition',
    title: 'VALUE PROPOSITION',
    description: 'What you uniquely offer — the problem you solve better than anyone',
    placeholder: 'What do you uniquely offer the world?',
  },
  {
    id: 'customers',
    title: 'CUSTOMERS',
    description: 'Who benefits from your work? Employers, clients, users, communities',
    placeholder: 'Who do you serve?',
  },
  {
    id: 'channels',
    title: 'CHANNELS',
    description: 'How do people find you? LinkedIn, referrals, portfolio, speaking, content',
    placeholder: 'How do people discover you?',
  },
  {
    id: 'revenue_streams',
    title: 'REVENUE STREAMS',
    description: 'How does this become income? Salary, consulting, products, equity',
    placeholder: 'How does this become money?',
  },
  {
    id: 'key_partners',
    title: 'KEY PARTNERS',
    description: 'Who do you need? Mentors, collaborators, sponsors, communities',
    placeholder: 'Who do you need in your corner?',
  },
  {
    id: 'cost_structure',
    title: 'COST STRUCTURE',
    description: 'What does this require? Time, education, relocation, financial runway',
    placeholder: 'What does this path cost you?',
  },
];

export const ODYSSEY_DIMENSIONS = [
  {
    id: 'engagement',
    label: 'Engagement',
    description: 'How absorbed would you be in this work?',
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Does this path give you energy or take it?',
  },
  {
    id: 'confidence',
    label: 'Confidence',
    description: 'How achievable does this feel?',
  },
  {
    id: 'coherence',
    label: 'Coherence',
    description: 'Does this align with who you really are?',
  },
];

export const ODYSSEY_PATHS = [
  {
    id: 'path_a',
    label: 'Path A',
    title: 'The Tweaked Path',
    description: 'You continue on your current trajectory but make smart tweaks.',
    color: '#4A7FBF',
  },
  {
    id: 'path_b',
    label: 'Path B',
    title: 'The Pivot',
    description: 'Your current path disappears tomorrow. You do something entirely different.',
    color: '#7B5EA7',
  },
  {
    id: 'path_c',
    label: 'Path C',
    title: 'The Wildcard',
    description: "Money and other people's opinions don't matter. Anything goes.",
    color: '#C9A84C',
  },
];
