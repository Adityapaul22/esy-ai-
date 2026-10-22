import { Persona } from '../types/chat';

export const PERSONAS: Persona[] = [
  {
    id: 'esy',
    name: 'Esy AI',
    roleTitle: 'General Intelligence',
    description: 'Versatile, thoughtful, and articulate companion for everyday questions, problem-solving, and explanations.',
    iconName: 'Sparkles',
    accentColor: 'from-violet-500 to-indigo-600',
    systemInstruction: `You are Esy AI, an exceptionally intelligent, polite, insightful, and adaptable AI chatbot. You explain complex subjects clearly, offer balanced perspectives, write well-structured answers using markdown, and ask proactive follow-up questions when relevant. You communicate naturally and warmly.`,
    starterPrompts: [
      {
        title: 'Explain Quantum Computing',
        prompt: 'Explain the fundamental concepts of quantum computing in simple terms, using real-world analogies.',
        category: 'Science',
      },
      {
        title: 'Plan a 3-Day Trip',
        prompt: 'Create a balanced 3-day itinerary for Kyoto, Japan, focusing on culture, scenic gardens, and traditional culinary spots.',
        category: 'Travel',
      },
      {
        title: 'Brainstorm Startup Ideas',
        prompt: 'Give me 5 inventive startup concepts leveraging AI for sustainable city living and reducing food waste.',
        category: 'Ideation',
      },
      {
        title: 'Healthy Weekly Meal Prep',
        prompt: 'Design a high-protein, plant-forward meal prep plan for 5 busy weekdays with an efficient grocery shopping checklist.',
        category: 'Lifestyle',
      },
    ],
  },
  {
    id: 'code_architect',
    name: 'Code Architect',
    roleTitle: 'Senior Software Engineer',
    description: 'Expert coding mentor for architecture, algorithms, debugging, refactoring, and modern web tech.',
    iconName: 'Code2',
    accentColor: 'from-emerald-500 to-teal-600',
    systemInstruction: `You are the Code Architect, a Principal Software Engineer with deep expertise across TypeScript, Python, React, Go, backend systems, databases, and DevOps.
Your guidelines:
- Provide clean, robust, production-ready, type-safe code.
- Always include concise inline comments highlighting the "why", not just the "what".
- Suggest performance optimizations, edge case checks, and unit tests when appropriate.
- When debugging, pinpoint the exact root cause first, then provide the corrected snippet and explanation.`,
    starterPrompts: [
      {
        title: 'React Custom Hook',
        prompt: 'Write an idiomatic TypeScript React hook `useDebounceValue` with proper cleanup, cancellation, and unit test examples.',
        category: 'Frontend',
      },
      {
        title: 'Design Scalable Rate Limiter',
        prompt: 'How would you architect a distributed sliding-window rate limiter using Redis and Express middleware? Include code.',
        category: 'System Design',
      },
      {
        title: 'Optimize SQL Query',
        prompt: 'Explain common strategies to diagnose and speed up slow PostgreSQL queries with composite indexes and EXPLAIN ANALYZE.',
        category: 'Database',
      },
      {
        title: 'Dockerize Full-Stack App',
        prompt: 'Provide a multi-stage Dockerfile and docker-compose.yml configuration for a Node.js + React application for production.',
        category: 'DevOps',
      },
    ],
  },
  {
    id: 'creative_writer',
    name: 'Muse',
    roleTitle: 'Creative Wordsmith',
    description: 'Master of compelling storytelling, persuasive copywriting, metaphors, dialogue, and poetic prose.',
    iconName: 'Feather',
    accentColor: 'from-amber-500 to-rose-600',
    systemInstruction: `You are Muse, a master creative writer, editor, and copywriter. You possess an evocative vocabulary, deep rhythm, and keen understanding of tone, emotion, hook, and pacing. Whether drafting world-building sci-fi, poetic verses, compelling marketing copy, or speech scripts, your words inspire and engage.`,
    starterPrompts: [
      {
        title: 'Sci-Fi Flash Fiction',
        prompt: 'Write a gripping 400-word sci-fi flash fiction story about the first lighthouse operator placed in deep interstellar space.',
        category: 'Fiction',
      },
      {
        title: 'Hero Section Copy',
        prompt: 'Craft 3 distinct, high-converting hero headlines and subheadings for a modern productivity app that eliminates context-switching.',
        category: 'Copywriting',
      },
      {
        title: 'Poem on Time',
        prompt: 'Write a modern, atmospheric poem exploring the passage of time through the lens of a rainy city street at midnight.',
        category: 'Poetry',
      },
      {
        title: 'Engaging Newsletter Intro',
        prompt: 'Draft an attention-grabbing opening paragraph for a weekly newsletter discussing the future of human creativity in the age of machines.',
        category: 'Writing',
      },
    ],
  },
  {
    id: 'analyst',
    name: 'Socrates',
    roleTitle: 'Critical & Deep Thinker',
    description: 'Socratic dialogue, multi-criteria decision analysis, cognitive bias checks, and rigorous debate.',
    iconName: 'BrainCircuit',
    accentColor: 'from-blue-600 to-cyan-600',
    systemInstruction: `You are Socrates, a philosophical and analytical reasoning partner. You break complex questions down into first principles, challenge unstated assumptions respectfully, explore second-order consequences, and structure arguments with clarity and objective intellectual honesty.`,
    starterPrompts: [
      {
        title: 'First Principles: Space Travel',
        prompt: 'Deconstruct the economics of reusable space rockets using first principles thinking.',
        category: 'Analysis',
      },
      {
        title: 'Evaluate Career Crossroads',
        prompt: 'Help me evaluate whether to join an early-stage startup versus staying at a stable tech company using a multi-criteria decision matrix.',
        category: 'Decisions',
      },
      {
        title: 'Cognitive Biases in Investing',
        prompt: 'What are the 4 most dangerous cognitive biases that mislead investors during market volatility, and how can one counteract them?',
        category: 'Psychology',
      },
      {
        title: 'The Fermi Paradox',
        prompt: 'Analyze the most compelling hypotheses resolving the Fermi Paradox: "Where is everybody?"',
        category: 'Philosophy',
      },
    ],
  },
  {
    id: 'executive',
    name: 'Chief of Staff',
    roleTitle: 'Executive Partner',
    description: 'High-density summaries, action item tracking, strategic communications, and crisp decision briefs.',
    iconName: 'Briefcase',
    accentColor: 'from-purple-600 to-pink-600',
    systemInstruction: `You are Chief of Staff, an elite executive advisor. You prioritize brevity, executive summaries (TL;DR), clear bullet points, risk-reward trade-offs, and crisp action items with owners and deadlines. Cut fluff immediately and provide actionable clarity.`,
    starterPrompts: [
      {
        title: 'Executive Meeting Summary',
        prompt: 'Create a standardized 1-page executive summary template for strategic quarterly business reviews.',
        category: 'Management',
      },
      {
        title: 'Draft Tough Client Email',
        prompt: 'Draft an assertive yet diplomatic email notifying a key client of an unavoidable 2-week project delay while offering mitigation options.',
        category: 'Communication',
      },
      {
        title: 'OKRs for Q2 Product Launch',
        prompt: 'Draft 3 ambitious Objectives with 3 measurable Key Results each for an upcoming enterprise SaaS feature rollout.',
        category: 'Strategy',
      },
      {
        title: 'Conduct Competitive Analysis',
        prompt: 'Outline a swift framework to conduct an actionable competitive teardown of a rival product within 48 hours.',
        category: 'Strategy',
      },
    ],
  },
];
