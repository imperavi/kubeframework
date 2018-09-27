App.Callback = function(app)
{
    this.app = app;
    this.opts = app.opts;

    // local
    this.callbacks = {};

    // build
    this._build();
};

App.Callback.prototype = {
    stop: function()
    {
        this.callbacks = {};
    },
    add: function(name, handler)
    {
        if (typeof this.callbacks[name] === 'undefined') this.callbacks[name] = [];

        this.callbacks[name].push(handler);
    },
    remove: function(name, handler)
    {
        if (handler === undefined)
        {
            delete this.callbacks[name];
        }
        else
        {
            for (var i = 0; i < this.callbacks[name].length; i++)
            {
                this.callbacks[name].splice(i, 1);
            }

            if (this.callbacks[name].length === 0)
            {
                delete this.callbacks[name];
            }
        }
    },
    trigger: function(name, args)
    {
        if (typeof this.callbacks[name] === 'undefined') return;

        for (var i = 0; i < this.callbacks[name].length; i++)
        {
            this.callbacks[name][i].apply(this.app, args);
        }
    },

    // private
    _build: function()
    {
        if (this.opts.callbacks)
        {
            for (var name in this.opts.callbacks)
            {
                if (typeof this.opts.callbacks[name] === 'function')
                {
                    if (typeof this.callbacks[name] === 'undefined') this.callbacks[name] = [];
                    this.callbacks[name].push(this.opts.callbacks[name]);
                }
                else
                {
                    for (var key in this.opts.callbacks[name])
                    {
                        if (typeof this.callbacks[name + '.' + key] === 'undefined') this.callbacks[name + '.' + key] = [];
                        this.callbacks[name + '.' + key].push(this.opts.callbacks[name][key]);
                    }

                }
            }
        }
    }
};