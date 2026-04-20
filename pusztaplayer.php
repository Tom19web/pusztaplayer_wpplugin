<?php
/**
 * Plugin Name: PusztaPlayer IPTV
 * Description: Senior szintű IPTV és VOD lejátszó integráció.
 * Version: 1.0.0
 * Author: PusztaPlay Dev Team
 */

if (!defined('ABSPATH'))
    exit;

class PusztaPlayer
{
    public function __construct()
    {
        add_shortcode('pusztaplayer', [$this, 'render_player']);
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
    }

    public function register_assets()
    {
        // CSS-ek regisztrálása
        $styles = ['tokens', 'base', 'layout', 'components', 'views'];
        foreach ($styles as $style) {
            wp_register_style("pp-$style", plugins_url("assets/css/$style.css", __FILE__));
        }

        // --- Bangers Font regisztrálása ---
        wp_register_style('pp-font-bangers', 'https://fonts.googleapis.com/css2?family=Bangers&display=swap', [], null);
        wp_register_style('pp-font-poppins', 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800&display=swap', [], null);

        // Külső függőség: HLS.js
        wp_register_script('hls-js', 'https://cdn.jsdelivr.net/npm/hls.js@1', [], null, true);

        // A fő alkalmazás
        wp_register_script('pp-app', plugins_url('assets/js/app.js', __FILE__), ['hls-js'], null, true);
    }

    public function render_player()
    {
        // Csak akkor töltjük be az asseteket, ha a shortcode használatban van
        wp_enqueue_style('pp-font-bangers');
        wp_enqueue_style('pp-font-poppins');
        wp_enqueue_style('pp-tokens');
        wp_enqueue_style('pp-base');
        wp_enqueue_style('pp-layout');
        wp_enqueue_style('pp-components');
        wp_enqueue_style('pp-views');
        wp_enqueue_script('pp-app');

        // Fontos: JS Modul támogatás kényszerítése
        add_filter('script_loader_tag', function ($tag, $handle) {
            if ('pp-app' === $handle) {
                return str_replace('<script ', '<script type="module" ', $tag);
            }
            return $tag;
        }, 10, 2);

        // A HTML konténer, amibe a JS renderel
        return '<div id="pusztaplayer-root"></div>';
    }
}

// Beállítások menü hozzáadása a WP Adminhoz
add_action('admin_menu', function () {
    add_options_page('PusztaPlayer Beállítások', 'PusztaPlayer', 'manage_options', 'pusztaplayer', function () {
        ?>
        <div class="wrap">
            <h1>PusztaPlayer Beállítások</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('pp_settings');
                do_settings_sections('pusztaplayer');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    });
});

add_action('admin_init', function () {
    register_setting('pp_settings', 'pp_xtream_server');
    add_settings_section('pp_main', 'Szerver Beállítások', null, 'pusztaplayer');
    add_settings_field('pp_xtream_server', 'Xtream Szerver URL', function () {
        $val = get_option('pp_xtream_server', 'https://live.pusztaplay.eu');
        echo '<input type="text" name="pp_xtream_server" value="' . esc_attr($val) . '" class="regular-text">';
    }, 'pusztaplayer', 'pp_main');
});

new PusztaPlayer();