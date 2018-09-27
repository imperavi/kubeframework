App.Target = function(app, selector)
{
    this.app = app;
    this.parse(selector);
};

App.Target.prototype = {
    isOpened: function()
    {
        return !this.isClosed();
    },
    isClosed: function()
    {
        var self = this;
        var count = 0;
        var len = this.length;
        this.each(function(node)
        {
            var $node = $K.dom(node);
            if ($node.hasClass('is-hidden') || $node.css('display') === 'none')
            {
                count++;
            }
        });

        return (count === len);
    }
};

$K.inherit(App.Target, Dom.prototype);