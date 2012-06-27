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
 * 
 * Plugin: Search
 * 
 * Add support for searching in OpenSearch feeds
 * 
 *********************************************/
(function(msp) {
    
    msp.Plugins.Search = function() {
        
        /*
         * Only one Search object instance is created
         */
        if (msp.Plugins.Search._o) {
            return msp.Plugins.Search._o;
        }
        
        /*
         * List of services - Hash map with url as the primary key
         */
        this.services = [];
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var sb,d,i,l,
            id = msp.Util.getId(),
            self = this;
            
            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set default options
             */
            $.extend(self.options,
            {
                services:self.options.services || []
            }
            );
            
            /*
             * Create the search bar within mapshup header
             */
            sb = $('.searchBar', msp.$header).html('<form method="get" action="#"><input id="'+id+'" name="q" type="text" size="40" placeholder="'+msp.Util._("Search / Add a layer url")+'"/></form>');
            self.$input = $('#'+id);
            
            /*
             * Computation for leftBar position
             * to avoid different positionning between browsers
             */
            $('.leftBar', self.$header).css('left', sb.offset().left + sb.outerWidth());
            
            /*
             * Select input text on focus
             */
            self.$input.focus(function() {
                $(this).select();
            });
            
            /*
             * Launch a search when user hits 'return' or 'tab' key
             */
            self.$input.keypress(function(event) {
                
                if (event.keyCode === 13 || event.keyCode === 9) {
                    
                    var lonlat,s,v = $.trim($(this).val()),key, service = null, c = v.split(' ');
                    
                    /*
                     * Nothing to search
                     */
                    if (v.length === 0) {
                        return false;
                    }
                    
                    /*
                     * Some input value analysis
                     * 
                     * 1. Coordinates case
                     * A valid Lat/Lon coordinates couple is composed of 2 float
                     * The first one with a value between -90 and 90 and the second
                     * one with a value between -180 and 180
                     */
                    if (c.length === 2) {
                        
                        if ($.isNumeric(c[0]) && $.isNumeric(c[1])) {
                            
                            lonlat = new OpenLayers.LonLat(c[1],c[0]);
                            
                            /*
                             * Tell user we zoom the map
                             */
                            msp.Util.message(msp.Map.Util.getFormattedLonLat(lonlat, msp.Config["general"].coordinatesFormat));
                               
                            /*
                             * Latitude/longitude to map projection
                             */
                            msp.Map.map.setCenter(msp.Map.Util.d2p(lonlat), 14);
                            
                            return false;
                        }
                    }
                    
                    
                    /* 
                     * 2. Url case
                     * 
                     * If value is a valid url, then call AddLayer plugin if defined
                     * 
                     */
                    if (msp.Util.isUrl(v)) {
                        if (msp.Plugins.AddLayer && msp.Plugins.AddLayer._o) {
                            msp.Plugins.AddLayer._o.guess(v);
                            return false;
                        }
                    }
                    
                    /* 
                     * 3. Keywords shortcut case
                     * 
                     * If value is a keyword, then check if it is prefixed with
                     * a valid shortcut. If so, automatically set the search
                     * engine acordingly instead of asking the user
                     * 
                     * Shortcut is a one string prefix immediately followed by ':' character
                     */
                    s = c[0].substring(0,2);
                    
                    /*
                     * Search for this shortcut within search services
                     */
                    for (key in self.services) {
                        if (self.services[key].shortcut) {
                            if (s === self.services[key].shortcut + ':') {
                                
                                /*
                                 * A service is found
                                 */
                                service = self.services[key];
                                
                                /*
                                 * Remove shortcut from the input bar
                                 */
                                self.$input.val(v.substring(2,v.length));
                                
                                break;
                            }   
                        }
                    }
                    
                    /*
                     * 4. Normal keywords case
                     */
                    return self.search(service);
                }
            });
            
            /*
             * Initialize OpenSearch format reader
             */
            self.reader = new OpenLayers.Format.OpenSearchDescription();
            
            /*
             * Extract service information for each OpenSearch description
             */
            for (i = 0, l = self.options.services.length; i < l ;i++){
                d = self.options.services[i];
                self.add(d.url,{
                    type:d.stype,
                    shortcut:d.shortcut,
                    msg:false
                });
            }

            /*
             * Event registration when layer end to load
             * 
             * If a layersend event occured on the self._layer layer,
             * then the loading mask is cleared
             */
            msp.Map.events.register("layersend", self, function(action, layer, scope) {

                var lm = msp.Plugins.LayersManager;
                
                /*
                 * Process event only if a non loaded OpenSearch layer is defined
                 */
                if (self._layer) {
                    
                    /*
                     * The event occurs on the current OpenSearch layer
                     */
                    if (layer.id === self._layer.id) {
                       
                        /*
                         * The OpenSearch layer is loaded or is due to be destroyed
                         */
                        if (layer.hasOwnProperty('_msp') && (layer._msp.isLoaded || layer._tobedestroyed)) {
                            
                            /*
                             * Hide the mask
                             */
                            msp.mask.hide();
                            
                            /*
                             * No more OpenSearch layer
                             */
                            self._layer = null;
                            
                            if (!layer._tobedestroyed) {
                                
                                /*
                                 * Automatically zoom on result extent
                                 */
                                //msp.Map.zoomTo(layer.getDataExtent());
                                
                                /*
                                 * Show item on layer manager
                                 */
                                if (lm && lm._o) {
                                    lm._o.show(lm._o.get(layer['_msp'].mspID));
                                }
                                
                                /*
                                 * If only one feature is present in the result,
                                 * then automatically select it
                                
                                if (layer.features.length === 1) {
                                    msp.Map.featureInfo.select(layer.features[0], true);
                                }
                                */
                            }
                            
                        }
                    }
                }
                
                return true;
        
            });
            
            return this;

        };
        
        /**
         * Add an OpenSearch service
         * 
         * @input {String} url : url to an OpenSearch XML service description
         * @input {Object} options : options object (optional)
         *                           {
         *                              type: // sub type for this OpenSearch service
         *                              msg: // boolean - true to display message when successfully load service
         *                                                false otherwise (default true)
         *                              shortcut: // prefix to check for when analyzing
         *                                           search keyword to determine the search engine
         *                           }
         */
        this.add = function(url, options) {
            
            var self = this;
            
            /*
             * Paranoid mode
             */
            options = options || {};
            
            /*
             * Default is to display message
             */
            options.msg = msp.Util.getPropertyValue(options, "msg", true);
            
            /*
             * Asynchronously retrieve service information from url
             */
            $.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(url)),
                async:true,
                success:function(data) {
                    
                    /*
                     * Use the OpenLayers.Format.OpenSearchDescription reader
                     * to decode data result
                     */
                    var type,
                    d = self.reader.read(data);
                    
                    /*
                     * Look for the best type candidate in the description list of available types
                     * 
                     * Order of preference is GeoJSON, KML, Atom and GeoRSS
                     */
                    if (d.formats.GeoJSON) {
                        
                        type = "GeoJSON";
                        
                        /*
                         * Special case for Flickr and Youtube 
                         * Force the service type
                         */
                        if (options.type === "Youtube") {
                            d.type = "Youtube";
                        }
                        else if (options.type === "Flickr") {
                            d.type = "Flickr";
                        }
                        
                    }
                    else if (d.formats.Atom) {
                        type = "Atom"
                    }
                    else if (d.formats.KML) {
                        type = "KML";
                    }
                    else if (d.formats.GeoRSS) {
                        type = "GeoRSS";
                    }
                    else {
                        msp.Util.message(d.name + ": " + msp.Util._("Error : format not supported"));
                        return false;
                    }

                    /*
                     * Set URLTemplate and searchParams object
                     */
                    d.URLTemplate = d.formats[type].URLTemplate;
                    d.searchParams = d.formats[type].searchParams;
                    
                    /*
                     * Set type
                     */
                    d.type = d.type || type;
                    
                    /*
                     * Set mandatory values for choose() function
                     */
                    d.title = d.name;
                    d.value = d.URLTemplate;
                    d.icon = d.icon ? msp.Util.getImgUrl(d.icon) : null;
                    d.shortcut = options.shortcut
                    
                    /*
                     * Add new service
                     */
                    self.services[d.URLTemplate] = msp.Util.clone(d);
                    
                    /*
                     * Tell user that service is loaded
                     */
                    if (options.msg) {
                        msp.Util.message(msp.Util._("Add search service") + " : " + msp.Util._(d.title));
                    }
                    
                    return true;
                },
                error:function(e) {
                    msp.Util.message(msp.Util._("Error : cannot add search service") + " - " + url);
                }
            });
            
        };

        /*
         * Ask user to choose a search service
         */
        this.choose = function() {
            
            var self = this;
            
            msp.Util.askFor(msp.Util._("Choose a search service"), null, "list", self.services, function(v){
                
                /*
                 * If input text box is not empty, launch search
                 */
                if(self.$input.val().length > 1) {
                    self.search(self.services[v]);
                }
                
            });
            
            return false;
        
        };

        /**
         * Launch a search. If no service is specified,
         * user is asked to choose a set service
         * 
         * @input service : service to search in
         */
        this.search = function(service) {

            var layer,layerDescription,url,self = this;
            
            /*
             * If no input service is set, then ask user
             */
            if (!service) {
                return self.choose();
            }
            
            /*
             * Construct the url based on the searchParameters
             * If url is null then we try the special case
             */
            url = self.getRequestUrl(service);
            
            /*
             * Empty val, no search
             */
            if (self.$input.val() === "") {
                return false;
            }
            
            /*
             * Add layer
             * 
             * This is a bit tricky...We first need to check that layer does not exist
             * before add it
             */
            layerDescription = {
                type:service.type,
                url:url,
                title:self.$input.val(),
                q:self.$input.val()
            };
            
            layer = msp.Map.Util.getLayerByMspID((new msp.Map.LayerDescription(layerDescription, msp.Map)).getMspID());
            
            /*
             * Layer already exist...remove it
             */
            if (layer) {
                msp.Map.removeLayer(layer);
            }
            
            /*
             * Add layer and store it for post processing 
             */
            self._layer = msp.Map.addLayer(layerDescription);
            
            /*
             * Tell user that search is in progress
             */
            msp.mask.add({
                title:msp.Util._(service.name)+' : '+msp.Util._("Searching")+" "+ self.$input.val(),
                cancel:true
            });
            
            return false;
        };
        
        /**
         * Set the search parameters from input service
         */
        this.setSearchTerms = function(service) {
            
            var e1,e2,bbox,interval,
            self = this;
            
            /*
             * Avoid XSS vulnerability
             */
            self.$input.val(msp.Util.htmlEntitiesEncode($.trim(self.$input.val())));

            /*
             * Set special params
             */
            if(service.searchParams != null) {
                
                /*
                 * Set searchTerms
                 */
                if (service.searchParams.hasOwnProperty("searchTerms")) {
                    service.searchParams["searchTerms"] = self.$input.val();
                }
                
                /*
                 * Set bbox
                 */
                if (service.searchParams.hasOwnProperty("geo:box")) {
                    // BBOX is the viewport (e1), but restricting also to map maxextent (e2)
                    e1 = msp.Map.Util.p2d(msp.Map.map.getExtent().clone());
                    e2 = msp.Map.Util.p2d(msp.Map.map.getMaxExtent().clone());
                    bbox = new OpenLayers.Bounds(
                        Math.max(e1.left, e2.left),
                        Math.max(e1.bottom, e2.bottom),
                        Math.min(e1.right, e2.right),
                        Math.min(e1.top, e2.top)).toBBOX();
                    service.searchParams["geo:box"] = bbox;
                }
                
                /*
                 * Set lang
                 */
                if (service.searchParams.hasOwnProperty("lang") != null) {
                    service.searchParams["lang"] = msp.Config.i18n.lang;
                }
                
                /*
                 * Set date
                 */
                interval =  msp.timeLine.getInterval();
                if (service.searchParams.hasOwnProperty("time:start")) {
                    service.searchParams["time:start"] = interval[0];
                }
                if (service.searchParams.hasOwnProperty("time:end")) {
                    service.searchParams["time:end"] = interval[1];
                }
            }
            
        };
        
        /**
         * Build request url from service template
         */
        this.getRequestUrl = function(service) {
            
            var name,value,regex,
            url = service.URLTemplate;
            
            /*
             * Build url from URLTemplate and searchParams if both are defined
             */
            if (url) {
                
                /*
                 * Set params
                 */
                this.setSearchTerms(service);
                
                for (name in service.searchParams){
                    value = service.searchParams[name];
                    regex = new RegExp("\\{"+name+"\\??\\}");
                    url = url.replace(regex, value);
                }
            }
            
            return url;
        };

        /*
         * Set unique instance
         */
        msp.Plugins.Search._o = this;
        
        return this;
        
    };
})(window.msp);