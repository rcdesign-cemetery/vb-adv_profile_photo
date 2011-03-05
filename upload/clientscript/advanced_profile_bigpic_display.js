/**                                                                                                                                  
 * iQuote: code for inserting selected text into quick-reply form
 */
var appBigpic = {

    /**
     * whether bigpic link active or not
     */
    is_bigpic_link_active: false,

    /**
     * bigpic link id
     */
    bigpic_link_id: 0,

    /**
     * YUI menu obj
     */
    context_menu: null,

    /**
     * Container for PostBit_Init function
     */
    pre_appbigpic_postbit_init: null,

    /**
     * Container for qr_newreply_activate function
     */
    pre_appbigpic_newreply_activate: null,

    /**
     * onload event handler
     *
     * @param string posts_container_id - ID of element which contains all posts
     */
    init: function(posts_container_id) {
        if ( !this.add_handlers() ) {
            return;
        }

        appBigpic.context_menu = new YAHOO.widget.Menu("app_bigpic_popup_menu",
                                                    {effect: {
                                                         effect: YAHOO.widget.ContainerEffect.FADE,
                                                         duration: 0.25
                                                     }
                                                    });
        appBigpic.context_menu.cfg.setProperty("zindex", 10100);
        // Fix for IE7 z-index bug
        if (YAHOO.env.ua.ie && YAHOO.env.ua.ie < 8)
        {
            appBigpic.context_menu.cfg.setProperty("position", "dynamic");
            appBigpic.context_menu.cfg.setProperty("iframe", true);
        }
        appBigpic.context_menu.render(document.body);
        YAHOO.util.Dom.setStyle(YAHOO.util.Dom.getElementsByClassName("popupbody", "*", fetch_object('app_bigpic_popup_menu')), "display", "block");

        // init for AJAX loaded posts (inline edit etc)
        this.pre_appbigpic_postbit_init = PostBit_Init;
        PostBit_Init = function (obj, post_id)
        {
            appBigpic.add_handlers(obj);

            appBigpic.pre_appbigpic_postbit_init(obj, post_id);
        }
    },

    /**
     * add handler on posts
     *
     * @param string posts_container - object fetched by posts_container_id
     */
    add_handlers: function() {
        if (!app_post_ids instanceof Array || app_post_ids.length < 1 || !app_pic_paths instanceof Array || app_pic_paths.length < 1)
        {
            return false;
        }

        for ( var i = 0; i < app_post_ids.length; i++ ) {
            var post = fetch_object('post_' + app_post_ids[i]);
            if (!post)
            {
                continue;
            }

            var avatar_link = YAHOO.util.Dom.getElementsByClassName("postuseravatar", "a", post);
            if (!avatar_link)
            {
                continue;
            }
            var bigpic_id = 'bigpic_link_' + i;
            // insert icon next to avatar link
            avatar_link[0].parentNode.insertBefore(string_to_node('<img id="' + bigpic_id + '" class="app_show_bigpic" src="./images/site_icons/search.png"/>'), avatar_link[0].nextSibling);
            YAHOO.util.Event.on(avatar_link[0], "mouseover", appBigpic.showBigpicLink, bigpic_id);
            // add inserted element as a parameter
            YAHOO.util.Event.on(avatar_link[0], "mouseout", setTimeout('appBigpic.removeBigpicLink()',500));
        }
        return true;
    },

    showBigpicLink: function(event, bigpic_link_id) {
        if (!appBigpic.is_bigpic_link_active)
        {
            var bigpic_link = fetch_object(bigpic_link_id);
            var index = parseInt(bigpic_link_id.replace('bigpic_link_',''));
            appBigpic.is_bigpic_link_active = true;
            bigpic_link.style.visibility = 'visible';
            appBigpic.bigpic_link_id = bigpic_link_id;
            YAHOO.util.Event.on(bigpic_link, "click", appBigpic.displayMenu, app_pic_paths[index]);
        }
    },

    removeBigpicLink: function() {
        if (appBigpic.bigpic_link_id)
        {
            var bigpic_link = fetch_object(appBigpic.bigpic_link_id);
            appBigpic.is_bigpic_link_active = false;
            appBigpic.bigpic_link_id = 0;
            bigpic_link.style.visibility = 'hidden';
            YAHOO.util.Event.removeListener(bigpic_link, "click", appBigpic.displayMenu);
        }
    },

    displayMenu: function(event, pic_path) {
        var img = fetch_object("app_bigpic_img");
        if (img && appBigpic.is_bigpic_link_active)
        {
            img.src = pic_path;

            var elem = event.srcElement? event.srcElement : event.target;
            // show menu
            var xy = YAHOO.util.Event.getXY(event);
            xy[0] = YAHOO.util.Dom.getX(elem) + elem.offsetWidth + 10;  // horizontal offset
            xy[1] = YAHOO.util.Dom.getY(elem); // vertical offset

            appBigpic.context_menu.cfg.setProperty("xy", xy);
            appBigpic.context_menu.show();
        }
    }
};
