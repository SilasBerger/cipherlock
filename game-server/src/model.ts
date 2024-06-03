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
  requireKnownPlayers: boolean;
  caches: Cache[];
}

export type Answer = TextAnswer | SingleChoiceAnswer;

export interface TextAnswer {
  text: string;
}

export interface SingleChoiceAnswer {
  choice: string;
}

export interface OnboardingRequest {
  gameId: string;
  playerName: string;
}

export interface OnboardingErrorResponse {
  gameActive: boolean;
  gameIdValid: boolean;
  playerNameAvailable: boolean;
  playerNameValid: boolean;
}

export interface OnboardingSuccessResponse {
  playerId: string;
}

export interface CheckInRequest {
  gameId: string;
  playerId?: string;
}

export interface CheckInResponse {
  gameIdValid: boolean;
  playerIdValid: boolean; /* undefined if no game active or gameId does not match */
  success: boolean;
}

export interface AnswerCheckRequest {
  gameId: string;
  questionId: string;
  playerId?: string;
  answer: Answer;
}

export interface AnswerCheckErrorResponse {
  gameIdValid: boolean;
  playerIdValid: boolean;
  questionIdValid: boolean;
}

export interface AnswerCheckResult {
  correct: boolean;
}
