var router = require('express').Router()

var entu   = require('../helpers/entu')



// Show signin page
router.get('/', function(req, res) {
    res.render('signin')
})



// Get user session
router.get('/done', function(req, res, next) {
    if(!req.signedCookies.auth_url || !req.signedCookies.auth_state) {
        res.redirect('/' + res.locals.lang + '/signin')
        return
    }

    entu.getUserSession({
        auth_url: req.signedCookies.auth_url,
        state: req.signedCookies.auth_state
    }, function(error, user) {
        if(error) return next(error)

        log.debug('signup done ' + JSON.stringify(user))

        res.clearCookie('auth_url')
        res.clearCookie('auth_state')
        res.cookie('auth_id', user.id, {signed:true, maxAge:1000*60*60*24*14})
        res.cookie('auth_token', user.token, {signed:true, maxAge:1000*60*60*24*14})

        entu.getEntity({
            definition: 'person',
            id: user.id,
            auth_id: user.id,
            auth_token: user.token
        }, function(error, profile) {
            if(error) return next(error)

            var url = req.signedCookies.redirect_url || '/profile'

            res.clearCookie('redirect_url')
            res.redirect('/' + profile.get('language.value', APP_DEFAULT_LOCALE) + url)
        })
    })
})



// Sign out
router.get('/exit', function(req, res) {
    res.clearCookie('auth_url')
    res.clearCookie('auth_state')
    res.clearCookie('auth_id')
    res.clearCookie('auth_token')

    res.redirect('/')
})



// Sign in with given provider
router.get('/:provider', function(req, res, next) {
    if(!req.params.provider) res.redirect('/' + res.locals.lang + '/signin')

    res.clearCookie('auth_url')
    res.clearCookie('auth_state')
    res.clearCookie('auth_id')
    res.clearCookie('auth_token')

    var port = ':8088'

    entu.getSigninUrl({
        redirect_url: req.protocol + '://' + req.hostname + port + '/' + res.locals.lang + '/signin/done',
        provider: req.params.provider
    }, function(error, data) {
        if(error) return next(error)


        log.debug("YOHOHO ===== "  + JSON.stringify(data))


        res.cookie('auth_url', data.auth_url, {signed:true, maxAge:1000*60*10})
        res.cookie('auth_state', data.state, {signed:true, maxAge:1000*60*10})
        res.redirect(data.auth_url + '/' + req.params.provider)
    })
})



module.exports = router
