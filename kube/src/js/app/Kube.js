// Wrapper
var $K = {};

// Globals
$K.app = [];
$K.version = '7.2.1';
$K.options = {};
$K.modules = {};
$K.services = {};
$K.plugins = {};
$K.classes = {};
$K.extends = {};
$K.lang = {};
$K.dom = function(selector, context) { return new Dom(selector, context); };
$K.ajax = Ajax;
$K.Dom = Dom;
$K.env = {
    'module': 'modules',
    'service': 'services',
    'plugin': 'plugins',
    'class': 'classes',
    'extend': 'extends'
};

// init class
var KubeApp = function(options, args)
{
    return ($K.app = new App(options));
};

// init
$K.init = function(options)
{
    return new KubeApp(options, [].slice.call(arguments, 1));
};

// api
$K.api = function(name)
{
    var app = $K.app;
    var args = [].slice.call(arguments, 1);

    if (app)
    {
        args.unshift(name);
        app.api.apply(app, args);
    }
};

// add
$K.add = function(type, name, obj)
{
    if (typeof $K.env[type] === 'undefined') return;

    // translations
    if (obj.translations)
    {
        $K.lang = $K.extend(true, {}, $K.lang, obj.translations);
    }

    // extend
    if (type === 'extend')
    {
        $K[$K.env[type]][name] = obj;
    }
    else
    {
        // prototype
        var F = function() {};
        F.prototype = obj;

        // extends
        if (obj.extends)
        {
            for (var i = 0; i < obj.extends.length; i++)
            {
                $K.inherit(F, $K.extends[obj.extends[i]]);
            }
        }

        $K[$K.env[type]][name] = F;
    }
};

// add lang
$K.addLang = function(lang, obj)
{
    if (typeof $K.lang[lang] === 'undefined')
    {
        $K.lang[lang] = {};
    }

    $K.lang[lang] = $K.extend($K.lang[lang], obj);
};

// create
$K.create = function(name)
{
    var arr = name.split('.');
    var args = [].slice.call(arguments, 1);

    var type = 'classes';
    if (typeof $K.env[arr[0]] !== 'undefined')
    {
        type = $K.env[arr[0]];
        name = arr.slice(1).join('.');
    }

    // construct
    var instance = new $K[type][name]();

    instance._type = arr[0];
    instance._name = name;

    // init
    if (instance.init)
    {
        var res = instance.init.apply(instance, args);

        return (res) ? res : instance;
    }

    return instance;
};

// inherit
$K.inherit = function(current, parent)
{
    var F = function () {};
    F.prototype = parent;
    var f = new F();

    for (var prop in current.prototype)
    {
        if (current.prototype.__lookupGetter__(prop)) f.__defineGetter__(prop, current.prototype.__lookupGetter__(prop));
        else f[prop] = current.prototype[prop];
    }

    current.prototype = f;
    current.prototype.super = parent;

    return current;
};

// error
$K.error = function(exception)
{
    throw exception;
};

// extend
$K.extend = function()
{
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    if (Object.prototype.toString.call( arguments[0] ) === '[object Boolean]')
    {
        deep = arguments[0];
        i++;
    }

    var merge = function(obj)
    {
        for (var prop in obj)
        {
            if (Object.prototype.hasOwnProperty.call(obj, prop))
            {
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') extended[prop] = $K.extend(true, extended[prop], obj[prop]);
                else extended[prop] = obj[prop];
            }
        }
    };

    for (; i < length; i++ )
    {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};