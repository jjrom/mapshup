(function(c) {

    /*
     * Update configuration options
     */
    c["general"].rootUrl = 'http://localhost/mapshup';
    c["general"].serverRootUrl = 'http://localhost/mapshups';
    c["general"].indexPath = "/sandbox/northpole.html";
    c["general"].themePath = "/js/mapshup/theme/blacker";
    c["general"].confirmDeletion = false;
    
    /*
     * Remove layers
     */
    c.remove("layers", "OpenStreetMap");
    c.remove("layers", "MapQuest OSM");
    c.remove("plugins", "UserManagement");
    c.remove("plugins", "BackgroundsManager");
    c.remove("plugins", "UTFGrid");
    c.remove("plugins", "Welcome");
    c.remove("plugins", "WorldGrid");
    c.remove("plugins", "Slacker");
    c.remove("plugins", "UserManagement");


    c["general"].timeLine = {
        enable: false
    };

    c.add("layers", {
        name:"NorthPole",
        type:"WMS",
        url:"http://localhost/cgi-bin/mapserv?service=WMS&map=/Users/jrom/data/mapserver/north_pole.map&",
        layers:"countries",
        srs:"EPSG:3857",
        MID:"NorthPole",
        isBaseLayer:true,
        ol:{
            projection: new OpenLayers.Projection('EPSG:3408'),
            units: 'm',
            maxExtent: new OpenLayers.Bounds(-40000000,-40000000,40000000,40000000),
            numZoomLevels: 22
        }
    });
    
    c.add("plugins", {
        name: "QuickSelector",
        options: {
            unique: true, // Only one item can be activated at a time
            items: [
                {
                    name: "Spherical Mercator",
                    icon: "http://i.msdn.microsoft.com/dynimg/IC130641.jpg",
                    layerMID: "GoogleSatellite",
		    active:true,
                    callback:function(item) {
                        M.Map.setBaseLayer(M.Map.Util.getLayerByMID(item.layerMID));
                    }
                },
                {
                    name: "Polar Projection",
                    icon: "http://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Arctic_Ocean.png/275px-Arctic_Ocean.png",
                    layerMID: "NorthPole",
                    callback:function(item) {
                        M.Map.setBaseLayer(M.Map.Util.getLayerByMID(item.layerMID));
                    }
                }
            ]
        }
    });
    

})(window.M.Config);
