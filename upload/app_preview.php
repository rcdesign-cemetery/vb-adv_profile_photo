<?php

// ####################### SET PHP ENVIRONMENT ###########################
error_reporting(E_ALL & ~E_NOTICE);

// #################### DEFINE IMPORTANT CONSTANTS #######################
define('NOSHUTDOWNFUNC', 1);
define('NOCOOKIES', 1);
define('THIS_SCRIPT', 'app_preview');
define('CSRF_PROTECTION', true);
define('NOPMPOPUP', 1);
define('VB_AREA', 'FORUM');

require_once('./includes/init.php');

if ($_REQUEST['do'] == 'crop_avatar' AND $vbulletin->userinfo['userid'] > 0)
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
        $img_editor->unshar_pmask(UNSHARP_MASK_AMOUNT, UNSHARP_MASK_RADIUS, UNSHARP_MASK_THRESHOLD);
        $img_editor->round_corner($vbulletin->options['app_corners_radius']);

        header("Content-type: image/png");
        echo $img_editor->get_img_binary();
    }
}
?>
