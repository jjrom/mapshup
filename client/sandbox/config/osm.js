(function (c){

    /*
     * Update configuration options
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/osm.html";
    
    /*
     * Remove layers
     */
    c.remove("layers","OpenStreetMap");
    c.remove("layers","MapQuest OSM");
    
    /*
     * Remove plugins
     */
    c.remove("plugins", "GoogleEarth");
    
    /*
     * Add Elastic Search plugin
     */
    c.add("plugins", {
        name:"OpenStreetMap",
        options: {
            url:"http://es.mapshup.info/osm/"
        }
    });
    

})(window.M.Config);
