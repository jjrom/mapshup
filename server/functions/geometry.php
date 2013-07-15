<?php
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
 * Constant definition
 */
define("LATLON", 0);
define("LONLAT", 1);

/*
 * Compute modulus with float
 */
function modulus_of ($q, $d) {
  $rem = $q;
  while ($rem > $d )
     $rem -= $d;
  return $rem;
}

/**
 * Return POLYGON WKT from bbox
 * @param <string> $bbox "lonmin,latmin,lonmax,latmax"
 */
function bboxToWKTExtent($bbox) {
    $coords = preg_split('/,/', $bbox);
    $lonmin = $coords[0];
    $latmin = $coords[1];
    $lonmax = $coords[2];
    $latmax = $coords[3];
    return "POLYGON((" . $lonmin . " " . $latmin . "," . $lonmin . " " . $latmax . "," . $lonmax . " " . $latmax . "," . $lonmax . " " . $latmin . "," . $lonmin . " " . $latmin . "))";
}

/**
 * Return center POINT WKT from bbox
 * @param <string> $bbox "lonmin,latmin,lonmax,latmax"
 */
function bboxToWKTCenter($bbox) {
    $coords = preg_split('/,/', $bbox);
    $lonmin = $coords[0];
    $latmin = $coords[1];
    $lonmax = $coords[2];
    $latmax = $coords[3];
    return "POINT(" . (($lonmax + $lonmin) / 2.0) . " " . (($latmax + $latmin) / 2.0) . ")";
}

/**
 * Return GeoJSON polygon geometry from bbox
 * @param <float> $lonmin
 * @param <float> $latmin
 * @param <float> $lonmax
 * @param <float> $latmax
 */
function bboxToGeoJSONGeometry($lonmin, $latmin, $lonmax, $latmax) {
    $geometry = array(
        'type' => 'Polygon',
        'coordinates' => array(
            array(
                array($lonmin, $latmin),
                array($lonmin, $latmax),
                array($lonmax, $latmax),
                array($lonmax, $latmin),
                array($lonmin, $latmin)
            )
        )
    );

    return $geometry;
}

/**
 * Return GeoJSON point geometry from $lon lat
 * @param <float> $lon : longitude
 * @param <float> $lat : latitude
 */
function pointToGeoJSONGeometry($lon, $lat) {
    $geometry = array(
        'type' => 'Point',
        /* Ensure that longitude is between [-180,180] and latitude between [-90,90] */
        'coordinates' => array(modulus_of($lon+540,360) - 180, modulus_of($lat+270,180) - 90)
    );

    return $geometry;
}

/**
 * Return GeoJSON polygon geometry from poslist
 * @param <String> $posList : coordinates string (lon1 lat1 lon2 lat2 ... lonn latn)
 * @param <integer> $order : coordinates order of the input poslist (LONLAT for lon then lat; LATLON for lat then lon)
 */
function posListToGeoJSONGeometry($posList, $order) {

    /*
     * Explode posList into the $coordinates array
     * Note the trim() to avoid weird results :)
     */
    $posList = preg_replace('!\s+!', ' ', $posList);
    $coordinates = explode(' ', trim($posList));
    $count = count($coordinates);
    $couples = array();

    /*
     * Parse each coordinates
     */
    for ($i = 0; $i < $count; $i = $i + 2) {

        /*
         * Case 1 : coordinates order is latitude then longitude
         */
        if ($order == LATLON) {
            array_push($couples, array(floatval($coordinates[$i + 1]), floatval($coordinates[$i])));
        }
        /*
         * Case 2 : coordinates order is longitude then latitude
         */ else {
            array_push($couples, array(floatval($coordinates[$i]), floatval($coordinates[$i + 1])));
        }
    }

    $geometry = array(
        'type' => 'Polygon',
        'coordinates' => array($couples)
    );

    return $geometry;
}

/**
* Return a GeoJSON FeatureCollection from an ElasticSearch result
* 
*  Elastic Search result example :
*  
*      {
*          "took" : 138,
*          "timed_out" : false,
*          "_shards" : {
*              "total" : 5,
*              "successful" : 5,
*              "failed" : 0
*          },
*          "hits" : {
*              "total" : 19882872,
*              "max_score" : 1.0,
*              "hits" : [
*                  {
*                      "_index" : "osm",
*                      "_type" : "way",
*                      "_id" : "42165222",
*                      "_score" : 1.0,
*                      "_source" :{
*                          "centroid":[1.9309686748050385,44.192819178853966],
*                          "lengthKm":6.719306622689737,
*                          "areaKm2":1.1417793121178532,
*                          "shape":{
*                              "type":"polygon",
*                              "coordinates":[[[1.9304132,44.1974077],[1.9305396000000001,44.195908800000005],[1.931243,44.1946627],[1.9327492000000002,44.1944188],[1.9347191000000001,44.1940934],[1.9348400000000001,44.193344100000004],[1.9360017,44.1927651],[1.9364714,44.191850800000005],[1.9368212,44.191436200000005],[1.9384401000000002,44.1916917],[1.9397132000000001,44.191696300000004],[1.9416863000000002,44.190787400000005],[1.9418085,44.189955000000005],[1.9407707,44.1893691],[1.9391409000000002,44.190778200000004],[1.9387963000000001,44.190361100000004],[1.9391491,44.189612700000005],[1.940776,44.1886194],[1.9395094000000002,44.1876988],[1.9377793,44.186942800000004],[1.9352315000000002,44.1871841],[1.9358037000000001,44.1881022],[1.9341724,44.189594400000004],[1.9324328000000002,44.1901713],[1.929998,44.1907444],[1.9277904000000001,44.1919849],[1.9257061000000002,44.192144500000005],[1.9230418,44.1924671],[1.9210665,44.1936252],[1.9203623,44.194954300000006],[1.9216322000000001,44.195293],[1.9235919000000001,44.1963828],[1.9252103,44.196721600000004],[1.9264845000000002,44.1964769],[1.9272893000000002,44.197312800000006],[1.9275084,44.198978200000006],[1.928201,44.1992315],[1.9297109000000001,44.198487400000005],[1.9304132,44.1974077]]]
*                          },
*                          "tags":{"wood":"deciduous","source":"Union européenne - SOeS, CORINE Land Cover, 2006.","CLC:code":"311","CLC:id":"FR-211193","CLC:year":"2006","landuse":"forest"}
*                      }
*                  }
*                  ...etc...
*              ]
*          }
*      }
* 
* 
* 
* @param {String} elasticResult : a geocoded elasticSearch result
* @return {Object} : a GeoJSON object
* 
*/
function elasticResultToGeoJSON($elasticResult) {
    
    /*
     * ElasticSearch shape types are point, linestring and polygon
     * GeoJSON equivalent are Point, LineString and Polygon
     */
    $mapping = array(
        'point' => "Point",
        'linestring' => "LineString",
        'polygon' => "Polygon"
    );
    
    /*
     * Initialize empty GeoJSON FeatureCollection
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'features' => array()
    );
    
    /*
     * Return empty geojson feed if elasticresult is not valid
     */
    if (!$elasticResult || !$elasticResult->hits || !$elasticResult->hits->hits) {
        return $geojson;
    }
    
    /*
     * Create one feature for each elasticresult
     */
    $er = $elasticResult->hits->hits;
    for ($i = 0, $l = count($er); $i < $l; $i++) {
        $hit = $er[$i];
        $id = $hit->_id;
        $source = $hit->_source;
        $source->shape->type = $mapping[$source->shape->type];
        
        /*
         * Add tags properties to properties array
         */
        $source->tags->id = $id;
        
        /*
         * Add feature to FeatureCollection
         */
        array_push($geojson['features'], array(
            'type' => 'Feature',
            'geometry' => $source->shape,
            'properties' => get_object_vars($source->tags)
        ));
        
    }
    
    return $geojson;
        
};

/**
 * Transforms galactical coordinates into equatorial coordinates
 * into equatorial projection. Assuming J2000 referential
 * 
 * @param <Array> $pos : RA = pos[0] and DEC = pos[1] 
 */
function gal2eq($pos) {
    return astroTransform($pos, 1);
}

/**
 * Transforms equatorial coordinates into galactical coordinates
 * into equatorial projection. Assuming J2000 referential
 * 
 * @param <Array> $pos : RA = pos[0] and DEC = pos[1] 
 */
function eq2gal($pos) {
    return astroTransform($pos, 0);
}

/**
 *
 * Code derived from the HEALPix Java code supported by the Gaia project.
 * Copyright (C) 2006-2011 Gaia Data Processing and Analysis Consortium
 * Astrometric transformation gal2eq or eq2gal
 * 
 * @param array $pos Position in galactical or equatorial
 * @param integer $t Order of transformation (1: gal2eq, 0:eq2gal)
 * @return array $pos transformed
 */
function astroTransform($pos, $t) {
    
    /*
     * Constants
     */
    $psi = array(
        array(0.57595865315,4.92619181360,0.00000000000,0.00000000000,0.11129056012,4.70053728340),
        array(0.57477043300,4.93682924650,0.00000000000,0.00000000000,0.11142137093,4.71279419371)
    );
    $phi = array(
        array(4.92619181360,0.57595865315,0.00000000000,0.00000000000,4.70053728340,0.11129056012),
        array(4.93682924650,0.57477043300,0.00000000000,0.00000000000,4.71279419371,0.11142137093)
    );
    $stheta = array(
        array(0.88781538514,-0.88781538514, 0.39788119938,-0.39788119938, 0.86766174755,-0.86766174755),
        array(0.88998808748,-0.88998808748, 0.39777715593,-0.39777715593, 0.86766622025,-0.86766622025)
    );
    $ctheta = array(
        array(0.46019978478,0.46019978478,0.91743694670,0.91743694670,0.49715499774,0.49715499774),
        array(0.45598377618,0.45598377618,0.91748206207,0.91748206207,0.49714719172,0.49714719172)
    );
    
    $J2000 = 1; //by setting J2000 = 0, RA-Dec are intended in Equinox 1950.
    $deg2rad = 180.0 / pi();
    
    $a = ($pos[0] / $deg2rad) - $phi[$J2000][$t];
    $b = $pos[1] / $deg2rad;
    $sb = sin($b);
    $cb = cos($b);
    $cbsa = $cb * sin($a);
    $b = -$stheta[$J2000][$t] * $cbsa + $ctheta[$J2000][$t] * $sb;
    $b = max(-1.0,min($b,1.0));
    $bo = asin($b)*$deg2rad;

    $a = atan2($ctheta[$J2000][$t] * $cbsa + $stheta[$J2000][$t] * $sb, $cb * cos($a));
    $ao = modulus_of(($a + $psi[$J2000][$t] + (4 * pi())),2 * pi()) * $deg2rad;
    
    return array($ao,$bo);
				      
}

/*
 * This is why astro and geo scientists cannot understand themself :)
 * 
 * The geo community : longitudes in ESPG:4326 go from -180 to 180 degrees
 * Damn logical !
 * 
 *            --------->
 * 
 *    +-----------+-------------+
 *    |                         |
 *    |                         |
 *    |                         |
 *    |                         |
 *    |                         |
 *    +-----------+-------------+
 *  -180          0            180
 * 
 * 
 * The astro community : longitudes goes from 180 to 0 and 360 to 180 degrees
 * ...
 * 
 *    <----------- <-------------
 * 
 *    +-----------+-------------+
 *    |                         |
 *    |                         |
 *    |                         |
 *    |                         |
 *    |                         |
 *    +-----------+-------------+
 *   180        0/360          180
 * 
 * 
 * @param array $pos Coordinates in spherical reference
 * @return array $pos Coordinates transformed in EPSG:4326
 */
function spheric2proj($pos) {
    
    /*
     * 1. latitude does not change
     * 2. longitude are processed as follow
     */
    if ($pos[0] >= 0 and $pos[0] <= 180) {
        $pos[0] = -$pos[0];
    }
    else {
        $pos[0] = 360 - $pos[0];
    }
    
    return $pos;
}

?>