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
(function(msp) {
    
    /*
     * Initialize msp.Map
     */
    msp = msp || {};
    
    /*
     * Initialize msp.Map
     * 
     * This is the main mapshup object
     */
    msp.Map = {
        
        /*
         * Reference to featureHilite jquery object
         */
        $featureHilite:$(),
        
        /**
         * Hack to avoid Logger plugin to re-log history
         * extent when they are requested through UserManagement
         * plugin
         */
        doNotLog: false,
        
        /**
         * WGS84 projection object
         */
        epsg4326: new OpenLayers.Projection("EPSG:4326"),

        /**
         * Google projection object
         */
        epsg3857: new OpenLayers.Projection("EPSG:3857"),

        /**
         * An array of LayersGroup
         */
        layersGroups: [],

        /**
         * Registered layer types
         */
        layerTypes: [],

        /**
         * Map object reference
         */
        map:null,

        /**
         * Last mouse click within the map object
         * (from top,left)
         */
        mouseClick: new OpenLayers.Pixel(0,0),

        /**
         * Current mouse position within the map object
         * (from top,left)
         */
        mousePosition: new OpenLayers.Pixel(0,0),

        /**
         * Predefined layerDescriptions object
         * Used by AddLayer plugin
         * !! IMPORTANT !!
         * This is a hash of array containing layerDescription
         * The hash keys are the layerDescription types
         */
        predefined:[],

        /**
         * Number of call to the window.setInterval function
         */
        refreshCycle:0,

        /**
         * This array is used to store initialLayers that have been removed
         * See context management
         *
         * Structure :
         * {
         *      mspID:
         *      layerDescription:
         * }
         */
        removedLayers: [],

        /**
         * selectableLayers object contains all the layers that can be selected with
         * the "__CONTROL_SELECT__" control tool
         */
        selectableLayers: {

            /**
             * Array containing all selectable layers (i.e. not background layers, only vectors)
             */
            items: [],

            /**
             * Add a new layer to the selectable list
             */
            add: function(layer) {
                layer.events.on({
                    "featureselected":function(e) {
                        msp.Map.featureInfo.select(e["feature"]);
                    },
                    "featureunselected":function(e) {
                        msp.Map.featureInfo.unselect(e["feature"]);
                    }
                });
                this.items.push(layer);
                msp.Map.resetControl();
            },

            /**
             * Remove a layer from the selectable list
             */
            remove: function(layer) {
                for (var i = 0, l = this.items.length; i < l; i++) {
                    if (this.items[i].id === layer.id) {
                        this.items.splice(i,1);
                        break;
                    }
                }
            }
        },
        
        /*
         *
         * This fonction is the entry point to add any kind of layers
         * The add*Layer functions should not be called directly
         *
         *  @input {object} layerDescription : layer description object (see layerTypes js files)
         *  @input {Object} options : options can be
         *          {boolean} noDeletionCheck : if 'true', user is not request if the added layer replace an existing one
         *          {boolean} forceInitialized : if true, the layer["_msp"].initialized is set to true and thus the map
         *                                      is not zoom on layer after load
         */
        addLayer: function(_layerDescription, _options) {

            /**
             * Paranoid mode
             */
            _options = _options || {};


            /**
             * By default, check for deletion
             */
            var noDeletionCheck = msp.Util.getPropertyValue(_options, "noDeletionCheck", false);

            /*
             * Create a layerDescriptionObj from current layerDescription
             */
            var ldo = new this.LayerDescription(_layerDescription, this);
            
            /**
             * Check if layerDescription object is valid i.e. its layerType is registered
             * Only layers registered within this.Config.layerTypes array
             * can be added to Map
             */
            if (!ldo.isValid()) {
                return null;
            }

            var layerType = ldo.getLayerType();
            if (!layerType) {
                return null;
            }

            /**
             * Each layer must include a _msp object wich contains 
             * specific msp properties
             * 
             * One of this property, mspID, is a unique and mandatory identifier
             * based on a checksum (see msp.crc32 method)
             */
            var mspID = ldo.getMspID();

            /**
             * Check if newLayer already exist. Based on mspID uniqueness
             */
            var newLayer = this.Util.getLayerByMspID(mspID);

            /**
             * If layer is already defined, replace it unless msp.Config.general.confirmDeletion
             * is set to true.
             * In this case, ask for deletion  - dialog box (div : #jDialog)
             */
            if (newLayer) {

                /**
                 * Ask for deletion if :
                 *  - it is requested in the query
                 *  - msp.Config.general.confirmDeletion is set to true
                 */
                if (!noDeletionCheck && msp.Config["general"].confirmDeletion) {

                    msp.Util.askFor(msp.Util._("Delete layer"), msp.Util._("Do you really want to remove layer")+" "+newLayer.name, "list", [{
                        title:msp.Util._("Yes"), 
                        value:"y"
                    },
                    {
                        title:msp.Util._("No"), 
                        value:"n"
                    }
                    ], function(v){
                        if (v === "y") {
                            msp.Map.removeLayer(newLayer);
                            msp.Map.addLayer(_layerDescription);
                        }
                    });
                    return null;
                }
                else {
                    msp.Map.removeLayer(newLayer);
                }
            }

            /*
             * Get a reference to the layerDescription object
             */
            var layerDescription = ldo.obj;
            
            /**
             * Ensure that layerDescription.url is an absolute url
             */
            if (layerDescription.url) {
                layerDescription.url = msp.Util.getAbsoluteUrl(layerDescription.url);
            }

            /**
             * Default options for all newLayer
             * These can be superseed depending on layerTypes
             */
            var options = {};

            /**
             * Specific OpenLayers properties can be described
             * within the layerDescription.ol properties.
             * Usefull for styleMap description for example
             */
            for (var key in layerDescription.ol) {
                options[key] = layerDescription.ol[key];
            }

            /*
             * msp specific properties.
             */
            options["_msp"] = {

                /** True : add opacity buttons in LayersManager panel */
                allowChangeOpacity:msp.Util.getPropertyValue(layerDescription, "allowChangeOpacity", false),

                /** True : layer is clusterized if it is supported in the layerTypes */
                clusterized:msp.Util.getPropertyValue(layerDescription, "clusterized", msp.Util.getPropertyValue(layerType, "clusterized", false)),

                /** Total number of feature within layer (see "layersend" event) */
                count:0,

                /** By default, a layer is not in a group */
                group:null,

                /** Icon */
                icon:msp.Util.getPropertyValue(layerDescription, "icon", msp.Util.getImgUrl(msp.Util.getPropertyValue(layerType, "icon", null))),

                /** True : the layer is part of the Config.layers list (i.e. load during startup) */
                initialLayer:msp.Util.getPropertyValue(layerDescription, "initialLayer", false),

                /** True : the layer content is initialized */
                initialized:msp.Util.getPropertyValue(_options, "forceInitialized", false),

                /** True : the layer content is loaded */
                isLoaded:true,

                /** Unique msp identifier for this layer */
                mspID:mspID,

                /** LayerDescription for this layer : use for context saving */
                layerDescription:layerDescription,

                /** True : avoid zoomon on layer name click in LayersManager panel */
                noZoomOn:msp.Util.getPropertyValue(layerDescription, "noZoomOn", false),

                /** True : add refresh button in LayersManager panel */
                refreshable:msp.Util.getPropertyValue(layerDescription, "refreshable", false),

                /** Refresh time interval for this layer is multicated by refreshFactor */
                refreshFactor:msp.Util.getPropertyValue(layerDescription, "refreshFactor", 1),

                /** True : layer is selectable through click in the map (i.e. add to __CONTROL_SELECT__) */
                selectable:msp.Util.getPropertyValue(layerDescription, "selectable", msp.Util.getPropertyValue(layerType, "selectable", false)),

                /** True : no remove button in LayersManager panel */
                unremovable:msp.Util.getPropertyValue(layerDescription, "unremovable", false),

                /** True : automatically zoom on the layer extent after the first load if the added layer is not visible within the map view */
                zoomOnAfterLoad:msp.Util.getPropertyValue(layerDescription, "zoomOnAfterLoad", true)

            };

            /*
             * Some OpenLayers properties are linked to layerType :
             * 
             *  - the projection object
             *  - the styleMap object
             *  - the cluster strategy
             */
            if (layerType.hasOwnProperty("projection")) {
                options.projection = layerType.projection;
            }

            /*
             * styleMap definition is retrieve from layerType
             * only if it is not already defined in option object
             * (i.e. previously declared within layerDescription.ol object)
             */
            if (layerType.hasStyleMap && !options.hasOwnProperty("styleMap")) {
                options.styleMap = ldo.getStyleMap();
            }

            /*
             * Add a cluster strategy unless a strategy is already defined
             */
            if (options["_msp"].clusterized && !options.hasOwnProperty("strategies")) {
                options.strategies = [
                new OpenLayers.Strategy.Cluster({
                    distance: 30,
                    threshold: 3
                })
                ];
            }

            /*
             * Add newLayer
             * 
             * TODO : layerDescription ou ldo ???
             */
            newLayer = layerType.add(layerDescription, options);

            /*
             * Add newLayer to map
             */
            if (newLayer) {

                /*
                 * Tell user a layer has been added
                 */
                if (!newLayer["_msp"].initialLayer) {
                    msp.Util.message(msp.Util._("Added")+ " : " + msp.Util._(newLayer.name));
                }

                /*
                 * If no "loadstart" has been defined
                 * => add a default "loadstart" event, i.e. show the loading indicator for newLayer
                 */
                if (newLayer.events.listeners.loadstart.length === 0) {
                    newLayer.events.register("loadstart", newLayer, function() {
                        msp.Map.events.trigger("loadstart", newLayer);
                    });
                }

                /*
                 * If no "loadend" has been defined
                 * => add a default "loadend" event, i.e. hide the loading indicator for newLayer
                 */
                if (newLayer.events.listeners.loadend.length === 0) {
                    newLayer.events.register("loadend", newLayer, function() {

                        /* OpenLayers bug with select control ? */
                        msp.Map.resetControl();

                        /*
                         * Remove the load indicator
                         */
                        msp.Map.events.trigger("loadend", newLayer);

                        /*
                         * If the layer is empty, it is automatically removed
                         * if its type 'removeOnEmpty' property is set to true
                         */
                        var layerType = msp.Map.layerTypes[this["_msp"].layerDescription.type];
                        if (layerType && layerType.removeOnEmpty) {

                            /*
                             * Layer is empty => remove it
                             */
                            if (msp.Map.Util.layerIsEmpty(this)) {
                                msp.Util.message(msp.Util._("No results"));
                                return msp.Map.removeLayer(this);
                            }
                        }

                        /*
                         * The map is centered on the layer extent after the FIRST load of this layer
                         * This centering is only done if the added layer, or part of the added layer,
                         * is not already visible in the map view
                         *
                         * Note : if newLayer has already been loaded then the _msp.initialized attribute
                         * is set to true and the map is not centered any more on this layer even if
                         * its content changes
                         */
                        if (!this["_msp"].initialLayer) {
                            msp.Map.Util.zoomOnAfterLoad(this);
                        }

                        /*
                         * Check the geometry type of layer
                         * Point and Line geometries should be moved
                         * on top of polygonals geometries
                         */
                        msp.Map.Util.updateIndex(this);

                        /*
                         * Set a flag to indicate that this layer has been initialized
                         */
                        this._msp.initialized = true;

                        return true;

                    });
                }


                /*
                 * Set the visibility of the layer depending on the "hidden" property
                 * If hidden is set to true, the layer is not displayed
                 */
                if (layerDescription && layerDescription.hidden === true) {
                    this.Util.setVisibility(newLayer, false);
                }

                /*
                 * Add newLayer to the map
                 */
                this.map.addLayer(newLayer);

                /*
                 * First baseLayer is set as the new baseLayer
                 * (i.e. replace the EmptyBaseLayer layer)
                 */
                if (newLayer.isBaseLayer && !this.hasNonEmptyBaseLayer) {
                    this.map.setBaseLayer(newLayer);
                    this.hasNonEmptyBaseLayer = true
                }

                /*
                 * Force layer redraw (e.g. refreshable WFS)
                 */
                if (layerType && layerType.forceReload) {
                    newLayer.redraw();
                }

                /*
                 * Add to selectable list
                 */
                if (newLayer["_msp"] && newLayer["_msp"].selectable) {
                    this.selectableLayers.add(newLayer);
                }

                /*
                 * Add to layersGroups if a groupName is defined
                 */
                if (newLayer["_msp"].layerDescription && newLayer["_msp"].layerDescription.groupName) {

                    var layerGroup = this.layersGroups[newLayer["_msp"].layerDescription.groupName];

                    /*
                     * layerGroup does not exist => create it
                     */
                    if (!layerGroup) {
                        layerGroup = new this.LayersGroup(newLayer["_msp"].layerDescription.groupName, null);
                        this.layersGroups[newLayer["_msp"].layerDescription.groupName] = layerGroup;
                    }

                    /*
                     * Add the newLayer
                     */
                    newLayer["_msp"].group = layerGroup;
                    layerGroup.add(newLayer);
                }

                /* 
                 * Trigger events layersend
                 */
                this.events.trigger("layersend", {
                    action:"add",
                    layer:newLayer
                });

            }

            return newLayer;
        },
        
        /*
         * Return the map bbox in epsg4326 projection and in
         * url format i.e. lonMin,latMin,lonMax,latMax
         *
         * Returned values are strictly between [-180,180] for longitudes
         * and [-90,90] for latitudes
         */
        getBBOX: function() {

            /*
             * Initialize bbox
             */
            var bbox = this.map.getExtent();
            if (bbox) {
                this.Util.p2d(bbox);
            }
            else {
                bbox = {
                    left:-180,
                    right:180,
                    bottom:-90,
                    top:90
                }
            }

            /*
             * Returns lonMin,latMin,lonMax,latMax
             */
            return Math.max(-180,bbox.left)+","+Math.max(-90,bbox.bottom)+","+Math.min(180,bbox.right)+","+Math.min(90,bbox.top);

        },
        
        /**
         * Load a context
         */
        loadContext: function(context) {

            var layer,
            add,
            i,
            j,
            l,
            m;

            /*
             * Center map on lon/lat with given zoom
             */
            if (context.hasOwnProperty('lon') && context.hasOwnProperty('lat')) {
                if (context.hasOwnProperty('zoom')) {
                    this.map.setCenter(this.Util.d2p(new OpenLayers.LonLat(context.lon,context.lat)), Math.max(context.zoom, this.lowestZoomLevel));
                }
                else {
                    this.map.setCenter(this.Util.d2p(new OpenLayers.LonLat(context.lon,context.lat)));
                }
            }
            /*
             * No input lon/lat but zoom is specified
             */
            else if (context.hasOwnProperty('zoom')) {
                this.map.setCenter(this.map.getExtent().getCenterLonLat(), Math.max(context.zoom, this.lowestZoomLevel));
            }

            /*
             * First clean the layer list i.e. remove every layer that are not
             * initial layers
             */

            /*
             * Temporary array to store layers to be removed
             */
            var tmpRemovedLayers = [];
            for (i = 0, l = this.map.layers.length;i < l; i++) {
                if (this.map.layers[i]["_msp"] && !this.map.layers[i]["_msp"].initialLayer) {
                    /*
                     * This layer should be removed
                     */
                    tmpRemovedLayers.push(this.map.layers[i]);
                }
            }

            /*
             * Remove layers
             */
            for (i = 0, l = tmpRemovedLayers.length; i < l; i++) {
                this.removeLayer(tmpRemovedLayers[i], false);
            }

            /*
             * Add additional layers
             * Flags noDeletionCheck and forceInitialized are set to true
             */
            if (context.hasOwnProperty('add')) {
                var layers = msp.Util.unserialize(unescape(context.add));
                for (i = 0, l = layers.length; i < l; i++) {
                    layer = this.addLayer(layers[i], {
                        noDeletionCheck:true,
                        forceInitialized:true
                    });
                }
            }

            /*
             * Remove layers
             */
            if (context.hasOwnProperty('remove')) {
                var mspIDs = msp.Util.unserialize(unescape(context.remove));
                for (i = 0, l = mspIDs.length; i < l; i++) {
                    layer = this.Util.getLayerByMspID(mspIDs[i]);
                    if (layer) {
                        this.removeLayer(layer, false);
                        if (layer["_msp"].initialLayer) {
                            tmpRemovedLayers.push({
                                mspID:mspIDs[i],
                                layerDescription:layer["_msp"].layerDescription
                            });
                        }
                    }
                }
            }

            /*
             * Finally, add all initial layers that should not be removed within this context
             */
            for (i = 0, l = this.removedLayers.length;i < l; i++) {

                add = true;

                /*
                 * Roll over initial layers that should ne be added because
                 * they are removed within this context
                 */
                for (j = 0, m = tmpRemovedLayers.length; j < m; j++) {
                    if (tmpRemovedLayers[j].mspID === this.removedLayers[i].mspID) {
                        add = false;
                        break;
                    }
                }

                if (add) {
                    this.addLayer(this.removedLayers[i].layerDescription, {
                        noDeletionCheck:true,
                        forceInitialized:true
                    });
                }
            }

            /*
             * Clean removedLayers list
             */
            this.removedLayers = [];
            for (i = 0, l = tmpRemovedLayers.length; i < l; i++) {
                this.removedLayers.push(tmpRemovedLayers[i]);
            }

            /*
             * Set default background
             */
            if (context.hasOwnProperty('bg')) {
                layer = this.Util.getLayerByMspID(context.bg);
                if (layer && layer.isBaseLayer) {
                    this.map.setBaseLayer(layer);
                }
            }

            /*
             * Hide layers
             */
            if (context.hasOwnProperty('hiddens')) {
                var hiddens = msp.Util.unserialize(unescape(context.hiddens));
                for (i = 0, l = hiddens.length; i < l; i++) {
                    layer = this.Util.getLayerByMspID(hiddens[i]);
                    if (layer) {
                        this.Util.setVisibility(layer, false);
                    }
                }
            }

            /*
             * Searchs
             */
            if (context.hasOwnProperty('searchs')) {

                var searchs = msp.Util.unserialize(unescape(context.searchs));

                /*
                 * Roll over searchs
                 */
                for (i = 0, l = searchs.length; i < l; i++) {

                    layer = this.Util.getLayerByMspID(searchs[i].mspID);

                    /*
                     * layer exists...
                     */
                    if (layer) {

                        /*
                         * ...and has a valid searchContext
                         */
                        var searchContext = layer["_msp"].searchContext;
                        if (searchContext) {

                            /*
                             * Update the search items
                             */
                            searchContext.items = searchs[i].items;

                            /*
                             * Launch unitary search -
                             * Note that zoomOnAfterLoad is set to false to avoid
                             * a zoom on catalog result after a successfull search
                             */
                            layer["_msp"].zoomOnAfterLoad = false;
                            searchContext.search(null,searchs[i].nextRecord);

                        }
                    }
                }

            }

        },
        
        /*
         * Called when features are added to layer
         *
         * @param <Object> layer
         *
         */
        onFeaturesAdded: function(layer) {

            /*
             * Update index
             */
            this.Util.updateIndex(layer);

            /*
             * Tell Map that map.layers changed
             */
            this.events.trigger("layersend", {
                action:"features",
                layer:layer
            });
        },

        /*
         * Return map context in URL form
         * Map context is :
         *  - map extent
         *  - map layers (including catalogs)
         */
        getContext: function() {

            /*
             * Get map center in Lat/Lon (epsg:4326)
             */
            var center = this.Util.p2d(this.map.getCenter());

            /*
             * Initialize serialized add string
             */
            var add = "[",
            isFirst = true,
            isFirstHidden = true,
            searchs = [],
            hiddens = "[",
            remove = "[",
            mspID,
            i,
            layer,
            l;

            /*
             * Roll over each layer that is not a Config.layers layer
             * (i.e. do not use layer added during application startup)
             */
            for(i = 0, l = this.map.layers.length; i < l; i++) {

                /*
                 * Retrieve current layer
                 */
                layer = this.map.layers[i];

                /*
                 * Paranoid mode...
                 */
                if (layer["_msp"]) {

                    /*
                     * Layer is hidden
                     */
                    if (!layer.getVisibility() && !layer.isBaseLayer) {
                        if(!isFirstHidden) {
                            hiddens += ",";
                        }
                        hiddens += layer["_msp"].mspID;
                        isFirstHidden = false;
                    }

                    /*
                     * Only add layers that are not initialLayers
                     */
                    if (!layer["_msp"].initialLayer) {

                        if (!isFirst) {
                            add += ",";
                        }

                        /*
                         * Add layerDescription to the add serialized string
                         * Avoid the infinite loop problem by checking the non-existence
                         * of a reference to the layer object
                         */
                        if (layer["_msp"].layerDescription && !layer["_msp"].layerDescription.layer) {
                            add += msp.Util.serialize(layer["_msp"].layerDescription);
                            isFirst = false;
                        }
                    }

                    /*
                     * Serialize search context
                     */
                    if (layer["_msp"].searchContext && layer["_msp"].searchContext.items.length > 0) {
                        searchs.push({
                            mspID:layer["_msp"].mspID,
                            items:layer["_msp"].searchContext.items,
                            nextRecord:layer["_msp"].searchContext.nextRecord
                        });
                    }
                }
            }


            /*
             * Initialize serialized remove string
             */
            isFirst = true;

            /*
             * Roll over each initial layers that have been removed
             */
            for (i = 0, l = this.removedLayers.length; i < l; i++) {

                if (!isFirst) {
                    remove += ",";
                }

                /*
                 * Add mspID to the remove serialized string
                 */
                mspID = this.removedLayers[i].mspID;
                if (mspID) {
                    remove += msp.Util.serialize(mspID);
                    isFirst = false;
                }

            }

            /*
             * Initialize serialized context string
             */
            return "&lon=" + center.lon
            +"&lat=" + center.lat
            +"&zoom=" + this.map.getZoom()
            +"&add=" + escape(add+"]")
            +"&remove=" + escape(remove+"]")
            +"&searchs=" + escape(msp.Util.serialize(searchs))
            +"&bg=" + this.map.baseLayer["_msp"].mspID
            +"&hiddens=" + escape(hiddens+"]");

        },
        
        /**
         * Map initialization
         *
         * config : msp.config object
         * urlParameters: window.location.href key/value pair if any
         */
        init: function(_config) {
            
            /*
             * Reference to Map object
             */
            var self = this;
            
            /**
             * Set OpenLayers config option
             */
            OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

            /**
             * Set the ProxyHost URL to bypass cross-scripting javascript
             */
            OpenLayers.ProxyHost = msp.Util.proxify("");

            /**
             * Disable select feature on map pan
             */
            OpenLayers.Handler.Feature=OpenLayers.Class(OpenLayers.Handler.Feature,{
                stopDown:false
            });

            /*
             * Set projection alias between old EPSG:900913 and correct EPSG:3857
             * for SphericalMercator projection
             */
            OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:3857", OpenLayers.Layer.SphericalMercator.projectForward);
            OpenLayers.Projection.addTransform("EPSG:3857", "EPSG:4326", OpenLayers.Layer.SphericalMercator.projectInverse);

            /*
             * OpenLayers 2.11 and >
             * Add support for SVG2 by default
             */
            OpenLayers.Layer.Vector.prototype.renderers = ["SVG", "VML", "Canvas"];

            /**
             * Force msp CSS to overide default OpenLayers CSS
             */
            _config.mapOptions.theme = null;
            
            /*
             * Set initialLocation
             */
            self.initialLocation = _config["general"].initialLocation;

            /*
             * Hack : if Map height is set to auto, it is assumed that the Map div
             * height cover 100% of the navigator window minus a fixed sized header.
             * So the Map height is set to window height minus Map.css('top') value
             * The 'processHeightOnResize' class is also added to msp.$map in order to
             * reprocess the width when window is resized (see msp.resize() method)
             */
            if (msp.$map.css('height') === 'auto' || msp.$map.css('height') === '0px') {
                msp.$map.css('height', window.innerHeight - msp.$map.offset().top);
                msp.$map.addClass('processHeightOnResize')
            }

            /**
             * Prepare the navigation control
             *
             * If device is a touch device, enable TouchNavigation
             * instead of Navigation
             */
            if (msp.Util.device.touch) {
                _config.mapOptions.controls = [new OpenLayers.Control.TouchNavigation({
                    id:"__CONTROL_NAVIGATION__",
                    dragPanOptions: {
                        enableKinetic: true
                    }
                })];
            }
            else {
                _config.mapOptions.controls = [new OpenLayers.Control.Navigation({
                    id:"__CONTROL_NAVIGATION__",
                    documentDrag: true
                })];
            }

            /**
             * Create the mapfile
             */
            self.map = new OpenLayers.Map(msp.$map.attr('id'), _config.mapOptions);

            /**
             * Add a very first empty baseLayer to the map
             * Usefull to avoid crash if no baseLayer are specified
             */
            self.map.addLayer(new OpenLayers.Layer("EmptyBaseLayer", {
                _msp:{
                    mspID:"EmptyBaseLayer"
                },
                isBaseLayer:true,
                displayInLayerSwitcher:false
            }));

            /**
             * Initialize jFeatureInfo
             */
            self.featureInfo.init();
            
            /*
             * Create an events object
             */
            self.events = new self.Events(self);
            
            /*
             * Update menu position on map move
             */
            self.map.events.register('move', self.map, function(){
                if (msp.menu) {
                    msp.menu.updatePosition();
                }
            });
            
            /*
             * Call Map 'moveend' events on map 'moveend'
             */
            self.map.events.register('moveend', self, function(){
                msp.Map.events.trigger('moveend');
            });

            /**
             * Disable mouse right click within 'msp.$map' div
             */
            msp.$map.mousedown(function(e){
                if (OpenLayers.Event.isLeftClick(e)){
                    return true;
                }
                if (OpenLayers.Event.isRightClick(e)){
                    return false;
                }
                return true;
            });

            /**
             * onmouseover event definition is only
             * valid if the current device is not a touch device
             */
            if(!msp.Util.device.touch) {

                /*
                 * Create "coords" div to display mouse position info
                 */
                if (_config["general"].displayCoordinates) {

                    /*
                     * "coords" is created under Map only if it's not already defined within the html page
                     * (Note : this allow to display coordinates outside the map)
                     */
                    if ($('#coords').length === 0) {
                        msp.Util.$$('#coords', msp.$map);
                    }
                    
                    self.$coords = $('#coords');
                }

                /*
                 * Create jHiliteFeature div to display hilited feature info
                 */
                if (_config["general"].featureHilite) {

                    /*
                     * featureHilite is created under Map only if it's not already defined within the html page
                     * (Note : this allow to display hilited feature info outside the map)
                     */
                    if (self.$featureHilite.length === 0) {
                        self.$featureHilite = msp.Util.$$('#'+msp.Util.getId(), msp.$map).addClass("featureHilite shadow").hide();
                    }

                }

                /*
                 * Define action on mousemove
                 */
                msp.$map.mousemove(function (e){

                    /*
                     * Set the mousePosition object
                     */
                    var offset = msp.$map.offset(),
                        lonlat,
                        positionInfo;
                        
                    msp.Map.mousePosition = new OpenLayers.Pixel(e.pageX - offset.left, e.pageY - offset.top);

                    /*
                     * Display the mouse position if Config.general.displayCoordinates is set to true
                     */
                    if (_config["general"].displayCoordinates) {

                        lonlat = self.Util.p2d(msp.Map.map.getLonLatFromPixel(msp.Map.mousePosition));
                        positionInfo = "Lon: "+lonlat.lon.toFixed(5)+"&deg;, Lat: "+lonlat.lat.toFixed(5)+"&deg;";
                        msp.Map.$coords.html(positionInfo).css({
                            'top': msp.Map.mousePosition.y - 20,
                            'left': msp.Map.mousePosition.x
                        }).show();
                      
                    }

                    /*
                     * Display hilited feature
                     */
                    self.$featureHilite.css({
                        'top': msp.Map.mousePosition.y + 30,
                        'left': msp.Map.mousePosition.x + 15
                    });

                    return true;
                });

                /*
                 * Hide divs when mouse is outside of msp.$map
                 */
                msp.$map.mouseout(function (e){
                    msp.Map.$coords.hide();
                    self.$featureHilite.hide();
                    return true;
                });

            }

            /*******************************************
             *
             * Layers
             *
             *******************************************/

            /**
             * Initialize groups
             */
            if (_config.groups) {
                for (var i=0, l = _config.groups.length; i < l; i++) {
                    self.layersGroup[_config.groups.name] = new self.LayersGroup(self, _config.groups.name, _config.groups.icon);
                }
            }

            /**************************************************
             *
             * Controls
             *
             *  Controls ids should be defined as follow :
             *  __CONTROL_NAME_OF_CONTROL__
             *
             **************************************************/

            var controls = [];

            /*
             * Select feature Control :
             *  This control is always active except during drawing
             */
            controls.push(new OpenLayers.Control.SelectFeature(self.selectableLayers.items, {
                id: "__CONTROL_SELECT__",
                clickout:false,
                toggle:true,
                multiple:false,
                hover:false
            }));

            /*
             * Hilite feature Control
             */
            if (_config.general.featureHilite) {
                controls.push(new OpenLayers.Control.SelectFeature(self.selectableLayers.items, {
                    id: "__CONTROL_HIGHLITE__",
                    hover:true,
                    highlightOnly:true,
                    eventListeners: {
                        beforefeaturehighlighted:function(e){

                            /*
                             * If jMenu is visible do not hilite feature
                             * to avoid 'post modern art flickering' effect
                             */
                            if (msp.menu && msp.menu.$m.is(':visible')) {
                                return false;
                            }
                            /*
                             * Paranoid mode
                             */
                            if (e.feature) {

                                /*
                                 * Title is first 'name' or 'title' or 'identifier' or 'id'
                                 */
                                var title = msp.Map.featureInfo.getTitle(e.feature);
                                self.$featureHilite.html(title).show();

                            }

                            return true;
                        },
                        featureunhighlighted:function(e){
                            self.$featureHilite.empty().hide();
                        }
                    }
                }));
            }

            /*
             * Extend Click control to add msp specific
             * functionnality (i.e. menu display)
             */
            OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
                defaultHandlerOptions: {
                    'single':true,
                    'double':true,
                    'pixelTolerance':0,
                    'stopSingle':false,
                    'delay':200,
                    'stopDouble':false
                },
                initialize: function(options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                    {}, this.defaultHandlerOptions
                        );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                        );
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click':this.trigger
                        }, this.handlerOptions
                        );
                },
                trigger: function(e) {
                    msp.Map.mouseClick = e.xy.clone();
                    msp.menu.show();
                }

            });

            /*
             * Click control
             */
            controls.push(new OpenLayers.Control.Click({
                id:"__CONTROL_CLICK__"
            }));

            /*
             * Attribution control (see OpenLayers documentation)
             */
            controls.push(new OpenLayers.Control.Attribution({
                id:"__CONTROL_ATTRIBUTION__"
            }));

            /*
             * Add controls to the map
             */
            self.map.addControls(controls);

            /*
             * Overview map control
             */
            if (_config.general.displayOverviewMap) {
                var overviewMapExtent = new OpenLayers.Bounds(-180,-90,180,90);
                var overviewMapControl = new OpenLayers.Control.OverviewMap({
                    mapOptions: {
                        theme:false,
                        projection:this.map.displayProjection,
                        maxExtent:overviewMapExtent,
                        numZoomLevels:1,
                        autoPan:false,
                        restrictedExtent:overviewMapExtent
                    },
                    /* By default, overviewmap is minimized */
                    maximized:false,
                    size:new OpenLayers.Size('300','150'),
                    layers:[new OpenLayers.Layer.Image('ImageLayer', msp.Util.getImgUrl('overviewmap.png'),
                        overviewMapExtent,
                        new OpenLayers.Size('300','150')
                        )]
                });
                self.map.addControl(overviewMapControl);
            }

            /**
             * Set map center.
             * Map is centered at Lat=15 & Lon=0 with a zoom level of 2 unless a map.restrictedExtent
             * is defined. In this case, the map is centered to this restrictedExtent
             */
            self.map.restrictedExtent ? self.map.zoomToExtent(self.map.restrictedExtent) : self.setCenter(self.Util.d2p(new OpenLayers.LonLat(self.initialLocation.lon,self.initialLocation.lat)), self.initialLocation.zoom, true);

            /**
             * Set lowest zoom level
             * The map cannot be zoomout to a lower value than lowestZoomLevel
             */
            self.lowestZoomLevel = self.map.getZoom();

            /**
             * Set timer for layers with automatic refresh
             * We do not use a setInterval function but a
             * synchronized setTimeout to guarantee that actions
             * are executed before a new setTimeout is launched
             */
            (function loopsiloopsi(){
                /**
                 * Update the refreshCycle counter
                 */
                msp.Map.refreshCycle++;
                var i,
                    layer;
                for (i=msp.Map.map.layers.length;i--;) {
                    layer = msp.Map.map.layers[i];

                    /**
                     * Switch over non-backgrounds layer
                     * (i.e. isBaseLayer = false)
                     */
                    if (!layer.isBaseLayer && layer["_msp"]) {
                        if (layer["_msp"].refresh && ((msp.Map.refreshCycle % layer["_msp"].refreshFactor) === 0)) {
                            layer.refresh({
                                force:true
                            });
                        }

                    }
                }

                /**
                 * Respawn a timetout AFTER previous code has been executed
                 */
                window.setTimeout(loopsiloopsi, msp.Config["general"].refreshInterval || 1000);

            })();
            
            /*
             * Set __CONTROL_CLICK__ the default map control
             */
            self.resetControl(self.Util.getControlById("__CONTROL_CLICK__"));

            /*
             * Add msp event : update map size when window size change
             */
            msp.events.register("resizeend", self, function(self) {
                
                /*
                 * Update map size
                 */
                self.map.updateSize();
                
                /*
                 * Trigger 'resizeend' event for each registered plugins
                 */
                self.events.trigger("resizeend");
                
            });
            
            /*
             * Add mapshup logo on top of the map
             */
            msp.Util.$$('#msplogo', msp.$map).append('<a href="http://www.mapshup.info" target="_blank"><img src="img/mapshuplogo.png" class="middle" title="Powered by mapshup"/></a>');

        },

        /**
         * Remove layer
         */
        removeLayer: function(layer, confirm) {

            /*
             * Paranoid mode
             */
            if (!layer) {
                return false;
            }

            /*
             * Ask for deletion :
             *  - if it is requested in the query
             *  - and if msp.Config.general.confirmDeletion is set to true
             */
            if (confirm) {

                msp.Util.askFor(msp.Util._("Delete layer"), msp.Util._("Do you really want to remove layer")+" "+layer.name, "list", [{
                    title:msp.Util._("Yes"), 
                    value:"y"
                },
                {
                    title:msp.Util._("No"), 
                    value:"n"
                }
                ], function(v){
                    if (v === "y") {
                        msp.Map.removeLayer(layer);
                    }
                });

                return false;
            }

            /*
             * !Important! set a layer._tobedestroyed property to true
             * to indicate to msp processing that this layer will be 
             * removed at the end of this function
             * (e.g. see LayersManager plugin)
             */
            layer._tobedestroyed = true;
                    
            /*
             * Trigger "layersend" to registered handlers
             */
            this.events.trigger("layersend", {
                action:"remove",
                layer:layer
            });

            /*
             * Remove layer from selectableLayers list
             * !!! important !!!
             */
            this.selectableLayers.remove(layer);

            /*
             * Remove layer from group if any
             */
            if (layer["_msp"] && layer["_msp"].group) {
                layer["_msp"].group.remove(layer);
            }

            /*
             * If layer is an initial layer then its mspID is stored
             * to be sure that it will be indicated as removed in the
             * getContext method
             */
            if (layer["_msp"] && layer["_msp"].initialLayer) {
                this.removedLayers.push({
                    mspID:layer["_msp"].mspID,
                    layerDescription:layer["_msp"].layerDescription
                });
            }

            /*
             * Finally remove the layer from msp.Map.map.layers
             */
            layer.destroy();
            
            return true;

        },

        /**
         * Deactivate control and activate SelectFeature control
         */
        resetControl: function(control) {

            if (control) {
                control.deactivate();
                this.Util.getControlById("__CONTROL_CLICK__").activate();
            }

            /*
             * Is this an OpenLayers bug ?
             * We need to reactivate the hfControl and AFTER the sfControl
             * to ensure that highlite/select controls are actives
             */
            var sfControl = this.Util.getControlById("__CONTROL_SELECT__"),
                hfControl = this.Util.getControlById("__CONTROL_HIGHLITE__");

            if (sfControl) {

                /*
                 * Deactivate Select Feature control
                 */
                sfControl.deactivate();

                /*
                 * Deactivate Highlite Feature control if exists
                 */
                if (hfControl) {
                    hfControl.deactivate();
                }

                /*
                 * Reactivate Select/Highlite feature controls if
                 * selectable layers are defined
                 */
                if (this.selectableLayers.items.length>0) {

                    /*
                     * First highlite...
                     */
                    if (hfControl) {
                        hfControl.activate();
                    }

                    /*
                     * ...and AFTER select
                     */
                    sfControl.activate();
                }
            }
        },

        /**
         * Setcenter
         */
        setCenter: function(lonlat,zoom,doNotLog) {
            
            /*
             * Tell Map not to log this map move
             */
            this.doNotLog = doNotLog || false;
            
            if (zoom) {
                this.map.setCenter(lonlat,zoom);
            }
            else {
                if (msp.Util.device.touch || msp.Config["general"].teleport) {
                    this.map.setCenter(lonlat);
                }
                else {
                    this.map.panTo(lonlat);
                }
            }
        },

        /**
         * Zoom to the input bounds + a half of the bounds
         * If bounds is too small (point), then the map is centered on the
         * bounds with a zoom level of 14
         */
        zoomTo: function(bounds) {

            /*
             * Paranoid mode
             */
            if (!bounds) {
                return;
            }

            /*
             * Get the bounds + a half of the bounds 
             */
            var w = bounds.getWidth(),
                h = bounds.getHeight(),
                c = bounds.getCenterLonLat(),
                e = msp.Util._("Cannot zoom : this feature is outside authorized extent");

            /**
             * Bounds is too small => center to bounds
             */
            if (w < 1 && h < 1) {
                if (msp.Map.map.restrictedExtent && !msp.Map.map.restrictedExtent.containsBounds(bounds, true)) {
                    msp.Util.message(e);
                }
                else {
                    msp.Map.map.setCenter(c, 16);
                }
            }
            /**
             * Bounds is ok => zoom to bounds + quarter of bounds
             */
            else {
                //bounds = new OpenLayers.Bounds(c.lon - w * f, c.lat - h * f, c.lon + w * f, c.lat + h * f);
                if (msp.Map.map.restrictedExtent && !msp.Map.map.restrictedExtent.containsBounds(bounds, true)) {
                    msp.Util.message(e);
                }
                else {
                    msp.Map.map.zoomToExtent(bounds);
                }
            }       

        }
        
        
        
    }
    
})(window.msp);