var log4js  = require('log4js')

// global variables (and list of all used environment variables)
//APP_VERSION         = process.env.VERSION || require('./package').version
APP_LOGLEVEL        = process.env.LOGLEVEL || 'debug'
APP_PORT            = process.env.PORT
//APP_CACHE_DIR       = process.env.CACHEDIR || path.join(__dirname, 'cache')
//APP_COOKIE_SECRET   = process.env.COOKIE_SECRET || random.generate(16)
APP_ENTU_URL        = process.env.ENTU_URL || 'https://helpific.entu.ee/api2'
APP_ENTU_USER       = process.env.ENTU_USER
APP_ENTU_KEY        = process.env.ENTU_KEY
APP_SENTRY          = process.env.SENTRY_DSN
APP_DEFAULT_LOCALE  = process.env.DEFAULT_LOCALE || 'en'
APP_TIMEZONE        = process.env.TIMEZONE || 'Europe/Tallinn'
APP_ADMIN_EMAILS    = process.env.ADMIN_EMAILS
APP_FEEDBACK_EMAILS = process.env.FEEDBACK_EMAILS
APP_CORE_URL        = process.env.CORE_URL || 'http://flexbuy.eu:8080'


// start logging
log = log4js.getLogger()
log.setLevel(APP_LOGLEVEL)


var async  = require('async')
var core_api = require('./helpers/core-api')
var entu    = require('./helpers/entu')


log.debug("before start person")
core_api.active = false


async.parallel({
        requests: function(callback) {
            entu.getEntities({
                definition: 'request',
                fullObject: true
            }, callback)
        },
        persons: function(callback) {
            entu.getEntities({
                parentEntityId: 615,
                definition: 'person',
                fullObject: true
            }, callback)
        },
        messages: function(callback) {
            entu.getEntities({
                definition: 'message',
                fullObject: true
            }, callback)

        }
    },
    function(err, results) {
        if(err) return log.error(err)


        for (i in results.persons) {
            var p1 = results.persons[i]

            var personId = p1.get('_id')
            log.debug('personId = ' + personId)

            var found = false
            core_api.getEntity({
                definition: 'person',
                id: personId
            }, function(error, result) {

                if(result){
                    found = true
                }
            });

            if(!found){
                var properties = {}
                properties.surname = p1.get('surname.value')
                properties.forename = p1.get('forename.value')
                properties.county = p1.get('county.value')
                properties.email = p1.get('email.value')
                properties.town = p1.get('town.value')
                properties.slogan = p1.get('slogan.value')
                properties.language = p1.get('language.value')
                properties.country = p1.get('country.value')
                properties.address = p1.get('address.value')
                properties.newsletter = p1.get('newsletter.value')
                properties.aboutMeText = p1.get('about-me-text.value')
                properties.aboutMeVideo = p1.get('about-me-video.value')

                log.debug(JSON.stringify(properties))

                core_api.add({
                    definition: 'person',
                    properties: properties
                }, function(error, result){
                    log.debug(error)
                    log.debug(result)
                })
            }

            for (o in results.requests) {
                var p2 = results.requests[o]

                var requestId = p2.get('_id')
                var ref1 = p2.get('person.reference')

                if(personId == ref1) {
                    log.debug("person " + personId + " has request " + requestId)
                }
            }

            for (u in results.messages) {
                var p3 = results.messages[u]

                var messageId = p3.get('_id')
                var ref2 = p3.get('from-person.reference')

                if(personId == ref2) {
                    log.debug("person " + personId + " has message " + messageId)
                }

            }

        }
    })


log.debug("after start person")