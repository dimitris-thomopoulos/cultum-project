var H5P = H5P || {};
/**
 * Transition contains helper function relevant for transitioning
 */
H5P.Transition = (function ($) {

  /**
   * @class
   * @namespace H5P
   */
  Transition = {};

  /**
   * @private
   */
  Transition.transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'transition':       'transitionend',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  /**
   * @private
   */
  Transition.cache = [];

  /**
   * Get the vendor property name for an event
   *
   * @function H5P.Transition.getVendorPropertyName
   * @static
   * @private
   * @param  {string} prop Generic property name
   * @return {string}      Vendor specific property name
   */
  Transition.getVendorPropertyName = function (prop) {

    if (Transition.cache[prop] !== undefined) {
      return Transition.cache[prop];
    }

    var div = document.createElement('div');

    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) {
      Transition.cache[prop] = prop;
    }
    else {
      var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
      var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

      if (prop in div.style) {
        Transition.cache[prop] = prop;
      }
      else {
        for (var i = 0; i < prefixes.length; ++i) {
          var vendorProp = prefixes[i] + prop_;
          if (vendorProp in div.style) {
            Transition.cache[prop] = vendorProp;
            break;
          }
        }
      }
    }

    return Transition.cache[prop];
  };

  /**
   * Get the name of the transition end event
   *
   * @static
   * @private
   * @return {string}  description
   */
  Transition.getTransitionEndEventName = function () {
    return Transition.transitionEndEventNames[Transition.getVendorPropertyName('transition')] || undefined;
  };

  /**
   * Helper function for listening on transition end events
   *
   * @function H5P.Transition.onTransitionEnd
   * @static
   * @param  {domElement} $element The element which is transitioned
   * @param  {function} callback The callback to be invoked when transition is finished
   * @param  {number} timeout  Timeout in milliseconds. Fallback if transition event is never fired
   */
  Transition.onTransitionEnd = function ($element, callback, timeout) {
    // Fallback on 1 second if transition event is not supported/triggered
    timeout = timeout || 1000;
    Transition.transitionEndEventName = Transition.transitionEndEventName || Transition.getTransitionEndEventName();
    var callbackCalled = false;

    var doCallback = function () {
      if (callbackCalled) {
        return;
      }
      $element.off(Transition.transitionEndEventName, callback);
      callbackCalled = true;
      clearTimeout(timer);
      callback();
    };

    var timer = setTimeout(function () {
      doCallback();
    }, timeout);

    $element.on(Transition.transitionEndEventName, function () {
      doCallback();
    });
  };

  /**
   * Wait for a transition - when finished, invokes next in line
   *
   * @private
   *
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   * @param {number}      index                   The index for current transition
   */
  var runSequence = function (transitions, index) {
    if (index >= transitions.length) {
      return;
    }

    var transition = transitions[index];
    H5P.Transition.onTransitionEnd(transition.$element, function () {
      if (transition.end) {
        transition.end();
      }
      if (transition.break !== true) {
        runSequence(transitions, index+1);
      }
    }, transition.timeout || undefined);
  };

  /**
   * Run a sequence of transitions
   *
   * @function H5P.Transition.sequence
   * @static
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   */
  Transition.sequence = function (transitions) {
    runSequence(transitions, 0);
  };

  return Transition;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a help text dialog
 */
H5P.JoubelHelpTextDialog = (function ($) {

  var numInstances = 0;
  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery}  $container  The container which message dialog will be appended to
   * @param {string}      message     The message
   * @param {string}      closeButtonTitle The title for the close button
   * @return {H5P.jQuery}
   */
  function JoubelHelpTextDialog(header, message, closeButtonTitle) {
    H5P.EventDispatcher.call(this);

    var self = this;

    numInstances++;
    var headerId = 'joubel-help-text-header-' + numInstances;
    var helpTextId = 'joubel-help-text-body-' + numInstances;

    var $helpTextDialogBox = $('<div>', {
      'class': 'joubel-help-text-dialog-box',
      'role': 'dialog',
      'aria-labelledby': headerId,
      'aria-describedby': helpTextId
    });

    $('<div>', {
      'class': 'joubel-help-text-dialog-background'
    }).appendTo($helpTextDialogBox);

    var $helpTextDialogContainer = $('<div>', {
      'class': 'joubel-help-text-dialog-container'
    }).appendTo($helpTextDialogBox);

    $('<div>', {
      'class': 'joubel-help-text-header',
      'id': headerId,
      'role': 'header',
      'html': header
    }).appendTo($helpTextDialogContainer);

    $('<div>', {
      'class': 'joubel-help-text-body',
      'id': helpTextId,
      'html': message,
      'role': 'document',
      'tabindex': 0
    }).appendTo($helpTextDialogContainer);

    var handleClose = function () {
      $helpTextDialogBox.remove();
      self.trigger('closed');
    };

    var $closeButton = $('<div>', {
      'class': 'joubel-help-text-remove',
      'role': 'button',
      'title': closeButtonTitle,
      'tabindex': 1,
      'click': handleClose,
      'keydown': function (event) {
        // 32 - space, 13 - enter
        if ([32, 13].indexOf(event.which) !== -1) {
          event.preventDefault();
          handleClose();
        }
      }
    }).appendTo($helpTextDialogContainer);

    /**
     * Get the DOM element
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return $helpTextDialogBox;
    };

    self.focus = function () {
      $closeButton.focus();
    };
  }

  JoubelHelpTextDialog.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelHelpTextDialog.prototype.constructor = JoubelHelpTextDialog;

  return JoubelHelpTextDialog;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating auto-disappearing dialogs
 */
H5P.JoubelMessageDialog = (function ($) {

  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery} $container The container which message dialog will be appended to
   * @param {string} message The message
   * @return {H5P.jQuery}
   */
  function JoubelMessageDialog ($container, message) {
    var timeout;

    var removeDialog = function () {
      $warning.remove();
      clearTimeout(timeout);
      $container.off('click.messageDialog');
    };

    // Create warning popup:
    var $warning = $('<div/>', {
      'class': 'joubel-message-dialog',
      text: message
    }).appendTo($container);

    // Remove after 3 seconds or if user clicks anywhere in $container:
    timeout = setTimeout(removeDialog, 3000);
    $container.on('click.messageDialog', removeDialog);

    return $warning;
  }

  return JoubelMessageDialog;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a circular progress bar
 */

H5P.JoubelProgressCircle = (function ($) {

  /**
   * Constructor for the Progress Circle
   *
   * @param {Number} number The amount of progress to display
   * @param {string} progressColor Color for the progress meter
   * @param {string} backgroundColor Color behind the progress meter
   */
  function ProgressCircle(number, progressColor, fillColor, backgroundColor) {
    progressColor = progressColor || '#1a73d9';
    fillColor = fillColor || '#f0f0f0';
    backgroundColor = backgroundColor || '#ffffff';
    var progressColorRGB = this.hexToRgb(progressColor);

    //Verify number
    try {
      number = Number(number);
      if (number === '') {
        throw 'is empty';
      }
      if (isNaN(number)) {
        throw 'is not a number';
      }
    } catch (e) {
      number = 'err';
    }

    //Draw circle
    if (number > 100) {
      number = 100;
    }

    // We can not use rgba, since they will stack on top of each other.
    // Instead we create the equivalent of the rgba color
    // and applies this to the activeborder and background color.
    var progressColorString = 'rgb(' + parseInt(progressColorRGB.r, 10) +
      ',' + parseInt(progressColorRGB.g, 10) +
      ',' + parseInt(progressColorRGB.b, 10) + ')';

    // Circle wrapper
    var $wrapper = $('<div/>', {
      'class': "joubel-progress-circle-wrapper"
    });

    //Active border indicates progress
    var $activeBorder = $('<div/>', {
      'class': "joubel-progress-circle-active-border"
    }).appendTo($wrapper);

    //Background circle
    var $backgroundCircle = $('<div/>', {
      'class': "joubel-progress-circle-circle"
    }).appendTo($activeBorder);

    //Progress text/number
    $('<span/>', {
      'text': number + '%',
      'class': "joubel-progress-circle-percentage"
    }).appendTo($backgroundCircle);

    var deg = number * 3.6;
    if (deg <= 180) {
      $activeBorder.css('background-image',
        'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, ' + fillColor + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    } else {
      $activeBorder.css('background-image',
        'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, ' + progressColorString + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    }

    this.$activeBorder = $activeBorder;
    this.$backgroundCircle = $backgroundCircle;
    this.$wrapper = $wrapper;

    this.initResizeFunctionality();

    return $wrapper;
  }

  /**
   * Initializes resize functionality for the progress circle
   */
  ProgressCircle.prototype.initResizeFunctionality = function () {
    var self = this;

    $(window).resize(function () {
      // Queue resize
      setTimeout(function () {
        self.resize();
      });
    });

    // First resize
    setTimeout(function () {
      self.resize();
    }, 0);
  };

  /**
   * Resize function makes progress circle grow or shrink relative to parent container
   */
  ProgressCircle.prototype.resize = function () {
    var $parent = this.$wrapper.parent();

    if ($parent !== undefined && $parent) {

      // Measurements
      var fontSize = parseInt($parent.css('font-size'), 10);

      // Static sizes
      var fontSizeMultiplum = 3.75;
      var progressCircleWidthPx = parseInt((fontSize / 4.5), 10) % 2 === 0 ? parseInt((fontSize / 4.5), 10) + 4 : parseInt((fontSize / 4.5), 10) + 5;
      var progressCircleOffset = progressCircleWidthPx / 2;

      var width = fontSize * fontSizeMultiplum;
      var height = fontSize * fontSizeMultiplum;
      this.$activeBorder.css({
        'width': width,
        'height': height
      });

      this.$backgroundCircle.css({
        'width': width - progressCircleWidthPx,
        'height': height - progressCircleWidthPx,
        'top': progressCircleOffset,
        'left': progressCircleOffset
      });
    }
  };

  /**
   * Hex to RGB conversion
   * @param hex
   * @returns {{r: Number, g: Number, b: Number}}
   */
  ProgressCircle.prototype.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return ProgressCircle;

}(H5P.jQuery));
;
var H5P = H5P || {};

H5P.SimpleRoundedButton = (function ($) {

  /**
   * Creates a new tip
   */
  function SimpleRoundedButton(text) {

    var $simpleRoundedButton = $('<div>', {
      'class': 'joubel-simple-rounded-button',
      'title': text,
      'role': 'button',
      'tabindex': '0'
    }).keydown(function (e) {
      // 32 - space, 13 - enter
      if ([32, 13].indexOf(e.which) !== -1) {
        $(this).click();
        e.preventDefault();
      }
    });

    $('<span>', {
      'class': 'joubel-simple-rounded-button-text',
      'html': text
    }).appendTo($simpleRoundedButton);

    return $simpleRoundedButton;
  }

  return SimpleRoundedButton;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating speech bubbles
 */
H5P.JoubelSpeechBubble = (function ($) {

  var $currentSpeechBubble;
  var $currentContainer;  
  var $tail;
  var $innerTail;
  var removeSpeechBubbleTimeout;
  var currentMaxWidth;

  var DEFAULT_MAX_WIDTH = 400;

  var iDevice = navigator.userAgent.match(/iPod|iPhone|iPad/g) ? true : false;

  /**
   * Creates a new speech bubble
   *
   * @param {H5P.jQuery} $container The speaking object
   * @param {string} text The text to display
   * @param {number} maxWidth The maximum width of the bubble
   * @return {H5P.JoubelSpeechBubble}
   */
  function JoubelSpeechBubble($container, text, maxWidth) {
    maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    currentMaxWidth = maxWidth;
    $currentContainer = $container;

    this.isCurrent = function ($tip) {
      return $tip.is($currentContainer);
    };

    this.remove = function () {
      remove();
    };

    var fadeOutSpeechBubble = function ($speechBubble) {
      if (!$speechBubble) {
        return;
      }

      // Stop removing bubble
      clearTimeout(removeSpeechBubbleTimeout);

      $speechBubble.removeClass('show');
      setTimeout(function () {
        if ($speechBubble) {
          $speechBubble.remove();
          $speechBubble = undefined;
        }
      }, 500);
    };

    if ($currentSpeechBubble !== undefined) {
      remove();
    }

    var $h5pContainer = getH5PContainer($container);

    // Make sure we fade out old speech bubble
    fadeOutSpeechBubble($currentSpeechBubble);

    // Create bubble
    $tail = $('<div class="joubel-speech-bubble-tail"></div>');
    $innerTail = $('<div class="joubel-speech-bubble-inner-tail"></div>');
    var $innerBubble = $(
      '<div class="joubel-speech-bubble-inner">' +
      '<div class="joubel-speech-bubble-text">' + text + '</div>' +
      '</div>'
    ).prepend($innerTail);

    $currentSpeechBubble = $(
      '<div class="joubel-speech-bubble" aria-live="assertive">'
    ).append([$tail, $innerBubble])
      .appendTo($h5pContainer);

    // Show speech bubble with transition
    setTimeout(function () {
      $currentSpeechBubble.addClass('show');
    }, 0);

    position($currentSpeechBubble, $currentContainer, maxWidth, $tail, $innerTail);

    // Handle click to close
    H5P.$body.on('mousedown.speechBubble', handleOutsideClick);

    // Handle window resizing
    H5P.$window.on('resize', '', handleResize);

    // Handle clicks when inside IV which blocks bubbling.
    $container.parents('.h5p-dialog')
      .on('mousedown.speechBubble', handleOutsideClick);

    if (iDevice) {
      H5P.$body.css('cursor', 'pointer');
    }

    return this;
  }

  // Remove speechbubble if it belongs to a dom element that is about to be hidden
  H5P.externalDispatcher.on('domHidden', function (event) {
    if ($currentSpeechBubble !== undefined && event.data.$dom.find($currentContainer).length !== 0) {
      remove();
    }
  });

  /**
   * Returns the closest h5p container for the given DOM element.
   * 
   * @param {object} $container jquery element
   * @return {object} the h5p container (jquery element)
   */
  function getH5PContainer($container) {
    var $h5pContainer = $container.closest('.h5p-frame');

    // Check closest h5p frame first, then check for container in case there is no frame.
    if (!$h5pContainer.length) {
      $h5pContainer = $container.closest('.h5p-container');
    }

    return $h5pContainer;
  }

  /**
   * Event handler that is called when the window is resized.
   */
  function handleResize() {
    position($currentSpeechBubble, $currentContainer, currentMaxWidth, $tail, $innerTail);
  }

  /**
   * Repositions the speech bubble according to the position of the container.
   * 
   * @param {object} $currentSpeechbubble the speech bubble that should be positioned   
   * @param {object} $container the container to which the speech bubble should point 
   * @param {number} maxWidth the maximum width of the speech bubble
   * @param {object} $tail the tail (the triangle that points to the referenced container)
   * @param {object} $innerTail the inner tail (the triangle that points to the referenced container)
   */
  function position($currentSpeechBubble, $container, maxWidth, $tail, $innerTail) {
    var $h5pContainer = getH5PContainer($container);

    // Calculate offset between the button and the h5p frame
    var offset = getOffsetBetween($h5pContainer, $container);

    var direction = (offset.bottom > offset.top ? 'bottom' : 'top');
    var tipWidth = offset.outerWidth * 0.9; // Var needs to be renamed to make sense
    var bubbleWidth = tipWidth > maxWidth ? maxWidth : tipWidth;

    var bubblePosition = getBubblePosition(bubbleWidth, offset);
    var tailPosition = getTailPosition(bubbleWidth, bubblePosition, offset, $container.width());
    // Need to set font-size, since element is appended to body.
    // Using same font-size as parent. In that way it will grow accordingly
    // when resizing
    var fontSize = 16;//parseFloat($parent.css('font-size'));

    // Set width and position of speech bubble
    $currentSpeechBubble.css(bubbleCSS(
      direction,
      bubbleWidth,
      bubblePosition,
      fontSize
    ));

    var preparedTailCSS = tailCSS(direction, tailPosition);
    $tail.css(preparedTailCSS);
    $innerTail.css(preparedTailCSS);
  }

  /**
   * Static function for removing the speechbubble
   */
  var remove = function () {
    H5P.$body.off('mousedown.speechBubble');
    H5P.$window.off('resize', '', handleResize);
    $currentContainer.parents('.h5p-dialog').off('mousedown.speechBubble');
    if (iDevice) {
      H5P.$body.css('cursor', '');
    }
    if ($currentSpeechBubble !== undefined) {
      // Apply transition, then remove speech bubble
      $currentSpeechBubble.removeClass('show');

      // Make sure we remove any old timeout before reassignment
      clearTimeout(removeSpeechBubbleTimeout);
      removeSpeechBubbleTimeout = setTimeout(function () {
        $currentSpeechBubble.remove();
        $currentSpeechBubble = undefined;
      }, 500);
    }
    // Don't return false here. If the user e.g. clicks a button when the bubble is visible,
    // we want the bubble to disapear AND the button to receive the event
  };

  /**
   * Remove the speech bubble and container reference
   */
  function handleOutsideClick(event) {
    if (event.target === $currentContainer[0]) {
      return; // Button clicks are not outside clicks
    }

    remove();
    // There is no current container when a container isn't clicked
    $currentContainer = undefined;
  }

  /**
   * Calculate position for speech bubble
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} offset
   * @return {object} Return position for the speech bubble
   */
  function getBubblePosition(bubbleWidth, offset) {
    var bubblePosition = {};

    var tailOffset = 9;
    var widthOffset = bubbleWidth / 2;

    // Calculate top position
    bubblePosition.top = offset.top + offset.innerHeight;

    // Calculate bottom position
    bubblePosition.bottom = offset.bottom + offset.innerHeight + tailOffset;

    // Calculate left position
    if (offset.left < widthOffset) {
      bubblePosition.left = 3;
    }
    else if ((offset.left + widthOffset) > offset.outerWidth) {
      bubblePosition.left = offset.outerWidth - bubbleWidth - 3;
    }
    else {
      bubblePosition.left = offset.left - widthOffset + (offset.innerWidth / 2);
    }

    return bubblePosition;
  }

  /**
   * Calculate position for speech bubble tail
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} bubblePosition Speech bubble position
   * @param {object} offset
   * @param {number} iconWidth The width of the tip icon
   * @return {object} Return position for the tail
   */
  function getTailPosition(bubbleWidth, bubblePosition, offset, iconWidth) {
    var tailPosition = {};
    // Magic numbers. Tuned by hand so that the tail fits visually within
    // the bounds of the speech bubble.
    var leftBoundary = 9;
    var rightBoundary = bubbleWidth - 20;

    tailPosition.left = offset.left - bubblePosition.left + (iconWidth / 2) - 6;
    if (tailPosition.left < leftBoundary) {
      tailPosition.left = leftBoundary;
    }
    if (tailPosition.left > rightBoundary) {
      tailPosition.left = rightBoundary;
    }

    tailPosition.top = -6;
    tailPosition.bottom = -6;

    return tailPosition;
  }

  /**
   * Return bubble CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {number} width The width of the speech bubble
   * @param {object} position Speech bubble position
   * @param {number} fontSize The size of the bubbles font
   * @return {object} Return CSS
   */
  function bubbleCSS(direction, width, position, fontSize) {
    if (direction === 'top') {
      return {
        width: width + 'px',
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        top: ''
      };
    }
    else {
      return {
        width: width + 'px',
        top: position.top + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Return tail CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {object} position Tail position
   * @return {object} Return CSS
   */
  function tailCSS(direction, position) {
    if (direction === 'top') {
      return {
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        top: ''
      };
    }
    else {
      return {
        top: position.top + 'px',
        left: position.left + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Calculates the offset between an element inside a container and the
   * container. Only works if all the edges of the inner element are inside the
   * outer element.
   * Width/height of the elements is included as a convenience.
   *
   * @param {H5P.jQuery} $outer
   * @param {H5P.jQuery} $inner
   * @return {object} Position offset
   */
  function getOffsetBetween($outer, $inner) {
    var outer = $outer[0].getBoundingClientRect();
    var inner = $inner[0].getBoundingClientRect();

    return {
      top: inner.top - outer.top,
      right: outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
      left: inner.left - outer.left,
      innerWidth: inner.width,
      innerHeight: inner.height,
      outerWidth: outer.width,
      outerHeight: outer.height
    };
  }

  return JoubelSpeechBubble;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelThrobber = (function ($) {

  /**
   * Creates a new tip
   */
  function JoubelThrobber() {

    // h5p-throbber css is described in core
    var $throbber = $('<div/>', {
      'class': 'h5p-throbber'
    });

    return $throbber;
  }

  return JoubelThrobber;
}(H5P.jQuery));
;
H5P.JoubelTip = (function ($) {
  var $conv = $('<div/>');

  /**
   * Creates a new tip element.
   *
   * NOTE that this may look like a class but it doesn't behave like one.
   * It returns a jQuery object.
   *
   * @param {string} tipHtml The text to display in the popup
   * @param {Object} [behaviour] Options
   * @param {string} [behaviour.tipLabel] Set to use a custom label for the tip button (you want this for good A11Y)
   * @param {boolean} [behaviour.helpIcon] Set to 'true' to Add help-icon classname to Tip button (changes the icon)
   * @param {boolean} [behaviour.showSpeechBubble] Set to 'false' to disable functionality (you may this in the editor)
   * @param {boolean} [behaviour.tabcontrol] Set to 'true' if you plan on controlling the tabindex in the parent (tabindex="-1")
   * @return {H5P.jQuery|undefined} Tip button jQuery element or 'undefined' if invalid tip
   */
  function JoubelTip(tipHtml, behaviour) {

    // Keep track of the popup that appears when you click the Tip button
    var speechBubble;

    // Parse tip html to determine text
    var tipText = $conv.html(tipHtml).text().trim();
    if (tipText === '') {
      return; // The tip has no textual content, i.e. it's invalid.
    }

    // Set default behaviour
    behaviour = $.extend({
      tipLabel: tipText,
      helpIcon: false,
      showSpeechBubble: true,
      tabcontrol: false
    }, behaviour);

    // Create Tip button
    var $tipButton = $('<div/>', {
      class: 'joubel-tip-container' + (behaviour.showSpeechBubble ? '' : ' be-quiet'),
      'aria-label': behaviour.tipLabel,
      'aria-expanded': false,
      role: 'button',
      tabindex: (behaviour.tabcontrol ? -1 : 0),
      click: function (event) {
        // Toggle show/hide popup
        toggleSpeechBubble();
        event.preventDefault();
      },
      keydown: function (event) {
        if (event.which === 32 || event.which === 13) { // Space & enter key
          // Toggle show/hide popup
          toggleSpeechBubble();
          event.stopPropagation();
          event.preventDefault();
        }
        else { // Any other key
          // Toggle hide popup
          toggleSpeechBubble(false);
        }
      },
      // Add markup to render icon
      html: '<span class="joubel-icon-tip-normal ' + (behaviour.helpIcon ? ' help-icon': '') + '">' +
              '<span class="h5p-icon-shadow"></span>' +
              '<span class="h5p-icon-speech-bubble"></span>' +
              '<span class="h5p-icon-info"></span>' +
            '</span>'
      // IMPORTANT: All of the markup elements must have 'pointer-events: none;'
    });

    const $tipAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'polite',
      appendTo: $tipButton,
    });

    /**
     * Tip button interaction handler.
     * Toggle show or hide the speech bubble popup when interacting with the
     * Tip button.
     *
     * @private
     * @param {boolean} [force] 'true' shows and 'false' hides.
     */
    var toggleSpeechBubble = function (force) {
      if (speechBubble !== undefined && speechBubble.isCurrent($tipButton)) {
        // Hide current popup
        speechBubble.remove();
        speechBubble = undefined;

        $tipButton.attr('aria-expanded', false);
        $tipAnnouncer.html('');
      }
      else if (force !== false && behaviour.showSpeechBubble) {
        // Create and show new popup
        speechBubble = H5P.JoubelSpeechBubble($tipButton, tipHtml);
        $tipButton.attr('aria-expanded', true);
        $tipAnnouncer.html(tipHtml);
      }
    };

    return $tipButton;
  }

  return JoubelTip;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelSlider = (function ($) {

  /**
   * Creates a new Slider
   *
   * @param {object} [params] Additional parameters
   */
  function JoubelSlider(params) {
    H5P.EventDispatcher.call(this);

    this.$slider = $('<div>', $.extend({
      'class': 'h5p-joubel-ui-slider'
    }, params));

    this.$slides = [];
    this.currentIndex = 0;
    this.numSlides = 0;
  }
  JoubelSlider.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelSlider.prototype.constructor = JoubelSlider;

  JoubelSlider.prototype.addSlide = function ($content) {
    $content.addClass('h5p-joubel-ui-slide').css({
      'left': (this.numSlides*100) + '%'
    });
    this.$slider.append($content);
    this.$slides.push($content);

    this.numSlides++;

    if(this.numSlides === 1) {
      $content.addClass('current');
    }
  };

  JoubelSlider.prototype.attach = function ($container) {
    $container.append(this.$slider);
  };

  JoubelSlider.prototype.move = function (index) {
    var self = this;

    if(index === 0) {
      self.trigger('first-slide');
    }
    if(index+1 === self.numSlides) {
      self.trigger('last-slide');
    }
    self.trigger('move');

    var $previousSlide = self.$slides[this.currentIndex];
    H5P.Transition.onTransitionEnd(this.$slider, function () {
      $previousSlide.removeClass('current');
      self.trigger('moved');
    });
    this.$slides[index].addClass('current');

    var translateX = 'translateX(' + (-index*100) + '%)';
    this.$slider.css({
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      'transform': translateX
    });

    this.currentIndex = index;
  };

  JoubelSlider.prototype.remove = function () {
    this.$slider.remove();
  };

  JoubelSlider.prototype.next = function () {
    if(this.currentIndex+1 >= this.numSlides) {
      return;
    }

    this.move(this.currentIndex+1);
  };

  JoubelSlider.prototype.previous = function () {
    this.move(this.currentIndex-1);
  };

  JoubelSlider.prototype.first = function () {
    this.move(0);
  };

  JoubelSlider.prototype.last = function () {
    this.move(this.numSlides-1);
  };

  return JoubelSlider;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * @module
 */
H5P.JoubelScoreBar = (function ($) {

  /* Need to use an id for the star SVG since that is the only way to reference
     SVG filters  */
  var idCounter = 0;

  /**
   * Creates a score bar
   * @class H5P.JoubelScoreBar
   * @param {number} maxScore  Maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @param {string} [helpText] Score explanation
   * @param {string} [scoreExplanationButtonLabel] Label for score explanation button
   */
  function JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel) {
    var self = this;

    self.maxScore = maxScore;
    self.score = 0;
    idCounter++;

    /**
     * @const {string}
     */
    self.STAR_MARKUP = '<svg tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.77 53.87" aria-hidden="true" focusable="false">' +
        '<title>star</title>' +
        '<filter tabindex="-1" id="h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + '" x0="-50%" y0="-50%" width="200%" height="200%">' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"></feGaussianBlur>' +
          '<feOffset dy="2" dx="4"></feOffset>' +
          '<feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="SourceGraphic" operator="over" result="firstfilter"></feComposite>' +
          '<feGaussianBlur in="firstfilter" stdDeviation="3" result="blur2"></feGaussianBlur>' +
          '<feOffset dy="-2" dx="-4"></feOffset>' +
          '<feComposite in2="firstfilter" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="firstfilter" operator="over"></feComposite>' +
        '</filter>' +
        '<path tabindex="-1" class="h5p-joubelui-score-bar-star-shadow" d="M35.08,43.41V9.16H20.91v0L9.51,10.85,9,10.93C2.8,12.18,0,17,0,21.25a11.22,11.22,0,0,0,3,7.48l8.73,8.53-1.07,6.16Z"/>' +
        '<g tabindex="-1">' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-border" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-fill" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" filter="url(#h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + ')" class="h5p-joubelui-score-bar-star-fill-full-score" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
        '</g>' +
      '</svg>';

    /**
     * @function appendTo
     * @memberOf H5P.JoubelScoreBar#
     * @param {H5P.jQuery}  $wrapper  Dom container
     */
    self.appendTo = function ($wrapper) {
      self.$scoreBar.appendTo($wrapper);
    };

    /**
     * Create the text representation of the scorebar .
     *
     * @private
     * @return {string}
     */
    var createLabel = function (score) {
      if (!label) {
        return '';
      }

      return label.replace(':num', score).replace(':total', self.maxScore);
    };

    /**
     * Creates the html for this widget
     *
     * @method createHtml
     * @private
     */
    var createHtml = function () {
      // Container div
      self.$scoreBar = $('<div>', {
        'class': 'h5p-joubelui-score-bar',
      });

      var $visuals = $('<div>', {
        'class': 'h5p-joubelui-score-bar-visuals',
        appendTo: self.$scoreBar
      });

      // The progress bar wrapper
      self.$progressWrapper = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress-wrapper',
        appendTo: $visuals
      });

      self.$progress = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress',
        'html': createLabel(self.score),
        appendTo: self.$progressWrapper
      });

      // The star
      $('<div>', {
        'class': 'h5p-joubelui-score-bar-star',
        html: self.STAR_MARKUP
      }).appendTo($visuals);

      // The score container
      var $numerics = $('<div>', {
        'class': 'h5p-joubelui-score-numeric',
        appendTo: self.$scoreBar,
        'aria-hidden': true
      });

      // The current score
      self.$scoreCounter = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-number-counter',
        text: 0,
        appendTo: $numerics
      });

      // The separator
      $('<span>', {
        'class': 'h5p-joubelui-score-number-separator',
        text: '/',
        appendTo: $numerics
      });

      // Max score
      self.$maxScore = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-max',
        text: self.maxScore,
        appendTo: $numerics
      });

      if (helpText) {
        H5P.JoubelUI.createTip(helpText, {
          tipLabel: scoreExplanationButtonLabel ? scoreExplanationButtonLabel : helpText,
          helpIcon: true
        }).appendTo(self.$scoreBar);
        self.$scoreBar.addClass('h5p-score-bar-has-help');
      }
    };

    /**
     * Set the current score
     * @method setScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number} score
     */
    self.setScore = function (score) {
      // Do nothing if score hasn't changed
      if (score === self.score) {
        return;
      }
      self.score = score > self.maxScore ? self.maxScore : score;
      self.updateVisuals();
    };

    /**
     * Increment score
     * @method incrementScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number=}        incrementBy Optional parameter, defaults to 1
     */
    self.incrementScore = function (incrementBy) {
      self.setScore(self.score + (incrementBy || 1));
    };

    /**
     * Set the max score
     * @method setMaxScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number}    maxScore The max score
     */
    self.setMaxScore = function (maxScore) {
      self.maxScore = maxScore;
    };

    /**
     * Updates the progressbar visuals
     * @memberOf H5P.JoubelScoreBar#
     * @method updateVisuals
     */
    self.updateVisuals = function () {
      self.$progress.html(createLabel(self.score));
      self.$scoreCounter.text(self.score);
      self.$maxScore.text(self.maxScore);

      setTimeout(function () {
        // Start the progressbar animation
        self.$progress.css({
          width: ((self.score / self.maxScore) * 100) + '%'
        });

        H5P.Transition.onTransitionEnd(self.$progress, function () {
          // If fullscore fill the star and start the animation
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-full-score', self.score === self.maxScore);
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-animation-active', self.score === self.maxScore);

          // Only allow the star animation to run once
          self.$scoreBar.one("animationend", function() {
            self.$scoreBar.removeClass("h5p-joubelui-score-bar-animation-active");
          });
        }, 600);
      }, 300);
    };

    /**
     * Removes all classes
     * @method reset
     */
    self.reset = function () {
      self.$scoreBar.removeClass('h5p-joubelui-score-bar-full-score');
    };

    createHtml();
  }

  return JoubelScoreBar;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelProgressbar = (function ($) {

  /**
   * Joubel progressbar class
   * @method JoubelProgressbar
   * @constructor
   * @param  {number}          steps Number of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   */
  function JoubelProgressbar(steps, options) {
    H5P.EventDispatcher.call(this);
    var self = this;
    this.options = $.extend({
      progressText: 'Slide :num of :total'
    }, options);
    this.currentStep = 0;
    this.steps = steps;

    this.$progressbar = $('<div>', {
      'class': 'h5p-joubelui-progressbar'
    });
    this.$background = $('<div>', {
      'class': 'h5p-joubelui-progressbar-background'
    }).appendTo(this.$progressbar);
  }

  JoubelProgressbar.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelProgressbar.prototype.constructor = JoubelProgressbar;

  JoubelProgressbar.prototype.updateAria = function () {
    var self = this;
    if (this.options.disableAria) {
      return;
    }

    if (!this.$currentStatus) {
      this.$currentStatus = $('<div>', {
        'class': 'h5p-joubelui-progressbar-slide-status-text',
        'aria-live': 'assertive'
      }).appendTo(this.$progressbar);
    }
    var interpolatedProgressText = self.options.progressText
      .replace(':num', self.currentStep)
      .replace(':total', self.steps);
    this.$currentStatus.html(interpolatedProgressText);
  };

  /**
   * Appends to a container
   * @method appendTo
   * @param  {H5P.jquery} $container
   */
  JoubelProgressbar.prototype.appendTo = function ($container) {
    this.$progressbar.appendTo($container);
  };

  /**
   * Update progress
   * @method setProgress
   * @param  {number}    step
   */
  JoubelProgressbar.prototype.setProgress = function (step) {
    // Check for valid value:
    if (step > this.steps || step < 0) {
      return;
    }
    this.currentStep = step;
    this.$background.css({
      width: ((this.currentStep/this.steps)*100) + '%'
    });

    this.updateAria();
  };

  /**
   * Increment progress with 1
   * @method next
   */
  JoubelProgressbar.prototype.next = function () {
    this.setProgress(this.currentStep+1);
  };

  /**
   * Reset progressbar
   * @method reset
   */
  JoubelProgressbar.prototype.reset = function () {
    this.setProgress(0);
  };

  /**
   * Check if last step is reached
   * @method isLastStep
   * @return {Boolean}
   */
  JoubelProgressbar.prototype.isLastStep = function () {
    return this.steps === this.currentStep;
  };

  return JoubelProgressbar;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * H5P Joubel UI library.
 *
 * This is a utility library, which does not implement attach. I.e, it has to bee actively used by
 * other libraries
 * @module
 */
H5P.JoubelUI = (function ($) {

  /**
   * The internal object to return
   * @class H5P.JoubelUI
   * @static
   */
  function JoubelUI() {}

  /* Public static functions */

  /**
   * Create a tip icon
   * @method H5P.JoubelUI.createTip
   * @param  {string}  text   The textual tip
   * @param  {Object}  params Parameters
   * @return {H5P.JoubelTip}
   */
  JoubelUI.createTip = function (text, params) {
    return new H5P.JoubelTip(text, params);
  };

  /**
   * Create message dialog
   * @method H5P.JoubelUI.createMessageDialog
   * @param  {H5P.jQuery}               $container The dom container
   * @param  {string}                   message    The message
   * @return {H5P.JoubelMessageDialog}
   */
  JoubelUI.createMessageDialog = function ($container, message) {
    return new H5P.JoubelMessageDialog($container, message);
  };

  /**
   * Create help text dialog
   * @method H5P.JoubelUI.createHelpTextDialog
   * @param  {string}             header  The textual header
   * @param  {string}             message The textual message
   * @param  {string}             closeButtonTitle The title for the close button
   * @return {H5P.JoubelHelpTextDialog}
   */
  JoubelUI.createHelpTextDialog = function (header, message, closeButtonTitle) {
    return new H5P.JoubelHelpTextDialog(header, message, closeButtonTitle);
  };

  /**
   * Create progress circle
   * @method H5P.JoubelUI.createProgressCircle
   * @param  {number}             number          The progress (0 to 100)
   * @param  {string}             progressColor   The progress color in hex value
   * @param  {string}             fillColor       The fill color in hex value
   * @param  {string}             backgroundColor The background color in hex value
   * @return {H5P.JoubelProgressCircle}
   */
  JoubelUI.createProgressCircle = function (number, progressColor, fillColor, backgroundColor) {
    return new H5P.JoubelProgressCircle(number, progressColor, fillColor, backgroundColor);
  };

  /**
   * Create throbber for loading
   * @method H5P.JoubelUI.createThrobber
   * @return {H5P.JoubelThrobber}
   */
  JoubelUI.createThrobber = function () {
    return new H5P.JoubelThrobber();
  };

  /**
   * Create simple rounded button
   * @method H5P.JoubelUI.createSimpleRoundedButton
   * @param  {string}                  text The button label
   * @return {H5P.SimpleRoundedButton}
   */
  JoubelUI.createSimpleRoundedButton = function (text) {
    return new H5P.SimpleRoundedButton(text);
  };

  /**
   * Create Slider
   * @method H5P.JoubelUI.createSlider
   * @param  {Object} [params] Parameters
   * @return {H5P.JoubelSlider}
   */
  JoubelUI.createSlider = function (params) {
    return new H5P.JoubelSlider(params);
  };

  /**
   * Create Score Bar
   * @method H5P.JoubelUI.createScoreBar
   * @param  {number=}       maxScore The maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @return {H5P.JoubelScoreBar}
   */
  JoubelUI.createScoreBar = function (maxScore, label, helpText, scoreExplanationButtonLabel) {
    return new H5P.JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel);
  };

  /**
   * Create Progressbar
   * @method H5P.JoubelUI.createProgressbar
   * @param  {number=}       numSteps The total numer of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   * @return {H5P.JoubelProgressbar}
   */
  JoubelUI.createProgressbar = function (numSteps, options) {
    return new H5P.JoubelProgressbar(numSteps, options);
  };

  /**
   * Create standard Joubel button
   *
   * @method H5P.JoubelUI.createButton
   * @param {object} params
   *  May hold any properties allowed by jQuery. If href is set, an A tag
   *  is used, if not a button tag is used.
   * @return {H5P.jQuery} The jquery element created
   */
  JoubelUI.createButton = function(params) {
    var type = 'button';
    if (params.href) {
      type = 'a';
    }
    else {
      params.type = 'button';
    }
    if (params.class) {
      params.class += ' h5p-joubelui-button';
    }
    else {
      params.class = 'h5p-joubelui-button';
    }
    return $('<' + type + '/>', params);
  };

  /**
   * Fix for iframe scoll bug in IOS. When focusing an element that doesn't have
   * focus support by default the iframe will scroll the parent frame so that
   * the focused element is out of view. This varies dependening on the elements
   * of the parent frame.
   */
  if (H5P.isFramed && !H5P.hasiOSiframeScrollFix &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    H5P.hasiOSiframeScrollFix = true;

    // Keep track of original focus function
    var focus = HTMLElement.prototype.focus;

    // Override the original focus
    HTMLElement.prototype.focus = function () {
      // Only focus the element if it supports it natively
      if ( (this instanceof HTMLAnchorElement ||
            this instanceof HTMLInputElement ||
            this instanceof HTMLSelectElement ||
            this instanceof HTMLTextAreaElement ||
            this instanceof HTMLButtonElement ||
            this instanceof HTMLIFrameElement ||
            this instanceof HTMLAreaElement) && // HTMLAreaElement isn't supported by Safari yet.
          !this.getAttribute('role')) { // Focus breaks if a different role has been set
          // In theory this.isContentEditable should be able to recieve focus,
          // but it didn't work when tested.

        // Trigger the original focus with the proper context
        focus.call(this);
      }
    };
  }

  return JoubelUI;
})(H5P.jQuery);
;
H5P.Tooltip = H5P.Tooltip || function() {};

H5P.Question = (function ($, EventDispatcher, JoubelUI) {

  /**
   * Extending this class make it alot easier to create tasks for other
   * content types.
   *
   * @class H5P.Question
   * @extends H5P.EventDispatcher
   * @param {string} type
   */
  function Question(type) {
    var self = this;

    // Inheritance
    EventDispatcher.call(self);

    // Register default section order
    self.order = ['video', 'image', 'audio', 'introduction', 'content', 'explanation', 'feedback', 'scorebar', 'buttons', 'read'];

    // Keep track of registered sections
    var sections = {};

    // Buttons
    var buttons = {};
    var buttonOrder = [];

    // Wrapper when attached
    var $wrapper;

    // Click element
    var clickElement;

    // ScoreBar
    var scoreBar;

    // Keep track of the feedback's visual status.
    var showFeedback;

    // Keep track of which buttons are scheduled for hiding.
    var buttonsToHide = [];

    // Keep track of which buttons are scheduled for showing.
    var buttonsToShow = [];

    // Keep track of the hiding and showing of buttons.
    var toggleButtonsTimer;
    var toggleButtonsTransitionTimer;
    var buttonTruncationTimer;

    // Keeps track of initialization of question
    var initialized = false;

    /**
     * @type {Object} behaviour Behaviour of Question
     * @property {Boolean} behaviour.disableFeedback Set to true to disable feedback section
     */
    var behaviour = {
      disableFeedback: false,
      disableReadSpeaker: false
    };

    // Keeps track of thumb state
    var imageThumb = true;

    // Keeps track of image transitions
    var imageTransitionTimer;

    // Keep track of whether sections is transitioning.
    var sectionsIsTransitioning = false;

    // Keep track of auto play state
    var disableAutoPlay = false;

    // Feedback transition timer
    var feedbackTransitionTimer;

    // Used when reading messages to the user
    var $read, readText;

    /**
     * Register section with given content.
     *
     * @private
     * @param {string} section ID of the section
     * @param {(string|H5P.jQuery)} [content]
     */
    var register = function (section, content) {
      sections[section] = {};
      var $e = sections[section].$element = $('<div/>', {
        'class': 'h5p-question-' + section,
      });
      if (content) {
        $e[content instanceof $ ? 'append' : 'html'](content);
      }
    };

    /**
     * Update registered section with content.
     *
     * @private
     * @param {string} section ID of the section
     * @param {(string|H5P.jQuery)} content
     */
    var update = function (section, content) {
      if (content instanceof $) {
        sections[section].$element.html('').append(content);
      }
      else {
        sections[section].$element.html(content);
      }
    };

    /**
     * Insert element with given ID into the DOM.
     *
     * @private
     * @param {array|Array|string[]} order
     * List with ordered element IDs
     * @param {string} id
     * ID of the element to be inserted
     * @param {Object} elements
     * Maps ID to the elements
     * @param {H5P.jQuery} $container
     * Parent container of the elements
     */
    var insert = function (order, id, elements, $container) {
      // Try to find an element id should be after
      for (var i = 0; i < order.length; i++) {
        if (order[i] === id) {
          // Found our pos
          while (i > 0 &&
          (elements[order[i - 1]] === undefined ||
          !elements[order[i - 1]].isVisible)) {
            i--;
          }
          if (i === 0) {
            // We are on top.
            elements[id].$element.prependTo($container);
          }
          else {
            // Add after element
            elements[id].$element.insertAfter(elements[order[i - 1]].$element);
          }
          elements[id].isVisible = true;
          break;
        }
      }
    };

    /**
     * Make feedback into a popup and position relative to click.
     *
     * @private
     * @param {string} [closeText] Text for the close button
     */
    var makeFeedbackPopup = function (closeText) {
      var $element = sections.feedback.$element;
      var $parent = sections.content.$element;
      var $click = (clickElement != null ? clickElement.$element : null);

      $element.appendTo($parent).addClass('h5p-question-popup');

      if (sections.scorebar) {
        sections.scorebar.$element.appendTo($element);
      }

      $parent.addClass('h5p-has-question-popup');

      // Draw the tail
      var $tail = $('<div/>', {
        'class': 'h5p-question-feedback-tail'
      }).hide()
        .appendTo($parent);

      // Draw the close button
      var $close = $('<div/>', {
        'class': 'h5p-question-feedback-close',
        'tabindex': 0,
        'title': closeText,
        on: {
          click: function (event) {
            $element.remove();
            $tail.remove();
            event.preventDefault();
          },
          keydown: function (event) {
            switch (event.which) {
              case 13: // Enter
              case 32: // Space
                $element.remove();
                $tail.remove();
                event.preventDefault();
            }
          }
        }
      }).hide().appendTo($element);

      if ($click != null) {
        if ($click.hasClass('correct')) {
          $element.addClass('h5p-question-feedback-correct');
          $close.show();
          sections.buttons.$element.hide();
        }
        else {
          sections.buttons.$element.appendTo(sections.feedback.$element);
        }
      }

      positionFeedbackPopup($element, $click);
    };

    /**
     * Position the feedback popup.
     *
     * @private
     * @param {H5P.jQuery} $element Feedback div
     * @param {H5P.jQuery} $click Visual click div
     */
    var positionFeedbackPopup = function ($element, $click) {
      var $container = $element.parent();
      var $tail = $element.siblings('.h5p-question-feedback-tail');
      var popupWidth = $element.outerWidth();
      var popupHeight = setElementHeight($element);
      var space = 15;
      var disableTail = false;
      var positionY = $container.height() / 2 - popupHeight / 2;
      var positionX = $container.width() / 2 - popupWidth / 2;
      var tailX = 0;
      var tailY = 0;
      var tailRotation = 0;

      if ($click != null) {
        // Edge detection for click, takes space into account
        var clickNearTop = ($click[0].offsetTop < space);
        var clickNearBottom = ($click[0].offsetTop + $click.height() > $container.height() - space);
        var clickNearLeft = ($click[0].offsetLeft < space);
        var clickNearRight = ($click[0].offsetLeft + $click.width() > $container.width() - space);

        // Click is not in a corner or close to edge, calculate position normally
        positionX = $click[0].offsetLeft - popupWidth / 2  + $click.width() / 2;
        positionY = $click[0].offsetTop - popupHeight - space;
        tailX = positionX + popupWidth / 2 - $tail.width() / 2;
        tailY = positionY + popupHeight - ($tail.height() / 2);
        tailRotation = 225;

        // If popup is outside top edge, position under click instead
        if (popupHeight + space > $click[0].offsetTop) {
          positionY = $click[0].offsetTop + $click.height() + space;
          tailY = positionY - $tail.height() / 2 ;
          tailRotation = 45;
        }

        // If popup is outside left edge, position left
        if (positionX < 0) {
          positionX = 0;
        }

        // If popup is outside right edge, position right
        if (positionX + popupWidth > $container.width()) {
          positionX = $container.width() - popupWidth;
        }

        // Special cases such as corner clicks, or close to an edge, they override X and Y positions if met
        if (clickNearTop && (clickNearLeft || clickNearRight)) {
          positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() : -popupWidth);
          positionY = $click[0].offsetTop + $click.height();
          disableTail = true;
        }
        else if (clickNearBottom && (clickNearLeft || clickNearRight)) {
          positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() : -popupWidth);
          positionY = $click[0].offsetTop - popupHeight;
          disableTail = true;
        }
        else if (!clickNearTop && !clickNearBottom) {
          if (clickNearLeft || clickNearRight) {
            positionY = $click[0].offsetTop - popupHeight / 2 + $click.width() / 2;
            positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() + space : -popupWidth + -space);
            // Make sure this does not position the popup off screen
            if (positionX < 0) {
              positionX = 0;
              disableTail = true;
            }
            else {
              tailX = positionX + (clickNearLeft ? - $tail.width() / 2 : popupWidth - $tail.width() / 2);
              tailY = positionY + popupHeight / 2 - $tail.height() / 2;
              tailRotation = (clickNearLeft ? 315 : 135);
            }
          }
        }

        // Contain popup from overflowing bottom edge
        if (positionY + popupHeight > $container.height()) {
          positionY = $container.height() - popupHeight;

          if (popupHeight > $container.height() - ($click[0].offsetTop + $click.height() + space)) {
            disableTail = true;
          }
        }
      }
      else {
        disableTail = true;
      }

      // Contain popup from ovreflowing top edge
      if (positionY < 0) {
        positionY = 0;
      }

      $element.css({top: positionY, left: positionX});
      $tail.css({top: tailY, left: tailX});

      if (!disableTail) {
        $tail.css({
          'left': tailX,
          'top': tailY,
          'transform': 'rotate(' + tailRotation + 'deg)'
        }).show();
      }
      else {
        $tail.hide();
      }
    };

    /**
     * Set element max height, used for animations.
     *
     * @param {H5P.jQuery} $element
     */
    var setElementHeight = function ($element) {
      if (!$element.is(':visible')) {
        // No animation
        $element.css('max-height', 'none');
        return;
      }

      // If this element is shown in the popup, we can't set width to 100%,
      // since it already has a width set in CSS
      var isFeedbackPopup = $element.hasClass('h5p-question-popup');

      // Get natural element height
      var $tmp = $element.clone()
        .css({
          'position': 'absolute',
          'max-height': 'none',
          'width': isFeedbackPopup ? '' : '100%'
        })
        .appendTo($element.parent());

      // Need to take margins into account when calculating available space
      var sideMargins = parseFloat($element.css('margin-left'))
        + parseFloat($element.css('margin-right'));
      var tmpElWidth = $tmp.css('width') ? $tmp.css('width') : '100%';
      $tmp.css('width', 'calc(' + tmpElWidth + ' - ' + sideMargins + 'px)');

      // Apply height to element
      var h = Math.round($tmp.get(0).getBoundingClientRect().height);
      var fontSize = parseFloat($element.css('fontSize'));
      var relativeH = h / fontSize;
      $element.css('max-height', relativeH + 'em');
      $tmp.remove();

      if (h > 0 && sections.buttons && sections.buttons.$element === $element) {
        // Make sure buttons section is visible
        showSection(sections.buttons);

        // Resize buttons after resizing button section
        setTimeout(resizeButtons, 150);
      }
      return h;
    };

    /**
     * Does the actual job of hiding the buttons scheduled for hiding.
     *
     * @private
     * @param {boolean} [relocateFocus] Find a new button to focus
     */
    var hideButtons = function (relocateFocus) {
      for (var i = 0; i < buttonsToHide.length; i++) {
        hideButton(buttonsToHide[i].id);
      }
      buttonsToHide = [];

      if (relocateFocus) {
        self.focusButton();
      }
    };

    /**
     * Does the actual hiding.
     * @private
     * @param {string} buttonId
     */
    var hideButton = function (buttonId) {
      // Using detach() vs hide() makes it harder to cheat.
      buttons[buttonId].$element.detach();
      buttons[buttonId].isVisible = false;
    };

    /**
     * Shows the buttons on the next tick. This is to avoid buttons flickering
     * If they're both added and removed on the same tick.
     *
     * @private
     */
    var toggleButtons = function () {
      // If no buttons section, return
      if (sections.buttons === undefined) {
        return;
      }

      // Clear transition timer, reevaluate if buttons will be detached
      clearTimeout(toggleButtonsTransitionTimer);

      // Show buttons
      for (var i = 0; i < buttonsToShow.length; i++) {
        insert(buttonOrder, buttonsToShow[i].id, buttons, sections.buttons.$element);
        buttons[buttonsToShow[i].id].isVisible = true;
      }
      buttonsToShow = [];

      // Hide buttons
      var numToHide = 0;
      var relocateFocus = false;
      for (var j = 0; j < buttonsToHide.length; j++) {
        var button = buttons[buttonsToHide[j].id];
        if (button.isVisible) {
          numToHide += 1;
        }
        if (button.$element.is(':focus')) {
          // Move focus to the first visible button.
          relocateFocus = true;
        }
      }

      var animationTimer = 150;
      if (sections.feedback && sections.feedback.$element.hasClass('h5p-question-popup')) {
        animationTimer = 0;
      }

      if (numToHide === sections.buttons.$element.children().length) {
        // All buttons are going to be hidden. Hide container using transition.
        hideSection(sections.buttons);
        // Detach buttons
        hideButtons(relocateFocus);
      }
      else {
        hideButtons(relocateFocus);

        // Show button section
        if (!sections.buttons.$element.is(':empty')) {
          showSection(sections.buttons);
          setElementHeight(sections.buttons.$element);

          // Trigger resize after animation
          toggleButtonsTransitionTimer = setTimeout(function () {
            self.trigger('resize');
          }, animationTimer);
        }

        // Resize buttons to fit container
        resizeButtons();
      }

      toggleButtonsTimer = undefined;
    };

    /**
     * Allows for scaling of the question image.
     */
    var scaleImage = function () {
      var $imgSection = sections.image.$element;
      clearTimeout(imageTransitionTimer);

      // Add this here to avoid initial transition of the image making
      // content overflow. Alternatively we need to trigger a resize.
      $imgSection.addClass('animatable');

      if (imageThumb) {

        // Expand image
        $(this).attr('aria-expanded', true);
        $imgSection.addClass('h5p-question-image-fill-width');
        imageThumb = false;

        imageTransitionTimer = setTimeout(function () {
          self.trigger('resize');
        }, 600);
      }
      else {

        // Scale down image
        $(this).attr('aria-expanded', false);
        $imgSection.removeClass('h5p-question-image-fill-width');
        imageThumb = true;

        imageTransitionTimer = setTimeout(function () {
          self.trigger('resize');
        }, 600);
      }
    };

    /**
     * Get scrollable ancestor of element
     *
     * @private
     * @param {H5P.jQuery} $element
     * @param {Number} [currDepth=0] Current recursive calls to ancestor, stop at maxDepth
     * @param {Number} [maxDepth=5] Maximum depth for finding ancestor.
     * @returns {H5P.jQuery} Parent element that is scrollable
     */
    var findScrollableAncestor = function ($element, currDepth, maxDepth) {
      if (!currDepth) {
        currDepth = 0;
      }
      if (!maxDepth) {
        maxDepth = 5;
      }
      // Check validation of element or if we have reached document root
      if (!$element || !($element instanceof $) || document === $element.get(0) || currDepth >= maxDepth) {
        return;
      }

      if ($element.css('overflow-y') === 'auto') {
        return $element;
      }
      else {
        return findScrollableAncestor($element.parent(), currDepth + 1, maxDepth);
      }
    };

    /**
     * Scroll to bottom of Question.
     *
     * @private
     */
    var scrollToBottom = function () {
      if (!$wrapper || ($wrapper.hasClass('h5p-standalone') && !H5P.isFullscreen)) {
        return; // No scroll
      }

      var scrollableAncestor = findScrollableAncestor($wrapper);

      // Scroll to bottom of scrollable ancestor
      if (scrollableAncestor) {
        scrollableAncestor.animate({
          scrollTop: $wrapper.css('height')
        }, "slow");
      }
    };

    /**
     * Resize buttons to fit container width
     *
     * @private
     */
    var resizeButtons = function () {
      if (!buttons || !sections.buttons) {
        return;
      }

      var go = function () {
        // Don't do anything if button elements are not visible yet
        if (!sections.buttons.$element.is(':visible')) {
          return;
        }

        // Width of all buttons
        var buttonsWidth = {
          max: 0,
          min: 0,
          current: 0
        };

        for (var i in buttons) {
          var button = buttons[i];
          if (button.isVisible) {
            setButtonWidth(buttons[i]);
            buttonsWidth.max += button.width.max;
            buttonsWidth.min += button.width.min;
            buttonsWidth.current += button.isTruncated ? button.width.min : button.width.max;
          }
        }

        var makeButtonsFit = function (availableWidth) {
          if (buttonsWidth.max < availableWidth) {
            // It is room for everyone on the right side of the score bar (without truncating)
            if (buttonsWidth.max !== buttonsWidth.current) {
              // Need to make everyone big
              restoreButtonLabels(buttonsWidth.current, availableWidth);
            }
            return true;
          }
          else if (buttonsWidth.min < availableWidth) {
            // Is it room for everyone on the right side of the score bar with truncating?
            if (buttonsWidth.current > availableWidth) {
              removeButtonLabels(buttonsWidth.current, availableWidth);
            }
            else {
              restoreButtonLabels(buttonsWidth.current, availableWidth);
            }
            return true;
          }
          return false;
        };

        toggleFullWidthScorebar(false);

        var buttonSectionWidth = Math.floor(sections.buttons.$element.width()) - 1;

        if (!makeButtonsFit(buttonSectionWidth)) {
          // If we get here we need to wrap:
          toggleFullWidthScorebar(true);
          buttonSectionWidth = Math.floor(sections.buttons.$element.width()) - 1;
          makeButtonsFit(buttonSectionWidth);
        }
      };

      // If visible, resize right away
      if (sections.buttons.$element.is(':visible')) {
        go();
      }
      else { // If not visible, try on the next tick
        // Clear button truncation timer if within a button truncation function
        if (buttonTruncationTimer) {
          clearTimeout(buttonTruncationTimer);
        }
        buttonTruncationTimer = setTimeout(function () {
          buttonTruncationTimer = undefined;
          go();
        }, 0);
      }
    };

    var toggleFullWidthScorebar = function (enabled) {
      if (sections.scorebar &&
          sections.scorebar.$element &&
          sections.scorebar.$element.hasClass('h5p-question-visible')) {
        sections.buttons.$element.addClass('has-scorebar');
        sections.buttons.$element.toggleClass('wrap', enabled);
        sections.scorebar.$element.toggleClass('full-width', enabled);
      }
      else {
        sections.buttons.$element.removeClass('has-scorebar');
      }
    };

    /**
     * Remove button labels until they use less than max width.
     *
     * @private
     * @param {Number} buttonsWidth Total width of all buttons
     * @param {Number} maxButtonsWidth Max width allowed for buttons
     */
    var removeButtonLabels = function (buttonsWidth, maxButtonsWidth) {
      // Reverse traversal
      for (var i = buttonOrder.length - 1; i >= 0; i--) {
        var buttonId = buttonOrder[i];
        var button = buttons[buttonId];
        if (!button.isTruncated && button.isVisible) {
          var $button = button.$element;
          buttonsWidth -= button.width.max - button.width.min;
          // Set tooltip (needed by H5P.Tooltip)
          let buttonText = $button.text();
          $button.attr('data-tooltip', buttonText);

          // Use button text as aria label if a specific one isn't provided
          if (!button.ariaLabel) {
            $button.attr('aria-label', buttonText);
          }
          // Remove label
          $button.html('').addClass('truncated');
          button.isTruncated = true;
          if (buttonsWidth <= maxButtonsWidth) {
            // Buttons are small enough.
            return;
          }
        }
      }
    };

    /**
     * Restore button labels until it fills maximum possible width without exceeding the max width.
     *
     * @private
     * @param {Number} buttonsWidth Total width of all buttons
     * @param {Number} maxButtonsWidth Max width allowed for buttons
     */
    var restoreButtonLabels = function (buttonsWidth, maxButtonsWidth) {
      for (var i = 0; i < buttonOrder.length; i++) {
        var buttonId = buttonOrder[i];
        var button = buttons[buttonId];
        if (button.isTruncated && button.isVisible) {
          // Calculate new total width of buttons with a static pixel for consistency cross-browser
          buttonsWidth += button.width.max - button.width.min + 1;

          if (buttonsWidth > maxButtonsWidth) {
            return;
          }
          // Restore label
          button.$element.html(button.text);

          // Remove tooltip (used by H5P.Tooltip)
          button.$element.removeAttr('data-tooltip');

          // Remove aria-label if a specific one isn't provided
          if (!button.ariaLabel) {
            button.$element.removeAttr('aria-label');
          }

          button.$element.removeClass('truncated');
          button.isTruncated = false;
        }
      }
    };

    /**
     * Helper function for finding index of keyValue in array
     *
     * @param {String} keyValue Value to be found
     * @param {String} key In key
     * @param {Array} array In array
     * @returns {number}
     */
    var existsInArray = function (keyValue, key, array) {
      var i;
      for (i = 0; i < array.length; i++) {
        if (array[i][key] === keyValue) {
          return i;
        }
      }
      return -1;
    };

    /**
     * Show a section
     * @param {Object} section
     */
    var showSection = function (section) {
      section.$element.addClass('h5p-question-visible');
      section.isVisible = true;
    };

    /**
     * Hide a section
     * @param {Object} section
     */
    var hideSection = function (section) {
      section.$element.css('max-height', '');
      section.isVisible = false;

      setTimeout(function () {
        // Only hide if section hasn't been set to visible in the meantime
        if (!section.isVisible) {
          section.$element.removeClass('h5p-question-visible');
        }
      }, 150);
    };

    /**
     * Set behaviour for question.
     *
     * @param {Object} options An object containing behaviour that will be extended by Question
     */
    self.setBehaviour = function (options) {
      $.extend(behaviour, options);
    };

    /**
     * A video to display above the task.
     *
     * @param {object} params
     */
    self.setVideo = function (params) {
      sections.video = {
        $element: $('<div/>', {
          'class': 'h5p-question-video'
        })
      };

      if (disableAutoPlay && params.params.playback) {
        params.params.playback.autoplay = false;
      }

      // Never fit to wrapper
      if (!params.params.visuals) {
        params.params.visuals = {};
      }
      params.params.visuals.fit = false;
      sections.video.instance = H5P.newRunnable(params, self.contentId, sections.video.$element, true);
      var fromVideo = false; // Hack to avoid never ending loop
      sections.video.instance.on('resize', function () {
        fromVideo = true;
        self.trigger('resize');
        fromVideo = false;
      });
      self.on('resize', function () {
        if (!fromVideo) {
          sections.video.instance.trigger('resize');
        }
      });

      return self;
    };

    /**
     * An audio player to display above the task.
     *
     * @param {object} params
     */
    self.setAudio = function (params) {
      params.params = params.params || {};

      sections.audio = {
        $element: $('<div/>', {
          'class': 'h5p-question-audio',
        })
      };

      if (disableAutoPlay) {
        params.params.autoplay = false;
      }
      else if (params.params.playerMode === 'transparent') {
        params.params.autoplay = true; // false doesn't make sense for transparent audio
      }

      sections.audio.instance = H5P.newRunnable(params, self.contentId, sections.audio.$element, true);
      // The height value that is set by H5P.Audio is counter-productive here.
      if (sections.audio.instance.audio) {
        sections.audio.instance.audio.style.height = '';
      }

      return self;
    };

    /**
     * Will stop any playback going on in the task.
     */
    self.pause = function () {
      if (sections.video && sections.video.isVisible) {
        sections.video.instance.pause();
      }
      if (sections.audio && sections.audio.isVisible) {
        sections.audio.instance.pause();
      }
    };

    /**
     * Start playback of video
     */
    self.play = function () {
      if (sections.video && sections.video.isVisible) {
        sections.video.instance.play();
      }
      if (sections.audio && sections.audio.isVisible) {
        sections.audio.instance.play();
      }
    };

    /**
     * Disable auto play, useful in editors.
     */
    self.disableAutoPlay = function () {
      disableAutoPlay = true;
    };

    /**
     * Process HTML escaped string for use as attribute value,
     * e.g. for alt text or title attributes.
     *
     * @param {string} value
     * @return {string} WARNING! Do NOT use for innerHTML.
     */
    self.massageAttributeOutput = function (value) {
      const dparser = new DOMParser().parseFromString(value, 'text/html');
      const div = document.createElement('div');
      div.innerHTML = dparser.documentElement.textContent;;
      return div.textContent || div.innerText || '';
    };

    /**
     * Add task image.
     *
     * @param {string} path Relative
     * @param {Object} [options] Options object
     * @param {string} [options.alt] Text representation
     * @param {string} [options.title] Hover text
     * @param {Boolean} [options.disableImageZooming] Set as true to disable image zooming
     * @param {string} [options.expandImage] Localization strings
     * @param {string} [options.minimizeImage] Localization string

     */
    self.setImage = function (path, options) {
      options = options ? options : {};
      sections.image = {};
      // Image container
      sections.image.$element = $('<div/>', {
        'class': 'h5p-question-image h5p-question-image-fill-width'
      });

      // Inner wrap
      var $imgWrap = $('<div/>', {
        'class': 'h5p-question-image-wrap',
        appendTo: sections.image.$element
      });

      // Image element
      var $img = $('<img/>', {
        src: H5P.getPath(path, self.contentId),
        alt: (options.alt === undefined ? '' : self.massageAttributeOutput(options.alt)),
        title: (options.title === undefined ? '' : self.massageAttributeOutput(options.title)),
        on: {
          load: function () {
            self.trigger('imageLoaded', this);
            self.trigger('resize');
          }
        },
        appendTo: $imgWrap
      });

      // Disable image zooming
      if (options.disableImageZooming) {
        $img.css('maxHeight', 'none');

        // Make sure we are using the correct amount of width at all times
        var determineImgWidth = function () {

          // Remove margins if natural image width is bigger than section width
          var imageSectionWidth = sections.image.$element.get(0).getBoundingClientRect().width;

          // Do not transition, for instant measurements
          $imgWrap.css({
            '-webkit-transition': 'none',
            'transition': 'none'
          });

          // Margin as translateX on both sides of image.
          var diffX = 2 * ($imgWrap.get(0).getBoundingClientRect().left -
            sections.image.$element.get(0).getBoundingClientRect().left);

          if ($img.get(0).naturalWidth >= imageSectionWidth - diffX) {
            sections.image.$element.addClass('h5p-question-image-fill-width');
          }
          else { // Use margin for small res images
            sections.image.$element.removeClass('h5p-question-image-fill-width');
          }

          // Reset transition rules
          $imgWrap.css({
            '-webkit-transition': '',
            'transition': ''
          });
        };

        // Determine image width
        if ($img.is(':visible')) {
          determineImgWidth();
        }
        else {
          $img.on('load', determineImgWidth);
        }

        // Skip adding zoom functionality
        return;
      }

      const setAriaLabel = () => {
        const ariaLabel = $imgWrap.attr('aria-expanded') === 'true'
          ? options.minimizeImage 
          : options.expandImage;
          
          $imgWrap.attr('aria-label', `${ariaLabel} ${options.alt}`);
        };

      var sizeDetermined = false;
      var determineSize = function () {
        if (sizeDetermined || !$img.is(':visible')) {
          return; // Try again next time.
        }

        $imgWrap.addClass('h5p-question-image-scalable')
          .attr('aria-expanded', false)
          .attr('role', 'button')
          .attr('tabIndex', '0')
          .on('click', function (event) {
            if (event.which === 1) {
              scaleImage.apply(this); // Left mouse button click
              setAriaLabel();
            }
          }).on('keypress', function (event) {
            if (event.which === 32) {
              event.preventDefault(); // Prevent default behaviour; page scroll down
              scaleImage.apply(this); // Space bar pressed
              setAriaLabel();
            }
          });

        setAriaLabel();

        sections.image.$element.removeClass('h5p-question-image-fill-width');

        sizeDetermined  = true; // Prevent any futher events
      };

      self.on('resize', determineSize);

      return self;
    };

    /**
     * Add the introduction section.
     *
     * @param {(string|H5P.jQuery)} content
     */
    self.setIntroduction = function (content) {
      register('introduction', content);

      return self;
    };

    /**
     * Add the content section.
     *
     * @param {(string|H5P.jQuery)} content
     * @param {Object} [options]
     * @param {string} [options.class]
     */
    self.setContent = function (content, options) {
      register('content', content);

      if (options && options.class) {
        sections.content.$element.addClass(options.class);
      }

      return self;
    };

    /**
     * Force readspeaker to read text. Useful when you have to use
     * setTimeout for animations.
     */
    self.read = function (content) {
      if (!$read) {
        return; // Not ready yet
      }

      if (readText) {
        // Combine texts if called multiple times
        readText += (readText.substr(-1, 1) === '.' ? ' ' : '. ') + content;
      }
      else {
        readText = content;
      }

      // Set text
      $read.html(readText);

      setTimeout(function () {
        // Stop combining when done reading
        readText = null;
        $read.html('');
      }, 100);
    };

    /**
     * Read feedback
     */
    self.readFeedback = function () {
      var invalidFeedback =
        behaviour.disableReadSpeaker ||
        !showFeedback ||
        !sections.feedback ||
        !sections.feedback.$element;

      if (invalidFeedback) {
        return;
      }

      var $feedbackText = $('.h5p-question-feedback-content-text', sections.feedback.$element);
      if ($feedbackText && $feedbackText.html() && $feedbackText.html().length) {
        self.read($feedbackText.html());
      }
    };

    /**
     * Remove feedback
     *
     * @return {H5P.Question}
     */
    self.removeFeedback = function () {

      clearTimeout(feedbackTransitionTimer);

      if (sections.feedback && showFeedback) {

        showFeedback = false;

        // Hide feedback & scorebar
        hideSection(sections.scorebar);
        hideSection(sections.feedback);

        sectionsIsTransitioning = true;

        // Detach after transition
        feedbackTransitionTimer = setTimeout(function () {
          // Avoiding Transition.onTransitionEnd since it will register multiple events, and there's no way to cancel it if the transition changes back to "show" while the animation is happening.
          if (!showFeedback) {
            sections.feedback.$element.children().detach();
            sections.scorebar.$element.children().detach();

            // Trigger resize after animation
            self.trigger('resize');
          }
          sectionsIsTransitioning = false;
          scoreBar.setScore(0);
        }, 150);

        if ($wrapper) {
          $wrapper.find('.h5p-question-feedback-tail').remove();
        }
      }

      return self;
    };

    /**
     * Set feedback message.
     *
     * @param {string} [content]
     * @param {number} score The score
     * @param {number} maxScore The maximum score for this question
     * @param {string} [scoreBarLabel] Makes it easier for readspeakers to identify the scorebar
     * @param {string} [helpText] Help text that describes the score inside a tip icon
     * @param {object} [popupSettings] Extra settings for popup feedback
     * @param {boolean} [popupSettings.showAsPopup] Should the feedback display as popup?
     * @param {string} [popupSettings.closeText] Translation for close button text
     * @param {object} [popupSettings.click] Element representing where user clicked on screen
     */
    self.setFeedback = function (content, score, maxScore, scoreBarLabel, helpText, popupSettings, scoreExplanationButtonLabel) {
      // Feedback is disabled
      if (behaviour.disableFeedback) {
        return self;
      }

      // Need to toggle buttons right away to avoid flickering/blinking
      // Note: This means content types should invoke hide/showButton before setFeedback
      toggleButtons();

      clickElement = (popupSettings != null && popupSettings.click != null ? popupSettings.click : null);
      clearTimeout(feedbackTransitionTimer);

      var $feedback = $('<div>', {
        'class': 'h5p-question-feedback-container'
      });

      var $feedbackContent = $('<div>', {
        'class': 'h5p-question-feedback-content'
      }).appendTo($feedback);

      // Feedback text
      $('<div>', {
        'class': 'h5p-question-feedback-content-text',
        'html': content
      }).appendTo($feedbackContent);

      var $scorebar = $('<div>', {
        'class': 'h5p-question-scorebar-container'
      });
      if (scoreBar === undefined) {
        scoreBar = JoubelUI.createScoreBar(maxScore, scoreBarLabel, helpText, scoreExplanationButtonLabel);
      }
      scoreBar.appendTo($scorebar);

      $feedbackContent.toggleClass('has-content', content !== undefined && content.length > 0);

      // Feedback for readspeakers
      if (!behaviour.disableReadSpeaker && scoreBarLabel) {
        self.read(scoreBarLabel.replace(':num', score).replace(':total', maxScore) + '. ' + (content ? content : ''));
      }

      showFeedback = true;
      if (sections.feedback) {
        // Update section
        update('feedback', $feedback);
        update('scorebar', $scorebar);
      }
      else {
        // Create section
        register('feedback', $feedback);
        register('scorebar', $scorebar);
        if (initialized && $wrapper) {
          insert(self.order, 'feedback', sections, $wrapper);
          insert(self.order, 'scorebar', sections, $wrapper);
        }
      }

      showSection(sections.feedback);
      showSection(sections.scorebar);

      resizeButtons();

      if (popupSettings != null && popupSettings.showAsPopup == true) {
        makeFeedbackPopup(popupSettings.closeText);
        scoreBar.setScore(score);
      }
      else {
        // Show feedback section
        feedbackTransitionTimer = setTimeout(function () {
          setElementHeight(sections.feedback.$element);
          setElementHeight(sections.scorebar.$element);
          sectionsIsTransitioning = true;

          // Scroll to bottom after showing feedback
          scrollToBottom();

          // Trigger resize after animation
          feedbackTransitionTimer = setTimeout(function () {
            sectionsIsTransitioning = false;
            self.trigger('resize');
            scoreBar.setScore(score);
          }, 150);
        }, 0);
      }

      return self;
    };

    /**
     * Set feedback content (no animation).
     *
     * @param {string} content
     * @param {boolean} [extendContent] True will extend content, instead of replacing it
     */
    self.updateFeedbackContent = function (content, extendContent) {
      if (sections.feedback && sections.feedback.$element) {

        if (extendContent) {
          content = $('.h5p-question-feedback-content', sections.feedback.$element).html() + ' ' + content;
        }

        // Update feedback content html
        $('.h5p-question-feedback-content', sections.feedback.$element).html(content).addClass('has-content');

        // Make sure the height is correct
        setElementHeight(sections.feedback.$element);

        // Need to trigger resize when feedback has finished transitioning
        setTimeout(self.trigger.bind(self, 'resize'), 150);
      }

      return self;
    };

    /**
     * Set the content of the explanation / feedback panel
     *
     * @param {Object} data
     * @param {string} data.correct
     * @param {string} data.wrong
     * @param {string} data.text
     * @param {string} title Title for explanation panel
     *
     * @return {H5P.Question}
     */
    self.setExplanation = function (data, title) {
      if (data) {
        var explainer = new H5P.Question.Explainer(title, data);

        if (sections.explanation) {
          // Update section
          update('explanation', explainer.getElement());
        }
        else {
          register('explanation', explainer.getElement());

          if (initialized && $wrapper) {
            insert(self.order, 'explanation', sections, $wrapper);
          }
        }
      }
      else if (sections.explanation) {
        // Hide explanation section
        sections.explanation.$element.children().detach();
      }

      return self;
    };

    /**
     * Checks to see if button is registered.
     *
     * @param {string} id
     * @returns {boolean}
     */
    self.hasButton = function (id) {
      return (buttons[id] !== undefined);
    };

    /**
     * @typedef {Object} ConfirmationDialog
     * @property {boolean} [enable] Must be true to show confirmation dialog
     * @property {Object} [instance] Instance that uses confirmation dialog
     * @property {jQuery} [$parentElement] Append to this element.
     * @property {Object} [l10n] Translatable fields
     * @property {string} [l10n.header] Header text
     * @property {string} [l10n.body] Body text
     * @property {string} [l10n.cancelLabel]
     * @property {string} [l10n.confirmLabel]
     */

    /**
     * Register buttons for the task.
     *
     * @param {string} id
     * @param {string} text label
     * @param {function} clicked
     * @param {boolean} [visible=true]
     * @param {Object} [options] Options for button
     * @param {Object} [extras] Extra options
     * @param {ConfirmationDialog} [extras.confirmationDialog] Confirmation dialog
     * @param {Object} [extras.contentData] Content data
     * @params {string} [extras.textIfSubmitting] Text to display if submitting
     */
    self.addButton = function (id, text, clicked, visible, options, extras) {
      if (buttons[id]) {
        return self; // Already registered
      }

      if (sections.buttons === undefined)  {
        // We have buttons, register wrapper
        register('buttons');
        if (initialized) {
          insert(self.order, 'buttons', sections, $wrapper);
        }
      }

      extras = extras || {};
      extras.confirmationDialog = extras.confirmationDialog || {};
      options = options || {};

      var confirmationDialog =
        self.addConfirmationDialogToButton(extras.confirmationDialog, clicked);

      /**
       * Handle button clicks through both mouse and keyboard
       * @private
       */
      var handleButtonClick = function () {
        if (extras.confirmationDialog.enable && confirmationDialog) {
          // Show popups section if used
          if (!extras.confirmationDialog.$parentElement) {
            sections.popups.$element.removeClass('hidden');
          }
          confirmationDialog.show($e.position().top);
        }
        else {
          clicked();
        }
      };

      const isSubmitting = extras.contentData && extras.contentData.standalone
        && (extras.contentData.isScoringEnabled || extras.contentData.isReportingEnabled);

      if (isSubmitting && extras.textIfSubmitting) {
        text = extras.textIfSubmitting;
      }

      buttons[id] = {
        isTruncated: false,
        text: text,
        isVisible: false,
        ariaLabel: options['aria-label']
      };

      // The button might be <button> or <a>
      // (dependent on options.href set or not)
      var isAnchorTag = (options.href !== undefined);
      var $e = buttons[id].$element = JoubelUI.createButton($.extend({
        'class': 'h5p-question-' + id,
        html: text,
        on: {
          click: function (event) {
            handleButtonClick();
            if (isAnchorTag) {
              event.preventDefault();
            }
          }
        }
      }, options));
      buttonOrder.push(id);

      H5P.Tooltip($e.get(0), {tooltipSource: 'data-tooltip'});

      // The button might be <button> or <a>. If <a>, the space key is not
      // triggering the click event, must therefore handle this here:
      if (isAnchorTag) {
        $e.on('keypress', function (event) {
          if (event.which === 32) { // Space
            handleButtonClick();
            event.preventDefault();
          }
        });
      }

      if (visible === undefined || visible) {
        // Button should be visible
        $e.appendTo(sections.buttons.$element);
        buttons[id].isVisible = true;
        showSection(sections.buttons);
      }

      return self;
    };

    var setButtonWidth = function (button) {
      var $button = button.$element;
      var $tmp = $button.clone()
        .css({
          'position': 'absolute',
          'white-space': 'nowrap',
          'max-width': 'none'
        }).removeClass('truncated')
        .html(button.text)
        .appendTo($button.parent());

      // Calculate max width (button including text)
      button.width = {
        max: Math.ceil($tmp.outerWidth() + parseFloat($tmp.css('margin-left')) + parseFloat($tmp.css('margin-right')))
      };

      // Calculate min width (truncated, icon only)
      $tmp.html('').addClass('truncated');
      button.width.min = Math.ceil($tmp.outerWidth() + parseFloat($tmp.css('margin-left')) + parseFloat($tmp.css('margin-right')));
      $tmp.remove();
    };

    /**
     * Add confirmation dialog to button
     * @param {ConfirmationDialog} options
     *  A confirmation dialog that will be shown before click handler of button
     *  is triggered
     * @param {function} clicked
     *  Click handler of button
     * @return {H5P.ConfirmationDialog|undefined}
     *  Confirmation dialog if enabled
     */
    self.addConfirmationDialogToButton = function (options, clicked) {
      options = options || {};

      if (!options.enable) {
        return;
      }

      // Confirmation dialog
      var confirmationDialog = new H5P.ConfirmationDialog({
        instance: options.instance,
        headerText: options.l10n.header,
        dialogText: options.l10n.body,
        cancelText: options.l10n.cancelLabel,
        confirmText: options.l10n.confirmLabel
      });

      // Determine parent element
      if (options.$parentElement) {
        const parentElement = options.$parentElement.get(0);
        let dialogParent;
        // If using h5p-content, dialog will not appear on embedded fullscreen
        if (parentElement.classList.contains('h5p-content')) {
          dialogParent = parentElement.querySelector('.h5p-container');
        }

        confirmationDialog.appendTo(dialogParent ?? parentElement);
      }
      else {

        // Create popup section and append to that
        if (sections.popups === undefined) {
          register('popups');
          if (initialized) {
            insert(self.order, 'popups', sections, $wrapper);
          }
          sections.popups.$element.addClass('hidden');
          self.order.push('popups');
        }
        confirmationDialog.appendTo(sections.popups.$element.get(0));
      }

      // Add event listeners
      confirmationDialog.on('confirmed', function () {
        if (!options.$parentElement) {
          sections.popups.$element.addClass('hidden');
        }
        clicked();

        // Trigger to content type
        self.trigger('confirmed');
      });

      confirmationDialog.on('canceled', function () {
        if (!options.$parentElement) {
          sections.popups.$element.addClass('hidden');
        }
        // Trigger to content type
        self.trigger('canceled');
      });

      return confirmationDialog;
    };

    /**
     * Show registered button with given identifier.
     *
     * @param {string} id
     * @param {Number} [priority]
     */
    self.showButton = function (id, priority) {
      var aboutToBeHidden = existsInArray(id, 'id', buttonsToHide) !== -1;
      if (buttons[id] === undefined || (buttons[id].isVisible === true && !aboutToBeHidden)) {
        return self;
      }

      priority = priority || 0;

      // Skip if already being shown
      var indexToShow = existsInArray(id, 'id', buttonsToShow);
      if (indexToShow !== -1) {

        // Update priority
        if (buttonsToShow[indexToShow].priority < priority) {
          buttonsToShow[indexToShow].priority = priority;
        }

        return self;
      }

      // Check if button is going to be hidden on next tick
      var exists = existsInArray(id, 'id', buttonsToHide);
      if (exists !== -1) {

        // Skip hiding if higher priority
        if (buttonsToHide[exists].priority <= priority) {
          buttonsToHide.splice(exists, 1);
          buttonsToShow.push({id: id, priority: priority});
        }

      } // If button is not shown
      else if (!buttons[id].$element.is(':visible')) {

        // Show button on next tick
        buttonsToShow.push({id: id, priority: priority});
      }

      if (!toggleButtonsTimer) {
        toggleButtonsTimer = setTimeout(toggleButtons, 0);
      }

      return self;
    };

    /**
     * Hide registered button with given identifier.
     *
     * @param {string} id
     * @param {number} [priority]
     */
    self.hideButton = function (id, priority) {
      var aboutToBeShown = existsInArray(id, 'id', buttonsToShow) !== -1;
      if (buttons[id] === undefined || (buttons[id].isVisible === false && !aboutToBeShown)) {
        return self;
      }

      priority = priority || 0;

      // Skip if already being hidden
      var indexToHide = existsInArray(id, 'id', buttonsToHide);
      if (indexToHide !== -1) {

        // Update priority
        if (buttonsToHide[indexToHide].priority < priority) {
          buttonsToHide[indexToHide].priority = priority;
        }

        return self;
      }

      // Check if buttons is going to be shown on next tick
      var exists = existsInArray(id, 'id', buttonsToShow);
      if (exists !== -1) {

        // Skip showing if higher priority
        if (buttonsToShow[exists].priority <= priority) {
          buttonsToShow.splice(exists, 1);
          buttonsToHide.push({id: id, priority: priority});
        }
      }
      else if (!buttons[id].$element.is(':visible')) {

        // Make sure it is detached in case the container is hidden.
        hideButton(id);
      }
      else {

        // Hide button on next tick.
        buttonsToHide.push({id: id, priority: priority});
      }

      if (!toggleButtonsTimer) {
        toggleButtonsTimer = setTimeout(toggleButtons, 0);
      }

      return self;
    };

    /**
     * Set focus to the given button. If no button is given the first visible
     * button gets focused. This is useful if you lose focus.
     *
     * @param {string} [id]
     */
    self.focusButton = function (id) {
      if (id === undefined) {
        // Find first button that is visible.
        for (var i = 0; i < buttonOrder.length; i++) {
          var button = buttons[buttonOrder[i]];
          if (button && button.isVisible) {
            // Give that button focus
            button.$element.focus();
            break;
          }
        }
      }
      else if (buttons[id] && buttons[id].$element.is(':visible')) {
        // Set focus to requested button
        buttons[id].$element.focus();
      }

      return self;
    };

    /**
     * Toggle readspeaker functionality
     * @param {boolean} [disable] True to disable, false to enable.
     */
    self.toggleReadSpeaker = function (disable) {
      behaviour.disableReadSpeaker = disable || !behaviour.disableReadSpeaker;
    };

    /**
     * Set new element for section.
     *
     * @param {String} id
     * @param {H5P.jQuery} $element
     */
    self.insertSectionAtElement = function (id, $element) {
      if (sections[id] === undefined) {
        register(id);
      }
      sections[id].parent = $element;

      // Insert section if question is not initialized
      if (!initialized) {
        insert([id], id, sections, $element);
      }

      return self;
    };

    /**
     * Attach content to given container.
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (self.isRoot()) {
        self.setActivityStarted();
      }

      // The first time we attach we also create our DOM elements.
      if ($wrapper === undefined) {
        if (self.registerDomElements !== undefined &&
           (self.registerDomElements instanceof Function ||
           typeof self.registerDomElements === 'function')) {

          // Give the question type a chance to register before attaching
          self.registerDomElements();
        }

        // Create section for reading messages
        $read = $('<div/>', {
          'aria-live': 'polite',
          'class': 'h5p-hidden-read'
        });
        register('read', $read);
        self.trigger('registerDomElements');
      }

      // Prepare container
      $wrapper = $container;
      $container.html('')
        .addClass('h5p-question h5p-' + type);

      // Add sections in given order
      var $sections = [];
      for (var i = 0; i < self.order.length; i++) {
        var section = self.order[i];
        if (sections[section]) {
          if (sections[section].parent) {
            // Section has a different parent
            sections[section].$element.appendTo(sections[section].parent);
          }
          else {
            $sections.push(sections[section].$element);
          }
          sections[section].isVisible = true;
        }
      }

      // Only append once to DOM for optimal performance
      $container.append($sections);

      // Let others react to dom changes
      self.trigger('domChanged', {
        '$target': $container,
        'library': self.libraryInfo.machineName,
        'contentId': self.contentId,
        'key': 'newLibrary'
      }, {'bubbles': true, 'external': true});

      // ??
      initialized = true;

      return self;
    };

    /**
     * Detach all sections from their parents
     */
    self.detachSections = function () {
      // Deinit Question
      initialized = false;

      // Detach sections
      for (var section in sections) {
        sections[section].$element.detach();
      }

      return self;
    };

    // Listen for resize
    self.on('resize', function () {
      // Allow elements to attach and set their height before resizing
      if (!sectionsIsTransitioning && sections.feedback && showFeedback) {
        // Resize feedback to fit
        setElementHeight(sections.feedback.$element);
      }

      // Re-position feedback popup if in use
      var $element = sections.feedback;
      var $click = clickElement;

      if ($element != null && $element.$element != null && $click != null && $click.$element != null) {
        setTimeout(function () {
          positionFeedbackPopup($element.$element, $click.$element);
        }, 10);
      }

      resizeButtons();
    });
  }

  // Inheritance
  Question.prototype = Object.create(EventDispatcher.prototype);
  Question.prototype.constructor = Question;

  /**
   * Determine the overall feedback to display for the question.
   * Returns empty string if no matching range is found.
   *
   * @param {Object[]} feedbacks
   * @param {number} scoreRatio
   * @return {string}
   */
  Question.determineOverallFeedback = function (feedbacks, scoreRatio) {
    scoreRatio = Math.floor(scoreRatio * 100);

    for (var i = 0; i < feedbacks.length; i++) {
      var feedback = feedbacks[i];
      var hasFeedback = (feedback.feedback !== undefined && feedback.feedback.trim().length !== 0);

      if (feedback.from <= scoreRatio && feedback.to >= scoreRatio && hasFeedback) {
        return feedback.feedback;
      }
    }

    return '';
  };

  return Question;
})(H5P.jQuery, H5P.EventDispatcher, H5P.JoubelUI);
;
H5P.Question.Explainer = (function ($) {
  /**
   * Constructor
   *
   * @class
   * @param {string} title
   * @param {array} explanations
   */
  function Explainer(title, explanations) {
    var self = this;

    /**
     * Create the DOM structure
     */
    var createHTML = function () {
      self.$explanation = $('<div>', {
        'class': 'h5p-question-explanation-container'
      });

      // Add title:
      $('<div>', {
        'class': 'h5p-question-explanation-title',
        role: 'heading',
        html: title,
        appendTo: self.$explanation
      });

      var $explanationList = $('<ul>', {
        'class': 'h5p-question-explanation-list',
        appendTo: self.$explanation
      });

      for (var i = 0; i < explanations.length; i++) {
        var feedback = explanations[i];
        var $explanationItem = $('<li>', {
          'class': 'h5p-question-explanation-item',
          appendTo: $explanationList
        });

        var $content = $('<div>', {
          'class': 'h5p-question-explanation-status'
        });

        if (feedback.correct) {
          $('<span>', {
            'class': 'h5p-question-explanation-correct',
            html: feedback.correct,
            appendTo: $content
          });
        }
        if (feedback.wrong) {
          $('<span>', {
            'class': 'h5p-question-explanation-wrong',
            html: feedback.wrong,
            appendTo: $content
          });
        }
        $content.appendTo($explanationItem);

        if (feedback.text) {
          $('<div>', {
            'class': 'h5p-question-explanation-text',
            html: feedback.text,
            appendTo: $explanationItem
          });
        }
      }
    };

    createHTML();

    /**
     * Return the container HTMLElement
     *
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return self.$explanation;
    };
  }

  return Explainer;

})(H5P.jQuery);
;
(function (Question) {

  /**
   * Makes it easy to add animated score points for your question type.
   *
   * @class H5P.Question.ScorePoints
   */
  Question.ScorePoints = function () {
    var self = this;

    var elements = [];
    var showElementsTimer;

    /**
     * Create the element that displays the score point element for questions.
     *
     * @param {boolean} isCorrect
     * @return {HTMLElement}
     */
    self.getElement = function (isCorrect) {
      var element = document.createElement('div');
      element.classList.add(isCorrect ? 'h5p-question-plus-one' : 'h5p-question-minus-one');
      element.classList.add('h5p-question-hidden-one');
      elements.push(element);

      // Schedule display animation of all added elements
      if (showElementsTimer) {
        clearTimeout(showElementsTimer);
      }
      showElementsTimer = setTimeout(showElements, 0);

      return element;
    };

    /**
     * @private
     */
    var showElements = function () {
      // Determine delay between triggering animations
      var delay = 0;
      var increment = 150;
      var maxTime = 1000;

      if (elements.length && elements.length > Math.ceil(maxTime / increment)) {
        // Animations will run for more than ~1 second, reduce it.
        increment = maxTime / elements.length;
      }

      for (var i = 0; i < elements.length; i++) {
        // Use timer to trigger show
        setTimeout(showElement(elements[i]), delay);

        // Increse delay for next element
        delay += increment;
      }
    };

    /**
     * Trigger transition animation for the given element
     *
     * @private
     * @param {HTMLElement} element
     * @return {function}
     */
    var showElement = function (element) {
      return function () {
        element.classList.remove('h5p-question-hidden-one');
      };
    };
  };

})(H5P.Question);
;
var H5P = H5P || {};
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};

H5P.SingleChoiceSet.StopWatch = (function () {
  /**
   * @class {H5P.SingleChoiceSet.StopWatch}
   * @constructor
   */
  function StopWatch() {
    /**
     * @property {number} duration in ms
     */
    this.duration = 0;
  }

  /**
   * Starts the stop watch
   *
   * @public
   * @return {H5P.SingleChoiceSet.StopWatch}
   */
  StopWatch.prototype.start = function () {
    /**
     * @property {number}
     */
    this.startTime = Date.now();
    return this;
  };

  /**
   * Stops the stopwatch, and returns the duration in seconds.
   *
   * @public
   * @return {number}
   */
  StopWatch.prototype.stop = function () {
    this.duration = this.duration + Date.now() - this.startTime;
    return this.passedTime();
  };

  /**
   * Sets the duration to 0
   *
   * @public
   */
  StopWatch.prototype.reset = function () {
    this.duration = 0;
  };

  /**
   * Returns the passed time in seconds
   *
   * @public
   * @return {number}
   */
  StopWatch.prototype.passedTime = function () {
    return Math.round(this.duration / 10) / 100;
  };

  return StopWatch;
})();
;
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};

H5P.SingleChoiceSet.SoundEffects = (function () {
  let isDefined = false;

  const SoundEffects = {
    types: [
      'positive-short',
      'negative-short'
    ]
  };

  const players = {};

  /**
   * Setup defined sounds
   *
   * @param {string} libraryPath
   * @return {boolean} True if setup was successfull, otherwise false
   */
  SoundEffects.setup = function (libraryPath) {
    if (isDefined) {
      return false;
    }
    isDefined = true;

    SoundEffects.types.forEach(async function (type) {
      const player = new Audio();
      const extension = player.canPlayType('audio/ogg') ? 'ogg' : 'mp3';
      const response = await fetch(libraryPath + 'sounds/' + type + '.' + extension);
      const data = await response.blob();
      player.src = URL.createObjectURL(data);
      players[type] = player;
    });

    return true;
  };

  /**
   * Play a sound
   *
   * @param  {string} type  Name of the sound as defined in [SoundEffects.types]{@link H5P.SoundEffects.SoundEffects#types}
   * @param  {number} delay Delay in milliseconds
   */
  SoundEffects.play = function (type, delay) {
    if (!players[type]) {
      return;
    }

    setTimeout(function () {
      players[type].play();
    }, delay || 0);
  };

  return SoundEffects;
})();
;
var H5P = H5P || {};
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};

H5P.SingleChoiceSet.XApiEventBuilder = (function ($, EventDispatcher) {
  /**
   * @typedef {object} LocalizedString
   * @property {string} en-US
   */

  /**
   * @class {H5P.SingleChoiceSet.XApiEventDefinitionBuilder}
   * @constructor
   */
  function XApiEventDefinitionBuilder() {
    EventDispatcher.call(this);
    /**
     * @property {object} attributes
     * @property {string} attributes.name
     * @property {string} attributes.description
     * @property {string} attributes.interactionType
     * @property {string} attributes.correctResponsesPattern
     * @property {object} attributes.optional
     */
    this.attributes = {};
  }

  XApiEventDefinitionBuilder.prototype = Object.create(EventDispatcher.prototype);
  XApiEventDefinitionBuilder.prototype.constructor = XApiEventDefinitionBuilder;


  /**
   * Sets name
   * @param {string} name
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.name = function (name) {
    this.attributes.name = name;
    return this;
  };

  /**
   * Question text and any additional information to generate the report.
   * @param {string} description
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.description = function (description) {
    this.attributes.description = description;
    return this;
  };

  /**
   * Type of the interaction.
   * @param {string} interactionType
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types|xAPI Spec}
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.interactionType = function (interactionType) {
    this.attributes.interactionType = interactionType;
    return this;
  };

  /**
   * A pattern for determining the correct answers of the interaction
   * @param {string[]} correctResponsesPattern
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#response-patterns|xAPI Spec}
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.correctResponsesPattern = function (correctResponsesPattern) {
    this.attributes.correctResponsesPattern = correctResponsesPattern;
    return this;
  };

  /**
   * Sets optional attributes
   * @param {object} optional Can have one of the following configuration objects: choices, scale, source, target, steps
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.optional = function (optional) {
    this.attributes.optional = optional;
    return this;
  };

  /**
   * @return {object}
   */
  XApiEventDefinitionBuilder.prototype.build = function () {
    var definition = {};

    // sets attributes
    setAttribute(definition, 'name', localizeToEnUS(this.attributes.name));
    setAttribute(definition, 'description', localizeToEnUS(this.attributes.description));
    setAttribute(definition, 'interactionType', this.attributes.interactionType);
    setAttribute(definition, 'correctResponsesPattern', this.attributes.correctResponsesPattern);
    setAttribute(definition, 'type', 'http://adlnet.gov/expapi/activities/cmi.interaction');

    // adds the optional object to the definition
    if (this.attributes.optional) {
      $.extend(definition, this.attributes.optional);
    }

    return definition;
  };

  // -----------------------------------------------------

  /**
   *
   * @constructor
   */
  function XApiEventResultBuilder() {
    EventDispatcher.call(this);
    /**
     * @property {object} attributes
     * @property {string} attributes.completion
     * @property {boolean} attributes.success
     * @property {boolean} attributes.response
     * @property {number} attributes.rawScore
     * @property {number} attributes.maxScore
     */
    this.attributes = {};
  }

  XApiEventResultBuilder.prototype = Object.create(EventDispatcher.prototype);
  XApiEventResultBuilder.prototype.constructor = XApiEventResultBuilder;

  /**
   * @param {boolean} completion
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.completion = function (completion) {
    this.attributes.completion = completion;
    return this;
  };

  /**
   * @param {boolean} success
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.success = function (success) {
    this.attributes.success = success;
    return this;
  };

  /**
   * @param {number} duration The duraction in seconds
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.duration = function (duration) {
    this.attributes.duration = duration;
    return this;
  };

  /**
   * Sets response
   * @param {string|string[]} response
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.response = function (response) {
    this.attributes.response = (typeof response === 'string') ? response : response.join('[,]');
    return this;
  };

  /**
   * Sets the score, and max score
   * @param {number} score
   * @param {number} maxScore
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.score = function (score, maxScore) {
    this.attributes.rawScore = score;
    this.attributes.maxScore = maxScore;
    return this;
  };

  /**
   * Builds the result object
   * @return {object}
   */
  XApiEventResultBuilder.prototype.build = function () {
    var result = {};

    setAttribute(result, 'response', this.attributes.response);
    setAttribute(result, 'completion', this.attributes.completion);
    setAttribute(result, 'success', this.attributes.success);

    if (isDefined(this.attributes.duration)) {
      setAttribute(result, 'duration','PT' +  this.attributes.duration + 'S');
    }

    // sets score
    if (isDefined(this.attributes.rawScore)) {
      result.score = {};
      setAttribute(result.score, 'raw', this.attributes.rawScore);

      if (isDefined(this.attributes.maxScore) && this.attributes.maxScore > 0) {
        setAttribute(result.score, 'min', 0);
        setAttribute(result.score, 'max', this.attributes.maxScore);
        setAttribute(result.score, 'min', 0);
        setAttribute(result.score, 'scaled', Math.round(this.attributes.rawScore / this.attributes.maxScore * 10000) / 10000);
      }
    }

    return result;
  };

  // -----------------------------------------------------

  /**
   * @class {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  function XApiEventBuilder() {
    EventDispatcher.call(this);
    /**
     * @property {object} attributes
     * @property {string} attributes.contentId
     * @property {string} attributes.subContentId
     */
    this.attributes = {};
  }

  XApiEventBuilder.prototype = Object.create(EventDispatcher.prototype);
  XApiEventBuilder.prototype.constructor = XApiEventBuilder;


  /**
   * @param {object} verb
   *
   * @public
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.verb = function (verb) {
    this.attributes.verb = verb;
    return this;
  };

  /**
   * @param {string} name
   * @param {string} mbox
   * @param {string} objectType
   *
   * @public
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.actor = function (name, mbox, objectType) {
    this.attributes.actor = {
      name: name,
      mbox: mbox,
      objectType: objectType
    };

    return this;
  };

  /**
   * Sets contentId
   * @param {string} contentId
   * @param {string} [subContentId]
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.contentId = function (contentId, subContentId) {
    this.attributes.contentId = contentId;
    this.attributes.subContentId = subContentId;
    return this;
  };

  /**
   * Sets parent in context
   *
   * @param {string} parentContentId
   * @param {string} [parentSubContentId]
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.context = function (parentContentId, parentSubContentId) {
    this.attributes.parentContentId = parentContentId;
    this.attributes.parentSubContentId = parentSubContentId;
    return this;
  };

  /**
   * @param {object} result
   *
   * @public
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.result = function (result) {
    this.attributes.result = result;
    return this;
  };

  /**
   * @param {object} objectDefinition
   *
   * @public
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.objectDefinition = function (objectDefinition) {
    this.attributes.objectDefinition = objectDefinition;
    return this;
  };

  /**
   * Returns the buildt event
   * @public
   * @return {H5P.XAPIEvent}
   */
  XApiEventBuilder.prototype.build = function () {
    var event = new H5P.XAPIEvent();

    event.setActor();
    event.setVerb(this.attributes.verb);

    // sets context
    if (this.attributes.parentContentId || this.attributes.parentSubContentId) {
      event.data.statement.context = {
        'contextActivities': {
          'parent': [
            {
              'id': getContentXAPIId(this.attributes.parentContentId, this.attributes.parentSubContentId),
              'objectType': "Activity"
            }
          ]
        }
      };
    }

    event.data.statement.object = {
      'id': getContentXAPIId(this.attributes.contentId, this.attributes.subContentId),
      'objectType': 'Activity'
    };

    setAttribute(event.data, 'actor', this.attributes.actor);
    setAttribute(event.data.statement, 'result', this.attributes.result);
    setAttribute(event.data.statement.object, 'definition', this.attributes.objectDefinition);

    // sets h5p specific attributes
    if (event.data.statement.object.definition && (this.attributes.contentId || this.attributes.subContentId)) {
      var extensions = event.data.statement.object.definition.extensions = {};
      setAttribute(extensions, 'http://h5p.org/x-api/h5p-local-content-id', this.attributes.contentId);
      setAttribute(extensions, 'http://h5p.org/x-api/h5p-subContentId', this.attributes.subContentId);
    }

    return event;
  };

  /**
   * Creates a Localized String object for en-US
   *
   * @param str
   * @return {LocalizedString}
   */
  var localizeToEnUS = function (str) {
    if (str != undefined) {
      return {
        'en-US': cleanString(str)
      };
    }
  };

  /**
   * Generates an id for the content
   * @param {string} contentId
   * @param {string} [subContentId]
   *
   * @see {@link https://github.com/h5p/h5p-php-library/blob/master/js/h5p-x-api-event.js#L240-L249}
   * @return {string}
   */
  var getContentXAPIId = function (contentId, subContentId) {
    const cid = 'cid-' + contentId;
    if (contentId && H5PIntegration && H5PIntegration.contents && H5PIntegration.contents[cid]) {
      var id =  H5PIntegration.contents[cid].url;

      if (subContentId) {
        id += '?subContentId=' +  subContentId;
      }

      return id;
    }
  };

  /**
   * Removes html elements from string
   *
   * @param {string} str
   * @return {string}
   */
  var cleanString = function (str) {
    return $('<div>' + str + '</div>').text().trim();
  };

  var isDefined = function (val) {
    return typeof val !== 'undefined';
  };

  function setAttribute(obj, key, value, required) {
    if (isDefined(value)) {
      obj[key] = value;
    }
    else if (required) {
      console.error("xApiEventBuilder: No value for [" + key + "] in", obj);
    }
  }

  /**
   * Creates a new XApiEventBuilder
   *
   * @public
   * @static
   * @return {H5P.SingleChoiceSet.XApiEventBuilder}
   */
  XApiEventBuilder.create = function () {
    return new XApiEventBuilder();
  };

  /**
   * Creates a new XApiEventDefinitionBuilder
   *
   * @public
   * @static
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventBuilder.createDefinition = function () {
    return new XApiEventDefinitionBuilder();
  };

  /**
   * Creates a new XApiEventDefinitionBuilder
   *
   * @public
   * @static
   * @return {XApiEventResultBuilder}
   */
  XApiEventBuilder.createResult = function () {
    return new XApiEventResultBuilder();
  };

  /**
   * Returns choice to be used with 'cmi.interaction' for Activity of type 'choice'
   *
   * @param {string} id
   * @param {string} description
   *
   * @public
   * @static
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#choice|xAPI-Spec}
   * @return {object}
   */
  XApiEventBuilder.createChoice = function (id, description) {
    return {
      id: id,
      description: localizeToEnUS(description)
    };
  };

  /**
   * Takes an array of correct ids, and joins them to a 'correct response pattern'
   *
   * @param {string[]} ids
   *
   * @public
   * @static
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#choice|xAPI-Spec}
   * @return {string}
   */
  XApiEventBuilder.createCorrectResponsePattern = function (ids) {
    return ids.join('[,]');
  };

  /**
   * Interaction types
   *
   * @readonly
   * @enum {String}
   */
  XApiEventBuilder.interactionTypes = {
    CHOICE: 'choice',
    COMPOUND: 'compound',
    FILL_IN: 'fill-in',
    MATCHING: 'matching',
    TRUE_FALSE: 'true-false'
  };

  /**
   * Verbs
   *
   * @readonly
   * @enum {String}
   */
  XApiEventBuilder.verbs = {
    ANSWERED: 'answered'
  };

  return XApiEventBuilder;
})(H5P.jQuery, H5P.EventDispatcher);
;
var H5P = H5P || {};
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};
/**
 * SingleChoiceResultSlide - Represents the result slide
 */
H5P.SingleChoiceSet.ResultSlide = (function ($, EventDispatcher) {

  /**
   * @constructor
   * @param {number} maxscore Max score
   */
  function ResultSlide(maxscore) {
    EventDispatcher.call(this);

    this.$feedbackContainer = $('<div>', {
      'class': 'h5p-sc-feedback-container',
      'tabindex': '-1'
    });

    this.$buttonContainer = $('<div/>', {
      'class': 'h5p-sc-button-container'
    });

    var $resultContainer = $('<div/>', {
      'class': 'h5p-sc-result-container'
    }).append(this.$feedbackContainer)
      .append(this.$buttonContainer);

    this.$resultSlide = $('<div>', {
      'class': 'h5p-sc-slide h5p-sc-set-results',
      'css': {left: (maxscore * 100) + '%'}
    }).append($resultContainer);
  }

  // inherits from EventDispatchers prototype
  ResultSlide.prototype = Object.create(EventDispatcher.prototype);

  // set the constructor
  ResultSlide.prototype.constructor = ResultSlide;

  /**
   * Focus feedback container.
   */
  ResultSlide.prototype.focusScore = function () {
    this.$feedbackContainer.focus();
  };

  /**
   * Append the resultslide to a container
   *
   * @param  {jQuery} $container The container
   * @return {jQuery}            This dom element
   */
  ResultSlide.prototype.appendTo = function ($container) {
    this.$resultSlide.appendTo($container);
    return this.$resultSlide;
  };

  return ResultSlide;
})(H5P.jQuery, H5P.EventDispatcher);
;
var H5P = H5P || {};
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};

H5P.SingleChoiceSet.SolutionView = (function ($, EventDispatcher) {
  /**
   * Constructor function.
   */
  function SolutionView(id, choices, l10n) {
    EventDispatcher.call(this);
    var self = this;
    self.id = id;
    this.choices = choices;
    self.l10n = l10n;

    this.$solutionView = $('<div>', {
      'class': 'h5p-sc-solution-view'
    });

    // Add header
    this.$header = $('<div>', {
      'class': 'h5p-sc-solution-view-header'
    }).appendTo(this.$solutionView);

    this.$title = $('<div>', {
      'class': 'h5p-sc-solution-view-title',
      'html': l10n.solutionViewTitle,
      'tabindex': '-1'
    });
    this.$title = this.addAriaPunctuation(this.$title);
    this.$header.append(this.$title);

    // Close solution view button
    $('<button>', {
      'role': 'button',
      'aria-label': l10n.closeButtonLabel + '.',
      'class': 'h5p-joubelui-button h5p-sc-close-solution-view',
      'click': function () {
        self.hide();
      }
    }).appendTo(this.$header);

    self.populate();
  }

  /**
   * Will append the solution view to a container DOM
   * @param  {jQuery} $container The DOM object to append to
   */
  SolutionView.prototype.appendTo = function ($container) {
    this.$solutionView.appendTo($container);
  };

  /**
   * Shows the solution view
   */
  SolutionView.prototype.show = function () {
    var self = this;
    self.$solutionView.addClass('visible');
    self.$title.focus();

    $(document).on('keyup.solutionview', function (event) {
      if (event.keyCode === 27) { // Escape
        self.hide();
        $(document).off('keyup.solutionview');
      }
    });
  };

  /**
   * Hides the solution view
   */
  SolutionView.prototype.hide = function () {
    this.$solutionView.removeClass('visible');
    this.trigger('hide', this);
  };


  /**
   * Populates the solution view
   */
  SolutionView.prototype.populate = function () {
    var self = this;
    self.$choices = $('<dl>', {
      'class': 'h5p-sc-solution-choices',
      'tabindex': -1,
    });

    this.choices.forEach(function (choice, index) {
      if (choice.question && choice.answers && choice.answers.length !== 0) {
        var $question = self.addAriaPunctuation($('<dt>', {
          'class': 'h5p-sc-solution-question',
          html: '<span class="h5p-hidden-read">' + self.l10n.solutionListQuestionNumber.replace(':num', index + 1) + '</span>' + choice.question
        }));

        self.$choices.append($question);

        var $answer = self.addAriaPunctuation($('<dd>', {
          'class': 'h5p-sc-solution-answer',
          html: choice.answers[0]
        }));

        self.$choices.append($answer);
      }
    });
    self.$choices.appendTo(this.$solutionView);
  };

  /**
   * If a jQuery elements text is missing punctuation, add an aria-label to the element
   * containing the text, and adding an extra "period"-symbol at the end.
   *
   * @param {jQuery} $element A jQuery-element
   * @returns {jQuery} The mutated jQuery-element
   */
  SolutionView.prototype.addAriaPunctuation = function ($element) {
    var text = $element.text().trim();

    if (!this.hasPunctuation(text)) {
      $element.attr('aria-label', text + '.');
    }

    return $element;
  };

  /**
   * Checks if a string ends with punctuation
   *
   * @private
   * @param {String} text Input string
   */
  SolutionView.prototype.hasPunctuation = function (text) {
    return /[,.?!]$/.test(text);
  };

  return SolutionView;
})(H5P.jQuery, H5P.EventDispatcher);
;
var H5P = H5P || {};
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};

H5P.SingleChoiceSet.Alternative = (function ($, EventDispatcher) {

  /**
   * @constructor
   *
   * @param {object} options Options for the alternative
   */
  function Alternative(options) {
    EventDispatcher.call(this);
    var self = this;

    this.options = options;

    var triggerAlternativeSelected = function (event) {
      self.trigger('alternative-selected', {
        correct: self.options.correct,
        $element: self.$alternative,
        answerIndex: self.options.answerIndex
      });

      event.preventDefault();
    };

    this.$alternative = $('<li>', {
      'class': 'h5p-sc-alternative h5p-sc-is-' + (this.options.correct ? 'correct' : 'wrong'),
      'role': 'radio',
      'tabindex': -1,
      'on': {
        'keydown': function (event) {
          switch (event.which) {
            case 13: // Enter
            case 32: // Space
              // Answer question
              triggerAlternativeSelected(event);
              break;

            case 35: // End radio button
              // Go to previous Option
              self.trigger('lastOption', event);
              event.preventDefault();
              break;

            case 36: // Home radio button
              // Go to previous Option
              self.trigger('firstOption', event);
              event.preventDefault();
              break;

            case 37: // Left Arrow
            case 38: // Up Arrow
              // Go to previous Option
              self.trigger('previousOption', event);
              event.preventDefault();
              break;

            case 39: // Right Arrow
            case 40: // Down Arrow
              // Go to next Option
              self.trigger('nextOption', event);
              event.preventDefault();
              break;
          }
        }
      },
      'focus': function (event) {
        self.trigger('focus', event);
      },
      'click': triggerAlternativeSelected
    });

    this.$alternative.append($('<div>', {
      'class': 'h5p-sc-progressbar'
    }));

    this.$alternative.append($('<div>', {
      'class': 'h5p-sc-label',
      'html': this.options.text
    }));

    this.$alternative.append($('<div>', {
      'class': 'h5p-sc-status'
    }));
    this.$alternative.append($('<div>', {
      'class': 'h5p-sc-a11y',
      'aria-hidden': 'true'
    }));
  }

  Alternative.prototype = Object.create(EventDispatcher.prototype);
  Alternative.prototype.constructor = Alternative;

  /**
   * Is this alternative the correct one?
   *
   * @return {boolean}  Correct or not?
   */
  Alternative.prototype.isCorrect = function () {
    return this.options.correct;
  };

  /**
   * Move focus to this option.
   */
  Alternative.prototype.focus = function () {
    this.$alternative.focus();
  };

  /**
   * Makes it possible to tab your way to this option.
   */
  Alternative.prototype.tabbable = function () {
    this.$alternative.attr('tabindex', 0);
  };

  /**
   * Make sure it's NOT possible to tab your way to this option.
   */
  Alternative.prototype.notTabbable = function () {
    this.$alternative.attr('tabindex', -1);
  };

  /**
   * Append the alternative to a DOM container
   *
   * @param  {jQuery} $container The Dom element to append to
   * @return {jQuery}            This dom element
   */
  Alternative.prototype.appendTo = function ($container) {
    $container.append(this.$alternative);
    return this.$alternative;
  };

  return Alternative;

})(H5P.jQuery, H5P.EventDispatcher);
;
var H5P = H5P || {};
H5P.SingleChoiceSet = H5P.SingleChoiceSet || {};

H5P.SingleChoiceSet.SingleChoice = (function ($, EventDispatcher, Alternative) {
  /**
   * Constructor function.
   */
  function SingleChoice(options, index, id, isAutoConfinue) {
    EventDispatcher.call(this);
    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      question: '',
      answers: []
    }, options);
    this.isAutoConfinue = isAutoConfinue;
    // Keep provided id.
    this.index = index;
    this.id = id;
    this.answered = false;

    for (var i = 0; i < this.options.answers.length; i++) {
      this.options.answers[i] = {
        text: this.options.answers[i],
        correct: i === 0,
        answerIndex: i
      };
    }
    // Randomize alternatives
    this.options.answers = H5P.shuffleArray(this.options.answers);
  }

  SingleChoice.prototype = Object.create(EventDispatcher.prototype);
  SingleChoice.prototype.constructor = SingleChoice;

  /**
   * appendTo function invoked to append SingleChoice to container
   *
   * @param {jQuery} $container
   * @param {boolean} isCurrent Current slide we are on
   */
  SingleChoice.prototype.appendTo = function ($container, isCurrent) {
    var self = this;
    this.$container = $container;

    // Index of the currently focused option.
    var focusedOption;

    this.$choice = $('<div>', {
      'class': 'h5p-sc-slide h5p-sc' + (isCurrent ? ' h5p-sc-current-slide' : ''),
      css: {'left': (self.index * 100) + '%'}
    });

    var questionId = 'single-choice-' + self.id + '-question-' + self.index;

    this.$choice.append($('<div>', {
      'id': questionId,
      'class': 'h5p-sc-question',
      'html': this.options.question
    }));

    var $alternatives = $('<ul>', {
      'class': 'h5p-sc-alternatives',
      'role': 'radiogroup',
      'aria-labelledby': questionId
    });

    /**
     * List of Alternatives
     *
     * @type {Alternative[]}
     */
    this.alternatives = self.options.answers.map(function (opts) {
      return new Alternative(opts);
    });

    /**
     * Handles click on an alternative
     */
    var handleAlternativeSelected = function (event) {
      var $element = event.data.$element;
      var correct = event.data.correct;
      var answerIndex = event.data.answerIndex;

      if ($element.parent().hasClass('h5p-sc-selected')) {
        return;
      }

      self.trigger('alternative-selected', {
        correct: correct,
        index: self.index,
        answerIndex: answerIndex,
        currentIndex: $element.index()
      });

      H5P.Transition.onTransitionEnd($element.find('.h5p-sc-progressbar'), function () {
        $element.addClass('h5p-sc-drummed');
        self.showResult(correct, answerIndex);
      }, 700);

      $element.addClass('h5p-sc-selected').parent().addClass('h5p-sc-selected');

      // indicate that this question is anwered
      this.setAnswered(true);
    };

    /**
     * Handles focusing one of the options, making the rest non-tabbable.
     * @private
     */
    var handleFocus = function (answer, index) {
      // Keep track of currently focused option
      focusedOption = index;

      // remove tabbable all alternatives
      self.alternatives.forEach(function (alternative) {
        alternative.notTabbable();
      });
      answer.tabbable();
    };

    /**
     * Handles moving the focus from the current option to the previous option.
     * @private
     */
    var handlePreviousOption = function () {
      if (focusedOption === 0) {
        // wrap around to last
        this.focusOnAlternative(self.alternatives.length - 1);
      }
      else {
        this.focusOnAlternative(focusedOption - 1);
      }
    };

    /**
     * Handles moving the focus from the current option to the next option.
     * @private
     */
    var handleNextOption = function () {
      if ((focusedOption === this.alternatives.length - 1)) {
        // wrap around to first
        this.focusOnAlternative(0);
      }
      else {
        this.focusOnAlternative(focusedOption + 1);
      }
    };

    /**
     * Handles moving the focus to the first option
     * @private
     */
    var handleFirstOption = function () {
      this.focusOnAlternative(0);
    };

    /**
     * Handles moving the focus to the last option
     * @private
     */
    var handleLastOption = function () {
      this.focusOnAlternative(self.alternatives.length - 1);
    };

    for (var i = 0; i < this.alternatives.length; i++) {
      var alternative = this.alternatives[i];

      if (i === 0) {
        alternative.tabbable();
      }

      alternative.appendTo($alternatives);
      alternative.on('focus', handleFocus.bind(this, alternative, i), this);
      alternative.on('alternative-selected', handleAlternativeSelected, this);
      alternative.on('previousOption', handlePreviousOption, this);
      alternative.on('nextOption', handleNextOption, this);
      alternative.on('firstOption', handleFirstOption, this);
      alternative.on('lastOption', handleLastOption, this);

    }

    this.$choice.append($alternatives);
    $container.append(this.$choice);
    return this.$choice;
  };

  /**
   * Focus on an alternative by index
   *
   * @param {Number} index The index of the alternative to focus on
   */
  SingleChoice.prototype.focusOnAlternative = function (index) {
    if (!this.answered || !this.isAutoConfinue) {
      this.alternatives[index].focus();
    }
  };

  /**
   * Sets if the question was answered
   *
   * @param {Boolean} answered If this question was answered
   */
  SingleChoice.prototype.setAnswered = function (answered) {
    this.answered = answered;
  };

  /**
   * Reveals the result for a question
   *
   * @param  {boolean} correct True uf answer was correct, otherwise false
   * @param  {number} answerIndex Original index of answer
   */
  SingleChoice.prototype.showResult = function (correct, answerIndex) {
    var self = this;

    var $correctAlternative = self.$choice.find('.h5p-sc-is-correct');

    H5P.Transition.onTransitionEnd($correctAlternative, function () {
      self.trigger('finished', {
        correct: correct,
        index: self.index,
        answerIndex: answerIndex
      });
      self.setAriaAttributes();
    }, 600);

    // Reveal corrects and wrong
    self.$choice.find('.h5p-sc-is-wrong').addClass('h5p-sc-reveal-wrong');
    $correctAlternative.addClass('h5p-sc-reveal-correct');
  };

  /**
   * Reset a11y text for selected options
   */
  SingleChoice.prototype.resetA11yText = function () {
    var self = this;
    self.$choice.find('.h5p-sc-a11y').text('');
  };

  /**
   * Make a11y text readable for screen reader
   */
  SingleChoice.prototype.setA11yTextReadable = function () {
    var self = this;
    self.$choice.find('.h5p-sc-a11y').attr('aria-hidden', false);
  };

  /**
   * Set aria attributes for choice
   */
  SingleChoice.prototype.setAriaAttributes = function () {
    var self = this;
    // A11y mode is enabled
    if (!self.isAutoConfinue) {
      self.$choice.find('.h5p-sc-alternative.h5p-sc-selected').attr('aria-checked', true);
      self.$choice.find('.h5p-sc-alternative').attr('aria-disabled', true);
    }
  }

  /**
   * Reset aria attributes
   */
  SingleChoice.prototype.resetAriaAttributes = function () {
    var self = this;
    // A11y mode is enabled
    if (!self.isAutoConfinue) {
      const alternative = self.$choice.find('.h5p-sc-alternative');
      alternative.removeAttr('aria-disabled');
      alternative.removeAttr('aria-checked');
    }
  };

  return SingleChoice;

})(H5P.jQuery, H5P.EventDispatcher, H5P.SingleChoiceSet.Alternative);
;
var H5P = H5P || {};

H5P.SingleChoiceSet = (function ($, UI, Question, SingleChoice, SolutionView, ResultSlide, SoundEffects, XApiEventBuilder, StopWatch) {
  /**
   * @constructor
   * @extends Question
   * @param {object} options Options for single choice set
   * @param {string} contentId H5P instance id
   * @param {Object} contentData H5P instance data
   */
  function SingleChoiceSet(options, contentId, contentData) {
    var self = this;

    // Extend defaults with provided options
    this.contentId = contentId;
    this.contentData = contentData;
    /**
     * The users input on the questions. Uses the same index as this.options.choices
     * @type {number[]}
     */
    this.userResponses = [];
    Question.call(this, 'single-choice-set');
    this.options = $.extend(true, {}, {
      choices: [],
      overallFeedback: [],
      behaviour: {
        autoContinue: true,
        timeoutCorrect: 2000,
        timeoutWrong: 3000,
        soundEffectsEnabled: true,
        enableRetry: true,
        enableSolutionsButton: true,
        passPercentage: 100
      }
    }, options);
    if (contentData && contentData.previousState !== undefined) {
      this.currentIndex = contentData.previousState.progress;
      this.results = contentData.previousState.answers;
      this.userResponses = contentData.previousState.userResponses !== undefined
        ? contentData.previousState.userResponses
        : [];
    }
    this.currentIndex = this.currentIndex || 0;
    this.results = this.results || {
      corrects: 0,
      wrongs: 0
    };

    if (!this.options.behaviour.autoContinue) {
      this.options.behaviour.timeoutCorrect = 0;
      this.options.behaviour.timeoutWrong = 0;
    }

    /**
     * @property {StopWatch[]} Stop watches for tracking duration of slides
     */
    this.stopWatches = [];
    this.startStopWatch(this.currentIndex);

    this.muted = (this.options.behaviour.soundEffectsEnabled === false);

    this.l10n = H5P.jQuery.extend({
      correctText: 'Correct!',
      incorrectText: 'Incorrect!',
      shouldSelect: "Should have been selected",
      shouldNotSelect: "Should not have been selected",
      nextButtonLabel: 'Next question',
      showSolutionButtonLabel: 'Show solution',
      retryButtonLabel: 'Retry',
      closeButtonLabel: 'Close',
      solutionViewTitle: 'Solution',
      slideOfTotal: 'Slide :num of :total',
      muteButtonLabel: "Mute feedback sound",
      scoreBarLabel: 'You got :num out of :total points',
      solutionListQuestionNumber: 'Question :num',
      a11yShowSolution: 'Show the solution. The task will be marked with its correct solution.',
      a11yRetry: 'Retry the task. Reset all responses and start the task over again.',
    }, options.l10n !== undefined ? options.l10n : {});

    this.$container = $('<div>', {
      'class': 'h5p-sc-set-wrapper navigatable' + (!this.options.behaviour.autoContinue ? ' next-button-mode' : '')
    });

    this.$slides = [];
    // An array containing the SingleChoice instances
    this.choices = [];

    /**
     * Keeps track of buttons that will be hidden
     * @type {Array}
     */
    self.buttonsToBeHidden = [];

    /**
     * The solution dialog
     * @type {SolutionView}
     */
    this.solutionView = new SolutionView(contentId, this.options.choices, this.l10n);

    this.$choices = $('<div>', {
      'class': 'h5p-sc-set h5p-sc-animate'
    });

    // sometimes an empty object is in the choices
    this.options.choices = this.options.choices.filter(function (choice) {
      return choice !== undefined && !!choice.answers;
    });

    var numQuestions = this.options.choices.length;

    // Create progressbar
    self.progressbar = UI.createProgressbar(numQuestions + 1, {
      progressText: this.l10n.slideOfTotal
    });
    self.progressbar.setProgress(this.currentIndex);

    for (var i = 0; i < this.options.choices.length; i++) {
      var choice = new SingleChoice(this.options.choices[i], i, this.contentId, this.options.behaviour.autoContinue);
      choice.on('finished', this.handleQuestionFinished, this);
      choice.on('alternative-selected', this.handleAlternativeSelected, this);
      choice.appendTo(this.$choices, (i === this.currentIndex));
      this.choices.push(choice);
      this.$slides.push(choice.$choice);
    }

    this.resultSlide = new ResultSlide(this.options.choices.length);
    this.resultSlide.appendTo(this.$choices);
    this.resultSlide.on('retry', function() {
      self.resetTask(true);
    }, this);
    this.resultSlide.on('view-solution', this.handleViewSolution, this);
    this.$slides.push(this.resultSlide.$resultSlide);
    this.on('resize', this.resize, this);

    // Use the correct starting slide
    this.recklessJump(this.currentIndex);

    if (this.options.choices.length === this.currentIndex) {
      // Make sure results slide is displayed
      this.resultSlide.$resultSlide.addClass('h5p-sc-current-slide');
      this.setScore(this.results.corrects, true);
    }

    if (!this.muted) {
      setTimeout(function () {
        SoundEffects.setup(self.getLibraryFilePath(''));
      }, 1);
    }

    /**
     * Override Question's hideButton function
     * to be able to hide buttons after delay
     *
     * @override
     * @param {string} id
     */
    this.superHideButton = self.hideButton;
    this.hideButton = (function () {
      return function (id) {

        if (!self.scoreTimeout) {
          return self.superHideButton(id);
        }

        self.buttonsToBeHidden.push(id);
        return this;
      };
    })();
  }

  SingleChoiceSet.prototype = Object.create(Question.prototype);
  SingleChoiceSet.prototype.constructor = SingleChoiceSet;

  /**
   * Set if a element is tabbable or not
   *
   * @param {jQuery} $element The element
   * @param {boolean} tabbable If element should be tabbable
   * @returns {jQuery} The element
   */
  SingleChoiceSet.prototype.setTabbable = function ($element, tabbable) {
    if ($element) {
      $element.attr('tabindex', tabbable ? 0 : -1);
    }
  };

  /**
   * Handle alternative selected, i.e play sound if sound effects are enabled
   *
   * @method handleAlternativeSelected
   * @param  {Object} event Event that was fired
   */
  SingleChoiceSet.prototype.handleAlternativeSelected = function (event) {
    var self = this;
    this.lastAnswerIsCorrect = event.data.correct;

    self.toggleNextButton(true);

    // Keep track of num correct/wrong answers
    this.results[this.lastAnswerIsCorrect ? 'corrects' : 'wrongs']++;

    self.triggerXAPI('interacted');

    // Read and set a11y friendly texts 
    self.readA11yFriendlyText(event.data.index, event.data.currentIndex)

    if (!this.muted) {
      // Can't play it after the transition end is received, since this is not
      // accepted on iPad. Therefore we are playing it here with a delay instead
      SoundEffects.play(this.lastAnswerIsCorrect ? 'positive-short' : 'negative-short', 700);
    }
  };

  /**
   * Handler invoked when question is done
   *
   * @param  {object} event An object containing a single boolean property: "correct".
   */
  SingleChoiceSet.prototype.handleQuestionFinished = function (event) {
    var self = this;

    var index = event.data.index;

    // saves user response
    var userResponse = self.userResponses[index] = event.data.answerIndex;

    // trigger answered event
    var duration = this.stopStopWatch(index);
    var xapiEvent = self.createXApiAnsweredEvent(self.options.choices[index], userResponse, duration);

    self.trigger(xapiEvent);

    self.continue(index);
  };

  /**
   * Setup auto continue
   */
  SingleChoiceSet.prototype.continue = function (index) {
    var self = this;

    self.choices[index].setA11yTextReadable();
    if (!self.options.behaviour.autoContinue) {
      // Set focus to next button
      self.$nextButton.focus();
      return;
    }

    var timeout;
    var letsMove = function () {
      // Handle impatient users
      self.$container.off('click.impatient keydown.impatient');
      clearTimeout(timeout);
      self.next();
    };

    timeout = setTimeout(function () {
      letsMove();
    }, self.lastAnswerIsCorrect ? self.options.behaviour.timeoutCorrect : self.options.behaviour.timeoutWrong);

    self.onImpatientUser(letsMove);
  };

  /**
   * Listen to impatience
   * @param  {Function} action Callback
   */
  SingleChoiceSet.prototype.onImpatientUser = function (action) {
    this.$container.off('click.impatient keydown.impatient');

    this.$container.one('click.impatient', action);
    this.$container.one('keydown.impatient', function (event) {
      // If return, space or right arrow
      if ([13,32,39].indexOf(event.which)) {
        action();
      }
    });
  };

  /**
   * Go to next slide
   */
  SingleChoiceSet.prototype.next = function () {
    this.move(this.currentIndex + 1);
  };

  /**
   * Creates an xAPI answered event
   *
   * @param {object} question
   * @param {number} userAnswer
   * @param {number} duration
   *
   * @return {H5P.XAPIEvent}
   */
  SingleChoiceSet.prototype.createXApiAnsweredEvent = function (question, userAnswer, duration) {
    var self = this;
    var types = XApiEventBuilder.interactionTypes;

    // creates the definition object
    var definition = XApiEventBuilder.createDefinition()
      .interactionType(types.CHOICE)
      .description(question.question)
      .correctResponsesPattern(self.getXApiCorrectResponsePattern())
      .optional( self.getXApiChoices(question.answers))
      .build();

    // create the result object
    var result = XApiEventBuilder.createResult()
      .response(userAnswer.toString())
      .duration(duration)
      .score((userAnswer === 0) ? 1 : 0, 1)
      .completion(true)
      .success(userAnswer === 0)
      .build();

    return XApiEventBuilder.create()
      .verb(XApiEventBuilder.verbs.ANSWERED)
      .objectDefinition(definition)
      .context(self.contentId, self.subContentId)
      .contentId(self.contentId, question.subContentId)
      .result(result)
      .build();
  };

  /**
   * Returns the 'correct response pattern' for xApi
   *
   * @return {string[]}
   */
  SingleChoiceSet.prototype.getXApiCorrectResponsePattern = function () {
    return [XApiEventBuilder.createCorrectResponsePattern([(0).toString()])]; // is always '0' for SCS
  };

  /**
   * Returns the choices array for xApi statements
   *
   * @param {String[]} answers
   *
   * @return {{ choices: []}}
   */
  SingleChoiceSet.prototype.getXApiChoices = function (answers) {
    var choices = answers.map(function (answer, index) {
      return XApiEventBuilder.createChoice(index.toString(), answer);
    });

    return {
      choices: choices
    };
  };

  /**
   * Handles buttons that are queued for hiding
   */
  SingleChoiceSet.prototype.handleQueuedButtonChanges = function () {
    var self = this;

    if (self.buttonsToBeHidden.length) {
      self.buttonsToBeHidden.forEach(function (id) {
        self.superHideButton(id);
      });
    }
    self.buttonsToBeHidden = [];
  };

  /**
   * Set score and feedback
   *
   * @params {Number} score Number of correct answers
   */
  SingleChoiceSet.prototype.setScore = function (score, noXAPI) {
    var self = this;

    if (!self.choices.length) {
      return;
    }

    var feedbackText = determineOverallFeedback(self.options.overallFeedback , score / self.options.choices.length)
      .replace(':numcorrect', score)
      .replace(':maxscore', self.options.choices.length.toString());

    self.setFeedback(feedbackText, score, self.options.choices.length, self.l10n.scoreBarLabel);

    if (score === self.options.choices.length) {
      self.hideButton('try-again');
      self.hideButton('show-solution');
    }
    else {
      self.showButton('try-again');
      self.showButton('show-solution');
    }
    self.handleQueuedButtonChanges();
    self.scoreTimeout = undefined;

    if (!noXAPI) {
      self.triggerXAPIScored(score, self.options.choices.length, 'completed', true, (100 * score / self.options.choices.length) >= self.options.behaviour.passPercentage);
    }

    self.trigger('resize');
  };

  /**
   * Handler invoked when view solution is selected
   */
  SingleChoiceSet.prototype.handleViewSolution = function () {
    var self = this;

    var $tryAgainButton = $('.h5p-question-try-again', self.$container);
    var $showSolutionButton = $('.h5p-question-show-solution', self.$container);
    var buttons = [self.$muteButton, $tryAgainButton, $showSolutionButton];

    // remove tabbable for buttons in result view
    buttons.forEach(function (button) {
      self.setTabbable(button, false);
    });

    self.solutionView.on('hide', function () {
      // re-add tabbable for buttons in result view
      buttons.forEach(function (button) {
        self.setTabbable(button, true);
      });
      self.toggleAriaVisibility(true);
      // Focus on first button when closing solution view
      self.focusButton();
    });

    self.solutionView.show();
    self.toggleAriaVisibility(false);
  };

  /**
   * Toggle elements visibility to Assistive Technologies
   *
   * @param {boolean} enable Make elements visible
   */
  SingleChoiceSet.prototype.toggleAriaVisibility = function (enable) {
    var self = this;
    var ariaHidden = enable ? '' : 'true';
    if (self.$muteButton) {
      self.$muteButton.attr('aria-hidden', ariaHidden);
    }
    self.progressbar.$progressbar.attr('aria-hidden', ariaHidden);
    self.$choices.attr('aria-hidden', ariaHidden);
  };

  /**
   * Register DOM elements before they are attached.
   * Called from H5P.Question.
   */
  SingleChoiceSet.prototype.registerDomElements = function () {
    // Register task content area.
    this.setContent(this.createQuestion());

    // Register buttons with question.
    this.addButtons();

    // Insert feedback and buttons section on the result slide
    this.insertSectionAtElement('feedback', this.resultSlide.$feedbackContainer);
    this.insertSectionAtElement('scorebar', this.resultSlide.$feedbackContainer);
    this.insertSectionAtElement('buttons', this.resultSlide.$buttonContainer);

    // Question is finished
    if (this.options.choices.length === this.currentIndex) {
      this.trigger('question-finished');
    }

    this.trigger('resize');
  };

  /**
   * Add Buttons to question.
   */
  SingleChoiceSet.prototype.addButtons = function () {
    var self = this;

    if (this.options.behaviour.enableRetry) {
      this.addButton('try-again', this.l10n.retryButtonLabel, function () {
        self.resetTask(true);
      }, self.results.corrects !== self.options.choices.length, {
        'aria-label': this.l10n.a11yRetry,
      });
    }

    if (this.options.behaviour.enableSolutionsButton) {
      this.addButton('show-solution', this.l10n.showSolutionButtonLabel, function () {
        self.showSolutions();
      }, self.results.corrects !== self.options.choices.length, {
        'aria-label': this.l10n.a11yShowSolution,
      });
    }
  };

  /**
   * Create main content
   */
  SingleChoiceSet.prototype.createQuestion = function () {
    var self = this;

    self.progressbar.appendTo(self.$container);
    self.$container.append(self.$choices);

    function toggleMute(event) {
      var $button = $(event.target);
      event.preventDefault();
      self.muted = !self.muted;
      $button.attr('aria-pressed', self.muted);
    }

    // Keep this out of H5P.Question, since we are moving the button & feedback
    // region to the last slide
    if (!this.options.behaviour.autoContinue) {

      var handleNextClick = function () {
        if (self.$nextButton.attr('aria-disabled') !== 'true') {
          self.next();
        }
      };

      self.$nextButton = UI.createButton({
        'class': 'h5p-ssc-next-button',
        'aria-label': self.l10n.nextButtonLabel,
        click: handleNextClick,
        keydown: function (event) {
          switch (event.which) {
            case 13: // Enter
            case 32: // Space
              handleNextClick();
              event.preventDefault();
          }
        },
        appendTo: self.$container
      });
      self.toggleNextButton(false);
    }

    if (self.options.behaviour.soundEffectsEnabled) {
      self.$muteButton = $('<div>', {
        'class': 'h5p-sc-sound-control',
        'tabindex': 0,
        'role': 'button',
        'aria-label': self.l10n.muteButtonLabel,
        'aria-pressed': false,
        'on': {
          'keydown': function (event) {
            switch (event.which) {
              case 13: // Enter
              case 32: // Space
                toggleMute(event);
                break;
            }
          }
        },
        'click': toggleMute,
        prependTo: self.$container
      });
    }

    // Append solution view - hidden by default:
    self.solutionView.appendTo(self.$container);

    self.resize();

    // Hide all other slides than the current one:
    self.$container.addClass('initialized');

    return self.$container;
  };

  /**
   * Resize if something outside resizes
   */
  SingleChoiceSet.prototype.resize = function () {
    var self = this;
    var maxHeight = 0;
    self.choices.forEach(function (choice) {
      var choiceHeight = choice.$choice.outerHeight();
      maxHeight = choiceHeight > maxHeight ? choiceHeight : maxHeight;
    });

    // Set minimum height for choices
    self.$choices.css({minHeight: maxHeight + 'px'});
  };

  /**
   * Disable/enable the next button
   * @param  {boolean} enable
   */
  SingleChoiceSet.prototype.toggleNextButton = function (enable) {
    if (this.$nextButton) {
      this.$nextButton.attr('aria-disabled', !enable);
    }
  };

  /**
   * Will jump to the given slide without any though to animations,
   * current slide etc.
   *
   * @public
   */
  SingleChoiceSet.prototype.recklessJump = function (index) {
    var tX = 'translateX(' + (-index * 100) + '%)';
    this.$choices.css({
      '-webkit-transform': tX,
      '-moz-transform': tX,
      '-ms-transform': tX,
      'transform': tX
    });
    this.progressbar.setProgress(index + 1);
  };

  /**
   * Move to slide n
   * @param  {number} index The slide number    to move to
   * @param {boolean} moveFocus True to set focus on first alternative
   */
  SingleChoiceSet.prototype.move = function (index, moveFocus = true) {
    var self = this;
    if (index === this.currentIndex || index > self.$slides.length-1) {
      return;
    }

    var $previousSlide = self.$slides[self.currentIndex];
    var $currentChoice = self.choices[index];
    var $currentSlide = self.$slides[index];
    var isResultSlide = (index >= self.choices.length);

    self.toggleNextButton(false);

    H5P.Transition.onTransitionEnd(self.$choices, function () {
      $previousSlide.removeClass('h5p-sc-current-slide');

      // on slides with answers focus on first alternative
      // if content is root and not on result slide - always move focus
      if (!isResultSlide && (moveFocus || self.isRoot())) {
        $currentChoice.focusOnAlternative(0);
      }
      // on last slide, focus on try again button
      else {
        self.resultSlide.focusScore();
      }
    }, 600);

    // if should show result slide
    if (isResultSlide) {
      self.setScore(self.results.corrects);
    }

    self.$container.toggleClass('navigatable', !isResultSlide);

    // start timing of new slide
    this.startStopWatch(index);

    // move to slide
    $currentSlide.addClass('h5p-sc-current-slide');
    self.recklessJump(index);

    self.currentIndex = index;
  };

  /**
   * Starts a stopwatch for indexed slide
   *
   * @param {number} index
   */
  SingleChoiceSet.prototype.startStopWatch = function (index) {
    this.stopWatches[index] = this.stopWatches[index] || new StopWatch();
    this.stopWatches[index].start();
  };

  /**
   * Stops a stopwatch for indexed slide
   *
   * @param {number} index
   */
  SingleChoiceSet.prototype.stopStopWatch = function (index) {
    if (this.stopWatches[index]) {
      this.stopWatches[index].stop();
    }
  };

  /**
   * Returns the passed time in seconds of a stopwatch on an indexed slide,
   * or 0 if not existing
   *
   * @param {number} index
   * @return {number}
   */
  SingleChoiceSet.prototype.timePassedInStopWatch = function (index) {
    if (this.stopWatches[index] !== undefined) {
      return this.stopWatches[index].passedTime();
    }
    else {
      // if not created, return no passed time,
      return 0;
    }
  };

  /**
   * Returns the time the user has spent on all questions so far
   *
   * @return {number}
   */
  SingleChoiceSet.prototype.getTotalPassedTime = function () {
    return this.stopWatches
      .filter(function (watch) {
        return watch != undefined;
      })
      .reduce(function (sum, watch) {
        return sum + watch.passedTime();
      }, 0);
  };

  /**
   * The following functions implements the CP and IV - Contracts v 1.0 documented here:
   * http://h5p.org/node/1009
   */
  SingleChoiceSet.prototype.getScore = function () {
    return this.results.corrects;
  };

  SingleChoiceSet.prototype.getMaxScore = function () {
    return this.options.choices.length;
  };

  SingleChoiceSet.prototype.getAnswerGiven = function () {
    return (this.results.corrects + this.results.wrongs) > 0;
  };

  SingleChoiceSet.prototype.getTitle = function () {
    return H5P.createTitle((this.contentData && this.contentData.metadata && this.contentData.metadata.title) ? this.contentData.metadata.title : 'Single Choice Set');
  };

  /**
   * Retrieves the xAPI data necessary for generating result reports.
   *
   * @return {object}
   */
  SingleChoiceSet.prototype.getXAPIData = function () {
    var self = this;

    // create array with userAnswer
    var children =  self.options.choices.map(function (question, index) {
      var userResponse = self.userResponses[index] >= 0 ? self.userResponses[index] : '';
      var duration = self.timePassedInStopWatch(index);
      var event = self.createXApiAnsweredEvent(question, userResponse, duration);

      return {
        statement: event.data.statement
      };
    });

    var result = XApiEventBuilder.createResult()
      .score(self.getScore(), self.getMaxScore())
      .duration(self.getTotalPassedTime())
      .build();

    // creates the definition object
    var definition = XApiEventBuilder.createDefinition()
      .interactionType(XApiEventBuilder.interactionTypes.COMPOUND)
      .build();

    var xAPIEvent = XApiEventBuilder.create()
      .verb(XApiEventBuilder.verbs.ANSWERED)
      .contentId(self.contentId, self.subContentId)
      .context(self.getParentAttribute('contentId'), self.getParentAttribute('subContentId'))
      .objectDefinition(definition)
      .result(result)
      .build();

    return {
      statement: xAPIEvent.data.statement,
      children: children
    };
  };

  /**
   * Returns an attribute from this.parent if it exists
   *
   * @param {string} attributeName
   * @return {*|undefined}
   */
  SingleChoiceSet.prototype.getParentAttribute = function (attributeName) {
    var self = this;

    if (self.parent !== undefined) {
      return self.parent[attributeName];
    }
  };

  SingleChoiceSet.prototype.showSolutions = function () {
    this.handleViewSolution();
  };

  /**
   * Reset all answers. This is equal to refreshing the quiz
   * @param {boolean} moveFocus True to move the focus
   * This prevents loss of focus if reset from within content
   */
  SingleChoiceSet.prototype.resetTask = function (moveFocus = false) {
    var self = this;

    // Close solution view if visible:
    this.solutionView.hide();

    // Reset the user's answers
    var classes = ['h5p-sc-reveal-wrong', 'h5p-sc-reveal-correct', 'h5p-sc-selected', 'h5p-sc-drummed', 'h5p-sc-correct-answer'];
    for (var i = 0; i < classes.length; i++) {
      this.$choices.find('.' + classes[i]).removeClass(classes[i]);
    }
    this.results = {
      corrects: 0,
      wrongs: 0
    };

    this.choices.forEach(function (choice) {
      choice.setAnswered(false);
      choice.resetA11yText();
      choice.resetAriaAttributes();
    });

    this.stopWatches.forEach(function (stopWatch) {
      if (stopWatch) {
        stopWatch.reset();
      }
    });

    this.move(0, moveFocus);

    // Reset userResponses as well
    this.userResponses = [];

    // Wait for transition, then remove feedback.
    H5P.Transition.onTransitionEnd(this.$choices, function () {
      self.removeFeedback();
    }, 600);
  };

  /**
   * Clever comment.
   *
   * @public
   * @returns {object}
   */
  SingleChoiceSet.prototype.getCurrentState = function () {
    return this.userResponses.length > 0
      ? {
        progress: this.currentIndex,
        answers: this.results,
        userResponses: this.userResponses
      }
      : undefined;
  };

  /**
   * Generate A11y friendly text
   * 
   * @param  {number} index
   * @param  {number} currentIndex 
   */
  SingleChoiceSet.prototype.readA11yFriendlyText = function (index, currentIndex) {
    var self = this;
    var correctAnswer = self.$choices.find('.h5p-sc-is-correct')[index].textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
    let selectedOptionText = this.lastAnswerIsCorrect ? self.l10n.correctText : self.l10n.incorrectText;
    // Announce by ARIA label
    if (!self.options.behaviour.autoContinue) {
      // Set text for a11y
      selectedOptionText = this.lastAnswerIsCorrect ? self.l10n.correctText + self.l10n.shouldSelect : self.l10n.incorrectText + self.l10n.shouldNotSelect;
      self.$choices.find('.h5p-sc-current-slide .h5p-sc-is-correct .h5p-sc-a11y').text(self.l10n.shouldSelect);
      self.$choices.find('.h5p-sc-current-slide .h5p-sc-is-wrong .h5p-sc-a11y').text(self.l10n.shouldNotSelect);
      self.$choices.find('.h5p-sc-current-slide .h5p-sc-alternative').eq(currentIndex).find('.h5p-sc-a11y').text(selectedOptionText);

      // Utilize same variable for the read text
      selectedOptionText = this.lastAnswerIsCorrect ? self.l10n.correctText : self.l10n.incorrectText + correctAnswer + self.l10n.shouldSelect;
    }
    self.read(selectedOptionText);
  };

  /**
   * Determine the overall feedback to display for the question.
   * Returns empty string if no matching range is found.
   *
   * @param {Object[]} feedbacks
   * @param {number} scoreRatio
   * @return {string}
   */
  var determineOverallFeedback = function (feedbacks, scoreRatio) {
    scoreRatio = Math.floor(scoreRatio * 100);

    for (var i = 0; i < feedbacks.length; i++) {
      var feedback = feedbacks[i];
      var hasFeedback = (feedback.feedback !== undefined && feedback.feedback.trim().length !== 0);

      if (feedback.from <= scoreRatio && feedback.to >= scoreRatio && hasFeedback) {
        return feedback.feedback;
      }
    }

    return '';
  };

  return SingleChoiceSet;
})(H5P.jQuery, H5P.JoubelUI, H5P.Question, H5P.SingleChoiceSet.SingleChoice, H5P.SingleChoiceSet.SolutionView, H5P.SingleChoiceSet.ResultSlide, H5P.SingleChoiceSet.SoundEffects, H5P.SingleChoiceSet.XApiEventBuilder, H5P.SingleChoiceSet.StopWatch);
;
var H5P = H5P || {};

/**
 * Constructor.
 *
 * @param {Object} params Options for this library.
 * @param {Number} id Content identifier
 * @returns {undefined}
 */
(function ($) {
  H5P.Image = function (params, id, extras) {
    H5P.EventDispatcher.call(this);
    this.extras = extras;

    if (params.file === undefined || !(params.file instanceof Object)) {
      this.placeholder = true;
    }
    else {
      this.source = H5P.getPath(params.file.path, id);
      this.width = params.file.width;
      this.height = params.file.height;
    }

    this.alt = (!params.decorative && params.alt !== undefined) ?
      this.stripHTML(this.htmlDecode(params.alt)) :
      '';

    if (params.title !== undefined) {
      this.title = this.stripHTML(this.htmlDecode(params.title));
    }
  };

  H5P.Image.prototype = Object.create(H5P.EventDispatcher.prototype);
  H5P.Image.prototype.constructor = H5P.Image;

  /**
   * Wipe out the content of the wrapper and put our HTML in it.
   *
   * @param {jQuery} $wrapper
   * @returns {undefined}
   */
  H5P.Image.prototype.attach = function ($wrapper) {
    var self = this;
    var source = this.source;

    if (self.$img === undefined) {
      if(self.placeholder) {
        self.$img = $('<div>', {
          width: '100%',
          height: '100%',
          class: 'h5p-placeholder',
          title: this.title === undefined ? '' : this.title,
          on: {
            load: function () {
              self.trigger('loaded');
            }
          }
        });
      } else {
        self.$img = $('<img>', {
          width: '100%',
          height: '100%',
          src: source,
          alt: this.alt,
          title: this.title === undefined ? '' : this.title,
          on: {
            load: function () {
              self.trigger('loaded');
            }
          }
        });
      }
    }

    $wrapper.addClass('h5p-image').html(self.$img);
  };

  /**
   * Retrieve decoded HTML encoded string.
   *
   * @param {string} input HTML encoded string.
   * @returns {string} Decoded string.
   */
  H5P.Image.prototype.htmlDecode = function (input) {
    const dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  };

  /**
   * Retrieve string without HTML tags.
   *
   * @param {string} input Input string.
   * @returns {string} Output string.
   */
  H5P.Image.prototype.stripHTML = function (html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  return H5P.Image;
}(H5P.jQuery));
;
var H5P = H5P || {};
H5P.Summary = H5P.Summary || {};

H5P.Summary.StopWatch = (function () {
  /**
   * @class {H5P.Summary.StopWatch}
   * @constructor
   */
  function StopWatch() {
    /**
     * @property {number} duration in ms
     */
    this.duration = 0;
  }

  /**
   * Starts the stop watch
   *
   * @public
   * @return {H5P.Summary.StopWatch}
   */
  StopWatch.prototype.start = function(){
    /**
     * @property {number}
     */
    this.startTime = Date.now();
    return this;
  };

  /**
   * Stops the stopwatch, and returns the duration in seconds.
   *
   * @public
   * @return {number}
   */
  StopWatch.prototype.stop = function(){
    this.duration = this.duration + Date.now() - this.startTime;
    return this.passedTime();
  };

  /**
   * Sets the duration to 0
   *
   * @public
   */
  StopWatch.prototype.reset = function(){
    this.duration = 0;
  };

  /**
   * Returns the passed time in seconds
   *
   * @public
   * @return {number}
   */
  StopWatch.prototype.passedTime = function(){
    return Math.round(this.duration / 10) / 100;
  };

  return StopWatch;
})();
;
var H5P = H5P || {};
H5P.Summary = H5P.Summary || {};

H5P.Summary.XApiEventBuilder = (function ($, EventDispatcher) {
  /**
   * @typedef {object} LocalizedString
   * @property {string} en-US
   */

  /**
   * @class {H5P.Summary.XApiEventDefinitionBuilder}
   * @constructor
   */
  function XApiEventDefinitionBuilder(){
    EventDispatcher.call(this);
    /**
     * @property {object} attributes
     * @property {string} attributes.name
     * @property {string} attributes.description
     * @property {string} attributes.interactionType
     * @property {string} attributes.correctResponsesPattern
     * @property {object} attributes.optional
     */
    this.attributes = {};
  }

  XApiEventDefinitionBuilder.prototype = Object.create(EventDispatcher.prototype);
  XApiEventDefinitionBuilder.prototype.constructor = XApiEventDefinitionBuilder;


  /**
   * Sets name
   * @param {string} name
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.name = function (name) {
    this.attributes.name = name;
    return this;
  };

  /**
   * Question text and any additional information to generate the report.
   * @param {string} description
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.description = function (description) {
    this.attributes.description = description;
    return this;
  };

  /**
   * Type of the interaction.
   * @param {string} interactionType
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types|xAPI Spec}
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.interactionType = function (interactionType) {
    this.attributes.interactionType = interactionType;
    return this;
  };

  /**
   * A pattern for determining the correct answers of the interaction
   * @param {string[]} correctResponsesPattern
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#response-patterns|xAPI Spec}
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.correctResponsesPattern = function (correctResponsesPattern) {
    this.attributes.correctResponsesPattern = correctResponsesPattern;
    return this;
  };

  /**
   * Sets optional attributes
   * @param {object} optional Can have one of the following configuration objects: choices, scale, source, target, steps
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventDefinitionBuilder.prototype.optional = function (optional) {
    this.attributes.optional = optional;
    return this;
  };

  /**
   * @return {object}
   */
  XApiEventDefinitionBuilder.prototype.build = function () {
    var definition = {};

    // sets attributes
    setAttribute(definition, 'name', localizeToEnUS(this.attributes.name));
    setAttribute(definition, 'description', localizeToEnUS(this.attributes.description));
    setAttribute(definition, 'interactionType', this.attributes.interactionType);
    setAttribute(definition, 'correctResponsesPattern', this.attributes.correctResponsesPattern);
    setAttribute(definition, 'type', 'http://adlnet.gov/expapi/activities/cmi.interaction');

    // adds the optional object to the definition
    if(this.attributes.optional){
      $.extend(definition, this.attributes.optional);
    }

    return definition;
  };

  // -----------------------------------------------------

  /**
   *
   * @constructor
   */
  function XApiEventResultBuilder(){
    EventDispatcher.call(this);
    /**
     * @property {object} attributes
     * @property {string} attributes.completion
     * @property {boolean} attributes.success
     * @property {boolean} attributes.response
     * @property {number} attributes.rawScore
     * @property {number} attributes.maxScore
     */
    this.attributes = {};
  }

  XApiEventResultBuilder.prototype = Object.create(EventDispatcher.prototype);
  XApiEventResultBuilder.prototype.constructor = XApiEventResultBuilder;

  /**
   * @param {boolean} completion
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.completion = function (completion) {
    this.attributes.completion = completion;
    return this;
  };

  /**
   * @param {boolean} success
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.success = function (success) {
    this.attributes.success = success;
    return this;
  };

  /**
   * @param {number} duration The duraction in seconds
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.duration = function (duration) {
    this.attributes.duration = duration;
    return this;
  };

  /**
   * Sets response
   * @param {string|string[]} response
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.response = function (response) {
    this.attributes.response = (typeof response === 'string') ? response : response.join('[,]');
    return this;
  };

  /**
   * Sets the score, and max score
   * @param {number} score
   * @param {number} maxScore
   * @return {XApiEventResultBuilder}
   */
  XApiEventResultBuilder.prototype.score = function (score, maxScore) {
    this.attributes.rawScore = score;
    this.attributes.maxScore = maxScore;
    return this;
  };

  /**
   * Builds the result object
   * @return {object}
   */
  XApiEventResultBuilder.prototype.build = function () {
    var result = {};

    setAttribute(result, 'response', this.attributes.response);
    setAttribute(result, 'completion', this.attributes.completion);
    setAttribute(result, 'success', this.attributes.success);

    if(isDefined(this.attributes.duration)){
      setAttribute(result, 'duration','PT' +  this.attributes.duration + 'S');
    }

    // sets score
    if (isDefined(this.attributes.rawScore)) {
      result.score = {};
      setAttribute(result.score, 'raw', this.attributes.rawScore);

      if (isDefined(this.attributes.maxScore) && this.attributes.maxScore > 0) {
        setAttribute(result.score, 'min', 0);
        setAttribute(result.score, 'max', this.attributes.maxScore);
        setAttribute(result.score, 'min', 0);
        setAttribute(result.score, 'scaled', Math.round(this.attributes.rawScore / this.attributes.maxScore * 10000) / 10000);
      }
    }

    return result;
  };

  // -----------------------------------------------------

  /**
   * @class {H5P.Summary.XApiEventBuilder}
   */
  function XApiEventBuilder() {
    EventDispatcher.call(this);
    /**
     * @property {object} attributes
     * @property {string} attributes.contentId
     * @property {string} attributes.subContentId
     */
    this.attributes = {};
  }

  XApiEventBuilder.prototype = Object.create(EventDispatcher.prototype);
  XApiEventBuilder.prototype.constructor = XApiEventBuilder;


  /**
   * @param {object} verb
   *
   * @public
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.verb = function (verb) {
    this.attributes.verb = verb;
    return this;
  };

  /**
   * @param {string} name
   * @param {string} mbox
   * @param {string} objectType
   *
   * @public
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.actor = function (name, mbox, objectType) {
    this.attributes.actor = {
      name: name,
      mbox: mbox,
      objectType: objectType
    };

    return this;
  };

  /**
   * Sets contentId
   * @param {string} contentId
   * @param {string} [subContentId]
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.contentId = function (contentId, subContentId) {
    this.attributes.contentId = contentId;
    this.attributes.subContentId = subContentId;
    return this;
  };

  /**
   * Sets parent in context
   * @param {string} parentContentId
   * @param {string} [parentSubContentId]
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.context = function (parentContentId, parentSubContentId) {
    this.attributes.parentContentId = parentContentId;
    this.attributes.parentSubContentId = parentSubContentId;
    return this;
  };

  /**
   * @param {object} result
   *
   * @public
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.result = function (result) {
    this.attributes.result = result;
    return this;
  };

  /**
   * @param {object} objectDefinition
   *
   * @public
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.prototype.objectDefinition = function (objectDefinition) {
    this.attributes.objectDefinition = objectDefinition;
    return this;
  };

  /**
   * Returns the buildt event
   * @public
   * @return {H5P.XAPIEvent}
   */
  XApiEventBuilder.prototype.build = function(){
    var event = new H5P.XAPIEvent();

    event.setActor();
    event.setVerb(this.attributes.verb);

    // sets context
    if(this.attributes.parentContentId || this.attributes.parentSubContentId){
      event.data.statement.context = {
        'contextActivities': {
          'parent': [
            {
              'id': getContentXAPIId(this.attributes.parentContentId, this.attributes.parentSubContentId),
              'objectType': "Activity"
            }
          ]
        }
      };
    }

    event.data.statement.object = {
      'id': getContentXAPIId(this.attributes.contentId, this.attributes.subContentId),
      'objectType': 'Activity'
    };

    setAttribute(event.data, 'actor', this.attributes.actor);
    setAttribute(event.data.statement, 'result', this.attributes.result);
    setAttribute(event.data.statement.object, 'definition', this.attributes.objectDefinition);

    // sets h5p specific attributes
    if(event.data.statement.object.definition && (this.attributes.contentId || this.attributes.subContentId)) {
      var extensions = event.data.statement.object.definition.extensions = {};
      setAttribute(extensions, 'http://h5p.org/x-api/h5p-local-content-id', this.attributes.contentId);
      setAttribute(extensions, 'http://h5p.org/x-api/h5p-subContentId', this.attributes.subContentId);
    }

    return event;
  };

  /**
   * Creates a Localized String object for en-US
   *
   * @param str
   * @return {LocalizedString}
   */
  var localizeToEnUS = function(str){
    if(str != undefined){
      return {
        'en-US': cleanString(str)
      };
    }
  };

  /**
   * Generates an id for the content
   * @param {string} contentId
   * @param {string} [subContentId]
   *
   * @see {@link https://github.com/h5p/h5p-php-library/blob/master/js/h5p-x-api-event.js#L240-L249}
   * @return {string}
   */
  var getContentXAPIId = function (contentId, subContentId) {
    const cid = 'cid-' + contentId;
    if (contentId && H5PIntegration && H5PIntegration.contents && H5PIntegration.contents[cid]) {
      var id = H5PIntegration.contents[cid].url;

      if (subContentId) {
        id += '?subContentId=' +  subContentId;
      }

      return id;
    }
  };

  /**
   * Removes html elements from string
   *
   * @param {string} str
   * @return {string}
   */
  var cleanString = function (str) {
    return $('<div>' + str + '</div>').text().trim();
  };

  var isDefined = function(val){
    return typeof val !== 'undefined';
  };

  function setAttribute(obj, key, value, required){
    if(isDefined(value)){
      obj[key] = value;
    } else if (required) {
      console.error("xApiEventBuilder: No value for [" + key + "] in", obj);
    }
  }

  /**
   * Creates a new XApiEventBuilder
   *
   * @public
   * @static
   * @return {H5P.Summary.XApiEventBuilder}
   */
  XApiEventBuilder.create = function(){
    return new XApiEventBuilder();
  };

  /**
   * Creates a new XApiEventDefinitionBuilder
   *
   * @public
   * @static
   * @return {XApiEventDefinitionBuilder}
   */
  XApiEventBuilder.createDefinition = function(){
    return new XApiEventDefinitionBuilder();
  };

  /**
   * Creates a new XApiEventDefinitionBuilder
   *
   * @public
   * @static
   * @return {XApiEventResultBuilder}
   */
  XApiEventBuilder.createResult = function(){
    return new XApiEventResultBuilder();
  };

  /**
   * Returns choice to be used with 'cmi.interaction' for Activity of type 'choice'
   *
   * @param {string} id
   * @param {string} description
   *
   * @public
   * @static
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#choice|xAPI-Spec}
   * @return {object}
   */
  XApiEventBuilder.createChoice = function(id, description){
    return {
      id: id,
      description: localizeToEnUS(description)
    };
  };

  /**
   * Takes an array of correct ids, and joins them to a 'correct response pattern'
   *
   * @param {string[]} ids
   *
   * @public
   * @static
   * @see {@link https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#choice|xAPI-Spec}
   * @return {string}
   */
  XApiEventBuilder.createCorrectResponsePattern = function(ids){
    return ids.join('[,]');
  };

  /**
   * Interaction types
   *
   * @readonly
   * @enum {String}
   */
  XApiEventBuilder.interactionTypes = {
    CHOICE: 'choice',
    COMPOUND: 'compound',
    FILL_IN: 'fill-in',
    MATCHING: 'matching',
    TRUE_FALSE: 'true-false'
  };

  /**
   * Verbs
   *
   * @readonly
   * @enum {String}
   */
  XApiEventBuilder.verbs = {
    ANSWERED: 'answered'
  };

  return XApiEventBuilder;
})(H5P.jQuery, H5P.EventDispatcher);
;
H5P.Summary = (function ($, Question, XApiEventBuilder, StopWatch) {

  var summaryId = 0;

  function Summary(options, contentId, contentData) {
    if (!(this instanceof H5P.Summary)) {
      return new H5P.Summary(options, contentId);
    }

    this.id = this.contentId = contentId;
    this.contentData = contentData;
    this.summaryId = summaryId;
    Question.call(this, 'summary');
    this.offset = 0;
    this.score = 0;
    this.progress = 0;
    this.answers = [];
    this.answer = [];
    this.errorCounts = [];

    summaryId += 1;

    /**
     * The key is panel index, returns an array of the answer indexes the user tried.
     *
     * @property {number[][]}
     */
    this.userResponses = [];

    /**
     * The first key is panel index, and the second key is data-bit, value is index in panel
     *
     * @property {number[][]}
     */
    this.dataBitMap = [];

    // Remove empty summary to avoid JS-errors
    if (options.summaries) {
      options.summaries = options.summaries.filter(function (element) {
        return element.summary !== undefined;
      });
    }

    if (contentData && contentData.previousState !== undefined &&
        contentData.previousState.progress !== undefined &&
        contentData.previousState.answers) {
      this.progress = contentData.previousState.progress || this.progress;
      this.answers = contentData.previousState.answers || this.answers;

      var currentProgress = this.progress;

      // Do not count score screen as an error
      if (this.progress >= options.summaries.length) {
        currentProgress = options.summaries.length - 1;
      }

      for (var i = 0; i <= currentProgress; i++) {
        if (this.errorCounts[i] === undefined) {
          this.errorCounts[i] = 0;
        }
        if (this.answers[i]) {
          this.score += this.answers[i].length;
          this.errorCounts[i]++;
        }
      }
    }
    var that = this;

    /**
     * @property {StopWatch[]} Stop watches for tracking duration of slides
     */
    this.stopWatches = [];
    this.startStopWatch(this.progress);

    this.options = H5P.jQuery.extend({}, {
      overallFeedback: [],
      resultLabel: "Your result:",
      intro: "Choose the correct statement.",
      solvedLabel: "Solved:",
      scoreLabel: "Wrong answers:",
      labelCorrect: "Correct.",
      labelIncorrect: 'Incorrect! Please try again.',
      labelCorrectAnswers: "List of correct answers.",
      alternativeIncorrectLabel: 'Incorrect',
      postUserStatistics: (H5P.postUserStatistics === true),
      tipButtonLabel: 'Show tip',
      scoreBarLabel: 'You got :num out of :total points',
      progressText: 'Progress :num of :total'
    }, options);

    this.summaries = that.options.summaries;

    // Prevent the score bar from interrupting the progress counter
    this.setBehaviour({disableReadSpeaker: true});

    // Required questiontype contract function
    this.showSolutions = function() {
      // intentionally left blank, no solution view exists
    };

    // Required questiontype contract function
    this.getMaxScore = function() {
      return this.summaries ? this.summaries.length : 0;
    };

    this.getScore = function() {
      var self = this;

      // count single correct answers
      return self.summaries ? self.summaries.reduce(function(result, panel, index){
        var userResponse = self.userResponses[index] || [];

        return result + (self.correctOnFirstTry(userResponse) ? 1 : 0);
      }, 0) : 0;
    };

    this.getTitle = function() {
      return H5P.createTitle((this.contentData && this.contentData.metadata && this.contentData.metadata.title) ? this.contentData.metadata.title: 'Summary');
    };

    this.getCurrentState = function () {
      return {
        progress: this.progress || null,
        answers: this.answers
      };
    };
  }

  Summary.prototype = Object.create(Question.prototype);
  Summary.prototype.constructor = Summary;

  /**
   * Registers DOM elements before they are attached.
   * Called from H5P.Question.
   */
  Summary.prototype.registerDomElements = function () {
    // Register task content area
    this.setContent(this.createQuestion());
  };

  // Function for attaching the multichoice to a DOM element.
  Summary.prototype.createQuestion = function() {
    var that = this;
    var id = 0; // element counter
    // variable to capture currently focused option.
    var currentFocusedOption;
    var elements = [];
    var $ = H5P.jQuery;
    this.$myDom = $('<div>', {
      'class': 'summary-content'
    });

    this.$answerAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'assertive',
      appendTo: this.$myDom,
    });

    if (that.summaries === undefined || that.summaries.length === 0) {
      return;
    }

    // Create array objects
    for (var panelIndex = 0; panelIndex < that.summaries.length; panelIndex++) {
      if (!(that.summaries[panelIndex].summary && that.summaries[panelIndex].summary.length)) {
        continue;
      }

      elements[panelIndex] = {
        tip: that.summaries[panelIndex].tip,
        summaries: []
      };

      for (var summaryIndex = 0; summaryIndex < that.summaries[panelIndex].summary.length; summaryIndex++) {
        var isAnswer = (summaryIndex === 0);
        that.answer[id] = isAnswer; // First claim is correct

        // create mapping from data-bit to index in panel
        that.dataBitMap[panelIndex] = this.dataBitMap[panelIndex] || [];
        that.dataBitMap[panelIndex][id] = summaryIndex;

        // checks the answer and updates the user response array
        if(that.answers[panelIndex] && (that.answers[panelIndex].indexOf(id) !== -1)){
          this.storeUserResponse(panelIndex, summaryIndex);
        }

        // adds to elements
        elements[panelIndex].summaries[summaryIndex] = {
          id: id++,
          text: that.summaries[panelIndex].summary[summaryIndex]
        };
      }

      // if we have progressed passed this point, the success pattern must also be saved
      if(panelIndex < that.progress){
        this.storeUserResponse(panelIndex, 0);
      }

      // Randomize elements
      for (var k = elements[panelIndex].summaries.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var temp = elements[panelIndex].summaries[k];
        elements[panelIndex].summaries[k] = elements[panelIndex].summaries[j];
        elements[panelIndex].summaries[j] = temp;
      }
    }

    // Create content panels
    var $summary_container = $('<div class="summary-container"></div>');
    var $summary_list = $('<ul role="list" aria-labelledby="answerListHeading-'+that.summaryId+'"></ul>');
    var $evaluation = $('<div class="summary-evaluation"></div>');
    var $evaluation_content = $('<div id="questionDesc-'+that.summaryId+'" class="summary-evaluation-content">' + that.options.intro + '</div>');
    var $score = $('<div class="summary-score" role="status"></div>');
    var $options = $('<div class="summary-options"></div>');
    var $progress = $('<div class="summary-progress" aria-live="polite" role="status"></div>');
    var $progressNumeric = $('<div class="summary-progress-numeric" aria-hidden="true"></div>');
    var options_padding = parseInt($options.css('paddingLeft'));
    // content div added for readspeaker that indicates list of correct answers.
    var $answersListHeading = $('<div id="answerListHeading-'+that.summaryId+'" class="h5p-hidden-read">' + that.options.labelCorrectAnswers + '</div>');

    $score
      .html(that.options.scoreLabel + ' ' + this.score)
      .toggleClass('visible', this.score > 0);

    // Insert content
    // aria-hidden = true added for readspeaker to avoid reading empty answers list.
    $summary_container.attr("aria-hidden", "true");
    $summary_container.html($answersListHeading);
    $summary_container.append($summary_list);
    this.$myDom.append($summary_container);
    this.$myDom.append($evaluation);
    this.$myDom.append($options);
    $evaluation.append($evaluation_content);
    $evaluation.append($evaluation);
    $evaluation.append($progress);
    $evaluation.append($progressNumeric);
    $evaluation.append($score);

    /**
     * Handle selected alternative
     *
     * @param {jQuery} $el Selected element
     * @param {boolean} [setFocus] Set focus on first element of next panel.
     *  Used when alt was selected with keyboard.
     */
    var selectedAlt = function ($el, setFocus) {
      var nodeId = Number($el.attr('data-bit'));
      var panelId = Number($el.parent().data('panel'));
      var isRadioClicked = $el.attr('aria-checked');
      if(isRadioClicked == 'true') return;

      if (that.errorCounts[panelId] === undefined) {
        that.errorCounts[panelId] = 0;
      }

      that.storeUserResponse(panelId, nodeId);

      // Correct answer?
      if (that.answer[nodeId]) {
        that.announceAnswer(true);
        that.stopStopWatch(panelId);

        that.progress++;
        var position = $el.position();
        var summary = $summary_list.position();
        var $answer = $('<li role="listitem">' + $el.html() + '</li>');

        $progressNumeric.html(that.options.solvedLabel + ' '  + (panelId + 1) + '/' + that.summaries.length);

        var interpolatedProgressText = that.options.progressText
          .replace(':num', panelId + 1)
          .replace(':total', that.summaries.length);
        $progress.html(interpolatedProgressText);

        $el.attr("aria-checked", "true");

        // Insert correct claim into summary list
        $summary_list.append($answer);
        $summary_container.addClass('has-results');
        // change aria-hidden property as when correct answer is added inside list at top
        $summary_container.attr("aria-hidden", "false");
        that.adjustTargetHeight($summary_container, $summary_list, $answer);


        // Move into position over clicked element
        $answer.css({display: 'block', width: $el.css('width'), height: $el.css('height')});
        $answer.css({position: 'absolute', top: position.top, left: position.left});
        $answer.css({backgroundColor: '#9dd8bb', border: ''});
        setTimeout(function () {
          $answer.css({backgroundColor: ''});
        }, 1);
        //$answer.animate({backgroundColor: '#eee'}, 'slow');

        var panel = parseInt($el.parent().attr('data-panel'));
        var $curr_panel = $('.h5p-panel:eq(' + panel + ')', that.$myDom);
        var $next_panel = $('.h5p-panel:eq(' + (panel + 1) + ')', that.$myDom);
        var finished = ($next_panel.length === 0);
        // Disable panel while waiting for animation
        $curr_panel.addClass('panel-disabled');

        // Update tip:
        $evaluation_content.find('.joubel-tip-container').remove();
        if (elements[that.progress] !== undefined &&
          elements[that.progress].tip !== undefined &&
          elements[that.progress].tip.trim().length > 0) {
          $evaluation_content.append(H5P.JoubelUI.createTip(elements[that.progress].tip, {
            tipLabel: that.options.tipButtonLabel
          }));
        }

        $answer.animate(
          {
            top: summary.top + that.offset,
            left: '-=' + options_padding + 'px',
            width: '+=' + (options_padding * 2) + 'px'
          },
          {
            complete: function() {
              // Remove position (becomes inline);
              $(this).css('position', '').css({
                width: '',
                height: '',
                top: '',
                left: ''
              });
              $summary_container.css('height', '');

              // Calculate offset for next summary item
              var tpadding = parseInt($answer.css('paddingTop')) * 2;
              var tmargin = parseInt($answer.css('marginBottom'));
              var theight = parseInt($answer.css('height'));
              that.offset += theight + tpadding + tmargin + 1;

              // Fade out current panel
              $curr_panel.fadeOut('fast', function () {
                $curr_panel.parent().css('height', 'auto');
                // Show next panel if present
                if (!finished) {
                  // start next timer
                  that.startStopWatch(that.progress);

                  $next_panel.fadeIn('fast');

                  // Focus first element of next panel
                  if (setFocus) {
                    $next_panel.children().get(0).focus();
                  }
                } else {
                  // Hide intermediate evaluation
                  $evaluation_content.html(that.options.resultLabel);

                  that.doFinalEvaluation();
                }
                that.trigger('resize');
              });
            }
          }
        );
      }
      else {
        that.announceAnswer(false);
        // Remove event handler (prevent repeated clicks) and mouseover effect
        $el.off('click');
        $el.addClass('summary-failed');
        const label = that.options.alternativeIncorrectLabel + '. '
          + $el.text();
        $el.attr('aria-label', label);
        $el.removeClass('summary-claim-unclicked');
        $el.attr("aria-checked", "true");
        $evaluation.children('.summary-score').toggleClass('visible', true);
        $score.html(that.options.scoreLabel + ' ' + (++that.score));
        that.errorCounts[panelId]++;
        if (that.answers[panelId] === undefined) {
          that.answers[panelId] = [];
        }
        that.answers[panelId].push(nodeId);
      }

      that.trigger('resize');
      that.triggerXAPI('interacted');

      // Trigger answered xAPI event on first try for the current
      // statement group
      if (that.userResponses[panelId].length === 1) {
        that.trigger(that.createXApiAnsweredEvent(
          that.summaries[panelId],
          that.userResponses[panelId] || [],
          panelId,
          that.timePassedInStopWatch(panelId)));
      }

      // Trigger overall answered xAPI event when finished
      if (finished) {
        that.triggerXAPIScored(that.getScore(), that.getMaxScore(), 'answered');
      }
    };

    // Initialize the visible and invisible progress counters
    $progressNumeric.html(that.options.solvedLabel + ' ' + this.progress + '/' + that.summaries.length);
    var interpolatedProgressText = that.options.progressText
      .replace(':num', that.progress)
      .replace(':total', that.summaries.length);
    $progress.html(interpolatedProgressText);

    // Add elements to content
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      if (i < that.progress) { // i is panelId
        for (var j = 0; j < element.summaries.length; j++) {
          var sum = element.summaries[j];
          if (that.answer[sum.id]) {
            $summary_list.append('<li style="display:block">' + sum.text + '</li>');
            $summary_container.addClass('has-results');
            break;
          }
        }
        // Cannot use continue; due to id/animation system
      }

      // added aria-labelledby property for readspeaker to read, when first option receive focus
      var $page = $('<ul aria-labelledby="questionDesc-'+that.summaryId+'" role="radiogroup" class="h5p-panel" data-panel="' + i + '"></ul>');


      // Create initial tip for first summary-list if tip is available
      if (i==0 && element.tip !== undefined && element.tip.trim().length > 0) {
        $evaluation_content.append(H5P.JoubelUI.createTip(element.tip, {
          tipLabel: that.options.tipButtonLabel
        }));
      }

      for (var j = 0; j < element.summaries.length; j++) {
        var summaryLineClass = 'summary-claim-unclicked';

        // If progress is at current task
        if (that.progress === i && that.answers[that.progress]) {
          // Check if there are any previous wrong answers.
          for (var k = 0; k < that.answers[that.progress].length; k++) {
            if (that.answers[that.progress][k] === element.summaries[j].id) {
              summaryLineClass = 'summary-failed';
              break;
            }
          }
        }

        var $node = $('' +
          '<li role="radio" aria-checked="false" data-name="'+j+'" data-bit="' + element.summaries[j].id + '" class="' + summaryLineClass + '">' +
            element.summaries[j].text +
          '</li>');
        // added tabindex = 0 for the first option to avoid accessing rest of the options via TAB
        (j == 0) ? $node.attr("tabindex", "0") : $node.attr("tabindex", "-1");

        $node.on('focus', function() {
          var ind = $(this).attr('data-name');
          setFocusIndex(ind);
        });

        // function captures the index of currently focused option
        var setFocusIndex = function(idx) {
          currentFocusedOption = idx;
        };

        // Do not add click event for failed nodes
        if (summaryLineClass === 'summary-failed') {
          $page.append($node);
          continue;
        }

        $node.click(function() {
          selectedAlt($(this));
        }).keydown(function (e) {
          switch (e.which) {
            case 13: // Enter
            case 32: // Space
              selectedAlt($(this), true);
              e.preventDefault();
              break;

            case 37: // Left Arrow
            case 38: // Up Arrow
              // Go to previous Option
              that.gotoPreviousOption(that, currentFocusedOption);
              e.preventDefault();
              break;

            case 39: // Right Arrow
            case 40: // Down Arrow
              // Go to next Option
              that.gotoNextOption(that, currentFocusedOption);
              e.preventDefault();
              break;
          }
        });

        $page.append($node);
      }

      $options.append($page);
    }

    if (that.progress === elements.length) {
      $evaluation_content.html(that.options.resultLabel);
      that.doFinalEvaluation();
    }
    else {
      // Show first panel
      $('.h5p-panel:eq(' + (that.progress) + ')', that.$myDom).css({display: 'block'});
      if (that.progress) {
        that.offset = ($('.summary-claim-unclicked:visible:first', that.$myDom).outerHeight() * that.errorCounts.length);
      }
    }

    that.trigger('resize');

    return this.$myDom;
  };

  /**
   * Announce if answered alternative was correct or wrong
   * @param isCorrect
   */
  Summary.prototype.announceAnswer = function (isCorrect) {
    const announcement = isCorrect
      ? this.options.labelCorrect
      : this.options.labelIncorrect;
    this.$answerAnnouncer.html(announcement);

    // Remove text so it can't be navigated to and read at a later point
    setTimeout(function () {
      this.$answerAnnouncer.html('');
    }.bind(this), 100);
  };

  /**
   * Returns true if answers have been given
   *
   * @return {boolean}
   */
  Summary.prototype.getAnswerGiven = function () {
    return this.errorCounts.length > 0;
  };

  /**
   * Handles moving the focus from the current option to the previous option and changes tabindex accorindgly
   *
   */
  Summary.prototype.gotoPreviousOption = function (that, currentFocusedOption) {
    this.currentFocusedOption = currentFocusedOption;
    var totOptions = that.summaries[that.progress].summary.length;
    var prevRadioEle = $("ul[data-panel="+that.progress+"] li[role='radio']", this.$myDom);

    //prevRadioEle.removeAttr("tabindex");
    prevRadioEle.attr("tabindex", "-1");
    this.currentFocusedOption--;

    if(this.currentFocusedOption < 0) {
        var num = totOptions - 1;
        prevRadioEle.eq(num).attr("tabindex", "0");
        prevRadioEle.eq(num).focus();
      }
      else {
        prevRadioEle.eq(this.currentFocusedOption).attr("tabindex", "0");
        prevRadioEle.eq(this.currentFocusedOption).focus();
      }
    };

  /**
   * Handles moving the focus from the current option to the next option and changes tabindex accorindgly
   *
   */
  Summary.prototype.gotoNextOption = function (that, currentFocusedOption) {
    this.currentFocusedOption = currentFocusedOption;
    var totOptions = that.summaries[that.progress].summary.length;
    var nextRadioEle = $("ul[data-panel="+that.progress+"] li[role='radio']", this.$myDom);

    //nextRadioEle.removeAttr("tabindex");
    nextRadioEle.attr("tabindex", "-1");
    this.currentFocusedOption++;

    if(this.currentFocusedOption == totOptions) {
      nextRadioEle.eq(0).attr("tabindex", "0");
      nextRadioEle.eq(0).focus();
    }
    else {
      nextRadioEle.eq(this.currentFocusedOption).attr("tabindex", "0");
      nextRadioEle.eq(this.currentFocusedOption).focus();
    }
  };

  /**
   * Calculate final score and display feedback.
   *
   * @param container
   * @param options_panel
   * @param list
   * @param score
   */
  Summary.prototype.doFinalEvaluation = function () {
    var that = this;
    var errorCount = this.countErrors();
    var maxScore = that.summaries.length;
    var score = maxScore - errorCount;

    // Calculate percentage
    var percent = 100 - (errorCount / that.errorCounts.length * 100);

    // Show final evaluation
    var summary = H5P.Question.determineOverallFeedback(that.options.overallFeedback, percent / 100)
      .replace('@score', score)
      .replace('@total', maxScore)
      .replace('@percent', Math.round(percent));

    $(".summary-evaluation-content", this.$myDom).removeAttr("tabindex");

    var scoreBarLabel = that.options.scoreBarLabel.replace(':num', score).replace(':total', maxScore);

    this.setFeedback(summary, score, maxScore, scoreBarLabel);

    // Only read out the score after the progress is read
    setTimeout(function() {
      that.setBehaviour({disableReadSpeaker: false});
      that.readFeedback();
      that.read(scoreBarLabel);
    }, 3000);

    that.trigger('resize');
  };

  /**
   * Resets the complete task back to its' initial state.
   * Used for contracts.
   */
  Summary.prototype.resetTask = function () {
    this.offset = 0;
    this.score = 0;
    this.progress = 0;
    this.answers = [];
    this.answer = [];
    this.errorCounts = [];
    this.userResponses = [];
    this.dataBitMap = [];

    if (this.$myDom) {
      const contentWrapper = this.$myDom[0].parentNode;
      contentWrapper.innerHTML = '';
      this.createQuestion();
      contentWrapper.appendChild(this.$myDom[0]);
      this.removeFeedback();
    }
  };

  /**
   * Adjust height of container.
   *
   * @param container
   * @param elements
   * @param el
   */
  Summary.prototype.adjustTargetHeight = function (container, elements, el) {
    var new_height = parseInt(elements.outerHeight()) + parseInt(el.outerHeight()) + parseInt(el.css('marginBottom')) + parseInt(el.css('marginTop'));
    if (new_height > parseInt(container.css('height'))) {
      container.animate({height: new_height});
    }
  };

  /**
   * Count amount of wrong answers
   *
   * @returns {number}
   */
  Summary.prototype.countErrors = function() {
    var error_count = 0;

    // Count boards without errors
    for (var i = 0; i < this.summaries.length; i++) {
      if (this.errorCounts[i] === undefined) {
        error_count++;
      }
      else {
        error_count += this.errorCounts[i] ? 1 : 0;
      }
    }

    return error_count;
  };

  /**
   * Returns the choices array for xApi statements
   *
   * @param {String[]} answers
   *
   * @return {{ choices: []}}
   */
  Summary.prototype.getXApiChoices = function (answers) {
    var choices = answers.map(function(answer, index){
      return XApiEventBuilder.createChoice(index.toString(), answer);
    });

    return {
      choices: choices
    };
  };

  /**
   * Saves the user response
   *
   * @param {number} questionIndex
   * @param {number} answerIndex
   */
  Summary.prototype.storeUserResponse = function (questionIndex, answerIndex) {
    var self = this;
    if(self.userResponses[questionIndex] === undefined){
      self.userResponses[questionIndex] = [];
    }

    self.userResponses[questionIndex].push(this.dataBitMap[questionIndex][answerIndex]);
  };

  /**
   * Starts a stopwatch for indexed slide
   *
   * @param {number} index
   */
  Summary.prototype.startStopWatch = function (index) {
    this.stopWatches[index] = this.stopWatches[index] || new StopWatch();
    this.stopWatches[index].start();
  };

  /**
   * Stops a stopwatch for indexed slide
   *
   * @param {number} [index]
   */
  Summary.prototype.stopStopWatch = function (index) {
    if(this.stopWatches[index]){
      this.stopWatches[index].stop();
    }
  };

  /**
   * Returns the passed time in seconds of a stopwatch on an indexed slide,
   * or 0 if not existing
   *
   * @param {number} index
   * @return {number}
   */
  Summary.prototype.timePassedInStopWatch = function (index) {
    if(this.stopWatches[index] !== undefined){
      return this.stopWatches[index].passedTime();
    }
    else {
      // if not created, return no passed time,
      return 0;
    }
  };

  /**
   * Returns the time the user has spent on all questions so far
   *
   * @return {number}
   */
  Summary.prototype.getTotalPassedTime = function () {
    return this.stopWatches
      .filter(function(watch){
        return watch !== undefined;
      })
      .reduce(function(sum, watch){
        return sum + watch.passedTime();
      }, 0);
  };

  /**
   * Creates an xAPI answered event for a single statement list
   *
   * @param {object} panel
   * @param {number[]} userAnswer
   * @param {number} panelIndex
   * @param {number} duration
   *
   * @return {H5P.XAPIEvent}
   */
  Summary.prototype.createXApiAnsweredEvent = function (panel, userAnswer, panelIndex, duration) {
    var self = this;

    // creates the definition object
    var definition = XApiEventBuilder.createDefinition()
      .name('Summary statement')
      .description(self.options.intro)
      .interactionType(XApiEventBuilder.interactionTypes.CHOICE)
      .correctResponsesPattern(['0'])
      .optional(self.getXApiChoices(panel.summary))
      .build();

    // create the result object
    var result = XApiEventBuilder.createResult()
      .response(userAnswer.join('[,]'))
      .duration(duration)
      .score((self.correctOnFirstTry(userAnswer) ? 1 : 0), 1)
      .build();

    return XApiEventBuilder.create()
      .verb(XApiEventBuilder.verbs.ANSWERED)
      .objectDefinition(definition)
      .context(self.contentId, self.subContentId)
      .contentId(self.contentId, panel.subContentId)
      .result(result)
      .build();
  };

  Summary.prototype.correctOnFirstTry = function(userAnswer){
    return (userAnswer.length === 1) && userAnswer[0] === 0;
  };

  /**
   * Retrieves the xAPI data necessary for generating result reports.
   *
   * @return {object}
   */
  Summary.prototype.getXAPIData = function(){
    var self = this;

    // create array with userAnswer
    var children = self.summaries.map(function(panel, index) {
        var userResponse = self.userResponses[index] || [];
        var duration = self.timePassedInStopWatch(index);
        var event = self.createXApiAnsweredEvent(panel, userResponse, index, duration);

        return {
          statement: event.data.statement
        };
    });

    var result = XApiEventBuilder.createResult()
      .score(self.getScore(), self.getMaxScore())
      .duration(self.getTotalPassedTime())
      .build();

    // creates the definition object
    var definition = XApiEventBuilder.createDefinition()
      .interactionType(XApiEventBuilder.interactionTypes.COMPOUND)
      .name(self.getTitle())
      .description(self.options.intro)
      .build();

    var xAPIEvent = XApiEventBuilder.create()
      .verb(XApiEventBuilder.verbs.ANSWERED)
      .contentId(self.contentId, self.subContentId)
      .context(self.getParentAttribute('contentId'), self.getParentAttribute('subContentId'))
      .objectDefinition(definition)
      .result(result)
      .build();

    return {
      statement: xAPIEvent.data.statement,
      children: children
    };
  };

  /**
   * Returns an attribute from this.parent if it exists
   *
   * @param {string} attributeName
   * @return {*|undefined}
   */
  Summary.prototype.getParentAttribute = function (attributeName) {
    var self = this;

    if(self.parent !== undefined){
      return self.parent[attributeName];
    }
  };

  return Summary;

})(H5P.jQuery, H5P.Question, H5P.Summary.XApiEventBuilder, H5P.Summary.StopWatch);
;
/*! For license information please see three.min.js.LICENSE.txt */
(()=>{var t={212:(t,e,r)=>{"use strict";function n(){}r.r(e),r.d(e,{ACESFilmicToneMapping:()=>xt,AddEquation:()=>H,AddOperation:()=>dt,AdditiveBlending:()=>z,AlphaFormat:()=>Jt,AlwaysDepth:()=>it,AmbientLight:()=>xc,AnimationClip:()=>Ls,AnimationLoader:()=>Ns,AnimationMixer:()=>Th,AnimationObjectGroup:()=>Eh,AnimationUtils:()=>ms,ArcCurve:()=>js,ArrayCamera:()=>ua,ArrowHelper:()=>tl,Audio:()=>rh,AudioAnalyser:()=>ih,AudioContext:()=>Zc,AudioListener:()=>eh,AudioLoader:()=>Qc,AxesHelper:()=>el,AxisHelper:()=>Al,BackSide:()=>L,BasicDepthPacking:()=>Xe,BasicShadowMap:()=>E,BinaryTextureLoader:()=>Ol,Bone:()=>Da,BooleanKeyframeTrack:()=>ws,BoundingBoxHelper:()=>Ll,Box2:()=>Bh,Box3:()=>gr,Box3Helper:()=>Kh,BoxBufferGeometry:()=>hn,BoxGeometry:()=>cn,BoxHelper:()=>Qh,BufferAttribute:()=>Xr,BufferGeometry:()=>sn,BufferGeometryLoader:()=>Mc,ByteType:()=>Ut,Cache:()=>Cs,Camera:()=>ha,CameraHelper:()=>Zh,CanvasRenderer:()=>Nl,CanvasTexture:()=>ja,CatmullRomCurve3:()=>Js,CineonToneMapping:()=>yt,CircleBufferGeometry:()=>rs,CircleGeometry:()=>es,ClampToEdgeWrapping:()=>Rt,Clock:()=>th,ClosedSplineCurve3:()=>El,Color:()=>Lr,ColorKeyframeTrack:()=>_s,CompressedTexture:()=>Va,CompressedTextureLoader:()=>Bs,ConeBufferGeometry:()=>ts,ConeGeometry:()=>$o,CubeCamera:()=>$c,CubeGeometry:()=>cn,CubeReflectionMapping:()=>wt,CubeRefractionMapping:()=>_t,CubeTexture:()=>Vn,CubeTextureLoader:()=>Gs,CubeUVReflectionMapping:()=>Tt,CubeUVRefractionMapping:()=>At,CubicBezierCurve:()=>$s,CubicBezierCurve3:()=>tc,CubicInterpolant:()=>vs,CullFaceBack:()=>x,CullFaceFront:()=>b,CullFaceFrontBack:()=>w,CullFaceNone:()=>y,Curve:()=>Hs,CurvePath:()=>sc,CustomBlending:()=>F,CylinderBufferGeometry:()=>Ko,CylinderGeometry:()=>Qo,Cylindrical:()=>Nh,DataTexture:()=>mr,DataTexture3D:()=>jn,DataTextureLoader:()=>zs,DefaultLoadingManager:()=>Os,DepthFormat:()=>ee,DepthStencilFormat:()=>re,DepthTexture:()=>ka,DirectionalLight:()=>yc,DirectionalLightHelper:()=>Jh,DirectionalLightShadow:()=>vc,DiscreteInterpolant:()=>xs,DodecahedronBufferGeometry:()=>no,DodecahedronGeometry:()=>ro,DoubleSide:()=>R,DstAlphaFactor:()=>K,DstColorFactor:()=>tt,DynamicBufferAttribute:()=>fl,EdgesGeometry:()=>Zo,EdgesHelper:()=>Rl,EllipseCurve:()=>Vs,EqualDepth:()=>st,EquirectangularReflectionMapping:()=>Mt,EquirectangularRefractionMapping:()=>Et,Euler:()=>Nr,EventDispatcher:()=>n,ExtrudeBufferGeometry:()=>Bo,ExtrudeGeometry:()=>No,Face3:()=>Dr,Face4:()=>rl,FaceColors:()=>I,FaceNormalsHelper:()=>Yh,FileLoader:()=>Ds,FlatShading:()=>C,Float32Attribute:()=>_l,Float32BufferAttribute:()=>en,Float64Attribute:()=>Ml,Float64BufferAttribute:()=>rn,FloatType:()=>jt,Fog:()=>Sa,FogExp2:()=>Ea,Font:()=>Bc,FontLoader:()=>Uc,FrontFaceDirectionCCW:()=>M,FrontFaceDirectionCW:()=>_,FrontSide:()=>A,Frustum:()=>xr,GammaEncoding:()=>He,Geometry:()=>qr,GeometryUtils:()=>Il,GreaterDepth:()=>ht,GreaterEqualDepth:()=>ct,GridHelper:()=>qh,Group:()=>ca,HalfFloatType:()=>kt,HemisphereLight:()=>uc,HemisphereLightHelper:()=>Wh,IcosahedronBufferGeometry:()=>eo,IcosahedronGeometry:()=>to,ImageBitmapLoader:()=>Dc,ImageLoader:()=>Us,ImageUtils:()=>cr,ImmediateRenderObject:()=>Uh,InstancedBufferAttribute:()=>Ch,InstancedBufferGeometry:()=>Lh,InstancedInterleavedBuffer:()=>Rh,Int16Attribute:()=>yl,Int16BufferAttribute:()=>Qr,Int32Attribute:()=>bl,Int32BufferAttribute:()=>$r,Int8Attribute:()=>ml,Int8BufferAttribute:()=>Yr,IntType:()=>Ht,InterleavedBuffer:()=>Aa,InterleavedBufferAttribute:()=>La,Interpolant:()=>gs,InterpolateDiscrete:()=>Ce,InterpolateLinear:()=>Pe,InterpolateSmooth:()=>Oe,JSONLoader:()=>Bl,KeyframeTrack:()=>bs,LOD:()=>Pa,LatheBufferGeometry:()=>qo,LatheGeometry:()=>Wo,Layers:()=>Br,LensFlare:()=>Ul,LessDepth:()=>at,LessEqualDepth:()=>ot,Light:()=>lc,LightShadow:()=>pc,Line:()=>Ba,Line3:()=>zh,LineBasicMaterial:()=>Na,LineCurve:()=>ec,LineCurve3:()=>rc,LineDashedMaterial:()=>ds,LineLoop:()=>Ua,LinePieces:()=>il,LineSegments:()=>za,LineStrip:()=>nl,LinearEncoding:()=>Ge,LinearFilter:()=>Dt,LinearInterpolant:()=>ys,LinearMipMapLinearFilter:()=>Bt,LinearMipMapNearestFilter:()=>Nt,LinearToneMapping:()=>mt,Loader:()=>Gc,LoaderUtils:()=>_c,LoadingManager:()=>Ps,LogLuvEncoding:()=>je,LoopOnce:()=>Ae,LoopPingPong:()=>Re,LoopRepeat:()=>Le,LuminanceAlphaFormat:()=>$t,LuminanceFormat:()=>Kt,MOUSE:()=>v,Material:()=>Sn,MaterialLoader:()=>wc,Math:()=>Qe,Matrix3:()=>rr,Matrix4:()=>$e,MaxEquation:()=>W,Mesh:()=>Cn,MeshBasicMaterial:()=>Rn,MeshDepthMaterial:()=>ra,MeshDistanceMaterial:()=>na,MeshFaceMaterial:()=>al,MeshLambertMaterial:()=>us,MeshMatcapMaterial:()=>ps,MeshNormalMaterial:()=>ls,MeshPhongMaterial:()=>cs,MeshPhysicalMaterial:()=>ss,MeshStandardMaterial:()=>os,MeshToonMaterial:()=>hs,MinEquation:()=>k,MirroredRepeatWrapping:()=>Ct,MixOperation:()=>pt,MultiMaterial:()=>ol,MultiplyBlending:()=>G,MultiplyOperation:()=>ut,NearestFilter:()=>Pt,NearestMipMapLinearFilter:()=>It,NearestMipMapNearestFilter:()=>Ot,NeverDepth:()=>nt,NoBlending:()=>N,NoColors:()=>O,NoToneMapping:()=>ft,NormalBlending:()=>B,NotEqualDepth:()=>lt,NumberKeyframeTrack:()=>Ms,Object3D:()=>Vr,ObjectLoader:()=>Sc,ObjectSpaceNormalMap:()=>Ze,OctahedronBufferGeometry:()=>$a,OctahedronGeometry:()=>Ka,OneFactor:()=>X,OneMinusDstAlphaFactor:()=>$,OneMinusDstColorFactor:()=>et,OneMinusSrcAlphaFactor:()=>Q,OneMinusSrcColorFactor:()=>J,OrthographicCamera:()=>gc,PCFShadowMap:()=>S,PCFSoftShadowMap:()=>T,ParametricBufferGeometry:()=>Xa,ParametricGeometry:()=>qa,Particle:()=>cl,ParticleBasicMaterial:()=>ul,ParticleSystem:()=>hl,ParticleSystemMaterial:()=>pl,Path:()=>cc,PerspectiveCamera:()=>la,Plane:()=>yr,PlaneBufferGeometry:()=>un,PlaneGeometry:()=>ln,PlaneHelper:()=>$h,PointCloud:()=>sl,PointCloudMaterial:()=>ll,PointLight:()=>mc,PointLightHelper:()=>jh,Points:()=>Fa,PointsMaterial:()=>Ga,PolarGridHelper:()=>Xh,PolyhedronBufferGeometry:()=>Ja,PolyhedronGeometry:()=>Ya,PositionalAudio:()=>nh,Projector:()=>Dl,PropertyBinding:()=>Mh,PropertyMixer:()=>ah,QuadraticBezierCurve:()=>nc,QuadraticBezierCurve3:()=>ic,Quaternion:()=>tr,QuaternionKeyframeTrack:()=>Ss,QuaternionLinearInterpolant:()=>Es,REVISION:()=>g,RGBADepthPacking:()=>Ye,RGBAFormat:()=>Qt,RGBA_ASTC_10x10_Format:()=>Ee,RGBA_ASTC_10x5_Format:()=>we,RGBA_ASTC_10x6_Format:()=>_e,RGBA_ASTC_10x8_Format:()=>Me,RGBA_ASTC_12x10_Format:()=>Se,RGBA_ASTC_12x12_Format:()=>Te,RGBA_ASTC_4x4_Format:()=>de,RGBA_ASTC_5x4_Format:()=>fe,RGBA_ASTC_5x5_Format:()=>me,RGBA_ASTC_6x5_Format:()=>ge,RGBA_ASTC_6x6_Format:()=>ve,RGBA_ASTC_8x5_Format:()=>ye,RGBA_ASTC_8x6_Format:()=>xe,RGBA_ASTC_8x8_Format:()=>be,RGBA_PVRTC_2BPPV1_Format:()=>ue,RGBA_PVRTC_4BPPV1_Format:()=>le,RGBA_S3TC_DXT1_Format:()=>ae,RGBA_S3TC_DXT3_Format:()=>oe,RGBA_S3TC_DXT5_Format:()=>se,RGBDEncoding:()=>qe,RGBEEncoding:()=>Ve,RGBEFormat:()=>te,RGBFormat:()=>Zt,RGBM16Encoding:()=>We,RGBM7Encoding:()=>ke,RGB_ETC1_Format:()=>pe,RGB_PVRTC_2BPPV1_Format:()=>he,RGB_PVRTC_4BPPV1_Format:()=>ce,RGB_S3TC_DXT1_Format:()=>ie,RawShaderMaterial:()=>as,Ray:()=>An,Raycaster:()=>Ph,RectAreaLight:()=>bc,RectAreaLightHelper:()=>kh,RedFormat:()=>ne,ReinhardToneMapping:()=>gt,RepeatWrapping:()=>Lt,ReverseSubtractEquation:()=>j,RingBufferGeometry:()=>ko,RingGeometry:()=>jo,Scene:()=>Ta,SceneUtils:()=>zl,ShaderChunk:()=>br,ShaderLib:()=>Pr,ShaderMaterial:()=>Tn,ShadowMaterial:()=>is,Shape:()=>hc,ShapeBufferGeometry:()=>Yo,ShapeGeometry:()=>Xo,ShapePath:()=>Nc,ShapeUtils:()=>Oo,ShortType:()=>Gt,Skeleton:()=>Ia,SkeletonHelper:()=>Vh,SkinnedMesh:()=>Oa,SmoothShading:()=>P,Sphere:()=>vr,SphereBufferGeometry:()=>Vo,SphereGeometry:()=>Ho,Spherical:()=>Dh,SphericalReflectionMapping:()=>St,Spline:()=>Tl,SplineCurve:()=>ac,SplineCurve3:()=>Sl,SpotLight:()=>fc,SpotLightHelper:()=>Fh,SpotLightShadow:()=>dc,Sprite:()=>Ca,SpriteMaterial:()=>Ra,SrcAlphaFactor:()=>Z,SrcAlphaSaturateFactor:()=>rt,SrcColorFactor:()=>Y,StereoCamera:()=>Kc,StringKeyframeTrack:()=>Ts,SubtractEquation:()=>V,SubtractiveBlending:()=>U,TangentSpaceNormalMap:()=>Je,TetrahedronBufferGeometry:()=>Qa,TetrahedronGeometry:()=>Za,TextBufferGeometry:()=>Fo,TextGeometry:()=>Go,Texture:()=>lr,TextureLoader:()=>Fs,TorusBufferGeometry:()=>ho,TorusGeometry:()=>co,TorusKnotBufferGeometry:()=>so,TorusKnotGeometry:()=>oo,Triangle:()=>Ln,TriangleFanDrawMode:()=>Ue,TriangleStripDrawMode:()=>ze,TrianglesDrawMode:()=>Be,TubeBufferGeometry:()=>ao,TubeGeometry:()=>io,UVMapping:()=>bt,Uint16Attribute:()=>xl,Uint16BufferAttribute:()=>Kr,Uint32Attribute:()=>wl,Uint32BufferAttribute:()=>tn,Uint8Attribute:()=>gl,Uint8BufferAttribute:()=>Jr,Uint8ClampedAttribute:()=>vl,Uint8ClampedBufferAttribute:()=>Zr,Uncharted2ToneMapping:()=>vt,Uniform:()=>Ah,UniformsLib:()=>Cr,UniformsUtils:()=>Tr,UnsignedByteType:()=>zt,UnsignedInt248Type:()=>Yt,UnsignedIntType:()=>Vt,UnsignedShort4444Type:()=>Wt,UnsignedShort5551Type:()=>qt,UnsignedShort565Type:()=>Xt,UnsignedShortType:()=>Ft,Vector2:()=>Ke,Vector3:()=>er,Vector4:()=>ur,VectorKeyframeTrack:()=>As,Vertex:()=>dl,VertexColors:()=>D,VertexNormalsHelper:()=>Gh,VideoTexture:()=>Ha,WebGLMultisampleRenderTarget:()=>dr,WebGLRenderTarget:()=>pr,WebGLRenderTargetCube:()=>fr,WebGLRenderer:()=>Ma,WebGLUtils:()=>sa,WireframeGeometry:()=>Wa,WireframeHelper:()=>Cl,WrapAroundEnding:()=>Ne,XHRLoader:()=>Pl,ZeroCurvatureEnding:()=>Ie,ZeroFactor:()=>q,ZeroSlopeEnding:()=>De,sRGBEncoding:()=>Fe}),void 0===Number.EPSILON&&(Number.EPSILON=Math.pow(2,-52)),void 0===Number.isInteger&&(Number.isInteger=function(t){return"number"==typeof t&&isFinite(t)&&Math.floor(t)===t}),void 0===Math.sign&&(Math.sign=function(t){return t<0?-1:t>0?1:+t}),"name"in Function.prototype==0&&Object.defineProperty(Function.prototype,"name",{get:function(){return this.toString().match(/^\s*function\s*([^\(\s]*)/)[1]}}),void 0===Object.assign&&(Object.assign=function(t){if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var e=Object(t),r=1;r<arguments.length;r++){var n=arguments[r];if(null!=n)for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&(e[i]=n[i])}return e}),Object.assign(n.prototype,{addEventListener:function(t,e){void 0===this._listeners&&(this._listeners={});var r=this._listeners;void 0===r[t]&&(r[t]=[]),-1===r[t].indexOf(e)&&r[t].push(e)},hasEventListener:function(t,e){if(void 0===this._listeners)return!1;var r=this._listeners;return void 0!==r[t]&&-1!==r[t].indexOf(e)},removeEventListener:function(t,e){if(void 0!==this._listeners){var r=this._listeners[t];if(void 0!==r){var n=r.indexOf(e);-1!==n&&r.splice(n,1)}}},dispatchEvent:function(t){if(void 0!==this._listeners){var e=this._listeners[t.type];if(void 0!==e){t.target=this;for(var r=e.slice(0),n=0,i=r.length;n<i;n++)r[n].call(this,t)}}}});var i,a,o,s,c,h,l,u,p,d,f,m,g="101",v={LEFT:0,MIDDLE:1,RIGHT:2},y=0,x=1,b=2,w=3,_=0,M=1,E=0,S=1,T=2,A=0,L=1,R=2,C=1,P=2,O=0,I=1,D=2,N=0,B=1,z=2,U=3,G=4,F=5,H=100,V=101,j=102,k=103,W=104,q=200,X=201,Y=202,J=203,Z=204,Q=205,K=206,$=207,tt=208,et=209,rt=210,nt=0,it=1,at=2,ot=3,st=4,ct=5,ht=6,lt=7,ut=0,pt=1,dt=2,ft=0,mt=1,gt=2,vt=3,yt=4,xt=5,bt=300,wt=301,_t=302,Mt=303,Et=304,St=305,Tt=306,At=307,Lt=1e3,Rt=1001,Ct=1002,Pt=1003,Ot=1004,It=1005,Dt=1006,Nt=1007,Bt=1008,zt=1009,Ut=1010,Gt=1011,Ft=1012,Ht=1013,Vt=1014,jt=1015,kt=1016,Wt=1017,qt=1018,Xt=1019,Yt=1020,Jt=1021,Zt=1022,Qt=1023,Kt=1024,$t=1025,te=Qt,ee=1026,re=1027,ne=1028,ie=33776,ae=33777,oe=33778,se=33779,ce=35840,he=35841,le=35842,ue=35843,pe=36196,de=37808,fe=37809,me=37810,ge=37811,ve=37812,ye=37813,xe=37814,be=37815,we=37816,_e=37817,Me=37818,Ee=37819,Se=37820,Te=37821,Ae=2200,Le=2201,Re=2202,Ce=2300,Pe=2301,Oe=2302,Ie=2400,De=2401,Ne=2402,Be=0,ze=1,Ue=2,Ge=3e3,Fe=3001,He=3007,Ve=3002,je=3003,ke=3004,We=3005,qe=3006,Xe=3200,Ye=3201,Je=0,Ze=1,Qe={DEG2RAD:Math.PI/180,RAD2DEG:180/Math.PI,generateUUID:function(){for(var t=[],e=0;e<256;e++)t[e]=(e<16?"0":"")+e.toString(16);return function(){var e=4294967295*Math.random()|0,r=4294967295*Math.random()|0,n=4294967295*Math.random()|0,i=4294967295*Math.random()|0;return(t[255&e]+t[e>>8&255]+t[e>>16&255]+t[e>>24&255]+"-"+t[255&r]+t[r>>8&255]+"-"+t[r>>16&15|64]+t[r>>24&255]+"-"+t[63&n|128]+t[n>>8&255]+"-"+t[n>>16&255]+t[n>>24&255]+t[255&i]+t[i>>8&255]+t[i>>16&255]+t[i>>24&255]).toUpperCase()}}(),clamp:function(t,e,r){return Math.max(e,Math.min(r,t))},euclideanModulo:function(t,e){return(t%e+e)%e},mapLinear:function(t,e,r,n,i){return n+(t-e)*(i-n)/(r-e)},lerp:function(t,e,r){return(1-r)*t+r*e},smoothstep:function(t,e,r){return t<=e?0:t>=r?1:(t=(t-e)/(r-e))*t*(3-2*t)},smootherstep:function(t,e,r){return t<=e?0:t>=r?1:(t=(t-e)/(r-e))*t*t*(t*(6*t-15)+10)},randInt:function(t,e){return t+Math.floor(Math.random()*(e-t+1))},randFloat:function(t,e){return t+Math.random()*(e-t)},randFloatSpread:function(t){return t*(.5-Math.random())},degToRad:function(t){return t*Qe.DEG2RAD},radToDeg:function(t){return t*Qe.RAD2DEG},isPowerOfTwo:function(t){return 0==(t&t-1)&&0!==t},ceilPowerOfTwo:function(t){return Math.pow(2,Math.ceil(Math.log(t)/Math.LN2))},floorPowerOfTwo:function(t){return Math.pow(2,Math.floor(Math.log(t)/Math.LN2))}};function Ke(t,e){this.x=t||0,this.y=e||0}function $e(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],arguments.length>0&&console.error("THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.")}function tr(t,e,r,n){this._x=t||0,this._y=e||0,this._z=r||0,this._w=void 0!==n?n:1}function er(t,e,r){this.x=t||0,this.y=e||0,this.z=r||0}function rr(){this.elements=[1,0,0,0,1,0,0,0,1],arguments.length>0&&console.error("THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.")}Object.defineProperties(Ke.prototype,{width:{get:function(){return this.x},set:function(t){this.x=t}},height:{get:function(){return this.y},set:function(t){this.y=t}}}),Object.assign(Ke.prototype,{isVector2:!0,set:function(t,e){return this.x=t,this.y=e,this},setScalar:function(t){return this.x=t,this.y=t,this},setX:function(t){return this.x=t,this},setY:function(t){return this.y=t,this},setComponent:function(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this},getComponent:function(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}},clone:function(){return new this.constructor(this.x,this.y)},copy:function(t){return this.x=t.x,this.y=t.y,this},add:function(t,e){return void 0!==e?(console.warn("THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(t,e)):(this.x+=t.x,this.y+=t.y,this)},addScalar:function(t){return this.x+=t,this.y+=t,this},addVectors:function(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this},addScaledVector:function(t,e){return this.x+=t.x*e,this.y+=t.y*e,this},sub:function(t,e){return void 0!==e?(console.warn("THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(t,e)):(this.x-=t.x,this.y-=t.y,this)},subScalar:function(t){return this.x-=t,this.y-=t,this},subVectors:function(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this},multiply:function(t){return this.x*=t.x,this.y*=t.y,this},multiplyScalar:function(t){return this.x*=t,this.y*=t,this},divide:function(t){return this.x/=t.x,this.y/=t.y,this},divideScalar:function(t){return this.multiplyScalar(1/t)},applyMatrix3:function(t){var e=this.x,r=this.y,n=t.elements;return this.x=n[0]*e+n[3]*r+n[6],this.y=n[1]*e+n[4]*r+n[7],this},min:function(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this},max:function(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this},clamp:function(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this},clampScalar:(i=new Ke,a=new Ke,function(t,e){return i.set(t,t),a.set(e,e),this.clamp(i,a)}),clampLength:function(t,e){var r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(t,Math.min(e,r)))},floor:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this},ceil:function(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this},round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},roundToZero:function(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this},negate:function(){return this.x=-this.x,this.y=-this.y,this},dot:function(t){return this.x*t.x+this.y*t.y},cross:function(t){return this.x*t.y-this.y*t.x},lengthSq:function(){return this.x*this.x+this.y*this.y},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},manhattanLength:function(){return Math.abs(this.x)+Math.abs(this.y)},normalize:function(){return this.divideScalar(this.length()||1)},angle:function(){var t=Math.atan2(this.y,this.x);return t<0&&(t+=2*Math.PI),t},distanceTo:function(t){return Math.sqrt(this.distanceToSquared(t))},distanceToSquared:function(t){var e=this.x-t.x,r=this.y-t.y;return e*e+r*r},manhattanDistanceTo:function(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)},setLength:function(t){return this.normalize().multiplyScalar(t)},lerp:function(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this},lerpVectors:function(t,e,r){return this.subVectors(e,t).multiplyScalar(r).add(t)},equals:function(t){return t.x===this.x&&t.y===this.y},fromArray:function(t,e){return void 0===e&&(e=0),this.x=t[e],this.y=t[e+1],this},toArray:function(t,e){return void 0===t&&(t=[]),void 0===e&&(e=0),t[e]=this.x,t[e+1]=this.y,t},fromBufferAttribute:function(t,e,r){return void 0!==r&&console.warn("THREE.Vector2: offset has been removed from .fromBufferAttribute()."),this.x=t.getX(e),this.y=t.getY(e),this},rotateAround:function(t,e){var r=Math.cos(e),n=Math.sin(e),i=this.x-t.x,a=this.y-t.y;return this.x=i*r-a*n+t.x,this.y=i*n+a*r+t.y,this}}),Object.assign($e.prototype,{isMatrix4:!0,set:function(t,e,r,n,i,a,o,s,c,h,l,u,p,d,f,m){var g=this.elements;return g[0]=t,g[4]=e,g[8]=r,g[12]=n,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=h,g[10]=l,g[14]=u,g[3]=p,g[7]=d,g[11]=f,g[15]=m,this},identity:function(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this},clone:function(){return(new $e).fromArray(this.elements)},copy:function(t){var e=this.elements,r=t.elements;return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=r[3],e[4]=r[4],e[5]=r[5],e[6]=r[6],e[7]=r[7],e[8]=r[8],e[9]=r[9],e[10]=r[10],e[11]=r[11],e[12]=r[12],e[13]=r[13],e[14]=r[14],e[15]=r[15],this},copyPosition:function(t){var e=this.elements,r=t.elements;return e[12]=r[12],e[13]=r[13],e[14]=r[14],this},extractBasis:function(t,e,r){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),r.setFromMatrixColumn(this,2),this},makeBasis:function(t,e,r){return this.set(t.x,e.x,r.x,0,t.y,e.y,r.y,0,t.z,e.z,r.z,0,0,0,0,1),this},extractRotation:(d=new er,function(t){var e=this.elements,r=t.elements,n=1/d.setFromMatrixColumn(t,0).length(),i=1/d.setFromMatrixColumn(t,1).length(),a=1/d.setFromMatrixColumn(t,2).length();return e[0]=r[0]*n,e[1]=r[1]*n,e[2]=r[2]*n,e[3]=0,e[4]=r[4]*i,e[5]=r[5]*i,e[6]=r[6]*i,e[7]=0,e[8]=r[8]*a,e[9]=r[9]*a,e[10]=r[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}),makeRotationFromEuler:function(t){t&&t.isEuler||console.error("THREE.Matrix4: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.");var e=this.elements,r=t.x,n=t.y,i=t.z,a=Math.cos(r),o=Math.sin(r),s=Math.cos(n),c=Math.sin(n),h=Math.cos(i),l=Math.sin(i);if("XYZ"===t.order){var u=a*h,p=a*l,d=o*h,f=o*l;e[0]=s*h,e[4]=-s*l,e[8]=c,e[1]=p+d*c,e[5]=u-f*c,e[9]=-o*s,e[2]=f-u*c,e[6]=d+p*c,e[10]=a*s}else if("YXZ"===t.order){var m=s*h,g=s*l,v=c*h,y=c*l;e[0]=m+y*o,e[4]=v*o-g,e[8]=a*c,e[1]=a*l,e[5]=a*h,e[9]=-o,e[2]=g*o-v,e[6]=y+m*o,e[10]=a*s}else if("ZXY"===t.order)m=s*h,g=s*l,v=c*h,y=c*l,e[0]=m-y*o,e[4]=-a*l,e[8]=v+g*o,e[1]=g+v*o,e[5]=a*h,e[9]=y-m*o,e[2]=-a*c,e[6]=o,e[10]=a*s;else if("ZYX"===t.order)u=a*h,p=a*l,d=o*h,f=o*l,e[0]=s*h,e[4]=d*c-p,e[8]=u*c+f,e[1]=s*l,e[5]=f*c+u,e[9]=p*c-d,e[2]=-c,e[6]=o*s,e[10]=a*s;else if("YZX"===t.order){var x=a*s,b=a*c,w=o*s,_=o*c;e[0]=s*h,e[4]=_-x*l,e[8]=w*l+b,e[1]=l,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=b*l+w,e[10]=x-_*l}else"XZY"===t.order&&(x=a*s,b=a*c,w=o*s,_=o*c,e[0]=s*h,e[4]=-l,e[8]=c*h,e[1]=x*l+_,e[5]=a*h,e[9]=b*l-w,e[2]=w*l-b,e[6]=o*h,e[10]=_*l+x);return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this},makeRotationFromQuaternion:(u=new er(0,0,0),p=new er(1,1,1),function(t){return this.compose(u,t,p)}),lookAt:(c=new er,h=new er,l=new er,function(t,e,r){var n=this.elements;return l.subVectors(t,e),0===l.lengthSq()&&(l.z=1),l.normalize(),c.crossVectors(r,l),0===c.lengthSq()&&(1===Math.abs(r.z)?l.x+=1e-4:l.z+=1e-4,l.normalize(),c.crossVectors(r,l)),c.normalize(),h.crossVectors(l,c),n[0]=c.x,n[4]=h.x,n[8]=l.x,n[1]=c.y,n[5]=h.y,n[9]=l.y,n[2]=c.z,n[6]=h.z,n[10]=l.z,this}),multiply:function(t,e){return void 0!==e?(console.warn("THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead."),this.multiplyMatrices(t,e)):this.multiplyMatrices(this,t)},premultiply:function(t){return this.multiplyMatrices(t,this)},multiplyMatrices:function(t,e){var r=t.elements,n=e.elements,i=this.elements,a=r[0],o=r[4],s=r[8],c=r[12],h=r[1],l=r[5],u=r[9],p=r[13],d=r[2],f=r[6],m=r[10],g=r[14],v=r[3],y=r[7],x=r[11],b=r[15],w=n[0],_=n[4],M=n[8],E=n[12],S=n[1],T=n[5],A=n[9],L=n[13],R=n[2],C=n[6],P=n[10],O=n[14],I=n[3],D=n[7],N=n[11],B=n[15];return i[0]=a*w+o*S+s*R+c*I,i[4]=a*_+o*T+s*C+c*D,i[8]=a*M+o*A+s*P+c*N,i[12]=a*E+o*L+s*O+c*B,i[1]=h*w+l*S+u*R+p*I,i[5]=h*_+l*T+u*C+p*D,i[9]=h*M+l*A+u*P+p*N,i[13]=h*E+l*L+u*O+p*B,i[2]=d*w+f*S+m*R+g*I,i[6]=d*_+f*T+m*C+g*D,i[10]=d*M+f*A+m*P+g*N,i[14]=d*E+f*L+m*O+g*B,i[3]=v*w+y*S+x*R+b*I,i[7]=v*_+y*T+x*C+b*D,i[11]=v*M+y*A+x*P+b*N,i[15]=v*E+y*L+x*O+b*B,this},multiplyScalar:function(t){var e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this},applyToBufferAttribute:function(){var t=new er;return function(e){for(var r=0,n=e.count;r<n;r++)t.x=e.getX(r),t.y=e.getY(r),t.z=e.getZ(r),t.applyMatrix4(this),e.setXYZ(r,t.x,t.y,t.z);return e}}(),determinant:function(){var t=this.elements,e=t[0],r=t[4],n=t[8],i=t[12],a=t[1],o=t[5],s=t[9],c=t[13],h=t[2],l=t[6],u=t[10],p=t[14];return t[3]*(+i*s*l-n*c*l-i*o*u+r*c*u+n*o*p-r*s*p)+t[7]*(+e*s*p-e*c*u+i*a*u-n*a*p+n*c*h-i*s*h)+t[11]*(+e*c*l-e*o*p-i*a*l+r*a*p+i*o*h-r*c*h)+t[15]*(-n*o*h-e*s*l+e*o*u+n*a*l-r*a*u+r*s*h)},transpose:function(){var t,e=this.elements;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this},setPosition:function(t){var e=this.elements;return e[12]=t.x,e[13]=t.y,e[14]=t.z,this},getInverse:function(t,e){var r=this.elements,n=t.elements,i=n[0],a=n[1],o=n[2],s=n[3],c=n[4],h=n[5],l=n[6],u=n[7],p=n[8],d=n[9],f=n[10],m=n[11],g=n[12],v=n[13],y=n[14],x=n[15],b=d*y*u-v*f*u+v*l*m-h*y*m-d*l*x+h*f*x,w=g*f*u-p*y*u-g*l*m+c*y*m+p*l*x-c*f*x,_=p*v*u-g*d*u+g*h*m-c*v*m-p*h*x+c*d*x,M=g*d*l-p*v*l-g*h*f+c*v*f+p*h*y-c*d*y,E=i*b+a*w+o*_+s*M;if(0===E){var S="THREE.Matrix4: .getInverse() can't invert matrix, determinant is 0";if(!0===e)throw new Error(S);return console.warn(S),this.identity()}var T=1/E;return r[0]=b*T,r[1]=(v*f*s-d*y*s-v*o*m+a*y*m+d*o*x-a*f*x)*T,r[2]=(h*y*s-v*l*s+v*o*u-a*y*u-h*o*x+a*l*x)*T,r[3]=(d*l*s-h*f*s-d*o*u+a*f*u+h*o*m-a*l*m)*T,r[4]=w*T,r[5]=(p*y*s-g*f*s+g*o*m-i*y*m-p*o*x+i*f*x)*T,r[6]=(g*l*s-c*y*s-g*o*u+i*y*u+c*o*x-i*l*x)*T,r[7]=(c*f*s-p*l*s+p*o*u-i*f*u-c*o*m+i*l*m)*T,r[8]=_*T,r[9]=(g*d*s-p*v*s-g*a*m+i*v*m+p*a*x-i*d*x)*T,r[10]=(c*v*s-g*h*s+g*a*u-i*v*u-c*a*x+i*h*x)*T,r[11]=(p*h*s-c*d*s-p*a*u+i*d*u+c*a*m-i*h*m)*T,r[12]=M*T,r[13]=(p*v*o-g*d*o+g*a*f-i*v*f-p*a*y+i*d*y)*T,r[14]=(g*h*o-c*v*o-g*a*l+i*v*l+c*a*y-i*h*y)*T,r[15]=(c*d*o-p*h*o+p*a*l-i*d*l-c*a*f+i*h*f)*T,this},scale:function(t){var e=this.elements,r=t.x,n=t.y,i=t.z;return e[0]*=r,e[4]*=n,e[8]*=i,e[1]*=r,e[5]*=n,e[9]*=i,e[2]*=r,e[6]*=n,e[10]*=i,e[3]*=r,e[7]*=n,e[11]*=i,this},getMaxScaleOnAxis:function(){var t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],r=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],n=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,r,n))},makeTranslation:function(t,e,r){return this.set(1,0,0,t,0,1,0,e,0,0,1,r,0,0,0,1),this},makeRotationX:function(t){var e=Math.cos(t),r=Math.sin(t);return this.set(1,0,0,0,0,e,-r,0,0,r,e,0,0,0,0,1),this},makeRotationY:function(t){var e=Math.cos(t),r=Math.sin(t);return this.set(e,0,r,0,0,1,0,0,-r,0,e,0,0,0,0,1),this},makeRotationZ:function(t){var e=Math.cos(t),r=Math.sin(t);return this.set(e,-r,0,0,r,e,0,0,0,0,1,0,0,0,0,1),this},makeRotationAxis:function(t,e){var r=Math.cos(e),n=Math.sin(e),i=1-r,a=t.x,o=t.y,s=t.z,c=i*a,h=i*o;return this.set(c*a+r,c*o-n*s,c*s+n*o,0,c*o+n*s,h*o+r,h*s-n*a,0,c*s-n*o,h*s+n*a,i*s*s+r,0,0,0,0,1),this},makeScale:function(t,e,r){return this.set(t,0,0,0,0,e,0,0,0,0,r,0,0,0,0,1),this},makeShear:function(t,e,r){return this.set(1,e,r,0,t,1,r,0,t,e,1,0,0,0,0,1),this},compose:function(t,e,r){var n=this.elements,i=e._x,a=e._y,o=e._z,s=e._w,c=i+i,h=a+a,l=o+o,u=i*c,p=i*h,d=i*l,f=a*h,m=a*l,g=o*l,v=s*c,y=s*h,x=s*l,b=r.x,w=r.y,_=r.z;return n[0]=(1-(f+g))*b,n[1]=(p+x)*b,n[2]=(d-y)*b,n[3]=0,n[4]=(p-x)*w,n[5]=(1-(u+g))*w,n[6]=(m+v)*w,n[7]=0,n[8]=(d+y)*_,n[9]=(m-v)*_,n[10]=(1-(u+f))*_,n[11]=0,n[12]=t.x,n[13]=t.y,n[14]=t.z,n[15]=1,this},decompose:(o=new er,s=new $e,function(t,e,r){var n=this.elements,i=o.set(n[0],n[1],n[2]).length(),a=o.set(n[4],n[5],n[6]).length(),c=o.set(n[8],n[9],n[10]).length();this.determinant()<0&&(i=-i),t.x=n[12],t.y=n[13],t.z=n[14],s.copy(this);var h=1/i,l=1/a,u=1/c;return s.elements[0]*=h,s.elements[1]*=h,s.elements[2]*=h,s.elements[4]*=l,s.elements[5]*=l,s.elements[6]*=l,s.elements[8]*=u,s.elements[9]*=u,s.elements[10]*=u,e.setFromRotationMatrix(s),r.x=i,r.y=a,r.z=c,this}),makePerspective:function(t,e,r,n,i,a){void 0===a&&console.warn("THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.");var o=this.elements,s=2*i/(e-t),c=2*i/(r-n),h=(e+t)/(e-t),l=(r+n)/(r-n),u=-(a+i)/(a-i),p=-2*a*i/(a-i);return o[0]=s,o[4]=0,o[8]=h,o[12]=0,o[1]=0,o[5]=c,o[9]=l,o[13]=0,o[2]=0,o[6]=0,o[10]=u,o[14]=p,o[3]=0,o[7]=0,o[11]=-1,o[15]=0,this},makeOrthographic:function(t,e,r,n,i,a){var o=this.elements,s=1/(e-t),c=1/(r-n),h=1/(a-i),l=(e+t)*s,u=(r+n)*c,p=(a+i)*h;return o[0]=2*s,o[4]=0,o[8]=0,o[12]=-l,o[1]=0,o[5]=2*c,o[9]=0,o[13]=-u,o[2]=0,o[6]=0,o[10]=-2*h,o[14]=-p,o[3]=0,o[7]=0,o[11]=0,o[15]=1,this},equals:function(t){for(var e=this.elements,r=t.elements,n=0;n<16;n++)if(e[n]!==r[n])return!1;return!0},fromArray:function(t,e){void 0===e&&(e=0);for(var r=0;r<16;r++)this.elements[r]=t[r+e];return this},toArray:function(t,e){void 0===t&&(t=[]),void 0===e&&(e=0);var r=this.elements;return t[e]=r[0],t[e+1]=r[1],t[e+2]=r[2],t[e+3]=r[3],t[e+4]=r[4],t[e+5]=r[5],t[e+6]=r[6],t[e+7]=r[7],t[e+8]=r[8],t[e+9]=r[9],t[e+10]=r[10],t[e+11]=r[11],t[e+12]=r[12],t[e+13]=r[13],t[e+14]=r[14],t[e+15]=r[15],t}}),Object.assign(tr,{slerp:function(t,e,r,n){return r.copy(t).slerp(e,n)},slerpFlat:function(t,e,r,n,i,a,o){var s=r[n+0],c=r[n+1],h=r[n+2],l=r[n+3],u=i[a+0],p=i[a+1],d=i[a+2],f=i[a+3];if(l!==f||s!==u||c!==p||h!==d){var m=1-o,g=s*u+c*p+h*d+l*f,v=g>=0?1:-1,y=1-g*g;if(y>Number.EPSILON){var x=Math.sqrt(y),b=Math.atan2(x,g*v);m=Math.sin(m*b)/x,o=Math.sin(o*b)/x}var w=o*v;if(s=s*m+u*w,c=c*m+p*w,h=h*m+d*w,l=l*m+f*w,m===1-o){var _=1/Math.sqrt(s*s+c*c+h*h+l*l);s*=_,c*=_,h*=_,l*=_}}t[e]=s,t[e+1]=c,t[e+2]=h,t[e+3]=l}}),Object.defineProperties(tr.prototype,{x:{get:function(){return this._x},set:function(t){this._x=t,this.onChangeCallback()}},y:{get:function(){return this._y},set:function(t){this._y=t,this.onChangeCallback()}},z:{get:function(){return this._z},set:function(t){this._z=t,this.onChangeCallback()}},w:{get:function(){return this._w},set:function(t){this._w=t,this.onChangeCallback()}}}),Object.assign(tr.prototype,{isQuaternion:!0,set:function(t,e,r,n){return this._x=t,this._y=e,this._z=r,this._w=n,this.onChangeCallback(),this},clone:function(){return new this.constructor(this._x,this._y,this._z,this._w)},copy:function(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this.onChangeCallback(),this},setFromEuler:function(t,e){if(!t||!t.isEuler)throw new Error("THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.");var r=t._x,n=t._y,i=t._z,a=t.order,o=Math.cos,s=Math.sin,c=o(r/2),h=o(n/2),l=o(i/2),u=s(r/2),p=s(n/2),d=s(i/2);return"XYZ"===a?(this._x=u*h*l+c*p*d,this._y=c*p*l-u*h*d,this._z=c*h*d+u*p*l,this._w=c*h*l-u*p*d):"YXZ"===a?(this._x=u*h*l+c*p*d,this._y=c*p*l-u*h*d,this._z=c*h*d-u*p*l,this._w=c*h*l+u*p*d):"ZXY"===a?(this._x=u*h*l-c*p*d,this._y=c*p*l+u*h*d,this._z=c*h*d+u*p*l,this._w=c*h*l-u*p*d):"ZYX"===a?(this._x=u*h*l-c*p*d,this._y=c*p*l+u*h*d,this._z=c*h*d-u*p*l,this._w=c*h*l+u*p*d):"YZX"===a?(this._x=u*h*l+c*p*d,this._y=c*p*l+u*h*d,this._z=c*h*d-u*p*l,this._w=c*h*l-u*p*d):"XZY"===a&&(this._x=u*h*l-c*p*d,this._y=c*p*l-u*h*d,this._z=c*h*d+u*p*l,this._w=c*h*l+u*p*d),!1!==e&&this.onChangeCallback(),this},setFromAxisAngle:function(t,e){var r=e/2,n=Math.sin(r);return this._x=t.x*n,this._y=t.y*n,this._z=t.z*n,this._w=Math.cos(r),this.onChangeCallback(),this},setFromRotationMatrix:function(t){var e,r=t.elements,n=r[0],i=r[4],a=r[8],o=r[1],s=r[5],c=r[9],h=r[2],l=r[6],u=r[10],p=n+s+u;return p>0?(e=.5/Math.sqrt(p+1),this._w=.25/e,this._x=(l-c)*e,this._y=(a-h)*e,this._z=(o-i)*e):n>s&&n>u?(e=2*Math.sqrt(1+n-s-u),this._w=(l-c)/e,this._x=.25*e,this._y=(i+o)/e,this._z=(a+h)/e):s>u?(e=2*Math.sqrt(1+s-n-u),this._w=(a-h)/e,this._x=(i+o)/e,this._y=.25*e,this._z=(c+l)/e):(e=2*Math.sqrt(1+u-n-s),this._w=(o-i)/e,this._x=(a+h)/e,this._y=(c+l)/e,this._z=.25*e),this.onChangeCallback(),this},setFromUnitVectors:function(){var t,e=new er;return function(r,n){return void 0===e&&(e=new er),(t=r.dot(n)+1)<1e-6?(t=0,Math.abs(r.x)>Math.abs(r.z)?e.set(-r.y,r.x,0):e.set(0,-r.z,r.y)):e.crossVectors(r,n),this._x=e.x,this._y=e.y,this._z=e.z,this._w=t,this.normalize()}}(),angleTo:function(t){return 2*Math.acos(Math.abs(Qe.clamp(this.dot(t),-1,1)))},rotateTowards:function(t,e){var r=this.angleTo(t);if(0===r)return this;var n=Math.min(1,e/r);return this.slerp(t,n),this},inverse:function(){return this.conjugate()},conjugate:function(){return this._x*=-1,this._y*=-1,this._z*=-1,this.onChangeCallback(),this},dot:function(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w},lengthSq:function(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w},length:function(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)},normalize:function(){var t=this.length();return 0===t?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this.onChangeCallback(),this},multiply:function(t,e){return void 0!==e?(console.warn("THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead."),this.multiplyQuaternions(t,e)):this.multiplyQuaternions(this,t)},premultiply:function(t){return this.multiplyQuaternions(t,this)},multiplyQuaternions:function(t,e){var r=t._x,n=t._y,i=t._z,a=t._w,o=e._x,s=e._y,c=e._z,h=e._w;return this._x=r*h+a*o+n*c-i*s,this._y=n*h+a*s+i*o-r*c,this._z=i*h+a*c+r*s-n*o,this._w=a*h-r*o-n*s-i*c,this.onChangeCallback(),this},slerp:function(t,e){if(0===e)return this;if(1===e)return this.copy(t);var r=this._x,n=this._y,i=this._z,a=this._w,o=a*t._w+r*t._x+n*t._y+i*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=r,this._y=n,this._z=i,this;var s=1-o*o;if(s<=Number.EPSILON){var c=1-e;return this._w=c*a+e*this._w,this._x=c*r+e*this._x,this._y=c*n+e*this._y,this._z=c*i+e*this._z,this.normalize()}var h=Math.sqrt(s),l=Math.atan2(h,o),u=Math.sin((1-e)*l)/h,p=Math.sin(e*l)/h;return this._w=a*u+this._w*p,this._x=r*u+this._x*p,this._y=n*u+this._y*p,this._z=i*u+this._z*p,this.onChangeCallback(),this},equals:function(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w},fromArray:function(t,e){return void 0===e&&(e=0),this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this.onChangeCallback(),this},toArray:function(t,e){return void 0===t&&(t=[]),void 0===e&&(e=0),t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t},onChange:function(t){return this.onChangeCallback=t,this},onChangeCallback:function(){}}),Object.assign(er.prototype,{isVector3:!0,set:function(t,e,r){return this.x=t,this.y=e,this.z=r,this},setScalar:function(t){return this.x=t,this.y=t,this.z=t,this},setX:function(t){return this.x=t,this},setY:function(t){return this.y=t,this},setZ:function(t){return this.z=t,this},setComponent:function(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this},getComponent:function(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}},clone:function(){return new this.constructor(this.x,this.y,this.z)},copy:function(t){return this.x=t.x,this.y=t.y,this.z=t.z,this},add:function(t,e){return void 0!==e?(console.warn("THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(t,e)):(this.x+=t.x,this.y+=t.y,this.z+=t.z,this)},addScalar:function(t){return this.x+=t,this.y+=t,this.z+=t,this},addVectors:function(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this},addScaledVector:function(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this},sub:function(t,e){return void 0!==e?(console.warn("THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(t,e)):(this.x-=t.x,this.y-=t.y,this.z-=t.z,this)},subScalar:function(t){return this.x-=t,this.y-=t,this.z-=t,this},subVectors:function(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this},multiply:function(t,e){return void 0!==e?(console.warn("THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead."),this.multiplyVectors(t,e)):(this.x*=t.x,this.y*=t.y,this.z*=t.z,this)},multiplyScalar:function(t){return this.x*=t,this.y*=t,this.z*=t,this},multiplyVectors:function(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this},applyEuler:(f=new tr,function(t){return t&&t.isEuler||console.error("THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order."),this.applyQuaternion(f.setFromEuler(t))}),applyAxisAngle:function(){var t=new tr;return function(e,r){return this.applyQuaternion(t.setFromAxisAngle(e,r))}}(),applyMatrix3:function(t){var e=this.x,r=this.y,n=this.z,i=t.elements;return this.x=i[0]*e+i[3]*r+i[6]*n,this.y=i[1]*e+i[4]*r+i[7]*n,this.z=i[2]*e+i[5]*r+i[8]*n,this},applyMatrix4:function(t){var e=this.x,r=this.y,n=this.z,i=t.elements,a=1/(i[3]*e+i[7]*r+i[11]*n+i[15]);return this.x=(i[0]*e+i[4]*r+i[8]*n+i[12])*a,this.y=(i[1]*e+i[5]*r+i[9]*n+i[13])*a,this.z=(i[2]*e+i[6]*r+i[10]*n+i[14])*a,this},applyQuaternion:function(t){var e=this.x,r=this.y,n=this.z,i=t.x,a=t.y,o=t.z,s=t.w,c=s*e+a*n-o*r,h=s*r+o*e-i*n,l=s*n+i*r-a*e,u=-i*e-a*r-o*n;return this.x=c*s+u*-i+h*-o-l*-a,this.y=h*s+u*-a+l*-i-c*-o,this.z=l*s+u*-o+c*-a-h*-i,this},project:function(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},unproject:function(){var t=new $e;return function(e){return this.applyMatrix4(t.getInverse(e.projectionMatrix)).applyMatrix4(e.matrixWorld)}}(),transformDirection:function(t){var e=this.x,r=this.y,n=this.z,i=t.elements;return this.x=i[0]*e+i[4]*r+i[8]*n,this.y=i[1]*e+i[5]*r+i[9]*n,this.z=i[2]*e+i[6]*r+i[10]*n,this.normalize()},divide:function(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this},divideScalar:function(t){return this.multiplyScalar(1/t)},min:function(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this},max:function(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this},clamp:function(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this},clampScalar:function(){var t=new er,e=new er;return function(r,n){return t.set(r,r,r),e.set(n,n,n),this.clamp(t,e)}}(),clampLength:function(t,e){var r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(t,Math.min(e,r)))},floor:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this},ceil:function(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this},round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this},roundToZero:function(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this},negate:function(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this},dot:function(t){return this.x*t.x+this.y*t.y+this.z*t.z},lengthSq:function(){return this.x*this.x+this.y*this.y+this.z*this.z},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)},manhattanLength:function(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)},normalize:function(){return this.divideScalar(this.length()||1)},setLength:function(t){return this.normalize().multiplyScalar(t)},lerp:function(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this},lerpVectors:function(t,e,r){return this.subVectors(e,t).multiplyScalar(r).add(t)},cross:function(t,e){return void 0!==e?(console.warn("THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead."),this.crossVectors(t,e)):this.crossVectors(this,t)},crossVectors:function(t,e){var r=t.x,n=t.y,i=t.z,a=e.x,o=e.y,s=e.z;return this.x=n*s-i*o,this.y=i*a-r*s,this.z=r*o-n*a,this},projectOnVector:function(t){var e=t.dot(this)/t.lengthSq();return this.copy(t).multiplyScalar(e)},projectOnPlane:function(){var t=new er;return function(e){return t.copy(this).projectOnVector(e),this.sub(t)}}(),reflect:function(){var t=new er;return function(e){return this.sub(t.copy(e).multiplyScalar(2*this.dot(e)))}}(),angleTo:function(t){var e=this.dot(t)/Math.sqrt(this.lengthSq()*t.lengthSq());return Math.acos(Qe.clamp(e,-1,1))},distanceTo:function(t){return Math.sqrt(this.distanceToSquared(t))},distanceToSquared:function(t){var e=this.x-t.x,r=this.y-t.y,n=this.z-t.z;return e*e+r*r+n*n},manhattanDistanceTo:function(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)},setFromSpherical:function(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)},setFromSphericalCoords:function(t,e,r){var n=Math.sin(e)*t;return this.x=n*Math.sin(r),this.y=Math.cos(e)*t,this.z=n*Math.cos(r),this},setFromCylindrical:function(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)},setFromCylindricalCoords:function(t,e,r){return this.x=t*Math.sin(e),this.y=r,this.z=t*Math.cos(e),this},setFromMatrixPosition:function(t){var e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this},setFromMatrixScale:function(t){var e=this.setFromMatrixColumn(t,0).length(),r=this.setFromMatrixColumn(t,1).length(),n=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=r,this.z=n,this},setFromMatrixColumn:function(t,e){return this.fromArray(t.elements,4*e)},equals:function(t){return t.x===this.x&&t.y===this.y&&t.z===this.z},fromArray:function(t,e){return void 0===e&&(e=0),this.x=t[e],this.y=t[e+1],this.z=t[e+2],this},toArray:function(t,e){return void 0===t&&(t=[]),void 0===e&&(e=0),t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t},fromBufferAttribute:function(t,e,r){return void 0!==r&&console.warn("THREE.Vector3: offset has been removed from .fromBufferAttribute()."),this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}}),Object.assign(rr.prototype,{isMatrix3:!0,set:function(t,e,r,n,i,a,o,s,c){var h=this.elements;return h[0]=t,h[1]=n,h[2]=o,h[3]=e,h[4]=i,h[5]=s,h[6]=r,h[7]=a,h[8]=c,this},identity:function(){return this.set(1,0,0,0,1,0,0,0,1),this},clone:function(){return(new this.constructor).fromArray(this.elements)},copy:function(t){var e=this.elements,r=t.elements;return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=r[3],e[4]=r[4],e[5]=r[5],e[6]=r[6],e[7]=r[7],e[8]=r[8],this},setFromMatrix4:function(t){var e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this},applyToBufferAttribute:function(){var t=new er;return function(e){for(var r=0,n=e.count;r<n;r++)t.x=e.getX(r),t.y=e.getY(r),t.z=e.getZ(r),t.applyMatrix3(this),e.setXYZ(r,t.x,t.y,t.z);return e}}(),multiply:function(t){return this.multiplyMatrices(this,t)},premultiply:function(t){return this.multiplyMatrices(t,this)},multiplyMatrices:function(t,e){var r=t.elements,n=e.elements,i=this.elements,a=r[0],o=r[3],s=r[6],c=r[1],h=r[4],l=r[7],u=r[2],p=r[5],d=r[8],f=n[0],m=n[3],g=n[6],v=n[1],y=n[4],x=n[7],b=n[2],w=n[5],_=n[8];return i[0]=a*f+o*v+s*b,i[3]=a*m+o*y+s*w,i[6]=a*g+o*x+s*_,i[1]=c*f+h*v+l*b,i[4]=c*m+h*y+l*w,i[7]=c*g+h*x+l*_,i[2]=u*f+p*v+d*b,i[5]=u*m+p*y+d*w,i[8]=u*g+p*x+d*_,this},multiplyScalar:function(t){var e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this},determinant:function(){var t=this.elements,e=t[0],r=t[1],n=t[2],i=t[3],a=t[4],o=t[5],s=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-r*i*h+r*o*s+n*i*c-n*a*s},getInverse:function(t,e){t&&t.isMatrix4&&console.error("THREE.Matrix3: .getInverse() no longer takes a Matrix4 argument.");var r=t.elements,n=this.elements,i=r[0],a=r[1],o=r[2],s=r[3],c=r[4],h=r[5],l=r[6],u=r[7],p=r[8],d=p*c-h*u,f=h*l-p*s,m=u*s-c*l,g=i*d+a*f+o*m;if(0===g){var v="THREE.Matrix3: .getInverse() can't invert matrix, determinant is 0";if(!0===e)throw new Error(v);return console.warn(v),this.identity()}var y=1/g;return n[0]=d*y,n[1]=(o*u-p*a)*y,n[2]=(h*a-o*c)*y,n[3]=f*y,n[4]=(p*i-o*l)*y,n[5]=(o*s-h*i)*y,n[6]=m*y,n[7]=(a*l-u*i)*y,n[8]=(c*i-a*s)*y,this},transpose:function(){var t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this},getNormalMatrix:function(t){return this.setFromMatrix4(t).getInverse(this).transpose()},transposeIntoArray:function(t){var e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this},setUvTransform:function(t,e,r,n,i,a,o){var s=Math.cos(i),c=Math.sin(i);this.set(r*s,r*c,-r*(s*a+c*o)+a+t,-n*c,n*s,-n*(-c*a+s*o)+o+e,0,0,1)},scale:function(t,e){var r=this.elements;return r[0]*=t,r[3]*=t,r[6]*=t,r[1]*=e,r[4]*=e,r[7]*=e,this},rotate:function(t){var e=Math.cos(t),r=Math.sin(t),n=this.elements,i=n[0],a=n[3],o=n[6],s=n[1],c=n[4],h=n[7];return n[0]=e*i+r*s,n[3]=e*a+r*c,n[6]=e*o+r*h,n[1]=-r*i+e*s,n[4]=-r*a+e*c,n[7]=-r*o+e*h,this},translate:function(t,e){var r=this.elements;return r[0]+=t*r[2],r[3]+=t*r[5],r[6]+=t*r[8],r[1]+=e*r[2],r[4]+=e*r[5],r[7]+=e*r[8],this},equals:function(t){for(var e=this.elements,r=t.elements,n=0;n<9;n++)if(e[n]!==r[n])return!1;return!0},fromArray:function(t,e){void 0===e&&(e=0);for(var r=0;r<9;r++)this.elements[r]=t[r+e];return this},toArray:function(t,e){void 0===t&&(t=[]),void 0===e&&(e=0);var r=this.elements;return t[e]=r[0],t[e+1]=r[1],t[e+2]=r[2],t[e+3]=r[3],t[e+4]=r[4],t[e+5]=r[5],t[e+6]=r[6],t[e+7]=r[7],t[e+8]=r[8],t}});var nr,ir,ar,or,sr,cr={getDataURL:function(t){var e;if("undefined"==typeof HTMLCanvasElement)return t.src;if(t instanceof HTMLCanvasElement)e=t;else{void 0===m&&(m=document.createElementNS("http://www.w3.org/1999/xhtml","canvas")),m.width=t.width,m.height=t.height;var r=m.getContext("2d");t instanceof ImageData?r.putImageData(t,0,0):r.drawImage(t,0,0,t.width,t.height),e=m}return e.width>2048||e.height>2048?e.toDataURL("image/jpeg",.6):e.toDataURL("image/png")}},hr=0;function lr(t,e,r,n,i,a,o,s,c,h){Object.defineProperty(this,"id",{value:hr++}),this.uuid=Qe.generateUUID(),this.name="",this.image=void 0!==t?t:lr.DEFAULT_IMAGE,this.mipmaps=[],this.mapping=void 0!==e?e:lr.DEFAULT_MAPPING,this.wrapS=void 0!==r?r:Rt,this.wrapT=void 0!==n?n:Rt,this.magFilter=void 0!==i?i:Dt,this.minFilter=void 0!==a?a:Bt,this.anisotropy=void 0!==c?c:1,this.format=void 0!==o?o:Qt,this.type=void 0!==s?s:zt,this.offset=new Ke(0,0),this.repeat=new Ke(1,1),this.center=new Ke(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new rr,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=void 0!==h?h:Ge,this.version=0,this.onUpdate=null}function ur(t,e,r,n){this.x=t||0,this.y=e||0,this.z=r||0,this.w=void 0!==n?n:1}function pr(t,e,r){this.width=t,this.height=e,this.scissor=new ur(0,0,t,e),this.scissorTest=!1,this.viewport=new ur(0,0,t,e),r=r||{},this.texture=new lr(void 0,void 0,r.wrapS,r.wrapT,r.magFilter,r.minFilter,r.format,r.type,r.anisotropy,r.encoding),this.texture.generateMipmaps=void 0!==r.generateMipmaps&&r.generateMipmaps,this.texture.minFilter=void 0!==r.minFilter?r.minFilter:Dt,this.depthBuffer=void 0===r.depthBuffer||r.depthBuffer,this.stencilBuffer=void 0===r.stencilBuffer||r.stencilBuffer,this.depthTexture=void 0!==r.depthTexture?r.depthTexture:null}function dr(t,e,r){pr.call(this,t,e,r),this.samples=4}function fr(t,e,r){pr.call(this,t,e,r),this.activeCubeFace=0,this.activeMipMapLevel=0}function mr(t,e,r,n,i,a,o,s,c,h,l,u){lr.call(this,null,a,o,s,c,h,n,i,l,u),this.image={data:t,width:e,height:r},this.magFilter=void 0!==c?c:Pt,this.minFilter=void 0!==h?h:Pt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}function gr(t,e){this.min=void 0!==t?t:new er(1/0,1/0,1/0),this.max=void 0!==e?e:new er(-1/0,-1/0,-1/0)}function vr(t,e){this.center=void 0!==t?t:new er,this.radius=void 0!==e?e:0}function yr(t,e){this.normal=void 0!==t?t:new er(1,0,0),this.constant=void 0!==e?e:0}function xr(t,e,r,n,i,a){this.planes=[void 0!==t?t:new yr,void 0!==e?e:new yr,void 0!==r?r:new yr,void 0!==n?n:new yr,void 0!==i?i:new yr,void 0!==a?a:new yr]}lr.DEFAULT_IMAGE=void 0,lr.DEFAULT_MAPPING=bt,lr.prototype=Object.assign(Object.create(n.prototype),{constructor:lr,isTexture:!0,updateMatrix:function(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.name=t.name,this.image=t.image,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.encoding=t.encoding,this},toJSON:function(t){var e=void 0===t||"string"==typeof t;if(!e&&void 0!==t.textures[this.uuid])return t.textures[this.uuid];var r={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(void 0!==this.image){var n=this.image;if(void 0===n.uuid&&(n.uuid=Qe.generateUUID()),!e&&void 0===t.images[n.uuid]){var i;if(Array.isArray(n)){i=[];for(var a=0,o=n.length;a<o;a++)i.push(cr.getDataURL(n[a]))}else i=cr.getDataURL(n);t.images[n.uuid]={uuid:n.uuid,url:i}}r.image=n.uuid}return e||(t.textures[this.uuid]=r),r},dispose:function(){this.dispatchEvent({type:"dispose"})},transformUv:function(t){if(this.mapping!==bt)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Lt:t.x=t.x-Math.floor(t.x);break;case Rt:t.x=t.x<0?0:1;break;case Ct:1===Math.abs(Math.floor(t.x)%2)?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x)}if(t.y<0||t.y>1)switch(this.wrapT){case Lt:t.y=t.y-Math.floor(t.y);break;case Rt:t.y=t.y<0?0:1;break;case Ct:1===Math.abs(Math.floor(t.y)%2)?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y)}return this.flipY&&(t.y=1-t.y),t}}),Object.defineProperty(lr.prototype,"needsUpdate",{set:function(t){!0===t&&this.version++}}),Object.assign(ur.prototype,{isVector4:!0,set:function(t,e,r,n){return this.x=t,this.y=e,this.z=r,this.w=n,this},setScalar:function(t){return this.x=t,this.y=t,this.z=t,this.w=t,this},setX:function(t){return this.x=t,this},setY:function(t){return this.y=t,this},setZ:function(t){return this.z=t,this},setW:function(t){return this.w=t,this},setComponent:function(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this},getComponent:function(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}},clone:function(){return new this.constructor(this.x,this.y,this.z,this.w)},copy:function(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=void 0!==t.w?t.w:1,this},add:function(t,e){return void 0!==e?(console.warn("THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(t,e)):(this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this)},addScalar:function(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this},addVectors:function(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this},addScaledVector:function(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this},sub:function(t,e){return void 0!==e?(console.warn("THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(t,e)):(this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this)},subScalar:function(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this},subVectors:function(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this},multiplyScalar:function(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this},applyMatrix4:function(t){var e=this.x,r=this.y,n=this.z,i=this.w,a=t.elements;return this.x=a[0]*e+a[4]*r+a[8]*n+a[12]*i,this.y=a[1]*e+a[5]*r+a[9]*n+a[13]*i,this.z=a[2]*e+a[6]*r+a[10]*n+a[14]*i,this.w=a[3]*e+a[7]*r+a[11]*n+a[15]*i,this},divideScalar:function(t){return this.multiplyScalar(1/t)},setAxisAngleFromQuaternion:function(t){this.w=2*Math.acos(t.w);var e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this},setAxisAngleFromRotationMatrix:function(t){var e,r,n,i,a=.01,o=.1,s=t.elements,c=s[0],h=s[4],l=s[8],u=s[1],p=s[5],d=s[9],f=s[2],m=s[6],g=s[10];if(Math.abs(h-u)<a&&Math.abs(l-f)<a&&Math.abs(d-m)<a){if(Math.abs(h+u)<o&&Math.abs(l+f)<o&&Math.abs(d+m)<o&&Math.abs(c+p+g-3)<o)return this.set(1,0,0,0),this;e=Math.PI;var v=(c+1)/2,y=(p+1)/2,x=(g+1)/2,b=(h+u)/4,w=(l+f)/4,_=(d+m)/4;return v>y&&v>x?v<a?(r=0,n=.707106781,i=.707106781):(n=b/(r=Math.sqrt(v)),i=w/r):y>x?y<a?(r=.707106781,n=0,i=.707106781):(r=b/(n=Math.sqrt(y)),i=_/n):x<a?(r=.707106781,n=.707106781,i=0):(r=w/(i=Math.sqrt(x)),n=_/i),this.set(r,n,i,e),this}var M=Math.sqrt((m-d)*(m-d)+(l-f)*(l-f)+(u-h)*(u-h));return Math.abs(M)<.001&&(M=1),this.x=(m-d)/M,this.y=(l-f)/M,this.z=(u-h)/M,this.w=Math.acos((c+p+g-1)/2),this},min:function(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this},max:function(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this},clamp:function(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this},clampScalar:function(){var t,e;return function(r,n){return void 0===t&&(t=new ur,e=new ur),t.set(r,r,r,r),e.set(n,n,n,n),this.clamp(t,e)}}(),clampLength:function(t,e){var r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(t,Math.min(e,r)))},floor:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this},ceil:function(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this},round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this},roundToZero:function(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this},negate:function(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this},dot:function(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w},lengthSq:function(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w},length:function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)},manhattanLength:function(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)},normalize:function(){return this.divideScalar(this.length()||1)},setLength:function(t){return this.normalize().multiplyScalar(t)},lerp:function(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this},lerpVectors:function(t,e,r){return this.subVectors(e,t).multiplyScalar(r).add(t)},equals:function(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w},fromArray:function(t,e){return void 0===e&&(e=0),this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this},toArray:function(t,e){return void 0===t&&(t=[]),void 0===e&&(e=0),t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t},fromBufferAttribute:function(t,e,r){return void 0!==r&&console.warn("THREE.Vector4: offset has been removed from .fromBufferAttribute()."),this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}}),pr.prototype=Object.assign(Object.create(n.prototype),{constructor:pr,isWebGLRenderTarget:!0,setSize:function(t,e){this.width===t&&this.height===e||(this.width=t,this.height=e,this.dispose()),this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.width=t.width,this.height=t.height,this.viewport.copy(t.viewport),this.texture=t.texture.clone(),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.depthTexture=t.depthTexture,this},dispose:function(){this.dispatchEvent({type:"dispose"})}}),dr.prototype=Object.assign(Object.create(pr.prototype),{constructor:dr,isWebGLMultisampleRenderTarget:!0,copy:function(t){return pr.prototype.copy.call(this,t),this.samples=t.samples,this}}),fr.prototype=Object.create(pr.prototype),fr.prototype.constructor=fr,fr.prototype.isWebGLRenderTargetCube=!0,mr.prototype=Object.create(lr.prototype),mr.prototype.constructor=mr,mr.prototype.isDataTexture=!0,Object.assign(gr.prototype,{isBox3:!0,set:function(t,e){return this.min.copy(t),this.max.copy(e),this},setFromArray:function(t){for(var e=1/0,r=1/0,n=1/0,i=-1/0,a=-1/0,o=-1/0,s=0,c=t.length;s<c;s+=3){var h=t[s],l=t[s+1],u=t[s+2];h<e&&(e=h),l<r&&(r=l),u<n&&(n=u),h>i&&(i=h),l>a&&(a=l),u>o&&(o=u)}return this.min.set(e,r,n),this.max.set(i,a,o),this},setFromBufferAttribute:function(t){for(var e=1/0,r=1/0,n=1/0,i=-1/0,a=-1/0,o=-1/0,s=0,c=t.count;s<c;s++){var h=t.getX(s),l=t.getY(s),u=t.getZ(s);h<e&&(e=h),l<r&&(r=l),u<n&&(n=u),h>i&&(i=h),l>a&&(a=l),u>o&&(o=u)}return this.min.set(e,r,n),this.max.set(i,a,o),this},setFromPoints:function(t){this.makeEmpty();for(var e=0,r=t.length;e<r;e++)this.expandByPoint(t[e]);return this},setFromCenterAndSize:function(){var t=new er;return function(e,r){var n=t.copy(r).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}}(),setFromObject:function(t){return this.makeEmpty(),this.expandByObject(t)},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.min.copy(t.min),this.max.copy(t.max),this},makeEmpty:function(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this},isEmpty:function(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z},getCenter:function(t){return void 0===t&&(console.warn("THREE.Box3: .getCenter() target is now required"),t=new er),this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)},getSize:function(t){return void 0===t&&(console.warn("THREE.Box3: .getSize() target is now required"),t=new er),this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)},expandByPoint:function(t){return this.min.min(t),this.max.max(t),this},expandByVector:function(t){return this.min.sub(t),this.max.add(t),this},expandByScalar:function(t){return this.min.addScalar(-t),this.max.addScalar(t),this},expandByObject:function(){var t,e,r,n=new er;function i(i){var a=i.geometry;if(void 0!==a)if(a.isGeometry){var o=a.vertices;for(e=0,r=o.length;e<r;e++)n.copy(o[e]),n.applyMatrix4(i.matrixWorld),t.expandByPoint(n)}else if(a.isBufferGeometry){var s=a.attributes.position;if(void 0!==s)for(e=0,r=s.count;e<r;e++)n.fromBufferAttribute(s,e).applyMatrix4(i.matrixWorld),t.expandByPoint(n)}}return function(e){return t=this,e.updateMatrixWorld(!0),e.traverse(i),this}}(),containsPoint:function(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)},containsBox:function(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z},getParameter:function(t,e){return void 0===e&&(console.warn("THREE.Box3: .getParameter() target is now required"),e=new er),e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))},intersectsBox:function(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)},intersectsSphere:(ir=new er,function(t){return this.clampPoint(t.center,ir),ir.distanceToSquared(t.center)<=t.radius*t.radius}),intersectsPlane:function(t){var e,r;return t.normal.x>0?(e=t.normal.x*this.min.x,r=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,r=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,r+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,r+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,r+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,r+=t.normal.z*this.min.z),e<=-t.constant&&r>=-t.constant},intersectsTriangle:function(){var t=new er,e=new er,r=new er,n=new er,i=new er,a=new er,o=new er,s=new er,c=new er,h=new er;function l(n){var i,a;for(i=0,a=n.length-3;i<=a;i+=3){o.fromArray(n,i);var s=c.x*Math.abs(o.x)+c.y*Math.abs(o.y)+c.z*Math.abs(o.z),h=t.dot(o),l=e.dot(o),u=r.dot(o);if(Math.max(-Math.max(h,l,u),Math.min(h,l,u))>s)return!1}return!0}return function(o){if(this.isEmpty())return!1;this.getCenter(s),c.subVectors(this.max,s),t.subVectors(o.a,s),e.subVectors(o.b,s),r.subVectors(o.c,s),n.subVectors(e,t),i.subVectors(r,e),a.subVectors(t,r);var u=[0,-n.z,n.y,0,-i.z,i.y,0,-a.z,a.y,n.z,0,-n.x,i.z,0,-i.x,a.z,0,-a.x,-n.y,n.x,0,-i.y,i.x,0,-a.y,a.x,0];return!!l(u)&&!!l(u=[1,0,0,0,1,0,0,0,1])&&(h.crossVectors(n,i),l(u=[h.x,h.y,h.z]))}}(),clampPoint:function(t,e){return void 0===e&&(console.warn("THREE.Box3: .clampPoint() target is now required"),e=new er),e.copy(t).clamp(this.min,this.max)},distanceToPoint:function(){var t=new er;return function(e){return t.copy(e).clamp(this.min,this.max).sub(e).length()}}(),getBoundingSphere:function(){var t=new er;return function(e){return void 0===e&&(console.warn("THREE.Box3: .getBoundingSphere() target is now required"),e=new vr),this.getCenter(e.center),e.radius=.5*this.getSize(t).length(),e}}(),intersect:function(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this},union:function(t){return this.min.min(t.min),this.max.max(t.max),this},applyMatrix4:(nr=[new er,new er,new er,new er,new er,new er,new er,new er],function(t){return this.isEmpty()||(nr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),nr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),nr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),nr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),nr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),nr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),nr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),nr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(nr)),this}),translate:function(t){return this.min.add(t),this.max.add(t),this},equals:function(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}),Object.assign(vr.prototype,{set:function(t,e){return this.center.copy(t),this.radius=e,this},setFromPoints:(ar=new gr,function(t,e){var r=this.center;void 0!==e?r.copy(e):ar.setFromPoints(t).getCenter(r);for(var n=0,i=0,a=t.length;i<a;i++)n=Math.max(n,r.distanceToSquared(t[i]));return this.radius=Math.sqrt(n),this}),clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.center.copy(t.center),this.radius=t.radius,this},empty:function(){return this.radius<=0},containsPoint:function(t){return t.distanceToSquared(this.center)<=this.radius*this.radius},distanceToPoint:function(t){return t.distanceTo(this.center)-this.radius},intersectsSphere:function(t){var e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e},intersectsBox:function(t){return t.intersectsSphere(this)},intersectsPlane:function(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius},clampPoint:function(t,e){var r=this.center.distanceToSquared(t);return void 0===e&&(console.warn("THREE.Sphere: .clampPoint() target is now required"),e=new er),e.copy(t),r>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e},getBoundingBox:function(t){return void 0===t&&(console.warn("THREE.Sphere: .getBoundingBox() target is now required"),t=new gr),t.set(this.center,this.center),t.expandByScalar(this.radius),t},applyMatrix4:function(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this},translate:function(t){return this.center.add(t),this},equals:function(t){return t.center.equals(this.center)&&t.radius===this.radius}}),Object.assign(yr.prototype,{set:function(t,e){return this.normal.copy(t),this.constant=e,this},setComponents:function(t,e,r,n){return this.normal.set(t,e,r),this.constant=n,this},setFromNormalAndCoplanarPoint:function(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this},setFromCoplanarPoints:function(){var t=new er,e=new er;return function(r,n,i){var a=t.subVectors(i,n).cross(e.subVectors(r,n)).normalize();return this.setFromNormalAndCoplanarPoint(a,r),this}}(),clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.normal.copy(t.normal),this.constant=t.constant,this},normalize:function(){var t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this},negate:function(){return this.constant*=-1,this.normal.negate(),this},distanceToPoint:function(t){return this.normal.dot(t)+this.constant},distanceToSphere:function(t){return this.distanceToPoint(t.center)-t.radius},projectPoint:function(t,e){return void 0===e&&(console.warn("THREE.Plane: .projectPoint() target is now required"),e=new er),e.copy(this.normal).multiplyScalar(-this.distanceToPoint(t)).add(t)},intersectLine:function(){var t=new er;return function(e,r){void 0===r&&(console.warn("THREE.Plane: .intersectLine() target is now required"),r=new er);var n=e.delta(t),i=this.normal.dot(n);if(0===i)return 0===this.distanceToPoint(e.start)?r.copy(e.start):void 0;var a=-(e.start.dot(this.normal)+this.constant)/i;return a<0||a>1?void 0:r.copy(n).multiplyScalar(a).add(e.start)}}(),intersectsLine:function(t){var e=this.distanceToPoint(t.start),r=this.distanceToPoint(t.end);return e<0&&r>0||r<0&&e>0},intersectsBox:function(t){return t.intersectsPlane(this)},intersectsSphere:function(t){return t.intersectsPlane(this)},coplanarPoint:function(t){return void 0===t&&(console.warn("THREE.Plane: .coplanarPoint() target is now required"),t=new er),t.copy(this.normal).multiplyScalar(-this.constant)},applyMatrix4:function(){var t=new er,e=new rr;return function(r,n){var i=n||e.getNormalMatrix(r),a=this.coplanarPoint(t).applyMatrix4(r),o=this.normal.applyMatrix3(i).normalize();return this.constant=-a.dot(o),this}}(),translate:function(t){return this.constant-=t.dot(this.normal),this},equals:function(t){return t.normal.equals(this.normal)&&t.constant===this.constant}}),Object.assign(xr.prototype,{set:function(t,e,r,n,i,a){var o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(r),o[3].copy(n),o[4].copy(i),o[5].copy(a),this},clone:function(){return(new this.constructor).copy(this)},copy:function(t){for(var e=this.planes,r=0;r<6;r++)e[r].copy(t.planes[r]);return this},setFromMatrix:function(t){var e=this.planes,r=t.elements,n=r[0],i=r[1],a=r[2],o=r[3],s=r[4],c=r[5],h=r[6],l=r[7],u=r[8],p=r[9],d=r[10],f=r[11],m=r[12],g=r[13],v=r[14],y=r[15];return e[0].setComponents(o-n,l-s,f-u,y-m).normalize(),e[1].setComponents(o+n,l+s,f+u,y+m).normalize(),e[2].setComponents(o+i,l+c,f+p,y+g).normalize(),e[3].setComponents(o-i,l-c,f-p,y-g).normalize(),e[4].setComponents(o-a,l-h,f-d,y-v).normalize(),e[5].setComponents(o+a,l+h,f+d,y+v).normalize(),this},intersectsObject:(sr=new vr,function(t){var e=t.geometry;return null===e.boundingSphere&&e.computeBoundingSphere(),sr.copy(e.boundingSphere).applyMatrix4(t.matrixWorld),this.intersectsSphere(sr)}),intersectsSprite:function(){var t=new vr;return function(e){return t.center.set(0,0,0),t.radius=.7071067811865476,t.applyMatrix4(e.matrixWorld),this.intersectsSphere(t)}}(),intersectsSphere:function(t){for(var e=this.planes,r=t.center,n=-t.radius,i=0;i<6;i++)if(e[i].distanceToPoint(r)<n)return!1;return!0},intersectsBox:(or=new er,function(t){for(var e=this.planes,r=0;r<6;r++){var n=e[r];if(or.x=n.normal.x>0?t.max.x:t.min.x,or.y=n.normal.y>0?t.max.y:t.min.y,or.z=n.normal.z>0?t.max.z:t.min.z,n.distanceToPoint(or)<0)return!1}return!0}),containsPoint:function(t){for(var e=this.planes,r=0;r<6;r++)if(e[r].distanceToPoint(t)<0)return!1;return!0}});var br={alphamap_fragment:"#ifdef USE_ALPHAMAP\n\tdiffuseColor.a *= texture2D( alphaMap, vUv ).g;\n#endif",alphamap_pars_fragment:"#ifdef USE_ALPHAMAP\n\tuniform sampler2D alphaMap;\n#endif",alphatest_fragment:"#ifdef ALPHATEST\n\tif ( diffuseColor.a < ALPHATEST ) discard;\n#endif",aomap_fragment:"#ifdef USE_AOMAP\n\tfloat ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;\n\treflectedLight.indirectDiffuse *= ambientOcclusion;\n\t#if defined( USE_ENVMAP ) && defined( PHYSICAL )\n\t\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\t\treflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );\n\t#endif\n#endif",aomap_pars_fragment:"#ifdef USE_AOMAP\n\tuniform sampler2D aoMap;\n\tuniform float aoMapIntensity;\n#endif",begin_vertex:"vec3 transformed = vec3( position );",beginnormal_vertex:"vec3 objectNormal = vec3( normal );",bsdfs:"vec2 integrateSpecularBRDF( const in float dotNV, const in float roughness ) {\n\tconst vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );\n\tconst vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );\n\tvec4 r = roughness * c0 + c1;\n\tfloat a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;\n\treturn vec2( -1.04, 1.04 ) * a004 + r.zw;\n}\nfloat punctualLightIntensityToIrradianceFactor( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n#if defined ( PHYSICALLY_CORRECT_LIGHTS )\n\tfloat distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n\tif( cutoffDistance > 0.0 ) {\n\t\tdistanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n\t}\n\treturn distanceFalloff;\n#else\n\tif( cutoffDistance > 0.0 && decayExponent > 0.0 ) {\n\t\treturn pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );\n\t}\n\treturn 1.0;\n#endif\n}\nvec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {\n\treturn RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {\n\tfloat fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );\n\treturn ( 1.0 - specularColor ) * fresnel + specularColor;\n}\nfloat G_GGX_Smith( const in float alpha, const in float dotNL, const in float dotNV ) {\n\tfloat a2 = pow2( alpha );\n\tfloat gl = dotNL + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n\tfloat gv = dotNV + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n\treturn 1.0 / ( gl * gv );\n}\nfloat G_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n\tfloat a2 = pow2( alpha );\n\tfloat gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n\tfloat gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n\treturn 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n\tfloat a2 = pow2( alpha );\n\tfloat denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n\treturn RECIPROCAL_PI * a2 / pow2( denom );\n}\nvec3 BRDF_Specular_GGX( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {\n\tfloat alpha = pow2( roughness );\n\tvec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );\n\tfloat dotNL = saturate( dot( geometry.normal, incidentLight.direction ) );\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\tfloat dotNH = saturate( dot( geometry.normal, halfDir ) );\n\tfloat dotLH = saturate( dot( incidentLight.direction, halfDir ) );\n\tvec3 F = F_Schlick( specularColor, dotLH );\n\tfloat G = G_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n\tfloat D = D_GGX( alpha, dotNH );\n\treturn F * ( G * D );\n}\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\n\tconst float LUT_SIZE  = 64.0;\n\tconst float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\n\tconst float LUT_BIAS  = 0.5 / LUT_SIZE;\n\tfloat dotNV = saturate( dot( N, V ) );\n\tvec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );\n\tuv = uv * LUT_SCALE + LUT_BIAS;\n\treturn uv;\n}\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\n\tfloat l = length( f );\n\treturn max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\n}\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\n\tfloat x = dot( v1, v2 );\n\tfloat y = abs( x );\n\tfloat a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;\n\tfloat b = 3.4175940 + ( 4.1616724 + y ) * y;\n\tfloat v = a / b;\n\tfloat theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;\n\treturn cross( v1, v2 ) * theta_sintheta;\n}\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\n\tvec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\n\tvec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\n\tvec3 lightNormal = cross( v1, v2 );\n\tif( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\n\tvec3 T1, T2;\n\tT1 = normalize( V - N * dot( V, N ) );\n\tT2 = - cross( N, T1 );\n\tmat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );\n\tvec3 coords[ 4 ];\n\tcoords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\n\tcoords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\n\tcoords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\n\tcoords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\n\tcoords[ 0 ] = normalize( coords[ 0 ] );\n\tcoords[ 1 ] = normalize( coords[ 1 ] );\n\tcoords[ 2 ] = normalize( coords[ 2 ] );\n\tcoords[ 3 ] = normalize( coords[ 3 ] );\n\tvec3 vectorFormFactor = vec3( 0.0 );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\n\tvectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\n\tfloat result = LTC_ClippedSphereFormFactor( vectorFormFactor );\n\treturn vec3( result );\n}\nvec3 BRDF_Specular_GGX_Environment( const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\tvec2 brdf = integrateSpecularBRDF( dotNV, roughness );\n\treturn specularColor * brdf.x + brdf.y;\n}\nvoid BRDF_Specular_Multiscattering_Environment( const in GeometricContext geometry, const in vec3 specularColor, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {\n\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\tvec3 F = F_Schlick( specularColor, dotNV );\n\tvec2 brdf = integrateSpecularBRDF( dotNV, roughness );\n\tvec3 FssEss = F * brdf.x + brdf.y;\n\tfloat Ess = brdf.x + brdf.y;\n\tfloat Ems = 1.0 - Ess;\n\tvec3 Favg = specularColor + ( 1.0 - specularColor ) * 0.047619;\tvec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );\n\tsingleScatter += FssEss;\n\tmultiScatter += Fms * Ems;\n}\nfloat G_BlinnPhong_Implicit( ) {\n\treturn 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n\treturn RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_Specular_BlinnPhong( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {\n\tvec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );\n\tfloat dotNH = saturate( dot( geometry.normal, halfDir ) );\n\tfloat dotLH = saturate( dot( incidentLight.direction, halfDir ) );\n\tvec3 F = F_Schlick( specularColor, dotLH );\n\tfloat G = G_BlinnPhong_Implicit( );\n\tfloat D = D_BlinnPhong( shininess, dotNH );\n\treturn F * ( G * D );\n}\nfloat GGXRoughnessToBlinnExponent( const in float ggxRoughness ) {\n\treturn ( 2.0 / pow2( ggxRoughness + 0.0001 ) - 2.0 );\n}\nfloat BlinnExponentToGGXRoughness( const in float blinnExponent ) {\n\treturn sqrt( 2.0 / ( blinnExponent + 2.0 ) );\n}",bumpmap_pars_fragment:"#ifdef USE_BUMPMAP\n\tuniform sampler2D bumpMap;\n\tuniform float bumpScale;\n\tvec2 dHdxy_fwd() {\n\t\tvec2 dSTdx = dFdx( vUv );\n\t\tvec2 dSTdy = dFdy( vUv );\n\t\tfloat Hll = bumpScale * texture2D( bumpMap, vUv ).x;\n\t\tfloat dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;\n\t\tfloat dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;\n\t\treturn vec2( dBx, dBy );\n\t}\n\tvec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {\n\t\tvec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );\n\t\tvec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );\n\t\tvec3 vN = surf_norm;\n\t\tvec3 R1 = cross( vSigmaY, vN );\n\t\tvec3 R2 = cross( vN, vSigmaX );\n\t\tfloat fDet = dot( vSigmaX, R1 );\n\t\tfDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t\tvec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n\t\treturn normalize( abs( fDet ) * surf_norm - vGrad );\n\t}\n#endif",clipping_planes_fragment:"#if NUM_CLIPPING_PLANES > 0\n\tvec4 plane;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n\t\tplane = clippingPlanes[ i ];\n\t\tif ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;\n\t}\n\t#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n\t\tbool clipped = true;\n\t\t#pragma unroll_loop\n\t\tfor ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n\t\t\tplane = clippingPlanes[ i ];\n\t\t\tclipped = ( dot( vViewPosition, plane.xyz ) > plane.w ) && clipped;\n\t\t}\n\t\tif ( clipped ) discard;\n\t#endif\n#endif",clipping_planes_pars_fragment:"#if NUM_CLIPPING_PLANES > 0\n\t#if ! defined( PHYSICAL ) && ! defined( PHONG ) && ! defined( MATCAP )\n\t\tvarying vec3 vViewPosition;\n\t#endif\n\tuniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif",clipping_planes_pars_vertex:"#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG ) && ! defined( MATCAP )\n\tvarying vec3 vViewPosition;\n#endif",clipping_planes_vertex:"#if NUM_CLIPPING_PLANES > 0 && ! defined( PHYSICAL ) && ! defined( PHONG ) && ! defined( MATCAP )\n\tvViewPosition = - mvPosition.xyz;\n#endif",color_fragment:"#ifdef USE_COLOR\n\tdiffuseColor.rgb *= vColor;\n#endif",color_pars_fragment:"#ifdef USE_COLOR\n\tvarying vec3 vColor;\n#endif",color_pars_vertex:"#ifdef USE_COLOR\n\tvarying vec3 vColor;\n#endif",color_vertex:"#ifdef USE_COLOR\n\tvColor.xyz = color.xyz;\n#endif",common:"#define PI 3.14159265359\n#define PI2 6.28318530718\n#define PI_HALF 1.5707963267949\n#define RECIPROCAL_PI 0.31830988618\n#define RECIPROCAL_PI2 0.15915494\n#define LOG2 1.442695\n#define EPSILON 1e-6\n#define saturate(a) clamp( a, 0.0, 1.0 )\n#define whiteCompliment(a) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }\nhighp float rand( const in vec2 uv ) {\n\tconst highp float a = 12.9898, b = 78.233, c = 43758.5453;\n\thighp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n\treturn fract(sin(sn) * c);\n}\nstruct IncidentLight {\n\tvec3 color;\n\tvec3 direction;\n\tbool visible;\n};\nstruct ReflectedLight {\n\tvec3 directDiffuse;\n\tvec3 directSpecular;\n\tvec3 indirectDiffuse;\n\tvec3 indirectSpecular;\n};\nstruct GeometricContext {\n\tvec3 position;\n\tvec3 normal;\n\tvec3 viewDir;\n};\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\nvec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {\n\treturn normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );\n}\nvec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {\n\tfloat distance = dot( planeNormal, point - pointOnPlane );\n\treturn - distance * planeNormal + point;\n}\nfloat sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {\n\treturn sign( dot( point - pointOnPlane, planeNormal ) );\n}\nvec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {\n\treturn lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;\n}\nmat3 transposeMat3( const in mat3 m ) {\n\tmat3 tmp;\n\ttmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );\n\ttmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );\n\ttmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );\n\treturn tmp;\n}\nfloat linearToRelativeLuminance( const in vec3 color ) {\n\tvec3 weights = vec3( 0.2126, 0.7152, 0.0722 );\n\treturn dot( weights, color.rgb );\n}",cube_uv_reflection_fragment:"#ifdef ENVMAP_TYPE_CUBE_UV\n#define cubeUV_textureSize (1024.0)\nint getFaceFromDirection(vec3 direction) {\n\tvec3 absDirection = abs(direction);\n\tint face = -1;\n\tif( absDirection.x > absDirection.z ) {\n\t\tif(absDirection.x > absDirection.y )\n\t\t\tface = direction.x > 0.0 ? 0 : 3;\n\t\telse\n\t\t\tface = direction.y > 0.0 ? 1 : 4;\n\t}\n\telse {\n\t\tif(absDirection.z > absDirection.y )\n\t\t\tface = direction.z > 0.0 ? 2 : 5;\n\t\telse\n\t\t\tface = direction.y > 0.0 ? 1 : 4;\n\t}\n\treturn face;\n}\n#define cubeUV_maxLods1  (log2(cubeUV_textureSize*0.25) - 1.0)\n#define cubeUV_rangeClamp (exp2((6.0 - 1.0) * 2.0))\nvec2 MipLevelInfo( vec3 vec, float roughnessLevel, float roughness ) {\n\tfloat scale = exp2(cubeUV_maxLods1 - roughnessLevel);\n\tfloat dxRoughness = dFdx(roughness);\n\tfloat dyRoughness = dFdy(roughness);\n\tvec3 dx = dFdx( vec * scale * dxRoughness );\n\tvec3 dy = dFdy( vec * scale * dyRoughness );\n\tfloat d = max( dot( dx, dx ), dot( dy, dy ) );\n\td = clamp(d, 1.0, cubeUV_rangeClamp);\n\tfloat mipLevel = 0.5 * log2(d);\n\treturn vec2(floor(mipLevel), fract(mipLevel));\n}\n#define cubeUV_maxLods2 (log2(cubeUV_textureSize*0.25) - 2.0)\n#define cubeUV_rcpTextureSize (1.0 / cubeUV_textureSize)\nvec2 getCubeUV(vec3 direction, float roughnessLevel, float mipLevel) {\n\tmipLevel = roughnessLevel > cubeUV_maxLods2 - 3.0 ? 0.0 : mipLevel;\n\tfloat a = 16.0 * cubeUV_rcpTextureSize;\n\tvec2 exp2_packed = exp2( vec2( roughnessLevel, mipLevel ) );\n\tvec2 rcp_exp2_packed = vec2( 1.0 ) / exp2_packed;\n\tfloat powScale = exp2_packed.x * exp2_packed.y;\n\tfloat scale = rcp_exp2_packed.x * rcp_exp2_packed.y * 0.25;\n\tfloat mipOffset = 0.75*(1.0 - rcp_exp2_packed.y) * rcp_exp2_packed.x;\n\tbool bRes = mipLevel == 0.0;\n\tscale =  bRes && (scale < a) ? a : scale;\n\tvec3 r;\n\tvec2 offset;\n\tint face = getFaceFromDirection(direction);\n\tfloat rcpPowScale = 1.0 / powScale;\n\tif( face == 0) {\n\t\tr = vec3(direction.x, -direction.z, direction.y);\n\t\toffset = vec2(0.0+mipOffset,0.75 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? a : offset.y;\n\t}\n\telse if( face == 1) {\n\t\tr = vec3(direction.y, direction.x, direction.z);\n\t\toffset = vec2(scale+mipOffset, 0.75 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? a : offset.y;\n\t}\n\telse if( face == 2) {\n\t\tr = vec3(direction.z, direction.x, direction.y);\n\t\toffset = vec2(2.0*scale+mipOffset, 0.75 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? a : offset.y;\n\t}\n\telse if( face == 3) {\n\t\tr = vec3(direction.x, direction.z, direction.y);\n\t\toffset = vec2(0.0+mipOffset,0.5 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? 0.0 : offset.y;\n\t}\n\telse if( face == 4) {\n\t\tr = vec3(direction.y, direction.x, -direction.z);\n\t\toffset = vec2(scale+mipOffset, 0.5 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? 0.0 : offset.y;\n\t}\n\telse {\n\t\tr = vec3(direction.z, -direction.x, direction.y);\n\t\toffset = vec2(2.0*scale+mipOffset, 0.5 * rcpPowScale);\n\t\toffset.y = bRes && (offset.y < 2.0*a) ? 0.0 : offset.y;\n\t}\n\tr = normalize(r);\n\tfloat texelOffset = 0.5 * cubeUV_rcpTextureSize;\n\tvec2 s = ( r.yz / abs( r.x ) + vec2( 1.0 ) ) * 0.5;\n\tvec2 base = offset + vec2( texelOffset );\n\treturn base + s * ( scale - 2.0 * texelOffset );\n}\n#define cubeUV_maxLods3 (log2(cubeUV_textureSize*0.25) - 3.0)\nvec4 textureCubeUV( sampler2D envMap, vec3 reflectedDirection, float roughness ) {\n\tfloat roughnessVal = roughness* cubeUV_maxLods3;\n\tfloat r1 = floor(roughnessVal);\n\tfloat r2 = r1 + 1.0;\n\tfloat t = fract(roughnessVal);\n\tvec2 mipInfo = MipLevelInfo(reflectedDirection, r1, roughness);\n\tfloat s = mipInfo.y;\n\tfloat level0 = mipInfo.x;\n\tfloat level1 = level0 + 1.0;\n\tlevel1 = level1 > 5.0 ? 5.0 : level1;\n\tlevel0 += min( floor( s + 0.5 ), 5.0 );\n\tvec2 uv_10 = getCubeUV(reflectedDirection, r1, level0);\n\tvec4 color10 = envMapTexelToLinear(texture2D(envMap, uv_10));\n\tvec2 uv_20 = getCubeUV(reflectedDirection, r2, level0);\n\tvec4 color20 = envMapTexelToLinear(texture2D(envMap, uv_20));\n\tvec4 result = mix(color10, color20, t);\n\treturn vec4(result.rgb, 1.0);\n}\n#endif",defaultnormal_vertex:"vec3 transformedNormal = normalMatrix * objectNormal;\n#ifdef FLIP_SIDED\n\ttransformedNormal = - transformedNormal;\n#endif",displacementmap_pars_vertex:"#ifdef USE_DISPLACEMENTMAP\n\tuniform sampler2D displacementMap;\n\tuniform float displacementScale;\n\tuniform float displacementBias;\n#endif",displacementmap_vertex:"#ifdef USE_DISPLACEMENTMAP\n\ttransformed += normalize( objectNormal ) * ( texture2D( displacementMap, uv ).x * displacementScale + displacementBias );\n#endif",emissivemap_fragment:"#ifdef USE_EMISSIVEMAP\n\tvec4 emissiveColor = texture2D( emissiveMap, vUv );\n\temissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;\n\ttotalEmissiveRadiance *= emissiveColor.rgb;\n#endif",emissivemap_pars_fragment:"#ifdef USE_EMISSIVEMAP\n\tuniform sampler2D emissiveMap;\n#endif",encodings_fragment:"gl_FragColor = linearToOutputTexel( gl_FragColor );",encodings_pars_fragment:"\nvec4 LinearToLinear( in vec4 value ) {\n\treturn value;\n}\nvec4 GammaToLinear( in vec4 value, in float gammaFactor ) {\n\treturn vec4( pow( value.rgb, vec3( gammaFactor ) ), value.a );\n}\nvec4 LinearToGamma( in vec4 value, in float gammaFactor ) {\n\treturn vec4( pow( value.rgb, vec3( 1.0 / gammaFactor ) ), value.a );\n}\nvec4 sRGBToLinear( in vec4 value ) {\n\treturn vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );\n}\nvec4 LinearTosRGB( in vec4 value ) {\n\treturn vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );\n}\nvec4 RGBEToLinear( in vec4 value ) {\n\treturn vec4( value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );\n}\nvec4 LinearToRGBE( in vec4 value ) {\n\tfloat maxComponent = max( max( value.r, value.g ), value.b );\n\tfloat fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );\n\treturn vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );\n}\nvec4 RGBMToLinear( in vec4 value, in float maxRange ) {\n\treturn vec4( value.rgb * value.a * maxRange, 1.0 );\n}\nvec4 LinearToRGBM( in vec4 value, in float maxRange ) {\n\tfloat maxRGB = max( value.r, max( value.g, value.b ) );\n\tfloat M = clamp( maxRGB / maxRange, 0.0, 1.0 );\n\tM = ceil( M * 255.0 ) / 255.0;\n\treturn vec4( value.rgb / ( M * maxRange ), M );\n}\nvec4 RGBDToLinear( in vec4 value, in float maxRange ) {\n\treturn vec4( value.rgb * ( ( maxRange / 255.0 ) / value.a ), 1.0 );\n}\nvec4 LinearToRGBD( in vec4 value, in float maxRange ) {\n\tfloat maxRGB = max( value.r, max( value.g, value.b ) );\n\tfloat D = max( maxRange / maxRGB, 1.0 );\n\tD = min( floor( D ) / 255.0, 1.0 );\n\treturn vec4( value.rgb * ( D * ( 255.0 / maxRange ) ), D );\n}\nconst mat3 cLogLuvM = mat3( 0.2209, 0.3390, 0.4184, 0.1138, 0.6780, 0.7319, 0.0102, 0.1130, 0.2969 );\nvec4 LinearToLogLuv( in vec4 value )  {\n\tvec3 Xp_Y_XYZp = cLogLuvM * value.rgb;\n\tXp_Y_XYZp = max( Xp_Y_XYZp, vec3( 1e-6, 1e-6, 1e-6 ) );\n\tvec4 vResult;\n\tvResult.xy = Xp_Y_XYZp.xy / Xp_Y_XYZp.z;\n\tfloat Le = 2.0 * log2(Xp_Y_XYZp.y) + 127.0;\n\tvResult.w = fract( Le );\n\tvResult.z = ( Le - ( floor( vResult.w * 255.0 ) ) / 255.0 ) / 255.0;\n\treturn vResult;\n}\nconst mat3 cLogLuvInverseM = mat3( 6.0014, -2.7008, -1.7996, -1.3320, 3.1029, -5.7721, 0.3008, -1.0882, 5.6268 );\nvec4 LogLuvToLinear( in vec4 value ) {\n\tfloat Le = value.z * 255.0 + value.w;\n\tvec3 Xp_Y_XYZp;\n\tXp_Y_XYZp.y = exp2( ( Le - 127.0 ) / 2.0 );\n\tXp_Y_XYZp.z = Xp_Y_XYZp.y / value.y;\n\tXp_Y_XYZp.x = value.x * Xp_Y_XYZp.z;\n\tvec3 vRGB = cLogLuvInverseM * Xp_Y_XYZp.rgb;\n\treturn vec4( max( vRGB, 0.0 ), 1.0 );\n}",envmap_fragment:"#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\t\tvec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );\n\t\tvec3 worldNormal = inverseTransformDirection( normal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvec3 reflectVec = reflect( cameraToVertex, worldNormal );\n\t\t#else\n\t\t\tvec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );\n\t\t#endif\n\t#else\n\t\tvec3 reflectVec = vReflect;\n\t#endif\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tvec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\n\t#elif defined( ENVMAP_TYPE_EQUIREC )\n\t\tvec2 sampleUV;\n\t\treflectVec = normalize( reflectVec );\n\t\tsampleUV.y = asin( clamp( reflectVec.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n\t\tsampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;\n\t\tvec4 envColor = texture2D( envMap, sampleUV );\n\t#elif defined( ENVMAP_TYPE_SPHERE )\n\t\treflectVec = normalize( reflectVec );\n\t\tvec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0, 0.0, 1.0 ) );\n\t\tvec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );\n\t#else\n\t\tvec4 envColor = vec4( 0.0 );\n\t#endif\n\tenvColor = envMapTexelToLinear( envColor );\n\t#ifdef ENVMAP_BLENDING_MULTIPLY\n\t\toutgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_MIX )\n\t\toutgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n\t#elif defined( ENVMAP_BLENDING_ADD )\n\t\toutgoingLight += envColor.xyz * specularStrength * reflectivity;\n\t#endif\n#endif",envmap_pars_fragment:"#if defined( USE_ENVMAP ) || defined( PHYSICAL )\n\tuniform float reflectivity;\n\tuniform float envMapIntensity;\n#endif\n#ifdef USE_ENVMAP\n\t#if ! defined( PHYSICAL ) && ( defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) )\n\t\tvarying vec3 vWorldPosition;\n\t#endif\n\t#ifdef ENVMAP_TYPE_CUBE\n\t\tuniform samplerCube envMap;\n\t#else\n\t\tuniform sampler2D envMap;\n\t#endif\n\tuniform float flipEnvMap;\n\tuniform int maxMipLevel;\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( PHYSICAL )\n\t\tuniform float refractionRatio;\n\t#else\n\t\tvarying vec3 vReflect;\n\t#endif\n#endif",envmap_pars_vertex:"#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\t\tvarying vec3 vWorldPosition;\n\t#else\n\t\tvarying vec3 vReflect;\n\t\tuniform float refractionRatio;\n\t#endif\n#endif",envmap_physical_pars_fragment:"#if defined( USE_ENVMAP ) && defined( PHYSICAL )\n\tvec3 getLightProbeIndirectIrradiance( const in GeometricContext geometry, const in int maxMIPLevel ) {\n\t\tvec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );\n\t\t#ifdef ENVMAP_TYPE_CUBE\n\t\t\tvec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#elif defined( ENVMAP_TYPE_CUBE_UV )\n\t\t\tvec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, queryVec, 1.0 );\n\t\t#else\n\t\t\tvec4 envMapColor = vec4( 0.0 );\n\t\t#endif\n\t\treturn PI * envMapColor.rgb * envMapIntensity;\n\t}\n\tfloat getSpecularMIPLevel( const in float blinnShininessExponent, const in int maxMIPLevel ) {\n\t\tfloat maxMIPLevelScalar = float( maxMIPLevel );\n\t\tfloat desiredMIPLevel = maxMIPLevelScalar + 0.79248 - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );\n\t\treturn clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );\n\t}\n\tvec3 getLightProbeIndirectRadiance( const in GeometricContext geometry, const in float blinnShininessExponent, const in int maxMIPLevel ) {\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );\n\t\t#else\n\t\t\tvec3 reflectVec = refract( -geometry.viewDir, geometry.normal, refractionRatio );\n\t\t#endif\n\t\treflectVec = inverseTransformDirection( reflectVec, viewMatrix );\n\t\tfloat specularMIPLevel = getSpecularMIPLevel( blinnShininessExponent, maxMIPLevel );\n\t\t#ifdef ENVMAP_TYPE_CUBE\n\t\t\tvec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#elif defined( ENVMAP_TYPE_CUBE_UV )\n\t\t\tvec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, queryReflectVec, BlinnExponentToGGXRoughness(blinnShininessExponent ));\n\t\t#elif defined( ENVMAP_TYPE_EQUIREC )\n\t\t\tvec2 sampleUV;\n\t\t\tsampleUV.y = asin( clamp( reflectVec.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n\t\t\tsampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = texture2DLodEXT( envMap, sampleUV, specularMIPLevel );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = texture2D( envMap, sampleUV, specularMIPLevel );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#elif defined( ENVMAP_TYPE_SPHERE )\n\t\t\tvec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0,0.0,1.0 ) );\n\t\t\t#ifdef TEXTURE_LOD_EXT\n\t\t\t\tvec4 envMapColor = texture2DLodEXT( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );\n\t\t\t#else\n\t\t\t\tvec4 envMapColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );\n\t\t\t#endif\n\t\t\tenvMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;\n\t\t#endif\n\t\treturn envMapColor.rgb * envMapIntensity;\n\t}\n#endif",envmap_vertex:"#ifdef USE_ENVMAP\n\t#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\t\tvWorldPosition = worldPosition.xyz;\n\t#else\n\t\tvec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n\t\tvec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );\n\t\t#ifdef ENVMAP_MODE_REFLECTION\n\t\t\tvReflect = reflect( cameraToVertex, worldNormal );\n\t\t#else\n\t\t\tvReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n\t\t#endif\n\t#endif\n#endif",fog_vertex:"#ifdef USE_FOG\n\tfogDepth = -mvPosition.z;\n#endif",fog_pars_vertex:"#ifdef USE_FOG\n\tvarying float fogDepth;\n#endif",fog_fragment:"#ifdef USE_FOG\n\t#ifdef FOG_EXP2\n\t\tfloat fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * fogDepth * fogDepth * LOG2 ) );\n\t#else\n\t\tfloat fogFactor = smoothstep( fogNear, fogFar, fogDepth );\n\t#endif\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif",fog_pars_fragment:"#ifdef USE_FOG\n\tuniform vec3 fogColor;\n\tvarying float fogDepth;\n\t#ifdef FOG_EXP2\n\t\tuniform float fogDensity;\n\t#else\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\t#endif\n#endif",gradientmap_pars_fragment:"#ifdef TOON\n\tuniform sampler2D gradientMap;\n\tvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n\t\tfloat dotNL = dot( normal, lightDirection );\n\t\tvec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\n\t\t#ifdef USE_GRADIENTMAP\n\t\t\treturn texture2D( gradientMap, coord ).rgb;\n\t\t#else\n\t\t\treturn ( coord.x < 0.7 ) ? vec3( 0.7 ) : vec3( 1.0 );\n\t\t#endif\n\t}\n#endif",lightmap_fragment:"#ifdef USE_LIGHTMAP\n\treflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n#endif",lightmap_pars_fragment:"#ifdef USE_LIGHTMAP\n\tuniform sampler2D lightMap;\n\tuniform float lightMapIntensity;\n#endif",lights_lambert_vertex:"vec3 diffuse = vec3( 1.0 );\nGeometricContext geometry;\ngeometry.position = mvPosition.xyz;\ngeometry.normal = normalize( transformedNormal );\ngeometry.viewDir = normalize( -mvPosition.xyz );\nGeometricContext backGeometry;\nbackGeometry.position = geometry.position;\nbackGeometry.normal = -geometry.normal;\nbackGeometry.viewDir = geometry.viewDir;\nvLightFront = vec3( 0.0 );\nvIndirectFront = vec3( 0.0 );\n#ifdef DOUBLE_SIDED\n\tvLightBack = vec3( 0.0 );\n\tvIndirectBack = vec3( 0.0 );\n#endif\nIncidentLight directLight;\nfloat dotNL;\nvec3 directLightColor_Diffuse;\n#if NUM_POINT_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tgetPointDirectLightIrradiance( pointLights[ i ], geometry, directLight );\n\t\tdotNL = dot( geometry.normal, directLight.direction );\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\n\t\t#endif\n\t}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tgetSpotDirectLightIrradiance( spotLights[ i ], geometry, directLight );\n\t\tdotNL = dot( geometry.normal, directLight.direction );\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\n\t\t#endif\n\t}\n#endif\n#if NUM_DIR_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tgetDirectionalDirectLightIrradiance( directionalLights[ i ], geometry, directLight );\n\t\tdotNL = dot( geometry.normal, directLight.direction );\n\t\tdirectLightColor_Diffuse = PI * directLight.color;\n\t\tvLightFront += saturate( dotNL ) * directLightColor_Diffuse;\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvLightBack += saturate( -dotNL ) * directLightColor_Diffuse;\n\t\t#endif\n\t}\n#endif\n#if NUM_HEMI_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\tvIndirectFront += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tvIndirectBack += getHemisphereLightIrradiance( hemisphereLights[ i ], backGeometry );\n\t\t#endif\n\t}\n#endif",lights_pars_begin:"uniform vec3 ambientLightColor;\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n\tvec3 irradiance = ambientLightColor;\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tirradiance *= PI;\n\t#endif\n\treturn irradiance;\n}\n#if NUM_DIR_LIGHTS > 0\n\tstruct DirectionalLight {\n\t\tvec3 direction;\n\t\tvec3 color;\n\t\tint shadow;\n\t\tfloat shadowBias;\n\t\tfloat shadowRadius;\n\t\tvec2 shadowMapSize;\n\t};\n\tuniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n\tvoid getDirectionalDirectLightIrradiance( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight directLight ) {\n\t\tdirectLight.color = directionalLight.color;\n\t\tdirectLight.direction = directionalLight.direction;\n\t\tdirectLight.visible = true;\n\t}\n#endif\n#if NUM_POINT_LIGHTS > 0\n\tstruct PointLight {\n\t\tvec3 position;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t\tint shadow;\n\t\tfloat shadowBias;\n\t\tfloat shadowRadius;\n\t\tvec2 shadowMapSize;\n\t\tfloat shadowCameraNear;\n\t\tfloat shadowCameraFar;\n\t};\n\tuniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n\tvoid getPointDirectLightIrradiance( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight directLight ) {\n\t\tvec3 lVector = pointLight.position - geometry.position;\n\t\tdirectLight.direction = normalize( lVector );\n\t\tfloat lightDistance = length( lVector );\n\t\tdirectLight.color = pointLight.color;\n\t\tdirectLight.color *= punctualLightIntensityToIrradianceFactor( lightDistance, pointLight.distance, pointLight.decay );\n\t\tdirectLight.visible = ( directLight.color != vec3( 0.0 ) );\n\t}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n\tstruct SpotLight {\n\t\tvec3 position;\n\t\tvec3 direction;\n\t\tvec3 color;\n\t\tfloat distance;\n\t\tfloat decay;\n\t\tfloat coneCos;\n\t\tfloat penumbraCos;\n\t\tint shadow;\n\t\tfloat shadowBias;\n\t\tfloat shadowRadius;\n\t\tvec2 shadowMapSize;\n\t};\n\tuniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n\tvoid getSpotDirectLightIrradiance( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight directLight  ) {\n\t\tvec3 lVector = spotLight.position - geometry.position;\n\t\tdirectLight.direction = normalize( lVector );\n\t\tfloat lightDistance = length( lVector );\n\t\tfloat angleCos = dot( directLight.direction, spotLight.direction );\n\t\tif ( angleCos > spotLight.coneCos ) {\n\t\t\tfloat spotEffect = smoothstep( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n\t\t\tdirectLight.color = spotLight.color;\n\t\t\tdirectLight.color *= spotEffect * punctualLightIntensityToIrradianceFactor( lightDistance, spotLight.distance, spotLight.decay );\n\t\t\tdirectLight.visible = true;\n\t\t} else {\n\t\t\tdirectLight.color = vec3( 0.0 );\n\t\t\tdirectLight.visible = false;\n\t\t}\n\t}\n#endif\n#if NUM_RECT_AREA_LIGHTS > 0\n\tstruct RectAreaLight {\n\t\tvec3 color;\n\t\tvec3 position;\n\t\tvec3 halfWidth;\n\t\tvec3 halfHeight;\n\t};\n\tuniform sampler2D ltc_1;\tuniform sampler2D ltc_2;\n\tuniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\n#endif\n#if NUM_HEMI_LIGHTS > 0\n\tstruct HemisphereLight {\n\t\tvec3 direction;\n\t\tvec3 skyColor;\n\t\tvec3 groundColor;\n\t};\n\tuniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n\tvec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in GeometricContext geometry ) {\n\t\tfloat dotNL = dot( geometry.normal, hemiLight.direction );\n\t\tfloat hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n\t\tvec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n\t\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\t\tirradiance *= PI;\n\t\t#endif\n\t\treturn irradiance;\n\t}\n#endif",lights_phong_fragment:"BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;",lights_phong_pars_fragment:"varying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\nstruct BlinnPhongMaterial {\n\tvec3\tdiffuseColor;\n\tvec3\tspecularColor;\n\tfloat\tspecularShininess;\n\tfloat\tspecularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\t#ifdef TOON\n\t\tvec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;\n\t#else\n\t\tfloat dotNL = saturate( dot( geometry.normal, directLight.direction ) );\n\t\tvec3 irradiance = dotNL * directLight.color;\n\t#endif\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tirradiance *= PI;\n\t#endif\n\treflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n\treflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n\treflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n}\n#define RE_Direct\t\t\t\tRE_Direct_BlinnPhong\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_BlinnPhong\n#define Material_LightProbeLOD( material )\t(0)",lights_physical_fragment:"PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nmaterial.specularRoughness = clamp( roughnessFactor, 0.04, 1.0 );\n#ifdef STANDARD\n\tmaterial.specularColor = mix( vec3( DEFAULT_SPECULAR_COEFFICIENT ), diffuseColor.rgb, metalnessFactor );\n#else\n\tmaterial.specularColor = mix( vec3( MAXIMUM_SPECULAR_COEFFICIENT * pow2( reflectivity ) ), diffuseColor.rgb, metalnessFactor );\n\tmaterial.clearCoat = saturate( clearCoat );\tmaterial.clearCoatRoughness = clamp( clearCoatRoughness, 0.04, 1.0 );\n#endif",lights_physical_pars_fragment:"struct PhysicalMaterial {\n\tvec3\tdiffuseColor;\n\tfloat\tspecularRoughness;\n\tvec3\tspecularColor;\n\t#ifndef STANDARD\n\t\tfloat clearCoat;\n\t\tfloat clearCoatRoughness;\n\t#endif\n};\n#define MAXIMUM_SPECULAR_COEFFICIENT 0.16\n#define DEFAULT_SPECULAR_COEFFICIENT 0.04\nfloat clearCoatDHRApprox( const in float roughness, const in float dotNL ) {\n\treturn DEFAULT_SPECULAR_COEFFICIENT + ( 1.0 - DEFAULT_SPECULAR_COEFFICIENT ) * ( pow( 1.0 - dotNL, 5.0 ) * pow( 1.0 - roughness, 2.0 ) );\n}\n#if NUM_RECT_AREA_LIGHTS > 0\n\tvoid RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\t\tvec3 normal = geometry.normal;\n\t\tvec3 viewDir = geometry.viewDir;\n\t\tvec3 position = geometry.position;\n\t\tvec3 lightPos = rectAreaLight.position;\n\t\tvec3 halfWidth = rectAreaLight.halfWidth;\n\t\tvec3 halfHeight = rectAreaLight.halfHeight;\n\t\tvec3 lightColor = rectAreaLight.color;\n\t\tfloat roughness = material.specularRoughness;\n\t\tvec3 rectCoords[ 4 ];\n\t\trectCoords[ 0 ] = lightPos + halfWidth - halfHeight;\t\trectCoords[ 1 ] = lightPos - halfWidth - halfHeight;\n\t\trectCoords[ 2 ] = lightPos - halfWidth + halfHeight;\n\t\trectCoords[ 3 ] = lightPos + halfWidth + halfHeight;\n\t\tvec2 uv = LTC_Uv( normal, viewDir, roughness );\n\t\tvec4 t1 = texture2D( ltc_1, uv );\n\t\tvec4 t2 = texture2D( ltc_2, uv );\n\t\tmat3 mInv = mat3(\n\t\t\tvec3( t1.x, 0, t1.y ),\n\t\t\tvec3(    0, 1,    0 ),\n\t\t\tvec3( t1.z, 0, t1.w )\n\t\t);\n\t\tvec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );\n\t\treflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );\n\t\treflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );\n\t}\n#endif\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\tfloat dotNL = saturate( dot( geometry.normal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tirradiance *= PI;\n\t#endif\n\t#ifndef STANDARD\n\t\tfloat clearCoatDHR = material.clearCoat * clearCoatDHRApprox( material.clearCoatRoughness, dotNL );\n\t#else\n\t\tfloat clearCoatDHR = 0.0;\n\t#endif\n\treflectedLight.directSpecular += ( 1.0 - clearCoatDHR ) * irradiance * BRDF_Specular_GGX( directLight, geometry, material.specularColor, material.specularRoughness );\n\treflectedLight.directDiffuse += ( 1.0 - clearCoatDHR ) * irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n\t#ifndef STANDARD\n\t\treflectedLight.directSpecular += irradiance * material.clearCoat * BRDF_Specular_GGX( directLight, geometry, vec3( DEFAULT_SPECULAR_COEFFICIENT ), material.clearCoatRoughness );\n\t#endif\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n\t#ifndef ENVMAP_TYPE_CUBE_UV\n\t\treflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );\n\t#endif\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearCoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {\n\t#ifndef STANDARD\n\t\tfloat dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );\n\t\tfloat dotNL = dotNV;\n\t\tfloat clearCoatDHR = material.clearCoat * clearCoatDHRApprox( material.clearCoatRoughness, dotNL );\n\t#else\n\t\tfloat clearCoatDHR = 0.0;\n\t#endif\n\tfloat clearCoatInv = 1.0 - clearCoatDHR;\n\t#if defined( ENVMAP_TYPE_CUBE_UV )\n\t\tvec3 singleScattering = vec3( 0.0 );\n\t\tvec3 multiScattering = vec3( 0.0 );\n\t\tvec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;\n\t\tBRDF_Specular_Multiscattering_Environment( geometry, material.specularColor, material.specularRoughness, singleScattering, multiScattering );\n\t\tvec3 diffuse = material.diffuseColor;\n\t\treflectedLight.indirectSpecular += clearCoatInv * radiance * singleScattering;\n\t\treflectedLight.indirectDiffuse += multiScattering * cosineWeightedIrradiance;\n\t\treflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;\n\t#else\n\t\treflectedLight.indirectSpecular += clearCoatInv * radiance * BRDF_Specular_GGX_Environment( geometry, material.specularColor, material.specularRoughness );\n\t#endif\n\t#ifndef STANDARD\n\t\treflectedLight.indirectSpecular += clearCoatRadiance * material.clearCoat * BRDF_Specular_GGX_Environment( geometry, vec3( DEFAULT_SPECULAR_COEFFICIENT ), material.clearCoatRoughness );\n\t#endif\n}\n#define RE_Direct\t\t\t\tRE_Direct_Physical\n#define RE_Direct_RectArea\t\tRE_Direct_RectArea_Physical\n#define RE_IndirectDiffuse\t\tRE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular\t\tRE_IndirectSpecular_Physical\n#define Material_BlinnShininessExponent( material )   GGXRoughnessToBlinnExponent( material.specularRoughness )\n#define Material_ClearCoat_BlinnShininessExponent( material )   GGXRoughnessToBlinnExponent( material.clearCoatRoughness )\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n\treturn saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}",lights_fragment_begin:"\nGeometricContext geometry;\ngeometry.position = - vViewPosition;\ngeometry.normal = normal;\ngeometry.viewDir = normalize( vViewPosition );\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\tPointLight pointLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tgetPointDirectLightIrradiance( pointLight, geometry, directLight );\n\t\t#ifdef USE_SHADOWMAP\n\t\tdirectLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\tSpotLight spotLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tgetSpotDirectLightIrradiance( spotLight, geometry, directLight );\n\t\t#ifdef USE_SHADOWMAP\n\t\tdirectLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\tDirectionalLight directionalLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tgetDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );\n\t\t#ifdef USE_SHADOWMAP\n\t\tdirectLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\t#endif\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n\tRectAreaLight rectAreaLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n\t\trectAreaLight = rectAreaLights[ i ];\n\t\tRE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );\n\t}\n#endif\n#if defined( RE_IndirectDiffuse )\n\tvec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\t#if ( NUM_HEMI_LIGHTS > 0 )\n\t\t#pragma unroll_loop\n\t\tfor ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\t\t\tirradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\n\t\t}\n\t#endif\n#endif\n#if defined( RE_IndirectSpecular )\n\tvec3 radiance = vec3( 0.0 );\n\tvec3 clearCoatRadiance = vec3( 0.0 );\n#endif",lights_fragment_maps:"#if defined( RE_IndirectDiffuse )\n\t#ifdef USE_LIGHTMAP\n\t\tvec3 lightMapIrradiance = texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n\t\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\t\tlightMapIrradiance *= PI;\n\t\t#endif\n\t\tirradiance += lightMapIrradiance;\n\t#endif\n\t#if defined( USE_ENVMAP ) && defined( PHYSICAL ) && defined( ENVMAP_TYPE_CUBE_UV )\n\t\tirradiance += getLightProbeIndirectIrradiance( geometry, maxMipLevel );\n\t#endif\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n\tradiance += getLightProbeIndirectRadiance( geometry, Material_BlinnShininessExponent( material ), maxMipLevel );\n\t#ifndef STANDARD\n\t\tclearCoatRadiance += getLightProbeIndirectRadiance( geometry, Material_ClearCoat_BlinnShininessExponent( material ), maxMipLevel );\n\t#endif\n#endif",lights_fragment_end:"#if defined( RE_IndirectDiffuse )\n\tRE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );\n#endif\n#if defined( RE_IndirectSpecular )\n\tRE_IndirectSpecular( radiance, irradiance, clearCoatRadiance, geometry, material, reflectedLight );\n#endif",logdepthbuf_fragment:"#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )\n\tgl_FragDepthEXT = log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif",logdepthbuf_pars_fragment:"#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )\n\tuniform float logDepthBufFC;\n\tvarying float vFragDepth;\n#endif",logdepthbuf_pars_vertex:"#ifdef USE_LOGDEPTHBUF\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\t\tvarying float vFragDepth;\n\t#else\n\t\tuniform float logDepthBufFC;\n\t#endif\n#endif",logdepthbuf_vertex:"#ifdef USE_LOGDEPTHBUF\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\t\tvFragDepth = 1.0 + gl_Position.w;\n\t#else\n\t\tgl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;\n\t\tgl_Position.z *= gl_Position.w;\n\t#endif\n#endif",map_fragment:"#ifdef USE_MAP\n\tvec4 texelColor = texture2D( map, vUv );\n\ttexelColor = mapTexelToLinear( texelColor );\n\tdiffuseColor *= texelColor;\n#endif",map_pars_fragment:"#ifdef USE_MAP\n\tuniform sampler2D map;\n#endif",map_particle_fragment:"#ifdef USE_MAP\n\tvec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;\n\tvec4 mapTexel = texture2D( map, uv );\n\tdiffuseColor *= mapTexelToLinear( mapTexel );\n#endif",map_particle_pars_fragment:"#ifdef USE_MAP\n\tuniform mat3 uvTransform;\n\tuniform sampler2D map;\n#endif",metalnessmap_fragment:"float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n\tvec4 texelMetalness = texture2D( metalnessMap, vUv );\n\tmetalnessFactor *= texelMetalness.b;\n#endif",metalnessmap_pars_fragment:"#ifdef USE_METALNESSMAP\n\tuniform sampler2D metalnessMap;\n#endif",morphnormal_vertex:"#ifdef USE_MORPHNORMALS\n\tobjectNormal += ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];\n\tobjectNormal += ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];\n\tobjectNormal += ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];\n\tobjectNormal += ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];\n#endif",morphtarget_pars_vertex:"#ifdef USE_MORPHTARGETS\n\t#ifndef USE_MORPHNORMALS\n\tuniform float morphTargetInfluences[ 8 ];\n\t#else\n\tuniform float morphTargetInfluences[ 4 ];\n\t#endif\n#endif",morphtarget_vertex:"#ifdef USE_MORPHTARGETS\n\ttransformed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];\n\ttransformed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];\n\ttransformed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];\n\ttransformed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];\n\t#ifndef USE_MORPHNORMALS\n\ttransformed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];\n\ttransformed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];\n\ttransformed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];\n\ttransformed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];\n\t#endif\n#endif",normal_fragment_begin:"#ifdef FLAT_SHADED\n\tvec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );\n\tvec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );\n\tvec3 normal = normalize( cross( fdx, fdy ) );\n#else\n\tvec3 normal = normalize( vNormal );\n\t#ifdef DOUBLE_SIDED\n\t\tnormal = normal * ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t#endif\n#endif",normal_fragment_maps:"#ifdef USE_NORMALMAP\n\t#ifdef OBJECTSPACE_NORMALMAP\n\t\tnormal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;\n\t\t#ifdef FLIP_SIDED\n\t\t\tnormal = - normal;\n\t\t#endif\n\t\t#ifdef DOUBLE_SIDED\n\t\t\tnormal = normal * ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t\t#endif\n\t\tnormal = normalize( normalMatrix * normal );\n\t#else\n\t\tnormal = perturbNormal2Arb( -vViewPosition, normal );\n\t#endif\n#elif defined( USE_BUMPMAP )\n\tnormal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );\n#endif",normalmap_pars_fragment:"#ifdef USE_NORMALMAP\n\tuniform sampler2D normalMap;\n\tuniform vec2 normalScale;\n\t#ifdef OBJECTSPACE_NORMALMAP\n\t\tuniform mat3 normalMatrix;\n\t#else\n\t\tvec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {\n\t\t\tvec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\n\t\t\tvec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\n\t\t\tvec2 st0 = dFdx( vUv.st );\n\t\t\tvec2 st1 = dFdy( vUv.st );\n\t\t\tfloat scale = sign( st1.t * st0.s - st0.t * st1.s );\n\t\t\tvec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );\n\t\t\tvec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );\n\t\t\tvec3 N = normalize( surf_norm );\n\t\t\tmat3 tsn = mat3( S, T, N );\n\t\t\tvec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;\n\t\t\tmapN.xy *= normalScale;\n\t\t\tmapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\t\t\treturn normalize( tsn * mapN );\n\t\t}\n\t#endif\n#endif",packing:"vec3 packNormalToRGB( const in vec3 normal ) {\n\treturn normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n\treturn 2.0 * rgb.xyz - 1.0;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;\nconst vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );\nconst vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );\nconst float ShiftRight8 = 1. / 256.;\nvec4 packDepthToRGBA( const in float v ) {\n\tvec4 r = vec4( fract( v * PackFactors ), v );\n\tr.yzw -= r.xyz * ShiftRight8;\treturn r * PackUpscale;\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n\treturn dot( v, UnpackFactors );\n}\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\n\treturn ( viewZ + near ) / ( near - far );\n}\nfloat orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {\n\treturn linearClipZ * ( near - far ) - near;\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n\treturn (( near + viewZ ) * far ) / (( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {\n\treturn ( near * far ) / ( ( far - near ) * invClipZ - far );\n}",premultiplied_alpha_fragment:"#ifdef PREMULTIPLIED_ALPHA\n\tgl_FragColor.rgb *= gl_FragColor.a;\n#endif",project_vertex:"vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\ngl_Position = projectionMatrix * mvPosition;",dithering_fragment:"#if defined( DITHERING )\n  gl_FragColor.rgb = dithering( gl_FragColor.rgb );\n#endif",dithering_pars_fragment:"#if defined( DITHERING )\n\tvec3 dithering( vec3 color ) {\n\t\tfloat grid_position = rand( gl_FragCoord.xy );\n\t\tvec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\n\t\tdither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\n\t\treturn color + dither_shift_RGB;\n\t}\n#endif",roughnessmap_fragment:"float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n\tvec4 texelRoughness = texture2D( roughnessMap, vUv );\n\troughnessFactor *= texelRoughness.g;\n#endif",roughnessmap_pars_fragment:"#ifdef USE_ROUGHNESSMAP\n\tuniform sampler2D roughnessMap;\n#endif",shadowmap_pars_fragment:"#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\t\tuniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\t\tuniform sampler2D spotShadowMap[ NUM_SPOT_LIGHTS ];\n\t\tvarying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\t\tuniform sampler2D pointShadowMap[ NUM_POINT_LIGHTS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];\n\t#endif\n\tfloat texture2DCompare( sampler2D depths, vec2 uv, float compare ) {\n\t\treturn step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );\n\t}\n\tfloat texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {\n\t\tconst vec2 offset = vec2( 0.0, 1.0 );\n\t\tvec2 texelSize = vec2( 1.0 ) / size;\n\t\tvec2 centroidUV = floor( uv * size + 0.5 ) / size;\n\t\tfloat lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );\n\t\tfloat lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );\n\t\tfloat rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );\n\t\tfloat rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );\n\t\tvec2 f = fract( uv * size + 0.5 );\n\t\tfloat a = mix( lb, lt, f.y );\n\t\tfloat b = mix( rb, rt, f.y );\n\t\tfloat c = mix( a, b, f.x );\n\t\treturn c;\n\t}\n\tfloat getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n\t\tfloat shadow = 1.0;\n\t\tshadowCoord.xyz /= shadowCoord.w;\n\t\tshadowCoord.z += shadowBias;\n\t\tbvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );\n\t\tbool inFrustum = all( inFrustumVec );\n\t\tbvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );\n\t\tbool frustumTest = all( frustumTestVec );\n\t\tif ( frustumTest ) {\n\t\t#if defined( SHADOWMAP_TYPE_PCF )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\n\t\t\tshadow = (\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#elif defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tvec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n\t\t\tfloat dx0 = - texelSize.x * shadowRadius;\n\t\t\tfloat dy0 = - texelSize.y * shadowRadius;\n\t\t\tfloat dx1 = + texelSize.x * shadowRadius;\n\t\t\tfloat dy1 = + texelSize.y * shadowRadius;\n\t\t\tshadow = (\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +\n\t\t\t\ttexture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#else\n\t\t\tshadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );\n\t\t#endif\n\t\t}\n\t\treturn shadow;\n\t}\n\tvec2 cubeToUV( vec3 v, float texelSizeY ) {\n\t\tvec3 absV = abs( v );\n\t\tfloat scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );\n\t\tabsV *= scaleToCube;\n\t\tv *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );\n\t\tvec2 planar = v.xy;\n\t\tfloat almostATexel = 1.5 * texelSizeY;\n\t\tfloat almostOne = 1.0 - almostATexel;\n\t\tif ( absV.z >= almostOne ) {\n\t\t\tif ( v.z > 0.0 )\n\t\t\t\tplanar.x = 4.0 - v.x;\n\t\t} else if ( absV.x >= almostOne ) {\n\t\t\tfloat signX = sign( v.x );\n\t\t\tplanar.x = v.z * signX + 2.0 * signX;\n\t\t} else if ( absV.y >= almostOne ) {\n\t\t\tfloat signY = sign( v.y );\n\t\t\tplanar.x = v.x + 2.0 * signY + 2.0;\n\t\t\tplanar.y = v.z * signY - 2.0;\n\t\t}\n\t\treturn vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );\n\t}\n\tfloat getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n\t\tvec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );\n\t\tvec3 lightToPosition = shadowCoord.xyz;\n\t\tfloat dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );\t\tdp += shadowBias;\n\t\tvec3 bd3D = normalize( lightToPosition );\n\t\t#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT )\n\t\t\tvec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;\n\t\t\treturn (\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +\n\t\t\t\ttexture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )\n\t\t\t) * ( 1.0 / 9.0 );\n\t\t#else\n\t\t\treturn texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );\n\t\t#endif\n\t}\n#endif",shadowmap_pars_vertex:"#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\t\tuniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];\n\t\tvarying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\t\tuniform mat4 spotShadowMatrix[ NUM_SPOT_LIGHTS ];\n\t\tvarying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\t\tuniform mat4 pointShadowMatrix[ NUM_POINT_LIGHTS ];\n\t\tvarying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];\n\t#endif\n#endif",shadowmap_vertex:"#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tvDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * worldPosition;\n\t}\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tvSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * worldPosition;\n\t}\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tvPointShadowCoord[ i ] = pointShadowMatrix[ i ] * worldPosition;\n\t}\n\t#endif\n#endif",shadowmask_pars_fragment:"float getShadowMask() {\n\tfloat shadow = 1.0;\n\t#ifdef USE_SHADOWMAP\n\t#if NUM_DIR_LIGHTS > 0\n\tDirectionalLight directionalLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\t\tdirectionalLight = directionalLights[ i ];\n\t\tshadow *= bool( directionalLight.shadow ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n\t}\n\t#endif\n\t#if NUM_SPOT_LIGHTS > 0\n\tSpotLight spotLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\t\tspotLight = spotLights[ i ];\n\t\tshadow *= bool( spotLight.shadow ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n\t}\n\t#endif\n\t#if NUM_POINT_LIGHTS > 0\n\tPointLight pointLight;\n\t#pragma unroll_loop\n\tfor ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\t\tpointLight = pointLights[ i ];\n\t\tshadow *= bool( pointLight.shadow ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n\t}\n\t#endif\n\t#endif\n\treturn shadow;\n}",skinbase_vertex:"#ifdef USE_SKINNING\n\tmat4 boneMatX = getBoneMatrix( skinIndex.x );\n\tmat4 boneMatY = getBoneMatrix( skinIndex.y );\n\tmat4 boneMatZ = getBoneMatrix( skinIndex.z );\n\tmat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif",skinning_pars_vertex:"#ifdef USE_SKINNING\n\tuniform mat4 bindMatrix;\n\tuniform mat4 bindMatrixInverse;\n\t#ifdef BONE_TEXTURE\n\t\tuniform sampler2D boneTexture;\n\t\tuniform int boneTextureSize;\n\t\tmat4 getBoneMatrix( const in float i ) {\n\t\t\tfloat j = i * 4.0;\n\t\t\tfloat x = mod( j, float( boneTextureSize ) );\n\t\t\tfloat y = floor( j / float( boneTextureSize ) );\n\t\t\tfloat dx = 1.0 / float( boneTextureSize );\n\t\t\tfloat dy = 1.0 / float( boneTextureSize );\n\t\t\ty = dy * ( y + 0.5 );\n\t\t\tvec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );\n\t\t\tvec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );\n\t\t\tvec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );\n\t\t\tvec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );\n\t\t\tmat4 bone = mat4( v1, v2, v3, v4 );\n\t\t\treturn bone;\n\t\t}\n\t#else\n\t\tuniform mat4 boneMatrices[ MAX_BONES ];\n\t\tmat4 getBoneMatrix( const in float i ) {\n\t\t\tmat4 bone = boneMatrices[ int(i) ];\n\t\t\treturn bone;\n\t\t}\n\t#endif\n#endif",skinning_vertex:"#ifdef USE_SKINNING\n\tvec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n\tvec4 skinned = vec4( 0.0 );\n\tskinned += boneMatX * skinVertex * skinWeight.x;\n\tskinned += boneMatY * skinVertex * skinWeight.y;\n\tskinned += boneMatZ * skinVertex * skinWeight.z;\n\tskinned += boneMatW * skinVertex * skinWeight.w;\n\ttransformed = ( bindMatrixInverse * skinned ).xyz;\n#endif",skinnormal_vertex:"#ifdef USE_SKINNING\n\tmat4 skinMatrix = mat4( 0.0 );\n\tskinMatrix += skinWeight.x * boneMatX;\n\tskinMatrix += skinWeight.y * boneMatY;\n\tskinMatrix += skinWeight.z * boneMatZ;\n\tskinMatrix += skinWeight.w * boneMatW;\n\tskinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;\n\tobjectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n#endif",specularmap_fragment:"float specularStrength;\n#ifdef USE_SPECULARMAP\n\tvec4 texelSpecular = texture2D( specularMap, vUv );\n\tspecularStrength = texelSpecular.r;\n#else\n\tspecularStrength = 1.0;\n#endif",specularmap_pars_fragment:"#ifdef USE_SPECULARMAP\n\tuniform sampler2D specularMap;\n#endif",tonemapping_fragment:"#if defined( TONE_MAPPING )\n  gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif",tonemapping_pars_fragment:"#ifndef saturate\n\t#define saturate(a) clamp( a, 0.0, 1.0 )\n#endif\nuniform float toneMappingExposure;\nuniform float toneMappingWhitePoint;\nvec3 LinearToneMapping( vec3 color ) {\n\treturn toneMappingExposure * color;\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\treturn saturate( color / ( vec3( 1.0 ) + color ) );\n}\n#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )\nvec3 Uncharted2ToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\treturn saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );\n}\nvec3 OptimizedCineonToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\tcolor = max( vec3( 0.0 ), color - 0.004 );\n\treturn pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\nvec3 ACESFilmicToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\treturn saturate( ( color * ( 2.51 * color + 0.03 ) ) / ( color * ( 2.43 * color + 0.59 ) + 0.14 ) );\n}",uv_pars_fragment:"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\tvarying vec2 vUv;\n#endif",uv_pars_vertex:"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\tvarying vec2 vUv;\n\tuniform mat3 uvTransform;\n#endif",uv_vertex:"#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\tvUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n#endif",uv2_pars_fragment:"#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n\tvarying vec2 vUv2;\n#endif",uv2_pars_vertex:"#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n\tattribute vec2 uv2;\n\tvarying vec2 vUv2;\n#endif",uv2_vertex:"#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n\tvUv2 = uv2;\n#endif",worldpos_vertex:"#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )\n\tvec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );\n#endif",background_frag:"uniform sampler2D t2D;\nvarying vec2 vUv;\nvoid main() {\n\tvec4 texColor = texture2D( t2D, vUv );\n\tgl_FragColor = mapTexelToLinear( texColor );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n}",background_vert:"varying vec2 vUv;\nuniform mat3 uvTransform;\nvoid main() {\n\tvUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n\tgl_Position = vec4( position.xy, 1.0, 1.0 );\n}",cube_frag:"uniform samplerCube tCube;\nuniform float tFlip;\nuniform float opacity;\nvarying vec3 vWorldDirection;\nvoid main() {\n\tvec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );\n\tgl_FragColor = mapTexelToLinear( texColor );\n\tgl_FragColor.a *= opacity;\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n}",cube_vert:"varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\tgl_Position.z = gl_Position.w;\n}",depth_frag:"#if DEPTH_PACKING == 3200\n\tuniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#if DEPTH_PACKING == 3200\n\t\tdiffuseColor.a = opacity;\n\t#endif\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <logdepthbuf_fragment>\n\t#if DEPTH_PACKING == 3200\n\t\tgl_FragColor = vec4( vec3( 1.0 - gl_FragCoord.z ), opacity );\n\t#elif DEPTH_PACKING == 3201\n\t\tgl_FragColor = packDepthToRGBA( gl_FragCoord.z );\n\t#endif\n}",depth_vert:"#include <common>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <skinbase_vertex>\n\t#ifdef USE_DISPLACEMENTMAP\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n}",distanceRGBA_frag:"#define DISTANCE\nuniform vec3 referencePosition;\nuniform float nearDistance;\nuniform float farDistance;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main () {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( 1.0 );\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\tfloat dist = length( vWorldPosition - referencePosition );\n\tdist = ( dist - nearDistance ) / ( farDistance - nearDistance );\n\tdist = saturate( dist );\n\tgl_FragColor = packDepthToRGBA( dist );\n}",distanceRGBA_vert:"#define DISTANCE\nvarying vec3 vWorldPosition;\n#include <common>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <skinbase_vertex>\n\t#ifdef USE_DISPLACEMENTMAP\n\t\t#include <beginnormal_vertex>\n\t\t#include <morphnormal_vertex>\n\t\t#include <skinnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n\t#include <clipping_planes_vertex>\n\tvWorldPosition = worldPosition.xyz;\n}",equirect_frag:"uniform sampler2D tEquirect;\nvarying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvec3 direction = normalize( vWorldDirection );\n\tvec2 sampleUV;\n\tsampleUV.y = asin( clamp( direction.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n\tsampleUV.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;\n\tvec4 texColor = texture2D( tEquirect, sampleUV );\n\tgl_FragColor = mapTexelToLinear( texColor );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n}",equirect_vert:"varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n\tvWorldDirection = transformDirection( position, modelMatrix );\n\t#include <begin_vertex>\n\t#include <project_vertex>\n}",linedashed_frag:"uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tif ( mod( vLineDistance, totalSize ) > dashSize ) {\n\t\tdiscard;\n\t}\n\tvec3 outgoingLight = vec3( 0.0 );\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <color_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}",linedashed_vert:"uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <color_vertex>\n\tvLineDistance = scale * lineDistance;\n\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n\tgl_Position = projectionMatrix * mvPosition;\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n}",meshbasic_frag:"uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\t#ifdef USE_LIGHTMAP\n\t\treflectedLight.indirectDiffuse += texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n\t#else\n\t\treflectedLight.indirectDiffuse += vec3( 1.0 );\n\t#endif\n\t#include <aomap_fragment>\n\treflectedLight.indirectDiffuse *= diffuseColor.rgb;\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\n\t#include <envmap_fragment>\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}",meshbasic_vert:"#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <skinbase_vertex>\n\t#ifdef USE_ENVMAP\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <worldpos_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <envmap_vertex>\n\t#include <fog_vertex>\n}",meshlambert_frag:"uniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\nvarying vec3 vLightFront;\nvarying vec3 vIndirectFront;\n#ifdef DOUBLE_SIDED\n\tvarying vec3 vLightBack;\n\tvarying vec3 vIndirectBack;\n#endif\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <fog_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <emissivemap_fragment>\n\treflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n\t#ifdef DOUBLE_SIDED\n\t\treflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;\n\t#else\n\t\treflectedLight.indirectDiffuse += vIndirectFront;\n\t#endif\n\t#include <lightmap_fragment>\n\treflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n\t#ifdef DOUBLE_SIDED\n\t\treflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n\t#else\n\t\treflectedLight.directDiffuse = vLightFront;\n\t#endif\n\treflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n\t#include <envmap_fragment>\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}",meshlambert_vert:"#define LAMBERT\nvarying vec3 vLightFront;\nvarying vec3 vIndirectFront;\n#ifdef DOUBLE_SIDED\n\tvarying vec3 vLightBack;\n\tvarying vec3 vIndirectBack;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <envmap_pars_vertex>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <lights_lambert_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}",meshmatcap_frag:"#define MATCAP\nuniform vec3 diffuse;\nuniform float opacity;\nuniform sampler2D matcap;\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\tvec3 viewDir = normalize( vViewPosition );\n\tvec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );\n\tvec3 y = cross( viewDir, x );\n\tvec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;\n\t#ifdef USE_MATCAP\n\t\tvec4 matcapColor = texture2D( matcap, uv );\n\t\tmatcapColor = matcapTexelToLinear( matcapColor );\n\t#else\n\t\tvec4 matcapColor = vec4( 1.0 );\n\t#endif\n\tvec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}",meshmatcap_vert:"#define MATCAP\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\t#ifndef FLAT_SHADED\n\t\tvNormal = normalize( transformedNormal );\n\t#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n\tvViewPosition = - mvPosition.xyz;\n}",meshphong_frag:"#define PHONG\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_pars_fragment>\n#include <gradientmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_phong_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\t#include <envmap_fragment>\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}",meshphong_vert:"#define PHONG\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}",meshphysical_frag:"#define PHYSICAL\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifndef STANDARD\n\tuniform float clearCoat;\n\tuniform float clearCoatRoughness;\n#endif\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <bsdfs>\n#include <cube_uv_reflection_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <lights_physical_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <roughnessmap_fragment>\n\t#include <metalnessmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_physical_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}",meshphysical_vert:"#define PHYSICAL\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}",normal_frag:"#define NORMAL\nuniform float opacity;\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || ( defined( USE_NORMALMAP ) && ! defined( OBJECTSPACE_NORMALMAP ) )\n\tvarying vec3 vViewPosition;\n#endif\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <packing>\n#include <uv_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\nvoid main() {\n\t#include <logdepthbuf_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\tgl_FragColor = vec4( packNormalToRGB( normal ), opacity );\n}",normal_vert:"#define NORMAL\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || ( defined( USE_NORMALMAP ) && ! defined( OBJECTSPACE_NORMALMAP ) )\n\tvarying vec3 vViewPosition;\n#endif\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n#endif\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || ( defined( USE_NORMALMAP ) && ! defined( OBJECTSPACE_NORMALMAP ) )\n\tvViewPosition = - mvPosition.xyz;\n#endif\n}",points_frag:"uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec3 outgoingLight = vec3( 0.0 );\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_particle_fragment>\n\t#include <color_fragment>\n\t#include <alphatest_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}",points_vert:"uniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <color_vertex>\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <project_vertex>\n\tgl_PointSize = size;\n\t#ifdef USE_SIZEATTENUATION\n\t\tbool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );\n\t\tif ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );\n\t#endif\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <worldpos_vertex>\n\t#include <fog_vertex>\n}",shadow_frag:"uniform vec3 color;\nuniform float opacity;\n#include <common>\n#include <packing>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nvoid main() {\n\tgl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );\n\t#include <fog_fragment>\n}",shadow_vert:"#include <fog_pars_vertex>\n#include <shadowmap_pars_vertex>\nvoid main() {\n\t#include <begin_vertex>\n\t#include <project_vertex>\n\t#include <worldpos_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}",sprite_frag:"uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec3 outgoingLight = vec3( 0.0 );\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <alphatest_fragment>\n\toutgoingLight = diffuseColor.rgb;\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n}",sprite_vert:"uniform float rotation;\nuniform vec2 center;\n#include <common>\n#include <uv_pars_vertex>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n\t#include <uv_vertex>\n\tvec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );\n\tvec2 scale;\n\tscale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );\n\tscale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );\n\t#ifndef USE_SIZEATTENUATION\n\t\tbool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );\n\t\tif ( isPerspective ) scale *= - mvPosition.z;\n\t#endif\n\tvec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;\n\tvec2 rotatedPosition;\n\trotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\n\trotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\n\tmvPosition.xy += rotatedPosition;\n\tgl_Position = projectionMatrix * mvPosition;\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n}"};function wr(t){var e={};for(var r in t)for(var n in e[r]={},t[r]){var i=t[r][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture)?e[r][n]=i.clone():Array.isArray(i)?e[r][n]=i.slice():e[r][n]=i}return e}function _r(t){for(var e={},r=0;r<t.length;r++){var n=wr(t[r]);for(var i in n)e[i]=n[i]}return e}var Mr,Er,Sr,Tr={clone:wr,merge:_r},Ar={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};function Lr(t,e,r){return void 0===e&&void 0===r?this.set(t):this.setRGB(t,e,r)}Object.assign(Lr.prototype,{isColor:!0,r:1,g:1,b:1,set:function(t){return t&&t.isColor?this.copy(t):"number"==typeof t?this.setHex(t):"string"==typeof t&&this.setStyle(t),this},setScalar:function(t){return this.r=t,this.g=t,this.b=t,this},setHex:function(t){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(255&t)/255,this},setRGB:function(t,e,r){return this.r=t,this.g=e,this.b=r,this},setHSL:function(){function t(t,e,r){return r<0&&(r+=1),r>1&&(r-=1),r<1/6?t+6*(e-t)*r:r<.5?e:r<2/3?t+6*(e-t)*(2/3-r):t}return function(e,r,n){if(e=Qe.euclideanModulo(e,1),r=Qe.clamp(r,0,1),n=Qe.clamp(n,0,1),0===r)this.r=this.g=this.b=n;else{var i=n<=.5?n*(1+r):n+r-n*r,a=2*n-i;this.r=t(a,i,e+1/3),this.g=t(a,i,e),this.b=t(a,i,e-1/3)}return this}}(),setStyle:function(t){function e(e){void 0!==e&&parseFloat(e)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}var r;if(r=/^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec(t)){var n,i=r[1],a=r[2];switch(i){case"rgb":case"rgba":if(n=/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(a))return this.r=Math.min(255,parseInt(n[1],10))/255,this.g=Math.min(255,parseInt(n[2],10))/255,this.b=Math.min(255,parseInt(n[3],10))/255,e(n[5]),this;if(n=/^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(a))return this.r=Math.min(100,parseInt(n[1],10))/100,this.g=Math.min(100,parseInt(n[2],10))/100,this.b=Math.min(100,parseInt(n[3],10))/100,e(n[5]),this;break;case"hsl":case"hsla":if(n=/^([0-9]*\.?[0-9]+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(a)){var o=parseFloat(n[1])/360,s=parseInt(n[2],10)/100,c=parseInt(n[3],10)/100;return e(n[5]),this.setHSL(o,s,c)}}}else if(r=/^\#([A-Fa-f0-9]+)$/.exec(t)){var h,l=(h=r[1]).length;if(3===l)return this.r=parseInt(h.charAt(0)+h.charAt(0),16)/255,this.g=parseInt(h.charAt(1)+h.charAt(1),16)/255,this.b=parseInt(h.charAt(2)+h.charAt(2),16)/255,this;if(6===l)return this.r=parseInt(h.charAt(0)+h.charAt(1),16)/255,this.g=parseInt(h.charAt(2)+h.charAt(3),16)/255,this.b=parseInt(h.charAt(4)+h.charAt(5),16)/255,this}return t&&t.length>0&&(void 0!==(h=Ar[t])?this.setHex(h):console.warn("THREE.Color: Unknown color "+t)),this},clone:function(){return new this.constructor(this.r,this.g,this.b)},copy:function(t){return this.r=t.r,this.g=t.g,this.b=t.b,this},copyGammaToLinear:function(t,e){return void 0===e&&(e=2),this.r=Math.pow(t.r,e),this.g=Math.pow(t.g,e),this.b=Math.pow(t.b,e),this},copyLinearToGamma:function(t,e){void 0===e&&(e=2);var r=e>0?1/e:1;return this.r=Math.pow(t.r,r),this.g=Math.pow(t.g,r),this.b=Math.pow(t.b,r),this},convertGammaToLinear:function(t){return this.copyGammaToLinear(this,t),this},convertLinearToGamma:function(t){return this.copyLinearToGamma(this,t),this},copySRGBToLinear:function(){function t(t){return t<.04045?.0773993808*t:Math.pow(.9478672986*t+.0521327014,2.4)}return function(e){return this.r=t(e.r),this.g=t(e.g),this.b=t(e.b),this}}(),copyLinearToSRGB:function(){function t(t){return t<.0031308?12.92*t:1.055*Math.pow(t,.41666)-.055}return function(e){return this.r=t(e.r),this.g=t(e.g),this.b=t(e.b),this}}(),convertSRGBToLinear:function(){return this.copySRGBToLinear(this),this},convertLinearToSRGB:function(){return this.copyLinearToSRGB(this),this},getHex:function(){return 255*this.r<<16^255*this.g<<8^255*this.b<<0},getHexString:function(){return("000000"+this.getHex().toString(16)).slice(-6)},getHSL:function(t){void 0===t&&(console.warn("THREE.Color: .getHSL() target is now required"),t={h:0,s:0,l:0});var e,r,n=this.r,i=this.g,a=this.b,o=Math.max(n,i,a),s=Math.min(n,i,a),c=(s+o)/2;if(s===o)e=0,r=0;else{var h=o-s;switch(r=c<=.5?h/(o+s):h/(2-o-s),o){case n:e=(i-a)/h+(i<a?6:0);break;case i:e=(a-n)/h+2;break;case a:e=(n-i)/h+4}e/=6}return t.h=e,t.s=r,t.l=c,t},getStyle:function(){return"rgb("+(255*this.r|0)+","+(255*this.g|0)+","+(255*this.b|0)+")"},offsetHSL:(Sr={},function(t,e,r){return this.getHSL(Sr),Sr.h+=t,Sr.s+=e,Sr.l+=r,this.setHSL(Sr.h,Sr.s,Sr.l),this}),add:function(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this},addColors:function(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this},addScalar:function(t){return this.r+=t,this.g+=t,this.b+=t,this},sub:function(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this},multiply:function(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this},multiplyScalar:function(t){return this.r*=t,this.g*=t,this.b*=t,this},lerp:function(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this},lerpHSL:(Mr={h:0,s:0,l:0},Er={h:0,s:0,l:0},function(t,e){this.getHSL(Mr),t.getHSL(Er);var r=Qe.lerp(Mr.h,Er.h,e),n=Qe.lerp(Mr.s,Er.s,e),i=Qe.lerp(Mr.l,Er.l,e);return this.setHSL(r,n,i),this}),equals:function(t){return t.r===this.r&&t.g===this.g&&t.b===this.b},fromArray:function(t,e){return void 0===e&&(e=0),this.r=t[e],this.g=t[e+1],this.b=t[e+2],this},toArray:function(t,e){return void 0===t&&(t=[]),void 0===e&&(e=0),t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t},toJSON:function(){return this.getHex()}});var Rr,Cr={common:{diffuse:{value:new Lr(15658734)},opacity:{value:1},map:{value:null},uvTransform:{value:new rr},alphaMap:{value:null}},specularmap:{specularMap:{value:null}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},refractionRatio:{value:.98},maxMipLevel:{value:0}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1}},emissivemap:{emissiveMap:{value:null}},bumpmap:{bumpMap:{value:null},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalScale:{value:new Ke(1,1)}},displacementmap:{displacementMap:{value:null},displacementScale:{value:1},displacementBias:{value:0}},roughnessmap:{roughnessMap:{value:null}},metalnessmap:{metalnessMap:{value:null}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Lr(16777215)}},lights:{ambientLightColor:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{},shadow:{},shadowBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{},shadow:{},shadowBias:{},shadowRadius:{},shadowMapSize:{}}},spotShadowMap:{value:[]},spotShadowMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{},shadow:{},shadowBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}}},points:{diffuse:{value:new Lr(15658734)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},uvTransform:{value:new rr}},sprite:{diffuse:{value:new Lr(15658734)},opacity:{value:1},center:{value:new Ke(.5,.5)},rotation:{value:0},map:{value:null},uvTransform:{value:new rr}}},Pr={basic:{uniforms:_r([Cr.common,Cr.specularmap,Cr.envmap,Cr.aomap,Cr.lightmap,Cr.fog]),vertexShader:br.meshbasic_vert,fragmentShader:br.meshbasic_frag},lambert:{uniforms:_r([Cr.common,Cr.specularmap,Cr.envmap,Cr.aomap,Cr.lightmap,Cr.emissivemap,Cr.fog,Cr.lights,{emissive:{value:new Lr(0)}}]),vertexShader:br.meshlambert_vert,fragmentShader:br.meshlambert_frag},phong:{uniforms:_r([Cr.common,Cr.specularmap,Cr.envmap,Cr.aomap,Cr.lightmap,Cr.emissivemap,Cr.bumpmap,Cr.normalmap,Cr.displacementmap,Cr.gradientmap,Cr.fog,Cr.lights,{emissive:{value:new Lr(0)},specular:{value:new Lr(1118481)},shininess:{value:30}}]),vertexShader:br.meshphong_vert,fragmentShader:br.meshphong_frag},standard:{uniforms:_r([Cr.common,Cr.envmap,Cr.aomap,Cr.lightmap,Cr.emissivemap,Cr.bumpmap,Cr.normalmap,Cr.displacementmap,Cr.roughnessmap,Cr.metalnessmap,Cr.fog,Cr.lights,{emissive:{value:new Lr(0)},roughness:{value:.5},metalness:{value:.5},envMapIntensity:{value:1}}]),vertexShader:br.meshphysical_vert,fragmentShader:br.meshphysical_frag},matcap:{uniforms:_r([Cr.common,Cr.bumpmap,Cr.normalmap,Cr.displacementmap,Cr.fog,{matcap:{value:null}}]),vertexShader:br.meshmatcap_vert,fragmentShader:br.meshmatcap_frag},points:{uniforms:_r([Cr.points,Cr.fog]),vertexShader:br.points_vert,fragmentShader:br.points_frag},dashed:{uniforms:_r([Cr.common,Cr.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:br.linedashed_vert,fragmentShader:br.linedashed_frag},depth:{uniforms:_r([Cr.common,Cr.displacementmap]),vertexShader:br.depth_vert,fragmentShader:br.depth_frag},normal:{uniforms:_r([Cr.common,Cr.bumpmap,Cr.normalmap,Cr.displacementmap,{opacity:{value:1}}]),vertexShader:br.normal_vert,fragmentShader:br.normal_frag},sprite:{uniforms:_r([Cr.sprite,Cr.fog]),vertexShader:br.sprite_vert,fragmentShader:br.sprite_frag},background:{uniforms:{uvTransform:{value:new rr},t2D:{value:null}},vertexShader:br.background_vert,fragmentShader:br.background_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:br.cube_vert,fragmentShader:br.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:br.equirect_vert,fragmentShader:br.equirect_frag},distanceRGBA:{uniforms:_r([Cr.common,Cr.displacementmap,{referencePosition:{value:new er},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:br.distanceRGBA_vert,fragmentShader:br.distanceRGBA_frag},shadow:{uniforms:_r([Cr.lights,Cr.fog,{color:{value:new Lr(0)},opacity:{value:1}}]),vertexShader:br.shadow_vert,fragmentShader:br.shadow_frag}};function Or(){var t=null,e=!1,r=null;function n(i,a){!1!==e&&(r(i,a),t.requestAnimationFrame(n))}return{start:function(){!0!==e&&null!==r&&(t.requestAnimationFrame(n),e=!0)},stop:function(){e=!1},setAnimationLoop:function(t){r=t},setContext:function(e){t=e}}}function Ir(t){var e=new WeakMap;return{get:function(t){return t.isInterleavedBufferAttribute&&(t=t.data),e.get(t)},remove:function(r){r.isInterleavedBufferAttribute&&(r=r.data);var n=e.get(r);n&&(t.deleteBuffer(n.buffer),e.delete(r))},update:function(r,n){r.isInterleavedBufferAttribute&&(r=r.data);var i=e.get(r);void 0===i?e.set(r,function(e,r){var n=e.array,i=e.dynamic?35048:35044,a=t.createBuffer();t.bindBuffer(r,a),t.bufferData(r,n,i),e.onUploadCallback();var o=5126;return n instanceof Float32Array?o=5126:n instanceof Float64Array?console.warn("THREE.WebGLAttributes: Unsupported data buffer format: Float64Array."):n instanceof Uint16Array?o=5123:n instanceof Int16Array?o=5122:n instanceof Uint32Array?o=5125:n instanceof Int32Array?o=5124:n instanceof Int8Array?o=5120:n instanceof Uint8Array&&(o=5121),{buffer:a,type:o,bytesPerElement:n.BYTES_PER_ELEMENT,version:e.version}}(r,n)):i.version<r.version&&(function(e,r,n){var i=r.array,a=r.updateRange;t.bindBuffer(n,e),!1===r.dynamic?t.bufferData(n,i,35044):-1===a.count?t.bufferSubData(n,0,i):0===a.count?console.error("THREE.WebGLObjects.updateBuffer: dynamic THREE.BufferAttribute marked as needsUpdate but updateRange.count is 0, ensure you are using set methods or updating manually."):(t.bufferSubData(n,a.offset*i.BYTES_PER_ELEMENT,i.subarray(a.offset,a.offset+a.count)),a.count=-1)}(i.buffer,r,n),i.version=r.version)}}}function Dr(t,e,r,n,i,a){this.a=t,this.b=e,this.c=r,this.normal=n&&n.isVector3?n:new er,this.vertexNormals=Array.isArray(n)?n:[],this.color=i&&i.isColor?i:new Lr,this.vertexColors=Array.isArray(i)?i:[],this.materialIndex=void 0!==a?a:0}function Nr(t,e,r,n){this._x=t||0,this._y=e||0,this._z=r||0,this._order=n||Nr.DefaultOrder}function Br(){this.mask=1}Pr.physical={uniforms:_r([Pr.standard.uniforms,{clearCoat:{value:0},clearCoatRoughness:{value:0}}]),vertexShader:br.meshphysical_vert,fragmentShader:br.meshphysical_frag},Object.assign(Dr.prototype,{clone:function(){return(new this.constructor).copy(this)},copy:function(t){this.a=t.a,this.b=t.b,this.c=t.c,this.normal.copy(t.normal),this.color.copy(t.color),this.materialIndex=t.materialIndex;for(var e=0,r=t.vertexNormals.length;e<r;e++)this.vertexNormals[e]=t.vertexNormals[e].clone();for(e=0,r=t.vertexColors.length;e<r;e++)this.vertexColors[e]=t.vertexColors[e].clone();return this}}),Nr.RotationOrders=["XYZ","YZX","ZXY","XZY","YXZ","ZYX"],Nr.DefaultOrder="XYZ",Object.defineProperties(Nr.prototype,{x:{get:function(){return this._x},set:function(t){this._x=t,this.onChangeCallback()}},y:{get:function(){return this._y},set:function(t){this._y=t,this.onChangeCallback()}},z:{get:function(){return this._z},set:function(t){this._z=t,this.onChangeCallback()}},order:{get:function(){return this._order},set:function(t){this._order=t,this.onChangeCallback()}}}),Object.assign(Nr.prototype,{isEuler:!0,set:function(t,e,r,n){return this._x=t,this._y=e,this._z=r,this._order=n||this._order,this.onChangeCallback(),this},clone:function(){return new this.constructor(this._x,this._y,this._z,this._order)},copy:function(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this.onChangeCallback(),this},setFromRotationMatrix:function(t,e,r){var n=Qe.clamp,i=t.elements,a=i[0],o=i[4],s=i[8],c=i[1],h=i[5],l=i[9],u=i[2],p=i[6],d=i[10];return"XYZ"===(e=e||this._order)?(this._y=Math.asin(n(s,-1,1)),Math.abs(s)<.99999?(this._x=Math.atan2(-l,d),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(p,h),this._z=0)):"YXZ"===e?(this._x=Math.asin(-n(l,-1,1)),Math.abs(l)<.99999?(this._y=Math.atan2(s,d),this._z=Math.atan2(c,h)):(this._y=Math.atan2(-u,a),this._z=0)):"ZXY"===e?(this._x=Math.asin(n(p,-1,1)),Math.abs(p)<.99999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(c,a))):"ZYX"===e?(this._y=Math.asin(-n(u,-1,1)),Math.abs(u)<.99999?(this._x=Math.atan2(p,d),this._z=Math.atan2(c,a)):(this._x=0,this._z=Math.atan2(-o,h))):"YZX"===e?(this._z=Math.asin(n(c,-1,1)),Math.abs(c)<.99999?(this._x=Math.atan2(-l,h),this._y=Math.atan2(-u,a)):(this._x=0,this._y=Math.atan2(s,d))):"XZY"===e?(this._z=Math.asin(-n(o,-1,1)),Math.abs(o)<.99999?(this._x=Math.atan2(p,h),this._y=Math.atan2(s,a)):(this._x=Math.atan2(-l,d),this._y=0)):console.warn("THREE.Euler: .setFromRotationMatrix() given unsupported order: "+e),this._order=e,!1!==r&&this.onChangeCallback(),this},setFromQuaternion:function(){var t=new $e;return function(e,r,n){return t.makeRotationFromQuaternion(e),this.setFromRotationMatrix(t,r,n)}}(),setFromVector3:function(t,e){return this.set(t.x,t.y,t.z,e||this._order)},reorder:(Rr=new tr,function(t){return Rr.setFromEuler(this),this.setFromQuaternion(Rr,t)}),equals:function(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order},fromArray:function(t){return this._x=t[0],this._y=t[1],this._z=t[2],void 0!==t[3]&&(this._order=t[3]),this.onChangeCallback(),this},toArray:function(t,e){return void 0===t&&(t=[]),void 0===e&&(e=0),t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t},toVector3:function(t){return t?t.set(this._x,this._y,this._z):new er(this._x,this._y,this._z)},onChange:function(t){return this.onChangeCallback=t,this},onChangeCallback:function(){}}),Object.assign(Br.prototype,{set:function(t){this.mask=1<<t|0},enable:function(t){this.mask|=1<<t|0},toggle:function(t){this.mask^=1<<t|0},disable:function(t){this.mask&=~(1<<t|0)},test:function(t){return 0!=(this.mask&t.mask)}});var zr,Ur,Gr,Fr,Hr=0;function Vr(){Object.defineProperty(this,"id",{value:Hr++}),this.uuid=Qe.generateUUID(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Vr.DefaultUp.clone();var t=new er,e=new Nr,r=new tr,n=new er(1,1,1);e.onChange((function(){r.setFromEuler(e,!1)})),r.onChange((function(){e.setFromQuaternion(r,void 0,!1)})),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new $e},normalMatrix:{value:new rr}}),this.matrix=new $e,this.matrixWorld=new $e,this.matrixAutoUpdate=Vr.DefaultMatrixAutoUpdate,this.matrixWorldNeedsUpdate=!1,this.layers=new Br,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.userData={}}Vr.DefaultUp=new er(0,1,0),Vr.DefaultMatrixAutoUpdate=!0,Vr.prototype=Object.assign(Object.create(n.prototype),{constructor:Vr,isObject3D:!0,onBeforeRender:function(){},onAfterRender:function(){},applyMatrix:function(t){this.matrix.multiplyMatrices(t,this.matrix),this.matrix.decompose(this.position,this.quaternion,this.scale)},applyQuaternion:function(t){return this.quaternion.premultiply(t),this},setRotationFromAxisAngle:function(t,e){this.quaternion.setFromAxisAngle(t,e)},setRotationFromEuler:function(t){this.quaternion.setFromEuler(t,!0)},setRotationFromMatrix:function(t){this.quaternion.setFromRotationMatrix(t)},setRotationFromQuaternion:function(t){this.quaternion.copy(t)},rotateOnAxis:(Fr=new tr,function(t,e){return Fr.setFromAxisAngle(t,e),this.quaternion.multiply(Fr),this}),rotateOnWorldAxis:function(){var t=new tr;return function(e,r){return t.setFromAxisAngle(e,r),this.quaternion.premultiply(t),this}}(),rotateX:function(){var t=new er(1,0,0);return function(e){return this.rotateOnAxis(t,e)}}(),rotateY:function(){var t=new er(0,1,0);return function(e){return this.rotateOnAxis(t,e)}}(),rotateZ:function(){var t=new er(0,0,1);return function(e){return this.rotateOnAxis(t,e)}}(),translateOnAxis:function(){var t=new er;return function(e,r){return t.copy(e).applyQuaternion(this.quaternion),this.position.add(t.multiplyScalar(r)),this}}(),translateX:function(){var t=new er(1,0,0);return function(e){return this.translateOnAxis(t,e)}}(),translateY:function(){var t=new er(0,1,0);return function(e){return this.translateOnAxis(t,e)}}(),translateZ:function(){var t=new er(0,0,1);return function(e){return this.translateOnAxis(t,e)}}(),localToWorld:function(t){return t.applyMatrix4(this.matrixWorld)},worldToLocal:(Gr=new $e,function(t){return t.applyMatrix4(Gr.getInverse(this.matrixWorld))}),lookAt:function(){var t=new tr,e=new $e,r=new er,n=new er;return function(i,a,o){i.isVector3?r.copy(i):r.set(i,a,o);var s=this.parent;this.updateWorldMatrix(!0,!1),n.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?e.lookAt(n,r,this.up):e.lookAt(r,n,this.up),this.quaternion.setFromRotationMatrix(e),s&&(e.extractRotation(s.matrixWorld),t.setFromRotationMatrix(e),this.quaternion.premultiply(t.inverse()))}}(),add:function(t){if(arguments.length>1){for(var e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(null!==t.parent&&t.parent.remove(t),t.parent=this,t.dispatchEvent({type:"added"}),this.children.push(t)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)},remove:function(t){if(arguments.length>1){for(var e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}var r=this.children.indexOf(t);return-1!==r&&(t.parent=null,t.dispatchEvent({type:"removed"}),this.children.splice(r,1)),this},getObjectById:function(t){return this.getObjectByProperty("id",t)},getObjectByName:function(t){return this.getObjectByProperty("name",t)},getObjectByProperty:function(t,e){if(this[t]===e)return this;for(var r=0,n=this.children.length;r<n;r++){var i=this.children[r].getObjectByProperty(t,e);if(void 0!==i)return i}},getWorldPosition:function(t){return void 0===t&&(console.warn("THREE.Object3D: .getWorldPosition() target is now required"),t=new er),this.updateMatrixWorld(!0),t.setFromMatrixPosition(this.matrixWorld)},getWorldQuaternion:(zr=new er,Ur=new er,function(t){return void 0===t&&(console.warn("THREE.Object3D: .getWorldQuaternion() target is now required"),t=new tr),this.updateMatrixWorld(!0),this.matrixWorld.decompose(zr,t,Ur),t}),getWorldScale:function(){var t=new er,e=new tr;return function(r){return void 0===r&&(console.warn("THREE.Object3D: .getWorldScale() target is now required"),r=new er),this.updateMatrixWorld(!0),this.matrixWorld.decompose(t,e,r),r}}(),getWorldDirection:function(t){void 0===t&&(console.warn("THREE.Object3D: .getWorldDirection() target is now required"),t=new er),this.updateMatrixWorld(!0);var e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()},raycast:function(){},traverse:function(t){t(this);for(var e=this.children,r=0,n=e.length;r<n;r++)e[r].traverse(t)},traverseVisible:function(t){if(!1!==this.visible){t(this);for(var e=this.children,r=0,n=e.length;r<n;r++)e[r].traverseVisible(t)}},traverseAncestors:function(t){var e=this.parent;null!==e&&(t(e),e.traverseAncestors(t))},updateMatrix:function(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0},updateMatrixWorld:function(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(null===this.parent?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);for(var e=this.children,r=0,n=e.length;r<n;r++)e[r].updateMatrixWorld(t)},updateWorldMatrix:function(t,e){var r=this.parent;if(!0===t&&null!==r&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),null===this.parent?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),!0===e)for(var n=this.children,i=0,a=n.length;i<a;i++)n[i].updateWorldMatrix(!1,!0)},toJSON:function(t){var e=void 0===t||"string"==typeof t,r={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{}},r.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});var n={};function i(e,r){return void 0===e[r.uuid]&&(e[r.uuid]=r.toJSON(t)),r.uuid}if(n.uuid=this.uuid,n.type=this.type,""!==this.name&&(n.name=this.name),!0===this.castShadow&&(n.castShadow=!0),!0===this.receiveShadow&&(n.receiveShadow=!0),!1===this.visible&&(n.visible=!1),!1===this.frustumCulled&&(n.frustumCulled=!1),0!==this.renderOrder&&(n.renderOrder=this.renderOrder),"{}"!==JSON.stringify(this.userData)&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),!1===this.matrixAutoUpdate&&(n.matrixAutoUpdate=!1),this.isMesh&&this.drawMode!==Be&&(n.drawMode=this.drawMode),this.isMesh||this.isLine||this.isPoints){n.geometry=i(t.geometries,this.geometry);var a=this.geometry.parameters;if(void 0!==a&&void 0!==a.shapes){var o=a.shapes;if(Array.isArray(o))for(var s=0,c=o.length;s<c;s++){var h=o[s];i(t.shapes,h)}else i(t.shapes,o)}}if(void 0!==this.material)if(Array.isArray(this.material)){var l=[];for(s=0,c=this.material.length;s<c;s++)l.push(i(t.materials,this.material[s]));n.material=l}else n.material=i(t.materials,this.material);if(this.children.length>0)for(n.children=[],s=0;s<this.children.length;s++)n.children.push(this.children[s].toJSON(t).object);if(e){var u=m(t.geometries),p=m(t.materials),d=m(t.textures),f=m(t.images);o=m(t.shapes),u.length>0&&(r.geometries=u),p.length>0&&(r.materials=p),d.length>0&&(r.textures=d),f.length>0&&(r.images=f),o.length>0&&(r.shapes=o)}return r.object=n,r;function m(t){var e=[];for(var r in t){var n=t[r];delete n.metadata,e.push(n)}return e}},clone:function(t){return(new this.constructor).copy(this,t)},copy:function(t,e){if(void 0===e&&(e=!0),this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.userData=JSON.parse(JSON.stringify(t.userData)),!0===e)for(var r=0;r<t.children.length;r++){var n=t.children[r];this.add(n.clone())}return this}});var jr,kr,Wr=0;function qr(){Object.defineProperty(this,"id",{value:Wr+=2}),this.uuid=Qe.generateUUID(),this.name="",this.type="Geometry",this.vertices=[],this.colors=[],this.faces=[],this.faceVertexUvs=[[]],this.morphTargets=[],this.morphNormals=[],this.skinWeights=[],this.skinIndices=[],this.lineDistances=[],this.boundingBox=null,this.boundingSphere=null,this.elementsNeedUpdate=!1,this.verticesNeedUpdate=!1,this.uvsNeedUpdate=!1,this.normalsNeedUpdate=!1,this.colorsNeedUpdate=!1,this.lineDistancesNeedUpdate=!1,this.groupsNeedUpdate=!1}function Xr(t,e,r){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.name="",this.array=t,this.itemSize=e,this.count=void 0!==t?t.length/e:0,this.normalized=!0===r,this.dynamic=!1,this.updateRange={offset:0,count:-1},this.version=0}function Yr(t,e,r){Xr.call(this,new Int8Array(t),e,r)}function Jr(t,e,r){Xr.call(this,new Uint8Array(t),e,r)}function Zr(t,e,r){Xr.call(this,new Uint8ClampedArray(t),e,r)}function Qr(t,e,r){Xr.call(this,new Int16Array(t),e,r)}function Kr(t,e,r){Xr.call(this,new Uint16Array(t),e,r)}function $r(t,e,r){Xr.call(this,new Int32Array(t),e,r)}function tn(t,e,r){Xr.call(this,new Uint32Array(t),e,r)}function en(t,e,r){Xr.call(this,new Float32Array(t),e,r)}function rn(t,e,r){Xr.call(this,new Float64Array(t),e,r)}function nn(){this.vertices=[],this.normals=[],this.colors=[],this.uvs=[],this.uvs2=[],this.groups=[],this.morphTargets={},this.skinWeights=[],this.skinIndices=[],this.boundingBox=null,this.boundingSphere=null,this.verticesNeedUpdate=!1,this.normalsNeedUpdate=!1,this.colorsNeedUpdate=!1,this.uvsNeedUpdate=!1,this.groupsNeedUpdate=!1}function an(t){if(0===t.length)return-1/0;for(var e=t[0],r=1,n=t.length;r<n;++r)t[r]>e&&(e=t[r]);return e}qr.prototype=Object.assign(Object.create(n.prototype),{constructor:qr,isGeometry:!0,applyMatrix:function(t){for(var e=(new rr).getNormalMatrix(t),r=0,n=this.vertices.length;r<n;r++)this.vertices[r].applyMatrix4(t);for(r=0,n=this.faces.length;r<n;r++){var i=this.faces[r];i.normal.applyMatrix3(e).normalize();for(var a=0,o=i.vertexNormals.length;a<o;a++)i.vertexNormals[a].applyMatrix3(e).normalize()}return null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this.verticesNeedUpdate=!0,this.normalsNeedUpdate=!0,this},rotateX:function(){var t=new $e;return function(e){return t.makeRotationX(e),this.applyMatrix(t),this}}(),rotateY:function(){var t=new $e;return function(e){return t.makeRotationY(e),this.applyMatrix(t),this}}(),rotateZ:function(){var t=new $e;return function(e){return t.makeRotationZ(e),this.applyMatrix(t),this}}(),translate:function(){var t=new $e;return function(e,r,n){return t.makeTranslation(e,r,n),this.applyMatrix(t),this}}(),scale:function(){var t=new $e;return function(e,r,n){return t.makeScale(e,r,n),this.applyMatrix(t),this}}(),lookAt:(kr=new Vr,function(t){kr.lookAt(t),kr.updateMatrix(),this.applyMatrix(kr.matrix)}),fromBufferGeometry:function(t){var e=this,r=null!==t.index?t.index.array:void 0,n=t.attributes,i=n.position.array,a=void 0!==n.normal?n.normal.array:void 0,o=void 0!==n.color?n.color.array:void 0,s=void 0!==n.uv?n.uv.array:void 0,c=void 0!==n.uv2?n.uv2.array:void 0;void 0!==c&&(this.faceVertexUvs[1]=[]);for(var h=0,l=0;h<i.length;h+=3,l+=2)e.vertices.push((new er).fromArray(i,h)),void 0!==o&&e.colors.push((new Lr).fromArray(o,h));function u(t,r,n,i){var h=void 0===o?[]:[e.colors[t].clone(),e.colors[r].clone(),e.colors[n].clone()],l=new Dr(t,r,n,void 0===a?[]:[(new er).fromArray(a,3*t),(new er).fromArray(a,3*r),(new er).fromArray(a,3*n)],h,i);e.faces.push(l),void 0!==s&&e.faceVertexUvs[0].push([(new Ke).fromArray(s,2*t),(new Ke).fromArray(s,2*r),(new Ke).fromArray(s,2*n)]),void 0!==c&&e.faceVertexUvs[1].push([(new Ke).fromArray(c,2*t),(new Ke).fromArray(c,2*r),(new Ke).fromArray(c,2*n)])}var p=t.groups;if(p.length>0)for(h=0;h<p.length;h++)for(var d=p[h],f=d.start,m=(l=f,f+d.count);l<m;l+=3)void 0!==r?u(r[l],r[l+1],r[l+2],d.materialIndex):u(l,l+1,l+2,d.materialIndex);else if(void 0!==r)for(h=0;h<r.length;h+=3)u(r[h],r[h+1],r[h+2]);else for(h=0;h<i.length/3;h+=3)u(h,h+1,h+2);return this.computeFaceNormals(),null!==t.boundingBox&&(this.boundingBox=t.boundingBox.clone()),null!==t.boundingSphere&&(this.boundingSphere=t.boundingSphere.clone()),this},center:(jr=new er,function(){return this.computeBoundingBox(),this.boundingBox.getCenter(jr).negate(),this.translate(jr.x,jr.y,jr.z),this}),normalize:function(){this.computeBoundingSphere();var t=this.boundingSphere.center,e=this.boundingSphere.radius,r=0===e?1:1/e,n=new $e;return n.set(r,0,0,-r*t.x,0,r,0,-r*t.y,0,0,r,-r*t.z,0,0,0,1),this.applyMatrix(n),this},computeFaceNormals:function(){for(var t=new er,e=new er,r=0,n=this.faces.length;r<n;r++){var i=this.faces[r],a=this.vertices[i.a],o=this.vertices[i.b],s=this.vertices[i.c];t.subVectors(s,o),e.subVectors(a,o),t.cross(e),t.normalize(),i.normal.copy(t)}},computeVertexNormals:function(t){var e,r,n,i,a,o;for(void 0===t&&(t=!0),o=new Array(this.vertices.length),e=0,r=this.vertices.length;e<r;e++)o[e]=new er;if(t){var s,c,h,l=new er,u=new er;for(n=0,i=this.faces.length;n<i;n++)a=this.faces[n],s=this.vertices[a.a],c=this.vertices[a.b],h=this.vertices[a.c],l.subVectors(h,c),u.subVectors(s,c),l.cross(u),o[a.a].add(l),o[a.b].add(l),o[a.c].add(l)}else for(this.computeFaceNormals(),n=0,i=this.faces.length;n<i;n++)o[(a=this.faces[n]).a].add(a.normal),o[a.b].add(a.normal),o[a.c].add(a.normal);for(e=0,r=this.vertices.length;e<r;e++)o[e].normalize();for(n=0,i=this.faces.length;n<i;n++){var p=(a=this.faces[n]).vertexNormals;3===p.length?(p[0].copy(o[a.a]),p[1].copy(o[a.b]),p[2].copy(o[a.c])):(p[0]=o[a.a].clone(),p[1]=o[a.b].clone(),p[2]=o[a.c].clone())}this.faces.length>0&&(this.normalsNeedUpdate=!0)},computeFlatVertexNormals:function(){var t,e,r;for(this.computeFaceNormals(),t=0,e=this.faces.length;t<e;t++){var n=(r=this.faces[t]).vertexNormals;3===n.length?(n[0].copy(r.normal),n[1].copy(r.normal),n[2].copy(r.normal)):(n[0]=r.normal.clone(),n[1]=r.normal.clone(),n[2]=r.normal.clone())}this.faces.length>0&&(this.normalsNeedUpdate=!0)},computeMorphNormals:function(){var t,e,r,n,i;for(r=0,n=this.faces.length;r<n;r++)for((i=this.faces[r]).__originalFaceNormal?i.__originalFaceNormal.copy(i.normal):i.__originalFaceNormal=i.normal.clone(),i.__originalVertexNormals||(i.__originalVertexNormals=[]),t=0,e=i.vertexNormals.length;t<e;t++)i.__originalVertexNormals[t]?i.__originalVertexNormals[t].copy(i.vertexNormals[t]):i.__originalVertexNormals[t]=i.vertexNormals[t].clone();var a=new qr;for(a.faces=this.faces,t=0,e=this.morphTargets.length;t<e;t++){if(!this.morphNormals[t]){this.morphNormals[t]={},this.morphNormals[t].faceNormals=[],this.morphNormals[t].vertexNormals=[];var o=this.morphNormals[t].faceNormals,s=this.morphNormals[t].vertexNormals;for(r=0,n=this.faces.length;r<n;r++)c=new er,h={a:new er,b:new er,c:new er},o.push(c),s.push(h)}var c,h,l=this.morphNormals[t];for(a.vertices=this.morphTargets[t].vertices,a.computeFaceNormals(),a.computeVertexNormals(),r=0,n=this.faces.length;r<n;r++)i=this.faces[r],c=l.faceNormals[r],h=l.vertexNormals[r],c.copy(i.normal),h.a.copy(i.vertexNormals[0]),h.b.copy(i.vertexNormals[1]),h.c.copy(i.vertexNormals[2])}for(r=0,n=this.faces.length;r<n;r++)(i=this.faces[r]).normal=i.__originalFaceNormal,i.vertexNormals=i.__originalVertexNormals},computeBoundingBox:function(){null===this.boundingBox&&(this.boundingBox=new gr),this.boundingBox.setFromPoints(this.vertices)},computeBoundingSphere:function(){null===this.boundingSphere&&(this.boundingSphere=new vr),this.boundingSphere.setFromPoints(this.vertices)},merge:function(t,e,r){if(t&&t.isGeometry){var n,i=this.vertices.length,a=this.vertices,o=t.vertices,s=this.faces,c=t.faces,h=this.faceVertexUvs[0],l=t.faceVertexUvs[0],u=this.colors,p=t.colors;void 0===r&&(r=0),void 0!==e&&(n=(new rr).getNormalMatrix(e));for(var d=0,f=o.length;d<f;d++){var m=o[d].clone();void 0!==e&&m.applyMatrix4(e),a.push(m)}for(d=0,f=p.length;d<f;d++)u.push(p[d].clone());for(d=0,f=c.length;d<f;d++){var g,v,y,x=c[d],b=x.vertexNormals,w=x.vertexColors;(g=new Dr(x.a+i,x.b+i,x.c+i)).normal.copy(x.normal),void 0!==n&&g.normal.applyMatrix3(n).normalize();for(var _=0,M=b.length;_<M;_++)v=b[_].clone(),void 0!==n&&v.applyMatrix3(n).normalize(),g.vertexNormals.push(v);for(g.color.copy(x.color),_=0,M=w.length;_<M;_++)y=w[_],g.vertexColors.push(y.clone());g.materialIndex=x.materialIndex+r,s.push(g)}for(d=0,f=l.length;d<f;d++){var E=l[d],S=[];if(void 0!==E){for(_=0,M=E.length;_<M;_++)S.push(E[_].clone());h.push(S)}}}else console.error("THREE.Geometry.merge(): geometry not an instance of THREE.Geometry.",t)},mergeMesh:function(t){t&&t.isMesh?(t.matrixAutoUpdate&&t.updateMatrix(),this.merge(t.geometry,t.matrix)):console.error("THREE.Geometry.mergeMesh(): mesh not an instance of THREE.Mesh.",t)},mergeVertices:function(){var t,e,r,n,i,a,o,s,c={},h=[],l=[],u=Math.pow(10,4);for(r=0,n=this.vertices.length;r<n;r++)t=this.vertices[r],void 0===c[e=Math.round(t.x*u)+"_"+Math.round(t.y*u)+"_"+Math.round(t.z*u)]?(c[e]=r,h.push(this.vertices[r]),l[r]=h.length-1):l[r]=l[c[e]];var p=[];for(r=0,n=this.faces.length;r<n;r++){(i=this.faces[r]).a=l[i.a],i.b=l[i.b],i.c=l[i.c],a=[i.a,i.b,i.c];for(var d=0;d<3;d++)if(a[d]===a[(d+1)%3]){p.push(r);break}}for(r=p.length-1;r>=0;r--){var f=p[r];for(this.faces.splice(f,1),o=0,s=this.faceVertexUvs.length;o<s;o++)this.faceVertexUvs[o].splice(f,1)}var m=this.vertices.length-h.length;return this.vertices=h,m},setFromPoints:function(t){this.vertices=[];for(var e=0,r=t.length;e<r;e++){var n=t[e];this.vertices.push(new er(n.x,n.y,n.z||0))}return this},sortFacesByMaterialIndex:function(){for(var t=this.faces,e=t.length,r=0;r<e;r++)t[r]._id=r;t.sort((function(t,e){return t.materialIndex-e.materialIndex}));var n,i,a=this.faceVertexUvs[0],o=this.faceVertexUvs[1];for(a&&a.length===e&&(n=[]),o&&o.length===e&&(i=[]),r=0;r<e;r++){var s=t[r]._id;n&&n.push(a[s]),i&&i.push(o[s])}n&&(this.faceVertexUvs[0]=n),i&&(this.faceVertexUvs[1]=i)},toJSON:function(){var t={metadata:{version:4.5,type:"Geometry",generator:"Geometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,""!==this.name&&(t.name=this.name),void 0!==this.parameters){var e=this.parameters;for(var r in e)void 0!==e[r]&&(t[r]=e[r]);return t}for(var n=[],i=0;i<this.vertices.length;i++){var a=this.vertices[i];n.push(a.x,a.y,a.z)}var o=[],s=[],c={},h=[],l={},u=[],p={};for(i=0;i<this.faces.length;i++){var d=this.faces[i],f=void 0!==this.faceVertexUvs[0][i],m=d.normal.length()>0,g=d.vertexNormals.length>0,v=1!==d.color.r||1!==d.color.g||1!==d.color.b,y=d.vertexColors.length>0,x=0;if(x=M(x,0,0),x=M(x,1,!0),x=M(x,2,!1),x=M(x,3,f),x=M(x,4,m),x=M(x,5,g),x=M(x,6,v),x=M(x,7,y),o.push(x),o.push(d.a,d.b,d.c),o.push(d.materialIndex),f){var b=this.faceVertexUvs[0][i];o.push(T(b[0]),T(b[1]),T(b[2]))}if(m&&o.push(E(d.normal)),g){var w=d.vertexNormals;o.push(E(w[0]),E(w[1]),E(w[2]))}if(v&&o.push(S(d.color)),y){var _=d.vertexColors;o.push(S(_[0]),S(_[1]),S(_[2]))}}function M(t,e,r){return r?t|1<<e:t&~(1<<e)}function E(t){var e=t.x.toString()+t.y.toString()+t.z.toString();return void 0!==c[e]||(c[e]=s.length/3,s.push(t.x,t.y,t.z)),c[e]}function S(t){var e=t.r.toString()+t.g.toString()+t.b.toString();return void 0!==l[e]||(l[e]=h.length,h.push(t.getHex())),l[e]}function T(t){var e=t.x.toString()+t.y.toString();return void 0!==p[e]||(p[e]=u.length/2,u.push(t.x,t.y)),p[e]}return t.data={},t.data.vertices=n,t.data.normals=s,h.length>0&&(t.data.colors=h),u.length>0&&(t.data.uvs=[u]),t.data.faces=o,t},clone:function(){return(new qr).copy(this)},copy:function(t){var e,r,n,i,a,o;this.vertices=[],this.colors=[],this.faces=[],this.faceVertexUvs=[[]],this.morphTargets=[],this.morphNormals=[],this.skinWeights=[],this.skinIndices=[],this.lineDistances=[],this.boundingBox=null,this.boundingSphere=null,this.name=t.name;var s=t.vertices;for(e=0,r=s.length;e<r;e++)this.vertices.push(s[e].clone());var c=t.colors;for(e=0,r=c.length;e<r;e++)this.colors.push(c[e].clone());var h=t.faces;for(e=0,r=h.length;e<r;e++)this.faces.push(h[e].clone());for(e=0,r=t.faceVertexUvs.length;e<r;e++){var l=t.faceVertexUvs[e];for(void 0===this.faceVertexUvs[e]&&(this.faceVertexUvs[e]=[]),n=0,i=l.length;n<i;n++){var u=l[n],p=[];for(a=0,o=u.length;a<o;a++){var d=u[a];p.push(d.clone())}this.faceVertexUvs[e].push(p)}}var f=t.morphTargets;for(e=0,r=f.length;e<r;e++){var m={};if(m.name=f[e].name,void 0!==f[e].vertices)for(m.vertices=[],n=0,i=f[e].vertices.length;n<i;n++)m.vertices.push(f[e].vertices[n].clone());if(void 0!==f[e].normals)for(m.normals=[],n=0,i=f[e].normals.length;n<i;n++)m.normals.push(f[e].normals[n].clone());this.morphTargets.push(m)}var g=t.morphNormals;for(e=0,r=g.length;e<r;e++){var v={};if(void 0!==g[e].vertexNormals)for(v.vertexNormals=[],n=0,i=g[e].vertexNormals.length;n<i;n++){var y=g[e].vertexNormals[n],x={};x.a=y.a.clone(),x.b=y.b.clone(),x.c=y.c.clone(),v.vertexNormals.push(x)}if(void 0!==g[e].faceNormals)for(v.faceNormals=[],n=0,i=g[e].faceNormals.length;n<i;n++)v.faceNormals.push(g[e].faceNormals[n].clone());this.morphNormals.push(v)}var b=t.skinWeights;for(e=0,r=b.length;e<r;e++)this.skinWeights.push(b[e].clone());var w=t.skinIndices;for(e=0,r=w.length;e<r;e++)this.skinIndices.push(w[e].clone());var _=t.lineDistances;for(e=0,r=_.length;e<r;e++)this.lineDistances.push(_[e]);var M=t.boundingBox;null!==M&&(this.boundingBox=M.clone());var E=t.boundingSphere;return null!==E&&(this.boundingSphere=E.clone()),this.elementsNeedUpdate=t.elementsNeedUpdate,this.verticesNeedUpdate=t.verticesNeedUpdate,this.uvsNeedUpdate=t.uvsNeedUpdate,this.normalsNeedUpdate=t.normalsNeedUpdate,this.colorsNeedUpdate=t.colorsNeedUpdate,this.lineDistancesNeedUpdate=t.lineDistancesNeedUpdate,this.groupsNeedUpdate=t.groupsNeedUpdate,this},dispose:function(){this.dispatchEvent({type:"dispose"})}}),Object.defineProperty(Xr.prototype,"needsUpdate",{set:function(t){!0===t&&this.version++}}),Object.assign(Xr.prototype,{isBufferAttribute:!0,onUploadCallback:function(){},setArray:function(t){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");return this.count=void 0!==t?t.length/this.itemSize:0,this.array=t,this},setDynamic:function(t){return this.dynamic=t,this},copy:function(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.dynamic=t.dynamic,this},copyAt:function(t,e,r){t*=this.itemSize,r*=e.itemSize;for(var n=0,i=this.itemSize;n<i;n++)this.array[t+n]=e.array[r+n];return this},copyArray:function(t){return this.array.set(t),this},copyColorsArray:function(t){for(var e=this.array,r=0,n=0,i=t.length;n<i;n++){var a=t[n];void 0===a&&(console.warn("THREE.BufferAttribute.copyColorsArray(): color is undefined",n),a=new Lr),e[r++]=a.r,e[r++]=a.g,e[r++]=a.b}return this},copyVector2sArray:function(t){for(var e=this.array,r=0,n=0,i=t.length;n<i;n++){var a=t[n];void 0===a&&(console.warn("THREE.BufferAttribute.copyVector2sArray(): vector is undefined",n),a=new Ke),e[r++]=a.x,e[r++]=a.y}return this},copyVector3sArray:function(t){for(var e=this.array,r=0,n=0,i=t.length;n<i;n++){var a=t[n];void 0===a&&(console.warn("THREE.BufferAttribute.copyVector3sArray(): vector is undefined",n),a=new er),e[r++]=a.x,e[r++]=a.y,e[r++]=a.z}return this},copyVector4sArray:function(t){for(var e=this.array,r=0,n=0,i=t.length;n<i;n++){var a=t[n];void 0===a&&(console.warn("THREE.BufferAttribute.copyVector4sArray(): vector is undefined",n),a=new ur),e[r++]=a.x,e[r++]=a.y,e[r++]=a.z,e[r++]=a.w}return this},set:function(t,e){return void 0===e&&(e=0),this.array.set(t,e),this},getX:function(t){return this.array[t*this.itemSize]},setX:function(t,e){return this.array[t*this.itemSize]=e,this},getY:function(t){return this.array[t*this.itemSize+1]},setY:function(t,e){return this.array[t*this.itemSize+1]=e,this},getZ:function(t){return this.array[t*this.itemSize+2]},setZ:function(t,e){return this.array[t*this.itemSize+2]=e,this},getW:function(t){return this.array[t*this.itemSize+3]},setW:function(t,e){return this.array[t*this.itemSize+3]=e,this},setXY:function(t,e,r){return t*=this.itemSize,this.array[t+0]=e,this.array[t+1]=r,this},setXYZ:function(t,e,r,n){return t*=this.itemSize,this.array[t+0]=e,this.array[t+1]=r,this.array[t+2]=n,this},setXYZW:function(t,e,r,n,i){return t*=this.itemSize,this.array[t+0]=e,this.array[t+1]=r,this.array[t+2]=n,this.array[t+3]=i,this},onUpload:function(t){return this.onUploadCallback=t,this},clone:function(){return new this.constructor(this.array,this.itemSize).copy(this)}}),Yr.prototype=Object.create(Xr.prototype),Yr.prototype.constructor=Yr,Jr.prototype=Object.create(Xr.prototype),Jr.prototype.constructor=Jr,Zr.prototype=Object.create(Xr.prototype),Zr.prototype.constructor=Zr,Qr.prototype=Object.create(Xr.prototype),Qr.prototype.constructor=Qr,Kr.prototype=Object.create(Xr.prototype),Kr.prototype.constructor=Kr,$r.prototype=Object.create(Xr.prototype),$r.prototype.constructor=$r,tn.prototype=Object.create(Xr.prototype),tn.prototype.constructor=tn,en.prototype=Object.create(Xr.prototype),en.prototype.constructor=en,rn.prototype=Object.create(Xr.prototype),rn.prototype.constructor=rn,Object.assign(nn.prototype,{computeGroups:function(t){for(var e,r=[],n=void 0,i=t.faces,a=0;a<i.length;a++){var o=i[a];o.materialIndex!==n&&(n=o.materialIndex,void 0!==e&&(e.count=3*a-e.start,r.push(e)),e={start:3*a,materialIndex:n})}void 0!==e&&(e.count=3*a-e.start,r.push(e)),this.groups=r},fromGeometry:function(t){var e,r=t.faces,n=t.vertices,i=t.faceVertexUvs,a=i[0]&&i[0].length>0,o=i[1]&&i[1].length>0,s=t.morphTargets,c=s.length;if(c>0){e=[];for(var h=0;h<c;h++)e[h]={name:s[h].name,data:[]};this.morphTargets.position=e}var l,u=t.morphNormals,p=u.length;if(p>0){for(l=[],h=0;h<p;h++)l[h]={name:u[h].name,data:[]};this.morphTargets.normal=l}var d=t.skinIndices,f=t.skinWeights,m=d.length===n.length,g=f.length===n.length;for(n.length>0&&0===r.length&&console.error("THREE.DirectGeometry: Faceless geometries are not supported."),h=0;h<r.length;h++){var v=r[h];this.vertices.push(n[v.a],n[v.b],n[v.c]);var y=v.vertexNormals;if(3===y.length)this.normals.push(y[0],y[1],y[2]);else{var x=v.normal;this.normals.push(x,x,x)}var b,w=v.vertexColors;if(3===w.length)this.colors.push(w[0],w[1],w[2]);else{var _=v.color;this.colors.push(_,_,_)}!0===a&&(void 0!==(b=i[0][h])?this.uvs.push(b[0],b[1],b[2]):(console.warn("THREE.DirectGeometry.fromGeometry(): Undefined vertexUv ",h),this.uvs.push(new Ke,new Ke,new Ke))),!0===o&&(void 0!==(b=i[1][h])?this.uvs2.push(b[0],b[1],b[2]):(console.warn("THREE.DirectGeometry.fromGeometry(): Undefined vertexUv2 ",h),this.uvs2.push(new Ke,new Ke,new Ke)));for(var M=0;M<c;M++){var E=s[M].vertices;e[M].data.push(E[v.a],E[v.b],E[v.c])}for(M=0;M<p;M++){var S=u[M].vertexNormals[h];l[M].data.push(S.a,S.b,S.c)}m&&this.skinIndices.push(d[v.a],d[v.b],d[v.c]),g&&this.skinWeights.push(f[v.a],f[v.b],f[v.c])}return this.computeGroups(t),this.verticesNeedUpdate=t.verticesNeedUpdate,this.normalsNeedUpdate=t.normalsNeedUpdate,this.colorsNeedUpdate=t.colorsNeedUpdate,this.uvsNeedUpdate=t.uvsNeedUpdate,this.groupsNeedUpdate=t.groupsNeedUpdate,this}});var on=1;function sn(){Object.defineProperty(this,"id",{value:on+=2}),this.uuid=Qe.generateUUID(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}function cn(t,e,r,n,i,a){qr.call(this),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:r,widthSegments:n,heightSegments:i,depthSegments:a},this.fromBufferGeometry(new hn(t,e,r,n,i,a)),this.mergeVertices()}function hn(t,e,r,n,i,a){sn.call(this),this.type="BoxBufferGeometry",this.parameters={width:t,height:e,depth:r,widthSegments:n,heightSegments:i,depthSegments:a};var o=this;t=t||1,e=e||1,r=r||1,n=Math.floor(n)||1,i=Math.floor(i)||1,a=Math.floor(a)||1;var s=[],c=[],h=[],l=[],u=0,p=0;function d(t,e,r,n,i,a,d,f,m,g,v){var y,x,b=a/m,w=d/g,_=a/2,M=d/2,E=f/2,S=m+1,T=g+1,A=0,L=0,R=new er;for(x=0;x<T;x++){var C=x*w-M;for(y=0;y<S;y++){var P=y*b-_;R[t]=P*n,R[e]=C*i,R[r]=E,c.push(R.x,R.y,R.z),R[t]=0,R[e]=0,R[r]=f>0?1:-1,h.push(R.x,R.y,R.z),l.push(y/m),l.push(1-x/g),A+=1}}for(x=0;x<g;x++)for(y=0;y<m;y++){var O=u+y+S*x,I=u+y+S*(x+1),D=u+(y+1)+S*(x+1),N=u+(y+1)+S*x;s.push(O,I,N),s.push(I,D,N),L+=6}o.addGroup(p,L,v),p+=L,u+=A}d("z","y","x",-1,-1,r,e,t,a,i,0),d("z","y","x",1,-1,r,e,-t,a,i,1),d("x","z","y",1,1,t,r,e,n,a,2),d("x","z","y",1,-1,t,r,-e,n,a,3),d("x","y","z",1,-1,t,e,r,n,i,4),d("x","y","z",-1,-1,t,e,-r,n,i,5),this.setIndex(s),this.addAttribute("position",new en(c,3)),this.addAttribute("normal",new en(h,3)),this.addAttribute("uv",new en(l,2))}function ln(t,e,r,n){qr.call(this),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:r,heightSegments:n},this.fromBufferGeometry(new un(t,e,r,n)),this.mergeVertices()}function un(t,e,r,n){sn.call(this),this.type="PlaneBufferGeometry",this.parameters={width:t,height:e,widthSegments:r,heightSegments:n};var i,a,o=(t=t||1)/2,s=(e=e||1)/2,c=Math.floor(r)||1,h=Math.floor(n)||1,l=c+1,u=h+1,p=t/c,d=e/h,f=[],m=[],g=[],v=[];for(a=0;a<u;a++){var y=a*d-s;for(i=0;i<l;i++){var x=i*p-o;m.push(x,-y,0),g.push(0,0,1),v.push(i/c),v.push(1-a/h)}}for(a=0;a<h;a++)for(i=0;i<c;i++){var b=i+l*a,w=i+l*(a+1),_=i+1+l*(a+1),M=i+1+l*a;f.push(b,w,M),f.push(w,_,M)}this.setIndex(f),this.addAttribute("position",new en(m,3)),this.addAttribute("normal",new en(g,3)),this.addAttribute("uv",new en(v,2))}sn.prototype=Object.assign(Object.create(n.prototype),{constructor:sn,isBufferGeometry:!0,getIndex:function(){return this.index},setIndex:function(t){Array.isArray(t)?this.index=new(an(t)>65535?tn:Kr)(t,1):this.index=t},addAttribute:function(t,e){return e&&e.isBufferAttribute||e&&e.isInterleavedBufferAttribute?"index"===t?(console.warn("THREE.BufferGeometry.addAttribute: Use .setIndex() for index attribute."),this.setIndex(e),this):(this.attributes[t]=e,this):(console.warn("THREE.BufferGeometry: .addAttribute() now expects ( name, attribute )."),this.addAttribute(t,new Xr(arguments[1],arguments[2])))},getAttribute:function(t){return this.attributes[t]},removeAttribute:function(t){return delete this.attributes[t],this},addGroup:function(t,e,r){this.groups.push({start:t,count:e,materialIndex:void 0!==r?r:0})},clearGroups:function(){this.groups=[]},setDrawRange:function(t,e){this.drawRange.start=t,this.drawRange.count=e},applyMatrix:function(t){var e=this.attributes.position;void 0!==e&&(t.applyToBufferAttribute(e),e.needsUpdate=!0);var r=this.attributes.normal;return void 0!==r&&((new rr).getNormalMatrix(t).applyToBufferAttribute(r),r.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this},rotateX:function(){var t=new $e;return function(e){return t.makeRotationX(e),this.applyMatrix(t),this}}(),rotateY:function(){var t=new $e;return function(e){return t.makeRotationY(e),this.applyMatrix(t),this}}(),rotateZ:function(){var t=new $e;return function(e){return t.makeRotationZ(e),this.applyMatrix(t),this}}(),translate:function(){var t=new $e;return function(e,r,n){return t.makeTranslation(e,r,n),this.applyMatrix(t),this}}(),scale:function(){var t=new $e;return function(e,r,n){return t.makeScale(e,r,n),this.applyMatrix(t),this}}(),lookAt:function(){var t=new Vr;return function(e){t.lookAt(e),t.updateMatrix(),this.applyMatrix(t.matrix)}}(),center:function(){var t=new er;return function(){return this.computeBoundingBox(),this.boundingBox.getCenter(t).negate(),this.translate(t.x,t.y,t.z),this}}(),setFromObject:function(t){var e=t.geometry;if(t.isPoints||t.isLine){var r=new en(3*e.vertices.length,3),n=new en(3*e.colors.length,3);if(this.addAttribute("position",r.copyVector3sArray(e.vertices)),this.addAttribute("color",n.copyColorsArray(e.colors)),e.lineDistances&&e.lineDistances.length===e.vertices.length){var i=new en(e.lineDistances.length,1);this.addAttribute("lineDistance",i.copyArray(e.lineDistances))}null!==e.boundingSphere&&(this.boundingSphere=e.boundingSphere.clone()),null!==e.boundingBox&&(this.boundingBox=e.boundingBox.clone())}else t.isMesh&&e&&e.isGeometry&&this.fromGeometry(e);return this},setFromPoints:function(t){for(var e=[],r=0,n=t.length;r<n;r++){var i=t[r];e.push(i.x,i.y,i.z||0)}return this.addAttribute("position",new en(e,3)),this},updateFromObject:function(t){var e,r=t.geometry;if(t.isMesh){var n=r.__directGeometry;if(!0===r.elementsNeedUpdate&&(n=void 0,r.elementsNeedUpdate=!1),void 0===n)return this.fromGeometry(r);n.verticesNeedUpdate=r.verticesNeedUpdate,n.normalsNeedUpdate=r.normalsNeedUpdate,n.colorsNeedUpdate=r.colorsNeedUpdate,n.uvsNeedUpdate=r.uvsNeedUpdate,n.groupsNeedUpdate=r.groupsNeedUpdate,r.verticesNeedUpdate=!1,r.normalsNeedUpdate=!1,r.colorsNeedUpdate=!1,r.uvsNeedUpdate=!1,r.groupsNeedUpdate=!1,r=n}return!0===r.verticesNeedUpdate&&(void 0!==(e=this.attributes.position)&&(e.copyVector3sArray(r.vertices),e.needsUpdate=!0),r.verticesNeedUpdate=!1),!0===r.normalsNeedUpdate&&(void 0!==(e=this.attributes.normal)&&(e.copyVector3sArray(r.normals),e.needsUpdate=!0),r.normalsNeedUpdate=!1),!0===r.colorsNeedUpdate&&(void 0!==(e=this.attributes.color)&&(e.copyColorsArray(r.colors),e.needsUpdate=!0),r.colorsNeedUpdate=!1),r.uvsNeedUpdate&&(void 0!==(e=this.attributes.uv)&&(e.copyVector2sArray(r.uvs),e.needsUpdate=!0),r.uvsNeedUpdate=!1),r.lineDistancesNeedUpdate&&(void 0!==(e=this.attributes.lineDistance)&&(e.copyArray(r.lineDistances),e.needsUpdate=!0),r.lineDistancesNeedUpdate=!1),r.groupsNeedUpdate&&(r.computeGroups(t.geometry),this.groups=r.groups,r.groupsNeedUpdate=!1),this},fromGeometry:function(t){return t.__directGeometry=(new nn).fromGeometry(t),this.fromDirectGeometry(t.__directGeometry)},fromDirectGeometry:function(t){var e=new Float32Array(3*t.vertices.length);if(this.addAttribute("position",new Xr(e,3).copyVector3sArray(t.vertices)),t.normals.length>0){var r=new Float32Array(3*t.normals.length);this.addAttribute("normal",new Xr(r,3).copyVector3sArray(t.normals))}if(t.colors.length>0){var n=new Float32Array(3*t.colors.length);this.addAttribute("color",new Xr(n,3).copyColorsArray(t.colors))}if(t.uvs.length>0){var i=new Float32Array(2*t.uvs.length);this.addAttribute("uv",new Xr(i,2).copyVector2sArray(t.uvs))}if(t.uvs2.length>0){var a=new Float32Array(2*t.uvs2.length);this.addAttribute("uv2",new Xr(a,2).copyVector2sArray(t.uvs2))}for(var o in this.groups=t.groups,t.morphTargets){for(var s=[],c=t.morphTargets[o],h=0,l=c.length;h<l;h++){var u=c[h],p=new en(3*u.data.length,3);p.name=u.name,s.push(p.copyVector3sArray(u.data))}this.morphAttributes[o]=s}if(t.skinIndices.length>0){var d=new en(4*t.skinIndices.length,4);this.addAttribute("skinIndex",d.copyVector4sArray(t.skinIndices))}if(t.skinWeights.length>0){var f=new en(4*t.skinWeights.length,4);this.addAttribute("skinWeight",f.copyVector4sArray(t.skinWeights))}return null!==t.boundingSphere&&(this.boundingSphere=t.boundingSphere.clone()),null!==t.boundingBox&&(this.boundingBox=t.boundingBox.clone()),this},computeBoundingBox:function(){null===this.boundingBox&&(this.boundingBox=new gr);var t=this.attributes.position;void 0!==t?this.boundingBox.setFromBufferAttribute(t):this.boundingBox.makeEmpty(),(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)},computeBoundingSphere:function(){var t=new gr,e=new er;return function(){null===this.boundingSphere&&(this.boundingSphere=new vr);var r=this.attributes.position;if(r){var n=this.boundingSphere.center;t.setFromBufferAttribute(r),t.getCenter(n);for(var i=0,a=0,o=r.count;a<o;a++)e.x=r.getX(a),e.y=r.getY(a),e.z=r.getZ(a),i=Math.max(i,n.distanceToSquared(e));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}}(),computeFaceNormals:function(){},computeVertexNormals:function(){var t=this.index,e=this.attributes;if(e.position){var r=e.position.array;if(void 0===e.normal)this.addAttribute("normal",new Xr(new Float32Array(r.length),3));else for(var n=e.normal.array,i=0,a=n.length;i<a;i++)n[i]=0;var o,s,c,h=e.normal.array,l=new er,u=new er,p=new er,d=new er,f=new er;if(t){var m=t.array;for(i=0,a=t.count;i<a;i+=3)o=3*m[i+0],s=3*m[i+1],c=3*m[i+2],l.fromArray(r,o),u.fromArray(r,s),p.fromArray(r,c),d.subVectors(p,u),f.subVectors(l,u),d.cross(f),h[o]+=d.x,h[o+1]+=d.y,h[o+2]+=d.z,h[s]+=d.x,h[s+1]+=d.y,h[s+2]+=d.z,h[c]+=d.x,h[c+1]+=d.y,h[c+2]+=d.z}else for(i=0,a=r.length;i<a;i+=9)l.fromArray(r,i),u.fromArray(r,i+3),p.fromArray(r,i+6),d.subVectors(p,u),f.subVectors(l,u),d.cross(f),h[i]=d.x,h[i+1]=d.y,h[i+2]=d.z,h[i+3]=d.x,h[i+4]=d.y,h[i+5]=d.z,h[i+6]=d.x,h[i+7]=d.y,h[i+8]=d.z;this.normalizeNormals(),e.normal.needsUpdate=!0}},merge:function(t,e){if(t&&t.isBufferGeometry){void 0===e&&(e=0,console.warn("THREE.BufferGeometry.merge(): Overwriting original geometry, starting at offset=0. Use BufferGeometryUtils.mergeBufferGeometries() for lossless merge."));var r=this.attributes;for(var n in r)if(void 0!==t.attributes[n])for(var i=r[n].array,a=t.attributes[n],o=a.array,s=0,c=a.itemSize*e;s<o.length;s++,c++)i[c]=o[s];return this}console.error("THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.",t)},normalizeNormals:function(){var t=new er;return function(){for(var e=this.attributes.normal,r=0,n=e.count;r<n;r++)t.x=e.getX(r),t.y=e.getY(r),t.z=e.getZ(r),t.normalize(),e.setXYZ(r,t.x,t.y,t.z)}}(),toNonIndexed:function(){function t(t,e){for(var r=t.array,n=t.itemSize,i=new r.constructor(e.length*n),a=0,o=0,s=0,c=e.length;s<c;s++){a=e[s]*n;for(var h=0;h<n;h++)i[o++]=r[a++]}return new Xr(i,n)}if(null===this.index)return console.warn("THREE.BufferGeometry.toNonIndexed(): Geometry is already non-indexed."),this;var e=new sn,r=this.index.array,n=this.attributes;for(var i in n){var a=t(n[i],r);e.addAttribute(i,a)}var o=this.morphAttributes;for(i in o){for(var s=[],c=o[i],h=0,l=c.length;h<l;h++)a=t(c[h],r),s.push(a);e.morphAttributes[i]=s}for(var u=this.groups,p=(h=0,u.length);h<p;h++){var d=u[h];e.addGroup(d.start,d.count,d.materialIndex)}return e},toJSON:function(){var t={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,""!==this.name&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),void 0!==this.parameters){var e=this.parameters;for(var r in e)void 0!==e[r]&&(t[r]=e[r]);return t}t.data={attributes:{}};var n=this.index;if(null!==n){var i=Array.prototype.slice.call(n.array);t.data.index={type:n.array.constructor.name,array:i}}var a=this.attributes;for(var r in a){var o=a[r];i=Array.prototype.slice.call(o.array),t.data.attributes[r]={itemSize:o.itemSize,type:o.array.constructor.name,array:i,normalized:o.normalized}}var s=this.groups;s.length>0&&(t.data.groups=JSON.parse(JSON.stringify(s)));var c=this.boundingSphere;return null!==c&&(t.data.boundingSphere={center:c.center.toArray(),radius:c.radius}),t},clone:function(){return(new sn).copy(this)},copy:function(t){var e,r,n;this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.name=t.name;var i=t.index;null!==i&&this.setIndex(i.clone());var a=t.attributes;for(e in a){var o=a[e];this.addAttribute(e,o.clone())}var s=t.morphAttributes;for(e in s){var c=[],h=s[e];for(r=0,n=h.length;r<n;r++)c.push(h[r].clone());this.morphAttributes[e]=c}var l=t.groups;for(r=0,n=l.length;r<n;r++){var u=l[r];this.addGroup(u.start,u.count,u.materialIndex)}var p=t.boundingBox;null!==p&&(this.boundingBox=p.clone());var d=t.boundingSphere;return null!==d&&(this.boundingSphere=d.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this},dispose:function(){this.dispatchEvent({type:"dispose"})}}),cn.prototype=Object.create(qr.prototype),cn.prototype.constructor=cn,hn.prototype=Object.create(sn.prototype),hn.prototype.constructor=hn,ln.prototype=Object.create(qr.prototype),ln.prototype.constructor=ln,un.prototype=Object.create(sn.prototype),un.prototype.constructor=un;var pn,dn,fn,mn,gn,vn,yn,xn,bn,wn,_n,Mn,En=0;function Sn(){Object.defineProperty(this,"id",{value:En++}),this.uuid=Qe.generateUUID(),this.name="",this.type="Material",this.fog=!0,this.lights=!0,this.blending=B,this.side=A,this.flatShading=!1,this.vertexColors=O,this.opacity=1,this.transparent=!1,this.blendSrc=Z,this.blendDst=Q,this.blendEquation=H,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=ot,this.depthTest=!0,this.depthWrite=!0,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaTest=0,this.premultipliedAlpha=!1,this.visible=!0,this.userData={},this.needsUpdate=!0}function Tn(t){Sn.call(this),this.type="ShaderMaterial",this.defines={},this.uniforms={},this.vertexShader="void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",this.fragmentShader="void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}",this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.skinning=!1,this.morphTargets=!1,this.morphNormals=!1,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,void 0!==t&&(void 0!==t.attributes&&console.error("THREE.ShaderMaterial: attributes should now be defined in THREE.BufferGeometry instead."),this.setValues(t))}function An(t,e){this.origin=void 0!==t?t:new er,this.direction=void 0!==e?e:new er}function Ln(t,e,r){this.a=void 0!==t?t:new er,this.b=void 0!==e?e:new er,this.c=void 0!==r?r:new er}function Rn(t){Sn.call(this),this.type="MeshBasicMaterial",this.color=new Lr(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=ut,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.skinning=!1,this.morphTargets=!1,this.lights=!1,this.setValues(t)}function Cn(t,e){Vr.call(this),this.type="Mesh",this.geometry=void 0!==t?t:new sn,this.material=void 0!==e?e:new Rn({color:16777215*Math.random()}),this.drawMode=Be,this.updateMorphTargets()}function Pn(t,e,r,n){var i,a,o=new Lr(0),s=0,c=null,h=0;function l(t,r){e.buffers.color.setClear(t.r,t.g,t.b,r,n)}return{getClearColor:function(){return o},setClearColor:function(t,e){o.set(t),l(o,s=void 0!==e?e:1)},getClearAlpha:function(){return s},setClearAlpha:function(t){l(o,s=t)},render:function(e,n,u,p){var d=n.background;if(null===d?(l(o,s),c=null,h=0):d&&d.isColor&&(l(d,1),p=!0,c=null,h=0),(t.autoClear||p)&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),d&&(d.isCubeTexture||d.isWebGLRenderTargetCube)){void 0===a&&((a=new Cn(new hn(1,1,1),new Tn({type:"BackgroundCubeMaterial",uniforms:wr(Pr.cube.uniforms),vertexShader:Pr.cube.vertexShader,fragmentShader:Pr.cube.fragmentShader,side:L,depthTest:!1,depthWrite:!1,fog:!1}))).geometry.removeAttribute("normal"),a.geometry.removeAttribute("uv"),a.onBeforeRender=function(t,e,r){this.matrixWorld.copyPosition(r.matrixWorld)},Object.defineProperty(a.material,"map",{get:function(){return this.uniforms.tCube.value}}),r.update(a));var f=d.isWebGLRenderTargetCube?d.texture:d;a.material.uniforms.tCube.value=f,a.material.uniforms.tFlip.value=d.isWebGLRenderTargetCube?1:-1,c===d&&h===f.version||(a.material.needsUpdate=!0,c=d,h=f.version),e.unshift(a,a.geometry,a.material,0,0,null)}else d&&d.isTexture&&(void 0===i&&((i=new Cn(new un(2,2),new Tn({type:"BackgroundMaterial",uniforms:wr(Pr.background.uniforms),vertexShader:Pr.background.vertexShader,fragmentShader:Pr.background.fragmentShader,side:A,depthTest:!1,depthWrite:!1,fog:!1}))).geometry.removeAttribute("normal"),Object.defineProperty(i.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(i)),i.material.uniforms.t2D.value=d,!0===d.matrixAutoUpdate&&d.updateMatrix(),i.material.uniforms.uvTransform.value.copy(d.matrix),c===d&&h===d.version||(i.material.needsUpdate=!0,c=d,h=d.version),e.unshift(i,i.geometry,i.material,0,0,null))}}}function On(t,e,r,n){var i;this.setMode=function(t){i=t},this.render=function(e,n){t.drawArrays(i,e,n),r.update(n,i)},this.renderInstances=function(a,o,s){var c;if(n.isWebGL2)c=t;else if(null===(c=e.get("ANGLE_instanced_arrays")))return void console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");c[n.isWebGL2?"drawArraysInstanced":"drawArraysInstancedANGLE"](i,o,s,a.maxInstancedCount),r.update(s,i,a.maxInstancedCount)}}function In(t,e,r){var n;function i(e){if("highp"===e){if(t.getShaderPrecisionFormat(35633,36338).precision>0&&t.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";e="mediump"}return"mediump"===e&&t.getShaderPrecisionFormat(35633,36337).precision>0&&t.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}var a="undefined"!=typeof WebGL2RenderingContext&&t instanceof WebGL2RenderingContext,o=void 0!==r.precision?r.precision:"highp",s=i(o);s!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",s,"instead."),o=s);var c=!0===r.logarithmicDepthBuffer,h=t.getParameter(34930),l=t.getParameter(35660),u=t.getParameter(3379),p=t.getParameter(34076),d=t.getParameter(34921),f=t.getParameter(36347),m=t.getParameter(36348),g=t.getParameter(36349),v=l>0,y=a||!!e.get("OES_texture_float");return{isWebGL2:a,getMaxAnisotropy:function(){if(void 0!==n)return n;var r=e.get("EXT_texture_filter_anisotropic");return n=null!==r?t.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT):0},getMaxPrecision:i,precision:o,logarithmicDepthBuffer:c,maxTextures:h,maxVertexTextures:l,maxTextureSize:u,maxCubemapSize:p,maxAttributes:d,maxVertexUniforms:f,maxVaryings:m,maxFragmentUniforms:g,vertexTextures:v,floatFragmentTextures:y,floatVertexTextures:v&&y,maxSamples:a?t.getParameter(36183):0}}function Dn(){var t=this,e=null,r=0,n=!1,i=!1,a=new yr,o=new rr,s={value:null,needsUpdate:!1};function c(){s.value!==e&&(s.value=e,s.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function h(e,r,n,i){var c=null!==e?e.length:0,h=null;if(0!==c){if(h=s.value,!0!==i||null===h){var l=n+4*c,u=r.matrixWorldInverse;o.getNormalMatrix(u),(null===h||h.length<l)&&(h=new Float32Array(l));for(var p=0,d=n;p!==c;++p,d+=4)a.copy(e[p]).applyMatrix4(u,o),a.normal.toArray(h,d),h[d+3]=a.constant}s.value=h,s.needsUpdate=!0}return t.numPlanes=c,h}this.uniform=s,this.numPlanes=0,this.numIntersection=0,this.init=function(t,i,a){var o=0!==t.length||i||0!==r||n;return n=i,e=h(t,a,0),r=t.length,o},this.beginShadows=function(){i=!0,h(null)},this.endShadows=function(){i=!1,c()},this.setState=function(t,a,o,l,u,p){if(!n||null===t||0===t.length||i&&!o)i?h(null):c();else{var d=i?0:r,f=4*d,m=u.clippingState||null;s.value=m,m=h(t,l,f,p);for(var g=0;g!==f;++g)m[g]=e[g];u.clippingState=m,this.numIntersection=a?this.numPlanes:0,this.numPlanes+=d}}}function Nn(t){var e={};return{get:function(r){if(void 0!==e[r])return e[r];var n;switch(r){case"WEBGL_depth_texture":n=t.getExtension("WEBGL_depth_texture")||t.getExtension("MOZ_WEBGL_depth_texture")||t.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=t.getExtension("EXT_texture_filter_anisotropic")||t.getExtension("MOZ_EXT_texture_filter_anisotropic")||t.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=t.getExtension("WEBGL_compressed_texture_s3tc")||t.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||t.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=t.getExtension("WEBGL_compressed_texture_pvrtc")||t.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=t.getExtension(r)}return null===n&&console.warn("THREE.WebGLRenderer: "+r+" extension not supported."),e[r]=n,n}}}function Bn(t,e,r){var n={},i={};function a(t){var o=t.target,s=n[o.id];for(var c in null!==s.index&&e.remove(s.index),s.attributes)e.remove(s.attributes[c]);o.removeEventListener("dispose",a),delete n[o.id];var h=i[s.id];h&&(e.remove(h),delete i[s.id]),r.memory.geometries--}return{get:function(t,e){var i=n[e.id];return i||(e.addEventListener("dispose",a),e.isBufferGeometry?i=e:e.isGeometry&&(void 0===e._bufferGeometry&&(e._bufferGeometry=(new sn).setFromObject(t)),i=e._bufferGeometry),n[e.id]=i,r.memory.geometries++,i)},update:function(t){var r=t.index,n=t.attributes;for(var i in null!==r&&e.update(r,34963),n)e.update(n[i],34962);var a=t.morphAttributes;for(var i in a)for(var o=a[i],s=0,c=o.length;s<c;s++)e.update(o[s],34962)},getWireframeAttribute:function(t){var r=i[t.id];if(r)return r;var n,a=[],o=t.index,s=t.attributes;if(null!==o)for(var c=0,h=(n=o.array).length;c<h;c+=3){var l=n[c+0],u=n[c+1],p=n[c+2];a.push(l,u,u,p,p,l)}else for(c=0,h=(n=s.position.array).length/3-1;c<h;c+=3)l=c+0,u=c+1,p=c+2,a.push(l,u,u,p,p,l);return r=new(an(a)>65535?tn:Kr)(a,1),e.update(r,34963),i[t.id]=r,r}}}function zn(t,e,r,n){var i,a,o;this.setMode=function(t){i=t},this.setIndex=function(t){a=t.type,o=t.bytesPerElement},this.render=function(e,n){t.drawElements(i,n,a,e*o),r.update(n,i)},this.renderInstances=function(s,c,h){var l;if(n.isWebGL2)l=t;else if(null===(l=e.get("ANGLE_instanced_arrays")))return void console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");l[n.isWebGL2?"drawElementsInstanced":"drawElementsInstancedANGLE"](i,h,a,c*o,s.maxInstancedCount),r.update(h,i,s.maxInstancedCount)}}function Un(t){var e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.frame++,e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,r,n){switch(n=n||1,e.calls++,r){case 4:e.triangles+=n*(t/3);break;case 5:case 6:e.triangles+=n*(t-2);break;case 1:e.lines+=n*(t/2);break;case 3:e.lines+=n*(t-1);break;case 2:e.lines+=n*t;break;case 0:e.points+=n*t;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",r)}}}}function Gn(t,e){return Math.abs(e[1])-Math.abs(t[1])}function Fn(t){var e={},r=new Float32Array(8);return{update:function(n,i,a,o){var s=n.morphTargetInfluences,c=s.length,h=e[i.id];if(void 0===h){h=[];for(var l=0;l<c;l++)h[l]=[l,0];e[i.id]=h}var u=a.morphTargets&&i.morphAttributes.position,p=a.morphNormals&&i.morphAttributes.normal;for(l=0;l<c;l++)0!==(d=h[l])[1]&&(u&&i.removeAttribute("morphTarget"+l),p&&i.removeAttribute("morphNormal"+l));for(l=0;l<c;l++)(d=h[l])[0]=l,d[1]=s[l];for(h.sort(Gn),l=0;l<8;l++){var d;if(d=h[l]){var f=d[0],m=d[1];if(m){u&&i.addAttribute("morphTarget"+l,u[f]),p&&i.addAttribute("morphNormal"+l,p[f]),r[l]=m;continue}}r[l]=0}o.getUniforms().setValue(t,"morphTargetInfluences",r)}}}function Hn(t,e){var r={};return{update:function(n){var i=e.render.frame,a=n.geometry,o=t.get(n,a);return r[o.id]!==i&&(a.isGeometry&&o.updateFromObject(n),t.update(o),r[o.id]=i),o},dispose:function(){r={}}}}function Vn(t,e,r,n,i,a,o,s,c,h){t=void 0!==t?t:[],e=void 0!==e?e:wt,lr.call(this,t,e,r,n,i,a,o,s,c,h),this.flipY=!1}function jn(t,e,r,n){lr.call(this,null),this.image={data:t,width:e,height:r,depth:n},this.magFilter=Pt,this.minFilter=Pt,this.generateMipmaps=!1,this.flipY=!1}Sn.prototype=Object.assign(Object.create(n.prototype),{constructor:Sn,isMaterial:!0,onBeforeCompile:function(){},setValues:function(t){if(void 0!==t)for(var e in t){var r=t[e];if(void 0!==r)if("shading"!==e){var n=this[e];void 0!==n?n&&n.isColor?n.set(r):n&&n.isVector3&&r&&r.isVector3?n.copy(r):this[e]=r:console.warn("THREE."+this.type+": '"+e+"' is not a property of this material.")}else console.warn("THREE."+this.type+": .shading has been removed. Use the boolean .flatShading instead."),this.flatShading=r===C;else console.warn("THREE.Material: '"+e+"' parameter is undefined.")}},toJSON:function(t){var e=void 0===t||"string"==typeof t;e&&(t={textures:{},images:{}});var r={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};function n(t){var e=[];for(var r in t){var n=t[r];delete n.metadata,e.push(n)}return e}if(r.uuid=this.uuid,r.type=this.type,""!==this.name&&(r.name=this.name),this.color&&this.color.isColor&&(r.color=this.color.getHex()),void 0!==this.roughness&&(r.roughness=this.roughness),void 0!==this.metalness&&(r.metalness=this.metalness),this.emissive&&this.emissive.isColor&&(r.emissive=this.emissive.getHex()),1!==this.emissiveIntensity&&(r.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(r.specular=this.specular.getHex()),void 0!==this.shininess&&(r.shininess=this.shininess),void 0!==this.clearCoat&&(r.clearCoat=this.clearCoat),void 0!==this.clearCoatRoughness&&(r.clearCoatRoughness=this.clearCoatRoughness),this.map&&this.map.isTexture&&(r.map=this.map.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(r.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(r.lightMap=this.lightMap.toJSON(t).uuid),this.aoMap&&this.aoMap.isTexture&&(r.aoMap=this.aoMap.toJSON(t).uuid,r.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(r.bumpMap=this.bumpMap.toJSON(t).uuid,r.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(r.normalMap=this.normalMap.toJSON(t).uuid,r.normalMapType=this.normalMapType,r.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(r.displacementMap=this.displacementMap.toJSON(t).uuid,r.displacementScale=this.displacementScale,r.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(r.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(r.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(r.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(r.specularMap=this.specularMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(r.envMap=this.envMap.toJSON(t).uuid,r.reflectivity=this.reflectivity,void 0!==this.combine&&(r.combine=this.combine),void 0!==this.envMapIntensity&&(r.envMapIntensity=this.envMapIntensity)),this.gradientMap&&this.gradientMap.isTexture&&(r.gradientMap=this.gradientMap.toJSON(t).uuid),void 0!==this.size&&(r.size=this.size),void 0!==this.sizeAttenuation&&(r.sizeAttenuation=this.sizeAttenuation),this.blending!==B&&(r.blending=this.blending),!0===this.flatShading&&(r.flatShading=this.flatShading),this.side!==A&&(r.side=this.side),this.vertexColors!==O&&(r.vertexColors=this.vertexColors),this.opacity<1&&(r.opacity=this.opacity),!0===this.transparent&&(r.transparent=this.transparent),r.depthFunc=this.depthFunc,r.depthTest=this.depthTest,r.depthWrite=this.depthWrite,0!==this.rotation&&(r.rotation=this.rotation),!0===this.polygonOffset&&(r.polygonOffset=!0),0!==this.polygonOffsetFactor&&(r.polygonOffsetFactor=this.polygonOffsetFactor),0!==this.polygonOffsetUnits&&(r.polygonOffsetUnits=this.polygonOffsetUnits),1!==this.linewidth&&(r.linewidth=this.linewidth),void 0!==this.dashSize&&(r.dashSize=this.dashSize),void 0!==this.gapSize&&(r.gapSize=this.gapSize),void 0!==this.scale&&(r.scale=this.scale),!0===this.dithering&&(r.dithering=!0),this.alphaTest>0&&(r.alphaTest=this.alphaTest),!0===this.premultipliedAlpha&&(r.premultipliedAlpha=this.premultipliedAlpha),!0===this.wireframe&&(r.wireframe=this.wireframe),this.wireframeLinewidth>1&&(r.wireframeLinewidth=this.wireframeLinewidth),"round"!==this.wireframeLinecap&&(r.wireframeLinecap=this.wireframeLinecap),"round"!==this.wireframeLinejoin&&(r.wireframeLinejoin=this.wireframeLinejoin),!0===this.morphTargets&&(r.morphTargets=!0),!0===this.skinning&&(r.skinning=!0),!1===this.visible&&(r.visible=!1),"{}"!==JSON.stringify(this.userData)&&(r.userData=this.userData),e){var i=n(t.textures),a=n(t.images);i.length>0&&(r.textures=i),a.length>0&&(r.images=a)}return r},clone:function(){return(new this.constructor).copy(this)},copy:function(t){this.name=t.name,this.fog=t.fog,this.lights=t.lights,this.blending=t.blending,this.side=t.side,this.flatShading=t.flatShading,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.premultipliedAlpha=t.premultipliedAlpha,this.visible=t.visible,this.userData=JSON.parse(JSON.stringify(t.userData)),this.clipShadows=t.clipShadows,this.clipIntersection=t.clipIntersection;var e=t.clippingPlanes,r=null;if(null!==e){var n=e.length;r=new Array(n);for(var i=0;i!==n;++i)r[i]=e[i].clone()}return this.clippingPlanes=r,this.shadowSide=t.shadowSide,this},dispose:function(){this.dispatchEvent({type:"dispose"})}}),Tn.prototype=Object.create(Sn.prototype),Tn.prototype.constructor=Tn,Tn.prototype.isShaderMaterial=!0,Tn.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=wr(t.uniforms),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.lights=t.lights,this.clipping=t.clipping,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.morphNormals=t.morphNormals,this.extensions=t.extensions,this},Tn.prototype.toJSON=function(t){var e=Sn.prototype.toJSON.call(this,t);for(var r in e.uniforms={},this.uniforms){var n=this.uniforms[r].value;n&&n.isTexture?e.uniforms[r]={type:"t",value:n.toJSON(t).uuid}:n&&n.isColor?e.uniforms[r]={type:"c",value:n.getHex()}:n&&n.isVector2?e.uniforms[r]={type:"v2",value:n.toArray()}:n&&n.isVector3?e.uniforms[r]={type:"v3",value:n.toArray()}:n&&n.isVector4?e.uniforms[r]={type:"v4",value:n.toArray()}:n&&n.isMatrix3?e.uniforms[r]={type:"m3",value:n.toArray()}:n&&n.isMatrix4?e.uniforms[r]={type:"m4",value:n.toArray()}:e.uniforms[r]={value:n}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader;var i={};for(var a in this.extensions)!0===this.extensions[a]&&(i[a]=!0);return Object.keys(i).length>0&&(e.extensions=i),e},Object.assign(An.prototype,{set:function(t,e){return this.origin.copy(t),this.direction.copy(e),this},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this},at:function(t,e){return void 0===e&&(console.warn("THREE.Ray: .at() target is now required"),e=new er),e.copy(this.direction).multiplyScalar(t).add(this.origin)},lookAt:function(t){return this.direction.copy(t).sub(this.origin).normalize(),this},recast:function(){var t=new er;return function(e){return this.origin.copy(this.at(e,t)),this}}(),closestPointToPoint:function(t,e){void 0===e&&(console.warn("THREE.Ray: .closestPointToPoint() target is now required"),e=new er),e.subVectors(t,this.origin);var r=e.dot(this.direction);return r<0?e.copy(this.origin):e.copy(this.direction).multiplyScalar(r).add(this.origin)},distanceToPoint:function(t){return Math.sqrt(this.distanceSqToPoint(t))},distanceSqToPoint:function(){var t=new er;return function(e){var r=t.subVectors(e,this.origin).dot(this.direction);return r<0?this.origin.distanceToSquared(e):(t.copy(this.direction).multiplyScalar(r).add(this.origin),t.distanceToSquared(e))}}(),distanceSqToSegment:(dn=new er,fn=new er,mn=new er,function(t,e,r,n){dn.copy(t).add(e).multiplyScalar(.5),fn.copy(e).sub(t).normalize(),mn.copy(this.origin).sub(dn);var i,a,o,s,c=.5*t.distanceTo(e),h=-this.direction.dot(fn),l=mn.dot(this.direction),u=-mn.dot(fn),p=mn.lengthSq(),d=Math.abs(1-h*h);if(d>0)if(a=h*l-u,s=c*d,(i=h*u-l)>=0)if(a>=-s)if(a<=s){var f=1/d;o=(i*=f)*(i+h*(a*=f)+2*l)+a*(h*i+a+2*u)+p}else a=c,o=-(i=Math.max(0,-(h*a+l)))*i+a*(a+2*u)+p;else a=-c,o=-(i=Math.max(0,-(h*a+l)))*i+a*(a+2*u)+p;else a<=-s?o=-(i=Math.max(0,-(-h*c+l)))*i+(a=i>0?-c:Math.min(Math.max(-c,-u),c))*(a+2*u)+p:a<=s?(i=0,o=(a=Math.min(Math.max(-c,-u),c))*(a+2*u)+p):o=-(i=Math.max(0,-(h*c+l)))*i+(a=i>0?c:Math.min(Math.max(-c,-u),c))*(a+2*u)+p;else a=h>0?-c:c,o=-(i=Math.max(0,-(h*a+l)))*i+a*(a+2*u)+p;return r&&r.copy(this.direction).multiplyScalar(i).add(this.origin),n&&n.copy(fn).multiplyScalar(a).add(dn),o}),intersectSphere:function(){var t=new er;return function(e,r){t.subVectors(e.center,this.origin);var n=t.dot(this.direction),i=t.dot(t)-n*n,a=e.radius*e.radius;if(i>a)return null;var o=Math.sqrt(a-i),s=n-o,c=n+o;return s<0&&c<0?null:s<0?this.at(c,r):this.at(s,r)}}(),intersectsSphere:function(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius},distanceToPlane:function(t){var e=t.normal.dot(this.direction);if(0===e)return 0===t.distanceToPoint(this.origin)?0:null;var r=-(this.origin.dot(t.normal)+t.constant)/e;return r>=0?r:null},intersectPlane:function(t,e){var r=this.distanceToPlane(t);return null===r?null:this.at(r,e)},intersectsPlane:function(t){var e=t.distanceToPoint(this.origin);return 0===e||t.normal.dot(this.direction)*e<0},intersectBox:function(t,e){var r,n,i,a,o,s,c=1/this.direction.x,h=1/this.direction.y,l=1/this.direction.z,u=this.origin;return c>=0?(r=(t.min.x-u.x)*c,n=(t.max.x-u.x)*c):(r=(t.max.x-u.x)*c,n=(t.min.x-u.x)*c),h>=0?(i=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(i=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),r>a||i>n?null:((i>r||r!=r)&&(r=i),(a<n||n!=n)&&(n=a),l>=0?(o=(t.min.z-u.z)*l,s=(t.max.z-u.z)*l):(o=(t.max.z-u.z)*l,s=(t.min.z-u.z)*l),r>s||o>n?null:((o>r||r!=r)&&(r=o),(s<n||n!=n)&&(n=s),n<0?null:this.at(r>=0?r:n,e)))},intersectsBox:(pn=new er,function(t){return null!==this.intersectBox(t,pn)}),intersectTriangle:function(){var t=new er,e=new er,r=new er,n=new er;return function(i,a,o,s,c){e.subVectors(a,i),r.subVectors(o,i),n.crossVectors(e,r);var h,l=this.direction.dot(n);if(l>0){if(s)return null;h=1}else{if(!(l<0))return null;h=-1,l=-l}t.subVectors(this.origin,i);var u=h*this.direction.dot(r.crossVectors(t,r));if(u<0)return null;var p=h*this.direction.dot(e.cross(t));if(p<0)return null;if(u+p>l)return null;var d=-h*t.dot(n);return d<0?null:this.at(d/l,c)}}(),applyMatrix4:function(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this},equals:function(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}}),Object.assign(Ln,{getNormal:(vn=new er,function(t,e,r,n){void 0===n&&(console.warn("THREE.Triangle: .getNormal() target is now required"),n=new er),n.subVectors(r,e),vn.subVectors(t,e),n.cross(vn);var i=n.lengthSq();return i>0?n.multiplyScalar(1/Math.sqrt(i)):n.set(0,0,0)}),getBarycoord:function(){var t=new er,e=new er,r=new er;return function(n,i,a,o,s){t.subVectors(o,i),e.subVectors(a,i),r.subVectors(n,i);var c=t.dot(t),h=t.dot(e),l=t.dot(r),u=e.dot(e),p=e.dot(r),d=c*u-h*h;if(void 0===s&&(console.warn("THREE.Triangle: .getBarycoord() target is now required"),s=new er),0===d)return s.set(-2,-1,-1);var f=1/d,m=(u*l-h*p)*f,g=(c*p-h*l)*f;return s.set(1-m-g,g,m)}}(),containsPoint:function(){var t=new er;return function(e,r,n,i){return Ln.getBarycoord(e,r,n,i,t),t.x>=0&&t.y>=0&&t.x+t.y<=1}}(),getUV:(gn=new er,function(t,e,r,n,i,a,o,s){return this.getBarycoord(t,e,r,n,gn),s.set(0,0),s.addScaledVector(i,gn.x),s.addScaledVector(a,gn.y),s.addScaledVector(o,gn.z),s})}),Object.assign(Ln.prototype,{set:function(t,e,r){return this.a.copy(t),this.b.copy(e),this.c.copy(r),this},setFromPointsAndIndices:function(t,e,r,n){return this.a.copy(t[e]),this.b.copy(t[r]),this.c.copy(t[n]),this},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this},getArea:function(){var t=new er,e=new er;return function(){return t.subVectors(this.c,this.b),e.subVectors(this.a,this.b),.5*t.cross(e).length()}}(),getMidpoint:function(t){return void 0===t&&(console.warn("THREE.Triangle: .getMidpoint() target is now required"),t=new er),t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)},getNormal:function(t){return Ln.getNormal(this.a,this.b,this.c,t)},getPlane:function(t){return void 0===t&&(console.warn("THREE.Triangle: .getPlane() target is now required"),t=new er),t.setFromCoplanarPoints(this.a,this.b,this.c)},getBarycoord:function(t,e){return Ln.getBarycoord(t,this.a,this.b,this.c,e)},containsPoint:function(t){return Ln.containsPoint(t,this.a,this.b,this.c)},getUV:function(t,e,r,n,i){return Ln.getUV(t,this.a,this.b,this.c,e,r,n,i)},intersectsBox:function(t){return t.intersectsTriangle(this)},closestPointToPoint:(yn=new er,xn=new er,bn=new er,wn=new er,_n=new er,Mn=new er,function(t,e){void 0===e&&(console.warn("THREE.Triangle: .closestPointToPoint() target is now required"),e=new er);var r,n,i=this.a,a=this.b,o=this.c;yn.subVectors(a,i),xn.subVectors(o,i),wn.subVectors(t,i);var s=yn.dot(wn),c=xn.dot(wn);if(s<=0&&c<=0)return e.copy(i);_n.subVectors(t,a);var h=yn.dot(_n),l=xn.dot(_n);if(h>=0&&l<=h)return e.copy(a);var u=s*l-h*c;if(u<=0&&s>=0&&h<=0)return r=s/(s-h),e.copy(i).addScaledVector(yn,r);Mn.subVectors(t,o);var p=yn.dot(Mn),d=xn.dot(Mn);if(d>=0&&p<=d)return e.copy(o);var f=p*c-s*d;if(f<=0&&c>=0&&d<=0)return n=c/(c-d),e.copy(i).addScaledVector(xn,n);var m=h*d-p*l;if(m<=0&&l-h>=0&&p-d>=0)return bn.subVectors(o,a),n=(l-h)/(l-h+(p-d)),e.copy(a).addScaledVector(bn,n);var g=1/(m+f+u);return r=f*g,n=u*g,e.copy(i).addScaledVector(yn,r).addScaledVector(xn,n)}),equals:function(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}),Rn.prototype=Object.create(Sn.prototype),Rn.prototype.constructor=Rn,Rn.prototype.isMeshBasicMaterial=!0,Rn.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this},Cn.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Cn,isMesh:!0,setDrawMode:function(t){this.drawMode=t},copy:function(t){return Vr.prototype.copy.call(this,t),this.drawMode=t.drawMode,void 0!==t.morphTargetInfluences&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),void 0!==t.morphTargetDictionary&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this},updateMorphTargets:function(){var t,e,r,n=this.geometry;if(n.isBufferGeometry){var i=n.morphAttributes,a=Object.keys(i);if(a.length>0){var o=i[a[0]];if(void 0!==o)for(this.morphTargetInfluences=[],this.morphTargetDictionary={},t=0,e=o.length;t<e;t++)r=o[t].name||String(t),this.morphTargetInfluences.push(0),this.morphTargetDictionary[r]=t}}else{var s=n.morphTargets;void 0!==s&&s.length>0&&console.error("THREE.Mesh.updateMorphTargets() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.")}},raycast:function(){var t=new $e,e=new An,r=new vr,n=new er,i=new er,a=new er,o=new er,s=new er,c=new er,h=new Ke,l=new Ke,u=new Ke,p=new er,d=new er;function f(t,e,r,n,i,a,o,s){if(null===(e.side===L?n.intersectTriangle(o,a,i,!0,s):n.intersectTriangle(i,a,o,e.side!==R,s)))return null;d.copy(s),d.applyMatrix4(t.matrixWorld);var c=r.ray.origin.distanceTo(d);return c<r.near||c>r.far?null:{distance:c,point:d.clone(),object:t}}function m(t,e,r,o,s,c,d,m,g){n.fromBufferAttribute(s,d),i.fromBufferAttribute(s,m),a.fromBufferAttribute(s,g);var v=f(t,e,r,o,n,i,a,p);if(v){c&&(h.fromBufferAttribute(c,d),l.fromBufferAttribute(c,m),u.fromBufferAttribute(c,g),v.uv=Ln.getUV(p,n,i,a,h,l,u,new Ke));var y=new Dr(d,m,g);Ln.getNormal(n,i,a,y.normal),v.face=y}return v}return function(d,g){var v,y=this.geometry,x=this.material,b=this.matrixWorld;if(void 0!==x&&(null===y.boundingSphere&&y.computeBoundingSphere(),r.copy(y.boundingSphere),r.applyMatrix4(b),!1!==d.ray.intersectsSphere(r)&&(t.getInverse(b),e.copy(d.ray).applyMatrix4(t),null===y.boundingBox||!1!==e.intersectsBox(y.boundingBox))))if(y.isBufferGeometry){var w,_,M,E,S,T,A,L,R,C=y.index,P=y.attributes.position,O=y.attributes.uv,I=y.groups,D=y.drawRange;if(null!==C)if(Array.isArray(x))for(E=0,T=I.length;E<T;E++)for(R=x[(L=I[E]).materialIndex],S=Math.max(L.start,D.start),A=Math.min(L.start+L.count,D.start+D.count);S<A;S+=3)w=C.getX(S),_=C.getX(S+1),M=C.getX(S+2),(v=m(this,R,d,e,P,O,w,_,M))&&(v.faceIndex=Math.floor(S/3),v.face.materialIndex=L.materialIndex,g.push(v));else for(E=Math.max(0,D.start),T=Math.min(C.count,D.start+D.count);E<T;E+=3)w=C.getX(E),_=C.getX(E+1),M=C.getX(E+2),(v=m(this,x,d,e,P,O,w,_,M))&&(v.faceIndex=Math.floor(E/3),g.push(v));else if(void 0!==P)if(Array.isArray(x))for(E=0,T=I.length;E<T;E++)for(R=x[(L=I[E]).materialIndex],S=Math.max(L.start,D.start),A=Math.min(L.start+L.count,D.start+D.count);S<A;S+=3)(v=m(this,R,d,e,P,O,w=S,_=S+1,M=S+2))&&(v.faceIndex=Math.floor(S/3),v.face.materialIndex=L.materialIndex,g.push(v));else for(E=Math.max(0,D.start),T=Math.min(P.count,D.start+D.count);E<T;E+=3)(v=m(this,x,d,e,P,O,w=E,_=E+1,M=E+2))&&(v.faceIndex=Math.floor(E/3),g.push(v))}else if(y.isGeometry){var N,B,z,U,G=Array.isArray(x),F=y.vertices,H=y.faces,V=y.faceVertexUvs[0];V.length>0&&(U=V);for(var j=0,k=H.length;j<k;j++){var W=H[j],q=G?x[W.materialIndex]:x;if(void 0!==q){if(N=F[W.a],B=F[W.b],z=F[W.c],!0===q.morphTargets){var X=y.morphTargets,Y=this.morphTargetInfluences;n.set(0,0,0),i.set(0,0,0),a.set(0,0,0);for(var J=0,Z=X.length;J<Z;J++){var Q=Y[J];if(0!==Q){var K=X[J].vertices;n.addScaledVector(o.subVectors(K[W.a],N),Q),i.addScaledVector(s.subVectors(K[W.b],B),Q),a.addScaledVector(c.subVectors(K[W.c],z),Q)}}n.add(N),i.add(B),a.add(z),N=n,B=i,z=a}if(v=f(this,q,d,e,N,B,z,p)){if(U&&U[j]){var $=U[j];h.copy($[0]),l.copy($[1]),u.copy($[2]),v.uv=Ln.getUV(p,N,B,z,h,l,u,new Ke)}v.face=W,v.faceIndex=j,g.push(v)}}}}}}(),clone:function(){return new this.constructor(this.geometry,this.material).copy(this)}}),Vn.prototype=Object.create(lr.prototype),Vn.prototype.constructor=Vn,Vn.prototype.isCubeTexture=!0,Object.defineProperty(Vn.prototype,"images",{get:function(){return this.image},set:function(t){this.image=t}}),jn.prototype=Object.create(lr.prototype),jn.prototype.constructor=jn,jn.prototype.isDataTexture3D=!0;var kn=new lr,Wn=new jn,qn=new Vn;function Xn(){this.seq=[],this.map={}}var Yn=[],Jn=[],Zn=new Float32Array(16),Qn=new Float32Array(9),Kn=new Float32Array(4);function $n(t,e,r){var n=t[0];if(n<=0||n>0)return t;var i=e*r,a=Yn[i];if(void 0===a&&(a=new Float32Array(i),Yn[i]=a),0!==e){n.toArray(a,0);for(var o=1,s=0;o!==e;++o)s+=r,t[o].toArray(a,s)}return a}function ti(t,e){if(t.length!==e.length)return!1;for(var r=0,n=t.length;r<n;r++)if(t[r]!==e[r])return!1;return!0}function ei(t,e){for(var r=0,n=e.length;r<n;r++)t[r]=e[r]}function ri(t,e){var r=Jn[e];void 0===r&&(r=new Int32Array(e),Jn[e]=r);for(var n=0;n!==e;++n)r[n]=t.allocTextureUnit();return r}function ni(t,e){var r=this.cache;r[0]!==e&&(t.uniform1f(this.addr,e),r[0]=e)}function ii(t,e){var r=this.cache;r[0]!==e&&(t.uniform1i(this.addr,e),r[0]=e)}function ai(t,e){var r=this.cache;if(void 0!==e.x)r[0]===e.x&&r[1]===e.y||(t.uniform2f(this.addr,e.x,e.y),r[0]=e.x,r[1]=e.y);else{if(ti(r,e))return;t.uniform2fv(this.addr,e),ei(r,e)}}function oi(t,e){var r=this.cache;if(void 0!==e.x)r[0]===e.x&&r[1]===e.y&&r[2]===e.z||(t.uniform3f(this.addr,e.x,e.y,e.z),r[0]=e.x,r[1]=e.y,r[2]=e.z);else if(void 0!==e.r)r[0]===e.r&&r[1]===e.g&&r[2]===e.b||(t.uniform3f(this.addr,e.r,e.g,e.b),r[0]=e.r,r[1]=e.g,r[2]=e.b);else{if(ti(r,e))return;t.uniform3fv(this.addr,e),ei(r,e)}}function si(t,e){var r=this.cache;if(void 0!==e.x)r[0]===e.x&&r[1]===e.y&&r[2]===e.z&&r[3]===e.w||(t.uniform4f(this.addr,e.x,e.y,e.z,e.w),r[0]=e.x,r[1]=e.y,r[2]=e.z,r[3]=e.w);else{if(ti(r,e))return;t.uniform4fv(this.addr,e),ei(r,e)}}function ci(t,e){var r=this.cache,n=e.elements;if(void 0===n){if(ti(r,e))return;t.uniformMatrix2fv(this.addr,!1,e),ei(r,e)}else{if(ti(r,n))return;Kn.set(n),t.uniformMatrix2fv(this.addr,!1,Kn),ei(r,n)}}function hi(t,e){var r=this.cache,n=e.elements;if(void 0===n){if(ti(r,e))return;t.uniformMatrix3fv(this.addr,!1,e),ei(r,e)}else{if(ti(r,n))return;Qn.set(n),t.uniformMatrix3fv(this.addr,!1,Qn),ei(r,n)}}function li(t,e){var r=this.cache,n=e.elements;if(void 0===n){if(ti(r,e))return;t.uniformMatrix4fv(this.addr,!1,e),ei(r,e)}else{if(ti(r,n))return;Zn.set(n),t.uniformMatrix4fv(this.addr,!1,Zn),ei(r,n)}}function ui(t,e,r){var n=this.cache,i=r.allocTextureUnit();n[0]!==i&&(t.uniform1i(this.addr,i),n[0]=i),r.setTexture2D(e||kn,i)}function pi(t,e,r){var n=this.cache,i=r.allocTextureUnit();n[0]!==i&&(t.uniform1i(this.addr,i),n[0]=i),r.setTexture3D(e||Wn,i)}function di(t,e,r){var n=this.cache,i=r.allocTextureUnit();n[0]!==i&&(t.uniform1i(this.addr,i),n[0]=i),r.setTextureCube(e||qn,i)}function fi(t,e){var r=this.cache;ti(r,e)||(t.uniform2iv(this.addr,e),ei(r,e))}function mi(t,e){var r=this.cache;ti(r,e)||(t.uniform3iv(this.addr,e),ei(r,e))}function gi(t,e){var r=this.cache;ti(r,e)||(t.uniform4iv(this.addr,e),ei(r,e))}function vi(t,e){var r=this.cache;ti(r,e)||(t.uniform1fv(this.addr,e),ei(r,e))}function yi(t,e){var r=this.cache;ti(r,e)||(t.uniform1iv(this.addr,e),ei(r,e))}function xi(t,e){var r=this.cache,n=$n(e,this.size,2);ti(r,n)||(t.uniform2fv(this.addr,n),this.updateCache(n))}function bi(t,e){var r=this.cache,n=$n(e,this.size,3);ti(r,n)||(t.uniform3fv(this.addr,n),this.updateCache(n))}function wi(t,e){var r=this.cache,n=$n(e,this.size,4);ti(r,n)||(t.uniform4fv(this.addr,n),this.updateCache(n))}function _i(t,e){var r=this.cache,n=$n(e,this.size,4);ti(r,n)||(t.uniformMatrix2fv(this.addr,!1,n),this.updateCache(n))}function Mi(t,e){var r=this.cache,n=$n(e,this.size,9);ti(r,n)||(t.uniformMatrix3fv(this.addr,!1,n),this.updateCache(n))}function Ei(t,e){var r=this.cache,n=$n(e,this.size,16);ti(r,n)||(t.uniformMatrix4fv(this.addr,!1,n),this.updateCache(n))}function Si(t,e,r){var n=this.cache,i=e.length,a=ri(r,i);!1===ti(n,a)&&(t.uniform1iv(this.addr,a),ei(n,a));for(var o=0;o!==i;++o)r.setTexture2D(e[o]||kn,a[o])}function Ti(t,e,r){var n=this.cache,i=e.length,a=ri(r,i);!1===ti(n,a)&&(t.uniform1iv(this.addr,a),ei(n,a));for(var o=0;o!==i;++o)r.setTextureCube(e[o]||qn,a[o])}function Ai(t,e,r){this.id=t,this.addr=r,this.cache=[],this.setValue=function(t){switch(t){case 5126:return ni;case 35664:return ai;case 35665:return oi;case 35666:return si;case 35674:return ci;case 35675:return hi;case 35676:return li;case 35678:case 36198:return ui;case 35679:return pi;case 35680:return di;case 5124:case 35670:return ii;case 35667:case 35671:return fi;case 35668:case 35672:return mi;case 35669:case 35673:return gi}}(e.type)}function Li(t,e,r){this.id=t,this.addr=r,this.cache=[],this.size=e.size,this.setValue=function(t){switch(t){case 5126:return vi;case 35664:return xi;case 35665:return bi;case 35666:return wi;case 35674:return _i;case 35675:return Mi;case 35676:return Ei;case 35678:return Si;case 35680:return Ti;case 5124:case 35670:return yi;case 35667:case 35671:return fi;case 35668:case 35672:return mi;case 35669:case 35673:return gi}}(e.type)}function Ri(t){this.id=t,Xn.call(this)}Li.prototype.updateCache=function(t){var e=this.cache;t instanceof Float32Array&&e.length!==t.length&&(this.cache=new Float32Array(t.length)),ei(e,t)},Ri.prototype.setValue=function(t,e,r){for(var n=this.seq,i=0,a=n.length;i!==a;++i){var o=n[i];o.setValue(t,e[o.id],r)}};var Ci=/([\w\d_]+)(\])?(\[|\.)?/g;function Pi(t,e){t.seq.push(e),t.map[e.id]=e}function Oi(t,e,r){var n=t.name,i=n.length;for(Ci.lastIndex=0;;){var a=Ci.exec(n),o=Ci.lastIndex,s=a[1],c="]"===a[2],h=a[3];if(c&&(s|=0),void 0===h||"["===h&&o+2===i){Pi(r,void 0===h?new Ai(s,t,e):new Li(s,t,e));break}var l=r.map[s];void 0===l&&Pi(r,l=new Ri(s)),r=l}}function Ii(t,e,r){Xn.call(this),this.renderer=r;for(var n=t.getProgramParameter(e,35718),i=0;i<n;++i){var a=t.getActiveUniform(e,i);Oi(a,t.getUniformLocation(e,a.name),this)}}function Di(t,e,r){var n=t.createShader(e);return t.shaderSource(n,r),t.compileShader(n),!1===t.getShaderParameter(n,35713)&&console.error("THREE.WebGLShader: Shader couldn't compile."),""!==t.getShaderInfoLog(n)&&console.warn("THREE.WebGLShader: gl.getShaderInfoLog()",35633===e?"vertex":"fragment",t.getShaderInfoLog(n),function(t){for(var e=t.split("\n"),r=0;r<e.length;r++)e[r]=r+1+": "+e[r];return e.join("\n")}(r)),n}Ii.prototype.setValue=function(t,e,r){var n=this.map[e];void 0!==n&&n.setValue(t,r,this.renderer)},Ii.prototype.setOptional=function(t,e,r){var n=e[r];void 0!==n&&this.setValue(t,r,n)},Ii.upload=function(t,e,r,n){for(var i=0,a=e.length;i!==a;++i){var o=e[i],s=r[o.id];!1!==s.needsUpdate&&o.setValue(t,s.value,n)}},Ii.seqWithValue=function(t,e){for(var r=[],n=0,i=t.length;n!==i;++n){var a=t[n];a.id in e&&r.push(a)}return r};var Ni=0;function Bi(t){switch(t){case Ge:return["Linear","( value )"];case Fe:return["sRGB","( value )"];case Ve:return["RGBE","( value )"];case ke:return["RGBM","( value, 7.0 )"];case We:return["RGBM","( value, 16.0 )"];case qe:return["RGBD","( value, 256.0 )"];case He:return["Gamma","( value, float( GAMMA_FACTOR ) )"];default:throw new Error("unsupported encoding: "+t)}}function zi(t,e){var r=Bi(e);return"vec4 "+t+"( vec4 value ) { return "+r[0]+"ToLinear"+r[1]+"; }"}function Ui(t,e){var r;switch(e){case mt:r="Linear";break;case gt:r="Reinhard";break;case vt:r="Uncharted2";break;case yt:r="OptimizedCineon";break;case xt:r="ACESFilmic";break;default:throw new Error("unsupported toneMapping: "+e)}return"vec3 "+t+"( vec3 color ) { return "+r+"ToneMapping( color ); }"}function Gi(t){return""!==t}function Fi(t,e){return t.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights)}function Hi(t,e){return t.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}function Vi(t){return t.replace(/^[ \t]*#include +<([\w\d./]+)>/gm,(function(t,e){var r=br[e];if(void 0===r)throw new Error("Can not resolve #include <"+e+">");return Vi(r)}))}function ji(t){return t.replace(/#pragma unroll_loop[\s]+?for \( int i \= (\d+)\; i < (\d+)\; i \+\+ \) \{([\s\S]+?)(?=\})\}/g,(function(t,e,r,n){for(var i="",a=parseInt(e);a<parseInt(r);a++)i+=n.replace(/\[ i \]/g,"[ "+a+" ]");return i}))}function ki(t,e,r,n,i,a,o){var s=t.context,c=n.defines,h=i.vertexShader,l=i.fragmentShader,u="SHADOWMAP_TYPE_BASIC";a.shadowMapType===S?u="SHADOWMAP_TYPE_PCF":a.shadowMapType===T&&(u="SHADOWMAP_TYPE_PCF_SOFT");var p="ENVMAP_TYPE_CUBE",d="ENVMAP_MODE_REFLECTION",f="ENVMAP_BLENDING_MULTIPLY";if(a.envMap){switch(n.envMap.mapping){case wt:case _t:p="ENVMAP_TYPE_CUBE";break;case Tt:case At:p="ENVMAP_TYPE_CUBE_UV";break;case Mt:case Et:p="ENVMAP_TYPE_EQUIREC";break;case St:p="ENVMAP_TYPE_SPHERE"}switch(n.envMap.mapping){case _t:case Et:d="ENVMAP_MODE_REFRACTION"}switch(n.combine){case ut:f="ENVMAP_BLENDING_MULTIPLY";break;case pt:f="ENVMAP_BLENDING_MIX";break;case dt:f="ENVMAP_BLENDING_ADD"}}var m,g,v,y,x=t.gammaFactor>0?t.gammaFactor:1,b=o.isWebGL2?"":function(t,e,r){return[(t=t||{}).derivatives||e.envMapCubeUV||e.bumpMap||e.normalMap&&!e.objectSpaceNormalMap||e.flatShading?"#extension GL_OES_standard_derivatives : enable":"",(t.fragDepth||e.logarithmicDepthBuffer)&&r.get("EXT_frag_depth")?"#extension GL_EXT_frag_depth : enable":"",t.drawBuffers&&r.get("WEBGL_draw_buffers")?"#extension GL_EXT_draw_buffers : require":"",(t.shaderTextureLOD||e.envMap)&&r.get("EXT_shader_texture_lod")?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Gi).join("\n")}(n.extensions,a,e),w=function(t){var e=[];for(var r in t){var n=t[r];!1!==n&&e.push("#define "+r+" "+n)}return e.join("\n")}(c),_=s.createProgram();if(n.isRawShaderMaterial?((m=[w].filter(Gi).join("\n")).length>0&&(m+="\n"),(g=[b,w].filter(Gi).join("\n")).length>0&&(g+="\n")):(m=["precision "+a.precision+" float;","precision "+a.precision+" int;","#define SHADER_NAME "+i.name,w,a.supportsVertexTextures?"#define VERTEX_TEXTURES":"","#define GAMMA_FACTOR "+x,"#define MAX_BONES "+a.maxBones,a.useFog&&a.fog?"#define USE_FOG":"",a.useFog&&a.fogExp?"#define FOG_EXP2":"",a.map?"#define USE_MAP":"",a.envMap?"#define USE_ENVMAP":"",a.envMap?"#define "+d:"",a.lightMap?"#define USE_LIGHTMAP":"",a.aoMap?"#define USE_AOMAP":"",a.emissiveMap?"#define USE_EMISSIVEMAP":"",a.bumpMap?"#define USE_BUMPMAP":"",a.normalMap?"#define USE_NORMALMAP":"",a.normalMap&&a.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",a.displacementMap&&a.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",a.specularMap?"#define USE_SPECULARMAP":"",a.roughnessMap?"#define USE_ROUGHNESSMAP":"",a.metalnessMap?"#define USE_METALNESSMAP":"",a.alphaMap?"#define USE_ALPHAMAP":"",a.vertexColors?"#define USE_COLOR":"",a.flatShading?"#define FLAT_SHADED":"",a.skinning?"#define USE_SKINNING":"",a.useVertexTexture?"#define BONE_TEXTURE":"",a.morphTargets?"#define USE_MORPHTARGETS":"",a.morphNormals&&!1===a.flatShading?"#define USE_MORPHNORMALS":"",a.doubleSided?"#define DOUBLE_SIDED":"",a.flipSided?"#define FLIP_SIDED":"",a.shadowMapEnabled?"#define USE_SHADOWMAP":"",a.shadowMapEnabled?"#define "+u:"",a.sizeAttenuation?"#define USE_SIZEATTENUATION":"",a.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",a.logarithmicDepthBuffer&&(o.isWebGL2||e.get("EXT_frag_depth"))?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_COLOR","\tattribute vec3 color;","#endif","#ifdef USE_MORPHTARGETS","\tattribute vec3 morphTarget0;","\tattribute vec3 morphTarget1;","\tattribute vec3 morphTarget2;","\tattribute vec3 morphTarget3;","\t#ifdef USE_MORPHNORMALS","\t\tattribute vec3 morphNormal0;","\t\tattribute vec3 morphNormal1;","\t\tattribute vec3 morphNormal2;","\t\tattribute vec3 morphNormal3;","\t#else","\t\tattribute vec3 morphTarget4;","\t\tattribute vec3 morphTarget5;","\t\tattribute vec3 morphTarget6;","\t\tattribute vec3 morphTarget7;","\t#endif","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif","\n"].filter(Gi).join("\n"),g=[b,"precision "+a.precision+" float;","precision "+a.precision+" int;","#define SHADER_NAME "+i.name,w,a.alphaTest?"#define ALPHATEST "+a.alphaTest+(a.alphaTest%1?"":".0"):"","#define GAMMA_FACTOR "+x,a.useFog&&a.fog?"#define USE_FOG":"",a.useFog&&a.fogExp?"#define FOG_EXP2":"",a.map?"#define USE_MAP":"",a.matcap?"#define USE_MATCAP":"",a.envMap?"#define USE_ENVMAP":"",a.envMap?"#define "+p:"",a.envMap?"#define "+d:"",a.envMap?"#define "+f:"",a.lightMap?"#define USE_LIGHTMAP":"",a.aoMap?"#define USE_AOMAP":"",a.emissiveMap?"#define USE_EMISSIVEMAP":"",a.bumpMap?"#define USE_BUMPMAP":"",a.normalMap?"#define USE_NORMALMAP":"",a.normalMap&&a.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",a.specularMap?"#define USE_SPECULARMAP":"",a.roughnessMap?"#define USE_ROUGHNESSMAP":"",a.metalnessMap?"#define USE_METALNESSMAP":"",a.alphaMap?"#define USE_ALPHAMAP":"",a.vertexColors?"#define USE_COLOR":"",a.gradientMap?"#define USE_GRADIENTMAP":"",a.flatShading?"#define FLAT_SHADED":"",a.doubleSided?"#define DOUBLE_SIDED":"",a.flipSided?"#define FLIP_SIDED":"",a.shadowMapEnabled?"#define USE_SHADOWMAP":"",a.shadowMapEnabled?"#define "+u:"",a.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",a.physicallyCorrectLights?"#define PHYSICALLY_CORRECT_LIGHTS":"",a.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",a.logarithmicDepthBuffer&&(o.isWebGL2||e.get("EXT_frag_depth"))?"#define USE_LOGDEPTHBUF_EXT":"",a.envMap&&(o.isWebGL2||e.get("EXT_shader_texture_lod"))?"#define TEXTURE_LOD_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;",a.toneMapping!==ft?"#define TONE_MAPPING":"",a.toneMapping!==ft?br.tonemapping_pars_fragment:"",a.toneMapping!==ft?Ui("toneMapping",a.toneMapping):"",a.dithering?"#define DITHERING":"",a.outputEncoding||a.mapEncoding||a.matcapEncoding||a.envMapEncoding||a.emissiveMapEncoding?br.encodings_pars_fragment:"",a.mapEncoding?zi("mapTexelToLinear",a.mapEncoding):"",a.matcapEncoding?zi("matcapTexelToLinear",a.matcapEncoding):"",a.envMapEncoding?zi("envMapTexelToLinear",a.envMapEncoding):"",a.emissiveMapEncoding?zi("emissiveMapTexelToLinear",a.emissiveMapEncoding):"",a.outputEncoding?("linearToOutputTexel",v=a.outputEncoding,y=Bi(v),"vec4 linearToOutputTexel( vec4 value ) { return LinearTo"+y[0]+y[1]+"; }"):"",a.depthPacking?"#define DEPTH_PACKING "+n.depthPacking:"","\n"].filter(Gi).join("\n")),h=Hi(h=Fi(h=Vi(h),a),a),l=Hi(l=Fi(l=Vi(l),a),a),h=ji(h),l=ji(l),o.isWebGL2&&!n.isRawShaderMaterial){var M=!1,E=/^\s*#version\s+300\s+es\s*\n/;n.isShaderMaterial&&null!==h.match(E)&&null!==l.match(E)&&(M=!0,h=h.replace(E,""),l=l.replace(E,"")),m=["#version 300 es\n","#define attribute in","#define varying out","#define texture2D texture"].join("\n")+"\n"+m,g=["#version 300 es\n","#define varying in",M?"":"out highp vec4 pc_fragColor;",M?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join("\n")+"\n"+g}var A=g+l,L=Di(s,35633,m+h),R=Di(s,35632,A);s.attachShader(_,L),s.attachShader(_,R),void 0!==n.index0AttributeName?s.bindAttribLocation(_,0,n.index0AttributeName):!0===a.morphTargets&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);var C,P,O=s.getProgramInfoLog(_).trim(),I=s.getShaderInfoLog(L).trim(),D=s.getShaderInfoLog(R).trim(),N=!0,B=!0;return!1===s.getProgramParameter(_,35714)?(N=!1,console.error("THREE.WebGLProgram: shader error: ",s.getError(),"35715",s.getProgramParameter(_,35715),"gl.getProgramInfoLog",O,I,D)):""!==O?console.warn("THREE.WebGLProgram: gl.getProgramInfoLog()",O):""!==I&&""!==D||(B=!1),B&&(this.diagnostics={runnable:N,material:n,programLog:O,vertexShader:{log:I,prefix:m},fragmentShader:{log:D,prefix:g}}),s.deleteShader(L),s.deleteShader(R),this.getUniforms=function(){return void 0===C&&(C=new Ii(s,_,t)),C},this.getAttributes=function(){return void 0===P&&(P=function(t,e){for(var r={},n=t.getProgramParameter(e,35721),i=0;i<n;i++){var a=t.getActiveAttrib(e,i).name;r[a]=t.getAttribLocation(e,a)}return r}(s,_)),P},this.destroy=function(){s.deleteProgram(_),this.program=void 0},Object.defineProperties(this,{uniforms:{get:function(){return console.warn("THREE.WebGLProgram: .uniforms is now .getUniforms()."),this.getUniforms()}},attributes:{get:function(){return console.warn("THREE.WebGLProgram: .attributes is now .getAttributes()."),this.getAttributes()}}}),this.name=i.name,this.id=Ni++,this.code=r,this.usedTimes=1,this.program=_,this.vertexShader=L,this.fragmentShader=R,this}function Wi(t,e,r){var n=[],i={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"phong",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"},a=["precision","supportsVertexTextures","map","mapEncoding","matcap","matcapEncoding","envMap","envMapMode","envMapEncoding","lightMap","aoMap","emissiveMap","emissiveMapEncoding","bumpMap","normalMap","objectSpaceNormalMap","displacementMap","specularMap","roughnessMap","metalnessMap","gradientMap","alphaMap","combine","vertexColors","fog","useFog","fogExp","flatShading","sizeAttenuation","logarithmicDepthBuffer","skinning","maxBones","useVertexTexture","morphTargets","morphNormals","maxMorphTargets","maxMorphNormals","premultipliedAlpha","numDirLights","numPointLights","numSpotLights","numHemiLights","numRectAreaLights","shadowMapEnabled","shadowMapType","toneMapping","physicallyCorrectLights","alphaTest","doubleSided","flipSided","numClippingPlanes","numClipIntersection","depthPacking","dithering"];function o(t,e){var r;return t?t.isTexture?r=t.encoding:t.isWebGLRenderTarget&&(console.warn("THREE.WebGLPrograms.getTextureEncodingFromMap: don't use render targets as textures. Use their .texture property instead."),r=t.texture.encoding):r=Ge,r===Ge&&e&&(r=He),r}this.getParameters=function(e,n,a,s,c,h,l){var u=i[e.type],p=l.isSkinnedMesh?function(t){var e=t.skeleton.bones;if(r.floatVertexTextures)return 1024;var n=r.maxVertexUniforms,i=Math.floor((n-20)/4),a=Math.min(i,e.length);return a<e.length?(console.warn("THREE.WebGLRenderer: Skeleton has "+e.length+" bones. This GPU supports "+a+"."),0):a}(l):0,d=r.precision;null!==e.precision&&(d=r.getMaxPrecision(e.precision))!==e.precision&&console.warn("THREE.WebGLProgram.getParameters:",e.precision,"not supported, using",d,"instead.");var f=t.getRenderTarget();return{shaderID:u,precision:d,supportsVertexTextures:r.vertexTextures,outputEncoding:o(f?f.texture:null,t.gammaOutput),map:!!e.map,mapEncoding:o(e.map,t.gammaInput),matcap:!!e.matcap,matcapEncoding:o(e.matcap,t.gammaInput),envMap:!!e.envMap,envMapMode:e.envMap&&e.envMap.mapping,envMapEncoding:o(e.envMap,t.gammaInput),envMapCubeUV:!!e.envMap&&(e.envMap.mapping===Tt||e.envMap.mapping===At),lightMap:!!e.lightMap,aoMap:!!e.aoMap,emissiveMap:!!e.emissiveMap,emissiveMapEncoding:o(e.emissiveMap,t.gammaInput),bumpMap:!!e.bumpMap,normalMap:!!e.normalMap,objectSpaceNormalMap:e.normalMapType===Ze,displacementMap:!!e.displacementMap,roughnessMap:!!e.roughnessMap,metalnessMap:!!e.metalnessMap,specularMap:!!e.specularMap,alphaMap:!!e.alphaMap,gradientMap:!!e.gradientMap,combine:e.combine,vertexColors:e.vertexColors,fog:!!s,useFog:e.fog,fogExp:s&&s.isFogExp2,flatShading:e.flatShading,sizeAttenuation:e.sizeAttenuation,logarithmicDepthBuffer:r.logarithmicDepthBuffer,skinning:e.skinning&&p>0,maxBones:p,useVertexTexture:r.floatVertexTextures,morphTargets:e.morphTargets,morphNormals:e.morphNormals,maxMorphTargets:t.maxMorphTargets,maxMorphNormals:t.maxMorphNormals,numDirLights:n.directional.length,numPointLights:n.point.length,numSpotLights:n.spot.length,numRectAreaLights:n.rectArea.length,numHemiLights:n.hemi.length,numClippingPlanes:c,numClipIntersection:h,dithering:e.dithering,shadowMapEnabled:t.shadowMap.enabled&&l.receiveShadow&&a.length>0,shadowMapType:t.shadowMap.type,toneMapping:t.toneMapping,physicallyCorrectLights:t.physicallyCorrectLights,premultipliedAlpha:e.premultipliedAlpha,alphaTest:e.alphaTest,doubleSided:e.side===R,flipSided:e.side===L,depthPacking:void 0!==e.depthPacking&&e.depthPacking}},this.getProgramCode=function(e,r){var n=[];if(r.shaderID?n.push(r.shaderID):(n.push(e.fragmentShader),n.push(e.vertexShader)),void 0!==e.defines)for(var i in e.defines)n.push(i),n.push(e.defines[i]);for(var o=0;o<a.length;o++)n.push(r[a[o]]);return n.push(e.onBeforeCompile.toString()),n.push(t.gammaOutput),n.push(t.gammaFactor),n.join()},this.acquireProgram=function(i,a,o,s){for(var c,h=0,l=n.length;h<l;h++){var u=n[h];if(u.code===s){++(c=u).usedTimes;break}}return void 0===c&&(c=new ki(t,e,s,i,a,o,r),n.push(c)),c},this.releaseProgram=function(t){if(0==--t.usedTimes){var e=n.indexOf(t);n[e]=n[n.length-1],n.pop(),t.destroy()}},this.programs=n}function qi(){var t=new WeakMap;return{get:function(e){var r=t.get(e);return void 0===r&&(r={},t.set(e,r)),r},remove:function(e){t.delete(e)},update:function(e,r,n){t.get(e)[r]=n},dispose:function(){t=new WeakMap}}}function Xi(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.program&&e.program&&t.program!==e.program?t.program.id-e.program.id:t.material.id!==e.material.id?t.material.id-e.material.id:t.z!==e.z?t.z-e.z:t.id-e.id}function Yi(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.z!==e.z?e.z-t.z:t.id-e.id}function Ji(){var t=[],e=0,r=[],n=[];function i(r,n,i,a,o,s){var c=t[e];return void 0===c?(c={id:r.id,object:r,geometry:n,material:i,program:i.program,groupOrder:a,renderOrder:r.renderOrder,z:o,group:s},t[e]=c):(c.id=r.id,c.object=r,c.geometry=n,c.material=i,c.program=i.program,c.groupOrder=a,c.renderOrder=r.renderOrder,c.z=o,c.group=s),e++,c}return{opaque:r,transparent:n,init:function(){e=0,r.length=0,n.length=0},push:function(t,e,a,o,s,c){var h=i(t,e,a,o,s,c);(!0===a.transparent?n:r).push(h)},unshift:function(t,e,a,o,s,c){var h=i(t,e,a,o,s,c);(!0===a.transparent?n:r).unshift(h)},sort:function(){r.length>1&&r.sort(Xi),n.length>1&&n.sort(Yi)}}}function Zi(){var t={};function e(r){var n=r.target;n.removeEventListener("dispose",e),delete t[n.id]}return{get:function(r,n){var i,a=t[r.id];return void 0===a?(i=new Ji,t[r.id]={},t[r.id][n.id]=i,r.addEventListener("dispose",e)):void 0===(i=a[n.id])&&(i=new Ji,a[n.id]=i),i},dispose:function(){t={}}}}function Qi(){var t={};return{get:function(e){if(void 0!==t[e.id])return t[e.id];var r;switch(e.type){case"DirectionalLight":r={direction:new er,color:new Lr,shadow:!1,shadowBias:0,shadowRadius:1,shadowMapSize:new Ke};break;case"SpotLight":r={position:new er,direction:new er,color:new Lr,distance:0,coneCos:0,penumbraCos:0,decay:0,shadow:!1,shadowBias:0,shadowRadius:1,shadowMapSize:new Ke};break;case"PointLight":r={position:new er,color:new Lr,distance:0,decay:0,shadow:!1,shadowBias:0,shadowRadius:1,shadowMapSize:new Ke,shadowCameraNear:1,shadowCameraFar:1e3};break;case"HemisphereLight":r={direction:new er,skyColor:new Lr,groundColor:new Lr};break;case"RectAreaLight":r={color:new Lr,position:new er,halfWidth:new er,halfHeight:new er}}return t[e.id]=r,r}}}var Ki=0;function $i(){var t=new Qi,e={id:Ki++,hash:{stateID:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,shadowsLength:-1},ambient:[0,0,0],directional:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotShadowMap:[],spotShadowMatrix:[],rectArea:[],point:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[]},r=new er,n=new $e,i=new $e;return{setup:function(a,o,s){for(var c=0,h=0,l=0,u=0,p=0,d=0,f=0,m=0,g=s.matrixWorldInverse,v=0,y=a.length;v<y;v++){var x=a[v],b=x.color,w=x.intensity,_=x.distance,M=x.shadow&&x.shadow.map?x.shadow.map.texture:null;if(x.isAmbientLight)c+=b.r*w,h+=b.g*w,l+=b.b*w;else if(x.isDirectionalLight){if((S=t.get(x)).color.copy(x.color).multiplyScalar(x.intensity),S.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(g),S.shadow=x.castShadow,x.castShadow){var E=x.shadow;S.shadowBias=E.bias,S.shadowRadius=E.radius,S.shadowMapSize=E.mapSize}e.directionalShadowMap[u]=M,e.directionalShadowMatrix[u]=x.shadow.matrix,e.directional[u]=S,u++}else if(x.isSpotLight)(S=t.get(x)).position.setFromMatrixPosition(x.matrixWorld),S.position.applyMatrix4(g),S.color.copy(b).multiplyScalar(w),S.distance=_,S.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(g),S.coneCos=Math.cos(x.angle),S.penumbraCos=Math.cos(x.angle*(1-x.penumbra)),S.decay=x.decay,S.shadow=x.castShadow,x.castShadow&&(E=x.shadow,S.shadowBias=E.bias,S.shadowRadius=E.radius,S.shadowMapSize=E.mapSize),e.spotShadowMap[d]=M,e.spotShadowMatrix[d]=x.shadow.matrix,e.spot[d]=S,d++;else if(x.isRectAreaLight)(S=t.get(x)).color.copy(b).multiplyScalar(w),S.position.setFromMatrixPosition(x.matrixWorld),S.position.applyMatrix4(g),i.identity(),n.copy(x.matrixWorld),n.premultiply(g),i.extractRotation(n),S.halfWidth.set(.5*x.width,0,0),S.halfHeight.set(0,.5*x.height,0),S.halfWidth.applyMatrix4(i),S.halfHeight.applyMatrix4(i),e.rectArea[f]=S,f++;else if(x.isPointLight)(S=t.get(x)).position.setFromMatrixPosition(x.matrixWorld),S.position.applyMatrix4(g),S.color.copy(x.color).multiplyScalar(x.intensity),S.distance=x.distance,S.decay=x.decay,S.shadow=x.castShadow,x.castShadow&&(E=x.shadow,S.shadowBias=E.bias,S.shadowRadius=E.radius,S.shadowMapSize=E.mapSize,S.shadowCameraNear=E.camera.near,S.shadowCameraFar=E.camera.far),e.pointShadowMap[p]=M,e.pointShadowMatrix[p]=x.shadow.matrix,e.point[p]=S,p++;else if(x.isHemisphereLight){var S;(S=t.get(x)).direction.setFromMatrixPosition(x.matrixWorld),S.direction.transformDirection(g),S.direction.normalize(),S.skyColor.copy(x.color).multiplyScalar(w),S.groundColor.copy(x.groundColor).multiplyScalar(w),e.hemi[m]=S,m++}}e.ambient[0]=c,e.ambient[1]=h,e.ambient[2]=l,e.directional.length=u,e.spot.length=d,e.rectArea.length=f,e.point.length=p,e.hemi.length=m,e.hash.stateID=e.id,e.hash.directionalLength=u,e.hash.pointLength=p,e.hash.spotLength=d,e.hash.rectAreaLength=f,e.hash.hemiLength=m,e.hash.shadowsLength=o.length},state:e}}function ta(){var t=new $i,e=[],r=[];return{init:function(){e.length=0,r.length=0},state:{lightsArray:e,shadowsArray:r,lights:t},setupLights:function(n){t.setup(e,r,n)},pushLight:function(t){e.push(t)},pushShadow:function(t){r.push(t)}}}function ea(){var t={};function e(r){var n=r.target;n.removeEventListener("dispose",e),delete t[n.id]}return{get:function(r,n){var i;return void 0===t[r.id]?(i=new ta,t[r.id]={},t[r.id][n.id]=i,r.addEventListener("dispose",e)):void 0===t[r.id][n.id]?(i=new ta,t[r.id][n.id]=i):i=t[r.id][n.id],i},dispose:function(){t={}}}}function ra(t){Sn.call(this),this.type="MeshDepthMaterial",this.depthPacking=Xe,this.skinning=!1,this.morphTargets=!1,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.setValues(t)}function na(t){Sn.call(this),this.type="MeshDistanceMaterial",this.referencePosition=new er,this.nearDistance=1,this.farDistance=1e3,this.skinning=!1,this.morphTargets=!1,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.fog=!1,this.lights=!1,this.setValues(t)}function ia(t,e,r){for(var n=new xr,i=new $e,a=new Ke,o=new Ke(r,r),s=new er,c=new er,h=1,l=2,u=1+(h|l),p=new Array(u),d=new Array(u),f={},m={0:L,1:A,2:R},g=[new er(1,0,0),new er(-1,0,0),new er(0,0,1),new er(0,0,-1),new er(0,1,0),new er(0,-1,0)],v=[new er(0,1,0),new er(0,1,0),new er(0,1,0),new er(0,1,0),new er(0,0,1),new er(0,0,-1)],y=[new ur,new ur,new ur,new ur,new ur,new ur],x=0;x!==u;++x){var b=0!=(x&h),w=0!=(x&l),_=new ra({depthPacking:Ye,morphTargets:b,skinning:w});p[x]=_;var M=new na({morphTargets:b,skinning:w});d[x]=M}var E=this;function T(e,r,n,i,a,o){var s=e.geometry,c=null,u=p,g=e.customDepthMaterial;if(n&&(u=d,g=e.customDistanceMaterial),g)c=g;else{var v=!1;r.morphTargets&&(s&&s.isBufferGeometry?v=s.morphAttributes&&s.morphAttributes.position&&s.morphAttributes.position.length>0:s&&s.isGeometry&&(v=s.morphTargets&&s.morphTargets.length>0)),e.isSkinnedMesh&&!1===r.skinning&&console.warn("THREE.WebGLShadowMap: THREE.SkinnedMesh with material.skinning set to false:",e);var y=e.isSkinnedMesh&&r.skinning,x=0;v&&(x|=h),y&&(x|=l),c=u[x]}if(t.localClippingEnabled&&!0===r.clipShadows&&0!==r.clippingPlanes.length){var b=c.uuid,w=r.uuid,_=f[b];void 0===_&&(_={},f[b]=_);var M=_[w];void 0===M&&(M=c.clone(),_[w]=M),c=M}return c.visible=r.visible,c.wireframe=r.wireframe,c.side=null!=r.shadowSide?r.shadowSide:m[r.side],c.clipShadows=r.clipShadows,c.clippingPlanes=r.clippingPlanes,c.clipIntersection=r.clipIntersection,c.wireframeLinewidth=r.wireframeLinewidth,c.linewidth=r.linewidth,n&&c.isMeshDistanceMaterial&&(c.referencePosition.copy(i),c.nearDistance=a,c.farDistance=o),c}function C(r,i,a,o){if(!1!==r.visible){if(r.layers.test(i.layers)&&(r.isMesh||r.isLine||r.isPoints)&&r.castShadow&&(!r.frustumCulled||n.intersectsObject(r))){r.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,r.matrixWorld);var s=e.update(r),h=r.material;if(Array.isArray(h))for(var l=s.groups,u=0,p=l.length;u<p;u++){var d=l[u],f=h[d.materialIndex];if(f&&f.visible){var m=T(r,f,o,c,a.near,a.far);t.renderBufferDirect(a,null,s,m,r,d)}}else h.visible&&(m=T(r,h,o,c,a.near,a.far),t.renderBufferDirect(a,null,s,m,r,null))}for(var g=r.children,v=0,y=g.length;v<y;v++)C(g[v],i,a,o)}}this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=S,this.render=function(e,r,h){if(!1!==E.enabled&&(!1!==E.autoUpdate||!1!==E.needsUpdate)&&0!==e.length){var l,u=t.state;u.setBlending(N),u.buffers.color.setClear(1,1,1,1),u.buffers.depth.setTest(!0),u.setScissorTest(!1);for(var p=0,d=e.length;p<d;p++){var f=e[p],m=f.shadow,x=f&&f.isPointLight;if(void 0!==m){var b=m.camera;if(a.copy(m.mapSize),a.min(o),x){var w=a.x,_=a.y;y[0].set(2*w,_,w,_),y[1].set(0,_,w,_),y[2].set(3*w,_,w,_),y[3].set(w,_,w,_),y[4].set(3*w,0,w,_),y[5].set(w,0,w,_),a.x*=4,a.y*=2}if(null===m.map){var M={minFilter:Pt,magFilter:Pt,format:Qt};m.map=new pr(a.x,a.y,M),m.map.texture.name=f.name+".shadowMap",b.updateProjectionMatrix()}m.isSpotLightShadow&&m.update(f);var S=m.map,T=m.matrix;c.setFromMatrixPosition(f.matrixWorld),b.position.copy(c),x?(l=6,T.makeTranslation(-c.x,-c.y,-c.z)):(l=1,s.setFromMatrixPosition(f.target.matrixWorld),b.lookAt(s),b.updateMatrixWorld(),T.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),T.multiply(b.projectionMatrix),T.multiply(b.matrixWorldInverse)),t.setRenderTarget(S),t.clear();for(var A=0;A<l;A++){if(x){s.copy(b.position),s.add(g[A]),b.up.copy(v[A]),b.lookAt(s),b.updateMatrixWorld();var L=y[A];u.viewport(L)}i.multiplyMatrices(b.projectionMatrix,b.matrixWorldInverse),n.setFromMatrix(i),C(r,h,b,x)}}else console.warn("THREE.WebGLShadowMap:",f,"has no shadow.")}E.needsUpdate=!1}}}function aa(t,e,r,n){var i=new function(){var e=!1,r=new ur,n=null,i=new ur(0,0,0,0);return{setMask:function(r){n===r||e||(t.colorMask(r,r,r,r),n=r)},setLocked:function(t){e=t},setClear:function(e,n,a,o,s){!0===s&&(e*=o,n*=o,a*=o),r.set(e,n,a,o),!1===i.equals(r)&&(t.clearColor(e,n,a,o),i.copy(r))},reset:function(){e=!1,n=null,i.set(-1,0,0,0)}}},a=new function(){var e=!1,r=null,n=null,i=null;return{setTest:function(t){t?Q(2929):K(2929)},setMask:function(n){r===n||e||(t.depthMask(n),r=n)},setFunc:function(e){if(n!==e){if(e)switch(e){case nt:t.depthFunc(512);break;case it:t.depthFunc(519);break;case at:t.depthFunc(513);break;case ot:t.depthFunc(515);break;case st:t.depthFunc(514);break;case ct:t.depthFunc(518);break;case ht:t.depthFunc(516);break;case lt:t.depthFunc(517);break;default:t.depthFunc(515)}else t.depthFunc(515);n=e}},setLocked:function(t){e=t},setClear:function(e){i!==e&&(t.clearDepth(e),i=e)},reset:function(){e=!1,r=null,n=null,i=null}}},o=new function(){var e=!1,r=null,n=null,i=null,a=null,o=null,s=null,c=null,h=null;return{setTest:function(t){t?Q(2960):K(2960)},setMask:function(n){r===n||e||(t.stencilMask(n),r=n)},setFunc:function(e,r,o){n===e&&i===r&&a===o||(t.stencilFunc(e,r,o),n=e,i=r,a=o)},setOp:function(e,r,n){o===e&&s===r&&c===n||(t.stencilOp(e,r,n),o=e,s=r,c=n)},setLocked:function(t){e=t},setClear:function(e){h!==e&&(t.clearStencil(e),h=e)},reset:function(){e=!1,r=null,n=null,i=null,a=null,o=null,s=null,c=null,h=null}}},s=t.getParameter(34921),c=new Uint8Array(s),h=new Uint8Array(s),l=new Uint8Array(s),u={},p=null,d=null,f=null,m=null,g=null,v=null,w=null,_=null,M=null,E=null,S=!1,T=null,A=null,C=null,P=null,O=null,I=t.getParameter(35661),D=!1,V=0,j=t.getParameter(7938);-1!==j.indexOf("WebGL")?(V=parseFloat(/^WebGL\ ([0-9])/.exec(j)[1]),D=V>=1):-1!==j.indexOf("OpenGL ES")&&(V=parseFloat(/^OpenGL\ ES\ ([0-9])/.exec(j)[1]),D=V>=2);var k=null,W={},q=new ur,X=new ur;function Y(e,r,n){var i=new Uint8Array(4),a=t.createTexture();t.bindTexture(e,a),t.texParameteri(e,10241,9728),t.texParameteri(e,10240,9728);for(var o=0;o<n;o++)t.texImage2D(r+o,0,6408,1,1,0,6408,5121,i);return a}var J={};function Z(r,i){c[r]=1,0===h[r]&&(t.enableVertexAttribArray(r),h[r]=1),l[r]!==i&&((n.isWebGL2?t:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](r,i),l[r]=i)}function Q(e){!0!==u[e]&&(t.enable(e),u[e]=!0)}function K(e){!1!==u[e]&&(t.disable(e),u[e]=!1)}function $(e,n,i,a,o,s,c,h){if(e!==N){if(f||(Q(3042),f=!0),e===F)o=o||n,s=s||i,c=c||a,n===g&&o===_||(t.blendEquationSeparate(r.convert(n),r.convert(o)),g=n,_=o),i===v&&a===w&&s===M&&c===E||(t.blendFuncSeparate(r.convert(i),r.convert(a),r.convert(s),r.convert(c)),v=i,w=a,M=s,E=c),m=e,S=null;else if(e!==m||h!==S){if(g===H&&_===H||(t.blendEquation(32774),g=H,_=H),h)switch(e){case B:t.blendFuncSeparate(1,771,1,771);break;case z:t.blendFunc(1,1);break;case U:t.blendFuncSeparate(0,0,769,771);break;case G:t.blendFuncSeparate(0,768,0,770);break;default:console.error("THREE.WebGLState: Invalid blending: ",e)}else switch(e){case B:t.blendFuncSeparate(770,771,1,771);break;case z:t.blendFunc(770,1);break;case U:t.blendFunc(0,769);break;case G:t.blendFunc(0,768);break;default:console.error("THREE.WebGLState: Invalid blending: ",e)}v=null,w=null,M=null,E=null,m=e,S=h}}else f&&(K(3042),f=!1)}function tt(e){T!==e&&(e?t.frontFace(2304):t.frontFace(2305),T=e)}function et(e){e!==y?(Q(2884),e!==A&&(e===x?t.cullFace(1029):e===b?t.cullFace(1028):t.cullFace(1032))):K(2884),A=e}function rt(e,r,n){e?(Q(32823),P===r&&O===n||(t.polygonOffset(r,n),P=r,O=n)):K(32823)}function ut(e){void 0===e&&(e=33984+I-1),k!==e&&(t.activeTexture(e),k=e)}return J[3553]=Y(3553,3553,1),J[34067]=Y(34067,34069,6),i.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Q(2929),a.setFunc(ot),tt(!1),et(x),Q(2884),$(N),{buffers:{color:i,depth:a,stencil:o},initAttributes:function(){for(var t=0,e=c.length;t<e;t++)c[t]=0},enableAttribute:function(t){Z(t,0)},enableAttributeAndDivisor:Z,disableUnusedAttributes:function(){for(var e=0,r=h.length;e!==r;++e)h[e]!==c[e]&&(t.disableVertexAttribArray(e),h[e]=0)},enable:Q,disable:K,getCompressedTextureFormats:function(){if(null===p&&(p=[],e.get("WEBGL_compressed_texture_pvrtc")||e.get("WEBGL_compressed_texture_s3tc")||e.get("WEBGL_compressed_texture_etc1")||e.get("WEBGL_compressed_texture_astc")))for(var r=t.getParameter(34467),n=0;n<r.length;n++)p.push(r[n]);return p},useProgram:function(e){return d!==e&&(t.useProgram(e),d=e,!0)},setBlending:$,setMaterial:function(t,e){t.side===R?K(2884):Q(2884);var r=t.side===L;e&&(r=!r),tt(r),t.blending===B&&!1===t.transparent?$(N):$(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.premultipliedAlpha),a.setFunc(t.depthFunc),a.setTest(t.depthTest),a.setMask(t.depthWrite),i.setMask(t.colorWrite),rt(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits)},setFlipSided:tt,setCullFace:et,setLineWidth:function(e){e!==C&&(D&&t.lineWidth(e),C=e)},setPolygonOffset:rt,setScissorTest:function(t){t?Q(3089):K(3089)},activeTexture:ut,bindTexture:function(e,r){null===k&&ut();var n=W[k];void 0===n&&(n={type:void 0,texture:void 0},W[k]=n),n.type===e&&n.texture===r||(t.bindTexture(e,r||J[e]),n.type=e,n.texture=r)},compressedTexImage2D:function(){try{t.compressedTexImage2D.apply(t,arguments)}catch(t){console.error("THREE.WebGLState:",t)}},texImage2D:function(){try{t.texImage2D.apply(t,arguments)}catch(t){console.error("THREE.WebGLState:",t)}},texImage3D:function(){try{t.texImage3D.apply(t,arguments)}catch(t){console.error("THREE.WebGLState:",t)}},scissor:function(e){!1===q.equals(e)&&(t.scissor(e.x,e.y,e.z,e.w),q.copy(e))},viewport:function(e){!1===X.equals(e)&&(t.viewport(e.x,e.y,e.z,e.w),X.copy(e))},reset:function(){for(var e=0;e<h.length;e++)1===h[e]&&(t.disableVertexAttribArray(e),h[e]=0);u={},p=null,k=null,W={},d=null,m=null,T=null,A=null,i.reset(),a.reset(),o.reset()}}}function oa(t,e,r,n,i,a,o){var s,c={};function h(t,e,r,n){var i=1;if((t.width>n||t.height>n)&&(i=n/Math.max(t.width,t.height)),i<1||!0===e){if(t instanceof HTMLImageElement||t instanceof HTMLCanvasElement||t instanceof ImageBitmap){void 0===s&&(s=document.createElementNS("http://www.w3.org/1999/xhtml","canvas"));var a=r?document.createElementNS("http://www.w3.org/1999/xhtml","canvas"):s,o=e?Qe.floorPowerOfTwo:Math.floor;return a.width=o(i*t.width),a.height=o(i*t.height),a.getContext("2d").drawImage(t,0,0,a.width,a.height),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+t.width+"x"+t.height+") to ("+a.width+"x"+a.height+")."),a}return"data"in t&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+t.width+"x"+t.height+")."),t}return t}function l(t){return Qe.isPowerOfTwo(t.width)&&Qe.isPowerOfTwo(t.height)}function u(t,e){return t.generateMipmaps&&e&&t.minFilter!==Pt&&t.minFilter!==Dt}function p(e,r,i,a){t.generateMipmap(e),n.get(r).__maxMipLevel=Math.log(Math.max(i,a))*Math.LOG2E}function d(t,r){if(!i.isWebGL2)return t;var n=t;return 6403===t&&(5126===r&&(n=33326),5131===r&&(n=33325),5121===r&&(n=33321)),6407===t&&(5126===r&&(n=34837),5131===r&&(n=34843),5121===r&&(n=32849)),6408===t&&(5126===r&&(n=34836),5131===r&&(n=34842),5121===r&&(n=32856)),33325===n||33326===n||34842===n||34836===n?e.get("EXT_color_buffer_float"):34843!==n&&34837!==n||console.warn("THREE.WebGLRenderer: Floating point textures with RGB format not supported. Please use RGBA instead."),n}function f(t){return t===Pt||t===Ot||t===It?9728:9729}function m(e){var r=e.target;r.removeEventListener("dispose",m),function(e){var r=n.get(e);if(e.image&&r.__image__webglTextureCube)t.deleteTexture(r.__image__webglTextureCube);else{if(void 0===r.__webglInit)return;t.deleteTexture(r.__webglTexture)}n.remove(e)}(r),r.isVideoTexture&&delete c[r.id],o.memory.textures--}function g(e){var r=e.target;r.removeEventListener("dispose",g),function(e){var r=n.get(e),i=n.get(e.texture);if(e){if(void 0!==i.__webglTexture&&t.deleteTexture(i.__webglTexture),e.depthTexture&&e.depthTexture.dispose(),e.isWebGLRenderTargetCube)for(var a=0;a<6;a++)t.deleteFramebuffer(r.__webglFramebuffer[a]),r.__webglDepthbuffer&&t.deleteRenderbuffer(r.__webglDepthbuffer[a]);else t.deleteFramebuffer(r.__webglFramebuffer),r.__webglDepthbuffer&&t.deleteRenderbuffer(r.__webglDepthbuffer);n.remove(e.texture),n.remove(e)}}(r),o.memory.textures--}function v(t,e){var i=n.get(t);if(t.isVideoTexture&&function(t){var e=t.id,r=o.render.frame;c[e]!==r&&(c[e]=r,t.update())}(t),t.version>0&&i.__version!==t.version){var a=t.image;if(void 0===a)console.warn("THREE.WebGLRenderer: Texture marked for update but image is undefined");else{if(!1!==a.complete)return void x(i,t,e);console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete")}}r.activeTexture(33984+e),r.bindTexture(3553,i.__webglTexture)}function y(r,o,s){var c;if(s?(t.texParameteri(r,10242,a.convert(o.wrapS)),t.texParameteri(r,10243,a.convert(o.wrapT)),t.texParameteri(r,10240,a.convert(o.magFilter)),t.texParameteri(r,10241,a.convert(o.minFilter))):(t.texParameteri(r,10242,33071),t.texParameteri(r,10243,33071),o.wrapS===Rt&&o.wrapT===Rt||console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),t.texParameteri(r,10240,f(o.magFilter)),t.texParameteri(r,10241,f(o.minFilter)),o.minFilter!==Pt&&o.minFilter!==Dt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),c=e.get("EXT_texture_filter_anisotropic")){if(o.type===jt&&null===e.get("OES_texture_float_linear"))return;if(o.type===kt&&null===(i.isWebGL2||e.get("OES_texture_half_float_linear")))return;(o.anisotropy>1||n.get(o).__currentAnisotropy)&&(t.texParameterf(r,c.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(o.anisotropy,i.getMaxAnisotropy())),n.get(o).__currentAnisotropy=o.anisotropy)}}function x(e,n,s){var c;c=n.isDataTexture3D?32879:3553,void 0===e.__webglInit&&(e.__webglInit=!0,n.addEventListener("dispose",m),e.__webglTexture=t.createTexture(),o.memory.textures++),r.activeTexture(33984+s),r.bindTexture(c,e.__webglTexture),t.pixelStorei(37440,n.flipY),t.pixelStorei(37441,n.premultiplyAlpha),t.pixelStorei(3317,n.unpackAlignment);var f=function(t){return!i.isWebGL2&&(t.wrapS!==Rt||t.wrapT!==Rt||t.minFilter!==Pt&&t.minFilter!==Dt)}(n)&&!1===l(n.image),g=h(n.image,f,!1,i.maxTextureSize),v=l(g)||i.isWebGL2,x=a.convert(n.format),b=a.convert(n.type),w=d(x,b);y(c,n,v);var _,M=n.mipmaps;if(n.isDepthTexture){if(w=6402,n.type===jt){if(!i.isWebGL2)throw new Error("Float Depth Texture only supported in WebGL2.0");w=36012}else i.isWebGL2&&(w=33189);n.format===ee&&6402===w&&n.type!==Ft&&n.type!==Vt&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),n.type=Ft,b=a.convert(n.type)),n.format===re&&(w=34041,n.type!==Yt&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),n.type=Yt,b=a.convert(n.type))),r.texImage2D(3553,0,w,g.width,g.height,0,x,b,null)}else if(n.isDataTexture)if(M.length>0&&v){for(var E=0,S=M.length;E<S;E++)_=M[E],r.texImage2D(3553,E,w,_.width,_.height,0,x,b,_.data);n.generateMipmaps=!1,e.__maxMipLevel=M.length-1}else r.texImage2D(3553,0,w,g.width,g.height,0,x,b,g.data),e.__maxMipLevel=0;else if(n.isCompressedTexture){for(E=0,S=M.length;E<S;E++)_=M[E],n.format!==Qt&&n.format!==Zt?r.getCompressedTextureFormats().indexOf(x)>-1?r.compressedTexImage2D(3553,E,w,_.width,_.height,0,_.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):r.texImage2D(3553,E,w,_.width,_.height,0,x,b,_.data);e.__maxMipLevel=M.length-1}else if(n.isDataTexture3D)r.texImage3D(32879,0,w,g.width,g.height,g.depth,0,x,b,g.data),e.__maxMipLevel=0;else if(M.length>0&&v){for(E=0,S=M.length;E<S;E++)_=M[E],r.texImage2D(3553,E,w,x,b,_);n.generateMipmaps=!1,e.__maxMipLevel=M.length-1}else r.texImage2D(3553,0,w,x,b,g),e.__maxMipLevel=0;u(n,v)&&p(3553,n,g.width,g.height),e.__version=n.version,n.onUpdate&&n.onUpdate(n)}function b(e,i,o,s){var c=a.convert(i.texture.format),h=a.convert(i.texture.type),l=d(c,h);r.texImage2D(s,0,l,i.width,i.height,0,c,h,null),t.bindFramebuffer(36160,e),t.framebufferTexture2D(36160,o,s,n.get(i.texture).__webglTexture,0),t.bindFramebuffer(36160,null)}function w(e,r,n){if(t.bindRenderbuffer(36161,e),r.depthBuffer&&!r.stencilBuffer){if(n){var i=_(r);t.renderbufferStorageMultisample(36161,i,33189,r.width,r.height)}else t.renderbufferStorage(36161,33189,r.width,r.height);t.framebufferRenderbuffer(36160,36096,36161,e)}else if(r.depthBuffer&&r.stencilBuffer)n?(i=_(r),t.renderbufferStorageMultisample(36161,i,34041,r.width,r.height)):t.renderbufferStorage(36161,34041,r.width,r.height),t.framebufferRenderbuffer(36160,33306,36161,e);else{var o=d(a.convert(r.texture.format),a.convert(r.texture.type));n?(i=_(r),t.renderbufferStorageMultisample(36161,i,o,r.width,r.height)):t.renderbufferStorage(36161,o,r.width,r.height)}t.bindRenderbuffer(36161,null)}function _(t){return i.isWebGL2&&t.isWebGLMultisampleRenderTarget?Math.min(i.maxSamples,t.samples):0}this.setTexture2D=v,this.setTexture3D=function(t,e){var i=n.get(t);t.version>0&&i.__version!==t.version?x(i,t,e):(r.activeTexture(33984+e),r.bindTexture(32879,i.__webglTexture))},this.setTextureCube=function(e,s){var c=n.get(e);if(6===e.image.length)if(e.version>0&&c.__version!==e.version){c.__image__webglTextureCube||(e.addEventListener("dispose",m),c.__image__webglTextureCube=t.createTexture(),o.memory.textures++),r.activeTexture(33984+s),r.bindTexture(34067,c.__image__webglTextureCube),t.pixelStorei(37440,e.flipY);for(var f=e&&e.isCompressedTexture,g=e.image[0]&&e.image[0].isDataTexture,v=[],x=0;x<6;x++)v[x]=f||g?g?e.image[x].image:e.image[x]:h(e.image[x],!1,!0,i.maxCubemapSize);var b=v[0],w=l(b)||i.isWebGL2,_=a.convert(e.format),M=a.convert(e.type),E=d(_,M);for(y(34067,e,w),x=0;x<6;x++)if(f)for(var S,T=v[x].mipmaps,A=0,L=T.length;A<L;A++)S=T[A],e.format!==Qt&&e.format!==Zt?r.getCompressedTextureFormats().indexOf(_)>-1?r.compressedTexImage2D(34069+x,A,E,S.width,S.height,0,S.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):r.texImage2D(34069+x,A,E,S.width,S.height,0,_,M,S.data);else g?r.texImage2D(34069+x,0,E,v[x].width,v[x].height,0,_,M,v[x].data):r.texImage2D(34069+x,0,E,_,M,v[x]);c.__maxMipLevel=f?T.length-1:0,u(e,w)&&p(34067,e,b.width,b.height),c.__version=e.version,e.onUpdate&&e.onUpdate(e)}else r.activeTexture(33984+s),r.bindTexture(34067,c.__image__webglTextureCube)},this.setTextureCubeDynamic=function(t,e){r.activeTexture(33984+e),r.bindTexture(34067,n.get(t).__webglTexture)},this.setupRenderTarget=function(e){var s=n.get(e),c=n.get(e.texture);e.addEventListener("dispose",g),c.__webglTexture=t.createTexture(),o.memory.textures++;var h=!0===e.isWebGLRenderTargetCube,f=!0===e.isWebGLMultisampleRenderTarget,m=l(e)||i.isWebGL2;if(h){s.__webglFramebuffer=[];for(var x=0;x<6;x++)s.__webglFramebuffer[x]=t.createFramebuffer()}else if(s.__webglFramebuffer=t.createFramebuffer(),f)if(i.isWebGL2){s.__webglMultisampledFramebuffer=t.createFramebuffer(),s.__webglColorRenderbuffer=t.createRenderbuffer(),t.bindRenderbuffer(36161,s.__webglColorRenderbuffer);var M=d(a.convert(e.texture.format),a.convert(e.texture.type)),E=_(e);t.renderbufferStorageMultisample(36161,E,M,e.width,e.height),t.bindFramebuffer(36160,s.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(36160,36064,36161,s.__webglColorRenderbuffer),t.bindRenderbuffer(36161,null),e.depthBuffer&&(s.__webglDepthRenderbuffer=t.createRenderbuffer(),w(s.__webglDepthRenderbuffer,e,!0)),t.bindFramebuffer(36160,null)}else console.warn("THREE.WebGLRenderer: WebGLMultisampleRenderTarget can only be used with WebGL2.");if(h){for(r.bindTexture(34067,c.__webglTexture),y(34067,e.texture,m),x=0;x<6;x++)b(s.__webglFramebuffer[x],e,36064,34069+x);u(e.texture,m)&&p(34067,e.texture,e.width,e.height),r.bindTexture(34067,null)}else r.bindTexture(3553,c.__webglTexture),y(3553,e.texture,m),b(s.__webglFramebuffer,e,36064,3553),u(e.texture,m)&&p(3553,e.texture,e.width,e.height),r.bindTexture(3553,null);e.depthBuffer&&function(e){var r=n.get(e),i=!0===e.isWebGLRenderTargetCube;if(e.depthTexture){if(i)throw new Error("target.depthTexture not supported in Cube render targets");!function(e,r){if(r&&r.isWebGLRenderTargetCube)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(36160,e),!r.depthTexture||!r.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");n.get(r.depthTexture).__webglTexture&&r.depthTexture.image.width===r.width&&r.depthTexture.image.height===r.height||(r.depthTexture.image.width=r.width,r.depthTexture.image.height=r.height,r.depthTexture.needsUpdate=!0),v(r.depthTexture,0);var i=n.get(r.depthTexture).__webglTexture;if(r.depthTexture.format===ee)t.framebufferTexture2D(36160,36096,3553,i,0);else{if(r.depthTexture.format!==re)throw new Error("Unknown depthTexture format");t.framebufferTexture2D(36160,33306,3553,i,0)}}(r.__webglFramebuffer,e)}else if(i){r.__webglDepthbuffer=[];for(var a=0;a<6;a++)t.bindFramebuffer(36160,r.__webglFramebuffer[a]),r.__webglDepthbuffer[a]=t.createRenderbuffer(),w(r.__webglDepthbuffer[a],e)}else t.bindFramebuffer(36160,r.__webglFramebuffer),r.__webglDepthbuffer=t.createRenderbuffer(),w(r.__webglDepthbuffer,e);t.bindFramebuffer(36160,null)}(e)},this.updateRenderTargetMipmap=function(t){var e=t.texture;if(u(e,l(t)||i.isWebGL2)){var a=t.isWebGLRenderTargetCube?34067:3553,o=n.get(e).__webglTexture;r.bindTexture(a,o),p(a,e,t.width,t.height),r.bindTexture(a,null)}},this.updateMultisampleRenderTarget=function(e){if(e.isWebGLMultisampleRenderTarget)if(i.isWebGL2){var r=n.get(e);t.bindFramebuffer(36008,r.__webglMultisampledFramebuffer),t.bindFramebuffer(36009,r.__webglFramebuffer);var a=e.width,o=e.height,s=16384;e.depthBuffer&&(s|=256),e.stencilBuffer&&(s|=1024),t.blitFramebuffer(0,0,a,o,0,0,a,o,s,9728)}else console.warn("THREE.WebGLRenderer: WebGLMultisampleRenderTarget can only be used with WebGL2.")}}function sa(t,e,r){return{convert:function(t){var n;if(t===Lt)return 10497;if(t===Rt)return 33071;if(t===Ct)return 33648;if(t===Pt)return 9728;if(t===Ot)return 9984;if(t===It)return 9986;if(t===Dt)return 9729;if(t===Nt)return 9985;if(t===Bt)return 9987;if(t===zt)return 5121;if(t===Wt)return 32819;if(t===qt)return 32820;if(t===Xt)return 33635;if(t===Ut)return 5120;if(t===Gt)return 5122;if(t===Ft)return 5123;if(t===Ht)return 5124;if(t===Vt)return 5125;if(t===jt)return 5126;if(t===kt){if(r.isWebGL2)return 5131;if(null!==(n=e.get("OES_texture_half_float")))return n.HALF_FLOAT_OES}if(t===Jt)return 6406;if(t===Zt)return 6407;if(t===Qt)return 6408;if(t===Kt)return 6409;if(t===$t)return 6410;if(t===ee)return 6402;if(t===re)return 34041;if(t===ne)return 6403;if(t===H)return 32774;if(t===V)return 32778;if(t===j)return 32779;if(t===q)return 0;if(t===X)return 1;if(t===Y)return 768;if(t===J)return 769;if(t===Z)return 770;if(t===Q)return 771;if(t===K)return 772;if(t===$)return 773;if(t===tt)return 774;if(t===et)return 775;if(t===rt)return 776;if((t===ie||t===ae||t===oe||t===se)&&null!==(n=e.get("WEBGL_compressed_texture_s3tc"))){if(t===ie)return n.COMPRESSED_RGB_S3TC_DXT1_EXT;if(t===ae)return n.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(t===oe)return n.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(t===se)return n.COMPRESSED_RGBA_S3TC_DXT5_EXT}if((t===ce||t===he||t===le||t===ue)&&null!==(n=e.get("WEBGL_compressed_texture_pvrtc"))){if(t===ce)return n.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(t===he)return n.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(t===le)return n.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(t===ue)return n.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(t===pe&&null!==(n=e.get("WEBGL_compressed_texture_etc1")))return n.COMPRESSED_RGB_ETC1_WEBGL;if((t===de||t===fe||t===me||t===ge||t===ve||t===ye||t===xe||t===be||t===we||t===_e||t===Me||t===Ee||t===Se||t===Te)&&null!==(n=e.get("WEBGL_compressed_texture_astc")))return t;if(t===k||t===W){if(r.isWebGL2){if(t===k)return 32775;if(t===W)return 32776}if(null!==(n=e.get("EXT_blend_minmax"))){if(t===k)return n.MIN_EXT;if(t===W)return n.MAX_EXT}}if(t===Yt){if(r.isWebGL2)return 34042;if(null!==(n=e.get("WEBGL_depth_texture")))return n.UNSIGNED_INT_24_8_WEBGL}return 0}}}function ca(){Vr.call(this),this.type="Group"}function ha(){Vr.call(this),this.type="Camera",this.matrixWorldInverse=new $e,this.projectionMatrix=new $e,this.projectionMatrixInverse=new $e}function la(t,e,r,n){ha.call(this),this.type="PerspectiveCamera",this.fov=void 0!==t?t:50,this.zoom=1,this.near=void 0!==r?r:.1,this.far=void 0!==n?n:2e3,this.focus=10,this.aspect=void 0!==e?e:1,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}function ua(t){la.call(this),this.cameras=t||[]}ra.prototype=Object.create(Sn.prototype),ra.prototype.constructor=ra,ra.prototype.isMeshDepthMaterial=!0,ra.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.depthPacking=t.depthPacking,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this},na.prototype=Object.create(Sn.prototype),na.prototype.constructor=na,na.prototype.isMeshDistanceMaterial=!0,na.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.referencePosition.copy(t.referencePosition),this.nearDistance=t.nearDistance,this.farDistance=t.farDistance,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this},ca.prototype=Object.assign(Object.create(Vr.prototype),{constructor:ca,isGroup:!0}),ha.prototype=Object.assign(Object.create(Vr.prototype),{constructor:ha,isCamera:!0,copy:function(t,e){return Vr.prototype.copy.call(this,t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this},getWorldDirection:function(t){void 0===t&&(console.warn("THREE.Camera: .getWorldDirection() target is now required"),t=new er),this.updateMatrixWorld(!0);var e=this.matrixWorld.elements;return t.set(-e[8],-e[9],-e[10]).normalize()},updateMatrixWorld:function(t){Vr.prototype.updateMatrixWorld.call(this,t),this.matrixWorldInverse.getInverse(this.matrixWorld)},clone:function(){return(new this.constructor).copy(this)}}),la.prototype=Object.assign(Object.create(ha.prototype),{constructor:la,isPerspectiveCamera:!0,copy:function(t,e){return ha.prototype.copy.call(this,t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=null===t.view?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this},setFocalLength:function(t){var e=.5*this.getFilmHeight()/t;this.fov=2*Qe.RAD2DEG*Math.atan(e),this.updateProjectionMatrix()},getFocalLength:function(){var t=Math.tan(.5*Qe.DEG2RAD*this.fov);return.5*this.getFilmHeight()/t},getEffectiveFOV:function(){return 2*Qe.RAD2DEG*Math.atan(Math.tan(.5*Qe.DEG2RAD*this.fov)/this.zoom)},getFilmWidth:function(){return this.filmGauge*Math.min(this.aspect,1)},getFilmHeight:function(){return this.filmGauge/Math.max(this.aspect,1)},setViewOffset:function(t,e,r,n,i,a){this.aspect=t/e,null===this.view&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()},clearViewOffset:function(){null!==this.view&&(this.view.enabled=!1),this.updateProjectionMatrix()},updateProjectionMatrix:function(){var t=this.near,e=t*Math.tan(.5*Qe.DEG2RAD*this.fov)/this.zoom,r=2*e,n=this.aspect*r,i=-.5*n,a=this.view;if(null!==this.view&&this.view.enabled){var o=a.fullWidth,s=a.fullHeight;i+=a.offsetX*n/o,e-=a.offsetY*r/s,n*=a.width/o,r*=a.height/s}var c=this.filmOffset;0!==c&&(i+=t*c/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+n,e,e-r,t,this.far),this.projectionMatrixInverse.getInverse(this.projectionMatrix)},toJSON:function(t){var e=Vr.prototype.toJSON.call(this,t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,null!==this.view&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}),ua.prototype=Object.assign(Object.create(la.prototype),{constructor:ua,isArrayCamera:!0});var pa,da,fa,ma,ga,va,ya=new er,xa=new er;function ba(t,e,r){ya.setFromMatrixPosition(e.matrixWorld),xa.setFromMatrixPosition(r.matrixWorld);var n=ya.distanceTo(xa),i=e.projectionMatrix.elements,a=r.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],h=(i[9]-1)/i[5],l=(i[8]-1)/i[0],u=(a[8]+1)/a[0],p=o*l,d=o*u,f=n/(-l+u),m=f*-l;e.matrixWorld.decompose(t.position,t.quaternion,t.scale),t.translateX(m),t.translateZ(f),t.matrixWorld.compose(t.position,t.quaternion,t.scale),t.matrixWorldInverse.getInverse(t.matrixWorld);var g=o+f,v=s+f,y=p-m,x=d+(n-m),b=c*s/v*g,w=h*s/v*g;t.projectionMatrix.makePerspective(y,x,b,w,g,v)}function wa(t){var e=this,r=null,n=null,i=null,a=[],o=new $e,s=new $e,c=1,h="stage";"undefined"!=typeof window&&"VRFrameData"in window&&(n=new window.VRFrameData,window.addEventListener("vrdisplaypresentchange",x,!1));var l=new $e,u=new tr,p=new er,d=new la;d.bounds=new ur(0,0,.5,1),d.layers.enable(1);var f=new la;f.bounds=new ur(.5,0,.5,1),f.layers.enable(2);var m,g,v=new ua([d,f]);function y(){return null!==r&&!0===r.isPresenting}function x(){if(y()){var n=r.getEyeParameters("left"),i=n.renderWidth*c,a=n.renderHeight*c;g=t.getPixelRatio(),m=t.getSize(),t.setDrawingBufferSize(2*i,a,1),_.start()}else e.enabled&&t.setDrawingBufferSize(m.width,m.height,g),_.stop()}v.layers.enable(1),v.layers.enable(2);var b=[];function w(t){for(var e=navigator.getGamepads&&navigator.getGamepads(),r=0,n=0,i=e.length;r<i;r++){var a=e[r];if(a&&("Daydream Controller"===a.id||"Gear VR Controller"===a.id||"Oculus Go Controller"===a.id||"OpenVR Gamepad"===a.id||a.id.startsWith("Oculus Touch")||a.id.startsWith("Spatial Controller"))){if(n===t)return a;n++}}}this.enabled=!1,this.getController=function(t){var e=a[t];return void 0===e&&((e=new ca).matrixAutoUpdate=!1,e.visible=!1,a[t]=e),e},this.getDevice=function(){return r},this.setDevice=function(t){void 0!==t&&(r=t),_.setContext(t)},this.setFramebufferScaleFactor=function(t){c=t},this.setFrameOfReferenceType=function(t){h=t},this.setPoseTarget=function(t){void 0!==t&&(i=t)},this.getCamera=function(t){var e="stage"===h?1.6:0;if(null===r)return t.position.set(0,e,0),t;if(r.depthNear=t.near,r.depthFar=t.far,r.getFrameData(n),"stage"===h){var c=r.stageParameters;c?o.fromArray(c.sittingToStandingTransform):o.makeTranslation(0,e,0)}var m=n.pose,g=null!==i?i:t;if(g.matrix.copy(o),g.matrix.decompose(g.position,g.quaternion,g.scale),null!==m.orientation&&(u.fromArray(m.orientation),g.quaternion.multiply(u)),null!==m.position&&(u.setFromRotationMatrix(o),p.fromArray(m.position),p.applyQuaternion(u),g.position.add(p)),g.updateMatrixWorld(),!1===r.isPresenting)return t;d.near=t.near,f.near=t.near,d.far=t.far,f.far=t.far,d.matrixWorldInverse.fromArray(n.leftViewMatrix),f.matrixWorldInverse.fromArray(n.rightViewMatrix),s.getInverse(o),"stage"===h&&(d.matrixWorldInverse.multiply(s),f.matrixWorldInverse.multiply(s));var y=g.parent;null!==y&&(l.getInverse(y.matrixWorld),d.matrixWorldInverse.multiply(l),f.matrixWorldInverse.multiply(l)),d.matrixWorld.getInverse(d.matrixWorldInverse),f.matrixWorld.getInverse(f.matrixWorldInverse),d.projectionMatrix.fromArray(n.leftProjectionMatrix),f.projectionMatrix.fromArray(n.rightProjectionMatrix),ba(v,d,f);var x=r.getLayers();if(x.length){var _=x[0];null!==_.leftBounds&&4===_.leftBounds.length&&d.bounds.fromArray(_.leftBounds),null!==_.rightBounds&&4===_.rightBounds.length&&f.bounds.fromArray(_.rightBounds)}return function(){for(var t=0;t<a.length;t++){var e=a[t],r=w(t);if(void 0!==r&&void 0!==r.pose){if(null===r.pose)return;var n=r.pose;!1===n.hasPosition&&e.position.set(.2,-.6,-.05),null!==n.position&&e.position.fromArray(n.position),null!==n.orientation&&e.quaternion.fromArray(n.orientation),e.matrix.compose(e.position,e.quaternion,e.scale),e.matrix.premultiply(o),e.matrix.decompose(e.position,e.quaternion,e.scale),e.matrixWorldNeedsUpdate=!0,e.visible=!0;var i="Daydream Controller"===r.id?0:1;b[t]!==r.buttons[i].pressed&&(b[t]=r.buttons[i].pressed,!0===b[t]?e.dispatchEvent({type:"selectstart"}):(e.dispatchEvent({type:"selectend"}),e.dispatchEvent({type:"select"})))}else e.visible=!1}}(),v},this.getStandingMatrix=function(){return o},this.isPresenting=y;var _=new Or;this.setAnimationLoop=function(t){_.setAnimationLoop(t)},this.submitFrame=function(){y()&&r.submitFrame()},this.dispose=function(){"undefined"!=typeof window&&window.removeEventListener("vrdisplaypresentchange",x)}}function _a(t){var e=t.context,r=null,n=null,i=1,a=null,o="stage",s=null,c=[],h=[];function l(){return null!==n&&null!==a}var u=new la;u.layers.enable(1),u.viewport=new ur;var p=new la;p.layers.enable(2),p.viewport=new ur;var d=new ua([u,p]);function f(t){var e=c[h.indexOf(t.inputSource)];e&&e.dispatchEvent({type:t.type})}function m(){t.setFramebuffer(null),y.stop()}function g(t,e){null===e?t.matrixWorld.copy(t.matrix):t.matrixWorld.multiplyMatrices(e.matrixWorld,t.matrix),t.matrixWorldInverse.getInverse(t.matrixWorld)}d.layers.enable(1),d.layers.enable(2),this.enabled=!1,this.getController=function(t){var e=c[t];return void 0===e&&((e=new ca).matrixAutoUpdate=!1,e.visible=!1,c[t]=e),e},this.getDevice=function(){return r},this.setDevice=function(t){void 0!==t&&(r=t),t instanceof XRDevice&&e.setCompatibleXRDevice(t)},this.setFramebufferScaleFactor=function(t){i=t},this.setFrameOfReferenceType=function(t){o=t},this.setSession=function(r){null!==(n=r)&&(n.addEventListener("select",f),n.addEventListener("selectstart",f),n.addEventListener("selectend",f),n.addEventListener("end",m),n.baseLayer=new XRWebGLLayer(n,e,{framebufferScaleFactor:i}),n.requestFrameOfReference(o).then((function(e){a=e,t.setFramebuffer(n.baseLayer.framebuffer),y.setContext(n),y.start()})),h=n.getInputSources(),n.addEventListener("inputsourceschange",(function(){h=n.getInputSources(),console.log(h);for(var t=0;t<c.length;t++)c[t].userData.inputSource=h[t]})))},this.getCamera=function(t){if(l()){var e=t.parent,r=d.cameras;g(d,e);for(var n=0;n<r.length;n++)g(r[n],e);t.matrixWorld.copy(d.matrixWorld);for(var i=t.children,a=(n=0,i.length);n<a;n++)i[n].updateMatrixWorld(!0);return ba(d,u,p),d}return t},this.isPresenting=l;var v=null,y=new Or;y.setAnimationLoop((function(t,e){if(null!==(s=e.getDevicePose(a)))for(var r=n.baseLayer,i=e.views,o=0;o<i.length;o++){var l=i[o],u=r.getViewport(l),p=s.getViewMatrix(l),f=d.cameras[o];f.matrix.fromArray(p).getInverse(f.matrix),f.projectionMatrix.fromArray(l.projectionMatrix),f.viewport.set(u.x,u.y,u.width,u.height),0===o&&d.matrix.copy(f.matrix)}for(o=0;o<c.length;o++){var m=c[o],g=h[o];if(g){var y=e.getInputPose(g,a);if(null!==y){"targetRay"in y?m.matrix.elements=y.targetRay.transformMatrix:"pointerMatrix"in y&&(m.matrix.elements=y.pointerMatrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.visible=!0;continue}}m.visible=!1}v&&v(t)})),this.setAnimationLoop=function(t){v=t},this.dispose=function(){},this.getStandingMatrix=function(){return console.warn("THREE.WebXRManager: getStandingMatrix() is no longer needed."),new THREE.Matrix4},this.submitFrame=function(){}}function Ma(t){console.log("THREE.WebGLRenderer",g);var e=void 0!==(t=t||{}).canvas?t.canvas:document.createElementNS("http://www.w3.org/1999/xhtml","canvas"),r=void 0!==t.context?t.context:null,n=void 0!==t.alpha&&t.alpha,i=void 0===t.depth||t.depth,a=void 0===t.stencil||t.stencil,o=void 0!==t.antialias&&t.antialias,s=void 0===t.premultipliedAlpha||t.premultipliedAlpha,c=void 0!==t.preserveDrawingBuffer&&t.preserveDrawingBuffer,h=void 0!==t.powerPreference?t.powerPreference:"default",l=null,u=null;this.domElement=e,this.context=null,this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.gammaFactor=2,this.gammaInput=!1,this.gammaOutput=!1,this.physicallyCorrectLights=!1,this.toneMapping=mt,this.toneMappingExposure=1,this.toneMappingWhitePoint=1,this.maxMorphTargets=8,this.maxMorphNormals=4;var p,d,f,m,v,y,x,b,w,_,M,E,S,T,A,R,C,P,O=this,I=!1,D=null,N=null,B=null,z=-1,U={geometry:null,program:null,wireframe:!1},G=null,F=null,H=new ur,V=new ur,j=null,k=0,W=e.width,q=e.height,X=1,Y=new ur(0,0,W,q),J=new ur(0,0,W,q),Z=!1,Q=new xr,K=new Dn,$=!1,tt=!1,et=new $e,rt=new er;function nt(){return null===N?X:1}try{var it={alpha:n,depth:i,stencil:a,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:h};if(e.addEventListener("webglcontextlost",ct,!1),e.addEventListener("webglcontextrestored",ht,!1),null===(p=r||e.getContext("webgl",it)||e.getContext("experimental-webgl",it)))throw null!==e.getContext("webgl")?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.");void 0===p.getShaderPrecisionFormat&&(p.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(t){console.error("THREE.WebGLRenderer: "+t.message)}function at(){d=new Nn(p),(f=new In(p,d,t)).isWebGL2||(d.get("WEBGL_depth_texture"),d.get("OES_texture_float"),d.get("OES_texture_half_float"),d.get("OES_texture_half_float_linear"),d.get("OES_standard_derivatives"),d.get("OES_element_index_uint"),d.get("ANGLE_instanced_arrays")),d.get("OES_texture_float_linear"),P=new sa(p,d,f),(m=new aa(p,d,P,f)).scissor(V.copy(J).multiplyScalar(X)),m.viewport(H.copy(Y).multiplyScalar(X)),v=new Un(p),y=new qi,x=new oa(p,d,m,y,f,P,v),b=new Ir(p),w=new Bn(p,b,v),_=new Hn(w,v),A=new Fn(p),M=new Wi(O,d,f),E=new Zi,S=new ea,T=new Pn(O,m,_,s),R=new On(p,d,v,f),C=new zn(p,d,v,f),v.programs=M.programs,O.context=p,O.capabilities=f,O.extensions=d,O.properties=y,O.renderLists=E,O.state=m,O.info=v}at();var ot=null;"undefined"!=typeof navigator&&(ot="xr"in navigator?new _a(O):new wa(O)),this.vr=ot;var st=new ia(O,_,f.maxTextureSize);function ct(t){t.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function ht(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1,at()}function lt(t){var e=t.target;e.removeEventListener("dispose",lt),function(t){ut(t),y.remove(t)}(e)}function ut(t){var e=y.get(t).program;t.program=void 0,void 0!==e&&M.releaseProgram(e)}this.shadowMap=st,this.getContext=function(){return p},this.getContextAttributes=function(){return p.getContextAttributes()},this.forceContextLoss=function(){var t=d.get("WEBGL_lose_context");t&&t.loseContext()},this.forceContextRestore=function(){var t=d.get("WEBGL_lose_context");t&&t.restoreContext()},this.getPixelRatio=function(){return X},this.setPixelRatio=function(t){void 0!==t&&(X=t,this.setSize(W,q,!1))},this.getSize=function(){return{width:W,height:q}},this.setSize=function(t,r,n){ot.isPresenting()?console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting."):(W=t,q=r,e.width=t*X,e.height=r*X,!1!==n&&(e.style.width=t+"px",e.style.height=r+"px"),this.setViewport(0,0,t,r))},this.getDrawingBufferSize=function(){return{width:W*X,height:q*X}},this.setDrawingBufferSize=function(t,r,n){W=t,q=r,X=n,e.width=t*n,e.height=r*n,this.setViewport(0,0,t,r)},this.getCurrentViewport=function(){return H},this.setViewport=function(t,e,r,n){Y.set(t,q-e-n,r,n),m.viewport(H.copy(Y).multiplyScalar(X))},this.setScissor=function(t,e,r,n){J.set(t,q-e-n,r,n),m.scissor(V.copy(J).multiplyScalar(X))},this.setScissorTest=function(t){m.setScissorTest(Z=t)},this.getClearColor=function(){return T.getClearColor()},this.setClearColor=function(){T.setClearColor.apply(T,arguments)},this.getClearAlpha=function(){return T.getClearAlpha()},this.setClearAlpha=function(){T.setClearAlpha.apply(T,arguments)},this.clear=function(t,e,r){var n=0;(void 0===t||t)&&(n|=16384),(void 0===e||e)&&(n|=256),(void 0===r||r)&&(n|=1024),p.clear(n)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ct,!1),e.removeEventListener("webglcontextrestored",ht,!1),E.dispose(),S.dispose(),y.dispose(),_.dispose(),ot.dispose(),ft.stop()},this.renderBufferImmediate=function(t,e){m.initAttributes();var r=y.get(t);t.hasPositions&&!r.position&&(r.position=p.createBuffer()),t.hasNormals&&!r.normal&&(r.normal=p.createBuffer()),t.hasUvs&&!r.uv&&(r.uv=p.createBuffer()),t.hasColors&&!r.color&&(r.color=p.createBuffer());var n=e.getAttributes();t.hasPositions&&(p.bindBuffer(34962,r.position),p.bufferData(34962,t.positionArray,35048),m.enableAttribute(n.position),p.vertexAttribPointer(n.position,3,5126,!1,0,0)),t.hasNormals&&(p.bindBuffer(34962,r.normal),p.bufferData(34962,t.normalArray,35048),m.enableAttribute(n.normal),p.vertexAttribPointer(n.normal,3,5126,!1,0,0)),t.hasUvs&&(p.bindBuffer(34962,r.uv),p.bufferData(34962,t.uvArray,35048),m.enableAttribute(n.uv),p.vertexAttribPointer(n.uv,2,5126,!1,0,0)),t.hasColors&&(p.bindBuffer(34962,r.color),p.bufferData(34962,t.colorArray,35048),m.enableAttribute(n.color),p.vertexAttribPointer(n.color,3,5126,!1,0,0)),m.disableUnusedAttributes(),p.drawArrays(4,0,t.count),t.count=0},this.renderBufferDirect=function(t,e,r,n,i,a){var o=i.isMesh&&i.normalMatrix.determinant()<0;m.setMaterial(n,o);var s=bt(t,e,n,i),c=!1;U.geometry===r.id&&U.program===s.id&&U.wireframe===(!0===n.wireframe)||(U.geometry=r.id,U.program=s.id,U.wireframe=!0===n.wireframe,c=!0),i.morphTargetInfluences&&(A.update(i,r,n,s),c=!0);var h,l=r.index,u=r.attributes.position,g=1;!0===n.wireframe&&(l=w.getWireframeAttribute(r),g=2);var v=R;null!==l&&(h=b.get(l),(v=C).setIndex(h)),c&&(function(t,e,r){if(r&&r.isInstancedBufferGeometry&!f.isWebGL2&&null===d.get("ANGLE_instanced_arrays"))console.error("THREE.WebGLRenderer.setupVertexAttributes: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");else{m.initAttributes();var n=r.attributes,i=e.getAttributes(),a=t.defaultAttributeValues;for(var o in i){var s=i[o];if(s>=0){var c=n[o];if(void 0!==c){var h=c.normalized,l=c.itemSize,u=b.get(c);if(void 0===u)continue;var g=u.buffer,v=u.type,y=u.bytesPerElement;if(c.isInterleavedBufferAttribute){var x=c.data,w=x.stride,_=c.offset;x&&x.isInstancedInterleavedBuffer?(m.enableAttributeAndDivisor(s,x.meshPerAttribute),void 0===r.maxInstancedCount&&(r.maxInstancedCount=x.meshPerAttribute*x.count)):m.enableAttribute(s),p.bindBuffer(34962,g),p.vertexAttribPointer(s,l,v,h,w*y,_*y)}else c.isInstancedBufferAttribute?(m.enableAttributeAndDivisor(s,c.meshPerAttribute),void 0===r.maxInstancedCount&&(r.maxInstancedCount=c.meshPerAttribute*c.count)):m.enableAttribute(s),p.bindBuffer(34962,g),p.vertexAttribPointer(s,l,v,h,0,0)}else if(void 0!==a){var M=a[o];if(void 0!==M)switch(M.length){case 2:p.vertexAttrib2fv(s,M);break;case 3:p.vertexAttrib3fv(s,M);break;case 4:p.vertexAttrib4fv(s,M);break;default:p.vertexAttrib1fv(s,M)}}}}m.disableUnusedAttributes()}}(n,s,r),null!==l&&p.bindBuffer(34963,h.buffer));var y=1/0;null!==l?y=l.count:void 0!==u&&(y=u.count);var x=r.drawRange.start*g,_=r.drawRange.count*g,M=null!==a?a.start*g:0,E=null!==a?a.count*g:1/0,S=Math.max(x,M),T=Math.min(y,x+_,M+E)-1,L=Math.max(0,T-S+1);if(0!==L){if(i.isMesh)if(!0===n.wireframe)m.setLineWidth(n.wireframeLinewidth*nt()),v.setMode(1);else switch(i.drawMode){case Be:v.setMode(4);break;case ze:v.setMode(5);break;case Ue:v.setMode(6)}else if(i.isLine){var P=n.linewidth;void 0===P&&(P=1),m.setLineWidth(P*nt()),i.isLineSegments?v.setMode(1):i.isLineLoop?v.setMode(2):v.setMode(3)}else i.isPoints?v.setMode(0):i.isSprite&&v.setMode(4);r&&r.isInstancedBufferGeometry?r.maxInstancedCount>0&&v.renderInstances(r,S,L):v.render(S,L)}},this.compile=function(t,e){(u=S.get(t,e)).init(),t.traverse((function(t){t.isLight&&(u.pushLight(t),t.castShadow&&u.pushShadow(t))})),u.setupLights(e),t.traverse((function(e){if(e.material)if(Array.isArray(e.material))for(var r=0;r<e.material.length;r++)xt(e.material[r],t.fog,e);else xt(e.material,t.fog,e)}))};var pt,dt=null,ft=new Or;function gt(t,e,r,n){if(!1!==t.visible){if(t.layers.test(e.layers))if(t.isGroup)r=t.renderOrder;else if(t.isLight)u.pushLight(t),t.castShadow&&u.pushShadow(t);else if(t.isSprite){if(!t.frustumCulled||Q.intersectsSprite(t)){n&&rt.setFromMatrixPosition(t.matrixWorld).applyMatrix4(et);var i=_.update(t),a=t.material;l.push(t,i,a,r,rt.z,null)}}else if(t.isImmediateRenderObject)n&&rt.setFromMatrixPosition(t.matrixWorld).applyMatrix4(et),l.push(t,null,t.material,r,rt.z,null);else if((t.isMesh||t.isLine||t.isPoints)&&(t.isSkinnedMesh&&t.skeleton.update(),!t.frustumCulled||Q.intersectsObject(t)))if(n&&rt.setFromMatrixPosition(t.matrixWorld).applyMatrix4(et),i=_.update(t),a=t.material,Array.isArray(a))for(var o=i.groups,s=0,c=o.length;s<c;s++){var h=o[s],p=a[h.materialIndex];p&&p.visible&&l.push(t,i,p,r,rt.z,h)}else a.visible&&l.push(t,i,a,r,rt.z,null);var d=t.children;for(s=0,c=d.length;s<c;s++)gt(d[s],e,r,n)}}function vt(t,e,r,n){for(var i=0,a=t.length;i<a;i++){var o=t[i],s=o.object,c=o.geometry,h=void 0===n?o.material:n,l=o.group;if(r.isArrayCamera){F=r;for(var p=r.cameras,d=0,f=p.length;d<f;d++){var g=p[d];if(s.layers.test(g.layers)){if("viewport"in g)m.viewport(H.copy(g.viewport));else{var v=g.bounds,y=v.x*W,x=v.y*q,b=v.z*W,w=v.w*q;m.viewport(H.set(y,x,b,w).multiplyScalar(X))}u.setupLights(g),yt(s,e,g,c,h,l)}}}else F=null,yt(s,e,r,c,h,l)}}function yt(t,e,r,n,i,a){if(t.onBeforeRender(O,e,r,n,i,a),u=S.get(e,F||r),t.modelViewMatrix.multiplyMatrices(r.matrixWorldInverse,t.matrixWorld),t.normalMatrix.getNormalMatrix(t.modelViewMatrix),t.isImmediateRenderObject){m.setMaterial(i);var o=bt(r,e.fog,i,t);U.geometry=null,U.program=null,U.wireframe=!1,function(t,e){t.render((function(t){O.renderBufferImmediate(t,e)}))}(t,o)}else O.renderBufferDirect(r,e.fog,n,i,t,a);t.onAfterRender(O,e,r,n,i,a),u=S.get(e,F||r)}function xt(t,e,r){var n=y.get(t),i=u.state.lights,a=u.state.shadowsArray,o=n.lightsHash,s=i.state.hash,c=M.getParameters(t,i.state,a,e,K.numPlanes,K.numIntersection,r),h=M.getProgramCode(t,c),l=n.program,p=!0;if(void 0===l)t.addEventListener("dispose",lt);else if(l.code!==h)ut(t);else if(o.stateID!==s.stateID||o.directionalLength!==s.directionalLength||o.pointLength!==s.pointLength||o.spotLength!==s.spotLength||o.rectAreaLength!==s.rectAreaLength||o.hemiLength!==s.hemiLength||o.shadowsLength!==s.shadowsLength)o.stateID=s.stateID,o.directionalLength=s.directionalLength,o.pointLength=s.pointLength,o.spotLength=s.spotLength,o.rectAreaLength=s.rectAreaLength,o.hemiLength=s.hemiLength,o.shadowsLength=s.shadowsLength,p=!1;else{if(void 0!==c.shaderID)return;p=!1}if(p){if(c.shaderID){var d=Pr[c.shaderID];n.shader={name:t.type,uniforms:wr(d.uniforms),vertexShader:d.vertexShader,fragmentShader:d.fragmentShader}}else n.shader={name:t.type,uniforms:t.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader};t.onBeforeCompile(n.shader,O),h=M.getProgramCode(t,c),l=M.acquireProgram(t,n.shader,c,h),n.program=l,t.program=l}var f=l.getAttributes();if(t.morphTargets){t.numSupportedMorphTargets=0;for(var m=0;m<O.maxMorphTargets;m++)f["morphTarget"+m]>=0&&t.numSupportedMorphTargets++}if(t.morphNormals)for(t.numSupportedMorphNormals=0,m=0;m<O.maxMorphNormals;m++)f["morphNormal"+m]>=0&&t.numSupportedMorphNormals++;var g=n.shader.uniforms;(t.isShaderMaterial||t.isRawShaderMaterial)&&!0!==t.clipping||(n.numClippingPlanes=K.numPlanes,n.numIntersection=K.numIntersection,g.clippingPlanes=K.uniform),n.fog=e,void 0===o&&(n.lightsHash=o={}),o.stateID=s.stateID,o.directionalLength=s.directionalLength,o.pointLength=s.pointLength,o.spotLength=s.spotLength,o.rectAreaLength=s.rectAreaLength,o.hemiLength=s.hemiLength,o.shadowsLength=s.shadowsLength,t.lights&&(g.ambientLightColor.value=i.state.ambient,g.directionalLights.value=i.state.directional,g.spotLights.value=i.state.spot,g.rectAreaLights.value=i.state.rectArea,g.pointLights.value=i.state.point,g.hemisphereLights.value=i.state.hemi,g.directionalShadowMap.value=i.state.directionalShadowMap,g.directionalShadowMatrix.value=i.state.directionalShadowMatrix,g.spotShadowMap.value=i.state.spotShadowMap,g.spotShadowMatrix.value=i.state.spotShadowMatrix,g.pointShadowMap.value=i.state.pointShadowMap,g.pointShadowMatrix.value=i.state.pointShadowMatrix);var v=n.program.getUniforms(),x=Ii.seqWithValue(v.seq,g);n.uniformsList=x}function bt(t,e,r,n){k=0;var i=y.get(r),a=u.state.lights,o=i.lightsHash,s=a.state.hash;if($&&(tt||t!==G)){var c=t===G&&r.id===z;K.setState(r.clippingPlanes,r.clipIntersection,r.clipShadows,t,i,c)}!1===r.needsUpdate&&(void 0===i.program||r.fog&&i.fog!==e?r.needsUpdate=!0:(!r.lights||o.stateID===s.stateID&&o.directionalLength===s.directionalLength&&o.pointLength===s.pointLength&&o.spotLength===s.spotLength&&o.rectAreaLength===s.rectAreaLength&&o.hemiLength===s.hemiLength&&o.shadowsLength===s.shadowsLength)&&(void 0===i.numClippingPlanes||i.numClippingPlanes===K.numPlanes&&i.numIntersection===K.numIntersection)||(r.needsUpdate=!0)),r.needsUpdate&&(xt(r,e,n),r.needsUpdate=!1);var h,l,d=!1,g=!1,v=!1,x=i.program,b=x.getUniforms(),w=i.shader.uniforms;if(m.useProgram(x.program)&&(d=!0,g=!0,v=!0),r.id!==z&&(z=r.id,g=!0),d||G!==t){if(b.setValue(p,"projectionMatrix",t.projectionMatrix),f.logarithmicDepthBuffer&&b.setValue(p,"logDepthBufFC",2/(Math.log(t.far+1)/Math.LN2)),G!==t&&(G=t,g=!0,v=!0),r.isShaderMaterial||r.isMeshPhongMaterial||r.isMeshStandardMaterial||r.envMap){var _=b.map.cameraPosition;void 0!==_&&_.setValue(p,rt.setFromMatrixPosition(t.matrixWorld))}(r.isMeshPhongMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial||r.skinning)&&b.setValue(p,"viewMatrix",t.matrixWorldInverse)}if(r.skinning){b.setOptional(p,n,"bindMatrix"),b.setOptional(p,n,"bindMatrixInverse");var M=n.skeleton;if(M){var E=M.bones;if(f.floatVertexTextures){if(void 0===M.boneTexture){var S=Math.sqrt(4*E.length);S=Qe.ceilPowerOfTwo(S),S=Math.max(S,4);var T=new Float32Array(S*S*4);T.set(M.boneMatrices);var A=new mr(T,S,S,Qt,jt);A.needsUpdate=!0,M.boneMatrices=T,M.boneTexture=A,M.boneTextureSize=S}b.setValue(p,"boneTexture",M.boneTexture),b.setValue(p,"boneTextureSize",M.boneTextureSize)}else b.setOptional(p,M,"boneMatrices")}}return g&&(b.setValue(p,"toneMappingExposure",O.toneMappingExposure),b.setValue(p,"toneMappingWhitePoint",O.toneMappingWhitePoint),r.lights&&(l=v,(h=w).ambientLightColor.needsUpdate=l,h.directionalLights.needsUpdate=l,h.pointLights.needsUpdate=l,h.spotLights.needsUpdate=l,h.rectAreaLights.needsUpdate=l,h.hemisphereLights.needsUpdate=l),e&&r.fog&&function(t,e){t.fogColor.value=e.color,e.isFog?(t.fogNear.value=e.near,t.fogFar.value=e.far):e.isFogExp2&&(t.fogDensity.value=e.density)}(w,e),r.isMeshBasicMaterial?wt(w,r):r.isMeshLambertMaterial?(wt(w,r),function(t,e){e.emissiveMap&&(t.emissiveMap.value=e.emissiveMap)}(w,r)):r.isMeshPhongMaterial?(wt(w,r),r.isMeshToonMaterial?function(t,e){_t(t,e),e.gradientMap&&(t.gradientMap.value=e.gradientMap)}(w,r):_t(w,r)):r.isMeshStandardMaterial?(wt(w,r),r.isMeshPhysicalMaterial?function(t,e){Mt(t,e),t.reflectivity.value=e.reflectivity,t.clearCoat.value=e.clearCoat,t.clearCoatRoughness.value=e.clearCoatRoughness}(w,r):Mt(w,r)):r.isMeshMatcapMaterial?(wt(w,r),function(t,e){e.matcap&&(t.matcap.value=e.matcap),e.bumpMap&&(t.bumpMap.value=e.bumpMap,t.bumpScale.value=e.bumpScale,e.side===L&&(t.bumpScale.value*=-1)),e.normalMap&&(t.normalMap.value=e.normalMap,t.normalScale.value.copy(e.normalScale),e.side===L&&t.normalScale.value.negate()),e.displacementMap&&(t.displacementMap.value=e.displacementMap,t.displacementScale.value=e.displacementScale,t.displacementBias.value=e.displacementBias)}(w,r)):r.isMeshDepthMaterial?(wt(w,r),function(t,e){e.displacementMap&&(t.displacementMap.value=e.displacementMap,t.displacementScale.value=e.displacementScale,t.displacementBias.value=e.displacementBias)}(w,r)):r.isMeshDistanceMaterial?(wt(w,r),function(t,e){e.displacementMap&&(t.displacementMap.value=e.displacementMap,t.displacementScale.value=e.displacementScale,t.displacementBias.value=e.displacementBias),t.referencePosition.value.copy(e.referencePosition),t.nearDistance.value=e.nearDistance,t.farDistance.value=e.farDistance}(w,r)):r.isMeshNormalMaterial?(wt(w,r),function(t,e){e.bumpMap&&(t.bumpMap.value=e.bumpMap,t.bumpScale.value=e.bumpScale,e.side===L&&(t.bumpScale.value*=-1)),e.normalMap&&(t.normalMap.value=e.normalMap,t.normalScale.value.copy(e.normalScale),e.side===L&&t.normalScale.value.negate()),e.displacementMap&&(t.displacementMap.value=e.displacementMap,t.displacementScale.value=e.displacementScale,t.displacementBias.value=e.displacementBias)}(w,r)):r.isLineBasicMaterial?(function(t,e){t.diffuse.value=e.color,t.opacity.value=e.opacity}(w,r),r.isLineDashedMaterial&&function(t,e){t.dashSize.value=e.dashSize,t.totalSize.value=e.dashSize+e.gapSize,t.scale.value=e.scale}(w,r)):r.isPointsMaterial?function(t,e){t.diffuse.value=e.color,t.opacity.value=e.opacity,t.size.value=e.size*X,t.scale.value=.5*q,t.map.value=e.map,null!==e.map&&(!0===e.map.matrixAutoUpdate&&e.map.updateMatrix(),t.uvTransform.value.copy(e.map.matrix))}(w,r):r.isSpriteMaterial?function(t,e){t.diffuse.value=e.color,t.opacity.value=e.opacity,t.rotation.value=e.rotation,t.map.value=e.map,null!==e.map&&(!0===e.map.matrixAutoUpdate&&e.map.updateMatrix(),t.uvTransform.value.copy(e.map.matrix))}(w,r):r.isShadowMaterial&&(w.color.value=r.color,w.opacity.value=r.opacity),void 0!==w.ltc_1&&(w.ltc_1.value=Cr.LTC_1),void 0!==w.ltc_2&&(w.ltc_2.value=Cr.LTC_2),Ii.upload(p,i.uniformsList,w,O)),r.isShaderMaterial&&!0===r.uniformsNeedUpdate&&(Ii.upload(p,i.uniformsList,w,O),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&b.setValue(p,"center",n.center),b.setValue(p,"modelViewMatrix",n.modelViewMatrix),b.setValue(p,"normalMatrix",n.normalMatrix),b.setValue(p,"modelMatrix",n.matrixWorld),x}function wt(t,e){var r;t.opacity.value=e.opacity,e.color&&(t.diffuse.value=e.color),e.emissive&&t.emissive.value.copy(e.emissive).multiplyScalar(e.emissiveIntensity),e.map&&(t.map.value=e.map),e.alphaMap&&(t.alphaMap.value=e.alphaMap),e.specularMap&&(t.specularMap.value=e.specularMap),e.envMap&&(t.envMap.value=e.envMap,t.flipEnvMap.value=e.envMap.isCubeTexture?-1:1,t.reflectivity.value=e.reflectivity,t.refractionRatio.value=e.refractionRatio,t.maxMipLevel.value=y.get(e.envMap).__maxMipLevel),e.lightMap&&(t.lightMap.value=e.lightMap,t.lightMapIntensity.value=e.lightMapIntensity),e.aoMap&&(t.aoMap.value=e.aoMap,t.aoMapIntensity.value=e.aoMapIntensity),e.map?r=e.map:e.specularMap?r=e.specularMap:e.displacementMap?r=e.displacementMap:e.normalMap?r=e.normalMap:e.bumpMap?r=e.bumpMap:e.roughnessMap?r=e.roughnessMap:e.metalnessMap?r=e.metalnessMap:e.alphaMap?r=e.alphaMap:e.emissiveMap&&(r=e.emissiveMap),void 0!==r&&(r.isWebGLRenderTarget&&(r=r.texture),!0===r.matrixAutoUpdate&&r.updateMatrix(),t.uvTransform.value.copy(r.matrix))}function _t(t,e){t.specular.value=e.specular,t.shininess.value=Math.max(e.shininess,1e-4),e.emissiveMap&&(t.emissiveMap.value=e.emissiveMap),e.bumpMap&&(t.bumpMap.value=e.bumpMap,t.bumpScale.value=e.bumpScale,e.side===L&&(t.bumpScale.value*=-1)),e.normalMap&&(t.normalMap.value=e.normalMap,t.normalScale.value.copy(e.normalScale),e.side===L&&t.normalScale.value.negate()),e.displacementMap&&(t.displacementMap.value=e.displacementMap,t.displacementScale.value=e.displacementScale,t.displacementBias.value=e.displacementBias)}function Mt(t,e){t.roughness.value=e.roughness,t.metalness.value=e.metalness,e.roughnessMap&&(t.roughnessMap.value=e.roughnessMap),e.metalnessMap&&(t.metalnessMap.value=e.metalnessMap),e.emissiveMap&&(t.emissiveMap.value=e.emissiveMap),e.bumpMap&&(t.bumpMap.value=e.bumpMap,t.bumpScale.value=e.bumpScale,e.side===L&&(t.bumpScale.value*=-1)),e.normalMap&&(t.normalMap.value=e.normalMap,t.normalScale.value.copy(e.normalScale),e.side===L&&t.normalScale.value.negate()),e.displacementMap&&(t.displacementMap.value=e.displacementMap,t.displacementScale.value=e.displacementScale,t.displacementBias.value=e.displacementBias),e.envMap&&(t.envMapIntensity.value=e.envMapIntensity)}ft.setAnimationLoop((function(t){ot.isPresenting()||dt&&dt(t)})),"undefined"!=typeof window&&ft.setContext(window),this.setAnimationLoop=function(t){dt=t,ot.setAnimationLoop(t),ft.start()},this.render=function(t,e,r,n){if(e&&e.isCamera){if(!I){U.geometry=null,U.program=null,U.wireframe=!1,z=-1,G=null,!0===t.autoUpdate&&t.updateMatrixWorld(),null===e.parent&&e.updateMatrixWorld(),ot.enabled&&(e=ot.getCamera(e)),(u=S.get(t,e)).init(),t.onBeforeRender(O,t,e,r),et.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),Q.setFromMatrix(et),tt=this.localClippingEnabled,$=K.init(this.clippingPlanes,tt,e),(l=E.get(t,e)).init(),gt(t,e,0,O.sortObjects),!0===O.sortObjects&&l.sort(),$&&K.beginShadows();var i=u.state.shadowsArray;st.render(i,t,e),u.setupLights(e),$&&K.endShadows(),this.info.autoReset&&this.info.reset(),void 0===r&&(r=null),this.setRenderTarget(r),T.render(l,t,e,n);var a=l.opaque,o=l.transparent;if(t.overrideMaterial){var s=t.overrideMaterial;a.length&&vt(a,t,e,s),o.length&&vt(o,t,e,s)}else a.length&&vt(a,t,e),o.length&&vt(o,t,e);r&&(x.updateRenderTargetMipmap(r),x.updateMultisampleRenderTarget(r)),m.buffers.depth.setTest(!0),m.buffers.depth.setMask(!0),m.buffers.color.setMask(!0),m.setPolygonOffset(!1),t.onAfterRender(O,t,e),ot.enabled&&ot.submitFrame(),l=null,u=null}}else console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.")},this.allocTextureUnit=function(){var t=k;return t>=f.maxTextures&&console.warn("THREE.WebGLRenderer: Trying to use "+t+" texture units while this GPU supports only "+f.maxTextures),k+=1,t},this.setTexture2D=(pt=!1,function(t,e){t&&t.isWebGLRenderTarget&&(pt||(console.warn("THREE.WebGLRenderer.setTexture2D: don't use render targets as textures. Use their .texture property instead."),pt=!0),t=t.texture),x.setTexture2D(t,e)}),this.setTexture3D=function(t,e){x.setTexture3D(t,e)},this.setTexture=function(){var t=!1;return function(e,r){t||(console.warn("THREE.WebGLRenderer: .setTexture is deprecated, use setTexture2D instead."),t=!0),x.setTexture2D(e,r)}}(),this.setTextureCube=function(){var t=!1;return function(e,r){e&&e.isWebGLRenderTargetCube&&(t||(console.warn("THREE.WebGLRenderer.setTextureCube: don't use cube render targets as textures. Use their .texture property instead."),t=!0),e=e.texture),e&&e.isCubeTexture||Array.isArray(e.image)&&6===e.image.length?x.setTextureCube(e,r):x.setTextureCubeDynamic(e,r)}}(),this.setFramebuffer=function(t){D=t},this.getRenderTarget=function(){return N},this.setRenderTarget=function(t){N=t,t&&void 0===y.get(t).__webglFramebuffer&&x.setupRenderTarget(t);var e=D,r=!1;if(t){var n=y.get(t).__webglFramebuffer;t.isWebGLRenderTargetCube?(e=n[t.activeCubeFace],r=!0):e=t.isWebGLMultisampleRenderTarget?y.get(t).__webglMultisampledFramebuffer:n,H.copy(t.viewport),V.copy(t.scissor),j=t.scissorTest}else H.copy(Y).multiplyScalar(X),V.copy(J).multiplyScalar(X),j=Z;if(B!==e&&(p.bindFramebuffer(36160,e),B=e),m.viewport(H),m.scissor(V),m.setScissorTest(j),r){var i=y.get(t.texture);p.framebufferTexture2D(36160,36064,34069+t.activeCubeFace,i.__webglTexture,t.activeMipMapLevel)}},this.readRenderTargetPixels=function(t,e,r,n,i,a){if(t&&t.isWebGLRenderTarget){var o=y.get(t).__webglFramebuffer;if(o){var s=!1;o!==B&&(p.bindFramebuffer(36160,o),s=!0);try{var c=t.texture,h=c.format,l=c.type;if(h!==Qt&&P.convert(h)!==p.getParameter(35739))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");if(!(l===zt||P.convert(l)===p.getParameter(35738)||l===jt&&(f.isWebGL2||d.get("OES_texture_float")||d.get("WEBGL_color_buffer_float"))||l===kt&&(f.isWebGL2?d.get("EXT_color_buffer_float"):d.get("EXT_color_buffer_half_float"))))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");36053===p.checkFramebufferStatus(36160)?e>=0&&e<=t.width-n&&r>=0&&r<=t.height-i&&p.readPixels(e,r,n,i,P.convert(h),P.convert(l),a):console.error("THREE.WebGLRenderer.readRenderTargetPixels: readPixels from renderTarget failed. Framebuffer not complete.")}finally{s&&p.bindFramebuffer(36160,B)}}}else console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.")},this.copyFramebufferToTexture=function(t,e,r){var n=e.image.width,i=e.image.height,a=P.convert(e.format);this.setTexture2D(e,0),p.copyTexImage2D(3553,r||0,a,t.x,t.y,n,i,0)},this.copyTextureToTexture=function(t,e,r,n){var i=e.image.width,a=e.image.height,o=P.convert(r.format),s=P.convert(r.type);this.setTexture2D(r,0),e.isDataTexture?p.texSubImage2D(3553,n||0,t.x,t.y,i,a,o,s,e.image.data):p.texSubImage2D(3553,n||0,t.x,t.y,o,s,e.image)}}function Ea(t,e){this.name="",this.color=new Lr(t),this.density=void 0!==e?e:25e-5}function Sa(t,e,r){this.name="",this.color=new Lr(t),this.near=void 0!==e?e:1,this.far=void 0!==r?r:1e3}function Ta(){Vr.call(this),this.type="Scene",this.background=null,this.fog=null,this.overrideMaterial=null,this.autoUpdate=!0}function Aa(t,e){this.array=t,this.stride=e,this.count=void 0!==t?t.length/e:0,this.dynamic=!1,this.updateRange={offset:0,count:-1},this.version=0}function La(t,e,r,n){this.data=t,this.itemSize=e,this.offset=r,this.normalized=!0===n}function Ra(t){Sn.call(this),this.type="SpriteMaterial",this.color=new Lr(16777215),this.map=null,this.rotation=0,this.sizeAttenuation=!0,this.lights=!1,this.transparent=!0,this.setValues(t)}function Ca(t){if(Vr.call(this),this.type="Sprite",void 0===pa){pa=new sn;var e=new Aa(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);pa.setIndex([0,1,2,0,2,3]),pa.addAttribute("position",new La(e,3,0,!1)),pa.addAttribute("uv",new La(e,2,3,!1))}this.geometry=pa,this.material=void 0!==t?t:new Ra,this.center=new Ke(.5,.5)}function Pa(){Vr.call(this),this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]}})}function Oa(t,e){t&&t.isGeometry&&console.error("THREE.SkinnedMesh no longer supports THREE.Geometry. Use THREE.BufferGeometry instead."),Cn.call(this,t,e),this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new $e,this.bindMatrixInverse=new $e}function Ia(t,e){if(t=t||[],this.bones=t.slice(0),this.boneMatrices=new Float32Array(16*this.bones.length),void 0===e)this.calculateInverses();else if(this.bones.length===e.length)this.boneInverses=e.slice(0);else{console.warn("THREE.Skeleton boneInverses is the wrong length."),this.boneInverses=[];for(var r=0,n=this.bones.length;r<n;r++)this.boneInverses.push(new $e)}}function Da(){Vr.call(this),this.type="Bone"}function Na(t){Sn.call(this),this.type="LineBasicMaterial",this.color=new Lr(16777215),this.linewidth=1,this.linecap="round",this.linejoin="round",this.lights=!1,this.setValues(t)}function Ba(t,e,r){1===r&&console.error("THREE.Line: parameter THREE.LinePieces no longer supported. Use THREE.LineSegments instead."),Vr.call(this),this.type="Line",this.geometry=void 0!==t?t:new sn,this.material=void 0!==e?e:new Na({color:16777215*Math.random()})}function za(t,e){Ba.call(this,t,e),this.type="LineSegments"}function Ua(t,e){Ba.call(this,t,e),this.type="LineLoop"}function Ga(t){Sn.call(this),this.type="PointsMaterial",this.color=new Lr(16777215),this.map=null,this.size=1,this.sizeAttenuation=!0,this.morphTargets=!1,this.lights=!1,this.setValues(t)}function Fa(t,e){Vr.call(this),this.type="Points",this.geometry=void 0!==t?t:new sn,this.material=void 0!==e?e:new Ga({color:16777215*Math.random()})}function Ha(t,e,r,n,i,a,o,s,c){lr.call(this,t,e,r,n,i,a,o,s,c),this.format=void 0!==o?o:Zt,this.minFilter=void 0!==a?a:Dt,this.magFilter=void 0!==i?i:Dt,this.generateMipmaps=!1}function Va(t,e,r,n,i,a,o,s,c,h,l,u){lr.call(this,null,a,o,s,c,h,n,i,l,u),this.image={width:e,height:r},this.mipmaps=t,this.flipY=!1,this.generateMipmaps=!1}function ja(t,e,r,n,i,a,o,s,c){lr.call(this,t,e,r,n,i,a,o,s,c),this.needsUpdate=!0}function ka(t,e,r,n,i,a,o,s,c,h){if((h=void 0!==h?h:ee)!==ee&&h!==re)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");void 0===r&&h===ee&&(r=Ft),void 0===r&&h===re&&(r=Yt),lr.call(this,null,n,i,a,o,s,h,r,c),this.image={width:t,height:e},this.magFilter=void 0!==o?o:Pt,this.minFilter=void 0!==s?s:Pt,this.flipY=!1,this.generateMipmaps=!1}function Wa(t){sn.call(this),this.type="WireframeGeometry";var e,r,n,i,a,o,s,c,h,l,u=[],p=[0,0],d={},f=["a","b","c"];if(t&&t.isGeometry){var m=t.faces;for(e=0,n=m.length;e<n;e++){var g=m[e];for(r=0;r<3;r++)s=g[f[r]],c=g[f[(r+1)%3]],p[0]=Math.min(s,c),p[1]=Math.max(s,c),void 0===d[h=p[0]+","+p[1]]&&(d[h]={index1:p[0],index2:p[1]})}for(h in d)o=d[h],l=t.vertices[o.index1],u.push(l.x,l.y,l.z),l=t.vertices[o.index2],u.push(l.x,l.y,l.z)}else if(t&&t.isBufferGeometry){var v,y,x,b,w,_,M;if(l=new er,null!==t.index){for(v=t.attributes.position,y=t.index,0===(x=t.groups).length&&(x=[{start:0,count:y.count,materialIndex:0}]),i=0,a=x.length;i<a;++i)for(e=w=(b=x[i]).start,n=w+b.count;e<n;e+=3)for(r=0;r<3;r++)s=y.getX(e+r),c=y.getX(e+(r+1)%3),p[0]=Math.min(s,c),p[1]=Math.max(s,c),void 0===d[h=p[0]+","+p[1]]&&(d[h]={index1:p[0],index2:p[1]});for(h in d)o=d[h],l.fromBufferAttribute(v,o.index1),u.push(l.x,l.y,l.z),l.fromBufferAttribute(v,o.index2),u.push(l.x,l.y,l.z)}else for(e=0,n=(v=t.attributes.position).count/3;e<n;e++)for(r=0;r<3;r++)_=3*e+r,l.fromBufferAttribute(v,_),u.push(l.x,l.y,l.z),M=3*e+(r+1)%3,l.fromBufferAttribute(v,M),u.push(l.x,l.y,l.z)}this.addAttribute("position",new en(u,3))}function qa(t,e,r){qr.call(this),this.type="ParametricGeometry",this.parameters={func:t,slices:e,stacks:r},this.fromBufferGeometry(new Xa(t,e,r)),this.mergeVertices()}function Xa(t,e,r){sn.call(this),this.type="ParametricBufferGeometry",this.parameters={func:t,slices:e,stacks:r};var n,i,a=[],o=[],s=[],c=[],h=1e-5,l=new er,u=new er,p=new er,d=new er,f=new er;t.length<3&&console.error("THREE.ParametricGeometry: Function must now modify a Vector3 as third parameter.");var m=e+1;for(n=0;n<=r;n++){var g=n/r;for(i=0;i<=e;i++){var v=i/e;t(v,g,u),o.push(u.x,u.y,u.z),v-h>=0?(t(v-h,g,p),d.subVectors(u,p)):(t(v+h,g,p),d.subVectors(p,u)),g-h>=0?(t(v,g-h,p),f.subVectors(u,p)):(t(v,g+h,p),f.subVectors(p,u)),l.crossVectors(d,f).normalize(),s.push(l.x,l.y,l.z),c.push(v,g)}}for(n=0;n<r;n++)for(i=0;i<e;i++){var y=n*m+i,x=n*m+i+1,b=(n+1)*m+i+1,w=(n+1)*m+i;a.push(y,x,w),a.push(x,b,w)}this.setIndex(a),this.addAttribute("position",new en(o,3)),this.addAttribute("normal",new en(s,3)),this.addAttribute("uv",new en(c,2))}function Ya(t,e,r,n){qr.call(this),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:r,detail:n},this.fromBufferGeometry(new Ja(t,e,r,n)),this.mergeVertices()}function Ja(t,e,r,n){sn.call(this),this.type="PolyhedronBufferGeometry",this.parameters={vertices:t,indices:e,radius:r,detail:n},r=r||1;var i=[],a=[];function o(t,e,r,n){var i,a,o=Math.pow(2,n),c=[];for(i=0;i<=o;i++){c[i]=[];var h=t.clone().lerp(r,i/o),l=e.clone().lerp(r,i/o),u=o-i;for(a=0;a<=u;a++)c[i][a]=0===a&&i===o?h:h.clone().lerp(l,a/u)}for(i=0;i<o;i++)for(a=0;a<2*(o-i)-1;a++){var p=Math.floor(a/2);a%2==0?(s(c[i][p+1]),s(c[i+1][p]),s(c[i][p])):(s(c[i][p+1]),s(c[i+1][p+1]),s(c[i+1][p]))}}function s(t){i.push(t.x,t.y,t.z)}function c(e,r){var n=3*e;r.x=t[n+0],r.y=t[n+1],r.z=t[n+2]}function h(t,e,r,n){n<0&&1===t.x&&(a[e]=t.x-1),0===r.x&&0===r.z&&(a[e]=n/2/Math.PI+.5)}function l(t){return Math.atan2(t.z,-t.x)}function u(t){return Math.atan2(-t.y,Math.sqrt(t.x*t.x+t.z*t.z))}!function(t){for(var r=new er,n=new er,i=new er,a=0;a<e.length;a+=3)c(e[a+0],r),c(e[a+1],n),c(e[a+2],i),o(r,n,i,t)}(n=n||0),function(t){for(var e=new er,r=0;r<i.length;r+=3)e.x=i[r+0],e.y=i[r+1],e.z=i[r+2],e.normalize().multiplyScalar(t),i[r+0]=e.x,i[r+1]=e.y,i[r+2]=e.z}(r),function(){for(var t=new er,e=0;e<i.length;e+=3){t.x=i[e+0],t.y=i[e+1],t.z=i[e+2];var r=l(t)/2/Math.PI+.5,n=u(t)/Math.PI+.5;a.push(r,1-n)}(function(){for(var t=new er,e=new er,r=new er,n=new er,o=new Ke,s=new Ke,c=new Ke,u=0,p=0;u<i.length;u+=9,p+=6){t.set(i[u+0],i[u+1],i[u+2]),e.set(i[u+3],i[u+4],i[u+5]),r.set(i[u+6],i[u+7],i[u+8]),o.set(a[p+0],a[p+1]),s.set(a[p+2],a[p+3]),c.set(a[p+4],a[p+5]),n.copy(t).add(e).add(r).divideScalar(3);var d=l(n);h(o,p+0,t,d),h(s,p+2,e,d),h(c,p+4,r,d)}})(),function(){for(var t=0;t<a.length;t+=6){var e=a[t+0],r=a[t+2],n=a[t+4],i=Math.max(e,r,n),o=Math.min(e,r,n);i>.9&&o<.1&&(e<.2&&(a[t+0]+=1),r<.2&&(a[t+2]+=1),n<.2&&(a[t+4]+=1))}}()}(),this.addAttribute("position",new en(i,3)),this.addAttribute("normal",new en(i.slice(),3)),this.addAttribute("uv",new en(a,2)),0===n?this.computeVertexNormals():this.normalizeNormals()}function Za(t,e){qr.call(this),this.type="TetrahedronGeometry",this.parameters={radius:t,detail:e},this.fromBufferGeometry(new Qa(t,e)),this.mergeVertices()}function Qa(t,e){Ja.call(this,[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],t,e),this.type="TetrahedronBufferGeometry",this.parameters={radius:t,detail:e}}function Ka(t,e){qr.call(this),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e},this.fromBufferGeometry(new $a(t,e)),this.mergeVertices()}function $a(t,e){Ja.call(this,[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],t,e),this.type="OctahedronBufferGeometry",this.parameters={radius:t,detail:e}}function to(t,e){qr.call(this),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e},this.fromBufferGeometry(new eo(t,e)),this.mergeVertices()}function eo(t,e){var r=(1+Math.sqrt(5))/2,n=[-1,r,0,1,r,0,-1,-r,0,1,-r,0,0,-1,r,0,1,r,0,-1,-r,0,1,-r,r,0,-1,r,0,1,-r,0,-1,-r,0,1];Ja.call(this,n,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],t,e),this.type="IcosahedronBufferGeometry",this.parameters={radius:t,detail:e}}function ro(t,e){qr.call(this),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e},this.fromBufferGeometry(new no(t,e)),this.mergeVertices()}function no(t,e){var r=(1+Math.sqrt(5))/2,n=1/r,i=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-n,-r,0,-n,r,0,n,-r,0,n,r,-n,-r,0,-n,r,0,n,-r,0,n,r,0,-r,0,-n,r,0,-n,-r,0,n,r,0,n];Ja.call(this,i,[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],t,e),this.type="DodecahedronBufferGeometry",this.parameters={radius:t,detail:e}}function io(t,e,r,n,i,a){qr.call(this),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:r,radialSegments:n,closed:i},void 0!==a&&console.warn("THREE.TubeGeometry: taper has been removed.");var o=new ao(t,e,r,n,i);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals,this.fromBufferGeometry(o),this.mergeVertices()}function ao(t,e,r,n,i){sn.call(this),this.type="TubeBufferGeometry",this.parameters={path:t,tubularSegments:e,radius:r,radialSegments:n,closed:i},e=e||64,r=r||1,n=n||8,i=i||!1;var a=t.computeFrenetFrames(e,i);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;var o,s,c=new er,h=new er,l=new Ke,u=new er,p=[],d=[],f=[],m=[];function g(i){u=t.getPointAt(i/e,u);var o=a.normals[i],l=a.binormals[i];for(s=0;s<=n;s++){var f=s/n*Math.PI*2,m=Math.sin(f),g=-Math.cos(f);h.x=g*o.x+m*l.x,h.y=g*o.y+m*l.y,h.z=g*o.z+m*l.z,h.normalize(),d.push(h.x,h.y,h.z),c.x=u.x+r*h.x,c.y=u.y+r*h.y,c.z=u.z+r*h.z,p.push(c.x,c.y,c.z)}}!function(){for(o=0;o<e;o++)g(o);g(!1===i?e:0),function(){for(o=0;o<=e;o++)for(s=0;s<=n;s++)l.x=o/e,l.y=s/n,f.push(l.x,l.y)}(),function(){for(s=1;s<=e;s++)for(o=1;o<=n;o++){var t=(n+1)*(s-1)+(o-1),r=(n+1)*s+(o-1),i=(n+1)*s+o,a=(n+1)*(s-1)+o;m.push(t,r,a),m.push(r,i,a)}}()}(),this.setIndex(m),this.addAttribute("position",new en(p,3)),this.addAttribute("normal",new en(d,3)),this.addAttribute("uv",new en(f,2))}function oo(t,e,r,n,i,a,o){qr.call(this),this.type="TorusKnotGeometry",this.parameters={radius:t,tube:e,tubularSegments:r,radialSegments:n,p:i,q:a},void 0!==o&&console.warn("THREE.TorusKnotGeometry: heightScale has been deprecated. Use .scale( x, y, z ) instead."),this.fromBufferGeometry(new so(t,e,r,n,i,a)),this.mergeVertices()}function so(t,e,r,n,i,a){sn.call(this),this.type="TorusKnotBufferGeometry",this.parameters={radius:t,tube:e,tubularSegments:r,radialSegments:n,p:i,q:a},t=t||1,e=e||.4,r=Math.floor(r)||64,n=Math.floor(n)||8,i=i||2,a=a||3;var o,s,c=[],h=[],l=[],u=[],p=new er,d=new er,f=new er,m=new er,g=new er,v=new er,y=new er;for(o=0;o<=r;++o){var x=o/r*i*Math.PI*2;for(A(x,i,a,t,f),A(x+.01,i,a,t,m),v.subVectors(m,f),y.addVectors(m,f),g.crossVectors(v,y),y.crossVectors(g,v),g.normalize(),y.normalize(),s=0;s<=n;++s){var b=s/n*Math.PI*2,w=-e*Math.cos(b),_=e*Math.sin(b);p.x=f.x+(w*y.x+_*g.x),p.y=f.y+(w*y.y+_*g.y),p.z=f.z+(w*y.z+_*g.z),h.push(p.x,p.y,p.z),d.subVectors(p,f).normalize(),l.push(d.x,d.y,d.z),u.push(o/r),u.push(s/n)}}for(s=1;s<=r;s++)for(o=1;o<=n;o++){var M=(n+1)*(s-1)+(o-1),E=(n+1)*s+(o-1),S=(n+1)*s+o,T=(n+1)*(s-1)+o;c.push(M,E,T),c.push(E,S,T)}function A(t,e,r,n,i){var a=Math.cos(t),o=Math.sin(t),s=r/e*t,c=Math.cos(s);i.x=n*(2+c)*.5*a,i.y=n*(2+c)*o*.5,i.z=n*Math.sin(s)*.5}this.setIndex(c),this.addAttribute("position",new en(h,3)),this.addAttribute("normal",new en(l,3)),this.addAttribute("uv",new en(u,2))}function co(t,e,r,n,i){qr.call(this),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:r,tubularSegments:n,arc:i},this.fromBufferGeometry(new ho(t,e,r,n,i)),this.mergeVertices()}function ho(t,e,r,n,i){sn.call(this),this.type="TorusBufferGeometry",this.parameters={radius:t,tube:e,radialSegments:r,tubularSegments:n,arc:i},t=t||1,e=e||.4,r=Math.floor(r)||8,n=Math.floor(n)||6,i=i||2*Math.PI;var a,o,s=[],c=[],h=[],l=[],u=new er,p=new er,d=new er;for(a=0;a<=r;a++)for(o=0;o<=n;o++){var f=o/n*i,m=a/r*Math.PI*2;p.x=(t+e*Math.cos(m))*Math.cos(f),p.y=(t+e*Math.cos(m))*Math.sin(f),p.z=e*Math.sin(m),c.push(p.x,p.y,p.z),u.x=t*Math.cos(f),u.y=t*Math.sin(f),d.subVectors(p,u).normalize(),h.push(d.x,d.y,d.z),l.push(o/n),l.push(a/r)}for(a=1;a<=r;a++)for(o=1;o<=n;o++){var g=(n+1)*a+o-1,v=(n+1)*(a-1)+o-1,y=(n+1)*(a-1)+o,x=(n+1)*a+o;s.push(g,v,x),s.push(v,y,x)}this.setIndex(s),this.addAttribute("position",new en(c,3)),this.addAttribute("normal",new en(h,3)),this.addAttribute("uv",new en(l,2))}Ea.prototype.isFogExp2=!0,Ea.prototype.clone=function(){return new Ea(this.color,this.density)},Ea.prototype.toJSON=function(){return{type:"FogExp2",color:this.color.getHex(),density:this.density}},Sa.prototype.isFog=!0,Sa.prototype.clone=function(){return new Sa(this.color,this.near,this.far)},Sa.prototype.toJSON=function(){return{type:"Fog",color:this.color.getHex(),near:this.near,far:this.far}},Ta.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Ta,isScene:!0,copy:function(t,e){return Vr.prototype.copy.call(this,t,e),null!==t.background&&(this.background=t.background.clone()),null!==t.fog&&(this.fog=t.fog.clone()),null!==t.overrideMaterial&&(this.overrideMaterial=t.overrideMaterial.clone()),this.autoUpdate=t.autoUpdate,this.matrixAutoUpdate=t.matrixAutoUpdate,this},toJSON:function(t){var e=Vr.prototype.toJSON.call(this,t);return null!==this.background&&(e.object.background=this.background.toJSON(t)),null!==this.fog&&(e.object.fog=this.fog.toJSON()),e},dispose:function(){this.dispatchEvent({type:"dispose"})}}),Object.defineProperty(Aa.prototype,"needsUpdate",{set:function(t){!0===t&&this.version++}}),Object.assign(Aa.prototype,{isInterleavedBuffer:!0,onUploadCallback:function(){},setArray:function(t){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");return this.count=void 0!==t?t.length/this.stride:0,this.array=t,this},setDynamic:function(t){return this.dynamic=t,this},copy:function(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.dynamic=t.dynamic,this},copyAt:function(t,e,r){t*=this.stride,r*=e.stride;for(var n=0,i=this.stride;n<i;n++)this.array[t+n]=e.array[r+n];return this},set:function(t,e){return void 0===e&&(e=0),this.array.set(t,e),this},clone:function(){return(new this.constructor).copy(this)},onUpload:function(t){return this.onUploadCallback=t,this}}),Object.defineProperties(La.prototype,{count:{get:function(){return this.data.count}},array:{get:function(){return this.data.array}}}),Object.assign(La.prototype,{isInterleavedBufferAttribute:!0,setX:function(t,e){return this.data.array[t*this.data.stride+this.offset]=e,this},setY:function(t,e){return this.data.array[t*this.data.stride+this.offset+1]=e,this},setZ:function(t,e){return this.data.array[t*this.data.stride+this.offset+2]=e,this},setW:function(t,e){return this.data.array[t*this.data.stride+this.offset+3]=e,this},getX:function(t){return this.data.array[t*this.data.stride+this.offset]},getY:function(t){return this.data.array[t*this.data.stride+this.offset+1]},getZ:function(t){return this.data.array[t*this.data.stride+this.offset+2]},getW:function(t){return this.data.array[t*this.data.stride+this.offset+3]},setXY:function(t,e,r){return t=t*this.data.stride+this.offset,this.data.array[t+0]=e,this.data.array[t+1]=r,this},setXYZ:function(t,e,r,n){return t=t*this.data.stride+this.offset,this.data.array[t+0]=e,this.data.array[t+1]=r,this.data.array[t+2]=n,this},setXYZW:function(t,e,r,n,i){return t=t*this.data.stride+this.offset,this.data.array[t+0]=e,this.data.array[t+1]=r,this.data.array[t+2]=n,this.data.array[t+3]=i,this}}),Ra.prototype=Object.create(Sn.prototype),Ra.prototype.constructor=Ra,Ra.prototype.isSpriteMaterial=!0,Ra.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this.map=t.map,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this},Ca.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Ca,isSprite:!0,raycast:function(){var t=new er,e=new er,r=new er,n=new Ke,i=new Ke,a=new $e,o=new er,s=new er,c=new er,h=new Ke,l=new Ke,u=new Ke;function p(t,e,r,o,s,c){n.subVectors(t,r).addScalar(.5).multiply(o),void 0!==s?(i.x=c*n.x-s*n.y,i.y=s*n.x+c*n.y):i.copy(n),t.copy(e),t.x+=i.x,t.y+=i.y,t.applyMatrix4(a)}return function(n,i){e.setFromMatrixScale(this.matrixWorld),a.getInverse(this.modelViewMatrix).premultiply(this.matrixWorld),r.setFromMatrixPosition(this.modelViewMatrix);var d,f,m=this.material.rotation;0!==m&&(f=Math.cos(m),d=Math.sin(m));var g=this.center;p(o.set(-.5,-.5,0),r,g,e,d,f),p(s.set(.5,-.5,0),r,g,e,d,f),p(c.set(.5,.5,0),r,g,e,d,f),h.set(0,0),l.set(1,0),u.set(1,1);var v=n.ray.intersectTriangle(o,s,c,!1,t);if(null!==v||(p(s.set(-.5,.5,0),r,g,e,d,f),l.set(0,1),null!==(v=n.ray.intersectTriangle(o,c,s,!1,t)))){var y=n.ray.origin.distanceTo(t);y<n.near||y>n.far||i.push({distance:y,point:t.clone(),uv:Ln.getUV(t,o,s,c,h,l,u,new Ke),face:null,object:this})}}}(),clone:function(){return new this.constructor(this.material).copy(this)},copy:function(t){return Vr.prototype.copy.call(this,t),void 0!==t.center&&this.center.copy(t.center),this}}),Pa.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Pa,copy:function(t){Vr.prototype.copy.call(this,t,!1);for(var e=t.levels,r=0,n=e.length;r<n;r++){var i=e[r];this.addLevel(i.object.clone(),i.distance)}return this},addLevel:function(t,e){void 0===e&&(e=0),e=Math.abs(e);for(var r=this.levels,n=0;n<r.length&&!(e<r[n].distance);n++);r.splice(n,0,{distance:e,object:t}),this.add(t)},getObjectForDistance:function(t){for(var e=this.levels,r=1,n=e.length;r<n&&!(t<e[r].distance);r++);return e[r-1].object},raycast:(da=new er,function(t,e){da.setFromMatrixPosition(this.matrixWorld);var r=t.ray.origin.distanceTo(da);this.getObjectForDistance(r).raycast(t,e)}),update:function(){var t=new er,e=new er;return function(r){var n=this.levels;if(n.length>1){t.setFromMatrixPosition(r.matrixWorld),e.setFromMatrixPosition(this.matrixWorld);var i=t.distanceTo(e);n[0].object.visible=!0;for(var a=1,o=n.length;a<o&&i>=n[a].distance;a++)n[a-1].object.visible=!1,n[a].object.visible=!0;for(;a<o;a++)n[a].object.visible=!1}}}(),toJSON:function(t){var e=Vr.prototype.toJSON.call(this,t);e.object.levels=[];for(var r=this.levels,n=0,i=r.length;n<i;n++){var a=r[n];e.object.levels.push({object:a.object.uuid,distance:a.distance})}return e}}),Oa.prototype=Object.assign(Object.create(Cn.prototype),{constructor:Oa,isSkinnedMesh:!0,bind:function(t,e){this.skeleton=t,void 0===e&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.getInverse(e)},pose:function(){this.skeleton.pose()},normalizeSkinWeights:function(){for(var t=new ur,e=this.geometry.attributes.skinWeight,r=0,n=e.count;r<n;r++){t.x=e.getX(r),t.y=e.getY(r),t.z=e.getZ(r),t.w=e.getW(r);var i=1/t.manhattanLength();i!==1/0?t.multiplyScalar(i):t.set(1,0,0,0),e.setXYZW(r,t.x,t.y,t.z,t.w)}},updateMatrixWorld:function(t){Cn.prototype.updateMatrixWorld.call(this,t),"attached"===this.bindMode?this.bindMatrixInverse.getInverse(this.matrixWorld):"detached"===this.bindMode?this.bindMatrixInverse.getInverse(this.bindMatrix):console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)},clone:function(){return new this.constructor(this.geometry,this.material).copy(this)}}),Object.assign(Ia.prototype,{calculateInverses:function(){this.boneInverses=[];for(var t=0,e=this.bones.length;t<e;t++){var r=new $e;this.bones[t]&&r.getInverse(this.bones[t].matrixWorld),this.boneInverses.push(r)}},pose:function(){var t,e,r;for(e=0,r=this.bones.length;e<r;e++)(t=this.bones[e])&&t.matrixWorld.getInverse(this.boneInverses[e]);for(e=0,r=this.bones.length;e<r;e++)(t=this.bones[e])&&(t.parent&&t.parent.isBone?(t.matrix.getInverse(t.parent.matrixWorld),t.matrix.multiply(t.matrixWorld)):t.matrix.copy(t.matrixWorld),t.matrix.decompose(t.position,t.quaternion,t.scale))},update:(fa=new $e,ma=new $e,function(){for(var t=this.bones,e=this.boneInverses,r=this.boneMatrices,n=this.boneTexture,i=0,a=t.length;i<a;i++){var o=t[i]?t[i].matrixWorld:ma;fa.multiplyMatrices(o,e[i]),fa.toArray(r,16*i)}void 0!==n&&(n.needsUpdate=!0)}),clone:function(){return new Ia(this.bones,this.boneInverses)},getBoneByName:function(t){for(var e=0,r=this.bones.length;e<r;e++){var n=this.bones[e];if(n.name===t)return n}}}),Da.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Da,isBone:!0}),Na.prototype=Object.create(Sn.prototype),Na.prototype.constructor=Na,Na.prototype.isLineBasicMaterial=!0,Na.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this},Ba.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Ba,isLine:!0,computeLineDistances:(ga=new er,va=new er,function(){var t=this.geometry;if(t.isBufferGeometry)if(null===t.index){for(var e=t.attributes.position,r=[0],n=1,i=e.count;n<i;n++)ga.fromBufferAttribute(e,n-1),va.fromBufferAttribute(e,n),r[n]=r[n-1],r[n]+=ga.distanceTo(va);t.addAttribute("lineDistance",new en(r,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");else if(t.isGeometry){var a=t.vertices;for((r=t.lineDistances)[0]=0,n=1,i=a.length;n<i;n++)r[n]=r[n-1],r[n]+=a[n-1].distanceTo(a[n])}return this}),raycast:function(){var t=new $e,e=new An,r=new vr;return function(n,i){var a=n.linePrecision,o=this.geometry,s=this.matrixWorld;if(null===o.boundingSphere&&o.computeBoundingSphere(),r.copy(o.boundingSphere),r.applyMatrix4(s),r.radius+=a,!1!==n.ray.intersectsSphere(r)){t.getInverse(s),e.copy(n.ray).applyMatrix4(t);var c=a/((this.scale.x+this.scale.y+this.scale.z)/3),h=c*c,l=new er,u=new er,p=new er,d=new er,f=this&&this.isLineSegments?2:1;if(o.isBufferGeometry){var m=o.index,g=o.attributes.position.array;if(null!==m)for(var v=m.array,y=0,x=v.length-1;y<x;y+=f){var b=v[y],w=v[y+1];l.fromArray(g,3*b),u.fromArray(g,3*w),e.distanceSqToSegment(l,u,d,p)>h||(d.applyMatrix4(this.matrixWorld),(E=n.ray.origin.distanceTo(d))<n.near||E>n.far||i.push({distance:E,point:p.clone().applyMatrix4(this.matrixWorld),index:y,face:null,faceIndex:null,object:this}))}else for(y=0,x=g.length/3-1;y<x;y+=f)l.fromArray(g,3*y),u.fromArray(g,3*y+3),e.distanceSqToSegment(l,u,d,p)>h||(d.applyMatrix4(this.matrixWorld),(E=n.ray.origin.distanceTo(d))<n.near||E>n.far||i.push({distance:E,point:p.clone().applyMatrix4(this.matrixWorld),index:y,face:null,faceIndex:null,object:this}))}else if(o.isGeometry){var _=o.vertices,M=_.length;for(y=0;y<M-1;y+=f){var E;e.distanceSqToSegment(_[y],_[y+1],d,p)>h||(d.applyMatrix4(this.matrixWorld),(E=n.ray.origin.distanceTo(d))<n.near||E>n.far||i.push({distance:E,point:p.clone().applyMatrix4(this.matrixWorld),index:y,face:null,faceIndex:null,object:this}))}}}}}(),copy:function(t){return Vr.prototype.copy.call(this,t),this.geometry.copy(t.geometry),this.material.copy(t.material),this},clone:function(){return(new this.constructor).copy(this)}}),za.prototype=Object.assign(Object.create(Ba.prototype),{constructor:za,isLineSegments:!0,computeLineDistances:function(){var t=new er,e=new er;return function(){var r=this.geometry;if(r.isBufferGeometry)if(null===r.index){for(var n=r.attributes.position,i=[],a=0,o=n.count;a<o;a+=2)t.fromBufferAttribute(n,a),e.fromBufferAttribute(n,a+1),i[a]=0===a?0:i[a-1],i[a+1]=i[a]+t.distanceTo(e);r.addAttribute("lineDistance",new en(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");else if(r.isGeometry){var s=r.vertices;for(i=r.lineDistances,a=0,o=s.length;a<o;a+=2)t.copy(s[a]),e.copy(s[a+1]),i[a]=0===a?0:i[a-1],i[a+1]=i[a]+t.distanceTo(e)}return this}}()}),Ua.prototype=Object.assign(Object.create(Ba.prototype),{constructor:Ua,isLineLoop:!0}),Ga.prototype=Object.create(Sn.prototype),Ga.prototype.constructor=Ga,Ga.prototype.isPointsMaterial=!0,Ga.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this.map=t.map,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.morphTargets=t.morphTargets,this},Fa.prototype=Object.assign(Object.create(Vr.prototype),{constructor:Fa,isPoints:!0,raycast:function(){var t=new $e,e=new An,r=new vr;return function(n,i){var a=this,o=this.geometry,s=this.matrixWorld,c=n.params.Points.threshold;if(null===o.boundingSphere&&o.computeBoundingSphere(),r.copy(o.boundingSphere),r.applyMatrix4(s),r.radius+=c,!1!==n.ray.intersectsSphere(r)){t.getInverse(s),e.copy(n.ray).applyMatrix4(t);var h=c/((this.scale.x+this.scale.y+this.scale.z)/3),l=h*h,u=new er,p=new er;if(o.isBufferGeometry){var d=o.index,f=o.attributes.position.array;if(null!==d)for(var m=d.array,g=0,v=m.length;g<v;g++){var y=m[g];u.fromArray(f,3*y),w(u,y)}else{g=0;for(var x=f.length/3;g<x;g++)u.fromArray(f,3*g),w(u,g)}}else{var b=o.vertices;for(g=0,x=b.length;g<x;g++)w(b[g],g)}}function w(t,r){var o=e.distanceSqToPoint(t);if(o<l){e.closestPointToPoint(t,p),p.applyMatrix4(s);var c=n.ray.origin.distanceTo(p);if(c<n.near||c>n.far)return;i.push({distance:c,distanceToRay:Math.sqrt(o),point:p.clone(),index:r,face:null,object:a})}}}}(),clone:function(){return new this.constructor(this.geometry,this.material).copy(this)}}),Ha.prototype=Object.assign(Object.create(lr.prototype),{constructor:Ha,isVideoTexture:!0,update:function(){var t=this.image;t.readyState>=t.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}}),Va.prototype=Object.create(lr.prototype),Va.prototype.constructor=Va,Va.prototype.isCompressedTexture=!0,ja.prototype=Object.create(lr.prototype),ja.prototype.constructor=ja,ja.prototype.isCanvasTexture=!0,ka.prototype=Object.create(lr.prototype),ka.prototype.constructor=ka,ka.prototype.isDepthTexture=!0,Wa.prototype=Object.create(sn.prototype),Wa.prototype.constructor=Wa,qa.prototype=Object.create(qr.prototype),qa.prototype.constructor=qa,Xa.prototype=Object.create(sn.prototype),Xa.prototype.constructor=Xa,Ya.prototype=Object.create(qr.prototype),Ya.prototype.constructor=Ya,Ja.prototype=Object.create(sn.prototype),Ja.prototype.constructor=Ja,Za.prototype=Object.create(qr.prototype),Za.prototype.constructor=Za,Qa.prototype=Object.create(Ja.prototype),Qa.prototype.constructor=Qa,Ka.prototype=Object.create(qr.prototype),Ka.prototype.constructor=Ka,$a.prototype=Object.create(Ja.prototype),$a.prototype.constructor=$a,to.prototype=Object.create(qr.prototype),to.prototype.constructor=to,eo.prototype=Object.create(Ja.prototype),eo.prototype.constructor=eo,ro.prototype=Object.create(qr.prototype),ro.prototype.constructor=ro,no.prototype=Object.create(Ja.prototype),no.prototype.constructor=no,io.prototype=Object.create(qr.prototype),io.prototype.constructor=io,ao.prototype=Object.create(sn.prototype),ao.prototype.constructor=ao,oo.prototype=Object.create(qr.prototype),oo.prototype.constructor=oo,so.prototype=Object.create(sn.prototype),so.prototype.constructor=so,co.prototype=Object.create(qr.prototype),co.prototype.constructor=co,ho.prototype=Object.create(sn.prototype),ho.prototype.constructor=ho;function lo(t,e,r,n,i){var a,o;if(i===function(t,e,r,n){for(var i=0,a=e,o=r-n;a<r;a+=n)i+=(t[o]-t[a])*(t[a+1]+t[o+1]),o=a;return i}(t,e,r,n)>0)for(a=e;a<r;a+=n)o=Ro(a,t[a],t[a+1],o);else for(a=r-n;a>=e;a-=n)o=Ro(a,t[a],t[a+1],o);return o&&So(o,o.next)&&(Co(o),o=o.next),o}function uo(t,e){if(!t)return t;e||(e=t);var r,n=t;do{if(r=!1,n.steiner||!So(n,n.next)&&0!==Eo(n.prev,n,n.next))n=n.next;else{if(Co(n),(n=e=n.prev)===n.next)break;r=!0}}while(r||n!==e);return e}function po(t,e,r,n,i,a,o){if(t){!o&&a&&function(t,e,r,n){var i=t;do{null===i.z&&(i.z=bo(i.x,i.y,e,r,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next}while(i!==t);i.prevZ.nextZ=null,i.prevZ=null,function(t){var e,r,n,i,a,o,s,c,h=1;do{for(r=t,t=null,a=null,o=0;r;){for(o++,n=r,s=0,e=0;e<h&&(s++,n=n.nextZ);e++);for(c=h;s>0||c>0&&n;)0!==s&&(0===c||!n||r.z<=n.z)?(i=r,r=r.nextZ,s--):(i=n,n=n.nextZ,c--),a?a.nextZ=i:t=i,i.prevZ=a,a=i;r=n}a.nextZ=null,h*=2}while(o>1)}(i)}(t,n,i,a);for(var s,c,h=t;t.prev!==t.next;)if(s=t.prev,c=t.next,a?mo(t,n,i,a):fo(t))e.push(s.i/r),e.push(t.i/r),e.push(c.i/r),Co(t),t=c.next,h=c.next;else if((t=c)===h){o?1===o?po(t=go(t,e,r),e,r,n,i,a,2):2===o&&vo(t,e,r,n,i,a):po(uo(t),e,r,n,i,a,1);break}}}function fo(t){var e=t.prev,r=t,n=t.next;if(Eo(e,r,n)>=0)return!1;for(var i=t.next.next;i!==t.prev;){if(_o(e.x,e.y,r.x,r.y,n.x,n.y,i.x,i.y)&&Eo(i.prev,i,i.next)>=0)return!1;i=i.next}return!0}function mo(t,e,r,n){var i=t.prev,a=t,o=t.next;if(Eo(i,a,o)>=0)return!1;for(var s=i.x<a.x?i.x<o.x?i.x:o.x:a.x<o.x?a.x:o.x,c=i.y<a.y?i.y<o.y?i.y:o.y:a.y<o.y?a.y:o.y,h=i.x>a.x?i.x>o.x?i.x:o.x:a.x>o.x?a.x:o.x,l=i.y>a.y?i.y>o.y?i.y:o.y:a.y>o.y?a.y:o.y,u=bo(s,c,e,r,n),p=bo(h,l,e,r,n),d=t.nextZ;d&&d.z<=p;){if(d!==t.prev&&d!==t.next&&_o(i.x,i.y,a.x,a.y,o.x,o.y,d.x,d.y)&&Eo(d.prev,d,d.next)>=0)return!1;d=d.nextZ}for(d=t.prevZ;d&&d.z>=u;){if(d!==t.prev&&d!==t.next&&_o(i.x,i.y,a.x,a.y,o.x,o.y,d.x,d.y)&&Eo(d.prev,d,d.next)>=0)return!1;d=d.prevZ}return!0}function go(t,e,r){var n=t;do{var i=n.prev,a=n.next.next;!So(i,a)&&To(i,n,n.next,a)&&Ao(i,a)&&Ao(a,i)&&(e.push(i.i/r),e.push(n.i/r),e.push(a.i/r),Co(n),Co(n.next),n=t=a),n=n.next}while(n!==t);return n}function vo(t,e,r,n,i,a){var o=t;do{for(var s=o.next.next;s!==o.prev;){if(o.i!==s.i&&Mo(o,s)){var c=Lo(o,s);return o=uo(o,o.next),c=uo(c,c.next),po(o,e,r,n,i,a),void po(c,e,r,n,i,a)}s=s.next}o=o.next}while(o!==t)}function yo(t,e){return t.x-e.x}function xo(t,e){if(e=function(t,e){var r,n=e,i=t.x,a=t.y,o=-1/0;do{if(a<=n.y&&a>=n.next.y&&n.next.y!==n.y){var s=n.x+(a-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(s<=i&&s>o){if(o=s,s===i){if(a===n.y)return n;if(a===n.next.y)return n.next}r=n.x<n.next.x?n:n.next}}n=n.next}while(n!==e);if(!r)return null;if(i===o)return r.prev;var c,h=r,l=r.x,u=r.y,p=1/0;for(n=r.next;n!==h;)i>=n.x&&n.x>=l&&i!==n.x&&_o(a<u?i:o,a,l,u,a<u?o:i,a,n.x,n.y)&&((c=Math.abs(a-n.y)/(i-n.x))<p||c===p&&n.x>r.x)&&Ao(n,t)&&(r=n,p=c),n=n.next;return r}(t,e),e){var r=Lo(e,t);uo(r,r.next)}}function bo(t,e,r,n,i){return(t=1431655765&((t=858993459&((t=252645135&((t=16711935&((t=32767*(t-r)*i)|t<<8))|t<<4))|t<<2))|t<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=32767*(e-n)*i)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function wo(t){var e=t,r=t;do{e.x<r.x&&(r=e),e=e.next}while(e!==t);return r}function _o(t,e,r,n,i,a,o,s){return(i-o)*(e-s)-(t-o)*(a-s)>=0&&(t-o)*(n-s)-(r-o)*(e-s)>=0&&(r-o)*(a-s)-(i-o)*(n-s)>=0}function Mo(t,e){return t.next.i!==e.i&&t.prev.i!==e.i&&!function(t,e){var r=t;do{if(r.i!==t.i&&r.next.i!==t.i&&r.i!==e.i&&r.next.i!==e.i&&To(r,r.next,t,e))return!0;r=r.next}while(r!==t);return!1}(t,e)&&Ao(t,e)&&Ao(e,t)&&function(t,e){var r=t,n=!1,i=(t.x+e.x)/2,a=(t.y+e.y)/2;do{r.y>a!=r.next.y>a&&r.next.y!==r.y&&i<(r.next.x-r.x)*(a-r.y)/(r.next.y-r.y)+r.x&&(n=!n),r=r.next}while(r!==t);return n}(t,e)}function Eo(t,e,r){return(e.y-t.y)*(r.x-e.x)-(e.x-t.x)*(r.y-e.y)}function So(t,e){return t.x===e.x&&t.y===e.y}function To(t,e,r,n){return!!(So(t,e)&&So(r,n)||So(t,n)&&So(r,e))||Eo(t,e,r)>0!=Eo(t,e,n)>0&&Eo(r,n,t)>0!=Eo(r,n,e)>0}function Ao(t,e){return Eo(t.prev,t,t.next)<0?Eo(t,e,t.next)>=0&&Eo(t,t.prev,e)>=0:Eo(t,e,t.prev)<0||Eo(t,t.next,e)<0}function Lo(t,e){var r=new Po(t.i,t.x,t.y),n=new Po(e.i,e.x,e.y),i=t.next,a=e.prev;return t.next=e,e.prev=t,r.next=i,i.prev=r,n.next=r,r.prev=n,a.next=n,n.prev=a,n}function Ro(t,e,r,n){var i=new Po(t,e,r);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Co(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ)}function Po(t,e,r){this.i=t,this.x=e,this.y=r,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1}var Oo={area:function(t){for(var e=t.length,r=0,n=e-1,i=0;i<e;n=i++)r+=t[n].x*t[i].y-t[i].x*t[n].y;return.5*r},isClockWise:function(t){return Oo.area(t)<0},triangulateShape:function(t,e){var r=[],n=[],i=[];Io(t),Do(r,t);var a=t.length;e.forEach(Io);for(var o=0;o<e.length;o++)n.push(a),a+=e[o].length,Do(r,e[o]);var s=function(t,e,r){r=r||2;var n,i,a,o,s,c,h,l=e&&e.length,u=l?e[0]*r:t.length,p=lo(t,0,u,r,!0),d=[];if(!p)return d;if(l&&(p=function(t,e,r,n){var i,a,o,s=[];for(i=0,a=e.length;i<a;i++)(o=lo(t,e[i]*n,i<a-1?e[i+1]*n:t.length,n,!1))===o.next&&(o.steiner=!0),s.push(wo(o));for(s.sort(yo),i=0;i<s.length;i++)xo(s[i],r),r=uo(r,r.next);return r}(t,e,p,r)),t.length>80*r){n=a=t[0],i=o=t[1];for(var f=r;f<u;f+=r)(s=t[f])<n&&(n=s),(c=t[f+1])<i&&(i=c),s>a&&(a=s),c>o&&(o=c);h=0!==(h=Math.max(a-n,o-i))?1/h:0}return po(p,d,r,n,i,h),d}(r,n);for(o=0;o<s.length;o+=3)i.push(s.slice(o,o+3));return i}};function Io(t){var e=t.length;e>2&&t[e-1].equals(t[0])&&t.pop()}function Do(t,e){for(var r=0;r<e.length;r++)t.push(e[r].x),t.push(e[r].y)}function No(t,e){qr.call(this),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},this.fromBufferGeometry(new Bo(t,e)),this.mergeVertices()}function Bo(t,e){sn.call(this),this.type="ExtrudeBufferGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];for(var r=this,n=[],i=[],a=0,o=t.length;a<o;a++)s(t[a]);function s(t){var a=[],o=void 0!==e.curveSegments?e.curveSegments:12,s=void 0!==e.steps?e.steps:1,c=void 0!==e.depth?e.depth:100,h=void 0===e.bevelEnabled||e.bevelEnabled,l=void 0!==e.bevelThickness?e.bevelThickness:6,u=void 0!==e.bevelSize?e.bevelSize:l-2,p=void 0!==e.bevelSegments?e.bevelSegments:3,d=e.extrudePath,f=void 0!==e.UVGenerator?e.UVGenerator:zo;void 0!==e.amount&&(console.warn("THREE.ExtrudeBufferGeometry: amount has been renamed to depth."),c=e.amount);var m,g,v,y,x,b,w,_,M=!1;d&&(m=d.getSpacedPoints(s),M=!0,h=!1,g=d.computeFrenetFrames(s,!1),v=new er,y=new er,x=new er),h||(p=0,l=0,u=0);var E=t.extractPoints(o),S=E.shape,T=E.holes;if(!Oo.isClockWise(S))for(S=S.reverse(),w=0,_=T.length;w<_;w++)b=T[w],Oo.isClockWise(b)&&(T[w]=b.reverse());var A=Oo.triangulateShape(S,T),L=S;for(w=0,_=T.length;w<_;w++)b=T[w],S=S.concat(b);function R(t,e,r){return e||console.error("THREE.ExtrudeGeometry: vec does not exist"),e.clone().multiplyScalar(r).add(t)}var C,P,O,I,D,N,B=S.length,z=A.length;function U(t,e,r){var n,i,a,o=t.x-e.x,s=t.y-e.y,c=r.x-t.x,h=r.y-t.y,l=o*o+s*s,u=o*h-s*c;if(Math.abs(u)>Number.EPSILON){var p=Math.sqrt(l),d=Math.sqrt(c*c+h*h),f=e.x-s/p,m=e.y+o/p,g=((r.x-h/d-f)*h-(r.y+c/d-m)*c)/(o*h-s*c),v=(n=f+o*g-t.x)*n+(i=m+s*g-t.y)*i;if(v<=2)return new Ke(n,i);a=Math.sqrt(v/2)}else{var y=!1;o>Number.EPSILON?c>Number.EPSILON&&(y=!0):o<-Number.EPSILON?c<-Number.EPSILON&&(y=!0):Math.sign(s)===Math.sign(h)&&(y=!0),y?(n=-s,i=o,a=Math.sqrt(l)):(n=o,i=s,a=Math.sqrt(l/2))}return new Ke(n/a,i/a)}for(var G=[],F=0,H=L.length,V=H-1,j=F+1;F<H;F++,V++,j++)V===H&&(V=0),j===H&&(j=0),G[F]=U(L[F],L[V],L[j]);var k,W,q=[],X=G.concat();for(w=0,_=T.length;w<_;w++){for(b=T[w],k=[],F=0,V=(H=b.length)-1,j=F+1;F<H;F++,V++,j++)V===H&&(V=0),j===H&&(j=0),k[F]=U(b[F],b[V],b[j]);q.push(k),X=X.concat(k)}for(C=0;C<p;C++){for(O=C/p,I=l*Math.cos(O*Math.PI/2),P=u*Math.sin(O*Math.PI/2),F=0,H=L.length;F<H;F++)J((D=R(L[F],G[F],P)).x,D.y,-I);for(w=0,_=T.length;w<_;w++)for(b=T[w],k=q[w],F=0,H=b.length;F<H;F++)J((D=R(b[F],k[F],P)).x,D.y,-I)}for(P=u,F=0;F<B;F++)D=h?R(S[F],X[F],P):S[F],M?(y.copy(g.normals[0]).multiplyScalar(D.x),v.copy(g.binormals[0]).multiplyScalar(D.y),x.copy(m[0]).add(y).add(v),J(x.x,x.y,x.z)):J(D.x,D.y,0);for(W=1;W<=s;W++)for(F=0;F<B;F++)D=h?R(S[F],X[F],P):S[F],M?(y.copy(g.normals[W]).multiplyScalar(D.x),v.copy(g.binormals[W]).multiplyScalar(D.y),x.copy(m[W]).add(y).add(v),J(x.x,x.y,x.z)):J(D.x,D.y,c/s*W);for(C=p-1;C>=0;C--){for(O=C/p,I=l*Math.cos(O*Math.PI/2),P=u*Math.sin(O*Math.PI/2),F=0,H=L.length;F<H;F++)J((D=R(L[F],G[F],P)).x,D.y,c+I);for(w=0,_=T.length;w<_;w++)for(b=T[w],k=q[w],F=0,H=b.length;F<H;F++)D=R(b[F],k[F],P),M?J(D.x,D.y+m[s-1].y,m[s-1].x+I):J(D.x,D.y,c+I)}function Y(t,e){var r,n;for(F=t.length;--F>=0;){r=F,(n=F-1)<0&&(n=t.length-1);var i=0,a=s+2*p;for(i=0;i<a;i++){var o=B*i,c=B*(i+1);Q(e+r+o,e+n+o,e+n+c,e+r+c)}}}function J(t,e,r){a.push(t),a.push(e),a.push(r)}function Z(t,e,i){K(t),K(e),K(i);var a=n.length/3,o=f.generateTopUV(r,n,a-3,a-2,a-1);$(o[0]),$(o[1]),$(o[2])}function Q(t,e,i,a){K(t),K(e),K(a),K(e),K(i),K(a);var o=n.length/3,s=f.generateSideWallUV(r,n,o-6,o-3,o-2,o-1);$(s[0]),$(s[1]),$(s[3]),$(s[1]),$(s[2]),$(s[3])}function K(t){n.push(a[3*t+0]),n.push(a[3*t+1]),n.push(a[3*t+2])}function $(t){i.push(t.x),i.push(t.y)}!function(){var t=n.length/3;if(h){var e=0,i=B*e;for(F=0;F<z;F++)Z((N=A[F])[2]+i,N[1]+i,N[0]+i);for(i=B*(e=s+2*p),F=0;F<z;F++)Z((N=A[F])[0]+i,N[1]+i,N[2]+i)}else{for(F=0;F<z;F++)Z((N=A[F])[2],N[1],N[0]);for(F=0;F<z;F++)Z((N=A[F])[0]+B*s,N[1]+B*s,N[2]+B*s)}r.addGroup(t,n.length/3-t,0)}(),function(){var t=n.length/3,e=0;for(Y(L,e),e+=L.length,w=0,_=T.length;w<_;w++)Y(b=T[w],e),e+=b.length;r.addGroup(t,n.length/3-t,1)}()}this.addAttribute("position",new en(n,3)),this.addAttribute("uv",new en(i,2)),this.computeVertexNormals()}No.prototype=Object.create(qr.prototype),No.prototype.constructor=No,No.prototype.toJSON=function(){var t=qr.prototype.toJSON.call(this);return Uo(this.parameters.shapes,this.parameters.options,t)},Bo.prototype=Object.create(sn.prototype),Bo.prototype.constructor=Bo,Bo.prototype.toJSON=function(){var t=sn.prototype.toJSON.call(this);return Uo(this.parameters.shapes,this.parameters.options,t)};var zo={generateTopUV:function(t,e,r,n,i){var a=e[3*r],o=e[3*r+1],s=e[3*n],c=e[3*n+1],h=e[3*i],l=e[3*i+1];return[new Ke(a,o),new Ke(s,c),new Ke(h,l)]},generateSideWallUV:function(t,e,r,n,i,a){var o=e[3*r],s=e[3*r+1],c=e[3*r+2],h=e[3*n],l=e[3*n+1],u=e[3*n+2],p=e[3*i],d=e[3*i+1],f=e[3*i+2],m=e[3*a],g=e[3*a+1],v=e[3*a+2];return Math.abs(s-l)<.01?[new Ke(o,1-c),new Ke(h,1-u),new Ke(p,1-f),new Ke(m,1-v)]:[new Ke(s,1-c),new Ke(l,1-u),new Ke(d,1-f),new Ke(g,1-v)]}};function Uo(t,e,r){if(r.shapes=[],Array.isArray(t))for(var n=0,i=t.length;n<i;n++){var a=t[n];r.shapes.push(a.uuid)}else r.shapes.push(t.uuid);return void 0!==e.extrudePath&&(r.options.extrudePath=e.extrudePath.toJSON()),r}function Go(t,e){qr.call(this),this.type="TextGeometry",this.parameters={text:t,parameters:e},this.fromBufferGeometry(new Fo(t,e)),this.mergeVertices()}function Fo(t,e){var r=(e=e||{}).font;if(!r||!r.isFont)return console.error("THREE.TextGeometry: font parameter is not an instance of THREE.Font."),new qr;var n=r.generateShapes(t,e.size);e.depth=void 0!==e.height?e.height:50,void 0===e.bevelThickness&&(e.bevelThickness=10),void 0===e.bevelSize&&(e.bevelSize=8),void 0===e.bevelEnabled&&(e.bevelEnabled=!1),Bo.call(this,n,e),this.type="TextBufferGeometry"}function Ho(t,e,r,n,i,a,o){qr.call(this),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:r,phiStart:n,phiLength:i,thetaStart:a,thetaLength:o},this.fromBufferGeometry(new Vo(t,e,r,n,i,a,o)),this.mergeVertices()}function Vo(t,e,r,n,i,a,o){sn.call(this),this.type="SphereBufferGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:r,phiStart:n,phiLength:i,thetaStart:a,thetaLength:o},t=t||1,e=Math.max(3,Math.floor(e)||8),r=Math.max(2,Math.floor(r)||6),n=void 0!==n?n:0,i=void 0!==i?i:2*Math.PI;var s,c,h=(a=void 0!==a?a:0)+(o=void 0!==o?o:Math.PI),l=0,u=[],p=new er,d=new er,f=[],m=[],g=[],v=[];for(c=0;c<=r;c++){var y=[],x=c/r;for(s=0;s<=e;s++){var b=s/e;p.x=-t*Math.cos(n+b*i)*Math.sin(a+x*o),p.y=t*Math.cos(a+x*o),p.z=t*Math.sin(n+b*i)*Math.sin(a+x*o),m.push(p.x,p.y,p.z),d.set(p.x,p.y,p.z).normalize(),g.push(d.x,d.y,d.z),v.push(b,1-x),y.push(l++)}u.push(y)}for(c=0;c<r;c++)for(s=0;s<e;s++){var w=u[c][s+1],_=u[c][s],M=u[c+1][s],E=u[c+1][s+1];(0!==c||a>0)&&f.push(w,_,E),(c!==r-1||h<Math.PI)&&f.push(_,M,E)}this.setIndex(f),this.addAttribute("position",new en(m,3)),this.addAttribute("normal",new en(g,3)),this.addAttribute("uv",new en(v,2))}function jo(t,e,r,n,i,a){qr.call(this),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:r,phiSegments:n,thetaStart:i,thetaLength:a},this.fromBufferGeometry(new ko(t,e,r,n,i,a)),this.mergeVertices()}function ko(t,e,r,n,i,a){sn.call(this),this.type="RingBufferGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:r,phiSegments:n,thetaStart:i,thetaLength:a},t=t||.5,e=e||1,i=void 0!==i?i:0,a=void 0!==a?a:2*Math.PI,r=void 0!==r?Math.max(3,r):8;var o,s,c,h=[],l=[],u=[],p=[],d=t,f=(e-t)/(n=void 0!==n?Math.max(1,n):1),m=new er,g=new Ke;for(s=0;s<=n;s++){for(c=0;c<=r;c++)o=i+c/r*a,m.x=d*Math.cos(o),m.y=d*Math.sin(o),l.push(m.x,m.y,m.z),u.push(0,0,1),g.x=(m.x/e+1)/2,g.y=(m.y/e+1)/2,p.push(g.x,g.y);d+=f}for(s=0;s<n;s++){var v=s*(r+1);for(c=0;c<r;c++){var y=o=c+v,x=o+r+1,b=o+r+2,w=o+1;h.push(y,x,w),h.push(x,b,w)}}this.setIndex(h),this.addAttribute("position",new en(l,3)),this.addAttribute("normal",new en(u,3)),this.addAttribute("uv",new en(p,2))}function Wo(t,e,r,n){qr.call(this),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:r,phiLength:n},this.fromBufferGeometry(new qo(t,e,r,n)),this.mergeVertices()}function qo(t,e,r,n){sn.call(this),this.type="LatheBufferGeometry",this.parameters={points:t,segments:e,phiStart:r,phiLength:n},e=Math.floor(e)||12,r=r||0,n=n||2*Math.PI,n=Qe.clamp(n,0,2*Math.PI);var i,a,o,s=[],c=[],h=[],l=1/e,u=new er,p=new Ke;for(a=0;a<=e;a++){var d=r+a*l*n,f=Math.sin(d),m=Math.cos(d);for(o=0;o<=t.length-1;o++)u.x=t[o].x*f,u.y=t[o].y,u.z=t[o].x*m,c.push(u.x,u.y,u.z),p.x=a/e,p.y=o/(t.length-1),h.push(p.x,p.y)}for(a=0;a<e;a++)for(o=0;o<t.length-1;o++){var g=i=o+a*t.length,v=i+t.length,y=i+t.length+1,x=i+1;s.push(g,v,x),s.push(v,y,x)}if(this.setIndex(s),this.addAttribute("position",new en(c,3)),this.addAttribute("uv",new en(h,2)),this.computeVertexNormals(),n===2*Math.PI){var b=this.attributes.normal.array,w=new er,_=new er,M=new er;for(i=e*t.length*3,a=0,o=0;a<t.length;a++,o+=3)w.x=b[o+0],w.y=b[o+1],w.z=b[o+2],_.x=b[i+o+0],_.y=b[i+o+1],_.z=b[i+o+2],M.addVectors(w,_).normalize(),b[o+0]=b[i+o+0]=M.x,b[o+1]=b[i+o+1]=M.y,b[o+2]=b[i+o+2]=M.z}}function Xo(t,e){qr.call(this),this.type="ShapeGeometry","object"==typeof e&&(console.warn("THREE.ShapeGeometry: Options parameter has been removed."),e=e.curveSegments),this.parameters={shapes:t,curveSegments:e},this.fromBufferGeometry(new Yo(t,e)),this.mergeVertices()}function Yo(t,e){sn.call(this),this.type="ShapeBufferGeometry",this.parameters={shapes:t,curveSegments:e},e=e||12;var r=[],n=[],i=[],a=[],o=0,s=0;if(!1===Array.isArray(t))h(t);else for(var c=0;c<t.length;c++)h(t[c]),this.addGroup(o,s,c),o+=s,s=0;function h(t){var o,c,h,l=n.length/3,u=t.extractPoints(e),p=u.shape,d=u.holes;for(!1===Oo.isClockWise(p)&&(p=p.reverse()),o=0,c=d.length;o<c;o++)h=d[o],!0===Oo.isClockWise(h)&&(d[o]=h.reverse());var f=Oo.triangulateShape(p,d);for(o=0,c=d.length;o<c;o++)h=d[o],p=p.concat(h);for(o=0,c=p.length;o<c;o++){var m=p[o];n.push(m.x,m.y,0),i.push(0,0,1),a.push(m.x,m.y)}for(o=0,c=f.length;o<c;o++){var g=f[o],v=g[0]+l,y=g[1]+l,x=g[2]+l;r.push(v,y,x),s+=3}}this.setIndex(r),this.addAttribute("position",new en(n,3)),this.addAttribute("normal",new en(i,3)),this.addAttribute("uv",new en(a,2))}function Jo(t,e){if(e.shapes=[],Array.isArray(t))for(var r=0,n=t.length;r<n;r++){var i=t[r];e.shapes.push(i.uuid)}else e.shapes.push(t.uuid);return e}function Zo(t,e){sn.call(this),this.type="EdgesGeometry",this.parameters={thresholdAngle:e},e=void 0!==e?e:1;var r,n,i,a,o=[],s=Math.cos(Qe.DEG2RAD*e),c=[0,0],h={},l=["a","b","c"];t.isBufferGeometry?(a=new qr).fromBufferGeometry(t):a=t.clone(),a.mergeVertices(),a.computeFaceNormals();for(var u=a.vertices,p=a.faces,d=0,f=p.length;d<f;d++)for(var m=p[d],g=0;g<3;g++)r=m[l[g]],n=m[l[(g+1)%3]],c[0]=Math.min(r,n),c[1]=Math.max(r,n),void 0===h[i=c[0]+","+c[1]]?h[i]={index1:c[0],index2:c[1],face1:d,face2:void 0}:h[i].face2=d;for(i in h){var v=h[i];if(void 0===v.face2||p[v.face1].normal.dot(p[v.face2].normal)<=s){var y=u[v.index1];o.push(y.x,y.y,y.z),y=u[v.index2],o.push(y.x,y.y,y.z)}}this.addAttribute("position",new en(o,3))}function Qo(t,e,r,n,i,a,o,s){qr.call(this),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:r,radialSegments:n,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s},this.fromBufferGeometry(new Ko(t,e,r,n,i,a,o,s)),this.mergeVertices()}function Ko(t,e,r,n,i,a,o,s){sn.call(this),this.type="CylinderBufferGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:r,radialSegments:n,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};var c=this;t=void 0!==t?t:1,e=void 0!==e?e:1,r=r||1,n=Math.floor(n)||8,i=Math.floor(i)||1,a=void 0!==a&&a,o=void 0!==o?o:0,s=void 0!==s?s:2*Math.PI;var h=[],l=[],u=[],p=[],d=0,f=[],m=r/2,g=0;function v(r){var i,a,f,v=new Ke,y=new er,x=0,b=!0===r?t:e,w=!0===r?1:-1;for(a=d,i=1;i<=n;i++)l.push(0,m*w,0),u.push(0,w,0),p.push(.5,.5),d++;for(f=d,i=0;i<=n;i++){var _=i/n*s+o,M=Math.cos(_),E=Math.sin(_);y.x=b*E,y.y=m*w,y.z=b*M,l.push(y.x,y.y,y.z),u.push(0,w,0),v.x=.5*M+.5,v.y=.5*E*w+.5,p.push(v.x,v.y),d++}for(i=0;i<n;i++){var S=a+i,T=f+i;!0===r?h.push(T,T+1,S):h.push(T+1,T,S),x+=3}c.addGroup(g,x,!0===r?1:2),g+=x}!function(){var a,v,y=new er,x=new er,b=0,w=(e-t)/r;for(v=0;v<=i;v++){var _=[],M=v/i,E=M*(e-t)+t;for(a=0;a<=n;a++){var S=a/n,T=S*s+o,A=Math.sin(T),L=Math.cos(T);x.x=E*A,x.y=-M*r+m,x.z=E*L,l.push(x.x,x.y,x.z),y.set(A,w,L).normalize(),u.push(y.x,y.y,y.z),p.push(S,1-M),_.push(d++)}f.push(_)}for(a=0;a<n;a++)for(v=0;v<i;v++){var R=f[v][a],C=f[v+1][a],P=f[v+1][a+1],O=f[v][a+1];h.push(R,C,O),h.push(C,P,O),b+=6}c.addGroup(g,b,0),g+=b}(),!1===a&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(h),this.addAttribute("position",new en(l,3)),this.addAttribute("normal",new en(u,3)),this.addAttribute("uv",new en(p,2))}function $o(t,e,r,n,i,a,o){Qo.call(this,0,t,e,r,n,i,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:r,heightSegments:n,openEnded:i,thetaStart:a,thetaLength:o}}function ts(t,e,r,n,i,a,o){Ko.call(this,0,t,e,r,n,i,a,o),this.type="ConeBufferGeometry",this.parameters={radius:t,height:e,radialSegments:r,heightSegments:n,openEnded:i,thetaStart:a,thetaLength:o}}function es(t,e,r,n){qr.call(this),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:r,thetaLength:n},this.fromBufferGeometry(new rs(t,e,r,n)),this.mergeVertices()}function rs(t,e,r,n){sn.call(this),this.type="CircleBufferGeometry",this.parameters={radius:t,segments:e,thetaStart:r,thetaLength:n},t=t||1,e=void 0!==e?Math.max(3,e):8,r=void 0!==r?r:0,n=void 0!==n?n:2*Math.PI;var i,a,o=[],s=[],c=[],h=[],l=new er,u=new Ke;for(s.push(0,0,0),c.push(0,0,1),h.push(.5,.5),a=0,i=3;a<=e;a++,i+=3){var p=r+a/e*n;l.x=t*Math.cos(p),l.y=t*Math.sin(p),s.push(l.x,l.y,l.z),c.push(0,0,1),u.x=(s[i]/t+1)/2,u.y=(s[i+1]/t+1)/2,h.push(u.x,u.y)}for(i=1;i<=e;i++)o.push(i,i+1,0);this.setIndex(o),this.addAttribute("position",new en(s,3)),this.addAttribute("normal",new en(c,3)),this.addAttribute("uv",new en(h,2))}Go.prototype=Object.create(qr.prototype),Go.prototype.constructor=Go,Fo.prototype=Object.create(Bo.prototype),Fo.prototype.constructor=Fo,Ho.prototype=Object.create(qr.prototype),Ho.prototype.constructor=Ho,Vo.prototype=Object.create(sn.prototype),Vo.prototype.constructor=Vo,jo.prototype=Object.create(qr.prototype),jo.prototype.constructor=jo,ko.prototype=Object.create(sn.prototype),ko.prototype.constructor=ko,Wo.prototype=Object.create(qr.prototype),Wo.prototype.constructor=Wo,qo.prototype=Object.create(sn.prototype),qo.prototype.constructor=qo,Xo.prototype=Object.create(qr.prototype),Xo.prototype.constructor=Xo,Xo.prototype.toJSON=function(){var t=qr.prototype.toJSON.call(this);return Jo(this.parameters.shapes,t)},Yo.prototype=Object.create(sn.prototype),Yo.prototype.constructor=Yo,Yo.prototype.toJSON=function(){var t=sn.prototype.toJSON.call(this);return Jo(this.parameters.shapes,t)},Zo.prototype=Object.create(sn.prototype),Zo.prototype.constructor=Zo,Qo.prototype=Object.create(qr.prototype),Qo.prototype.constructor=Qo,Ko.prototype=Object.create(sn.prototype),Ko.prototype.constructor=Ko,$o.prototype=Object.create(Qo.prototype),$o.prototype.constructor=$o,ts.prototype=Object.create(Ko.prototype),ts.prototype.constructor=ts,es.prototype=Object.create(qr.prototype),es.prototype.constructor=es,rs.prototype=Object.create(sn.prototype),rs.prototype.constructor=rs;var ns=Object.freeze({WireframeGeometry:Wa,ParametricGeometry:qa,ParametricBufferGeometry:Xa,TetrahedronGeometry:Za,TetrahedronBufferGeometry:Qa,OctahedronGeometry:Ka,OctahedronBufferGeometry:$a,IcosahedronGeometry:to,IcosahedronBufferGeometry:eo,DodecahedronGeometry:ro,DodecahedronBufferGeometry:no,PolyhedronGeometry:Ya,PolyhedronBufferGeometry:Ja,TubeGeometry:io,TubeBufferGeometry:ao,TorusKnotGeometry:oo,TorusKnotBufferGeometry:so,TorusGeometry:co,TorusBufferGeometry:ho,TextGeometry:Go,TextBufferGeometry:Fo,SphereGeometry:Ho,SphereBufferGeometry:Vo,RingGeometry:jo,RingBufferGeometry:ko,PlaneGeometry:ln,PlaneBufferGeometry:un,LatheGeometry:Wo,LatheBufferGeometry:qo,ShapeGeometry:Xo,ShapeBufferGeometry:Yo,ExtrudeGeometry:No,ExtrudeBufferGeometry:Bo,EdgesGeometry:Zo,ConeGeometry:$o,ConeBufferGeometry:ts,CylinderGeometry:Qo,CylinderBufferGeometry:Ko,CircleGeometry:es,CircleBufferGeometry:rs,BoxGeometry:cn,BoxBufferGeometry:hn});function is(t){Sn.call(this),this.type="ShadowMaterial",this.color=new Lr(0),this.transparent=!0,this.setValues(t)}function as(t){Tn.call(this,t),this.type="RawShaderMaterial"}function os(t){Sn.call(this),this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Lr(16777215),this.roughness=.5,this.metalness=.5,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lr(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Je,this.normalScale=new Ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.skinning=!1,this.morphTargets=!1,this.morphNormals=!1,this.setValues(t)}function ss(t){os.call(this),this.defines={PHYSICAL:""},this.type="MeshPhysicalMaterial",this.reflectivity=.5,this.clearCoat=0,this.clearCoatRoughness=0,this.setValues(t)}function cs(t){Sn.call(this),this.type="MeshPhongMaterial",this.color=new Lr(16777215),this.specular=new Lr(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lr(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Je,this.normalScale=new Ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=ut,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.skinning=!1,this.morphTargets=!1,this.morphNormals=!1,this.setValues(t)}function hs(t){cs.call(this),this.defines={TOON:""},this.type="MeshToonMaterial",this.gradientMap=null,this.setValues(t)}function ls(t){Sn.call(this),this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Je,this.normalScale=new Ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.skinning=!1,this.morphTargets=!1,this.morphNormals=!1,this.setValues(t)}function us(t){Sn.call(this),this.type="MeshLambertMaterial",this.color=new Lr(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lr(0),this.emissiveIntensity=1,this.emissiveMap=null,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=ut,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.skinning=!1,this.morphTargets=!1,this.morphNormals=!1,this.setValues(t)}function ps(t){Sn.call(this),this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new Lr(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Je,this.normalScale=new Ke(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.skinning=!1,this.morphTargets=!1,this.morphNormals=!1,this.lights=!1,this.setValues(t)}function ds(t){Na.call(this),this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}is.prototype=Object.create(Sn.prototype),is.prototype.constructor=is,is.prototype.isShadowMaterial=!0,is.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this},as.prototype=Object.create(Tn.prototype),as.prototype.constructor=as,as.prototype.isRawShaderMaterial=!0,os.prototype=Object.create(Sn.prototype),os.prototype.constructor=os,os.prototype.isMeshStandardMaterial=!0,os.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.morphNormals=t.morphNormals,this},ss.prototype=Object.create(os.prototype),ss.prototype.constructor=ss,ss.prototype.isMeshPhysicalMaterial=!0,ss.prototype.copy=function(t){return os.prototype.copy.call(this,t),this.defines={PHYSICAL:""},this.reflectivity=t.reflectivity,this.clearCoat=t.clearCoat,this.clearCoatRoughness=t.clearCoatRoughness,this},cs.prototype=Object.create(Sn.prototype),cs.prototype.constructor=cs,cs.prototype.isMeshPhongMaterial=!0,cs.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.morphNormals=t.morphNormals,this},hs.prototype=Object.create(cs.prototype),hs.prototype.constructor=hs,hs.prototype.isMeshToonMaterial=!0,hs.prototype.copy=function(t){return cs.prototype.copy.call(this,t),this.gradientMap=t.gradientMap,this},ls.prototype=Object.create(Sn.prototype),ls.prototype.constructor=ls,ls.prototype.isMeshNormalMaterial=!0,ls.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.morphNormals=t.morphNormals,this},us.prototype=Object.create(Sn.prototype),us.prototype.constructor=us,us.prototype.isMeshLambertMaterial=!0,us.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.morphNormals=t.morphNormals,this},ps.prototype=Object.create(Sn.prototype),ps.prototype.constructor=ps,ps.prototype.isMeshMatcapMaterial=!0,ps.prototype.copy=function(t){return Sn.prototype.copy.call(this,t),this.defines={MATCAP:""},this.color.copy(t.color),this.matcap=t.matcap,this.map=t.map,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.skinning=t.skinning,this.morphTargets=t.morphTargets,this.morphNormals=t.morphNormals,this},ds.prototype=Object.create(Na.prototype),ds.prototype.constructor=ds,ds.prototype.isLineDashedMaterial=!0,ds.prototype.copy=function(t){return Na.prototype.copy.call(this,t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this};var fs=Object.freeze({ShadowMaterial:is,SpriteMaterial:Ra,RawShaderMaterial:as,ShaderMaterial:Tn,PointsMaterial:Ga,MeshPhysicalMaterial:ss,MeshStandardMaterial:os,MeshPhongMaterial:cs,MeshToonMaterial:hs,MeshNormalMaterial:ls,MeshLambertMaterial:us,MeshDepthMaterial:ra,MeshDistanceMaterial:na,MeshBasicMaterial:Rn,MeshMatcapMaterial:ps,LineDashedMaterial:ds,LineBasicMaterial:Na,Material:Sn}),ms={arraySlice:function(t,e,r){return ms.isTypedArray(t)?new t.constructor(t.subarray(e,void 0!==r?r:t.length)):t.slice(e,r)},convertArray:function(t,e,r){return!t||!r&&t.constructor===e?t:"number"==typeof e.BYTES_PER_ELEMENT?new e(t):Array.prototype.slice.call(t)},isTypedArray:function(t){return ArrayBuffer.isView(t)&&!(t instanceof DataView)},getKeyframeOrder:function(t){for(var e=t.length,r=new Array(e),n=0;n!==e;++n)r[n]=n;return r.sort((function(e,r){return t[e]-t[r]})),r},sortedArray:function(t,e,r){for(var n=t.length,i=new t.constructor(n),a=0,o=0;o!==n;++a)for(var s=r[a]*e,c=0;c!==e;++c)i[o++]=t[s+c];return i},flattenJSON:function(t,e,r,n){for(var i=1,a=t[0];void 0!==a&&void 0===a[n];)a=t[i++];if(void 0!==a){var o=a[n];if(void 0!==o)if(Array.isArray(o))do{void 0!==(o=a[n])&&(e.push(a.time),r.push.apply(r,o)),a=t[i++]}while(void 0!==a);else if(void 0!==o.toArray)do{void 0!==(o=a[n])&&(e.push(a.time),o.toArray(r,r.length)),a=t[i++]}while(void 0!==a);else do{void 0!==(o=a[n])&&(e.push(a.time),r.push(o)),a=t[i++]}while(void 0!==a)}}};function gs(t,e,r,n){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=void 0!==n?n:new e.constructor(r),this.sampleValues=e,this.valueSize=r}function vs(t,e,r,n){gs.call(this,t,e,r,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0}function ys(t,e,r,n){gs.call(this,t,e,r,n)}function xs(t,e,r,n){gs.call(this,t,e,r,n)}function bs(t,e,r,n){if(void 0===t)throw new Error("THREE.KeyframeTrack: track name is undefined");if(void 0===e||0===e.length)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=ms.convertArray(e,this.TimeBufferType),this.values=ms.convertArray(r,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}function ws(t,e,r){bs.call(this,t,e,r)}function _s(t,e,r,n){bs.call(this,t,e,r,n)}function Ms(t,e,r,n){bs.call(this,t,e,r,n)}function Es(t,e,r,n){gs.call(this,t,e,r,n)}function Ss(t,e,r,n){bs.call(this,t,e,r,n)}function Ts(t,e,r,n){bs.call(this,t,e,r,n)}function As(t,e,r,n){bs.call(this,t,e,r,n)}function Ls(t,e,r){this.name=t,this.tracks=r,this.duration=void 0!==e?e:-1,this.uuid=Qe.generateUUID(),this.duration<0&&this.resetDuration()}function Rs(t){if(void 0===t.type)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");var e=function(t){switch(t.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Ms;case"vector":case"vector2":case"vector3":case"vector4":return As;case"color":return _s;case"quaternion":return Ss;case"bool":case"boolean":return ws;case"string":return Ts}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+t)}(t.type);if(void 0===t.times){var r=[],n=[];ms.flattenJSON(t.keys,r,n,"value"),t.times=r,t.values=n}return void 0!==e.parse?e.parse(t):new e(t.name,t.times,t.values,t.interpolation)}Object.assign(gs.prototype,{evaluate:function(t){var e=this.parameterPositions,r=this._cachedIndex,n=e[r],i=e[r-1];t:{e:{var a;r:{n:if(!(t<n)){for(var o=r+2;;){if(void 0===n){if(t<i)break n;return r=e.length,this._cachedIndex=r,this.afterEnd_(r-1,t,i)}if(r===o)break;if(i=n,t<(n=e[++r]))break e}a=e.length;break r}if(t>=i)break t;var s=e[1];for(t<s&&(r=2,i=s),o=r-2;;){if(void 0===i)return this._cachedIndex=0,this.beforeStart_(0,t,n);if(r===o)break;if(n=i,t>=(i=e[--r-1]))break e}a=r,r=0}for(;r<a;){var c=r+a>>>1;t<e[c]?a=c:r=c+1}if(n=e[r],void 0===(i=e[r-1]))return this._cachedIndex=0,this.beforeStart_(0,t,n);if(void 0===n)return r=e.length,this._cachedIndex=r,this.afterEnd_(r-1,i,t)}this._cachedIndex=r,this.intervalChanged_(r,i,n)}return this.interpolate_(r,i,t,n)},settings:null,DefaultSettings_:{},getSettings_:function(){return this.settings||this.DefaultSettings_},copySampleValue_:function(t){for(var e=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=t*n,a=0;a!==n;++a)e[a]=r[i+a];return e},interpolate_:function(){throw new Error("call to abstract method")},intervalChanged_:function(){}}),Object.assign(gs.prototype,{beforeStart_:gs.prototype.copySampleValue_,afterEnd_:gs.prototype.copySampleValue_}),vs.prototype=Object.assign(Object.create(gs.prototype),{constructor:vs,DefaultSettings_:{endingStart:Ie,endingEnd:Ie},intervalChanged_:function(t,e,r){var n=this.parameterPositions,i=t-2,a=t+1,o=n[i],s=n[a];if(void 0===o)switch(this.getSettings_().endingStart){case De:i=t,o=2*e-r;break;case Ne:o=e+n[i=n.length-2]-n[i+1];break;default:i=t,o=r}if(void 0===s)switch(this.getSettings_().endingEnd){case De:a=t,s=2*r-e;break;case Ne:a=1,s=r+n[1]-n[0];break;default:a=t-1,s=e}var c=.5*(r-e),h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(s-r),this._offsetPrev=i*h,this._offsetNext=a*h},interpolate_:function(t,e,r,n){for(var i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=t*o,c=s-o,h=this._offsetPrev,l=this._offsetNext,u=this._weightPrev,p=this._weightNext,d=(r-e)/(n-e),f=d*d,m=f*d,g=-u*m+2*u*f-u*d,v=(1+u)*m+(-1.5-2*u)*f+(-.5+u)*d+1,y=(-1-p)*m+(1.5+p)*f+.5*d,x=p*m-p*f,b=0;b!==o;++b)i[b]=g*a[h+b]+v*a[c+b]+y*a[s+b]+x*a[l+b];return i}}),ys.prototype=Object.assign(Object.create(gs.prototype),{constructor:ys,interpolate_:function(t,e,r,n){for(var i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=t*o,c=s-o,h=(r-e)/(n-e),l=1-h,u=0;u!==o;++u)i[u]=a[c+u]*l+a[s+u]*h;return i}}),xs.prototype=Object.assign(Object.create(gs.prototype),{constructor:xs,interpolate_:function(t){return this.copySampleValue_(t-1)}}),Object.assign(bs,{toJSON:function(t){var e,r=t.constructor;if(void 0!==r.toJSON)e=r.toJSON(t);else{e={name:t.name,times:ms.convertArray(t.times,Array),values:ms.convertArray(t.values,Array)};var n=t.getInterpolation();n!==t.DefaultInterpolation&&(e.interpolation=n)}return e.type=t.ValueTypeName,e}}),Object.assign(bs.prototype,{constructor:bs,TimeBufferType:Float32Array,ValueBufferType:Float32Array,DefaultInterpolation:Pe,InterpolantFactoryMethodDiscrete:function(t){return new xs(this.times,this.values,this.getValueSize(),t)},InterpolantFactoryMethodLinear:function(t){return new ys(this.times,this.values,this.getValueSize(),t)},InterpolantFactoryMethodSmooth:function(t){return new vs(this.times,this.values,this.getValueSize(),t)},setInterpolation:function(t){var e;switch(t){case Ce:e=this.InterpolantFactoryMethodDiscrete;break;case Pe:e=this.InterpolantFactoryMethodLinear;break;case Oe:e=this.InterpolantFactoryMethodSmooth}if(void 0===e){var r="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(void 0===this.createInterpolant){if(t===this.DefaultInterpolation)throw new Error(r);this.setInterpolation(this.DefaultInterpolation)}return console.warn("THREE.KeyframeTrack:",r),this}return this.createInterpolant=e,this},getInterpolation:function(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ce;case this.InterpolantFactoryMethodLinear:return Pe;case this.InterpolantFactoryMethodSmooth:return Oe}},getValueSize:function(){return this.values.length/this.times.length},shift:function(t){if(0!==t)for(var e=this.times,r=0,n=e.length;r!==n;++r)e[r]+=t;return this},scale:function(t){if(1!==t)for(var e=this.times,r=0,n=e.length;r!==n;++r)e[r]*=t;return this},trim:function(t,e){for(var r=this.times,n=r.length,i=0,a=n-1;i!==n&&r[i]<t;)++i;for(;-1!==a&&r[a]>e;)--a;if(++a,0!==i||a!==n){i>=a&&(i=(a=Math.max(a,1))-1);var o=this.getValueSize();this.times=ms.arraySlice(r,i,a),this.values=ms.arraySlice(this.values,i*o,a*o)}return this},validate:function(){var t=!0,e=this.getValueSize();e-Math.floor(e)!=0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);var r=this.times,n=this.values,i=r.length;0===i&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);for(var a=null,o=0;o!==i;o++){var s=r[o];if("number"==typeof s&&isNaN(s)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,s),t=!1;break}if(null!==a&&a>s){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,s,a),t=!1;break}a=s}if(void 0!==n&&ms.isTypedArray(n)){o=0;for(var c=n.length;o!==c;++o){var h=n[o];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,h),t=!1;break}}}return t},optimize:function(){for(var t=this.times,e=this.values,r=this.getValueSize(),n=this.getInterpolation()===Oe,i=1,a=t.length-1,o=1;o<a;++o){var s=!1,c=t[o];if(c!==t[o+1]&&(1!==o||c!==c[0]))if(n)s=!0;else for(var h=o*r,l=h-r,u=h+r,p=0;p!==r;++p){var d=e[h+p];if(d!==e[l+p]||d!==e[u+p]){s=!0;break}}if(s){if(o!==i){t[i]=t[o];var f=o*r,m=i*r;for(p=0;p!==r;++p)e[m+p]=e[f+p]}++i}}if(a>0){for(t[i]=t[a],f=a*r,m=i*r,p=0;p!==r;++p)e[m+p]=e[f+p];++i}return i!==t.length&&(this.times=ms.arraySlice(t,0,i),this.values=ms.arraySlice(e,0,i*r)),this},clone:function(){var t=ms.arraySlice(this.times,0),e=ms.arraySlice(this.values,0),r=new(0,this.constructor)(this.name,t,e);return r.createInterpolant=this.createInterpolant,r}}),ws.prototype=Object.assign(Object.create(bs.prototype),{constructor:ws,ValueTypeName:"bool",ValueBufferType:Array,DefaultInterpolation:Ce,InterpolantFactoryMethodLinear:void 0,InterpolantFactoryMethodSmooth:void 0}),_s.prototype=Object.assign(Object.create(bs.prototype),{constructor:_s,ValueTypeName:"color"}),Ms.prototype=Object.assign(Object.create(bs.prototype),{constructor:Ms,ValueTypeName:"number"}),Es.prototype=Object.assign(Object.create(gs.prototype),{constructor:Es,interpolate_:function(t,e,r,n){for(var i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=t*o,c=(r-e)/(n-e),h=s+o;s!==h;s+=4)tr.slerpFlat(i,0,a,s-o,a,s,c);return i}}),Ss.prototype=Object.assign(Object.create(bs.prototype),{constructor:Ss,ValueTypeName:"quaternion",DefaultInterpolation:Pe,InterpolantFactoryMethodLinear:function(t){return new Es(this.times,this.values,this.getValueSize(),t)},InterpolantFactoryMethodSmooth:void 0}),Ts.prototype=Object.assign(Object.create(bs.prototype),{constructor:Ts,ValueTypeName:"string",ValueBufferType:Array,DefaultInterpolation:Ce,InterpolantFactoryMethodLinear:void 0,InterpolantFactoryMethodSmooth:void 0}),As.prototype=Object.assign(Object.create(bs.prototype),{constructor:As,ValueTypeName:"vector"}),Object.assign(Ls,{parse:function(t){for(var e=[],r=t.tracks,n=1/(t.fps||1),i=0,a=r.length;i!==a;++i)e.push(Rs(r[i]).scale(n));return new Ls(t.name,t.duration,e)},toJSON:function(t){for(var e=[],r=t.tracks,n={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid},i=0,a=r.length;i!==a;++i)e.push(bs.toJSON(r[i]));return n},CreateFromMorphTargetSequence:function(t,e,r,n){for(var i=e.length,a=[],o=0;o<i;o++){var s=[],c=[];s.push((o+i-1)%i,o,(o+1)%i),c.push(0,1,0);var h=ms.getKeyframeOrder(s);s=ms.sortedArray(s,1,h),c=ms.sortedArray(c,1,h),n||0!==s[0]||(s.push(i),c.push(c[0])),a.push(new Ms(".morphTargetInfluences["+e[o].name+"]",s,c).scale(1/r))}return new Ls(t,-1,a)},findByName:function(t,e){var r=t;if(!Array.isArray(t)){var n=t;r=n.geometry&&n.geometry.animations||n.animations}for(var i=0;i<r.length;i++)if(r[i].name===e)return r[i];return null},CreateClipsFromMorphTargetSequences:function(t,e,r){for(var n={},i=/^([\w-]*?)([\d]+)$/,a=0,o=t.length;a<o;a++){var s=t[a],c=s.name.match(i);if(c&&c.length>1){var h=n[u=c[1]];h||(n[u]=h=[]),h.push(s)}}var l=[];for(var u in n)l.push(Ls.CreateFromMorphTargetSequence(u,n[u],e,r));return l},parseAnimation:function(t,e){if(!t)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;for(var r=function(t,e,r,n,i){if(0!==r.length){var a=[],o=[];ms.flattenJSON(r,a,o,n),0!==a.length&&i.push(new t(e,a,o))}},n=[],i=t.name||"default",a=t.length||-1,o=t.fps||30,s=t.hierarchy||[],c=0;c<s.length;c++){var h=s[c].keys;if(h&&0!==h.length)if(h[0].morphTargets){for(var l={},u=0;u<h.length;u++)if(h[u].morphTargets)for(var p=0;p<h[u].morphTargets.length;p++)l[h[u].morphTargets[p]]=-1;for(var d in l){var f=[],m=[];for(p=0;p!==h[u].morphTargets.length;++p){var g=h[u];f.push(g.time),m.push(g.morphTarget===d?1:0)}n.push(new Ms(".morphTargetInfluence["+d+"]",f,m))}a=l.length*(o||1)}else{var v=".bones["+e[c].name+"]";r(As,v+".position",h,"pos",n),r(Ss,v+".quaternion",h,"rot",n),r(As,v+".scale",h,"scl",n)}}return 0===n.length?null:new Ls(i,a,n)}}),Object.assign(Ls.prototype,{resetDuration:function(){for(var t=0,e=0,r=this.tracks.length;e!==r;++e){var n=this.tracks[e];t=Math.max(t,n.times[n.times.length-1])}return this.duration=t,this},trim:function(){for(var t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this},validate:function(){for(var t=!0,e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t},optimize:function(){for(var t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this},clone:function(){for(var t=[],e=0;e<this.tracks.length;e++)t.push(this.tracks[e].clone());return new Ls(this.name,this.duration,t)}});var Cs={enabled:!1,files:{},add:function(t,e){!1!==this.enabled&&(this.files[t]=e)},get:function(t){if(!1!==this.enabled)return this.files[t]},remove:function(t){delete this.files[t]},clear:function(){this.files={}}};function Ps(t,e,r){var n=this,i=!1,a=0,o=0,s=void 0;this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=r,this.itemStart=function(t){o++,!1===i&&void 0!==n.onStart&&n.onStart(t,a,o),i=!0},this.itemEnd=function(t){a++,void 0!==n.onProgress&&n.onProgress(t,a,o),a===o&&(i=!1,void 0!==n.onLoad&&n.onLoad())},this.itemError=function(t){void 0!==n.onError&&n.onError(t)},this.resolveURL=function(t){return s?s(t):t},this.setURLModifier=function(t){return s=t,this}}var Os=new Ps,Is={};function Ds(t){this.manager=void 0!==t?t:Os}function Ns(t){this.manager=void 0!==t?t:Os}function Bs(t){this.manager=void 0!==t?t:Os,this._parser=null}function zs(t){this.manager=void 0!==t?t:Os,this._parser=null}function Us(t){this.manager=void 0!==t?t:Os}function Gs(t){this.manager=void 0!==t?t:Os}function Fs(t){this.manager=void 0!==t?t:Os}function Hs(){this.type="Curve",this.arcLengthDivisions=200}function Vs(t,e,r,n,i,a,o,s){Hs.call(this),this.type="EllipseCurve",this.aX=t||0,this.aY=e||0,this.xRadius=r||1,this.yRadius=n||1,this.aStartAngle=i||0,this.aEndAngle=a||2*Math.PI,this.aClockwise=o||!1,this.aRotation=s||0}function js(t,e,r,n,i,a){Vs.call(this,t,e,r,r,n,i,a),this.type="ArcCurve"}function ks(){var t=0,e=0,r=0,n=0;function i(i,a,o,s){t=i,e=o,r=-3*i+3*a-2*o-s,n=2*i-2*a+o+s}return{initCatmullRom:function(t,e,r,n,a){i(e,r,a*(r-t),a*(n-e))},initNonuniformCatmullRom:function(t,e,r,n,a,o,s){var c=(e-t)/a-(r-t)/(a+o)+(r-e)/o,h=(r-e)/o-(n-e)/(o+s)+(n-r)/s;i(e,r,c*=o,h*=o)},calc:function(i){var a=i*i;return t+e*i+r*a+n*(a*i)}}}Object.assign(Ds.prototype,{load:function(t,e,r,n){void 0===t&&(t=""),void 0!==this.path&&(t=this.path+t),t=this.manager.resolveURL(t);var i=this,a=Cs.get(t);if(void 0!==a)return i.manager.itemStart(t),setTimeout((function(){e&&e(a),i.manager.itemEnd(t)}),0),a;if(void 0===Is[t]){var o=t.match(/^data:(.*?)(;base64)?,(.*)$/);if(o){var s=o[1],c=!!o[2],h=o[3];h=decodeURIComponent(h),c&&(h=atob(h));try{var l,u=(this.responseType||"").toLowerCase();switch(u){case"arraybuffer":case"blob":for(var p=new Uint8Array(h.length),d=0;d<h.length;d++)p[d]=h.charCodeAt(d);l="blob"===u?new Blob([p.buffer],{type:s}):p.buffer;break;case"document":var f=new DOMParser;l=f.parseFromString(h,s);break;case"json":l=JSON.parse(h);break;default:l=h}setTimeout((function(){e&&e(l),i.manager.itemEnd(t)}),0)}catch(e){setTimeout((function(){n&&n(e),i.manager.itemError(t),i.manager.itemEnd(t)}),0)}}else{Is[t]=[],Is[t].push({onLoad:e,onProgress:r,onError:n});var m=new XMLHttpRequest;for(var g in m.open("GET",t,!0),m.addEventListener("load",(function(e){var r=this.response;Cs.add(t,r);var n=Is[t];if(delete Is[t],200===this.status||0===this.status){0===this.status&&console.warn("THREE.FileLoader: HTTP Status 0 received.");for(var a=0,o=n.length;a<o;a++)(s=n[a]).onLoad&&s.onLoad(r);i.manager.itemEnd(t)}else{for(a=0,o=n.length;a<o;a++){var s;(s=n[a]).onError&&s.onError(e)}i.manager.itemError(t),i.manager.itemEnd(t)}}),!1),m.addEventListener("progress",(function(e){for(var r=Is[t],n=0,i=r.length;n<i;n++){var a=r[n];a.onProgress&&a.onProgress(e)}}),!1),m.addEventListener("error",(function(e){var r=Is[t];delete Is[t];for(var n=0,a=r.length;n<a;n++){var o=r[n];o.onError&&o.onError(e)}i.manager.itemError(t),i.manager.itemEnd(t)}),!1),m.addEventListener("abort",(function(e){var r=Is[t];delete Is[t];for(var n=0,a=r.length;n<a;n++){var o=r[n];o.onError&&o.onError(e)}i.manager.itemError(t),i.manager.itemEnd(t)}),!1),void 0!==this.responseType&&(m.responseType=this.responseType),void 0!==this.withCredentials&&(m.withCredentials=this.withCredentials),m.overrideMimeType&&m.overrideMimeType(void 0!==this.mimeType?this.mimeType:"text/plain"),this.requestHeader)m.setRequestHeader(g,this.requestHeader[g]);m.send(null)}return i.manager.itemStart(t),m}Is[t].push({onLoad:e,onProgress:r,onError:n})},setPath:function(t){return this.path=t,this},setResponseType:function(t){return this.responseType=t,this},setWithCredentials:function(t){return this.withCredentials=t,this},setMimeType:function(t){return this.mimeType=t,this},setRequestHeader:function(t){return this.requestHeader=t,this}}),Object.assign(Ns.prototype,{load:function(t,e,r,n){var i=this,a=new Ds(i.manager);a.setPath(i.path),a.load(t,(function(t){e(i.parse(JSON.parse(t)))}),r,n)},parse:function(t,e){for(var r=[],n=0;n<t.length;n++){var i=Ls.parse(t[n]);r.push(i)}e(r)},setPath:function(t){return this.path=t,this}}),Object.assign(Bs.prototype,{load:function(t,e,r,n){var i=this,a=[],o=new Va;o.image=a;var s=new Ds(this.manager);function c(c){s.load(t[c],(function(t){var r=i._parser(t,!0);a[c]={width:r.width,height:r.height,format:r.format,mipmaps:r.mipmaps},6===(h+=1)&&(1===r.mipmapCount&&(o.minFilter=Dt),o.format=r.format,o.needsUpdate=!0,e&&e(o))}),r,n)}if(s.setPath(this.path),s.setResponseType("arraybuffer"),Array.isArray(t))for(var h=0,l=0,u=t.length;l<u;++l)c(l);else s.load(t,(function(t){var r=i._parser(t,!0);if(r.isCubemap)for(var n=r.mipmaps.length/r.mipmapCount,s=0;s<n;s++){a[s]={mipmaps:[]};for(var c=0;c<r.mipmapCount;c++)a[s].mipmaps.push(r.mipmaps[s*r.mipmapCount+c]),a[s].format=r.format,a[s].width=r.width,a[s].height=r.height}else o.image.width=r.width,o.image.height=r.height,o.mipmaps=r.mipmaps;1===r.mipmapCount&&(o.minFilter=Dt),o.format=r.format,o.needsUpdate=!0,e&&e(o)}),r,n);return o},setPath:function(t){return this.path=t,this}}),Object.assign(zs.prototype,{load:function(t,e,r,n){var i=this,a=new mr,o=new Ds(this.manager);return o.setResponseType("arraybuffer"),o.setPath(this.path),o.load(t,(function(t){var r=i._parser(t);r&&(void 0!==r.image?a.image=r.image:void 0!==r.data&&(a.image.width=r.width,a.image.height=r.height,a.image.data=r.data),a.wrapS=void 0!==r.wrapS?r.wrapS:Rt,a.wrapT=void 0!==r.wrapT?r.wrapT:Rt,a.magFilter=void 0!==r.magFilter?r.magFilter:Dt,a.minFilter=void 0!==r.minFilter?r.minFilter:Bt,a.anisotropy=void 0!==r.anisotropy?r.anisotropy:1,void 0!==r.format&&(a.format=r.format),void 0!==r.type&&(a.type=r.type),void 0!==r.mipmaps&&(a.mipmaps=r.mipmaps),1===r.mipmapCount&&(a.minFilter=Dt),a.needsUpdate=!0,e&&e(a,r))}),r,n),a},setPath:function(t){return this.path=t,this}}),Object.assign(Us.prototype,{crossOrigin:"anonymous",load:function(t,e,r,n){void 0===t&&(t=""),void 0!==this.path&&(t=this.path+t),t=this.manager.resolveURL(t);var i=this,a=Cs.get(t);if(void 0!==a)return i.manager.itemStart(t),setTimeout((function(){e&&e(a),i.manager.itemEnd(t)}),0),a;var o=document.createElementNS("http://www.w3.org/1999/xhtml","img");function s(){o.removeEventListener("load",s,!1),o.removeEventListener("error",c,!1),Cs.add(t,this),e&&e(this),i.manager.itemEnd(t)}function c(e){o.removeEventListener("load",s,!1),o.removeEventListener("error",c,!1),n&&n(e),i.manager.itemError(t),i.manager.itemEnd(t)}return o.addEventListener("load",s,!1),o.addEventListener("error",c,!1),"data:"!==t.substr(0,5)&&void 0!==this.crossOrigin&&(o.crossOrigin=this.crossOrigin),i.manager.itemStart(t),o.src=t,o},setCrossOrigin:function(t){return this.crossOrigin=t,this},setPath:function(t){return this.path=t,this}}),Object.assign(Gs.prototype,{crossOrigin:"anonymous",load:function(t,e,r,n){var i=new Vn,a=new Us(this.manager);a.setCrossOrigin(this.crossOrigin),a.setPath(this.path);var o=0;function s(r){a.load(t[r],(function(t){i.images[r]=t,6==++o&&(i.needsUpdate=!0,e&&e(i))}),void 0,n)}for(var c=0;c<t.length;++c)s(c);return i},setCrossOrigin:function(t){return this.crossOrigin=t,this},setPath:function(t){return this.path=t,this}}),Object.assign(Fs.prototype,{crossOrigin:"anonymous",load:function(t,e,r,n){var i=new lr,a=new Us(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(t,(function(r){i.image=r;var n=t.search(/\.jpe?g($|\?)/i)>0||0===t.search(/^data\:image\/jpeg/);i.format=n?Zt:Qt,i.needsUpdate=!0,void 0!==e&&e(i)}),r,n),i},setCrossOrigin:function(t){return this.crossOrigin=t,this},setPath:function(t){return this.path=t,this}}),Object.assign(Hs.prototype,{getPoint:function(){return console.warn("THREE.Curve: .getPoint() not implemented."),null},getPointAt:function(t,e){var r=this.getUtoTmapping(t);return this.getPoint(r,e)},getPoints:function(t){void 0===t&&(t=5);for(var e=[],r=0;r<=t;r++)e.push(this.getPoint(r/t));return e},getSpacedPoints:function(t){void 0===t&&(t=5);for(var e=[],r=0;r<=t;r++)e.push(this.getPointAt(r/t));return e},getLength:function(){var t=this.getLengths();return t[t.length-1]},getLengths:function(t){if(void 0===t&&(t=this.arcLengthDivisions),this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;var e,r,n=[],i=this.getPoint(0),a=0;for(n.push(0),r=1;r<=t;r++)a+=(e=this.getPoint(r/t)).distanceTo(i),n.push(a),i=e;return this.cacheArcLengths=n,n},updateArcLengths:function(){this.needsUpdate=!0,this.getLengths()},getUtoTmapping:function(t,e){var r,n=this.getLengths(),i=0,a=n.length;r=e||t*n[a-1];for(var o,s=0,c=a-1;s<=c;)if((o=n[i=Math.floor(s+(c-s)/2)]-r)<0)s=i+1;else{if(!(o>0)){c=i;break}c=i-1}if(n[i=c]===r)return i/(a-1);var h=n[i];return(i+(r-h)/(n[i+1]-h))/(a-1)},getTangent:function(t){var e=1e-4,r=t-e,n=t+e;r<0&&(r=0),n>1&&(n=1);var i=this.getPoint(r);return this.getPoint(n).clone().sub(i).normalize()},getTangentAt:function(t){var e=this.getUtoTmapping(t);return this.getTangent(e)},computeFrenetFrames:function(t,e){var r,n,i,a=new er,o=[],s=[],c=[],h=new er,l=new $e;for(r=0;r<=t;r++)n=r/t,o[r]=this.getTangentAt(n),o[r].normalize();s[0]=new er,c[0]=new er;var u=Number.MAX_VALUE,p=Math.abs(o[0].x),d=Math.abs(o[0].y),f=Math.abs(o[0].z);for(p<=u&&(u=p,a.set(1,0,0)),d<=u&&(u=d,a.set(0,1,0)),f<=u&&a.set(0,0,1),h.crossVectors(o[0],a).normalize(),s[0].crossVectors(o[0],h),c[0].crossVectors(o[0],s[0]),r=1;r<=t;r++)s[r]=s[r-1].clone(),c[r]=c[r-1].clone(),h.crossVectors(o[r-1],o[r]),h.length()>Number.EPSILON&&(h.normalize(),i=Math.acos(Qe.clamp(o[r-1].dot(o[r]),-1,1)),s[r].applyMatrix4(l.makeRotationAxis(h,i))),c[r].crossVectors(o[r],s[r]);if(!0===e)for(i=Math.acos(Qe.clamp(s[0].dot(s[t]),-1,1)),i/=t,o[0].dot(h.crossVectors(s[0],s[t]))>0&&(i=-i),r=1;r<=t;r++)s[r].applyMatrix4(l.makeRotationAxis(o[r],i*r)),c[r].crossVectors(o[r],s[r]);return{tangents:o,normals:s,binormals:c}},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.arcLengthDivisions=t.arcLengthDivisions,this},toJSON:function(){var t={metadata:{version:4.5,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t},fromJSON:function(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}),Vs.prototype=Object.create(Hs.prototype),Vs.prototype.constructor=Vs,Vs.prototype.isEllipseCurve=!0,Vs.prototype.getPoint=function(t,e){for(var r=e||new Ke,n=2*Math.PI,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<Number.EPSILON;i<0;)i+=n;for(;i>n;)i-=n;i<Number.EPSILON&&(i=a?0:n),!0!==this.aClockwise||a||(i===n?i=-n:i-=n);var o=this.aStartAngle+t*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(0!==this.aRotation){var h=Math.cos(this.aRotation),l=Math.sin(this.aRotation),u=s-this.aX,p=c-this.aY;s=u*h-p*l+this.aX,c=u*l+p*h+this.aY}return r.set(s,c)},Vs.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this},Vs.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t},Vs.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this},js.prototype=Object.create(Vs.prototype),js.prototype.constructor=js,js.prototype.isArcCurve=!0;var Ws=new er,qs=new ks,Xs=new ks,Ys=new ks;function Js(t,e,r,n){Hs.call(this),this.type="CatmullRomCurve3",this.points=t||[],this.closed=e||!1,this.curveType=r||"centripetal",this.tension=n||.5}function Zs(t,e,r,n,i){var a=.5*(n-e),o=.5*(i-r),s=t*t;return(2*r-2*n+a+o)*(t*s)+(-3*r+3*n-2*a-o)*s+a*t+r}function Qs(t,e,r,n){return function(t,e){var r=1-t;return r*r*e}(t,e)+function(t,e){return 2*(1-t)*t*e}(t,r)+function(t,e){return t*t*e}(t,n)}function Ks(t,e,r,n,i){return function(t,e){var r=1-t;return r*r*r*e}(t,e)+function(t,e){var r=1-t;return 3*r*r*t*e}(t,r)+function(t,e){return 3*(1-t)*t*t*e}(t,n)+function(t,e){return t*t*t*e}(t,i)}function $s(t,e,r,n){Hs.call(this),this.type="CubicBezierCurve",this.v0=t||new Ke,this.v1=e||new Ke,this.v2=r||new Ke,this.v3=n||new Ke}function tc(t,e,r,n){Hs.call(this),this.type="CubicBezierCurve3",this.v0=t||new er,this.v1=e||new er,this.v2=r||new er,this.v3=n||new er}function ec(t,e){Hs.call(this),this.type="LineCurve",this.v1=t||new Ke,this.v2=e||new Ke}function rc(t,e){Hs.call(this),this.type="LineCurve3",this.v1=t||new er,this.v2=e||new er}function nc(t,e,r){Hs.call(this),this.type="QuadraticBezierCurve",this.v0=t||new Ke,this.v1=e||new Ke,this.v2=r||new Ke}function ic(t,e,r){Hs.call(this),this.type="QuadraticBezierCurve3",this.v0=t||new er,this.v1=e||new er,this.v2=r||new er}function ac(t){Hs.call(this),this.type="SplineCurve",this.points=t||[]}Js.prototype=Object.create(Hs.prototype),Js.prototype.constructor=Js,Js.prototype.isCatmullRomCurve3=!0,Js.prototype.getPoint=function(t,e){var r,n,i,a,o=e||new er,s=this.points,c=s.length,h=(c-(this.closed?0:1))*t,l=Math.floor(h),u=h-l;if(this.closed?l+=l>0?0:(Math.floor(Math.abs(l)/c)+1)*c:0===u&&l===c-1&&(l=c-2,u=1),this.closed||l>0?r=s[(l-1)%c]:(Ws.subVectors(s[0],s[1]).add(s[0]),r=Ws),n=s[l%c],i=s[(l+1)%c],this.closed||l+2<c?a=s[(l+2)%c]:(Ws.subVectors(s[c-1],s[c-2]).add(s[c-1]),a=Ws),"centripetal"===this.curveType||"chordal"===this.curveType){var p="chordal"===this.curveType?.5:.25,d=Math.pow(r.distanceToSquared(n),p),f=Math.pow(n.distanceToSquared(i),p),m=Math.pow(i.distanceToSquared(a),p);f<1e-4&&(f=1),d<1e-4&&(d=f),m<1e-4&&(m=f),qs.initNonuniformCatmullRom(r.x,n.x,i.x,a.x,d,f,m),Xs.initNonuniformCatmullRom(r.y,n.y,i.y,a.y,d,f,m),Ys.initNonuniformCatmullRom(r.z,n.z,i.z,a.z,d,f,m)}else"catmullrom"===this.curveType&&(qs.initCatmullRom(r.x,n.x,i.x,a.x,this.tension),Xs.initCatmullRom(r.y,n.y,i.y,a.y,this.tension),Ys.initCatmullRom(r.z,n.z,i.z,a.z,this.tension));return o.set(qs.calc(u),Xs.calc(u),Ys.calc(u)),o},Js.prototype.copy=function(t){Hs.prototype.copy.call(this,t),this.points=[];for(var e=0,r=t.points.length;e<r;e++){var n=t.points[e];this.points.push(n.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this},Js.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);t.points=[];for(var e=0,r=this.points.length;e<r;e++){var n=this.points[e];t.points.push(n.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t},Js.prototype.fromJSON=function(t){Hs.prototype.fromJSON.call(this,t),this.points=[];for(var e=0,r=t.points.length;e<r;e++){var n=t.points[e];this.points.push((new er).fromArray(n))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this},$s.prototype=Object.create(Hs.prototype),$s.prototype.constructor=$s,$s.prototype.isCubicBezierCurve=!0,$s.prototype.getPoint=function(t,e){var r=e||new Ke,n=this.v0,i=this.v1,a=this.v2,o=this.v3;return r.set(Ks(t,n.x,i.x,a.x,o.x),Ks(t,n.y,i.y,a.y,o.y)),r},$s.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this},$s.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t},$s.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this},tc.prototype=Object.create(Hs.prototype),tc.prototype.constructor=tc,tc.prototype.isCubicBezierCurve3=!0,tc.prototype.getPoint=function(t,e){var r=e||new er,n=this.v0,i=this.v1,a=this.v2,o=this.v3;return r.set(Ks(t,n.x,i.x,a.x,o.x),Ks(t,n.y,i.y,a.y,o.y),Ks(t,n.z,i.z,a.z,o.z)),r},tc.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this},tc.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t},tc.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this},ec.prototype=Object.create(Hs.prototype),ec.prototype.constructor=ec,ec.prototype.isLineCurve=!0,ec.prototype.getPoint=function(t,e){var r=e||new Ke;return 1===t?r.copy(this.v2):(r.copy(this.v2).sub(this.v1),r.multiplyScalar(t).add(this.v1)),r},ec.prototype.getPointAt=function(t,e){return this.getPoint(t,e)},ec.prototype.getTangent=function(){return this.v2.clone().sub(this.v1).normalize()},ec.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.v1.copy(t.v1),this.v2.copy(t.v2),this},ec.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t},ec.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this},rc.prototype=Object.create(Hs.prototype),rc.prototype.constructor=rc,rc.prototype.isLineCurve3=!0,rc.prototype.getPoint=function(t,e){var r=e||new er;return 1===t?r.copy(this.v2):(r.copy(this.v2).sub(this.v1),r.multiplyScalar(t).add(this.v1)),r},rc.prototype.getPointAt=function(t,e){return this.getPoint(t,e)},rc.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.v1.copy(t.v1),this.v2.copy(t.v2),this},rc.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t},rc.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this},nc.prototype=Object.create(Hs.prototype),nc.prototype.constructor=nc,nc.prototype.isQuadraticBezierCurve=!0,nc.prototype.getPoint=function(t,e){var r=e||new Ke,n=this.v0,i=this.v1,a=this.v2;return r.set(Qs(t,n.x,i.x,a.x),Qs(t,n.y,i.y,a.y)),r},nc.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this},nc.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t},nc.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this},ic.prototype=Object.create(Hs.prototype),ic.prototype.constructor=ic,ic.prototype.isQuadraticBezierCurve3=!0,ic.prototype.getPoint=function(t,e){var r=e||new er,n=this.v0,i=this.v1,a=this.v2;return r.set(Qs(t,n.x,i.x,a.x),Qs(t,n.y,i.y,a.y),Qs(t,n.z,i.z,a.z)),r},ic.prototype.copy=function(t){return Hs.prototype.copy.call(this,t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this},ic.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t},ic.prototype.fromJSON=function(t){return Hs.prototype.fromJSON.call(this,t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this},ac.prototype=Object.create(Hs.prototype),ac.prototype.constructor=ac,ac.prototype.isSplineCurve=!0,ac.prototype.getPoint=function(t,e){var r=e||new Ke,n=this.points,i=(n.length-1)*t,a=Math.floor(i),o=i-a,s=n[0===a?a:a-1],c=n[a],h=n[a>n.length-2?n.length-1:a+1],l=n[a>n.length-3?n.length-1:a+2];return r.set(Zs(o,s.x,c.x,h.x,l.x),Zs(o,s.y,c.y,h.y,l.y)),r},ac.prototype.copy=function(t){Hs.prototype.copy.call(this,t),this.points=[];for(var e=0,r=t.points.length;e<r;e++){var n=t.points[e];this.points.push(n.clone())}return this},ac.prototype.toJSON=function(){var t=Hs.prototype.toJSON.call(this);t.points=[];for(var e=0,r=this.points.length;e<r;e++){var n=this.points[e];t.points.push(n.toArray())}return t},ac.prototype.fromJSON=function(t){Hs.prototype.fromJSON.call(this,t),this.points=[];for(var e=0,r=t.points.length;e<r;e++){var n=t.points[e];this.points.push((new Ke).fromArray(n))}return this};var oc=Object.freeze({ArcCurve:js,CatmullRomCurve3:Js,CubicBezierCurve:$s,CubicBezierCurve3:tc,EllipseCurve:Vs,LineCurve:ec,LineCurve3:rc,QuadraticBezierCurve:nc,QuadraticBezierCurve3:ic,SplineCurve:ac});function sc(){Hs.call(this),this.type="CurvePath",this.curves=[],this.autoClose=!1}function cc(t){sc.call(this),this.type="Path",this.currentPoint=new Ke,t&&this.setFromPoints(t)}function hc(t){cc.call(this,t),this.uuid=Qe.generateUUID(),this.type="Shape",this.holes=[]}function lc(t,e){Vr.call(this),this.type="Light",this.color=new Lr(t),this.intensity=void 0!==e?e:1,this.receiveShadow=void 0}function uc(t,e,r){lc.call(this,t,r),this.type="HemisphereLight",this.castShadow=void 0,this.position.copy(Vr.DefaultUp),this.updateMatrix(),this.groundColor=new Lr(e)}function pc(t){this.camera=t,this.bias=0,this.radius=1,this.mapSize=new Ke(512,512),this.map=null,this.matrix=new $e}function dc(){pc.call(this,new la(50,1,.5,500))}function fc(t,e,r,n,i,a){lc.call(this,t,e),this.type="SpotLight",this.position.copy(Vr.DefaultUp),this.updateMatrix(),this.target=new Vr,Object.defineProperty(this,"power",{get:function(){return this.intensity*Math.PI},set:function(t){this.intensity=t/Math.PI}}),this.distance=void 0!==r?r:0,this.angle=void 0!==n?n:Math.PI/3,this.penumbra=void 0!==i?i:0,this.decay=void 0!==a?a:1,this.shadow=new dc}function mc(t,e,r,n){lc.call(this,t,e),this.type="PointLight",Object.defineProperty(this,"power",{get:function(){return 4*this.intensity*Math.PI},set:function(t){this.intensity=t/(4*Math.PI)}}),this.distance=void 0!==r?r:0,this.decay=void 0!==n?n:1,this.shadow=new pc(new la(90,1,.5,500))}function gc(t,e,r,n,i,a){ha.call(this),this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=void 0!==t?t:-1,this.right=void 0!==e?e:1,this.top=void 0!==r?r:1,this.bottom=void 0!==n?n:-1,this.near=void 0!==i?i:.1,this.far=void 0!==a?a:2e3,this.updateProjectionMatrix()}function vc(){pc.call(this,new gc(-5,5,5,-5,.5,500))}function yc(t,e){lc.call(this,t,e),this.type="DirectionalLight",this.position.copy(Vr.DefaultUp),this.updateMatrix(),this.target=new Vr,this.shadow=new vc}function xc(t,e){lc.call(this,t,e),this.type="AmbientLight",this.castShadow=void 0}function bc(t,e,r,n){lc.call(this,t,e),this.type="RectAreaLight",this.width=void 0!==r?r:10,this.height=void 0!==n?n:10}function wc(t){this.manager=void 0!==t?t:Os,this.textures={}}sc.prototype=Object.assign(Object.create(Hs.prototype),{constructor:sc,add:function(t){this.curves.push(t)},closePath:function(){var t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);t.equals(e)||this.curves.push(new ec(e,t))},getPoint:function(t){for(var e=t*this.getLength(),r=this.getCurveLengths(),n=0;n<r.length;){if(r[n]>=e){var i=r[n]-e,a=this.curves[n],o=a.getLength(),s=0===o?0:1-i/o;return a.getPointAt(s)}n++}return null},getLength:function(){var t=this.getCurveLengths();return t[t.length-1]},updateArcLengths:function(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()},getCurveLengths:function(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;for(var t=[],e=0,r=0,n=this.curves.length;r<n;r++)e+=this.curves[r].getLength(),t.push(e);return this.cacheLengths=t,t},getSpacedPoints:function(t){void 0===t&&(t=40);for(var e=[],r=0;r<=t;r++)e.push(this.getPoint(r/t));return this.autoClose&&e.push(e[0]),e},getPoints:function(t){t=t||12;for(var e,r=[],n=0,i=this.curves;n<i.length;n++)for(var a=i[n],o=a&&a.isEllipseCurve?2*t:a&&(a.isLineCurve||a.isLineCurve3)?1:a&&a.isSplineCurve?t*a.points.length:t,s=a.getPoints(o),c=0;c<s.length;c++){var h=s[c];e&&e.equals(h)||(r.push(h),e=h)}return this.autoClose&&r.length>1&&!r[r.length-1].equals(r[0])&&r.push(r[0]),r},copy:function(t){Hs.prototype.copy.call(this,t),this.curves=[];for(var e=0,r=t.curves.length;e<r;e++){var n=t.curves[e];this.curves.push(n.clone())}return this.autoClose=t.autoClose,this},toJSON:function(){var t=Hs.prototype.toJSON.call(this);t.autoClose=this.autoClose,t.curves=[];for(var e=0,r=this.curves.length;e<r;e++){var n=this.curves[e];t.curves.push(n.toJSON())}return t},fromJSON:function(t){Hs.prototype.fromJSON.call(this,t),this.autoClose=t.autoClose,this.curves=[];for(var e=0,r=t.curves.length;e<r;e++){var n=t.curves[e];this.curves.push((new oc[n.type]).fromJSON(n))}return this}}),cc.prototype=Object.assign(Object.create(sc.prototype),{constructor:cc,setFromPoints:function(t){this.moveTo(t[0].x,t[0].y);for(var e=1,r=t.length;e<r;e++)this.lineTo(t[e].x,t[e].y)},moveTo:function(t,e){this.currentPoint.set(t,e)},lineTo:function(t,e){var r=new ec(this.currentPoint.clone(),new Ke(t,e));this.curves.push(r),this.currentPoint.set(t,e)},quadraticCurveTo:function(t,e,r,n){var i=new nc(this.currentPoint.clone(),new Ke(t,e),new Ke(r,n));this.curves.push(i),this.currentPoint.set(r,n)},bezierCurveTo:function(t,e,r,n,i,a){var o=new $s(this.currentPoint.clone(),new Ke(t,e),new Ke(r,n),new Ke(i,a));this.curves.push(o),this.currentPoint.set(i,a)},splineThru:function(t){var e=new ac([this.currentPoint.clone()].concat(t));this.curves.push(e),this.currentPoint.copy(t[t.length-1])},arc:function(t,e,r,n,i,a){var o=this.currentPoint.x,s=this.currentPoint.y;this.absarc(t+o,e+s,r,n,i,a)},absarc:function(t,e,r,n,i,a){this.absellipse(t,e,r,r,n,i,a)},ellipse:function(t,e,r,n,i,a,o,s){var c=this.currentPoint.x,h=this.currentPoint.y;this.absellipse(t+c,e+h,r,n,i,a,o,s)},absellipse:function(t,e,r,n,i,a,o,s){var c=new Vs(t,e,r,n,i,a,o,s);if(this.curves.length>0){var h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);var l=c.getPoint(1);this.currentPoint.copy(l)},copy:function(t){return sc.prototype.copy.call(this,t),this.currentPoint.copy(t.currentPoint),this},toJSON:function(){var t=sc.prototype.toJSON.call(this);return t.currentPoint=this.currentPoint.toArray(),t},fromJSON:function(t){return sc.prototype.fromJSON.call(this,t),this.currentPoint.fromArray(t.currentPoint),this}}),hc.prototype=Object.assign(Object.create(cc.prototype),{constructor:hc,getPointsHoles:function(t){for(var e=[],r=0,n=this.holes.length;r<n;r++)e[r]=this.holes[r].getPoints(t);return e},extractPoints:function(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}},copy:function(t){cc.prototype.copy.call(this,t),this.holes=[];for(var e=0,r=t.holes.length;e<r;e++){var n=t.holes[e];this.holes.push(n.clone())}return this},toJSON:function(){var t=cc.prototype.toJSON.call(this);t.uuid=this.uuid,t.holes=[];for(var e=0,r=this.holes.length;e<r;e++){var n=this.holes[e];t.holes.push(n.toJSON())}return t},fromJSON:function(t){cc.prototype.fromJSON.call(this,t),this.uuid=t.uuid,this.holes=[];for(var e=0,r=t.holes.length;e<r;e++){var n=t.holes[e];this.holes.push((new cc).fromJSON(n))}return this}}),lc.prototype=Object.assign(Object.create(Vr.prototype),{constructor:lc,isLight:!0,copy:function(t){return Vr.prototype.copy.call(this,t),this.color.copy(t.color),this.intensity=t.intensity,this},toJSON:function(t){var e=Vr.prototype.toJSON.call(this,t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,void 0!==this.groundColor&&(e.object.groundColor=this.groundColor.getHex()),void 0!==this.distance&&(e.object.distance=this.distance),void 0!==this.angle&&(e.object.angle=this.angle),void 0!==this.decay&&(e.object.decay=this.decay),void 0!==this.penumbra&&(e.object.penumbra=this.penumbra),void 0!==this.shadow&&(e.object.shadow=this.shadow.toJSON()),e}}),uc.prototype=Object.assign(Object.create(lc.prototype),{constructor:uc,isHemisphereLight:!0,copy:function(t){return lc.prototype.copy.call(this,t),this.groundColor.copy(t.groundColor),this}}),Object.assign(pc.prototype,{copy:function(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this},clone:function(){return(new this.constructor).copy(this)},toJSON:function(){var t={};return 0!==this.bias&&(t.bias=this.bias),1!==this.radius&&(t.radius=this.radius),512===this.mapSize.x&&512===this.mapSize.y||(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}),dc.prototype=Object.assign(Object.create(pc.prototype),{constructor:dc,isSpotLightShadow:!0,update:function(t){var e=this.camera,r=2*Qe.RAD2DEG*t.angle,n=this.mapSize.width/this.mapSize.height,i=t.distance||e.far;r===e.fov&&n===e.aspect&&i===e.far||(e.fov=r,e.aspect=n,e.far=i,e.updateProjectionMatrix())}}),fc.prototype=Object.assign(Object.create(lc.prototype),{constructor:fc,isSpotLight:!0,copy:function(t){return lc.prototype.copy.call(this,t),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}),mc.prototype=Object.assign(Object.create(lc.prototype),{constructor:mc,isPointLight:!0,copy:function(t){return lc.prototype.copy.call(this,t),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}),gc.prototype=Object.assign(Object.create(ha.prototype),{constructor:gc,isOrthographicCamera:!0,copy:function(t,e){return ha.prototype.copy.call(this,t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=null===t.view?null:Object.assign({},t.view),this},setViewOffset:function(t,e,r,n,i,a){null===this.view&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()},clearViewOffset:function(){null!==this.view&&(this.view.enabled=!1),this.updateProjectionMatrix()},updateProjectionMatrix:function(){var t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,n=(this.top+this.bottom)/2,i=r-t,a=r+t,o=n+e,s=n-e;if(null!==this.view&&this.view.enabled){var c=this.zoom/(this.view.width/this.view.fullWidth),h=this.zoom/(this.view.height/this.view.fullHeight),l=(this.right-this.left)/this.view.width,u=(this.top-this.bottom)/this.view.height;a=(i+=l*(this.view.offsetX/c))+l*(this.view.width/c),s=(o-=u*(this.view.offsetY/h))-u*(this.view.height/h)}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far),this.projectionMatrixInverse.getInverse(this.projectionMatrix)},toJSON:function(t){var e=Vr.prototype.toJSON.call(this,t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,null!==this.view&&(e.object.view=Object.assign({},this.view)),e}}),vc.prototype=Object.assign(Object.create(pc.prototype),{constructor:vc}),yc.prototype=Object.assign(Object.create(lc.prototype),{constructor:yc,isDirectionalLight:!0,copy:function(t){return lc.prototype.copy.call(this,t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}),xc.prototype=Object.assign(Object.create(lc.prototype),{constructor:xc,isAmbientLight:!0}),bc.prototype=Object.assign(Object.create(lc.prototype),{constructor:bc,isRectAreaLight:!0,copy:function(t){return lc.prototype.copy.call(this,t),this.width=t.width,this.height=t.height,this},toJSON:function(t){var e=lc.prototype.toJSON.call(this,t);return e.object.width=this.width,e.object.height=this.height,e}}),Object.assign(wc.prototype,{load:function(t,e,r,n){var i=this,a=new Ds(i.manager);a.setPath(i.path),a.load(t,(function(t){e(i.parse(JSON.parse(t)))}),r,n)},parse:function(t){var e=this.textures;function r(t){return void 0===e[t]&&console.warn("THREE.MaterialLoader: Undefined texture",t),e[t]}var n=new fs[t.type];if(void 0!==t.uuid&&(n.uuid=t.uuid),void 0!==t.name&&(n.name=t.name),void 0!==t.color&&n.color.setHex(t.color),void 0!==t.roughness&&(n.roughness=t.roughness),void 0!==t.metalness&&(n.metalness=t.metalness),void 0!==t.emissive&&n.emissive.setHex(t.emissive),void 0!==t.specular&&n.specular.setHex(t.specular),void 0!==t.shininess&&(n.shininess=t.shininess),void 0!==t.clearCoat&&(n.clearCoat=t.clearCoat),void 0!==t.clearCoatRoughness&&(n.clearCoatRoughness=t.clearCoatRoughness),void 0!==t.vertexColors&&(n.vertexColors=t.vertexColors),void 0!==t.fog&&(n.fog=t.fog),void 0!==t.flatShading&&(n.flatShading=t.flatShading),void 0!==t.blending&&(n.blending=t.blending),void 0!==t.combine&&(n.combine=t.combine),void 0!==t.side&&(n.side=t.side),void 0!==t.opacity&&(n.opacity=t.opacity),void 0!==t.transparent&&(n.transparent=t.transparent),void 0!==t.alphaTest&&(n.alphaTest=t.alphaTest),void 0!==t.depthTest&&(n.depthTest=t.depthTest),void 0!==t.depthWrite&&(n.depthWrite=t.depthWrite),void 0!==t.colorWrite&&(n.colorWrite=t.colorWrite),void 0!==t.wireframe&&(n.wireframe=t.wireframe),void 0!==t.wireframeLinewidth&&(n.wireframeLinewidth=t.wireframeLinewidth),void 0!==t.wireframeLinecap&&(n.wireframeLinecap=t.wireframeLinecap),void 0!==t.wireframeLinejoin&&(n.wireframeLinejoin=t.wireframeLinejoin),void 0!==t.rotation&&(n.rotation=t.rotation),1!==t.linewidth&&(n.linewidth=t.linewidth),void 0!==t.dashSize&&(n.dashSize=t.dashSize),void 0!==t.gapSize&&(n.gapSize=t.gapSize),void 0!==t.scale&&(n.scale=t.scale),void 0!==t.polygonOffset&&(n.polygonOffset=t.polygonOffset),void 0!==t.polygonOffsetFactor&&(n.polygonOffsetFactor=t.polygonOffsetFactor),void 0!==t.polygonOffsetUnits&&(n.polygonOffsetUnits=t.polygonOffsetUnits),void 0!==t.skinning&&(n.skinning=t.skinning),void 0!==t.morphTargets&&(n.morphTargets=t.morphTargets),void 0!==t.dithering&&(n.dithering=t.dithering),void 0!==t.visible&&(n.visible=t.visible),void 0!==t.userData&&(n.userData=t.userData),void 0!==t.uniforms)for(var i in t.uniforms){var a=t.uniforms[i];switch(n.uniforms[i]={},a.type){case"t":n.uniforms[i].value=r(a.value);break;case"c":n.uniforms[i].value=(new Lr).setHex(a.value);break;case"v2":n.uniforms[i].value=(new Ke).fromArray(a.value);break;case"v3":n.uniforms[i].value=(new er).fromArray(a.value);break;case"v4":n.uniforms[i].value=(new ur).fromArray(a.value);break;case"m3":n.uniforms[i].value=(new rr).fromArray(a.value);case"m4":n.uniforms[i].value=(new $e).fromArray(a.value);break;default:n.uniforms[i].value=a.value}}if(void 0!==t.defines&&(n.defines=t.defines),void 0!==t.vertexShader&&(n.vertexShader=t.vertexShader),void 0!==t.fragmentShader&&(n.fragmentShader=t.fragmentShader),void 0!==t.extensions)for(var o in t.extensions)n.extensions[o]=t.extensions[o];if(void 0!==t.shading&&(n.flatShading=1===t.shading),void 0!==t.size&&(n.size=t.size),void 0!==t.sizeAttenuation&&(n.sizeAttenuation=t.sizeAttenuation),void 0!==t.map&&(n.map=r(t.map)),void 0!==t.alphaMap&&(n.alphaMap=r(t.alphaMap),n.transparent=!0),void 0!==t.bumpMap&&(n.bumpMap=r(t.bumpMap)),void 0!==t.bumpScale&&(n.bumpScale=t.bumpScale),void 0!==t.normalMap&&(n.normalMap=r(t.normalMap)),void 0!==t.normalMapType&&(n.normalMapType=t.normalMapType),void 0!==t.normalScale){var s=t.normalScale;!1===Array.isArray(s)&&(s=[s,s]),n.normalScale=(new Ke).fromArray(s)}return void 0!==t.displacementMap&&(n.displacementMap=r(t.displacementMap)),void 0!==t.displacementScale&&(n.displacementScale=t.displacementScale),void 0!==t.displacementBias&&(n.displacementBias=t.displacementBias),void 0!==t.roughnessMap&&(n.roughnessMap=r(t.roughnessMap)),void 0!==t.metalnessMap&&(n.metalnessMap=r(t.metalnessMap)),void 0!==t.emissiveMap&&(n.emissiveMap=r(t.emissiveMap)),void 0!==t.emissiveIntensity&&(n.emissiveIntensity=t.emissiveIntensity),void 0!==t.specularMap&&(n.specularMap=r(t.specularMap)),void 0!==t.envMap&&(n.envMap=r(t.envMap)),void 0!==t.envMapIntensity&&(n.envMapIntensity=t.envMapIntensity),void 0!==t.reflectivity&&(n.reflectivity=t.reflectivity),void 0!==t.lightMap&&(n.lightMap=r(t.lightMap)),void 0!==t.lightMapIntensity&&(n.lightMapIntensity=t.lightMapIntensity),void 0!==t.aoMap&&(n.aoMap=r(t.aoMap)),void 0!==t.aoMapIntensity&&(n.aoMapIntensity=t.aoMapIntensity),void 0!==t.gradientMap&&(n.gradientMap=r(t.gradientMap)),n},setPath:function(t){return this.path=t,this},setTextures:function(t){return this.textures=t,this}});var _c={decodeText:function(t){if("undefined"!=typeof TextDecoder)return(new TextDecoder).decode(t);for(var e="",r=0,n=t.length;r<n;r++)e+=String.fromCharCode(t[r]);return decodeURIComponent(escape(e))},extractUrlBase:function(t){var e=t.lastIndexOf("/");return-1===e?"./":t.substr(0,e+1)}};function Mc(t){this.manager=void 0!==t?t:Os}Object.assign(Mc.prototype,{load:function(t,e,r,n){var i=this,a=new Ds(i.manager);a.setPath(i.path),a.load(t,(function(t){e(i.parse(JSON.parse(t)))}),r,n)},parse:function(t){var e=new sn,r=t.data.index;if(void 0!==r){var n=new Ec[r.type](r.array);e.setIndex(new Xr(n,1))}var i=t.data.attributes;for(var a in i){var o=i[a];n=new Ec[o.type](o.array),e.addAttribute(a,new Xr(n,o.itemSize,o.normalized))}var s=t.data.groups||t.data.drawcalls||t.data.offsets;if(void 0!==s)for(var c=0,h=s.length;c!==h;++c){var l=s[c];e.addGroup(l.start,l.count,l.materialIndex)}var u=t.data.boundingSphere;if(void 0!==u){var p=new er;void 0!==u.center&&p.fromArray(u.center),e.boundingSphere=new vr(p,u.radius)}return t.name&&(e.name=t.name),t.userData&&(e.userData=t.userData),e},setPath:function(t){return this.path=t,this}});var Ec={Int8Array,Uint8Array,Uint8ClampedArray:"undefined"!=typeof Uint8ClampedArray?Uint8ClampedArray:Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function Sc(t){this.manager=void 0!==t?t:Os,this.resourcePath=""}Object.assign(Sc.prototype,{crossOrigin:"anonymous",load:function(t,e,r,n){var i=this,a=void 0===this.path?_c.extractUrlBase(t):this.path;this.resourcePath=this.resourcePath||a;var o=new Ds(i.manager);o.setPath(this.path),o.load(t,(function(r){var a=null;try{a=JSON.parse(r)}catch(e){return void 0!==n&&n(e),void console.error("THREE:ObjectLoader: Can't parse "+t+".",e.message)}var o=a.metadata;void 0!==o&&void 0!==o.type&&"geometry"!==o.type.toLowerCase()?i.parse(a,e):console.error("THREE.ObjectLoader: Can't load "+t)}),r,n)},setPath:function(t){return this.path=t,this},setResourcePath:function(t){return this.resourcePath=t,this},setCrossOrigin:function(t){return this.crossOrigin=t,this},parse:function(t,e){var r=this.parseShape(t.shapes),n=this.parseGeometries(t.geometries,r),i=this.parseImages(t.images,(function(){void 0!==e&&e(s)})),a=this.parseTextures(t.textures,i),o=this.parseMaterials(t.materials,a),s=this.parseObject(t.object,n,o);return t.animations&&(s.animations=this.parseAnimations(t.animations)),void 0!==t.images&&0!==t.images.length||void 0!==e&&e(s),s},parseShape:function(t){var e={};if(void 0!==t)for(var r=0,n=t.length;r<n;r++){var i=(new hc).fromJSON(t[r]);e[i.uuid]=i}return e},parseGeometries:function(t,e){var r={};if(void 0!==t)for(var n=new Mc,i=0,a=t.length;i<a;i++){var o,s=t[i];switch(s.type){case"PlaneGeometry":case"PlaneBufferGeometry":o=new ns[s.type](s.width,s.height,s.widthSegments,s.heightSegments);break;case"BoxGeometry":case"BoxBufferGeometry":case"CubeGeometry":o=new ns[s.type](s.width,s.height,s.depth,s.widthSegments,s.heightSegments,s.depthSegments);break;case"CircleGeometry":case"CircleBufferGeometry":o=new ns[s.type](s.radius,s.segments,s.thetaStart,s.thetaLength);break;case"CylinderGeometry":case"CylinderBufferGeometry":o=new ns[s.type](s.radiusTop,s.radiusBottom,s.height,s.radialSegments,s.heightSegments,s.openEnded,s.thetaStart,s.thetaLength);break;case"ConeGeometry":case"ConeBufferGeometry":o=new ns[s.type](s.radius,s.height,s.radialSegments,s.heightSegments,s.openEnded,s.thetaStart,s.thetaLength);break;case"SphereGeometry":case"SphereBufferGeometry":o=new ns[s.type](s.radius,s.widthSegments,s.heightSegments,s.phiStart,s.phiLength,s.thetaStart,s.thetaLength);break;case"DodecahedronGeometry":case"DodecahedronBufferGeometry":case"IcosahedronGeometry":case"IcosahedronBufferGeometry":case"OctahedronGeometry":case"OctahedronBufferGeometry":case"TetrahedronGeometry":case"TetrahedronBufferGeometry":o=new ns[s.type](s.radius,s.detail);break;case"RingGeometry":case"RingBufferGeometry":o=new ns[s.type](s.innerRadius,s.outerRadius,s.thetaSegments,s.phiSegments,s.thetaStart,s.thetaLength);break;case"TorusGeometry":case"TorusBufferGeometry":o=new ns[s.type](s.radius,s.tube,s.radialSegments,s.tubularSegments,s.arc);break;case"TorusKnotGeometry":case"TorusKnotBufferGeometry":o=new ns[s.type](s.radius,s.tube,s.tubularSegments,s.radialSegments,s.p,s.q);break;case"LatheGeometry":case"LatheBufferGeometry":o=new ns[s.type](s.points,s.segments,s.phiStart,s.phiLength);break;case"PolyhedronGeometry":case"PolyhedronBufferGeometry":o=new ns[s.type](s.vertices,s.indices,s.radius,s.details);break;case"ShapeGeometry":case"ShapeBufferGeometry":for(var c=[],h=0,l=s.shapes.length;h<l;h++){var u=e[s.shapes[h]];c.push(u)}o=new ns[s.type](c,s.curveSegments);break;case"ExtrudeGeometry":case"ExtrudeBufferGeometry":for(c=[],h=0,l=s.shapes.length;h<l;h++)u=e[s.shapes[h]],c.push(u);var p=s.options.extrudePath;void 0!==p&&(s.options.extrudePath=(new oc[p.type]).fromJSON(p)),o=new ns[s.type](c,s.options);break;case"BufferGeometry":o=n.parse(s);break;case"Geometry":"THREE"in window&&"LegacyJSONLoader"in THREE?o=(new THREE.LegacyJSONLoader).parse(s,this.resourcePath).geometry:console.error('THREE.ObjectLoader: You have to import LegacyJSONLoader in order load geometry data of type "Geometry".');break;default:console.warn('THREE.ObjectLoader: Unsupported geometry type "'+s.type+'"');continue}o.uuid=s.uuid,void 0!==s.name&&(o.name=s.name),!0===o.isBufferGeometry&&void 0!==s.userData&&(o.userData=s.userData),r[s.uuid]=o}return r},parseMaterials:function(t,e){var r={},n={};if(void 0!==t){var i=new wc;i.setTextures(e);for(var a=0,o=t.length;a<o;a++){var s=t[a];if("MultiMaterial"===s.type){for(var c=[],h=0;h<s.materials.length;h++){var l=s.materials[h];void 0===r[l.uuid]&&(r[l.uuid]=i.parse(l)),c.push(r[l.uuid])}n[s.uuid]=c}else void 0===r[s.uuid]&&(r[s.uuid]=i.parse(s)),n[s.uuid]=r[s.uuid]}}return n},parseAnimations:function(t){for(var e=[],r=0;r<t.length;r++){var n=t[r],i=Ls.parse(n);void 0!==n.uuid&&(i.uuid=n.uuid),e.push(i)}return e},parseImages:function(t,e){var r=this,n={};function i(t){return r.manager.itemStart(t),a.load(t,(function(){r.manager.itemEnd(t)}),void 0,(function(){r.manager.itemError(t),r.manager.itemEnd(t)}))}if(void 0!==t&&t.length>0){var a=new Us(new Ps(e));a.setCrossOrigin(this.crossOrigin);for(var o=0,s=t.length;o<s;o++){var c=t[o],h=c.url;if(Array.isArray(h)){n[c.uuid]=[];for(var l=0,u=h.length;l<u;l++){var p=h[l],d=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(p)?p:r.resourcePath+p;n[c.uuid].push(i(d))}}else d=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(c.url)?c.url:r.resourcePath+c.url,n[c.uuid]=i(d)}}return n},parseTextures:function(t,e){function r(t,e){return"number"==typeof t?t:(console.warn("THREE.ObjectLoader.parseTexture: Constant should be in numeric form.",t),e[t])}var n={};if(void 0!==t)for(var i=0,a=t.length;i<a;i++){var o,s=t[i];void 0===s.image&&console.warn('THREE.ObjectLoader: No "image" specified for',s.uuid),void 0===e[s.image]&&console.warn("THREE.ObjectLoader: Undefined image",s.image),(o=Array.isArray(e[s.image])?new Vn(e[s.image]):new lr(e[s.image])).needsUpdate=!0,o.uuid=s.uuid,void 0!==s.name&&(o.name=s.name),void 0!==s.mapping&&(o.mapping=r(s.mapping,Pc)),void 0!==s.offset&&o.offset.fromArray(s.offset),void 0!==s.repeat&&o.repeat.fromArray(s.repeat),void 0!==s.center&&o.center.fromArray(s.center),void 0!==s.rotation&&(o.rotation=s.rotation),void 0!==s.wrap&&(o.wrapS=r(s.wrap[0],Oc),o.wrapT=r(s.wrap[1],Oc)),void 0!==s.format&&(o.format=s.format),void 0!==s.type&&(o.type=s.type),void 0!==s.encoding&&(o.encoding=s.encoding),void 0!==s.minFilter&&(o.minFilter=r(s.minFilter,Ic)),void 0!==s.magFilter&&(o.magFilter=r(s.magFilter,Ic)),void 0!==s.anisotropy&&(o.anisotropy=s.anisotropy),void 0!==s.flipY&&(o.flipY=s.flipY),void 0!==s.premultiplyAlpha&&(o.premultiplyAlpha=s.premultiplyAlpha),void 0!==s.unpackAlignment&&(o.unpackAlignment=s.unpackAlignment),n[s.uuid]=o}return n},parseObject:function(t,e,r){var n;function i(t){return void 0===e[t]&&console.warn("THREE.ObjectLoader: Undefined geometry",t),e[t]}function a(t){if(void 0!==t){if(Array.isArray(t)){for(var e=[],n=0,i=t.length;n<i;n++){var a=t[n];void 0===r[a]&&console.warn("THREE.ObjectLoader: Undefined material",a),e.push(r[a])}return e}return void 0===r[t]&&console.warn("THREE.ObjectLoader: Undefined material",t),r[t]}}switch(t.type){case"Scene":n=new Ta,void 0!==t.background&&Number.isInteger(t.background)&&(n.background=new Lr(t.background)),void 0!==t.fog&&("Fog"===t.fog.type?n.fog=new Sa(t.fog.color,t.fog.near,t.fog.far):"FogExp2"===t.fog.type&&(n.fog=new Ea(t.fog.color,t.fog.density)));break;case"PerspectiveCamera":n=new la(t.fov,t.aspect,t.near,t.far),void 0!==t.focus&&(n.focus=t.focus),void 0!==t.zoom&&(n.zoom=t.zoom),void 0!==t.filmGauge&&(n.filmGauge=t.filmGauge),void 0!==t.filmOffset&&(n.filmOffset=t.filmOffset),void 0!==t.view&&(n.view=Object.assign({},t.view));break;case"OrthographicCamera":n=new gc(t.left,t.right,t.top,t.bottom,t.near,t.far),void 0!==t.zoom&&(n.zoom=t.zoom),void 0!==t.view&&(n.view=Object.assign({},t.view));break;case"AmbientLight":n=new xc(t.color,t.intensity);break;case"DirectionalLight":n=new yc(t.color,t.intensity);break;case"PointLight":n=new mc(t.color,t.intensity,t.distance,t.decay);break;case"RectAreaLight":n=new bc(t.color,t.intensity,t.width,t.height);break;case"SpotLight":n=new fc(t.color,t.intensity,t.distance,t.angle,t.penumbra,t.decay);break;case"HemisphereLight":n=new uc(t.color,t.groundColor,t.intensity);break;case"SkinnedMesh":console.warn("THREE.ObjectLoader.parseObject() does not support SkinnedMesh yet.");case"Mesh":var o=i(t.geometry),s=a(t.material);n=o.bones&&o.bones.length>0?new Oa(o,s):new Cn(o,s),void 0!==t.drawMode&&n.setDrawMode(t.drawMode);break;case"LOD":n=new Pa;break;case"Line":n=new Ba(i(t.geometry),a(t.material),t.mode);break;case"LineLoop":n=new Ua(i(t.geometry),a(t.material));break;case"LineSegments":n=new za(i(t.geometry),a(t.material));break;case"PointCloud":case"Points":n=new Fa(i(t.geometry),a(t.material));break;case"Sprite":n=new Ca(a(t.material));break;case"Group":n=new ca;break;default:n=new Vr}if(n.uuid=t.uuid,void 0!==t.name&&(n.name=t.name),void 0!==t.matrix?(n.matrix.fromArray(t.matrix),void 0!==t.matrixAutoUpdate&&(n.matrixAutoUpdate=t.matrixAutoUpdate),n.matrixAutoUpdate&&n.matrix.decompose(n.position,n.quaternion,n.scale)):(void 0!==t.position&&n.position.fromArray(t.position),void 0!==t.rotation&&n.rotation.fromArray(t.rotation),void 0!==t.quaternion&&n.quaternion.fromArray(t.quaternion),void 0!==t.scale&&n.scale.fromArray(t.scale)),void 0!==t.castShadow&&(n.castShadow=t.castShadow),void 0!==t.receiveShadow&&(n.receiveShadow=t.receiveShadow),t.shadow&&(void 0!==t.shadow.bias&&(n.shadow.bias=t.shadow.bias),void 0!==t.shadow.radius&&(n.shadow.radius=t.shadow.radius),void 0!==t.shadow.mapSize&&n.shadow.mapSize.fromArray(t.shadow.mapSize),void 0!==t.shadow.camera&&(n.shadow.camera=this.parseObject(t.shadow.camera))),void 0!==t.visible&&(n.visible=t.visible),void 0!==t.frustumCulled&&(n.frustumCulled=t.frustumCulled),void 0!==t.renderOrder&&(n.renderOrder=t.renderOrder),void 0!==t.userData&&(n.userData=t.userData),void 0!==t.layers&&(n.layers.mask=t.layers),void 0!==t.children)for(var c=t.children,h=0;h<c.length;h++)n.add(this.parseObject(c[h],e,r));if("LOD"===t.type)for(var l=t.levels,u=0;u<l.length;u++){var p=l[u],d=n.getObjectByProperty("uuid",p.object);void 0!==d&&n.addLevel(d,p.distance)}return n}});var Tc,Ac,Lc,Rc,Cc,Pc={UVMapping:bt,CubeReflectionMapping:wt,CubeRefractionMapping:_t,EquirectangularReflectionMapping:Mt,EquirectangularRefractionMapping:Et,SphericalReflectionMapping:St,CubeUVReflectionMapping:Tt,CubeUVRefractionMapping:At},Oc={RepeatWrapping:Lt,ClampToEdgeWrapping:Rt,MirroredRepeatWrapping:Ct},Ic={NearestFilter:Pt,NearestMipMapNearestFilter:Ot,NearestMipMapLinearFilter:It,LinearFilter:Dt,LinearMipMapNearestFilter:Nt,LinearMipMapLinearFilter:Bt};function Dc(t){"undefined"==typeof createImageBitmap&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),"undefined"==typeof fetch&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.manager=void 0!==t?t:Os,this.options=void 0}function Nc(){this.type="ShapePath",this.color=new Lr,this.subPaths=[],this.currentPath=null}function Bc(t){this.type="Font",this.data=t}function zc(t,e,r,n,i){var a=i.glyphs[t]||i.glyphs["?"];if(a){var o,s,c,h,l,u,p,d,f=new Nc;if(a.o)for(var m=a._cachedOutline||(a._cachedOutline=a.o.split(" ")),g=0,v=m.length;g<v;)switch(m[g++]){case"m":o=m[g++]*e+r,s=m[g++]*e+n,f.moveTo(o,s);break;case"l":o=m[g++]*e+r,s=m[g++]*e+n,f.lineTo(o,s);break;case"q":c=m[g++]*e+r,h=m[g++]*e+n,l=m[g++]*e+r,u=m[g++]*e+n,f.quadraticCurveTo(l,u,c,h);break;case"b":c=m[g++]*e+r,h=m[g++]*e+n,l=m[g++]*e+r,u=m[g++]*e+n,p=m[g++]*e+r,d=m[g++]*e+n,f.bezierCurveTo(l,u,p,d,c,h)}return{offsetX:a.ha*e,path:f}}}function Uc(t){this.manager=void 0!==t?t:Os}function Gc(){}Dc.prototype={constructor:Dc,setOptions:function(t){return this.options=t,this},load:function(t,e,r,n){void 0===t&&(t=""),void 0!==this.path&&(t=this.path+t),t=this.manager.resolveURL(t);var i=this,a=Cs.get(t);if(void 0!==a)return i.manager.itemStart(t),setTimeout((function(){e&&e(a),i.manager.itemEnd(t)}),0),a;fetch(t).then((function(t){return t.blob()})).then((function(t){return createImageBitmap(t,i.options)})).then((function(r){Cs.add(t,r),e&&e(r),i.manager.itemEnd(t)})).catch((function(e){n&&n(e),i.manager.itemError(t),i.manager.itemEnd(t)}))},setCrossOrigin:function(){return this},setPath:function(t){return this.path=t,this}},Object.assign(Nc.prototype,{moveTo:function(t,e){this.currentPath=new cc,this.subPaths.push(this.currentPath),this.currentPath.moveTo(t,e)},lineTo:function(t,e){this.currentPath.lineTo(t,e)},quadraticCurveTo:function(t,e,r,n){this.currentPath.quadraticCurveTo(t,e,r,n)},bezierCurveTo:function(t,e,r,n,i,a){this.currentPath.bezierCurveTo(t,e,r,n,i,a)},splineThru:function(t){this.currentPath.splineThru(t)},toShapes:function(t,e){function r(t){for(var e=[],r=0,n=t.length;r<n;r++){var i=t[r],a=new hc;a.curves=i.curves,e.push(a)}return e}function n(t,e){for(var r=e.length,n=!1,i=r-1,a=0;a<r;i=a++){var o=e[i],s=e[a],c=s.x-o.x,h=s.y-o.y;if(Math.abs(h)>Number.EPSILON){if(h<0&&(o=e[a],c=-c,s=e[i],h=-h),t.y<o.y||t.y>s.y)continue;if(t.y===o.y){if(t.x===o.x)return!0}else{var l=h*(t.x-o.x)-c*(t.y-o.y);if(0===l)return!0;if(l<0)continue;n=!n}}else{if(t.y!==o.y)continue;if(s.x<=t.x&&t.x<=o.x||o.x<=t.x&&t.x<=s.x)return!0}}return n}var i=Oo.isClockWise,a=this.subPaths;if(0===a.length)return[];if(!0===e)return r(a);var o,s,c,h=[];if(1===a.length)return s=a[0],(c=new hc).curves=s.curves,h.push(c),h;var l=!i(a[0].getPoints());l=t?!l:l;var u,p,d=[],f=[],m=[],g=0;f[g]=void 0,m[g]=[];for(var v=0,y=a.length;v<y;v++)o=i(u=(s=a[v]).getPoints()),(o=t?!o:o)?(!l&&f[g]&&g++,f[g]={s:new hc,p:u},f[g].s.curves=s.curves,l&&g++,m[g]=[]):m[g].push({h:s,p:u[0]});if(!f[0])return r(a);if(f.length>1){for(var x=!1,b=[],w=0,_=f.length;w<_;w++)d[w]=[];for(w=0,_=f.length;w<_;w++)for(var M=m[w],E=0;E<M.length;E++){for(var S=M[E],T=!0,A=0;A<f.length;A++)n(S.p,f[A].p)&&(w!==A&&b.push({froms:w,tos:A,hole:E}),T?(T=!1,d[A].push(S)):x=!0);T&&d[w].push(S)}b.length>0&&(x||(m=d))}v=0;for(var L=f.length;v<L;v++){c=f[v].s,h.push(c);for(var R=0,C=(p=m[v]).length;R<C;R++)c.holes.push(p[R].h)}return h}}),Object.assign(Bc.prototype,{isFont:!0,generateShapes:function(t,e){void 0===e&&(e=100);for(var r=[],n=function(t,e,r){for(var n=Array.from?Array.from(t):String(t).split(""),i=e/r.resolution,a=(r.boundingBox.yMax-r.boundingBox.yMin+r.underlineThickness)*i,o=[],s=0,c=0,h=0;h<n.length;h++){var l=n[h];if("\n"===l)s=0,c-=a;else{var u=zc(l,i,s,c,r);s+=u.offsetX,o.push(u.path)}}return o}(t,e,this.data),i=0,a=n.length;i<a;i++)Array.prototype.push.apply(r,n[i].toShapes());return r}}),Object.assign(Uc.prototype,{load:function(t,e,r,n){var i=this,a=new Ds(this.manager);a.setPath(this.path),a.load(t,(function(t){var r;try{r=JSON.parse(t)}catch(e){console.warn("THREE.FontLoader: typeface.js support is being deprecated. Use typeface.json instead."),r=JSON.parse(t.substring(65,t.length-2))}var n=i.parse(r);e&&e(n)}),r,n)},parse:function(t){return new Bc(t)},setPath:function(t){return this.path=t,this}}),Gc.Handlers={handlers:[],add:function(t,e){this.handlers.push(t,e)},get:function(t){for(var e=this.handlers,r=0,n=e.length;r<n;r+=2){var i=e[r],a=e[r+1];if(i.test(t))return a}return null}},Object.assign(Gc.prototype,{crossOrigin:"anonymous",onLoadStart:function(){},onLoadProgress:function(){},onLoadComplete:function(){},initMaterials:function(t,e,r){for(var n=[],i=0;i<t.length;++i)n[i]=this.createMaterial(t[i],e,r);return n},createMaterial:(Tc={NoBlending:N,NormalBlending:B,AdditiveBlending:z,SubtractiveBlending:U,MultiplyBlending:G,CustomBlending:F},Ac=new Lr,Lc=new Fs,Rc=new wc,function(t,e,r){var n={};function i(t,i,a,o,s){var c,h=e+t,l=Gc.Handlers.get(h);null!==l?c=l.load(h):(Lc.setCrossOrigin(r),c=Lc.load(h)),void 0!==i&&(c.repeat.fromArray(i),1!==i[0]&&(c.wrapS=Lt),1!==i[1]&&(c.wrapT=Lt)),void 0!==a&&c.offset.fromArray(a),void 0!==o&&("repeat"===o[0]&&(c.wrapS=Lt),"mirror"===o[0]&&(c.wrapS=Ct),"repeat"===o[1]&&(c.wrapT=Lt),"mirror"===o[1]&&(c.wrapT=Ct)),void 0!==s&&(c.anisotropy=s);var u=Qe.generateUUID();return n[u]=c,u}var a={uuid:Qe.generateUUID(),type:"MeshLambertMaterial"};for(var o in t){var s=t[o];switch(o){case"DbgColor":case"DbgIndex":case"opticalDensity":case"illumination":case"mapDiffuseRepeat":case"mapDiffuseOffset":case"mapDiffuseWrap":case"mapDiffuseAnisotropy":case"mapEmissiveRepeat":case"mapEmissiveOffset":case"mapEmissiveWrap":case"mapEmissiveAnisotropy":case"mapLightRepeat":case"mapLightOffset":case"mapLightWrap":case"mapLightAnisotropy":case"mapAORepeat":case"mapAOOffset":case"mapAOWrap":case"mapAOAnisotropy":case"mapBumpRepeat":case"mapBumpOffset":case"mapBumpWrap":case"mapBumpAnisotropy":case"mapNormalRepeat":case"mapNormalOffset":case"mapNormalWrap":case"mapNormalAnisotropy":case"mapSpecularRepeat":case"mapSpecularOffset":case"mapSpecularWrap":case"mapSpecularAnisotropy":case"mapMetalnessRepeat":case"mapMetalnessOffset":case"mapMetalnessWrap":case"mapMetalnessAnisotropy":case"mapRoughnessRepeat":case"mapRoughnessOffset":case"mapRoughnessWrap":case"mapRoughnessAnisotropy":case"mapAlphaRepeat":case"mapAlphaOffset":case"mapAlphaWrap":case"mapAlphaAnisotropy":break;case"DbgName":a.name=s;break;case"blending":a.blending=Tc[s];break;case"colorAmbient":case"mapAmbient":console.warn("THREE.Loader.createMaterial:",o,"is no longer supported.");break;case"colorDiffuse":a.color=Ac.fromArray(s).getHex();break;case"colorSpecular":a.specular=Ac.fromArray(s).getHex();break;case"colorEmissive":a.emissive=Ac.fromArray(s).getHex();break;case"specularCoef":a.shininess=s;break;case"shading":"basic"===s.toLowerCase()&&(a.type="MeshBasicMaterial"),"phong"===s.toLowerCase()&&(a.type="MeshPhongMaterial"),"standard"===s.toLowerCase()&&(a.type="MeshStandardMaterial");break;case"mapDiffuse":a.map=i(s,t.mapDiffuseRepeat,t.mapDiffuseOffset,t.mapDiffuseWrap,t.mapDiffuseAnisotropy);break;case"mapEmissive":a.emissiveMap=i(s,t.mapEmissiveRepeat,t.mapEmissiveOffset,t.mapEmissiveWrap,t.mapEmissiveAnisotropy);break;case"mapLight":a.lightMap=i(s,t.mapLightRepeat,t.mapLightOffset,t.mapLightWrap,t.mapLightAnisotropy);break;case"mapAO":a.aoMap=i(s,t.mapAORepeat,t.mapAOOffset,t.mapAOWrap,t.mapAOAnisotropy);break;case"mapBump":a.bumpMap=i(s,t.mapBumpRepeat,t.mapBumpOffset,t.mapBumpWrap,t.mapBumpAnisotropy);break;case"mapBumpScale":a.bumpScale=s;break;case"mapNormal":a.normalMap=i(s,t.mapNormalRepeat,t.mapNormalOffset,t.mapNormalWrap,t.mapNormalAnisotropy);break;case"mapNormalFactor":a.normalScale=s;break;case"mapSpecular":a.specularMap=i(s,t.mapSpecularRepeat,t.mapSpecularOffset,t.mapSpecularWrap,t.mapSpecularAnisotropy);break;case"mapMetalness":a.metalnessMap=i(s,t.mapMetalnessRepeat,t.mapMetalnessOffset,t.mapMetalnessWrap,t.mapMetalnessAnisotropy);break;case"mapRoughness":a.roughnessMap=i(s,t.mapRoughnessRepeat,t.mapRoughnessOffset,t.mapRoughnessWrap,t.mapRoughnessAnisotropy);break;case"mapAlpha":a.alphaMap=i(s,t.mapAlphaRepeat,t.mapAlphaOffset,t.mapAlphaWrap,t.mapAlphaAnisotropy);break;case"flipSided":a.side=L;break;case"doubleSided":a.side=R;break;case"transparency":console.warn("THREE.Loader.createMaterial: transparency has been renamed to opacity"),a.opacity=s;break;case"depthTest":case"depthWrite":case"colorWrite":case"opacity":case"reflectivity":case"transparent":case"visible":case"wireframe":a[o]=s;break;case"vertexColors":!0===s&&(a.vertexColors=D),"face"===s&&(a.vertexColors=I);break;default:console.error("THREE.Loader.createMaterial: Unsupported",o,s)}}return"MeshBasicMaterial"===a.type&&delete a.emissive,"MeshPhongMaterial"!==a.type&&delete a.specular,a.opacity<1&&(a.transparent=!0),Rc.setTextures(n),Rc.parse(a)})});var Fc,Hc,Vc,jc,kc,Wc,qc,Xc,Yc,Jc,Zc={getContext:function(){return void 0===Cc&&(Cc=new(window.AudioContext||window.webkitAudioContext)),Cc},setContext:function(t){Cc=t}};function Qc(t){this.manager=void 0!==t?t:Os}function Kc(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new la,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new la,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1}function $c(t,e,r,n){Vr.call(this),this.type="CubeCamera";var i=90,a=new la(i,1,t,e);a.up.set(0,-1,0),a.lookAt(new er(1,0,0)),this.add(a);var o=new la(i,1,t,e);o.up.set(0,-1,0),o.lookAt(new er(-1,0,0)),this.add(o);var s=new la(i,1,t,e);s.up.set(0,0,1),s.lookAt(new er(0,1,0)),this.add(s);var c=new la(i,1,t,e);c.up.set(0,0,-1),c.lookAt(new er(0,-1,0)),this.add(c);var h=new la(i,1,t,e);h.up.set(0,-1,0),h.lookAt(new er(0,0,1)),this.add(h);var l=new la(i,1,t,e);l.up.set(0,-1,0),l.lookAt(new er(0,0,-1)),this.add(l),n=n||{format:Zt,magFilter:Dt,minFilter:Dt},this.renderTarget=new fr(r,r,n),this.renderTarget.texture.name="CubeCamera",this.update=function(t,e){null===this.parent&&this.updateMatrixWorld();var r=t.getRenderTarget(),n=this.renderTarget,i=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,n.activeCubeFace=0,t.render(e,a,n),n.activeCubeFace=1,t.render(e,o,n),n.activeCubeFace=2,t.render(e,s,n),n.activeCubeFace=3,t.render(e,c,n),n.activeCubeFace=4,t.render(e,h,n),n.texture.generateMipmaps=i,n.activeCubeFace=5,t.render(e,l,n),t.setRenderTarget(r)},this.clear=function(t,e,r,n){for(var i=t.getRenderTarget(),a=this.renderTarget,o=0;o<6;o++)a.activeCubeFace=o,t.setRenderTarget(a),t.clear(e,r,n);t.setRenderTarget(i)}}function th(t){this.autoStart=void 0===t||t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}function eh(){Vr.call(this),this.type="AudioListener",this.context=Zc.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0}function rh(t){Vr.call(this),this.type="Audio",this.listener=t,this.context=t.context,this.gain=this.context.createGain(),this.gain.connect(t.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.startTime=0,this.offset=0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.sourceType="empty",this.filters=[]}function nh(t){rh.call(this,t),this.panner=this.context.createPanner(),this.panner.connect(this.gain)}function ih(t,e){this.analyser=t.context.createAnalyser(),this.analyser.fftSize=void 0!==e?e:2048,this.data=new Uint8Array(this.analyser.frequencyBinCount),t.getOutput().connect(this.analyser)}function ah(t,e,r){this.binding=t,this.valueSize=r;var n,i=Float64Array;switch(e){case"quaternion":n=this._slerp;break;case"string":case"bool":i=Array,n=this._select;break;default:n=this._lerp}this.buffer=new i(4*r),this._mixBufferRegion=n,this.cumulativeWeight=0,this.useCount=0,this.referenceCount=0}Object.assign(Qc.prototype,{load:function(t,e,r,n){var i=new Ds(this.manager);i.setResponseType("arraybuffer"),i.setPath(this.path),i.load(t,(function(t){var r=t.slice(0);Zc.getContext().decodeAudioData(r,(function(t){e(t)}))}),r,n)},setPath:function(t){return this.path=t,this}}),Object.assign(Kc.prototype,{update:(Yc=new $e,Jc=new $e,function(t){if(Fc!==this||Hc!==t.focus||Vc!==t.fov||jc!==t.aspect*this.aspect||kc!==t.near||Wc!==t.far||qc!==t.zoom||Xc!==this.eyeSep){Fc=this,Hc=t.focus,Vc=t.fov,jc=t.aspect*this.aspect,kc=t.near,Wc=t.far,qc=t.zoom;var e,r,n=t.projectionMatrix.clone(),i=(Xc=this.eyeSep/2)*kc/Hc,a=kc*Math.tan(Qe.DEG2RAD*Vc*.5)/qc;Jc.elements[12]=-Xc,Yc.elements[12]=Xc,e=-a*jc+i,r=a*jc+i,n.elements[0]=2*kc/(r-e),n.elements[8]=(r+e)/(r-e),this.cameraL.projectionMatrix.copy(n),e=-a*jc-i,r=a*jc-i,n.elements[0]=2*kc/(r-e),n.elements[8]=(r+e)/(r-e),this.cameraR.projectionMatrix.copy(n)}this.cameraL.matrixWorld.copy(t.matrixWorld).multiply(Jc),this.cameraR.matrixWorld.copy(t.matrixWorld).multiply(Yc)})}),$c.prototype=Object.create(Vr.prototype),$c.prototype.constructor=$c,Object.assign(th.prototype,{start:function(){this.startTime=("undefined"==typeof performance?Date:performance).now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0},stop:function(){this.getElapsedTime(),this.running=!1,this.autoStart=!1},getElapsedTime:function(){return this.getDelta(),this.elapsedTime},getDelta:function(){var t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){var e=("undefined"==typeof performance?Date:performance).now();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}),eh.prototype=Object.assign(Object.create(Vr.prototype),{constructor:eh,getInput:function(){return this.gain},removeFilter:function(){return null!==this.filter&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null),this},getFilter:function(){return this.filter},setFilter:function(t){return null!==this.filter?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):this.gain.disconnect(this.context.destination),this.filter=t,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this},getMasterVolume:function(){return this.gain.gain.value},setMasterVolume:function(t){return this.gain.gain.setTargetAtTime(t,this.context.currentTime,.01),this},updateMatrixWorld:function(){var t=new er,e=new tr,r=new er,n=new er,i=new th;return function(a){Vr.prototype.updateMatrixWorld.call(this,a);var o=this.context.listener,s=this.up;if(this.timeDelta=i.getDelta(),this.matrixWorld.decompose(t,e,r),n.set(0,0,-1).applyQuaternion(e),o.positionX){var c=this.context.currentTime+this.timeDelta;o.positionX.linearRampToValueAtTime(t.x,c),o.positionY.linearRampToValueAtTime(t.y,c),o.positionZ.linearRampToValueAtTime(t.z,c),o.forwardX.linearRampToValueAtTime(n.x,c),o.forwardY.linearRampToValueAtTime(n.y,c),o.forwardZ.linearRampToValueAtTime(n.z,c),o.upX.linearRampToValueAtTime(s.x,c),o.upY.linearRampToValueAtTime(s.y,c),o.upZ.linearRampToValueAtTime(s.z,c)}else o.setPosition(t.x,t.y,t.z),o.setOrientation(n.x,n.y,n.z,s.x,s.y,s.z)}}()}),rh.prototype=Object.assign(Object.create(Vr.prototype),{constructor:rh,getOutput:function(){return this.gain},setNodeSource:function(t){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=t,this.connect(),this},setMediaElementSource:function(t){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(t),this.connect(),this},setBuffer:function(t){return this.buffer=t,this.sourceType="buffer",this.autoplay&&this.play(),this},play:function(){if(!0!==this.isPlaying){if(!1!==this.hasPlaybackControl){var t=this.context.createBufferSource();return t.buffer=this.buffer,t.loop=this.loop,t.onended=this.onEnded.bind(this),this.startTime=this.context.currentTime,t.start(this.startTime,this.offset),this.isPlaying=!0,this.source=t,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}console.warn("THREE.Audio: this Audio has no playback control.")}else console.warn("THREE.Audio: Audio is already playing.")},pause:function(){if(!1!==this.hasPlaybackControl)return!0===this.isPlaying&&(this.source.stop(),this.source.onended=null,this.offset+=(this.context.currentTime-this.startTime)*this.playbackRate,this.isPlaying=!1),this;console.warn("THREE.Audio: this Audio has no playback control.")},stop:function(){if(!1!==this.hasPlaybackControl)return this.source.stop(),this.source.onended=null,this.offset=0,this.isPlaying=!1,this;console.warn("THREE.Audio: this Audio has no playback control.")},connect:function(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(var t=1,e=this.filters.length;t<e;t++)this.filters[t-1].connect(this.filters[t]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this},disconnect:function(){if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(var t=1,e=this.filters.length;t<e;t++)this.filters[t-1].disconnect(this.filters[t]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this},getFilters:function(){return this.filters},setFilters:function(t){return t||(t=[]),!0===this.isPlaying?(this.disconnect(),this.filters=t,this.connect()):this.filters=t,this},setDetune:function(t){if(this.detune=t,void 0!==this.source.detune)return!0===this.isPlaying&&this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,.01),this},getDetune:function(){return this.detune},getFilter:function(){return this.getFilters()[0]},setFilter:function(t){return this.setFilters(t?[t]:[])},setPlaybackRate:function(t){if(!1!==this.hasPlaybackControl)return this.playbackRate=t,!0===this.isPlaying&&this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,.01),this;console.warn("THREE.Audio: this Audio has no playback control.")},getPlaybackRate:function(){return this.playbackRate},onEnded:function(){this.isPlaying=!1},getLoop:function(){return!1===this.hasPlaybackControl?(console.warn("THREE.Audio: this Audio has no playback control."),!1):this.loop},setLoop:function(t){if(!1!==this.hasPlaybackControl)return this.loop=t,!0===this.isPlaying&&(this.source.loop=this.loop),this;console.warn("THREE.Audio: this Audio has no playback control.")},getVolume:function(){return this.gain.gain.value},setVolume:function(t){return this.gain.gain.setTargetAtTime(t,this.context.currentTime,.01),this}}),nh.prototype=Object.assign(Object.create(rh.prototype),{constructor:nh,getOutput:function(){return this.panner},getRefDistance:function(){return this.panner.refDistance},setRefDistance:function(t){return this.panner.refDistance=t,this},getRolloffFactor:function(){return this.panner.rolloffFactor},setRolloffFactor:function(t){return this.panner.rolloffFactor=t,this},getDistanceModel:function(){return this.panner.distanceModel},setDistanceModel:function(t){return this.panner.distanceModel=t,this},getMaxDistance:function(){return this.panner.maxDistance},setMaxDistance:function(t){return this.panner.maxDistance=t,this},setDirectionalCone:function(t,e,r){return this.panner.coneInnerAngle=t,this.panner.coneOuterAngle=e,this.panner.coneOuterGain=r,this},updateMatrixWorld:function(){var t=new er,e=new tr,r=new er,n=new er;return function(i){if(Vr.prototype.updateMatrixWorld.call(this,i),!1!==this.isPlaying){this.matrixWorld.decompose(t,e,r),n.set(0,0,1).applyQuaternion(e);var a=this.panner;if(a.positionX){var o=this.context.currentTime+this.listener.timeDelta;a.positionX.linearRampToValueAtTime(t.x,o),a.positionY.linearRampToValueAtTime(t.y,o),a.positionZ.linearRampToValueAtTime(t.z,o),a.orientationX.linearRampToValueAtTime(n.x,o),a.orientationY.linearRampToValueAtTime(n.y,o),a.orientationZ.linearRampToValueAtTime(n.z,o)}else a.setPosition(t.x,t.y,t.z),a.setOrientation(n.x,n.y,n.z)}}}()}),Object.assign(ih.prototype,{getFrequencyData:function(){return this.analyser.getByteFrequencyData(this.data),this.data},getAverageFrequency:function(){for(var t=0,e=this.getFrequencyData(),r=0;r<e.length;r++)t+=e[r];return t/e.length}}),Object.assign(ah.prototype,{accumulate:function(t,e){var r=this.buffer,n=this.valueSize,i=t*n+n,a=this.cumulativeWeight;if(0===a){for(var o=0;o!==n;++o)r[i+o]=r[o];a=e}else{var s=e/(a+=e);this._mixBufferRegion(r,i,0,s,n)}this.cumulativeWeight=a},apply:function(t){var e=this.valueSize,r=this.buffer,n=t*e+e,i=this.cumulativeWeight,a=this.binding;if(this.cumulativeWeight=0,i<1){var o=3*e;this._mixBufferRegion(r,n,o,1-i,e)}for(var s=e,c=e+e;s!==c;++s)if(r[s]!==r[s+e]){a.setValue(r,n);break}},saveOriginalState:function(){var t=this.binding,e=this.buffer,r=this.valueSize,n=3*r;t.getValue(e,n);for(var i=r,a=n;i!==a;++i)e[i]=e[n+i%r];this.cumulativeWeight=0},restoreOriginalState:function(){var t=3*this.valueSize;this.binding.setValue(this.buffer,t)},_select:function(t,e,r,n,i){if(n>=.5)for(var a=0;a!==i;++a)t[e+a]=t[r+a]},_slerp:function(t,e,r,n){tr.slerpFlat(t,e,t,e,t,r,n)},_lerp:function(t,e,r,n,i){for(var a=1-n,o=0;o!==i;++o){var s=e+o;t[s]=t[s]*a+t[r+o]*n}}});var oh,sh,ch,hh,lh,uh,ph,dh,fh,mh,gh,vh,yh,xh,bh,wh="\\[\\]\\.:\\/";function _h(t,e,r){var n=r||Mh.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,n)}function Mh(t,e,r){this.path=e,this.parsedPath=r||Mh.parseTrackName(e),this.node=Mh.findNode(t,this.parsedPath.nodeName)||t,this.rootNode=t}function Eh(){this.uuid=Qe.generateUUID(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;var t={};this._indicesByUUID=t;for(var e=0,r=arguments.length;e!==r;++e)t[arguments[e].uuid]=e;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};var n=this;this.stats={objects:{get total(){return n._objects.length},get inUse(){return this.total-n.nCachedObjects_}},get bindingsPerObject(){return n._bindings.length}}}function Sh(t,e,r){this._mixer=t,this._clip=e,this._localRoot=r||null;for(var n=e.tracks,i=n.length,a=new Array(i),o={endingStart:Ie,endingEnd:Ie},s=0;s!==i;++s){var c=n[s].createInterpolant(null);a[s]=c,c.settings=o}this._interpolantSettings=o,this._interpolants=a,this._propertyBindings=new Array(i),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=Le,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}function Th(t){this._root=t,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}function Ah(t){"string"==typeof t&&(console.warn("THREE.Uniform: Type parameter is no longer needed."),t=arguments[1]),this.value=t}function Lh(){sn.call(this),this.type="InstancedBufferGeometry",this.maxInstancedCount=void 0}function Rh(t,e,r){Aa.call(this,t,e),this.meshPerAttribute=r||1}function Ch(t,e,r,n){"number"==typeof r&&(n=r,r=!1,console.error("THREE.InstancedBufferAttribute: The constructor now expects normalized as the third argument.")),Xr.call(this,t,e,r),this.meshPerAttribute=n||1}function Ph(t,e,r,n){this.ray=new An(t,e),this.near=r||0,this.far=n||1/0,this.params={Mesh:{},Line:{},LOD:{},Points:{threshold:1},Sprite:{}},Object.defineProperties(this.params,{PointCloud:{get:function(){return console.warn("THREE.Raycaster: params.PointCloud has been renamed to params.Points."),this.Points}}})}function Oh(t,e){return t.distance-e.distance}function Ih(t,e,r,n){if(!1!==t.visible&&(t.raycast(e,r),!0===n))for(var i=t.children,a=0,o=i.length;a<o;a++)Ih(i[a],e,r,!0)}function Dh(t,e,r){return this.radius=void 0!==t?t:1,this.phi=void 0!==e?e:0,this.theta=void 0!==r?r:0,this}function Nh(t,e,r){return this.radius=void 0!==t?t:1,this.theta=void 0!==e?e:0,this.y=void 0!==r?r:0,this}function Bh(t,e){this.min=void 0!==t?t:new Ke(1/0,1/0),this.max=void 0!==e?e:new Ke(-1/0,-1/0)}function zh(t,e){this.start=void 0!==t?t:new er,this.end=void 0!==e?e:new er}function Uh(t){Vr.call(this),this.material=t,this.render=function(){}}function Gh(t,e,r,n){this.object=t,this.size=void 0!==e?e:1;var i=void 0!==r?r:16711680,a=void 0!==n?n:1,o=0,s=this.object.geometry;s&&s.isGeometry?o=3*s.faces.length:s&&s.isBufferGeometry&&(o=s.attributes.normal.count);var c=new sn,h=new en(2*o*3,3);c.addAttribute("position",h),za.call(this,c,new Na({color:i,linewidth:a})),this.matrixAutoUpdate=!1,this.update()}function Fh(t,e){Vr.call(this),this.light=t,this.light.updateMatrixWorld(),this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=e;for(var r=new sn,n=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1],i=0,a=1;i<32;i++,a++){var o=i/32*Math.PI*2,s=a/32*Math.PI*2;n.push(Math.cos(o),Math.sin(o),1,Math.cos(s),Math.sin(s),1)}r.addAttribute("position",new en(n,3));var c=new Na({fog:!1});this.cone=new za(r,c),this.add(this.cone),this.update()}function Hh(t){var e=[];t&&t.isBone&&e.push(t);for(var r=0;r<t.children.length;r++)e.push.apply(e,Hh(t.children[r]));return e}function Vh(t){for(var e=Hh(t),r=new sn,n=[],i=[],a=new Lr(0,0,1),o=new Lr(0,1,0),s=0;s<e.length;s++){var c=e[s];c.parent&&c.parent.isBone&&(n.push(0,0,0),n.push(0,0,0),i.push(a.r,a.g,a.b),i.push(o.r,o.g,o.b))}r.addAttribute("position",new en(n,3)),r.addAttribute("color",new en(i,3));var h=new Na({vertexColors:D,depthTest:!1,depthWrite:!1,transparent:!0});za.call(this,r,h),this.root=t,this.bones=e,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1}function jh(t,e,r){this.light=t,this.light.updateMatrixWorld(),this.color=r;var n=new Vo(e,4,2),i=new Rn({wireframe:!0,fog:!1});Cn.call(this,n,i),this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}function kh(t,e){this.type="RectAreaLightHelper",this.light=t,this.color=e;var r=new sn;r.addAttribute("position",new en([1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],3)),r.computeBoundingSphere();var n=new Na({fog:!1});Ba.call(this,r,n);var i=new sn;i.addAttribute("position",new en([1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],3)),i.computeBoundingSphere(),this.add(new Cn(i,new Rn({side:L,fog:!1}))),this.update()}function Wh(t,e,r){Vr.call(this),this.light=t,this.light.updateMatrixWorld(),this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=r;var n=new $a(e);n.rotateY(.5*Math.PI),this.material=new Rn({wireframe:!0,fog:!1}),void 0===this.color&&(this.material.vertexColors=D);var i=n.getAttribute("position"),a=new Float32Array(3*i.count);n.addAttribute("color",new Xr(a,3)),this.add(new Cn(n,this.material)),this.update()}function qh(t,e,r,n){t=t||10,e=e||10,r=new Lr(void 0!==r?r:4473924),n=new Lr(void 0!==n?n:8947848);for(var i=e/2,a=t/e,o=t/2,s=[],c=[],h=0,l=0,u=-o;h<=e;h++,u+=a){s.push(-o,0,u,o,0,u),s.push(u,0,-o,u,0,o);var p=h===i?r:n;p.toArray(c,l),l+=3,p.toArray(c,l),l+=3,p.toArray(c,l),l+=3,p.toArray(c,l),l+=3}var d=new sn;d.addAttribute("position",new en(s,3)),d.addAttribute("color",new en(c,3));var f=new Na({vertexColors:D});za.call(this,d,f)}function Xh(t,e,r,n,i,a){t=t||10,e=e||16,r=r||8,n=n||64,i=new Lr(void 0!==i?i:4473924),a=new Lr(void 0!==a?a:8947848);var o,s,c,h,l,u,p,d=[],f=[];for(h=0;h<=e;h++)c=h/e*(2*Math.PI),o=Math.sin(c)*t,s=Math.cos(c)*t,d.push(0,0,0),d.push(o,0,s),p=1&h?i:a,f.push(p.r,p.g,p.b),f.push(p.r,p.g,p.b);for(h=0;h<=r;h++)for(p=1&h?i:a,u=t-t/r*h,l=0;l<n;l++)c=l/n*(2*Math.PI),o=Math.sin(c)*u,s=Math.cos(c)*u,d.push(o,0,s),f.push(p.r,p.g,p.b),c=(l+1)/n*(2*Math.PI),o=Math.sin(c)*u,s=Math.cos(c)*u,d.push(o,0,s),f.push(p.r,p.g,p.b);var m=new sn;m.addAttribute("position",new en(d,3)),m.addAttribute("color",new en(f,3));var g=new Na({vertexColors:D});za.call(this,m,g)}function Yh(t,e,r,n){this.object=t,this.size=void 0!==e?e:1;var i=void 0!==r?r:16776960,a=void 0!==n?n:1,o=0,s=this.object.geometry;s&&s.isGeometry?o=s.faces.length:console.warn("THREE.FaceNormalsHelper: only THREE.Geometry is supported. Use THREE.VertexNormalsHelper, instead.");var c=new sn,h=new en(2*o*3,3);c.addAttribute("position",h),za.call(this,c,new Na({color:i,linewidth:a})),this.matrixAutoUpdate=!1,this.update()}function Jh(t,e,r){Vr.call(this),this.light=t,this.light.updateMatrixWorld(),this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=r,void 0===e&&(e=1);var n=new sn;n.addAttribute("position",new en([-e,e,0,e,e,0,e,-e,0,-e,-e,0,-e,e,0],3));var i=new Na({fog:!1});this.lightPlane=new Ba(n,i),this.add(this.lightPlane),(n=new sn).addAttribute("position",new en([0,0,0,0,0,1],3)),this.targetLine=new Ba(n,i),this.add(this.targetLine),this.update()}function Zh(t){var e=new sn,r=new Na({color:16777215,vertexColors:I}),n=[],i=[],a={},o=new Lr(16755200),s=new Lr(16711680),c=new Lr(43775),h=new Lr(16777215),l=new Lr(3355443);function u(t,e,r){p(t,r),p(e,r)}function p(t,e){n.push(0,0,0),i.push(e.r,e.g,e.b),void 0===a[t]&&(a[t]=[]),a[t].push(n.length/3-1)}u("n1","n2",o),u("n2","n4",o),u("n4","n3",o),u("n3","n1",o),u("f1","f2",o),u("f2","f4",o),u("f4","f3",o),u("f3","f1",o),u("n1","f1",o),u("n2","f2",o),u("n3","f3",o),u("n4","f4",o),u("p","n1",s),u("p","n2",s),u("p","n3",s),u("p","n4",s),u("u1","u2",c),u("u2","u3",c),u("u3","u1",c),u("c","t",h),u("p","c",l),u("cn1","cn2",l),u("cn3","cn4",l),u("cf1","cf2",l),u("cf3","cf4",l),e.addAttribute("position",new en(n,3)),e.addAttribute("color",new en(i,3)),za.call(this,e,r),this.camera=t,this.camera.updateProjectionMatrix&&this.camera.updateProjectionMatrix(),this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=a,this.update()}function Qh(t,e){this.object=t,void 0===e&&(e=16776960);var r=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),n=new Float32Array(24),i=new sn;i.setIndex(new Xr(r,1)),i.addAttribute("position",new Xr(n,3)),za.call(this,i,new Na({color:e})),this.matrixAutoUpdate=!1,this.update()}function Kh(t,e){this.type="Box3Helper",this.box=t;var r=void 0!==e?e:16776960,n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),i=new sn;i.setIndex(new Xr(n,1)),i.addAttribute("position",new en([1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],3)),za.call(this,i,new Na({color:r})),this.geometry.computeBoundingSphere()}function $h(t,e,r){this.type="PlaneHelper",this.plane=t,this.size=void 0===e?1:e;var n=void 0!==r?r:16776960,i=new sn;i.addAttribute("position",new en([1,-1,1,-1,1,1,-1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,0,0,1,0,0,0],3)),i.computeBoundingSphere(),Ba.call(this,i,new Na({color:n}));var a=new sn;a.addAttribute("position",new en([1,1,1,-1,1,1,-1,-1,1,1,1,1,-1,-1,1,1,-1,1],3)),a.computeBoundingSphere(),this.add(new Cn(a,new Rn({color:n,opacity:.2,transparent:!0,depthWrite:!1})))}function tl(t,e,r,n,i,a){Vr.call(this),void 0===t&&(t=new er(0,0,1)),void 0===e&&(e=new er(0,0,0)),void 0===r&&(r=1),void 0===n&&(n=16776960),void 0===i&&(i=.2*r),void 0===a&&(a=.2*i),void 0===vh&&((vh=new sn).addAttribute("position",new en([0,0,0,0,1,0],3)),(yh=new Ko(0,.5,1,5,1)).translate(0,-.5,0)),this.position.copy(e),this.line=new Ba(vh,new Na({color:n})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new Cn(yh,new Rn({color:n})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(t),this.setLength(r,i,a)}function el(t){var e=[0,0,0,t=t||1,0,0,0,0,0,0,t,0,0,0,0,0,0,t],r=new sn;r.addAttribute("position",new en(e,3)),r.addAttribute("color",new en([1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],3));var n=new Na({vertexColors:D});za.call(this,r,n)}function rl(t,e,r,n,i,a,o){return console.warn("THREE.Face4 has been removed. A THREE.Face3 will be created instead."),new Dr(t,e,r,i,a,o)}Object.assign(_h.prototype,{getValue:function(t,e){this.bind();var r=this._targetGroup.nCachedObjects_,n=this._bindings[r];void 0!==n&&n.getValue(t,e)},setValue:function(t,e){for(var r=this._bindings,n=this._targetGroup.nCachedObjects_,i=r.length;n!==i;++n)r[n].setValue(t,e)},bind:function(){for(var t=this._bindings,e=this._targetGroup.nCachedObjects_,r=t.length;e!==r;++e)t[e].bind()},unbind:function(){for(var t=this._bindings,e=this._targetGroup.nCachedObjects_,r=t.length;e!==r;++e)t[e].unbind()}}),Object.assign(Mh,{Composite:_h,create:function(t,e,r){return t&&t.isAnimationObjectGroup?new Mh.Composite(t,e,r):new Mh(t,e,r)},sanitizeNodeName:(fh=new RegExp("["+wh+"]","g"),function(t){return t.replace(/\s/g,"_").replace(fh,"")}),parseTrackName:(oh="[^"+wh+"]",sh="[^"+wh.replace("\\.","")+"]",ch=/((?:WC+[\/:])*)/.source.replace("WC",oh),hh=/(WCOD+)?/.source.replace("WCOD",sh),lh=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",oh),uh=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",oh),ph=new RegExp("^"+ch+hh+lh+uh+"$"),dh=["material","materials","bones"],function(t){var e=ph.exec(t);if(!e)throw new Error("PropertyBinding: Cannot parse trackName: "+t);var r={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},n=r.nodeName&&r.nodeName.lastIndexOf(".");if(void 0!==n&&-1!==n){var i=r.nodeName.substring(n+1);-1!==dh.indexOf(i)&&(r.nodeName=r.nodeName.substring(0,n),r.objectName=i)}if(null===r.propertyName||0===r.propertyName.length)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return r}),findNode:function(t,e){if(!e||""===e||"root"===e||"."===e||-1===e||e===t.name||e===t.uuid)return t;if(t.skeleton){var r=t.skeleton.getBoneByName(e);if(void 0!==r)return r}if(t.children){var n=function(t){for(var r=0;r<t.length;r++){var i=t[r];if(i.name===e||i.uuid===e)return i;var a=n(i.children);if(a)return a}return null},i=n(t.children);if(i)return i}return null}}),Object.assign(Mh.prototype,{_getValue_unavailable:function(){},_setValue_unavailable:function(){},BindingType:{Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Versioning:{None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},GetterByBindingType:[function(t,e){t[e]=this.node[this.propertyName]},function(t,e){for(var r=this.resolvedProperty,n=0,i=r.length;n!==i;++n)t[e++]=r[n]},function(t,e){t[e]=this.resolvedProperty[this.propertyIndex]},function(t,e){this.resolvedProperty.toArray(t,e)}],SetterByBindingTypeAndVersioning:[[function(t,e){this.targetObject[this.propertyName]=t[e]},function(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0},function(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}],[function(t,e){for(var r=this.resolvedProperty,n=0,i=r.length;n!==i;++n)r[n]=t[e++]},function(t,e){for(var r=this.resolvedProperty,n=0,i=r.length;n!==i;++n)r[n]=t[e++];this.targetObject.needsUpdate=!0},function(t,e){for(var r=this.resolvedProperty,n=0,i=r.length;n!==i;++n)r[n]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}],[function(t,e){this.resolvedProperty[this.propertyIndex]=t[e]},function(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0},function(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}],[function(t,e){this.resolvedProperty.fromArray(t,e)},function(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0},function(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}]],getValue:function(t,e){this.bind(),this.getValue(t,e)},setValue:function(t,e){this.bind(),this.setValue(t,e)},bind:function(){var t=this.node,e=this.parsedPath,r=e.objectName,n=e.propertyName,i=e.propertyIndex;if(t||(t=Mh.findNode(this.rootNode,e.nodeName)||this.rootNode,this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,t){if(r){var a=e.objectIndex;switch(r){case"materials":if(!t.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!t.material.materials)return void console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);t=t.material.materials;break;case"bones":if(!t.skeleton)return void console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);t=t.skeleton.bones;for(var o=0;o<t.length;o++)if(t[o].name===a){a=o;break}break;default:if(void 0===t[r])return void console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);t=t[r]}if(void 0!==a){if(void 0===t[a])return void console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);t=t[a]}}var s=t[n];if(void 0!==s){var c=this.Versioning.None;this.targetObject=t,void 0!==t.needsUpdate?c=this.Versioning.NeedsUpdate:void 0!==t.matrixWorldNeedsUpdate&&(c=this.Versioning.MatrixWorldNeedsUpdate);var h=this.BindingType.Direct;if(void 0!==i){if("morphTargetInfluences"===n){if(!t.geometry)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);if(t.geometry.isBufferGeometry){if(!t.geometry.morphAttributes)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);for(o=0;o<this.node.geometry.morphAttributes.position.length;o++)if(t.geometry.morphAttributes.position[o].name===i){i=o;break}}else{if(!t.geometry.morphTargets)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphTargets.",this);for(o=0;o<this.node.geometry.morphTargets.length;o++)if(t.geometry.morphTargets[o].name===i){i=o;break}}}h=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=i}else void 0!==s.fromArray&&void 0!==s.toArray?(h=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(h=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=n;this.getValue=this.GetterByBindingType[h],this.setValue=this.SetterByBindingTypeAndVersioning[h][c]}else{var l=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+n+" but it wasn't found.",t)}}else console.error("THREE.PropertyBinding: Trying to update node for track: "+this.path+" but it wasn't found.")},unbind:function(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}),Object.assign(Mh.prototype,{_getValue_unbound:Mh.prototype.getValue,_setValue_unbound:Mh.prototype.setValue}),Object.assign(Eh.prototype,{isAnimationObjectGroup:!0,add:function(){for(var t=this._objects,e=t.length,r=this.nCachedObjects_,n=this._indicesByUUID,i=this._paths,a=this._parsedPaths,o=this._bindings,s=o.length,c=void 0,h=0,l=arguments.length;h!==l;++h){var u=arguments[h],p=u.uuid,d=n[p];if(void 0===d){d=e++,n[p]=d,t.push(u);for(var f=0,m=s;f!==m;++f)o[f].push(new Mh(u,i[f],a[f]))}else if(d<r){c=t[d];var g=--r,v=t[g];for(n[v.uuid]=d,t[d]=v,n[p]=g,t[g]=u,f=0,m=s;f!==m;++f){var y=o[f],x=y[g],b=y[d];y[d]=x,void 0===b&&(b=new Mh(u,i[f],a[f])),y[g]=b}}else t[d]!==c&&console.error("THREE.AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=r},remove:function(){for(var t=this._objects,e=this.nCachedObjects_,r=this._indicesByUUID,n=this._bindings,i=n.length,a=0,o=arguments.length;a!==o;++a){var s=arguments[a],c=s.uuid,h=r[c];if(void 0!==h&&h>=e){var l=e++,u=t[l];r[u.uuid]=h,t[h]=u,r[c]=l,t[l]=s;for(var p=0,d=i;p!==d;++p){var f=n[p],m=f[l],g=f[h];f[h]=m,f[l]=g}}}this.nCachedObjects_=e},uncache:function(){for(var t=this._objects,e=t.length,r=this.nCachedObjects_,n=this._indicesByUUID,i=this._bindings,a=i.length,o=0,s=arguments.length;o!==s;++o){var c=arguments[o].uuid,h=n[c];if(void 0!==h)if(delete n[c],h<r){var l=--r,u=t[l],p=t[v=--e];n[u.uuid]=h,t[h]=u,n[p.uuid]=l,t[l]=p,t.pop();for(var d=0,f=a;d!==f;++d){var m=(y=i[d])[l],g=y[v];y[h]=m,y[l]=g,y.pop()}}else{var v;for(n[(p=t[v=--e]).uuid]=h,t[h]=p,t.pop(),d=0,f=a;d!==f;++d){var y;(y=i[d])[h]=y[v],y.pop()}}}this.nCachedObjects_=r},subscribe_:function(t,e){var r=this._bindingsIndicesByPath,n=r[t],i=this._bindings;if(void 0!==n)return i[n];var a=this._paths,o=this._parsedPaths,s=this._objects,c=s.length,h=this.nCachedObjects_,l=new Array(c);n=i.length,r[t]=n,a.push(t),o.push(e),i.push(l);for(var u=h,p=s.length;u!==p;++u){var d=s[u];l[u]=new Mh(d,t,e)}return l},unsubscribe_:function(t){var e=this._bindingsIndicesByPath,r=e[t];if(void 0!==r){var n=this._paths,i=this._parsedPaths,a=this._bindings,o=a.length-1,s=a[o];e[t[o]]=r,a[r]=s,a.pop(),i[r]=i[o],i.pop(),n[r]=n[o],n.pop()}}}),Object.assign(Sh.prototype,{play:function(){return this._mixer._activateAction(this),this},stop:function(){return this._mixer._deactivateAction(this),this.reset()},reset:function(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()},isRunning:function(){return this.enabled&&!this.paused&&0!==this.timeScale&&null===this._startTime&&this._mixer._isActiveAction(this)},isScheduled:function(){return this._mixer._isActiveAction(this)},startAt:function(t){return this._startTime=t,this},setLoop:function(t,e){return this.loop=t,this.repetitions=e,this},setEffectiveWeight:function(t){return this.weight=t,this._effectiveWeight=this.enabled?t:0,this.stopFading()},getEffectiveWeight:function(){return this._effectiveWeight},fadeIn:function(t){return this._scheduleFading(t,0,1)},fadeOut:function(t){return this._scheduleFading(t,1,0)},crossFadeFrom:function(t,e,r){if(t.fadeOut(e),this.fadeIn(e),r){var n=this._clip.duration,i=t._clip.duration,a=i/n,o=n/i;t.warp(1,a,e),this.warp(o,1,e)}return this},crossFadeTo:function(t,e,r){return t.crossFadeFrom(this,e,r)},stopFading:function(){var t=this._weightInterpolant;return null!==t&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this},setEffectiveTimeScale:function(t){return this.timeScale=t,this._effectiveTimeScale=this.paused?0:t,this.stopWarping()},getEffectiveTimeScale:function(){return this._effectiveTimeScale},setDuration:function(t){return this.timeScale=this._clip.duration/t,this.stopWarping()},syncWith:function(t){return this.time=t.time,this.timeScale=t.timeScale,this.stopWarping()},halt:function(t){return this.warp(this._effectiveTimeScale,0,t)},warp:function(t,e,r){var n=this._mixer,i=n.time,a=this._timeScaleInterpolant,o=this.timeScale;null===a&&(a=n._lendControlInterpolant(),this._timeScaleInterpolant=a);var s=a.parameterPositions,c=a.sampleValues;return s[0]=i,s[1]=i+r,c[0]=t/o,c[1]=e/o,this},stopWarping:function(){var t=this._timeScaleInterpolant;return null!==t&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this},getMixer:function(){return this._mixer},getClip:function(){return this._clip},getRoot:function(){return this._localRoot||this._mixer._root},_update:function(t,e,r,n){if(this.enabled){var i=this._startTime;if(null!==i){var a=(t-i)*r;if(a<0||0===r)return;this._startTime=null,e=r*a}e*=this._updateTimeScale(t);var o=this._updateTime(e),s=this._updateWeight(t);if(s>0)for(var c=this._interpolants,h=this._propertyBindings,l=0,u=c.length;l!==u;++l)c[l].evaluate(o),h[l].accumulate(n,s)}else this._updateWeight(t)},_updateWeight:function(t){var e=0;if(this.enabled){e=this.weight;var r=this._weightInterpolant;if(null!==r){var n=r.evaluate(t)[0];e*=n,t>r.parameterPositions[1]&&(this.stopFading(),0===n&&(this.enabled=!1))}}return this._effectiveWeight=e,e},_updateTimeScale:function(t){var e=0;if(!this.paused){e=this.timeScale;var r=this._timeScaleInterpolant;null!==r&&(e*=r.evaluate(t)[0],t>r.parameterPositions[1]&&(this.stopWarping(),0===e?this.paused=!0:this.timeScale=e))}return this._effectiveTimeScale=e,e},_updateTime:function(t){var e=this.time+t,r=this._clip.duration,n=this.loop,i=this._loopCount,a=n===Re;if(0===t)return-1===i?e:a&&1==(1&i)?r-e:e;if(n===Ae){-1===i&&(this._loopCount=0,this._setEndings(!0,!0,!1));t:{if(e>=r)e=r;else{if(!(e<0))break t;e=0}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this._mixer.dispatchEvent({type:"finished",action:this,direction:t<0?-1:1})}}else{if(-1===i&&(t>=0?(i=0,this._setEndings(!0,0===this.repetitions,a)):this._setEndings(0===this.repetitions,!0,a)),e>=r||e<0){var o=Math.floor(e/r);e-=r*o,i+=Math.abs(o);var s=this.repetitions-i;if(s<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,e=t>0?r:0,this._mixer.dispatchEvent({type:"finished",action:this,direction:t>0?1:-1});else{if(1===s){var c=t<0;this._setEndings(c,!c,a)}else this._setEndings(!1,!1,a);this._loopCount=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}if(a&&1==(1&i))return this.time=e,r-e}return this.time=e,e},_setEndings:function(t,e,r){var n=this._interpolantSettings;r?(n.endingStart=De,n.endingEnd=De):(n.endingStart=t?this.zeroSlopeAtStart?De:Ie:Ne,n.endingEnd=e?this.zeroSlopeAtEnd?De:Ie:Ne)},_scheduleFading:function(t,e,r){var n=this._mixer,i=n.time,a=this._weightInterpolant;null===a&&(a=n._lendControlInterpolant(),this._weightInterpolant=a);var o=a.parameterPositions,s=a.sampleValues;return o[0]=i,s[0]=e,o[1]=i+t,s[1]=r,this}}),Th.prototype=Object.assign(Object.create(n.prototype),{constructor:Th,_bindAction:function(t,e){var r=t._localRoot||this._root,n=t._clip.tracks,i=n.length,a=t._propertyBindings,o=t._interpolants,s=r.uuid,c=this._bindingsByRootAndName,h=c[s];void 0===h&&(h={},c[s]=h);for(var l=0;l!==i;++l){var u=n[l],p=u.name,d=h[p];if(void 0!==d)a[l]=d;else{if(void 0!==(d=a[l])){null===d._cacheIndex&&(++d.referenceCount,this._addInactiveBinding(d,s,p));continue}var f=e&&e._propertyBindings[l].binding.parsedPath;++(d=new ah(Mh.create(r,p,f),u.ValueTypeName,u.getValueSize())).referenceCount,this._addInactiveBinding(d,s,p),a[l]=d}o[l].resultBuffer=d.buffer}},_activateAction:function(t){if(!this._isActiveAction(t)){if(null===t._cacheIndex){var e=(t._localRoot||this._root).uuid,r=t._clip.uuid,n=this._actionsByClip[r];this._bindAction(t,n&&n.knownActions[0]),this._addInactiveAction(t,r,e)}for(var i=t._propertyBindings,a=0,o=i.length;a!==o;++a){var s=i[a];0==s.useCount++&&(this._lendBinding(s),s.saveOriginalState())}this._lendAction(t)}},_deactivateAction:function(t){if(this._isActiveAction(t)){for(var e=t._propertyBindings,r=0,n=e.length;r!==n;++r){var i=e[r];0==--i.useCount&&(i.restoreOriginalState(),this._takeBackBinding(i))}this._takeBackAction(t)}},_initMemoryManager:function(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;var t=this;this.stats={actions:{get total(){return t._actions.length},get inUse(){return t._nActiveActions}},bindings:{get total(){return t._bindings.length},get inUse(){return t._nActiveBindings}},controlInterpolants:{get total(){return t._controlInterpolants.length},get inUse(){return t._nActiveControlInterpolants}}}},_isActiveAction:function(t){var e=t._cacheIndex;return null!==e&&e<this._nActiveActions},_addInactiveAction:function(t,e,r){var n=this._actions,i=this._actionsByClip,a=i[e];if(void 0===a)a={knownActions:[t],actionByRoot:{}},t._byClipCacheIndex=0,i[e]=a;else{var o=a.knownActions;t._byClipCacheIndex=o.length,o.push(t)}t._cacheIndex=n.length,n.push(t),a.actionByRoot[r]=t},_removeInactiveAction:function(t){var e=this._actions,r=e[e.length-1],n=t._cacheIndex;r._cacheIndex=n,e[n]=r,e.pop(),t._cacheIndex=null;var i=t._clip.uuid,a=this._actionsByClip,o=a[i],s=o.knownActions,c=s[s.length-1],h=t._byClipCacheIndex;c._byClipCacheIndex=h,s[h]=c,s.pop(),t._byClipCacheIndex=null,delete o.actionByRoot[(t._localRoot||this._root).uuid],0===s.length&&delete a[i],this._removeInactiveBindingsForAction(t)},_removeInactiveBindingsForAction:function(t){for(var e=t._propertyBindings,r=0,n=e.length;r!==n;++r){var i=e[r];0==--i.referenceCount&&this._removeInactiveBinding(i)}},_lendAction:function(t){var e=this._actions,r=t._cacheIndex,n=this._nActiveActions++,i=e[n];t._cacheIndex=n,e[n]=t,i._cacheIndex=r,e[r]=i},_takeBackAction:function(t){var e=this._actions,r=t._cacheIndex,n=--this._nActiveActions,i=e[n];t._cacheIndex=n,e[n]=t,i._cacheIndex=r,e[r]=i},_addInactiveBinding:function(t,e,r){var n=this._bindingsByRootAndName,i=n[e],a=this._bindings;void 0===i&&(i={},n[e]=i),i[r]=t,t._cacheIndex=a.length,a.push(t)},_removeInactiveBinding:function(t){var e=this._bindings,r=t.binding,n=r.rootNode.uuid,i=r.path,a=this._bindingsByRootAndName,o=a[n],s=e[e.length-1],c=t._cacheIndex;s._cacheIndex=c,e[c]=s,e.pop(),delete o[i];t:{for(var h in o)break t;delete a[n]}},_lendBinding:function(t){var e=this._bindings,r=t._cacheIndex,n=this._nActiveBindings++,i=e[n];t._cacheIndex=n,e[n]=t,i._cacheIndex=r,e[r]=i},_takeBackBinding:function(t){var e=this._bindings,r=t._cacheIndex,n=--this._nActiveBindings,i=e[n];t._cacheIndex=n,e[n]=t,i._cacheIndex=r,e[r]=i},_lendControlInterpolant:function(){var t=this._controlInterpolants,e=this._nActiveControlInterpolants++,r=t[e];return void 0===r&&((r=new ys(new Float32Array(2),new Float32Array(2),1,this._controlInterpolantsResultBuffer)).__cacheIndex=e,t[e]=r),r},_takeBackControlInterpolant:function(t){var e=this._controlInterpolants,r=t.__cacheIndex,n=--this._nActiveControlInterpolants,i=e[n];t.__cacheIndex=n,e[n]=t,i.__cacheIndex=r,e[r]=i},_controlInterpolantsResultBuffer:new Float32Array(1),clipAction:function(t,e){var r=e||this._root,n=r.uuid,i="string"==typeof t?Ls.findByName(r,t):t,a=null!==i?i.uuid:t,o=this._actionsByClip[a],s=null;if(void 0!==o){var c=o.actionByRoot[n];if(void 0!==c)return c;s=o.knownActions[0],null===i&&(i=s._clip)}if(null===i)return null;var h=new Sh(this,i,e);return this._bindAction(h,s),this._addInactiveAction(h,a,n),h},existingAction:function(t,e){var r=e||this._root,n=r.uuid,i="string"==typeof t?Ls.findByName(r,t):t,a=i?i.uuid:t,o=this._actionsByClip[a];return void 0!==o&&o.actionByRoot[n]||null},stopAllAction:function(){var t=this._actions,e=this._nActiveActions,r=this._bindings,n=this._nActiveBindings;this._nActiveActions=0,this._nActiveBindings=0;for(var i=0;i!==e;++i)t[i].reset();for(i=0;i!==n;++i)r[i].useCount=0;return this},update:function(t){t*=this.timeScale;for(var e=this._actions,r=this._nActiveActions,n=this.time+=t,i=Math.sign(t),a=this._accuIndex^=1,o=0;o!==r;++o)e[o]._update(n,t,i,a);var s=this._bindings,c=this._nActiveBindings;for(o=0;o!==c;++o)s[o].apply(a);return this},getRoot:function(){return this._root},uncacheClip:function(t){var e=this._actions,r=t.uuid,n=this._actionsByClip,i=n[r];if(void 0!==i){for(var a=i.knownActions,o=0,s=a.length;o!==s;++o){var c=a[o];this._deactivateAction(c);var h=c._cacheIndex,l=e[e.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,l._cacheIndex=h,e[h]=l,e.pop(),this._removeInactiveBindingsForAction(c)}delete n[r]}},uncacheRoot:function(t){var e=t.uuid,r=this._actionsByClip;for(var n in r){var i=r[n].actionByRoot[e];void 0!==i&&(this._deactivateAction(i),this._removeInactiveAction(i))}var a=this._bindingsByRootAndName[e];if(void 0!==a)for(var o in a){var s=a[o];s.restoreOriginalState(),this._removeInactiveBinding(s)}},uncacheAction:function(t,e){var r=this.existingAction(t,e);null!==r&&(this._deactivateAction(r),this._removeInactiveAction(r))}}),Ah.prototype.clone=function(){return new Ah(void 0===this.value.clone?this.value:this.value.clone())},Lh.prototype=Object.assign(Object.create(sn.prototype),{constructor:Lh,isInstancedBufferGeometry:!0,copy:function(t){return sn.prototype.copy.call(this,t),this.maxInstancedCount=t.maxInstancedCount,this},clone:function(){return(new this.constructor).copy(this)}}),Rh.prototype=Object.assign(Object.create(Aa.prototype),{constructor:Rh,isInstancedInterleavedBuffer:!0,copy:function(t){return Aa.prototype.copy.call(this,t),this.meshPerAttribute=t.meshPerAttribute,this}}),Ch.prototype=Object.assign(Object.create(Xr.prototype),{constructor:Ch,isInstancedBufferAttribute:!0,copy:function(t){return Xr.prototype.copy.call(this,t),this.meshPerAttribute=t.meshPerAttribute,this}}),Object.assign(Ph.prototype,{linePrecision:1,set:function(t,e){this.ray.set(t,e)},setFromCamera:function(t,e){e&&e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize()):e&&e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld)):console.error("THREE.Raycaster: Unsupported camera type.")},intersectObject:function(t,e,r){var n=r||[];return Ih(t,this,n,e),n.sort(Oh),n},intersectObjects:function(t,e,r){var n=r||[];if(!1===Array.isArray(t))return console.warn("THREE.Raycaster.intersectObjects: objects is not an Array."),n;for(var i=0,a=t.length;i<a;i++)Ih(t[i],this,n,e);return n.sort(Oh),n}}),Object.assign(Dh.prototype,{set:function(t,e,r){return this.radius=t,this.phi=e,this.theta=r,this},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this},makeSafe:function(){var t=1e-6;return this.phi=Math.max(t,Math.min(Math.PI-t,this.phi)),this},setFromVector3:function(t){return this.setFromCartesianCoords(t.x,t.y,t.z)},setFromCartesianCoords:function(t,e,r){return this.radius=Math.sqrt(t*t+e*e+r*r),0===this.radius?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,r),this.phi=Math.acos(Qe.clamp(e/this.radius,-1,1))),this}}),Object.assign(Nh.prototype,{set:function(t,e,r){return this.radius=t,this.theta=e,this.y=r,this},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.radius=t.radius,this.theta=t.theta,this.y=t.y,this},setFromVector3:function(t){return this.setFromCartesianCoords(t.x,t.y,t.z)},setFromCartesianCoords:function(t,e,r){return this.radius=Math.sqrt(t*t+r*r),this.theta=Math.atan2(t,r),this.y=e,this}}),Object.assign(Bh.prototype,{set:function(t,e){return this.min.copy(t),this.max.copy(e),this},setFromPoints:function(t){this.makeEmpty();for(var e=0,r=t.length;e<r;e++)this.expandByPoint(t[e]);return this},setFromCenterAndSize:function(){var t=new Ke;return function(e,r){var n=t.copy(r).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}}(),clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.min.copy(t.min),this.max.copy(t.max),this},makeEmpty:function(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this},isEmpty:function(){return this.max.x<this.min.x||this.max.y<this.min.y},getCenter:function(t){return void 0===t&&(console.warn("THREE.Box2: .getCenter() target is now required"),t=new Ke),this.isEmpty()?t.set(0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)},getSize:function(t){return void 0===t&&(console.warn("THREE.Box2: .getSize() target is now required"),t=new Ke),this.isEmpty()?t.set(0,0):t.subVectors(this.max,this.min)},expandByPoint:function(t){return this.min.min(t),this.max.max(t),this},expandByVector:function(t){return this.min.sub(t),this.max.add(t),this},expandByScalar:function(t){return this.min.addScalar(-t),this.max.addScalar(t),this},containsPoint:function(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y)},containsBox:function(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y},getParameter:function(t,e){return void 0===e&&(console.warn("THREE.Box2: .getParameter() target is now required"),e=new Ke),e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y))},intersectsBox:function(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y)},clampPoint:function(t,e){return void 0===e&&(console.warn("THREE.Box2: .clampPoint() target is now required"),e=new Ke),e.copy(t).clamp(this.min,this.max)},distanceToPoint:function(){var t=new Ke;return function(e){return t.copy(e).clamp(this.min,this.max).sub(e).length()}}(),intersect:function(t){return this.min.max(t.min),this.max.min(t.max),this},union:function(t){return this.min.min(t.min),this.max.max(t.max),this},translate:function(t){return this.min.add(t),this.max.add(t),this},equals:function(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}),Object.assign(zh.prototype,{set:function(t,e){return this.start.copy(t),this.end.copy(e),this},clone:function(){return(new this.constructor).copy(this)},copy:function(t){return this.start.copy(t.start),this.end.copy(t.end),this},getCenter:function(t){return void 0===t&&(console.warn("THREE.Line3: .getCenter() target is now required"),t=new er),t.addVectors(this.start,this.end).multiplyScalar(.5)},delta:function(t){return void 0===t&&(console.warn("THREE.Line3: .delta() target is now required"),t=new er),t.subVectors(this.end,this.start)},distanceSq:function(){return this.start.distanceToSquared(this.end)},distance:function(){return this.start.distanceTo(this.end)},at:function(t,e){return void 0===e&&(console.warn("THREE.Line3: .at() target is now required"),e=new er),this.delta(e).multiplyScalar(t).add(this.start)},closestPointToPointParameter:(mh=new er,gh=new er,function(t,e){mh.subVectors(t,this.start),gh.subVectors(this.end,this.start);var r=gh.dot(gh),n=gh.dot(mh)/r;return e&&(n=Qe.clamp(n,0,1)),n}),closestPointToPoint:function(t,e,r){var n=this.closestPointToPointParameter(t,e);return void 0===r&&(console.warn("THREE.Line3: .closestPointToPoint() target is now required"),r=new er),this.delta(r).multiplyScalar(n).add(this.start)},applyMatrix4:function(t){return this.start.applyMatrix4(t),this.end.applyMatrix4(t),this},equals:function(t){return t.start.equals(this.start)&&t.end.equals(this.end)}}),Uh.prototype=Object.create(Vr.prototype),Uh.prototype.constructor=Uh,Uh.prototype.isImmediateRenderObject=!0,Gh.prototype=Object.create(za.prototype),Gh.prototype.constructor=Gh,Gh.prototype.update=function(){var t=new er,e=new er,r=new rr;return function(){var n=["a","b","c"];this.object.updateMatrixWorld(!0),r.getNormalMatrix(this.object.matrixWorld);var i=this.object.matrixWorld,a=this.geometry.attributes.position,o=this.object.geometry;if(o&&o.isGeometry)for(var s=o.vertices,c=o.faces,h=0,l=0,u=c.length;l<u;l++)for(var p=c[l],d=0,f=p.vertexNormals.length;d<f;d++){var m=s[p[n[d]]],g=p.vertexNormals[d];t.copy(m).applyMatrix4(i),e.copy(g).applyMatrix3(r).normalize().multiplyScalar(this.size).add(t),a.setXYZ(h,t.x,t.y,t.z),h+=1,a.setXYZ(h,e.x,e.y,e.z),h+=1}else if(o&&o.isBufferGeometry){var v=o.attributes.position,y=o.attributes.normal;for(h=0,d=0,f=v.count;d<f;d++)t.set(v.getX(d),v.getY(d),v.getZ(d)).applyMatrix4(i),e.set(y.getX(d),y.getY(d),y.getZ(d)),e.applyMatrix3(r).normalize().multiplyScalar(this.size).add(t),a.setXYZ(h,t.x,t.y,t.z),h+=1,a.setXYZ(h,e.x,e.y,e.z),h+=1}a.needsUpdate=!0}}(),Fh.prototype=Object.create(Vr.prototype),Fh.prototype.constructor=Fh,Fh.prototype.dispose=function(){this.cone.geometry.dispose(),this.cone.material.dispose()},Fh.prototype.update=function(){var t=new er;return function(){this.light.updateMatrixWorld();var e=this.light.distance?this.light.distance:1e3,r=e*Math.tan(this.light.angle);this.cone.scale.set(r,r,e),t.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(t),void 0!==this.color?this.cone.material.color.set(this.color):this.cone.material.color.copy(this.light.color)}}(),Vh.prototype=Object.create(za.prototype),Vh.prototype.constructor=Vh,Vh.prototype.updateMatrixWorld=function(){var t=new er,e=new $e,r=new $e;return function(n){var i=this.bones,a=this.geometry,o=a.getAttribute("position");r.getInverse(this.root.matrixWorld);for(var s=0,c=0;s<i.length;s++){var h=i[s];h.parent&&h.parent.isBone&&(e.multiplyMatrices(r,h.matrixWorld),t.setFromMatrixPosition(e),o.setXYZ(c,t.x,t.y,t.z),e.multiplyMatrices(r,h.parent.matrixWorld),t.setFromMatrixPosition(e),o.setXYZ(c+1,t.x,t.y,t.z),c+=2)}a.getAttribute("position").needsUpdate=!0,Vr.prototype.updateMatrixWorld.call(this,n)}}(),jh.prototype=Object.create(Cn.prototype),jh.prototype.constructor=jh,jh.prototype.dispose=function(){this.geometry.dispose(),this.material.dispose()},jh.prototype.update=function(){void 0!==this.color?this.material.color.set(this.color):this.material.color.copy(this.light.color)},kh.prototype=Object.create(Ba.prototype),kh.prototype.constructor=kh,kh.prototype.update=function(){if(this.scale.set(.5*this.light.width,.5*this.light.height,1),void 0!==this.color)this.material.color.set(this.color),this.children[0].material.color.set(this.color);else{this.material.color.copy(this.light.color).multiplyScalar(this.light.intensity);var t=this.material.color,e=Math.max(t.r,t.g,t.b);e>1&&t.multiplyScalar(1/e),this.children[0].material.color.copy(this.material.color)}},kh.prototype.dispose=function(){this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()},Wh.prototype=Object.create(Vr.prototype),Wh.prototype.constructor=Wh,Wh.prototype.dispose=function(){this.children[0].geometry.dispose(),this.children[0].material.dispose()},Wh.prototype.update=function(){var t=new er,e=new Lr,r=new Lr;return function(){var n=this.children[0];if(void 0!==this.color)this.material.color.set(this.color);else{var i=n.geometry.getAttribute("color");e.copy(this.light.color),r.copy(this.light.groundColor);for(var a=0,o=i.count;a<o;a++){var s=a<o/2?e:r;i.setXYZ(a,s.r,s.g,s.b)}i.needsUpdate=!0}n.lookAt(t.setFromMatrixPosition(this.light.matrixWorld).negate())}}(),qh.prototype=Object.create(za.prototype),qh.prototype.constructor=qh,Xh.prototype=Object.create(za.prototype),Xh.prototype.constructor=Xh,Yh.prototype=Object.create(za.prototype),Yh.prototype.constructor=Yh,Yh.prototype.update=function(){var t=new er,e=new er,r=new rr;return function(){this.object.updateMatrixWorld(!0),r.getNormalMatrix(this.object.matrixWorld);for(var n=this.object.matrixWorld,i=this.geometry.attributes.position,a=this.object.geometry,o=a.vertices,s=a.faces,c=0,h=0,l=s.length;h<l;h++){var u=s[h],p=u.normal;t.copy(o[u.a]).add(o[u.b]).add(o[u.c]).divideScalar(3).applyMatrix4(n),e.copy(p).applyMatrix3(r).normalize().multiplyScalar(this.size).add(t),i.setXYZ(c,t.x,t.y,t.z),c+=1,i.setXYZ(c,e.x,e.y,e.z),c+=1}i.needsUpdate=!0}}(),Jh.prototype=Object.create(Vr.prototype),Jh.prototype.constructor=Jh,Jh.prototype.dispose=function(){this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()},Jh.prototype.update=function(){var t=new er,e=new er,r=new er;return function(){t.setFromMatrixPosition(this.light.matrixWorld),e.setFromMatrixPosition(this.light.target.matrixWorld),r.subVectors(e,t),this.lightPlane.lookAt(e),void 0!==this.color?(this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color)):(this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color)),this.targetLine.lookAt(e),this.targetLine.scale.z=r.length()}}(),Zh.prototype=Object.create(za.prototype),Zh.prototype.constructor=Zh,Zh.prototype.update=function(){var t,e,r=new er,n=new ha;function i(i,a,o,s){r.set(a,o,s).unproject(n);var c=e[i];if(void 0!==c)for(var h=t.getAttribute("position"),l=0,u=c.length;l<u;l++)h.setXYZ(c[l],r.x,r.y,r.z)}return function(){t=this.geometry,e=this.pointMap,n.projectionMatrix.copy(this.camera.projectionMatrix),i("c",0,0,-1),i("t",0,0,1),i("n1",-1,-1,-1),i("n2",1,-1,-1),i("n3",-1,1,-1),i("n4",1,1,-1),i("f1",-1,-1,1),i("f2",1,-1,1),i("f3",-1,1,1),i("f4",1,1,1),i("u1",.7,1.1,-1),i("u2",-.7,1.1,-1),i("u3",0,2,-1),i("cf1",-1,0,1),i("cf2",1,0,1),i("cf3",0,-1,1),i("cf4",0,1,1),i("cn1",-1,0,-1),i("cn2",1,0,-1),i("cn3",0,-1,-1),i("cn4",0,1,-1),t.getAttribute("position").needsUpdate=!0}}(),Qh.prototype=Object.create(za.prototype),Qh.prototype.constructor=Qh,Qh.prototype.update=function(){var t=new gr;return function(e){if(void 0!==e&&console.warn("THREE.BoxHelper: .update() has no longer arguments."),void 0!==this.object&&t.setFromObject(this.object),!t.isEmpty()){var r=t.min,n=t.max,i=this.geometry.attributes.position,a=i.array;a[0]=n.x,a[1]=n.y,a[2]=n.z,a[3]=r.x,a[4]=n.y,a[5]=n.z,a[6]=r.x,a[7]=r.y,a[8]=n.z,a[9]=n.x,a[10]=r.y,a[11]=n.z,a[12]=n.x,a[13]=n.y,a[14]=r.z,a[15]=r.x,a[16]=n.y,a[17]=r.z,a[18]=r.x,a[19]=r.y,a[20]=r.z,a[21]=n.x,a[22]=r.y,a[23]=r.z,i.needsUpdate=!0,this.geometry.computeBoundingSphere()}}}(),Qh.prototype.setFromObject=function(t){return this.object=t,this.update(),this},Qh.prototype.copy=function(t){return za.prototype.copy.call(this,t),this.object=t.object,this},Qh.prototype.clone=function(){return(new this.constructor).copy(this)},Kh.prototype=Object.create(za.prototype),Kh.prototype.constructor=Kh,Kh.prototype.updateMatrixWorld=function(t){var e=this.box;e.isEmpty()||(e.getCenter(this.position),e.getSize(this.scale),this.scale.multiplyScalar(.5),Vr.prototype.updateMatrixWorld.call(this,t))},$h.prototype=Object.create(Ba.prototype),$h.prototype.constructor=$h,$h.prototype.updateMatrixWorld=function(t){var e=-this.plane.constant;Math.abs(e)<1e-8&&(e=1e-8),this.scale.set(.5*this.size,.5*this.size,e),this.children[0].material.side=e<0?L:A,this.lookAt(this.plane.normal),Vr.prototype.updateMatrixWorld.call(this,t)},tl.prototype=Object.create(Vr.prototype),tl.prototype.constructor=tl,tl.prototype.setDirection=(bh=new er,function(t){t.y>.99999?this.quaternion.set(0,0,0,1):t.y<-.99999?this.quaternion.set(1,0,0,0):(bh.set(t.z,0,-t.x).normalize(),xh=Math.acos(t.y),this.quaternion.setFromAxisAngle(bh,xh))}),tl.prototype.setLength=function(t,e,r){void 0===e&&(e=.2*t),void 0===r&&(r=.2*e),this.line.scale.set(1,Math.max(0,t-e),1),this.line.updateMatrix(),this.cone.scale.set(r,e,r),this.cone.position.y=t,this.cone.updateMatrix()},tl.prototype.setColor=function(t){this.line.material.color.copy(t),this.cone.material.color.copy(t)},tl.prototype.copy=function(t){return Vr.prototype.copy.call(this,t,!1),this.line.copy(t.line),this.cone.copy(t.cone),this},tl.prototype.clone=function(){return(new this.constructor).copy(this)},el.prototype=Object.create(za.prototype),el.prototype.constructor=el;var nl=0,il=1;function al(t){return console.warn("THREE.MeshFaceMaterial has been removed. Use an Array instead."),t}function ol(t){return void 0===t&&(t=[]),console.warn("THREE.MultiMaterial has been removed. Use an Array instead."),t.isMultiMaterial=!0,t.materials=t,t.clone=function(){return t.slice()},t}function sl(t,e){return console.warn("THREE.PointCloud has been renamed to THREE.Points."),new Fa(t,e)}function cl(t){return console.warn("THREE.Particle has been renamed to THREE.Sprite."),new Ca(t)}function hl(t,e){return console.warn("THREE.ParticleSystem has been renamed to THREE.Points."),new Fa(t,e)}function ll(t){return console.warn("THREE.PointCloudMaterial has been renamed to THREE.PointsMaterial."),new Ga(t)}function ul(t){return console.warn("THREE.ParticleBasicMaterial has been renamed to THREE.PointsMaterial."),new Ga(t)}function pl(t){return console.warn("THREE.ParticleSystemMaterial has been renamed to THREE.PointsMaterial."),new Ga(t)}function dl(t,e,r){return console.warn("THREE.Vertex has been removed. Use THREE.Vector3 instead."),new er(t,e,r)}function fl(t,e){return console.warn("THREE.DynamicBufferAttribute has been removed. Use new THREE.BufferAttribute().setDynamic( true ) instead."),new Xr(t,e).setDynamic(!0)}function ml(t,e){return console.warn("THREE.Int8Attribute has been removed. Use new THREE.Int8BufferAttribute() instead."),new Yr(t,e)}function gl(t,e){return console.warn("THREE.Uint8Attribute has been removed. Use new THREE.Uint8BufferAttribute() instead."),new Jr(t,e)}function vl(t,e){return console.warn("THREE.Uint8ClampedAttribute has been removed. Use new THREE.Uint8ClampedBufferAttribute() instead."),new Zr(t,e)}function yl(t,e){return console.warn("THREE.Int16Attribute has been removed. Use new THREE.Int16BufferAttribute() instead."),new Qr(t,e)}function xl(t,e){return console.warn("THREE.Uint16Attribute has been removed. Use new THREE.Uint16BufferAttribute() instead."),new Kr(t,e)}function bl(t,e){return console.warn("THREE.Int32Attribute has been removed. Use new THREE.Int32BufferAttribute() instead."),new $r(t,e)}function wl(t,e){return console.warn("THREE.Uint32Attribute has been removed. Use new THREE.Uint32BufferAttribute() instead."),new tn(t,e)}function _l(t,e){return console.warn("THREE.Float32Attribute has been removed. Use new THREE.Float32BufferAttribute() instead."),new en(t,e)}function Ml(t,e){return console.warn("THREE.Float64Attribute has been removed. Use new THREE.Float64BufferAttribute() instead."),new rn(t,e)}function El(t){console.warn("THREE.ClosedSplineCurve3 has been deprecated. Use THREE.CatmullRomCurve3 instead."),Js.call(this,t),this.type="catmullrom",this.closed=!0}function Sl(t){console.warn("THREE.SplineCurve3 has been deprecated. Use THREE.CatmullRomCurve3 instead."),Js.call(this,t),this.type="catmullrom"}function Tl(t){console.warn("THREE.Spline has been removed. Use THREE.CatmullRomCurve3 instead."),Js.call(this,t),this.type="catmullrom"}function Al(t){return console.warn("THREE.AxisHelper has been renamed to THREE.AxesHelper."),new el(t)}function Ll(t,e){return console.warn("THREE.BoundingBoxHelper has been deprecated. Creating a THREE.BoxHelper instead."),new Qh(t,e)}function Rl(t,e){return console.warn("THREE.EdgesHelper has been removed. Use THREE.EdgesGeometry instead."),new za(new Zo(t.geometry),new Na({color:void 0!==e?e:16777215}))}function Cl(t,e){return console.warn("THREE.WireframeHelper has been removed. Use THREE.WireframeGeometry instead."),new za(new Wa(t.geometry),new Na({color:void 0!==e?e:16777215}))}function Pl(t){return console.warn("THREE.XHRLoader has been renamed to THREE.FileLoader."),new Ds(t)}function Ol(t){return console.warn("THREE.BinaryTextureLoader has been renamed to THREE.DataTextureLoader."),new zs(t)}Hs.create=function(t,e){return console.log("THREE.Curve.create() has been deprecated"),t.prototype=Object.create(Hs.prototype),t.prototype.constructor=t,t.prototype.getPoint=e,t},Object.assign(sc.prototype,{createPointsGeometry:function(t){console.warn("THREE.CurvePath: .createPointsGeometry() has been removed. Use new THREE.Geometry().setFromPoints( points ) instead.");var e=this.getPoints(t);return this.createGeometry(e)},createSpacedPointsGeometry:function(t){console.warn("THREE.CurvePath: .createSpacedPointsGeometry() has been removed. Use new THREE.Geometry().setFromPoints( points ) instead.");var e=this.getSpacedPoints(t);return this.createGeometry(e)},createGeometry:function(t){console.warn("THREE.CurvePath: .createGeometry() has been removed. Use new THREE.Geometry().setFromPoints( points ) instead.");for(var e=new qr,r=0,n=t.length;r<n;r++){var i=t[r];e.vertices.push(new er(i.x,i.y,i.z||0))}return e}}),Object.assign(cc.prototype,{fromPoints:function(t){console.warn("THREE.Path: .fromPoints() has been renamed to .setFromPoints()."),this.setFromPoints(t)}}),El.prototype=Object.create(Js.prototype),Sl.prototype=Object.create(Js.prototype),Tl.prototype=Object.create(Js.prototype),Object.assign(Tl.prototype,{initFromArray:function(){console.error("THREE.Spline: .initFromArray() has been removed.")},getControlPointsArray:function(){console.error("THREE.Spline: .getControlPointsArray() has been removed.")},reparametrizeByArcLength:function(){console.error("THREE.Spline: .reparametrizeByArcLength() has been removed.")}}),qh.prototype.setColors=function(){console.error("THREE.GridHelper: setColors() has been deprecated, pass them in the constructor instead.")},Vh.prototype.update=function(){console.error("THREE.SkeletonHelper: update() no longer needs to be called.")},Object.assign(Gc.prototype,{extractUrlBase:function(t){return console.warn("THREE.Loader: .extractUrlBase() has been deprecated. Use THREE.LoaderUtils.extractUrlBase() instead."),_c.extractUrlBase(t)}}),Object.assign(Sc.prototype,{setTexturePath:function(t){return console.warn("THREE.ObjectLoader: .setTexturePath() has been renamed to .setResourcePath()."),this.setResourcePath(t)}}),Object.assign(Bh.prototype,{center:function(t){return console.warn("THREE.Box2: .center() has been renamed to .getCenter()."),this.getCenter(t)},empty:function(){return console.warn("THREE.Box2: .empty() has been renamed to .isEmpty()."),this.isEmpty()},isIntersectionBox:function(t){return console.warn("THREE.Box2: .isIntersectionBox() has been renamed to .intersectsBox()."),this.intersectsBox(t)},size:function(t){return console.warn("THREE.Box2: .size() has been renamed to .getSize()."),this.getSize(t)}}),Object.assign(gr.prototype,{center:function(t){return console.warn("THREE.Box3: .center() has been renamed to .getCenter()."),this.getCenter(t)},empty:function(){return console.warn("THREE.Box3: .empty() has been renamed to .isEmpty()."),this.isEmpty()},isIntersectionBox:function(t){return console.warn("THREE.Box3: .isIntersectionBox() has been renamed to .intersectsBox()."),this.intersectsBox(t)},isIntersectionSphere:function(t){return console.warn("THREE.Box3: .isIntersectionSphere() has been renamed to .intersectsSphere()."),this.intersectsSphere(t)},size:function(t){return console.warn("THREE.Box3: .size() has been renamed to .getSize()."),this.getSize(t)}}),zh.prototype.center=function(t){return console.warn("THREE.Line3: .center() has been renamed to .getCenter()."),this.getCenter(t)},Object.assign(Qe,{random16:function(){return console.warn("THREE.Math: .random16() has been deprecated. Use Math.random() instead."),Math.random()},nearestPowerOfTwo:function(t){return console.warn("THREE.Math: .nearestPowerOfTwo() has been renamed to .floorPowerOfTwo()."),Qe.floorPowerOfTwo(t)},nextPowerOfTwo:function(t){return console.warn("THREE.Math: .nextPowerOfTwo() has been renamed to .ceilPowerOfTwo()."),Qe.ceilPowerOfTwo(t)}}),Object.assign(rr.prototype,{flattenToArrayOffset:function(t,e){return console.warn("THREE.Matrix3: .flattenToArrayOffset() has been deprecated. Use .toArray() instead."),this.toArray(t,e)},multiplyVector3:function(t){return console.warn("THREE.Matrix3: .multiplyVector3() has been removed. Use vector.applyMatrix3( matrix ) instead."),t.applyMatrix3(this)},multiplyVector3Array:function(){console.error("THREE.Matrix3: .multiplyVector3Array() has been removed.")},applyToBuffer:function(t){return console.warn("THREE.Matrix3: .applyToBuffer() has been removed. Use matrix.applyToBufferAttribute( attribute ) instead."),this.applyToBufferAttribute(t)},applyToVector3Array:function(){console.error("THREE.Matrix3: .applyToVector3Array() has been removed.")}}),Object.assign($e.prototype,{extractPosition:function(t){return console.warn("THREE.Matrix4: .extractPosition() has been renamed to .copyPosition()."),this.copyPosition(t)},flattenToArrayOffset:function(t,e){return console.warn("THREE.Matrix4: .flattenToArrayOffset() has been deprecated. Use .toArray() instead."),this.toArray(t,e)},getPosition:function(){var t;return function(){return void 0===t&&(t=new er),console.warn("THREE.Matrix4: .getPosition() has been removed. Use Vector3.setFromMatrixPosition( matrix ) instead."),t.setFromMatrixColumn(this,3)}}(),setRotationFromQuaternion:function(t){return console.warn("THREE.Matrix4: .setRotationFromQuaternion() has been renamed to .makeRotationFromQuaternion()."),this.makeRotationFromQuaternion(t)},multiplyToArray:function(){console.warn("THREE.Matrix4: .multiplyToArray() has been removed.")},multiplyVector3:function(t){return console.warn("THREE.Matrix4: .multiplyVector3() has been removed. Use vector.applyMatrix4( matrix ) instead."),t.applyMatrix4(this)},multiplyVector4:function(t){return console.warn("THREE.Matrix4: .multiplyVector4() has been removed. Use vector.applyMatrix4( matrix ) instead."),t.applyMatrix4(this)},multiplyVector3Array:function(){console.error("THREE.Matrix4: .multiplyVector3Array() has been removed.")},rotateAxis:function(t){console.warn("THREE.Matrix4: .rotateAxis() has been removed. Use Vector3.transformDirection( matrix ) instead."),t.transformDirection(this)},crossVector:function(t){return console.warn("THREE.Matrix4: .crossVector() has been removed. Use vector.applyMatrix4( matrix ) instead."),t.applyMatrix4(this)},translate:function(){console.error("THREE.Matrix4: .translate() has been removed.")},rotateX:function(){console.error("THREE.Matrix4: .rotateX() has been removed.")},rotateY:function(){console.error("THREE.Matrix4: .rotateY() has been removed.")},rotateZ:function(){console.error("THREE.Matrix4: .rotateZ() has been removed.")},rotateByAxis:function(){console.error("THREE.Matrix4: .rotateByAxis() has been removed.")},applyToBuffer:function(t){return console.warn("THREE.Matrix4: .applyToBuffer() has been removed. Use matrix.applyToBufferAttribute( attribute ) instead."),this.applyToBufferAttribute(t)},applyToVector3Array:function(){console.error("THREE.Matrix4: .applyToVector3Array() has been removed.")},makeFrustum:function(t,e,r,n,i,a){return console.warn("THREE.Matrix4: .makeFrustum() has been removed. Use .makePerspective( left, right, top, bottom, near, far ) instead."),this.makePerspective(t,e,n,r,i,a)}}),yr.prototype.isIntersectionLine=function(t){return console.warn("THREE.Plane: .isIntersectionLine() has been renamed to .intersectsLine()."),this.intersectsLine(t)},tr.prototype.multiplyVector3=function(t){return console.warn("THREE.Quaternion: .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead."),t.applyQuaternion(this)},Object.assign(An.prototype,{isIntersectionBox:function(t){return console.warn("THREE.Ray: .isIntersectionBox() has been renamed to .intersectsBox()."),this.intersectsBox(t)},isIntersectionPlane:function(t){return console.warn("THREE.Ray: .isIntersectionPlane() has been renamed to .intersectsPlane()."),this.intersectsPlane(t)},isIntersectionSphere:function(t){return console.warn("THREE.Ray: .isIntersectionSphere() has been renamed to .intersectsSphere()."),this.intersectsSphere(t)}}),Object.assign(Ln.prototype,{area:function(){return console.warn("THREE.Triangle: .area() has been renamed to .getArea()."),this.getArea()},barycoordFromPoint:function(t,e){return console.warn("THREE.Triangle: .barycoordFromPoint() has been renamed to .getBarycoord()."),this.getBarycoord(t,e)},midpoint:function(t){return console.warn("THREE.Triangle: .midpoint() has been renamed to .getMidpoint()."),this.getMidpoint(t)},normal:function(t){return console.warn("THREE.Triangle: .normal() has been renamed to .getNormal()."),this.getNormal(t)},plane:function(t){return console.warn("THREE.Triangle: .plane() has been renamed to .getPlane()."),this.getPlane(t)}}),Object.assign(Ln,{barycoordFromPoint:function(t,e,r,n,i){return console.warn("THREE.Triangle: .barycoordFromPoint() has been renamed to .getBarycoord()."),Ln.getBarycoord(t,e,r,n,i)},normal:function(t,e,r,n){return console.warn("THREE.Triangle: .normal() has been renamed to .getNormal()."),Ln.getNormal(t,e,r,n)}}),Object.assign(hc.prototype,{extractAllPoints:function(t){return console.warn("THREE.Shape: .extractAllPoints() has been removed. Use .extractPoints() instead."),this.extractPoints(t)},extrude:function(t){return console.warn("THREE.Shape: .extrude() has been removed. Use ExtrudeGeometry() instead."),new No(this,t)},makeGeometry:function(t){return console.warn("THREE.Shape: .makeGeometry() has been removed. Use ShapeGeometry() instead."),new Xo(this,t)}}),Object.assign(Ke.prototype,{fromAttribute:function(t,e,r){return console.warn("THREE.Vector2: .fromAttribute() has been renamed to .fromBufferAttribute()."),this.fromBufferAttribute(t,e,r)},distanceToManhattan:function(t){return console.warn("THREE.Vector2: .distanceToManhattan() has been renamed to .manhattanDistanceTo()."),this.manhattanDistanceTo(t)},lengthManhattan:function(){return console.warn("THREE.Vector2: .lengthManhattan() has been renamed to .manhattanLength()."),this.manhattanLength()}}),Object.assign(er.prototype,{setEulerFromRotationMatrix:function(){console.error("THREE.Vector3: .setEulerFromRotationMatrix() has been removed. Use Euler.setFromRotationMatrix() instead.")},setEulerFromQuaternion:function(){console.error("THREE.Vector3: .setEulerFromQuaternion() has been removed. Use Euler.setFromQuaternion() instead.")},getPositionFromMatrix:function(t){return console.warn("THREE.Vector3: .getPositionFromMatrix() has been renamed to .setFromMatrixPosition()."),this.setFromMatrixPosition(t)},getScaleFromMatrix:function(t){return console.warn("THREE.Vector3: .getScaleFromMatrix() has been renamed to .setFromMatrixScale()."),this.setFromMatrixScale(t)},getColumnFromMatrix:function(t,e){return console.warn("THREE.Vector3: .getColumnFromMatrix() has been renamed to .setFromMatrixColumn()."),this.setFromMatrixColumn(e,t)},applyProjection:function(t){return console.warn("THREE.Vector3: .applyProjection() has been removed. Use .applyMatrix4( m ) instead."),this.applyMatrix4(t)},fromAttribute:function(t,e,r){return console.warn("THREE.Vector3: .fromAttribute() has been renamed to .fromBufferAttribute()."),this.fromBufferAttribute(t,e,r)},distanceToManhattan:function(t){return console.warn("THREE.Vector3: .distanceToManhattan() has been renamed to .manhattanDistanceTo()."),this.manhattanDistanceTo(t)},lengthManhattan:function(){return console.warn("THREE.Vector3: .lengthManhattan() has been renamed to .manhattanLength()."),this.manhattanLength()}}),Object.assign(ur.prototype,{fromAttribute:function(t,e,r){return console.warn("THREE.Vector4: .fromAttribute() has been renamed to .fromBufferAttribute()."),this.fromBufferAttribute(t,e,r)},lengthManhattan:function(){return console.warn("THREE.Vector4: .lengthManhattan() has been renamed to .manhattanLength()."),this.manhattanLength()}}),Object.assign(qr.prototype,{computeTangents:function(){console.error("THREE.Geometry: .computeTangents() has been removed.")},computeLineDistances:function(){console.error("THREE.Geometry: .computeLineDistances() has been removed. Use THREE.Line.computeLineDistances() instead.")}}),Object.assign(Vr.prototype,{getChildByName:function(t){return console.warn("THREE.Object3D: .getChildByName() has been renamed to .getObjectByName()."),this.getObjectByName(t)},renderDepth:function(){console.warn("THREE.Object3D: .renderDepth has been removed. Use .renderOrder, instead.")},translate:function(t,e){return console.warn("THREE.Object3D: .translate() has been removed. Use .translateOnAxis( axis, distance ) instead."),this.translateOnAxis(e,t)},getWorldRotation:function(){console.error("THREE.Object3D: .getWorldRotation() has been removed. Use THREE.Object3D.getWorldQuaternion( target ) instead.")}}),Object.defineProperties(Vr.prototype,{eulerOrder:{get:function(){return console.warn("THREE.Object3D: .eulerOrder is now .rotation.order."),this.rotation.order},set:function(t){console.warn("THREE.Object3D: .eulerOrder is now .rotation.order."),this.rotation.order=t}},useQuaternion:{get:function(){console.warn("THREE.Object3D: .useQuaternion has been removed. The library now uses quaternions by default.")},set:function(){console.warn("THREE.Object3D: .useQuaternion has been removed. The library now uses quaternions by default.")}}}),Object.defineProperties(Pa.prototype,{objects:{get:function(){return console.warn("THREE.LOD: .objects has been renamed to .levels."),this.levels}}}),Object.defineProperty(Ia.prototype,"useVertexTexture",{get:function(){console.warn("THREE.Skeleton: useVertexTexture has been removed.")},set:function(){console.warn("THREE.Skeleton: useVertexTexture has been removed.")}}),Oa.prototype.initBones=function(){console.error("THREE.SkinnedMesh: initBones() has been removed.")},Object.defineProperty(Hs.prototype,"__arcLengthDivisions",{get:function(){return console.warn("THREE.Curve: .__arcLengthDivisions is now .arcLengthDivisions."),this.arcLengthDivisions},set:function(t){console.warn("THREE.Curve: .__arcLengthDivisions is now .arcLengthDivisions."),this.arcLengthDivisions=t}}),la.prototype.setLens=function(t,e){console.warn("THREE.PerspectiveCamera.setLens is deprecated. Use .setFocalLength and .filmGauge for a photographic setup."),void 0!==e&&(this.filmGauge=e),this.setFocalLength(t)},Object.defineProperties(lc.prototype,{onlyShadow:{set:function(){console.warn("THREE.Light: .onlyShadow has been removed.")}},shadowCameraFov:{set:function(t){console.warn("THREE.Light: .shadowCameraFov is now .shadow.camera.fov."),this.shadow.camera.fov=t}},shadowCameraLeft:{set:function(t){console.warn("THREE.Light: .shadowCameraLeft is now .shadow.camera.left."),this.shadow.camera.left=t}},shadowCameraRight:{set:function(t){console.warn("THREE.Light: .shadowCameraRight is now .shadow.camera.right."),this.shadow.camera.right=t}},shadowCameraTop:{set:function(t){console.warn("THREE.Light: .shadowCameraTop is now .shadow.camera.top."),this.shadow.camera.top=t}},shadowCameraBottom:{set:function(t){console.warn("THREE.Light: .shadowCameraBottom is now .shadow.camera.bottom."),this.shadow.camera.bottom=t}},shadowCameraNear:{set:function(t){console.warn("THREE.Light: .shadowCameraNear is now .shadow.camera.near."),this.shadow.camera.near=t}},shadowCameraFar:{set:function(t){console.warn("THREE.Light: .shadowCameraFar is now .shadow.camera.far."),this.shadow.camera.far=t}},shadowCameraVisible:{set:function(){console.warn("THREE.Light: .shadowCameraVisible has been removed. Use new THREE.CameraHelper( light.shadow.camera ) instead.")}},shadowBias:{set:function(t){console.warn("THREE.Light: .shadowBias is now .shadow.bias."),this.shadow.bias=t}},shadowDarkness:{set:function(){console.warn("THREE.Light: .shadowDarkness has been removed.")}},shadowMapWidth:{set:function(t){console.warn("THREE.Light: .shadowMapWidth is now .shadow.mapSize.width."),this.shadow.mapSize.width=t}},shadowMapHeight:{set:function(t){console.warn("THREE.Light: .shadowMapHeight is now .shadow.mapSize.height."),this.shadow.mapSize.height=t}}}),Object.defineProperties(Xr.prototype,{length:{get:function(){return console.warn("THREE.BufferAttribute: .length has been deprecated. Use .count instead."),this.array.length}},copyIndicesArray:function(){console.error("THREE.BufferAttribute: .copyIndicesArray() has been removed.")}}),Object.assign(sn.prototype,{addIndex:function(t){console.warn("THREE.BufferGeometry: .addIndex() has been renamed to .setIndex()."),this.setIndex(t)},addDrawCall:function(t,e,r){void 0!==r&&console.warn("THREE.BufferGeometry: .addDrawCall() no longer supports indexOffset."),console.warn("THREE.BufferGeometry: .addDrawCall() is now .addGroup()."),this.addGroup(t,e)},clearDrawCalls:function(){console.warn("THREE.BufferGeometry: .clearDrawCalls() is now .clearGroups()."),this.clearGroups()},computeTangents:function(){console.warn("THREE.BufferGeometry: .computeTangents() has been removed.")},computeOffsets:function(){console.warn("THREE.BufferGeometry: .computeOffsets() has been removed.")}}),Object.defineProperties(sn.prototype,{drawcalls:{get:function(){return console.error("THREE.BufferGeometry: .drawcalls has been renamed to .groups."),this.groups}},offsets:{get:function(){return console.warn("THREE.BufferGeometry: .offsets has been renamed to .groups."),this.groups}}}),Object.assign(Bo.prototype,{getArrays:function(){console.error("THREE.ExtrudeBufferGeometry: .getArrays() has been removed.")},addShapeList:function(){console.error("THREE.ExtrudeBufferGeometry: .addShapeList() has been removed.")},addShape:function(){console.error("THREE.ExtrudeBufferGeometry: .addShape() has been removed.")}}),Object.defineProperties(Ah.prototype,{dynamic:{set:function(){console.warn("THREE.Uniform: .dynamic has been removed. Use object.onBeforeRender() instead.")}},onUpdate:{value:function(){return console.warn("THREE.Uniform: .onUpdate() has been removed. Use object.onBeforeRender() instead."),this}}}),Object.defineProperties(Sn.prototype,{wrapAround:{get:function(){console.warn("THREE.Material: .wrapAround has been removed.")},set:function(){console.warn("THREE.Material: .wrapAround has been removed.")}},overdraw:{get:function(){console.warn("THREE.Material: .overdraw has been removed.")},set:function(){console.warn("THREE.Material: .overdraw has been removed.")}},wrapRGB:{get:function(){return console.warn("THREE.Material: .wrapRGB has been removed."),new Lr}},shading:{get:function(){console.error("THREE."+this.type+": .shading has been removed. Use the boolean .flatShading instead.")},set:function(t){console.warn("THREE."+this.type+": .shading has been removed. Use the boolean .flatShading instead."),this.flatShading=t===C}}}),Object.defineProperties(cs.prototype,{metal:{get:function(){return console.warn("THREE.MeshPhongMaterial: .metal has been removed. Use THREE.MeshStandardMaterial instead."),!1},set:function(){console.warn("THREE.MeshPhongMaterial: .metal has been removed. Use THREE.MeshStandardMaterial instead")}}}),Object.defineProperties(Tn.prototype,{derivatives:{get:function(){return console.warn("THREE.ShaderMaterial: .derivatives has been moved to .extensions.derivatives."),this.extensions.derivatives},set:function(t){console.warn("THREE. ShaderMaterial: .derivatives has been moved to .extensions.derivatives."),this.extensions.derivatives=t}}}),Object.assign(Ma.prototype,{clearTarget:function(t,e,r,n){console.warn("THREE.WebGLRenderer: .clearTarget() has been deprecated. Use .setRenderTarget() and .clear() instead."),this.setRenderTarget(t),this.clear(e,r,n)},animate:function(t){console.warn("THREE.WebGLRenderer: .animate() is now .setAnimationLoop()."),this.setAnimationLoop(t)},getCurrentRenderTarget:function(){return console.warn("THREE.WebGLRenderer: .getCurrentRenderTarget() is now .getRenderTarget()."),this.getRenderTarget()},getMaxAnisotropy:function(){return console.warn("THREE.WebGLRenderer: .getMaxAnisotropy() is now .capabilities.getMaxAnisotropy()."),this.capabilities.getMaxAnisotropy()},getPrecision:function(){return console.warn("THREE.WebGLRenderer: .getPrecision() is now .capabilities.precision."),this.capabilities.precision},resetGLState:function(){return console.warn("THREE.WebGLRenderer: .resetGLState() is now .state.reset()."),this.state.reset()},supportsFloatTextures:function(){return console.warn("THREE.WebGLRenderer: .supportsFloatTextures() is now .extensions.get( 'OES_texture_float' )."),this.extensions.get("OES_texture_float")},supportsHalfFloatTextures:function(){return console.warn("THREE.WebGLRenderer: .supportsHalfFloatTextures() is now .extensions.get( 'OES_texture_half_float' )."),this.extensions.get("OES_texture_half_float")},supportsStandardDerivatives:function(){return console.warn("THREE.WebGLRenderer: .supportsStandardDerivatives() is now .extensions.get( 'OES_standard_derivatives' )."),this.extensions.get("OES_standard_derivatives")},supportsCompressedTextureS3TC:function(){return console.warn("THREE.WebGLRenderer: .supportsCompressedTextureS3TC() is now .extensions.get( 'WEBGL_compressed_texture_s3tc' )."),this.extensions.get("WEBGL_compressed_texture_s3tc")},supportsCompressedTexturePVRTC:function(){return console.warn("THREE.WebGLRenderer: .supportsCompressedTexturePVRTC() is now .extensions.get( 'WEBGL_compressed_texture_pvrtc' )."),this.extensions.get("WEBGL_compressed_texture_pvrtc")},supportsBlendMinMax:function(){return console.warn("THREE.WebGLRenderer: .supportsBlendMinMax() is now .extensions.get( 'EXT_blend_minmax' )."),this.extensions.get("EXT_blend_minmax")},supportsVertexTextures:function(){return console.warn("THREE.WebGLRenderer: .supportsVertexTextures() is now .capabilities.vertexTextures."),this.capabilities.vertexTextures},supportsInstancedArrays:function(){return console.warn("THREE.WebGLRenderer: .supportsInstancedArrays() is now .extensions.get( 'ANGLE_instanced_arrays' )."),this.extensions.get("ANGLE_instanced_arrays")},enableScissorTest:function(t){console.warn("THREE.WebGLRenderer: .enableScissorTest() is now .setScissorTest()."),this.setScissorTest(t)},initMaterial:function(){console.warn("THREE.WebGLRenderer: .initMaterial() has been removed.")},addPrePlugin:function(){console.warn("THREE.WebGLRenderer: .addPrePlugin() has been removed.")},addPostPlugin:function(){console.warn("THREE.WebGLRenderer: .addPostPlugin() has been removed.")},updateShadowMap:function(){console.warn("THREE.WebGLRenderer: .updateShadowMap() has been removed.")},setFaceCulling:function(){console.warn("THREE.WebGLRenderer: .setFaceCulling() has been removed.")}}),Object.defineProperties(Ma.prototype,{shadowMapEnabled:{get:function(){return this.shadowMap.enabled},set:function(t){console.warn("THREE.WebGLRenderer: .shadowMapEnabled is now .shadowMap.enabled."),this.shadowMap.enabled=t}},shadowMapType:{get:function(){return this.shadowMap.type},set:function(t){console.warn("THREE.WebGLRenderer: .shadowMapType is now .shadowMap.type."),this.shadowMap.type=t}},shadowMapCullFace:{get:function(){console.warn("THREE.WebGLRenderer: .shadowMapCullFace has been removed. Set Material.shadowSide instead.")},set:function(){console.warn("THREE.WebGLRenderer: .shadowMapCullFace has been removed. Set Material.shadowSide instead.")}}}),Object.defineProperties(ia.prototype,{cullFace:{get:function(){console.warn("THREE.WebGLRenderer: .shadowMap.cullFace has been removed. Set Material.shadowSide instead.")},set:function(){console.warn("THREE.WebGLRenderer: .shadowMap.cullFace has been removed. Set Material.shadowSide instead.")}},renderReverseSided:{get:function(){console.warn("THREE.WebGLRenderer: .shadowMap.renderReverseSided has been removed. Set Material.shadowSide instead.")},set:function(){console.warn("THREE.WebGLRenderer: .shadowMap.renderReverseSided has been removed. Set Material.shadowSide instead.")}},renderSingleSided:{get:function(){console.warn("THREE.WebGLRenderer: .shadowMap.renderSingleSided has been removed. Set Material.shadowSide instead.")},set:function(){console.warn("THREE.WebGLRenderer: .shadowMap.renderSingleSided has been removed. Set Material.shadowSide instead.")}}}),Object.defineProperties(pr.prototype,{wrapS:{get:function(){return console.warn("THREE.WebGLRenderTarget: .wrapS is now .texture.wrapS."),this.texture.wrapS},set:function(t){console.warn("THREE.WebGLRenderTarget: .wrapS is now .texture.wrapS."),this.texture.wrapS=t}},wrapT:{get:function(){return console.warn("THREE.WebGLRenderTarget: .wrapT is now .texture.wrapT."),this.texture.wrapT},set:function(t){console.warn("THREE.WebGLRenderTarget: .wrapT is now .texture.wrapT."),this.texture.wrapT=t}},magFilter:{get:function(){return console.warn("THREE.WebGLRenderTarget: .magFilter is now .texture.magFilter."),this.texture.magFilter},set:function(t){console.warn("THREE.WebGLRenderTarget: .magFilter is now .texture.magFilter."),this.texture.magFilter=t}},minFilter:{get:function(){return console.warn("THREE.WebGLRenderTarget: .minFilter is now .texture.minFilter."),this.texture.minFilter},set:function(t){console.warn("THREE.WebGLRenderTarget: .minFilter is now .texture.minFilter."),this.texture.minFilter=t}},anisotropy:{get:function(){return console.warn("THREE.WebGLRenderTarget: .anisotropy is now .texture.anisotropy."),this.texture.anisotropy},set:function(t){console.warn("THREE.WebGLRenderTarget: .anisotropy is now .texture.anisotropy."),this.texture.anisotropy=t}},offset:{get:function(){return console.warn("THREE.WebGLRenderTarget: .offset is now .texture.offset."),this.texture.offset},set:function(t){console.warn("THREE.WebGLRenderTarget: .offset is now .texture.offset."),this.texture.offset=t}},repeat:{get:function(){return console.warn("THREE.WebGLRenderTarget: .repeat is now .texture.repeat."),this.texture.repeat},set:function(t){console.warn("THREE.WebGLRenderTarget: .repeat is now .texture.repeat."),this.texture.repeat=t}},format:{get:function(){return console.warn("THREE.WebGLRenderTarget: .format is now .texture.format."),this.texture.format},set:function(t){console.warn("THREE.WebGLRenderTarget: .format is now .texture.format."),this.texture.format=t}},type:{get:function(){return console.warn("THREE.WebGLRenderTarget: .type is now .texture.type."),this.texture.type},set:function(t){console.warn("THREE.WebGLRenderTarget: .type is now .texture.type."),this.texture.type=t}},generateMipmaps:{get:function(){return console.warn("THREE.WebGLRenderTarget: .generateMipmaps is now .texture.generateMipmaps."),this.texture.generateMipmaps},set:function(t){console.warn("THREE.WebGLRenderTarget: .generateMipmaps is now .texture.generateMipmaps."),this.texture.generateMipmaps=t}}}),Object.defineProperties(wa.prototype,{standing:{set:function(){console.warn("THREE.WebVRManager: .standing has been removed.")}},userHeight:{set:function(){console.warn("THREE.WebVRManager: .userHeight has been removed.")}}}),rh.prototype.load=function(t){console.warn("THREE.Audio: .load has been deprecated. Use THREE.AudioLoader instead.");var e=this;return(new Qc).load(t,(function(t){e.setBuffer(t)})),this},ih.prototype.getData=function(){return console.warn("THREE.AudioAnalyser: .getData() is now .getFrequencyData()."),this.getFrequencyData()},$c.prototype.updateCubeMap=function(t,e){return console.warn("THREE.CubeCamera: .updateCubeMap() is now .update()."),this.update(t,e)};var Il={merge:function(t,e,r){var n;console.warn("THREE.GeometryUtils: .merge() has been moved to Geometry. Use geometry.merge( geometry2, matrix, materialIndexOffset ) instead."),e.isMesh&&(e.matrixAutoUpdate&&e.updateMatrix(),n=e.matrix,e=e.geometry),t.merge(e,n,r)},center:function(t){return console.warn("THREE.GeometryUtils: .center() has been moved to Geometry. Use geometry.center() instead."),t.center()}};function Dl(){console.error("THREE.Projector has been moved to /examples/js/renderers/Projector.js."),this.projectVector=function(t,e){console.warn("THREE.Projector: .projectVector() is now vector.project()."),t.project(e)},this.unprojectVector=function(t,e){console.warn("THREE.Projector: .unprojectVector() is now vector.unproject()."),t.unproject(e)},this.pickingRay=function(){console.error("THREE.Projector: .pickingRay() is now raycaster.setFromCamera().")}}function Nl(){console.error("THREE.CanvasRenderer has been removed")}function Bl(){console.error("THREE.JSONLoader has been removed.")}cr.crossOrigin=void 0,cr.loadTexture=function(t,e,r,n){console.warn("THREE.ImageUtils.loadTexture has been deprecated. Use THREE.TextureLoader() instead.");var i=new Fs;i.setCrossOrigin(this.crossOrigin);var a=i.load(t,r,void 0,n);return e&&(a.mapping=e),a},cr.loadTextureCube=function(t,e,r,n){console.warn("THREE.ImageUtils.loadTextureCube has been deprecated. Use THREE.CubeTextureLoader() instead.");var i=new Gs;i.setCrossOrigin(this.crossOrigin);var a=i.load(t,r,void 0,n);return e&&(a.mapping=e),a},cr.loadCompressedTexture=function(){console.error("THREE.ImageUtils.loadCompressedTexture has been removed. Use THREE.DDSLoader instead.")},cr.loadCompressedTextureCube=function(){console.error("THREE.ImageUtils.loadCompressedTextureCube has been removed. Use THREE.DDSLoader instead.")};var zl={createMultiMaterialObject:function(){console.error("THREE.SceneUtils has been moved to /examples/js/utils/SceneUtils.js")},detach:function(){console.error("THREE.SceneUtils has been moved to /examples/js/utils/SceneUtils.js")},attach:function(){console.error("THREE.SceneUtils has been moved to /examples/js/utils/SceneUtils.js")}};function Ul(){console.error("THREE.LensFlare has been moved to /examples/js/objects/Lensflare.js")}},729:()=>{THREE.CSS2DObject=function(t){THREE.Object3D.call(this),this.element=t,this.element.style.position="absolute",this.addEventListener("removed",(function(t){null!==this.element.parentNode&&this.element.parentNode.removeChild(this.element)}))},THREE.CSS2DObject.prototype=Object.create(THREE.Object3D.prototype),THREE.CSS2DObject.prototype.constructor=THREE.CSS2DObject,THREE.CSS2DRenderer=function(){var t,e,r,n;console.log("THREE.CSS2DRenderer",THREE.REVISION);var i=new THREE.Vector3,a=new THREE.Matrix4,o=new THREE.Matrix4,s={objects:new WeakMap},c=document.createElement("div");c.style.overflow="hidden",this.domElement=c,this.getSize=function(){return{width:t,height:e}},this.setSize=function(i,a){r=(t=i)/2,n=(e=a)/2,c.style.width=i+"px",c.style.height=a+"px"};var h,l,u=function(t,e){if(t instanceof THREE.CSS2DObject){i.setFromMatrixPosition(t.matrixWorld),i.applyMatrix4(o);var a=t.element,h="translate(-50%,-50%) translate("+Math.round(i.x*r+r)+"px,"+Math.round(-i.y*n+n)+"px)";a.style.WebkitTransform=h,a.style.MozTransform=h,a.style.oTransform=h,a.style.transform=h,a.style.left=t.visible&&i.z>=-1&&i.z<=1?"":"-99999px",a.style.pointerEvents=t.visible&&i.z>=-1&&i.z<=1?"":"none";var l={distanceToCameraSquared:p(e,t)};s.objects.set(t,l),a.parentNode!==c&&c.appendChild(a)}for(var d=0,f=t.children.length;d<f;d++)u(t.children[d],e)},p=(h=new THREE.Vector3,l=new THREE.Vector3,function(t,e){return h.setFromMatrixPosition(t.matrixWorld),l.setFromMatrixPosition(e.matrixWorld),h.distanceToSquared(l)});this.render=function(t,e){t.updateMatrixWorld(),null===e.parent&&e.updateMatrixWorld(),a.copy(e.matrixWorldInverse),o.multiplyMatrices(e.projectionMatrix,a),u(t,e)}}},358:()=>{THREE.CSS3DObject=function(t){THREE.Object3D.call(this),this.element=t,this.element.style.position="absolute",this.addEventListener("removed",(function(){null!==this.element.parentNode&&this.element.parentNode.removeChild(this.element)}))},THREE.CSS3DObject.prototype=Object.create(THREE.Object3D.prototype),THREE.CSS3DObject.prototype.constructor=THREE.CSS3DObject,THREE.CSS3DSprite=function(t){THREE.CSS3DObject.call(this,t)},THREE.CSS3DSprite.prototype=Object.create(THREE.CSS3DObject.prototype),THREE.CSS3DSprite.prototype.constructor=THREE.CSS3DSprite,THREE.CSS3DRenderer=function(){var t,e,r,n;console.log("THREE.CSS3DRenderer",THREE.REVISION);var i=new THREE.Matrix4,a={camera:{fov:0,style:""},objects:new WeakMap},o=document.createElement("div");o.style.overflow="hidden",this.domElement=o;var s=document.createElement("div");s.style.WebkitTransformStyle="preserve-3d",s.style.transformStyle="preserve-3d",o.appendChild(s);var c=/Trident/i.test(navigator.userAgent);function h(t){return Math.abs(t)<1e-10?0:t}function l(t){var e=t.elements;return"matrix3d("+h(e[0])+","+h(-e[1])+","+h(e[2])+","+h(e[3])+","+h(e[4])+","+h(-e[5])+","+h(e[6])+","+h(e[7])+","+h(e[8])+","+h(-e[9])+","+h(e[10])+","+h(e[11])+","+h(e[12])+","+h(-e[13])+","+h(e[14])+","+h(e[15])+")"}function u(t,e){var i=t.elements,a="matrix3d("+h(i[0])+","+h(i[1])+","+h(i[2])+","+h(i[3])+","+h(-i[4])+","+h(-i[5])+","+h(-i[6])+","+h(-i[7])+","+h(i[8])+","+h(i[9])+","+h(i[10])+","+h(i[11])+","+h(i[12])+","+h(i[13])+","+h(i[14])+","+h(i[15])+")";return c?"translate(-50%,-50%)translate("+r+"px,"+n+"px)"+e+a:"translate(-50%,-50%)"+a}function p(t,e,r){if(t instanceof THREE.CSS3DObject){var n;t instanceof THREE.CSS3DSprite?(i.copy(e.matrixWorldInverse),i.transpose(),i.copyPosition(t.matrixWorld),i.scale(t.scale),i.elements[3]=0,i.elements[7]=0,i.elements[11]=0,i.elements[15]=1,n=u(i,r)):n=u(t.matrixWorld,r);var o=t.element,h=a.objects.get(t);if(void 0===h||h.style!==n){o.style.WebkitTransform=n,o.style.transform=n;var l={style:n};c&&(l.distanceToCameraSquared=m(e,t)),a.objects.set(t,l)}o.parentNode!==s&&s.appendChild(o)}for(var d=0,f=t.children.length;d<f;d++)p(t.children[d],e,r)}this.getSize=function(){return{width:t,height:e}},this.setSize=function(i,a){r=(t=i)/2,n=(e=a)/2,o.style.width=i+"px",o.style.height=a+"px",s.style.width=i+"px",s.style.height=a+"px"};var d,f,m=(d=new THREE.Vector3,f=new THREE.Vector3,function(t,e){return d.setFromMatrixPosition(t.matrixWorld),f.setFromMatrixPosition(e.matrixWorld),d.distanceToSquared(f)});this.render=function(t,e){var i=e.projectionMatrix.elements[5]*n;if(a.camera.fov!==i&&(e.isPerspectiveCamera&&(o.style.WebkitPerspective=i+"px",o.style.perspective=i+"px"),a.camera.fov=i),t.updateMatrixWorld(),null===e.parent&&e.updateMatrixWorld(),e.isOrthographicCamera)var u=-(e.right+e.left)/2,d=(e.top+e.bottom)/2;var f=e.isOrthographicCamera?"scale("+i+")translate("+h(u)+"px,"+h(d)+"px)"+l(e.matrixWorldInverse):"translateZ("+i+"px)"+l(e.matrixWorldInverse),m=f+"translate("+r+"px,"+n+"px)";a.camera.style===m||c||(s.style.WebkitTransform=m,s.style.transform=m,a.camera.style=m),p(t,e,f),c&&function(t){for(var e=function(t){var e=[];return t.traverse((function(t){t instanceof THREE.CSS3DObject&&e.push(t)})),e}(t).sort((function(t,e){return a.objects.get(t).distanceToCameraSquared-a.objects.get(e).distanceToCameraSquared})),r=e.length,n=0,i=e.length;n<i;n++)e[n].element.style.zIndex=r-n}(t)}}}},e={};function r(n){var i=e[n];if(void 0!==i)return i.exports;var a=e[n]={exports:{}};return t[n](a,a.exports,r),a.exports}r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},H5P.ThreeJS=(r.g.THREE=r(212),r(358),r(729),THREE)})();;
H5P.ThreeSixty = (function (EventDispatcher, THREE) {

  /**
   * Convert deg to rad
   * @return {number}
   */
  var toRad = function (value) {
    return value * (Math.PI / 180);
  };

  const maxPitch = Math.PI / 2;
  const pi2 = Math.PI * 2;

  /**
   * The 360 degree panorama viewer with support for virtual reality.
   *
   * @class H5P.ThreeSixty
   * @extends H5P.EventDispatcher
   * @param {DOMElement} sourceElement video or image source
   * @param {Object} options
   * @param {number} options.ratio Display ratio of the viewport
   * @param {Object} options.cameraStartPosition
   * @param {number} options.cameraStartPosition.yaw 0 = Center of image
   * @param {number} options.cameraStartPosition.pitch 0 = Center of image
   * @param {number} options.segments
   * @param {Function} [sourceNeedsUpdate] Determines if the source texture needs to be rerendered.
   */
  function ThreeSixty(sourceElement, options, sourceNeedsUpdate) {
    /** @alias H5P.ThreeSixty# */
    var self = this;

    // Initialize event inheritance
    EventDispatcher.call(self);

    // Settings
    const fieldOfView = 75;
    const near = 0.1;
    const far = 1000;
    let ratio = options.ratio ? options.ratio : 16 / 9;

    // Main wrapper element
    self.element = document.createElement('div');
    self.element.classList.add('h5p-three-sixty');

    // TODO: ThreeSixty should not have to deal with this, this belongs in a
    // a separate collection/array class. (ThreeSixty should just add or remove
    // elements from the 3d world, not keep an indexed mapping for the
    // consumer/user of this library.)
    const threeElements = [];

    /**
     * Help set up renderers and add them to the main wrapper element.
     *
     * @private
     * @param {THREE.Object3D|THREE.WebGLRenderer} renderer
     */
    var add = function (renderer) {
      renderer.domElement.classList.add('h5p-three-sixty-scene');
      self.element.appendChild(renderer.domElement);
      return renderer;
    };

    /**
     * Set the label for the application element (camera controls).
     * Needed to be compatible with assitive tools.
     *
     * @param {string} label
     */
   self.setAriaLabel = function (label) {
      cssRenderer.domElement.setAttribute('aria-label', label);
      cssRenderer.domElement.setAttribute('aria-role', 'document'); // TODO: Separate setting?
    };

    /**
     * Get the container of all the added 3D elements.
     * Useful when rendering via React.
     *
     * @return {Element}
     */
    self.getCameraElement = function () {
      return cssRenderer.domElement;
    };

    /**
     * Set focus to the scene.
     */
    self.focus = function () {
      cssRenderer.domElement.focus();
    };

    /**
     * Change the tabindex attribute of the scene element
     *
     * @param {boolean} enable
     */
    self.setTabIndex = function (enable) {
      cssRenderer.domElement.tabIndex = (enable ? '0' : '-1');
    };

    /**
     * Set the current camera position.
     *
     * The default center/front part of an equirectangular image is usually
     * the center of image.
     *
     * @param {number} yaw Horizontal angle
     * @param {number} pitch Vertical angle
     */
    self.setCameraPosition = function (yaw, pitch) {
      if (preventDeviceOrientation) {
        return; // Prevent other codes from setting position while the user is dragging
      }
      camera.rotation.y = -yaw;
      camera.rotation.x = pitch;
      self.trigger('movestop', { // TODO: Figure out why this is here and what it does
        pitch: pitch,
        yaw: yaw,
      });
    };

    // Create scene, add camera and a WebGL renderer
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(fieldOfView, ratio, near, far);
    camera.rotation.order = 'YXZ';

    const camPos = options.cameraStartPosition || {};
    self.setCameraPosition(
      camPos.yaw !== undefined ? camPos.yaw : -(Math.PI * (2/3)),
      camPos.pitch !== undefined ? camPos.pitch : 0
    );
    const radius = 10;
    let segmentation = options.segments || 4;

    let sphere, renderLoopId = null;

    /**
     * Create the world sphere with its needed resources.
     * @private
     */
    const createSphere = function () {
      // Create a sphere surrounding the camera with the source texture
      const geometry = new THREE.SphereGeometry(radius, segmentation, segmentation);

      // Create material with texture from source element
      const material = new THREE.MeshBasicMaterial({
        map: new THREE.Texture(sourceElement, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter, THREE.RGBFormat)
      });
      material.map.needsUpdate = true;

      // Prepare sphere and add to scene
      sphere = new THREE.Mesh(geometry, material);
      geometry.scale(-1, 1, 1); // Flip to make front side face inwards
      scene.add(sphere);
    };

    /**
     * Remove sphere resources from memory.
     * @private
     */
    const disposeSphere = function () {
      scene.remove(sphere);
      sphere.geometry.dispose();
      sphere.material.dispose();
      sphere.material.map.dispose();
      sphere = null;
    };

    var renderer = add(new THREE.WebGLRenderer());

    // Create a scene for our "CSS world"
    var cssScene = new THREE.Scene();

    var cssRenderer = add(new THREE.CSS2DRenderer);

    // Prevent internal scrolling in the CSS 3d world.
    cssRenderer.domElement.addEventListener('scroll', function (e) {
      if (this.scrollTop !== 0 || this.scrollLeft !== 0) {
        // Reset the scroll before the scene gets a chance to render
        this.scrollTo(0, 0);
      }
    });

    /**
     * Start rendering scene
     */
    self.startRendering = function () {
      if (renderLoopId === null) { // Prevents double rendering
        render();
      }
    };

    /**
     * Stop rendering scene
     */
    self.stopRendering = function () {
      cancelAnimationFrame(renderLoopId);
      renderLoopId = null;
    };

    /**
     * Change the number of segments used to create the sphere.
     * Note: Rendering has to be stopped and started again for these changes
     * to take affect. (Due to memory management)
     * @param {number} numSegments
     */
    self.setSegmentNumber = function (numSegments) {
      segmentation = numSegments;
    };

    /**
     * Change the sourceElement of the world sphere.
     * Useful for changing scenes.
     * @param {DOMElement} element video or image source
     */
    self.setSourceElement = function (element) {
      sourceElement = element;
    };

    /**
     * Will re-create the world sphere. Useful after changing sourceElement
     * or segment number.
     *
     * Note that this will have to be called initally to create the sphere as
     * well to allow for full control.
     */
    self.update = function () {
      if (sphere) {
        disposeSphere();
      }
      createSphere();
      triggerFirstRenderEvent = true;
    }

    let triggerFirstRenderEvent;

    /**
     * Triggers a redraw of texture fetched from the sourceElement.
     * This is useful in case the source has changed.
     */
    self.updateSource = function () {
      sphere.material.map.needsUpdate = true;
    };

    /**
     * Add element to "CSS 3d world"
     *
     * @param {DOMElement} element
     * @param {Object} startPosition
     * @param {boolean} enableControls
     */
    self.add = function (element, startPosition, enableControls) {
      var threeElement = new THREE.CSS2DObject(element);
      threeElements.push(threeElement);

      // Reset HUD values
      element.style.left = 0;
      element.style.top = 0;

      if (enableControls) {
        var elementControls = new PositionControls(self, element);

        // Relay and supplement startMoving event
        elementControls.on('movestart', function (event) {
          // Set camera start position
          elementControls.startY = -threeElement.rotation.y;
          elementControls.startX = threeElement.rotation.x;

          preventDeviceOrientation = true;
          self.trigger(event);
        });

        // Update element position according to movement
        elementControls.on('move', function (event) {
          ThreeSixty.setElementPosition(threeElement, {
            yaw: elementControls.startY + event.alpha,
            pitch: elementControls.startX - event.beta
          });
        });

        // Relay and supplement stopMoving event
        elementControls.on('movestop', function (event) {
          event.data = {
            target: element,
            yaw: -threeElement.rotation.y,
            pitch: threeElement.rotation.x
          };
          preventDeviceOrientation = false;
          self.trigger(event);
        });

        // Move camera to element when tabbing
        element.addEventListener('focus', function (e) {
          if (!e.defaultPrevented) {
            self.setCameraPosition(-threeElement.rotation.y, threeElement.rotation.x);
          }
        }, false);
      }

      // Set initial position
      ThreeSixty.setElementPosition(threeElement, startPosition);

      cssScene.add(threeElement);
      return threeElement;
    };

    /**
     * Remove element from "CSS world"
     * @param {THREE.CSS3DObject} threeElement
     */
    self.remove = function (threeElement) {
      threeElements.splice(threeElements.indexOf(threeElement), 1);
      cssScene.remove(threeElement);
    };

    /**
     * Find the threeElement for the given element.
     * TODO: Move into a separate collection handling class
     *
     * @param {Element} element
     * @return {THREE.CSS3DObject}
     */
    self.find = function (element) {
      for (let i = 0; i < threeElements.length; i++) {
        if (threeElements[i].element === element) {
          return threeElements[i];
        }
      }
    };

    /**
     * Find the index of the given element.
     * TODO: Move into a separate collection handling class
     *
     * @param {Element} element
     * @return {number}
     */
    self.indexOf = function (element) {
      for (let i = 0; i < threeElements.length; i++) {
        if (threeElements[i].element === element) {
          return i;
        }
      }
    };

    /**
     * Get the position the camera is currently pointing at
     *
     * @return {Object}
     */
    self.getCurrentPosition = function () {
      return {
        yaw: -camera.rotation.y,
        pitch: camera.rotation.x
      };
    };

    /**
     * TODO
     */
    self.getCurrentFov = function () {
      return camera.getEffectiveFOV();
    };

    /**
     * TODO
     */
    self.getElement = function () {
      return self.element;
    };

    /**
     * Give new size
     */
    self.resize = function (newRatio) {
      if (!self.element.clientWidth) {
        return;
      }

      if (newRatio) {
        camera.aspect = newRatio;
        camera.updateProjectionMatrix();
      }
      else {
        newRatio = ratio; // Avoid replacing the original
      }

      // Resize main wrapping element
      self.element.style.height = (self.element.clientWidth / newRatio) + 'px';

      // Resize renderers
      renderer.setSize(self.element.clientWidth, self.element.clientHeight);
      cssRenderer.setSize(self.element.clientWidth, self.element.clientHeight);
    };

    var hasFirstRender;

    /**
     * @private
     */
    var render = function () {

      // Draw scenes
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);

      // Prepare next render
      renderLoopId = requestAnimationFrame(render);

      if (triggerFirstRenderEvent) {
        triggerFirstRenderEvent = false;
        self.trigger('firstrender');
      }
    };

    // Add camera controls
    var cameraControls = new PositionControls(self, cssRenderer.domElement, 400, true, true);

    // Workaround for touchevent not cancelable when CSS 'perspective' is set.
    renderer.domElement.addEventListener('touchmove', function (e) { });
    // This appears to be a bug in Chrome.

    // Camera starts moving handler
    cameraControls.on('movestart', function (event) {
      // Set camera start position
      cameraControls.startY = camera.rotation.y;
      cameraControls.startX = camera.rotation.x;

      preventDeviceOrientation = true;

      // Relay event
      self.trigger(event);
    });

    // Rotate camera as controls move
    cameraControls.on('move', function (event) {
      let yaw = cameraControls.startY + event.alpha;
      let pitch = cameraControls.startX + event.beta;

      // Set outer bounds for camera so it does not loop around.
      // It can max see max 90 degrees up and down
      const radsFromCameraCenter = toRad(fieldOfView) / 2;
      if (pitch + radsFromCameraCenter > maxPitch) {
        pitch = maxPitch - radsFromCameraCenter;
      }
      else if (pitch - radsFromCameraCenter < -maxPitch) {
        pitch = -maxPitch + radsFromCameraCenter;
      }

      // Keep yaw between 0 and 2PI
      yaw %= pi2;
      if (yaw < 0) { // Reset when passing 0
        yaw += pi2;
      }

      // Allow infinite yaw rotations
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
    });

    // Relay camera movement stopped event
    cameraControls.on('movestop', function (event) {
      preventDeviceOrientation = false;
      event.data = {
        yaw: -camera.rotation.y,
        pitch: camera.rotation.x
      };
      self.trigger(event);
    });

    // Add approperiate styling
    cssRenderer.domElement.classList.add('h5p-three-sixty-controls');

    var preventDeviceOrientation;
    var qOrientation, qMovement, qNinety, euler, xVector, zVector;

    /**
     * Handle screen orientation change by compensating camera
     *
     * @private
     */
    var setOrientation = function () {
      qOrientation.setFromAxisAngle(zVector, toRad(-(window.orientation || 0)));
    };

    /**
     * Initialize orientation supported device
     *
     * @private
     */
    var initializeOrientation = function () {
      qOrientation = new THREE.Quaternion();
      qMovement = new THREE.Quaternion();
      qNinety = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
      euler = new THREE.Euler();
      xVector = new THREE.Vector3(1, 0, 0);
      zVector = new THREE.Vector3(0, 0, 1);

      // Listen for screen rotation
      window.addEventListener('orientationchange', setOrientation, false);
      setOrientation(); // Set default
    };

    /**
     * Handle device groscope movement
     *
     * @param {DeviceOrientationEvent} event
     */
    var deviceOrientation = function (event) {
      if (qOrientation === undefined) {
        // Initialize on first orientation event
        initializeOrientation();
      }

      if (preventDeviceOrientation) {
        return;
      }

      // Adjust camera to reflect device movement
      euler.set(toRad(event.beta), toRad(event.alpha) + cameraControls.getAlpha(), toRad(-event.gamma), 'YXZ');
      camera.quaternion.setFromEuler(euler);
      camera.quaternion.multiply(qNinety); // Shift camera 90 degrees
      qMovement.setFromAxisAngle(xVector, -cameraControls.getBeta());
      camera.quaternion.multiply(qMovement); // Compensate for movement
      camera.quaternion.multiply(qOrientation); // Compensate for device orientation
    };

    // Add device orientation controls
    // TODO: Fix
    //window.addEventListener('deviceorientation', deviceOrientation, false);
  }

  // Extends the event dispatcher
  ThreeSixty.prototype = Object.create(EventDispatcher.prototype);
  ThreeSixty.prototype.constructor = ThreeSixty;

  /**
   * Class for manipulating element position using different controls.
   *
   * @class
   * @param {Object} threeSixty
   * @param {THREE.Object3D} element
   * @param {number} [friction] Determines the speed of the movement
   * @param {number} [invert] Needed to invert controls for camera
   * @param {boolean} [isCamera]
   */
  function PositionControls(threeSixty, element, friction, invert, isCamera) {
    /** @type PositionControls# */
    var self = this;

    // Initialize event inheritance
    EventDispatcher.call(self);

    // Set default parameters
    if (!friction) {
      friction = 800; // Higher = slower
    }
    invert = invert ? 1 : -1;

    var alpha = 0; // From 0 to 2pi
    var beta = 0; // From -pi/2 to pi/2

    var controlActive; // Determine if a control is being used

    var startPosition; // Where the element is when it starts moving
    var prevPosition;
    var startAlpha; // Holds initial alpha value while control is active
    var startBeta; // Holds initial beta value while control is active

    let keyStillDown = null; // Used to determine if a movement key is being held down.

    /**
     * Generic initialization when movement starts.
     *
     * @private
     * @param {number} x Initial x coordinate
     * @param {number} y Initial y coordinate
     * @param {string} control Identifier
     * @param {Event} e Original event
     * @return {boolean} If it's safe to start moving
     */
    var start = function (x, y, control, e) {
      if (controlActive) {
        return false; // Another control is active
      }

      // Trigger an event when we start moving, and give other components
      // a chance to cancel
      const eventData = {
        element: element,
        isCamera: isCamera,
      };

      if (e) {
        eventData.target = e.target;
      }

      var movestartEvent = new H5P.Event('movestart', eventData);
      movestartEvent.defaultPrevented = false;

      self.trigger(movestartEvent);
      if (movestartEvent.defaultPrevented) {
        return false; // Another component doesn't want us to start moving
      }

      // Set initial position
      startPosition = {
        x: x,
        y: y
      };
      alpha = 0;
      beta = 0;
      startAlpha = alpha;
      startBeta = beta;

      controlActive = control;
      return true;
    };

    /**
     * Generic movement handler
     *
     * @private
     * @param {number} deltaX Current deltaX coordinate
     * @param {number} deltaY Current deltaY coordinate
     * @param {number} f Current friction
     */
    var move = function (deltaX, deltaY, f) {
      // Prepare move event
      var moveEvent = new H5P.Event('move');

      // Update position relative to cursor speed
      moveEvent.alphaDelta = deltaX / f;
      moveEvent.betaDelta = deltaY / f;
      alpha = (alpha + moveEvent.alphaDelta) % pi2; // Max 360
      beta = (beta + moveEvent.betaDelta) % Math.PI; // Max 180

      // Max 90 degrees up and down on pitch  TODO: test
      var ninety = Math.PI / 2;
      if (beta > ninety) {
        beta = ninety;
      }
      else if (beta < -ninety) {
        beta = -ninety;
      }

      moveEvent.alpha = alpha;
      moveEvent.beta = beta;

      // Trigger move event
      self.trigger(moveEvent);
    };

    /**
     * Generic deinitialization when movement stops.
     *
     * @private
     */
    var end = function () {
      element.classList.remove('dragging');
      controlActive = false;
      self.trigger('movestop');
    };

    /**
     * Handle mouse down
     *
     * @private
     * @param {MouseEvent} event
     */
    var mouseDown = function (event) {
      if (event.which !== 1) {
        return; // Only react to left click
      }

      if (!start(event.pageX, event.pageY, 'mouse', event)) {
        return; // Prevented by another component
      }

      // Prevent other elements from moving
      event.stopPropagation();

      // Register mouse move and up handlers
      window.addEventListener('mousemove', mouseMove, false);
      window.addEventListener('mouseup', mouseUp, false);

    };

    /**
     * Handle mouse move
     *
     * @private
     * @param {MouseEvent} event
     */
    var mouseMove = function (event) {
      let xDiff = event.movementX;
      let yDiff = event.movementY;
      if (event.movementX === undefined || event.movementY === undefined) {
        // Diff on old values
        if (!prevPosition) {
          prevPosition = {
            x: startPosition.x,
            y: startPosition.y,
          };
        }
        xDiff = event.pageX - prevPosition.x;
        yDiff = event.pageY - prevPosition.y;

        prevPosition = {
          x: event.pageX,
          y: event.pageY,
        };
      }
      if (xDiff !== 0 || yDiff !== 0) {
        move(xDiff, yDiff, friction);
      }
    };

    /**
     * Handle mouse up
     *
     * @private
     * @param {MouseEvent} event
     */
    var mouseUp = function (event) {
      prevPosition = null;
      window.removeEventListener('mousemove', mouseMove, false);
      window.removeEventListener('mouseup', mouseUp, false);
      end();
    };

    /**
     * Handle touch start
     *
     * @private
     * @param {TouchEvent} event
     */
    var touchStart = function (event) {
      if (!start(event.changedTouches[0].pageX, event.changedTouches[0].pageY, 'touch')) {
        return;
      }

      element.addEventListener('touchmove', touchMove, false);
      element.addEventListener('touchend', touchEnd, false);
    };

    /**
     * Handle touch movement
     *
     * @private
     * @param {TouchEvent} event
     */
    var touchMove = function (event) {
      if (!event.cancelable) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (!prevPosition) {
        prevPosition = {
          x: startPosition.x,
          y: startPosition.y,
        };
      }
      const deltaX = event.changedTouches[0].pageX - prevPosition.x;
      const deltaY = event.changedTouches[0].pageY - prevPosition.y;
      prevPosition = {
        x: event.changedTouches[0].pageX,
        y: event.changedTouches[0].pageY,
      };
      move(deltaX, deltaY, friction * 0.75);
    };

    /**
     * Handle touch end
     *
     * @private
     * @param {TouchEvent} event
     */
    var touchEnd = function (event) {
      prevPosition = null;
      element.removeEventListener('touchmove', touchMove, false);
      element.removeEventListener('touchend', touchEnd, false);
      end();
    };

    /**
     * Handle touch start
     *
     * @private
     * @param {TouchEvent} event
     */
    var keyDown = function (event) {
      if ([37, 100, 38, 104, 39, 102, 40, 98].indexOf(event.which) === -1) {
        return; // Not an arrow key
      }

      if (keyStillDown === null) {
        // Try to start movement
        if (start(0, 0, 'keyboard')) {
          keyStillDown = event.which;
          element.addEventListener('keyup', keyUp, false);
        }
      }

      // Prevent the default behavior
      event.preventDefault();
      event.stopPropagation();

      if (keyStillDown !== event.which) {
        return; // Not the same key as we started with
      }

      const delta = {
        x: 0,
        y: 0
      };

      // Update movement in approperiate direction
      switch (event.which) {
        case 37:
        case 100:
          delta.x += invert;
          break;
        case 38:
        case 104:
          delta.y += invert;
          break;
        case 39:
        case 102:
          delta.x -= invert;
          break;
        case 40:
        case 98:
          delta.y -= invert;
          break;
      }
      move(delta.x, delta.y, friction * 0.025);
    };

    /**
     * Handle touch end
     *
     * @private
     * @param {TouchEvent} event
     */
    var keyUp = function (event) {
      keyStillDown = null;
      element.removeEventListener('keyup', keyUp, false);
      end();
    };

    /**
     * Manually handle focusing to avoid scrolling the elements out of place.
     *
     * @private
     * @param {TouchEvent} event
     */
    var focus = function (e) {
      e.preventDefault();
      e.target.focus({
        preventScroll: true
      });
    }

    /**
     * @return {number}
     */
    self.getAlpha = function () {
      return alpha;
    };

    /**
     * @return {number}
     */
    self.getBeta = function () {
      return beta;
    };

    /**
     * @param {string} [control] Check for specific control
     * @return {boolean}
     */
    self.isMoving = function (control) {
      return (control ? controlActive === control : !!controlActive);
    };

    // Register event listeners to position element
    element.addEventListener('mousedown', mouseDown, false);
    element.addEventListener('touchstart', touchStart, false);
    element.addEventListener('keydown', keyDown, false);
    element.tabIndex = '0';
    element.setAttribute('role', 'application');
    element.addEventListener('focus', focus, false);
  }

  /**
   * Set the element's position in the 3d world, always facing the camera.
   *
   * @param {THREE.CSS3DObject} threeElement
   * @param {Object} position
   * @param {number} position.yaw Radians from 0 to Math.PI*2 (0-360)
   * @param {number} position.pitch Radians from -Math.PI/2 to Math.PI/2 (-90-90)
   */
  ThreeSixty.setElementPosition = function (threeElement, position) {
    var radius = 800;

    threeElement.position.x = radius * Math.sin(position.yaw) * Math.cos(position.pitch);
    threeElement.position.y = radius * Math.sin(position.pitch);
    threeElement.position.z = -radius * Math.cos(position.yaw) * Math.cos(position.pitch);

    threeElement.rotation.order = 'YXZ';
    threeElement.rotation.y = -position.yaw;
    threeElement.rotation.x = +position.pitch;
  };

  return ThreeSixty;
})(H5P.EventDispatcher, H5P.ThreeJS);
;
/*! For license information please see h5p-three-image.js.LICENSE.txt */
(()=>{var e={525:e=>{"use strict";var t=Object.getOwnPropertySymbols,n=Object.prototype.hasOwnProperty,r=Object.prototype.propertyIsEnumerable;function i(e){if(null==e)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(e)}e.exports=function(){try{if(!Object.assign)return!1;var e=new String("abc");if(e[5]="de","5"===Object.getOwnPropertyNames(e)[0])return!1;for(var t={},n=0;n<10;n++)t["_"+String.fromCharCode(n)]=n;if("0123456789"!==Object.getOwnPropertyNames(t).map((function(e){return t[e]})).join(""))return!1;var r={};return"abcdefghijklmnopqrst".split("").forEach((function(e){r[e]=e})),"abcdefghijklmnopqrst"===Object.keys(Object.assign({},r)).join("")}catch(e){return!1}}()?Object.assign:function(e,o){for(var a,l,s=i(e),u=1;u<arguments.length;u++){for(var c in a=Object(arguments[u]))n.call(a,c)&&(s[c]=a[c]);if(t){l=t(a);for(var d=0;d<l.length;d++)r.call(a,l[d])&&(s[l[d]]=a[l[d]])}}return s}},772:(e,t,n)=>{"use strict";var r=n(331);function i(){}function o(){}o.resetWarningCache=i,e.exports=function(){function e(e,t,n,i,o,a){if(a!==r){var l=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw l.name="Invariant Violation",l}}function t(){return e}e.isRequired=e;var n={array:e,bigint:e,bool:e,func:e,number:e,object:e,string:e,symbol:e,any:e,arrayOf:t,element:e,elementType:e,instanceOf:t,node:e,objectOf:t,oneOf:t,oneOfType:t,shape:t,exact:t,checkPropTypes:o,resetWarningCache:i};return n.PropTypes=n,n}},615:(e,t,n)=>{e.exports=n(772)()},331:e=>{"use strict";e.exports="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"},577:(e,t,n)=>{"use strict";var r=n(378),i=n(525),o=n(102);function a(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}if(!r)throw Error(a(227));function l(e,t,n,r,i,o,a,l,s){var u=Array.prototype.slice.call(arguments,3);try{t.apply(n,u)}catch(e){this.onError(e)}}var s=!1,u=null,c=!1,d=null,p={onError:function(e){s=!0,u=e}};function f(e,t,n,r,i,o,a,c,d){s=!1,u=null,l.apply(p,arguments)}var h=null,m=null,g=null;function y(e,t,n){var r=e.type||"unknown-event";e.currentTarget=g(n),function(e,t,n,r,i,o,l,p,h){if(f.apply(this,arguments),s){if(!s)throw Error(a(198));var m=u;s=!1,u=null,c||(c=!0,d=m)}}(r,t,void 0,e),e.currentTarget=null}var v=null,b={};function x(){if(v)for(var e in b){var t=b[e],n=v.indexOf(e);if(!(-1<n))throw Error(a(96,e));if(!w[n]){if(!t.extractEvents)throw Error(a(97,e));for(var r in w[n]=t,n=t.eventTypes){var i=void 0,o=n[r],l=t,s=r;if(k.hasOwnProperty(s))throw Error(a(99,s));k[s]=o;var u=o.phasedRegistrationNames;if(u){for(i in u)u.hasOwnProperty(i)&&S(u[i],l,s);i=!0}else o.registrationName?(S(o.registrationName,l,s),i=!0):i=!1;if(!i)throw Error(a(98,r,e))}}}}function S(e,t,n){if(E[e])throw Error(a(100,e));E[e]=t,T[e]=t.eventTypes[n].dependencies}var w=[],k={},E={},T={};function P(e){var t,n=!1;for(t in e)if(e.hasOwnProperty(t)){var r=e[t];if(!b.hasOwnProperty(t)||b[t]!==r){if(b[t])throw Error(a(102,t));b[t]=r,n=!0}}n&&x()}var C=!("undefined"==typeof window||void 0===window.document||void 0===window.document.createElement),I=null,N=null,L=null;function _(e){if(e=m(e)){if("function"!=typeof I)throw Error(a(280));var t=e.stateNode;t&&(t=h(t),I(e.stateNode,e.type,t))}}function D(e){N?L?L.push(e):L=[e]:N=e}function F(){if(N){var e=N,t=L;if(L=N=null,_(e),t)for(e=0;e<t.length;e++)_(t[e])}}function M(e,t){return e(t)}function z(e,t,n,r,i){return e(t,n,r,i)}function O(){}var R=M,H=!1,B=!1;function A(){null===N&&null===L||(O(),F())}function W(e,t,n){if(B)return e(t,n);B=!0;try{return R(e,t,n)}finally{B=!1,A()}}var j=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,U=Object.prototype.hasOwnProperty,Q={},V={};function Y(e,t,n,r,i,o){this.acceptsBooleans=2===t||3===t||4===t,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=o}var K={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach((function(e){K[e]=new Y(e,0,!1,e,null,!1)})),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach((function(e){var t=e[0];K[t]=new Y(t,1,!1,e[1],null,!1)})),["contentEditable","draggable","spellCheck","value"].forEach((function(e){K[e]=new Y(e,2,!1,e.toLowerCase(),null,!1)})),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach((function(e){K[e]=new Y(e,2,!1,e,null,!1)})),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach((function(e){K[e]=new Y(e,3,!1,e.toLowerCase(),null,!1)})),["checked","multiple","muted","selected"].forEach((function(e){K[e]=new Y(e,3,!0,e,null,!1)})),["capture","download"].forEach((function(e){K[e]=new Y(e,4,!1,e,null,!1)})),["cols","rows","size","span"].forEach((function(e){K[e]=new Y(e,6,!1,e,null,!1)})),["rowSpan","start"].forEach((function(e){K[e]=new Y(e,5,!1,e.toLowerCase(),null,!1)}));var $=/[\-:]([a-z])/g;function G(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach((function(e){var t=e.replace($,G);K[t]=new Y(t,1,!1,e,null,!1)})),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach((function(e){var t=e.replace($,G);K[t]=new Y(t,1,!1,e,"http://www.w3.org/1999/xlink",!1)})),["xml:base","xml:lang","xml:space"].forEach((function(e){var t=e.replace($,G);K[t]=new Y(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1)})),["tabIndex","crossOrigin"].forEach((function(e){K[e]=new Y(e,1,!1,e.toLowerCase(),null,!1)})),K.xlinkHref=new Y("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0),["src","href","action","formAction"].forEach((function(e){K[e]=new Y(e,1,!1,e.toLowerCase(),null,!0)}));var Z=r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;function X(e,t,n,r){var i=K.hasOwnProperty(t)?K[t]:null;(null!==i?0===i.type:!r&&2<t.length&&("o"===t[0]||"O"===t[0])&&("n"===t[1]||"N"===t[1]))||(function(e,t,n,r){if(null==t||function(e,t,n,r){if(null!==n&&0===n.type)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return!r&&(null!==n?!n.acceptsBooleans:"data-"!==(e=e.toLowerCase().slice(0,5))&&"aria-"!==e);default:return!1}}(e,t,n,r))return!0;if(r)return!1;if(null!==n)switch(n.type){case 3:return!t;case 4:return!1===t;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}(t,n,i,r)&&(n=null),r||null===i?function(e){return!!U.call(V,e)||!U.call(Q,e)&&(j.test(e)?V[e]=!0:(Q[e]=!0,!1))}(t)&&(null===n?e.removeAttribute(t):e.setAttribute(t,""+n)):i.mustUseProperty?e[i.propertyName]=null===n?3!==i.type&&"":n:(t=i.attributeName,r=i.attributeNamespace,null===n?e.removeAttribute(t):(n=3===(i=i.type)||4===i&&!0===n?"":""+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}Z.hasOwnProperty("ReactCurrentDispatcher")||(Z.ReactCurrentDispatcher={current:null}),Z.hasOwnProperty("ReactCurrentBatchConfig")||(Z.ReactCurrentBatchConfig={suspense:null});var J=/^(.*)[\\\/]/,q="function"==typeof Symbol&&Symbol.for,ee=q?Symbol.for("react.element"):60103,te=q?Symbol.for("react.portal"):60106,ne=q?Symbol.for("react.fragment"):60107,re=q?Symbol.for("react.strict_mode"):60108,ie=q?Symbol.for("react.profiler"):60114,oe=q?Symbol.for("react.provider"):60109,ae=q?Symbol.for("react.context"):60110,le=q?Symbol.for("react.concurrent_mode"):60111,se=q?Symbol.for("react.forward_ref"):60112,ue=q?Symbol.for("react.suspense"):60113,ce=q?Symbol.for("react.suspense_list"):60120,de=q?Symbol.for("react.memo"):60115,pe=q?Symbol.for("react.lazy"):60116,fe=q?Symbol.for("react.block"):60121,he="function"==typeof Symbol&&Symbol.iterator;function me(e){return null===e||"object"!=typeof e?null:"function"==typeof(e=he&&e[he]||e["@@iterator"])?e:null}function ge(e){if(null==e)return null;if("function"==typeof e)return e.displayName||e.name||null;if("string"==typeof e)return e;switch(e){case ne:return"Fragment";case te:return"Portal";case ie:return"Profiler";case re:return"StrictMode";case ue:return"Suspense";case ce:return"SuspenseList"}if("object"==typeof e)switch(e.$$typeof){case ae:return"Context.Consumer";case oe:return"Context.Provider";case se:var t=e.render;return t=t.displayName||t.name||"",e.displayName||(""!==t?"ForwardRef("+t+")":"ForwardRef");case de:return ge(e.type);case fe:return ge(e.render);case pe:if(e=1===e._status?e._result:null)return ge(e)}return null}function ye(e){var t="";do{e:switch(e.tag){case 3:case 4:case 6:case 7:case 10:case 9:var n="";break e;default:var r=e._debugOwner,i=e._debugSource,o=ge(e.type);n=null,r&&(n=ge(r.type)),r=o,o="",i?o=" (at "+i.fileName.replace(J,"")+":"+i.lineNumber+")":n&&(o=" (created by "+n+")"),n="\n    in "+(r||"Unknown")+o}t+=n,e=e.return}while(e);return t}function ve(e){switch(typeof e){case"boolean":case"number":case"object":case"string":case"undefined":return e;default:return""}}function be(e){var t=e.type;return(e=e.nodeName)&&"input"===e.toLowerCase()&&("checkbox"===t||"radio"===t)}function xe(e){e._valueTracker||(e._valueTracker=function(e){var t=be(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=""+e[t];if(!e.hasOwnProperty(t)&&void 0!==n&&"function"==typeof n.get&&"function"==typeof n.set){var i=n.get,o=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){r=""+e,o.call(this,e)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(e){r=""+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}(e))}function Se(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r="";return e&&(r=be(e)?e.checked?"true":"false":e.value),(e=r)!==n&&(t.setValue(e),!0)}function we(e,t){var n=t.checked;return i({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:null!=n?n:e._wrapperState.initialChecked})}function ke(e,t){var n=null==t.defaultValue?"":t.defaultValue,r=null!=t.checked?t.checked:t.defaultChecked;n=ve(null!=t.value?t.value:n),e._wrapperState={initialChecked:r,initialValue:n,controlled:"checkbox"===t.type||"radio"===t.type?null!=t.checked:null!=t.value}}function Ee(e,t){null!=(t=t.checked)&&X(e,"checked",t,!1)}function Te(e,t){Ee(e,t);var n=ve(t.value),r=t.type;if(null!=n)"number"===r?(0===n&&""===e.value||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if("submit"===r||"reset"===r)return void e.removeAttribute("value");t.hasOwnProperty("value")?Ce(e,t.type,n):t.hasOwnProperty("defaultValue")&&Ce(e,t.type,ve(t.defaultValue)),null==t.checked&&null!=t.defaultChecked&&(e.defaultChecked=!!t.defaultChecked)}function Pe(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var r=t.type;if(!("submit"!==r&&"reset"!==r||void 0!==t.value&&null!==t.value))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}""!==(n=e.name)&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,""!==n&&(e.name=n)}function Ce(e,t,n){"number"===t&&e.ownerDocument.activeElement===e||(null==n?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}function Ie(e,t){return e=i({children:void 0},t),(t=function(e){var t="";return r.Children.forEach(e,(function(e){null!=e&&(t+=e)})),t}(t.children))&&(e.children=t),e}function Ne(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t["$"+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty("$"+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=""+ve(n),t=null,i=0;i<e.length;i++){if(e[i].value===n)return e[i].selected=!0,void(r&&(e[i].defaultSelected=!0));null!==t||e[i].disabled||(t=e[i])}null!==t&&(t.selected=!0)}}function Le(e,t){if(null!=t.dangerouslySetInnerHTML)throw Error(a(91));return i({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function _e(e,t){var n=t.value;if(null==n){if(n=t.children,t=t.defaultValue,null!=n){if(null!=t)throw Error(a(92));if(Array.isArray(n)){if(!(1>=n.length))throw Error(a(93));n=n[0]}t=n}null==t&&(t=""),n=t}e._wrapperState={initialValue:ve(n)}}function De(e,t){var n=ve(t.value),r=ve(t.defaultValue);null!=n&&((n=""+n)!==e.value&&(e.value=n),null==t.defaultValue&&e.defaultValue!==n&&(e.defaultValue=n)),null!=r&&(e.defaultValue=""+r)}function Fe(e){var t=e.textContent;t===e._wrapperState.initialValue&&""!==t&&null!==t&&(e.value=t)}function Me(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function ze(e,t){return null==e||"http://www.w3.org/1999/xhtml"===e?Me(t):"http://www.w3.org/2000/svg"===e&&"foreignObject"===t?"http://www.w3.org/1999/xhtml":e}var Oe,Re,He=(Re=function(e,t){if("http://www.w3.org/2000/svg"!==e.namespaceURI||"innerHTML"in e)e.innerHTML=t;else{for((Oe=Oe||document.createElement("div")).innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=Oe.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}},"undefined"!=typeof MSApp&&MSApp.execUnsafeLocalFunction?function(e,t,n,r){MSApp.execUnsafeLocalFunction((function(){return Re(e,t)}))}:Re);function Be(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&3===n.nodeType)return void(n.nodeValue=t)}e.textContent=t}function Ae(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var We={animationend:Ae("Animation","AnimationEnd"),animationiteration:Ae("Animation","AnimationIteration"),animationstart:Ae("Animation","AnimationStart"),transitionend:Ae("Transition","TransitionEnd")},je={},Ue={};function Qe(e){if(je[e])return je[e];if(!We[e])return e;var t,n=We[e];for(t in n)if(n.hasOwnProperty(t)&&t in Ue)return je[e]=n[t];return e}C&&(Ue=document.createElement("div").style,"AnimationEvent"in window||(delete We.animationend.animation,delete We.animationiteration.animation,delete We.animationstart.animation),"TransitionEvent"in window||delete We.transitionend.transition);var Ve=Qe("animationend"),Ye=Qe("animationiteration"),Ke=Qe("animationstart"),$e=Qe("transitionend"),Ge="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ze=new("function"==typeof WeakMap?WeakMap:Map);function Xe(e){var t=Ze.get(e);return void 0===t&&(t=new Map,Ze.set(e,t)),t}function Je(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do{0!=(1026&(t=e).effectTag)&&(n=t.return),e=t.return}while(e)}return 3===t.tag?n:null}function qe(e){if(13===e.tag){var t=e.memoizedState;if(null===t&&null!==(e=e.alternate)&&(t=e.memoizedState),null!==t)return t.dehydrated}return null}function et(e){if(Je(e)!==e)throw Error(a(188))}function tt(e){if(e=function(e){var t=e.alternate;if(!t){if(null===(t=Je(e)))throw Error(a(188));return t!==e?null:e}for(var n=e,r=t;;){var i=n.return;if(null===i)break;var o=i.alternate;if(null===o){if(null!==(r=i.return)){n=r;continue}break}if(i.child===o.child){for(o=i.child;o;){if(o===n)return et(i),e;if(o===r)return et(i),t;o=o.sibling}throw Error(a(188))}if(n.return!==r.return)n=i,r=o;else{for(var l=!1,s=i.child;s;){if(s===n){l=!0,n=i,r=o;break}if(s===r){l=!0,r=i,n=o;break}s=s.sibling}if(!l){for(s=o.child;s;){if(s===n){l=!0,n=o,r=i;break}if(s===r){l=!0,r=o,n=i;break}s=s.sibling}if(!l)throw Error(a(189))}}if(n.alternate!==r)throw Error(a(190))}if(3!==n.tag)throw Error(a(188));return n.stateNode.current===n?e:t}(e),!e)return null;for(var t=e;;){if(5===t.tag||6===t.tag)return t;if(t.child)t.child.return=t,t=t.child;else{if(t===e)break;for(;!t.sibling;){if(!t.return||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}}return null}function nt(e,t){if(null==t)throw Error(a(30));return null==e?t:Array.isArray(e)?Array.isArray(t)?(e.push.apply(e,t),e):(e.push(t),e):Array.isArray(t)?[e].concat(t):[e,t]}function rt(e,t,n){Array.isArray(e)?e.forEach(t,n):e&&t.call(n,e)}var it=null;function ot(e){if(e){var t=e._dispatchListeners,n=e._dispatchInstances;if(Array.isArray(t))for(var r=0;r<t.length&&!e.isPropagationStopped();r++)y(e,t[r],n[r]);else t&&y(e,t,n);e._dispatchListeners=null,e._dispatchInstances=null,e.isPersistent()||e.constructor.release(e)}}function at(e){if(null!==e&&(it=nt(it,e)),e=it,it=null,e){if(rt(e,ot),it)throw Error(a(95));if(c)throw e=d,c=!1,d=null,e}}function lt(e){return(e=e.target||e.srcElement||window).correspondingUseElement&&(e=e.correspondingUseElement),3===e.nodeType?e.parentNode:e}function st(e){if(!C)return!1;var t=(e="on"+e)in document;return t||((t=document.createElement("div")).setAttribute(e,"return;"),t="function"==typeof t[e]),t}var ut=[];function ct(e){e.topLevelType=null,e.nativeEvent=null,e.targetInst=null,e.ancestors.length=0,10>ut.length&&ut.push(e)}function dt(e,t,n,r){if(ut.length){var i=ut.pop();return i.topLevelType=e,i.eventSystemFlags=r,i.nativeEvent=t,i.targetInst=n,i}return{topLevelType:e,eventSystemFlags:r,nativeEvent:t,targetInst:n,ancestors:[]}}function pt(e){var t=e.targetInst,n=t;do{if(!n){e.ancestors.push(n);break}var r=n;if(3===r.tag)r=r.stateNode.containerInfo;else{for(;r.return;)r=r.return;r=3!==r.tag?null:r.stateNode.containerInfo}if(!r)break;5!==(t=n.tag)&&6!==t||e.ancestors.push(n),n=Nn(r)}while(n);for(n=0;n<e.ancestors.length;n++){t=e.ancestors[n];var i=lt(e.nativeEvent);r=e.topLevelType;var o=e.nativeEvent,a=e.eventSystemFlags;0===n&&(a|=64);for(var l=null,s=0;s<w.length;s++){var u=w[s];u&&(u=u.extractEvents(r,t,o,i,a))&&(l=nt(l,u))}at(l)}}function ft(e,t,n){if(!n.has(e)){switch(e){case"scroll":Kt(t,"scroll",!0);break;case"focus":case"blur":Kt(t,"focus",!0),Kt(t,"blur",!0),n.set("blur",null),n.set("focus",null);break;case"cancel":case"close":st(e)&&Kt(t,e,!0);break;case"invalid":case"submit":case"reset":break;default:-1===Ge.indexOf(e)&&Yt(e,t)}n.set(e,null)}}var ht,mt,gt,yt=!1,vt=[],bt=null,xt=null,St=null,wt=new Map,kt=new Map,Et=[],Tt="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "),Pt="focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");function Ct(e,t,n,r,i){return{blockedOn:e,topLevelType:t,eventSystemFlags:32|n,nativeEvent:i,container:r}}function It(e,t){switch(e){case"focus":case"blur":bt=null;break;case"dragenter":case"dragleave":xt=null;break;case"mouseover":case"mouseout":St=null;break;case"pointerover":case"pointerout":wt.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":kt.delete(t.pointerId)}}function Nt(e,t,n,r,i,o){return null===e||e.nativeEvent!==o?(e=Ct(t,n,r,i,o),null!==t&&null!==(t=Ln(t))&&mt(t),e):(e.eventSystemFlags|=r,e)}function Lt(e){var t=Nn(e.target);if(null!==t){var n=Je(t);if(null!==n)if(13===(t=n.tag)){if(null!==(t=qe(n)))return e.blockedOn=t,void o.unstable_runWithPriority(e.priority,(function(){gt(n)}))}else if(3===t&&n.stateNode.hydrate)return void(e.blockedOn=3===n.tag?n.stateNode.containerInfo:null)}e.blockedOn=null}function _t(e){if(null!==e.blockedOn)return!1;var t=Xt(e.topLevelType,e.eventSystemFlags,e.container,e.nativeEvent);if(null!==t){var n=Ln(t);return null!==n&&mt(n),e.blockedOn=t,!1}return!0}function Dt(e,t,n){_t(e)&&n.delete(t)}function Ft(){for(yt=!1;0<vt.length;){var e=vt[0];if(null!==e.blockedOn){null!==(e=Ln(e.blockedOn))&&ht(e);break}var t=Xt(e.topLevelType,e.eventSystemFlags,e.container,e.nativeEvent);null!==t?e.blockedOn=t:vt.shift()}null!==bt&&_t(bt)&&(bt=null),null!==xt&&_t(xt)&&(xt=null),null!==St&&_t(St)&&(St=null),wt.forEach(Dt),kt.forEach(Dt)}function Mt(e,t){e.blockedOn===t&&(e.blockedOn=null,yt||(yt=!0,o.unstable_scheduleCallback(o.unstable_NormalPriority,Ft)))}function zt(e){function t(t){return Mt(t,e)}if(0<vt.length){Mt(vt[0],e);for(var n=1;n<vt.length;n++){var r=vt[n];r.blockedOn===e&&(r.blockedOn=null)}}for(null!==bt&&Mt(bt,e),null!==xt&&Mt(xt,e),null!==St&&Mt(St,e),wt.forEach(t),kt.forEach(t),n=0;n<Et.length;n++)(r=Et[n]).blockedOn===e&&(r.blockedOn=null);for(;0<Et.length&&null===(n=Et[0]).blockedOn;)Lt(n),null===n.blockedOn&&Et.shift()}var Ot={},Rt=new Map,Ht=new Map,Bt=["abort","abort",Ve,"animationEnd",Ye,"animationIteration",Ke,"animationStart","canplay","canPlay","canplaythrough","canPlayThrough","durationchange","durationChange","emptied","emptied","encrypted","encrypted","ended","ended","error","error","gotpointercapture","gotPointerCapture","load","load","loadeddata","loadedData","loadedmetadata","loadedMetadata","loadstart","loadStart","lostpointercapture","lostPointerCapture","playing","playing","progress","progress","seeking","seeking","stalled","stalled","suspend","suspend","timeupdate","timeUpdate",$e,"transitionEnd","waiting","waiting"];function At(e,t){for(var n=0;n<e.length;n+=2){var r=e[n],i=e[n+1],o="on"+(i[0].toUpperCase()+i.slice(1));o={phasedRegistrationNames:{bubbled:o,captured:o+"Capture"},dependencies:[r],eventPriority:t},Ht.set(r,t),Rt.set(r,o),Ot[i]=o}}At("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "),0),At("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "),1),At(Bt,2);for(var Wt="change selectionchange textInput compositionstart compositionend compositionupdate".split(" "),jt=0;jt<Wt.length;jt++)Ht.set(Wt[jt],0);var Ut=o.unstable_UserBlockingPriority,Qt=o.unstable_runWithPriority,Vt=!0;function Yt(e,t){Kt(t,e,!1)}function Kt(e,t,n){var r=Ht.get(t);switch(void 0===r?2:r){case 0:r=$t.bind(null,t,1,e);break;case 1:r=Gt.bind(null,t,1,e);break;default:r=Zt.bind(null,t,1,e)}n?e.addEventListener(t,r,!0):e.addEventListener(t,r,!1)}function $t(e,t,n,r){H||O();var i=Zt,o=H;H=!0;try{z(i,e,t,n,r)}finally{(H=o)||A()}}function Gt(e,t,n,r){Qt(Ut,Zt.bind(null,e,t,n,r))}function Zt(e,t,n,r){if(Vt)if(0<vt.length&&-1<Tt.indexOf(e))e=Ct(null,e,t,n,r),vt.push(e);else{var i=Xt(e,t,n,r);if(null===i)It(e,r);else if(-1<Tt.indexOf(e))e=Ct(i,e,t,n,r),vt.push(e);else if(!function(e,t,n,r,i){switch(t){case"focus":return bt=Nt(bt,e,t,n,r,i),!0;case"dragenter":return xt=Nt(xt,e,t,n,r,i),!0;case"mouseover":return St=Nt(St,e,t,n,r,i),!0;case"pointerover":var o=i.pointerId;return wt.set(o,Nt(wt.get(o)||null,e,t,n,r,i)),!0;case"gotpointercapture":return o=i.pointerId,kt.set(o,Nt(kt.get(o)||null,e,t,n,r,i)),!0}return!1}(i,e,t,n,r)){It(e,r),e=dt(e,r,null,t);try{W(pt,e)}finally{ct(e)}}}}function Xt(e,t,n,r){if(null!==(n=Nn(n=lt(r)))){var i=Je(n);if(null===i)n=null;else{var o=i.tag;if(13===o){if(null!==(n=qe(i)))return n;n=null}else if(3===o){if(i.stateNode.hydrate)return 3===i.tag?i.stateNode.containerInfo:null;n=null}else i!==n&&(n=null)}}e=dt(e,r,n,t);try{W(pt,e)}finally{ct(e)}return null}var Jt={animationIterationCount:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},qt=["Webkit","ms","Moz","O"];function en(e,t,n){return null==t||"boolean"==typeof t||""===t?"":n||"number"!=typeof t||0===t||Jt.hasOwnProperty(e)&&Jt[e]?(""+t).trim():t+"px"}function tn(e,t){for(var n in e=e.style,t)if(t.hasOwnProperty(n)){var r=0===n.indexOf("--"),i=en(n,t[n],r);"float"===n&&(n="cssFloat"),r?e.setProperty(n,i):e[n]=i}}Object.keys(Jt).forEach((function(e){qt.forEach((function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Jt[t]=Jt[e]}))}));var nn=i({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function rn(e,t){if(t){if(nn[e]&&(null!=t.children||null!=t.dangerouslySetInnerHTML))throw Error(a(137,e,""));if(null!=t.dangerouslySetInnerHTML){if(null!=t.children)throw Error(a(60));if("object"!=typeof t.dangerouslySetInnerHTML||!("__html"in t.dangerouslySetInnerHTML))throw Error(a(61))}if(null!=t.style&&"object"!=typeof t.style)throw Error(a(62,""))}}function on(e,t){if(-1===e.indexOf("-"))return"string"==typeof t.is;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var an="http://www.w3.org/1999/xhtml";function ln(e,t){var n=Xe(e=9===e.nodeType||11===e.nodeType?e:e.ownerDocument);t=T[t];for(var r=0;r<t.length;r++)ft(t[r],e,n)}function sn(){}function un(e){if(void 0===(e=e||("undefined"!=typeof document?document:void 0)))return null;try{return e.activeElement||e.body}catch(t){return e.body}}function cn(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function dn(e,t){var n,r=cn(e);for(e=0;r;){if(3===r.nodeType){if(n=e+r.textContent.length,e<=t&&n>=t)return{node:r,offset:t-e};e=n}e:{for(;r;){if(r.nextSibling){r=r.nextSibling;break e}r=r.parentNode}r=void 0}r=cn(r)}}function pn(e,t){return!(!e||!t)&&(e===t||(!e||3!==e.nodeType)&&(t&&3===t.nodeType?pn(e,t.parentNode):"contains"in e?e.contains(t):!!e.compareDocumentPosition&&!!(16&e.compareDocumentPosition(t))))}function fn(){for(var e=window,t=un();t instanceof e.HTMLIFrameElement;){try{var n="string"==typeof t.contentWindow.location.href}catch(e){n=!1}if(!n)break;t=un((e=t.contentWindow).document)}return t}function hn(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&("input"===t&&("text"===e.type||"search"===e.type||"tel"===e.type||"url"===e.type||"password"===e.type)||"textarea"===t||"true"===e.contentEditable)}var mn="$?",gn="$!",yn=null,vn=null;function bn(e,t){switch(e){case"button":case"input":case"select":case"textarea":return!!t.autoFocus}return!1}function xn(e,t){return"textarea"===e||"option"===e||"noscript"===e||"string"==typeof t.children||"number"==typeof t.children||"object"==typeof t.dangerouslySetInnerHTML&&null!==t.dangerouslySetInnerHTML&&null!=t.dangerouslySetInnerHTML.__html}var Sn="function"==typeof setTimeout?setTimeout:void 0,wn="function"==typeof clearTimeout?clearTimeout:void 0;function kn(e){for(;null!=e;e=e.nextSibling){var t=e.nodeType;if(1===t||3===t)break}return e}function En(e){e=e.previousSibling;for(var t=0;e;){if(8===e.nodeType){var n=e.data;if("$"===n||n===gn||n===mn){if(0===t)return e;t--}else"/$"===n&&t++}e=e.previousSibling}return null}var Tn=Math.random().toString(36).slice(2),Pn="__reactInternalInstance$"+Tn,Cn="__reactEventHandlers$"+Tn,In="__reactContainere$"+Tn;function Nn(e){var t=e[Pn];if(t)return t;for(var n=e.parentNode;n;){if(t=n[In]||n[Pn]){if(n=t.alternate,null!==t.child||null!==n&&null!==n.child)for(e=En(e);null!==e;){if(n=e[Pn])return n;e=En(e)}return t}n=(e=n).parentNode}return null}function Ln(e){return!(e=e[Pn]||e[In])||5!==e.tag&&6!==e.tag&&13!==e.tag&&3!==e.tag?null:e}function _n(e){if(5===e.tag||6===e.tag)return e.stateNode;throw Error(a(33))}function Dn(e){return e[Cn]||null}function Fn(e){do{e=e.return}while(e&&5!==e.tag);return e||null}function Mn(e,t){var n=e.stateNode;if(!n)return null;var r=h(n);if(!r)return null;n=r[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(r=!("button"===(e=e.type)||"input"===e||"select"===e||"textarea"===e)),e=!r;break e;default:e=!1}if(e)return null;if(n&&"function"!=typeof n)throw Error(a(231,t,typeof n));return n}function zn(e,t,n){(t=Mn(e,n.dispatchConfig.phasedRegistrationNames[t]))&&(n._dispatchListeners=nt(n._dispatchListeners,t),n._dispatchInstances=nt(n._dispatchInstances,e))}function On(e){if(e&&e.dispatchConfig.phasedRegistrationNames){for(var t=e._targetInst,n=[];t;)n.push(t),t=Fn(t);for(t=n.length;0<t--;)zn(n[t],"captured",e);for(t=0;t<n.length;t++)zn(n[t],"bubbled",e)}}function Rn(e,t,n){e&&n&&n.dispatchConfig.registrationName&&(t=Mn(e,n.dispatchConfig.registrationName))&&(n._dispatchListeners=nt(n._dispatchListeners,t),n._dispatchInstances=nt(n._dispatchInstances,e))}function Hn(e){e&&e.dispatchConfig.registrationName&&Rn(e._targetInst,null,e)}function Bn(e){rt(e,On)}var An=null,Wn=null,jn=null;function Un(){if(jn)return jn;var e,t,n=Wn,r=n.length,i="value"in An?An.value:An.textContent,o=i.length;for(e=0;e<r&&n[e]===i[e];e++);var a=r-e;for(t=1;t<=a&&n[r-t]===i[o-t];t++);return jn=i.slice(e,1<t?1-t:void 0)}function Qn(){return!0}function Vn(){return!1}function Yn(e,t,n,r){for(var i in this.dispatchConfig=e,this._targetInst=t,this.nativeEvent=n,e=this.constructor.Interface)e.hasOwnProperty(i)&&((t=e[i])?this[i]=t(n):"target"===i?this.target=r:this[i]=n[i]);return this.isDefaultPrevented=(null!=n.defaultPrevented?n.defaultPrevented:!1===n.returnValue)?Qn:Vn,this.isPropagationStopped=Vn,this}function Kn(e,t,n,r){if(this.eventPool.length){var i=this.eventPool.pop();return this.call(i,e,t,n,r),i}return new this(e,t,n,r)}function $n(e){if(!(e instanceof this))throw Error(a(279));e.destructor(),10>this.eventPool.length&&this.eventPool.push(e)}function Gn(e){e.eventPool=[],e.getPooled=Kn,e.release=$n}i(Yn.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():"unknown"!=typeof e.returnValue&&(e.returnValue=!1),this.isDefaultPrevented=Qn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():"unknown"!=typeof e.cancelBubble&&(e.cancelBubble=!0),this.isPropagationStopped=Qn)},persist:function(){this.isPersistent=Qn},isPersistent:Vn,destructor:function(){var e,t=this.constructor.Interface;for(e in t)this[e]=null;this.nativeEvent=this._targetInst=this.dispatchConfig=null,this.isPropagationStopped=this.isDefaultPrevented=Vn,this._dispatchInstances=this._dispatchListeners=null}}),Yn.Interface={type:null,target:null,currentTarget:function(){return null},eventPhase:null,bubbles:null,cancelable:null,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:null,isTrusted:null},Yn.extend=function(e){function t(){}function n(){return r.apply(this,arguments)}var r=this;t.prototype=r.prototype;var o=new t;return i(o,n.prototype),n.prototype=o,n.prototype.constructor=n,n.Interface=i({},r.Interface,e),n.extend=r.extend,Gn(n),n},Gn(Yn);var Zn=Yn.extend({data:null}),Xn=Yn.extend({data:null}),Jn=[9,13,27,32],qn=C&&"CompositionEvent"in window,er=null;C&&"documentMode"in document&&(er=document.documentMode);var tr=C&&"TextEvent"in window&&!er,nr=C&&(!qn||er&&8<er&&11>=er),rr=String.fromCharCode(32),ir={beforeInput:{phasedRegistrationNames:{bubbled:"onBeforeInput",captured:"onBeforeInputCapture"},dependencies:["compositionend","keypress","textInput","paste"]},compositionEnd:{phasedRegistrationNames:{bubbled:"onCompositionEnd",captured:"onCompositionEndCapture"},dependencies:"blur compositionend keydown keypress keyup mousedown".split(" ")},compositionStart:{phasedRegistrationNames:{bubbled:"onCompositionStart",captured:"onCompositionStartCapture"},dependencies:"blur compositionstart keydown keypress keyup mousedown".split(" ")},compositionUpdate:{phasedRegistrationNames:{bubbled:"onCompositionUpdate",captured:"onCompositionUpdateCapture"},dependencies:"blur compositionupdate keydown keypress keyup mousedown".split(" ")}},or=!1;function ar(e,t){switch(e){case"keyup":return-1!==Jn.indexOf(t.keyCode);case"keydown":return 229!==t.keyCode;case"keypress":case"mousedown":case"blur":return!0;default:return!1}}function lr(e){return"object"==typeof(e=e.detail)&&"data"in e?e.data:null}var sr=!1,ur={eventTypes:ir,extractEvents:function(e,t,n,r){var i;if(qn)e:{switch(e){case"compositionstart":var o=ir.compositionStart;break e;case"compositionend":o=ir.compositionEnd;break e;case"compositionupdate":o=ir.compositionUpdate;break e}o=void 0}else sr?ar(e,n)&&(o=ir.compositionEnd):"keydown"===e&&229===n.keyCode&&(o=ir.compositionStart);return o?(nr&&"ko"!==n.locale&&(sr||o!==ir.compositionStart?o===ir.compositionEnd&&sr&&(i=Un()):(Wn="value"in(An=r)?An.value:An.textContent,sr=!0)),o=Zn.getPooled(o,t,n,r),(i||null!==(i=lr(n)))&&(o.data=i),Bn(o),i=o):i=null,(e=tr?function(e,t){switch(e){case"compositionend":return lr(t);case"keypress":return 32!==t.which?null:(or=!0,rr);case"textInput":return(e=t.data)===rr&&or?null:e;default:return null}}(e,n):function(e,t){if(sr)return"compositionend"===e||!qn&&ar(e,t)?(e=Un(),jn=Wn=An=null,sr=!1,e):null;switch(e){case"paste":default:return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return nr&&"ko"!==t.locale?null:t.data}}(e,n))?((t=Xn.getPooled(ir.beforeInput,t,n,r)).data=e,Bn(t)):t=null,null===i?t:null===t?i:[i,t]}},cr={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function dr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return"input"===t?!!cr[e.type]:"textarea"===t}var pr={change:{phasedRegistrationNames:{bubbled:"onChange",captured:"onChangeCapture"},dependencies:"blur change click focus input keydown keyup selectionchange".split(" ")}};function fr(e,t,n){return(e=Yn.getPooled(pr.change,e,t,n)).type="change",D(n),Bn(e),e}var hr=null,mr=null;function gr(e){at(e)}function yr(e){if(Se(_n(e)))return e}function vr(e,t){if("change"===e)return t}var br=!1;function xr(){hr&&(hr.detachEvent("onpropertychange",Sr),mr=hr=null)}function Sr(e){if("value"===e.propertyName&&yr(mr))if(e=fr(mr,e,lt(e)),H)at(e);else{H=!0;try{M(gr,e)}finally{H=!1,A()}}}function wr(e,t,n){"focus"===e?(xr(),mr=n,(hr=t).attachEvent("onpropertychange",Sr)):"blur"===e&&xr()}function kr(e){if("selectionchange"===e||"keyup"===e||"keydown"===e)return yr(mr)}function Er(e,t){if("click"===e)return yr(t)}function Tr(e,t){if("input"===e||"change"===e)return yr(t)}C&&(br=st("input")&&(!document.documentMode||9<document.documentMode));var Pr={eventTypes:pr,_isInputEventSupported:br,extractEvents:function(e,t,n,r){var i=t?_n(t):window,o=i.nodeName&&i.nodeName.toLowerCase();if("select"===o||"input"===o&&"file"===i.type)var a=vr;else if(dr(i))if(br)a=Tr;else{a=kr;var l=wr}else(o=i.nodeName)&&"input"===o.toLowerCase()&&("checkbox"===i.type||"radio"===i.type)&&(a=Er);if(a&&(a=a(e,t)))return fr(a,n,r);l&&l(e,i,t),"blur"===e&&(e=i._wrapperState)&&e.controlled&&"number"===i.type&&Ce(i,"number",i.value)}},Cr=Yn.extend({view:null,detail:null}),Ir={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Nr(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):!!(e=Ir[e])&&!!t[e]}function Lr(){return Nr}var _r=0,Dr=0,Fr=!1,Mr=!1,zr=Cr.extend({screenX:null,screenY:null,clientX:null,clientY:null,pageX:null,pageY:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,getModifierState:Lr,button:null,buttons:null,relatedTarget:function(e){return e.relatedTarget||(e.fromElement===e.srcElement?e.toElement:e.fromElement)},movementX:function(e){if("movementX"in e)return e.movementX;var t=_r;return _r=e.screenX,Fr?"mousemove"===e.type?e.screenX-t:0:(Fr=!0,0)},movementY:function(e){if("movementY"in e)return e.movementY;var t=Dr;return Dr=e.screenY,Mr?"mousemove"===e.type?e.screenY-t:0:(Mr=!0,0)}}),Or=zr.extend({pointerId:null,width:null,height:null,pressure:null,tangentialPressure:null,tiltX:null,tiltY:null,twist:null,pointerType:null,isPrimary:null}),Rr={mouseEnter:{registrationName:"onMouseEnter",dependencies:["mouseout","mouseover"]},mouseLeave:{registrationName:"onMouseLeave",dependencies:["mouseout","mouseover"]},pointerEnter:{registrationName:"onPointerEnter",dependencies:["pointerout","pointerover"]},pointerLeave:{registrationName:"onPointerLeave",dependencies:["pointerout","pointerover"]}},Hr={eventTypes:Rr,extractEvents:function(e,t,n,r,i){var o="mouseover"===e||"pointerover"===e,a="mouseout"===e||"pointerout"===e;if(o&&0==(32&i)&&(n.relatedTarget||n.fromElement)||!a&&!o)return null;if(o=r.window===r?r:(o=r.ownerDocument)?o.defaultView||o.parentWindow:window,a?(a=t,null!==(t=(t=n.relatedTarget||n.toElement)?Nn(t):null)&&(t!==Je(t)||5!==t.tag&&6!==t.tag)&&(t=null)):a=null,a===t)return null;if("mouseout"===e||"mouseover"===e)var l=zr,s=Rr.mouseLeave,u=Rr.mouseEnter,c="mouse";else"pointerout"!==e&&"pointerover"!==e||(l=Or,s=Rr.pointerLeave,u=Rr.pointerEnter,c="pointer");if(e=null==a?o:_n(a),o=null==t?o:_n(t),(s=l.getPooled(s,a,n,r)).type=c+"leave",s.target=e,s.relatedTarget=o,(n=l.getPooled(u,t,n,r)).type=c+"enter",n.target=o,n.relatedTarget=e,c=t,(r=a)&&c)e:{for(u=c,a=0,e=l=r;e;e=Fn(e))a++;for(e=0,t=u;t;t=Fn(t))e++;for(;0<a-e;)l=Fn(l),a--;for(;0<e-a;)u=Fn(u),e--;for(;a--;){if(l===u||l===u.alternate)break e;l=Fn(l),u=Fn(u)}l=null}else l=null;for(u=l,l=[];r&&r!==u&&(null===(a=r.alternate)||a!==u);)l.push(r),r=Fn(r);for(r=[];c&&c!==u&&(null===(a=c.alternate)||a!==u);)r.push(c),c=Fn(c);for(c=0;c<l.length;c++)Rn(l[c],"bubbled",s);for(c=r.length;0<c--;)Rn(r[c],"captured",n);return 0==(64&i)?[s]:[s,n]}},Br="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},Ar=Object.prototype.hasOwnProperty;function Wr(e,t){if(Br(e,t))return!0;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++)if(!Ar.call(t,n[r])||!Br(e[n[r]],t[n[r]]))return!1;return!0}var jr=C&&"documentMode"in document&&11>=document.documentMode,Ur={select:{phasedRegistrationNames:{bubbled:"onSelect",captured:"onSelectCapture"},dependencies:"blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ")}},Qr=null,Vr=null,Yr=null,Kr=!1;function $r(e,t){var n=t.window===t?t.document:9===t.nodeType?t:t.ownerDocument;return Kr||null==Qr||Qr!==un(n)?null:(n="selectionStart"in(n=Qr)&&hn(n)?{start:n.selectionStart,end:n.selectionEnd}:{anchorNode:(n=(n.ownerDocument&&n.ownerDocument.defaultView||window).getSelection()).anchorNode,anchorOffset:n.anchorOffset,focusNode:n.focusNode,focusOffset:n.focusOffset},Yr&&Wr(Yr,n)?null:(Yr=n,(e=Yn.getPooled(Ur.select,Vr,e,t)).type="select",e.target=Qr,Bn(e),e))}var Gr={eventTypes:Ur,extractEvents:function(e,t,n,r,i,o){if(!(o=!(i=o||(r.window===r?r.document:9===r.nodeType?r:r.ownerDocument)))){e:{i=Xe(i),o=T.onSelect;for(var a=0;a<o.length;a++)if(!i.has(o[a])){i=!1;break e}i=!0}o=!i}if(o)return null;switch(i=t?_n(t):window,e){case"focus":(dr(i)||"true"===i.contentEditable)&&(Qr=i,Vr=t,Yr=null);break;case"blur":Yr=Vr=Qr=null;break;case"mousedown":Kr=!0;break;case"contextmenu":case"mouseup":case"dragend":return Kr=!1,$r(n,r);case"selectionchange":if(jr)break;case"keydown":case"keyup":return $r(n,r)}return null}},Zr=Yn.extend({animationName:null,elapsedTime:null,pseudoElement:null}),Xr=Yn.extend({clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Jr=Cr.extend({relatedTarget:null});function qr(e){var t=e.keyCode;return"charCode"in e?0===(e=e.charCode)&&13===t&&(e=13):e=t,10===e&&(e=13),32<=e||13===e?e:0}var ei={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},ti={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},ni=Cr.extend({key:function(e){if(e.key){var t=ei[e.key]||e.key;if("Unidentified"!==t)return t}return"keypress"===e.type?13===(e=qr(e))?"Enter":String.fromCharCode(e):"keydown"===e.type||"keyup"===e.type?ti[e.keyCode]||"Unidentified":""},location:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,repeat:null,locale:null,getModifierState:Lr,charCode:function(e){return"keypress"===e.type?qr(e):0},keyCode:function(e){return"keydown"===e.type||"keyup"===e.type?e.keyCode:0},which:function(e){return"keypress"===e.type?qr(e):"keydown"===e.type||"keyup"===e.type?e.keyCode:0}}),ri=zr.extend({dataTransfer:null}),ii=Cr.extend({touches:null,targetTouches:null,changedTouches:null,altKey:null,metaKey:null,ctrlKey:null,shiftKey:null,getModifierState:Lr}),oi=Yn.extend({propertyName:null,elapsedTime:null,pseudoElement:null}),ai=zr.extend({deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:null,deltaMode:null}),li={eventTypes:Ot,extractEvents:function(e,t,n,r){var i=Rt.get(e);if(!i)return null;switch(e){case"keypress":if(0===qr(n))return null;case"keydown":case"keyup":e=ni;break;case"blur":case"focus":e=Jr;break;case"click":if(2===n.button)return null;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":e=zr;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":e=ri;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":e=ii;break;case Ve:case Ye:case Ke:e=Zr;break;case $e:e=oi;break;case"scroll":e=Cr;break;case"wheel":e=ai;break;case"copy":case"cut":case"paste":e=Xr;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":e=Or;break;default:e=Yn}return Bn(t=e.getPooled(i,t,n,r)),t}};if(v)throw Error(a(101));v=Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")),x(),h=Dn,m=Ln,g=_n,P({SimpleEventPlugin:li,EnterLeaveEventPlugin:Hr,ChangeEventPlugin:Pr,SelectEventPlugin:Gr,BeforeInputEventPlugin:ur});var si=[],ui=-1;function ci(e){0>ui||(e.current=si[ui],si[ui]=null,ui--)}function di(e,t){ui++,si[ui]=e.current,e.current=t}var pi={},fi={current:pi},hi={current:!1},mi=pi;function gi(e,t){var n=e.type.contextTypes;if(!n)return pi;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var i,o={};for(i in n)o[i]=t[i];return r&&((e=e.stateNode).__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=o),o}function yi(e){return null!=e.childContextTypes}function vi(){ci(hi),ci(fi)}function bi(e,t,n){if(fi.current!==pi)throw Error(a(168));di(fi,t),di(hi,n)}function xi(e,t,n){var r=e.stateNode;if(e=t.childContextTypes,"function"!=typeof r.getChildContext)return n;for(var o in r=r.getChildContext())if(!(o in e))throw Error(a(108,ge(t)||"Unknown",o));return i({},n,{},r)}function Si(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||pi,mi=fi.current,di(fi,e),di(hi,hi.current),!0}function wi(e,t,n){var r=e.stateNode;if(!r)throw Error(a(169));n?(e=xi(e,t,mi),r.__reactInternalMemoizedMergedChildContext=e,ci(hi),ci(fi),di(fi,e)):ci(hi),di(hi,n)}var ki=o.unstable_runWithPriority,Ei=o.unstable_scheduleCallback,Ti=o.unstable_cancelCallback,Pi=o.unstable_requestPaint,Ci=o.unstable_now,Ii=o.unstable_getCurrentPriorityLevel,Ni=o.unstable_ImmediatePriority,Li=o.unstable_UserBlockingPriority,_i=o.unstable_NormalPriority,Di=o.unstable_LowPriority,Fi=o.unstable_IdlePriority,Mi={},zi=o.unstable_shouldYield,Oi=void 0!==Pi?Pi:function(){},Ri=null,Hi=null,Bi=!1,Ai=Ci(),Wi=1e4>Ai?Ci:function(){return Ci()-Ai};function ji(){switch(Ii()){case Ni:return 99;case Li:return 98;case _i:return 97;case Di:return 96;case Fi:return 95;default:throw Error(a(332))}}function Ui(e){switch(e){case 99:return Ni;case 98:return Li;case 97:return _i;case 96:return Di;case 95:return Fi;default:throw Error(a(332))}}function Qi(e,t){return e=Ui(e),ki(e,t)}function Vi(e,t,n){return e=Ui(e),Ei(e,t,n)}function Yi(e){return null===Ri?(Ri=[e],Hi=Ei(Ni,$i)):Ri.push(e),Mi}function Ki(){if(null!==Hi){var e=Hi;Hi=null,Ti(e)}$i()}function $i(){if(!Bi&&null!==Ri){Bi=!0;var e=0;try{var t=Ri;Qi(99,(function(){for(;e<t.length;e++){var n=t[e];do{n=n(!0)}while(null!==n)}})),Ri=null}catch(t){throw null!==Ri&&(Ri=Ri.slice(e+1)),Ei(Ni,Ki),t}finally{Bi=!1}}}function Gi(e,t,n){return 1073741821-(1+((1073741821-e+t/10)/(n/=10)|0))*n}function Zi(e,t){if(e&&e.defaultProps)for(var n in t=i({},t),e=e.defaultProps)void 0===t[n]&&(t[n]=e[n]);return t}var Xi={current:null},Ji=null,qi=null,eo=null;function to(){eo=qi=Ji=null}function no(e){var t=Xi.current;ci(Xi),e.type._context._currentValue=t}function ro(e,t){for(;null!==e;){var n=e.alternate;if(e.childExpirationTime<t)e.childExpirationTime=t,null!==n&&n.childExpirationTime<t&&(n.childExpirationTime=t);else{if(!(null!==n&&n.childExpirationTime<t))break;n.childExpirationTime=t}e=e.return}}function io(e,t){Ji=e,eo=qi=null,null!==(e=e.dependencies)&&null!==e.firstContext&&(e.expirationTime>=t&&(Da=!0),e.firstContext=null)}function oo(e,t){if(eo!==e&&!1!==t&&0!==t)if("number"==typeof t&&1073741823!==t||(eo=e,t=1073741823),t={context:e,observedBits:t,next:null},null===qi){if(null===Ji)throw Error(a(308));qi=t,Ji.dependencies={expirationTime:0,firstContext:t,responders:null}}else qi=qi.next=t;return e._currentValue}var ao=!1;function lo(e){e.updateQueue={baseState:e.memoizedState,baseQueue:null,shared:{pending:null},effects:null}}function so(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,baseQueue:e.baseQueue,shared:e.shared,effects:e.effects})}function uo(e,t){return(e={expirationTime:e,suspenseConfig:t,tag:0,payload:null,callback:null,next:null}).next=e}function co(e,t){if(null!==(e=e.updateQueue)){var n=(e=e.shared).pending;null===n?t.next=t:(t.next=n.next,n.next=t),e.pending=t}}function po(e,t){var n=e.alternate;null!==n&&so(n,e),null===(n=(e=e.updateQueue).baseQueue)?(e.baseQueue=t.next=t,t.next=t):(t.next=n.next,n.next=t)}function fo(e,t,n,r){var o=e.updateQueue;ao=!1;var a=o.baseQueue,l=o.shared.pending;if(null!==l){if(null!==a){var s=a.next;a.next=l.next,l.next=s}a=l,o.shared.pending=null,null!==(s=e.alternate)&&null!==(s=s.updateQueue)&&(s.baseQueue=l)}if(null!==a){s=a.next;var u=o.baseState,c=0,d=null,p=null,f=null;if(null!==s)for(var h=s;;){if((l=h.expirationTime)<r){var m={expirationTime:h.expirationTime,suspenseConfig:h.suspenseConfig,tag:h.tag,payload:h.payload,callback:h.callback,next:null};null===f?(p=f=m,d=u):f=f.next=m,l>c&&(c=l)}else{null!==f&&(f=f.next={expirationTime:1073741823,suspenseConfig:h.suspenseConfig,tag:h.tag,payload:h.payload,callback:h.callback,next:null}),us(l,h.suspenseConfig);e:{var g=e,y=h;switch(l=t,m=n,y.tag){case 1:if("function"==typeof(g=y.payload)){u=g.call(m,u,l);break e}u=g;break e;case 3:g.effectTag=-4097&g.effectTag|64;case 0:if(null==(l="function"==typeof(g=y.payload)?g.call(m,u,l):g))break e;u=i({},u,l);break e;case 2:ao=!0}}null!==h.callback&&(e.effectTag|=32,null===(l=o.effects)?o.effects=[h]:l.push(h))}if(null===(h=h.next)||h===s){if(null===(l=o.shared.pending))break;h=a.next=l.next,l.next=s,o.baseQueue=a=l,o.shared.pending=null}}null===f?d=u:f.next=p,o.baseState=d,o.baseQueue=f,cs(c),e.expirationTime=c,e.memoizedState=u}}function ho(e,t,n){if(e=t.effects,t.effects=null,null!==e)for(t=0;t<e.length;t++){var r=e[t],i=r.callback;if(null!==i){if(r.callback=null,r=i,i=n,"function"!=typeof r)throw Error(a(191,r));r.call(i)}}}var mo=Z.ReactCurrentBatchConfig,go=(new r.Component).refs;function yo(e,t,n,r){n=null==(n=n(r,t=e.memoizedState))?t:i({},t,n),e.memoizedState=n,0===e.expirationTime&&(e.updateQueue.baseState=n)}var vo={isMounted:function(e){return!!(e=e._reactInternalFiber)&&Je(e)===e},enqueueSetState:function(e,t,n){e=e._reactInternalFiber;var r=Zl(),i=mo.suspense;(i=uo(r=Xl(r,e,i),i)).payload=t,null!=n&&(i.callback=n),co(e,i),Jl(e,r)},enqueueReplaceState:function(e,t,n){e=e._reactInternalFiber;var r=Zl(),i=mo.suspense;(i=uo(r=Xl(r,e,i),i)).tag=1,i.payload=t,null!=n&&(i.callback=n),co(e,i),Jl(e,r)},enqueueForceUpdate:function(e,t){e=e._reactInternalFiber;var n=Zl(),r=mo.suspense;(r=uo(n=Xl(n,e,r),r)).tag=2,null!=t&&(r.callback=t),co(e,r),Jl(e,n)}};function bo(e,t,n,r,i,o,a){return"function"==typeof(e=e.stateNode).shouldComponentUpdate?e.shouldComponentUpdate(r,o,a):!(t.prototype&&t.prototype.isPureReactComponent&&Wr(n,r)&&Wr(i,o))}function xo(e,t,n){var r=!1,i=pi,o=t.contextType;return"object"==typeof o&&null!==o?o=oo(o):(i=yi(t)?mi:fi.current,o=(r=null!=(r=t.contextTypes))?gi(e,i):pi),t=new t(n,o),e.memoizedState=null!==t.state&&void 0!==t.state?t.state:null,t.updater=vo,e.stateNode=t,t._reactInternalFiber=e,r&&((e=e.stateNode).__reactInternalMemoizedUnmaskedChildContext=i,e.__reactInternalMemoizedMaskedChildContext=o),t}function So(e,t,n,r){e=t.state,"function"==typeof t.componentWillReceiveProps&&t.componentWillReceiveProps(n,r),"function"==typeof t.UNSAFE_componentWillReceiveProps&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&vo.enqueueReplaceState(t,t.state,null)}function wo(e,t,n,r){var i=e.stateNode;i.props=n,i.state=e.memoizedState,i.refs=go,lo(e);var o=t.contextType;"object"==typeof o&&null!==o?i.context=oo(o):(o=yi(t)?mi:fi.current,i.context=gi(e,o)),fo(e,n,i,r),i.state=e.memoizedState,"function"==typeof(o=t.getDerivedStateFromProps)&&(yo(e,t,o,n),i.state=e.memoizedState),"function"==typeof t.getDerivedStateFromProps||"function"==typeof i.getSnapshotBeforeUpdate||"function"!=typeof i.UNSAFE_componentWillMount&&"function"!=typeof i.componentWillMount||(t=i.state,"function"==typeof i.componentWillMount&&i.componentWillMount(),"function"==typeof i.UNSAFE_componentWillMount&&i.UNSAFE_componentWillMount(),t!==i.state&&vo.enqueueReplaceState(i,i.state,null),fo(e,n,i,r),i.state=e.memoizedState),"function"==typeof i.componentDidMount&&(e.effectTag|=4)}var ko=Array.isArray;function Eo(e,t,n){if(null!==(e=n.ref)&&"function"!=typeof e&&"object"!=typeof e){if(n._owner){if(n=n._owner){if(1!==n.tag)throw Error(a(309));var r=n.stateNode}if(!r)throw Error(a(147,e));var i=""+e;return null!==t&&null!==t.ref&&"function"==typeof t.ref&&t.ref._stringRef===i?t.ref:(t=function(e){var t=r.refs;t===go&&(t=r.refs={}),null===e?delete t[i]:t[i]=e},t._stringRef=i,t)}if("string"!=typeof e)throw Error(a(284));if(!n._owner)throw Error(a(290,e))}return e}function To(e,t){if("textarea"!==e.type)throw Error(a(31,"[object Object]"===Object.prototype.toString.call(t)?"object with keys {"+Object.keys(t).join(", ")+"}":t,""))}function Po(e){function t(t,n){if(e){var r=t.lastEffect;null!==r?(r.nextEffect=n,t.lastEffect=n):t.firstEffect=t.lastEffect=n,n.nextEffect=null,n.effectTag=8}}function n(n,r){if(!e)return null;for(;null!==r;)t(n,r),r=r.sibling;return null}function r(e,t){for(e=new Map;null!==t;)null!==t.key?e.set(t.key,t):e.set(t.index,t),t=t.sibling;return e}function i(e,t){return(e=Ls(e,t)).index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?null!==(r=t.alternate)?(r=r.index)<n?(t.effectTag=2,n):r:(t.effectTag=2,n):n}function l(t){return e&&null===t.alternate&&(t.effectTag=2),t}function s(e,t,n,r){return null===t||6!==t.tag?((t=Fs(n,e.mode,r)).return=e,t):((t=i(t,n)).return=e,t)}function u(e,t,n,r){return null!==t&&t.elementType===n.type?((r=i(t,n.props)).ref=Eo(e,t,n),r.return=e,r):((r=_s(n.type,n.key,n.props,null,e.mode,r)).ref=Eo(e,t,n),r.return=e,r)}function c(e,t,n,r){return null===t||4!==t.tag||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?((t=Ms(n,e.mode,r)).return=e,t):((t=i(t,n.children||[])).return=e,t)}function d(e,t,n,r,o){return null===t||7!==t.tag?((t=Ds(n,e.mode,r,o)).return=e,t):((t=i(t,n)).return=e,t)}function p(e,t,n){if("string"==typeof t||"number"==typeof t)return(t=Fs(""+t,e.mode,n)).return=e,t;if("object"==typeof t&&null!==t){switch(t.$$typeof){case ee:return(n=_s(t.type,t.key,t.props,null,e.mode,n)).ref=Eo(e,null,t),n.return=e,n;case te:return(t=Ms(t,e.mode,n)).return=e,t}if(ko(t)||me(t))return(t=Ds(t,e.mode,n,null)).return=e,t;To(e,t)}return null}function f(e,t,n,r){var i=null!==t?t.key:null;if("string"==typeof n||"number"==typeof n)return null!==i?null:s(e,t,""+n,r);if("object"==typeof n&&null!==n){switch(n.$$typeof){case ee:return n.key===i?n.type===ne?d(e,t,n.props.children,r,i):u(e,t,n,r):null;case te:return n.key===i?c(e,t,n,r):null}if(ko(n)||me(n))return null!==i?null:d(e,t,n,r,null);To(e,n)}return null}function h(e,t,n,r,i){if("string"==typeof r||"number"==typeof r)return s(t,e=e.get(n)||null,""+r,i);if("object"==typeof r&&null!==r){switch(r.$$typeof){case ee:return e=e.get(null===r.key?n:r.key)||null,r.type===ne?d(t,e,r.props.children,i,r.key):u(t,e,r,i);case te:return c(t,e=e.get(null===r.key?n:r.key)||null,r,i)}if(ko(r)||me(r))return d(t,e=e.get(n)||null,r,i,null);To(t,r)}return null}function m(i,a,l,s){for(var u=null,c=null,d=a,m=a=0,g=null;null!==d&&m<l.length;m++){d.index>m?(g=d,d=null):g=d.sibling;var y=f(i,d,l[m],s);if(null===y){null===d&&(d=g);break}e&&d&&null===y.alternate&&t(i,d),a=o(y,a,m),null===c?u=y:c.sibling=y,c=y,d=g}if(m===l.length)return n(i,d),u;if(null===d){for(;m<l.length;m++)null!==(d=p(i,l[m],s))&&(a=o(d,a,m),null===c?u=d:c.sibling=d,c=d);return u}for(d=r(i,d);m<l.length;m++)null!==(g=h(d,i,m,l[m],s))&&(e&&null!==g.alternate&&d.delete(null===g.key?m:g.key),a=o(g,a,m),null===c?u=g:c.sibling=g,c=g);return e&&d.forEach((function(e){return t(i,e)})),u}function g(i,l,s,u){var c=me(s);if("function"!=typeof c)throw Error(a(150));if(null==(s=c.call(s)))throw Error(a(151));for(var d=c=null,m=l,g=l=0,y=null,v=s.next();null!==m&&!v.done;g++,v=s.next()){m.index>g?(y=m,m=null):y=m.sibling;var b=f(i,m,v.value,u);if(null===b){null===m&&(m=y);break}e&&m&&null===b.alternate&&t(i,m),l=o(b,l,g),null===d?c=b:d.sibling=b,d=b,m=y}if(v.done)return n(i,m),c;if(null===m){for(;!v.done;g++,v=s.next())null!==(v=p(i,v.value,u))&&(l=o(v,l,g),null===d?c=v:d.sibling=v,d=v);return c}for(m=r(i,m);!v.done;g++,v=s.next())null!==(v=h(m,i,g,v.value,u))&&(e&&null!==v.alternate&&m.delete(null===v.key?g:v.key),l=o(v,l,g),null===d?c=v:d.sibling=v,d=v);return e&&m.forEach((function(e){return t(i,e)})),c}return function(e,r,o,s){var u="object"==typeof o&&null!==o&&o.type===ne&&null===o.key;u&&(o=o.props.children);var c="object"==typeof o&&null!==o;if(c)switch(o.$$typeof){case ee:e:{for(c=o.key,u=r;null!==u;){if(u.key===c){if(7===u.tag){if(o.type===ne){n(e,u.sibling),(r=i(u,o.props.children)).return=e,e=r;break e}}else if(u.elementType===o.type){n(e,u.sibling),(r=i(u,o.props)).ref=Eo(e,u,o),r.return=e,e=r;break e}n(e,u);break}t(e,u),u=u.sibling}o.type===ne?((r=Ds(o.props.children,e.mode,s,o.key)).return=e,e=r):((s=_s(o.type,o.key,o.props,null,e.mode,s)).ref=Eo(e,r,o),s.return=e,e=s)}return l(e);case te:e:{for(u=o.key;null!==r;){if(r.key===u){if(4===r.tag&&r.stateNode.containerInfo===o.containerInfo&&r.stateNode.implementation===o.implementation){n(e,r.sibling),(r=i(r,o.children||[])).return=e,e=r;break e}n(e,r);break}t(e,r),r=r.sibling}(r=Ms(o,e.mode,s)).return=e,e=r}return l(e)}if("string"==typeof o||"number"==typeof o)return o=""+o,null!==r&&6===r.tag?(n(e,r.sibling),(r=i(r,o)).return=e,e=r):(n(e,r),(r=Fs(o,e.mode,s)).return=e,e=r),l(e);if(ko(o))return m(e,r,o,s);if(me(o))return g(e,r,o,s);if(c&&To(e,o),void 0===o&&!u)switch(e.tag){case 1:case 0:throw e=e.type,Error(a(152,e.displayName||e.name||"Component"))}return n(e,r)}}var Co=Po(!0),Io=Po(!1),No={},Lo={current:No},_o={current:No},Do={current:No};function Fo(e){if(e===No)throw Error(a(174));return e}function Mo(e,t){switch(di(Do,t),di(_o,e),di(Lo,No),e=t.nodeType){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:ze(null,"");break;default:t=ze(t=(e=8===e?t.parentNode:t).namespaceURI||null,e=e.tagName)}ci(Lo),di(Lo,t)}function zo(){ci(Lo),ci(_o),ci(Do)}function Oo(e){Fo(Do.current);var t=Fo(Lo.current),n=ze(t,e.type);t!==n&&(di(_o,e),di(Lo,n))}function Ro(e){_o.current===e&&(ci(Lo),ci(_o))}var Ho={current:0};function Bo(e){for(var t=e;null!==t;){if(13===t.tag){var n=t.memoizedState;if(null!==n&&(null===(n=n.dehydrated)||n.data===mn||n.data===gn))return t}else if(19===t.tag&&void 0!==t.memoizedProps.revealOrder){if(0!=(64&t.effectTag))return t}else if(null!==t.child){t.child.return=t,t=t.child;continue}if(t===e)break;for(;null===t.sibling;){if(null===t.return||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}function Ao(e,t){return{responder:e,props:t}}var Wo=Z.ReactCurrentDispatcher,jo=Z.ReactCurrentBatchConfig,Uo=0,Qo=null,Vo=null,Yo=null,Ko=!1;function $o(){throw Error(a(321))}function Go(e,t){if(null===t)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Br(e[n],t[n]))return!1;return!0}function Zo(e,t,n,r,i,o){if(Uo=o,Qo=t,t.memoizedState=null,t.updateQueue=null,t.expirationTime=0,Wo.current=null===e||null===e.memoizedState?ba:xa,e=n(r,i),t.expirationTime===Uo){o=0;do{if(t.expirationTime=0,!(25>o))throw Error(a(301));o+=1,Yo=Vo=null,t.updateQueue=null,Wo.current=Sa,e=n(r,i)}while(t.expirationTime===Uo)}if(Wo.current=va,t=null!==Vo&&null!==Vo.next,Uo=0,Yo=Vo=Qo=null,Ko=!1,t)throw Error(a(300));return e}function Xo(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return null===Yo?Qo.memoizedState=Yo=e:Yo=Yo.next=e,Yo}function Jo(){if(null===Vo){var e=Qo.alternate;e=null!==e?e.memoizedState:null}else e=Vo.next;var t=null===Yo?Qo.memoizedState:Yo.next;if(null!==t)Yo=t,Vo=e;else{if(null===e)throw Error(a(310));e={memoizedState:(Vo=e).memoizedState,baseState:Vo.baseState,baseQueue:Vo.baseQueue,queue:Vo.queue,next:null},null===Yo?Qo.memoizedState=Yo=e:Yo=Yo.next=e}return Yo}function qo(e,t){return"function"==typeof t?t(e):t}function ea(e){var t=Jo(),n=t.queue;if(null===n)throw Error(a(311));n.lastRenderedReducer=e;var r=Vo,i=r.baseQueue,o=n.pending;if(null!==o){if(null!==i){var l=i.next;i.next=o.next,o.next=l}r.baseQueue=i=o,n.pending=null}if(null!==i){i=i.next,r=r.baseState;var s=l=o=null,u=i;do{var c=u.expirationTime;if(c<Uo){var d={expirationTime:u.expirationTime,suspenseConfig:u.suspenseConfig,action:u.action,eagerReducer:u.eagerReducer,eagerState:u.eagerState,next:null};null===s?(l=s=d,o=r):s=s.next=d,c>Qo.expirationTime&&(Qo.expirationTime=c,cs(c))}else null!==s&&(s=s.next={expirationTime:1073741823,suspenseConfig:u.suspenseConfig,action:u.action,eagerReducer:u.eagerReducer,eagerState:u.eagerState,next:null}),us(c,u.suspenseConfig),r=u.eagerReducer===e?u.eagerState:e(r,u.action);u=u.next}while(null!==u&&u!==i);null===s?o=r:s.next=l,Br(r,t.memoizedState)||(Da=!0),t.memoizedState=r,t.baseState=o,t.baseQueue=s,n.lastRenderedState=r}return[t.memoizedState,n.dispatch]}function ta(e){var t=Jo(),n=t.queue;if(null===n)throw Error(a(311));n.lastRenderedReducer=e;var r=n.dispatch,i=n.pending,o=t.memoizedState;if(null!==i){n.pending=null;var l=i=i.next;do{o=e(o,l.action),l=l.next}while(l!==i);Br(o,t.memoizedState)||(Da=!0),t.memoizedState=o,null===t.baseQueue&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function na(e){var t=Xo();return"function"==typeof e&&(e=e()),t.memoizedState=t.baseState=e,e=(e=t.queue={pending:null,dispatch:null,lastRenderedReducer:qo,lastRenderedState:e}).dispatch=ya.bind(null,Qo,e),[t.memoizedState,e]}function ra(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},null===(t=Qo.updateQueue)?(t={lastEffect:null},Qo.updateQueue=t,t.lastEffect=e.next=e):null===(n=t.lastEffect)?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e),e}function ia(){return Jo().memoizedState}function oa(e,t,n,r){var i=Xo();Qo.effectTag|=e,i.memoizedState=ra(1|t,n,void 0,void 0===r?null:r)}function aa(e,t,n,r){var i=Jo();r=void 0===r?null:r;var o=void 0;if(null!==Vo){var a=Vo.memoizedState;if(o=a.destroy,null!==r&&Go(r,a.deps))return void ra(t,n,o,r)}Qo.effectTag|=e,i.memoizedState=ra(1|t,n,o,r)}function la(e,t){return oa(516,4,e,t)}function sa(e,t){return aa(516,4,e,t)}function ua(e,t){return aa(4,2,e,t)}function ca(e,t){return"function"==typeof t?(e=e(),t(e),function(){t(null)}):null!=t?(e=e(),t.current=e,function(){t.current=null}):void 0}function da(e,t,n){return n=null!=n?n.concat([e]):null,aa(4,2,ca.bind(null,t,e),n)}function pa(){}function fa(e,t){return Xo().memoizedState=[e,void 0===t?null:t],e}function ha(e,t){var n=Jo();t=void 0===t?null:t;var r=n.memoizedState;return null!==r&&null!==t&&Go(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function ma(e,t){var n=Jo();t=void 0===t?null:t;var r=n.memoizedState;return null!==r&&null!==t&&Go(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function ga(e,t,n){var r=ji();Qi(98>r?98:r,(function(){e(!0)})),Qi(97<r?97:r,(function(){var r=jo.suspense;jo.suspense=void 0===t?null:t;try{e(!1),n()}finally{jo.suspense=r}}))}function ya(e,t,n){var r=Zl(),i=mo.suspense;i={expirationTime:r=Xl(r,e,i),suspenseConfig:i,action:n,eagerReducer:null,eagerState:null,next:null};var o=t.pending;if(null===o?i.next=i:(i.next=o.next,o.next=i),t.pending=i,o=e.alternate,e===Qo||null!==o&&o===Qo)Ko=!0,i.expirationTime=Uo,Qo.expirationTime=Uo;else{if(0===e.expirationTime&&(null===o||0===o.expirationTime)&&null!==(o=t.lastRenderedReducer))try{var a=t.lastRenderedState,l=o(a,n);if(i.eagerReducer=o,i.eagerState=l,Br(l,a))return}catch(e){}Jl(e,r)}}var va={readContext:oo,useCallback:$o,useContext:$o,useEffect:$o,useImperativeHandle:$o,useLayoutEffect:$o,useMemo:$o,useReducer:$o,useRef:$o,useState:$o,useDebugValue:$o,useResponder:$o,useDeferredValue:$o,useTransition:$o},ba={readContext:oo,useCallback:fa,useContext:oo,useEffect:la,useImperativeHandle:function(e,t,n){return n=null!=n?n.concat([e]):null,oa(4,2,ca.bind(null,t,e),n)},useLayoutEffect:function(e,t){return oa(4,2,e,t)},useMemo:function(e,t){var n=Xo();return t=void 0===t?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=Xo();return t=void 0!==n?n(t):t,r.memoizedState=r.baseState=t,e=(e=r.queue={pending:null,dispatch:null,lastRenderedReducer:e,lastRenderedState:t}).dispatch=ya.bind(null,Qo,e),[r.memoizedState,e]},useRef:function(e){return e={current:e},Xo().memoizedState=e},useState:na,useDebugValue:pa,useResponder:Ao,useDeferredValue:function(e,t){var n=na(e),r=n[0],i=n[1];return la((function(){var n=jo.suspense;jo.suspense=void 0===t?null:t;try{i(e)}finally{jo.suspense=n}}),[e,t]),r},useTransition:function(e){var t=na(!1),n=t[0];return t=t[1],[fa(ga.bind(null,t,e),[t,e]),n]}},xa={readContext:oo,useCallback:ha,useContext:oo,useEffect:sa,useImperativeHandle:da,useLayoutEffect:ua,useMemo:ma,useReducer:ea,useRef:ia,useState:function(){return ea(qo)},useDebugValue:pa,useResponder:Ao,useDeferredValue:function(e,t){var n=ea(qo),r=n[0],i=n[1];return sa((function(){var n=jo.suspense;jo.suspense=void 0===t?null:t;try{i(e)}finally{jo.suspense=n}}),[e,t]),r},useTransition:function(e){var t=ea(qo),n=t[0];return t=t[1],[ha(ga.bind(null,t,e),[t,e]),n]}},Sa={readContext:oo,useCallback:ha,useContext:oo,useEffect:sa,useImperativeHandle:da,useLayoutEffect:ua,useMemo:ma,useReducer:ta,useRef:ia,useState:function(){return ta(qo)},useDebugValue:pa,useResponder:Ao,useDeferredValue:function(e,t){var n=ta(qo),r=n[0],i=n[1];return sa((function(){var n=jo.suspense;jo.suspense=void 0===t?null:t;try{i(e)}finally{jo.suspense=n}}),[e,t]),r},useTransition:function(e){var t=ta(qo),n=t[0];return t=t[1],[ha(ga.bind(null,t,e),[t,e]),n]}},wa=null,ka=null,Ea=!1;function Ta(e,t){var n=Is(5,null,null,0);n.elementType="DELETED",n.type="DELETED",n.stateNode=t,n.return=e,n.effectTag=8,null!==e.lastEffect?(e.lastEffect.nextEffect=n,e.lastEffect=n):e.firstEffect=e.lastEffect=n}function Pa(e,t){switch(e.tag){case 5:var n=e.type;return null!==(t=1!==t.nodeType||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t)&&(e.stateNode=t,!0);case 6:return null!==(t=""===e.pendingProps||3!==t.nodeType?null:t)&&(e.stateNode=t,!0);default:return!1}}function Ca(e){if(Ea){var t=ka;if(t){var n=t;if(!Pa(e,t)){if(!(t=kn(n.nextSibling))||!Pa(e,t))return e.effectTag=-1025&e.effectTag|2,Ea=!1,void(wa=e);Ta(wa,n)}wa=e,ka=kn(t.firstChild)}else e.effectTag=-1025&e.effectTag|2,Ea=!1,wa=e}}function Ia(e){for(e=e.return;null!==e&&5!==e.tag&&3!==e.tag&&13!==e.tag;)e=e.return;wa=e}function Na(e){if(e!==wa)return!1;if(!Ea)return Ia(e),Ea=!0,!1;var t=e.type;if(5!==e.tag||"head"!==t&&"body"!==t&&!xn(t,e.memoizedProps))for(t=ka;t;)Ta(e,t),t=kn(t.nextSibling);if(Ia(e),13===e.tag){if(!(e=null!==(e=e.memoizedState)?e.dehydrated:null))throw Error(a(317));e:{for(e=e.nextSibling,t=0;e;){if(8===e.nodeType){var n=e.data;if("/$"===n){if(0===t){ka=kn(e.nextSibling);break e}t--}else"$"!==n&&n!==gn&&n!==mn||t++}e=e.nextSibling}ka=null}}else ka=wa?kn(e.stateNode.nextSibling):null;return!0}function La(){ka=wa=null,Ea=!1}var _a=Z.ReactCurrentOwner,Da=!1;function Fa(e,t,n,r){t.child=null===e?Io(t,null,n,r):Co(t,e.child,n,r)}function Ma(e,t,n,r,i){n=n.render;var o=t.ref;return io(t,i),r=Zo(e,t,n,r,o,i),null===e||Da?(t.effectTag|=1,Fa(e,t,r,i),t.child):(t.updateQueue=e.updateQueue,t.effectTag&=-517,e.expirationTime<=i&&(e.expirationTime=0),Za(e,t,i))}function za(e,t,n,r,i,o){if(null===e){var a=n.type;return"function"!=typeof a||Ns(a)||void 0!==a.defaultProps||null!==n.compare||void 0!==n.defaultProps?((e=_s(n.type,null,r,null,t.mode,o)).ref=t.ref,e.return=t,t.child=e):(t.tag=15,t.type=a,Oa(e,t,a,r,i,o))}return a=e.child,i<o&&(i=a.memoizedProps,(n=null!==(n=n.compare)?n:Wr)(i,r)&&e.ref===t.ref)?Za(e,t,o):(t.effectTag|=1,(e=Ls(a,r)).ref=t.ref,e.return=t,t.child=e)}function Oa(e,t,n,r,i,o){return null!==e&&Wr(e.memoizedProps,r)&&e.ref===t.ref&&(Da=!1,i<o)?(t.expirationTime=e.expirationTime,Za(e,t,o)):Ha(e,t,n,r,o)}function Ra(e,t){var n=t.ref;(null===e&&null!==n||null!==e&&e.ref!==n)&&(t.effectTag|=128)}function Ha(e,t,n,r,i){var o=yi(n)?mi:fi.current;return o=gi(t,o),io(t,i),n=Zo(e,t,n,r,o,i),null===e||Da?(t.effectTag|=1,Fa(e,t,n,i),t.child):(t.updateQueue=e.updateQueue,t.effectTag&=-517,e.expirationTime<=i&&(e.expirationTime=0),Za(e,t,i))}function Ba(e,t,n,r,i){if(yi(n)){var o=!0;Si(t)}else o=!1;if(io(t,i),null===t.stateNode)null!==e&&(e.alternate=null,t.alternate=null,t.effectTag|=2),xo(t,n,r),wo(t,n,r,i),r=!0;else if(null===e){var a=t.stateNode,l=t.memoizedProps;a.props=l;var s=a.context,u=n.contextType;u="object"==typeof u&&null!==u?oo(u):gi(t,u=yi(n)?mi:fi.current);var c=n.getDerivedStateFromProps,d="function"==typeof c||"function"==typeof a.getSnapshotBeforeUpdate;d||"function"!=typeof a.UNSAFE_componentWillReceiveProps&&"function"!=typeof a.componentWillReceiveProps||(l!==r||s!==u)&&So(t,a,r,u),ao=!1;var p=t.memoizedState;a.state=p,fo(t,r,a,i),s=t.memoizedState,l!==r||p!==s||hi.current||ao?("function"==typeof c&&(yo(t,n,c,r),s=t.memoizedState),(l=ao||bo(t,n,l,r,p,s,u))?(d||"function"!=typeof a.UNSAFE_componentWillMount&&"function"!=typeof a.componentWillMount||("function"==typeof a.componentWillMount&&a.componentWillMount(),"function"==typeof a.UNSAFE_componentWillMount&&a.UNSAFE_componentWillMount()),"function"==typeof a.componentDidMount&&(t.effectTag|=4)):("function"==typeof a.componentDidMount&&(t.effectTag|=4),t.memoizedProps=r,t.memoizedState=s),a.props=r,a.state=s,a.context=u,r=l):("function"==typeof a.componentDidMount&&(t.effectTag|=4),r=!1)}else a=t.stateNode,so(e,t),l=t.memoizedProps,a.props=t.type===t.elementType?l:Zi(t.type,l),s=a.context,u="object"==typeof(u=n.contextType)&&null!==u?oo(u):gi(t,u=yi(n)?mi:fi.current),(d="function"==typeof(c=n.getDerivedStateFromProps)||"function"==typeof a.getSnapshotBeforeUpdate)||"function"!=typeof a.UNSAFE_componentWillReceiveProps&&"function"!=typeof a.componentWillReceiveProps||(l!==r||s!==u)&&So(t,a,r,u),ao=!1,s=t.memoizedState,a.state=s,fo(t,r,a,i),p=t.memoizedState,l!==r||s!==p||hi.current||ao?("function"==typeof c&&(yo(t,n,c,r),p=t.memoizedState),(c=ao||bo(t,n,l,r,s,p,u))?(d||"function"!=typeof a.UNSAFE_componentWillUpdate&&"function"!=typeof a.componentWillUpdate||("function"==typeof a.componentWillUpdate&&a.componentWillUpdate(r,p,u),"function"==typeof a.UNSAFE_componentWillUpdate&&a.UNSAFE_componentWillUpdate(r,p,u)),"function"==typeof a.componentDidUpdate&&(t.effectTag|=4),"function"==typeof a.getSnapshotBeforeUpdate&&(t.effectTag|=256)):("function"!=typeof a.componentDidUpdate||l===e.memoizedProps&&s===e.memoizedState||(t.effectTag|=4),"function"!=typeof a.getSnapshotBeforeUpdate||l===e.memoizedProps&&s===e.memoizedState||(t.effectTag|=256),t.memoizedProps=r,t.memoizedState=p),a.props=r,a.state=p,a.context=u,r=c):("function"!=typeof a.componentDidUpdate||l===e.memoizedProps&&s===e.memoizedState||(t.effectTag|=4),"function"!=typeof a.getSnapshotBeforeUpdate||l===e.memoizedProps&&s===e.memoizedState||(t.effectTag|=256),r=!1);return Aa(e,t,n,r,o,i)}function Aa(e,t,n,r,i,o){Ra(e,t);var a=0!=(64&t.effectTag);if(!r&&!a)return i&&wi(t,n,!1),Za(e,t,o);r=t.stateNode,_a.current=t;var l=a&&"function"!=typeof n.getDerivedStateFromError?null:r.render();return t.effectTag|=1,null!==e&&a?(t.child=Co(t,e.child,null,o),t.child=Co(t,null,l,o)):Fa(e,t,l,o),t.memoizedState=r.state,i&&wi(t,n,!0),t.child}function Wa(e){var t=e.stateNode;t.pendingContext?bi(0,t.pendingContext,t.pendingContext!==t.context):t.context&&bi(0,t.context,!1),Mo(e,t.containerInfo)}var ja,Ua,Qa,Va={dehydrated:null,retryTime:0};function Ya(e,t,n){var r,i=t.mode,o=t.pendingProps,a=Ho.current,l=!1;if((r=0!=(64&t.effectTag))||(r=0!=(2&a)&&(null===e||null!==e.memoizedState)),r?(l=!0,t.effectTag&=-65):null!==e&&null===e.memoizedState||void 0===o.fallback||!0===o.unstable_avoidThisFallback||(a|=1),di(Ho,1&a),null===e){if(void 0!==o.fallback&&Ca(t),l){if(l=o.fallback,(o=Ds(null,i,0,null)).return=t,0==(2&t.mode))for(e=null!==t.memoizedState?t.child.child:t.child,o.child=e;null!==e;)e.return=o,e=e.sibling;return(n=Ds(l,i,n,null)).return=t,o.sibling=n,t.memoizedState=Va,t.child=o,n}return i=o.children,t.memoizedState=null,t.child=Io(t,null,i,n)}if(null!==e.memoizedState){if(i=(e=e.child).sibling,l){if(o=o.fallback,(n=Ls(e,e.pendingProps)).return=t,0==(2&t.mode)&&(l=null!==t.memoizedState?t.child.child:t.child)!==e.child)for(n.child=l;null!==l;)l.return=n,l=l.sibling;return(i=Ls(i,o)).return=t,n.sibling=i,n.childExpirationTime=0,t.memoizedState=Va,t.child=n,i}return n=Co(t,e.child,o.children,n),t.memoizedState=null,t.child=n}if(e=e.child,l){if(l=o.fallback,(o=Ds(null,i,0,null)).return=t,o.child=e,null!==e&&(e.return=o),0==(2&t.mode))for(e=null!==t.memoizedState?t.child.child:t.child,o.child=e;null!==e;)e.return=o,e=e.sibling;return(n=Ds(l,i,n,null)).return=t,o.sibling=n,n.effectTag|=2,o.childExpirationTime=0,t.memoizedState=Va,t.child=o,n}return t.memoizedState=null,t.child=Co(t,e,o.children,n)}function Ka(e,t){e.expirationTime<t&&(e.expirationTime=t);var n=e.alternate;null!==n&&n.expirationTime<t&&(n.expirationTime=t),ro(e.return,t)}function $a(e,t,n,r,i,o){var a=e.memoizedState;null===a?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailExpiration:0,tailMode:i,lastEffect:o}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=r,a.tail=n,a.tailExpiration=0,a.tailMode=i,a.lastEffect=o)}function Ga(e,t,n){var r=t.pendingProps,i=r.revealOrder,o=r.tail;if(Fa(e,t,r.children,n),0!=(2&(r=Ho.current)))r=1&r|2,t.effectTag|=64;else{if(null!==e&&0!=(64&e.effectTag))e:for(e=t.child;null!==e;){if(13===e.tag)null!==e.memoizedState&&Ka(e,n);else if(19===e.tag)Ka(e,n);else if(null!==e.child){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;null===e.sibling;){if(null===e.return||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(di(Ho,r),0==(2&t.mode))t.memoizedState=null;else switch(i){case"forwards":for(n=t.child,i=null;null!==n;)null!==(e=n.alternate)&&null===Bo(e)&&(i=n),n=n.sibling;null===(n=i)?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),$a(t,!1,i,n,o,t.lastEffect);break;case"backwards":for(n=null,i=t.child,t.child=null;null!==i;){if(null!==(e=i.alternate)&&null===Bo(e)){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}$a(t,!0,n,null,o,t.lastEffect);break;case"together":$a(t,!1,null,null,void 0,t.lastEffect);break;default:t.memoizedState=null}return t.child}function Za(e,t,n){null!==e&&(t.dependencies=e.dependencies);var r=t.expirationTime;if(0!==r&&cs(r),t.childExpirationTime<n)return null;if(null!==e&&t.child!==e.child)throw Error(a(153));if(null!==t.child){for(n=Ls(e=t.child,e.pendingProps),t.child=n,n.return=t;null!==e.sibling;)e=e.sibling,(n=n.sibling=Ls(e,e.pendingProps)).return=t;n.sibling=null}return t.child}function Xa(e,t){switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;null!==t;)null!==t.alternate&&(n=t),t=t.sibling;null===n?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var r=null;null!==n;)null!==n.alternate&&(r=n),n=n.sibling;null===r?t||null===e.tail?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Ja(e,t,n){var r=t.pendingProps;switch(t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return null;case 1:case 17:return yi(t.type)&&vi(),null;case 3:return zo(),ci(hi),ci(fi),(n=t.stateNode).pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),null!==e&&null!==e.child||!Na(t)||(t.effectTag|=4),null;case 5:Ro(t),n=Fo(Do.current);var o=t.type;if(null!==e&&null!=t.stateNode)Ua(e,t,o,r,n),e.ref!==t.ref&&(t.effectTag|=128);else{if(!r){if(null===t.stateNode)throw Error(a(166));return null}if(e=Fo(Lo.current),Na(t)){r=t.stateNode,o=t.type;var l=t.memoizedProps;switch(r[Pn]=t,r[Cn]=l,o){case"iframe":case"object":case"embed":Yt("load",r);break;case"video":case"audio":for(e=0;e<Ge.length;e++)Yt(Ge[e],r);break;case"source":Yt("error",r);break;case"img":case"image":case"link":Yt("error",r),Yt("load",r);break;case"form":Yt("reset",r),Yt("submit",r);break;case"details":Yt("toggle",r);break;case"input":ke(r,l),Yt("invalid",r),ln(n,"onChange");break;case"select":r._wrapperState={wasMultiple:!!l.multiple},Yt("invalid",r),ln(n,"onChange");break;case"textarea":_e(r,l),Yt("invalid",r),ln(n,"onChange")}for(var s in rn(o,l),e=null,l)if(l.hasOwnProperty(s)){var u=l[s];"children"===s?"string"==typeof u?r.textContent!==u&&(e=["children",u]):"number"==typeof u&&r.textContent!==""+u&&(e=["children",""+u]):E.hasOwnProperty(s)&&null!=u&&ln(n,s)}switch(o){case"input":xe(r),Pe(r,l,!0);break;case"textarea":xe(r),Fe(r);break;case"select":case"option":break;default:"function"==typeof l.onClick&&(r.onclick=sn)}n=e,t.updateQueue=n,null!==n&&(t.effectTag|=4)}else{switch(s=9===n.nodeType?n:n.ownerDocument,e===an&&(e=Me(o)),e===an?"script"===o?((e=s.createElement("div")).innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):"string"==typeof r.is?e=s.createElement(o,{is:r.is}):(e=s.createElement(o),"select"===o&&(s=e,r.multiple?s.multiple=!0:r.size&&(s.size=r.size))):e=s.createElementNS(e,o),e[Pn]=t,e[Cn]=r,ja(e,t),t.stateNode=e,s=on(o,r),o){case"iframe":case"object":case"embed":Yt("load",e),u=r;break;case"video":case"audio":for(u=0;u<Ge.length;u++)Yt(Ge[u],e);u=r;break;case"source":Yt("error",e),u=r;break;case"img":case"image":case"link":Yt("error",e),Yt("load",e),u=r;break;case"form":Yt("reset",e),Yt("submit",e),u=r;break;case"details":Yt("toggle",e),u=r;break;case"input":ke(e,r),u=we(e,r),Yt("invalid",e),ln(n,"onChange");break;case"option":u=Ie(e,r);break;case"select":e._wrapperState={wasMultiple:!!r.multiple},u=i({},r,{value:void 0}),Yt("invalid",e),ln(n,"onChange");break;case"textarea":_e(e,r),u=Le(e,r),Yt("invalid",e),ln(n,"onChange");break;default:u=r}rn(o,u);var c=u;for(l in c)if(c.hasOwnProperty(l)){var d=c[l];"style"===l?tn(e,d):"dangerouslySetInnerHTML"===l?null!=(d=d?d.__html:void 0)&&He(e,d):"children"===l?"string"==typeof d?("textarea"!==o||""!==d)&&Be(e,d):"number"==typeof d&&Be(e,""+d):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&(E.hasOwnProperty(l)?null!=d&&ln(n,l):null!=d&&X(e,l,d,s))}switch(o){case"input":xe(e),Pe(e,r,!1);break;case"textarea":xe(e),Fe(e);break;case"option":null!=r.value&&e.setAttribute("value",""+ve(r.value));break;case"select":e.multiple=!!r.multiple,null!=(n=r.value)?Ne(e,!!r.multiple,n,!1):null!=r.defaultValue&&Ne(e,!!r.multiple,r.defaultValue,!0);break;default:"function"==typeof u.onClick&&(e.onclick=sn)}bn(o,r)&&(t.effectTag|=4)}null!==t.ref&&(t.effectTag|=128)}return null;case 6:if(e&&null!=t.stateNode)Qa(0,t,e.memoizedProps,r);else{if("string"!=typeof r&&null===t.stateNode)throw Error(a(166));n=Fo(Do.current),Fo(Lo.current),Na(t)?(n=t.stateNode,r=t.memoizedProps,n[Pn]=t,n.nodeValue!==r&&(t.effectTag|=4)):((n=(9===n.nodeType?n:n.ownerDocument).createTextNode(r))[Pn]=t,t.stateNode=n)}return null;case 13:return ci(Ho),r=t.memoizedState,0!=(64&t.effectTag)?(t.expirationTime=n,t):(n=null!==r,r=!1,null===e?void 0!==t.memoizedProps.fallback&&Na(t):(r=null!==(o=e.memoizedState),n||null===o||null!==(o=e.child.sibling)&&(null!==(l=t.firstEffect)?(t.firstEffect=o,o.nextEffect=l):(t.firstEffect=t.lastEffect=o,o.nextEffect=null),o.effectTag=8)),n&&!r&&0!=(2&t.mode)&&(null===e&&!0!==t.memoizedProps.unstable_avoidThisFallback||0!=(1&Ho.current)?_l===El&&(_l=Tl):(_l!==El&&_l!==Tl||(_l=Pl),0!==Ol&&null!==Il&&(Rs(Il,Ll),Hs(Il,Ol)))),(n||r)&&(t.effectTag|=4),null);case 4:return zo(),null;case 10:return no(t),null;case 19:if(ci(Ho),null===(r=t.memoizedState))return null;if(o=0!=(64&t.effectTag),null===(l=r.rendering)){if(o)Xa(r,!1);else if(_l!==El||null!==e&&0!=(64&e.effectTag))for(l=t.child;null!==l;){if(null!==(e=Bo(l))){for(t.effectTag|=64,Xa(r,!1),null!==(o=e.updateQueue)&&(t.updateQueue=o,t.effectTag|=4),null===r.lastEffect&&(t.firstEffect=null),t.lastEffect=r.lastEffect,r=t.child;null!==r;)l=n,(o=r).effectTag&=2,o.nextEffect=null,o.firstEffect=null,o.lastEffect=null,null===(e=o.alternate)?(o.childExpirationTime=0,o.expirationTime=l,o.child=null,o.memoizedProps=null,o.memoizedState=null,o.updateQueue=null,o.dependencies=null):(o.childExpirationTime=e.childExpirationTime,o.expirationTime=e.expirationTime,o.child=e.child,o.memoizedProps=e.memoizedProps,o.memoizedState=e.memoizedState,o.updateQueue=e.updateQueue,l=e.dependencies,o.dependencies=null===l?null:{expirationTime:l.expirationTime,firstContext:l.firstContext,responders:l.responders}),r=r.sibling;return di(Ho,1&Ho.current|2),t.child}l=l.sibling}}else{if(!o)if(null!==(e=Bo(l))){if(t.effectTag|=64,o=!0,null!==(n=e.updateQueue)&&(t.updateQueue=n,t.effectTag|=4),Xa(r,!0),null===r.tail&&"hidden"===r.tailMode&&!l.alternate)return null!==(t=t.lastEffect=r.lastEffect)&&(t.nextEffect=null),null}else 2*Wi()-r.renderingStartTime>r.tailExpiration&&1<n&&(t.effectTag|=64,o=!0,Xa(r,!1),t.expirationTime=t.childExpirationTime=n-1);r.isBackwards?(l.sibling=t.child,t.child=l):(null!==(n=r.last)?n.sibling=l:t.child=l,r.last=l)}return null!==r.tail?(0===r.tailExpiration&&(r.tailExpiration=Wi()+500),n=r.tail,r.rendering=n,r.tail=n.sibling,r.lastEffect=t.lastEffect,r.renderingStartTime=Wi(),n.sibling=null,t=Ho.current,di(Ho,o?1&t|2:1&t),n):null}throw Error(a(156,t.tag))}function qa(e){switch(e.tag){case 1:yi(e.type)&&vi();var t=e.effectTag;return 4096&t?(e.effectTag=-4097&t|64,e):null;case 3:if(zo(),ci(hi),ci(fi),0!=(64&(t=e.effectTag)))throw Error(a(285));return e.effectTag=-4097&t|64,e;case 5:return Ro(e),null;case 13:return ci(Ho),4096&(t=e.effectTag)?(e.effectTag=-4097&t|64,e):null;case 19:return ci(Ho),null;case 4:return zo(),null;case 10:return no(e),null;default:return null}}function el(e,t){return{value:e,source:t,stack:ye(t)}}ja=function(e,t){for(var n=t.child;null!==n;){if(5===n.tag||6===n.tag)e.appendChild(n.stateNode);else if(4!==n.tag&&null!==n.child){n.child.return=n,n=n.child;continue}if(n===t)break;for(;null===n.sibling;){if(null===n.return||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}},Ua=function(e,t,n,r,o){var a=e.memoizedProps;if(a!==r){var l,s,u=t.stateNode;switch(Fo(Lo.current),e=null,n){case"input":a=we(u,a),r=we(u,r),e=[];break;case"option":a=Ie(u,a),r=Ie(u,r),e=[];break;case"select":a=i({},a,{value:void 0}),r=i({},r,{value:void 0}),e=[];break;case"textarea":a=Le(u,a),r=Le(u,r),e=[];break;default:"function"!=typeof a.onClick&&"function"==typeof r.onClick&&(u.onclick=sn)}for(l in rn(n,r),n=null,a)if(!r.hasOwnProperty(l)&&a.hasOwnProperty(l)&&null!=a[l])if("style"===l)for(s in u=a[l])u.hasOwnProperty(s)&&(n||(n={}),n[s]="");else"dangerouslySetInnerHTML"!==l&&"children"!==l&&"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&(E.hasOwnProperty(l)?e||(e=[]):(e=e||[]).push(l,null));for(l in r){var c=r[l];if(u=null!=a?a[l]:void 0,r.hasOwnProperty(l)&&c!==u&&(null!=c||null!=u))if("style"===l)if(u){for(s in u)!u.hasOwnProperty(s)||c&&c.hasOwnProperty(s)||(n||(n={}),n[s]="");for(s in c)c.hasOwnProperty(s)&&u[s]!==c[s]&&(n||(n={}),n[s]=c[s])}else n||(e||(e=[]),e.push(l,n)),n=c;else"dangerouslySetInnerHTML"===l?(c=c?c.__html:void 0,u=u?u.__html:void 0,null!=c&&u!==c&&(e=e||[]).push(l,c)):"children"===l?u===c||"string"!=typeof c&&"number"!=typeof c||(e=e||[]).push(l,""+c):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&(E.hasOwnProperty(l)?(null!=c&&ln(o,l),e||u===c||(e=[])):(e=e||[]).push(l,c))}n&&(e=e||[]).push("style",n),o=e,(t.updateQueue=o)&&(t.effectTag|=4)}},Qa=function(e,t,n,r){n!==r&&(t.effectTag|=4)};var tl="function"==typeof WeakSet?WeakSet:Set;function nl(e,t){var n=t.source,r=t.stack;null===r&&null!==n&&(r=ye(n)),null!==n&&ge(n.type),t=t.value,null!==e&&1===e.tag&&ge(e.type);try{console.error(t)}catch(e){setTimeout((function(){throw e}))}}function rl(e){var t=e.ref;if(null!==t)if("function"==typeof t)try{t(null)}catch(t){ws(e,t)}else t.current=null}function il(e,t){switch(t.tag){case 0:case 11:case 15:case 22:case 3:case 5:case 6:case 4:case 17:return;case 1:if(256&t.effectTag&&null!==e){var n=e.memoizedProps,r=e.memoizedState;t=(e=t.stateNode).getSnapshotBeforeUpdate(t.elementType===t.type?n:Zi(t.type,n),r),e.__reactInternalSnapshotBeforeUpdate=t}return}throw Error(a(163))}function ol(e,t){if(null!==(t=null!==(t=t.updateQueue)?t.lastEffect:null)){var n=t=t.next;do{if((n.tag&e)===e){var r=n.destroy;n.destroy=void 0,void 0!==r&&r()}n=n.next}while(n!==t)}}function al(e,t){if(null!==(t=null!==(t=t.updateQueue)?t.lastEffect:null)){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function ll(e,t,n){switch(n.tag){case 0:case 11:case 15:case 22:return void al(3,n);case 1:if(e=n.stateNode,4&n.effectTag)if(null===t)e.componentDidMount();else{var r=n.elementType===n.type?t.memoizedProps:Zi(n.type,t.memoizedProps);e.componentDidUpdate(r,t.memoizedState,e.__reactInternalSnapshotBeforeUpdate)}return void(null!==(t=n.updateQueue)&&ho(n,t,e));case 3:if(null!==(t=n.updateQueue)){if(e=null,null!==n.child)switch(n.child.tag){case 5:case 1:e=n.child.stateNode}ho(n,t,e)}return;case 5:return e=n.stateNode,void(null===t&&4&n.effectTag&&bn(n.type,n.memoizedProps)&&e.focus());case 6:case 4:case 12:case 19:case 17:case 20:case 21:return;case 13:return void(null===n.memoizedState&&(n=n.alternate,null!==n&&(n=n.memoizedState,null!==n&&(n=n.dehydrated,null!==n&&zt(n)))))}throw Error(a(163))}function sl(e,t,n){switch("function"==typeof Ps&&Ps(t),t.tag){case 0:case 11:case 14:case 15:case 22:if(null!==(e=t.updateQueue)&&null!==(e=e.lastEffect)){var r=e.next;Qi(97<n?97:n,(function(){var e=r;do{var n=e.destroy;if(void 0!==n){var i=t;try{n()}catch(e){ws(i,e)}}e=e.next}while(e!==r)}))}break;case 1:rl(t),"function"==typeof(n=t.stateNode).componentWillUnmount&&function(e,t){try{t.props=e.memoizedProps,t.state=e.memoizedState,t.componentWillUnmount()}catch(t){ws(e,t)}}(t,n);break;case 5:rl(t);break;case 4:hl(e,t,n)}}function ul(e){var t=e.alternate;e.return=null,e.child=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.alternate=null,e.firstEffect=null,e.lastEffect=null,e.pendingProps=null,e.memoizedProps=null,e.stateNode=null,null!==t&&ul(t)}function cl(e){return 5===e.tag||3===e.tag||4===e.tag}function dl(e){e:{for(var t=e.return;null!==t;){if(cl(t)){var n=t;break e}t=t.return}throw Error(a(160))}switch(t=n.stateNode,n.tag){case 5:var r=!1;break;case 3:case 4:t=t.containerInfo,r=!0;break;default:throw Error(a(161))}16&n.effectTag&&(Be(t,""),n.effectTag&=-17);e:t:for(n=e;;){for(;null===n.sibling;){if(null===n.return||cl(n.return)){n=null;break e}n=n.return}for(n.sibling.return=n.return,n=n.sibling;5!==n.tag&&6!==n.tag&&18!==n.tag;){if(2&n.effectTag)continue t;if(null===n.child||4===n.tag)continue t;n.child.return=n,n=n.child}if(!(2&n.effectTag)){n=n.stateNode;break e}}r?pl(e,n,t):fl(e,n,t)}function pl(e,t,n){var r=e.tag,i=5===r||6===r;if(i)e=i?e.stateNode:e.stateNode.instance,t?8===n.nodeType?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(8===n.nodeType?(t=n.parentNode).insertBefore(e,n):(t=n).appendChild(e),null!=(n=n._reactRootContainer)||null!==t.onclick||(t.onclick=sn));else if(4!==r&&null!==(e=e.child))for(pl(e,t,n),e=e.sibling;null!==e;)pl(e,t,n),e=e.sibling}function fl(e,t,n){var r=e.tag,i=5===r||6===r;if(i)e=i?e.stateNode:e.stateNode.instance,t?n.insertBefore(e,t):n.appendChild(e);else if(4!==r&&null!==(e=e.child))for(fl(e,t,n),e=e.sibling;null!==e;)fl(e,t,n),e=e.sibling}function hl(e,t,n){for(var r,i,o=t,l=!1;;){if(!l){l=o.return;e:for(;;){if(null===l)throw Error(a(160));switch(r=l.stateNode,l.tag){case 5:i=!1;break e;case 3:case 4:r=r.containerInfo,i=!0;break e}l=l.return}l=!0}if(5===o.tag||6===o.tag){e:for(var s=e,u=o,c=n,d=u;;)if(sl(s,d,c),null!==d.child&&4!==d.tag)d.child.return=d,d=d.child;else{if(d===u)break e;for(;null===d.sibling;){if(null===d.return||d.return===u)break e;d=d.return}d.sibling.return=d.return,d=d.sibling}i?(s=r,u=o.stateNode,8===s.nodeType?s.parentNode.removeChild(u):s.removeChild(u)):r.removeChild(o.stateNode)}else if(4===o.tag){if(null!==o.child){r=o.stateNode.containerInfo,i=!0,o.child.return=o,o=o.child;continue}}else if(sl(e,o,n),null!==o.child){o.child.return=o,o=o.child;continue}if(o===t)break;for(;null===o.sibling;){if(null===o.return||o.return===t)return;4===(o=o.return).tag&&(l=!1)}o.sibling.return=o.return,o=o.sibling}}function ml(e,t){switch(t.tag){case 0:case 11:case 14:case 15:case 22:return void ol(3,t);case 1:case 12:case 17:return;case 5:var n=t.stateNode;if(null!=n){var r=t.memoizedProps,i=null!==e?e.memoizedProps:r;e=t.type;var o=t.updateQueue;if(t.updateQueue=null,null!==o){for(n[Cn]=r,"input"===e&&"radio"===r.type&&null!=r.name&&Ee(n,r),on(e,i),t=on(e,r),i=0;i<o.length;i+=2){var l=o[i],s=o[i+1];"style"===l?tn(n,s):"dangerouslySetInnerHTML"===l?He(n,s):"children"===l?Be(n,s):X(n,l,s,t)}switch(e){case"input":Te(n,r);break;case"textarea":De(n,r);break;case"select":t=n._wrapperState.wasMultiple,n._wrapperState.wasMultiple=!!r.multiple,null!=(e=r.value)?Ne(n,!!r.multiple,e,!1):t!==!!r.multiple&&(null!=r.defaultValue?Ne(n,!!r.multiple,r.defaultValue,!0):Ne(n,!!r.multiple,r.multiple?[]:"",!1))}}}return;case 6:if(null===t.stateNode)throw Error(a(162));return void(t.stateNode.nodeValue=t.memoizedProps);case 3:return void((t=t.stateNode).hydrate&&(t.hydrate=!1,zt(t.containerInfo)));case 13:if(n=t,null===t.memoizedState?r=!1:(r=!0,n=t.child,Hl=Wi()),null!==n)e:for(e=n;;){if(5===e.tag)o=e.stateNode,r?"function"==typeof(o=o.style).setProperty?o.setProperty("display","none","important"):o.display="none":(o=e.stateNode,i=null!=(i=e.memoizedProps.style)&&i.hasOwnProperty("display")?i.display:null,o.style.display=en("display",i));else if(6===e.tag)e.stateNode.nodeValue=r?"":e.memoizedProps;else{if(13===e.tag&&null!==e.memoizedState&&null===e.memoizedState.dehydrated){(o=e.child.sibling).return=e,e=o;continue}if(null!==e.child){e.child.return=e,e=e.child;continue}}if(e===n)break;for(;null===e.sibling;){if(null===e.return||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}return void gl(t);case 19:return void gl(t)}throw Error(a(163))}function gl(e){var t=e.updateQueue;if(null!==t){e.updateQueue=null;var n=e.stateNode;null===n&&(n=e.stateNode=new tl),t.forEach((function(t){var r=Es.bind(null,e,t);n.has(t)||(n.add(t),t.then(r,r))}))}}var yl="function"==typeof WeakMap?WeakMap:Map;function vl(e,t,n){(n=uo(n,null)).tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){Al||(Al=!0,Wl=r),nl(e,t)},n}function bl(e,t,n){(n=uo(n,null)).tag=3;var r=e.type.getDerivedStateFromError;if("function"==typeof r){var i=t.value;n.payload=function(){return nl(e,t),r(i)}}var o=e.stateNode;return null!==o&&"function"==typeof o.componentDidCatch&&(n.callback=function(){"function"!=typeof r&&(null===jl?jl=new Set([this]):jl.add(this),nl(e,t));var n=t.stack;this.componentDidCatch(t.value,{componentStack:null!==n?n:""})}),n}var xl,Sl=Math.ceil,wl=Z.ReactCurrentDispatcher,kl=Z.ReactCurrentOwner,El=0,Tl=3,Pl=4,Cl=0,Il=null,Nl=null,Ll=0,_l=El,Dl=null,Fl=1073741823,Ml=1073741823,zl=null,Ol=0,Rl=!1,Hl=0,Bl=null,Al=!1,Wl=null,jl=null,Ul=!1,Ql=null,Vl=90,Yl=null,Kl=0,$l=null,Gl=0;function Zl(){return 0!=(48&Cl)?1073741821-(Wi()/10|0):0!==Gl?Gl:Gl=1073741821-(Wi()/10|0)}function Xl(e,t,n){if(0==(2&(t=t.mode)))return 1073741823;var r=ji();if(0==(4&t))return 99===r?1073741823:1073741822;if(0!=(16&Cl))return Ll;if(null!==n)e=Gi(e,0|n.timeoutMs||5e3,250);else switch(r){case 99:e=1073741823;break;case 98:e=Gi(e,150,100);break;case 97:case 96:e=Gi(e,5e3,250);break;case 95:e=2;break;default:throw Error(a(326))}return null!==Il&&e===Ll&&--e,e}function Jl(e,t){if(50<Kl)throw Kl=0,$l=null,Error(a(185));if(null!==(e=ql(e,t))){var n=ji();1073741823===t?0!=(8&Cl)&&0==(48&Cl)?rs(e):(ts(e),0===Cl&&Ki()):ts(e),0==(4&Cl)||98!==n&&99!==n||(null===Yl?Yl=new Map([[e,t]]):(void 0===(n=Yl.get(e))||n>t)&&Yl.set(e,t))}}function ql(e,t){e.expirationTime<t&&(e.expirationTime=t);var n=e.alternate;null!==n&&n.expirationTime<t&&(n.expirationTime=t);var r=e.return,i=null;if(null===r&&3===e.tag)i=e.stateNode;else for(;null!==r;){if(n=r.alternate,r.childExpirationTime<t&&(r.childExpirationTime=t),null!==n&&n.childExpirationTime<t&&(n.childExpirationTime=t),null===r.return&&3===r.tag){i=r.stateNode;break}r=r.return}return null!==i&&(Il===i&&(cs(t),_l===Pl&&Rs(i,Ll)),Hs(i,t)),i}function es(e){var t=e.lastExpiredTime;if(0!==t)return t;if(!Os(e,t=e.firstPendingTime))return t;var n=e.lastPingedTime;return 2>=(e=n>(e=e.nextKnownPendingLevel)?n:e)&&t!==e?0:e}function ts(e){if(0!==e.lastExpiredTime)e.callbackExpirationTime=1073741823,e.callbackPriority=99,e.callbackNode=Yi(rs.bind(null,e));else{var t=es(e),n=e.callbackNode;if(0===t)null!==n&&(e.callbackNode=null,e.callbackExpirationTime=0,e.callbackPriority=90);else{var r=Zl();if(r=1073741823===t?99:1===t||2===t?95:0>=(r=10*(1073741821-t)-10*(1073741821-r))?99:250>=r?98:5250>=r?97:95,null!==n){var i=e.callbackPriority;if(e.callbackExpirationTime===t&&i>=r)return;n!==Mi&&Ti(n)}e.callbackExpirationTime=t,e.callbackPriority=r,t=1073741823===t?Yi(rs.bind(null,e)):Vi(r,ns.bind(null,e),{timeout:10*(1073741821-t)-Wi()}),e.callbackNode=t}}}function ns(e,t){if(Gl=0,t)return Bs(e,t=Zl()),ts(e),null;var n=es(e);if(0!==n){if(t=e.callbackNode,0!=(48&Cl))throw Error(a(327));if(bs(),e===Il&&n===Ll||as(e,n),null!==Nl){var r=Cl;Cl|=16;for(var i=ss();;)try{ps();break}catch(t){ls(e,t)}if(to(),Cl=r,wl.current=i,1===_l)throw t=Dl,as(e,n),Rs(e,n),ts(e),t;if(null===Nl)switch(i=e.finishedWork=e.current.alternate,e.finishedExpirationTime=n,r=_l,Il=null,r){case El:case 1:throw Error(a(345));case 2:Bs(e,2<n?2:n);break;case Tl:if(Rs(e,n),n===(r=e.lastSuspendedTime)&&(e.nextKnownPendingLevel=ms(i)),1073741823===Fl&&10<(i=Hl+500-Wi())){if(Rl){var o=e.lastPingedTime;if(0===o||o>=n){e.lastPingedTime=n,as(e,n);break}}if(0!==(o=es(e))&&o!==n)break;if(0!==r&&r!==n){e.lastPingedTime=r;break}e.timeoutHandle=Sn(gs.bind(null,e),i);break}gs(e);break;case Pl:if(Rs(e,n),n===(r=e.lastSuspendedTime)&&(e.nextKnownPendingLevel=ms(i)),Rl&&(0===(i=e.lastPingedTime)||i>=n)){e.lastPingedTime=n,as(e,n);break}if(0!==(i=es(e))&&i!==n)break;if(0!==r&&r!==n){e.lastPingedTime=r;break}if(1073741823!==Ml?r=10*(1073741821-Ml)-Wi():1073741823===Fl?r=0:(r=10*(1073741821-Fl)-5e3,0>(r=(i=Wi())-r)&&(r=0),(n=10*(1073741821-n)-i)<(r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*Sl(r/1960))-r)&&(r=n)),10<r){e.timeoutHandle=Sn(gs.bind(null,e),r);break}gs(e);break;case 5:if(1073741823!==Fl&&null!==zl){o=Fl;var l=zl;if(0>=(r=0|l.busyMinDurationMs)?r=0:(i=0|l.busyDelayMs,r=(o=Wi()-(10*(1073741821-o)-(0|l.timeoutMs||5e3)))<=i?0:i+r-o),10<r){Rs(e,n),e.timeoutHandle=Sn(gs.bind(null,e),r);break}}gs(e);break;default:throw Error(a(329))}if(ts(e),e.callbackNode===t)return ns.bind(null,e)}}return null}function rs(e){var t=e.lastExpiredTime;if(t=0!==t?t:1073741823,0!=(48&Cl))throw Error(a(327));if(bs(),e===Il&&t===Ll||as(e,t),null!==Nl){var n=Cl;Cl|=16;for(var r=ss();;)try{ds();break}catch(t){ls(e,t)}if(to(),Cl=n,wl.current=r,1===_l)throw n=Dl,as(e,t),Rs(e,t),ts(e),n;if(null!==Nl)throw Error(a(261));e.finishedWork=e.current.alternate,e.finishedExpirationTime=t,Il=null,gs(e),ts(e)}return null}function is(e,t){var n=Cl;Cl|=1;try{return e(t)}finally{0===(Cl=n)&&Ki()}}function os(e,t){var n=Cl;Cl&=-2,Cl|=8;try{return e(t)}finally{0===(Cl=n)&&Ki()}}function as(e,t){e.finishedWork=null,e.finishedExpirationTime=0;var n=e.timeoutHandle;if(-1!==n&&(e.timeoutHandle=-1,wn(n)),null!==Nl)for(n=Nl.return;null!==n;){var r=n;switch(r.tag){case 1:null!=(r=r.type.childContextTypes)&&vi();break;case 3:zo(),ci(hi),ci(fi);break;case 5:Ro(r);break;case 4:zo();break;case 13:case 19:ci(Ho);break;case 10:no(r)}n=n.return}Il=e,Nl=Ls(e.current,null),Ll=t,_l=El,Dl=null,Ml=Fl=1073741823,zl=null,Ol=0,Rl=!1}function ls(e,t){for(;;){try{if(to(),Wo.current=va,Ko)for(var n=Qo.memoizedState;null!==n;){var r=n.queue;null!==r&&(r.pending=null),n=n.next}if(Uo=0,Yo=Vo=Qo=null,Ko=!1,null===Nl||null===Nl.return)return _l=1,Dl=t,Nl=null;e:{var i=e,o=Nl.return,a=Nl,l=t;if(t=Ll,a.effectTag|=2048,a.firstEffect=a.lastEffect=null,null!==l&&"object"==typeof l&&"function"==typeof l.then){var s=l;if(0==(2&a.mode)){var u=a.alternate;u?(a.updateQueue=u.updateQueue,a.memoizedState=u.memoizedState,a.expirationTime=u.expirationTime):(a.updateQueue=null,a.memoizedState=null)}var c=0!=(1&Ho.current),d=o;do{var p;if(p=13===d.tag){var f=d.memoizedState;if(null!==f)p=null!==f.dehydrated;else{var h=d.memoizedProps;p=void 0!==h.fallback&&(!0!==h.unstable_avoidThisFallback||!c)}}if(p){var m=d.updateQueue;if(null===m){var g=new Set;g.add(s),d.updateQueue=g}else m.add(s);if(0==(2&d.mode)){if(d.effectTag|=64,a.effectTag&=-2981,1===a.tag)if(null===a.alternate)a.tag=17;else{var y=uo(1073741823,null);y.tag=2,co(a,y)}a.expirationTime=1073741823;break e}l=void 0,a=t;var v=i.pingCache;if(null===v?(v=i.pingCache=new yl,l=new Set,v.set(s,l)):void 0===(l=v.get(s))&&(l=new Set,v.set(s,l)),!l.has(a)){l.add(a);var b=ks.bind(null,i,s,a);s.then(b,b)}d.effectTag|=4096,d.expirationTime=t;break e}d=d.return}while(null!==d);l=Error((ge(a.type)||"A React component")+" suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display."+ye(a))}5!==_l&&(_l=2),l=el(l,a),d=o;do{switch(d.tag){case 3:s=l,d.effectTag|=4096,d.expirationTime=t,po(d,vl(d,s,t));break e;case 1:s=l;var x=d.type,S=d.stateNode;if(0==(64&d.effectTag)&&("function"==typeof x.getDerivedStateFromError||null!==S&&"function"==typeof S.componentDidCatch&&(null===jl||!jl.has(S)))){d.effectTag|=4096,d.expirationTime=t,po(d,bl(d,s,t));break e}}d=d.return}while(null!==d)}Nl=hs(Nl)}catch(e){t=e;continue}break}}function ss(){var e=wl.current;return wl.current=va,null===e?va:e}function us(e,t){e<Fl&&2<e&&(Fl=e),null!==t&&e<Ml&&2<e&&(Ml=e,zl=t)}function cs(e){e>Ol&&(Ol=e)}function ds(){for(;null!==Nl;)Nl=fs(Nl)}function ps(){for(;null!==Nl&&!zi();)Nl=fs(Nl)}function fs(e){var t=xl(e.alternate,e,Ll);return e.memoizedProps=e.pendingProps,null===t&&(t=hs(e)),kl.current=null,t}function hs(e){Nl=e;do{var t=Nl.alternate;if(e=Nl.return,0==(2048&Nl.effectTag)){if(t=Ja(t,Nl,Ll),1===Ll||1!==Nl.childExpirationTime){for(var n=0,r=Nl.child;null!==r;){var i=r.expirationTime,o=r.childExpirationTime;i>n&&(n=i),o>n&&(n=o),r=r.sibling}Nl.childExpirationTime=n}if(null!==t)return t;null!==e&&0==(2048&e.effectTag)&&(null===e.firstEffect&&(e.firstEffect=Nl.firstEffect),null!==Nl.lastEffect&&(null!==e.lastEffect&&(e.lastEffect.nextEffect=Nl.firstEffect),e.lastEffect=Nl.lastEffect),1<Nl.effectTag&&(null!==e.lastEffect?e.lastEffect.nextEffect=Nl:e.firstEffect=Nl,e.lastEffect=Nl))}else{if(null!==(t=qa(Nl)))return t.effectTag&=2047,t;null!==e&&(e.firstEffect=e.lastEffect=null,e.effectTag|=2048)}if(null!==(t=Nl.sibling))return t;Nl=e}while(null!==Nl);return _l===El&&(_l=5),null}function ms(e){var t=e.expirationTime;return t>(e=e.childExpirationTime)?t:e}function gs(e){var t=ji();return Qi(99,ys.bind(null,e,t)),null}function ys(e,t){do{bs()}while(null!==Ql);if(0!=(48&Cl))throw Error(a(327));var n=e.finishedWork,r=e.finishedExpirationTime;if(null===n)return null;if(e.finishedWork=null,e.finishedExpirationTime=0,n===e.current)throw Error(a(177));e.callbackNode=null,e.callbackExpirationTime=0,e.callbackPriority=90,e.nextKnownPendingLevel=0;var i=ms(n);if(e.firstPendingTime=i,r<=e.lastSuspendedTime?e.firstSuspendedTime=e.lastSuspendedTime=e.nextKnownPendingLevel=0:r<=e.firstSuspendedTime&&(e.firstSuspendedTime=r-1),r<=e.lastPingedTime&&(e.lastPingedTime=0),r<=e.lastExpiredTime&&(e.lastExpiredTime=0),e===Il&&(Nl=Il=null,Ll=0),1<n.effectTag?null!==n.lastEffect?(n.lastEffect.nextEffect=n,i=n.firstEffect):i=n:i=n.firstEffect,null!==i){var o=Cl;Cl|=32,kl.current=null,yn=Vt;var l=fn();if(hn(l)){if("selectionStart"in l)var s={start:l.selectionStart,end:l.selectionEnd};else e:{var u=(s=(s=l.ownerDocument)&&s.defaultView||window).getSelection&&s.getSelection();if(u&&0!==u.rangeCount){s=u.anchorNode;var c=u.anchorOffset,d=u.focusNode;u=u.focusOffset;try{s.nodeType,d.nodeType}catch(e){s=null;break e}var p=0,f=-1,h=-1,m=0,g=0,y=l,v=null;t:for(;;){for(var b;y!==s||0!==c&&3!==y.nodeType||(f=p+c),y!==d||0!==u&&3!==y.nodeType||(h=p+u),3===y.nodeType&&(p+=y.nodeValue.length),null!==(b=y.firstChild);)v=y,y=b;for(;;){if(y===l)break t;if(v===s&&++m===c&&(f=p),v===d&&++g===u&&(h=p),null!==(b=y.nextSibling))break;v=(y=v).parentNode}y=b}s=-1===f||-1===h?null:{start:f,end:h}}else s=null}s=s||{start:0,end:0}}else s=null;vn={activeElementDetached:null,focusedElem:l,selectionRange:s},Vt=!1,Bl=i;do{try{vs()}catch(e){if(null===Bl)throw Error(a(330));ws(Bl,e),Bl=Bl.nextEffect}}while(null!==Bl);Bl=i;do{try{for(l=e,s=t;null!==Bl;){var x=Bl.effectTag;if(16&x&&Be(Bl.stateNode,""),128&x){var S=Bl.alternate;if(null!==S){var w=S.ref;null!==w&&("function"==typeof w?w(null):w.current=null)}}switch(1038&x){case 2:dl(Bl),Bl.effectTag&=-3;break;case 6:dl(Bl),Bl.effectTag&=-3,ml(Bl.alternate,Bl);break;case 1024:Bl.effectTag&=-1025;break;case 1028:Bl.effectTag&=-1025,ml(Bl.alternate,Bl);break;case 4:ml(Bl.alternate,Bl);break;case 8:hl(l,c=Bl,s),ul(c)}Bl=Bl.nextEffect}}catch(e){if(null===Bl)throw Error(a(330));ws(Bl,e),Bl=Bl.nextEffect}}while(null!==Bl);if(w=vn,S=fn(),x=w.focusedElem,s=w.selectionRange,S!==x&&x&&x.ownerDocument&&pn(x.ownerDocument.documentElement,x)){null!==s&&hn(x)&&(S=s.start,void 0===(w=s.end)&&(w=S),"selectionStart"in x?(x.selectionStart=S,x.selectionEnd=Math.min(w,x.value.length)):(w=(S=x.ownerDocument||document)&&S.defaultView||window).getSelection&&(w=w.getSelection(),c=x.textContent.length,l=Math.min(s.start,c),s=void 0===s.end?l:Math.min(s.end,c),!w.extend&&l>s&&(c=s,s=l,l=c),c=dn(x,l),d=dn(x,s),c&&d&&(1!==w.rangeCount||w.anchorNode!==c.node||w.anchorOffset!==c.offset||w.focusNode!==d.node||w.focusOffset!==d.offset)&&((S=S.createRange()).setStart(c.node,c.offset),w.removeAllRanges(),l>s?(w.addRange(S),w.extend(d.node,d.offset)):(S.setEnd(d.node,d.offset),w.addRange(S))))),S=[];for(w=x;w=w.parentNode;)1===w.nodeType&&S.push({element:w,left:w.scrollLeft,top:w.scrollTop});for("function"==typeof x.focus&&x.focus(),x=0;x<S.length;x++)(w=S[x]).element.scrollLeft=w.left,w.element.scrollTop=w.top}Vt=!!yn,vn=yn=null,e.current=n,Bl=i;do{try{for(x=e;null!==Bl;){var k=Bl.effectTag;if(36&k&&ll(x,Bl.alternate,Bl),128&k){S=void 0;var E=Bl.ref;if(null!==E){var T=Bl.stateNode;Bl.tag,S=T,"function"==typeof E?E(S):E.current=S}}Bl=Bl.nextEffect}}catch(e){if(null===Bl)throw Error(a(330));ws(Bl,e),Bl=Bl.nextEffect}}while(null!==Bl);Bl=null,Oi(),Cl=o}else e.current=n;if(Ul)Ul=!1,Ql=e,Vl=t;else for(Bl=i;null!==Bl;)t=Bl.nextEffect,Bl.nextEffect=null,Bl=t;if(0===(t=e.firstPendingTime)&&(jl=null),1073741823===t?e===$l?Kl++:(Kl=0,$l=e):Kl=0,"function"==typeof Ts&&Ts(n.stateNode,r),ts(e),Al)throw Al=!1,e=Wl,Wl=null,e;return 0!=(8&Cl)||Ki(),null}function vs(){for(;null!==Bl;){var e=Bl.effectTag;0!=(256&e)&&il(Bl.alternate,Bl),0==(512&e)||Ul||(Ul=!0,Vi(97,(function(){return bs(),null}))),Bl=Bl.nextEffect}}function bs(){if(90!==Vl){var e=97<Vl?97:Vl;return Vl=90,Qi(e,xs)}}function xs(){if(null===Ql)return!1;var e=Ql;if(Ql=null,0!=(48&Cl))throw Error(a(331));var t=Cl;for(Cl|=32,e=e.current.firstEffect;null!==e;){try{var n=e;if(0!=(512&n.effectTag))switch(n.tag){case 0:case 11:case 15:case 22:ol(5,n),al(5,n)}}catch(t){if(null===e)throw Error(a(330));ws(e,t)}n=e.nextEffect,e.nextEffect=null,e=n}return Cl=t,Ki(),!0}function Ss(e,t,n){co(e,t=vl(e,t=el(n,t),1073741823)),null!==(e=ql(e,1073741823))&&ts(e)}function ws(e,t){if(3===e.tag)Ss(e,e,t);else for(var n=e.return;null!==n;){if(3===n.tag){Ss(n,e,t);break}if(1===n.tag){var r=n.stateNode;if("function"==typeof n.type.getDerivedStateFromError||"function"==typeof r.componentDidCatch&&(null===jl||!jl.has(r))){co(n,e=bl(n,e=el(t,e),1073741823)),null!==(n=ql(n,1073741823))&&ts(n);break}}n=n.return}}function ks(e,t,n){var r=e.pingCache;null!==r&&r.delete(t),Il===e&&Ll===n?_l===Pl||_l===Tl&&1073741823===Fl&&Wi()-Hl<500?as(e,Ll):Rl=!0:Os(e,n)&&(0!==(t=e.lastPingedTime)&&t<n||(e.lastPingedTime=n,ts(e)))}function Es(e,t){var n=e.stateNode;null!==n&&n.delete(t),0==(t=0)&&(t=Xl(t=Zl(),e,null)),null!==(e=ql(e,t))&&ts(e)}xl=function(e,t,n){var r=t.expirationTime;if(null!==e){var i=t.pendingProps;if(e.memoizedProps!==i||hi.current)Da=!0;else{if(r<n){switch(Da=!1,t.tag){case 3:Wa(t),La();break;case 5:if(Oo(t),4&t.mode&&1!==n&&i.hidden)return t.expirationTime=t.childExpirationTime=1,null;break;case 1:yi(t.type)&&Si(t);break;case 4:Mo(t,t.stateNode.containerInfo);break;case 10:r=t.memoizedProps.value,i=t.type._context,di(Xi,i._currentValue),i._currentValue=r;break;case 13:if(null!==t.memoizedState)return 0!==(r=t.child.childExpirationTime)&&r>=n?Ya(e,t,n):(di(Ho,1&Ho.current),null!==(t=Za(e,t,n))?t.sibling:null);di(Ho,1&Ho.current);break;case 19:if(r=t.childExpirationTime>=n,0!=(64&e.effectTag)){if(r)return Ga(e,t,n);t.effectTag|=64}if(null!==(i=t.memoizedState)&&(i.rendering=null,i.tail=null),di(Ho,Ho.current),!r)return null}return Za(e,t,n)}Da=!1}}else Da=!1;switch(t.expirationTime=0,t.tag){case 2:if(r=t.type,null!==e&&(e.alternate=null,t.alternate=null,t.effectTag|=2),e=t.pendingProps,i=gi(t,fi.current),io(t,n),i=Zo(null,t,r,e,i,n),t.effectTag|=1,"object"==typeof i&&null!==i&&"function"==typeof i.render&&void 0===i.$$typeof){if(t.tag=1,t.memoizedState=null,t.updateQueue=null,yi(r)){var o=!0;Si(t)}else o=!1;t.memoizedState=null!==i.state&&void 0!==i.state?i.state:null,lo(t);var l=r.getDerivedStateFromProps;"function"==typeof l&&yo(t,r,l,e),i.updater=vo,t.stateNode=i,i._reactInternalFiber=t,wo(t,r,e,n),t=Aa(null,t,r,!0,o,n)}else t.tag=0,Fa(null,t,i,n),t=t.child;return t;case 16:e:{if(i=t.elementType,null!==e&&(e.alternate=null,t.alternate=null,t.effectTag|=2),e=t.pendingProps,function(e){if(-1===e._status){e._status=0;var t=e._ctor;t=t(),e._result=t,t.then((function(t){0===e._status&&(t=t.default,e._status=1,e._result=t)}),(function(t){0===e._status&&(e._status=2,e._result=t)}))}}(i),1!==i._status)throw i._result;switch(i=i._result,t.type=i,o=t.tag=function(e){if("function"==typeof e)return Ns(e)?1:0;if(null!=e){if((e=e.$$typeof)===se)return 11;if(e===de)return 14}return 2}(i),e=Zi(i,e),o){case 0:t=Ha(null,t,i,e,n);break e;case 1:t=Ba(null,t,i,e,n);break e;case 11:t=Ma(null,t,i,e,n);break e;case 14:t=za(null,t,i,Zi(i.type,e),r,n);break e}throw Error(a(306,i,""))}return t;case 0:return r=t.type,i=t.pendingProps,Ha(e,t,r,i=t.elementType===r?i:Zi(r,i),n);case 1:return r=t.type,i=t.pendingProps,Ba(e,t,r,i=t.elementType===r?i:Zi(r,i),n);case 3:if(Wa(t),r=t.updateQueue,null===e||null===r)throw Error(a(282));if(r=t.pendingProps,i=null!==(i=t.memoizedState)?i.element:null,so(e,t),fo(t,r,null,n),(r=t.memoizedState.element)===i)La(),t=Za(e,t,n);else{if((i=t.stateNode.hydrate)&&(ka=kn(t.stateNode.containerInfo.firstChild),wa=t,i=Ea=!0),i)for(n=Io(t,null,r,n),t.child=n;n;)n.effectTag=-3&n.effectTag|1024,n=n.sibling;else Fa(e,t,r,n),La();t=t.child}return t;case 5:return Oo(t),null===e&&Ca(t),r=t.type,i=t.pendingProps,o=null!==e?e.memoizedProps:null,l=i.children,xn(r,i)?l=null:null!==o&&xn(r,o)&&(t.effectTag|=16),Ra(e,t),4&t.mode&&1!==n&&i.hidden?(t.expirationTime=t.childExpirationTime=1,t=null):(Fa(e,t,l,n),t=t.child),t;case 6:return null===e&&Ca(t),null;case 13:return Ya(e,t,n);case 4:return Mo(t,t.stateNode.containerInfo),r=t.pendingProps,null===e?t.child=Co(t,null,r,n):Fa(e,t,r,n),t.child;case 11:return r=t.type,i=t.pendingProps,Ma(e,t,r,i=t.elementType===r?i:Zi(r,i),n);case 7:return Fa(e,t,t.pendingProps,n),t.child;case 8:case 12:return Fa(e,t,t.pendingProps.children,n),t.child;case 10:e:{r=t.type._context,i=t.pendingProps,l=t.memoizedProps,o=i.value;var s=t.type._context;if(di(Xi,s._currentValue),s._currentValue=o,null!==l)if(s=l.value,0==(o=Br(s,o)?0:0|("function"==typeof r._calculateChangedBits?r._calculateChangedBits(s,o):1073741823))){if(l.children===i.children&&!hi.current){t=Za(e,t,n);break e}}else for(null!==(s=t.child)&&(s.return=t);null!==s;){var u=s.dependencies;if(null!==u){l=s.child;for(var c=u.firstContext;null!==c;){if(c.context===r&&0!=(c.observedBits&o)){1===s.tag&&((c=uo(n,null)).tag=2,co(s,c)),s.expirationTime<n&&(s.expirationTime=n),null!==(c=s.alternate)&&c.expirationTime<n&&(c.expirationTime=n),ro(s.return,n),u.expirationTime<n&&(u.expirationTime=n);break}c=c.next}}else l=10===s.tag&&s.type===t.type?null:s.child;if(null!==l)l.return=s;else for(l=s;null!==l;){if(l===t){l=null;break}if(null!==(s=l.sibling)){s.return=l.return,l=s;break}l=l.return}s=l}Fa(e,t,i.children,n),t=t.child}return t;case 9:return i=t.type,r=(o=t.pendingProps).children,io(t,n),r=r(i=oo(i,o.unstable_observedBits)),t.effectTag|=1,Fa(e,t,r,n),t.child;case 14:return o=Zi(i=t.type,t.pendingProps),za(e,t,i,o=Zi(i.type,o),r,n);case 15:return Oa(e,t,t.type,t.pendingProps,r,n);case 17:return r=t.type,i=t.pendingProps,i=t.elementType===r?i:Zi(r,i),null!==e&&(e.alternate=null,t.alternate=null,t.effectTag|=2),t.tag=1,yi(r)?(e=!0,Si(t)):e=!1,io(t,n),xo(t,r,i),wo(t,r,i,n),Aa(null,t,r,!0,e,n);case 19:return Ga(e,t,n)}throw Error(a(156,t.tag))};var Ts=null,Ps=null;function Cs(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.effectTag=0,this.lastEffect=this.firstEffect=this.nextEffect=null,this.childExpirationTime=this.expirationTime=0,this.alternate=null}function Is(e,t,n,r){return new Cs(e,t,n,r)}function Ns(e){return!(!(e=e.prototype)||!e.isReactComponent)}function Ls(e,t){var n=e.alternate;return null===n?((n=Is(e.tag,t,e.key,e.mode)).elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.effectTag=0,n.nextEffect=null,n.firstEffect=null,n.lastEffect=null),n.childExpirationTime=e.childExpirationTime,n.expirationTime=e.expirationTime,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=null===t?null:{expirationTime:t.expirationTime,firstContext:t.firstContext,responders:t.responders},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function _s(e,t,n,r,i,o){var l=2;if(r=e,"function"==typeof e)Ns(e)&&(l=1);else if("string"==typeof e)l=5;else e:switch(e){case ne:return Ds(n.children,i,o,t);case le:l=8,i|=7;break;case re:l=8,i|=1;break;case ie:return(e=Is(12,n,t,8|i)).elementType=ie,e.type=ie,e.expirationTime=o,e;case ue:return(e=Is(13,n,t,i)).type=ue,e.elementType=ue,e.expirationTime=o,e;case ce:return(e=Is(19,n,t,i)).elementType=ce,e.expirationTime=o,e;default:if("object"==typeof e&&null!==e)switch(e.$$typeof){case oe:l=10;break e;case ae:l=9;break e;case se:l=11;break e;case de:l=14;break e;case pe:l=16,r=null;break e;case fe:l=22;break e}throw Error(a(130,null==e?e:typeof e,""))}return(t=Is(l,n,t,i)).elementType=e,t.type=r,t.expirationTime=o,t}function Ds(e,t,n,r){return(e=Is(7,e,r,t)).expirationTime=n,e}function Fs(e,t,n){return(e=Is(6,e,null,t)).expirationTime=n,e}function Ms(e,t,n){return(t=Is(4,null!==e.children?e.children:[],e.key,t)).expirationTime=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function zs(e,t,n){this.tag=t,this.current=null,this.containerInfo=e,this.pingCache=this.pendingChildren=null,this.finishedExpirationTime=0,this.finishedWork=null,this.timeoutHandle=-1,this.pendingContext=this.context=null,this.hydrate=n,this.callbackNode=null,this.callbackPriority=90,this.lastExpiredTime=this.lastPingedTime=this.nextKnownPendingLevel=this.lastSuspendedTime=this.firstSuspendedTime=this.firstPendingTime=0}function Os(e,t){var n=e.firstSuspendedTime;return e=e.lastSuspendedTime,0!==n&&n>=t&&e<=t}function Rs(e,t){var n=e.firstSuspendedTime,r=e.lastSuspendedTime;n<t&&(e.firstSuspendedTime=t),(r>t||0===n)&&(e.lastSuspendedTime=t),t<=e.lastPingedTime&&(e.lastPingedTime=0),t<=e.lastExpiredTime&&(e.lastExpiredTime=0)}function Hs(e,t){t>e.firstPendingTime&&(e.firstPendingTime=t);var n=e.firstSuspendedTime;0!==n&&(t>=n?e.firstSuspendedTime=e.lastSuspendedTime=e.nextKnownPendingLevel=0:t>=e.lastSuspendedTime&&(e.lastSuspendedTime=t+1),t>e.nextKnownPendingLevel&&(e.nextKnownPendingLevel=t))}function Bs(e,t){var n=e.lastExpiredTime;(0===n||n>t)&&(e.lastExpiredTime=t)}function As(e,t,n,r){var i=t.current,o=Zl(),l=mo.suspense;o=Xl(o,i,l);e:if(n){t:{if(Je(n=n._reactInternalFiber)!==n||1!==n.tag)throw Error(a(170));var s=n;do{switch(s.tag){case 3:s=s.stateNode.context;break t;case 1:if(yi(s.type)){s=s.stateNode.__reactInternalMemoizedMergedChildContext;break t}}s=s.return}while(null!==s);throw Error(a(171))}if(1===n.tag){var u=n.type;if(yi(u)){n=xi(n,u,s);break e}}n=s}else n=pi;return null===t.context?t.context=n:t.pendingContext=n,(t=uo(o,l)).payload={element:e},null!==(r=void 0===r?null:r)&&(t.callback=r),co(i,t),Jl(i,o),o}function Ws(e){return(e=e.current).child?(e.child.tag,e.child.stateNode):null}function js(e,t){null!==(e=e.memoizedState)&&null!==e.dehydrated&&e.retryTime<t&&(e.retryTime=t)}function Us(e,t){js(e,t),(e=e.alternate)&&js(e,t)}function Qs(e,t,n){var r=new zs(e,t,n=null!=n&&!0===n.hydrate),i=Is(3,null,null,2===t?7:1===t?3:0);r.current=i,i.stateNode=r,lo(i),e[In]=r.current,n&&0!==t&&function(e,t){var n=Xe(t);Tt.forEach((function(e){ft(e,t,n)})),Pt.forEach((function(e){ft(e,t,n)}))}(0,9===e.nodeType?e:e.ownerDocument),this._internalRoot=r}function Vs(e){return!(!e||1!==e.nodeType&&9!==e.nodeType&&11!==e.nodeType&&(8!==e.nodeType||" react-mount-point-unstable "!==e.nodeValue))}function Ys(e,t,n,r,i){var o=n._reactRootContainer;if(o){var a=o._internalRoot;if("function"==typeof i){var l=i;i=function(){var e=Ws(a);l.call(e)}}As(t,a,e,i)}else{if(o=n._reactRootContainer=function(e,t){if(t||(t=!(!(t=e?9===e.nodeType?e.documentElement:e.firstChild:null)||1!==t.nodeType||!t.hasAttribute("data-reactroot"))),!t)for(var n;n=e.lastChild;)e.removeChild(n);return new Qs(e,0,t?{hydrate:!0}:void 0)}(n,r),a=o._internalRoot,"function"==typeof i){var s=i;i=function(){var e=Ws(a);s.call(e)}}os((function(){As(t,a,e,i)}))}return Ws(a)}function Ks(e,t,n){var r=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return{$$typeof:te,key:null==r?null:""+r,children:e,containerInfo:t,implementation:n}}function $s(e,t){var n=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!Vs(t))throw Error(a(200));return Ks(e,t,null,n)}Qs.prototype.render=function(e){As(e,this._internalRoot,null,null)},Qs.prototype.unmount=function(){var e=this._internalRoot,t=e.containerInfo;As(null,e,null,(function(){t[In]=null}))},ht=function(e){if(13===e.tag){var t=Gi(Zl(),150,100);Jl(e,t),Us(e,t)}},mt=function(e){13===e.tag&&(Jl(e,3),Us(e,3))},gt=function(e){if(13===e.tag){var t=Zl();Jl(e,t=Xl(t,e,null)),Us(e,t)}},I=function(e,t,n){switch(t){case"input":if(Te(e,n),t=n.name,"radio"===n.type&&null!=t){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var i=Dn(r);if(!i)throw Error(a(90));Se(r),Te(r,i)}}}break;case"textarea":De(e,n);break;case"select":null!=(t=n.value)&&Ne(e,!!n.multiple,t,!1)}},M=is,z=function(e,t,n,r,i){var o=Cl;Cl|=4;try{return Qi(98,e.bind(null,t,n,r,i))}finally{0===(Cl=o)&&Ki()}},O=function(){0==(49&Cl)&&(function(){if(null!==Yl){var e=Yl;Yl=null,e.forEach((function(e,t){Bs(t,e),ts(t)})),Ki()}}(),bs())},R=function(e,t){var n=Cl;Cl|=2;try{return e(t)}finally{0===(Cl=n)&&Ki()}};var Gs={Events:[Ln,_n,Dn,P,k,Bn,function(e){rt(e,Hn)},D,F,Zt,at,bs,{current:!1}]};!function(e){var t=e.findFiberByHostInstance;!function(e){if("undefined"==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)return!1;var t=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(t.isDisabled||!t.supportsFiber)return!0;try{var n=t.inject(e);Ts=function(e){try{t.onCommitFiberRoot(n,e,void 0,64==(64&e.current.effectTag))}catch(e){}},Ps=function(e){try{t.onCommitFiberUnmount(n,e)}catch(e){}}}catch(e){}}(i({},e,{overrideHookState:null,overrideProps:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Z.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return null===(e=tt(e))?null:e.stateNode},findFiberByHostInstance:function(e){return t?t(e):null},findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null}))}({findFiberByHostInstance:Nn,bundleType:0,version:"16.14.0",rendererPackageName:"react-dom"}),t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Gs,t.createPortal=$s,t.findDOMNode=function(e){if(null==e)return null;if(1===e.nodeType)return e;var t=e._reactInternalFiber;if(void 0===t){if("function"==typeof e.render)throw Error(a(188));throw Error(a(268,Object.keys(e)))}return null===(e=tt(t))?null:e.stateNode},t.flushSync=function(e,t){if(0!=(48&Cl))throw Error(a(187));var n=Cl;Cl|=1;try{return Qi(99,e.bind(null,t))}finally{Cl=n,Ki()}},t.hydrate=function(e,t,n){if(!Vs(t))throw Error(a(200));return Ys(null,e,t,!0,n)},t.render=function(e,t,n){if(!Vs(t))throw Error(a(200));return Ys(null,e,t,!1,n)},t.unmountComponentAtNode=function(e){if(!Vs(e))throw Error(a(40));return!!e._reactRootContainer&&(os((function(){Ys(null,null,e,!1,(function(){e._reactRootContainer=null,e[In]=null}))})),!0)},t.unstable_batchedUpdates=is,t.unstable_createPortal=function(e,t){return $s(e,t,2<arguments.length&&void 0!==arguments[2]?arguments[2]:null)},t.unstable_renderSubtreeIntoContainer=function(e,t,n,r){if(!Vs(n))throw Error(a(200));if(null==e||void 0===e._reactInternalFiber)throw Error(a(38));return Ys(e,t,n,!1,r)},t.version="16.14.0"},542:(e,t,n)=>{"use strict";!function e(){if("undefined"!=typeof __REACT_DEVTOOLS_GLOBAL_HOOK__&&"function"==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(e)}catch(e){console.error(e)}}(),e.exports=n(577)},535:(e,t,n)=>{"use strict";var r=n(525),i="function"==typeof Symbol&&Symbol.for,o=i?Symbol.for("react.element"):60103,a=i?Symbol.for("react.portal"):60106,l=i?Symbol.for("react.fragment"):60107,s=i?Symbol.for("react.strict_mode"):60108,u=i?Symbol.for("react.profiler"):60114,c=i?Symbol.for("react.provider"):60109,d=i?Symbol.for("react.context"):60110,p=i?Symbol.for("react.forward_ref"):60112,f=i?Symbol.for("react.suspense"):60113,h=i?Symbol.for("react.memo"):60115,m=i?Symbol.for("react.lazy"):60116,g="function"==typeof Symbol&&Symbol.iterator;function y(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var v={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},b={};function x(e,t,n){this.props=e,this.context=t,this.refs=b,this.updater=n||v}function S(){}function w(e,t,n){this.props=e,this.context=t,this.refs=b,this.updater=n||v}x.prototype.isReactComponent={},x.prototype.setState=function(e,t){if("object"!=typeof e&&"function"!=typeof e&&null!=e)throw Error(y(85));this.updater.enqueueSetState(this,e,t,"setState")},x.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")},S.prototype=x.prototype;var k=w.prototype=new S;k.constructor=w,r(k,x.prototype),k.isPureReactComponent=!0;var E={current:null},T=Object.prototype.hasOwnProperty,P={key:!0,ref:!0,__self:!0,__source:!0};function C(e,t,n){var r,i={},a=null,l=null;if(null!=t)for(r in void 0!==t.ref&&(l=t.ref),void 0!==t.key&&(a=""+t.key),t)T.call(t,r)&&!P.hasOwnProperty(r)&&(i[r]=t[r]);var s=arguments.length-2;if(1===s)i.children=n;else if(1<s){for(var u=Array(s),c=0;c<s;c++)u[c]=arguments[c+2];i.children=u}if(e&&e.defaultProps)for(r in s=e.defaultProps)void 0===i[r]&&(i[r]=s[r]);return{$$typeof:o,type:e,key:a,ref:l,props:i,_owner:E.current}}function I(e){return"object"==typeof e&&null!==e&&e.$$typeof===o}var N=/\/+/g,L=[];function _(e,t,n,r){if(L.length){var i=L.pop();return i.result=e,i.keyPrefix=t,i.func=n,i.context=r,i.count=0,i}return{result:e,keyPrefix:t,func:n,context:r,count:0}}function D(e){e.result=null,e.keyPrefix=null,e.func=null,e.context=null,e.count=0,10>L.length&&L.push(e)}function F(e,t,n,r){var i=typeof e;"undefined"!==i&&"boolean"!==i||(e=null);var l=!1;if(null===e)l=!0;else switch(i){case"string":case"number":l=!0;break;case"object":switch(e.$$typeof){case o:case a:l=!0}}if(l)return n(r,e,""===t?"."+z(e,0):t),1;if(l=0,t=""===t?".":t+":",Array.isArray(e))for(var s=0;s<e.length;s++){var u=t+z(i=e[s],s);l+=F(i,u,n,r)}else if("function"==typeof(u=null===e||"object"!=typeof e?null:"function"==typeof(u=g&&e[g]||e["@@iterator"])?u:null))for(e=u.call(e),s=0;!(i=e.next()).done;)l+=F(i=i.value,u=t+z(i,s++),n,r);else if("object"===i)throw n=""+e,Error(y(31,"[object Object]"===n?"object with keys {"+Object.keys(e).join(", ")+"}":n,""));return l}function M(e,t,n){return null==e?0:F(e,"",t,n)}function z(e,t){return"object"==typeof e&&null!==e&&null!=e.key?function(e){var t={"=":"=0",":":"=2"};return"$"+(""+e).replace(/[=:]/g,(function(e){return t[e]}))}(e.key):t.toString(36)}function O(e,t){e.func.call(e.context,t,e.count++)}function R(e,t,n){var r=e.result,i=e.keyPrefix;e=e.func.call(e.context,t,e.count++),Array.isArray(e)?H(e,r,n,(function(e){return e})):null!=e&&(I(e)&&(e=function(e,t){return{$$typeof:o,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}(e,i+(!e.key||t&&t.key===e.key?"":(""+e.key).replace(N,"$&/")+"/")+n)),r.push(e))}function H(e,t,n,r,i){var o="";null!=n&&(o=(""+n).replace(N,"$&/")+"/"),M(e,R,t=_(t,o,r,i)),D(t)}var B={current:null};function A(){var e=B.current;if(null===e)throw Error(y(321));return e}var W={ReactCurrentDispatcher:B,ReactCurrentBatchConfig:{suspense:null},ReactCurrentOwner:E,IsSomeRendererActing:{current:!1},assign:r};t.Children={map:function(e,t,n){if(null==e)return e;var r=[];return H(e,r,null,t,n),r},forEach:function(e,t,n){if(null==e)return e;M(e,O,t=_(null,null,t,n)),D(t)},count:function(e){return M(e,(function(){return null}),null)},toArray:function(e){var t=[];return H(e,t,null,(function(e){return e})),t},only:function(e){if(!I(e))throw Error(y(143));return e}},t.Component=x,t.Fragment=l,t.Profiler=u,t.PureComponent=w,t.StrictMode=s,t.Suspense=f,t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=W,t.cloneElement=function(e,t,n){if(null==e)throw Error(y(267,e));var i=r({},e.props),a=e.key,l=e.ref,s=e._owner;if(null!=t){if(void 0!==t.ref&&(l=t.ref,s=E.current),void 0!==t.key&&(a=""+t.key),e.type&&e.type.defaultProps)var u=e.type.defaultProps;for(c in t)T.call(t,c)&&!P.hasOwnProperty(c)&&(i[c]=void 0===t[c]&&void 0!==u?u[c]:t[c])}var c=arguments.length-2;if(1===c)i.children=n;else if(1<c){u=Array(c);for(var d=0;d<c;d++)u[d]=arguments[d+2];i.children=u}return{$$typeof:o,type:e.type,key:a,ref:l,props:i,_owner:s}},t.createContext=function(e,t){return void 0===t&&(t=null),(e={$$typeof:d,_calculateChangedBits:t,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null}).Provider={$$typeof:c,_context:e},e.Consumer=e},t.createElement=C,t.createFactory=function(e){var t=C.bind(null,e);return t.type=e,t},t.createRef=function(){return{current:null}},t.forwardRef=function(e){return{$$typeof:p,render:e}},t.isValidElement=I,t.lazy=function(e){return{$$typeof:m,_ctor:e,_status:-1,_result:null}},t.memo=function(e,t){return{$$typeof:h,type:e,compare:void 0===t?null:t}},t.useCallback=function(e,t){return A().useCallback(e,t)},t.useContext=function(e,t){return A().useContext(e,t)},t.useDebugValue=function(){},t.useEffect=function(e,t){return A().useEffect(e,t)},t.useImperativeHandle=function(e,t,n){return A().useImperativeHandle(e,t,n)},t.useLayoutEffect=function(e,t){return A().useLayoutEffect(e,t)},t.useMemo=function(e,t){return A().useMemo(e,t)},t.useReducer=function(e,t,n){return A().useReducer(e,t,n)},t.useRef=function(e){return A().useRef(e)},t.useState=function(e){return A().useState(e)},t.version="16.14.0"},378:(e,t,n)=>{"use strict";e.exports=n(535)},323:(e,t)=>{"use strict";var n,r,i,o,a;if("undefined"==typeof window||"function"!=typeof MessageChannel){var l=null,s=null,u=function(){if(null!==l)try{var e=t.unstable_now();l(!0,e),l=null}catch(e){throw setTimeout(u,0),e}},c=Date.now();t.unstable_now=function(){return Date.now()-c},n=function(e){null!==l?setTimeout(n,0,e):(l=e,setTimeout(u,0))},r=function(e,t){s=setTimeout(e,t)},i=function(){clearTimeout(s)},o=function(){return!1},a=t.unstable_forceFrameRate=function(){}}else{var d=window.performance,p=window.Date,f=window.setTimeout,h=window.clearTimeout;if("undefined"!=typeof console){var m=window.cancelAnimationFrame;"function"!=typeof window.requestAnimationFrame&&console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"),"function"!=typeof m&&console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills")}if("object"==typeof d&&"function"==typeof d.now)t.unstable_now=function(){return d.now()};else{var g=p.now();t.unstable_now=function(){return p.now()-g}}var y=!1,v=null,b=-1,x=5,S=0;o=function(){return t.unstable_now()>=S},a=function(){},t.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported"):x=0<e?Math.floor(1e3/e):5};var w=new MessageChannel,k=w.port2;w.port1.onmessage=function(){if(null!==v){var e=t.unstable_now();S=e+x;try{v(!0,e)?k.postMessage(null):(y=!1,v=null)}catch(e){throw k.postMessage(null),e}}else y=!1},n=function(e){v=e,y||(y=!0,k.postMessage(null))},r=function(e,n){b=f((function(){e(t.unstable_now())}),n)},i=function(){h(b),b=-1}}function E(e,t){var n=e.length;e.push(t);e:for(;;){var r=n-1>>>1,i=e[r];if(!(void 0!==i&&0<C(i,t)))break e;e[r]=t,e[n]=i,n=r}}function T(e){return void 0===(e=e[0])?null:e}function P(e){var t=e[0];if(void 0!==t){var n=e.pop();if(n!==t){e[0]=n;e:for(var r=0,i=e.length;r<i;){var o=2*(r+1)-1,a=e[o],l=o+1,s=e[l];if(void 0!==a&&0>C(a,n))void 0!==s&&0>C(s,a)?(e[r]=s,e[l]=n,r=l):(e[r]=a,e[o]=n,r=o);else{if(!(void 0!==s&&0>C(s,n)))break e;e[r]=s,e[l]=n,r=l}}}return t}return null}function C(e,t){var n=e.sortIndex-t.sortIndex;return 0!==n?n:e.id-t.id}var I=[],N=[],L=1,_=null,D=3,F=!1,M=!1,z=!1;function O(e){for(var t=T(N);null!==t;){if(null===t.callback)P(N);else{if(!(t.startTime<=e))break;P(N),t.sortIndex=t.expirationTime,E(I,t)}t=T(N)}}function R(e){if(z=!1,O(e),!M)if(null!==T(I))M=!0,n(H);else{var t=T(N);null!==t&&r(R,t.startTime-e)}}function H(e,n){M=!1,z&&(z=!1,i()),F=!0;var a=D;try{for(O(n),_=T(I);null!==_&&(!(_.expirationTime>n)||e&&!o());){var l=_.callback;if(null!==l){_.callback=null,D=_.priorityLevel;var s=l(_.expirationTime<=n);n=t.unstable_now(),"function"==typeof s?_.callback=s:_===T(I)&&P(I),O(n)}else P(I);_=T(I)}if(null!==_)var u=!0;else{var c=T(N);null!==c&&r(R,c.startTime-n),u=!1}return u}finally{_=null,D=a,F=!1}}function B(e){switch(e){case 1:return-1;case 2:return 250;case 5:return 1073741823;case 4:return 1e4;default:return 5e3}}var A=a;t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(e){e.callback=null},t.unstable_continueExecution=function(){M||F||(M=!0,n(H))},t.unstable_getCurrentPriorityLevel=function(){return D},t.unstable_getFirstCallbackNode=function(){return T(I)},t.unstable_next=function(e){switch(D){case 1:case 2:case 3:var t=3;break;default:t=D}var n=D;D=t;try{return e()}finally{D=n}},t.unstable_pauseExecution=function(){},t.unstable_requestPaint=A,t.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=D;D=e;try{return t()}finally{D=n}},t.unstable_scheduleCallback=function(e,o,a){var l=t.unstable_now();if("object"==typeof a&&null!==a){var s=a.delay;s="number"==typeof s&&0<s?l+s:l,a="number"==typeof a.timeout?a.timeout:B(e)}else a=B(e),s=l;return e={id:L++,callback:o,priorityLevel:e,startTime:s,expirationTime:a=s+a,sortIndex:-1},s>l?(e.sortIndex=s,E(N,e),null===T(I)&&e===T(N)&&(z?i():z=!0,r(R,s-l))):(e.sortIndex=a,E(I,e),M||F||(M=!0,n(H))),e},t.unstable_shouldYield=function(){var e=t.unstable_now();O(e);var n=T(I);return n!==_&&null!==_&&null!==n&&null!==n.callback&&n.startTime<=e&&n.expirationTime<_.expirationTime||o()},t.unstable_wrapCallback=function(e){var t=D;return function(){var n=D;D=t;try{return e.apply(this,arguments)}finally{D=n}}}},102:(e,t,n)=>{"use strict";e.exports=n(323)}},t={};function n(r){var i=t[r];if(void 0!==i)return i.exports;var o=t[r]={exports:{}};return e[r](o,o.exports,n),o.exports}n.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{"use strict";var e=n(378),t=n(542);const r=e.createContext(null);class i{constructor(e,t,n,r){this.height=e,this.topPosition=t,this.leftPosition=n,this.containerHeight=r}overflowsTop(){return this.height>this.topPosition}overflowsBottom(){return this.height+this.topPosition>this.containerHeight}}class o extends e.Component{constructor(t){super(t),this.onClick.bind(this),this.innerLabelDiv=e.createRef(),this.navLabel=e.createRef(),this.state={expandable:!1,isExpanded:!1,divHeight:this.getDivHeight(),labelPos:this.props.labelPos,expandDirection:null,alignment:null,innerLabelHeight:""}}onClick(e){e.stopPropagation(),this.state.expandable&&(this.state.isExpanded?setTimeout((()=>{this.setState({divHeight:this.getDivHeight(),isExpanded:!1})}),0):setTimeout((()=>{this.setState({divHeight:this.innerLabelDiv.current?this.innerLabelDiv.current.scrollHeight:0,isExpanded:!0})}),0))}componentDidUpdate(e){this.props.labelText===e.labelText&&this.props.hoverOnly===e.hoverOnly||this.setHeightProperties(),this.props.topPosition===e.topPosition&&this.props.leftPosition===e.leftPosition&&this.props.labelText===e.labelText||!this.props.staticScene||this.setExpandProperties(),!e.rendered&&this.props.rendered&&(this.setHeightProperties(),this.setExpandProperties())}componentDidMount(){setTimeout((()=>{this.setHeightProperties(),this.props.staticScene&&this.setExpandProperties()}),50),this.context.on("resize",(()=>{this.state.isExpanded&&this.innerLabelDiv.current&&this.state.divHeight!==this.innerLabelDiv.current.scrollHeight&&(0!==this.innerLabelDiv.current.scrollHeight&&this.props.staticScene?this.setState({divHeight:this.innerLabelDiv.current?this.innerLabelDiv.current.scrollHeight:0}):this.props.staticScene||!this.state.isExpanded&&"3em"===this.state.divHeight||this.setState({isExpanded:!1,divHeight:"3em"}))}))}componentWillUnmount(){this.context.off("resize",(()=>{this.state.isExpanded&&this.innerLabelDiv.current&&this.state.divHeight!==this.innerLabelDiv.current.scrollHeight&&this.setState({divHeight:this.innerLabelDiv.current?this.innerLabelDiv.current.scrollHeight:0})}))}setHeightProperties(){const e=this.isExpandable();this.setState({expandable:e,divHeight:this.getDivHeight(),innerLabelHeight:e?"100%":""})}setExpandProperties(){const e=this.getOverflowProperties();e.expandDirection!==this.state.expandDirection&&this.setState({expandDirection:e.expandDirection}),e.alignment!==this.state.alignment&&this.setState({alignment:e.alignment})}getDivHeight(){return this.innerLabelDiv.current?(this.innerLabelDiv.current.style.height="",this.innerLabelDiv.current.scrollWidth>this.innerLabelDiv.current.offsetWidth||this.innerLabelDiv.current.scrollHeight>22?"3em":"1.5em"):null}isExpandable(){return this.innerLabelDiv.current.scrollHeight>44||"3em"===this.getDivHeight()&&this.innerLabelDiv.current.scrollWidth>2*this.innerLabelDiv.current.offsetWidth}getOverflowProperties(){let e=this.innerLabelDiv.current.scrollHeight;"top"===this.props.labelPos?e+=parseInt(window.getComputedStyle(this.navLabel.current).paddingTop):"bottom"===this.props.labelPos?e+=parseInt(this.props.navButtonHeight)+parseInt(window.getComputedStyle(this.navLabel.current).paddingTop):e+=parseInt(window.getComputedStyle(this.navLabel.current).paddingTop)+parseInt(window.getComputedStyle(this.navLabel.current).paddingBottom),this.state.expandable&&!this.props.hoverOnly&&(e+=parseInt(window.getComputedStyle(this.props.forwardRef.current).paddingTop));const t=function(e,t,n,r,o){const a=new i(t,n,r,o);let l=null,s=null;switch(e){case"left":case"right":a.overflowsBottom()&&(l="up");break;case"top":a.overflowsTop()&&(s="bottom");break;case"bottom":a.overflowsBottom()&&(s="top")}return{expandDirection:l,alignment:s}}(this.props.labelPos,e,this.props.topPosition,this.props.leftPosition,this.props.wrapperHeight);return t}render(){const t=this.props.hoverOnly?"hover-only":"",n=this.state.isExpanded?"is-expanded":"",r=this.state.expandable?"can-expand":"",i="1.5em"!=this.state.divHeight?"is-multiline":"",o=this.state.expandDirection?"expand-"+this.state.expandDirection:"",a=this.state.alignment||this.props.labelPos,l=this.props.navButtonFocused&&!this.context.extras.isEditor?"show-label":"",s=!this.context.extras.isEditor&&this.props.isHiddenBehindOverlay?"-1":void 0;return e.createElement("div",{className:"nav-label-container\n        ".concat(a," \n        ").concat(n," \n        ").concat(r," \n        ").concat(t," \n        ").concat(o," \n        ").concat(i," \n        ").concat(l,"\n        "),onDoubleClick:this.props.onDoubleClick},e.createElement("div",{style:{height:this.state.divHeight},"aria-hidden":"true",className:"nav-label",ref:this.navLabel},e.createElement("div",{ref:this.innerLabelDiv,style:{height:this.state.innerLabelHeight},className:"nav-label-inner",dangerouslySetInnerHTML:{__html:this.props.labelText}})),r&&!t&&e.createElement("button",{type:"button",onFocus:()=>this.props.onFocus(!0),onBlur:()=>this.props.onBlur(!1),ref:this.props.forwardRef,className:"nav-label-expand-button",tabIndex:s,"aria-label":this.context.l10n.expandButtonAriaLabel,onClick:this.onClick.bind(this)},e.createElement("div",{className:"nav-label-expand-arrow"})))}}function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}o.contextType=r;const l="h5p-info-button h5p-interaction-button",s=["H5P.AdvancedText","H5P.Image","H5P.Video"],u=(e,t)=>{const n=e.action.library,r=H5P.libraryFromString(n).machineName;let i="";if("H5P.GoToScene"===r){i="h5p-go-to-scene-button";const n=t.find((t=>t.sceneId===e.action.params.nextSceneId));n&&"plus"===n.iconType&&(i=l)}else i="H5P.Audio"===r?"h5p-audio-button h5p-interaction-button":(e=>s.includes(e))(r)?l:"h5p-question-button h5p-interaction-button";return i},c=e=>({...e.label,labelText:e.labelText});class d extends e.Component{constructor(t){super(t),a(this,"handleFocus",(e=>{this.context.extras.isEditor?this.navButtonWrapper&&this.navButtonWrapper.current&&this.navButtonWrapper===e.target&&this.navButtonWrapper.current.focus({preventScroll:!0}):!this.context.extras.isEditor&&this.props.onFocus&&(this.skipFocus?this.skipFocus=!1:this.props.onFocus())})),a(this,"handleGoToScene",(()=>{this.setState({isFocused:!1})})),a(this,"handleExpandButtonFocus",(()=>{this.setState({expandButtonFocused:!0}),this.props.onFocusedInteraction&&this.props.onFocus()})),this.navButtonWrapper=e.createRef(),this.navButton=e.createRef(),this.expandButton=e.createRef(),this.onBlur=this.onBlur.bind(this),this.onFocus=this.onFocus.bind(this),this.state={isFocused:this.props.isFocused,expandButtonFocused:!1,innerButtonFocused:!1}}addFocusListener(){this.navButtonWrapper&&this.navButtonWrapper.current.addEventListener("focus",this.onFocus)}onFocus(){this.state.isFocused||(this.setState({isFocused:!0}),this.props.onFocusedInteraction&&this.props.onFocusedInteraction())}onBlur(e){const t=this.navButtonWrapper&&this.navButtonWrapper.current;!t||!t.contains(e.relatedTarget)||this.expandButton&&e.relatedTarget===this.expandButton.current?(this.setState({isFocused:!1}),this.props.onBlur&&this.props.onBlur()):this.navButtonWrapper.current.focus({preventScroll:!0})}componentDidMount(){this.props.onMount&&this.props.onMount(this.navButtonWrapper.current),this.addFocusListener(),this.state.isFocused&&setTimeout((()=>{this.navButtonWrapper.current.focus({preventScroll:!0})}),0)}componentDidUpdate(e){this.props.type&&this.props.type===this.props.nextFocus&&e.nextFocus!==this.props.nextFocus&&(this.skipFocus=!0,this[this.context.extras.isEditor?"navButtonWrapper":"navButton"].current.focus({preventScroll:!0})),this.props.isFocused&&!e.isFocused&&setTimeout((()=>{this.navButtonWrapper.current&&this.navButtonWrapper.current.focus({preventScroll:!0})}),0),this.props.onUpdate&&this.props.onUpdate(this.navButtonWrapper.current),e.isFocused!==this.props.isFocused&&(this.props.isFocused||this.setState({isFocused:!1}))}componentWillUnmount(){if(this.navButtonWrapper&&this.navButtonWrapper.current.removeEventListener("focus",this.onFocus),this.props.onUnmount){const e=this.navButtonWrapper.current;setTimeout((()=>{this.props.onUnmount(e)}),0)}}getStyle(){const e={};return void 0!==this.props.topPosition&&(e.top=this.props.topPosition+"%"),void 0!==this.props.leftPosition&&(e.left=this.props.leftPosition+"%"),e}onClick(){(this.props.forceClickHandler||!this.context.extras.isEditor)&&(this.props.clickHandler(),this.setState({innerButtonFocused:!1}))}onDoubleClick(){this.props.doubleClickHandler&&this.props.doubleClickHandler(),this.setState({isFocused:!1})}onMouseDown(e){this.context.extras.isEditor&&this.props.mouseDownHandler&&this.props.mouseDownHandler(e)}setFocus(){this.context.extras.isEditor&&this.navButtonWrapper&&this.navButtonWrapper.current&&this.navButtonWrapper.current.focus({preventScroll:!0})}render(){let t=["nav-button-wrapper"];this.props.buttonClasses&&(t=t.concat(this.props.buttonClasses)),this.props.icon&&t.push(this.props.icon),this.state.isMouseOver&&t.push("hover"),this.state.isFocused&&this.props.children&&t.push("focused"),(this.state.isFocused&&this.props.children||this.state.expandButtonFocused||this.state.innerButtonFocused)&&t.push("active-element");const n=this.context.extras.isEditor,r=!this.context.extras.isEditor&&!this.props.isHiddenBehindOverlay;let i="";if(this.props.title){const e=document.createElement("div");e.innerHTML=this.props.title,i=e.textContent}let a=this.props.label?this.props.label:{labelPosition:"inherit",showLabel:"inherit"},l=((e,t)=>t&&t.labelPosition&&"inherit"!==t.labelPosition?t.labelPosition:e.labelPosition)(this.context.behavior.label,a),s=((e,t)=>"inherit"===t.showLabel?!e.showLabel:"show"!==t.showLabel)(this.context.behavior.label,a);const u=(e=>e&&e.labelText?e.labelText:"")(a);return e.createElement("div",{ref:this.navButtonWrapper,className:t.join(" "),style:this.getStyle(),tabIndex:n?"0":void 0,onFocus:this.handleFocus,onClick:this.onClick.bind(this),onBlur:this.onBlur.bind(this)},e.createElement("button",{type:"button",ref:this.navButton,"aria-label":u||i,className:"nav-button",tabIndex:r?void 0:"-1",onClick:this.onClick.bind(this),onDoubleClick:this.onDoubleClick.bind(this),onMouseDown:this.onMouseDown.bind(this),onMouseUp:this.setFocus.bind(this),onFocus:()=>this.setState({innerButtonFocused:!0}),onBlur:()=>this.setState({innerButtonFocused:!1})}),this.props.children,"h5p-go-back-button"!==this.props.icon&&""!==u&&e.createElement(o,{labelText:u,labelPos:l,hoverOnly:s,onMount:this.props.onMount,forwardRef:this.expandButton,onFocus:this.handleExpandButtonFocus.bind(this),onBlur:()=>this.setState({expandButtonFocused:!1}),topPosition:this.props.topPosition*this.props.wrapperHeight/100,wrapperHeight:this.props.wrapperHeight,leftPosition:this.props.leftPosition,navButtonHeight:this.navButton.current?this.navButton.current.offsetHeight:null,staticScene:this.props.staticScene,navButtonFocused:this.state.innerButtonFocused,rendered:this.props.rendered,onDoubleClick:this.onDoubleClick.bind(this)}))}}d.contextType=r;class p extends e.Component{goToScene(){this.context.trigger("goToScene",this.props.interactionIndex)}handlEdit(){this.context.trigger("editInteraction",this.props.interactionIndex)}handleDelete(){this.context.trigger("deleteInteraction",this.props.interactionIndex)}render(){return e.createElement("div",{className:"context-menu"},this.props.isGoToScene&&e.createElement("button",{type:"button",className:"go-to-scene",onClick:this.goToScene.bind(this),tabIndex:"-1"},e.createElement("div",{className:"tooltip",dangerouslySetInnerHTML:{__html:this.context.extras.l10n.goToScene}})),e.createElement("button",{type:"button",className:"edit",onClick:this.handlEdit.bind(this),tabIndex:"-1"},e.createElement("div",{className:"tooltip",dangerouslySetInnerHTML:{__html:this.context.extras.l10n.edit}})),e.createElement("button",{type:"button",className:"delete",onClick:this.handleDelete.bind(this),tabIndex:"-1"},e.createElement("div",{className:"tooltip",dangerouslySetInnerHTML:{__html:this.context.extras.l10n.delete}})))}}function f(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}p.contextType=r;const h={high:128,medium:64,low:16};class m extends e.Component{constructor(t){super(t),f(this,"handleSceneMoveStart",(e=>{if(!this.context.extras.isEditor||e.data.isCamera)return;const t=e.data.target;if(t){if(t.classList.contains("context-menu"))return e.defaultPrevented=!0,!1;if(t.parentNode&&t.parentNode.classList.contains("context-menu"))return e.defaultPrevented=!0,!1}if(t&&(t.classList.contains("nav-button")||t.classList.contains("nav-label-container")||t.classList.contains("nav-label")||t.classList.contains("nav-label-inner"))){const t=e.data.element;this.initializePointerLock(t)}})),f(this,"handleSceneMoveStop",(e=>{this.context.extras.isEditor&&this.cancelPointerLock(),this.context.trigger("movestop",e.data)})),f(this,"initializeThreeSixty",(()=>{let e,t=this.state.cameraPosition;if(!t){const e=this.props.sceneParams.cameraStartPosition.split(",").map(parseFloat);t={yaw:e[0],pitch:e[1]}}this.props.threeSixty?(e=this.props.threeSixty,e.setSourceElement(this.imageElement),e.setCameraPosition(t.yaw,t.pitch)):(e=new H5P.ThreeSixty(this.imageElement,{ratio:16/9,cameraStartPosition:t,segments:h[this.context.sceneRenderingQuality]}),this.props.addThreeSixty(e)),e.setAriaLabel(this.props.sceneParams.scenename),this.sceneRef.current.appendChild(e.getElement()),e.resize(this.context.getRatio()),e.on("firstrender",(()=>{this.setState({isRendered:!0}),e.focus()})),e.startRendering(),e.update(),e.on("movestart",this.handleSceneMoveStart),e.on("movestop",this.handleSceneMoveStop),this.addInteractionHotspots(e,this.props.sceneParams.interactions)})),f(this,"sceneLoaded",(()=>{this.state.isLoaded&&this.state.isUpdated&&this.props.isActive?this.props.threeSixty.update():this.setState({isLoaded:!0})})),f(this,"createInteraction",((t,n)=>{const r=["three-sixty"];let i;this.props.audioIsPlaying==="interaction-"+this.props.sceneId+"-"+n&&r.push("active");const o="H5P.GoToScene"===t.action.library.split(" ")[0];return i=o?this.context.params.scenes.find((e=>e.sceneId===t.action.params.nextSceneId)).scenename:this.getInteractionTitle(t.action),e.createElement(d,{key:"interaction-"+this.props.sceneId+n,onMount:e=>this.props.threeSixty.add(e,m.getPositionFromString(t.interactionpos),this.context.extras.isEditor),onUnmount:e=>this.props.threeSixty.remove(this.props.threeSixty.find(e)),onUpdate:e=>H5P.ThreeSixty.setElementPosition(this.props.threeSixty.find(e),m.getPositionFromString(t.interactionpos)),title:i,label:c(t),buttonClasses:r,icon:u(t,this.context.params.scenes),isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus,type:"interaction-"+n,clickHandler:this.props.showInteraction.bind(this,n),doubleClickHandler:()=>{this.context.trigger("doubleClickedInteraction",n)},onFocus:()=>{this.handleInteractionFocus(t)},onFocusedInteraction:this.props.onFocusedInteraction.bind(this,n),onBlur:this.props.onBlurInteraction,isFocused:this.props.focusedInteraction===n,rendered:this.state.isUpdated},this.context.extras.isEditor&&e.createElement(p,{isGoToScene:o,interactionIndex:n}))})),f(this,"handleInteractionFocus",(e=>{this.props.onSetCameraPos(e.interactionpos)})),this.sceneRef=e.createRef(),this.renderedInteractions=0,this.state={imagePath:null,isLoaded:!1,isUpdated:!1,isRendered:!1,cameraPosition:null,pointerLockElement:null,willPointerLock:!1,hasPointerLock:!1}}initializePointerLock(e){e.requestPointerLock=e.requestPointerLock||e.mozRequestPointerLock,e.requestPointerLock&&(this.pointerLockTimeout&&this.pointerLockTimeout.current||(this.setState({willPointerLock:!0,pointerLockElement:e}),this.pointerLockTimeout=setTimeout((()=>{this.setState({hasPointerLock:!0})}),100)))}cancelPointerLock(){this.setState({willPointerLock:!1,hasPointerLock:!1})}getInteractionTitle(e){const t=e.metadata.title;switch(t){case"Untitled Text":return e.params.text;case"Untitled Image":return e.params.alt;default:return t}}loadScene(){if(this.imageElement||(this.imageElement=document.createElement("img"),this.imageElement.addEventListener("load",this.sceneLoaded)),this.setState({imagePath:this.props.imageSrc.path,isRendered:!1}),void 0!==H5P.setSource)H5P.setSource(this.imageElement,this.props.imageSrc,this.context.contentId);else{const e=H5P.getPath(this.props.imageSrc.path,this.context.contentId);if(void 0!==H5P.getCrossOrigin){const t=H5P.getCrossOrigin(e);t&&this.imageElement.setAttribute("crossorigin",t)}this.imageElement.src=e}}addInteractionHotspots(n,i){const o=i?i.map(this.createInteraction):[];this.renderedInteractions=o.length,t.render(e.createElement(r.Provider,{value:this.context},o),n.getCameraElement())}static getPositionFromString(e){return{yaw:(e=e.split(","))[0],pitch:e[1]}}componentDidMount(){this.loadScene(),this.context.on("doubleClickedInteraction",(()=>{this.cancelPointerLock()}))}componentDidUpdate(e){(this.props.isActive&&this.state.isLoaded&&!this.state.isUpdated||this.props.isActive&&this.props.updateThreeSixty)&&(setTimeout((()=>{this.initializeThreeSixty()}),40),this.setState({isUpdated:!0})),this.state.imagePath!==this.props.imageSrc.path&&this.loadScene(),e.isActive&&!this.props.isActive&&(this.props.threeSixty.stopRendering(),this.props.threeSixty.off("movestart",this.handleSceneMoveStart),this.props.threeSixty.off("movestop",this.handleSceneMoveStop),this.props.threeSixty.off("firstrender"),this.setState({cameraPosition:this.props.threeSixty.getCurrentPosition(),isUpdated:!1,isRendered:!1})),this.state.hasPointerLock?this.state.willPointerLock?(this.state.pointerLockElement.requestPointerLock(),this.state.pointerLockElement.classList.add("dragging")):this.setState({willPointerLock:!1,hasPointerLock:!1}):(document.exitPointerLock=document.exitPointerLock||document.mozExitPointerLock,document.exitPointerLock&&(this.state.pointerLockElement&&this.state.pointerLockElement.classList.remove("dragging"),document.exitPointerLock()));const t=this.props.isHiddenBehindOverlay!==e.isHiddenBehindOverlay;if(t&&this.state.isUpdated&&this.props.threeSixty.setTabIndex(!1),this.props.threeSixty&&this.props.isActive){const n=e.audioIsPlaying!==this.props.audioIsPlaying,r=e.focusedInteraction!==this.props.focusedInteraction;let i=this.props.sceneParams.interactions&&this.renderedInteractions!==this.props.sceneParams.interactions.length||n||r||t||this.props.isEditingInteraction;window.H5PEditor&&!i&&this.props.sceneParams.interactions&&(i=this.props.sceneParams.interactions.some((t=>{if("H5P.GoToScene"===H5P.libraryFromString(t.action.library).machineName){const n=t.action.params.nextSceneId,r=this.props.sceneIcons.find((e=>e.id===n)),i=e.sceneIcons.find((e=>e.id===n));if(r&&i&&r.iconType!==i.iconType)return!0}return!1}))),i&&this.addInteractionHotspots(this.props.threeSixty,this.props.sceneParams.interactions)}}render(){return this.props.isActive?e.createElement("div",{className:"three-sixty-scene-wrapper"},e.createElement("div",{ref:this.sceneRef,"aria-hidden":!!this.props.isHiddenBehindOverlay||void 0}),!this.state.isRendered&&e.createElement("div",{className:"loading-overlay"},e.createElement("div",{className:"loading-wrapper"},e.createElement("div",{className:"loading-image-wrapper"},e.createElement("img",{src:"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIwLjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA5MjguNyA5MjguNyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgOTI4LjcgOTI4Ljc7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7Y2xpcC1wYXRoOnVybCgjU1ZHSURfMl8pO30KCS5zdDF7ZmlsbDojNUJBNEUyO30KCS5zdDJ7ZmlsbDp1cmwoI1NWR0lEXzNfKTt9Cjwvc3R5bGU+CjxnPgoJPGRlZnM+CgkJPHJlY3QgaWQ9IlNWR0lEXzFfIiB3aWR0aD0iOTI4LjYiIGhlaWdodD0iOTI4LjYiLz4KCTwvZGVmcz4KCTxjbGlwUGF0aCBpZD0iU1ZHSURfMl8iPgoJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzFfIiAgc3R5bGU9Im92ZXJmbG93OnZpc2libGU7Ii8+Cgk8L2NsaXBQYXRoPgoJPGcgY2xhc3M9InN0MCI+CgkJPHBhdGggY2xhc3M9InN0MSIgZD0iTTM4LjcsNDg4LjhoNDguN2MtMC42LTkuOC0wLjktMTkuOC0wLjctMjkuOEM4OS41LDI1Mi4yLDI1OS40LDg1LjYsNDY2LjEsODYuNgoJCQljOTAuOSwwLjQsMTc0LjIsMzIuOSwyMzkuMSw4Ni44YzEwLDguMywyNC44LDcuMywzMy41LTIuNGwwLjMtMC4zYzktMTAuMiw3LjktMjUuOC0yLjYtMzQuNWMtNzQuNy02Mi0xNzAuOC05OC45LTI3NS42LTk4LjEKCQkJQzIyNC41LDM5LjksMzUuNiwyMzIuNCwzOCw0NjguN0MzOC4xLDQ3NS40LDM4LjMsNDgyLjIsMzguNyw0ODguOHoiLz4KCTwvZz4KCTxnIGNsYXNzPSJzdDAiPgoJCTxnPgoJCQk8Zz4KCQkJCQoJCQkJCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfM18iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iODIuMjMzMyIgeTE9IjM0MC40MjA0IiB4Mj0iNDI2LjIzMzIiIHkyPSI3NC40MjA0IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgOTI5LjMyMDEpIj4KCQkJCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNUJBNEUyIi8+CgkJCQkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzFCMUQyQztzdG9wLW9wYWNpdHk6MCIvPgoJCQkJPC9saW5lYXJHcmFkaWVudD4KCQkJCTxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik01NjcuOCw4NTAuOWMtMy43LTExLjgtMTUuNy0xOC45LTI3LjgtMTYuNGMtMjQuNSw1LTQ5LjgsNy42LTc1LjcsNy42Yy0yMDMuMiwwLTM2OS0xNjAuNS0zNzcuNC0zNjEuNgoJCQkJCUgzOC4zYzguNSwyMjgsMTk2LDQxMC4yLDQyNiw0MTAuMmMyOS4zLDAsNTcuOS0zLDg1LjUtOC42YzEzLjktMi44LDIyLjMtMTcuMiwxOC4xLTMwLjdMNTY3LjgsODUwLjl6Ii8+CgkJCTwvZz4KCQk8L2c+Cgk8L2c+CjwvZz4KPC9zdmc+Cg==",alt:"loading"})),e.createElement("div",{className:"loader",dangerouslySetInnerHTML:{__html:this.context.l10n.backgroundLoading}})))):null}}m.contextType=r;class g extends e.Component{constructor(t){super(t),this.sceneWrapperRef=e.createRef(),this.imageElementRef=e.createRef(),this.overLayRef=e.createRef(),this.state={x:null,y:null,draggingInteractionIndex:null,isDragDelayed:!0,draggingElement:null,isVerticalImage:!1},this.onMove=this.onMove.bind(this),this.stoppedDragging=this.stoppedDragging.bind(this)}componentDidMount(){this.context.on("resize",(()=>{this.resizeScene()})),this.resizeScene(),this.props.isActive&&null!==this.props.sceneWaitingForLoad&&this.props.doneLoadingNextScene()}componentDidUpdate(){this.props.isActive&&null!==this.props.sceneWaitingForLoad&&this.props.doneLoadingNextScene(),null!==this.sceneWrapperRef.current&&this.sceneWrapperRef.current.clientWidth!==this.imageElementRef.current.clientWidth&&this.imageElementRef.current.clientWidth>0&&(this.sceneWrapperRef.current.style.width="".concat(this.imageElementRef.current.clientWidth,"px"))}resizeScene(){if(!this.sceneWrapperRef||!this.sceneWrapperRef.current)return;const e=this.sceneWrapperRef.current,t=e.getBoundingClientRect();if(this.sceneWrapperRef.current.style.width="100%",this.imageElementRef.current.clientWidth>0&&(this.sceneWrapperRef.current.style.width="".concat(this.imageElementRef.current.clientWidth,"px")),t.width>938){const t=e.style.fontSize;return void(16!==parseFloat(t)&&(this.sceneWrapperRef.current.style.fontSize="".concat(16,"px"),this.forceUpdate()))}let n=16-(938-t.width)/55;n<14&&(n=14),this.sceneWrapperRef.current.style.fontSize="".concat(n,"px"),this.forceUpdate()}getWrapperSize(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],t=this.sceneWrapperRef.current;if(t)return e?t.clientHeight:t.clientWidth}getDraggingInteraction(){return null!==this.state.draggingInteractionIndex&&this.props.sceneParams.interactions[this.state.draggingInteractionIndex]}getMouseMovedPercentages(e){let t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=this.startX,r=this.getWrapperSize(t),i=e.clientX;return t&&(n=this.startY,i=e.clientY),(n-i)/r*100}removePercentageDenotationFromPosition(e){return"%"===e.charAt(e.length-1)&&e.substr(0,e.length-1)}getPositions(e){const t=e.split(",");return{x:t[0],y:t[1]}}getNewInteractionPosition(e,t,n){let r=arguments.length>3&&void 0!==arguments[3]&&arguments[3],i=e.x,o=this.getMouseMovedPercentages(t,r),a=this.getWrapperSize(r);r&&(i=e.y),i=this.removePercentageDenotationFromPosition(i);const l=i-o;if(l<0)return 0;const s=n.getBoundingClientRect(),u=100-(r?s.height:s.width)/a*100;return l>=u?u:l}getNewInteractionPositions(e){const t=this.getDraggingInteraction(),n=this.getPositions(t.interactionpos);return{x:this.getNewInteractionPosition(n,e,this.state.draggingElement),y:this.getNewInteractionPosition(n,e,this.state.draggingElement,!0)}}startDragging(e,t){0===t.button&&(this.startX=t.clientX,this.startY=t.clientY,window.addEventListener("mousemove",this.onMove),window.addEventListener("mouseup",this.stoppedDragging),this.setState({draggingInteractionIndex:e,draggingElement:t.target,isDragDelayed:!0}),setTimeout((()=>{this.setState({isDragDelayed:!1})}),50))}onMove(e){const t=null!==this.state.draggingInteractionIndex,n=this.state.isDragDelayed;t&&!n&&this.setState(this.getNewInteractionPositions(e))}stoppedDragging(){null!==this.state.draggingInteractionIndex&&(window.removeEventListener("mousemove",this.onMove),window.removeEventListener("mouseup",this.stoppedDragging),null!==this.state.x&&null!==this.state.y?(this.getDraggingInteraction().interactionpos=[this.state.x+"%",this.state.y+"%"].join(","),this.setState({x:null,y:null,draggingInteractionIndex:null,draggingElement:null,isDragDelayed:!0})):this.setState({x:null,y:null,draggingInteractionIndex:null,draggingElement:null,isDragDelayed:!0}))}goToPreviousScene(){this.props.sceneHistory.length>0&&this.props.navigateToScene(y.PREVIOUS_SCENE)}onSceneLoaded(){const e=this.imageElementRef.current,t=e.naturalWidth/e.naturalHeight;this.setState({isVerticalImage:t<this.context.getRatio()}),e.focus(),this.context.on("resize",(()=>{this.setState({isVerticalImage:t<this.context.getRatio()})}))}getInteractionTitle(e){const t=e.metadata.title;switch(t){case"Untitled Text":return e.params.text;case"Untitled Image":return e.params.alt;default:return t}}getAdjustedInteractionPositions(e,t){const n=this.sceneWrapperRef.current,r=n.getBoundingClientRect();if(!r.width||!r.height)return!1;const i=2.5*parseFloat(n.style.fontSize),o=i/r.height*100;t+o>100&&(t=100-o);const a=i/r.width*100;return e+a>100&&(e=100-a),{posX:e,posY:t}}massageAttributeOutput(e){const t=(new DOMParser).parseFromString(e,"text/html"),n=document.createElement("div");return n.innerHTML=t.documentElement.textContent,n.textContent||n.innerText||""}render(){if(!this.props.isActive)return null;const t=this.props.sceneParams.interactions||[],n=this.props.sceneHistory.length>0,r=this.props.sceneParams.showBackButton&&(n||this.context.extras.isEditor),i=this.context.extras.isEditor&&!n?["disabled"]:[],o=["image-scene-wrapper"];return this.state.isVerticalImage&&o.push("vertical"),e.createElement("div",{ref:this.overLayRef,className:"image-scene-overlay","aria-hidden":!!this.props.isHiddenBehindOverlay||void 0},e.createElement("div",{className:o.join(" "),ref:this.sceneWrapperRef},e.createElement("img",{tabIndex:"-1",alt:this.massageAttributeOutput(this.props.sceneParams.scenename),className:"image-scene",src:H5P.getPath(this.props.imageSrc.path,this.context.contentId),onLoad:this.onSceneLoaded.bind(this),ref:this.imageElementRef}),t.map(((t,n)=>{const r=this.getPositions(t.interactionpos);let i=this.removePercentageDenotationFromPosition(r.x),o=this.removePercentageDenotationFromPosition(r.y);null!==this.state.x&&null!==this.state.y&&this.state.draggingInteractionIndex===n&&(i=this.state.x,o=this.state.y);const a=[];if(this.props.audioIsPlaying==="interaction-"+this.props.sceneId+"-"+n&&a.push("active"),this.state.draggingInteractionIndex===n&&a.push("dragging"),i>91.5&&a.push("left-aligned"),this.sceneWrapperRef&&this.sceneWrapperRef.current){const e=this.getAdjustedInteractionPositions(parseFloat(i),parseFloat(o));e&&(i=e.posX,o=e.posY)}let l;const s="H5P.GoToScene"===H5P.libraryFromString(t.action.library).machineName,f=this.context.params.scenes;return l=s?f.find((e=>e.sceneId===t.action.params.nextSceneId)).scenename:this.getInteractionTitle(t.action),e.createElement(d,{key:n,title:l,icon:u(t,f),label:c(t),type:"interaction-"+n,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus,topPosition:o,leftPosition:i,mouseDownHandler:this.startDragging.bind(this,n),clickHandler:this.props.showInteraction.bind(this,n),doubleClickHandler:()=>{this.context.trigger("doubleClickedInteraction",n)},buttonClasses:a,onBlur:this.props.onBlurInteraction,isFocused:this.props.focusedInteraction===n,wrapperHeight:this.overLayRef.current?this.overLayRef.current.clientHeight:0,staticScene:!0},this.context.extras.isEditor&&e.createElement(p,{isGoToScene:s,interactionIndex:n}))}))),r&&e.createElement(d,{title:"Back",icon:"h5p-go-back-button",isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,clickHandler:this.goToPreviousScene.bind(this),forceClickHandler:!0,buttonClasses:i}))}}g.contextType=r;const y={THREE_SIXTY_SCENE:"360",STATIC_SCENE:"static",PREVIOUS_SCENE:-1};class v extends e.Component{render(){return this.props.sceneParams.sceneType===y.STATIC_SCENE?e.createElement(g,{isActive:this.props.isActive,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus,sceneIcons:this.props.sceneIcons,sceneParams:this.props.sceneParams,imageSrc:this.props.imageSrc,navigateToScene:this.props.navigateToScene.bind(this),showInteraction:this.props.showInteraction.bind(this),sceneHistory:this.props.sceneHistory,audioIsPlaying:this.props.audioIsPlaying,sceneId:this.props.sceneId,onBlurInteraction:this.props.onBlurInteraction,onFocusedInteraction:this.props.onFocusedInteraction,focusedInteraction:this.props.focusedInteraction,sceneWaitingForLoad:this.props.sceneWaitingForLoad,doneLoadingNextScene:this.props.doneLoadingNextScene}):e.createElement(m,{threeSixty:this.props.threeSixty,updateThreeSixty:this.props.updateThreeSixty,isActive:this.props.isActive,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus,sceneIcons:this.props.sceneIcons,sceneParams:this.props.sceneParams,addThreeSixty:this.props.addThreeSixty,imageSrc:this.props.imageSrc,navigateToScene:this.props.navigateToScene.bind(this),forceStartCamera:this.props.forceStartCamera,showInteraction:this.props.showInteraction.bind(this),audioIsPlaying:this.props.audioIsPlaying,sceneId:this.props.sceneId,toggleCenterScene:this.props.toggleCenterScene,onSetCameraPos:this.props.onSetCameraPos,onBlurInteraction:this.props.onBlurInteraction,onFocusedInteraction:this.props.onFocusedInteraction,focusedInteraction:this.props.focusedInteraction,isEditingInteraction:this.props.isEditingInteraction,sceneWaitingForLoad:this.props.sceneWaitingForLoad,doneLoadingNextScene:this.props.doneLoadingNextScene})}}v.contextType=r;class b extends e.Component{constructor(e){var t,n;super(e),n=()=>{this.props.disabled||this.props.onClick()},(t="handleClick")in this?Object.defineProperty(this,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):this[t]=n}componentDidUpdate(e,t){e.nextFocus!==this.props.nextFocus&&this.props.type===this.props.nextFocus&&this.element.focus()}render(){return e.createElement("div",{className:"btn-wrap"},e.createElement("button",{type:"button",ref:e=>this.element=e,className:"hud-btn "+this.props.type,onClick:this.handleClick,"aria-label":this.props.label,disabled:!!this.props.disabled,tabIndex:this.props.isHiddenBehindOverlay?"-1":void 0}),e.createElement("div",{className:"tooltip","aria-hidden":"true"},e.createElement("div",{className:"text-wrap"},this.props.label)))}}function x(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}class S extends e.Component{constructor(e){super(e),x(this,"getPlayerId",(e=>void 0!==e.sceneId&&e.sceneAudioTrack&&e.sceneAudioTrack.length?"scene-"+e.sceneId:this.context.behavior.audio&&this.context.behavior.audio.length?"global":void 0)),x(this,"getTrack",(e=>"global"===e?this.context.behavior.audio:this.props.sceneAudioTrack)),x(this,"getPlayer",(e=>e?(void 0===this.players[e]&&(this.players[e]=S.createAudioPlayer(this.context.contentId,this.getTrack(e),(()=>this.props.onIsPlaying(e)),(()=>{this.props.isPlaying===e&&this.props.onIsPlaying(null)}),!0)),this.players[e]):null)),x(this,"handleClick",(()=>{const e=this.getPlayerId(this.props),t=this.getPlayer(e);t&&(e===this.props.isPlaying?t.pause():t.play())})),x(this,"handlePlay",(()=>{this.setState({isPlaying:!0})})),x(this,"handleStop",(()=>{this.setState({isPlaying:!1})})),this.players={}}componentDidUpdate(e){if(this.props.isPlaying&&this.props.isPlaying!==e.isPlaying&&S.isSceneAudio(e.isPlaying)){const t=this.getPlayer(e.isPlaying);t&&t.pause()}if(S.isSceneAudio(this.props.isPlaying)){const e=this.getPlayerId(this.props);if(this.props.isPlaying!==e){const t=this.getPlayer(this.props.isPlaying);t&&t.pause();const n=this.getPlayer(e);n&&n.play()}}}render(){const t=this.getPlayerId(this.props);if(!t)return null;const n="audio-track"+(this.props.isPlaying===t?" active":"");return e.createElement(b,{type:n,label:this.props.isPlaying===t?this.context.l10n.pauseAudioTrack:this.context.l10n.playAudioTrack,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,onClick:this.handleClick})}static isSceneAudio(e){return e&&("global"===e||"scene-"===e.substr(0,6))}static isInteractionAudio(e){return e&&"interaction-"===e.substr(0,12)}static isVideoAudio(e){return e&&"video-"===e.substr(0,6)}static createAudioPlayer(e,t,n,r,i){let o=document.createElement("audio");if(void 0!==o.canPlayType)for(var a=0;a<t.length;a++)if(o.canPlayType(t[a].mime)){var l=document.createElement("source");l.src=H5P.getPath(t[a].path,e),l.type=t[a].mime,o.appendChild(l)}return o.children.length?(o.controls=!1,o.preload="auto",o.loop=i,o.addEventListener("play",n),o.addEventListener("ended",r),o.addEventListener("pause",r)):o=null,o}}S.contextType=r;class w extends e.Component{constructor(e){super(e),this.state={isInitialized:!1}}componentDidUpdate(e){this.props.audioIsPlaying&&this.props.audioIsPlaying!==e.audioIsPlaying&&S.isVideoAudio(e.audioIsPlaying)&&(S.isVideoAudio(this.props.audioIsPlaying)||this.instance.pause())}initializeContent(e){if(!e||this.state.isInitialized)return;for(;e.firstChild;)e.removeChild(e.firstChild);const t=this.context.params.scenes.find((e=>e.sceneId===this.props.currentScene)),n=t.interactions[this.props.currentInteraction].action;if(this.instance=H5P.newRunnable(n,this.context.contentId,H5P.jQuery(e)),"H5P.Video"===n.library.split(" ")[0]&&this.instance.on("stateChange",(e=>{e.data===H5P.Video.PLAYING&&this.props.onAudioIsPlaying("video-"+t.sceneId+"-"+this.props.currentInteraction)})),this.setState({isInitialized:!0}),"H5P.Image"===this.instance.libraryInfo.machineName){const t=e.children[0],n=this.context.getRect(),r=n.width/n.height,i=this.instance.width/this.instance.height>r;t.style.width=i?"100%":"auto",t.style.height=i?"auto":"100%",this.instance.on("loaded",(()=>this.props.onResize(!i)))}this.instance.on("resize",(()=>this.props.onResize()))}render(){return e.createElement("div",{ref:e=>this.initializeContent(e)})}}function k(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}w.contextType=r;class E extends e.Component{constructor(e){super(e),k(this,"handleDialogRef",(e=>{e&&(this.el=e)})),k(this,"handleResize",(e=>{this.el&&(this.el.style.width="",this.el.style.height="",this.el.style.height=this.el.getBoundingClientRect().height+"px")}))}componentDidMount(){this.title.focus()}render(){let t=["h5p-text-dialog"];this.props.dialogClasses&&(t=t.concat(this.props.dialogClasses));const n="div"===this.props.children.type?this.props.children:e.Children.map(this.props.children,(t=>e.cloneElement(t,{onResize:this.handleResize})));return e.createElement("div",{className:"h5p-text-overlay",role:"dialog","aria-label":this.props.title},e.createElement("div",{ref:e=>this.title=e,className:"h5p-dialog-focusstart",tabIndex:"-1"}),e.createElement("div",{className:t.join(" "),ref:this.handleDialogRef},e.createElement("div",{className:"h5p-text-content"},n),e.createElement("button",{type:"button",ref:e=>this.closeButton=e,"aria-label":this.context.l10n.closeDialog,className:"close-button-wrapper",onClick:this.props.onHideTextDialog})))}}function T(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}E.contextType=r;class P extends e.Component{constructor(e){super(e),T(this,"getSceneAudioTrack",(e=>{const t={isPlaying:this.props.audioIsPlaying,onIsPlaying:this.props.onAudioIsPlaying,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus};return e&&e.audio&&e.audio.length&&(t.sceneAudioTrack=e.audio,t.sceneId=e.sceneId),t})),T(this,"handleSceneDescription",(()=>{this.props.onSceneDescription(this.props.scene.scenedescription)})),this.buttons={}}render(){const t=this.props.scene.sceneType===y.THREE_SIXTY_SCENE;return e.createElement("div",{className:"hud","aria-hidden":!!this.props.isHiddenBehindOverlay||void 0},e.createElement("div",{className:"hud-top-right"}),e.createElement("div",{className:"hud-bottom-left"},e.createElement(S,this.getSceneAudioTrack(this.props.scene)),this.props.scene.scenedescription&&e.createElement(b,{type:"scene-description",label:this.context.l10n.sceneDescription,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus,onClick:this.handleSceneDescription}),t&&e.createElement(b,{type:"reset",label:this.context.l10n.resetCamera,isHiddenBehindOverlay:this.props.isHiddenBehindOverlay,nextFocus:this.props.nextFocus,onClick:this.props.onCenterScene}),!1))}}P.contextType=r;var C=n(615);const I=t=>{let{label:n}=t;return e.createElement("div",{className:"no-scene-container"},e.createElement("div",{className:"no-scene-wrapper"},e.createElement("div",{className:"title",dangerouslySetInnerHTML:{__html:n}})))};I.propTypes={label:n.n(C)().string.isRequired};const N=I;function L(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}class _ extends e.Component{constructor(e){super(e),L(this,"handleSceneDescription",(e=>{this.setState({showingTextDialog:!0,currentText:e,nextFocus:null})})),L(this,"handleCloseTextDialog",(()=>{this.setState({showingTextDialog:!1,currentText:null,nextFocus:"scene-description"})})),L(this,"getAudioPlayer",((e,t)=>{if(void 0===this.audioPlayers[e]){if(!(t&&t.action&&t.action.params&&t.action.params.files&&t.action.params.files.length))return;this.audioPlayers[e]=S.createAudioPlayer(this.context.contentId,t.action.params.files,(()=>{this.setState({audioIsPlaying:e})}),(()=>{this.state.audioIsPlaying===e&&this.setState({audioIsPlaying:null})}),!1)}return this.audioPlayers[e]})),L(this,"addThreeSixty",(e=>{this.props.addThreeSixty(e),this.setState({threeSixty:e})})),L(this,"handleAudioIsPlaying",(e=>{this.setState({audioIsPlaying:e})})),this.audioPlayers={},this.state={threeSixty:null,showingTextDialog:!1,currentText:null,showingInteraction:!1,currentInteraction:null,sceneHistory:[],audioIsPlaying:null,focusedInteraction:null,isEditingInteraction:!1,nextFocus:null,sceneWaitingForLoad:null,updateThreeSixty:!1,labelBehavior:{showLabel:!0,labelPosition:"right"}}}componentDidMount(){this.context.on("focusInteraction",(e=>{this.setState({focusedInteraction:e.data[0],isEditingInteraction:e.data[1]})})),this.context.on("updateEditStateInteraction",(()=>{this.setState({isEditingInteraction:!1})}))}componentDidUpdate(e,t){this.state.updateThreeSixty&&this.setState({updateThreeSixty:!1}),this.state.labelBehavior&&this.context.behavior.label&&(this.state.labelBehavior.showLabel===this.context.behavior.label.showLabel&&this.state.labelBehavior.labelPosition===this.context.behavior.label.labelPosition||this.setState({labelBehavior:{showLabel:this.context.behavior.label.showLabel,labelPosition:this.context.behavior.label.labelPosition},updateThreeSixty:!0}));const n=this.context.params.scenes.map((e=>e.sceneId)),r=this.state.sceneHistory.filter((e=>n.includes(e)));if(this.state.sceneHistory.length!==r.length){let e=r[r.length-1];for(;e===this.props.currentScene;)r.pop(),e=r.length?r[r.length-1]:null;this.setState({sceneHistory:r})}if(this.props.currentScene!==e.currentScene){if(this.skipHistory)return void(this.skipHistory=!1);this.setState({sceneHistory:[...this.state.sceneHistory,e.currentScene]})}if(this.state.audioIsPlaying&&this.state.audioIsPlaying!==t.audioIsPlaying&&S.isInteractionAudio(t.audioIsPlaying)){const e=this.getAudioPlayer(t.audioIsPlaying);e&&(e.pause(),e.currentTime=0)}}setFocusedInteraction(e){this.setState({focusedInteraction:e})}blurInteraction(){this.setState({focusedInteraction:null})}navigateToScene(e){this.setState({sceneWaitingForLoad:this.props.currentScene,focusedInteraction:null});let t=null;if(e===y.PREVIOUS_SCENE){const e=[...this.state.sceneHistory];t=e.pop(),this.skipHistory=!0,this.setState({sceneHistory:e})}else t=this.context.params.scenes.find((t=>t.sceneId===e)).sceneId;if(this.state.audioIsPlaying&&S.isInteractionAudio(this.state.audioIsPlaying)){const e=this.getAudioPlayer(this.state.audioIsPlaying);e&&(e.pause(),e.currentTime=0)}this.props.setCurrentSceneId(t)}showInteraction(e){const t=this.context.params.scenes.find((e=>e.sceneId===this.props.currentScene)),n=t.interactions[e],r=H5P.libraryFromString(n.action.library).machineName;if("H5P.GoToScene"===r){const e=parseInt(n.action.params.nextSceneId);this.navigateToScene(e)}else if("H5P.Audio"===r){const r="interaction-"+t.sceneId+"-"+e;if(this.state.audioIsPlaying===r){const e=this.getAudioPlayer(r);e&&(e.pause(),e.currentTime=0)}else{const e=this.getAudioPlayer(r,n);e&&e.play()}}else this.setState({showingInteraction:!0,currentInteraction:e,nextFocus:null})}hideInteraction(){this.setState((e=>({showingInteraction:!1,currentInteraction:null,nextFocus:"interaction-"+e.currentInteraction})))}centerScene(){const e=this.context.params.scenes.find((e=>e.sceneId===this.props.currentScene));e&&this.props.onSetCameraPos(e.cameraStartPosition,!0)}doneLoadingNextScene(){this.setState({sceneWaitingForLoad:null})}render(){const t=this.context.params.scenes;if(!t)return e.createElement(N,{label:this.context.l10n.noContent});const n=t.find((e=>e.sceneId===this.props.currentScene));if(!n)return null;let r=[];if(this.state.showingInteraction&&null!==this.state.currentInteraction){const e=this.context.params.scenes.find((e=>e.sceneId===this.props.currentScene)).interactions[this.state.currentInteraction],t=H5P.libraryFromString(e.action.library).machineName.replace(".","-").toLowerCase();r.push(t)}const i=this.state.showingInteraction&&null!==this.state.currentInteraction,o=this.state.showingTextDialog&&this.state.currentText,a=i||o;let l;i&&(l=n.interactions[this.state.currentInteraction].action.metadata.title);const s=this.context.params.scenes.map((e=>({id:e.sceneId,iconType:e.iconType})));return e.createElement("div",{role:"document","aria-label":this.context.l10n.title},i&&e.createElement(E,{title:l,onHideTextDialog:this.hideInteraction.bind(this),dialogClasses:r},e.createElement(w,{currentScene:this.props.currentScene,currentInteraction:this.state.currentInteraction,audioIsPlaying:this.state.audioIsPlaying,onAudioIsPlaying:this.handleAudioIsPlaying})),o&&e.createElement(E,{title:this.context.l10n.sceneDescription,onHideTextDialog:this.handleCloseTextDialog},e.createElement("div",{dangerouslySetInnerHTML:{__html:this.state.currentText}})),this.context.params.scenes.map((t=>e.createElement(v,{key:t.sceneId,threeSixty:this.state.threeSixty,updateThreeSixty:this.state.updateThreeSixty,isActive:t.sceneId===this.props.currentScene,isHiddenBehindOverlay:a,sceneIcons:s,sceneParams:t,nextFocus:this.state.nextFocus,addThreeSixty:this.addThreeSixty,imageSrc:t.scenesrc,navigateToScene:this.navigateToScene.bind(this),forceStartCamera:this.props.forceStartCamera,showInteraction:this.showInteraction.bind(this),sceneHistory:this.state.sceneHistory,audioIsPlaying:this.state.audioIsPlaying,sceneId:t.sceneId,onSetCameraPos:this.props.onSetCameraPos,onBlurInteraction:this.blurInteraction.bind(this),onFocusedInteraction:this.setFocusedInteraction.bind(this),focusedInteraction:this.state.focusedInteraction,isEditingInteraction:this.state.isEditingInteraction,sceneWaitingForLoad:this.state.sceneWaitingForLoad,doneLoadingNextScene:this.doneLoadingNextScene.bind(this)}))),e.createElement(P,{scene:n,audioIsPlaying:this.state.audioIsPlaying,isHiddenBehindOverlay:a,nextFocus:this.state.nextFocus,onAudioIsPlaying:this.handleAudioIsPlaying,onSceneDescription:this.handleSceneDescription,onSubmitDialog:()=>console.error("Please implement SubmitDialog"),onCenterScene:this.centerScene.bind(this)}))}}_.contextType=r,H5P=H5P||{},H5P.ThreeImage=function(n,i,o){var a=this;let l;o=o||{},this.forceStartScreen=void 0!==o.forceStartScreen&&o.forceStartScreen>=0?o.forceStartScreen:null,this.forceStartCamera=void 0!==o.forceStartCamera?o.forceStartCamera:null,H5P.EventDispatcher.call(self),this.behavior={label:{showLabel:!1,labelPosition:"right",...n.behaviour.label},...n.behaviour},this.l10n={title:"Virtual Tour",playAudioTrack:"Play Audio Track",pauseAudioTrack:"Pause Audio Track",sceneDescription:"Scene Description",resetCamera:"Reset Camera",submitDialog:"Submit Dialog",closeDialog:"Close Dialog",expandButtonAriaLabel:"Expand the visual label",backgroundLoading:"Loading background image...",noContent:"No content",...n.l10n},n.threeImage&&(n=n.threeImage),this.params=n,this.contentId=i,this.extras=o,this.sceneRenderingQuality=this.behavior.sceneRenderingQuality||"high";const s=n=>{this.currentScene=n,this.trigger("changedScene",n),t.render(e.createElement(r.Provider,{value:this},e.createElement(_,{forceStartScreen:this.forceStartScreen,forceStartCamera:this.forceStartCamera,currentScene:this.currentScene,setCurrentSceneId:s,addThreeSixty:e=>this.threeSixty=e,onSetCameraPos:c})),l),window.requestAnimationFrame((()=>{this.trigger("resize")}))},u=()=>{l=document.createElement("div"),l.classList.add("h5p-three-sixty-wrapper"),this.currentScene=this.params.startSceneId,this.forceStartScreen&&(this.currentScene=this.forceStartScreen),t.render(e.createElement(r.Provider,{value:this},e.createElement(_,{forceStartScreen:this.forceStartScreen,forceStartCamera:this.forceStartCamera,currentScene:this.currentScene,setCurrentSceneId:s,addThreeSixty:e=>this.threeSixty=e,onSetCameraPos:c})),l)};this.reDraw=function(){let n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:a.currentScene;const i=a.behavior.sceneRenderingQuality;i!==a.sceneRenderingQuality&&a.threeSixty&&a.setSceneRenderingQuality(i),n===a.currentScene?t.render(e.createElement(r.Provider,{value:a},e.createElement(_,{forceStartScreen:a.forceStartScreen,forceStartCamera:a.forceStartCamera,currentScene:a.currentScene,setCurrentSceneId:s,addThreeSixty:e=>a.threeSixty=e,onSetCameraPos:c})),l):s(n)},this.attach=e=>{l||u(),e[0].appendChild(l),e[0].classList.add("h5p-three-image")},this.getRect=()=>l.getBoundingClientRect(),this.on("resize",(()=>{const e=l.parentElement.classList.contains("h5p-fullscreen")||l.parentElement.classList.contains("h5p-semi-fullscreen"),t=this.getRect(),n=e?t.height/t.width:9/16;if(l.style.height=e?"100%":t.width*n+"px",t.width<=480?l.classList.add("h5p-phone-size"):l.classList.remove("h5p-phone-size"),t.width<768?l.classList.add("h5p-medium-tablet-size"):l.classList.remove("h5p-medium-tablet-size"),null===this.currentScene||!this.threeSixty)return;const r=l.getBoundingClientRect();this.threeSixty.resize(r.width/r.height)})),this.getRatio=()=>{const e=l.getBoundingClientRect();return e.width/e.height};const c=(e,t)=>{if(null===this.currentScene||!this.threeSixty)return;const[n,r]=e.split(",");this.threeSixty.setCameraPosition(parseFloat(n),parseFloat(r)),t&&this.threeSixty.focus()};this.getCamera=()=>{if(null!==this.currentScene&&this.threeSixty)return{camera:this.threeSixty.getCurrentPosition(),fov:this.threeSixty.getCurrentFov()}},this.setSceneRenderingQuality=e=>{const t=h[e];this.threeSixty.setSegmentNumber(t),this.sceneRenderingQuality=e}}})()})();;
