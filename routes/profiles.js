var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var md      = require('marked')

var entu    = require('./entu')



// GET profiles listing
router.get('/', function(req, res, next) {
    entu.get_page(630, function(error, page) {
        if(error) return next(error)

        entu.get_profiles(function(error, profiles) {
            if(error) return next(error)

            page.profiles = profiles
            res.render('profiles', page)
        })
    })
})



// GET profile
router.get('/:id', function(req, res, next) {
    if(!req.params.id) res.redirect('/profiles')

    entu.get_page(642, function(error, page) {
        if(error) return next(error)

        entu.get_profile(req.params.id, function(error, profile) {
            if(error) return next(error)

            page.title = profile.forename + ' ' + profile.surname
            page.profile = profile
            res.render('profile', page)
        })
    })

})



module.exports = router
