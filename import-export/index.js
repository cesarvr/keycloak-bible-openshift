const okd = require('../../okd-api')
const vol = require('./lib/volume')

const validate = (obj) => {
    if(obj.hasOwnProperty('status') && obj['status'] === 'Failure')
        throw 'Error: ' + JSON.stringify( obj, null, 4 ) 

    return obj
}

const get_resource = (api, res, name) => {
    return api[res].by_name(name)
        .then( cms => { 
            return validate(cms)
        })
}

const check_pods = (api, dc_name) => {
    return () => {
        console.log(`watching deployment ${dc_name} \n\n`)
        return api.dc.get_pods(dc_name).then(pods => {
            console.log(`---------->`, pods)

            /*pods.items.forEach(pod => {
                console.log('pods ->', pod)
                //api.pod.stream_logs(name, line => console.log(`name:${name} -> ${line}`))
            })*/
        })
    }
}

const pick = (name, ress) => ress.filter( r => r.kind === name ).pop()

okd({ 
    cluster:'console.pro-eu-west-1.openshift.com', 
    token:'NSvPJQk7sHhJCBMRmF7sCZuUcbIB5WBqeaLWzJcrFYU' 
})
    .then(api => {
        api = api.namespace('keycloak')

        const mountPath = '/var/tmp/kc-import/'  
        const name      = 'cfgm-volume'

        let res = Promise.all([ 
            get_resource(api, 'cm', 'keycloak-data'),
            get_resource(api, 'dc', 'sso-bak'),
        ])

        res.then( ok => { 
            let dc = pick('DeploymentConfig', ok)
            let cm = pick('ConfigMap', ok)
            //let dc_mod = vol.add_volumes({ name, mountPath, dc, cm })
            let dc_mod = vol.remove_volumes({name,mountPath,dc,cm})
            console.log('PATCH: ', JSON.stringify( dc_mod, null, 2 ) )
            
           check_pods(api, 'sso-bak')() 

            //return api.dc.patch('sso-bak', dc_mod ).then(o => console.log('???', o))
        })

    }).catch(error => console.log('error: ', error))

