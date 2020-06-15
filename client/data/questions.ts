export interface Question {
  readonly statement: string;
  readonly answer: number;
  readonly secondsPenalty: number;
}

export const questions = [
  {
    statement: '(!+[]+[]+![]).length',
    answer: 9,
    secondsPenalty: 10,
  },
  {
    statement: '"2"+"2"-"2"',
    answer: 20,
    secondsPenalty: 7,
  },
  {
    statement: '11-"1"',
    answer: 10,
    secondsPenalty: 4,
  },
  {
    statement: '{}+[]',
    answer: 0,
    secondsPenalty: 5,
  },
  {
    statement: '[2,10,13,7].sort()[0]',
    answer: 10,
    secondsPenalty: 8,
  },
  {
    statement: '(Math.min() > Math.max()) + true',
    answer: 2,
    secondsPenalty: 5,
  },
  {
    statement: '([]+{}).length',
    answer: 15,
    secondsPenalty: 13,
  },
  {
    statement: '"222" - -"111"',
    answer: 333,
    secondsPenalty: 6,
  },
  {
    statement: 'parseInt(1 / 1999999)',
    answer: 5,
    secondsPenalty: 10,
  },
] as Question[];

export function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
