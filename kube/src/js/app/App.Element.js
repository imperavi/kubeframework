App.Element = function(app, $el)
{
    this.app = app;
    this.parse($el);
};

App.Element.prototype = {
    isOpened: function()
    {
        return !this.isClosed();
    },
    isClosed: function()
    {
        return (this.hasClass('is-hidden') || this.css('display') === 'none');
    }
};

$K.inherit(App.Element, Dom.prototype);