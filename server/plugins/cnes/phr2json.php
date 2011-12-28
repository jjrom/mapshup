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
    $rootName = strtolower(removeNamespace($doc->documentElement->nodeName));

    /*
     * Get the PHR type from XML file root name element
     */
    $type = getPHRTypeFromRootName($rootName);

    /*
     * Initialize GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'features' => array()
    );

    /*
     * 
     * Pleiades Inventory Plan
     * 
     * Displayed geometry :
     * 
     *      STATION/PASS/DATASTRIP/CORNER/LATITUDE
     *      STATION/PASS/DATASTRIP/CORNER/LONGITUDE
     * 
     * Displayed properties :
     * 
     *      STATION/PASS/DATASTRIP/OBMM_FILE_NUMBER
     * 
     */
    if ($type == "phr_inventory_plan") {

        $stations = $doc->getElementsByTagname('STATION');

        foreach ($stations as $station) {
            $passes = $station->getElementsByTagname('PASS');
            foreach ($passes as $pass) {
                $orbit = $pass->getElementsByTagname('ORBIT_NUMBER')->item(0)->nodeValue;
                $Features = $pass->getElementsByTagname('DATASTRIP');
                foreach ($Features as $datastrip) {
                    $dsids = $datastrip->getElementsByTagName('OBMM_FILE_NUMBER');
                    $urgence = $datastrip->getElementsByTagName('INV_URGENCE')->item(0)->nodeValue;
                    $dstype = $datastrip->getElementsByTagName('DATASTRIP_TYPE')->item(0)->nodeValue;
                    $corners = $datastrip->getElementsByTagName('CORNER');
                    $poslist = '';
                    $isFirst = 1;
                    foreach ($corners as $corner) {
                        $LAT = $corner->getElementsByTagName('LATITUDE')->item(0)->nodeValue;
                        $LON = $corner->getElementsByTagName('LONGITUDE')->item(0)->nodeValue;
                        $longitude = $LON;
                        $latitude = $LAT;
                        $poslist .= $latitude . ' ' . $longitude . ' ';
                        if ($isFirst == 1) {
                            $latitude1 = $latitude;
                            $longitude1 = $longitude;
                            $isFirst = 0;
                        }
                    }
                    $poslist .= $latitude1 . ' ' . $longitude1;

                    /**
                     * Add feature
                     */
                    $feature = array(
                        'type' => 'Feature',
                        'geometry' => posListToGeoJSONGeometry($poslist, LATLON),
                        'crs' => array(
                            'type' => 'EPSG',
                            'properties' => array('code' => '4326')
                        ),
                        'properties' => array(
                            'identifier' => $dsids->item(0)->nodeValue . " (orbit " . $orbit . " : " . $dstype . ")",
                            'DOWNLINK_ORBIT_NUMBER' => $orbit,
                            'INV_URGENCE' => $urgence,
                            'DATASTRIP_TYPE' => $dstype,
                            'DOWNLINK_START' => $pass->getElementsByTagName('DATES')->item(0)->getElementsByTagName('START')->item(0)->nodeValue
                        )   
                    );

                    // Add feature array to feature collection array
                    array_push($geojson['features'], $feature);
                }
            }
        }
    }

    /*
     * 
     * Pleiades Dimap Document
     * 
     * Displayed geometry :
     * 
     *      Data_Strip_Frame/Album_Footprint/Vertex
     * 
     *    ou
     *      
     *      Product_Frame/Dataset_Frame/Vertex
     * 
     * Displayed properties :
     * 
     *      identifier : Dataset_Identification/DATASET_NAME
     *      METADATA_PROFILE : Metadata_Identification/METADATA_PROFILE
     *      PROCESSING_LEVEL : PROCESSING_LEVEL
     *      SPECTRAL_PROCESSING : SPECTRAL_PROCESSING
     *      GEOMETRY_PATH : Data_Strip_Frame/Album_Footprint/Vertex
     *  
     */ else if ($type == "phr_dimap_document") {

        // Metadata info
        $pl = $doc->getElementsByTagname('PROCESSING_LEVEL')->item(0);
        $sp = $doc->getElementsByTagname('SPECTRAL_PROCESSING')->item(0);

        // Metadata profile
        $profile = $doc->getElementsByTagname('METADATA_PROFILE')->item(0)->nodeValue;

        // Default is full product (no swaths)
        $swaths = null;
        
        // Footprint from Album_Footprint
        if ($profile == "PHR_INVENTORY_INIT_LOC_DATA" || $profile == "PHR_INVENTORY_ALBUM_NCN_DATA" || $profile == "PHR_IMAGE_ARCHIVE_PRODUCT") {
            $footprint = $doc->getElementsByTagname('Album_Footprint')->item(0);
            $path = "Data_Strip_Frame/Album_Footprint/Vertex";
        }
        // or footprint from Dataset_Frame
        else {
            $footprint = $doc->getElementsByTagname('Dataset_Frame')->item(0);
            $path = "Product_Frame/Dataset_Frame/Vertex";
            
            $swaths = $footprint->getElementsByTagname('Array_Frame');
            // Multiple swath defined ?
            if ($swaths->item(0)) {
                $path = "Product_Frame/Dataset_Frame/Array_Frame/Vertex";
            }
            
        }

        if ($swaths && $swaths->item(0)) {
            
            foreach ($swaths as $swath) {
                $vertices = $swath->getElementsByTagname('Vertex');
                $poslist = '';
                $isFirst = 1;
                foreach ($vertices as $vertex) {
                    $latitude = $vertex->getElementsByTagName('LAT')->item(0)->nodeValue;
                    $longitude = $vertex->getElementsByTagName('LON')->item(0)->nodeValue;
                    $poslist .= $latitude . " " . $longitude . " ";
                    if ($isFirst == 1) {
                        $latitude1 = $latitude;
                        $longitude1 = $longitude;
                        $isFirst = 0;
                    }
                }
                $poslist .= $latitude1 . ' ' . $longitude1;

                /**
                 * Add feature
                 */
                $feature = array(
                    'type' => 'Feature',
                    'geometry' => posListToGeoJSONGeometry($poslist, LATLON),
                    'crs' => array(
                        'type' => 'EPSG',
                        'properties' => array('code' => '4326')
                    ),
                    'properties' => array(
                        'identifier' => $doc->getElementsByTagname('DATASET_NAME')->item(0)->nodeValue,
                        'METADATA_PROFILE' => $profile,
                        'PROCESSING_LEVEL' => $pl ? $pl->nodeValue : 'N/A',
                        'SPECTRAL_PROCESSING' => $sp ? $sp->nodeValue : 'N/A',
                        'GEOMETRY_PATH' => $path,
                        'BAND_ID' => $footprint->getElementsByTagname('BAND_ID')->item(0)->nodeValue,
                        'SUBSWATH_NUMBER' => $swath->getElementsByTagname('SUBSWATH_NUMBER')->item(0)->nodeValue,
                        'ARRAY_ID' => $swath->getElementsByTagname('ARRAY_ID')->item(0)->nodeValue
                    )
                );
                
                // Add feature array to feature collection array
                array_push($geojson['features'], $feature);
        
            }
            
        }
        else {
            $vertices = $footprint->getElementsByTagname('Vertex');
            $poslist = '';
            $isFirst = 1;
            foreach ($vertices as $vertex) {
                $latitude = $vertex->getElementsByTagName('LAT')->item(0)->nodeValue;
                $longitude = $vertex->getElementsByTagName('LON')->item(0)->nodeValue;
                $poslist .= $latitude . " " . $longitude . " ";
                if ($isFirst == 1) {
                    $latitude1 = $latitude;
                    $longitude1 = $longitude;
                    $isFirst = 0;
                }
            }
            $poslist .= $latitude1 . ' ' . $longitude1;

            /**
             * Add feature
             */
            $feature = array(
                'type' => 'Feature',
                'geometry' => posListToGeoJSONGeometry($poslist, LATLON),
                'crs' => array(
                    'type' => 'EPSG',
                    'properties' => array('code' => '4326')
                ),
                'properties' => array(
                    'identifier' => $doc->getElementsByTagname('DATASET_NAME')->item(0)->nodeValue,
                    'METADATA_PROFILE' => $profile,
                    'PROCESSING_LEVEL' => $pl ? $pl->nodeValue : 'N/A',
                    'SPECTRAL_PROCESSING' => $sp ? $sp->nodeValue : 'N/A',
                    'GEOMETRY_PATH' => $path
                )
            );
            
            // Add feature array to feature collection array
            array_push($geojson['features'], $feature);

        }
        
    }

    /*
     * 
     * Pleiades IP Request
     * 
     * Displayed geometry :
     * 
     *      PRODUCT_ROI/POLYGON
     * 
     * Displayed properties :
     * 
     */ else if ($type == "phr_ip_request") {

        // Check geometry availability
        $roi = $doc->getElementsByTagname('PRODUCT_ROI')->item(0);
        if ($roi) {

            /*
             * Add feature
             */
            $feature = array(
                'type' => 'Feature',
                'geometry' => posListToGeoJSONGeometry($roi->getElementsByTagname('POLYGON')->item(0)->nodeValue, LATLON),
                'crs' => array(
                    'type' => 'EPSG',
                    'properties' => array('code' => '4326')
                ),
                'properties' => array(
                    'identifier' => strtoupper($type)
                )
            );
        } else {
            $geojson = array(
                'error' => array(
                    'message' => 'Error: no ROI defined'
                )
            );
        }

        // Add feature array to feature collection array
        array_push($geojson['features'], $feature);

        return json_encode($geojson);
    }

    /*
     * 
     * Pleiades GEO_PHR command file or INIT_LOC_PROD command file
     * 
     * Displayed geometry :
     * 
     *      ORDER_DESCRIPTION/PRODUCT_ROI/POLYGON
     * 
     * Displayed properties :
     * 
     */ else if ($type === "geo_phr_command_file" || $type === "init_loc_prod_command_file") {

        // Check geometry availability
        $roi = $doc->getElementsByTagname('POLYGON')->item(0);
        if ($roi) {

            /*
             * Add feature
             */
            $feature = array(
                'type' => 'Feature',
                'geometry' => posListToGeoJSONGeometry($roi->nodeValue, LATLON),
                'crs' => array(
                    'type' => 'EPSG',
                    'properties' => array('code' => '4326')
                ),
                'properties' => array(
                    'identifier' => strtoupper($type)
                )
            );
        } else {
            $geojson = array(
                'error' => array(
                    'message' => 'Error: no ROI defined'
                )
            );
        }

        // Add feature array to feature collection array
        array_push($geojson['features'], $feature);


        return json_encode($geojson);
    }

    /*
     * 
     * Pleiades Mask
     * 
     * Displayed geometry :
     * 
     *      MaskFeature exterior and interiors
     * 
     * Displayed properties :
     * 
     *      identifier + hole number
     *  
     */ else if ($type == "mask" || $type == "overilluminationmask") {

        // First check if input file is a Mask or an OverIlluminationMask
        $masks = $doc->getElementsByTagname('MaskFeature');

        // No MaskFeature, try OverIllumination
        if ($masks->item(0) === null) {
            $masks = $doc->getElementsByTagname('OverIllumination');

            // No OverIllumination - do nothing
            if ($masks->item(0) === null) {
                return "";
            }
        }

        foreach ($masks as $mask) {
            $id = $mask->getAttribute('gml:id');
            $exterior = $mask->getElementsByTagName('exterior')->item(0);

            /**
             * Add feature
             */
            $feature = array(
                'type' => 'Feature',
                'geometry' => posListToGeoJSONGeometry($exterior->getElementsByTagName('posList')->item(0)->nodeValue, LATLON),
                'crs' => array(
                    'type' => 'EPSG',
                    'properties' => array('code' => '4326')
                ),
                'properties' => array(
                    'identifier' => $id
                )
            );

            // Add feature array to feature collection array
            array_push($geojson['features'], $feature);

            $holes = $mask->getElementsByTagName('interior');
            $count = 0;
            foreach ($holes as $hole) {

                /**
                 * Add feature
                 */
                $feature = array(
                    'type' => 'Feature',
                    'geometry' => posListToGeoJSONGeometry($hole->getElementsByTagName('posList')->item(0)->nodeValue, LATLON),
                    'crs' => array(
                        'type' => 'EPSG',
                        'properties' => array('code' => '4326')
                    ),
                    'properties' => array(
                        'identifier' => $id . " -> HOLE " . $count++
                    )
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
echo toGeoJSON(saveFile(getRemoteData($url, null, false), MSP_UPLOAD_DIR . "phr_" . createPassword(10) . ".xml"));
?>