/**                                                                                                                                  
 * appEditor: object to work with big profile pic - select regions, save it
 */
var appEditor = {

    /**
     * avatar preview timer
     */
    timer_id: null,
    timeout: 500,

    /**
     * selection object
     */
    selection: null,

    /**
     * source image dimensions
     */
    img_width: 0,
    img_height: 0,

    /**
     * selection data
     */
    sel_top: 0,
    sel_left: 0,
    sel_width: 0,
    sel_height: 0,
    min_sel_length: 0,

    /**
     * lock save button till user does something with selection
     */
    is_save_locked: true,

    /**
     * Object constructor. Called for all cases, except AJAX upload
     */
    initPicture: function() {
        // just exit if user has no photo
        if (!fetch_object('app_resize'))
        {
            return true;
        }

        appEditor.img_width = app_img_width;
        appEditor.img_height = app_img_height;
        appEditor.sel_top = app_sel_top;
        appEditor.sel_left = app_sel_left;
        appEditor.sel_width = app_sel_width;
        appEditor.sel_height = app_sel_height;
        appEditor.min_sel_length = app_min_length;
        appEditor.initEditor();
    },

    /**
     * Object constructor. Called for AJAX bigpic image upload case only
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
                        var node = '';
                        for(var i=0; i<string_node[0].childNodes.length; i++)
                        {
                            node += string_node[0].childNodes[i].nodeValue;
                        }
                        var edit_result = string_to_node(node);
                        var form_object = fetch_object('app_main_wrapper');
                        form_object.parentNode.replaceChild(edit_result, form_object);
                    }

                    // init new image params
                    string_node = result.responseXML.getElementsByTagName('width');
                    if (string_node.length)
                    {
                        appEditor.img_width = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('height');
                    if (string_node.length)
                    {
                        appEditor.img_height = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('top');
                    if (string_node.length)
                    {
                        appEditor.sel_top = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('left');
                    if (string_node.length)
                    {
                        appEditor.sel_left = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('sel_width');
                    if (string_node.length)
                    {
                        appEditor.sel_width = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('sel_height');
                    if (string_node.length)
                    {
                        appEditor.sel_height = parseInt(string_node[0].firstChild.nodeValue);
                    }

                    string_node = result.responseXML.getElementsByTagName('min_length');
                    if (string_node.length)
                    {
                        appEditor.min_sel_length = parseInt(string_node[0].firstChild.nodeValue);
                    }
                    appEditor.initEditor();
                }
            }
        }
    },

    /**
     * Inits editor
     */
    initEditor: function() {
        this.is_save_locked = true;
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
        this.setSelectionBGPosition(this.selection._wrap.style.left, this.selection._wrap.style.top);
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
            clearTimeout(appEditor.timer_id);
            appEditor.setConstraints();
            appEditor.timer_id = setTimeout('appEditor.requestPreview()',appEditor.timeout);
        });

        this.selection.on('resize', function() {
            clearTimeout(appEditor.timer_id);
            appEditor.setConstraints();
            appEditor.timer_id = setTimeout('appEditor.requestPreview()',appEditor.timeout);
        });

        this.selection.on('dragEvent', function() {
            clearTimeout(appEditor.timer_id);
            appEditor.setConstraints();
            appEditor.timer_id = setTimeout('appEditor.requestPreview()',appEditor.timeout);
        });

        // send the request to get avatar preview, based on selection data
        this.requestPreview();
        if (!is_sel_editable)
        {
            // unlock save button as selection is locked
            this.is_save_locked = false;
            fetch_object('app_chkbox_confirm_1').disabled = '';
            this.selection.lock();
        }
    },

    /**
     * Set bg position for selection
     * @param int left
     * @param int top
     */
    setSelectionBGPosition: function(left, top) {
        appEditor.selection._wrap.style.backgroundPosition = "-" + left + " -" + top;
    },

    /**
     * Get selection coords and width/height
     */
    getSelectionArea: function() {
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
    requestPreview: function() {
        clearTimeout(appEditor.timer_id);
        var selection = appEditor.getSelectionArea();

        var results = fetch_object('avatar_img_selection');
        results.src = "app_preview.php?do=make_preview" + "&securitytoken=" + SECURITYTOKEN + "&rnd=" + Math.random() +
                      "&top=" + selection.top + "&left=" + selection.left + "&height=" + selection.height + "&width=" + selection.width;
    },

    /**
     * Generate avatar/profilepic and save bigpic
     */
    savePicture: function() {
        var selection = appEditor.getSelectionArea();
        var allow_fullsize_preview = 0;
        if (fetch_object('app_chkbox_allow_fullsize').checked)
        {
            allow_fullsize_preview = 1;
        }
        var form = new vB_Hidden_Form('profile.php');
        form.add_variable('do', "save_picture");
        form.add_variable('s', fetch_sessionhash());
        form.add_variable('securitytoken', SECURITYTOKEN);
        form.add_variable('top', selection.top);
        form.add_variable('left', selection.left);
        form.add_variable('height', selection.height);
        form.add_variable('width', selection.width);
        form.add_variable("enablepreview", allow_fullsize_preview);
        form.submit_form();
    },

    /**
     * Prohibit selection from moving outside of bigpic area
     */
    setConstraints: function() {
        if (this.is_save_locked)
        {
            this.is_save_locked = false;
            fetch_object('app_chkbox_confirm_1').disabled = '';
        }

        var resize = this.getSelectionArea();

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

        this.setSelectionBGPosition(this.selection.getWrapEl().style.left, this.selection.getWrapEl().style.top);
    }
};

/**
 * Upload profile big picture
 */
function APP_Upload_File()
{
    var progress = fetch_object('app_progress');
    progress.style.display = '';
    var form_object = fetch_object('app_upload_form');
    YAHOO.util.Connect.setForm(form_object, true);
    var callback = {
        upload: function(o) {
          appEditor.initPictureFromAJAX(o);},
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

    if (context.id == 'app_chkbox_confirm_1')
    {
        var second_chkbox = fetch_object('app_chkbox_confirm_div_2');
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
    var form = new vB_Hidden_Form('profile.php');
    form.add_variable('do', 'updateprofilepic');
    form.add_variable('s', fetch_sessionhash());
    form.add_variable('securitytoken', SECURITYTOKEN);
    form.add_variable('deleteprofilepic', 1);
    form.submit_form();
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

