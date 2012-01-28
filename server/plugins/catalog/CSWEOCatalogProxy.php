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

/* ===================== FUNCTIONS ================================= */

function outputToGeoJSON($theData, $slotprefix, $objprefix) {

    $doc = new DOMDocument();
    $doc->loadXML($theData);

    /*
     * Number of objects returned
     */
    $searchResults = $doc->getElementsByTagname('SearchResults');
    $totalResults = 0;
    $returnedResults = 0;
    if ($searchResults->item(0) != null) {
        $totalResults = $searchResults->item(0)->getAttribute('numberOfRecordsMatched');
        $returnedResults = $searchResults->item(0)->getAttribute('numberOfRecordsMatched');
    } else {

        /*
         * Send an error
         */
        $geojson = array(
            'error' => array(
                'message' => urldecode($theData)
            )
        );
        return json_encode($geojson);
    }

    /*
     * Initialiaze GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'totalResults' => $totalResults,
        'features' => array()
    );

    /*
     * EOProduct properties
     */
    $eopmapping = array(
        $slotprefix . "acquisitionType" => "acquisitionType",
        $slotprefix . "acquisitionSubType" => "acquisitionSubType",
        $slotprefix . "status" => "status",
        $slotprefix . "beginPosition" => "beginPosition",
        $slotprefix . "endPosition" => "endPosition",
        $slotprefix . "productType" => "productType",
        $slotprefix . "pitch" => "pitch",
        $slotprefix . "parentIdentifier" => "parentIdentifier",
        $slotprefix . "incidenceAngle" => "incidenceAngle",
        $slotprefix . "sensorType" => "sensorType",
        $slotprefix . "instrumentShortName" => "instrumentShortName",
        $slotprefix . "sensorOperationalMode" => "sensorOperationalMode",
        $slotprefix . "platformOrbitType" => "platformOrbitType"
    );

    /*
     * Process all RegistryPackages
     */
    $registryPackages = $searchResults->item(0)->getElementsByTagname('RegistryPackage');
    foreach ($registryPackages as $registryPackage) {

        /*
         * Process all ExtrinsicObject within the RegistryPackage
         */
        $properties = array();
        $extrinsicObjects = $registryPackage->getElementsByTagname('ExtrinsicObject');

        /*
         * Map EOProduct slots
         */
        foreach ($extrinsicObjects as $extrinsicObject) {

            /*
             * EOProduct
             */
            if ($extrinsicObject->getAttribute('objectType') == $objprefix . "EOProduct") {

                /*
                 * Get EOProduct identifier
                 */
                $properties['identifier'] = $extrinsicObject->getAttribute('id');
            }
            /*
             * Platform
             */ elseif ($extrinsicObject->getAttribute('objectType') == $objprefix . "EOAcquisitionPlatform") {

                /*
                 * Get Platform name
                 */
                $name = $extrinsicObject->getElementsByTagname('Name');
                if ($name->item(0) != null) {
                    $properties['platformName'] = $name->item(0)->getElementsByTagname('LocalizedString')->item(0)->getAttribute('value');
                }
            }
            /*
             * Browse information
             */ elseif ($extrinsicObject->getAttribute('objectType') == $objprefix . "EOBrowseInformation") {

                /*
                 * Get Browseinformation
                 */
                $name = $extrinsicObject->getElementsByTagname('Name');
                if ($name->item(0) != null) {
                    $browsetype = strtolower($name->item(0)->getElementsByTagname('LocalizedString')->item(0)->getAttribute('value'));
                    $slots = $extrinsicObject->getElementsByTagname('Slot');
                    foreach ($slots as $slot) {
                        if ($slot->getAttribute('name') == $slotprefix . "fileName") {
                            $properties[$browsetype] = $slot->getElementsByTagname('Value')->item(0)->nodeValue;
                        }
                    }
                }
            }
            /*
             * Product information
             */ elseif ($extrinsicObject->getAttribute('objectType') == $objprefix . "EOProductInformation") {

                /*
                 * Get Productinformation
                 */
                $slots = $extrinsicObject->getElementsByTagname('Slot');
                if ($slots->item(0) != null) {
                    foreach ($slots as $slot) {
                        if ($slot->getAttribute('name') == $slotprefix . "fileName") {
                            $properties["productUrl"] = $slot->getElementsByTagname('Value')->item(0)->nodeValue;
                        }
                    }
                }
            }
            /*
             * None of the above ? => continue
             */ else {
                continue;
            }

            /*
             * Roll over each Slot
             */
            $slots = $extrinsicObject->getElementsByTagname('Slot');
            foreach ($slots as $slot) {

                /*
                 * Parse the eopmapping array and compare it
                 * to the Slot 'name' attribute
                 */
                $keys = array_keys($eopmapping);
                for ($i = 0; $i < count($keys); $i++) {
                    $name = $keys[$i];
                    if ($slot->getAttribute('name') == $name) {
                        $properties[$eopmapping[$name]] = $slot->getElementsByTagname('Value')->item(0)->nodeValue;
                        break;
                    }
                }

                /*
                 * Special case for multiExtentOf
                 */
                if ($slot->getAttribute('name') == $slotprefix . "multiExtentOf") {
                    $linearRing = $slot->getElementsByTagname('LinearRing')->item(0);

                    /*
                     * Compute posList from linearRing content
                     * A <gml:LinearRing> could contain either :
                     *  - one <gml:posList>
                     *  - several <gml:pos>
                     */
                    if ($linearRing->getElementsByTagname('posList')->length != 0) {
                        $posList = $linearRing->getElementsByTagname('posList')->item(0)->nodeValue;
                    } else {
                        $poss = $linearRing->getElementsByTagname('pos');
                        $posList = "";
                        foreach ($poss as $pos) {
                            $posList .= $pos->nodeValue . " ";
                        }
                    }
                }
            }
        }

        /*
         * Add feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => posListToGeoJSONGeometry($posList, LATLON),
            'properties' => $properties
        );

        /*
         * Add feature array to feature collection array
         */
        array_push($geojson['features'], $feature);
    }

    return json_encode($geojson);
}

/** =========================== END FUNCTIONS =========================
  /**
 * This script returns JSON data
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 * The EO ebRIM nightmare : multiple version and multiple implementations...
 * By default implementation is "normal"
 */
$implementation = "normal";

/*
 * No Url specified => returns empty result
 */
$url = isset($_REQUEST["catalogUrl"]) ? $_REQUEST["catalogUrl"] : null;
if ($url == null) {
    die('{"error":{"message":"Catalog url is empty"}}');
}

/*
 * Collection is optional
 */
$collection = isset($_REQUEST["collection"]) ? urldecode($_REQUEST["collection"]) : null;

/*
 * Set startPosition. Default is 1
 */
$startPosition = isset($_REQUEST["nextRecord"]) ? $_REQUEST["nextRecord"] : 1;
if (!is_numeric($startPosition)) {
    $startPosition = 1;
}

/*
 * Set maxRecords. Default is MSP_RESULTS_PER_PAGE
 */
$maxRecords = isset($_REQUEST["numRecordsPerPage"]) ? $_REQUEST["numRecordsPerPage"] : MSP_RESULTS_PER_PAGE;
if (!is_numeric($maxRecords)) {
    $maxRecords = MSP_RESULTS_PER_PAGE;
}

/*
 * dates is an array of two dates (startDate and completionDate)
 * that are retrieved from startDate interval
 */
$dates = getDatesFromInterval(isset($_REQUEST["startDate"]) ? $_REQUEST["startDate"] : null);

/*
 * bbox is optional
 * Structure is lllon,lllat,urlon,urlat
 */
if (isset($_REQUEST['bbox']) && $_REQUEST['bbox'] != "") {
    $bbox = preg_split('/,/', $_REQUEST['bbox']);
    $latmin = $bbox[1];
    $lonmin = $bbox[0];
    $latmax = $bbox[3];
    $lonmax = $bbox[2];
}

/*
 * Version
 * Possible value are :
 *      06-131r5
 *      06-131r5ebRR
 *      06-131r6
 *
 * Default version is "OGC-131r6"
 */
$version = isset($_REQUEST["version"]) ? urldecode($_REQUEST["version"]) : "06-131r6";

/*
 * Set urns based on $version
 */
if ($version == "06-131r5") {
    $slotprefix = "urn:ogc:def:ebRIM-Slot:OGC-06-131:";
    $objprefix = "urn:x-ogc:specification:csw-ebrim:ObjectType:EO:";
} elseif ($version == "06-131r5ebRR") {
    $slotprefix = "urn:ogc:def:ebRIM-Slot:OGC-06-131:";
    $objprefix = "urn:x-ogc:specification:csw-ebrim:ObjectType:EO:";
    $implementation = "ebRR";
}
/* 06-131r6 (default) */ else {
    $slotprefix = "urn:ogc:def:slot:OGC-CSW-ebRIM-EO::";
    $objprefix = "urn:ogc:def:objectType:OGC-CSW-ebRIM-EO::";
}

/*
 * Prepare request query
 */
$request = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' . PHP_EOL .
        '<soapenv:Header/>' . PHP_EOL .
        '<soapenv:Body>' . PHP_EOL;
$request .= '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" xmlns:rim="urn:oasis:names:tc:ebxml-regrep:xsd:rim:3.0" outputSchema="urn:oasis:names:tc:ebxml-regrep:xsd:rim:3.0" version="2.0.2" service="CSW" resultType="results" startPosition="' . $startPosition . '" maxRecords="' . $maxRecords . '">' . PHP_EOL;

/*
 * WARNING ! ebRR implementation differs from 06-131r5
 */
if ($implementation == "ebRR") {
    $request .= '<csw:Query typeNames="rim:RegistryPackage rim:ExtrinsicObject rim:Association rim:ExtrinsicObject_acquisitionPlatform rim:Association_acquisitionPlatformAssociation">' . PHP_EOL;
} else {
    $request .= '<csw:Query typeNames="rim:RegistryPackage rim:ExtrinsicObject">' . PHP_EOL;
}

$request .= '<csw:ElementSetName typeNames="rim:RegistryPackage">full</csw:ElementSetName>' . PHP_EOL .
        '<csw:Constraint version="1.1.0">' . PHP_EOL .
        '<ogc:Filter>' . PHP_EOL .
        '<ogc:And>' . PHP_EOL;

/*
 * Collection
 */
if ($collection && $collection != "") {
    $request .= '<ogc:PropertyIsEqualTo>' .
            '<ogc:PropertyName>/rim:ExtrinsicObject/rim:Slot[@name="' . $slotprefix . 'parentIdentifier"]/rim:ValueList/rim:Value[1]</ogc:PropertyName>' . PHP_EOL .
            '<ogc:Literal>' . $collection . '</ogc:Literal>' . PHP_EOL .
            '</ogc:PropertyIsEqualTo>' . PHP_EOL;
}
/*
 * WARNING ! ebRR implementation differs from 06-131r5
 */
if ($implementation == "ebRR") {
    $request .= '<ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/@objectType</ogc:PropertyName>' . PHP_EOL .
            '<ogc:Literal>' . $objprefix . 'EOProduct</ogc:Literal>' . PHP_EOL .
            '</ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:Association/@targetObject</ogc:PropertyName>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/@id</ogc:PropertyName>' . PHP_EOL .
            '</ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:Association/@sourceObject</ogc:PropertyName>' . PHP_EOL .
            '<ogc:PropertyName>/rim:RegistryPackage/@id</ogc:PropertyName>' . PHP_EOL .
            '</ogc:PropertyIsEqualTo>' . PHP_EOL;
} else {
    $request .= '<ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:RegistryPackage/rim:RegistryObjectList[*]/rim:RegistryObject/@id</ogc:PropertyName>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/@id</ogc:PropertyName>' . PHP_EOL .
            '</ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyIsEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/@objectType</ogc:PropertyName>' . PHP_EOL .
            '<ogc:Literal>' . $objprefix . 'EOProduct</ogc:Literal>' . PHP_EOL .
            '</ogc:PropertyIsEqualTo>' . PHP_EOL;
}
if ($bbox) {
    $request .= '<ogc:BBOX>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/rim:Slot[@name="' . $slotprefix . 'multiExtentOf"]/wrs:ValueList/wrs:AnyValue[1]</ogc:PropertyName>' . PHP_EOL .
            '<Envelope xmlns="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" srsName="EPSG:4326">' . PHP_EOL .
            '<lowerCorner>' . $latmin . ' ' . $lonmin . '</lowerCorner>' . PHP_EOL .
            '<upperCorner>' . $latmax . ' ' . $lonmax . '</upperCorner>' . PHP_EOL .
            '</Envelope>' . PHP_EOL .
            '</ogc:BBOX>' . PHP_EOL;
}
if ($dates['startDate']) {
    $request .= '<ogc:PropertyIsGreaterThanOrEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/rim:Slot[@name="' . $slotprefix . 'beginPosition"]/rim:ValueList/rim:Value[1]</ogc:PropertyName>' . PHP_EOL .
            '<ogc:Literal>' . $dates['startDate'] . '</ogc:Literal>' . PHP_EOL .
            '</ogc:PropertyIsGreaterThanOrEqualTo>' . PHP_EOL;
}
if ($dates['completionDate']) {
    $request .= '<ogc:PropertyIsLessThanOrEqualTo>' . PHP_EOL .
            '<ogc:PropertyName>/rim:ExtrinsicObject/rim:Slot[@name="' . $slotprefix . 'endPosition"]/rim:ValueList/rim:Value[1]</ogc:PropertyName>' . PHP_EOL .
            '<ogc:Literal>' . $dates['completionDate'] . '</ogc:Literal>' . PHP_EOL .
            '</ogc:PropertyIsLessThanOrEqualTo>' . PHP_EOL;
}
$request .= '</ogc:And>' . PHP_EOL .
        '</ogc:Filter>' . PHP_EOL .
        '</csw:Constraint>' . PHP_EOL .
        '</csw:Query>' . PHP_EOL .
        '</csw:GetRecords>' . PHP_EOL .
        '</soapenv:Body>' . PHP_EOL .
        '</soapenv:Envelope>' . PHP_EOL;

/**
 * Send a post $request at $url
 */
$theData = postRemoteData($url, $request, true);

/**
 * Store request and response
 */
if (MSP_DEBUG) {
    $tmp = createPassword(10);
    saveFile($request, MSP_UPLOAD_DIR . "csw_" . $tmp . "_request.xml");
    $resultFileURI = saveFile($theData, MSP_UPLOAD_DIR . "csw_" . $tmp . "_response.xml");
}

/**
 *  Check if a SOAP Fault occured
 */
$error = OWSExceptionToJSON($theData);
if ($error) {
    echo $error;
} else {
    echo outputToGeoJSON($theData, $slotprefix, $objprefix);
}
?>

