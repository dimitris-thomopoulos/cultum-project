// dynamiki enimerosi twn pontwn me tin oloklirwsi enos paixnidiou

var pageUrl = window.location.href;
var baseUrl = pageUrl.substring(0, 25);
var slug = pageUrl.substring(26, (pageUrl.length-1));

if (baseUrl == 'https://cultum.gr/capital') {
(function ($) {
    $(document).ready(function () {
        
        let i=1;
         
        var stepsNav = document.querySelector('.steps-nav');
        var pointsIndicators = [...document.querySelectorAll('.gamipress-points:nth-of-type(2) .gamipress-user-points-amount')];
        var coinsIndicators = [...document.querySelectorAll('.gamipress-points:nth-of-type(1) .gamipress-user-points-amount')];
        
        window.finishGameBtn = document.querySelector('.finish-game a.gem-button');
        
        window.gameSteps = [...document.querySelectorAll('.game-step')];
        
        H5P.externalDispatcher.on('xAPI', function (event) {
            
            console.log('game was loaded!');
            
            console.log('event detected: ', event);
            
            if (typeof(event.data.statement.object.definition) !== "undefined") {
                var eventDefinition = event.data.statement.object.definition;
            } else {
                var eventDefinition = {};
            }
            
            if (typeof(event.data.statement.result) !== "undefined") {
                
                var eventResult = event.data.statement.result;
                
                if (typeof(eventResult.score) !== "undefined") {
                    var scoreObject = event.data.statement.result.score['raw'];
                    console.log('score: ', scoreObject);
                    var eventScaledScore = event.data.statement.result.score["scaled"];
                } else {
                    var eventScaledScore = {};
                    var scoreObject = {};
                }
            } else {
                var eventResult= {};
            }
            
            // check if a game level is completed
            if ( (event.getVerb() === 'completed' && (typeof scoreObject !== "undefined") && (eventScaledScore === 1) ) || (typeof(eventDefinition["correctResponsesPattern"]) !== "undefined" &&  eventDefinition["interactionType"] !== "choice" ) || ((typeof scoreObject !== "undefined")) && (eventScaledScore === 1) && (typeof event.data.statement.object.definition.extensions["http://h5p.org/x-api/h5p-subContentId"] === "undefined") ) {
                console.log('Completed event detected.');
                window.isGameCompleted = `${slug}GameCompleted`;
                            
                //  show the "Finish Game" button if the level which the user just completed is the final level
                if (window.currentStep === window.gameSteps.length) {
                    
                    window.hasCompletedAllLevels = true;
                    
                    for (let j=1; j<=window.gameSteps.length; j++) {
                        if (localStorage.getItem(`${slug}GameNo-${j}-Completed`) !== 'true') {
                            window.hasCompletedAllLevels = false;
                        }
                    }
                }
                
                // check if user has completed all game levels AND hasn't received the capital achievement yet
                if (window.hasCompletedAllLevels && localStorage.getItem(window.isGameCompleted) !== 'true') {
                    
                    window.finishGameBtn.classList.remove('hidden');
                    const handleClick = (e) => {
                        e.preventDefault();
                        popFinishConfetti();
                        window.finishGameBtn.classList.add('hidden');
                            
                        // Remove the event listener
                        window.finishGameBtn.removeEventListener('click', handleClick);
                        localStorage.setItem(window.isGameCompleted, 'true');
                    };

                    window.finishGameBtn.addEventListener('click', handleClick);
                }

                
                //  if not already completed the specific game, update statically the points and coins of the player in the UI and pop the confetti
                if (localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) !== 'true') {
                    
//                    window.isGameCompleted = `${slug}GameNo-${window.currentStep}-Completed`;
                    
                    // locally store data that the specific game is now completed by the player
                    localStorage.setItem(`${slug}GameNo-${window.currentStep}-Completed`, 'true');
                    
                    // live exploration points and coins counters update
                    if ((typeof(scoreObject) !== "undefined")) {
                        
                        // live exploration points counter update
                        if (Number(pointsIndicators[0].innerText.replace('.', '')) >= 1000) {
                            let thousandSeparatorIndex = pointsIndicators[0].innerText.indexOf('.');
                            let newPoints = `${Number(pointsIndicators[0].innerText.replace('.', '')) + scoreObject}`;
                            
                            pointsIndicators[0].innerHTML = newPoints.slice(0, thousandSeparatorIndex) + '.' + newPoints.slice(thousandSeparatorIndex, newPoints.length);
                            pointsIndicators[1].innerHTML = newPoints.slice(0, thousandSeparatorIndex) + '.' + newPoints.slice(thousandSeparatorIndex, newPoints.length);
                        } else {
                            pointsIndicators[0].innerHTML = `${Number(pointsIndicators[0].innerText) + scoreObject}`;
                            pointsIndicators[1].innerHTML = pointsIndicators[0].innerHTML;
                        }
                        
                        // live coins counter update
                        if (Number(coinsIndicators[0].innerText.replace('.', '')) >= 1000) {
                            let thousandSeparatorIndex = coinsIndicators[0].innerText.indexOf('.');
                            let newCoins = `${Number(coinsIndicators[0].innerText.replace('.', '')) + 200}`;
                            
                            coinsIndicators[0].innerHTML = newCoins.slice(0, thousandSeparatorIndex) + '.' + newCoins.slice(thousandSeparatorIndex, newCoins.length);
                            coinsIndicators[1].innerHTML = newCoins.slice(0, thousandSeparatorIndex) + '.' + newCoins.slice(thousandSeparatorIndex, newCoins.length);
                        } else {
                            coinsIndicators[0].innerHTML = `${Number(coinsIndicators[0].innerText) + 200}`;
                            coinsIndicators[1].innerHTML = coinsIndicators[0].innerHTML;
                        }
                    }
                                        
                    if (window.currentStep < window.gameSteps.length) {
                        // enable the "next level" button to allow the user to unlock and move to the next level
                        window.nextLevelBtn.classList.remove('disabled');
                        window.nextLevelBtn.classList.remove('hidden');
                    }
                    
                    setTimeout(() => {
                        stepsNav.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }, 250);
                    
                    // play confetti animation on top of the screen
                    popConfetti();
                }
                
                i++;
            }
            
        });
    });

})(jQuery);
}