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

/* ========================== FUNCTIONS ============================ */
/**
 *
 * Get a json object containing and "items" array and transform into comma
 * separated format (csv)
 *
 * @param <Object> $json : json object containing one "items" array (i.e. {"items":[{...},{...},...]})
 * @param <String> $fileName : fileName
 *
 * @return <boolean> : true if success; false in other case
 */
function JSONToCSVFile($json, $fileName) {

    /*
     * Be sure that input $json is not null
     */
    if ($json == null || $json->items == null) {
        return false;
    }

    /*
     * Open $fileName for writing
     */
    $handle = fopen($fileName, 'w');

    /*
     * Problem on file opening ? Stop process
     */
    if ($handle == null) {
        return false;
    }

    $isFirst = true;

    /*
     * Roll over $json->items array
     */
    foreach ($json->items as $item) {
        $line = "";
        $header = "";
        foreach ($item as $k => $v) {
            if ($line != "") {
                $line .= ";";
                $header .= ";";
            }
            /*
             * Avoid ";" within values
             */
            $line .= str_replace(";", ",", $v);
            $header .= $k;
        }
        if ($isFirst) {
            fwrite($handle, $header . PHP_EOL);
            $isFirst = false;
        }
        fwrite($handle, $line . PHP_EOL);
    }

    fclose($handle);

    return true;
}

/**
 *
 * Get a json object containing and "items" array and transform into KML
 *
 * @param <Object> $json : json object containing one "items" array (i.e. {"items":[{...},{...},...]})
 * @param <String> $fileName : fileName
 * @param <String> $name : name of exported data
 *
 * @return <boolean> : true if success; false in other case
 */
function JSONToKMLFile($json, $fileName, $name) {

    /*
     * Be sure that input $json is not null
     */
    if ($json == null || $json->items == null) {
        return false;
    }

    /*
     * Open $fileName for writing
     */
    $handle = fopen($fileName, 'w');

    /*
     * Problem on file opening ? Stop process
     */
    if ($handle == null) {
        return false;
    }

    if ($name == null) {
        $name == "mapshup export";
    }

    $isFirst = true;

    /*
     * Start kml
     */
    $kml = '<kml xmlns="http://earth.google.com/kml/2.2">' . PHP_EOL . '<Document>' . PHP_EOL;
    $kml .= '<name>' . $name . '</name>' . PHP_EOL;
    $kml .= '<description>Exported by http://mapshup.info on ' . date('c') . '</description>' . PHP_EOL;
    $kml .= '<Style id="sn_ylw-pushpin">
		<IconStyle>
			<scale>1.1</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
			</Icon>
			<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>
		</IconStyle>
		<PolyStyle>
			<color>44ffffff</color>
		</PolyStyle>
	</Style>
	<StyleMap id="msn_ylw-pushpin">
		<Pair>
			<key>normal</key>
			<styleUrl>#sn_ylw-pushpin</styleUrl>
		</Pair>
		<Pair>
			<key>highlight</key>
			<styleUrl>#sh_ylw-pushpin</styleUrl>
		</Pair>
	</StyleMap>
	<Style id="sh_ylw-pushpin">
		<IconStyle>
			<scale>1.3</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
			</Icon>
			<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>
		</IconStyle>
		<PolyStyle>
			<color>44ff008b</color>
		</PolyStyle>
	</Style>';

    /*
     * Roll over $json->items array
     */
    foreach ($json->items as $item) {
        $kml .= '<Placemark>' . PHP_EOL;
        $name = "";
        $description = "";
        $geometry = "";
        foreach ($item as $k => $v) {

            /*
             * Search for a good name...
             * "name", "title", "identifier" or "id" are good candidates !
             */
            if ($name == "") {
                if ($k == "name" || $k == "title" || $k == "identifier" || $k == "id") {
                    $name = html_entity_decode($v);
                }
            }

            /*
             * Special case : "wkt" contains geometry information
             */
            if ($k == "wkt") {
                $geometry = WKTToKML($v);
            } else {
                $description .= $k . " : " . html_entity_decode($v) . "</br>";
            }
        }
        $kml .= '<name><![CDATA[' . $name . ']]></name>' . PHP_EOL .
                '<description><![CDATA[' . $description . ']]></description>' . PHP_EOL .
                '<styleUrl>#msn_ylw-pushpin</styleUrl>' . PHP_EOL .
                $geometry .
                '</Placemark>' . PHP_EOL;
    }

    /*
     * Close kml
     */
    $kml .= '</Document>' . PHP_EOL . '</kml>';

    /*
     * Write to file
     */
    fwrite($handle, $kml);
    fclose($handle);

    return true;
}

/*
 * Converts a WKT to KML
 */

function WKTToKML($wkt) {

    if (preg_match("/^point/i", $wkt)) {
        return pointWKTToKML($wkt);
    } elseif (preg_match("/^multipoint/i", $wkt)) {
        return multiPointWKTToKML($wkt);
    } elseif (preg_match("/^linestring/i", $wkt)) {
        return linestringWKTToKML($wkt);
    } elseif (preg_match("/^multilinestring/i", $wkt)) {
        return multiLinestringWKTToKML($wkt);
    } elseif (preg_match("/^polygon/i", $wkt)) {
        return polygonWKTToKML($wkt);
    } elseif (preg_match("/^multipolygon/i", $wkt)) {
        return multiPolygonWKTToKML($wkt);
    }

    return "";
}

/*
 * Converts a MULTIPOINT WKT to KML
 *
 *  WKT :
 *    MULTIPOINT((...),(...))
 *
 *  KML :
 *
 * <MultiPoint>
 *      <Point>
 *          <coordinates>...</coordinates>
 *      </Point>
 *      ...
 * </MultiPoint>
 * 
 */
function multiPointWKTToKML($wkt) {

    /*
     * First change the coordinates order
     * lon lat, lon lat, ... => lon,lat,0 lon,lat,0 ...
     */
    $wkt = preg_replace("/([0-9\.\-]+) ([0-9\.\-]+),*/", "$1,$2,0 ", $wkt);

    /* "MULTIPOINT((" is 12 characters */
    $wkt = substr($wkt, 12);
    $wkt = substr($wkt, 0, -2);
    
    $points = explode('),(', $wkt);
    $kml = '<MultiPoint>' . PHP_EOL;

    foreach ($points as $point) {
        $kml .= '<Point>' . PHP_EOL;
        $kml .= '<coordinates>' . trim($point) . '</coordinates>' . PHP_EOL;
        $kml .= '</Point>' . PHP_EOL;
    }
    $kml .= '</MultiPoint>' . PHP_EOL;
    
    return $kml;
}

/*
 * Converts a POINT WKT to KML
 *
 *  WKT :
 *    POINT(...)
 *
 *  KML :
 *
 *   <Point>
 *      <coordinates>...</coordinates>
 *   </Point>
 *
 */
function pointWKTToKML($wkt) {

    /*
     * First change the coordinates order
     * lon lat, lon lat, ... => lon,lat,0 lon,lat,0 ...
     */
    $wkt = preg_replace("/([0-9\.\-]+) ([0-9\.\-]+),*/", "$1,$2,0 ", $wkt);

    /* "POINT(" is 6 characters */
    $wkt = substr($wkt, 6);
    $wkt = substr($wkt, 0, -1);
    
    $kml = '<Point>' . PHP_EOL;
    $kml .= '<coordinates>' . trim($wkt) . '</coordinates>' . PHP_EOL;
    $kml .= '</Point>' . PHP_EOL;
    return $kml;
}

/*
 * Converts a LINESTRING WKT to KML
 *
 *  WKT :
 *    LINESTRING(...)
 *
 *  KML :
 *   <LineString>
 *      <coordinates>...</coordinates>
 *   </LineString>
 *
 */
function lineStringWKTToKML($wkt) {

    /*
     * First change the coordinates order
     * lon lat, lon lat, ... => lon,lat,0 lon,lat,0 ...
     */
    $wkt = preg_replace("/([0-9\.\-]+) ([0-9\.\-]+),*/", "$1,$2,0 ", $wkt);

    /* "LINESTRING(" is 11 characters */
    $wkt = substr($wkt, 11);
    $wkt = substr($wkt, 0, -1);
    $kml = '<LineString>' . PHP_EOL;
    $kml .= '<coordinates>' . trim($wkt) . '</coordinates>' . PHP_EOL;
    $kml .= '</LineString>' . PHP_EOL;
    return $kml;
}

/*
 * Converts a POLYGON WKT to KML
 *
 *  WKT :
 *    POLYGON((...))
 *
 *  KML :
 *   <Polygon>
 *      <outerBoundaryIs>
 *          <LinearRing>
 *              <coordinates>...</coordinates>
 *          </LinearRing>
 *      </outerBoundaryIs>
 *  </Polygon>
 *
 */
function polygonWKTToKML($wkt) {

    /*
     * First change the coordinates order
     * lon lat, lon lat, ... => lon,lat,0 lon,lat,0 ...
     */
    $wkt = preg_replace("/([0-9\.\-]+) ([0-9\.\-]+),*/", "$1,$2,0 ", $wkt);

    /* "POLYGON((" is 9 characters */
    $wkt = substr($wkt, 9);
    $wkt = substr($wkt, 0, -2);
    $kml = '<Polygon>' . PHP_EOL;
    $kml .= '<outerBoundaryIs>' . PHP_EOL
            . '<LinearRing>' . PHP_EOL
            . '<coordinates>' . trim($wkt) . '</coordinates>' . PHP_EOL
            . '</LinearRing>' . PHP_EOL
            . '</outerBoundaryIs>' . PHP_EOL;
    $kml .= '</Polygon>' . PHP_EOL;
    return $kml;
}

/*
 * Converts a MULTIPOLYGON WKT to KML
 *
 * Code from Bjørn Sandvik
 * http://blog.thematicmapping.org/2008/03/wkt-to-kml-transformation.html
 */

function multiPolygonWKTToKML($wkt) {

    /*
     * First change the coordinates order
     * lon lat, lon lat, ... => lon,lat,0 lon,lat,0 ...
     */
    $wkt = preg_replace("/([0-9\.\-]+) ([0-9\.\-]+),*/", "$1,$2,0 ", $wkt);

    /* "MULTIPOLYGON(((" is 15 characters */
    $wkt = substr($wkt, 15);
    $wkt = substr($wkt, 0, -3);
    $polygons = explode(')),((', $wkt);
    $kml = '<MultiGeometry>' . PHP_EOL;

    foreach ($polygons as $polygon) {
        $kml .= '<Polygon>' . PHP_EOL;
        $boundary = explode('),(', $polygon);
        $kml .= '<outerBoundaryIs>' . PHP_EOL
                . '<LinearRing>' . PHP_EOL
                . '<coordinates>' . trim($boundary[0]) . '</coordinates>' . PHP_EOL
                . '</LinearRing>' . PHP_EOL
                . '</outerBoundaryIs>' . PHP_EOL;

        for ($i = 1; $i < count($boundary); $i++) {
            $kml .= '<innerBoundaryIs>' . PHP_EOL
                    . '<LinearRing>' . PHP_EOL
                    . '<coordinates>' . trim($boundary[$i]) . '</coordinates>' . PHP_EOL
                    . '</LinearRing>' . PHP_EOL
                    . '</innerBoundaryIs>' . PHP_EOL;
        }
        $kml .= '</Polygon>' . PHP_EOL;
    }
    $kml .= '</MultiGeometry>' . PHP_EOL;
    return $kml;
}

/* ====================== END FUNCTIONS ===================== */

/*
 * This script returns json
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Set TimeZone
 */
date_default_timezone_set(MSP_TIMEZONE);

/*
 * Success if $bool is true
 */
$bool = false;

/*
 * Process only valid requests
 *
 * This script accepts POST requests with the following keys :
 *      json : a serialized json object containing and "items" array (mandatory)
 *      format : the output type. Possible value are "csv", "kml". Default is "csv" (optional)
 *      name : name of the object to be exported (optional)
 */
if (abcCheck($_REQUEST)) {

    /*
     * Get output format - Set it to "csv" if not specified
     */
    $format = isset($_REQUEST["format"]) ? $_REQUEST["format"] : "csv";

    /*
     * Get name - Set it to null if not specified
     */
    $name = isset($_REQUEST["name"]) ? $_REQUEST["name"] : null;


    /*
     * Only process if json key is specified
     */
    if (isset($_REQUEST["json"])) {

        $json = $_REQUEST["json"];

        /*
         * Set a unique filename based on md5 sum
         */
        $md5 = md5($json);

        /*
         * Output file is a mapfile
         */
        $fileName = $md5 . "." . $format;

        /*
         * $fileName exists ? No need to process it again
         */
        if (!file_exists(MSP_UPLOAD_DIR . $fileName)) {

            $json = json_decode($json);

            /*
             * Transform json object into given "type" format
             */
            if ($format == "csv") {
                $bool = JSONToCSVFile($json, MSP_UPLOAD_DIR . $fileName, $name);
            } elseif ($format == "kml") {
                $bool = JSONToKMLFile($json, MSP_UPLOAD_DIR . $fileName, $name);
            }
        } else {
            $bool = true;
        }
    }
}
echo $bool == true ? '{"url":"' . MSP_GETFILE_URL . $fileName . '"}' : '{"error":{"message":"Error : cannot export layer"}}';
?>