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

/**
 * Remove black border of JPG quicklook and thumbnail
 * This script returns a PNG file
 */
include_once '../config.php';
include_once '../functions/general.php';

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Check unwanted requests
 */
if (!abcCheck($_REQUEST) || !isset($_REQUEST["url"]) || !isset($_REQUEST["layers"]) || !isset($_REQUEST["srs"])) {
    echo '{"success":false}';
    exit(0);
}

/**
 * Decode layers and url parameters
 */
$layers = rawurldecode($_REQUEST["layers"]);
$url = rawurldecode($_REQUEST["url"]);
$srs = $_REQUEST["srs"];

/*
 * Get the md5 hash of sourceUrl
 */
$md5 = md5($_REQUEST["layers"] . $_REQUEST["url"] . $_REQUEST["srs"]);

/*
 * Output file is a mapfile
 */
$mapfileurl = MSP_MAPFILE_DIR . $md5 . ".map";
$msurl = MSP_MAPSERVER_URL;

/*
 * Mapfile exists ? returns it, else create it
 */
if (!file_exists($mapfileurl)) {
    /**
     * Create mapfile
     */
    $mapfile = '
    MAP
        EXTENT -180.0 -90.0 180.0 90.0
        IMAGECOLOR 255 255 255
        IMAGEQUALITY 100
        IMAGETYPE PNG
        INTERLACE ON
        SIZE 256 256
        STATUS ON
        TRANSPARENT ON
        UNITS DD
        DEBUG 5
        OUTPUTFORMAT
            NAME "AGGPNG"
            DRIVER "AGG/PNG"
            EXTENSION "png"
            MIMETYPE "image/png"
            IMAGEMODE RGBA
            TRANSPARENT ON
            FORMATOPTION "TRANSPARENT=ON"
        END
        WEB
          IMAGEPATH "/tmp/"
          IMAGEURL "/"
          METADATA
            "ows_enable_request"   "*"
            "wms_title"          "_msprowser WMS Proxy Server"
            "wms_onlineresource" "' . $msurl . '?map=' . $mapfileurl . '&"
            "wms_srs"            "EPSG:4326 EPSG:3857"
            "wms_feature_info_mime_type"    "text/html"
          END
        END
        PROJECTION
          "init=epsg:3857"
        END
        LAYER
          NAME "' . $layers . '"
          TYPE RASTER
          OFFSITE 255 255 255
          STATUS ON
          CONNECTION "' . $url . '"
          CONNECTIONTYPE WMS
          METADATA
            "wms_srs"             "' . $srs . '"
            "wms_name"            "' . $layers . '"
            "wms_server_version"  "1.1.1"
            "wms_format"          "image/png"
    ';

    if (MSP_USE_PROXY) {
        $mapfile .= '
                "wms_proxy_host"      "' . MSP_PROXY_URL . '"
                "wms_proxy_port"      "' . MSP_PROXY_PORT . '"
                "wms_proxy_username"  "' . MSP_PROXY_USER . '"
                "wms_proxy_password"  "' . MSP_PROXY_PASSWORD . '"

        ';
    }

    $mapfile .= '
          END
        END
    END';

    $handle = fopen($mapfileurl, 'w');
    fwrite($handle, $mapfile);
    fclose($handle);
}
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");
echo '{"success":true, "url":"' . $msurl . '?map=' . $mapfileurl . '&"}';
?>