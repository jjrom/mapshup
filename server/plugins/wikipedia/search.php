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

/* =========================== FUNCTIONS ========================== */
/*
 * Example of response
  <geonames>
  <entry>
  <lang>en</lang>
  <title>London</title>
  <summary>
  London (; and largest urban area of England and the United Kingdom. At its core, the ancient City of London, to which the name historically belongs, still retains its limited mediaeval boundaries; but since at least the 19th century the name "London" has also referred to the whole metropolis which has developed around it.Mills, A (...)
  </summary>
  <feature>city</feature>
  <countryCode>GB</countryCode>
  <population>7421228</population>
  <elevation>0</elevation>
  <lat>51.5094</lat>
  <lng>-0.1183</lng>
  <wikipediaUrl>http://en.wikipedia.org/wiki/London</wikipediaUrl>
  <thumbnailImg>
  http://www.geonames.org/img/wikipedia/43000/thumb-42715-100.jpg
  </thumbnailImg>
  </entry>
  </geonames>
 *
 */
function toGeoJSON($resultFileURI) {

    $doc = new DOMDocument();

    /*
     * Load error => return an empty GeoJSON
     */
    if (@$doc->load($resultFileURI) === false) {
        $geojson = array(
            'type' => 'FeatureCollection',
            'features' => array()
        );
        return json_encode($geojson);
    }

    $entries = $doc->getElementsByTagname('entry');

    /*
     * No SearchResult => return an empty GeoJSON
     */
    if ($entries->item(0) == null) {
        /*
         * GeoJSON
         */
        $geojson = array(
            'type' => 'FeatureCollection',
            'features' => array()
        );
        return json_encode($geojson);
    }

    /*
     * GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'features' => array()
    );

    foreach ($entries as $entry) {

        /**
         * Add feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => pointToGeoJSONGeometry($entry->getElementsByTagname('lng')->item(0)->nodeValue, $entry->getElementsByTagname('lat')->item(0)->nodeValue),
            'properties' => array(
                'name' => $entry->getElementsByTagname('title')->item(0)->nodeValue,
                'description' => $entry->getElementsByTagname('summary')->item(0)->nodeValue,
                'url' => $entry->getElementsByTagname('wikipediaUrl')->item(0)->nodeValue,
                'img_url' => $entry->getElementsByTagname('thumbnailImg')->item(0)->nodeValue
            )
        );

        // Add feature array to feature collection array
        array_push($geojson['features'], $feature);
    }

    return json_encode($geojson);
}
/* ============================= END FUNCTIONS ========================= */

/**
 * This script returns GeoJSON
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
$url = 'http://ws.geonames.net/wikipediaSearch?username=jrom&';

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
$url = $url . "q=" . $q . "&maxRows=" . $maxRows . "&lang=" . $lang;
echo toGeoJSON(saveFile(getRemoteData($url, null, false), MSP_UPLOAD_DIR . "wikipedia_" . createPassword(10) . ".xml"));
?>