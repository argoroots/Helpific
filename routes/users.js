var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')

var entu    = require('../helpers/entu')



// Convert media url to embeding url
function media_embed(url) {
    if(!url) return null

    if(url.indexOf('youtu.be/') > -1) {
        return 'https://www.youtube.com/embed/' + url.split('youtu.be/')[1].split('?')[0]
    } else if (url.indexOf('youtube.com/watch') > -1) {
        return 'https://www.youtube.com/embed/' + url.split('v=')[1].split('&')[0]
    }else if (url.indexOf('vimeo.com/') > -1) {
        return 'https://player.vimeo.com/video/' + url.split('vimeo.com/')[1].split('?')[0]
    }else if (url.indexOf('wistia.com/medias/') > -1) {
        return 'https://fast.wistia.net/embed/iframe/' + url.split('wistia.com/medias/')[1].split('?')[0]
    }else {
        return null
    }
}



// GET profiles page
router.get('/', function(req, res, next) {
    res.render('user_list')
})



// GET profiles listing in JSON
router.get('/json', function(req, res, next) {
    entu.get_entities(615, 'person', null, null, null, function(error, profiles) {
        if(error) return next(error)

        var users = []
        for(i in profiles) {
            var p = profiles[i]
            users.push({
                id: p.get('_id'),
                name: p.get('forename.value', '') + ' ' + p.get('surname.value', ''),
                picture: p.get('_picture'),
                slogan: p.get('slogan.value'),
                location: p.has('town.value') && p.has('county.value') ? p.get('town.value') + ', ' + p.get('county.value') : p.get('town.value') + p.get('county.value')
            })
        }

        res.send(users)
    })
})



// Show user own profile
router.get('/me', function(req, res, next) {
    if(!res.authenticate()) return

    entu.get_entity(res.locals.user.id, res.locals.user.id, res.locals.user.token, function(error, profile) {
        if(error) return next(error)

        res.render('my_profile_edit', {
            profile: profile
        })
    })
})



// Edit user profile
router.post('/me', function(req, res, next) {
    if(!res.locals.user) {
        res.status(403).send()
        return
    }

    entu.set_user(res.locals.user.id, res.locals.user.token, req.body, function(error, response) {
        if(error) return next(error)

        res.setHeader('Content-Type', 'application/json')
        res.status(200)
        res.send(response)
    })
})



// GET profile
router.get('/:id', function(req, res, next) {
    if(!req.params.id) res.redirect('/' + res.locals.lang + '/users')

        entu.get_entity(req.params.id, null, null, function(error, profile) {
            if(error) return next(error)

            res.render('user', {
                profile: profile,
                media_embed: media_embed
            })
        })
})



module.exports = router
