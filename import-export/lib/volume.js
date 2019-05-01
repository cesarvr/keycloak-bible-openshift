
let operations = (action, {volumeIndex, volMountIndex, envVarIndex}, {volume, volumeMount, envVariable}) => {
    return [
        { 
            op: `${action}`, 
            path: `/spec/template/spec/volumes/${volumeIndex || 1}`,
            value: volume
        },
        { 
            op: `${action}`, 
            path: `/spec/template/spec/containers/0/volumeMounts/${volMountIndex || 1}`,
            value: volumeMount

        },
        { 
            op: `${action}`, 
            path: `/spec/template/spec/containers/0/env/${envVarIndex || 1}`,
            value: envVariable
        } 
    ]
}


const replicas = (replica_number) => {
    return {
        op: 'replace',
        path: `/spec/replicas`,
        value: replica_number || 1
    }
} 



const add_volumes = ({name, mountPath, dc, cm}) => {

    let config_map_name = cm.metadata.name 
    
    /* Definition of ConfigMap looks like this:
     *
     * metadata
     *      name: 'keycloak-data',
            namespace: 'keycloak',
            selfLink: '/api/v1/namespaces/keycloak/configmaps/keycloak-data',
            uid: 'a076db7c-6a73-11e9-91c0-0645a759894e',
            resourceVersion: '352844340',
            creationTimestamp: '2019-04-29T11:40:45Z' },
       data:
            [ 'kc-export.json', ... ]
     *
     */

    let filename   = Object.keys(cm.data).pop()

    if(filename === undefined) {
        console.log('Error: ', cm)
        throw 'We expect a file in this ConfigMap'
    }

    mountPath += filename +'/'+ filename


    /*
     * - env:
     *   name: SSO_IMPORT_FILE
     *   value ${mountPath} + filename
     *
     */

    let envVariable = {
        name: 'SSO_IMPORT_FILE',
        value: mountPath
    }

    /*
     *volumesMounts:
       - name: cfgm-volume
         mountPath: /var/tmp/cache
     *
     */


    let volumeMount = {
        mountPath,
        name
    }

    /*
     *volumes:
       - name: cfgm-volume
         configMap:
           name: config_map_name
     *
     */

    let volume = {
        name,
        configMap: { name: config_map_name }
    }

    let ops = operations('add', {}, {volume, volumeMount, envVariable}) 
    ops.push(replicas(1))
    return ops
} 

const remove_volumes = ({name, mountPath, dc, cm}) => {
    let volume        = dc.spec.template.spec.volumes
    let volumeMount   = dc.spec.template.spec.containers[0].volumeMounts
    let vars          = dc.spec.template.spec.containers[0].env

    let volumeIndex = volume.findIndex(v => v.name === name)
    let volMountIndex = volumeMount.findIndex(v => v.name === name)
    let envVarIndex = vars.findIndex(v => v.name === 'SSO_IMPORT_FILE')


    let ops = operations('remove', {volumeIndex, volMountIndex, envVarIndex}, {})
    console.log('restored dc: ', ops)

    return ops 
}

module.exports = {add_volumes, remove_volumes}
