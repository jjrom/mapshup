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
(function(M) {
    
    M.Plugins.Search = function() {
        
        /*
         * Only one Search object instance is created
         */
        if (M.Plugins.Search._o) {
            return M.Plugins.Search._o;
        }
        
        /*
         * List of services - Hash map with url as the primary key
         */
        this.services = [];
        
        /**
         * Minimum number of characters before launching a search
         */
        this.minChars = 3;
        
        /**
         * Initialize plugin
         * 
         * @param {Object} options
         * 
         */
        this.init = function(options) {

            var sb,d,i,l,
            id1 = M.Util.getId(),
            self = this;
            
            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set default options
             */
            $.extend(self.options, {
                services:self.options.services || []
            });
            
            /*
             * Create the search bar within mapshup header
             */
            sb = $('.searchBar', M.$header).html('<form method="get" action="#"><input id="'+id1+'" name="q" type="text" size="40" placeholder="'+M.Util._(options.hint || "Search / Add a layer url")+'" autocomplete="off"/></form>');
            self.$input = $('#'+id1);
            
            /*
             * Computation for leftBar position
             * to avoid different positionning between browsers
             */
            $('.leftBar', self.$header).css('left', sb.offset().left + sb.outerWidth());
            
            /*
             * Create the search suggestion panel
             * 
             * The suggestion panel is displayed below the searchBar
             * 
             * Suggestion panel contains one entry per search engine
             *   
             *   <div id="'+id2+'" class="as-results">
             *      <ul class="as-list">
             *          <li id="as-result-item-0" class="as-result-item">Flickr</li>
             *          <li id="as-result-item-1" class="as-result-item">Geonames</li>
             *          ...etc...
             *      </ul>
             *   </div>
             *  
             *
             */
            self.$suggest = M.Util.$$('#'+M.Util.getId(), $('#mapshup')).addClass('searchSuggest')
            .html('<div class="as-results"><ul class="as-list"></ul></div>')
            .css({
                'top':sb.offset().top + sb.outerHeight(),
                'left':sb.offset().left,
                'min-width':sb.outerWidth()
            }).hide();
            
            /*
             * Select input text on focus
             */
            self.$input.focus(function() {
                $(this).select();
            });
            
            /*
             * Tracks when user type text within searchBar
             * 
             *  - If more than 3 characters are typed, then suggest bar is shown
             *  - If focus is lost, then suggest bar is hidden
             *  - If 'tab' or 'return' are pressed, then search is launch on the selected search
             *    engine in suggest.
             *  - Use 'key up' or 'key down' to select the search engine within suggest bar
             *  
             */
            self.$input
            .blur(function(e){
                e.preventDefault();
                self.$suggest.hide();
            })
            .keydown(function(e){
                switch(e.keyCode) {
                    case 13: case 16: case 91:
                        e.preventDefault();
                        self.$suggest.hide();
                        break;
                }
            })
            .keyup(function(e) {
                
                var active, lonlat, v = self.getValue(), c = v.split(' ');
                
                switch(e.keyCode) {
                    case 38: // up
                        e.preventDefault();
                        self.moveSelection("up");
                        break;
                    case 40: // down
                        e.preventDefault();
                        self.moveSelection("down");
                        break;
                    case 8:  // delete
                        self.getValue().length >= self.minChars ? self.$suggest.show() : self.$suggest.hide();
                        break;
                    case 9: case 188: case 13: // tab comma or return
                        
                        active = $("li.active:first", self.$suggest);
                        
                        /*
                         * 1. url case - guess what it is 
                         */
                        if (M.Util.isUrl(v) && M.Plugins.AddLayer && M.Plugins.AddLayer._o) {
                            M.Plugins.AddLayer._o.guess(v);
                            self.$suggest.hide();
                        }
                        /* 
                         * 2. Coordinates case
                         * A valid Lat/Lon coordinates couple is composed of 2 float
                         * The first one with a value between -90 and 90 and the second
                         * one with a value between -180 and 180
                         */
                        else if (c.length === 2 && $.isNumeric(c[0]) && $.isNumeric(c[1])) {
                        
                            lonlat = new OpenLayers.LonLat(c[1],c[0]);

                            /*
                             * Tell user we zoom the map
                             */
                            M.Util.message(M.Map.Util.getFormattedLonLat(lonlat, M.Config["general"].coordinatesFormat));

                            /*
                             * Latitude/longitude to map projection
                             */
                            M.Map.map.setCenter(M.Map.Util.d2p(lonlat), 14);
                            
                        }

                        /*
                         * Normal case - launch search
                         */
                        else {
                            if(active.length > 0){
                                active.trigger('mousedown');
                                self.$suggest.hide();
                            }
                        }
                        e.preventDefault();
                        break;
                    case 27: case 16: case 91: // escape, shift, command
                        e.preventDefault();
                        self.$suggest.hide();
                        break;
                    default:
                        
                        /*
                         * Ignore if the following keys are pressed: [del] [shift] [capslock] [Command]
                         */
                        if(e.keyPressCode === 46 || (e.keyPressCode > 8 && e.keyPressCode < 32) ){
                            return;
                        }
                        
                        /* 
                        * Some input value analysis
                        * 
                        * If value is a valid url, 
                        * Or if value is a valid coordinates pair
                        * Then hide the suggest panel
                        * 
                        */
                        if (M.Util.isUrl(v) || (c.length === 2 && $.isNumeric(c[0]) && $.isNumeric(c[1]))) {
                            self.$suggest.hide();
                        }
                        /*
                         * Otherwise set value
                         */
                        else if (v.length >= self.minChars) {
                            self.$suggest.show();
                            $('.val', self.$suggest).each(function(){
                                $(this).html(M.Util.stripTags(v));
                            });
                        }
                        else {
                            self.$suggest.hide();
                        }
                        break;
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
                    msg:false,
                    options:d.options || {}
                });
            }

            return this;
            
        };
        
        /**
         * Add an OpenSearch service
         * 
         * @param {String} url : url to an OpenSearch XML service description
         * @param {Object} options : options object (optional)
         *                           {
         *                              type: // sub type for this OpenSearch service
         *                              msg: // boolean - true to display message when successfully load service
         *                                                false otherwise (default true)
         *                              layer:// if set, result is displayed within the given
         *                                       layer instead of being displayed in a new layer 
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
            options.msg = M.Util.getPropertyValue(options, "msg", true);
            
            /*
             * Asynchronously retrieve service information from url
             */
            $.ajax({
                url:M.Util.proxify(M.Util.getAbsoluteUrl(url)),
                origin:url,
                async:true,
                success:function(data) {
                    
                    /*
                     * Use the OpenLayers.Format.OpenSearchDescription reader
                     * to decode data result
                     */
                    var lis, type,
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
                        type = "Atom";
                    }
                    else if (d.formats.KML) {
                        type = "KML";
                    }
                    else if (d.formats.GeoRSS) {
                        type = "GeoRSS";
                    }
                    else {
                        M.Util.message(d.name + ": " + M.Util._("Error : format not supported"));
                        return false;
                    }

                    /*
                     * Set URLTemplate with an absolute url
                     */
                    d.URLTemplate = M.Util.getAbsoluteUrl(d.formats[type].URLTemplate);
                    
                    /*
                     * Set type
                     */
                    d.type = d.type || type;
                    
                    /*
                     * Set mandatory values for choose() function
                     */
                    d.title = d.name;
                    d.value = this.origin; // Value === origin
                    d.options = options.options || {};
                    
                    /*
                     * Add new service
                     */
                    self.services[this.origin] = M.Util.clone(d);
                    self.services[this.origin].layer = options.layer;
                    
                    /*
                     * Add an entry in the suggest panel, set it active and
                     * attach a mousedown event on it to launch search
                     * 
                     * Note that mousedown event is used instead of click event
                     * to ensure that blur event do not stop click resolution
                     */
                    $('ul', self.$suggest).prepend('<li class="as-result-item"><img src="'+M.Util.getImgUrl(d.icon||"default_search.png")+'" class="middle"/>&nbsp;&nbsp;'+M.Util._("Search")+' <span class="val"></span> '+M.Util._("in")+' <em>'+d.title+'</em></li>');
                    lis = $('li', self.$suggest).removeClass('active');
                    
                    lis.filter(':first')
                    .addClass('active')
                    .mousedown(function(){
                        self.search(self.services[d.value]);
                    });
                    
                    /*
                     * Tell user that service is loaded
                     */
                    if (options.msg) {
                        M.Util.message(M.Util._("Add search service") + " : " + M.Util._(d.title));
                    }
                    
                    return true;
                },
                error:function(e) {
                    M.Util.message(M.Util._("Error : cannot add search service") + " - " + url);
                }
            });
            
        };
        
        /**
         * Change selected search engine
         * 
         * @param {String} direction ('up' or 'down')
         */
        this.moveSelection = function(direction){
            if($(':visible', this.$suggest).length > 0){
                    
                var lis = $('li', this.$suggest),
                start = direction === 'down' ? lis.eq(0) : lis.filter(':last'),
                active = $('li.active:first', this.$suggest);
                        
                if(active.length > 0){
                    start = direction === 'down' ? active.next() : active.prev();
                }
                lis.removeClass('active');
                start.addClass('active');
            }
            else if (this.getValue().length > 0) {
                this.$suggest.show();
            }
        };
        
        /**
         * Launch a search. If no service is specified,
         * user is asked to choose a set service
         * 
         * @param service : service to search in
         * @param options : {
         *                      getParams: additional parameters to add to the search service (function returning "&key1=val1&key2=val2&...")
         *                      searchTerms: bypass input searchTerms
         *                  }
         *
         */     
        this.search = function(service, options) {

            var a, lt, info, layer, v, layerDescription, self = this;
            
            options = options || {};
            
            /*
             * If no input service is set, then ask user
             */
            if (!service) {
                return false;
            }
            
            /*
             * Paranoid mode
             */
            a = $.isFunction(options.getParams) ? options.getParams() : {
                params:""
            };
            
            /*
             * Construct the url based on the searchParameters
             * If url is null then we try the special case
             */
            info = self.getUrlInfo(service);
            
            /*
             * Empty val, no search except if additional parameters are set
             */
            if (self.getValue() === "" && a.params === "" && !options.searchTerms) {
                return false;
            }
            
            v = options.searchTerms || self.getValue();
            
            /*
             * If service is added to an existing layer,
             * then the result is displayed within that layer...
             */
            if (service.layer) {
                
                var sc = service.layer["_M"].searchContext;
                
                /*
                 * Clear other search parameters except Time and BBOX
                 */
                sc.clear(true);
                
                /*
                 * Launch search with a callback function
                 */
                sc.setSearchTerms(v);
                sc.search({
                    callback:function(scope,layer){
                        if (layer) {
                            
                            /*
                             * If only one result - select it
                             */
                            if (layer.features && layer.features.length === 1) {
                                M.Map.featureInfo.select(layer.features[0], true);
                            }
                        
                        }
                    }
                });
                
                /*
                 * Don't forget to clear the search terms again !
                 */
                sc.clear();
                
                return false;
            }
            
            /*
             * Create a new layer
             * 
             * This is a bit tricky...We first need to check that layer does not exist
             * before add it
             */ 
            layerDescription = {
                type:service.type,
                url:info.url + a.params, // concatenate url with additional parameters
                pagination:info.pagination,
                title:a.title || v, // if input value is not set
                q:v
            };

            /*
            * Extend layerDescription with input options
            */
            $.extend(layerDescription, service.options);
            layer = M.Map.Util.getLayerByMID((new M.Map.LayerDescription(layerDescription, M.Map)).getMID());

            /*
            * Layer already exist -> replace features
            */
            if (layer) {

                /*
                * Set new layerDescription
                */
                $.extend(layer["_M"].layerDescription,layerDescription);

                /*
                * Refresh layer name
                */
                layer.name = layerDescription.title;

                /*
                * Refresh features
                */
                lt = M.Map.layerTypes[layer["_M"].layerDescription.type];
                if ($.isFunction(lt.refresh)) {
                    lt.refresh(layer);
                }
            }
            else {
                
                /*
                 * Add layer and store it for post processing 
                 */
                layer = M.Map.addLayer(layerDescription);

                /*
                 * Add a setTime Function
                 */
                if (service.options.changeOnTime) {
                    layer["_M"].setTime = function(interval) {
                        self.search(service, {getParams:getParams});
                    };
                    if (M.timeLine) {
                        M.timeLine.add(layer);
                    }
                }
            }
            
            /*
             * Tell user that search is in progress
             */
            M.mask.add({
                title:M.Util._(service.name)+' : '+M.Util._("Searching")+" "+ (a.title || v),
                layer:layer,
                cancel:true
            });
            
            return false;
        };
        
        /**
         * Build request url from service template
         * 
         * @param {Object} service
         * 
         */
        this.getUrlInfo = function(service) {
          
            var interval, j, k, key, parts, parts2, unNameSpacedKey, pagination = {}, url = service.URLTemplate, kvps = "", self = this;
           
            /*
             * Split URLTemplate into base url and parameters
             */
            parts = url.split("?");
            
            /*
             * url is the first part of the URLTemplate i.e. everything before '?'
             */
            url = parts[0]+"?";
            
            /*
             *  Parameters are all kvps after '?'
             */
            for (j = 1, k = parts.length; j < k; j++) {
                kvps += "?"+parts[j];
            }
            kvps = M.Util.extractKVP(kvps);

            /*
             * Avoid XSS vulnerability
             */
            self.$input.val(M.Util.stripTags(self.getValue()));
           
            /*
             * Get time
             */
            if (M.timeLine && M.timeLine.enabled) {
                interval =  M.timeLine.getInterval();
            }
            
            /*
            * KVP analysis
            * Non template parameters (i.e. parameter not containing a '{') are
            * considered to be part of the base url (i.e. added to the base url) 
            */
            for (key in kvps) {

                /* Non template parameter */
                if (kvps[key].indexOf('{') === -1) {
                    continue;
                }
            
                /*
                * Template parameter can be prefixed by namespace
                */
                parts2 = kvps[key].split(":");
                unNameSpacedKey = (parts2.length === 2 ? parts2[1] : parts2[0]).replace('{', '').replace('}', '').replace('?', '');
                         
                /*
                 * Set searchTerms
                 */
                if (unNameSpacedKey === 'searchTerms') {
                    kvps[key] = encodeURIComponent(self.$input.val());
                }
                
                /*
                 * Set bbox
                 */
                else if (unNameSpacedKey === 'box') {
                    kvps[key] = M.Map.Util.convert({
                        input:M.Map.Util.p2d(M.Map.map.getExtent().clone()),
                        format:"EXTENT",
                        precision:6,
                        limit:true
                    });
                }
                
                /*
                 * Set lang
                 */
                else if (kvps[key].indexOf('lang') === 1) {
                    kvps[key] = M.Config.i18n.lang;
                }
                
                /*
                 * Set date
                 */
                else if (interval && kvps[key].indexOf('time:start') === 1) {
                    kvps[key] = interval[0];
                }
                else if (interval && kvps[key].indexOf('time:end') === 1) {
                    kvps[key] = interval[1];
                }
                
                /*
                 * NextRecord = OpenSearch "startIndex"
                 */
                else if (unNameSpacedKey === 'startIndex') {
                    pagination["nextRecord"] = {
                        name:key,
                        value:1
                    };
                }
                
                /*
                 * numRecordsPerPage = OpenSearch "count"
                 */
                else if (unNameSpacedKey === 'count') {
                    pagination["numRecordsPerPage"] = {
                        name:key,
                        value:M.Config["general"].numRecordsPerPage
                    };
                }
                
                else {
                    kvps[key] = "";
                }
                
            }
            
            /*
             * Rebuild URL excluding pagination info
             */
            for (key in kvps) {
                
                if (pagination["numRecordsPerPage"] && key === pagination["numRecordsPerPage"].name) {
                    continue;
                }
                if (pagination["nextRecord"] && key === pagination["nextRecord"].name) {
                    continue;
                }
                if (kvps[key] === "") {
                    continue;
                }
                url += key + "=" + kvps[key] + '&';
            }
            
            return {
                url:url, 
                pagination:pagination
            };
        };
        
        /**
         * Return input value
         */
        this.getValue = function() {
            return $.trim(this.$input.val());
        };
        
        /*
         * Set unique instance
         */
        M.Plugins.Search._o = this;
        
        return this;
        
    };
})(window.M);