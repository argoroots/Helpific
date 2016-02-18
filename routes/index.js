var router = require('express').Router()
var async  = require('async')
var fs     = require('fs')
var path   = require('path')

var entu   = require('../helpers/entu')


function isTemplateExists(template) {
    try{
        var filePath = path.join(__dirname, '..', 'views', template)
        log.trace('Prepared path = ' + filePath)
        var lstats = fs.lstatSync(filePath)
        return lstats.isFile()
    } catch (e) {
        log.warn('Template ' + template + ' does not exist')
        return false
    }
}


// Show homepage
router.get('/', function(req, res) {
    res.render('index')
})



// Get help and users count JSON
router.get('/json', function(req, res, next) {
    async.parallel({
        help: function(callback) {
            entu.getEntities({
                definition: 'request',
                fullObject: false
            }, callback)
        },
        users: function(callback) {
            entu.getEntities({
                definition: 'person',
                fullObject: false
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
    entu.getEntities({
        definition: 'partner',
        fullObject: true
    }, function(error, partners) {
        if(error) return next(error)

        res.render('partners', {
            partners: partners
        })
    })
})



// Show team page
router.get('/team', function(req, res, next) {
    entu.getEntities({
        parentEntityId: 612,
        definition: 'person',
        fullObject: true
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
router.get('/terms', function(req, res) {
    var template = 'terms.' + res.locals.lang + '.jade'
    if(isTemplateExists(template)){
        res.render(template)
    } else {
        res.render('terms.en.jade')
    }
})



// Show bb page
router.get('/bb', function(req, res) {
    var template = 'bb.' + res.locals.lang + '.jade'
    if(isTemplateExists(template)){
        res.render(template)
    } else {
        res.render('bb.en.jade')
    }

})


router.get('/pad', function(req, res) {
    var template = 'pad.' + res.locals.lang + '.jade'
    if(isTemplateExists(template)){
        res.render(template)
    } else {
        res.render('pad.et.jade')
    }

})


// Show ngo-info page
router.get('/mittetulundusuhing-info', function(req, res) {
    var template = 'ngo-info.' + res.locals.lang + '.jade'
    if(isTemplateExists(template)){
        res.render(template)
    } else {
        res.render('ngo-info.et.jade')
    }

})


// Show about page
router.get('/about', function(req, res) {
    var template = 'about.' + res.locals.lang + '.jade'


    async.parallel({
            partners: function(callback) {
                entu.getEntities({
                    definition: 'partner',
                    fullObject: true
                }, callback)
            },
            team: function(callback) {
                entu.getEntities({
                    parentEntityId: 612,
                    definition: 'person',
                    fullObject: true
                }, callback)
            }
        },
        function(err, results) {
            if(err) return next(err)

            log.debug(results)
            if(isTemplateExists(template)){
                res.render(template, results)
            } else {
                res.render('about.et.jade', results)
            }
        })

})


// Send feedback
router.post('/feedback', function(req, res, next) {
    var properties = req.body

    if(res.locals.user) properties['from-person'] = res.locals.user.id

    var new_id = null
    async.series([
        function(callback) {
            entu.add({
                parentEntityId: APP_ENTU_USER,
                definition: 'feedback',
                properties: properties
            }, function(error, id) {
                if(error) callback(error)
                new_id = id
                callback(null)
            })
        },
        function(callback) {
            if(res.locals.user) {
                entu.rights({
                    id: new_id,
                    personId: res.locals.user.id,
                    right: 'owner'
                }, callback)
            } else {
                callback(null)
            }
        },
        function(callback) {
            entu.rights({
                id: new_id,
                personId: APP_ENTU_USER,
                right: ''
            }, callback)
        },
        function(callback) {
            if(APP_FEEDBACK_EMAILS) {
                entu.message({
                        to: APP_FEEDBACK_EMAILS,
                        subject: res.locals.t('feedback.admin-email-subject'),
                        message: res.locals.t('feedback.admin-email-message',  new_id),
                        tag: 'feedback'
                    },
                    callback
                )
            } else {
                callback(null)
            }
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
