import {ProvidedAnswer} from "./caches";

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
  answer: ProvidedAnswer;
}

export interface AnswerCheckErrorResponse {
  gameIdValid: boolean;
  playerIdValid: boolean;
  questionIdValid: boolean;
}

export interface AnswerCheckResult {
  correct: boolean;
}
