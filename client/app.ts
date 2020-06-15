import {Quiz, QuestionResult} from './components/quiz';
import {Intro} from './components/intro';
import {Summary} from './components/summary';
import {Slide} from './components/slide';

export class App {
  private _currentComponent: Slide;
  private readonly _intro: Intro;
  private _quiz: Quiz;
  private readonly _summary: Summary;

  constructor() {
    this._quiz = new Quiz(
      this.onQuizSkip.bind(this),
      this.onQuizFinish.bind(this)
    );
    this._intro = new Intro(() => {
      this.switchComponent(this._quiz);
      this._quiz.start();
    });
    this._summary = new Summary(() => {
      this._intro.updateRanking();
      this.switchComponent(this._intro);
    });
    this._currentComponent = this._intro;
  }

  private onQuizSkip(): void {
    this.switchComponent(this._intro);
    this.initializeNewQuiz();
  }

  private onQuizFinish(results: QuestionResult[]): void {
    this.initializeNewQuiz();
    this._summary.present(results);
    this.switchComponent(this._summary);
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
