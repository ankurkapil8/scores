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
            let sql = "select u.name,u.imageUrl,p1.*,(select  count(*) from scores as p2 where p2.score > p1.score) as rank from scores as p1 INNER JOIN users as u on (p1.userUniqueId == u.uniqueId) where p1.leaderboardName=?;"
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
            let userIndex = -1;
            let arrLength = 0;
            let sql = "select u.name,u.imageUrl,u.uniqueId,p1.*,(select  count(*) from scores as p2 where p2.score > p1.score) as rank from scores as p1 INNER JOIN users as u on (p1.userUniqueId == u.uniqueId) where p1.leaderboardName=?;"
            db.all(sql, [leaderboardName], function (err, row) {
                let returnData = [];
                if (err) {
                    reject(err.message);
                } else {
                    arrLength = row.length;
                    row.forEach((data, index) => {
                        if (data.uniqueId == uniqueId) {
                            userIndex = index;
                        }
                    });
                    if (userIndex < 0) {
                        reject("user not available in leader board");
                    }
                    let quotient = Math.floor(limit / 2);
                    let startindex = userIndex - quotient;
                    if (startindex < 0) { // not enaugh element from start
                        startindex = 0;
                    }
                    let remainingElement = arrLength - startindex;
                    if (remainingElement < limit) { // no enaugh element at end
                        let moveIndex = limit - remainingElement;
                        startindex = startindex - moveIndex;

                    }
                    let end = parseInt(startindex) + parseInt(limit);
                    for (var i = startindex; i < end; i++) {
                        returnData.push(row[i]);
                    }
                    resolve(returnData);
                }

            })

        })
    }

}