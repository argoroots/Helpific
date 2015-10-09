var router = require('express').Router()
var async  = require('async')
var path   = require('path')
var debug  = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu   = require('../helpers/entu')



// Show requests/offers list
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



module.exports = router
