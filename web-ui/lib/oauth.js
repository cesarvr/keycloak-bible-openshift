const qs  = require('querystring')
const request = require('request')

function exchangeToken(token) { 
    console.log(`exchange this token: ${token}`)

    let params = {
        grant_type: 'authorization_code',
        code: token,
        client_id: 'my-client',
        client_secret: 'a5e98989-afae-45f8-9818-8e6f02eaa2b0', 
        redirect_uri: `${process.env['ROUTE'] || 'URL_NOT_FOUND'}login` 
    }

    let URL = `https://${process.env['SSO']}/auth/realms/demo-1/protocol/openid-connect/token` 

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
