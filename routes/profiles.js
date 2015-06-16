var express     = require('express')
var router      = express.Router()
var path        = require('path')
var debug       = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request     = require('request')



// GET profiles listing
router.get('/', function(req, res, next) {
    request.get({url: APP_ENTU_URL + '/entity', qs: {definition: 'person'}, strictSSL: true, json: true}, function(error, response, body) {
        if(error) throw error
        if(response.statusCode !== 200 || !body.result) throw new Error(body)
        res.render('profiles', {
            title: 'Profiles',
            profiles: body.result
        })
    })
})



module.exports = router
