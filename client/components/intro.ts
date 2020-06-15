import {Slide} from './slide';
import {getLocalStorageRanking, msToSecondsStr} from './summary';

export class Intro extends Slide {
  private _startQuizButton: HTMLButtonElement;
  private _resultsList: HTMLOListElement;

  constructor(startCallback: () => void) {
    super(document.querySelector('.before-quiz') as HTMLDivElement);
    this._startQuizButton = this._slideElem.querySelector(
      '.start-btn'
    ) as HTMLButtonElement;
    this._resultsList = this._slideElem.querySelector(
      '.results-list'
    ) as HTMLOListElement;

    this.updateRanking();
    this._startQuizButton.onclick = startCallback;
    this._startQuizButton.disabled = false;
  }

  public updateRanking(): void {
    this._resultsList.innerHTML = '';
    getLocalStorageRanking().forEach(x => {
      const newLi = document.createElement('li');
      newLi.innerHTML = `${msToSecondsStr(x)} s`;
      this._resultsList.appendChild(newLi);
    });
  }
}
