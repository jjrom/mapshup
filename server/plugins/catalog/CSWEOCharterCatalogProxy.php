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
include_once 'charter/CECECConfigFile.php';

/**
 * This script returns JSON data
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Get input values
 */
if (isset($_REQUEST['bbox']) && $_REQUEST['bbox'] != "") {
    $bbox = preg_split('/,/', $_REQUEST['bbox']);
    $req = 'LLlat=' . $bbox[1];
    $req .= '&LLlon=' . $bbox[0];
    $req .= '&URlat=' . $bbox[3];
    $req .= '&URlon=' . $bbox[2];
} else {
    $req = 'LLlat=-90';
    $req .= '&LLlon=-180';
    $req .= '&URlat=90';
    $req .= '&URlon=180';
}

/*
 * Get dates
 */
$dates = getDatesFromInterval(isset($_REQUEST["startDate"]) ? $_REQUEST["startDate"] : null);

/*
 * If completionDate is set it replaces $dates['completionDate']
 */
if (isset($_REQUEST["completionDate"])) {
    $dates['completionDate'] = addTimeToDate(urldecode($_REQUEST["completionDate"]));
}

$req .= '&completionDate=' . ($dates['completionDate'] ? $dates['completionDate'] : "");
$req .= '&startDate=' . ($dates['startDate'] ? $dates['startDate'] : "");

/*
 * Disaster date interval
 */
$dates = getDatesFromInterval(isset($_REQUEST["disasterStartDate"]) ? $_REQUEST["disasterStartDate"] : null);
$req .= '&disasterEndDate=' . ($dates['completionDate'] ? $dates['completionDate'] : "");
$req .= '&disasterStartDate=' . ($dates['startDate'] ? $dates['startDate'] : "");

/**
 * Force CALL ID to be on 3 digits
 */
$callid = "";
if (isset($_REQUEST['disasterCallId'])) {
    $callid = $_REQUEST['disasterCallId'];
    if (strlen($callid) == 1) {
        $callid = "0" . $callid;
    }
    if (strlen($callid) == 2) {
        $callid = "0" . $callid;
    }
}
$req .= '&disasterCallId=' . $callid;

$req .= '&disasterType=' . (isset($_REQUEST['disasterType']) ? $_REQUEST['disasterType'] : "");
$req .= '&satelliteName=' . (isset($_REQUEST['satelliteName']) ? $_REQUEST['satelliteName'] : "");
$req .= '&cursor=' . (isset($_REQUEST['nextRecord']) ? $_REQUEST['nextRecord'] : 1);
$req .= '&maxResults=' . (isset($_REQUEST['numRecordsPerPage']) ? $_REQUEST['numRecordsPerPage'] : MSP_RESULTS_PER_PAGE);

$proxyURL = 'catalogProxy';
if (isset($_REQUEST['proxyUrl']) && $_REQUEST['proxyUrl'] != "") {
    $proxyURL = $_REQUEST['proxyUrl'];
}
$req .= '&proxyUrl=' . $proxyURL;
$req .= '&catalog=' . $catalogURL;
$req .= '&catalogType=' . $catalogType;
//$req = "catalog=http://disasterschartercatalog.org/ebrrcecec4/webservice&cursor=1&maxResults=10&startDate=&completionDate=&LLlat=-90&LLlon=-180&URlat=90&URlon=180&satelliteName=---&disasterStartDate=&disasterEndDate=&disasterType=&disasterActivationId=&disasterCallId=&catalogType=ebRR";

/**
 * Get POST data
 */
$curl = initCurl($catalogProxyURL);
curl_setopt($curl, CURLOPT_URL, urldecode($catalogProxyURL));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($curl, CURLOPT_POSTFIELDS, $req);
curl_setopt($curl, CURLOPT_POST, 1);
$theData = curl_exec($curl);
curl_close($curl);

/* json result */
$json = json_decode($theData);

$geojson = array(
    'type' => 'FeatureCollection',
    'totalResults' => isset($json->results) ? $json->results : 0,
    'features' => array()
);

if (isset($json->rows)) {
    foreach ($json->rows as $row) {

        /*
         * Add feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => poslistToGeoJSONGeometry($row->poslist, LATLON),
            'properties' => array(
                'identifier' => $row->identifier,
                'producttype' => $row->producttype,
                'beginposition' => $row->beginposition,
                'endposition' => $row->endposition,
                'acquisitiontype' => $row->acquisitiontype,
                'status' => $row->status,
                'triggeringidentifier' => $row->triggeringidentifier,
                'description' => $row->description,
                'disasterdate' => $row->disasterdate,
                'disastertype' => $row->disastertype,
                'location' => $row->location,
                'thumbnail' => $row->thumbnail,
                'quicklook' => $row->quicklook
            )
        );

        // Add feature array to feature collection array
        array_push($geojson['features'], $feature);
    }
}
/* Returns encoded geojson string */
echo json_encode($geojson);

?>