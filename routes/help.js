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
    if(req.params.type === 'request' && req.params.type) {
        var help_type = 'request'
    } else if(req.params.type === 'offer' && req.params.type) {
        var help_type = 'offer'
    } else {
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



// Create request/offer
router.post('/:type', function(req, res, next) {
    if(!res.locals.user) {
        res.status(403).send()
        return
    }

    if(req.params.type === 'requests') {
        var help_group = 650
        var help_type = 'request'
    } else if(req.params.type === 'offers') {
        var help_group = 651
        var help_type = 'offer'
    } else {
        res.status(403).send()
        return
    }

    var properties = req.body
    properties.person = res.locals.user.id

    if(properties.time) {
        var time_date = properties.time.split(' ')[0].split('.')
        var time_time = properties.time.split(' ')[1]
        properties.time = time_date[2] + '-' + time_date[1] + '-' + time_date[0]
        if(time_time) properties.time = properties.time + ' ' + time_time
    }

    entu.add({
        parent_entity_id: help_group,
        definition: 'request',
        properties: properties
    }, function(error, new_id) {
        if(error) return next(error)

        entu.rights({
            id: new_id,
            person_id: res.locals.user.id,
            right: 'owner'
        }, function(error, response) {
            if(error) return next(error)

            entu.rights({
                id: new_id,
                person_id: APP_ENTU_USER,
                right: 'viewer'
            }, function(error, response) {
                if(error) return next(error)

                res.setHeader('Content-Type', 'application/json')
                res.status(200)
                res.send(response)
            })
        })

    })
})



module.exports = router
