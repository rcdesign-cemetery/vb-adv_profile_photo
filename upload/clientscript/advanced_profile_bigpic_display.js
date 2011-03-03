/**                                                                                                                                  
 * iQuote: code for inserting selected text into quick-reply form
 */
var appBigpic = {

    /**
     * selected text
     */
    selected_text: "",

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
            YAHOO.util.Event.on(avatar_link, "mouseover", appBigpic.displayMenu, app_pic_paths[i]);
        }
        return true;
    },

    displayMenu: function(event, pic_path) {
        var img = fetch_object("app_bigpic_img");
        if (img)
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
