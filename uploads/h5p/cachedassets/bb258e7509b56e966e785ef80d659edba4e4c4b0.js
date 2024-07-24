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
/*!
* @license SoundJS
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2011-2015 gskinner.com, inc.
*
* Distributed under the terms of the MIT license.
* http://www.opensource.org/licenses/mit-license.html
*
* This notice shall be included in all copies or substantial portions of the Software.
*/

/**!
 * SoundJS FlashAudioPlugin also includes swfobject (http://code.google.com/p/swfobject/)
 */

var old = this.createjs;

this.createjs=this.createjs||{},function(){var a=createjs.SoundJS=createjs.SoundJS||{};a.version="0.6.2",a.buildDate="Thu, 26 Nov 2015 20:44:31 GMT"}(),this.createjs=this.createjs||{},createjs.extend=function(a,b){"use strict";function c(){this.constructor=a}return c.prototype=b.prototype,a.prototype=new c},this.createjs=this.createjs||{},createjs.promote=function(a,b){"use strict";var c=a.prototype,d=Object.getPrototypeOf&&Object.getPrototypeOf(c)||c.__proto__;if(d){c[(b+="_")+"constructor"]=d.constructor;for(var e in d)c.hasOwnProperty(e)&&"function"==typeof d[e]&&(c[b+e]=d[e])}return a},this.createjs=this.createjs||{},createjs.indexOf=function(a,b){"use strict";for(var c=0,d=a.length;d>c;c++)if(b===a[c])return c;return-1},this.createjs=this.createjs||{},function(){"use strict";createjs.proxy=function(a,b){var c=Array.prototype.slice.call(arguments,2);return function(){return a.apply(b,Array.prototype.slice.call(arguments,0).concat(c))}}}(),this.createjs=this.createjs||{},function(){"use strict";function BrowserDetect(){throw"BrowserDetect cannot be instantiated"}var a=BrowserDetect.agent=window.navigator.userAgent;BrowserDetect.isWindowPhone=a.indexOf("IEMobile")>-1||a.indexOf("Windows Phone")>-1,BrowserDetect.isFirefox=a.indexOf("Firefox")>-1,BrowserDetect.isOpera=null!=window.opera,BrowserDetect.isChrome=a.indexOf("Chrome")>-1,BrowserDetect.isIOS=(a.indexOf("iPod")>-1||a.indexOf("iPhone")>-1||a.indexOf("iPad")>-1)&&!BrowserDetect.isWindowPhone,BrowserDetect.isAndroid=a.indexOf("Android")>-1&&!BrowserDetect.isWindowPhone,BrowserDetect.isBlackberry=a.indexOf("Blackberry")>-1,createjs.BrowserDetect=BrowserDetect}(),this.createjs=this.createjs||{},function(){"use strict";function EventDispatcher(){this._listeners=null,this._captureListeners=null}var a=EventDispatcher.prototype;EventDispatcher.initialize=function(b){b.addEventListener=a.addEventListener,b.on=a.on,b.removeEventListener=b.off=a.removeEventListener,b.removeAllEventListeners=a.removeAllEventListeners,b.hasEventListener=a.hasEventListener,b.dispatchEvent=a.dispatchEvent,b._dispatchEvent=a._dispatchEvent,b.willTrigger=a.willTrigger},a.addEventListener=function(a,b,c){var d;d=c?this._captureListeners=this._captureListeners||{}:this._listeners=this._listeners||{};var e=d[a];return e&&this.removeEventListener(a,b,c),e=d[a],e?e.push(b):d[a]=[b],b},a.on=function(a,b,c,d,e,f){return b.handleEvent&&(c=c||b,b=b.handleEvent),c=c||this,this.addEventListener(a,function(a){b.call(c,a,e),d&&a.remove()},f)},a.removeEventListener=function(a,b,c){var d=c?this._captureListeners:this._listeners;if(d){var e=d[a];if(e)for(var f=0,g=e.length;g>f;f++)if(e[f]==b){1==g?delete d[a]:e.splice(f,1);break}}},a.off=a.removeEventListener,a.removeAllEventListeners=function(a){a?(this._listeners&&delete this._listeners[a],this._captureListeners&&delete this._captureListeners[a]):this._listeners=this._captureListeners=null},a.dispatchEvent=function(a,b,c){if("string"==typeof a){var d=this._listeners;if(!(b||d&&d[a]))return!0;a=new createjs.Event(a,b,c)}else a.target&&a.clone&&(a=a.clone());try{a.target=this}catch(e){}if(a.bubbles&&this.parent){for(var f=this,g=[f];f.parent;)g.push(f=f.parent);var h,i=g.length;for(h=i-1;h>=0&&!a.propagationStopped;h--)g[h]._dispatchEvent(a,1+(0==h));for(h=1;i>h&&!a.propagationStopped;h++)g[h]._dispatchEvent(a,3)}else this._dispatchEvent(a,2);return!a.defaultPrevented},a.hasEventListener=function(a){var b=this._listeners,c=this._captureListeners;return!!(b&&b[a]||c&&c[a])},a.willTrigger=function(a){for(var b=this;b;){if(b.hasEventListener(a))return!0;b=b.parent}return!1},a.toString=function(){return"[EventDispatcher]"},a._dispatchEvent=function(a,b){var c,d=1==b?this._captureListeners:this._listeners;if(a&&d){var e=d[a.type];if(!e||!(c=e.length))return;try{a.currentTarget=this}catch(f){}try{a.eventPhase=b}catch(f){}a.removed=!1,e=e.slice();for(var g=0;c>g&&!a.immediatePropagationStopped;g++){var h=e[g];h.handleEvent?h.handleEvent(a):h(a),a.removed&&(this.off(a.type,h,1==b),a.removed=!1)}}},createjs.EventDispatcher=EventDispatcher}(),this.createjs=this.createjs||{},function(){"use strict";function Event(a,b,c){this.type=a,this.target=null,this.currentTarget=null,this.eventPhase=0,this.bubbles=!!b,this.cancelable=!!c,this.timeStamp=(new Date).getTime(),this.defaultPrevented=!1,this.propagationStopped=!1,this.immediatePropagationStopped=!1,this.removed=!1}var a=Event.prototype;a.preventDefault=function(){this.defaultPrevented=this.cancelable&&!0},a.stopPropagation=function(){this.propagationStopped=!0},a.stopImmediatePropagation=function(){this.immediatePropagationStopped=this.propagationStopped=!0},a.remove=function(){this.removed=!0},a.clone=function(){return new Event(this.type,this.bubbles,this.cancelable)},a.set=function(a){for(var b in a)this[b]=a[b];return this},a.toString=function(){return"[Event (type="+this.type+")]"},createjs.Event=Event}(),this.createjs=this.createjs||{},function(){"use strict";function ErrorEvent(a,b,c){this.Event_constructor("error"),this.title=a,this.message=b,this.data=c}var a=createjs.extend(ErrorEvent,createjs.Event);a.clone=function(){return new createjs.ErrorEvent(this.title,this.message,this.data)},createjs.ErrorEvent=createjs.promote(ErrorEvent,"Event")}(),this.createjs=this.createjs||{},function(){"use strict";function ProgressEvent(a,b){this.Event_constructor("progress"),this.loaded=a,this.total=null==b?1:b,this.progress=0==b?0:this.loaded/this.total}var a=createjs.extend(ProgressEvent,createjs.Event);a.clone=function(){return new createjs.ProgressEvent(this.loaded,this.total)},createjs.ProgressEvent=createjs.promote(ProgressEvent,"Event")}(window),this.createjs=this.createjs||{},function(){"use strict";function LoadItem(){this.src=null,this.type=null,this.id=null,this.maintainOrder=!1,this.callback=null,this.data=null,this.method=createjs.LoadItem.GET,this.values=null,this.headers=null,this.withCredentials=!1,this.mimeType=null,this.crossOrigin=null,this.loadTimeout=b.LOAD_TIMEOUT_DEFAULT}var a=LoadItem.prototype={},b=LoadItem;b.LOAD_TIMEOUT_DEFAULT=8e3,b.create=function(a){if("string"==typeof a){var c=new LoadItem;return c.src=a,c}if(a instanceof b)return a;if(a instanceof Object&&a.src)return null==a.loadTimeout&&(a.loadTimeout=b.LOAD_TIMEOUT_DEFAULT),a;throw new Error("Type not recognized.")},a.set=function(a){for(var b in a)this[b]=a[b];return this},createjs.LoadItem=b}(),function(){var a={};a.ABSOLUTE_PATT=/^(?:\w+:)?\/{2}/i,a.RELATIVE_PATT=/^[.\/]*?\//i,a.EXTENSION_PATT=/\/?[^\/]+\.(\w{1,5})$/i,a.parseURI=function(b){var c={absolute:!1,relative:!1};if(null==b)return c;var d=b.indexOf("?");d>-1&&(b=b.substr(0,d));var e;return a.ABSOLUTE_PATT.test(b)?c.absolute=!0:a.RELATIVE_PATT.test(b)&&(c.relative=!0),(e=b.match(a.EXTENSION_PATT))&&(c.extension=e[1].toLowerCase()),c},a.formatQueryString=function(a,b){if(null==a)throw new Error("You must specify data.");var c=[];for(var d in a)c.push(d+"="+escape(a[d]));return b&&(c=c.concat(b)),c.join("&")},a.buildPath=function(a,b){if(null==b)return a;var c=[],d=a.indexOf("?");if(-1!=d){var e=a.slice(d+1);c=c.concat(e.split("&"))}return-1!=d?a.slice(0,d)+"?"+this.formatQueryString(b,c):a+"?"+this.formatQueryString(b,c)},a.isCrossDomain=function(a){var b=document.createElement("a");b.href=a.src;var c=document.createElement("a");c.href=location.href;var d=""!=b.hostname&&(b.port!=c.port||b.protocol!=c.protocol||b.hostname!=c.hostname);return d},a.isLocal=function(a){var b=document.createElement("a");return b.href=a.src,""==b.hostname&&"file:"==b.protocol},a.isBinary=function(a){switch(a){case createjs.AbstractLoader.IMAGE:case createjs.AbstractLoader.BINARY:return!0;default:return!1}},a.isImageTag=function(a){return a instanceof HTMLImageElement},a.isAudioTag=function(a){return window.HTMLAudioElement?a instanceof HTMLAudioElement:!1},a.isVideoTag=function(a){return window.HTMLVideoElement?a instanceof HTMLVideoElement:!1},a.isText=function(a){switch(a){case createjs.AbstractLoader.TEXT:case createjs.AbstractLoader.JSON:case createjs.AbstractLoader.MANIFEST:case createjs.AbstractLoader.XML:case createjs.AbstractLoader.CSS:case createjs.AbstractLoader.SVG:case createjs.AbstractLoader.JAVASCRIPT:case createjs.AbstractLoader.SPRITESHEET:return!0;default:return!1}},a.getTypeByExtension=function(a){if(null==a)return createjs.AbstractLoader.TEXT;switch(a.toLowerCase()){case"jpeg":case"jpg":case"gif":case"png":case"webp":case"bmp":return createjs.AbstractLoader.IMAGE;case"ogg":case"mp3":case"webm":return createjs.AbstractLoader.SOUND;case"mp4":case"webm":case"ts":return createjs.AbstractLoader.VIDEO;case"json":return createjs.AbstractLoader.JSON;case"xml":return createjs.AbstractLoader.XML;case"css":return createjs.AbstractLoader.CSS;case"js":return createjs.AbstractLoader.JAVASCRIPT;case"svg":return createjs.AbstractLoader.SVG;default:return createjs.AbstractLoader.TEXT}},createjs.RequestUtils=a}(),this.createjs=this.createjs||{},function(){"use strict";function AbstractLoader(a,b,c){this.EventDispatcher_constructor(),this.loaded=!1,this.canceled=!1,this.progress=0,this.type=c,this.resultFormatter=null,this._item=a?createjs.LoadItem.create(a):null,this._preferXHR=b,this._result=null,this._rawResult=null,this._loadedItems=null,this._tagSrcAttribute=null,this._tag=null}var a=createjs.extend(AbstractLoader,createjs.EventDispatcher),b=AbstractLoader;b.POST="POST",b.GET="GET",b.BINARY="binary",b.CSS="css",b.IMAGE="image",b.JAVASCRIPT="javascript",b.JSON="json",b.JSONP="jsonp",b.MANIFEST="manifest",b.SOUND="sound",b.VIDEO="video",b.SPRITESHEET="spritesheet",b.SVG="svg",b.TEXT="text",b.XML="xml",a.getItem=function(){return this._item},a.getResult=function(a){return a?this._rawResult:this._result},a.getTag=function(){return this._tag},a.setTag=function(a){this._tag=a},a.load=function(){this._createRequest(),this._request.on("complete",this,this),this._request.on("progress",this,this),this._request.on("loadStart",this,this),this._request.on("abort",this,this),this._request.on("timeout",this,this),this._request.on("error",this,this);var a=new createjs.Event("initialize");a.loader=this._request,this.dispatchEvent(a),this._request.load()},a.cancel=function(){this.canceled=!0,this.destroy()},a.destroy=function(){this._request&&(this._request.removeAllEventListeners(),this._request.destroy()),this._request=null,this._item=null,this._rawResult=null,this._result=null,this._loadItems=null,this.removeAllEventListeners()},a.getLoadedItems=function(){return this._loadedItems},a._createRequest=function(){this._request=this._preferXHR?new createjs.XHRRequest(this._item):new createjs.TagRequest(this._item,this._tag||this._createTag(),this._tagSrcAttribute)},a._createTag=function(){return null},a._sendLoadStart=function(){this._isCanceled()||this.dispatchEvent("loadstart")},a._sendProgress=function(a){if(!this._isCanceled()){var b=null;"number"==typeof a?(this.progress=a,b=new createjs.ProgressEvent(this.progress)):(b=a,this.progress=a.loaded/a.total,b.progress=this.progress,(isNaN(this.progress)||1/0==this.progress)&&(this.progress=0)),this.hasEventListener("progress")&&this.dispatchEvent(b)}},a._sendComplete=function(){if(!this._isCanceled()){this.loaded=!0;var a=new createjs.Event("complete");a.rawResult=this._rawResult,null!=this._result&&(a.result=this._result),this.dispatchEvent(a)}},a._sendError=function(a){!this._isCanceled()&&this.hasEventListener("error")&&(null==a&&(a=new createjs.ErrorEvent("PRELOAD_ERROR_EMPTY")),this.dispatchEvent(a))},a._isCanceled=function(){return null==window.createjs||this.canceled?!0:!1},a.resultFormatter=null,a.handleEvent=function(a){switch(a.type){case"complete":this._rawResult=a.target._response;var b=this.resultFormatter&&this.resultFormatter(this);b instanceof Function?b.call(this,createjs.proxy(this._resultFormatSuccess,this),createjs.proxy(this._resultFormatFailed,this)):(this._result=b||this._rawResult,this._sendComplete());break;case"progress":this._sendProgress(a);break;case"error":this._sendError(a);break;case"loadstart":this._sendLoadStart();break;case"abort":case"timeout":this._isCanceled()||this.dispatchEvent(new createjs.ErrorEvent("PRELOAD_"+a.type.toUpperCase()+"_ERROR"))}},a._resultFormatSuccess=function(a){this._result=a,this._sendComplete()},a._resultFormatFailed=function(a){this._sendError(a)},a.buildPath=function(a,b){return createjs.RequestUtils.buildPath(a,b)},a.toString=function(){return"[PreloadJS AbstractLoader]"},createjs.AbstractLoader=createjs.promote(AbstractLoader,"EventDispatcher")}(),this.createjs=this.createjs||{},function(){"use strict";function AbstractMediaLoader(a,b,c){this.AbstractLoader_constructor(a,b,c),this.resultFormatter=this._formatResult,this._tagSrcAttribute="src",this.on("initialize",this._updateXHR,this)}var a=createjs.extend(AbstractMediaLoader,createjs.AbstractLoader);a.load=function(){this._tag||(this._tag=this._createTag(this._item.src)),this._tag.preload="auto",this._tag.load(),this.AbstractLoader_load()},a._createTag=function(){},a._createRequest=function(){this._request=this._preferXHR?new createjs.XHRRequest(this._item):new createjs.MediaTagRequest(this._item,this._tag||this._createTag(),this._tagSrcAttribute)},a._updateXHR=function(a){a.loader.setResponseType&&a.loader.setResponseType("blob")},a._formatResult=function(a){if(this._tag.removeEventListener&&this._tag.removeEventListener("canplaythrough",this._loadedHandler),this._tag.onstalled=null,this._preferXHR){var b=window.URL||window.webkitURL,c=a.getResult(!0);a.getTag().src=b.createObjectURL(c)}return a.getTag()},createjs.AbstractMediaLoader=createjs.promote(AbstractMediaLoader,"AbstractLoader")}(),this.createjs=this.createjs||{},function(){"use strict";var AbstractRequest=function(a){this._item=a},a=createjs.extend(AbstractRequest,createjs.EventDispatcher);a.load=function(){},a.destroy=function(){},a.cancel=function(){},createjs.AbstractRequest=createjs.promote(AbstractRequest,"EventDispatcher")}(),this.createjs=this.createjs||{},function(){"use strict";function TagRequest(a,b,c){this.AbstractRequest_constructor(a),this._tag=b,this._tagSrcAttribute=c,this._loadedHandler=createjs.proxy(this._handleTagComplete,this),this._addedToDOM=!1,this._startTagVisibility=null}var a=createjs.extend(TagRequest,createjs.AbstractRequest);a.load=function(){this._tag.onload=createjs.proxy(this._handleTagComplete,this),this._tag.onreadystatechange=createjs.proxy(this._handleReadyStateChange,this),this._tag.onerror=createjs.proxy(this._handleError,this);var a=new createjs.Event("initialize");a.loader=this._tag,this.dispatchEvent(a),this._hideTag(),this._loadTimeout=setTimeout(createjs.proxy(this._handleTimeout,this),this._item.loadTimeout),this._tag[this._tagSrcAttribute]=this._item.src,null==this._tag.parentNode&&(window.document.body.appendChild(this._tag),this._addedToDOM=!0)},a.destroy=function(){this._clean(),this._tag=null,this.AbstractRequest_destroy()},a._handleReadyStateChange=function(){clearTimeout(this._loadTimeout);var a=this._tag;("loaded"==a.readyState||"complete"==a.readyState)&&this._handleTagComplete()},a._handleError=function(){this._clean(),this.dispatchEvent("error")},a._handleTagComplete=function(){this._rawResult=this._tag,this._result=this.resultFormatter&&this.resultFormatter(this)||this._rawResult,this._clean(),this._showTag(),this.dispatchEvent("complete")},a._handleTimeout=function(){this._clean(),this.dispatchEvent(new createjs.Event("timeout"))},a._clean=function(){this._tag.onload=null,this._tag.onreadystatechange=null,this._tag.onerror=null,this._addedToDOM&&null!=this._tag.parentNode&&this._tag.parentNode.removeChild(this._tag),clearTimeout(this._loadTimeout)},a._hideTag=function(){this._startTagVisibility=this._tag.style.visibility,this._tag.style.visibility="hidden"},a._showTag=function(){this._tag.style.visibility=this._startTagVisibility},a._handleStalled=function(){},createjs.TagRequest=createjs.promote(TagRequest,"AbstractRequest")}(),this.createjs=this.createjs||{},function(){"use strict";function MediaTagRequest(a,b,c){this.AbstractRequest_constructor(a),this._tag=b,this._tagSrcAttribute=c,this._loadedHandler=createjs.proxy(this._handleTagComplete,this)}var a=createjs.extend(MediaTagRequest,createjs.TagRequest);a.load=function(){var a=createjs.proxy(this._handleStalled,this);this._stalledCallback=a;var b=createjs.proxy(this._handleProgress,this);this._handleProgress=b,this._tag.addEventListener("stalled",a),this._tag.addEventListener("progress",b),this._tag.addEventListener&&this._tag.addEventListener("canplaythrough",this._loadedHandler,!1),this.TagRequest_load()},a._handleReadyStateChange=function(){clearTimeout(this._loadTimeout);var a=this._tag;("loaded"==a.readyState||"complete"==a.readyState)&&this._handleTagComplete()},a._handleStalled=function(){},a._handleProgress=function(a){if(a&&!(a.loaded>0&&0==a.total)){var b=new createjs.ProgressEvent(a.loaded,a.total);this.dispatchEvent(b)}},a._clean=function(){this._tag.removeEventListener&&this._tag.removeEventListener("canplaythrough",this._loadedHandler),this._tag.removeEventListener("stalled",this._stalledCallback),this._tag.removeEventListener("progress",this._progressCallback),this.TagRequest__clean()},createjs.MediaTagRequest=createjs.promote(MediaTagRequest,"TagRequest")}(),this.createjs=this.createjs||{},function(){"use strict";function XHRRequest(a){this.AbstractRequest_constructor(a),this._request=null,this._loadTimeout=null,this._xhrLevel=1,this._response=null,this._rawResponse=null,this._canceled=!1,this._handleLoadStartProxy=createjs.proxy(this._handleLoadStart,this),this._handleProgressProxy=createjs.proxy(this._handleProgress,this),this._handleAbortProxy=createjs.proxy(this._handleAbort,this),this._handleErrorProxy=createjs.proxy(this._handleError,this),this._handleTimeoutProxy=createjs.proxy(this._handleTimeout,this),this._handleLoadProxy=createjs.proxy(this._handleLoad,this),this._handleReadyStateChangeProxy=createjs.proxy(this._handleReadyStateChange,this),!this._createXHR(a)}var a=createjs.extend(XHRRequest,createjs.AbstractRequest);XHRRequest.ACTIVEX_VERSIONS=["Msxml2.XMLHTTP.6.0","Msxml2.XMLHTTP.5.0","Msxml2.XMLHTTP.4.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],a.getResult=function(a){return a&&this._rawResponse?this._rawResponse:this._response},a.cancel=function(){this.canceled=!0,this._clean(),this._request.abort()},a.load=function(){if(null==this._request)return void this._handleError();null!=this._request.addEventListener?(this._request.addEventListener("loadstart",this._handleLoadStartProxy,!1),this._request.addEventListener("progress",this._handleProgressProxy,!1),this._request.addEventListener("abort",this._handleAbortProxy,!1),this._request.addEventListener("error",this._handleErrorProxy,!1),this._request.addEventListener("timeout",this._handleTimeoutProxy,!1),this._request.addEventListener("load",this._handleLoadProxy,!1),this._request.addEventListener("readystatechange",this._handleReadyStateChangeProxy,!1)):(this._request.onloadstart=this._handleLoadStartProxy,this._request.onprogress=this._handleProgressProxy,this._request.onabort=this._handleAbortProxy,this._request.onerror=this._handleErrorProxy,this._request.ontimeout=this._handleTimeoutProxy,this._request.onload=this._handleLoadProxy,this._request.onreadystatechange=this._handleReadyStateChangeProxy),1==this._xhrLevel&&(this._loadTimeout=setTimeout(createjs.proxy(this._handleTimeout,this),this._item.loadTimeout));try{this._item.values&&this._item.method!=createjs.AbstractLoader.GET?this._item.method==createjs.AbstractLoader.POST&&this._request.send(createjs.RequestUtils.formatQueryString(this._item.values)):this._request.send()}catch(a){this.dispatchEvent(new createjs.ErrorEvent("XHR_SEND",null,a))}},a.setResponseType=function(a){"blob"===a&&(a=window.URL?"blob":"arraybuffer",this._responseType=a),this._request.responseType=a},a.getAllResponseHeaders=function(){return this._request.getAllResponseHeaders instanceof Function?this._request.getAllResponseHeaders():null},a.getResponseHeader=function(a){return this._request.getResponseHeader instanceof Function?this._request.getResponseHeader(a):null},a._handleProgress=function(a){if(a&&!(a.loaded>0&&0==a.total)){var b=new createjs.ProgressEvent(a.loaded,a.total);this.dispatchEvent(b)}},a._handleLoadStart=function(){clearTimeout(this._loadTimeout),this.dispatchEvent("loadstart")},a._handleAbort=function(a){this._clean(),this.dispatchEvent(new createjs.ErrorEvent("XHR_ABORTED",null,a))},a._handleError=function(a){this._clean(),this.dispatchEvent(new createjs.ErrorEvent(a.message))},a._handleReadyStateChange=function(){4==this._request.readyState&&this._handleLoad()},a._handleLoad=function(){if(!this.loaded){this.loaded=!0;var a=this._checkError();if(a)return void this._handleError(a);if(this._response=this._getResponse(),"arraybuffer"===this._responseType)try{this._response=new Blob([this._response])}catch(b){if(window.BlobBuilder=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder,"TypeError"===b.name&&window.BlobBuilder){var c=new BlobBuilder;c.append(this._response),this._response=c.getBlob()}}this._clean(),this.dispatchEvent(new createjs.Event("complete"))}},a._handleTimeout=function(a){this._clean(),this.dispatchEvent(new createjs.ErrorEvent("PRELOAD_TIMEOUT",null,a))},a._checkError=function(){var a=parseInt(this._request.status);switch(a){case 404:case 0:return new Error(a)}return null},a._getResponse=function(){if(null!=this._response)return this._response;if(null!=this._request.response)return this._request.response;try{if(null!=this._request.responseText)return this._request.responseText}catch(a){}try{if(null!=this._request.responseXML)return this._request.responseXML}catch(a){}return null},a._createXHR=function(a){var b=createjs.RequestUtils.isCrossDomain(a),c={},d=null;if(window.XMLHttpRequest)d=new XMLHttpRequest,b&&void 0===d.withCredentials&&window.XDomainRequest&&(d=new XDomainRequest);else{for(var e=0,f=s.ACTIVEX_VERSIONS.length;f>e;e++){var g=s.ACTIVEX_VERSIONS[e];try{d=new ActiveXObject(g);break}catch(h){}}if(null==d)return!1}null==a.mimeType&&createjs.RequestUtils.isText(a.type)&&(a.mimeType="text/plain; charset=utf-8"),a.mimeType&&d.overrideMimeType&&d.overrideMimeType(a.mimeType),this._xhrLevel="string"==typeof d.responseType?2:1;var i=null;if(i=a.method==createjs.AbstractLoader.GET?createjs.RequestUtils.buildPath(a.src,a.values):a.src,d.open(a.method||createjs.AbstractLoader.GET,i,!0),b&&d instanceof XMLHttpRequest&&1==this._xhrLevel&&(c.Origin=location.origin),a.values&&a.method==createjs.AbstractLoader.POST&&(c["Content-Type"]="application/x-www-form-urlencoded"),b||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest"),a.headers)for(var j in a.headers)c[j]=a.headers[j];for(j in c)d.setRequestHeader(j,c[j]);return d instanceof XMLHttpRequest&&void 0!==a.withCredentials&&(d.withCredentials=a.withCredentials),this._request=d,!0},a._clean=function(){clearTimeout(this._loadTimeout),null!=this._request.removeEventListener?(this._request.removeEventListener("loadstart",this._handleLoadStartProxy),this._request.removeEventListener("progress",this._handleProgressProxy),this._request.removeEventListener("abort",this._handleAbortProxy),this._request.removeEventListener("error",this._handleErrorProxy),this._request.removeEventListener("timeout",this._handleTimeoutProxy),this._request.removeEventListener("load",this._handleLoadProxy),this._request.removeEventListener("readystatechange",this._handleReadyStateChangeProxy)):(this._request.onloadstart=null,this._request.onprogress=null,this._request.onabort=null,this._request.onerror=null,this._request.ontimeout=null,this._request.onload=null,this._request.onreadystatechange=null)},a.toString=function(){return"[PreloadJS XHRRequest]"},createjs.XHRRequest=createjs.promote(XHRRequest,"AbstractRequest")}(),this.createjs=this.createjs||{},function(){"use strict";function SoundLoader(a,b){this.AbstractMediaLoader_constructor(a,b,createjs.AbstractLoader.SOUND),createjs.RequestUtils.isAudioTag(a)?this._tag=a:createjs.RequestUtils.isAudioTag(a.src)?this._tag=a:createjs.RequestUtils.isAudioTag(a.tag)&&(this._tag=createjs.RequestUtils.isAudioTag(a)?a:a.src),null!=this._tag&&(this._preferXHR=!1)}var a=createjs.extend(SoundLoader,createjs.AbstractMediaLoader),b=SoundLoader;b.canLoadItem=function(a){return a.type==createjs.AbstractLoader.SOUND},a._createTag=function(a){var b=document.createElement("audio");return b.autoplay=!1,b.preload="none",b.src=a,b},createjs.SoundLoader=createjs.promote(SoundLoader,"AbstractMediaLoader")}(),this.createjs=this.createjs||{},function(){"use strict";var PlayPropsConfig=function(){this.interrupt=null,this.delay=null,this.offset=null,this.loop=null,this.volume=null,this.pan=null,this.startTime=null,this.duration=null},a=PlayPropsConfig.prototype={},b=PlayPropsConfig;b.create=function(a){if(a instanceof b||a instanceof Object){var c=new createjs.PlayPropsConfig;return c.set(a),c}throw new Error("Type not recognized.")},a.set=function(a){for(var b in a)this[b]=a[b];return this},a.toString=function(){return"[PlayPropsConfig]"},createjs.PlayPropsConfig=b}(),this.createjs=this.createjs||{},function(){"use strict";function Sound(){throw"Sound cannot be instantiated"}function a(a,b){this.init(a,b)}var b=Sound;b.INTERRUPT_ANY="any",b.INTERRUPT_EARLY="early",b.INTERRUPT_LATE="late",b.INTERRUPT_NONE="none",b.PLAY_INITED="playInited",b.PLAY_SUCCEEDED="playSucceeded",b.PLAY_INTERRUPTED="playInterrupted",b.PLAY_FINISHED="playFinished",b.PLAY_FAILED="playFailed",b.SUPPORTED_EXTENSIONS=["mp3","ogg","opus","mpeg","wav","m4a","mp4","aiff","wma","mid"],b.EXTENSION_MAP={m4a:"mp4"},b.FILE_PATTERN=/^(?:(\w+:)\/{2}(\w+(?:\.\w+)*\/?))?([\/.]*?(?:[^?]+)?\/)?((?:[^\/?]+)\.(\w+))(?:\?(\S+)?)?$/,b.defaultInterruptBehavior=b.INTERRUPT_NONE,b.alternateExtensions=[],b.activePlugin=null,b._masterVolume=1,Object.defineProperty(b,"volume",{get:function(){return this._masterVolume},set:function(a){if(null==Number(a))return!1;if(a=Math.max(0,Math.min(1,a)),b._masterVolume=a,!this.activePlugin||!this.activePlugin.setVolume||!this.activePlugin.setVolume(a))for(var c=this._instances,d=0,e=c.length;e>d;d++)c[d].setMasterVolume(a)}}),b._masterMute=!1,Object.defineProperty(b,"muted",{get:function(){return this._masterMute},set:function(a){if(null==a)return!1;if(this._masterMute=a,!this.activePlugin||!this.activePlugin.setMute||!this.activePlugin.setMute(a))for(var b=this._instances,c=0,d=b.length;d>c;c++)b[c].setMasterMute(a);return!0}}),Object.defineProperty(b,"capabilities",{get:function(){return null==b.activePlugin?null:b.activePlugin._capabilities},set:function(){return!1}}),b._pluginsRegistered=!1,b._lastID=0,b._instances=[],b._idHash={},b._preloadHash={},b._defaultPlayPropsHash={},b.addEventListener=null,b.removeEventListener=null,b.removeAllEventListeners=null,b.dispatchEvent=null,b.hasEventListener=null,b._listeners=null,createjs.EventDispatcher.initialize(b),b.getPreloadHandlers=function(){return{callback:createjs.proxy(b.initLoad,b),types:["sound"],extensions:b.SUPPORTED_EXTENSIONS}},b._handleLoadComplete=function(a){var c=a.target.getItem().src;if(b._preloadHash[c])for(var d=0,e=b._preloadHash[c].length;e>d;d++){var f=b._preloadHash[c][d];if(b._preloadHash[c][d]=!0,b.hasEventListener("fileload")){var a=new createjs.Event("fileload");a.src=f.src,a.id=f.id,a.data=f.data,a.sprite=f.sprite,b.dispatchEvent(a)}}},b._handleLoadError=function(a){var c=a.target.getItem().src;if(b._preloadHash[c])for(var d=0,e=b._preloadHash[c].length;e>d;d++){var f=b._preloadHash[c][d];if(b._preloadHash[c][d]=!1,b.hasEventListener("fileerror")){var a=new createjs.Event("fileerror");a.src=f.src,a.id=f.id,a.data=f.data,a.sprite=f.sprite,b.dispatchEvent(a)}}},b._registerPlugin=function(a){return a.isSupported()?(b.activePlugin=new a,!0):!1},b.registerPlugins=function(a){b._pluginsRegistered=!0;for(var c=0,d=a.length;d>c;c++)if(b._registerPlugin(a[c]))return!0;return!1},b.initializeDefaultPlugins=function(){return null!=b.activePlugin?!0:b._pluginsRegistered?!1:b.registerPlugins([createjs.WebAudioPlugin,createjs.HTMLAudioPlugin])?!0:!1},b.isReady=function(){return null!=b.activePlugin},b.getCapabilities=function(){return null==b.activePlugin?null:b.activePlugin._capabilities},b.getCapability=function(a){return null==b.activePlugin?null:b.activePlugin._capabilities[a]},b.initLoad=function(a){return b._registerSound(a)},b._registerSound=function(c){if(!b.initializeDefaultPlugins())return!1;var d;if(c.src instanceof Object?(d=b._parseSrc(c.src),d.src=c.path+d.src):d=b._parsePath(c.src),null==d)return!1;c.src=d.src,c.type="sound";var e=c.data,f=null;if(null!=e&&(isNaN(e.channels)?isNaN(e)||(f=parseInt(e)):f=parseInt(e.channels),e.audioSprite))for(var g,h=e.audioSprite.length;h--;)g=e.audioSprite[h],b._idHash[g.id]={src:c.src,startTime:parseInt(g.startTime),duration:parseInt(g.duration)},g.defaultPlayProps&&(b._defaultPlayPropsHash[g.id]=createjs.PlayPropsConfig.create(g.defaultPlayProps));null!=c.id&&(b._idHash[c.id]={src:c.src});var i=b.activePlugin.register(c);return a.create(c.src,f),null!=e&&isNaN(e)?c.data.channels=f||a.maxPerChannel():c.data=f||a.maxPerChannel(),i.type&&(c.type=i.type),c.defaultPlayProps&&(b._defaultPlayPropsHash[c.src]=createjs.PlayPropsConfig.create(c.defaultPlayProps)),i},b.registerSound=function(a,c,d,e,f){var g={src:a,id:c,data:d,defaultPlayProps:f};a instanceof Object&&a.src&&(e=c,g=a),g=createjs.LoadItem.create(g),g.path=e,null==e||g.src instanceof Object||(g.src=e+a);var h=b._registerSound(g);if(!h)return!1;if(b._preloadHash[g.src]||(b._preloadHash[g.src]=[]),b._preloadHash[g.src].push(g),1==b._preloadHash[g.src].length)h.on("complete",createjs.proxy(this._handleLoadComplete,this)),h.on("error",createjs.proxy(this._handleLoadError,this)),b.activePlugin.preload(h);else if(1==b._preloadHash[g.src][0])return!0;return g},b.registerSounds=function(a,b){var c=[];a.path&&(b?b+=a.path:b=a.path,a=a.manifest);for(var d=0,e=a.length;e>d;d++)c[d]=createjs.Sound.registerSound(a[d].src,a[d].id,a[d].data,b,a[d].defaultPlayProps);return c},b.removeSound=function(c,d){if(null==b.activePlugin)return!1;c instanceof Object&&c.src&&(c=c.src);var e;if(c instanceof Object?e=b._parseSrc(c):(c=b._getSrcById(c).src,e=b._parsePath(c)),null==e)return!1;c=e.src,null!=d&&(c=d+c);for(var f in b._idHash)b._idHash[f].src==c&&delete b._idHash[f];return a.removeSrc(c),delete b._preloadHash[c],b.activePlugin.removeSound(c),!0},b.removeSounds=function(a,b){var c=[];a.path&&(b?b+=a.path:b=a.path,a=a.manifest);for(var d=0,e=a.length;e>d;d++)c[d]=createjs.Sound.removeSound(a[d].src,b);return c},b.removeAllSounds=function(){b._idHash={},b._preloadHash={},a.removeAll(),b.activePlugin&&b.activePlugin.removeAllSounds()},b.loadComplete=function(a){if(!b.isReady())return!1;var c=b._parsePath(a);return a=c?b._getSrcById(c.src).src:b._getSrcById(a).src,void 0==b._preloadHash[a]?!1:1==b._preloadHash[a][0]},b._parsePath=function(a){"string"!=typeof a&&(a=a.toString());var c=a.match(b.FILE_PATTERN);if(null==c)return!1;for(var d=c[4],e=c[5],f=b.capabilities,g=0;!f[e];)if(e=b.alternateExtensions[g++],g>b.alternateExtensions.length)return null;a=a.replace("."+c[5],"."+e);var h={name:d,src:a,extension:e};return h},b._parseSrc=function(a){var c={name:void 0,src:void 0,extension:void 0},d=b.capabilities;for(var e in a)if(a.hasOwnProperty(e)&&d[e]){c.src=a[e],c.extension=e;break}if(!c.src)return!1;var f=c.src.lastIndexOf("/");return c.name=-1!=f?c.src.slice(f+1):c.src,c},b.play=function(a,c,d,e,f,g,h,i,j){var k;k=createjs.PlayPropsConfig.create(c instanceof Object||c instanceof createjs.PlayPropsConfig?c:{interrupt:c,delay:d,offset:e,loop:f,volume:g,pan:h,startTime:i,duration:j});var l=b.createInstance(a,k.startTime,k.duration),m=b._playInstance(l,k);return m||l._playFailed(),l},b.createInstance=function(c,d,e){if(!b.initializeDefaultPlugins())return new createjs.DefaultSoundInstance(c,d,e);var f=b._defaultPlayPropsHash[c];c=b._getSrcById(c);var g=b._parsePath(c.src),h=null;
return null!=g&&null!=g.src?(a.create(g.src),null==d&&(d=c.startTime),h=b.activePlugin.create(g.src,d,e||c.duration),f=f||b._defaultPlayPropsHash[g.src],f&&h.applyPlayProps(f)):h=new createjs.DefaultSoundInstance(c,d,e),h.uniqueId=b._lastID++,h},b.stop=function(){for(var a=this._instances,b=a.length;b--;)a[b].stop()},b.setVolume=function(a){if(null==Number(a))return!1;if(a=Math.max(0,Math.min(1,a)),b._masterVolume=a,!this.activePlugin||!this.activePlugin.setVolume||!this.activePlugin.setVolume(a))for(var c=this._instances,d=0,e=c.length;e>d;d++)c[d].setMasterVolume(a)},b.getVolume=function(){return this._masterVolume},b.setMute=function(a){if(null==a)return!1;if(this._masterMute=a,!this.activePlugin||!this.activePlugin.setMute||!this.activePlugin.setMute(a))for(var b=this._instances,c=0,d=b.length;d>c;c++)b[c].setMasterMute(a);return!0},b.getMute=function(){return this._masterMute},b.setDefaultPlayProps=function(a,c){a=b._getSrcById(a),b._defaultPlayPropsHash[b._parsePath(a.src).src]=createjs.PlayPropsConfig.create(c)},b.getDefaultPlayProps=function(a){return a=b._getSrcById(a),b._defaultPlayPropsHash[b._parsePath(a.src).src]},b._playInstance=function(a,c){var d=b._defaultPlayPropsHash[a.src]||{};if(null==c.interrupt&&(c.interrupt=d.interrupt||b.defaultInterruptBehavior),null==c.delay&&(c.delay=d.delay||0),null==c.offset&&(c.offset=a.getPosition()),null==c.loop&&(c.loop=a.loop),null==c.volume&&(c.volume=a.volume),null==c.pan&&(c.pan=a.pan),0==c.delay){var e=b._beginPlaying(a,c);if(!e)return!1}else{var f=setTimeout(function(){b._beginPlaying(a,c)},c.delay);a.delayTimeoutId=f}return this._instances.push(a),!0},b._beginPlaying=function(b,c){if(!a.add(b,c.interrupt))return!1;var d=b._beginPlaying(c);if(!d){var e=createjs.indexOf(this._instances,b);return e>-1&&this._instances.splice(e,1),!1}return!0},b._getSrcById=function(a){return b._idHash[a]||{src:a}},b._playFinished=function(b){a.remove(b);var c=createjs.indexOf(this._instances,b);c>-1&&this._instances.splice(c,1)},createjs.Sound=Sound,a.channels={},a.create=function(b,c){var d=a.get(b);return null==d?(a.channels[b]=new a(b,c),!0):!1},a.removeSrc=function(b){var c=a.get(b);return null==c?!1:(c._removeAll(),delete a.channels[b],!0)},a.removeAll=function(){for(var b in a.channels)a.channels[b]._removeAll();a.channels={}},a.add=function(b,c){var d=a.get(b.src);return null==d?!1:d._add(b,c)},a.remove=function(b){var c=a.get(b.src);return null==c?!1:(c._remove(b),!0)},a.maxPerChannel=function(){return c.maxDefault},a.get=function(b){return a.channels[b]};var c=a.prototype;c.constructor=a,c.src=null,c.max=null,c.maxDefault=100,c.length=0,c.init=function(a,b){this.src=a,this.max=b||this.maxDefault,-1==this.max&&(this.max=this.maxDefault),this._instances=[]},c._get=function(a){return this._instances[a]},c._add=function(a,b){return this._getSlot(b,a)?(this._instances.push(a),this.length++,!0):!1},c._remove=function(a){var b=createjs.indexOf(this._instances,a);return-1==b?!1:(this._instances.splice(b,1),this.length--,!0)},c._removeAll=function(){for(var a=this.length-1;a>=0;a--)this._instances[a].stop()},c._getSlot=function(a){var b,c;if(a!=Sound.INTERRUPT_NONE&&(c=this._get(0),null==c))return!0;for(var d=0,e=this.max;e>d;d++){if(b=this._get(d),null==b)return!0;if(b.playState==Sound.PLAY_FINISHED||b.playState==Sound.PLAY_INTERRUPTED||b.playState==Sound.PLAY_FAILED){c=b;break}a!=Sound.INTERRUPT_NONE&&(a==Sound.INTERRUPT_EARLY&&b.getPosition()<c.getPosition()||a==Sound.INTERRUPT_LATE&&b.getPosition()>c.getPosition())&&(c=b)}return null!=c?(c._interrupt(),this._remove(c),!0):!1},c.toString=function(){return"[Sound SoundChannel]"}}(),this.createjs=this.createjs||{},function(){"use strict";var AbstractSoundInstance=function(a,b,c,d){this.EventDispatcher_constructor(),this.src=a,this.uniqueId=-1,this.playState=null,this.delayTimeoutId=null,this._volume=1,Object.defineProperty(this,"volume",{get:this.getVolume,set:this.setVolume}),this._pan=0,Object.defineProperty(this,"pan",{get:this.getPan,set:this.setPan}),this._startTime=Math.max(0,b||0),Object.defineProperty(this,"startTime",{get:this.getStartTime,set:this.setStartTime}),this._duration=Math.max(0,c||0),Object.defineProperty(this,"duration",{get:this.getDuration,set:this.setDuration}),this._playbackResource=null,Object.defineProperty(this,"playbackResource",{get:this.getPlaybackResource,set:this.setPlaybackResource}),d!==!1&&d!==!0&&this.setPlaybackResource(d),this._position=0,Object.defineProperty(this,"position",{get:this.getPosition,set:this.setPosition}),this._loop=0,Object.defineProperty(this,"loop",{get:this.getLoop,set:this.setLoop}),this._muted=!1,Object.defineProperty(this,"muted",{get:this.getMuted,set:this.setMuted}),this._paused=!1,Object.defineProperty(this,"paused",{get:this.getPaused,set:this.setPaused})},a=createjs.extend(AbstractSoundInstance,createjs.EventDispatcher);a.play=function(a,b,c,d,e,f){var g;return g=createjs.PlayPropsConfig.create(a instanceof Object||a instanceof createjs.PlayPropsConfig?a:{interrupt:a,delay:b,offset:c,loop:d,volume:e,pan:f}),this.playState==createjs.Sound.PLAY_SUCCEEDED?(this.applyPlayProps(g),void(this._paused&&this.setPaused(!1))):(this._cleanUp(),createjs.Sound._playInstance(this,g),this)},a.stop=function(){return this._position=0,this._paused=!1,this._handleStop(),this._cleanUp(),this.playState=createjs.Sound.PLAY_FINISHED,this},a.destroy=function(){this._cleanUp(),this.src=null,this.playbackResource=null,this.removeAllEventListeners()},a.applyPlayProps=function(a){return null!=a.offset&&this.setPosition(a.offset),null!=a.loop&&this.setLoop(a.loop),null!=a.volume&&this.setVolume(a.volume),null!=a.pan&&this.setPan(a.pan),null!=a.startTime&&(this.setStartTime(a.startTime),this.setDuration(a.duration)),this},a.toString=function(){return"[AbstractSoundInstance]"},a.getPaused=function(){return this._paused},a.setPaused=function(a){return a!==!0&&a!==!1||this._paused==a||1==a&&this.playState!=createjs.Sound.PLAY_SUCCEEDED?void 0:(this._paused=a,a?this._pause():this._resume(),clearTimeout(this.delayTimeoutId),this)},a.setVolume=function(a){return a==this._volume?this:(this._volume=Math.max(0,Math.min(1,a)),this._muted||this._updateVolume(),this)},a.getVolume=function(){return this._volume},a.setMuted=function(a){return a===!0||a===!1?(this._muted=a,this._updateVolume(),this):void 0},a.getMuted=function(){return this._muted},a.setPan=function(a){return a==this._pan?this:(this._pan=Math.max(-1,Math.min(1,a)),this._updatePan(),this)},a.getPan=function(){return this._pan},a.getPosition=function(){return this._paused||this.playState!=createjs.Sound.PLAY_SUCCEEDED||(this._position=this._calculateCurrentPosition()),this._position},a.setPosition=function(a){return this._position=Math.max(0,a),this.playState==createjs.Sound.PLAY_SUCCEEDED&&this._updatePosition(),this},a.getStartTime=function(){return this._startTime},a.setStartTime=function(a){return a==this._startTime?this:(this._startTime=Math.max(0,a||0),this._updateStartTime(),this)},a.getDuration=function(){return this._duration},a.setDuration=function(a){return a==this._duration?this:(this._duration=Math.max(0,a||0),this._updateDuration(),this)},a.setPlaybackResource=function(a){return this._playbackResource=a,0==this._duration&&this._setDurationFromSource(),this},a.getPlaybackResource=function(){return this._playbackResource},a.getLoop=function(){return this._loop},a.setLoop=function(a){null!=this._playbackResource&&(0!=this._loop&&0==a?this._removeLooping(a):0==this._loop&&0!=a&&this._addLooping(a)),this._loop=a},a._sendEvent=function(a){var b=new createjs.Event(a);this.dispatchEvent(b)},a._cleanUp=function(){clearTimeout(this.delayTimeoutId),this._handleCleanUp(),this._paused=!1,createjs.Sound._playFinished(this)},a._interrupt=function(){this._cleanUp(),this.playState=createjs.Sound.PLAY_INTERRUPTED,this._sendEvent("interrupted")},a._beginPlaying=function(a){return this.setPosition(a.offset),this.setLoop(a.loop),this.setVolume(a.volume),this.setPan(a.pan),null!=a.startTime&&(this.setStartTime(a.startTime),this.setDuration(a.duration)),null!=this._playbackResource&&this._position<this._duration?(this._paused=!1,this._handleSoundReady(),this.playState=createjs.Sound.PLAY_SUCCEEDED,this._sendEvent("succeeded"),!0):(this._playFailed(),!1)},a._playFailed=function(){this._cleanUp(),this.playState=createjs.Sound.PLAY_FAILED,this._sendEvent("failed")},a._handleSoundComplete=function(){return this._position=0,0!=this._loop?(this._loop--,this._handleLoop(),void this._sendEvent("loop")):(this._cleanUp(),this.playState=createjs.Sound.PLAY_FINISHED,void this._sendEvent("complete"))},a._handleSoundReady=function(){},a._updateVolume=function(){},a._updatePan=function(){},a._updateStartTime=function(){},a._updateDuration=function(){},a._setDurationFromSource=function(){},a._calculateCurrentPosition=function(){},a._updatePosition=function(){},a._removeLooping=function(){},a._addLooping=function(){},a._pause=function(){},a._resume=function(){},a._handleStop=function(){},a._handleCleanUp=function(){},a._handleLoop=function(){},createjs.AbstractSoundInstance=createjs.promote(AbstractSoundInstance,"EventDispatcher"),createjs.DefaultSoundInstance=createjs.AbstractSoundInstance}(),this.createjs=this.createjs||{},function(){"use strict";var AbstractPlugin=function(){this._capabilities=null,this._loaders={},this._audioSources={},this._soundInstances={},this._volume=1,this._loaderClass,this._soundInstanceClass},a=AbstractPlugin.prototype;AbstractPlugin._capabilities=null,AbstractPlugin.isSupported=function(){return!0},a.register=function(a){var b=this._loaders[a.src];return b&&!b.canceled?this._loaders[a.src]:(this._audioSources[a.src]=!0,this._soundInstances[a.src]=[],b=new this._loaderClass(a),b.on("complete",this._handlePreloadComplete,this),this._loaders[a.src]=b,b)},a.preload=function(a){a.on("error",this._handlePreloadError,this),a.load()},a.isPreloadStarted=function(a){return null!=this._audioSources[a]},a.isPreloadComplete=function(a){return!(null==this._audioSources[a]||1==this._audioSources[a])},a.removeSound=function(a){if(this._soundInstances[a]){for(var b=this._soundInstances[a].length;b--;){var c=this._soundInstances[a][b];c.destroy()}delete this._soundInstances[a],delete this._audioSources[a],this._loaders[a]&&this._loaders[a].destroy(),delete this._loaders[a]}},a.removeAllSounds=function(){for(var a in this._audioSources)this.removeSound(a)},a.create=function(a,b,c){this.isPreloadStarted(a)||this.preload(this.register(a));var d=new this._soundInstanceClass(a,b,c,this._audioSources[a]);return this._soundInstances[a].push(d),d},a.setVolume=function(a){return this._volume=a,this._updateVolume(),!0},a.getVolume=function(){return this._volume},a.setMute=function(){return this._updateVolume(),!0},a.toString=function(){return"[AbstractPlugin]"},a._handlePreloadComplete=function(a){var b=a.target.getItem().src;this._audioSources[b]=a.result;for(var c=0,d=this._soundInstances[b].length;d>c;c++){var e=this._soundInstances[b][c];e.setPlaybackResource(this._audioSources[b])}},a._handlePreloadError=function(){},a._updateVolume=function(){},createjs.AbstractPlugin=AbstractPlugin}(),this.createjs=this.createjs||{},function(){"use strict";function a(a){this.AbstractLoader_constructor(a,!0,createjs.AbstractLoader.SOUND)}var b=createjs.extend(a,createjs.AbstractLoader);a.context=null,b.toString=function(){return"[WebAudioLoader]"},b._createRequest=function(){this._request=new createjs.XHRRequest(this._item,!1),this._request.setResponseType("arraybuffer")},b._sendComplete=function(){a.context.decodeAudioData(this._rawResult,createjs.proxy(this._handleAudioDecoded,this),createjs.proxy(this._sendError,this))},b._handleAudioDecoded=function(a){this._result=a,this.AbstractLoader__sendComplete()},createjs.WebAudioLoader=createjs.promote(a,"AbstractLoader")}(),this.createjs=this.createjs||{},function(){"use strict";function WebAudioSoundInstance(a,c,d,e){this.AbstractSoundInstance_constructor(a,c,d,e),this.gainNode=b.context.createGain(),this.panNode=b.context.createPanner(),this.panNode.panningModel=b._panningModel,this.panNode.connect(this.gainNode),this._updatePan(),this.sourceNode=null,this._soundCompleteTimeout=null,this._sourceNodeNext=null,this._playbackStartTime=0,this._endedHandler=createjs.proxy(this._handleSoundComplete,this)}var a=createjs.extend(WebAudioSoundInstance,createjs.AbstractSoundInstance),b=WebAudioSoundInstance;b.context=null,b._scratchBuffer=null,b.destinationNode=null,b._panningModel="equalpower",a.destroy=function(){this.AbstractSoundInstance_destroy(),this.panNode.disconnect(0),this.panNode=null,this.gainNode.disconnect(0),this.gainNode=null},a.toString=function(){return"[WebAudioSoundInstance]"},a._updatePan=function(){this.panNode.setPosition(this._pan,0,-.5)},a._removeLooping=function(){this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext)},a._addLooping=function(){this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._sourceNodeNext=this._createAndPlayAudioNode(this._playbackStartTime,0))},a._setDurationFromSource=function(){this._duration=1e3*this.playbackResource.duration},a._handleCleanUp=function(){this.sourceNode&&this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this.sourceNode=this._cleanUpAudioNode(this.sourceNode),this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext)),0!=this.gainNode.numberOfOutputs&&this.gainNode.disconnect(0),clearTimeout(this._soundCompleteTimeout),this._playbackStartTime=0},a._cleanUpAudioNode=function(a){if(a){a.stop(0),a.disconnect(0);try{a.buffer=b._scratchBuffer}catch(c){}a=null}return a},a._handleSoundReady=function(){this.gainNode.connect(b.destinationNode);var a=.001*this._duration,c=.001*this._position;c>a&&(c=a),this.sourceNode=this._createAndPlayAudioNode(b.context.currentTime-a,c),this._playbackStartTime=this.sourceNode.startTime-c,this._soundCompleteTimeout=setTimeout(this._endedHandler,1e3*(a-c)),0!=this._loop&&(this._sourceNodeNext=this._createAndPlayAudioNode(this._playbackStartTime,0))},a._createAndPlayAudioNode=function(a,c){var d=b.context.createBufferSource();d.buffer=this.playbackResource,d.connect(this.panNode);var e=.001*this._duration;return d.startTime=a+e,d.start(d.startTime,c+.001*this._startTime,e-c),d},a._pause=function(){this._position=1e3*(b.context.currentTime-this._playbackStartTime),this.sourceNode=this._cleanUpAudioNode(this.sourceNode),this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext),0!=this.gainNode.numberOfOutputs&&this.gainNode.disconnect(0),clearTimeout(this._soundCompleteTimeout)},a._resume=function(){this._handleSoundReady()},a._updateVolume=function(){var a=this._muted?0:this._volume;a!=this.gainNode.gain.value&&(this.gainNode.gain.value=a)},a._calculateCurrentPosition=function(){return 1e3*(b.context.currentTime-this._playbackStartTime)},a._updatePosition=function(){this.sourceNode=this._cleanUpAudioNode(this.sourceNode),this._sourceNodeNext=this._cleanUpAudioNode(this._sourceNodeNext),clearTimeout(this._soundCompleteTimeout),this._paused||this._handleSoundReady()},a._handleLoop=function(){this._cleanUpAudioNode(this.sourceNode),this.sourceNode=this._sourceNodeNext,this._playbackStartTime=this.sourceNode.startTime,this._sourceNodeNext=this._createAndPlayAudioNode(this._playbackStartTime,0),this._soundCompleteTimeout=setTimeout(this._endedHandler,this._duration)},a._updateDuration=function(){this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._pause(),this._resume())},createjs.WebAudioSoundInstance=createjs.promote(WebAudioSoundInstance,"AbstractSoundInstance")}(),this.createjs=this.createjs||{},function(){"use strict";function WebAudioPlugin(){this.AbstractPlugin_constructor(),this._panningModel=b._panningModel,this.context=b.context,this.dynamicsCompressorNode=this.context.createDynamicsCompressor(),this.dynamicsCompressorNode.connect(this.context.destination),this.gainNode=this.context.createGain(),this.gainNode.connect(this.dynamicsCompressorNode),createjs.WebAudioSoundInstance.destinationNode=this.gainNode,this._capabilities=b._capabilities,this._loaderClass=createjs.WebAudioLoader,this._soundInstanceClass=createjs.WebAudioSoundInstance,this._addPropsToClasses()}var a=createjs.extend(WebAudioPlugin,createjs.AbstractPlugin),b=WebAudioPlugin;b._capabilities=null,b._panningModel="equalpower",b.context=null,b._scratchBuffer=null,b._unlocked=!1,b.isSupported=function(){var a=createjs.BrowserDetect.isIOS||createjs.BrowserDetect.isAndroid||createjs.BrowserDetect.isBlackberry;return"file:"!=location.protocol||a||this._isFileXHRSupported()?(b._generateCapabilities(),null==b.context?!1:!0):!1},b.playEmptySound=function(){if(null!=b.context){var a=b.context.createBufferSource();a.buffer=b._scratchBuffer,a.connect(b.context.destination),a.start(0,0,0)}},b._isFileXHRSupported=function(){var a=!0,b=new XMLHttpRequest;try{b.open("GET","WebAudioPluginTest.fail",!1)}catch(c){return a=!1}b.onerror=function(){a=!1},b.onload=function(){a=404==this.status||200==this.status||0==this.status&&""!=this.response};try{b.send()}catch(c){a=!1}return a},b._generateCapabilities=function(){if(null==b._capabilities){var a=document.createElement("audio");if(null==a.canPlayType)return null;if(null==b.context)if(window.AudioContext)b.context=new AudioContext;else{if(!window.webkitAudioContext)return null;b.context=new webkitAudioContext}null==b._scratchBuffer&&(b._scratchBuffer=b.context.createBuffer(1,1,22050)),b._compatibilitySetUp(),"ontouchstart"in window&&"running"!=b.context.state&&(b._unlock(),document.addEventListener("mousedown",b._unlock,!0),document.addEventListener("touchend",b._unlock,!0)),b._capabilities={panning:!0,volume:!0,tracks:-1};for(var c=createjs.Sound.SUPPORTED_EXTENSIONS,d=createjs.Sound.EXTENSION_MAP,e=0,f=c.length;f>e;e++){var g=c[e],h=d[g]||g;b._capabilities[g]="no"!=a.canPlayType("audio/"+g)&&""!=a.canPlayType("audio/"+g)||"no"!=a.canPlayType("audio/"+h)&&""!=a.canPlayType("audio/"+h)}b.context.destination.numberOfChannels<2&&(b._capabilities.panning=!1)}},b._compatibilitySetUp=function(){if(b._panningModel="equalpower",!b.context.createGain){b.context.createGain=b.context.createGainNode;var a=b.context.createBufferSource();a.__proto__.start=a.__proto__.noteGrainOn,a.__proto__.stop=a.__proto__.noteOff,b._panningModel=0}},b._unlock=function(){b._unlocked||(b.playEmptySound(),"running"==b.context.state&&(document.removeEventListener("mousedown",b._unlock,!0),document.removeEventListener("touchend",b._unlock,!0),b._unlocked=!0))},a.toString=function(){return"[WebAudioPlugin]"},a._addPropsToClasses=function(){var a=this._soundInstanceClass;a.context=this.context,a._scratchBuffer=b._scratchBuffer,a.destinationNode=this.gainNode,a._panningModel=this._panningModel,this._loaderClass.context=this.context},a._updateVolume=function(){var a=createjs.Sound._masterMute?0:this._volume;a!=this.gainNode.gain.value&&(this.gainNode.gain.value=a)},createjs.WebAudioPlugin=createjs.promote(WebAudioPlugin,"AbstractPlugin")}(),this.createjs=this.createjs||{},function(){"use strict";function HTMLAudioTagPool(){throw"HTMLAudioTagPool cannot be instantiated"}function a(){this._tags=[]}var b=HTMLAudioTagPool;b._tags={},b._tagPool=new a,b._tagUsed={},b.get=function(a){var c=b._tags[a];return null==c?(c=b._tags[a]=b._tagPool.get(),c.src=a):b._tagUsed[a]?(c=b._tagPool.get(),c.src=a):b._tagUsed[a]=!0,c},b.set=function(a,c){c==b._tags[a]?b._tagUsed[a]=!1:b._tagPool.set(c)},b.remove=function(a){var c=b._tags[a];return null==c?!1:(b._tagPool.set(c),delete b._tags[a],delete b._tagUsed[a],!0)},b.getDuration=function(a){var c=b._tags[a];return null!=c&&c.duration?1e3*c.duration:0},createjs.HTMLAudioTagPool=HTMLAudioTagPool;var c=a.prototype;c.constructor=a,c.get=function(){var a;return a=0==this._tags.length?this._createTag():this._tags.pop(),null==a.parentNode&&document.body.appendChild(a),a},c.set=function(a){var b=createjs.indexOf(this._tags,a);-1==b&&(this._tags.src=null,this._tags.push(a))},c.toString=function(){return"[TagPool]"},c._createTag=function(){var a=document.createElement("audio");return a.autoplay=!1,a.preload="none",a}}(),this.createjs=this.createjs||{},function(){"use strict";function HTMLAudioSoundInstance(a,b,c,d){this.AbstractSoundInstance_constructor(a,b,c,d),this._audioSpriteStopTime=null,this._delayTimeoutId=null,this._endedHandler=createjs.proxy(this._handleSoundComplete,this),this._readyHandler=createjs.proxy(this._handleTagReady,this),this._stalledHandler=createjs.proxy(this._playFailed,this),this._audioSpriteEndHandler=createjs.proxy(this._handleAudioSpriteLoop,this),this._loopHandler=createjs.proxy(this._handleSoundComplete,this),c?this._audioSpriteStopTime=.001*(b+c):this._duration=createjs.HTMLAudioTagPool.getDuration(this.src)}var a=createjs.extend(HTMLAudioSoundInstance,createjs.AbstractSoundInstance);a.setMasterVolume=function(){this._updateVolume()},a.setMasterMute=function(){this._updateVolume()},a.toString=function(){return"[HTMLAudioSoundInstance]"},a._removeLooping=function(){null!=this._playbackResource&&(this._playbackResource.loop=!1,this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1))},a._addLooping=function(){null==this._playbackResource||this._audioSpriteStopTime||(this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),this._playbackResource.loop=!0)},a._handleCleanUp=function(){var a=this._playbackResource;if(null!=a){a.pause(),a.loop=!1,a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY,this._readyHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED,this._stalledHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),a.removeEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1);try{a.currentTime=this._startTime}catch(b){}createjs.HTMLAudioTagPool.set(this.src,a),this._playbackResource=null}},a._beginPlaying=function(a){return this._playbackResource=createjs.HTMLAudioTagPool.get(this.src),this.AbstractSoundInstance__beginPlaying(a)},a._handleSoundReady=function(){if(4!==this._playbackResource.readyState){var a=this._playbackResource;return a.addEventListener(createjs.HTMLAudioPlugin._AUDIO_READY,this._readyHandler,!1),a.addEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED,this._stalledHandler,!1),a.preload="auto",void a.load()}this._updateVolume(),this._playbackResource.currentTime=.001*(this._startTime+this._position),this._audioSpriteStopTime?this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1):(this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),0!=this._loop&&(this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),this._playbackResource.loop=!0)),this._playbackResource.play()},a._handleTagReady=function(){this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY,this._readyHandler,!1),this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED,this._stalledHandler,!1),this._handleSoundReady()},a._pause=function(){this._playbackResource.pause()},a._resume=function(){this._playbackResource.play()},a._updateVolume=function(){if(null!=this._playbackResource){var a=this._muted||createjs.Sound._masterMute?0:this._volume*createjs.Sound._masterVolume;a!=this._playbackResource.volume&&(this._playbackResource.volume=a)}},a._calculateCurrentPosition=function(){return 1e3*this._playbackResource.currentTime-this._startTime},a._updatePosition=function(){this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._handleSetPositionSeek,!1);try{this._playbackResource.currentTime=.001*(this._position+this._startTime)}catch(a){this._handleSetPositionSeek(null)}},a._handleSetPositionSeek=function(){null!=this._playbackResource&&(this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._handleSetPositionSeek,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1))},a._handleAudioSpriteLoop=function(){this._playbackResource.currentTime<=this._audioSpriteStopTime||(this._playbackResource.pause(),0==this._loop?this._handleSoundComplete(null):(this._position=0,this._loop--,this._playbackResource.currentTime=.001*this._startTime,this._paused||this._playbackResource.play(),this._sendEvent("loop")))},a._handleLoop=function(){0==this._loop&&(this._playbackResource.loop=!1,this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED,this._loopHandler,!1))},a._updateStartTime=function(){this._audioSpriteStopTime=.001*(this._startTime+this._duration),this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1))},a._updateDuration=function(){this._audioSpriteStopTime=.001*(this._startTime+this._duration),this.playState==createjs.Sound.PLAY_SUCCEEDED&&(this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED,this._endedHandler,!1),this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE,this._audioSpriteEndHandler,!1))},a._setDurationFromSource=function(){this._duration=createjs.HTMLAudioTagPool.getDuration(this.src),this._playbackResource=null},createjs.HTMLAudioSoundInstance=createjs.promote(HTMLAudioSoundInstance,"AbstractSoundInstance")}(),this.createjs=this.createjs||{},function(){"use strict";function HTMLAudioPlugin(){this.AbstractPlugin_constructor(),this.defaultNumChannels=2,this._capabilities=b._capabilities,this._loaderClass=createjs.SoundLoader,this._soundInstanceClass=createjs.HTMLAudioSoundInstance}var a=createjs.extend(HTMLAudioPlugin,createjs.AbstractPlugin),b=HTMLAudioPlugin;b.MAX_INSTANCES=30,b._AUDIO_READY="canplaythrough",b._AUDIO_ENDED="ended",b._AUDIO_SEEKED="seeked",b._AUDIO_STALLED="stalled",b._TIME_UPDATE="timeupdate",b._capabilities=null,b.isSupported=function(){return b._generateCapabilities(),null!=b._capabilities},b._generateCapabilities=function(){if(null==b._capabilities){var a=document.createElement("audio");if(null==a.canPlayType)return null;b._capabilities={panning:!1,volume:!0,tracks:-1};for(var c=createjs.Sound.SUPPORTED_EXTENSIONS,d=createjs.Sound.EXTENSION_MAP,e=0,f=c.length;f>e;e++){var g=c[e],h=d[g]||g;b._capabilities[g]="no"!=a.canPlayType("audio/"+g)&&""!=a.canPlayType("audio/"+g)||"no"!=a.canPlayType("audio/"+h)&&""!=a.canPlayType("audio/"+h)}}},a.register=function(a){var b=createjs.HTMLAudioTagPool.get(a.src),c=this.AbstractPlugin_register(a);return c.setTag(b),c},a.removeSound=function(a){this.AbstractPlugin_removeSound(a),createjs.HTMLAudioTagPool.remove(a)},a.create=function(a,b,c){var d=this.AbstractPlugin_create(a,b,c);return d.setPlaybackResource(null),d},a.toString=function(){return"[HTMLAudioPlugin]"},a.setVolume=a.getVolume=a.setMute=null,createjs.HTMLAudioPlugin=createjs.promote(HTMLAudioPlugin,"AbstractPlugin")}();

H5P.SoundJS = this.createjs.Sound;

this.createjs = old || this.createjs;
;
!function(){"use strict";function t(t){return function(t){if(Array.isArray(t))return e(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||function(t,i){if(!t)return;if("string"==typeof t)return e(t,i);var n=Object.prototype.toString.call(t).slice(8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Array.from(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return e(t,i)}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function e(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,n=new Array(e);i<e;i++)n[i]=t[i];return n}function i(t){return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i(t)}var n=function(){function e(){}return e.extend=function(){for(var t=1;t<arguments.length;t++)for(var e in arguments[t])Object.prototype.hasOwnProperty.call(arguments[t],e)&&("object"===i(arguments[0][e])&&"object"===i(arguments[t][e])?this.extend(arguments[0][e],arguments[t][e]):arguments[0][e]=arguments[t][e]);return arguments[0]},e.htmlDecode=function(t){return(new DOMParser).parseFromString(t,"text/html").documentElement.textContent},e.stripHTML=function(t){var e=document.createElement("div");return e.innerHTML=t,e.textContent||e.innerText||""},e.closestParent=function(t,e){if("object"!==i(t)||"string"!=typeof e)return null;if(!t.parentNode)return null;if("."===e.substr(0,1)){if(e.split(".").filter((function(t){return""!==t})).every((function(e){var i,n;return null===(i=t.parentNode)||void 0===i||null===(n=i.classList)||void 0===n?void 0:n.contains(e)})))return t.parentNode}else if("#"===e.substr(0,1)){if("function"==typeof t.parentNode.getAttribute&&t.parentNode.getAttribute("id")===e.substr(1))return t.parentNode}else if(t.parentNode.tagName.toLowerCase()===e.toLowerCase())return t.parentNode;return this.closestParent(t.parentNode,e)},e.shuffleArray=function(e){var i,n,s,a=t(e);for(s=a.length-1;s>0;s--)i=Math.floor(Math.random()*(s+1)),n=a[s],a[s]=a[i],a[i]=n;return a},e}(),s=n,a=function(){function t(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=e,this.callbacks=s.extend({onPuzzleTileCreated:function(){},onPuzzleTileMoveStarted:function(){},onPuzzleTileMoved:function(){},onPuzzleTileMoveEnded:function(){}},i),this.pathBorders={},this.moveInitialX=null,this.moveInitialY=null,this.deltaX=null,this.deltaY=null,this.isDone=!1,this.scale=1,this.backgroundImage=new Image,this.backgroundImage.addEventListener("load",(function(){t.handleImageLoaded()})),this.backgroundImage.crossOrigin=e.imageCrossOrigin,this.backgroundImage.src=e.imageSource,this.handleTileMoveStarted=this.handleTileMoveStarted.bind(this),this.handleTileMoved=this.handleTileMoved.bind(this),this.handleTileMoveEnded=this.handleTileMoveEnded.bind(this),this.handleAnimationMoveEnded=this.handleAnimationMoveEnded.bind(this),this.tile=document.createElement("div"),this.tile.classList.add("h5p-jigsaw-puzzle-tile"),this.setScale(this.scale)}var e=t.prototype;return e.getDOM=function(){return this.tile},e.getHTML=function(){return this.tile.outerHTML},e.buildSVG=function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=document.createElement("svg");i.setAttribute("width","100%"),i.setAttribute("height","100%"),i.setAttribute("viewBox","0 0 ".concat(e.width+e.stroke," ").concat(e.height+e.stroke));var n=document.createElement("defs"),s=document.createElement("pattern");s.setAttribute("id","h5p-jigsaw-puzzle-".concat(this.params.uuid,"-pattern-").concat(this.params.id)),s.setAttribute("width",this.params.size.width),s.setAttribute("height",this.params.size.height),s.setAttribute("x",-(this.params.gridPosition.x*this.params.baseWidth*this.scale-Math.sign(this.params.gridPosition.x)*this.knob/2)/this.width),s.setAttribute("y",-(this.params.gridPosition.y*this.params.baseHeight*this.scale-Math.sign(this.params.gridPosition.y)*this.knob/2)/this.height);var a=document.createElement("image");a.setAttribute("width",e.image.naturalWidth),a.setAttribute("height",e.image.naturalHeight),a.setAttribute("href",e.image.src),s.appendChild(a),n.appendChild(s),i.appendChild(n);var o=document.createElement("path");return o.setAttribute("fill","url(#h5p-jigsaw-puzzle-".concat(this.params.uuid,"-pattern-").concat(this.params.id,")")),o.setAttribute("stroke-opacity","0"),o.setAttribute("stroke-width",e.stroke),o.setAttribute("d",this.buildPathDash({width:e.baseWidth,height:e.baseHeight,type:e.type,stroke:e.stroke})),i.appendChild(o),["top","right","bottom","left"].forEach((function(n){t.pathBorders[n]=t.buildPathDOM({stroke:e.stroke,color:t.params.borderColor,width:e.baseWidth,height:e.baseHeight,orientation:t.params.borders[n].orientation,opacity:t.params.borders[n].opacity,side:n,gridPosition:{x:t.params.gridPosition.x,y:t.params.gridPosition.y},className:"border-".concat(n)}),i.appendChild(t.pathBorders[n])})),i},e.buildPathDOM=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=document.createElement("path");return t.className&&e.classList.add(t.className),e.setAttribute("fill-opacity","0"),e.setAttribute("stroke",t.color),e.setAttribute("stroke-width",t.stroke),e.setAttribute("stroke-opacity",t.opacity),e.setAttribute("d",this.buildPathSegment({width:t.width,height:t.height,orientation:t.orientation,stroke:t.stroke,side:t.side,gridPosition:{x:this.params.gridPosition.x,y:this.params.gridPosition.y}})),e},e.buildPathSegment=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=Math.min(e.width,e.height)/2,n="right"===e.side?e.width:0;0!==e.gridPosition.x&&(n+=e.stroke/2+i/2);var s="bottom"===e.side?e.height:0;0!==e.gridPosition.y&&(s+=e.stroke/2+i/2);var a="M ".concat(n,", ").concat(s),o="top"===e.side||"bottom"===e.side?"horizontal":"vertical",r=t.PATHS_BORDER["".concat(o,"-").concat(e.orientation)];return"".concat(a," ").concat(r).replace(/@w/g,e.width).replace(/@h/g,e.height).replace(/@knob/g,i).replace(/@gapw/g,(e.width-i)/2).replace(/@gaph/g,(e.height-i)/2)},e.buildPathDash=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=Math.min(e.width,e.height)/2;return t.PATHS[e.type].replace(/@offknob/g,e.stroke/2+i/2).replace(/@off/g,e.stroke/2).replace(/@w/g,e.width).replace(/@h/g,e.height).replace(/@knob/g,i).replace(/@gapw/g,(e.width-i)/2).replace(/@gaph/g,(e.height-i)/2)},e.updateParams=function(t){this.params=s.extend(this.params,t),this.repaintSVG()},e.setZIndex=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";""!==t&&"number"!=typeof t||(this.tile.style.zIndex=t)},e.getGridPosition=function(){return{x:this.params.gridPosition.x,y:this.params.gridPosition.y}},e.getId=function(){return this.params.id},e.setScale=function(t){"number"!=typeof t||t<0||(this.scale=t,this.width=this.scale*this.params.width,this.height=this.scale*this.params.height,this.knob=this.scale*this.params.knobSize,this.stroke=this.scale*this.params.stroke,this.tile.style.width="".concat(this.width+this.stroke,"px"),this.tile.style.height="".concat(this.height+this.stroke,"px"))},e.getSize=function(){return this.tile.style.width&&this.tile.style.height?{baseWidth:this.params.baseWidth,baseHeight:this.params.baseHeight,width:this.width,height:this.height,knob:this.knob,stroke:this.stroke}:null},e.getPosition=function(){return this.tile.style.left&&this.tile.style.top?{x:parseFloat(this.tile.style.left),y:parseFloat(this.tile.style.top)}:null},e.setPosition=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if("number"==typeof t.x&&"number"==typeof t.y){var e=this.params.container,i=e.offsetLeft,n=e.offsetLeft+e.offsetWidth-this.width,s=e.offsetTop,a=e.offsetTop+e.offsetHeight-this.height;this.tile.style.left="".concat(Math.min(Math.max(i,t.x),n),"px"),this.tile.style.top="".concat(Math.min(Math.max(s,t.y),a),"px")}},e.setBorders=function(t){for(var e in t){if("boolean"!=typeof t[e])return;var i=this.tile.querySelector(".border-".concat(e));i&&i.setAttribute("stroke-opacity",t[e]?"1":"0")}},e.setDone=function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.isDone=t},e.show=function(){this.tile.classList.remove("hidden")},e.hide=function(){this.tile.classList.add("hidden")},e.ghost=function(){this.tile.classList.add("ghosted")},e.unghost=function(){this.tile.classList.remove("ghosted")},e.enable=function(){this.tile.removeAttribute("disabled","disabled"),this.isDisabled=!1},e.disable=function(){this.isDisabled=!0,this.tile.setAttribute("disabled","disabled")},e.putInBackground=function(){this.tile.classList.remove("onTop")},e.putOnTop=function(){this.tile.classList.add("onTop")},e.animateMove=function(){this.tile.removeEventListener("transitionend",this.handleAnimationMoveEnded),this.tile.addEventListener("transitionend",this.handleAnimationMoveEnded),this.tile.classList.add("animate-move")},e.repaintSVG=function(){var t=this.buildSVG({id:this.params.id,gridPosition:this.params.gridPosition,baseWidth:this.params.baseWidth,baseHeight:this.params.baseHeight,width:this.params.width,height:this.params.height,stroke:this.params.stroke,image:this.backgroundImage,type:this.params.type});this.tile.innerHTML=t.outerHTML},e.handleImageLoaded=function(){this.setScale(this.scale),this.repaintSVG(),this.callbacks.onPuzzleTileCreated(this),this.tile.addEventListener("touchstart",this.handleTileMoveStarted,!0),this.tile.addEventListener("mousedown",this.handleTileMoveStarted,!0)},e.handleTileMoveStarted=function(t){this.isDisabled||(this.tile.classList.remove("animate-move"),(t=t||window.event).preventDefault(),"touchstart"===t.type?(this.moveInitialX=this.tile.offsetLeft-t.touches[0].clientX,this.moveInitialY=this.tile.offsetTop-t.touches[0].clientY,this.tile.addEventListener("touchmove",this.handleTileMoved,!1),this.tile.addEventListener("touchend",this.handleTileMoveEnded,!1)):(this.moveInitialX=this.tile.offsetLeft-t.clientX,this.moveInitialY=this.tile.offsetTop-t.clientY,document.addEventListener("mousemove",this.handleTileMoved,!0),document.addEventListener("mouseup",this.handleTileMoveEnded,!0)),this.callbacks.onPuzzleTileMoveStarted(this))},e.handleTileMoved=function(t){(t=t||window.event).preventDefault(),"touchmove"===t.type?this.setPosition({x:this.moveInitialX+t.touches[0].clientX,y:this.moveInitialY+t.touches[0].clientY}):this.setPosition({x:this.moveInitialX+t.clientX,y:this.moveInitialY+t.clientY}),this.callbacks.onPuzzleTileMoved(this)},e.handleTileMoveEnded=function(){this.tile.removeEventListener("touchmove",this.handleTileMoved,!1),this.tile.removeEventListener("touchend",this.handleTileMoveEnded,!1),document.removeEventListener("mousemove",this.handleTileMoved,!0),document.removeEventListener("mouseup",this.handleTileMoveEnded,!0),this.tile.classList.add("animate-move"),this.callbacks.onPuzzleTileMoveEnded(this)},e.handleAnimationMoveEnded=function(){this.tile.style.transitionDuration="",this.tile.classList.remove("animate-move"),this.tile.removeEventListener("transitionend",this.handleAnimationMoveEnded)},t}();a.PATHS={"top-left":"M @off, @off l @w, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0 -@h Z","top-inner":"M @offknob, @off l @w, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z","top-right":"M @offknob, @off l @w, 0 l 0, @h l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z","inner-left":"M @off, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@h Z","inner-inner":"M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z","inner-right":"M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @h l -@gapw, 0 a 1 1 0 0 0 -@knob 0 l -@gapw, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z","bottom-left":"M @off, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@w, 0 l 0, -@h Z","bottom-inner":"M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph l -@w, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z","bottom-right":"M @offknob, @offknob l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0 l 0, @h l -@w, 0 l 0, -@gaph a 1 1 0 0 1 0 -@knob l 0, -@gaph Z"},a.PATHS_BORDER={"horizontal-straight":"l @w, 0","horizontal-up":"l @gapw, 0 a 1 1 0 0 1 @knob 0 l @gapw, 0","horizontal-down":"l @gapw, 0 a 1 1 0 0 0 @knob 0 l @gapw, 0","vertical-straight":"l 0, @h","vertical-left":"l 0, @gaph a 1 1 0 0 0 0 @knob l 0, @gaph","vertical-right":"l 0, @gaph a 1 1 0 0 1 0 @knob l 0, @gaph"};var o=function(){function t(t,e){var i=this;this.params=s.extend({a11y:{active:"",disabled:"",inactive:""},active:!1,classes:[],disabled:!1,hidden:!1,type:"pulse",noTabWhenDisabled:!1},t||{}),Array.isArray(this.params.classes)||(this.params.classes=[this.params.classes]),"pulse"===this.params.type&&(this.params.a11y.inactive||(this.params.a11y.inactive=this.params.a11y.active||""),this.params.a11y.active||(this.params.a11y.active=this.params.a11y.inactive||"")),this.active=this.params.active,this.disabled=this.params.disabled,this.visible=!this.params.hidden,this.callbacks=s.extend({onClick:function(){}},e),this.button=document.createElement("button"),this.params.classes&&this.params.classes.forEach((function(t){i.button.classList.add(t)})),this.button.setAttribute("aria-pressed",this.params.active),this.button.setAttribute("tabindex","0"),!0===this.params.active?this.activate():this.deactivate(),!0===this.params.disabled?this.disable():this.enable(),!0===this.params.hidden?this.hide():this.show(),this.button.addEventListener("click",(function(t){i.disabled||("toggle"===i.params.type&&i.toggle(),i.callbacks.onClick(t))}))}var e=t.prototype;return e.getDOM=function(){return this.button},e.show=function(){this.button.classList.remove("h5p-jigsaw-puzzle-display-none"),this.visible=!0},e.hide=function(){this.button.classList.add("h5p-jigsaw-puzzle-display-none"),this.visible=!1},e.enable=function(){this.disabled=!1,this.button.classList.remove("h5p-jigsaw-puzzle-button-disabled"),this.params.noTabWhenDisabled&&this.button.setAttribute("tabindex",0),this.active?this.activate():this.deactivate()},e.disable=function(){this.button.classList.add("h5p-jigsaw-puzzle-button-disabled"),this.button.setAttribute("aria-label",this.params.a11y.disabled),this.params.noTabWhenDisabled&&this.button.setAttribute("tabindex",-1),this.disabled=!0},e.activate=function(){this.disabled||("toggle"===this.params.type&&(this.button.classList.add("h5p-jigsaw-puzzle-button-active"),this.button.setAttribute("aria-pressed",!0)),this.button.setAttribute("aria-label",this.params.a11y.active),this.active=!0)},e.deactivate=function(){this.disabled||(this.active=!1,"toggle"===this.params.type&&(this.button.classList.remove("h5p-jigsaw-puzzle-button-active"),this.button.setAttribute("aria-pressed",!1)),this.button.setAttribute("aria-label",this.params.a11y.inactive))},e.toggle=function(t){this.disabled||((t="boolean"==typeof t?t:!this.active)?this.activate():this.deactivate())},e.isActive=function(){return this.active},e.isDisabled=function(){return this.disabled},e.isVisible=function(){},t}(),r=function(){function t(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({a11y:{buttonFullscreenEnter:"Enter fullscreen mode",buttonFullscreenExit:"Exit fullscreen mode",buttonAudioMute:"Mute music",buttonAudioUnmute:"Unmute music"}},e),this.callbacks=s.extend({onButtonFullscreenClicked:function(){},onButtonAudioClicked:function(){}},i),this.numberVisibleButtons=0,this.titleBar=document.createElement("div"),this.titleBar.classList.add("h5p-jigsaw-puzzle-title-bar"),this.buttonAudio=new o({type:"toggle",classes:["h5p-jigsaw-puzzle-button","h5p-jigsaw-puzzle-button-audio"],disabled:!0,noTabWhenDisabled:!0,hidden:!0,a11y:{active:this.params.a11y.buttonAudioMute,inactive:this.params.a11y.buttonAudioUnmute,disabled:this.params.a11y.disabled}},{onClick:function(e){t.callbacks.onButtonAudioClicked(e)}}),this.titleBar.appendChild(this.buttonAudio.getDOM()),this.buttonFullscreen=new o({type:"toggle",classes:["h5p-jigsaw-puzzle-button","h5p-jigsaw-puzzle-button-fullscreen"],disabled:!0,noTabWhenDisabled:!0,hidden:!0,a11y:{active:this.params.a11y.buttonFullscreenExit,inactive:this.params.a11y.buttonFullscreenEnter,disabled:this.params.a11y.disabled}},{onClick:function(){t.callbacks.onButtonFullscreenClicked()}}),this.titleBar.appendChild(this.buttonFullscreen.getDOM())}var e=t.prototype;return e.getDOM=function(){return this.titleBar},e.showFullscreenButton=function(){this.buttonFullscreen.show(),this.numberVisibleButtons++,this.visible||this.show()},e.showAudioButton=function(){this.buttonAudio.show(),this.numberVisibleButtons++,this.visible||this.show()},e.disableFullscreenButton=function(){this.buttonFullscreen.disable()},e.disableAudioButton=function(){this.buttonAudio.disable()},e.enableFullscreenButton=function(){this.buttonFullscreen.enable()},e.enableAudioButton=function(){this.buttonAudio.enable()},e.getAudioButtonState=function(){return this.buttonAudio.isActive()},e.toggleFullscreenButton=function(t){"string"==typeof t&&("enter"===t?t=!1:"exit"===t&&(t=!0)),"boolean"==typeof t&&this.buttonFullscreen.toggle(t)},e.toggleAudioButton=function(t){"string"==typeof t&&("mute"===t?t=!1:"unmute"===t&&(t=!0)),"boolean"==typeof t&&this.buttonAudio.toggle(t)},e.hasVisibleButtons=function(){return this.numberVisibleButtons>0},e.show=function(){this.titleBar.classList.remove("display-none"),this.visible=!0},e.hide=function(){this.titleBar.classList.add("display-none"),this.false=!0},t}();function l(t){return function(t){if(Array.isArray(t))return h(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||function(t,e){if(!t)return;if("string"==typeof t)return h(t,e);var i=Object.prototype.toString.call(t).slice(8,-1);"Object"===i&&t.constructor&&(i=t.constructor.name);if("Map"===i||"Set"===i)return Array.from(t);if("Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i))return h(t,e)}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function h(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,n=new Array(e);i<e;i++)n[i]=t[i];return n}var u=function(){function t(){var t,e,i=this,n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(this.params=n,this.callbacks=s.extend({onResize:function(){},onCompleted:function(){},onButtonFullscreenClicked:function(){},onInteracted:function(){}},a),this.audios=[],this.tiles=[],this.tilesCreated=0,this.originalSize=null,this.maxSize={heigth:null,width:null},this.borderWidth=2,this.isAnswerGiven=!1,this.h5pQuestionContent=null,this.h5pQuestionButtons=null,this.content=document.createElement("div"),this.content.classList.add("h5p-jigsaw-puzzle-content"),null===(t=this.params)||void 0===t||null===(e=t.puzzleImageInstance)||void 0===e||!e.source){var o=document.createElement("div");return o.classList.add("h5p-jigsaw-puzzle-message"),o.innerText=this.params.l10n.messageNoImage,void this.content.appendChild(o)}this.addTitlebar(),this.addPuzzleArea(),this.image=document.createElement("img"),this.image.addEventListener("load",(function(){i.handleImageLoaded(i.params.imageFormat)})),this.imageCrossOrigin="function"==typeof H5P.getCrossOrigin?H5P.getCrossOrigin(n.puzzleImageInstance.source):"Anonymous",this.image.src=n.puzzleImageInstance.source,"undefined"==typeof H5PEditor&&this.addAudios()}var e=t.prototype;return e.getDOM=function(){return this.content},e.addTitlebar=function(){var t=this;this.titlebar=new r({a11y:{buttonFullscreenEnter:this.params.a11y.buttonFullscreenEnter,buttonFullscreenExit:this.params.a11y.buttonFullscreenExit,buttonAudioMute:this.params.a11y.buttonAudioMute,buttonAudioUnmute:this.params.a11y.buttonAudioUnmute,disabled:this.params.a11y.disabled}},{onButtonAudioClicked:function(e){t.handleButtonAudioClicked(e)},onButtonFullscreenClicked:function(e){t.handleButtonFullscreenClicked(e)}}),this.content.appendChild(this.titlebar.getDOM())},e.addPuzzleArea=function(){var t=this;this.puzzleArea=document.createElement("div"),this.puzzleArea.classList.add("h5p-jigsaw-puzzle-puzzle-area"),"column"===this.params.sortingSpacePosition&&this.puzzleArea.classList.add("h5p-jigsaw-puzzle-puzzle-direction-column"),this.content.appendChild(this.puzzleArea),this.puzzleDropzone=document.createElement("div"),this.puzzleDropzone.classList.add("h5p-jigsaw-puzzle-tile-container"),this.puzzleArea.appendChild(this.puzzleDropzone),window.requestAnimationFrame((function(){var e=window.getComputedStyle(t.puzzleDropzone);t.borderWidth=parseFloat(e.getPropertyValue("border-width"))||t.borderWidth})),this.sortingArea=document.createElement("div"),this.sortingArea.classList.add("h5p-jigsaw-puzzle-sorting-area"),"row"===this.params.sortingSpacePosition&&(this.sortingArea.style.width="".concat(100*this.params.sortingSpace/(100-this.params.sortingSpace),"%")),this.puzzleArea.appendChild(this.sortingArea)},e.createPuzzleTile=function(t){var e=this,i=this.image.naturalWidth/this.params.size.width,n=this.image.naturalHeight/this.params.size.height,s=Math.min(i,n)/2,o=i+(t.x>0?s/2:0),r=n+(t.y>0?s/2:0),l={top:{orientation:0===t.y?"straight":"up",opacity:1},right:{orientation:t.x+1===this.params.size.width?"straight":"left",opacity:1},bottom:{orientation:t.y+1===this.params.size.height?"straight":"up",opacity:1},left:{orientation:0===t.x?"straight":"left",opacity:1}},h="inner";0===t.y?h="top":t.y+1===this.params.size.height&&(h="bottom");var u="inner";0===t.x?u="left":t.x+1===this.params.size.width&&(u="right");var d="".concat(h,"-").concat(u);return new a({id:t.y*this.params.size.width+t.x,baseWidth:i,baseHeight:n,width:o,height:r,gridPosition:{x:t.x,y:t.y},knobSize:s,imageSource:this.image.src,imageCrossOrigin:this.imageCrossOrigin,type:d,stroke:this.params.stroke,borderColor:this.params.tileBorderColor,borders:l,uuid:this.params.uuid,container:this.puzzleArea,size:this.params.size},{onPuzzleTileCreated:function(t){e.handlePuzzleTileCreated(t)},onPuzzleTileMoveStarted:function(t){e.handlePuzzleTileMoveStarted(t)},onPuzzleTileMoved:function(t){e.handlePuzzleTileMoved(t)},onPuzzleTileMoveEnded:function(t){e.handlePuzzleTileMoveEnded(t)}})},e.setTilePosition=function(){var t,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};e.tile&&("number"!=typeof e.x||e.x<0||"number"!=typeof e.y||e.y<0||(e.animate=null!==(t=e.animate)&&void 0!==t&&t,e.animate&&e.tile.animateMove({duration:e.duration}),this.tiles[e.tile.getId()].position={x:(e.x-this.puzzleDropzone.offsetLeft)/this.puzzleDropzone.offsetWidth,y:(e.y-this.puzzleDropzone.offsetTop)/this.puzzleDropzone.offsetHeight},e.tile.setPosition({x:e.x,y:e.y})))},e.getAssetPath=function(t){var e,i;if(-1!==t.indexOf("sites/default/files/h5p/development"))return t;var n=null,s=null===(e=H5PIntegration)||void 0===e||null===(i=e.contents["cid-".concat(this.params.contentId)])||void 0===i?void 0:i.library;if(-1!==(null==s?void 0:s.indexOf("H5P.JigsawPuzzle "))&&(n=s.replace(" ","-")),!n){var a,o,r=null===(a=H5PIntegration)||void 0===a||null===(o=a.contents["cid-".concat(this.params.contentId)])||void 0===o?void 0:o.jsonContent;if(!r)return null;var l=RegExp('"library":"(H5P.JigsawPuzzle [0-9]+.[0-9]+)"'),h=r.match(l);h&&(n=h[1].replace(" ","-"))}if(!n)return null;var u=H5P.getLibraryPath(n),d=t.substr(t.indexOf("/assets"));return"".concat(u,"/dist").concat(d)},e.addAudios=function(){var t=this;this.params.sound&&!this.audiosDefined&&H5P.SoundJS.initializeDefaultPlugins()&&(H5P.SoundJS.alternateExtensions=["mp3"],["puzzleStarted","puzzleTilePickUp","puzzleTileCorrect","puzzleTileIncorrect","puzzleCompleted"].forEach((function(e){t.params.sound[e]&&t.params.sound[e].length>0&&t.params.sound[e][0].path&&(H5P.SoundJS.registerSound(H5P.getPath(t.params.sound[e][0].path,t.params.contentId),e),t.hasAudios=!0)})),this.audiosDefined=!0)},e.startAudio=function(t){this.isAudioEnabled&&H5P.SoundJS.play(t,H5P.SoundJS.INTERRUPT_NONE,0)},e.stopAudios=function(){H5P.SoundJS.stop()},e.setH5PQuestionElements=function(t){this.h5pQuestionContent=t.querySelector(".h5p-question-content"),this.h5pQuestionButtons=t.querySelector(".h5p-question-buttons")},e.enableFullscreenButton=function(){this.titlebar&&(this.titlebar.enableFullscreenButton(),this.titlebar.showFullscreenButton())},e.toggleFullscreen=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.titlebar.toggleFullscreenButton(t),this.setFixedHeight(t)},e.setFixedHeight=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(t){var e=window.getComputedStyle(this.h5pQuestionContent),i=parseFloat(e.getPropertyValue("margin-bottom")),n=parseFloat(e.getPropertyValue("margin-left"))+parseFloat(e.getPropertyValue("margin-right")),s=window.getComputedStyle(this.h5pQuestionButtons),a=parseFloat(s.getPropertyValue("margin-bottom"))+parseFloat(s.getPropertyValue("margin-top"));this.maxSize={height:window.innerHeight-2*this.params.stroke-this.puzzleArea.offsetTop-i-a-this.h5pQuestionButtons.offsetHeight,width:(window.innerWidth-2*this.params.stroke-n)*(100-this.params.sortingSpace)/100}}else this.maxSize={heigth:null,width:null};this.handleResized()},e.reset=function(){var t=this;setTimeout((function(){t.tiles.forEach((function(e){t.showTileBorders(e.instance),e.instance.enable(),e.instance.setDone(!1)})),t.randomizeTiles({useFullArea:t.params.useFullArea,layout:t.params.randomizerPattern,keepDone:!1}),t.isAnswerGiven=!1,t.tilesCreated=0,t.startAudio("puzzleStarted")}),0)},e.randomizeTiles=function(){for(var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=s.shuffleArray(this.tiles),n=i.length;n>=0;n--)this.puzzleArea.appendChild(i[Math.random()*n|0].instance.getDOM());e.keepDone&&(i=i.map((function(t){return t.instance.isDone?null:t})));var a=this.tiles.reduce((function(t,e){return{width:Math.max(t.width,e.instance.getSize().width),height:Math.max(t.height,e.instance.getSize().height)}}),{width:0,height:0}),o=e.useFullArea||this.sortingArea.offsetWidth<a.width||this.sortingArea.offsetHeight<a.height,r={left:this.puzzleArea.offsetLeft,top:this.puzzleArea.offsetTop};o||(r.left+="column"===this.params.sortingSpacePosition?0:this.puzzleDropzone.offsetWidth,r.top+="column"===this.params.sortingSpacePosition?this.puzzleDropzone.offsetHeight:0);var l={x:this.sortingArea.offsetWidth-a.width,y:this.sortingArea.offsetHeight-a.height};o&&(l.x+="column"===this.params.sortingSpacePosition?0:this.puzzleDropzone.offsetWidth,l.y+="column"===this.params.sortingSpacePosition?this.puzzleDropzone.offsetHeight:0),i.forEach((function(e){if(null!==e){var i,n,s=e.instance;i=r.left+Math.random()*l.x,n=r.top+Math.random()*l.y,t.setTilePosition({tile:s,x:i,y:n,animate:!0})}}))},e.moveTileToTarget=function(t){var e,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};i.animate=null!==(e=i.animate)&&void 0!==e&&e;var n=t.getSize(),s=t.getGridPosition(),a={x:this.puzzleDropzone.offsetLeft+s.x*n.width-Math.sign(s.x)*n.knob/2-s.x*n.knob/2,y:this.puzzleDropzone.offsetTop+s.y*n.height-Math.sign(s.y)*n.knob/2-s.y*n.knob/2};this.setTilePosition({tile:t,x:a.x,y:a.y,animate:i.animate})},e.moveTilesToTarget=function(t){var e,i,n=this,s=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};t=t?t.map((function(t){return t.instance?t:{instance:t}})):this.tiles,s.animate=null===(e=s.animate)||void 0===e||e,s.finalize=null===(i=s.finalize)||void 0===i||i,t.forEach((function(t){n.moveTileToTarget(t.instance,{animate:s.animate}),s.finalize&&n.finalizeTile(t.instance)}))},e.finalizeTile=function(t){t.disable(),t.putInBackground(),this.hideTileBorders(t),t.setDone(!0)},e.updatePuzzleOutlines=function(t,e){var i=e.getDOM(),n=this.puzzleOutlines[t];n.style.width=i.style.width,n.style.height=i.style.height;var s=e.getSize(),a=e.getGridPosition(),o={x:this.puzzleDropzone.offsetLeft+a.x*s.width-Math.sign(a.x)*s.knob/2-a.x*s.knob/2,y:this.puzzleDropzone.offsetTop+a.y*s.height-Math.sign(a.y)*s.knob/2-a.y*s.knob/2};if(this.puzzleOutlines[t].style.left="".concat(o.x,"px"),this.puzzleOutlines[t].style.top="".concat(o.y,"px"),!n.isConnected){if(this.puzzleDropzone.appendChild(n),e.getId()<this.params.size.width){var r=n.querySelector(".border-top");r&&r.setAttribute("stroke-opacity","0")}if(e.getId()%this.params.size.width==this.params.size.width-1){var l=n.querySelector(".border-right");l&&l.setAttribute("stroke-opacity","0")}if(this.params.size.width*(this.params.size.height-1)-1<e.getId()){var h=n.querySelector(".border-bottom");h&&h.setAttribute("stroke-opacity","0")}if(e.getId()%this.params.size.width==0){var u=n.querySelector(".border-left");u&&u.setAttribute("stroke-opacity","0")}}},e.showTileBorders=function(t){t.setBorders({top:!0,right:!0,bottom:!0,left:!0})},e.hideTileBorders=function(t){if(t.getId()<this.params.size.width)t.setBorders({top:!1});else{var e=this.tiles[t.getId()-this.params.size.width].instance;e.isDisabled&&(t.setBorders({top:!1}),e.setBorders({bottom:!1}))}if(t.getId()%this.params.size.width==this.params.size.width-1)t.setBorders({right:!1});else{var i=this.tiles[t.getId()+1].instance;i.isDisabled&&(t.setBorders({right:!1}),i.setBorders({left:!1}))}if(this.params.size.width*(this.params.size.height-1)-1<t.getId())t.setBorders({bottom:!1});else{var n=this.tiles[t.getId()+this.params.size.width].instance;n.isDisabled&&(t.setBorders({bottom:!1}),n.setBorders({top:!1}))}if(t.getId()%this.params.size.width==0)t.setBorders({left:!1});else{var s=this.tiles[t.getId()-1].instance;s.isDisabled&&(t.setBorders({left:!1}),s.setBorders({right:!1}))}},e.getAnswerGiven=function(){return this.isAnswerGiven},e.getScore=function(){return this.tiles.reduce((function(t,e){return t+(e.instance.isDone?1:0)}),0)},e.getCurrentState=function(){return{audioButtonState:this.titlebar.getAudioButtonState(),tiles:this.tiles.map((function(t){return t.instance.isDone}))}},e.handleImageLoaded=function(t){this.originalSize={width:this.image.naturalWidth,height:this.image.naturalHeight};for(var e=0;e<this.params.size.height;e++)for(var i=0;i<this.params.size.width;i++)this.tiles.push({instance:this.createPuzzleTile({x:i,y:e,format:t}),position:{x:0,y:0}});if(this.params.showBackground){var n=document.createElement("img");n.classList.add("h5p-jigsaw-puzzle-background-image"),n.setAttribute("src",this.image.src),this.puzzleDropzone.appendChild(n)}var s,a;this.hasAudios&&(this.titlebar.showAudioButton(),this.titlebar.enableAudioButton(),this.isAudioEnabled=(null===(s=this.params)||void 0===s||null===(a=s.previousState)||void 0===a?void 0:a.audioButtonState)||!0,this.titlebar.toggleAudioButton(this.isAudioEnabled));this.handleResized()},e.handleResized=function(){var t=this;if(this.originalSize){var e=(this.puzzleDropzone.offsetWidth-this.borderWidth)/this.originalSize.width,i={height:e*this.originalSize.height-this.borderWidth,width:e*this.originalSize.width-this.borderWidth};if(this.maxSize.height&&(this.puzzleDropzone.style.width||i.height>this.maxSize.height||i.width>this.maxSize.width)?((this.maxSize.height-this.borderWidth)/this.originalSize.height<(this.maxSize.width-this.borderWidth)/this.originalSize.width?(this.scale=(this.maxSize.height-this.borderWidth)/this.originalSize.height,this.puzzleDropzone.style.height="".concat(this.maxSize.height-2*this.borderWidth,"px"),this.puzzleDropzone.style.width="".concat(this.scale*this.originalSize.width-this.borderWidth,"px")):(this.scale=(this.maxSize.width-this.borderWidth)/this.originalSize.width,this.puzzleDropzone.style.height="".concat(this.scale*this.originalSize.height-this.borderWidth,"px"),this.puzzleDropzone.style.width="".concat(this.maxSize.width-2*this.borderWidth,"px")),this.puzzleDropzone.style.flexShrink=0):(this.scale=e,this.puzzleDropzone.style.height="".concat(i.height,"px"),this.puzzleDropzone.style.width="",this.puzzleDropzone.style.flexShrink=""),"column"===this.params.sortingSpacePosition){var n=this.params.sortingSpaceColumn/100*parseFloat(this.puzzleDropzone.style.height);this.sortingArea.style.height="".concat(n,"px")}this.tiles.forEach((function(e,i){e.instance.setScale(t.scale),e.instance.setPosition({x:e.position.x*t.puzzleDropzone.offsetWidth+t.puzzleDropzone.offsetLeft,y:e.position.y*t.puzzleDropzone.offsetHeight+t.puzzleDropzone.offsetTop}),t.puzzleOutlines&&t.updatePuzzleOutlines(i,e.instance)}))}this.callbacks.onResize()},e.handlePuzzleTileMoveStarted=function(t){this.tiles.forEach((function(t){t.instance.putInBackground(),t.instance.isDisabled||t.instance.ghost()})),t.putOnTop(),t.unghost(),this.startAudio("puzzleTilePickUp")},e.handlePuzzleTileMoved=function(){},e.handlePuzzleTileMoveEnded=function(e){this.tiles.forEach((function(t){t.instance.unghost()}));var i=e.getPosition(),n=e.getSize(),s=e.getGridPosition();this.tiles[e.getId()].position=i;var a={x:this.puzzleDropzone.offsetLeft+s.x*n.width-Math.sign(s.x)*n.knob/2-s.x*n.knob/2,y:this.puzzleDropzone.offsetTop+s.y*n.height-Math.sign(s.y)*n.knob/2-s.y*n.knob/2},o=Math.min(n.width,n.height)*t.SLACK_FACTOR;Math.abs(i.x-a.x)<o&&Math.abs(i.y-a.y)<o?(this.setTilePosition({tile:e,x:a.x,y:a.y}),this.finalizeTile(e),this.startAudio("puzzleTileCorrect")):(this.setTilePosition({tile:e,x:i.x,y:i.y}),e.setDone(!1),this.startAudio("puzzleTileIncorrect")),this.isAnswerGiven=!0,this.callbacks.onInteracted(),this.tiles.every((function(t){return t.instance.isDone}))&&this.handlePuzzleCompleted({xAPI:!0})},e.handleButtonAudioClicked=function(t){var e=(null==t?void 0:t.currentTarget.classList)||[];this.isAudioEnabled=-1!==l(e).indexOf("h5p-jigsaw-puzzle-button-active"),this.isAudioEnabled||this.stopAudios()},e.handleButtonFullscreenClicked=function(){this.callbacks.onButtonFullscreenClicked()},e.handlePuzzleCompleted=function(t){this.startAudio("puzzleCompleted"),this.callbacks.onCompleted(t)},e.handlePuzzleTileCreated=function(t){var e=this;if(this.params.previousState.tiles&&!0===this.params.previousState.tiles[t.getId()]&&this.moveTilesToTarget([t],{animate:!1,finalize:!0}),this.puzzleArea.appendChild(t.getDOM()),this.tilesCreated++,this.tilesCreated===this.params.size.width*this.params.size.height){if(this.params.showPuzzleOutlines){var i=window.getComputedStyle(this.puzzleDropzone).getPropertyValue("border-color").replace(/[^.^\d,]/g,"").split(",").map((function(t){return parseFloat(t,10)}));4===i.length?i[3]/=2:i=[0,0,0,.05],i="rgba(".concat(i.join(","),")"),setTimeout((function(){e.puzzleOutlines=e.tiles.map((function(t){var e=t.instance.getDOM().cloneNode(!0);e.setAttribute("disabled","disabled");var n=e.querySelector("svg path");return n&&n.parentNode.removeChild(n),e.querySelectorAll("svg path").forEach((function(t){t.setAttribute("stroke",i)})),e}))}),0)}setTimeout((function(){e.handleResized(),e.handleAllTilesCreated()}),0)}},e.handleAllTilesCreated=function(){var t,e=this,i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:500,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1/0;if((null===(t=this.puzzleArea)||void 0===t?void 0:t.offsetWidth)>0)this.handleDOMVisible();else{if(0===n)return void this.tiles.forEach((function(t){t.instance.show()}));this.tiles.forEach((function(t){t.instance.hide()})),clearTimeout(this.timeoutWaitForPuzzleArea),this.timeoutWaitForPuzzleArea=setTimeout((function(){e.handleAllTilesCreated(i,n-1)}),i)}},e.handleDOMVisible=function(){var t=this;this.tiles.forEach((function(t){t.instance.show()})),this.moveTilesToTarget(this.tiles,{animate:!1,finalize:!1}),setTimeout((function(){t.randomizeTiles({useFullArea:t.params.useFullArea,keepDone:Object.keys(t.params.previousState).length>0}),t.startAudio("puzzleStarted"),window.requestAnimationFrame((function(){t.isPuzzleSetUp=!0,setTimeout((function(){t.handleResized()}),250)}))}),500)},e.updateTitlebarVisibility=function(){this.titlebar.hasVisibleButtons()||this.titlebar.hide()},t}();function d(t,e){return d=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},d(t,e)}u.SLACK_FACTOR=.25;var c=function(t){var e,i;function n(e,i){var n,a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};for(var o in(n=t.call(this,"jigsaw-puzzle")||this).params=s.extend({tilesHorizontal:4,tilesVertical:3,behaviour:{sortingSpacePosition:"row",sortingSpace:50,sortingSpaceColumn:100,useFullArea:!1,enableComplete:!0,enableSolutionsButton:!0,enableRetry:!0,showBackground:!0,showPuzzleOutlines:!0},l10n:{complete:"Complete",tryAgain:"Retry",messageNoImage:"There was no image given for this jigsaw puzzle."},a11y:{buttonFullscreenEnter:"Enter fullscreen mode",buttonFullscreenExit:"Exit fullscreen mode",complete:"Complete the puzzle. All tiles will be put to their correct position.",tryAgain:"Retry the puzzle. All puzzle tiles will be shuffled on the canvas.",disabled:"Disabled",close:"Close"}},e),n.params.l10n)n.params.l10n[o]=s.stripHTML(s.htmlDecode(n.params.l10n[o]));for(var r in n.params.a11y)n.params.a11y[r]=s.stripHTML(s.htmlDecode(n.params.a11y[r]));return n.contentId=i,n.extras=a,n.previousState=n.extras.previousState||{},n.uuid=H5P.createUUID(),n.params.puzzleImage&&(n.puzzleImageInstance=H5P.newRunnable(n.params.puzzleImage,n.contentId)),n.on("resize",(function(){n.handleH5PResized()})),n}i=t,(e=n).prototype=Object.create(i.prototype),e.prototype.constructor=e,d(e,i);var a=n.prototype;return a.registerDomElements=function(){var t,e,i,n,s,a,o,r,l=this;this.content=new u({contentId:this.contentId,imageFormat:null===(t=this.params)||void 0===t||null===(e=t.puzzleImage)||void 0===e||null===(i=e.params)||void 0===i||null===(n=i.file)||void 0===n?void 0:n.mime,previousState:this.previousState,puzzleImageInstance:this.puzzleImageInstance,showBackground:this.params.behaviour.showBackground,showPuzzleOutlines:this.params.behaviour.showPuzzleOutlines,size:{width:this.params.tilesHorizontal,height:this.params.tilesVertical},sortingSpacePosition:this.params.behaviour.sortingSpacePosition,sortingSpace:this.params.behaviour.sortingSpace,sortingSpaceColumn:this.params.behaviour.sortingSpaceColumn,sound:this.params.sound||{},stroke:Math.max(window.innerWidth/750,1.75),tileBorderColor:"rgba(88, 88, 88, 0.5)",useFullArea:this.params.behaviour.useFullArea,uuid:this.uuid,a11y:{buttonFullscreenEnter:this.params.a11y.buttonFullscreenEnter,buttonFullscreenExit:this.params.a11y.buttonFullscreenExit,disabled:this.params.a11y.disabled,close:this.params.a11y.close},l10n:{messageNoImage:this.params.l10n.messageNoImage}},{onResize:function(){l.handleOnResize()},onCompleted:function(t){l.handlePuzzleCompleted(t)},onButtonFullscreenClicked:function(){l.toggleFullscreen()},onInteracted:function(){l.handleInteracted()}}),this.setContent(this.content.getDOM()),null!==(s=this.params)&&void 0!==s&&null!==(a=s.puzzleImage)&&void 0!==a&&null!==(o=a.params)&&void 0!==o&&null!==(r=o.file)&&void 0!==r&&r.path&&(this.addButtons(),"complete"===document.readyState?window.requestAnimationFrame((function(){l.handleDOMInitialized()})):document.addEventListener("readystatechange",(function(){"complete"===document.readyState&&window.requestAnimationFrame((function(){l.handleDOMInitialized()}))})),window.addEventListener("orientationchange",(function(){H5P.isFullscreen&&setTimeout((function(){l.content.setFixedHeight(!0)}),200)}),!1))},a.addButtons=function(){var t,e,i,n,s,a=this;this.addButton("complete",this.params.l10n.complete,(function(){a.handleClickButtonComplete({xAPI:!0})}),this.params.behaviour.enableComplete&&(null===(t=this.previousState)||void 0===t||null===(e=t.tiles)||void 0===e?void 0:e.some((function(t){return!t}))),{"aria-label":this.params.a11y.complete},{}),this.addButton("try-again",this.params.l10n.tryAgain,(function(){a.handleClickButtonRetry()}),this.params.behaviour.enableRetry&&!(null===(i=this.previousState)||void 0===i||!i.tiles)&&(null===(n=this.previousState)||void 0===n||null===(s=n.tiles)||void 0===s?void 0:s.some((function(t){return t}))),{"aria-label":this.params.a11y.tryAgain},{})},a.disableButtons=function(){for(var t in this.buttons)this.disableButton(t)},a.disableButton=function(t){this.buttons[t]&&(this.buttons[t].setAttribute("disabled",!0),this.buttons[t].classList.add("disabled"))},a.enableButtons=function(){for(var t in this.buttons)this.enableButton(t)},a.enableButton=function(t){this.buttons[t]&&(this.buttons[t].removeAttribute("disabled"),this.buttons[t].classList.remove("disabled"))},a.toggleFullscreen=function(t){var e=this;this.container&&("string"==typeof t&&("enter"===t?t=!1:"exit"===t&&(t=!0)),"boolean"!=typeof t&&(t=!H5P.isFullscreen),!0===t?H5P.fullScreen(H5P.jQuery(this.container),this):(H5P.exitFullScreen(),setTimeout((function(){e.trigger("resize")}),100),setTimeout((function(){e.trigger("resize")}),500)))},a.getAnswerGiven=function(){return!!this.content&&this.content.getAnswerGiven()},a.getScore=function(){return this.content?this.content.getScore():0},a.getMaxScore=function(){return this.params.tilesHorizontal*this.params.tilesVertical},a.showSolutions=function(){this.content||(this.handleClickButtonComplete({xAPI:!1}),this.trigger("resize"))},a.resetTask=function(){this.params.behaviour.enableComplete&&this.showButton("complete"),this.hideButton("try-again"),this.content&&this.content.reset(),this.trigger("resize")},a.getXAPIData=function(){return{statement:this.getXAPIAnsweredEvent().data.statement}},a.getXAPIAnsweredEvent=function(){var t=this.createXAPIEvent("answered");return t.setScoredResult(this.getScore(),this.getMaxScore(),this,!0,this.isPassed()),t},a.createXAPIEvent=function(t){var e=this.createXAPIEventTemplate(t);return s.extend(e.getVerifiedStatementValue(["object","definition"]),this.getxAPIDefinition()),e},a.getxAPIDefinition=function(){var t=this.getDescription();return{name:{"en-US":this.getTitle()},description:{"en-US":t},type:"http://adlnet.gov/expapi/activities/cmi.interaction",interactionType:"other"}},a.isPassed=function(){return this.getScore()>=this.getMaxScore()},a.getTitle=function(){var t;return this.extras.metadata&&(t=this.extras.metadata.title),t=t||n.DEFAULT_DESCRIPTION,H5P.createTitle(t)},a.getDescription=function(){return this.params.taskDescription||n.DEFAULT_DESCRIPTION},a.getCurrentState=function(){var t,e,i,n;if(null!==(t=this.params)&&void 0!==t&&null!==(e=t.puzzleImage)&&void 0!==e&&null!==(i=e.params)&&void 0!==i&&null!==(n=i.file)&&void 0!==n&&n.path&&this.content)return this.content.getCurrentState()},a.handleDOMInitialized=function(){var t=this;this.container=s.closestParent(this.content.getDOM(),".h5p-jigsaw-puzzle"),this.container&&(this.content.setH5PQuestionElements(this.container),this.isRoot()&&H5P.fullscreenSupported?(this.content.enableFullscreenButton(),this.on("enterFullScreen",(function(){setTimeout((function(){t.content.toggleFullscreen(!0)}),200)})),this.on("exitFullScreen",(function(){t.content.toggleFullscreen(!1)}))):this.content.updateTitlebarVisibility(),this.buttons={},this.buttons.complete=this.container.querySelector(".h5p-question-complete"),this.buttons["try-again"]=this.container.querySelector(".h5p-question-try-again"))},a.handleH5PResized=function(){!this.bubblingUpwards&&this.content&&this.content.handleResized()},a.handleOnResize=function(){this.bubblingUpwards=!0,this.trigger("resize"),this.bubblingUpwards=!1},a.handleInteracted=function(){this.getScore()>0&&this.showButton("try-again"),this.triggerXAPI("interacted")},a.handlePuzzleCompleted=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.hideButton("complete"),this.showButton("try-again"),t.xAPI&&this.trigger(this.getXAPIAnsweredEvent())},a.handleClickButtonComplete=function(t){this.handleInteracted(),this.content.handlePuzzleCompleted(t),this.content.moveTilesToTarget()},a.handleClickButtonRetry=function(){this.resetTask()},n}(H5P.Question);c.DEFAULT_DESCRIPTION="Jigsaw Puzzle",H5P=H5P||{},H5P.JigsawPuzzle=c}();;
