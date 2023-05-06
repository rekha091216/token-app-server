const express = require('express');
require('./')
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const {RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole} = require('agora-access-token');
const {ChatTokenBuilder} = require('agora-token')
const process = require('process');

const customerKey = "f32be91f04934fe3967bb402d1920b81";

const customerSecret = "384a689aa6a243e9aa932e710f6c42aa";

const plainCredential = customerKey + ":" + customerSecret

encodedCredential = Buffer.from(plainCredential).toString('base64')
authorizationField = "Basic " + encodedCredential

process.emitWarning('Running out of Storage');
  
// Event 'warning' 
process.on('warning', (warning) => {
  console.warn("warning stacktrace - " + warning.stack)
});

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3030;
const APP_ID = 'b8e5a7e1a8524c3999359b0d30bee2bb';
const APP_CERTIFICATE = '9271853c90e14e9d9f43cc8f74802541';

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(cors({ origin: 'http://localhost:3000' }));

const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const ping = (req, resp) => {
  resp.send({message: 'pong'});
}

const generateRTCToken = (req, resp) => {
  // set response header senalways
  resp.header('Access-Control-Allow-Origin', '*');
  // get channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(400).json({ 'error': 'channel is required' });
  }
  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(400).json({ 'error': 'role is incorrect' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  let token;
  if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  } else if (req.params.tokentype === 'uid') {
    console.log(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  } else {
    return resp.status(400).json({ 'error': 'token type is invalid' });
  }
  // return the token
  return resp.json({ 'rtcToken': token });
}

const generateRTMToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');

  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role = RtmRole.Rtm_User;
   // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  console.log(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime)
  const token = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return resp.json({ 'rtmToken': token });
}

const generateRTEToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');
  // get channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(400).json({ 'error': 'channel is required' });
  }
  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(400).json({ 'error': 'role is incorrect' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  const rtmToken = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return resp.json({ 'rtcToken': rtcToken, 'rtmToken': rtmToken });
}

//Agora Chat APIs to register , adding user to the group, fetch users from the group
app.get('/register', async(req, res) => {
  const appToken = ChatTokenBuilder.buildAppToken(APP_ID, APP_CERTIFICATE, 36000);
  const account = req.query.account.replace('%','');
  const password = req.query.password.replace('%','');
  
  const body = {'username': account, 'password': password, 'nickname': account};
  
  await fetch('https://a61.chat.agora.io/61501494/948832/users', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'Authorization': "Bearer " + appToken,
    },
    body: JSON.stringify(body)
  }).then(res => 
    res.json()
    ).then(json =>  {
      res.status(200).send({
        json
      })}).
    catch(error => console.log(error))
})

app.get('/addUser', async (req, res) => {
  
  const appToken = ChatTokenBuilder.buildAppToken(APP_ID, APP_CERTIFICATE, 36000);
  const userName = req.query.userName.replace('%','');
  
  await fetch(`https://a61.chat.agora.io/61501494/948832/chatgroups/213795301556225/users/${userName}`, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'Authorization': "Bearer " + appToken,
    }
  }).then(res => 
    res.json()
    ).then(json =>  {
      res.status(200).send({
        json
      })}).
    catch(error => console.log(error))
})

app.get('/fetchUsers', (req, res) => {
  
  const appToken = ChatTokenBuilder.buildAppToken(APP_ID, APP_CERTIFICATE, 36000);
  
  return  fetch("https://a61.chat.agora.io/61501494/948832/chatgroups/213795301556225/users/", {
    method: 'get',
    headers: {
      'content-type': 'application/json',
      'Authorization': "Bearer " + appToken,
    }
  }).then(res => 
    res.json()
    ).then(json =>  {
      res.status(200).send({
        json
      })}).
    catch(error => console.log(error))
})

//Agora Cloud recording APIS to acquire, start and stops recording
app.post('/acquire', (req, res) => {

  const channelName = req.query.channelName.replace('%','');
  const recordUid = req.query.recordUid.replace('%', '');
  const channelToken = req.body.channelToken;
  
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", authorizationField);

  var raw = JSON.stringify({
    "cname": channelName,
    "uid": recordUid,
    "clientRequest": {}
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  return fetch(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/acquire`, requestOptions)
 .then(res => 
    res.json()
  ).then(json => {
    res.status(200).send({
      resourceId: json.resourceId
    })
  })
})

app.post('/start', (req, res) => {

  const channelName = req.query.channelName.replace('%','');
  const recordUid = req.query.recordUid.replace('%','');
  const resourceId = req.query.resourceId.replace('%', '');
  console.log(req.body)
  console.log(req.body.channelToken)
  const channelToken = req.body.channelToken;
  const recordUidToken = req.body.recorderToken;
  
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Authorization", authorizationField);

  var raw = JSON.stringify({
  "cname": channelName,
  "uid": recordUid,
    "clientRequest": {
    "token": recordUidToken,
    "recordingConfig": {
      "streamTypes": 2,
      "channelType": 0,
      "streamMode": "standard",
      "subscribeUidGroup": 0
    },
    "transcodingConfig": {
      "width": 360,
      "height": 640,
      "fps": 30,
      "bitrate": 1200
    },
    "storageConfig": {
      "vendor": 1,
      "region": 8,
      "bucket": "agoratest",
      "accessKey": "AKIATXUCJIEWB6FPCSNM",
      "secretKey": "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"
    }
  }
});
  
  var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
  };
  
  return fetch(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/mode/individual/start`, requestOptions)
 .then(res => 
    res.json()
  ).then(json => {
    console.log(json)
    res.status(200).send({
      sessionId: json.sid
    })
  })
})

app.post('/stop', (req, res) => {

  const channelName = req.query.channelName.replace('%','');
  const recordUid = req.query.recordUid.replace('%','');
  const resourceId = req.query.resourceId.replace('%','');
  const sid = req.query.sid.replace('%', '');
  console.log(req)
  
  

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json;charset=utf-8");
  myHeaders.append("Authorization", authorizationField);

  var raw = `{\n  \"cname\": \"${channelName}\",\n  \"uid\": \"${recordUid}\",\n  \"clientRequest\":{\n  }\n}`;

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  return fetch(`https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`, requestOptions)
    .then(res => 
    res.json()
  ).then(json => {
    res.status(200).send({
      fileName: json
    })
  })
  
})

app.options('*', cors());
app.get('/ping', nocache, ping)
app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateRTCToken);
app.get('/rtm/:uid/', nocache , generateRTMToken);
app.get('/rte/:channel/:role/:tokentype/:uid', nocache, generateRTEToken);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
