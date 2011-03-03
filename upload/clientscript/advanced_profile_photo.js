/**                                                                                                                                  
 * pictureManager: object to work with big profile pic - select regions, save it
 */
var pictureManager = {

    /**
     * avatar preview timer
     */
    pm_timer_id:null,

    /**
     * selection object
     */
    selection:null,

    /**
     * source image dimensions
     */
    img_width:0,
    img_height:0,

    /**
     * selection data
     */
    sel_top:0,
    sel_left:0,
    sel_width:0,
    sel_height:0,
    min_sel_length:0,

    /**
     * lock save button till user does something with selection
     */
    is_save_locked:true,

    /**
     * Object constructor. Called for all cases, except AJAX upload
     */
    initPicture: function() {
        // just exit if user has no photo
        if (!fetch_object('app_resize'))
        {
            return true;
        }

        pictureManager.img_width = app_img_width;
        pictureManager.img_height = app_img_height;
        pictureManager.sel_top = app_sel_top;
        pictureManager.sel_left = app_sel_left;
        pictureManager.sel_width = app_sel_width;
        pictureManager.sel_height = app_sel_height;
        pictureManager.min_sel_length = app_min_length;
        pictureManager.initEditor();
    },

    /**
     * Object constructor. Called for AJAX upload case only
     * @param xml result - AJAX responce
     */
    initPictureFromAJAX: function(result) {
        if (AJAX_Compatible)
        {
            if (result != null && result.responseXML)
            {
                // check for error first
                var error = result.responseXML.getElementsByTagName('error');
                if (error.length)
                {
                    alert(error[0].firstChild.nodeValue);
                    var progress = fetch_object('app_progress');
                    progress.style.display = 'none';
                }
                else
                {
                    // get new image html
                    var string_node = result.responseXML.getElementsByTagName('image_html');
                    if (string_node.length)
                    {
                        var edit_result = string_to_node(string_node[0].firstChild.nodeValue);
                        var form_object = fetch_object('app_main_wrapper');
                        form_object.parentNode.replaceChild(edit_result, form_object);
                    }

                    // init new image params
                    string_node = result.responseXML.getElementsByTagName('width');
                    if (string_node.length)
                    {
                        pictureManager.img_width = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('height');
                    if (string_node.length)
                    {
                        pictureManager.img_height = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('top');
                    if (string_node.length)
                    {
                        pictureManager.sel_top = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('left');
                    if (string_node.length)
                    {
                        pictureManager.sel_left = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('sel_width');
                    if (string_node.length)
                    {
                        pictureManager.sel_width = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('sel_height');
                    if (string_node.length)
                    {
                        pictureManager.sel_height = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('min_length');
                    if (string_node.length)
                    {
                        pictureManager.min_sel_length = parseInt(string_node[0].firstChild.nodeValue);
                    }
                    pictureManager.initEditor();
                }
            }
        }
    },

    /**
     * Inits editor
     */
    initEditor: function() {
        APP_CenterImage(this.img_width);

        var is_sel_editable = true;
        var avatar_result_wrapper = fetch_object('app_avatar_result_wrapper');
        var img_selection = fetch_object('avatar_img_selection');
        if (this.min_sel_length >= this.img_width || this.min_sel_length >= this.img_height)
        {
            is_sel_editable = false;
            avatar_result_wrapper.style.width = this.img_width + 'px';
            img_selection.style.width = this.img_width + 'px';
            img_selection.style.height = this.img_height + 'px';
        }

        if (this.img_height < avatar_result_wrapper.offsetHeight)
        {
            var clear_div = fetch_object('app_clear_div');
            clear_div.style.height = this.min_sel_length + 'px';
        }

        this.initSelection(is_sel_editable);
        var image = fetch_object('avatar_img');
        this.selection._wrap.style.backgroundImage = "url(" + image.src + ")";
        this.setBackgroundPositition(this.selection._wrap.style.left, this.selection._wrap.style.top);
    },

    /**
     * Inits selection
     * @param boolean is_sel_editable - selection is not editable for pictures smaller then min selection length
     */
    initSelection: function(is_sel_editable) {
        var min_width = this.min_sel_length;
        if (min_width > this.sel_width)
        {
            min_length = this.sel_width;
        }

        var min_height = this.min_sel_length;
        if (min_height > this.sel_height)
        {
            min_height = this.sel_height;
        }

        // init selection object
        this.selection = new YAHOO.util.Resize('app_resize', {
                keyTick: 50,
                shiftKeyTick: 10,
                minHeight: min_height,
                minWidth: min_width,
                maxWidth: this.img_width,
                maxHeight: this.img_height,
                ratio:true,
                status:false,
                draggable:true,
                handles: 'all',
                height: this.sel_height + 'px',
                width: this.sel_width + 'px'
            });
        // set selection position
        this.selection.getWrapEl().style.top = this.sel_top + 'px';
        this.selection.getWrapEl().style.left = this.sel_left + 'px';

        this.selection.on('endResize', function() {
            clearTimeout(pictureManager.pm_timer_id);
            pictureManager.setConstraints();
            pictureManager.pm_timer_id = setTimeout('pictureManager.sendRequest()',500);
        });

        this.selection.on('resize', function() {
            pictureManager.setConstraints();
        });

        this.selection.on('dragEvent', function() {
            clearTimeout(pictureManager.pm_timer_id);
            pictureManager.setConstraints();
            pictureManager.pm_timer_id = setTimeout('pictureManager.sendRequest()',500);
        });

        if (is_sel_editable)
        {
            // send the request to get avatar preview, based on selection data
            this.sendRequest();
        }
        else
        {
            // unlock save button as selection is locked
            this.is_save_locked = false;
            fetch_object('app_chkbox_1').disabled = '';
            this.selection.lock();
        }
    },

    /**
     * Set bg position for selection
     * @param int left
     * @param int top
     */
    setBackgroundPositition: function(left, top) {
        pictureManager.selection._wrap.style.backgroundPosition = "-" + left + " -" + top;
    },

    /**
     * Get selection coords and width/height
     */
    getCoords: function() {
        var resize = this.selection.getWrapEl().style;
        var left = parseInt(resize.left.replace('px',''));
        var top = parseInt(resize.top.replace('px',''));
        var width = parseInt(resize.width.replace('px',''));
        var height = parseInt(resize.height.replace('px',''));

        return {left: left,
                top: top,
                width: width,
                height: height};
    },

    /**
     * Send request for avatar preview
     */
    sendRequest: function() {
        clearTimeout(pictureManager.pm_timer_id);
        var coords = pictureManager.getCoords();

        var results = fetch_object('avatar_img_selection');
        results.src = "app_preview.php?do=make_preview" + "&securitytoken=" + SECURITYTOKEN + "&rnd=" + Math.random() +
                      "&top=" + coords.top + "&left=" + coords.left + "&height=" + coords.height + "&width=" + coords.width;
    },

    /**
     * Generate avatar/profilepic and save bigpic
     */
    savePicture: function() {
        var coords = pictureManager.getCoords();
        var pseudoform = new vB_Hidden_Form('profile.php');
        pseudoform.add_variable('do', "save_picture");
        pseudoform.add_variable('s', fetch_sessionhash());
        pseudoform.add_variable('securitytoken', SECURITYTOKEN);
        pseudoform.add_variable('top', coords.top);
        pseudoform.add_variable('left', coords.left);
        pseudoform.add_variable('height', coords.height);
        pseudoform.add_variable('width', coords.width);
        pseudoform.submit_form();
    },

    /**
     * Limit selection movement to picture area
     */
    setConstraints: function() {
        if (this.is_save_locked)
        {
            this.is_save_locked = false;
            fetch_object('app_chkbox_1').disabled = '';
        }

        var resize = this.getCoords();

        if (resize.left < 0)
        {
           this.selection.getWrapEl().style.left = '0px';
        }

        if (resize.top < 0)
        {
           this.selection.getWrapEl().style.top = '0px';
        }

        if (resize.left + resize.width > this.img_width)
        {
           this.selection.getWrapEl().style.left = (this.img_width - resize.width) + 'px';
        }

        if (resize.top + resize.height > this.img_height)
        {
           this.selection.getWrapEl().style.top = (this.img_height - resize.height) + 'px';
        }

        this.setBackgroundPositition(this.selection.getWrapEl().style.left, this.selection.getWrapEl().style.top);
    }
};

/**
 * Upload the picture
 */
function APP_Upload_File()
{
    var progress = fetch_object('app_progress');
    progress.style.display = '';
    var form_object = fetch_object('app_upload_form');
    YAHOO.util.Connect.setForm(form_object, true);
    var callback = {
        upload: function(o) {
          pictureManager.initPictureFromAJAX(o);},
        failure: vBulletin_AJAX_Error_Handler,
        timeout: vB_Default_Timeout
    };

    var connection = YAHOO.util.Connect.asyncRequest('POST', 'ajax.php', callback, 'do=upload_picture');
}

/**
 * Enables/disables checkboxes
 */
function APP_Toggle_Next(context)
{
    var visibility = 'hidden';
    if (context.checked == true)
    {
        visibility = '';
    }

    if (context.id == 'app_chkbox_1')
    {
        var second_chkbox = fetch_object('app_chkbox_div_2');
        second_chkbox.style.visibility = visibility;
    }

}

/**
 * Enables/disables save button
 */
function APP_Toggle_Button(context)
{
    var disabled = 'disabled';
    if (context.checked == true)
    {
        disabled = '';
    }

    var second_chkbox = fetch_object('app_save_button');
    second_chkbox.disabled = disabled;
}

/**
 * Deletes the picture
 */
function APP_DeletePicture()
{
    var pseudoform = new vB_Hidden_Form('profile.php');
    pseudoform.add_variable('do', 'updateprofilepic');
    pseudoform.add_variable('s', fetch_sessionhash());
    pseudoform.add_variable('securitytoken', SECURITYTOKEN);
    pseudoform.add_variable('deleteprofilepic', 1);
    pseudoform.submit_form();
}

/**
 * Centers image based on its width
 * @param int width
 */
function APP_CenterImage(width)
{
    var wrap = fetch_object('avatar_img_wrap');
    wrap.style.width = width + "px";
    wrap.style.marginLeft = "-" + Math.round(width/2) + "px";

    var buttons = fetch_object('control_buttons_wrap');
    var upload_link = fetch_object('app_avatarupload_link');
    var upload_input = fetch_object('avatarupload');
    upload_input.style.right = (buttons.offsetWidth - upload_link.offsetLeft - upload_link.offsetWidth) + 'px';
}

