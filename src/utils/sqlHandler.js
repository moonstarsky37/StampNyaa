const sqlite3 = require('sqlite3').verbose();

const sqlHandler = {
  db: null,
  init: function (path) {
    this.db = new sqlite3.Database(path, (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Connected to the stickers database.');
    });
    // Create favorites table if it doesn't exist
    // PackID/ID key and position value
    this.db.run(
      `CREATE TABLE IF NOT EXISTS favorites (
        PackID TEXT NOT NULL,
        ID TEXT NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (packID, ID)
      )`
    );
    // Create most used table if it doesn't exist
    // PackID/ID key and count value
    this.db.run(
      `CREATE TABLE IF NOT EXISTS stickerUses (
        PackID TEXT NOT NULL,
        ID TEXT NOT NULL,
        count INTEGER NOT NULL,
        PRIMARY KEY (packID, ID)
      )`
    );
  },
  /**
   * Gets the favorites
   * @returns {Promise<Array>} Array of objects of the form {PackID, ID, position}
   */
  getFavorites: function () {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM favorites ORDER BY position', (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  },
  /**
   * Sets the favorites
   * @param {Object<Array>} favorites Array of objects of the form {PackID, ID}; position is the index in the array
   * @returns
   */
  setFavorites: function (favorites) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM favorites');
        const statement = this.db.prepare('INSERT INTO favorites VALUES (?, ?, ?)');
        for (const [position, { PackID, ID }] of favorites.entries()) {
          statement.run(PackID, ID, position);
        }
        statement.finalize();

        resolve();
      });
    });
  },
  /**
   * Gets the most used stickers
   * @param {number} count Amount of most used stickers to return
   */
  getMostUsed: function (count) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM stickerUses ORDER BY count DESC LIMIT ${count}`, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  },
  /**
   * Increments the count of the given sticker
   * @param {Object} sticker Object of the form {PackID, ID}
   */
  useSticker: function (sticker) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO stickerUses (PackID, ID, count) VALUES (?, ?, 1)
        ON CONFLICT(PackID, ID) DO UPDATE SET count = count + 1`,
        [sticker.PackID, sticker.ID],
        (err) => {
          if (err) {
            reject(err);
          }
          resolve();
        }
      );
    });
  },
};

module.exports = sqlHandler;
