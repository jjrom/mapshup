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
?>