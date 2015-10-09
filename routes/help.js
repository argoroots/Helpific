var router = require('express').Router()
var path   = require('path')
var debug  = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu   = require('../helpers/entu')



// GET requests/offers listing
router.get('/:type', function(req, res, next) {
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



// GET request/offer
router.get('/:type/:id', function(req, res, next) {
    if(req.params.type !== 'request' || req.params.type !== 'offer') {
        res.redirect('/' + res.locals.lang + '/help/requests')
        return
    }

    entu.get_entity({
        id: req.params.id
    }, function(error, help) {
        if(error) return next(error)

        entu.get_entity({
            id: help.get('person.reference')
        }, function(error, profile) {
            if(error) return next(error)

            res.render('help', {
                profile: profile,
                help: help
            })
        })

    })
})



module.exports = router
