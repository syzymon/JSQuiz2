import Datastore from 'nedb-promises';
import {join} from 'path';

export const DB_PATH = join(__dirname, '/../db');

export interface User {
  username: string;
  passHash: string;
}

export const db = {
  users: Datastore.create({filename: join(DB_PATH, 'users.db')}),
  quizzes: Datastore.create({filename: join(DB_PATH, 'quizzes.db')}),
};

export interface Question {
  readonly statement: string;
  readonly answer: number;
  readonly secondsPenalty: number;
}

export interface Quiz {
  readonly id: number;
  readonly questions: Question[];
}
