var express = require("express");
const db = require("./config/connection");
var app = express();
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
app.set('superSecret', "scores");
var customSortController = require('./controller/scoreController');
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// create user API 
app.post("/create-user", (req, res, next) => {
  try {
    if (req.body.imageUrl == "" || req.body.imageUrl == undefined) {
      return res.json({
        success: false,
        message: 'imageUrl should not empty'
      });
    }
    if (req.body.uniqueId == "" || req.body.uniqueId == undefined) {
      return res.json({
        success: false,
        message: 'uniqueId should not empty'
      });
    }
    let name = req.body.name;
    let imageUrl = req.body.imageUrl;
    let uniqueId = req.body.uniqueId;
    db.run('INSERT INTO users(name, imageUrl,uniqueId) VALUES(?, ?, ?)', [name, imageUrl, uniqueId], function (err) {
      if (err) {
        return res.json({
          success: false,
          message: err.message
        });
      } else {
        var payload = { 'name': name, 'imageUrl': imageUrl, 'uniqueId': uniqueId };
        let token = name+"-"+uniqueId+"-"+this.lastID;
        //var token = jwt.sign(payload, app.get('superSecret'), { expiresIn: '2h' });
        return res.json({
          success: true,
          token: token,
          ...payload
        });
      }
    })

  } catch (error) {
    return res.json({
      success: false,
      message: error.message
    });

  }

});

// find user API
app.get("/get-user", (req, res, next) => {
  try {
    if (req.query.uniqueId == "" || req.query.uniqueId == undefined) {
      return res.json({
        success: false,
        message: 'uniqueId should not empty'
      });
    }
    let sql = `SELECT rowId,name,uniqueId
             FROM users
             WHERE uniqueId  = ?`;
    db.get(sql, [req.query.uniqueId], function (err, row) {
      if (err) {
        return res.json({
          success: false,
          message: err.message
        });
      }
      if (!row) {
        return res.json({
          success: true,
          message: "user not available"
        });
      } else {
        //var payload = { 'name': name, 'imageUrl': imageUrl, 'uniqueId': uniqueId };
        //var token = jwt.sign(row, app.get('superSecret'), { expiresIn: '2h' });
        let token = row.name+"-"+row.uniqueId+"-"+row.rowid;
        return res.json({
          success: true,
          token,
          ...row
        });
      }
    })

  } catch (error) {
    return res.json({
      success: false,
      message: error.message
    });

  }
});
// submit new score
app.post('/submit-score',(req,res,next)=>{
  try {
    //console.log(req.body);
    if (req.body.leaderboardName == "" || req.body.leaderboardName == undefined) {
      return res.json({
        success: false,
        message: 'leaderboardName should not empty'
      });
    }
    if (req.body.score == "" || req.body.score == undefined) {
      return res.json({
        success: false,
        message: 'score should not empty'
      });
    }
    if (req.body.token == "" || req.body.token == undefined) {
      return res.json({
        success: false,
        message: 'token should not empty'
      });
    }
    let sql = `SELECT *
             FROM scores
             WHERE leaderboardName  = ?`;
    db.all(sql,[req.body.leaderboardName],function(err,row){
      if(err){
        return res.json({
          success: false,
          message: err.message
        });
      }else{
        let userUniqueId = req.body.token.split("-");
        let newRow = {
          leaderboardName:req.body.leaderboardName,
          score:req.body.score,
          place:0,
          userUniqueId:userUniqueId[1],
          createdAt:Date.now(),
          percentage:0
        }
        row.forEach((data,index)=>{ //remove existing user data if exist
          if(data.userUniqueId == newRow.userUniqueId){
            row.splice(index,1);
          }
        })
        row.push(newRow); //push coming body in data row
        let userCount = row.length;
        row.sort(customSortController.customSort); //sort row by score
        row.forEach((data,index)=>{  //update place and percentage
          if(index>0 && row[index].score == row[index-1].score){ // if two or more user have same score, then place should be same
            row[index].place = row[index-1].place;
            row[index].percentage = parseInt(row[index].place)/userCount;
          }else{
            row[index].place = index+1;
            row[index].percentage = parseInt(row[index].place)/userCount;
          }
          if(data.userUniqueId == newRow.userUniqueId){ // update newRow place and percentage for return data
            newRow.place = row[index].place;
            newRow.percentage = row[index].percentage;
          }
        });

        let deleteSql = "delete from scores where leaderboardName =?";
        db.run(deleteSql,req.body.leaderboardName,function(err,data){
          if(err){
            return res.json({
              success: false,
              message: err.message
            });
          }else{ //insert updated data in scores table
            let insertQuery = 'INSERT INTO scores(leaderboardName, score, place, userUniqueId, createdAt, percentage) VALUES(?, ?, ?, ?, ?, ?)';
            let statement = db.prepare(insertQuery);
            row.forEach(rowData=>{
              statement.run([rowData.leaderboardName, rowData.score, rowData.place, rowData.userUniqueId, rowData.createdAt, rowData.percentage],function(err){
                if (err) {
                  return res.json({
                    success: false,
                    message: err.message
                  });
                }
              });
            })
            statement.finalize();
            return res.json({
              success: true,
              place: newRow.place,
              percentage:newRow.percentage
            });

          }
        })
      }
    })         

  } catch (error) {
    return res.json({
      success: false,
      message: error.message
    });
  }
});

// get top score of perticular leader board
app.get('/top-score', (req, res, next) => {
  try {
    if(req.query.leaderboardName == "" || req.query.leaderboardName == undefined){
      return res.json({
        success: false,
        message: 'leaderboardName should not empty'
      });
    }
    let sql ="select s.place as rank, s.score, u.name, u.imageUrl, s.createdAt from scores as s INNER JOIN users as u on (s.userUniqueId == u.uniqueId) where s.leaderboardName=?";
    db.all(sql,[req.query.leaderboardName],function(err, data){
      console.log(data);
      console.log(err);
      if(err){
        return res.json({
          success: false,
          message: error.message
        });
      }else{
        return res.json(data);
      }
    })
  } catch (error) {
    return res.json({
      success: false,
      message: error.message
    });
  }
});
