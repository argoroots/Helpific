var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var md      = require('marked')

var entu    = require('./entu')



// GET profiles listing
router.get('/signin', function(req, res, next) {
    entu.get_page(646, function(error, page) {
        if(error) return next(error)

        res.render('signin', page)
    })
})



module.exports = router
