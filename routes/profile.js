var async  = require('async')
var router = require('express').Router()

var entu   = require('../helpers/entu')
var core_api = require('../helpers/core-api')

// Show user own profile
router.get('/', function(req, res, next) {
    if(!res.authenticate()) return

    log.debug('after auth check')

    async.waterfall([
        function(callback) {
            entu.getEntity({
                definition: 'person',
                id: res.locals.user.id,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        },
        function(result, callback) {
            if(result.has('newsletter')) return callback(null, result)

            entu.edit({
                id: res.locals.user.id,
                definition: 'person',
                data: {
                    property: 'newsletter',
                    value: true
                },
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, function(error) {
                if(error) return callback(error)

                entu.getEntity({
                    definition: 'person',
                    id: res.locals.user.id,
                    auth_id: res.locals.user.id,
                    auth_token: res.locals.user.token
                }, callback)
            })
        },
        function(result, callback) {
            if(result.has('photo') || !res.locals.user.picture) return callback(null, result)

            entu.setFileFromUrl({
                id: res.locals.user.id,
                definition: 'person',
                property: 'photo',
                url: res.locals.user.picture,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, function(error) {
                if(error) return callback(error)

                entu.getEntity({
                    definition: 'person',
                    id: res.locals.user.id,
                    auth_id: res.locals.user.id,
                    auth_token: res.locals.user.token
                }, callback)
            })
        },
    ],
    function(err, profile) {
        if(err) return next(err)

        core_api.getCountries('countries', {}, function(error, countries){
            if(countries){
                res.render('profile', {
                    profile: profile,
                    commonCountries: core_api.commonCountries,
                    nonCommonCountries: core_api.notCommonCountries(countries, core_api.commonCountries)
                })
            } else {
                res.render('profile', {
                    profile: profile
                })
            }
        })
    })
})



// Edit user profile
router.post('/', function(req, res, next) {
    if(!res.authenticate()) return

    log.debug('edit body = ' + JSON.stringify(req.body))
    entu.edit({
        id: res.locals.user.id,
        definition: 'person',
        data: req.body,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, response) {
        if(error) return next(error)

        if(req.body.property === 'language') {
            res.cookie('lang', req.body.value, {signed:true, maxAge:1000*60*60*24*14})
        }
        res.send(response)
    })
})



// Add user profile picture
router.post('/photo', function(req, res, next) {
    if(!res.authenticate()) return

    async.waterfall([
        function(callback) {
            entu.getEntity({
                definition: 'person',
                id: res.locals.user.id,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        },
        function(user, callback) {
            if(!user.has('photo')) return callback(null, {})

            if(!core_api.active) {
                entu.edit({
                    id: res.locals.user.id,
                    definition: 'person',
                    data: {
                        property: 'photo',
                        id: user.get('photo.id')
                    },
                    auth_id: res.locals.user.id,
                    auth_token: res.locals.user.token
                }, callback)
            } else {
                callback(null, {})
            }
        },
        function(x, callback) {
            entu.file({
                entity: res.locals.user.id,
                property: 'person-photo',
                filename: req.body.filename,
                filesize: req.body.filesize,
                filetype: req.body.filetype,
                auth_id: res.locals.user.id,
                auth_token: res.locals.user.token
            }, callback)
        }
    ],
    function(err, response) {
        if(err) return next(err)

        res.send(response)
    })
})



module.exports = router
