import Datastore from 'nedb-promises';
import {join} from 'path';

export const DB_PATH = join(__dirname, '/../../db');

export interface User {
  username: string;
  passHash: string;
}

export const db = {
  users: Datastore.create({filename: join(DB_PATH, 'users.db')}),
  quizzes: Datastore.create({filename: join(DB_PATH, 'quizzes.db')}),
  results: Datastore.create({filename: join(DB_PATH, 'results.db')}),
};

export interface QuestionView {
  readonly id: number;
  readonly statement: string;
  readonly secondsPenalty: number;
}

export interface Question extends QuestionView {
  answer: number;
}

export interface Answer {
  readonly question: QuestionView;
  readonly usersAnswer: number;
  readonly timeSpent: number;
}

export interface Quiz {
  readonly id: number;
  readonly name: string;
  readonly questions: Question[];
}

export interface QuizResults {
  readonly userId: string;
  readonly quizId: number;
  readonly answers: Answer[];
  timeMs: number;
}
