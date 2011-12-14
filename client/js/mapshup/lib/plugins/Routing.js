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
/*********************************************
 *
 * Plugin - Routing
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.Routing = function() {
        
        /*
         * Only one Routing object instance is created
         */
        if (msp.Plugins.Routing._o) {
            return msp.Plugins.Routing._o;
        }
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var self = this;
            
            /**
             * Init options
             */
            this.options = options || {};

            /**
             * Default options values
             */
            $.extend(this.options, {
                method:this.options.method || "SPD",
                url:this.options.url || "/plugins/routing/getShortestPath.php?"
            });
            
            /**
             * Layer where the result is drawn
             */
            this.resultLayer = new OpenLayers.Layer.Vector("__LAYER_ROUTINGRESULT_", {
                displayInLayerSwitcher:false,
                styleMap: new OpenLayers.StyleMap(new OpenLayers.Style({
                    strokeColor: "#ff9933",
                    strokeWidth: 3
                }))
            });

            /*
             * Add a distance layer
             */
            msp.Map.addLayer({
                type:"Generic",
                title:this.resultLayer.name,
                unremovable:true,
                initialLayer:true,
                layer:this.resultLayer
            });

            /*
             * Layer where the start and en points are drawn
             */
            this.endsLayer = new OpenLayers.Layer.Vector("__LAYER_ROUTINGENDS_", {
                displayInLayerSwitcher:false,
                styleMap:new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style("default",{
                        rules:[new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    pointRadius:"6",
                                    graphicName:"circle",
                                    fillColor:"${color}",
                                    fillOpacity:1,
                                    strokeWidth:1,
                                    strokeOpacity:1
                                }
                            }
                        })]
                    })
                })
            });

            /*
             * Add a distance layer
             */
            msp.Map.addLayer({
                type:"Generic",
                title:this.endsLayer.name,
                unremovable:true,
                initialLayer:true,
                layer:this.endsLayer
            });
            
            /*
             * Add items to msp.menu
             */
            if (msp.menu) {
                
                /**
                 * Search all catalogs within the map view
                 */       
                msp.menu.add([{
                    id:msp.Util.getId(),
                    ic:"routingstartpoint.png",
                    ti:"Set start point",
                    cb:function() {
                        self.setStartPoint(msp.menu.lonLat.clone());
                    }
                },
                {
                    id:msp.Util.getId(),
                    ic:"routingendpoint.png",
                    ti:"Set end point",
                    cb:function() {
                        self.setEndPoint(msp.menu.lonLat.clone());
                    }
                }]);
                
            }
            
            return this;
        };
        
        /**
         * Set start point for routing
         *
         * @input point: start point in Map projection
         */
        this.setStartPoint = function(point) {

            var tmpPoint,
                self = this;
            /**
             * Clean endsLayer
             */
            self.endsLayer.destroyFeatures();

            /**
             * Add start point - green
             */
            self.endsLayer.addFeatures(new OpenLayers.Feature.Vector((new OpenLayers.Geometry.Point(point.lon, point.lat)),{
                color:"green"
            }));
            self.startPoint = msp.Map.Util.p2d(point);

            /**
             * Compute routing if an end point is defined
             */
            if (self.endPoint) {
                /**
                 * Add end point - red
                 */
                tmpPoint = msp.Map.Util.d2p(self.endPoint.clone());
                self.endsLayer.addFeatures(new OpenLayers.Feature.Vector((new OpenLayers.Geometry.Point(tmpPoint.lon, tmpPoint.lat)),{
                    color:"red"
                }));
                self.processRouting(self.startPoint, self.endPoint, self.options.method);
            }
        };

        /**
         * Set end point for routing
         *
         * @input point: end point in Map projection
         */
        this.setEndPoint = function(point) {

            var tmpPoint,
                self = this;
            
            /**
             * Clean endsLayer
             */
            self.endsLayer.destroyFeatures();

            /**
             * Add end point - red
             */
            self.endsLayer.addFeatures(new OpenLayers.Feature.Vector((new OpenLayers.Geometry.Point(point.lon, point.lat)),{
                color:"red"
            }));
            self.endPoint = msp.Map.Util.p2d(point);

            /**
             * Compute routing if a start point is defined
             */
            if (self.startPoint) {
                /**
                 * Add start point - green
                 */
                tmpPoint = msp.Map.util.d2p(self.startPoint.clone());
                self.endsLayer.addFeatures(new OpenLayers.Feature.Vector((new OpenLayers.Geometry.Point(tmpPoint.lon, tmpPoint.lat)),{
                    color:"green"
                }));
                self.processRouting(self.startPoint, self.endPoint, self.options.method);
            }
        };

        /**
         * Routing result are in epsg:4326 coordinates
         */
        this.processRouting = function(startPoint, endPoint, method) {

            var self = this;
            
            /**
             * Get routing
             */
            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.repareUrl(msp.Util.getAbsoluteUrl(self.options.url))+"method="+method+"&startpoint="+startPoint.lon+":"+startPoint.lat+"&endpoint="+endPoint.lon+":"+endPoint.lat),
                async:true,
                dataType:"json",
                success:function(data){
                    var i,
                        l,
                        geojson = (new OpenLayers.Format.GeoJSON()).read(data)
                    self.resultLayer.destroyFeatures();
                    for (i = 0, l = geojson.length; i < l; i++) {
                        msp.Map.Util.d2p(geojson[i].geometry);
                        self.resultLayer.addFeatures(geojson[i]);
                    }
                }
            },{
                title:msp.Util._("Compute shortest path..."),
                cancel:true
            });

        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Routing._o = this;
        
        return this;
    };
    
})(window.msp);