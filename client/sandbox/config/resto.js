(function (c){

    /*
     * Update configuration options
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/es.html";
    c["general"].confirmDeletion = false;
    
    /*
     * Remove layers
     */
    c.remove("layers","OpenStreetMap");
    c.remove("layers","MapQuest OSM");
    
    c["general"].timeLine = {
        enable:false
    };
    
    /*
     * Remove plugins
     */
    //c.remove("plugins", "GoogleEarth");
    

})(window.M.Config);
