let request = require('request')
let qs = require('querystring')

function discovery({sso_url}) {
    console.log('discovering...')

    let url = `https://${sso_url}/auth/realms/demo-1/.well-known/openid-configuration`

    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            rejectUnauthorized: false,
            url
        },
            function(error, resp, body) {
                if(error){
                    console.log('Error while discovering: ', error)
                    console.log('is this a good URL?: ', url)
                    process.exit()
                }
                //console.log(body)
                resolve(body)
            })
    })
}

function token_introspect (token) {
    return function () {

        let endpoint = store.get().token_introspection_endpoint 
        console.log(`calling introspection endpoint: ${endpoint}`)

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
                    client_secret: 'a5e98989-afae-45f8-9818-8e6f02eaa2b0', 
                    token
                }
            },
                function(error, resp, body) {
                    if(error){
                        console.log('Error while discovering: ', error)
                        console.log('is this a good URL?: ', endpoint)
                        process.exit()
                    }
                    resolve(body)
                })
        })
    }
}

let sso_url = 'sso-testing.e4ff.pro-eu-west-1.openshiftapps.com'
const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJrYWxWaHlrV1NQTE44WUtROERVYjNBMTVFNU5mZlBvRlRsby1XOG1nTHIwIn0.eyJqdGkiOiI1YjRmMjY4NC00ZGRkLTQ2N2ItOTA1Yi02M2UzOTljZWQzYmMiLCJleHAiOjE1NTYwMjYxNTEsIm5iZiI6MCwiaWF0IjoxNTU2MDI1ODUxLCJpc3MiOiJodHRwczovL3Nzby10ZXN0aW5nLmU0ZmYucHJvLWV1LXdlc3QtMS5vcGVuc2hpZnRhcHBzLmNvbS9hdXRoL3JlYWxtcy9kZW1vLTEiLCJhdWQiOiJteS1jbGllbnQiLCJzdWIiOiI4NTMwOThkYS00YWQxLTRjM2UtYTkwMC01ODgzZWE4ZjJhOTMiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJteS1jbGllbnQiLCJhdXRoX3RpbWUiOjE1NTYwMjU4NTEsInNlc3Npb25fc3RhdGUiOiIyMGNmZGE0Yy02OGVmLTQzYTEtYTgxNC1kZDEzNzYxMTA1ZDEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sIm5hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImpvaG4iLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIn0.kC30_sxo2p2rYWvleDHQKeAxbpMXPl9Au_7O2I64PLJoMhoMNYS5owylKh5YwVvF4YVK_VF5m6uFc6bK66gmKQ_uFK22BvXXXkzgKAf1TtHFC3Ghhxm01FirmwG8yfu9Hy7H8bQcijqhaboI4Tn4Cwu35yvmo85MLURLdWzo9Y3DmpT992oQT-knlDBUXmhbTZKfuaNpoMZ1n_rk1N7ruBU3Qd9hhHO2eTPkdiqB7FZBFGU_FIJFoKt4vvrTEvnxwWyOjcKJSUopv8PJbn1Kh0ZouGA5PyLKONyz03OtXAGwFjPhlK5Zrs4Ot0ZIAwNa1EvWPgGCeUVZ_cNv-a6oiA'

discovery({ sso_url }).then(token_introspect(token)).then(token => console.log(`token introspected: ${token}`))
