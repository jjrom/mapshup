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
 * Plugin: OpenSearch
 * 
 * Add support for OpenSearch feeds
 * OpenSearch plugin is activated through a
 * msp.Button and displayed within a msp.Panel
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
        
        /*
         * Compile regular expression during object creation
         */
        this.regExp = {
            all:(/\{(\w|:)+\??\}/g),
            trimCurly:(/(^\{|\??\}$)/g),
            searchTerms:(/\{searchTerms\}/g),
            bbox:(/\{geo:box\??\}/g)
        };

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
                descriptions:self.options.descriptions || [],
                title:self.options.title || "Search for media"
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
                tt:self.options.title,
                switchable:false,
                html:'<input style="margin-left:5px;" id="'+id+'" type="text"/>',
                nohover:true,
                activable:false
            });
            
            /*
             * Set default value if defined
             * Input value is encoded to avoid javascript code injection
             */
            self.$input = $('#'+id).watermark(msp.Util._("Search")+"...");
            
            /*
             * Launch a search when user hits 'return' or 'tab' key
             */
            self.$input.keypress(function(event) {
                if (event.keyCode === 13 || event.keyCode === 9) {
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
            for (i = 0, l = self.options.descriptions.length; i < l ;i++){
                d = self.options.descriptions[i];
                self.add(d.url,d.layerType);
            }

            return this;

        };
        
        /**
         * Add an OpenSearch service
         * 
         * @input {String} url : url to an OpenSearch XML service description
         * @input {String} layerType : layer Type (optional)
         */
        this.add = function(url, layerType) {
            
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
                    var d = self.reader.read(data);
                    
                    /*
                     * If no layerType is specified, then we look for
                     * the best type candidate in the description list of available types
                     * 
                     * Order of preference is GeoJSON, KML, Atom and GeoRSS
                     */
                    //if (layerType) {
                    if (1 === 2) {
                        d.type = layerType;
                    }
                    else {
                        
                        if (d.formats.GeoJSON) {
                            d.type = "GeoJSON";
                        }
                        else if (d.formats.KML) {
                            d.type = "KML";
                        }
                        else if (this.description.formats.Atom) {
                            d.type = "Atom"
                        }
                        else if (this.description.formats.GeoRSS) {
                            d.type = "GeoRSS";
                        }
                        else {
                            msp.Util.message(d.name + ": " + msp.Util._("Error : format not supported"));
                            return false;
                        }
                        
                        /*
                         * Set URLTemplate and searchParams object
                         */
                        d.URLTemplate = d.formats[d.type].URLTemplate;
                        d.searchParams = d.formats[d.type].searchParams;
                    
                    }

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
            if(self.$input.val().length > 1 && self.$input.val() != msp.Util._("Search")+"...") {
                self.search();
            }
        };

        /**
         * Launch a search. If no service is specified, the search
         * is launched using the active service
         */
        this.search = function(service) {

            var url,self = this;
            
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
             */
            msp.Map.addLayer({
                type:service.type,
                url:msp.Util.proxify(url),
                title:self.$input.val(),
                q:self.$input.val()
            });
            
            /*
             * Launch search
             */
            /*
            msp.Util.ajax({
                url:msp.Util.proxify(url),
                async:true,
                dataType:"json",
                success:function(result){
                    if (result.error) {
                        msp.Util.message(result.error["message"]);
                    }
                    else {
                        
                        
                    }

                },
                error:function() {
                    msp.Util.message(msp.Util._("Error : cannot perform action"));
                }
            },{
                title:msp.Util._(service.name)+' : '+msp.Util._("Searching")+" "+ self.$input.val(),
                cancel:true
            });
*/
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
            self.$input.val(msp.Util.htmlEntitiesEncode(self.$input.val()));

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