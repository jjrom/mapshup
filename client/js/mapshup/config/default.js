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
     * In the configuration file, each url starting with '/' is supposed to be relative
     * to serverRootUrl. Thus mapshup assume that the absolute url is the concatenation
     * of serverRootUrl + url
     */
    c["general"].serverRootUrl = 'http://localhost/mspsrv';

    /**
     * Application root url
     */
    c["general"].rootUrl = 'http://localhost/msp';

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
     * True to display overview map
     */
    c["general"].displayOverviewMap = true;

    /**
     * True to display overview map
     */
    c["general"].displayScale = true;

    /*
     * If true, feature are highlited when mouse over
     * (Note : this option is automatically set to false for touch devices)
     */
    c["general"].featureHilite = true;

    /**
     * Set the initial location for the map
     * This can be overriden by url paramters
     * Possible properties are :
     *  {
     *      lon: // center map longitude
     *      lat: // center map latitude
     *      zoom: // map zoom level
     *      bg: // mspID of the default background layer (optional)
     *  }
     */
    c["general"].initialLocation = {
        lon:0,
        lat:40,
        zoom:2
    };

    /**
     * Mapserver url. Used by the reprojection service
     */
    c["general"].mapserverUrl = "http://localhost/cgi-bin/mapserv?";

    /**
     * Proxy url. Must be terminated by "?" or "&"
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
     * Remove black border service url.
     */
    //c["general"].removeBlackBorderServiceUrl = "/utilities/removeBorder.php?imageurl=";

    /**
     * Reprojection service url. Must be terminated by "?" or "&"
     * This service is used for WMS layers reprojection
     */
    c["general"].reprojectionServiceUrl = "/mapserver/getReprojectedWMS.php?";

    /**
     * Reprojection service url. Must be terminated by "?" or "&"
     * This service is used for WMS layers reprojection
     */
    c["general"].rssToGeoRSSServiceUrl = "/utilities/rss2georss.php?url=";

    /**
     * Save KML service url. Must be terminated by "?" or "&"
     */
    c["general"].saveKMLServiceUrl = "/utilities/saveKML.php?";

    /**
     * Reprojection service url. Must be terminated by "?" or "&"
     * This service is used for WMS layers reprojection
     */
    c["general"].shpToWMSServiceUrl = "/mapserver/shp2wms.php?";

    /**
     * Reprojection service url. Must be terminated by "?" or "&"
     * This service is used for WMS layers reprojection
     */
    c["general"].mbtilesServiceUrl = "/utilities/mbtsrv.php?zxy=${z}/${x}/${y}&t=";

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
     * Available languages. A language file must be called "lang".js and located
     * under the i18n directory (e.g. the "fr" lang corresponds to the "fr.js" file)
     */
    c["i18n"].availableLangs = ["en", "fr", "ar", "de", "es", "he", "it", "ja", "ru", "zh", "pt"];

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
     * Panel configuration
     */
    c["panel"] = {
        /* North */
        n:{
            over:false // North panel push the map
        },
        /* South */
        s:{
            over:false // South panel push the map
        },
        /* East */
        e:{
            over:true, // East panel is displayed over the map
            top:20
        },
        /* West */
        w:{
            over:true, // West panel is displayed over the map
            top:100,
            bottom:60
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
        type:"OSMT",
        title:"OpenStreetMap",
        url:["http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"]
    });
    
    /**
     * Plugins description
     *
     * !! IMPORTANT !!
     * Child plugins (i.e. plugins that requires a plugin)
     * should always be loaded AFTER parent plugin.
     *
     */

     /*
     * Welcome plugin
     */
    c.add("plugins",
    {
        name:"Welcome",
        options: {
            url:'http://mapshup.info'
        }
    });
    
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
   
    /**
     *  This plugin requires UserManagement plugin
     *  Options :
     *      (The Following should not be overrided)
     *      historyUrl: "/plugins/usermanagement/navigationHistory.php";
     *      statsWMSUrl: "http://localhost/cgi-bin/mapserv?map=/Users/jrom/Documents/Devel/j_/src/server/plugins/logger/logger.map&LAYERS=countries&";
     */
    
    /*
     * Download plugin
     *  options:
     *      exportServiceUrl:"/utilities/export.php?"
     *      // Download service
     */
    c.add("plugins",
    {
        name:"Download"
    });

    /**
     * Navigation actions
     * options:
     *      home: // True to add a "Home" action - default false
     *      zoomin: // True to add "Zoom" action - default true
     *      zoomout: // True to add "Zoom out" action - default true
     *      history: // True to add Navigation history - default false
     *      limit: // Number of stored extents for navigation history - default 10
     *      position: // Toolbar position (nw, ne, sw, se) - default nw
     *      orientation: // Toolbar orientation (h, v) - default h
     *
     */
    c.add("plugins",
    {
        name:"Navigation",
        options:{
            home:true
        }
    });

    /**
     * Google Earth plugin
     *
     * options :
     *      navigation : true to display navigation control // default false
     *      atmosphere : true to display atmosphere // default false
     *      borders : true to display borders layer // default false
     *      terrain : true to display terrain layer // default true;
     *      roads : true to display roads layer // default false
     *      buildings : true to display buildings layer // default false;
     *      buildingsLR : true to display low resolution buildings layer // default false
     *      teleport : true to go instantaneously to location, else fly to location // default false
     *      synchronize : true to synchronize layer between 2D and 3D // default true
     *      synchronizeWMS : true to synchronize WMS layers between 2D and 3D - EXPERIMENTAL // default false
     *      position: // position of the toolbar button - default nw
     *      orientation // orientation of the toolbar button - default h
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
     * Options:
     *      position: // Toolbar position (nw, ne, sw, se) - default se
     *      orientation: // Toolbar orientation (h, v) - default v
     *
     */
    /*
    c.add("plugins",
    {
        name:"BackgroundsManager"
    });
    */
    /**
     *  Options :
     *     
     *     opacitySteps: 5 // for raster layers, number of opacity steps (from transparent to opaque)
     *     position: // Toolbar position (nw, ne, sw, se) - default ne
     *     orientation: // Toolbar orientation (h, v) - default v
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
     * This plugin requires the LayersManager plugin
     */
    c.add("plugins",
    {
        name:"AddLayer",
        options:{
            allowedLayerTypes:[
            {
                name:"Catalog",
                predefined:[
                {
                    type:"Catalog",
                    title:"Inspire Catalog",
                    url:"http://inspire-geoportal.eu/discovery/csw?",
                    connectorName:"CSWISO",
                    groupName:"Catalogs",
                    extras:{
                        order:"lonlat"
                    }
                },
                {
                    type:"Catalog",
                    title:"CEOS WGISS Integrated Catalog",
                    url:"http://cwic.csiss.gmu.edu/cwicv1/discovery?",
                    connectorName:"CSWISO",
                    groupName:"Catalogs",
                    extras:{
                        order:"latlon",
                        headers:false
                    },
                    filters:[
                        {
                            id:"collection",
                            title:"Collection",
                            type:"enumeration",
                            unique:true,
                            son:[
                                {
                                    id:'MODIS1',
                                    title:'MODIS/Aqua 8-Day Clear Sky Radiance Bias Daily',
                                    value:'NASA:MODIS/Aqua 8-Day Clear Sky Radiance Bias Daily L3 Global 1Deg Zonal Bands V005'
                                },
                                {
                                    id:'NOAA:GVAR_SND',
                                    title:'NOAA - GVAR_SND',
                                    value:'NOAA:GVAR_SND'
                                },
                                {
                                    id:'NASA:ASTER_L1B',
                                    title:'NASA - ASTER L1B',
                                    value:'NASA:ASTER L1B Registered Radiance at the Sensor V003'
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"Catalog",
                    title:'ERDAS Catalog',
                    groupName:"Catalogs",
                    url:'http://projects-eu.erdas.com/erdas-georeg/wrs/WRS?',
                    connectorName:'CSWEO'
                },
                {
                    type:"Catalog",
                    title:'Spot DALI catalog',
                    groupName:"Catalogs",
                    connectorName:'SPOTRest'
                }
                ]
            },
            {
                name:"GeoJSON",
                predefined:[]
            },
            {
                name:"GeoRSS",
                predefined:[
                {
                    type:"GeoRSS",
                    title:"International Disaster Charter - Latest activations",
                    url:"http://www.disasterscharter.org/DisasterCharter/RssFeed?articleType=activation&locale=en_US&companyId=1&communityId=10729"
                },
                {
                    type:"GeoRSS",
                    title:"Lib&eacute;ration - Monde",
                    url:"http://rss.feedsportal.com/c/32268/f/438244/index.rss"
                }
                ]
            },
            {
                name:"KML",
                predefined:[]
            },
            {
                name:"Pleiades",
                predefined:[]
            },
            {
                name:"WFS",
                predefined:[
                {
                    type:"WFS",
                    title:"Latest earthquakes",
                    url:"http://www.pdc.org/wfs/wfs/PDC_Active_Hazards_WFS?",
                    typeName:"Recent_Earthquakes-earthquake",
                    color:"#FF0000",
                    filterOn:"d2p2.d2p2_eq_48hr_sdeview.magnitude",
                    featureNS:"http://www.esri.com/esri",
                    version:"1.0.0",
                    featureInfo:{
                        title:"Magnitude {d2p2.d2p2_eq_48hr_sdeview.magnitude} - {d2p2.d2p2_eq_48hr_sdeview.date_time}",
                        keys:{
                            "d2p2.d2p2_eq_48hr_sdeview.date_time":{
                                v:"Date"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.latitude":{
                                v:"Latitude"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.longitude":{
                                v:"Longitude"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.magnitude":{
                                v:"Magnitude"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.depth":{
                                v:"Depth"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.region":{
                                v:"Region"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.incident_id":{
                                v:"Incident"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.objectid":{
                                v:"Object ID"
                            },
                            "d2p2.d2p2_eq_48hr_sdeview.link":{
                                v:"Link"
                            }
                        }
                    }
                },
                {
                    type:"WFS",
                    title:"PDC server",
                    url:"http://www.pdc.org/wfs/wfs/PDC_Active_Hazards_WFS?"
                }
                ]
            },
            {
                name:"WMS",
                predefined:[
                {
                    type:"WMS",
                    title:"VMAP0 [Metacarta]",
                    url:"http://vmap0.tiles.osgeo.org/wms/vmap0?",
                    layers:"Vmap0",
                    srs:"EPSG:4326"
                },
                {
                    type:"WMS",
                    title:"Disasters Charter server",
                    url:"http://www.disasterschartercatalog.org/ogc/cecec4wms?"
                },
                {
                    type:"WMS",
                    title:"Cubewerx WMS server",
                    url:"http://demo.cubewerx.com/demo/cubeserv/cubeserv.cgi?"
                },
                {
                    type:"WMS",
                    title:"World summits",
                    url:"http://www.camptocamp.org/cgi-bin/c2corg_wms?",
                    layers:"summits",
                    srs:"EPSG:4326"/*,
                    ol:{
                        singleTile:true
                    }*/
                },
                {
                    type:"WMS",
                    title:"Global 30 Second Elevations",
                    url:"http://demo.cubewerx.com/demo/cubeserv/cubeserv.cgi?",
                    layers:"Foundation.GTOPO30",
                    version:"1.1.0",
                    srs:"EPSG:3857",
                    queryable:true
                },
                {
                    type:"WMS",
                    title:"Nexrad server (US)",
                    url:"http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?"
                }
                ]
            }
            ]
        }
    });

    /**
     * OpenSearch2 plugin
     *
     * options:
     * 
     *      description:// Set the tooltip text displayed on mouse over the input search text box
     *      inHeader: // if true OpenSearch input text is embeded within the map header
     *                   (default is true)
     *
     */
    c.add("plugins",
    {
        name:"OpenSearch2",
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
     * Distance plugin
     */
    c.add("plugins",
    {
        name:"Distance",
        options:{
            elevationServiceUrl:"http://maps.google.com/maps/api/elevation/json?sensor=false&",
            elevationSamples:30
        }
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
            numRecordsPerPage:20,
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

    /*
     * LocateMe plugin
     */
    /*
    c.add("plugins",
    {
        name:"LocateMe"
    });
    */
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
     * Map context management
     * options:
     *      saveContextServiceUrl : // Url to the save context service. Default /plugins/logger/saveContext.php?
     *      getContextsServiceUrl : // Url to the save context service. Default /plugins/logger/getContexts.php?
     *      position: // Toolbar position (nw, ne, sw, se) - default nw
     *      orientation: // Toolbar orientation (h, v) - default h
     *      
     */
    c.add("plugins",
    {
        name:"Context"
    });
    
    /**
     * Display the list of world country
     * This plugin requires the Toolbar plugin
     */
    c.add("plugins",
    {
        name:"CountryPicker"
    });
       
})(window.msp.Config);