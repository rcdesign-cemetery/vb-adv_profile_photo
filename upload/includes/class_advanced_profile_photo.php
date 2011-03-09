<?php

class vB_AdvancedProfilePhoto
{

    const PNG_COMPRESSION = 9;
    const MAX_HEIGHT = 800;
    const MAX_WIDTH = 800;

    /**
     *
     * @var string
     */
    protected $_src_file;

    /**
     *
     * @var int
     */
    protected $_src_width;

    /**
     *
     * @var int
     */
    protected $_src_height;

    /**
     *
     * @var image resource initially loaded in constructor
     */
    protected $_gd_src_image;

    /**
     *
     * @var image resource on which all operations (resize, round corner etc) are performed
     */
    protected $_gd_resulting_image;

    /**
     *
     * @param string $src_file optional
     */
    public function  __construct($src_file)
    {
        $result = $this->load_img_from_src_file($src_file);

        return $result;
    }

    /**
     * Destroy an image resource
     *
     */
    public function  __destruct()
    {
        if ($this->_gd_resulting_image)
        {
            imagedestroy($this->_gd_resulting_image);
        }

        if ($this->_gd_src_image)
        {
            imagedestroy($this->_gd_src_image);
        }
    }

    /**
     * Create image resource from file
     *
     * @param string $src_file
     * @return bool
     */
    public function load_img_from_src_file($src_file)
    {
        if (!file_exists($src_file))
        {
            return false;
        }
        $this->_src_file = $src_file;
        $image_info = getimagesize ( $src_file );
        if ($image_info === false)
        {
            return false ;
        }

        switch ($image_info['mime']) {
            case 'image/gif':
                if (imagetypes() & IMG_GIF)
                {
                    $this->_gd_src_image = imagecreatefromgit($src_file);
                }
            break;
            case 'image/jpeg':
                if (imagetypes() & IMG_JPG)
                {
                    $this->_gd_src_image = imagecreatefromjpeg($src_file);
                }
            break;
            case 'image/png':
                if (imagetypes() & IMG_PNG)
                {
                    $this->_gd_src_image = imageCreateFromPNG($src_file);
                }
            break;
        }

        if (!$this->_gd_src_image)
        {
            return false ;
        }

        $this->_src_width = imagesx($this->_gd_src_image);
        $this->_src_height = imagesy($this->_gd_src_image);

        // create image we will be working at
        $this->_gd_resulting_image = imagecreatetruecolor($this->_src_width, $this->_src_height);
        imagecopy($this->_gd_resulting_image, $this->_gd_src_image, 0, 0, 0, 0, $this->_src_width, $this->_src_height);
        
        return true;
    }

    /**
     * Resize image keeping the aspect ratio.
     *
     * @param int $width
     * @param int $height
     * @return bool
     */
    public function img_resize_from_src($width, $height)
    {
        $x_ratio = $width / $this->_src_width;
        $y_ratio = $height / $this->_src_height;

        $ratio = min($x_ratio , $y_ratio);

        $new_width = floor($this->_src_width * $ratio);
        $new_height = floor($this->_src_height * $ratio);

        $gd_temp = imagecreatetruecolor($new_width, $new_height);

        imagecolortransparent($gd_temp, -1);

        imagefill($gd_temp , 0 , 0 , 0xFFFFFF);
        imagecopyresampled($gd_temp, $this->_gd_src_image, 0, 0, 0, 0, $new_width , $new_height , $this->_src_width, $this->_src_height);

        // destroy old resource
        if ($this->_gd_resulting_image)
        {
            imagedestroy($this->_gd_resulting_image);
        }

        $this->_gd_resulting_image = $gd_temp;

        return true;
    }

    /**
     * Crop part of source image based on selection data, then resize it to specified width/height.
     * We assume selection data and resulting width/height are proportional, so do not add aspect ratio stuff.
     *
     * @param int $width width of resulting image
     * @param int $height height of resulting image
     * @param int $left left coord of the selection
     * @param int $top top coord of the selection
     * @param int $sel_w selection width
     * @param int $sel_h selection height
     * @return bool
     */
    public function img_crop_resize_from_src($width, $height, $left, $top, $sel_w, $sel_h)
    {
        $gd_temp = imagecreatetruecolor($width, $height);

        imagecolortransparent($gd_temp, -1);

        imagefill($gd_temp , 0 , 0 , 0xFFFFFF);
        imagecopyresampled($gd_temp, $this->_gd_src_image, 0, 0, $left, $top, $width , $height , $sel_w, $sel_h);

        // destroy old resource
        if ($this->_gd_resulting_image)
        {
            imagedestroy($this->_gd_resulting_image);
        }

        $this->_gd_resulting_image = $gd_temp;

        return true;
    }

    /**
     * Get width from image resource
     *
     * @return int
     */
    public function get_width()
    {
        return imagesx($this->_gd_resulting_image);
    }

    /**
     * Get height from image resource
     *
     * @return int
     */
    public function get_height()
    {
        return imagesy($this->_gd_resulting_image);
    }

    /**
     * Round image corner
     *
     * @param int $radius
     * @return bool
     */
    public function round_corner($radius)
    {
        if (0 == $radius)
        {
            return false;
        }
        $radius_x = $radius;
        $radius_y = $radius;
        $gd_triple_mask = imagecreatetruecolor($radius_x * 6, $radius_y * 6);
        if ($gd_triple_mask)
        {
            $gd_mask = imagecreatetruecolor(imagesx($this->_gd_resulting_image), imagesy($this->_gd_resulting_image));
            if ($gd_mask)
            {
                $color_transparent = imagecolorallocate($gd_triple_mask, 255, 255, 255);
                imagefilledellipse($gd_triple_mask, $radius_x * 3, $radius_y * 3, $radius_x * 4, $radius_y * 4, $color_transparent);
                imagefilledrectangle($gd_mask, 0, 0, imagesx($this->_gd_resulting_image), imagesy($this->_gd_resulting_image), $color_transparent);

                imagecopyresampled($gd_mask, $gd_triple_mask,
                    0, 0, $radius_x, $radius_y,
                    $radius_x, $radius_y, $radius_x * 2, $radius_y * 2);

                imagecopyresampled($gd_mask, $gd_triple_mask,
                    0, imagesy($this->_gd_resulting_image) - $radius_y, $radius_x, $radius_y * 3,
                    $radius_x, $radius_y, $radius_x * 2, $radius_y * 2);

                imagecopyresampled($gd_mask, $gd_triple_mask,
                    imagesx($this->_gd_resulting_image) - $radius_x, imagesy($this->_gd_resulting_image) - $radius_y, $radius_x * 3, $radius_y * 3,
                    $radius_x, $radius_y, $radius_x * 2, $radius_y * 2);

                imagecopyresampled($gd_mask, $gd_triple_mask,
                    imagesx($this->_gd_resulting_image) - $radius_x, 0, $radius_x * 3, $radius_y,
                    $radius_x, $radius_y, $radius_x * 2, $radius_y * 2);


                $result = $this->_apply_mask($gd_mask);
                imagedestroy($gd_mask);
                imagedestroy($gd_triple_mask);
                return $result;
            }
            imagedestroy($gd_triple_mask);
        }
        return false;
    }

    /**
     * Apply image mask. Used in vB_AdvancedProfilePhoto round_corner($radius) method
     *
     * @param resource $gd_mask
     * @return bool
     */
    protected function _apply_mask(&$gd_mask)
    {
        $gd_mask_resized = imagecreatetruecolor(imagesx($this->_gd_resulting_image), imagesy($this->_gd_resulting_image));
        if ($gd_mask_resized)
        {
            imagecopyresampled($gd_mask_resized, $gd_mask,
                0, 0, 0, 0,
                imagesx($this->_gd_resulting_image), imagesy($this->_gd_resulting_image), imagesx($gd_mask), imagesy($gd_mask));

            $gd_mask_blendtemp = imagecreatetruecolor(imagesx($this->_gd_resulting_image), imagesy($this->_gd_resulting_image));
            if ($gd_mask_blendtemp)
            {
                $color_background = imagecolorallocate($gd_mask_blendtemp, 0, 0, 0);
                imagefilledrectangle($gd_mask_blendtemp, 0, 0, imagesx($gd_mask_blendtemp), imagesy($gd_mask_blendtemp), $color_background);
                imagealphablending($gd_mask_blendtemp, false);
                imagesavealpha($gd_mask_blendtemp, true);
                for ($x = 0; $x < imagesx($this->_gd_resulting_image); $x++)
                {
                    for ($y = 0; $y < imagesy($this->_gd_resulting_image); $y++)
                    {
                        $pixel = self::get_pixel_color($this->_gd_resulting_image, $x, $y);
                        $mask_pixel = self::grayscale_pixel(self::get_pixel_color($gd_mask_resized, $x, $y));
                        $mask_alpha = 127 - (floor($mask_pixel['red'] / 2) * (1 - ($pixel['alpha'] / 127)));

                        $newcolor = imagecolorallocatealpha($gd_mask_blendtemp, $pixel['red'], $pixel['green'], $pixel['blue'], $mask_alpha);
                        imagesetpixel($gd_mask_blendtemp, $x, $y, $newcolor);
                    }
                }
                imagealphablending($this->_gd_resulting_image, false);
                imagesavealpha($this->_gd_resulting_image, true);

                imagecopy($this->_gd_resulting_image, $gd_mask_blendtemp, 0, 0, 0, 0, imagesx($gd_mask_blendtemp), imagesy($gd_mask_blendtemp));
                imagedestroy($gd_mask_blendtemp);
                imagedestroy($gd_mask_resized);
                return true;
            }
            imagedestroy($gd_mask_resized);
        }
        return false;
    }

    /**
     * Gets the color of a given pixel
     * 
     * @param resource $img
     * @param int $x
     * @param int $y
     * @return array
     */
    protected static function get_pixel_color(&$img, $x, $y)
    {
        return @imagecolorsforindex($img, @imagecolorat($img, $x, $y));
    }

    /**
     * Gets shade of gray
     *
     * @param array $pixel
     * @return array
     */
    protected static function grayscale_pixel($pixel)
    {
        $gray = round(($pixel['red'] * 0.30) + ($pixel['green'] * 0.59) + ($pixel['blue'] * 0.11));
        return array('red'=>$gray, 'green'=>$gray, 'blue'=>$gray);
    }

    /**
     * Save image resource to file
     *
     * @param string $output_file
     * @return boolean
     */
    public function save_to_file($output_file)
    {
        return imagejpeg($this->_gd_resulting_image, $output_file);
    }

    /**
     * Return image binary content
     *
     * @param string $output_file
     * @return mixed
     */
    public function get_img_binary()
    {
        // imagepng is outputting directly to browser. We are using buffers as we don't need output, we need file contents
        ob_start();
        imagepng($this->_gd_resulting_image, null, self::PNG_COMPRESSION, PNG_ALL_FILTERS);
        $result = ob_get_contents();
        ob_end_clean();
        return $result;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////
	////
	////                  p h p U n s h a r p M a s k
	////
	////		Original Unsharp mask algorithm by Torstein H�nsi 2003.
	////		thoensi@netcom.no
	////
	///////////////////////////////////////////////////////////////////////////////////////////////
	/**
	* Private
	* Sharpen an image
	*
	* @param	object		finalimage
	* @param	int			float
	* @param	radius		float
	* @param	threshold	float
	*
	* @return	void
	*/
	function unshar_pmask($amount = 50, $radius = 1, $threshold = 0)
	{
		// $finalimg is an image that is already created within php using
		// imgcreatetruecolor. No url! $img must be a truecolor image.

		// Attempt to calibrate the parameters to Photoshop:
		if ($amount > 500)
		{
			$amount = 500;
		}
		$amount = $amount * 0.016;
		if ($radius > 50)
		{
			$radius = 50;
		}
		$radius = $radius * 2;
		if ($threshold > 255)
		{
			$threshold = 255;
		}

		$radius = abs(round($radius)); 	// Only integers make sense.
		if ($radius == 0)
		{
			return true;
		}

		$w = imagesx($this->_gd_resulting_image);
		$h = imagesy($this->_gd_resulting_image);
		$imgCanvas = imagecreatetruecolor($w, $h);
		$imgBlur = imagecreatetruecolor($w, $h);

		// Gaussian blur matrix:
		//
		//	1	2	1
		//	2	4	2
		//	1	2	1
		//
		//////////////////////////////////////////////////

		if (function_exists('imageconvolution'))
		{
			$matrix = array(
				array( 1, 2, 1 ),
				array( 2, 4, 2 ),
				array( 1, 2, 1 )
			);
			imagecopy ($imgBlur, $this->_gd_resulting_image, 0, 0, 0, 0, $w, $h);
			imageconvolution($imgBlur, $matrix, 16, 0);
		}
		else
		{
			// Move copies of the image around one pixel at the time and merge them with weight
			// according to the matrix. The same matrix is simply repeated for higher radii.
			for ($i = 0; $i < $radius; $i++)
			{
				imagecopy ($imgBlur, $this->_gd_resulting_image, 0, 0, 1, 0, $w - 1, $h); // left
				imagecopymerge ($imgBlur, $this->_gd_resulting_image, 1, 0, 0, 0, $w, $h, 50); // right
				imagecopymerge ($imgBlur, $this->_gd_resulting_image, 0, 0, 0, 0, $w, $h, 50); // center
				imagecopy ($imgCanvas, $imgBlur, 0, 0, 0, 0, $w, $h);

				imagecopymerge ($imgBlur, $imgCanvas, 0, 0, 0, 1, $w, $h - 1, 33.33333 ); // up
				imagecopymerge ($imgBlur, $imgCanvas, 0, 1, 0, 0, $w, $h, 25); // down
			}
		}

		if($threshold > 0)
		{
			// Calculate the difference between the blurred pixels and the original
			// and set the pixels
			for ($x = 0; $x < $w - 1; $x++) // each row
			{
				for ($y = 0; $y < $h; $y++) // each pixel
				{
					$rgbOrig = ImageColorAt($this->_gd_resulting_image, $x, $y);
					$rOrig = (($rgbOrig >> 16) & 0xFF);
					$gOrig = (($rgbOrig >> 8) & 0xFF);
					$bOrig = ($rgbOrig & 0xFF);

					$rgbBlur = ImageColorAt($imgBlur, $x, $y);

					$rBlur = (($rgbBlur >> 16) & 0xFF);
					$gBlur = (($rgbBlur >> 8) & 0xFF);
					$bBlur = ($rgbBlur & 0xFF);

					// When the masked pixels differ less from the original
					// than the threshold specifies, they are set to their original value.
					$rNew = (abs($rOrig - $rBlur) >= $threshold) ? max(0, min(255, ($amount * ($rOrig - $rBlur)) + $rOrig)) : $rOrig;

					$gNew = (abs($gOrig - $gBlur) >= $threshold) ? max(0, min(255, ($amount * ($gOrig - $gBlur)) + $gOrig)) : $gOrig;

					$bNew = (abs($bOrig - $bBlur) >= $threshold) ? max(0, min(255, ($amount * ($bOrig - $bBlur)) + $bOrig)) : $bOrig;



					if (($rOrig != $rNew) OR ($gOrig != $gNew) OR ($bOrig != $bNew))
					{
					    $pixCol = ImageColorAllocate($this->_gd_resulting_image, $rNew, $gNew, $bNew);
					    ImageSetPixel($this->_gd_resulting_image, $x, $y, $pixCol);
					}
				}
			}
		}
		else
		{
			for ($x = 0; $x < $w; $x++) // each row
			{
				for ($y = 0; $y < $h; $y++) // each pixel
				{
					$rgbOrig = ImageColorAt($this->_gd_resulting_image, $x, $y);
					$rOrig = (($rgbOrig >> 16) & 0xFF);
					$gOrig = (($rgbOrig >> 8) & 0xFF);
					$bOrig = ($rgbOrig & 0xFF);

					$rgbBlur = ImageColorAt($imgBlur, $x, $y);

					$rBlur = (($rgbBlur >> 16) & 0xFF);
					$gBlur = (($rgbBlur >> 8) & 0xFF);
					$bBlur = ($rgbBlur & 0xFF);

					$rNew = ($amount * ($rOrig - $rBlur)) + $rOrig;
					if ($rNew > 255)
					{
						$rNew = 255;
					}
					elseif ($rNew < 0)
					{
						$rNew = 0;
					}

					$gNew = ($amount * ($gOrig - $gBlur)) + $gOrig;
					if ($gNew > 255)
					{
						$gNew = 255;
					}
					elseif ($gNew < 0)
					{
						$gNew = 0;
					}

					$bNew = ($amount * ($bOrig - $bBlur)) + $bOrig;
					if ($bNew > 255)
					{
						$bNew = 255;
					}
					elseif ($bNew < 0)
					{
						$bNew = 0;
					}

					$rgbNew = ($rNew << 16) + ($gNew << 8) + $bNew;
					ImageSetPixel($this->_gd_resulting_image, $x, $y, $rgbNew);
				}
			}
		}
		imagedestroy($imgCanvas);
		imagedestroy($imgBlur);

		return true;
	}
}

class vB_AdvancedProfilePhoto_Store extends vB_AdvancedProfilePhoto {

    /**
     * Generate avatar and store it using VB data manager
     *
     * @param array $userid
     * @param int $avatarrevision
     * @param int $sel_width
     * @param int $sel_height
     * @param int $left
     * @param int $top
     */
    public function generate_avatar($userid, $avatarrevision, $sel_width, $sel_height, $left, $top)
    {
        global $vbulletin;

        // save avatar
        $datamanager =& datamanager_init('Userpic_Avatar', $vbulletin, ERRTYPE_STANDARD, 'userpic');

        $datamanager->set('userid', $userid);
        $datamanager->set('dateline', TIMENOW);
        // gif is not an error, but hardcoded in vbulletin. This name is used only for db storage, real filename is given by DM
        $datamanager->set('filename', 'avatar' . $userinfo['userid'] . '.gif');

        if ($vbulletin->options['app_avatar_size'] < $this->_src_width OR $vbulletin->options['app_avatar_size'] < $this->_src_height)
        {
            $this->img_crop_resize_from_src($vbulletin->options['app_avatar_size'], $vbulletin->options['app_avatar_size'], $left, $top, $sel_width, $sel_height);
        }
        $this->unshar_pmask();
        $this->round_corner($vbulletin->options['app_corners_radius']);

        $datamanager->set('width', $this->get_width());
        $datamanager->set('height', $this->get_height());
        $datamanager->setr('filedata', $this->get_img_binary());
        $datamanager->set_info('avatarrevision', $avatarrevision);

        if (!$datamanager->save())
        {
            eval(standard_error(fetch_error('app_save_failed')));
        }
        unset($datamanager);
    }

    /**
     * Generate profile picture and store it using VB data manager
     *
     * @param array $userid
     * @param int $profilepicrevision
     * @param int $sel_width
     * @param int $sel_height
     * @param int $left
     * @param int $top
     */
    public function generate_profilepic($userid, $profilepicrevision, $sel_width, $sel_height, $left, $top)
    {
        global $vbulletin;

        // save profile pic
        $datamanager =& datamanager_init('Userpic_Profilepic', $vbulletin, ERRTYPE_STANDARD, 'userpic');

        $datamanager->set('userid', $userid);
        $datamanager->set('dateline', TIMENOW);
        // gif is not an error, but hardcoded in vbulletin. This name is used only for db storage, real filename is given by DM
        $datamanager->set('filename', 'profilepic' . $userinfo['userid'] . '.gif');

        if ($vbulletin->options['app_profile_size'] < $this->_src_width OR $vbulletin->options['app_profile_size'] < $this->_src_height)
        {
            $this->img_crop_resize_from_src($vbulletin->options['app_profile_size'], $vbulletin->options['app_profile_size'], $left, $top, $sel_width, $sel_height);
        }

        $datamanager->set('width', $this->get_width());
        $datamanager->set('height', $this->get_height());
        $datamanager->setr('filedata', $this->get_img_binary());
        $datamanager->set_info('profilepicrevision', $profilepicrevision);

        if (!$datamanager->save())
        {
            eval(standard_error(fetch_error('app_save_failed')));
        }
        unset($upload);
    }

    /**
     * Store bigpic size and selection area. This is done here because we don't have bigpic data manager
     *
     * @param int $sel_width
     * @param int $sel_height
     * @param int $left
     * @param int $top
     * @param int $enablepreview enable/disable bigpic preview
     */
    public function generate_bigpicdata($width, $height, $left, $top, $enablepreview)
    {
        global $vbulletin;

        // save selection data to db
        $vbulletin->db->query_write("REPLACE INTO " . TABLE_PREFIX . "custombigpic
                                     SET `userid` = " . $vbulletin->userinfo['userid'] .", `top` = ".$top.", `left` = ".$left.", `dateline` = ".TIMENOW.",
                                         `sel_width`= ".$width.", `sel_height`= ".$height.",`width`= ".$this->_src_width.", `height`= ".$this->_src_height);

        // mark file as added in the user table
        $vbulletin->db->query_write("UPDATE " . TABLE_PREFIX . "user SET `isbigpicadded` = 1, `enablebigpicpreview` = ". $enablepreview ." WHERE userid = ". $vbulletin->userinfo['userid']);
    }
}

?>
