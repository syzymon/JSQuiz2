import {Quiz, QuizResults} from './db';
import assert from 'assert';

interface QuizResultsPresentation {
  quizName: string;
  nQuestions: number;
  correct: number;
  time: string;
  penalty: number;
  result: string;
  timeStats: string;
}

interface QuizResultsEvaluation {
  totalTimeMs: number;
  userResults: QuizResults;
}

interface Feedback {
  questionNr: number;
  statement: string;
  usersAnswer: number;
  shouldBe: number;
}

export interface Evaluation {
  readonly topResults: QuizResults[];
  readonly presentation: QuizResultsPresentation;
  readonly feedback: Feedback[];
}

export function msToSecondsStr(millis: number) {
  return (millis / 1000).toFixed(2);
}

export class Evaluator {
  private _quiz: Quiz;
  private _results: QuizResults;
  private readonly _nQuestions: number;
  private readonly _correctAnswers: number;
  private readonly _totalTimeMs: number;
  private readonly _answersMap: Map<number, number>;

  constructor(quiz: Quiz, results: QuizResults) {
    this._quiz = quiz;
    this._results = results;
    this._nQuestions = results.answers.length;
    this._answersMap = new Map(
      quiz.questions.map(question => [question.id, question.answer])
    );
    assert(quiz.questions.length === this._nQuestions);
    this._correctAnswers = results.answers.reduce(
      (a, b) =>
        a + Number(b.usersAnswer === this._answersMap.get(b.question.id)),
      0
    );
    // this._totalTimeMs = results.answers.reduce((a, b) => a + b.timeSpent, 0);
    this._totalTimeMs = results.timeMs;
  }

  get penalty(): number {
    return this._results.answers.reduce(
      (a, b) =>
        a +
        (b.usersAnswer === this._answersMap.get(b.question.id)
          ? 0
          : b.question.secondsPenalty),
      0
    );
  }

  get resultsPresentation(): QuizResultsPresentation {
    const penalty = this.penalty;
    return {
      quizName: this._quiz.name,
      nQuestions: this._nQuestions,
      correct: this._correctAnswers,
      time: msToSecondsStr(this._totalTimeMs),
      penalty: penalty,
      result: msToSecondsStr(this._totalTimeMs + penalty * 1000),
      timeStats: this._results.answers
        .map(x => msToSecondsStr(x.timeSpent))
        .join(', '),
    };
  }

  get resultsEvaluation(): QuizResultsEvaluation {
    return {
      totalTimeMs: this._totalTimeMs + this.penalty * 1000,
      userResults: this._results,
    };
  }

  getFeedback(avgTimes: Map<number, number>): Feedback[] {
    return [...Array(this._nQuestions)].map((_, i: number) => {
      const shouldBe = this._answersMap.get(
        this._results.answers[i].question.id
      ) as number;
      return {
        questionNr: this._results.answers[i].question.id,
        statement: this._results.answers[i].question.statement,
        shouldBe: shouldBe,
        usersAnswer: this._results.answers[i].usersAnswer,
        timeSpent: this._results.answers[i].timeSpent,
        avgTime: avgTimes.get(this._results.answers[i].question.id),
      };
    });
  }

  getCompleteEvaluation(
    avgTimes: Map<number, number>,
    topResults: QuizResults[]
  ): Evaluation {
    return {
      topResults: topResults,
      presentation: this.resultsPresentation,
      feedback: this.getFeedback(avgTimes),
    };
  }
}
