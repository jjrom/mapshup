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

/*
 * Flickr API KEY must be requested here
 * 
 * http://www.flickr.com/services/api/misc.api_keys.html
 * 
 */
$url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&api_key=' . MSP_FLICKR_KEY . '&has_geo=1&';

/*
 * Set request parameters
 */
$q = isset($_REQUEST["q"]) ? $_REQUEST["q"] : "";
$machine_tags = isset($_REQUEST["machine_tags"]) ? $_REQUEST["machine_tags"] : "";
$user_id = isset($_REQUEST["userID"]) ? $_REQUEST["userID"] : "";
$tag_mode = isset($_REQUEST["tag_mode"]) ? $_REQUEST["tag_mode"] : "";
$per_page = isset($_REQUEST["maxfeatures"]) ? $_REQUEST["maxfeatures"] : MSP_RESULTS_PER_PAGE;
$bbox = isset($_REQUEST["bbox"]) ? $_REQUEST["bbox"] : "-180,-90,180,90";
$relevance = isset($_REQUEST["relevance"]) ? $_REQUEST["relevance"] : "";
$start = isset($_REQUEST["start"]) ? str_replace("T00:00:00", "", $_REQUEST["start"]) : "";
$end = isset($_REQUEST["end"]) ? str_replace("T00:00:00", "", $_REQUEST["end"]) : "";

/*
 * url_s is equivalent to thumbnail
 * url_l is equivalent to quicklook
 * url_sq is a small square image use for layer symbology
 */
$extras = "description,tags,geo,url_s,url_l,url_sq";

/*
 * Construct url with input parameters
 */
$url = $url . "tags=" . str_replace(" ", ",", $q) . "&machine_tags=" . $machine_tags . "&user_id=" . $user_id . "&tag_mode=" . $tag_mode . "&extras=" . $extras . "&per_page=" . $per_page . "&bbox=" . $bbox . "&relevance=" . $relevance. "&min_taken_date=" . $start . "&max_taken_date=" . $end;

/*
 * Get flickr result in json format
 */
$json = getRemoteData($url, null, false);

/*
 * The flickr result is not valid json string
 * It is surrounded by a jsonFlickApi() function
 * Thus, first we need to get rid of this function
 * before decode the json string
 */
$json = str_replace('jsonFlickrApi(', '', $json);
$json = json_decode(substr($json, 0, strlen($json) - 1));

/*
 * Initiate an empty GeoJSON object
 */
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
 * JSON result Structure :
 * {
 *  jsonFlickrApi({
 *      "photos":{
 *          "page":1,
 *          "pages":336,
 *          "perpage":20,
 *          "total":"6715",
 *          "photo":[{
 *              "id":"5637250714",
 *              "owner":"11843349@N06",
 *              "secret":"88c6b1347e",
 *              "server":"5150",
 *              "farm":6,
 *              "title":"#61: Egg Custard Tart @ Golden Gate Bakery",
 *              "ispublic":1,
 *              "isfriend":0,
 *              "isfamily":0,
 *              "description":{
 *                  "_content":"1029 Grant Avenue San Francisco, CA\n\nThis photo is part of a set found <a href=\"http:\/\/www.flickr.com\/photos\/jmp_photos\/sets\/72157626394801767\/\">here<\/a>."
 *              },
 *              "tags":"sf magazine golden big gate san francisco die you egg before things eat bakery 100 custard try tart the 2011 7x7",
 *              "latitude":37.796302,
 *              "longitude":-122.406669,
 *              "accuracy":"16",
 *              "place_id":"9xdhxY.bAptvBjHo",
 *              "woeid":"2379855",
 *              "geo_is_family":0,
 *              "geo_is_friend":0,
 *              "geo_is_contact":0,
 *              "geo_is_public":1,
 *              "url_s":"http:\/\/farm6.static.flickr.com\/5150\/5637250714_88c6b1347e_m.jpg",
 *              "url_l":"http:\/\/farm6.static.flickr.com\/5150\/5637250714_88c6b1347e_b.jpg",
 *              "height_s":"188",
 *              "width_s":"240",
 *              "url_sq":"http:\/\/farm6.static.flickr.com\/5150\/5637250714_88c6b1347e_sq.jpg",
 *              "height_sq":"78",
 *              "width_sq":"100"
 *         },
 *         ...etc...
 *         ]
 *     }
 * })
 *
 */
$photos = $json->photos->photo;
$length = count($photos);
for ($i = 0; $i < $length; $i++) {

    $row = $photos[$i];

    /*
     * Add feature
     */
    $feature = array(
        'type' => 'Feature',
        'geometry' => pointToGeoJSONGeometry($row->longitude, $row->latitude),
        'properties' => array(
            'identifier' => $row->id,
            'name' => $row->title,
            'owner' => $row->owner,
            'thumbnail' => $row->url_s,
            'quicklook' => $row->url_l,
            'icon' => $row->url_sq,
            'tags' => $row->tags,
            'description' => $row->description->_content
        )
    );

    // Add feature array to feature collection array
    array_push($geojson['features'], $feature);
}

echo json_encode($geojson);
?>