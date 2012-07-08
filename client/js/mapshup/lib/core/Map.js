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
        
        /**
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
         * Stpre current navigation state
         */
        currentState:null,
        
        /*
         * Predefined cluster strategy options
         */
        clusterOpts:{
            distance: 30,
            threshold: 3
        },
        
        /**
         * Plate Carrée projection object
         */
        pc: new OpenLayers.Projection("EPSG:4326"),

        /**
         * Spherical Mercator projection object
         */
        sm: new OpenLayers.Projection("EPSG:900913"),

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
         */
        predefined:{
            
            /**
             * Hash of array containing layerDescription
             * The hash keys are the layerDescription types
             */
            items:[],
            
            /**
             * Add a new layer description to the item list
             */
            add: function(p) {
                
                var i,l,t,
                add = true,
                self = this;
                
                /*
                 * Paranoid mode
                 */
                if (!p || !p.hasOwnProperty("type")) {
                    return false;
                }
                
                /*
                 * Roll over t to check if layer Description already exists
                 */
                self.items[p["type"]] = self.items[p["type"]] || [];
                t = self.items[p["type"]]
                for (i = 0, l = t.length; i < l; i++) {
                    if ((new msp.Map.LayerDescription(t[i], msp.Map)).getMspID() === (new msp.Map.LayerDescription(p, msp.Map)).getMspID()) {
                        add = false;
                        break;
                    }
                }
            
                /*
                 * Add new layer description
                 */
                if (add) {
                    t.push(p);
                }
                
                return true;
            }
            
        },

        /**
         * Number of call to the window.setInterval function
         */
        refreshCycle:0,

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

                /** True : the layer is load during startup */
                initial:msp.Util.getPropertyValue(layerDescription, "initial", false),
                
                /** True : the layer content is initialized */
                initialized:msp.Util.getPropertyValue(_options, "forceInitialized", false),

                /** True : the layer content is loaded */
                isLoaded:true,

                /** Unique msp identifier for this layer */
                mspID:mspID,

                /** LayerDescription for this layer : use for context saving */
                layerDescription:layerDescription,
                
                /** True : the layer is a mapshup layer - mapshup layers are not part of a saved context */
                mspLayer:msp.Util.getPropertyValue(layerDescription, "mspLayer", false),

                /** True : avoid zoomon on layer name click in LayersManager panel */
                noZoomOn:msp.Util.getPropertyValue(layerDescription, "noZoomOn", false),
                
                /** True : for catalog layers, quicklook attached to feature results can be added as an image layer on the map  */
                qlToMap:msp.Util.getPropertyValue(layerDescription, "qlToMap", false),

                /** True : add refresh button in LayersManager panel */
                refreshable:msp.Util.getPropertyValue(layerDescription, "refreshable", false),

                /** Refresh time interval for this layer is multicated by refreshFactor */
                refreshFactor:msp.Util.getPropertyValue(layerDescription, "refreshFactor", 1),

                /** True : layer is selectable through click in the map (i.e. add to __CONTROL_SELECT__) */
                selectable:msp.Util.getPropertyValue(layerDescription, "selectable", msp.Util.getPropertyValue(layerType, "selectable", false)),

                /** True : no remove button in LayersManager panel */
                unremovable:msp.Util.getPropertyValue(layerDescription, "unremovable", false)

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
                 * Tell user a non mapshup layer has been added (only if it has been loaded)
                 */
                if (!newLayer["_msp"].mspLayer && newLayer["_msp"].isLoaded) {
                    msp.Util.message(msp.Util._("Added")+ " : " + msp.Util._(newLayer.name));
                }

                /*
                 * If no "loadstart" has been defined
                 * => add a default "loadstart" event, i.e. show the loading indicator for newLayer
                 */
                if (!newLayer.events.listeners.hasOwnProperty('loadstart') || newLayer.events.listeners['loadstart'].length === 0) {
                    newLayer.events.register("loadstart", newLayer, function() {
                        msp.Map.events.trigger("loadstart", newLayer);
                    });
                }

                /*
                 * If no "loadend" has been defined
                 * => add a default "loadend" event, i.e. hide the loading indicator for newLayer
                 */
                if (!newLayer.events.listeners.hasOwnProperty('loadend') || newLayer.events.listeners['loadend'].length === 0) {
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
                                msp.Util.message(msp.Util._("No result"));
                                return msp.Map.removeLayer(this);
                            }
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
                 * Add newLayer to the TimeLine
                 */
                msp.timeLine.add(newLayer);
                
                /*
                 * First baseLayer is set as the new baseLayer
                 * (i.e. replace the EmptyBaseLayer layer)
                 */
                if (newLayer.isBaseLayer && !this.hasNonEmptyBaseLayer) {
                    this.map.setBaseLayer(newLayer);
                    this.removeLayer(this.Util.getLayerByMspID("EmptyBaseLayer"), false);
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
                
                /*
                 * Set opacity
                 */
                if (layerDescription.opacity) {
                    newLayer.setOpacity(layerDescription.opacity);
                }

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
         * Method: getState
         * Get the current map state and return it.
         *
         * Returns:
         * {Object} An object representing the current state.
         */
        getState:function() {
            return {
                center: this.map.getCenter(),
                resolution: this.map.getResolution(),
                projection: this.map.getProjectionObject(),
                units: this.map.getUnits() || this.map.units || this.map.baseLayer.units
            };
        },

        /**
         * Load a context
         * 
         * Note : every property in a context is optional
         * 
         * Context structure :
         * {
         *      location:{
         *          bg:// Active background layer identifier
         *          lon:// Longitude of map center
         *          lat:// Latitude of map center
         *          zoom:// zoom level of map
         *      },
         *      layers:[
         *          // Layerdescription
         *      ]
         * }
         */
        loadContext: function(context) {

            var id,b,layer,i,j,k,l,s,
            self = this;

            /*
             * Paranoid mode
             */
            context = context || {};
            
            /*
             * Set location
             */
            if (context.location) {
                self.map.setCenter(self.Util.d2p(new OpenLayers.LonLat(context.location.lon,context.location.lat)), Math.max(context.location.zoom, self.lowestZoomLevel));
            }
            
            /*
             * Set layers
             */
            context.layers = context.layers || [];
            
            /*
             * Parse context layer descriptions and compare
             * it with existing layers.
             * 
             * Three case are possibles :
             * 
             *   - context layers that are not in the map are added
             *   - map layers that are not in the context are removed
             *   - context layers that are already in the map are updated
             */
            
            /*
             * Remove layers
             */
            for (i = 0, l = self.map.layers.length; i < l; i++) {
                
                /*
                 * By default, remove the layer
                 */
                b = true;
                
                layer = self.map.layers[i];
                
                /*
                 * mapshup layers are excluded from the processing
                 */
                if (layer && layer["_msp"] && !layer["_msp"].mspLayer) {
                    
                    id = layer["_msp"].mspID;
                    
                    /*
                     * Roll over context layers
                     */
                    for (j = 0, k = context.layers.length; j < k; j++) {
                        
                        /*
                         * The layer is present in the context layer list. No need to remove it
                         */
                        if (id === (new self.LayerDescription(context.layers[j], self)).getMspID()) {
                            b = false;
                            break;
                            
                        }

                    }
                    
                    /*
                     * Remove the layer
                     */
                    if (b) {
                        self.removeLayer(self.Util.getLayerByMspID(id), false);
                    }
                    
                }
                
                
            }
            
            /*
             * Add or update layers
             */
            for (i = 0, l = context.layers.length; i < l; i++) {
                
                id = (new self.LayerDescription(context.layers[i], self)).getMspID();
                
                /*
                 * By default, add the layer
                 */
                b = true;
                
                /*
                 * Roll over existing layers
                 */
                for (j = 0, k = self.map.layers.length; j < k; j++) {
                    
                    layer = self.map.layers[j];
                    
                    /*
                     * mapshup layers are excluded from the processing
                     */
                    if (layer["_msp"] && !layer["_msp"].mspLayer) {
                        
                        /*
                         * The layer already exist - update it
                         */
                        if (id === layer["_msp"].mspID) {
                            b = false;
                            break;
                        }
                        
                    }
                    
                }
                
                /*
                 * Add layer
                 */
                if (b) {
                    self.addLayer(context.layers[i],{
                        noDeletionCheck:true,
                        forceInitialized:true
                    });
                }
                /*
                 * Update layer
                 */
                else {
                    
                    /*
                     * Set visibility
                     */
                    if (!layer.isBaseLayer) {
                        msp.Map.Util.setVisibility(layer, !context.layers[i].hidden);
                    }
                    
                    /*
                     * Launch search on catalogs
                     */
                    s = context.layers[i].search;
            
                    if (s) {

                        //
                        // Update the search items
                        //
                        layer["_msp"].searchContext.items = s.items;

                        //
                        // Launch unitary search
                        //
                        layer["_msp"].searchContext.search(s.nextRecord);

                    }
                    
                }
            }
            
            /*
             * Set default background
             */
            if (context.location.bg) {
                layer = self.Util.getLayerByMspID(context.location.bg);
                if (layer && layer.isBaseLayer) {
                    self.map.setBaseLayer(layer);
                }
            }
            
        },
        
        /*
         * Get current map context represented by
         * 
         *  - map extent
         *  - layers list
         *  - MMI status (TODO)
         *  
         */
        getContext: function() {

            var i,l,layer,c,key,center,ld, self = this;
            
            /*
             * Get map center in Lat/Lon (epsg:4326)
             */
            center = self.Util.p2d(self.map.getCenter()); 

            /*
             * Initialize context
             */
            c = {
                location:{
                    bg:self.map.baseLayer["_msp"].mspID,
                    lat:center.lat,
                    lon:center.lon,
                    zoom:self.map.getZoom()
                },
                layers:[]
            };
            
            /*
             * Roll over each layer
             */
            for (i = 0, l = self.map.layers.length; i < l; i++) {

                /*
                 * Retrieve current layer
                 */
                layer = self.map.layers[i];

                /*
                 * mapshup layers (i.e. mspLayer) are not stored in the context
                 */
                if (layer["_msp"] && layer["_msp"].layerDescription && !layer["_msp"].mspLayer) {

                    /*
                     * Initialize object with an initial property set to true to indicate that
                     * layer has been added through context
                     */
                    ld = {
                        initial:true
                    };
                    
                    /*
                     * Clone layerDescription omitting layer and ol properties
                     * to avoid serialization cycling during JSON.stringify processing
                     */
                    for (key in layer["_msp"].layerDescription) {
                        if (key !== "layer" && key !== "ol") {
                           ld[key] = layer["_msp"].layerDescription[key];
                        }
                    }
                    
                    /*
                     * Layer is hidden
                     */
                    ld.hidden = !layer.getVisibility() && !layer.isBaseLayer ? true : false;
                    
                    /*
                     * Layer got a non empty searchContext
                     */
                    if (layer["_msp"].searchContext && layer["_msp"].searchContext.items.length > 0) {
                        ld.search = {
                            mspID:layer["_msp"].mspID,
                            items:layer["_msp"].searchContext.items,
                            nextRecord:layer["_msp"].searchContext.nextRecord
                        }
                    }
                    
                    /*
                     * Add a layer description
                     */
                    c.layers.push(ld);
                    
                }
                
            }

            /*
             * Return context
             */
            return c;
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
             * OpenLayers 2.12 support SVG2 by default
             */
            OpenLayers.Layer.Vector.prototype.renderers = ["SVG", "VML", "Canvas"];

            /**
             * Force msp CSS to overide default OpenLayers CSS
             */
            _config.mapOptions.theme = null;
            
            /*
             * Set initialLocation
             */
            self.initialLocation = _config["general"].location;

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
            var opt = {
                id:"__CONTROL_NAVIGATION__",
                documentDrag: true,
                /* Disable oncontextmenu on right clicks */
                handleRightClicks:true,
                zoomWheelEnabled:true,
                mouseWheelOptions:{
                    interval:200,
                    cumulative:false
                },
                dragPanOptions:{
                    enableKinetic:true,
                    /*
                     * When drag starts, store the clicked point and the time of click in milliseconds
                     */
                    panMapStart:function(e){
                        
                        // Begin reproduce OpenLayers DragPan.js panMapStart function
                        if(this.kinetic) {
                            this.kinetic.begin();
                        }
                        // End reproduce OpenLayers DragPan.js panMapStart function
                        
                        self._clk = {
                            x:e.x,
                            y:e.y,
                            d:(new Date()).getTime()
                        };
                        return true;
                    },
                    /*
                     * When mouse up, if mouse have not moved and if the time between up and down is large enough,
                     * then display the contextual menu
                     */
                    panMapUp:function(e){
                        if (self._clk) {
                            
                            /*
                             * No drag occured
                             */
                            if (e.x === self._clk.x && e.y === self._clk.y) {
                                
                                /*
                                 * User clicks was larger enough to display the contextual menu
                                 */
                                if ((new Date()).getTime() - self._clk.d > 200) {
                                    self.mouseClick = {
                                        x:e.x,
                                        y:e.y
                                    };
                                    msp.menu.show();
                                }
                                
                            }
                        }
                        return true;
                    }
                }
            };
            _config.mapOptions.controls = msp.Util.device.touch ? [new OpenLayers.Control.TouchNavigation(opt)] : [new OpenLayers.Control.Navigation(opt)];
            
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

            /*
             * Create an events object
             */
            self.events = new self.Events(self);
            
            /*
             * Initialize featureInfo
             */
            self.featureInfo = new self.FeatureInfo();
            
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
                
                /*
                 * Propagate moveend to registered plugin
                 */
                msp.Map.events.trigger('moveend');
                
                /*
                 * Store the new lastExtent
                 */
                self.currentState = msp.Map.getState();
                
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
                        self.$featureHilite = msp.Util.$$('#'+msp.Util.getId(), msp.$map).addClass("featureHilite").hide();
                    }

                }

                /*
                 * Define action on mousemove
                 */
                msp.$map.mousemove(function (e){

                    /*
                     * Set the mousePosition object
                     */
                    var offset = msp.$map.offset();
                        
                    msp.Map.mousePosition = new OpenLayers.Pixel(e.pageX - offset.left, e.pageY - offset.top);

                    /*
                     * Display the mouse position if Config.general.displayCoordinates is set to true
                     */
                    if (_config["general"].displayCoordinates) {
                        msp.Map.$coords.html(msp.Map.Util.getFormattedLonLat(self.Util.p2d(msp.Map.map.getLonLatFromPixel(msp.Map.mousePosition)), msp.Config["general"].coordinatesFormat)).css({
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
             * Groups
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
             * ScaleLine control
             */
            if (_config.general.displayScale && $.isFunction(OpenLayers.Control.ScaleLine)) {
                controls.push(new OpenLayers.Control.ScaleLine({
                    id: "__CONTROL_SCALELINE__",
                    /* Geodetic measurement is activated for Spherical Mercator measurements */
                    geodetic:self.map.projection.projCode === "EPSG:3857" ? true : false
                }));
            }
            
            /*
             * Select feature Control :
             *  This control is always active except during drawing
             */
            controls.push(new OpenLayers.Control.SelectFeature(self.selectableLayers.items, {
                id: "__CONTROL_SELECT__",
                clickout:false,
                toggle:false,
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
                                 * Never hilite an already selected feature
                                 */
                                if (msp.Map.featureInfo.selected) {
                                    if (msp.Map.featureInfo.selected.id === e.feature.id) {
                                        self.$featureHilite.empty().hide();
                                        return false;
                                    }
                                }
                                
                                /*
                                 * Title is first 'name' or 'title' or 'identifier' or 'id'
                                 */
                                self.$featureHilite.html(msp.Map.Util.Feature.getTitle(e.feature)).attr("hilited", "hilited").show();

                            }
                            
                            return true;
                        },
                        featureunhighlighted:function(e){
                            self.$featureHilite.empty().attr("hilited", "").hide();
                        }
                    }
                }));
            }

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
            if (_config.general.overviewMap !== "none") {
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
                    /* Overviewmap is visibility */
                    maximized:_config.general.overviewMap === "opened" ? true : false,
                    size:new OpenLayers.Size('250','125'),
                    layers:[new OpenLayers.Layer.Image('ImageLayer', msp.Util.getImgUrl('overviewmap.png'),
                        overviewMapExtent,
                        new OpenLayers.Size('250','125')
                        )]
                });
                self.map.addControl(overviewMapControl);
            }

            /**
             * Set map center.
             * Map is centered at initialLocation unless a map.restrictedExtent
             * is defined. In this case, the map is centered to this restrictedExtent
             */
            self.map.restrictedExtent ? self.map.zoomToExtent(self.map.restrictedExtent) : self.setCenter(self.Util.d2p(new OpenLayers.LonLat(self.initialLocation.lon,self.initialLocation.lat)), self.initialLocation.zoom, true);
            
            /**
             * Set lowest zoom level
             * The map cannot be zoomout to a lower value than lowestZoomLevel
             */
            //self.lowestZoomLevel = self.map.getZoom();
            self.lowestZoomLevel = 0;

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
             * Set __CONTROL_NAVIGATION__ the default map control
             */
            self.resetControl(self.Util.getControlById("__CONTROL_NAVIGATION__"));

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
            if (confirm && msp.Config["general"].confirmDeletion) {

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
             * Remove SearchContext within layer
             */
            if (layer["_msp"] && layer["_msp"].SearchContext) {
                msp.remove(layer["_msp"].SearchContext);
            }

            /*
             * Remove layer from TimeLine
             */
            msp.timeLine.remove(layer);
            
            /*
             * If layer is an initial layer then its mspID is stored
             * to be sure that it will be indicated as removed in the
             * getContext method
             */
            if (layer["_msp"] && layer["_msp"].mspLayer) {
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
                this.Util.getControlById("__CONTROL_NAVIGATION__").activate();
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

        /*
         * Setcenter
         */
        setCenter: function(lonlat,zoom,doNotLog) {
            
            /*
             * Tell Map not to log this map move
             */
            this.doNotLog = doNotLog || false;
            
            if (zoom !== null) {
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

            var self = this;
            
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
                if (self.map.restrictedExtent && !self.map.restrictedExtent.containsBounds(bounds, true)) {
                    msp.Util.message(e);
                }
                else {
                    self.map.setCenter(c, Math.max(9,self.map.getZoom()));
                }
            }
            /**
             * Bounds is ok => zoom to bounds + quarter of bounds
             */
            else {
                if (self.map.restrictedExtent && !self.map.restrictedExtent.containsBounds(bounds, true)) {
                    msp.Util.message(e);
                }
                else {
                    self.map.zoomToExtent(bounds);
                }
            }       

        }
        
        
    }
    
})(window.msp);