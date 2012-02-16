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

include_once '../../../config.php';
include_once '../../../functions/general.php';
include_once '../../../functions/geometry.php';

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Astronomical NameResolver from the CVO (Canadian Virtual Observatory)
 * 
 * Name Resolver is a simple web application that services HTTP GET
 * requests to resolve astronomical object names to RA and DEC coordinates
 * 
 * http://www3.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/NameResolver/
 * 
 */

/*
 * Search terms
 */
$q = isset($_REQUEST["q"]) ? $_REQUEST["q"] : "";

/*
 * Set referential for resulting coordinates (Galactical or Equatorial)
 * Possible values are "g" for Galactical and "e" for equatorial (default is "e")
 */
$r = isset($_REQUEST["r"]) ? $_REQUEST["r"] : "e";

/*
 * Results are requested in XML
 */
$url = 'http://www3.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/NameResolver/find?format=xml&target='.$q;

/*
 * Get XML result
 * Structure :
 *
 *  <result>
 *      <target>m31</target>
 *      <service>NED(nedwww.ipac.caltech.edu)</service>
 *      <coordsys>ICRS</coordsys>
 *      <ra>10.68469</ra>
 *      <dec>41.26904</dec>
 *      <time>524</time>
 *  </result>
 * 
 */
$doc = new DOMDocument();
if ($doc->loadXML(getRemoteData($url, null, false))) {
    
    /*
     * Initialiaze GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'features' => array()
    );
    
    /*
     * Parse result and populate geojson result
     */
    $result = $doc->getElementsByTagname('result')->item(0);
    
    if ($result != null) {
        
        $ra = $result->getElementsByTagname('ra')->item(0)->nodeValue;
        $dec = $result->getElementsByTagname('dec')->item(0)->nodeValue;
        
        /*
         * Only exploitable results are processed
         */
        if ($ra && $dec) {
            
            /*
             * Galactic to Equatorial coordinates transformation
             */
            $pos = array($ra,$dec);
            if ($r === "e") {
                /* Important : see geometry.php */
                $pos = spheric2proj($pos);
            }
            else {
                /* Important : see geometry.php */
                $pos = spheric2proj(eq2gal(array($ra,$dec)));
            }
            
            /*
             * Add feature
             */
            $feature = array(
                'type' => 'Feature',
                'geometry' => pointToGeoJSONGeometry($pos[0], $pos[1]),
                'properties' => array(
                    'name' => $result->getElementsByTagname('target')->item(0)->nodeValue,
                    'ra' => $ra,
                    'dec' => $dec,
                    'coordsys' => $result->getElementsByTagname('coordsys')->item(0)->nodeValue,
                    'time' => $result->getElementsByTagname('time')->item(0)->nodeValue,
                    /* Add the "Cut out image" service from CDS to display quicklook */
                    'quicklook' => 'http://alasky.u-strasbg.fr/cgi/portal/aladin/get-preview-img.py?pos='.$ra.','.($dec >= 0 ? '+'.$dec : $dec)
                )
            );

            // Add feature array to feature collection array
            array_push($geojson['features'], $feature);
        }
    } 
}
/*
 * Service is not available -> send an error
 */
else {  
    $geojson = array(
        'error' => array(
            'message' => "Error : Name Resolver service is not available"
        )
    ); 
}

/* Returns encoded geojson string */
echo json_encode($geojson);
?>