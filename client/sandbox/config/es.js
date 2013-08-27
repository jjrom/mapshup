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
    
    /*
     * Remove plugins
     */
    c.remove("plugins", "GoogleEarth");
    
    /**
     * Add ElasticSearch search server
     */
    c.remove("plugins", "Search");
    c.add("plugins",
    {
        name:"Search",
        options:{
            services: [
            {
                url:"/plugins/osm/opensearch.xml"
            }
            ]
        }
    });

})(window.M.Config);
