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
(function(msp) {
    
    msp.Plugins.Streetview = function() {
        
        /*
         * Only one Streetview object instance is created
         */
        if (msp.Plugins.Streetview._o) {
            return msp.Plugins.Streetview._o;
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
            
            /**
             * Init options
             */
            this.options = options || {};
            
            /*
             * Check if google.maps library is loaded
             * If not, plugin is discarded
             */
            if (typeof google !== "object" || google.maps === undefined) {
                msp.Util.message(msp.Util._("Google libraries not loaded. Streetview is disabled"));
                return null;
            }

            /*
             * Add "Streetview" item in menu
             */
            if (msp.menu) {
                msp.menu.add([
                {
                    id:msp.Util.getId(),
                    ic:"streetview.png",
                    ti:"Streetview",
                    cb:function() {
                            
                        /*
                         * Show layer
                         */
                        self.show(self, msp.Map.Util.p2d(msp.menu.lonLat.clone()));
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
            msp.Map.events.register("layersend", this, function(action, layer, scope) {

                /*
                 * Each time a layer is added make sure streetview layer is on top
                 */
                if (action === "add" && scope.svw) {
                    msp.Map.Util.setLayerOnTop(scope.svw.msp.layer);
                }
            });

            return this;

        };
        
        /*
         * Initialize streetview container
         */
        this.initSvw = function() {
            
            if (this.svw) {
                return self.svw;
            }
            
            var self = this,
                pn = new msp.Panel('s'), // Create new South panel
                ctn = pn.add(), // Add container within panel
                lonlat = msp.Map.map.getCenter();
            
            /*
             * Add the container within the South Panel container
             */
            ctn.$d.html('<div id="'+msp.Util.getId()+'" style="height:'+pn.getInnerDimension().h+'px;"></div>')
            
            /*
             * Set container content
             */
            self.$d = ctn.$d.children().first();

            /*
             * Initialise Streetview object
             */
            !lonlat ? lonlat = {
                lat:0,
                lon:0
            } : msp.Map.Util.p2d(lonlat);

            /*
             * Create StreetViewPanorama
             */
            self.svw = new google.maps.StreetViewPanorama(self.$d[0]);
            
            /*
             * Add msp object to streetview object
             */
            self.svw.msp = {
                
                /*
                 * Array of events
                 */
                events:[],
                 
                /*
                 * Create streetview layer
                 */
                layer:new OpenLayers.Layer.Vector("__LAYER_STREETVIEW__",{
                    projection:msp.Map.epsg4326,
                    displayInLayerSwitcher:false,
                    styleMap:new OpenLayers.StyleMap({
                        'default' :  new OpenLayers.Style({
                            externalGraphic : msp.Util.getImgUrl("streetviewarrow.png"),
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
                        
                    if (scope.msp.layer.getVisibility() && scope.position) {
                        scope.msp.layer.destroyFeatures();
                        pointLatLon = new OpenLayers.Geometry.Point(scope.position.lng(), scope.position.lat());
                        msp.Map.Util.d2p(pointLatLon);
                        feature = (function (yaw) {
                            return new OpenLayers.Feature.Vector(pointLatLon,
                            {
                                angle:yaw
                            });
                        })(scope.getPov().heading);
                        scope.msp.layer.addFeatures(feature);
                    }
                }
                
            }
            
            /*
             * Add streetview layer to mapshup map
             */
            msp.Map.addLayer({
                type:"Generic",
                title:self.svw.msp.layer.name,
                layer:self.svw.msp.layer,
                unremovable:true,
                initialLayer:true,
                hidden:true
            });

            /*
             * Update the streeview layer consequently to a position change
             */
            self.svw.msp.events.push(google.maps.event.addListener(this.svw, "position_changed", function() {
                this.msp.update(this);
            }));

            /*
             * Update the streetview layer consequently to a yaw change
             */
            self.svw.msp.events.push(google.maps.event.addListener(this.svw, "pov_changed", function(){
                this.msp.update(this);
            }));

            /*
             * Update the streetview layer visibility consequently to a streetview visibility change
             */
            self.svw.msp.events.push(google.maps.event.addListener(this.svw, "visible_changed", function(){
                msp.Map.Util.setVisibility(this.msp.layer, this.visible);
            }));

            /*
             * Trap the error
             */
            self.svw.msp.events.push(google.maps.event.addListener(this.svw, "error", function(){
                if (this.errorCode === 603) {
                    msp.Util.message(msp.Util._("Error : Flash doesn't appear to be supported by your browser"));
                    return;
                }
                if (this.errorCode === 600) {
                    self.remove();
                    return;
                }
            }));

            /*
             * Set streetview initial position
             */
            this.svw.setPosition(new google.maps.LatLng(lonlat.lat,lonlat.lon));
            
            /*
             * Register Streetview button within South south toolbar
             */
            self.btn = new msp.Button({
                tt:"Show/Hide Streetview",
                tb:new msp.Toolbar('ss', 'h'),
                title:"Streetview",
                container:ctn,
                close:true,
                onclose:self.remove,
                onshow:function(scope, btn){
                    scope.show(scope, msp.Map.Util.p2d(btn.svw.msp.layer.getDataExtent().getCenterLonLat().clone()));
                },
                onhide:function(scope, btn) {
                    btn.activate(false);
                    btn.svw.setVisible(false);
                },
                activable:true,
                scope:self,
                e:{
                    svw:self.svw
                },
                actions:[
                {
                    cssClass:"actnnw icnzoom",
                    callback:function(btn) {
                        msp.Map.zoomTo(btn.svw.msp.layer.getDataExtent());
                    }
                }
                ]
            });
            
        };
        
        /**
         * Remove the streetview object
         */
        this.remove = function(btn) {
            
            var i,
                l,
                event,
                scope = btn.scope,
                obj = scope.svw.msp;
               
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
            msp.Map.removeLayer(obj.layer, false);
            
            /*
             * Nullify streetview object
             */
            delete scope.svw;
            
        };
        
        /**
         * Show streetview
         *
         * @input lonlat : LonLat in map.displayProjection coordinates
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
                     * Activate Button
                     */
                    scope.btn.activate(true);

                    /*
                     * Show container
                     */
                    scope.btn.container.pn.show(scope.btn.container);
                    
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
                    msp.Util.message(msp.Util._("No Streetview data around this point"));
                }
            });

        };
        
        /*
         * Toogle fullscreen/normal mode
         */
        this.toggleFullscreen = function() {

            /*
             * Force reload of streetview by switching visibility on/off
             */
            var position = this.streetview.getPosition();
            this.streetview.setVisible(false);

            /*
             * Fullscreen mode
             */
            if (this.div.height() === this.options.height) {
                var jmap = $('#Map');
                this.div.css('height', jmap.height());
                this.div.children().first().css('height', jmap.height());
            }
            /*
             * Normal mode
             */
            else {
                this.div.children().first().css('height', this.options.height);
                this.div.css('height', this.options.height);
            }

            /*
             * Force reload of streetview by switching visibility on/off
             */
            this.streetview.setVisible(true);
            this.streetview.setPosition(position);

        };

        /*
         * Set unique instance
         */
        msp.Plugins.Streetview._o = this;
        
        return this;
        
    };
})(window.msp);