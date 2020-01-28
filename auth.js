#!/usr/bin/env node
const inquirer = require('inquirer');
const querystring = require('querystring');
const byte = require('./byte');
const { client_id } = require('./config');

const verifier = Math.floor(Math.random() * 9e6).toString();
const params = {
  gidas: 1,
  response_type: 'code',
  scope: ['email', 'profile'].join(' '),
  verifier,
  hl: 'en-US',
  redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
  client_id,
  gpsdk: 'gid-4.4.0'
};
const oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + querystring.encode(params);

console.log('Open the following URL in any browser and log in with your Google account:');
console.log(oauthUrl);

const register = (googleToken) => {
  inquirer.prompt({
    type: 'input',
    question: 'What username would you like?',
    name: 'username'
  }).then((answer) => {
    const { username } = answer;
    byte.checkUsername(username).then((response) => {
      const { data } = response;
      if (data.error) {
        console.error(`Error: ${data.error.message}`);
        return register(googleToken);
      }
      byte.signUp(googleToken, username).then((signupResponse) => {
        const { data: signupData } = signupResponse;
        if (signupData.data && signupData.data.token) {
          console.log('Successfully signed up!');
          console.log(`Your token is ${signupData.data.token.token}`);
        } else {
          console.error('An error occured while signing up:')
          console.error(signupData.data)
        }
        return true;
      });
      return false;
    });
  });
};

inquirer.prompt({
  type: 'input',
  message: 'Enter your authentication code here',
  name: 'code',
  validate: (input) => input.startsWith('4/'),
}).then((x) => {
  const { code } = x;
  console.log('Okay, requesting token from Google...');
  byte.requestGoogleToken(code.trim(), verifier).then((output) => {
    const { data } = output;
    if (data.id_token) {
      console.log('Success, authenticating with Byte servers...');
      byte.authenticate(data.id_token).then((login) => {
        const { data: loginData } = login;
        
        if (loginData && loginData.data && loginData.data.token) {
          console.log('Logged in successfully!');
          console.log(`You are logged in as @${loginData.data.account.username}`);
          console.log(`Your token is ${loginData.data.token.token}`);
        } else if (loginData.error.code === 1305) {
          console.log('This Google account hasn\'t been used yet for Byte.');
          inquirer.prompt({
            type: 'confirm',
            message: 'Do you want to sign up?',
            name: 'signUp',
          }).then((answer) => {
            const { signUp } = answer;
            return signUp ? register(data.id_token) : true;
          });
        } else {
          console.error('An error occurred while logging in:');
          console.error(login.data);
        }
      });
    } else {
      console.error('An error occurred while getting google token:');
      console.error(data);
    }
  });
});
