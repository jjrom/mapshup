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

// http://www.pgrouting.org/docs/ol-workshop/ch12.html
// Database connection settings
define("PG_DB", "routing");
define("PG_HOST", "localhost");
define("PG_USER", "osm");
define("PG_PASS", "osm00");
define("PG_PORT", "5432");
define("TABLE", "ways");

$counter = $pathlength = 1;

// Retrieve start point
$start = split(':', $_REQUEST['startpoint']);

$startPoint = array($start[0], $start[1]);


// Retrieve end point
$end = split(':', $_REQUEST['endpoint']);

$endPoint = array($end[0], $end[1]);



// Find the nearest edge
$startEdge = findNearestEdge($startPoint);


$endEdge = findNearestEdge($endPoint);

// FUNCTION findNearestEdge
function findNearestEdge($lonlat) {

    // Connect to database
    $con = pg_connect("dbname=" . PG_DB . " host=" . PG_HOST . " password=" . PG_PASS . " user=" . PG_USER);

    $sql = "SELECT gid, source, target, the_geom,astext(the_geom),
                     distance(the_geom, GeometryFromText(
                          'POINT(" . $lonlat[0] . " " . $lonlat[1] . ")', 4326)) AS dist
                    FROM " . TABLE . "
                    WHERE the_geom && setsrid(
                          'BOX3D(" . ($lonlat[0] - 0.1) . "
                                 " . ($lonlat[1] - 0.1) . ",
                                 " . ($lonlat[0] + 0.1) . "
                                 " . ($lonlat[1] + 0.1) . ")'::box3d, 4326)
                    ORDER BY dist LIMIT 1";



    $query = pg_query($con, $sql);

    $edge['gid'] = pg_fetch_result($query, 0, 0);
    $edge['source'] = pg_fetch_result($query, 0, 1);
    $edge['target'] = pg_fetch_result($query, 0, 2);
    $edge['the_geom'] = pg_fetch_result($query, 0, 3);
    $edge['the_geom_as_text'] = pg_fetch_result($query, 0, 4);



    pg_close($con);

    return $edge;
}

$sql2 = "SELECT astext(multiline_locate_point(the_geom,PointFromText('POINT(" . $startPoint[0] . " " . $startPoint[1] . ")',4326))) from ways where gid=" . $startEdge[gid];
//echo $sql2;


$sql3 = "SELECT astext(multiline_locate_point(the_geom,PointFromText('POINT(" . $endPoint[0] . " " . $endPoint[1] . ")',4326))) from ways where gid=" . $endEdge[gid];
//echo $sql3;
$con = pg_connect("dbname=" . PG_DB . " host=" . PG_HOST . " password=" . PG_PASS . " user=" . PG_USER);


$query2 = pg_query($con, $sql2);
$query3 = pg_query($con, $sql3);

$point_on_line_begin = pg_fetch_result($query2, 0, 0);
$point_on_line_ende = pg_fetch_result($query3, 0, 0);

//Getting length of the route A -> B  and "the other way round" to avoid errors in route-calculation
$length_1 = getting_pathlength($startEdge['source'], $endEdge['target'], $startEdge['gid'], $endEdge['gid'], $point_on_line_begin, $point_on_line_ende);


$length_2 = getting_pathlength($endEdge['source'], $startEdge['target'], $startEdge['gid'], $endEdge['gid'], $point_on_line_begin, $point_on_line_ende);

//Function Getting length of the route
function getting_pathlength($start, $ende, $start_gid, $end_gid, $point_on_line_begin, $point_on_line_ende) {


    $sql = "SELECT rt.gid, AsText(rt.the_geom) AS wkt,
                                ST_Length(rt.the_geom) AS length, " . TABLE . ".gid
                             FROM " . TABLE . ",
                                 (SELECT gid, the_geom
                                     FROM dijkstra_sp_delta(
                                         '" . TABLE . "',
                                         " . $start . ",
                                         " . $ende . ",
                                         0.1) WHERE gid!=" . $start_gid . " AND gid!=" . $end_gid . "
                                  ) as rt
                             WHERE " . TABLE . ".gid=rt.gid;";

    $geometrie_results = pg_query($sql);
    $number_of_geometrien = pg_num_rows($geometrie_results);


    $totallength = 0;
    for ($x = 0; $x < $number_of_geometrien; $x++) {



        $result_length[$x] = pg_result($geometrie_results, $x, length);
        $totallength = $totallength + $result_length[$x];
    }



//result besidegeometrie begin
    for ($x = 0; $x < $number_of_geometrien; $x++) {
        $result_geometrie_gid[$x] = pg_result($geometrie_results, $x, gid);




        $matching_besidegeometrie_begin = pg_query("SELECT b.gid,astext(b.the_geom) from (select the_geom from ways where gid=" . $start_gid . ")a, (select gid,the_geom from ways WHERE gid=" . $result_geometrie_gid[$x] . ") b WHERE touches (a.the_geom,b.the_geom)");

        $result_besidegeometrie_begin_gid = @pg_result($matching_besidegeometrie_begin, 0, gid);



        IF ($result_besidegeometrie_begin_gid != '') {

            Break;
        }
    }

    if ($number_of_geometrien == 0) {

        $result_besidegeometrie_begin_gid = $end_gid;
        $result_besidegeometrie_ende_gid = $start_gid;
    }


//result besidegeometrie Ende
    for ($x = 0; $x < $number_of_geometrien; $x++) {
        $result_geometrie_gid[$x] = pg_result($geometrie_results, $x, gid);




        $matching_besidegeometrie_ende = pg_query("SELECT d.gid,astext(d.the_geom) from (select the_geom from ways where gid=" . $end_gid . ")c, (select gid,the_geom from ways WHERE gid=" . $result_geometrie_gid[$x] . ") d WHERE touches (c.the_geom,d.the_geom)");
        $result_besidegeometrie_ende_gid = @pg_result($matching_besidegeometrie_ende, 0, gid);
        IF ($result_besidegeometrie_ende_gid != '') {

            Break;
        }
    }

    $con = pg_connect("dbname=" . PG_DB . " host=" . PG_HOST . " password=" . PG_PASS . " user=" . PG_USER);





    $query = pg_query($con, $sql);



//Geometrie-begin
    $sql3 = "SELECT astext(give_we_wkt(" . $start_gid . "," . $result_besidegeometrie_begin_gid . ",'" . $point_on_line_begin . "'))";


    $query3 = pg_query($con, $sql3);
    $searching_wkt_begin = pg_fetch_result($query3, 0, 0);

    $sql4 = "SELECT ST_Length('" . $searching_wkt_begin . "')";

    $query4 = pg_query($con, $sql4);
    $length_begin = pg_fetch_result($query4, 0, 0);

    $totallength = $totallength + $length_begin;
//----------------------------------------
//Geometrie-Ende
    $sql5 = "SELECT astext(give_we_wkt(" . $end_gid . "," . $result_besidegeometrie_ende_gid . ",'" . $point_on_line_ende . "'))";
    $query5 = pg_query($con, $sql5);
    $searching_wkt_ende = pg_fetch_result($query5, 0, 0);


    $sql6 = "SELECT ST_Length('" . $searching_wkt_ende . "')";

//echo $sql6;

    $query6 = pg_query($con, $sql6);
    $length_ende = pg_fetch_result($query6, 0, 0);





    $totallength = $totallength + $length_ende;



    return $totallength;
}

if ($length_1 < $length_2) {



    $sql = "SELECT rt.gid, AsText(rt.the_geom) AS wkt,
                                ST_Length(rt.the_geom) AS length, " . TABLE . ".gid
                             FROM " . TABLE . ",
                                 (SELECT gid, the_geom
                                     FROM dijkstra_sp_delta(
                                         '" . TABLE . "',
                                         " . $startEdge['source'] . ",
                                         " . $endEdge['target'] . ",
                                         0.1) WHERE gid!=" . $startEdge['gid'] . " AND gid!=" . $endEdge['gid'] . "
                                  ) as rt
                             WHERE " . TABLE . ".gid=rt.gid;";
} else {



    $sql = "SELECT rt.gid, AsText(rt.the_geom) AS wkt,
                                ST_Length(rt.the_geom) AS length, " . TABLE . ".gid
                             FROM " . TABLE . ",
                                 (SELECT gid, the_geom
                                     FROM dijkstra_sp_delta(
                                         '" . TABLE . "',
                                         " . $endEdge['source'] . ",
                                         " . $startEdge['target'] . ",
                                         0.1) WHERE gid!=" . $startEdge['gid'] . " AND gid!=" . $endEdge['gid'] . "
                                  ) as rt
                             WHERE " . TABLE . ".gid=rt.gid;";
}



$geometrie_results = pg_query($sql);
$number_of_geometrien = pg_num_rows($geometrie_results);


$totallength = 0;
for ($x = 0; $x < $number_of_geometrien; $x++) {



    $result_length[$x] = pg_result($geometrie_results, $x, length);
    $totallength = $totallength + $result_length[$x];
}



//result besidegeometrie begin
for ($x = 0; $x < $number_of_geometrien; $x++) {
    $result_geometrie_gid[$x] = pg_result($geometrie_results, $x, gid);




    $matching_besidegeometrie_begin = pg_query("SELECT b.gid,astext(b.the_geom) from (select the_geom from ways where gid=" . $startEdge['gid'] . ")a, (select gid,the_geom from ways WHERE gid=" . $result_geometrie_gid[$x] . ") b WHERE touches (a.the_geom,b.the_geom)");

    $result_besidegeometrie_begin_gid = @pg_result($matching_besidegeometrie_begin, 0, gid);



    IF ($result_besidegeometrie_begin_gid != '') {

        Break;
    }
}

//result besidegeometrie Ende
for ($x = 0; $x < $number_of_geometrien; $x++) {
    $result_geometrie_gid[$x] = pg_result($geometrie_results, $x, gid);




    $matching_besidegeometrie_ende = pg_query("SELECT d.gid,astext(d.the_geom) from (select the_geom from ways where gid=" . $endEdge['gid'] . ")c, (select gid,the_geom from ways WHERE gid=" . $result_geometrie_gid[$x] . ") d WHERE touches (c.the_geom,d.the_geom)");
    $result_besidegeometrie_ende_gid = @pg_result($matching_besidegeometrie_ende, 0, gid);

    IF ($result_besidegeometrie_ende_gid != '') {

        Break;
    }
}

if ($number_of_geometrien == 0) {

    $result_besidegeometrie_begin_gid = $endEdge['gid'];
    $result_besidegeometrie_ende_gid = $startEdge['gid'];
}


$con = pg_connect("dbname=" . PG_DB . " host=" . PG_HOST . " password=" . PG_PASS . " user=" . PG_USER);





$query = pg_query($con, $sql);



//Geometrie-begin
$sql3 = "SELECT astext(give_we_wkt(" . $startEdge['gid'] . "," . $result_besidegeometrie_begin_gid . ",'" . $point_on_line_begin . "'))";



$query3 = pg_query($con, $sql3);
$searching_wkt_begin = pg_fetch_result($query3, 0, 0);

$sql4 = "SELECT ST_Length('" . $searching_wkt_begin . "')";

$query4 = pg_query($con, $sql4);
$length_begin = pg_fetch_result($query4, 0, 0);

$totallength = $totallength + $length_begin;
//----------------------------------------
//Geometrie-Ende
$sql5 = "SELECT astext(give_we_wkt(" . $endEdge['gid'] . "," . $result_besidegeometrie_ende_gid . ",'" . $point_on_line_ende . "'))";
$query5 = pg_query($con, $sql5);
$searching_wkt_ende = pg_fetch_result($query5, 0, 0);


$sql6 = "SELECT ST_Length('" . $searching_wkt_ende . "')";

//echo $sql6;

$query6 = pg_query($con, $sql6);
$length_ende = pg_fetch_result($query6, 0, 0);

//echo "test ".$result_besidegeometrie_begin_gid;
if ($startEdge['gid'] == $endEdge['gid']) {




    $abfrage_path_between_two_points = "SELECT astext(intersection_on_line($result_besidegeometrie_begin_gid,'$point_on_line_begin','$point_on_line_ende')) as wkt,ST_length(give_we_wkt_auf_linie($result_besidegeometrie_begin_gid,'$point_on_line_begin','$point_on_line_ende')) as length";

//echo $abfrage_path_between_two_points;
    $query7 = pg_query($con, $abfrage_path_between_two_points);
    $result_path_between_two_points = pg_fetch_result($query7, 0, wkt);
    $result_length_between_two_points = pg_fetch_result($query7, 0, length);

    $searching_wkt_begin = $result_path_between_two_points;
    $searching_wkt_ende = $result_path_between_two_points;
    $length_begin = $result_length_between_two_points;
    $length_ende = $result_length_between_two_points;
//echo "Die Strecke ".$result_path_between_two_points;
}

/**
 * GeoJSON
 */
$geojson = array(
    'type' => 'FeatureCollection',
    'features' => array()
);

// First edge
$feature = array(
    'type' => 'Feature',
    'geometry' => array(
        'type' => 'MultiLineString',
        'coordinates' => multiLineStringToGeoJSON($searching_wkt_begin)
    ),
    'crs' => array(
        'type' => 'EPSG',
        'properties' => array('code' => '4326')
    ),
    'properties' => array(
        'id' => $startEdge['gid'],
        'length' => $length_begin
    )
);
// Add feature array to feature collection array
array_push($geojson['features'], $feature);

while ($edge = pg_fetch_assoc($query)) {

    if ($edge['wkt']) {
        $feature = array(
            'type' => 'Feature',
            'geometry' => array(
                'type' => 'MultiLineString',
                'coordinates' => multiLineStringToGeoJSON($edge['wkt'])
            ),
            'crs' => array(
                'type' => 'EPSG',
                'properties' => array('code' => '4326')
            ),
            'properties' => array(
                'id' => $edge['id'],
                'length' => $edge['length']
            )
        );
    }

    // Add feature array to feature collection array
    array_push($geojson['features'], $feature);
}

// Last edge
$feature = array(
    'type' => 'Feature',
    'geometry' => array(
        'type' => 'MultiLineString',
        'coordinates' => multiLineStringToGeoJSON($searching_wkt_ende)
    ),
    'crs' => array(
        'type' => 'EPSG',
        'properties' => array('code' => '4326')
    ),
    'properties' => array(
        'id' => $endEdge['gid'],
        'length' => $length_ende
    )
);
// Add feature array to feature collection array
array_push($geojson['features'], $feature);

// Close database connection
pg_close($con);

/**
 *  Return routing result
 */
header('Content-type: application/json', true);
echo json_encode($geojson);

function multiLineStringToGeoJSON($wkt) {
    #{"type":"MultiLineString","coordinates":[[[1.4423512,43.6067432],[1.4422544,43.607007]]]}
    $wkt = str_replace("MULTILINESTRING", "", $wkt);
    $wkt = str_replace("(", "[", $wkt);
    $wkt = str_replace(")", "]", $wkt);
    $wkt = str_replace(",", "],[", $wkt);
    $wkt = str_replace(" ", ",", $wkt);
    return json_decode("[".$wkt."]");
}

?>