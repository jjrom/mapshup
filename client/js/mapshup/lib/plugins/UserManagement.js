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

/**
 *
 * UserManagement plugin
 * 
 * This plugin add authentication capabilities to maspshup
 * The authentication mechanism is based on OpenID protocol
 *
 * @param {MapshupObject} M
 * 
 */
(function(M) {

    M.Plugins.UserManagement = function() {

        /*
         * Only one UserManagement object instance is created
         */
        if (M.Plugins.UserManagement._o) {
            return M.Plugins.UserManagement._o;
        }

        /**
         * If set then user is connectec, otherwise not
         * 
         * Structure of userInfo is :
         * 
         *  {
         *      'userid': // Unique user id
         *      'username': // User name
         *      'email': // Unique user email
         *      'icon': // Url to the user icon gravatar
         *      'sessionid': // Unique user current sessionid
         *  };
         * 
         */
        this.userInfo = null;

        /**
         * Userbar items array
         * 
         * See Toolbar.Item for items structure
         * 
         */
        this.items = [];

        /**
         * Initialize plugin
         *
         * This is MANDATORY
         * 
         * @param {Object} options
         * 
         */
        this.init = function(options) {

            var userInfo, self = this;

            /**
             * Best practice : init options
             */
            self.options = options || {};

            $.extend(self.options, {
                loginUrl: self.options.loginUrl || "/plugins/usermanagement/login.php",
                registerUrl: self.options.registerUrl || "/plugins/usermanagement/register.php",
                saveContextUrl: self.options.saveContextUrl || "/plugins/usermanagement/saveContext.php"
            });
            
            /*
             * Default profile items
             */
            this.items = [
                {
                    id: M.Util.getId(),
                    icon: M.Util.getImgUrl("disconnect.png"),
                    tt: "Disconnect",
                    onoff: false,
                    scope:self,
                    onactivate: function(scope, item) {
                        item.activate(false);
                        if (scope.userInfo) {
                            M.Util.askFor({
                                title: M.Util._("Sign out"),
                                content: M.Util._("Do you really want to sign out ?"),
                                dataType: "list", value: [{
                                        title: M.Util._("Yes"),
                                        value: "y"
                                    },
                                    {
                                        title: M.Util._("No"),
                                        value: "n"
                                    }
                                ],
                                callback: function(v) {
                                    if (v === "y") {
                                        scope.disconnect();
                                    }
                                }
                            });
                        }
                    }
                },
                {
                    id: M.Util.getId(),
                    icon: M.Util.getImgUrl("save.png"),
                    tt: "Save context",
                    onoff: false,
                    scope:self,
                    onactivate: function(scope, item) {
                        item.activate(false);
                        scope.storeContext();
                    }
                }
            ];
     
            /*
             * The Sign In / Sign Up buttons and the user toolbar are stored within
             * the header bar under the 'userBar' CSS class
             */
            self.$d = $('.userBar', M.$header);

            /*
             * Check for a connection cookie
             */
            userInfo = JSON.parse(M.Util.Cookie.get("userInfo"));

            if (userInfo) {
                self.signIn({
                    email: userInfo.email,
                    sessionid: userInfo.sessionid
                });
            }
            else {
                self.displayToolbar();
            }

            return this;
        };

        /*
         * Add action items to the userBar
         * 
         * This function should be called by plugins
         * that require additionnal item userBar
         * 
         * @param {Array} items : array of Toolbar.Item
         * 
         * Structure is defined in Toolbar.Item class
         * 
         */
        this.add = function(items) {

            var i, j, update;

            if ($.isArray(items)) {

                /*
                 * Add new item if it is a new one or replace the old
                 * one by the new one if it already exist (based on unique id)
                 */
                for (i = items.length; i--; ) {

                    update = false;

                    /*
                     * If item already exists, replace it by the new one 
                     */
                    for (j = this.items.length; j--; ) {
                        if (this.items[j].id === items[i].id) {
                            this.items[j] = items[i];
                            update = true;
                            break;
                        }
                    }

                    /*
                     * Add new item in userBar
                     */
                    if (!update) {
                        this.items.push(items[i]);
                    }
                }

                /*
                 * Recompute user bar
                 */
                this.displayToolbar();

                return true;

            }

            return false;

        };

        /*
         * Remove an item from the userBar
         * 
         * @param id : id of item to remove
         * 
         */
        this.remove = function(id) {

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++) {

                /*
                 * Remove item with corresponding id
                 */
                if (this.items[i].id === id) {

                    this.items.splice(i, 1);

                    /*
                     * Recompute user bar
                     */
                    this.displayToolbar();

                    return true;
                }
            }

            return false;

        };

        /*
         * Get a userBar item
         * 
         * @param id : id of item
         * 
         */
        this.get = function(id) {

            if (!id) {
                return null;
            }

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i].id === id) {
                    return this.items[i];
                }
            }

            return null;

        };

        /*
         * Store context within cookie
         * 
         * Note that a SYNCHRONOUS ajax call is sent to the server
         * to ensure that the browser or the window does not close
         * before the context is stored within the database
         * 
         */
        this.storeContext = function() {

            var self = this;

            if (self.userInfo) {
                M.Util.ajax({
                    dataType: "json",
                    type: "POST",
                    url: M.Util.getAbsoluteUrl(self.options.saveContextUrl),
                    data: M.Util.abc + "&email=" + self.userInfo.email + "&sessionid=" + self.userInfo.sessionid + "&context=" + encodeURIComponent(JSON.stringify(M.Map.getContext())),
                    success: function(data) {
                        M.Util.message(M.Util._("Context succesfully stored"));
                    },
                    error: function(msg) {
                        M.Util.message(M.Util._("Error : context cannot be stored"));
                    }
                }, {
                    title: M.Util._("Store context"),
                    cancel: true
                });

            }
        };

        /**
         * Disconnect user
         */
        this.disconnect = function() {

            var self = this;

            /*
             * Store context within cookie
             */
            self.storeContext();

            /*
             * Remove userInfo cookie
             */
            M.Util.Cookie.remove("userInfo");

            /*
             * Tell UserManagement that user is disconnected
             */
            self.userInfo = null;

            /*
             * Display the Sign in / Sign up bar
             */
            self.displayToolbar();

            /*
             * Trigger a signout event
             */
            M.events.trigger("signout", self);

        };

        /**
         * Register action.
         *
         * If register is successfull an email is sent to the given email adress
         * 
         * @param {String} email
         * @param {String} username
         * 
         */
        this.register = function(email, username) {
            
            var self = this;
            
            /*
             * Check if email is valid
             */
            if (!M.Util.isEmailAdress(email)) {
                M.Util.message(M.Util._("Please enter a valid email adress"));
                return false;
            }

            /*
             * Check if username is set
             */
            if (!username) {
                M.Util.message(M.Util._("Please enter a valid username"));
                return false;
            }

            /**
             * Register user
             */
            M.Util.ajax({
                dataType: "json",
                type: "POST",
                url: M.Util.getAbsoluteUrl(this.options.registerUrl),
                data: M.Util.abc + "&email=" + email + "&username=" + username,
                success: function(data) {
                    if (data.error) {
                        M.Util.message(data.error["message"]);
                    }
                    else {
                        M.Util.message(M.Util._("A password has been sent to your mailbox"));
                    }
                    self.getPopup().hide();
                },
                error: function(msg) {
                    M.Util.message(M.Util._("An error occured during password generation. Registering is currently disable"));
                    self.getPopup().hide();
                }
            }, {
                title: M.Util._("Register"),
                cancel: true
            });

            return true;
        };

        /**
         * Sign in action
         * 
         * @param info : info structure
         *      {
         *          email: // mandatory
         *          password: // password (not encrypted !) - only mandatory if sessionid is not set
         *          sessionid: // user current sessionid - only mandatory if password is not set
         *      }
         *      
         * Note : if both password and sessionid are given, the password is used
         */
        this.signIn = function(info) {

            var self = this;

            /*
             * Paranoid mode
             */
            info = info || {};

            if (!info.email || (!info.sessionid && !info.password)) {
                return false;
            }

            /*
             * Send an ajax login request
             */
            M.Util.ajax({
                dataType: "json",
                type: "POST",
                url: M.Util.getAbsoluteUrl(self.options.loginUrl),
                data: M.Util.abc + "&email=" + info.email + (info.password ? "&password=" + info.password : "&sessionid=" + info.sessionid),
                success: function(data) {

                    if (data.username) {

                        /*
                         * Set userInfo
                         */
                        self.userInfo = {
                            'userid': data.userid,
                            'username': data.username,
                            'email': data.email,
                            'icon': data.icon,
                            'sessionid': data.sessionid
                        };

                        /*
                         * Load the user last context
                         */
                        if (data.context) {
                            M.Util.askFor({
                                title: M.Util._("Hello") + " " + data.username,
                                content: M.Util._("Do you want to restore your map context ?"),
                                dataType: "list",
                                value: [{
                                        title: M.Util._("Yes"),
                                        value: "y"
                                    },
                                    {
                                        title: M.Util._("No"),
                                        value: "n"
                                    }
                                ],
                                callback: function(v) {
                                    if (v === "y") {
                                        M.Map.loadContext(data.context);
                                    }
                                }
                            });
                        }

                        /*
                         * If checkCookie or rememberMe is true, respawn
                         * a cookie for one year
                         */
                        if ($('#rememberMe').is(':checked')) {
                            M.Util.Cookie.set("userInfo", JSON.stringify(self.userInfo), 365);
                        }

                        /*
                         * Create a cookie for the remaining of the session
                         * (valid until you close the navigator)
                         */
                        else {
                            M.Util.Cookie.set("userInfo", JSON.stringify(self.userInfo));
                        }

                        /*
                         * Remove login popup
                         */
                        self.getPopup().hide();

                        /*
                         * Display user bar
                         */
                        self.displayToolbar();

                        /*
                         * Trigger a signin event
                         */
                        M.events.trigger("signin", self);

                    }
                    else {

                        if (!info.sessionid) {
                            M.Util.message(M.Util._("Wrong login/password - Connection refused"));
                        }

                    }
                },
                error: function(msg) {

                    if (!info.sessionid) {
                        M.Util.message(M.Util._("Wrong login/password - Connection refused"));
                    }

                }
            }, !info.sessionid ? {
                title: M.Util._("Login")
            } : null);

            return true;
        };

        /*
         * Display user toolbar
         */
        this.displayToolbar = function() {

            var i, self = this;

            /*
             * Set an empty Toolbar
             */
            if (!self.tb) {
                self.tb = new M.Toolbar({
                    parent: self.$d,
                    classes: 'bgm'
                });
            }
            self.tb.clear();

            /*
             * User is not signed in 
             * => display 'signin' and 'signout' actions
             */
            if (!self.userInfo) {

                self.tb.add({
                    id: M.Util.getId(),
                    tt: M.Util._("Sign in"),
                    title: M.Util._("Sign in"),
                    onoff: false,
                    scope:self,
                    /*
                     * Display signin popup
                     */
                    onactivate: function(scope, item) {

                        item.activate(false);

                        /*
                         * Set UserManagement popup content
                         */
                        var id = M.Util.getId(), p = scope.getPopup();
                        p.$h.html('<p>' + M.Util._("Sign in") + '</p>');
                        p.$b.html('<form action="#" method="post" class="loginPanel"><input id="userEmail" type="text" placeholder="' + M.Util._("Email") + '"/><br/><input id="userPassword" type="password" placeholder="' + M.Util._("Password") + '"/><div><a href="#" class="button inline colored" id="' + id + '">' + M.Util._("Sign in") + '</a> <input name="rememberme" id="rememberMe" type="checkbox" checked="checked" style="margin-left:20px;"/>&nbsp;' + M.Util._("Remember me") + '</div></form>');

                        /*
                         * Login button
                         */
                        $('#' + id).click(function() {
                            self.signIn({
                                email: $('#userEmail').val(),
                                password: $('#userPassword').val()
                            });

                            return false;
                        });

                        /*
                         * Show UserManagement popup
                         */
                        p.show();

                    },
                    /*
                     * Hide popup
                     */
                    ondeactivate: function(scope, item) {
                        scope.getPopup().hide();
                    }
                });

                self.tb.add({
                    id: M.Util.getId(),
                    tt: M.Util._("Sign up"),
                    title: M.Util._("Sign up"),
                    onoff: false,
                    scope:self,
                    /*
                     * Display signin popup
                     */
                    onactivate: function(scope, item) {

                        item.activate(false);

                        /*
                         * Set UserManagement popup content
                         */
                        var id = M.Util.getId(), p = scope.getPopup();
                        p.$h.html('<p>' + M.Util._("Sign up") + '</p>');
                        p.$b.html('<form action="#" method="post" class="loginPanel"><input id="userEmail" type="text" placeholder="' + M.Util._("Email") + '"/><br/><input id="userName" type="text" placeholder="' + M.Util._("Username") + '"/><div><a href="#" class="button inline colored" id="' + id + '">' + M.Util._("Sign up") + '</a>&nbsp;</div></form>');

                        /*
                         * Login button
                         */
                        $('#' + id).click(function() {
                            self.register($('#userEmail').val(), $('#userName').val());
                            return false;
                        });

                        /*
                         * Show UserManagement popup
                         */
                        p.show();

                    },
                    /*
                     * Hide popup
                     */
                    ondeactivate: function(scope, item) {
                        scope.getPopup().hide();
                    }
                });
            
                return true; 

            }
            /*
             * User is signed in 
             * => display user toolbar
             */
            else {
                self.tb.add({
                    id: M.Util.getId(),
                    icon: self.userInfo.icon,
                    tt: "Open profile",
                    onoff: false,
                    scope: self,
                    onactivate: function(scope, item) {
                        item.activate(false);
                        alert("TODO : profile manager for " + scope.userInfo.username);
                    }
                });
            }

            /*
             * Items are displayed from right to left regarding the store order
             * (i.e. first item is displayed on the right, then next item is displayed
             *  at the left of the previous one, and so on)
             */
            for (i = self.items.length; i--; ) {
                self.tb.add(self.items[i]);
                /*
                 (function(item, scope) {
                 scope.tb.add({
                 id: item.id,
                 icon: item.icon,
                 title: item.title,
                 tt: item.title,
                 onoff: M.Util.getPropertyValue(item, "onoff", true),
                 scope:item.scope || self,
                 onactivate: item.onactivate,
                 ondeactivate: item.ondeactivate
                 });
                 })(items[i], self);
                 */
            }

            return true;

        };

        /**
         * Return shared UserManagement popup
         */
        this.getPopup = function() {
            
            var self = this;
            
            /*
             * Create an empty UserManagement popup 
             * below the userBar
             */
            if (!self._popup) {
                self._popup = new M.Popup({
                    parent: $('#mwrapper'),
                    modal: false,
                    centered: false,
                    noHeader: false,
                    hideOnClose: false,
                    addCloseButton: false,
                    onclose:function() {
                        self._popup = null;
                    },
                    autoSize: true,
                    unbounded: true
                });

                self._popup.$d.css({
                    'top': this.$d.offset().top + $('#theBar').outerHeight() + 5,
                    'right': $('#theBar .container').css('right'),
                    'width': 300
                });
            }

            return self._popup;

        };

        /**
         * Open authentication popup window
         * TODO
         */
        this.openLoginWindow = function(openid) {

            /*
             * Use google by default
             */
            //openid = openid || "https://www.google.com/accounts/o8/id";
            //var w = window.open('http://localhost/Msrv/login.php?action=verify&openid_identity='+encodeURIComponent(openid), 'openid_popup', 'width=450,height=500,location=1,status=1,resizable=yes');

        };

        /*
         * Set unique instance
         */
        M.Plugins.UserManagement._o = this;

        return this;

    };

})(window.M);