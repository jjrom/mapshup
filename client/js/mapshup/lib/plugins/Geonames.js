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
 * PLUGIN: geonames
 *
 * A valid plugin is an fn object containing
 * at least the init() mandatory function.
 *
 * Optional functions are :
 *  getMenuItems() [See msp.js]
 *  getGeonamesMenuItems() [See plugins/geonames.js]
 *  any function defined by the plugin
 */
(function(msp) {
    
    msp.Plugins.Geonames = function() {
        
        /*
         * Only one Context object instance is created
         */
        if (msp.Plugins.Geonames._o) {
            return msp.Plugins.Geonames._o;
        }
        
        /*
         * Avoid strange behavior due to css
         * width:'auto' property
         */
        this.currentWidth = 0;
        this.justLaunched = false;
        
        /*
         * Array of geonames menu items
         */
        this.items = [];
        
        /*
         * Initialization
         */
        this.init = function (options) {

            /*
             * Init options
             */
            this.options = options || {};

            /*
             * No findNearByUrl...no plugin
             */
            if (!this.options.findNearByUrl) {
                return false;
            }

            this.options.featureClassString = this.options.featureClassString || "";

            /**
             * Plugin div creation
             *
             * <div id="gnm">
             *      <div class="content">
             *          <div class="header"></div>
             *      </div>
             * </div>
             */
            /*this.$d = msp.Util.$$('#gnm', msp.$map).html('<div class="content"><div class="header"></div></div>').addClass("apo shadow");
            */
            this.$d = msp.Util.$$('#gnm', msp.$map).html('<div class="content"><div class="header"></div></div>')
            .css({
                'background-image': 'url("'+msp.Util.getImgUrl("whereami_arrowdown.png")+'")',
                'background-position':'37px 100%'
            });
                
            var scope = this,
            popup = {
                move:function() {

                    if (!scope.layer) {
                        return;
                    }

                    var feature = scope.layer.features[0],
                        /*
                         * Update css top/left property depending on
                         * toponym location on map
                         */
                        xy = feature ? msp.Map.map.getPixelFromLonLat(feature.geometry.getBounds().getCenterLonLat()) : {
                            x:(msp.$map.width() - scope.$d.width()) / 2,
                            y:(msp.$map.height() / 2) - scope.$d.height() - 20
                        };

                    /*
                     * Update div position
                     */
                    scope.$d.css({
                        'left':xy.x - 58,
                        'top':xy.y - scope.$d.height()
                    });

                    /**
                     * Avoid strange behavior due to css
                     * width:'auto' property
                     */
                    if (scope.justLaunched) {
                        scope.currentWidth = scope.$d.width();
                        scope.justLaunched = false;
                    }

                    /**
                     * If popup isn't entirely inside Map div,
                     * hide it else display it
                     */
                    if (scope.layer.getVisibility() && feature) {
                        scope.$d.show();
                        if ((scope.$d.offset().left < msp.$map.offset().left) || (scope.$d.offset().left + scope.currentWidth > msp.$map.offset().left + msp.$map.width()) || (scope.$d.offset().top < msp.$map.offset().top) || (scope.$d.offset().top + scope.$d.height() > msp.$map.offset().top + msp.$map.height())) {
                            scope.$d.hide();
                        }
                    }

                },
                show:function(obj) {
                    if (obj && obj.geonames) {
                        var toponym = obj.geonames[0];
                        if (toponym) {

                            var items = [],
                            i,
                            l,
                            point = {
                                xy:msp.Map.Util.d2p(new OpenLayers.Geometry.Point(toponym.lng,toponym.lat)),
                                zoomOn:function(zoomout) {
                                    zoomout = zoomout || false;
                                    var xyCoord = new OpenLayers.LonLat(this.xy.x,this.xy.y);
                                    if (zoomout) {
                                        msp.Map.map.setCenter(xyCoord, Math.max(msp.Map.map.getZoom() - 1, msp.Map.lowestZoomLevel));
                                    }
                                    else {
                                        if (msp.Map.map.getZoom() < 14) {
                                            msp.Map.map.setCenter(xyCoord, 14);
                                        }
                                        else {
                                            msp.Map.map.setCenter(xyCoord, msp.Map.map.getZoom() + 1);
                                        }
                                    }
                                }
                            },
                            newFeature = new OpenLayers.Feature.Vector(point.xy);

                            /*
                             * Zoom here
                             */
                            items.push({
                                id:msp.Util.getId(),
                                ic:"plus.png",
                                cb:function() {
                                    point.zoomOn(false);
                                }
                            });

                            /*
                             * Zoom out
                             */
                            items.push({
                                id:msp.Util.getId(),
                                ic:"minus.png",
                                cb:function() {
                                    point.zoomOn(true);
                                }
                            });
                            
                            /*
                             * Extra item from other plugins
                             */
                            for (i = 0, l = scope.items.length;i<l;i++) {
                                items.push(scope.items[i]);
                            }
                            
                            /*
                             * Close
                             */
                            items.push({
                                id:msp.Util.getId(),
                                ic:"x.png",
                                cb:function() {
                                    scope.$d.hide();
                                    msp.Map.Util.setVisibility(scope.layer, false);
                                }
                            });

                            var fcodeName = msp.Util._(toponym.fcodeName),
                                div = $('.header', scope.$d).html('<span class="title" title="'+ toponym.name + ((fcodeName && fcodeName.length > 0) ? " - " + fcodeName.substr(0,1).toUpperCase() + fcodeName.substr(1, fcodeName.length -1) : "") + '">'+msp.Util.shorten(toponym.name+', '+toponym.countryName, 35)+ '</span> | ');

                            for (i = 0, l = items.length; i < l; i++) {
                                (function(item, toponym) {
                                    div.append('<a href="#" class="image item" id="'+item.id+'">'+ (item.ic ? '<img class="middle" src="'+msp.Util.getImgUrl(item.ic)+'"/>' : item.ti) +'</a>');
                                    $('#'+item.id).click(function(){
                                        item.cb(toponym);
                                        return false;
                                    });
                                })(items[i], toponym);
                            }

                            /*
                             * Empty layer and add the new feature
                             */
                            scope.layer.destroyFeatures();
                            scope.layer.addFeatures(newFeature);

                            /*
                             * Hide existing #jWhereAmI and force the 
                             * layer visibility to true
                             */
                            scope.$d.hide();
                            msp.Map.Util.setVisibility(scope.layer, true);

                            /*
                             * Update popup position
                             */
                            this.move();

                            /*
                             * Pan to feature only if it's not visible within the current map extent
                             */
                            if (!msp.Map.map.getExtent().containsBounds(newFeature.geometry.getBounds(),true,true) || !scope.$d.is(':visible')) {
                                msp.Map.setCenter(newFeature.geometry.getBounds().getCenterLonLat());
                            }

                        }
                        else {
                            msp.Util.message("&nbsp;"+msp.Util._("Location not found")+"&nbsp;");
                        }
                    }

                }
            }

            this.layer = new OpenLayers.Layer.Vector("__WHEREAMI__",{
                projection:msp.Map.pc,
                displayInLayerSwitcher:false,
                popup:popup,
                styleMap: new OpenLayers.StyleMap({
                    "default":new OpenLayers.Style({
                        externalGraphic:msp.Util.getImgUrl('shadow.png'),
                        graphicXOffset:-8,
                        graphicYOffset:-30,
                        graphicWidth:32,
                        graphicHeight:32
                    })
                })
            });

            // Add events on map move and on moveend
            this.layer.events.register("move", this.layer, function() {
                this.popup.move();
            });
            this.layer.events.register("moveend", this.layer, function() {
                scope.currentWidth = scope.$d.width();
                this.popup.move();
            });

            msp.Map.addLayer({
                type:"Generic",
                title:"__WHEREAMI__",
                unremovable:true,
                mspLayer:true,
                layer:this.layer
            });

            /*
             * Add "Where am i ?" menu item
             */
            if (msp.menu) {
                msp.menu.add([
                {
                    id:msp.Util.getId(),
                    ic:"whereami.png",
                    ti:"Where am I ?",
                    cb:function() {
                        scope.whereAmI(msp.Map.Util.p2d(msp.menu.lonLat.clone()));
                    }
                }]);
            }
            
            return true;

        };

        /**
         * Performs a reverse geolocation on "point"
         */
        this.whereAmI = function(point) {

            var featureClassString = this.options.featureClassString || "",
            scope = this;

            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(this.options.findNearByUrl)+featureClassString+"&lat="+point.lat+"&lng="+point.lon),
                async:true,
                dataType:"json",
                success: function(obj, textStatus, XMLHttpRequest) {
                    if(XMLHttpRequest.status === 200) {
                        /**
                         * Avoid strange behavior due to css
                         * width:'auto' property
                         */
                        scope.justLaunched = true;
                        scope.layer.popup.show(obj);
                    }

                },
                error: function(e) {
                    msp.Util.message("&nbsp;"+msp.Util._("Location not found")+"&nbsp;");
                }
            },{
                title:msp.Util._("Search for location name..."),
                cancel:true 
            });
        };
        
        /*
         * Add extra items to the Geonames menu
         */
        this.add = function(items) {
            
            if ($.isArray(items)) {
                
                /*
                 * Add new item
                 */
                for (var i = 0, l = items.length;i<l;i++) {
                    this.items.push(items[i]);
                }

            }
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Geonames._o = this;
        
        return this;
        
    };
    
})(window.msp);