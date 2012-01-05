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
 * Drawing plugin.
 * Allow user to draw Point, Line or Polygons
 * and store it within its own layer 
 */
(function(msp) {
    
    msp.Plugins.Drawing = function() {
        
        /*
         * Only one BackgroundsManager object instance is created
         */
        if (msp.Plugins.Drawing._o) {
            return msp.Plugins.Drawing._o;
        }
        
        /*
         * Init plugin
         */
        this.init = function(options) {
            
            var self = this;
            
            /**
             * Init options
             */
            this.options = options || {};

            /*
             * Default export service url
             */
            this.options.exportServiceUrl = this.options.exportServiceUrl || "/utilities/export.php?";

            /*
             * Add "Drawing" item in menu
             */
            if (msp.menu) {
                msp.menu.add([
                {
                    id:msp.Util.getId(),
                    ic:"drawing.png",
                    ti:"Draw layer",
                    cb:function() {
                        self.startDrawing();
                    }
                }
                ]);
            }
            
            /*
             * Create the drawingAsk and drawingDesc dialog boxes
             * The first lets user define the drawn object type.
             * The second lets the user to add information on drawn feature
             *
             * Structure:
             *
             *          <div id="drawingAsk" class="bg">
             *              <div class="description">
             *              [...]
             *              </div>
             *          </div>
             *          <div id="drawingDesc">
             *              <form id="drawingDescForm">
             *              [...]
             *              </form>
             *          </div>
             */
            this.$ask = msp.Util.$$('#drawingAsk', msp.$mcontainer).css(
            {
                'position':'absolute',
                'height':'auto',
                'display':'none',
                'z-index':'38000'    
            }).addClass("bg").append('<div class="description"><a href="#" class="point">'+msp.Util._("Point")+'</a><img class="middle" src="'+msp.Util.getImgUrl("drawing_point.png")+'"/>&nbsp;<a href="#" class="line">'+msp.Util._("Line")+'</a><img class="middle" src="'+msp.Util.getImgUrl("drawing_line.png")+'"/><a href="#" class="polygon">'+msp.Util._("Polygon")+'</a><img class="middle" src="'+msp.Util.getImgUrl("drawing_polygon.png")+'"/></div>');
            this.$des = msp.Util.$$('#drawingDesc').css(
            {
                'position':'absolute',
                'display':'none',
                'z-index':'38000'    
            }).append('<form id="drawingDescForm"></form>');

            /*
             * Create action for drawingAsk dialog box
             */
            $('a.point',this.$ask).click(function() {
                self.startDrawing("__CONTROL_DRAWPOINT__");
                return false;
            });
            $('a.line',this.$ask).click(function() {
                self.startDrawing("__CONTROL_DRAWLINE__");
                return false;
            });
            $('a.polygon',this.$ask).click(function() {
                self.startDrawing("__CONTROL_DRAWPOLYGON__");
                return false;
            });

            /*
             * Create the drawingInfo dialog box
             * This dialog box indicates current mode
             */
            this.$inf = msp.Util.$$('#drawingInfo', msp.$mcontainer).addClass("boxShadow");

            /*
             * Add close buttons
             */
            msp.Util.addCloseButton(this.$ask, function() {
                msp.mask.hide();
            });

            msp.Util.addCloseButton(this.$des, function() {
                msp.mask.hide();
            });

            this.layer = new OpenLayers.Layer.Vector("__LAYER_DRAWING__", {
                projection:msp.Map.epsg4326,
                displayInLayerSwitcher:false,
                styleMap:new OpenLayers.StyleMap({
                    'default':{
                        pointRadius:5,
                        strokeColor:'white',
                        strokeWidth: 1,
                        fillColor:'black',
                        fillOpacity: 0.3
                    }
                })
            });

            /**
             * Add Drawing layer to Map object
             */
            msp.Map.addLayer({
                type:"Generic",
                title:this.layer.name,
                unremovable:true,
                initialLayer:true,
                layer:this.layer
            });

            /**
             * Event on sketchcomplete
             */
            this.layer.events.on({

                "sketchcomplete": function(event) {

                    /**
                     * Reset '#drawingDesc' description form
                     */
                    $('#drawingDescForm').html('<div class="description"><table><tr><td>'+msp.Util._("Title")+'</td><td><input id="featureTitle" type="text" style="width:150px;"></td></tr><tr><td>'+msp.Util._("Description")+'</td><td><textarea id="featureDescription" rows="3" style="width:150px;"></textarea></td></tr><tr><td colspan="2"><a href="#" class="ok">'+msp.Util._("Validate")+'</a></td></table>');
                    $('a.ok',self.$des).click(function() {
                        if (event.feature) {
                            event.feature.attributes.name = $('#featureTitle').val();
                            event.feature.attributes.description = $('#featureDescription').val();
                        }
                        msp.mask.hide();
                        self.$des.hide();
                        return false;
                    });

                    /*
                     * Show jMask
                     */
                    msp.mask.show(true);

                    /*
                     * Hide drawingAsk
                     */
                    self.$ask.hide();

                    /*
                     * Show drawingDesc
                     */
                    self.$des.show();

                    /*
                     * Center drawingDesc dialog box over last mouse click
                     */
                    self.centerBox(msp.Map.mousePosition, self.$des);
                }
            });

            /**
             * Add controls tool to Map.map object
             */
            var controls = (function (layer) {
                return {
                    point: new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Point, {
                        id:"__CONTROL_DRAWPOINT__"
                    }),
                    line: new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Path, {
                        id:"__CONTROL_DRAWLINE__"
                    }),
                    polygon: new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Polygon, {
                        id:"__CONTROL_DRAWPOLYGON__"
                    }),
                    regular: new OpenLayers.Control.DrawFeature(layer,
                        OpenLayers.Handler.RegularPolygon,
                        {
                            id:"__CONTROL_DRAWCIRCLE__",
                            handlerOptions: {
                                sides: 30
                            }
                        }),
                    modify: new OpenLayers.Control.ModifyFeature(layer, {
                        id:"__CONTROL_MODIFY__",
                        mode:OpenLayers.Control.ModifyFeature.RESHAPE
                    /*mode:OpenLayers.Control.ModifyFeature.RESHAPE | OpenLayers.Control.ModifyFeature.RESIZE | OpenLayers.Control.ModifyFeature.ROTATE | OpenLayers.Control.ModifyFeature.DRAG*/
                    })
                }
            })(this.layer);

            for (var key in controls) {
                msp.Map.map.addControl(controls[key]);
            }

            /*
             * Register resizeend event
             */
            msp.Map.events.register("resizeend", self, function(scope) {
                
                /*
                 * drawingInfo alignment is centered from the top of the map
                 */
                scope.$inf.css({
                    'left':((msp.$mcontainer.width() - scope.$inf.width()) / 2) + msp.$mcontainer.offset().left,
                    'top': msp.$mcontainer.offset().top + 30
                });

                return;
            });
            
            msp.Map.events.register("layersend", self, function(action, layer, scope) {
                
                /*
                 * Each time a layer is added make sure Drawing layer is on top
                 */
                if (action === "add" && scope.layer) {
                    msp.Map.Util.setLayerOnTop(scope.layer);
                }
            });

            return this;
            
        };
        
        /*
         * Add buttons
         */
        this.addActions = function(div) {
        
            var scope = this;

            /*
             * Add the close button
             */
            msp.Util.addCloseButton(div, function() {
                
                /*
                 * Stop drawing
                 */
                scope.stopDrawing();

                /*
                 * Reset the layer
                 */
                scope.layer.destroyFeatures();
            });

            /*
             * Add the save and exit button
             */
            div.append('<div class="act actse icncheck" jtitle="'+msp.Util._("Save")+'"></div>');
            msp.tooltip.add($('.icncheck', div), 'w');
            $('.icncheck', div).click(function() {
                scope.stopDrawing();
                scope.saveLayer();
            });

        };
        
        /*
         * Save layer in KML
         */
        this.saveLayer = function() {

            if (this.layer.features.length === 0) {
                return false;
            }

            var scope = this,
                title = "MyLayer #"+msp.Util.getId(),
                kml = msp.Map.Util.KML.layerToKML(this.layer, {
                    color:msp.Util.randomColor(), 
                    opacity:0.4
                });

            /*
             * Save KML layer to the server
             */
            msp.Util.ajax({
                url:msp.Util.getAbsoluteUrl(msp.Config["general"].saveKMLServiceUrl)+msp.Util.abc,
                async:true,
                type:"POST",
                data:{
                    s:encodeURIComponent(kml)
                },
                dataType:"json",
                success: function(data) {

                    if (data.error) {
                        msp.Util.message(data.error["message"]);
                    }
                    else {

                        /*
                         * Empty the drawing layer
                         */
                        if (scope && scope.layer) {
                            scope.layer.destroyFeatures();
                        }

                        /*
                         * Add new layer to the map
                         */
                        msp.Map.addLayer({
                            type:"KML",
                            title:title,
                            icon:msp.Util.getImgUrl("drawing.png"),
                            url:data.url,
                            selectable:true
                        });

                    }
                },
                error: function(e) {
                    msp.Util.message(msp.Util._("Server error") + " " + msp.Util._("The layer cannot be saved"));
                }

            },{
                title:msp.Util._("Saving layer") + " : " + msp.Util._(title),
                cancel:true
            });

            return true;

        };
        
        
        /**
         * Enter drawing mode
         */
        this.startDrawing = function(type) {

            var id,
                scope = this,
                d = scope.$inf;

            /*
             * First reset control
             */
            msp.Map.resetControl(this.control);

            /*
             * Drawn object type is not defined => ask user
             */
            if (!type) {

                /*
                 * Update the '#drawingInfo' html content
                 * => drawing mode
                 */
                id = msp.Util.getId();
                d.html(msp.Util._("You are in drawing mode.")+'<br/><a href="#" id="'+id+'">'+msp.Util._("Modification mode")+'</a>');
                this.addActions(d);

                $('#'+id).click(function() {
                    scope.startModifying();
                    return false;
                });

                /*
                 * Display the '#drawingAsk' 
                 */
                scope.$des.hide();
                msp.mask.show(true);
                scope.$ask.show();

                /**
                 * Center drawingAsk dialog box over last mouse click
                 */
                this.centerBox(msp.Map.mousePosition, scope.$ask);

            }
            /**
             * Drawn object type is defined => trigger corresponding control
             */
            else {

                /*
                 * Hide mask
                 */
                msp.mask.hide();
                this.$ask.hide();

                /*
                 * Set active control to 'type' control
                 */
                this.control = msp.Map.Util.getControlById(type);

                if (this.control) {
                    scope.$inf.show();
                    this.control.activate();
                }
            }
        };
        
        /**
         * Enter modify mode
         */
        this.startModifying = function() {

            var hlt,
                scope = this,
                id = msp.Util.getId();

            /*
             * Reset control => OpenLayers bug ??
             */
            this.control.deactivate();
            msp.Map.Util.getControlById("__CONTROL_SELECT__").deactivate();
            hlt = msp.Map.Util.getControlById("__CONTROL_HIGHLITE__");
            if (hlt) {
                hlt.deactivate();
            }

            this.control = msp.Map.Util.getControlById("__CONTROL_MODIFY__");

            /*
             * Update the $inf html content
             * => modification mode
             */
            this.$inf.html(msp.Util._("You are in modification mode.")+'<br/><a href="#" id="'+id+'">'+msp.Util._("Drawing mode")+'</a>');
            this.addActions(this.$inf);

            $('#'+id).click(function() {
                scope.startDrawing();
                return false;
            });

            /*
             * Activate control
             */
            this.control.activate();
        };
        
        /**
         * Exit drawing mode
         */
        this.stopDrawing = function() {

            /*
             * Switch back to Map default control
             */
            msp.Map.resetControl(this.control);
            this.control = null;

            /*
             * Close drawingInfo
             */
            this.$inf.hide();

        };
        
        /**
         * Force input div to be :
         *  1. centered closest from xy
         *  2. completely inside the '#Map' object
         */
        this.centerBox = function(MapPixel, div) {

            var x,
                y,
                pixel,
                parent = msp.$map,
                offset = parent.offset();

            /*
             * (0,0) origin of MapPixel is #Map
             * (0,0) origin of pixel is window
             */
            pixel = {
                x:MapPixel.x + offset.left,
                y:MapPixel.y + offset.top
            }

            /*
             * If xy is not (or uncorrectly) defined,
             * div is centered on "#Map" div
             */
            if (!pixel || !pixel.x || !pixel.y) {
                x = offset.left + ((parent.width() - div.width()) / 2);
                y = offset.top + ((parent.height() - div.height()) / 2);
            }

            /*
             * Check if div can be centered on xy
             */
            else {
                /*
                 * div left is far too left
                 */
                if ((pixel.x - (div.width()/2) < offset.left)) {
                    x = offset.left;
                }
                /**
                 * div left is far too right
                 */
                else if ((pixel.x + (div.width()/2) > (offset.left + parent.width()))) {
                    x = offset.left + parent.width() - div.width();
                }
                /**
                 * div left is ok
                 */
                else {
                    x = pixel.x - (div.width() / 2);
                }

                /**
                 * div top is far too top
                 */
                if ((pixel.y - (div.height()/2) < offset.top)) {
                    y = offset.top;
                }
                /**
                 * div top is far too bottom
                 */
                else if ((pixel.y + (div.height()/2) > (offset.top + parent.height()))) {
                    y = offset.top + parent.height() - div.height();
                }
                /**
                 * div top is ok
                 */
                else {
                    y = pixel.y - (div.height() / 2)
                }
            }

            /*
             * Apply div css top/left modifications
             */
            div.css({
                'top':y,
                'left':x
            });

        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Drawing._o = this;
        
        return this;
    };
})(window.msp);