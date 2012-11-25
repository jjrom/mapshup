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
(function (M) {
    
    M.Map.FeatureInfo = function(options) {

        /*
         * Only one FeatureInfo object instance is created
         */
        if (M.Map.FeatureInfo._o) {
            return M.Map.FeatureInfo._o;
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
         * Bypass normal select feature
         * 
         * WARNING : this value SHOULD not be modified
         * It is used by the WPS plugin to bypass the 
         * normal feature selection execution
         */
        this.bypassCallback = null;
        
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
             * Initialize featureInfo popup
             * See this.setContent() 
             */
            this.popup = new M.Popup({
                modal:false,
                generic:false,
                hideOnClose:true,
                noHeader:true,
                autoSize:true,
                classes:'fipopup apo',
                followMap:true,
                onClose:function() {
                    self.clear();
                }
            });
            
            /*
             * Hide FeatureInfo panel when layer is removed
             */
            M.Map.events.register("layersend", this, function(action, layer, scope) {

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
            M.Map.events.register("visibilitychanged", self, function (layer, scope) {
                
                /*
                 * Show/Hide featureinfo menu depending on layer visibility
                 */
                if (scope.selected && scope.selected.layer === layer) {
                    
                    if (layer.getVisibility()) {
                        
                        /*
                         * Show feature info panel
                         */
                        scope.popup.show();
                        
                    }
                    else {
                        
                        /*
                         * Hide feature info panel
                         */
                        scope.popup.hide();
                        
                    }
                }
            });
            
            return self;            
            
        };
        
        /**
         * Unselect all feature
         */
        this.clear = function() {

            var c = M.Map.Util.getControlById("__CONTROL_SELECT__");
            
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
         * Set content
         * 
         * Feature info popup contains tools
         *    ______________________
         *   |                      |
         *   |.title                |
         *   |.tools                |    
         *   |______________________|
         *      \/
         *      
         *  Note : .thumb is only created if feature got a thumbnail/quicklook/icon property
         *  
         */
        this.setContent = function(feature) {
            
            var a,d,i,l,connector,key,plugin,menutools,_a,$f,
            self = this,
            tools = [],
            fi = feature.layer["_M"].layerDescription.featureInfo;
             
            /*
             * Initialize skeleton
             */
            self.popup.$b.html('<span class="title">'+M.Util.stripTags(M.Map.Util.Feature.getTitle(feature))+'</span><br/><span class="tools"></span>');
            
            $f = $('.tools', self.popup.$b);
            
            /*
             * Add "Show info" action
             */
            tools.push({
                id:M.Util.getId(),
                icon:"info.png",
                title:"Info",
                tt:"More info",
                callback:function(a, f) {
                    self.showInfo(f);
                    return false;
                }
            });
            
            /*
             * Add "Center on feature" action
             */
            tools.push({
                id:M.Util.getId(),
                icon:"center.png",
                title:"Zoom",
                tt:"Zoom on feature",
                callback:function(a, f) {
                    self.zoomOn();
                    return false;
                }
            });
            
            /*
            * Add "switch layer visibility"
            */
            tools.push({
                id:M.Util.getId(),
                icon:"hide.png",
                title:"Hide the parent layer",
                callback:function(a, f) {
                    M.Map.Util.setVisibility(f.layer, false);
                }
            });
            
            /*
             * services defines specific tools and should contains optional properties
             *      - download : to add a download action
             *      - browse : to add a layer
             * These tools are displayed within the tools list
             *
             */
            if (feature.attributes.hasOwnProperty("services")) {
                
                /*
                 * Download feature
                 */
                if(feature.attributes["services"]["download"]) {
                    tools.push({
                        id:M.Util.getId(),
                        icon:"download.png",
                        title:"Download",
                        tt:"Download feature",
                        sla:function(a,f) {
                            if (f && f["attributes"]) {
                                
                                var d = f.attributes["services"]["download"];
                                
                                /*
                                 * Structure of d is :
                                 * {
                                 *      url: // url to download
                                 *      mimeType: // if "text/html" open a new window. Otherwise set url
                                 * }
                                 */
                                a.attr("href", d.url);
                                
                                if (d.mimeType && d.mimeType.toLowerCase() === "text/html") {
                                    a.attr("target", "_blank");
                                }
                                
                            }
                        },
                        callback:function(a,f) {
                            return true;
                        }
                    });
                }
                _a = feature.attributes["services"]["browse"];
                
                /*
                 * Add layer action
                 */
                if (_a) {
                    tools.push({
                        id:M.Util.getId(),
                        icon:"add.png",
                        tt:_a["title"] || "Add to map",
                        title:"Add",
                        callback:function(a,f) {
                            
                            /*
                             * Add layer obj
                             */
                            var l = M.Map.addLayer(f.attributes["services"]["browse"]["layer"]);
                            
                            /*
                             * Force zoom on added layer
                             */
                            if (l) {
                                M.Map.zoomTo(l.getDataExtent() || l["_M"].bounds);
                            }
                            
                            return false;
                        }
                    });
                    
                }

            }
            
            /**
             * Add item from other plugins
             */
            for(key in M.plugins) {
                plugin = M.plugins[key];
                if (plugin) {
                    if ($.isFunction(plugin.getFeatureActions)) {
                        menutools = plugin.getFeatureActions(feature);
                        if (menutools) {
                            if (menutools instanceof Array) {
                                for (i = 0, l = menutools.length; i < l;i++) {
                                    tools.push(menutools[i]);
                                }
                            }
                            else {
                                tools.push(menutools);
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
                    tools.push({
                        id:M.Util.getId(),
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
            if (feature.layer["_M"].searchContext) {

                connector = feature.layer["_M"].searchContext.connector;
                
                if (connector && connector.action) {                    
                
                    /*
                     * Add feature action
                     */
                    tools.push({
                        id:M.Util.getId(),
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
            for (i = 0, l = tools.length;i < l; i++) {
                a = tools[i];
                $f.append('<a class="item image" jtitle="'+M.Util._(a.tt || a.title)+'" id="'+a.id+'"><img class="middle" src="'+M.Util.getImgUrl(a.icon)+'"/></a>');
                d = $('#'+a.id);
                
                /* Add tooltip */
                M.tooltip.add(d, 'n', 10);
                
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
            M.Map.$featureHilite.empty().hide();
            
        };
        
        /**
         * Select feature and get its information
         * Called by "onfeatureselect" events
         * 
         * @param feature : 
         * @param _triggered : if true the feature selection has been triggered
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
                    M.Map.map.zoomToExtent(bounds);
                    
                    /*
                     * Hide feature info panel
                     */
                    self.popup.hide();
                    
                    return false;
                    
                }
            }
            
            /*
             * If global _triggered is set to true then previous select was triggered by a process
             * and not by a user click.
             * 
             * In this case the Lon/Lat click position is set on the middle of the map
             * Otherwise it is set on the middle of the clicked object if it is a Point and on the clicked xy
             * if it is a LineString or a Polygon
             */
            self.popup.setMapXY(self._triggered ? M.Map.map.getCenter() : (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Point" ? feature.geometry.getBounds().getCenterLonLat() : M.Map.map.getLonLatFromPixel(M.Map.mousePosition)));
            
            /*
             * This is a bit tricky...
             * If _triggered is set to true, then set the global _triggered to true
             */
            if (_triggered) {
                self._triggered = true;
                c = M.Map.Util.getControlById("__CONTROL_SELECT__");
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
                M.Map.events.trigger("featureselected", feature);
            }
            
            /*
             * Set _triggered to false (see above)
             */
            self._triggered = false;
            
            /*
             * Hide menu
             */
            //M.menu.hide();
            
            /*
             * Set the current selected object
             */
            self.selected = feature;
            
            /*
             * Experimental : bypass mechanism (used by Plugins/WPSClient)
             */
            if ($.isFunction(self.bypassCallback)) {
                self.bypassCallback(feature);
                try {
                    c.unselect(self.selected);
                }
                catch(e) {
                    self.selected = null
                }
                return true;
            }
            
            /*
             * If layerType.resolvedUrlAttributeName is set,
             * display feature info within an iframe
             */
            ran = M.Map.layerTypes[feature.layer["_M"].layerDescription["type"]].resolvedUrlAttributeName;
            if (ran) {
                
                //extent = feature.geometry.getBounds().clone(); // Add container within panel
                
                /*
                 * Add a new item to South Panel
                 * 
                 * Note : unique id is based on the feature layer type
                 * and feature layer name. Ensure that two identical
                 * feature leads to only one panel item 
                 */
                var t = M.Map.Util.Feature.getTitle(feature), panelItem = M.sp.add({
                    id:M.Util.crc32(t + feature.layer["_M"].layerDescription["type"]),
                    tt:t,
                    title:t,
                    unremovable:false,
                    html:'<iframe class="frame" src="'+feature.attributes[ran]+'" width="100%" height="100%"></iframe>',
                    onclose:function() {
                        
                        /*
                         * Unselect feature
                         */
                        if (feature && feature.layer) {
                            M.Map.Util.getControlById("__CONTROL_SELECT__").unselect(feature);
                        }
                        
                        /*
                         * Hide activity
                         */
                        M.activity.hide();
                        

                    }
                });
                
                M.sp.show(panelItem);
                
                M.activity.show();
                $('.frame', panelItem.$d).load(function() {
                    M.activity.hide();
                });
              
            }
            else {
               
                /*
                 * Set popup content
                 */
                self.setContent(feature);
                
                /*
                 * Show feature information
                 */
                self.popup.show();
                
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
            
            M.Map.featureInfo.selected = null;
            
            /*
             * Call mapshup featureselect event
             */
            M.Map.events.trigger("featureselected", null);
            
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
                    //M.menu.hide();
                    self.popup.hide();
                    
                }
                
            }, 100);
            
        };
        
        /**
         * Zoom map on selected feature
         */
        this.zoomOn = function() {
            if (M.Map.featureInfo.selected && M.Map.featureInfo.selected.geometry) {
                M.Map.zoomTo(M.Map.featureInfo.selected.geometry.getBounds());
            }
        };
        
        /*
         * Hilite feature
         */
        this.hilite = function(f) {
            
            var self = this,
            c = M.Map.Util.getControlById("__CONTROL_HIGHLITE__");
                
            if (c && f) {
                try {
                    
                    /*
                     * First unhighlight all feature
                     */
                    var i, l, fs = M.Map.Util.getFeatures(f.layer);
                    
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
            c = M.Map.Util.getControlById("__CONTROL_HIGHLITE__");
                
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
        
        /**
         * Set info popup html content
         * 
         *  ___________________________
         * |          .title           | .header
         * |___________________________|
         * |___________________________| .tabs
         * |  ________                 |
         * | |        | |              | .body
         * | |        | |   .info      |
         * | | .thumb | |              |
         * | |        | |              |
         * | |________| |              |
         * |  .actions  |              |
         * |___________________________|
         * 
         * 
         * 1. feature got a quicklook property
         *  ___________________________
         * |          .title           | .header
         * |___________________________| 
         * |  ________                 |
         * | |        | |              |
         * | | .ql    | |    .info     |
         * | |________| |              |
         *  –––––––––––––––––––––––––––
         *  
         * 2. Otherwise
         *  ___________________________
         * |          .title           | .header
         * |___________________________| 
         * |                           | 
         * |          .info            | .body
         * |___________________________|
         * 
         * 
         * @param feature : the feature to display
         *                 
         */
        this.showInfo = function(feature) {
            
            /*
             * Paranoid mode
             */
            if (!feature) {
                return false;
            }
           
            var $target,id,
            d,v,t,i,l,k,kk,kkk,ts,
            $info,
            $tabs,
            $thumb,
            layerType,
            typeIsUnknown = true,
            title = M.Util.stripTags(M.Map.Util.Feature.getTitle(feature)),
            ql = feature.attributes['quicklook']; // Thumbnail of quicklook attributes
                
            /*
             * Create the info container over everything else
             * 
             * <div class="fi">
             *      <div class="header>
             *          <div class="title"></div>
             *      </div>
             *      <div class="body">
             *      
             *      </div>
             * </div>
             *      
             * 
             */
            $target = M.Util.$$('#'+M.Util.getId(),$('#mwrapper'))
            .addClass("overall")
            .append('<div class="fi"><div class="header"><div class="title"></div></div><div class="body"></div></div>');
    
            /*
             * Add a close button to the Help panel
             */
            M.Util.addClose($target,function(){
                $target.remove();
            });
            
            /*
             * Add a quicklook div (or not)
             * Set quicklook width and height to respectively
             * 40% and 90% of the main wrapper 
             */
            $('.body', $target).append(ql ? '<div class="ql" style="float:left;width:50%;"><img src="'+ql+'"/></div><div class="info" style="width:50%;"></div>' : '<div class="info"></div>');
            $('.ql img', $target).css({
                'max-width':Math.round($('#mwrapper').width() * 4 / 10),
                'max-height':Math.round($('#mwrapper').height() * 9 / 10)
            });
            
            /*
             * Set header
             */
            $('.title', $target).attr('title', feature.layer.name + ' | ' + title).html(title);      
             
            /*
             * Set body and tabs reference
             */
            $tabs = $('.tabs', $target);
           
            /*
             * Roll over layer types to detect layer features that should be
             * displayed using a dedicated setFeatureInfoBody function
             */
            if ((layerType = M.Map.layerTypes[feature.layer["_M"].layerDescription["type"]])) {
                if ($.isFunction(layerType.setFeatureInfoBody)) {
                    layerType.setFeatureInfoBody(feature, $('.info', $target));
                    typeIsUnknown = false;
                }
            }

            /*
             * If feature type is unknown, use default display
             *  
             * In both case, key/value are displayed within a <table>
             * 
             *      <div class="thumb"></div>
             *      <div class="info"></div>
             * 
             */
            if (typeIsUnknown) {
                
                /*
                 * Default feature info are set within an html table
                 */
                $('.info', $target).html('<table></table>');
                $info = $('.info table', $target);
                
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
                        if (t === "string" && M.Util.isUrl(v)) {
                            $info.append('<tr><td>' + M.Map.Util.Feature.translate(k, feature) + '</td><td>&nbsp;</td><td><a target="_blank" title="'+v+'" href="'+v+'">'+ M.Util._("Download") +'</a></td></tr>');
                        }
                        /*
                         * Object case
                         */
                        else if (t === "object") {

                            /*
                             * Special case for services property
                             * services defines specific actions and should contains optional properties
                             *      - download : to add a download action
                             *      - browse : to add a layer
                             * These actions are displayed within the actions list - see this.setFooter(feature) function
                             *
                             */
                            if (k === "services") {
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
                                            id = M.Util.getId();
                                            /* Remove default thumbnail if any */
                                            $('.dftthb', $thumb).remove();
                                            $thumb.append('<a href="'+v[kk][i]["url"]+'" title="'+v[kk][i]["name"]+'" id="'+id+'" class="image"><img height="50px" width="50px" src="'+v[kk][i]["url"]+'"/></a>');
                                            /*
                                             * Popup image
                                             */
                                            (function($id){
                                                $id.click(function() {
                                                    M.Util.showPopupImage($id.attr('href'), $id.attr('title'));
                                                    return false;
                                                });    
                                            })($('#'+id));
                                            
                                        }
                                        continue;
                                    }

                                    /*
                                     * Initialize tab
                                     */
                                    if ($tabs.is(':empty')) {
                                        $tabs.html('<div id="_fit"><ul><li><a href="#_fitm" class="selected">'+M.Util._("Description")+'</a></li></ul></div>');
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
                                    id = M.Util.getId() ;
                                    $('ul', $tabs).append('<li><a href="#' + id + '">' + M.Util._(kk) + '</a></li>');
                                    $('.east', $target).append('<div id="'+id+'" class="noflw"><table></table></div>');

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
                                            id = M.Util.getId();
                                            
                                            d.append('<tr><td><a id="'+id+'" href="'+v[kk][i]["url"]+'">' + v[kk][i]["name"] + '</a></td></tr>');
                                            
                                            
                                            (function($id){
                                                $id.click(function() {
                                                    M.Util.showPopupVideo({
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
                                            ts = M.Map.Util.Feature.translate(kkk, feature);
                                            d.append('<tr><td title="'+ts+'">' + ts + '</td><td>&nbsp;</td><td>' + v[kk][kkk] + '</td></tr>');
                                        }
                                    }

                                }
                                else {
                                    ts = M.Map.Util.Feature.translate(k, feature);
                                    $info.append('<tr><td title="'+ts+'">' + ts, 20 + ' &rarr; ' + M.Map.Util.Feature.translate(kk, feature) + '</td><td>&nbsp;</td><td>' + v[kk] + '</td></tr>');
                                }
                            }

                        }
                        else {
                            ts = M.Map.Util.Feature.translate(k, feature);
                            $info.append('<tr><td title="'+ts+'">' + ts + '</td><td>&nbsp;</td><td>' + M.Map.Util.Feature.getValue(feature,k,v) + '</td></tr>');
                        }
                    }
                }

                /*
                 * Set the tabs if any
                 */
                $("#_fit ul").idTabs();
                
            }
            
            //$tabs.is(':empty') ? $tabs.hide() : $tabs.show();
            $target.show();

            return true;
            
        };
        
        
        /*
         * Create unique object instance
         */
        M.Map.FeatureInfo._o = this;

        return this.init(options);
    }
    
})(window.M);