var fs    = require('fs')
var path  = require('path')
var yaml  = require('js-yaml')
var op    = require('object-path')
var md    = require('marked')
var debug = require('debug')

i18n_config = {}



exports.configure = function(config) {
    if(!config) config = {}

    i18n_config.file = config.file || path.join(__dirname, 'locales.yaml')
    i18n_config.locales = config.locales || ['en']
    i18n_config.redirectWrongLocale = config.redirectWrongLocale || true
    i18n_config.defaultLocale = config.defaultLocale || 'en'
    i18n_config.updateFile = config.updateFile || false

    i18n_config.translations = {}
    if(fs.existsSync(i18n_config.file)) {
        i18n_config.translations = yaml.safeLoad(fs.readFileSync(i18n_config.file))
        debug('i18n:configure')('Opened locales file ' + i18n_config.file)
    } else {
        debug('i18n:configure')('Locales file ' + i18n_config.file + ' missing!')
    }
}



exports.init = function(req, res, next) {
    i18n_config.lang = req.path.split('/')[1] || i18n_config.defaultLocale

    if(i18n_config.redirectWrongLocale === true && req.path === '/') return res.redirect('/' + i18n_config.lang)
    if(i18n_config.redirectWrongLocale === true && i18n_config.locales.indexOf(i18n_config.lang) === -1) {
        var path = req.path.split('/')
        path[1] = i18n_config.defaultLocale
        return res.redirect(path.join('/'))
    }

    res.locals.lang = i18n_config.lang
    res.locals.locales = i18n_config.locales
    res.locals.t = translate
    res.locals.md = md

    next()
}



exports.translate = translate
function translate(key) {
    var value = op.get(i18n_config, 'translations.' + key + '.' + i18n_config.lang)
    if(!value && i18n_config.updateFile === true && i18n_config.locales.indexOf(i18n_config.lang) > -1) {
        op.set(i18n_config, 'translations.' + key + '.' + i18n_config.lang, key)
        debug('i18n:translate')('Created missing key ' + key + '.' + i18n_config.lang)
        fs.writeFile(i18n_config.file, yaml.safeDump(i18n_config.translations, { sortKeys: true, indent: 4 }), function(err) {
            if(err) return console.log(err)
            debug('i18n:translate')('Locales file saved to ' + i18n_config.file)
        })
    }
    return value || key
}
