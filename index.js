const express = require('express');
require('./')
const cors = require('cors');
const dotenv = require('dotenv');
const {RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole} = require('agora-access-token');
const {ChatTokenBuilder} = require('agora-token')

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const APP_ID = 'b8e5a7e1a8524c3999359b0d30bee2bb';
const APP_CERTIFICATE = '9271853c90e14e9d9f43cc8f74802541';

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
  let token;
  if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  } else if (req.params.tokentype === 'uid') {
    console.log("DSDSDS")
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

app.options('*', cors());
app.get('/ping', nocache, ping)
app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateRTCToken);
app.get('/rtm/:uid/', nocache , generateRTMToken);
app.get('/rte/:channel/:role/:tokentype/:uid', nocache, generateRTEToken);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
