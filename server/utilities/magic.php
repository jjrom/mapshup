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

include_once '../config.php';
include_once '../functions/general.php';
include_once '../functions/magicutils.php';

/*
 * This script returns json
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 * Get input url
 */
$url = isset($_REQUEST["url"]) ? $_REQUEST["url"] : '';

/*
 * Get input id
 */
$id = isset($_REQUEST["id"]) ? $_REQUEST["id"] : '';
/*
 * Set the default type
 */
$type = MSP_UNKNOWN;

/*
 * Try to get the url type through curl_getinfo()
 */
if (abcCheck($_REQUEST) && $url != '') {

    /**
     * Send a GET request $url
     *
     * The trick : if url do not have a "?", we add
     * a "?request=GetCapabilities" at the end of
     * the url. This will do nothing in the majority
     * of case, but if the url is an OGC url it will
     * automatically get the capabilities document :-)
     */
    if (!strrpos($url, '?')) {
        $arr = getRemoteData($url . "?request=GetCapabilities", null, true);
    }
    else {
        $arr = getRemoteData($url . "&request=GetCapabilities", null, true);
    }
    // TODO
    $urlNoParameters = null;
    
    /*
     * Info array
     */
    $infos = array();

    /*
     * Magic part : we try to detect a mapshup valid
     * layerType from the url content_type
     */
    if ($arr["info"] != "") {

        /*
         * A typical content_type is on the form
         *
         *  "type/yyy; charset..."
         *
         * For a easier detection we only need the first
         * part (don't care of charset).
         *
         */
        $contentType = explode(";", $arr["info"]["content_type"]);
        $contentType = strtolower(trim($contentType[0]));

        /*
         * KML
         *
         *  One of
         *  - application/vnd.google-earth.kml+xml
         *
         */
        if ($contentType == "application/vnd.google-earth.kml+xml") {
            $infos["type"] = "KML";
        }
        /*
         * Image
         *
         *  One of
         *  - image/jpeg
         *  - image/gif
         *  - image/png
         *
         */ else if ($contentType == "image/png" || $contentType == "image/jpeg" || $contentType == "image/gif") {
            $infos["type"] = "Image";
            /*
             * TODO : compute bbox when possible (gdal ?)
             * $extras = array(
             *   'bbox' => '',
             *   'srs' => 'EPSG:4326
             * );
             */
        }
        /*
         * XML (The Big one :)
         *
         *  One of
         *  - application/xml
         *  - text/xml
         *  - application/atom+xml
         *  - application/rss+xml
         */ else if ($contentType == "application/xml" || $contentType == "text/xml" || $contentType == "application/atom+xml" || $contentType == "application/rss+xml" || $contentType == "text/plain") {
            $doc = new DOMDocument;
            $doc->loadXML($arr["data"]);
            $infos = getLayerInfosFromXML($doc);
        }
    }

    
    /*
     * Push items
     */
    $item = array(
        'url' => $urlNoParameters != null ? $urlNoParameters : $url,
        'id' => $id,
        'content_type' => $contentType
    );

    /*
     * Infos keys/values
     */
    foreach(array_keys($infos) as $key) {
        if ($infos[$key] != null) {
            $item[$key] = $infos[$key];
        }
    }
    

    echo json_encode($item);
} else {
    echo '{"error":{"message":"Error : cannot perform action"}}';
}
?>