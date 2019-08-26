import auth0, { Auth0DecodedHash } from 'auth0-js';

const auth = new auth0.WebAuth({
    domain: 'zenika.eu.auth0.com',
    clientID: '60hXTJPUSI2lD7gMilLEvOa7DH1zC0WO',
    redirectUri: window.location.origin,
    responseType: 'token id_token',
    scope: 'openid email profile list:all-resumes list:own-resumes write:resume read:resume',
    audience: 'https://resume.zenika.com'
});

// we ultimately want this in a store
export let authInfo: Auth0DecodedHash = {}

const login = () => {
    auth.authorize();
  }

const handleAuthentication = () => {
      // first, try recovering from localstorage
      try {
        const savedAuthResult = JSON.parse(localStorage.getItem('auth0') || "");
        setSession(savedAuthResult);
        // now need to check if token in local storage is still valid
        if (isAuthenticated()) {
          return savedAuthResult
        }
      } catch (err) {
        // just in case it contains garbage
        localStorage.removeItem('auth0');
      }
      // localstorage failed, let's try the hash
      auth.parseHash((err, authResult) => {
        if (err) {
          throw err;
        } else {
          if (authResult && authResult.accessToken && authResult.idToken) {
            setSession(authResult);
          }
          return authResult;
        }
      });
  }

  const setSession = (authResult: auth0.Auth0DecodedHash) => {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('auth0', JSON.stringify(authResult));

    authInfo = authResult;
  }

  const computeExpiresAt = (expiresIn: number) => (expiresIn * 1000) + new Date().getTime()

  const logout = () => {
    authInfo = {};
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('auth0');
    login();
  }

  const isAuthenticated = () => {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = computeExpiresAt(authInfo.expiresIn || 0);
    return new Date().getTime() < expiresAt;
  }


export const authorizedFetch = (url: string, headers?: string[][]) => {
  headers = headers ? [...headers, ["Authorization", `Bearer ${authInfo.accessToken}`]] : headers;
  return fetch(url, {headers}).then(response => {
    if (401 === response.status) {
      logout();
      throw new Error('not logged in');
    }
    return response;
  });
};
