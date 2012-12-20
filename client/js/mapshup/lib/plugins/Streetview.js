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
 *
 * Google Streetview plugin
 * 
 */
(function(M) {
    
    M.Plugins.Streetview = function() {
        
        /*
         * Only one Streetview object instance is created
         */
        if (M.Plugins.Streetview._o) {
            return M.Plugins.Streetview._o;
        }
        
        /**
         * The streetview object
         */
        this.svw = null;
        
        /**
         * The service object
         * used to determine if streetview is available
         */
        this.service = null;
        
        /**
         * Init plugin
         */
        this.init = function(options) {
            
            var self = this;
            
            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Check if google.maps library is loaded
             * If not, plugin is discarded
             */
            if (typeof google !== "object" || google.maps === undefined) {
                M.Util.message(M.Util._("Google libraries not loaded. Streetview is disabled"));
                return null;
            }

            /*
             * Add "Streetview" item in menu
             */
            if (M.menu) {
                M.menu.add([
                {
                    id:M.Util.getId(),
                    ic:"streetview.png",
                    ti:"Streetview",
                    cb:function() {
                        
                        /*
                         * Set lonlat to new position
                         */
                        self.lonlat = M.Map.Util.p2d(M.menu.lonLat.clone());
                        
                        /*
                         * Activate panel item
                         */
                        M.southPanel.show(self.panelItem);
                        
                    }
                }
                ]);
            }
            
            /*
             * Create a StreetViewService to be able to check
             * if a given LatLng has a corresponding panorama
             */
            self.service = new google.maps.StreetViewService();

            /*
             * Register events
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

                /*
                 * Each time a layer is added make sure streetview layer is on top
                 */
                if (action === "add" && scope.svw) {
                    M.Map.Util.setLayerOnTop(scope.svw.M.layer);
                }
                
            });
            
            /*
             * Add Streetview to South Panel
             */
            self.panelItem = M.southPanel.add({
                id:M.Util.getId(),
                icon:M.Util.getImgUrl('streetview.png'),
                title:"Streetview",
                onclose:function() {
                    self.lonlat = null;
                    if (self.svw) {
                        self.svw.setVisible(false);
                    }
                },
                onshow:function() {
                    self.show(self, self.lonlat || M.Map.Util.p2d(M.Map.map.getCenter()));
                }
            });
            
            /*
             * Store container jquery reference
             */
            self.$d = self.panelItem.$content;
            
            /*
             * Store container height
             */
            self.h = self.$d.height();
            
            return self;

        };
        
        /*
         * Initialize streetview container
         */
        this.initSvw = function() {
            
            var self = this,
                lonlat = M.Map.map.getCenter();
            
            /*
             * Streetview is already initialized
             */
            if (self.svw) {
                return self.svw;
            }
            
            /*
             * Initialise Streetview object
             */
            !lonlat ? lonlat = {
                lat:0,
                lon:0
            } : M.Map.Util.p2d(lonlat);

            /*
             * Create StreetViewPanorama
             */
            self.svw = new google.maps.StreetViewPanorama(self.$d[0]);
            
            /*
             * Add M object to streetview object
             */
            self.svw.M = {
                
                /*
                 * Array of events
                 */
                events:[],
                 
                /*
                 * Create streetview layer
                 */
                layer:new OpenLayers.Layer.Vector("__LAYER_STREETVIEW__",{
                    projection:M.Map.pc,
                    displayInLayerSwitcher:false,
                    styleMap:new OpenLayers.StyleMap({
                        'default' :  new OpenLayers.Style({
                            externalGraphic : M.Util.getImgUrl("streetviewarrow.png"),
                            rotation:"${angle}",
                            pointRadius : 32
                        })
                    })
                }),
                
                /*
                 * Streeview layer update function.
                 * This function is called :
                 *  - after a pov change
                 *  - after a yaw change
                 */
                update: function(scope) {
                    var pointLatLon,
                    feature;
                        
                    if (scope.M.layer.getVisibility() && scope.position) {
                        scope.M.layer.destroyFeatures();
                        pointLatLon = new OpenLayers.Geometry.Point(scope.position.lng(), scope.position.lat());
                        M.Map.Util.d2p(pointLatLon);
                        feature = (function (yaw) {
                            return new OpenLayers.Feature.Vector(pointLatLon,
                            {
                                angle:yaw
                            });
                        })(scope.getPov().heading);
                        scope.M.layer.addFeatures(feature);
                    }
                }
                
            };
            
            /*
             * Add streetview layer to mapshup map
             */
            M.Map.addLayer({
                type:"Generic",
                title:self.svw.M.layer.name,
                layer:self.svw.M.layer,
                unremovable:true,
                MLayer:true,
                hidden:true
            });

            /*
             * Update the streeview layer consequently to a position change
             */
            self.svw.M.events.push(google.maps.event.addListener(this.svw, "position_changed", function() {
                this.M.update(this);
            }));

            /*
             * Update the streetview layer consequently to a yaw change
             */
            self.svw.M.events.push(google.maps.event.addListener(this.svw, "pov_changed", function(){
                this.M.update(this);
            }));

            /*
             * Update the streetview layer visibility consequently to a streetview visibility change
             */
            self.svw.M.events.push(google.maps.event.addListener(this.svw, "visible_changed", function(){
                M.Map.Util.setVisibility(this.M.layer, this.visible);
            }));

            /*
             * Trap the error
             */
            self.svw.M.events.push(google.maps.event.addListener(this.svw, "error", function(){
                if (this.errorCode === 603) {
                    M.Util.message(M.Util._("Error : Flash doesn't appear to be supported by your browser"));
                    return;
                }
                if (this.errorCode === 600) {
                    
                    var i,l,event,obj = self.svw.M;

                    /*
                     * Remove the google streetview events
                     */
                    for (i = 0, l = obj.events.length; i < l; i++) {
                        event = obj.events[i];
                        google.maps.event.removeListener(event);
                    }

                    /*
                     * Next remove streetview layer
                     */
                    M.Map.removeLayer(obj.layer, false);

                    /*
                     * Nullify streetview object
                     */
                    delete self.svw;
                    
                    return;
                }
            }));

            /*
             * Set streetview initial position
             */
            self.svw.setPosition(new google.maps.LatLng(lonlat.lat,lonlat.lon));
            
            return self.svw;
        };
        
        /**
         * This method is called by FeatureInfo actions popup
         */
        this.getFeatureActions = function(feature) {

            var self = this;

            return {
                id:M.Util.getId(),
                icon:"streetview.png",
                title:"Streetview",
                tt:"Streetview",
                callback:function() {
                    
                    /*
                     * Set lonlat to new position
                     */
                    self.lonlat = M.Map.Util.p2d(M.Map.featureInfo._ll.clone());
                        
                    /*
                     * Activate panel item
                     */
                    M.southPanel.show(self.panelItem);
                    
                }
            }
        };
        
        /**
         * Show streetview
         *
         * @param lonlat : LonLat in map.displayProjection coordinates
         */
        this.show = function(scope, lonLat) {
            
            /**
             * Create a Google position from lonLat
             */
            var position = new google.maps.LatLng(lonLat.lat,lonLat.lon);
                
            scope.service.getPanoramaByLocation(position, 50, function(result, status) {
                if (status === google.maps.StreetViewStatus.OK) {
                    
                    /*
                     * Be sure that streetview is initialized
                     */
                    if (!scope.svw) {
                        scope.initSvw();
                    }
                    
                    /*
                     * Set streetview object to lonLat position
                     */
                    scope.svw.setVisible(true);
                    scope.svw.setPosition(position);

                }
                else {
                    /**
                     * No Streetview panorama available
                     */
                    M.Util.message(M.Util._("No Streetview data around this point"));
                }
            });

        };
        
        /*
         * Toogle fullscreen/normal mode
         * TODO
         */
        this.toggleFullscreen = function() {

            var self = this,
                position = self.svw.getPosition();
                
            /*
             * Force reload of streetview by switching visibility on/off
             */
            self.svw.setVisible(false);

            /*
             * Fullscreen mode
             */
            if (self.$d.height() === self.h) {
                M.southPanel.$d.css('height', M.$map.height());
                self.$d.css('height', M.$map.height());
            }
            /*
             * Normal mode
             */
            else {
                M.southPanel.$d.css('height', self.$d.h);
                self.$d.css('height', self.$d.h);
            }

            /*
             * Force reload of streetview by switching visibility on/off
             */
            self.svw.setVisible(true);
            self.svw.setPosition(position);

        };

        /*
         * Set unique instance
         */
        M.Plugins.Streetview._o = this;
        
        return this;
        
    };
})(window.M);