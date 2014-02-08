/*
 * mapshup - Webmapping made easy
 * http://mapshup.info
 *
 * Copyright Jérôme Gasperi, 2011.12.08
 *
 * jerome[dot]gasperi[at]gmail[dot]com
 *
 * This software is a computer program whose purpose is a webmapping application
 * to display and manipulate geographical data.
 *
 * This software is governed by the CeCILL-B license under French law and
 * abiding by the rules of distribution of free software.  You can  use,
 * modify and/ or redistribute the software under the terms of the CeCILL-B
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 *
 * As a counterpart to the access to the source code and  rights to copy,
 * modify and redistribute granted by the license, users are provided only
 * with a limited warranty  and the software's author,  the holder of the
 * economic rights,  and the successive licensors  have only  limited
 * liability.
 *
 * In this respect, the user's attention is drawn to the risks associated
 * with loading,  using,  modifying and/or developing or reproducing the
 * software by the user in light of its specific status of free software,
 * that may mean  that it is complicated to manipulate,  and  that  also
 * therefore means  that it is reserved for developers  and  experienced
 * professionals having in-depth computer knowledge. Users are therefore
 * encouraged to load and test the software's suitability as regards their
 * requirements in conditions enabling the security of their systems and/or
 * data to be ensured and,  more generally, to use and operate it in the
 * same conditions as regards security.
 *
 * The fact that you are presently reading this means that you have had
 * knowledge of the CeCILL-B license and that you accept its terms.
 */
(function(c) {

    /*
     * Update configuration options
     */
    c["general"].rootUrl = "http://engine.mapshup.info/2.4";
    c["general"].serverRootUrl = c["general"].rootUrl + "/s";
    c["general"].themePath = "/js/mapshup/theme/default";
    c["general"].mapserverUrl = "http://engine.mapshup.info/cgi-bin/mapserv?";
    c['upload'].allowedMaxSize = 5000000;
    c['upload'].allowedMaxNumber = 5;
    c["general"].timeLine = {
        enable: false
    };

    /*c["general"].location = {
        bg: "mid840485919"
    };*/

    /*
     * Remove plugins
     */
    c.remove("plugins", "Routing");
    c.remove("plugins", "Logger");
    c.remove("plugins", "WorldGrid");
    c.remove("plugins", "Welcome");
    c.remove("plugins", "LayerInfo");

    c.add("plugins", {
        name:"WPSClient",
        options:{
            /*urls:"http://constellation-wps.geomatys.com/cstl-wrapper/WS/wps/OTB_processing?service=WPS&"*/
            /*
                urls:"http://constellation-wps.geomatys.com/cstl-wrapper/WS/wps/default"
                urls:"http://localhost/Msrv/plugins/wps/getCapabilities.xml"
                urls:"http://constellation-wps.geomatys.com/cstl-wrapper/WS/wps/OTB_processing?service=WPS&"
            urls:"http://constellation-wps.geomatys.com/cstl-wrapper/WS/wps/Topological_processing?service=WPS&"
            */
           /*urls:"http://demo.opengeo.org/geoserver/wps?SERVICE=WPS&"*/
           /*urls:"http://constellation-wps.geomatys.com/cstl-wrapper/WS/wps/default"*/
           /*urls:["http://localhost/mspsrv/plugins/wps/dummywps.php?"] "http://constellation-wps.geomatys.com/cstl-wrapper/WS/wps/Topological_processing?service=WPS&",
               "http://demo.opengeo.org/geoserver/wps?SERVICE=WPS&",
               "http://geoprocessing.demo.52north.org:8080/wps2/WebProcessingService?SERVICE=WPS&"]*/
        }
    });
    c.add("plugins", {
        name: "QuickSelector",
        options: {
            rootUrl: c["general"].rootUrl + "/data/engine.mapshup.info/img/",
            items: [
                {
                    name: "Night mode",
                    icon: "nightmode.png",
                    layerMID: "EarthAtNight",
		    active:true,
                    callback:function(item) {
                        M.Map.Util.switchVisibility(item.layerMID);
                    }
                },
                {
                    name: "World population",
                    icon: "worldpopulation.png",
                    layerMID: "WorldPopulation",
                    callback:function(item) {
                        M.Map.Util.switchVisibility(item.layerMID);
                    }
                }
            ]
        }
    });
    /*
     * NASA Earth Observatory/NOAA NGDC night image
     */
    c.add("layers", {
        type: "WMTS",
        title: "Earth at night",
        MID: "EarthAtNight",
        url: "http://engine.mapshup.info/mapcache/wmts/?",
        layer: "blackmarble",
        style: 'default',
        matrixSet: "GoogleMapsCompatible",
        format: "image/jpg",
        opacity: 0.5,
        hidden: true,
        attribution: 'Night image by <a href="http://www.nasa.gov/mission_pages/NPP/news/earth-at-night.html" target="_blank">NASA Earth Observatory/NOAA NGDC</a>'
    });

    c.add("layers", {
        type: "WMS",
        title: "Population Density",
        MID: "WorldPopulation",
        url: "http://sedac.ciesin.columbia.edu/geoserver/ows",
        layers: 'gpw-v3:gpw-v3-population-density_2000',
        opacity: 0.4,
        hidden: true,
        srs: "EPSG:3857",
        attribution: 'World population by <a href="http://sedac.ciesin.columbia.edu/data/collection/gpw-v3/about-us" target="_blank">SEDAC</a>'
    });
})(window.M.Config);
