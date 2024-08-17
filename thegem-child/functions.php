<?php

// dimitris - wordpress utility file
require_once get_stylesheet_directory() . '/inc/utility.php';


// dimitris - h5p mods - alter h5p plugin styles

function h5p_alter_styles(&$styles, $libraries, $embed_type) {
  $styles[] = (object) array(
    // Path must be relative to wp-content/uploads/h5p or absolute.
    'path' => 'https://cultum.gr/wp-content/uploads/styles-h5p.css',
    'version' => '?ver=0.1' // Cache buster
  );
}
add_action('h5p_alter_library_styles', 'h5p_alter_styles', 10, 3);




// dimitris - custom rest api endpoint for saving player info on the server

function save_user_specific_data() {
    register_rest_route('custom/v1', '/save-user-data', array(
        'methods' => 'POST',
        'callback' => 'save_user_specific_data_callback',
        'permission_callback' => function () {
            return is_user_logged_in();
        }
    ));
}

add_action('rest_api_init', 'save_user_specific_data');

function save_user_specific_data_callback(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $data = $request->get_param('data');

    if (empty($data)) {
        return new WP_Error('no_data', 'No data provided', array('status' => 400));
    }

    update_user_meta($user_id, 'user_specific_data', $data);

    return new WP_REST_Response(array('message' => 'Data saved successfully'), 200);
}

function enqueue_custom_js() {
    wp_enqueue_script('https://cultum.gr/wp-content/themes/thegem-child/js/custom.js', array('jquery'), '1.0', true);
    wp_localize_script('custom-js', 'customRest', array(
        'url' => rest_url('custom/v1/save-user-data'),
        'nonce' => wp_create_nonce('wp_rest')
    ));
}

//add_action('wp_enqueue_scripts', 'enqueue_custom_js');


// dimitris - ajax achievement unlock

// Add this to your theme's functions.php file

function check_user_achievement() {
    // Verify nonce for security
    check_ajax_referer('check_user_achievement_nonce', 'security');

    // Get the user ID and achievement ID from the AJAX request
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $achievement_id = isset($_POST['achievement_id']) ? intval($_POST['achievement_id']) : 0;

    // Check if the user has earned the achievement
    $has_earned = gamipress_has_user_earned_achievement($user_id, $achievement_id);

    // Return the result as JSON
    wp_send_json_success(array('has_earned' => $has_earned));

    // Don't forget to stop execution afterward
    wp_die();
}

// Handle AJAX request for logged-in users
add_action('wp_ajax_check_user_achievement', 'check_user_achievement');
// Handle AJAX request for non-logged-in users
add_action('wp_ajax_nopriv_check_user_achievement', 'check_user_achievement');


// Add this to your theme's functions.php file

function output_current_user_id_to_js() {
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        echo "<script type='text/javascript'>window.currentUserId = " . esc_js($user_id) . ";</script>";
    } else {
        echo "<script type='text/javascript'>window.currentUserId = null;</script>";
    }
}
add_action('wp_head', 'output_current_user_id_to_js');

// Add this to your theme's functions.php file
function enqueue_custom_scripts() {
    wp_enqueue_script('custom-script', 'https://cultum.gr/wp-content/themes/thegem-child/js/custom-script.js', array('jquery'), null, true);

    // Localize script to pass AJAX URL and nonce to JavaScript
    wp_localize_script('custom-script', 'ajax_object', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'security' => wp_create_nonce('check_user_achievement_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_custom_scripts');







// dimitris - dynamically update point counters, configure level unlocking and achievement unlocking

function enqueue_custom_h5p_script() {
    wp_enqueue_script(
        'h5p-scorekeeper',
        'https://cultum.gr/wp-content/themes/thegem-child/js/h5p-scorekeeper.js',
        array('jquery'),
        '1.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'enqueue_custom_h5p_script');


// add capital slug as a meta tag

function add_slug_to_meta() {
    if (is_single()) {
        global $post;
        echo '<meta name="page-slug" content="' . $post->post_name . '">';
    }
}
add_action('wp_head', 'add_slug_to_meta');


// dimitris - import javascript for configuring the games' multi-step logic

function enqueue_multi_step() {
    wp_enqueue_script(
        'multi-step-games',
        'https://cultum.gr/wp-content/themes/thegem-child/js/multi-step-games.js',
        array('jquery'),
        '1.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'enqueue_multi_step');


// dimitris - Ultimate memeber redirect - refresh current page after registration
add_action( 'um_registration_after_auto_login', 'my_registration_after_auto_login', 10, 1 );
	function my_registration_after_auto_login( $user_id ) {
		wp_redirect( get_permalink() );
		exit();
}