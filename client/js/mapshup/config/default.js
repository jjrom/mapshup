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
 * Main configuration file
 *
 * You should not modify this file unless you
 * know exactly what you are doing...
 */
(function(c) {
    
    /**
     * Application root url
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    
    /**
     * In the configuration file, each url starting with '/' is supposed to be relative
     * to serverRootUrl. Thus mapshup assume that the absolute url is the concatenation
     * of serverRootUrl + url
     */
    c["general"].serverRootUrl = c["general"].rootUrl + '/s';

    /**
     * Application index path
     * The path should be relative to the application rootUrl
     */
    c["general"].indexPath = "/index.html";

    /**
     * True to ask user when deleting a layer
     */
    c["general"].confirmDeletion = true;
    
    /**
     * Coordinates can be displayed in 'dms' for degrees/minutes/seconds or in 'hms' for hour/minutes/seconds
     * If 'hms' is selected this will only affect the longitude coordinate display
     */
    c["general"].coordinatesFormat = 'dms';
    
    /**
     * True to display contextual menu
     */
    c["general"].displayContextualMenu = true;

    /**
     * True to display mouse coordinates in lat/lon
     */
    c["general"].displayCoordinates = true;

    /**
     * True to display scale
     */
    c["general"].displayScale = true;
    
    /*
     * If true, feature are highlited when mouse over
     * (Note : this option is automatically set to false for touch devices)
     */
    c["general"].featureHilite = true;
    
    /**
     * Set the initial location for the map
     * This can be overriden by url parameters
     * Possible properties are :
     *  {
     *      lon: // center map longitude
     *      lat: // center map latitude
     *      zoom: // map zoom level
     *      bg: // MID of the default background layer (optional)
     *  }
     */
    c["general"].location = {
        lon:0,
        lat:40,
        zoom:2
    };

    /**
     * Overview map configuration.
     * The overview
     *   - "none" : no overview map
     *   - "opened": overview map is opened at startup
     *   - "closed": overview map is closed at startup
     */
    c["general"].overviewMap = "closed";

    /**
     * Proxy url. Must be terminated by "?" or "&"
     * 
     * WARNING : if null or empty then no proxy is used - only services from the same domain name
     * would work
     */
    c["general"].proxyUrl = "/proxy.php?";

    /**
     * Redirect service url
     */
    c["general"].getContextServiceUrl = "/plugins/logger/getContext.php?uid=";

    /**
     * The refresh interval in ms.
     * Each "refreshInterval", j_ call the refreshLayers function
     */
    c["general"].refreshInterval = 1000;

    /**
     * Reprojection service url. Must be terminated by "?" or "&"
     * This service is used for WMS layers reprojection
     */
    c["general"].reprojectionServiceUrl = "/mapserver/getReprojectedWMS.php?";

    /**
     * RSS to GeoRSS service url
     */
    c["general"].rssToGeoRSSServiceUrl = "/utilities/rss2georss.php?url=";

    /**
     * Save stream service url.
     * Stream service url has 3 input parameters :
     *   - "s" value is the encoded stream
     *   - "format" value is the stream format ('json' or 'kml')
     *   - "uid" value is a unique identifier (optional - create by server if not set) 
     */
    c["general"].saveStreamServiceUrl = "/utilities/saveStream.php?";

    /**
     * Reprojection service url. Must be terminated by "?" or "&"
     * This service is used for WMS layers reprojection
     */
    c["general"].shpToWMSServiceUrl = "/mapserver/shp2wms.php?";

    /**
     * Tiles server url. Must be terminated by "?" or "&"
     */
    c["general"].mbtilesServiceUrl = "/utilities/mbtsrv.php?zxy=${z}/${x}/${y}&t=";

    /**
     * Maximum number of records returns per page in a search context
     */
    c["general"].numRecordsPerPage = 20;
    
    /**
     * Theme path
     * The path should be relative to the application rootUrl
     */
    c["general"].themePath = "/js/mapshup/theme/default";

    /**
     * If teleport is set to true, recentering the map is immediate. Otherwise, it
     * is pan smoothly
     *
     * Note: for touch devices, this option is automatically set to true
     */
    c["general"].teleport = false;

    /**
     * TimeLine configuration
     *  
     * TimeLine is located immediatly below mapshup header
     * 
     * Options
     * 
     *      {
     *          enable://true to enable timeLine, false otherwise
     *          disablable://true to allow user to disable timeline
     *          position:{
     *              top: // in pixels (not set if bottom is set)
     *              bottom: // in pixels (not set if bottom is set)
     *          },
     *          absolutes:{
     *              min:// TimeLine minimum bounds year
     *              max:// TimeLine maximum bounds year
     *              editable:// True to allow user to modify values; false otherwise
     *          },
     *          bounds:{
     *              min:// TimeLine displayed start date
     *              max:// TimeLine displayed end date
     *          },
     *          values:{
     *              min:// Selected start date for interval
     *              max:// Selected end date for interval
     *              editable:// True to allow user to modify values; false otherwise
     *          }
     *      }
     *      
     */
    c["general"].timeLine = {
        enable:true //true to enable timeLine, false otherwise
    };

    /**
     * Available languages. A language file must be called "lang".js and located
     * under the i18n directory (e.g. the "fr" lang corresponds to the "fr.js" file)
     */
    c["i18n"].langs = ["en", "fr", "de", "jp"];

    /**
     * Application default lang (one from availableLangs).
     * If set to "auto", lang is detected from the browser capability
     */
    c["i18n"].lang = "auto";

    /**
     * Path to i18n directory
     * This path should be relative to the rootUrl
     */
    c["i18n"].path = "/js/mapshup/i18n";

    /** 
     * Panels configuration
     *   - s : south panel
     *   - side: south panel 
     *          {
     *              position: // left or right (default right)
     *              w: // width in pixels
     *          }
     */
    c["panels"] = {
        south:{
            over:true, // false to push the map
            h:250
        },
        side:{
            w:400
        }
    };
    
    /**
     * Upload service url
     */
    c["upload"].serviceUrl = "/utilities/upload.php?";

    /**
     * Upload file allowed maxSize in bytes // 1000000
     */
    c["upload"].allowedMaxSize = 1000000;

    /**
     * Allowed file types for upload
     */
    c["upload"].allowedExtensions = ["gml","gpx","kml","xml","rss","jpeg","jpg","gif","png","shp","shx","dbf","json"];

    /** Default layers */
    c.add("layers", {
        type:"Google",
        title:"Streets",
        numZoomLevels:22,
        unremovable:true
    });
    
    c.add("layers", {
        type:"Google",
        title:"Satellite",
        googleType:"satellite",
        numZoomLevels:22,
        unremovable:true
    });
    
    c.add("layers", {
        type:"Google",
        title:"Relief",
        googleType:"terrain",
        numZoomLevels:22,
        unremovable:true
    });
    
    c.add("layers", {
        type:"XYZ",
        title:"MapQuest OSM",
        url:["http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
        "http://otile2.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
        "http://otile3.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
        "http://otile4.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png"],
        ol:{
            attribution:'<p>Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>'
        }
    });
    c.add("layers", {
        type:"XYZ",
        title:"OpenStreetMap",
        url:["http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"],
        ol:{
            attribution:'Tiles from <a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap</a>'
        }
    });
    /*
    c.add("layers", {
        type:"XYZ",
        title:"MapQuest Aerial",
        url:["http://oatile1.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png",
        "http://oatile2.mqcdn.com/tiles/1.0.0/sat${z}/${x}/${y}.png",
        "http://oatile3.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png",
        "http://oatile4.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png"],
        ol:{
            attribution:'<p>Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>'
        }
    });
    
    */
    
    /**
     * Logger plugin
     * Options :
     *    url:"/plugins/logger/logger.php?"
     *    realtime:false
     */
    /*
    c.add("plugins",
    {
        name:"Logger"
    });
    */
   
    /**
     * UserManagement
     * Options :
     *      title:"Welcome on j_"
     *      description:'<img src="./img/j_LogoSquare50x50.png"/>'
     *
     *      (The Following should not be overrided)
     *      loginUrl: "/plugins/usermanagement/login.php";
     */
    c.add("plugins",
    {
        name:"UserManagement"
    });
    
    /*
     * Export plugin
     *  options:
     *      exportServiceUrl:"/utilities/export.php?"
     *      // Export service
     */
    c.add("plugins",
    {
        name:"Export"
    });

    /**
     * Navigation actions
     * options:
     *      home: // If defined, add a "Home" action that center view to lon, lat and zoom
     *               Default : {
     *                            lon:0,
     *                            lat:40,
     *                            zoom:2
     *                         }
     *      zoomin: // True to add "Zoom" action - default true
     *      zoomout: // True to add "Zoom out" action - default true
     *      position: // Toolbar position (nw, ne, sw, se) - default nw
     *      orientation: // Toolbar orientation (h, v) - default v
     *
     */
    c.add("plugins",
    {
        name:"Navigation"
    });

    /**
     * Options:
     *      position: // Toolbar position (nw, ne, sw, se) - default se
     *      orientation: // Toolbar orientation (h, v) - default v
     *
     */
    c.add("plugins",
    {
        name:"BackgroundsManager"
    });
    
    /**
     *  !!! THIS PLUGIN MUST BE INITIALIZED BEFORE LayersManager PLUGIN !!!!
     *  
     *  Options :
     *     
     *     inLM: // true to display raster manager access through the "configure" button in
     *              in the raster tab of the LayersManager plugin (default true)
     */
    c.add("plugins",
    {
        name:"RastersManager"
    });
    
    /**
     *  Options :
     *     
     *     position: // LayersManager position, one of :
     *                      - 'n' for North (default)
     *                      - 's' for South
     *     excluded: // layer types are not managed by LayersManager plugin
     *                  default ["Image","MBT","SHP","TMS","WMS","XYZ"]
     *     
     *     onTheFly: // If true, featureInfo panel is displayed on the
     *                  fly. Only work for non-touch device (default true)
     *                  
     *     closeOnRaster: // If true, a close button is added to each raster thumbnails
     *                       default is false
     */
    c.add("plugins",
    {
        name:"LayersManager"
    });

    /*
     * LayerInfo plugin
     */
    c.add("plugins",
    {
        name:"LayerInfo"
    });

    /**
     * Add Layer
     * 
     * options:
     * 
     *      allowedLayerTypes: // mandatory - see below
     *      magicServiceUrl: // url to magic service - default "/utilities/magic.php?"
     */
    c.add("plugins",
    {
        name:"AddLayer",
        options:{
            allowedLayerTypes:[
            {
                name:"Catalog"
            },  
            {
                name:"Atom"
            },
            {
                name:"GeoJSON"
            },
            {
                name:"GeoRSS"
            },
            {
                name:"KML"
            },
            {
                name:"Pleiades"
            },
            {
                name:"WFS"
            },
            {
                name:"WMS"
            },
            {
                name:"WMTS"
            }
            ]
        }
    });

    /**
     * Search plugin
     *
     * options:
     *      hint: // Text to display within the search bar (Default is "Search / Add a layer url")
     *      services: // array of OpenSearch services description
     *                   {
     *                      url: // url to the OpenSearch XML description - MANDATORY
     *                      stype: // Layer type - OPTIONAL
     *                      shortcut: // One character shortcut for direct search on the ressource
     *                   }
     *                   
     */
    c.add("plugins",
    {
        name:"Search",
        options:{

            /**
             * Descriptions of OpenSearch services
             */
            services: [
            {
                url:"/plugins/flickr/opensearch.xml",
                /* Sub type Flickr */
                stype:"Flickr"
            },
            {
                url:"/plugins/youtube/opensearch.xml",
                /* Sub type Youtube */
                stype:"Youtube"
            },
            {
                url:"/plugins/geonames/opensearch.xml"
            },
            {
                url:"/plugins/wikipedia/opensearch.xml"
            }
            ]
        }
    });

    /**
     * Google Earth plugin
     *
     * options :
     *      navigation : true to display navigation control // default true
     *      atmosphere : true to display atmosphere // default true
     *      borders : true to display borders layer // default false
     *      terrain : true to display terrain layer // default true;
     *      roads : true to display roads layer // default false
     *      buildings : true to display buildings layer // default false;
     *      buildingsLR : true to display low resolution buildings layer // default false
     *      teleport : true to go instantaneously to location, else fly to location // default false
     *      synchronize : true to synchronize layer between 2D and 3D // default true
     *      synchronizeWMS : true to synchronize WMS layers between 2D and 3D - EXPERIMENTAL // default false
     *      position: // position of the toolbar button - default ne
     *      orientation // orientation of the toolbar button - default v
     *      embeded: // Boolean - if true, Google Earth is displayed within a South panel
     *                  and can be displayed at the same time of the 3D map
     *                  Otherwise it is displayed above the 2D map
     *                  Default false
     */
    c.add("plugins", {
        name:"GoogleEarth",
        options:{
            synchronizeWMS:false,
            buildings:false
        }
    });

    /**
     * Distance plugin
     *   
     *   options :
     *      elevationServiceUrl : Default is "http://maps.google.com/maps/api/elevation/json?sensor=false&"
     *      samples : number of points to compute elevation (default 30)
     */
    c.add("plugins",
    {
        name:"Distance"
    });

    /*
     * GetFeatureInfo plugin
     */
    /*
    c.add("plugins",
    {
        name:"GetFeatureInfo"
    });
    */
    /**
     * Geonames plugin
     * Options:
     *  findNearByUrl: // http://ws.geonames.org/findNearbyJSON?
     *  featureClassString: geonames feature class (e.g. "featureClass=P&featureClass=A") // ""
     */
    c.add("plugins",
    {
        name:"Geonames",
        options:{
            findNearByUrl:"http://ws.geonames.org/findNearbyJSON?"
        }
    });

    /**
     *  Options:
     *      number: 100
     *       // Maximum number of articles displayed
     *      minimumZoomLevel:9
     *       // Minimum zoom level at which Wikipedia is requested
     *      hidden
     *       // True, layer is hidden at startup (default false)
     */
    c.add("plugins",
    {
        name:"Wikipedia",
        options:{

            /**
             * Search service url
             */
            searchUrl:"http://ws.geonames.net/wikipediaBoundingBoxJSON?"
        }
    });

    /**
     * Flickr search url is fixed to '/plugins/flickr/search.php?'
     */
    c.add("plugins",
    {
        name:"Flickr"
    });

    /**
     * Drawing plugin
     */
    c.add("plugins",
    {
        name:"Drawing"
    });

    /**
     * Streetview plugin
     * Options :
     *      height: height of the streetview panel // default = 300px
     */
    c.add("plugins",
    {
        name:"Streetview"
    });

    /**
     * Add routing functionnality
     *
     */
    c.add("plugins",
    {
        name:"Routing",
        options:{
            method:"SPD",
            url:"/plugins/routing/getShortestPath2.php?"
        }
    });
    
    c.add("plugins",
    {
        name:"Catalog",
        options:{
            nextRecord:1,
            connectors:[
            /**
                 * CSW ISO Catalog connector
                 * Options :
                 *  description:"Generic ISO CSW catalog connector"
                 *  url:"/plugins/catalog/CSWISOCatalogProxy.php?"
                 *
                 */
            {
                name:"CSWISO"
            },
            /**
                 * CSW EO Charter Catalog connector
                 * Options :
                 *  description:"International Charter catalog connector"
                 *  url:"/plugins/catalog/CSWEOCharterCatalogProxy.php?"
                 *  slotComboProxyServiceUrl:"plugins/catalog/charter/DisastersCharter_SlotComboProxy.php?action="
                 */
            {
                name:"CSWEOCharter"
            },
            /**
                 * CSW EO Generic Catalog connector
                 * Options :
                 *  description:"CSW EO catalog connector"
                 *  url:"/plugins/catalog/CSWEOCatalogProxy.php?"
                 */
            {
                name:"CSWEO"
            },
            /**
                 * CSW EO Generic Catalog connector
                 * Options :
                 *  description:"CSW EO catalog connector"
                 *  url:"/plugins/catalog/CSWEOCatalogProxy.php?version=06-131r5&"
                 */
            {
                name:"CSWEOr5"
            },
            /**
                 * CSW EO Generic Catalog connector
                 * Options :
                 *  description:"CSW EO catalog connector"
                 *  url:"/plugins/catalog/CSWEOCatalogProxy.php?version=06-131r5ebRR&"
                 */
            {
                name:"CSWEOr5ebRR"
            },
            /**
                 * SPOT Rest catalog connector
                 * Options :
                 *  description:"SPOT Dali Catalog"
                 *  url:"/plugins/catalog/SPOTRestCatalogProxy.php?"
                 */
            {
                name:"SPOTRest"
            },
            /**
                 * OpenSearch catalog connector
                 * Options :
                 *  description:"OpenSearch catalog"
                 */
            {
                name:"OpenSearch"
            }
            ]
        }
    });

    /**
     * WorldGrid plugin
     * 
     * options: 
     *      color // color for label - default #fff
     *      intervals // default [45, 30, 20, 10, 5, 2, 1]
     *      labelFormat // Display label format 'hm' or 'dm' - default 'dm' degrees/minutes
     *      labelled // Label or not the grid - default true
     *      lineWidth // width for grid line - default 1
     *      lineColor // color for grid line - default #666
     *      title // Title for the layer - Default "Lat/Lon Grid"
     */
    c.add("plugins",
    {
        name:"WorldGrid"
    });
    
    /**
     * Context sharing
     * options:
     *      saveContextServiceUrl : // Url to the save context service. Default /plugins/logger/saveContext.php?
     *      getContextsServiceUrl : // Url to the save context service. Default /plugins/logger/getContexts.php?
     *      shareEmbed : // True to add a "embed code in your website" textarea (default false)
     *      geocode: // True to save context with a geocoded name instead of lat/lon - default true
     *      
     */
    c.add("plugins",
    {
        name:"Share"
    });
    
    /**
     * Display Help
     * 
     * options:
     *      noLogo : // if true, mapshup logo is not displayed within help frame (default is false)
     *      rootUrl: // root url where help files should be (default is js/mapshup/i18n)
     *       
     */
    c.add("plugins",
    {
        name:"Help"
    });
    
    /**
     * UTFGrid plugin
     */
    c.add("plugins",
    {
        name:"UTFGrid"
    });
    
    /**
     * WPSClient plugin
     */
    c.add("plugins",
    {
        name:"WPSClient"
    });

    /**
     * FeatureEdition plugin
     */
    c.add("plugins",
    {
        name:"FeatureEdition"
    });
    
})(window.M.Config);