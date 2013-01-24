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
 * Get mapshup layer info from an XML document
 */
function getLayerInfosFromXML($doc) {

    /*
     * Get layer type
     */
    $type = getLayerType($doc);

    /*
     * Set default $infos array values
     */
    $infos = array(
        'type' => $type,
        'title' => null,
        'description' => null
    );

    /*
     * Pleiades
     */
    if ($type === "Pleiades") {
        return array(
            'type' => 'Pleiades',
            'title' => $doc->getElementsByTagName('DATASET_NAME')->item(0)->nodeValue,
            'description' => $doc->getElementsByTagName('METADATA_PROFILE')->item(0)->nodeValue
        );
    }

    /*
     * OpenSearch service
     */ else if ($type === "OpenSearch") {

        /*
         * Two cases : the OpenSearch description can be an OpenSearch catalog or an OpenSearch service
         * We assume that OpenSearch description is an OpenSearch service unless the description contains
         * an <Url> template containing an 'mspdesc' or an 'jeodesc' attribute in which case it is considered
         * as an OpenSearch catalog
         */
        $isCatalog = false;
        $urls = $doc->getElementsByTagname('Url');
        foreach ($urls as $url) {
            $rel = $url->getAttribute('rel');
            if ($rel === "mspdesc" || $rel === "jeobdesc") {
                $isCatalog = true;
                break;
            }
        }

        /*
         * Set title and description
         */
        $infos['title'] = $doc->getElementsByTagName('ShortName')->item(0)->nodeValue;
        $infos['description'] = $doc->getElementsByTagName('Description')->item(0)->nodeValue;

        if ($isCatalog) {

            // Change the type to "Catalog" and extract the connector name
            $infos['type'] = "Catalog";
            $infos['extras'] = array(
                'connectorName' => "OpenSearch"
            );
        } else {
            $infos['type'] = "OpenSearch";
        }
        return $infos;
    }

    return $infos;
}

/**
 * Assume input type is Catalog_XXXX,
 * TODO : REMOVE because UNUSUED 
 */
function getConnectorName($type) {
    $types = preg_split('/_/', $type);
    $type = $types[0];
    if (isset($types[1])) {
        $extras = array(
            'connectorName' => $types[1]
        );
    }
}

/**
 * Get mapshup layerType from file extension
 */
function getLayerInfosFromFile($fileName) {

    // Set default values
    $type = MSP_UNKNOWN;

    /*
     * get extension
     */
    $ext = strtolower(getExtension($fileName));

    /*
     * KML
     */
    if ($ext === "kml") {
        $type = "KML";
    } else if ($ext === "gpx") {
        $type = "GPX";
    } else if ($ext === "jpeg" || $ext === "gif" || $ext === "jpg" || $ext === "png") {
        $type = "Image";
    }
    /*
     * XML
     */ else if ($ext === "xml" || $ext === "gml") {

        /*
         * Load XML document
         */
        $doc = new DOMDocument();
        $doc->load($fileName);
        return getLayerInfosFromXML($doc);
    }

    // Set default values
    $infos = array(
        'type' => $type,
        'title' => null,
        'description' => null
    );

    return $infos;
}

/**
 * Get mapshup layer type from an XML file
 */
function getLayerType($doc) {

    $rootName = MSP_UNKNOWN;

    /*
     * Get root name element
     */
    if ($doc && $doc->documentElement->nodeName != null) {
        $rootName = strtolower(removeNamespace($doc->documentElement->nodeName));
    }

    /*
     * RSS
     */
    if ($rootName === "rss" || $rootName === "rdf") {
        return "GeoRSS";
    }

    /*
     * GPX
     */ else if ($rootName === "gpx") {
        return "GPX";
    }

    /*
     * OpenSearch
     */ else if ($rootName == "opensearchdescription") {
        return "OpenSearch";
    }

    /*
     * OGC
     */ else if ($rootName === "wfs_capabilities") {
        return "WFS";
    }

    /*
     * WMS 1.1.0 => root element = WMT_MS_Capabilities
     * WMS 1.3.0 => root element = WMS_Capabilities
     *
     */ else if ($rootName === "wms_capabilities" || $rootName === "wmt_ms_capabilities") {
        return "WMS";
    }

    /*
     * root element = Capabilities
     * 
     * Check service type within the <ows:ServiceIdentification>
     *
     */ else if ($rootName === "capabilities") {

        $serviceIdentification = $doc->getElementsByTagName('ServiceIdentification')->item(0);
        if ($serviceIdentification != null) {
            $serviceType = $serviceIdentification->getElementsByTagName('ServiceType')->item(0)->nodeValue;
            if (strpos($serviceType, "WMTS") !== false) {
                return "WMTS";
            } else if (strpos($serviceType, "WPS") !== false) {
                return "WPS";
            }
        }

        return MSP_UNKNOWN;
    }

    /*
     * Pleiades
     */ else if (getPHRType($doc) !== null) {
        return "Pleiades";
    }

    /*
     * Sentinel
     */ else if (getSentinelType($doc) !== null) {
        return "Sentinel";
    } else {
        $rootName = MSP_UNKNOWN;
    }

    return $rootName;
}

/**
 * Return true if input rootname is a PHR document
 */
function getPHRType($doc) {

    /*
     * Get root name element
     */
    if ($doc && $doc->documentElement->nodeName != null) {
        $rootName = strtolower(removeNamespace($doc->documentElement->nodeName));
    }

    /*
     * Valid Pleiades root names
     */
    $rootNames = array(
        "geo_phr_command_file",
        "init_loc_prod_command_file",
        "mask",
        "overilluminationmask",
        "phr_dimap_document",
        "phr_inventory_plan",
        "phr_ip_request"
    );
    reset($rootNames);

    /*
     * Check if input rootName is a valid Pleiades rootName
     */
    foreach ($rootNames as $v) {
        if ($v === $rootName) {
            return $v;
        }
    }

    return null;
}

/**
 * Get PHR file type from XML document rootName
 */
function getSentinelType($doc) {

    /*
     * Get root name element
     */
    if ($doc && $doc->documentElement->nodeName != null) {
        $rootName = strtolower(removeNamespace($doc->documentElement->nodeName));
    }

    if ($rootName == "gs2_dimap_document") {
        return $rootName;
    }

    return null;
}

/**
 * Return $elementName without the namespace if any
 */
function removeNamespace($elementName) {
    $arr = explode(":", $elementName);
    return $arr[count($arr) - 1];
}

?>