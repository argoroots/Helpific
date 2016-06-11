var async  = require('async')
var router = require('express').Router()

var entu   = require('../helpers/entu')
var core_api = require('../helpers/core-api')

var commonCountries = ['Estonia', 'United Kingdom', 'United States']


exports.notCommonCountries = notCommonCountries = function(arrayOfAllCountries, commonCountries) {
    commonCountries.forEach(function(entity){
        var index = arrayOfAllCountries.indexOf(entity)
        if (index > -1) {
            arrayOfAllCountries.splice(index, 1)
        }
    })
    return arrayOfAllCountries
}

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
    }, function(error, profile){
        core_api.getCountries('countries', {}, function(error, countries){
            if(countries){
                res.render('contact', {
                    profile: profile,
                    commonCountries: commonCountries,
                    nonCommonCountries: notCommonCountries(countries, commonCountries)
                })
            } else {
                res.render('contact', {
                    profile: profile
                })
            }
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