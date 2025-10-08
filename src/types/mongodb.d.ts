import { Db } from 'mongodb';

declare module '*.js' {
  const db: Db;
  export default db;
}