var router  = require('express').Router()
var yaml    = require('js-yaml')
var fs      = require('fs')
var op      = require('object-path')

// Show user own profile
router.get('/', function(req, res, next) {
    if(!res.authenticate()) return
    if(res.locals.user.id !== 918) return

    var result = []

    function extracted(combinedKey, key, value) {
        if (typeof value === 'object' && typeof key === 'string') {
            for (var key in value) {
                var newValue = value[key]
                extracted(combinedKey + "." + key, key, newValue)
            }
        } else {
            result.push({key: combinedKey, value: value})
        }
    }


    try {
        var doc = yaml.safeLoad(fs.readFileSync('locales-copy.yaml', 'utf8'))

        for(var key in doc) {
            var value = doc[key]
            extracted(key, key, value)
        }
    } catch (e) {
        log.error(e)
    }

    res.render('tr', {
        result: result
    })

})


// Edit user profile
router.post('/', function(req, res, next) {
    if(!res.authenticate()) return
    if(res.locals.user.id !== 918) return

    var doc = yaml.safeLoad(fs.readFileSync('locales-copy.yaml', 'utf8'))
    var key = req.body.id;
    var oldValue = op.get(doc, key);
    var newValue = req.body.value;

    if(oldValue !== newValue) {
        op.set(doc, key, newValue)
        fs.writeFile('locales-copy.yaml', yaml.safeDump(doc, { sortKeys: true, indent: 4 }), function(err) {
            if(err) return console.log(err)
            log.debug('Locales file saved to locales-copy.yaml')
        })
    }
    log.debug('Old value was ' + oldValue + " , new value is " + newValue)
})



module.exports = router