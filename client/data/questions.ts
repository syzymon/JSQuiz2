export interface Question {
  readonly id: number;
  readonly statement: string;
  readonly answer: number;
  readonly secondsPenalty: number;
}

export interface Quiz {
  readonly id: number;
  readonly name: string;
  readonly questions: Question[];
}

// eslint-disable-next-line
// @ts-ignore
// eslint-disable-next-line no-undef
export const quiz = quizJSON as Quiz;

export function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
