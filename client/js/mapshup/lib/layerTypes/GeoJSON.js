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

            var url,newLayer,self = this;
            
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
                if (!self.load(layerDescription.data, layerDescription, newLayer)) {
                    msp.Map.removeLayer(newLayer, false);
                }
                else {

                    /*
                     * Tell user that layer is added
                     */
                    msp.Util.message(msp.Util._("Added")+ " : " + msp.Util._(newLayer.name));

                }
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
                    
                    /*
                    * Tell mapshup that features were added
                    */
                    Map.events.trigger("layersend", {
                        action:"features",
                        layer:newLayer
                    });
                    
                });
                
                /*
                 * If urlModifier is set, add it before layerDescription.url
                 * (See Pleiades.js layerType to understand why)
                 */
                url = urlModifier ? urlModifier + encodeURIComponent(layerDescription.url + msp.Util.abc) : layerDescription.url;

                $.ajax({
                    url:msp.Util.proxify(msp.Util.paginate(url, newLayer["_msp"].pagination)),
                    layer:newLayer,
                    async:true,
                    dataType:"json",
                    success:function(data) {
                        if (!self.load(data, layerDescription, this.layer)) {
                            msp.Map.removeLayer(this.layer, false);
                        }
                        else {
                            
                            /*
                             * Tell user that layer is added
                             */
                            msp.Util.message(msp.Util._("Added")+ " : " + msp.Util._(this.layer.name));

                        }
                    }
                });
                
            }
            
            return newLayer;

        },
        
        /*
         * Load GeoJSON data from a stream
         */
        load: function(data, layerDescription, layer) {
            
            var l,p;
            
            /*
             * First check if there is no error
             * Otherwise, display results
             */
            if (!data || data.error) {
                msp.Util.message(layer.name + " : " + (data ? data.error["message"] : "Error"), -1);
                return false
            }
            else {
                
                l = data.features.length;
                p = layer['_msp'].pagination;
                
                /*
                 * No features then remove layer
                 */
                if (l === 0) {
                    msp.Util.message(msp.Util._(layer.name)+ " : " + msp.Util._("No result"));
                    return false;
                }
                else {
                    
                    /*
                     * Set layer isLoaded status to true
                     */
                    layer['_msp'].isLoaded = true;
                    
                    /*
                     * Pagination
                     */
                    if (p) {
                        
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
                        p.totalResults = data.hasOwnProperty("totalResults") ? data.totalResults : l;
                        
                    }
                     
                    /*
                     * By default, GeoJSON stream is assume to be in EPSG:4326 projection
                     * unless srs is specified in EPSG:3857 or EPSG:900913
                     */
                    if (layerDescription.srs === "EPSG:3857" || layerDescription.srs === "EPSG:900913") {
                        layer.addFeatures(new OpenLayers.Format.GeoJSON().read(data));
                    }
                    else {
                        layer.addFeatures(new OpenLayers.Format.GeoJSON({
                            internalProjection:Map.map.projection,
                            externalProjection:Map.pc
                        }).read(data));
                    }

                    /*
                     * Zoom on layer
                     */
                    Map.Util.zoomOn(layer);

                    /*
                     * Reindex layer
                     */
                    Map.Util.updateIndex(layer);
                    
                }
                
            }
            
            return true;

        },
        
        /*
         * Load next page of features
         */
        next: function(layer) {
            
            var self = this,
            p = layer["_msp"].pagination,
            ld = layer["_msp"].layerDescription;
            
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
            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.paginate(ld.url, p)),
                layer:layer,
                async:true,
                dataType:"json",
                success:function(data) {
                    self.load(data, ld, this.layer);
                }
            },{
                title:msp.Util._("Retrieve features"),
                cancel:true 
            });

            return true;
           
        }
        
    }

})(window.msp, window.msp.Map);