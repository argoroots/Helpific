var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')

var entu    = require('../helpers/entu')



// GET requests/offers listing
router.get('/:type', function(req, res, next) {
    if(req.params.type === 'requests') {
        var page_id = 654
        var help_group = 650
        var help_type = 'request'
    } else if(req.params.type === 'offers') {
        var page_id = 655
        var help_group = 651
        var help_type = 'offer'
    } else {
        res.redirect('/help/requests')
        return
    }

    entu.get_entities(help_group, 'request', null, null, function(error, requests) {
        if(error) return next(error)

        requests.sort(function(obj1, obj2) {
            return (obj1.get('time.value', '') > obj2.get('time.value', '')) ? 1 : -1
            return 0
        })

        res.render('help', {
            requests: requests,
            show_add: (req.signedCookies.auth_id && req.signedCookies.auth_token),
            help_type: help_type
        })
    })
})



// Create request/offer
router.post('/:type', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token) {
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
    properties.person = req.signedCookies.auth_id

    if(properties.time) {
        var time_date = properties.time.split(' ')[0].split('.')
        var time_time = properties.time.split(' ')[1]
        properties.time = time_date[2] + '-' + time_date[1] + '-' + time_date[0]
        if(time_time) properties.time = properties.time + ' ' + time_time
    }

    entu.add(help_group, 'request', properties, null, null, function(error, new_id) {
        if(error) return next(error)

        entu.rights(new_id, req.signedCookies.auth_id, 'owner', null, null, function(error, response) {
            if(error) return next(error)

            entu.rights(new_id, APP_ENTU_USER, 'viewer', null, null, function(error, response) {
                if(error) return next(error)

                res.setHeader('Content-Type', 'application/json')
                res.status(200)
                res.send(response)
            })
        })

    })
})



module.exports = router
