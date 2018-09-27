var App = function(options)
{
    this.modules = {};
    this.services = [];
    this.queueStart = { 'service': {}, 'module': {} };
    this.queueStop = { 'service': {}, 'module': {} };
    this.started = false;
    this.stopped = false;

    // environment
    this.namespace = 'kube';
    this.dataNamespace = 'data-kube';
    this.instancePrefix = 'kube-instance-';
    this.rootOpts = options;
    this.$win = $K.dom(window);
    this.$doc = $K.dom(document);
    this.$body = $K.dom('body');

    // core services
    this.coreServices = ['options', 'lang', 'utils'];
    this.bindableServices = ['opts', 'lang', 'utils', '$win', '$doc', '$body']

    this.utils = $K.create('service.utils', this);
    this.opts = $K.create('service.options', this, 'global', options);
    this.lang = $K.create('service.lang', this);

    this.appcallback = new App.Callback(this);
    this.appstarter = new App.Starter(this);
    this.appbuilder = new App.Builder(this);
    this.appbroadcast = new App.Broadcast(this);
    this.appapi = new App.Api(this);

    this.build();
    this.start();
};

App.prototype = {

    // build
    build: function()
    {
        this.appbuilder.build();
    },

    // start & stop
    start: function()
    {
        // start
        this.stopped = false;
        this.broadcast('start', this);

        // starter
        this.appstarter.start();

        // started
        this.broadcast('started', this);
        this.started = true;
    },
    stop: function()
    {
        this.started = false;
        this.stopped = true;

        // stop
        this.broadcast('stop', this);

        // stopper
        this.appstarter.stop();

        // stopped
        this.broadcast('stopped', this);
    },

    // starter & stopper
    starter: function(instance, priority)
    {
        var type = (instance._type !== 'service') ? 'module' : instance._type;
        this.queueStart[type][priority] = instance._name;
    },
    stopper: function(instance, priority)
    {
        var type = (instance._type !== 'service') ? 'module' : instance._type;
        this.queueStop[type][priority] = instance._name;
    },

    // started & stopped
    isStarted: function()
    {
        return this.started;
    },
    isStopped: function()
    {
        return this.stopped;
    },

    // broadcast
    broadcast: function(name, sender)
    {
        this.appbroadcast.trigger(name, sender, [].slice.call(arguments, 2));
    },

    // callback
    on: function(name, func)
    {
        this.appcallback.add(name, func);
    },
    off: function(name, func)
    {
        this.appcallback.remove(name, func);
    },

    // api
    api: function(name)
    {
        this.appapi.trigger(name, [].slice.call(arguments, 1));
    }
};