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
 * Connector for OpenSearch catalogs
 *
 *********************************************/
(function (msp){
    
    msp.Plugins.Catalog = msp.Plugins.Catalog || {};
    
    /**
     * One connector should be initialized for each catalog layer within the _msp.searchContext property
     * (i.e. layer["_msp"].searchContext.connector = new Connector(layer, options)
     *
     * @input catalog : catalog layer
     * @input options : options object
     * @input registerCallback : callback function called after connector is successfully registered
     * @input filterCallback : callback function called after filter is successfully updated
     */
    msp.Plugins.Catalog.OpenSearch = function(catalog, options, registerCallback, filterCallback) {
        
        /*
         * Options
         */
        this.options = {
            
            /*
             * Mandatory description
             * Description can be updated in config file (see "options")
             */
            description: options.description || "OpenSearch catalog"
            
        };
        
        /**
         * Reference to the catalog layer
         */
        this.catalog = catalog;
        
        /**
         * Reference to register callback function
         */
        this.registerCallback = registerCallback;
        
        /**
         * Reference to filter callback function
         */
        this.filterCallback = filterCallback;
        
        /**
         * Array of available search filters
         */
        this.filters = [];

        /**
         * Metadata translation array
         * Contains key,value properties with
         *  - key : metadata property name
         *  - value : metadata "human readable" name in english language
         */
        this.metadataTranslator = [];
        
        /**
         * Register the connector i.e. get the filters if any
         */
        this.register = function() {
           
            var self = this;
            
            /*
             * Retrieve the OpenSearch XML description
             */
            $.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(catalog["_msp"].layerDescription.url)),
                dataType:"xml",
                success:function(data){
                    
                    if (data) {
                        
                        /*
                        * From the OpenSearch description, we extract :
                        * 
                        *   - the keys from the URLTemplate
                        *   - the url without the KVP (i.e. everything before the '?' character)
                        *   - (optionaly) the url to the json description of the parameters 
                        */
                        var format = new OpenLayers.Format.OpenSearchDescription(),
                            description = format.read(data);
                        
                        /*
                         * WARNING : only GeoJSON format is supported !!
                         */
                        if (description.formats && description.formats["GeoJSON"]) {
                            
                            /*
                             * Extract base url and KVP from the URLTemplate
                             */
                            var j,
                                k,
                                key,
                                kvps = "",
                                parts = description.formats["GeoJSON"].URLTemplate.split("?"),
                                // url is the first part of the URLTemplate i.e. everything before '?'
                                url = parts[0]+"?";
                                
                                // Other kvps are the rest of the URLTemplate
                                for (j = 1, k = parts.length; j < k; j++) {
                                    kvps += "?"+parts[j];
                                }
                                kvps = msp.Util.extractKVP(kvps);
                                
                            /*
                             * KVP analysis
                             * Non template parameters (i.e. parameter not containing a '{') are
                             * considered to be part of the base url (i.e. added to the base url) 
                             */
                            for (key in kvps) {
                                
                                /* Non template parameter */
                                if (kvps[key].indexOf('{') === -1) {
                                    url += key + "=" + kvps[key] + '&';
                                }
                                
                                /*
                                 * If value = {time:start} add a date filter 
                                 */
                                if (kvps[key].indexOf('time:start') === 1) {
                                    self.filters.push({
                                        id:"startDate",
                                        title:msp.Util._("Date"),
                                        type:"date"
                                    });
                                }
                                
                                /*
                                 * If value = count then this should replace the numRecordsPerPage
                                 */
                                if (kvps[key].indexOf('{count') === 1) {
                                    // TODO : replace "numRecordsPerPage" by "key" 
                                }
                            }
                            
                            /*
                             * Get filters from json url description
                             */
                            if (description.mspDescriptionUrl) {
                                
                                /*
                                 * Get filters
                                 */
                                $.ajax({
                                    url:msp.Util.proxify(msp.Util.getAbsoluteUrl(description.mspDescriptionUrl)),
                                    dataType:"json",
                                    success:function(data2){
                                        
                                        /*
                                         * Yes i got some filters !
                                         */
                                        if (data2.filters) {
                                            for (var i = 0, l = data2.filters.length; i < l; i++) {
                                                self.filters.push(data2.filters[i]);
                                            }
                                        }
                                        
                                        /*
                                         * Refresh tab for this connector catalog
                                         */
                                        if (self.filterCallback) {
                                            self.filterCallback(self.catalog);
                                        }
                                        
                                    }
                                });
                                
                            }
                            
                            /*
                             * !! IMPORTANT !!
                             * Set the searchUrl
                             */
                            self.searchUrl = msp.Util.getAbsoluteUrl(msp.Util.repareUrl(url));
                            
                            /*
                             * Callback to effectively add the catalog to mapshup
                             */
                            if (self.registerCallback) {
                                self.registerCallback(self);
                            }
                            
                        }
                        
                    }
                    
                },
                error:function(e) {
                // TODO
                }
            });
            
            /*
             * Return false because registration is asynchronous
             */
            return false;
            
        };
        
        /*
         * Return an array of the attributes to
         * present in the brief view
         * title is the name of the column to display
         * value is the name of the feature attributes
         */
        this.getBriefAttributes = function() {
            return [
            {
                title:'Preview',
                value:'thumbnail'
            },
            {
                title:'Identifier',
                value:'identifier'
            }
            ];
            
        }
        
    }
})(window.msp);