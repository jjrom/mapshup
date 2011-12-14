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

include_once '../../config.php';
include_once '../../functions/general.php';
include_once '../../functions/geometry.php';

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * TODO : allow only ws.geonames.net to idenfied user ?
 * $url = 'http://ws.geonames.org/wikipediaSearch?';
 */
$url = 'http://ws.geonames.net/searchJSON?username=jrom&';

/*
 * Search terms
 */
$q = isset($_REQUEST["q"]) ? $_REQUEST["q"] : "";

/*
 * Lang
 */
$lang = isset($_REQUEST["lang"]) ? $_REQUEST["lang"] : "en";

/*
 * Number of results
 */
$maxRows = isset($_REQUEST["maxRows"]) ? $_REQUEST["maxRows"] : MSP_RESULTS_PER_PAGE;

/**
 * NB: tags are comma separated
 */
$url = $url . "q=" . $q . "&maxRows=" . $maxRows . "&lang=" . $lang . "&featureClass=P&featureClass=A";

/*
 * Get Geonames JSON result
 * Structure :
 *
 * {"totalResultsCount":2,"geonames":
 * [{"countryName":"France",
 *   "adminCode1":"B3",
 *   "fclName":"city, village,...",
 *   "countryCode":"FR",
 *   "lng":1.2323570251464844,
 *   "fcodeName":"populated place",
 *   "toponymName":"Léguevin",
 *   "fcl":"P",
 *   "name":"Léguevin",
 *   "fcode":"PPL",
 *   "geonameId":3003874,
 *   "lat":43.60028402353632,
 *   "adminName1":"Midi-Pyrénées",
 *   "population":6976},
 *  {"countryName":"France",
 *   (...etc...)
 *  }]}
 */
$json = json_decode(getRemoteData($url, null, false));

$geojson = array(
    'type' => 'FeatureCollection',
    'features' => array()
);

/*
 * Problem reading json => return an empty GeoJSON
 */
if ($json == NULL) {
    echo json_encode($geojson);
    exit(0);
}

/*
 *
 */
foreach ($json->geonames as $row) {

    /*
     * Add feature
     */
    $feature = array(
        'type' => 'Feature',
        'geometry' => pointToGeoJSONGeometry($row->lng, $row->lat),
        'properties' => array(
            'name' => $row->name,
            'countryName' => $row->countryName,
            'population' => $row->population
        )
    );

    // Add feature array to feature collection array
    array_push($geojson['features'], $feature);
}

/* Returns encoded geojson string */
echo json_encode($geojson);
?>