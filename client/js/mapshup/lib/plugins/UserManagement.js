/*
 * mapshup - Webmapping made easy
 * http://mapshup.info
 *
 * Copyright Jérôme Gasperi, 2011.12.08
 *
 * jerome[dot]gasperi[at]gmail[dot]com
 *
 * This software is a computer program whose purpose is a webmapping application
 * to display and manipulate geographical data.
 *
 * This software is governed by the CeCILL-B license under French law and
 * abiding by the rules of distribution of free software.  You can  use,
 * modify and/ or redistribute the software under the terms of the CeCILL-B
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 *
 * As a counterpart to the access to the source code and  rights to copy,
 * modify and redistribute granted by the license, users are provided only
 * with a limited warranty  and the software's author,  the holder of the
 * economic rights,  and the successive licensors  have only  limited
 * liability.
 *
 * In this respect, the user's attention is drawn to the risks associated
 * with loading,  using,  modifying and/or developing or reproducing the
 * software by the user in light of its specific status of free software,
 * that may mean  that it is complicated to manipulate,  and  that  also
 * therefore means  that it is reserved for developers  and  experienced
 * professionals having in-depth computer knowledge. Users are therefore
 * encouraged to load and test the software's suitability as regards their
 * requirements in conditions enabling the security of their systems and/or
 * data to be ensured and,  more generally, to use and operate it in the
 * same conditions as regards security.
 *
 * The fact that you are presently reading this means that you have had
 * knowledge of the CeCILL-B license and that you accept its terms.
 */
/*********************************************
 * PLUGIN: UserManagement
 *
 * Add user management capability to msp
 *
 *********************************************/

msp.plugins["UserManagement"] = {

    registeredPlugins: [],
    
    /**
     * True if user is connected (i.e. authenticated)
     * False in other cases
     */
    isConnected:false,

    /**
     * Initialize plugin
     *
     * This is MANDATORY
     */
    init: function(options) {

        /**
         * Best practice : init options
         */
        this.options = options || {};
        
        $.extend(this.options,{
            loginUrl:this.options.loginUrl || "/plugins/usermanagement/login.php",
            registerUrl:this.options.registerUrl || "/plugins/usermanagement/register.php",
            title:this.options.title || 'Welcome on <a href="http://mapshup.info" target="_blank">mapshup</a>',
            description:this.options.description || '<h2>Why registering ?</h2><p>For the moment by registering to the application, you will have access to your navigation history and to a personnal context directory. Other services will be added later</p><h2>Is it free ?</h2><p>Absolutely !</p><h2>What about my personnal information ?</h2><p>The email adress is only used as a unique login key. We will never use it for anything else.</p>'
        });
        
        /*
         * Create the jUMPanel on top of Map
         * and populate it with content
         *
         * Structure :
         *      <div id="jUMPanel">
         *          <div class="jUMPanelMain" class="bg">
         *              <div class="content">
         *                  [...]
         *              </div>
         *          </div>
         *      </div>
         */
        msp.Util.$$('#jUMPanel').html('<div id="jUMPanelMain" class="bg"><div class="content"></div></div>');

        /*
         * Add login to jBar east
         */
        var idn = msp.Util.getId(),
        ida = msp.Util.getId(),
        scope = this;
        msp.jBar.add('<li id="' + idn + '" class="hover"></li><li>|</li><li id="' + ida + '" class="hover"></li>', 'ne');
        
        /*
         * Save reference to login div and to name div
         */
        this.nameDiv = $('#' + idn).click(function(e) {
            if (scope.isConnected) {
                msp.askFor(msp.Util._("Log out"), msp.Util._("Really want to log out"), "list", [{title:'Yes', value:'y'},{title:'No', value:'n'}], function(v){
                    if (v === 'y'){
                        scope.logOut();
                    }
                });    
            }
            else {
                scope.panel.show();
            }
        });
        this.actionDiv = $('#' + ida).click(function(){
            if (scope.panel.isHidden) {
                scope.panel.show();
            }
            else {
                scope.panel.hide();
            }
            if (!scope.isConnected) {
                $(this).hide()
            }
            return false;
        });
        
        /*
         * Compute Map3d size
         */
        msp.Map.events.register("resizeend", this, this.onResizeEnd);

        /**
         * Set position
         */
        this.onResizeEnd(this);

        /**
         * Check for a connection cookie
         */
        this.logIn(getCookie("username"),getCookie("password"),true);

        return true;
    },

    /**
     * Triggered when map size change
     */
    onResizeEnd: function(scope) {
        var jmap = $('#Map');
        $('#jUMPanel').css({
            'top': jmap.offset().top + $('#jNorthBar').height(),
            'left': jmap.offset().left,
            'width': jmap.width()
        });
    },

    /**
     * Login panel
     */
    panel:{

        isHidden: true,

        /**
         * Show the jUMPanel
         */
        show:function() {

            /**
             * Hide annoying things...
             */
            msp.menu.hide();
            $('.unique').hide();
            $('.hideOnTopSlide').hide();

            $('div#jUMPanelMain').slideDown();

            /**
             * Close button
             */
            msp.plugins["UserManagement"].actionDiv.text(msp.Util._("Close")).show();
            
            this.isHidden = false;

        },

        /**
         * Hide the jUMPanel
         */
        hide:function() {
            
            $('div#jUMPanelMain').slideUp();
            $('.hideOnTopSlide').show();

            msp.plugins["UserManagement"].actionDiv.text(msp.Util._("Actions"));
            
            this.isHidden = true;
        }

    },


    /**
     * Switch jUMPanel content
     * to "connected"
     */
    connected:function(username) {

        var scope = this,
        div = $('.jUMP', '#jBar').remove();
        
        /*
         * Clean content panel
         */
        $('.content', '#jUMPanelMain').empty();

        /**
         * Close
         * (hidden by default)
         */
        div.append('<li class="jUMP hiddenclose close hover">'+msp.Util._("Close")+'</li>');
        $('.close').click(function(){
            scope.panel.hide();
            return false;
        });

        /**
         * Log out
         */
        div.append('<li class="tb logout hover" title="'+msp.Util._("Log out")+"&nbsp;"+username+'">'+msp.Util._("Log out")+'</li>');
        $('.logout').click(function(){
            scope.logOut();
            return false;
        });

        /**
         * Load plugins
         */
        for (var key in scope.registeredPlugins) {
            var pluginDescriptor = scope.registeredPlugins[key];
            if (pluginDescriptor.plugin && !pluginDescriptor.isLoaded) {
                scope.add(pluginDescriptor);
            }
        }
        
    },

    /**
     * Switch jUMPanel content
     * to "not connected" - This is the default
     */
    notConnected:function() {

        var scope = this;
        
        /**
         * And the hidden panel content itself
         */
        $('.content', '#jUMPanelMain').html('<div class="left smaller"><h1>'+msp.Util._(this.options.title)+'</h1>'+this.options.description+'</div><div class="left">\
                    <form action="#" method="post" id="loginForm">\
                        <h1>'+msp.Util._("Log in")+'</h1>\
                        <label>'+msp.Util._("Email")+':</label><br/>\
                        <input type="text" name="log" id="userName" value="" size="23" /><br/>\
                        <label>'+msp.Util._("Password")+':</label><br/>\
                        <input type="password" name="pwd" id="userPassword" size="23" /><br/>\
                        '+msp.Util._("Remember me")+'&nbsp;<input name="rememberme" id="rememberMe" type="checkbox" checked="checked"/><br/>\
                        <input type="submit" name="submit" value="'+msp.Util._("Log in")+'" class="bt_login" />\
                    </form>\
                </div>\
                <div class="left">\
                    <form action="#" method="post" id="registerForm">\
                        <h1>'+msp.Util._("Register")+'</h1>\
                        <label>'+msp.Util._("Email")+':</label><br/>\
                        <input type="text" name="email" id="userEmail" size="23" /><br/>\
                        <i>'+msp.Util._("A password will be emailed to you")+'</i><br/>\
                        <input type="submit" name="submit" value="'+msp.Util._("Register")+'" class="bt_login" />\
                    </form>\
                </div>');
        
        /**
         * Add action listeners on login submit button
         */
        $('#loginForm').submit(function(){
            scope.logIn($('#userName').val(), $('#userPassword').val(), false);
            return false;
        });

        /**
         * Add action listeners on register submit button
         */
        $('#registerForm').submit(function(){
            scope.register($('#userEmail').val());
            return false;
        });

    },

    /**
     * LogIn action.
     *
     * If login is successfull, the jUMPanel panel
     * content is replaced with user information and a new set of
     * actions is added to the #jUMPanelTab element
     */
    logIn: function(username,password,checkCookie) {

        var scope = this,
        /**
             * If checkCookie is true, the password is already
             * encrypted
             */
        encrypted = checkCookie ? "&encrypted=true" : "";
        
        /*
         * By default we suppose that user is not logged
         */
        scope.actionDiv.hide();
        scope.nameDiv.text(msp.Util._("Anonymous"));
                    
        /*
         * Send an ajax login request
         */
        msp.Util.ajax({
            dataType:"json",
            type:"POST",
            url:msp.Util.getAbsoluteUrl(scope.options.loginUrl),
            data:msp.abc+"&username=" + username + "&password=" + password + encrypted,
            success: function(data){
                if (data.username) {

                    scope.isConnected = true;
                    
                    /**
                     * Switch jUMPanel to connected status
                     */
                    scope.connected(data.username);
                    
                    /**
                     * If checkCookie or rememberMe is true, respawn
                     * a cookie for one year
                     */
                    if (checkCookie || $('#rememberMe','#jUMPanel').is(':checked')) {
                        setCookie("username",data.username,365);
                        setCookie("password",data.password,365);
                        setCookie("userid",data.userid,365);
                    }

                    /**
                     * Create a cookie for the remaining of the session
                     * (valid until you close the navigator)
                     */
                    else {
                        setCookie("username",data.username);
                        setCookie("password",data.password);
                        setCookie("userid",data.userid);
                    }
                    
                    /*
                     * Set jbar values
                     */
                    scope.actionDiv.text(msp.Util._("Actions")).show();
                    scope.nameDiv.text(data.username);

                    /*
                     * Hide panel
                     */
                    scope.panel.hide();
                }
                else {
                    
                    if (!checkCookie) {
                        msp.Util.message(msp.Util._("Wrong login/password - Connection refused"));
                    }
                    else {
                        scope.notConnected();
                    }
                }
            },
            error: function(msg) {
                if (!checkCookie) {
                    msp.Util.message(msp.Util._("Wrong login/password - Connection refused"));
                }
                else {
                    scope.notConnected();
                }
            }
        }, !checkCookie ? {
            title:msp.Util._("Login")
        } : null);
    },

    /**
     * Logout action
     * On successfull logout, cookies are cleared and
     * jUMPanel panel is reset with
     * its default content
     */
    logOut:function() {
        
        deleteCookie("username");
        deleteCookie("password");
        deleteCookie("userid");
        
        this.notConnected();

        /**
         * Unload plugins
         */
        for (var i = 0, l = this.registeredPlugins.length; i < l;i++) {
            this.registeredPlugins[i].isLoaded = false;
        }

        /*
         * Trigger click on actionDiv
         */
        this.panel.hide();
        this.actionDiv.hide();
        this.nameDiv.text(msp.Util._("Anonymous"));
        
        this.isConnected = false;
    },

    /**
     * Register action.
     *
     * If register is successfull an email is sent to the given email adress
     */
    register: function(email) {
        
        var scope = this;

        /*
         * First check if email is valid
         */
        if (!msp.isEmailAdress(email)) {
            msp.Util.message(msp.Util._("Please enter a valid email adress"));
            return false;
        }
        
        /**
         * If checkCookie is true, the password is already
         * encrypted
         */
        msp.Util.ajax({
            dataType:"json",
            type:"POST",
            url:msp.Util.getAbsoluteUrl(scope.options.registerUrl),
            data:msp.abc+"&email=" + email,
            success: function(data){
                if (data.error) {
                    msp.Util.message(data.error["message"]);
                }
                else {
                    msp.Util.message(msp.Util._("A password has been sent to your mailbox"));
                }
            },
            error: function(msg) {
                msp.Util.message(msp.Util._("An error occured during password generation. Registering is currently disable"));
            }
        },{
            title:msp.Util._("Register"),
            cancel:true
        });

        return true;
    },

    /**
     * Add plugin to UserManagement
     * input obj :
     *      plugin:,
     *      title:,
     *      linkTitle:,
     *      linkImage:,
     *      [isLoaded:] (optional)
     */
    add: function(obj) {

        var scope = this;
        
        /**
         * Be sure that obj is initialized
         */
        obj = obj || {};
        if (typeof obj.isLoaded !== "boolean") {
            obj.isLoaded = false;
        }

        /**
         * If user is connected, directly add
         * the plugin. Else store it within the
         * registeredPlugins list with a isLoaded status
         * to false. In this case, it will be loaded when
         * user will be connected
         */
        if (this.isConnected && !obj.isLoaded) {
            var id = msp.Util.getId();
            $('li:last-child', '#jUMPanelTab ul').before('<li class="tb hover '+id+'" title="'+obj.linkTitle+'"><img class="middle" src="'+obj.linkImage+'"/>&nbsp;'+obj.title+'</li>');
            $('.'+id).click(function(){
                obj.plugin.getData($('#jUMPanelMain'));
                if (scope.panel.isHidden) {
                    $('.hiddenclose',$('#jUMPanelTab')).show();
                    scope.panel.show();
                }
                return false;
            });
            
            /**
             * obj isLoaded set to true avoid multiple load
             * of the object.
             */
            obj.isLoaded = true;
        }

        /**
         * If obj is already registered (i.e. added to the
         * registeredPlugins list), do nothing. Else add this
         * obj to the registeredPlugins List
         */
        if (!obj.isRegistered) {
            obj.isRegistered = true;
            this.registeredPlugins.push(obj);
        }
        
    }
};