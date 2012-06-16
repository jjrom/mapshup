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
         * Default metadata panel position
         */
        this.position = {
            top:100,
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
             * 
             * Structure of featureInfo panel
             * 
             *  ___________________________
             * |  ________                 |
             * | |        |     .tab       |
             * | |        |     .info      |
             * | | .thumb |                |
             * | |        |                |
             * | |________|                |
             * |___________________________|
             * |           .title          |
             * |           .actions        |
             * |_  ________________________|
             *   \/
             *   
             *   <div>
             *   
             *   
             *   </div>
             * 
             * 
             */
            $content = self.pn.add('<div class="header"><div class="title"></div></div><div class="tabs"></div><div class="body expdbl"></div>', 'pfi').addClass('shadow');
            
            /*
             * Add close button to feature info panel
             */
            msp.Util.addClose($content,function(e) {
                self.clear();
            });
            
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
             * Create feature menu div over the map container div
             */
            self.$m = msp.Util.$$("#fmenu", msp.$mcontainer).addClass("apo shadow");
            
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
                         * Show fmenu and panel content
                         */
                        self.$m.show();
                        self.pn.show();
                        
                    }
                    else {
                        /*
                         * Hide fmenu and panel content
                         */
                        self.$m.hide();
                        self.pn.hide();
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
         * Set $a html content
         */
        this.setActions = function(feature) {
            
            var a,d,i,l,connector,key,plugin,menuactions,_a,
            self = this,
            actions = [],
            fi = feature.layer["_msp"].layerDescription.featureInfo;
            
            /*
             * Clear feature menu
             */
            self.$m.empty();
            
            /*
             * Add a close button to feature action menu
             */
            msp.Util.addClose(self.$m, function(e){
                self.clear();
            });
            
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
                        tt:_a["title"],
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
                
                if (connector.action) {                    
                
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
             * Set title
             */
            self.$m.append('<div class="actions"></div><div class="title">'+msp.Map.Util.Feature.getTitle(feature)+'</div>');
            
            /*
             * Set actions
             */
            for (i = 0, l = actions.length;i < l; i++) {
                a = actions[i];
                $('.actions', self.$m).append('<a class="item image" jtitle="'+msp.Util._(a.tt || a.title)+'" id="'+a.id+'"><img class="middle" src="'+msp.Util.getImgUrl(a.icon)+'"/></a>');
                d = $('#'+a.id);
                
                /* Add tooltip */
                msp.tooltip.add(d, 's');
                
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
                msp.tooltip.add(d, 'n');
                
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
         * Set info popup html content
         * 
         * @input feature : the feature to display
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
        this.setInfo = function(feature, target) {
            
            var id,title,content,$info,$thumb,layerType,
            self = this,
            typeIsUnknown = true,
            // Thumbnail of quicklook attributes
            thumb = feature.attributes['thumbnail'] || feature.attributes['quicklook'] || null;

            /*
             * Target
             */
            target = target || self;
            
            /*
             * Set header
             */
            title = msp.Util.stripTags(msp.Map.Util.Feature.getTitle(feature));
            $('.title', target.$h).attr('title', feature.layer.name + ' | ' + title)
            .html(title)
            .click(function(){
                self.zoomOn(feature);
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
             * Roll over layer types to detect layer features that should be
             * displayed using a dedicated setFeatureInfoBody function
             */
            if ((layerType = msp.Map.layerTypes[feature.layer["_msp"].layerDescription["type"]])) {
                if ($.isFunction(layerType.setFeatureInfoBody)) {
                    layerType.setFeatureInfoBody(feature, target.$b);
                    typeIsUnknown = false;
                }
            }

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
                $thumb = $('.thumb', target.$b);
                
                /*
                 * Display thumbnail
                 */
                if (thumb) {
                    
                    /*
                     * Set content for $thumb with the thumbnail url
                     */
                    content = '<img src="'+thumb+'" class="padded">';
                    
                    /*
                     * Display quicklook on popup if defined
                     */
                    if (feature.attributes.hasOwnProperty('quicklook')) {
                        
                        id = msp.Util.getId();
                        $thumb.html('<a id="'+id+'" class="image" jtitle="'+msp.Map.Util.Feature.getTitle(feature)+'" title="'+msp.Util._("Show quicklook")+'" href="'+feature.attributes['quicklook']+'">'+content+'</a>');
                        
                        /*
                         * Popup image
                         */
                        $('#'+id).click(function() {
                            var $t = $(this);
                            msp.Util.showPopupImage($t.attr('href'), $t.attr('jtitle'));
                            return false;
                        });
                        
                    }
                    /*
                     * No quicklook, only display thumbnail
                     */
                    else {
                        $thumb.html(content);
                    }
                    
                    /*
                     * Add an action on "Add Quicklook to map" link
                     * This action is added only if layer allow to display Quicklook on the map
                     */
                    if (feature.layer["_msp"].qlToMap) {
                        id = msp.Util.getId()
                        $thumb.append('<br/><a href="#" class="center" id="'+id+'">'+msp.Util._('Add quicklook to map')+'</a>');
                        $('#'+id).click(function() {
                            msp.Map.addLayer({
                                type:"Image",
                                title:feature.attributes['identifier'],
                                url:feature.attributes['quicklook'],
                                bbox:feature.geometry.getBounds().toBBOX(),
                                /* By default, quicklooks are added to the "Quicklooks" group */
                                groupName:"Quicklooks"
                            });
                        });
                    }
                    
                }
                
                
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
                            $info.append('<tr><td>' + msp.Map.Util.Feature.translate(k, feature) + '</td><td>&nbsp;</td><td><a target="_blank" title="'+v+'" href="'+v+'">'+ msp.Util._("Download") +'</a></td></tr>');
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
                                            ts = msp.Map.Util.Feature.translate(kkk, feature);
                                            d.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + '</td><td>&nbsp;</td><td>' + v[kk][kkk] + '</td></tr>');
                                        }
                                    }

                                }
                                else {
                                    ts = msp.Map.Util.Feature.translate(k, feature);
                                    $info.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + ' &rarr; ' + msp.Map.Util.Feature.translate(kk, feature) + '</td><td>&nbsp;</td><td>' + v[kk] + '</td></tr>');
                                }
                            }

                        }
                        else {
                            ts = msp.Map.Util.Feature.translate(k, feature);
                            $info.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + '</td><td>&nbsp;</td><td>' + msp.Map.Util.Feature.getValue(feature,k,v) + '</td></tr>');
                        }
                    }
                }

                /*
                 * Set the tabs if any
                 */
                $("#pfit ul").idTabs(); 

            }
            
            /*
             * Tricky...
             * 
             * Be sure that free panel height is recomputed
             * after an image is loaded
             */
            $('img', target.$b).each(function(idx){
                $(this).load(function(){
                    if (target.pn.isVisible){
                        target.pn.show();
                    }
                });
            });
            
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
                     * Hide menu and metadata panel
                     */
                    self.$m.hide();
                    self.pn.hide();
                    
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
         * Zoom map on selected feature
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