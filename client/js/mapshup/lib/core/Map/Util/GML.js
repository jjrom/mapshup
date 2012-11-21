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

/**
 * Define GML Map util functions
 */
(function(msp, Map) {
    
    Map.Util = Map.Util || {};
    
    /*
     * Initialize Map.Util.GML
     */
    Map.Util.GML = {
        
        namespaces:'xmlns:gml="http://www.opengis.net/gml"',
        
        /*
         * Return a GML representation of feature
         * 
         * Structure :
         *
         *  feature.geometry // geometry object
         *  feature.geometry.CLASS_NAME // geometry type
         *      - OpenLayers.Geometry.Point
         *      - OpenLayers.Geometry.LineString
         *      - OpenLayers.Geometry.Polygon
         *  feature.geometry.components[] // array of points
         *      feature.geometry.components[].x
         *      feature.geometry.components[].y
         *
         * @param {OpenLayers.Feature} feature
         * @param {String} schema : GML schema
         *                 if schema = "http://schemas.opengis.net/gml/3.1.1/base/feature.xsd"
         *                 then a FeatureCollection is returned
         *                 otherwise a GeometryProperty is returned
         * 
         */
        featureToGML: function(feature, schema) {
            
            var gml = '';
            
            /*
             * Roll over each component. A component contain
             * a point in (x,y) map coordinates.
             * Each point is transformed in lat/lon for GML
             */
            if (feature && feature.geometry) {

                var gt = feature.geometry.CLASS_NAME;

                /*
                 * Initialize kml string based on the feature
                 * geometry class
                 */
                if (gt === "OpenLayers.Geometry.Point") {
                    gml = this.geometryPointToGML(feature.geometry);
                }
                else if (gt === "OpenLayers.Geometry.MultiPoint") {
                    // TODO
                }
                else if (gt === "OpenLayers.Geometry.LineString") {
                    gml = this.geometryLineStringToGML(feature.geometry);                    
                }
                else if (gt === "OpenLayers.Geometry.Polygon") {
                    return this.geometryPolygonToGML(feature.geometry); 
                }
                else if (gt === "OpenLayers.Geometry.MultiPolygon") {
                    if (feature.geometry.components) {
                        for (var i = 0, l = feature.geometry.components.length; i < l; i++) {
                            gml += this.geometryPolygonToGML(feature.geometry.components[i]);
                        }
                    }
                }
            }

            /*
             * Return a FeatureCollection
             */
            if (schema === "http://schemas.opengis.net/gml/3.1.1/base/feature.xsd") {
                return '<gml:FeatureCollection '+Map.Util.GML.namespaces+' ><gml:featureMember><gml:GeometryPropertyType>'+gml+'</gml:GeometryPropertyType></gml:featureMember></gml:FeatureCollection>';
            }
            
            /*
             * Return a GeometryType
             */
            return gml;
        
        },
        
        /*
         * @param {OpenLayers.Geometry.Point} geometry
         */
        geometryPointToGML: function(geometry) {
            var point;
            point = Map.Util.p2d(new OpenLayers.LonLat(geometry.x,geometry.y));
            return '<gml:Point '+Map.Util.GML.namespaces+' srsName="'+Map.map.displayProjection.projCode+'"><gml:pos>'+point.lon + ' ' + point.lat + '</gml:pos></gml:Point>';
        },
        
        /*
         * @param {OpenLayers.Geometry.LineString} geometry
         */
        geometryLineStringToGML: function(geometry) {
            
            var point, gml = '';
            
            /*
             * LineString geometry get a "components" array of points
             */
            if (geometry.components) {
                for (var i = 0, l = geometry.components.length; i < l; i++) {
                    point = geometry.components[i];
                    point = msp.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
                    gml += point.lon + ' ' + point.lat + ' ';
                }
            }

            /*
             * Remove trailing white space
             */
            return '<gml:LineString '+Map.Util.GML.namespaces+' srsName="'+Map.map.displayProjection.projCode+'"><gml:posList>'+gml.substring(0, gml.length-1)+'</gml:posList></gml:LineString>';
        },
        
        /*
         * @param {OpenLayers.Geometry.Polygon} geometry
         */
        geometryPolygonToGML: function(geometry) {
            
            var point, component, gml = '';

            /*
             * Polygon geometry get a "components" array of "components"
             */
            if (geometry.components) {
                for (var i = 0, l = geometry.components.length; i < l; i++) {
                    component = geometry.components[i];
                    for (var j = 0, k = component.components.length; j < k; j++){
                        point = component.components[j];
                        point = msp.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
                        gml += point.lon + ' ' + point.lat + ' ';
                    }
                }
            }

            /*
             * Remove trailing white space
             */
            return '<gml:Polygon '+Map.Util.GML.namespaces+' srsName="'+Map.map.displayProjection.projCode+'"><gml:exterior><gml:LinearRing><gml:posList>'+gml.substring(0, gml.length-1)+'</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon>';

        }
        
        
    }
    
})(window.msp, window.msp.Map);

