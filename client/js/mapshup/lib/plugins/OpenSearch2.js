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
 * Plugin: OpenSearch2
 * 
 * Add support for OpenSearch feeds
 * 
 *********************************************/
(function(msp) {
    
    msp.Plugins.OpenSearch2 = function() {
        
        /*
         * Only one CountryPicker object instance is created
         */
        if (msp.Plugins.OpenSearch2._o) {
            return msp.Plugins.OpenSearch2._o;
        }
        
        /*
         * Active service
         */
        this.active = null;
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var d,i,l,
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
                position:self.options.position || 'nn',
                orientation:self.options.orientation || 'h',
                services:self.options.services || [],
                description:self.options.description || "Search for one or more comma-delimited <b>keywords</b> (e.g. Toulouse,France) or enter <b>coordinates</b> in decimal degrees (e.g. 44.1 -128.8)"
            }
            );

            /*
             * Create OpenSearch feed toolbar
             */
            self.tb = new msp.Toolbar(self.options.position, self.options.orientation);
            
            /*
             * Add the input text box
             */
            new msp.Button({
                tb:self.tb,
                tt:self.options.description,
                switchable:false,
                html:'<input style="margin-left:5px;" id="'+id+'" type="text"/>',
                nohover:true,
                activable:false
            });
            
            /*
             * Set default value if defined
             * Input value is encoded to avoid javascript code injection
             */
            self.$input = $('#'+id).watermark(msp.Util._("Keywords or coordinates"));
            
            /*
             * Launch a search when user hits 'return' or 'tab' key
             */
            self.$input.keypress(function(event) {
                if (event.keyCode === 13 || event.keyCode === 9) {
                    
                    /*
                     * Determine if input value is a keyword or a coordinates
                     * A valid Lat/Lon coordinates couple is composed of 2 float
                     * The first one with a value between -90 and 90 and the second
                     * one with a value between -180 and 180
                     */
                    var lonlat,
                        c = $.trim($(this).val()).split(' ');
                    
                    if (c.length === 2) {
                        
                        if ($.isNumeric(c[0]) && $.isNumeric(c[1])) {
                            
                            lonlat = new OpenLayers.LonLat(c[1],c[0]);
                            
                            /*
                             * Tell user we zoom the map
                             */
                            msp.Util.message(msp.Util._("Zoom map")+": " + msp.Map.Util.getFormattedLonLat(lonlat, msp.Config["general"].coordinatesFormat));
                               
                            /*
                             * Latitude/longitude to map projection
                             */
                            msp.Map.map.setCenter(msp.Map.Util.d2p(lonlat), 14);
                            
                            return false;
                        }
                    }
                    
                    /*
                     * Keywords case
                     */
                    return self.search();
                }
            });
            
            /*
             * Clear input text box value when user click on it
             */
            self.$input.click(function(){
                $(this).val('');
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
                self.add(d.url,d.stype);
            }

            /*
             * Event registration when layer end to load
             * 
             * If a layersend event occured on the self._layer layer,
             * then the loading mask is cleared
             */
             msp.Map.events.register("layersend", self, function(action, layer, scope) {

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
                                msp.Map.zoomTo(layer.getDataExtent());
                                
                                /*
                                 * If only one feature is present in the result,
                                 * then automatically select it
                                 */
                                if (layer.features.length === 1) {
                                    msp.Map.featureInfo.select(layer.features[0], true);
                                }
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
         * @input {String} stype : layer subtype (optional)
         */
        this.add = function(url, stype) {
            
            var self = this;
            
            /*
             * Asynchronously retrieve service information from url
             */
            $.ajax({
                url:msp.Util.getAbsoluteUrl(url),
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
                        if (stype === "Youtube") {
                            d.type = "Youtube";
                        }
                        else if (stype === "Flickr") {
                            d.type = "Flickr";
                        }
                        
                    }
                    else if (d.formats.KML) {
                        type = "KML";
                    }
                    else if (this.description.formats.Atom) {
                        type = "Atom"
                    }
                    else if (this.description.formats.GeoRSS) {
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
                     * Add a new button to Search toolbar
                     */
                    new msp.Button({
                        tb:self.tb,
                        tt:d.name,
                        switchable:false,
                        icon:d.icon,
                        activable:true,
                        callback:function() {
                            self.activate(d);
                        }
                    }).activate(true);

                    self.activate(d);
                    
                    return true;
                },
                error:function(e) {
                    // TODO error message
                }
            });
            
        };

        /*
         * Activate an OpenSearch service and launch a search
         * if the input value is set
         */
        this.activate = function(service) {

            var self = this;
            
            /*
             * Set input service as the active service
             */
            self.active = service;
            
            /*
             * Firefox bug with watermark ?
             */
            if(self.$input.val().length > 1 && self.$input.val() != msp.Util._("Keywords or coordinates")) {
                self.search();
            }
        };

        /**
         * Launch a search. If no service is specified, the search
         * is launched using the active service
         */
        this.search = function(service) {

            var layer,layerDescription,url,self = this;
            
            /*
             * If no input service is set, then use the active service
             */
            service = service || self.active;
            
            /*
             * Construct the url based on the searchParameters
             * If url is null then we try the special case
             */
            url = self.getRequestUrl(service);
            
            /*
             * Add layer
             * 
             * This is a bit tricky...We first need to check that layer doex not exist
             * before add it
             */
            layerDescription = {
                type:service.type,
                url:msp.Util.proxify(url),
                title:self.$input.val(),
                q:self.$input.val()
            };
            
            layer = msp.Map.Util.getLayerByMspID((new msp.Map.LayerDescription(layerDescription, msp.Map)).getMspID());
            
            /*
             * Layer already exist...ask for deletion before launching the search
             */
            if (layer) {
                
                /**
                 * Ask for deletion if :
                 *  - it is requested in the query
                 *  - msp.Config.general.confirmDeletion is set to true
                 */
                if (msp.Config["general"].confirmDeletion) {

                    msp.Util.askFor(msp.Util._("Delete layer"), msp.Util._("Do you really want to remove layer")+" "+layer.name, "list", [{
                        title:msp.Util._("Yes"), 
                        value:"y"
                    },
                    {
                        title:msp.Util._("No"), 
                        value:"n"
                    }
                    ], function(v){
                        if (v === "y") {
                            msp.Map.removeLayer(layer);
                            self.search(service);
                        }
                    });
                    return null;
                }
                else {
                    msp.Map.removeLayer(layer);
                }
                
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
         * Set the search parmeters from input service
         */
        this.setSearchTerms = function(service) {
            
            var e1,e2,bbox,
                self = this;
            
            /*
             * Avoid XSS vulnerability
             */
            self.$input.val(msp.Util.htmlEntitiesEncode(self.format(self.$input.val())));

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

        /**
         * Take input search string then remove multiple white spaces between keywords
         * and replace it with a comma
         */
        this.format = function(str) {
            return str.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/\s+/g,',').replace(/,+/g,',');
        }

        /*
         * Set unique instance
         */
        msp.Plugins.OpenSearch2._o = this;
        
        return this;
        
    };
})(window.msp);