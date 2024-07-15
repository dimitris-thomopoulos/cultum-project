// dimitris - javascript code for setting up the logic of unlocking steps-levels in a capital's game

var pageUrl = window.location.href;
var baseUrl = pageUrl.substring(0, 25);
var slug = document.querySelector('meta[name="page-slug"]').getAttribute('content');

if (baseUrl == 'https://cultum.gr/capital') {
    
    window.currentStep = 1;
    
    if (window.location.hash) {
        var url = window.location.href.split('#')[0];
        history.replaceState(null, null, `https://cultum.gr/capital/${slug}/`);
    }
    
    (function ($) {
    $( window ).on( "load", function() {
        
        console.log('loaded!');       
        console.log(window.slug);
            
        window.nextLevelBtn = document.querySelector('.next-game a.gem-button');
        window.prevLevelBtn = document.querySelector('.prev-game a.gem-button');
        
        window.gameSteps = [...document.querySelectorAll('.game-step')];
        window.gameLevels = [];
        
        for (window.gameCounter=1; window.gameCounter <= gameSteps.length; window.gameCounter++) {
            window.gameLevels.push(document.getElementById(`${window.slug}-game-${window.gameCounter}`));
        }
        
        multiStepLogic();
        
        window.gameLevels[window.currentStep - 1].classList.remove('hidden-step');
        
function multiStepLogic() {
    // Check if the current step-game has already been completed by the current user
    if ((localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) == 'true') && (window.currentStep < window.gameSteps.length) ) {
        window.nextLevelBtn.classList.remove('disabled');
    } else {
        if (!(window.nextLevelBtn.classList.contains('disabled')) ){
            window.nextLevelBtn.classList.add('disabled');
        }
    }
    
    // Handle previous button logic
    if (window.currentStep > 1) {
        window.prevLevelBtn.classList.remove('disabled');
        window.prevLevelBtn.classList.remove('hidden');
    } else if ((window.currentStep == 1) && !(window.prevLevelBtn.classList.contains('disabled')) ){
        window.prevLevelBtn.classList.add('disabled');
        window.prevLevelBtn.classList.add('hidden');
    }
    
    if (window.currentStep == window.gameLevels.length && !(window.nextLevelBtn.classList.contains('disabled')) ){
        window.nextLevelBtn.classList.add('disabled');
    }

    // Show the current step
    window.gameLevels.forEach((level, index) => {
        if (index === window.currentStep - 1) {
            level.classList.remove('hidden-step');
        } else {
            if ( !(level.classList.contains('hidden-step')) ) {
                level.classList.add('hidden-step');
            }
        }
    });
}

function handlePrevClick(e) {
    console.log('clicked!');
    e.preventDefault();

        // smooth scroll to top of previous game
        window.gameSteps[window.currentStep - 2].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
      window.gameLevels[(window.currentStep - 1)].classList.add('hidden-step');
        window.currentStep--;
        console.log('the current step is:', window.currentStep);
        multiStepLogic();
}

function handleNextClick(e) {
    console.log('clicked!');
    e.preventDefault();

        // smooth scroll to top of next game
        window.gameSteps[window.currentStep].scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        window.gameLevels[(window.currentStep - 1)].classList.add('hidden-step');
        window.currentStep++;
        console.log('the current step is:', window.currentStep);
        multiStepLogic();
}

// Attach event listeners once
window.prevLevelBtn.addEventListener('click', handlePrevClick);
window.nextLevelBtn.addEventListener('click', handleNextClick);
        
    });
})(jQuery);
}