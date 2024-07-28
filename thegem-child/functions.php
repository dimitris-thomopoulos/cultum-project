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


// dimitris - filter H5P content based on the capital it belongs to (based on H5P content tag) 

function fetch_content_ids_by_tag($tag) {
    global $wpdb;
    
    // Your nested SQL query
    $sql = "
        SELECT `content_id`
        FROM `ct_h5p_contents_tags`
        WHERE `tag_id` = (
            SELECT `id` 
            FROM `ct_h5p_tags` 
            WHERE `name` = %s
        )
    ";
    
    // Execute the query with parameterized input
    $content_ids = $wpdb->get_results($wpdb->prepare($sql, $tag));
    
    if (!empty($content_ids)) {
        ?>
        
        
	<div id="main-game" class="vc_row wpb_row vc_row-fluid thegem-custom-6692ce142ff156610">
		<div class="wpb_column vc_column_container vc_col-sm-12 thegem-custom-6692ce142ffc29466">
			<div class="vc_column-inner thegem-custom-inner-6692ce142ffc3 ">
				<div class="wpb_wrapper step-wrapper thegem-custom-6692ce142ffc29466">
                                    <!--SEPARATOR START-->
                                    
        <?php
        $i = 1;
        foreach ($content_ids as $content_id) {
            global ${$tag . '_game_' . $i};
            $current_game_id = $content_id->content_id;
            
            // dimitris - HTML code which automatically inserts the H5P games associated with the current capital (HTML code is combination of WP bakery code and H5P shortcodes)
            echo '<div id="'. $tag .'-game-' . $i . '"
						class="vc_row wpb_row vc_inner vc_row-fluid game-step hidden-step thegem-custom-6692ce14300be5251 custom-inner-column-6692ce14300c1">
						<div class="wpb_column vc_column_container vc_col-sm-12 thegem-custom-6692ce14301755376">
							<div class="vc_column-inner thegem-custom-inner-6692ce1430176 ">
								<div class="wpb_wrapper game-area-wrapper thegem-custom-6692ce14301755376">
									<div class="wpb_text_column wpb_content_element  thegem-vc-text thegem-custom-6692ce14301e03260">
										<div class="wpb_wrapper">' . do_shortcode('[h5p id="' . $current_game_id . '"]') . '
										</div>
										<style>
											@media screen and (max-width:1023px) {
												.thegem-vc-text.thegem-custom-6692ce14301e03260 {
													display: block !important
												}
											}

											@media screen and (max-width:767px) {
												.thegem-vc-text.thegem-custom-6692ce14301e03260 {
													display: block !important
												}
											}

											@media screen and (max-width:1023px) {
												.thegem-vc-text.thegem-custom-6692ce14301e03260 {
													position: relative !important
												}
											}

											@media screen and (max-width:767px) {
												.thegem-vc-text.thegem-custom-6692ce14301e03260 {
													position: relative !important
												}
											}
										</style>
									</div>

								</div>
							</div>
						</div>
					</div>';            
            ++$i;
        }
        ?>	
                                    <!--SEPARATOR END-->
					<div
						class="vc_row wpb_row steps-nav vc_inner vc_row-fluid thegem-custom-6692ce1430dd47636 vc_column-gap-15 vc_row-o-equal-height vc_row-o-content-middle vc_row-flex custom-inner-column-6692ce1430dd8">
						<div class="wpb_column vc_column_container vc_col-xs-4 thegem-custom-6692ce1430e828721">
							<div class="vc_column-inner thegem-custom-inner-6692ce1430e83 ">
                                                            <div class="wpb_wrapper thegem-custom-6692ce1430e828721">
                                                                <style type="text/css">
										.thegem-button-6692ce1430fe78775 .gem-button svg {
											fill: #fff
										}
									</style>
									<div
										class="gem-button-container gem-button-position-center thegem-button-6692ce1430fe78775 prev-game">
										<a class="gem-button disabled hidden gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-icon-position-left"
											data-ll-effect="drop-left-without-wrap"
											style="border-radius: 3px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);"
											onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';"
											onmouseenter="this.style.backgroundColor='#f99b27';" href=""
											target="_self"><i class="fa fa-chevron-left"></i>&nbsp;&nbsp;Previous Level</a></div>
                                                            </div>
							</div>
						</div>
                                                <div class="wpb_column vc_column_container vc_col-xs-4 thegem-custom-669464c90e6a37215"><div class="vc_column-inner thegem-custom-inner-669464c90e6a4 "><div class="wpb_wrapper thegem-custom-669464c90e6a37215"><style type="text/css">.thegem-button-669464c90e7414754 .gem-button svg {fill: #ffffff;}</style><div class="gem-button-container gem-button-position-center thegem-button-669464c90e7414754 back-to-main"><a class="gem-button gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-empty" data-ll-effect="drop-right-without-wrap" style="border-radius: 250px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);" onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';" onmouseenter="this.style.backgroundColor='#f99b27';" href="https://cultum.gr/play/" target="_self"><i class="fa fa-home"></i></a></div> </div></div></div>
						<div class="wpb_column vc_column_container vc_col-xs-4 thegem-custom-6692ce1430f0c5924">
                                                    <div class="vc_column-inner thegem-custom-inner-6692ce1430f0d ">
							<div class="wpb_wrapper thegem-custom-6692ce1430f0c5924">
									<style type="text/css">
										.thegem-button-6692ce1430fe78775 .gem-button svg {
											fill: #fff
										}
									</style>
									<div
										class="gem-button-container gem-button-position-center thegem-button-6692ce1430fe78775 next-game">
										<a class="gem-button disabled gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-icon-position-right"
											data-ll-effect="drop-right-without-wrap"
											style="border-radius: 3px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);"
											onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';"
											onmouseenter="this.style.backgroundColor='#f99b27';" href=""
											target="_self">Next Level&nbsp;&nbsp;<i class="fa fa-chevron-right"></i></a></div>
                                                                        <div
										class="gem-button-container gem-button-position-center thegem-button-6692ce1430fe78775 finish-game">
										<a class="gem-button hidden gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-icon-position-right"
											data-ll-effect="drop-right-without-wrap"
											style="border-radius: 3px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);"
											onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';"
											onmouseenter="this.style.backgroundColor='#f99b27';" href=""
											target="_self"> Finish Game&nbsp;&nbsp;<i class="fa fa-solid fa-flag-checkered"></i></a></div>
							</div>
                                                    </div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

<?php
    } else {
//        echo "0 results";
    }
}

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




// get user data

//$user_id = get_current_user_id();
//$user_data = get_user_meta($user_id, 'user_specific_data', true);

//if ($user_data) {
    // Use the $user_data as needed
//    echo 'User data: ' . print_r($user_data, true);
//}