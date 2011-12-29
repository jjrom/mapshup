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
 * PLUGIN: Context
 *
 * Context management
 *
 * WARNING : This plugin requires "Toolbar" plugin
 * to be loaded first
 *********************************************/
(function(msp) {
    
    msp.Plugins.Context = function() {
        
        /*
         * Only one Context object instance is created
         */
        if (msp.Plugins.Context._o) {
            return msp.Plugins.Context._o;
        }
        
        /**
         * Store the last serialized saved context
         */
        this.lastSerializedContext = "";

        /**
         * Store the last uid corresponding to he last saved context
         */
        this.lastUID = null;

        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var tb,
                pn,
                self = this;
            
            /*
             * Init options
             */
            self.options = options || {};

            /*
             * Set options
             * Default toolbar is North West Horizontal
             */
            $.extend(self.options, {
                share:self.options.share || true,
                saveContextServiceUrl:self.options.saveContextServiceUrl || "/plugins/logger/saveContext.php?",
                getContextsServiceUrl:self.options.getContextsServiceUrl || "/plugins/logger/getContexts.php?",
                position:self.options.position || 'nw',
                orientation:self.options.orientation || 'h'
            });

            /*
             * Register save action within Toolbar and store
             * the reference of the created <li> element
             * 
             * The 'save' button is displayed under a North West toolbar
             */
            self.sbtn = new msp.Button({
               tb:new msp.Toolbar(self.options.position, self.options.orientation),
               icon:"save.png",
               tt:"Save this context",
               callback:self.save,
               scope:self
            });
            
            /*
             * Register load action within Toolbar and store
             * the reference of the created <li> element
             * 
             * The 'load' button is displayed under a North East toolbar
             * and the result is displayed within an East panel
             */
            tb = new msp.Toolbar('ne', 'v');
            pn = new msp.Panel('e',{tb:tb});
            
            self.lbtn = new msp.Button({
               tb:tb,
               icon:"bookmark.png",
               tt:"Load a context",
               container:pn.add(), //  AddLayer plugin is displayed within an East msp.Panel
               activable:true,
               callback:self.load,
               scope:self
            });
            
            self.lbtn.container.$d.html('<div id="'+msp.Util.getId()+'" style="width:'+pn.getInnerDimension().w+'px;"><div class="header">'+msp.Util._("Contexts")+'</div><div class="body block expdbl"></div>');
            self.$d = $('.body', self.lbtn.container.$d);
            return self;

        };
        
        /*
         * Return the current redirectUrl for last saved context
         */
        this.getRedirectUrl = function() {
            return msp.Config["general"].indexUrl+"?uid="+this.lastUID;
        };

        /**
         * Save Context
         */
        this.save = function(scope) {

            /*
             * Get map extent
             */
            var projected = msp.Map.Util.p2d(msp.Map.map.getExtent().clone()),
                bbox = projected.left+","+projected.bottom+","+projected.right+","+projected.top,
                serializedContext = msp.Map.getContext(), // Get current context
                userid = msp.Util.Cookie.get("userid") || -1; // Get userid

            /*
             * Save context unless it was already saved
             */
            if (serializedContext !== scope.lastSerializedContext) {

                /*
                 * Save the context on the server
                 *
                 * Method POST is used to avoid "maximum length url" server error
                 * 
                 */
                msp.Util.ajax({
                    url:msp.Util.getAbsoluteUrl(scope.options.saveContextServiceUrl+msp.Util.abc),
                    async:true,
                    dataType:"json",
                    type:"POST",
                    data:{
                        userid:userid,
                        context:serializedContext,
                        bbox:bbox
                    },
                    success: function(data) {
                        if (data.error) {
                            msp.Util.message(data.error["message"]);
                        }
                        else {
                            scope.lastUID = data.result[0].uid;
                            scope.lastSerializedContext = serializedContext;

                            /*
                             * Prepare message
                             */
                            var content = msp.Util._("Map context successfully saved")+'<br/><span>' + data.result[0].utc + ' : ' + msp.Util._(data.result[0].location) +'</span>';

                            /*
                             * Sharing is enabled - display info message without closing it
                             */
                            if (scope.options.share) {
                                content += '<br/>'+msp.Util._("Share")+'&nbsp;<a class="email" href="#" title="'+msp.Util._("Share context by email")+'"><img class="middle" src="'+msp.Util.getImgUrl("email.png")+'"</a>';

                                /*
                                 * This only work if sharing is enabled
                                 */
                                $('a.email', msp.Util.message(content, -1)).click(function() {

                                    /*
                                     * Create url from the saved context
                                     */
                                    $(this).attr('href', 'mailto:?subject=[msp] '+ msp.Util._("Interesting map context")+'&body='+msp.Util._("Take a look at this map context ")+scope.getRedirectUrl());
                                    return true;
                                });
                            }
                            /*
                             * No sharing - just display info message
                             */
                            else {
                                msp.Util.message(content);
                            }

                        }

                    }
                },{
                    title:msp.Util._("Saving context"),
                    cancel:true
                });

            }
            else {
                msp.Util.message(msp.Util._("Map context successfully saved"));
            }

        };

        /**
         * Load Context
         */
        this.load = function(scope) {

            var userid = msp.Util.Cookie.get("userid") || -1;

            /*
             * Retrieve contexts
             */
            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(scope.options.getContextsServiceUrl)+"userid="+userid),
                async:true,
                dataType:"json",
                success: function(data) {

                    /*
                     * Parse result
                     */
                    if (data.error) {
                        msp.Util.message(data.error["message"]);
                    }
                    else {

                        /*
                         * Roll over retrieved contexts
                         * contexts[
                         *      {
                         *          context:
                         *          location:
                         *          utc:
                         *          uid:
                         *      },
                         *      ...
                         * ]
                         */
                        var i,
                            l,
                            id,
                            date,
                            time,
                            lastDate = "";

                        for (i = 0, l = data.contexts.length; i < l; i++) {

                            /*
                             * Generate unique id
                             */
                            id = msp.Util.getId();

                            /*
                             * Get the date (YYYY-MM-DD) and time (HH:MM) from utc time (10 first characters)
                             */
                            date = data.contexts[i].utc.substring(0,10);
                            time = data.contexts[i].utc.substring(10,16);

                            /*
                             * If the date differs from last stored date (i.e. lastDate)
                             * make it big to have a nice user interface
                             */
                            if (date !== lastDate) {
                                if (i !== 0) {
                                    scope.$d.append('<br/>');
                                }
                                scope.$d.append('<span class="big">'+date+'</span><br/>');
                                lastDate = date;
                            }
                            else {
                                scope.$d.append('<br/>');
                            }
                            id = msp.Util.getId();
                            scope.$d.append('&nbsp; <a href="#" id="'+id+'">'+time+' - '+msp.Util._(data.contexts[i].location)+'</a>');

                            /*
                             * Add link to load context
                             */
                            (function(scope, div, context, uid) {
                                div.click(function() {

                                    /*
                                     * Load the context
                                     */
                                    msp.Map.loadContext(msp.Util.extractKVP(context));

                                    /*
                                     * Set this new context as the last saved/load context
                                     */
                                    scope.lastSerializedContext = context;
                                    scope.lastUID = uid;

                                })
                            })(scope, $('#'+id), data.contexts[i].context, data.contexts[i].uid);
                        }
                    }

                }
            },{
                title:msp.Util._("Contexts retrieving"),
                cancel:true
            });

        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Context._o = this;
        
        return this;
        
    };
    
})(window.msp);
