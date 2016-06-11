var fs      = require('fs')
var op      = require('object-path')
var path    = require('path')
var request = require('request')
var yaml    = require('js-yaml')
var locale  = require('locale')

i18nConfig = {}



exports.configure = function(config) {
    if(!config) config = {}

    i18nConfig.file = config.file || path.join(__dirname, 'locales.yaml')
    i18nConfig.locales = config.locales || ['en']
    i18nConfig.defaultLocale = config.defaultLocale || 'en'
    i18nConfig.updateFile = config.updateFile || false
    i18nConfig.countries = config.countries || {}
    i18nConfig.supported = new locale.Locales(config.locales || ['en'])

    i18nConfig.translations = {}
    if(fs.existsSync(i18nConfig.file)) {
        i18nConfig.translations = yaml.safeLoad(fs.readFileSync(i18nConfig.file))
        log.debug('Opened locales file ' + i18nConfig.file)
    } else {
        log.error('Locales file ' + i18nConfig.file + ' missing!')
    }
}


var getLanguageToShow = function (bestLocale, cookieLanguage, userLanguage, pathLanguage, ip) {
    log.debug('bestLocale = ' + bestLocale + " cookieLanguage = " + cookieLanguage +
        " userLanguage = " + userLanguage + " pathLanguage = " + pathLanguage + " ip = " + ip)

    var a = null

    if(i18nConfig.locales.indexOf(userLanguage) !== -1) {
        log.debug('Selected language is userLanguage = ' + userLanguage)
        a = userLanguage
    } else if (i18nConfig.locales.indexOf(cookieLanguage) !== -1) {
        log.debug('Selected language is cookieLanguage = ' + cookieLanguage)
        a = cookieLanguage
    } else if (i18nConfig.locales.indexOf(pathLanguage) !== -1) {
        log.debug('Selected language is pathLanguage = ' + pathLanguage)
        a = pathLanguage
    }

    return a
};


exports.init = function(req, res, next) {

    var browserLocales = new locale.Locales(req.headers["accept-language"])
    var bestLocale = browserLocales.best(i18nConfig.supported) || i18nConfig.defaultLocale
    log.debug(   "You asked for: " + req.headers["accept-language"] + "\n" +
        "We support: " + i18nConfig.supported + "\n" +
        "Our default is: " + locale.Locale["default"] + "\n" +
        "The best match is: " + bestLocale + "\n")

    var cookieLanguage = req.signedCookies.lang
    var userLanguage = op.get(res, 'locals.user.lang');
    var pathLanguage = req.path.split('/')[1];
    var langToShow = getLanguageToShow(bestLocale, cookieLanguage, userLanguage, pathLanguage, req.ip);

    log.debug('langToShow = ' + langToShow)

    request.get({url: 'https://geoip.entu.eu/json/' + req.ip, strictSSL: true, json: true, timeout: 1000}, function(error, response, body) {
        var lang = langToShow || op.get(i18nConfig, ['countries', op.get(body, 'country_code') ? op.get(body, 'country_code').toLowerCase() : null]) || bestLocale
        log.debug('Selected language is IP lang = ' + lang)


        if(req.path === '/') {
            return res.redirect('/' + lang)
        } else if(i18nConfig.locales.indexOf(pathLanguage) === -1) {
            var path = req.path.split('/')
            path[1] = lang
            return res.redirect(path.join('/'))
        } else {
            res.locals.lang = i18nConfig.lang = lang
            res.locals.locales = i18nConfig.locales
            res.locals.t = translate
            res.locals.tt = getText

            next()
        }
    })
}



exports.translate = translate = function translate(key, text) {
    var value = op.get(i18nConfig, 'translations.' + key + '.' + i18nConfig.lang)
    if(!value && i18nConfig.updateFile === true && i18nConfig.locales.indexOf(i18nConfig.lang) > -1) {
        op.set(i18nConfig, 'translations.' + key + '.' + i18nConfig.lang, key)
        log.warn('Created missing key ' + key + '.' + i18nConfig.lang)
        fs.writeFile(i18nConfig.file, yaml.safeDump(i18nConfig.translations, { sortKeys: true, indent: 4 }), function(err) {
            if(err) return console.log(err)
            log.debug('Locales file saved to ' + i18nConfig.file)
        })
    }
    if(value === key) value = op.get(i18nConfig, 'translations.' + key + '.' + i18nConfig.defaultLocale, key)
    if(text && value && value !== key) {
        var re = new RegExp('%s', 'g')
        value = value.replace(re, text)
    }
    return value || key
}


exports.getText = getText = function getText(key) {
    var value = op.get(i18nConfig, 'translations.' + key)
    return value || key
}
