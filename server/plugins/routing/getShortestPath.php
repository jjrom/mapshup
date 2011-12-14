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
 * TODO : get database settings from config file
 *
 */
// Database connection settings
define("PG_DB", "routing");
define("PG_HOST", "localhost");
define("PG_USER", "osm");
define("PG_PASS", "osm00");
define("PG_PORT", "5432");
define("TABLE", "ways");

/**
 * TODO : Check input parameters
 */
// Retrieve start point
$start = split(':', $_REQUEST['startpoint']);
$startPoint = array($start[0], $start[1]);

// Retrieve end point
$end = split(':', $_REQUEST['endpoint']);
$endPoint = array($end[0], $end[1]);

// Retrieve method
$method = $_REQUEST['method'];

// Find the nearest edge
$startEdge = findNearestEdge($startPoint);
$endEdge = findNearestEdge($endPoint);

// Select the routing algorithm
switch ($method) {

    case 'SPD' : // Shortest Path Dijkstra

        $sql = "SELECT rt.gid, ST_AsGeoJSON(rt.the_geom) AS geojson,
	                 length(rt.the_geom) AS length, " . TABLE . ".gid
	              FROM " . TABLE . ",
	                  (SELECT gid, the_geom
	                      FROM dijkstra_sp_delta(
	                          '" . TABLE . "',
	                          " . $startEdge['source'] . ",
	                          " . $endEdge['target'] . ",
	                          0.1)
	                   ) as rt
	              WHERE " . TABLE . ".gid=rt.gid;";
        break;

    case 'SPA' : // Shortest Path A*

        $sql = "SELECT rt.gid, ST_AsGeoJSON(rt.the_geom) AS geojson,
	                   length(rt.the_geom) AS length, " . TABLE . ".gid
	                FROM " . TABLE . ",
	                    (SELECT gid, the_geom
	                        FROM astar_sp_delta(
	                            '" . TABLE . "',
	                            " . $startEdge['source'] . ",
	                            " . $endEdge['target'] . ",
	                            0.1)
	                     ) as rt
	                WHERE " . TABLE . ".gid=rt.gid;";
        break;

    case 'SPS' : // Shortest Path Shooting*

        $sql = "SELECT rt.gid, ST_AsGeoJSON(rt.the_geom) AS geojson,
	                   length(rt.the_geom) AS length, " . TABLE . ".gid
	                FROM " . TABLE . ",
	                    (SELECT gid, the_geom
	                        FROM shootingstar_sp(
	                            '" . TABLE . "',
	                            " . $startEdge['gid'] . ",
	                            " . $endEdge['gid'] . ",
	                            0.1, 'length', true, true)
	                     ) as rt
	                WHERE " . TABLE . ".gid=rt.gid;";
        break;
} // close switch
// Connect to database
$dbcon = pg_connect("dbname=" . PG_DB . " host=" . PG_HOST . " user=" . PG_USER);
//echo $sql;
// Perform database query
$query = pg_query($dbcon, $sql);

/**
 * GeoJSON
 */
$geojson = array(
    'type' => 'FeatureCollection',
    'features' => array()
);

// Add edges to GeoJSON array
while ($edge = pg_fetch_assoc($query)) {

    $feature = array(
        'type' => 'Feature',
        'geometry' => json_decode($edge['geojson'], true),
        'crs' => array(
            'type' => 'EPSG',
            'properties' => array('code' => '4326')
        ),
        'properties' => array(
            'id' => $edge['id'],
            'length' => $edge['length']
        )
    );

    // Add feature array to feature collection array
    array_push($geojson['features'], $feature);
}

// Close database connection
pg_close($dbcon);

/**
 *  Return routing result
 */
header('Content-type: application/json', true);
echo json_encode($geojson);

/**
 *
 * FUNCTION findNearestEdge
 *
 * @param <type> $lonlat
 * @return <type> $edge
 */
function findNearestEdge($lonlat) {
    $error = 0.1;
    
    // Connect to database
    $con = pg_connect("dbname=" . PG_DB . " host=" . PG_HOST . " user=" . PG_USER) or die("Error in SQL query: " . pg_last_error());

    $sql = "SELECT gid, source, target, the_geom,
		          distance(the_geom, GeometryFromText(
	                   'POINT(" . $lonlat[0] . " " . $lonlat[1] . ")', 4326)) AS dist
	             FROM " . TABLE . "
	             WHERE the_geom && setsrid(
	                   'BOX3D(" . ($lonlat[0] - $error) . "
	                          " . ($lonlat[1] - $error) . ",
	                          " . ($lonlat[0] + $error) . "
	                          " . ($lonlat[1] + $error) . ")'::box3d, 4326)
	             ORDER BY dist LIMIT 1";
    //echo $sql;
    $query = pg_query($con, $sql) or die("Error in SQL query: " . pg_last_error());

    $edge['gid'] = pg_fetch_result($query, 0, 0);
    $edge['source'] = pg_fetch_result($query, 0, 1);
    $edge['target'] = pg_fetch_result($query, 0, 2);
    $edge['the_geom'] = pg_fetch_result($query, 0, 3);

    // Close database connection
    pg_close($con);

    return $edge;
}

?>
