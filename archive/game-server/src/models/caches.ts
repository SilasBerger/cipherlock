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

