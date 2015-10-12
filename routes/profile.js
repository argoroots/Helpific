var router = require('express').Router()
var path   = require('path')
var debug  = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu   = require('../helpers/entu')



// Show user own profile
router.get('/', function(req, res, next) {
    if(!res.authenticate()) return

    entu.get_entity({
        id: res.locals.user.id,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, profile) {
        if(error) return next(error)

        res.render('profile', {
            profile: profile
        })
    })
})



// Edit user profile
router.post('/', function(req, res, next) {
    if(!res.authenticate()) return

    entu.set_user({
        data: req.body,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, response) {
        if(error) return next(error)

        res.send(response)
    })
})



// Add user profile picture
router.post('/photo', function(req, res, next) {
    if(!res.authenticate()) return

    entu.file({
        entity: res.locals.user.id,
        property: 'person-photo',
        filename: req.body.filename,
        filesize: req.body.filesize,
        filetype: req.body.filetype,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, response) {
        if(error) return next(error)

        res.send(response)
    })
})



module.exports = router
