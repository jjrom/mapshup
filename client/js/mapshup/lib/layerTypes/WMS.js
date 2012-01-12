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
 * WMS layer type
 */
(function (msp,Map){
    
    Map.layerTypes["WMS"] = {
        
        /**
         * MANDATORY
         */
        icon:"wms.png",

        /**
         * Layer used to identify the map point
         * for a getFeatureInfo request
         */
        getFeatureInfoLayer:null,

        /**
         * Mandatory properties for
         * valid layerDescription
         */
        mandatories:[
            "layers"
        ],

        /**
         * MANDATORY
         *
         * layerDescription = {
         *       type:'WMS',
         *       title:,
         *       url:,
         *       layers:,
         *       displayType:,
         *       srs:,
         *       version: // optional - set to 1.1.0 if not specified,
         *       time : // optional - only used for WMS Time layer
         *  };
         *
         *  Note: "time" property is an object with two parameters
         *  time: {
         *      value: // mandatory default value
         *      list:[] // optional, array of possible values
         *                  e.g. ["1995-01-01/2011-12-31/PT5M"]
         *                  (see WMS specification OGC 06-042)
         *  }
         *
         */
        add: function(layerDescription, options) {

            var projection, BBOX, avoidBoundError;
            
            /**
             * Repare URL if it is not well formed
             */
            layerDescription.url = msp.Util.repareUrl(layerDescription.url);

            /**
             * Set layerDescription.srs if not set
             */
            layerDescription.srs = msp.Util.getPropertyValue(layerDescription, "srs", Map.epsg4326.projCode);

            /*
             * Check mandatory properties
             */
            if (!(new Map.LayerDescription(layerDescription, Map)).isValid()) {

                /*
                 * Important : non valid layers loaded during
                 * startup are discarded without asking user
                 */
                if (!layerDescription.initialLayer) {
                    this.update(layerDescription);
                }
                return null;
            }

            /**
             * If the srs is different from get map srs, msp creates
             * a mapfile on server side to allow on the fly reprojection of the WMS tiles
             */
            projection = msp.Util.getPropertyValue(Map.map, "projection", Map.epsg4326);

            if (layerDescription.srs !== projection.projCode) {
                OpenLayers.Request.GET({
                    url:msp.Util.getAbsoluteUrl(msp.Config["general"].reprojectionServiceUrl)+msp.Util.abc+"&url="+encodeURIComponent(layerDescription.url)+"&layers="+encodeURIComponent(layerDescription.layers)+"&srs="+layerDescription.srs,
                    callback: function(request) {
                        var JSONReader = new OpenLayers.Format.JSON(),
                            JSON = JSONReader.read(request.responseText);
                        /**
                         * Add a new property "projectedUrl" that should be used
                         * in place of original url
                         */
                        if (JSON.success) {
                            layerDescription.projectedUrl = JSON.url;
                            layerDescription.srs = Map.map.projection.projCode;
                            Map.addLayer(layerDescription);
                        }
                        else {
                            msp.Util.message(msp.Util._("Error : cannot reproject this layer"));
                        }
                    }
                });
                return null;
            }

            /**
             * Input "options" modification
             * If no BBOX is given, default is set to -170,-80,170,80
             */
            BBOX = layerDescription.bbox ? layerDescription.bbox.split(",") : ["-170","-80","170","80"];
            avoidBoundError = 0; //Avoid reprojection error at the pole
            

            if (BBOX[0] === "-180" || BBOX[1] === "-90" || BBOX[2] === "90" || BBOX[3] === "180") {
                avoidBoundError = 1;
            }

            /*
             * A WMS cannot be "selectable"
             * Thus this property cannot be overriden
             */
            options["_msp"].selectable = false;
            options["_msp"].bounds = Map.Util.d2p(new OpenLayers.Bounds(parseFloat(BBOX[0]) + avoidBoundError, parseFloat(BBOX[1])  + avoidBoundError, parseFloat(BBOX[2])  - avoidBoundError, parseFloat(BBOX[3]) - avoidBoundError));
            options["_msp"].allowChangeOpacity = true;

            /*
             * Extend options object with WMS specific properties
             */
            options.buffer = 0;
                
            /*
             * Time component
             */
            if (layerDescription.time && layerDescription.time["value"]) {
                options.time = layerDescription.time["value"];
            }

            /*
             * Set title
             */
            layerDescription.title = msp.Util.getTitle(layerDescription)
            
            /*
             * Layer creation
             * !! If "projectedUrl" is defined, then use it instead
             * of original url
             */
            var newLayer = new OpenLayers.Layer.WMS(layerDescription.title, msp.Util.getPropertyValue(layerDescription, "projectedUrl", layerDescription.url), {
                layers:layerDescription.layers,
                format:"image/jpeg",
                transitionEffect: "resize",
                transparent:'true',
                SLD:layerDescription.SLD,
                version:layerDescription.version || "1.1.0"
            }, options);

            return newLayer;

        },

        /**
         * Return WMS GetCapabilities
         */
        getCapabilities: function(XMLHttpRequestObj) {

            var capability = null;

            if (XMLHttpRequestObj.status !== 200) {
                return null
            }
            try {
                var format = new OpenLayers.Format.WMSCapabilities();
                capability = format.read(XMLHttpRequestObj.responseXML);
            }
            catch(e) {
                msp.Util.message(msp.Util._("Error reading Capabilities file"));
            }

            return capability;
        },

        /*
         * Launch an ajax call to WMS getCapabilities service
         * based on input layerDescription
         * On success, "callback" function is called with an array
         * of layerDescription object as input parameter
         * 
         * @input layerDescription: layerDescription object of a WMS server
         * @input callback : function to be called on success with an array of layerDescription
         *                   as input parameter (e.g. plugins["AddLayer"].displayLayersInfo(a))
         */
        update: function(layerDescription, callback) {

            var i,l,availableLayer,predefined,
                self = Map.layerTypes["WMS"],
                doCall = !callback || !$.isFunction(callback) ? false : true;

            /*
             * First check if one of the predefined layers with the same url
             * already got a capabilities
             */
            Map.predefined.items["WMS"] = Map.predefined.items["WMS"] || [];
            predefined = Map.predefined.items["WMS"];
            for (i = 0, l = predefined.length; i < l; i++) {

                availableLayer = predefined[i];

                /*
                 * This layer is one of the available layers
                 */
                if (availableLayer.url === layerDescription.url) {

                    /*
                     * The capabilities is already defined
                     */
                    if (availableLayer.capabilities !== undefined) {
                        layerDescription.capabilities = availableLayer.capabilities;
                        if (doCall) {
                            callback(self.getLayerDescriptions(layerDescription));
                        }
                        return true;
                    }
                }
            }
            /*
             * By default call WMS with version set to 1.3.0
             */
            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.repareUrl(layerDescription.url+"request=GetCapabilities&service=WMS&version=1.3.0"), "XML"),
                async:true,
                success:function(data, textStatus, XMLHttpRequest) {

                    /*
                     * Append capabilities to layerDescription
                     */
                    layerDescription.capabilities = self.getCapabilities(XMLHttpRequest);

                    /*
                     * Set the layerDescription title if not already set
                     */
                    if (!layerDescription.title) {
                        layerDescription.title = layerDescription.capabilities.service ? layerDescription.capabilities.service["title"] : msp.Util.getTitle(layerDescription);
                    }
                    
                    /*
                     * Add this layerDescription to the list of available layers,
                     * or update this list if it is already defined
                     */
                    var i,l,update = false;
                    for (i = 0, l = predefined.length; i < l; i++) {

                        availableLayer = predefined[i];

                        /*
                         * This layer is one of the available layers
                         */
                        if (availableLayer.url === layerDescription.url) {

                            /*
                             * => update capabilities
                             */
                            if (availableLayer.layers === undefined) {
                                availableLayer.capabilities = layerDescription.capabilities;
                                update = true;
                                break;
                            }

                        }
                    }

                    /*
                     * No update => insert
                     */
                    if (!update) {
                        Map.predefined.add({
                            type:"WMS",
                            title:layerDescription.title,
                            url:layerDescription.url,
                            capabilities:layerDescription.capabilities
                        });
                    }

                    if (doCall) {
                        callback(self.getLayerDescriptions(layerDescription));
                    }
                },
                error:function(e) {
                    msp.Util.message(msp.Util._("Error reading Capabilities file"));
                }
            }, {
                title:msp.Util._("WMS") + " : " + msp.Util._("Get capabilities"),
                cancel:true
            });


            return true;
        },

        /**
         * Return an array of layerDescription derived from capabilities information
         */
        getLayerDescriptions: function(layerDescription) {

            /*
             * Default is an empty array
             */
            var a = [],
                capabilities;

            /*
             * Paranoid mode
             */
            if (!layerDescription || typeof layerDescription !== "object") {
                return a;
            }

            /*
             * Empty capability => return empty array
             */
            capabilities = layerDescription.capabilities;

            if (!capabilities || !capabilities.capability) {
                return a;
            }
            else {

                /*
                 * Get the getmap url
                 * EPSG:4326
                 * WIDTH:100
                 * HEIGHT:50
                 */
                var width = 100,
                    height = 50,
                    url = msp.Util.repareUrl(layerDescription.url),
                    preview = url+"WIDTH="+width+"&HEIGHT="+height+"&STYLES=&FORMAT=image/png&TRANSPARENT=false&SERVICE=WMS&REQUEST=GetMap&VERSION="+capabilities.version,
                    d,
                    layer,
                    projinfo,
                    ptitle = (capabilities.capability.nestedLayers && capabilities.capability.nestedLayers[0]) ? capabilities.capability.nestedLayers[0]["title"] : null;

                /*
                 * Parse layers list
                 */
                for (var i = 0, l = capabilities.capability.layers.length; i < l; i++) {

                    layer = capabilities.capability.layers[i];

                    /*
                     * WMS 1.3.0 => srs is now crs and axis order is switched for
                     * EPSG:4326
                     *
                     */
                    if (capabilities.version === "1.3.0") {
                        if (layer.llbbox && layer.llbbox.length === 4) {
                            projinfo = "&CRS=EPSG:4326&BBOX="+layer.llbbox[1]+','+layer.llbbox[0]+','+layer.llbbox[3]+','+layer.llbbox[2];
                        }
                        else {
                            projinfo = "&CRS=EPSG:4326&BBOX=-90,-180,90,180";
                        }
                    }
                    else {
                        if (layer.llbbox && layer.llbbox.length === 4) {
                            projinfo = "&SRS=EPSG:4326&BBOX="+layer.llbbox[0]+','+layer.llbbox[1]+','+layer.llbbox[2]+','+layer.llbbox[3];
                        }
                        else {
                            projinfo = "&SRS=EPSG:4326&BBOX=-180,-90,180,90";
                        }
                    }

                    /*
                     * Initialize new object
                     */
                    d = {
                        type:"WMS",
                        title:layer["title"],
                        ptitle:ptitle,
                        url:url,
                        layers:layer["name"],
                        preview:preview+projinfo+'&LAYERS='+layer["name"],
                        version:capabilities.version
                    };

                    /*
                     * In OpenLayers bbox in EPSG:4326 is lonmin,latmin,lonmax,latmax
                     *
                     * The bbox of this layer if retrieved from the capabilities
                     * or set to the whole earth if not found
                     */
                    d.bbox = "-170,-80,170,80";
                    if (layer.llbbox && layer.llbbox.length === 4) {
                        d.bbox = layer.llbbox[0]+','+layer.llbbox[1]+','+layer.llbbox[2]+','+layer.llbbox[3];
                    }

                    /*
                     * Is layer queryable ?
                     */
                    d.queryable = layer["queryable"] ? true : false;

                    /*
                     * Is layer a WMS Time layer
                     */
                    if (layer.dimensions && layer.dimensions.time) {
                        d.time = {
                            value:layer.dimensions.time["default"],
                            list:layer.dimensions.time["values"] || []
                        }
                    }

                    /*
                     * Get the "best" srs, i.e. Map.map.getProjection()
                     * If this srs does not exists, put a EPSG:4326 srs instead
                     * msp server will reproject the layer on the fly
                     */
                    for (var srs in layer.srs) {
                        if (srs === Map.map.projection.projCode) {
                            break;
                        }
                    }
                    if (srs !== Map.map.projection.projCode) {
                        srs = Map.epsg4326;
                    }
                    d.srs = srs;

                    /*
                     * Add layerDescription to array
                     */
                    a.push(d);

                }
            }

            return a;
        },

        /**
         * Launch a getFeatureInfo on all queryables WMS layers
         *
         * @input {OpenLayers.LonLat} lonLat : clicked point in map coordinates
         * @input {jquery div} div : div container to write in
         */
        getFeatureInfo: function(lonLat, div) {

            /**
             * By default there is no "good candidates"
             */
            var atLeastOne = false,

                /**
                 * Reference to map object
                 */
                map = Map.map,

                /**
                 * Compute the pixel equivalence to the map lonLat coordinates
                 */
                xy = map.getPixelFromLonLat(lonLat),

                /**
                 * Parse all layers for "good candidates" aka WMS layers with queryable = 1
                 */
                length = map.layers.length,
                j,
                layer,
                layerDescription,
                url,
                id;
            for (j=length;j--;) {
                layer = map.layers[j];
                if (layer["_msp"]) {
                    layerDescription = layer["_msp"].layerDescription;
                    if (layerDescription && layerDescription.type === "WMS" && layerDescription.queryable) {

                        /**
                         * At least one "good candidate" is present :)
                         */
                        atLeastOne = true;

                        /*
                         * Set default version if not specified
                         */
                        layerDescription.version = layerDescription.version || "1.1.0";

                        /**
                         * Prepare the getFeatureInfo request
                         */
                        url = msp.Util.repareUrl(layerDescription.url);
                        url += "SERVICE=WMS";
                        url += "&VERSION="+ layerDescription.version;
                        url += "&REQUEST=GetFeatureInfo";
                        url += "&EXCEPTIONS=application/vnd.ogc.se_xml";
                        url += "&X="+xy.x;
                        url += "&Y="+xy.y;
                        url += "&INFO_FORMAT=text/html",
                        url += "&QUERY_LAYERS="+layerDescription.layers;
                        url += "&LAYERS="+layerDescription.layers;
                        url += "&WIDTH="+map.size.w;
                        url += "&HEIGHT="+map.size.h;
                        //url += "&FEATURE_COUNT=1";

                        /*
                         * Now the tricky part. If projectedUrl is defined, it means
                         * that the original WMS server is not in map.projection.
                         * Thus we need to call WMS server with epsg:4326 projection
                         */
                        if (layerDescription.projectedUrl) {
                            var extent = map.p22(map.getExtent().clone());
                            url += "&BBOX="+extent.toBBOX();
                            url += "&SRS="+Map.epsg4326.projCode;
                        }
                        else {
                            url += "&BBOX="+map.getExtent().toBBOX();
                            url += "&SRS="+layerDescription.srs;
                        }

                        /**
                         * Initialize information container
                         */
                        id = msp.Util.getId();
                        div.append("<h1>"+layer.name+"</h1>");
                        div.append('<div class="'+id+'"><img src="'+msp.Util.getImgUrl("loading.gif")+'" class="textmiddle"/> '+msp.Util._("Get data from server..."));
                        /*
                        description.append('<iframe src="'+msp.Util.proxify(url)+'" width="100%"><img src="'+msp.Util.getImgUrl("loading.gif")+'" class="textmiddle"/></iframe>');
                        */
                        (function(div,id,url) {
                            $.ajax({
                                url:msp.Util.proxify(url),
                                async:true,
                                dataType:"text",
                                success:function(data) {
                                    $('.'+id, div).html(data);
                                //$('.'+id, description).html('<iframe>'+data+'</iframe>');
                                },
                                error:function(e) {
                                    $('.'+id, div).html(msp.Util._("No result"));
                                }
                            });
                        })(div,id,url);
                    }
                }
            }

            /**
             * No "good candidate".
             * Do not display getFeatureInfoLayer
             * Display an information message
             */
            if (!atLeastOne) {
                return false;
            }

            return true;

        },

        /**
         * Update WMS Time layer according to the new time
         */
        setTime: function(layer, time) {
            if (layer && layer.mergeNewParams) {
                layer["_msp"].layerDescription.time = layer["_msp"].layerDescription.time || {};
                layer["_msp"].layerDescription.time["value"] = time;
                layer.mergeNewParams({
                    'time':time
                });
            }
        },

        /**
         * MANDATORY
         * Compute an unique mspID based on layerDescription
         */
        getMspID:function(layerDescription) {
            return msp.Util.crc32(layerDescription.type + (msp.Util.repareUrl(layerDescription.url) || "") + (layerDescription.layers || ""));
        }
    }
})(window.msp, window.msp.Map);
