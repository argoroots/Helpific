var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var md      = require('marked')
var async   = require('async')
var op      = require('object-path')



//Get page (web-content)
exports.get_page = function(id, callback) {
    request.get({url: APP_ENTU_URL + '/entity-' + id, strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        var page = {
            md: md,
            keywords: []
        }

        page.pretitle = op.get(body, 'result.properties.pretitle.values.0.db_value', null)
        page.title = op.get(body, 'result.properties.title.values.0.db_value', null)
        page.photo = op.has(body, 'result.properties.photo.values.0.db_value') ? APP_ENTU_URL + '/file-' + op.get(body, 'result.properties.photo.values.0.db_value') : null
        page.video = op.get(body, 'result.properties.video.values.0.db_value', null)
        page.contents = op.get(body, 'result.properties.contents.values.0.db_value', null)
        page.description = op.get(body, 'result.properties.description.values.0.db_value', null)
        for(var i in op.get(body, 'result.properties.keyword.values', [])) {
            page.keywords.push(op.get(body, 'result.properties.keyword.values.' + i + '.db_value', null))
        }

        callback(null, page)
    })
}



//Get partners
exports.get_partners = function(callback) {
    request.get({url: APP_ENTU_URL + '/entity', qs: {definition: 'partner'}, strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        partners = []
        async.each(body.result, function(entity, callback) {
            request.get({url: APP_ENTU_URL + '/entity-' + entity.id, strictSSL: true, json: true}, function(error, response, body) {
                if(error) return callback(error)
                if(response.statusCode !== 200 || !body.result) {
                    if(body.error) {
                        return callback(new Error(body.error))
                    } else {
                        return callback(new Error(body))
                    }
                }

                var profile = {
                    id: body.result.id
                }

                profile.name = op.get(body, 'result.properties.name.values.0.db_value', null)
                profile.note = op.get(body, 'result.properties.note.values.0.db_value', null)
                profile.photo = op.has(body, 'result.properties.photo.values.0.db_value') ? APP_ENTU_URL + '/file-' + op.get(body, 'result.properties.photo.values.0.db_value') : null
                profile.url = op.get(body, 'result.properties.url.values.0.db_value', null)

                partners.push(profile)
                callback()
            })

        }, function(error){
            if(error) return callback(error)

            callback(null, partners)
        })
    })
}



//Get team
exports.get_team = function(callback) {
    request.get({url: APP_ENTU_URL + '/entity-612/childs', strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

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

                var profile = {
                    id: body.result.id
                }

                profile.forename = op.get(body, 'result.properties.forename.values.0.db_value', null)
                profile.surname = op.get(body, 'result.properties.surname.values.0.db_value', null)
                profile.photo = APP_ENTU_URL + '/entity-' + body.result.id + '/picture'
                profile.info = op.get(body, 'result.properties.about-me-text.values.0.db_value', null)

                team.push(profile)
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
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

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

                var profile = {
                    id: body.result.id
                }

                profile.forename = op.get(body, 'result.properties.forename.values.0.db_value', null)
                profile.surname = op.get(body, 'result.properties.surname.values.0.db_value', null)
                profile.photo = APP_ENTU_URL + '/entity-' + body.result.id + '/picture'
                profile.slogan = op.get(body, 'result.properties.slogan.values.0.db_value', null)
                profile.info = op.get(body, 'result.properties.about-me-text.values.0.db_value', null)

                profiles.push(profile)
                callback()
            })

        }, function(error){
            if(error) return callback(error)

            callback(null, profiles)
        })
    })
}



//Get profile
exports.get_profile = function(id, callback) {
    request.get({url: APP_ENTU_URL + '/entity-' + id, strictSSL: true, json: true}, function(error, response, body) {
        if(error) return callback(error)
        if(response.statusCode !== 200 || !body.result) return callback(new Error(op.get(body, 'error', body)))

        var profile = {
            id: body.result.id,
            about: {},
            i_help: {},
            you_help: {}
        }

        profile.forename = op.get(body, 'result.properties.forename.values.0.db_value', null)
        profile.surname = op.get(body, 'result.properties.surname.values.0.db_value', null)
        profile.slogan = op.get(body, 'result.properties.slogan.values.0.db_value', null)
        profile.photo = op.has(body, 'result.properties.photo.values.0.db_value') ? APP_ENTU_URL + '/file-' + op.get(body, 'result.properties.photo.values.0.db_value') : null

        profile.about.text = op.get(body, 'result.properties.about-me-text.values.0.db_value', '')
        profile.about.photo = op.has(body, 'result.properties.about-me-photo.values.0.db_value') ? APP_ENTU_URL + '/file-' + op.get(body, 'result.properties.photo.values.0.db_value') : null
        profile.about.video = op.get(body, 'result.properties.about-me-video.values.0.db_value', null)

        profile.i_help.text = op.get(body, 'result.properties.me-help-you-text.values.0.db_value', '')
        profile.i_help.photo = op.has(body, 'result.properties.me-help-you-photo.values.0.db_value') ? APP_ENTU_URL + '/file-' + op.get(body, 'result.properties.photo.values.0.db_value') : null
        profile.i_help.video = op.get(body, 'result.properties.me-help-you-video.values.0.db_value', null)

        profile.you_help.text = op.get(body, 'result.properties.you-help-me-text.values.0.db_value', '')
        profile.you_help.photo = op.has(body, 'result.properties.you-help-me-photo.values.0.db_value') ? APP_ENTU_URL + '/file-' + op.get(body, 'result.properties.photo.values.0.db_value') : null
        profile.you_help.video = op.get(body, 'result.properties.you-help-me-video.values.0.db_value', null)

        callback(null, profile)
    })

}
