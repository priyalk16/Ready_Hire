
export type Page = 
  | 'home'
  | 'quiz'
  | 'quiz-feedback'
  | 'prep-resume'
  | 'prep-hr'
  | 'prep-voice'
  | 'prep-essay'
  | 'prep-dashboard'
  | 'history';

export type UserPath = 'none' | 'explorer' | 'prep';

export interface CareerReport {
  recommendedRoles: { role: string; reason: string; priority: number }[];
  keyStrengths: string[];
  areasToImprove: string[];
  skillsToStartWith: { role: string; skills: string[] }[];
  roadmap: { step: string; description: string; }[];
  projects: { name: string; description: string; technologies: string[] }[];
  resources: { name: string; url: string; category: string }[];
}

export interface FinalReport {
  summary: string;
  consolidatedStrengths: string[];
  areasForImprovement: string[];
  careerRoadmap?: { step: string; description: string; }[];
  resumeImprovements?: { area: string; suggestion: string; }[];
  sampleProjects?: { name: string; description: string; technologies: string[]; }[];
  suggestedCertifications?: { name: string; url: string; }[];
  resources?: { name: string; url: string; }[];
}

export interface ATSScoreData {
  score: number;
  breakdown: {
    skills: number;
    projects: number;
    experience: number;
    education: number;
    certifications: number;
  };
  insights: string[];
  missingSkills: string[];
  suggestions: string[];
}

export interface AssessmentResults {
    resume?: any;
    hr?: any;
    voice?: any;
    essay?: any;
    ats?: ATSScoreData;
}
