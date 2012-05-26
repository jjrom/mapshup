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
    
    Map.layerTypes["GeoRSS"] = {

        /**
         * MANDATORY
         */
        icon:"georss.png",

        /**
         * MANDATORY
         */
        removeOnEmpty:true,

        /**
         * MANDATORY
         */
        selectable:true,

        /**
         * Feature attribute url name to be resolved
         */
        resolvedUrlAttributeName:'link',

        /**
         * MANDATORY
         *
         * layerDescription = {
         *      type:"GeoRSS",
         *      title:,
         *      url:,
         *      icon:
         *  };
         */
        add: function(layerDescription, options) {

            var newLayer;
            
            /*
             * Set title
             */
            layerDescription.title = msp.Util.getTitle(layerDescription);
            
            /**
             * Input "options" modification
             */
            options["_msp"].selectable = msp.Util.getPropertyValue(options, "selectable", this.selectable);

            /*
             * Extend options object with Flickr specific properties
             */
            $.extend(options,
            {
                projection:Map.pc,
                styleMap:new OpenLayers.StyleMap({
                    'default' :  new OpenLayers.Style({
                        externalGraphic : options["_msp"].icon,
                        graphicWidth:24,
                        graphicHeight:24
                    }),
                    'select' : new OpenLayers.Style({
                        externalGraphic : msp.Util.getImgUrl('rss_select.png'),
                        graphicWidth:24,
                        graphicHeight:24
                    })
                }),
                protocol: new OpenLayers.Protocol.HTTP({
                    url:msp.Util.getAbsoluteUrl(msp.Config["general"].rssToGeoRSSServiceUrl + encodeURIComponent(layerDescription.url) + msp.Util.abc),
                    format:new OpenLayers.Format.GeoRSS()
                }),
                strategies:options.strategies || []
            }
            );

            /*
             * Set a fixed strategy to load GeoRSS
             */
            options.strategies.push(new OpenLayers.Strategy.Fixed());

            /*
             * Layer creation
             */
            newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);
            
            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {
                Map.onFeaturesAdded(this);
            });
            
            return newLayer;
            
        }
    }

})(window.msp, window.msp.Map);
