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
/*
 *
 * UserManagement plugin
 * 
 * This plugin add authentication capabilities to maspshup
 * The authentication mechanism is based on OpenID protocol
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
         * Item structure :
         * {
         *      id: // identifier
         *      icon: // icon url,
         *      title: // Displayed title on mouse over
         *      callback: // function to execute on click
         * }
         */
        this.items = [
        {
            id:M.Util.getId(),
            icon:M.Util.getImgUrl("disconnect.png"),
            title:"Disconnect",
            callback:function(scope) {
                if (scope.userInfo) {
                    M.Util.askFor({
                        title:M.Util._("Sign out"),
                        content:M.Util._("Do you really want to sign out ?"),
                        dataType:"list", value:[{
                            title:M.Util._("Yes"), 
                            value:"y"
                        },
                        {
                            title:M.Util._("No"), 
                            value:"n"
                        }
                        ],
                        callback:function(v){
                            if (v === "y") {
                                scope.disconnect();
                            }
                        }
                    });
                }
            }
        },
        {
            id:M.Util.getId(),
            icon:M.Util.getImgUrl("save.png"),
            title:"Save context",
            callback:function(scope) {
                scope.storeContext();
            }
        }
        ];
        
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

            $.extend(self.options,{
                loginUrl:self.options.loginUrl || "/plugins/usermanagement/login.php",
                registerUrl:self.options.registerUrl || "/plugins/usermanagement/register.php",
                saveContextUrl:self.options.saveContextUrl || "/plugins/usermanagement/saveContext.php"
            });
            
            /*
             * The Sign In / Sign Up buttons and the user toolbar are stored within
             * the header bar under the 'userBar' CSS class
             */
            self.$d = $('.userBar', M.$header);
            
            /*
             * Create an empty UserManagement popup 
             * below the userBar
             */
             self.popup = new M.Popup({
                parent: $('#mwrapper'),
                modal: false,
                centered: false,
                noHeader: true,
                hideOnClose: true,
                addCloseButton:false,
                autoSize: true,
                unbounded: true
            });
        
            self.popup.$d.css({
                'top':self.$d.offset().top + $('#theBar').outerHeight() + 5,
                'right':$('#theBar .container').css('right'),
                'width':300
            });
            
            /*
             * Check for a connection cookie
             */
            userInfo = JSON.parse(M.Util.Cookie.get("userInfo"));
        
            if (userInfo) {
                self.signIn({
                    email:userInfo.email, 
                    sessionid:userInfo.sessionid
                });
            }
            else {
                self.displaySignInButton();
            }
            
            return this;
        };
        
        /*
         * Add action items to the userBar
         * 
         * This function should be called by plugins
         * that require additionnal item userBar
         * 
         * @param items : array of menu items
         * 
         * Item structure :
         * {
         *      id: // unique identifier
         *      icon: // icon url,
         *      title: // Displayed title on mouse over
         *      hasPopup: // true to show popup on click (default false)
         *      callback: // function to execute on click
         * }
         */
        this.add = function(items) {
            
            var i, j, update;
            
            if ($.isArray(items)) {
                
                /*
                 * Add new item if it is a new one or replace the old
                 * one by the new one if it already exist (based on unique id)
                 */
                for (i = items.length; i--;) {
                    
                    update = false;
                    
                    /*
                     * If item already exists, replace it by the new one 
                     */
                    for (j = this.items.length; j--;) {
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
                this.displayUserBar();
                
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
            for (var i = 0, l = this.items.length; i<l; i++) {
                
                /*
                 * Remove item with corresponding id
                 */
                if (this.items[i].id === id) {
                    
                    this.items.splice(i,1);
                    
                   /*
                    * Recompute user bar
                    */
                   this.displayUserBar();
                    
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
            for (var i = 0, l = this.items.length; i<l; i++) {
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
                    dataType:"json",
                    type:"POST",
                    url:M.Util.getAbsoluteUrl(self.options.saveContextUrl),
                    data:M.Util.abc+"&email=" + self.userInfo.email + "&sessionid=" + self.userInfo.sessionid + "&context=" + encodeURIComponent(JSON.stringify(M.Map.getContext())),
                    success: function(data){
                        M.Util.message(M.Util._("Context succesfully stored"));
                    },
                    error: function(msg) {
                        M.Util.message(M.Util._("Error : context cannot be stored"));
                    }
                },{
                    title:M.Util._("Store context"),
                    cancel:true
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
            self.displaySignInButton();
            
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
                dataType:"json",
                type:"POST",
                url:M.Util.getAbsoluteUrl(this.options.registerUrl),
                data:M.Util.abc+"&email=" + email + "&username=" + username,
                success: function(data){
                    if (data.error) {
                        M.Util.message(data.error["message"]);
                    }
                    else {
                        M.Util.message(M.Util._("A password has been sent to your mailbox"));
                    }
                },
                error: function(msg) {
                    M.Util.message(M.Util._("An error occured during password generation. Registering is currently disable"));
                }
            },{
                title:M.Util._("Register"),
                cancel:true
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
                dataType:"json",
                type:"POST",
                url:M.Util.getAbsoluteUrl(self.options.loginUrl),
                data:M.Util.abc+"&email=" + info.email + (info.password ? "&password=" + info.password : "&sessionid=" + info.sessionid),
                success: function(data){
                    
                    if (data.username) {

                        /*
                         * Set userInfo
                         */
                        self.userInfo = {
                            'userid':data.userid,
                            'username':data.username,
                            'email':data.email,
                            'icon':data.icon,
                            'sessionid':data.sessionid
                        };
                            
                        /*
                         * Load the user last context
                         */
                        if (data.context) {
                            M.Util.askFor({
                                title:M.Util._("Hello") + " " + data.username,
                                content:M.Util._("Do you want to restore your map context ?"),
                                dataType:"list",
                                value:[{
                                    title:M.Util._("Yes"), 
                                    value:"y"
                                },
                                {
                                    title:M.Util._("No"), 
                                    value:"n"
                                }
                                ],
                                callback:function(v){
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
                        if (self._p) {
                            self._p.remove();
                        }
                        
                        /*
                         * Display user bar
                         */
                        self.displayUserBar();
                        
                        /*
                         * Trigger a signin event
                         */
                        M.events.trigger("signin", self);
                        
                    }
                    else {
                        
                        if (!info.sessionid) {
                            M.Util.message(M.Util._("Wrong login/password - Connection refused"));
                        }
                        
                        /*
                         * Display Sign in / Sign up button
                         */
                        self.displaySignInButton();
                        
                    }
                },
                error: function(msg) {
                    
                    if (!info.sessionid) {
                        M.Util.message(M.Util._("Wrong login/password - Connection refused"));
                    }
                    
                    /*
                     * Display Sign in / Sign up button
                     */
                    self.displaySignInButton();
                        
                }
            }, !info.sessionid ? {
                title:M.Util._("Login")
            } : null);
            
            return true;
        };

        /*
         * Display user toolbar
         */
        this.displayUserBar = function() {
            
            var i, self = this;
            
            if (!self.userInfo) {
                return false;
            }
            
            /*
             * Create Toolbar
             */
            self.$d.empty();
            self.tb = new M.Toolbar({
                parent:self.$d, 
                classes:'umgmt'
            });
            
            /*
             * Profile
             */
            self.tb.add({
                id:M.Util.getId(),
                icon:self.userInfo.icon,
                tt:"Open profile",
                activable:false,
                switchable:false,
                callback:function() {
                    alert("TODO : profile manager for " + self.userInfo.username);
                }
            });
            
            /*
             * Items are displayed from right to left regarding the store order
             * (i.e. first item is displayed on the right, then next item is displayed
             *  at the left of the previous one, and so on)
             */
            for (i = self.items.length; i--;) {
                (function(item, scope) {
                    
                    if ($.isFunction(item.callback)) {
                
                        scope.tb.add({
                            id:item.id,
                            icon:item.icon,
                            tt:item.title,
                            activable:false,
                            switchable:false,
                            callback:function() {
                                scope.showHidePopup(item.id);
                                item.callback(scope);
                            }
                        });
                    
                    }
                    
                })(self.items[i], self);
            }
            
            return true;
            
        };
        
        /*
         * Display user toolbar
         */
        this.displaySignInButton = function() {
            
            var self = this,
            sinid = M.Util.getId(),
            supid = M.Util.getId();
            
            /*
             * Add Sign in and Sign up button
             */
            self.$d.html('<a href="#" class="button inline signin" id="'+sinid+'">'+M.Util._("Sign in")+'</a> &nbsp; <a href="#" class="button inline signup" id="'+supid+'">'+M.Util._("Sign up")+'</a></div>');
            
            /*
             * Sign In popup
             */
            $('#'+sinid).click(function(){
                
                var id = M.Util.getId();
                
                if (self._p) {
                    self._p.remove();
                }
                
                /*
                 * Create the Sign In popup
                 */
                self._p = new M.Popup({
                    modal:true,
                    noHeader:true,
                    onClose:function(){
                        self._p = null;
                    },
                    header:'<p>' + M.Util._["Sign in"] + '</p>',
                    body:'<form action="#" method="post" class="loginPanel"><input id="userEmail" type="text" placeholder="'+M.Util._("Email")+'"/><br/><input id="userPassword" type="password" placeholder="'+M.Util._("Password")+'"/><div class="signin"><a href="#" class="button inline colored" id="'+id+'">'+M.Util._("Sign in")+'</a> <input name="rememberme" id="rememberMe" type="checkbox" checked="checked"/>&nbsp;'+M.Util._("Remember me")+'</div></form>'
                });
                
                /*
                 * Login button
                 */
                $('#'+id).click(function(){
                    self.signIn({
                        email:$('#userEmail').val(), 
                        password:$('#userPassword').val()
                    });
                    
                    return false;
                });

                self._p.show();
                
            });
            
            
            /*
             * Sign Up popup
             */
            $('#'+supid).click(function(){
                
                var id = M.Util.getId();
                
                if (self._p) {
                    self._p.remove();
                }
                
                /*
                 * Create the Sign Up popup
                 */
                self._p = new M.Popup({
                    modal:true,
                    noHeader:true,
                    onClose:function(){
                        self._p = null;
                    },
                    header:'<p>' + M.Util._["Sign up"] + '</p>',
                    body:'<form action="#" method="post" class="loginPanel"><input id="userEmail" type="text" placeholder="'+M.Util._("Email")+'"/><br/><input id="userName" type="text" placeholder="'+M.Util._("Username")+'"/><div class="signin"><a href="#" class="button inline colored" id="'+id+'">'+M.Util._("Sign up")+'</a></div></form>'
                });
                
                /** 
                 * Register button
                 */
                $('#'+id).click(function(){
                    self.register($('#userEmail').val(), $('#userName').val());
                    return false;
                });
            
                self._p.show();
            });
            
            
            return true;
            
        };
    
        /**
         * Show or hide UserManagement popup
         * 
         * @param {String} id : item id
         */
        this.showHidePopup = function(id) {
            
            var item = this.get(id);
            
            if (!item) {
                return;
            }
        
            /*
             * _activeItem is the last clicked item
             */
            if (this._activeItem && this._activeItem.id === item.id) {
                if (this.popup.$d.is(':visible')) {
                    return this.popup.hide(true);
                }
            }
            
            /*
             * Set the new active item
             */
            this._activeItem = item;
            
            return item.hasPopup ? this.popup.show() : this.popup.hide();
        
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