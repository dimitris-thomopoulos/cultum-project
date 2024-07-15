jQuery(document).ready(function($) {
    function saveUserData(data) {
        $.ajax({
            url: customRest.url,
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', customRest.nonce);
            },
            data: {
                data: data
            },
            success: function(response) {
                console.log('Data saved successfully', response);
            },
            error: function(response) {
                console.log('Failed to save data', response);
            }
        });
    }
    
    function getUserData() {
        $.ajax({
            url: customRest.url.replace('save-user-data', 'get-user-data'),
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', customRest.nonce);
            },
            success: function(response) {
                if (response.data) {
                    console.log('User data retrieved successfully', response.data);
                    // Use the retrieved data as needed
                } else {
                    console.log('No user data found');
                }
            },
            error: function(response) {
                console.log('Failed to retrieve data', response);
            }
        });
    }

});