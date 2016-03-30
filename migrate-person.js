var log4js  = require('log4js')

// global variables (and list of all used environment variables)
APP_LOGLEVEL        = process.env.LOGLEVEL || 'debug'
APP_PORT            = process.env.PORT
APP_ENTU_URL        = process.env.ENTU_URL || 'https://helpific.entu.ee/api2'
APP_ENTU_USER       = process.env.ENTU_USER
APP_ENTU_KEY        = process.env.ENTU_KEY
APP_SENTRY          = process.env.SENTRY_DSN
APP_DEFAULT_LOCALE  = process.env.DEFAULT_LOCALE || 'en'
APP_TIMEZONE        = process.env.TIMEZONE || 'Europe/Tallinn'
APP_ADMIN_EMAILS    = process.env.ADMIN_EMAILS
APP_FEEDBACK_EMAILS = process.env.FEEDBACK_EMAILS
APP_CORE_URL        = process.env.CORE_URL || 'http://core.helpific.ee:8080'


// start logging
log = log4js.getLogger()
log.setLevel(APP_LOGLEVEL)


var async  = require('async')
var core_api = require('./helpers/core-api')
var entu    = require('./helpers/entu')


core_api.active = false


for(page = 1; page < 45; page++){
    migratePesonsBathc(page, function(data){
        log.debug(data)
    })
}


function migratePesonsBathc(page, callback){
    async.parallel({
            persons: function(callback) {
                entu.getEntities({
                    parentEntityId: 615,
                    definition: 'person',
                    fullObject: true,
                    limit: 25,
                    page: page
                }, callback)
            }
        },
        function(err, results) {
            if(err) return log.error(err)
            for (i in results.persons) {
                var p1 = results.persons[i]

                migratePerson(p1, function(data) {
                    callback(data)
                });
            }
        })
}


function migratePerson(p1, callback) {
    var personId = p1.get('_id')

    core_api.getEntity({
        definition: 'person',
        id: personId,
        migra: true
    }, function (error, result) {
        if (!result || Object.keys(result).length === 0) {
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
            properties.entuId = personId
            properties.phone = p1.get('phone.value')


            core_api.add({
                definition: 'person',
                properties: properties
            }, function (error, result) {
                log.debug(error)
                log.debug(result)
            })
        }

        callback({
            personId: personId,
            properties: properties
        });
    });
}
