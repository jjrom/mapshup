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
 * The Config object
 * This is an (almost) empty shell
 * Each property is described within
 * the Config/default.js file
 */
(function(M) {
    
    /*
     * Initialize M
     */
    M = M || {};
   
    /*
     * Initilaze M.Config
     */
    M.Config = {

        /**
         * General Configuration
         * Empty : see Config/default.js
         */
        general:{
            location:{
                lon:0,
                lat:0,
                zoom:0
            }
        },

        /**
         * List of predefined groups
         */
        groups:[],

        /**
         * Internationalization
         * Empty : see Config/default.js
         */
        i18n:{},
        
        /**
         * Layers list
         * Empty : see Config/default.js
         */
        layers:[],

        /**
         * Map Configuration
         * By default map is in EPSG:3857 projection (official EPSG projection for
         * Spherical Mercator projection (see EPSG:900913 Google projection)
         */
        mapOptions: {
            projection:new OpenLayers.Projection("EPSG:3857"),
            displayProjection:new OpenLayers.Projection("EPSG:4326"),
            numZoomLevels:22
        },

        /**
         * List of available plugins
         */
        plugins:[],

        /**
         * Upload service information
         * Empty : see Config/default.js
         */
        upload:{},

        /**
         * Add content to properties
         *
         *  @param <string> propertyName : name of the property
         *  @param <object> content : content to be added
         */
        add: function(propertyName, content) {

            var p = this[propertyName];
            
            /*
             * propertyName should be an array and one of the following
             *  - layers
             *  - groups
             *  - plugins
             */
            if (p instanceof Array) {
                p.push(content);
            }
        },
        
        /*
         * Extend plugin property
         */
        extend: function(pluginName, options) {
            
            var i,
                l,
                p;
            
            /*
             * Roll over Config plugins list
             */
            for (i = 0, l = this.plugins.length; i < l; i++) {

                /*
                 * Plugin is found => return plugin options object or an empty array
                 * if options is not defined
                 */
                if (this.plugins[i].name === pluginName) {
                    p = this.plugins[i];
                    p.options = p.options || {};
                    $.extend(p.options,options);
                }
            }
            
            
        },
        
        /**
         * Remove content from one of the following property
         *  - layers
         *  - plugins
         *  - groups
         *
         *  !! Warning : if within one property there are more than
         *  one object with the same "name", only the first one is removed
         */
        remove: function(propertyName, name) {

            var i,
                l,
                checkName,
                property = this[propertyName];
            
            /*
             * property is an array => thus it's a valid property
             */
            if (property instanceof Array && name) {
                    
                /*
                 * Objects from properties "groups" and "plugins" have a unique "name" property
                 * It's not the case for "layer" property which have a non-unique "title" property
                 */
                checkName = propertyName === "layers" ? "title" : "name";
                for (i = 0, l = property.length ; i < l; i++) {
                    if (property[i][checkName] === name) {
                        property.splice(i,1);
                        break;
                    }
                }
            }
        },
        
        /**
         * 
         * Update Config object layers with input layer description list
         * 
         * @param lds : layer description
         */
        update: function(lds) {
            
            var i, l, j, k, b,
            self = this;
            
            /*
             * If the Map is not initialized, do nothing
             */
            if (!M.Map) {
                return false;
            }
            
            /*
             * Paranoid mode
             */
            lds = lds || [];
            
            /*
             * Update Config layers with context layers
             */
            for (i = 0; i < self.layers.length; i++) {

                /*
                 * By default, remove the layer
                 */
                b = true;

                /*
                 * Roll over input layer descriptions
                 */
                for (j = 0, k = lds.length; j < k; j++) {

                    /*
                     * The layer is present in the context layer list. No need to remove it
                     */
                    if ((new M.Map.LayerDescription(self.layers[i], M.Map)).getMID() === (new M.Map.LayerDescription(lds[j], M.Map)).getMID()) {
                        b = false;
                        break;
                    }

                }

                /*
                 * Remove the layer
                 * 
                 * !! Since we use splice we need to recompute j index with the new
                 * array size !!
                 */
                if (b) {
                    self.layers.splice(i,1);
                    i--;
                }

            }

            /*
             * Add or update layers
             */
            for (i = 0, l = lds.length; i < l; i++) {

                /*
                 * By default, add the layer
                 */
                b = true;

                /*
                 * Roll over existing layers
                 */
                for (j = 0, k = self.layers.length; j < k; j++) {

                    /*
                     * The layer already exist - update it
                     */
                    if ((new M.Map.LayerDescription(lds[i], M.Map)).getMID() === (new M.Map.LayerDescription(self.layers[j], M.Map)).getMID()) {
                        b = false;
                        break;
                    }

                }

                /*
                 * Add layer
                 */
                if (b) {
                    self.layers.push(lds[i]);
                }
                /*
                 * Update existing layer properties
                 */
                else {
                    
                    /*
                     * Update hidden status
                     */
                    self.layers[j].hidden = lds[i].hidden;
                    
                    /*
                     * Update search filters for catalog layers
                     */
                    if (lds[i].search) {
                        self.layers[j].search = lds[i].search;
                    }
                }
            }
            
            return true;

        }
        
    }
})(window.M);