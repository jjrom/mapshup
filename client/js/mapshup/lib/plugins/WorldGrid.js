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
 * Plugin WorldGrid
 *
 * Display world grid on top of layers
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.WorldGrid = function() {
        
        /*
         * Only one Wikipedia object instance is created
         */
        if (msp.Plugins.WorldGrid._o) {
            return msp.Plugins.WorldGrid._o;
        }
        
        /**
         * APIProperty: numPoints
         * {Integer} The number of points to use in each graticule line.  Higher
         * numbers result in a smoother curve for projected maps 
         */
        this.numPoints = 50;

        /**
         * APIProperty: targetSize
         * {Integer} The maximum size of the grid in pixels on the map
         */
        this.targetSize = 200;

        /*
         * Initialization
         */
        this.init = function (options) {

            var self = this;
            
            /**
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set defaults options
             */
            $.extend(self.options,{
                title:self.options.title || "Lat/Lon Grid",
                /* Allowed intervals */
                intervals:self.options.intervals || [45, 30, 20, 10, 5, 1],
                /* Default label display is degrees/minutes */
                labelFormat:self.options.labelFormat || "dm",
                /* Display label or no - default true */
                labelled:msp.Util.getPropertyValue(self.options, "labelled", true)
            });
            
            /*
             * Set WorldGrid layer
             */
            self.layer = new OpenLayers.Layer.Vector(msp.Util._(self.options.title),{
                projection:msp.Map.epsg4326,
                displayInLayerSwitcher:true,
                styleMap:new OpenLayers.StyleMap({
                    'default' :  new OpenLayers.Style({},{
                        rules:[new OpenLayers.Rule({
                            'symbolizer':{
                                "Point":{
                                    stroke:false,
                                    fill:false,
                                    fontColor:self.options.color || '#fff',
                                    label:"${label}",
                                    labelAlign:"${labelAlign}",
                                    labelXOffset:"${xOffset}",
                                    labelYOffset:"${yOffset}"
                                },
                                "Line":{
                                    strokeWidth: self.options.lineWidth || 1,
                                    strokeColor: self.options.lineColor || '#666'
                                }
                            }
                        })
                        ]
                    }
                    )
                })
            });
            
            /*
             * Add layer to mapshup map
             */
            msp.Map.addLayer({
                type:"Generic",
                title:self.layer.name,
                layer:self.layer,
                unremovable:true,
                initialLayer:true,
                hidden:false
            });

            /*
             * Reprocess the grid each time the map move
             */
            msp.Map.events.register("moveend", self, self.update);
            
            /*
             * Initialize grid
             */
            self.update(msp.Map.map, self);
            
            return self;
            
        };
        
        /**
         * Method: update
         *
         * Calculates the grid to be displayed and actually draws it
         * 
         * This method is a rewrite of OpenLayers.Contol.Graticule.update() method
         * 
         * Returns:
         * {DOMElement}
         */
        this.update = function(map, scope) {
            
            /*
             * Wait for the map to be initialized before proceeding
             */
            var pointList,testSq,distSq,delta,p1,p2,llInterval,i,l,j,k,
                mapBounds = map.getExtent();
            
            if (!mapBounds) {
                return;
            }

            /*
             * Clear out the old grid
             */
            scope.layer.destroyFeatures();

            /*
             * Get the projection objects required
             */
            var llProj = msp.Map.epsg4326,
                mapProj = map.getProjectionObject(),
                mapRes = map.getResolution();

            /*
             * If the map is in lon/lat, then the lines are straight and only one
             * point is required
             */
            if (mapProj.proj && mapProj.proj.projName == "longlat") {
                scope.numPoints = 1;
            }

            /*
             * Get the map center in EPSG:4326
             */
            var mapCenter = map.getCenter(), //lon and lat here are really map x and y
                mapCenterLL = new OpenLayers.Pixel(mapCenter.lon, mapCenter.lat);
            
            /*
             * Project in epsg:4326
             */
            OpenLayers.Projection.transform(mapCenterLL, mapProj, llProj);
                

            /* 
             * This block of code determines the lon/lat interval to use for the
             * grid by calculating the diagonal size of one grid cell at the map
             * center.  Iterates through the intervals array until the diagonal
             * length is less than the targetSize option.
             */
            /*
             *find lat/lon interval that results in a grid of less than the target size
             */
            testSq = scope.targetSize*mapRes;
            testSq *= testSq;  //compare squares rather than doing a square root to save time
            for (i=0, l = scope.options.intervals.length; i < l; ++i) {
                llInterval = scope.options.intervals[i];   //could do this for both x and y??
                delta = llInterval/2;  
                p1 = mapCenterLL.offset(new OpenLayers.Pixel(-delta, -delta));  //test coords in EPSG:4326 space
                p2 = mapCenterLL.offset(new OpenLayers.Pixel( delta,  delta));
                OpenLayers.Projection.transform(p1, llProj, mapProj); // convert them back to map projection
                OpenLayers.Projection.transform(p2, llProj, mapProj);
                distSq = (p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y);
                if (distSq <= testSq) {
                    break;
                }
            }

            //round the LL center to an even number based on the interval
            mapCenterLL.x = Math.floor(mapCenterLL.x/llInterval)*llInterval;
            mapCenterLL.y = Math.floor(mapCenterLL.y/llInterval)*llInterval;

            /* 
             * The following 2 blocks calculate the nodes of the grid along a 
             * line of constant longitude (then latitiude) running through the
             * center of the map until it reaches the map edge.  The calculation
             * goes from the center in both directions to the edge.
             * 
             */
            //get the central longitude line, increment the latitude
            var iter = 0,
                centerLonPoints = [mapCenterLL.clone()],
                newPoint = mapCenterLL.clone(),
                mapXY;
            do {
                newPoint = newPoint.offset(new OpenLayers.Pixel(0,llInterval));
                mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
                centerLonPoints.unshift(newPoint);
            } while (mapBounds.containsPixel(mapXY) && ++iter<1000);
            newPoint = mapCenterLL.clone();
            do {          
                newPoint = newPoint.offset(new OpenLayers.Pixel(0,-llInterval));
                mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
                centerLonPoints.push(newPoint);
            } while (mapBounds.containsPixel(mapXY) && ++iter<1000);

            //get the central latitude line, increment the longitude
            iter = 0;
            var centerLatPoints = [mapCenterLL.clone()];
            newPoint = mapCenterLL.clone();
            do {
                newPoint = newPoint.offset(new OpenLayers.Pixel(-llInterval, 0));
                mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
                centerLatPoints.unshift(newPoint);
            } while (mapBounds.containsPixel(mapXY) && ++iter<1000);
            newPoint = mapCenterLL.clone();
            do {          
                newPoint = newPoint.offset(new OpenLayers.Pixel(llInterval, 0));
                mapXY = OpenLayers.Projection.transform(newPoint.clone(), llProj, mapProj);
                centerLatPoints.push(newPoint);
            } while (mapBounds.containsPixel(mapXY) && ++iter<1000);

            //now generate a line for each node in the central lat and lon lines
            //first loop over constant longitude
            var lines = [];
            for(i = 0, l = centerLatPoints.length; i < l; ++i) {
                pointList = [];
                var lon = centerLatPoints[i].x,
                    labelPoint = null,
                    latEnd = Math.min(centerLonPoints[0].y, 90),
                    latStart = Math.max(centerLonPoints[centerLonPoints.length - 1].y, -90),
                    latDelta = (latEnd - latStart)/scope.numPoints,
                    lat = latStart;
                for(j = 0, k = scope.numPoints; j <= k; ++j) {
                    var gridPoint = new OpenLayers.Geometry.Point(lon,lat);
                    gridPoint.transform(llProj, mapProj);
                    pointList.push(gridPoint);
                    lat += latDelta;
                    if (gridPoint.y >= mapBounds.bottom && !labelPoint) {
                        labelPoint = gridPoint;
                    }
                }
                if (scope.options.labelled) {
                    //keep track of when this grid line crosses the map bounds to set
                    //the label position
                    //labels along the bottom, add 10 pixel offset up into the map
                    //TODO add option for labels on top
                    var labelPos = new OpenLayers.Geometry.Point(labelPoint.x,mapBounds.bottom),
                        labelAttrs = {
                        value: lon,
                        label: scope.options.labelled?msp.Map.Util.getFormattedCoordinate(lon, "lon", scope.options.labelFormat):"",
                        labelAlign: "cb",
                        xOffset: 0,
                        yOffset: 2
                    }; 
                    scope.layer.addFeatures(new OpenLayers.Feature.Vector(labelPos,labelAttrs));
                }
                var geom = new OpenLayers.Geometry.LineString(pointList);
                lines.push(new OpenLayers.Feature.Vector(geom));
            }

            //now draw the lines of constant latitude
            for (j = 0, k = centerLonPoints.length; j < k; ++j) {
                lat = centerLonPoints[j].y;
                if (lat<-90 || lat>90) {  //latitudes only valid between -90 and 90
                    continue;
                }
                pointList = [];
                var lonStart = centerLatPoints[0].x,
                    lonEnd = centerLatPoints[centerLatPoints.length - 1].x,
                    lonDelta = (lonEnd - lonStart)/scope.numPoints,
                    lon = lonStart,
                    labelPoint = null;
                for(i = 0, l = scope.numPoints; i <= l; ++i) {
                    var gridPoint = new OpenLayers.Geometry.Point(lon,lat);
                    gridPoint.transform(llProj, mapProj);
                    pointList.push(gridPoint);
                    lon += lonDelta;
                    if (gridPoint.x < mapBounds.right) {
                        labelPoint = gridPoint;
                    }
                }
                if (scope.options.labelled) {
                    //keep track of when this grid line crosses the map bounds to set
                    //the label position
                    //labels along the right, 30 pixel offset left into the map
                    //TODO add option for labels on left
                    var labelPos = new OpenLayers.Geometry.Point(mapBounds.right, labelPoint.y); 
                    var labelAttrs = {
                        value: lat,
                        label: scope.options.labelled?msp.Map.Util.getFormattedCoordinate(lat, "lat", scope.options.labelFormat):"",
                        labelAlign: "rb",
                        xOffset: -2,
                        yOffset: 2
                    }; 
                    scope.layer.addFeatures(new OpenLayers.Feature.Vector(labelPos,labelAttrs));
                }
                var geom = new OpenLayers.Geometry.LineString(pointList);
                lines.push(new OpenLayers.Feature.Vector(geom));
              }
              scope.layer.addFeatures(lines);
        };
    
        /*
         * Set unique instance
         */
        msp.Plugins.WorldGrid._o = this;
        
        return this;
    };
})(window.msp);