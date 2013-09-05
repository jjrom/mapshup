(function (c){

    /*
     * Update configuration options
     */
    c['upload'].allowedMaxSize = 10000000;
    c['upload'].allowedMaxNumber = 50;
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/index.html";
    
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
    
    /*
     * Add layers
     */
    c.add("layers", {
        type:"MBT",
        title:"World",
        t:"world-dark"
    });

})(window.M.Config);
