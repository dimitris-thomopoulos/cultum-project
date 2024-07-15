<?php
if (!defined('ABSPATH')) exit;
if (!isset($params['readmore_button_size']) || $params['readmore_button_size'] == 'default') {
	if (isset($params['version']) && $params['version'] == 'list') {
		$size = $params['columns_desktop'] == '1x' ? 'small' : 'tiny';
	} else {
		$size = $params['columns_desktop'] == '4x' ? 'tiny' : 'small';
	}
} else {
	$size = $params['readmore_button_size'];
}

$link = !isset($params['readmore_button_link']) || $params['readmore_button_link'] == 'default' ? get_the_permalink() : $params['readmore_button_custom_link'];
$type = isset($params['readmore_button_type']) ? $params['readmore_button_type'] : 'outline';
$id = isset($params['readmore_button_id']) ? $params['readmore_button_id'] : ''; ?>

<div class="gem-button-container gem-widget-button gem-button-position-inline">
	<a id="<?php echo esc_attr($id); ?>"
	   class="gem-button gem-button-size-<?php echo esc_attr($size); ?> gem-button-style-<?php echo esc_attr($type); ?>"
	   href="<?php echo $link; ?>">
			<span class="gem-inner-wrapper-btn">
				<span class="gem-text-button">
					<?php echo wp_kses($params['readmore_button_text'], 'post'); ?>
				</span>
			</span>
	</a>
</div>
