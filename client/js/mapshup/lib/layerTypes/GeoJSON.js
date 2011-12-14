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
         *      hidden:false,
         *      clusterized:true,
         *      hasIconAttribute:false // if true assume that features got a 'icon' attribute
         * }
         *
         */
        add: function(layerDescription, options, urlModifier) {

            /**
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);

            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {
                Map.onFeaturesAdded(this);
            });

            /*
             * If urlModifier is set, add it before layerDescription.url
             * (See Pleiades.js layerType to understand why)
             */
            var url = urlModifier ? urlModifier + escape(layerDescription.url + msp.Util.abc) : layerDescription.url;

            /**
             * Retrieve FeatureCollection from server
             */
            $.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(url)),
                layer:newLayer,
                async:true,
                dataType:"json",
                success:function(data) {

                    /*
                     * By default, GeoJSON stream is assume to be in EPSG:4326 projection
                     * unless srs is specified in EPSG:3857 or EPSG:900913
                     */
                    if (layerDescription.srs === "EPSG:3857" || layerDescription.srs === "EPSG:900913") {
                        this.layer.addFeatures(new OpenLayers.Format.GeoJSON().read(data));
                    }
                    else {
                        this.layer.addFeatures(new OpenLayers.Format.GeoJSON({
                            internalProjection:Map.map.projection,
                            externalProjection:Map.epsg4326
                        }).read(data));
                    }

                    /*
                     * Zoom on layer after load
                     */
                    Map.Util.zoomOnAfterLoad(this.layer);
                   
                    /*
                     * Reindex layer
                     */
                    Map.Util.updateIndex(this.layer);

                }
            });

            return newLayer;

        }
    }

})(window.msp, window.msp.Map);
