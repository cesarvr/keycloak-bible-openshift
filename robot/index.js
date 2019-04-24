var express = require('express')
let okd = require('okd-runner')
let qs  = require('querystring')
let oauth = require('./lib/oauth')

var app = express()
const PORT = 8080

function buildURL() {
    let endpoint = oauth.endpoints.get().authorization_endpoint 

    if(endpoint === undefined)
        throw 'Error generating URL in buildURL()'

    let params = qs.stringify({
        response_type: 'code',
        client_id: 'my-client',
        scope: 'my-scope',
        state: 'state123',
        redirect_uri: `http://${process.env['ROUTE']  || 'URL_NOT_FOUND'}/login` 
    })

    console.log('auth_url: ', `${endpoint}?${params}`)
    return `${endpoint}?${params}`
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
    try{
    let page = buildLoginPage({ URL: buildURL() })
    res.send(page)
    }catch(e) {
        console.log('error: ', e)
        res.send('<p>Something went wrong!</p>')
    }
})

app.get('/discovery', (req, res) => {
    if(oauth.endpoints.get() === undefined) 
        res.send('empty')
    else
        res.send(oauth.endpoints.get())
})

let timerID = null 

app.get('/login', (req, res) => {
    if(timerID !== null) {
        clearInterval(timerID)
        console.log('cleaning interval')
    }


    if(req.query.code){
        //if we got the code we can allow the user to use the service. 
        oauth.exchangeToken(req.query.code)
             .then(resp => {
                 console.log('requesting token info...')
                 let access_token = resp.access_token
                 console.log('token->', resp.access_token)
                 res.send(`<h1>Willkommen!</h1>`)

                 timerID = setInterval(()=> {
                     oauth.inspect(access_token).then(({body , status}) => {
                         console.log('status: ',status)
                        if(status === 200){ 
                            console.log('token info:', body)
                        }else {
                            console.log('Not working...')
                        }
                     }).catch(err => {
                        console.log('fail!', err)
                     })
                 }, 2000)
             })
            .catch(err => { 
                console.log('Crash: ', err)
                res.send(`<p>Something went wrong!!</p>`) 
            
            })
    }else {
        console.log('Not token supplied...', Date.now())
        res.status(401).send(`<h2> Not Token </h2>`)
    }
})

// convention over configuration -> 8080
var server = app.listen(PORT)

console.log(`listening for request in ${PORT}`)
