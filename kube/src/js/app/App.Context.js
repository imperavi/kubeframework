App.Context = function(app, $el, name)
{
    this.app = app;
    this.opts = app.opts;

    // build
    this.$element = this._buildElement($el);
    this.params = this._buildParams();
    this.name = this._buildName(name);
    this.$target = this._buildTarget();
};

App.Context.prototype = {

    // public
    getElement: function()
    {
        return this.$element;
    },
    getTarget: function()
    {
        return this.$target;
    },
    getParams: function(defaults)
    {
        return (defaults) ? $K.extend({}, defaults, this.params) : this.params;
    },
    getName: function()
    {
        return this.name;
    },

    // private
    _buildName: function(name)
    {
        return (this.params.name) ? this.params.name : name;
    },
    _buildParams: function()
    {
        return $K.create('service.options', this.app, 'element', this.$element);
    },
    _buildElement: function($el)
    {
        return new App.Element(this.app, $el);
    },
    _buildTarget: function()
    {
        return new App.Target(this.app, this.params.target);
    }
};