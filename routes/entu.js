var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var md      = require('marked')



//get page info from Entu
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
            for(i in properties['keyword'].values) {
                page.keywords.push(properties['keyword'].values[1].db_value)
            }
        }

        callback(null, page)
    })
}
