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

/*
 * Launch search on mapshup ElasticSearch server
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
 * OSM Elastic Server index url
 */
$url = 'http://es.mapshup.info/osm/';

/*
 * Set request parameters
 */
$q = isset($_REQUEST["q"]) ? $_REQUEST["q"] : "";
$bbox = isset($_REQUEST["bbox"]) ? $_REQUEST["bbox"] : "-180,-90,180,90";
$type = 'node';

/*
 * Number of results
 */
$count = isset($_REQUEST["count"]) ? $_REQUEST["count"] : MSP_RESULTS_PER_PAGE;
if (!is_numeric($count)) {
    $count = MSP_RESULTS_PER_PAGE;
}

/*
 * Valid bbox for Elastic Search is UpperRight, LowerLeft
 */
$coords = preg_split('/,/', $bbox);
$lonmin = $coords[0];
$latmin = $coords[1];
$lonmax = $coords[2];
$latmax = $coords[3];

/*
 * Request template
 */
$data = '{"size":' . $count . ',"query":{"filtered":{"query":{"match_all":{}},"filter":{"and":{"filters":[{"geo_shape":{"shape":{"shape":{"type":"envelope","coordinates":[[' . $lonmin . ',' . $latmax . '],[' . $lonmax . ',' . $latmin . ']]}}}}';

/*
 * Query form
 * node:tags.cuisine=chinese
 * node:tags.amenity=restaurant
 *      
 */
if ($q) {
    $typeAndfilter = explode(':', $q);
    if (count($typeAndfilter) === 2) {
        $keyval = explode('=', $typeAndfilter[1]);
        $type = $typeAndfilter[0];
    } else {
        $keyval = explode('=', $typeAndfilter[0]);
    }
    if (count($keyval) === 2) {
        $data .= ',{"term":{"' . $keyval[0] . '":"' . $keyval[1] . '"}}';
    }
    else {
        $data .= ',{"term":{"name":"' . $keyval[0] . '"}}';
    }
}
$data .= ']}}}}}';

/*
 * Get result in json format
 * 
 * Result example :
 * 
 *      {"took" : 138,"_shards" : {"total" : 5},"hits" :{"total" : 19882872,"hits" : [{"_index" : "osm","_type" : "way","_id" : "42165222","_score" : 1.0,"_source" :{"areaKm2":1.1417793121178532,"shape":{"type":"polygon","coordinates":[[[1.9304132,44.1974077],[1.9305396000000001,44.195908800000005],[1.931243,44.1946627],[1.9327492000000002,44.1944188],[1.9347191000000001,44.1940934],[1.9348400000000001,44.193344100000004],[1.9360017,44.1927651],[1.9364714,44.191850800000005],[1.9368212,44.191436200000005],[1.9384401000000002,44.1916917],[1.9397132000000001,44.191696300000004],[1.9416863000000002,44.190787400000005],[1.9418085,44.189955000000005],[1.9407707,44.1893691],[1.9391409000000002,44.190778200000004],[1.9387963000000001,44.190361100000004],[1.9391491,44.189612700000005],[1.940776,44.1886194],[1.9395094000000002,44.1876988],[1.9377793,44.186942800000004],[1.9352315000000002,44.1871841],[1.9358037000000001,44.1881022],[1.9341724,44.189594400000004],[1.9324328000000002,44.1901713],[1.929998,44.1907444],[1.9277904000000001,44.1919849],[1.9257061000000002,44.192144500000005],[1.9230418,44.1924671],[1.9210665,44.1936252],[1.9203623,44.194954300000006],[1.9216322000000001,44.195293],[1.9235919000000001,44.1963828],[1.9252103,44.196721600000004],[1.9264845000000002,44.1964769],[1.9272893000000002,44.197312800000006],[1.9275084,44.198978200000006],[1.928201,44.1992315],[1.9297109000000001,44.198487400000005],[1.9304132,44.1974077]]]},"tags":{"wood":"deciduous","source":"Union européenne - SOeS, CORINE Land Cover, 2006.","CLC:code":"311","CLC:id":"FR-211193","CLC:year":"2006","landuse":"forest"}}}]}}
 * 
 */
$json = postRemoteData($url . '/' . ($type === 'way' ? 'way' : 'node') . '/_search', $data, false);

/*
 * Problem reading json => return an empty GeoJSON
 */
if ($json == NULL) {
    echo json_encode(array(
        'type' => 'FeatureCollection',
        'features' => array()
    ));
}
else {
    echo json_encode(elasticResultToGeoJSON(json_decode($json)));
}
exit(0);
?>