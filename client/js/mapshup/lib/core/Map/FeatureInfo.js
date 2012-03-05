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
         * Initialization
         */
        this.init = function(options) {

            var self = this,
            id = msp.Util.getId();
            
            /*
             * Init options
             */
            self.options = options || {};

            /*
             * By default, feature information is displayed wihtin
             * a North East vertical panel
             */
            $.extend(self.options,
            {
                position:self.options.position || 'ne',
                orientation:self.options.orientation || 'v'
            }
            );

            /*
             * Feature Informartion is displayed within a West panel container
             */
            self.ctn = (new msp.Panel('w')).add('<div class="header"><div class="title">'+msp.Util._("Feature information")+'</div></div><div class="tabs"></div><div class="body expdbl"></div>', 'pfi');
            
            /*
             * Add an unselect button
             */
            self.ctn.$d.append('<div id="'+id+'" class="close"></div>');
            $('#'+id).click(function() {
  
                /*
                 * Unselect feature
                 */
                self.selected ? msp.Map.Util.getControlById("__CONTROL_SELECT__").unselect(self.selected) : self.unselect();
                
            }).css({
                'top':'-8px',
                'right':'-8px'
            });

            /*
             * Set references
             */
            self.$t = $('.tabs', self.ctn.$d); // Tabs
            self.$b = $('.body', self.ctn.$d); // Body
            self.$h = $('.header', self.ctn.$d); // Header
            self.$d = $('.pfi', self.ctn.$d); // Parent div
            
            /*
             * Create feature menu div over the map container div
             */
            self.$m = msp.Util.$$("#fmenu", msp.$mcontainer).addClass("shadow");
            
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
         * Return feature title if it's defined within layerDescription.featureInfo.title property
         *
         * @input {OpenLayers.Feature} feature : input feature
         */
        this.getTitle = function(feature) {

            /*
             * Paranoid mode
             */
            if (!feature) {
                return null;
            }

            /*
             * First check if feature is a cluster
             */
            if (feature.cluster && feature.cluster.length > 0) {
                return msp.Util._(feature.layer.name) + ": " + feature.cluster.length + " " + msp.Util._("entities");
            }

            /*
             * User can define is own title with layerDescription.featureInfo.title property
             */
            if (feature.layer["_msp"].layerDescription.featureInfo && feature.layer["_msp"].layerDescription.featureInfo.title) {
                return msp.Util.replaceKeys(feature.layer["_msp"].layerDescription.featureInfo.title, feature.attributes);
            }

            /*
             * Otherwise returns name or title or identifier or id
             */
            return feature.attributes["name"] || feature.attributes["title"] || feature.attributes["identifier"] || feature.id || "";

        };
        
        /*
         * Get feature attribute value
         * 
         * If layerDescription.featureInfo.keys array is set and if a value attribute is set for "key"
         * then input value is transformed according to the "value" definition
         *
         * @input {OpenLayers.Feature} feature : feature reference
         * @input {String} key : key attribute name
         * @input {String} value : value of the attribute
         */
        this.getValue = function(feature, key, value) {

            var k, keys;
            
            /*
             * Paranoid mode
             */
            if (!feature || !key) {
                return value;
            }

            /*
             * Check if keys array is defined
             */
            if (feature.layer["_msp"].layerDescription.hasOwnProperty("featureInfo")) {
                
                keys = feature.layer["_msp"].layerDescription.featureInfo.keys || [];

                /*
                 * Roll over the featureInfo.keys associative array.
                 * Associative array entry is the attribute name (i.e. key)
                 * 
                 * This array contains a list of objects
                 * {
                 *      v: // Value to display instead of key
                 *      transform: // function to apply to value before instead of directly displayed it
                 *            this function should returns a string
                 * }
                 */
                for (k in keys) {

                    /*
                     * If key is found in array, get the corresponding value and exist the loop
                     */
                    if (key === k) {
                        
                        /*
                         * Transform value if specified
                         */
                        if ($.isFunction(keys[k].transform)) {
                            return keys[k].transform(value);
                        }
                        break;
                    }
                }
               
            }
            
            /*
             * In any case returns input value
             */
            return value;
        };

        /*
         * Replace input key into its "human readable" equivalent defined in layerDescription.featureInfo.keys associative array
         *
         * @input {String} key : key to replace
         * @input {OpenLayers.Feature} feature : feature reference
         */
        this.translate = function(key, feature) {

            var c, k, keys;
            
            /*
             * Paranoid mode
             */
            if (!feature || !key) {
                return msp.Util._(key);
            }

            /*
             * Check if keys array is defined
             * This array has preseance to everything else
             */
            if (feature.layer["_msp"].layerDescription.hasOwnProperty("featureInfo")) {
                
                keys = feature.layer["_msp"].layerDescription.featureInfo.keys || [];
                
                /*
                 * Roll over the featureInfo.keys associative array.
                 * Associative array entry is the attribute name (i.e. key)
                 * 
                 * This array contains a list of objects
                 * {
                 *      v: // Value to display instead of key
                 *      transform: // function to apply to value before instead of directly displayed it
                 *            this function should returns a string
                 * }
                 */
                for (k in keys) {

                    /*
                     * If key is found in array, get the corresponding value and exist the loop
                     */
                    if (key === k) {
                        
                        /*
                         * Key value is now "v" value if specified
                         */
                        if (keys[k].hasOwnProperty("v")){
                            return msp.Util._(keys[k].v);
                        }
                        
                        break;
                        
                    }
                }
                
            }
            
            /*
             * If feature layer got a searchContext then use the connector
             * metadataTranslator array to replace the key
             */
            c = feature.layer["_msp"].searchContext;
            if (c && c.connector) {
                return msp.Util._(c.connector.metadataTranslator[key] || key);
            }

            /*
             * In any case returns a i18n translated string
             */
            return msp.Util._(key);
        };
        
        /**
         * Set $a html content
         */
        this.setActions = function(feature) {
            
            var a,d,i,l,connector,key,plugin,menuactions,
            self = this,
            actions = [],
            layer = feature.layer,
            fi = feature.layer["_msp"].layerDescription.featureInfo;
            
            /*
             * Clear feature menu
             */
            self.$m.empty();
            
            /*
             * Add "zoom on feature" action
             */
            actions.push({
                id:msp.Util.getId(),
                icon:"plus.png",
                title:"Zoom to extent",
                callback:function(a, f) {
                    self.zoomOn();
                    return false;
                }
            });
            
            /**
             * Add item from other plugins
             */
            for(key in msp.plugins) {
                plugin = msp.plugins[key];
                if (plugin) {
                    if ($.isFunction(plugin.getLmngActions)) {
                        menuactions = plugin.getLmngActions(layer);
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

            /**
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
            self.$m.append('<div>'+self.getTitle(feature)+'</div><div class="title">('+msp.Util._("Layer")+" : " + layer.name+')</div><div class="actions"></div>');
            
            /*
             * Set actions
             */
            for (i = 0, l = actions.length;i < l; i++) {
                a = actions[i];
                $('.actions', self.$m).append('<span class="item image" jtitle="'+msp.Util._(a.title)+'" id="'+a.id+'"><img class="middle" src="'+msp.Util.getImgUrl(a.icon)+'"/></span>');
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
            
            /*
             * Display menu
             */
            self.updatePosition();

        };
        
        /**
         * Set $b html content
         */
        this.setBody = function(feature) {
            
            var id,
            content,
            $info,
            $thumb,
            layerType,
            self = this,
            typeIsUnknown = true,
            // Thumbnail of quicklook attributes
            thumb = feature.attributes['thumbnail'] || feature.attributes['quicklook'] || null;

            /*
             * Clean body
             */
            self.$b.empty();
            
            /*
             * Clean tab
             */
            self.$t.empty();
            
            /*
             * Roll over layer types to detect layer features that should be
             * displayed using a dedicated setFeatureInfoBody function
             */
            if ((layerType = msp.Map.layerTypes[feature.layer["_msp"].layerDescription["type"]])) {
                if ($.isFunction(layerType.setFeatureInfoBody)) {
                    layerType.setFeatureInfoBody(feature, self.$b);
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
                self.$b.html('<div id="pfitm"><div class="thumb"></div><div class="info"><table></table></div></div>');
                $info = $('.info table', self.$b);
                $thumb = $('.thumb', self.$b);
                
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
                        $thumb.html('<a id="'+id+'" class="image" jtitle="'+self.getTitle(feature)+'" title="'+msp.Util._("Show quicklook")+'" href="'+feature.attributes['quicklook']+'">'+content+'</a>');
                        
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
                                /* If removeBorderServiceUrl is defined => use it :) */
                                url:msp.Config["general"].removeBlackBorderServiceUrl != null ? msp.Config["general"].removeBlackBorderServiceUrl + encodeURIComponent(feature.attributes['quicklook']) + msp.Util.abc : feature.attributes['quicklook'],
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
                var d,v,t,i,l,k,kk,kkk;

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
                             * Special case for _madd property
                             * _madd defines an action to add layer
                             * and should contains to properties :
                             *  - title : action title to display
                             *  - layer : layer parameters
                             */
                            if (k === '_madd') {
                                id = msp.Util.getId();
                                $thumb.append('<br/><a href="#" class="center" id="'+id+'">'+msp.Util._(v["title"])+'</a>');
                                (function(id,obj){
                                    $('#'+id).click(function(){

                                        /*
                                         * Do not zoom on layer after load
                                         */
                                        if (obj) {
                                            obj.zoomOnAfterLoad = false;
                                        }

                                        /*
                                         * Add layer obj
                                         */
                                        msp.Map.addLayer(obj);
                                        return false;
                                    });
                                })(id,v["layer"]);
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
                                    if (self.$t.is(':empty')) {
                                        self.$t.html('<div id="pfit"><ul><li><a href="#pfitm" class="selected">'+msp.Util._("Description")+'</a></li></ul></div>');
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
                                    $('ul', self.$t).append('<li><a href="#' + id + '">' + msp.Util._(kk) + '</a></li>');
                                    self.$b.append('<div id="'+id+'" class="noflw"><table></table></div>');

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
                                            d.append('<tr><td>' + self.translate(kkk, feature) + '</td><td>&nbsp;</td><td>' + v[kk][kkk] + '</td></tr>');
                                        }
                                    }

                                }
                                else {
                                    $info.append('<tr><td>' + self.translate(k, feature) + ' &rarr; ' + self.translate(kk, feature) + '</td><td>&nbsp;</td><td>' + v[kk] + '</td></tr>');
                                }
                            }

                        }
                        else {
                            $info.append('<tr><td>' + self.translate(k, feature) + '</td><td>&nbsp;</td><td>' + self.getValue(feature,k,v) + '</td></tr>');
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
         * Set $h html content
         */
        this.setHeader = function(feature) {
            var self = this,
            title = self.getTitle(feature);
                
            $('.title', self.$h).attr('title',feature.layer.name + ' | ' + title).html(msp.Util.shorten(title, 25))
            .click(function(){
                self.zoomOn(feature);
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
                
                var btn,
                pn = new msp.Panel('s',{
                    tb:new msp.Toolbar('ss', 'h')
                    }), // Create new South panel
                ctn = pn.add('<iframe class="frame" src="'+feature.attributes[ran]+'" width="100%" height="100%"></iframe>'),
                extent = feature.geometry.getBounds().clone(); // Add container within panel

                /*
                 * Set container content
                 */
                msp.activity.show();
                $('.frame', ctn.$d).load(function() {
                    msp.activity.hide();
                });

                /*
                 * Register action within Toolbar South south toolbar
                 */
                btn = new msp.Button({
                    tt:self.getTitle(feature),
                    tb:pn.tb,
                    title:self.getTitle(feature),
                    container:ctn,
                    close:true,
                    onclose:function(btn) {
                        
                        /*
                         * Unselect feature
                         */
                        if (btn.feature && btn.feature.layer) {
                            msp.Map.Util.getControlById("__CONTROL_SELECT__").unselect(btn.feature);
                        }
                        
                        /*
                         * Hide activity
                         */
                        msp.activity.hide();
                        
                    },
                    activable:true,
                    scope:self,
                    actions:[
                    {
                        cssClass:"actnnw icnzoom",
                        callback:function(btn) {
                            msp.Map.zoomTo(extent);
                        }
                    }
                    ],
                    e:{
                        feature:feature
                    }
                });
                
                btn.trigger();
                
            }
            else {
                
                /*
                 * Set header for feature
                 */
                self.setHeader(feature);
                
                /*
                 * Set actions for feature
                 */
                self.setActions(feature);
                
                /*
                 * Set body for feature
                 */
                self.setBody(feature);

                /*
                 * Display feature information
                 */
                self.show();
                
            }
            return true;
        };
        
        /**
         * Show feature info panel
         */
        this.show = function() {
            
            var self = this;
            
            /*
             * Show panel content
             */
            self.ctn.pn.show(self.ctn);
            
            /*
             * Hide tabs if empty
             */
            self.$t.is(':empty') ? self.$t.hide() : self.$t.show();
            
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
            
            /*
             * Hide menu and fmenu
             */
            msp.menu.hide();
            self.$m.hide();
            
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
                     * Show panel content
                     */
                    self.ctn.pn.hide(self.ctn);
                    
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
                self.$m.show();
                xy = msp.Map.map.getPixelFromLonLat(self._ll);
                self.$m.css({
                    'left': xy.x - self.$m.width() / 2,
                    'top': xy.y - 120
                });
            }
            
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