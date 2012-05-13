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
 * Define RasterInfo object
 */
(function (msp) {
    
    msp.Map.RasterInfo = function(options) {

        /*
         * Only one RasterInfo object instance is created
         */
        if (msp.Map.RasterInfo._o) {
            return msp.Map.RasterInfo._o;
        }
        
        /**
         * Default metadata panel position
         */
        this.position = {
            top:20,
            right:50
        };
        
        /**
         * Initialization
         */
        this.init = function(options) {

            var $content,self = this;
            
            /*
             * Init options
             */
            options = options || {};
            
            /*
             * Feature Information is displayed within a dedicated panel
             */
            self.pn = new msp.Panel();
            
            /*
             * Add content
             */
            $content = self.pn.add('<div class="header"><div class="title"></div></div><div class="tabs"></div><div class="body expdbl"></div>', 'pfi').addClass('shadow');
            
            /*
             * Set panel position and height
             */
            self.pn.$d.css({
                'top':self.position.top,
                'right':self.position.right
            });
            
            /*
             * Set div references
             */
            self.$t = $('.tabs', $content); // Tabs
            self.$b = $('.body', $content); // Body
            self.$h = $('.header', $content); // Header
            self.$d = $('.pfi', $content); // Parent div
            
            /*
             * Update menu position on map move
             */
            msp.Map.map.events.register('move', msp.Map.map, function(){
                self.updatePosition();
            });
            
            
            return self;            
            
        };
        
        /**
         *
         * Return raster icon url
         * 
         * Icon is assumed to be a square image of 75x75 px displayed within NorthPanel
         *
         * @input {OpenLayers.Layer} layer : input layer
         *
         */
        this.getIcon = function(layer) {
           return layer ? layer["_msp"]["layerDescription"].icon : null;
        }

        /**
         * Set $a html content
         */
        this.setActions = function(layer) {
            
            var a,bounds,d,i,l,
            self = this,
            actions = [];
  
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
                msp.tooltip.add(d, 'n');
                
                (function(d,a){
                    d.click(function() {
                        return a.callback(a);
                    })
                })(d,a);
                
            }
            
        };
        
        /**
         * Set info popup html content
         * 
         * @input layer : layer to display
         * @input target : target object containing divs to display feature info
         *                 This object should contain at least the following properties
         *                 {
         *                      $h: // header reference
         *                      $t: // tab reference
         *                      $b: // body reference
         *                 }
         *                 If target is not specified, it is assumed that
         *                 the target is "this"
         */
        this.setInfo = function(layer, target) {
            
            var id,title,$info,$thumb,
            self = this,
            typeIsUnknown = true;

            /*
             * Target
             */
            target = target || self;
            
            /*
             * Set header
             */
            $('.title', target.$h).attr('title', layer.name)
            .html(title)
            .click(function(){
                msp.Map.Util.zoomTo(layer.getDataExtent() || layer["_msp"].bounds);
            });      
                
            /*
             * Clean body
             */
            target.$b.empty();
            
            /*
             * Clean tab
             */
            target.$t.empty();
            
            /*
             * If feature type is unknown, use default display
             * 
             * Two cases :
             *  - feature get a 'thumbnail' property -> add two independant blocks
             *  - feature does not get a 'thumbnail' property -> add one block
             *  
             * In both case, key/value are displayed within a <table>
             * 
             *      <div class="thumb"></div>
             *      <div class="info"></div>
             * 
             * 
             */
            if (typeIsUnknown) {
                
                /*
                 * Initialize $b content.
                 * 
                 * Structure :
                 *  <div id="pfitm">
                 *      <div class="thumb"></div>
                 *      <div class="info"></div>
                 *  </div>
                 */
                target.$b.html('<div id="pfitm"><div class="thumb"></div><div class="info"><table></table></div></div>');
                $info = $('.info table', target.$b);
                
                /*
                 * Set variable and references
                 */
                var d,v,t,i,l,k,kk,kkk,ts;

                /*
                 * Roll over attributes  
                 */   
                for (k in feature.attributes) {

                    /*
                     * Special keywords
                     */
                    if (k === 'identifier' || k === 'icon' || k === 'thumbnail' || k === 'quicklook') {
                        continue;
                    }

                    /*
                     * Get key value
                     */
                    if((v = feature.attributes[k])) {

                        /*
                         * Check type
                         */
                        t = typeof v;

                        /*
                         * Simple case : string
                         */
                        if (t === "string" && msp.Util.isUrl(v)) {
                            $info.append('<tr><td>' + self.translate(k, feature) + '</td><td>&nbsp;</td><td><a target="_blank" title="'+v+'" href="'+v+'">'+ msp.Util._("Download") +'</a></td></tr>');
                        }
                        /*
                         * Object case
                         */
                        else if (t === "object") {

                            /*
                             * Special case for _mapshup property
                             * _mapshup defines specific actions and should contains optional properties
                             *      - download : to add a download action
                             *      - add : to add a layer
                             * These actions are displayed within the actions list - see this.setActions(feature) function
                             *
                             */
                            if (k === "_mapshup") {
                                continue;
                            }

                            /*
                             * Roll over properties name
                             */
                            for (kk in v) {

                                /*
                                 * Check type : if object => create a new tab
                                 */
                                if (typeof v[kk] === "object") {

                                    /*
                                     * Special case for photos array
                                     * No tab is created but instead a photo gallery
                                     * is displayed
                                     */
                                    if (kk === 'photo') {
                                        for (i = 0, l = v[kk].length; i < l; i++) {
                                            id = msp.Util.getId();
                                            $thumb.append('<a href="'+v[kk][i]["url"]+'" title="'+v[kk][i]["name"]+'" id="'+id+'" class="image"><img height="50px" width="50px" src="'+v[kk][i]["url"]+'"/></a>');
                                            /*
                                             * Popup image
                                             */
                                            (function($id){
                                                $id.click(function() {
                                                    msp.Util.showPopupImage($id.attr('href'), $id.attr('title'));
                                                    return false;
                                                });    
                                            })($('#'+id));
                                            
                                        }
                                        continue;
                                    }

                                    /*
                                     * Initialize tab
                                     */
                                    if (target.$t.is(':empty')) {
                                        target.$t.html('<div id="pfit"><ul><li><a href="#pfitm" class="selected">'+msp.Util._("Description")+'</a></li></ul></div>');
                                    }
                                    
                                    /*
                                     * If v[kk] is not an array or is an empty array, go to the next property
                                     */
                                    if (typeof v[kk].length !== "number" || v[kk].length === 0) {
                                        continue;
                                    }
                                    
                                    /*
                                     * If kk object is a non empty array, add a new tab
                                     */
                                    id = msp.Util.getId() ;
                                    $('ul', target.$t).append('<li><a href="#' + id + '">' + msp.Util._(kk) + '</a></li>');
                                    target.$b.append('<div id="'+id+'" class="noflw"><table></table></div>');

                                    /*
                                     * Table reference
                                     */
                                    d = $('table', $('#'+id));

                                    /*
                                     * Special case for videos
                                     */
                                    if (kk === "video" || kk === "audio") {
                                        for (i = 0, l = v[kk].length; i < l; i++) {
                                            
                                            /*
                                             * Popup video
                                             */
                                            id = msp.Util.getId();
                                            
                                            d.append('<tr><td><a id="'+id+'" href="'+v[kk][i]["url"]+'">' + v[kk][i]["name"] + '</a></td></tr>');
                                            
                                            
                                            (function($id){
                                                $id.click(function() {
                                                    msp.Util.showPopupVideo({
                                                        url:$id.attr('href'), 
                                                        title:$id.attr('title')
                                                    });
                                                    return false;
                                                });    
                                            })($('#'+id));
                                            
                                        }
                                    }
                                    else {
                                        for (kkk in v[kk]) {
                                            ts = self.translate(kkk, feature);
                                            d.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + '</td><td>&nbsp;</td><td>' + v[kk][kkk] + '</td></tr>');
                                        }
                                    }

                                }
                                else {
                                    ts = self.translate(k, feature);
                                    $info.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + ' &rarr; ' + self.translate(kk, feature) + '</td><td>&nbsp;</td><td>' + v[kk] + '</td></tr>');
                                }
                            }

                        }
                        else {
                            ts = self.translate(k, feature);
                            $info.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + '</td><td>&nbsp;</td><td>' + self.getValue(feature,k,v) + '</td></tr>');
                        }
                    }
                }

                /*
                 * Set the tabs if any
                 */
                $("#pfit ul").idTabs(); 

            }
            
        };

        /**
         * Select feature and get its information
         * Called by "onfeatureselect" events
         * 
         * @input layer 
         */
        this.select = function(layer) {

            var c,i,bounds,length,ran,self = this;
            
            /*
             * Set select time (see unselect function)
             */
            self._tse = (new Date()).getTime();
            
            
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
             * Set _triggered to false (see above)
             */
            self._triggered = false;
            
            /*
             * If the feature belongs to a layer with a SearchContext
             * then we should hilite the corresponding line in the result panel
             */
            if (feature.layer["_msp"].searchContext) {
                
                var $t = feature.layer["_msp"].searchContext.$t;
                
                if ($t) {
                
                    /*
                     * Remove active class for every <tr>
                     */
                    $t.removeClass('active');
                    
                    /*
                     * Hilite the feature corresponding element in search result
                     */
                    $t.each(function(idx) {
                        if ($(this).attr('fid') === feature.id) {
                            $(this).addClass('active');
                        }
                    });
                }     
            }
            
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
                var t = self.getTitle(feature), panelItem = msp.sp.add({
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
                self.setInfo(feature);

                /*
                 * Set actions for feature
                 */
                self.setActions(feature);
                
                /*
                 * Show feature information
                 */
                self.show();

                /*
                 * Update menu position
                 */
                self.updatePosition();

            }
            return true;
        };
        
        /**
         * Show feature info panel
         */
        this.show = function(target) {
            
            target = target || this;
            
            /*
             * Show metadata panel
             */
            target.pn.show();
            
            /*
             * Hide tabs if empty
             */
            target.$t.is(':empty') ? target.$t.hide() : target.$t.show();
            
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
                     * Hide menu and fmenu
                     */
                    msp.menu.hide();
                    self.$m.hide();
            
                    /*
                     * Hide panel content
                     */
                    self.pn.hide();
                    
                }
                
            }, 100);
            
        };

        /*
         * Update fmenu position
         */
        this.updatePosition = function() {
            
            var xy,
            self = this;
            
            if (self.selected && self.selected.geometry) {
                
                /*
                 * Clustering nightmare.
                 * A feature is selected - User zoom out and the corresponding
                 * feature is cluserized. Thus, selected.layer does not exist.
                 * To avoid this, hide the feature info panel if selected.layer is null 
                 */
                if (!self.selected.layer) {
                    
                    // Hide menu
                    self.$m.hide();
                    
                    // Hide panel
                    self.pn.hide();
                    
                    return false;
                }
            
                
                if (!msp.Map.layerTypes[self.selected.layer["_msp"].layerDescription["type"]].resolvedUrlAttributeName){
                    
                    xy = msp.Map.map.getPixelFromLonLat(self._ll);
                    
                    /*
                     * Set action info menu position
                     */
                    self.$m.show().css({
                        'left': xy.x - self.$m.outerWidth() + 31,
                        'top': xy.y + 12
                        //'top': xy.y - self.$m.outerHeight() - 12
                    });

                    /*
                     * Compute info panel max height
                     */
                    self.pn.$d.css({
                        'max-height': Math.round(msp.$map.height() * 0.9) - self.pn.$d.offset().top
                    });
                    
                }
            }
            
            return true;
            
        };
        
        /**
         * Zoom map on selected layer
         */
        this.zoomOn = function() {
            if (msp.Map.featureInfo.selected && msp.Map.featureInfo.selected.geometry) {
                msp.Map.zoomTo(msp.Map.featureInfo.selected.geometry.getBounds());
            }
        }
     
        /*
         * Create unique object instance
         */
        msp.Map.FeatureInfo._o = this;

        return this.init(options);
    }
    
})(window.msp);