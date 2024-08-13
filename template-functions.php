<?php
/**
 * Template Functions
 *
 * @package     GamiPress\Restrict_Content\Template_Functions
 * @since       1.0.0
 */
// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

/**
 * Get an array of pattern tags to being used on post restrictions
 *
 * @since  1.0.0

 * @return array The registered pattern tags
 */
function gamipress_restrict_content_get_pattern_tags() {

    return apply_filters( 'gamipress_restrict_content_pattern_tags', array(
        '{user}'            => __( 'User display name.', 'gamipress-restrict-content' ),
        '{user_first}'      => __( 'User first name.', 'gamipress-restrict-content' ),
        '{user_last}'       => __( 'User last name.', 'gamipress-restrict-content' ),
        '{site_title}'      => __( 'Site name.', 'gamipress-restrict-content' ),
        '{site_link}'       => __( 'Link to the site with site name as text.', 'gamipress-restrict-content' ),
    ) );

}

/**
 * Get an array of pattern tags to being used on post restrictions
 *
 * @since  1.0.0

 * @return array The registered pattern tags
 */
function gamipress_restrict_content_get_post_pattern_tags() {

    $pattern_tags = gamipress_restrict_content_get_pattern_tags();

    return apply_filters( 'gamipress_restrict_content_post_pattern_tags', array_merge( $pattern_tags, array(
        '{restrictions}'    => __( 'A list with the post restrictions (already completed by the user will look as completed).', 'gamipress-restrict-content' ),
        '{points}'          => __( 'The amount of points to get access.', 'gamipress-restrict-content' ),
        '{points_balance}'  => __( 'The full amount of points user has earned until this date.', 'gamipress-restrict-content' ),
        '{points_type}'     => __( 'The points type label of points to get access. Singular or plural is based on the amount of points to get access.', 'gamipress-restrict-content' ),
    ) ) );

}

/**
 * Get an array of pattern tags to being used on post restrictions for guests
 *
 * @since  1.0.4

 * @return array The registered pattern tags
 */
function gamipress_restrict_content_get_guest_post_pattern_tags() {

    return apply_filters( 'gamipress_restrict_content_guest_post_pattern_tags', array(
        '{site_title}'      => __( 'Site name.', 'gamipress-restrict-content' ),
        '{site_link}'       => __( 'Link to the site with site name as text.', 'gamipress-restrict-content' ),
        '{restrictions}'    => __( 'A list with the post restrictions.', 'gamipress-restrict-content' ),
        '{points}'          => __( 'The amount of points to get access.', 'gamipress-restrict-content' ),
        '{points_type}'     => __( 'The points type label of points to get access. Singular or plural is based on the amount of points to get access.', 'gamipress-restrict-content' ),
    ) );

}

/**
 * Get an array of pattern tags to being used on portion of content message
 *
 * @since  1.0.2

 * @return array The registered pattern tags
 */
function gamipress_restrict_content_get_content_pattern_tags() {

    $pattern_tags = gamipress_restrict_content_get_pattern_tags();

    return apply_filters( 'gamipress_restrict_content_content_pattern_tags', array_merge( $pattern_tags, array(
        '{points}'              => __( 'The amount of points to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{points_balance}'      => __( 'The full amount of points user has earned until this date.', 'gamipress-restrict-content' ),
        '{points_type}'         => __( 'The points type label of points to unlock this portion of content. Singular or plural is based on the amount of points to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{achievement}'         => __( 'The achievement(s) required to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{achievement_type}'    => __( 'The achievement type required to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{achievement_count}'   => __( 'The number of achievements required to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{rank}'                => __( 'The rank required to unlock this portion of content.', 'gamipress-restrict-content' ),
    ) ) );

}

/**
 * Get an array of pattern tags to being used on portion of content message
 *
 * @since  1.0.4

 * @return array The registered pattern tags
 */
function gamipress_restrict_content_get_guest_content_pattern_tags() {

    return apply_filters( 'gamipress_restrict_content_guest_content_pattern_tags', array(
        '{site_title}'          => __( 'Site name.', 'gamipress-restrict-content' ),
        '{site_link}'           => __( 'Link to the site with site name as text.', 'gamipress-restrict-content' ),
        '{points}'              => __( 'The amount of points to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{points_type}'         => __( 'The points type label of points to unlock this portion of content. Singular or plural is based on the amount of points to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{achievement}'         => __( 'The achievement(s) required to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{achievement_type}'    => __( 'The achievement type required to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{achievement_count}'   => __( 'The number of achievements required to unlock this portion of content.', 'gamipress-restrict-content' ),
        '{rank}'                => __( 'The rank required to unlock this portion of content.', 'gamipress-restrict-content' ),
    ) );

}

/**
 * Get a string with the desired achievement pattern tags html markup
 *
 * @since   1.0.0
 * @updated 1.0.2 Added $pattern_tags parameter
 *
 * @param string $pattern_tags  The pattern tags to return ( post|content )
 *
 * @return string               Pattern tags html markup
 */
function gamipress_restrict_content_get_pattern_tags_html( $pattern_tags = 'post' ) {

    if( $pattern_tags === 'post' ) {
        $tags = gamipress_restrict_content_get_post_pattern_tags();
    } else if( $pattern_tags === 'guest-post' ) {
        $tags = gamipress_restrict_content_get_guest_post_pattern_tags();
    } else if( $pattern_tags === 'content' ) {
        $tags = gamipress_restrict_content_get_content_pattern_tags();
    } else if( $pattern_tags === 'guest-content' ) {
        $tags = gamipress_restrict_content_get_guest_content_pattern_tags();
    } else {
        $tags = gamipress_restrict_content_get_pattern_tags();
    }

    $output = '<ul class="gamipress-pattern-tags-list gamipress-restrict-content-pattern-tags-list">';

    foreach( $tags as $tag => $description ) {

        $attr_id = 'tag-' . str_replace( array( '{', '}', '_' ), array( '', '', '-' ), $tag );

        $output .= "<li id='{$attr_id}'><code>{$tag}</code> - {$description}</li>";
    }

    $output .= '</ul>';

    return $output;

}

/**
 * Parse pattern tags to a given post pattern
 *
 * @since  1.0.0
 *
 * @param string    $pattern
 * @param int       $post_id
 * @param int       $user_id
 *
 * @return string Parsed pattern
 */
function gamipress_restrict_content_parse_post_pattern( $pattern, $post_id = null, $user_id = null ) {

    if( $post_id === null ) {
        $post_id = get_the_ID();
    }

    if( $user_id === null ) {
        $user_id = get_current_user_id();
    }

    $user = get_userdata( $user_id );

    $restrictions_html = '';

    $prefix = '_gamipress_restrict_content_';

    $restrictions = gamipress_restrict_content_get_meta( $post_id, 'restrictions' );

    if( is_array( $restrictions ) && count( $restrictions ) ) {

        $restrictions_html .= "<ul>";

        foreach( $restrictions as $restriction ) {
            // check if user has earned this restriction, and add an 'earned' class
            $earned = gamipress_restrict_content_user_meets_restriction( $restriction, $user_id );

            $restrictions_html .= '<li style="' . ( $earned ? 'text-decoration: line-through;' : '' ) . '">'
                    .  apply_filters( 'gamipress_restrict_content_restriction_label', $restriction[$prefix . 'label'], $post_id, $user_id )
                . '</li>';
        }

        $restrictions_html .= "</ul>";
    }

    // Setup points vars
    $points = gamipress_restrict_content_get_points_to_access( $post_id );
    $points_types = gamipress_get_points_types();
    $points_type = gamipress_restrict_content_get_points_type_to_access( $post_id );

    // Default points label
    $points_singular_label = __( 'Point', 'gamipress' );
    $points_plural_label = __( 'Points', 'gamipress' );

    if( isset( $points_types[$points_type] ) ) {
        // Points type label
        $points_singular_label = $points_types[$points_type]['singular_name'];
        $points_plural_label = $points_types[$points_type]['plural_name'];
    }

    $pattern_replacements = array(
        '{user}'                => ( $user ? $user->display_name : '' ),
        '{user_first}'          => ( $user ? $user->first_name : '' ),
        '{user_last}'           => ( $user ? $user->last_name : '' ),
        '{site_title}'          => get_bloginfo( 'name' ),
        '{site_link}'           => '<a href="' . esc_url( home_url() ) . '">' . get_bloginfo( 'name' ) . '</a>',
        '{restrictions}'        => $restrictions_html,
        '{points}'              => gamipress_format_amount( $points, $points_type ),
        '{points_balance}'      => gamipress_get_user_points( $user_id, $points_type ),
        '{points_type}'         => _n( $points_singular_label, $points_plural_label, $points ),
    );

    $pattern_replacements = apply_filters( 'gamipress_restrict_content_parse_post_pattern_replacements', $pattern_replacements, $pattern, $post_id, $user_id );

    return apply_filters( 'gamipress_restrict_content_parse_post_pattern', str_replace( array_keys( $pattern_replacements ), $pattern_replacements, $pattern ), $pattern_replacements, $pattern, $post_id, $user_id );

}

/**
 * Parse pattern tags to a given content pattern
 *
 * @since  1.0.2
 *
 * @param string    $pattern
 * @param int       $post_id
 * @param int       $user_id
 * @param array     $atts
 *
 * @return string Parsed pattern
 */
function gamipress_restrict_content_parse_content_pattern( $pattern, $post_id = null, $user_id = null, $atts = array() ) {

    if( $post_id === null )
        $post_id = get_the_ID();

    if( $user_id === null )
        $user_id = get_current_user_id();

    $user = get_userdata( get_current_user_id() );

    // Setup points vars
    $points = absint( $atts['points'] );
    $points_types = gamipress_get_points_types();
    $points_type = $atts['points_type'];

    // Default points label
    $points_singular_label = __( 'Point', 'gamipress' );
    $points_plural_label = __( 'Points', 'gamipress' );

    if( isset( $points_types[$points_type] ) ) {
        // Points type label
        $points_singular_label = $points_types[$points_type]['singular_name'];
        $points_plural_label = $points_types[$points_type]['plural_name'];
    }

    // Setup achievement vars
    $achievement_output = '';
    $achievements = explode( ',',  $atts['achievement'] );

    if( count( $achievements ) === 1 ) {
        // Single achievement
        $achievement_id = absint( $achievements[0] );

        if( $achievement_id !== 0 ) {
            $achievement_output = '<a href="' . get_permalink( $achievement_id ) . '">' . gamipress_get_post_field( 'post_title', $achievement_id ) . '</a>';
        }
    } else {
        // Multiple achievements
        $achievement_output = array();

        foreach( $achievements as $achievement_id ) {
            if( $achievement_id !== 0 ) {
                $achievement_output[] = '<a href="' . get_permalink( $achievement_id ) . '">' . gamipress_get_post_field( 'post_title', $achievement_id ) . '</a>';
            }
        }

        // Make a comma-separated string of achievement links
        $achievement_output = implode( ', ', $achievement_output );

        // Replace last "," by an " and", example:
        // Achievement 1, Achievement 2, Achievement 3
        // Achievement 1, Achievement 2 and Achievement 3
        $achievement_output = gamipress_restrict_content_replace_last( ',', ' and', $achievement_output );
    }

    // Setup rank vars
    $rank_output = '';
    $ranks = explode( ',',  $atts['rank'] );

    if( count( $ranks ) === 1 ) {
        // Single rank
        $rank_id = absint( $ranks[0] );

        if( $rank_id !== 0 ) {
            $rank_output = '<a href="' . get_permalink( $rank_id ) . '">' . gamipress_get_post_field( 'post_title', $rank_id ) . '</a>';
        }
    } else {
        // Multiple ranks
        $rank_output = array();

        foreach( $ranks as $rank_id ) {
            if( $rank_id !== 0 ) {
                $rank_output[] = '<a href="' . get_permalink( $rank_id ) . '">' . gamipress_get_post_field( 'post_title', $rank_id ) . '</a>';
            }
        }

        // Make a comma-separated string of rank links
        $rank_output = implode( ', ', $rank_output );

        // Replace last "," by an " and", example:
        // Rank 1, Rank 2, Rank 3
        // Rank 1, Rank 2 and Rank 3
        $rank_output = gamipress_restrict_content_replace_last( ',', ' and', $rank_output );
    }

    $pattern_replacements = array(
        '{user}'                => ( $user ? $user->display_name : '' ),
        '{user_first}'          => ( $user ? $user->first_name : '' ),
        '{user_last}'           => ( $user ? $user->last_name : '' ),
        '{site_title}'          => get_bloginfo( 'name' ),
        '{site_link}'           => '<a href="' . esc_url( home_url() ) . '">' . get_bloginfo( 'name' ) . '</a>',
        '{points}'              => gamipress_format_amount( $points, $points_type ),
        '{points_balance}'      => gamipress_get_user_points( $user_id, $points_type ),
        '{points_type}'         => _n( $points_singular_label, $points_plural_label, $points ),
        '{achievement}'         => $achievement_output,
        '{achievement_type}'    => gamipress_get_achievement_type_singular( $atts['achievement_type'] ),
        '{achievement_count}'   => absint( $atts['achievement_count'] ),
        '{rank}'                => $rank_output
    );

    $pattern_replacements = apply_filters( 'gamipress_restrict_content_parse_content_pattern_replacements', $pattern_replacements, $pattern, $post_id, $user_id );

    return apply_filters( 'gamipress_restrict_content_parse_content_pattern', str_replace( array_keys( $pattern_replacements ), $pattern_replacements, $pattern ), $pattern_replacements, $pattern, $post_id, $user_id );

}

/**
 * HTML markup for the "Get access by using points" button to unlock a post
 *
 * @since  1.0.2
 *
 * @param int $post_id
 * @param int $user_id
 *
 * @return string
 */
function gamipress_restrict_content_unlock_post_with_points_markup( $post_id = null, $user_id = null ) {

    // Grab the current post ID if not given
    if ( ! $post_id ) {
        $post_id = get_the_ID();
    }

    // Grab the current logged in user ID if not given
    if( $user_id === null ) {
        $user_id = get_current_user_id();
    }

    // Guest not supported yet (basically because they has not points)
    if( $user_id === 0 ) {
        return '';
    }

    // Return if user already has got access to this post
    if( gamipress_restrict_content_user_has_unlocked_post( $post_id, $user_id ) ) {
        return '';
    }

    // Check if post is unlocked by expending points or is allowed access by expending points
    if( gamipress_restrict_content_get_unlock_by( $post_id ) !== 'expend-points' && ! gamipress_restrict_content_allow_access_with_points( $post_id ) ) {
        return '';
    }

    $points = gamipress_restrict_content_get_points_to_access( $post_id );

    // Return if no points configured
    if( $points === 0 ) {
        return '';
    }

    // Setup vars
    $points_type = gamipress_restrict_content_get_points_type_to_access( $post_id );

    // This function is just available since GamiPress 1.5.1
    if( function_exists( 'gamipress_format_points' ) ) {
        $button_label = sprintf( __( 'Unlock: %s <img width="30" src="https://cultum.gr/wp-content/uploads/2024/06/gold-euro-coin-18551.png" alt="">', 'gamipress-restrict-content' ), $points  );
    } else {
        // Backward compatibility label
        $points_types = gamipress_get_points_types();

        // Default points label
        $points_label = __( 'Points', 'gamipress-restrict-content' );

        if( isset( $points_types[$points_type] ) ) {
            // Points type label
            $points_label = $points_types[$points_type]['plural_name'];
        }

        $button_label = sprintf( __( 'Unlock: %d %s', 'gamipress-restrict-content' ), $points, $points_label );
    }

    /**
     * Available filter to override button text when unlock a restricted post with points
     *
     * @since 1.0.2
     *
     * @param string    $button_label   The button label
     * @param int       $post_id        The restricted post ID
     * @param int       $user_id        The current logged in user ID
     * @param int       $points         The required amount of points
     * @param string    $points_type    The required amount points type
     */
    $button_label = apply_filters( 'gamipress_restrict_content_unlock_post_with_points_button_text', $button_label, $post_id, $user_id, $points, $points_type );

    ob_start(); ?>
    <div class="gamipress-restrict-content-unlock-post-with-points">
        <div class="gamipress-spinner" style="display: none;"></div>
        <button type="button" class="gamipress-restrict-content-unlock-post-with-points-button" data-id="<?php echo $post_id; ?>"><?php echo $button_label; ?></button>
    </div>
    <?php $output = ob_get_clean();

    // Return our markup
    return apply_filters( 'gamipress_restrict_content_unlock_post_with_points_markup', $output, $post_id, $user_id, $points, $points_type );

}

/**
 * HTML markup for the "Get access by using points" button to unlock a portion of content
 *
 * @since  1.0.2
 *
 * @param string    $content_id
 * @param int       $user_id
 * @param int       $post_id
 * @param array     $atts
 *
 * @return string
 */
function gamipress_restrict_content_unlock_content_with_points_markup( $content_id = '', $user_id = null, $post_id = null, $atts = array() ) {

    // Grab the current post ID if not given
    if ( ! $post_id ) {
        $post_id = get_the_ID();
    }

    // Grab the current logged in user ID if not given
    if( $user_id === null ) {
        $user_id = get_current_user_id();
    }

    // Guest not supported yet (basically because they has not points)
    if( $user_id === 0 ) {
        return '';
    }

    // Return if user already has got access to this post
    if( gamipress_restrict_content_user_has_unlocked_content( $content_id, $user_id ) ) {
        return '';
    }

    // Return if unlock_by isn't set to expend points
    if( $atts['unlock_by'] !== 'expend_points' ) {
        return '';
    }

    $points = absint( $atts['points'] );

    // Return if no points configured
    if( $points === 0 ) {
        return '';
    }

    // Setup vars
    $points_type = $atts['points_type'];

    // This function is just available since GamiPress 1.5.1
    if( function_exists( 'gamipress_format_points' ) ) {
        $button_label = sprintf( __( 'Unlock: %s', 'gamipress-restrict-content' ), gamipress_format_points( $points, $points_type ) );
    } else {
        // Backward compatibility label
        $points_types = gamipress_get_points_types();

        // Default points label
        $points_label = __( 'Points', 'gamipress-restrict-content' );

        if( isset( $points_types[$points_type] ) ) {
            // Points type label
            $points_label = $points_types[$points_type]['plural_name'];
        }

        $button_label = sprintf( __( 'Unlock: %d %s', 'gamipress-restrict-content' ), $points, $points_label );
    }

    /**
     * Available filter to override button text when unlock a restricted content with points
     *
     * @since   1.0.2
     * @updated 1.0.5 Added $content_id parameter
     *
     * @param string    $button_label   The button label
     * @param string    $content_id     The content ID
     * @param int       $post_id        The post ID where restricted content is placed
     * @param int       $user_id        The current logged in user ID
     * @param int       $points         The required amount of points
     * @param string    $points_type    The required amount points type
     */
    $button_label = apply_filters( 'gamipress_restrict_content_unlock_content_with_points_button_text', $button_label, $content_id, $post_id, $user_id, $points, $points_type );

    ob_start(); ?>
    <div class="gamipress-restrict-content-unlock-content-with-points">
        <div class="gamipress-spinner" style="display: none;"></div>
        <button type="button" class="gamipress-restrict-content-unlock-content-with-points-button" data-id="<?php echo $content_id; ?>" data-post-id="<?php echo $post_id; ?>"><?php echo $button_label; ?></button>
    </div>
    <?php $output = ob_get_clean();

    // Return our markup
    return apply_filters( 'gamipress_restrict_content_unlock_content_with_points_markup', $output, $post_id, $user_id, $points, $points_type );

}

/**
 * Register plugin templates directory on GamiPress template engine
 *
 * @since 1.0.0
 *
 * @param array $file_paths
 *
 * @return array
 */
function gamipress_restrict_content_template_paths( $file_paths ) {

    $file_paths[] = trailingslashit( get_stylesheet_directory() ) . 'gamipress/restrict-content/';
    $file_paths[] = trailingslashit( get_template_directory() ) . 'gamipress/restrict-content/';
    $file_paths[] = GAMIPRESS_RESTRICT_CONTENT_DIR . 'templates/';

    return $file_paths;

}
add_filter( 'gamipress_template_paths', 'gamipress_restrict_content_template_paths' );