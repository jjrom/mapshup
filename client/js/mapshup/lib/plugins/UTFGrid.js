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
/*
 * UTFGrid plugin.
 */
(function(M) {

    M.Plugins.UTFGrid = function() {

        /*
         * Only one UTFGrid object instance is created
         */
        if (M.Plugins.UTFGrid._o) {
            return M.Plugins.UTFGrid._o;
        }

        /*
         * Active status
         */
        this.active = false;

        /*
         * Store last hilited grid object
         */
        this._current = {};

        /*
         * List of UTFGrid layers
         */
        this.layers = [];

        /*
         * True to display geometry if available
         */
        this.useGeo = false;

        /*
         * Init plugin
         */
        this.init = function(options) {

            var self = this;

            /**
             * Init options
             */
            self.options = options || {};

            /*
             * Track layersend events to add/remove UTFGrid layers
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

                var i, l;

                /*
                 * Only process UTFGrid layers
                 */
                if (!layer || !layer["_M"] || !layer["_M"].layerDescription) {
                    return false;
                }

                if (layer["_M"].layerDescription["type"] !== "UTFGrid") {
                    return false;
                }

                if (action === "add") {
                    scope.layers.push(layer);
                }
                else if (action === "remove") {
                    for (i = 0, l = scope.layers.length; i < l; i++) {
                        if (scope.layers[i].id === layer.id) {
                            scope.layers.splice(i, 1);
                            break;
                        }
                    }
                }

                return true;

            });

            /*
             * Show pointer on mousemove
             */
            M.Map.map.events.register('mousemove', M.Map.map, function(e) {

                /*
                 * If UTFGrid is deactivated do nothing
                 */
                if (!self.active) {
                    return false;
                }

                /*
                 * Never display UTFGrid info if a vector feature is already hilited
                 */
                if (M.Map.$featureHilite.attr("hilited") === "hilited") {

                    /* Important - reset last hilited object if any */
                    self._current = {};

                    return false;
                }

                var data = self.getData(M.Map.map.getLonLatFromPixel(M.Map.mousePosition));

                data.length > 0 ? M.$map.addClass('pointer') : M.$map.removeClass('pointer');
                self.getInfo(data);
                
                return true;

            });

            /*
             * Track layersend events to add/remove UTFGrid layers
             */
            M.Map.events.register("mapclicked", self, function(event, scope) {
                
                var bbox, data = scope.getData(M.Map.map.getLonLatFromPixel(M.Map.mousePosition));
               
                /*
                 * Zoom on first object if bbox is defined
                 */
                if (data.length > 0) {
                    bbox = data[0].attributes.data.BBOX ||  data[0].attributes.data.bbox;
                    if (bbox) {
                        M.Map.map.zoomToExtent(M.Map.Util.getProjectedBounds(bbox));
                    }
                }
                
            });

            /*
             * Activate UTFGrid during startup
             */
            self.activate(true);

            return self;

        };

        /*
         * Activate or deactivate UTFGrid detection
         */
        this.activate = function(b) {
            this.active = b;
            if (!b) {
                this.activateGeo(false);
            }
            return b;
        };

        /*
         * Activate or deactivate UTFGrid detection
         */
        this.activateGeo = function(b) {

            var self = this;

            /*
             * Create overlay polygon layer to display geometry on hover
             */
            if (b && !self.layer) {

                self.layer = new OpenLayers.Layer.Vector("__LAYER_UTFGRID__", {
                    projection: M.Map.sm,
                    displayInLayerSwitcher: false,
                    styleMap: new OpenLayers.StyleMap({
                        'default': {
                            strokeColor: 'white',
                            strokeWidth: 1,
                            fillColor: 'yellow',
                            fillOpacity: 0.2
                        }
                    })
                });

                /**
                 * Add Drawing layer to Map object
                 */
                M.Map.addLayer({
                    type: "Generic",
                    title: self.layer.name,
                    unremovable: true,
                    MLayer: true,
                    layer: self.layer
                });
            }

            /*
             * Empty overlay polygon layer
             */
            if (!b && self.layer) {
                self.layer.destroyFeatures();
            }

            self.useGeo = b;

            return b;

        };

        /*
         * Display items info
         * 
         * @param {Array} data : structure is
         *              [
         *                  {
         *                      layer: // The parent UTFGrid layer
         *                      attributes: {
         *                          id: // This is the key identifier 
         *                          data: // This is the 'data' bloc read within the UTFGrid                              
         *                      }
         *                  },
         *                  ...
         *              ]
         */
        this.getInfo = function(data) {

            var k, keys, item, o, c = "", features = [], self = this;

            /*
             * Roll over data
             */
            for (item in data) {

                o = data[item];
                o.attributes = o.attributes || {};
                o.modifiers = o.layer["_M"].layerDescription["info"] || {};
                keys = o.attributes.data || null;

                if (keys) {

                    /*
                     * Optimize !
                     * If new keys is the same as the one already
                     * displayed do not reprocess things
                     */
                    if (JSON.stringify(keys) === JSON.stringify(self._current)) {
                        M.Map.$featureHilite.show();
                        return false;
                    }

                    if (o.modifiers.title) {
                        c = M.Util.parseTemplate(o.modifiers.title, keys, o.modifiers.keys);
                    }
                    else {

                        /*
                         * Roll over data key
                         */
                        for (k in keys) {
                            c += '<p>' + k + ' : ' + keys[k] + '</p>';
                        }

                    }

                    /*
                     * Add geometry
                     */
                    if (self.useGeo && keys["wkt"]) {
                        features.push(new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(keys["wkt"])));
                    }

                    self._current = keys;
                }

            }

            if (c !== "") {

                /*
                 * Display tooltip
                 */
                M.Map.$featureHilite.html(c).show();

                /*
                 * Display geometry
                 */
                if (self.layer && features.length > 0) {
                    self.layer.destroyFeatures();
                    self.layer.addFeatures(features);
                }

                return true;
            }

            /*
             * Hide container
             */
            if (self.layer) {
                self.layer.destroyFeatures();
            }
            self._current = {};
            M.Map.$featureHilite.hide();

            return false;

        };

        /*
         * Return an array of data under the mouse pointer.
         * Data are read from all mapshup UTFGrids layers
         * 
         * @param {OpenLayers.LonLat} lonLat
         * @return {Array} data : structure is
         *              [
         *                  {
         *                      layer: // The parent UTFGrid layer
         *                      attributes: {
         *                          id: // This is the key identifier 
         *                          data: // This is the 'data' bloc read within the UTFGrid                              
         *                      }
         *                  },
         *                  ...
         *              ]
         */
        this.getData = function(lonLat) {

            var i, l, z, mz, attributes, layer, data = [];

            /*
             * If UTFGrid is deactivated do nothing
             */
            if (!lonLat) {
                return data;
            }

            /*
             * Roll over UTFGrid layers
             */
            for (i = 0, l = this.layers.length; i < l; i++) {

                layer = this.layers[i];

                /*
                 * Do not send request outside of zoom levels and location bounds
                 */
                z = layer["_M"].z;
                mz = M.Map.map.getZoom();
                if ((mz >= z[0] && mz <= z[1]) && layer["_M"].bounds.containsLonLat(lonLat)) {

                    attributes = layer.getFeatureInfo(lonLat);

                    /*
                     * Only return true data (i.e. if key id is "" there is no data)
                     */
                    if (attributes && attributes.id) {
                        data.push({
                            layer: layer,
                            attributes: attributes
                        });
                    }

                }

            }

            return data;

        };

        /*
         * Set unique instance
         */
        M.Plugins.UTFGrid._o = this;

        return this;
    };
})(window.M);