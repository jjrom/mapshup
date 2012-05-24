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
 * GeoRSS layer type
 */
(function (msp, Map){
    
    Map.layerTypes["Atom"] = {

        /**
         * Layer clusterization is set by default
         */
        clusterized:true,

        /**
         * MANDATORY
         */
        icon:"vector.png",

        /**
         * MANDATORY
         */
        isFile:true,

        /**
         * Set default styleMap
         */
        hasStyleMap:true,

        /**
         * MANDATORY
         */
        selectable:true,

        /**
         * MANDATORY
         * {
         *      type:"Atom",
         *      title:"Toulouse (Points)",
         *      url:"/server/plugins/tripsntracks/getFeatures.php?type=point",
         *      data: // A valid Atom data structure
         *      hidden:false,
         *      clusterized:true,
         *      hasIconAttribute:false // if true assume that features got a 'icon' attribute
         * }
         *
         */
        add: function(layerDescription, options) {

            var newLayer,self = this;
            
            /*
             * Set title
             */
            layerDescription.title = msp.Util.getTitle(layerDescription);
            
            /*
             * Cluster strategy
             */
            if (options["_msp"].clusterized && !options.hasOwnProperty("strategies")) {
                options.strategies = [new OpenLayers.Strategy.Cluster(new OpenLayers.Strategy.Cluster(Map.clusterOpts))];
            }

            /*
             * Layer creation
             */
            newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);

            /*
             * If layerDescription.data is set, the GeoJSON stream is directly
             * read from data description
             */
            if (layerDescription.hasOwnProperty("data")) {
                self.load(layerDescription.data, layerDescription, newLayer);
            }
            /*
             * Otherwise, read data asynchronously from url
             */
            else {
                
                /*
                 * First set the isLoaded status to false to avoid
                 * annoying popup telling that the layer is added before
                 * the data has been effectively retrieve from server
                 */
                newLayer['_msp'].isLoaded = false;
                
                /*
                 * Add a featuresadded event
                 */
                newLayer.events.register("featuresadded", newLayer, function() {
                    Map.onFeaturesAdded(this);
                });
                
                /**
                 * Retrieve FeatureCollection from server
                 */
                $.ajax({
                    url:msp.Util.proxify(msp.Util.getAbsoluteUrl(layerDescription.url)),
                    layer:newLayer,
                    async:true,
                    success:function(data) {
                        self.load(data, layerDescription, this.layer);
                    }
                });
                
            }
            
            return newLayer;

        },
        
        /*
         * Load Atom data from a stream
         */
        load: function(data, layerDescription, layer) {
            
            var features;
            
            /*
             * Atom feed is an XML feed
             */
            try {
                /*
                 * By default, Atom stream is assume to be in EPSG:4326 projection
                 * unless srs is specified in EPSG:3857 or EPSG:900913
                 */
                if (layerDescription.srs === "EPSG:3857" || layerDescription.srs === "EPSG:900913") {
                    features = new OpenLayers.Format.Atom().read(data);
                }
                else {
                    features = new OpenLayers.Format.Atom({
                        internalProjection:Map.map.projection,
                        externalProjection:Map.epsg4326
                    }).read(data);
                }
                
            }
            catch(e) {
                msp.Util.message(layer.name + " : " + msp.Util._("Error"), -1);
                msp.Map.removeLayer(layer, false);
            }
            
            if (features) {
                
                /*
                 * No features then remove layer
                 */
                if (features.length === 0) {
                    msp.Util.message(msp.Util._(layer.name)+ " : " + msp.Util._("No result"));
                    msp.Map.removeLayer(layer, false);
                }
                else {
                    
                    /*
                     * Tell user that layer is added
                     */
                    msp.Util.message(msp.Util._("Added")+ " : " + msp.Util._(layer.name));

                    /*
                     * Set layer isLoaded status to true
                     */
                    layer['_msp'].isLoaded = true;

                    /*
                     * Add features to layer
                     */
                    layer.addFeatures(features);
                    
                    /*
                     * Zoom on layer after load
                     */
                    Map.Util.zoomOnAfterLoad(layer);

                    /*
                     * Reindex layer
                     */
                    Map.Util.updateIndex(layer);
                    
                }
            
            }

        }
        
    }

})(window.msp, window.msp.Map);
