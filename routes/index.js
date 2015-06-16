var express = require('express')
var router  = express.Router()
var debug   = require('debug')('app:index')



/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Helpific' })
})



module.exports = router
