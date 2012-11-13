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
 * This script convert the International Disasters Charter activations
 * description from XML to GeoJSON
 * 
 * XML activations feed can be retrieve here 
 * 
 *  http://www.disasterscharter.org/DisasterCharter/CnesXml?articleType=activation&locale=en_US&companyId=1&communityId=10729 
 * 
 * The structure is the following :
 * 
 * 
 *      <dch:disasters dch:updated="2012-11-08T23:00:00+0000">
 *          <dch:disaster>
 *              <dch:title>Earthquake Guatemala</dch:title>
 *              <dch:date>2012-11-08T23:00:00+0000</dch:date>
 *              <dch:call-id>420</dch:call-id>
 *              <dch:type>EARTHQUAKE</dch:type>
 *              <dch:description>....</dch:description>
 *              <dch:link>http://www.disasterscharter.org/web/charter/activation_details?p_r_p_1415474252_assetId=ACT-420</dch:link>
 *              <dch:image>http://www.disasterscharter.org/image/journal/article?img_id=136977</dch:image>
 *              <dch:location>
 *                  <gml:Point gml:id="p420" srsName="urn:ogc:def:crs:EPSG:6.6:4326">
 *                      <gml:pos dimension="2">15.6 -91.54</gml:pos>
 *                  </gml:Point>
 *              </dch:location>
 *          </dch:disaster>
 *          [...]
 *      </dch:disasters>
 * 
 * 
 * 
 * The returned GeoJSON feed contains the following properties
 * 
 *      properties:{
 *          title:
 *          date:
 *          call-id:
 *          type:
 *          description
 *          link:
 *      }
 * 
 */

include_once '../../config.php';
include_once '../../functions/general.php';
include_once '../../functions/geometry.php';


/* ===================== FUNCTIONS ================================= */

function xmlToGeoJSON($theData) {

    $doc = new DOMDocument();
    $doc->loadXML($theData);

    /*
     * Initialiaze GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'totalResults' => 0,
        'features' => array()
    );

    /*
     * Number of objects returned
     */
    $disasters = $doc->getElementsByTagname('disaster');

    if ($disasters->item(0) == null) {
        return json_encode($geojson);
    }

    $count = 0;
    
    /*
     * Process all RegistryPackages
     */
    foreach ($disasters as $disaster) {
        
        // Get longitude and latitude coordinates
        $lonlat = explode(" ", $disaster->getElementsByTagname('pos')->item(0)->nodeValue);
        
        /*
         * Automatic correction of incorrect disasters
         * 
         * Possible values
         *  EARTHQUAKE
         *  FLOOD
         *  FIRE
         *  ICE
         *  LANDSLIDE
         *  OCEAN_STORM (CYCLONE, HURRICANE, TYPHOON)
         *  OIL_SPILL
         *  OCEAN_WAVE (TSUNAMI)
         *  VOLCANIC_ERUPTION
         *  OTHER (INDUSTRIAL_ACCIDENT, WIND_STORM, TORNADO...)
         * 
         */
        $title = $disaster->getElementsByTagname('title')->item(0)->nodeValue;
        $type = $disaster->getElementsByTagname('type')->item(0)->nodeValue;
        
        if ($type == "OTHER") {
            
            /*
             * Check for disaster type within title
             * Hypothesis is that disaster type is the first word within the title
             */
             $words = explode (' ', $title);
             
             foreach ($words as $word) {
                 
                $word = strtolower(str_replace(",", "", trim($word)));
                
                if (in_array($word, array('flood','flooding','floods'))) {
                    $type = 'FLOOD';
                    break;
                }
                else if (in_array($word, array('ocean','tsunami','huricane','hurricane-force'))) {
                    $type = 'CYCLONE';
                    break;
                }
                else if (in_array($word, array('landslide','landslides'))) {
                    $type = 'LANDSLIDE';
                    break;
                }
                else if (in_array($word, array('earthquake'))) {
                    $type = 'EARTHQUAKE';
                    break;
                }
                /*
                else if (in_array($first, ['snow','ice'])) {
                    $type = '';
                    break;
                }
                else if (in_array($first, ['debris'])) {
                    $type = '';
                    break;
                }*/
                
             }
             
        }
        
        /*
         * Add feature array to feature collection array
         */
        array_push($geojson['features'], array(
            'type' => 'Feature',
            'geometry' => pointToGeoJSONGeometry(floatval($lonlat[1]), floatval($lonlat[0])),
            'properties' => array(
                'title' => $title,
                'date' => $disaster->getElementsByTagname('date')->item(0)->nodeValue,
                'call-id' => $disaster->getElementsByTagname('call-id')->item(0)->nodeValue,
                'type' => $type,
                'description' => $disaster->getElementsByTagname('description')->item(0)->nodeValue,
                'link' => $disaster->getElementsByTagname('link')->item(0)->nodeValue
            )
        ));
        
        $count++;
        
    }
    
    // Update totalResults
    $geojson["totalResults"] = $count;

    return json_encode($geojson);
}

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 *  
 */
$url = 'http://www.disasterscharter.org/DisasterCharter/CnesXml?articleType=activation&locale=en_US&companyId=1&communityId=10729';

/*
 * Get flickr result in json format
 */
echo xmlToGeoJSON(getRemoteData($url, null, false));

?>