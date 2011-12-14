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
 * Define msp.Map events
 */
(function (msp, Map) {
    
    Map.featureInfo =  {
 
        /**
         * Current selected feature
         */
        selected:null,

        /**
         * Unselect all feature
         */
        clear: function() {

            var c = Map.Util.getControlById("__CONTROL_SELECT__");
            
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
            
        },

        /**
         * Return feature title if it's defined within layerDescription.featureInfo.title property
         *
         * @input {OpenLayers.Feature} feature : input feature
         */
        getTitle:function(feature) {

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
            if (feature.layer["_msp"] && feature.layer["_msp"].layerDescription.featureInfo) {
                return msp.Util.replaceKeys(feature.layer["_msp"].layerDescription.featureInfo.title, feature.attributes);
            }

            /*
             * Otherwise returns name or title or identifier or id
             */
            return feature.attributes["name"] || feature.attributes["title"] || msp.Util.shorten(feature.attributes["identifier"],40,true) || msp.Util.shorten(feature.id, 40, true) || "";

        },

        /*
         * Translate input key into its "human readable" equivalent defined in layerDescription.featureInfo.keys array
         *
         * @input {String} key : key to translate
         * @input {OpenLayers.Feature} feature : feature reference
         */
        translate:function(key, feature) {

            /*
             * Paranoid mode
             */
            if (!feature || !key) {
                return msp.Util._(key);
            }

            /*
             * Check if keys array is defined
             */
            if (feature.layer["_msp"].layerDescription.featureInfo && typeof feature.layer["_msp"].layerDescription.featureInfo.keys) {

                /*
                 * Roll over the featureInfo.keys array.
                 * This array contains a list of {key:, value:} objects
                 */
                for (var i = 0, l = feature.layer["_msp"].layerDescription.featureInfo.keys.length; i < l; i++) {

                    /*
                     * If key is found in array, get the corresponding value and exist the loop
                     */
                    if (key === feature.layer["_msp"].layerDescription.featureInfo.keys[i].key) {
                        key = feature.layer["_msp"].layerDescription.featureInfo.keys[i].value;
                        break;
                    }
                }
                
            }

            /*
             * In any case returns a i18n translated string
             */
            return msp.Util._(key);
        },

        /**
         * Initialization
         */
        init: function() {

            /*
             * Add #featureinfo to the DOM
             */
            this.$d = msp.Util.$$("#featureinfo", msp.$map);
            
            /*
             * Store featureInfo height
             */
            this.height = this.$d.height();
            
            /*
             * Map move ?
             * Update position
             */
            Map.map.events.register('move', Map.map, function(){
                Map.featureInfo.updatePosition();
            });
             
        },

        /**
         * Update css position
         */
        updatePosition: function() {
            
            var xy,
                self = this;
            
            /*
             * No selected feature, no need of position update
             */
            if (self.selected && self.selected.geometry) {

                /*
                 * Update css top/left property depending on
                 * selected location on map
                 */
                xy = Map.map.getPixelFromLonLat(self.selected.geometry.getBounds().getCenterLonLat());
                self.$d.css({
                    'left':xy.x - (3 * self.$d.width() / 4),
                    'top':xy.y - self.$d.height() - 10
                });
               
            }

        },

        /**
         * Select feature and get its information
         * Called by "onfeatureselect" events
         * 
         * @input feature : 
         * @input force : if true select the feature even if it is not
         *                completely visible in the map extent.
         *                This attribute is set to true by Catalog plugins
         *                when feature is selected by clicking on the search result panel
         */
        select: function(feature, _force) {

            var i,
                bounds,
                length,
                force = _force || false,
                self = this;
            
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
                    Map.map.zoomToExtent(bounds);

                    return false;
                    
                }
            }

            /*
             * If select is not forced (i.e. input 'force' parameter set to false)
             * and the feature is not completely include within the current map view,
             * then it is unselected and the menu it displayed instead
             */
            if (!force && !Map.map.getExtent().containsBounds(feature.geometry.getBounds())) {

                /*
                  * Unselect feature
                  */
                Map.Util.getControlById("__CONTROL_SELECT__").unselect(feature);
                
                /*
                 * Display the menu
                 */
                Map.mouseClick = Map.mousePosition.clone();
                msp.menu.show();
                
                return false;
            }

            /*
             * Always hide menu on select
             */
            msp.menu.hide();

            /*
             * Set the current selected object
             */
            Map.featureInfo.selected = feature;

            /*
             * Get featureType
             */
            var featureType = feature.layer["_msp"].layerDescription ? feature.layer["_msp"].layerDescription.type : null;
            
            /*
             * If layerType.resolvedUrlAttributeName is set,
             * display feature info within an iframe
             */
            if (Map.layerTypes[featureType].resolvedUrlAttributeName) {
                
                var btn,
                    pn = new msp.Panel('s'), // Create new South panel
                    ctn = pn.add(),
                    extent = feature.geometry.getBounds().clone(); // Add container within panel

                /*
                 * Set container content
                 */
                ctn.$d.html('<div id="'+msp.Util.getId()+'" style="height:'+pn.getInnerDimension().h+'px;"><iframe class="frame" src="'+feature.attributes[Map.layerTypes[featureType].resolvedUrlAttributeName]+'" width="100%" height="100%"></iframe></div>')
                msp.activity.show();
                $('.frame', ctn.$d).load(function() {
                    msp.activity.hide();
                });

                /*
                 * Register open elevation action within Toolbar South south toolbar
                 */
                btn = new msp.Button({
                    tt:self.getTitle(feature),
                    tb:new msp.Toolbar('ss', 'h'),
                    title:self.getTitle(feature),
                    container:ctn,
                    close:true,
                    activable:true,
                    scope:self,
                    actions:[
                        {
                            cssClass:"actnnw icnzoom",
                            callback:function(btn) {
                                msp.Map.zoomTo(extent);
                            }
                        }
                    ]
                });
                
                btn.trigger();
                
            }
            else {

                /*
                 * Display depends on featureType.
                 * Div structure is as follow :
                 * <body>
                 *      [...]
                 *      <div id="featureinfo" class="hideOnGE">
                 *          <div class="act actne icnclose"</div>
                 *          <div class="act actsw icnzoom"</div>
                 *          <div class="content shadow">
                 *              <div class="header">
                 *                  <span class="title">.....</span>
                 *              </div>
                 *              <div class="sheader">
                 *              <div class="body">
                 *                  [...]
                 *              </div>
                 *          </div>
                 *          <div a class="act ..."></div> // Optional
                 *      </div>
                 *      [...]
                 * </body>
                 */
                self.$d.html('<div class="act actsw icnzoom"  jtitle="'+msp.Util._("Zoom to extent")+'"></div><div class="content shadow"></div>');

                msp.Util.addCloseButton(self.$d, function(){
                    self.clear()
                });

                var fi = feature.layer["_msp"].layerDescription.featureInfo;
            
                /*
                 * If a layerDescription.featureInfo.action, add an action button
                 */
                if (fi && fi.action) {

                    /*
                     * The action is added only if javascript property is a valid function
                     */
                    if (typeof fi.action.callback === "function") {

                        var id = msp.Util.getId();
                        /*
                         * Add the action button
                         */
                        self.$d.append('<div id="'+id+'" class="act '+fi.action["cssClass"]+'" jtitle="'+msp.Util._(fi.action["title"])+'"></div>');

                        /*
                         * Dedicated action
                         */
                        (function($id, feature, action) {
                            $id.click(function() {
                                action(feature);
                                return false;
                            });
                            
                            /*
                             * Add tooltip
                             */
                            msp.tooltip.add($id, 'w');

                        })($('#'+id), feature, fi.action["callback"]);
                        
                    }

                }

                /*
                 * Zoom on feature
                 */
                $('.icnzoom', self.$d).click(function() {
                    self.zoomOn();
                    return false;
                });

                /*
                 * Add tooltips
                 */
                msp.tooltip.add($('.icnclose', self.$d), 'w');
                msp.tooltip.add($('.icnzoom', self.$d), 'n');
                
                var div = $('.content',self.$d),
                    title = self.getTitle(feature),
                    typeIsUnknown = true,
                    layerType;

                /*
                 * Initialize Header
                 */
                div.append('<div class="header" title="'+ feature.layer.name + ' | ' + title +'">' + msp.Util.shorten(title, 50) + '&nbsp;&nbsp;&nbsp;</div><div class="sheader"></div><div class="body"></div>');
                
                /*
                 * Get body reference 
                 */
                var b = $('.body', div);
                
                /*
                 * Each layer type know how to display is own description
                 * through the [layerTypeDescriptor].featureDescription(feature,div)
                 * function
                 */
                if ((layerType = Map.layerTypes[featureType])) {
                    if (typeof layerType.appendDescription === "function" ) {
                        layerType.appendDescription(feature, b);
                        typeIsUnknown = false;
                    }
                }

                /*
                 * If feature type is unknown, use default display
                 * 
                 * Two cases :
                 *  - feature get a 'thumbnail' property -> add two
                 *  subpanels west and east with thumbnail on west and
                 *  other properties in a <table> on east
                 *  - feature does not get a 'thumbnail' property ->
                 *  properties are displayed within a <table> in a single panel
                 * 
                 */
                if (typeIsUnknown) {
                    
                    var value,
                    key,
                    html = "";
                        
                    /*
                     * Check for thumbnail
                     */
                    if (feature.attributes.hasOwnProperty('thumbnail')) {
                        b.append('<div class="west"><img src="'+feature.attributes['thumbnail']+'" class="padded"/></div><div class="east"><div class="padded"><table></table></div></div>');
                    }
                    else{ 
                        b.append('<table></table>');
                    }
                    for(key in feature.attributes) {
                        if (key === 'name' || key === 'title' || key === 'icon' || key === 'thumbnail' || key === 'quicklook') {
                            continue;
                        }
                        value = feature.attributes[key];
                        if (value) {
                            if (value instanceof Object) {
                                value = value.toString();
                            }
                            else if (typeof value === "string" && msp.Util.isUrl(value)) {
                                value = '<a target="_blank" href="'+value+'">'+msp.Util.shorten(value,40)+'</a>';
                            }
                            html += '<tr><td>'+self.translate(key, feature)+'</td><td>'+value+'</td></tr>';
                        }
                    }
                    
                    $('table', div).append(html);
                }

                /*
                 * Display feature information within #featureinfo div
                 */
                self.show();
                
            }
            return true;
        },
        
        /**
         * Show the featureInfo popup on top of the selected feature
         */
        show: function() {
            
            /*
             * Remove sheader if empty
             */
            var sheader = $('.sheader', this.$d);
            if (sheader.is(':empty')) {
                this.$d.css('height', this.height);
                $('.content', this.$d).css('height', this.height - 1);
                sheader.remove();
            }
            else {
                this.$d.css('height', this.height + sheader.height());
                $('.content', this.$d).css('height', this.height + sheader.height() - 1);
            }
            
            /*
             * Only show feature info is a feature is selected
             */
            if (this.selected && this.selected.geometry) {
                
                /*
                 * If needed, centers the map view to completely include featureinfo
                 */
                var centerX = msp.$map.width() / 2,
                centerY = msp.$map.height() / 2,
                recenter = false,
                borderOffset = 50, // Border offset in pixels
                offsetY = this.$d.offset().top + borderOffset,
                offsetX = this.$d.offset().left + borderOffset;
                
                msp.Util.show(this.$d);

                /*
                 * Update featureinfo position
                 */
                this.updatePosition();

                /*
                 * featureinfo is too top
                 */
                if (offsetY > 0) {
                    centerY = centerY - offsetY;
                    recenter = true;
                }

                /*
                 * featureinfo is too left
                 */
                if (offsetX > 0) {
                    centerX = centerX - offsetX;
                    recenter = true;
                }

                /*
                 * featureinfo is too right
                 */
                offsetX = msp.$map.width() - this.$d.offset().left - this.$d.width() - borderOffset;
                if (offsetX < 0) {
                    centerX = centerX - offsetX;
                    recenter = true;
                }
                /*
                 * map view should be recentered
                 */
                if (recenter) {
                    Map.setCenter(Map.map.getLonLatFromPixel(new OpenLayers.Pixel(centerX, centerY)));
                }
                
            }
        },

        /**
         * Unselect feature and clear information
         * Called by "onfeatureunselect" events
         */
        unselect: function(feature) {
            
            /*
             * Always hide menu on unselect
             */
            msp.menu.hide();

            /*
             * Hide '#featureinfo'
             */
            this.$d.hide();
            
            Map.featureInfo.selected = null;
        },

        /**
         * Zoom map on selected feature
         */
        zoomOn: function() {
            if (Map.featureInfo.selected && Map.featureInfo.selected.geometry) {
                Map.zoomTo(Map.featureInfo.selected.geometry.getBounds());
            }
        }
        

    }
    
})(window.msp, window.msp.Map);