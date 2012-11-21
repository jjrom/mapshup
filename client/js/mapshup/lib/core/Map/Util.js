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
     * Feature functions
     */
    Map.Util.Feature = {
        
        /**
         *
         * Return feature icon url
         * 
         * Icon is assumed to be a square image of 75x75 px displayed within NorthPanel
         *
         * @input {OpenLayers.Feature} feature : input feature
         *
         */
        getIcon:function(feature) {
            
            var style,defaultStyle,icon;
            
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
             *    - feature style externalGraphic
             *    - generic image 
             * 
             */
            if (feature.attributes.icon) {
                return feature.attributes.icon;
            }
            if (feature.attributes.thumbnail) {
                return feature.attributes.thumbnail;
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
            
            return icon;
        },
        
        /**
         * Return feature title if it's defined within layerDescription.featureInfo.title property
         *
         * @input {OpenLayers.Feature} feature : input feature
         */
        getTitle:function(feature) {

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
                return msp.Util._(feature.layer.name) + ": " + feature.cluster.length + " " + msp.Util._("entities");
            }

            /*
             * User can define is own title with layerDescription.featureInfo.title property
             */
            if (feature.layer && feature.layer["_msp"].layerDescription.featureInfo && feature.layer["_msp"].layerDescription.featureInfo.title) {
                
                /*
                 * The tricky part :
                 * 
                 * Parse title and replace keys between brackets {} with the corresponding value
                 * eventually transformed with the getValue() function
                 *
                 * Example :
                 *      title = "Hello my name is {name} {surname}"
                 *      feature.attributes = {name:"Jerome", surname:"Gasperi"}
                 *
                 *      will return "Hello my name is Jerome Gasperi"
                 * 
                 */
                return feature.layer["_msp"].layerDescription.featureInfo.title.replace(/{+([^}])+}/g, function(m,key,value) {
                    var k = m.replace(/[{}]/g, '');
                    return Map.Util.Feature.getValue(feature, k, feature.attributes[k]);
                });
                
            }

            /*
             * Otherwise returns name or title or identifier or id
             */
            for (k in {
                name:1, 
                title:1, 
                identifier:1
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
         * @input {OpenLayers.Feature} feature : feature reference
         * @input {String} key : key attribute name
         * @input {String} value : value of the attribute
         */
        getValue:function(feature, key, value) {

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
            if (feature.layer && feature.layer["_msp"].layerDescription.hasOwnProperty("featureInfo")) {
                
                keys = feature.layer["_msp"].layerDescription.featureInfo.keys || [];

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
        
        /**
         * Set info popup html content
         * 
         *  ___________________________
         * |          .title           | .header
         * |___________________________|
         * |___________________________| .tabs
         * |  ________                 |
         * | |        | |              | .body
         * | |        | |   .info      |
         * | | .thumb | |              |
         * | |        | |              |
         * | |________| |              |
         * |  .actions  |              |
         * |___________________________|
         * 
         * 
         * @input feature : the feature to display
         * @input $target : target jquery object to append feature info
         *                 
         */
        toHTML:function(feature, $target) {
            
            /*
             * Paranoid mode
             */
            if (!feature || !$target || $target.length === 0) {
                return false;
            }
            
            var id,
            d,v,t,i,l,k,kk,kkk,ts,
            $info,
            $tabs,
            $thumb,
            layerType,
            typeIsUnknown = true,
            title = msp.Util.stripTags(Map.Util.Feature.getTitle(feature)),
            thumb = feature.attributes['thumbnail'] || feature.attributes['quicklook'] || Map.Util.Feature.getIcon(feature) || msp.Util.getImgUrl('nodata.png'); // Thumbnail of quicklook attributes
                

            /*
             * Initialize $target content
             * 
             * <div class="header">
             *      <div class="title"></div>
             * </div>
             * <div class="tabs"></div>
             * <div class="body">
             *      <div class="thumb"></div>
             *      <div class="info"></div>
             * </div>
             * 
             */
            $target.html('<div class="header"><div class="title"></div></div><div class="tabs"></div><div class="west"><div class="thumb"></div><div class="actions"></div></div><div class="east"><div id="_fitm"><div class="info"></div></div></div>');
            
            /*
             * Set header
             */
            $('.title', $target).attr('title', feature.layer.name + ' | ' + title).html(title);      
             
            /*
             * Set body and tabs reference
             */
            $tabs = $('.tabs', $target);
            
            /*
             * Set thumbnail
             * 
             */
            $thumb = $('.thumb', $target);

            /*
             * Display quicklook on popup if defined
             */
            if (feature.attributes.hasOwnProperty('quicklook')) {

                id = msp.Util.getId();
                $thumb.html('<a id="'+id+'" class="image" jtitle="'+title+'" title="'+msp.Util._("Show quicklook")+'" href="'+feature.attributes['quicklook']+'"><img src="'+thumb+'"/></a>');

                /*
                 * Popup image
                 */
                $('#'+id).click(function() {
                    var $t = $(this);
                    msp.Util.showPopupImage($t.attr('href'), $t.attr('jtitle'));
                    return false;
                });

            }
            /*
             * No quicklook, only display thumbnail
             * Note : add a "dftthb" class to tell mapshup that the thumbnail
             * was added by mapshup and not by reading metadata
             */
            else {
                $thumb.html('<img class="dftthb" src="'+thumb+'"/>');
            }

            /*
             * Add an action on "Add Quicklook to map" link
             * This action is added only if layer allow to display Quicklook on the map
             */
            if (feature.layer["_msp"].qlToMap) {
                id = msp.Util.getId()
                $thumb.append('<br/><a href="#" class="center" id="'+id+'">'+msp.Util._('Add quicklook to map')+'</a>');
                $('#'+id).click(function() {
                    msp.Map.addLayer({
                        type:"Image",
                        title:feature.attributes['identifier'],
                        url:feature.attributes['quicklook'],
                        bbox:feature.geometry.getBounds().toBBOX(),
                        /* By default, quicklooks are added to the "Quicklooks" group */
                        groupName:"Quicklooks"
                    });
                });
            }
            
            /*
             * Roll over layer types to detect layer features that should be
             * displayed using a dedicated setFeatureInfoBody function
             */
            if ((layerType = msp.Map.layerTypes[feature.layer["_msp"].layerDescription["type"]])) {
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
                $('.info', $target).html('<table></table>');
                $info = $('.info table', $target);
                
                /*
                 * Roll over attributes  
                 */   
                for (k in feature.attributes) {

                    /*
                     * Special keywords
                     */
                    if (k === 'identifier' || k === 'icon' || k === 'thumbnail' || k === 'quicklook') {
                        continue;
                    }

                    /*
                     * Get key value
                     */
                    if((v = feature.attributes[k])) {

                        /*
                         * Check type
                         */
                        t = typeof v;

                        /*
                         * Simple case : string
                         */
                        if (t === "string" && msp.Util.isUrl(v)) {
                            $info.append('<tr><td>' + Map.Util.Feature.translate(k, feature) + '</td><td>&nbsp;</td><td><a target="_blank" title="'+v+'" href="'+v+'">'+ msp.Util._("Download") +'</a></td></tr>');
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
                                     * is displayed
                                     */
                                    if (kk === 'photo') {
                                        for (i = 0, l = v[kk].length; i < l; i++) {
                                            id = msp.Util.getId();
                                            /* Remove default thumbnail if any */
                                            $('.dftthb', $thumb).remove();
                                            $thumb.append('<a href="'+v[kk][i]["url"]+'" title="'+v[kk][i]["name"]+'" id="'+id+'" class="image"><img height="50px" width="50px" src="'+v[kk][i]["url"]+'"/></a>');
                                            /*
                                             * Popup image
                                             */
                                            (function($id){
                                                $id.click(function() {
                                                    msp.Util.showPopupImage($id.attr('href'), $id.attr('title'));
                                                    return false;
                                                });    
                                            })($('#'+id));
                                            
                                        }
                                        continue;
                                    }

                                    /*
                                     * Initialize tab
                                     */
                                    if ($tabs.is(':empty')) {
                                        $tabs.html('<div id="_fit"><ul><li><a href="#_fitm" class="selected">'+msp.Util._("Description")+'</a></li></ul></div>');
                                    }
                                    
                                    /*
                                     * If v[kk] is not an array or is an empty array, go to the next property
                                     */
                                    if (typeof v[kk].length !== "number" || v[kk].length === 0) {
                                        continue;
                                    }
                                    
                                    /*
                                     * If kk object is a non empty array, add a new tab
                                     */
                                    id = msp.Util.getId() ;
                                    $('ul', $tabs).append('<li><a href="#' + id + '">' + msp.Util._(kk) + '</a></li>');
                                    $('.east', $target).append('<div id="'+id+'" class="noflw"><table></table></div>');

                                    /*
                                     * Table reference
                                     */
                                    d = $('table', $('#'+id));

                                    /*
                                     * Special case for videos
                                     */
                                    if (kk === "video" || kk === "audio") {
                                        for (i = 0, l = v[kk].length; i < l; i++) {
                                            
                                            /*
                                             * Popup video
                                             */
                                            id = msp.Util.getId();
                                            
                                            d.append('<tr><td><a id="'+id+'" href="'+v[kk][i]["url"]+'">' + v[kk][i]["name"] + '</a></td></tr>');
                                            
                                            
                                            (function($id){
                                                $id.click(function() {
                                                    msp.Util.showPopupVideo({
                                                        url:$id.attr('href'), 
                                                        title:$id.attr('title')
                                                    });
                                                    return false;
                                                });    
                                            })($('#'+id));
                                            
                                        }
                                    }
                                    else {
                                        for (kkk in v[kk]) {
                                            ts = Map.Util.Feature.translate(kkk, feature);
                                            d.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + '</td><td>&nbsp;</td><td>' + v[kk][kkk] + '</td></tr>');
                                        }
                                    }

                                }
                                else {
                                    ts = Map.Util.Feature.translate(k, feature);
                                    $info.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + ' &rarr; ' + Map.Util.Feature.translate(kk, feature) + '</td><td>&nbsp;</td><td>' + v[kk] + '</td></tr>');
                                }
                            }

                        }
                        else {
                            ts = Map.Util.Feature.translate(k, feature);
                            $info.append('<tr><td title="'+ts+'">' + msp.Util.shorten(ts, 15, true) + '</td><td>&nbsp;</td><td>' + Map.Util.Feature.getValue(feature,k,v) + '</td></tr>');
                        }
                    }
                }

                /*
                 * Set the tabs if any
                 */
                $("#_fit ul").idTabs();
                
            }
            
            //$tabs.is(':empty') ? $tabs.hide() : $tabs.show();

            return true;
            
        },

        /*
         * Replace input key into its "human readable" equivalent defined in layerDescription.featureInfo.keys associative array
         *
         * @input {String} key : key to replace
         * @input {OpenLayers.Feature} feature : feature reference
         */
        translate:function(key, feature) {

            var c, k, keys;
            
            /*
             * Paranoid mode
             */
            if (!feature || !key) {
                return msp.Util._(key);
            }

            /*
             * Check if keys array is defined
             * This array has preseance to everything else
             */
            if (feature.layer["_msp"].layerDescription.hasOwnProperty("featureInfo")) {
                
                keys = feature.layer["_msp"].layerDescription.featureInfo.keys || [];
                
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
                        if (keys[k].hasOwnProperty("v")){
                            return msp.Util._(keys[k].v);
                        }
                        
                        break;
                        
                    }
                }
                
            }
            
            /*
             * If feature layer got a searchContext then use the connector
             * metadataTranslator array to replace the key
             */
            c = feature.layer["_msp"].searchContext;
            if (c && c.connector) {
                return msp.Util._(c.connector.metadataTranslator[key] || key);
            }

            /*
             * In any case returns a i18n translated string
             */
            return msp.Util._(key);
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
            
            switch(Map.Util.getGeoType(format["mimeType"])) {
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
                return msp.Map.Util.p2d(feature.geometry.clone()).toString();
            }
            return "";
        }
        
    };
    
    /**
    * Return geoType from mimeType
    */
    Map.Util.getGeoType = function(mimeType) {
           
        if (!mimeType) {
            return null;
        }
        
        var gmt = [];
        
        /*
         * List of geometrical mimeTypes
         */
        gmt["text/xml; subtype=gml/3.1.1"]="GML";
        gmt["application/gml+xml"]="GML";
        gmt["text/gml"]="GML";
        gmt["application/geo+json"]="JSON";
        gmt["application/wkt"]="WKT";
            
        return gmt[mimeType];
          
    };
        
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
     * Return an array of unclusterized features
     * 
     * @input layer : layer containing clusterizes or unclusterized features
     * @input options: options for sorting 
     *                 {
     *                      attribute: // name of the attribute to sort
     *                      order: // order of sorting - 'a' (default) for ascending and 'd' for descending
     *                      type: // attribute type - 'd' for date, 'n' for number, 't' for text (default)
     *                 }
     * 
     */
    Map.Util.getFeatures = function(layer, options) {

        var feature,i,j,l,m,features = [];
        
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
                if (feature.cluster) {

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
                        features.push(feature.cluster[j]);
                       
                    }
                }
                else {
                    features.push(feature);
                }
            }
        }
        
        /*
         * Sorting ?
         */
        if (options.attribute) {
            
            features.sort(function(a,b){
                
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
                    return -1
                }
                if (one > two) {
                    return 1
                }
                return 0
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
    Map.Util.getFormattedLonLat = function(lonlat,format) {
        
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
            return Map.Util.getFormattedCoordinate(lonlat.lon,"lon",format)+"&nbsp;::&nbsp;"+Map.Util.getFormattedCoordinate(lonlat.lat,"lat",format);
        }
        /*
         * Classical 'dms' first display Latitude then Longitude
         */
        else {
            return Map.Util.getFormattedCoordinate(lonlat.lat,"lat",format)+"&nbsp;::&nbsp;"+Map.Util.getFormattedCoordinate(lonlat.lon,"lon",format);
        }
        
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
         * Normalize coordinate for longitude values between [-180,180] degrees for longitude and [-90,90] for latitudes
         */
        if (axis === "lon") {
            coordinate = (coordinate+540)%360 - 180;
            nsew = coordinate < 0 ? "W" : "E";
        }
        else {
            coordinate = (coordinate+270)%180 - 90;
            nsew =coordinate < 0 ? "S" : "N";
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
        /* Bitwise operator is faster than Map.floor */
        degreesOrHours = coordinate|0;
        minutes = (coordinate - degreesOrHours)/(1/60);
        tmp = minutes;
        /* Bitwise operator is faster than Map.floor */
        minutes = minutes|0;
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
     * Return true if the layer is a raster layer
     * A raster layer is one of the following :
     *     - Image
     *     - MBT
     *     - SHP
     *     - TMS
     *     - WMS
     *     - WMTS
     *     - XYZ
     */
    Map.Util.isRaster = function(layer) {
        
        var i,l,b = false, rasters = ["Image","MBT","SHP","TMS","WMS","WMTS","XYZ"];
      
        if (!layer || !layer['_msp']) {
            return b;
        }
        
        /* 
         * Rasters layers are processed differently from vector layers.
         * A vector layer got its own individual tab.
         * All raster layers are displayed within a single "rasters" tab 
         */
        for (i = 0, l = rasters.length; i < l; i++){
            if (rasters[i] === layer['_msp']['layerDescription'].type) {
                b = true;
                break;
            }
        }
        
        return b;
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
     * Reindex layer to ensure that :
     *  - vectors layers are always on top of raster layers
     *  - Point and/or Line vector layers are always
     *    on top Polygonal vector layers
     */
    Map.Util.updateIndex = function(layer) {
        
        var i,tmpLayer,
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
        for (i=l;i--;) {

            tmpLayer = Map.map.layers[i]
            
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
            Map.map.setLayerIndex(layer, index+1);
            
        }
       
        return true;
       
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
    Map.Util.zoomOn = function(layer) {
        
        var extent;
        
        /*
         * Paranoid mode
         */
        if (!layer || !layer["_msp"]) {
            return false;
        }
        
        /*
         * Only zoom on layer that are initialized
         */
        if (layer["_msp"].initialized) {

            /*
             * Vector layers have a getDataExtent() function that returns bounds
             * Raster layer such as WMS or Image should have a ["_msp"].bounds property
             * set during initialization
             */
            extent = layer.getDataExtent() || layer["_msp"].bounds;
            if (extent) {

                /*
                 * Centering is done only if the entire layer or part of the layer
                 * is not visible within the map view
                 */
                if (!msp.Map.map.getExtent().intersectsBounds(extent, true)) {
                    msp.Map.zoomTo(extent);
                    return true;
                }

            }
        }
        
        return false;
        
    };
    
    
})(window.msp, window.msp.Map);