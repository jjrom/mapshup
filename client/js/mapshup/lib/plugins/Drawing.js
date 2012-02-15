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
            
            var controls, key,
            self = this;
            
            /**
             * Init options
             */
            self.options = options || {};

            /*
             * Default export service url
             */
            self.options.exportServiceUrl = self.options.exportServiceUrl || "/utilities/export.php?";

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
                        self.askType();
                    }
                }
                ]);
            }
           
            self.layer = new OpenLayers.Layer.Vector("__LAYER_DRAWING__", {
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
                title:self.layer.name,
                unremovable:true,
                initialLayer:true,
                layer:self.layer
            });

            /**
             * Event on sketchcomplete
             */
            self.layer.events.on({
                "sketchcomplete": function(event) {
                    
                    /*
                     * Hide ask popup if any
                     */
                    if (self.askPopup) {
                        self.askPopup.hide();
                    }

                    /*
                     * Show mask
                     */
                    msp.mask.show(true);

                    /*
                     * Ask user description of newly created feature
                     */
                    var popup = new msp.Popup({
                        modal:false,
                        noHeader:true,
                        autoSize:true,
                        onClose:function() {
                            msp.mask.hide();
                        },
                        cssClose:{
                            'top':'-8px',
                            'right':'-8px'
                        },
                        body:'<form class="marged"><label>'+msp.Util._("Feature title")+'<br/><input id="featureTitle" type="text"/></label><br/><label>'+msp.Util._("Feature description")+'<br/><input id="featureDesc" type="text"/></label><div style="margin:10px 0px;"><a href="#" class="button inline colored" id="featureDescV">'+msp.Util._("Validate")+'</a></div></form>'
                    });
                    
                    /*
                     * Show drawingDesc
                     */
                    popup.moveTo(msp.Map.mousePosition);
                    popup.show();
                    
                    $('#featureDescV').click(function() {
                        var f = event.feature;
                        if (f) {
                            f.attributes.name = $('#featureTitle').val();
                            f.attributes.description = $('#featureDesc').val();
                        }
                        msp.mask.hide();
                        popup.remove();
                        return false;
                    });

                    /*
                     * Initialize value
                     */
                    $('#featureTitle').val("").focus();
                    $('#featureDesc').val("");

                }
            });

            /*
             * Add controls tool to Map.map object
             */
            controls = (function (layer) {
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
            })(self.layer);
            
            for (key in controls) {
                msp.Map.map.addControl(controls[key]);
            }

            msp.Map.events.register("layersend", self, function(action, layer, scope) {
                
                /*
                 * Each time a layer is added make sure Drawing layer is on top
                 */
                if (action === "add" && scope.layer) {
                    msp.Map.Util.setLayerOnTop(scope.layer);
                }
            });

            return self;
            
        };
        
        /*
         * Ask feature type to user
         * 
         */
        this.askType = function() {
            
            var idPoint,idLine,idPolygon,
            self = this;
            
            if (!self.askPopup) {
                idPoint = msp.Util.getId();
                idLine = msp.Util.getId();
                idPolygon = msp.Util.getId();
                self.askPopup = new msp.Popup({
                    modal:false,
                    noHeader:true,
                    hideOnClose:true,
                    autoSize:true,
                    cssClose:{
                        'top':'-8px',
                        'right':'-8px'
                    },
                    body:'<div class="marged"><a href="#" id="'+idPoint+'">'+msp.Util._("Point")+'</a><img class="middle" src="'+msp.Util.getImgUrl("drawing_point.png")+'"/>&nbsp;<a href="#" id="'+idLine+'">'+msp.Util._("Line")+'</a><img class="middle" src="'+msp.Util.getImgUrl("drawing_line.png")+'"/><a href="#" id="'+idPolygon+'">'+msp.Util._("Polygon")+'</a><img class="middle" src="'+msp.Util.getImgUrl("drawing_polygon.png")+'"/></div>'
                });
                /*
                 * Create action for drawingAsk dialog box
                 */
                $('#'+idPoint).click(function() {
                    self.startDrawing("__CONTROL_DRAWPOINT__");
                    return false;
                });
                $('#'+idLine).click(function() {
                    self.startDrawing("__CONTROL_DRAWLINE__");
                    return false;
                });
                $('#'+idPolygon).click(function() {
                    self.startDrawing("__CONTROL_DRAWPOLYGON__");
                    return false;
                });
            }
            
            /*
             * Show popup to the right position
             */
            self.askPopup.moveTo(msp.Map.mousePosition);
            self.askPopup.show();
            
        };
        
        /*
         * Show drawing info dialog
         */
        this.showStatus = function(type) {
            
            var txt,
                id = msp.Util.getId(),
                self = this;
            
            if (type === "draw") {
                txt = msp.Util._("You are in drawing mode")+'<br/><br/><a href="#" class="button" id="'+id+'">'+msp.Util._("Switch to modification mode")+'</a>';
            }
            else {
                txt = msp.Util._("You are in modification mode")+'<br/><br/><a href="#" class="button" id="'+id+'">'+msp.Util._("Switch to drawing mode")+'</a>';
            }
            
            if (!self.infoPopup) {
                self.infoPopup = new msp.Popup({
                    modal:false,
                    noHeader:true,
                    hideOnClose:true,
                    autoSize:true,
                    onClose: function() {

                        /*
                         * Switch back to Map default control
                         */
                        msp.Map.resetControl(self.control);
                        self.control = null;

                        /*
                         * Save layer
                         */
                        self.saveLayer();

                    },
                    cssClose:{
                        'top':'-8px',
                        'right':'-8px'
                    }
                });
            }
            
            /*
             * Set popup body
             */
            self.infoPopup.$b.html('<div class="marged">'+txt+'</div>');
            
            /*
             * Display popup
             */
            self.infoPopup.show();
            self.infoPopup.moveTo({x:msp.$map.width() / 2,y:100});
            
            /*
             * Set popup action
             */
            $('#'+id).click(function() {
                type === "draw" ? self.startModifying() : self.startDrawing();
                return false;
            });
            
        };
        
        /*
         * Save layer in KML
         */
        this.saveLayer = function() {

            var title,kml,
            self = this;
                
            if (self.layer.features.length === 0) {
                return false;
            }
            
            title = "MyLayer #"+msp.Util.getId();
            kml = msp.Map.Util.KML.layerToKML(self.layer, {
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
                        if (self && self.layer) {
                            self.layer.destroyFeatures();
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

            var self = this;

            /*
             * First reset control
             */
            msp.Map.resetControl(self.control);

            /*
             * Show dialog drawing mode
             */
            self.showStatus("draw");
                
            /*
             * Drawn object type is not defined => ask user
             */
            if (!type) {

                /*
                 * Display the '#drawingAsk' 
                 */
                self.askType();

            }
            /*
             * Drawn object type is defined => trigger corresponding control
             */
            else {

                /*
                 * Hide mask
                 */
                msp.mask.hide();
                if (self.askPopup) {
                    self.askPopup.hide();
                }

                /*
                 * Set active control to 'type' control
                 */
                self.control = msp.Map.Util.getControlById(type);

                if (self.control) {
                    self.control.activate();
                }
            }
        };
        
        /**
         * Enter modify mode
         */
        this.startModifying = function() {

            var hlt,
            self = this;

            /*
             * Reset control => OpenLayers bug ??
             */
            self.control.deactivate();
            msp.Map.Util.getControlById("__CONTROL_SELECT__").deactivate();
            hlt = msp.Map.Util.getControlById("__CONTROL_HIGHLITE__");
            if (hlt) {
                hlt.deactivate();
            }

            self.control = msp.Map.Util.getControlById("__CONTROL_MODIFY__");

            /*
             * Change info status
             */
            self.showStatus("modify");
            
            /*
             * Activate control
             */
            self.control.activate();
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Drawing._o = this;
        
        return this;
    };
})(window.msp);