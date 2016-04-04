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
var lupus = require('lupus')


core_api.active = false


lupus(1, 45, function(n) {
    migratePesonsBathc(n, function(data){
        log.debug(data)
    })
})


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
    var pictureUrl = p1.get('_picture')

    core_api.getEntity({
        definition: 'person',
        id: personId,
        migra: true
    }, function (error, result) {

        if (result) {
            var properties = {}

            properties.entuID = personId
            properties.pictureUrl = pictureUrl

            core_api.migratePicture({
                entuID: personId,
                pictureUrl: pictureUrl
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
