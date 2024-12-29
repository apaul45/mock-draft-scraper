import admin from 'firebase-admin';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { BaseResultsDb, BaseSimulationsDb, DbResult, DbSimulation } from '.';
import { getSimulations } from '../utils/resources';
import { applicationDefault } from 'firebase-admin/app';
import { configDotenv } from 'dotenv';

export function initializeDb() {
  configDotenv();
  const { FIREBASE_AUTH_DOMAIN, FIREBASE_STORAGE_BUCKET } = process.env;

  const app = admin.initializeApp({
    credential: applicationDefault(),
    databaseURL: FIREBASE_AUTH_DOMAIN,
    storageBucket: FIREBASE_STORAGE_BUCKET,
  });

  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  db.collection('simulations');

  return db;
}

export class SimulationsDb implements BaseSimulationsDb {
  db: Firestore;

  constructor(db: Firestore) {
    if (!db) {
      throw new Error('Db not initialized');
    }

    this.db = db;
  }

  async insertSimulations(simulations: DbSimulation[]) {
    try {
      const batch = this.db.batch();

      simulations.forEach((simulation) => {
        const simulationDate = simulation.date ?? new Date();

        batch.create(this.db.collection('simulations').doc(), {
          ...simulation,
          date: Timestamp.fromDate(new Date(simulationDate)),
        });
      });

      await batch.commit();
      console.log(`Inserted ${simulations.length} simulations`);
    } catch (err) {
      console.error(err);
    }
  }

  async getMostRecentSimulations(range: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);
    const startDateTimestamp = Timestamp.fromDate(startDate);

    const snapshot = await this.db
      .collection('simulations')
      .where('date', '>=', startDateTimestamp)
      .get();

    return snapshot.docs.map((doc) => doc.data() as DbSimulation);
  }
}

export class ResultsDb implements BaseResultsDb {
  bucket;

  constructor() {
    this.bucket = getStorage().bucket();
  }

  async addResult(result: DbResult) {
    const { result: resultObj, date } = result;

    const filenameDate = new Date(date ?? Date.now()).toISOString();
    const filename = `${filenameDate}.json`;

    await this.bucket.file(filename).save(JSON.stringify(resultObj));
  }

  // Uploading files to Firebase Storage
  // as result objects are too large to store in Firestore
  async addResults(results: DbResult[]) {
    const uploads = results.map((result) => this.addResult(result));
    await Promise.all(uploads);
  }
}
