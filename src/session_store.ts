import session from 'express-session';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import nedb_session_store from 'nedb-session-store';
import {DB_PATH} from './db';
import {join} from 'path';

const NedbStore = nedb_session_store(session);
export const store = new NedbStore({filename: join(DB_PATH, 'session.db')});
