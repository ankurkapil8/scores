const sqlite3 = require('sqlite3').verbose();
  let db = new sqlite3.Database('./db/scores.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the scores database.');
  });
  module.exports = db;

