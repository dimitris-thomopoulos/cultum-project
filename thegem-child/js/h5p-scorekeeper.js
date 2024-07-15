// dynamiki enimerosi twn pontwn me tin oloklirwsi enos paixnidiou

var pageUrl = window.location.href;
var baseUrl = pageUrl.substring(0, 25);
var slug = pageUrl.substring(26, (pageUrl.length-1));

(function ($) {
    $(document).ready(function () {
        
        let i=1;
            
        var pointsIndicators = [...document.querySelectorAll('.gamipress-inline-points-exploration-points-amount')];
        
        H5P.externalDispatcher.on('xAPI', function (event) {
            
            console.log('game was loaded!');
            
//            window['gameId' + i] = event.data.statement.object.definition.extensions["http://h5p.org/x-api/h5p-local-content-id"];
            
            console.log('event detected: ', event);
            
            if (typeof(event.data.statement.result) != "undefined") {
                var scoreObject = event.data.statement.result.score['raw'];
                var gameMaxScore = event.data.statement.result.score['max'];
                console.log('score: ', scoreObject);   
            }   
            
            if (event.getVerb() === 'completed' || scoreObject == gameMaxScore) {
                console.log('Completed event detected.');
                
                window.nextLevelBtn = document.querySelector('.next-game a.gem-button');
                window.nextLevelBtn.classList.remove('disabled');
                    
                window.completedGameId = event.data.statement.object.definition.extensions["http://h5p.org/x-api/h5p-local-content-id"];
                console.log(window.completedGameId);
                    
                window.isGameCompleted = `${slug}GameNo-${window.currentStep}-Completed`;
                
                window.gameSteps = [...document.querySelectorAll('.game-step')];
                
//                scroll into next level button
//                nextLevelBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                if (window.currentStep == window.gameSteps.length) {
                    window.nextLevelBtn.classList.add('disabled');
                }
                
//                if not already completed the specific game, update statically the points and coins of the player in the UI and pop the confetti
                if (!(localStorage.getItem(`${slug}GameNo-${window.currentStep}-Completed`) == 'true')) {
                    pointsIndicators[0].innerHTML = Number(pointsIndicators[0].innerText) + scoreObject;
                    pointsIndicators[1].innerHTML = Number(pointsIndicators[1].innerText) + scoreObject;
                    
                    // locally store data that the specific game is now completed by the player
                    localStorage.setItem(window.isGameCompleted, 'true');
                
                    /*
                    var data = {
                        key1: `${slug}GameNo-${window.currentStep}-Completed`,
                        key2: 'true'
                    };
                    */
                    
//                  confetti animation
                    popConfetti();
                }
            }
            
            i++;
        });
    });

})(jQuery);