var router = require('express').Router()
var _      = require('underscore')
var async  = require('async')
var moment = require('moment-timezone')
var path   = require('path')
var debug  = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu   = require('../helpers/entu')



// Get conversations JSON
router.get('/json', function(req, res, next) {
    if(!res.authenticate()) return

    moment.locale(res.locals.lang)

    entu.get_entities({
        definition: 'message',
        query: '.' + res.locals.user.id + '.',
        full_object: true,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, result) {
        var conversations = {}
        var new_id_exists = false

        for(var i in result) {
            var m = result[i]

            if(m.get('from-person.reference') === res.locals.user.id) {
                if(!m.get('to-person')) continue
                var person = m.get('to-person')
            } else if(m.get('to-person.reference') === res.locals.user.id) {
                if(!m.get('from-person')) continue
                var person = m.get('from-person')
            } else {
                continue
            }

            if(conversations[person.reference]) {
                if(conversations[person.reference].message_id > m.get('_id')) continue
            }

            if(new_id_exists === false) new_id_exists = person.reference === parseInt(req.query.new_id)

            conversations[person.reference] = {
                id: person.reference,
                name: person.value,
                picture: APP_ENTU_URL + '/entity-' + person.reference + '/picture',
                date: m.get('_changed'),
                relative_date: moment.utc(m.get('_changed')).tz(APP_TIMEZONE).fromNow(),
                message: m.get('message.value'),
                message_id: m.get('_id'),
                ordinal: m.get('_id')
            }
        }

        if(req.query.new_id && !new_id_exists) {
            entu.get_entity({
                id: req.query.new_id
            }, function(error, person) {
                conversations[person.get('_id')] = {
                    id: person.get('_id'),
                    name: person.get('forename.value') + ' ' + person.get('surname.value'),
                    picture: APP_ENTU_URL + '/entity-' + person.get('_id') + '/picture',
                    date: null,
                    ordinal: 'ZZZ'
                }
                res.send(_.values(conversations))
            })
        } else {
            res.send(_.values(conversations))
        }
    })
})



// Get conversation messages JSON
router.get('/json/:id', function(req, res, next) {
    if(!res.authenticate()) return

    moment.locale(res.locals.lang)

    entu.get_entities({
        definition: 'message',
        query: '.' + res.locals.user.id + '. .' + req.params.id + '.',
        full_object: true,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, result) {
        messages = []
        days = {}

        for(var i in result) {
            var m = result[i]

            if(m.get('from-person.reference') === res.locals.user.id) {
                if(m.get('to-person.reference') !== parseInt(req.params.id)) continue
            } else if(m.get('to-person.reference') === res.locals.user.id) {
                if(m.get('from-person.reference') !== parseInt(req.params.id)) continue
            } else {
                continue
            }

            var date = moment.utc(m.get('_changed')).tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc(m.get('_changed')).tz(APP_TIMEZONE).fromNow()
            days[relative_date] = {
                date: m.get('_created'),
                relative_date: relative_date,
                ordinal: m.get('_id')
            }
            messages.push({
                id: m.get('_id'),
                person: m.get('from-person.reference'),
                date: date,
                relative_date: relative_date,
                message: m.get('message.value')
            })
        }

        res.send({
            messages: messages,
            days: _.values(days)
        })
    })
})



// Show messages page
router.get('/:id*?', function(req, res, next) {
    if(!res.authenticate()) return

    res.render('messages')
})



// Add message
router.post('/:id', function(req, res, next) {
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
                    person: res.locals.user.id,
                    date: date,
                    relative_date: relative_date,
                    message: req.body.message,
                    message_id: new_id
                }
            })
        })
    })
})



module.exports = router
