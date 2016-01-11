var async    = require('async')
var crypto   = require('crypto')
var md       = require('marked')
var op       = require('object-path')
var random   = require('randomstring')
var request  = require('request')
var sanitize = require('sanitize-html')

exports.active = true

getRequests = function(params, callback) {
    log.debug('Request list asked')

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'requests'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getRequests Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + body._embedded)

        var entities = []
        body._embedded['requests'].forEach(function(entry) {
            entities.push(entry)
        });

        callback(null, entities)
    })
}


getRequest = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'request/' + params.id

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + body._embedded)
        var entities = []
        body._embedded['request'].forEach(function(entry) {
            entities.push(entry)
        });

        callback(null, entities)
    })
}


getUsers = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'persons'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getUsers Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + body._embedded)
        var entities = []
        body._embedded['persons'].forEach(function(entry) {
            entities.push(entry)
        });

        callback(null, entities)
    })
}


getUser = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'persons/' + params.id

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + JSON.stringify(body))

        var result = {}
        for (var key in body) {
            if (body.hasOwnProperty(key)) {
                result[key] = {
                        id: 0,
                        value: body[key]
                }
            }
        }

        log.debug('------------- Body ' + JSON.stringify(result))
        callback(null, op(result))
    })
}


getCountries = function(repository, params, callback) {

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'countries'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + body._embedded)
        var entities = []
        body._embedded[repository].forEach(function(entry) {
            entities.push(entry)
        });

        callback(null, entities)
    })
}


getMessages = function(params, callback) {

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'messages/search/findByFromPersonIdOrToPersonId'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getMessages Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + body._embedded)
        var entities = []
        body._embedded['messages'].forEach(function(entry) {
            entities.push(entry)
        });

        callback(null, entities)
    })
}

getMessage = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'message/' + params.id

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {

        log.debug('------------- Error ' + error)
        if(error) return callback(error)
        log.debug('------------- Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- Body ' + body._embedded)
        var entities = []
        body._embedded['message'].forEach(function(entry) {
            entities.push(entry)
        });

        callback(null, entities)
    })
}


//Get entity
exports.getEntities = getEntities = function(params, qs, callback) {
    log.debug('------------- getEntities Try to execute query ' + JSON.stringify(qs))

    if(qs.definition == 'request') {
        log.debug("------------- request")
        getRequests(params, function(errors, entities) {
            log.debug('------------- Errors ' + errors)
            log.debug('------------- Data ' + JSON.stringify(entities))
        })
    } else if(qs.definition == 'person') {
        log.debug("------------- person")
        getUsers(params, function(errors, entities) {
            log.debug('------------- Errors ' + errors)
            log.debug('------------- Data ' + JSON.stringify(entities))
        })
    } else if(qs.definition == 'message') {

        log.debug("------------- messages")
        getMessages(params, function(errors, entities) {
            log.debug('------------- Errors ' + errors)
            log.debug('------------- Data ' + JSON.stringify(entities))
        })
    }
}


//Get entity
exports.getEntity = getEntity = function(params, definition, callback) {
    log.debug('------------- getEntity Try to execute definition ' + definition)

    if(definition == 'request') {
        getRequest(params, function(errors, entities) {
            log.debug('------------- Errors ' + errors)
            log.debug('------------- Data ' + JSON.stringify(entities))
        })
    } else if(definition == 'person') {
        getUser(params, callback)
    } else if(definition == 'message') {
        getMessage(params, function(errors, entities) {
            log.debug('------------- Errors ' + errors)
            log.debug('------------- Data ' + JSON.stringify(entities))
        })
    }
}

//Add entity
exports.add = function(params, callback) {
    var data = {
        definition: params.definition
    }

    for(p in params.properties) {
        data[params.definition + '-' + p] = params.properties[p]
    }

    var repository = ''
    if(params.definition == 'person'){
        repository = 'persons'
    } else if (params.definition == 'message') {
        repository = 'messages'
    }
    var headers = {}

    var preparedUrl = APP_CORE_URL + '/api/' + repository

    log.debug('Try to execute URL ' + preparedUrl + ' params ' + JSON.stringify(params))

    request.post({url: preparedUrl, headers: headers, body: data, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'result.id', null))
    })
}


//Edit entity
exports.edit = function(params, callback) {
    var property = op.get(params.data, 'property')
    var body = {}
    body[property] = op.get(params.data, 'value', '')


    var repository = ''
    if(params.definition == 'person'){
        repository = 'persons'
    } else if (params.definition == 'message') {
        repository = 'messages'
    }
    var headers = {}

    log.debug('params ' + JSON.stringify(params))
    var preparedUrl = APP_CORE_URL + '/api/' + repository + '/' + params.id
    log.debug('edit Try to execute URL ' + preparedUrl + ' body ' + JSON.stringify(body) + ' property = ' + property)
    request.patch({url: preparedUrl, headers: headers, body: body, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        log.debug('response.statusCode  = ' + response.statusCode  + ' body = ' + JSON.stringify(body))
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))


        data = {
            value: op.get(body, property, null)

        }
        log.debug(data)
        callback(null, data)
    })
}


//Get signin url
exports.getSigninUrl = function(params, callback) {
    var qb = {
        state: random.generate(16),
        redirect_url: params.redirect_url,
        provider: params.provider
    }
    var preparedUrl = APP_CORE_URL + '/user/auth'
    log.debug('Try to execute URL ' + preparedUrl + ' qb ' + JSON.stringify(qb))
    request.post({url: preparedUrl, body: qb, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))


        log.debug(JSON.stringify(body))
        var data = {}
        data.state = op.get(body, 'result.state', null)
        data.auth_url = op.get(body, 'result.auth_url', null)

        log.debug(JSON.stringify(data))

        callback(null, data)
    })
}


//Get user session
exports.getUserSession = function(params, callback) {
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
        user.id = op.get(body, 'result.userObj.id', null)
        user.token = op.get(body, 'result.userObj.session_key', null)

        callback(null, user)
    })
}


//Get user
exports.getUser = function(params, callback) {
    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
    } else {
        var headers = {}
    }

    var preparedUrl = APP_CORE_URL + '/user'
    log.debug('Try to execute URL ' + preparedUrl)
    request.get({url: preparedUrl, headers: headers, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'result', null))
    })
}