

var pictureManager = {

    pm_timer_id:null,
    crop:null,
    img_width:0,
    img_height:0,
    sel_top:0,
    sel_left:0,
    sel_width:0,
    sel_height:0,
    min_sel_length:0,
    is_save_locked:true,

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
        pictureManager.initData();
    },

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
                    var string_node = result.responseXML.getElementsByTagName('image_html');
                    if (string_node.length)
                    {
                        var edit_result = string_to_node(string_node[0].firstChild.nodeValue);
                        var form_object = fetch_object('app_main_wrapper');
                        form_object.parentNode.replaceChild(edit_result, form_object);
                    }

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
                    pictureManager.initData();
                }
            }
        }
    },

    initData: function() {
        APP_CenterImage(this.img_width);

        var is_sel_editable = true;
        var avatar_result_wrapper = fetch_object('app_avatar_result_wrapper');
        var img_crop = fetch_object('avatar_img_crop');
        if (this.min_sel_length >= this.img_width || this.min_sel_length >= this.img_height)
        {
            is_sel_editable = false;
            avatar_result_wrapper.style.width = this.img_width + 'px';
            img_crop.style.width = this.img_width + 'px';
            img_crop.style.height = this.img_height + 'px';
        }

        if (this.img_height < avatar_result_wrapper.offsetHeight)
        {
            var clear_div = fetch_object('app_clear_div');
            clear_div.style.height = this.min_sel_length + 'px';
        }

        this.initSelection(is_sel_editable);
        var image = fetch_object('avatar_img');
        this.crop._wrap.style.backgroundImage = "url(" + image.src + ")";
        this.setBackgroundPositition(this.crop._wrap.style.left, this.crop._wrap.style.top);
    },

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

        this.crop = new YAHOO.util.Resize('app_resize', {
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
        this.crop.getWrapEl().style.top = this.sel_top + 'px';
        this.crop.getWrapEl().style.left = this.sel_left + 'px';

        this.crop.on('endResize', function() {
            clearTimeout(pictureManager.pm_timer_id);
            pictureManager.setConstraints();
            pictureManager.pm_timer_id = setTimeout('pictureManager.sendRequest()',500);
        });

        this.crop.on('resize', function() {
            pictureManager.setConstraints();
        });

        this.crop.on('dragEvent', function() {
            clearTimeout(pictureManager.pm_timer_id);
            pictureManager.setConstraints();
            pictureManager.pm_timer_id = setTimeout('pictureManager.sendRequest()',500);
        });

        if (is_sel_editable)
        {
            this.sendRequest();
        }
        else
        {
            this.is_save_locked = false;
            fetch_object('app_chkbox_1').disabled = '';
            this.crop.lock();
        }
    },

    setBackgroundPositition: function(left, top) {
        pictureManager.crop._wrap.style.backgroundPosition = "-" + left + " -" + top;
    },

    getCoords: function() {
        var resize = this.crop.getWrapEl().style;
        var left = parseInt(resize.left.replace('px',''));
        var top = parseInt(resize.top.replace('px',''));
        var width = parseInt(resize.width.replace('px',''));
        var height = parseInt(resize.height.replace('px',''));

        return {left: left,
                top: top,
                width: width,
                height: height};
    },

    sendRequest: function() {
        clearTimeout(pictureManager.pm_timer_id);
        var coords = pictureManager.getCoords();

        var results = fetch_object('avatar_img_crop');
        results.src = "app_preview.php?do=crop_avatar" + "&securitytoken=" + SECURITYTOKEN + "&rnd=" + Math.random() +
                      "&top=" + coords.top + "&left=" + coords.left + "&height=" + coords.height + "&width=" + coords.width;
    },

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

    setConstraints: function() {
        if (this.is_save_locked)
        {
            this.is_save_locked = false;
            fetch_object('app_chkbox_1').disabled = '';
        }

        var resize = this.getCoords();

        if (resize.left < 0)
        {
           this.crop.getWrapEl().style.left = '0px';
        }

        if (resize.top < 0)
        {
           this.crop.getWrapEl().style.top = '0px';
        }

        if (resize.left + resize.width > this.img_width)
        {
           this.crop.getWrapEl().style.left = (this.img_width - resize.width) + 'px';
        }

        if (resize.top + resize.height > this.img_height)
        {
           this.crop.getWrapEl().style.top = (this.img_height - resize.height) + 'px';
        }

        this.setBackgroundPositition(this.crop.getWrapEl().style.left, this.crop.getWrapEl().style.top);
    }
};

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

function APP_DeletePicture()
{
    var pseudoform = new vB_Hidden_Form('profile.php');
    pseudoform.add_variable('do', 'updateprofilepic');
    pseudoform.add_variable('s', fetch_sessionhash());
    pseudoform.add_variable('securitytoken', SECURITYTOKEN);
    pseudoform.add_variable('deleteprofilepic', 1);
    pseudoform.submit_form();
}

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

