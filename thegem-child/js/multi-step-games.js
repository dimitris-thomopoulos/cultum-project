// dimitris - javascript code for setting up the logic of unlocking steps-levels in a capital's game

var pageUrl = window.location.href;
var baseUrl = pageUrl.substring(0, 25);
var slug = document.querySelector('meta[name="page-slug"]').getAttribute('content');


if (baseUrl == 'https://cultum.gr/capital') {    
    
    if (window.location.hash) {
        var url = window.location.href.split('#')[0];
        history.replaceState(null, null, `https://cultum.gr/capital/${slug}/`);
    }
    
    (function ($) {
    $( window ).on( "load", function() {
        
        var stepsNav = document.querySelector('.steps-nav');
        window.blockContentContainer = document.querySelector('.block-content');
        
        console.log('loaded!');
        console.log(window.slug);
            
        window.nextLevelBtn = document.querySelector('.next-game a.gem-button');
        window.prevLevelBtn = document.querySelector('.prev-game a.gem-button');
        
        window.gameSteps = [...document.querySelectorAll('.game-step')];
        window.gameLevels = [];
        
        for (window.gameCounter=1; window.gameCounter <= gameSteps.length; window.gameCounter++) {
            window.gameLevels.push(document.getElementById(`${window.slug}-game-${window.gameCounter}`));
        }
        
        // when visiting the capital inner game page, land the player into the latest level they have unlocked
        for (let i=gameSteps.length; i>=1; i--) {
            if (localStorage.getItem(`${slug}GameNo-${i}-Completed`)) {
                if (i == gameSteps.length) {
                    window.currentStep = i;
                    break;
                } else {
                    window.currentStep = i+1;
                    break;
                }
                
            } else {
                window.currentStep = 1;
            }
        }
        
        function multiStepLogic() {
            
            // Show the new current level the player chose to play
           
            window.gameLevels[window.currentStep - 1].classList.remove('hidden-step');
            
            // smooth scroll to top of current game, if player has completed at least the first level. Add a bit of delay to allow time for the iframe games to load on the DOM.
            // WARNING - do NOT change the "nearest" option for block attribute, otherwise the page height will break
            if (localStorage.getItem(`${slug}GameNo-1-Completed`)) {
                setTimeout(() => {
                    window.blockContentContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }, 250)
            }
            
            // Check if the current step-game has already been completed by the current user, and hide or show the navigation buttons
            if ((localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) == 'true') && (window.currentStep < window.gameSteps.length) ) {
                window.nextLevelBtn.classList.remove('disabled');
            } else {
                if (!(window.nextLevelBtn.classList.contains('disabled')) ){
                    window.nextLevelBtn.classList.add('disabled');
                }
            }
    
            // toggle the hiding of the previous level button in the first game level
            if (window.currentStep > 1) {
                window.prevLevelBtn.classList.remove('disabled');
                window.prevLevelBtn.classList.remove('hidden');
            } else if ((window.currentStep == 1) && !(window.prevLevelBtn.classList.contains('disabled')) ){
                window.prevLevelBtn.classList.add('disabled');
                window.prevLevelBtn.classList.add('hidden');
            }
            
            if (window.currentStep == window.gameLevels.length && !(window.nextLevelBtn.classList.contains('disabled')) ){
                window.nextLevelBtn.classList.add('disabled');
//                window.nextLevelBtn.classList.add('hidden');
            }
        }

        // Handle previous button logic
        function handlePrevClick(e) {
            
            console.log('clicked!');
            e.preventDefault();
            
            if (stepsNav.classList.contains('nav-focus')) {
                stepsNav.classList.remove('nav-focus');
            }
                        
            window.currentStep--;
        
            //  Hide the level from which the player is leaving
            window.gameLevels[window.currentStep].classList.add('hidden-step');
            
            console.log('the current step is:', window.currentStep);
            
            multiStepLogic();
        }

        // Handle next button logic
        function handleNextClick(e) {
            console.log('clicked!');
            e.preventDefault();
            
            if (stepsNav.classList.contains('nav-focus')) {
                stepsNav.classList.remove('nav-focus');
            }
            
            window.currentStep++;
        
            // Show the new current step and hide the old one
            window.gameLevels[window.currentStep - 2].classList.add('hidden-step');       
            
            console.log('the current step is:', window.currentStep);  
            
            multiStepLogic();
        }
        
        // Display the current level once, on first page load of the game page
        window.gameLevels[window.currentStep - 1].classList.remove('hidden-step');
        
        // Attach event listeners once
        window.prevLevelBtn.addEventListener('click', handlePrevClick);
        window.nextLevelBtn.addEventListener('click', handleNextClick);
        
        multiStepLogic();
    });
})(jQuery);
}