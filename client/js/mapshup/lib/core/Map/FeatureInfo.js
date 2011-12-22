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

            var self = this;
            
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
             * NorthEast Toolbar triggering East panel 
             */
            self.pn = new msp.Panel('e');
            self.btn = new msp.Button({
                tb:new msp.Toolbar(self.options.position, self.options.orientation),
                icon:"info.png",
                tt:"Feature information",
                container:self.pn.add(),
                activable:true,
                scope:self
            });
            
            /*
             * Set the panel container content with the following html structure
             * 
             * <div id="..." class="pfi">
             *      <div class="header"></div>
             *      <div class="actions"></div>
             *      <div class="body expdbl">
             *      </div>
             * </div>
             */
            self.btn.container.$d.html('<div id="'+msp.Util.getId()+'" style="width:'+self.pn.getInnerDimension().w+'px;" class="pfi"><div class="header">'+msp.Util._("Feature information")+'</div><div class="actions block"></div><div class="body block expdbl"></div>');

            /*
             * Set references
             */
            self.btn.$a = $('.actions', self.btn.container.$d); // Actions
            self.btn.$b = $('.body', self.btn.container.$d); // Body
            self.btn.$h = $('.header', self.btn.container.$d); // Header

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
            return feature.attributes["name"] || feature.attributes["title"] || msp.Util.shorten(feature.attributes["identifier"],40,true) || msp.Util.shorten(feature.id, 40, true) || "";

        };

        /*
         * Translate input key into its "human readable" equivalent defined in layerDescription.featureInfo.keys array
         *
         * @input {String} key : key to translate
         * @input {OpenLayers.Feature} feature : feature reference
         */
        this.translate = function(key, feature) {

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
        };
        
        /**
         * Set $a html content
         */
        this.setActions = function(feature) {
            
            var id,
                self = this,
                fi = feature.layer["_msp"].layerDescription.featureInfo;
                    
            /*
             * Set "zoom on feature" action
             */
            self.btn.$a.html('<span class="zoom" jtitle="'+msp.Util._("Zoom to extent")+'">zoom</span>');
            $('.zoom', self.btn.$a).click(function() {
                self.zoomOn();
                return false;
            });
            msp.tooltip.add($('.zoom', self.btn.$a), 'n'); // Add tooltips


            /*
             * If a layerDescription.featureInfo.action, add an action button
             */
            if (fi && fi.action) {

                /*
                 * The action is added only if javascript property is a valid function
                 */
                if (typeof fi.action.callback === "function") {

                    id = msp.Util.getId();

                    /*
                     * Add the action button
                     */
                    self.btn.$a.append('<span id="'+id+'" jtitle="'+msp.Util._(fi.action["title"])+'">'+fi.action["cssClass"]+'</span>');

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

        };
        
        /**
         * Set $b html content
         */
        this.setBody = function(feature) {
            
            var layerType,
                value,
                key,
                html = "",
                self = this,
                typeIsUnknown = true;

            /*
             * Roll over layer types to detect layer features that should be
             * displayed using a dedicated appendDescription function
             */
            if ((layerType = msp.Map.layerTypes[feature.layer["_msp"].layerDescription["type"]])) {
                if (typeof layerType.appendDescription === "function" ) {
                    layerType.appendDescription(feature, self.btn.$b);
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
             *      <div class="thumb block"></div>
             *      <div class="info block"></div>
             * 
             * 
             */
            if (typeIsUnknown) {
                
                /*
                 * Check for thumbnail
                 */
                if (feature.attributes.hasOwnProperty('thumbnail')) {
                    self.btn.$b.html('<div class="block thumb"><img src="'+feature.attributes['thumbnail']+'" class="padded"/></div><div class="info block"><div class="padded"><table></table></div></div>');
                }
                else{ 
                    self.btn.$b.html('<table></table>');
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
                        html += '<tr><td>'+self.translate(key, feature)+'</td><td>&nbsp;</td><td>'+value+'</td></tr>';
                    }
                }

                $('table', self.btn.$b).append(html);
            }
            
        };
        
        /**
         * Set $h html content
         */
        this.setHeader = function(feature) {
            var title = this.getTitle(feature);
            this.btn.$h.attr('title',feature.layer.name + ' | ' + title).html(msp.Util.shorten(title, 50));    
        };

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
        this.select = function(feature, _force) {

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
                    msp.Map.map.zoomToExtent(bounds);

                    return false;
                    
                }
            }

            /*
             * If select is not forced (i.e. input 'force' parameter set to false)
             * and the feature is not completely include within the current map view,
             * then it is unselected and the menu it displayed instead
             */
            if (!force && !msp.Map.map.getExtent().containsBounds(feature.geometry.getBounds())) {

                /*
                  * Unselect feature
                  */
                msp.Map.Util.getControlById("__CONTROL_SELECT__").unselect(feature);
                
                /*
                 * Display the menu
                 */
                msp.Map.mouseClick = msp.Map.mousePosition.clone();
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
            msp.Map.featureInfo.selected = feature;
 
            /*
             * If layerType.resolvedUrlAttributeName is set,
             * display feature info within an iframe
             */
            if (msp.Map.layerTypes[feature.layer["_msp"].layerDescription["type"]].resolvedUrlAttributeName) {
                
                var btn,
                    pn = new msp.Panel('s'), // Create new South panel
                    ctn = pn.add(),
                    extent = feature.geometry.getBounds().clone(); // Add container within panel

                /*
                 * Set container content
                 */
                ctn.$d.html('<div id="'+msp.Util.getId()+'" style="height:'+pn.getInnerDimension().h+'px;"><iframe class="frame" src="'+feature.attributes[msp.Map.layerTypes[featureType].resolvedUrlAttributeName]+'" width="100%" height="100%"></iframe></div>')
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
                 * Display feature information within #featureinfo div
                 */
                self.show();
                
            }
            return true;
        };
        
        /**
         * Show the featureInfo popup on top of the selected feature
         */
        this.show = function() {
            
            /*
             * Remove sheader if empty
             */
            var sheader = $('.sheader', this.btn.$b);
            if (sheader.is(':empty')) {
                sheader.remove();
            }
            /*
             * Only show feature info if a feature is selected
             */
            if (this.selected && this.selected.geometry) {
                msp.Util.show(this.$d);
            }
        };

        /**
         * Unselect feature and clear information
         * Called by "onfeatureunselect" events
         */
        this.unselect = function(feature) {
            
            /*
             * Always hide menu on unselect
             */
            msp.menu.hide();
            
            msp.Map.featureInfo.selected = null;
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