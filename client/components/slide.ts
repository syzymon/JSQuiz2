import {Observable} from '../core/observable';

export abstract class Slide {
  protected _slideElem: HTMLDivElement;
  private _currentlyHidden: Observable<boolean>;

  protected constructor(slideElement: HTMLDivElement) {
    this._slideElem = slideElement;
    this._currentlyHidden = new Observable(this._slideElem.hidden);
    this.bindDisplay();
  }

  private bindDisplay(): void {
    this._currentlyHidden.subscribe(currentHiddenState => {
      this._slideElem.hidden = currentHiddenState;
    });
  }

  public tearDown(): void {}

  get display(): boolean {
    return !this._currentlyHidden.value;
  }

  set display(to: boolean) {
    if (!to) this.tearDown();
    this._currentlyHidden.value = !to;
  }
}
