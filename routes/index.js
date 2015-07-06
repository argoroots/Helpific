var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var entu    = require('./entu')



// GET home page
router.get('/', function(req, res, next) {
    entu.get_page(641, function(error, page) {
        if(error) return next(error)
        res.render('index', page)
    })
})



module.exports = router
