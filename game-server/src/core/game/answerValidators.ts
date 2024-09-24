import {
  SingleChoiceAnswerSpec,
  TextAnswerSpec
} from "../../models/caches";
import {AnswerCheckResult} from "../../models/api";
import {ProvidedSingleChoiceAnswer, ProvidedTextAnswer} from "../../models/shared";

export function checkTextAnswer(spec: TextAnswerSpec, value: ProvidedTextAnswer): AnswerCheckResult {
  const acceptedAnswers = spec.matchCase ? spec.acceptedAnswers : spec.acceptedAnswers.map(answer => answer.toLowerCase()) ;
  const providedAnswer = spec.matchCase ? value.text : value.text.toLowerCase();
  return {
    correct: acceptedAnswers.includes(providedAnswer),
  };
}

export function checkSingleChoiceAnswer(spec: SingleChoiceAnswerSpec, value: ProvidedSingleChoiceAnswer): AnswerCheckResult {
  return {
    correct: spec.correctAnswers.includes(value.choice),
  }
}
