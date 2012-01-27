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
include_once '../../functions/magicutils.php';
include_once '../../functions/geometry.php';

/* ======================== FUNCTIONS =========================== */

function toGeoJSON($resultFileURI) {

    $doc = new DOMDocument();
    $doc->load($resultFileURI);
    
    $type = getSentinelType($doc);

    /*
     * Initialize GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'features' => array()
    );


    if ($type == "gs2_dimap_document") {

        /*
         * Two cases :
         *  - Global_Footprint is defined => S2_DIMAP final product
         *  - Global_Footprint is not defined => intermediate product use Granule
         */
        $footprints = $doc->getElementsByTagname('Global_Footprint');

        /*
         * Global footprint
         */
        $ds = $doc->getElementsByTagName('Data_Strip_Identification')->item(0);
        $properties = array(
            'identifier' => $doc->getElementsByTagName('DATASET_NAME')->item(0)->nodeValue,
            'DATA_STRIP_ID' => $ds->getElementsByTagName('DATA_STRIP_ID')->item(0)->nodeValue,
            'DATA_STRIP_TYPE' => $ds->getElementsByTagName('DATA_STRIP_TYPE')->item(0)->nodeValue,
            'RECEPTION_STATION' => $ds->getElementsByTagName('RECEPTION_STATION')->item(0)->nodeValue,
            'ARCHIVING_STATION' => $ds->getElementsByTagName('ARCHIVING_STATION')->item(0)->nodeValue,
            'ARCHIVING_DATE' => $ds->getElementsByTagName('ARCHIVING_DATE')->item(0)->nodeValue,
            'DOWNLINK_ORBIT_NUMBER' => $ds->getElementsByTagName('DOWNLINK_ORBIT_NUMBER')->item(0)->nodeValue,
            'ORBIT_NUMBER' => $ds->getElementsByTagName('ORBIT_NUMBER')->item(0)->nodeValue,
            'ACQUISITION_PLATFORM' => $ds->getElementsByTagName('ACQUISITION_PLATFORM')->item(0)->nodeValue,
            'ACQUISITION_DATE' => $ds->getElementsByTagName('ACQUISITION_DATE')->item(0)->nodeValue,
            'ACQUISITION_ORBIT_DIRECTION' => $ds->getElementsByTagName('ACQUISITION_ORBIT_DIRECTION')->item(0)->nodeValue,
            'DOWNLINK_PRIORITY_FLAG' => $ds->getElementsByTagName('DOWNLINK_PRIORITY_FLAG')->item(0)->nodeValue
        );

        if ($footprints->item(0)->getElementsByTagName('EXT_POS_LIST')->item(0)->nodeValue != "0 0 0 0") {

            foreach ($footprints as $footprint) {

                $feature = array(
                    'type' => 'Feature',
                    'geometry' => posListToGeoJSONGeometry($footprint->getElementsByTagName('EXT_POS_LIST')->item(0)->nodeValue, LATLON),
                    'crs' => array(
                        'type' => 'EPSG',
                        'properties' => array('code' => '4326')
                    ),
                    'properties' => $properties
                );

                // Add feature array to feature collection array
                array_push($geojson['features'], $feature);
            }
        } else {
            /*
             * Quicklook_Descriptor
             */
            $qs = $doc->getElementsByTagName('Quicklook_Descriptor');

            /*
             * Roll over detectors
             */
            foreach ($qs as $q) {

                $feature = array(
                    'type' => 'Feature',
                    'geometry' => posListToGeoJSONGeometry($q->getElementsByTagName('EXT_POS_LIST')->item(0)->nodeValue, LATLON),
                    'crs' => array(
                        'type' => 'EPSG',
                        'properties' => array('code' => '4326')
                    ),
                    'properties' => $properties
                );

                // Add feature array to feature collection array
                array_push($geojson['features'], $feature);
            }
        }
    }

    return json_encode($geojson);
}

/* ============================ END FUNCTIONS ======================== */

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Get input values url
 */
$url = isset($_REQUEST["url"]) ? $_REQUEST["url"] : null;

/**
 * No Url specified => returns empty result
 */
if ($url == null) {
    die('{"success":false"}');
}

/**
 * Get data and stream it to GeoJSON
 */
echo toGeoJSON(saveFile(getRemoteData($url, null, false), MSP_UPLOAD_DIR . "sentinel_" . createPassword(10) . ".xml"));
?>