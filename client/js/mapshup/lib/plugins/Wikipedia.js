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
 * Plugin: Wikipedia
 *
 * Add a Wikipedia layer that display wikipedia articles
 * as vector features
 */
(function(msp) {
    
    msp.Plugins.Wikipedia = function() {
        
        /*
         * Only one Wikipedia object instance is created
         */
        if (msp.Plugins.Wikipedia._o) {
            return msp.Plugins.Wikipedia._o;
        }
        
        /*
         * Initialization
         */
        this.init = function (options) {

            var self = this;
            
            /*
             * Init options
             */
            self.options = options || {};

            /*
             * Options default values
             */
            $.extend(self.options,{
                number:self.options.number || 50,
                hidden:self.options.hidden || false,
                minimumZoomLevel:self.options.minimumZoomLevel || 9,
                searchUrl:self.options.searchUrl || "http://ws.geonames.org/wikipediaBoundingBoxJSON?"
            });
            
            /*
             * Get the searchUrl value in the plugin options
             * This is mandatory.
             */
            if (!self.options.searchUrl) {
                return null;
            }

            /*
             * Set the Wikipedia layer
             */
            self.layer = msp.Map.addLayer({
                type:"Wikipedia",
                title:"Wikipedia",
                initialLayer:true,
                hidden:self.options.hidden
            });

            /*
             * When Wikipedia layer switch from hidden to visible
             * make sure to relaunch a search on the new location
             */
            self.layer.events.register('visibilitychanged', self.layer, function() {
                if (this.getVisibility()) {
                    self.onMoveEnd(this.map, self);
                }
            });

            /*
             * Set centerLonLat to the current map center lon/lat
             */
            self.centerLonLat = msp.Map.map.getCenter();

            /*
             * Set zoom level to current map zoom level
             */
            self.zoom = msp.Map.map.getZoom();

            /*
             * Register events
             */
            msp.Map.events.register("moveend", self, self.onMoveEnd);
            
            msp.Map.events.register("layersend", self, function(action, layer, scope) {

                /*
                 * Each time a layer is added make sure Wikipedia is on top
                 */
                if (action === "add" && scope.layer) {
                    msp.Map.Util.setLayerOnTop(scope.layer);
                }
            });

            return this;
        };
      
        /**
         * Wikipedia is requested each time map change
         */
        this.onMoveEnd = function(map, scope) {

            /**
             * To avoid overload, getItems method
             * is called only if the new map extent differs
             * from the current bounds by at least the quarter
             * of the map size in pixel reference system
             */
            if (scope.layer && scope.layer.getVisibility()) {
                var centerPixel = map.getPixelFromLonLat(map.getCenter()),
                    newCenterPixel = map.getPixelFromLonLat(scope.centerLonLat),
                    newZoom = map.getZoom();

                /**
                 * If the map is sufficiently zoomed, then load Wikipedia stuff...
                 */
                if (newZoom >= scope.options.minimumZoomLevel) {
                    if (scope.zoom != newZoom || Math.abs(centerPixel.x - newCenterPixel.x) > ($('#Map').width() / 4) || Math.abs(centerPixel.y - newCenterPixel.y) > ($('#Map').height() / 4)) {
                        scope.getItems(msp.Map.Util.p2d(map.getExtent()));
                        scope.zoom = newZoom;
                        scope.centerLonLat = map.getCenter();
                    }
                }
                /**
                 * ...else trash it all :)
                 */
                else {
                    scope.layer.destroyFeatures();
                }
            }
        };

        /**
         * Get articles from wikipedia
         */
        this.getItems = function(bbox) {

            var self = this;
            
            /**
             * Set loading information
             */
            msp.Map.events.trigger("loadstart", self.layer);

            /**
             * Send ajax url to the searchUrl service
             */
            $.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(self.options.searchUrl)+"maxRows="+self.options.number+"&lang="+msp.Config.i18n.lang+"&south="+bbox.bottom+"&north="+bbox.top+"&east="+bbox.right+"&west="+bbox.left),
                async:true,
                dataType:"json",
                success: function(obj) {
                    
                    /**
                     * Obvious check : does obj a valid geonames answer with results
                     */
                    if (obj && obj.geonames) {

                        /**
                         * First remove old features
                         */
                        self.layer.destroyFeatures();

                        /**
                         * Roll over obj features and add it to the
                         * fresh layer
                         */
                        for (var i = 0, l = obj.geonames.length; i < l; i++) {
                            var wikipediaURL = obj.geonames[i]['wikipediaUrl'];
                            if (wikipediaURL.indexOf('http') === -1) {
                                wikipediaURL = 'http://'+wikipediaURL;
                            }
                            var innerHTML = "";
                            if (obj.geonames[i]['summary'] !== undefined) {
                                innerHTML = '<p>'+decodeURIComponent(obj.geonames[i]['summary'])+'</p><br/>';
                            }
                            if (obj.geonames[i]['thumbnailImg']) {
                                var thumbnailURL = obj.geonames[i]['thumbnailImg'];
                                if (thumbnailURL.indexOf('http') === -1) {
                                    thumbnailURL = 'http://'+thumbnailURL;
                                }
                                innerHTML += '<div align="center"><img src="'+thumbnailURL+'"></div><br/>';
                            }
                            var pointLatLon = msp.Map.Util.d2p(new OpenLayers.Geometry.Point(obj.geonames[i]['lng'],obj.geonames[i]['lat'])),
                                feature = new OpenLayers.Feature.Vector(pointLatLon,
                            {
                                name:decodeURIComponent(obj.geonames[i]['title']),
                                url:"http://"+obj.geonames[i]['wikipediaUrl'],
                                description:innerHTML
                            });

                            self.layer.addFeatures(feature);

                        }
                    }
                    msp.Map.events.trigger("loadend", self.layer);
                },
                error: function(e) {
                    msp.Map.events.trigger("loadend", self.layer);
                }
            });

        };
      
        /*
         * Set unique instance
         */
        msp.Plugins.Wikipedia._o = this;
        
        return this;
    };
    
})(window.msp);