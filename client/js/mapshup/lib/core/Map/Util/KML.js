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
 * Define Map util functions
 */
(function(msp, Map) {
    
    Map.Util = Map.Util || {};
    
    /*
     * Initialize Map.Util
     */
    Map.Util.KML = {
        
        /*
         * Return a KML string from an OpenLayers layer
         *
         * @input {OpenLayers.Layer} layer : OpenLayers layer
         * @input {Object} options : options for color/opacity
         *
         * @return {String} a kml representation of the input layer
         */
        layerToKML: function(layer, options) {

            /*
             * Paranoid mode
             */
            if (!layer) {
                return false;
            }

            /*
             * KML layers are already in kml !
             */
            if (layer["_msp"] && layer["_msp"].kml) {
                return layer["_msp"].kml;
            }

            options = options || {};

            /*
             * Open kmlString
             */
            var kmlString = '',
                i,
                l;

            /*
             * Case 1 : Image layers
             */
            if (layer.CLASS_NAME === "OpenLayers.Layer.Image") {
                kmlString += this.imageToKML(layer);
            }

            /*
             * Case 2 : WMS layers
             */
            else if (layer.CLASS_NAME === "OpenLayers.Layer.WMS" && options.synchronizeWMS) {
                kmlString += this.wmsToKML(layer);
            }
            /*
             * Case 3 : Vector layers
             */
            else if (layer.CLASS_NAME === "OpenLayers.Layer.Vector") {

                var feature,
                    features = [];

                /*
                 * Roll over layer features
                 */
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
                        for (var j = 0, m = feature.cluster.length; j < m; j++) {

                            /*
                             * Add feature to features array
                             */
                            if (feature.cluster[j].geometry) {
                                features.push(feature.cluster[j]);
                            }

                        }
                    }
                    else {

                        /*
                         * Add feature to features array
                         */
                        if (feature.geometry) {
                            features.push(feature);
                        }

                    }
                }

                /*
                 * Generate KML only for non empty layer
                 */
                if (features.length > 0) {

                    /*
                     * Set style if 'options.styleUrl' is specified
                     */
                    if (options.color) {

                        kmlString += ''
                        + '<Style id="normalState">'
                        + '<IconStyle>'
                        + '<scale>1.1</scale>'
                        + '<Icon><href>'+msp.Util.getImgUrl('ylw-pushpin.png')+'</href></Icon>'
                        + '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>'
                        + '</IconStyle>'
                        + '<PolyStyle>'
                        + '<color>' + this.color2KML(options.color, options.opacity) + '</color>'
                        + '</PolyStyle>'
                        + '</Style>';
                    }

                    /*
                     * Get KML representation for each feature
                     */
                    for (i = 0, l = features.length; i < l; i++) {
                        kmlString += this.featureToKML(features[i], options);
                    }
                }
            }

            /*
             * Parse kmlString
             */
            if (kmlString !== ''){
                kmlString = '<?xml version="1.0" encoding="UTF-8"?>'
                + '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:kml="http://www.opengis.net/kml/2.2">'
                + '<Document>'
                + '<name>'+this.encode(msp.Util._(layer.name))+'</name>'
                + '<description></description>'
                + kmlString
                + '</Document></kml>';
            }

            return kmlString;

        },

        /**
         * Return a KML string from feature
         * Structure :
         *
         *  feature.geometry // geometry object
         *  feature.geometry.CLASS_NAME // geometry type
         *      - OpenLayers.Geometry.Point
         *      - OpenLayers.Geometry.LineString
         *      - OpenLayers.Geometry.Polygon
         *  feature.geometry.components[] // array of points
         *      feature.geometry.components[].x
         *      feature.geometry.components[].y
         *
         *  Note : if feature has an "ele" attribute, this attribute
         *  is assumed to be an elevation value in meters. This value is added
         *  to the geometry (see GPX format)
         *
         * @input {OpenLayers.Feature} feature : a feature in map coordinates
         * @input {Object} options : options for color/opacity
         * 
         * @return {String} a KML Placemark
         */
        featureToKML: function(feature, options) {

            var attribute,
                name,
                point,
                value,
                kml = '',
                description = '',
                i,
                l;

            options = options || {};

            /*
             * Roll over each component. A component contain
             * a point in (x,y) map coordinates.
             * Each point is transformed in lat/lon for KML
             */
            if (feature && feature.geometry) {

                /*
                 * Initialize altitude to null
                 */
                var elevation = null,
                    gt = feature.geometry.CLASS_NAME;

                /*
                 * Get name and description
                 */
                for(attribute in feature.attributes) {
                    
                    /*
                     * Name is easy to find :)
                     */
                    if (attribute === "name") {
                        name = feature.attributes[attribute];
                    }
                    /*
                     * Description too :)
                     */
                    else if (attribute === "description") {
                        description += feature.attributes[attribute] + '<br/>';
                    }
                    /*
                     * Add each attribute to the description
                     */
                    else {

                        value = feature.attributes[attribute];

                        /*
                         * The tricky part :
                         * If value begins by http, then it's a link
                         */
                        if (typeof value === "string" && msp.Util.isUrl(value)) {
                            if (attribute === "thumbnail") {
                                description += '<img src="'+value+'" class="center" width="250"/><br/>';
                            }
                            else {
                                description += '<a target="_blank" href="'+value+'">'+attribute+'</a><br/>';
                            }
                        }
                        else {
                            description += attribute + ' : ' + value + '<br/>';
                        }
                    }

                    /*
                     * Get elevation in meters (but be sure that this is at least a number!)
                     */
                    if (attribute === "ele") {
                        elevation = feature.attributes[attribute];
                        if (!$.isNumeric(elevation)) {
                            elevation = null;
                        }
                    }
                }

                /*
                 * If name is not defined in attributes,
                 * set it to the feature id
                 */
                if (name === undefined || name === ''){
                    name = feature.id;
                }

                /*
                 * Set attribute string
                 *
                 * Note : description is encapsulated into a <table></table> tag to
                 * force the balloon width
                 *
                 */
                attribute = '<name><![CDATA['+name+']]></name><description><![CDATA[<table border="0" cellpadding="0" cellspacing="0" width="300" align="left"><tr><td>'+description+'</td></tr></table>]]></description>';
                
                /*
                 * Initialize kml string based on the feature
                 * geometry class
                 */
                if (gt === "OpenLayers.Geometry.Point") {
                    point = msp.Map.Util.p2d(new OpenLayers.LonLat(feature.geometry.x,feature.geometry.y));
                    kml = '<Point><coordinates>'+point.lon + ',' + point.lat + (elevation ? ',' + elevation : '') + '</coordinates></Point>';
                }
                else if (gt === "OpenLayers.Geometry.MultiPoint") {

                    /*
                     * MultiPoint geometry get a "components" array of points
                     */
                    if (feature.geometry.components) {
                        for (i = 0, l = feature.geometry.components.length; i < l; i++) {
                            point = feature.geometry.components[i];
                            point = msp.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
                            kml += '<Point><coordinates>'+point.lon + ',' + point.lat + (elevation ? ',' + elevation : '') + '</coordinates></Point>';
                        }
                    }

                }
                else if (gt === "OpenLayers.Geometry.LineString") {

                    /*
                     * LineString geometry get a "components" array of points
                     */
                    if (feature.geometry.components) {
                        for (i = 0, l = feature.geometry.components.length; i < l; i++) {
                            point = feature.geometry.components[i];
                            point = msp.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
                            kml += point.lon + ',' + point.lat + (elevation ? ',' + elevation : '') + ' ';
                        }
                    }

                    /*
                     * Remove trailing white space
                     */
                    kml = '<LineString><coordinates>'+kml.substring(0, kml.length-1)+'</coordinates></LineString>';

                }
                else if (gt === "OpenLayers.Geometry.Polygon") {

                    var j, k, component;

                    /*
                     * Polygon geometry get a "components" array of "components"
                     */
                    if (feature.geometry.components) {
                        for (i = 0, l = feature.geometry.components.length; i < l; i++) {
                            component = feature.geometry.components[i];
                            for (j = 0, k = component.components.length; j < k; j++){
                                point = component.components[j];
                                point = msp.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
                                kml += point.lon + ',' + point.lat + (elevation ? ',' + elevation : '') + ' ';
                            }
                        }
                    }

                    /*
                     * Remove trailing white space
                     */
                    kml = '<Polygon><outerBoundaryIs><LinearRing><coordinates>'+kml.substring(0, kml.length-1)+'</coordinates></LinearRing></outerBoundaryIs></Polygon>';
                }

            }

            /*
             * Return kml Placemark
             * Note that the last character (space) of the kml string is removed
             *
             * ?ote : if "options.styleUrl" is specified, no style is computed
             */
            if (kml !== '') {
                return '<Placemark>'
                + attribute
                + (options.color ? '<styleUrl>#normalState</styleUrl>' : this.featureToKMLStyle(feature))
                + kml
                + '</Placemark>';
            }

            return kml;
        },

        /**
         * Return a KML <Style>...</Style> string from feature
         *
         * @input {OpenLayers.Feature} feature : a feature in map coordinates
         * 
         * @return {String} a KML <Style>...</Style> string
         */
        featureToKMLStyle: function(feature) {

            /*
             * Empty style is the default
             */
            var kmlStyle = '',
                style,
                defaultStyle,
                gt;

            /*
             * Paranoid mode
             */
            if (feature && feature.layer) {

                /*
                 * feature.geometry.CLASS_NAME
                 */
                gt = feature.geometry.CLASS_NAME;

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

                /*
                 * Style for OpenLayers.Geometry.Point
                 */
                if (gt === "OpenLayers.Geometry.Point") {

                    /*
                     * Case one => external graphic
                     */
                    if (defaultStyle.externalGraphic) {
                        kmlStyle = this.resolveStyleAttribute(feature, style, defaultStyle.externalGraphic);
                    }
                    /*
                     * Default google pushpin
                     */
                    else {
                        kmlStyle = msp.Util.getImgUrl("ylw-pushpin.png");
                    }

                    /*
                     * Style for OpenLayers.Geometry.Point
                     */
                    if (kmlStyle.substr(0,5) !== 'http:' && kmlStyle.substr(0,1) !== '/') {
                        kmlStyle = msp.Config.general.rootUrl + '/' + kmlStyle;
                    }
                    kmlStyle = '<Style><IconStyle><Icon><href>'+this.encode(msp.Util.getAbsoluteUrl(kmlStyle))+'</href></Icon></IconStyle></Style>';
                }

                /*
                 * Style for OpenLayers.Geometry.LineString
                 */
                else if (gt === "OpenLayers.Geometry.LineString") {

                    /*
                     * Color should be express as a #RGB hexadecimal value
                     */
                    kmlStyle = '<LineStyle><color>'+this.color2KML(this.resolveStyleAttribute(feature, style, defaultStyle.strokeColor), 1)+'</color><width>'+(defaultStyle.strokeWidth || 1)+'</width></LineStyle>';

                }

                /*
                 * Style for OpenLayers.Geometry.Polygon
                 */
                else if (gt === "OpenLayers.Geometry.Polygon") {

                    /*
                     * Color should be express as a #RGB hexadecimal value
                     */
                    kmlStyle = '<Style><PolyStyle><color>'+this.color2KML(this.resolveStyleAttribute(feature, style, defaultStyle.fillColor),  defaultStyle.fillOpacity)+'</color></PolyStyle></Style>';

                }
            }

            return kmlStyle;
        },

        /**
         * Return the resolved style value
         */
        resolveStyleAttribute: function(feature, style, value) {

            var str = value,
                pointer;

            /*
             * "value" can be an url to an imageor an OpenLayers pointer.
             * In the second case, the pointer ${...} can be
             * an attribute of the feature or a function in the
             * context object
             */
            if (value.indexOf("${") !== -1) {

                /*
                 * Get pointer
                 */
                pointer = value.substring(2, value.length-1);

                /*
                 * Pointer is a function
                 */
                if (style.context && $.isFunction(style.context[pointer])) {
                    str = style.context[pointer](feature);
                }
                /*
                 * Pointer is an attribute
                 */
                else {
                    str = feature.attributes[pointer];
                }
            }

            return str;

        },

        /**
         * Take an hexadecimal HTML color (i.e. #RRGGBB)
         * and convert it into Hexadecimal KML color scheme i.e. AABBGGRR
         *
         * @input {String} color : an HTML color #RRGGBB
         * @input {float} opacity : opacity (0 to 1)
         */
        color2KML: function(color, opacity) {

            /*
             * Default opacity is 40%
             */
            opacity = opacity || 0.4;
            opacity = Math.round(opacity * 16).toString(16);

            /*
             * First remove the # character
             */
            color = color ? color.replace(/#/, "").toLowerCase() : "ee9900";

            /*
             * Split color RRGGBB into an array [RR,GG,BB]
             * and recompose it into BBGGRR
             */
            return opacity+opacity+color.substring(4,6)+color.substring(2,4)+color.substring(0,2);
        },

        /**
         * Return a KML string  ("GroundOverlay") from an OpenLayers Image
         * Structure :
         *
         *  feature.geometry // geometry object
         *  feature.geometry.CLASS_NAME // geometry type
         *      - OpenLayers.Geometry.Point
         *      - OpenLayers.Geometry.LineString
         *      - OpenLayers.Geometry.Polygon
         *  feature.geometry.components[] // array of points
         *      feature.geometry.components[].x
         *      feature.geometry.components[].y
         *
         * @input {OpenLayers.Feature} feature : a feature in map coordinates
         * @return {String} a KML Placemark
         */
        imageToKML: function(layer) {

            /*
             * Compute epsg:4326 extent
             */
            var geoBounds = layer["_msp"] && layer["_msp"].bounds ? msp.Map.Util.p2d(layer["_msp"].bounds.clone()) : msp.Map.Util.p2d(layer.bounds.clone());

            if (layer.url) {
                return '<GroundOverlay>'
                + '<name>'+this.encode(msp.Util._(layer.name))+'</name>'
                + '<description></description>'
                + '<drawOrder>0</drawOrder>'
                + '<Icon>'
                + '<href>'+this.encode(layer.url)+'</href>'
                + '</Icon>'
                + '<LatLonBox>'
                + '<north>'+geoBounds.top+'</north>'
                + '<south>'+geoBounds.bottom+'</south>'
                + '<east>'+geoBounds.left+'</east>'
                + '<west>'+geoBounds.right+'</west>'
                + '<rotation>0</rotation>'
                + '</LatLonBox>'
                + '</GroundOverlay>';
            }

            return '';
        },

        /**
         * Return a KML string  ("GroundOverlay") from an OpenLayers WMS layer
         * Structure :
         *
         *  feature.geometry // geometry object
         *  feature.geometry.CLASS_NAME // geometry type
         *      - OpenLayers.Geometry.Point
         *      - OpenLayers.Geometry.LineString
         *      - OpenLayers.Geometry.Polygon
         *  feature.geometry.components[] // array of points
         *      feature.geometry.components[].x
         *      feature.geometry.components[].y
         *
         * @input {OpenLayers.Feature} feature : a feature in map coordinates
         * @return {String} a KML Placemark
         */
        wmsToKML: function(layer) {

            /*
             * Compute epsg:4326 extent of the map
             */
            var geoBounds = Map.Util.p2d(Map.map.getExtent()),
                version = layer["_msp"].layerDescription.version || "1.1.0",
                projstr = version === "1.3.0" ? "&CRS=EPSG:4326&BBOX="+geoBounds.bottom+","+geoBounds.left+","+geoBounds.top+","+geoBounds.right : "&SRS=EPSG:4326&BBOX="+geoBounds.left+","+geoBounds.bottom+","+geoBounds.right+","+geoBounds.top,
                WMSUrl = layer.url
                +"WIDTH=512&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true&SERVICE=WMS&REQUEST=GetMap&LAYERS="
                +layer["_msp"].layerDescription.layers
                +"&VERSION="+version
                +projstr;

            if (layer.url) {
                return '<GroundOverlay>'
                + '<name>'+this.encode(msp.Util._(layer.name))+'</name>'
                + '<description></description>'
                + '<drawOrder>0</drawOrder>'
                + '<Icon>'
                + '<href>'+this.encode(WMSUrl)+'</href>'
                + '</Icon>'
                + '<LatLonBox>'
                + '<north>'+geoBounds.top+'</north>'
                + '<south>'+geoBounds.bottom+'</south>'
                + '<east>'+geoBounds.left+'</east>'
                + '<west>'+geoBounds.right+'</west>'
                + '<rotation>0</rotation>'
                + '</LatLonBox>'
                + '</GroundOverlay>';
            }

            return '';
        },
        
        /*
         * Replace & by &amp; from input string
         */
        encode:function(s) {
            return s.replace(/\&/g,'&amp;');
        }
        
    }
    
})(window.msp, window.msp.Map);

