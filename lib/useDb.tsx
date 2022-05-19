import { useEffect, useState } from "react";
import { Database, QueryExecResult } from "sql.js";

export function useDB(data: null | Uint8Array) {
  const [engine, setEngine] = useState<Database | null>(null);
  const [db, setDB] = useState(null);
  const [windowWatcher, setWindowWatcher] = useState(false);

  useEffect(() => {
    if (window) {
      console.log("Running in a browser, checking for loadSQL");

      const timer = setInterval(() => {
        console.log("Polling...");

        // @ts-ignore
        if (window.loadSQL) {
          console.log("Clearing timer");
          clearInterval(timer);
          setWindowWatcher(true);
        }
      }, 500);
    }
  }, []);

  useEffect(() => {
    console.log("Looking for loadSQL");
    // @ts-ignore
    if (window.loadSQL) {
      console.log("Should try initSQLJS");
      // @ts-ignore
      window.loadSQL().then((db) => {
        console.log("I have the database");
        setEngine(db);
      });
    }
    return () => {};
  }, [windowWatcher]);

  useEffect(() => {
    if (engine && data) {
      console.log("Starting up the engine", data);

      // @ts-ignore
      setDB(new engine.Database(data));
    }

    return () => {};
  }, [data, engine]);

  return db;
}

export function useDBQuery(db: Database | null, query: string) {
  const [results, setResults] = useState<QueryExecResult[] | null>(null);

  useEffect(() => {
    if (db) {
      console.log(`Running query ${query}`);
      const r = db.exec(query);
      console.log(r);
      // @ts-ignore
      window.results = r;
      setResults(r);
    }
  }, [db, query]);

  return results;
}
