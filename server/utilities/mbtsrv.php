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

/*
 * Serves mbtiles (http://www.mbtiles.org) through
 * an OpenLayers XYZ layer request
 * 
 */
include_once '../config.php';
include_once '../functions/general.php';

/*
 * Mandatory parameters
 */
$zxy = isset($_REQUEST["zxy"]) ? $_REQUEST["zxy"] : null;

/*
 * callback function - use for json tiles and metadata info
 */
$callback = isset($_REQUEST["callback"]) ? $_REQUEST["callback"] : null;

/*
 * mbtiles file is supposed to be suffixed by ".mbtiles"
 */
$t = isset($_REQUEST["t"]) ? $_REQUEST["t"] : null;

/*
 * By default return tiles, i.e. png
 */
$format = isset($_REQUEST["format"]) ? $_REQUEST["format"] : "png";

/*
 * Only process if tile exist
 */
if ($t) {

    $tile = MSP_MBTILES_DIR . $t . ".mbtiles";
    
    try {
        
        /*
         * Connect to mbtiles through PDO sqlite
         */
        $db = new PDO('sqlite:'.$tile) or die();
        
        /*
         * Process only valid requests
         */
        if ($zxy) {

            /*
             * Get xyz triplet to get the right tiles
             */
            $zxy = explode("/", $zxy); 
            $z = $zxy[0]; 
            $x = $zxy[1]; 
            $y = $zxy[2];
            $y = pow(2, $z) - $y - 1;

        }
        
        /*
         * Serve json
         */
        if ($format === "json") {
            
            /*
             * Initialize empty json
             */
            $json = array();
            
            /*
             * Metadata
             */
            if (!$zxy) {
                
                $q = $db->prepare("SELECT * FROM metadata");
                $q->execute();

                $q->bindColumn(1, $name);
                $q->bindColumn(2, $value);

                $s = $_SERVER['SERVER_NAME'];
                $b = $_SERVER['PHP_SELF'];
                
                $fileName = $b[count($b) - 1]; 
                $meta = array(
                    'grids' => array("http://$s$b?t=$t&zxy={z}/{x}/{y}&format=json"),
                    'tiles' => array("http://$s$b?t=$t&zxy={z}/{x}/{y}"),
                    'scheme' => 'zxy'
                );
                
                while($q->fetch()) {
                    $meta[$name] = $value;
                }

                $json = json_encode($meta);
               
            }
            /*
             * UTFGrids
             */
            else {
                $q = $db->prepare("SELECT * FROM grids WHERE zoom_level=".$z." AND tile_column =".$x." AND tile_row=".$y);
                $q->execute();
                
                $q->bindColumn(4, $grid, PDO::PARAM_LOB);

                while($q->fetch()) {
                    $json = gzinflate(substr($grid, 2));

                    $sql_data = "SELECT * FROM grid_data WHERE zoom_level =".$z." AND tile_column =".$x." AND tile_row =".$y;
                    $q_data = $db->prepare($sql_data);
                    $q_data->execute();
                    
                    $q_data->bindColumn(4, $id_data, PDO::PARAM_LOB);
                    $q_data->bindColumn(5, $data, PDO::PARAM_LOB);
                    
                    $datas = "";
                    while($q_data->fetch()) {
                        $datas .= "\"$id_data\":$data,";
                    }
                    
                    $json = substr($json, 0, strlen($json)-1) . ',"data":{' . $datas . '}}';

                }
               
            }
            
            /*
             * Serve json through callback if needed
             */
            header('Content-Type: application/json');
            echo $callback ? $callback.'('.$json.');' : $json;
            
        }
        /*
         * Serve png tiles
         */
        else if ($zxy) {
            
            $pngdata = @$db->prepare("select tile_data from tiles where zoom_level = ".$z." and tile_column = ".$x." and tile_row = ".$y); 
            $pngdata->execute(); 
            $pngdata = $pngdata->fetchObject();

            /*
             * Returns png
             */
            header('Content-Type: image/png');

            /*
             * If $pngdata is empty, stream a predefined tile
             */
            if (!isset($pngdata->tile_data)) {
                readfile(MSP_MBTILES_DIR . 'nodata.png');
            }
            /*
             * Stream png result
             */
            else {
                echo $pngdata->tile_data;
            }
    
        }
    }
    catch(PDOException $e) {
       echo $e->getMessage();
    }
    
}

?>