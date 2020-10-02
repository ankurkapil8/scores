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


