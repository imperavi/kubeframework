App.Starter = function(app)
{
    this.app = app;
    this.queue = {
        'start': app.queueStart,
        'stop': app.queueStop
    };
    this.priority = {
        'start': { 'service': [], 'module': [] },
        'stop': { 'service': [], 'module': [] }
    };
};

App.Starter.prototype = {
    start: function()
    {
        this._stopStart('service', 'start');
        this._stopStart('module', 'start');
    },
    stop: function()
    {
        this._stopStart('service', 'stop');
        this._stopStart('module', 'stop');
    },

    // private
    _stopStart: function(type, method)
    {
        // priority
        var queue = this.queue[method][type];
        for (var key in queue)
        {
            var name = queue[key];
            var instance = (type === 'service') ? this.app[name] : this.app.modules[name];

            this._callInstances(type, method, instance);
            this.priority[method][type].push(name);
        }

        // common
        var modules = (type === 'service') ? this.app.services : this.app.modules;
        for (var key in modules)
        {
            var name = (type === 'service') ? modules[key] : key;

            if (this.priority[method][type].indexOf(name) === -1)
            {
                var instance = (type === 'service') ? this.app[name] : modules[name];
                this._callInstances(type, method, instance);
            }
        }
    },
    _stopModuleEvents: function(method, instance)
    {
        if (method === 'stop')
        {
            if (typeof instance._eventNodes !== 'undefined')
            {
                for (var i = 0; i < instance._eventNodes.length; i++)
                {
                    instance._eventNodes[i].off('.generatedevent');
                }
            }

            if (typeof instance._eventCommands !== 'undefined')
            {
                for (var i = 0; i < instance._eventCommands.length; i++)
                {
                    instance._eventCommands[i].off('.generatedcommand');
                }
            }
        }
    },
    _callInstances: function(type, method, instance)
    {
        if (type === 'service')
        {
            this._call(instance, method);
        }
        else
        {
            for (var key in instance)
            {
                this._call(instance[key], method);
                this._stopModuleEvents(method, instance[key]);
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