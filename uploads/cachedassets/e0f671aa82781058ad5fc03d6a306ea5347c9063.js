var H5P = H5P || {};

/**
 * H5P audio module
 *
 * @external {jQuery} $ H5P.jQuery
 */
H5P.Audio = (function ($) {
  /**
  * @param {Object} params Options for this library.
  * @param {Number} id Content identifier.
  * @param {Object} extras Extras.
  * @returns {undefined}
  */
  function C(params, id, extras) {
    H5P.EventDispatcher.call(this);

    this.contentId = id;
    this.params = params;
    this.extras = extras;
    this.toggleButtonEnabled = true;

    // Retrieve previous state
    if (extras && extras.previousState !== undefined) {
      this.oldTime = extras.previousState.currentTime;
    }

    this.params = $.extend({}, {
      playerMode: 'minimalistic',
      fitToWrapper: false,
      controls: true,
      autoplay: false,
      audioNotSupported: "Your browser does not support this audio",
      playAudio: "Play audio",
      pauseAudio: "Pause audio"
    }, params);

    // Required if e.g. used in CoursePresentation as area to click on
    if (this.params.playerMode === 'transparent') {
      this.params.fitToWrapper = true;
    }

    this.on('resize', this.resize, this);
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Adds a minimalistic audio player with only "play" and "pause" functionality.
   *
   * @param {jQuery} $container Container for the player.
   * @param {boolean} transparentMode true: the player is only visible when hovering over it; false: player's UI always visible
   */
  C.prototype.addMinimalAudioPlayer = function ($container, transparentMode) {
    var INNER_CONTAINER = 'h5p-audio-inner';
    var AUDIO_BUTTON = 'h5p-audio-minimal-button';
    var PLAY_BUTTON = 'h5p-audio-minimal-play';
    var PLAY_BUTTON_PAUSED = 'h5p-audio-minimal-play-paused';
    var PAUSE_BUTTON = 'h5p-audio-minimal-pause';

    var self = this;
    this.$container = $container;

    self.$inner = $('<div/>', {
      'class': INNER_CONTAINER + (transparentMode ? ' h5p-audio-transparent' : '')
    }).appendTo($container);

    var audioButton = $('<button/>', {
      'class': AUDIO_BUTTON + " " + PLAY_BUTTON,
      'aria-label': this.params.playAudio
    }).appendTo(self.$inner)
      .click( function () {
        if (!self.isEnabledToggleButton()) {
          return;
        }

        // Prevent ARIA from playing over audio on click
        this.setAttribute('aria-hidden', 'true');

        if (self.audio.paused) {
          self.play();
        }
        else {
          self.pause();
        }
      })
      .on('focusout', function () {
        // Restore ARIA, required when playing longer audio and tabbing out and back in
        this.setAttribute('aria-hidden', 'false');
      });

    // Fit to wrapper
    if (this.params.fitToWrapper) {
      audioButton.css({
        'width': '100%',
        'height': '100%'
      });
    }

    //Event listeners that change the look of the player depending on events.
    self.audio.addEventListener('ended', function () {
      audioButton
        .attr('aria-hidden', false)
        .attr('aria-label', self.params.playAudio)
        .removeClass(PAUSE_BUTTON)
        .removeClass(PLAY_BUTTON_PAUSED)
        .addClass(PLAY_BUTTON);
    });

    self.audio.addEventListener('play', function () {
      audioButton
        .attr('aria-label', self.params.pauseAudio)
        .removeClass(PLAY_BUTTON)
        .removeClass(PLAY_BUTTON_PAUSED)
        .addClass(PAUSE_BUTTON);
    });

    self.audio.addEventListener('pause', function () {
      // Don't override if initial look is set
      if (!audioButton.hasClass(PLAY_BUTTON)) {
        audioButton
          .attr('aria-hidden', false)
          .attr('aria-label', self.params.playAudio)
          .removeClass(PAUSE_BUTTON)
          .addClass(PLAY_BUTTON_PAUSED);
      }
    });

    H5P.Audio.MINIMAL_BUTTON = AUDIO_BUTTON + " " + PLAY_BUTTON;
    H5P.Audio.MINIMAL_BUTTON_PAUSED = AUDIO_BUTTON + " " + PLAY_BUTTON_PAUSED;

    this.$audioButton = audioButton;
    // Scale icon to container
    self.resize();
  };

  /**
   * Resizes the audio player icon when the wrapper is resized.
   */
  C.prototype.resize = function () {
    // Find the smallest value of height and width, and use it to choose the font size.
    if (this.params.fitToWrapper && this.$container && this.$container.width()) {
      var w = this.$container.width();
      var h = this.$container.height();
      if (w < h) {
        this.$audioButton.css({'font-size': w / 2 + 'px'});
      }
      else {
        this.$audioButton.css({'font-size': h / 2 + 'px'});
      }
    }
  };

  return C;
})(H5P.jQuery);

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 *
 * @param {jQuery} $wrapper Our poor container.
 */
H5P.Audio.prototype.attach = function ($wrapper) {
  const self = this;
  $wrapper.addClass('h5p-audio-wrapper');

  // Check if browser supports audio.
  var audio = document.createElement('audio');
  if (audio.canPlayType === undefined) {
    this.attachNotSupportedMessage($wrapper);
    return;
  }

  // Add supported source files.
  if (this.params.files !== undefined && this.params.files instanceof Object) {
    for (var i = 0; i < this.params.files.length; i++) {
      var file = this.params.files[i];

      if (audio.canPlayType(file.mime)) {
        var source = document.createElement('source');
        source.src = H5P.getPath(file.path, this.contentId);
        source.type = file.mime;
        audio.appendChild(source);
      }
    }
  }

  if (!audio.children.length) {
    this.attachNotSupportedMessage($wrapper);
    return;
  }

  if (this.endedCallback !== undefined) {
    audio.addEventListener('ended', this.endedCallback, false);
  }

  audio.className = 'h5p-audio';
  audio.controls = this.params.controls === undefined ? true : this.params.controls;

  // Menu removed, because it's cut off if audio is used as H5P.Question intro
  const controlsList = 'nodownload noplaybackrate';
  audio.setAttribute('controlsList', controlsList);

  audio.preload = 'auto';
  audio.style.display = 'block';

  if (this.params.fitToWrapper === undefined || this.params.fitToWrapper) {
    audio.style.width = '100%';
    if (!this.isRoot()) {
      // Only set height if this isn't a root
      audio.style.height = '100%';
    }
  }

  this.audio = audio;

  if (this.params.playerMode === 'minimalistic') {
    audio.controls = false;
    this.addMinimalAudioPlayer($wrapper, false);
  }
  else if (this.params.playerMode === 'transparent') {
    audio.controls = false;
    this.addMinimalAudioPlayer($wrapper, true);
  }
  else {
    $wrapper.html(audio);
  }

  if (audio.controls) {
    $wrapper.addClass('h5p-audio-controls');
  }

  // Set time to saved time from previous run
  if (this.oldTime) {
    if (this.$audioButton) {
      this.$audioButton.attr('class', H5P.Audio.MINIMAL_BUTTON_PAUSED);
    }
    this.seekTo(this.oldTime);
  }

  // Avoid autoplaying in authoring tool
  if (window.H5PEditor === undefined) {
    // Keep record of autopauses.
    // I.e: we don't wanna autoplay if the user has excplicitly paused.
    self.autoPaused = true;

    // Set up intersection observer
    new IntersectionObserver(function (entries) {
      const entry = entries[0];

      if (entry.intersectionRatio == 0) {
        if (!self.audio.paused) {
          // Audio element is hidden, pause it
          self.autoPaused = true;
          self.audio.pause();
        }
      }
      else if (self.params.autoplay && self.autoPaused) {
        // Audio element is visible. Autoplay if autoplay is enabled and it was
        // not explicitly paused by a user
        self.autoPaused = false;
        self.play();
      }
    }, {
      root: document.documentElement,
      threshold: [0, 1] // Get events when it is shown and hidden
    }).observe($wrapper.get(0));
  }
};

/**
 * Attaches not supported message.
 *
 * @param {jQuery} $wrapper Our dear container.
 */
H5P.Audio.prototype.attachNotSupportedMessage = function ($wrapper) {
  $wrapper.addClass('h5p-audio-not-supported');
  $wrapper.html(
    '<div class="h5p-audio-inner">' +
      '<div class="h5p-audio-not-supported-icon"><span/></div>' +
      '<span>' + this.params.audioNotSupported + '</span>' +
    '</div>'
  );

  if (this.endedCallback !== undefined) {
    this.endedCallback();
  }
}

/**
 * Stop & reset playback.
 *
 * @returns {undefined}
 */
H5P.Audio.prototype.resetTask = function () {
  this.stop();
  this.seekTo(0);
  if (this.$audioButton) {
    this.$audioButton.attr('class', H5P.Audio.MINIMAL_BUTTON);
  }
};

/**
 * Stop the audio. TODO: Rename to pause?
 *
 * @returns {undefined}
 */
H5P.Audio.prototype.stop = function () {
  if (this.audio !== undefined) {
    this.audio.pause();
  }
};

/**
 * Play
 */
H5P.Audio.prototype.play = function () {
  if (this.audio !== undefined) {
    // play() returns a Promise that can fail, e.g. while autoplaying
    this.audio.play().catch((error) => {
      console.warn(error);
    });
  }
};

/**
 * @public
 * Pauses the audio.
 */
H5P.Audio.prototype.pause = function () {
  if (this.audio !== undefined) {
    this.audio.pause();
  }
};

/**
 * @public
 * Seek to audio position.
 *
 * @param {number} seekTo Time to seek to in seconds.
 */
H5P.Audio.prototype.seekTo = function (seekTo) {
  if (this.audio !== undefined) {
    this.audio.currentTime = seekTo;
  }
};

/**
 * @public
 * Get current state for resetting it later.
 *
 * @returns {object} Current state.
 */
H5P.Audio.prototype.getCurrentState = function () {
  if (this.audio !== undefined && this.audio.currentTime > 0) {
    const currentTime = this.audio.ended ? 0 : this.audio.currentTime;
    return {
      currentTime: currentTime
    };
  }
};

/**
 * @public
 * Disable button.
 * Not using disabled attribute to block button activation, because it will
 * implicitly set tabindex = -1 and confuse ChromeVox navigation. Clicks handled
 * using "pointer-events: none" in CSS.
 */
H5P.Audio.prototype.disableToggleButton = function () {
  this.toggleButtonEnabled = false;
  if (this.$audioButton) {
    this.$audioButton.addClass(H5P.Audio.BUTTON_DISABLED);
  }
};

/**
 * @public
 * Enable button.
 */
H5P.Audio.prototype.enableToggleButton = function () {
  this.toggleButtonEnabled = true;
  if (this.$audioButton) {
    this.$audioButton.removeClass(H5P.Audio.BUTTON_DISABLED);
  }
};

/**
 * @public
 * Check if button is enabled.
 * @return {boolean} True, if button is enabled. Else false.
 */
H5P.Audio.prototype.isEnabledToggleButton = function () {
  return this.toggleButtonEnabled;
};

/** @constant {string} */
H5P.Audio.BUTTON_DISABLED = 'h5p-audio-disabled';
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
// Will render a Question with multiple choices for answers.

// Options format:
// {
//   title: "Optional title for question box",
//   question: "Question text",
//   answers: [{text: "Answer text", correct: false}, ...],
//   singleAnswer: true, // or false, will change rendered output slightly.
//   singlePoint: true,  // True if question give a single point score only
//                       // if all are correct, false to give 1 point per
//                       // correct answer. (Only for singleAnswer=false)
//   randomAnswers: false  // Whether to randomize the order of answers.
// }
//
// Events provided:
// - h5pQuestionAnswered: Triggered when a question has been answered.

var H5P = H5P || {};

/**
 * @typedef {Object} Options
 *   Options for multiple choice
 *
 * @property {Object} behaviour
 * @property {boolean} behaviour.confirmCheckDialog
 * @property {boolean} behaviour.confirmRetryDialog
 *
 * @property {Object} UI
 * @property {string} UI.tipsLabel
 *
 * @property {Object} [confirmRetry]
 * @property {string} [confirmRetry.header]
 * @property {string} [confirmRetry.body]
 * @property {string} [confirmRetry.cancelLabel]
 * @property {string} [confirmRetry.confirmLabel]
 *
 * @property {Object} [confirmCheck]
 * @property {string} [confirmCheck.header]
 * @property {string} [confirmCheck.body]
 * @property {string} [confirmCheck.cancelLabel]
 * @property {string} [confirmCheck.confirmLabel]
 */

/**
 * Module for creating a multiple choice question
 *
 * @param {Options} options
 * @param {number} contentId
 * @param {Object} contentData
 * @returns {H5P.MultiChoice}
 * @constructor
 */
H5P.MultiChoice = function (options, contentId, contentData) {
  if (!(this instanceof H5P.MultiChoice))
    return new H5P.MultiChoice(options, contentId, contentData);
  var self = this;
  this.contentId = contentId;
  this.contentData = contentData;
  H5P.Question.call(self, 'multichoice');
  var $ = H5P.jQuery;

  var defaults = {
    image: null,
    question: "No question text provided",
    answers: [
      {
        tipsAndFeedback: {
          tip: '',
          chosenFeedback: '',
          notChosenFeedback: ''
        },
        text: "Answer 1",
        correct: true
      }
    ],
    overallFeedback: [],
    weight: 1,
    userAnswers: [],
    UI: {
      checkAnswerButton: 'Check',
      submitAnswerButton: 'Submit',
      showSolutionButton: 'Show solution',
      tryAgainButton: 'Try again',
      scoreBarLabel: 'You got :num out of :total points',
      tipAvailable: "Tip available",
      feedbackAvailable: "Feedback available",
      readFeedback: 'Read feedback',
      shouldCheck: "Should have been checked",
      shouldNotCheck: "Should not have been checked",
      noInput: 'Input is required before viewing the solution',
      a11yCheck: 'Check the answers. The responses will be marked as correct, incorrect, or unanswered.',
      a11yShowSolution: 'Show the solution. The task will be marked with its correct solution.',
      a11yRetry: 'Retry the task. Reset all responses and start the task over again.',
    },
    behaviour: {
      enableRetry: true,
      enableSolutionsButton: true,
      enableCheckButton: true,
      type: 'auto',
      singlePoint: true,
      randomAnswers: false,
      showSolutionsRequiresInput: true,
      autoCheck: false,
      passPercentage: 100,
      showScorePoints: true
    }
  };
  var params = $.extend(true, defaults, options);
  // Keep track of number of correct choices
  var numCorrect = 0;

  // Loop through choices
  for (var i = 0; i < params.answers.length; i++) {
    var answer = params.answers[i];

    // Make sure tips and feedback exists
    answer.tipsAndFeedback = answer.tipsAndFeedback || {};

    if (params.answers[i].correct) {
      // Update number of correct choices
      numCorrect++;
    }
  }

  // Determine if no choices is the correct
  var blankIsCorrect = (numCorrect === 0);

  // Determine task type
  if (params.behaviour.type === 'auto') {
    // Use single choice if only one choice is correct
    params.behaviour.singleAnswer = (numCorrect === 1);
  }
  else {
    params.behaviour.singleAnswer = (params.behaviour.type === 'single');
  }

  var getCheckboxOrRadioIcon = function (radio, selected) {
    var icon;
    if (radio) {
      icon = selected ? '&#xe603;' : '&#xe600;';
    }
    else {
      icon = selected ? '&#xe601;' : '&#xe602;';
    }
    return icon;
  };

  // Initialize buttons and elements.
  var $myDom;
  var $feedbackDialog;

  /**
   * Remove all feedback dialogs
   */
  var removeFeedbackDialog = function () {
    // Remove the open feedback dialogs.
    $myDom.unbind('click', removeFeedbackDialog);
    $myDom.find('.h5p-feedback-button, .h5p-feedback-dialog').remove();
    $myDom.find('.h5p-has-feedback').removeClass('h5p-has-feedback');
    if ($feedbackDialog) {
      $feedbackDialog.remove();
    }
  };

  var score = 0;
  var solutionsVisible = false;

  /**
   * Add feedback to element
   * @param {jQuery} $element Element that feedback will be added to
   * @param {string} feedback Feedback string
   */
  var addFeedback = function ($element, feedback) {
    $feedbackDialog = $('' +
    '<div class="h5p-feedback-dialog">' +
      '<div class="h5p-feedback-inner">' +
        '<div class="h5p-feedback-text">' + feedback + '</div>' +
      '</div>' +
    '</div>');

    //make sure feedback is only added once
    if (!$element.find($('.h5p-feedback-dialog')).length) {
      $feedbackDialog.appendTo($element.addClass('h5p-has-feedback'));
    }
  };

  /**
   * Register the different parts of the task with the H5P.Question structure.
   */
  self.registerDomElements = function () {
    var media = params.media;
    if (media && media.type && media.type.library) {
      media = media.type;
      var type = media.library.split(' ')[0];
      if (type === 'H5P.Image') {
        if (media.params.file) {
          // Register task image
          self.setImage(media.params.file.path, {
            disableImageZooming: params.media.disableImageZooming || false,
            alt: media.params.alt,
            title: media.params.title,
            expandImage: media.params.expandImage,
            minimizeImage: media.params.minimizeImage
          });
        }
      }
      else if (type === 'H5P.Video') {
        if (media.params.sources) {
          // Register task video
          self.setVideo(media);
        }
      }
      else if (type === 'H5P.Audio') {
        if (media.params.files) {
          // Register task audio
          self.setAudio(media);
        }
      }
    }

    // Determine if we're using checkboxes or radio buttons
    for (var i = 0; i < params.answers.length; i++) {
      params.answers[i].checkboxOrRadioIcon = getCheckboxOrRadioIcon(params.behaviour.singleAnswer, params.userAnswers.indexOf(i) > -1);
    }

    // Register Introduction
    self.setIntroduction('<div id="' + params.labelId + '">' + params.question + '</div>');

    // Register task content area
    $myDom = $('<ul>', {
      'class': 'h5p-answers',
      role: params.role,
      'aria-labelledby': params.labelId
    });

    for (let i = 0; i < params.answers.length; i++) {
      const answer = params.answers[i];
      answer.text = answer.text ?? '<div></div>';
      $('<li>', {
        'class': 'h5p-answer',
        role: answer.role,
        tabindex: answer.tabindex,
        'aria-checked': answer.checked,
        'data-id': i,
        html: '<div class="h5p-alternative-container"><span class="h5p-alternative-inner">' + answer.text + '</span></div>',
        appendTo: $myDom
      });
    }

    self.setContent($myDom, {
      'class': params.behaviour.singleAnswer ? 'h5p-radio' : 'h5p-check'
    });

    // Create tips:
    var $answers = $('.h5p-answer', $myDom).each(function (i) {

      var tip = params.answers[i].tipsAndFeedback.tip;
      if (tip === undefined) {
        return; // No tip
      }

      tip = tip.trim();
      var tipContent = tip
        .replace(/&nbsp;/g, '')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '')
        .trim();
      if (!tipContent.length) {
        return; // Empty tip
      }
      else {
        $(this).addClass('h5p-has-tip');
      }

      // Add tip
      var $wrap = $('<div/>', {
        'class': 'h5p-multichoice-tipwrap',
        'aria-label': params.UI.tipAvailable + '.'
      });

      var $multichoiceTip = $('<div>', {
        'role': 'button',
        'tabindex': 0,
        'title': params.UI.tipsLabel,
        'aria-label': params.UI.tipsLabel,
        'aria-expanded': false,
        'class': 'multichoice-tip',
        appendTo: $wrap
      });

      var tipIconHtml = '<span class="joubel-icon-tip-normal">' +
                          '<span class="h5p-icon-shadow"></span>' +
                          '<span class="h5p-icon-speech-bubble"></span>' +
                          '<span class="h5p-icon-info"></span>' +
                        '</span>';

      $multichoiceTip.append(tipIconHtml);

      $multichoiceTip.click(function () {
        var $tipContainer = $multichoiceTip.parents('.h5p-answer');
        var openFeedback = !$tipContainer.children('.h5p-feedback-dialog').is($feedbackDialog);
        removeFeedbackDialog();

        // Do not open feedback if it was open
        if (openFeedback) {
          $multichoiceTip.attr('aria-expanded', true);

          // Add tip dialog
          addFeedback($tipContainer, tip);
          $feedbackDialog.addClass('h5p-has-tip');

          // Tip for readspeaker
          self.read(tip);
        }
        else {
          $multichoiceTip.attr('aria-expanded', false);
        }

        self.trigger('resize');

        // Remove tip dialog on dom click
        setTimeout(function () {
          $myDom.click(removeFeedbackDialog);
        }, 100);

        // Do not propagate
        return false;
      }).keydown(function (e) {
        if (e.which === 32) {
          $(this).click();
          return false;
        }
      });

      $('.h5p-alternative-container', this).append($wrap);
    });

    // Set event listeners.
    var toggleCheck = function ($ans) {
      if ($ans.attr('aria-disabled') === 'true') {
        return;
      }
      self.answered = true;
      var num = parseInt($ans.data('id'));
      if (params.behaviour.singleAnswer) {
        // Store answer
        params.userAnswers = [num];

        // Calculate score
        score = (params.answers[num].correct ? 1 : 0);

        // De-select previous answer
        $answers.not($ans).removeClass('h5p-selected').attr('tabindex', '-1').attr('aria-checked', 'false');

        // Select new answer
        $ans.addClass('h5p-selected').attr('tabindex', '0').attr('aria-checked', 'true');
      }
      else {
        if ($ans.attr('aria-checked') === 'true') {
          const pos = params.userAnswers.indexOf(num);
          if (pos !== -1) {
            params.userAnswers.splice(pos, 1);
          }

          // Do not allow un-checking when retry disabled and auto check
          if (params.behaviour.autoCheck && !params.behaviour.enableRetry) {
            return;
          }

          // Remove check
          $ans.removeClass('h5p-selected').attr('aria-checked', 'false');
        }
        else {
          params.userAnswers.push(num);
          $ans.addClass('h5p-selected').attr('aria-checked', 'true');
        }

        // Calculate score
        calcScore();
      }

      self.triggerXAPI('interacted');
      hideSolution($ans);

      if (params.userAnswers.length) {
        self.showButton('check-answer');
        self.hideButton('try-again');
        self.hideButton('show-solution');

        if (params.behaviour.autoCheck) {
          if (params.behaviour.singleAnswer) {
            // Only a single answer allowed
            checkAnswer();
          }
          else {
            // Show feedback for selected alternatives
            self.showCheckSolution(true);

            // Always finish task if it was completed successfully
            if (score === self.getMaxScore()) {
              checkAnswer();
            }
          }
        }
      }
    };

    $answers.click(function () {
      toggleCheck($(this));
    }).keydown(function (e) {
      if (e.keyCode === 32) { // Space bar
        // Select current item
        toggleCheck($(this));
        return false;
      }

      if (params.behaviour.singleAnswer) {
        switch (e.keyCode) {
          case 38:   // Up
          case 37: { // Left
            // Try to select previous item
            var $prev = $(this).prev();
            if ($prev.length) {
              toggleCheck($prev.focus());
            }
            return false;
          }
          case 40:   // Down
          case 39: { // Right
            // Try to select next item
            var $next = $(this).next();
            if ($next.length) {
              toggleCheck($next.focus());
            }
            return false;
          }
        }
      }
    });

    if (params.behaviour.singleAnswer) {
      // Special focus handler for radio buttons
      $answers.focus(function () {
        if ($(this).attr('aria-disabled') !== 'true') {
          $answers.not(this).attr('tabindex', '-1');
        }
      }).blur(function () {
        if (!$answers.filter('.h5p-selected').length) {
          $answers.first().add($answers.last()).attr('tabindex', '0');
        }
      });
    }

    // Adds check and retry button
    addButtons();
    if (!params.behaviour.singleAnswer) {

      calcScore();
    }
    else {
      if (params.userAnswers.length && params.answers[params.userAnswers[0]].correct) {
        score = 1;
      }
      else {
        score = 0;
      }
    }

    // Has answered through auto-check in a previous session
    if (hasCheckedAnswer && params.behaviour.autoCheck) {

      // Check answers if answer has been given or max score reached
      if (params.behaviour.singleAnswer || score === self.getMaxScore()) {
        checkAnswer();
      }
      else {
        // Show feedback for checked checkboxes
        self.showCheckSolution(true);
      }
    }
  };

  this.showAllSolutions = function () {
    if (solutionsVisible) {
      return;
    }
    solutionsVisible = true;

    $myDom.find('.h5p-answer').each(function (i, e) {
      var $e = $(e);
      var a = params.answers[i];
      const className = 'h5p-solution-icon-' + (params.behaviour.singleAnswer ? 'radio' : 'checkbox');

      if (a.correct) {
        $e.addClass('h5p-should').append($('<span/>', {
          'class': className,
          html: params.UI.shouldCheck + '.'
        }));
      }
      else {
        $e.addClass('h5p-should-not').append($('<span/>', {
          'class': className,
          html: params.UI.shouldNotCheck + '.'
        }));
      }
    }).find('.h5p-question-plus-one, .h5p-question-minus-one').remove();

    // Make sure input is disabled in solution mode
    disableInput();

    // Move focus back to the first alternative so that the user becomes
    // aware that the solution is being shown.
    $myDom.find('.h5p-answer:first-child').focus();

    //Hide buttons and retry depending on settings.
    self.hideButton('check-answer');
    self.hideButton('show-solution');
    if (params.behaviour.enableRetry) {
      self.showButton('try-again');
    }
    self.trigger('resize');
  };

  /**
   * Used in contracts.
   * Shows the solution for the task and hides all buttons.
   */
  this.showSolutions = function () {
    removeFeedbackDialog();
    self.showCheckSolution();
    self.showAllSolutions();
    disableInput();
    self.hideButton('try-again');
  };

  /**
   * Hide solution for the given answer(s)
   *
   * @private
   * @param {H5P.jQuery} $answer
   */
  var hideSolution = function ($answer) {
    $answer
      .removeClass('h5p-correct')
      .removeClass('h5p-wrong')
      .removeClass('h5p-should')
      .removeClass('h5p-should-not')
      .removeClass('h5p-has-feedback')
      .find('.h5p-question-plus-one, ' +
        '.h5p-question-minus-one, ' +
        '.h5p-answer-icon, ' +
        '.h5p-solution-icon-radio, ' +
        '.h5p-solution-icon-checkbox, ' +
        '.h5p-feedback-dialog')
        .remove();
  };

  /**
   *
   */
  this.hideSolutions = function () {
    solutionsVisible = false;

    hideSolution($('.h5p-answer', $myDom));

    this.removeFeedback(); // Reset feedback

    self.trigger('resize');
  };

  /**
   * Resets the whole task.
   * Used in contracts with integrated content.
   * @private
   * @param {boolean} moveFocus True to move the focus to first option
   * This prevents loss of focus if reset from within content
   */
  this.resetTask = function (moveFocus = false) {
    for (let i = 0; i < params.answers.length; i++) {
      if (params.answers[i].checked) {
        delete params.answers[i].checked;
      }
    }
    self.answered = false;
    self.hideSolutions();
    params.userAnswers = [];
    removeSelections(moveFocus);
    self.showButton('check-answer');
    self.hideButton('try-again');
    self.hideButton('show-solution');
    enableInput();
    $myDom?.find('.h5p-feedback-available').remove();
  };

  var calculateMaxScore = function () {
    if (blankIsCorrect) {
      return params.weight;
    }
    var maxScore = 0;
    for (var i = 0; i < params.answers.length; i++) {
      var choice = params.answers[i];
      if (choice.correct) {
        maxScore += (choice.weight !== undefined ? choice.weight : 1);
      }
    }
    return maxScore;
  };

  this.getMaxScore = function () {
    return (!params.behaviour.singleAnswer && !params.behaviour.singlePoint ? calculateMaxScore() : params.weight);
  };

  /**
   * Check answer
   */
  var checkAnswer = function () {
    // Unbind removal of feedback dialogs on click
    $myDom.unbind('click', removeFeedbackDialog);

    // Remove all tip dialogs
    removeFeedbackDialog();

    if (params.behaviour.enableSolutionsButton) {
      self.showButton('show-solution');
    }
    if (params.behaviour.enableRetry) {
      self.showButton('try-again');
    }
    self.hideButton('check-answer');

    self.showCheckSolution();
    disableInput();

    var xAPIEvent = self.createXAPIEventTemplate('answered');
    addQuestionToXAPI(xAPIEvent);
    addResponseToXAPI(xAPIEvent);
    self.trigger(xAPIEvent);
  };

  /**
   * Adds the ui buttons.
   * @private
   */
  var addButtons = function () {
    var $content = $('[data-content-id="' + self.contentId + '"].h5p-content');
    var $containerParents = $content.parents('.h5p-container');

    // select find container to attach dialogs to
    var $container;
    if($containerParents.length !== 0) {
      // use parent highest up if any
      $container = $containerParents.last();
    }
    else if($content.length !== 0){
      $container = $content;
    }
    else  {
      $container = $(document.body);
    }

    // Show solution button
    self.addButton('show-solution', params.UI.showSolutionButton, function () {
      if (params.behaviour.showSolutionsRequiresInput && !self.getAnswerGiven(true)) {
        // Require answer before solution can be viewed
        self.updateFeedbackContent(params.UI.noInput);
        self.read(params.UI.noInput);
      }
      else {
        calcScore();
        self.showAllSolutions();
      }

    }, false, {
      'aria-label': params.UI.a11yShowSolution,
    });

    // Check button
    if (params.behaviour.enableCheckButton && (!params.behaviour.autoCheck || !params.behaviour.singleAnswer)) {
      self.addButton('check-answer', params.UI.checkAnswerButton,
        function () {
          self.answered = true;
          checkAnswer();
          $myDom.find('.h5p-answer:first-child').focus();
        },
        true,
        {
          'aria-label': params.UI.a11yCheck,
        },
        {
          confirmationDialog: {
            enable: params.behaviour.confirmCheckDialog,
            l10n: params.confirmCheck,
            instance: self,
            $parentElement: $container
          },
          contentData: self.contentData,
          textIfSubmitting: params.UI.submitAnswerButton,
        }
      );
    }

    // Try Again button
    self.addButton('try-again', params.UI.tryAgainButton, function () {
      self.resetTask(true);

      if (params.behaviour.randomAnswers) {
        // reshuffle answers
       var oldIdMap = idMap;
       idMap = getShuffleMap();
       var answersDisplayed = $myDom.find('.h5p-answer');
       // remember tips
       var tip = [];
       for (i = 0; i < answersDisplayed.length; i++) {
         tip[i] = $(answersDisplayed[i]).find('.h5p-multichoice-tipwrap');
       }
       // Those two loops cannot be merged or you'll screw up your tips
       for (i = 0; i < answersDisplayed.length; i++) {
         // move tips and answers on display
         $(answersDisplayed[i]).find('.h5p-alternative-inner').html(params.answers[i].text);
         $(tip[i]).detach().appendTo($(answersDisplayed[idMap.indexOf(oldIdMap[i])]).find('.h5p-alternative-container'));
       }
     }
    }, false, {
      'aria-label': params.UI.a11yRetry,
    }, {
      confirmationDialog: {
        enable: params.behaviour.confirmRetryDialog,
        l10n: params.confirmRetry,
        instance: self,
        $parentElement: $container
      }
    });
  };

  /**
   * Determine which feedback text to display
   *
   * @param {number} score
   * @param {number} max
   * @return {string}
   */
  var getFeedbackText = function (score, max) {
    var ratio = (score / max);

    var feedback = H5P.Question.determineOverallFeedback(params.overallFeedback, ratio);

    return feedback.replace('@score', score).replace('@total', max);
  };

  /**
   * Shows feedback on the selected fields.
   * @public
   * @param {boolean} [skipFeedback] Skip showing feedback if true
   */
  this.showCheckSolution = function (skipFeedback) {
    var scorePoints;
    if (!(params.behaviour.singleAnswer || params.behaviour.singlePoint || !params.behaviour.showScorePoints)) {
      scorePoints = new H5P.Question.ScorePoints();
    }

    $myDom.find('.h5p-answer').each(function (i, e) {
      var $e = $(e);
      var a = params.answers[i];
      var chosen = ($e.attr('aria-checked') === 'true');
      if (chosen) {
        if (a.correct) {
          // May already have been applied by instant feedback
          if (!$e.hasClass('h5p-correct')) {
            $e.addClass('h5p-correct').append($('<span/>', {
              'class': 'h5p-answer-icon',
              html: params.UI.correctAnswer + '.'
            }));
          }
        }
        else {
          if (!$e.hasClass('h5p-wrong')) {
            $e.addClass('h5p-wrong').append($('<span/>', {
              'class': 'h5p-answer-icon',
              html: params.UI.wrongAnswer + '.'
            }));
          }
        }

        if (scorePoints) {
          var alternativeContainer = $e[0].querySelector('.h5p-alternative-container');

          if (!params.behaviour.autoCheck || alternativeContainer.querySelector('.h5p-question-plus-one, .h5p-question-minus-one') === null) {
            alternativeContainer.appendChild(scorePoints.getElement(a.correct));
          }
        }
      }

      if (!skipFeedback) {
        if (chosen && a.tipsAndFeedback.chosenFeedback !== undefined && a.tipsAndFeedback.chosenFeedback !== '') {
          addFeedback($e, a.tipsAndFeedback.chosenFeedback);
        }
        else if (!chosen && a.tipsAndFeedback.notChosenFeedback !== undefined && a.tipsAndFeedback.notChosenFeedback !== '') {
          addFeedback($e, a.tipsAndFeedback.notChosenFeedback);
        }
      }
    });

    // Determine feedback
    var max = self.getMaxScore();

    // Disable task if maxscore is achieved
    var fullScore = (score === max);

    if (fullScore) {
      self.hideButton('check-answer');
      self.hideButton('try-again');
      self.hideButton('show-solution');
    }

    // Show feedback
    if (!skipFeedback) {
      this.setFeedback(getFeedbackText(score, max), score, max, params.UI.scoreBarLabel);
    }

    self.trigger('resize');
  };

  /**
   * Disables choosing new input.
   */
  var disableInput = function () {
    $('.h5p-answer', $myDom).attr({
      'aria-disabled': 'true',
      'tabindex': '-1'
    }).removeAttr('role')
      .removeAttr('aria-checked');

    $('.h5p-answers').removeAttr('role');
  };

  /**
   * Enables new input.
   */
  var enableInput = function () {
    $('.h5p-answer', $myDom)
      .attr({
        'aria-disabled': 'false',
        'role': params.behaviour.singleAnswer ? 'radio' : 'checkbox',
      });

    $('.h5p-answers').attr('role', params.role);
  };

  var calcScore = function () {
    score = 0;
    for (const answer of params.userAnswers) {
      const choice = params.answers[answer];
      const weight = (choice.weight !== undefined ? choice.weight : 1);
      if (choice.correct) {
        score += weight;
      }
      else {
        score -= weight;
      }
    }
    if (score < 0) {
      score = 0;
    }
    if (!params.userAnswers.length && blankIsCorrect) {
      score = params.weight;
    }
    if (params.behaviour.singlePoint) {
      score = (100 * score / calculateMaxScore()) >= params.behaviour.passPercentage ? params.weight : 0;
    }
  };

  /**
   * Removes selections from task.
   */
  var removeSelections = function (moveFocus) {
    var $answers = $('.h5p-answer', $myDom)
      .removeClass('h5p-selected')
      .attr('aria-checked', 'false');

    if (!params.behaviour.singleAnswer) {
      $answers.attr('tabindex', '0');
    }
    else {
      $answers.first().attr('tabindex', '0');
    }

    // Set focus to first option
    if (moveFocus || self.isRoot()) {
      $answers.first().focus();
    }

    calcScore();
  };

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  this.getXAPIData = function(){
    var xAPIEvent = this.createXAPIEventTemplate('answered');
    addQuestionToXAPI(xAPIEvent);
    addResponseToXAPI(xAPIEvent);
    return {
      statement: xAPIEvent.data.statement
    };
  };

  /**
   * Add the question itself to the definition part of an xAPIEvent
   */
  var addQuestionToXAPI = function (xAPIEvent) {
    var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    definition.description = {
      // Remove tags, must wrap in div tag because jQuery 1.9 will crash if the string isn't wrapped in a tag.
      'en-US': $('<div>' + params.question + '</div>').text()
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'choice';
    definition.correctResponsesPattern = [];
    definition.choices = [];
    for (var i = 0; i < params.answers.length; i++) {
      definition.choices[i] = {
        'id': params.answers[i].originalOrder + '',
        'description': {
          // Remove tags, must wrap in div tag because jQuery 1.9 will crash if the string isn't wrapped in a tag.
          'en-US': $('<div>' + params.answers[i].text + '</div>').text()
        }
      };
      if (params.answers[i].correct) {
        if (!params.singleAnswer) {
          if (definition.correctResponsesPattern.length) {
            definition.correctResponsesPattern[0] += '[,]';
            // This looks insane, but it's how you separate multiple answers
            // that must all be chosen to achieve perfect score...
          }
          else {
            definition.correctResponsesPattern.push('');
          }
          definition.correctResponsesPattern[0] += params.answers[i].originalOrder;
        }
        else {
          definition.correctResponsesPattern.push('' + params.answers[i].originalOrder);
        }
      }
    }
  };

  /**
   * Add the response part to an xAPI event
   *
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   */
  var addResponseToXAPI = function (xAPIEvent) {
    var maxScore = self.getMaxScore();
    var success = (100 * score / maxScore) >= params.behaviour.passPercentage;

    xAPIEvent.setScoredResult(score, maxScore, self, true, success);
    if (params.userAnswers === undefined) {
      calcScore();
    }

    // Add the response
    var response = '';
    for (var i = 0; i < params.userAnswers.length; i++) {
      if (response !== '') {
        response += '[,]';
      }
      response += idMap === undefined ? params.userAnswers[i] : idMap[params.userAnswers[i]];
    }
    xAPIEvent.data.statement.result.response = response;
  };

  /**
   * Create a map pointing from original answers to shuffled answers
   *
   * @return {number[]} map pointing from original answers to shuffled answers
   */
  var getShuffleMap = function() {
    params.answers = H5P.shuffleArray(params.answers);

    // Create a map from the new id to the old one
    var idMap = [];
    for (i = 0; i < params.answers.length; i++) {
      idMap[i] = params.answers[i].originalOrder;
    }
    return idMap;
  };

  // Initialization code
  // Randomize order, if requested
  var idMap;
  // Store original order in answers
  for (i = 0; i < params.answers.length; i++) {
    params.answers[i].originalOrder = i;
  }
  if (params.behaviour.randomAnswers) {
    idMap = getShuffleMap();
  }

  // Start with an empty set of user answers.
  params.userAnswers = [];

  // Restore previous state
  if (contentData && contentData.previousState !== undefined) {

    // Restore answers
    if (contentData.previousState.answers) {
      if (!idMap) {
        params.userAnswers = contentData.previousState.answers;
      }
      else {
        // The answers have been shuffled, and we must use the id mapping.
        for (i = 0; i < contentData.previousState.answers.length; i++) {
          for (var k = 0; k < idMap.length; k++) {
            if (idMap[k] === contentData.previousState.answers[i]) {
              params.userAnswers.push(k);
            }
          }
        }
      }
      calcScore();
    }
  }

  var hasCheckedAnswer = false;

  // Loop through choices
  for (var j = 0; j < params.answers.length; j++) {
    var ans = params.answers[j];

    if (!params.behaviour.singleAnswer) {
      // Set role
      ans.role = 'checkbox';
      ans.tabindex = '0';
      if (params.userAnswers.indexOf(j) !== -1) {
        ans.checked = 'true';
        hasCheckedAnswer = true;
      }
    }
    else {
      // Set role
      ans.role = 'radio';

      // Determine tabindex, checked and extra classes
      if (params.userAnswers.length === 0) {
        // No correct answers
        if (i === 0 || i === params.answers.length) {
          ans.tabindex = '0';
        }
      }
      else if (params.userAnswers.indexOf(j) !== -1) {
        // This is the correct choice
        ans.tabindex = '0';
        ans.checked = 'true';
        hasCheckedAnswer = true;
      }
    }

    // Set default
    if (ans.tabindex === undefined) {
      ans.tabindex = '-1';
    }
    if (ans.checked === undefined) {
      ans.checked = 'false';
    }
  }

  H5P.MultiChoice.counter = (H5P.MultiChoice.counter === undefined ? 0 : H5P.MultiChoice.counter + 1);
  params.role = (params.behaviour.singleAnswer ? 'radiogroup' : 'group');
  params.labelId = 'h5p-mcq' + H5P.MultiChoice.counter;

  /**
   * Pack the current state of the interactivity into a object that can be
   * serialized.
   *
   * @public
   */
  this.getCurrentState = function () {
    var state = {};
    if (!idMap) {
      state.answers = params.userAnswers;
    }
    else {
      // The answers have been shuffled and must be mapped back to their
      // original ID.
      state.answers = [];
      for (var i = 0; i < params.userAnswers.length; i++) {
        state.answers.push(idMap[params.userAnswers[i]]);
      }
    }
    return state;
  };

  /**
   * Check if user has given an answer.
   *
   * @param {boolean} [ignoreCheck] Ignore returning true from pressing "check-answer" button.
   * @return {boolean} True if answer is given
   */
  this.getAnswerGiven = function (ignoreCheck) {
    var answered = ignoreCheck ? false : this.answered;
    return answered || params.userAnswers.length > 0 || blankIsCorrect;
  };

  this.getScore = function () {
    return score;
  };

  this.getTitle = function () {
    return H5P.createTitle((this.contentData && this.contentData.metadata && this.contentData.metadata.title) ? this.contentData.metadata.title : 'Multiple Choice');
  };
};

H5P.MultiChoice.prototype = Object.create(H5P.Question.prototype);
H5P.MultiChoice.prototype.constructor = H5P.MultiChoice;
;
(()=>{"use strict";const t=H5P.jQuery;class s{constructor(s,e,a,r,i={},d){return this.card=s,this.params=e||{},this.id=a,this.contentId=r,this.callbacks=i,this.$cardWrapper=t("<div>",{class:"h5p-dialogcards-cardwrap",role:"group",tabindex:"-1"}),this.$cardWrapper.addClass("h5p-dialogcards-mode-"+this.params.mode),"repetition"!==this.params.mode&&this.$cardWrapper.attr("aria-labelledby","h5p-dialogcards-progress-"+d),this.$cardHolder=t("<div>",{class:"h5p-dialogcards-cardholder"}).appendTo(this.$cardWrapper),this.createCardContent(s).appendTo(this.$cardHolder),this}createCardContent(s){const e=t("<div>",{class:"h5p-dialogcards-card-content"});this.createCardImage(s).appendTo(e);const a=t("<div>",{class:"h5p-dialogcards-card-text-wrapper"}).appendTo(e),r=t("<div>",{class:"h5p-dialogcards-card-text-inner"}).appendTo(a),i=t("<div>",{class:"h5p-dialogcards-card-text-inner-content"}).appendTo(r);this.createCardAudio(s).appendTo(i);const d=t("<div>",{class:"h5p-dialogcards-card-text"}).appendTo(i);return this.$cardTextArea=t("<div>",{class:"h5p-dialogcards-card-text-area",tabindex:"-1",html:s.text}).appendTo(d),s.text&&s.text.length||d.addClass("hide"),this.createCardFooter().appendTo(a),e}createCardImage(s){this.$image;const e=t("<div>",{class:"h5p-dialogcards-image-wrapper"});return void 0!==s.image?(this.image=s.image,this.$image=t('<img class="h5p-dialogcards-image" src="'+H5P.getPath(s.image.path,this.contentId)+'"/>'),s.imageAltText&&this.$image.attr("alt",s.imageAltText)):this.$image=t('<div class="h5p-dialogcards-image"></div>'),this.$image.appendTo(e),e}createCardAudio(s){if(this.audio,this.$audioWrapper=t("<div>",{class:"h5p-dialogcards-audio-wrapper"}),void 0!==s.audio){const t={files:s.audio,audioNotSupported:this.params.audioNotSupported};this.audio=new H5P.Audio(t,this.contentId),this.audio.attach(this.$audioWrapper),this.audio.audio&&this.audio.audio.preload&&(this.audio.audio.preload="none")}else this.$audioWrapper.addClass("hide");return this.$audioWrapper}createCardFooter(){const s=t("<div>",{class:"h5p-dialogcards-card-footer"});let e="h5p-dialogcards-button-hidden",a="-1";return"repetition"===this.params.mode&&(e="",this.params.behaviour.quickProgression&&(e="h5p-dialogcards-quick-progression",a="0")),this.$buttonTurn=H5P.JoubelUI.createButton({class:"h5p-dialogcards-turn",html:this.params.answer}).appendTo(s),"repetition"===this.params.mode&&(this.$buttonShowSummary=H5P.JoubelUI.createButton({class:"h5p-dialogcards-show-summary h5p-dialogcards-button-gone",html:this.params.showSummary}).appendTo(s),this.$buttonIncorrect=H5P.JoubelUI.createButton({class:"h5p-dialogcards-answer-button",html:this.params.incorrectAnswer}).addClass("incorrect").addClass(e).attr("tabindex",a).appendTo(s),this.$buttonCorrect=H5P.JoubelUI.createButton({class:"h5p-dialogcards-answer-button",html:this.params.correctAnswer}).addClass("correct").addClass(e).attr("tabindex",a).appendTo(s)),s}createButtonListeners(){this.$buttonTurn.unbind("click").click((()=>{this.turnCard()})),"repetition"===this.params.mode&&(this.$buttonIncorrect.unbind("click").click((t=>{t.target.classList.contains("h5p-dialogcards-quick-progression")&&this.callbacks.onNextCard({cardId:this.id,result:!1})})),this.$buttonCorrect.unbind("click").click((t=>{t.target.classList.contains("h5p-dialogcards-quick-progression")&&this.callbacks.onNextCard({cardId:this.id,result:!0})})))}showSummaryButton(t){this.getDOM().find(".h5p-dialogcards-answer-button").addClass("h5p-dialogcards-button-hidden").attr("tabindex","-1"),this.$buttonTurn.addClass("h5p-dialogcards-button-gone"),this.$buttonShowSummary.click((()=>t())).removeClass("h5p-dialogcards-button-gone").focus()}hideSummaryButton(){"normal"!==this.params.mode&&(this.getDOM().find(".h5p-dialogcards-answer-button").removeClass("h5p-dialogcards-button-hidden").attr("tabindex","0"),this.$buttonTurn.removeClass("h5p-dialogcards-button-gone"),this.$buttonShowSummary.addClass("h5p-dialogcards-button-gone").off("click"))}turnCard(){const t=this.getDOM(),s=t.find(".h5p-dialogcards-card-content"),e=t.find(".h5p-dialogcards-cardholder").addClass("h5p-dialogcards-collapse");s.find(".joubel-tip-container").remove();const a=s.hasClass("h5p-dialogcards-turned");s.toggleClass("h5p-dialogcards-turned",!a),setTimeout((()=>{if(e.removeClass("h5p-dialogcards-collapse"),this.changeText(a?this.getText():this.getAnswer()),a?e.find(".h5p-audio-inner").removeClass("hide"):this.removeAudio(e),"repetition"===this.params.mode&&!this.params.behaviour.quickProgression){const s=t.find(".h5p-dialogcards-answer-button");!1===s.hasClass("h5p-dialogcards-quick-progression")&&s.addClass("h5p-dialogcards-quick-progression").attr("tabindex",0)}setTimeout((()=>{this.addTipToCard(s,a?"front":"back"),"function"==typeof this.callbacks.onCardTurned&&this.callbacks.onCardTurned(a)}),200),this.resizeOverflowingText(),this.$cardTextArea.focus()}),200)}changeText(t){this.$cardTextArea.html(t),this.$cardTextArea.toggleClass("hide",!t||!t.length)}setProgressText(t,s){if("repetition"!==this.params.mode)return;const e=this.params.progressText.replace("@card",t.toString()).replace("@total",s.toString());this.$cardWrapper.attr("aria-label",e)}resizeOverflowingText(){if(!this.params.behaviour.scaleTextNotCard)return;const t=this.getDOM().find(".h5p-dialogcards-card-text"),s=t.children();this.resizeTextToFitContainer(t,s)}resizeTextToFitContainer(t,e){e.css("font-size","");const a=t.get(0).getBoundingClientRect().height;let r=e.get(0).getBoundingClientRect().height;const i=parseFloat(t.css("font-size"));let d=parseFloat(e.css("font-size"));const o=this.getDOM().closest(".h5p-container"),n=parseFloat(o.css("font-size"));if(r>a){let t=!0;for(;t;){if(d-=s.SCALEINTERVAL,d<s.MINSCALE){t=!1;break}e.css("font-size",d/i+"em"),r=e.get(0).getBoundingClientRect().height,r<=a&&(t=!1)}}else{let t=!0;for(;t;){if(d+=s.SCALEINTERVAL,d>n){t=!1;break}e.css("font-size",d/i+"em"),r=e.get(0).getBoundingClientRect().height,r>=a&&(t=!1,d-=s.SCALEINTERVAL,e.css("font-size",d/i+"em"))}}}addTipToCard(t,s,e){"back"!==s&&(s="front"),void 0===e&&(e=this.id),t.find(".joubel-tip-container").remove();const a=this.card.tips;if(void 0!==a&&void 0!==a[s]){const e=a[s].trim();e.length&&t.find(".h5p-dialogcards-card-text-wrapper .h5p-dialogcards-card-text-inner").after(H5P.JoubelUI.createTip(e,{tipLabel:this.params.tipButtonLabel}))}}setCardFocus(t){if(!0===t)this.$cardTextArea.focus();else{const t=this.getDOM();t.one("transitionend",(()=>{t.focus()}))}}stopAudio(){if(!this.audio||!this.audio.audio)return;const t=this.audio.audio.duration;t>0&&t<Number.MAX_SAFE_INTEGER&&this.audio.seekTo(t),this.audio.audio.load&&setTimeout((()=>{this.audio.audio.load()}),100)}removeAudio(){this.stopAudio(),this.getDOM().find(".h5p-audio-inner").addClass("hide")}getDOM(){return this.$cardWrapper}getText(){return this.card.text}getAnswer(){return this.card.answer}getImage(){return this.$image}getImageSize(){return this.image?{width:this.image.width,height:this.image.height}:this.image}getAudio(){return this.$audioWrapper}reset(){const t=this.getDOM();t.removeClass("h5p-dialogcards-previous"),t.removeClass("h5p-dialogcards-current"),this.changeText(this.getText());const s=t.find(".h5p-dialogcards-card-content");s.removeClass("h5p-dialogcards-turned"),this.addTipToCard(s,"front",this.id),this.params.behaviour.quickProgression||t.find(".h5p-dialogcards-answer-button").removeClass("h5p-dialogcards-quick-progression"),this.hideSummaryButton()}}s.SCALEINTERVAL=.2,s.MAXSCALE=16,s.MINSCALE=4;const e=s;const a=class{constructor(t,s,e,a){return this.params=t,this.contentId=s,this.callbacks=e,this.idCounter=a,this.cards=[],this.params.dialogs.forEach(((t,s)=>{t.id=s,this.cards.push(s)})),this}getCard(t){if(!(t<0||t>this.cards.length))return"number"==typeof this.cards[t]&&this.loadCard(t),this.cards[t]}getCardIds(){return this.cards.map(((t,s)=>s))}loadCard(t){t<0||t>this.cards.length||"number"==typeof this.cards[t]&&(this.cards[t]=new e(this.params.dialogs[t],this.params,t,this.contentId,this.callbacks,this.idCounter))}};const r=class{constructor(t=[]){return this.cards=t.filter(((s,e)=>t.indexOf(s)>=e)),this}getCards(){return this.cards}peek(t,s=1){return s=Math.max(0,s),"top"===t&&(t=0),"bottom"===t&&(t=this.cards.length-s),t<0||t>this.cards.length-1?[]:this.cards.slice(t,t+s)}add(t,s="top"){"number"==typeof t&&(t=[t]),t.forEach((e=>{-1===this.cards.indexOf(e)&&("top"===s?s=0:"bottom"===s?s=this.cards.length:"random"===s&&(s=Math.floor(Math.random()*this.cards.length)),this.cards.splice(s,0,...t))}))}push(t){this.add(t,"top")}pull(t=1,s="top"){return t=Math.max(1,Math.min(t,this.cards.length)),"top"===s&&(s=0),"bottom"===s&&(s=-t),s=Math.max(0,Math.min(s,this.cards.length-1)),this.cards.splice(s,t)}remove(t){"number"==typeof t&&(t=[t]),t.forEach((t=>{const s=this.cards.indexOf(t);s>-1&&this.cards.splice(s,1)}))}shuffle(){for(let t=this.cards.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[this.cards[t],this.cards[s]]=[this.cards[s],this.cards[t]]}return this.cards}contains(t){return-1!==this.cards.indexOf(t)}length(){return this.cards.length}};const i=class{constructor(t,s,e,r){return this.params=t,this.cardPool=new a(t,s,e,r),this.reset(t.cardPiles),this}createSelection(){let t=[];if("repetition"===this.params.mode)t=this.createSelectionRepetition();else t=this.cardPool.getCardIds();return t}createPiles(t){if(t)return void(this.cardPiles=t.map((t=>new r(t.cards))));this.cardPiles=[];const s=this.cardPool.getCardIds();switch(this.params.mode){case"repetition":for(let t=0;t<this.params.behaviour.maxProficiency+1;t++)0===t?this.cardPiles.push(new r(s)):this.cardPiles.push(new r);break;case"normal":this.cardPiles.push(new r(s))}}updatePiles(t){return t.forEach((t=>{const s=this.find(t.cardId);if(-1===s)return;let e=!0===t.result?s+1:0;e=Math.max(0,Math.min(e,this.cardPiles.length-1)),this.cardPiles[s].remove(t.cardId),this.cardPiles[e].add(t.cardId,"bottom")})),this.getPileSizes()}createSelectionRepetition(){let t=[],s=null;for(let e=0;e<this.cardPiles.length-1;e++){const a=this.cardPiles[e].length();if(null===s&&0===a)continue;null===s&&(s=e);const r=Math.ceil(1*a/(1+e-s)),i=this.cardPiles[e].peek(0,r);t=t.concat(...i)}return t=this.shuffle(t),t}shuffle(t){const s=t.slice();for(let t=s.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[s[t],s[e]]=[s[e],s[t]]}return s}find(t){let s=-1;return this.cardPiles.forEach(((e,a)=>{if(-1!==s)return s;e.contains(t)&&(s=a)})),s}reset(t){this.createPiles(t)}getCard(t){return this.cardPool.getCard(t)}getSize(){return this.cardPool.getCardIds().length}getPiles(){return this.cardPiles}getPileSizes(){return this.cardPiles.map((t=>t.length()))}};const d=class{constructor(t,s){this.params=t,this.callbacks=s,this.currentCallback=s.nextRound,this.fields=[],this.container=document.createElement("div"),this.container.classList.add("h5p-dialogcards-summary-screen");const e=this.createContainerDOM(t.summary);this.fields.round=e.getElementsByClassName("h5p-dialogcards-summary-subheader")[0],this.fields["h5p-dialogcards-round-cards-right"]=this.addTableRow(e,{category:this.params.summaryCardsRight,symbol:"h5p-dialogcards-check"}),this.fields["h5p-dialogcards-round-cards-wrong"]=this.addTableRow(e,{category:this.params.summaryCardsWrong,symbol:"h5p-dialogcards-times"}),this.fields["h5p-dialogcards-round-cards-not-shown"]=this.addTableRow(e,{category:this.params.summaryCardsNotShown});const a=this.createContainerDOM(t.summaryOverallScore);this.fields["h5p-dialogcards-overall-cards-completed"]=this.addTableRow(a,{category:this.params.summaryCardsCompleted,symbol:"h5p-dialogcards-check"}),this.fields["h5p-dialogcards-overall-completed-rounds"]=this.addTableRow(a,{category:this.params.summaryCompletedRounds,symbol:""});const r=document.createElement("div");r.classList.add("h5p-dialogcards-summary-message"),this.fields.message=r;const i=H5P.JoubelUI.createButton({class:"h5p-dialogcards-buttonNextRound",title:this.params.nextRound.replace("@round",2),html:this.params.nextRound.replace("@round",2)}).click(this.currentCallback).get(0);this.fields.button=i;const d=H5P.JoubelUI.createButton({class:"h5p-dialogcards-button-restart",title:this.params.startOver,html:this.params.startOver}).get(0),o=this.createConfirmationDialog({l10n:this.params.confirmStartingOver,instance:this},(()=>{setTimeout((()=>{this.callbacks.retry()}),100)}));d.addEventListener("click",(t=>{o.show(t.target.offsetTop)})),this.fields.buttonStartOver=d;const n=document.createElement("div");return n.classList.add("h5p-dialogcards-summary-footer"),n.appendChild(d),n.appendChild(i),this.container.appendChild(e),this.container.appendChild(a),this.container.appendChild(r),this.container.appendChild(n),this.hide(),this}getDOM(){return this.container}createContainerDOM(t,s=""){const e=document.createElement("div");e.classList.add("h5p-dialogcards-summary-container");const a=document.createElement("div");a.classList.add("h5p-dialogcards-summary-header"),a.innerHTML=t,e.appendChild(a);const r=document.createElement("div");r.classList.add("h5p-dialogcards-summary-subheader"),r.innerHTML=s,e.appendChild(r);const i=document.createElement("table");return i.classList.add("h5p-dialogcards-summary-table"),e.appendChild(i),e}addTableRow(t,s){const e=t.getElementsByClassName("h5p-dialogcards-summary-table")[0],a=document.createElement("tr"),r=document.createElement("td");r.classList.add("h5p-dialogcards-summary-table-row-category"),r.innerHTML=s.category,a.appendChild(r);const i=document.createElement("td");i.classList.add("h5p-dialogcards-summary-table-row-symbol"),void 0!==s.symbol&&""!==s.symbol&&i.classList.add(s.symbol),a.appendChild(i);const d=document.createElement("td");return d.classList.add("h5p-dialogcards-summary-table-row-score"),a.appendChild(d),e.appendChild(a),d}update({done:t=!1,round:s,message:e,results:a=[]}={}){!0===t?(this.fields.buttonStartOver.classList.add("h5p-dialogcards-button-gone"),this.params.behaviour.enableRetry?(this.fields.button.classList.remove("h5p-dialogcards-button-next-round"),this.fields.button.classList.add("h5p-dialogcards-button-restart"),this.fields.button.innerHTML=this.params.retry,this.fields.button.title=this.params.retry,this.currentCallback=this.callbacks.retry):this.fields.button.classList.add("h5p-dialogcards-button-gone")):(this.fields.buttonStartOver.classList.remove("h5p-dialogcards-button-gone"),this.fields.button.classList.add("h5p-dialogcards-button-next-round"),this.fields.button.classList.remove("h5p-dialogcards-button-restart"),this.fields.button.innerHTML=this.params.nextRound,this.fields.button.title=this.params.nextRound,this.currentCallback=this.callbacks.nextRound),H5P.jQuery(this.fields.button).unbind("click").click(this.currentCallback),this.fields.round.innerHTML=this.params.round.replace("@round",s),t||void 0===s||(this.fields.button.innerHTML=this.params.nextRound.replace("@round",s+1),this.fields.button.title=this.params.nextRound.replace("@round",s+1)),t&&void 0!==e&&""!==e?(this.fields.message.classList.remove("h5p-dialogcards-gone"),this.fields.message.innerHTML=e):this.fields.message.classList.add("h5p-dialogcards-gone"),a.forEach((t=>{let s=void 0!==t.score.value?t.score.value:"";void 0!==t.score.max&&(s=`${s}&nbsp;<span class="h5p-dialogcards-summary-table-row-score-divider">/</span>&nbsp;${t.score.max}`),this.fields[t.field].innerHTML=s}))}show(){this.container.classList.remove("h5p-dialogcards-gone"),setTimeout((()=>{this.fields.button.focus()}),0)}hide(){this.container.classList.add("h5p-dialogcards-gone")}createConfirmationDialog(t,s){t=t||{};var e=new H5P.ConfirmationDialog({instance:t.instance,headerText:t.l10n.header,dialogText:t.l10n.body,cancelText:t.l10n.cancelLabel,confirmText:t.l10n.confirmLabel});return e.on("confirmed",(()=>{s()})),e.appendTo(this.getContainer()),e}getContainer(){const t=H5P.jQuery('[data-content-id="'+self.contentId+'"].h5p-content'),s=t.parents(".h5p-container");let e;return e=0!==s.length?s.last():0!==t.length?t:H5P.jQuery(document.body),e.get(0)}},o=H5P.jQuery,n=H5P.JoubelUI;class h extends H5P.EventDispatcher{constructor(t,s,e){super(),this.idCounter=h.idCounter++,this.contentId=this.id=s,this.previousState=e.previousState||{},this.contentData=e||{},this.params=o.extend({title:"",mode:"normal",description:"Sit in pairs and make up sentences where you include the expressions below.<br/>Example: I should have said yes, HOWEVER I kept my mouth shut.",next:"Next",prev:"Previous",retry:"Retry",answer:"Turn",correctAnswer:"I got it right!",incorrectAnswer:"I got it wrong",round:"Round @round",cardsLeft:"Cards left: @number",nextRound:"Proceed to round @round",startOver:"Start over",showSummary:"Next",summary:"Summary",summaryCardsRight:"Cards you got right:",summaryCardsWrong:"Cards you got wrong:",summaryCardsNotShown:"Cards in pool not shown:",summaryOverallScore:"Overall Score",summaryCardsCompleted:"Cards you have completed learning:",summaryCompletedRounds:"Completed rounds:",summaryAllDone:"Well done! You have mastered all @cards cards by getting them correct @max times!",progressText:"Card @card of @total",cardFrontLabel:"Card front",cardBackLabel:"Card back",tipButtonLabel:"Show tip",audioNotSupported:"Your browser does not support this audio",confirmStartingOver:{header:"Start over?",body:"All progress will be lost. Are you sure you want to start over?",cancelLabel:"Cancel",confirmLabel:"Start over"},dialogs:[{text:"Horse",answer:"Hest"},{text:"Cow",answer:"Ku"}],behaviour:{enableRetry:!0,disableBackwardsNavigation:!1,scaleTextNotCard:!1,randomCards:!1,maxProficiency:5,quickProgression:!1}},t),this.cards=[],this.currentCardId=0,this.round=0,this.results=this.previousState.results||[],this.attach=t=>{this.$inner=t.addClass("h5p-dialogcards"),this.params.behaviour.scaleTextNotCard&&t.addClass("h5p-text-scaling");const s={mode:this.params.mode,dialogs:this.params.dialogs,audioNotSupported:this.params.audioNotSupported,answer:this.params.answer,showSummary:this.params.showSummary,incorrectAnswer:this.params.incorrectAnswer,correctAnswer:this.params.correctAnswer,progressText:this.params.progressText,tipButtonLabel:this.params.tipButtonLabel,behaviour:{scaleTextNotCard:this.params.behaviour.scaleTextNotCard,maxProficiency:this.params.behaviour.maxProficiency,quickProgression:this.params.behaviour.quickProgression},cardPiles:this.previousState.cardPiles};this.cardManager=new i(s,this.id,{onCardTurned:this.handleCardTurned,onNextCard:this.nextCard},this.idCounter),this.createDOM(0===this.round),void 0!==this.previousState.currentCardId&&(this.gotoCard(this.previousState.currentCardId),"repetition"===this.params.mode&&this.results.length===this.cardIds.length&&this.showSummary(!0)),this.updateNavigation(),this.trigger("resize")},this.createDOM=t=>{if(this.cardIds=t&&this.previousState.cardIds?this.previousState.cardIds:this.cardManager.createSelection(),this.cardPoolSize=this.cardPoolSize||this.cardManager.getSize(),!0===t){const t=o("<div>"+this.params.title+"</div>").text().trim();this.$header=o((t?'<div class="h5p-dialogcards-title"><div class="h5p-dialogcards-title-inner">'+this.params.title+"</div></div>":"")+'<div class="h5p-dialogcards-description">'+this.params.description+"</div>"),this.summaryScreen=new d(this.params,{nextRound:this.nextRound,retry:this.restartRepetition})}!0===t?this.$cardwrapperSet=this.initCards(this.cardIds):(this.$cardwrapperSet.detach(),this.$cardwrapperSet=this.initCards(this.cardIds),this.$cardSideAnnouncer.before(this.$cardwrapperSet)),this.$cardwrapperSet.prepend(this.summaryScreen.getDOM()),!0===t&&(this.$cardSideAnnouncer=o("<div>",{html:this.params.cardFrontLabel,class:"h5p-dialogcards-card-side-announcer","aria-live":"polite"}),this.$footer=this.createFooter(),this.$mainContent=o("<div>").append(this.$header).append(this.$cardwrapperSet).append(this.$cardSideAnnouncer).append(this.$footer).appendTo(this.$inner),this.on("reset",(function(){this.reset()})),this.on("resize",this.resize),this.round=void 0!==this.previousState.round?this.previousState.round:1)},this.createFooter=()=>{const t=o("<nav>",{class:"h5p-dialogcards-footer",role:"navigation"}),s=function(t,s){o(t).append('<span class="button-tooltip">'+s+"</span>"),o(t).find(".button-tooltip").hide().fadeIn("fast")},e=function(t){o(t).find(".button-tooltip").remove()};if("normal"===this.params.mode){const a=this;this.$prev=n.createButton({class:"h5p-dialogcards-footer-button h5p-dialogcards-prev truncated","aria-label":this.params.prev}).click((()=>{this.prevCard()})).appendTo(t),this.$prev.hover((function(t){s(a.$prev,a.params.prev)}),(function(){e(a.$prev)})),this.$next=n.createButton({class:"h5p-dialogcards-footer-button h5p-dialogcards-next truncated","aria-label":this.params.next}).click((()=>{this.nextCard()})).appendTo(t),this.$next.hover((function(t){s(a.$next,a.params.next)}),(function(){e(a.$next)})),this.$retry=n.createButton({class:"h5p-dialogcards-footer-button h5p-dialogcards-retry h5p-dialogcards-disabled",html:this.params.retry}).click((()=>{this.trigger("reset")})).appendTo(t),this.$retry.hover((function(t){s(a.$retry,a.params.retry)}),(function(){e(a.$retry)})),this.$progress=o("<div>",{id:"h5p-dialogcards-progress-"+this.idCounter,class:"h5p-dialogcards-progress","aria-live":"assertive"}).appendTo(t)}else this.$round=o("<div>",{class:"h5p-dialogcards-round"}).appendTo(t),this.$progress=o("<div>",{class:"h5p-dialogcards-cards-left","aria-live":"assertive"}).appendTo(t);return t},this.updateImageSize=()=>{let t=0;const s=this.cards[this.currentCardId].getDOM().find(".h5p-dialogcards-card-content");if(this.params.dialogs.forEach((e=>{if(!e.image)return;const a=e.image.height/e.image.width*s.get(0).getBoundingClientRect().width;a>t&&(t=a)})),t>0){let s=t/parseFloat(this.$inner.css("font-size"));s>15&&(s=15),this.cards.forEach((t=>{t.getImage().parent().css("height",s+"em")}))}},this.initCards=t=>{this.cards=[],this.currentCardId=0,this.params.behaviour.randomCards&&(t=H5P.shuffleArray(t));const s=o("<div>",{class:"h5p-dialogcards-cardwrap-set"});for(let e=0;e<t.length&&!(e>=2);e++){const a=this.getCard(t[e]);a.setProgressText(e+1,t.length),this.cards.push(a);const r=a.getDOM();e===this.currentCardId&&(r.addClass("h5p-dialogcards-current"),this.$current=r),a.addTipToCard(r.find(".h5p-dialogcards-card-content"),"front",e),s.append(r)}return s},this.handleCardTurned=t=>{this.$cardSideAnnouncer.html(t?this.params.cardFrontLabel:this.params.cardBackLabel),this.params.behaviour.enableRetry&&this.currentCardId+1===this.cardIds.length&&this.$retry&&(this.$retry.removeClass("h5p-dialogcards-disabled"),this.truncateRetryButton())},this.updateNavigation=()=>{if("normal"===this.params.mode)this.getCurrentSelectionIndex()<this.cardIds.length-1?(this.$next.removeClass("h5p-dialogcards-disabled"),this.$retry.addClass("h5p-dialogcards-disabled")):this.$next.addClass("h5p-dialogcards-disabled"),this.currentCardId>0&&!this.params.behaviour.disableBackwardsNavigation?this.$prev.removeClass("h5p-dialogcards-disabled"):this.$prev.addClass("h5p-dialogcards-disabled"),this.$progress.text(this.params.progressText.replace("@card",this.getCurrentSelectionIndex()+1).replace("@total",this.cardIds.length)),this.cards[this.findCardPosition(this.cards[this.currentCardId].id)].resizeOverflowingText();else{this.$round.text(this.params.round.replace("@round",this.round));const t=this.getCurrentSelectionIndex();this.$progress.text(this.params.cardsLeft.replace("@number",this.cardIds.length-t))}this.trigger("resize")},this.showSummary=(t=!1)=>{const s=t?this.cardManager.getPileSizes():this.cardManager.updatePiles(this.results),e=this.results.filter((t=>!0===t.result)).length,a=this.results.length-e,r=this.cardPoolSize-e-a,i=s.slice(-1)[0],d=i===this.cardPoolSize,o={round:this.round,results:[{field:"h5p-dialogcards-round-cards-right",score:{value:e,max:a+e}},{field:"h5p-dialogcards-round-cards-wrong",score:{value:a,max:a+e}},{field:"h5p-dialogcards-round-cards-not-shown",score:{value:r}},{field:"h5p-dialogcards-overall-cards-completed",score:{value:i,max:this.cardPoolSize}},{field:"h5p-dialogcards-overall-completed-rounds",score:{value:this.round}}]};d&&(o.done=!0,o.message=this.params.summaryAllDone.replace("@cards",this.cardPoolSize).replace("@max",this.params.behaviour.maxProficiency)),this.summaryScreen.update(o),this.summaryScreen.show(),this.hideCards(),this.trigger("resize")},this.showCards=()=>{this.$cardwrapperSet.find(".h5p-dialogcards-cardwrap").removeClass("h5p-dialogcards-gone"),this.$footer.removeClass("h5p-dialogcards-gone"),this.cardsShown=!0},this.hideCards=()=>{this.$cardwrapperSet.find(".h5p-dialogcards-cardwrap").addClass("h5p-dialogcards-gone"),this.$footer.addClass("h5p-dialogcards-gone"),this.cardsShown=!1},this.nextCard=t=>{void 0!==t&&this.results.push(t),this.cards[this.currentCardId].stopAudio(),this.cardIds.length-this.getCurrentSelectionIndex()!=1?this.gotoCard(this.getCurrentSelectionIndex()+1):"repetition"===this.params.mode&&(this.$progress.text(this.params.cardsLeft.replace("@number",0)),this.cards[this.currentCardId].showSummaryButton(this.showSummary))},this.getCard=t=>{const s=this.cardManager.getCard(t);return s.createButtonListeners(),s},this.findCardPosition=t=>{let s;return this.cards.forEach(((e,a)=>{s||e.id!==t||(s=a)})),s},this.insertCardToDOM=(t,s)=>{const e=t.getDOM();void 0===s?e.appendTo(this.$cardwrapperSet):0===s?this.$cardwrapperSet.prepend(e):this.$cardwrapperSet.children().eq(s).after(e),t.addTipToCard(e.find(".h5p-dialogcards-card-content"),"front",s)},this.gotoCard=t=>{if(t<0||t>=this.cardIds.length)return;const s=this.cards[this.currentCardId];s.stopAudio(),s.getDOM().removeClass("h5p-dialogcards-current");const e=[];t>0&&e.push(t-1),e.push(t),t+1<this.cardIds.length&&e.push(t+1),e.forEach((t=>{if(void 0===this.findCardPosition(this.cardIds[t])){const s=this.getCard(this.cardIds[t]);s.setProgressText(t+1,this.cardIds.length);const e=Math.min(t+1,this.cardIds.length-1),a=this.findCardPosition(this.cardIds[e])||this.cards.length;this.cards.splice(a,0,s),this.insertCardToDOM(s,a)}})),this.resize(),t=this.findCardPosition(this.cardIds[t]),this.cards.forEach(((s,e)=>{e<t?s.getDOM().addClass("h5p-dialogcards-previous"):(s.getDOM().removeClass("h5p-dialogcards-previous"),e===t&&s.getDOM().addClass("h5p-dialogcards-current"))})),this.currentCardId=t,this.updateNavigation(),this.cards[this.currentCardId].setCardFocus()},this.prevCard=()=>{this.gotoCard(this.getCurrentSelectionIndex()-1)},this.showAllAudio=()=>{this.$cardwrapperSet.find(".h5p-audio-inner").removeClass("hide")},this.restartRepetition=()=>{this.cardManager.reset(),this.round=0,this.nextRound()},this.nextRound=()=>{this.round++,this.summaryScreen.hide(),this.showCards(),this.reset(),this.createDOM(),this.updateNavigation(),this.cards[this.currentCardId].setCardFocus(!0),this.trigger("resize")},this.reset=()=>{this.results=[],this.cards[this.currentCardId].stopAudio(this.$current.index()),this.cards.forEach((t=>{t.reset()})),this.currentCardId=0,"normal"===this.params.mode&&this.cards[this.currentCardId].getDOM().addClass("h5p-dialogcards-current"),this.updateNavigation(),this.$retry&&this.$retry.addClass("h5p-dialogcards-disabled"),this.showAllAudio(),this.cards[this.currentCardId].resizeOverflowingText(),this.cards[this.currentCardId].setCardFocus()},this.resize=()=>{let t=0;this.updateImageSize(),this.params.behaviour.scaleTextNotCard||!1===this.cardsShown||this.determineCardSizes(),this.$cardwrapperSet.css("height","auto"),this.$cardwrapperSet.children(":not(.h5p-dialogcards-gone)").each((function(){const s=o(this).css("height","initial").outerHeight();if(o(this).css("height","inherit"),t=s>t?s:t,!o(this).next(".h5p-dialogcards-cardwrap").length){const s=o(this).find(".h5p-dialogcards-cardholder").css("height","initial").outerHeight();t=s>t?s:t,o(this).find(".h5p-dialogcards-cardholder").css("height","inherit")}}));const s=t/parseFloat(this.$cardwrapperSet.css("font-size"));this.$cardwrapperSet.css("height",s+"em"),this.scaleToFitHeight(),this.truncateRetryButton(),this.cards[this.currentCardId].resizeOverflowingText()},this.determineCardSizes=()=>{const t=this;void 0===this.cardSizeDetermined&&(this.cardSizeDetermined=[]),this.$cardwrapperSet.children(":visible").each((function(s){const e=t.cards[s].id;if(-1!==t.cardSizeDetermined.indexOf(e))return;t.cardSizeDetermined.push(e);const a=o(".h5p-dialogcards-card-content",this),r=o(".h5p-dialogcards-card-text-inner-content",a),i=r[0].getBoundingClientRect().height,d=t.cards[s];d.changeText(d.getAnswer());const n=r[0].getBoundingClientRect().height;let h=i>n?i:n;const c=parseFloat(r.parent().parent().css("minHeight"));h<c&&(h=c);h/=parseFloat(a.css("fontSize")),r.parent().css("height",h+"em"),d.changeText(d.getText())}))},this.scaleToFitHeight=()=>{if(this.$cardwrapperSet&&this.$cardwrapperSet.is(":visible")&&this.params.behaviour.scaleTextNotCard)if(this.$inner.parents(".h5p-course-presentation").length){let t=this.$inner.parent();this.$inner.parents(".h5p-popup-container").length&&(t=this.$inner.parents(".h5p-popup-container"));const s=t.get(0).getBoundingClientRect().height,e=()=>{let t=0;return this.$inner.children().each((function(){const s=o(this);t+=this.getBoundingClientRect().height+parseFloat(s.css("margin-top"))+parseFloat(s.css("margin-bottom"))})),t};let a=e();const r=parseFloat(this.$inner.parent().css("font-size"));let i=parseFloat(this.$inner.css("font-size"));if(s<a)for(;s<a&&(i-=h.SCALEINTERVAL,!(i<h.MINSCALE));)this.$inner.css("font-size",i/r+"em"),a=e();else{let t=!0;for(;t;){if(i+=h.SCALEINTERVAL,i>h.MAXSCALE){t=!1;break}let d=i/r;this.$inner.css("font-size",d+"em"),a=e(),s<=a&&(t=!1,d=(i-h.SCALEINTERVAL)/r,this.$inner.css("font-size",d+"em"))}}}else this.cards[this.currentCardId].resizeOverflowingText()},this.truncateRetryButton=()=>{if(!this.$retry)return;this.$retry.removeClass("truncated"),this.$retry.html(this.params.retry);(this.$retry.get(0).getBoundingClientRect().width+parseFloat(this.$retry.css("margin-left"))+parseFloat(this.$retry.css("margin-right")))/this.$retry.parent().get(0).getBoundingClientRect().width>.3&&(this.$retry.addClass("truncated"),this.$retry.html(""))},this.getCurrentSelectionIndex=()=>this.cardIds.indexOf(this.cards[this.currentCardId].id),this.getTitle=()=>H5P.createTitle(this.contentData&&this.contentData.metadata&&this.contentData.metadata.title?this.contentData.metadata.title:"Dialog Cards"),this.getCurrentState=()=>{if(this.cardManager)return{cardPiles:this.cardManager.getPiles(),cardIds:this.cardIds,round:this.round,currentCardId:this.getCurrentSelectionIndex(),results:this.results}}}}h.idCounter=0,h.SCALEINTERVAL=.2,h.MAXSCALE=16,h.MINSCALE=4;const c=h;H5P.Dialogcards=c})();;
/*! For license information please see h5p-combination-lock.js.LICENSE.txt */
!function(){var r={492:function(r,e,t){var a;r=t.nmd(r),function(s){var i=e,o=(r&&r.exports,"object"==typeof t.g&&t.g);o.global!==o&&o.window;var n=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,c=/[\x01-\x7F]/g,l=/[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,u=/<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g,p={"­":"shy","‌":"zwnj","‍":"zwj","‎":"lrm","⁣":"ic","⁢":"it","⁡":"af","‏":"rlm","​":"ZeroWidthSpace","⁠":"NoBreak","̑":"DownBreve","⃛":"tdot","⃜":"DotDot","\t":"Tab","\n":"NewLine"," ":"puncsp"," ":"MediumSpace"," ":"thinsp"," ":"hairsp"," ":"emsp13"," ":"ensp"," ":"emsp14"," ":"emsp"," ":"numsp"," ":"nbsp","  ":"ThickSpace","‾":"oline",_:"lowbar","‐":"dash","–":"ndash","—":"mdash","―":"horbar",",":"comma",";":"semi","⁏":"bsemi",":":"colon","⩴":"Colone","!":"excl","¡":"iexcl","?":"quest","¿":"iquest",".":"period","‥":"nldr","…":"mldr","·":"middot","'":"apos","‘":"lsquo","’":"rsquo","‚":"sbquo","‹":"lsaquo","›":"rsaquo",'"':"quot","“":"ldquo","”":"rdquo","„":"bdquo","«":"laquo","»":"raquo","(":"lpar",")":"rpar","[":"lsqb","]":"rsqb","{":"lcub","}":"rcub","⌈":"lceil","⌉":"rceil","⌊":"lfloor","⌋":"rfloor","⦅":"lopar","⦆":"ropar","⦋":"lbrke","⦌":"rbrke","⦍":"lbrkslu","⦎":"rbrksld","⦏":"lbrksld","⦐":"rbrkslu","⦑":"langd","⦒":"rangd","⦓":"lparlt","⦔":"rpargt","⦕":"gtlPar","⦖":"ltrPar","⟦":"lobrk","⟧":"robrk","⟨":"lang","⟩":"rang","⟪":"Lang","⟫":"Rang","⟬":"loang","⟭":"roang","❲":"lbbrk","❳":"rbbrk","‖":"Vert","§":"sect","¶":"para","@":"commat","*":"ast","/":"sol",undefined:null,"&":"amp","#":"num","%":"percnt","‰":"permil","‱":"pertenk","†":"dagger","‡":"Dagger","•":"bull","⁃":"hybull","′":"prime","″":"Prime","‴":"tprime","⁗":"qprime","‵":"bprime","⁁":"caret","`":"grave","´":"acute","˜":"tilde","^":"Hat","¯":"macr","˘":"breve","˙":"dot","¨":"die","˚":"ring","˝":"dblac","¸":"cedil","˛":"ogon","ˆ":"circ","ˇ":"caron","°":"deg","©":"copy","®":"reg","℗":"copysr","℘":"wp","℞":"rx","℧":"mho","℩":"iiota","←":"larr","↚":"nlarr","→":"rarr","↛":"nrarr","↑":"uarr","↓":"darr","↔":"harr","↮":"nharr","↕":"varr","↖":"nwarr","↗":"nearr","↘":"searr","↙":"swarr","↝":"rarrw","↝̸":"nrarrw","↞":"Larr","↟":"Uarr","↠":"Rarr","↡":"Darr","↢":"larrtl","↣":"rarrtl","↤":"mapstoleft","↥":"mapstoup","↦":"map","↧":"mapstodown","↩":"larrhk","↪":"rarrhk","↫":"larrlp","↬":"rarrlp","↭":"harrw","↰":"lsh","↱":"rsh","↲":"ldsh","↳":"rdsh","↵":"crarr","↶":"cularr","↷":"curarr","↺":"olarr","↻":"orarr","↼":"lharu","↽":"lhard","↾":"uharr","↿":"uharl","⇀":"rharu","⇁":"rhard","⇂":"dharr","⇃":"dharl","⇄":"rlarr","⇅":"udarr","⇆":"lrarr","⇇":"llarr","⇈":"uuarr","⇉":"rrarr","⇊":"ddarr","⇋":"lrhar","⇌":"rlhar","⇐":"lArr","⇍":"nlArr","⇑":"uArr","⇒":"rArr","⇏":"nrArr","⇓":"dArr","⇔":"iff","⇎":"nhArr","⇕":"vArr","⇖":"nwArr","⇗":"neArr","⇘":"seArr","⇙":"swArr","⇚":"lAarr","⇛":"rAarr","⇝":"zigrarr","⇤":"larrb","⇥":"rarrb","⇵":"duarr","⇽":"loarr","⇾":"roarr","⇿":"hoarr","∀":"forall","∁":"comp","∂":"part","∂̸":"npart","∃":"exist","∄":"nexist","∅":"empty","∇":"Del","∈":"in","∉":"notin","∋":"ni","∌":"notni","϶":"bepsi","∏":"prod","∐":"coprod","∑":"sum","+":"plus","±":"pm","÷":"div","×":"times","<":"lt","≮":"nlt","<⃒":"nvlt","=":"equals","≠":"ne","=⃥":"bne","⩵":"Equal",">":"gt","≯":"ngt",">⃒":"nvgt","¬":"not","|":"vert","¦":"brvbar","−":"minus","∓":"mp","∔":"plusdo","⁄":"frasl","∖":"setmn","∗":"lowast","∘":"compfn","√":"Sqrt","∝":"prop","∞":"infin","∟":"angrt","∠":"ang","∠⃒":"nang","∡":"angmsd","∢":"angsph","∣":"mid","∤":"nmid","∥":"par","∦":"npar","∧":"and","∨":"or","∩":"cap","∩︀":"caps","∪":"cup","∪︀":"cups","∫":"int","∬":"Int","∭":"tint","⨌":"qint","∮":"oint","∯":"Conint","∰":"Cconint","∱":"cwint","∲":"cwconint","∳":"awconint","∴":"there4","∵":"becaus","∶":"ratio","∷":"Colon","∸":"minusd","∺":"mDDot","∻":"homtht","∼":"sim","≁":"nsim","∼⃒":"nvsim","∽":"bsim","∽̱":"race","∾":"ac","∾̳":"acE","∿":"acd","≀":"wr","≂":"esim","≂̸":"nesim","≃":"sime","≄":"nsime","≅":"cong","≇":"ncong","≆":"simne","≈":"ap","≉":"nap","≊":"ape","≋":"apid","≋̸":"napid","≌":"bcong","≍":"CupCap","≭":"NotCupCap","≍⃒":"nvap","≎":"bump","≎̸":"nbump","≏":"bumpe","≏̸":"nbumpe","≐":"doteq","≐̸":"nedot","≑":"eDot","≒":"efDot","≓":"erDot","≔":"colone","≕":"ecolon","≖":"ecir","≗":"cire","≙":"wedgeq","≚":"veeeq","≜":"trie","≟":"equest","≡":"equiv","≢":"nequiv","≡⃥":"bnequiv","≤":"le","≰":"nle","≤⃒":"nvle","≥":"ge","≱":"nge","≥⃒":"nvge","≦":"lE","≦̸":"nlE","≧":"gE","≧̸":"ngE","≨︀":"lvnE","≨":"lnE","≩":"gnE","≩︀":"gvnE","≪":"ll","≪̸":"nLtv","≪⃒":"nLt","≫":"gg","≫̸":"nGtv","≫⃒":"nGt","≬":"twixt","≲":"lsim","≴":"nlsim","≳":"gsim","≵":"ngsim","≶":"lg","≸":"ntlg","≷":"gl","≹":"ntgl","≺":"pr","⊀":"npr","≻":"sc","⊁":"nsc","≼":"prcue","⋠":"nprcue","≽":"sccue","⋡":"nsccue","≾":"prsim","≿":"scsim","≿̸":"NotSucceedsTilde","⊂":"sub","⊄":"nsub","⊂⃒":"vnsub","⊃":"sup","⊅":"nsup","⊃⃒":"vnsup","⊆":"sube","⊈":"nsube","⊇":"supe","⊉":"nsupe","⊊︀":"vsubne","⊊":"subne","⊋︀":"vsupne","⊋":"supne","⊍":"cupdot","⊎":"uplus","⊏":"sqsub","⊏̸":"NotSquareSubset","⊐":"sqsup","⊐̸":"NotSquareSuperset","⊑":"sqsube","⋢":"nsqsube","⊒":"sqsupe","⋣":"nsqsupe","⊓":"sqcap","⊓︀":"sqcaps","⊔":"sqcup","⊔︀":"sqcups","⊕":"oplus","⊖":"ominus","⊗":"otimes","⊘":"osol","⊙":"odot","⊚":"ocir","⊛":"oast","⊝":"odash","⊞":"plusb","⊟":"minusb","⊠":"timesb","⊡":"sdotb","⊢":"vdash","⊬":"nvdash","⊣":"dashv","⊤":"top","⊥":"bot","⊧":"models","⊨":"vDash","⊭":"nvDash","⊩":"Vdash","⊮":"nVdash","⊪":"Vvdash","⊫":"VDash","⊯":"nVDash","⊰":"prurel","⊲":"vltri","⋪":"nltri","⊳":"vrtri","⋫":"nrtri","⊴":"ltrie","⋬":"nltrie","⊴⃒":"nvltrie","⊵":"rtrie","⋭":"nrtrie","⊵⃒":"nvrtrie","⊶":"origof","⊷":"imof","⊸":"mumap","⊹":"hercon","⊺":"intcal","⊻":"veebar","⊽":"barvee","⊾":"angrtvb","⊿":"lrtri","⋀":"Wedge","⋁":"Vee","⋂":"xcap","⋃":"xcup","⋄":"diam","⋅":"sdot","⋆":"Star","⋇":"divonx","⋈":"bowtie","⋉":"ltimes","⋊":"rtimes","⋋":"lthree","⋌":"rthree","⋍":"bsime","⋎":"cuvee","⋏":"cuwed","⋐":"Sub","⋑":"Sup","⋒":"Cap","⋓":"Cup","⋔":"fork","⋕":"epar","⋖":"ltdot","⋗":"gtdot","⋘":"Ll","⋘̸":"nLl","⋙":"Gg","⋙̸":"nGg","⋚︀":"lesg","⋚":"leg","⋛":"gel","⋛︀":"gesl","⋞":"cuepr","⋟":"cuesc","⋦":"lnsim","⋧":"gnsim","⋨":"prnsim","⋩":"scnsim","⋮":"vellip","⋯":"ctdot","⋰":"utdot","⋱":"dtdot","⋲":"disin","⋳":"isinsv","⋴":"isins","⋵":"isindot","⋵̸":"notindot","⋶":"notinvc","⋷":"notinvb","⋹":"isinE","⋹̸":"notinE","⋺":"nisd","⋻":"xnis","⋼":"nis","⋽":"notnivc","⋾":"notnivb","⌅":"barwed","⌆":"Barwed","⌌":"drcrop","⌍":"dlcrop","⌎":"urcrop","⌏":"ulcrop","⌐":"bnot","⌒":"profline","⌓":"profsurf","⌕":"telrec","⌖":"target","⌜":"ulcorn","⌝":"urcorn","⌞":"dlcorn","⌟":"drcorn","⌢":"frown","⌣":"smile","⌭":"cylcty","⌮":"profalar","⌶":"topbot","⌽":"ovbar","⌿":"solbar","⍼":"angzarr","⎰":"lmoust","⎱":"rmoust","⎴":"tbrk","⎵":"bbrk","⎶":"bbrktbrk","⏜":"OverParenthesis","⏝":"UnderParenthesis","⏞":"OverBrace","⏟":"UnderBrace","⏢":"trpezium","⏧":"elinters","␣":"blank","─":"boxh","│":"boxv","┌":"boxdr","┐":"boxdl","└":"boxur","┘":"boxul","├":"boxvr","┤":"boxvl","┬":"boxhd","┴":"boxhu","┼":"boxvh","═":"boxH","║":"boxV","╒":"boxdR","╓":"boxDr","╔":"boxDR","╕":"boxdL","╖":"boxDl","╗":"boxDL","╘":"boxuR","╙":"boxUr","╚":"boxUR","╛":"boxuL","╜":"boxUl","╝":"boxUL","╞":"boxvR","╟":"boxVr","╠":"boxVR","╡":"boxvL","╢":"boxVl","╣":"boxVL","╤":"boxHd","╥":"boxhD","╦":"boxHD","╧":"boxHu","╨":"boxhU","╩":"boxHU","╪":"boxvH","╫":"boxVh","╬":"boxVH","▀":"uhblk","▄":"lhblk","█":"block","░":"blk14","▒":"blk12","▓":"blk34","□":"squ","▪":"squf","▫":"EmptyVerySmallSquare","▭":"rect","▮":"marker","▱":"fltns","△":"xutri","▴":"utrif","▵":"utri","▸":"rtrif","▹":"rtri","▽":"xdtri","▾":"dtrif","▿":"dtri","◂":"ltrif","◃":"ltri","◊":"loz","○":"cir","◬":"tridot","◯":"xcirc","◸":"ultri","◹":"urtri","◺":"lltri","◻":"EmptySmallSquare","◼":"FilledSmallSquare","★":"starf","☆":"star","☎":"phone","♀":"female","♂":"male","♠":"spades","♣":"clubs","♥":"hearts","♦":"diams","♪":"sung","✓":"check","✗":"cross","✠":"malt","✶":"sext","❘":"VerticalSeparator","⟈":"bsolhsub","⟉":"suphsol","⟵":"xlarr","⟶":"xrarr","⟷":"xharr","⟸":"xlArr","⟹":"xrArr","⟺":"xhArr","⟼":"xmap","⟿":"dzigrarr","⤂":"nvlArr","⤃":"nvrArr","⤄":"nvHarr","⤅":"Map","⤌":"lbarr","⤍":"rbarr","⤎":"lBarr","⤏":"rBarr","⤐":"RBarr","⤑":"DDotrahd","⤒":"UpArrowBar","⤓":"DownArrowBar","⤖":"Rarrtl","⤙":"latail","⤚":"ratail","⤛":"lAtail","⤜":"rAtail","⤝":"larrfs","⤞":"rarrfs","⤟":"larrbfs","⤠":"rarrbfs","⤣":"nwarhk","⤤":"nearhk","⤥":"searhk","⤦":"swarhk","⤧":"nwnear","⤨":"toea","⤩":"tosa","⤪":"swnwar","⤳":"rarrc","⤳̸":"nrarrc","⤵":"cudarrr","⤶":"ldca","⤷":"rdca","⤸":"cudarrl","⤹":"larrpl","⤼":"curarrm","⤽":"cularrp","⥅":"rarrpl","⥈":"harrcir","⥉":"Uarrocir","⥊":"lurdshar","⥋":"ldrushar","⥎":"LeftRightVector","⥏":"RightUpDownVector","⥐":"DownLeftRightVector","⥑":"LeftUpDownVector","⥒":"LeftVectorBar","⥓":"RightVectorBar","⥔":"RightUpVectorBar","⥕":"RightDownVectorBar","⥖":"DownLeftVectorBar","⥗":"DownRightVectorBar","⥘":"LeftUpVectorBar","⥙":"LeftDownVectorBar","⥚":"LeftTeeVector","⥛":"RightTeeVector","⥜":"RightUpTeeVector","⥝":"RightDownTeeVector","⥞":"DownLeftTeeVector","⥟":"DownRightTeeVector","⥠":"LeftUpTeeVector","⥡":"LeftDownTeeVector","⥢":"lHar","⥣":"uHar","⥤":"rHar","⥥":"dHar","⥦":"luruhar","⥧":"ldrdhar","⥨":"ruluhar","⥩":"rdldhar","⥪":"lharul","⥫":"llhard","⥬":"rharul","⥭":"lrhard","⥮":"udhar","⥯":"duhar","⥰":"RoundImplies","⥱":"erarr","⥲":"simrarr","⥳":"larrsim","⥴":"rarrsim","⥵":"rarrap","⥶":"ltlarr","⥸":"gtrarr","⥹":"subrarr","⥻":"suplarr","⥼":"lfisht","⥽":"rfisht","⥾":"ufisht","⥿":"dfisht","⦚":"vzigzag","⦜":"vangrt","⦝":"angrtvbd","⦤":"ange","⦥":"range","⦦":"dwangle","⦧":"uwangle","⦨":"angmsdaa","⦩":"angmsdab","⦪":"angmsdac","⦫":"angmsdad","⦬":"angmsdae","⦭":"angmsdaf","⦮":"angmsdag","⦯":"angmsdah","⦰":"bemptyv","⦱":"demptyv","⦲":"cemptyv","⦳":"raemptyv","⦴":"laemptyv","⦵":"ohbar","⦶":"omid","⦷":"opar","⦹":"operp","⦻":"olcross","⦼":"odsold","⦾":"olcir","⦿":"ofcir","⧀":"olt","⧁":"ogt","⧂":"cirscir","⧃":"cirE","⧄":"solb","⧅":"bsolb","⧉":"boxbox","⧍":"trisb","⧎":"rtriltri","⧏":"LeftTriangleBar","⧏̸":"NotLeftTriangleBar","⧐":"RightTriangleBar","⧐̸":"NotRightTriangleBar","⧜":"iinfin","⧝":"infintie","⧞":"nvinfin","⧣":"eparsl","⧤":"smeparsl","⧥":"eqvparsl","⧫":"lozf","⧴":"RuleDelayed","⧶":"dsol","⨀":"xodot","⨁":"xoplus","⨂":"xotime","⨄":"xuplus","⨆":"xsqcup","⨍":"fpartint","⨐":"cirfnint","⨑":"awint","⨒":"rppolint","⨓":"scpolint","⨔":"npolint","⨕":"pointint","⨖":"quatint","⨗":"intlarhk","⨢":"pluscir","⨣":"plusacir","⨤":"simplus","⨥":"plusdu","⨦":"plussim","⨧":"plustwo","⨩":"mcomma","⨪":"minusdu","⨭":"loplus","⨮":"roplus","⨯":"Cross","⨰":"timesd","⨱":"timesbar","⨳":"smashp","⨴":"lotimes","⨵":"rotimes","⨶":"otimesas","⨷":"Otimes","⨸":"odiv","⨹":"triplus","⨺":"triminus","⨻":"tritime","⨼":"iprod","⨿":"amalg","⩀":"capdot","⩂":"ncup","⩃":"ncap","⩄":"capand","⩅":"cupor","⩆":"cupcap","⩇":"capcup","⩈":"cupbrcap","⩉":"capbrcup","⩊":"cupcup","⩋":"capcap","⩌":"ccups","⩍":"ccaps","⩐":"ccupssm","⩓":"And","⩔":"Or","⩕":"andand","⩖":"oror","⩗":"orslope","⩘":"andslope","⩚":"andv","⩛":"orv","⩜":"andd","⩝":"ord","⩟":"wedbar","⩦":"sdote","⩪":"simdot","⩭":"congdot","⩭̸":"ncongdot","⩮":"easter","⩯":"apacir","⩰":"apE","⩰̸":"napE","⩱":"eplus","⩲":"pluse","⩳":"Esim","⩷":"eDDot","⩸":"equivDD","⩹":"ltcir","⩺":"gtcir","⩻":"ltquest","⩼":"gtquest","⩽":"les","⩽̸":"nles","⩾":"ges","⩾̸":"nges","⩿":"lesdot","⪀":"gesdot","⪁":"lesdoto","⪂":"gesdoto","⪃":"lesdotor","⪄":"gesdotol","⪅":"lap","⪆":"gap","⪇":"lne","⪈":"gne","⪉":"lnap","⪊":"gnap","⪋":"lEg","⪌":"gEl","⪍":"lsime","⪎":"gsime","⪏":"lsimg","⪐":"gsiml","⪑":"lgE","⪒":"glE","⪓":"lesges","⪔":"gesles","⪕":"els","⪖":"egs","⪗":"elsdot","⪘":"egsdot","⪙":"el","⪚":"eg","⪝":"siml","⪞":"simg","⪟":"simlE","⪠":"simgE","⪡":"LessLess","⪡̸":"NotNestedLessLess","⪢":"GreaterGreater","⪢̸":"NotNestedGreaterGreater","⪤":"glj","⪥":"gla","⪦":"ltcc","⪧":"gtcc","⪨":"lescc","⪩":"gescc","⪪":"smt","⪫":"lat","⪬":"smte","⪬︀":"smtes","⪭":"late","⪭︀":"lates","⪮":"bumpE","⪯":"pre","⪯̸":"npre","⪰":"sce","⪰̸":"nsce","⪳":"prE","⪴":"scE","⪵":"prnE","⪶":"scnE","⪷":"prap","⪸":"scap","⪹":"prnap","⪺":"scnap","⪻":"Pr","⪼":"Sc","⪽":"subdot","⪾":"supdot","⪿":"subplus","⫀":"supplus","⫁":"submult","⫂":"supmult","⫃":"subedot","⫄":"supedot","⫅":"subE","⫅̸":"nsubE","⫆":"supE","⫆̸":"nsupE","⫇":"subsim","⫈":"supsim","⫋︀":"vsubnE","⫋":"subnE","⫌︀":"vsupnE","⫌":"supnE","⫏":"csub","⫐":"csup","⫑":"csube","⫒":"csupe","⫓":"subsup","⫔":"supsub","⫕":"subsub","⫖":"supsup","⫗":"suphsub","⫘":"supdsub","⫙":"forkv","⫚":"topfork","⫛":"mlcp","⫤":"Dashv","⫦":"Vdashl","⫧":"Barv","⫨":"vBar","⫩":"vBarv","⫫":"Vbar","⫬":"Not","⫭":"bNot","⫮":"rnmid","⫯":"cirmid","⫰":"midcir","⫱":"topcir","⫲":"nhpar","⫳":"parsim","⫽":"parsl","⫽⃥":"nparsl","♭":"flat","♮":"natur","♯":"sharp","¤":"curren","¢":"cent",$:"dollar","£":"pound","¥":"yen","€":"euro","¹":"sup1","½":"half","⅓":"frac13","¼":"frac14","⅕":"frac15","⅙":"frac16","⅛":"frac18","²":"sup2","⅔":"frac23","⅖":"frac25","³":"sup3","¾":"frac34","⅗":"frac35","⅜":"frac38","⅘":"frac45","⅚":"frac56","⅝":"frac58","⅞":"frac78","𝒶":"ascr","𝕒":"aopf","𝔞":"afr","𝔸":"Aopf","𝔄":"Afr","𝒜":"Ascr","ª":"ordf","á":"aacute","Á":"Aacute","à":"agrave","À":"Agrave","ă":"abreve","Ă":"Abreve","â":"acirc","Â":"Acirc","å":"aring","Å":"angst","ä":"auml","Ä":"Auml","ã":"atilde","Ã":"Atilde","ą":"aogon","Ą":"Aogon","ā":"amacr","Ā":"Amacr","æ":"aelig","Æ":"AElig","𝒷":"bscr","𝕓":"bopf","𝔟":"bfr","𝔹":"Bopf","ℬ":"Bscr","𝔅":"Bfr","𝔠":"cfr","𝒸":"cscr","𝕔":"copf","ℭ":"Cfr","𝒞":"Cscr","ℂ":"Copf","ć":"cacute","Ć":"Cacute","ĉ":"ccirc","Ĉ":"Ccirc","č":"ccaron","Č":"Ccaron","ċ":"cdot","Ċ":"Cdot","ç":"ccedil","Ç":"Ccedil","℅":"incare","𝔡":"dfr","ⅆ":"dd","𝕕":"dopf","𝒹":"dscr","𝒟":"Dscr","𝔇":"Dfr","ⅅ":"DD","𝔻":"Dopf","ď":"dcaron","Ď":"Dcaron","đ":"dstrok","Đ":"Dstrok","ð":"eth","Ð":"ETH","ⅇ":"ee","ℯ":"escr","𝔢":"efr","𝕖":"eopf","ℰ":"Escr","𝔈":"Efr","𝔼":"Eopf","é":"eacute","É":"Eacute","è":"egrave","È":"Egrave","ê":"ecirc","Ê":"Ecirc","ě":"ecaron","Ě":"Ecaron","ë":"euml","Ë":"Euml","ė":"edot","Ė":"Edot","ę":"eogon","Ę":"Eogon","ē":"emacr","Ē":"Emacr","𝔣":"ffr","𝕗":"fopf","𝒻":"fscr","𝔉":"Ffr","𝔽":"Fopf","ℱ":"Fscr","ﬀ":"fflig","ﬃ":"ffilig","ﬄ":"ffllig","ﬁ":"filig",fj:"fjlig","ﬂ":"fllig","ƒ":"fnof","ℊ":"gscr","𝕘":"gopf","𝔤":"gfr","𝒢":"Gscr","𝔾":"Gopf","𝔊":"Gfr","ǵ":"gacute","ğ":"gbreve","Ğ":"Gbreve","ĝ":"gcirc","Ĝ":"Gcirc","ġ":"gdot","Ġ":"Gdot","Ģ":"Gcedil","𝔥":"hfr","ℎ":"planckh","𝒽":"hscr","𝕙":"hopf","ℋ":"Hscr","ℌ":"Hfr","ℍ":"Hopf","ĥ":"hcirc","Ĥ":"Hcirc","ℏ":"hbar","ħ":"hstrok","Ħ":"Hstrok","𝕚":"iopf","𝔦":"ifr","𝒾":"iscr","ⅈ":"ii","𝕀":"Iopf","ℐ":"Iscr","ℑ":"Im","í":"iacute","Í":"Iacute","ì":"igrave","Ì":"Igrave","î":"icirc","Î":"Icirc","ï":"iuml","Ï":"Iuml","ĩ":"itilde","Ĩ":"Itilde","İ":"Idot","į":"iogon","Į":"Iogon","ī":"imacr","Ī":"Imacr","ĳ":"ijlig","Ĳ":"IJlig","ı":"imath","𝒿":"jscr","𝕛":"jopf","𝔧":"jfr","𝒥":"Jscr","𝔍":"Jfr","𝕁":"Jopf","ĵ":"jcirc","Ĵ":"Jcirc","ȷ":"jmath","𝕜":"kopf","𝓀":"kscr","𝔨":"kfr","𝒦":"Kscr","𝕂":"Kopf","𝔎":"Kfr","ķ":"kcedil","Ķ":"Kcedil","𝔩":"lfr","𝓁":"lscr","ℓ":"ell","𝕝":"lopf","ℒ":"Lscr","𝔏":"Lfr","𝕃":"Lopf","ĺ":"lacute","Ĺ":"Lacute","ľ":"lcaron","Ľ":"Lcaron","ļ":"lcedil","Ļ":"Lcedil","ł":"lstrok","Ł":"Lstrok","ŀ":"lmidot","Ŀ":"Lmidot","𝔪":"mfr","𝕞":"mopf","𝓂":"mscr","𝔐":"Mfr","𝕄":"Mopf","ℳ":"Mscr","𝔫":"nfr","𝕟":"nopf","𝓃":"nscr","ℕ":"Nopf","𝒩":"Nscr","𝔑":"Nfr","ń":"nacute","Ń":"Nacute","ň":"ncaron","Ň":"Ncaron","ñ":"ntilde","Ñ":"Ntilde","ņ":"ncedil","Ņ":"Ncedil","№":"numero","ŋ":"eng","Ŋ":"ENG","𝕠":"oopf","𝔬":"ofr","ℴ":"oscr","𝒪":"Oscr","𝔒":"Ofr","𝕆":"Oopf","º":"ordm","ó":"oacute","Ó":"Oacute","ò":"ograve","Ò":"Ograve","ô":"ocirc","Ô":"Ocirc","ö":"ouml","Ö":"Ouml","ő":"odblac","Ő":"Odblac","õ":"otilde","Õ":"Otilde","ø":"oslash","Ø":"Oslash","ō":"omacr","Ō":"Omacr","œ":"oelig","Œ":"OElig","𝔭":"pfr","𝓅":"pscr","𝕡":"popf","ℙ":"Popf","𝔓":"Pfr","𝒫":"Pscr","𝕢":"qopf","𝔮":"qfr","𝓆":"qscr","𝒬":"Qscr","𝔔":"Qfr","ℚ":"Qopf","ĸ":"kgreen","𝔯":"rfr","𝕣":"ropf","𝓇":"rscr","ℛ":"Rscr","ℜ":"Re","ℝ":"Ropf","ŕ":"racute","Ŕ":"Racute","ř":"rcaron","Ř":"Rcaron","ŗ":"rcedil","Ŗ":"Rcedil","𝕤":"sopf","𝓈":"sscr","𝔰":"sfr","𝕊":"Sopf","𝔖":"Sfr","𝒮":"Sscr","Ⓢ":"oS","ś":"sacute","Ś":"Sacute","ŝ":"scirc","Ŝ":"Scirc","š":"scaron","Š":"Scaron","ş":"scedil","Ş":"Scedil","ß":"szlig","𝔱":"tfr","𝓉":"tscr","𝕥":"topf","𝒯":"Tscr","𝔗":"Tfr","𝕋":"Topf","ť":"tcaron","Ť":"Tcaron","ţ":"tcedil","Ţ":"Tcedil","™":"trade","ŧ":"tstrok","Ŧ":"Tstrok","𝓊":"uscr","𝕦":"uopf","𝔲":"ufr","𝕌":"Uopf","𝔘":"Ufr","𝒰":"Uscr","ú":"uacute","Ú":"Uacute","ù":"ugrave","Ù":"Ugrave","ŭ":"ubreve","Ŭ":"Ubreve","û":"ucirc","Û":"Ucirc","ů":"uring","Ů":"Uring","ü":"uuml","Ü":"Uuml","ű":"udblac","Ű":"Udblac","ũ":"utilde","Ũ":"Utilde","ų":"uogon","Ų":"Uogon","ū":"umacr","Ū":"Umacr","𝔳":"vfr","𝕧":"vopf","𝓋":"vscr","𝔙":"Vfr","𝕍":"Vopf","𝒱":"Vscr","𝕨":"wopf","𝓌":"wscr","𝔴":"wfr","𝒲":"Wscr","𝕎":"Wopf","𝔚":"Wfr","ŵ":"wcirc","Ŵ":"Wcirc","𝔵":"xfr","𝓍":"xscr","𝕩":"xopf","𝕏":"Xopf","𝔛":"Xfr","𝒳":"Xscr","𝔶":"yfr","𝓎":"yscr","𝕪":"yopf","𝒴":"Yscr","𝔜":"Yfr","𝕐":"Yopf","ý":"yacute","Ý":"Yacute","ŷ":"ycirc","Ŷ":"Ycirc","ÿ":"yuml","Ÿ":"Yuml","𝓏":"zscr","𝔷":"zfr","𝕫":"zopf","ℨ":"Zfr","ℤ":"Zopf","𝒵":"Zscr","ź":"zacute","Ź":"Zacute","ž":"zcaron","Ž":"Zcaron","ż":"zdot","Ż":"Zdot","Ƶ":"imped","þ":"thorn","Þ":"THORN","ŉ":"napos","α":"alpha","Α":"Alpha","β":"beta","Β":"Beta","γ":"gamma","Γ":"Gamma","δ":"delta","Δ":"Delta","ε":"epsi","ϵ":"epsiv","Ε":"Epsilon","ϝ":"gammad","Ϝ":"Gammad","ζ":"zeta","Ζ":"Zeta","η":"eta","Η":"Eta","θ":"theta","ϑ":"thetav","Θ":"Theta","ι":"iota","Ι":"Iota","κ":"kappa","ϰ":"kappav","Κ":"Kappa","λ":"lambda","Λ":"Lambda","μ":"mu","µ":"micro","Μ":"Mu","ν":"nu","Ν":"Nu","ξ":"xi","Ξ":"Xi","ο":"omicron","Ο":"Omicron","π":"pi","ϖ":"piv","Π":"Pi","ρ":"rho","ϱ":"rhov","Ρ":"Rho","σ":"sigma","Σ":"Sigma","ς":"sigmaf","τ":"tau","Τ":"Tau","υ":"upsi","Υ":"Upsilon","ϒ":"Upsi","φ":"phi","ϕ":"phiv","Φ":"Phi","χ":"chi","Χ":"Chi","ψ":"psi","Ψ":"Psi","ω":"omega","Ω":"ohm","а":"acy","А":"Acy","б":"bcy","Б":"Bcy","в":"vcy","В":"Vcy","г":"gcy","Г":"Gcy","ѓ":"gjcy","Ѓ":"GJcy","д":"dcy","Д":"Dcy","ђ":"djcy","Ђ":"DJcy","е":"iecy","Е":"IEcy","ё":"iocy","Ё":"IOcy","є":"jukcy","Є":"Jukcy","ж":"zhcy","Ж":"ZHcy","з":"zcy","З":"Zcy","ѕ":"dscy","Ѕ":"DScy","и":"icy","И":"Icy","і":"iukcy","І":"Iukcy","ї":"yicy","Ї":"YIcy","й":"jcy","Й":"Jcy","ј":"jsercy","Ј":"Jsercy","к":"kcy","К":"Kcy","ќ":"kjcy","Ќ":"KJcy","л":"lcy","Л":"Lcy","љ":"ljcy","Љ":"LJcy","м":"mcy","М":"Mcy","н":"ncy","Н":"Ncy","њ":"njcy","Њ":"NJcy","о":"ocy","О":"Ocy","п":"pcy","П":"Pcy","р":"rcy","Р":"Rcy","с":"scy","С":"Scy","т":"tcy","Т":"Tcy","ћ":"tshcy","Ћ":"TSHcy","у":"ucy","У":"Ucy","ў":"ubrcy","Ў":"Ubrcy","ф":"fcy","Ф":"Fcy","х":"khcy","Х":"KHcy","ц":"tscy","Ц":"TScy","ч":"chcy","Ч":"CHcy","џ":"dzcy","Џ":"DZcy","ш":"shcy","Ш":"SHcy","щ":"shchcy","Щ":"SHCHcy","ъ":"hardcy","Ъ":"HARDcy","ы":"ycy","Ы":"Ycy","ь":"softcy","Ь":"SOFTcy","э":"ecy","Э":"Ecy","ю":"yucy","Ю":"YUcy","я":"yacy","Я":"YAcy","ℵ":"aleph","ℶ":"beth","ℷ":"gimel","ℸ":"daleth"},h=/["&'<>`]/g,d={'"':"&quot;","&":"&amp;","'":"&#x27;","<":"&lt;",">":"&gt;","`":"&#x60;"},m=/&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/,g=/[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,b=/&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g,f={aacute:"á",Aacute:"Á",abreve:"ă",Abreve:"Ă",ac:"∾",acd:"∿",acE:"∾̳",acirc:"â",Acirc:"Â",acute:"´",acy:"а",Acy:"А",aelig:"æ",AElig:"Æ",af:"⁡",afr:"𝔞",Afr:"𝔄",agrave:"à",Agrave:"À",alefsym:"ℵ",aleph:"ℵ",alpha:"α",Alpha:"Α",amacr:"ā",Amacr:"Ā",amalg:"⨿",amp:"&",AMP:"&",and:"∧",And:"⩓",andand:"⩕",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsd:"∡",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",aogon:"ą",Aogon:"Ą",aopf:"𝕒",Aopf:"𝔸",ap:"≈",apacir:"⩯",ape:"≊",apE:"⩰",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",aring:"å",Aring:"Å",ascr:"𝒶",Ascr:"𝒜",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",atilde:"ã",Atilde:"Ã",auml:"ä",Auml:"Ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",barwed:"⌅",Barwed:"⌆",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",bcy:"б",Bcy:"Б",bdquo:"„",becaus:"∵",because:"∵",Because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",beta:"β",Beta:"Β",beth:"ℶ",between:"≬",bfr:"𝔟",Bfr:"𝔅",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bnot:"⌐",bNot:"⫭",bopf:"𝕓",Bopf:"𝔹",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxdl:"┐",boxdL:"╕",boxDl:"╖",boxDL:"╗",boxdr:"┌",boxdR:"╒",boxDr:"╓",boxDR:"╔",boxh:"─",boxH:"═",boxhd:"┬",boxhD:"╥",boxHd:"╤",boxHD:"╦",boxhu:"┴",boxhU:"╨",boxHu:"╧",boxHU:"╩",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxul:"┘",boxuL:"╛",boxUl:"╜",boxUL:"╝",boxur:"└",boxuR:"╘",boxUr:"╙",boxUR:"╚",boxv:"│",boxV:"║",boxvh:"┼",boxvH:"╪",boxVh:"╫",boxVH:"╬",boxvl:"┤",boxvL:"╡",boxVl:"╢",boxVL:"╣",boxvr:"├",boxvR:"╞",boxVr:"╟",boxVR:"╠",bprime:"‵",breve:"˘",Breve:"˘",brvbar:"¦",bscr:"𝒷",Bscr:"ℬ",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsol:"\\",bsolb:"⧅",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpe:"≏",bumpE:"⪮",bumpeq:"≏",Bumpeq:"≎",cacute:"ć",Cacute:"Ć",cap:"∩",Cap:"⋒",capand:"⩄",capbrcup:"⩉",capcap:"⩋",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",ccaron:"č",Ccaron:"Č",ccedil:"ç",Ccedil:"Ç",ccirc:"ĉ",Ccirc:"Ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",cdot:"ċ",Cdot:"Ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",centerdot:"·",CenterDot:"·",cfr:"𝔠",Cfr:"ℭ",chcy:"ч",CHcy:"Ч",check:"✓",checkmark:"✓",chi:"χ",Chi:"Χ",cir:"○",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cire:"≗",cirE:"⧃",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",colon:":",Colon:"∷",colone:"≔",Colone:"⩴",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",conint:"∮",Conint:"∯",ContourIntegral:"∮",copf:"𝕔",Copf:"ℂ",coprod:"∐",Coproduct:"∐",copy:"©",COPY:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",cross:"✗",Cross:"⨯",cscr:"𝒸",Cscr:"𝒞",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",cup:"∪",Cup:"⋓",cupbrcap:"⩈",cupcap:"⩆",CupCap:"≍",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",dagger:"†",Dagger:"‡",daleth:"ℸ",darr:"↓",dArr:"⇓",Darr:"↡",dash:"‐",dashv:"⊣",Dashv:"⫤",dbkarow:"⤏",dblac:"˝",dcaron:"ď",Dcaron:"Ď",dcy:"д",Dcy:"Д",dd:"ⅆ",DD:"ⅅ",ddagger:"‡",ddarr:"⇊",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",delta:"δ",Delta:"Δ",demptyv:"⦱",dfisht:"⥿",dfr:"𝔡",Dfr:"𝔇",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",diamond:"⋄",Diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",djcy:"ђ",DJcy:"Ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",dopf:"𝕕",Dopf:"𝔻",dot:"˙",Dot:"¨",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",downarrow:"↓",Downarrow:"⇓",DownArrow:"↓",DownArrowBar:"⤓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVector:"↽",DownLeftVectorBar:"⥖",DownRightTeeVector:"⥟",DownRightVector:"⇁",DownRightVectorBar:"⥗",DownTee:"⊤",DownTeeArrow:"↧",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",dscr:"𝒹",Dscr:"𝒟",dscy:"ѕ",DScy:"Ѕ",dsol:"⧶",dstrok:"đ",Dstrok:"Đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",dzcy:"џ",DZcy:"Џ",dzigrarr:"⟿",eacute:"é",Eacute:"É",easter:"⩮",ecaron:"ě",Ecaron:"Ě",ecir:"≖",ecirc:"ê",Ecirc:"Ê",ecolon:"≕",ecy:"э",Ecy:"Э",eDDot:"⩷",edot:"ė",eDot:"≑",Edot:"Ė",ee:"ⅇ",efDot:"≒",efr:"𝔢",Efr:"𝔈",eg:"⪚",egrave:"è",Egrave:"È",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",emacr:"ē",Emacr:"Ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp:" ",emsp13:" ",emsp14:" ",eng:"ŋ",ENG:"Ŋ",ensp:" ",eogon:"ę",Eogon:"Ę",eopf:"𝕖",Eopf:"𝔼",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",epsilon:"ε",Epsilon:"Ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",escr:"ℯ",Escr:"ℰ",esdot:"≐",esim:"≂",Esim:"⩳",eta:"η",Eta:"Η",eth:"ð",ETH:"Ð",euml:"ë",Euml:"Ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",exponentiale:"ⅇ",ExponentialE:"ⅇ",fallingdotseq:"≒",fcy:"ф",Fcy:"Ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",ffr:"𝔣",Ffr:"𝔉",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",fopf:"𝕗",Fopf:"𝔽",forall:"∀",ForAll:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",fscr:"𝒻",Fscr:"ℱ",gacute:"ǵ",gamma:"γ",Gamma:"Γ",gammad:"ϝ",Gammad:"Ϝ",gap:"⪆",gbreve:"ğ",Gbreve:"Ğ",Gcedil:"Ģ",gcirc:"ĝ",Gcirc:"Ĝ",gcy:"г",Gcy:"Г",gdot:"ġ",Gdot:"Ġ",ge:"≥",gE:"≧",gel:"⋛",gEl:"⪌",geq:"≥",geqq:"≧",geqslant:"⩾",ges:"⩾",gescc:"⪩",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",gfr:"𝔤",Gfr:"𝔊",gg:"≫",Gg:"⋙",ggg:"⋙",gimel:"ℷ",gjcy:"ѓ",GJcy:"Ѓ",gl:"≷",gla:"⪥",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gne:"⪈",gnE:"≩",gneq:"⪈",gneqq:"≩",gnsim:"⋧",gopf:"𝕘",Gopf:"𝔾",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",gscr:"ℊ",Gscr:"𝒢",gsim:"≳",gsime:"⪎",gsiml:"⪐",gt:">",Gt:"≫",GT:">",gtcc:"⪧",gtcir:"⩺",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",hardcy:"ъ",HARDcy:"Ъ",harr:"↔",hArr:"⇔",harrcir:"⥈",harrw:"↭",Hat:"^",hbar:"ℏ",hcirc:"ĥ",Hcirc:"Ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",hfr:"𝔥",Hfr:"ℌ",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",hopf:"𝕙",Hopf:"ℍ",horbar:"―",HorizontalLine:"─",hscr:"𝒽",Hscr:"ℋ",hslash:"ℏ",hstrok:"ħ",Hstrok:"Ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",iacute:"í",Iacute:"Í",ic:"⁣",icirc:"î",Icirc:"Î",icy:"и",Icy:"И",Idot:"İ",iecy:"е",IEcy:"Е",iexcl:"¡",iff:"⇔",ifr:"𝔦",Ifr:"ℑ",igrave:"ì",Igrave:"Ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",ijlig:"ĳ",IJlig:"Ĳ",Im:"ℑ",imacr:"ī",Imacr:"Ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",imof:"⊷",imped:"Ƶ",Implies:"⇒",in:"∈",incare:"℅",infin:"∞",infintie:"⧝",inodot:"ı",int:"∫",Int:"∬",intcal:"⊺",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",iocy:"ё",IOcy:"Ё",iogon:"į",Iogon:"Į",iopf:"𝕚",Iopf:"𝕀",iota:"ι",Iota:"Ι",iprod:"⨼",iquest:"¿",iscr:"𝒾",Iscr:"ℐ",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",itilde:"ĩ",Itilde:"Ĩ",iukcy:"і",Iukcy:"І",iuml:"ï",Iuml:"Ï",jcirc:"ĵ",Jcirc:"Ĵ",jcy:"й",Jcy:"Й",jfr:"𝔧",Jfr:"𝔍",jmath:"ȷ",jopf:"𝕛",Jopf:"𝕁",jscr:"𝒿",Jscr:"𝒥",jsercy:"ј",Jsercy:"Ј",jukcy:"є",Jukcy:"Є",kappa:"κ",Kappa:"Κ",kappav:"ϰ",kcedil:"ķ",Kcedil:"Ķ",kcy:"к",Kcy:"К",kfr:"𝔨",Kfr:"𝔎",kgreen:"ĸ",khcy:"х",KHcy:"Х",kjcy:"ќ",KJcy:"Ќ",kopf:"𝕜",Kopf:"𝕂",kscr:"𝓀",Kscr:"𝒦",lAarr:"⇚",lacute:"ĺ",Lacute:"Ĺ",laemptyv:"⦴",lagran:"ℒ",lambda:"λ",Lambda:"Λ",lang:"⟨",Lang:"⟪",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",larr:"←",lArr:"⇐",Larr:"↞",larrb:"⇤",larrbfs:"⤟",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",lat:"⪫",latail:"⤙",lAtail:"⤛",late:"⪭",lates:"⪭︀",lbarr:"⤌",lBarr:"⤎",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",lcaron:"ľ",Lcaron:"Ľ",lcedil:"ļ",Lcedil:"Ļ",lceil:"⌈",lcub:"{",lcy:"л",Lcy:"Л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",le:"≤",lE:"≦",LeftAngleBracket:"⟨",leftarrow:"←",Leftarrow:"⇐",LeftArrow:"←",LeftArrowBar:"⇤",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVector:"⇃",LeftDownVectorBar:"⥙",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",leftrightarrow:"↔",Leftrightarrow:"⇔",LeftRightArrow:"↔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTee:"⊣",LeftTeeArrow:"↤",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangle:"⊲",LeftTriangleBar:"⧏",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVector:"↿",LeftUpVectorBar:"⥘",LeftVector:"↼",LeftVectorBar:"⥒",leg:"⋚",lEg:"⪋",leq:"≤",leqq:"≦",leqslant:"⩽",les:"⩽",lescc:"⪨",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",lfr:"𝔩",Lfr:"𝔏",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",ljcy:"љ",LJcy:"Љ",ll:"≪",Ll:"⋘",llarr:"⇇",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",lmidot:"ŀ",Lmidot:"Ŀ",lmoust:"⎰",lmoustache:"⎰",lnap:"⪉",lnapprox:"⪉",lne:"⪇",lnE:"≨",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",longleftarrow:"⟵",Longleftarrow:"⟸",LongLeftArrow:"⟵",longleftrightarrow:"⟷",Longleftrightarrow:"⟺",LongLeftRightArrow:"⟷",longmapsto:"⟼",longrightarrow:"⟶",Longrightarrow:"⟹",LongRightArrow:"⟶",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",lopf:"𝕝",Lopf:"𝕃",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",lscr:"𝓁",Lscr:"ℒ",lsh:"↰",Lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",lstrok:"ł",Lstrok:"Ł",lt:"<",Lt:"≪",LT:"<",ltcc:"⪦",ltcir:"⩹",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",map:"↦",Map:"⤅",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",mcy:"м",Mcy:"М",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",mfr:"𝔪",Mfr:"𝔐",mho:"℧",micro:"µ",mid:"∣",midast:"*",midcir:"⫰",middot:"·",minus:"−",minusb:"⊟",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",mopf:"𝕞",Mopf:"𝕄",mp:"∓",mscr:"𝓂",Mscr:"ℳ",mstpos:"∾",mu:"μ",Mu:"Μ",multimap:"⊸",mumap:"⊸",nabla:"∇",nacute:"ń",Nacute:"Ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natur:"♮",natural:"♮",naturals:"ℕ",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",ncaron:"ň",Ncaron:"Ň",ncedil:"ņ",Ncedil:"Ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",ncy:"н",Ncy:"Н",ndash:"–",ne:"≠",nearhk:"⤤",nearr:"↗",neArr:"⇗",nearrow:"↗",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",nfr:"𝔫",Nfr:"𝔑",nge:"≱",ngE:"≧̸",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",ngt:"≯",nGt:"≫⃒",ngtr:"≯",nGtv:"≫̸",nharr:"↮",nhArr:"⇎",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",njcy:"њ",NJcy:"Њ",nlarr:"↚",nlArr:"⇍",nldr:"‥",nle:"≰",nlE:"≦̸",nleftarrow:"↚",nLeftarrow:"⇍",nleftrightarrow:"↮",nLeftrightarrow:"⇎",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nlt:"≮",nLt:"≪⃒",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",nopf:"𝕟",Nopf:"ℕ",not:"¬",Not:"⫬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangle:"⋪",NotLeftTriangleBar:"⧏̸",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangle:"⋫",NotRightTriangleBar:"⧐̸",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",npar:"∦",nparallel:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",npre:"⪯̸",nprec:"⊀",npreceq:"⪯̸",nrarr:"↛",nrArr:"⇏",nrarrc:"⤳̸",nrarrw:"↝̸",nrightarrow:"↛",nRightarrow:"⇏",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",nscr:"𝓃",Nscr:"𝒩",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsube:"⊈",nsubE:"⫅̸",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupe:"⊉",nsupE:"⫆̸",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",ntilde:"ñ",Ntilde:"Ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",nu:"ν",Nu:"Ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nvdash:"⊬",nvDash:"⊭",nVdash:"⊮",nVDash:"⊯",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwarr:"↖",nwArr:"⇖",nwarrow:"↖",nwnear:"⤧",oacute:"ó",Oacute:"Ó",oast:"⊛",ocir:"⊚",ocirc:"ô",Ocirc:"Ô",ocy:"о",Ocy:"О",odash:"⊝",odblac:"ő",Odblac:"Ő",odiv:"⨸",odot:"⊙",odsold:"⦼",oelig:"œ",OElig:"Œ",ofcir:"⦿",ofr:"𝔬",Ofr:"𝔒",ogon:"˛",ograve:"ò",Ograve:"Ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",omacr:"ō",Omacr:"Ō",omega:"ω",Omega:"Ω",omicron:"ο",Omicron:"Ο",omid:"⦶",ominus:"⊖",oopf:"𝕠",Oopf:"𝕆",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",or:"∨",Or:"⩔",orarr:"↻",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",oscr:"ℴ",Oscr:"𝒪",oslash:"ø",Oslash:"Ø",osol:"⊘",otilde:"õ",Otilde:"Õ",otimes:"⊗",Otimes:"⨷",otimesas:"⨶",ouml:"ö",Ouml:"Ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",par:"∥",para:"¶",parallel:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",pcy:"п",Pcy:"П",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",pfr:"𝔭",Pfr:"𝔓",phi:"φ",Phi:"Φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",pi:"π",Pi:"Π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plus:"+",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",popf:"𝕡",Popf:"ℙ",pound:"£",pr:"≺",Pr:"⪻",prap:"⪷",prcue:"≼",pre:"⪯",prE:"⪳",prec:"≺",precapprox:"⪷",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",precsim:"≾",prime:"′",Prime:"″",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportion:"∷",Proportional:"∝",propto:"∝",prsim:"≾",prurel:"⊰",pscr:"𝓅",Pscr:"𝒫",psi:"ψ",Psi:"Ψ",puncsp:" ",qfr:"𝔮",Qfr:"𝔔",qint:"⨌",qopf:"𝕢",Qopf:"ℚ",qprime:"⁗",qscr:"𝓆",Qscr:"𝒬",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",quot:'"',QUOT:'"',rAarr:"⇛",race:"∽̱",racute:"ŕ",Racute:"Ŕ",radic:"√",raemptyv:"⦳",rang:"⟩",Rang:"⟫",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",rarr:"→",rArr:"⇒",Rarr:"↠",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",rarrtl:"↣",Rarrtl:"⤖",rarrw:"↝",ratail:"⤚",rAtail:"⤜",ratio:"∶",rationals:"ℚ",rbarr:"⤍",rBarr:"⤏",RBarr:"⤐",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",rcaron:"ř",Rcaron:"Ř",rcedil:"ŗ",Rcedil:"Ŗ",rceil:"⌉",rcub:"}",rcy:"р",Rcy:"Р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",Re:"ℜ",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",rect:"▭",reg:"®",REG:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",rfr:"𝔯",Rfr:"ℜ",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",rho:"ρ",Rho:"Ρ",rhov:"ϱ",RightAngleBracket:"⟩",rightarrow:"→",Rightarrow:"⇒",RightArrow:"→",RightArrowBar:"⇥",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVector:"⇂",RightDownVectorBar:"⥕",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTee:"⊢",RightTeeArrow:"↦",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangle:"⊳",RightTriangleBar:"⧐",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVector:"↾",RightUpVectorBar:"⥔",RightVector:"⇀",RightVectorBar:"⥓",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoust:"⎱",rmoustache:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",ropf:"𝕣",Ropf:"ℝ",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",rscr:"𝓇",Rscr:"ℛ",rsh:"↱",Rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",sacute:"ś",Sacute:"Ś",sbquo:"‚",sc:"≻",Sc:"⪼",scap:"⪸",scaron:"š",Scaron:"Š",sccue:"≽",sce:"⪰",scE:"⪴",scedil:"ş",Scedil:"Ş",scirc:"ŝ",Scirc:"Ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",scy:"с",Scy:"С",sdot:"⋅",sdotb:"⊡",sdote:"⩦",searhk:"⤥",searr:"↘",seArr:"⇘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",sfr:"𝔰",Sfr:"𝔖",sfrown:"⌢",sharp:"♯",shchcy:"щ",SHCHcy:"Щ",shcy:"ш",SHcy:"Ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",sigma:"σ",Sigma:"Σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",softcy:"ь",SOFTcy:"Ь",sol:"/",solb:"⧄",solbar:"⌿",sopf:"𝕤",Sopf:"𝕊",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",squ:"□",square:"□",Square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squf:"▪",srarr:"→",sscr:"𝓈",Sscr:"𝒮",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",star:"☆",Star:"⋆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",sub:"⊂",Sub:"⋐",subdot:"⪽",sube:"⊆",subE:"⫅",subedot:"⫃",submult:"⫁",subne:"⊊",subnE:"⫋",subplus:"⪿",subrarr:"⥹",subset:"⊂",Subset:"⋐",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succ:"≻",succapprox:"⪸",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",sum:"∑",Sum:"∑",sung:"♪",sup:"⊃",Sup:"⋑",sup1:"¹",sup2:"²",sup3:"³",supdot:"⪾",supdsub:"⫘",supe:"⊇",supE:"⫆",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supne:"⊋",supnE:"⫌",supplus:"⫀",supset:"⊃",Supset:"⋑",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swarr:"↙",swArr:"⇙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",tau:"τ",Tau:"Τ",tbrk:"⎴",tcaron:"ť",Tcaron:"Ť",tcedil:"ţ",Tcedil:"Ţ",tcy:"т",Tcy:"Т",tdot:"⃛",telrec:"⌕",tfr:"𝔱",Tfr:"𝔗",there4:"∴",therefore:"∴",Therefore:"∴",theta:"θ",Theta:"Θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",thinsp:" ",ThinSpace:" ",thkap:"≈",thksim:"∼",thorn:"þ",THORN:"Þ",tilde:"˜",Tilde:"∼",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",times:"×",timesb:"⊠",timesbar:"⨱",timesd:"⨰",tint:"∭",toea:"⤨",top:"⊤",topbot:"⌶",topcir:"⫱",topf:"𝕥",Topf:"𝕋",topfork:"⫚",tosa:"⤩",tprime:"‴",trade:"™",TRADE:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",tscr:"𝓉",Tscr:"𝒯",tscy:"ц",TScy:"Ц",tshcy:"ћ",TSHcy:"Ћ",tstrok:"ŧ",Tstrok:"Ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",uacute:"ú",Uacute:"Ú",uarr:"↑",uArr:"⇑",Uarr:"↟",Uarrocir:"⥉",ubrcy:"ў",Ubrcy:"Ў",ubreve:"ŭ",Ubreve:"Ŭ",ucirc:"û",Ucirc:"Û",ucy:"у",Ucy:"У",udarr:"⇅",udblac:"ű",Udblac:"Ű",udhar:"⥮",ufisht:"⥾",ufr:"𝔲",Ufr:"𝔘",ugrave:"ù",Ugrave:"Ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",umacr:"ū",Umacr:"Ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",uogon:"ų",Uogon:"Ų",uopf:"𝕦",Uopf:"𝕌",uparrow:"↑",Uparrow:"⇑",UpArrow:"↑",UpArrowBar:"⤒",UpArrowDownArrow:"⇅",updownarrow:"↕",Updownarrow:"⇕",UpDownArrow:"↕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",upsi:"υ",Upsi:"ϒ",upsih:"ϒ",upsilon:"υ",Upsilon:"Υ",UpTee:"⊥",UpTeeArrow:"↥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",uring:"ů",Uring:"Ů",urtri:"◹",uscr:"𝓊",Uscr:"𝒰",utdot:"⋰",utilde:"ũ",Utilde:"Ũ",utri:"▵",utrif:"▴",uuarr:"⇈",uuml:"ü",Uuml:"Ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",varr:"↕",vArr:"⇕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",vBar:"⫨",Vbar:"⫫",vBarv:"⫩",vcy:"в",Vcy:"В",vdash:"⊢",vDash:"⊨",Vdash:"⊩",VDash:"⊫",Vdashl:"⫦",vee:"∨",Vee:"⋁",veebar:"⊻",veeeq:"≚",vellip:"⋮",verbar:"|",Verbar:"‖",vert:"|",Vert:"‖",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",vfr:"𝔳",Vfr:"𝔙",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",vopf:"𝕧",Vopf:"𝕍",vprop:"∝",vrtri:"⊳",vscr:"𝓋",Vscr:"𝒱",vsubne:"⊊︀",vsubnE:"⫋︀",vsupne:"⊋︀",vsupnE:"⫌︀",Vvdash:"⊪",vzigzag:"⦚",wcirc:"ŵ",Wcirc:"Ŵ",wedbar:"⩟",wedge:"∧",Wedge:"⋀",wedgeq:"≙",weierp:"℘",wfr:"𝔴",Wfr:"𝔚",wopf:"𝕨",Wopf:"𝕎",wp:"℘",wr:"≀",wreath:"≀",wscr:"𝓌",Wscr:"𝒲",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",xfr:"𝔵",Xfr:"𝔛",xharr:"⟷",xhArr:"⟺",xi:"ξ",Xi:"Ξ",xlarr:"⟵",xlArr:"⟸",xmap:"⟼",xnis:"⋻",xodot:"⨀",xopf:"𝕩",Xopf:"𝕏",xoplus:"⨁",xotime:"⨂",xrarr:"⟶",xrArr:"⟹",xscr:"𝓍",Xscr:"𝒳",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",yacute:"ý",Yacute:"Ý",yacy:"я",YAcy:"Я",ycirc:"ŷ",Ycirc:"Ŷ",ycy:"ы",Ycy:"Ы",yen:"¥",yfr:"𝔶",Yfr:"𝔜",yicy:"ї",YIcy:"Ї",yopf:"𝕪",Yopf:"𝕐",yscr:"𝓎",Yscr:"𝒴",yucy:"ю",YUcy:"Ю",yuml:"ÿ",Yuml:"Ÿ",zacute:"ź",Zacute:"Ź",zcaron:"ž",Zcaron:"Ž",zcy:"з",Zcy:"З",zdot:"ż",Zdot:"Ż",zeetrf:"ℨ",ZeroWidthSpace:"​",zeta:"ζ",Zeta:"Ζ",zfr:"𝔷",Zfr:"ℨ",zhcy:"ж",ZHcy:"Ж",zigrarr:"⇝",zopf:"𝕫",Zopf:"ℤ",zscr:"𝓏",Zscr:"𝒵",zwj:"‍",zwnj:"‌"},v={aacute:"á",Aacute:"Á",acirc:"â",Acirc:"Â",acute:"´",aelig:"æ",AElig:"Æ",agrave:"à",Agrave:"À",amp:"&",AMP:"&",aring:"å",Aring:"Å",atilde:"ã",Atilde:"Ã",auml:"ä",Auml:"Ä",brvbar:"¦",ccedil:"ç",Ccedil:"Ç",cedil:"¸",cent:"¢",copy:"©",COPY:"©",curren:"¤",deg:"°",divide:"÷",eacute:"é",Eacute:"É",ecirc:"ê",Ecirc:"Ê",egrave:"è",Egrave:"È",eth:"ð",ETH:"Ð",euml:"ë",Euml:"Ë",frac12:"½",frac14:"¼",frac34:"¾",gt:">",GT:">",iacute:"í",Iacute:"Í",icirc:"î",Icirc:"Î",iexcl:"¡",igrave:"ì",Igrave:"Ì",iquest:"¿",iuml:"ï",Iuml:"Ï",laquo:"«",lt:"<",LT:"<",macr:"¯",micro:"µ",middot:"·",nbsp:" ",not:"¬",ntilde:"ñ",Ntilde:"Ñ",oacute:"ó",Oacute:"Ó",ocirc:"ô",Ocirc:"Ô",ograve:"ò",Ograve:"Ò",ordf:"ª",ordm:"º",oslash:"ø",Oslash:"Ø",otilde:"õ",Otilde:"Õ",ouml:"ö",Ouml:"Ö",para:"¶",plusmn:"±",pound:"£",quot:'"',QUOT:'"',raquo:"»",reg:"®",REG:"®",sect:"§",shy:"­",sup1:"¹",sup2:"²",sup3:"³",szlig:"ß",thorn:"þ",THORN:"Þ",times:"×",uacute:"ú",Uacute:"Ú",ucirc:"û",Ucirc:"Û",ugrave:"ù",Ugrave:"Ù",uml:"¨",uuml:"ü",Uuml:"Ü",yacute:"ý",Yacute:"Ý",yen:"¥",yuml:"ÿ"},w={0:"�",128:"€",130:"‚",131:"ƒ",132:"„",133:"…",134:"†",135:"‡",136:"ˆ",137:"‰",138:"Š",139:"‹",140:"Œ",142:"Ž",145:"‘",146:"’",147:"“",148:"”",149:"•",150:"–",151:"—",152:"˜",153:"™",154:"š",155:"›",156:"œ",158:"ž",159:"Ÿ"},y=[1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65e3,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111],D=String.fromCharCode,q={}.hasOwnProperty,A=function(r,e){return q.call(r,e)},E=function(r,e){if(!r)return e;var t,a={};for(t in e)a[t]=A(r,t)?r[t]:e[t];return a},x=function(r,e){var t="";return r>=55296&&r<=57343||r>1114111?(e&&L("character reference outside the permissible Unicode range"),"�"):A(w,r)?(e&&L("disallowed character reference"),w[r]):(e&&function(r,e){for(var t=-1,a=r.length;++t<a;)if(r[t]==e)return!0;return!1}(y,r)&&L("disallowed character reference"),r>65535&&(t+=D((r-=65536)>>>10&1023|55296),r=56320|1023&r),t+=D(r))},k=function(r){return"&#x"+r.toString(16).toUpperCase()+";"},S=function(r){return"&#"+r+";"},L=function(r){throw Error("Parse error: "+r)},C=function(r,e){(e=E(e,C.options)).strict&&g.test(r)&&L("forbidden code point");var t=e.encodeEverything,a=e.useNamedReferences,s=e.allowUnsafeSymbols,i=e.decimal?S:k,o=function(r){return i(r.charCodeAt(0))};return t?(r=r.replace(c,(function(r){return a&&A(p,r)?"&"+p[r]+";":o(r)})),a&&(r=r.replace(/&gt;\u20D2/g,"&nvgt;").replace(/&lt;\u20D2/g,"&nvlt;").replace(/&#x66;&#x6A;/g,"&fjlig;")),a&&(r=r.replace(u,(function(r){return"&"+p[r]+";"})))):a?(s||(r=r.replace(h,(function(r){return"&"+p[r]+";"}))),r=(r=r.replace(/&gt;\u20D2/g,"&nvgt;").replace(/&lt;\u20D2/g,"&nvlt;")).replace(u,(function(r){return"&"+p[r]+";"}))):s||(r=r.replace(h,o)),r.replace(n,(function(r){var e=r.charCodeAt(0),t=r.charCodeAt(1);return i(1024*(e-55296)+t-56320+65536)})).replace(l,o)};C.options={allowUnsafeSymbols:!1,encodeEverything:!1,strict:!1,useNamedReferences:!1,decimal:!1};var T=function(r,e){var t=(e=E(e,T.options)).strict;return t&&m.test(r)&&L("malformed character reference"),r.replace(b,(function(r,a,s,i,o,n,c,l,u){var p,h,d,m,g,b;return a?f[g=a]:s?(g=s,(b=i)&&e.isAttributeValue?(t&&"="==b&&L("`&` did not start a character reference"),r):(t&&L("named character reference was not terminated by a semicolon"),v[g]+(b||""))):o?(d=o,h=n,t&&!h&&L("character reference was not terminated by a semicolon"),p=parseInt(d,10),x(p,t)):c?(m=c,h=l,t&&!h&&L("character reference was not terminated by a semicolon"),p=parseInt(m,16),x(p,t)):(t&&L("named character reference was not terminated by a semicolon"),r)}))};T.options={isAttributeValue:!1,strict:!1};var B={version:"1.2.0",encode:C,decode:T,escape:function(r){return r.replace(h,(function(r){return d[r]}))},unescape:T};void 0===(a=function(){return B}.call(e,t,e,r))||(r.exports=a)}()}},e={};function t(a){var s=e[a];if(void 0!==s)return s.exports;var i=e[a]={id:a,loaded:!1,exports:{}};return r[a].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}t.n=function(r){var e=r&&r.__esModule?function(){return r.default}:function(){return r};return t.d(e,{a:e}),e},t.d=function(r,e){for(var a in e)t.o(e,a)&&!t.o(r,a)&&Object.defineProperty(r,a,{enumerable:!0,get:e[a]})},t.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(r){if("object"==typeof window)return window}}(),t.o=function(r,e){return Object.prototype.hasOwnProperty.call(r,e)},t.nmd=function(r){return r.paths=[],r.children||(r.children=[]),r},function(){"use strict";let r=function(){function r(){}return r.extend=function(){for(let r=1;r<arguments.length;r++)for(let e in arguments[r])Object.prototype.hasOwnProperty.call(arguments[r],e)&&("object"==typeof arguments[0][e]&&"object"==typeof arguments[r][e]?this.extend(arguments[0][e],arguments[r][e]):arguments[0][e]=arguments[r][e]);return arguments[0]},r.stripHTML=function(r){const e=document.createElement("div");return e.innerHTML=r,e.textContent||e.innerText||""},r.formatLanguageCode=function(r){if("string"!=typeof r)return r;const e=r.split("-");return e[0]=e[0].toLowerCase(),e.length>1&&(e[1]=e[1].toUpperCase()),r=e.join("-")},r.addMixins=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];if(!r.prototype)return;Array.isArray(e)||(e=[e]);const t=r.prototype;e.forEach((r=>{const e=r.prototype;Object.getOwnPropertyNames(e).forEach((r=>{"constructor"!==r&&(Object.getOwnPropertyNames(t).includes(r)||(t[r]=e[r]))}))}))},r}();function e(){const r="\\ud800-\\udfff",e="\\u0c15-\\u0c28\\u0c2a-\\u0c39",t="\\u0c58-\\u0c5a",a=`(?:${`[${e}]\\u0c4d[${e}]`}|${`[${e}${t}][\\u0c3e-\\u0c44\\u0c46-\\u0c48\\u0c4a-\\u0c4c\\u0c62-\\u0c63]|[${e}${t}][\\u0c01-\\u0c03\\u0c4d\\u0c55\\u0c56`}|${`[\\u0c05-\\u0c0c\\u0c0e-\\u0c10\\u0c12-\\u0c14\\u0c60-\\u0c61(?:${e}(?!\\u0c4d))\\u0c66-\\u0c6f\\u0c78-\\u0c7e${t}]`})`,s=`[${r}]`,i="[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\u1ab0-\\u1aff\\u1dc0-\\u1dff]",o="\\ud83c[\\udffb-\\udfff]",n=`[^${r}]`,c="(?:\\ud83c[\\udde6-\\uddff]){2}",l="[\\ud800-\\udbff][\\udc00-\\udfff]",u=`${`(?:${i}|${o})`}?`,p="[\\ufe0e\\ufe0f]?",h=p+u+`(?:\\u200d(?:${[n,c,l].join("|")})${p+u})*`,d=`(?:${["(?:\\ud83c\\udff4\\udb40\\udc67\\udb40\\udc62\\udb40(?:\\udc65|\\udc73|\\udc77)\\udb40(?:\\udc6e|\\udc63|\\udc6c)\\udb40(?:\\udc67|\\udc74|\\udc73)\\udb40\\udc7f)",`${n}${i}?`,i,c,l,s].join("|")})`;return new RegExp(`${o}(?=${o})|${a}|${d+h}`,"g")}let a=function(){function r(){}var t=r.prototype;return t.getAnswerGiven=function(){return this.wasAnswerGiven},t.getScore=function(){const r=this.lock.getResponse()===this.params.solution?1:0;return this.attemptsLeft===1/0?r:this.attemptsLeft},t.getMaxScore=function(){return this.maxAttempts===1/0?1:this.maxAttempts},t.showSolutions=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};const t=this.dictionary.get("a11y.correctCombination").replace(/@combination/g,this.params.solution.match(e()).join(", "));this.lock.disable(),this.lock.showSolutions(),this.announceMessage({text:this.dictionary.get("l10n.correctCombination"),aria:t}),window.setTimeout((()=>{this.setViewState("solutions"),this.hideButton("check-answer"),this.hideButton("show-solution"),this.hideButton("try-again"),r.showRetry&&(this.params.behaviour.enableRetry?this.showButton("try-again"):window.setTimeout((()=>{this.lock.focus()}),50))}),50)},t.resetTask=function(){if(this.setViewState("task"),this.attemptsLeft=this.maxAttempts,this.wasAnswerGiven=!1,this.params.behaviour.autoCheck||this.maxAttempts===1/0)this.announceMessage({text:this.dictionary.get("l10n.noMessage"),aria:""});else{const r=this.dictionary.get("l10n.attemptsLeft").replace(/@number/g,this.attemptsLeft),e=this.dictionary.get("a11y.wrongCombination");this.announceMessage({text:r,aria:[e,r].join(". ")})}this.params.behaviour.autoCheck&&this.params.behaviour.enableSolutionsButton?this.showButton("show-solution"):this.hideButton("show-solution"),this.hideButton("try-again"),this.params.behaviour.autoCheck||this.showButton("check-answer"),this.lock.reset()},t.getXAPIData=function(){return{statement:this.createXAPIEvent("answered").data.statement}},r}();var s=t(492),i=t.n(s);let o=function(){function r(){this.translation={}}var e=r.prototype;return e.fill=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.translation=this.sanitize(r)},e.get=function(r){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.translation;const t=r.split(/[./]+/);return 1===t.length?e[r]:"object"==typeof e[r=t.shift()]?this.get(t.join("."),e[r]):void 0},e.sanitize=function(r){if("object"==typeof r)for(let e in r)r[e]=this.sanitize(r[e]);else if("string"==typeof r){r=(0,s.decode)(r);const e=document.createElement("div");e.innerHTML=r,r=e.textContent||e.innerText||""}return r},r}(),n=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=r.extend({id:H5P.createUUID(),label:"ὠ5",classes:[]},e),this.callbacks=r.extend({onClicked:()=>{}},t),this.isDisabled=!1,this.dom=document.createElement("button"),this.dom.classList.add("h5p-combination-lock-button"),this.params.classes.forEach((r=>{"string"==typeof r&&this.dom.classList.add(r)})),this.dom.setAttribute("tabindex","-1"),this.dom.innerText=this.params.label,this.dom.addEventListener("click",(()=>{this.handleClicked()}))}var t=e.prototype;return t.getDOM=function(){return this.dom},t.handleClicked=function(){this.isDisabled||this.callbacks.onClicked()},t.enable=function(){this.isDisabled=!1,this.dom.classList.remove("disabled")},t.disable=function(){this.isDisabled=!0,this.dom.classList.add("disabled")},t.setAriaLabel=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;"string"==typeof r?this.dom.setAttribute("aria-label",r):Array.isArray(r)?(r=r.map((r=>("."===r.substring(r.length-1)&&(r=r.substring(0,r.length-1)),r))).join(". "),this.dom.setAttribute("aria-label",r)):this.dom.removeAttribute("aria-label")},e}(),c=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=r.extend({},e),this.callbacks=r.extend({onChanged:()=>{},onFocusChanged:()=>{}},t),this.oldIndex=this.params.position??0,this.dom=document.createElement("div"),this.dom.classList.add("h5p-combination-lock-wheel"),this.list=document.createElement("div"),this.list.classList.add("h5p-combination-lock-wheel-list"),this.list.classList.add("transition"),this.dom.appendChild(this.list);const a=[this.params.alphabet[this.params.alphabet.length-1],...this.params.alphabet,this.params.alphabet[0]];this.items=a.map((r=>{const e=document.createElement("div");return e.classList.add("h5p-combination-lock-wheel-listitem"),e.classList.add("cloaked"),e.setAttribute("aria-hidden","true"),e.innerText=r,e})),this.items.forEach((r=>{this.list.appendChild(r)})),this.spinbutton=document.createElement("div"),this.spinbutton.classList.add("h5p-combination-lock-wheel-spinbutton"),this.spinbutton.setAttribute("role","spinbutton"),this.spinbutton.setAttribute("tabindex","0"),this.spinbutton.setAttribute("aria-label",this.params.dictionary.get("a11y.segment").replace(/@number/g,this.params.index+1).replace(/@total/g,this.params.total)),this.spinbutton.addEventListener("keydown",(r=>{this.handleKeydown(r)})),this.spinbutton.addEventListener("focus",(()=>{this.callbacks.onFocusChanged(!0)})),this.spinbutton.addEventListener("blur",(()=>{this.callbacks.onFocusChanged(!1)})),this.dom.appendChild(this.spinbutton)}var t=e.prototype;return t.getDOM=function(){return this.dom},t.setPosition=function(r){this.oldIndex-1==0&&r===this.params.alphabet.length-1?(this.oldIndex=0,setTimeout((()=>{this.oldIndex=this.params.alphabet.length,this.scrollTo({index:this.oldIndex,noAnimation:!0})}),250)):this.oldIndex===this.params.alphabet.length&&0===r?(this.oldIndex=this.params.alphabet.length+1,setTimeout((()=>{this.oldIndex=1,this.scrollTo({index:this.oldIndex,noAnimation:!0})}),250)):this.oldIndex=r+1,this.scrollTo({index:this.oldIndex})},t.scrollTo=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if("number"!=typeof r.index)return;const e=(r.index-1+this.params.alphabet.length)%this.params.alphabet.length;this.spinbutton.setAttribute("aria-valuenow",`${e}`),this.spinbutton.setAttribute("aria-valuetext",this.params.alphabet[e]),this.wheelHeight=this.wheelHeight||this.dom.getBoundingClientRect().height,this.itemHeight=this.itemHeight||this.list.childNodes[0].getBoundingClientRect().height,this.itemOffset=(this.wheelHeight-this.itemHeight)/2;const t=`translateY(${-r.index*this.itemHeight+this.itemOffset}px)`;r.noAnimation?(this.list.classList.remove("transition"),window.requestAnimationFrame((()=>{this.list.style.transform=t,this.focusSpinbutton(),window.requestAnimationFrame((()=>{this.list.classList.add("transition")}))}))):this.list.style.transform=t},t.uncloak=function(){this.items.forEach((r=>{r.classList.remove("cloaked")}))},t.focusSpinbutton=function(){this.spinbutton.focus()},t.handleKeydown=function(r){if(this.isDisabled||r.repeat||this.isTransitioning)return r.stopPropagation(),void r.preventDefault();"spinbutton"===r.target.getAttribute("role")&&["ArrowDown","ArrowUp","Home","End"].includes(r.key)&&(r.stopPropagation(),r.preventDefault(),this.callbacks.onChanged(r.key))},t.cooldown=function(r){window.clearTimeout(this.cooldownTimeout),this.isTransitioning=!0,window.setTimeout((()=>{this.isTransitioning=!1}),r)},e}(),l=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=r.extend({},e),this.callbacks=r.extend({onChanged:()=>{}},t),this.position=this.params.position??Math.floor(Math.random()*this.params.alphabet.length);const a=this.params.alphabet[this.position];this.dom=document.createElement("div"),this.dom.classList.add("h5p-combination-lock-segment"),this.buttonNext=new n({id:"next",label:"▲",classes:["top"]},{onClicked:()=>{this.changeSymbol((this.position+this.params.alphabet.length-1)%this.params.alphabet.length)}}),this.buttonNext.setAriaLabel([this.params.dictionary.get("a11y.nextSymbol"),this.params.dictionary.get("a11y.currentSymbol").replace(/@symbol/g,a)]),this.dom.appendChild(this.buttonNext.getDOM()),this.wheel=new c({dictionary:this.params.dictionary,alphabet:this.params.alphabet,position:this.position,index:this.params.index,total:this.params.total},{onChanged:r=>{this.handleWheelChanged(r)},onFocusChanged:r=>{this.dom.classList.toggle("focus",r)}}),this.dom.appendChild(this.wheel.getDOM()),this.buttonPrevious=new n({id:"previous",label:"▼",classes:["bottom"]},{onClicked:()=>{this.changeSymbol((this.position+1)%this.params.alphabet.length)}}),this.buttonPrevious.setAriaLabel([this.params.dictionary.get("a11y.previousSymbol"),this.params.dictionary.get("a11y.currentSymbol").replace(/@symbol/g,a)]),this.dom.appendChild(this.buttonPrevious.getDOM());(window.requestIdleCallback?window.requestIdleCallback:window.requestAnimationFrame)((()=>{this.observer=new IntersectionObserver((r=>{r[0].isIntersecting&&(this.observer.unobserve(this.dom),this.setPosition(this.position),this.wheel.uncloak())}),{threshold:0}),this.observer.observe(this.dom)}))}var t=e.prototype;return t.getDOM=function(){return this.dom},t.getResponse=function(){return this.params.alphabet[this.position]},t.getPosition=function(){return this.position},t.focus=function(){this.wheel.focusSpinbutton()},t.enable=function(){this.isDisabled=!1,this.buttonNext.enable(),this.buttonPrevious.enable();const r=this.params.alphabet[this.position];this.buttonNext.setAriaLabel([this.params.dictionary.get("a11y.nextSymbol"),this.params.dictionary.get("a11y.currentSymbol").replace(/@symbol/g,r)]),this.buttonPrevious.setAriaLabel([this.params.dictionary.get("a11y.previousSymbol"),this.params.dictionary.get("a11y.currentSymbol").replace(/@symbol/g,r)])},t.disable=function(){this.isDisabled=!0,clearTimeout(this.cooldownTimeout),this.buttonNext.disable(),this.buttonPrevious.disable(),this.buttonNext.setAriaLabel([this.params.dictionary.get("a11y.nextSymbol"),this.params.dictionary.get("a11y.disabled")]),this.buttonNext.setAriaLabel([this.params.dictionary.get("a11y.previousSymbol"),this.params.dictionary.get("a11y.disabled")])},t.reset=function(){this.enable(),this.setPosition(Math.floor(Math.random()*this.params.alphabet.length))},t.showSolutions=function(){this.setPosition(this.params.alphabet.indexOf(this.params.solution))},t.setPosition=function(r){this.position=r,this.wheel.setPosition(this.position);const e=this.params.alphabet[this.position],t=this.isDisabled?this.params.dictionary.get("a11y.disabled"):this.params.dictionary.get("a11y.currentSymbol").replace(/@symbol/g,e);this.buttonNext.setAriaLabel([this.params.dictionary.get("a11y.nextSymbol"),t]),this.buttonPrevious.setAriaLabel([this.params.dictionary.get("a11y.previousSymbol"),t])},t.changeSymbol=function(r){this.isCoolingDown||(this.setPosition(r),this.callbacks.onChanged(),this.isDisabled||this.cooldown())},t.cooldown=function(){this.isCoolingDown||(this.isCoolingDown=!0,this.buttonPrevious.disable(),this.wheel.cooldown(e.COOLDOWN_TIMEOUT_MS),this.buttonNext.disable(),clearTimeout(this.cooldownTimeout),this.cooldownTimeout=setTimeout((()=>{this.buttonPrevious.enable(),this.buttonNext.enable(),this.isCoolingDown=!1}),e.COOLDOWN_TIMEOUT_MS))},t.handleWheelChanged=function(r){let e;if("ArrowUp"===r)e=(this.position+this.params.alphabet.length-1)%this.params.alphabet.length;else if("ArrowDown"===r)e=(this.position+1)%this.params.alphabet.length;else if("Home"===r)e=0;else{if("End"!==r)return;e=this.params.alphabet.length-1}this.changeSymbol(e)},e}();l.COOLDOWN_TIMEOUT_MS=275;let u=function(){function r(){this.dom=document.createElement("div"),this.dom.classList.add("h5p-combination-lock-message-display")}var e=r.prototype;return e.getDOM=function(){return this.dom},e.setWidth=function(r){this.dom.style.maxWidth=`${r}px`},e.setText=function(r){this.dom.innerText=r},e.getText=function(){return this.dom.innerText},r}(),p=function(){function e(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.params=r.extend({previousState:{}},e),this.callbacks=r.extend({onChanged:()=>{},onResized:()=>{}},t),this.segments=this.params.solution.map(((r,e)=>{var t;return new l({dictionary:this.params.dictionary,index:e,total:this.params.solution.length,solution:r,alphabet:this.params.alphabet,position:(null===(t=this.params.previousState)||void 0===t?void 0:t.positions[e])??null},{onChanged:()=>{this.handleSegmentChanged()}})})),this.currentSegmentId=0,this.handleAnimationEnded=this.handleAnimationEnded.bind(this),this.buildDOM(),this.updateConfigurationAria()}var t=e.prototype;return t.buildDOM=function(){this.dom=document.createElement("div"),this.dom.classList.add("h5p-combination-lock-case");const r=document.createElement("div");r.classList.add("h5p-combination-lock-elements"),this.dom.appendChild(r);const e=H5P.createUUID(),t=H5P.createUUID();this.segmentsDOM=document.createElement("div"),this.segmentsDOM.classList.add("h5p-combination-lock-segments"),this.segmentsDOM.setAttribute("role","group"),this.segmentsDOM.setAttribute("aria-labelledby",`${e} ${t}`),r.appendChild(this.segmentsDOM),this.groupLabel=document.createElement("div"),this.groupLabel.classList.add("h5p-combination-lock-group-label"),this.groupLabel.setAttribute("id",e),this.groupLabel.innerText=`${this.params.dictionary.get("a11y.combinationLock")}.`,this.segmentsDOM.appendChild(this.groupLabel),this.currentCombination=document.createElement("div"),this.currentCombination.classList.add("h5p-combination-lock-current-combination-aria"),this.currentCombination.setAttribute("id",t),this.segmentsDOM.appendChild(this.currentCombination),this.segments.forEach((r=>{this.segmentsDOM.appendChild(r.getDOM())})),this.messageDisplay=new u,r.appendChild(this.messageDisplay.getDOM())},t.getDOM=function(){return this.dom},t.resize=function(){this.messageDisplay.setWidth(this.segmentsDOM.getBoundingClientRect().width)},t.getResponse=function(){return this.segments.map((r=>r.getResponse())).join("")},t.getPositions=function(){return this.segments.map((r=>r.getPosition()))},t.getCurrentState=function(){return{positions:this.getPositions()}},t.setMessage=function(r){this.messageDisplay.setText(r)},t.getMessage=function(){return this.messageDisplay.getText()},t.focus=function(){this.segments[0].focus()},t.enable=function(){this.segments.forEach((r=>{r.enable()}))},t.disable=function(){this.segments.forEach((r=>{r.disable()}))},t.updateConfigurationAria=function(){const r=this.segments.map((r=>r.getResponse())).join(", ");let e=this.params.dictionary.get("a11y.currentSymbols").replace(/@symbols/g,r);"."!==e.substring(e.length-1)&&(e=`${e}.`),this.currentCombination.innerText=e},t.showSolutions=function(){this.segments.forEach((r=>{r.showSolutions()})),this.updateConfigurationAria()},t.reset=function(){this.enable(),this.segments.forEach((r=>{r.reset()})),this.updateConfigurationAria()},t.showAnimationWrongCombination=function(){this.isAnimating||(this.isAnimating=!0,this.dom.addEventListener("animationend",this.handleAnimationEnded),this.dom.classList.add("wrong-combination"),this.dom.classList.add("animate"))},t.handleAnimationEnded=function(){this.dom.classList.remove("animate"),this.dom.classList.remove("wrong-combination"),this.dom.addEventListener("animationend",this.handleAnimationEnded),this.isAnimating=!1},t.handleSegmentChanged=function(){this.updateConfigurationAria(),this.callbacks.onChanged()},t.handleSegmentAction=function(r){if("ArrowLeft"===r&&this.currentSegmentId>0)this.currentSegmentId--;else if("ArrowRight"===r&&this.currentSegmentId<this.segments.length-1)this.currentSegmentId++;else if("Home"===r)this.currentSegmentId=0;else if("End"===r)this.currentSegmentId=this.segments.length-1;else if("ArrowUp"===r)this.segments[this.currentSegmentId].changeToNextSymbol(),this.segments[this.currentSegmentId].blur(),this.segments[this.currentSegmentId].focus();else{if("ArrowDown"!==r)return;this.segments[this.currentSegmentId].changeToPreviousSymbol(),this.segments[this.currentSegmentId].blur(),this.segments[this.currentSegmentId].focus()}this.segments[this.currentSegmentId].focus()},e}(),h=function(){function t(){}var a=t.prototype;return a.sanitize=function(){var t;this.params=r.extend({solution:"H5P",alphabet:"",behaviour:{autoCheck:!0,enableRetry:!0,enableSolutionsButton:!0,enableCheckButton:!0},l10n:{check:"Check",submit:"Submit",showSolution:"Show solution",retry:"Retry",lockOpen:"Lock open!",lockDisabled:"No more attempts. Lock disabled.",attemptsLeft:"Attempts left: @number",correctCombination:"This combination opens the lock.",wrongCombination:"This combination does not open the lock.",noMessage:"..."},a11y:{check:"Check whether the combination opens the lock.",submit:"Check whether the combination opens the lock and submit attempt to server.",showSolution:"Show the solution. The correct symbols that will open the lock will be displayed.",retry:"Retry the task. Reset all lock segments and start the task over again.",currentSymbol:"Current symbol: @symbol",currentSymbols:"Current symbols: @symbols",previousSymbol:"Previous symbol",nextSymbol:"Next symbol",correctCombination:"This combination opens the lock. @combination.",wrongCombination:"Wrong combination",disabled:"disabled",combinationLock:"combination lock",segment:"Segment @number of @total"}},this.params),this.params.behaviour.enableCheckButton||(this.params.behaviour.autoCheck=!0),this.params.solution=r.stripHTML(i().decode(this.params.solution));let a=this.params.solution.match(e());for((!a||(null===(t=a)||void 0===t?void 0:t.length)<1)&&(a=["H","5","P"]),a.length>g.SEGMENTS_MAX&&(this.params.solution=a.slice(0,g.SEGMENTS_MAX).join("")),this.params.alphabet=i().decode(this.params.alphabet),this.params.alphabet=`${this.params.alphabet}${this.params.solution}`.match(e()).reduce(((r,e)=>(-1===r.indexOf(e)&&(r=`${r}${e}`),r)),"");this.params.alphabet.match(e()).length<3;)this.params.alphabet=`${this.params.alphabet}${this.params.alphabet}`},a.initialize=function(){var t,a,s;const i=(null===(t=this.extras)||void 0===t||null===(a=t.metadata)||void 0===a?void 0:a.defaultLanguage)||"en";this.languageTag=r.formatLanguageCode(i),this.dictionary=new o,this.dictionary.fill({l10n:this.params.l10n,a11y:this.params.a11y}),this.previousState=(null===(s=this.extras)||void 0===s?void 0:s.previousState)||{},this.viewState=this.previousState.viewState??g.VIEW_STATES.task,this.wasAnswerGiven=this.previousState.wasAnswerGiven??!1,this.maxAttempts=this.params.behaviour.autoCheck?1/0:this.params.behaviour.maxAttempts??1/0,this.attemptsLeft=this.previousState.attemptsLeft??this.maxAttempts,this.lock=new p({dictionary:this.dictionary,alphabet:this.params.alphabet.match(e()),solution:this.params.solution.match(e()),autoCheck:this.params.behaviour.autoCheck,maxAttempts:this.maxAttempts,previousState:this.previousState.lock},{onChanged:()=>{this.handleLockChanged()},onResized:()=>{this.trigger("resize")}}),this.on("resize",(()=>{this.lock.resize()}))},a.buildDOM=function(){const r=document.createElement("div");if(r.classList.add("h5p-combination-lock-main"),this.params.introduction){const e=document.createElement("div");e.classList.add("h5p-combination-lock-introduction");const t=document.createElement("div");t.classList.add("h5p-combination-lock-intro-content"),t.innerHTML=this.params.introduction,e.appendChild(t),r.appendChild(e)}return r.appendChild(this.lock.getDOM()),this.addButton("check-answer",this.dictionary.get("l10n.check"),(()=>{this.checkAnswer()}),!this.params.behaviour.autoCheck,{"aria-label":this.dictionary.get("a11y.check")},{contentData:this.extras,textIfSubmitting:this.dictionary.get("l10n.submit")}),this.addButton("show-solution",this.dictionary.get("l10n.showSolution"),(()=>{this.showSolutions({showRetry:!0})}),this.params.behaviour.autoCheck&&this.params.behaviour.enableSolutionsButton,{"aria-label":this.dictionary.get("a11y.showSolution")}),this.addButton("try-again",this.dictionary.get("l10n.retry"),(()=>{this.resetTask(),this.lock.focus()}),!1,{"aria-label":this.dictionary.get("a11y.retry")}),r},a.recreateViewState=function(){if(this.viewState===g.VIEW_STATES.task)if(this.params.behaviour.autoCheck||this.maxAttempts===1/0)this.announceMessage({text:this.dictionary.get("l10n.noMessage"),aria:""});else{const r=this.dictionary.get("l10n.attemptsLeft").replace(/@number/g,this.attemptsLeft),e=this.dictionary.get("a11y.wrongCombination");this.announceMessage({text:r,aria:[e,r].join(". ")})}else this.viewState===g.VIEW_STATES.results?this.checkAnswer({skipXAPI:!0}):this.viewState===g.VIEW_STATES.solutions&&this.showSolutions({showRetry:!0})},t}(),d=function(){function t(){}var a=t.prototype;return a.triggerXAPIEvent=function(r){const e=this.createXAPIEvent(r);this.trigger(e)},a.createXAPIEvent=function(t){const a=this.createXAPIEventTemplate(t);return r.extend(a.getVerifiedStatementValue(["object","definition"]),this.getXAPIDefinition()),"answered"===t&&(a.setScoredResult(this.getScore(),this.getMaxScore(),this,!0,this.getScore()>0),a.data.statement.result=r.extend({response:this.lock.getResponse().match(e()).join("[,]")},a.data.statement.result||{})),a},a.getXAPIDefinition=function(){const r={name:{}};return r.name[this.languageTag]=this.getTitle(),r.name["en-US"]=r.name[this.languageTag],r.description={},r.description[this.languageTag]=this.getDescription(),r.description["en-US"]=r.description[this.languageTag],r.type="http://adlnet.gov/expapi/activities/cmi.interaction",r.interactionType="fill-in",r.correctResponsesPattern=[this.params.solution.match(e()).join("[,]")],r},a.getTitle=function(){var r,e;return H5P.createTitle((null===(r=this.extras)||void 0===r||null===(e=r.metadata)||void 0===e?void 0:e.title)||t.DEFAULT_DESCRIPTION)},a.getDescription=function(){return`${this.params.introduction||`<p>${t.DEFAULT_DESCRIPTION}</p>`}\n<p>${this.params.solution.match(e()).map((()=>t.RESPONSE_PLACEHOLDER)).join(" ")}</p>`},t}();function m(r,e){return m=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(r,e){return r.__proto__=e,r},m(r,e)}d.DEFAULT_DESCRIPTION="Combination Lock",d.RESPONSE_PLACEHOLDER="__________";let g=function(e){var t,s;function i(t,s){var o;let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return o=e.call(this,"combination-lock")||this,r.addMixins(i,[a,h,d]),o.params=t,o.contentId=s,o.extras=n,o.sanitize(),o.initialize(),o.dom=o.buildDOM(),o.recreateViewState(),o}s=e,(t=i).prototype=Object.create(s.prototype),t.prototype.constructor=t,m(t,s);var o=i.prototype;return o.registerDomElements=function(){this.setContent(this.dom)},o.getCurrentState=function(){return{wasAnswerGiven:this.wasAnswerGiven,attemptsLeft:this.attemptsLeft,viewState:this.viewState,message:this.lock.getMessage(),lock:this.lock.getCurrentState()}},o.checkAnswer=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.handleAnswerGiven(),this.lock.getResponse()!==this.params.solution?(this.params.behaviour.autoCheck||this.lock.showAnimationWrongCombination(),this.attemptsLeft=Math.max(0,this.attemptsLeft-1),0===this.attemptsLeft?this.handleFinalWrongResponse(r):this.params.behaviour.autoCheck||this.handleIntermediaryWrongResponse()):this.handleCorrectResponse(r)},o.handleCorrectResponse=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.lock.disable(),this.setViewState("results"),this.announceMessage({text:this.dictionary.get("l10n.lockOpen")}),r.skipXAPI||this.triggerXAPIEvent("answered"),window.setTimeout((()=>{this.hideButton("check-answer"),this.params.behaviour.autoCheck&&this.hideButton("show-solution"),this.params.behaviour.enableRetry?(this.showButton("try-again"),setTimeout((()=>{this.focusButton("try-again")}),50)):r.skipXAPI||this.lock.focus()}),50)},o.handleIntermediaryWrongResponse=function(){if(this.attemptsLeft===1/0)return void this.announceMessage({text:this.dictionary.get("l10n.wrongCombination")});const r=this.dictionary.get("l10n.attemptsLeft").replace(/@number/g,this.attemptsLeft),e=this.dictionary.get("a11y.wrongCombination");this.announceMessage({text:r,aria:[e,r].join(". ")})},o.handleFinalWrongResponse=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.setViewState("results"),this.lock.disable(),r.skipXAPI||this.triggerXAPIEvent("answered"),this.announceMessage({text:this.dictionary.get("l10n.lockDisabled")}),window.setTimeout((()=>{this.hideButton("check-answer"),this.params.behaviour.enableSolutionsButton&&this.showButton("show-solution"),this.params.behaviour.enableRetry&&this.showButton("try-again"),this.params.behaviour.enableSolutionsButton||this.params.behaviour.enableRetry||r.skipXAPI||window.setTimeout((()=>{this.lock.focus()}),50)}),50)},o.announceMessage=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};r.text&&(this.lock.setMessage(r.text),this.read(r.aria??r.text))},o.setViewState=function(r){"string"==typeof r&&void 0!==i.VIEW_STATES[r]?this.viewState=i.VIEW_STATES[r]:"number"==typeof r&&Object.values(i.VIEW_STATES).includes(r)&&(this.viewState=r,this.content.setViewState(i.VIEW_STATES.find((e=>e===r)).keys[0]))},o.handleLockChanged=function(){this.handleAnswerGiven(),this.params.behaviour.autoCheck&&this.checkAnswer()},o.handleAnswerGiven=function(){this.wasAnswerGiven=!0},i}(H5P.Question);g.VIEW_STATES={task:0,results:1,solutions:2},g.SEGMENTS_MAX=6,H5P.CombinationLock=g}()}();;
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
