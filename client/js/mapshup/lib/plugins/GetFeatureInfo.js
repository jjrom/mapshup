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
 *
 * Plugin GetFeatureInfo
 *
 * @param {Mapshup} M
 */
(function(M) {

    M.Plugins.GetFeatureInfo = function() {

        /*
         * Only one GetFeatureInfo object instance is created
         */
        if (M.Plugins.GetFeatureInfo._o) {
            return M.Plugins.GetFeatureInfo._o;
        }

        /**
         * GetFeatureInfo layer is used to display a cross
         * on the clicke point
         */
        this.layer = null;

        /**
         * Init plugin
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var getFeatureInfoLayer, self = this;

            /*
             * Init options
             */
            self.options = options || {};
            $.extend(self.options, {
                
                /* Response format mimetype of GetFeatureInfo request - default is 'text/plain' */
                responseFormat: options.responseFormat ? options.responseFormat : 'text/plain',
                
                /* 
                 * Callback function to call when successfully get a GetFeatureInfo request
                 * This function should take two parameters (identifier, data) where identifier is the
                 * identifier of the layer (for instance the 'layers' parameter value for WMS layers) and
                 * data is the GetFeatureInfo result in responseFormat format
                 */
                callback: options.callback && typeof options.callback === 'function' ? options.callback : self.callback
                
            });

            /*
             * This plugin only work if WMS layerType is defined
             */
            if (!M.Map.layerTypes["WMS"]) {
                return false;
            }

            /**
             * Create generic getFeatureInfoLayer
             */
            getFeatureInfoLayer = new OpenLayers.Layer.Vector("GetFeatureInfo", {
                displayInLayerSwitcher: false,
                styleMap: new OpenLayers.StyleMap({
                    'default': {
                        externalGraphic: M.Util.getImgUrl("plus.png"),
                        graphicXOffset: -11,
                        graphicYOffset: -11,
                        graphicWidth: 19,
                        graphicHeight: 19
                    }
                })
            });

            self.layer = M.Map.addLayer({
                type: "Generic",
                title: getFeatureInfoLayer.name,
                layer: getFeatureInfoLayer,
                unremovable: true,
                MLayer: true,
                selectable: true,
                /** By default, getFeatureInfoLayer is hidden */
                hidden: false
            });

            /*
             * Add "GetFeatureInfo" in menu item
             */
            if (M.menu) {
                M.menu.add([
                    {
                        id: M.Util.getId(),
                        ic: "info.png",
                        ti: "Info",
                        tt: "Get feature info",
                        cb: function() {
                            self.getFeatureInfo(M.menu.lonLat);
                        }
                    }]);
            }

            return self;

        };

        /**
         * Send a getFeatureInfo request
         * 
         * @param {OpenLayers.LonLat} lonLat
         */
        this.getFeatureInfo = function(lonLat) {

            if (!lonLat) {
                return false;
            }

            /**
             * Set clicked point as the new feature within getFeatureInfoLayer
             */
            this.layer.destroyFeatures();
            this.layer.addFeatures(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat)));

            /*
             * Call GetFeatureInfo on each queryable WMS layers
             */
            var results = M.Map.layerTypes["WMS"].getFeatureInfo(lonLat, {
                responseFormat: this.options.responseFormat,
                callback: this.options.callback
            });
            
            /*
             * results array contains the list of WMS queryied layers
             * [
             *  {
             *      identifier: // WMS 'layers' parameter value is the unique identifier
             *      name : // layer name for (eventual) user friendly display
             *  },
             *  ...
             * ]
             *  
             */
            if (results.length === 0) {
                M.Util.message(M.Util._("No information available here"));
            }
            
            return true;

        };

        /**
         * Callback function to retrieve GetFeatureInfo AJAX call results
         * 
         * @param {String} identifier : // layer identifier of the getFeatureInfo callback
         *                              (i.e. the WMS 'layers' parameter value)
         *                              
         * @param {String} data : // GetFeatureInfo result
         */
        this.callback = function(identifier, data) {
            M.Util.message('<h1>' + identifier + '</h1>' + '<description>' + data + '</description>', -1);
        };

        /*
         * Set unique instance
         */
        M.Plugins.GetFeatureInfo._o = this;

        return this;

    };
})(window.M);