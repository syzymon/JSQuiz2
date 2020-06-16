import {Question, shuffle, quiz} from '../data/questions';
import {Observable, Computed} from '../core/observable';
import {Slide} from './slide';
import {ContextTimer} from './timer';

class Counter extends Observable<number> {
  private readonly _limit: number;
  private readonly _elem: HTMLSpanElement;

  constructor(n: number, changes: (x: number) => void) {
    super(0);
    this._limit = n;
    this._elem = document.querySelector('.question-nr') as HTMLSpanElement;
    this._elem.textContent = '1';
    this.subscribe(changes);
    this.subscribe(val => {
      this._elem.textContent = (1 + val).toString();
    });
  }

  public next() {
    this.value = (this.value + 1) % this._limit;
  }

  public prev() {
    this.value = (this.value + this._limit - 1) % this._limit;
  }
}

class QuestionView {
  private _question: Question;
  private readonly _statement: Observable<string>;
  private readonly _secondsPenalty: Observable<number>;

  constructor(question: Question) {
    this._question = question;
    this._statement = new Observable<string>(question.statement);
    this._secondsPenalty = new Observable<number>(question.secondsPenalty);
    this.bind();
  }

  private bind(): void {
    const bindings = {
      statement: this._statement,
      penalty: this._secondsPenalty,
    };
    Object.entries(bindings).forEach(([key, obs]) => {
      const elem = document.querySelector(
        `[data-bind="${key}"]`
      ) as HTMLElement;
      elem.textContent = obs.value.toString();
      obs.subscribe(() => (elem.textContent = obs.value.toString()));
    });
  }

  private update(): void {
    this._statement.value = this._question.statement;
    this._secondsPenalty.value = this._question.secondsPenalty;
  }

  set question(newQuestion: Question) {
    this._question = newQuestion;
    this.update();
  }
}

type maybeNumber = number | undefined;

class AnswerView {
  private readonly _elem: HTMLInputElement;
  private _answer: Observable<maybeNumber>;

  constructor(initialAnswer: Observable<maybeNumber>) {
    this._elem = document.querySelector('#answer') as HTMLInputElement;
    this._elem.value = '';
    this._answer = initialAnswer;
    this._elem.onchange = () => {
      this._answer.value = this._elem.value
        ? Number(this._elem.value)
        : undefined;
    };
  }

  set answer(switchedAnswer: Observable<maybeNumber>) {
    this._answer = switchedAnswer;
    this._elem.value =
      switchedAnswer.value !== undefined ? switchedAnswer.value.toString() : '';
  }

  public focus() {
    this._elem.focus();
  }
}

class QuizNavigation {
  private _canFinish: Computed<boolean>;
  private _finishBtn: HTMLButtonElement;

  constructor(answers: Observable<maybeNumber>[], parent: Quiz) {
    this._finishBtn = document.querySelector('.finish') as HTMLButtonElement;
    this._finishBtn.disabled = true;
    this._canFinish = new Computed<boolean>(
      () => answers.every(x => x.value !== undefined),
      answers
    );
    this._canFinish.subscribe(value => {
      this._finishBtn.disabled = !value;
    });
    this.bindActions(parent);
  }

  private bindActions(par: Quiz): void {
    document.querySelectorAll('[nav-action]').forEach(elem => {
      if (elem instanceof HTMLButtonElement) {
        const actionName = elem.getAttribute('nav-action') as string;
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        elem.onclick = par[actionName].bind(par) as () => void;
      }
    });
  }

  public unregister() {}
}

export interface QuestionResult {
  readonly question: Question;
  readonly usersAnswer: number;
  readonly timeSpent: number;
}

export type QuizResults = QuestionResult[];

export class Quiz extends Slide {
  private readonly _questions: Question[];
  private _idCounter: Counter;
  private _questionView: QuestionView;
  private readonly _answers: Observable<maybeNumber>[];
  private _answerView: AnswerView;
  private _navigation: QuizNavigation;
  private _timer: ContextTimer;
  private readonly _onSkip: () => void;
  private readonly _onFinish: (res: QuizResults) => void;

  constructor(
    onSkip: () => void,
    onFinish: (res: QuizResults) => void,
    questions: Question[] = quiz.questions
  ) {
    super(document.querySelector('.quiz') as HTMLDivElement);
    this._questions = shuffle(questions);
    this._questionView = new QuestionView(questions[0]);
    this._answers = [...Array(this._questions.length)].map(
      () => new Observable<maybeNumber>(undefined)
    );
    this._answerView = new AnswerView(this._answers[0]);
    this._navigation = new QuizNavigation(this._answers, this);

    this._idCounter = new Counter(this._questions.length, num => {
      this._questionView.question = this._questions[num];
      this._answerView.answer = this._answers[num];
    });

    this._timer = new ContextTimer(
      this._slideElem.querySelector('.timer-value') as HTMLSpanElement,
      100,
      this._idCounter,
      this._questions.length
    );

    this._onSkip = onSkip;
    this._onFinish = onFinish;
  }

  public start(): void {
    this._timer.start();
    this._answerView.focus();
  }

  public next(): void {
    this._idCounter.next();
    this._answerView.focus();
  }

  public prev(): void {
    this._idCounter.prev();
    this._answerView.focus();
  }

  get results(): QuizResults {
    return [...Array(this._questions.length)].map((_, i: number) => {
      const answer = this._answers[i].value as number;
      return {
        question: this._questions[i],
        usersAnswer: answer,
        timeSpent: this._timer.timesSpent[i],
      };
    });
  }

  public skip(): void {
    this.tearDown();
    this._onSkip();
  }

  public finish(): void {
    this.tearDown();
    this._onFinish(this.results);
  }

  public tearDown(): void {
    super.tearDown();
    this._timer.stop();
    this._navigation.unregister();
  }
}
