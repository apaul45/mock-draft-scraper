import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { serializeSimulation, Simulation } from '../utils';
import { getResults, getSimulations } from '../utils/resources';
import { DbResult, DbSimulation } from '.';

export async function initializeDb() {
  const db = await open({
    filename: './drafts.db',
    driver: sqlite3.cached.Database,
  });

  await db.exec(`CREATE TABLE IF NOT EXISTS simulations (
    scraper_name TEXT,
    players TEXT,
    date TEXT,
    picked_for TEXT
  )`);

  await db.exec(`CREATE TABLE IF NOT EXISTS results (
    result TEXT,
    date TEXT
  )`);

  return db;
}

export class SimulationsDb {
  db: Database;

  constructor(db: Database) {
    if (!db) {
      throw new Error('Db not initialized');
    }

    this.db = db;
  }

  async insertSimulations(simulations: DbSimulation[]) {
    try {
      // Generate value placeholders for each row
      const placeholders = simulations.map(() => '(?, ?, ?, ?)').join(', ');

      const values = simulations.flatMap((simulation) => {
        const { players, pickedFor } = serializeSimulation(simulation);

        return [
          simulation.scraperName,
          JSON.stringify(players),
          simulation.date ?? new Date().toISOString(),
          pickedFor,
        ];
      });

      // Single transaction for all inserts
      await this.db.run('BEGIN TRANSACTION');

      await this.db.run(
        `INSERT INTO simulations (scraper_name, players, date, picked_for) 
         VALUES ${placeholders}`,
        values
      );

      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  async retrieveSimulations() {
    const result = await this.db.all(`SELECT * FROM simulations`);
    return result;
  }

  async getMostRecentSimulations(range: number = 30) {
    const result = await this.db.all(
      `SELECT * FROM simulations 
      WHERE datetime(date) >= datetime('now', '-${range} days')
      ORDER BY datetime(date) DESC`
    );

    if (result) {
      return result.map((simulation) => {
        const escapedPlayers = simulation.players?.replace(/\\/g, '');

        return {
          ...simulation,
          players: JSON.parse(escapedPlayers),
        };
      });
    }

    return result;
  }
}

export class ResultsDb {
  db: Database;

  constructor(db: Database) {
    if (!db) {
      throw new Error('Db not initialized');
    }

    this.db = db;
  }

  async addResult(result: DbResult) {
    await this.addResults([result]);
  }

  async addResults(results: DbResult[]) {
    try {
      // Generate value placeholders for each row
      const placeholders = results.map(() => '(?, ?)').join(', ');

      const values = results.flatMap(({ result, date }) => {
        return [
          JSON.stringify(result),
          new Date(date ?? Date.now()).toISOString(),
        ];
      });

      // Single transaction for all inserts
      await this.db.run('BEGIN TRANSACTION');

      await this.db.run(
        `INSERT INTO results (result, date) 
         VALUES ${placeholders}`,
        values
      );

      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  async retrieveResults() {
    const result = await this.db.all(`SELECT * FROM results`);
    return result;
  }

  async updateResult(result: DbResult) {
    await this.db.run(`UPDATE results SET result = ? WHERE rowid = ?`, [
      JSON.stringify(result.result),
      result.rowId,
    ]);
  }

  async getMostRecentResult(range: number = 7) {
    const result = await this.db.get(
      `SELECT rowid, * FROM results 
      WHERE datetime(date) >= datetime('now', '-${range} days')
      ORDER BY datetime(date) DESC 
      LIMIT 1`
    );

    if (result) {
      const escapedResult = result.result?.replace(/\\/g, '');

      return {
        result: JSON.parse(escapedResult),
        date: new Date(result.date),
        rowId: result.rowid,
      };
    }
    return undefined;
  }
}
