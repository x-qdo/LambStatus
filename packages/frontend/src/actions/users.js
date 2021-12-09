import 'whatwg-fetch'
import {push} from 'react-router-redux'
import {CognitoUserPool, AuthenticationDetails, CognitoUser} from 'amazon-cognito-identity-js'
import {CognitoAuth} from 'amazon-cognito-auth-js'
import {userPoolId, clientId} from 'utils/settings'

export const GET_USER = 'GET_USER'

function poolDataLoader() {
  const url = new URL(window.location.href);
  return {
    UserPoolId: userPoolId,
    ClientId: clientId,
    AppWebDomain: 'skybonds-statuspage.auth.eu-west-1.amazoncognito.com',
    RedirectUriSignIn: url.origin + '/signin',
    RedirectUriSignOut: url.origin + '/signout',
    TokenScopesArray: ['email', 'openid'],
  }
}

export function getUser(user) {
  return {
    type: GET_USER,
    user
  }
}

// cognito library automatically sets signin results to local storage.
// So, we do not save the results to ReduxStore.
export const signin = (username, password, callbacks = {}) => {
  const {onLoad, onNewPasswordRequested, onSuccess, onFailure} = callbacks
  return dispatch => {
    if (onLoad && typeof onLoad === 'function') onLoad()
    const authenticationData = {
      Username: username,
      Password: password
    }
    const authenticationDetails = new AuthenticationDetails(authenticationData)

    const poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId
    }
    const userPool = new CognitoUserPool(poolData)
    const userData = {
      Username: username,
      Pool: userPool
    }
    const cognitoUser = new CognitoUser(userData)
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        if (onSuccess && typeof onSuccess === 'function') onSuccess()
        dispatch(getUser({username}))
        dispatch(push('/'))
      },
      onFailure: (error) => {
        console.error(error.message)
        console.error(error.stack)
        if (onFailure && typeof onFailure === 'function') onFailure(error.message)
      },
      newPasswordRequired: () => {
        if (!onNewPasswordRequested || !(typeof onNewPasswordRequested === 'function')) {
          console.error('onNewPasswordRequested callback is not implemented')
          if (onFailure && typeof onFailure === 'function') {
            onFailure('Internal error. Please contact your admin.')
          }
          return
        }

        onNewPasswordRequested((newPassword, callbacks) => {
          setNewPassword(dispatch, cognitoUser, newPassword, callbacks)
        })
      }
    })
  }
}

export const setNewPassword = (dispatch, cognitoUser, newPassword, callbacks = {}) => {
  const {onLoad, onSuccess, onFailure} = callbacks
  if (onLoad && typeof onLoad === 'function') onLoad()

  cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
    onSuccess: (result) => {
      if (onSuccess && typeof onSuccess === 'function') onSuccess()
      dispatch(getUser({username: cognitoUser.username}))
      dispatch(push('/'))
    },
    onFailure: (error) => {
      if (error instanceof Error) {
        console.error(error.message)
        console.error(error.stack)
        if (onFailure && typeof onFailure === 'function') onFailure(error.message)
      } else {
        console.error(error)
        if (onFailure && typeof onFailure === 'function') onFailure(error)
      }
    }
  })
}

export const fetchUser = () => {
  return dispatch => {
    const poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId
    }
    const userPool = new CognitoUserPool(poolData)
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser !== null) {
      dispatch(getUser({username: cognitoUser.username}))
    }
  }
}

export const checkCode = (callbacks) => {
  const {onSuccess, onFailure} = callbacks

  const poolData = poolDataLoader()
  const auth = new CognitoAuth(poolData);
  auth.userhandler = {
    onSuccess: function (session) {
      console.log("Sign in success");
      onSuccess()
    },
    onFailure: function (err) {
      onFailure()
    }
  };
  auth.useCodeGrantFlow();
  auth.parseCognitoWebResponse(window.location.href);
}

export const signinOKTA = (callbacks) => {
  const {onSuccess, onFailure} = callbacks
  const poolData = poolDataLoader()
  const auth = new CognitoAuth(poolData);
  auth.userhandler = {
    onSuccess: function (session) {
      console.log("Sign in progress");
      onSuccess()
    },
    onFailure: function (err) {
      onFailure()
    }
  };
  auth.useCodeGrantFlow();
  auth.getSession();
}

export const isAuthorized = (callback) => {
  const poolData = poolDataLoader()

  const userPool = new CognitoUserPool(poolData)
  const cognitoUser = userPool.getCurrentUser()
  if (cognitoUser === null) {
    const auth = new CognitoAuth(poolData);
    auth.useCodeGrantFlow();
    callback(auth.isUserSignedIn())
  } else {
    cognitoUser.getSession(function (err, session) {
      if (err) {
        console.warn(err.message)
        callback(false)
        return
      }
      callback(true)
    })
  }
}

export const signout = () => {
  return dispatch => {
    const poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId
    }
    const userPool = new CognitoUserPool(poolData)
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser !== null) {
      cognitoUser.signOut()
      dispatch(getUser({username: ''}))
      dispatch(push('/signin'))
    }
  }
}

export const forgotPassword = (username, callbacks = {}) => {
  const {onLoad, onSuccess, onFailure} = callbacks
  return dispatch => {
    if (onLoad && typeof onLoad === 'function') onLoad()
    const poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId
    }
    const userPool = new CognitoUserPool(poolData)
    const userData = {
      Username: username,
      Pool: userPool
    }
    const cognitoUser = new CognitoUser(userData)
    cognitoUser.forgotPassword({
      onSuccess: (result) => {
        if (onSuccess && typeof onSuccess === 'function') onSuccess()
      },
      onFailure: (error) => {
        console.error(error.message)
        console.error(error.stack)
        if (onFailure && typeof onFailure === 'function') onFailure(error.message)
      }
    })
  }
}

export const setCodeAndPassword = (verificationCode, username, password, callbacks = {}) => {
  const {onLoad, onSuccess, onFailure} = callbacks
  return dispatch => {
    if (onLoad && typeof onLoad === 'function') onLoad()
    const poolData = {
      UserPoolId: userPoolId,
      ClientId: clientId
    }
    const userPool = new CognitoUserPool(poolData)
    const userData = {
      Username: username,
      Pool: userPool
    }
    const cognitoUser = new CognitoUser(userData)
    cognitoUser.confirmPassword(verificationCode, password, {
      onSuccess: (result) => {
        if (onSuccess && typeof onSuccess === 'function') onSuccess()
      },
      onFailure: (error) => {
        console.error(error.message)
        console.error(error.stack)
        if (onFailure && typeof onFailure === 'function') onFailure(error.message)
      }
    })
  }
}
