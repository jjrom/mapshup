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
/*********************************************
 * PLUGIN: LocateMe
 *
 * Center the map to the location of the user
 *
 *********************************************/
msp.plugins["LocateMe"] = {

    getMenuItems: function() {
        return {
            id:msp.Util.getId(),
            icon:msp.Util.getImgUrl("gpx.png"),
            title: msp.Util._("Locate me"),
            description:"",
            javascript:function(e) {
                msp.Map.getControlById("__CONTROL_LOCATEME__").activate();
                return false;
            }

        }
    },

    /**
     * Initialize plugin
     *
     * This is MANDATORY
     */
    init: function(options) {

        /**
         * Best practice : init options
         */
        this.options = options || {};
        
        /*
         * This plugin only work if navigator supports geolocation
         */
        if (navigator.geolocation) {
            
            /*
             * Create an empty layer
             */
            var title = "__LAYER_LOCATEME__";
            this.layer = new OpenLayers.Layer.Vector(title, {
                projection:msp.Map.epsg4326,
                displayInLayerSwitcher:false
            });

            /**
             * Add Drawing layer to Map object
             */
            msp.Map.addLayer({
                type:"Generic",
                title:title,
                unremovable:true,
                initialLayer:true,
                layer:this.layer
            });
            
            /*
             * Geolocation control
             */
            var ctrl = new OpenLayers.Control.Geolocate({
                id: '__CONTROL_LOCATEME__',
                geolocationOptions: {
                    enableHighAccuracy: false/*,
                    maximumAge: 0,
                    timeout: 7000*/
                }
            });
            
            msp.Map.map.addControl(ctrl);
            
            ctrl.events.register("locationupdated", this, function(e) {
                
                var plugin = msp.plugins["LocateMe"];
                plugin.layer.removeAllFeatures();
                plugin.layer.addFeatures([
                    new OpenLayers.Feature.Vector(
                        e.point,
                        {},
                        {
                            graphicName: 'cross',
                            strokeColor: '#f00',
                            strokeWidth: 2,
                            fillOpacity: 0,
                            pointRadius: 10
                        }
                        ),
                    new OpenLayers.Feature.Vector(
                        OpenLayers.Geometry.Polygon.createRegularPolygon(
                            new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                            e.position.coords.accuracy / 2,
                            50,
                            0
                            ),
                            {},
                            {
                            fillOpacity: 0.1,
                            fillColor: '#000',
                            strokeColor: '#f00',
                            strokeOpacity: 0.6
                        }
                        
                        )
                    ]);
                msp.Map.map.zoomToExtent(plugin.layer.getDataExtent());
            });

            return true;
            
        }

        return false;
    }
};
