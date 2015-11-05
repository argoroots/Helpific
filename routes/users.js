var router = require('express').Router()

var entu   = require('../helpers/entu')



// Convert media url to embeding url
function media_embed(url) {
    if(!url) return null

    if(url.indexOf('youtu.be/') > -1) {
        return 'https://www.youtube.com/embed/' + url.split('youtu.be/')[1].split('?')[0]
    } else if(url.indexOf('youtube.com/watch') > -1) {
        return 'https://www.youtube.com/embed/' + url.split('v=')[1].split('&')[0]
    } else if(url.indexOf('vimeo.com/') > -1) {
        return 'https://player.vimeo.com/video/' + url.split('vimeo.com/')[1].split('?')[0]
    } else if(url.indexOf('wistia.com/medias/') > -1) {
        return 'https://fast.wistia.net/embed/iframe/' + url.split('wistia.com/medias/')[1].split('?')[0]
    } else {
        return null
    }
}



// Get users JSON
router.get('/json', function(req, res, next) {
    entu.get_entities({
        parent_entity_id: 615,
        definition: 'person',
        full_object: true
    }, function(error, profiles) {
        if(error) return next(error)

        var users = []
        for(i in profiles) {
            var p = profiles[i]
            users.push({
                id: p.get('_id'),
                name: p.get('forename.value', '') + ' ' + p.get('surname.value', ''),
                picture: p.get('_picture'),
                slogan: p.get('slogan.value'),
                location: p.has('town.value') && p.has('county.value') ? p.get('town.value') + ', ' + p.get('county.value') : p.get('town.value', '') + p.get('county.value', '')
            })
        }

        res.send(users)
    })
})



// Show users list
router.get('/', function(req, res, next) {
    res.render('users')
})



// Show user profile
router.get('/:id', function(req, res, next) {
    if(!req.params.id) res.redirect('/' + res.locals.lang + '/users')

        entu.get_entity({
            id: req.params.id
        }, function(error, profile) {
            if(error) return next(error)

            res.render('user', {
                profile: profile,
                media_embed: media_embed
            })
        })
})



module.exports = router
