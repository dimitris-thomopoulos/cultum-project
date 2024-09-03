// dimitris - javascript code for setting up the logic of unlocking steps-levels in a capital's game

var pageUrl = window.location.href;
var baseUrl = pageUrl.substring(0, 25);

window.logoutBtn = document.querySelector('.lets-talk-button.hide-for-guests');
window.logoutBtnSticky = document.querySelector('.lets-talk-button-sticky.hide-for-guests');
        
if ( (window.logoutBtn !== undefined) && (baseUrl !== 'https://cultum.gr/capital') ) {
    
    window.logoutBtn.addEventListener('click', () => {
        localStorage.clear();
    });
    
    window.logoutBtnSticky.addEventListener('click', () => {
        localStorage.clear();
    });
}

if (baseUrl === 'https://cultum.gr/capital') {
    
    window.slug = document.querySelector('meta[name="page-slug"]').getAttribute('content');
    
    if (window.location.hash) {
        var url = window.location.href.split('#')[0];
        history.replaceState(null, null, `https://cultum.gr/capital/${slug}/`);
    }
    
    (function ($) {
    $( window ).on( "load", function() {
        
        var stepsNav = document.querySelector('.steps-nav');                
                
        window.blockContentContainer = document.querySelector('.block-content');
        window.pageTitle = document.getElementById('page-title');
        
        var screenX = window.matchMedia("(max-width: 991px)");
        
        let gamePreloader = document.querySelector('.game-preloader');
        gamePreloader.classList.add('hidden-step');
        
//        console.log('loaded!');
//        console.log(window.slug);
            
        window.nextLevelBtn = document.querySelector('.next-game a.gem-button');
        window.prevLevelBtn = document.querySelector('.prev-game a.gem-button');
        
        window.finishGameBtn = document.querySelector('.finish-game a.gem-button');
        
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
            
            window.blockContentContainer = document.querySelector('.block-content');
            
            setTimeout(() => {
                window.blockContentContainer.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
            
            switch (true) {
                // hide the "previous level" button in the first game level
                case (window.currentStep == 1):
                    if (!(window.prevLevelBtn.classList.contains('hidden')) ){
                        window.prevLevelBtn.classList.add('hidden');
                    }
                    
                    if ((localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) == 'true')) {
                        window.nextLevelBtn.classList.remove('disabled');
                        window.nextLevelBtn.classList.remove('hidden');
                    }
                    
                    if ( !(window.finishGameBtn.classList.contains('hidden')) ) {
                        window.finishGameBtn.classList.add('hidden');
                    }
                    
                    break;
                    
                // toggle the hiding of the "previous level" and "next level" buttons in the levels in between
                case ((window.currentStep > 1) && (window.currentStep < window.gameSteps.length)):
                    
                    window.prevLevelBtn.classList.remove('hidden');
                    window.prevLevelBtn.classList.remove('disabled');
            
                    // Check if the current level has already been completed by the current user, and if this is true then show the "next level" button
                    if ((localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) == 'true')) {
                        window.nextLevelBtn.classList.remove('disabled');
                        window.nextLevelBtn.classList.remove('hidden');
                    } else {
                        window.nextLevelBtn.classList.add('disabled');
                    }
                    
                    if ( !(window.finishGameBtn.classList.contains('hidden')) ) {
                        window.finishGameBtn.classList.add('hidden');
                    }
                    
                    break;
                    
                case (window.currentStep == gameSteps.length):
                    
                    window.prevLevelBtn.classList.remove('hidden');
                    window.prevLevelBtn.classList.remove('disabled');
                    
                    if (!(window.nextLevelBtn.classList.contains('hidden')) ){
                        window.nextLevelBtn.classList.add('hidden');
                    }
                    
                    if ( (window.finishGameBtn.classList.contains('hidden')) && !localStorage.getItem(window.isFinishClicked) && localStorage.getItem(window.isGameCompleted) ) {
                        window.finishGameBtn.classList.remove('hidden');
                    }
                    
                    break;
            }
        }

        // Handle previous button logic
        function handlePrevClick(e) {
            
//            console.log('clicked!');
            e.preventDefault();

            window.currentStep--;
        
            //  Hide the level from which the player is leaving
            window.gameLevels[window.currentStep].classList.add('hidden-step');
            
//            console.log('the current step is:', window.currentStep);
            
            multiStepLogic();
        }

        // Handle next button logic
        function handleNextClick(e) {
//            console.log('clicked!');
            e.preventDefault();
            
            window.currentStep++;
        
            // Show the new current step and hide the old one
            window.gameLevels[window.currentStep - 2].classList.add('hidden-step');

//            console.log('the current step is:', window.currentStep);  
            
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