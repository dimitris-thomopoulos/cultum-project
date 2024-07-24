H5P.AdvancedText = (function ($, EventDispatcher) {

  /**
   * A simple library for displaying text with advanced styling.
   *
   * @class H5P.AdvancedText
   * @param {Object} parameters
   * @param {Object} [parameters.text='New text']
   * @param {number} id
   */
  function AdvancedText(parameters, id) {
    var self = this;
    EventDispatcher.call(this);

    var html = (parameters.text === undefined ? '<em>New text</em>' : parameters.text);

    /**
     * Wipe container and add text html.
     *
     * @alias H5P.AdvancedText#attach
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      $container.addClass('h5p-advanced-text').html(html);
    };
  }

  AdvancedText.prototype = Object.create(EventDispatcher.prototype);
  AdvancedText.prototype.constructor = AdvancedText;

  return AdvancedText;

})(H5P.jQuery, H5P.EventDispatcher);
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
/*! For license information please see h5p-multi-media-choice.js.LICENSE.txt */
(()=>{var t={237:(t,e,i)=>{var n,o;!function(s,r){"use strict";void 0===(o="function"==typeof(n=r)?n.call(e,i,e,t):n)||(t.exports=o)}(window,(function(){"use strict";var t=function(){var t=window.Element.prototype;if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0;i<e.length;i++){var n=e[i]+"MatchesSelector";if(t[n])return n}}();return function(e,i){return e[t](i)}}))},439:function(t,e,i){var n,o;"undefined"!=typeof window&&window,void 0===(o="function"==typeof(n=function(){"use strict";function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return-1==n.indexOf(e)&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{};return(i[t]=i[t]||{})[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return-1!=n&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){i=i.slice(0),e=e||[];for(var n=this._onceEvents&&this._onceEvents[t],o=0;o<i.length;o++){var s=i[o];n&&n[s]&&(this.off(t,s),delete n[s]),s.apply(this,e)}return this}},e.allOff=function(){delete this._events,delete this._onceEvents},t})?n.call(e,i,e,t):n)||(t.exports=o)},285:(t,e,i)=>{var n,o;!function(s,r){n=[i(237)],o=function(t){return function(t,e){"use strict";var i={extend:function(t,e){for(var i in e)t[i]=e[i];return t},modulo:function(t,e){return(t%e+e)%e}},n=Array.prototype.slice;i.makeArray=function(t){return Array.isArray(t)?t:null==t?[]:"object"==typeof t&&"number"==typeof t.length?n.call(t):[t]},i.removeFrom=function(t,e){var i=t.indexOf(e);-1!=i&&t.splice(i,1)},i.getParent=function(t,i){for(;t.parentNode&&t!=document.body;)if(t=t.parentNode,e(t,i))return t},i.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},i.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},i.filterFindElements=function(t,n){t=i.makeArray(t);var o=[];return t.forEach((function(t){if(t instanceof HTMLElement)if(n){e(t,n)&&o.push(t);for(var i=t.querySelectorAll(n),s=0;s<i.length;s++)o.push(i[s])}else o.push(t)})),o},i.debounceMethod=function(t,e,i){i=i||100;var n=t.prototype[e],o=e+"Timeout";t.prototype[e]=function(){var t=this[o];clearTimeout(t);var e=arguments,s=this;this[o]=setTimeout((function(){n.apply(s,e),delete s[o]}),i)}},i.docReady=function(t){var e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},i.toDashed=function(t){return t.replace(/(.)([A-Z])/g,(function(t,e,i){return e+"-"+i})).toLowerCase()};var o=t.console;return i.htmlInit=function(e,n){i.docReady((function(){var s=i.toDashed(n),r="data-"+s,a=document.querySelectorAll("["+r+"]"),h=document.querySelectorAll(".js-"+s),c=i.makeArray(a).concat(i.makeArray(h)),l=r+"-options",u=t.jQuery;c.forEach((function(t){var i,s=t.getAttribute(r)||t.getAttribute(l);try{i=s&&JSON.parse(s)}catch(e){return void(o&&o.error("Error parsing "+r+" on "+t.className+": "+e))}var a=new e(t,i);u&&u.data(t,n,a)}))}))},i}(s,t)}.apply(e,n),void 0===o||(t.exports=o)}(window)},735:(t,e,i)=>{var n,o;window,void 0===(o="function"==typeof(n=function(){"use strict";function t(t){var e=parseFloat(t);return-1==t.indexOf("%")&&!isNaN(e)&&e}function e(){}var i="undefined"==typeof console?e:function(t){},n=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"],o=n.length;function s(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0;e<o;e++)t[n[e]]=0;return t}function r(t){var e=getComputedStyle(t);return e||i("Style returned "+e+". Are you running this code in a hidden iframe on Firefox? See https://bit.ly/getsizebug1"),e}var a,h=!1;function c(){if(!h){h=!0;var e=document.createElement("div");e.style.width="200px",e.style.padding="1px 2px 3px 4px",e.style.borderStyle="solid",e.style.borderWidth="1px 2px 3px 4px",e.style.boxSizing="border-box";var i=document.body||document.documentElement;i.appendChild(e);var n=r(e);a=200==Math.round(t(n.width)),l.isBoxSizeOuter=a,i.removeChild(e)}}function l(e){if(c(),"string"==typeof e&&(e=document.querySelector(e)),e&&"object"==typeof e&&e.nodeType){var i=r(e);if("none"==i.display)return s();var h={};h.width=e.offsetWidth,h.height=e.offsetHeight;for(var l=h.isBorderBox="border-box"==i.boxSizing,u=0;u<o;u++){var d=n[u],p=i[d],m=parseFloat(p);h[d]=isNaN(m)?0:m}var f=h.paddingLeft+h.paddingRight,g=h.paddingTop+h.paddingBottom,v=h.marginLeft+h.marginRight,y=h.marginTop+h.marginBottom,b=h.borderLeftWidth+h.borderRightWidth,w=h.borderTopWidth+h.borderBottomWidth,S=l&&a,x=t(i.width);!1!==x&&(h.width=x+(S?0:f+b));var T=t(i.height);return!1!==T&&(h.height=T+(S?0:g+w)),h.innerWidth=h.width-(f+b),h.innerHeight=h.height-(g+w),h.outerWidth=h.width+v,h.outerHeight=h.height+y,h}}return l})?n.call(e,i,e,t):n)||(t.exports=o)},904:(t,e,i)=>{var n,o,s;window,o=[i(397),i(735)],void 0===(s="function"==typeof(n=function(t,e){"use strict";var i=t.create("masonry");i.compatOptions.fitWidth="isFitWidth";var n=i.prototype;return n._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns(),this.colYs=[];for(var t=0;t<this.cols;t++)this.colYs.push(0);this.maxY=0,this.horizontalColIndex=0},n.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],i=t&&t.element;this.columnWidth=i&&e(i).outerWidth||this.containerWidth}var n=this.columnWidth+=this.gutter,o=this.containerWidth+this.gutter,s=o/n,r=n-o%n;s=Math[r&&r<1?"round":"floor"](s),this.cols=Math.max(s,1)},n.getContainerWidth=function(){var t=this._getOption("fitWidth")?this.element.parentNode:this.element,i=e(t);this.containerWidth=i&&i.innerWidth},n._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,i=Math[e&&e<1?"round":"ceil"](t.size.outerWidth/this.columnWidth);i=Math.min(i,this.cols);for(var n=this[this.options.horizontalOrder?"_getHorizontalColPosition":"_getTopColPosition"](i,t),o={x:this.columnWidth*n.col,y:n.y},s=n.y+t.size.outerHeight,r=i+n.col,a=n.col;a<r;a++)this.colYs[a]=s;return o},n._getTopColPosition=function(t){var e=this._getTopColGroup(t),i=Math.min.apply(Math,e);return{col:e.indexOf(i),y:i}},n._getTopColGroup=function(t){if(t<2)return this.colYs;for(var e=[],i=this.cols+1-t,n=0;n<i;n++)e[n]=this._getColGroupY(n,t);return e},n._getColGroupY=function(t,e){if(e<2)return this.colYs[t];var i=this.colYs.slice(t,t+e);return Math.max.apply(Math,i)},n._getHorizontalColPosition=function(t,e){var i=this.horizontalColIndex%this.cols;i=t>1&&i+t>this.cols?0:i;var n=e.size.outerWidth&&e.size.outerHeight;return this.horizontalColIndex=n?i+t:this.horizontalColIndex,{col:i,y:this._getColGroupY(i,t)}},n._manageStamp=function(t){var i=e(t),n=this._getElementOffset(t),o=this._getOption("originLeft")?n.left:n.right,s=o+i.outerWidth,r=Math.floor(o/this.columnWidth);r=Math.max(0,r);var a=Math.floor(s/this.columnWidth);a-=s%this.columnWidth?0:1,a=Math.min(this.cols-1,a);for(var h=(this._getOption("originTop")?n.top:n.bottom)+i.outerHeight,c=r;c<=a;c++)this.colYs[c]=Math.max(h,this.colYs[c])},n._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this._getOption("fitWidth")&&(t.width=this._getContainerFitWidth()),t},n._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},n.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!=this.containerWidth},i})?n.apply(e,o):n)||(t.exports=s)},787:(t,e,i)=>{var n,o,s;window,o=[i(439),i(735)],void 0===(s="function"==typeof(n=function(t,e){"use strict";function i(t){for(var e in t)return!1;return!0}var n=document.documentElement.style,o="string"==typeof n.transition?"transition":"WebkitTransition",s="string"==typeof n.transform?"transform":"WebkitTransform",r={WebkitTransition:"webkitTransitionEnd",transition:"transitionend"}[o],a={transform:s,transition:o,transitionDuration:o+"Duration",transitionProperty:o+"Property",transitionDelay:o+"Delay"};function h(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}var c=h.prototype=Object.create(t.prototype);function l(t){return t.replace(/([A-Z])/g,(function(t){return"-"+t.toLowerCase()}))}c.constructor=h,c._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},c.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},c.getSize=function(){this.size=e(this.element)},c.css=function(t){var e=this.element.style;for(var i in t)e[a[i]||i]=t[i]},c.getPosition=function(){var t=getComputedStyle(this.element),e=this.layout._getOption("originLeft"),i=this.layout._getOption("originTop"),n=t[e?"left":"right"],o=t[i?"top":"bottom"],s=parseFloat(n),r=parseFloat(o),a=this.layout.size;-1!=n.indexOf("%")&&(s=s/100*a.width),-1!=o.indexOf("%")&&(r=r/100*a.height),s=isNaN(s)?0:s,r=isNaN(r)?0:r,s-=e?a.paddingLeft:a.paddingRight,r-=i?a.paddingTop:a.paddingBottom,this.position.x=s,this.position.y=r},c.layoutPosition=function(){var t=this.layout.size,e={},i=this.layout._getOption("originLeft"),n=this.layout._getOption("originTop"),o=i?"paddingLeft":"paddingRight",s=i?"left":"right",r=i?"right":"left",a=this.position.x+t[o];e[s]=this.getXValue(a),e[r]="";var h=n?"paddingTop":"paddingBottom",c=n?"top":"bottom",l=n?"bottom":"top",u=this.position.y+t[h];e[c]=this.getYValue(u),e[l]="",this.css(e),this.emitEvent("layout",[this])},c.getXValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&!e?t/this.layout.size.width*100+"%":t+"px"},c.getYValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&e?t/this.layout.size.height*100+"%":t+"px"},c._transitionTo=function(t,e){this.getPosition();var i=this.position.x,n=this.position.y,o=t==this.position.x&&e==this.position.y;if(this.setPosition(t,e),!o||this.isTransitioning){var s=t-i,r=e-n,a={};a.transform=this.getTranslate(s,r),this.transition({to:a,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})}else this.layoutPosition()},c.getTranslate=function(t,e){return"translate3d("+(t=this.layout._getOption("originLeft")?t:-t)+"px, "+(e=this.layout._getOption("originTop")?e:-e)+"px, 0)"},c.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},c.moveTo=c._transitionTo,c.setPosition=function(t,e){this.position.x=parseFloat(t),this.position.y=parseFloat(e)},c._nonTransition=function(t){for(var e in this.css(t.to),t.isCleaning&&this._removeStyles(t.to),t.onTransitionEnd)t.onTransitionEnd[e].call(this)},c.transition=function(t){if(parseFloat(this.layout.options.transitionDuration)){var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);t.from&&(this.css(t.from),this.element.offsetHeight),this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0}else this._nonTransition(t)};var u="opacity,"+l(s);c.enableTransition=function(){if(!this.isTransitioning){var t=this.layout.options.transitionDuration;t="number"==typeof t?t+"ms":t,this.css({transitionProperty:u,transitionDuration:t,transitionDelay:this.staggerDelay||0}),this.element.addEventListener(r,this,!1)}},c.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},c.onotransitionend=function(t){this.ontransitionend(t)};var d={"-webkit-transform":"transform"};c.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,n=d[t.propertyName]||t.propertyName;delete e.ingProperties[n],i(e.ingProperties)&&this.disableTransition(),n in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[n]),n in e.onEnd&&(e.onEnd[n].call(this),delete e.onEnd[n]),this.emitEvent("transitionEnd",[this])}},c.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(r,this,!1),this.isTransitioning=!1},c._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var p={transitionProperty:"",transitionDuration:"",transitionDelay:""};return c.removeTransitionStyles=function(){this.css(p)},c.stagger=function(t){t=isNaN(t)?0:t,this.staggerDelay=t+"ms"},c.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},c.remove=function(){o&&parseFloat(this.layout.options.transitionDuration)?(this.once("transitionEnd",(function(){this.removeElem()})),this.hide()):this.removeElem()},c.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options,e={};e[this.getHideRevealTransitionEndProperty("visibleStyle")]=this.onRevealTransitionEnd,this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0,onTransitionEnd:e})},c.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},c.getHideRevealTransitionEndProperty=function(t){var e=this.layout.options[t];if(e.opacity)return"opacity";for(var i in e)return i},c.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options,e={};e[this.getHideRevealTransitionEndProperty("hiddenStyle")]=this.onHideTransitionEnd,this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:e})},c.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},c.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},h})?n.apply(e,o):n)||(t.exports=s)},397:(t,e,i)=>{var n,o;!function(s,r){"use strict";n=[i(439),i(735),i(285),i(787)],o=function(t,e,i,n){return function(t,e,i,n,o){var s=t.console,r=t.jQuery,a=function(){},h=0,c={};function l(t,e){var i=n.getQueryElement(t);if(i){this.element=i,r&&(this.$element=r(this.element)),this.options=n.extend({},this.constructor.defaults),this.option(e);var o=++h;this.element.outlayerGUID=o,c[o]=this,this._create(),this._getOption("initLayout")&&this.layout()}else s&&s.error("Bad element for "+this.constructor.namespace+": "+(i||t))}l.namespace="outlayer",l.Item=o,l.defaults={containerStyle:{position:"relative"},initLayout:!0,originLeft:!0,originTop:!0,resize:!0,resizeContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}};var u=l.prototype;function d(t){function e(){t.apply(this,arguments)}return e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e}n.extend(u,e.prototype),u.option=function(t){n.extend(this.options,t)},u._getOption=function(t){var e=this.constructor.compatOptions[t];return e&&void 0!==this.options[e]?this.options[e]:this.options[t]},l.compatOptions={initLayout:"isInitLayout",horizontal:"isHorizontal",layoutInstant:"isLayoutInstant",originLeft:"isOriginLeft",originTop:"isOriginTop",resize:"isResizeBound",resizeContainer:"isResizingContainer"},u._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),n.extend(this.element.style,this.options.containerStyle),this._getOption("resize")&&this.bindResize()},u.reloadItems=function(){this.items=this._itemize(this.element.children)},u._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,n=[],o=0;o<e.length;o++){var s=new i(e[o],this);n.push(s)}return n},u._filterFindItemElements=function(t){return n.filterFindElements(t,this.options.itemSelector)},u.getItemElements=function(){return this.items.map((function(t){return t.element}))},u.layout=function(){this._resetLayout(),this._manageStamps();var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;this.layoutItems(this.items,e),this._isLayoutInited=!0},u._init=u.layout,u._resetLayout=function(){this.getSize()},u.getSize=function(){this.size=i(this.element)},u._getMeasurement=function(t,e){var n,o=this.options[t];o?("string"==typeof o?n=this.element.querySelector(o):o instanceof HTMLElement&&(n=o),this[t]=n?i(n)[e]:o):this[t]=0},u.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},u._getItemsForLayout=function(t){return t.filter((function(t){return!t.isIgnored}))},u._layoutItems=function(t,e){if(this._emitCompleteOnItems("layout",t),t&&t.length){var i=[];t.forEach((function(t){var n=this._getItemLayoutPosition(t);n.item=t,n.isInstant=e||t.isLayoutInstant,i.push(n)}),this),this._processLayoutQueue(i)}},u._getItemLayoutPosition=function(){return{x:0,y:0}},u._processLayoutQueue=function(t){this.updateStagger(),t.forEach((function(t,e){this._positionItem(t.item,t.x,t.y,t.isInstant,e)}),this)},u.updateStagger=function(){var t=this.options.stagger;if(null!=t)return this.stagger=m(t),this.stagger;this.stagger=0},u._positionItem=function(t,e,i,n,o){n?t.goTo(e,i):(t.stagger(o*this.stagger),t.moveTo(e,i))},u._postLayout=function(){this.resizeContainer()},u.resizeContainer=function(){if(this._getOption("resizeContainer")){var t=this._getContainerSize();t&&(this._setContainerMeasure(t.width,!0),this._setContainerMeasure(t.height,!1))}},u._getContainerSize=a,u._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},u._emitCompleteOnItems=function(t,e){var i=this;function n(){i.dispatchEvent(t+"Complete",null,[e])}var o=e.length;if(e&&o){var s=0;e.forEach((function(e){e.once(t,r)}))}else n();function r(){++s==o&&n()}},u.dispatchEvent=function(t,e,i){var n=e?[e].concat(i):i;if(this.emitEvent(t,n),r)if(this.$element=this.$element||r(this.element),e){var o=r.Event(e);o.type=t,this.$element.trigger(o,i)}else this.$element.trigger(t,i)},u.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},u.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},u.stamp=function(t){(t=this._find(t))&&(this.stamps=this.stamps.concat(t),t.forEach(this.ignore,this))},u.unstamp=function(t){(t=this._find(t))&&t.forEach((function(t){n.removeFrom(this.stamps,t),this.unignore(t)}),this)},u._find=function(t){if(t)return"string"==typeof t&&(t=this.element.querySelectorAll(t)),t=n.makeArray(t)},u._manageStamps=function(){this.stamps&&this.stamps.length&&(this._getBoundingRect(),this.stamps.forEach(this._manageStamp,this))},u._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},u._manageStamp=a,u._getElementOffset=function(t){var e=t.getBoundingClientRect(),n=this._boundingRect,o=i(t);return{left:e.left-n.left-o.marginLeft,top:e.top-n.top-o.marginTop,right:n.right-e.right-o.marginRight,bottom:n.bottom-e.bottom-o.marginBottom}},u.handleEvent=n.handleEvent,u.bindResize=function(){t.addEventListener("resize",this),this.isResizeBound=!0},u.unbindResize=function(){t.removeEventListener("resize",this),this.isResizeBound=!1},u.onresize=function(){this.resize()},n.debounceMethod(l,"onresize",100),u.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},u.needsResizeLayout=function(){var t=i(this.element);return this.size&&t&&t.innerWidth!==this.size.innerWidth},u.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},u.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},u.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},u.reveal=function(t){if(this._emitCompleteOnItems("reveal",t),t&&t.length){var e=this.updateStagger();t.forEach((function(t,i){t.stagger(i*e),t.reveal()}))}},u.hide=function(t){if(this._emitCompleteOnItems("hide",t),t&&t.length){var e=this.updateStagger();t.forEach((function(t,i){t.stagger(i*e),t.hide()}))}},u.revealItemElements=function(t){var e=this.getItems(t);this.reveal(e)},u.hideItemElements=function(t){var e=this.getItems(t);this.hide(e)},u.getItem=function(t){for(var e=0;e<this.items.length;e++){var i=this.items[e];if(i.element==t)return i}},u.getItems=function(t){t=n.makeArray(t);var e=[];return t.forEach((function(t){var i=this.getItem(t);i&&e.push(i)}),this),e},u.remove=function(t){var e=this.getItems(t);this._emitCompleteOnItems("remove",e),e&&e.length&&e.forEach((function(t){t.remove(),n.removeFrom(this.items,t)}),this)},u.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="",this.items.forEach((function(t){t.destroy()})),this.unbindResize();var e=this.element.outlayerGUID;delete c[e],delete this.element.outlayerGUID,r&&r.removeData(this.element,this.constructor.namespace)},l.data=function(t){var e=(t=n.getQueryElement(t))&&t.outlayerGUID;return e&&c[e]},l.create=function(t,e){var i=d(l);return i.defaults=n.extend({},l.defaults),n.extend(i.defaults,e),i.compatOptions=n.extend({},l.compatOptions),i.namespace=t,i.data=l.data,i.Item=d(o),n.htmlInit(i,t),r&&r.bridget&&r.bridget(t,i),i};var p={ms:1,s:1e3};function m(t){if("number"==typeof t)return t;var e=t.match(/(^\d*\.?\d*)(\w*)/),i=e&&e[1],n=e&&e[2];return i.length?(i=parseFloat(i))*(p[n]||1):0}return l.Item=o,l}(s,t,e,i,n)}.apply(e,n),void 0===o||(t.exports=o)}(window)}},e={};function i(n){var o=e[n];if(void 0!==o)return o.exports;var s=e[n]={exports:{}};return t[n].call(s.exports,s,s.exports,i),s.exports}(()=>{"use strict";function t(e){return t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},t(e)}var e=function(){function e(){}return e.extendParams=function(t){return e.deepExtend({question:"No question text provided",behaviour:{enableSolutionsButton:!0,enableRetry:!0,questionType:"auto",confirmCheckDialog:!1,confirmRetryDialog:!1,aspectRatio:"auto",maxAlternativesPerRow:4},l10n:{checkAnswerButtonText:"Check",submitAnswerButtonText:"Submit",checkAnswer:"Check the answers. The responses will be marked as correct, incorrect, or unanswered.",showSolutionButtonText:"Show solution",showSolution:"Show the solution. The task will be marked with its correct solution.",correctAnswer:"Correct answer",wrongAnswer:"Wrong answer",shouldCheck:"Should have been checked",shouldNotCheck:"Should not have been checked",noAnswer:"Please answer before viewing the solution",retryText:"Retry",retry:"Retry the task. Reset all responses and start the task over again.",result:"You got :num out of :total points",confirmCheck:{header:"Finish?",body:"Are you sure you want to finish?",cancelLabel:"Cancel",confirmLabel:"Finish"},confirmRetry:{header:"Retry?",body:"Are you sure you wish to retry?",cancelLabel:"Cancel",confirmLabel:"Retry"},missingAltText:"Alt text missing"}},t)},e.deepExtend=function(i){i=i||{};for(var n=1;n<arguments.length;n++){var o=arguments[n];if(o)for(var s in Array.isArray(o)&&(i=o),o)Object.prototype.hasOwnProperty.call(o,s)&&("object"===t(o[s])?i[s]=e.deepExtend(i[s],o[s]):i[s]=o[s])}return i},e}(),n=function(t){var e=document.createElement("div");return e.innerHTML=t,e.textContent},o=function(){function t(t,e,i,n,o,s){this.contentId=e,this.aspectRatio=i,this.singleAnswer=n,this.missingAltText=o,this.media=t.media,this.correct=t.correct,this.callbacks=s||{},this.callbacks.onClick=this.callbacks.onClick||function(){},this.callbacks.onKeyboardSelect=this.callbacks.onKeyboardSelect||function(){},this.callbacks.onKeyboardArrowKey=this.callbacks.onKeyboardArrowKey||function(){},this.callbacks.triggerResize=this.callbacks.triggerResize||function(){},this.content=document.createElement("li"),this.content.classList.add("h5p-multi-media-choice-list-item"),this.wrapper=document.createElement("div"),this.wrapper.classList.add("h5p-multi-media-choice-option"),this.content.appendChild(this.wrapper),n?this.content.setAttribute("role","radio"):this.content.setAttribute("role","checkbox"),this.content.setAttribute("aria-checked","false"),this.enable(),this.content.addEventListener("click",this.callbacks.onClick);var r=this.createMediaContent();this.wrapper.appendChild(r),this.addKeyboardHandlers()}var e=t.prototype;return e.createMediaContent=function(){var t=document.createElement("div");if(t.classList.add("h5p-multi-media-choice-media-wrapper"),"auto"!==this.aspectRatio&&(t.classList.add("h5p-multi-media-choice-media-wrapper-specific-ratio"),t.classList.add("h5p-multi-media-choice-media-wrapper-".concat(this.aspectRatio))),"H5P.Image"===this.media.library.split(" ")[0])return t.appendChild(this.buildImage(this.option)),t},e.getDescription=function(){return"H5P.Image"===this.media.library.split(" ")[0]?this.media.params.alt||this.missingAltText:""},e.buildImage=function(){var t=this.media.params.alt?this.media.params.alt:"",e=this.media.params.title?this.media.params.title:"",i="";this.media.params.file&&(i=H5P.getPath(this.media.params.file.path,this.contentId));var o=document.createElement("img");return o.setAttribute("src",i),this.content.setAttribute("aria-label",n(t)),o.addEventListener("load",this.callbacks.triggerResize),this.content.setAttribute("title",n(e)),o.classList.add("h5p-multi-media-choice-media"),o.setAttribute("alt",n(t)),"auto"!==this.aspectRatio&&o.classList.add("h5p-multi-media-choice-media-specific-ratio"),o},e.isSelected=function(){return"true"===this.content.getAttribute("aria-checked")},e.isCorrect=function(){return this.correct},e.isDisabled=function(){return"true"===this.content.getAttribute("aria-disabled")},e.getDOM=function(){return this.content},e.setTabIndex=function(t){if(-1===t)this.content.setAttribute("tabindex","-1");else this.content.setAttribute("tabindex","0")},e.toggle=function(){this.isSelected()?(this.content.setAttribute("aria-checked","false"),this.wrapper.classList.remove("h5p-multi-media-choice-selected")):(this.content.setAttribute("aria-checked","true"),this.wrapper.classList.add("h5p-multi-media-choice-selected"))},e.uncheck=function(){this.content.setAttribute("aria-checked","false"),this.wrapper.classList.remove("h5p-multi-media-choice-selected")},e.focus=function(){this.content.focus()},e.enable=function(){this.content.setAttribute("aria-disabled","false"),this.wrapper.classList.add("h5p-multi-media-choice-enabled")},e.disable=function(){this.content.setAttribute("aria-disabled","true"),this.content.setAttribute("tabindex","-1"),this.wrapper.classList.remove("h5p-multi-media-choice-enabled")},e.showSelectedSolution=function(t){var e=t.correctAnswer,i=t.wrongAnswer;this.wrapper.classList.remove("h5p-multi-media-choice-selected"),this.isSelected()&&(this.correct?(this.wrapper.classList.add("h5p-multi-media-choice-correct"),this.addAccessibilitySolutionText(e)):(this.wrapper.classList.add("h5p-multi-media-choice-wrong"),this.addAccessibilitySolutionText(i)))},e.showUnselectedSolution=function(t){var e=t.shouldCheck,i=t.shouldNotCheck;this.isSelected()||(this.correct?(this.wrapper.classList.add("h5p-multi-media-choice-show-correct"),this.addAccessibilitySolutionText(e)):this.addAccessibilitySolutionText(i))},e.addAccessibilitySolutionText=function(t){this.accessibilitySolutionText=document.createElement("span"),this.accessibilitySolutionText.classList.add("hidden-accessibility-solution-text"),this.accessibilitySolutionText.innerText="".concat(t,"."),this.wrapper.appendChild(this.accessibilitySolutionText)},e.hideSolution=function(){this.wrapper.classList.remove("h5p-multi-media-choice-correct"),this.wrapper.classList.remove("h5p-multi-media-choice-show-correct"),this.wrapper.classList.remove("h5p-multi-media-choice-wrong"),this.accessibilitySolutionText&&this.accessibilitySolutionText.parentNode&&this.accessibilitySolutionText.parentNode.removeChild(this.accessibilitySolutionText)},e.addKeyboardHandlers=function(){var t=this;this.content.addEventListener("keydown",(function(e){switch(e.key){case"Enter":case" ":if(t.isDisabled())return;e.preventDefault(),t.callbacks.onKeyboardSelect(t);break;case"ArrowLeft":case"ArrowUp":if(!t.singleAnswer)return;if(e.preventDefault(),t.getDOM()===t.getDOM().parentNode.firstChild)return;t.callbacks.onKeyboardArrowKey(e.code.replace("Arrow",""));break;case"ArrowRight":case"ArrowDown":if(!t.singleAnswer)return;if(e.preventDefault(),t.getDOM()===t.getDOM().parentNode.lastChild)return;t.callbacks.onKeyboardArrowKey(e.code.replace("Arrow",""))}}))},t}(),s=i(904),r=function(){function t(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1?arguments[1]:void 0,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=arguments.length>3?arguments[3]:void 0;if(this.params=e,this.contentId=i,this.callbacks=n,this.callbacks.triggerResize=this.callbacks.triggerResize||function(){},this.callbacks.triggerInteracted=this.callbacks.triggerInteracted||function(){},this.maxAlternativesPerRow=this.params.behaviour.maxAlternativesPerRow,this.numberOfCorrectOptions=e.options?e.options.filter((function(t){return t.correct})).length:0,this.isSingleAnswer="auto"===this.params.behaviour.questionType?1===this.numberOfCorrectOptions:"single"===this.params.behaviour.questionType,this.aspectRatio=this.params.behaviour.aspectRatio,this.lastSelectedRadioButtonOption=null,this.content=document.createElement("div"),this.content.classList.add("h5p-multi-media-choice-content"),!this.params.options||this.params.options.length<2){var a={media:{params:{contentName:"Image"},library:"H5P.Image",subContentId:e.contentId,metadata:{contentType:"Image",license:"U",title:"Untitled Image"}},correct:!1};this.params.options&&1===this.params.options.length?this.params.options.push(a):this.params.options=[{},{}].fill(a)}this.options=this.params.options?this.params.options.map((function(e,n){return new o(e,i,t.aspectRatio,t.isSingleAnswer,t.params.l10n.missingAltText,{onClick:function(){return t.toggleSelected(n)},onKeyboardSelect:function(){return t.toggleSelected(n)},onKeyboardArrowKey:function(e){return t.handleOptionArrowKey(n,e)},triggerResize:t.callbacks.triggerResize})})):[],this.optionList=this.buildOptionList(this.options),this.content.appendChild(this.optionList),this.setTabIndexes(),this.masonry=new s(this.optionList,{gutter:20,itemSelector:".h5p-multi-media-choice-list-item"}),r.forEach((function(e){return t.toggleSelected(e,!1)}))}var e=t.prototype;return e.buildOptionList=function(){var t=document.createElement("ul");return t.setAttribute("role",this.isSingleAnswer?"radiogroup":"group"),t.setAttribute("aria-labelledby","h5p-media-choice".concat(this.contentId)),t.classList.add("h5p-multi-media-choice-option-list"),this.options.forEach((function(e){t.appendChild(e.getDOM())})),t},e.getDOM=function(){return this.content},e.singleAnswer=function(){return this.isSingleAnswer},e.getOptions=function(){return this.options},e.getMaxScore=function(){return this.params.behaviour.singlePoint||this.isSingleAnswer||this.isBlankCorrect()?1:this.numberOfCorrectOptions},e.getScore=function(){if(this.params.behaviour.singlePoint&&0===this.params.behaviour.passPercentage)return 1;if(!this.isAnyAnswerSelected())return this.isBlankCorrect()?1:0;if(this.isSingleAnswer)return this.lastSelectedRadioButtonOption.isCorrect()?1:0;var t=0;return this.options.forEach((function(e){e.isSelected()&&(e.isCorrect()?t++:t--)})),t=Math.max(0,t),this.params.behaviour.singlePoint?100*t/this.numberOfCorrectOptions>=this.params.behaviour.passPercentage?1:0:t},e.getSelectedOptions=function(){return this.options.filter((function(t){return t.isSelected()}))},e.isAnyAnswerSelected=function(){return this.getSelectedOptions().length>0},e.isBlankCorrect=function(){return 0===this.numberOfCorrectOptions},e.isPassed=function(){return 100*this.getScore()/this.getMaxScore()>=this.params.behaviour.passPercentage},e.showSelectedSolutions=function(){var t=this;this.options.forEach((function(e){return e.showSelectedSolution({correctAnswer:t.params.l10n.correctAnswer,wrongAnswer:t.params.l10n.wrongAnswer})}))},e.showUnselectedSolutions=function(){var t=this;this.options.forEach((function(e){return e.showUnselectedSolution({shouldCheck:t.params.l10n.shouldCheck,shouldNotCheck:t.params.l10n.shouldNotCheck})}))},e.focusUnselectedSolution=function(){var t=document.getElementsByClassName("h5p-multi-media-choice-show-correct")[0];t&&t.parentNode&&t.parentNode.focus()},e.hideSolutions=function(){this.options.forEach((function(t){return t.hideSolution()}))},e.toggleSelected=function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this.options[t];if(!i.isDisabled()){if(this.isSingleAnswer){if(i.isSelected())return;this.lastSelectedRadioButtonOption&&(this.lastSelectedRadioButtonOption.uncheck(),this.lastSelectedRadioButtonOption.setTabIndex(-1)),this.lastSelectedRadioButtonOption=i,this.lastSelectedRadioButtonOption.setTabIndex(0)}i.toggle(),e&&this.callbacks.triggerInteracted()}},e.resetSelections=function(){this.lastSelectedRadioButtonOption=null,this.setTabIndexes(),this.options.forEach((function(t){t.uncheck(),t.enable()}))},e.disableSelectables=function(){this.options.forEach((function(t){return t.disable()})),this.setTabIndexes(-1)},e.setTabIndexes=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;this.isSingleAnswer?(this.options.forEach((function(e){return e.setTabIndex(null!==t?t:-1)})),this.options[0].setTabIndex(null!==t?t:0)):this.options.forEach((function(e){return e.setTabIndex(null!==t?t:0)}))},e.handleOptionArrowKey=function(t,e){if(["Left","Right","Up","Down"].includes(e)){var i=t+{Right:1,Down:1,Left:-1,Up:-1}[e];this.toggleSelected(i),this.options[i].focus(),this.options[i].setTabIndex(0),this.options[t].setTabIndex(-1)}},e.resizeGridItem=function(t,e){t.style.width=e+"px"},e.setColumnProperties=function(){for(var t=this.optionList.getBoundingClientRect().width/230,e=Math.floor(Math.min(t,this.maxAlternativesPerRow,this.options.length)),i=this.optionList.getBoundingClientRect().width/e-20,n=0;n<this.options.length;n++)this.resizeGridItem(this.options[n].getDOM(),i);this.masonry.layout()},e.getSelectedIndexes=function(){for(var t=[],e=0;e<this.options.length;e++){this.options[e].isSelected()&&t.push(e)}return t},e.setMultiMediaOptionsPlaceholder=function(t){var e=this,i="";this.options.forEach((function(n){if(!n.media.params.file){var o="auto"===e.aspectRatio?"1to1":e.aspectRatio;i="".concat(t,"/placeholder").concat(o,".svg"),n.wrapper.querySelector("img").src=i}}))},e.getAnswerGiven=function(){return this.isAnyAnswerSelected()||this.isBlankCorrect()},t}();function a(t,e,i,o,s,r){var a=t.createXAPIEventTemplate("answered");return function(t,e,i){var o=t.getVerifiedStatementValue(["object","definition"]);o.description={"en-US":n(i)},o.type="http://adlnet.gov/expapi/activities/cmi.interaction",o.interactionType="choice",o.choices=function(t){return t.map((function(t,e){return{id:e.toString(),description:{"en-US":n(t.getDescription())}}}))}(e),o.correctResponsesPattern=[h(e)]}(a,i,e),a.setScoredResult(o,s,t,!0,r),function(t,e){t.data.statement.result.response=e.flatMap((function(t,e){return t.isSelected()?e:[]})).toString().replaceAll(",","[,]")}(a,i),a}function h(t){return t.flatMap((function(t,e){return t.isCorrect()?e:[]})).toString().replaceAll(",","[,]")}function c(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function l(t,e){return l=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},l(t,e)}var u=function(t){var i,n;function o(i,n){var o,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return o=t.call(this,"multi-media-choice")||this,H5P.EventDispatcher.call(c(o)),o.contentId=n,o.extras=s,o.answerState=s.previousState&&s.previousState.answers?s.previousState.answers:[],o.params=e.extendParams(i),o.content=new r(o.params,n,{triggerResize:function(){o.trigger("resize")},triggerInteracted:function(){o.triggerXAPI("interacted")}},o.answerState),o.registerDomElements=function(){if(o.params.media&&o.params.media.type&&o.params.media.type.library){var t=o.params.media.type;t.library.includes("H5P.Image")?t.params.file&&o.setImage(t.params.file.path,{disableImageZooming:i.media.disableImageZooming||!1,alt:t.params.alt,title:t.params.title,expandImage:t.params.expandImage,minimizeImage:t.params.minimizeImage}):t.library.includes("H5P.Video")?t.params.sources&&o.setVideo(t):t.library.includes("H5P.Audio")&&t.params.files&&o.setAudio(t)}o.params.question&&(o.introduction=document.createElement("div"),o.introduction.innerHTML=o.params.question,o.introduction.setAttribute("id","h5p-media-choice".concat(n)),document.createElement("img").src=o.getLibraryFilePath("assets/placeholder1to1.svg"),o.setIntroduction(o.introduction));o.content.setMultiMediaOptionsPlaceholder(o.getLibraryFilePath("assets")),o.setContent(o.content.getDOM()),o.addButtons(),o.on("resize",(function(){return o.content.setColumnProperties()}))},o.getScore=function(){return o.content.getScore()},o.getMaxScore=function(){return o.content.getMaxScore()},o.handleRead=function(t){o.read(t)},o.checkAnswer=function(){o.content.disableSelectables();var t=o.getScore(),e=o.getMaxScore(),i=H5P.Question.determineOverallFeedback(o.params.overallFeedback,t/e);o.setFeedback(i,t,e,o.params.l10n.result),o.params.behaviour.enableSolutionsButton&&t!==e&&o.showButton("show-solution"),o.params.behaviour.enableRetry&&t!==e&&o.showButton("try-again"),o.hideButton("check-answer"),o.content.showSelectedSolutions(),o.trigger(a(c(o),o.params.question,o.content.getOptions(),o.getScore(),o.getMaxScore(),o.content.isPassed()))},o.showSolutions=function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];o.hideButton("check-answer"),o.hideButton("show-solution"),o.params.behaviour.showSolutionsRequiresInput&&!o.content.isAnyAnswerSelected()&&t?(o.updateFeedbackContent(o.params.l10n.noAnswer),o.handleRead(o.params.l10n.noAnswer)):(o.content.showSelectedSolutions(),o.content.showUnselectedSolutions(),o.content.focusUnselectedSolution()),o.trigger("resize")},o.resetTask=function(){o.content.resetSelections(),o.showButton("check-answer"),o.hideButton("try-again"),o.hideButton("show-solution"),o.content.hideSolutions(),o.removeFeedback()},o.getAnswerGiven=function(){return o.content.getAnswerGiven()},o}n=t,(i=o).prototype=Object.create(n.prototype),i.prototype.constructor=i,l(i,n);var s=o.prototype;return s.addButtons=function(){var t=this;(null==this.params.behaviour.enableCheckButton||this.params.behaviour.enableCheckButton)&&this.addButton("check-answer",this.params.l10n.checkAnswerButtonText,(function(){t.checkAnswer()}),!0,{"aria-label":this.params.l10n.checkAnswer},{confirmationDialog:{enable:this.params.behaviour.confirmCheckDialog,l10n:this.params.l10n.confirmCheck,instance:this},contentData:this.extras,textIfSubmitting:this.params.l10n.submitAnswerButtonText}),this.addButton("show-solution",this.params.l10n.showSolutionButtonText,(function(){t.showSolutions(!0)}),!1,{"aria-label":this.params.l10n.showSolution},{}),this.addButton("try-again",this.params.l10n.retryText,(function(){t.resetTask()}),!1,{"aria-label":this.params.l10n.retry},{confirmationDialog:{enable:this.params.behaviour.confirmRetryDialog,l10n:this.params.l10n.confirmRetry,instance:this}})},s.getCurrentState=function(){return{answers:this.content.getSelectedIndexes()}},s.getXAPIData=function(){return t=this,e=this.params.question,i=this.content.getOptions(),n=this.getScore(),o=this.getMaxScore(),s=this.content.isPassed(),{statement:a(t,e,i,n,o,s).data.statement};var t,e,i,n,o,s},s.getTitle=function(){return H5P.createTitle(this.extras&&this.extras.metadata&&this.extras.metadata.title?this.extras.metadata.title:"Image Choice")},o}(H5P.Question);H5P=H5P||{},H5P.MultiMediaChoice=u})()})();;
var H5P = H5P || {};

/**
 * Constructor.
 *
 * @param {object} params Options for this library.
 */
H5P.Text = function (params) {
  this.text = params.text === undefined ? '<em>New text</em>' : params.text;
};

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 *
 * @param {jQuery} $wrapper
 */
H5P.Text.prototype.attach = function ($wrapper) {
  $wrapper.addClass('h5p-text').html(this.text);
};
;
/** @namespace H5P */
H5P.VideoVimeo = (function ($) {

  let numInstances = 0;

  /**
   * Vimeo video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function VimeoPlayer(sources, options, l10n) {
    const self = this;

    let player;

    // Since all the methods of the Vimeo Player SDK are promise-based, we keep
    // track of all relevant state variables so that we can implement the
    // H5P.Video API where all methods return synchronously.
    let buffered = 0;
    let currentQuality;
    let currentTextTrack;
    let currentTime = 0;
    let duration = 0;
    let isMuted = 0;
    let volume = 0;
    let playbackRate = 1;
    let qualities = [];
    let loadingFailedTimeout;
    let failedLoading = false;
    let ratio = 9/16;
    let isLoaded = false;

    const LOADING_TIMEOUT_IN_SECONDS = 8;

    const id = `h5p-vimeo-${++numInstances}`;
    const $wrapper = $('<div/>');
    const $placeholder = $('<div/>', {
      id: id,
      html: `<div class="h5p-video-loading" style="height: 100%; min-height: 200px; display: block; z-index: 100;" aria-label="${l10n.loading}"></div>`
    }).appendTo($wrapper);

    /**
     * Create a new player with the Vimeo Player SDK.
     *
     * @private
     */
    const createVimeoPlayer = async () => {
      if (!$placeholder.is(':visible') || player !== undefined) {
        return;
      }

      // Since the SDK is loaded asynchronously below, explicitly set player to
      // null (unlike undefined) which indicates that creation has begun. This
      // allows the guard statement above to be hit if this function is called
      // more than once.
      player = null;

      const Vimeo = await loadVimeoPlayerSDK();

      const MIN_WIDTH = 200;
      const width = Math.max($wrapper.width(), MIN_WIDTH);

      const canHasControls = options.controls || self.pressToPlay;
      const embedOptions = {
        url: sources[0].path,
        controls: canHasControls,
        responsive: true,
        dnt: true,
        // Hardcoded autoplay to false to avoid playing videos on init
        autoplay: false,
        loop: options.loop ? true : false,
        playsinline: true,
        quality: 'auto',
        width: width,
        muted: false,
        keyboard: canHasControls,
      };

      // Create a new player
      player = new Vimeo.Player(id, embedOptions);

      registerVimeoPlayerEventListeneners(player);

      // Failsafe timeout to handle failed loading of videos.
      // This seems to happen for private videos even though the SDK docs
      // suggests to catch PrivacyError when attempting play()
      loadingFailedTimeout = setTimeout(() => {
        failedLoading = true;
        removeLoadingIndicator();
        $wrapper.html(`<p class="vimeo-failed-loading">${l10n.vimeoLoadingError}</p>`);
        $wrapper.css({
          width: null,
          height: null
        });
        self.trigger('resize');
        self.trigger('error', l10n.vimeoLoadingError);
      }, LOADING_TIMEOUT_IN_SECONDS * 1000);
    }

    const removeLoadingIndicator = () => {
      $placeholder.find('div.h5p-video-loading').remove();
    };

    /**
     * Register event listeners on the given Vimeo player.
     *
     * @private
     * @param {Vimeo.Player} player
     */
    const registerVimeoPlayerEventListeneners = (player) => {
      let isFirstPlay, tracks;
      player.on('loaded', async () => {
        isFirstPlay = true;
        isLoaded = true;
        clearTimeout(loadingFailedTimeout);

        const videoDetails = await getVimeoVideoMetadata(player);
        tracks = videoDetails.tracks.options;
        currentTextTrack = tracks.current;
        duration = videoDetails.duration;
        qualities = videoDetails.qualities;
        currentQuality = 'auto';
        try {
          ratio = videoDetails.dimensions.height / videoDetails.dimensions.width;
        }
        catch (e) { /* Intentionally ignore this, and fallback on the default ratio */ }

        removeLoadingIndicator();

        if (options.startAt) {
          // Vimeo.Player doesn't have an option for setting start time upon
          // instantiation, so we instead perform an initial seek here.
          currentTime = await self.seek(options.startAt);
        }

        self.trigger('ready');
        self.trigger('loaded');
        self.trigger('qualityChange', currentQuality);
        self.trigger('resize');
      });

      player.on('play', () => {
        if (isFirstPlay) {
          isFirstPlay = false;
          if (tracks.length) {
            self.trigger('captions', tracks);
          }
        }
      });

      // Handle playback state changes.
      player.on('playing', () => self.trigger('stateChange', H5P.Video.PLAYING));
      player.on('pause', () => self.trigger('stateChange', H5P.Video.PAUSED));
      player.on('ended', () => self.trigger('stateChange', H5P.Video.ENDED));

      // Track the percentage of video that has finished loading (buffered).
      player.on('progress', (data) => {
        buffered = data.percent * 100;
      });

      // Track the current time. The update frequency may be browser-dependent,
      // according to the official docs:
      // https://developer.vimeo.com/player/sdk/reference#timeupdate
      player.on('timeupdate', (time) => {
        currentTime = time.seconds;
      });
    };

    /**
     * Get metadata about the video loaded in the given Vimeo player.
     *
     * Example resolved value:
     *
     * ```
     * {
     *   "duration": 39,
     *   "qualities": [
     *     {
     *       "name": "auto",
     *       "label": "Auto"
     *     },
     *     {
     *       "name": "1080p",
     *       "label": "1080p"
     *     },
     *     {
     *       "name": "720p",
     *       "label": "720p"
     *     }
     *   ],
     *   "dimensions": {
     *     "width": 1920,
     *     "height": 1080
     *   },
     *   "tracks": {
     *     "current": {
     *       "label": "English",
     *       "value": "en"
     *     },
     *     "options": [
     *       {
     *         "label": "English",
     *         "value": "en"
     *       },
     *       {
     *         "label": "Norsk bokmål",
     *         "value": "nb"
     *       }
     *     ]
     *   }
     * }
     * ```
     *
     * @private
     * @param {Vimeo.Player} player
     * @returns {Promise}
     */
    const getVimeoVideoMetadata = (player) => {
      // Create an object for easy lookup of relevant metadata
      const massageVideoMetadata = (data) => {
        const duration = data[0];
        const qualities = data[1].map(q => ({
          name: q.id,
          label: q.label
        }));
        const tracks = data[2].reduce((tracks, current) => {
          const h5pVideoTrack = new H5P.Video.LabelValue(current.label, current.language);
          tracks.options.push(h5pVideoTrack);
          if (current.mode === 'showing') {
            tracks.current = h5pVideoTrack;
          }
          return tracks;
        }, { current: undefined, options: [] });
        const dimensions = { width: data[3], height: data[4] };

        return {
          duration,
          qualities,
          tracks,
          dimensions
        };
      };

      return Promise.all([
        player.getDuration(),
        player.getQualities(),
        player.getTextTracks(),
        player.getVideoWidth(),
        player.getVideoHeight(),
      ]).then(data => massageVideoMetadata(data));
    }

    try {
      if (document.featurePolicy.allowsFeature('autoplay') === false) {
        self.pressToPlay = true;
      }
    }
    catch (err) {}

    /**
     * Appends the video player to the DOM.
     *
     * @public
     * @param {jQuery} $container
     */
    self.appendTo = ($container) => {
      $container.addClass('h5p-vimeo').append($wrapper);
      createVimeoPlayer();
    };

    /**
     * Get list of available qualities.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = () => {
      return qualities;
    };

    /**
     * Get the current quality.
     *
     * @returns {String} Current quality identifier
     */
    self.getQuality = () => {
      return currentQuality;
    };

    /**
     * Set the playback quality.
     *
     * @public
     * @param {String} quality
     */
    self.setQuality = async (quality) => {
      currentQuality = await player.setQuality(quality);
      self.trigger('qualityChange', currentQuality);
    };

    /**
     * Start the video.
     *
     * @public
     */
    self.play = async () => {
      if (!player) {
        self.on('ready', self.play);
        return;
      }

      try {
        await player.play();
      }
      catch (error) {
        switch (error.name) {
          case 'PasswordError': // The video is password-protected
            self.trigger('error', l10n.vimeoPasswordError);
            break;

          case 'PrivacyError': // The video is private
            self.trigger('error', l10n.vimeoPrivacyError);
            break;

          default:
            self.trigger('error', l10n.unknownError);
            break;
        }
      }
    };

    /**
     * Pause the video.
     *
     * @public
     */
    self.pause = () => {
      if (player) {
        player.pause();
      }
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = async (time) => {
      if (!player) {
        return;
      }

      currentTime = time;
      await player.setCurrentTime(time);
    };

    /**
     * @public
     * @returns {Number} Seconds elapsed since beginning of video
     */
    self.getCurrentTime = () => {
      return currentTime;
    };

    /**
     * @public
     * @returns {Number} Video duration in seconds
     */
    self.getDuration = () => {
      return duration;
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = () => {
      return buffered;
    };

    /**
     * Mute the video.
     *
     * @public
     */
    self.mute = async () => {
      isMuted = await player.setMuted(true);
    };

    /**
     * Unmute the video.
     *
     * @public
     */
    self.unMute = async () => {
      isMuted = await player.setMuted(false);
    };

    /**
     * Whether the video is muted.
     *
     * @public
     * @returns {Boolean} True if the video is muted, false otherwise
     */
    self.isMuted = () => {
      return isMuted;
    };

    /**
     * Whether the video is loaded.
     *
     * @public
     * @returns {Boolean} True if the video is muted, false otherwise
     */
    self.isLoaded = () => {
      return isLoaded;
    };

    /**
     * Get the video player's current sound volume.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = () => {
      return volume;
    };

    /**
     * Set the video player's sound volume.
     *
     * @public
     * @param {Number} level
     */
    self.setVolume = async (level) => {
      volume = await player.setVolume(level);
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} Available playback rates
     */
    self.getPlaybackRates = () => {
      return [0.5, 1, 1.5, 2];
    };

    /**
     * Get the current playback rate.
     *
     * @public
     * @returns {Number} e.g. 0.5, 1, 1.5 or 2
     */
    self.getPlaybackRate = () => {
      return playbackRate;
    };

    /**
     * Set the current playback rate.
     *
     * @public
     * @param {Number} rate Must be one of available rates from getPlaybackRates
     */
    self.setPlaybackRate = async (rate) => {
      playbackRate = await player.setPlaybackRate(rate);
      self.trigger('playbackRateChange', rate);
    };

    /**
     * Set current captions track.
     *
     * @public
     * @param {H5P.Video.LabelValue} track Captions to display
     */
    self.setCaptionsTrack = (track) => {
      if (!track) {
        return player.disableTextTrack().then(() => {
          currentTextTrack = null;
        });
      }

      player.enableTextTrack(track.value).then(() => {
        currentTextTrack = track;
      });
    };

    /**
     * Get current captions track.
     *
     * @public
     * @returns {H5P.Video.LabelValue}
     */
    self.getCaptionsTrack = () => {
      return currentTextTrack;
    };

    self.on('resize', () => {
      if (failedLoading || !$wrapper.is(':visible')) {
        return;
      }

      if (player === undefined) {
        // Player isn't created yet. Try again.
        createVimeoPlayer();
        return;
      }

      // Use as much space as possible
      $wrapper.css({
        width: '100%',
        height: 'auto'
      });

      const width = $wrapper[0].clientWidth;
      const height = options.fit ? $wrapper[0].clientHeight : (width * (ratio));

      // Validate height before setting
      if (height > 0) {
        // Set size
        $wrapper.css({
          width: width + 'px',
          height: height + 'px'
        });
      }
    });
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  VimeoPlayer.canPlay = (sources) => {
    return getId(sources[0].path);
  };

  /**
   * Find id of Vimeo video from given URL.
   *
   * @private
   * @param {String} url
   * @returns {String} Vimeo video ID
   */
  const getId = (url) => {
    // https://stackoverflow.com/a/11660798
    const matches = url.match(/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/);
    if (matches && matches[5]) {
      return matches[5];
    }
  };

  /**
   * Load the Vimeo Player SDK asynchronously.
   *
   * @private
   * @returns {Promise} Vimeo Player SDK object
   */
  const loadVimeoPlayerSDK = async () => {
    if (window.Vimeo) {
      return await Promise.resolve(window.Vimeo);
    }

    return await new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = 'https://player.vimeo.com/api/player.js';
      tag.onload = () => resolve(window.Vimeo);
      tag.onerror = reject;
      document.querySelector('script').before(tag);
    });
  };

  return VimeoPlayer;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoVimeo);
;
/** @namespace H5P */
H5P.VideoYouTube = (function ($) {

  /**
   * YouTube video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function YouTube(sources, options, l10n) {
    var self = this;

    var player;
    var playbackRate = 1;
    var id = 'h5p-youtube-' + numInstances;
    numInstances++;

    var $wrapper = $('<div/>');
    var $placeholder = $('<div/>', {
      id: id,
      text: l10n.loading
    }).appendTo($wrapper);

    // Optional placeholder
    // var $placeholder = $('<iframe id="' + id + '" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/' + getId(sources[0].path) + '?enablejsapi=1&origin=' + encodeURIComponent(ORIGIN) + '&autoplay=' + (options.autoplay ? 1 : 0) + '&controls=' + (options.controls ? 1 : 0) + '&disabledkb=' + (options.controls ? 0 : 1) + '&fs=0&loop=' + (options.loop ? 1 : 0) + '&rel=0&showinfo=0&iv_load_policy=3" frameborder="0"></iframe>').appendTo($wrapper);

    /**
     * Use the YouTube API to create a new player
     *
     * @private
     */
    var create = function () {
      if (!$placeholder.is(':visible') || player !== undefined) {
        return;
      }

      if (window.YT === undefined) {
        // Load API first
        loadAPI(create);
        return;
      }
      if (YT.Player === undefined) {
        return;
      }

      var width = $wrapper.width();
      if (width < 200) {
        width = 200;
      }

      var loadCaptionsModule = true;

      var videoId = getId(sources[0].path);

      player = new YT.Player(id, {
        width: width,
        height: width * (9/16),
        videoId: videoId,
        playerVars: {
          origin: ORIGIN,
          // Hardcoded autoplay to false to avoid playing videos on init
          autoplay: 0,
          controls: options.controls ? 1 : 0,
          disablekb: options.controls ? 0 : 1,
          fs: 0,
          loop: options.loop ? 1 : 0,
          playlist: options.loop ? videoId : undefined,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          wmode: "opaque",
          start: Math.floor(options.startAt),
          playsinline: 1
        },
        events: {
          onReady: function () {
            self.trigger('ready');
            self.trigger('loaded');

            if (!options.autoplay) {
              self.toPause = true;
            }
            
            if (options.deactivateSound) {
              self.mute();
            }
          },
          onApiChange: function () {
            if (loadCaptionsModule) {
              loadCaptionsModule = false;

              // Always load captions
              player.loadModule('captions');
            }

            var trackList;
            try {
              // Grab tracklist from player
              trackList = player.getOption('captions', 'tracklist');
            }
            catch (err) {}
            if (trackList && trackList.length) {

              // Format track list into valid track options
              var trackOptions = [];
              for (var i = 0; i < trackList.length; i++) {
                trackOptions.push(new H5P.Video.LabelValue(trackList[i].displayName, trackList[i].languageCode));
              }

              // Captions are ready for loading
              self.trigger('captions', trackOptions);
            }
          },
          onStateChange: function (state) {
            if (state.data > -1 && state.data < 4) {
              if (self.toPause) {
                // if video buffering, was likely paused already - skip
                if (state.data === H5P.Video.BUFFERING) {
                  delete self.toPause;
                }
                else {
                  self.pause();
                }
              }

              // Fix for keeping playback rate in IE11
              if (H5P.Video.IE11_PLAYBACK_RATE_FIX && state.data === H5P.Video.PLAYING && playbackRate !== 1) {
                // YT doesn't know that IE11 changed the rate so it must be reset before it's set to the correct value
                player.setPlaybackRate(1);
                player.setPlaybackRate(playbackRate);
              }
              // End IE11 fix

              self.trigger('stateChange', state.data);
            }
          },
          onPlaybackQualityChange: function (quality) {
            self.trigger('qualityChange', quality.data);
          },
          onPlaybackRateChange: function (playbackRate) {
            self.trigger('playbackRateChange', playbackRate.data);
          },
          onError: function (error) {
            var message;
            switch (error.data) {
              case 2:
                message = l10n.invalidYtId;
                break;

              case 100:
                message = l10n.unknownYtId;
                break;

              case 101:
              case 150:
                message = l10n.restrictedYt;
                break;

              default:
                message = l10n.unknownError + ' ' + error.data;
                break;
            }
            self.trigger('error', message);
          }
        }
      });
    };

    /**
     * Indicates if the video must be clicked for it to start playing.
     * For instance YouTube videos on iPad must be pressed to start playing.
     *
     * @public
     */
    if (navigator.userAgent.match(/iPad/i)) {
      self.pressToPlay = true;
    }
    else {
      try {
        if (document.featurePolicy.allowsFeature('autoplay') === false) {
          self.pressToPlay = true;
        }
      }
      catch (err) {}
    }

    /**
    * Appends the video player to the DOM.
    *
    * @public
    * @param {jQuery} $container
    */
    self.appendTo = function ($container) {
      $container.addClass('h5p-youtube').append($wrapper);
      create();
    };

    /**
     * Get list of available qualities. Not available until after play.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = function () {
      if (!player || !player.getAvailableQualityLevels) {
        return;
      }

      var qualities = player.getAvailableQualityLevels();
      if (!qualities.length) {
        return; // No qualities
      }

      // Add labels
      for (var i = 0; i < qualities.length; i++) {
        var quality = qualities[i];
        var label = (LABELS[quality] !== undefined ? LABELS[quality] : 'Unknown'); // TODO: l10n
        qualities[i] = {
          name: quality,
          label: LABELS[quality]
        };
      }

      return qualities;
    };

    /**
     * Get current playback quality. Not available until after play.
     *
     * @public
     * @returns {String}
     */
    self.getQuality = function () {
      if (!player || !player.getPlaybackQuality) {
        return;
      }

      var quality = player.getPlaybackQuality();
      return quality === 'unknown' ? undefined : quality;
    };

    /**
     * Set current playback quality. Not available until after play.
     * Listen to event "qualityChange" to check if successful.
     *
     * @public
     * @params {String} [quality]
     */
    self.setQuality = function (quality) {
      if (!player || !player.setPlaybackQuality) {
        return;
      }

      player.setPlaybackQuality(quality);
    };

    /**
     * Start the video.
     *
     * @public
     */
    self.play = function () {
      if (!player || !player.playVideo) {
        self.on('ready', self.play);
        return;
      }
      player.playVideo();
    };

    /**
     * Pause the video.
     *
     * @public
     */
    self.pause = function () {
      delete self.toPause;
      self.off('ready', self.play);
      if (!player || !player.pauseVideo) {
        return;
      }
      player.pauseVideo();
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = function (time) {
      if (!player || !player.seekTo) {
        return;
      }

      player.seekTo(time, true);
    };

    /**
     * Recreate player with initial time
     *
     * @public
     * @param {Number} time
     */
    self.resetPlayback = function (time) {
      options.startAt = time;

      if (player) {
        if (player.getPlayerState() === H5P.Video.PLAYING) {
          player.pauseVideo();
          self.trigger('stateChange', H5P.Video.PAUSED);
        }
        player.destroy();
        player = undefined;
      }

      create();
    }
    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      if (!player || !player.getCurrentTime) {
        return;
      }

      return player.getCurrentTime();
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      if (!player || !player.getDuration) {
        return;
      }

      return player.getDuration();
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
      if (!player || !player.getVideoLoadedFraction) {
        return;
      }

      return player.getVideoLoadedFraction() * 100;
    };

    /**
     * Turn off video sound.
     *
     * @public
     */
    self.mute = function () {
      if (!player || !player.mute) {
        return;
      }

      player.mute();
    };

    /**
     * Turn on video sound.
     *
     * @public
     */
    self.unMute = function () {
      if (!player || !player.unMute) {
        return;
      }

      player.unMute();
    };

    /**
     * Check if video sound is turned on or off.
     *
     * @public
     * @returns {Boolean}
     */
    self.isMuted = function () {
      if (!player || !player.isMuted) {
        return;
      }

      return player.isMuted();
    };

    /**
     * Check if video is loaded and ready to play.
     *
     * @public
     * @returns {Boolean}
     */
    self.isLoaded = function () {
      if (!player || !player.getPlayerState) {
        return;
      }

      return player.getPlayerState() === 5;
    };

    /**
     * Return the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      if (!player || !player.getVolume) {
        return;
      }

      return player.getVolume();
    };

    /**
     * Set video sound level.
     *
     * @public
     * @param {Number} level Between 0 and 100.
     */
    self.setVolume = function (level) {
      if (!player || !player.setVolume) {
        return;
      }

      player.setVolume(level);
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} available playback rates
     */
    self.getPlaybackRates = function () {
      if (!player || !player.getAvailablePlaybackRates) {
        return;
      }

      var playbackRates = player.getAvailablePlaybackRates();
      if (!playbackRates.length) {
        return; // No rates, but the array should contain at least 1
      }

      return playbackRates;
    };

    /**
     * Get current playback rate.
     *
     * @public
     * @returns {Number} such as 0.25, 0.5, 1, 1.25, 1.5 and 2
     */
    self.getPlaybackRate = function () {
      if (!player || !player.getPlaybackRate) {
        return;
      }

      return player.getPlaybackRate();
    };

    /**
     * Set current playback rate.
     * Listen to event "playbackRateChange" to check if successful.
     *
     * @public
     * @params {Number} suggested rate that may be rounded to supported values
     */
    self.setPlaybackRate = function (newPlaybackRate) {
      if (!player || !player.setPlaybackRate) {
        return;
      }

      playbackRate = Number(newPlaybackRate);
      player.setPlaybackRate(playbackRate);
    };

    /**
     * Set current captions track.
     *
     * @param {H5P.Video.LabelValue} Captions track to show during playback
     */
    self.setCaptionsTrack = function (track) {
      player.setOption('captions', 'track', track ? {languageCode: track.value} : {});
    };

    /**
     * Figure out which captions track is currently used.
     *
     * @return {H5P.Video.LabelValue} Captions track
     */
    self.getCaptionsTrack = function () {
      var track = player.getOption('captions', 'track');
      return (track.languageCode ? new H5P.Video.LabelValue(track.displayName, track.languageCode) : null);
    };

    // Respond to resize events by setting the YT player size.
    self.on('resize', function () {
      if (!$wrapper.is(':visible')) {
        return;
      }

      if (!player) {
        // Player isn't created yet. Try again.
        create();
        return;
      }

      // Use as much space as possible
      $wrapper.css({
        width: '100%',
        height: '100%'
      });

      var width = $wrapper[0].clientWidth;
      var height = options.fit ? $wrapper[0].clientHeight : (width * (9/16));

      // Validate height before setting
      if (height > 0) {
        // Set size
        $wrapper.css({
          width: width + 'px',
          height: height + 'px'
        });

        player.setSize(width, height);
      }
    });
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  YouTube.canPlay = function (sources) {
    return getId(sources[0].path);
  };

  /**
   * Find id of YouTube video from given URL.
   *
   * @private
   * @param {String} url
   * @returns {String} YouTube video identifier
   */

  var getId = function (url) {
    // Has some false positives, but should cover all regular URLs that people can find
    var matches = url.match(/(?:(?:youtube.com\/(?:attribution_link\?(?:\S+))?(?:v\/|embed\/|watch\/|(?:user\/(?:\S+)\/)?watch(?:\S+)v\=))|(?:youtu.be\/|y2u.be\/))([A-Za-z0-9_-]{11})/i);
    if (matches && matches[1]) {
      return matches[1];
    }
  };

  /**
   * Load the IFrame Player API asynchronously.
   */
  var loadAPI = function (loaded) {
    if (window.onYouTubeIframeAPIReady !== undefined) {
      // Someone else is loading, hook in
      var original = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function (id) {
        loaded(id);
        original(id);
      };
    }
    else {
      // Load the API our self
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = loaded;
    }
  };

  /** @constant {Object} */
  var LABELS = {
    highres: '2160p', // Old API support
    hd2160: '2160p', // (New API)
    hd1440: '1440p',
    hd1080: '1080p',
    hd720: '720p',
    large: '480p',
    medium: '360p',
    small: '240p',
    tiny: '144p',
    auto: 'Auto'
  };

  /** @private */
  var numInstances = 0;

  // Extract the current origin (used for security)
  var ORIGIN = window.location.href.match(/http[s]?:\/\/[^\/]+/);
  ORIGIN = !ORIGIN || ORIGIN[0] === undefined ? undefined : ORIGIN[0];
  // ORIGIN = undefined is needed to support fetching file from device local storage

  return YouTube;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoYouTube);
;
/** @namespace H5P */
H5P.VideoPanopto = (function ($) {

  /**
   * Panopto video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function Panopto(sources, options, l10n) {
    var self = this;

    self.volume = 100;
    self.toSeek = undefined;

    var player;
    var playbackRate = 1;
    let canHasAutoplay;
    var id = 'h5p-panopto-' + numInstances;
    numInstances++;
    let isLoaded = false;
    let isPlayerReady = false;

    var $wrapper = $('<div/>');
    var $placeholder = $('<div/>', {
      id: id,
      html: '<div>' + l10n.loading + '</div>'
    }).appendTo($wrapper);

    // Determine autoplay/play.
    try {
      if (document.featurePolicy.allowsFeature('autoplay') !== false) {
        canHasAutoplay = true;
      }
    }
    catch (err) {}

    /**
     * Use the Panopto API to create a new player
     *
     * @private
     */
    var create = function () {
      if (!$placeholder.is(':visible') || player !== undefined) {
        return;
      }

      if (window.EmbedApi === undefined) {
        // Load API first
        loadAPI(create);
        return;
      }

      var width = $wrapper.width();
      if (width < 200) {
        width = 200;
      }

      const videoId = getId(sources[0].path);
      player = new EmbedApi(id, {
        width: width,
        height: width * (9/16),
        serverName: videoId[0],
        sessionId: videoId[1],
        videoParams: { // Optional
          interactivity: 'none',
          showtitle: false,
          autohide: true,
          offerviewer: false,
          autoplay: false,
          showbrand: false,
          start: 0,
          hideoverlay: !options.controls,
        },
        events: {
          onIframeReady: function () {
            isPlayerReady = true;
            $placeholder.children(0).text('');
            if (options.autoplay && canHasAutoplay) {
              player.loadVideo();
              isLoaded = true;
            }

            self.trigger('containerLoaded');
            self.trigger('resize'); // Avoid black iframe if loading is slow
          },
          onReady: function () {
            self.videoLoaded = true;
            self.trigger('loaded');

            if (typeof self.oldTime === 'number') {
              self.seek(self.oldTime);
            }
            else if (typeof self.startAt === 'number' && self.startAt > 0) {
              self.seek(self.startAt);
            }
            if (player.hasCaptions()) {
              const captions = [];

              const captionTracks = player.getCaptionTracks();
              for (trackIndex in captionTracks) {
                captions.push(new H5P.Video.LabelValue(captionTracks[trackIndex], trackIndex));
              }

              // Select active track
              currentTrack = player.getSelectedCaptionTrack();
              currentTrack = captions[currentTrack] ? captions[currentTrack] : null;

              self.trigger('captions', captions);
            }
          },
          onStateChange: function (state) {
            if ([H5P.Video.PLAYING, H5P.Video.PAUSED].includes(state) && typeof self.seekToTime === 'number') {
              player.seekTo(self.seekToTime);
              delete self.seekToTime;
            }
            // since panopto has different load sequence in IV, need additional condition here
            if (self.WAS_RESET) {
              self.WAS_RESET = false;
            }

            // TODO: Playback rate fix for IE11?
            if (state > -1 && state < 4) {
              self.trigger('stateChange', state);
            }
          },
          onPlaybackRateChange: function () {
            self.trigger('playbackRateChange', self.getPlaybackRate());
          },
          onError: function (error) {
            if (error === ApiError.PlayWithSoundNotAllowed) {
              // pause and allow user to handle playing
              self.pause();

              self.unMute(); // because player is automuted on this error
            }
            else {
              self.trigger('error', l10n.unknownError);
            }
          },
          onLoginShown: function () {
            $placeholder.children().first().remove(); // Remove loading message
            self.trigger('loaded'); // Resize parent
          }
        }
      });
    };

    /**
     * Indicates if the video must be clicked for it to start playing.
     * This is always true for Panopto since all videos auto play.
     *
     * @public
     */
    self.pressToPlay = true;

    /**
    * Appends the video player to the DOM.
    *
    * @public
    * @param {jQuery} $container
    */
    self.appendTo = function ($container) {
      $container.addClass('h5p-panopto').append($wrapper);
      create();
    };

    /**
     * Get list of available qualities. Not available until after play.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = function () {
      // Not available for Panopto
    };

    /**
     * Get current playback quality. Not available until after play.
     *
     * @public
     * @returns {String}
     */
    self.getQuality = function () {
      // Not available for Panopto
    };

    /**
     * Set current playback quality. Not available until after play.
     * Listen to event "qualityChange" to check if successful.
     *
     * @public
     * @params {String} [quality]
     */
    self.setQuality = function (quality) {
      // Not available for Panopto
    };

    /**
     * Start the video.
     *
     * @public
     */
    self.play = function () {
      if (!player || !player.playVideo || !isPlayerReady) {
        return;
      }
      if (isLoaded || self.videoLoaded) {
        player.playVideo();
      }
      else {
        player.loadVideo(); // Loads and starts playing
        isLoaded = true;
      }
    };

    /**
     * Pause the video.
     *
     * @public
     */
    self.pause = function () {
      if (!player || !player.pauseVideo) {
        return;
      }
      try {
        player.pauseVideo();
      }
      catch (err) {
        // Swallow Panopto throwing an error. This has been seen in the authoring
        // tool if Panopto has been used inside Iv inside CP
      }
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = function (time) {
      if (!player || !player.seekTo || !self.videoLoaded) {
        return;
      }
      if (!player.isReady) {
        self.seekToTime = time;
        return;
      }

      player.seekTo(time);

      if (self.WAS_RESET) {
        // need to check just to be sure, since state === 1 is unusable
        delete self.seekToTime;
        self.WAS_RESET = false;
      }
    };

    /**
     * Recreate player with initial time
     *
     * @public
     * @param {Number} time
     */
    self.resetPlayback = function (time) {
      if (player && player.isReady && self.videoLoaded) {
        self.seek(time);
        self.pause();
      }
      else {
        self.seekToTime = time;
      }
    }

    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      if (!player || !player.getCurrentTime) {
        return;
      }

      return player.getCurrentTime();
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      if (!player || !player.getDuration) {
        return;
      }

      return player.getDuration();
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
      // Not available for Panopto
    };

    /**
     * Turn off video sound.
     *
     * @public
     */
    self.mute = function () {
      if (!player || !player.muteVideo) {
        return;
      }

      player.muteVideo();
    };

    /**
     * Turn on video sound.
     *
     * @public
     */
    self.unMute = function () {
      if (!player || !player.unmuteVideo) {
        return;
      }

      player.unmuteVideo();

      // The volume is set to 0 when the browser prevents autoplay,
      // causing there to be no sound despite unmuting
      self.setVolume(self.volume);
    };

    /**
     * Check if video sound is turned on or off.
     *
     * @public
     * @returns {Boolean}
     */
    self.isMuted = function () {
      if (!player || !player.isMuted) {
        return;
      }

      return player.isMuted();
    };

    /**
     * Check video is loaded and ready to play
     *
     * @public
     * @returns {Boolean}
     */
    self.isLoaded = function () {
      return isPlayerReady;
    };

    /**
     * Return the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      if (!player || !player.getVolume) {
        return;
      }

      return player.getVolume() * 100;
    };

    /**
     * Set video sound level.
     *
     * @public
     * @param {Number} level Between 0 and 100.
     */
    self.setVolume = function (level) {
      if (!player || !player.setVolume) {
        return;
      }

      player.setVolume(level/100);
      self.volume = level;
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} available playback rates
     */
    self.getPlaybackRates = function () {
      return [0.25, 0.5, 1, 1.25, 1.5, 2];
    };

    /**
     * Get current playback rate.
     *
     * @public
     * @returns {Number} such as 0.25, 0.5, 1, 1.25, 1.5 and 2
     */
    self.getPlaybackRate = function () {
      if (!player || !player.getPlaybackRate) {
        return;
      }

      return player.getPlaybackRate();
    };

    /**
     * Set current playback rate.
     * Listen to event "playbackRateChange" to check if successful.
     *
     * @public
     * @params {Number} suggested rate that may be rounded to supported values
     */
    self.setPlaybackRate = function (newPlaybackRate) {
      if (!player || !player.setPlaybackRate) {
        return;
      }

      player.setPlaybackRate(newPlaybackRate);
    };

    /**
     * Set current captions track.
     *
     * @param {H5P.Video.LabelValue} Captions track to show during playback
     */
    self.setCaptionsTrack = function (track) {
      if (!track) {
        player.disableCaptions();
        currentTrack = null;
      }
      else {
        player.enableCaptions(track.value + '');
        currentTrack = track;
      }
    };

    /**
     * Figure out which captions track is currently used.
     *
     * @return {H5P.Video.LabelValue} Captions track
     */
    self.getCaptionsTrack = function () {
      return currentTrack; // No function for getting active caption track?
    };

    // Respond to resize events by setting the player size.
    self.on('resize', function () {
      if (!$wrapper.is(':visible')) {
        return;
      }

      if (!player) {
        // Player isn't created yet. Try again.
        create();
        return;
      }

      // Use as much space as possible
      $wrapper.css({
        width: '100%',
        height: '100%'
      });

      var width = $wrapper[0].clientWidth;
      var height = options.fit ? $wrapper[0].clientHeight : (width * (9/16));

      // Set size
      $wrapper.css({
        width: width + 'px',
        height: height + 'px'
      });

      const $iframe = $placeholder.children('iframe');
      if ($iframe.length) {
        $iframe.attr('width', width);
        $iframe.attr('height', height);
      }
    });

    let currentTrack;
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  Panopto.canPlay = function (sources) {
    return getId(sources[0].path);
  };

  /**
   * Find id of YouTube video from given URL.
   *
   * @private
   * @param {String} url
   * @returns {String} Panopto video identifier
   */
  var getId = function (url) {
    const matches = url.match(/^[^\/]+:\/\/([^\/]*panopto\.[^\/]+)\/Panopto\/.+\?id=(.+)$/);
    if (matches && matches.length === 3) {
      return [matches[1], matches[2]];
    }
  };

  /**
   * Load the IFrame Player API asynchronously.
   */
  var loadAPI = function (loaded) {
    if (window.onPanoptoEmbedApiReady !== undefined) {
      // Someone else is loading, hook in
      var original = window.onPanoptoEmbedApiReady;
      window.onPanoptoEmbedApiReady = function (id) {
        loaded(id);
        original(id);
      };
    }
    else {
      // Load the API our self
      var tag = document.createElement('script');
      tag.src = 'https://developers.panopto.com/scripts/embedapi.min.js';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onPanoptoEmbedApiReady = loaded;
    }
  };

  /** @private */
  var numInstances = 0;

  return Panopto;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoPanopto);
;
/** @namespace H5P */
H5P.VideoHtml5 = (function ($) {

  /**
   * HTML5 video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function Html5(sources, options, l10n) {
    var self = this;

    /**
     * Small helper to ensure all video sources get the same cache buster.
     *
     * @private
     * @param {Object} source
     * @return {string}
     */
    const getCrossOriginPath = function (source) {
      let path = H5P.getPath(source.path, self.contentId);
      if (video.crossOrigin !== null && H5P.addQueryParameter && H5PIntegration.crossoriginCacheBuster) {
        path = H5P.addQueryParameter(path, H5PIntegration.crossoriginCacheBuster);
      }
      return path
    };


    /**
     * Register track to video
     *
     * @param {Object} trackData Track object
     * @param {string} trackData.kind Kind of track
     * @param {Object} trackData.track Source path
     * @param {string} [trackData.label] Label of track
     * @param {string} [trackData.srcLang] Language code
     */
    const addTrack = function (trackData) {
      // Skip invalid tracks
      if (!trackData.kind || !trackData.track.path) {
        return;
      }

      var track = document.createElement('track');
      track.kind = trackData.kind;
      track.src = getCrossOriginPath(trackData.track); // Uses same crossOrigin as parent. You cannot mix.
      if (trackData.label) {
        track.label = trackData.label;
      }

      if (trackData.srcLang) {
        track.srcLang = trackData.srcLang;
      }

      return track;
    };

    /**
     * Small helper to set the inital video source.
     * Useful if some of the loading happens asynchronously.
     * NOTE: Setting the crossOrigin must happen before any of the
     * sources(poster, tracks etc.) are loaded
     *
     * @private
     */
    const setInitialSource = function () {
      if (qualities[currentQuality] === undefined) {
        return;
      }

      if (H5P.setSource !== undefined) {
        H5P.setSource(video, qualities[currentQuality].source, self.contentId)
      }
      else {
        // Backwards compatibility (H5P < v1.22)
        const srcPath = H5P.getPath(qualities[currentQuality].source.path, self.contentId);
        if (H5P.getCrossOrigin !== undefined) {
          var crossOrigin = H5P.getCrossOrigin(srcPath);
          video.setAttribute('crossorigin', crossOrigin !== null ? crossOrigin : 'anonymous');
        }
        video.src = srcPath;
      }

      // Add poster if provided
      if (options.poster) {
        video.poster = getCrossOriginPath(options.poster); // Uses same crossOrigin as parent. You cannot mix.
      }

      // Register tracks
      options.tracks.forEach(function (track, i) {
        var trackElement = addTrack(track);
        if (i === 0) {
          trackElement.default = true;
        }
        if (trackElement) {
          video.appendChild(trackElement);
        }
      });
    };

    /**
     * Displayed when the video is buffering
     * @private
     */
    var $throbber = $('<div/>', {
      'class': 'h5p-video-loading'
    });

    /**
     * Used to display error messages
     * @private
     */
    var $error = $('<div/>', {
      'class': 'h5p-video-error'
    });

    /**
     * Keep track of current state when changing quality.
     * @private
     */
    var stateBeforeChangingQuality;
    var currentTimeBeforeChangingQuality;

    /**
     * Avoids firing the same event twice.
     * @private
     */
    var lastState;

    /**
     * Keeps track whether or not the video has been loaded.
     * @private
     */
    var isLoaded = false;

    /**
     *
     * @private
     */
    var playbackRate = 1;
    var skipRateChange = false;

    // Create player
    var video = document.createElement('video');

    // Sort sources into qualities
    var qualities = getQualities(sources, video);
    var currentQuality;

    numQualities = 0;
    for (let quality in qualities) {
      numQualities++;
    }

    if (numQualities > 1 && H5P.VideoHtml5.getExternalQuality !== undefined) {
      H5P.VideoHtml5.getExternalQuality(sources, function (chosenQuality) {
        if (qualities[chosenQuality] !== undefined) {
          currentQuality = chosenQuality;
        }
        setInitialSource();
      });
    }
    else {
      // Select quality and source
      currentQuality = getPreferredQuality();
      if (currentQuality === undefined || qualities[currentQuality] === undefined) {
        // No preferred quality, pick the first.
        for (currentQuality in qualities) {
          if (qualities.hasOwnProperty(currentQuality)) {
            break;
          }
        }
      }
      setInitialSource();
    }

    // Setting webkit-playsinline, which makes iOS 10 beeing able to play video
    // inside browser.
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');

    // Remove buttons in Chrome's video player:
    let controlsList = 'nodownload';
    if (options.disableFullscreen) {
      controlsList += ' nofullscreen';
    }
    if (options.disableRemotePlayback) {
      controlsList += ' noremoteplayback';
    }
    video.setAttribute('controlsList', controlsList);

    // Remove picture in picture as it interfers with other video players
    video.disablePictureInPicture = true;

    // Set options
    video.disableRemotePlayback = (options.disableRemotePlayback ? true : false);
    video.controls = (options.controls ? true : false);
    // Hardcoded autoplay to false to avoid playing videos on init
    video.autoplay = false;
    video.loop = (options.loop ? true : false);
    video.className = 'h5p-video';
    video.style.display = 'block';

    if (options.fit) {
      // Style is used since attributes with relative sizes aren't supported by IE9.
      video.style.width = '100%';
      video.style.height = '100%';
    }

    /**
     * Helps registering events.
     *
     * @private
     * @param {String} native Event name
     * @param {String} h5p Event name
     * @param {String} [arg] Optional argument
     */
    var mapEvent = function (native, h5p, arg) {
      video.addEventListener(native, function () {
        switch (h5p) {
          case 'loaded':
            isLoaded = true;

            if (stateBeforeChangingQuality !== undefined) {
              return; // Avoid loaded event when changing quality.
            }

            // Remove any errors
            if ($error.is(':visible')) {
              $error.remove();
            }

            if (OLD_ANDROID_FIX) {
              var andLoaded = function () {
                video.removeEventListener('durationchange', andLoaded, false);
                // On Android seeking isn't ready until after play.
                self.trigger(h5p);
              };
              video.addEventListener('durationchange', andLoaded, false);
              return;
            }

            if (video.poster) {
              $(video).one('play', function () {
                self.seek(self.getCurrentTime() || options.startAt);
              });
            }
            else {
              self.seek(options.startAt);
            }

            break;

          case 'error':
            // Handle error and get message.
            arg = error(arguments[0], arguments[1]);
            break;

          case 'playbackRateChange':

            // Fix for keeping playback rate in IE11
            if (skipRateChange) {
              skipRateChange = false;
              return; // Avoid firing event when changing back
            }
            if (H5P.Video.IE11_PLAYBACK_RATE_FIX && playbackRate != video.playbackRate) { // Intentional
              // Prevent change in playback rate not triggered by the user
              video.playbackRate = playbackRate;
              skipRateChange = true;
              return;
            }
            // End IE11 fix

            arg = self.getPlaybackRate();
            break;
        }
        self.trigger(h5p, arg);
      }, false);
    };

    /**
     * Handle errors from the video player.
     *
     * @private
     * @param {Object} code Error
     * @param {String} [message]
     * @returns {String} Human readable error message.
     */
    var error = function (code, message) {
      if (code instanceof Event) {

        // No error code
        if (!code.target.error) {
          return '';
        }

        switch (code.target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = l10n.aborted;
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = l10n.networkFailure;
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = l10n.cannotDecode;
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = l10n.formatNotSupported;
            break;
          case MediaError.MEDIA_ERR_ENCRYPTED:
            message = l10n.mediaEncrypted;
            break;
        }
      }
      if (!message) {
        message = l10n.unknownError;
      }

      // Hide throbber
      $throbber.remove();

      // Display error message to user
      $error.text(message).insertAfter(video);

      // Pass message to our error event
      return message;
    };

    /**
     * Appends the video player to the DOM.
     *
     * @public
     * @param {jQuery} $container
     */
    self.appendTo = function ($container) {
      $container.append(video);
    };

    /**
     * Get list of available qualities. Not available until after play.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = function () {
      // Create reverse list
      var options = [];
      for (var q in qualities) {
        if (qualities.hasOwnProperty(q)) {
          options.splice(0, 0, {
            name: q,
            label: qualities[q].label
          });
        }
      }

      if (options.length < 2) {
        // Do not return if only one quality.
        return;
      }

      return options;
    };

    /**
     * Get current playback quality. Not available until after play.
     *
     * @public
     * @returns {String}
     */
    self.getQuality = function () {
      return currentQuality;
    };

    /**
     * Set current playback quality. Not available until after play.
     * Listen to event "qualityChange" to check if successful.
     *
     * @public
     * @params {String} [quality]
     */
    self.setQuality = function (quality) {
      if (qualities[quality] === undefined || quality === currentQuality) {
        return; // Invalid quality
      }

      // Keep track of last choice
      setPreferredQuality(quality);

      // Avoid multiple loaded events if changing quality multiple times.
      if (!stateBeforeChangingQuality) {
        // Keep track of last state
        stateBeforeChangingQuality = lastState;

        // Keep track of current time
        currentTimeBeforeChangingQuality = video.currentTime;

        // Seek and start video again after loading.
        var loaded = function () {
          video.removeEventListener('loadedmetadata', loaded, false);
          if (OLD_ANDROID_FIX) {
            var andLoaded = function () {
              video.removeEventListener('durationchange', andLoaded, false);
              // On Android seeking isn't ready until after play.
              self.seek(currentTimeBeforeChangingQuality);
            };
            video.addEventListener('durationchange', andLoaded, false);
          }
          else {
            // Seek to current time.
            self.seek(currentTimeBeforeChangingQuality);
          }

          // Always play to get image.
          video.play();

          if (stateBeforeChangingQuality !== H5P.Video.PLAYING) {
            // Do not resume playing
            video.pause();
          }

          // Done changing quality
          stateBeforeChangingQuality = undefined;

          // Remove any errors
          if ($error.is(':visible')) {
            $error.remove();
          }
        };
        video.addEventListener('loadedmetadata', loaded, false);
      }

      // Keep track of current quality
      currentQuality = quality;
      self.trigger('qualityChange', currentQuality);

      // Display throbber
      self.trigger('stateChange', H5P.Video.BUFFERING);

      // Change source
      video.src = getCrossOriginPath(qualities[quality].source); // (iPad does not support #t=).
      // Note: Optional tracks use same crossOrigin as the original. You cannot mix.

      // Remove poster so it will not show during quality change
      video.removeAttribute('poster');
    };

    /**
     * Starts the video.
     *
     * @public
     * @return {Promise|undefined} May return a Promise that resolves when
     * play has been processed.
     */
    self.play = function () {
      if ($error.is(':visible')) {
        return;
      }

      if (!isLoaded) {
        // Make sure video is loaded before playing
        video.load();

        video.addEventListener('loadeddata', function() {
          video.play();
        }, false);
      }
      else {
        return video.play();
      }
    };

    /**
     * Pauses the video.
     *
     * @public
     */
    self.pause = function () {
      video.pause();
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = function (time) {
      video.currentTime = time;
      // Use canplaythrough for IOs devices
      // Use loadedmetadata for all other devices.
      const eventName = navigator.userAgent.match(/iPad|iPod|iPhone/i) ? "canplaythrough" : "loadedmetadata";
      function seekTo() {
        video.currentTime = time;
        video.removeEventListener(eventName, seekTo);
      };

      if (video.readyState === 4) {
        seekTo();
      }
      else {
        video.addEventListener(eventName, seekTo);
      }
    };

    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      return video.currentTime;
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      if (isNaN(video.duration)) {
        return;
      }

      return video.duration;
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
      // Find buffer currently playing from
      var buffered = 0;
      for (var i = 0; i < video.buffered.length; i++) {
        var from = video.buffered.start(i);
        var to = video.buffered.end(i);

        if (video.currentTime > from && video.currentTime < to) {
          buffered = to;
          break;
        }
      }

      // To percentage
      return buffered ? (buffered / video.duration) * 100 : 0;
    };

    /**
     * Turn off video sound.
     *
     * @public
     */
    self.mute = function () {
      video.muted = true;
    };

    /**
     * Turn on video sound.
     *
     * @public
     */
    self.unMute = function () {
      video.muted = false;
    };

    /**
     * Check if video sound is turned on or off.
     *
     * @public
     * @returns {Boolean}
     */
    self.isMuted = function () {
      return video.muted;
    };

    /**
     * Returns the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      return video.volume * 100;
    };

    /**
     * Set video sound level.
     *
     * @public
     * @param {Number} level Between 0 and 100.
     */
    self.setVolume = function (level) {
      video.volume = level / 100;
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} available playback rates
     */
    self.getPlaybackRates = function () {
      /*
       * not sure if there's a common rule about determining good speeds
       * using Google's standard options via a constant for setting
       */
      var playbackRates = PLAYBACK_RATES;

      return playbackRates;
    };

    /**
     * Get current playback rate.
     *
     * @public
     * @returns {Number} such as 0.25, 0.5, 1, 1.25, 1.5 and 2
     */
    self.getPlaybackRate = function () {
      return video.playbackRate;
    };

    /**
     * Set current playback rate.
     * Listen to event "playbackRateChange" to check if successful.
     *
     * @public
     * @params {Number} suggested rate that may be rounded to supported values
     */
    self.setPlaybackRate = function (newPlaybackRate) {
      playbackRate = newPlaybackRate;
      video.playbackRate = newPlaybackRate;
    };

    /**
     * Set current captions track.
     *
     * @param {H5P.Video.LabelValue} Captions track to show during playback
     */
    self.setCaptionsTrack = function (track) {
      for (var i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = (track && track.value === i ? 'showing' : 'disabled');
      }
    };

    /**
     * Figure out which captions track is currently used.
     *
     * @return {H5P.Video.LabelValue} Captions track
     */
    self.getCaptionsTrack = function () {
      for (var i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].mode === 'showing') {
          return new H5P.Video.LabelValue(video.textTracks[i].label, i);
        }
      }

      return null;
    };

    // Register event listeners
    mapEvent('ended', 'stateChange', H5P.Video.ENDED);
    mapEvent('playing', 'stateChange', H5P.Video.PLAYING);
    mapEvent('pause', 'stateChange', H5P.Video.PAUSED);
    mapEvent('waiting', 'stateChange', H5P.Video.BUFFERING);
    mapEvent('loadedmetadata', 'loaded');
    mapEvent('canplay', 'canplay');
    mapEvent('error', 'error');
    mapEvent('ratechange', 'playbackRateChange');

    if (!video.controls) {
      // Disable context menu(right click) to prevent controls.
      video.addEventListener('contextmenu', function (event) {
        event.preventDefault();
      }, false);
    }

    // Display throbber when buffering/loading video.
    self.on('stateChange', function (event) {
      var state = event.data;
      lastState = state;
      if (state === H5P.Video.BUFFERING) {
        $throbber.insertAfter(video);
      }
      else {
        $throbber.remove();
      }
    });

    // Load captions after the video is loaded
    self.on('loaded', function () {
      nextTick(function () {
        var textTracks = [];
        for (var i = 0; i < video.textTracks.length; i++) {
          textTracks.push(new H5P.Video.LabelValue(video.textTracks[i].label, i));
        }
        if (textTracks.length) {
          self.trigger('captions', textTracks);
        }
      });
    });

    // Alternative to 'canplay' event
    /*self.on('resize', function () {
      if (video.offsetParent === null) {
        return;
      }

      video.style.width = '100%';
      video.style.height = '100%';

      var width = video.clientWidth;
      var height = options.fit ? video.clientHeight : (width * (video.videoHeight / video.videoWidth));

      video.style.width = width + 'px';
      video.style.height = height + 'px';
    });*/

    // Video controls are ready
    nextTick(function () {
      self.trigger('ready');
    });

    /**
     * Check video is loaded and ready play.
     *
     * @public
     * @param {Boolean}
     */
    self.isLoaded = function () {
      return isLoaded;
    };
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  Html5.canPlay = function (sources) {
    var video = document.createElement('video');
    if (video.canPlayType === undefined) {
      return false; // Not supported
    }

    // Cycle through sources
    for (var i = 0; i < sources.length; i++) {
      var type = getType(sources[i]);
      if (type && video.canPlayType(type) !== '') {
        // We should be able to play this
        return true;
      }
    }

    return false;
  };

  /**
   * Find source type.
   *
   * @private
   * @param {Object} source
   * @returns {String}
   */
  var getType = function (source) {
    var type = source.mime;
    if (!type) {
      // Try to get type from URL
      var matches = source.path.match(/\.(\w+)$/);
      if (matches && matches[1]) {
        type = 'video/' + matches[1];
      }
    }

    if (type && source.codecs) {
      // Add codecs
      type += '; codecs="' + source.codecs + '"';
    }

    return type;
  };

  /**
   * Sort sources into qualities.
   *
   * @private
   * @static
   * @param {Array} sources
   * @param {Object} video
   * @returns {Object} Quality mapping
   */
  var getQualities = function (sources, video) {
    var qualities = {};
    var qualityIndex = 1;
    var lastQuality;

    // Cycle through sources
    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];

      // Find and update type.
      var type = source.type = getType(source);

      // Check if we support this type
      var isPlayable = type && (type === 'video/unknown' || video.canPlayType(type) !== '');
      if (!isPlayable) {
        continue; // We cannot play this source
      }

      if (source.quality === undefined) {
        /**
         * No quality metadata. Create a quality tag to separate multiple sources of the same type,
         * e.g. if two mp4 files with different quality has been uploaded
         */

        if (lastQuality === undefined || qualities[lastQuality].source.type === type) {
          // Create a new quality tag
          source.quality = {
            name: 'q' + qualityIndex,
            label: (source.metadata && source.metadata.qualityName) ? source.metadata.qualityName : 'Quality ' + qualityIndex // TODO: l10n
          };
          qualityIndex++;
        }
        else {
          /**
           * Assumes quality already exists in a different format.
           * Uses existing label for this quality.
           */
          source.quality = qualities[lastQuality].source.quality;
        }
      }

      // Log last quality
      lastQuality = source.quality.name;

      // Look to see if quality exists
      var quality = qualities[lastQuality];
      if (quality) {
        // We have a source with this quality. Check if we have a better format.
        if (source.mime.split('/')[1] === PREFERRED_FORMAT) {
          quality.source = source;
        }
      }
      else {
        // Add new source with quality.
        qualities[source.quality.name] = {
          label: source.quality.label,
          source: source
        };
      }
    }

    return qualities;
  };

  /**
   * Set preferred video quality.
   *
   * @private
   * @static
   * @param {String} quality Index of preferred quality
   */
  var setPreferredQuality = function (quality) {
    try {
      localStorage.setItem('h5pVideoQuality', quality);
    }
    catch (err) {
      console.warn('Unable to set preferred video quality, localStorage is not available.');
    }
  };

  /**
   * Get preferred video quality.
   *
   * @private
   * @static
   * @returns {String} Index of preferred quality
   */
  var getPreferredQuality = function () {
    // First check localStorage
    let quality;
    try {
      quality = localStorage.getItem('h5pVideoQuality');
    }
    catch (err) {
      console.warn('Unable to retrieve preferred video quality from localStorage.');
    }
    if (!quality) {
      try {
        // The fallback to old cookie solution
        var settings = document.cookie.split(';');
        for (var i = 0; i < settings.length; i++) {
          var setting = settings[i].split('=');
          if (setting[0] === 'H5PVideoQuality') {
            quality = setting[1];
            break;
          }
        }
      }
      catch (err) {
        console.warn('Unable to retrieve preferred video quality from cookie.');
      }
    }
    return quality;
  };

  /**
   * Helps schedule a task for the next tick.
   * @param {function} task
   */
  var nextTick = function (task) {
    setTimeout(task, 0);
  };

  /** @constant {Boolean} */
  var OLD_ANDROID_FIX = false;

  /** @constant {Boolean} */
  var PREFERRED_FORMAT = 'mp4';

  /** @constant {Object} */
  var PLAYBACK_RATES = [0.25, 0.5, 1, 1.25, 1.5, 2];

  if (navigator.userAgent.indexOf('Android') !== -1) {
    // We have Android, check version.
    var version = navigator.userAgent.match(/AppleWebKit\/(\d+\.?\d*)/);
    if (version && version[1] && Number(version[1]) <= 534.30) {
      // Include fix for devices running the native Android browser.
      // (We don't know when video was fixed, so the number is just the lastest
      // native android browser we found.)
      OLD_ANDROID_FIX = true;
    }
  }
  else {
    if (navigator.userAgent.indexOf('Chrome') !== -1) {
      // If we're using chrome on a device that isn't Android, prefer the webm
      // format. This is because Chrome has trouble with some mp4 codecs.
      PREFERRED_FORMAT = 'webm';
    }
  }

  return Html5;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoHtml5);
;
/** @namespace H5P */
H5P.Video = (function ($, ContentCopyrights, MediaCopyright, handlers) {

  /**
   * The ultimate H5P video player!
   *
   * @class
   * @param {Object} parameters Options for this library.
   * @param {Object} parameters.visuals Visual options
   * @param {Object} parameters.playback Playback options
   * @param {Object} parameters.a11y Accessibility options
   * @param {Boolean} [parameters.startAt] Start time of video
   * @param {Number} id Content identifier
   * @param {Object} [extras] Extra parameters.
   */
  function Video(parameters, id, extras = {}) {
    var self = this;
    self.oldTime = extras.previousState?.time;
    self.contentId = id;
    self.WAS_RESET = false;
    self.startAt = parameters.startAt || 0;

    // Ref youtube.js - ipad & youtube - issue
    self.pressToPlay = false;

    // Reference to the handler
    var handlerName = '';

    // Initialize event inheritance
    H5P.EventDispatcher.call(self);

    // Default language localization
    parameters = $.extend(true, parameters, {
      l10n: {
        name: 'Video',
        loading: 'Video player loading...',
        noPlayers: 'Found no video players that supports the given video format.',
        noSources: 'Video source is missing.',
        aborted: 'Media playback has been aborted.',
        networkFailure: 'Network failure.',
        cannotDecode: 'Unable to decode media.',
        formatNotSupported: 'Video format not supported.',
        mediaEncrypted: 'Media encrypted.',
        unknownError: 'Unknown error.',
        vimeoPasswordError: 'Password-protected Vimeo videos are not supported.',
        vimeoPrivacyError: 'The Vimeo video cannot be used due to its privacy settings.',
        vimeoLoadingError: 'The Vimeo video could not be loaded.',
        invalidYtId: 'Invalid YouTube ID.',
        unknownYtId: 'Unable to find video with the given YouTube ID.',
        restrictedYt: 'The owner of this video does not allow it to be embedded.'
      }
    });

    parameters.a11y = parameters.a11y || [];
    parameters.playback = parameters.playback || {};
    parameters.visuals = $.extend(true, parameters.visuals, {
      disableFullscreen: false
    });

    /** @private */
    var sources = [];
    if (parameters.sources) {
      for (var i = 0; i < parameters.sources.length; i++) {
        // Clone to avoid changing of parameters.
        var source = $.extend(true, {}, parameters.sources[i]);

        // Create working URL without html entities.
        source.path = $cleaner.html(source.path).text();
        sources.push(source);
      }
    }

    /** @private */
    var tracks = [];
    parameters.a11y.forEach(function (track) {
      // Clone to avoid changing of parameters.
      var clone = $.extend(true, {}, track);

      // Create working URL without html entities
      if (clone.track && clone.track.path) {
        clone.track.path = $cleaner.html(clone.track.path).text();
        tracks.push(clone);
      }
    });

    /**
     * Handle autoplay. If autoplay is disabled, it will still autopause when
     * video is not visible.
     *
     * @param {*} $container
     */
    const handleAutoPlayPause = function ($container) {
      // Keep the current state
      let state;
      self.on('stateChange', function(event) {
        state = event.data;
      });

      // Keep record of autopauses.
      // I.e: we don't wanna autoplay if the user has excplicitly paused.
      self.autoPaused = !self.pressToPlay;

      new IntersectionObserver(function (entries) {
        const entry = entries[0];

        // This video element became visible
        if (entry.isIntersecting) {
          // Autoplay if autoplay is enabled and it was not explicitly
          // paused by a user
          if (parameters.playback.autoplay && self.autoPaused) {
            self.autoPaused = false;
            self.play();
          }
        }
        else if (state !== Video.PAUSED && state !== Video.ENDED) {
          self.autoPaused = true;
          self.pause();
        }
      }, {
        root: null,
        threshold: [0, 1] // Get events when it is shown and hidden
      }).observe($container.get(0));
    };

    /**
     * Attaches the video handler to the given container.
     * Inserts text if no handler is found.
     *
     * @public
     * @param {jQuery} $container
     */
    self.attach = function ($container) {
      $container.addClass('h5p-video').html('');

      if (self.appendTo !== undefined) {
        self.appendTo($container);

        // Avoid autoplaying in authoring tool
        if (window.H5PEditor === undefined) {
          handleAutoPlayPause($container);
        }
      }
      else if (sources.length) {
        $container.text(parameters.l10n.noPlayers);
      }
      else {
        $container.text(parameters.l10n.noSources);
      }
    };

    /**
     * Get name of the video handler
     *
     * @public
     * @returns {string}
     */
    self.getHandlerName = function() {
      return handlerName;
    };

    /**
    * @public
    * Get current state for resume support.
    *
    * @returns {object} Current state.
    */
    self.getCurrentState = function () {
      if (self.getCurrentTime) {
        return {
          time: self.getCurrentTime() || self.oldTime,
        };
      }
    };

    /**
     * The two functions below needs to be defined in this base class,
     * since it is used in this class even if no handler was found.
     */
    self.seek = () => {};
    self.pause = () => {};

    /**
    * @public
    * Reset current state (time).
    *
    */
    self.resetTask = function () {
      delete self.oldTime;
      self.resetPlayback(parameters.startAt || 0);
    };

    /**
     * Default implementation of resetPlayback. May be overridden by sub classes.
     *
     * @param {*} startAt
     */
    self.resetPlayback = startAt => {
      self.seek(startAt);
      self.pause();
      self.WAS_RESET = true;
    };

    // Resize the video when we know its aspect ratio
    self.on('loaded', function () {
      self.trigger('resize');

      // reset time if wasn't done immediately
      if (self.WAS_RESET) {
        self.seek(parameters.startAt || 0);
        if (!parameters.playback.autoplay) {
          self.pause();
        }
        self.WAS_RESET = false;
      }

    });

    // Find player for video sources
    if (sources.length) {
      const options = {
        controls: parameters.visuals.controls,
        autoplay: parameters.playback.autoplay,
        loop: parameters.playback.loop,
        fit: parameters.visuals.fit,
        poster: parameters.visuals.poster === undefined ? undefined : parameters.visuals.poster,
        tracks: tracks,
        disableRemotePlayback: parameters.visuals.disableRemotePlayback === true,
        disableFullscreen: parameters.visuals.disableFullscreen === true,
        deactivateSound: parameters.playback.deactivateSound,
      }
      if (!self.WAS_RESET) {
        options.startAt = self.oldTime !== undefined ? self.oldTime : (parameters.startAt || 0);
      }

      var html5Handler;
      for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        if (handler.canPlay !== undefined && handler.canPlay(sources)) {
          handler.call(self, sources, options, parameters.l10n);
          handlerName = handler.name;
          return;
        }

        if (handler === H5P.VideoHtml5) {
          html5Handler = handler;
          handlerName = handler.name;
        }
      }

      // Fallback to trying HTML5 player
      if (html5Handler) {
        html5Handler.call(self, sources, options, parameters.l10n);
      }
    }
  }

  // Extends the event dispatcher
  Video.prototype = Object.create(H5P.EventDispatcher.prototype);
  Video.prototype.constructor = Video;

  // Player states
  /** @constant {Number} */
  Video.ENDED = 0;
  /** @constant {Number} */
  Video.PLAYING = 1;
  /** @constant {Number} */
  Video.PAUSED = 2;
  /** @constant {Number} */
  Video.BUFFERING = 3;
  /**
   * When video is queued to start
   * @constant {Number}
   */
  Video.VIDEO_CUED = 5;


  // Used to convert between html and text, since URLs have html entities.
  var $cleaner = H5P.jQuery('<div/>');

  /**
   * Help keep track of key value pairs used by the UI.
   *
   * @class
   * @param {string} label
   * @param {string} value
   */
  Video.LabelValue = function (label, value) {
    this.label = label;
    this.value = value;
  };

  /** @constant {Boolean} */
  Video.IE11_PLAYBACK_RATE_FIX = (navigator.userAgent.match(/Trident.*rv[ :]*11\./) ? true : false);

  return Video;
})(H5P.jQuery, H5P.ContentCopyrights, H5P.MediaCopyright, H5P.videoHandlers || []);
;
/**
 * Defines the H5P.ImageHotspots class
 */
H5P.ImageHotspots = (function ($, EventDispatcher) {

  /**
   * Default font size
   *
   * @constant
   * @type {number}
   * @default
   */
  var DEFAULT_FONT_SIZE = 24;

  /**
   * Creates a new Image hotspots instance
   *
   * @class
   * @augments H5P.EventDispatcher
   * @namespace H5P
   * @param {Object} options
   * @param {number} id
   */
  function ImageHotspots(options, id) {
    EventDispatcher.call(this);

    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      image: null,
      hotspots: [],
      hotspotNumberLabel: 'Hotspot #num',
      closeButtonLabel: 'Close',
      iconType: 'icon',
      icon: 'plus',
      disableScaling: true
    }, options);
    // Keep provided id.
    this.id = id;
    this.isSmallDevice = false;

    /**
     * Process HTML escaped string for use as attribute value,
     * e.g. for alt text or title attributes.
     *
     * @param {string} value
     * @return {string} WARNING! Do NOT use for innerHTML.
     */
    this.massageAttributeOutput = function (value) {
      const dparser = new DOMParser().parseFromString(value, 'text/html');
      const div = document.createElement('div');
      div.innerHTML = dparser.documentElement.textContent;;
      return div.textContent || div.innerText || '';
    };
  }

  // Extends the event dispatcher
  ImageHotspots.prototype = Object.create(EventDispatcher.prototype);
  ImageHotspots.prototype.constructor = ImageHotspots;


  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @public
   * @param {H5P.jQuery} $container
   */
  ImageHotspots.prototype.attach = function ($container) {
    var self = this;
    self.$container = $container;

    if (this.options.image === null || this.options.image === undefined) {
      $container.append('<div class="background-image-missing">Missing required background image</div>');
      return;
    }

    // Need to know since ios uses :hover when clicking on an element
    if (/(iPad|iPhone|iPod)/g.test( navigator.userAgent ) === false) {
      $container.addClass('not-an-ios-device');
    }

    $container.addClass('h5p-image-hotspots');

    this.$hotspotContainer = $('<div/>', {
      'class': 'h5p-image-hotspots-container'
    });

    if (this.options.image && this.options.image.path) {
      this.$image = $('<img/>', {
        'class': 'h5p-image-hotspots-background',
        src: H5P.getPath(this.options.image.path, this.id)
      }).appendTo(this.$hotspotContainer);

      // Set alt text of image
      if (this.options.backgroundImageAltText) {
        this.$image.attr('alt', this.massageAttributeOutput(this.options.backgroundImageAltText));
      }
      else {
        // Ignore image if no alternative text for assistive technologies
        this.$image.attr('aria-hidden', true);
      }
    }

    var isSmallDevice = function () {
      return self.isSmallDevice;
    };

    // Add hotspots
    var numHotspots = this.options.hotspots.length;
    this.hotspots = [];

    this.options.hotspots.sort(function (a, b) {
      // Sanity checks, move data to the back if invalid
      var firstIsValid = a.position && a.position.x && a.position.y;
      var secondIsValid = b.position && b.position.x && b.position.y;
      if (!firstIsValid) {
        return 1;
      }

      if (!secondIsValid) {
        return -1;
      }

      // Order top-to-bottom, left-to-right
      if (a.position.y !== b.position.y) {
        return a.position.y < b.position.y ? -1 : 1;
      }
      else {
        // a and b y position is equal, sort on x
        return a.position.x < b.position.x ? -1 : 1;
      }
    });

    for (var i=0; i<numHotspots; i++) {
      try {
        var hotspot = new ImageHotspots.Hotspot(this.options.hotspots[i], this.options, this.id, isSmallDevice, self);
        hotspot.appendTo(this.$hotspotContainer);
        var hotspotTitle = this.options.hotspots[i].header ? this.options.hotspots[i].header
          : this.options.hotspotNumberLabel.replace('#num', (i + 1).toString());
        hotspot.setTitle(hotspotTitle);
        this.hotspots.push(hotspot);
      }
      catch (e) {
        H5P.error(e);
      }
    }
    this.$hotspotContainer.appendTo($container);

    this.on('resize', self.resize, self);

    this.on('enterFullScreen', function () {
      self.fullscreenButton.tabIndex = -1;
      // Resize image when entering fullscreen.
      setTimeout(function () {
        self.trigger('resize');

        // Trap focus
        self.toggleTrapFocus(true);
      });
    });

    this.on('exitFullScreen', function () {
      self.fullscreenButton.tabIndex = 0;
      // Do not rely on that isFullscreen has been updated
      self.trigger('resize', {forceImageHeight: true});
      self.toggleTrapFocus(false);
    });

    self.resize();
  };

  ImageHotspots.prototype.setShowingPopup = function (visible) {
    this.$container.toggleClass('showing-popup', visible);
  };

  /**
   * Toggle trap focus between hotspots
   *
   * @param {boolean} enable True to enable, otherwise will be released
   */
  ImageHotspots.prototype.toggleTrapFocus = function (enable) {
    if (this.hotspots.length < 1) {
      return;
    }
    if (enable) {
      // focus first hotspot
      this.hotspots[0].focus();

      // Trap focus
      if (this.hotspots.length > 1) {
        this.hotspots[this.hotspots.length - 1].setTrapFocusTo(this.hotspots[0]);
        this.hotspots[0].setTrapFocusTo(this.hotspots[this.hotspots.length - 1], true);
      }
    }
    else {
      // Untrap focus
      this.hotspots[this.hotspots.length - 1].releaseTrapFocus();
      this.hotspots[0].releaseTrapFocus();
    }
  };

  /**
   * Handle resizing
   * @private
   * @param {Event} [e]
   * @param {boolean} [e.forceImageHeight]
   * @param {boolean} [e.decreaseSize]
   */
  ImageHotspots.prototype.resize = function (e) {
    if (this.options.image === null) {
      return;
    }

    var self = this;
    self.fullscreenButton = document.querySelector('.h5p-enable-fullscreen');
    var containerWidth = self.$container.width();
    var containerHeight = self.$container.height();
    var width = containerWidth;
    var height = Math.floor((width/self.options.image.width) * self.options.image.height);
    var forceImageHeight = e && e.data && e.data.forceImageHeight;

    // Check if decreasing iframe size
    var decreaseSize = e && e.data && e.data.decreaseSize;
    if (!decreaseSize) {
      self.$container.css('width', '');
    }
    
    // If fullscreen & standalone 
    if (this.isRoot() && H5P.isFullscreen) {
      // If fullscreen, we have both a max width and max height.
      if (!forceImageHeight && height > containerHeight) {
        height = containerHeight;
        width = Math.floor((height/self.options.image.height) * self.options.image.width);
      }

      // Check if we need to apply semi full screen fix.
      if (self.$container.is('.h5p-semi-fullscreen')) {

        // Reset semi fullscreen width
        self.$container.css('width', '');

        // Decrease iframe size
        if (!decreaseSize) {
          self.$hotspotContainer.css('width', '10px');
          self.$image.css('width', '10px');

          // Trigger changes
          setTimeout(function () {
            self.trigger('resize', {decreaseSize: true});
          }, 200);
        }

        // Set width equal to iframe parent width, since iframe content has not been updated yet.
        var $iframe = $(window.frameElement);
        if ($iframe) {
          var $iframeParent = $iframe.parent();
          width = $iframeParent.width();
          self.$container.css('width', width + 'px');
        }
      }
    }

    self.$image.css({
      width: width + 'px',
      height: height + 'px'
    });

    if (!self.initialWidth) {
      self.initialWidth = self.$container.width();
    }

    self.fontSize = this.options.disableScaling ? DEFAULT_FONT_SIZE : Math.max(DEFAULT_FONT_SIZE, (DEFAULT_FONT_SIZE * (width/self.initialWidth)));

    self.$hotspotContainer.css({
      width: width + 'px',
      height: height + 'px',
      fontSize: self.fontSize + 'px'
    });

    self.isSmallDevice = (containerWidth / parseFloat($("body").css("font-size")) < 40);
  };

  ImageHotspots.prototype.pause = function() {
    this.hotspots.forEach(function(hotspot) {
      if (hotspot.pause) {
        hotspot.pause();
      }
    });
  };

  return ImageHotspots;
})(H5P.jQuery, H5P.EventDispatcher);
;
/**
 * Defines the ImageHotspots.Hotspot class
 */
(function ($, ImageHotspots) {

  /**
   * Creates a new Hotspot
   *
   * @class
   * @namespace H5P.ImageHotspots
   * @param  {Object} config
   * @param  {Object} options
   * @param  {number} id
   * @param  {boolean} isSmallDeviceCB
   * @param  {H5P.ImageHotspots} parent
   */
  ImageHotspots.Hotspot = function (config, options, id, isSmallDeviceCB, parent) {
    var self = this;
    this.config = config;
    this.visible = false;
    this.id = id;
    this.isSmallDeviceCB = isSmallDeviceCB;
    this.options = options;
    this.parent = parent;

    // A utility variable to check if a Predefined icon or an uploaded image should be used.
    var iconImageExists = (options.iconImage !== undefined && options.iconType === 'image');

    if (this.config.content === undefined  || this.config.content.length === 0) {
      throw new Error('Missing content configuration for hotspot. Please fix in editor.');
    }

    // Check if there is an iconImage that should be used instead of fontawesome icons to determine the html element.
    this.$element = $(iconImageExists ? '<img/>' : '<button/>', {
      'class': 'h5p-image-hotspot ' + 
        (!iconImageExists ? 'h5p-image-hotspot-' + options.icon : '') +
        (config.position.legacyPositioning ? ' legacy-positioning' : ''),  
      'role': 'button',
      'tabindex': 0,
      'aria-haspopup': true,
      src: iconImageExists ? H5P.getPath(options.iconImage.path, this.id) : undefined,
      click: function () {
        // prevents duplicates while loading
        if (self.loadingPopup) {
          return false;
        }

        if (self.visible) {
          self.hidePopup();
        }
        else {
          self.showPopup(true);
        }
        return false;
      },
      keydown: function (e) {
        if (e.which === 32 || e.which === 13) {
          // Prevent duplicates while loading
          if (self.loadingPopup) {
            return false;
          }

          if (self.visible) {
            self.hidePopup();
          }
          else {
            self.showPopup(true);
          }
          e.stopPropagation();
          return false;
        }
      }
    });
    
    this.$element.css({
      top: this.config.position.y + '%',
      left: this.config.position.x + '%',
      color: options.color,
      backgroundColor: options.backgroundColor ? options.backgroundColor : ''
    });

    parent.on('resize', function () {
      if (self.popup) {

        self.actionInstances.forEach(function (actionInstance) {
          if (actionInstance.trigger !== undefined) {

            // The reason for this timeout is fullscreen on chrome on android
            setTimeout(function () {
              actionInstance.trigger('resize');
            }, 1);
          }
        });
      }
    });
  };

  /**
   * Append the hotspot to a container
   * @public
   * @param {H5P.jQuery} $container
   */
  ImageHotspots.Hotspot.prototype.appendTo = function ($container) {
    this.$container = $container;
    this.$element.appendTo($container);
  };

  /**
   * Display the popup
   * @param {boolean} [focusPopup] Focuses popup for keyboard accessibility
   */
  ImageHotspots.Hotspot.prototype.showPopup = function (focusPopup) {
    var self = this;

    // Create popup content:
    var $popupBody = $('<div/>', {'class': 'h5p-image-hotspot-popup-body'});
    self.loadingPopup = true;

    this.parent.setShowingPopup(true);

    this.actionInstances = [];
    var waitForLoaded = [];
    this.config.content.forEach(function (action) {
      var $popupFraction = $('<div>', {
        'class': 'h5p-image-hotspot-popup-body-fraction',
        appendTo: $popupBody
      });

      // Enforce autoplay for transparent audios
      if (action.library.split(' ')[0] === 'H5P.Audio') {
        if (action.params.playerMode === 'transparent') {
          action.params.autoplay = true;
        }
      }

      var actionInstance = H5P.newRunnable(action, self.id);

      self.actionInstances.push(actionInstance);
      if (actionInstance.libraryInfo.machineName === 'H5P.Image' || actionInstance.libraryInfo.machineName === 'H5P.Video') {
        waitForLoaded.push(actionInstance);
      }
      actionInstance.attach($popupFraction);

      if (actionInstance.libraryInfo.machineName === 'H5P.Audio') {
        if (actionInstance.audio && actionInstance.params.playerMode === 'full' && !!window.chrome) {
          // Workaround for missing https://github.com/h5p/h5p-audio/pull/48
          actionInstance.audio.style.height = '54px';
        }
        else if (actionInstance.$audioButton && actionInstance.params.playerMode === 'transparent') {
          // Completely hide transparent button
          actionInstance.$audioButton.css({ height: 0, padding: 0 });
        }
      }

      // Stop screenreader to read fullscreen button
      if (self.parent.fullscreenButton) {
        self.parent.fullscreenButton.tabIndex = -1;
      }
    });

    var readyToPopup = function () {
      // Disable all hotspots
      self.toggleHotspotsTabindex(true);
      self.visible = true;
      self.popup.show(focusPopup);
      self.$element.addClass('active');
      self.actionInstances.forEach(function (actionInstance) {
        actionInstance.trigger('resize');
      });
    };

    // Popup style
    var popupClass = 'h5p-video';
    if (!waitForLoaded.length) {
      popupClass = 'h5p-text';
    }
    else if (self.actionInstances.length === 1 && self.actionInstances[0].libraryInfo.machineName === 'H5P.Image') {
      popupClass = 'h5p-image';
    }

    // Create Image hot-spots popup
    self.popup = new ImageHotspots.Popup(
      self.$container, $popupBody,
      self.config.position.x,
      self.config.position.y,
      self.$element.outerWidth(),
      self.config.header,
      popupClass,
      self.config.alwaysFullscreen || self.isSmallDeviceCB(),
      self.options,
      self.config.position.legacyPositioning
    );

    self.parent.on('resize', function () {
      if (self.visible) {
        self.popup.resize();
      }
    });

    // Release
    self.popup.on('closed', function (e) {
      self.hidePopup();

      // Refocus hotspot
      if (e.data && e.data.refocus) {
        self.focus();
      }
    });

    // Finished loading popup
    self.popup.on('finishedLoading', function () {
      self.loadingPopup = false;
    });

    if (waitForLoaded.length) {
      var loaded = 0;

      // Wait for libraries to load before showing popup
      waitForLoaded.forEach(function (unloaded) {

        // Signal that library has finished loading
        var fire = function () {
          clearTimeout(timeout);
          unloaded.off('loaded', fire);
          loaded += 1;

          if (loaded >= waitForLoaded.length) {
            setTimeout(function () {
              readyToPopup();
            }, 100);
          }
        };

        // Add timer fallback if loaded event is not triggered
        var timeout = setTimeout(fire, 1000);
        unloaded.on('loaded', fire, {unloaded: unloaded, timeout: timeout});
        unloaded.trigger('resize');
      });

    }
    else {
      setTimeout(function () {
        readyToPopup();
      }, 100);
    }

    // We don't get click events on body for iOS-devices
    $('body').children().on('click.h5p-image-hotspot-popup', function (event) {
      var $target = $(event.target);
      if (self.visible && !$target.hasClass('h5p-enable-fullscreen') && !$target.hasClass('h5p-disable-fullscreen')
        && event.target.id === 'h5p-image-hotspots-overlay') {
        self.hidePopup();
      }
    });
  };

  /**
   * Toggle whether hotspots has tabindex
   * @param {boolean} [disable] Disable tabindex if true
   */
  ImageHotspots.Hotspot.prototype.toggleHotspotsTabindex = function (disable) {
    this.$container.find('.h5p-image-hotspot')
      .attr('tabindex', disable ? '-1' : '0')
      .attr('aria-hidden', disable ? true : '');
  };

  /**
   * Hide popup
   * @public
   */
  ImageHotspots.Hotspot.prototype.hidePopup = function () {
    if (this.popup) {
      // We don't get click events on body for iOS-devices
      $('body').children().off('click.h5p-image-hotspot-popup');

      this.pause();
      this.popup.hide();
      this.$element.removeClass('active');
      this.visible = false;
      this.popup = undefined;
      this.toggleHotspotsTabindex();
    }

    this.parent.setShowingPopup(false);

    // Make fullscreen button focusable again
    if (this.parent.fullscreenButton) {
      this.parent.fullscreenButton.tabIndex = 0;
    }
  };

  /**
   * Focus hotspot
   */
  ImageHotspots.Hotspot.prototype.focus = function () {
    this.$element.focus();
  };

  /**
   * Set up trapping of focus
   *
   * @param {ImageHotspots.Hotspot} hotspot Hotspot that focus should be trapped to
   * @param {boolean} [trapReverseTab] Traps when tabbing backwards
   */
  ImageHotspots.Hotspot.prototype.setTrapFocusTo = function (hotspot, trapReverseTab) {
    this.$element.on('keydown.trapfocus', function (e) {
      var keyCombination = e.which === 9 && (trapReverseTab ? e.shiftKey : !e.shiftKey);
      if (keyCombination) {
        hotspot.focus();
        e.stopPropagation();
        return false;
      }
    });
  };

  /**
   * Release trap focus from hotspot
   */
  ImageHotspots.Hotspot.prototype.releaseTrapFocus = function () {
    this.$element.off('keydown.trapfocus');
  };

  /**
   * Set title of hotspot element
   * @param {string} title Title to set for hotspot element
   */
  ImageHotspots.Hotspot.prototype.setTitle = function (title) {
    this.$element.attr('title', title);
    this.$element.attr('aria-label', title);
  };

  ImageHotspots.Hotspot.prototype.pause = function () {
    if (this.actionInstances) {
      this.actionInstances.forEach(function(actionInstance) {
        if (actionInstance.audio && 
            (actionInstance.audio.pause instanceof Function ||
            typeof actionInstance.audio.pause === 'function')) {
          actionInstance.audio.pause();
        }
      });
    };
  };

})(H5P.jQuery, H5P.ImageHotspots);
;
/**
 * Defines the ImageHotspots.Popup class
 */
(function ($, ImageHotspots, EventDispatcher) {

  /**
   * Creates new Popup instance
   *
   * @class
   * @namespace H5P.ImageHotspots
   * @param {H5P.jQuery} $container
   * @param {H5P.jQuery} $content
   * @param {number} x
   * @param {number} y
   * @param {number} hotspotWidth
   * @param {string} header
   * @param {string} className
   * @param {boolean} fullscreen
   * @param {Object} options
   *
   */
  ImageHotspots.Popup = function ($container, $content, x, y, hotspotWidth, header, className, fullscreen, options, legacy) {
    EventDispatcher.call(this);

    var self = this;
    this.$container = $container;
    var width = this.$container.width();
    var height = this.$container.height();

    var pointerWidthInPercent = 1.55;
    hotspotWidth = (hotspotWidth/width)*100;

    var popupLeft = 0;
    var popupWidth = 0;
    var toTheLeft = false;

    if (fullscreen) {
      popupWidth = 100;
      className += ' fullscreen-popup';
    }
    else {
      toTheLeft = (x > 50);
      popupLeft = (toTheLeft ? 0 : (x + hotspotWidth + pointerWidthInPercent));
      popupWidth = (toTheLeft ?  (x - hotspotWidth - pointerWidthInPercent) : 100 - popupLeft);
    }

    this.$popupBackground = $('<div/>', {
      'class': 'h5p-image-hotspots-overlay',
      'id': 'h5p-image-hotspots-overlay'
    });

    this.$popup = $('<div/>', {
      'class': 'h5p-image-hotspot-popup ' + className,
      'tabindex': '0',
      'role': 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': header ? 'h5p-image-hotspot-popup-header' : undefined,
    }).css({
      left: (toTheLeft ? '' : '-') + '100%',
      width: popupWidth + '%'
    }).appendTo(this.$popupBackground);

    this.$popupContent = $('<div/>', {
      'class': 'h5p-image-hotspot-popup-content',
      on: {
        scroll: function () {
          $(this).addClass('has-scrolled');
        }
      }
    });
    if (header) {
      this.$popupHeader = $('<div/>', {
        'class': 'h5p-image-hotspot-popup-header',
        'id': 'h5p-image-hotspot-popup-header',
        html: header,
        'tabindex': '-1',
        'aria-hidden': 'true'
      });
      this.$popupContent.append(this.$popupHeader);
      this.$popup.addClass('h5p-image-hotspot-has-header');
    }
    $content.appendTo(this.$popupContent);
    this.$popupContent.appendTo(this.$popup);

    // Add close button
    this.$closeButton = $('<button>', {
      'class': 'h5p-image-hotspot-close-popup-button',
      'aria-label': options.closeButtonLabel,
      'title': options.closeButtonLabel
    }).click(function () {
      self.trigger('closed');
    }).keydown(function (e) {
      if (e.which === 32 || e.which === 13) {
        self.trigger('closed', {refocus: true});
        return false;
      }
    }).appendTo(this.$popup);

    if (!header) {
      self.$popupContent.addClass('h5p-image-hotspot-popup-content-no-header');
    }

    // Need to add pointer to parent container, since this should be partly covered
    // by the popup
    if (!fullscreen) {
      this.$pointer = $('<div/>', {
        'class': 'h5p-image-hotspot-popup-pointer to-the-' + (toTheLeft ? 'left' : 'right') + (legacy ? ' legacy-positioning' : ''),
      }).css({
        top: y + '%',
      }).appendTo(this.$popupBackground);
    }

    this.$popupBackground.appendTo(this.$container);

    self.resize = function () {
      if (fullscreen) {
        return;
      }

      // Reset 
      self.$popup.css({
        maxHeight: '',
        height: ''
      });
      self.$popupContent.css({
        height: ''
      });

      height = this.$container.height();
      var contentHeight = self.$popupContent.outerHeight();
      var parentHeight = self.$popup.outerHeight();

      var fitsWithin = contentHeight < height;

      if (fitsWithin) {
        // don't need all height:
        self.$popup.css({
          maxHeight: 'auto',
          height: 'auto'
        });

        // find new top:
        var top = Math.max(0, ((y / 100) * parentHeight) - (contentHeight / 2));

        // Check if we need to move it a bit up (in case it overflows)
        if (top + contentHeight > parentHeight) {
          top = parentHeight - contentHeight;
        }

        // From pixels to percent:
        self.$popup.css({
          top: (top / parentHeight) * 100 + '%'
        });
      }

      self.$popupContent.css({
        height: fitsWithin ? '' : '100%',
        overflow: fitsWithin ? '' : 'auto'
      }).toggleClass('overflowing', !fitsWithin);

      self.$popup.toggleClass('popup-overflowing', !fitsWithin);
    };

    /**
     * Show popup
     * @param {boolean} [focusContainer] Will focus container for keyboard accessibility
     */
    self.show = function (focusContainer) {

      if (!fullscreen) {

        self.resize();

        // Need to move pointer:
        self.$pointer.css({
          left: toTheLeft ? (
            popupWidth + '%'
          ) : (
            popupLeft + '%'
          )
        });
      }

      self.$popup.css({
        left: popupLeft + '%'
      });
      self.$popupBackground.addClass('visible');
      self.$popup.focus();

      H5P.Transition.onTransitionEnd(self.$popup, function () {
        if (focusContainer) {
          if (self.$popupHeader) {
            self.$popupHeader.focus();
          }
          else {
            self.$closeButton.focus();
          }
        }

        // Show pointer;
        if (self.$pointer) {
          self.$pointer.addClass('visible');
        }
        self.trigger('finishedLoading');
      }, 300);
    };

    self.hide = function () {
      self.$popupBackground.remove();
    };
  };

  // Extends the event dispatcher
  ImageHotspots.Popup.prototype = Object.create(EventDispatcher.prototype);
  ImageHotspots.Popup.prototype.constructor = ImageHotspots.Popup;

})(H5P.jQuery, H5P.ImageHotspots, H5P.EventDispatcher);
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
/*! For license information please see h5p-game-map.js.LICENSE.txt */
!function(){var e={156:function(e){"use strict";e.exports={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]}},854:function(e,t,i){var a=i(156),s=i(872),r=Object.hasOwnProperty,n=Object.create(null);for(var o in a)r.call(a,o)&&(n[a[o]]=o);var l=e.exports={to:{},get:{}};function c(e,t,i){return Math.min(Math.max(t,e),i)}function u(e){var t=Math.round(e).toString(16).toUpperCase();return t.length<2?"0"+t:t}l.get=function(e){var t,i;switch(e.substring(0,3).toLowerCase()){case"hsl":t=l.get.hsl(e),i="hsl";break;case"hwb":t=l.get.hwb(e),i="hwb";break;default:t=l.get.rgb(e),i="rgb"}return t?{model:i,value:t}:null},l.get.rgb=function(e){if(!e)return null;var t,i,s,n=[0,0,0,1];if(t=e.match(/^#([a-f0-9]{6})([a-f0-9]{2})?$/i)){for(s=t[2],t=t[1],i=0;i<3;i++){var o=2*i;n[i]=parseInt(t.slice(o,o+2),16)}s&&(n[3]=parseInt(s,16)/255)}else if(t=e.match(/^#([a-f0-9]{3,4})$/i)){for(s=(t=t[1])[3],i=0;i<3;i++)n[i]=parseInt(t[i]+t[i],16);s&&(n[3]=parseInt(s+s,16)/255)}else if(t=e.match(/^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/)){for(i=0;i<3;i++)n[i]=parseInt(t[i+1],0);t[4]&&(t[5]?n[3]=.01*parseFloat(t[4]):n[3]=parseFloat(t[4]))}else{if(!(t=e.match(/^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/)))return(t=e.match(/^(\w+)$/))?"transparent"===t[1]?[0,0,0,0]:r.call(a,t[1])?((n=a[t[1]])[3]=1,n):null:null;for(i=0;i<3;i++)n[i]=Math.round(2.55*parseFloat(t[i+1]));t[4]&&(t[5]?n[3]=.01*parseFloat(t[4]):n[3]=parseFloat(t[4]))}for(i=0;i<3;i++)n[i]=c(n[i],0,255);return n[3]=c(n[3],0,1),n},l.get.hsl=function(e){if(!e)return null;var t=e.match(/^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/);if(t){var i=parseFloat(t[4]);return[(parseFloat(t[1])%360+360)%360,c(parseFloat(t[2]),0,100),c(parseFloat(t[3]),0,100),c(isNaN(i)?1:i,0,1)]}return null},l.get.hwb=function(e){if(!e)return null;var t=e.match(/^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/);if(t){var i=parseFloat(t[4]);return[(parseFloat(t[1])%360+360)%360,c(parseFloat(t[2]),0,100),c(parseFloat(t[3]),0,100),c(isNaN(i)?1:i,0,1)]}return null},l.to.hex=function(){var e=s(arguments);return"#"+u(e[0])+u(e[1])+u(e[2])+(e[3]<1?u(Math.round(255*e[3])):"")},l.to.rgb=function(){var e=s(arguments);return e.length<4||1===e[3]?"rgb("+Math.round(e[0])+", "+Math.round(e[1])+", "+Math.round(e[2])+")":"rgba("+Math.round(e[0])+", "+Math.round(e[1])+", "+Math.round(e[2])+", "+e[3]+")"},l.to.rgb.percent=function(){var e=s(arguments),t=Math.round(e[0]/255*100),i=Math.round(e[1]/255*100),a=Math.round(e[2]/255*100);return e.length<4||1===e[3]?"rgb("+t+"%, "+i+"%, "+a+"%)":"rgba("+t+"%, "+i+"%, "+a+"%, "+e[3]+")"},l.to.hsl=function(){var e=s(arguments);return e.length<4||1===e[3]?"hsl("+e[0]+", "+e[1]+"%, "+e[2]+"%)":"hsla("+e[0]+", "+e[1]+"%, "+e[2]+"%, "+e[3]+")"},l.to.hwb=function(){var e=s(arguments),t="";return e.length>=4&&1!==e[3]&&(t=", "+e[3]),"hwb("+e[0]+", "+e[1]+"%, "+e[2]+"%"+t+")"},l.to.keyword=function(e){return n[e.slice(0,3)]}},520:function(e,t,i){const a=i(854),s=i(137),r=["keyword","gray","hex"],n={};for(const e of Object.keys(s))n[[...s[e].labels].sort().join("")]=e;const o={};function l(e,t){if(!(this instanceof l))return new l(e,t);if(t&&t in r&&(t=null),t&&!(t in s))throw new Error("Unknown model: "+t);let i,c;if(null==e)this.model="rgb",this.color=[0,0,0],this.valpha=1;else if(e instanceof l)this.model=e.model,this.color=[...e.color],this.valpha=e.valpha;else if("string"==typeof e){const t=a.get(e);if(null===t)throw new Error("Unable to parse color from string: "+e);this.model=t.model,c=s[this.model].channels,this.color=t.value.slice(0,c),this.valpha="number"==typeof t.value[c]?t.value[c]:1}else if(e.length>0){this.model=t||"rgb",c=s[this.model].channels;const i=Array.prototype.slice.call(e,0,c);this.color=d(i,c),this.valpha="number"==typeof e[c]?e[c]:1}else if("number"==typeof e)this.model="rgb",this.color=[e>>16&255,e>>8&255,255&e],this.valpha=1;else{this.valpha=1;const t=Object.keys(e);"alpha"in e&&(t.splice(t.indexOf("alpha"),1),this.valpha="number"==typeof e.alpha?e.alpha:0);const a=t.sort().join("");if(!(a in n))throw new Error("Unable to parse color from object: "+JSON.stringify(e));this.model=n[a];const{labels:r}=s[this.model],o=[];for(i=0;i<r.length;i++)o.push(e[r[i]]);this.color=d(o)}if(o[this.model])for(c=s[this.model].channels,i=0;i<c;i++){const e=o[this.model][i];e&&(this.color[i]=e(this.color[i]))}this.valpha=Math.max(0,Math.min(1,this.valpha)),Object.freeze&&Object.freeze(this)}l.prototype={toString(){return this.string()},toJSON(){return this[this.model]()},string(e){let t=this.model in a.to?this:this.rgb();t=t.round("number"==typeof e?e:1);const i=1===t.valpha?t.color:[...t.color,this.valpha];return a.to[t.model](i)},percentString(e){const t=this.rgb().round("number"==typeof e?e:1),i=1===t.valpha?t.color:[...t.color,this.valpha];return a.to.rgb.percent(i)},array(){return 1===this.valpha?[...this.color]:[...this.color,this.valpha]},object(){const e={},{channels:t}=s[this.model],{labels:i}=s[this.model];for(let a=0;a<t;a++)e[i[a]]=this.color[a];return 1!==this.valpha&&(e.alpha=this.valpha),e},unitArray(){const e=this.rgb().color;return e[0]/=255,e[1]/=255,e[2]/=255,1!==this.valpha&&e.push(this.valpha),e},unitObject(){const e=this.rgb().object();return e.r/=255,e.g/=255,e.b/=255,1!==this.valpha&&(e.alpha=this.valpha),e},round(e){return e=Math.max(e||0,0),new l([...this.color.map(c(e)),this.valpha],this.model)},alpha(e){return void 0!==e?new l([...this.color,Math.max(0,Math.min(1,e))],this.model):this.valpha},red:u("rgb",0,h(255)),green:u("rgb",1,h(255)),blue:u("rgb",2,h(255)),hue:u(["hsl","hsv","hsl","hwb","hcg"],0,(e=>(e%360+360)%360)),saturationl:u("hsl",1,h(100)),lightness:u("hsl",2,h(100)),saturationv:u("hsv",1,h(100)),value:u("hsv",2,h(100)),chroma:u("hcg",1,h(100)),gray:u("hcg",2,h(100)),white:u("hwb",1,h(100)),wblack:u("hwb",2,h(100)),cyan:u("cmyk",0,h(100)),magenta:u("cmyk",1,h(100)),yellow:u("cmyk",2,h(100)),black:u("cmyk",3,h(100)),x:u("xyz",0,h(95.047)),y:u("xyz",1,h(100)),z:u("xyz",2,h(108.833)),l:u("lab",0,h(100)),a:u("lab",1),b:u("lab",2),keyword(e){return void 0!==e?new l(e):s[this.model].keyword(this.color)},hex(e){return void 0!==e?new l(e):a.to.hex(this.rgb().round().color)},hexa(e){if(void 0!==e)return new l(e);const t=this.rgb().round().color;let i=Math.round(255*this.valpha).toString(16).toUpperCase();return 1===i.length&&(i="0"+i),a.to.hex(t)+i},rgbNumber(){const e=this.rgb().color;return(255&e[0])<<16|(255&e[1])<<8|255&e[2]},luminosity(){const e=this.rgb().color,t=[];for(const[i,a]of e.entries()){const e=a/255;t[i]=e<=.04045?e/12.92:((e+.055)/1.055)**2.4}return.2126*t[0]+.7152*t[1]+.0722*t[2]},contrast(e){const t=this.luminosity(),i=e.luminosity();return t>i?(t+.05)/(i+.05):(i+.05)/(t+.05)},level(e){const t=this.contrast(e);return t>=7?"AAA":t>=4.5?"AA":""},isDark(){const e=this.rgb().color;return(2126*e[0]+7152*e[1]+722*e[2])/1e4<128},isLight(){return!this.isDark()},negate(){const e=this.rgb();for(let t=0;t<3;t++)e.color[t]=255-e.color[t];return e},lighten(e){const t=this.hsl();return t.color[2]+=t.color[2]*e,t},darken(e){const t=this.hsl();return t.color[2]-=t.color[2]*e,t},saturate(e){const t=this.hsl();return t.color[1]+=t.color[1]*e,t},desaturate(e){const t=this.hsl();return t.color[1]-=t.color[1]*e,t},whiten(e){const t=this.hwb();return t.color[1]+=t.color[1]*e,t},blacken(e){const t=this.hwb();return t.color[2]+=t.color[2]*e,t},grayscale(){const e=this.rgb().color,t=.3*e[0]+.59*e[1]+.11*e[2];return l.rgb(t,t,t)},fade(e){return this.alpha(this.valpha-this.valpha*e)},opaquer(e){return this.alpha(this.valpha+this.valpha*e)},rotate(e){const t=this.hsl();let i=t.color[0];return i=(i+e)%360,i=i<0?360+i:i,t.color[0]=i,t},mix(e,t){if(!e||!e.rgb)throw new Error('Argument to "mix" was not a Color instance, but rather an instance of '+typeof e);const i=e.rgb(),a=this.rgb(),s=void 0===t?.5:t,r=2*s-1,n=i.alpha()-a.alpha(),o=((r*n==-1?r:(r+n)/(1+r*n))+1)/2,c=1-o;return l.rgb(o*i.red()+c*a.red(),o*i.green()+c*a.green(),o*i.blue()+c*a.blue(),i.alpha()*s+a.alpha()*(1-s))}};for(const e of Object.keys(s)){if(r.includes(e))continue;const{channels:t}=s[e];l.prototype[e]=function(...t){return this.model===e?new l(this):t.length>0?new l(t,e):new l([...(i=s[this.model][e].raw(this.color),Array.isArray(i)?i:[i]),this.valpha],e);var i},l[e]=function(...i){let a=i[0];return"number"==typeof a&&(a=d(i,t)),new l(a,e)}}function c(e){return function(t){return function(e,t){return Number(e.toFixed(t))}(t,e)}}function u(e,t,i){e=Array.isArray(e)?e:[e];for(const a of e)(o[a]||(o[a]=[]))[t]=i;return e=e[0],function(a){let s;return void 0!==a?(i&&(a=i(a)),s=this[e](),s.color[t]=a,s):(s=this[e]().color[t],i&&(s=i(s)),s)}}function h(e){return function(t){return Math.max(0,Math.min(e,t))}}function d(e,t){for(let i=0;i<t;i++)"number"!=typeof e[i]&&(e[i]=0);return e}e.exports=l},920:function(e,t,i){const a=i(993),s={};for(const e of Object.keys(a))s[a[e]]=e;const r={rgb:{channels:3,labels:"rgb"},hsl:{channels:3,labels:"hsl"},hsv:{channels:3,labels:"hsv"},hwb:{channels:3,labels:"hwb"},cmyk:{channels:4,labels:"cmyk"},xyz:{channels:3,labels:"xyz"},lab:{channels:3,labels:"lab"},lch:{channels:3,labels:"lch"},hex:{channels:1,labels:["hex"]},keyword:{channels:1,labels:["keyword"]},ansi16:{channels:1,labels:["ansi16"]},ansi256:{channels:1,labels:["ansi256"]},hcg:{channels:3,labels:["h","c","g"]},apple:{channels:3,labels:["r16","g16","b16"]},gray:{channels:1,labels:["gray"]}};e.exports=r;for(const e of Object.keys(r)){if(!("channels"in r[e]))throw new Error("missing channels property: "+e);if(!("labels"in r[e]))throw new Error("missing channel labels property: "+e);if(r[e].labels.length!==r[e].channels)throw new Error("channel and label counts mismatch: "+e);const{channels:t,labels:i}=r[e];delete r[e].channels,delete r[e].labels,Object.defineProperty(r[e],"channels",{value:t}),Object.defineProperty(r[e],"labels",{value:i})}r.rgb.hsl=function(e){const t=e[0]/255,i=e[1]/255,a=e[2]/255,s=Math.min(t,i,a),r=Math.max(t,i,a),n=r-s;let o,l;r===s?o=0:t===r?o=(i-a)/n:i===r?o=2+(a-t)/n:a===r&&(o=4+(t-i)/n),o=Math.min(60*o,360),o<0&&(o+=360);const c=(s+r)/2;return l=r===s?0:c<=.5?n/(r+s):n/(2-r-s),[o,100*l,100*c]},r.rgb.hsv=function(e){let t,i,a,s,r;const n=e[0]/255,o=e[1]/255,l=e[2]/255,c=Math.max(n,o,l),u=c-Math.min(n,o,l),h=function(e){return(c-e)/6/u+.5};return 0===u?(s=0,r=0):(r=u/c,t=h(n),i=h(o),a=h(l),n===c?s=a-i:o===c?s=1/3+t-a:l===c&&(s=2/3+i-t),s<0?s+=1:s>1&&(s-=1)),[360*s,100*r,100*c]},r.rgb.hwb=function(e){const t=e[0],i=e[1];let a=e[2];const s=r.rgb.hsl(e)[0],n=1/255*Math.min(t,Math.min(i,a));return a=1-1/255*Math.max(t,Math.max(i,a)),[s,100*n,100*a]},r.rgb.cmyk=function(e){const t=e[0]/255,i=e[1]/255,a=e[2]/255,s=Math.min(1-t,1-i,1-a);return[100*((1-t-s)/(1-s)||0),100*((1-i-s)/(1-s)||0),100*((1-a-s)/(1-s)||0),100*s]},r.rgb.keyword=function(e){const t=s[e];if(t)return t;let i,r=1/0;for(const t of Object.keys(a)){const s=a[t],l=(o=s,((n=e)[0]-o[0])**2+(n[1]-o[1])**2+(n[2]-o[2])**2);l<r&&(r=l,i=t)}var n,o;return i},r.keyword.rgb=function(e){return a[e]},r.rgb.xyz=function(e){let t=e[0]/255,i=e[1]/255,a=e[2]/255;t=t>.04045?((t+.055)/1.055)**2.4:t/12.92,i=i>.04045?((i+.055)/1.055)**2.4:i/12.92,a=a>.04045?((a+.055)/1.055)**2.4:a/12.92;return[100*(.4124*t+.3576*i+.1805*a),100*(.2126*t+.7152*i+.0722*a),100*(.0193*t+.1192*i+.9505*a)]},r.rgb.lab=function(e){const t=r.rgb.xyz(e);let i=t[0],a=t[1],s=t[2];i/=95.047,a/=100,s/=108.883,i=i>.008856?i**(1/3):7.787*i+16/116,a=a>.008856?a**(1/3):7.787*a+16/116,s=s>.008856?s**(1/3):7.787*s+16/116;return[116*a-16,500*(i-a),200*(a-s)]},r.hsl.rgb=function(e){const t=e[0]/360,i=e[1]/100,a=e[2]/100;let s,r,n;if(0===i)return n=255*a,[n,n,n];s=a<.5?a*(1+i):a+i-a*i;const o=2*a-s,l=[0,0,0];for(let e=0;e<3;e++)r=t+1/3*-(e-1),r<0&&r++,r>1&&r--,n=6*r<1?o+6*(s-o)*r:2*r<1?s:3*r<2?o+(s-o)*(2/3-r)*6:o,l[e]=255*n;return l},r.hsl.hsv=function(e){const t=e[0];let i=e[1]/100,a=e[2]/100,s=i;const r=Math.max(a,.01);a*=2,i*=a<=1?a:2-a,s*=r<=1?r:2-r;return[t,100*(0===a?2*s/(r+s):2*i/(a+i)),100*((a+i)/2)]},r.hsv.rgb=function(e){const t=e[0]/60,i=e[1]/100;let a=e[2]/100;const s=Math.floor(t)%6,r=t-Math.floor(t),n=255*a*(1-i),o=255*a*(1-i*r),l=255*a*(1-i*(1-r));switch(a*=255,s){case 0:return[a,l,n];case 1:return[o,a,n];case 2:return[n,a,l];case 3:return[n,o,a];case 4:return[l,n,a];case 5:return[a,n,o]}},r.hsv.hsl=function(e){const t=e[0],i=e[1]/100,a=e[2]/100,s=Math.max(a,.01);let r,n;n=(2-i)*a;const o=(2-i)*s;return r=i*s,r/=o<=1?o:2-o,r=r||0,n/=2,[t,100*r,100*n]},r.hwb.rgb=function(e){const t=e[0]/360;let i=e[1]/100,a=e[2]/100;const s=i+a;let r;s>1&&(i/=s,a/=s);const n=Math.floor(6*t),o=1-a;r=6*t-n,0!=(1&n)&&(r=1-r);const l=i+r*(o-i);let c,u,h;switch(n){default:case 6:case 0:c=o,u=l,h=i;break;case 1:c=l,u=o,h=i;break;case 2:c=i,u=o,h=l;break;case 3:c=i,u=l,h=o;break;case 4:c=l,u=i,h=o;break;case 5:c=o,u=i,h=l}return[255*c,255*u,255*h]},r.cmyk.rgb=function(e){const t=e[0]/100,i=e[1]/100,a=e[2]/100,s=e[3]/100;return[255*(1-Math.min(1,t*(1-s)+s)),255*(1-Math.min(1,i*(1-s)+s)),255*(1-Math.min(1,a*(1-s)+s))]},r.xyz.rgb=function(e){const t=e[0]/100,i=e[1]/100,a=e[2]/100;let s,r,n;return s=3.2406*t+-1.5372*i+-.4986*a,r=-.9689*t+1.8758*i+.0415*a,n=.0557*t+-.204*i+1.057*a,s=s>.0031308?1.055*s**(1/2.4)-.055:12.92*s,r=r>.0031308?1.055*r**(1/2.4)-.055:12.92*r,n=n>.0031308?1.055*n**(1/2.4)-.055:12.92*n,s=Math.min(Math.max(0,s),1),r=Math.min(Math.max(0,r),1),n=Math.min(Math.max(0,n),1),[255*s,255*r,255*n]},r.xyz.lab=function(e){let t=e[0],i=e[1],a=e[2];t/=95.047,i/=100,a/=108.883,t=t>.008856?t**(1/3):7.787*t+16/116,i=i>.008856?i**(1/3):7.787*i+16/116,a=a>.008856?a**(1/3):7.787*a+16/116;return[116*i-16,500*(t-i),200*(i-a)]},r.lab.xyz=function(e){let t,i,a;i=(e[0]+16)/116,t=e[1]/500+i,a=i-e[2]/200;const s=i**3,r=t**3,n=a**3;return i=s>.008856?s:(i-16/116)/7.787,t=r>.008856?r:(t-16/116)/7.787,a=n>.008856?n:(a-16/116)/7.787,t*=95.047,i*=100,a*=108.883,[t,i,a]},r.lab.lch=function(e){const t=e[0],i=e[1],a=e[2];let s;s=360*Math.atan2(a,i)/2/Math.PI,s<0&&(s+=360);return[t,Math.sqrt(i*i+a*a),s]},r.lch.lab=function(e){const t=e[0],i=e[1],a=e[2]/360*2*Math.PI;return[t,i*Math.cos(a),i*Math.sin(a)]},r.rgb.ansi16=function(e,t=null){const[i,a,s]=e;let n=null===t?r.rgb.hsv(e)[2]:t;if(n=Math.round(n/50),0===n)return 30;let o=30+(Math.round(s/255)<<2|Math.round(a/255)<<1|Math.round(i/255));return 2===n&&(o+=60),o},r.hsv.ansi16=function(e){return r.rgb.ansi16(r.hsv.rgb(e),e[2])},r.rgb.ansi256=function(e){const t=e[0],i=e[1],a=e[2];if(t===i&&i===a)return t<8?16:t>248?231:Math.round((t-8)/247*24)+232;return 16+36*Math.round(t/255*5)+6*Math.round(i/255*5)+Math.round(a/255*5)},r.ansi16.rgb=function(e){let t=e%10;if(0===t||7===t)return e>50&&(t+=3.5),t=t/10.5*255,[t,t,t];const i=.5*(1+~~(e>50));return[(1&t)*i*255,(t>>1&1)*i*255,(t>>2&1)*i*255]},r.ansi256.rgb=function(e){if(e>=232){const t=10*(e-232)+8;return[t,t,t]}let t;e-=16;return[Math.floor(e/36)/5*255,Math.floor((t=e%36)/6)/5*255,t%6/5*255]},r.rgb.hex=function(e){const t=(((255&Math.round(e[0]))<<16)+((255&Math.round(e[1]))<<8)+(255&Math.round(e[2]))).toString(16).toUpperCase();return"000000".substring(t.length)+t},r.hex.rgb=function(e){const t=e.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);if(!t)return[0,0,0];let i=t[0];3===t[0].length&&(i=i.split("").map((e=>e+e)).join(""));const a=parseInt(i,16);return[a>>16&255,a>>8&255,255&a]},r.rgb.hcg=function(e){const t=e[0]/255,i=e[1]/255,a=e[2]/255,s=Math.max(Math.max(t,i),a),r=Math.min(Math.min(t,i),a),n=s-r;let o,l;return o=n<1?r/(1-n):0,l=n<=0?0:s===t?(i-a)/n%6:s===i?2+(a-t)/n:4+(t-i)/n,l/=6,l%=1,[360*l,100*n,100*o]},r.hsl.hcg=function(e){const t=e[1]/100,i=e[2]/100,a=i<.5?2*t*i:2*t*(1-i);let s=0;return a<1&&(s=(i-.5*a)/(1-a)),[e[0],100*a,100*s]},r.hsv.hcg=function(e){const t=e[1]/100,i=e[2]/100,a=t*i;let s=0;return a<1&&(s=(i-a)/(1-a)),[e[0],100*a,100*s]},r.hcg.rgb=function(e){const t=e[0]/360,i=e[1]/100,a=e[2]/100;if(0===i)return[255*a,255*a,255*a];const s=[0,0,0],r=t%1*6,n=r%1,o=1-n;let l=0;switch(Math.floor(r)){case 0:s[0]=1,s[1]=n,s[2]=0;break;case 1:s[0]=o,s[1]=1,s[2]=0;break;case 2:s[0]=0,s[1]=1,s[2]=n;break;case 3:s[0]=0,s[1]=o,s[2]=1;break;case 4:s[0]=n,s[1]=0,s[2]=1;break;default:s[0]=1,s[1]=0,s[2]=o}return l=(1-i)*a,[255*(i*s[0]+l),255*(i*s[1]+l),255*(i*s[2]+l)]},r.hcg.hsv=function(e){const t=e[1]/100,i=t+e[2]/100*(1-t);let a=0;return i>0&&(a=t/i),[e[0],100*a,100*i]},r.hcg.hsl=function(e){const t=e[1]/100,i=e[2]/100*(1-t)+.5*t;let a=0;return i>0&&i<.5?a=t/(2*i):i>=.5&&i<1&&(a=t/(2*(1-i))),[e[0],100*a,100*i]},r.hcg.hwb=function(e){const t=e[1]/100,i=t+e[2]/100*(1-t);return[e[0],100*(i-t),100*(1-i)]},r.hwb.hcg=function(e){const t=e[1]/100,i=1-e[2]/100,a=i-t;let s=0;return a<1&&(s=(i-a)/(1-a)),[e[0],100*a,100*s]},r.apple.rgb=function(e){return[e[0]/65535*255,e[1]/65535*255,e[2]/65535*255]},r.rgb.apple=function(e){return[e[0]/255*65535,e[1]/255*65535,e[2]/255*65535]},r.gray.rgb=function(e){return[e[0]/100*255,e[0]/100*255,e[0]/100*255]},r.gray.hsl=function(e){return[0,0,e[0]]},r.gray.hsv=r.gray.hsl,r.gray.hwb=function(e){return[0,100,e[0]]},r.gray.cmyk=function(e){return[0,0,0,e[0]]},r.gray.lab=function(e){return[e[0],0,0]},r.gray.hex=function(e){const t=255&Math.round(e[0]/100*255),i=((t<<16)+(t<<8)+t).toString(16).toUpperCase();return"000000".substring(i.length)+i},r.rgb.gray=function(e){return[(e[0]+e[1]+e[2])/3/255*100]}},137:function(e,t,i){const a=i(920),s=i(584),r={};Object.keys(a).forEach((e=>{r[e]={},Object.defineProperty(r[e],"channels",{value:a[e].channels}),Object.defineProperty(r[e],"labels",{value:a[e].labels});const t=s(e);Object.keys(t).forEach((i=>{const a=t[i];r[e][i]=function(e){const t=function(...t){const i=t[0];if(null==i)return i;i.length>1&&(t=i);const a=e(t);if("object"==typeof a)for(let e=a.length,t=0;t<e;t++)a[t]=Math.round(a[t]);return a};return"conversion"in e&&(t.conversion=e.conversion),t}(a),r[e][i].raw=function(e){const t=function(...t){const i=t[0];return null==i?i:(i.length>1&&(t=i),e(t))};return"conversion"in e&&(t.conversion=e.conversion),t}(a)}))})),e.exports=r},584:function(e,t,i){const a=i(920);function s(e){const t=function(){const e={},t=Object.keys(a);for(let i=t.length,a=0;a<i;a++)e[t[a]]={distance:-1,parent:null};return e}(),i=[e];for(t[e].distance=0;i.length;){const e=i.pop(),s=Object.keys(a[e]);for(let a=s.length,r=0;r<a;r++){const a=s[r],n=t[a];-1===n.distance&&(n.distance=t[e].distance+1,n.parent=e,i.unshift(a))}}return t}function r(e,t){return function(i){return t(e(i))}}function n(e,t){const i=[t[e].parent,e];let s=a[t[e].parent][e],n=t[e].parent;for(;t[n].parent;)i.unshift(t[n].parent),s=r(a[t[n].parent][n],s),n=t[n].parent;return s.conversion=i,s}e.exports=function(e){const t=s(e),i={},a=Object.keys(t);for(let e=a.length,s=0;s<e;s++){const e=a[s];null!==t[e].parent&&(i[e]=n(e,t))}return i}},993:function(e){"use strict";e.exports={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]}},67:function(e,t,i){var a;e=i.nmd(e),function(s){var r=t,n=(e&&e.exports,"object"==typeof i.g&&i.g);n.global!==n&&n.window;var o=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,l=/[\x01-\x7F]/g,c=/[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,u=/<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g,h={"­":"shy","‌":"zwnj","‍":"zwj","‎":"lrm","⁣":"ic","⁢":"it","⁡":"af","‏":"rlm","​":"ZeroWidthSpace","⁠":"NoBreak","̑":"DownBreve","⃛":"tdot","⃜":"DotDot","\t":"Tab","\n":"NewLine"," ":"puncsp"," ":"MediumSpace"," ":"thinsp"," ":"hairsp"," ":"emsp13"," ":"ensp"," ":"emsp14"," ":"emsp"," ":"numsp"," ":"nbsp","  ":"ThickSpace","‾":"oline",_:"lowbar","‐":"dash","–":"ndash","—":"mdash","―":"horbar",",":"comma",";":"semi","⁏":"bsemi",":":"colon","⩴":"Colone","!":"excl","¡":"iexcl","?":"quest","¿":"iquest",".":"period","‥":"nldr","…":"mldr","·":"middot","'":"apos","‘":"lsquo","’":"rsquo","‚":"sbquo","‹":"lsaquo","›":"rsaquo",'"':"quot","“":"ldquo","”":"rdquo","„":"bdquo","«":"laquo","»":"raquo","(":"lpar",")":"rpar","[":"lsqb","]":"rsqb","{":"lcub","}":"rcub","⌈":"lceil","⌉":"rceil","⌊":"lfloor","⌋":"rfloor","⦅":"lopar","⦆":"ropar","⦋":"lbrke","⦌":"rbrke","⦍":"lbrkslu","⦎":"rbrksld","⦏":"lbrksld","⦐":"rbrkslu","⦑":"langd","⦒":"rangd","⦓":"lparlt","⦔":"rpargt","⦕":"gtlPar","⦖":"ltrPar","⟦":"lobrk","⟧":"robrk","⟨":"lang","⟩":"rang","⟪":"Lang","⟫":"Rang","⟬":"loang","⟭":"roang","❲":"lbbrk","❳":"rbbrk","‖":"Vert","§":"sect","¶":"para","@":"commat","*":"ast","/":"sol",undefined:null,"&":"amp","#":"num","%":"percnt","‰":"permil","‱":"pertenk","†":"dagger","‡":"Dagger","•":"bull","⁃":"hybull","′":"prime","″":"Prime","‴":"tprime","⁗":"qprime","‵":"bprime","⁁":"caret","`":"grave","´":"acute","˜":"tilde","^":"Hat","¯":"macr","˘":"breve","˙":"dot","¨":"die","˚":"ring","˝":"dblac","¸":"cedil","˛":"ogon","ˆ":"circ","ˇ":"caron","°":"deg","©":"copy","®":"reg","℗":"copysr","℘":"wp","℞":"rx","℧":"mho","℩":"iiota","←":"larr","↚":"nlarr","→":"rarr","↛":"nrarr","↑":"uarr","↓":"darr","↔":"harr","↮":"nharr","↕":"varr","↖":"nwarr","↗":"nearr","↘":"searr","↙":"swarr","↝":"rarrw","↝̸":"nrarrw","↞":"Larr","↟":"Uarr","↠":"Rarr","↡":"Darr","↢":"larrtl","↣":"rarrtl","↤":"mapstoleft","↥":"mapstoup","↦":"map","↧":"mapstodown","↩":"larrhk","↪":"rarrhk","↫":"larrlp","↬":"rarrlp","↭":"harrw","↰":"lsh","↱":"rsh","↲":"ldsh","↳":"rdsh","↵":"crarr","↶":"cularr","↷":"curarr","↺":"olarr","↻":"orarr","↼":"lharu","↽":"lhard","↾":"uharr","↿":"uharl","⇀":"rharu","⇁":"rhard","⇂":"dharr","⇃":"dharl","⇄":"rlarr","⇅":"udarr","⇆":"lrarr","⇇":"llarr","⇈":"uuarr","⇉":"rrarr","⇊":"ddarr","⇋":"lrhar","⇌":"rlhar","⇐":"lArr","⇍":"nlArr","⇑":"uArr","⇒":"rArr","⇏":"nrArr","⇓":"dArr","⇔":"iff","⇎":"nhArr","⇕":"vArr","⇖":"nwArr","⇗":"neArr","⇘":"seArr","⇙":"swArr","⇚":"lAarr","⇛":"rAarr","⇝":"zigrarr","⇤":"larrb","⇥":"rarrb","⇵":"duarr","⇽":"loarr","⇾":"roarr","⇿":"hoarr","∀":"forall","∁":"comp","∂":"part","∂̸":"npart","∃":"exist","∄":"nexist","∅":"empty","∇":"Del","∈":"in","∉":"notin","∋":"ni","∌":"notni","϶":"bepsi","∏":"prod","∐":"coprod","∑":"sum","+":"plus","±":"pm","÷":"div","×":"times","<":"lt","≮":"nlt","<⃒":"nvlt","=":"equals","≠":"ne","=⃥":"bne","⩵":"Equal",">":"gt","≯":"ngt",">⃒":"nvgt","¬":"not","|":"vert","¦":"brvbar","−":"minus","∓":"mp","∔":"plusdo","⁄":"frasl","∖":"setmn","∗":"lowast","∘":"compfn","√":"Sqrt","∝":"prop","∞":"infin","∟":"angrt","∠":"ang","∠⃒":"nang","∡":"angmsd","∢":"angsph","∣":"mid","∤":"nmid","∥":"par","∦":"npar","∧":"and","∨":"or","∩":"cap","∩︀":"caps","∪":"cup","∪︀":"cups","∫":"int","∬":"Int","∭":"tint","⨌":"qint","∮":"oint","∯":"Conint","∰":"Cconint","∱":"cwint","∲":"cwconint","∳":"awconint","∴":"there4","∵":"becaus","∶":"ratio","∷":"Colon","∸":"minusd","∺":"mDDot","∻":"homtht","∼":"sim","≁":"nsim","∼⃒":"nvsim","∽":"bsim","∽̱":"race","∾":"ac","∾̳":"acE","∿":"acd","≀":"wr","≂":"esim","≂̸":"nesim","≃":"sime","≄":"nsime","≅":"cong","≇":"ncong","≆":"simne","≈":"ap","≉":"nap","≊":"ape","≋":"apid","≋̸":"napid","≌":"bcong","≍":"CupCap","≭":"NotCupCap","≍⃒":"nvap","≎":"bump","≎̸":"nbump","≏":"bumpe","≏̸":"nbumpe","≐":"doteq","≐̸":"nedot","≑":"eDot","≒":"efDot","≓":"erDot","≔":"colone","≕":"ecolon","≖":"ecir","≗":"cire","≙":"wedgeq","≚":"veeeq","≜":"trie","≟":"equest","≡":"equiv","≢":"nequiv","≡⃥":"bnequiv","≤":"le","≰":"nle","≤⃒":"nvle","≥":"ge","≱":"nge","≥⃒":"nvge","≦":"lE","≦̸":"nlE","≧":"gE","≧̸":"ngE","≨︀":"lvnE","≨":"lnE","≩":"gnE","≩︀":"gvnE","≪":"ll","≪̸":"nLtv","≪⃒":"nLt","≫":"gg","≫̸":"nGtv","≫⃒":"nGt","≬":"twixt","≲":"lsim","≴":"nlsim","≳":"gsim","≵":"ngsim","≶":"lg","≸":"ntlg","≷":"gl","≹":"ntgl","≺":"pr","⊀":"npr","≻":"sc","⊁":"nsc","≼":"prcue","⋠":"nprcue","≽":"sccue","⋡":"nsccue","≾":"prsim","≿":"scsim","≿̸":"NotSucceedsTilde","⊂":"sub","⊄":"nsub","⊂⃒":"vnsub","⊃":"sup","⊅":"nsup","⊃⃒":"vnsup","⊆":"sube","⊈":"nsube","⊇":"supe","⊉":"nsupe","⊊︀":"vsubne","⊊":"subne","⊋︀":"vsupne","⊋":"supne","⊍":"cupdot","⊎":"uplus","⊏":"sqsub","⊏̸":"NotSquareSubset","⊐":"sqsup","⊐̸":"NotSquareSuperset","⊑":"sqsube","⋢":"nsqsube","⊒":"sqsupe","⋣":"nsqsupe","⊓":"sqcap","⊓︀":"sqcaps","⊔":"sqcup","⊔︀":"sqcups","⊕":"oplus","⊖":"ominus","⊗":"otimes","⊘":"osol","⊙":"odot","⊚":"ocir","⊛":"oast","⊝":"odash","⊞":"plusb","⊟":"minusb","⊠":"timesb","⊡":"sdotb","⊢":"vdash","⊬":"nvdash","⊣":"dashv","⊤":"top","⊥":"bot","⊧":"models","⊨":"vDash","⊭":"nvDash","⊩":"Vdash","⊮":"nVdash","⊪":"Vvdash","⊫":"VDash","⊯":"nVDash","⊰":"prurel","⊲":"vltri","⋪":"nltri","⊳":"vrtri","⋫":"nrtri","⊴":"ltrie","⋬":"nltrie","⊴⃒":"nvltrie","⊵":"rtrie","⋭":"nrtrie","⊵⃒":"nvrtrie","⊶":"origof","⊷":"imof","⊸":"mumap","⊹":"hercon","⊺":"intcal","⊻":"veebar","⊽":"barvee","⊾":"angrtvb","⊿":"lrtri","⋀":"Wedge","⋁":"Vee","⋂":"xcap","⋃":"xcup","⋄":"diam","⋅":"sdot","⋆":"Star","⋇":"divonx","⋈":"bowtie","⋉":"ltimes","⋊":"rtimes","⋋":"lthree","⋌":"rthree","⋍":"bsime","⋎":"cuvee","⋏":"cuwed","⋐":"Sub","⋑":"Sup","⋒":"Cap","⋓":"Cup","⋔":"fork","⋕":"epar","⋖":"ltdot","⋗":"gtdot","⋘":"Ll","⋘̸":"nLl","⋙":"Gg","⋙̸":"nGg","⋚︀":"lesg","⋚":"leg","⋛":"gel","⋛︀":"gesl","⋞":"cuepr","⋟":"cuesc","⋦":"lnsim","⋧":"gnsim","⋨":"prnsim","⋩":"scnsim","⋮":"vellip","⋯":"ctdot","⋰":"utdot","⋱":"dtdot","⋲":"disin","⋳":"isinsv","⋴":"isins","⋵":"isindot","⋵̸":"notindot","⋶":"notinvc","⋷":"notinvb","⋹":"isinE","⋹̸":"notinE","⋺":"nisd","⋻":"xnis","⋼":"nis","⋽":"notnivc","⋾":"notnivb","⌅":"barwed","⌆":"Barwed","⌌":"drcrop","⌍":"dlcrop","⌎":"urcrop","⌏":"ulcrop","⌐":"bnot","⌒":"profline","⌓":"profsurf","⌕":"telrec","⌖":"target","⌜":"ulcorn","⌝":"urcorn","⌞":"dlcorn","⌟":"drcorn","⌢":"frown","⌣":"smile","⌭":"cylcty","⌮":"profalar","⌶":"topbot","⌽":"ovbar","⌿":"solbar","⍼":"angzarr","⎰":"lmoust","⎱":"rmoust","⎴":"tbrk","⎵":"bbrk","⎶":"bbrktbrk","⏜":"OverParenthesis","⏝":"UnderParenthesis","⏞":"OverBrace","⏟":"UnderBrace","⏢":"trpezium","⏧":"elinters","␣":"blank","─":"boxh","│":"boxv","┌":"boxdr","┐":"boxdl","└":"boxur","┘":"boxul","├":"boxvr","┤":"boxvl","┬":"boxhd","┴":"boxhu","┼":"boxvh","═":"boxH","║":"boxV","╒":"boxdR","╓":"boxDr","╔":"boxDR","╕":"boxdL","╖":"boxDl","╗":"boxDL","╘":"boxuR","╙":"boxUr","╚":"boxUR","╛":"boxuL","╜":"boxUl","╝":"boxUL","╞":"boxvR","╟":"boxVr","╠":"boxVR","╡":"boxvL","╢":"boxVl","╣":"boxVL","╤":"boxHd","╥":"boxhD","╦":"boxHD","╧":"boxHu","╨":"boxhU","╩":"boxHU","╪":"boxvH","╫":"boxVh","╬":"boxVH","▀":"uhblk","▄":"lhblk","█":"block","░":"blk14","▒":"blk12","▓":"blk34","□":"squ","▪":"squf","▫":"EmptyVerySmallSquare","▭":"rect","▮":"marker","▱":"fltns","△":"xutri","▴":"utrif","▵":"utri","▸":"rtrif","▹":"rtri","▽":"xdtri","▾":"dtrif","▿":"dtri","◂":"ltrif","◃":"ltri","◊":"loz","○":"cir","◬":"tridot","◯":"xcirc","◸":"ultri","◹":"urtri","◺":"lltri","◻":"EmptySmallSquare","◼":"FilledSmallSquare","★":"starf","☆":"star","☎":"phone","♀":"female","♂":"male","♠":"spades","♣":"clubs","♥":"hearts","♦":"diams","♪":"sung","✓":"check","✗":"cross","✠":"malt","✶":"sext","❘":"VerticalSeparator","⟈":"bsolhsub","⟉":"suphsol","⟵":"xlarr","⟶":"xrarr","⟷":"xharr","⟸":"xlArr","⟹":"xrArr","⟺":"xhArr","⟼":"xmap","⟿":"dzigrarr","⤂":"nvlArr","⤃":"nvrArr","⤄":"nvHarr","⤅":"Map","⤌":"lbarr","⤍":"rbarr","⤎":"lBarr","⤏":"rBarr","⤐":"RBarr","⤑":"DDotrahd","⤒":"UpArrowBar","⤓":"DownArrowBar","⤖":"Rarrtl","⤙":"latail","⤚":"ratail","⤛":"lAtail","⤜":"rAtail","⤝":"larrfs","⤞":"rarrfs","⤟":"larrbfs","⤠":"rarrbfs","⤣":"nwarhk","⤤":"nearhk","⤥":"searhk","⤦":"swarhk","⤧":"nwnear","⤨":"toea","⤩":"tosa","⤪":"swnwar","⤳":"rarrc","⤳̸":"nrarrc","⤵":"cudarrr","⤶":"ldca","⤷":"rdca","⤸":"cudarrl","⤹":"larrpl","⤼":"curarrm","⤽":"cularrp","⥅":"rarrpl","⥈":"harrcir","⥉":"Uarrocir","⥊":"lurdshar","⥋":"ldrushar","⥎":"LeftRightVector","⥏":"RightUpDownVector","⥐":"DownLeftRightVector","⥑":"LeftUpDownVector","⥒":"LeftVectorBar","⥓":"RightVectorBar","⥔":"RightUpVectorBar","⥕":"RightDownVectorBar","⥖":"DownLeftVectorBar","⥗":"DownRightVectorBar","⥘":"LeftUpVectorBar","⥙":"LeftDownVectorBar","⥚":"LeftTeeVector","⥛":"RightTeeVector","⥜":"RightUpTeeVector","⥝":"RightDownTeeVector","⥞":"DownLeftTeeVector","⥟":"DownRightTeeVector","⥠":"LeftUpTeeVector","⥡":"LeftDownTeeVector","⥢":"lHar","⥣":"uHar","⥤":"rHar","⥥":"dHar","⥦":"luruhar","⥧":"ldrdhar","⥨":"ruluhar","⥩":"rdldhar","⥪":"lharul","⥫":"llhard","⥬":"rharul","⥭":"lrhard","⥮":"udhar","⥯":"duhar","⥰":"RoundImplies","⥱":"erarr","⥲":"simrarr","⥳":"larrsim","⥴":"rarrsim","⥵":"rarrap","⥶":"ltlarr","⥸":"gtrarr","⥹":"subrarr","⥻":"suplarr","⥼":"lfisht","⥽":"rfisht","⥾":"ufisht","⥿":"dfisht","⦚":"vzigzag","⦜":"vangrt","⦝":"angrtvbd","⦤":"ange","⦥":"range","⦦":"dwangle","⦧":"uwangle","⦨":"angmsdaa","⦩":"angmsdab","⦪":"angmsdac","⦫":"angmsdad","⦬":"angmsdae","⦭":"angmsdaf","⦮":"angmsdag","⦯":"angmsdah","⦰":"bemptyv","⦱":"demptyv","⦲":"cemptyv","⦳":"raemptyv","⦴":"laemptyv","⦵":"ohbar","⦶":"omid","⦷":"opar","⦹":"operp","⦻":"olcross","⦼":"odsold","⦾":"olcir","⦿":"ofcir","⧀":"olt","⧁":"ogt","⧂":"cirscir","⧃":"cirE","⧄":"solb","⧅":"bsolb","⧉":"boxbox","⧍":"trisb","⧎":"rtriltri","⧏":"LeftTriangleBar","⧏̸":"NotLeftTriangleBar","⧐":"RightTriangleBar","⧐̸":"NotRightTriangleBar","⧜":"iinfin","⧝":"infintie","⧞":"nvinfin","⧣":"eparsl","⧤":"smeparsl","⧥":"eqvparsl","⧫":"lozf","⧴":"RuleDelayed","⧶":"dsol","⨀":"xodot","⨁":"xoplus","⨂":"xotime","⨄":"xuplus","⨆":"xsqcup","⨍":"fpartint","⨐":"cirfnint","⨑":"awint","⨒":"rppolint","⨓":"scpolint","⨔":"npolint","⨕":"pointint","⨖":"quatint","⨗":"intlarhk","⨢":"pluscir","⨣":"plusacir","⨤":"simplus","⨥":"plusdu","⨦":"plussim","⨧":"plustwo","⨩":"mcomma","⨪":"minusdu","⨭":"loplus","⨮":"roplus","⨯":"Cross","⨰":"timesd","⨱":"timesbar","⨳":"smashp","⨴":"lotimes","⨵":"rotimes","⨶":"otimesas","⨷":"Otimes","⨸":"odiv","⨹":"triplus","⨺":"triminus","⨻":"tritime","⨼":"iprod","⨿":"amalg","⩀":"capdot","⩂":"ncup","⩃":"ncap","⩄":"capand","⩅":"cupor","⩆":"cupcap","⩇":"capcup","⩈":"cupbrcap","⩉":"capbrcup","⩊":"cupcup","⩋":"capcap","⩌":"ccups","⩍":"ccaps","⩐":"ccupssm","⩓":"And","⩔":"Or","⩕":"andand","⩖":"oror","⩗":"orslope","⩘":"andslope","⩚":"andv","⩛":"orv","⩜":"andd","⩝":"ord","⩟":"wedbar","⩦":"sdote","⩪":"simdot","⩭":"congdot","⩭̸":"ncongdot","⩮":"easter","⩯":"apacir","⩰":"apE","⩰̸":"napE","⩱":"eplus","⩲":"pluse","⩳":"Esim","⩷":"eDDot","⩸":"equivDD","⩹":"ltcir","⩺":"gtcir","⩻":"ltquest","⩼":"gtquest","⩽":"les","⩽̸":"nles","⩾":"ges","⩾̸":"nges","⩿":"lesdot","⪀":"gesdot","⪁":"lesdoto","⪂":"gesdoto","⪃":"lesdotor","⪄":"gesdotol","⪅":"lap","⪆":"gap","⪇":"lne","⪈":"gne","⪉":"lnap","⪊":"gnap","⪋":"lEg","⪌":"gEl","⪍":"lsime","⪎":"gsime","⪏":"lsimg","⪐":"gsiml","⪑":"lgE","⪒":"glE","⪓":"lesges","⪔":"gesles","⪕":"els","⪖":"egs","⪗":"elsdot","⪘":"egsdot","⪙":"el","⪚":"eg","⪝":"siml","⪞":"simg","⪟":"simlE","⪠":"simgE","⪡":"LessLess","⪡̸":"NotNestedLessLess","⪢":"GreaterGreater","⪢̸":"NotNestedGreaterGreater","⪤":"glj","⪥":"gla","⪦":"ltcc","⪧":"gtcc","⪨":"lescc","⪩":"gescc","⪪":"smt","⪫":"lat","⪬":"smte","⪬︀":"smtes","⪭":"late","⪭︀":"lates","⪮":"bumpE","⪯":"pre","⪯̸":"npre","⪰":"sce","⪰̸":"nsce","⪳":"prE","⪴":"scE","⪵":"prnE","⪶":"scnE","⪷":"prap","⪸":"scap","⪹":"prnap","⪺":"scnap","⪻":"Pr","⪼":"Sc","⪽":"subdot","⪾":"supdot","⪿":"subplus","⫀":"supplus","⫁":"submult","⫂":"supmult","⫃":"subedot","⫄":"supedot","⫅":"subE","⫅̸":"nsubE","⫆":"supE","⫆̸":"nsupE","⫇":"subsim","⫈":"supsim","⫋︀":"vsubnE","⫋":"subnE","⫌︀":"vsupnE","⫌":"supnE","⫏":"csub","⫐":"csup","⫑":"csube","⫒":"csupe","⫓":"subsup","⫔":"supsub","⫕":"subsub","⫖":"supsup","⫗":"suphsub","⫘":"supdsub","⫙":"forkv","⫚":"topfork","⫛":"mlcp","⫤":"Dashv","⫦":"Vdashl","⫧":"Barv","⫨":"vBar","⫩":"vBarv","⫫":"Vbar","⫬":"Not","⫭":"bNot","⫮":"rnmid","⫯":"cirmid","⫰":"midcir","⫱":"topcir","⫲":"nhpar","⫳":"parsim","⫽":"parsl","⫽⃥":"nparsl","♭":"flat","♮":"natur","♯":"sharp","¤":"curren","¢":"cent",$:"dollar","£":"pound","¥":"yen","€":"euro","¹":"sup1","½":"half","⅓":"frac13","¼":"frac14","⅕":"frac15","⅙":"frac16","⅛":"frac18","²":"sup2","⅔":"frac23","⅖":"frac25","³":"sup3","¾":"frac34","⅗":"frac35","⅜":"frac38","⅘":"frac45","⅚":"frac56","⅝":"frac58","⅞":"frac78","𝒶":"ascr","𝕒":"aopf","𝔞":"afr","𝔸":"Aopf","𝔄":"Afr","𝒜":"Ascr","ª":"ordf","á":"aacute","Á":"Aacute","à":"agrave","À":"Agrave","ă":"abreve","Ă":"Abreve","â":"acirc","Â":"Acirc","å":"aring","Å":"angst","ä":"auml","Ä":"Auml","ã":"atilde","Ã":"Atilde","ą":"aogon","Ą":"Aogon","ā":"amacr","Ā":"Amacr","æ":"aelig","Æ":"AElig","𝒷":"bscr","𝕓":"bopf","𝔟":"bfr","𝔹":"Bopf","ℬ":"Bscr","𝔅":"Bfr","𝔠":"cfr","𝒸":"cscr","𝕔":"copf","ℭ":"Cfr","𝒞":"Cscr","ℂ":"Copf","ć":"cacute","Ć":"Cacute","ĉ":"ccirc","Ĉ":"Ccirc","č":"ccaron","Č":"Ccaron","ċ":"cdot","Ċ":"Cdot","ç":"ccedil","Ç":"Ccedil","℅":"incare","𝔡":"dfr","ⅆ":"dd","𝕕":"dopf","𝒹":"dscr","𝒟":"Dscr","𝔇":"Dfr","ⅅ":"DD","𝔻":"Dopf","ď":"dcaron","Ď":"Dcaron","đ":"dstrok","Đ":"Dstrok","ð":"eth","Ð":"ETH","ⅇ":"ee","ℯ":"escr","𝔢":"efr","𝕖":"eopf","ℰ":"Escr","𝔈":"Efr","𝔼":"Eopf","é":"eacute","É":"Eacute","è":"egrave","È":"Egrave","ê":"ecirc","Ê":"Ecirc","ě":"ecaron","Ě":"Ecaron","ë":"euml","Ë":"Euml","ė":"edot","Ė":"Edot","ę":"eogon","Ę":"Eogon","ē":"emacr","Ē":"Emacr","𝔣":"ffr","𝕗":"fopf","𝒻":"fscr","𝔉":"Ffr","𝔽":"Fopf","ℱ":"Fscr","ﬀ":"fflig","ﬃ":"ffilig","ﬄ":"ffllig","ﬁ":"filig",fj:"fjlig","ﬂ":"fllig","ƒ":"fnof","ℊ":"gscr","𝕘":"gopf","𝔤":"gfr","𝒢":"Gscr","𝔾":"Gopf","𝔊":"Gfr","ǵ":"gacute","ğ":"gbreve","Ğ":"Gbreve","ĝ":"gcirc","Ĝ":"Gcirc","ġ":"gdot","Ġ":"Gdot","Ģ":"Gcedil","𝔥":"hfr","ℎ":"planckh","𝒽":"hscr","𝕙":"hopf","ℋ":"Hscr","ℌ":"Hfr","ℍ":"Hopf","ĥ":"hcirc","Ĥ":"Hcirc","ℏ":"hbar","ħ":"hstrok","Ħ":"Hstrok","𝕚":"iopf","𝔦":"ifr","𝒾":"iscr","ⅈ":"ii","𝕀":"Iopf","ℐ":"Iscr","ℑ":"Im","í":"iacute","Í":"Iacute","ì":"igrave","Ì":"Igrave","î":"icirc","Î":"Icirc","ï":"iuml","Ï":"Iuml","ĩ":"itilde","Ĩ":"Itilde","İ":"Idot","į":"iogon","Į":"Iogon","ī":"imacr","Ī":"Imacr","ĳ":"ijlig","Ĳ":"IJlig","ı":"imath","𝒿":"jscr","𝕛":"jopf","𝔧":"jfr","𝒥":"Jscr","𝔍":"Jfr","𝕁":"Jopf","ĵ":"jcirc","Ĵ":"Jcirc","ȷ":"jmath","𝕜":"kopf","𝓀":"kscr","𝔨":"kfr","𝒦":"Kscr","𝕂":"Kopf","𝔎":"Kfr","ķ":"kcedil","Ķ":"Kcedil","𝔩":"lfr","𝓁":"lscr","ℓ":"ell","𝕝":"lopf","ℒ":"Lscr","𝔏":"Lfr","𝕃":"Lopf","ĺ":"lacute","Ĺ":"Lacute","ľ":"lcaron","Ľ":"Lcaron","ļ":"lcedil","Ļ":"Lcedil","ł":"lstrok","Ł":"Lstrok","ŀ":"lmidot","Ŀ":"Lmidot","𝔪":"mfr","𝕞":"mopf","𝓂":"mscr","𝔐":"Mfr","𝕄":"Mopf","ℳ":"Mscr","𝔫":"nfr","𝕟":"nopf","𝓃":"nscr","ℕ":"Nopf","𝒩":"Nscr","𝔑":"Nfr","ń":"nacute","Ń":"Nacute","ň":"ncaron","Ň":"Ncaron","ñ":"ntilde","Ñ":"Ntilde","ņ":"ncedil","Ņ":"Ncedil","№":"numero","ŋ":"eng","Ŋ":"ENG","𝕠":"oopf","𝔬":"ofr","ℴ":"oscr","𝒪":"Oscr","𝔒":"Ofr","𝕆":"Oopf","º":"ordm","ó":"oacute","Ó":"Oacute","ò":"ograve","Ò":"Ograve","ô":"ocirc","Ô":"Ocirc","ö":"ouml","Ö":"Ouml","ő":"odblac","Ő":"Odblac","õ":"otilde","Õ":"Otilde","ø":"oslash","Ø":"Oslash","ō":"omacr","Ō":"Omacr","œ":"oelig","Œ":"OElig","𝔭":"pfr","𝓅":"pscr","𝕡":"popf","ℙ":"Popf","𝔓":"Pfr","𝒫":"Pscr","𝕢":"qopf","𝔮":"qfr","𝓆":"qscr","𝒬":"Qscr","𝔔":"Qfr","ℚ":"Qopf","ĸ":"kgreen","𝔯":"rfr","𝕣":"ropf","𝓇":"rscr","ℛ":"Rscr","ℜ":"Re","ℝ":"Ropf","ŕ":"racute","Ŕ":"Racute","ř":"rcaron","Ř":"Rcaron","ŗ":"rcedil","Ŗ":"Rcedil","𝕤":"sopf","𝓈":"sscr","𝔰":"sfr","𝕊":"Sopf","𝔖":"Sfr","𝒮":"Sscr","Ⓢ":"oS","ś":"sacute","Ś":"Sacute","ŝ":"scirc","Ŝ":"Scirc","š":"scaron","Š":"Scaron","ş":"scedil","Ş":"Scedil","ß":"szlig","𝔱":"tfr","𝓉":"tscr","𝕥":"topf","𝒯":"Tscr","𝔗":"Tfr","𝕋":"Topf","ť":"tcaron","Ť":"Tcaron","ţ":"tcedil","Ţ":"Tcedil","™":"trade","ŧ":"tstrok","Ŧ":"Tstrok","𝓊":"uscr","𝕦":"uopf","𝔲":"ufr","𝕌":"Uopf","𝔘":"Ufr","𝒰":"Uscr","ú":"uacute","Ú":"Uacute","ù":"ugrave","Ù":"Ugrave","ŭ":"ubreve","Ŭ":"Ubreve","û":"ucirc","Û":"Ucirc","ů":"uring","Ů":"Uring","ü":"uuml","Ü":"Uuml","ű":"udblac","Ű":"Udblac","ũ":"utilde","Ũ":"Utilde","ų":"uogon","Ų":"Uogon","ū":"umacr","Ū":"Umacr","𝔳":"vfr","𝕧":"vopf","𝓋":"vscr","𝔙":"Vfr","𝕍":"Vopf","𝒱":"Vscr","𝕨":"wopf","𝓌":"wscr","𝔴":"wfr","𝒲":"Wscr","𝕎":"Wopf","𝔚":"Wfr","ŵ":"wcirc","Ŵ":"Wcirc","𝔵":"xfr","𝓍":"xscr","𝕩":"xopf","𝕏":"Xopf","𝔛":"Xfr","𝒳":"Xscr","𝔶":"yfr","𝓎":"yscr","𝕪":"yopf","𝒴":"Yscr","𝔜":"Yfr","𝕐":"Yopf","ý":"yacute","Ý":"Yacute","ŷ":"ycirc","Ŷ":"Ycirc","ÿ":"yuml","Ÿ":"Yuml","𝓏":"zscr","𝔷":"zfr","𝕫":"zopf","ℨ":"Zfr","ℤ":"Zopf","𝒵":"Zscr","ź":"zacute","Ź":"Zacute","ž":"zcaron","Ž":"Zcaron","ż":"zdot","Ż":"Zdot","Ƶ":"imped","þ":"thorn","Þ":"THORN","ŉ":"napos","α":"alpha","Α":"Alpha","β":"beta","Β":"Beta","γ":"gamma","Γ":"Gamma","δ":"delta","Δ":"Delta","ε":"epsi","ϵ":"epsiv","Ε":"Epsilon","ϝ":"gammad","Ϝ":"Gammad","ζ":"zeta","Ζ":"Zeta","η":"eta","Η":"Eta","θ":"theta","ϑ":"thetav","Θ":"Theta","ι":"iota","Ι":"Iota","κ":"kappa","ϰ":"kappav","Κ":"Kappa","λ":"lambda","Λ":"Lambda","μ":"mu","µ":"micro","Μ":"Mu","ν":"nu","Ν":"Nu","ξ":"xi","Ξ":"Xi","ο":"omicron","Ο":"Omicron","π":"pi","ϖ":"piv","Π":"Pi","ρ":"rho","ϱ":"rhov","Ρ":"Rho","σ":"sigma","Σ":"Sigma","ς":"sigmaf","τ":"tau","Τ":"Tau","υ":"upsi","Υ":"Upsilon","ϒ":"Upsi","φ":"phi","ϕ":"phiv","Φ":"Phi","χ":"chi","Χ":"Chi","ψ":"psi","Ψ":"Psi","ω":"omega","Ω":"ohm","а":"acy","А":"Acy","б":"bcy","Б":"Bcy","в":"vcy","В":"Vcy","г":"gcy","Г":"Gcy","ѓ":"gjcy","Ѓ":"GJcy","д":"dcy","Д":"Dcy","ђ":"djcy","Ђ":"DJcy","е":"iecy","Е":"IEcy","ё":"iocy","Ё":"IOcy","є":"jukcy","Є":"Jukcy","ж":"zhcy","Ж":"ZHcy","з":"zcy","З":"Zcy","ѕ":"dscy","Ѕ":"DScy","и":"icy","И":"Icy","і":"iukcy","І":"Iukcy","ї":"yicy","Ї":"YIcy","й":"jcy","Й":"Jcy","ј":"jsercy","Ј":"Jsercy","к":"kcy","К":"Kcy","ќ":"kjcy","Ќ":"KJcy","л":"lcy","Л":"Lcy","љ":"ljcy","Љ":"LJcy","м":"mcy","М":"Mcy","н":"ncy","Н":"Ncy","њ":"njcy","Њ":"NJcy","о":"ocy","О":"Ocy","п":"pcy","П":"Pcy","р":"rcy","Р":"Rcy","с":"scy","С":"Scy","т":"tcy","Т":"Tcy","ћ":"tshcy","Ћ":"TSHcy","у":"ucy","У":"Ucy","ў":"ubrcy","Ў":"Ubrcy","ф":"fcy","Ф":"Fcy","х":"khcy","Х":"KHcy","ц":"tscy","Ц":"TScy","ч":"chcy","Ч":"CHcy","џ":"dzcy","Џ":"DZcy","ш":"shcy","Ш":"SHcy","щ":"shchcy","Щ":"SHCHcy","ъ":"hardcy","Ъ":"HARDcy","ы":"ycy","Ы":"Ycy","ь":"softcy","Ь":"SOFTcy","э":"ecy","Э":"Ecy","ю":"yucy","Ю":"YUcy","я":"yacy","Я":"YAcy","ℵ":"aleph","ℶ":"beth","ℷ":"gimel","ℸ":"daleth"},d=/["&'<>`]/g,p={'"':"&quot;","&":"&amp;","'":"&#x27;","<":"&lt;",">":"&gt;","`":"&#x60;"},m=/&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/,g=/[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,f=/&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g,b={aacute:"á",Aacute:"Á",abreve:"ă",Abreve:"Ă",ac:"∾",acd:"∿",acE:"∾̳",acirc:"â",Acirc:"Â",acute:"´",acy:"а",Acy:"А",aelig:"æ",AElig:"Æ",af:"⁡",afr:"𝔞",Afr:"𝔄",agrave:"à",Agrave:"À",alefsym:"ℵ",aleph:"ℵ",alpha:"α",Alpha:"Α",amacr:"ā",Amacr:"Ā",amalg:"⨿",amp:"&",AMP:"&",and:"∧",And:"⩓",andand:"⩕",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsd:"∡",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",aogon:"ą",Aogon:"Ą",aopf:"𝕒",Aopf:"𝔸",ap:"≈",apacir:"⩯",ape:"≊",apE:"⩰",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",aring:"å",Aring:"Å",ascr:"𝒶",Ascr:"𝒜",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",atilde:"ã",Atilde:"Ã",auml:"ä",Auml:"Ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",barwed:"⌅",Barwed:"⌆",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",bcy:"б",Bcy:"Б",bdquo:"„",becaus:"∵",because:"∵",Because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",beta:"β",Beta:"Β",beth:"ℶ",between:"≬",bfr:"𝔟",Bfr:"𝔅",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bnot:"⌐",bNot:"⫭",bopf:"𝕓",Bopf:"𝔹",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxdl:"┐",boxdL:"╕",boxDl:"╖",boxDL:"╗",boxdr:"┌",boxdR:"╒",boxDr:"╓",boxDR:"╔",boxh:"─",boxH:"═",boxhd:"┬",boxhD:"╥",boxHd:"╤",boxHD:"╦",boxhu:"┴",boxhU:"╨",boxHu:"╧",boxHU:"╩",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxul:"┘",boxuL:"╛",boxUl:"╜",boxUL:"╝",boxur:"└",boxuR:"╘",boxUr:"╙",boxUR:"╚",boxv:"│",boxV:"║",boxvh:"┼",boxvH:"╪",boxVh:"╫",boxVH:"╬",boxvl:"┤",boxvL:"╡",boxVl:"╢",boxVL:"╣",boxvr:"├",boxvR:"╞",boxVr:"╟",boxVR:"╠",bprime:"‵",breve:"˘",Breve:"˘",brvbar:"¦",bscr:"𝒷",Bscr:"ℬ",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsol:"\\",bsolb:"⧅",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpe:"≏",bumpE:"⪮",bumpeq:"≏",Bumpeq:"≎",cacute:"ć",Cacute:"Ć",cap:"∩",Cap:"⋒",capand:"⩄",capbrcup:"⩉",capcap:"⩋",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",ccaron:"č",Ccaron:"Č",ccedil:"ç",Ccedil:"Ç",ccirc:"ĉ",Ccirc:"Ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",cdot:"ċ",Cdot:"Ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",centerdot:"·",CenterDot:"·",cfr:"𝔠",Cfr:"ℭ",chcy:"ч",CHcy:"Ч",check:"✓",checkmark:"✓",chi:"χ",Chi:"Χ",cir:"○",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cire:"≗",cirE:"⧃",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",colon:":",Colon:"∷",colone:"≔",Colone:"⩴",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",conint:"∮",Conint:"∯",ContourIntegral:"∮",copf:"𝕔",Copf:"ℂ",coprod:"∐",Coproduct:"∐",copy:"©",COPY:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",cross:"✗",Cross:"⨯",cscr:"𝒸",Cscr:"𝒞",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",cup:"∪",Cup:"⋓",cupbrcap:"⩈",cupcap:"⩆",CupCap:"≍",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",dagger:"†",Dagger:"‡",daleth:"ℸ",darr:"↓",dArr:"⇓",Darr:"↡",dash:"‐",dashv:"⊣",Dashv:"⫤",dbkarow:"⤏",dblac:"˝",dcaron:"ď",Dcaron:"Ď",dcy:"д",Dcy:"Д",dd:"ⅆ",DD:"ⅅ",ddagger:"‡",ddarr:"⇊",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",delta:"δ",Delta:"Δ",demptyv:"⦱",dfisht:"⥿",dfr:"𝔡",Dfr:"𝔇",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",diamond:"⋄",Diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",djcy:"ђ",DJcy:"Ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",dopf:"𝕕",Dopf:"𝔻",dot:"˙",Dot:"¨",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",downarrow:"↓",Downarrow:"⇓",DownArrow:"↓",DownArrowBar:"⤓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVector:"↽",DownLeftVectorBar:"⥖",DownRightTeeVector:"⥟",DownRightVector:"⇁",DownRightVectorBar:"⥗",DownTee:"⊤",DownTeeArrow:"↧",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",dscr:"𝒹",Dscr:"𝒟",dscy:"ѕ",DScy:"Ѕ",dsol:"⧶",dstrok:"đ",Dstrok:"Đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",dzcy:"џ",DZcy:"Џ",dzigrarr:"⟿",eacute:"é",Eacute:"É",easter:"⩮",ecaron:"ě",Ecaron:"Ě",ecir:"≖",ecirc:"ê",Ecirc:"Ê",ecolon:"≕",ecy:"э",Ecy:"Э",eDDot:"⩷",edot:"ė",eDot:"≑",Edot:"Ė",ee:"ⅇ",efDot:"≒",efr:"𝔢",Efr:"𝔈",eg:"⪚",egrave:"è",Egrave:"È",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",emacr:"ē",Emacr:"Ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp:" ",emsp13:" ",emsp14:" ",eng:"ŋ",ENG:"Ŋ",ensp:" ",eogon:"ę",Eogon:"Ę",eopf:"𝕖",Eopf:"𝔼",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",epsilon:"ε",Epsilon:"Ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",escr:"ℯ",Escr:"ℰ",esdot:"≐",esim:"≂",Esim:"⩳",eta:"η",Eta:"Η",eth:"ð",ETH:"Ð",euml:"ë",Euml:"Ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",exponentiale:"ⅇ",ExponentialE:"ⅇ",fallingdotseq:"≒",fcy:"ф",Fcy:"Ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",ffr:"𝔣",Ffr:"𝔉",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",fopf:"𝕗",Fopf:"𝔽",forall:"∀",ForAll:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",fscr:"𝒻",Fscr:"ℱ",gacute:"ǵ",gamma:"γ",Gamma:"Γ",gammad:"ϝ",Gammad:"Ϝ",gap:"⪆",gbreve:"ğ",Gbreve:"Ğ",Gcedil:"Ģ",gcirc:"ĝ",Gcirc:"Ĝ",gcy:"г",Gcy:"Г",gdot:"ġ",Gdot:"Ġ",ge:"≥",gE:"≧",gel:"⋛",gEl:"⪌",geq:"≥",geqq:"≧",geqslant:"⩾",ges:"⩾",gescc:"⪩",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",gfr:"𝔤",Gfr:"𝔊",gg:"≫",Gg:"⋙",ggg:"⋙",gimel:"ℷ",gjcy:"ѓ",GJcy:"Ѓ",gl:"≷",gla:"⪥",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gne:"⪈",gnE:"≩",gneq:"⪈",gneqq:"≩",gnsim:"⋧",gopf:"𝕘",Gopf:"𝔾",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",gscr:"ℊ",Gscr:"𝒢",gsim:"≳",gsime:"⪎",gsiml:"⪐",gt:">",Gt:"≫",GT:">",gtcc:"⪧",gtcir:"⩺",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",hardcy:"ъ",HARDcy:"Ъ",harr:"↔",hArr:"⇔",harrcir:"⥈",harrw:"↭",Hat:"^",hbar:"ℏ",hcirc:"ĥ",Hcirc:"Ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",hfr:"𝔥",Hfr:"ℌ",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",hopf:"𝕙",Hopf:"ℍ",horbar:"―",HorizontalLine:"─",hscr:"𝒽",Hscr:"ℋ",hslash:"ℏ",hstrok:"ħ",Hstrok:"Ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",iacute:"í",Iacute:"Í",ic:"⁣",icirc:"î",Icirc:"Î",icy:"и",Icy:"И",Idot:"İ",iecy:"е",IEcy:"Е",iexcl:"¡",iff:"⇔",ifr:"𝔦",Ifr:"ℑ",igrave:"ì",Igrave:"Ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",ijlig:"ĳ",IJlig:"Ĳ",Im:"ℑ",imacr:"ī",Imacr:"Ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",imof:"⊷",imped:"Ƶ",Implies:"⇒",in:"∈",incare:"℅",infin:"∞",infintie:"⧝",inodot:"ı",int:"∫",Int:"∬",intcal:"⊺",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",iocy:"ё",IOcy:"Ё",iogon:"į",Iogon:"Į",iopf:"𝕚",Iopf:"𝕀",iota:"ι",Iota:"Ι",iprod:"⨼",iquest:"¿",iscr:"𝒾",Iscr:"ℐ",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",itilde:"ĩ",Itilde:"Ĩ",iukcy:"і",Iukcy:"І",iuml:"ï",Iuml:"Ï",jcirc:"ĵ",Jcirc:"Ĵ",jcy:"й",Jcy:"Й",jfr:"𝔧",Jfr:"𝔍",jmath:"ȷ",jopf:"𝕛",Jopf:"𝕁",jscr:"𝒿",Jscr:"𝒥",jsercy:"ј",Jsercy:"Ј",jukcy:"є",Jukcy:"Є",kappa:"κ",Kappa:"Κ",kappav:"ϰ",kcedil:"ķ",Kcedil:"Ķ",kcy:"к",Kcy:"К",kfr:"𝔨",Kfr:"𝔎",kgreen:"ĸ",khcy:"х",KHcy:"Х",kjcy:"ќ",KJcy:"Ќ",kopf:"𝕜",Kopf:"𝕂",kscr:"𝓀",Kscr:"𝒦",lAarr:"⇚",lacute:"ĺ",Lacute:"Ĺ",laemptyv:"⦴",lagran:"ℒ",lambda:"λ",Lambda:"Λ",lang:"⟨",Lang:"⟪",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",larr:"←",lArr:"⇐",Larr:"↞",larrb:"⇤",larrbfs:"⤟",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",lat:"⪫",latail:"⤙",lAtail:"⤛",late:"⪭",lates:"⪭︀",lbarr:"⤌",lBarr:"⤎",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",lcaron:"ľ",Lcaron:"Ľ",lcedil:"ļ",Lcedil:"Ļ",lceil:"⌈",lcub:"{",lcy:"л",Lcy:"Л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",le:"≤",lE:"≦",LeftAngleBracket:"⟨",leftarrow:"←",Leftarrow:"⇐",LeftArrow:"←",LeftArrowBar:"⇤",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVector:"⇃",LeftDownVectorBar:"⥙",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",leftrightarrow:"↔",Leftrightarrow:"⇔",LeftRightArrow:"↔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTee:"⊣",LeftTeeArrow:"↤",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangle:"⊲",LeftTriangleBar:"⧏",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVector:"↿",LeftUpVectorBar:"⥘",LeftVector:"↼",LeftVectorBar:"⥒",leg:"⋚",lEg:"⪋",leq:"≤",leqq:"≦",leqslant:"⩽",les:"⩽",lescc:"⪨",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",lfr:"𝔩",Lfr:"𝔏",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",ljcy:"љ",LJcy:"Љ",ll:"≪",Ll:"⋘",llarr:"⇇",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",lmidot:"ŀ",Lmidot:"Ŀ",lmoust:"⎰",lmoustache:"⎰",lnap:"⪉",lnapprox:"⪉",lne:"⪇",lnE:"≨",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",longleftarrow:"⟵",Longleftarrow:"⟸",LongLeftArrow:"⟵",longleftrightarrow:"⟷",Longleftrightarrow:"⟺",LongLeftRightArrow:"⟷",longmapsto:"⟼",longrightarrow:"⟶",Longrightarrow:"⟹",LongRightArrow:"⟶",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",lopf:"𝕝",Lopf:"𝕃",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",lscr:"𝓁",Lscr:"ℒ",lsh:"↰",Lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",lstrok:"ł",Lstrok:"Ł",lt:"<",Lt:"≪",LT:"<",ltcc:"⪦",ltcir:"⩹",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",map:"↦",Map:"⤅",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",mcy:"м",Mcy:"М",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",mfr:"𝔪",Mfr:"𝔐",mho:"℧",micro:"µ",mid:"∣",midast:"*",midcir:"⫰",middot:"·",minus:"−",minusb:"⊟",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",mopf:"𝕞",Mopf:"𝕄",mp:"∓",mscr:"𝓂",Mscr:"ℳ",mstpos:"∾",mu:"μ",Mu:"Μ",multimap:"⊸",mumap:"⊸",nabla:"∇",nacute:"ń",Nacute:"Ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natur:"♮",natural:"♮",naturals:"ℕ",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",ncaron:"ň",Ncaron:"Ň",ncedil:"ņ",Ncedil:"Ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",ncy:"н",Ncy:"Н",ndash:"–",ne:"≠",nearhk:"⤤",nearr:"↗",neArr:"⇗",nearrow:"↗",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",nfr:"𝔫",Nfr:"𝔑",nge:"≱",ngE:"≧̸",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",ngt:"≯",nGt:"≫⃒",ngtr:"≯",nGtv:"≫̸",nharr:"↮",nhArr:"⇎",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",njcy:"њ",NJcy:"Њ",nlarr:"↚",nlArr:"⇍",nldr:"‥",nle:"≰",nlE:"≦̸",nleftarrow:"↚",nLeftarrow:"⇍",nleftrightarrow:"↮",nLeftrightarrow:"⇎",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nlt:"≮",nLt:"≪⃒",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",nopf:"𝕟",Nopf:"ℕ",not:"¬",Not:"⫬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangle:"⋪",NotLeftTriangleBar:"⧏̸",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangle:"⋫",NotRightTriangleBar:"⧐̸",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",npar:"∦",nparallel:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",npre:"⪯̸",nprec:"⊀",npreceq:"⪯̸",nrarr:"↛",nrArr:"⇏",nrarrc:"⤳̸",nrarrw:"↝̸",nrightarrow:"↛",nRightarrow:"⇏",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",nscr:"𝓃",Nscr:"𝒩",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsube:"⊈",nsubE:"⫅̸",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupe:"⊉",nsupE:"⫆̸",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",ntilde:"ñ",Ntilde:"Ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",nu:"ν",Nu:"Ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nvdash:"⊬",nvDash:"⊭",nVdash:"⊮",nVDash:"⊯",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwarr:"↖",nwArr:"⇖",nwarrow:"↖",nwnear:"⤧",oacute:"ó",Oacute:"Ó",oast:"⊛",ocir:"⊚",ocirc:"ô",Ocirc:"Ô",ocy:"о",Ocy:"О",odash:"⊝",odblac:"ő",Odblac:"Ő",odiv:"⨸",odot:"⊙",odsold:"⦼",oelig:"œ",OElig:"Œ",ofcir:"⦿",ofr:"𝔬",Ofr:"𝔒",ogon:"˛",ograve:"ò",Ograve:"Ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",omacr:"ō",Omacr:"Ō",omega:"ω",Omega:"Ω",omicron:"ο",Omicron:"Ο",omid:"⦶",ominus:"⊖",oopf:"𝕠",Oopf:"𝕆",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",or:"∨",Or:"⩔",orarr:"↻",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",oscr:"ℴ",Oscr:"𝒪",oslash:"ø",Oslash:"Ø",osol:"⊘",otilde:"õ",Otilde:"Õ",otimes:"⊗",Otimes:"⨷",otimesas:"⨶",ouml:"ö",Ouml:"Ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",par:"∥",para:"¶",parallel:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",pcy:"п",Pcy:"П",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",pfr:"𝔭",Pfr:"𝔓",phi:"φ",Phi:"Φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",pi:"π",Pi:"Π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plus:"+",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",popf:"𝕡",Popf:"ℙ",pound:"£",pr:"≺",Pr:"⪻",prap:"⪷",prcue:"≼",pre:"⪯",prE:"⪳",prec:"≺",precapprox:"⪷",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",precsim:"≾",prime:"′",Prime:"″",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportion:"∷",Proportional:"∝",propto:"∝",prsim:"≾",prurel:"⊰",pscr:"𝓅",Pscr:"𝒫",psi:"ψ",Psi:"Ψ",puncsp:" ",qfr:"𝔮",Qfr:"𝔔",qint:"⨌",qopf:"𝕢",Qopf:"ℚ",qprime:"⁗",qscr:"𝓆",Qscr:"𝒬",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",quot:'"',QUOT:'"',rAarr:"⇛",race:"∽̱",racute:"ŕ",Racute:"Ŕ",radic:"√",raemptyv:"⦳",rang:"⟩",Rang:"⟫",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",rarr:"→",rArr:"⇒",Rarr:"↠",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",rarrtl:"↣",Rarrtl:"⤖",rarrw:"↝",ratail:"⤚",rAtail:"⤜",ratio:"∶",rationals:"ℚ",rbarr:"⤍",rBarr:"⤏",RBarr:"⤐",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",rcaron:"ř",Rcaron:"Ř",rcedil:"ŗ",Rcedil:"Ŗ",rceil:"⌉",rcub:"}",rcy:"р",Rcy:"Р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",Re:"ℜ",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",rect:"▭",reg:"®",REG:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",rfr:"𝔯",Rfr:"ℜ",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",rho:"ρ",Rho:"Ρ",rhov:"ϱ",RightAngleBracket:"⟩",rightarrow:"→",Rightarrow:"⇒",RightArrow:"→",RightArrowBar:"⇥",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVector:"⇂",RightDownVectorBar:"⥕",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTee:"⊢",RightTeeArrow:"↦",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangle:"⊳",RightTriangleBar:"⧐",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVector:"↾",RightUpVectorBar:"⥔",RightVector:"⇀",RightVectorBar:"⥓",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoust:"⎱",rmoustache:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",ropf:"𝕣",Ropf:"ℝ",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",rscr:"𝓇",Rscr:"ℛ",rsh:"↱",Rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",sacute:"ś",Sacute:"Ś",sbquo:"‚",sc:"≻",Sc:"⪼",scap:"⪸",scaron:"š",Scaron:"Š",sccue:"≽",sce:"⪰",scE:"⪴",scedil:"ş",Scedil:"Ş",scirc:"ŝ",Scirc:"Ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",scy:"с",Scy:"С",sdot:"⋅",sdotb:"⊡",sdote:"⩦",searhk:"⤥",searr:"↘",seArr:"⇘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",sfr:"𝔰",Sfr:"𝔖",sfrown:"⌢",sharp:"♯",shchcy:"щ",SHCHcy:"Щ",shcy:"ш",SHcy:"Ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",sigma:"σ",Sigma:"Σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",softcy:"ь",SOFTcy:"Ь",sol:"/",solb:"⧄",solbar:"⌿",sopf:"𝕤",Sopf:"𝕊",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",squ:"□",square:"□",Square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squf:"▪",srarr:"→",sscr:"𝓈",Sscr:"𝒮",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",star:"☆",Star:"⋆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",sub:"⊂",Sub:"⋐",subdot:"⪽",sube:"⊆",subE:"⫅",subedot:"⫃",submult:"⫁",subne:"⊊",subnE:"⫋",subplus:"⪿",subrarr:"⥹",subset:"⊂",Subset:"⋐",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succ:"≻",succapprox:"⪸",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",sum:"∑",Sum:"∑",sung:"♪",sup:"⊃",Sup:"⋑",sup1:"¹",sup2:"²",sup3:"³",supdot:"⪾",supdsub:"⫘",supe:"⊇",supE:"⫆",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supne:"⊋",supnE:"⫌",supplus:"⫀",supset:"⊃",Supset:"⋑",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swarr:"↙",swArr:"⇙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",tau:"τ",Tau:"Τ",tbrk:"⎴",tcaron:"ť",Tcaron:"Ť",tcedil:"ţ",Tcedil:"Ţ",tcy:"т",Tcy:"Т",tdot:"⃛",telrec:"⌕",tfr:"𝔱",Tfr:"𝔗",there4:"∴",therefore:"∴",Therefore:"∴",theta:"θ",Theta:"Θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",thinsp:" ",ThinSpace:" ",thkap:"≈",thksim:"∼",thorn:"þ",THORN:"Þ",tilde:"˜",Tilde:"∼",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",times:"×",timesb:"⊠",timesbar:"⨱",timesd:"⨰",tint:"∭",toea:"⤨",top:"⊤",topbot:"⌶",topcir:"⫱",topf:"𝕥",Topf:"𝕋",topfork:"⫚",tosa:"⤩",tprime:"‴",trade:"™",TRADE:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",tscr:"𝓉",Tscr:"𝒯",tscy:"ц",TScy:"Ц",tshcy:"ћ",TSHcy:"Ћ",tstrok:"ŧ",Tstrok:"Ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",uacute:"ú",Uacute:"Ú",uarr:"↑",uArr:"⇑",Uarr:"↟",Uarrocir:"⥉",ubrcy:"ў",Ubrcy:"Ў",ubreve:"ŭ",Ubreve:"Ŭ",ucirc:"û",Ucirc:"Û",ucy:"у",Ucy:"У",udarr:"⇅",udblac:"ű",Udblac:"Ű",udhar:"⥮",ufisht:"⥾",ufr:"𝔲",Ufr:"𝔘",ugrave:"ù",Ugrave:"Ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",umacr:"ū",Umacr:"Ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",uogon:"ų",Uogon:"Ų",uopf:"𝕦",Uopf:"𝕌",uparrow:"↑",Uparrow:"⇑",UpArrow:"↑",UpArrowBar:"⤒",UpArrowDownArrow:"⇅",updownarrow:"↕",Updownarrow:"⇕",UpDownArrow:"↕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",upsi:"υ",Upsi:"ϒ",upsih:"ϒ",upsilon:"υ",Upsilon:"Υ",UpTee:"⊥",UpTeeArrow:"↥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",uring:"ů",Uring:"Ů",urtri:"◹",uscr:"𝓊",Uscr:"𝒰",utdot:"⋰",utilde:"ũ",Utilde:"Ũ",utri:"▵",utrif:"▴",uuarr:"⇈",uuml:"ü",Uuml:"Ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",varr:"↕",vArr:"⇕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",vBar:"⫨",Vbar:"⫫",vBarv:"⫩",vcy:"в",Vcy:"В",vdash:"⊢",vDash:"⊨",Vdash:"⊩",VDash:"⊫",Vdashl:"⫦",vee:"∨",Vee:"⋁",veebar:"⊻",veeeq:"≚",vellip:"⋮",verbar:"|",Verbar:"‖",vert:"|",Vert:"‖",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",vfr:"𝔳",Vfr:"𝔙",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",vopf:"𝕧",Vopf:"𝕍",vprop:"∝",vrtri:"⊳",vscr:"𝓋",Vscr:"𝒱",vsubne:"⊊︀",vsubnE:"⫋︀",vsupne:"⊋︀",vsupnE:"⫌︀",Vvdash:"⊪",vzigzag:"⦚",wcirc:"ŵ",Wcirc:"Ŵ",wedbar:"⩟",wedge:"∧",Wedge:"⋀",wedgeq:"≙",weierp:"℘",wfr:"𝔴",Wfr:"𝔚",wopf:"𝕨",Wopf:"𝕎",wp:"℘",wr:"≀",wreath:"≀",wscr:"𝓌",Wscr:"𝒲",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",xfr:"𝔵",Xfr:"𝔛",xharr:"⟷",xhArr:"⟺",xi:"ξ",Xi:"Ξ",xlarr:"⟵",xlArr:"⟸",xmap:"⟼",xnis:"⋻",xodot:"⨀",xopf:"𝕩",Xopf:"𝕏",xoplus:"⨁",xotime:"⨂",xrarr:"⟶",xrArr:"⟹",xscr:"𝓍",Xscr:"𝒳",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",yacute:"ý",Yacute:"Ý",yacy:"я",YAcy:"Я",ycirc:"ŷ",Ycirc:"Ŷ",ycy:"ы",Ycy:"Ы",yen:"¥",yfr:"𝔶",Yfr:"𝔜",yicy:"ї",YIcy:"Ї",yopf:"𝕪",Yopf:"𝕐",yscr:"𝓎",Yscr:"𝒴",yucy:"ю",YUcy:"Ю",yuml:"ÿ",Yuml:"Ÿ",zacute:"ź",Zacute:"Ź",zcaron:"ž",Zcaron:"Ž",zcy:"з",Zcy:"З",zdot:"ż",Zdot:"Ż",zeetrf:"ℨ",ZeroWidthSpace:"​",zeta:"ζ",Zeta:"Ζ",zfr:"𝔷",Zfr:"ℨ",zhcy:"ж",ZHcy:"Ж",zigrarr:"⇝",zopf:"𝕫",Zopf:"ℤ",zscr:"𝓏",Zscr:"𝒵",zwj:"‍",zwnj:"‌"},y={aacute:"á",Aacute:"Á",acirc:"â",Acirc:"Â",acute:"´",aelig:"æ",AElig:"Æ",agrave:"à",Agrave:"À",amp:"&",AMP:"&",aring:"å",Aring:"Å",atilde:"ã",Atilde:"Ã",auml:"ä",Auml:"Ä",brvbar:"¦",ccedil:"ç",Ccedil:"Ç",cedil:"¸",cent:"¢",copy:"©",COPY:"©",curren:"¤",deg:"°",divide:"÷",eacute:"é",Eacute:"É",ecirc:"ê",Ecirc:"Ê",egrave:"è",Egrave:"È",eth:"ð",ETH:"Ð",euml:"ë",Euml:"Ë",frac12:"½",frac14:"¼",frac34:"¾",gt:">",GT:">",iacute:"í",Iacute:"Í",icirc:"î",Icirc:"Î",iexcl:"¡",igrave:"ì",Igrave:"Ì",iquest:"¿",iuml:"ï",Iuml:"Ï",laquo:"«",lt:"<",LT:"<",macr:"¯",micro:"µ",middot:"·",nbsp:" ",not:"¬",ntilde:"ñ",Ntilde:"Ñ",oacute:"ó",Oacute:"Ó",ocirc:"ô",Ocirc:"Ô",ograve:"ò",Ograve:"Ò",ordf:"ª",ordm:"º",oslash:"ø",Oslash:"Ø",otilde:"õ",Otilde:"Õ",ouml:"ö",Ouml:"Ö",para:"¶",plusmn:"±",pound:"£",quot:'"',QUOT:'"',raquo:"»",reg:"®",REG:"®",sect:"§",shy:"­",sup1:"¹",sup2:"²",sup3:"³",szlig:"ß",thorn:"þ",THORN:"Þ",times:"×",uacute:"ú",Uacute:"Ú",ucirc:"û",Ucirc:"Û",ugrave:"ù",Ugrave:"Ù",uml:"¨",uuml:"ü",Uuml:"Ü",yacute:"ý",Yacute:"Ý",yen:"¥",yuml:"ÿ"},v={0:"�",128:"€",130:"‚",131:"ƒ",132:"„",133:"…",134:"†",135:"‡",136:"ˆ",137:"‰",138:"Š",139:"‹",140:"Œ",142:"Ž",145:"‘",146:"’",147:"“",148:"”",149:"•",150:"–",151:"—",152:"˜",153:"™",154:"š",155:"›",156:"œ",158:"ž",159:"Ÿ"},w=[1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65e3,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111],S=String.fromCharCode,x={}.hasOwnProperty,k=function(e,t){return x.call(e,t)},E=function(e,t){if(!e)return t;var i,a={};for(i in t)a[i]=k(e,i)?e[i]:t[i];return a},A=function(e,t){var i="";return e>=55296&&e<=57343||e>1114111?(t&&L("character reference outside the permissible Unicode range"),"�"):k(v,e)?(t&&L("disallowed character reference"),v[e]):(t&&function(e,t){for(var i=-1,a=e.length;++i<a;)if(e[i]==t)return!0;return!1}(w,e)&&L("disallowed character reference"),e>65535&&(i+=S((e-=65536)>>>10&1023|55296),e=56320|1023&e),i+=S(e))},D=function(e){return"&#x"+e.toString(16).toUpperCase()+";"},T=function(e){return"&#"+e+";"},L=function(e){throw Error("Parse error: "+e)},C=function(e,t){(t=E(t,C.options)).strict&&g.test(e)&&L("forbidden code point");var i=t.encodeEverything,a=t.useNamedReferences,s=t.allowUnsafeSymbols,r=t.decimal?T:D,n=function(e){return r(e.charCodeAt(0))};return i?(e=e.replace(l,(function(e){return a&&k(h,e)?"&"+h[e]+";":n(e)})),a&&(e=e.replace(/&gt;\u20D2/g,"&nvgt;").replace(/&lt;\u20D2/g,"&nvlt;").replace(/&#x66;&#x6A;/g,"&fjlig;")),a&&(e=e.replace(u,(function(e){return"&"+h[e]+";"})))):a?(s||(e=e.replace(d,(function(e){return"&"+h[e]+";"}))),e=(e=e.replace(/&gt;\u20D2/g,"&nvgt;").replace(/&lt;\u20D2/g,"&nvlt;")).replace(u,(function(e){return"&"+h[e]+";"}))):s||(e=e.replace(d,n)),e.replace(o,(function(e){var t=e.charCodeAt(0),i=e.charCodeAt(1);return r(1024*(t-55296)+i-56320+65536)})).replace(c,n)};C.options={allowUnsafeSymbols:!1,encodeEverything:!1,strict:!1,useNamedReferences:!1,decimal:!1};var q=function(e,t){var i=(t=E(t,q.options)).strict;return i&&m.test(e)&&L("malformed character reference"),e.replace(f,(function(e,a,s,r,n,o,l,c,u){var h,d,p,m,g,f;return a?b[g=a]:s?(g=s,(f=r)&&t.isAttributeValue?(i&&"="==f&&L("`&` did not start a character reference"),e):(i&&L("named character reference was not terminated by a semicolon"),y[g]+(f||""))):n?(p=n,d=o,i&&!d&&L("character reference was not terminated by a semicolon"),h=parseInt(p,10),A(h,i)):l?(m=l,d=c,i&&!d&&L("character reference was not terminated by a semicolon"),h=parseInt(m,16),A(h,i)):(i&&L("named character reference was not terminated by a semicolon"),e)}))};q.options={isAttributeValue:!1,strict:!1};var I={version:"1.2.0",encode:C,decode:q,escape:function(e){return e.replace(d,(function(e){return p[e]}))},unescape:q};void 0===(a=function(){return I}.call(t,i,t,e))||(e.exports=a)}()},872:function(e,t,i){"use strict";var a=i(496),s=Array.prototype.concat,r=Array.prototype.slice,n=e.exports=function(e){for(var t=[],i=0,n=e.length;i<n;i++){var o=e[i];a(o)?t=s.call(t,r.call(o)):t.push(o)}return t};n.wrap=function(e){return function(){return e(n(arguments))}}},496:function(e){e.exports=function(e){return!(!e||"string"==typeof e)&&(e instanceof Array||Array.isArray(e)||e.length>=0&&(e.splice instanceof Function||Object.getOwnPropertyDescriptor(e,e.length-1)&&"String"!==e.constructor.name))}}},t={};function i(a){var s=t[a];if(void 0!==s)return s.exports;var r=t[a]={id:a,loaded:!1,exports:{}};return e[a].call(r.exports,r,r.exports,i),r.loaded=!0,r.exports}i.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),i.nmd=function(e){return e.paths=[],e.children||(e.children=[]),e},function(){"use strict";var e=JSON.parse('[{"name":"showTitleScreen","label":"Show title screen","description":"If checked, a title screen will show up when starting.","type":"boolean","default":false,"optional":true},{"name":"titleScreen","label":"Title screen","type":"group","importance":"low","fields":[{"name":"titleScreenIntroduction","label":"Introduction","type":"text","widget":"html","placeholder":"Welcome to ...","optional":true,"enterMode":"div","tags":["sub","sup","strong","em","p","code","u","del","a","ul","ol","hr","pre","code"],"font":{"size":true,"color":true,"background":true},"default":"<p style=\\"text-align: center;\\"></p>"},{"name":"titleScreenMedium","label":"Title screen media","type":"library","optional":true,"options":["H5P.Image 1.1","H5P.Video 1.6"]}],"widget":"showWhen","showWhen":{"rules":[{"field":"showTitleScreen","equals":true}]}},{"name":"headline","label":"Headline","type":"text","description":"Optional headline for the titlebar.","optional":true},{"name":"gamemapSteps","type":"group","label":"Game map editor","importance":"high","widget":"wizard","fields":[{"name":"backgroundImageSettings","label":"Background image","type":"group","importance":"high","fields":[{"name":"backgroundImage","type":"image","label":"Background image","importance":"high","description":"Select an image to use as the background of the game map."},{"name":"dummy","type":"boolean","label":"Dummy","widget":"none"}]},{"name":"gamemap","label":"Game map","type":"group","importance":"high","widget":"gamemap","fields":[{"name":"dummy","type":"boolean","widget":"none","optional":true},{"name":"elements","type":"list","label":"Elements","importance":"high","entity":"Element","field":{"name":"elements","type":"group","label":"Elements","importance":"high","fields":[{"name":"id","type":"text","label":"Id","widget":"none"},{"name":"type","type":"text","label":"Type","widget":"none"},{"name":"label","type":"text","label":"Stage label","description":"This label will be displayed on top of your exercise and will help you to connect different stages with one another.","importance":"medium"},{"name":"canBeStartStage","type":"boolean","label":"User can start here","description":"If checked, this stage will be a stage that the user start at. If no stage or more than one stage can be the start stage, the starting stage will be chosen randomly.","importance":"medium","default":false},{"name":"time","type":"group","label":"Time limit","description":"Define timer related settings.","fields":[{"name":"timeLimit","type":"number","label":"Time limit","description":"Optional time limit in seconds. If a user exceeds this time, the exercise will close, be reset, and the user will loose a life if lives are limited.","min":1,"optional":true},{"name":"timeoutWarning","type":"number","label":"Timeout warning time","description":"Optionally set when a timeout warning audio should be played (number of remaining seconds). An audio needs to be set in the audio settings.","min":1,"optional":true}]},{"name":"accessRestrictions","type":"group","label":"Access restrictions","description":"Define restrictions for unlocking.","fields":[{"name":"minScore","type":"number","label":"Minimum score to unlock","description":"The user will not be able to unlock this stage if he has not received at least this minimum score by completing other stages. Please note that this setting will have no effect if \\"free roaming\\" is set in the behavioural settings.","min":0,"optional":true},{"name":"openOnScoreSufficient","type":"boolean","label":"Open once score sufficient","description":"If there has been an attempt to unlock the stage with insufficient score, should the stage unlock automatically once the score becomes sufficient.","default":false,"optional":true}]},{"name":"contentType","type":"library","label":"Stage content","description":"Choose the type of content you would like to add.","importance":"high","options":["H5P.Accordion 1.0","H5P.Agamotto 1.6","H5P.Audio 1.5","H5P.AudioRecorder 1.0","H5P.CombinationLock 1.0","H5P.CoursePresentation 1.25","H5P.Dialogcards 1.9","H5P.DragQuestion 1.14","H5P.DragText 1.10","H5P.Essay 1.5","H5P.Blanks 1.14","H5P.ImageHotspotQuestion 1.8","H5P.Image 1.1","H5P.MultiMediaChoice 0.3","H5P.ImageHotspots 1.10","H5P.ImageSlider 1.1","H5P.InteractiveVideo 1.26","H5P.MarkTheWords 1.11","H5P.MemoryGame 1.3","H5P.MultiChoice 1.16","H5P.QuestionSet 1.20","H5P.SingleChoiceSet 1.11","H5P.Tabs 1.1","H5P.AdvancedText 1.1","H5P.Transcript 1.1","H5P.TrueFalse 1.8","H5P.Video 1.6","H5P.XRay 0.1"]},{"name":"specialStageType","type":"select","label":"Special stage type","options":[{"value":"finish","label":"Finish"},{"value":"extra-life","label":"Extra life"},{"value":"extra-time","label":"Extra time"}]},{"name":"specialStageExtraLives","type":"number","label":"Number of extra lives","description":"Set how many lives the user will get when entering this stage.","default":1,"min":1},{"name":"specialStageExtraTime","type":"number","label":"Number of seconds of extra time","description":"Set how many seceonds the user will gain for the global time limit when entering this stage.","default":1,"min":1},{"name":"neighbors","type":"select","label":"Connected stages","widget":"gamemapdynamiccheckboxes","importance":"medium","multiple":true},{"name":"telemetry","type":"group","label":"Telemetry","importance":"low","widget":"none","fields":[{"name":"x","type":"text"},{"name":"y","type":"text"},{"name":"height","type":"text"},{"name":"width","type":"text"}]}]}}]}]},{"name":"endScreen","label":"End screen","type":"group","importance":"low","fields":[{"name":"noSuccess","label":"User not successful","type":"group","importance":"low","fields":[{"name":"endScreenTextNoSuccess","label":"Message (user not successful)","type":"text","widget":"html","placeholder":"You did not make it this time ...","optional":true,"enterMode":"div","tags":["sub","sup","strong","em","p","code","u","del","a","ul","ol","hr","pre","code"],"font":{"size":true,"color":true,"background":true},"default":"<p style=\\"text-align: center;\\"></p>"},{"name":"endScreenMediumNoSuccess","label":"End screen media (user not successful)","type":"library","optional":true,"options":["H5P.Image 1.1","H5P.Video 1.6"]}]},{"name":"success","label":"User successful","type":"group","importance":"low","fields":[{"name":"endScreenTextSuccess","label":"Message (user successful)","type":"text","widget":"html","placeholder":"You made it ...","optional":true,"enterMode":"div","tags":["sub","sup","strong","em","p","code","u","del","a","ul","ol","hr","pre","code"],"font":{"size":true,"color":true,"background":true},"default":"<p style=\\"text-align: center;\\"></p>"},{"name":"endScreenMediumSuccess","label":"End screen media (user successful)","type":"library","optional":true,"options":["H5P.Image 1.1","H5P.Video 1.6"]}]},{"name":"overallFeedback","type":"group","label":"Overall Feedback","importance":"low","expanded":true,"fields":[{"name":"overallFeedback","type":"list","widgets":[{"name":"RangeList","label":"Default"}],"importance":"high","label":"Define custom feedback for any score range","description":"Click the \\"Add range\\" button to add as many ranges as you need. Example: 0-20% Bad score, 21-91% Average Score, 91-100% Great Score!","entity":"range","min":1,"defaultNum":1,"optional":true,"field":{"name":"overallFeedback","type":"group","importance":"low","fields":[{"name":"from","type":"number","label":"Score Range","min":0,"max":100,"default":0,"unit":"%"},{"name":"to","type":"number","min":0,"max":100,"default":100,"unit":"%"},{"name":"feedback","type":"text","label":"Feedback for defined score range","importance":"low","placeholder":"Fill in the feedback","optional":true}]}}]}]},{"name":"visual","type":"group","importance":"low","label":"Visual settings","fields":[{"name":"stages","type":"group","label":"Stages","importance":"low","optional":true,"fields":[{"name":"colorStage","type":"text","label":"Color not visited stage","optional":true,"default":"rgba(250, 223, 10, 0.7)","widget":"colorSelector","spectrum":{"showInput":true,"showInitial":true,"showAlpha":true,"preferredFormat":"rgb"}},{"name":"colorStageLocked","type":"text","label":"Color locked stage","optional":true,"default":"rgba(153, 0, 0, 0.7)","widget":"colorSelector","spectrum":{"showInput":true,"showInitial":true,"showAlpha":true,"preferredFormat":"rgb"}},{"name":"colorStageCleared","type":"text","label":"Color cleared stage","optional":true,"default":"rgba(0, 130, 0, 0.7)","widget":"colorSelector","spectrum":{"showInput":true,"showInitial":true,"showAlpha":true,"preferredFormat":"rgb"}}]},{"name":"paths","type":"group","label":"Paths","importance":"low","optional":true,"fields":[{"name":"displayPaths","type":"boolean","label":"Display paths","description":"Choose whether paths will be displayed on the map. Please note: The paths are always visible in the editor.","optional":true,"default":true},{"name":"style","type":"group","label":"Style","importance":"low","expanded":true,"fields":[{"name":"colorPath","type":"text","label":"Color path","optional":true,"default":"rgba(0, 0, 0, 0.7)","widget":"colorSelector","spectrum":{"showInput":true,"showInitial":true,"showAlpha":true,"preferredFormat":"rgb"}},{"name":"colorPathCleared","type":"text","label":"Color path cleared","optional":true,"default":"rgba(0, 130, 0, 0.7)","widget":"colorSelector","spectrum":{"showInput":true,"showInitial":true,"showAlpha":true,"preferredFormat":"rgb"}},{"name":"pathWidth","type":"select","label":"Path width","importance":"low","default":"0.2","optional":false,"options":[{"value":"0.1","label":"thin"},{"value":"0.2","label":"medium"},{"value":"0.3","label":"thick"}]},{"name":"pathStyle","type":"select","label":"Path style","importance":"low","default":"dotted","optional":false,"options":[{"value":"solid","label":"Solid"},{"value":"dotted","label":"Dotted"},{"value":"dashed","label":"Dashed"},{"value":"double","label":"Double"}]}]}]},{"name":"misc","type":"group","label":"Miscellaneous","collapsed":true,"importance":"low","fields":[{"name":"useAnimation","type":"boolean","label":"Animate map","description":"Decide if the map should be animated. Even if you set this option, the content type will honor the users\' browser setting if they prefer reduced motion.","default":true},{"name":"dummy","type":"boolean","label":"Dummy","widget":"none"}]}]},{"name":"audio","type":"group","importance":"low","label":"Audio settings","fields":[{"name":"backgroundMusic","type":"group","importance":"low","label":"Background music","fields":[{"name":"music","type":"audio","label":"Background music","importance":"low","optional":true},{"name":"muteDuringExercise","type":"boolean","label":"Mute when taking exercises","default":true,"optional":true}]},{"name":"ambient","type":"group","importance":"low","label":"Events","fields":[{"name":"clickStageLocked","type":"audio","label":"Click on locked stage","description":"Will be played on the map when clicking on a locked stage.","importance":"low","optional":true},{"name":"checkExerciseNotFullScore","type":"audio","label":"Check exercise (not full score)","description":"Will be played when an answer is checked and the user did not get full score.","importance":"low","optional":true},{"name":"checkExerciseFullScore","type":"audio","label":"Check exercise (full score)","description":"Will be played when an answer is checked and the user did get full score.","importance":"low","optional":true},{"name":"unlockStage","type":"audio","label":"Unlocking a stage","description":"Will be played on the map when a stage gets unlocked.","importance":"low","optional":true},{"name":"openExercise","type":"audio","label":"Open exercise","description":"Will be played when an exercise is opened.","importance":"low","optional":true},{"name":"closeExercise","type":"audio","label":"Close exercise","description":"Will be played when an exercise is closed.","importance":"low","optional":true},{"name":"showDialog","type":"audio","label":"Show dialog","description":"Will be played when a confirmation dialog is shown.","importance":"low","optional":true},{"name":"fullScore","type":"audio","label":"Full score","description":"Will be played when the user reaches full score for the map.","importance":"low","optional":true},{"name":"lostLife","type":"audio","label":"Lost a life","description":"Will be played when the user loses a life.","importance":"low","optional":true},{"name":"gainedLife","type":"audio","label":"Gained life","description":"Will be played when the user gains a life.","importance":"low","optional":true},{"name":"gameOver","type":"audio","label":"Game over","description":"Will be played when the user is game over.","importance":"low","optional":true},{"name":"extraTime","type":"audio","label":"Gained extra time","description":"Will be played when the user gains extra time.","importance":"low","optional":true},{"name":"timeoutWarning","type":"audio","label":"Timeout warning","description":"Will be played when the user is running out of time for an exercise or if the global time runs out.","importance":"low","optional":true},{"name":"endscreenNoSuccess","type":"audio","label":"End screen (not full score)","description":"Will be played on the end screen if the user did not get full score.","importance":"low","optional":true},{"name":"endscreenSuccess","type":"audio","label":"End screen (full score)","description":"Will be played on the end screen if the user got full score.","importance":"low","optional":true}]}]},{"name":"behaviour","type":"group","importance":"low","label":"Behavioural settings","fields":[{"name":"lives","label":"Lives","description":"Set the number of lives for a user or leave empty for unlimited lives. Users will lose a life when they do not get full score and they cannot continue once all lives are lost.","type":"number","importance":"low","min":1,"optional":true},{"name":"timeLimitGlobal","type":"number","label":"Global time limit","description":"Optional time limit in seconds for the whole game. If a user exceeds this time, the game will be over immediately.","min":1,"optional":true},{"name":"timeoutWarningGlobal","type":"number","label":"Timeout warning time","description":"Optionally set when a timeout warning audio should be played (number of remaining seconds). An audio needs to be set in the audio settings.","min":1,"optional":true},{"name":"finishScore","type":"number","label":"Finish score","description":"Optional score that can be lower than the summed maximum score of all exercises, so users can receive full score without completing all exercises.","min":0,"optional":true},{"name":"enableRetry","label":"Enable \\"Retry\\" button","type":"boolean","importance":"low","default":true,"optional":true},{"name":"enableSolutionsButton","label":"Enable \\"Show solutions\\" button","type":"boolean","importance":"low","default":true,"optional":true},{"name":"map","type":"group","label":"Map","fields":[{"name":"showLabels","type":"boolean","label":"Show stage labels","description":"Choose whether a stage\'s label will be shown on hovering a stage with the mouse. The label will not show on touch devices.","default":true},{"name":"roaming","type":"select","label":"Roaming","description":"Choose whether users can roam all stages freely, need to finish a stage to get access to that stage\'s neighbors, or need to pass a stage to get access to that stage\'s neigbors.","options":[{"value":"free","label":"Roam freely"},{"value":"complete","label":"Complete to clear stage"},{"value":"success","label":"Succeed to clear stage"}],"default":"free"},{"name":"fog","type":"select","label":"Visibility range","description":"Select how far the user can see ahead","optional":true,"options":[{"value":"all","label":"See all stages"},{"value":"1","label":"See all unlocked stages and their adjacent neighbors"},{"value":"0","label":"See only unlocked stages"}],"default":"all","widget":"showWhen","showWhen":{"nullWhenHidden":true,"rules":[{"field":"roaming","equals":["complete","success"]}]}}]}]},{"name":"l10n","type":"group","label":"User interface","common":true,"fields":[{"name":"start","type":"text","label":"Start","default":"Start"},{"name":"continue","type":"text","label":"Continue","default":"Continue"},{"name":"restart","type":"text","label":"Restart","default":"Restart"},{"name":"showSolutions","type":"text","label":"Show solutions","default":"Show solutions"},{"name":"completedMap","type":"text","label":"Completed the map","default":"You have completed the map!"},{"name":"fullScoreButnoLivesLeft","type":"text","label":"Full score, but no lives left","default":"You have achieved full score, but lost all your lifes!"},{"name":"fullScoreButTimeout","type":"text","label":"Full score, but timed out","default":"You have achieved full score, but ran out of time!"},{"name":"confirmFinishHeader","type":"text","label":"Dialog header finish map","default":"Finish map?"},{"name":"confirmFinishDialog","type":"text","label":"Dialog text finish map: General","default":"If you finish now, you will not be able to explore the map any longer."},{"name":"confirmFinishDialogSubmission","type":"text","label":"Dialog text finish map: Submission","default":"Your score will be submitted."},{"name":"confirmFinishDialogQuestion","type":"text","label":"Dialog text finish map: Question","default":"Do you really want to finish the map?"},{"name":"confirmAccessDeniedHeader","type":"text","label":"Dialog header access denied","default":"Stage locked"},{"name":"confirmAccessDeniedDialog","type":"text","label":"Dialog text access denied: General","default":"This stage requires you to meet some goals before it can be opened."},{"name":"confirmAccessDeniedMinScore","type":"text","label":"Dialog text access denied: Minimum score","description":"@minscore is a placeholder and will be replaced with the respective value.","default":"You need at least a certain number of points: @minscore"},{"name":"yes","type":"text","label":"Yes","default":"Yes"},{"name":"no","type":"text","label":"No","default":"No"},{"name":"confirmGameOverHeader","type":"text","label":"Dialog header game over","default":"Game over!"},{"name":"confirmGameOverDialog","type":"text","label":"Dialog text game over","default":"You have lost all your lives. Please try again!"},{"name":"confirmGameOverDialogTimeout","type":"text","label":"Dialog text game over by timeout","default":"You have run out of time. Please try again!"},{"name":"confirmTimeoutHeader","type":"text","label":"Dialog header time out","default":"Time out!"},{"name":"confirmTimeoutDialog","type":"text","label":"Dialog text time out","default":"You ran out of time."},{"name":"confirmTimeoutDialogLostLife","type":"text","label":"Dialog text time out (lost a life)","default":"You ran out of time and lost a life."},{"name":"confirmScoreIncompleteHeader","type":"text","label":"Dialog header score incomplete","default":"Not full score!"},{"name":"confirmIncompleteScoreDialogLostLife","type":"text","label":"Dialog text score incomplete (lost a life)","default":"You did not achieve full score and lost a life."},{"name":"confirmFullScoreHeader","type":"text","label":"Dialog header full score","default":"You achieved full score!"},{"name":"confirmFullScoreDialog","type":"text","label":"Dialog text full score","default":"You have collected enough points to finish this map with a full score, but you are free to explore the rest if you wish to."},{"name":"confirmFullScoreDialogLoseLivesAmendmend","type":"text","label":"Dialog text full score (amendment, if lives are set)","default":"But beware! You may still lose lives!"},{"name":"ok","type":"text","label":"OK","default":"OK"},{"name":"noBackground","type":"text","label":"No background image was set","default":"No background image was set for the map."},{"name":"noStages","type":"text","label":"No stages were set","default":"No valid stages were set for the map."}]},{"name":"a11y","type":"group","label":"Accessibility texts","common":true,"fields":[{"name":"buttonFinish","type":"text","label":"Finish","default":"Finish the map"},{"name":"buttonAudioActive","type":"text","label":"Audio button (unmuted)","default":"Mute audio. Currently unmuted."},{"name":"buttonAudioInactive","type":"text","label":"Audio button (muted)","default":"Unmute audio. Currently muted."},{"name":"close","type":"text","label":"Close","default":"Close"},{"name":"yourResult","type":"text","label":"Your result","description":"@score will be replaced by the number of points. @total will be replaced by the maximum possible points.","importance":"low","default":"You got @score out of @total points"},{"name":"mapWasOpened","type":"text","label":"Map was opened","importance":"low","default":"The map was opened."},{"name":"mapSolutionsWasOpened","type":"text","label":"Map was opened (solutions mode)","importance":"low","default":"The map was opened in solutions mode."},{"name":"startScreenWasOpened","type":"text","label":"Title screen was opened","importance":"low","default":"The title screen was opened."},{"name":"endScreenWasOpened","type":"text","label":"End screen was opened","importance":"low","default":"The end screen was opened."},{"name":"exerciseLabel","type":"text","label":"Exercise label","description":"@stagelabel is a placeholder and will be replaced with the respective stage label.","importance":"low","default":". Exercise for @stagelabel"},{"name":"stageButtonLabel","type":"text","label":"Stage button label","description":"@stagelabel is a placeholder and will be replaced with the respective stage label.","importance":"low","default":"Stage: @stagelabel"},{"name":"adjacentStageLabel","type":"text","label":"adjacent stage label","description":"@stagelabelOrigin and @stagelabelNeighbor are placeholders and will be replaced with the respective stage labels.","importance":"low","default":"Adjacent stage of @stagelabelOrigin: @stagelabelNeighbor"},{"name":"locked","type":"text","label":"Locked","importance":"low","default":"Locked"},{"name":"cleared","type":"text","label":"Cleared","importance":"low","default":"Cleared"},{"name":"applicationInstructions","type":"text","label":"Description of map navigation","importance":"low","default":"Use space or enter key to activate current stage. Use arrow keys to select adjacent stage. Use space or enter key on adjacent stage to navigate there."},{"name":"applicationDescription","type":"text","label":"Description of map","importance":"low","default":"Map"},{"name":"movedToStage","type":"text","label":"Moved to stage","description":"@stagelabel is a placeholder and will be replaced with the respective stage label.","importance":"low","default":"Moved to @stagelabel"},{"name":"stageUnlocked","type":"text","label":"Unlocked stage","description":"@stagelabel is a placeholder and will be replaced with the respective stage label.","importance":"low","default":"Stage @stagelabel was unlocked."},{"name":"toolbarFallbackLabel","type":"text","label":"Toolbar fallback label","importance":"low","default":"Game Map"},{"name":"enterFullscreen","type":"text","label":"Enter fullscreen","importance":"low","default":"Enter fullscreen mode"},{"name":"exitFullscreen","type":"text","label":"Exit fullscreen","importance":"low","default":"Exit fullscreen mode"}]}]');let t=function(){function t(){}return t.isInstanceTask=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!e)return!1;if(e.isTask)return e.isTask;return!!("function"==typeof e.getMaxScore&&e.getMaxScore()>0)},t.getSemanticsDefaults=function(){let i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:e,a={};return Array.isArray(i)?(i.forEach((e=>{if("string"==typeof e.name)if(void 0!==e.default&&(a[e.name]=e.default),"list"===e.type)a[e.name]=[];else if("group"===e.type&&e.fields){const i=t.getSemanticsDefaults(e.fields);Object.keys(i).length&&(a[e.name]=i)}})),a):a},t}();var a=i(67);let s=function(){function e(){}return e.extend=function(){for(let e=1;e<arguments.length;e++)for(let t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&("object"==typeof arguments[0][t]&&"object"==typeof arguments[e][t]?this.extend(arguments[0][t],arguments[e][t]):arguments[0][t]=arguments[e][t]);return arguments[0]},e.formatLanguageCode=function(e){if("string"!=typeof e)return e;const t=e.split("-");return t[0]=t[0].toLowerCase(),t.length>1&&(t[1]=t[1].toUpperCase()),e=t.join("-")},e.supportsTouch=function(){return"ontouchstart"in window||navigator.maxTouchPoints>0},e.isHTMLWidgetFilled=function(e){const t=document.createElement("div");return t.innerHTML=e,t.firstChild?.innerText?.length>0},e.addMixins=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];if(!e.prototype)return;Array.isArray(t)||(t=[t]);const i=e.prototype;t.forEach((e=>{const t=e.prototype;Object.getOwnPropertyNames(t).forEach((e=>{"constructor"!==e&&(Object.getOwnPropertyNames(i).includes(e)||(i[e]=t[e]))}))}))},e.purifyHTML=function(e){if("string"!=typeof e)return"";let t=a.decode(e);const i=document.createElement("div");return i.innerHTML=t,t=i.textContent||i.innerText||"",t},e.callOnceVisible=async function(e,t){let i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};if("object"==typeof e&&"function"==typeof t)return i.threshold=i.threshold||0,await new Promise((a=>{(window.requestIdleCallback?window.requestIdleCallback:window.requestAnimationFrame)((()=>{const s=new IntersectionObserver((i=>{i[0].isIntersecting&&(s.unobserve(e),s.disconnect(),t())}),{...i.root&&{root:i.root},threshold:i.threshold});s.observe(e),a(s)}))}))},e}(),r=function(){function e(){this.translation={}}var t=e.prototype;return t.fill=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.translation=this.sanitize(e)},t.get=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.translation;const i=e.split(/[./]+/);return 1===i.length?t[e]:"object"==typeof t[e=i.shift()]?this.get(i.join("."),t[e]):void 0},t.sanitize=function(e){if("object"==typeof e)for(let t in e)e[t]=this.sanitize(e[t]);else if("string"==typeof e){e=(0,a.decode)(e);const t=document.createElement("div");t.innerHTML=e,e=t.textContent||t.innerText||""}return e},e}(),n=function(){function e(){this.keys={}}var t=e.prototype;return t.set=function(e,t){"string"==typeof e&&(this.keys[e]=t)},t.get=function(e){if("string"==typeof e)return this.keys[e]},e}(),o=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.callbacks={},this.callbacks.onAudioContextReady=e.onAudioContextReady||(()=>{}),this.dispatcher=document.createElement("div"),this.dispatcher.addEventListener("bufferloaded",(e=>{this.setAudioBuffer(e.detail),this.queued.includes(e.detail.id)&&(this.removeFromQueue(e.detail.id),this.play())})),this.audios={},this.queued=[];const t=window.AudioContext||window.webkitAudioContext;this.audioContext||(this.audioContext=new t)}var t=e.prototype;return t.fill=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};for(const t in e)e[t].src&&this.add({id:t,src:e[t].src,options:e[t].options??{}})},t.add=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.audioContext&&(this.audios[e.id]={loop:e.options.loop||!1,isMuted:e.options.muted||!1,groupId:e.options.groupId||"default"},this.bufferSound({id:e.id,url:e.src}))},t.getState=function(e){if(this.audios[e])return this.audios[e].state},t.setState=function(t,i){"string"==typeof i&&(i=e.STATES[i]),"number"==typeof i&&-1!==Object.values(e.STATES).indexOf(i)&&this.audios[t]&&this.audios[t].state!==i&&(this.audios[t].state=i,this.dispatcher.dispatchEvent(new CustomEvent("stateChanged",{detail:{id:t,state:i}})))},t.setAudioBuffer=function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.audios[t.id]&&(this.audios[t.id].buffer=t.buffer,this.setState(t.id,e.STATES.stopped))},t.bufferSound=function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(this.audios[t.id]){this.setState(t.id,e.STATES.buffering);var i=new XMLHttpRequest;i.open("GET",t.url,!0),i.responseType="arraybuffer",i.onload=()=>{this.audioContext.decodeAudioData(i.response,(e=>{const i=new CustomEvent("bufferloaded",{detail:{id:t.id,buffer:e}});this.dispatcher.dispatchEvent(i)}))},i.send()}},t.play=function(t){if(!this.audios[t])return!1;if(this.audios[t].isMuted)return!1;if(this.getState(t)===e.STATES.playing)return!1;if("suspended"===this.audioContext.state)return!1;if(this.getState(t)===e.STATES.buffering)return this.addToQueue(t),!1;const i=this.audios[t],a=this.audioContext.createBufferSource();a.buffer=i.buffer;const s=this.audioContext.createGain();return a.connect(s).connect(this.audioContext.destination),this.audios[t].gainNode=s,a.loop=this.audios[t].loop,i.source=a,i.source.onended=()=>{this.stop(t)},i.source.start(),this.setState(t,e.STATES.playing),!0},t.addToQueue=function(e){this.queued.includes(e)||this.queued.push(e)},t.removeFromQueue=function(e){this.queued=this.queued.filter((t=>t!==e))},t.stop=function(t){this.audios[t]&&(this.removeFromQueue(t),this.getState(t)===e.STATES.playing&&(this.audios[t].source?.stop(),this.setState(t,e.STATES.stopped)))},t.stopGroup=function(e){if(e)for(const t in this.audios)this.audios[t].groupId===e&&this.stop(t)},t.stopAll=function(){for(const e in this.audios)this.stop(e)},t.isPlaying=function(t){return!!this.audios[t]&&this.getState(t)===e.STATES.playing},t.fade=function(t){let i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.audios[t]&&!this.audios[t].isMuted&&("in"!==i.type&&"out"!==i.type||(window.clearTimeout(this.audios[t].fadeTimeout),"out"===i.type&&0===this.audios[t].gainNode.gain.value||"in"===i.type&&1===this.audios[t].gainNode.gain.value||("number"!=typeof i.time&&(i.time=e.DEFAULT_FADE_TIME_MS),i.time=Math.max(e.DEFAULT_TIMER_INTERVAL_MS,i.time),"number"!=typeof i.interval&&(i.interval=e.DEFAULT_TIMER_INTERVAL_MS),i.interval=Math.max(50,i.interval),("number"!=typeof i.gainDelta||i.gainDelta<=0)&&("in"===i.type?i.gainDelta=(1-this.audios[t].gainNode.gain.value)/(i.time/i.interval):i.gainDelta=this.audios[t].gainNode.gain.value/(i.time/i.interval)),i.time<=0?this.audios[t].gainNode.gain.value="in"===i.type?1:0:("in"===i.type?this.audios[t].gainNode.gain.value=Math.min(1,this.audios[t].gainNode.gain.value+=i.gainDelta):this.audios[t].gainNode.gain.value=Math.max(0,this.audios[t].gainNode.gain.value-=i.gainDelta),this.audios[t].fadeTimeout=window.setTimeout((()=>{this.fade(t,{time:i.time-i.interval,gainDelta:i.gainDelta,type:i.type})}),i.interval)))))},t.getDOM=function(e){if(this.audios[e])return this.audios[e].dom},t.getAudioIds=function(){return Object.keys(this.audios)},t.muteAll=function(){for(const e in this.audios)this.mute(e)},t.mute=function(e){this.audios[e]&&(this.stop(e),this.audios[e].isMuted=!0)},t.unmuteAll=function(){for(const e in this.audios)this.unmute(e)},t.unmute=function(e){this.audios[e]&&(this.audios[e].isMuted=!1)},t.isMuted=function(e){return!!this.audios[e]&&this.audios[e].isMuted},e}();o.DEFAULT_TIMER_INTERVAL_MS=100,o.DEFAULT_FADE_TIME_MS=1e3,o.STATES={buffering:0,stopped:1,queued:2,playing:3,paused:4};let l=function(){function e(){this.queued=[],this.scheduled=[],this.isClosed=!1,this.isSkippable=!0,this.respectsDelay=!0}var t=e.prototype;return t.add=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.isClosed||"function"==typeof e&&(t.delay=t.delay||0,t.block=t.block||0,t.skipQueue=t.skipQueue??!1,this.isSkippable||t.skipQueue?e():this.queued.push({callback:e,params:t}))},t.clearQueued=function(){this.queued=[]},t.clearScheduled=function(){[...this.scheduled].forEach((e=>{window.clearTimeout(e),this.scheduled=this.scheduled.filter((t=>t!==e))}))},t.scheduleQueued=function(){this.respectsDelay?this.queued=this.queued.map(((e,t,i)=>{if(0===t)return e;const a=i[t-1].params;return e.params.delay+=a.delay+a.block,e}),[]):this.queued=this.queued.map((e=>(e.params.delay=0,e.params.block=0,e))),this.queued.forEach((e=>{const t=window.setTimeout((()=>{e.callback()}),e.params.delay);this.scheduled.push(t)})),this.queued=[]},t.open=function(){this.isClosed=!1},t.close=function(){this.isClosed=!0},t.setSkippable=function(e){"boolean"==typeof e&&(this.isSkippable=e)},t.setRespectsDelay=function(e){"boolean"==typeof e&&(this.respectsDelay=e)},e}(),c=function(){function e(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({mode:"timer",interval:1e3},t),this.callbacks=s.extend({onStateChanged:()=>{},onExpired:()=>{},onTick:()=>{}},i),this.mode="stopwatch"===this.params.mode?e.FORWARD:e.BACKWARD,this.params.interval=Math.max(50,this.params.interval),this.state=e.STATE_ENDED,this.timeMs=0}var t=e.prototype;return t.setState=function(e){this.state=e,this.callbacks.onStateChanged(e,this.getTime())},t.getState=function(){return this.state},t.start=function(t){this.state===e.STATE_ENDED&&(this.startTime=new Date,t&&this.setTime(t),this.setState(e.STATE_PLAYING),this.timeout=setTimeout((()=>{this.update()}),this.params.interval))},t.pause=function(){this.state===e.STATE_PLAYING&&(this.setState(e.STATE_PAUSED),this.startTime=this.getTime())},t.resume=function(){this.state===e.STATE_PAUSED&&(this.setState(e.STATE_PLAYING),this.timeout=setTimeout((()=>{this.update()}),this.params.interval))},t.stop=function(){clearTimeout(this.timeout),this.setState(e.STATE_ENDED)},t.reset=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;this.stop(),this.setTime(e)},t.setTime=function(e){this.timeMs=e},t.getTime=function(){return Math.max(0,this.timeMs)},t.update=function(){if(this.state===e.STATE_PLAYING){const e=(new Date).getTime()-this.startTime,t=this.getTime()+e*this.mode;this.setTime(t),this.callbacks.onTick(t)}if(this.mode===e.BACKWARD&&this.getTime()<=0)return this.stop(),void this.callbacks.onExpired(0);this.startTime=new Date,this.timeout=setTimeout((()=>{this.update()}),this.params.interval)},e.toTimecode=function(e){if("number"!=typeof e)return;const t=new Date(0);return t.setSeconds(Math.round(Math.max(0,e/1e3))),t.toISOString().split("T")[1].split(".")[0].replace(/^[0:]+/,"")||"0"},e}();c.STATE_ENDED=0,c.STATE_PLAYING=1,c.STATE_PAUSED=2,c.FORWARD=1,c.BACKWARD=-1;let u=function(){function e(){}var t=e.prototype;return t.toggleAudio=function(e){this.isAudioOn="boolean"==typeof e?e:!this.isAudioOn,this.isAudioOn?this.tryStartBackgroundMusic():this.params.jukebox.muteAll()},t.tryStartBackgroundMusic=async function(){return"suspended"===this.params.jukebox.audioContext.state?(await this.params.jukebox.audioContext.resume(),this.params.jukebox.unmuteAll(),this.params.jukebox.play("backgroundMusic")):(this.params.jukebox.unmuteAll(),this.params.jukebox.play("backgroundMusic"))},e}(),h=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.params=s.extend({visuals:{pathWidth:"0.2"}},e),this.params.state=this.params.state??this.params.globals.get("states").open,this.params.visuals.pathWidth=parseFloat(this.params.visuals.pathWidth),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-path"),this.params.visible?this.show():this.hide()}var t=e.prototype;return t.getDOM=function(){return this.dom},t.getState=function(){return this.state},t.getStageIds=function(){return{from:this.params.fromId,to:this.params.toId}},t.connectsTo=function(e){return this.params.fromId===e||this.params.toId===e},t.setReachable=function(e){"boolean"==typeof e&&(this.isReachableState=e,this.isReachable()||this.hide())},t.isReachable=function(){return this.isReachableState},t.isVisible=function(){return this.isVisibleState},t.show=function(){this.params.globals.get("params").visual.paths.displayPaths&&(this.dom.classList.remove("display-none"),window.requestAnimationFrame((()=>{this.dom.classList.remove("transparent")})),this.isVisibleState=!0)},t.hide=function(){this.dom.classList.add("display-none"),this.dom.classList.add("transparent"),this.isVisibleState=!1},t.update=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};"number"==typeof e.x&&(this.dom.style.left=`${e.x}%`),"number"==typeof e.y&&(this.dom.style.top=`${e.y}%`),"number"==typeof e.length&&(this.dom.style.width=`${e.length}px`),"number"==typeof e.angle&&(this.dom.style.transform=`rotate(${e.angle}rad)`),"number"==typeof e.width&&(this.dom.style.borderTopWidth=`${e.width}px`)},t.resize=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};const t=this.computePathTelemetry({mapSize:e.mapSize});t&&this.update({x:t.x,y:t.y,length:t.length,angle:t.angle,width:t.width})},t.computePathTelemetry=function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(0===t.mapSize.height||0===t.mapSize.width)return null;const i=this.params.telemetryFrom.x,a=this.params.telemetryFrom.y,s=this.params.telemetryFrom.width,r=this.params.telemetryFrom.height,n=this.params.telemetryTo.x,o=this.params.telemetryTo.y,l=parseFloat(i)/100*t.mapSize.width,c=parseFloat(a)/100*t.mapSize.height,u=parseFloat(n)/100*t.mapSize.width,h=parseFloat(o)/100*t.mapSize.height,d=parseFloat(s)/100*t.mapSize.width,p=parseFloat(r)/100*t.mapSize.height,m=l-u,g=c-h,f=Math.sign(m)>=0?Math.PI:0,b=Math.atan(g/m)+f,y=d/2*Math.cos(b)*100/t.mapSize.width,v=p/2*Math.sin(b)*100/t.mapSize.height,w=Math.min(Math.max(e.MIN_WIDTH_PX,d*this.params.visuals.pathWidth),d*e.MAX_FACTOR),S=w/2*100/t.mapSize.height;return{x:parseFloat(i)+parseFloat(s)/2+y,y:parseFloat(a)+parseFloat(r)/2+v-S,length:Math.sqrt(Math.abs(m)*Math.abs(m)+Math.abs(g)*Math.abs(g))-d,angle:b,width:w}},t.reset=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.setReachable(!0);const t=e.isInitial?this.params.state:this.params.globals.get("states").open;this.setState(t),e.isInitial&&this.params.visible?this.show():this.hide()},t.setState=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const i=this.params.globals.get("states");if("string"==typeof e&&(e=Object.entries(i).find((t=>t[0]===e))[1]),"number"!=typeof e)return;let a;if(t.force?a=i[e]:e===i.open?a=i.open:e===i.cleared&&(a=i.cleared),!this.state||this.state!==a){this.state=a;for(const[e,t]of Object.entries(i))t!==this.state?this.dom.classList.remove(`h5p-game-map-path-${e}`):this.dom.classList.add(`h5p-game-map-path-${e}`)}},e}();h.MIN_WIDTH_PX=1,h.MAX_FACTOR=.3;let d=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.params=s.extend({elements:{}},e),this.paths=this.buildPaths(this.params.elements)}var t=e.prototype;return t.getDOMs=function(){return this.paths.map((e=>e.getDOM()))},t.buildPaths=function(e){const t=[];if(!Object.keys(e??{}).length)return[];const i=this.params.globals.get("extras").previousState?.content?.paths??[],a=[];for(let s in e)(e[s].neighbors||[]).forEach((r=>{if(!a.includes(`${s}-${r}`)&&!a.includes(`${r}-${s}`)){const n=i.find((t=>t.stageIds?.from===e[s].id&&t.stageIds?.to===e[r].id));t.push(new h({globals:this.params.globals,fromId:e[s].id,toId:e[r].id,telemetryFrom:e[s].telemetry,telemetryTo:e[r].telemetry,index:a.length,visuals:this.params.visuals,visible:n?.visible,...n?.state&&{state:n?.state}})),a.push(`${s}-${r}`)}}));return t},t.getCurrentState=function(){return this.paths.map((e=>({stageIds:e.getStageIds(),state:e.getState(),visible:e.isVisible()})))},t.update=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.paths.forEach((t=>{t.resize({mapSize:e.mapSize})}))},t.updateReachability=function(e){this.paths.forEach((t=>{t.setReachable(e.some((e=>t.connectsTo(e))))}))},t.updateState=function(e,t){const i=this.params.globals.get("params");if("free"===i.behaviour.map.roaming)return;const a=this.paths.filter((t=>{const i=t.getStageIds();return i.from===e||i.to===e}));t===this.params.globals.get("states").open&&i.visual.paths.displayPaths&&"0"!==i.behaviour.map.fog&&a.forEach((e=>{e.show()})),t===this.params.globals.get("states").cleared&&a.forEach((e=>{e.setState("cleared"),e.show()}))},t.forEach=function(e){for(let t=0;t<this.paths.length;t++)e(this.paths[t],t,this.paths)},t.reset=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.paths.forEach((t=>{t.reset({isInitial:e.isInitial})}))},e}();var p=i(520);const m=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:()=>{};if(!e)return;if(null===t)return void e.dispatchEvent(new Event("animationend"));if("string"!=typeof t)return;const a=window.matchMedia("(prefers-reduced-motion: reduce)")?.matches;if(a)return;const s=`animate-${t}`,r=a=>{a.animationName!==t&&void 0!==a.animationName||(e.classList.remove("animate"),e.classList.remove(s),e.removeEventListener("animationend",r),i())};e.addEventListener("animationend",r),e.classList.add("animate"),e.classList.add(s)};let g=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.params=s.extend({position:"bottom"},e),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-stage-label-container"),this.dom.classList.add(this.params.position);const t=document.createElement("div");t.classList.add("h5p-game-map-stage-label"),this.dom.appendChild(t),this.labelInner=document.createElement("div"),this.labelInner.classList.add("h5p-game-map-stage-label-inner"),this.labelInner.innerText=this.params.text,t.appendChild(this.labelInner),this.hide()}var t=e.prototype;return t.getDOM=function(){return this.dom},t.show=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};e.scale=e.scale??1,this.isShowing()||this.params.text&&(window.requestAnimationFrame((()=>{const t=parseFloat(window.getComputedStyle(this.labelInner).getPropertyValue("font-size")),i=Math.floor(this.labelInner.getBoundingClientRect().height);this.dom.classList.toggle("multiline",t*e.scale*1.5<i)})),this.dom.classList.toggle("touch-device",e.isTouch||!1),e.skipDelay?this.dom.classList.remove("visibility-hidden"):window.setTimeout((()=>{this.dom.classList.remove("visibility-hidden")}),10),this.dom.classList.remove("display-none"),this.showing=!0)},t.hide=function(){this.dom.classList.add("visibility-hidden"),window.setTimeout((()=>{this.dom.classList.add("display-none")}),0),this.showing=!1},t.isShowing=function(){return this.showing},e}(),f=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({accessRestrictions:{openOnScoreSufficient:!1}},e),this.params.type=b.stage,this.params.specialStageType&&(this.params.type=b["special-stage"]),this.params.state=this.params.state??this.params.globals.get("states").locked,this.callbacks=s.extend({onClicked:()=>{},onStateChanged:()=>{},onFocused:()=>{},onBecameActiveDescendant:()=>{},onAddedToQueue:()=>{},onAccessRestrictionsHit:()=>{}},t),this.isDisabledState=!1,this.isAnimating=!1,this.shouldBePlayful=!0,this.isReachableState=!0,this.dom=document.createElement("button"),this.dom.classList.add("h5p-game-map-stage"),this.dom.setAttribute("id",`stage-button-${this.params.id}`),this.dom.addEventListener("click",(e=>{this.handleClick(e)})),this.dom.addEventListener("focus",(()=>{this.callbacks.onFocused(this.params.id)})),this.params.globals.get("params").behaviour.map.showLabels&&(this.dom.addEventListener("mouseenter",(e=>{this.handleMouseOver(e)})),this.dom.addEventListener("focus",(e=>{this.handleMouseOver(e)})),this.dom.addEventListener("mouseleave",(()=>{this.handleMouseOut()})),this.dom.addEventListener("blur",(e=>{this.handleMouseOut(e)}))),this.content=document.createElement("div"),this.content.classList.add("h5p-game-map-stage-content"),this.content.classList.add("dark-text"),this.dom.appendChild(this.content),this.contentComputedStyle=window.getComputedStyle(this.content);const i=this.params.telemetry.y<50?"bottom":"top";this.label=new g({position:i,text:this.params.label}),this.dom.appendChild(this.label.getDOM()),this.setState(this.params.state),this.setTabIndex("-1"),this.params.visible?this.show():this.hide(),this.update(e.telemetry)}var t=e.prototype;return t.getDOM=function(){return this.dom},t.getId=function(){return this.params.id},t.getLabel=function(){return this.params.label},t.getType=function(){return this.params.type},t.getNeighbors=function(){return this.params.neighbors},t.isVisible=function(){return this.isVisibleState},t.setReachable=function(e){"boolean"==typeof e&&(this.isReachableState=e,this.isReachable()||this.hide())},t.isReachable=function(){return this.isReachableState},t.togglePlayfulness=function(e){this.shouldBePlayful="boolean"==typeof e?e:!this.shouldBePlayful},t.focus=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.skipNextFocusHandler=e.skipNextFocusHandler,this.dom.focus()},t.updateAriaLabel=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};const t=e.customText||this.params.dictionary.get("a11y.stageButtonLabel").replace(/@stagelabel/,this.params.label);let i;this.state===this.params.globals.get("states").locked||this.state===this.params.globals.get("states").unlocking?i=this.params.dictionary.get("a11y.locked"):this.state!==this.params.globals.get("states").completed&&this.state!==this.params.globals.get("states").cleared||(i=this.params.dictionary.get("a11y.cleared"));const a=e.customState||i,s=[t];a&&s.push(a),this.dom.setAttribute("aria-label",s.join(". "))},t.addEventListener=function(e,t){this.dom.addEventListener(e,t)},t.removeEventListener=function(e,t){this.dom.removeEventListener(e,t)},t.canBeStartStage=function(){return this.params.canBeStartStage||!1},t.getAccessRestrictions=function(){return this.params.accessRestrictions},t.show=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!this.isReachable())return;const t=()=>{this.dom.classList.remove("display-none"),window.requestAnimationFrame((()=>{this.dom.classList.remove("transparent")}))};e.queue?this.callbacks.onAddedToQueue((()=>{t()})):t(),this.isVisibleState=!0},t.hide=function(){this.dom.classList.add("display-none"),this.dom.classList.add("transparent"),this.isVisibleState=!1},t.unlock=function(){if(this.state===this.params.globals.get("states").locked||this.state===this.params.globals.get("states").unlocking){if("number"==typeof this.params?.accessRestrictions?.minScore&&this.params?.accessRestrictions?.minScore>this.params.globals.get("getScore")())return void this.setState("unlocking");this.params.globals.get("read")(this.params.dictionary.get("a11y.stageUnlocked").replace(/@stagelabel/,this.params.label)),this.setState("open")}},t.update=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};for(let t in e){"string"==typeof e[t]&&(e[t]=parseFloat(e[t]));let i=t;if("x"===t)i="left";else{if("y"!==t)return;i="top"}this.dom.style.setProperty(`--stage-${i}`,`${e[t]}%`)}},t.updateColor=function(){if(!this.dom.isConnected)return;const e=p(this.contentComputedStyle.getPropertyValue("background-color")),t=this.contentComputedStyle.getPropertyValue("--stage-color-contrast-dark"),i=this.contentComputedStyle.getPropertyValue("--stage-color-contrast-light"),a=e.contrast(p(t)),s=e.contrast(p(i));this.content.classList.toggle("dark-text",a>s),this.content.classList.toggle("light-text",a<=s),e.isDark()?this.content.style.setProperty("--stage-color-border",e.darken(.3).rgb().string()):this.content.style.setProperty("--stage-color-border",e.lighten(.3).rgb().string())},t.enable=function(){this.isDisabledState=!1,this.dom.removeAttribute("disabled")},t.disable=function(){this.dom.setAttribute("disabled","disabled"),this.isDisabledState=!0},t.animate=function(e){"string"!=typeof e||this.isAnimating||this.params.globals.get("params").visual.misc.useAnimation&&(this.isAnimating=!0,m(this.dom,e,(()=>{this.isAnimating=!1})))},t.handleClick=function(){if(!this.isDisabledState){if(this.label.hide(),this.state===this.params.globals.get("states").locked||this.state===this.params.globals.get("states").unlocking||this.state===this.params.globals.get("states").sealed)return this.animate("shake"),this.params.jukebox.play("clickStageLocked"),void("number"!=typeof this.params.accessRestrictions?.minScore||this.state!==this.params.globals.get("states").locked&&this.state!==this.params.globals.get("states").unlocking||this.callbacks.onAccessRestrictionsHit({id:this.params.id,minScore:this.params.accessRestrictions?.minScore}));this.callbacks.onClicked(this.params.id,this.state)}},t.handleMouseOver=function(e){if(this.skipNextFocusHandler)return void(this.skipNextFocusHandler=!1);if(this.isDisabledState)return;if(s.supportsTouch())return;let t=parseFloat(window.getComputedStyle(this.dom).getPropertyValue("scale"));t=Number.isNaN(t)?1:t,this.label.show({skipDelay:e instanceof FocusEvent,scale:t})},t.handleMouseOut=function(){s.supportsTouch()||this.label.hide()},t.reset=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.setReachable(!0);const t=e.isInitial?this.params.state:this.params.globals.get("states").locked;this.setState(t),[this.params.globals.get("states").locked,this.params.globals.get("states").unlocking].includes(t)&&this.setTabIndex("-1"),this.shouldBePlayful=!0,e.isInitial&&this.params.visible?this.show():this.hide()},t.getState=function(){return this.state},t.setState=function(t){let i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const a=this.params.globals.get("states"),s=this.params.globals.get("params");if("string"==typeof t&&(t=Object.entries(a).find((e=>e[0]===t))[1]),"number"!=typeof t)return;let r;if(i.force?r=a[t]:t===a.locked?r=a.locked:t===a.unlocking?(r=a.unlocking,this.show()):t===a.open||t===a.opened?(this.state!==a.completed&&this.state!==a.cleared&&(r=a.open),this.show()):t!==a.completed||"free"!==s.behaviour.map.roaming&&"complete"!==s.behaviour.map.roaming?t===a.cleared?r=a.cleared:t===a.sealed&&(r=a.sealed):r=a.cleared,"number"==typeof r&&(!this.state||this.state!==r)){this.state=r;const t=()=>{for(const[e,t]of Object.entries(a))t!==this.state?this.content.classList.remove(`h5p-game-map-stage-${e}`):this.content.classList.add(`h5p-game-map-stage-${e}`);this.updateAriaLabel(),window.requestAnimationFrame((()=>{this.updateColor()})),this.shouldBePlayful&&(r===a.open||r===a.opened?(this.animate("bounce"),this.params.jukebox.play("unlockStage")):r===a.cleared&&(this.animate("bounce"),this.params.jukebox.play("clearStage")))},i={};this.shouldBePlayful?r===a.cleared?i.block=e.ANIMATION_CLEARED_BLOCK_MS:r===a.sealed&&(i.skipQueue=!0):i.block=0,this.callbacks.onAddedToQueue(t,i),this.callbacks.onStateChanged(this.params.id,this.state)}},t.setTabIndex=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};"number"!=typeof e&&"string"!=typeof e||(this.dom.setAttribute("tabindex",`${e}`),"0"!==e||t.skipActiveDescendant||this.callbacks.onBecameActiveDescendant(this.params.id))},e}();f.ANIMATION_CLEARED_BLOCK_MS=1e3;const b={stage:0,"special-stage":1};function y(e,t){return y=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},y(e,t)}let v=function(e){var t,i;function a(){var t;let i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return(t=e.call(this,i,a)||this).content.classList.add(t.params.specialStageType),t.getState()===t.params.globals.get("states").cleared&&t.disable(),t}return i=e,(t=a).prototype=Object.create(i.prototype),t.prototype.constructor=t,y(t,i),a.prototype.runSpecialFeature=function(e){"finish"===this.params.specialStageType?e.showFinishConfirmation():"extra-life"===this.params.specialStageType?(e.addExtraLives(this.params.specialStageExtraLives??0),this.setState(this.params.globals.get("states").cleared),e.handleSpecialFeatureRun("extra-life"),this.disable()):"extra-time"===this.params.specialStageType&&(e.addExtraTime(this.params.specialStageExtraTime??0),this.setState(this.params.globals.get("states").cleared),e.handleSpecialFeatureRun("extra-time"),this.disable())},a}(f),w=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({elements:{}},e),this.callbacks=s.extend({onStageClicked:()=>{},onStageStateChanged:()=>{},onStageFocused:()=>{},onBecameActiveDescendant:()=>{},onAddedToQueue:()=>{},onAccessRestrictionsHit:()=>{}},t),this.handleSelectionKeydown=this.handleSelectionKeydown.bind(this),this.stages=this.buildStages(this.params.elements)}var t=e.prototype;return t.getDOMs=function(){return this.stages.map((e=>e.getDOM()))},t.buildStages=function(e){var t=this;const i=[];if(!Object.keys(e??{}).length)return[];const a=this.params.globals.get("extras").previousState?.content?.stages??[];for(let s in e){const r=e[s],n=r.neighbors.map((t=>e[parseInt(t)].id)),o=a.find((e=>e.id===r.id)),l={id:r.id,dictionary:this.params.dictionary,globals:this.params.globals,jukebox:this.params.jukebox,canBeStartStage:r.canBeStartStage,accessRestrictions:r.accessRestrictions,...r.contentType&&{contentType:r.contentType},specialStageType:r.specialStageType,...r.specialStageExtraLives&&{specialStageExtraLives:r.specialStageExtraLives},...r.specialStageExtraTime&&{specialStageExtraTime:r.specialStageExtraTime},label:r.label,neighbors:n,telemetry:r.telemetry,visuals:this.params.visuals,visible:o?.visible,...o?.state&&{state:o?.state}},c={onClicked:(e,t)=>{this.callbacks.onStageClicked(e,t)},onStateChanged:(e,t)=>{this.callbacks.onStageStateChanged(e,t)},onFocused:e=>{this.selectionStage||this.callbacks.onFocused(),this.handleStageFocused(e)},onBecameActiveDescendant:e=>{this.callbacks.onBecameActiveDescendant(e)},onAddedToQueue:(e,t)=>{this.callbacks.onAddedToQueue(e,t)},onAccessRestrictionsHit:function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};t.callbacks.onAccessRestrictionsHit(e)}},u=r.specialStageType?new v(l,c):new f(l,c);i.push(u)}return i},t.gatherSubGraphIds=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[],t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];if(0===e.length)return t;const i=(e,t,i)=>i.indexOf(e)===t,a=e.reduce(((e,t)=>[...e,...this.getStage(t).getNeighbors()]),[]).filter((i=>!t.includes(i)&&!e.includes(i))).filter(i);return[...t,...this.gatherSubGraphIds(a,e)].filter(i)},t.updateReachability=function(e){this.stages.forEach((t=>{t.setReachable(e.includes(t.getId()))}))},t.enable=function(){this.stages.forEach((e=>{e.enable()}))},t.disable=function(){this.stages.forEach((e=>{e.disable()}))},t.getCount=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=[...this.stages].filter((e=>e.isReachable()));e=s.extend({filters:{}},e);for(const i in e.filters)t=t.filter((t=>"state"!==i||e.filters[i].includes(t.getState())));return t.length},t.getStage=function(e){return this.stages.find((t=>t.getId()===e))},t.getCurrentState=function(){return this.stages.map((e=>({id:e.getId(),state:e.getState(),visible:e.isVisible()})))},t.updateState=function(e,t){const i=this.getStage(e);i&&i.setState(t)},t.updateUnlockingStages=function(){if("free"===this.params.globals.get("params").behaviour.map.roaming)return;this.stages.filter((e=>e.getState()===this.params.globals.get("states").unlocking&&e.getAccessRestrictions().openOnScoreSufficient)).forEach((e=>{e.unlock()}))},t.updateNeighborsState=function(e,t){const i=this.params.globals.get("params");if("free"===i.behaviour.map.roaming)return;const a=this.getStage(e);if(!a)return;const s=a.getNeighbors();t===this.params.globals.get("states").open&&"0"!==i.behaviour.map.fog&&s.forEach((e=>{const t=this.getStage(e);t&&t.show({queue:!0})})),t===this.params.globals.get("states").cleared&&s.forEach((e=>{const t=this.getStage(e);t&&t.unlock()}))},t.unlockStage=function(e){if("string"!=typeof e)return;const t=this.stages.find((t=>t.getId()===e));t&&t.unlock()},t.setStartStages=function(){let e=this.stages.filter((e=>e.canBeStartStage()));return e.length||(e=this.stages.filter((e=>e.getType()===b.stage))),e=[e[Math.floor(Math.random()*e.length)]],e.forEach(((e,t)=>{e.unlock(),0===t&&e.setTabIndex("0")})),this.gatherSubGraphIds(e.map((e=>e.getId())))},t.getNextOpenStage=function(){return this.stages.filter((e=>{const t=e.getState();return t===this.params.globals.get("states").open||t===this.params.globals.get("states").opened}))[0]||null},t.handleStageFocused=function(e){this.selectionNeighbors?.map((e=>e.getId())).includes(e)||(this.stages.forEach((t=>{t.getId()!==e?t.setTabIndex("-1"):t.setTabIndex("0"),t.removeEventListener("keydown",this.handleSelectionKeydown)})),this.selectionStage=this.stages.find((t=>t.getId()===e)),this.selectionNeighbors=this.selectionStage.getNeighbors().map((e=>this.stages.find((t=>t.getId()===e)))),this.highlightedStageId=0,this.selectionStages=[this.selectionStage,...this.selectionNeighbors],this.selectionStages.forEach((e=>{e.addEventListener("keydown",this.handleSelectionKeydown)})))},t.handleSelectionKeydown=function(e){if(!["ArrowLeft","ArrowRight"," ","Enter","Escape","Tab"].includes(e.key))return;const t=this.selectionStages[this.highlightedStageId];"ArrowLeft"===e.key?(0!==this.highlightedStageId&&(t.setTabIndex("-1"),t.updateAriaLabel()),this.highlightStage(this.highlightedStageId=(this.highlightedStageId+1)%this.selectionStages.length),e.preventDefault()):"ArrowRight"===e.key?(0!==this.highlightedStageId&&(t.setTabIndex("-1"),t.updateAriaLabel()),this.highlightStage((this.highlightedStageId+this.selectionStages.length-1)%this.selectionStages.length),e.preventDefault()):" "===e.key||"Enter"===e.key?0!==this.highlightedStageId&&(this.selectionStages[0].setTabIndex("-1"),this.selectionNeighbors=null,t.updateAriaLabel(),t.animate("pulse"),this.params.globals.get("read")(this.params.dictionary.get("a11y.movedToStage").replace(/@stagelabel/,t.getLabel())),window.setTimeout((()=>{t.getDOM().blur(),t.getDOM().focus()}),100),e.preventDefault()):"Escape"===e.key?(t.setTabIndex("-1"),t.updateAriaLabel(),this.highlightStage(0)):"Tab"===e.key&&(0!==this.highlightedStageId&&(t.setTabIndex("-1"),t.updateAriaLabel()),this.selectionStage=null,this.selectionNeighbors=null,this.selectionStages=null)},t.highlightStage=function(e){if(!Array.isArray(this.selectionStages)||e>this.selectionStages.length)return;this.highlightedStageId=e;const t=this.selectionStages[this.highlightedStageId];0!==e&&t.updateAriaLabel({customText:this.params.dictionary.get("a11y.adjacentStageLabel").replace(/@stagelabelOrigin/,this.selectionStages[0].getLabel()).replace(/@stagelabelNeighbor/,t.getLabel())}),t.setTabIndex("0",{skipActiveDescendant:!0}),t.focus()},t.setTabIndex=function(e,t){const i=this.stages.find((t=>t.getId()===e));i&&i.setTabIndex(t)},t.togglePlayfulness=function(e){"boolean"==typeof e&&this.stages.forEach((e=>{e.togglePlayfulness(!1)}))},t.forEach=function(e){for(let t=0;t<this.stages.length;t++)e(this.stages[t],t,this.stages)},t.reset=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.stages.forEach((t=>{t.reset({isInitial:e.isInitial})}))},e}(),S=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({buttons:[],l10n:{buttonText:"Close"},a11y:{screenOpened:"Screen was opened"}},e),this.callbacks=s.extend({onButtonClicked:()=>{},onRead:()=>{}},t),this.buttons=[],this.dom=this.buildDOM(),this.visuals=this.buildVisualsElement(this.params.medium),this.dom.append(this.visuals),this.setMedium(this.params.medium),this.introduction=this.buildIntroduction(),this.setIntroduction(this.params.introduction),this.dom.append(this.introduction),this.content=this.buildContent(),this.setContent(this.params.content),this.dom.append(this.content);const i=document.createElement("div");i.classList.add("media-screen-buttons-wrapper"),this.dom.append(i),this.params.buttons.forEach((e=>{const t=this.buildButton(e.id,e.text,e.className);i.append(t),this.buttons.push(t)}))}var t=e.prototype;return t.getDOM=function(){return this.dom},t.buildDOM=function(){const e=document.createElement("div");return e.classList.add("media-screen"),this.params.id&&e.classList.add(this.params.id),e},t.buildVisualsElement=function(){const e=document.createElement("div");return e.classList.add("media-screen-medium"),e},t.buildBar=function(){const e=document.createElement("div");return e.classList.add("media-screen-bar"),e},t.buildIntroduction=function(){const e=document.createElement("div");return e.classList.add("media-screen-introduction"),e},t.buildContent=function(){const e=document.createElement("div");return e.classList.add("media-screen-content"),e},t.buildButton=function(e,t,i){const a=document.createElement("button");i&&a.classList.add(i),a.innerText=t,a.addEventListener("click",(()=>{this.hide(),this.callbacks.onButtonClicked(e)}));const s=document.createElement("div");return i||s.classList.add("media-screen-button"),s.classList.add(`media-screen-button-${e}`),s.appendChild(a),s},t.setIntroduction=function(e){e?(this.introduction.innerHTML=e,this.introduction.classList.remove("display-none")):this.introduction.classList.add("display-none")},t.setContent=function(e){e?(this.content.innerHTML="",this.content.append(e),this.content.classList.remove("display-none")):this.content.classList.add("display-none")},t.setMedium=function(e){if(this.medium=e,this.mediumFile=this.getMediumFile(e),this.mediumFile){const e=this.buildVisualsElement(this.params.medium);this.dom.replaceChild(e,this.visuals),this.visuals=e,s.callOnceVisible(this.dom,(()=>{this.initMedia()}),{root:document.documentElement})}else this.visuals.classList.add("display-none")},t.getMediumFile=function(e){return e?.params?.file?e.params.file:Array.isArray(e?.params?.sources)&&e.params.sources.length?e.params.sources[0]:null},t.initMedia=function(){if(this.visuals&&this.mediumFile&&void 0!==this.params.contentId){if("H5P.Video"===(this.medium.library||"").split(" ")[0]&&(this.medium.params.visuals.fit=!1),H5P.newRunnable(this.medium,this.params.contentId,H5P.jQuery(this.visuals),!1,{metadata:this.medium.medatata}),"H5P.Image"===(this.medium.library||"").split(" ")[0]){const e=this.visuals.querySelector("img")||this.visuals.querySelector(".h5p-placeholder");e.style.height="auto",e.style.width="auto"}this.visuals.appendChild(this.buildBar())}},t.show=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.dom.classList.remove("display-none"),e.readOpened&&this.callbacks.read(this.params.a11y.screenOpened),window.setTimeout((()=>{e.focusButton&&this.buttons.length&&this.buttons[0].querySelector("button").focus()}),100)},t.hide=function(){this.dom.classList.add("display-none")},e}();function x(e,t){return x=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},x(e,t)}let k=function(e){var t,i;function a(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e.call(this,t,i)||this}return i=e,(t=a).prototype=Object.create(i.prototype),t.prototype.constructor=t,x(t,i),a}(S);function E(e,t){return E=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},E(e,t)}let A=function(e){var t,i;function a(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e.call(this,t,i)||this}return i=e,(t=a).prototype=Object.create(i.prototype),t.prototype.constructor=t,E(t,i),a}(S),D=function(){function e(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({},t),this.callbacks=s.extend({onImageLoaded:()=>{}},i),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-map");const a=this.params.globals.get("params"),r=a.gamemapSteps?.gamemap?.elements[0]?.telemetry?.width,n=a.gamemapSteps?.gamemap?.elements[0]?.telemetry?.height;this.dom.style.setProperty("--stage-height",`${n}%`),this.dom.style.setProperty("--stage-width",`${r}%`),this.dom.style.setProperty("--stage-color",a.visual.stages.colorStage),this.dom.style.setProperty("--stage-color-cleared",a.visual.stages.colorStageCleared),this.dom.style.setProperty("--stage-color-locked",a.visual.stages.colorStageLocked),this.dom.style.setProperty("--stage-color-contrast-dark",e.COLOR_CONTRAST_DARK),this.dom.style.setProperty("--stage-color-contrast-light",e.COLOR_CONTRAST_LIGHT),this.dom.style.setProperty("--path-color",a.visual.paths.style.colorPath),this.dom.style.setProperty("--path-color-cleared",a.visual.paths.style.colorPathCleared),this.dom.style.setProperty("--path-style",a.visual.paths.style.pathStyle),this.image=document.createElement("img"),this.image.classList.add("h5p-game-map-background-image"),this.image.alt="",this.image.addEventListener("load",(()=>{this.callbacks.onImageLoaded(this.image)})),this.params.backgroundImage&&(this.image.src=this.params.backgroundImage),this.dom.appendChild(this.image),this.pathWrapper=document.createElement("div"),this.pathWrapper.classList.add("h5p-game-map-path-wrapper"),this.params.paths.getDOMs().forEach((e=>{this.pathWrapper.appendChild(e)})),this.dom.appendChild(this.pathWrapper),this.stageWrapper=document.createElement("div"),this.stageWrapper.classList.add("h5p-game-map-stage-wrapper"),this.stageWrapper.setAttribute("role","application"),this.stageWrapper.setAttribute("aria-label",this.params.dictionary.get("a11y.applicationDescription")),this.params.stages.getDOMs().forEach((e=>{this.stageWrapper.appendChild(e)})),this.dom.appendChild(this.stageWrapper)}var t=e.prototype;return t.getDOM=function(){return this.dom},t.show=function(){this.dom.classList.remove("display-none")},t.hide=function(){this.dom.classList.add("display-none")},t.setFullscreen=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(!t.height||!t.width)return;if(!e)return void this.forceSize(null);const i=this.getSize();let a,s;i.width/i.height>t.width/t.height?(a=t.width,s=t.width*i.height/i.width):(a=t.height*i.width/i.height,s=t.height),this.forceSize({container:{width:t.width,height:t.height},map:{width:a,height:s}})},t.getSize=function(){const e=this.image.getBoundingClientRect();return{height:e.height,width:e.width}},t.resize=function(){clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout((()=>{const t=this.image.getBoundingClientRect();this.pathWrapper.style.height=`${t.height}px`,this.stageWrapper.style.height=`${t.height}px`;const i=parseFloat(this.dom.style.getPropertyValue("--stage-height")),a=t.height/100*i;this.dom.style.setProperty("--stage-font-size",`calc(${e.STAGE_BORDER_RADIUS} * ${a}px)`),this.dom.style.setProperty("--stage-line-height",`${a}px`)}),0)},t.forceSize=function(e){this.dom.style.height="",this.dom.style.width="",this.dom.style.margin="",this.dom.style.overflow="",this.image.style.height="",this.image.style.width="",this.pathWrapper.style.height="",this.pathWrapper.style.width="",this.stageWrapper.style.height="",this.stageWrapper.style.width="",null!==e&&(e?.container?.width&&e?.container?.height&&e?.map?.width&&e?.map?.height&&window.requestAnimationFrame((()=>{this.dom.style.height=`${e.container.height}px`,this.dom.style.width=`${e.container.width}px`,this.dom.style.margin="auto",this.dom.style.overflow="hidden auto",this.image.style.height=`${e.map.height}px`,this.image.style.width=`${e.map.width}px`,this.pathWrapper.style.height=`${e.map.height}px`,this.pathWrapper.style.width=`${e.map.width}px`,this.stageWrapper.style.height=`${e.map.height}px`,this.stageWrapper.style.width=`${e.map.width}px`,window.requestAnimationFrame((()=>{this.params.globals.get("resize")()}))})),window.requestAnimationFrame((()=>{this.params.globals.get("resize")()})))},t.setActiveDescendant=function(e){this.stageWrapper.setAttribute("aria-activedescendant",`stage-button-${e}`)},e}();D.COLOR_CONTRAST_DARK="#000",D.COLOR_CONTRAST_LIGHT="#fff",D.STAGE_BORDER_RADIUS=.5;let T=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({},e),this.callbacks=s.extend({},t),this.dom=document.createElement("div"),this.dom.classList.add("status-container"),this.dom.classList.add(`status-container-${e.id}`);const i=document.createElement("div");if(i.classList.add("status-container-values"),this.dom.append(i),this.value=document.createElement("span"),this.value.classList.add("value"),i.append(this.value),e.hasMaxValue){const e=document.createElement("span");e.classList.add("delimiter"),e.innerText="/",i.append(e),this.maxValue=document.createElement("span"),this.maxValue.classList.add("max-value"),i.append(this.maxValue)}this.hide()}var t=e.prototype;return t.getDOM=function(){return this.dom},t.setStatus=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};null!==(e.value??null)&&(this.value.innerText=e.value),null!==(e.maxValue??null)&&this.maxValue&&(this.maxValue.innerText=e.maxValue)},t.show=function(){this.dom.classList.remove("display-none")},t.hide=function(){this.dom.classList.add("display-none")},t.animate=function(e){m(this.dom,e)},e}(),L=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({},e),this.callbacks=s.extend({},t),this.containers={},this.dom=document.createElement("div"),this.dom.classList.add("status-containers")}var t=e.prototype;return t.getDOM=function(){return this.dom},t.show=function(){this.dom.classList.remove("display-none")},t.hide=function(){this.dom.classList.add("display-none")},t.addContainer=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};"string"==typeof e.id&&(this.containers[e.id]=new T(e),this.dom.append(this.containers[e.id].getDOM()))},t.showContainer=function(e){this.containers[e]&&this.containers[e].show()},t.hideContainer=function(e){this.containers[e]&&this.containers[e].hide()},t.setStatus=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.containers[e]&&this.containers[e].setStatus(t)},t.animate=function(e,t){this.containers[e]&&this.containers[e].animate(t)},e}(),C=function(){function e(e,t){this.params=s.extend({a11y:{active:"",disabled:"",inactive:""},active:!1,classes:[],disabled:!1,type:"pulse",pulseStates:[],pulseIndex:0},e||{}),Array.isArray(this.params.classes)||(this.params.classes=[this.params.classes]),"pulse"===this.params.type&&(this.params.a11y.inactive||(this.params.a11y.inactive=this.params.a11y.active||""),this.params.a11y.active||(this.params.a11y.active=this.params.a11y.inactive||""),this.pulseIndex=this.params.pulseIndex||0),this.active=this.params.active,this.disabled=this.params.disabled,this.callbacks=t||{},this.callbacks.onClick=this.callbacks.onClick||(()=>{}),this.button=document.createElement("button"),this.params.classes&&this.params.classes.forEach((e=>{this.button.classList.add(e)})),this.button.setAttribute("aria-pressed",this.params.active),this.button.setAttribute("tabindex","0"),!0===this.params.active?this.activate():this.deactivate(),!0===this.params.disabled?this.disable():this.enable(),this.pulseIndex<this.params.pulseStates.length&&(this.button.classList.add(`toolbar-button-${this.params.pulseStates[this.pulseIndex].id}`),this.button.setAttribute("aria-label",this.params.pulseStates[this.pulseIndex].label)),this.button.addEventListener("click",(e=>{this.disabled||("toggle"===this.params.type?this.toggle():"pulse"===this.params.type&&this.pulse(),this.callbacks.onClick(e,{active:this.active,id:this.params.id}))}))}var t=e.prototype;return t.getDOM=function(){return this.button},t.show=function(){this.button.classList.remove("toolbar-button-display-none")},t.hide=function(){this.button.classList.add("toolbar-button-display-none")},t.decloak=function(){this.button.classList.remove("toolbar-button-cloak")},t.cloak=function(){this.button.classList.add("toolbar-button-cloak")},t.focus=function(){this.button.focus()},t.enable=function(){this.disabled=!1,this.button.classList.remove("toolbar-button-disabled"),"toggle"===this.params.type?this.active?this.activate():this.deactivate():this.activate()},t.disable=function(){this.button.classList.add("toolbar-button-disabled"),this.button.setAttribute("aria-label",this.params.a11y.disabled),this.disabled=!0},t.activate=function(){if(!this.disabled){if("toggle"===this.params.type)this.button.classList.add("toolbar-button-active"),this.button.setAttribute("aria-pressed",!0),this.button.setAttribute("aria-label",this.params.a11y.active);else{const e=this.params.pulseStates.length?this.params.pulseStates[this.pulseIndex].label:this.params.a11y.active;this.button.setAttribute("aria-label",e)}this.active=!0}},t.force=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};"toggle"===this.params.type?!0===e?this.activate():!1===e?this.deactivate():this.toggle():"pulse"===this.params.type&&"number"==typeof e&&(this.pulseIndex=(e+this.params.pulseStates.length)%this.params.pulseStates.length,this.params.pulseStates.forEach(((e,t)=>{t===this.pulseIndex?(this.button.classList.add(`toolbar-button-${e.id}`),this.button.setAttribute("aria-label",e.label)):this.button.classList.remove(`toolbar-button-${e.id}`)}))),t.noCallback||this.callbacks.onClick({},{active:this.active})},t.deactivate=function(){this.disabled||(this.active=!1,"toggle"===this.params.type&&(this.button.classList.remove("toolbar-button-active"),this.button.setAttribute("aria-pressed",!1)),this.button.setAttribute("aria-label",this.params.a11y.inactive))},t.toggle=function(){this.disabled||(this.active?this.deactivate():this.activate())},t.pulse=function(){if(this.disabled)return;const e=this.params.pulseStates.length;e&&(this.button.classList.remove(`toolbar-button-${this.params.pulseStates[this.pulseIndex].id}`),this.pulseIndex=(this.pulseIndex+1)%e,this.button.classList.add(`toolbar-button-${this.params.pulseStates[this.pulseIndex].id}`),this.button.setAttribute("aria-label",this.params.pulseStates[this.pulseIndex].label))},t.setAttribute=function(e,t){this.button.setAttribute(e,t)},t.isActive=function(){return this.active},t.isDisabled=function(){return this.disabled},t.isCloaked=function(){return this.button.classList.contains("toolbar-button-cloak")},e}(),q=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({buttons:[],hidden:!1},e),this.callbacks=s.extend({},t),this.buttons={},this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-toolbar-tool-bar"),this.dom.setAttribute("role","toolbar"),this.dom.addEventListener("keydown",(e=>{this.handleKeydown(e)})),this.params.hidden&&this.hide();const i=document.createElement("div");if(i.classList.add("toolbar-headline"),i.innerText=s.purifyHTML(this.params.headline),this.dom.append(i),this.params.headline){const e=H5P.createUUID();i.setAttribute("id",e),this.dom.setAttribute("aria-labelledby",e)}else this.dom.setAttribute("aria-label",this.params.dictionary.get("a11y.toolbarFallbackLabel"));const a=document.createElement("div");a.classList.add("toolbar-non-headline"),this.dom.append(a),this.statusContainers=new L,a.append(this.statusContainers.getDOM()),this.params.statusContainers.forEach((e=>{this.statusContainers.addContainer(e)})),this.buttonsContainer=document.createElement("div"),this.buttonsContainer.classList.add("toolbar-buttons"),a.append(this.buttonsContainer),this.params.buttons.forEach((e=>{this.addButton(e)})),Object.values(this.buttons).forEach(((e,t)=>{e.setAttribute("tabindex",0===t?"0":"-1")})),this.currentButtonIndex=0}var t=e.prototype;return t.getDOM=function(){return this.dom},t.getFullHeight=function(){const e=window.getComputedStyle(this.dom),t=parseFloat(e.getPropertyValue("margin-top"))+parseFloat(e.getPropertyValue("margin-bottom"));return Math.ceil(this.dom.offsetHeight+t)},t.focus=function(){Object.values(this.buttons)[this.currentButtonIndex]?.focus()},t.addButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};"string"==typeof e.id&&(this.buttons[e.id]=new C({id:e.id,...e.a11y&&{a11y:e.a11y},classes:["toolbar-button",`toolbar-button-${e.id}`],..."boolean"==typeof e.disabled&&{disabled:e.disabled},...e.active&&{active:e.active},...e.type&&{type:e.type},...e.pulseStates&&{pulseStates:e.pulseStates},...e.pulseIndex&&{pulseIndex:e.pulseIndex}},{..."function"==typeof e.onClick&&{onClick:(t,i)=>{e.onClick(t,i)}}}),this.buttonsContainer.appendChild(this.buttons[e.id].getDOM()))},t.setButtonAttributes=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(this.buttons[e])for(let i in t)this.buttons[e].setAttribute(i,t[i])},t.forceButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1?arguments[1]:void 0,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};this.buttons[e]&&this.buttons[e].force(t,i)},t.enable=function(){for(const e in this.buttons)this.enableButton(e)},t.disable=function(){for(const e in this.buttons)this.disableButton(e)},t.enableButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&this.buttons[e].enable()},t.disableButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&this.buttons[e].disable()},t.showButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&this.buttons[e].show()},t.hideButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&this.buttons[e].hide()},t.decloakButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&this.buttons[e].decloak()},t.cloakButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&this.buttons[e].cloak()},t.focusButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";this.buttons[e]&&!this.buttons[e].isCloaked()&&this.buttons[e].focus()},t.toggleHintFinishButton=function(e){(e="boolean"==typeof e?e:"number"!=typeof this.hintFinishButtonTimeout)?(this.animateButton("finish","pulse"),this.hintFinishButtonTimeout=window.setTimeout((()=>{this.toggleHintFinishButton(!0)}),I)):(window.clearTimeout(this.hintFinishButtonTimeout),this.animateButton("finish",null))},t.toggleHintTimer=function(e){(e="boolean"==typeof e?e:"number"!=typeof this.hintTimerTimeout)?(this.animateStatusContainer("timer","pulse"),this.hintTimerTimeout=window.setTimeout((()=>{this.toggleHintTimer(!0)}),F)):(window.clearTimeout(this.hintTimerTimeout),this.animateStatusContainer("timer",null))},t.animateButton=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1?arguments[1]:void 0;this.buttons[e]&&this.params.useAnimation&&m(this.buttons[e].getDOM(),t)},t.show=function(){this.dom.classList.remove("display-none")},t.hide=function(){this.dom.classList.add("display-none")},t.moveButtonFocus=function(e){if("number"!=typeof e)return;if(this.currentButtonIndex+e<0||this.currentButtonIndex+e>Object.keys(this.buttons).length-1)return;Object.values(this.buttons)[this.currentButtonIndex].setAttribute("tabindex","-1"),this.currentButtonIndex=this.currentButtonIndex+e;const t=Object.values(this.buttons)[this.currentButtonIndex];t.setAttribute("tabindex","0"),t.focus()},t.handleKeydown=function(e){if("ArrowLeft"===e.code||"ArrowUp"===e.code)this.moveButtonFocus(-1);else if("ArrowRight"===e.code||"ArrowDown"===e.code)this.moveButtonFocus(1);else if("Home"===e.code)this.moveButtonFocus(0-this.currentButtonIndex);else{if("End"!==e.code)return;this.moveButtonFocus(Object.keys(this.buttons).length-1-this.currentButtonIndex)}e.preventDefault()},t.addStatusContainer=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.statusContainers.addContainer(e)},t.setStatusContainerStatus=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.statusContainers.setStatus(e,t)},t.showStatusContainer=function(e){this.statusContainers.showContainer(e)},t.hideStatusContainer=function(e){this.statusContainers.hideContainer(e)},t.animateStatusContainer=function(e,t){this.params.useAnimation&&this.statusContainers.animate(e,t)},t.toggleSolutionMode=function(e){this.dom.classList.toggle("solution-mode",e)},e}();const I=3e3,F=1e3;let M=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({animDuration:0},e),this.params.state=this.params.state??this.params.globals.get("states").unstarted,this.callbacks=s.extend({onStateChanged:()=>{},onScoreChanged:()=>{},onTimerTicked:()=>{},onTimeoutWarning:()=>{},onTimeout:()=>{},onContinued:()=>{}},t),this.setState(this.params.globals.get("states").unstarted),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-exercise-instance-wrapper"),this.instanceWrapper=document.createElement("div"),this.instanceWrapper.classList.add("h5p-game-map-exercise-instance"),this.dom.append(this.instanceWrapper),this.initializeInstance()}var i=e.prototype;return i.getDOM=function(){return this.dom},i.getState=function(){return this.state},i.initializeInstance=function(){if(null===this.instance||this.instance)return;const e=this.params.contentType?.library?.split?.(" ")[0];"H5P.Video"===e&&(this.params.contentType.params.visuals.fit=this.params.contentType.params.sources.length&&("video/mp4"===this.params.contentType.params.sources[0].mime||"video/webm"===this.params.contentType.params.sources[0].mime||"video/ogg"===this.params.contentType.params.sources[0].mime)),"H5P.Audio"===e&&"full"===this.params.contentType.params.playerMode&&(this.params.contentType.params.fitToWrapper=!0);const i=this.params.globals.get("extras").previousState?.content?.exercises??[];this.previousState=i.find((e=>e.exercise?.id===this.getId())),this.previousState=this.previousState?.exercise||{},this.instance||(this.instance=H5P.newRunnable(this.params.contentType,this.params.globals.get("contentId"),void 0,!0,{previousState:this.previousState?.instanceState})),this.instance&&(this.bubbleUp(this.instance,"resize",this.params.globals.get("mainInstance")),this.bubbleDown(this.params.globals.get("mainInstance"),"resize",[this.instance]),t.isInstanceTask(this.instance)&&this.instance.on("xAPI",(e=>{this.trackXAPI(e)})))},i.getId=function(){return this.params.id},i.getCurrentState=function(){const e=Math.min(this.timeLeft,1e3*(this.params.time?.timeLimit||0)+this.params.animDuration);return{state:this.state,id:this.params.id,remainingTime:e,isCompleted:this.isCompleted,instanceState:this.instance?.getCurrentState?.()}},i.getXAPIData=function(){return this.instance.getXAPIData?.()},i.showSolutions=function(){this.isAttached||this.attachInstance(),this.instance?.showSolutions?.(),this.isShowingSolutions=!0},i.getAnswerGiven=function(){return this.instance?.getAnswerGiven?.()??!1},i.getScore=function(){const e=this.instance?.getScore?.();return"number"==typeof e?e:0},i.getMaxScore=function(){const e=this.instance?.getMaxScore?.();return"number"==typeof e?e:0},i.getRemainingTime=function(){return this.timeLeft},i.isTimeoutWarning=function(){return"number"==typeof this.params.time.timeoutWarning&&this.timeLeft<=1e3*this.params.time?.timeoutWarning},i.bubbleUp=function(e,t,i){e.on(t,(e=>{i.bubblingUpwards=!0,i.trigger(t,e),i.bubblingUpwards=!1}))},i.bubbleDown=function(e,t,i){e.on(t,(a=>{e.bubblingUpwards||i.forEach((e=>{this.isAttached&&e.trigger(t,a)}))}))},i.trackXAPI=function(e){if(!new RegExp(this.instance.subContentId).test(e.getVerifiedStatementValue(["object","id"])))return;if(!e||null===e.getScore())return;if(!this.isAttached)return;const t="success"!==this.params.globals.get("params").behaviour.map.roaming;this.score=e.getScore(),this.score>=this.instance.getMaxScore()||e.getVerifiedStatementValue(["result","success"])?(this.setState(this.params.globals.get("states").cleared),this.params.jukebox.stopGroup("default"),this.params.jukebox.play("checkExerciseFullScore"),this.stop(),this.isCompleted=!0):(this.setState(this.params.globals.get("states").completed),this.params.jukebox.stopGroup("default"),this.params.jukebox.play("checkExerciseNotFullScore"),t&&(this.stop(),this.isCompleted=!0)),this.callbacks.onScoreChanged({score:this.score,maxScore:this.instance.getMaxScore()}),this.extendsH5PQuestion?this.instance.showButton("game-map-continue"):this.continueButton.classList.remove("display-none")},i.stop=function(){this.timer?.stop()},i.start=function(){if(!this.isCompleted||!this.isAttached){if(this.attachInstance(),this.isShowingSolutions)this.showSolutions();else{const e=Math.min(this.timeLeft,1e3*(this.params.time?.timeLimit||0)+this.params.animDuration);this.timer?.start(e)}this.setState("opened"),window.requestAnimationFrame((()=>{this.params.globals.get("resize")()}))}},i.setState=function(e){let i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const a=this.params.globals.get("states");if("string"==typeof e&&(e=Object.entries(a).find((t=>t[0]===e))[1]),"number"!=typeof e)return;let s;i.force?s=a[e]:e===a.unstarted?s=a.unstarted:e===a.opened?s=t.isInstanceTask(this.instance)?a.opened:a.cleared:e===a.completed?s=a.completed:e===a.cleared&&(s=a.cleared),this.state&&this.state===s||(this.state=s,this.callbacks.onStateChanged(this.state))},i.attachInstance=function(){this.isAttached||(this.instance.attach(H5P.jQuery(this.instanceWrapper)),"H5P.Audio"===this.instance?.libraryInfo.machineName&&window.chrome&&(this.instance.audio.style.height="54px"),this.instance.registerDomElements&&this.instance.addButton&&this.instance.hasButton?(this.extendsH5PQuestion=!0,this.instance.addButton("game-map-continue",this.params.dictionary.get("l10n.continue"),(()=>{this.callbacks.onContinued()}),!1)):(this.continueButton=document.createElement("button"),this.continueButton.classList.add("h5p-joubelui-button","h5p-game-map-exercise-instance-continue-button","display-none"),this.continueButton.innerText=this.params.dictionary.get("l10n.continue"),this.continueButton.addEventListener("click",(()=>{this.callbacks.onContinued()})),this.dom.append(this.continueButton)),this.isAttached=!0)},i.setReachable=function(e){"boolean"==typeof e&&(this.isReachableState=e)},i.isReachable=function(){return this.isReachableState},i.reset=function(){let e,t,i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.score=0,this.setReachable(!0),this.extendsH5PQuestion?this.instance.hideButton("game-map-continue"):this.continueButton?.classList.add("display-none"),i.isInitial?(e=this.previousState?.remainingTime,"number"!=typeof e&&(e=1e3*(this.params.time?.timeLimit??-1)),this.isCompleted=this.previousState.isCompleted??!1,t=this.previousState.state??this.params.state):(e=1e3*(this.params.time?.timeLimit??-1),this.isCompleted=!1,t=this.params.globals.get("states").unstarted),e>-1&&(this.timer=this.timer??new c({interval:500},{onExpired:()=>{this.handleTimeout()},onTick:()=>{this.timeLeft=this.timer.getTime();const e=this.isTimeoutWarning();this.callbacks.onTimerTicked(this.timeLeft,{timeoutWarning:e}),!this.hasPlayedTimeoutWarning&&e&&this.handleTimeoutWarning()}}),this.timeLeft=this.params.animDuration+e),i.isInitial||(this.timer?.reset(),this.timer?.setTime(this.timeLeft)),this.setState(t),this.hasPlayedTimeoutWarning=!1,this.isAttached||this.attachInstance(),!i.isInitial&&this.instance&&("function"==typeof this.instance.resetTask?this.instance.resetTask():(delete this.instance,this.initializeInstance(),this.isAttached=!1)),this.wasViewed=!1,this.isShowingSolutions=!1},i.handleTimeout=function(){this.callbacks.onTimeout()},i.handleTimeoutWarning=function(){!this.hasPlayedTimeoutWarning&&this.isTimeoutWarning()&&(this.hasPlayedTimeoutWarning=!0,this.callbacks.onTimeoutWarning())},e}(),O=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=e,this.callbacks=s.extend({onStateChanged:()=>{},onScoreChanged:()=>{},onTimerTicked:()=>{},onTimeoutWarning:()=>{},onTimeout:()=>{},onContinued:()=>{}},t),this.exercises={},this.params.elements.forEach((e=>{!e.specialStageType&&e.contentType&&(this.exercises[e.id]=new M({...e,dictionary:this.params.dictionary,globals:this.params.globals,jukebox:this.params.jukebox},{onStateChanged:t=>{this.callbacks.onStateChanged(e.id,t)},onScoreChanged:t=>{this.callbacks.onScoreChanged(e.id,t)},onTimerTicked:(t,i)=>{this.callbacks.onTimerTicked(e.id,t,i)},onTimeoutWarning:()=>{this.callbacks.onTimeoutWarning(e.id)},onTimeout:()=>{this.callbacks.onTimeout(e.id)},onContinued:()=>{this.callbacks.onContinued(e.id)}}))}))}var t=e.prototype;return t.getExercise=function(e){return this.exercises[e]},t.updateReachability=function(e){Object.keys(this.exercises).forEach((t=>{this.exercises[t].setReachable(e.includes(t))}))},t.getCurrentState=function(){return Object.values(this.exercises).filter((e=>e.isReachable())).map((e=>({exercise:e.getCurrentState()})))},t.getXAPIData=function(){return Object.values(this.exercises).filter((e=>e.isReachable())).map((e=>e?.getXAPIData?.())).filter((e=>!!e))},t.showSolutions=function(){Object.values(this.exercises).forEach((e=>{e.isReachable()&&e.showSolutions()}))},t.getAnswerGiven=function(){return Object.values(this.exercises).some((e=>!!e.isReachable()&&e.getAnswerGiven()))},t.getScore=function(){return Object.values(this.exercises).reduce(((e,t)=>t.isReachable()?e+t.getScore():e),0)},t.getMaxScore=function(){return Object.values(this.exercises).reduce(((e,t)=>t.isReachable()?e+t.getMaxScore():e),0)},t.resetAll=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};Object.values(this.exercises).forEach((t=>{t.reset({isInitial:e.isInitial})}))},t.reset=function(e){this.exercises[e]&&this.exercises[e].reset()},t.start=function(e){this.exercises[e]&&this.exercises[e].start()},t.stop=function(e){this.exercises[e]&&this.exercises[e].stop()},e}(),R=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.handleKeydownEvent=this.handleKeydownEvent.bind(this),this.attachTo(e)}var t=e.prototype;return t.attachTo=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.params=e,this.focusableElements=[]},t.activate=async function(){this.params.trapElement&&(this.isActivated||(this.isActivated=!0,this.observer=await s.callOnceVisible(this.params.trapElement,(()=>{this.handleVisible()}),{root:document.documentElement})))},t.deactivate=function(){this.isActivated&&(this.observer?.unobserve(this.params.trapElement),this.observer?.disconnect(),this.params.trapElement.removeEventListener("keydown",this.handleKeydownEvent,!0),this.isActivated=!1)},t.updateFocusableElements=function(){this.params.trapElement&&(this.focusableElements=this.getFocusableElements(this.params.trapElement))},t.getFocusableElements=function(e){if(!e)return;const t=["a[href]:not([disabled])","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])","video","audio",'[tabindex]:not([tabindex="-1"])'].join(", ");return[].slice.call(e.querySelectorAll(t)).filter((e=>"true"!==e.getAttribute("disabled")&&!0!==e.getAttribute("disabled")))},t.isChild=function(e){if(!this.params.trapElement)return!1;const t=e.parentNode;return!!t&&(t===this.params.trapElement||this.isChild(t))},t.handleVisible=function(){this.updateFocusableElements(),this.params.trapElement.addEventListener("keydown",this.handleKeydownEvent,!0),this.currentFocusElement=null,this.params.initialFocus&&this.isChild(this.params.initialFocus)&&(this.currentFocusElement=this.params.initialFocus),!this.currentFocusElement&&this.focusableElements.length&&(this.focusableElements[0]===this.params.closeElement&&this.params.fallbackContainer?.firstChild&&1===this.focusableElements.length?(this.params.fallbackContainer.firstChild.setAttribute("tabindex","-1"),this.currentFocusElement=this.params.fallbackContainer.firstChild):this.currentFocusElement=this.focusableElements[0]),this.currentFocusElement&&this.currentFocusElement.focus()},t.handleKeydownEvent=function(e){if(this.updateFocusableElements(),!this.focusableElements.length)return;if("Tab"!==e.key)return;e.preventDefault();const t=this.focusableElements.findIndex((e=>e===this.currentFocusElement)),i=this.focusableElements.length,a=e.shiftKey?(t+i-1)%i:(t+1)%i;this.currentFocusElement=this.focusableElements[a],this.currentFocusElement.focus()},e}(),B=function(){function e(){this.handleNotifyingEnded=this.handleNotifyingEnded.bind(this),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-exercise-headline-timer"),this.hide()}var t=e.prototype;return t.getDOM=function(){return this.dom},t.show=function(){""!==(this.dom.innerText||"")&&this.dom.classList.remove("display-none")},t.hide=function(){this.dom.classList.add("display-none"),this.handleNotifyingEnded()},t.setTime=function(e){if(null===e||""===e)return this.dom.innerText="",void this.hide();const t=c.toTimecode(e);t&&(this.dom.innerText=t,this.show())},t.setTimeoutWarning=function(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];!this.isTimeoutwarning&&e&&this.notify(),this.isTimeoutwarning=e,this.dom.classList.toggle("timeout-warning",e)},t.notify=function(){this.dom.addEventListener("animationend",this.handleNotifyingEnded),this.dom.classList.add("notify-animation")},t.handleNotifyingEnded=function(){this.dom.removeEventListener("animationend",this.handleNotifyingEnded),this.dom.classList.remove("notify-animation")},e}(),N=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({},e),this.callbacks=s.extend({onClosed:()=>{},onOpenAnimationEnded:()=>{},onCloseAnimationEnded:()=>{}},t),this.handleOpenAnimationEnded=this.handleOpenAnimationEnded.bind(this),this.handleCloseAnimationEnded=this.handleCloseAnimationEnded.bind(this),this.handleGlobalClick=this.handleGlobalClick.bind(this),this.handleKeyDown=this.handleKeyDown.bind(this),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-exercise"),this.dom.classList.add("transparent"),this.dom.setAttribute("role","dialog"),this.dom.setAttribute("aria-modal","true"),this.contentContainer=document.createElement("div"),this.contentContainer.classList.add("h5p-game-map-exercise-content-container"),this.contentContainer.classList.add("transparent"),this.contentContainer.classList.add("offscreen"),this.dom.append(this.contentContainer),this.content=document.createElement("div"),this.content.classList.add("h5p-game-map-exercise-content"),this.contentContainer.append(this.content),this.buttonClose=document.createElement("button"),this.buttonClose.classList.add("h5p-game-map-exercise-button-close"),this.buttonClose.setAttribute("aria-label",this.params.dictionary.get("a11y.close")),this.buttonClose.addEventListener("click",(()=>{this.callbacks.onClosed()})),this.contentContainer.append(this.buttonClose);const i=document.createElement("div");i.classList.add("h5p-game-map-exercise-headline"),this.content.append(i),this.headlineText=document.createElement("div"),this.headlineText.classList.add("h5p-game-map-exercise-headline-text"),i.append(this.headlineText),this.timerDisplay=new B,i.append(this.timerDisplay.getDOM()),this.h5pInstance=document.createElement("div"),this.h5pInstance.classList.add("h5p-game-map-exercise-instance-container"),this.content.append(this.h5pInstance),this.focusTrap=new R({trapElement:this.dom,closeElement:this.buttonClose,fallbackContainer:this.h5pInstance})}var t=e.prototype;return t.getDOM=function(){return this.dom},t.show=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.dom.classList.remove("display-none"),e.isShowingSolutions?this.timerDisplay.hide():this.timerDisplay.show(),window.requestAnimationFrame((()=>{this.dom.classList.remove("transparent"),this.params.globals.get("params").visual.misc.useAnimation?this.contentContainer.addEventListener("animationend",this.handleOpenAnimationEnded):this.handleOpenAnimationEnded(),this.animate("bounce-in",(()=>{this.focusTrap.activate()})),this.contentContainer.classList.remove("offscreen"),document.addEventListener("click",this.handleGlobalClick),document.addEventListener("keydown",this.handleKeyDown)})),window.setTimeout((()=>{this.contentContainer.classList.remove("transparent")}),100)},t.hide=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1?arguments[1]:void 0;document.removeEventListener("click",this.handleGlobalClick),document.removeEventListener("keydown",this.handleKeyDown),e.animate?(this.dom.classList.add("transparent"),this.params.globals.get("params").visual.misc.useAnimation?this.animate("bounce-out",(()=>{this.handleCloseAnimationEnded(),"function"==typeof t&&t()})):(this.handleCloseAnimationEnded(),"function"==typeof t&&t())):(this.contentContainer.classList.add("transparent"),this.contentContainer.classList.add("offscreen"),this.dom.classList.add("display-none"),this.dom.classList.add("transparent"),"function"==typeof t&&t()),this.focusTrap.deactivate()},t.setH5PContent=function(e){this.h5pInstance.innerHTML="",this.h5pInstance.appendChild(e)},t.setTitle=function(e){e=s.purifyHTML(e),this.headlineText.innerText=e,this.dom.setAttribute("aria-label",this.params.dictionary.get("a11y.exerciseLabel").replace(/@stagelabel/,e))},t.setTime=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.timerDisplay.setTime(e),this.timerDisplay.setTimeoutWarning(t.timeoutWarning)},t.setScreenOffset=function(t){const i=(a=Math.max(e.MAPSIZE_MIN_PX,Math.min(t,e.MAPSIZE_MAX_PX)),s=e.MAPSIZE_MIN_PX,r=e.MAPSIZE_MAX_PX,n=e.OFFSET_MIN_REM,o=e.OFFSET_MAX_REM,n+(o-n)*(a-s)/(r-s));var a,s,r,n,o;this.dom.style.setProperty("--exercise-screen-offset",`${i}rem`)},t.getSize=function(){const e=this.dom.getBoundingClientRect();return{width:e.width,height:e.height}},t.animate=function(e,t){"string"!=typeof e||this.isAnimating||this.params.globals.get("params").visual.misc.useAnimation&&(this.isAnimating=!0,m(this.contentContainer,e,(()=>{this.isAnimating=!1,t()})))},t.handleOpenAnimationEnded=function(){this.contentContainer.removeEventListener("animationend",this.handleOpenAnimationEnded),this.callbacks.onOpenAnimationEnded()},t.handleCloseAnimationEnded=function(){this.contentContainer.removeEventListener("animationend",this.handleCloseAnimationEnded),this.contentContainer.classList.add("transparent"),this.contentContainer.classList.add("offscreen"),this.dom.classList.add("display-none"),this.callbacks.onCloseAnimationEnded()},t.handleGlobalClick=function(e){this.isAnimating||!e.target.isConnected||this.content.contains(e.target)||this.callbacks.onClosed()},t.handleKeyDown=function(e){"Escape"===e.key&&(e.preventDefault(),this.callbacks.onClosed())},e}();N.OFFSET_MIN_REM=2,N.OFFSET_MAX_REM=4,N.MAPSIZE_MIN_PX=480,N.MAPSIZE_MAX_PX=640;let P=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({},e),this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-confirmation-dialog"),this.dom.addEventListener("click",(e=>{e.stopPropagation()})),window.matchMedia("(prefers-reduced-motion: reduce)")?.matches&&this.dom.classList.add("prefers-reduced-motion"),this.update(e,t)}var t=e.prototype;return t.getDOM=function(){return this.dom},t.update=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};e=s.extend({},e),e.instance=e.instance??this.params.globals.get("mainInstance"),t=s.extend({onConfirmed:()=>{},onCanceled:()=>{}},t),this.dialog&&(this.dialog.off("confirmed"),this.dialog.off("canceled"),this.dialog.getElement().classList.contains("hidden")||this.dialog.hide()),this.dialog=new H5P.ConfirmationDialog(e),this.dialog.once("confirmed",(()=>{this.dialog.off("canceled"),this.isShowing=!1,t.onConfirmed()})),this.dialog.once("canceled",(()=>{this.dialog.off("confirmed"),this.isShowing=!1,t.onCanceled()})),this.dom.innerHTML="",this.dialog.appendTo(this.dom)},t.show=function(){this.dialog.show(),this.isShowing=!0},t.hide=function(){this.isShowing&&(this.dialog.hide(),this.isShowing=!1)},e}(),H=function(){function e(){}var t=e.prototype;return t.grabH5PQuestionFeedback=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};const t=this.dom.closest(".h5p-question-content");if(!t)return null;const i=t.parentNode;if(!i)return null;const a=this.params.globals.get("mainInstance");a.setFeedback("",0,e.maxScore);const s=document.createElement("div");s.classList.add("h5p-game-map-feedback-wrapper");const r=i.querySelector(".h5p-question-feedback");r&&s.append(r.parentNode.removeChild(r));const n=i.querySelector(".h5p-question-scorebar");return n&&(s.append(n.parentNode.removeChild(n)),0===e.maxScore&&n.classList.add("display-none")),a.removeFeedback(),s},t.buildDOM=function(){this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-container");const e=this.params.globals.get("params");e.showTitleScreen&&(this.startScreen=new k({id:"start",contentId:this.params.globals.get("contentId"),introduction:e.titleScreen.titleScreenIntroduction,medium:e.titleScreen.titleScreenMedium,buttons:[{id:"start",text:this.params.dictionary.get("l10n.start")}],a11y:{screenOpened:this.params.dictionary.get("a11y.startScreenWasOpened")}},{onButtonClicked:()=>{this.show({focusButton:!0,readOpened:!0})},read:e=>{this.params.globals.get("read")(e)}}),this.startScreen.hide(),this.dom.append(this.startScreen.getDOM()));const t=[];e.behaviour.enableSolutionsButton&&t.push({id:"show-solutions",text:this.params.dictionary.get("l10n.showSolutions"),className:"h5p-joubelui-button"}),e.behaviour.enableRetry&&t.push({id:"restart",text:this.params.dictionary.get("l10n.restart"),className:"h5p-joubelui-button"}),this.endScreen=new A({id:"end",contentId:this.params.globals.get("contentId"),buttons:t,a11y:{screenOpened:this.params.dictionary.get("a11y.endScreenWasOpened")}},{onButtonClicked:e=>{"restart"===e?this.callbacks.onRestarted():"show-solutions"===e&&(this.showSolutions(),this.params.globals.get("read")(this.params.dictionary.get("a11y.mapSolutionsWasOpened")),window.setTimeout((()=>{this.toolbar.focus()}),100))},read:e=>{this.params.globals.get("read")(e)}}),this.endScreen.hide(),this.dom.append(this.endScreen.getDOM()),this.contentDOM=document.createElement("div"),this.contentDOM.classList.add("h5p-game-map-main"),this.dom.append(this.contentDOM);const i=[];this.params.jukebox.getAudioIds().length&&i.push({id:"audio",type:"toggle",a11y:{active:this.params.dictionary.get("a11y.buttonAudioActive"),inactive:this.params.dictionary.get("a11y.buttonAudioInactive")},onClick:(e,t)=>{this.toggleAudio(t.active)}}),i.push({id:"finish",type:"pulse",a11y:{active:this.params.dictionary.get("a11y.buttonFinish")},onClick:()=>{this.showFinishConfirmation()}}),this.params.globals.get("isFullscreenSupported")&&i.push({id:"fullscreen",type:"pulse",pulseStates:[{id:"enter-fullscreen",label:this.params.dictionary.get("a11y.enterFullscreen")},{id:"exit-fullscreen",label:this.params.dictionary.get("a11y.exitFullscreen")}],onClick:()=>{this.callbacks.onFullscreenClicked()}}),this.toolbar=new q({dictionary:this.params.dictionary,...e.headline&&{headline:e.headline},buttons:i,statusContainers:[{id:"timer"},{id:"lives"},{id:"stages",hasMaxValue:!0},{id:"score",hasMaxValue:!0}],useAnimation:e.visual.misc.useAnimation}),this.contentDOM.append(this.toolbar.getDOM());const a=H5P.getPath(e?.gamemapSteps?.backgroundImageSettings?.backgroundImage?.path??"",this.params.globals.get("contentId"));this.stages=new w({dictionary:this.params.dictionary,globals:this.params.globals,jukebox:this.params.jukebox,elements:e.gamemapSteps.gamemap.elements,visuals:e.visual.stages},{onStageClicked:(e,t)=>{this.handleStageClicked(e,t)},onStageStateChanged:(e,t)=>{this.handleStageStateChanged(e,t)},onFocused:()=>{this.handleStageFocused()},onBecameActiveDescendant:e=>{this.handleStageBecameActiveDescendant(e)},onAddedToQueue:(e,t)=>{this.handleStageAddedToQueue(e,t)},onAccessRestrictionsHit:e=>{this.handleStageAccessRestrictionsHit(e)}}),this.paths=new d({globals:this.params.globals,elements:e.gamemapSteps.gamemap.elements,visuals:e.visual.paths.style}),this.map=new D({dictionary:this.params.dictionary,globals:this.params.globals,backgroundImage:a,paths:this.paths,stages:this.stages},{onImageLoaded:()=>{this.params.globals.get("resize")(),window.requestAnimationFrame((()=>{this.params.globals.get("resize")()}))}}),this.contentDOM.append(this.map.getDOM()),this.exercises=new O({dictionary:this.params.dictionary,globals:this.params.globals,jukebox:this.params.jukebox,elements:e.gamemapSteps.gamemap.elements},{onStateChanged:(e,t)=>{this.handleExerciseStateChanged(e,t)},onScoreChanged:(e,t)=>{this.handleExerciseScoreChanged(e,t)},onTimerTicked:(e,t,i)=>{this.handleExerciseTimerTicked(e,t,i)},onTimeoutWarning:e=>{this.handleExerciseTimeoutWarning(e)},onTimeout:e=>{this.handleExerciseTimeout(e)},onContinued:()=>{this.handleExerciseScreenClosed()}}),this.exerciseScreen=new N({dictionary:this.params.dictionary,globals:this.params.globals},{onClosed:()=>{this.handleExerciseScreenClosed()},onOpenAnimationEnded:()=>{this.handleExerciseScreenOpenAnimationEnded()},onCloseAnimationEnded:()=>{this.handleExerciseScreenCloseAnimationEnded()}}),this.exerciseScreen.hide(),this.toolbar.enable(),this.map.getDOM().append(this.exerciseScreen.getDOM()),this.confirmationDialog=new P({globals:this.params.globals}),this.dom.append(this.confirmationDialog.getDOM())},t.startVisibilityObserver=function(){document.addEventListener("visibilitychange",(()=>{document.hidden?(this.unmuteWhenVisible=!this.params.jukebox.isMuted("backgroundMusic"),this.params.jukebox.muteAll()):!0===this.unmuteWhenVisible&&(this.params.jukebox.unmuteAll(),this.params.jukebox.play("backgroundMusic"))}))},t.reset=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.toolbar.toggleHintFinishButton(!1),this.toolbar.toggleHintTimer(!1),this.params.jukebox.muteAll(),this.stageAttentionSeekerTimeout=null,this.hasUserMadeProgress=!1;const t=this.params.globals.get("params"),i=this.params.globals.get("extras")?.previousState?.content??{};e.isInitial&&"number"==typeof i.livesLeft?this.livesLeft=i.livesLeft:this.livesLeft=t.behaviour.lives??1/0,e.isInitial&&"number"==typeof i.timeLeft?this.resetTimer(i.timeLeft):"number"==typeof this.params.globals.get("params").behaviour.timeLimitGlobal&&this.resetTimer(1e3*this.params.globals.get("params").behaviour.timeLimitGlobal),0===this.livesLeft&&this.stages.forEach((e=>{e.setState("sealed")})),this.gameDone=!!e.isInitial&&(i.gameDone??!1),this.stages.togglePlayfulness(!0),this.stagesGameOverState=[],this.currentStageIndex=0,this.confirmationDialog.hide(),this.fullScoreWasAnnounced=!1,this.openExerciseId=!1,this.callbackQueue.setSkippable(!0),this.queueAnimation=[],this.scheduledAnimations=[],e.isInitial||(this.isShowingSolutions=!1),this.toolbar.toggleSolutionMode(!1),this.paths.reset({isInitial:e.isInitial}),this.stages.reset({isInitial:e.isInitial}),this.exercises.resetAll({isInitial:e.isInitial}),"all"===t.behaviour.map.fog&&(this.stages.forEach((e=>{e.show()})),this.paths.forEach((e=>{e.show()}))),"free"===t.behaviour.map.roaming&&(this.stages.forEach((e=>{e.setState("open")})),this.paths.forEach((e=>{e.setState("cleared"),e.show()})));const a=this.stages.setStartStages();this.stages.updateReachability(a),this.paths.updateReachability(a),this.exercises.updateReachability(a),this.toolbar.setStatusContainerStatus("lives",{value:this.livesLeft});const s={state:[this.params.globals.get("states").completed,this.params.globals.get("states").cleared]};this.toolbar.setStatusContainerStatus("stages",{value:this.stages.getCount({filters:s}),maxValue:this.stages.getCount()}),this.toolbar.setStatusContainerStatus("score",{value:this.getScore(),maxValue:this.getMaxScore()}),this.getScore()>=this.getMaxScore()&&(this.fullScoreWasAnnounced=!0,this.toolbar.toggleHintFinishButton(!0)),this.isAudioOn=this.isAudioOn??!1,this.isAudioOn&&(this.params.jukebox.unmuteAll(),this.params.jukebox.play("backgroundMusic"))},e}(),V=function(){function e(){}var t=e.prototype;return t.addExtraLives=function(e){"number"!=typeof e||e<1||this.livesLeft===1/0||(this.livesLeft+=e,this.toolbar.setStatusContainerStatus("lives",{value:this.livesLeft}),this.params.jukebox.play("gainedLife"))},t.handleStageClicked=function(e){const t=this.stages.getStage(e),i=t.getType();if(i===b.stage){this.stages.disable(),window.clearTimeout(this.stageAttentionSeekerTimeout);const i=this.exercises.getExercise(e),a=i.getRemainingTime();if("number"==typeof a&&this.exerciseScreen.setTime(a),this.openExerciseId=e,this.callbackQueue.setSkippable(!1),this.exerciseScreen.setH5PContent(i.getDOM()),this.exerciseScreen.setTitle(t.getLabel()),this.params.jukebox.stopGroup("default"),this.exerciseScreen.show({isShowingSolutions:this.isShowingSolutions}),this.toolbar.disable(),this.exercises.start(e),this.params.globals.get("params").audio.backgroundMusic.muteDuringExercise&&this.params.jukebox.fade("backgroundMusic",{type:"out",time:this.musicFadeTime}),this.params.jukebox.play("openExercise"),!this.isShowingSolutions){const t=this.params.globals.get("params").gamemapSteps.gamemap.elements.findIndex((t=>t.id===e));this.currentStageIndex=t+1,this.hasUserMadeProgress=!0,this.callbacks.onProgressChanged(this.currentStageIndex)}}else if(i===b["special-stage"]&&!this.isShowingSolutions){const e=this.params.globals.get("states");t.getState()===e.open&&t.runSpecialFeature(this)}window.requestAnimationFrame((()=>{this.params.globals.get("resize")()}))},t.handleSpecialFeatureRun=function(e){"extra-life"===e?this.toolbar.animateStatusContainer("lives","pulse"):"extra-time"===e&&this.toolbar.animateStatusContainer("timer","pulse")},t.handleStageStateChanged=function(e,t){if(!this.isShowingSolutions&&(this.paths&&this.callbackQueue.add((()=>{this.paths.updateState(e,t)})),this.stages)){this.stages.updateNeighborsState(e,t);const i={state:[this.params.globals.get("states").completed,this.params.globals.get("states").cleared]};this.toolbar.setStatusContainerStatus("stages",{value:this.stages.getCount({filters:i}),maxValue:this.stages.getCount()})}},t.handleStageFocused=function(){window.setTimeout((()=>{this.params.globals.get("read")(this.params.dictionary.get("a11y.applicationInstructions"))}),250)},t.handleStageBecameActiveDescendant=function(e){this.map?.setActiveDescendant(e)},t.handleStageAddedToQueue=function(e,t){this.callbackQueue.add(e,t)},t.handleStageAccessRestrictionsHit=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!e.minScore)return;this.toolbar.disableButton("finish");const t=[];e.minScore&&t.push(this.params.dictionary.get("l10n.confirmAccessDeniedMinScore").replace(/@minscore/gi,e.minScore));let i=t.map((e=>`<li>${e}</li>`)).join("");i=`<ul>${i}</ul>`,this.confirmationDialog.update({headerText:this.params.dictionary.get("l10n.confirmAccessDeniedHeader"),dialogText:`${this.params.dictionary.get("l10n.confirmAccessDeniedDialog")}${i}`,confirmText:this.params.dictionary.get("l10n.ok"),hideCancel:!0},{onConfirmed:()=>{this.toolbar.enableButton("finish")},onCanceled:()=>{this.toolbar.enableButton("finish")}}),this.confirmationDialog.show()},e}(),U=function(){function e(){}var t=e.prototype;return t.handleExerciseStateChanged=function(e,t){this.isShowingSolutions||this.stages.updateState(e,t)},t.handleExerciseScoreChanged=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.gameDone||(this.fullScoreWasAnnounced||this.getScore()!==this.getMaxScore()||(this.fullScoreWasAnnounced=!0,this.callbackQueue.add((()=>{this.params.jukebox.play("fullScore"),this.showFullScoreConfirmation()}))),this.stages.updateUnlockingStages(),"number"==typeof t.score&&t.score!==t.maxScore&&this.handleIncompleteScore(e),this.toolbar.setStatusContainerStatus("score",{value:this.getScore(),maxValue:this.getMaxScore()}))},t.handleIncompleteScore=function(){this.livesLeft!==1/0&&(this.handleLostLife(),this.livesLeft>0&&this.showIncompleteScoreConfirmation())},t.handleExerciseTimerTicked=function(e,t,i){e&&e===this.openExerciseId&&this.exerciseScreen.setTime(t,i)},t.handleExerciseTimeoutWarning=function(e){e&&e===this.openExerciseId&&this.params.jukebox.play("timeoutWarning")},t.handleExerciseTimeout=function(e){e&&e===this.openExerciseId&&(this.handleLostLife(),this.livesLeft>0&&this.handleExerciseScreenClosed({animationEndedCallback:()=>{this.exercises.reset(e),this.showTimeoutConfirmation()}}))},t.handleLostLife=function(){0!==this.livesLeft&&(this.livesLeft--,this.params.jukebox.play("lostLife"),this.toolbar.setStatusContainerStatus("lives",{value:this.livesLeft}),0===this.livesLeft&&(this.queueAnimation=[],this.stagesGameOverState=this.stages.getCurrentState(),this.stages.forEach((e=>{e.setState("sealed")})),this.handleExerciseScreenClosed({animationEndedCallback:()=>{this.showGameOverConfirmation()}})))},e}(),j=function(){function e(){}var t=e.prototype;return t.handleExerciseScreenClosed=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.openExerciseId&&(this.exerciseClosedCallback=e.animationEndedCallback,this.map.dom.setAttribute("aria-label",this.params.dictionary.get("a11y.applicationInstructions")),this.exerciseScreen.hide({animate:!0},(()=>{this.exerciseScreen.setTime(""),this.stages.getStage(this.openExerciseId)?.focus({skipNextFocusHandler:!0}),this.openExerciseId=!1,this.callbackQueue.setSkippable(!0),this.params.globals.get("resize")()})),this.toolbar.enable(),this.params.jukebox.stopGroup("default"),this.params.jukebox.play("closeExercise"),this.params.globals.get("params").audio.backgroundMusic.muteDuringExercise&&this.params.jukebox.fade("backgroundMusic",{type:"in",time:this.musicFadeTime}),this.stages.enable(),this.exercises.stop(this.openExerciseId))},t.handleExerciseScreenOpenAnimationEnded=function(){this.params.globals.get("resize")()},t.handleExerciseScreenCloseAnimationEnded=function(){this.gameDone?this.queueAnimation=[]:(this.callbackQueue.scheduleQueued(),this.exerciseClosedCallback&&(this.exerciseClosedCallback(),this.exerciseClosedCallback=null))},e}(),G=function(){function e(){}var t=e.prototype;return t.getXAPIData=function(){return this.exercises.getXAPIData()},t.getAnswerGiven=function(){return this.exercises.getAnswerGiven()||this.hasUserMadeProgress},t.getScore=function(){return Math.min(this.exercises.getScore(),this.getMaxScore())},t.getMaxScore=function(){const e=this.exercises.getMaxScore(),t=this.params.globals.get("params").behaviour.finishScore;return Math.min(t,e)},t.getContext=function(){return{type:"stage",value:this.currentStageIndex}},t.showSolutions=function(){this.gameDone=!0,this.confirmationDialog.hide(),this.endScreen.hide(),this.stagesGameOverState.forEach((e=>{this.stages.updateState(e.id,e.state)})),this.params.jukebox.stopAll(),this.show(),this.exercises.showSolutions(),this.isShowingSolutions=!0,this.toolbar.toggleSolutionMode(!0)},t.getCurrentState=function(){return{exercises:this.exercises.getCurrentState(),stages:this.stages.getCurrentState(),paths:this.paths.getCurrentState(),...this.livesLeft&&this.livesLeft!==1/0&&{livesLeft:this.livesLeft},...this.timeLeft&&{timeLeft:this.timeLeft},...this.gameDone&&{gameDone:this.gameDone}}},e}(),z=function(){function e(){}var t=e.prototype;return t.initializeTimer=function(){this.params.globals.get("params").behaviour.timeLimitGlobal&&(this.timer=new c({interval:500},{onTick:()=>{this.timeLeft=this.timer.getTime();this.isTimeoutWarning()&&(this.hasPlayedTimeoutWarningGlobal=!0,this.params.jukebox.play("timeoutWarning"),this.toolbar.toggleHintTimer(!0)),this.toolbar.setStatusContainerStatus("timer",{value:c.toTimecode(this.timeLeft)})},onExpired:()=>{this.showGameOverConfirmation("confirmGameOverDialogTimeout")}}))},t.isTimeoutWarning=function(){if(this.hasPlayedTimeoutWarningGlobal)return!1;const e=this.params.globals.get("params").behaviour.timeoutWarningGlobal;return"number"==typeof e&&this.timeLeft<=1e3*e},t.addExtraTime=function(e){"number"!=typeof e||e<1||!this.timer||(this.timer.setTime(this.timer.getTime()+1e3*e),this.toolbar.setStatusContainerStatus("timer",{value:c.toTimecode(this.timer.getTime())}),this.params.jukebox.play("extraTime"))},t.resetTimer=function(e){"number"!=typeof e||e<1||(this.hasPlayedTimeoutWarningGlobal=!1,this.timer?.reset(e),this.toolbar.setStatusContainerStatus("timer",{value:c.toTimecode(e)}))},e}(),W=function(){function e(){}var t=e.prototype;return t.showFinishConfirmation=function(){if(this.isShowingSolutions)return void this.showEndscreen({focusButton:!0,readOpened:!0});const e=this.params.globals.get("extras");e.isScoringEnabled=!0;const t=e.standalone&&(e.isScoringEnabled||e.isReportingEnabled),i=[this.params.dictionary.get("l10n.confirmFinishDialog")];t&&i.push(this.params.dictionary.get("l10n.confirmFinishDialogSubmission")),i.push(this.params.dictionary.get("l10n.confirmFinishDialogQuestion")),this.confirmationDialog.update({headerText:this.params.dictionary.get("l10n.confirmFinishHeader"),dialogText:i.join(" "),cancelText:this.params.dictionary.get("l10n.no"),confirmText:this.params.dictionary.get("l10n.yes")},{onConfirmed:()=>{this.handleConfirmedFinish()},onCanceled:()=>{this.params.jukebox.stopGroup("default")}}),this.params.jukebox.stopGroup("default"),this.confirmationDialog.show(),this.params.jukebox.play("showDialog")},t.handleConfirmedFinish=function(){this.gameDone=!0,this.queueAnimation=[],this.stages.togglePlayfulness(!1),this.params.jukebox.stopAll(),this.timer?.stop(),this.callbacks.onFinished(),this.showEndscreen({focusButton:!0})},t.showGameOverConfirmation=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"confirmGameOverDialog";this.gameDone=!0,this.stages.togglePlayfulness(!1),this.confirmationDialog.update({headerText:this.params.dictionary.get("l10n.confirmGameOverHeader"),dialogText:this.params.dictionary.get(`l10n.${e}`),confirmText:this.params.dictionary.get("l10n.ok"),hideCancel:!0},{onConfirmed:()=>{this.params.jukebox.stopAll(),this.timer?.stop(),this.callbacks.onFinished(),this.showEndscreen({focusButton:!0})}}),this.params.jukebox.stopAll(),this.timer?.stop(),this.params.jukebox.play("gameOver"),this.confirmationDialog.show()},t.showTimeoutConfirmation=function(){const e=this.livesLeft===1/0?this.params.dictionary.get("l10n.confirmTimeoutDialog"):this.params.dictionary.get("l10n.confirmTimeoutDialogLostLife");this.confirmationDialog.update({headerText:this.params.dictionary.get("l10n.confirmTimeoutHeader"),dialogText:e,confirmText:this.params.dictionary.get("l10n.ok"),hideCancel:!0},{onConfirmed:()=>{this.params.jukebox.stopGroup("default")}}),this.confirmationDialog.show()},t.showIncompleteScoreConfirmation=function(){this.confirmationDialog.update({headerText:this.params.dictionary.get("l10n.confirmScoreIncompleteHeader"),dialogText:this.params.dictionary.get("l10n.confirmIncompleteScoreDialogLostLife"),confirmText:this.params.dictionary.get("l10n.ok"),hideCancel:!0},{onConfirmed:()=>{this.params.jukebox.stopGroup("default")}}),this.confirmationDialog.show()},t.showFullScoreConfirmation=function(){let e=this.params.dictionary.get("l10n.confirmFullScoreDialog");this.livesLeft!==1/0&&(e=`${e} ${this.params.dictionary.get("l10n.confirmFullScoreDialogLoseLivesAmendmend")}`),this.confirmationDialog.update({headerText:this.params.dictionary.get("l10n.confirmFullScoreHeader"),dialogText:e,confirmText:this.params.dictionary.get("l10n.ok"),hideCancel:!0},{onConfirmed:()=>{this.params.jukebox.stopGroup("default"),this.toolbar.toggleHintFinishButton(!0)}}),this.confirmationDialog.show()},e}(),_=function(){function e(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=s.extend({},t),this.gameDone=!1,this.callbackQueue=new l,this.callbackQueue.setRespectsDelay(this.params.globals.get("params").visual.misc.useAnimation),s.addMixins(e,[u,H,V,U,j,G,z,W]),this.callbacks=s.extend({onProgressChanged:()=>{},onFinished:()=>{},onFullscreenClicked:()=>{},onRestarted:()=>{}},i),this.params.globals.set("getScore",(()=>this.getScore())),this.musicFadeTime=e.MUSIC_FADE_TIME,this.buildDOM(),this.startVisibilityObserver(),this.initializeTimer(),this.reset({isInitial:!0}),this.params.globals.get("params").behaviour.timeLimitGlobal&&this.toolbar.showStatusContainer("timer"),"number"==typeof this.params.globals.get("params").behaviour.lives&&this.toolbar.showStatusContainer("lives"),this.toolbar.showStatusContainer("stages"),this.getMaxScore()>0&&this.toolbar.showStatusContainer("score"),this.start({isInitial:!0}),H5P.externalDispatcher.on("initialized",(()=>{const e=this.grabH5PQuestionFeedback({maxScore:this.getMaxScore()});this.endScreen.setContent(e),this.gameDone&&this.showEndscreen()}))}var t=e.prototype;return t.getDOM=function(){return this.dom},t.show=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(this.map.show(),this.contentDOM.classList.remove("display-none"),this.timer){const e=this.timer.getState();e===c.STATE_PAUSED?this.timer.resume():e!==c.STATE_ENDED||this.gameDone||this.timer.start()}e.readOpened&&this.params.globals.get("read")(this.params.dictionary.get("a11y.mapWasOpened")),window.setTimeout((()=>{e.focusButton&&this.toolbar.focus()}),100),this.stageAttentionSeekerTimeout||this.seekAttention(),window.requestAnimationFrame((()=>{this.params.globals.get("resize")(),window.requestAnimationFrame((()=>{this.params.globals.get("resize")()}))}))},t.hide=function(){this.map.hide(),this.timer?.pause(),this.contentDOM.classList.add("display-none")},t.start=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.endScreen.hide();if(this.params.globals.get("params").showTitleScreen){this.hide();const t=e.isInitial?{}:{focusButton:!0,readOpened:!0};this.startScreen.show(t)}else e.isInitial?this.show():this.show({focusButton:!0,readOpened:!0});this.params.globals.get("resize")()},t.seekAttention=function(){window.clearTimeout(this.stageAttentionSeekerTimeout),this.stageAttentionSeekerTimeout=window.setTimeout((()=>{this.stages.getNextOpenStage();const e=this.stages.getNextOpenStage();e&&e.animate("bounce"),this.seekAttention()}),e.ATTENTION_SEEKER_TIMEOUT_MS)},t.resize=function(){const e=this.map.getSize();e&&0!==e.width&&0!==e.height&&(this.exerciseScreen.setScreenOffset(e.width),this.map.resize(),clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout((()=>{this.paths.update({mapSize:this.map.getSize()})}),0),this.exerciseScreen.getSize().width>this.dom.getBoundingClientRect().width&&(clearTimeout(this.exersizeScreenResizeTimeout),this.exersizeScreenResizeTimeout=setTimeout((()=>{this.params.globals.get("resize")()}),0)))},t.showEndscreen=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.hasUserMadeProgress=!0;const t=this.params.globals.get("params").endScreen;this.toolbar.toggleHintFinishButton(!1),this.toolbar.toggleHintTimer(!1);const i=this.getScore(),a=this.getMaxScore(),r=H5P.Question.determineOverallFeedback(t.overallFeedback,i/a),n=this.params.dictionary.get("a11y.yourResult").replace("@score",":num").replace("@total",":total");this.params.globals.get("mainInstance").setFeedback(r,i,a,n);const o=`<p style="text-align: center;">${this.params.dictionary.get("l10n.completedMap")}</p>`;if(i>=a&&this.livesLeft>0&&("number"!=typeof this.timeLeft||this.timeLeft>0)){const e=t.success;this.endScreen.setMedium(e.endScreenMediumSuccess);const i=s.isHTMLWidgetFilled(e.endScreenTextSuccess)?e.endScreenTextSuccess:o;this.endScreen.setIntroduction(i),this.isShowingSolutions||this.params.jukebox.play("endscreenSuccess")}else{const e=t.noSuccess;this.endScreen.setMedium(e.endScreenMediumNoSuccess);let r=s.isHTMLWidgetFilled(e.endScreenTextNoSuccess)?e.endScreenTextNoSuccess:o;0===this.livesLeft&&i>=a?r=`${r}<p style="text-align: center;">${this.params.dictionary.get("l10n.fullScoreButnoLivesLeft")}</p>`:0===this.timer?.getTime()&&i>=a&&(r=`${r}<p style="text-align: center;">${this.params.dictionary.get("l10n.fullScoreButTimeout")}</p>`),this.endScreen.setIntroduction(r),this.isShowingSolutions||this.params.jukebox.play("endscreenNoSuccess")}this.hide(),this.endScreen.show(e)},t.setFullscreen=function(e){this.isFullscreenActive=e;const t=window.getComputedStyle(this.contentDOM),i=parseFloat(t.getPropertyValue("margin-left"))+parseFloat(t.getPropertyValue("margin-right")),a=parseFloat(t.getPropertyValue("margin-top"))+parseFloat(t.getPropertyValue("margin-bottom"));this.map.setFullscreen(e,{width:window.innerWidth-i,height:window.innerHeight-a-this.toolbar.getFullHeight()}),this.toolbar.forceButton("fullscreen",e?1:0,{noCallback:!0})},e}();_.CONVENIENCE_MARGIN_PX=32,_.MUSIC_FADE_TIME=2e3,_.ATTENTION_SEEKER_TIMEOUT_MS=1e4;let Q=function(){function e(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.dom=document.createElement("div"),this.dom.classList.add("h5p-game-map-message-box");const i=document.createElement("p");i.classList.add("h5p-game-map-message-box-message"),i.innerText=t.text||e.DEFAULT_TEXT,this.dom.append(i)}return e.prototype.getDOM=function(){return this.dom},e}();Q.DEFAULT_TEXT="Something important was supposed to be here.";let $=function(){function e(){}var t=e.prototype;return t.getAnswerGiven=function(){return this.main.getAnswerGiven()},t.getScore=function(){return this.main.getScore()},t.getMaxScore=function(){return this.main.getMaxScore()},t.showSolutions=function(){this.main.showSolutions()},t.resetTask=function(){this.contentWasReset=!0,this.main.reset(),this.main.start()},t.getXAPIData=function(){const e=this.createXAPIEvent("completed");return e.data.statement.object.definition.interactionType="compound",{statement:e.data.statement,children:this.main.getXAPIData()}},t.getCurrentState=function(){return this.main?this.getAnswerGiven()||this.params.behaviour.timeLimitGlobal?{content:this.main.getCurrentState()}:this.contentWasReset?{}:void 0:{}},t.getContext=function(){return this.main.getContext()},e}(),Y=function(){function e(){}var t=e.prototype;return t.triggerXAPIEvent=function(e){const t=this.createXAPIEvent(e);this.trigger(t)},t.createXAPIEvent=function(e){const t=this.createXAPIEventTemplate(e);return s.extend(t.getVerifiedStatementValue(["object","definition"]),this.getXAPIDefinition()),"completed"!==e&&"answered"!==e||t.setScoredResult(this.getScore(),this.getMaxScore(),this,!0,this.getScore()===this.getMaxScore()),t},t.getXAPIDefinition=function(){const e={name:{}};return e.name[this.languageTag]=this.getTitle(),e.name["en-US"]=e.name[this.languageTag],e.description={},e.description[this.languageTag]=this.getDescription(),e.description["en-US"]=e.description[this.languageTag],e.type="http://adlnet.gov/expapi/activities/cmi.interaction",e.interactionType="other",e},t.getTitle=function(){return H5P.createTitle(this.extras?.metadata?.title||e.DEFAULT_DESCRIPTION)},t.getDescription=function(){return this.params.header||e.DEFAULT_DESCRIPTION},e}();function X(e,t){return X=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},X(e,t)}Y.DEFAULT_DESCRIPTION="Game Map";let K=function(e){var i,a;function l(i,a){var c;let u=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};c=e.call(this,"game-map")||this,s.addMixins(l,[$,Y]);const h=s.extend({behaviour:{finishScore:1/0,enableCheckButton:!0}},t.getSemanticsDefaults());c.params=s.extend(h,i),"free"===c.params.behaviour.roaming&&(c.params.visual.paths.style.colorPathCleared=c.params.visual.paths.style.colorPath);const d=window.matchMedia("(prefers-reduced-motion: reduce)")?.matches;c.params.visual.misc.useAnimation=c.params.visual.misc.useAnimation&&!d,c.params.gamemapSteps.gamemap.elements=c.params.gamemapSteps.gamemap.elements.filter((e=>e.contentType?.library||e.specialStageType)).map((e=>(e.animDuration=c.params.visual.misc.useAnimation?l.EXERCISE_SCREEN_ANIM_DURATION_MS:0,e))),c.contentId=a,c.extras=u;const p=c.isRoot()&&H5P.fullscreenSupported;c.globals=new n,c.globals.set("mainInstance",function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(c)),c.globals.set("contentId",c.contentId),c.globals.set("params",c.params),c.globals.set("extras",c.extras),c.globals.set("states",l.STATES),c.globals.set("isFullscreenSupported",p),c.globals.set("resize",(()=>{c.trigger("resize")})),c.globals.set("read",(e=>{c.read(e)})),c.dictionary=new r,c.dictionary.fill({l10n:c.params.l10n,a11y:c.params.a11y}),c.jukebox=new o,c.fillJukebox();const m=u?.metadata?.defaultLanguage||"en";c.languageTag=s.formatLanguageCode(m),c.dom=c.buildDOM();const g=c.params.gamemapSteps.gamemap.elements.some((e=>e.contentType));if(c.params.gamemapSteps.backgroundImageSettings?.backgroundImage)if(g)c.main=new _({dictionary:c.dictionary,globals:c.globals,jukebox:c.jukebox},{onProgressChanged:e=>{c.handleProgressChanged(e)},onFinished:()=>{c.handleFinished()},onFullscreenClicked:()=>{c.handleFullscreenClicked()},onRestarted:()=>{c.resetTask()}}),c.dom.append(c.main.getDOM()),c.on("resize",(()=>{c.main.resize()}));else{const e=new Q({text:c.dictionary.get("l10n.noStages")});c.dom.append(e.getDOM())}else{const e=new Q({text:c.dictionary.get("l10n.noBackground")});c.dom.append(e.getDOM())}if(p){c.on("enterFullScreen",(()=>{window.setTimeout((()=>{c.main.setFullscreen(!0)}),50)})),c.on("exitFullScreen",(()=>{c.main.setFullscreen(!1)}));const e=()=>{H5P.isFullscreen&&setTimeout((()=>{c.main.setFullscreen(!0)}),200)};screen?.orientation?.addEventListener?screen?.orientation?.addEventListener("change",(()=>{e()})):window.addEventListener("orientationchange",(()=>{e()}),!1)}return c}a=e,(i=l).prototype=Object.create(a.prototype),i.prototype.constructor=i,X(i,a);var c=l.prototype;return c.registerDomElements=function(){this.setContent(this.dom)},c.buildDOM=function(){const e=document.createElement("div");return e.classList.add("h5p-game-map"),e},c.fillJukebox=function(){const e={};if(this.params.audio.backgroundMusic.music?.[0]?.path){const t=H5P.getPath(this.params.audio.backgroundMusic.music[0].path,this.contentId),i=H5P.getCrossOrigin?.(this.params.audio.backgroundMusic.music[0])??"Anonymous";e.backgroundMusic={src:t,crossOrigin:i,options:{loop:!0,groupId:"background"}}}for(const t in this.params.audio.ambient){if(!this.params.audio.ambient[t]?.[0]?.path)continue;const i=H5P.getPath(this.params.audio.ambient[t][0].path,this.contentId),a=H5P.getCrossOrigin?.(this.params.audio.ambient[t][0])??"Anonymous";e[t]={src:i,crossOrigin:a}}this.jukebox.fill(e)},c.handleProgressChanged=function(e){const t=this.createXAPIEventTemplate("progressed");t.data.statement.object.definition.extensions["http://id.tincanapi.com/extension/ending-point"]=e,this.trigger(t)},c.handleFinished=function(){const e=this.createXAPIEventTemplate("completed");s.extend(e.getVerifiedStatementValue(["object","definition"]),this.getXAPIDefinition()),e.setScoredResult(this.getScore(),this.getMaxScore(),this,!0,this.getScore()===this.getMaxScore()),this.trigger(e)},c.handleFullscreenClicked=function(){setTimeout((()=>{this.toggleFullscreen()}),300)},c.toggleFullscreen=function(e){this.dom&&("string"==typeof e&&("enter"===e?e=!1:"exit"===e&&(e=!0)),"boolean"!=typeof e&&(e=!H5P.isFullscreen),e?(this.container=this.container||this.dom.closest(".h5p-container"),this.container&&H5P.fullScreen(H5P.jQuery(this.container),this)):H5P.exitFullScreen())},l}(H5P.Question);K.STATES={unstarted:0,locked:1,unlocking:2,open:3,opened:4,completed:5,cleared:6,sealed:7},K.EXERCISE_SCREEN_ANIM_DURATION_MS=1e3,H5P.GameMap=K}()}();;
