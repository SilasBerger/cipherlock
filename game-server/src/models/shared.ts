export type ProvidedAnswer = ProvidedTextAnswer | ProvidedSingleChoiceAnswer;

export interface ProvidedTextAnswer {
  text: string;
}

export interface ProvidedSingleChoiceAnswer {
  choice: string;
}