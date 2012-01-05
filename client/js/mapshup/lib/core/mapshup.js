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
 * Includes parts of code under the following licenses:
 *
 *
 * --- json2.js by Douglas Crockford
 * --- https://github.com/douglascrockford/JSON-js/blob/master/json2.js
 * --- Release under Public Domain
 *
 *
 * --- Checksum function
 * --- (c) 2006 Andrea Ercolino
 * --- http://noteslog.com/post/crc32-for-javascript/
 * --- Released under the MIT License
 * --- http://www.opensource.org/licenses/mit-license.php
 *
 *
 * --- Sliding Panel from Jeremie Tisseau
 * --- http://web-kreation.com/index.php/tutorials/nice-clean-sliding-login-panel-built-with-jquery
 * --- The CSS, XHTML and design released under Creative Common License 3.0
 * --- http://creativecommons.org/licenses/by-sa/3.0/
 *
 */

/*
 * Uses icons under the following licenses :
 *
 * --- GeoSilk icon set by Rolando Peate
 * --- http://projects.opengeo.org/geosilk
 * --- Released under Creative Commons Attribution 3.0 License.
 * --- http://creativecommons.org/licenses/by/3.0/)
 *
 *
 * --- Iconic icon set
 * --- http://somerandomdude.com/projects/iconic/
 * --- Release under Creative Commons Attribution-Share Alike 3.0 license
 * --- http://creativecommons.org/licenses/by-sa/3.0/us/
 * 
 */

/*
 * Uses libraries under the following licences
 *
 * --- OpenLayers.js -- OpenLayers Map Viewer Library
 * --- Copyright 2005-2010 OpenLayers Contributors
 * --- Released under the Clear BSD license
 * --- http://svn.openlayers.org/trunk/openlayers/license.txt
 *
 *
 * --- jQuery JavaScript Library v1.4.4
 * --- http://jquery.com/
 * ---
 * --- Copyright 2010, John Resig
 * --- Released under the MIT license.
 * --- http://jquery.org/license
 *
 *
 * --- jqPlot
 * --- Copyright (c) 2009 - 2010 Chris Leonello
 * --- Released under the MIT license
 * --- http://www.opensource.org/licenses/mit-license.php
 *
 */

/**
 * mapshup.js : mapshup core library
 *
 * @requires js/mapshup/lang/en.js
 * @requires js/mapshup/config/default.js
 *
 *
 * Tips and tricks :
 *
 *  - $('.hideOnTopSlide').hide()
 *      => to hide all divs that should be hidden when a top div slides
 *
 *  - z-indexes :
 *      map                         :   1 (or something like that :)
 *      OpenLayers objects          :   2 to something << 10000
 *      coords                      :   10000
 *      hiliteFeature               :   10000
 *      msplogo                     :   10000
 *      menu                        :   10000
 *
 *      whereami                    :   10100   (plugins/Geonames.js)
 *      featureinfo                 :   10150
 *      distance                    :   10150   (plugins/Distance.js)
 *      map3d                       :   10200   (plugins/Toolbar_GoogleEarth.js)
 *      drawinginfo                 :   10300   (plugins/Drawing.js)
 *      jUserManagementPanel        :   10700   (plugins/UserManagement.js)
 *      jUserManagementPanelTab     :   11000   (plugins/UserManagement.js)
 *      jCatalogConfiguration       :   11000   (plugins/Catalog.js)
 *      welcome                     :   12000   (plugins/Welcome.js)
 *      .pn                         :   20000   (core/Panel.js)
 *      ddzone                      :   34000   (plugins/AddLayer.js)
 *      mask                        :   35000
 *      tooltip                     :   36000
 *      activity                    :   37000
 *      message                     :   38000 
 *      drawingAsk                  :   38000   (plugins/Drawing.js)
 *      drawingDesc                 :   38000   (plugins/Drawing.js)
 *      
 */

/**
 * Create the util object for mapshup
 */
(function(window,navigator) {
    
    /**
     * Create mapshup msp object with properties and functions
     */
    window.msp = {
        
        VERSION_NUMBER:'mapshup 1.0',
        
        /**
         * Plugin objects are defined within msp.Plugins
         */
        Plugins:{},
        
        /**
         * This is the main entry point to mapshup
         * This function must be called after document has been fully loaded
         * through the jquery .ready() i.e.
         * 
         *      $(document).ready(function() {
         *          msp.load();
         *      });
         * 
         */
        load:function() {

            /**
             * if msp.Config is not defined => Error
             */
            if (this.Config === undefined) {
                alert("GRAVE : no configuration file defined. Load aborted");
                exit();
            }

            /*
             * Read KVP from URL if any
             */
            var self = this,
            urlParameters = (function () {
                return self.Util.extractKVP(window.location.href);
            })(),
            lang = urlParameters.lang ? urlParameters.lang : self.Config.i18n.lang;

            /*
             * Internationalisation (i18n)
             * lang is defined as follow :
             *  - msp.defaultLang
             *  - superseed by msp.Config.lang (if defined)
             *  - superseed by urlParameters.lang (if defined)
             */
            self.Config.i18n.availableLangs = self.Config.i18n.availableLangs || ['en', 'fr'];
            
            /*
             * Set the i18n array
             */
            self.i18n = [];
            
            if (!lang || lang === 'auto') {
                try{
                    lang = navigator.language;
                }catch(e){
                    lang = navigator.browserLanguage; //IE
                }
            }

            /**
             * Determine browser language.
             * Since indexOf method on Arrays is not supported by
             * all browsers (e.g. Internet Explorer) this is a bit
             * tricky
             */
            var i,
            check = -1,
            check2 = -1,
            langs = self.Config.i18n.availableLangs,
            length = langs.length;
                
            for (i = length;i--;) {
                if (langs[i] === lang) {
                    check = 0;
                    break;
                }
            }
            if (check === -1){
                check2 = -1;
                // Avoid country indicator
                if (lang !== undefined) {
                    lang = lang.substring(0,2);
                }
                for (i = length;i--;) {
                    if (langs[i] === lang) {
                        check2 = 0;
                        break;
                    }
                }
                if (check2 === -1){
                    lang = langs[0];
                }
            }

            /**
             * Asynchronous call : load the lang file
             */
            $.ajax({
                url:self.Config["i18n"].url+"/"+lang+".js",
                async:true,
                dataType:"script",
                success:function() {
                    self.Config["i18n"].lang = lang;
                    self.init(urlParameters);
                }
            });
        },
        
        /*
         * mapshup initialisation
         * 
         * @input urlParameters : urlParameters object
         */
        init:function(urlParameters) {
            
            var doNotAdd,
            i,
            j,
            mspID,
            mspIDs,
            key,
            l,
            name,
            options,
            plugin,
            self = this;
  
            /**
             * Initialize #map reference
             */
            self.$map = $('#map');
            
            /**
             * Initialize map container reference
             */
            self.$mcontainer = self.$map.parent();
            
            /**
             * Initialize #wcontainer reference
             */
            self.$container = $('#wcontainer');
            
            /**
             * Initialize events
             */
            self.events = new self.Events();

            /**
             * Initialize tooltip
             */
            self.tooltip = new self.Tooltip();

            /**
             * Initialize menu
             */
            self.menu = new self.Menu();
    
            /**
             * Initialize activity
             */
            self.activity = new self.Activity();

            /**
             * Initialize mask
             */
            self.mask = new self.Mask();

            /**
             * Map initialization
             */
            self.Map.init(self.Config);

            /**
             * Plugins initialization
             * Roll over msp.plugins hash table
             * and remove all entries that are not defined
             * within the msp.Config.plugins object
             */
            self.plugins = [];
            for (i = 0, l = self.Config.plugins.length; i < l; i++) {
                name = self.Config.plugins[i].name;
                options = self.Config.plugins[i].options || {};
                plugin = (new Function('return msp.Plugins.'+name+' ? new msp.Plugins.'+name+'() : null;'))();
                
                /*
                 * Plugin exists and is successfully initialized
                 * => add it to the self.plugins array
                 */
                if (plugin && plugin.init(options)) {
                    self.plugins[name] = plugin;
                }
            }
            
            /*
             *
             * Instantiate default layers read from config
             *
             * The code evaluate the OpenLayers class name and the corresponding options both defined
             * within the "layers" array in the configuration file.
             *
             * Layers from context.remove are discarded (i.e. not added to the map)
             *
             *
             */
            mspIDs = urlParameters && urlParameters.remove ? self.unserialize(decodeURIComponent(urlParameters.remove)) : [];

            /*
             * Roll over config layers
             */
            for (i = 0, l = self.Config.layers.length; i < l; i++) {    
                if (self.Config.layers[i].type && self.Map.layerTypes[self.Config.layers[i].type]) {

                    /*
                     * Only layers that are not defined in urlParameters.removeLayers
                     * are added to the map
                     */
                    var ld = new self.Map.LayerDescription(self.Config.layers[i], self.Map);
                    mspID = ld.getMspID();
                    doNotAdd = false;
                    for (j=mspIDs.length;j--;) {
                        if (mspIDs[j] === mspID) {
                            doNotAdd = true;
                            break;
                        }
                    }
                    if (!doNotAdd) {

                        /*
                         * Set layerDescription. to true
                         * This indicates that this layer was loaded during
                         * map initialization. This layer will not be saved
                         * during msp.Map.getContext operation
                         */
                        self.Config.layers[i].initialLayer = true;
                        self.Map.addLayer(self.Config.layers[i], {
                            noDeletionCheck:true
                        });
                    }
                }
            }

            /*
             * Load context from url and/or config file
             *
             * The default context is defined by the optional Config.general.initialLocation property
             * It is superseeded by urlParameters context
             *
             * If urlParameters contains a "contextid" key, the context is retrieved from the server
             * through the Config.general.getContextServiceUrl service
             * In this case, all other parameters are ignored
             * 
             */

            /*
             * "uid" is defined within the url parameters key/value pair
             * It has preseance on every other parameter
             */
            if (urlParameters && urlParameters["uid"]) {

                self.Util.ajax({
                    url:self.Util.proxify(self.Util.getAbsoluteUrl(self.Config["general"].getContextServiceUrl)+urlParameters["uid"]),
                    async:true,
                    dataType:"json",
                    success: function(data) {

                        /*
                         * Parse result
                         */
                        if (data && data.contexts) {

                            /*
                             * Retriev the first context
                             * contexts[
                             *      {
                             *          context:
                             *          location:
                             *          utc:
                             *      },
                             *      ...
                             * ]
                             */
                            if (data.contexts[0]) {
                                self.Map.loadContext(self.Util.extractKVP(data.contexts[0].context));
                            }
                        }

                    }
                }, {
                    title:self.Util._("Load context"),
                    cancel:true
                });

            }
            /*
             * Load context from this.Config["general"].initialLocation and urlParameters
             */
            else {

                /*
                 * Initialize a context
                 */
                var context = {};

                /*
                 * First initialize context with loadInitialLocation
                 */
                if (self.Config["general"].initialLocation) {
                    for (key in self.Config["general"].initialLocation) {
                        context[key] = self.Config.general.initialLocation[key];
                    }
                }

                /*
                 * Superseed with urlParameters
                 */
                if (urlParameters) {
                    for (key in urlParameters) {
                        context[key] = urlParameters[key];
                    }
                }

                self.Map.loadContext(context);
            }

            /*
             * Detect window resize
             *   On window resizing, div position and dimension
             *   are modified to reflect map new size
             *   Plugins must register a "resizeend" event to
             *   resize
             */
            
            /* Store current window size */
            self._wd = {
                w:window.innerWidth,
                h:window.innerHeight
            };
            
            /* Force msp.$mcontainer dimensions to pixels values (avoid computation problem with %) */
            self.$mcontainer.css({
                'width':self.$mcontainer.width(),
                'height':self.$mcontainer.height()
            });
            var fn;
            $(window).bind('resize', function(){
                
                /*
                 * Trick to avoid too many resize events
                 * that could alter performance
                 */
                clearTimeout(fn);
                fn = setTimeout(function(){
                    
                    /*
                     * Resize msp.$map container div following window resize
                     */
                    self.$mcontainer.css({
                        'width':self.$mcontainer.width() + (window.innerWidth - self._wd.w),
                        'height':self.$mcontainer.height() + (window.innerHeight - self._wd.h)
                    });

                    /*
                     * Set  msp._ww andreference to the new window size
                     */
                    self._wd = {
                        w:window.innerWidth,
                        h:window.innerHeight
                    }

                    /*
                     * Propagate resizeend event
                     */
                    self.events.trigger('resizeend');
                }, 100);

            });
            
            /**
             * Force mapshup resize
             */
            self.events.trigger('resizeend');
         
        },
        
        /**
         * Remove object from the mapshup context
         */
        remove: function(obj) {

            if (!obj) {
                return false;
            }
            
            /*
             * Check for jquery $d main object
             * and remove it from the DOM
             */
            if (obj.$d) {
                obj.$d.remove();
            }
            
            /*
             * Remove attached events
             */
            this.events.unRegister(obj);
            this.Map.events.unRegister(obj);
            
            /*
             * Remove all object properties
             */
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    delete obj[p];
                }
            }
            
            /*
             * Nullify object - TODO remove it from
             * the global hash table
             */
            obj = null;
            
            return true;
            
        }
        
    };

})(window, navigator);