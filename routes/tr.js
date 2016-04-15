var router  = require('express').Router()
var yaml    = require('js-yaml')
var fs      = require('fs')
var op      = require('object-path')
var path    = require('path')



var newLanguage = ['en', 'et', 'ru', 'hu', 'de', 'ko', 'fi', 'nl', 'cs', 'bg', 'ja', 'zh', 'it', 'fr', 'id', 'el', 'lt', 'lv']

// Show user own profile
router.get('/', function(req, res, next) {
    if(!res.authenticate()) return
    //if(res.locals.user.id !== 918) return

    var result = []
    var newLanguageResult = []

    function extracted(combinedKey, key, value) {
        if (typeof value === 'object' && typeof key === 'string') {
            for (var key in value) {
                var newValue = value[key]
                extracted(combinedKey + "." + key, key, newValue)
            }
        } else {
            result.push({key: combinedKey, value: value})
            var lastIndex = combinedKey.lastIndexOf(".")
            var newKey = combinedKey.substring(0, lastIndex)
            newLanguageResult[newKey] = newKey
        }
    }


    try {
        var localeCopy = path.join(__dirname, '..', 'locales-copy.yaml');
        if(fs.existsSync(localeCopy)) {
            var doc = yaml.safeLoad(fs.readFileSync(localeCopy, 'utf8'))
            for(var key in doc) {
                var value = doc[key]
                extracted(key, key, value)
            }
        }
    } catch (e) {
        log.error(e)
    }

    for (var i in newLanguageResult){
        for ( var u in newLanguage){
            var found = false
            var nlk = newLanguageResult[i] + '.' + newLanguage[u];
            for( var e in result) {
                if(result[e].key === nlk){
                    found = true
                }
            }

            if(!found){
                result.push({key: nlk, value: ''})
            }
        }
    }


    function compare(a,b) {
        if (a.key < b.key)
            return -1;
        if (a.key > b.key)
            return 1;
        return 0;
    }

    result.sort(compare);

    res.render('tr', {
        result: result
    })

})


// Edit user profile
router.post('/', function(req, res, next) {
    if(!res.authenticate()) return
    //if(res.locals.user.id !== 918) return

    var localeCopy = path.join(__dirname, '..', 'locales-copy.yaml');
    if(fs.existsSync(localeCopy)) {
        var doc = yaml.safeLoad(fs.readFileSync(localeCopy, 'utf8'))
        var key = req.body.id;
        var oldValue = op.get(doc, key);
        var newValue = req.body.value;

        if(oldValue !== newValue) {
            op.set(doc, key, newValue)
            fs.writeFile(localeCopy, yaml.safeDump(doc, { sortKeys: true, indent: 4 }), function(err) {
                if(err) return console.log(err)
                log.debug('Locales file saved to locales-copy.yaml')
            })
        }
        log.debug('Old value was ' + oldValue + " , new value is " + newValue)
    }

    res.send()
})



module.exports = router