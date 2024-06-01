export interface TextAnswer {
  matchCase: boolean;
  acceptedAnswers: string[];
}

export interface SingleChoiceAnswer {
  correctAnswers: string[];
}

export type AnswerSpec = TextAnswer | SingleChoiceAnswer;

export enum AnswerType {
  TextAnswer = "TextAnswer",
  SingleChoice = "SingleChoiceAnswer",
}

export interface Answer {
  type: AnswerType;
  spec: AnswerSpec;
}

export interface Cache {
  lockboxId: string;
  description: string;
  answer: Answer;
}

export interface GameSpec {
  gameId: string;
  gameDescription: string;
  caches: Cache[];
}
