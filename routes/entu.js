var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var md      = require('marked')
var async   = require('async')



//Get page (web-content)
exports.get_page = function(id, callback) {
    request.get({url: APP_ENTU_URL + '/entity-' + id, strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) {
            if(body.error) {
                return callback(new Error(body.error))
            } else {
                return callback(new Error(body))
            }
        }

        var properties = body.result.properties
        var page = {
            md: md
        }

        if(properties['pretitle'].values) page.pretitle = properties['pretitle'].values[0].db_value
        if(properties['title'].values) page.title = properties['title'].values[0].db_value
        if(properties['photo'].values) page.photo = APP_ENTU_URL + '/file-' + properties['photo'].values[0].db_value
        if(properties['video'].values) page.video = properties['video'].values[0].db_value
        if(properties['contents'].values) page.contents = properties['contents'].values[0].db_value
        if(properties['description'].values) page.description = properties['description'].values[0].db_value
        if(properties['keyword'].values) {
            page.keywords = []
            for(var i in properties['keyword'].values) {
                page.keywords.push(properties['keyword'].values[1].db_value)
            }
        }

        callback(null, page)
    })
}



//Get partners
exports.get_partners = function(callback) {
    request.get({url: APP_ENTU_URL + '/entity', qs: {definition: 'partner'}, strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) {
            if(body.error) {
                return callback(new Error(body.error))
            } else {
                return callback(new Error(body))
            }
        }

        partners = []
        for(var i in body.result) {
            partners.push({
                name: body.result[i].name,
                info: body.result[i].info,
                picture: APP_ENTU_URL + '/entity-' + body.result[i].id + '/picture'
            })
        }

        callback(null, partners)
    })
}



//Get team
exports.get_team = function(callback) {
    request.get({url: APP_ENTU_URL + '/entity-612/childs', strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) {
            if(body.error) {
                return callback(new Error(body.error))
            } else {
                return callback(new Error(body))
            }
        }

        team = []
        async.each(body.result.person.entities, function(entity, callback) {
            request.get({url: APP_ENTU_URL + '/entity-' + entity.id, strictSSL: true, json: true}, function(error, response, body) {
                if(error) return callback(error)
                if(response.statusCode !== 200 || !body.result) {
                    if(body.error) {
                        return callback(new Error(body.error))
                    } else {
                        return callback(new Error(body))
                    }
                }

                var properties = body.result.properties
                var profile = {}

                if(properties['forename'].values) profile.forename = properties['forename'].values[0].db_value
                if(properties['surname'].values) profile.surname = properties['surname'].values[0].db_value
                if(properties['photo'].values) profile.photo = APP_ENTU_URL + '/file-' + properties['photo'].values[0].db_value
                if(properties['about-me-text'].values) profile.info = properties['about-me-text'].values[0].db_value

                team.push({
                    name: profile.forename + ' ' + profile.surname,
                    info: profile.info,
                    photo: profile.photo
                })
                callback()
            })

        }, function(error){
            if(error) return callback(error)

            callback(null, team)
        })
    })
}



//Get profiles
exports.get_profiles = function(callback) {
    request.get({url: APP_ENTU_URL + '/entity-615/childs', strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) {
            if(body.error) {
                return callback(new Error(body.error))
            } else {
                return callback(new Error(body))
            }
        }

        profiles = []
        async.each(body.result.person.entities, function(entity, callback) {
            request.get({url: APP_ENTU_URL + '/entity-' + entity.id, strictSSL: true, json: true}, function(error, response, body) {
                if(error) return callback(error)
                if(response.statusCode !== 200 || !body.result) {
                    if(body.error) {
                        return callback(new Error(body.error))
                    } else {
                        return callback(new Error(body))
                    }
                }

                var properties = body.result.properties
                var profile = {}

                if(properties['forename'].values) profile.forename = properties['forename'].values[0].db_value
                if(properties['surname'].values) profile.surname = properties['surname'].values[0].db_value
                if(properties['photo'].values) profile.photo = APP_ENTU_URL + '/file-' + properties['photo'].values[0].db_value
                if(properties['slogan'].values) profile.slogan = properties['slogan'].values[0].db_value
                if(properties['about-me-text'].values) profile.info = properties['about-me-text'].values[0].db_value

                profiles.push({
                    id: body.result.id,
                    name: profile.forename + ' ' + profile.surname,
                    info: profile.info,
                    photo: profile.photo
                })
                callback()
            })

        }, function(error){
            if(error) return callback(error)

            callback(null, profiles)
        })
    })
}
