import auth0 from 'auth0-js';
class Auth {
  constructor() {
    this.auth0 = new auth0.WebAuth({
      domain: 'zenika.eu.auth0.com',
      clientID: '60hXTJPUSI2lD7gMilLEvOa7DH1zC0WO',
      redirectUri: window.location.origin,
      responseType: 'token id_token',
      scope: 'openid email profile list:all-resumes list:own-resumes write:resume read:resume',
      audience: 'https://resume.zenika.com'
    });
  }

  login() {
    this.auth0.authorize();
  }

  handleAuthentication() {
    return new Promise((resolve, reject) => {
      // first, try recovering from localstorage
      try {
        const savedAuthResult = JSON.parse(localStorage.getItem('auth0'));
        this.setSession(savedAuthResult);
        // now need to check if token in local storage is still valid
        if (this.isAuthenticated()) {
          resolve(savedAuthResult);
          return;
        }
      } catch (err) {
        // just in case it contains garbage
        localStorage.removeItem('auth0');
      }
      // localstorage failed, let's try the hash
      this.auth0.parseHash((err, authResult) => {
        if (err) {
          reject(err);
        } else {
          window.location.hash = '';
          if (authResult && authResult.accessToken && authResult.idToken) {
            this.setSession(authResult);
          }
          resolve(authResult);
        }
      });
    });
  }

  setSession(authResult) {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('auth0', JSON.stringify(authResult));

    // Set the time that the access token will expire at
    const expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    this.expiresAt = expiresAt;
    this.userProfile = authResult.idTokenPayload;
  }

  logout() {
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = 0;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('auth0');
    this.login();
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }

}

const auth = new Auth();

export const authorizedFetch = (url, init) => {
  init = init || {};
  init.headers = init.headers || {};
  init.headers.Authorization = `Bearer ${auth.accessToken}`;
  return fetch(url, init).then(response => {
    if (401 === response.status) {
      auth.logout();
      throw new Error('not logged in');
    }
    return response;
  });
};

export default auth;
