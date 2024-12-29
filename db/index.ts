import {
  initializeDb as initializeSqlite,
  SimulationsDb as SqliteSimulationsDb,
  ResultsDb as SqliteResultsDb,
} from './sqlite';
import {
  initializeDb as initializeFirestore,
  SimulationsDb as FirestoreSimulationsDb,
  ResultsDb as FirestoreResultsDb,
} from './firestore';
import { Simulation } from '../utils';
import { getResults, getSimulations } from '../utils/resources';

export type DbSimulation = {
  scraperName: string;
  date?: Date | string;
} & Simulation;

export type DbResult = {
  result: any;
  date?: Date | string;
  id?: string;
  rowId?: number;
};

export interface BaseSimulationsDb {
  insertSimulations: (simulations: DbSimulation[]) => Promise<void>;
  getMostRecentSimulations: () => Promise<DbSimulation[]>;
}

export interface BaseResultsDb {
  addResult: (result: DbResult) => Promise<void>;
  addResults: (results: DbResult[]) => Promise<void>;
  getMostRecentResult?: () => Promise<DbResult>;
  updateResult?: (result: DbResult) => Promise<void>;
}

enum DbType {
  Firestore = 'firestore',
  Sqlite = 'sqlite',
}

export async function getDbs(type: DbType = DbType.Firestore) {
  const db: any =
    type === DbType.Firestore
      ? initializeFirestore()
      : await initializeSqlite();

  return {
    SimulationsDb:
      type === DbType.Firestore
        ? new FirestoreSimulationsDb(db)
        : new SqliteSimulationsDb(db),
    ResultsDb:
      type === DbType.Firestore
        ? new FirestoreResultsDb()
        : new SqliteResultsDb(db),
  };
}

export async function migrateSimulations(SimulationsDb: BaseSimulationsDb) {
  const simulations = getSimulations();
  await SimulationsDb.insertSimulations(simulations);
}

export async function migrateResults(ResultsDb: BaseResultsDb) {
  const results = getResults();
  await ResultsDb.addResults(results);
}
