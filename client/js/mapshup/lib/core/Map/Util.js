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
 * Define msp.Map util functions
 */
(function(msp, Map) {
    
    /*
     * Initialize msp.Map.Util
     */
    Map.Util = {};
    
    /**
     * Convert "input" to "format" using "precision"
     *  "input" can be one of the following :
     *    - OpenLayers.Bounds
     *
     *  "format" can be one of the following :
     *    - WKT
     *    - EXTENT
     */
    Map.Util.convert = function(obj) {
        if (obj && obj.input instanceof OpenLayers.Bounds) {
            var left,bottom,right,top,
            precision = obj.precision || -1,
            limit = obj.hasOwnProperty("limit") ? obj.limit : false;
                
            if (precision !== -1) {
                left = obj.input.left.toFixed(precision);
                right = obj.input.right.toFixed(precision);
                bottom = obj.input.bottom.toFixed(precision);
                top = obj.input.top.toFixed(precision);
            }
            else {
                left = obj.input.left;
                right = obj.input.right;
                bottom = obj.input.bottom;
                top = obj.input.top;
            }
            
            /*
             * If limit is set, assume that input obj coordinates
             * are in deegrees and that output coordinates cannot
             * be outside of the whole earth i.e. -180,-90,180,90
             */
            if (limit) {
                left = Math.max(left, -180);
                right = Math.min(right, 180);
                bottom = Math.max(bottom, -90);
                top = Math.min(top, 90);
            }
            
            if (obj.format === "WKT") {
                return "POLYGON(("+left+" "+bottom+","+left+" "+top+","+right+" "+top+","+right+" "+bottom+","+left+" "+bottom+"))";
            }
            else if (obj.format === "EXTENT") {
                return left+","+bottom+","+right+","+top;
            }
        }
        return "";
    };
    
    /**
     * Return control identified by id
     */
    Map.Util.getControlById = function(id) {
        return Map.map.getControlsBy("id", id)[0];
    };
    
    
    /**
     * Return a hash table of unclusterized features.
     * The hash entry is the feature id attribute
     * 
     * @input layer : layer containing clusterizes or unclusterized features
     * 
     */
    Map.Util.getFeatures = function(layer) {

        var feature,
        i,
        j,
        l,
        m,
        features = [];
        
        /*
         * Roll over layer features
         */
        if (layer && layer.features) {
            for (i = 0, l = layer.features.length; i < l; i++) {

                /*
                 * Get feature
                 */
                feature = layer.features[i];

                /*
                 * If feature is a cluster, roll over features
                 * within this cluster
                 */
                if (feature.cluster) {

                    /*
                     * Roll over cluster features
                     */
                    for (j = 0, m = feature.cluster.length; j < m; j++) {

                        /*
                         * Add a new entry to features array
                         */
                        features[feature.cluster[j].id] = feature.cluster[j];

                    }
                }
                else {
                    features[feature.id] = feature;
                }
            }
        }

        return features;

    };
    
    /*
     * This function will return a formated LonLat
     * 
     * Parameters:
     *      lonlat - {OpenLayers.LonLat} the lonlat object to be formatted MUST BE IN Longitude/Latitude
     *      format - {String} specify the precision of the output can be one of:
     *           'dms' show degrees minutes and seconds (default)
     *           'hms' show hour minutes second
     */
    Map.Util.getFormattedLonLat = function(lonlat,format) {
        return Map.Util.getFormattedCoordinate(lonlat.lon,"lon",format)+"&nbsp;:&nbsp;"+Map.Util.getFormattedCoordinate(lonlat.lat,"lat",format);
    };
    
    /**
     *
     * This function will return latitude or longitude value formatted
     * It is inspired by the OpenLayers.Util.getFormattedLonLat function
     *
     * Parameters:
     *      coordinate - {Float} the coordinate value to be formatted
     *      axis - {String} value of either 'lat' or 'lon' to indicate which axis is to
     *          to be formatted (default = lat)
     *      format - {String} specify the precision of the output can be one of:
     *           'dms' show degrees minutes and seconds (default)
     *           'hms' show hour minutes second
     *           'dm' show only degrees and minutes
     *           'd' show only degrees
     * 
     * Returns:
     *      {String} the coordinate value formatted as a string
     */
    Map.Util.getFormattedCoordinate = function(coordinate, axis, format) {
        
        var result,degreesOrHours,minutes,seconds,tmp,nsew,
            sign = "",
            degreesOrHoursUnit = "\u00B0";
        
        /*
         * Check format - By default returns degree, minutes, seconds
         */
        if (!format) {
            format = 'dms';
        }

        /*
         * Normalize coordinate for longitude values between -180 and 180 degrees
         */
        coordinate = (coordinate+540)%360 - 180;

        /*
         * Set the nsew suffix
         */
        nsew = axis === "lon" ? (coordinate < 0 ? "W" : "E") : (coordinate < 0 ? "S" : "N");
        
        /*
         * Computation for longitude coordinate depends on the display format
         */
        if (format.indexOf('h') !== -1) {
            
            /*
             * For longitude, coordinate is in hours not in degrees
             */
            if (axis === 'lon') {
                
                /*
                 * Transform degrees -> hours
                 * Warning : 0 degrees = 0 hours
                 */
                coordinate = 24 * ((360 - coordinate)%360) / 360.0;
                degreesOrHoursUnit = "h";
            }
            
            /*
             * nsew has no sense in 'hms'
             */
            nsew = "";
            
            /*
             * For latitude (i.e. declinaison) the sign is stored 
             */
            sign = coordinate < 0 ? '-' : '+';
            
        }
        
        /*
         * Get degreesOrHour, minutes and seconds
         */
        coordinate = Math.abs(coordinate);
        degreesOrHours = Math.floor(coordinate);
        minutes = (coordinate - degreesOrHours)/(1/60);
        tmp = minutes;
        minutes = Math.floor(minutes);
        seconds = Math.round((tmp - minutes)/(1/60) * 10) / 10;
        if(seconds >= 60) { 
            seconds -= 60; 
            minutes += 1; 
            if( minutes >= 60) { 
                minutes -= 60; 
                degreesOrHours += 1; 
            } 
        }

        /*
         * Format result
         */
        result = (axis === 'lat' ? sign : "") + (degreesOrHours < 10 ? "0" : "") + degreesOrHours + degreesOrHoursUnit;
        if (format.indexOf('m') >= 1) {
            result += (minutes < 10 ? "0" : "") + minutes + "'";
            if (format.indexOf('ms') >= 1) {
                result += (seconds < 10 ? "0" : "") + seconds + '"';
            }
        }

        return result + nsew;
        
    };
    
    /**
     * mspID is an unique identifier used to identify
     * unambiguisly a specific layer
     */
    Map.Util.getLayerByMspID = function(mspID){
        if (!mspID || mspID === "") {
            return null;
        }
        for (var j = 0, l = Map.map.layers.length; j < l; j++) {
            var layer = Map.map.layers[j];
            /*
             * We use '==' instead of '===' in case that input mspID is a string
             * and not a numeric
             */
            if (layer["_msp"] && (layer["_msp"].mspID == mspID)) {
                return layer;
            }
        }
        return null;
    };
    
    /**
     * Return true if the layer is empty
     */
    Map.Util.layerIsEmpty = function(layer) {
        
        /*
         * No layer
         */
        if (!layer || !layer.features) {
            return true;
        }

        /*
         * Layer is defined but no features inside
         */
        if (layer.features.length === 0) {
            return true;
        }

        var isEmpty = true,
        length = layer.features.length,
        i;
        for (i = length;i--;) {
            if (layer.features[i].geometry) {
                isEmpty = false;
                break;
            }
        }
        
        return isEmpty;
    };
    
    
    /*
     * Transform input object from display projection (epsg4326) to map projection 
     */
    Map.Util.d2p = function(obj) {
        return obj.transform(Map.epsg4326, Map.map.projection);
    };

    /*
     * Transform input object from map projection to display projection (epsg4326)
     */
    Map.Util.p2d = function(obj) {
        return obj.transform(Map.map.projection, Map.epsg4326);
    };  
    
    /**
     * Set "layer" on top of other layers
     * (see LayerIndex in OpenLayers)
     */
    Map.Util.setLayerOnTop = function(layer) {
        if (layer) {
            Map.map.setLayerIndex(layer, Map.map.layers.length);
        }
    };
   
    /*
     * Set the layer visibility
     */
    Map.Util.setVisibility = function(layer, v) {
        
        /*
         * Set the layer visibility to v
         */
        layer.setVisibility(v);

        /*
         * Trigger the visibilitychanged trigger
         */
        Map.events.trigger("visibilitychanged", layer);

    };

    /**
     *
     * Update the layer activity indicator i.e. show it
     * if at least one layer is not loaded and remove it
     * when all layers are loaded 
     */
    Map.Util.updateLayerAI = function() {
        
        var i,
        l,
        layer,
        show = false,
        $d = msp.Util.$$('#layerai', msp.$mcontainer);
        
        for (i = 0, l = Map.map.layers.length; i < l; i++) {
            layer = Map.map.layers[i];
            if (layer.hasOwnProperty('_msp') && !layer._msp.isLoaded) {
                show = true;
                break;
            }
        }
        
        show ? $d.show() : $d.hide(); 
        
    };
    
    /**
     * Reindex layer to ensure that :
     *  - vectors layers are always on top of raster layers
     *  - Point and/or Line vector layers are always
     *    on top Polygonal vector layers
     */
    Map.Util.updateIndex = function(layer) {
        // TODO : on ne s'en sert plus
        return;
        var i,
        tmpLayer,
        index = Map.map.getLayerIndex(layer), //Set index to the layer index
        l = Map.map.layers.length;

        /*
         * Roll over layers list from the higher element
         * and retrieve it
         */
        for (i=l;i--;) {

            tmpLayer = Map.map.layers[i]
            
            /*
             * Do not process input layer
             */
            if (layer.id === tmpLayer.id) {
                continue;
            }

            /*
             * layer is a raster => get the index of the higher raster layer
             */
            if (!layer.features) {

                /*
                 * Get the index of the first raster tmpLayer found
                 * then break
                 */
                if (!tmpLayer.features) {
                    index = Map.map.getLayerIndex(tmpLayer);
                    break;
                }
            }
            /*
             * layer is a vector and have at least one feature with a non null geometry
             */
            else if (layer.features[0] && layer.features[0].geometry) {

                /*
                 * We already reached a raster layer => break
                 */
                if (!tmpLayer.features) {
                    index = Map.map.getLayerIndex(tmpLayer);
                    break;
                }

                /*
                 * layer is a Point => directly break
                 */
                if (layer.features[0].geometry.CLASS_NAME === "OpenLayers.Geometry.Point") {
                    break;
                }

                if (tmpLayer.features[0] && tmpLayer.features[0].geometry) {

                    /*
                     * We reached a Polygon => break
                     */
                    if (tmpLayer.features[0].geometry.CLASS_NAME === "OpenLayers.Geometry.Polygon") {
                        index = Map.map.getLayerIndex(tmpLayer);
                        break;
                    }

                    /*
                     * We reached a Line => break
                     */
                    if (layer.features[0].geometry.CLASS_NAME === "OpenLayers.Geometry.Line" && tmpLayer.features[0].geometry.CLASS_NAME === "OpenLayers.Geometry.Line") {
                        index = Map.map.getLayerIndex(tmpLayer);
                        break;
                    }
                }
                
            }
        }

        /*
         * Change layer index
         */
        if (Map.map.getLayerIndex(layer) !== index) {
            
            /*
             * Change layer index
             */
            Map.map.setLayerIndex(layer, index+1);
            
            /*
             * Trigger "indexchanged" event
             */
            Map.events.trigger("indexchanged", layer)
            
        }
       
    };
    
    /*
     * Center the map on the layer extent.
     * This centering is only done if the layer, or part of the added layer,
     * is not already visible in the map view
     *
     * Note : if the layer has already been loaded then the _msp.initialized attribute
     * is set to true and the map is not centered any more on this layer even if
     * its content changes
     */
    Map.Util.zoomOnAfterLoad = function(layer) {
        
        var extent = layer.getDataExtent() || layer["_msp"].bounds;
            
        if (layer["_msp"].zoomOnAfterLoad && !layer["_msp"].initialized) {

            /*
             * Vector layers have a getDataExtent() function that returns bounds
             * Raster layer such as WMS or Image should have a ["_msp"].bounds property
             * set during initialization
             */
            if (extent) {

                /*
                 * Centering is done only if the entire layer or part of the layer
                 * is not visible within the map view
                 */
                if (!msp.Map.map.getExtent().intersectsBounds(extent, true)) {
                    msp.Map.zoomTo(extent);
                }

            }
        }
    };

    
})(window.msp, window.msp.Map);
