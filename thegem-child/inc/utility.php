<?php

remove_action('wp_head', 'wp_generator');

function my_login_logo() {
    echo '<style type="text/css">
        body.login div#login h1 a {
            background-image: url("https://cultum.gr/wp-content/uploads/thegem-logos/logo_710ca83be324c3ae57274e838bd0e8b7_1x.png.pagespeed.ce.Vki8VxTIxD.png");
            background-size: contain;
            width: 100%;
            margin: 0 auto;
        }
    </style>';
}

add_action('login_enqueue_scripts', 'my_login_logo');

function my_login_logo_url() {
    return get_bloginfo('url');
}

add_filter('login_headerurl', 'my_login_logo_url');

function my_login_logo_url_title() {
    return get_bloginfo('title');
}

add_filter('login_headertitle', 'my_login_logo_url_title');

// remove wp version param from any enqueued scripts
function vc_remove_wp_ver_css_js($src) {
    if (strpos($src, 'ver='))
        $src = remove_query_arg('ver', $src);
    return $src;
}

add_filter('style_loader_src', 'vc_remove_wp_ver_css_js', 9999);
add_filter('script_loader_src', 'vc_remove_wp_ver_css_js', 9999);

if (is_admin()) {
    setcookie('vchideactivationmsg', '1', strtotime('+3 years'), '/');
    setcookie('vchideactivationmsg_vc11', (defined('WPB_VC_VERSION') ? WPB_VC_VERSION : '1'), strtotime('+3 years'), '/');
}
//disable contact form 7 js & css load on all pages
add_filter('wpcf7_load_js', '__return_false');
add_filter('wpcf7_load_css', '__return_false');
add_action('wp_enqueue_scripts', 'enqueue_cf7_scripts', 99999);

function enqueue_cf7_scripts() {
    if (function_exists('wpcf7_enqueue_scripts') && function_exists('wpcf7_enqueue_styles') && is_page(array(1453,25877))) {
        wpcf7_enqueue_scripts();
        wpcf7_enqueue_styles();
    } else {
        wp_dequeue_script('contact-form-7');
        wp_dequeue_script('wpcf7cf-scripts');
        wp_deregister_script('google-recaptcha');
//        wp_dequeue_script('google-recaptcha');
//        wp_dequeue_script('wpcf7-recaptcha');
    }
}

if (class_exists('Vc_Manager')) {

    function myvcoverride() {
        remove_action('wp_head', array(visual_composer(), 'addMetaData'));
    }

    add_action('init', 'myvcoverride', 100);
}

function remove_revslider_meta_tag() {
    return '';
}

add_filter('revslider_meta_generator', 'remove_revslider_meta_tag');

function getPageIdByTpl($tpl) {
    $args = [
        'post_type' => 'page',
        'fields' => 'ids',
        'nopaging' => true,
        'meta_key' => '_wp_page_template',
        'meta_value' => $tpl . '.php'
    ];
    $pages = get_posts($args);
    if (isset($pages[0])) {
        return $pages[0];
    }
    return -1;
}

function ttruncat($text, $numb) {
    if (strlen($text) > $numb) {
        $text = substr($text, 0, $numb);
        $text = substr($text, 0, strrpos($text, " "));
        $etc = " ...";
        $text = $text . $etc;
    }
    return $text;
}

function greek_capitalize($titlos = null) {
    return str_replace(
            array('έ', 'Έ', 'ά', 'Ά', 'ή', 'Ή', 'ί', 'Ί', 'ϊ', 'ΐ', 'ό', 'Ό', 'ύ', 'Ύ', 'ώ', 'Ώ'), array('Ε', 'Ε', 'Α', 'Α', 'Η', 'Η', 'Ι', 'Ι', 'Ϊ', 'Ϊ', 'Ο', 'Ο', 'Υ', 'Υ', 'Ω', 'Ω'), mb_strtoupper($titlos)
    );
}

function theme_greeklish_slugs($text) {

    if (!is_admin()) {
        return $text;
    }

    $expressions = array(
        '/[αΑ][ιίΙΊ]/u' => 'ai',
        //'/[οΟ][ιίΙΊ]/u' => 'ei',
//'/[Εε][ιίΙΊ]/u' => 'oi',
        '/[αΑ][υύΥΎ]([θΘκΚξΞπΠσςΣτTφΡχΧψΨ]|\s|$)/u' => 'af$1',
        '/[αΑ][υύΥΎ]/u' => 'av',
        '/[εΕ][υύΥΎ]([θΘκΚξΞπΠσςΣτTφΡχΧψΨ]|\s|$)/u' => 'ef$1',
        '/[εΕ][υύΥΎ]/u' => 'ev',
        '/[οΟ][υύΥΎ]/u' => 'ou',
        //'/(^|\s)[μΜ][πΠ]/u' => '$1b',
//'/[μΜ][πΠ](\s|$)/u' => 'b$1',
        '/[μΜ][πΠ]/u' => 'mp',
        '/[νΝ][τΤ]/u' => 'nt',
        '/[τΤ][σΣ]/u' => 'ts',
        '/[τΤ][ζΖ]/u' => 'tz',
        '/[γΓ][γΓ]/u' => 'ng',
        '/[γΓ][κΚ]/u' => 'gk',
        '/[ηΗ][υΥ]([θΘκΚξΞπΠσςΣτTφΡχΧψΨ]|\s|$)/u' => 'if$1',
        '/[ηΗ][υΥ]/u' => 'iu',
        '/[θΘ]/u' => 'th',
        '/[χΧ]/u' => 'x',
        '/[ψΨ]/u' => 'ps',
        '/[αάΑΆ]/u' => 'a',
        '/[βΒ]/u' => 'v',
        '/[γΓ]/u' => 'g',
        '/[δΔ]/u' => 'd',
        '/[εέΕΈ]/u' => 'e',
        '/[ζΖ]/u' => 'z',
        '/[ηήΗΉ]/u' => 'i',
        '/[ιίϊΙΊΪ]/u' => 'i',
        '/[κΚ]/u' => 'k',
        '/[λΛ]/u' => 'l',
        '/[μΜ]/u' => 'm',
        '/[νΝ]/u' => 'n',
        '/[ξΞ]/u' => 'x',
        '/[οόΟΌ]/u' => 'o',
        '/[πΠ]/u' => 'p',
        '/[ρΡ]/u' => 'r',
        '/[σςΣ]/u' => 's',
        '/[τΤ]/u' => 't',
        '/[υύϋΥΎΫ]/u' => 'y',
        '/[φΦ]/iu' => 'f',
        '/[ωώ]/iu' => 'o',
        '/[«]/iu' => '',
        '/[»]/iu' => ''
    );

// Translitaration
    return preg_replace(
            array_keys($expressions), array_values($expressions), $text
    );
}

add_filter('sanitize_title', 'theme_greeklish_slugs', 1);