var router = require('express').Router()
var async  = require('async')
var fs     = require('fs')

var entu   = require('../helpers/entu')



// Show homepage
router.get('/', function(req, res, next) {
    res.render('index')
})



// Get help and users count JSON
router.get('/json', function(req, res, next) {
    async.parallel({
        help: function(callback) {
            entu.get_entities({
                definition: 'request',
                full_object: false
            }, callback)
        },
        users: function(callback) {
            entu.get_entities({
                definition: 'person',
                full_object: false
            }, callback)
        },
    },
    function(err, results) {
        if(err) return next(err)

        res.send({
            help: results.help.length,
            users: results.users.length
        })
    })
})



// Show partners page
router.get('/partners', function(req, res, next) {
    entu.get_entities({
        definition: 'partner',
        full_object: true
    }, function(error, partners) {
        if(error) return next(error)

        res.render('partners', {
            partners: partners
        })
    })
})



// Show team page
router.get('/team', function(req, res, next) {
    entu.get_entities({
        parent_entity_id: 612,
        definition: 'person',
        full_object: true
    }, function(error, team) {
        if(error) return next(error)

        team.sort(function(obj1, obj2) {
            var o1 = obj1.get('forename.value', '') + ' ' + obj1.get('surname.value', '')
            var o2 = obj2.get('forename.value', '') + ' ' + obj2.get('surname.value', '')
            return (o1 > o2) ? 1 : -1
            return 0
        })

        res.render('team', {
            team: team
        })
    })
})



// Show terms of service page
router.get('/terms', function(req, res, next) {
    var template = 'terms.' + res.locals.lang + '.jade'
    if(fs.existsSync(template)){
        res.render(template)
    } else {
        res.render('terms.en.jade')
    }
})



// Show bb page
router.get('/bb', function(req, res, next) {
    var template = 'bb.' + res.locals.lang + '.jade'
    if(fs.existsSync(template)){
        res.render(template)
    } else {
        res.render('bb.en.jade')
    }

})



// Send feedback
router.post('/feedback', function(req, res, next) {
    var properties = req.body

    if(res.locals.user) properties['from-person'] = res.locals.user.id

    var new_id = null
    async.series([
        function(callback) {
            entu.add({
                parent_entity_id: APP_ENTU_USER,
                definition: 'message',
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
                right: ''
            }, callback)
        },
    ],
    function(err) {
        if(err) return next(err)

        res.send({
            id: new_id
        })
    })
})



module.exports = router
