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
 * This script returns XML
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: text/xml");

$time = time();
$request = isset($_REQUEST["request"]) ? $_REQUEST["request"] : "GetFeatures";
$max = $_REQUEST["max"];
if ($request == "GetCapabilities") {
    $file = file_get_contents("getcapabilities.xml");
    echo $file;
} elseif ($request == "DescribeFeatureType") {
    $file = file_get_contents("describefeaturetype.xml");
    echo $file;
} else {
    $orbit = $_REQUEST["orbit"];
    if ($orbit) {
        $value = $time % 592;
        if ($value % 2 == 1) {
            $value = $value + 1;
        }
        $values = preg_split('/ /', file_get_contents($orbit));
        $file = file_get_contents("getfeature.xml");
        $file = str_replace(array('FID', 'LAT', 'LON'), array($value, $values[$value], $values[$value + 1]), $file);
    } else {
        $lon = rand(-10, 10);
        $lat = rand(-10, 10);
        $size = rand(1, 10);
        $file = file_get_contents("getfeature.xml");
        $file = str_replace(array('FID', 'LAT', 'LON'), array($size, $lon, $lat), $file);
    }
    echo $file;
}
?>