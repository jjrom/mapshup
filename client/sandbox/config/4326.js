(function (c){

    /*
     * Update configuration options
     */
    c['upload'].allowedMaxSize = 10000000;
    c['upload'].allowedMaxNumber = 50;
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/4326.html";
    
    c["general"].timeLine = {
        enable: true,
        single:true,
        showOnMap:true,
        absolutes:{
            min:new Date('2000-01-01'),
            max:new Date()
        },
        bounds:{
            min:new Date('2012-01-01'),
            max:new Date()
        },
        values:{
            min:new Date(),
            max:new Date()
        }
    };
    
    /*
     * Remove layers
     */
    c.remove("layers","OpenStreetMap");
    c.remove("layers","MapQuest OSM");
    
    /*
     * Remove plugins
     */
    c.remove("plugins", "Streetview");
    c.remove("plugins", "GoogleEarth");
    
    //c.remove("plugins", "AddLayer");
    //c.remove("plugins", "LayersManager");
    //c.remove("plugins", "Share");
    //c.remove("plugins", "BackgroundsManager");
    //c.remove("plugins", "Distance");
    //c.remove("plugins", "Drawing");
    //c.remove("plugins", "Export");
    //c.remove("plugins", "Flickr");
    //c.remove("plugins", "GetFeatureInfo");
    //c.remove("plugins", "GetLandCover");
    //c.remove("plugins",  "LayerInfo");
    c.remove("plugins", "Logger");
    c.remove("plugins", "Routing");
    //c.remove("plugins", "UserManagement");
    c.remove("plugins", "Welcome");
    c.remove("plugins", "Wikipedia");
    c.remove("plugins", "WorldGrid");
    c.remove("plugins", "UTFGrid");
    //c.remove("plugins", "Navigation");
    //c.remove("plugins", "Search");
    //c.remove("plugins", "Catalog");
   
    c.mapOptions = {
        projection:new OpenLayers.Projection("EPSG:4326"),
        displayProjection:new OpenLayers.Projection("EPSG:4326")
    };
    
    /*
     * https://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0
     * &TIME=2014-04-17
     * &LAYER=MODIS_Terra_CorrectedReflectance_TrueColor
     * &STYLE=
     * &TILEMATRIXSET=EPSG4326_250m
     * &TILEMATRIX=2
     * &TILEROW=0
     * &TILECOL=3
     * &FORMAT=image%2Fjpeg
     * 
     */
    c.add("layers", {
        type: "WMTS",
        title: "Earth at night",
        MID: "EarthAtNight",
        url: "http://map1c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?",
        layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
        style: 'default',
        matrixSet: "EPSG4326_250m",
        format: "image/jpeg",
        opacity: 1,
        hidden: true,
        attribution: 'EODIS <a href="http://www.nasa.gov" target="_blank">NASA</a>',
        TIME:'2014-04-17',
        isBaseLayer:true,
        time:{
            default:'2014-04-17'
        }
    });

})(window.M.Config);
