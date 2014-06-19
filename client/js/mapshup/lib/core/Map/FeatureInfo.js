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
 * 
 * @param {MapshupObject} M
 * 
 */
(function(M) {

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
            w: 100,
            h: 50
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
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var self = this;

            /*
             * Init options
             */
            options = options || {};

            /*
             * Initialize popups :
             *      - '_p' is the feature info popup
             *      - '_mip' is the mirco info popup
             *  
             *  When one is visible, the other is hidden !
             */
            self._p = new M.Popup({
                modal: false,
                generic: false,
                hideOnClose: true,
                noHeader: true,
                autoSize: true,
                classes: 'fipopup apo',
                followMap: true,
                centered: false,
                onClose: function() {
                    self.clear();
                }
            });

            self._mip = new M.Popup({
                modal: false,
                generic: false,
                hideOnClose: true,
                noHeader: true,
                noFooter: false,
                scope: self,
                classes: 'mip',
                centered: false,
                autoSize: true,
                zIndex: 30000,
                footer: '<div class="tools"></div>',
                onClose: function() {
                    self.clear();
                }
            });
            self._mip.$b.addClass('padded');

            /*
             * Initialize FeatureInfo sidePanel item
             */
            self.sidePanelItem = M.sidePanel.add({
                id: M.Util.getId()
            });

            /*
             * Hide FeatureInfo panel when layer is removed
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

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
            M.Map.events.register("visibilitychanged", self, function(layer, scope) {

                /*
                 * Show/Hide featureinfo menu depending on layer visibility
                 */
                if (scope.selected && scope.selected.layer === layer) {

                    if (layer.getVisibility()) {

                        /*
                         * Show feature info panel
                         */
                        var fi = layer["_M"].layerDescription.featureInfo;
                        if (!fi || !fi.noMenu) {
                            scope.getPopup(layer).show();
                        }

                    }
                    else {

                        /*
                         * Hide feature info panel
                         */
                        scope.hide();

                    }
                }
            });

            return self;

        };

        /**
         * Return the right popup depending
         * on the layer configuration
         * 
         * @param {OpenLayers.Layer} layer
         */
        this.getPopup = function(layer) {

            /*
             * Default - return popup
             */
            if (!layer) {
                return this._p;
            }

            return layer['_M'].microInfoTemplate.enable ? this._mip : this._p;

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
                catch (e) {
                    c.unselectAll();
                }
            }
            else {
                c.unselectAll();
            }

            this.unselect(null);

        };

        /**
         * Set popups content
         * 
         *  @param {OpenLayers.Feature}  feature
         */
        this.setContent = function(feature) {

            var template, title, $target, self = this;

            /*
             * Paranoid mode
             */
            if (!feature) {
                return false;
            }
            
            template = feature.layer._M.microInfoTemplate;

            /*
             * CASE 1 : Micro Info Template
             * 
             */
            if (template.enable) {

                title = M.Map.Util.Feature.getTitle(feature);

                /*
                 * Set popup body content
                 */
                self._mip.$b.html(template.body ? M.Util.parseTemplate(template.body, feature.attributes) : '<h2 class="shorten_30" title="' + title + '">' + title + '</h2>');

                /*
                 * Shorten text
                 */
                M.Util.findAndShorten(self._mip.$d, true);

                /*
                 * Set tools target
                 */
                $target = $('.tools', self._mip.$f);

            }

            /*
             * CASE 2 : Feature Info popup
             *   ______________________
             *   |                      |
             *   |.title                |
             *   |.tools                |    
             *   |______________________|
             *      \/
             * 
             */
            else {

                /*
                 * Set popup body content
                 */
                self._p.$b.html('<span class="title" style="white-space:nowrap;">' + M.Map.Util.Feature.getTitle(feature) + '</span><br/><span class="tools"></span>');

                /*
                 * Set tools target
                 */
                $target = $('.tools', self._p.$b);

            }

            /*
             * Set tools
             */
            self.setTools(feature, $target);

            /*
             * Hide featureHilite menu
             */
            M.Map.$featureHilite.empty().hide();

            return true;
        };

        /**
         * Set tools within $target
         * 
         * @param {OpenLayers.Feature} feature
         * @param {jQueryElement} $target
         */
        this.setTools = function(feature, $target) {

            var a, d, i, l, connector, key, plugin, menutools, _a,
                    self = this,
                    tools = [],
                    fi = feature.layer["_M"].layerDescription.featureInfo;

            // Clean target
            $target.empty();

            /*
             * Add "Show info" action
             */
            tools.push({
                id: M.Util.getId(),
                icon: "info.png",
                title: "Info",
                tt: "More info",
                callback: function(a, f) {
                    self.showInfo(f);
                    return false;
                }
            });

            /*
             * Add "Center on feature" action
             */
            tools.push({
                id: M.Util.getId(),
                icon: "center.png",
                title: "Zoom",
                tt: "Zoom on feature",
                callback: function(a, f) {
                    self.zoomOn();
                    return false;
                }
            });

            /*
             * Add "switch layer visibility"
             * Only if the layer is displayed within LayersManager !
             */
            if (feature.layer.displayInLayerSwitcher) {
                tools.push({
                    id: M.Util.getId(),
                    icon: "hide.png",
                    title: "Hide the parent layer",
                    callback: function(a, f) {
                        M.Map.Util.setVisibility(f.layer, false);
                    }
                });
            }
            
            /*
             * services defines specific tools and should contains optional properties
             *      - download : to add a download action
             *      - browse : to add a layer
             * These tools are displayed within the tools list
             *
             */
            
            /*
            * Download feature
            */
            var addDownload = false;
            
            if (feature.attributes.hasOwnProperty("services")) {
                _a = feature.attributes["services"]["browse"];
                addDownload = feature.attributes["services"]["download"] ? true : false;
            }
            else if (feature.attributes['quicklook'] && feature.attributes['quicklook'].toLowerCase().indexOf('service=wms') !== -1) {
                _a = {};
            }

            /*
             * ATOM case
             */
            if (feature.attributes.hasOwnProperty("atom")) {
                if ($.isArray(feature.attributes.atom.links)) {
                    for (var i = 0, l = feature.attributes.atom.links.length; i < l; i++) {
                        if (feature.attributes.atom.links[i].rel === 'enclosure') {
                            addDownload = true;
                            break;
                        }
                    }
                }
            }

            if (addDownload) {
                tools.push({
                    id: M.Util.getId(),
                    icon: "download.png",
                    title: "Download",
                    tt: "Download feature",
                    sla: function(a, f) {
                        if (f && f["attributes"]) {

                            var d = {};

                            /*
                             * GeoJSON case
                             */
                            if (f.attributes.hasOwnProperty("services")) {
                                d = f.attributes["services"]["download"];
                            }
                            /*
                             * ATOM case
                             */
                            else if (f.attributes.hasOwnProperty("atom")) {
                                if ($.isArray(f.attributes.atom.links)) {
                                    for (var i = 0, l = f.attributes.atom.links.length; i < l; i++) {
                                        if (f.attributes.atom.links[i].rel === 'enclosure') {
                                            d.url = feature.attributes.atom.links[i].href;
                                            break;
                                        }
                                    }
                                }
                            }
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
                    callback: function(a, f) {
                        return true;
                    }
                });
            }

            /*
             * Add layer action
             */
            if (_a) {
                tools.push({
                    id: M.Util.getId(),
                    icon: "add.png",
                    tt: _a["title"] || "Add to map",
                    title: "Add",
                    callback: function(a, f) {

                        /*
                         * Add layer obj
                         */
                        var l;
                        
                        if (f.attributes.hasOwnProperty('services') && f.attributes["services"]["browse"]) {
                            l = M.Map.addLayer(f.attributes["services"]["browse"]["layer"]);
                        }
                        else if (f.attributes.hasOwnProperty('quicklook') && f.attributes['quicklook'].toLowerCase().indexOf('service=wms') !== -1) {
                            if (M.Map.layerTypes["WMS"]) {
                                var layerDescription = M.Map.layerTypes["WMS"].getLayerDescriptionFromUrl(f.attributes['quicklook']);
                                layerDescription.type = 'WMS';
                                layerDescription.srs = 'EPSG:3857';
                                l = M.Map.addLayer(layerDescription);
                            }
                        }
                        
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

            /**
             * Add item from other plugins
             */
            for (key in M.plugins) {
                plugin = M.plugins[key];
                if (plugin) {
                    if ($.isFunction(plugin.getFeatureActions)) {
                        menutools = plugin.getFeatureActions(feature);
                        if (menutools) {
                            if (menutools instanceof Array) {
                                for (i = 0, l = menutools.length; i < l; i++) {
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
                        id: M.Util.getId(),
                        icon: fi.action["icon"],
                        title: fi.action["title"],
                        tt: fi.action["tt"],
                        callback: function(a, f) {
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
                        id: M.Util.getId(),
                        icon: connector.action["icon"],
                        title: connector.action["title"],
                        tt: connector.action["tt"],
                        sla: $.isFunction(connector.action.sla) ? connector.action.sla : null,
                        callback: function(a, f) {

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
            for (i = 0, l = tools.length; i < l; i++) {
                a = tools[i];
                $target.append('<a class="item image" jtitle="' + M.Util._(a.tt || a.title) + '" id="' + a.id + '"><img class="middle" src="' + M.Util.getImgUrl(a.icon) + '"/></a>');
                d = $('#' + a.id);

                /* Add tooltip */
                M.tooltip.add(d, 'n', 10);

                (function(d, a, f) {
                    d.click(function(e) {
                        return a.callback(a, f);
                    });
                })(d, a, feature);

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
         * @param feature : 
         * @param _triggered : if true the feature selection has been triggered
         *                     automatically and not by a user click
         *                     This attribute is set to true by Catalog plugins
         *                     when feature is selected by clicking on the search result panel
         */
        this.select = function(feature, _triggered) {

            var c, i, bounds, length, ran, self = this;

            /*
             * Set select time (see unselect function)
             */
            self._tse = (new Date()).getTime();

            /*
             * Two types of clusters :
             * 
             * 1. Points clusters
             *    
             *    The map is zoomed on the cluster extent upon click
             *    
             * 2. Polygons clusters
             * 
             *    Each polygons inside the cluster are shown within the SidePanel
             *    upon click             * 
             */
            if (feature.cluster) {

                length = feature.cluster.length;

                if (length > 0) {
                    
                    /*
                     * OpenLayers issue ?
                     * In some cases cluster does have a null layer...
                     */
                    if (!feature.layer) {
                        feature.layer = feature.cluster[0].layer;
                    }
                
                    if (feature.layer && feature.layer['_M'].clusterType === "Polygon") {
                        self.selected = feature;
                        self.showCluster(feature.cluster);
                    }
                    else {

                        /*
                         * Initialize cluster bounds with first item bounds
                         */
                        bounds = feature.cluster[0].geometry.getBounds().clone();

                        /*
                         * Add each cluster item bounds to the cluster bounds
                         */
                        for (i = 1; i < length; i++) {
                            bounds.extend(feature.cluster[i].geometry.getBounds());
                        }

                        /*
                         * Zoom on the cluster bounds
                         */
                        M.Map.map.zoomToExtent(bounds);

                    }

                    /*
                     * Hide feature info panel
                     */
                    self.hide();

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
            self._p.setMapXY(self._triggered ? M.Map.map.getCenter() : (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Point" ? feature.geometry.getBounds().getCenterLonLat() : M.Map.map.getLonLatFromPixel(M.Map.mousePosition)));

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
                    catch (e) {
                        self.selected = null;
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
            M.menu.hide();

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
                catch (e) {
                    self.selected = null;
                }
                return true;
            }

            /*
             * If layerType.resolvedUrlAttributeName is set,
             * display feature info within an iframe
             */
            ran = M.Map.layerTypes[feature.layer["_M"].layerDescription["type"]].resolvedUrlAttributeName;
            if (ran) {

                /*
                 * Add a new item to South Panel
                 * 
                 * Note : unique id is based on the feature layer type
                 * and feature layer name. Ensure that two identical
                 * feature leads to only one panel item 
                 */
                var t = M.Map.Util.Feature.getTitle(feature),
                        panelItem = M.southPanel.add({
                        id:M.Util.crc32(t + feature.layer["_M"].layerDescription["type"]),
                        tt:t,
                        title:t,
                        unremovable:false,
                        html:'<iframe class="frame" src="' + feature.attributes[ran] + '" width="100%" height="100%"></iframe>',
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

                M.southPanel.show(panelItem);

                M.activity.show();
                $('.frame', panelItem.$d).load(function() {
                    M.activity.hide();
                });

            }
            else {
                
                var fi = feature.layer["_M"].layerDescription.featureInfo;
                
                /*
                 * Show feature information
                 */
                self.hide();
                
                /*
                 * Set popup content
                 */
                if (!fi || !fi.noMenu) {
                    self.setContent(feature);
                    self.getPopup(feature.layer).show();
                }
            
                /*
                 * Call back function on select
                 */
                if (fi && $.isFunction(fi.onSelect)){
                    fi.onSelect(feature);
                }

            }

            return true;

        };

        /**
         * Unselect feature and clear information
         * Called by "onfeatureunselect" events
         * 
         * @param {OpenLayers.Feature} feature 
         */
        this.unselect = function(feature) {

            var self = this;

            /*
             * Set unselect time
             */
            self._tun = (new Date()).getTime();

            if (feature && feature.layer['_M'].clusterType === "Polygon") {
                M.sidePanel.hide(self.sidePanelItem);
            }
            
            /*
             * Call back function on unselect
             */
            if (feature && feature.layer["_M"].layerDescription.featureInfo && $.isFunction(feature.layer["_M"].layerDescription.featureInfo.onUnselect)){
                feature.layer["_M"].layerDescription.featureInfo.onUnselect(feature);
            }

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
            setTimeout(function() {

                if (self._tun - self._tse > 0) {

                    /*
                     * Hide menu
                     */
                    M.menu.hide();

                    /*
                     * Hide feature info panel
                     */
                    self.hide();

                }

            }, 10);
            
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
                catch (e) {
                }
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
                catch (e) {
                }
            }

        };

        /**
         * Set info popup html content
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

            var $target, id, v, t, i, l, k, kk, ts,
                    $info,
                    layerType,
                    typeIsUnknown = true,
                    title = M.Util.stripTags(M.Map.Util.Feature.getTitle(feature)),
                    ql = feature.attributes['quicklook'] || feature.attributes['imageUrl']; // Thumbnail of quicklook attributes

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
            $target = M.Util.$$('#' + M.Util.getId(), $('#mapshup'))
                    .addClass("overall")
                    .append('<div class="fi"><div class="header"><div class="title"></div></div><div class="body"></div></div>');

            /*
             * Add a close button to the info panel
             */
            M.Util.addClose($target, function() {
                M.activity.hide();
                $target.remove();
            });

            /*
             * Add a quicklook div (or not)
             * Set quicklook width and height to respectively
             * 40% and 90% of the main wrapper 
             */
            if (ql) {
                
                $('.body', $target).append('<div class="ql" style="float:left;width:49%;"><img src="' + ql + '"/></div><div class="info"></div>');
                $('.ql img', $target).css({
                    'max-width': Math.round($('#mapshup').width() * 4 / 10),
                    'max-height': Math.round($('#mapshup').height() * 9 / 10)
                });
               
               /*
                * Show activity indicator during image loading
                */
                var image = new Image();
                image.src = ql;
                M.activity.show();
                $(image).load(function() {
                    M.activity.hide();
                }).error(function() {
                    M.activity.hide();
                });
            }
            else {
                $('.body', $target).append('<div class="info"></div>');
            }

            /*
             * Set header
             */
            $('.title', $target).attr('title', feature.layer.name + ' | ' + title).html(title);

            /*
             * Roll over layer types to detect layer features that should be
             * displayed using a dedicated setFeatureInfoBody function
             */
            layerType = M.Map.layerTypes[feature.layer["_M"].layerDescription["type"]];
            if (layerType) {
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
                $('.info', $target).html('<table style="width:' + (ql ? '45' : '95') + '%"></table>');
                $info = $('.info table', $target);

                /*
                 * Roll over attributes  
                 */
                for (k in feature.attributes) {

                    /*
                     * Special keywords
                     */
                    if (k === 'self' || k === 'identifier' || k === 'icon' || k === 'thumbnail' || k === 'quicklook' || k === 'imageUrl' || k === 'modified' || k === 'color') {
                        continue;
                    }

                    /*
                     * Get key value
                     */
                    v = feature.attributes[k];
                    if (v) {

                        /*
                         * Check type
                         */
                        t = typeof v;

                        /*
                         * Simple case : string
                         */
                        if (t === "string" && M.Util.isUrl(v)) {
                            $info.append('<tr><td>' + M.Map.Util.Feature.translate(k, feature) + '</td><td>&nbsp;</td><td><a target="_blank" title="' + v + '" href="' + v + '">' + M.Util._("Download") + '</a></td></tr>');
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
                             * ATOM special case
                             */
                            if (k === "atom") {
                                if (v['id']) {
                                    $info.append('<tr><td title="' + M.Util._('identifier') + '">' + M.Util._('identifier') + '</td><td>&nbsp;</td><td>' + v['id'] + '<td></tr>');
                                }
                                if (v['updated']) {
                                    $info.append('<tr><td title="' + M.Util._('updated') + '">' + M.Util._('updated') + '</td><td>&nbsp;</td><td>' + v['updated'] + '<td></tr>');
                                }
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
                                     * is displayed as thumbs
                                     */
                                    if (kk === 'photos') {
                                        $info.append('<tr><td></td><td>&nbsp;</td><td class="thumbs"><td></tr>');
                                        for (i = 0, l = v[kk].length; i < l; i++) {
                                            id = M.Util.getId();
                                            $('.thumbs', $info).append('<img href="' + v[kk][i]["url"] + '" title="' + v[kk][i]["name"] + '" id="' + id + '" src="' + v[kk][i]["url"] + '"/>');
                                            /*
                                             * Popup image
                                             */
                                            (function($id) {
                                                $id.click(function() {
                                                    M.Util.showPopupImage($id.attr('href'), $id.attr('title'));
                                                    return false;
                                                });
                                            })($('#' + id));

                                        }
                                    }
                                }
                                else {
                                    ts = M.Map.Util.Feature.translate(k, feature);
                                    $info.append('<tr><td title="' + ts + '">' + ts, 20 + ' &rarr; ' + M.Map.Util.Feature.translate(kk, feature) + '</td><td>&nbsp;</td><td>' + v[kk] + '</td></tr>');
                                }
                            }

                        }
                        else {
                            ts = M.Map.Util.Feature.translate(k, feature);
                            $info.append('<tr><td title="' + ts + '">' + ts + '</td><td>&nbsp;</td><td>' + M.Map.Util.Feature.getValue(feature, k, v) + '</td></tr>');
                        }
                    }
                }
            }

            $target.show();

            return true;

        };

        /**
         * Show cluster features within SidePanel
         * 
         * @param {Array} cluster
         * 
         */
        this.showCluster = function(cluster) {
            
            var i, l, f, id, icon, title, $t, self = this;
            
            $t = self.sidePanelItem.$d.html('<div class="marged"></div>').children().first();
            
            /*
             * Roll over features
             */
            for (i = 0, l = cluster.length; i < l; i++) {

                f = cluster[i];

                /*
                 * This is very important to ensure that feature are correctly synchronized
                 */
                if (!f.layer) {
                    continue;
                }

                /*
                 * The id is based on feature unique id
                 * 
                 * !! Warning !! 'f.id' is reserved by LayersManager plugin
                 */
                id = M.Util.encode(f.id) + 'c';

                /*
                 * Some tricky part here :
                 * 
                 *   - use of jquery .text() to strip out html elements
                 *     from the M.Map.Util.Feature.getTitle() function return
                 *     
                 *   - If icon or thumbnail is not defined in the feature attributes,
                 *     then force text span display
                 */
                icon = M.Map.Util.Feature.getIcon(f);
                title = M.Util.stripTags(M.Map.Util.Feature.getTitle(f));
                $t.append('<span class="thumbs" jtitle="' + title + '" id="' + id + '">' + (icon ? '' : '<span class="title">' + title + '</span>') + '<img src="' + (icon ? icon : M.Util.getImgUrl('nodata.png')) + '"></span>');
                (function(f, $div) {
                    $div.click(function(e) {

                        e.preventDefault();
                        e.stopPropagation();

                        /*
                         * Zoom on feature and select it
                         */
                        //console.log(f);
                        /*M.Map.zoomTo(f.geometry.getBounds());
                        M.Map.featureInfo.select(f, true);
                        self.hilite(f);*/

                        return false;
                    });
                    M.tooltip.add($div, 'e', 10);
                })(f, $('#' + id));
            }
        
            /*
             * Display the SidePanel
             */
            M.sidePanel.show(this.sidePanelItem);

        };

        /**
         * Hide popups
         */
        this.hide = function() {
            var self = this;
            if (self._p.$d.is(':visible')) {
                self._p.hide(true);
            }
            if (self._mip.$d.is(':visible')) {
                self._mip.hide(true);
            }
        };

        /*
         * Create unique object instance
         */
        M.Map.FeatureInfo._o = this;

        return this.init(options);
    };

})(window.M);