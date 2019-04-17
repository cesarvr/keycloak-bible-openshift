let request = require('request')
let qs = require('querystring')

function auth(url) { 

    let params = {
        grant_type: 'authorization_code',
        code: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..Tshh5oFErF-Hn2uoLY6hiw.1G7fvo8_mLOTWpdr2TdI7dAnan9U-fvgAVeWIdD4bv7lhrSL1HPJBeAqBHphIounMq6oS8fS-CmWdNKCSM143fn8uCOPR4AAQNjBgXITy8zokPV3z-urzgFd2teswWpo3sUqFVeSEUgHvlu3i_8bnjQnY-UGoDjk9zRNHOk988ZFp-9IJljRKWxy8y_y-MhlQPtMuH1cEo9iTSBZ0ATw1lEJQFfp4tB102d9FAox1QdGpDy-TaPFV8zaf9nCXLSG.X89NJZd7LKct21kHuGg5xQ',
        response_type:'code',
        headers: {  
            "content-type": "application/json",
        },
        redirect_uri:'http://web-auth-testing-1.apps.tmagic-5e4a.openshiftworkshop.com/login',
        client_id: 'my-client',
        client_secret: 'ef078f1f-f76a-4fee-9cf7-703221f4960e' 
    }

    let URL = 'https://sso-testing-1.apps.tmagic-5e4a.openshiftworkshop.com/auth/realms/demo-1/protocol/openid-connect/token' + qs.stringify(params)

    console.log('calling: ', URL)
    // Assuming your Keycloak server is using HTTPS

    request(
        {
            method: 'POST', 
            rejectUnauthorized: false, 
            url:URL
        }, 
        function(error, resp, body) {
            if(error)
                console.log(`error->${error}`)
            console.log(`body-> ${body}`)
            console.log('headers->', resp.headers)
        }
    )


}

auth()




