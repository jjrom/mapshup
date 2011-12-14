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

define("MSP_UNKNOWN", "unknown");

/**
 * return fileName extension
 */
function getExtension($fileName) {
    $arr = explode(".", $fileName);
    return $arr[count($arr) - 1];
}

/**
 * Get mapshup layer title from an XML file
 */
function getLayerInfoFromType($type, $doc) {

    $def = array(
        'title' => '',
        'description' => ''
    );

    /*
     * RSS
     */
    if ($type == "GeoRSS") {
        return $def;
    }

    /*
     * GPX
     */
    if ($type == "GPX") {
        return $def;
    }

    /*
     * Pleiades
     */
    if ($type == "Pleiades") {
        return $def;
    }

    /*
     * Sentinel
     */
    if ($type == "Sentinel") {
        return $def;
    }

    /*
     * WMS
     */
    if ($type == "WMS") {
        return $def;
    }
    
    /*
     * WFS
     */
    if ($type == "WFS") {
        return $def;
    }
    
    /*
     * OpenSearch catalog
     */
    if ($type == "Catalog_OpenSearch") {
        return array(
        'title' => $doc->getElementsByTagName('ShortName')->item(0)->nodeValue,
        'description' => $doc->getElementsByTagName('Description')->item(0)->nodeValue
    );
    }
    
    return $def;
}

/**
 * Get mapshup layerType from file extension
 */
function getLayerTypeFromFile($fileName) {

    $type = MSP_UNKNOWN;

    /*
     * get extension
     */
    $ext = strtolower(getExtension($fileName));

    /*
     * KML
     */
    if ($ext == "kml") {
        $type = "KML";
    } else if ($ext == "gpx") {
        $type = "GPX";
    } else if ($ext == "jpeg" || $ext == "gif" || $ext == "jpg" || $ext == "png") {
        $type = "Image";
    }
    /*
     * XML
     */ else if ($ext == "xml" || $ext == "gml") {

        /*
         * Load XML document
         */
        $doc = new DOMDocument();
        $doc->load($fileName);
        $rootName = strtolower(removeNamespace($doc->documentElement->nodeName));

        $type = getLayerTypeFromRootName($rootName);
    }

    return $type;
}

/**
 * Get mapshup layer type from an XML file
 */
function getLayerTypeFromRootName($rootName) {

    $type = MSP_UNKNOWN;

    /*
     * RSS
     */
    if ($rootName == "rss" || $rootName == "rdf") {
        return "GeoRSS";
    }

    /*
     * GPX
     */
    if ($rootName == "gpx") {
        return "GPX";
    }
    
    /*
     * OpenSearch
     */
    if ($rootName == "opensearchdescription") {
        return "Catalog_OpenSearch";
    }
    
    /*
     * Pleiades
     */
    $type = getPHRTypeFromRootName($rootName);
    if ($type != MSP_UNKNOWN) {
        return "Pleiades";
    }

    /*
     * Sentinel
     */
    $type = getSentinelTypeFromRootName($rootName);
    if ($type != MSP_UNKNOWN) {
        return "Sentinel";
    }

    /*
     * OGC
     */
    $type = getOGCTypeFromRootName($rootName);
    if ($type != MSP_UNKNOWN) {
        return $type;
    }

    return $type;
}

/**
 * Get mapshup OGC layerType from XML document rootName
 */
function getOGCTypeFromRootName($rootName) {

    $type = MSP_UNKNOWN;

    if ($rootName == "wfs_capabilities") {
        $type = "WFS";
    }
    /*
     * WMS 1.1.0 => root element = WMT_MS_Capabilities
     * WMS 1.3.0 => root element = WMS_Capabilities
     *
     */ else if ($rootName == "wms_capabilities" || $rootName == "wmt_ms_capabilities") {
        $type = "WMS";
    }
    return $type;
}

/**
 * Get PHR file type from XML document rootName
 */
function getPHRTypeFromRootName($rootName) {

    $type = MSP_UNKNOWN;

    if ($rootName == "phr_inventory_plan" || $rootName == "phr_dimap_document" || $rootName == "mask") {
        $type = $rootName;
    }

    return $type;
}

/**
 * Get PHR file type from XML document rootName
 */
function getSentinelTypeFromRootName($rootName) {

    $type = MSP_UNKNOWN;

    if ($rootName == "gs2_dimap_document") {
        $type = $rootName;
    }

    return $type;
}

/**
 * Return $elementName without the namespace if any
 */
function removeNamespace($elementName) {
    $arr = explode(":", $elementName);
    return $arr[count($arr) - 1];
}

?>