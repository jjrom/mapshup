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
 * Define M.Map util functions
 */
(function(M, Map) {

    /*
     * Initialize M.Map.Util
     */
    Map.Util = {};

    /**
     * Geohash library for Javascript
     * https://github.com/davetroy/geohash-js
     * 
     * (c) 2008 David Troy
     * Distributed under the MIT License
     * 
     */
    Map.Util.Geohash = {
        BITS: [16, 8, 4, 2, 1],
        BASE32: "0123456789bcdefghjkmnpqrstuvwxyz",
        refineInterval: function(interval, cd, mask) {
            if (cd & mask) {
                interval[0] = (interval[0] + interval[1]) / 2;
            }
            else {
                interval[1] = (interval[0] + interval[1]) / 2;
            }
        },
        decode: function(geohash) {
            var c, cd, mask, i, j, is_even = 1, lat = [], lon = [], lat_err = 90.0, lon_err = 180.0;

            lat[0] = -90.0;
            lat[1] = 90.0;
            lon[0] = -180.0;
            lon[1] = 180.0;

            /*
             * Remove trailing '#'
             */
            geohash = geohash.replace('#', '');

            for (i = 0; i < geohash.length; i++) {
                c = geohash.charAt(i);
                cd = this.BASE32.indexOf(c);
                for (j = 0; j < 5; j++) {
                    mask = this.BITS[j];
                    if (is_even) {
                        lon_err /= 2;
                        this.refineInterval(lon, cd, mask);
                    }
                    else {
                        lat_err /= 2;
                        this.refineInterval(lat, cd, mask);
                    }
                    is_even = !is_even;
                }
            }
            lat[2] = (lat[0] + lat[1]) / 2;
            lon[2] = (lon[0] + lon[1]) / 2;

            return new OpenLayers.LonLat(lon[1], lat[1]);
        },
        encode: function(point) {

            var mid, is_even = 1, i = 0, lat = [], lon = [], bit = 0, ch = 0, precision = 12, geohash = "";

            lat[0] = -90.0;
            lat[1] = 90.0;
            lon[0] = -180.0;
            lon[1] = 180.0;

            while (geohash.length < precision) {
                if (is_even) {
                    mid = (lon[0] + lon[1]) / 2;
                    if (point.lon > mid) {
                        ch |= this.BITS[bit];
                        lon[0] = mid;
                    } else
                        lon[1] = mid;
                } else {
                    mid = (lat[0] + lat[1]) / 2;
                    if (point.lat > mid) {
                        ch |= this.BITS[bit];
                        lat[0] = mid;
                    } else
                        lat[1] = mid;
                }

                is_even = !is_even;
                if (bit < 4)
                    bit++;
                else {
                    geohash += this.BASE32.charAt(ch);
                    bit = 0;
                    ch = 0;
                }
            }
            return '#' + geohash;
        }

    };

    /**
     * Feature functions
     */
    Map.Util.Feature = {
        /**
         *
         * Return feature icon url
         * 
         * Icon is assumed to be a square image of 75x75 px displayed within NorthPanel
         *
         * @param {OpenLayers.Feature} feature : input feature
         *
         */
        getIcon: function(feature) {

            var style, defaultStyle, icon;

            /*
             * Paranoid mode
             */
            if (!feature) {
                return icon;
            }

            /*
             * Guess icon with the following preference order :
             * 
             *    - attributes icon
             *    - attributes thumbnail
             *    - attributes quicklook
             *    - attributes imageUrl
             *    - feature style externalGraphic
             *    - icon based on type (i.e. point, line or polygon)
             *    - generic image 
             * 
             */
            if (feature.attributes.icon) {
                return feature.attributes.icon;
            }
            if (feature.attributes.thumbnail) {
                return feature.attributes.thumbnail;
            }
            if (feature.attributes.quicklook) {
                return feature.attributes.quicklook;
            }
            if (feature.attributes.imageUrl) {
                return feature.attributes.imageUrl;
            }
        
            /*
             * This is quite experimental :)
             */
            if (feature.layer) {

                /*
                 * Get the default style object from styleMap
                 */
                style = feature.layer.styleMap.styles["default"];

                /*
                 * The defaultStyle descriptor should be defined directly
                 * under feature.style property. If not, there is always
                 * a valid defaultStyle descriptor under feature.layer.styleMap.styles["default"]
                 */
                defaultStyle = feature.style || style.defaultStyle;
                if (defaultStyle.externalGraphic) {
                    return Map.Util.KML.resolveStyleAttribute(feature, style, defaultStyle.externalGraphic);
                }
            }

            /*
             * Icon based on type (point, linestring, polygon)
             */
            if (feature.geometry) {
                switch (feature.geometry.CLASS_NAME.replace("OpenLayers.Geometry.", "")) {
                    case "MultiPolygon":
                    case "Polygon":
                        return M.Util.getImgUrl("polygon.png");
                        break;
                    case "MultiLineString":
                    case "LineString":
                        return M.Util.getImgUrl("line.png");
                        break;
                    case "MultiPoint":
                    case "Point":
                        return M.Util.getImgUrl("point.png");
                        break;
                }
            }

            return icon;
        },
        /**
         * Return feature title if it's defined within layerDescription.featureInfo.title property
         *
         * @param {OpenLayers.Feature} feature : input feature
         */
        getTitle: function(feature) {

            var k;

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
                return M.Util._(feature.layer.name) + ": " + feature.cluster.length + " " + M.Util._("entities");
            }

            /*
             * User can define is own title with layerDescription.featureInfo.title property
             */
            if (feature.layer && feature.layer["_M"].layerDescription.featureInfo && feature.layer["_M"].layerDescription.featureInfo.title) {

                /*
                 * The tricky part :
                 * 
                 * Parse title and replace keys between dollars $$ with the corresponding value
                 * eventually transformed with the getValue() function
                 *
                 * Example :
                 *      title = "Hello my name is $name$ $surname$"
                 *      feature.attributes = {name:"Jerome", surname:"Gasperi"}
                 *
                 *      will return "Hello my name is Jerome Gasperi"
                 * 
                 */
                return feature.layer["_M"].layerDescription.featureInfo.title.replace(/\$+([^\$])+\$/g, function(m, key, value) {
                    var k = m.replace(/[\$\$]/g, '');
                    return Map.Util.Feature.getValue(feature, k, feature.attributes[k]);
                });

            }

            /*
             * Otherwise returns name or title or identifier or id
             */
            for (k in {
                name: 1,
                title: 1,
                identifier: 1
            }) {
                if (feature.attributes[k]) {
                    return Map.Util.Feature.getValue(feature, k, feature.attributes[k]);
                }
            }
            return feature.id || "";

        },
        /*
         * Get feature attribute value
         * 
         * If layerDescription.featureInfo.keys array is set and if a value attribute is set for "key"
         * then input value is transformed according to the "value" definition
         *
         * @param {OpenLayers.Feature} feature : feature reference
         * @param {String} key : key attribute name
         * @param {String} value : value of the attribute
         */
        getValue: function(feature, key, value) {

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
            if (feature.layer && feature.layer["_M"].layerDescription.hasOwnProperty("featureInfo")) {

                keys = feature.layer["_M"].layerDescription.featureInfo.keys || [];

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
        },
        /*
         * Replace input key into its "human readable" equivalent defined in layerDescription.featureInfo.keys associative array
         *
         * @param {String} key : key to replace
         * @param {OpenLayers.Feature} feature : feature reference
         */
        translate: function(key, feature) {

            var c, k, keys;

            /*
             * Paranoid mode
             */
            if (!feature || !key) {
                return M.Util._(key);
            }

            /*
             * Check if keys array is defined
             * This array has preseance to everything else
             */
            if (feature.layer["_M"].layerDescription.hasOwnProperty("featureInfo")) {

                keys = feature.layer["_M"].layerDescription.featureInfo.keys || [];

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
                        if (keys[k].hasOwnProperty("v")) {
                            return M.Util._(keys[k].v);
                        }

                        break;

                    }
                }

            }

            /*
             * If feature layer got a searchContext then use the connector
             * metadataTranslator array to replace the key
             */
            c = feature.layer["_M"].searchContext;
            if (c && c.connector) {
                return M.Util._(c.connector.metadataTranslator[key] || key);
            }

            /*
             * In any case returns a i18n translated string
             */
            return M.Util._(key);
        },
        /*
         * Return a feature to given mimeType representation
         * 
         * @param {OpenLayers.Feature} feature 
         * @param {Object} format
         *                  {
         *                      mimeType:
         *                      encoding:
         *                      schema:
         *                  }
         */
        toGeo: function(feature, format) {

            format = format || {};

            switch (Map.Util.getGeoType(format["mimeType"])) {
                case 'GML':
                    return Map.Util.GML.featureToGML(feature, format["schema"]);
                    break;
                case 'WKT':
                    return this.toWKT(feature);
                    break;
                default:
                    return null;
            }
        },
        /*
         * Return a WKT representation of feature
         */
        toWKT: function(feature) {
            if (feature && feature.geometry) {
                return M.Map.Util.p2d(feature.geometry.clone()).toString();
            }
            return "";
        },
        /**
         * Zoom on features
         * 
         * @param {Array} features : array of OpenLayers Features
         */
        zoomOn: function(features) {

            if (!$.isArray(features)) {
                features = [features];
            }

            var i, l, bounds = new OpenLayers.Bounds();

            for (i = 0, l = features.length; i < l; i++) {
                bounds.extend(features[i].geometry.getBounds());
            }

            M.Map.zoomTo(bounds);

        }

    };

    /**
     * 
     * Return an OpenLayers.Bounds in EPSG 4326 projection
     *
     * Returned values are strictly between [-180,180] for longitudes
     * and [-90,90] for latitudes
     * 
     * @param {Object} obj : a bbox structure
     *                  {
     *                      bounds: array (i.e. [minx, miny, maxx, maxy]) or string (i.e. "minx, miny, maxx, maxy")
     *                      crs: "EPSG:4326" or "EPSG:3857" (optional)
     *                      srs: "EPSG:4326" or "EPSG:3857" (optional)
     *                  } 
     */
    Map.Util.getGeoBounds = function(obj) {

        /*
         * Paranoid mode
         */
        if (typeof obj !== "object") {
            return null;
        }

        if (!obj.bounds) {
            return null;
        }

        var bounds, coords, coords2 = [], srs = obj.srs, crs = obj.crs || "EPSG:4326";
        
        /*
         * Bounds is an array or a string ?
         */
        if (!$.isArray(obj.bounds)) {
            var coords = obj.bounds.split(',');
            coords[0] = parseFloat(coords[0]);
            coords[1] = parseFloat(coords[1]);
            coords[2] = parseFloat(coords[2]);
            coords[3] = parseFloat(coords[3]);
        }
        else {
            coords = obj.bounds;
        }
        
        /*
         * If srs is specified and srs === EPSG:4326 then
         * order coordinates is lon,lat
         * Otherwise it is lat,lon
         * 
         * Be sure to not be outside -180,-90,180,90
         */
        if (srs === "EPSG:4326") {
            coords2[0] = Math.max(-180, coords[0]);
            coords2[1] = Math.max(-90, coords[1]);
            coords2[2] = Math.min(180, coords[2]);
            coords2[3] = Math.min(90, coords[3]);
            coords = coords2;
        }
        else if (crs === "EPSG:4326") {
            coords2[0] = Math.max(-180, coords[1]);
            coords2[1] = Math.max(-90, coords[0]);
            coords2[2] = Math.min(180, coords[3]);
            coords2[3] = Math.min(90, coords[2]);
            coords = coords2;
        }
        
        bounds = new OpenLayers.Bounds(coords[0], coords[1], coords[2], coords[3]);
        
        /*
         * Returns geo bounds
         */
        return srs === "EPSG:3857" || srs === "EPSG:900913" || crs === "EPSG:3857" || crs === "EPSG:900913" ? M.Map.Util.p2d(bounds) : bounds;
        
    };

    /**
     * 
     * Return an OpenLayers.Bounds in EPSG:3857 projection
     * Add an error at the pole to deal with infinite at the pole in Spherical Mercator
     * 
     * @param {Object} obj : a bbox structure
     *                  {
     *                      bounds: array (i.e. [minx, miny, maxx, maxy]) or string (i.e. "minx, miny, maxx, maxy")
     *                      crs: "EPSG:4326" or "EPSG:3857" (optional)
     *                      srs: "EPSG:4326" or "EPSG:3857" (optional)
     *                  } 
     */
    Map.Util.getProjectedBounds = function(obj) {

        /*
         * Paranoid mode
         */
        if (typeof obj !== "object") {
            return null;
        }

        if (!obj.bounds) {
            return null;
        }

        var avoidBoundError = 0, bounds, coords, srs = obj.srs, crs = obj.crs;
        
        /*
         * Bounds is an array or a string ?
         */
        if (!$.isArray(obj.bounds)) {
            var coords = obj.bounds.split(',');
            coords[0] = parseFloat(coords[0]);
            coords[1] = parseFloat(coords[1]);
            coords[2] = parseFloat(coords[2]);
            coords[3] = parseFloat(coords[3]);
        }
        else {
            coords = obj.bounds;
        }
        
        /*
         * Avoid reprojection error at the pole
         */
        if (srs === "EPSG:4326") {
            
            if (coords[0] === -180 || coords[1] === -90 || coords[2] === 180 || coords[3] === 90) {
                avoidBoundError = 1;
            }

            bounds = Map.Util.d2p(new OpenLayers.Bounds(coords[0] + avoidBoundError, coords[1] + avoidBoundError, coords[2]- avoidBoundError, coords[3] - avoidBoundError));
            
        }
        else if (crs === "EPSG:4326") {
            
            if (coords[0] === -180 || coords[1] === -90 || coords[2] === 180 || coords[3] === 90) {
                avoidBoundError = 1;
            }

            bounds = Map.Util.d2p(new OpenLayers.Bounds(coords[1] + avoidBoundError, coords[0] + avoidBoundError, coords[3] - avoidBoundError, coords[2] - avoidBoundError));
            
        }
        else {
            bounds = new OpenLayers.Bounds(coords[0], coords[1], coords[2], coords[3]);
        }
    
        /*
         * Returns projected bounds
         */
        return bounds;
        
    };

    /**
     * Return geoType from mimeType
     * 
     * @param {String} mimeType
     */
    Map.Util.getGeoType = function(mimeType) {

        if (!mimeType) {
            return null;
        }

        var gmt = [];

        /*
         * List of geometrical mimeTypes
         */
        gmt["text/xml; subtype=gml/3.1.1"] = "GML";
        gmt["application/gml+xml"] = "GML";
        gmt["text/gml"] = "GML";
        gmt["application/geo+json"] = "JSON";
        gmt["application/wkt"] = "WKT";
        gmt["application/x-ogc-wms"] = "WMS";

        return gmt[mimeType.toLowerCase()];

    };

    /**
     * Convert "input" to "format" using "precision"
     *  "input" can be one of the following :
     *    - OpenLayers.Bounds
     *
     *  "format" can be one of the following :
     *    - WKT
     *    - EXTENT
     *    
     *  @param {Object} obj
     */
    Map.Util.convert = function(obj) {
        if (obj && obj.input instanceof OpenLayers.Bounds) {
            var left, bottom, right, top,
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
                return "POLYGON((" + left + " " + bottom + "," + left + " " + top + "," + right + " " + top + "," + right + " " + bottom + "," + left + " " + bottom + "))";
            }
            else if (obj.format === "EXTENT") {
                return left + "," + bottom + "," + right + "," + top;
            }
        }
        return "";
    };

    /**
     * Return control identified by id
     * 
     * @param {String} id
     */
    Map.Util.getControlById = function(id) {
        return Map.map.getControlsBy("id", id)[0];
    };


    /**
     * Return an array of unclusterized features for Point cluster 
     * 
     * @param {OpenLayers.Layer} layer : layer containing clusterizes or unclusterized features
     * @param {Object} options : options for sorting or reprojecting in display projection
     *                 {
     *                      attribute: // name of the attribute to sort
     *                      order: // order of sorting - 'a' (default) for ascending and 'd' for descending
     *                      type: // attribute type - 'd' for date, 'n' for number, 't' for text (default)
     *                      toDisplayProjection: // true to reproject features to display projection
     *                 }
     * @param {boolean} noUncluster : true to not uncluster features array (default is false - i.e. features
     *                                are returned unclusterized)
     */
    Map.Util.getFeatures = function(layer, options, noUncluster) {

        var feature, i, j, l, m, features = [];

        /*
         * Paranoid mode
         */
        options = options || {};

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
                if (feature.cluster && !noUncluster) {

                    /*
                     * Roll over cluster features
                     */
                    for (j = 0, m = feature.cluster.length; j < m; j++) {

                        /*
                         * Set layer to feature
                         */
                        feature.cluster[j].layer = feature.cluster[j].layer || layer;

                        /*
                         * Add a new entry to features array
                         */
                        features.push(options.toDisplayProjection ? feature.cluster[j].clone() : feature.cluster[j]);

                    }
                }
                else {
                    features.push(options.toDisplayProjection ? feature.clone() : feature);
                }
            }
        }

        /*
         * Reproject ?
         */
        if (options.toDisplayProjection) {
            for (i = 0, l = features.length; i < l; i++) {
                if (features.components) {
                    for (j = 0, m = features.components.length; j < m; j++) {
                        M.Map.Util.p2d(features.components[j].geometry);
                    }
                }
                else {
                    M.Map.Util.p2d(features[i].geometry);
                }
            }
        }

        /*
         * Sorting ?
         */
        if (options.attribute) {

            features.sort(function(a, b) {

                var one, two;

                /*
                 * Paranoid mode
                 */
                if (!a.hasOwnProperty("attributes") || !b.hasOwnProperty("attributes")) {
                    return 0;
                }

                /*
                 * Ascending or descending
                 */
                if (options.order === 'd') {
                    one = b.attributes[options.attribute];
                    two = a.attributes[options.attribute];
                }
                else {
                    one = a.attributes[options.attribute];
                    two = b.attributes[options.attribute];
                }

                /*
                 * Number case
                 */
                if (options.type === 'n') {
                    one = parseFloat(one);
                    two = parseFloat(two);
                }
                /*
                 * Text case
                 */
                else if (options.type === 't') {
                    one = one.toLowerCase();
                    two = two.toLowerCase();
                }

                /*
                 * Order
                 */
                if (one < two) {
                    return -1;
                }
                if (one > two) {
                    return 1;
                }
                return 0;
            });
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
    Map.Util.getFormattedLonLat = function(lonlat, format) {

        /*
         * Check format - By default returns degree, minutes, seconds
         */
        if (!format) {
            format = 'dms';
        }

        /*
         * Format 'hms' first display Right Ascension then Declinaison
         */
        if (format.indexOf('h') !== -1) {
            return Map.Util.getFormattedCoordinate(lonlat.lon, "lon", format) + "&nbsp;::&nbsp;" + Map.Util.getFormattedCoordinate(lonlat.lat, "lat", format);
        }
        /*
         * Classical 'dms' first display Latitude then Longitude
         */
        else {
            return Map.Util.getFormattedCoordinate(lonlat.lat, "lat", format) + "&nbsp;::&nbsp;" + Map.Util.getFormattedCoordinate(lonlat.lon, "lon", format);
        }

    };

    /**
     *
     * This function will return latitude or longitude value formatted
     * It is inspired by the OpenLayers.Util.getFormattedLonLat function
     *
     * @param {Float} coordinate - the coordinate value to be formatted
     * @param {String} axis - value of either 'lat' or 'lon' to indicate which axis is to
     *                        to be formatted (default = lat)
     * @param {String} format - specify the precision of the output can be one of:
     *                          'dms' show degrees minutes and seconds (default)
     *                          'hms' show hour minutes second
     *                          'dm' show only degrees and minutes
     *                          'd' show only degrees
     * 
     * Returns:
     *      {String} the coordinate value formatted as a string
     */
    Map.Util.getFormattedCoordinate = function(coordinate, axis, format) {

        var result, degreesOrHours, minutes, seconds, tmp, nsew,
                sign = "",
                degreesOrHoursUnit = "\u00B0";

        /*
         * Check format - By default returns degree, minutes, seconds
         */
        if (!format) {
            format = 'dms';
        }

        /*
         * Normalize coordinate for longitude values between [-180,180] degrees for longitude and [-90,90] for latitudes
         */
        if (axis === "lon") {
            coordinate = (coordinate + 540) % 360 - 180;
            nsew = coordinate < 0 ? "W" : "E";
        }
        else {
            coordinate = (coordinate + 270) % 180 - 90;
            nsew = coordinate < 0 ? "S" : "N";
        }

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
                coordinate = 24 * ((360 - coordinate) % 360) / 360.0;
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
        /* Bitwise operator is faster than Map.floor */
        degreesOrHours = coordinate | 0;
        minutes = (coordinate - degreesOrHours) / (1 / 60);
        tmp = minutes;
        /* Bitwise operator is faster than Map.floor */
        minutes = minutes | 0;
        seconds = Math.round((tmp - minutes) / (1 / 60) * 10) / 10;
        if (seconds >= 60) {
            seconds -= 60;
            minutes += 1;
            if (minutes >= 60) {
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
     * MID is an unique identifier used to identify
     * unambiguisly a specific layer
     * 
     * @param {String} MID
     */
    Map.Util.getLayerByMID = function(MID) {
        if (!MID || MID === "") {
            return null;
        }
        for (var j = 0, l = Map.map.layers.length; j < l; j++) {
            var layer = Map.map.layers[j];
            /*
             * We use '==' instead of '===' in case that input MID is a string
             * and not a numeric
             */
            if (layer["_M"] && (layer["_M"].MID === MID)) {
                return layer;
            }
        }
        return null;
    };


    /**
     * Return true if the layer is a raster layer
     * A raster layer is one of the following :
     *     - Image
     *     - MBT
     *     - SHP
     *     - TMS
     *     - WMS
     *     - WMTS
     *     - XYZ
     *  
     *  @param {OpenLayers.Layer} layer
     */
    Map.Util.isRaster = function(layer) {

        var i, l, b = false, rasters = ["Image", "MBT", "SHP", "TMS", "WMS", "WMTS", "XYZ"];

        if (!layer || !layer['_M']) {
            return b;
        }

        /* 
         * Rasters layers are processed differently from vector layers.
         * A vector layer got its own individual tab.
         * All raster layers are displayed within a single "rasters" tab 
         */
        for (i = 0, l = rasters.length; i < l; i++) {
            if (rasters[i] === layer['_M']['layerDescription'].type) {
                b = true;
                break;
            }
        }

        return b;
    };


    /**
     * Return true if the layer is empty
     * 
     * @param {OpenLayers.Layer} layer
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
        for (i = length; i--; ) {
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
        return obj.transform(Map.pc, Map.map.projection);
    };

    /*
     * Transform input object from map projection to display projection (epsg4326)
     */
    Map.Util.p2d = function(obj) {
        return obj.transform(Map.map.projection, Map.pc);
    };

    /**
     * Set "layer" on top of other layers
     * (see LayerIndex in OpenLayers)
     * 
     * @param {OpenLayers.Layer} layer
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
     * Switch the layer visibility
     * 
     * @param {String} MID
     */
    Map.Util.switchVisibility = function(MID) {
        var l = Map.Util.getLayerByMID(MID);
        if (l) {
            Map.Util.setVisibility(l, !l.getVisibility());
        }
    };

    /**
     * Reindex layer to ensure that :
     *  - vectors layers are always on top of raster layers
     *  - Point and/or Line vector layers are always
     *    on top Polygonal vector layers
     *    
     * @param {OpenLayers.Layer} layer
     */
    Map.Util.updateIndex = function(layer) {

        var i, tmpLayer,
                index = Map.map.getLayerIndex(layer), //Set index to the layer index
                l = Map.map.layers.length;

        /*
         * Do not process raster layers
         */
        if (!layer || !layer.features) {
            return false;
        }

        /*
         * Roll over layers list from the higher element
         * and retrieve it
         */
        for (i = l; i--; ) {

            tmpLayer = Map.map.layers[i];

            /*
             * Do not process input layer
             */
            if (layer.id === tmpLayer.id) {
                continue;
            }

            /*
             * layer is a vector and have at least one feature with a non null geometry
             */
            if (layer.features[0] && layer.features[0].geometry) {

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
            Map.map.setLayerIndex(layer, index + 1);

        }

        return true;

    };

    /*
     * Center the map on the layer extent.
     * This centering is only done if the layer, or part of the added layer,
     * is not already visible in the map view
     *
     * Note : if the layer has already been loaded then the _M.initialized attribute
     * is set to true and the map is not centered any more on this layer even if
     * its content changes
     */
    Map.Util.zoomOn = function(layer) {

        var extent;

        /*
         * Paranoid mode
         */
        if (!layer || !layer["_M"]) {
            return false;
        }

        /*
         * Only zoom on layer that are initialized
         */
        if (layer["_M"].initialized) {

            /*
             * Vector layers have a getDataExtent() function that returns bounds
             * Raster layer such as WMS or Image should have a ["_M"].bounds property
             * set during initialization
             */
            extent = layer.getDataExtent() || layer["_M"].bounds;
            if (extent) {

                /*
                 * Centering is done only if the entire layer or part of the layer
                 * is not visible within the map view
                 */
                if (!M.Map.map.getExtent().intersectsBounds(extent, true)) {
                    M.Map.zoomTo(extent);
                    return true;
                }

            }
        }

        return false;

    };

    /**
     * Return a GeoJSON geometry string from a GML posList
     * 
     * @param {String} posList : a GML posList (or a GML pos) i.e. a string
     *                           containing x y coordinqtes separated by white spaces
     *                           (i.e. x1 y1 x2 y2 x3 y3 ..., x* y* being double)
     */
    Map.Util.posListToGeoJsonGeometry = function(posList) {

        var pairs = [], i, l, coordinates, latlon = false;

        /*
         * Paranoid mode
         */
        if (posList) {

            coordinates = posList.split(" ");

            /*
             * Parse each coordinates
             */
            for (i = 0, l = coordinates.length; i < l; i = i + 2) {

                /*
                 * Case 1 : coordinates order is latitude then longitude
                 */
                if (latlon) {
                    pairs.push('[' + coordinates[i + 1] + ',' + coordinates[i] + ']');
                }
                /*
                 * Case 2 : coordinates order is longitude then latitude
                 */
                else {
                    pairs.push('[' + coordinates[i] + ',' + coordinates[i + 1] + ']');
                }
            }

        }

        return pairs.join(',');

    };


})(window.M, window.M.Map);