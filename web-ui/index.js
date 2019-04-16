var express = require('express')
let okd = require('okd-runner')
let qs  = require('querystring')

var app = express()
const PORT = 8080

function buildURL() {

    const realm = 'demo-1'

    let params = qs.stringify({
        response_type: 'code',
        client_id: 'my-client',
        scope: 'my-scope',
        state: 'state123',
        redirect_uri: `${process.env['ROUTE'] || 'URL_NOT_FOUND'}login` 
    })

    return `https://${process.env['RH_SSO']}/auth/realms/${realm}/protocol/openid-connect/auth?${params}`
}

function buildLoginPage({URL}) {
    return `<!DOCTYPE HTML>
            <html>
              <head>
                <title>Hello OAuth2</title>
              </head>
              <body>
                <h1> Register </h1>
                <a href="${URL}">Login</a>
              </body>
            </html>`
}

app.get('/', (req, res) => {
  let page = buildLoginPage({ URL: buildURL() })
  res.send(page)
})

app.get('/login', (req, res) => {
    if(req.query.code)
        //if we got the code we can allow the user to use the service. 
        res.send(`<h2> Access token is ${req.query.code} </h2>`)
    else
        res.send(`<h2> User not found </h2>`)
})

// convention over configuration -> 8080
var server = app.listen(PORT)

console.log(`listening for request in ${PORT}`)
