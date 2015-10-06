var path     = require('path')
var debug    = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request  = require('request')
var async    = require('async')
var op       = require('object-path')
var md       = require('marked')
var random   = require('randomstring')
var crypto   = require('crypto')
var sanitize = require('sanitize-html')



function sign_data(data) {
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
exports.get_entity = get_entity = function(params, callback) {
    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
        var qs = {}
    } else {
        var headers = {}
        var qs = sign_data()
    }

    request.get({url: APP_ENTU_URL + '/entity-' + params.id, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
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
        // debug(JSON.stringify(entity, null, '  '))

        callback(null, op(entity))
    })
}



//Get entities by parent entity id and/or by definition
exports.get_entities = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
    } else {
        var qs = sign_data(qs)
    }

    var url = params.parent_entity_id ? '/entity-' + params.parent_entity_id + '/childs' : '/entity'
    var loop = params.parent_entity_id ? ['result', params.definition, 'entities'] : 'result'

    request.get({url: APP_ENTU_URL + url, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        var entities = []
        async.each(op.get(body, loop, []), function(e, callback) {
            if(params.full_object === true) {
                get_entity({
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
        }, function(error){
            if(error) return callback(error)

            callback(null, entities)
        })
    })
}



//Add entity
exports.add = function(params, callback) {
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
        var qb =sign_data(data)
    }

    request.post({url: APP_ENTU_URL + '/entity-' + params.parent_entity_id, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'result.id', null))
    })
}



//Share entity
exports.rights = function(params, callback) {
    var body = {
        entity: params.person_id,
        right: params.right
    }
    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
        var qb = body
    } else {
        var headers = {}
        var qb = sign_data(body)
    }

    request.post({url: APP_ENTU_URL + '/entity-' + params.id + '/rights', headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

        callback(null, params.id)
    })
}



//Send message
exports.message = function(params, callback) {
    var body = {
        to: params.to,
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
        var qb = sign_data(body)
    }

    request.post({url: APP_ENTU_URL + '/email', headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

        callback(null, body)
    })
}



//Get signin url
exports.get_signin_url = function(params, callback) {
    var qb = {
        state: random.generate(16),
        redirect_url: params.redirect_url,
        provider: params.provider
    }
    request.post({url: APP_ENTU_URL + '/user/auth', body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

        var data = {}
        data.state = op.get(body, 'result.state', null)
        data.auth_url = op.get(body, 'result.auth_url', null)

        callback(null, data)
    })
}



//Get user session
exports.get_user_session = function(params, callback) {
    var qb = {
        'state': params.state
    }
    request.post({url: params.auth_url, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        var user = {}
        user.id = op.get(body, 'result.user.id', null)
        user.token = op.get(body, 'result.user.session_key', null)

        callback(null, user)
    })
}



//Set user
exports.set_user = function(params, callback) {
    property = 'person-' + op.get(params.data, 'property')
    var body = {}
    body[op.get(params.data, 'id') ? property + '.' + op.get(params.data, 'id') : property] = op.get(params.data, 'value', '')

    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
        var qb = body
    } else {
        var headers = {}
        var qb = sign_data(body)
    }

    request.put({url: APP_ENTU_URL + '/entity-' + params.auth_id, headers: headers, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        var new_property = op.get(body, 'result.properties.' + property + '.0', null)

        callback(null, new_property)
    })
}
