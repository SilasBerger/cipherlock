export interface TextAnswerSpec {
  matchCase: boolean;
  acceptedAnswers: string[];
}

export interface SingleChoiceAnswerSpec {
  correctAnswers: string[];
}

export type AnswerSpec = TextAnswerSpec | SingleChoiceAnswerSpec;

export enum AnswerType {
  TextAnswer = "TextAnswer",
  SingleChoice = "SingleChoiceAnswer",
}

export interface AnswerDefinition {
  type: AnswerType;
  spec: AnswerSpec;
}

export interface Cache {
  lockboxId: string;
  questionId: string;
  description: string;
  answer: AnswerDefinition;
}

export interface GameSpec {
  gameId: string;
  gameDescription: string;
  caches: Cache[];
}

export interface OnboardingRequest {
  gameId: string;
  playerName: string;
}

export interface CheckInRequest {
  gameId: string;
  playerId: string;
}

export interface AnswerCheckRequest {
  questionId: string;
  answer: Answer;
}

export interface Answer {
  type: AnswerType;
  value: AnswerValue;
}

export type AnswerValue = TextAnswerValue | SingleChoiceAnswerValue;

export interface TextAnswerValue {
  text: string;
}

export interface SingleChoiceAnswerValue {
  choice: string;
}

export interface OnboardingResponse {
  gameId?: string /* undefined if no game active */
  playerNameAvailable: boolean; /* undefined if no game active */
  playerId?: string; /* undefined if request fails */
}
