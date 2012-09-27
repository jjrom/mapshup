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
 * Define FeatureInfo object
 */
(function (msp) {
    
    msp.Map.FeatureInfo = function(options) {

        /*
         * Only one FeatureInfo object instance is created
         */
        if (msp.Map.FeatureInfo._o) {
            return msp.Map.FeatureInfo._o;
        }
        
        /**
         * Current selected feature
         */
        this.selected = null;
        
        /**
         * Current hilited feature
         */
        this.hilited = null;
        
        /**
         * Feature info popup dimension
         */
        this.dimension = {
            w:100,
            h:50
        };
        
        /**
         * Initialization
         */
        this.init = function(options) {

            var self = this;
            
            /*
             * Init options
             */
            options = options || {};
            
            /*
             * 
             * Structure of feature info popup is defined
             * within msp.Map.Util.Feature.toHTML()
             * 
             */
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$container).addClass('fi apo');
            self.$d.html('<div class="main"></div>');
            
            /*
             * Add close button to feature info panel
             */
            msp.Util.addClose(self.$d, function(e) {
                self.clear();
            });
            
            /*
             * Update menu position on map move
             */
            msp.Map.map.events.register('move', msp.Map.map, function(){
                self.updatePosition();
            });
            
            /*
             * Hide FeatureInfo panel when layer is removed
             */
            msp.Map.events.register("layersend", this, function(action, layer, scope) {

                /*
                 * If a feature is selected and the corresponding layer is removed,
                 * then we unselect the feature
                 */
                if (action === "remove") {
                    if (scope.selected && scope.selected.layer && scope.selected.layer.id === layer.id) {
                        scope.unselect(scope.selected);
                    }
                }

                return true;
        
            });
            
            /*
             * Event on a change in layer visibility
             */
            msp.Map.events.register("visibilitychanged", self, function (layer, scope) {
                
                /*
                 * Show/Hide featureinfo menu depending on layer visibility
                 */
                if (self.selected && self.selected.layer === layer) {
                    
                    if (layer.getVisibility()) {
                        
                        /*
                         * Show feature info panel
                         */
                        self.$d.show();
                        
                    }
                    else {
                        
                        /*
                         * Hide feature info panel
                         */
                        self.$d.hide();
                        
                    }
                }
            });
            
            return self;            
            
        };
        
        
        /**
         * Unselect all feature
         */
        this.clear = function() {

            var c = msp.Map.Util.getControlById("__CONTROL_SELECT__");
            
            /*
             * The cluster nightmare
             */
            if (this.selected) {
                try {
                    c.unselect(this.selected);
                }
                catch(e) {
                    c.unselectAll();
                }
            }
            else {
                c.unselectAll();
            }
            
            this.unselect(null);
            
        };
        
        /**
         * Set actions content
         */
        this.setActions = function(feature) {
            
            var a,d,i,l,connector,key,plugin,menuactions,_a,$f,
            self = this,
            actions = [],
            fi = feature.layer["_msp"].layerDescription.featureInfo;
           
            /*
             * Clear actions menu
             */
            $f = $('.actions', self.$d).empty();
            
            /*
             * Add "Center on feature" action
             */
            actions.push({
                id:msp.Util.getId(),
                icon:"center.png",
                title:"Zoom",
                tt:"Zoom on feature",
                callback:function(a, f) {
                    self.zoomOn();
                    return false;
                }
            });
            
            /*
             * _mapshup defines specific actions and should contains optional properties
             *      - download : to add a download action
             *      - add : to add a layer
             * These actions are displayed within the actions list
             *
             */
            if (feature.attributes.hasOwnProperty("_mapshup")) {
                
                /*
                 * Download feature
                 */
                if(feature.attributes["_mapshup"]["download"]) {
                    actions.push({
                        id:msp.Util.getId(),
                        icon:"download.png",
                        title:"Download",
                        tt:"Download feature",
                        sla:function(a,f) {
                            if (f && f["attributes"]) {
                                
                                var d = f.attributes["_mapshup"]["download"];
                                
                                /*
                                 * Structure of d is :
                                 * {
                                 *      url: // url to download
                                 *      isFile: // boolean - if true url is a file. Otherwise it's a service
                                 * }
                                 */
                                a.attr("href", d.url);
                                
                                if (!d.isFile) {
                                    a.attr("target", "_blank");
                                }
                                
                            }
                        },
                        callback:function(a,f) {
                            return true;
                        }
                    });
                }
                _a = feature.attributes["_mapshup"]["add"];
                
                /*
                 * Add layer action
                 */
                if (_a) {
                    actions.push({
                        id:msp.Util.getId(),
                        icon:"add.png",
                        tt:_a["title"] || "Add to map",
                        title:"Add",
                        callback:function(a,f) {
                            
                            /*
                             * Add layer obj
                             */
                            var l = msp.Map.addLayer(f.attributes["_mapshup"]["add"]["layer"]);
                            
                            /*
                             * Force zoom on added layer
                             */
                            if (l) {
                                msp.Map.zoomTo(l.getDataExtent() || l["_msp"].bounds);
                            }
                            
                            return false;
                        }
                    });
                    
                }

            }
            
            /**
             * Add item from other plugins
             */
            for(key in msp.plugins) {
                plugin = msp.plugins[key];
                if (plugin) {
                    if ($.isFunction(plugin.getFeatureActions)) {
                        menuactions = plugin.getFeatureActions(feature);
                        if (menuactions) {
                            if (menuactions instanceof Array) {
                                for (i = 0, l = menuactions.length; i < l;i++) {
                                    actions.push(menuactions[i]);
                                }
                            }
                            else {
                                actions.push(menuactions);
                            }
                        }
                    }
                }
            }

            /*
             * If a layerDescription.featureInfo.action, add an action button
             */
            if (fi && fi.action) {

                /*
                 * The action is added only if javascript property is a valid function
                 */
                if ($.isFunction(fi.action.callback)) {
                    
                    /*
                     * Add feature action
                     */
                    actions.push({
                        id:msp.Util.getId(),
                        icon:fi.action["icon"],
                        title:fi.action["title"],
                        tt:fi.action["tt"],
                        callback:function(a, f) {
                            fi.action.callback(a, f);
                            return false;
                        }
                    });
                    
                }

            }

            /*
             * If feature layer got a searchContext, set actions defined within its connector
             */
            if (feature.layer["_msp"].searchContext) {

                connector = feature.layer["_msp"].searchContext.connector;
                
                if (connector && connector.action) {                    
                
                    /*
                     * Add feature action
                     */
                    actions.push({
                        id:msp.Util.getId(),
                        icon:connector.action["icon"],
                        title:connector.action["title"],
                        tt:connector.action["tt"],
                        sla:$.isFunction(connector.action.sla) ? connector.action.sla : null,
                        callback:function(a, f) {
                            
                            /*
                             * If an href was set with sla function, resolve href
                             * Otherwise trigger callback
                             */
                            if ($.isFunction(connector.action.callback)) {
                                if (a.attr("href") === "#") {
                                    connector.action.callback(a, f);
                                    return false;
                                }
                            }
                            return true;
                        }
                    });

                }

            }
            
            /*
             * Set actions
             */
            for (i = 0, l = actions.length;i < l; i++) {
                a = actions[i];
                $f.append('<a class="item image" jtitle="'+msp.Util._(a.tt || a.title)+'" id="'+a.id+'"><img class="middle" src="'+msp.Util.getImgUrl(a.icon)+'"/></a>');
                d = $('#'+a.id);
                
                /* Add tooltip */
                msp.tooltip.add(d, 'n', 10);
                
                (function(d,a,f){
                    d.click(function(e) {
                        return a.callback(a,f);
                    })
                })(d,a,feature);
                
                /*
                 * The "sla" function can be used to set href
                 */
                if (a.sla) {
                    a.sla(d, feature);
                }
                
            }
            
            /*
             * Hide featureHilite menu
             */
            msp.Map.$featureHilite.empty().hide();
            
        };
        
        
        /**
         * Set $a html content
         */
        this.setLayerActions = function(feature) {
            
            var a,bounds,d,i,l,
            self = this,
            actions = [],
            layer = feature.layer;
  
            /*
             * Clear layer info menu
             */
            self.$l.empty();
            
            /*
             * Center on layer
             * Vector layers should have a layer.getDataExtent() function that returns
             * the layer bounds
             * Raster layer (e.g. WMS, Image) should have a layer["_msp"].getDataExtent()
             */
            if ((bounds = layer.getDataExtent()) || (bounds = layer["_msp"].bounds)) {
                
                /**
                 * Do not set a zoomOn capability on layer
                 * with _msp.noZoomOn set to true
                 */
                if (!layer["_msp"].noZoomOn) {
                    actions.push({
                        id:msp.Util.getId(),
                        icon:"center.png",
                        title:"Center view on layer",
                        callback:function() {
                            msp.Map.zoomTo(bounds);
                        }
                    });
                }
            }
           
            /*
             * Remove layer
             */
            if (!layer["_msp"].unremovable) {
                actions.push({
                    id:msp.Util.getId(),
                    icon:"trash.png",
                    title:"Delete",
                    callback:function() {
                        msp.Map.removeLayer(layer, true);
                    }
                });
            }
            
            
            /*
             * Set title
             */
            self.$l.append('<div class="title">('+msp.Util._("Layer")+" : " + layer.name+')</div><div class="actions"></div>');
            
            /*
             * Set actions
             */
            for (i = 0, l = actions.length;i < l; i++) {
                a = actions[i];
                $('.actions', self.$l).append('<a class="item image" jtitle="'+msp.Util._(a.title)+'" id="'+a.id+'"><img class="middle" src="'+msp.Util.getImgUrl(a.icon)+'"/></a>');
                d = $('#'+a.id);
                
                /* Add tooltip */
                msp.tooltip.add(d, 'n', 10);
                
                (function(d,a,f){
                    d.click(function() {
                        return a.callback(a,f);
                    })
                })(d,a,feature);
                
                /*
                 * The "sla" function can be used to set href
                 */
                if (a.sla) {
                    a.sla(d, feature);
                }
                
            }
            
        };
        
        /**
         * Select feature and get its information
         * Called by "onfeatureselect" events
         * 
         * @input feature : 
         * @input _triggered : if true the feature selection has been triggered
         *                     automatically and not by a user click
         *                     This attribute is set to true by Catalog plugins
         *                     when feature is selected by clicking on the search result panel
         */
        this.select = function(feature, _triggered) {

            var c,i,bounds,length,ran,self = this;
            
            /*
             * Set select time (see unselect function)
             */
            self._tse = (new Date()).getTime();
            
            /*
             * If feature is a cluster, the map is zoomed on the cluster
             * extent upon click
             * 
             */
            if (feature.cluster) {
                
                length = feature.cluster.length;
                
                if (length > 0) {
                
                    /*
                     * Initialize cluster bounds with first item bounds
                     */
                    bounds = feature.cluster[0].geometry.getBounds().clone();

                    /*
                     * Add each cluster item bounds to the cluster bounds
                     */
                    for (i=1;i<length;i++) {
                        bounds.extend(feature.cluster[i].geometry.getBounds());
                    }

                    /*
                     * Zoom on the cluster bounds
                     */
                    msp.Map.map.zoomToExtent(bounds);
                    
                    /*
                     * Hide feature info panel
                     */
                    self.$d.hide();
                    
                    return false;
                    
                }
            }
            
            /*
             * Get Lon/Lat click position
             * If global _triggered is set to true then previous select was triggered by a process
             * and not by a user click. In this case the Lon/Lat click position is set on the middle
             * of the map
             */
            if (self._triggered) {
                self._ll = msp.Map.map.getCenter();
            }
            else {
                self._ll = feature.geometry && feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Point" ? feature.geometry.getBounds().getCenterLonLat() : msp.Map.map.getLonLatFromPixel(msp.Map.mousePosition);
            }
            
            /*
             * This is a bit tricky...
             * If _triggered is set to true, then set the global _triggered to true
             */
            if (_triggered) {
                self._triggered = true;
                c = msp.Map.Util.getControlById("__CONTROL_SELECT__");
                if (self.selected) {
                    try {
                        c.unselect(self.selected);
                    }
                    catch(e) {
                        self.selected = null
                    }
                }
                return c.select(feature);
            }
            
            /*
             * Call mapshup featureselect event unless the selected was triggered
             */
            if (!self._triggered) {
                msp.Map.events.trigger("featureselected", feature);
            }
            
            /*
             * Set _triggered to false (see above)
             */
            self._triggered = false;
            
            /*
             * Hide menu
             */
            msp.menu.hide();
            
            /*
             * Set the current selected object
             */
            msp.Map.featureInfo.selected = feature;
            
            /*
             * If layerType.resolvedUrlAttributeName is set,
             * display feature info within an iframe
             */
            ran = msp.Map.layerTypes[feature.layer["_msp"].layerDescription["type"]].resolvedUrlAttributeName;
            if (ran) {
                
                //extent = feature.geometry.getBounds().clone(); // Add container within panel
                
                /*
                 * Add a new item to South Panel
                 * 
                 * Note : unique id is based on the feature layer type
                 * and feature layer name. Ensure that two identical
                 * feature leads to only one panel item 
                 */
                var t = msp.Map.Util.Feature.getTitle(feature), panelItem = msp.sp.add({
                    id:msp.Util.crc32(t + feature.layer["_msp"].layerDescription["type"]),
                    tt:t,
                    title:t,
                    unremovable:false,
                    html:'<iframe class="frame" src="'+feature.attributes[ran]+'" width="100%" height="100%"></iframe>',
                    onclose:function() {
                        
                        /*
                         * Unselect feature
                         */
                        if (feature && feature.layer) {
                            msp.Map.Util.getControlById("__CONTROL_SELECT__").unselect(feature);
                        }
                        
                        /*
                         * Hide activity
                         */
                        msp.activity.hide();
                        

                    }
                });
                
                msp.sp.show(panelItem);
                
                msp.activity.show();
                $('.frame', panelItem.$d).load(function() {
                    msp.activity.hide();
                });
              
            }
            else {
               
                /*
                 * Set info for feature
                 */
                msp.Map.Util.Feature.toHTML(feature, $('.main', self.$d));

                /*
                 * Set actions for feature
                 */
                self.setActions(feature);
                
                /*
                 * Show feature information
                 */
                self.$d.show();

                /*
                 * Update menu position
                 */
                self.updatePosition(true);

            }
            
            return true;
            
        };

        /**
         * Unselect feature and clear information
         * Called by "onfeatureunselect" events
         */
        this.unselect = function(feature) {
            
            var self = this;
            
            /*
             * Set unselect time
             */
            self._tun = (new Date()).getTime();
            
            
            msp.Map.featureInfo.selected = null;
            
            /*
             * Call mapshup featureselect event
             */
            msp.Map.events.trigger("featureselected", null);
            
            /*
             * This is really and awfully tricky...
             * If user select another feature, the current feature is unselected
             * before the new one is selected.
             * Thus, we should close the panel if and only if the unselect is a 
             * true unselect and not an unselect due to a new select.
             * This is done by delaying the panel closing to a time superior to
             * the delay between an unselect/select sequence
             */
            setTimeout(function(){
                 
                if (self._tun - self._tse > 0) {
                    
                    /*
                     * Hide feature info panel
                     */
                    msp.menu.hide();
                    self.$d.hide();
            
                }
                
            }, 100);
            
        };

        /*
         * Update feature info panel position
         */
        this.updatePosition = function(visible) {
            
            var xy,
            self = this;
            
            if (self.selected && self.selected.geometry) {
                
                /*
                 * Clustering nightmare.
                 * A feature is selected - User zoom out and the corresponding
                 * feature is cluserized. Thus, selected.layer does not exist.
                 * To avoid this, hide the feature info panel if selected.layer is null 
                 * 
                 * If layer exist but is not visible, hide the feature info panel
                 */
                if (!self.selected.layer || !self.selected.layer.getVisibility()) {
                    
                    // Hide feature info panel
                    self.$d.hide();
                    
                    return false;
                }
            
                
                if (!msp.Map.layerTypes[self.selected.layer["_msp"].layerDescription["type"]].resolvedUrlAttributeName){
                    
                    xy = msp.Map.map.getPixelFromLonLat(self._ll);
                    
                    /*
                     * Set action info menu position
                     */
                    self.$d.show().css({
                        'left': xy.x - 31, //'left': xy.x - self.$d.outerWidth() + 31,
                        'top': xy.y - self.$d.outerHeight() - 12 // 'top': xy.y + 12
                    });
                    
                    /*
                     * If visible is set to true then move the map
                     * to ensure that feature info panel is completely
                     * visible
                     */
                    if (visible) {
                        
                        /*
                         * Check if LayersManager is visible
                         */
                        var lmo,top,left,dx,dy,c;
                        
                        lmo = $('.lm').offset();
                        top = msp.$map.offset().top + (lmo ? lmo.top : 0) + 35;
                        left = msp.$map.offset().left + msp.$map.width();
                        dy = self.$d.offset().top - top;
                        dx = left - self.$d.offset().left - self.$d.outerWidth() - 35;
                        
                        if (dx > 0) {
                            dx = 0;
                        }
                        if (dy > 0) {
                            dy = 0;
                        }
                    
                        /*
                         * Transform pixels to meters
                         */
                        if (dx < 0 || dy < 0) {
                            c = msp.Map.map.getPixelFromLonLat(msp.Map.map.getCenter());
                            msp.Map.map.setCenter(msp.Map.map.getLonLatFromPixel(new OpenLayers.Pixel(c.x - dx, c.y + dy)));
                        }
                        
                    }
                    
                }
            }
            
            return true;
            
        };
        
        /**
         * Zoom map on selected feature
         */
        this.zoomOn = function() {
            if (msp.Map.featureInfo.selected && msp.Map.featureInfo.selected.geometry) {
                msp.Map.zoomTo(msp.Map.featureInfo.selected.geometry.getBounds());
            }
        };
        
        /*
         * Hilite feature
         */
        this.hilite = function(f) {
            
            var self = this,
                c = msp.Map.Util.getControlById("__CONTROL_HIGHLITE__");
                
            if (c && f) {
                try {
                    
                    /*
                     * First unhighlight all feature
                     */
                    var i, l, fs = msp.Map.Util.getFeatures(f.layer);
                    
                    for (i = 0, l = fs.length; i < l; i++) {
                        c.unhighlight(fs[i]);
                    }
                    
                    /*
                     * Highlite input feature
                     */
                    self.hilited = f;
                    c.highlight(f);
                    
                }
                catch(e) {}
            }
            
        };
        
        /*
         * Hilite feature
         */
        this.unhilite = function(f) {
            
            var self = this,
                c = msp.Map.Util.getControlById("__CONTROL_HIGHLITE__");
                
            if (c && f) {
                try {
                    
                    /*
                     * Unhighlite input feature
                     */
                    self.hilited = null;
                    c.unhighlight(f);
                    
                }
                catch(e) {}
            }
            
        };
        
        /*
         * Create unique object instance
         */
        msp.Map.FeatureInfo._o = this;

        return this.init(options);
    }
    
})(window.msp);