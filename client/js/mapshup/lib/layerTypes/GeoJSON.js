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
(function (M, Map){
    
    Map.layerTypes["GeoJSON"] = {

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
         *      type:"GeoJSON",
         *      title:"Toulouse (Points)",
         *      url:"/server/plugins/tripsntracks/getFeatures.php?type=point",
         *      data: // A valid GeoJSON data structure
         *      hidden:false,
         *      clusterized:true,
         *      hasIconAttribute:false // if true assume that features got a 'icon' attribute
         * }
         *
         */
        add: function(layerDescription, options, urlModifier) {

            var newLayer,self = this;
            
            /*
             * Set title
             */
            layerDescription.title = M.Util.getTitle(layerDescription);
            
            /*
             * Cluster strategy
             */
            if (options["_M"].clusterized && !options.hasOwnProperty("strategies")) {
                options.strategies = [new OpenLayers.Strategy.Cluster(Map.clusterOpts)];
            }
            
            /*
             * Layer creation
             */
            newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);

            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {

                /*
                * Tell mapshup that features were added
                */
                Map.events.trigger("layersend", {
                    action:"features",
                    layer:newLayer
                });        

            });
            
            /*
             * If layerDescription.data is set, the GeoJSON stream is directly
             * read from data description
             */
            if (layerDescription.hasOwnProperty("data")) {
                if (!self.load({
                    data:layerDescription.data,
                    layerDescription:layerDescription, 
                    layer:newLayer
                })) {
                //M.Map.removeLayer(newLayer, false);
                }
            }
            /*
             * Otherwise, read data asynchronously from url
             */
            else if (layerDescription.url) {
                
                /*
                 * First set the isLoaded status to false to avoid
                 * annoying popup telling that the layer is added before
                 * the data has been effectively retrieve from server
                 */
                newLayer['_M'].isLoaded = false;
                
                self.refresh(newLayer, urlModifier);
                
            }
            
            return newLayer;

        },
        
        /*
         * Load GeoJSON data from a stream
         */
        load: function(options) {
            
            var l,p,features;
            
            options = options || {};
            
            /*
             * First check if there is no error
             * Otherwise, display results
             */
            if (!options.data || !options.data.features || options.data.error) {
                M.Util.message(options.layer.name + " : " + (options.data ? options.data.error["message"] : "Error"), -1);
                return null;
            }
            else {
                
                l = options.data.features.length;
                p = options.layer['_M'].pagination || {};
                
                /*
                 * No features
                 */
                if (l === 0) {
                    M.Util.message(M.Util._(options.layer.name)+ " : " + M.Util._("No result"));
                    return null;
                }
                else {
                    
                    /*
                     * Set layer isLoaded status to true
                     */
                    options.layer['_M'].isLoaded = true;
                    
                    /*
                     * Pagination
                     */
                    if (p.numRecordsPerPage && p.nextRecord) {
                        
                        /*
                        * Avoid case where server don't take care of numRecordsPerPage value
                        */
                        if (l > p.numRecordsPerPage.value) {
                            p.numRecordsPerPage.value = l;
                        }
                        
                        /*
                        * Set nextRecord new value
                        */
                        p.nextRecord.value = p.nextRecord.value + l;

                        /*
                        * Update the totalResults value
                        * If data.totalResults is not set then set totalResults to the number of features
                        */
                        p.totalResults = options.data.hasOwnProperty("totalResults") ? options.data.totalResults : l;
                        
                    }
                    
                    /*
                     * By default, GeoJSON stream is assume to be in EPSG:4326 projection
                     * unless srs is specified in EPSG:3857 or EPSG:900913
                     */
                    if (options.layerDescription && (options.layerDescription.srs === "EPSG:3857" || options.layerDescription.srs === "EPSG:900913")) {
                        features = new OpenLayers.Format.GeoJSON().read(options.data);
                    }
                    else {
                        features = new OpenLayers.Format.GeoJSON({
                            internalProjection:Map.map.projection,
                            externalProjection:Map.pc
                        }).read(options.data);
                    }
                    
                    options.layer.addFeatures(features);
                    
                    /*
                     * Zoom on new added features otherwise zoom on layer
                     */
                    if (options.zoomOnNew) {
                        Map.Util.Feature.zoomOn(features);
                    }
                    else {
                        Map.Util.zoomOn(options.layer);
                    }
                    
                }
                
            }
            
            return features;

        },
        
        /*
         * Load next page of features
         */
        next: function(layer) {
            
            var self = this,
            p = layer["_M"].pagination,
            ld = layer["_M"].layerDescription;
            
            /*
             * Paranoid mode
             */
            if (!p) {
                return false;
            }
            
            /*
             * We are already at the last page
             * Do nothing and returns false
             */
            if (p.totalResults && (p.nextRecord.value > p.totalResults)) {
                return false;
            }

            /*
            * Retrieve FeatureCollection from server
            */
            M.Util.ajax({
                url:M.Util.proxify(M.Util.paginate(ld.url, p)),
                layer:layer,
                async:true,
                dataType:"json",
                success:function(data) {
                    self.load({
                        data:data,
                        layerDescription:ld, 
                        layer:this.layer
                    });
                }
            },{
                title:M.Util._("Retrieve features"),
                cancel:true 
            });

            return true;
           
        },
     
        /*
         * Refresh layer
         */
        refresh: function(layer, urlModifier) {
            
            var p, layerDescription, url, self = this;
            
            /*
             * Paranoid mode
             */
            if (!layer || !layer["_M"]) {
                return false;
            }
            
            layerDescription = layer["_M"].layerDescription;
            
            /*
             * Refresh pagination
             */
            p = layer['_M'].pagination || {};
            if (p.nextRecord) {
                p.nextRecord.value = 1;
            }
            
            /*
             * If urlModifier is set, add it before layerDescription.url
             * (See Pleiades.js layerType to understand why)
             */
            url = urlModifier ? M.Util.getAbsoluteUrl(urlModifier + encodeURIComponent(layerDescription.url + M.Util.abc)) : layerDescription.url;

            $.ajax({
                url:M.Util.proxify(M.Util.paginate(url, layer["_M"].pagination)),
                layer:layer,
                async:true,
                dataType:"json",
                success:function(data) {
                    
                    /*
                     * First remove features
                     */
                    this.layer.destroyFeatures();
                    
                    if (!self.load({
                        data:data, 
                        layerDescription:layerDescription, 
                        layer:this.layer
                    })) {
                            
                        /*
                        * Tell mapshup that layer is loaded
                        */
                        this.layer["_M"].isLoaded = true;
                            
                        /*
                        * Tell mapshup that no features were added
                        */
                        Map.events.trigger("layersend", {
                            action:"features",
                            layer:this.layer
                        });
                    }
                }
            });
            
            return true;
        }
        
    };
    
})(window.M, window.M.Map);