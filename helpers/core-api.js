var async    = require('async')
var crypto   = require('crypto')
var md       = require('marked')
var op       = require('object-path')
var random   = require('randomstring')
var request  = require('request')
var sanitize = require('sanitize-html')


getRequests = function(params, callback) {
    log.debug('Request list asked')

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = '/requests'

    var preparedUrl = APP_CORE_URL + url
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

    var url = '/request/' + params.id

    var preparedUrl = APP_CORE_URL + url
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

    var url = '/persons'

    var preparedUrl = APP_CORE_URL + url
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

    var url = '/persons/' + params.id

    var preparedUrl = APP_CORE_URL + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
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


getCountries = function(repository, params, callback) {

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = '/countries'

    var preparedUrl = APP_CORE_URL + url
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

    var url = '/messages/search/findByFromPersonIdOrToPersonId'

    var preparedUrl = APP_CORE_URL + url
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

    var url = '/message/' + params.id

    var preparedUrl = APP_CORE_URL + url
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
        getUser(params, function(errors, entities) {
            log.debug('------------- Errors ' + errors)
            log.debug('------------- Data ' + JSON.stringify(entities))
        })
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

    var preparedUrl = APP_CORE_URL + '/' + repository

    log.debug('Try to execute URL ' + preparedUrl)

    request.post({url: preparedUrl, headers: headers, body: data, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'result.id', null))
    })
}


//Edit entity
exports.edit = function(params, callback) {
    var property = params.definition + '-' + op.get(params.data, 'property')
    var body = {}
    body[op.get(params.data, 'id') ? property + '.' + op.get(params.data, 'id') : property] = op.get(params.data, 'value', '')


    var repository = ''
    if(params.definition == 'person'){
        repository = 'persons'
    }
    var headers = {}

    var preparedUrl = APP_CORE_URL + '/' + repository + '/' + params.id
    log.debug('Try to execute URL ' + preparedUrl)
    request.put({url: preparedUrl, headers: headers, body: body, strictSSL: true, json: true, timeout: 60000}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 201 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'result.properties.' + property + '.0', null))
    })
}