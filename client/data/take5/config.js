(function(c) {

    /*
     * Update configuration options
     */
    c["general"].rootUrl = "http://localhost/msp/";
    c["general"].serverRootUrl = "http://localhost/mspsrv/";
    c["general"].themePath = "/js/mapshup/theme/blacker";
    c["general"].mapserverUrl = "http://engine.mapshup.info/cgi-bin/mapserv?";
    c["general"].displayContextualMenu = false;
    c["general"].displayCoordinates = false;
    c["general"].displayScale = false;

    c["general"].timeLine = {
        enable: false
    };

    c["general"].overviewMap = "closed";

    /* Background Layers */
    c.remove("layers", "Streets");
    c.remove("layers", "Satellite");
    c.remove("layers", "Relief");
    c.remove("layers", "MapQuest OSM");
    c.remove("layers", "OpenStreetMap");
    c.add("layers", {
        type: "Bing",
        title: "Satellite",
        key: "AmraZAAcRFVn6Vbxk_TVhhVZNt66x4_4SV_EvlfzvRC9qZ_2y6k1aNsuuoYS0UYy",
        bingType: "Aerial"
    });

    c["general"].location = {
        lon: 0,
        lat: 40,
        zoom: 3
    };

    /*
     * Remove plugins
     */
    c.remove("plugins", "Routing");
    c.remove("plugins", "Logger");
    c.remove("plugins", "WorldGrid");
    c.remove("plugins", "Welcome");
    c.remove("plugins", "LayerInfo");
    c.remove("plugins", "Streetview");
    c.remove("plugins", "LayersManager");
    c.remove("plugins", "RastersManager");
    c.remove("plugins", "GoogleEarth");
    c.extend("Navigation", {
        position:'nw',
        orientation:'h',
        home:null
    });
    c.extend("Help", {
        noLogo:true,
        rootUrl:c["general"].rootUrl + '/data/take5'
    });

    /* DO NOT TOUCH UNDER THIS LINE */
    c.add("plugins",
            {
                name: "Take5",
                options: {
                    searchService: "http://localhost/ptsc/take5/www/ws/search.php?q=",
                    rootUrl: "http://localhost/ptsc/take5/www/sites/",
                    sitesUrl: "http://localhost/ptsc/take5/www/ws/getSites.php?language="
                }
            }
    );

})(window.M.Config);