var async  = require('async')
var router = require('express').Router()

var entu   = require('../helpers/entu')



// Show user own profile
router.get('/', function(req, res, next) {
    if (!res.authenticate()) return

    log.debug('res.locals.user.id' + res.locals.user.id)
    log.debug('res.locals.user.token' + res.locals.user.token)

    entu.getEntity({
        definition: 'person',
        id: res.locals.user.id,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, result){
        res.render('contact', {
            profile: result
        })
    })

})


// Edit user profile
router.post('/', function(req, res, next) {
    if(!res.authenticate()) return

    entu.edit({
        id: res.locals.user.id,
        definition: 'person',
        data: req.body,
        auth_id: res.locals.user.id,
        auth_token: res.locals.user.token
    }, function(error, response) {
        if(error) return next(error)

        res.send(response)
    })
})


module.exports = router