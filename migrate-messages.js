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
var moment = require('moment-timezone')

core_api.active = false

lupus(1, 100, function(n) {
    migrateMessagesBathc(n, function(data){
        log.debug('END with : ' + JSON.stringify(data))
    })
});


function migrateMessagesBathc(page, callback){
    async.parallel({
            messages: function(callback) {
                entu.getEntities({
                    definition: 'message',
                    fullObject: true,
                    limit: 25,
                    page: page
                }, callback)
            }
        },
        function(err, results) {
            if(err) return log.error(err)
            for (i in results.messages) {
                var p1 = results.messages[i]

                migrateMessage(p1, function(data) {
                    callback(data)
                });
            }
        })
}


function migrateMessage(p1, callback) {
    var messageId = p1.get('_id')

    core_api.getEntity({
        definition: 'message',
        id: messageId,
        migra: true
    }, function (error, result) {
        if(error) return log.error(error)
        if (!result || Object.keys(result).length === 0) {


            async.parallel({
                    f1: function(callback) {
                        core_api.getEntity({
                            definition: 'person',
                            id: p1.get('from-person.reference'),
                            migra: true
                        }, callback)
                    },
                    t1: function(callback) {
                        core_api.getEntity({
                            definition: 'person',
                            id: p1.get('to-person.reference'),
                            migra: true
                        }, callback)
                    }
                },
                function(err, results) {
                    if(err) return log.error(err)

                    log.debug('From person : ' + JSON.stringify(results.f1))
                    log.debug('To person : ' + JSON.stringify(results.t1))

                    if(results.f1 && results.f1[0] && results.t1 && results.t1[0]) {
                        var properties = {}

                        properties['from-person'] = results.f1[0].get('genId')
                        properties['to-person'] = results.t1[0].get('genId')
                        properties.message = p1.get('message.value')
                        properties.entuId = messageId
                        properties.created = moment(p1.get('_changed')).format('YYYY-MM-DDTHH:mm:ss.SSSZ')

                        core_api.add({
                            definition: 'message',
                            properties: properties
                        }, function (error, result) {
                            log.debug('ADD ERROR : ' + error)
                            log.debug('ADD RESULT : ' + result)
                        })

                    } else {
                        log.error('not going to add ' + messageId)
                    }
                    callback({
                        messageId: messageId,
                        properties: properties
                    });
                })
        }


    });
}
