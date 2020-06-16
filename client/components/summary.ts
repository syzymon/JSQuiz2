import {Slide} from './slide';
import {QuizResults} from './quiz';

interface QuizResultsPresentation {
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

interface WrongAnswerFeedback {
  questionNr: number;
  statement: string;
  usersAnswer: number;
  shouldBe: number;
}

export function msToSecondsStr(millis: number) {
  return (millis / 1000).toFixed(2);
}

class Evaluator {
  private _results: QuizResults;
  private readonly _nQuestions: number;
  private readonly _correctAnswers: number;
  private readonly _totalTimeMs: number;
  private readonly _penalty: number;

  constructor(results: QuizResults) {
    this._results = results;
    this._nQuestions = results.length;
    this._correctAnswers = results.reduce(
      (a, b) => a + Number(b.usersAnswer === b.question.answer),
      0
    );
    this._totalTimeMs = results.reduce((a, b) => a + b.timeSpent, 0);
    this._penalty = results.reduce(
      (a, b) =>
        a +
        (b.usersAnswer === b.question.answer ? 0 : b.question.secondsPenalty),
      0
    );
  }

  get resultsPresentation(): QuizResultsPresentation {
    return {
      nQuestions: this._nQuestions,
      correct: this._correctAnswers,
      time: msToSecondsStr(this._totalTimeMs),
      penalty: this._penalty,
      result: msToSecondsStr(this._totalTimeMs + this._penalty * 1000),
      timeStats: this._results.map(x => msToSecondsStr(x.timeSpent)).join(', '),
    };
  }

  get resultsEvaluation(): QuizResultsEvaluation {
    return {
      totalTimeMs: this._totalTimeMs + this._penalty * 1000,
      userResults: this._results,
    };
  }

  get wrong_answers(): WrongAnswerFeedback[] {
    return [...Array(this._nQuestions)]
      .map((_, i: number) => {
        return {
          questionNr: i,
          statement: this._results[i].question.statement,
          shouldBe: this._results[i].question.answer,
          usersAnswer: this._results[i].usersAnswer,
        };
      })
      .filter(x => x.shouldBe !== x.usersAnswer);
  }
}

function saveToLocalStorage(result: QuizResultsEvaluation): void {
  if (!localStorage.getItem('bestScores'))
    localStorage.setItem('bestScores', '[]');
  const scoresList = JSON.parse(
    localStorage.getItem('bestScores') as string
  ) as QuizResultsEvaluation[];
  scoresList.push(result);
  localStorage.setItem(
    'bestScores',
    JSON.stringify(
      scoresList
        .sort((ev1, ev2) => ev1.totalTimeMs - ev2.totalTimeMs)
        .slice(0, 5)
    )
  );
}

export function getLocalStorageRanking(): number[] {
  if (!localStorage.getItem('bestScores')) return [];
  const results = JSON.parse(
    localStorage.getItem('bestScores') as string
  ) as QuizResultsEvaluation[];
  return results.map(ev => ev.totalTimeMs);
}

export class Summary extends Slide {
  private _closeBtn: HTMLButtonElement;
  private _feedbackList: HTMLUListElement;
  private readonly _onClose: () => void;
  private _resultsEvaluation: QuizResultsEvaluation | undefined;

  constructor(onClose: () => void) {
    super(document.querySelector('.summary') as HTMLDivElement);
    this._closeBtn = this._slideElem.querySelector(
      '.start-btn'
    ) as HTMLButtonElement;
    this._feedbackList = this._slideElem.querySelector(
      '.feedback'
    ) as HTMLUListElement;
    this._onClose = onClose;

    this._closeBtn.onclick = this.closeSummary.bind(this);
  }

  private bindValues(context: object) {
    this._slideElem.querySelectorAll('[data-bind]').forEach(elem => {
      const binding = elem.getAttribute('data-bind') as string;
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      elem.textContent = context[binding];
    });
  }

  public present(results: QuizResults) {
    const ev = new Evaluator(results);
    this._resultsEvaluation = ev.resultsEvaluation;
    this.bindValues(ev.resultsPresentation);
    const wrongs = ev.wrong_answers;

    if (wrongs.length > 0) {
      wrongs.forEach(result => {
        const newLi = document.createElement('li');
        newLi.innerHTML = `<li>Pytanie nr ${
          1 + result.questionNr
        }: <code class="expr">${result.statement}</code> Twoja odpowiedź:
                    <code class="incorrect-ans">${
                      result.usersAnswer
                    }</code>, powinno być:
                    <code class="should-be">${result.shouldBe}</code>.
                </li>`;
        this._feedbackList.appendChild(newLi);
      });
    }
  }

  private closeSummary() {
    this._feedbackList.innerHTML = '';
    const saveInput = this._slideElem.querySelector(
      '#save'
    ) as HTMLInputElement;
    console.log(saveInput);
    if (saveInput.checked && this._resultsEvaluation) {
      saveToLocalStorage(this._resultsEvaluation);
    }
    this._onClose();
  }
}

export class FormSummary {
  private _form: HTMLFormElement;

  constructor() {
    this._form = document.getElementById('finish-form') as HTMLFormElement;
  }

  public saveAndSend(res: QuizResults) {
    this._form.results.value = JSON.stringify(res);
    this._form.submit();
  }
}
