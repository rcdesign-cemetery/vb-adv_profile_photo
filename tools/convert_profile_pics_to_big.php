<?php
ini_set('display_errors', 1);

$config_path = dirname(__FILE__).'/includes/config.php';;
if (file_exists($config_path))
{
    require_once($config_path);
    echo "config found\n";
}
else
{
    die('Config.php not found');
}
$link = mysql_connect("localhost:3306", $config['MasterServer']['username'], $config['MasterServer']['password']);
mysql_select_db($config['Database']['dbname'], $link);
$table_prefix = $config['Database']['tableprefix'];

$profilepicspath = dirname(__FILE__);
$bigpicspath = dirname(__FILE__);
$path = mysql_query("SELECT varname, value FROM ".$table_prefix."setting where varname = 'profilepicpath' or varname = 'app_img_folder'");
if (mysql_num_rows($path))
{
    while ($row = mysql_fetch_assoc($path))
    {
        if($row['varname'] == 'profilepicpath')
        {
            $profilepicspath .= trim($row['value'],".") . "/";
        }
        if($row['varname'] == 'app_img_folder')
        {
            $bigpicspath .= trim($row['value'],".") . "/";
        }
    }
}
else
{
     die('Folders for profile pics/bigs pics are not defined');
}
require_once dirname(__FILE__) . '/includes/class_advanced_profile_photo.php';

function make_bigpics(&$start)
{
    global $table_prefix;
    global $link;
    global $profilepicspath;
    global $bigpicspath;
    $perpage = 1000;
    $result = mysql_query("SELECT pic.*, u.profilepicrevision FROM ".$table_prefix."customprofilepic as pic, ".$table_prefix."user as u 
                           WHERE pic.userid = u.userid AND u.bigpicsaved = 0 ORDER BY pic.userid LIMIT {$start}, {$perpage}", $link);
    if (mysql_num_rows($result))
    {
        while ($row = mysql_fetch_assoc($result))
        {
            $img_editor = new vB_AdvancedProfilePhoto($profilepicspath.'profilepic'.$row['userid']."_".$row['profilepicrevision'].".gif");
            $img_editor->save_to_file($bigpicspath.$row['userid']."_1.jpg");
            unset($img_editor);
            mysql_query("REPLACE INTO ".$table_prefix."custombigpic
                         SET `userid` = " . $row['userid'] .", `sel_top` = 0, `sel_left` = 0, `dateline` = NOW(),
                         `sel_width`= ".$row['width'].", `sel_height`= ".$row['height'].",`width`= ".$row['width'].", `height`= ".$row['height']);

            // change revision of uploaded file
            mysql_query("UPDATE ".$table_prefix."user SET `bigpicrevision` = 1, `bigpicsaved` = 1 WHERE userid = ". $row['userid']);
        }
        $start = $start + 1000;
        echo "Processing {$start} pics\n";
        make_bigpics($start);
    }   
}

$start = 0;
make_bigpics($start);

?>
