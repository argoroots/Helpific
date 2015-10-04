var router  = require('express').Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu    = require('../helpers/entu')



// GET messages page
router.get('/', function(req, res, next) {
    if(!res.authenticate()) return

    res.render('messages')
})



// GET messages page
router.get('/:id', function(req, res, next) {
    if(!res.authenticate()) return

    res.render('messages')
})



module.exports = router
