var router = require('express').Router()
var path   = require('path')
var debug  = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var async  = require('async')
var moment = require('moment-timezone')
var _      = require('underscore')

var entu   = require('../helpers/entu')



// Get help and users count
router.get('/index', function(req, res, next) {
    async.parallel({
        help: function(callback) {
            entu.get_entities({
                definition: 'request',
                full_object: false
            }, callback)
        },
        users: function(callback) {
            entu.get_entities({
                definition: 'person',
                full_object: false
            }, callback)
        },
    },
    function(err, results) {
        if(err) return next(err)

        res.send({
            help: results.help.length,
            users: results.users.length
        })
    })
})



// Get requests/offers statuses
router.get('/help/statuses', function(req, res, next) {
    res.send([
        {status: 'active', label: res.locals.t('pages.help.status-active'), plural: res.locals.t('pages.help.status-active-plural')},
        {status: 'accepted', label: res.locals.t('pages.help.status-accepted'), plural: res.locals.t('pages.help.status-accepted-plural')},
        {status: 'done', label: res.locals.t('pages.help.status-done'), plural: res.locals.t('pages.help.status-done-plural')},
        {status: 'canceled', label: res.locals.t('pages.help.status-canceled'), plural: res.locals.t('pages.help.status-canceled-plural')}
    ])
})



// Get requests/offers
router.get('/help/:type*?', function(req, res, next) {
    moment.locale(res.locals.lang)

    entu.get_entities({
        definition: 'request',
        query: req.params.type ? req.params.type : '',
        full_object: true
    }, function(err, results) {
        if(err) return next(err)

        requests = []
        for(var i in results) {
            var r = results[i]
            if(req.query.id && parseInt(req.query.id) !== r.get('person.reference')) continue
            if(req.params.type && req.params.type !== r.get('type.value')) continue
            if(r.get('status.value') === 'canceled' && !res.locals.user) continue
            if(r.get('status.value') === 'canceled' && r.get('person.reference') !== res.locals.user.id) continue
            requests.push({
                id: r.get('_id'),
                type: r.get('type.value'),
                person: {
                    reference: r.get('person.reference'),
                    name: r.get('person.value'),
                    picture: APP_ENTU_URL + '/entity-' + r.get('person.reference') + '/picture',
                },
                time: {
                    id: r.get('time.id'),
                    sql: r.get('time.value', ''),
                    value: r.get('time.value', '') ? moment(r.get('time.value', '')).tz(APP_TIMEZONE).format('DD.MM.YYYY HH:mm').replace(' 00:00', '') : ''
                },
                location: {
                    id: r.get('location.id'),
                    value: r.get('location.value')
                },
                status: {
                    id: r.get('status.id'),
                    value: r.get('status.value')
                },
                request: {
                    id: r.get('request.id'),
                    value: r.get('request.value')
                },
                filter_status: r.get('status.value'),
                filter_my: res.locals.user ? (res.locals.user.id === r.get('person.reference')) : 'null',
            })
        }

        res.send(requests)
    })
})



// Set help property
router.post('/help/:id', function(req, res, next) {
    if(!res.authenticate()) return

    entu.edit({
        id: req.params.id,
        definition: 'request',
        data: req.body,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(err, result) {
        if(err) return next(err)

        res.send(result)
    })
})


// Get conversations
router.get('/messages', function(req, res, next) {
    if(!res.authenticate()) return

    var calls = {
        from: function(callback) {
            entu.get_entities({
                definition: 'message',
                query: 'from.' + res.locals.user.id + '.',
                full_object: true,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        },
        to: function(callback) {
            entu.get_entities({
                definition: 'message',
                query: 'to.' + res.locals.user.id + '.',
                full_object: true,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        },
    }

    if(req.query.new_id) calls.id = function(callback) {
        entu.get_entity({
            id: req.query.new_id
        }, callback)
    }

    moment.locale(res.locals.lang)

    async.parallel(
        calls,
    function(err, results) {
        if(err) return next(err)

        conversations = {}

        if(results.id) {
            conversations[results.id.get('_id')] = {
                id: results.id.get('_id'),
                name: results.id.get('forename.value') + ' ' + results.id.get('surname.value'),
                picture: APP_ENTU_URL + '/entity-' + results.id.get('_id') + '/picture',
                date: null,
                ordinal: 'ZZZ'
            }
        }

        for(var i in results.from) {
            if(conversations[results.from[i].get('to-person.reference')]) {
                if(conversations[results.from[i].get('to-person.reference')].message_id > results.from[i].get('_id')) continue
            }

            conversations[results.from[i].get('to-person.reference')] = {
                id: results.from[i].get('to-person.reference'),
                name: results.from[i].get('to-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.from[i].get('to-person.reference') + '/picture',
                date: results.from[i].get('_changed'),
                relative_date: moment.utc(results.from[i].get('_changed')).tz(APP_TIMEZONE).fromNow(),
                message: results.from[i].get('message.value'),
                message_id: results.from[i].get('_id'),
                ordinal: results.from[i].get('_id')
            }
        }

        for(var i in results.to) {
            if(conversations[results.to[i].get('from-person.reference')]) {
                if(conversations[results.to[i].get('from-person.reference')].message_id > results.to[i].get('_id')) continue
            }

            conversations[results.to[i].get('from-person.reference')] = {
                id: results.to[i].get('from-person.reference'),
                name: results.to[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.to[i].get('from-person.reference') + '/picture',
                date: results.to[i].get('_changed'),
                relative_date: moment.utc(results.to[i].get('_changed')).tz(APP_TIMEZONE).fromNow(),
                message: results.to[i].get('message.value'),
                message_id: results.to[i].get('_id'),
                ordinal: results.to[i].get('_id')
            }
        }

        res.send(_.values(conversations))
    })
})



// Get conversation messages
router.get('/messages/:id', function(req, res, next) {
    if(!res.authenticate()) return

    moment.locale(res.locals.lang)

    async.parallel({
        from: function(callback) {
            entu.get_entities({
                definition: 'message',
                query: 'from.' + req.params.id + '.to.' + res.locals.user.id + '.',
                full_object: true,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        },
        to: function(callback) {
            entu.get_entities({
                definition: 'message',
                query: 'from.' + res.locals.user.id + '.to.' + req.params.id + '.',
                full_object: true,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        },
    },
    function(err, results) {
        if(err) return next(err)

        messages = []
        days = {}

        for(var i in results.from) {
            var date = moment.utc(results.from[i].get('_changed')).tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc(results.from[i].get('_changed')).tz(APP_TIMEZONE).fromNow()
            days[relative_date] = {
                date: results.from[i].get('_created'),
                relative_date: relative_date,
                ordinal: results.from[i].get('_id')
            }
            messages.push({
                to: true,
                name: results.from[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.from[i].get('from-person.reference') + '/picture',
                date: date,
                relative_date: relative_date,
                message: results.from[i].get('message.value'),
                message_id: results.from[i].get('_id')
            })
        }

        for(var i in results.to) {
            var date = moment.utc(results.to[i].get('_changed')).tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc(results.to[i].get('_changed')).tz(APP_TIMEZONE).fromNow()
            days[relative_date] = {
                date: results.to[i].get('_changed'),
                relative_date: relative_date,
                ordinal: results.to[i].get('_id')
            }
            messages.push({
                from: true,
                name: results.to[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.to[i].get('from-person.reference') + '/picture',
                date: date,
                relative_date: relative_date,
                message: results.to[i].get('message.value'),
                message_id: results.to[i].get('_id')
            })
        }

        res.send({
            messages: messages,
            days: _.values(days)
        })
    })
})



// Create message
router.post('/messages/:id', function(req, res, next) {
    if(!res.authenticate()) return

    var properties = req.body
    properties['from-person'] = res.locals.user.id
    properties['to-person'] = req.params.id
    properties['participants'] = 'from.' + res.locals.user.id + '.to.' + req.params.id + '.'

    entu.add({
        parent_entity_id: APP_ENTU_USER,
        definition: 'message',
        properties: properties
    }, function(error, new_id) {
        if(error) return next(error)

        async.waterfall([
            function(callback) {
                entu.rights({
                    id: new_id,
                    person_id: res.locals.user.id,
                    right: 'owner'
                }, callback)
            },
            function(result, callback) {
                entu.rights({
                    id: new_id,
                    person_id: req.params.id,
                    right: 'viewer'
                }, callback)
            },
            function(result, callback) {
                entu.rights({
                    id: new_id,
                    person_id: APP_ENTU_USER,
                    right: ''
                }, callback)
            },
            function(result, callback) {
                entu.get_entity({
                    id: req.params.id
                }, callback)
            },
            function(profile, callback) {
                if(profile.has('email.value')) {
                    entu.message({
                            to: profile.get('email.value'),
                            subject: res.locals.t('message.email-subject'),
                            message: res.locals.t('message.email-message', res.locals.user.id),
                            tag: 'message',
                            auth_id: res.locals.user.id,
                            auth_token: res.locals.user.token
                        },
                        callback
                    )
                } else {
                    callback(null)
                }
            }
        ],
        function(err, results) {
            if(err) return next(err)

            var date = moment.utc().tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc().tz(APP_TIMEZONE).fromNow()
            res.send({
                day: {
                    date: date,
                    relative_date: relative_date,
                    ordinal: new_id
                },
                message: {
                    from: true,
                    date: date,
                    relative_date: relative_date,
                    message: req.body.message,
                    message_id: new_id
                }
            })
        })
    })
})



// Get users
router.get('/users', function(req, res, next) {
    entu.get_entities({
        parent_entity_id: 615,
        definition: 'person',
        full_object: true
    }, function(error, profiles) {
        if(error) return next(error)

        var users = []
        for(i in profiles) {
            var p = profiles[i]
            users.push({
                id: p.get('_id'),
                name: p.get('forename.value', '') + ' ' + p.get('surname.value', ''),
                picture: p.get('_picture'),
                slogan: p.get('slogan.value'),
                location: p.has('town.value') && p.has('county.value') ? p.get('town.value') + ', ' + p.get('county.value') : p.get('town.value') + p.get('county.value')
            })
        }

        res.send(users)
    })
})



// Edit user profile
router.post('/profile', function(req, res, next) {
    if(!res.authenticate()) return

    entu.set_user({
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token,
        data: req.body
    }, function(error, response) {
        if(error) return next(error)

        res.send(response)
    })
})



module.exports = router
