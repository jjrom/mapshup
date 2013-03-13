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
    $req = 'selat=' . $bbox[1];
    $req .= '&nwlon=' . $bbox[0];
    $req .= '&nwlat=' . $bbox[3];
    $req .= '&selon=' . $bbox[2];
} else {
    $req = 'selat=-90';
    $req .= '&nwlon=-180';
    $req .= '&nwlat=90';
    $req .= '&selon=180';
}

$dates = getDatesFromInterval(isset($_REQUEST["startDate"]) ? $_REQUEST["startDate"] : null);

/*
 * If completionDate is set it replaces $dates['completionDate']
 */
if (isset($_REQUEST["completionDate"])) {
    $dates['completionDate'] = addTimeToDate(urldecode($_REQUEST["completionDate"]));
}

$req .= '&ed=' . ($dates['completionDate'] ? $dates['completionDate'] : "");
$req .= '&sd=' . ($dates['startDate'] ? $dates['startDate'] : "");

/*
 * SPOT Dali Rest Server information
 *
 * Server : engine.mapshup.info
 * IP     : 213.251.187.141
 * API KEY: 2KYfZcCsisLrlToDWn5_uQ::
 *
 * Example of a search link:
 * http://api.spotimage.com/catalog/spot/data/Dali.svc/search?
 * of=json
 * &sd=2009-01-01T00:00:00
 * &ed=2009-01-07T00:00:00
 * &mc=100
 * &mi=30
 * &minr=2.5
 * &maxr=20
 * &zt=rectangle
 * &nwlat=52&selat=48&nwlon=9&selon=13
 * &sk={key}
 *
 */
$req .= '&of=json&zt=rectangle&sk=2KYfZcCsisLrlToDWn5_uQ::';
$url = 'http://api.spotimage.com/catalog/spot/data/Dali.svc/search?' . $req;
$json = json_decode(getRemoteData($url, null, false));
$geojson = array(
    'type' => 'FeatureCollection',
    'features' => array()
);

/*
 * Error ?
 */
if ($json->Message != null) {
    $error = array(
        'code' => $json->Code,
        'message' => $json->Message
    );
    $geojson['error'] = $error;
}
/*
 * Normal work !
 */
else {
    foreach ($json->Scenes as $row) {

        /*
         * Compute poslist from scene coordinates
         */
        $poslist = $row->LowerLeft->Longitude . " " .
                   $row->LowerLeft->Latitude . " " .
                   $row->LowerRight->Longitude . " " .
                   $row->LowerRight->Latitude . " " .
                   $row->UpperRight->Longitude . " " .
                   $row->UpperRight->Latitude . " " .
                   $row->UpperLeft->Longitude . " " .
                   $row->UpperLeft->Latitude . " " .
                   $row->LowerLeft->Longitude . " " .
                   $row->LowerLeft->Latitude;

        /*
         * Add feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => poslistToGeoJSONGeometry($poslist, LONLAT),
            'properties' => array(
                'identifier' => $row->Id,
                'acquisitiondate' => $row->AcquisitionDate,
                'archivingstation' => $row->ArchivingStation,
                'satellite' => $row->Satellite,
                'sensorfamily' => $row->SensorFamily,
                'resolution' => $row->Resolution,
                'cloudcoverpercentage' => $row->CloudCoverPercentage,
                'snowcoverpercentage' => $row->SnowCoverPercentage,
                'incidenceangle' => $row->IncidenceAngle,
                'quicklook' => $row->ImageUrl,
                'thumbnail' => $row->ImageUrl
            )
        );

        // Add feature array to feature collection array
        array_push($geojson['features'], $feature);
    }
}
/* Returns encoded geojson string */
echo json_encode($geojson);
?>