// File: js/custom-script.js

jQuery(document).ready(function($) {
    // Function to check if the user has earned the achievement
    function checkUserAchievement(userId, achievementId) {
        return $.ajax({
            url: ajax_object.ajax_url,
            type: 'POST',
            data: {
                action: 'check_user_achievement',
                security: ajax_object.security,
                user_id: userId,
                achievement_id: achievementId
            },
            success: function(response) {
                if(response.success) {
                    return response.data.has_earned;
                } else {
                    console.error('AJAX request failed.');
                    return false;
                }
            },
            error: function() {
                console.error('AJAX request error.');
                return false;
            }
        });
    }

    // Example usage:
    var userId = window.currentUserId; // Replace with the actual user ID
    var achievementId = 24987; // Replace with the actual achievement ID

    checkUserAchievement(userId, achievementId).done(function(hasEarned) {
        if (hasEarned) {
//            console.log('User has earned the achievement.');
            // Store the result in a JavaScript variable
            window.userHasEarnedAchievement = true;
        } else {
//            console.log('User has not earned the achievement.');
            window.userHasEarnedAchievement = false;
        }
    });
});