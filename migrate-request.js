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
APP_AUTH_CORE_URL   = process.env.AUTH_CORE_URL || 'http://core.helpific.ee:9000'


// start logging
log = log4js.getLogger()
log.setLevel(APP_LOGLEVEL)


var async  = require('async')
var core_api = require('./helpers/core-api')
var entu    = require('./helpers/entu')
var lupus = require('lupus')
var moment = require('moment-timezone')

core_api.active = false


lupus(1, 40, function(n) {
    migrateRequestsBathc(n, function(data){
        log.debug(data)
    })
})


function migrateRequestsBathc(page, callback){
    async.parallel({
            requests: function(callback) {
                entu.getEntities({
                    definition: 'request',
                    fullObject: true,
                    limit: 25,
                    page: page
                }, callback)
            }
        },
        function(err, results) {
            if(err) return log.error(err)
            for (i in results.requests) {
                var p1 = results.requests[i]

                migrateRequest(p1, function(data) {
                    callback(data)
                });
            }
        })
}


function migrateRequest(p1, callback) {
    var requestId = p1.get('_id')

    core_api.getEntity({
        definition: 'request',
        id: requestId,
        migra: true
    }, function (error, result) {
        if (!result || Object.keys(result).length === 0) {

            core_api.getEntity({
                definition: 'person',
                id: p1.get('person.reference'),
                migra: true
            }, function (error, result) {

                if(result[0]) {
                    var properties = {}

                    properties.type = p1.get('type.value')
                    properties.time = moment(p1.get('time.value')).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
                    properties.location = p1.get('location.value')
                    properties.price = p1.get('price.value') != 'None' ? p1.get('price.value') : null
                    properties.request = p1.get('request.value')
                    properties.country = p1.get('country.value')
                    properties.category = p1.get('category.value')
                    properties.status = p1.get('status.value')
                    properties.person = result[0].get('genId')
                    properties.entuId = requestId

                    core_api.add({
                        definition: 'request',
                        properties: properties
                    }, function (error, result) {
                        log.debug(error)
                        log.debug(result)
                    })

                }
                callback({
                    requestId: requestId,
                    properties: properties
                });

            })
        }


    });
}
