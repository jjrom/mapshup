/* Copyright (c) 2006-2010 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Console.js
 */

/**
 * Class: OpenLayers.Format.OpenSearchDescription
 * Parse OpenSearch description document with Geo extension, see
 * http://www.opensearch.org/Specifications/OpenSearch/1.1 and
 * http://www.opensearch.org/Specifications/OpenSearch/Extensions/Geo/1.0/Draft_1.
 * Create a new instance with the <OpenLayers.Format.OpenSearchDescription>
 * constructor. 
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OpenSearchDescription = OpenLayers.Class(OpenLayers.Format.XML, {

    xmlns: "http://a9.com/-/spec/opensearch/1.1/",
    geons: "http://a9.com/-/opensearch/extensions/geo/1.0/",

    /**
     * Constructor: OpenLayers.Format.OpenSearchDescription
     * Create a new parser for Open Search description document.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        // compile regular expressions once instead of every time they are used
        this.regExes = {
            extractParams: (/\{(\w|:)+\??\}/g),
            trimCurly: (/(^\{|\??\}$)/g)
        };
    
        this.mimeTypes = {
            "application/vnd.google-earth.kml+xml": "KML",
            "application/atom+xml": "Atom",
            "application/rss+xml": "GeoRSS",
            "application/json": "GeoJSON"
        };
    
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * APIMethod: read
     * Read data from a string. Return a name for the search service
     * and a list of OpenLayers-compatible response formats, along with
     * accepted parameters for each one. 
     * 
     * Parameters: 
     * data    - {String} or {DOMElement} data to read/parse.
     *
     * Returns an object with the structure:
     * {
     *   name: 'search service short name',
     *   attribution: 'copyright notice',
     *   formats: {
     *   	Atom: { // also KML, GeoRSS and/or GeoJSON if present
     *   		URLTemplate: 'Url to construct the query',
     *   		searchParams: {
     *   			SearchTerms: "",
     *   			"geo:box": "",
     *   			//... other params accepted
     *   			}
     *   		}
     *   	}
     *   }
     * }
     */
    read: function(data) {
        var desc = {};
    
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
    
        // Short name
        var shortNameNode = this.getElementsByTagNameNS(data, "*", "ShortName")[0];
        desc.name = this.getChildValue(shortNameNode) || "[no name]";
        
        // URLs
        var urlNodes = this.getElementsByTagNameNS(data, "*", "Url");
        /* Start : added jrom for mapshup http://mapshup.info */
        desc.formats = [];
        for(var i=0, len=urlNodes.length; i<len; i++) {
            var URL = {};
            var type = urlNodes[i].getAttribute("type");
            var format = this.mimeTypes[type];
            var rel = urlNodes[i].getAttribute("rel");
            if (rel && (rel === "jeobdesc" || rel === "mspdesc" || rel === "mapshup")) {
                desc.MDescriptionUrl = urlNodes[i].getAttribute("template");
            }
            else if (format) { // Only add recognized formats
                URL.URLTemplate = urlNodes[i].getAttribute("template");
                //URL.searchParams = this.parseURLTemplate(URL.URLTemplate);
                desc.formats[format]=URL;        	
            }
        }
        /* End : added jrom for mapshup http://mapshup.info */
        
        // Attribution
        var attributionNode = this.getElementsByTagNameNS(data, "*", "Attribution")[0];
        desc.attribution = this.getChildValue(attributionNode);
        
        // Added jrom for mapshup http://mapshup.info : Image
        var imageNode = this.getElementsByTagNameNS(data, "*", "Image")[0];
        desc.icon = this.getChildValue(imageNode);
        
        return desc;
    },
    
    parseURLTemplate: function(template) {
        var searchParams = {};
        var paramArray = template.match(this.regExes.extractParams);
        /* Start : added jrom for mapshup http://mapshup.info */
        if (!paramArray) {
            return searchParams;
        }
        /* End : added jrom for mapshup http://mapshup.info */
        for(var i=0, len=paramArray.length; i<len; i++) {
            var paramName = paramArray[i].replace(this.regExes.trimCurly, "");
            searchParams[paramName] = "";
        }
        return searchParams;
    },
    
    CLASS_NAME: "OpenLayers.Format.OpenSearchDescription" 
});