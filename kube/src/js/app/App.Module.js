App.Module = function(app, $el, name, id)
{
    this.app = app;
    this.instancePrefix = app.instancePrefix;

    // local
    this.eventTypes = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup', 'mousemove',
                       'keydown', 'keyup', 'submit', 'change', 'contextmenu', 'input'];

    // build
    return this._build($el, name, id);
};

App.Module.prototype = {
    _build: function($el, name, id)
    {
        var instance = $el.dataget(this.instancePrefix + name);
        if (!instance && typeof $K.modules[name] !== 'undefined')
        {
            var context = new App.Context(this.app, $el, id);
            var $target = context.getTarget();

            instance = $K.create('module.' + name, this.app, context);
            instance._id = id;

            $el.dataset(this.instancePrefix + name, instance);
            $el.attr('data-loaded', true);

            // delegate events
            this._delegateModuleEvents(instance, $el, name);

            // delegate commands
            this._delegateModuleCommands(instance, $el);

            if ($target.is())
            {
                this._delegateModuleCommands(instance, $target);
            }
        }

        return instance;
    },

    _delegateModuleCommands: function(instance, $el)
    {
        $el.find('[data-command]').each(function(node)
        {
            this._delegateCommand(instance, node, node.getAttribute('data-command'));

        }.bind(this));
    },
    _delegateCommand: function(instance, node, command)
    {
        if (typeof instance._eventCommands === 'undefined') instance._eventCommands = [];

        var self = this;
        var $node = $K.dom(node);

        instance._eventCommands.push($node);

        $node.on('click.generatedcommand', function(e)
        {
            e.preventDefault();

            var args = $node.data();
            args.event = e;

            self.app.broadcast(command, instance, $node, args);
        });
    },
    _delegateModuleEvents: function(instance, $el, name)
    {
        $el.find('[data-type]').each(function(node)
        {
            var arr = node.getAttribute('data-type').split('.');
            var type = arr[0];
            var scope = name;

            if (arr.length === 2)
            {
                scope = arr[0];
                type = arr[1];
            }

            if (scope === name)
            {
                this._delegateEvent(instance, name, node, type);
            }

        }.bind(this));
    },
    _delegateEvent: function(instance, name, node, type)
    {
        if (typeof instance._eventNodes === 'undefined') instance._eventNodes = [];

        var $node = $K.dom(node);
        var callback = function(e, eventType, element, type, args)
        {
            return instance['on' + eventType].call(instance, e, element, type, args);
        };

        instance._eventNodes.push($node);

        for (var i = 0; i < this.eventTypes.length; i++)
        {
            var event = 'on' + this.eventTypes[i];
            if (typeof instance[event] === 'function')
            {
                $node.on(this.eventTypes[i] + '.generatedevent', function(e)
                {
                    var args = $node.data();
                    callback(e, e.type, this, type, args);
                });
            }
        }
    }
};