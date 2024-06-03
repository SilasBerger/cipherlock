import {
  AnswerCheckResult,
  SingleChoiceAnswerSpec,
  SingleChoiceAnswer,
  TextAnswerSpec,
  TextAnswer
} from "./model";

export function checkTextAnswer(spec: TextAnswerSpec, value: TextAnswer): AnswerCheckResult {
  const acceptedAnswers = spec.matchCase ? spec.acceptedAnswers : spec.acceptedAnswers.map(answer => answer.toLowerCase()) ;
  const providedAnswer = spec.matchCase ? value.text : value.text.toLowerCase();
  return {
    correct: acceptedAnswers.includes(providedAnswer),
  };
}

export function checkSingleChoiceAnswer(spec: SingleChoiceAnswerSpec, value: SingleChoiceAnswer): AnswerCheckResult {
  return {
    correct: spec.correctAnswers.includes(value.choice),
  }
}
