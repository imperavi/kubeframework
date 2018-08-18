(function($K)
{
    $K.add('module', 'autocomplete', {
        init: function(app, context)
        {
            this.app = app;
            this.$doc = app.$doc;
            this.$win = app.$win;
            this.$body = app.$body;
            this.animate = app.animate;

            // defaults
            var defaults = {
        		url: false,
        		min: 2,
        		labelClass: false,
        		target: false,
        		param: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
            this.$target = context.getTarget();
        },
        start: function()
        {
            this._build();

    		this.timeout = null;
    		this.$element.on('keyup.kube.autocomplete', this._open.bind(this));
    	},
    	stop: function()
    	{
    		this.$box.remove();

            this.$element.off('.kube.autocomplete');
    		this.$doc.off('.kube.autocomplete');
    		this.$win.off('.kube.autocomplete');
    	},

    	// private
    	_build: function()
    	{
            this.$box = $K.dom('<div />');
            this.$box.addClass('autocomplete');
            this.$box.addClass('is-hidden');

            this.$body.append(this.$box);

            if (this.$target && !this._isInputTarget())
            {
                this.$target.addClass('autocomplete-labels');

                var $closes = this.$target.find('.close');
                $closes.on('click', this._removeLabel.bind(this));
            }
    	},
    	_open: function(e)
    	{
    		if (e) e.preventDefault();

    		clearTimeout(this.timeout);

    		var value = this.$element.val();
    		if (value.length >= this.params.min)
    		{
        		this._resize();
        		this.$win.on('resize.kube.autocomplete', this._resize.bind(this));
        		this.$doc.on('click.kube.autocomplete', this._close.bind(this));

    			this.$box.addClass('is-open');
    			this._listen(e);
    		}
    		else
    		{
    			this._close(e);
    		}
    	},
    	_close: function(e)
    	{
    		if (e) e.preventDefault();

    		this.$box.removeClass('is-open');
    		this.$box.addClass('is-hidden');

    		this.$doc.off('.kube.autocomplete');
    		this.$win.off('.kube.autocomplete');
        },
    	_getPlacement: function(pos, height)
    	{
            return ((this.$doc.height() - (pos.top + height)) < this.$box.height()) ? 'top' : 'bottom';
    	},
    	_resize: function()
    	{
        	this.$box.width(this.$element.width());
    	},
    	_getParamName: function()
    	{
            return (this.params.param) ? this.params.param : this.$element.attr('name');
    	},
    	_getTargetName: function()
    	{
        	var name = this.$target.attr('data-name');

            return (name) ? name : this.$target.attr('id');
    	},
    	_lookup: function()
    	{
    		var data = this._getParamName() + '=' + this.$element.val();

    		$K.ajax.post({
    			url: this.params.url,
    			data: data,
    			success: this._complete.bind(this)
    		});
    	},
    	_complete: function(json)
    	{
			this.$box.html('');

			if (json.length === 0) return this._close();

			for (var i = 0; i < json.length; i++)
			{
				var $item = $K.dom('<a>');
				$item.attr('href', '#');
				$item.attr('rel', json[i].id);

				$item.html(json[i].name);
				$item.on('click', this._set.bind(this));

				this.$box.append($item);
			}

            var pos = this.$element.offset();
			var height = this.$element.height();
			var width = this.$element.width();
    		var placement = this._getPlacement(pos, height);
			var top = (placement === 'top') ? (pos.top - this.$box.height() - height) : (pos.top + height);

			this.$box.css({ width: width + 'px', top: top + 'px', left: pos.left + 'px' });
			this.$box.removeClass('is-hidden');
    	},
    	_listen: function(e)
    	{
    		switch(e.which)
    		{
    			case 40: // down
    				e.preventDefault();
    				this._select('next');
    			break;

    			case 38: // up
    				e.preventDefault();
    				this._select('prev');
    			break;

    			case 13: // enter
    				e.preventDefault();
    				this._set();
    			break;

    			case 27: // esc
    				this._close(e);
    			break;

    			default:
    				this.timeout = setTimeout(this._lookup.bind(this), 300);
    			break;
    		}
    	},
    	_select: function(type)
    	{
    		var $links = this.$box.find('a');
    		var $active = this.$box.find('.is-active');

    		$links.removeClass('is-active');

            var $item = this._selectItem($active, $links, type);
    		$item.addClass('is-active');
    	},
    	_selectItem: function($active, $links, type)
    	{
        	var $item;
        	var isActive = ($active.length !== 0);
        	var size = (type === 'next') ? 0 : ($links.length - 1);

            if (isActive)
            {
                $item = $active[type]();
            }

            if (!isActive || !$item || $item.length === 0)
            {
                $item = $links.eq(size);
            }

            return $item;
    	},
    	_set: function(e)
    	{
    		var $active = this.$box.find('.is-active');

    		if (e)
    		{
    			e.preventDefault();
    			$active = $K.dom(e.target);
    		}

    		var id = $active.attr('rel');
            var value = $active.html();

            if (this.$target.length !== 0)
            {
                if (this._isInputTarget())
                {
                    this.$target.val(value);
                }
                else
                {
                    var $added = this.$target.find('[data-id="' + id + '"]');
                    if ($added.length === 0)
                    {
                        this._addLabel(id, value);
                    }
        		}

        		this.$element.val('');
    		}
    		else
    		{
        	    this.$element.val(value);
    		}

            this.$element.focus();

    		this.app.broadcast('autocomplete.set', this, value);
    		this._close();
    	},
    	_addLabel: function(id, name)
    	{
            var $label = $K.dom('<span>');
            $label.addClass('label');
            $label.attr('data-id', id);
            $label.text(name + ' ');

            if (this.params.labelClass)
            {
                $label.addClass(this.params.labelClass);
            }

            var $close = $K.dom('<span>');
            $close.addClass('close');
            $close.on('click', this._removeLabel.bind(this));

            var $input = $K.dom('<input>');
            $input.attr('type', 'hidden');
            $input.attr('name', this._getTargetName() + '[]');
            $input.val(name);

            $label.append($close);
            $label.append($input);

            this.$target.append($label);
    	},
    	_isInputTarget: function()
    	{
            return (this.$target.get().tagName === 'INPUT');
    	},
    	_removeLabel: function(e)
    	{
        	e.preventDefault();

        	var $el = $K.dom(e.target);
        	var $label = $el.closest('.label');

        	this.animate.run($label, 'fadeOut', function()
        	{
            	$label.remove();
        	}.bind(this))
    	}
    });
})(Kube);

(function($K)
{
    $K.add('module', 'combobox', {
        init: function(app, context)
        {
            this.app = app;
            this.$win = app.$win;

            // defaults
            var defaults = {
                placeholder: ''
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
    	},
    	start: function()
    	{
        	this._buildSource();
        	this._buildCaret();
        	this._buildEvent();
    	},
    	stop: function()
    	{
        	this.$sourceBox.after(this.$element);
        	this.$sourceBox.remove();

        	this.$element.off('.kube.combobox');
        	this.$win.off('.kube.combobox');
    	},

    	// private
    	_buildSource: function()
    	{
        	this.$sourceBox = $K.dom('<div>');
        	this.$sourceBox.addClass('combobox');

        	this.$source = $K.dom('<input>');
        	this.$source.attr('type', 'text');
        	this.$source.attr('placeholder', this.params.placeholder);

            this.$sourceBox.width(this.$element.width());
            this.$sourceBox.append(this.$source);

        	this.$element.after(this.$sourceBox);
        	this.$element.attr('class', '');
        	this.$element.attr('style', '');
        	this.$sourceBox.append(this.$element);

        	this.$win.on('resize.kube.combobox', this._resize.bind(this));
    	},
        _buildCaret: function()
        {
            this.$sourceCaret = $K.dom('<span>');
            this.$sourceCaret.addClass('combobox-caret');

            this.$sourceBox.append(this.$sourceCaret);
        },
        _buildEvent: function()
        {
            this.$element.on('change.kube.combobox', this._select.bind(this));
            this.$source.on('keyup.kube.combobox', this._type.bind(this));
        },
        _resize: function()
        {
            this.$sourceBox.width(this.$element.width());
        },
        _type: function(e)
        {
            var value = this.$source.val();

            this.app.broadcast('combobox.set', this, value);

            if (this.$sourceValue) this.$sourceValue.remove();
            if (value.trim() === '') return;

            this.$sourceValue = $K.dom('<option>');
            this.$sourceValue.attr('value', value);
            this.$sourceValue.attr('selected', true);
            this.$sourceValue.text(value);
            this.$sourceValue.addClass('is-hidden');

            this.$element.append(this.$sourceValue);
        },
        _select: function(e)
        {
            var el = e.target;
            var value = el.options[el.selectedIndex].text;

            if (this.$sourceValue) this.$sourceValue.remove();
            this.$source.val(value);

            this.app.broadcast('combobox.set', this, value);
        }
    });
})(Kube);

(function($K)
{
    $K.add('module', 'editable', {
        init: function(app, context)
        {
            this.app = app;

            // defaults
            var defaults = {
                classname: 'editable',
                focus: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
        },

        // public
        start: function()
        {
            this.$element.addClass(this.params.classname).attr('contenteditable', true);

            this._setFocus();
            this._setEvents();
    	},
    	stop: function()
    	{
            this.$element.removeClass(this.params.classname).removeAttr('contenteditable');
            this.$element.off('.kube.editable');
    	},
    	// private
    	_setEvents: function()
    	{
            this.$element.on('keydown.kube.editable', this._keydown.bind(this));
            this.$element.on('paste.kube.editable', this._paste.bind(this));
            this.$element.on('blur.kube.editable', this._blur.bind(this));
    	},
    	_setFocus: function()
    	{
            if (this.params.focus) this.$element.focus();
    	},
    	_checkEmpty: function()
    	{
            if (!this.$element.text().replace(" ", "").length)
            {
                this.$element.empty();
            }
    	},
    	_paste: function(e)
    	{
            e.preventDefault();

            var event = (e.originalEvent || e);

            var text = '';
            if (event.clipboardData)
            {
                text = event.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            }
            else if (window.clipboardData)
            {
                text = window.clipboardData.getData('Text');
                document.selection.createRange().pasteHTML(text);
            }
    	},
    	_blur: function(e)
    	{
            this._checkEmpty();
    	},
    	_keydown: function(e)
    	{
        	// disable enter key
        	if (e.which === 13) e.preventDefault();
    	}
    });
})(Kube);
(function($K)
{
    $K.add('module', 'magicquery', {
        init: function(app, context)
        {
            this.app = app;
            this.response = app.response;

            // defaults
            var defaults = {
                url: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
        },
        // public
        start: function()
        {
            this.$element.on('click.kube.magicquery', this._send.bind(this));
        },
        stop: function()
        {
            this._enable();
            this.$element.off('.kube.magicquery');
        },

        // private
        _disable: function()
        {
            this.$element.attr('disabled', true);
        },
        _enable: function()
        {
            this.$element.removeAttr('disabled');
        },
        _send: function(e)
        {
            e.preventDefault();
            this._disable();

            $K.ajax.post({
    			url: this.params.url,
    			success: this._parse.bind(this)
    		});
        },
        _parse: function(data)
        {
            this._enable();

            var json = this.response.parse(data);
            if (json)
            {
    			this.app.broadcast('magicquery.success', this, json);
    		}
        },
    });
})(Kube);
(function($K)
{
    $K.add('module', 'number', {
        init: function(app, context)
        {
            this.app = app;

            // context
            this.context = context;
            this.$element = context.getElement();
        },

        // public
        start: function()
        {
            this.$input = this.$element.find('input[type="number"]');
            this.$btnUp = this.$element.find('.is-up');
            this.$btnDown = this.$element.find('.is-down');

            this._buildStep();
            this._buildMin();
            this._buildMax();

            if (!this._isDisabled())
            {
                this.$btnUp.on('click.kube.number', this._increase.bind(this));
                this.$btnDown.on('click.kube.number', this._decrease.bind(this));
            }
    	},
    	stop: function()
    	{
            this.$btnUp.off('.kube.number');
            this.$btnDown.off('.kube.number');
    	},
    	// private
    	_buildStep: function()
    	{
            var step = this.$input.attr('step');
            this.step = (step) ? parseFloat(step) : 1;
    	},
    	_buildMin: function()
    	{
            var min = this.$input.attr('min');
            this.min = (min) ? parseFloat(min) : false;
    	},
    	_buildMax: function()
    	{
            var max = this.$input.attr('max');
            this.max = (max) ? parseFloat(max) : false;
    	},
    	_isDisabled: function()
    	{
        	return this.$input.attr('disabled');
    	},
    	_getValue: function()
    	{
        	var value = parseFloat(this.$input.val());
        	var min = (this.min === false) ? 0 : this.min;

        	return (isNaN(value)) ? min : value;
    	},
    	_increase: function(e)
    	{
        	if (e)
        	{
            	e.preventDefault();
            	e.stopPropagation();
        	}

            var oldValue = this._getValue();
            var newVal = (this.max !== false && oldValue >= this.max) ? oldValue : oldValue + this.step;

            this.$input.val(newVal);
        },
        _decrease: function(e)
        {
        	if (e)
        	{
            	e.preventDefault();
            	e.stopPropagation();
        	}

            var oldValue = this._getValue();
            var newVal = (this.min !== false && oldValue <= this.min) ? oldValue : oldValue - this.step;

            this.$input.val(newVal);
    	}
    });
})(Kube);
(function($K)
{
    $K.add('module', 'selector', {
        init: function(app, context)
        {
            this.app = app;

            // context
            this.context = context;
            this.$element = context.getElement();
        },

        // public
        start: function()
        {
            this.$selector = this._buildSelector();
            this.$selector.on('change.kube.selector', this._toggle.bind(this));
        },
        stop: function()
        {
            this.$selector.off('.kube.selector');
    	},

    	// private
    	_isSelect: function()
    	{
        	return (this.$element.get().tagName === 'SELECT');
    	},
    	_isHashValue: function(value)
    	{
            return (value.search(/^#/) === 0);
    	},
    	_buildSelector: function()
    	{
            return (this._isSelect()) ? this.$element : this.$element.find('input[type="radio"]');
    	},
    	_getValue: function()
    	{
        	return (this._isSelect()) ? this.$selector.val() : this.$selector.filter(':checked').val();
    	},
    	_getBoxes: function()
    	{
        	var $boxes = $K.dom([]);
            var $targets = (this._isSelect()) ? this.$selector.find('option') : this.$selector;

            $targets.each(function(node)
            {
                if (this._isHashValue(node.value))
                {
                    $boxes.add($K.dom(node.value));
                }

            }.bind(this));

            return $boxes;
    	},
    	_toggle: function()
    	{
            var value = this._getValue();
            var $boxes = this._getBoxes();
            var $box = $K.dom(value);

            $boxes.addClass('is-hidden');
            $box.removeClass('is-hidden');

            this.app.broadcast('selector.opened', this, $box);
    	}
    });
})(Kube);
(function($K)
{
    $K.add('module', 'slider', {
        init: function(app, context)
        {
            this.app = app;
            this.$win = app.$win;
            this.$doc = app.$doc;

            // defaults
            var defaults = {
                min: 0,
                max: 100,
                step: 1,
                value: 0,
                target: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
            this.$target = context.getTarget();

            // local
            this.isTicks = false;
        },

        // public
        start: function()
        {
            this._buildTrack();
            this._buildFill();
            this._buildHandle();
            this._buildTicks();

            this.update();

            this.$win.on('resize.kube.slider', this._resize.bind(this));
            this.$element.on('mousedown.kube.slider touchstart.kube.slider', this._handleDown.bind(this));
    	},
    	stop: function()
    	{
            this.$win.off('.kube.slider');
            this.$doc.off('.kube.slider');
            this.$element.off('.kube.slider');
    	},
        update: function(value)
        {
            this.value = (value) ? value : this.params.value;
            this.value = (this.value < this.params.min) ? this.params.min : this.value;

            this.handleWidth = this.$handle.width();
            this.trackWidth = this.$track.width();
            this.maxHandlePosition = this.trackWidth - this.handleWidth;
            this.fixPosition = this.handleWidth / 2;
            this.position = this._getPositionFromValue(this.value);

            this._setPosition(this.position);
            this._setTarget();
        },
    	// private
    	_resize: function()
    	{
            this._buildTicks();
            this.update(this.value);
    	},
    	_isDisabled: function()
    	{
            return (this.$element.hasClass('is-disabled') || this.$element.attr('disabled'));
    	},
    	_buildTrack: function()
    	{
        	this.$track =  $K.dom('<div />');
        	this.$track.addClass('slider-track');

        	this.$element.prepend(this.$track);
    	},
    	_buildFill: function()
    	{
        	this.$fill =  $K.dom('<div />');
        	this.$fill.addClass('slider-fill');

        	this.$track.append(this.$fill);
        },
    	_buildHandle: function()
    	{
        	this.$handle =  $K.dom('<div />');
        	this.$handle.addClass('slider-handle');

        	this.$track.append(this.$handle);
        },
    	_buildTicks: function()
    	{
            this.$ticks = this.$element.find('.slider-ticks span');

            var size = this.$ticks.length;
            this.isTicks = (size !== 0)

        	if (!this.isTicks) return;

            var handleWidth = this.$handle.width();
        	var width = this.$element.width() - handleWidth;
            var fix = handleWidth/2;
            var step = width/(size-1);
            var start = fix;

            this.$ticks.each(function(node, i)
            {
                var $node = $K.dom(node);
                var left = start + step * i;

                $node.css({ 'left': left + 'px', 'width': step + 'px', 'text-indent': '-' + (step-fix) + 'px' });
            });
    	},
    	_handleDown: function(e)
    	{
            e.preventDefault();

            if (this._isDisabled()) return;

            this.$doc.on('mousemove.kube.slider touchmove.kube.slider', this._handleMove.bind(this));
            this.$doc.on('mouseup.kube.slider touchend.kube.slider', this._handleEnd.bind(this));

            var pos = (e.touches && e.touches.length > 0) ? e.changedTouches[0].clientX : e.clientX;
            var trackPos = this.$track.offset().left;
            var setPos = (pos - trackPos - this.fixPosition);

            this._setPosition(setPos);
            this._setTarget();

    	},
    	_handleMove: function(e)
    	{
            e.preventDefault();
            var pos = (e.touches && e.touches.length > 0) ? e.changedTouches[0].clientX : e.clientX;
            var trackPos = this.$track.offset().left;
            var setPos = (pos - trackPos - this.fixPosition);

            this._setPosition(setPos);
            this._setTarget();
        },
    	_handleEnd: function(e)
    	{
            e.preventDefault();
            this.$doc.off('.kube.slider');
        },
    	_setPosition: function(pos)
    	{
        	pos = this._getEdge(pos, 0, this.maxHandlePosition);

            var value = this._getValueFromPosition(pos);
            var newPos = this._getPositionFromValue(value);

            // update ui
            this.$fill.css('width', (newPos + this.fixPosition) + 'px');
            this.$handle.css('left', newPos + 'px');

            // update globals
            this.position = newPos;
            this.value = value;

    	},
    	_setTarget: function()
    	{
        	this.app.broadcast('slider.set',  this, this.value);
            if (this.$target.length === 0) return;

            var tag = this.$target.get().tagName;

            if (tag === 'INPUT' || tag === 'SELECT') this.$target.val(this.value);
            else this.$target.text(this.value);
    	},
        _getPositionFromValue: function(value)
        {
            var percentage = (value - this.params.min)/(this.params.max - this.params.min);
            return pos = (!Number.isNaN(percentage)) ? percentage * this.maxHandlePosition : 0;
        },
        _getValueFromPosition: function(pos)
        {
            var percentage = ((pos) / (this.maxHandlePosition || 1));
            var value = this.params.step * Math.round(percentage * (this.params.max - this.params.min) / this.params.step) + this.params.min;

            return Number((value).toFixed((this.params.step + '').replace('.', '').length - 1));
        },
        _getEdge: function(pos, min, max)
        {
            if (pos < min) return min;
            if (pos > max) return max;

            return pos;
        }
    });
})(Kube);
(function($K)
{
    $K.add('module', 'upload', {
        init: function(app, context)
        {
            this.app = app;
            this.utils = app.utils;
            this.animate = app.animate;
            this.response = app.response;
            this.progress = app.progress;

            // defaults
            var defaults = {
                size: 120, // pixels
                url: false,
                urlRemove: false,
                param: false,
                type: false, // image, file
                multiple: false,
                placeholder: 'Drop files here or click to upload',
                progress: false,
                target: false,
                append: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
            this.$target = context.getTarget();

            // local
            this.statusMap = ['hover', 'error', 'success', 'drop'];

        },
        // public
        start: function()
        {
            this._buildBox();
            this._buildInput();
            this._buildCount();
            this._buildType();
            this._buildPlaceholder();
            this._buildSize();
            this._buildMultiple();
            this._buildItems();
            this._buildEvents();

    	},
    	stop: function()
    	{
        	this.$box.remove();
            this.$element.off('.kube.upload');
    	},

    	// private
    	_buildBox: function()
    	{
            if (this.params.type === 'image')
            {
                this.$box = this.$element.find('.upload-item');
            }
            else
            {
                this.$box = this.$element;
            }
    	},
    	_buildInput: function()
    	{
        	this.$input = $K.dom('<input>');
        	this.$input.attr('type', 'file');
        	this.$input.attr('name', this._getParamName());
        	this.$input.hide();

        	this.$element.before(this.$input);
    	},
    	_buildCount: function()
    	{
        	this.$inputCount = $K.dom('<input>');
        	this.$inputCount.attr('type', 'hidden');
        	this.$inputCount.attr('name', this._getParamName() + '-count');
        	this.$inputCount.val(0);

        	this.$element.before(this.$inputCount);
    	},
    	_buildType: function()
    	{
        	this.isBox = this.$element.hasClass('upload');
    	},
    	_buildPlaceholder: function()
    	{
        	if (this.isBox)
        	{
            	var $placeholder = $K.dom('<span>');
            	$placeholder.addClass('upload-placeholder');
            	$placeholder.html(this.params.placeholder);

            	this.$element.append($placeholder);
        	}
    	},
    	_buildSize: function()
    	{
        	if (this.isBox)
        	{
            	this.$box.css({
                	height: this.params.size + 'px'
                });
            }
            else if (this.params.type === 'image')
            {
                this.$box.css({
                    width: this.params.size + 'px',
                    height: this.params.size + 'px'
                });
            }
    	},
    	_buildMultiple: function()
    	{
            this.isMultiple = this.params.multiple;
            if (this.isMultiple)
            {
                this.$input.attr('multiple', 'true');
            }
    	},
        _buildItems: function()
        {
            if (!this.params.type) return;

            var isFile = (this.params.type === 'file');
            var $target = (isFile) ? this.$target : this.$element;
            var fn = (isFile) ? '_removeFile' : '_removeImage';

            var $closes = $target.find('.close');
            $closes.on('click', this[fn].bind(this));

            if (!isFile)
            {
                $closes.closest('.upload-item').addClass('is-uploaded');
            }

            this.$inputCount.val($closes.length);
        },
        _buildEvents: function()
        {
            this.$input.on('change.redactor.upload', this._change.bind(this));
            this.$box.on('click.redactor.upload', this._click.bind(this));
            this.$box.on('drop.redactor.upload', this._drop.bind(this));
            this.$box.on('dragover.redactor.upload', this._dragover.bind(this));
            this.$box.on('dragleave.redactor.upload', this._dragleave.bind(this));
        },


        // Events
        _click: function(e)
        {
            e.preventDefault();

            var $el = $K.dom(e.target);
            if ($el.hasClass('close')) return;

            this.$input.click();
        },
        _change: function(e)
        {
            this.app.broadcast('upload.start', this);
            this._send(e, this.$input.get().files);
        },
        _drop: function(e)
        {
            e.preventDefault();

            this._clearStatuses();
            this._setStatus('drop');

            this.app.broadcast('upload.start', this);
            this._send(e);
        },
        _dragover: function(e)
        {
            e.preventDefault();
            this._setStatus('hover');

            return false;
        },
        _dragleave: function(e)
        {
            e.preventDefault();
            this._removeStatus('hover');

            return false;
        },

        // Count
        _upCount: function()
        {
            var val = this.$inputCount.val();
            val++;

            this.$inputCount.val(val);
        },
        _downCount: function()
        {
            var val = this.$inputCount.val();
            val--;
            val = (val < 0) ? 0 : val;

            this.$inputCount.val(val);
        },
        _clearCount: function()
        {
            this.$inputCount.val(0);
        },

        // Name
        _getParamName: function()
        {
            return (this.params.param) ? this.params.param : 'file';
        },
        _getHiddenName: function()
        {
            var name = this._getParamName();
            return (this.isMultiple) ? name + '-uploaded[]' : name + '-uploaded';
        },

        // Status
        _clearStatuses: function()
        {
            this.$box.removeClass('is-upload-' + this.statusMap.join(' is-upload-'));
        },
        _setStatus: function(status)
        {
            this.$box.addClass('is-upload-' + status);
        },
        _removeStatus: function(status)
        {
            this.$box.removeClass('is-upload-' + status);
        },


        // Target
        _clearTarget: function()
        {
            var $items = this.$target.find('.upload-item');
            $items.each(function(node)
            {
                var $node = $K.dom(node);
                this._removeFileRequest($node.attr('data-id'));
            }.bind(this));

            this._clearCount();
            this.$target.html('');
        },
        _clearBox: function()
        {
            var $items = this.$target.find('.upload-item');
            $items.each(function(node)
            {
                var $node = $K.dom(node);
                this._removeFileRequest($node.attr('data-id'));
            }.bind(this));

            this._clearCount();
            this.$target.html('');
        },


        // Remove
        _removeFile: function(e)
        {
        	e.preventDefault();

        	var $el = $K.dom(e.target);
        	var $item = $el.closest('.upload-item');
        	var id = $item.attr('data-id');

            this.animate.run($item, 'fadeOut', function()
        	{
            	$item.remove();
            	this._downCount();
                this._removeFileRequest(id);

                // clear target
                if (this.$target.find('.upload-item').length === 0)
                {
                    this.$target.html('');
                }

        	}.bind(this))
        },
        _removeImage: function(e)
        {
        	e.preventDefault();

        	var $el = $K.dom(e.target);
        	var $item = $el.closest('.upload-item');
        	var id = $item.attr('data-id');


        	if (this.isMultiple)
        	{
                this.animate.run($item, 'fadeOut', function()
            	{
                	$item.remove();
                	this._downCount();
                    this._removeFileRequest(id);

            	}.bind(this))
        	}
        	else
        	{
            	var $img = $item.find('img');

            	$el.hide();
                this.animate.run($img, 'fadeOut', function()
            	{
                	this.$box.html('');
                	this.$box.removeClass('is-uploaded');
                	this._clearCount();
                    this._removeFileRequest(id);

            	}.bind(this))
        	}
        },
        _removeFileRequest: function(id)
        {
            if (this.params.urlRemove)
        	{
                $K.ajax.post({
                    url: this.params.urlRemove,
                    data: { id: id }
                });
            }
        },


        // Send
        _send: function(e, files)
        {
            e = e.originalEvent || e;

            files = (files) ? files : e.dataTransfer.files;

            var data = new FormData();
            var name = this._getParamName();

            data = this._buildData(name, files, data);

            if (this.params.append)
            {
			    data = this.utils.extendData(data, this.params.append);
            }

            this._sendData(data, files, e);
        },
        _sendData: function(data, files, e)
        {
            if (this.params.progress) this.progress.show();

            $K.ajax.post({
                url: this.params.url,
                data: data,
                before: function(xhr)
                {
                    return this.app.broadcast('upload.beforeSend', this, xhr);

                }.bind(this),
                success: function(response)
                {
                    this._complete(response, e);
                }.bind(this)
            });
        },
        _buildData: function(name, files, data)
        {
            for (var i = 0; i < files.length; i++)
            {
                data.append(name + '[]', files[i]);
            }

            return data;
        },
        _complete: function (response, e)
        {
            this._clearStatuses();

            if (this.params.progress) this.progress.hide();

            // error
            var json = (Array.isArray(response)) ? response[0] : response;

            if (typeof json.type !== 'undefined' && json.type === 'error')
            {
                this._setStatus('error');
                this.response.parse(response);
                this.app.broadcast('upload.error', this, response);
            }
            // complete
            else
            {
                this._setStatus('success');

                switch (this.params.type)
                {
                    case 'image':
                        this._completeBoxImage(response);
                        break;
                    case 'file':
                        this._completeBoxFile(response);
                        break;
                    default:
                        this._completeBoxUpload(response);
                }

                this.app.broadcast('upload.complete', this, response);
                setTimeout(this._clearStatuses.bind(this), 500);
            }
        },
        _completeBoxUpload: function(response)
        {
            this.response.parse(response);
        },
        _completeBoxImage: function(response)
        {
            for (var key in response)
            {
                // img
                var $img = $K.dom('<img>');
                $img.attr('src', response[key].url);

                // close
                var $close = $K.dom('<span>');
                $close.addClass('close');
                $close.on('click', this._removeImage.bind(this));

                // hidden
                var $hidden = $K.dom('<input>');
                $hidden.attr('type', 'hidden');
                $hidden.attr('name', this._getHiddenName());
                $hidden.val(response[key].id);

                // item
                var $item = $K.dom('<div>');
                $item.addClass('upload-item is-uploaded');
                $item.attr('data-id', response[key].id);

                if (this.isMultiple)
                {
                    // append
                    $item.append($close);
                    $item.append($img);
                    $item.append($hidden);

                    this.$box.last().before($item);
                }
                // single
                else
                {
                    var $lastImg = this.$box.find('img');
                    if ($lastImg.length !== 0)
                    {
                        this._removeFileRequest(this.$box.attr('data-id'));
                    }

                    this.$box.html('');
                    this.$box.attr('data-id', response[key].id);
                    this.$box.append($close);
                    this.$box.append($img);
                    this.$box.append($hidden);

                    return;
                }
            }
        },
        _completeBoxFile: function(response)
        {
            if (!this.isMultiple) this._clearTarget();

            for (var key in response)
            {
                // item
                var $item = $K.dom('<div>');
                $item.addClass('upload-item');
                $item.attr('data-id', response[key].id);

                // file
                var $file = $K.dom('<span>');
                $file.html(response[key].name);

                // close
                var $close = $K.dom('<span>');
                $close.addClass('close');
                $close.on('click', this._removeFile.bind(this));

                // hidden
                var $hidden = $K.dom('<input>');
                $hidden.attr('type', 'hidden');
                $hidden.attr('name', this._getHiddenName());
                $hidden.val(response[key].id);

                // size
                if (typeof response[key].size !== 'undefined')
                {
                    var $size = $K.dom('<em>');
                    $size.html(response[key].size);

                    $file.append($size);
                }

                // append
                $item.append($close);
                $item.append($file);
                $item.append($hidden);

                // target
                this.$target.append($item);
                this._upCount();
            }
        }
    });
})(Kube);
(function($K)
{
    $K.add('module', 'validate', {
        init: function(app, context)
        {
            this.app = app;
            this.$win = app.$win;
            this.progress = app.progress;
            this.response = app.response;

            // defaults
            var defaults = {
                errorClass: 'is-error',
                send: true,
                trigger: false,
                shortcut: false,
                progress: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
        },
        // public
        start: function()
        {
            this._disableDefaultValidation();
    		this._enableShortcut();

    		if (this.params.trigger)
    		{
        		this._startTrigger();
            }
            else
            {
        		this._startSubmit();
            }
    	},
        stop: function()
        {
    		this.enableButtons();
    		this.clear();

    		this.$element.off('.kube.validate');
    		this.$win.off('.kube.validate');

    		if (this.$trigger) this.$trigger.off('.');
        },
    	clear: function()
    	{
    		this.$element.find('.' + this.params.errorClass).each(this._clearError.bind(this));
    	},
    	disableButtons: function()
    	{
    		this.$element.find('button').attr('disabled', true);
    	},
    	enableButtons: function()
    	{
    		this.$element.find('button').removeAttr('disabled');
    	},

        // private
        _build: function(e)
        {
            e.preventDefault();

    		if (this.params.send) this._send();
            else this.app.broadcast('validate.send', this);

            return false;
        },
        _send: function()
        {
    		if (this.params.progress)
    		{
        		this.progress.show();
            }

    		this.disableButtons();
            this._saveCodeMirror();

    		this.app.broadcast('validate.send', this);

    		$K.ajax.post({
    			url: this.$element.attr('action'),
    			data: this.$element.serialize(),
    			success: this._parse.bind(this)
    		});

    		return false;
        },
        _parse: function(data)
        {
    		this.enableButtons();
    		this.clear();

    		if (this.params.progress)
    		{
                this.progress.hide();
    		}

            var json = this.response.parse(data);
            if (!json)
            {
                this.app.broadcast('validate.error', this, json);
            }
    		else if (typeof json.type !== 'undefined' && json.type === 'error')
    		{
    			this._setErrors(json.errors);
    			this.app.broadcast('validate.error', this, json.errors);
    		}
    		else
    		{
    			this.app.broadcast('validate.success', this, json);
    		}
        },
    	_setErrors: function(errors)
    	{
        	for (var name in errors)
        	{
                var text = errors[name];
                var $el = this.$element.find('[name=' + name + ']');
            	if ($el.length !== 0)
                {
        			$el.addClass(this.params.errorClass);
                    this._setFieldEvent($el, name);

        			if (text !== '')
        			{
            			this._showErrorText(name, text);
        			}
    			}
            }
    	},
    	_setFieldEvent: function($el, name)
    	{
        	var eventName = this._getFieldEventName($el);
    		$el.on(eventName + '.kube.validate', function()
    		{
        		this._clearError($el);
    		}.bind(this));
    	},
    	_showErrorText: function(name, text)
    	{
        	var $el = this.$element.find('#' + name + '-validation-error');
        	$el.addClass(this.params.errorClass);
        	$el.html(text);
        	$el.removeClass('is-hidden');
    	},
        _getFieldEventName: function($el)
        {
    		return ($el.get().tagName === 'SELECT' || $el.attr('type') === 'checkbox' || $el.attr('type') === 'radio') ? 'change' : 'keyup';
        },
    	_clearError: function(node)
    	{
        	var $el = $K.dom(node);
            var $errorEl = this.$element.find('#' + $el.attr('name') + '-validation-error');

    		$errorEl.removeClass(this.params.errorClass);
    		$errorEl.html('');
    		$errorEl.addClass('is-hidden');

    		$el.removeClass(this.params.errorClass).off('.kube.validate');
    	},
    	_saveCodeMirror: function()
    	{
            $K.dom('.CodeMirror').each(function(node)
    		{
    			node.CodeMirror.save();
    		});
    	},
    	_disableDefaultValidation: function()
    	{
    		this.$element.attr('novalidate', 'novalidate');
    	},
    	_enableShortcut: function()
    	{
    		if (!this.params.shortcut) return;

        	// ctrl + s or cmd + s
    		this.$win.on('keydown.kube.validate', this._handleShortcut.bind(this));
    	},
    	_handleShortcut: function(e)
    	{
    		if (((e.ctrlKey || e.metaKey) && e.which === 83))
    		{
    			e.preventDefault();
    			return this._send();
    		}

    		return true;
    	},
    	_startTrigger: function()
    	{
        	this.$trigger = $(this.opts.trigger);

    		this.$element.on('submit', function() { return false; });
    		this.$trigger.off('.kube.validate');
    		this.$trigger.on('click.kube.validate', this._build.bind(this));
    	},
    	_startSubmit: function()
    	{
    		this.$element.on('submit.kube.validate', this._build.bind(this));
    	}
    });
})(Kube);
(function($K)
{
    $K.add('module', 'visibility', {
        init: function(app, context)
        {
            this.app = app;
            this.$win = app.$win;

            // defaults
            var defaults = {
                tolerance: 15 // px
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
        },

        // public
        start: function()
        {
            this.$win.on('scroll.kube.visibility resize.kube.visibility', this._check.bind(this));
            this._check();
    	},
    	stop: function()
    	{
            this.$win.off('.kube.visibility');
    	},

    	// private
        _check: function()
        {
            var docViewTop = this.$win.scrollTop();
            var docViewBottom = docViewTop + this.$win.height();
            var elemTop = this.$element.offset().top;
            var elemBottom = elemTop + this.$element.height();

            var check = ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= (docViewBottom + this.params.tolerance)) &&  (elemTop >= docViewTop));
            if (check)
            {
                this.app.broadcast('visibility.visible', this, this.$element);
            }
            else
            {
                this.app.broadcast('visibility.invisible', this, this.$element);
            }
        }
    });
})(Kube);