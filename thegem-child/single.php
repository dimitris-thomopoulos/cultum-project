<?php

get_header(); ?>

<div id="main-content" class="main-content">

<?php
	$thegem_post_template_id = in_array(get_post_type(), array('post', 'thegem_news'), true) ? thegem_single_post_template() : 0;
	$thegem_protfolio_template_id = get_post_type() === 'thegem_pf_item' ? thegem_portfolio_template() : 0;
	$thegem_cpt_template_id = in_array(get_post_type(), thegem_get_available_po_custom_post_types(), true) ? thegem_cpt_template() : 0;
	while ( have_posts() ) : the_post();

//                    dimitris - removed default page template
//                        get_template_part( 'template-post', 'portfolio' );
                        
                        // dimitris - automated multi-step game page

                        echo thegem_page_title(); ?>
			<div class="block-content">
				<div class="container">
					<div class="thegem-template-wrapper thegem-template-portfolio thegem-template-<?php echo esc_attr($thegem_protfolio_template_id); ?>">
						<?php
							$template_custom_css = get_post_meta($thegem_protfolio_template_id, '_wpb_shortcodes_custom_css', true) . get_post_meta($thegem_protfolio_template_id, '_wpb_post_custom_css', true);
							if($template_custom_css) {
								echo '<style>' . $template_custom_css . '</style>';
							}
							$template = get_post($thegem_protfolio_template_id);
							$template->post_content = str_replace(array('<p>[', ']</p>'), array('[', ']'), $template->post_content);
							$template->post_content = str_replace(array('[vc_row ', '[vc_row]', '[vc_section ', '[vc_section]'), array('[vc_row template_fw="1" ', '[vc_row template_fw="1"]','[vc_section template_fw="1" ', '[vc_section template_fw="1"]'), $template->post_content);
							$GLOBALS['thegem_template_type'] = 'portfolio';
                                                        
                                                        // check if page is single portfolio item
                                                        if ( is_singular( 'thegem_pf_item' ) ) {
                                                         
                                                            // level title and description
                                                            
                                                            $game_levels = get_field('game-levels');
                                                            $game_levels_number = get_field('number-of-levels');
                                                            $i = 1;
                                                            
                                                            foreach ($game_levels as $game_level) {
                                                                if (!empty($game_level)) {
                                                                    if( have_rows('game-levels') ): 
                                                                        
                                                                        while( have_rows('game-levels') && ($i <= $game_levels_number)): the_row();
                                                                        
//                                                                        the_sub_field("game");
                                                                        
//                                                                        echo do_shortcode('[acf field="game"]');
                                                                    
                                                                        // Get sub field values.
                                                                        $level_title = get_sub_field("level-{$i}-title");
                                                                        $level_description = get_sub_field("level-{$i}-description");
                                                                        echo '<div id="'. strtolower(get_the_title()) .'-game-' . $i . '" class="game-step hidden-step level-info-' . $i . '">' . '<h2 class="level-title">' . $level_title . '</h2>' . '<p class="level-description">' . $level_description .'</p>' . '</div>';
                                                                        
                                                                        endwhile;
                                                                    endif;
                                                            
                                                                $i++;
                                                            }}
                                                            
                                                            ?>
                                                            
                                                            <div class="wpb_column vc_column_container vc_col-sm-12 thegem-custom-6692ce142ffc29466">
			<div class="vc_column-inner thegem-custom-inner-6692ce142ffc3 ">
				<div class="wpb_wrapper step-wrapper thegem-custom-6692ce142ffc29466">
					<div class="vc_row wpb_row steps-nav vc_inner vc_row-fluid thegem-custom-6692ce1430dd47636 vc_column-gap-15 vc_row-o-equal-height vc_row-o-content-middle vc_row-flex custom-inner-column-6692ce1430dd8">
						<div class="wpb_column vc_column_container vc_col-xs-4 thegem-custom-6692ce1430e828721">
							<div class="vc_column-inner thegem-custom-inner-6692ce1430e83 ">
                                <div class="wpb_wrapper thegem-custom-6692ce1430e828721">
                                                                <style type="text/css">
										.thegem-button-6692ce1430fe78775 .gem-button svg {
											fill: #fff
										}
									</style>
									<div class="gem-button-container gem-button-position-center thegem-button-6692ce1430fe78775 prev-game">
										<a class="gem-button disabled hidden gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-icon-position-left"
											data-ll-effect="drop-left-without-wrap"
											style="border-radius: 3px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);"
											onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';"
											onmouseenter="this.style.backgroundColor='#f99b27';" href=""
											target="_self"><i class="fa fa-chevron-left"></i>&nbsp;&nbsp;Previous Level</a></div>
                                </div>
							</div>
						</div>
                    
                                            <div class="wpb_column vc_column_container vc_col-xs-4 thegem-custom-669464c90e6a37215">
                                                <div class="vc_column-inner thegem-custom-inner-669464c90e6a4 ">
                                                    <div class="wpb_wrapper thegem-custom-669464c90e6a37215"><style type="text/css">.thegem-button-669464c90e7414754 .gem-button svg {fill: #ffffff;}</style>
                                                        <div class="vc_row wpb_row vc_inner vc_row-fluid thegem-custom-66a78b133ab4c4421 custom-inner-column-66a78b133ab50" style="display: flex; algin-items: center;">
                                                            <div class="wpb_column vc_column_container vc_col-sm-6 thegem-custom-66a78b133ac082552"> 
                                                                <div class="vc_column-inner thegem-custom-inner-66a78b133ac09">
                                                                    <div class="wpb_wrapper thegem-custom-66a78b133ac082552">
                                                                        <div class="gem-button-container gem-button-position-center thegem-button-669464c90e7414754 back-to-main">
                                                                            <a class="gem-button gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-empty" data-ll-effect="drop-right-without-wrap" style="border-radius: 250px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);" onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';" onmouseenter="this.style.backgroundColor='#f99b27';" href="https://cultum.gr/play/" target="_self"><i class="fa fa-home"></i></a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="wpb_column vc_column_container vc_col-sm-6 thegem-custom-66a78b133ad622327">
                                                                <div class="vc_column-inner thegem-custom-inner-66a78b133ad63" style="height: 100%; display: flex; align-items: center;     ">
                                                                    <div class="wpb_wrapper thegem-custom-66a78b133ad622327"><?php echo do_shortcode('[gamipress_user_points type="all" thumbnail="yes" thumbnail_size="35" label="no" current_user="yes" inline="no" columns="1" columns_small="1" layout="left" align="left" wpms="no"]'); ?></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
						<div class="wpb_column vc_column_container vc_col-xs-4 thegem-custom-6692ce1430f0c5924">
                            <div class="vc_column-inner thegem-custom-inner-6692ce1430f0d ">
							    <div class="wpb_wrapper thegem-custom-6692ce1430f0c5924">
									<style type="text/css">
										.thegem-button-6692ce1430fe78775 .gem-button svg {
											fill: #fff
										}
									</style>
									<div class="gem-button-container gem-button-position-center thegem-button-6692ce1430fe78775 next-game">
										<a class="gem-button disabled gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-icon-position-right"
											data-ll-effect="drop-right-without-wrap"
											style="border-radius: 3px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);"
											onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';"
											onmouseenter="this.style.backgroundColor='#f99b27';" href=""
											target="_self">Next Level&nbsp;&nbsp;<i class="fa fa-chevron-right"></i></a>
                                    </div>
                                    <div class="gem-button-container gem-button-position-center thegem-button-6692ce1430fe78775 finish-game">
									    <a class="gem-button hidden gem-button-size-medium gem-button-style-flat gem-button-text-weight-normal gem-button-icon-position-right"
											data-ll-effect="drop-right-without-wrap"
											style="border-radius: 3px; background-color: rgb(30, 115, 190); color: rgb(255, 255, 255);"
											onmouseleave="this.style.backgroundColor='#1e73be';this.style.color='#ffffff';"
											onmouseenter="this.style.backgroundColor='#f99b27';" href=""
											target="_self"> Finish Game&nbsp;&nbsp;<i class="fa fa-solid fa-flag-checkered"></i></a>
                                    </div>
							    </div>
                            </div>
						</div><?php
                                                        } else {
                                                            // dimitris - disable default content of single portfolio page template (disable WP bakery)    
                                                            echo do_shortcode($template->post_content);
                                                            
                                                            //  print (new ReflectionFunction("gamipress_ajax_get_achievements"))->getFileName();
                                                        }
                                                        
							unset($GLOBALS['thegem_template_type']);
						?>
					</div>
				</div><!-- .container -->
			</div><!-- .block-content -->
                        <canvas id="confetti-canvas"></canvas>
                        <?php
                   
	endwhile;
?>

</div><!-- #main-content -->

<?php
get_footer();
