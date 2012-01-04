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
 * WFS layer type
 */
(function (msp,Map){
    
    Map.layerTypes["WFS"] = {

        /**
         * Layer clusterization is set by default
         */
        clusterized:true,

        /**
         * MANDATORY
         */
        forceReload:true,

        /**
         * Set default styleMap
         */
        hasStyleMap:true,

        /**
         * MANDATORY
         */
        icon:"wfs.png",

        /*
         * WFS returns EPSG:4326 data
         */
        projection: Map.epsg4326,

        /**
         * MANDATORY
         */
        selectable:true,

        /**
         * Mandatory properties for valid WFS layerDescription
         */
        mandatories:[
            "featureNS",
            "version"
        ],

        /**
         * MANDATORY
         *
         * layerDescription = {
         *       type:'WFS',
         *       title:,
         *       url:,
         *       typeName:,
         *       color:,
         *       opacity:,
         *       icon:,
         *       filterOn:,
         *       clusterized:,
         *       featureType:,
         *       featureNS:,
         *       geometryName:,
         *       version:,
         *       time : // optional - only used for WFS Time layer
         *  };
         *
         *  Note: "time" property is an object with three parameters
         *  time: {
         *      value: // mandatory default value
         *      name: // mandatory name of the time property
         *      list:[] // optional, array of possible values
         *                  e.g. ["1995-01-01/2011-12-31/PT5M"]
         *                  (see WMS specification OGC 06-042)
         *  }
         *  };
         */
        add: function(layerDescription, options) {

            /**
             * Repare URL if it is not well formed
             */
            layerDescription.url = msp.Util.repareUrl(layerDescription.url);

            /*
             * Check mandatory properties
             */
            if (!(new Map.LayerDescription(layerDescription, Map)).isValid()) {

                /*
                 * Important : non valid layers loaded during
                 * startup are discarded without asking user
                 */
                if (!layerDescription.initialLayer) {

                    /*
                     * Retrieves missing propertiesthrough GetCapabilites
                     * and DescribeFeatureType operations
                     */
                    this.update(layerDescription);
                }
                return null;
            }

            /*
             * Extend options object with Flickr specific properties
             */
            $.extend(options,
            {
                extractAttributes:true,
                protocol:new OpenLayers.Protocol.WFS({
                    url:layerDescription.url,
                    featureType:layerDescription.typeName,
                    featureNS:layerDescription.featureNS,
                    geometryName:layerDescription.geometryName || "the_geom",
                    srsName:Map.epsg4326.projCode,
                    version:layerDescription.version
                }),
                strategies:options.strategies || []
            }
            );

            /*
             * WFS default strategy is BBOX
             */
            options.strategies.push(new OpenLayers.Strategy.BBOX());

            /*
             * WFS Time - set filter
             * 
             *  TODO
             */
            /*
            if (layerDescription.time) {

                var filter = this.getFilter(layerDescription.time["name"],layerDescription.time["value"]);
                if (filter) {
                    options.filter = filter;
                }

            }*/

            /*
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);

            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {
                Map.onFeaturesAdded(this);
            });

            return newLayer;

        },

        /**
         * Return WFS GetCapabilities
         */
        getCapabilities: function(XMLHttpRequestObj) {

            var capability = null;

            if (XMLHttpRequestObj.status !== 200) {
                return null
            }

            try {
                capability = (new OpenLayers.Format.WFSCapabilities()).read(XMLHttpRequestObj.responseXML);
            }
            catch(e) {
                msp.Util.message(msp.Util._("Error reading Capabilities file"));
            }

            return capability;
        },

        /**
         * Return WFS DescribeFeatureType
         */
        describeFeatureType: function(XMLHttpRequestObj) {

            var describeFeatureType = null;

            if (XMLHttpRequestObj.status !== 200) {
                return null
            }

            try {
                describeFeatureType = (new OpenLayers.Format.WFSDescribeFeatureType()).read(XMLHttpRequestObj.responseXML);
            }
            catch(e) {
            //msp.Util.message(msp.Util._("Error reading DescribeFeatureType file"));
            }

            return describeFeatureType;
        },

        /**
         * Launch an ajax call to WFS getCapabilities and DescribeFeatureType services
         * based on input layerDescription
         * On success, "callback" function is called with an array
         * of layerDescription object as input parameter
         * 
         * @input layerDescription: layerDescription object of a WFS server
         * @input callback : function to be called on success with an array of layerDescription
         *                   as input parameter (e.g. plugins["LayersManager_AddFactory"].displayLayersInfo(a))
         */
        update: function(layerDescription, callback) {

            var self = Map.layerTypes["WFS"],
                availableLayer,
                predefined,
                doCall = !callback || !$.isFunction(callback) ? false : true;

            /*
             * First check if one of the availableLayers with the same url
             * already got a capabilities
             */
            Map.predefined["WFS"] = Map.predefined["WFS"] || [];
            predefined = Map.predefined["WFS"];
            for (var i = 0, l = predefined.length; i < l; i++) {

                availableLayer = predefined[i];

                /*
                 * This layer is one of the available layers
                 */
                if (availableLayer.url === layerDescription.url) {

                    /*
                     * The informations is already defined
                     */
                    if (availableLayer.capabilities !== undefined && availableLayer.describeFeatureType !== undefined) {
                        layerDescription.capabilities = availableLayer.capabilities;
                        layerDescription.describeFeatureType = availableLayer.describeFeatureType;
                        if (doCall) {
                            callback(self.getLayerDescriptions(layerDescription));
                        }
                        return true;
                    }
                }
            }

            /*
             * Retrieve geometryName, featureNS and version information by asynchronous call to
             * GetCapabilities and DescribeFeatureType
             */
            msp.Util.ajax({
                url:msp.Util.proxify(layerDescription.url+"request=GetCapabilities&service=WFS&version=1.1.0", "XML"),
                async:true,
                obj:layerDescription,
                success:function(data, textStatus, XMLHttpRequest) {
                    this.obj.capabilities = self.getCapabilities(XMLHttpRequest);
                    if (this.obj.capabilities) {
                        msp.Util.ajax({
                            url:msp.Util.proxify(layerDescription.url+"request=DescribeFeatureType&service=WFS", "XML"),
                            async:true,
                            obj:this.obj,
                            success:function(data, textStatus, XMLHttpRequest) {

                                /*
                                 * Get describeFeatureType
                                 */
                                var describeFeatureType = self.describeFeatureType(XMLHttpRequest);

                                /*
                                 * Problem during describeFeatureType => empty featureNS
                                 */
                                if (!describeFeatureType) {
                                    describeFeatureType = {};

                                    /**
                                     * Old school...
                                     */
                                    describeFeatureType.targetNamespace = XMLHttpRequest.responseXML.documentElement.getAttribute('targetNamespace') || "";
                                }

                                /*
                                 * Assign describeFeatureType object to obj
                                 */
                                this.obj.describeFeatureType = describeFeatureType;

                                /*
                                 * Add this layerDescription to the list of available layers,
                                 * or update this list if it is already defined
                                 */
                                var update = false;
                                for (var i = 0, l = predefined.length; i< l; i++) {

                                    availableLayer = predefined[i];

                                    /*
                                     * This layer is one of the available layers
                                     */
                                    if (availableLayer.url === this.obj.url) {

                                        /*
                                         * This availableLayer got no layers specified
                                         * => update capabilities
                                         */
                                        if (availableLayer.typeName === undefined) {
                                            availableLayer.capabilities = this.obj.capabilities;
                                            availableLayer.describeFeatureType = this.obj.describeFeatureType;
                                            update = true;
                                        }

                                    }
                                }

                                /*
                                 * No update => insert
                                 */
                                if (!update) {
                                    predefined.push({
                                        type:"WFS",
                                        title:this.obj.title,
                                        url:this.obj.url,
                                        capabilities:this.obj.capabilities,
                                        describeFeatureType:this.obj.describeFeatureType
                                    })
                                }

                                /*
                                 * Show layers list
                                 */
                                if (doCall) {
                                    callback(self.getLayerDescriptions(this.obj));
                                }

                            },
                            error:function(e) {
                                msp.Util.message(msp.Util._("Error performing DescribeFeatureType operation"));
                            }
                        },{
                            title:msp.Util._("WFS") + " : " + msp.Util._("DescribeFeatureType"),
                            cancel:true
                        });

                    }

                },
                error:function(e) {
                    msp.Util.message(msp.Util._("Error performing GetCapabilities operation"));
                }
            },{
               title:msp.Util._("WFS") + " : " + msp.Util._("Get capabilities"),
               cancel:true 
            });

            return true;

        },

        /**
         * Return an array of layerDescription derived from capabilities information
         *
         * @input {Object} layerDescription
         */
        getLayerDescriptions: function(layerDescription) {

            /*
             * Default is an empty array
             */
            var a = [];

            /*
             * Paranoid mode
             */
            if (!layerDescription || typeof layerDescription !== "object") {
                return a;
            }

            /*
             * Empty capability => return empty array
             */
            if (!layerDescription.capabilities || !layerDescription.capabilities.featureTypeList) {
                return a;
            }
            else {

                /**
                 * Parse layers list
                 */
                var d, featureType, f, geometryName, property;
                for (var i = 0, l = layerDescription.capabilities.featureTypeList.featureTypes.length; i < l; i++) {

                    featureType = layerDescription.capabilities.featureTypeList.featureTypes[i];

                    d = {
                        type:"WFS",
                        title:featureType["title"],
                        description:featureType["abstract"],
                        url:layerDescription.url,
                        typeName:featureType["name"],
                        version:layerDescription.capabilities.version
                    };

                    /*
                     * This is the default
                     */
                    geometryName = 'the_geom';

                    /*
                     * Extract geometryName from describeFeatureType
                     * (first property with a geometrical type)
                     */
                    if (layerDescription.describeFeatureType && layerDescription.describeFeatureType.featureTypes) {

                        /*
                         * Roll over featureTypes
                         */
                        for (var j = 0, m = layerDescription.describeFeatureType.featureTypes.length; j < m; j++) {

                            f = layerDescription.describeFeatureType.featureTypes[j];

                            /*
                             * Yes we found the featureType corresponding to
                             * the current typeName
                             */
                            if (f.typeName === d.typeName) {

                                /*
                                 * Roll over featureType properties
                                 */
                                if (f.properties) {

                                    for (var k = 0, n = f.properties.length; k < n; j++) {

                                        property = f.properties[k];

                                        /*
                                         * Check for a geometrical property
                                         * and break !
                                         * A geometrical property should end with "PopertyType"
                                         * (TBC ...)
                                         */
                                        if (property.type && property.type.indexOf("PropertyType") !== -1) {
                                            geometryName = property.name;
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                        }

                    }

                    /*
                     * Set properties
                     */
                    d.featureNS = layerDescription.describeFeatureType.targetNamespace;
                    d.geometryName = geometryName;

                    /*
                     * Add layerDescription to array
                     */
                    a.push(d);

                }

            }

            return a;
        },

        /*
         * @returns OpenLayers Filter
         */
        getTimeFilter: function(name, value) {

            /*
             * Paranoid mode
             */
            if (!name || !value) {
                return null;
            }

            var filter = null;

            /*
             * Split intervals
             */
            var isos = value.split('/');

            /*
             * Input date is a single date => add a EQUAL filter
             * on property layerDescription.time["name"]
             */
            if (isos.length === 1) {
                if (msp.isISO8601(value)) {
                    filter = new OpenLayers.Filter.Comparison({
                        type : OpenLayers.Filter.Comparison.EQUAL_TO,
                        property : name,
                        value : value
                    });
                }
            }
            /*
             * Input date is an interval => add two filters
             * on property layerDescription.time["name"] :
             * one GREATER and one LOWER respectively to each
             * interval dates
             */
            else if (isos.length === 2) {
                if (msp.isISO8601(value)) {
                    filter = new OpenLayers.Filter.Logical({
                        type: OpenLayers.Filter.Logical.AND,
                        filters: [
                        new OpenLayers.Filter.Comparison({
                            type : OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
                            property : name,
                            value : value
                        }),
                        new OpenLayers.Filter.Comparison({
                            type : OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
                            property : name,
                            value : value
                        })]
                    });
                }
            }

            return filter;

        },

        /**
         * Update WFS Time layer according to the new time
         */
        setTime: function(layer, time) {
            if (layer) {
                var filter = this.getTimeFilter(name, value);
                if (filter) {
                    layer["_msp"].layerDescription.time = layer["_msp"].layerDescription.time || {};
                    layer["_msp"].layerDescription.time["value"] = time;
                    layer.filter = filter;
                    layer.refresh({
                        force:true
                    });
                }
            }
        },

        /**
         * MANDATORY
         * Compute an unique mspID based on layerDescription
         */
        getMspID:function(layerDescription) {
            return msp.Util.crc32(layerDescription.type + (msp.Util.repareUrl(layerDescription.url) || "") + (layerDescription.typeName || ""));
        }
    }
})(window.msp, window.msp.Map);