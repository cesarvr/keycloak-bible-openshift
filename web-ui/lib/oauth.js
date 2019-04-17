const qs  = require('querystring')
const request = require('request')

function exchangeToken(token) { 
    console.log(`exchange this token: ${token}`)

    let params = {
        grant_type: 'authorization_code',
        code: token,
        redirect_uri:'http://web-auth-testing-1.apps.tmagic-5e4a.openshiftworkshop.com/login',
        client_id: 'my-client',
        client_secret: 'ef078f1f-f76a-4fee-9cf7-703221f4960e' 
    }

    let URL = 'https://sso-testing-1.apps.tmagic-5e4a.openshiftworkshop.com/auth/realms/demo-1/protocol/openid-connect/token' 

    let options = {
        method: 'POST', 
        rejectUnauthorized: false, 
        headers: {  
            "content-type": "application/json",
        },
        url: URL,
        form: params,
    }

    console.log('options: ', options)

    // Assuming your Keycloak server is using HTTPS
    return new Promise( (resolve, reject) => {
        request(options, 
            function(error, resp, body) {
                if(error)
                    console.log(`error->${error}`)

                if(error) { 
                    console.log(`Error validating token: ${error}`)
                    reject(`Error validating token: ${error}`)
                }else {
                    console.log('response: ok')
                    console.log('body: ', body)
                    console.log('headers: ', resp.headers)
                    resolve(body)
                }
            })
    })


}


module.exports = { exchangeToken }
