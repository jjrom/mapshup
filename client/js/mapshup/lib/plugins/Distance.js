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
 * PLUGIN: Distance
 *
 * A valid plugin is an fn object containing
 * at least the init() mandatory function.
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.Distance = function() {
        
        /*
         * Only one Distance object instance is created
         */
        if (msp.Plugins.Distance._o) {
            return msp.Plugins.Distance._o;
        }
        
        /*
         * Result object containing title and elevation samples
         * {
         *      id:
         *      lat:
         *      lng:
         *      elevation:
         * }
         */
        this.result = {
            title:"",
            elevations:[],
            plots:null
        };

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
            this.options.samples = this.options.samples || 30;
            
            /*
             * Measure distance control
             */
            var measureControl = new OpenLayers.Control.Measure(
                OpenLayers.Handler.Path, {
                    id:"__CONTROL_MEASURE__",
                    persist: true,
                    geodesic:true,
                    handlerOptions: {
                        layerOptions: {
                            styleMap:new OpenLayers.StyleMap({
                                "default": new OpenLayers.Style("default",{
                                    rules:[new OpenLayers.Rule({
                                        symbolizer: {
                                            "Point": {
                                                pointRadius:6,
                                                graphicName:"circle",
                                                fillColor:"gray",
                                                fillOpacity:1,
                                                strokeWidth:1,
                                                strokeOpacity:1,
                                                strokeColor:"white"
                                            },
                                            "Line": {
                                                pointRadius:6,
                                                strokeWidth:3,
                                                strokeOpacity:1,
                                                strokeColor:"#FFFFFF",
                                                strokeDashstyle:"dash"
                                            }
                                        }
                                    })]
                                })
                            })
                        }
                    },
                    eventListeners: {
                        measure: function(e) {
                            var units = e.units,
                                order = e.order,
                                measure = e.measure,
                                out = "";
                            if(order === 1) {
                                out += msp.Util._("Distance")+" : " + measure.toFixed(3) + " " + units;
                            } else {
                                out += msp.Util._("Area")+" : " + measure.toFixed(3) + " " + units + "<sup>2</sup>";
                            }
                            
                            /*
                             * Store result
                             */
                            self.result.title = out;
                            self.result.elevations = [];
                            self.result.plots = null;
                            
                            /*
                             * Display results
                             */
                            self.display(e.geometry.getVertices());
                            msp.Map.resetControl(this);
                        }
                    }
                });

            this.layer = new OpenLayers.Layer.Vector("__LAYER_DISTANCE__",{
                projection:msp.Map.epsg4326,
                displayInLayerSwitcher:false,
                styleMap:new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style("default",{
                        rules:[new OpenLayers.Rule({
                            symbolizer: {
                                "Point": {
                                    pointRadius:"${size}",
                                    graphicName:"circle",
                                    fillColor:"${color}",
                                    fillOpacity:1,
                                    strokeWidth:1,
                                    strokeOpacity:1,
                                    strokeColor:"white",
                                    label:"${label}",
                                    fontColor:"white",
                                    fontSize:"12px",
                                    labelXOffset:"10",
                                    labelYOffset:"10",
                                    labelAlign:"rm"
                                }
                            }
                        })]
                    })
                })
            });

            /**
             * Add a distance layer
             */
            msp.Map.addLayer({
                type:"Generic",
                title:this.layer.name,
                unremovable:true,
                initialLayer:true,
                layer:this.layer
            });

            /*
             * Add control to map
             */
            msp.Map.map.addControl(measureControl);

            /*
             * Add "Measure" item in menu
             */
            if (msp.menu) {
                msp.menu.add([
                    {
                        id:msp.Util.getId(),
                        ic:"distance.png",
                        ti:"Measure distance",
                        cb:function() {
                            msp.Map.Util.getControlById("__CONTROL_MEASURE__").activate();
                        }
                    }
                ]);
            }
            
            /*
             * Distance layer is always on top of other layers
             */
            msp.Map.events.register("layersend", this, function(action,layer,scope){
                msp.Map.Util.setLayerOnTop(scope.layer);
            });
            
            /*
             * Elevation plot should be redrawn on map size change
             */
            msp.Map.events.register("resizeend", this, function(scope){
                scope.refreshElevation();
            });
            
            return true;
        };

        /** Plugin specific */

        /**
         * Display distance information.
         * If options.elevationServiceUrl, distance
         * is displayed along an elevation profile
         */
        this.display = function(vertices) {

            /**
             * Elevation is computed
             */
            if (this.options.elevationServiceUrl) {

                /**
                 * First transform array of vertices into a google elevation path
                 */
                var i,
                    l,
                    isFirst = true,
                    path = "",
                    latlonVertice = null,
                    lonMin = Number.MAX_VALUE,
                    lonMax = Number.MIN_VALUE,
                    latMin = Number.MAX_VALUE,
                    latMax = Number.MIN_VALUE,
                    self = this;

                for(i = 0, l = vertices.length; i < l; i++) {
                    latlonVertice = msp.Map.Util.p2d(vertices[i]);
                    if (!isFirst) {
                        path += "|";
                    }
                    isFirst = false;
                    if (latlonVertice.x < lonMin) {
                        lonMin = latlonVertice.x;
                    }
                    if (latlonVertice.x > lonMax) {
                        lonMax = latlonVertice.x;
                    }
                    if (latlonVertice.y < latMin) {
                        latMin = latlonVertice.y;
                    }
                    if (latlonVertice.y > latMax) {
                        latMax = latlonVertice.y;
                    }
                    path += latlonVertice.y + "," + latlonVertice.x;
                }

                /**
                 * Get elevation object
                 */
                msp.Util.ajax({
                    url:msp.Util.proxify(msp.Util.repareUrl(msp.Util.getAbsoluteUrl(this.options.elevationServiceUrl))+"path="+path+"&samples="+self.options.samples),
                    async:true,
                    dataType:"json",
                    success:function(data){
                        var i,
                            l,
                            xy,
                            feature,
                            result,
                            layer = self.layer,
                            plots = [];
                            msp.Map.Util.setVisibility(layer, true);
                            layer.destroyFeatures();

                        /**
                         * data is valid
                         */
                        if (data &&  data.results.length > 0) {
                            
                            l = data.results.length;
                        
                            for (i = 1; i <= l; i++) {
                                result = data.results[i-1];
                                xy = msp.Map.Util.d2p(new OpenLayers.LonLat(parseFloat(result.location.lng),parseFloat(result.location.lat)));
                                
                                /**
                                 * Add feature to "__LAYER_DISTANCE__" layer
                                 *  - first point is green and bigger
                                 *  - last point is red and bigger
                                 *  - each 5th point are alt color
                                 *  - other points are gray
                                 */
                                feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(xy.lon, xy.lat), {
                                    label:i === 1 || i % 5 === 0 ? i : "",
                                    size:i === 1 || i === self.options.samples ? 6 : 4,
                                    color:(function(point) {
                                        if (point === 1) {
                                            return "green";
                                        }
                                        else if (point === self.options.samples) {
                                            return "red"
                                        }
                                        else if (point % 5 === 0) {
                                            return "alt";
                                        }
                                        return "gray";
                                    })(i)
                                });
                                layer.addFeatures(feature);
                                plots[i-1]=[i,parseFloat(result.elevation)];

                                /*
                                 * Update plugin "elevations" array
                                 */
                                self.result.elevations.push({
                                    id:i,
                                    lat:result.location.lat,
                                    lng:result.location.lng,
                                    elevation:result.elevation
                                });
                               
                            }
                            
                            /*
                             * if elevation container ($d) is not set
                             * create it within a south panel
                             */
                            if (!self.btn) {

                                var pn = new msp.Panel('s'), // Create new South panel
                                    ctn = pn.add(); // Add container within panel
                                
                                /*
                                 * Set container content
                                 */
                                ctn.$d.html('<div id="'+msp.Util.getId()+'" style="height:'+pn.getInnerDimension().h+'px;"></div>')
                                self.$e = ctn.$d.children().first();

                                /*
                                 * Register open elevation action within Toolbar South south toolbar
                                 */
                                self.btn = new msp.Button({
                                    tt:"Show/Hide Distance",
                                    tb:new msp.Toolbar('ss', 'h'),
                                    title:"Elevation",
                                    container:ctn,
                                    close:true,
                                    onclose:self.onClose,
                                    callback:self.showElevation,
                                    activable:true,
                                    scope:self,
                                    e:{
                                        layer:self.layer
                                    },
                                    actions:[
                                        {
                                            cssClass:"actnnw icnzoom",
                                            callback:function(btn) {
                                                msp.Map.zoomTo(btn.layer.getDataExtent());
                                            }
                                        }
                                    ]
                                });
                                
                            }
                            
                            self.result.plots = [plots];
                            
                            /*
                             * Indicate that the plot is a fresh one
                             */
                            self.fresh = true;
                          
                            /*
                             * Display result
                             */
                            self.showElevation(self, self.btn);
                            
                        }
                        /**
                         * No data...display simple distance
                         */
                        else {
                            msp.Util.message(self.result.title);
                        }

                    },
                    /**
                     * Error...display simple distance
                     */
                    error:function(e) {
                        msp.Util.message(self.result.title);
                    }
                },{
                    title:msp.Util._("Retrieve elevation data..."),
                    cancel:true
                });

            }
            /**
             * Simple distance display
             */
            else {
                msp.Util.message(self.result.title);
            }
        };
        
        /*
         * Function called to properly close the elevation panel
         */
        this.onClose = function(btn) {
            
            /*
             * Clear result
             */
            btn.scope.result.plots = [];
            
            /*
             * Hide layer
             */
            msp.Map.Util.setVisibility(btn.scope.layer, false);
            
            /*
             * Nullify plugin btn
             */
            btn.scope.btn = null;
        };

        /**
         * Show elevation
         */
        this.showElevation = function(scope, btn) {
           
            if (scope.fresh) {
                
                /*
                 * Activate distance button
                 */
                btn.activate(true);
                
                /*
                 * Show container
                 */
                btn.container.pn.show(btn.container);
            }
            
            /*
             * This is no more a new plot
             */
            scope.fresh = false;
            
            /*
             * Refresh plot
             */
            scope.refreshElevation();
            
            /*
             * Add dowload elevation capability
             */
            /* TODO
            if (msp.plugins["Download"]) {
                $('a.jActionButton', self.$d).click(function(){
                    msp.plugins["Download"].download(elevations, msp.Util._('Elevation'), "csv");
                });
            }*/
            
        };
        
        /*
         * Refresh elevation plots
         */
        this.refreshElevation = function() {
            
            if (!this.result.plots || this.result.plots.length === 0) {
                return;
            };
            
            /*
             * Empty elevation div
             */
            this.$e.empty();
            
            /*
             * Set this.$e width
             */
            this.$e.width(this.btn.container.$d.width());
            
            /*
             * Display elevation through jqplot
             */
            $.jqplot(this.$e.attr('id'), this.result.plots, {
                axes:{
                    xaxis:{
                        min:1,
                        max:this.samples,
                        label:this.result.title,
                        tickOptions:{
                            formatString:'%d'
                        }
                    },
                    yaxis:{
                        label:msp.Util._("Elevation (m)"),
                        labelRenderer: $.jqplot.CanvasAxisLabelRenderer
                    }
                },
                cursor:{
                    show:true,
                    showTooltip:true,
                    tooltipFormatString:'%d: %.1 m',
                    tooltipLocation:'nw'
                },
                seriesDefaults: {
                    fill:true,
                    fillToZero:true,
                    shadow:false,
                    color:'#000',
                    fillColor:'#000'
                },
                negativeSeriesColors:['#555']
            });
            
        }
        
        /*
         * Set unique instance
         */
        msp.Plugins.Distance._o = this;
        
        return this;
        
    }
})(window.msp);

