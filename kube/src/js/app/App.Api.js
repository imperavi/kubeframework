App.Api = function(app)
{
    this.app = app;
    this.modules = app.modules;
};

App.Api.prototype = {
    trigger: function(name, args)
    {
        var arr = name.split('.');
        var isNamed = (arr.length === 3);
        var isApp = (arr.length === 1);
        var isCallback = (arr[0] === 'on' || arr[0] === 'off');

        var module = arr[0];
        var method = arr[1];
        var id = false;

        if (isApp)
        {
            module = false;
            method = arr[0];
        }
        else if (isNamed)
        {
            method = arr[2];
            id = arr[1];
        }

        // app
        if (isApp)
        {
            if (typeof this.app[method] === 'function')
            {
                return this._call(this.app, method, args);
            }
        }
        // callback
        else if (isCallback)
        {
            return (module === 'on') ? this.app.on(module, args[0]) : this.app.off(module, args[0] || undefined);
        }
        else
        {
            // service
            if (this._isInstanceExists(this.app, module))
            {
                return this._call(this.app[module], method, args);
            }
            // module / plugin / addon
            else if (this._isInstanceExists(this.modules, module))
            {
                this._doApi(module, method, id, args)
            }
        }
    },

    // private
    _isInstanceExists: function(obj, name)
    {
        return (typeof obj[name] !== 'undefined');
    },
    _doApi: function(module, method, id, args)
    {
        for (var key in this.modules[module])
        {
            if (id === false || id === key)
            {
                var instance = this.modules[module][key];
                this._call(instance, method, args);
            }
        }
    },
    _call: function(instance, method, args)
    {
        if (typeof instance[method] === 'function')
        {
            return instance[method].apply(instance, args);
        }
    }
};