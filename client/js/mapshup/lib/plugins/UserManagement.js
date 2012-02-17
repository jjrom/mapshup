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
(function(msp) {
    
    msp.Plugins.UserManagement = function() {
        
        /*
         * Only one UserManagement object instance is created
         */
        if (msp.Plugins.UserManagement._o) {
            return msp.Plugins.UserManagement._o;
        }
        
        /**
         * True if user is connected (i.e. authenticated)
         * False in other cases
         */
        this.isConnected = false;

        /**
         * Initialize plugin
         *
         * This is MANDATORY
         */
        this.init = function(options) {

            var id = msp.Util.getId(),
                rid = msp.Util.getId(),
                sid = msp.Util.getId(),
                self = this;
            
            /**
             * Best practice : init options
             */
            self.options = options || {};

            $.extend(self.options,{
                loginUrl:self.options.loginUrl || "/plugins/usermanagement/login.php",
                registerUrl:self.options.registerUrl || "/plugins/usermanagement/register.php"
            });
            
            /*
             * Set login and logout text
             */
            self.t = {
                signin:msp.Util._("Sign in"),
                signout:msp.Util._("Sign out"),
                notlogged:msp.Util._("You are not logged in")
            };
            
            msp.$header.append('<div class="login"><span class="ht">'+self.t["notlogged"]+'</span> <a href="#" class="button inline colored" id="'+id+'"><span class="hb">'+self.t["signin"]+'</span></a></div>');
            $('#'+id).click(function(){
                
                /*
                 * User is connected ? Ask for disconnection
                 */
                if (self.isConnected) {
                    msp.Util.askFor(self.t["signout"], msp.Util._("Do you really want to sign out ?"), "list", [{
                        title:msp.Util._("Yes"), 
                        value:"y"
                    },
                    {
                        title:msp.Util._("No"), 
                        value:"n"
                    }
                    ], function(v){
                        if (v === "y") {
                            self.disconnect();
                        }
                    });
                }
                /*
                 * Show connection popup
                 */
                else {
                    self.popup.show();
                    $('#userName').focus();
                }
            });
            
            /*
             * Create login popup
             */
            self.popup = new msp.Popup({
                modal:true,
                noHeader:true,
                hideOnClose:true,
                header:'<p>' + self.t["signin"] + '</p>',
                body:'<form action="#" method="post" class="loginPanel" id="'+id+'"></form>'
            });
            
            /*
             * Set popup content
             */
            $('form', self.popup.$b).html('<label>'+msp.Util._("Enter your email")+'<br/><input id="userName" type="text"/></label><br/><label>'+msp.Util._("Enter your password")+'<br/><input id="userPassword" type="password"/></label><div class="signin"><a href="#" class="button inline colored" id="'+sid+'">'+msp.Util._("Sign in")+'</a> <input name="rememberme" id="rememberMe" type="checkbox" checked="checked"/>&nbsp;'+msp.Util._("Remember me")+'</div><div class="register">'+msp.Util._("No account yet ?")+'&nbsp;<a href="#" id="'+rid+'">'+msp.Util._("Register")+'</a></div>');
            
            /*
             * Login button
             */
            $('#'+sid).click(function(){
                self.signIn($('#userName').val(), $('#userPassword').val(), false);
                return false;
            });

            /**
             * Register button
             */
            $('#'+rid).click(function(){
                self.register($('#userName').val());
                return false;
            });
            
            /**
             * Check for a connection cookie
             */
            self.signIn(msp.Util.Cookie.get("username"),msp.Util.Cookie.get("password"),true);

            return this;
        };

        /**
         * Disconnect user
         */
        this.disconnect = function() {
            
            var userid = msp.Util.Cookie.get("userid"),
                self = this;
            
            /*
             * Save context
             */
            if (userid && userid !== -1) {
                msp.Util.Cookie.set("context", msp.Map.getContext(), 365);
            }
            
            /*
             * Remove connection cookies
             */
            msp.Util.Cookie.remove("username");
            msp.Util.Cookie.remove("password");
            msp.Util.Cookie.remove("userid");
            
            /*
             * Tell user that he is disconnected
             */
             $('.ht', msp.$header).html(self.t["notlogged"]);
             $('.hb', msp.$header).html(self.t["signin"]);
             
             self.isConnected = false;
                        
        };

        /**
         * Register action.
         *
         * If register is successfull an email is sent to the given email adress
         */
        this.register = function(email) {

            /*
             * First check if email is valid
             */
            if (!msp.Util.isEmailAdress(email)) {
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
                url:msp.Util.getAbsoluteUrl(this.options.registerUrl),
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
        };

        /**
         * Sign in action
         */
        this.signIn = function(username,password,checkCookie) {

            var self = this,
            
                /*
                 * If checkCookie is true, the password is already
                 * encrypted
                 */
                encrypted = checkCookie ? "&encrypted=true" : "";

            /*
             * Send an ajax login request
             */
            msp.Util.ajax({
                dataType:"json",
                type:"POST",
                url:msp.Util.getAbsoluteUrl(self.options.loginUrl),
                data:msp.abc+"&username=" + username + "&password=" + password + encrypted,
                success: function(data){
                    
                    if (data.username) {

                        /*
                         * Tell user that he is connected
                         */
                        self.isConnected = true;
                        $('.ht', msp.$header).html(data.username);
                        $('.hb', msp.$header).html(self.t["signout"]);
                        
                        /*
                         * If checkCookie or rememberMe is true, respawn
                         * a cookie for one year
                         */
                        if (checkCookie || $('#rememberMe').is(':checked')) {
                            msp.Util.Cookie.set("username",data.username,365);
                            msp.Util.Cookie.set("password",data.password,365);
                            msp.Util.Cookie.set("userid",data.userid,365);
                        }

                        /*
                         * Create a cookie for the remaining of the session
                         * (valid until you close the navigator)
                         */
                        else {
                            msp.Util.Cookie.set("username",data.username);
                            msp.Util.Cookie.set("password",data.password);
                            msp.Util.Cookie.set("userid",data.userid);
                        }

                        /*
                         * Hide login popup
                         */
                        self.popup.hide();
                        
                        /*
                         * Load the user last context
                         */
                        if (msp.Util.Cookie.get("context")) {
                            msp.Util.askFor(msp.Util._("Hello") + " " + data.username, msp.Util._("Do you want to restore your map context ?"), "list", [{
                                title:msp.Util._("Yes"), 
                                value:"y"
                            },
                            {
                                title:msp.Util._("No"), 
                                value:"n"
                            }
                            ], function(v){
                                if (v === "y") {
                                    msp.Map.loadContext(msp.Util.extractKVP(msp.Util.Cookie.get("context")));
                                }
                            });
                        }
                    }
                    else {

                        if (!checkCookie) {
                            msp.Util.message(msp.Util._("Wrong login/password - Connection refused"));
                        }
                        else {
                            self.disconnect();
                        }
                    }
                },
                error: function(msg) {
                    if (!checkCookie) {
                        msp.Util.message(msp.Util._("Wrong login/password - Connection refused"));
                    }
                    else {
                        self.disconnect();
                    }
                }
            }, !checkCookie ? {
                title:msp.Util._("Login")
            } : null);
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
            //var w = window.open('http://localhost/mspsrv/login.php?action=verify&openid_identity='+encodeURIComponent(openid), 'openid_popup', 'width=450,height=500,location=1,status=1,resizable=yes');
            
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.UserManagement._o = this;
        
        return this;
        
    };
})(window.msp);