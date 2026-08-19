export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: "admin" | "teacher";
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "teacher";
}

export interface Exercise {
  id: string;
  title: string;
  category: "paragraph" | "letter" | "story" | "other";
  description: string;
  sentenceStarters: string[];
  vocabularyHints: string[];
  exampleText?: string;
  targetWordCount: number;
  assignedBy?: string;
  gradeTarget?: string;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface StructureCheckItem {
  criteria: string;
  met: boolean;
  advice: string;
}

export interface VocabularyUpgrade {
  simpleWord: string;
  juicierWord: string;
  exampleSentence: string;
}

export interface AIFeedback {
  encouragement: string;
  grammarSpelling: GrammarCorrection[];
  structureCheck: StructureCheckItem[];
  vocabularyUpgrades: VocabularyUpgrade[];
  starRating: number;
  badge: string;
}

export interface Submission {
  id: string;
  studentName: string;
  gradeLevel: string;
  exerciseId: string;
  exerciseTitle: string;
  category: string;
  text: string;
  timestamp: string;
  feedback: AIFeedback | null;
}
