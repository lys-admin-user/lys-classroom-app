<?php
/**
 * Plugin Name: LYS Educational Platform
 * Plugin URI: https://ladderingyoursuccess.com
 * Description: Embed the complete LYS (Laddering Your Success) educational platform or individual features in your WordPress site using shortcodes.
 * Version: 2.0.0
 * Author: LYS Educational Platform
 * Author URI: https://ladderingyoursuccess.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: lys-platform
 */

if (!defined('ABSPATH')) {
    exit;
}

define('LYS_VERSION', '2.0.0');
define('LYS_PLATFORM_URL', 'https://lys.ladderingyoursuccess.com');

class LYS_Platform_Integration {
    
    private static $instance = null;
    
    private $embed_types = array(
        'lys_platform' => array('path' => '/embed/full', 'height' => '100vh', 'title' => 'LYS Platform'),
        'lys_lesson_generator' => array('path' => '/embed/lesson-generator', 'height' => '700px', 'title' => 'Lesson Generator'),
        'lys_career_explorer' => array('path' => '/embed/careers', 'height' => '800px', 'title' => 'Career Explorer'),
        'lys_self_discovery' => array('path' => '/embed/self-discovery', 'height' => '600px', 'title' => 'Self Discovery'),
        'lys_pricing' => array('path' => '/embed/pricing', 'height' => '500px', 'title' => 'Pricing'),
        'lys_dashboard' => array('path' => '/embed/dashboard', 'height' => '800px', 'title' => 'Dashboard'),
        'lys_gradebook' => array('path' => '/embed/gradebook', 'height' => '800px', 'title' => 'Gradebook'),
        'lys_portfolio' => array('path' => '/embed/portfolio', 'height' => '800px', 'title' => 'Portfolio'),
        'lys_parent_portal' => array('path' => '/embed/parent-portal', 'height' => '800px', 'title' => 'Parent Portal'),
        'lys_my_journey' => array('path' => '/embed/my-journey', 'height' => '700px', 'title' => 'My Journey'),
        'lys_milestones' => array('path' => '/embed/milestones', 'height' => '600px', 'title' => 'Milestones'),
        'lys_action_plans' => array('path' => '/embed/action-plans', 'height' => '700px', 'title' => 'Action Plans'),
        'lys_assessments' => array('path' => '/embed/assessments', 'height' => '700px', 'title' => 'Assessments'),
        'lys_resource_library' => array('path' => '/embed/resource-library', 'height' => '700px', 'title' => 'Resource Library'),
        'lys_scope_sequence' => array('path' => '/embed/scope-sequence', 'height' => '800px', 'title' => 'Scope & Sequence'),
        'lys_classroom' => array('path' => '/embed/classroom', 'height' => '700px', 'title' => 'Classroom'),
        'lys_assignments' => array('path' => '/embed/assignments', 'height' => '700px', 'title' => 'Assignments'),
        'lys_my_lessons' => array('path' => '/embed/my-lessons', 'height' => '700px', 'title' => 'My Lessons'),
        'lys_analytics' => array('path' => '/embed/analytics', 'height' => '700px', 'title' => 'Analytics'),
        'lys_educator_influence' => array('path' => '/embed/educator-influence', 'height' => '600px', 'title' => 'Educator Influence'),
        'lys_professional_development' => array('path' => '/embed/professional-development', 'height' => '700px', 'title' => 'Professional Development'),
        'lys_lesson_authoring' => array('path' => '/embed/lesson-authoring', 'height' => '800px', 'title' => 'Lesson Authoring'),
        'lys_admin' => array('path' => '/embed/admin', 'height' => '900px', 'title' => 'Administration'),
    );
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', array($this, 'register_shortcodes'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function register_shortcodes() {
        foreach ($this->embed_types as $shortcode => $config) {
            add_shortcode($shortcode, array($this, 'render_embed'));
        }
    }
    
    public function render_embed($atts, $content, $tag) {
        $config = isset($this->embed_types[$tag]) ? $this->embed_types[$tag] : $this->embed_types['lys_platform'];
        
        $defaults = array(
            'theme' => get_option('lys_default_theme', 'light'),
            'width' => '100%',
            'height' => $config['height'],
            'locale' => get_locale(),
            'initial_path' => '',
        );
        
        $atts = shortcode_atts($defaults, $atts, $tag);
        
        $base_url = get_option('lys_platform_url', LYS_PLATFORM_URL);
        $path = $config['path'];
        
        if ($tag === 'lys_platform' && !empty($atts['initial_path'])) {
            $path = '/embed/full' . sanitize_text_field($atts['initial_path']);
        }
        
        $url_params = array(
            'theme' => sanitize_text_field($atts['theme']),
            'locale' => sanitize_text_field($atts['locale']),
            'wp_embed' => '1',
        );
        
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            $url_params['wp_user_email'] = $current_user->user_email;
        }
        
        $embed_url = $base_url . $path . '?' . http_build_query($url_params);
        $iframe_id = 'lys-embed-' . sanitize_title($tag) . '-' . uniqid();
        
        $is_full_platform = ($tag === 'lys_platform');
        $min_height_style = $is_full_platform ? 'min-height: 100vh;' : '';
        
        ob_start();
        ?>
        <div class="lys-embed-container" style="width: <?php echo esc_attr($atts['width']); ?>;">
            <iframe 
                id="<?php echo esc_attr($iframe_id); ?>"
                src="<?php echo esc_url($embed_url); ?>" 
                width="100%"
                height="<?php echo esc_attr($atts['height']); ?>"
                frameborder="0"
                allow="clipboard-write; fullscreen"
                style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); <?php echo $min_height_style; ?>"
                title="<?php echo esc_attr($config['title']); ?>"
                loading="lazy"
            ></iframe>
        </div>
        <script>
        (function() {
            var iframe = document.getElementById('<?php echo esc_js($iframe_id); ?>');
            if (!iframe) return;
            
            window.addEventListener('message', function(event) {
                if (!event.data || event.source !== iframe.contentWindow) return;
                
                switch (event.data.type) {
                    case 'lys-resize':
                        if (event.data.height) {
                            iframe.style.height = event.data.height + 'px';
                        }
                        break;
                    case 'lys-route-change':
                        if (event.data.path) {
                            var newUrl = new URL(window.location.href);
                            newUrl.hash = event.data.path;
                            history.replaceState(null, '', newUrl.toString());
                        }
                        break;
                    case 'lys-auth-required':
                        <?php if (!is_user_logged_in()): ?>
                        window.location.href = '<?php echo esc_url(wp_login_url(get_permalink())); ?>';
                        <?php endif; ?>
                        break;
                }
            });
            
            window.lysNavigate = function(path) {
                iframe.contentWindow.postMessage({ type: 'lys-navigate', path: path }, '*');
            };
            
            window.lysSetTheme = function(theme) {
                iframe.contentWindow.postMessage({ type: 'lys-theme-change', theme: theme }, '*');
            };
        })();
        </script>
        <?php
        return ob_get_clean();
    }
    
    public function enqueue_scripts() {
        wp_add_inline_style('wp-block-library', '
            .lys-embed-container {
                max-width: 100%;
                margin: 0 auto;
            }
            .lys-embed-container iframe {
                display: block;
            }
            @media (max-width: 768px) {
                .lys-embed-container iframe {
                    border-radius: 0 !important;
                }
            }
        ');
    }
    
    public function add_admin_menu() {
        add_options_page(
            'LYS Platform Settings',
            'LYS Platform',
            'manage_options',
            'lys-platform-settings',
            array($this, 'render_settings_page')
        );
    }
    
    public function register_settings() {
        register_setting('lys_platform_settings', 'lys_platform_url');
        register_setting('lys_platform_settings', 'lys_default_theme');
        register_setting('lys_platform_settings', 'lys_api_key');
    }
    
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('lys_platform_settings');
                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="lys_platform_url">Platform URL</label>
                        </th>
                        <td>
                            <input type="url" id="lys_platform_url" name="lys_platform_url" 
                                value="<?php echo esc_attr(get_option('lys_platform_url', LYS_PLATFORM_URL)); ?>" 
                                class="regular-text">
                            <p class="description">The URL of your LYS platform instance.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="lys_default_theme">Default Theme</label>
                        </th>
                        <td>
                            <select id="lys_default_theme" name="lys_default_theme">
                                <option value="light" <?php selected(get_option('lys_default_theme'), 'light'); ?>>Light</option>
                                <option value="dark" <?php selected(get_option('lys_default_theme'), 'dark'); ?>>Dark</option>
                            </select>
                            <p class="description">Default theme for embedded content.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="lys_api_key">API Key (Optional)</label>
                        </th>
                        <td>
                            <input type="password" id="lys_api_key" name="lys_api_key" 
                                value="<?php echo esc_attr(get_option('lys_api_key', '')); ?>" 
                                class="regular-text">
                            <p class="description">For advanced SSO integration.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <hr>
            <h2>Available Shortcodes</h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Shortcode</th>
                        <th>Description</th>
                        <th>Default Height</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($this->embed_types as $shortcode => $config): ?>
                    <tr>
                        <td><code>[<?php echo esc_html($shortcode); ?>]</code></td>
                        <td><?php echo esc_html($config['title']); ?></td>
                        <td><?php echo esc_html($config['height']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <h3>Shortcode Options</h3>
            <ul>
                <li><code>theme="light|dark"</code> - Set the color theme</li>
                <li><code>width="100%"</code> - Set the container width</li>
                <li><code>height="800px"</code> - Set the iframe height</li>
                <li><code>locale="en"</code> - Set the language locale</li>
                <li><code>initial_path="/dashboard"</code> - (lys_platform only) Set initial page</li>
            </ul>
            
            <h3>Example Usage</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
[lys_platform theme="light" height="100vh"]

[lys_lesson_generator theme="dark" height="800px"]

[lys_career_explorer]

[lys_parent_portal theme="light"]
            </pre>
        </div>
        <?php
    }
}

LYS_Platform_Integration::get_instance();
