var router = require('express').Router()
var _      = require('underscore')
var async  = require('async')
var moment = require('moment-timezone')

var entu   = require('../helpers/entu')



// Get conversations JSON
router.get('/json', function(req, res) {
    if(!res.authenticate()) return

    moment.locale(res.locals.lang)

    entu.getEntities({
        definition: 'message',
        query: '.' + res.locals.user.id + '.',
        fullObject: true,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token,
        userId: res.locals.user.id
    }, function(error, result) {
        var conversations = {}
        var newIdExists = false

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
                if(conversations[person.reference].messageId > m.get('_id')) continue
            }

            if(newIdExists === false) newIdExists = person.reference === parseInt(req.query.new_id, 10)

            conversations[person.reference] = {
                id: person.reference,
                name: person.value,
                picture: entu.getPictureUrl(person.reference),
                date: m.get('_changed'),
                relativeDate: moment.utc(m.get('_changed')).tz(APP_TIMEZONE).fromNow(),
                message: m.get('message.value'),
                messageId: m.get('_id'),
                ordinal: m.get('_id')
            }
        }

        if(req.query.new_id && !newIdExists) {
            entu.getEntity({
                definition: 'person',
                id: req.query.new_id
            }, function(error, person) {
                conversations[person.get('_id')] = {
                    id: person.get('_id'),
                    name: person.get('forename.value'),
                    picture: entu.getPictureUrl(person.get('_id')),
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
router.get('/json/:id', function(req, res) {
    if(!res.authenticate()) return

    moment.locale(res.locals.lang)

    entu.getEntities({
        definition: 'message',
        query: '.' + res.locals.user.id + '. .' + req.params.id + '.',
        fullObject: true,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token,
        fromPersonId: res.locals.user.id,
        toPersonId: req.params.id
    }, function(error, result) {
        var messages = []
        var days = {}

        for(var i in result) {
            var m = result[i]

            if(m.get('from-person.reference') === res.locals.user.id) {
                if(m.get('to-person.reference') !== parseInt(req.params.id, 10)) continue
            } else if(m.get('to-person.reference') === res.locals.user.id) {
                if(m.get('from-person.reference') !== parseInt(req.params.id, 10)) continue
            } else {
                continue
            }

            var date = moment.utc(m.get('_changed')).tz(APP_TIMEZONE).calendar()
            var relativeDate = moment.utc(m.get('_changed')).tz(APP_TIMEZONE).fromNow()
            days[relativeDate] = {
                date: m.get('_created'),
                relativeDate: relativeDate,
                ordinal: m.get('_id')
            }
            messages.push({
                id: m.get('_id'),
                person: m.get('from-person.reference'),
                date: date,
                relativeDate: relativeDate,
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
router.get('/:id*?', function(req, res) {
    if(!res.authenticate()) return

    res.locals.showFeedback = false
    res.render('messages')
})



// Add message
router.post('/:id', function(req, res, next) {
    if(!res.authenticate()) return

    var properties = req.body
    properties['from-person'] = res.locals.user.id
    properties['to-person'] = req.params.id
    properties['created'] = moment(Date.now()).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
    properties.participants = 'from.' + res.locals.user.id + '.to.' + req.params.id + '.'

    entu.add({
        parentEntityId: APP_ENTU_USER,
        definition: 'message',
        properties: properties
    }, function(error, new_id) {
        if(error) return next(error)

        async.waterfall([
            function(callback) {
                entu.rights({
                    id: new_id,
                    personId: res.locals.user.id,
                    right: 'owner'
                }, callback)
            },
            function(result, callback) {
                entu.rights({
                    id: new_id,
                    personId: req.params.id,
                    right: 'viewer'
                }, callback)
            },
            function(result, callback) {
                entu.rights({
                    id: new_id,
                    personId: APP_ENTU_USER,
                    right: ''
                }, callback)
            },
            function(result, callback) {
                entu.getEntity({
                    definition: 'person',
                    id: req.params.id
                }, callback)
            },
            function(profile, callback) {
                if(profile.has('email.value')) {
                    entu.message({
                            to: profile.get('email.value'),
                            from: APP_ADMIN_EMAILS,
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
        function(err) {
            if(err) return next(err)

            var date = moment.utc().tz(APP_TIMEZONE).calendar()
            var relativeDate = moment.utc().tz(APP_TIMEZONE).fromNow()
            res.send({
                day: {
                    date: date,
                    relativeDate: relativeDate,
                    ordinal: new_id
                },
                message: {
                    person: res.locals.user.id,
                    date: date,
                    relativeDate: relativeDate,
                    message: req.body.message,
                    messageId: new_id
                }
            })
        })
    })
})



module.exports = router
