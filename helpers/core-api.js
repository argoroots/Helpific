var async    = require('async')
var crypto   = require('crypto')
var md       = require('marked')
var op       = require('object-path')
var random   = require('randomstring')
var request  = require('request')
var sanitize = require('sanitize-html')

var moment = require('moment-timezone')

var defaultTimeout = 120000

exports.active = true


function extracted(entities, params, callback) {
    var result = []
    async.each(entities, function (e, callback) {
        if (params.fullObject === true) {
            getEntity({
                definition: params.definition,
                id: e.genId,
                auth_id: params.auth_id,
                auth_token: params.auth_token
            }, function (error, entity) {
                if (error) return callback(error)

                result.push(entity)
                callback()
            })
        } else {
            result.push(op(e))
            callback()
        }
    }, function (error) {
        if (error) return callback(error)

        callback(null, result)
    })
}

getRequestOwnerReference = function(params, callback){
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'requests/' + params.id + '/person'
    var preparedUrl = APP_CORE_URL + '/api/' + url

    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        if (error) return callback(error)
        if (response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))

        log.debug(body)
        return callback(null, op(body))
    })
}

getPartner = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'partners/' + params.id

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        if(error) return callback(error)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))

        if(params.migra){
            var entities = []
            body._embedded['partners'].forEach(function(entry) {
                entities.push(entry)
            });

            extracted(entities, params, callback);
        } else {
            var result = {}
            for (var key in body) {
                if (body.hasOwnProperty(key)) {
                    result[key] = {
                        id: 0,
                        value: body[key]
                    }

                    if(key == 'nimi') {
                        result['name'] = {
                            id: 0,
                            value: body[key]
                        }
                    }

                    if(key == 'link') {
                        result['url'] = {
                            id: 0,
                            value: body[key]
                        }
                    }

                    if(key == 'tekst') {
                        result['note'] = {
                            id: 0,
                            value: body[key]
                        }
                    }

                    if(key == 'logoPath') {
                        result['photo'] = {
                            id: 0,
                            file: APP_AUTH_CORE_URL + body[key]
                        }
                    }
                }
            }

            log.debug(JSON.stringify(result))

            callback(null, op(result))

        }
    })


}


getRequest = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'requests/' + params.id
    if(params.migra) {
        url = 'requests/search/findByEntuId?entuId=' + params.id
    }

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        if(error) return callback(error)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))

        if(params.migra){
            var entities = []
            body._embedded['requests'].forEach(function(entry) {
                entities.push(entry)
            });

            extracted(entities, params, callback);
        } else {
            var result = {}
            for (var key in body) {
                if (body.hasOwnProperty(key)) {
                    result[key] = {
                        id: 0,
                        value: body[key]
                    }

                    if(key == 'time') {
                        result['time'] = {
                            id: 0,
                            value: moment(body[key]).format('YYYY-MM-DD HH:mm:ss')
                        }
                    }
                }
            }

            if(body.hasOwnProperty('genId')){
                getRequestOwnerReference({
                        id: body['genId']
                    }, function(error, data){
                        if(error) return callback(error)
                        result['person'] = {
                            id: 0,
                            reference: data.get('genId'),
                            value: data.get('forename')
                        }
                        result['_id'] = body['genId']

                        callback(null, op(result))

                    })

            } else {
                callback(null, op(result))
            }

        }
    })
}

getMessage = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
    if(params.toPersonId) qs.toPersonId = params.toPersonId

    var url = 'messages/' + params.id
    if(params.migra) {
        url = 'messages/search/findByEntuId?entuId=' + params.id
    }

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getMessage Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        if(error) return callback(error)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))

        if(params.migra) {
            var entities = []
            if(body._embedded['messages']){
                body._embedded['messages'].forEach(function (entry) {
                    entities.push(entry)
                });
            }
            callback(null, entities)
        } else {

            var result = {}
            for (var key in body) {
                if (body.hasOwnProperty(key)) {
                    result[key] = {
                        id: 0,
                        value: body[key]
                    }

                    if(key == 'genId') {
                        result._id = body[key]
                    }

                    if(key == 'created') {
                        result._changed = body[key]
                    }

                    if(key == 'fromPersonId') {
                        result['from-person'] = {
                            reference: body[key]
                        }
                    }

                    if(key == 'toPersonId') {
                        result['to-person'] = {
                            reference: body[key]
                        }
                    }

                    if(key == 'synum') {
                        result['message'] = {
                            id: 0,
                            value: body[key]
                        }
                    }
                }
            }

            if(body.hasOwnProperty('fromPersonId') && body.hasOwnProperty('toPersonId')){

                async.parallel({
                        fromPerson: function(callback) {
                            getEntity({
                                definition: 'person',
                                id: body['fromPersonId']
                            }, callback)
                        },
                        toPerson: function(callback) {
                            getEntity({
                                definition: 'person',
                                id: body['toPersonId']
                            }, callback)
                        }
                    },
                    function(err, data) {
                        if(err) return next(err)

                        result['from-person'] = {
                            reference: data.fromPerson.get('_id'),
                            value: data.fromPerson.get('forename.value')
                        }

                        result['to-person'] = {
                            reference: data.toPerson.get('_id'),
                            value: data.toPerson.get('forename.value')
                        }

                        log.debug(JSON.stringify(result))

                        callback(null, op(result))
                    })



            } else {
                callback(null, op(result))
            }
        }

    })
}

getUser = function(params, callback) {
    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query


    var url = 'persons/' + params.id
    if(params.migra) {
        url = 'persons/search/findByEntuId?entuId=' + params.id
    }

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getUser Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))

        if(params.migra){
            var entities = []
            body._embedded['persons'].forEach(function(entry) {
                entities.push(entry)
            });

            log.debug(JSON.stringify(entities))
            extracted(entities, params, callback);
        } else {
            var result = {}
            for (var key in body) {
                if (body.hasOwnProperty(key)) {
                    result[key] = {
                        id: 0,
                        value: body[key]
                    }

                    if(key == 'aboutMeText') {
                        result['about-me-text'] = {
                            id: 0,
                            value: sanitize(body[key]),
                            md: md(sanitize(body[key]))
                        }
                    }


                    if(key == 'aboutMeVideo') {
                        result['about-me-video'] = {
                            id: 0,
                            value: body[key]
                        }
                    }

                    if(key == 'genId') {
                        result._id = body[key]
                        result._picture = getPictureUrl(body[key])
                    }
                }
            }

            result['photo'] = {
                id: 0,
                value: result._picture,
                file: result._picture
            }

            log.debug('getUser result = ' + JSON.stringify(result))
            callback(null, op(result))
        }
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
    if(params.teamMember){
        url = 'persons/search/findByTeamMember?teamMember=1'
    }

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getUsers Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        log.debug('------------- getUsers Error ' + error)
        if(error) return callback(error)
        log.debug('------------- getUsers Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- getUsers Body ' + body._embedded)
        var entities = []
        if(body._embedded['persons']){
            body._embedded['persons'].forEach(function(entry) {
                entities.push(entry)
            });
        }

        extracted(entities, params, callback);
    })
}


getCountries = function(repository, params, callback) {

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'countries'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getCountries Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        log.debug('------------- getCountries Error ' + error)
        if(error) return callback(error)
        log.debug('------------- getCountries Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        log.debug('------------- getCountries Body ' + body._embedded)
        var entities = []
        body._embedded[repository].forEach(function(entry) {
            entities.push(entry)
        });

        extracted(entities, params, callback);
    })
}


getMessages = function(params, callback) {

    var headers = {}
    var qs = {}
    var url = ''


    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query
    if(params.userId) {
        qs.userId = params.userId
        url = 'messages/search/getAllConversations'
    } else {
        if(params.fromPersonId) qs.fromPersonId = params.fromPersonId
        if(params.toPersonId) qs.toPersonId = params.toPersonId
        var url = 'messages/search/getConversationWith'
    }

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getMessages Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(params))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        if(error) return callback(error)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))

        var entities = []
        body._embedded['messages'].forEach(function(entry) {
            entities.push(entry)
        });

        extracted(entities, params, callback);
    })
}

//Get entity
exports.getEntity = getEntity = function(params, callback) {
    if(params.definition == 'request') {
        getRequest(params, callback)
    } else if(params.definition == 'person') {
        getUser(params, callback)
    } else if(params.definition == 'message') {
        getMessage(params, callback)
    } else if (params.definition == 'partner') {
        getPartner(params, callback)
    }
}

exports.getRequests = getRequests = function(params, callback) {
    log.debug('Request list asked')

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'requests'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getRequests Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        log.debug('------------- getRequests Error ' + error)
        if(error) return callback(error)
        log.debug('------------- getRequests Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))


        var entities = []
        body._embedded['requests'].forEach(function(entry) {
            entities.push(entry)
        });

        extracted(entities, params, callback);
    })
}


exports.getPartners = getPartners = function(params, callback) {

    log.debug('Partners list asked')

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'partners'

    var preparedUrl = APP_CORE_URL + '/api/' + url
    log.debug('------------- getPartners Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        log.debug('------------- getPartners Error ' + error)
        if(error) return callback(error)
        log.debug('------------- getPartners Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body._embedded) return callback(new Error(op.get(body, 'error', body)))


        var entities = []
        body._embedded['partners'].forEach(function(entry) {

            var partner = {
                genId: op.get(entry, 'genId', ''),
                url: {value: op.get(entry, 'link', '')},
                name: {value: op.get(entry, 'nimi', '')},
                note: {value: op.get(entry, 'tekst', '')},
                photo: {file: APP_AUTH_CORE_URL + op.get(entry, 'logoPath', '')}
            }

            entities.push(partner)
        });

        extracted(entities, params, callback);
    })

}


exports.getRequestsCounts = getRequestsCounts = function(params, callback) {
    log.debug('Request count asked')

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var preparedUrl = APP_AUTH_CORE_URL + '/requestsCount'
    log.debug('------------- getRequestsCounts Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        log.debug('------------- getRequestsCounts Error ' + error)
        if(error) return callback(error)
        log.debug('------------- getRequestsCounts Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))


        log.debug(JSON.stringify(op.get(body, 'result', null)))
        callback(null, op.get(body, 'result', null))
    })
}

exports.getPersonsCounts = getPersonsCounts = function(params, callback) {
    log.debug('Request count asked')

    var headers = {}
    var qs = {}
    if(params.definition) qs.definition = params.definition
    if(params.query) qs.query = params.query

    var url = 'requests'

    var preparedUrl = APP_AUTH_CORE_URL + '/personsCount'
    log.debug('------------- getPersonsCounts Try to execute URL ' + preparedUrl + ' qs ' + JSON.stringify(qs))
    request.get({url: preparedUrl, headers: headers, qs: qs, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {

        log.debug('------------- getPersonsCounts Error ' + error)
        if(error) return callback(error)
        log.debug('------------- getPersonsCounts Status code ' + response.statusCode)
        if(response.statusCode !== 200 || !body) return callback(new Error(op.get(body, 'error', body)))


        log.debug(JSON.stringify(op.get(body, 'result', null)))
        callback(null, op.get(body, 'result', null))
    })
}

//Get entity
exports.getEntities = getEntities = function(params, qs, callback) {
    if(qs.definition == 'request') {
        getRequests(params, callback)
    } else if(qs.definition == 'person') {
        getUsers(params, callback)
    } else if(qs.definition == 'message') {
        getMessages(params, callback)
    } else if (qs.definition == 'partner') {
        getPartners(params, callback)
    }
}

//Add entity
exports.add = function(params, callback) {
    var preparedData = {
        definition: params.definition
    }
    for(p in params.properties) {
        preparedData[params.definition + '-' + p] = params.properties[p]
    }

    var repository = ''
    var data = {}
    if (params.definition == 'message') {
        repository = '/api/messages'

        data.fromPersonId = preparedData['message-from-person']
        data.toPersonId = preparedData['message-to-person']
        data.synum = preparedData['message-message']
        data.entuId = preparedData['message-entuId']
        data.created = preparedData['message-created']


    } else if (params.definition == 'request') {
        repository = '/requests/add'
        data.type = preparedData['request-type']
        data.time = preparedData['request-time']
        data.location = preparedData['request-location']
        data.price = preparedData['request-price']
        data.request = preparedData['request-request']
        data.country = ''
        data.category = ''
        data.status = preparedData['request-status']
        data.entuId = preparedData['request-entuId']
        data.person = {id: preparedData['request-person']}
    } else if (params.definition == 'feedback') {
        repository = '/api/feedbacks'

        data.saatjaPersonId = preparedData['feedback-from-person']
        data.saatjaEmail = preparedData['feedback-from-email']
        data.message = preparedData['feedback-message']
        data.created = preparedData['feedback-created']


    } else if (params.definition == 'person') {
        repository = '/api/persons'

        data.forename = preparedData['person-forename']
        data.surname = preparedData['person-surname']
        data.county = preparedData['person-county']
        data.email = preparedData['person-email']
        data.town = preparedData['person-town']
        data.slogan = preparedData['person-slogan']
        data.language = preparedData['person-language']
        data.country = preparedData['person-country']
        data.address = preparedData['person-address']
        data.newsletter = preparedData['person-newsletter']
        data.aboutMeText = preparedData['person-aboutMeText']
        data.aboutMeVideo = preparedData['person-aboutMeVideo']
        data.entuId = preparedData['person-entuId']
        data.phone = preparedData['person-phone']
    }

    var headers = {}

    var preparedUrl = APP_AUTH_CORE_URL + repository

    log.debug('add Try to execute URL ' + preparedUrl + ' params ' + JSON.stringify(data))

    request.post({url: preparedUrl, headers: headers, body: data, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 201 || !body) return callback(new Error(op.get(body, 'error', body)))

        callback(null, op.get(body, 'genId', null))
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
        if(body['about-me-text']){
            body['aboutMeText'] = body['about-me-text']
            property = 'aboutMeText'
        }
        if(body['about-me-video']){
            body['aboutMeVideo'] = body['about-me-video']
            property = 'aboutMeVideo'
        }
        if(body['newsletter'] && body['newsletter'] != 'true') {
            body['newsletter'] = 'false';
        }


    } else if (params.definition == 'message') {
        repository = 'messages'
    } else if (params.definition == 'request') {
        repository = 'requests'
    }
    var headers = {}

    log.debug('params ' + JSON.stringify(params))
    var preparedUrl = APP_CORE_URL + '/api/' + repository + '/' + params.id
    log.debug('edit Try to execute URL ' + preparedUrl + ' body ' + JSON.stringify(body) + ' property = ' + property)
    request.patch({url: preparedUrl, headers: headers, body: body, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
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
    var preparedUrl = APP_AUTH_CORE_URL + '/user/auth'
    log.debug('Try to execute URL ' + preparedUrl + ' qb ' + JSON.stringify(qb))
    request.post({url: preparedUrl, body: qb, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
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

    request.post({url: preparedUrl, body: qb, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
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

    var preparedUrl = APP_AUTH_CORE_URL + '/user'
    log.debug('Try to execute URL ' + preparedUrl)
    request.get({url: preparedUrl, headers: headers, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        log.debug(JSON.stringify(body))

        var user = {
            person: {
                language: {
                    values: [{value: op.get(body, 'result.language', '')}]
                } ,
                properties: {
                    forename: {
                        values: [{value: op.get(body, 'result.forename', '')}]
                    } ,
                    email: {
                        values: [{value: op.get(body, 'result.email', '')}]
                    },
                    town: {
                        values: [{value: op.get(body, 'result.town', '')}]
                    },
                    country: {
                        values: [{value: op.get(body, 'result.country', '')}]
                    }
                }
            }
        }

        callback(null, user)
    })
}

// compore picture URL
exports.getPictureUrl = getPictureUrl = function(reference) {
    return APP_AUTH_CORE_URL + '/user/' + reference + '/picture'
}

exports.file = function(params, callback){
    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
    } else {
        var headers = {}
    }

    var preparedUrl = APP_AUTH_CORE_URL + '/file'
    log.debug('file Try to execute URL ' + preparedUrl + ' params = ' + JSON.stringify(params))
    request.post({url: preparedUrl, headers: headers, body: params, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))


        log.debug(JSON.stringify(body))
        callback(null, op.get(body, 'result', null))
    })

}

exports.migratePicture = function (params, callback){
    var body = {
        entuID: params.entuID,
        pictureUrl: params.pictureUrl,
    }

    if(params.auth_id && params.auth_token) {
        var headers = {'X-Auth-UserId': params.auth_id, 'X-Auth-Token': params.auth_token}
    } else {
        var headers = {}
    }

    var preparedUrl = APP_AUTH_CORE_URL + '/migratePicture'

    log.debug('preparedUrl = ' + preparedUrl + ' with boyd' + JSON.stringify(body))

    request.post({url: preparedUrl, headers: headers, body: body, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        log.debug('error = ' + JSON.stringify(error))
        log.debug('body = ' + JSON.stringify(body))
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

        callback(null, body)
    })
}


exports.message = function(params, callback) {

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
    } else {
        var headers = {}
    }

    var preparedUrl = APP_AUTH_CORE_URL + '/email'

    log.debug('preparedUrl = ' + preparedUrl + ' with boyd' + JSON.stringify(body))

    request.post({url: preparedUrl, headers: headers, body: body, strictSSL: true, json: true, timeout: defaultTimeout}, function(error, response, body) {
        log.debug('error = ' + JSON.stringify(error))
        log.debug('body = ' + JSON.stringify(body))
        if(error) return callback(error)
        if(response.statusCode !== 200) return callback(new Error(op.get(body, 'error', body)))

        callback(null, body)
    })

}