/**                                                                                                                                  
 * appPopup: displays popup with big profile picture
 */
var appPopup = {

    /**
     * whether popup link active or not
     */
    is_popup_link_active: false,

    /**
     * popup link id
     */
    popup_link_id: 0,

    /**
     * popup link timer
     */
    popup_link_timer: null,

    /**
     * YUI menu obj
     */
    popup_menu: null,

    /**
     * Container for PostBit_Init function
     */
    old_postbit_init: null,

    /**
     * onload event handler
     */
    init: function() {
        // if popup menu is not there - exit
        if (!fetch_object("app_popup_menu"))
        {
            return;
        }

        if (!this.add_handlers(null)) {
            return;
        }

        appPopup.popup_menu = new YAHOO.widget.Menu("app_popup_menu",
                                                    {effect: {
                                                         effect: YAHOO.widget.ContainerEffect.FADE,
                                                         duration: 0.25
                                                     }
                                                    });
        appPopup.popup_menu.cfg.setProperty("zindex", 10100);
        // Fix for IE7 z-index bug
        if (YAHOO.env.ua.ie && YAHOO.env.ua.ie < 8)
        {
            appPopup.popup_menu.cfg.setProperty("position", "dynamic");
            appPopup.popup_menu.cfg.setProperty("iframe", true);
        }
        appPopup.popup_menu.render(document.body);
        YAHOO.util.Dom.setStyle(YAHOO.util.Dom.getElementsByClassName("popupbody", "*", fetch_object('app_popup_menu')), "display", "block");

        // init for AJAX loaded posts (inline edit etc)
        appPopup.old_postbit_init = PostBit_Init;
        PostBit_Init = function (obj, post_id)
        {
            appPopup.add_handlers(obj);

            appPopup.old_postbit_init(obj, post_id);
        }
    },

    /**
     * Add mouseover(display popup link)/mouseout handlers on avatars
     *
     * @param string posts_container - object fetched by posts_container_id
     */
    add_handlers: function(obj) {
        if (!(app_item_ids instanceof Array) || app_item_ids.length < 1 || !(app_pic_names instanceof Array) || app_pic_names.length < 1)
        {
            return false;
        }

        for ( var i = 0; i < app_item_ids.length; i++ ) {
            var post = fetch_object('post_' + app_item_ids[i]);
            if (!post)
            {
                continue;
            }

            var avatar_link = YAHOO.util.Dom.getElementsByClassName("postuseravatar", "a", post);
            if (!avatar_link)
            {
                continue;
            }
            var popup_id = 'popup_link_' + i;
            // insert icon next to avatar link
            avatar_link[0].parentNode.insertBefore(string_to_node('<img id="' + popup_id + '" class="app_popup_link" src="./images/site_icons/search.png"/>'), avatar_link[0].nextSibling);

            // hide popup link when mouse is out from both avatar and popup link
            YAHOO.util.Event.on(avatar_link[0], "mouseover", appPopup.showPopupLink, popup_id);
            YAHOO.util.Event.on(avatar_link[0].nextSibling, "mouseover", appPopup.stopPopupLinkTimer);
            // add inserted element as a parameter
            YAHOO.util.Event.on(avatar_link[0], "mouseout", appPopup.startPopupLinkTimer);
            YAHOO.util.Event.on(avatar_link[0].nextSibling, "mouseout", appPopup.startPopupLinkTimer);
        }
        return true;
    },

    /**
     * Start timer to hide popup link
     */
    startPopupLinkTimer: function() {
        clearTimeout(appPopup.popup_link_timer);
        appPopup.popup_link_timer = setTimeout('appPopup.hidePopupLink()',1000);
    },

    /**
     * Stop timer
     */
    stopPopupLinkTimer: function() {
        clearTimeout(appPopup.popup_link_timer);
    },

    /**
     * Start timer to hide popup link
     *
     * @param object event - event object
     * @param int popup_link_id - id of popup link currently displayed
     */
    showPopupLink: function(event, popup_link_id) {
        clearTimeout(appPopup.popup_link_timer);
        if (!appPopup.is_popup_link_active)
        {
            var popup_link = fetch_object(popup_link_id);
            var index = parseInt(popup_link_id.replace('popup_link_',''));
            appPopup.is_popup_link_active = true;
            popup_link.style.visibility = 'visible';
            appPopup.popup_link_id = popup_link_id;
            YAHOO.util.Event.on(popup_link, "click", appPopup.displayPopup, app_pic_path + app_pic_names[index]);
        }
    },

    /**
     * Hide popup link
     */
    hidePopupLink: function() {
        clearTimeout(appPopup.popup_link_timer);
        if (appPopup.popup_link_id)
        {
            var popup_link = fetch_object(appPopup.popup_link_id);
            appPopup.is_popup_link_active = false;
            appPopup.popup_link_id = 0;
            popup_link.style.visibility = 'hidden';
            YAHOO.util.Event.removeListener(popup_link, "click", appPopup.displayPopup);
        }
    },

    /**
     * Display popup dialog with big profile picture
     *
     * @param object event - event object
     * @param int pic_path - path to big pic to display
     */
    displayPopup: function(event, pic_path) {
        appPopup.hidePopupLink();
        var img = fetch_object("app_popup_img");
        img.src = pic_path;

        var elem = event.srcElement? event.srcElement : event.target;
        // show popup
        var xy = YAHOO.util.Event.getXY(event);
        xy[0] = YAHOO.util.Dom.getX(elem) + elem.offsetWidth + 10;  // horizontal offset
        xy[1] = YAHOO.util.Dom.getY(elem); // vertical offset

        // change Y pos in order we can see whole popup
        var screen_height = YAHOO.util.Dom.getDocumentScrollTop() + YAHOO.util.Dom.getViewportHeight();
        var popup_height = fetch_object('app_popup_inner_menu').offsetHeight;
        if (xy[1] + popup_height > screen_height)
        {
            xy[1] = screen_height - popup_height;
        }

        if (xy[1] < 0)
        {
            xy[1] = 0;
        }

        appPopup.popup_menu.cfg.setProperty('xy', xy);
        appPopup.popup_menu.show();
    }
};
