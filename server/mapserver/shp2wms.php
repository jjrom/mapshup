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
 * Display a SHP file through a WMS service
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
if (!abcCheck($_REQUEST) || !isset($_REQUEST["shp"])) {
  echo '{"success":false}';
  exit(0);
}

/**
 * It is assumed that the input shp key value is the shp filename
 * WITHOUT path and that it is stored under MSP_UPLOAD_DIR with
 * the shx and dbf files together
 */
$shp = MSP_UPLOAD_DIR . rawurldecode($_REQUEST["shp"]);
$srs = isset($_REQUEST["srs"]) ? $_REQUEST["srs"] : 'EPSG:4326';
$title = isset($_REQUEST["title"]) ? $_REQUEST["title"] : 'shapefile';

/*
 * Get the md5 hash of sourceUrl
 */
$md5 = md5($shp);

/*
 * Output file is a mapfile
 */
$mapfileurl = MSP_MAPFILE_DIR . $md5 . ".map";

/*
 * Get the shapefile geometry type
 *
 * Could be ... (Point)
 *          ... (Polygon)
 *          ... (Polyline)
 */
$ogrinfo = strtolower(exec(MSP_OGRINFO_PATH . ' ' . escapeshellarg($shp)));

/*
 * Point
 */
if (strpos($ogrinfo, '(point)') != 0) {
    $geometry = "point";
    $style = 'STYLE
            SYMBOL "point1"
            SIZE 10
            COLOR 255 0 0
        END';
}
/*
 * Line
 */ else if (strpos($ogrinfo, '(line string)') != 0) {
    $geometry = "line";
    $style = 'STYLE
            SIZE 3
            COLOR 255 0 0
        END';
}
/*
 * Polygon
 */ else if (strpos($ogrinfo, '(polygon)') != 0) {
    $geometry = "polygon";
    $style = 'STYLE
            COLOR 255 128 128
            OUTLINECOLOR 0 0 0
        END';
}

$fontset = MSP_MAPSERVER_FONTSET;
$symbolset = MSP_MAPSERVER_SYMBOLSET;
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
        DEBUG 0
        FONTSET "' . $fontset . '"
        SYMBOLSET "' . $symbolset . '"
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
            "wms_title"          "WMS proxy for ' . $title . '"
            "wms_onlineresource" "' . $msurl . '?map=' . $mapfileurl . '&"
            "wms_srs"            "EPSG:4326 EPSG:3857"
            "wms_feature_info_mime_type"    "text/html"
          END
        END
        PROJECTION
          "init=epsg:3857"
        END
        LAYER
          NAME "_shp"
          TYPE ' . $geometry . '
          DATA "' . $shp . '"
          OPACITY 50
          STATUS ON
          CLASS
            NAME "_shpclass"
            ' . $style . '
          END
          PROJECTION
            "proj=latlong"
            "ellps=WGS84"
          END
        END
    END';

    $handle = fopen($mapfileurl, 'w');
    fwrite($handle, $mapfile);
    fclose($handle);
}

$json = array(
    'success' => true,
    'url' => $msurl . '?map=' . $mapfileurl . '&',
    'layers' => '_shp',
    'version' => '1.1.0',
    'bbox' => '-180,-90,180,90'
);
echo json_encode($json)
?>