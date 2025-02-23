import {Quiz, QuestionResult} from './components/quiz';
import {Intro} from './components/intro';
import {FormSummary} from './components/summary';
import {Slide} from './components/slide';

export class App {
  private _currentComponent: Slide;
  private readonly _intro: Intro;
  private _quiz: Quiz;
  private readonly _summary: FormSummary;

  constructor() {
    this._quiz = new Quiz(
      this.onQuizSkip.bind(this),
      this.onQuizFinish.bind(this)
    );
    this._intro = new Intro(() => {
      this.switchComponent(this._quiz);
      this._quiz.start();
    });
    this._summary = new FormSummary();
    this._currentComponent = this._quiz;
    this._quiz.start();
  }

  private onQuizSkip(): void {
    this.switchComponent(this._intro);
    this.initializeNewQuiz();
  }

  private onQuizFinish(results: QuestionResult[]): void {
    this._summary.saveAndSend(results);
  }

  private initializeNewQuiz() {
    this._quiz = new Quiz(
      this.onQuizSkip.bind(this),
      this.onQuizFinish.bind(this)
    );
  }

  private switchComponent(newComponent: Slide) {
    this._currentComponent.display = false;
    this._currentComponent = newComponent;
    this._currentComponent.display = true;
  }
}
