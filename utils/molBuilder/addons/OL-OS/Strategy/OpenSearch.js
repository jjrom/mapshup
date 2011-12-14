/* Copyright (c) 2006-2010 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: OpenLayers.Strategy.OpenSearch
 * A strategy that queries to OpenSearch service and displays results.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.OpenSearch = OpenLayers.Class(OpenLayers.Strategy, {

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * layer.events.register(type, obj, listener);
     * (end)
     *
     * Supported OpenLayers.Strategy.OpenSearch event types:
     * descriptionloadend - fires when description document has been parsed
     */
    EVENT_TYPES: ["descriptionloadend"],

    /**
     * APIProperty: events
     * {<OpenLayers.Events>}
     */
    events: null,

    /**
     * APIProperty: search engine description object
     */
    description: null,

    /**
     * zoom on result
     */
    zoomOnResult: false,

    /**
     * Constructor: OpenLayers.Strategy.OpenSearch
     * Create a new OpenSearch strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance. A "descriptionurl" property is mandatory.
     */
    initialize: function(options) {
        
        OpenLayers.Strategy.prototype.initialize.apply(this, [options]);
    
        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);
    
        // Read OpenSearch description document
        var openSearchDescription = new OpenLayers.Protocol.HTTP({
            url: this.descriptionurl,
            format: new OpenLayers.Format.OpenSearchDescription(),
            callback: this.loadDescription,
            scope: this
        });
    
        openSearchDescription.read();
    },

    /**
     * Method: loadDescription
     * Read the parsed description. Automatically chooses one of the
     * supported response formats: KML, Atom, GeoJSON, GeoRSS.
     * 
     * Returns:
     * false if error occurs 
     */
    loadDescription: function(response) {
        this.description = response.features;
        
        if(!this.description) {
            OpenLayers.Console.warn("Could not parse description document from: " + this.descriptionurl);
            this.events.triggerEvent("descriptionloadend", {
                url: this.descriptionurl,
                description: null
            });
            return false;
        }

        this.layer.attribution = this.description.attribution;
    
        if (this.description.formats.KML) {
            this.format = new OpenLayers.Format.KML({
                kmlns: "http://www.opengis.net/kml/2.2",
                extractStyles: false
            });
            OpenLayers.Util.extend(this, this.description.formats.KML);
        } else if (this.description.formats.Atom) {
            this.format = new OpenLayers.Format.Atom();
            OpenLayers.Util.extend(this, this.description.formats.Atom);
        } else if (this.description.formats.GeoJSON) {
            this.format = new OpenLayers.Format.GeoJSON();
            OpenLayers.Util.extend(this, this.description.formats.GeoJSON);
        } else if (this.description.formats.GeoRSS) {
            this.format = new OpenLayers.Format.GeoRSS();
            OpenLayers.Util.extend(this, this.description.formats.GeoRSS);
        } else {
            OpenLayers.Console.warn(this.description.name + ": Response formats not supported");
            this.events.triggerEvent("descriptionloadend", {
                url: this.descriptionurl,
                description: null
            });
            return false;
        }

        this.layer.projection = new OpenLayers.Projection("EPSG:4326");
            
        OpenLayers.Console.log(this.description);
        this.events.triggerEvent("descriptionloadend", {
            url: this.descriptionurl,
            description: this.description
            });
        
        return true;
    },
    
    /**
     * APIMethod: setSearchTerms
     * Set the text to search for, and fires a request to the search engine
     * 
     */
    setSearchTerms: function(searchTerms) {
        if(this.searchParams != null && this.searchParams.searchTerms != null) {
            this.searchParams.searchTerms = encodeURIComponent(searchTerms);
            if (this.active) {
                if (this.searchParams.searchTerms.length > 0) {
                    this.search();
                } else {
                    this.merge();
                }
            }
        }
    },
    
    /**
     * Method: search
     */
    search: function() {
        if(this.layer.protocol)
            this.layer.protocol.abort(this.response);
       
        this.layer.protocol = new OpenLayers.Protocol.HTTP({
            "format": this.format
        });
        
        if(this.searchParams != null && this.searchParams["geo:box"] != null) {
            var remote = this.layer.projection;
            var local = this.layer.map.getProjectionObject();
            // BBOX is the viewport (e1), but restricting also to map maxextent (e2)
            var e1 = this.layer.map.getExtent().clone().transform(local, remote);
            var e2 = this.layer.map.getMaxExtent().clone().transform(local, remote);
            var bbox = new OpenLayers.Bounds(
                Math.max(e1.left, e2.left),
                Math.max(e1.bottom, e2.bottom),
                Math.min(e1.right, e2.right),
                Math.min(e1.top, e2.top)).toBBOX();
            this.searchParams["geo:box"] = bbox;
            OpenLayers.Console.debug(bbox);
        }
        /* Added by jrom for mapshup - http://mapshup.info */
        if (this.searchParams != null && this.searchParams["lang"] != null) {
            if (msp != null) {
                this.searchParams["lang"] = msp.Config.i18n.lang;
            }
        }
        /* end added by jrom */
        this.layer.events.triggerEvent("loadstart");
        
        this.response = this.layer.protocol.read({
            url: this.buildRequestURL(),
            callback: this.merge,
            scope: this
        });
    },

    /**
     * Method: buildRequestURL
     */
    buildRequestURL: function() {
        var url = this.URLTemplate;
        for (var name in this.searchParams){
            var value = this.searchParams[name];
            var regex = new RegExp("\\{"+name+"\\??\\}");
            url = url.replace(regex, value);
        }
        OpenLayers.Console.debug(url);
        return url;
    },
    
    /**
     * Method: merge
     * Adds features to the layer.
     * If the layer projection differs from the map projection, features
     * will be transformed from the layer projection to the map projection.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object passed
     *      by the protocol.
     */
    merge: function(resp) {
        this.layer.destroyFeatures();
        /* Removed by jrom */
        //this.layer.setName(this.description.name + " results");
        if(resp) {
            var features = resp.features;
            if(features && features.length > 0) {
                var remote = this.layer.projection;
                var local = this.layer.map.getProjectionObject();
                if(!local.equals(remote)) {
                    var geom;
                    for(var i=0, len=features.length; i<len; ++i) {
                        geom = features[i].geometry;
                        if(geom) {
                            geom.transform(remote, local);
                        }
                    }
                }
                this.layer.addFeatures(features);
                /* Add by jrom */
                if (msp) {
                    msp.Map.onFeaturesAdded(this.layer);
                }
                /* End Add by jrom */
                if (this.zoomOnResult) {
                    this.layer.map.zoomToExtent(this.layer.getDataExtent());
                }
            }
        }
        this.layer.events.triggerEvent("loadend");
    },

    CLASS_NAME: "OpenLayers.Strategy.OpenSearch" 
});
