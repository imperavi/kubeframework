App.Broadcast = function(app)
{
    this.app = app;
    this.modules = app.modules;
    this.callback = app.appcallback;
};

App.Broadcast.prototype = {
    trigger: function(name, sender, args)
    {
        if (Array.isArray(name))
        {
            sender._id = name[0];
            name = name[1];
        }
        else if (sender && typeof sender.context !== 'undefined')
        {
            sender._id = sender.context.getName();
        }

        args.unshift(sender);

        for (var moduleName in this.modules)
        {
            for (var key in this.modules[moduleName])
            {
                var instance = this.modules[moduleName][key];
                this._call(instance, name, args, sender);
            }
        }

        this.callback.trigger(name, args);
    },


    // private
    _call: function(instance, name, args, sender)
    {
        // new
        if (typeof instance['onmessage'] !== 'undefined')
        {
            var arr = name.split('.');
            var func = instance['onmessage'][arr[0]];

            if (arr.length === 1 && typeof func === 'function')
            {
                func.apply(instance, args);
            }
            else if (arr.length === 2 && typeof func !== 'undefined' && typeof func[arr[1]] === 'function')
            {
                func[arr[1]].apply(instance, args);
            }
        }

        // 7.1.1 compatibility
        var arr = name.split('.');
        if (arr.length === 1)
        {
            if (typeof instance['on' + name] === 'function')
            {
                instance['on' + name].apply(instance, args);
            }
        }
        else
        {
            arr[0] = 'on' + arr[0];

            // without id
            var func = this.app.utils.checkProperty(instance, arr);
            if (typeof func === 'function')
            {
                func.apply(instance, args);
            }

            // with id
            if (sender && sender._id)
            {
                var idArr = [arr[0], sender._id, arr[1]];
                var func = this.app.utils.checkProperty(instance, idArr);
                if (typeof func === 'function')
                {
                    func.apply(instance, args);
                }
            }
        }
    }
};