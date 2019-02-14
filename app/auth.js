import auth0 from 'auth0-js';
class Auth {
  constructor() {
    this.auth0 = new auth0.WebAuth({
      domain: 'zenika.eu.auth0.com',
      clientID: '60hXTJPUSI2lD7gMilLEvOa7DH1zC0WO',
      redirectUri: 'http://localhost:3000/',
      responseType: 'token id_token',
      scope: 'openid list:all-resumes list:own-resumes write:resume read:resume',
      audience: 'https://resume.zenika.com'
    });
  }

  login() {
    this.auth0.authorize();
  }

  handleAuthentication() {
    return new Promise((resolve, reject) => {
      this.auth0.parseHash((err, authResult) => {
        if (err) {
          reject(err);
        } else {
          if (authResult && authResult.accessToken && authResult.idToken) {
            this.setSession(authResult);
          }
          resolve(authResult);
        }
      });
    });
  }

  getAccessToken() {
    return this.accessToken;
  }

  getIdToken() {
    return this.idToken;
  }

  setSession(authResult) {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');

    // Set the time that the access token will expire at
    let expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    this.expiresAt = expiresAt;
  }

  renewSession() {
    this.auth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
      } else if (err) {
        this.logout();
        console.log(err);
        alert(`Could not get a new token (${err.error}: ${err.error_description}).`);
      }
    });
  }

  logout() {
    // Remove tokens and expiry time
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = 0;

    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    let expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }

}

const auth = new Auth();

export const redirectToLogin = () => {
  auth.login();
};

export const authorizedFetch = (url, init) => {
  init = init || {};
  init.headers = init.headers || {};
  init.headers.Authorization = `Bearer ${auth.getAccessToken()}`;
  return fetch(url, init).then(response => {
    if (401 === response.status) {
      redirectToLogin();
      throw new Error('not logged in');
    }
    return response;
  });
};

export default auth;
