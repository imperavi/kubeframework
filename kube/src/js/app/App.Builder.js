App.Builder = function(app)
{
    this.app = app;
    this.opts = app.opts;
    this.$doc = app.$doc;
    this.dataNamespace = app.dataNamespace;
};

App.Builder.prototype = {
    build: function()
    {
        this._buildServices();
        this._buildModules();
    },

    // private
    _buildServices: function()
    {
        var services = [];
        var startableServices = [];
        for (var name in $K.services)
        {
            if (this.app.coreServices.indexOf(name) === -1)
            {
                this.app[name] = $K.create('service.' + name, this.app);
                this.app.bindableServices.push(name);
                services.push(name);
                startableServices.push(name);
            }
        }

        // make core services to use another services
        for (var i = 0; i < this.app.coreServices.length; i++)
        {
            var name = this.app.coreServices[i];
            if (name !== 'options') services.push(name);
        }

        // binding
        for (var i = 0; i < services.length; i++)
        {
            var service = services[i];
            for (var z = 0; z < this.app.bindableServices.length; z++)
            {
                var inj = this.app.bindableServices[z];
                if (service !== inj)
                {
                    this.app[service][inj] = this.app[inj];
                }
            }
        }

        this.app.services = startableServices;
    },
    _buildModules: function()
    {
        this.$doc.find('[' + this.dataNamespace + ']').each(function(node, i)
        {
            var $el = $K.dom(node);
            var name = $el.attr(this.dataNamespace);
            var id = ($el.attr('id')) ? $el.attr('id') : name + '-' + i;
            id = ($el.attr('data-name')) ? $el.attr('data-name') : id;
            var instance = new App.Module(this.app, $el, name, id);

            this._storeElementModule(instance, name, id);

        }.bind(this));
    },
    _storeElementModule: function(instance, name, id)
    {
        if (instance)
        {
            if (typeof this.app.modules[name] === 'undefined')
            {
                this.app.modules[name] = {};
            }

            this.app.modules[name][id] = instance;
        }
    }
};