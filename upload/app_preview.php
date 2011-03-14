<?php

// ####################### SET PHP ENVIRONMENT ###########################
error_reporting(E_ALL & ~E_NOTICE);

// #################### DEFINE IMPORTANT CONSTANTS #######################
define('THIS_SCRIPT', 'app_preview');
define('CSRF_PROTECTION', true);
define('NOHEADER', 1);
define('NOZIP', 1);
define('NOCOOKIES', 1);
define('NOPMPOPUP', 1);
define('NONOTICES', 1);
define('NOSHUTDOWNFUNC', 1);

// ########################## REQUIRE BACK-END ############################
require_once('./global.php');

if ($_REQUEST['do'] == 'make_preview' AND $show['member'])
{
    $vbulletin->input->clean_array_gpc('r', array(
        'top' => TYPE_UINT,
        'left' => TYPE_UINT,
        'height' => TYPE_UINT,
        'width' => TYPE_UINT
    ));
    require_once DIR . '/includes/class_advanced_profile_photo.php';
    $left = ($vbulletin->GPC['left'] < 0 ) ? 0 : $vbulletin->GPC['left'];
    $top = ($vbulletin->GPC['top'] < 0 ) ? 0 : $vbulletin->GPC['top'];
    $height = ($vbulletin->GPC['height'] > vB_AdvancedProfilePhoto::MAX_HEIGHT) ? vB_AdvancedProfilePhoto::MAX_HEIGHT : $vbulletin->GPC['height'];
    $width = ($vbulletin->GPC['width'] > vB_AdvancedProfilePhoto::MAX_WIDTH) ? vB_AdvancedProfilePhoto::MAX_WIDTH : $vbulletin->GPC['width'];

    $target_path = $vbulletin->options['app_img_folder']."/".$vbulletin->userinfo['userid']."_".$vbulletin->userinfo['bigpicrevision'].".jpg";
    $img_editor = new vB_AdvancedProfilePhoto($target_path);
    if ($img_editor)
    {
        $img_editor->img_crop_resize_from_src($vbulletin->options['app_avatar_size'], $vbulletin->options['app_avatar_size'], $left, $top, $width, $height);
        $img_editor->unshar_pmask();
        $img_editor->round_corner($vbulletin->options['app_corners_radius']);

        header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');             // Date in the past
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT'); // always modified
        header('Cache-Control: no-cache, must-revalidate');           // HTTP/1.1
        header('Pragma: no-cache');                                   // HTTP/1.0
        header('Content-transfer-encoding: binary');
        header("Content-type: image/png");
        echo $img_editor->get_img_binary();
        exit;
    }
}

// by default return cleargif
header("Content-type: image/png");
$clear_gif = new vB_AdvancedProfilePhoto($vbulletin->options['cleargifurl']);
echo $clear_gif->get_img_binary();
?>
