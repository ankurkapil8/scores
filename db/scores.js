const db = require('../config');
module.exports = {
    async getUser(userId) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT rowId,name,uniqueId
            FROM users
            WHERE uniqueId  = ?`;
            db.get(sql, [userId], function (err, row) {
                if (err) {
                    reject(err);
                }
                if (!row) {
                    resolve("user not available");
                } else {
                    let token = row.name + "-" + row.uniqueId + "-" + row.rowid;
                    resolve({
                        token,
                        ...row
                    })
                }
            })

        })
    },
    async createUser(data) {
        return new Promise((resolve, reject) => {
            let name = data.name;
            let imageUrl = data.imageUrl;
            let uniqueId = data.uniqueId;
            db.run('INSERT INTO users(name, imageUrl,uniqueId) VALUES(?, ?, ?)', [name, imageUrl, uniqueId], function (err) {
                if (err) {
                    reject(err.message);
                } else {
                    var payload = { 'name': name, 'imageUrl': imageUrl, 'uniqueId': uniqueId };
                    let token = name + "-" + uniqueId + "-" + this.lastID;
                    resolve({
                        token: token,
                        ...payload
                    })
                }
            })
        })
    },
    async submitScore(newRow) {
        return new Promise((resolve, reject) => {
            let insertQuery = `INSERT INTO scores(leaderboardName, score, userUniqueId, createdAt)
            VALUES(?, ?, ?, ?) 
            ON CONFLICT(leaderboardName,userUniqueId) DO UPDATE SET
              score=?
            WHERE score < ?`;
            let statement = db.prepare(insertQuery);
            statement.run([newRow.leaderboardName, newRow.score, newRow.userUniqueId, newRow.createdAt, newRow.score, newRow.score], function (err) {
                if (err) {
                    reject(err.message);
                } else {
                    let query = `select p1.*,(select count(*) from scores)as totalRecord,(select  count(*) from scores as p2 where p2.score > p1.score) as Place from scores as p1 where p1.userUniqueId = ? and p1.leaderboardName=?;`;
                    db.get(query, [newRow.userUniqueId, newRow.leaderboardName], function (err, data) {
                        if (err) {
                            reject(err.message);
                        } else {
                            let userPlace = parseInt(data.Place) + 1;
                            resolve({
                                success: true,
                                place: userPlace,
                                percentage: userPlace / data.totalRecord
                            })
                        }
                    })

                }
            });
        })
    },
    async getTopScore(leaderboardName) {
        return new Promise((resolve, reject) => {
            let sql = "SELECT s.score,s.createdAt,u.name,u.imageUrl, DENSE_RANK () OVER ( PARTITION BY s.leaderboardName ORDER BY s.score DESC ) rank FROM scores as s INNER JOIN users as u on (s.userUniqueId == u.uniqueId) WHERE s.leaderboardName = ?";
            db.all(sql, [leaderboardName], function (err, data) {
                if (err) {
                    reject(err.message)
                } else {
                    resolve(data);
                }
            })
        })
    },
    async getUserScore(leaderboardName, uniqueId, limit) {
        return new Promise((resolve, reject) => {
            let sql = `WITH
            -- Keep temporary table of ranks
            ranks AS (SELECT *, DENSE_RANK () OVER ( PARTITION BY leaderboardName ORDER BY score DESC ) rank FROM scores WHERE leaderboardName = ?)
            -- Select ranks around 
          SELECT u.name,u.imageUrl,u.uniqueId,ranks.score,ranks.rank,ranks.createdAt,
            (SELECT rank FROM ranks WHERE userUniqueId = ?) AS ogRank
          FROM ranks
          INNER JOIN users as u on (ranks.userUniqueId == u.uniqueId)
          WHERE ranks.rank >= ogRank - 2
           AND ranks.rank <= ogRank +2
          ORDER BY rank LIMIT ?;`;
            db.all(sql, [leaderboardName,uniqueId,limit], function (err, row) {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(row);
                }
            })
        })
    }
}