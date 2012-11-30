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
 * 
 */
(function(M) {
    
    M.Plugins.Drawing = function() {
        
        /*
         * Only one Drawing object instance is created
         */
        if (M.Plugins.Drawing._o) {
            return M.Plugins.Drawing._o;
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
            $.extend(self.options,{
                title:options.title || "Draw layer",
                icon:options.icon || "drawing.png",
                inMenu:M.Util.getPropertyValue(self.options, "inMenu", true)
            });
            
            /*
             * Add "Drawing" item in menu
             */
            if (M.menu && self.options.inMenu) {
                M.menu.add([{
                    id:M.Util.getId(),
                    ic:self.options.icon,
                    ti:self.options.title,
                    cb:function() {
                        self.clear();
                        self.askType();
                    }
                }]);
            }
           
            self.layer = new OpenLayers.Layer.Vector(M.Util.getId(), {
                projection:M.Map.pc,
                displayInLayerSwitcher:false,
                styleMap:new OpenLayers.StyleMap({
                    'default':{
                        pointRadius:5,
                        strokeColor:'white',
                        strokeWidth: 2,
                        fillColor:'black',
                        fillOpacity: 0.3
                    }
                })
            });

            /**
             * Add Drawing layer to Map object
             */
            M.Map.addLayer({
                type:"Generic",
                title:self.layer.name,
                unremovable:true,
                MLayer:true,
                layer:self.layer
            });

            /**
             * Event on sketchcomplete
             */
            self.layer.events.on({
                "sketchcomplete": function(event) {
                    self.onFeatureAdded(self, event);
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
                M.Map.map.addControl(controls[key]);
            }

            M.Map.events.register("layersend", self, function(action, layer, scope) {
                
                /*
                 * Each time a layer is added make sure Drawing layer is on top
                 */
                if (action === "add" && scope.layer) {
                    M.Map.Util.setLayerOnTop(scope.layer);
                }
                
                /*
                 * Be carefull to nullify activeLayer if it is removed
                 */
                if (action === "remove" && scope._activeLayer && scope._activeLayer.id === layer.id) {
                    scope._activeLayer = null;
                }
                
            });

            /*
             * Initialize a GeoJSON format reader
             */
            self.GeoJSONFormat = new OpenLayers.Format.GeoJSON();
            
            return self;
            
        };
        
        /*
         * Ask feature type to user
         * 
         */
        this.askType = function(fromStatus) {
            
            var idPoint,idLine,idPolygon,
            self = this;
            
            if (!self.askPopup) {
                idPoint = M.Util.getId();
                idLine = M.Util.getId();
                idPolygon = M.Util.getId();
                self.askPopup = new M.Popup({
                    modal:false,
                    centered:false,
                    noHeader:true,
                    hideOnClose:true,
                    autoSize:true,
                    body:'<div class="marged"><a href="#" id="'+idPoint+'">'+M.Util._("Point")+'</a><img class="middle" src="'+M.Util.getImgUrl("point.png")+'"/>&nbsp;<a href="#" id="'+idLine+'">'+M.Util._("Line")+'</a><img class="middle" src="'+M.Util.getImgUrl("line.png")+'"/><a href="#" id="'+idPolygon+'">'+M.Util._("Polygon")+'</a><img class="middle" src="'+M.Util.getImgUrl("polygon.png")+'"/></div>'
                });
                /*
                 * Create action for drawingAsk dialog box
                 */
                $('#'+idPoint).click(function() {
                    self.startDrawing({type:"__CONTROL_DRAWPOINT__"});
                    return false;
                });
                $('#'+idLine).click(function() {
                    self.startDrawing({type:"__CONTROL_DRAWLINE__"});
                    return false;
                });
                $('#'+idPolygon).click(function() {
                    self.startDrawing({type:"__CONTROL_DRAWPOLYGON__"});
                    return false;
                });
            }
            
            /*
             * Show popup to the right position
             */
            self.askPopup.show();
            self.askPopup.setMapXY(fromStatus ? M.Map.map.getCenter() : M.Map.map.getLonLatFromPixel(M.Map.mousePosition));
            
        };
        
        /*
         * Show drawing info dialog
         */
        this.showStatus = function() {
            
            var self = this;
            
            if (self.hideInfo) {
                return;
            }
        
            if (!self.infoPopup) {
                
                var id = M.Util.getId();
                
                self.infoPopup = new M.Popup({
                    modal:false,
                    centered:false,
                    noHeader:true,
                    hideOnClose:true,
                    autoSize:true,
                    unbounded:true,
                    onClose: function() {

                        /*
                         * Empty drawing layer
                         */
                        self.clear();
                        
                        /*
                         * Switch back to Map default control
                         */
                        M.Map.resetControl(self.control);
                        self.control = null;

                    },
                    body:'<span class="marged">'+M.Util._("You are in drawing mode")+'&nbsp;&nbsp;<a href="#" class="button inline t" id="'+id+'">'+M.Util._("modify")+'</a> <a href="#" class="button validate inline s">'+M.Util._("Save")+'</a></span>'
                });
                
                /*
                * Set popup action
                */
                $('#'+id).click(function() {
                    self.status === "draw" ? self.startModifying() : self.startDrawing({fromStatus:true});
                    return false;
                });
               
                /*
                 * Save layer
                 */
                $('.s', self.infoPopup.$d).click(function(){
                    self.updateLayer();
                    self.infoPopup.hide();
                });
                
            }
            
            /*
             * Set popup body
             */
            $('.t', self.infoPopup.$b).html(self.status === "draw" ? M.Util._("modify") : M.Util._("draw"));
            
            /*
             * Display popup
             */
            self.infoPopup.show();
            self.infoPopup.moveTo({
                x:M.$map.width() - self.infoPopup.$d.width() / 2 - 100,
                y:5
            });
            
            return;
        };
        
        /*
         * Add features do active layer
         */
        this.updateLayer = function() {
            
            var geojson, self = this;
            
            try {
                geojson = JSON.parse(self.GeoJSONFormat.write(M.Map.Util.getFeatures(self.layer, {
                    toDisplayProjection:true
                })));
                
                /*
                * Empty the drawing layer
                */
                self.clear();
                
            }
            catch (e) {
                M.Util.message("Error : cannot update layer");
                return false;
            }
            
            M.Map.layerTypes["GeoJSON"].load({
                data:geojson,
                layer:this.getActiveLayer()
            });
            
            this.saveLayer();
            
            return true;
            
        };
        
        /*
         * Return current layer
         */
        this.getActiveLayer = function() {
            
            /*
             * Initialize layer
             */
            if (!this._activeLayer) {
                this._activeLayer = M.Map.addLayer({
                    type:"GeoJSON",
                    title:"My layer #"+M.Util.sequence++,
                    clusterized:false,
                    MID:M.Util.crc32((new Date()).toString() + Math.random()),
                    icon:M.Util.getImgUrl("drawing.png"),
                    editable:true,
                    ol:{
                        styleMap: new OpenLayers.StyleMap({
                            'default':{
                                strokeColor:'white',
                                strokeWidth: 1,
                                fillColor:M.Util.randomColor(),
                                fillOpacity: 0.2,
                                pointRadius:5
                            }
                        })
                    }
                });
            }
            
            return this._activeLayer;
            
        };
        
        /*
         * Save layer in GeoJSON
         */
        this.saveLayer = function() {

            var title, geojson, self = this, l = self.getActiveLayer();
                
            if (l.features.length === 0) {
                return false;
            }
            
            try {
                geojson = self.GeoJSONFormat.write(M.Map.Util.getFeatures(l, {
                    toDisplayProjection:true
                }));
            }
            catch (e) {
                M.Util.message("Error : cannot save layer on server");
                return false;
            }
            
            /*
             * Save GeoJSON layer to the server
             */
            M.Util.ajax({
                url:M.Util.getAbsoluteUrl(M.Config["general"].saveStreamServiceUrl)+M.Util.abc,
                async:true,
                type:"POST",
                data:{
                    s:encodeURIComponent(geojson),
                    format:'json',
                    uid:l['_M'].layerDescription.MID
                },
                dataType:"json",
                success: function(data) {

                    if (data.error) {
                        M.Util.message(data.error["message"]);
                    }
                    else {
                        l['_M'].layerDescription.url = data.url;
                    }
                },
                error: function(e) {
                    M.Util.message(M.Util._("Server error") + " " + M.Util._("The layer cannot be saved"));
                }

            },{
                title:M.Util._("Saving layer") + " : " + M.Util._(title),
                cancel:true
            });

            return true;

        };
        
        
        /**
         * Enter drawing mode
         * 
         * @param {Object} options {
         *                              type: drawing type 
         *                              fromStatus: if true, display askType popup
         *                                          below the infoPopup
         */
        this.startDrawing = function(options) {

            var self = this;
            
            options = options || {};
            
            /*
             * First reset control
             */
            M.Map.resetControl(self.control);

            /*
             * Show dialog drawing mode
             */
            self.status = "draw"
            self.showStatus();
                
            /*
             * Drawn object type is not defined => ask user
             */
            if (!options.type) {

                /*
                 * Display the '#drawingAsk' 
                 */
                self.askType(options.fromStatus);

            }
            /*
             * Drawn object type is defined => trigger corresponding control
             */
            else {

                /*
                 * Hide mask
                 */
                M.mask.hide();
                if (self.askPopup) {
                    self.askPopup.hide();
                }

                /*
                 * Set active control to 'type' control
                 */
                self.control = M.Map.Util.getControlById(options.type);

                if (self.control) {
                    self.control.activate();
                }
            }
        };
        
        /**
         * Enter modify mode
         */
        this.startModifying = function() {

            var hlt, self = this;

            /*
             * Reset control => OpenLayers bug ??
             */
            self.control.deactivate();
            M.Map.Util.getControlById("__CONTROL_SELECT__").deactivate();
            hlt = M.Map.Util.getControlById("__CONTROL_HIGHLITE__");
            if (hlt) {
                hlt.deactivate();
            }

            self.control = M.Map.Util.getControlById("__CONTROL_MODIFY__");

            /*
             * Change info status
             */
            self.status = "modify";
            self.showStatus();
            
            /*
             * Activate control
             */
            self.control.activate();
        };
    
        /**
         * Function called when a feature is added
         * This function can be superseed during Plugin
         * initialization
         * 
         * @param {Object} scope (this object)
         * @param {Object} event
         * 
         */
        this.onFeatureAdded = function(scope, event) {
            
            /*
             * Of byPassOnFeatureAdded is set use it instead
             * of normal onFeatureAdded function (see WPSClient)
             */
            if ($.isFunction(scope.bypassOnFeatureAdded)) {
                return scope.bypassOnFeatureAdded(event);
            }
            
            /*
            * Hide ask popup if any
            */
            if (scope.askPopup) {
                scope.askPopup.hide();
            }

            /*
             * Show mask
             */
            M.mask.show(true);

            /*
             * Ask user description of newly created feature
             */
            var popup = new M.Popup({
                modal: false,
                centered: false,
                noHeader: true,
                autoSize: true,
                followMap: false,
                mapXY: event.feature.geometry.getBounds().getCenterLonLat(),
                onClose: function() {
                    M.mask.hide();
                },
                body: '<form class="marged"><label>' + M.Util._("Feature title") + '<br/><input id="featureTitle" type="text"/></label><br/><label>' + M.Util._("Feature description") + '<br/><textarea id="featureDesc"/></label><div style="margin:10px 0px;"><a href="#" class="button inline colored" id="featureDescV">' + M.Util._("Validate") + '</a></div></form>'
            });
            popup.show();

            $('#featureDescV').click(function() {
                var f = event.feature;
                if (f) {
                    f.attributes.name = M.Util.stripTags($('#featureTitle').val());
                    f.attributes.description = M.Util.stripTags($('#featureDesc').val());
                }
                if (popup) {
                    popup.remove();
                }
                M.mask.hide();
                return false;
            });

            /*
             * Initialize value
             */
            $('#featureTitle').val("").focus();
            $('#featureDesc').val("");
            
            return;
            
        };
        
        /*
         * Clear drawing layer
         */
        this.clear = function() {
            this.layer.destroyFeatures();
        };
    
        /*
         * ByPass the onFeatureAdded function
         * See WPSClient
         * @param {type} fct
         */
        this.bypass = function(fct) {
            
            var self = this;
 
            self.clear();
            self.hideInfo = true;
            self.bypassOnFeatureAdded = function(event) {
                fct(event);
                self.bypassOnFeatureAdded = null;
                self.hideInfo = false;
                M.Map.resetControl(self.control);
                self.control = null;
            }               
        }
    
        /*
         * Set unique instance
         */
        M.Plugins.Drawing._o = this;
        
        return this;
    };
})(window.M);