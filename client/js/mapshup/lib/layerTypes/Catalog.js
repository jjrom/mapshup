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
(function (msp, Map){
    
    Map.layerTypes["Catalog"] = {
   
        /**
         * icon path relative to the msp.themeDirectory
         */
        icon:"catalog.png",

        /**
         * Catalogs are selectable vector objects
         */
        selectable:true,

        /**
         * Set default styleMap
         */
        hasStyleMap:true,

        /**
         * Catalogs return EPSG:4326 data by default
         */
        projection:Map.pc,

        /**
         * Mandatory properties for
         * valid layerDescription
         */
        mandatories:[
        "connectorName"
        ],

        /**
         * MANDATORY
         *
         * layerDescription = {
         *       type:'Catalog',
         *       title:,
         *       url:,
         *       connectorName:,
         *       color:,
         *       nextRecord:(optional)
         *       numRecordsPerPage:(optional)
         *       collection:(optional),
         *       extras:[
         *          order:"latlon" (optional)
         *       ]
         *  };
         */
        add: function(layerDescription, options) {

            /*
             * Check
             *  1. Catalog plugin is mandatory
             *  2. layerDescription.connector must be defined
             *
             */
            var plugin = msp.plugins["Catalog"];

            if (!plugin) {
                return null;
            }
            
            /*
             * Set title
             */
            layerDescription.title = msp.Util.getTitle(layerDescription);
            
            /*
             * Check mandatory properties
             */
            if (!(new Map.LayerDescription(layerDescription, Map)).isValid()) {

                /*
                 * Important : non valid layers loaded during
                 * startup are discarded without asking user
                 */
                if (!layerDescription.initial) {
                    this.update(layerDescription, Map.addLayer);
                }
                return null;
            }

            /*
             * Repare URL if it is not well formed
             */
            layerDescription.url = msp.Util.repareUrl(layerDescription.url);

            /*
             * Set a random footprint color if it is not defined
             */
            layerDescription.color = msp.Util.getPropertyValue(layerDescription, "color", msp.Util.randomColor());

            /*
             * Set dedicated catalog options
             */
            layerDescription.collection = msp.Util.getPropertyValue(layerDescription, "collection", "");

            /**
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);
            
            /*
             * Add a setTime Function
             */
            newLayer["_msp"].setTime = function(interval) {
                
                var sc = newLayer["_msp"].searchContext;
                if (sc) {

                    /*
                     * Update time interval
                     */
                    sc.setTime(interval);

                    /*
                     * Launch search
                     */
                    sc.search();
                }
          
            };
            
            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {
                Map.onFeaturesAdded(this);
            });

            /**
             * Add this catalog to the list of catalogs
             * If for some reason this step is not successfull (false),
             * the newLayer is set to null and not added to the map
             */
            return plugin.add(newLayer) ? newLayer : null;

        },

        /*
         * Ask user for connectorName if not specified
         */
        update:function(layerDescription, callback) {

            /*
             * Ask for mandatory connectorName
             */
            var i,l,name,list = [],
            connectors = msp.plugins["Catalog"].options["connectors"] || [];

            /**
             * Parse available connectors list
             */
            for (i = 0, l = connectors.length; i < l;i++) {

                /*
                 * Retrieve the connector
                 */
                name = connectors[i].name;

                list.push({
                    title:msp.Util._(name),
                    value:msp.Util._(name)
                });
            }

            msp.Util.askFor(msp.Util._("Catalog") + ' : ' + layerDescription.title, msp.Util._("What is the format for this catalog ?"), "list", list, function(v){
                layerDescription["connectorName"] = v;
                layerDescription["groupName"] = "Catalogs";
                callback(layerDescription);
            });  

            return true;

        },

        /*
         * Return human readable specific info from
         * input layer description
         */
        getInfo:function(layerDescription) {
            return [
            ["Connector", msp.Util._(layerDescription["connectorName"])]
            ];
        },

        /**
         * MANDATORY
         * Compute an unique mspID based on layerDescription
         */
        getMspID:function(layerDescription) {
            return msp.Util.crc32(layerDescription.type + layerDescription.connectorName + (msp.Util.repareUrl(layerDescription.url) || ""));
        },
        
        /**
         * Set layer time filter
         * 
         * @input <OpenLayers.Layer> layer : target layer
         * @input <array> interval : interval (see TimeLine.js)
         */
        setTime:function(layer, interval) {
            
            var sc;
            
            if (layer && layer["_msp"]) {
                sc = layer["_msp"].searchContext;
                if (sc) {
                    
                    /*
                     * Update time interval
                     */
                    sc.setTime(interval);
                    
                    /*
                     * Launch search
                     */
                    sc.search();
                }
            }
        }
    }
})(window.msp, window.msp.Map);
