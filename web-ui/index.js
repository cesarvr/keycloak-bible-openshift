var express = require('express')
let okd = require('okd-runner')
let qs  = require('querystring')
let oauth = require('./lib/oauth')

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

    return `https://${process.env['SSO']}/auth/realms/${realm}/protocol/openid-connect/auth?${params}`
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
    if(req.query.code){
        //if we got the code we can allow the user to use the service. 
        oauth.exchangeToken(req.query.code)
             .then(resp => res.send(`<h1>Willkommen!</h1>`))
             .catch(err => res.send(`<p>Something went wrong!!</p>`))
    }else {
        console.log('Not token supplied...', Date.now())
        res.status(401).send(`<h2> Not Token </h2>`)
    }
})

// convention over configuration -> 8080
var server = app.listen(PORT)

console.log(`listening for request in ${PORT}`)
