# scores
# Requirements

  - Node.js >= 10.12.1
  - npm 6.4.1
# steps
- npm install
- node app.js


# APIs
## create user
url:- /create-user

type:- post

params:- {
    "name":"",
    "imageUrl":"",
    "uniqueId":""
}

response:- {
    "success": true/false,
    "token": "",
    "imageUrl": "",
    "uniqueId": "",
    "name":""
}

## find user
url:- /get-user?uniqueId=xyz

type:- get

response:- {
    "success": true/false,
    "imageUrl": "",
    "uniqueId": "",
    "name":""
}

## submit score

url:- /submit-score

type:- post

param:- {
    "leaderboardName":"",
    "score":1,
    "token":""
}  


response:- {
    "success": true,
    "place": 4,
    "percentage": 0.8
}

## get top score

url:- /top-score?leaderboardName=board1

type:- get

response:- [
    {
        "rank": 1,
        "score": 11,
        "name": "amit",
        "imageUrl": "http://amit.jpg",
        "createdAt": 1601788809771
    }]



