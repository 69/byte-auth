const axios = require('axios');
const queryString = require('querystring');
const { client_id } = require('./config');

const byteClient = axios.create({
  baseURL: 'https://api.byte.co',
  headers: {
    'User-Agent': 'byte/0.2 (co.byte.video; build:145; iOS 12.4.0) Alamofire/4.9.1',
    'Accept-Language': 'en-GB;q=1.0',
  }
})

const requestGoogleToken = (code, verifier) => axios({
  url: 'https://oauth2.googleapis.com/token',
  method: 'POST',
  headers: {
    'user-agent': 'gtm-oauth2 co.byte.video/0.2',
    'content-type': 'application/x-www-form-urlencoded',
  },
  data: queryString.stringify({
    client_id,
    code,
    grant_type: 'authorization_code',
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    verifier,
  })
});

const authenticate = (authToken) => byteClient.post('/authenticate/google', {
  token: authToken
});

const checkUsername = (username) => byteClient.post('/account/register/precheck', {
  username
});

const signUp = (authToken, username) => byteClient.post('/account/register', {
  inviteCode: 'NA',
  service: 'google',
  token: authToken,
  username
})

module.exports = {
  requestGoogleToken,
  authenticate,
  checkUsername,
  signUp
};
