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
/*********************************************
 *
 * Plugin Google Earth
 *
 * Part of the code inspired by GoogleEarthExt
 *
 *      Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 *      Published under the BSD license.
 *      See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 *      of the license.
 *
 *********************************************/
(function(M) {
    
    M.Plugins.GoogleEarth = function() {
        
        /*
         * Only one GoogleEarth object instance is created
         */
        if (M.Plugins.GoogleEarth._o) {
            return M.Plugins.GoogleEarth._o;
        }
        
        /**
         *  Initial altitude (default: 100)
         */
        this.altitude = 100;

        /**
         *  Initial altitude mode (default: 1 ALTITUDE_RELATIVE_TO_GROUND)
         */
        this.altitudeMode = 1;

        /*
         * The Google Earth object
         */
        this.ge = null;

        /**
         *  Initial heading in degrees (default: 0)
         */
        this.heading = 0;

        /**
         * Hash table of kmlObjects
         */
        this.kmlObjects = [];

        /**
         * Center of view in Lat/Lon
         */
        this.lookAt = null;

        /**
         *  Initial tilt in degrees (default: o)
         */
        this.tilt = 0;

        /**
         *  Initial range in meters (default: 100000)
         */
        this.range = 100000;

        /**
         * This parameter is used to avoid "ping-pong"
         * between GE and Map
         */
        this.__lastFromGE = false;
        
        /**
         * Init plugin
         */
        this.init = function(options) {
            
            var self = this;
            
            /*
             * !! Google Earth needs to be loaded !!
             */
            if (typeof google !== "object" || google.earth === undefined) {
                return null;
            }

            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set defaults options
             */
            $.extend(self.options,{
                
                /*
                 * Show navigation control
                 */
                navigationControl:M.Util.getPropertyValue(self.options, "navigationControl", true),

                /*
                 * Show atmosphere
                 */
                atmosphere:M.Util.getPropertyValue(self.options, "atmosphere", true),

                /*
                 * Teleportation
                 */
                teleport:M.Util.getPropertyValue(self.options, "teleport", false),

                /*
                 * Show GE borders layer
                 */
                borders:M.Util.getPropertyValue(self.options, "borders", false),

                /*
                 * Show GE terrain layer
                 */
                terrain:M.Util.getPropertyValue(self.options, "terrain", true),

                /*
                 * Show GE roads layer
                 */
                roads:M.Util.getPropertyValue(self.options, "roads", false),

                /*
                 * Show GE buildings layer
                 */
                buildings:M.Util.getPropertyValue(self.options, "buildings", false),

                /*
                 * Show GE low resolution buildings layer
                 */
                buildingsLR:M.Util.getPropertyValue(self.options, "buildingsLR", false),

                /*
                 * Synchronize layers
                 */
                synchronize:M.Util.getPropertyValue(self.options, "synchronize", true),

                /*
                 * Synchronize WMS layers
                 */
                synchronizeWMS:M.Util.getPropertyValue(self.options, "synchronizeWMS", false),
                
                /*
                 * Toolbar container position
                 */
                position:M.Util.getPropertyValue(self.options, "position", 'ne'),
                
                /*
                 * Toolbar container orientation
                 */
                orientation:M.Util.getPropertyValue(self.options, "orientation", 'v'),
                
                /*
                 * Boolean - if true, Google Earth is displayed within a South panel
                 * and can be displayed at the same time of the 3D map
                 * Otherwise it is displayed above the 2D map
                 */
                embeded:M.Util.getPropertyValue(self.options, "embeded", false)
                
            });
            
            /*
             * 3D map is displayed within a South panel
             */
            if (self.options.embeded) {
                
                /*
                 * Add GoogleEarth to South Panel
                 */
                self.panelItem = M.sp.add({
                    id:M.Util.getId(),
                    title:"3D view",
                    onshow:function() {
                        
                        /*
                         * Paranoid mode
                         */
                        if (!self.ge) {
                            self.initGE();
                        }

                        /*
                         * Fade in Google Earth view
                         */
                        self.$d.css('visibility','visible');
                    }
                });
            
                /*
                 * Store container jquery reference
                 * 
                 * !! Add a "nodisplaynone" class to avoid the use of
                 * "display:none" when panel item is switch on/off.
                 * See M.sp.setActive(item) for explanation
                 */
                self.panelItem.$d.addClass("nodisplaynone")
                self.$d = self.panelItem.$content;
                
            }
            
            /*
             * 3D map is supperposed to 2D map - No ways to get the two maps
             * simultaneously displayed at the same time
             */
            else {
                
                /*
                 * 3D map is created under M.$mcontainer
                 */
                self.$d = M.Util.$$('#'+M.Util.getId(), M.$mcontainer);
                
                (new M.Toolbar({
                    position:self.options.position, 
                    orientation:self.options.orientation
                    })).add({
                    title:"3D",
                    tt:"Toggle 2D/3D",
                    activable:true,
                    callback:function() {
                        self.showHide();
                    }  
                });
            }
            
            /*
             * Set 3D map div css properties
             * 
             * !IMPORTANT ! Set the css property 'display:none' will not work with google.earth.createInstance
             * thus we need to use the 'visibility:hidden' property instead
             */
            self.$d.css({
                'position':'absolute',
                /*'z-index':problem ? 90000 : 10200,*/
                'z-index':10200,
                'visibility':'hidden',
                /* 3D map position is exactly like map position */
                'width':'100%',
                'height':self.options.embeded ? '95%' : '100%',
                'padding':'0',
                'margin':'0'
            });

            /*
             * Register events
             */
            M.Map.events.register("moveend", self, self.onMoveEnd);
            M.Map.events.register("layersend", self, self.onLayersEnd);
            M.Map.events.register("visibilitychanged", self, self.onVisibilityChanged);

            return this;
            
        };
        
        /*
         * Initialize Google Earth
         */
        this.initGE = function() {
            
            var self = this;
            
            if (!self.ge) {
                /*
                 * Display information about google earth initialization
                 */
                M.mask.add({
                    title:M.Util._("Initializing 3D mode"),
                    cancel:true
                });

                /*
                 * Set Google Earth language to mapshup language
                 */
                google.earth.setLanguage(M.Config["i18n"].lang);

                /*
                 * Create a Google Earth instance within Map3D div
                 */
                google.earth.createInstance(self.$d.attr('id'), function(obj) {
                    self.initCallback(self, obj);
                }, self.failureCallback);
            }

        };
        
        /*
         * Show/Hide Google Earth Map3d
         */
        this.showHide = function() {

            var self = this;
            
            /*
             * First initialize GoogleEarth plugin
             */
            if (!self.ge) {

                self.initGE();
                
            }
            /*
             * Google Earth plugin is initialized
             */
            else {

                /*
                 * We are in Map view (2D) => switch to 3D
                 */
                if (self.$d.css("visibility") === "hidden") {
                    self.show();
                }
                /*
                 * We are in Google Earth view (3D) => switch to 2D
                 */
                else {
                    self.hide();
                }
            }

        };

        /**
         * Google Earth view position follow Map center
         */
        this.onMoveEnd = function(map, scope) {

            /*
             * The tricky part : if __lastFromGE is set to true,
             * it means that the last move was initiated from GE.
             * So a move in GE triggers a move in Map that triggers
             * a move in GE...
             * We do not want infinite loop. So the last trigger (Map to GE)
             * will only be processed if __lastFromGE is false.
             */
            if (!scope.__lastFromGE) {
                scope.setGELookAt();
            }

            scope.__lastFromGE = false;
            
        };

        /**
         * This function is called after M.Map.map.layers changed
         * (i.e. successfull addLayer or removeLayer)
         *
         * Possible actions are :
         *   - add
         *   - remove
         *   - update (not used here)
         *   - features
         *   - featuresupdated
         */
        this.onLayersEnd = function(action, layer, scope) {

            /*
             * Add layer to Google Earth
             */
            if (action === "add") {
                scope.addLayer(layer);
            }
            /*
             * Remove layer from Google Earth
             */
            else if (action === "remove") {
                scope.removeLayer(layer);
            }
            /*
             * Update layer on Google Earth
             *  - vector layers are updated on "features" action
             *  - WMS layer are update on "update" action
             */
            else if (action === "features" || action === "featureskeep" || (action === "update" && layer.CLASS_NAME === "OpenLayers.Layer.WMS")) {
                scope.removeLayer(layer);
                scope.addLayer(layer);
            }

        };

        /**
         * This function is called after a layer visibility changed
         */
        this.onVisibilityChanged = function (layer, scope) {

            /*
             * Paranoid mode
             */
            if (scope.ge && layer) {

                var kmlObject = scope.kmlObjects[layer.id];
                if (kmlObject) {
                    
                    try {
                        kmlObject.setVisibility(layer.getVisibility());
                    }
                    catch (e) {
                    }
                    
                }
            }

        };


        /*
         * Callback function after a successfull Google Earth
         * plugin initialization
         */
        this.initCallback = function(scope, obj) {

            var i,l, self = scope;
            
            /*
             * Hide information Mask
             */
            M.mask.hide();

            /*
             * Set this.ge object
             */
            scope.ge = obj;

            /*
             * Set the Google Earth view to the Map view
             */
            scope.setGELookAt()

            /*
             * Google Earth navigation control is set bottom left
             */
            if (scope.options.navigationControl) {
                scope.ge.getNavigationControl().setVisibility(scope.ge.VISIBILITY_AUTO);
                scope.ge.getNavigationControl().getScreenXY().setXUnits(scope.ge.UNITS_PIXELS);
                scope.ge.getNavigationControl().getScreenXY().setYUnits(scope.ge.UNITS_PIXELS);
            }

            /*
             * Flying Speed
             */
            if (scope.options.teleport) {
                scope.ge.getOptions().setFlyToSpeed(scope.ge.SPEED_TELEPORT);
            }

            /*
             * Show atmosphere
             */
            scope.ge.getOptions().setAtmosphereVisibility(scope.options.atmosphere);

            /*
             * Show layers
             */
            scope.ge.getLayerRoot().enableLayerById(scope.ge.LAYER_BORDERS, scope.options.borders);
            scope.ge.getLayerRoot().enableLayerById(scope.ge.LAYER_TERRAIN, scope.options.terrain);
            scope.ge.getLayerRoot().enableLayerById(scope.ge.LAYER_ROADS, scope.options.roads);
            scope.ge.getLayerRoot().enableLayerById(scope.ge.LAYER_BUILDINGS, scope.options.buildings);
            scope.ge.getLayerRoot().enableLayerById(scope.ge.LAYER_BUILDINGS_LOW_RESOLUTION, scope.options.buildingsLR);

            /*
             * Set the Google Earth plugin visible within Map3d div
             */
            scope.ge.getWindow().setVisibility(true);

            /*
             * Init layers
             */
            for (i = 0, l = M.Map.map.layers.length; i < l; i++) {
                scope.addLayer(M.Map.map.layers[i]);
            }

            /*
             * Update Map position on Google Earth view change
             *
             * To avoid overload, Map position is changed only if the new map
             * extent differs from the current bounds by at least the quarter
             * of the map size in pixel reference system
             * 
             */
            if (scope.options.synchronize) {
                google.earth.addEventListener(scope.ge.getView(), 'viewchangeend', function() {
                    self.setMapLookAt(true);
                });
            }

            /*
             * Show Google Earth
             */
            scope.show();

        };

        /*
         * Callback function afer an unsuccessfull Goole Earth
         * plugin initialization
         */
        this.failureCallback = function(errorCode) {

            /*
             * Hide information Mask
             */
            M.mask.hide();

            /*
             * Tell user that unfortunately he will not browse
             * the Earth in 3D :(
             */
            M.Util.message(M.Util._("Error : Google Earth cannot be loaded") + '<br/><a target="_blank" href="http://www.google.com/earth/download/ge/">' + M.Util._("Perhaps you need to install Google Earth plugin ?") + '</a>', -1);

        };
    
        /*
         * Add a KML layer to Google Earth
         */
        this.addLayer = function(layer) {

            var kmlString,
            kmlObject,
            self = this;
                
            /*
             * Paranoid mode
             */
            if (!self.ge || !layer) {
                return false;
            }

            /*
             * This method is active only of layers are synchronized
             */
            if (!self.options.synchronize) {
                return false;
            }

            /*
             * We don't care of baseLayers and layers
             * that are not displayed within LayersManager menu
             */
            if (!layer.isBaseLayer && layer.displayInLayerSwitcher) {

                kmlString = M.Map.Util.KML.layerToKML(layer, {
                    synchronizeWMS:self.options.synchronizeWMS
                });

                if (kmlString !== '') {
                    
                    /*
                     * Create KML object from string
                     */
                    try {
                        kmlObject = self.ge.parseKml(kmlString);
                    }
                    catch(e) {
                        return false;
                    }
                    
                    /*
                     * Wrap alerts in API callbacks and event handlers
                     * in a setTimeout to prevent deadlock in some browsers
                     * 
                     * (see example : http://earth-api-samples.googlecode.com/svn/trunk/examples/kml-fetch-good.html) 
                     */
                    if (!kmlObject) {
                        setTimeout(function() {
                            alert('Bad or null KML');
                        }, 0);
                        return false;
                    }

                    try {
                        self.ge.getFeatures().appendChild(kmlObject);
                    }
                    catch(e) {
                        return false;
                    }

                    /*
                     * Update the kmlObjects array
                     */
                    self.kmlObjects[layer.id] = kmlObject;

                    /*
                     * Set visibility
                     */
                    if (!layer.getVisibility()) {
                        kmlObject.setVisibility(false);
                    }
                }

            }

            return true;
        };
        
        /**
         * Remove a layer from Google Earth view
         */
        this.removeLayer = function(layer) {
    
            var kmlObject,
            self = this;
                    
            /*
             * Paranoid mode
             */
            if (!self.ge || !layer) {
                return false;
            }

            /*
             * This method is active only of layers are synchronized
             */
            if (!self.options.synchronize) {
                return false;
            }

            /*
             * Get kmlObject reference from kmlObjects list
             */
            kmlObject = self.kmlObjects[layer.id];

            if (kmlObject) {

                /*
                 * Remove kmlObject from Google Earth
                 */
                try {
                    self.ge.getFeatures().removeChild(kmlObject);
                }
                catch(e) {}
                kmlObject = null;

                /*
                 * Remove kmlObject entry from kmlObjects list
                 */
                delete self.kmlObjects[layer.id];
                
                return true;
            }

            return false;

        };

        /**
         * Hide Google Earth
         */
        this.hide = function() {

            var self = this;
            
            if (!self.ge) {
                return;
            }

            /*
             * Be kind with users
             */
            M.Util.message(M.Util._("Entering 2D mode"));

            /*
             * Clear __lastFromGE to insure 2D/3D synchronization
             */
            self.__lastFromGE = false;

            /*
             * How to exit 3D from firefox...
             */
            $('#jGEExitFrame').hide();
            $('#jGEExitLink').hide();

            /*
             * Fade out Google Earth view
             */
            self.$d.fadeTo(400,0, function(){
                self.$d.css("visibility", "hidden")
            });

        };
    
        /**
         * Show Google Earth
         */
        this.show = function() {

            /*
             * Paranoid mode
             */
            if (!this.ge) {
                return;
            }

            /*
             * Be kind with users
             */
            M.Util.message(M.Util._("Entering 3D mode"));

            /*
             * Fade in Google Earth view
             */
            this.$d.fadeTo(0,0).css('visibility','visible').fadeTo(400,1);

            /*
             * How to exit 3D from firefox...
             */
            $('#jGEExitFrame').show();
            $('#jGEExitLink').show();

        };
        
        /** 
         * Set the position of Google Earth view so it corresponds to
         * the Map position
         */
        this.setGELookAt = function () {

            var geLookAt,
            self = this;
            
            /*
             * Paranoid mode
             */
            if (self.ge) {
                
                /*
                 * Set the lookAt position in Lat/Lon
                 */
                self.lookAt = M.Map.Util.p2d(M.Map.map.getCenter());

                /*
                 * Set range from map scale
                 */
                self.range = M.Map.map.getScale() / self.getScaleFactor();

                /*
                 *More documentation in http://code.google.com/apis/earth/documentation/reference/interface_g_e_view.html
                 *  :param lat: ``Number`` The latitude of the lookAt position in EPSG:4326
                 *  :param lon: ``Number`` The longitude of the lookAt position in EPSG:4326
                 *  :param altitude: ``Number`` The altitude of the lookAt position
                 *  :param altitudeMode: ``Number`` The altitudeMode to use
                 *  :param heading: ``Number`` The heading of the lookAt position
                 *  :param tilt: ``Number`` The tfilt of the lookAt position
                 *  :param range: ``Number`` The range of the lookAt position
                 */
                /*
                 * Sometimes google Earth plugin crashes...
                 */
                try {
                    geLookAt = self.ge.createLookAt('');
                    geLookAt.set(self.lookAt.lat,
                        self.lookAt.lon,
                        self.altitude,
                        self.altitudeMode,
                        self.heading,
                        self.tilt,
                        self.range);
                    self.ge.getView().setAbstractView(geLookAt);
                }
                catch (e) {}
            }
            
        };
        
        /**
         *  Set Map position from GE move
         *
         *  @param {boolean} limit : if set to true, Map extent is changed only
         *  if the new map extent differs from the current bounds by at least the quarter
         *  of the map size in pixel reference system
         */
        this.setMapLookAt = function(limit) {

            var self = this;
            
            /*
             * Paranoid mode
             */
            if (!self.ge) {
                return;
            }

            /*
             * Set limit parameter (false by default)
             */
            limit = limit || false;

            /*
             * Remove kmlObject from Google Earth
             */
            var geLookAt;
            try {
                geLookAt = self.ge.getView().copyAsLookAt(self.altitudeMode);
            }
            catch(e) {
                return;
            }
            
            /*
             * Update lookAt position from GE
             */
            $.extend(self,{
                lookAt:new OpenLayers.LonLat(geLookAt.getLongitude(), geLookAt.getLatitude()),
                range:geLookAt.getRange(),
                tilt:geLookAt.getTilt(),
                heading:geLookAt.getHeading(),
                altitude:geLookAt.getAltitude(),
                altitudeMode:geLookAt.getAltitudeMode()
            });
            
            /*
             * Set Map position
             */
            var center = M.Map.Util.d2p(self.lookAt.clone()),
            scale = self.range * self.getScaleFactor(),
            res = OpenLayers.Util.getResolutionFromScale(scale, M.Map.map.baseLayer.units),
            size = M.Map.map.getSize(),
            w_deg = size.w * res,
            h_deg = size.h * res,

            /*
                 * Compute new Extent from scale and Map size
                 */
            extent = new OpenLayers.Bounds(center.lon - w_deg / 2,
                center.lat - h_deg / 2,
                center.lon + w_deg / 2,
                center.lat + h_deg / 2);

            /*
             * Center Map to the Google Earth extent
             */
            if (limit) {

                var centerPixel = M.Map.map.getPixelFromLonLat(M.Map.map.getCenter()),
                newCenterPixel = M.Map.map.getPixelFromLonLat(center),
                newZoom = M.Map.map.getZoomForExtent(extent, true);

                /*
                 * new map extent differs from the current bounds by at least the quarter
                 * of the map size in pixel reference system => change extent
                 */
                if (M.Map.map.getZoom() !== newZoom || Math.abs(centerPixel.x - newCenterPixel.x) > (self.$d.width() / 4) || Math.abs(centerPixel.y - newCenterPixel.y) > (self.$d.height() / 4)) {

                    /*
                     * Set the value "anti ping-pong" to true value
                     */
                    self.__lastFromGE = true;

                    M.Map.map.zoomToExtent(extent, true);

                }

            }
            else {
                M.Map.map.zoomToExtent(extent, true);
            }

        };
        
        
        /**
         * Return the scale factor to compute zoom level
         * from scale and scale from zoom level
         */
        this.getScaleFactor = function() {
            /*
             * I'm lazy and a newbie in mathematics...
             * So empiric value rules :)
             */
            return 4;
        };
        
        /*
         * Set unique instance
         */
        M.Plugins.GoogleEarth._o = this;
        
        return this;
        
    };
    
})(window.M);