(function (c){

    /*
     * Update configuration options
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/es.html";
    c["general"].confirmDeletion = false;
    c["general"].themePath = "/js/mapshup/theme/blacker";
    /*
     * Remove layers
     */
    c.remove("layers","OpenStreetMap");
    c.remove("layers","MapQuest OSM");
    c.remove("plugins","UserManagement");
    c.remove("plugins","UTFGrid");
    c.remove("plugins","Welcome");
    c.remove("plugins","WorldGrid");
    c.remove("plugins","Slacker");
    c.remove("plugins","UserManagement");
    
    
    c["general"].timeLine = {
        enable:false
    };
    
    /*
     * Remove plugins
     */
    //c.remove("plugins", "GoogleEarth");
    

})(window.M.Config);
