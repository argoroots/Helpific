var router = require('express').Router()
var async  = require('async')
var moment = require('moment-timezone')

var entu   = require('../helpers/entu')



// Get requests/offers statuses JSON
router.get('/json/statuses', function(req, res) {
    res.send([
        {status: 'active', label: res.locals.t('pages.help.status-active'), plural: res.locals.t('pages.help.status-active-plural')},
        {status: 'accepted', label: res.locals.t('pages.help.status-accepted'), plural: res.locals.t('pages.help.status-accepted-plural')},
        {status: 'done', label: res.locals.t('pages.help.status-done'), plural: res.locals.t('pages.help.status-done-plural')},
        {status: 'canceled', label: res.locals.t('pages.help.status-canceled'), plural: res.locals.t('pages.help.status-canceled-plural')}
    ])
})



// Get requests/offers JSON
router.get('/json/:type*?', function(req, res, next) {
    moment.locale(res.locals.lang)

    entu.get_entities({
        definition: 'request',
        query: req.params.type ? req.params.type : '',
        full_object: true
    }, function(err, results) {
        if(err) return next(err)

        var requests = []
        for(var i in results) {
            var r = results[i]
            if(req.query.id && parseInt(req.query.id, 10) !== r.get('person.reference')) continue
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



// Show requests/offers list
router.get('/:type', function(req, res) {
    if(req.params.type === 'requests') {
        var help_type = 'request'
    } else if(req.params.type === 'offers') {
        var help_type = 'offer'
    } else {
        res.redirect('/' + res.locals.lang + '/help/requests')
        return
    }

    res.render('helps', {
        user_id: res.locals.user ? res.locals.user.id : null,
        help_type: help_type
    })
})



// Show request/offer
router.get('/:type/:id', function(req, res, next) {
    if(req.params.type !== 'request' && req.params.type !== 'offer') {
        res.redirect('/' + res.locals.lang + '/help/requests')
        return
    }

    async.waterfall([
        function(callback) {
            entu.get_entity({
                id: req.params.id
            }, callback)
        },
        function(help, callback) {
            entu.get_entity({
                id: help.get('person.reference')
            }, function(error, profile) {
                if(error) callback(error)

                callback(null, {
                    profile: profile,
                    help: help
                })
            })
        },
    ],
    function(err, results) {
        if(err) return next(err)

        res.render('help', results)
    })
})



// Add request/offer
router.post('/', function(req, res, next) {
    if(!res.locals.user) {
        res.status(403).send()
        return
    }

    var properties = req.body
    properties.person = res.locals.user.id

    if(properties.time) {
        if(properties.time.lenght === 10) properties.time = properties.time + ' 00:00'
        properties.time = moment(properties.time, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm')
    }

    var new_id = null
    async.series([
        function(callback) {
            entu.add({
                parent_entity_id: APP_ENTU_USER,
                definition: 'request',
                properties: properties
            }, function(error, id) {
                if(error) callback(error)
                new_id = id
                callback(null)
            })
        },
        function(callback) {
            if(!res.locals.user) callback(null)
            entu.rights({
                id: new_id,
                person_id: res.locals.user.id,
                right: 'owner'
            }, callback)
        },
        function(callback) {
            entu.rights({
                id: new_id,
                person_id: APP_ENTU_USER,
                right: 'viewer'
            }, callback)
        },
        function(callback) {
            if(!APP_ADMIN_EMAILS) callback(null)
            entu.message({
                    to: APP_ADMIN_EMAILS,
                    subject: res.locals.t('help.admin-email-subject'),
                    message: res.locals.t('help.admin-email-message', properties.type + '/' + new_id),
                    tag: 'help'
                },
                callback
            )
        },
    ],
    function(err) {
        if(err) return next(err)

        res.send({
            id: new_id
        })
    })
})



// Edit request/offer
router.put('/:id', function(req, res, next) {
    if(!res.authenticate()) return

    if(req.body.property === 'time' && req.body.value) {
        if(req.body.value.lenght === 10) req.body.value = req.body.value + ' 00:00'
        req.body.value = moment(req.body.value, 'DD.MM.YYYY HH:mm').format('YYYY-MM-DD HH:mm')
    }

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



module.exports = router
