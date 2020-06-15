import {Observable} from '../core/observable';

function timeToClock(miliseconds: number): string {
  const minutes = ~~(miliseconds / 60000);
  const seconds = ~~((miliseconds - minutes * 60000) / 1000);
  const hundreds = ~~((miliseconds - minutes * 60000 - seconds * 1000) / 10);
  const fmt = (num: number) => num.toString().padStart(2, '0');
  const minutePrefix = minutes > 0 ? `${fmt(minutes)}:` : '';
  return minutePrefix + `${fmt(seconds)}:${fmt(hundreds)}`;
}

export class ContextTimer {
  private readonly _textElement: HTMLSpanElement;
  private readonly _precision: number;
  private _msSinceStarted: number;
  private _currentTaskNumber: number;
  private _currentTaskStarted: number;
  private readonly _spentOnTasks: number[];
  private _intervalHandle: number;

  constructor(
    textElement: HTMLSpanElement,
    precision: number,
    readonly questionIndex: Observable<number>,
    tasksCount: number
  ) {
    this._textElement = textElement;
    this._precision = precision;
    this._msSinceStarted = 0;
    this._currentTaskNumber = 0;
    this._currentTaskStarted = 0;
    this._spentOnTasks = new Array<number>(tasksCount).fill(0);
    this._intervalHandle = 0;
    questionIndex.subscribe(this.switchTask.bind(this));
  }

  private switchTask(newTask: number) {
    this._spentOnTasks[this._currentTaskNumber] +=
      this._msSinceStarted - this._currentTaskStarted;
    this._currentTaskStarted = this._msSinceStarted;
    this._currentTaskNumber = newTask;
  }

  private updateView(): void {
    this._textElement.textContent = timeToClock(this._msSinceStarted);
  }

  public start(): void {
    this._intervalHandle = window.setInterval(() => {
      this._msSinceStarted += this._precision;
      this.updateView();
    }, this._precision);
  }

  public stop(): void {
    this.switchTask(0);
    window.clearInterval(this._intervalHandle);
  }

  get timesSpent(): readonly number[] {
    return this._spentOnTasks;
  }
}
