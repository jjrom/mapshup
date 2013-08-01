(function(c) {

    /*
     * Update configuration options
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/es.html";

    /*
     * Remove layers
     */
    c.remove("layers", "OpenStreetMap");
    c.remove("layers", "MapQuest OSM");

    /*
     * Remove plugins
     */
    c.remove("plugins", "GoogleEarth");

    /*
     * Add plugin UTFGrid
     */

    /*
     * UTFGrid Test
     */
    c.add("layers", {
        type: "UTFGrid",
        title: "UTFGrid test",
        url: c["general"].serverRootUrl + "/plugins/utfgrids/serve.php?name=countries_utfgrids&zxy=${z}/${x}/${y}",
        z: [0, 5],
        bbox: {
            bounds: "-180,-90,180,90",
            srs: "EPSG:4326"
        },
        info: {
            title: "$NAME_LONG$"
        }
    });

})(window.M.Config);
