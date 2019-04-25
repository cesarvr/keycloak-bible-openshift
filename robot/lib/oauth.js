const qs  = require('querystring')
const request = require('request')

let store = function() {
  let data = undefined
  return {
    set: (e) => {
      data = e
    },
    get: () => {
      if(data === undefined)
        throw 'Service not available...'
      return JSON.parse(data)
    }
  }
}()


const discovery = function({sso_url}) {
  console.log('discovering...')

  let REALM = process.env['REALM']
  let __URL = `https://${sso_url}/auth/realms/${REALM}/.well-known/openid-configuration`

  console.log('discovery: ', __URL)

  let params = {
    method: 'GET',
    rejectUnauthorized: true,
    headers: {
      "content-type": "application/json",
    },
    url: __URL
  }

  request(params,
    (error, resp, body) => {

      if(error) {
        console.log('error', error)
        console.log('trying again...')

        // Try every 3 seconds, in case of failiure...
        setTimeout( () => discovery({sso_url: process.env['SSO']}), 3000)
      }else{
        console.log('correct')
        store.set(body)
      }
    })
}
discovery({sso_url: process.env['SSO']})


/*
 * This function here is the one validating the token each time a user with a token makes a request, we get the token and we send it to
 * the Identity Server (Keycloak).
 *
 * More details about this step:
 * https://tools.ietf.org/html/rfc7662#section-2.1
 *
 */

function token_introspection (token) {
  let endpoint = store.get().token_introspection_endpoint
  console.log(`\x1b[37mchecking token: ${endpoint}`)

  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        name:  'content-type',
        value: 'application/x-www-form-urlencoded'
      },
      url: endpoint,
      form: {
        client_id: 'my-client',
        client_secret: process.env['CLIENT_SECRET'],
        token
      }
    },
      function(error, resp, body) {
        if(error){
          reject(error)
        }
        if(resp.statusCode === 200) {
          body = JSON.parse(body)
          resolve({body, status: resp.statusCode})
        }else{
          reject({status: resp.statusCode})
        }
      })
  })
}

function exchangeToken(token) {
  console.log(`exchange this token: ${token}`)

  let params = {
    grant_type: 'authorization_code',
    code: token,
    redirect_uri: `http://${process.env['ROUTE']  || 'URL_NOT_FOUND'}/login`,
    client_id: 'my-client',
    client_secret: process.env['CLIENT_SECRET'],
  }

  let URL = store.get().token_endpoint

  let options = {
    method: 'POST',
    rejectUnauthorized: false,
    headers: {
      "content-type": "application/json",
    },
    url: URL,
    form: params,
  }

  console.log('options: ', JSON.stringify(options,null, 4))
  // Assuming your Keycloak server is using HTTPS
  return new Promise( (resolve, reject) => {
    request(options,
      function(error, resp, body) {
        if(error) {
          console.log(`Error validating token: ${error}`)
          reject(`Error validating token: ${error}`)
        }else {
          try{
            let data = {}
            console.log('response: ok')
            console.log('headers: ', resp.headers)
            console.log('body:', body)
            data = JSON.parse(body)
            resolve(data)
          }catch(e) {
            reject(e)
            console.log('error parsing JSON: ', e)
          }

        }
      })
  })
}

module.exports = { exchangeToken, endpoints: store, inspect: token_introspection }
