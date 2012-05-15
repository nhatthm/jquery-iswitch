/**
 * @author  casterx
 * @email   thmnhat@gmail.com
 * @see     http://minhnhat.me/projects/jquery-iswitch
 * @porject jQuery iSwitch
 * @version 0.1
 */
var __switches          = {};
var __skey              = 0;
var __currentlyClicking = null;
var __dragStartPosition = null;
var __handleLeftOffset  = null;
var __dragging          = null;
var __interval          = [];

function iSwitch(el, options) {
    var $el = $(el);

    this.options   = $.extend({}, options);
    this.element   = $el;
    this.rightSide = 0;

    this.control      = $('<div class="iswitch-container"></div>');
    this.labelOn      = $('<div class="iswitch-label iswitch-label-on"><span class="iswitch-label-bg"></span><span class="iswitch-label-text"></span></div>');
    this.labelOff     = $('<div class="iswitch-label iswitch-label-off"><span class="iswitch-label-bg"></span><span class="iswitch-label-text"></span></div>');
    this.labelOnBg    = $('.iswitch-label-bg', this.labelOn);
    this.labelOffBg   = $('.iswitch-label-bg', this.labelOff);
    this.labelOnSpan  = $('.iswitch-label-text', this.labelOn);
    this.labelOffSpan = $('.iswitch-label-text', this.labelOff);
    this.handle       = $('<div class="iswitch-handle"><div class="iswitch-handle-inner"></div></div>');
    this.relatives    = $(':radio').filter(function() { return $(this).attr('name') === $el.attr('name'); });

    this.labelOnMarginMin  = null;
    this.labelOffMarginMin = null;

    this.getOption = function(option) {
        if(option in this.options) {
            return this.options[option];
        }

        return null;
    };

    this.setOption = function(option, value) {
        if(typeof option === 'object') {
            for(var key in option) {
                if (option.hasOwnProperty(key)) {
                    this.setOption(key, option[key]);
                }
            }
        }
        else {
            this.options[option] = value;
        }
    };

    this.removeOption = function(option) {
        delete this.options[option];
    };

    this.isDisabled = function() {
        return this.element.prop('disabled');
    };

    this.isChecked = function() {
        return this.element.prop('checked');
    };

    this.calculateContainerWidth = function() {
        var labelOnWidth  = this.labelOn.width(),
            labelOffWidth = this.labelOff.width(),
            newWidth      = (labelOnWidth > labelOffWidth ? labelOnWidth : labelOffWidth) + this.handle.width() + this.options.handleMargin;

        this.control.css('width', newWidth);

        return newWidth;
    };

    this.getLabelOffMargin = function(margin) {
        return margin < this.labelOffMarginMin ? this.labelOffMarginMin : margin;
    };

    this.getLabelOnMargin = function(margin) {
        return margin < this.labelOnMarginMin ? this.labelOnMarginMin : margin;
    };

    this.initPosition = function() {
        var containerWidth  = this.calculateContainerWidth();
        var offset          = 0;//this.options.containerRadius + 1;
        var containerRadius = this.options.containerRadius;

        if ($.browser.msie && $.browser.version < 7) {
            offset -= 3;
        }

        this.rightSide = containerWidth - this.handle.width() - offset;

        this.labelOnBg.css('left', this.options.containerRadius);
        this.labelOffBg.css('right', this.options.containerRadius);

        if (this.isChecked()) {
            this.handle.css('left', this.rightSide);
            this.labelOn.css('width', this.rightSide + this.options.handleRadius);
            this.labelOnSpan.css('marginLeft', containerRadius);
            this.labelOffSpan.css('marginRight', -this.rightSide);
        }
        else {
            this.labelOn.css('width', 0);
            this.labelOnSpan.css('marginLeft', -this.rightSide);
            this.labelOffSpan.css('marginRight', containerRadius);
        }

        this.labelOff.css('width', containerWidth - this.options.containerRadius);
    };

    this.updateStateClass = function() {
        this.control.removeClass('iswitch-state-checked iswitch-state-unchecked iswitch-state-checked iswitch-state-disabled');

        if(this.isChecked()) {
            this.control.addClass('iswitch-state-checked iswitch-state-checked');
        }
        else {
            this.control.addClass('iswitch-state-checked iswitch-state-unchecked');
        }

        if(this.isDisabled()) {
            this.control.addClass('iswitch-state-checked iswitch-state-disabled');
        }
    };

    this.applyStyle = function() {
        switch(this.options.style) {
            case 'ipad':
                if(this.options.size === 'default') {
                    this.options.handleRadius    = 15;
                    this.options.containerRadius = 11;
                    this.options.handleMargin    = 5;
                }

                break;

            case 'iphone':
                if(this.options.size === 'default') {
                    this.options.handleRadius    = 5;
                    this.options.containerRadius = 7;
                    this.options.handleMargin    = 5;
                }

                break;
        }
    };

    this.applyLabel = function() {
        if(this.options.style === 'ipad') {
            this.options.labelOn  = '&nbsp;&nbsp;&nbsp;I';
            this.options.labelOff = 'O&nbsp;&nbsp;';
        }
    };

    this.onMouseDown = function(e) {
        var x;
        e.preventDefault();

        if (this.isDisabled()) {
            return;
        }

        x = e.pageX || e.originalEvent.changedTouches[0].pageX;

        __currentlyClicking = this.handle;
        __dragStartPosition = x;
        __handleLeftOffset  = parseInt(this.handle.css('left'), 10) || 0;
    };

    this.onDragMove = function(e, x) {
        var newWidth, p;

        if (__currentlyClicking !== this.handle || this.isDisabled()) {
            return;
        }

        p = (x + __handleLeftOffset - __dragStartPosition) / this.rightSide;

        if (p < 0) {
            p = 0;
        }
        else if (p > 1) {
            p = 1;
        }

        newWidth = p * this.rightSide;

        this.handle.css('left', newWidth);
        this.labelOn.css('width', newWidth + this.options.handleRadius);
        this.labelOnSpan.css('marginLeft', ((p - 1) * this.rightSide) + this.options.containerRadius);
        this.labelOffSpan.css('marginRight', -newWidth + this.options.containerRadius);
    };

    this.onDragEnd = function(e, x) {
        var p, checked;

        if (__currentlyClicking !== this.handle || this.isDisabled()) {
            return;
        }

        if (__dragging) {
            p       = (x - __dragStartPosition) / this.rightSide;
            checked = p >= 0.5;
        }
        else {
            checked = !this.isChecked();
        }

        if(checked) {
            this.element.attr('checked', checked);
        }
        else {
            this.element.removeAttr('checked');
        }

        __currentlyClicking = null;
        __dragging = null;

        this.element.trigger('change');
    };

    this.refresh = function() {
        var new_left, containerRadius;

        new_left        = this.isChecked() ? this.rightSide : 0;
        containerRadius = this.options.containerRadius;

        this.handle.animate({left: new_left}, this.options.duration);
        this.labelOn.animate({width: new_left + containerRadius}, this.options.duration);
        this.labelOnSpan.animate({marginLeft: new_left - this.rightSide + containerRadius}, this.options.duration);
        this.labelOffSpan.animate({marginRight: -new_left + containerRadius}, this.options.duration);

        this.updateStateClass();
    };

    this.onChange = function() {
        this.refresh();

        if(this.relatives.length > 1) {
            this.relatives.not(this.element).trigger('refresh');
        }
    };

    this.bindEvents = function() {
        var localMouseMove, localMouseUp, self;
        self = this;

        localMouseMove = function(event) {
            return self.onGlobalMove.apply(self, arguments);
        };

        localMouseUp = function(event) {
            self.onGlobalUp.apply(self, arguments);
            $(document).unbind('.iSwitch');
        };

        this.element
            .unbind('.iSwitch')
            .bind({
                'refresh.iSwitch': function() {
                    self.refresh();
                },
                'change.iSwitch': function() {
                    self.onChange();
                }
            });

        this.control
            .unbind('.iSwitch')
            .bind('mousedown.iSwitch touchstart.iSwitch', function(event) {
                self.onMouseDown.apply(self, arguments);

                $(document).bind('mousemove.iSwitch touchmove.iSwitch', localMouseMove);
                $(document).bind('mouseup.iSwitch touchend.iSwitch', localMouseUp);
            });
    };

    this.onGlobalMove = function(event) {
        var x;

        if (this.isDisabled() || !__currentlyClicking) {
            return;
        }

        event.preventDefault();

        x = event.pageX || event.originalEvent.changedTouches[0].pageX;

        if (!__dragging && (Math.abs(__dragStartPosition - x) > this.dragThreshold)) {
            __dragging = true;
        }

        this.onDragMove(event, x);
    };

    this.onGlobalUp = function(event) {
      var x;

      if (!__currentlyClicking) {
        return;
      }

      event.preventDefault();

      x = event.pageX || event.originalEvent.changedTouches[0].pageX;

      this.onDragEnd(event, x);
    };

    this.applyStyle();
    this.applyLabel();

    this.control
        .append(this.labelOff)
        .append(this.labelOn)
        .append(this.handle)
        .addClass('iswitch-style-' + this.options.style + '-' + this.options.size);

    this.labelOnSpan.html(this.options.labelOn);
    this.labelOffSpan.html(this.options.labelOff);

    $el.after(this.control);
    $el.detach().prependTo(this.control);

    this.initPosition();
    this.updateStateClass();
    this.bindEvents();


    if ($.browser.msie) {
        return $([this.handle, this.labelOnSpan, this.labelOffSpan, this.control]).attr("unselectable", "on");
    }

    return this;
}

function create_iswitch($control, options) {
    $control
        .addClass('iswitch-processed')
        .data('iswitch-key', __skey);

    // Store in stack
    __switches[__skey] = new iSwitch($control, options);
    __skey++;
}

// jQuery plugin
(function($) {
    $.fn.iSwitch = function(options) {
        options = $.extend($.fn.iSwitch.defaults, options);

        // Only apply to checkbox and radio
        return $(this).filter(':checkbox, :radio').each(function() {
            var $control = $(this);
            var key      = null;
            var iswitch  = null;

            if($control.hasClass('iswitch-processed')) {
                // If processed
                key     = $control.data('iswitch-key');
                iswitch = __switches[key];

                // TODO: Check for style, label, etc ....
                iswitch.setOption(options);
            }
            else {
                // Hide the control
                $control.css('visibility', 'hidden');

                // Not yet
                if($control.is(':hidden')) {
                    // we cannot get width of hidden elements, so we need to
                    // do a trick here
                    // Note: Elements with visibility: hidden or opacity: 0 are
                    // considered visible in jQuery
                    key = __interval.length;

                    __interval[key] = setInterval(function() {
                        if($control.is(':visible')) {
                            clearInterval(__interval[key]);
                            create_iswitch($control, options);
                        }
                    }, 1);
                }
                else {
                    create_iswitch($control, options);
                }
            }
        });
    };

    // Default options are modifiable
    $.fn.iSwitch.defaults = {
        labelOn        : 'ON',
        labelOff       : 'OFF',
        uppercase      : false,
        duration       : 200,
        style          : 'iphone',
        size           : 'default',
        dragThreshold  : 5,
        handleMargin   : 7,
        handleRadius   : 15,
        containerRadius: 12
    };
})(jQuery);