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
(function(M, Map) {
    
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
            
            var i, l, gml = '';
            
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
                else if (gt === "OpenLayers.Geometry.MultiLineString") {
                    if (feature.geometry.components) {
                        for (i = 0, l = feature.geometry.components.length; i < l; i++) {
                            gml += this.geometryLineStringToGML(feature.geometry.components[i]);
                        }
                    }
                }
                else if (gt === "OpenLayers.Geometry.Polygon") {
                    return this.geometryPolygonToGML(feature.geometry); 
                }
                else if (gt === "OpenLayers.Geometry.MultiPolygon") {
                    if (feature.geometry.components) {
                        for (i = 0, l = feature.geometry.components.length; i < l; i++) {
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
            console.log(geometry);
            /*
             * LineString geometry get a "components" array of points
             */
            if (geometry.components) {
                for (var i = 0, l = geometry.components.length; i < l; i++) {
                    point = geometry.components[i];
                    point = M.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
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
                        point = M.Map.Util.p2d(new OpenLayers.LonLat(point.x,point.y));
                        gml += point.lon + ' ' + point.lat + ' ';
                    }
                }
            }

            /*
             * Remove trailing white space
             */
            return '<gml:Polygon '+Map.Util.GML.namespaces+' srsName="'+Map.map.displayProjection.projCode+'"><gml:exterior><gml:LinearRing><gml:posList>'+gml.substring(0, gml.length-1)+'</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon>';

        },
        
        /*
         * Take a GML object in entry and return a GeoJSON FeatureCollection string
         * 
         * GeoJSON example (from http://www.geojson.org/geojson-spec.html)
         * 
         *      { "type": "FeatureCollection",
         *          "features": [
         *              { 
         *                  "type": "Feature",
         *                  "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
         *                  "properties": {"prop0": "value0"}
         *              },
         *              {
         *                  "type": "Feature",
         *                  "geometry": {
         *                      "type": "LineString",
         *                      "coordinates": [
         *                          [102.0, 0.0], 
         *                          [103.0, 1.0], 
         *                          [104.0, 0.0], 
         *                          [105.0, 1.0]
         *                       ]
         *                  },
         *                  "properties": {"prop0": "value0", "prop1": 0.0}
         *              },
         *              { 
         *                  "type": "Feature",
         *                  "geometry": {
         *                      "type": "Polygon",
         *                      "coordinates": [
         *                           [
         *                              [100.0, 0.0],
         *                              [101.0, 0.0],
         *                              [101.0, 1.0],
         *                              [100.0, 1.0],
         *                              [100.0, 0.0]
         *                           ]
         *                      ]
         *                  },
         *                  "properties": {"prop0": "value0","prop1": {"this": "that"} }
         *              }
         *          ]
         *      }
         *      
         *      
         * @param {jQuery Object} gml : gml in javascript XML object
         * @param {Object} properties : properties to set
         * 
         */
        toGeoJSON: function(gml, properties) {
            
            var geoJSON = {};
            
            /*
             * Input gml description must be a jQuery object to be parsed
             */
            if (gml instanceof jQuery) {
                
                /*
                 * Detect GML type
                 */
                switch (M.Util.stripNS(gml[0].nodeName)) {
                    case 'Point':
                        geoJSON = this.pointToGeoJSON(gml, properties);
                        break;
                    case 'LineString':
                        geoJSON = this.lineStringToGeoJSON(gml, properties);
                        break;
                    case 'Polygon':
                        geoJSON = this.polygonToGeoJSON(gml, properties);
                        break;
                    
                }
                
            }
            
            return geoJSON;
        },
        
        /*
         * Return a GeoJSON geometry from a GML Point
         * 
         *  GML Point structure 
         *  
         *          <gml:Point srsName="urn:ogc:def:crs:epsg:7.9:4326">
         *              <gml:pos>77.0223274997802 52.58523464466345</gml:posList>
         *          </gml:Point>
         *  
         * @param {jQuery Object} gml : gml in javascript XML object
         * @param {Object} properties : properties to set
         * 
         */
        pointToGeoJSON: function(gml, properties) {
            
            properties = properties || {identifier:M.Util.getId()};
            
            /*
             * First children is gml:posList
             */
            return JSON.parse(M.Util.parseTemplate(this.geoJSONTemplate,{
                geometry:'{"type":"LineString","coordinates":['+Map.Util.posListToGeoJsonGeometry(gml.children().text())+']}',
                properties:JSON.stringify(properties)
            }));
            
        },
        
        /*
         * Return a GeoJSON geometry from a GML Polygon
         * 
         *  GML LineString structure 
         *  
         *          <gml:LineString srsName="urn:ogc:def:crs:epsg:7.9:4326">
         *              <gml:posList>77.0223274997802 52.58523464466345 86.63758854839588 41.09044727093532 86.34797437056751 40.97981843953097 77.0223274997802 52.58523464466345</gml:posList>
         *          </gml:LineString>
         *  
         * @param {jQuery Object} gml : gml in javascript XML object
         * @param {Object} properties : properties to set
         * 
         */
        lineStringToGeoJSON: function(gml, properties) {
            
            properties = properties || {identifier:M.Util.getId()};
            
            /*
             * First children is gml:posList
             */
            return JSON.parse(M.Util.parseTemplate(this.geoJSONTemplate,{
                geometry:'{"type":"LineString","coordinates":['+Map.Util.posListToGeoJsonGeometry(gml.children().text())+']}',
                properties:JSON.stringify(properties)
            }));
            
        },
        
        /*
         * Return a GeoJSON geometry from a GML Polygon
         * 
         *  GML Polygon structure 
         *  
         *          <gml:Polygon srsName="urn:ogc:def:crs:epsg:7.9:4326">
         *               <gml:exterior>
         *                   <gml:LinearRing srsName="urn:ogc:def:crs:epsg:7.9:4326">
         *                      <gml:posList>77.0223274997802 52.58523464466345 86.63758854839588 41.09044727093532 86.34797437056751 40.97981843953097 77.0223274997802 52.58523464466345</gml:posList>
         *                   </gml:LinearRing>
         *               </gml:exterior>
         *           </gml:Polygon>
         *  
         * @param {jQuery Object} gml : gml in javascript XML object
         * @param {Object} properties : properties to set
         * 
         */
        polygonToGeoJSON: function(gml, properties) {
            
            var geometries = [];
            
            properties = properties || {identifier:M.Util.getId()};
            
            /*
             * Roll over exterior and interiors
             */
            gml.children().each(function(){
                
                /*
                 * Parse interior and interiors
                 */
                $(this).children().each(function() {
                    geometries.push('[' + Map.Util.posListToGeoJsonGeometry($(this).children().text())+']');
                });
                
            });
            
            return JSON.parse(M.Util.parseTemplate(this.geoJSONTemplate,{
                geometry:'{"type":"Polygon","coordinates":['+geometries.join(',')+']}',
                properties:JSON.stringify(properties)
            }));
            
        },
        
        geoJSONTemplate:'{"type":"FeatureCollection","features":[{"type":"Feature","geometry":$geometry$,"properties":$properties$}]}'
        
    }
    
})(window.M, window.M.Map);

