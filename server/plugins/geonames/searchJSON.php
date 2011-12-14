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

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

$q = $_REQUEST["name_startsWith"];
$maxRows = $_REQUEST["maxRows"];
$callback = $_REQUEST["callback"];
$before = "";
$after = "";
if ($callback) {
	$before = $callback."(";
	$after = ");";
}

if (!$q) {
    echo $before."{totalResultsCount:0,geonames:[{}]}".$after;
    exit;
}
if (!$maxRows) {
    $maxRows = 10;
}

$fields = "name,";
$fields .= "country,";
$fields .= "longitude as lng,";
$fields .= "latitude as lat,";
$fields .= "fcode,";
$fields .= "geonameid as geonameId,";
$fields .= "population,";
$fields .= "admin1 as adminName1,";
$fields .= "admin1 as adminCode1,";
$fields .= "fclass as fcl,";
$fields .= "fclass as fclName,";
$fields .= "country as countryCode";

//Convert input string so the first character is always in upper case
//$firstChar = strtoupper(substr($q,0,1));
//$q = $firstChar.substr($q,1);
$q = strtoupper($q);

$link = pg_Connect("dbname=geonames user=postgres password=postgres");
$result = pg_exec($link, "SELECT ".$fields." FROM geoname WHERE asciiname LIKE '".$q."%' ORDER BY asciiname LIMIT ".$maxRows.";");
//echo "SELECT ".$fields." FROM geoname WHERE asciiname LIKE '".$q."%' ORDER BY asciiname LIMIT ".$maxRows.";";
$numrows = pg_numrows($result);
$json = $before."{totalResultsCount:".$numrows.",geonames:[";
if ($numrows == 0) {
    return $json."{}]}".$after;
}
for($ri = 0; $ri < $numrows; $ri++) {
    $row = pg_fetch_array($result, $ri);
    $json .= '{';
    foreach (array_keys($row) as $key) {
        if (!is_numeric($key)) {
            if (!is_numeric($row[$key])) {
                if ($key == "country") {
                    $tmpResult =pg_exec($link, "SELECT name FROM countryInfo WHERE iso_alpha2='".$row[$key]."';");
                        $nbOfResult = pg_numrows($tmpResult);
                        if ($nbOfResult > 0) {
                            $tmpRow = pg_fetch_array($tmpResult, 0);
                            //$json .= 'countryName:"'.rawurlencode($tmpRow["name"]).'",';
                            $json .= 'countryName:"'.$tmpRow["name"].'",';
                        }
                }
                else if ($key == "fcode") {
                        $tmpResult = pg_exec($link, "SELECT name FROM featureCodes WHERE code='".$row['fcl'].".".$row['fcode']."';");
                        $nbOfResult = pg_numrows($tmpResult);
                        if ($nbOfResult > 0) {
                            $tmpRow = pg_fetch_array($tmpResult, 0);
                            //$json .= 'fcodeName:"'.rawurlencode($tmpRow["name"]).'",';
                            $json .= 'fcodeName:"'.$tmpRow["name"].'",';
                        }
                    }
                    else {
                        //$json .= $key.':"'.rawurlencode($row[$key]).'",';
                        $json .= $key.':"'.$row[$key].'",';
                    }
            }
            else {
                $json .= $key.':'.$row[$key].',';
            }

        }
    }
    $json .= '},';
}

pg_close($link);

$json .= "]}".$after;
$json = preg_replace('/,\]\}/', ']}', $json);
echo preg_replace('/,\}/', '}', $json);
?>
