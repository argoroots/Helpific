var async    = require('async')
var crypto   = require('crypto')
var md       = require('marked')
var op       = require('object-path')
var random   = require('randomstring')
var request  = require('request')
var sanitize = require('sanitize-html')
var core_api = require('./core-api')


var signData = function(data) {
    data = data || {}

    if(!APP_ENTU_USER || !APP_ENTU_KEY) return data

    var conditions = []
    for(k in data) {
        conditions.push({k: data[k]})
    }

    var expiration = new Date()
    expiration.setMinutes(expiration.getMinutes() + 10)

    data.user = APP_ENTU_USER
    data.policy = new Buffer(JSON.stringify({expiration: expiration.toISOString(), conditions: conditions})).toString('base64')
    data.signature = crypto.createHmac('sha1', APP_ENTU_KEY).update(data.policy).digest('base64')

    return data
}



//Get entity from Entu
exports.getEntity = getEntity = function(params, callback) {

    if(core_api.active){
        core_api.getEntity(params, callback)
    } else {

        if(params.auth_id && params.auth_token) {
            var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
            var qs = {}
        } else {
            var headers = {}
            var qs = signData()
        }

        var preparedUrl = APP_ENTU_URL + '/entity-' + params.id
        log.debug('Try to execute URL ' + preparedUrl + ' query ' + JSON.stringify(qs))

        request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

            var properties = op.get(body, 'result.properties', {})
            var entity = {
                _id: op.get(body, 'result.id', null),
                _changed: op.get(body, 'result.changed', null) || op.get(body, 'result.created', null),
                _picture: APP_ENTU_URL + '/entity-' + op.get(body, 'result.id', null) + '/picture'
            }
            for(var p in properties) {
                if(op.has(properties, [p, 'values'])) {
                    for(var v in op.get(properties, [p, 'values'])) {
                        if(op.get(properties, [p, 'datatype']) === 'file') {
                            op.push(entity, p, {
                                id: op.get(properties, [p, 'values', v, 'id']),
                                value: sanitize(op.get(properties, [p, 'values', v, 'value'])),
                                file: APP_ENTU_URL + '/file-' + op.get(properties, [p, 'values', v, 'db_value'])
                            })
                        } else if(op.get(properties, [p, 'datatype']) === 'text') {
                            op.push(entity, p, {
                                id: op.get(properties, [p, 'values', v, 'id']),
                                value: sanitize(op.get(properties, [p, 'values', v, 'value'])),
                                md: md(sanitize(op.get(properties, [p, 'values', v, 'db_value'])))
                            })
                        } else if(op.get(properties, [p, 'datatype']) === 'reference') {
                            op.push(entity, p, {
                                id: op.get(properties, [p, 'values', v, 'id']),
                                value: sanitize(op.get(properties, [p, 'values', v, 'value'])),
                                reference: op.get(properties, [p, 'values', v, 'db_value'])
                            })
                        } else {
                            op.push(entity, p, {
                                id: op.get(properties, [p, 'values', v, 'id']),
                                value: sanitize(op.get(properties, [p, 'values', v, 'value'])),
                            })
                        }
                    }
                    if(op.get(properties, [p, 'multiplicity']) === 1) op.set(entity, p, op.get(entity, [p, 0]))
                }
            }
            log.debug('entity = ' + JSON.stringify(entity))
            callback(null, op(entity))
        })
    }



}



//Get entities by parent, definition or query
exports.getEntities = function(params, callback) {
    log.debug("getEntities before")

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.limit) qs.limit = params.limit
    if(params.page) qs.page = params.page

    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
    } else {
        var qs = signData(qs)
    }

    var url = params.parentEntityId ? '/entity-' + params.parentEntityId + '/childs' : '/entity'
    var loop = params.parentEntityId ? ['result', params.definition, 'entities'] : 'result'

    log.debug("url = " + url)
    log.debug("loop = " + loop)
    if(core_api.active){
        core_api.getEntities(params, qs, callback)
    } else {
        var preparedUrl = APP_ENTU_URL + url
        log.debug('getEntities Try to execute URL ' + preparedUrl + ' query ' + JSON.stringify(qs))

        request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

            var entities = []
            async.each(op.get(body, loop, []), function(e, callback) {
                if(params.fullObject === true) {
                    getEntity({
                        definition: params.definition,
                        id: e.id,
                        auth_id: params.auth_id,
                        auth_token: params.auth_token
                    }, function(error, entity) {
                        if(error) return callback(error)

                        entities.push(entity)
                        callback()
                    })
                } else {
                    entities.push(op(e))
                    callback()
                }
            }, function(error) {
                if(error) return callback(error)

                callback(null, entities)
            })
        })
    }

}

// compose picture URL
exports.getPictureUrl = function(reference) {
    if(core_api.active){
        return core_api.getPictureUrl(reference)
    } else {
        return APP_ENTU_URL + '/entity-' + reference + '/picture'
    }
}


//Add entity
exports.add = function(params, callback) {

    if(core_api.active){
        core_api.add(params, callback)
    } else {
        var data = {
            definition: params.definition
        }

        for(p in params.properties) {
            data[params.definition + '-' + p] = params.properties[p]
        }

        if(params.auth_id && params.auth_token) {
            var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
            var qb = data
        } else {
            var headers = {}
            var qb =signData(data)
        }

        var preparedUrl = APP_ENTU_URL + '/entity-' + params.parentEntityId
        log.debug('add Try to execute URL ' + preparedUrl)

        request.post({url: preparedUrl, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
         if(error) return callback(error)
         if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

         callback(null, op.get(body, 'result.id', null))
         })
    }
}



//Edit entity
exports.edit = function(params, callback) {

    if(core_api.active) {
        core_api.edit(params, callback)
    } else {
        var property = params.definition + '-' + op.get(params.data, 'property')
        var body = {}
        body[op.get(params.data, 'id') ? property + '.' + op.get(params.data, 'id') : property] = op.get(params.data, 'value', '')

        if(params.auth_id && params.auth_token) {
            var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
            var qb = body
        } else {
            var headers = {}
            var qb = signData(body)
        }

        var preparedUrl = APP_ENTU_URL + '/entity-' + params.id
        log.debug('edit Try to execute URL ' + preparedUrl)

        request.put({url: preparedUrl, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
         if(error) return callback(error)
         if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

         callback(null, op.get(body, 'result.properties.' + property + '.0', null))
         })
    }

}



//Set file from url
exports.setFileFromUrl = function(params, callback) {
    var property = params.definition + '-' + params.property
    var body = {
        entity: params.id,
        property: property,
        url: params.url,
        download: true
    }

    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
        var qb = body
    } else {
        var headers = {}
        var qb = signData(body)
    }

    var preparedUrl = APP_ENTU_URL + '/file/url'
    log.debug('setFileFromUrl Try to execute URL ' + preparedUrl)
    request.post({url: preparedUrl, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'result.properties.' + property + '.0', null))
    })
}



//Set entity rights
exports.rights = function(params, callback) {

    if(core_api.active) {
        callback(null, params.id)
    }

    var body = {
        entity: params.personId,
        right: params.right
    }
    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
        var qb = body
    } else {
        var headers = {}
        var qb = signData(body)
    }

    var preparedUrl = APP_ENTU_URL + '/entity-' + params.id + '/rights'
    log.debug('rights Try to execute URL ' + preparedUrl)
    request.post({url: preparedUrl, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

        callback(null, params.id)
    })
}



//Add file
exports.file = function(params, callback) {

    if(core_api.active){
        core_api.file(params, callback)
    } else {
        if(params.auth_id && params.auth_token) {
            var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
            var qb = params
        } else {
            var headers = {}
            var qb = signData(params)
        }

        var preparedUrl = APP_ENTU_URL + '/file/s3'
        log.debug('file Try to execute URL ' + preparedUrl)
        request.post({url: preparedUrl, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

            callback(null, op.get(body, 'result', null))
        })
    }

}



//Send message
exports.message = function(params, callback) {
    if(core_api.active){
        core_api.message(params, callback)
    } else {
        var body = {
            to: params.to,
            from: params.from,
            subject: params.subject,
            message: params.message,
            html: true,
            tag: params.tag
        }

        if(params.auth_id && params.auth_token) {
            var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
            var qb = body
        } else {
            var headers = {}
            var qb = signData(body)
        }

        var preparedUrl = APP_ENTU_URL + '/email'
        log.debug('message Try to execute URL ' + preparedUrl)
        request.post({url: preparedUrl, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

            callback(null, body)
        })
    }
}



//Get signin url
exports.getSigninUrl = function(params, callback) {

    if(core_api.active){
        core_api.getSigninUrl(params, callback)
    } else {
        var qb = {
            state: random.generate(16),
            redirect_url: params.redirect_url,
            provider: params.provider
        }

        var preparedUrl = APP_ENTU_URL + '/user/auth'
        log.debug('getSigninUrl Try to execute URL ' + preparedUrl + ' qb = ' + JSON.stringify(qb))

        request.post({url: preparedUrl, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

            log.debug(JSON.stringify(body))
            var data = {}
            data.state = op.get(body, 'result.state', null)
            data.auth_url = op.get(body, 'result.auth_url', null)

            callback(null, data)
        })
    }
}



//Get user session
exports.getUserSession = function(params, callback) {

    if(core_api.active){
        core_api.getUserSession(params, callback)
    } else {
        var qb = {
            'state': params.state
        }
        var preparedUrl = params.auth_url
        log.debug('getUserSession Try to execute URL ' + preparedUrl + ' qb ' + JSON.stringify(qb))

        request.post({url: preparedUrl, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))


            log.debug("user " + JSON.stringify(body))

            var user = {}
            user.id = op.get(body, 'result.user.id', null)
            user.token = op.get(body, 'result.user.session_key', null)

            callback(null, user)
        })
    }


}



//Get user
exports.getUser = function(params, callback) {

    if(core_api.active){
        core_api.getUser(params, callback)
    } else {
        if(params.auth_id && params.auth_token) {
            var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
        } else {
            var headers = {}
        }
        var preparedUrl = APP_ENTU_URL + '/user'
        log.debug('Try to execute URL ' + preparedUrl + " headers " + JSON.stringify(headers))

        request.get({url: preparedUrl, headers: headers, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
            if(error) return callback(error)
            if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

            log.debug(JSON.stringify(body))

            callback(null, op.get(body, 'result', null))
        })
    }
}
