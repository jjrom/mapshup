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

/* ============================ FUNCTIONS ===========================
  /*
 * Example of csw:Record response
 *
  <csw:SearchResults numberOfRecordsMatched="33" numberOfRecordsReturned="10" elementSet="full" nextRecord="11">
  <csw:Record xmlns:geonet="http://www.fao.org/geonetwork" xmlns:ows="http://www.opengis.net/ows" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/">
  <dc:identifier>jrc-img2k_pr1_at13_pan</dc:identifier>
  <dc:title>Image2000 Product 1 (at13) Panchromatic</dc:title>
  <dc:type>dataset</dc:type>
  <dc:subject>AT</dc:subject>
  <dc:format>BIL</dc:format>
  <dc:creator>SDI Unit, Institute for Environment &amp; Sustainability, Joint Research Centre</dc:creator>
  <dc:publisher>SDI Unit, Institute for Environment &amp; Sustainability, Joint Research Centre</dc:publisher>
  <dct:abstract>IMAGE2000 product 1 individual orthorectified scenes. IMAGE2000 was  produced from ETM+ Landsat 7 satellite data and provides a consistent 	  European coverage of individual orthorectified scenes in national map projection systems. 	  The year 2000 was targeted as reference year, but a deviation of maximum 1-year was allowed to obtain a full coverage of Europe, 	  which involves approximately 450 Landsat TM Frames. Where Landsat 7 data were not available, Landsat 5 data have been used instead. 	  The spatial resolution is 25 metres for multispectral and 12.5 metres 	  for panchromatic imagery.</dct:abstract>
  <dc:language>en</dc:language>
  <dc:relation>jrc-img2k_at13</dc:relation>
  <dc:format>BIL</dc:format>
  <ows:BoundingBox crs="urn:ogc:def:crs:::PROJCS[&quot;HERMANNSKOGEL_Austria_Lambert&quot;,GEOGCS[&quot;GCS_HERMANNSKOGEL&quot;,DATUM[&quot;D_HERMANNSKOGEL&quot;,SPHEROID[&quot;Bessel_1841&quot;,6377397.155,299.1528128]],PRIMEM[&quot;Greenwich&quot;,0.0],UNIT[&quot;Degree&quot;,0.0174532925199433]],PROJECTION[&quot;Lambert_Conformal_Conic&quot;],PARAMETER[&quot;False_Easting&quot;,400000.0],PARAMETER[&quot;False_Northing&quot;,400000.0],PARAMETER[&quot;Central_Meridian&quot;,13.33333333333333],PARAMETER[&quot;Standard_Parallel_1&quot;,46.0],PARAMETER[&quot;Standard_Parallel_2&quot;,49.0],PARAMETER[&quot;Latitude_Of_Origin&quot;,47.5],UNIT[&quot;Meter&quot;,1.0]]">
  <ows:LowerCorner>18.78 46.46</ows:LowerCorner>
  <ows:UpperCorner>15.59 48.43</ows:UpperCorner>
  </ows:BoundingBox>
  </csw:Record>
  [...]
  </csw:SearchResults>
 *
 */

function outputToGeoJSON($theData) {

    $doc = new DOMDocument();
    $doc->loadXML($theData);

    /*
     * Get the SearchResults object
     */
    $searchResults = $doc->getElementsByTagname('SearchResults');

    /*
     * No SearchResult => return an error
     */
    if ($searchResults->item(0) == null) {
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
     * GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'totalResults' => $searchResults->item(0)->getAttribute('numberOfRecordsMatched'),
        'features' => array()
    );
    $dataObjects = $doc->getElementsByTagname('Record');
    $array = array("\r\n", "\n\r", "\n", "\r");
    foreach ($dataObjects as $dataObject) {

        /*
         * Footprint is processed from LowerCorner / UpperCorner properties
         * Order is Longitude Latitude
         * If no footprint is found, skip the data
         */
        if ($dataObject->getElementsByTagName('LowerCorner')->length > 0 && $dataObject->getElementsByTagName('UpperCorner')->length > 0) {
            $lowerCorner = split(' ', $dataObject->getElementsByTagName('LowerCorner')->item(0)->nodeValue);
            $upperCorner = split(' ', $dataObject->getElementsByTagName('UpperCorner')->item(0)->nodeValue);

            /*
             * Bug from INSPIRE catalog ?
             * Be sure that lowerCorner is lower left
             */
            $lonmin = min(floatval($lowerCorner[0]), floatval($upperCorner[0]));
            $lonmax = max(floatval($lowerCorner[0]), floatval($upperCorner[0]));
            $latmin = min(floatval($lowerCorner[1]), floatval($upperCorner[1]));
            $latmax = max(floatval($lowerCorner[1]), floatval($upperCorner[1]));
        } else {
            /**
             * Footprint is null => skip data
             */
            continue;
        }

        /** Skip whole earth dataset */
        if ($lonmin == -180 && $lonmax == 180 && $latmin == -90 && $latmax == 90) {
            //continue;
        }

        /**
         * Specail CWIC
         * This part is completely specific to CWIC ISO catalog
         */
        $references = $dataObject->getElementsByTagName('references');
        $thumbnail = "";
        $quicklook = "";
        $product = "";
        foreach ($references as $reference) {
            $attr = $reference->getAttribute('scheme');
            if ($attr == "urn:x-cwic:Onlink:MimeType:application/x-hdfeos") {
                $product = $reference->nodeValue;
            } else if ($attr == "urn:x-cwic:Browse") {
                $thumbnail = $reference->nodeValue;
                $quicklook = $reference->nodeValue;
            }
            if ($thumbnail != "" && $product != "") {
                break;
            }
        }

        /**
         * Add feature
         */
        $feature = array(
            'type' => 'Feature',
            'geometry' => bboxToGeoJSONGeometry($lonmin, $latmin, $lonmax, $latmax),
            'properties' => array(
                'identifier' => ($dataObject->getElementsByTagName('identifier')->length > 0 ? $dataObject->getElementsByTagName('identifier')->item(0)->nodeValue : ""),
                'modified' => ($dataObject->getElementsByTagName('modified')->length > 0 ? $dataObject->getElementsByTagName('modified')->item(0)->nodeValue : ""),
                'title' => ($dataObject->getElementsByTagName('title')->length > 0 ? $dataObject->getElementsByTagName('title')->item(0)->nodeValue : ""),
                'type' => ($dataObject->getElementsByTagName('type')->length > 0 ? $dataObject->getElementsByTagName('type')->item(0)->nodeValue : ""),
                'subject' => ($dataObject->getElementsByTagName('subject')->length > 0 ? $dataObject->getElementsByTagName('subject')->item(0)->nodeValue : ""),
                'format' => ($dataObject->getElementsByTagName('format')->length > 0 ? $dataObject->getElementsByTagName('format')->item(0)->nodeValue : ""),
                'creator' => ($dataObject->getElementsByTagName('creator')->length > 0 ? $dataObject->getElementsByTagName('creator')->item(0)->nodeValue : ""),
                'publisher' => ($dataObject->getElementsByTagName('publisher')->length > 0 ? $dataObject->getElementsByTagName('publisher')->item(0)->nodeValue : ""),
                'abstract' => str_replace($array, "", $dataObject->getElementsByTagName('abstract')->length > 0 ? $dataObject->getElementsByTagName('abstract')->item(0)->nodeValue : ""),
                'language' => ($dataObject->getElementsByTagName('language')->length > 0 ? $dataObject->getElementsByTagName('language')->item(0)->nodeValue : ""),
                'thumbnail' => $thumbnail,
                'quicklook' => $quicklook,
                'product' => $product
            )
        );

        // Add feature array to feature collection array
        array_push($geojson['features'], $feature);
    }

    return json_encode($geojson);
}

/* =============================== END FUNCTIONS ======================

  /**
 *  This script returns a GeoJSON result
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 * Number of initial filters
 * This is used to determine if a <ogc:And> should be used
 */
$nbOfFilters = 0;

/**
 * Get input values
 */
$url = isset($_REQUEST["catalogUrl"]) ? $_REQUEST["catalogUrl"] : null;
$cursor = isset($_REQUEST["nextRecord"]) ? $_REQUEST["nextRecord"] : 1;
$maxResults = isset($_REQUEST["numRecordsPerPage"]) ? $_REQUEST["numRecordsPerPage"] : MSP_RESULTS_PER_PAGE;
$order = isset($_REQUEST["order"]) ? $_REQUEST["order"] : "latlon";

if (isset($_REQUEST["startDate"])) {
    
    $dates = getDatesFromInterval($_REQUEST["startDate"]);

    /*
     * If completionDate is set it replaces $dates['completionDate']
     */
    if (isset($_REQUEST["completionDate"])) {
        $dates['completionDate'] = addTimeToDate(urldecode($_REQUEST["completionDate"]));
    }
    
    if ($dates['startDate']) {
        $startDate = $dates['startDate'];
        $nbOfFilters++;
    }

    if ($dates['completionDate']) {
        $completionDate = $dates['completionDate'];
        $nbOfFilters++;
    }
}

/**
 * Set bbox coordinates
 * bbox order is always lonmin,latmin,lonmax,latmax
 * 
 * If corder is set to "latlon", then x is latitude and y is longitude
 * If corder is set to "lonlat", then x is longitude and y is latitude
 * 
 */
$bbox = null;
if (isset($_REQUEST["bbox"])) {
    $bbox = preg_split('/,/', $_REQUEST['bbox']);
    if ($order == "lonlat") {
        $xmin = $bbox[0];
        $ymin = $bbox[1];
        $xmax = $bbox[2];
        $ymax = $bbox[3];
    } else {
        $ymin = $bbox[0];
        $xmin = $bbox[1];
        $ymax = $bbox[2];
        $xmax = $bbox[3];
    }
    $nbOfFilters++;
}

/**
 * Set collection value
 * It is assumed that the collection name is set within dc:subject
 * (see http://cwic.csiss.gmu.edu/testpage.htm example)
 */
$collection = null;
if (isset($_REQUEST["collection"])) {
    $collection = urldecode($_REQUEST["collection"]);
    $nbOfFilters++;
}

/**
 * No Url specified => returns empty result
 */
if ($url == null) {
    die('{"error":{"message":"Catalog url is empty"}}');
}


if (!is_numeric($cursor)) {
    $cursor = 1;
}
if (!is_numeric($maxResults)) {
    $maxResults = MSP_RESULTS_PER_PAGE;
}

/*
  $latmin = 46;
  $lonmin = 1;
  $latmax = 48;
  $lonmax = 2;
  $cursor = 1;
  $maxResults = 10;
  $url ='http://inspire-geoportal.eu/discovery/csw';
 */
$request = '<?xml version="1.0" encoding="UTF-8"?>
<GetRecords
   service="CSW"
   version="2.0.2"
   maxRecords="' . $maxResults . '"
   startPosition="' . $cursor . '"
   resultType="results"
   outputFormat="application/xml"
   outputSchema="http://www.opengis.net/cat/csw/2.0.2"
   xmlns="http://www.opengis.net/cat/csw/2.0.2"
   xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
   xmlns:ogc="http://www.opengis.net/ogc"
   xmlns:ows="http://www.opengis.net/ows"
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:dct="http://purl.org/dc/terms/"
   xmlns:gml="http://www.opengis.net/gml"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2
                       ../../../csw/2.0.2/CSW-discovery.xsd">
   <Query typeNames="csw:Record">
      <ElementSetName typeNames="csw:Record">full</ElementSetName>
      <Constraint version="1.1.0">
         <ogc:Filter>';
if ($nbOfFilters > 1) {
    $request .= '<ogc:And>';
}

/**
 * Collection is set
 * It is assumed that the collection name is set within dc:subject
 * (see http://cwic.csiss.gmu.edu/testpage.htm example)
 */
if (isset($collection)) {
    $request .= '<ogc:PropertyIsEqualTo>
                  <ogc:PropertyName>dc:subject</ogc:PropertyName>
                  <ogc:Literal>' . $collection . '</ogc:Literal>
               </ogc:PropertyIsEqualTo>';
}
/**
 * Geographical search is set
 */
if (isset($xmin) && isset($ymin) && isset($xmax) && isset($ymax)) {
    $request .= '<ogc:BBOX>
                  <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>
                  <gml:Envelope srsName="http://www.opengis.net/gml/srs/epsg.xml#63266405">
                     <gml:lowerCorner>' . $xmin . ' ' . $ymin . '</gml:lowerCorner>
                     <gml:upperCorner>' . $xmax . ' ' . $ymax . '</gml:upperCorner>
                  </gml:Envelope>
               </ogc:BBOX>';
}

if ($nbOfFilters > 1) {
    $request .= '</ogc:And>';
}

$request .= '</ogc:Filter>
      </Constraint>
   </Query>
</GetRecords>';

/**
 * Send a post $request at $url
 * 
 * If headers is set to false, do not force headers
 * during POST request
 */
if (isset($_REQUEST["headers"]) && $_REQUEST["headers"] == "false") {
    $theData = postRemoteData($url, $request, false);
} else {
    $theData = postRemoteData($url, $request, true);
}

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
    echo outputToGeoJSON($theData);
}
?>