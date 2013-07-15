(function (c){

    /*
     * Update configuration options
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/es.html";
    
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
        name:"ElasticSearch",
        options: {
            url:"http://es.mapshup.info/osm/"
        }
    });
    
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
