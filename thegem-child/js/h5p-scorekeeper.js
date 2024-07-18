// dynamiki enimerosi twn pontwn me tin oloklirwsi enos paixnidiou

var pageUrl = window.location.href;
var baseUrl = pageUrl.substring(0, 25);
var slug = pageUrl.substring(26, (pageUrl.length-1));

(function ($) {
    $(document).ready(function () {
        
        let i=1;
         
        var stepsNav = document.querySelector('.steps-nav');
        var pointsIndicators = [...document.querySelectorAll('.gamipress-inline-points-exploration-points-amount')];
        var coinsIndicators = [...document.querySelectorAll('.gamipress-inline-points-coins-amount')];
        
        window.nextLevelBtn = document.querySelector('.next-game a.gem-button');
        
        window.gameSteps = [...document.querySelectorAll('.game-step')];
        
        H5P.externalDispatcher.on('xAPI', function (event) {
            
            console.log('game was loaded!');
            
            console.log('event detected: ', event);
            
            if (typeof(event.data.statement.result) != "undefined") {
                if (typeof(scoreObject) != "undefined") {
                    var scoreObject = event.data.statement.result.score['raw'];
                    console.log('score: ', scoreObject);
                }                
                var gameMaxScore = event.data.statement.result.score['max'];
            }
            
            // check if a game level is completed
            if ( event.getVerb() === 'completed' || (typeof(event.data.statement.object.definition["correctResponsesPattern"]) != "undefined" &&  event.data.statement.object.definition["interactionType"] != "choice" ) || ((typeof(event.data.statement.result) != "undefined")) && (event.data.statement.result.score["scaled"] == 1) && (typeof event.data.statement.object.definition.extensions["http://h5p.org/x-api/h5p-subContentId"] == "undefined") ) {
                console.log('Completed event detected.');
                window.isGameCompleted = `${slug}GameNo-${window.currentStep}-Completed`;
                            
                //  disable the next level button if the user is already in the final level
                if (window.currentStep == window.gameSteps.length) {
                    window.nextLevelBtn.classList.add('disabled');
                    window.nextLevelBtn.classList.add('hidden');
                }
                
                //  if not already completed the specific game, update statically the points and coins of the player in the UI and pop the confetti
                if (localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) != 'true') {
                    
                    window.isGameCompleted = `${slug}GameNo-${window.currentStep}-Completed`;
                    
                    if ((typeof(scoreObject) != "undefined")) {
                        pointsIndicators[0].innerHTML = Number(pointsIndicators[0].innerText) + scoreObject;
                        pointsIndicators[1].innerHTML = Number(pointsIndicators[1].innerText) + scoreObject;
                    }
                    
                    coinsIndicators[0].innerHTML = Number(coinsIndicators[0].innerText) + 200;
                    coinsIndicators[1].innerHTML = Number(coinsIndicators[1].innerText) + 200;
                    
                    // locally store data that the specific game is now completed by the player
                    localStorage.setItem(`${slug}GameNo-${window.currentStep}-Completed`, 'true');
                    
                    if (window.currentStep != window.gameSteps.length) {
                        // enable the "next level" button to allow the user to unlock and move to the next level
                        window.nextLevelBtn.classList.remove('disabled');
                        window.nextLevelBtn.classList.remove('hidden');
                    }
                    
                    // bing up the navigation to the viewport of the user
                    stepsNav.classList.add('nav-focus');
                    
                    // play confetti animation on top of the screen
                    popConfetti();
                }
                
                i++;
            }
            
        });
    });

})(jQuery);