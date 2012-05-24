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
include_once '../functions/ExifReader.class.php';

/*
 * This script returns json
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 * Success if $bool is true
 */
$bool = false;
$error = "Unknown problem with upload";
$random = createPassword(10);

/**
 * Upload allowed extension
 * Should be identical to mapshup client msp.Config["upload"].allowedExtensions
 */
$validExtensions = array("gml", "gpx", "kml", "xml", "rss", "jpeg", "jpg", "gif", "png", "shp", "shx", "dbf", "json");

/*
 * Process only valid requests
 *
 * This script accepts POST requests with multipart
 */
if (abcCheck($_REQUEST)) {

    /*
     * Set the error messages
     */
    $error_message[0] = "Error : Unknown problem with upload.";
    $error_message[1] = "Error : Uploaded file too large (load_max_filesize).";
    $error_message[2] = "Error : Uploaded file too large (MAX_FILE_SIZE).";
    $error_message[3] = "Error : File was only partially uploaded.";
    $error_message[4] = "Error : Choose a file to upload.";

    $count = count($_FILES);
    $items = array();

    /*
     * First check that there is at least on file
     */
    if ($count > 0) {

        /*
         * Magic files are streamed. Other are send as attachement
         */
        $stream = isset($_REQUEST["magic"]) ? '&stream=true' : '';

        /*
         * Count number of uploaded file
         */
        $count = count($_FILES['file']['name']);

        /*
         * ids string is a comma separated list of file id
         */
        if (isset($_REQUEST["ids"])) {
            $ids = split(",", $_REQUEST["ids"]);
        }

        /*
         * Array of localized items - e.g. JPEG images with
         * location specified in EXIF tag
         */
        $localizedItems = array();
        
        /*
         * Roll over each file names within the 'file' array
         */
        for ($i = 0; $i < $count; $i++) {

            /*
             * Default values
             */
            $url = -1;
            $file = null;
            $type = "unknown";
            $id = $ids[$i] ? $ids[$i] : '';
            $error = null;
            $ignore = false;
            $remove = false;
            $infos = array(
                'type'=>MSP_UNKNOWN
            );

            /*
             * Files are stored under MSP_UPLOAD_DIR
             */
            $fileNameOri = $_FILES['file']['name'][$i];

            /*
             * Protect file name
             */
            $fileName = $random . "_" . str_replace(array("(", ")", " ", "{", "}", "$", "#", ":", "'", "`", "\""), "_", $fileNameOri);

            /*
             * Check extension validity
             */
            $extension = getExtension($fileName);
            $isValid = false;
            foreach ($validExtensions as $valid) {
                if ($valid == strtolower($extension)) {
                    $isValid = true;
                    break;
                }
            }

            /*
             * Extensions is not valid
             */
            if (!$isValid) {
                $error = "File type is not allowed";
            } else {

                /*
                 * Upload worked !
                 */
                if (is_uploaded_file($_FILES['file']['tmp_name'][$i])) {

                    /*
                     * Write on disk worked !
                     */
                    if (move_uploaded_file($_FILES['file']['tmp_name'][$i], MSP_UPLOAD_DIR . $fileName)) {

                        /*
                         * Shapefile special case :
                         * 
                         * Shapefiles are made of 3 files (shp, shx and dbf)
                         * Only the shp url is returned WITHOUT MSP_GETFILE_URL !
                         * The shx and dbf urls are set to -1 and the "remove" property
                         * is set to true to tell Magic manager to remove them from the
                         * uploaded list
                         */
                        if (strtolower($extension) == "shp") {
                            $file = $fileName;
                            $type = "SHP";
                        }
                        /*
                         * dbf and shx files are discarded 
                         */ else if (strtolower($extension) == "shx" || strtolower($extension) == "dbf") {
                            continue;
                        }
                        /*
                         * General case
                         */ else {

                            $url = MSP_GETFILE_URL . $fileName . $stream;

                            /*
                             * JPG special case
                             *
                             * JPG images generally have EXIF tags.
                             * If EXIF description contains GPS location, it is assumed that
                             * the JPG image is a mapshup "Picture" wich means a GeoJSON
                             * point with attributes including the picture itself
                             */
                            if (strtolower($extension) == "jpg") {
                                $exif = new ExifReader();
                                $feature = $exif->readImage(MSP_UPLOAD_DIR . $fileName);

                                /*
                                 * The image is localized => it is a Photography
                                 */
                                if ($feature != null) {
                                    $ignore = true;
                                    $type = "Photography";

                                    /*
                                     * Generate a 75x75 pixels icon from image and set
                                     * it's url within the 'icon' property
                                     */
                                    $iconName = str_replace('.' . $extension, '_t.' . $extension, $fileName);
                                    exec(MSP_GDAL_TRANSLATE_PATH . ' -of JPEG -outsize 75 75 ' . MSP_UPLOAD_DIR . $fileName . ' ' . MSP_UPLOAD_DIR . $iconName);
                                    
                                    $feature['properties']['title'] = $fileNameOri;
                                    $feature['properties']['quicklook'] = MSP_GETFILE_URL . $fileName . $stream;
                                    $feature['properties']['icon'] = MSP_GETFILE_URL . $iconName . $stream;
                                    $feature['properties']['_mapshup'] = array(
                                        'download' => MSP_GETFILE_URL . $fileName
                                    );
                                    array_push($localizedItems, $feature);
                                }
                                /*
                                 * ...else normal work (TBC)
                                 */ else {
                                    $infos = getLayerInfosFromFile(MSP_UPLOAD_DIR . $fileName);
                                }
                            } else {
                                $infos = getLayerInfosFromFile(MSP_UPLOAD_DIR . $fileName);
                            }
                        }
                    }
                    /*
                     * Write on disk did not work !
                     */ else {
                        $error = $error_message[$_FILES['file']['error'][$i]];
                    }
                }
                /*
                 * Upload did not work !
                 */ else {
                    $error = $error_message[$_FILES['file']['error'][$i]];
                }
            }

            /*
             * Push items
             */
            $item = array(
                'type' => $infos['type'],
                'id' => $id
            );
            
            /*
             * Infos keys/values
             */
            foreach(array_keys($infos) as $key) {
                if ($infos[$key] != null) {
                    $item[$key] = $infos[$key];
                }
            }
            
            /*
             * File or url...need to choose :)
             */
            $file != null ? $item['file'] = $file : $item['url'] = $url; 
            
            if ($error != null) {
                $item['error'] = $error;
            }
            if ($ignore == true) {
                $item['ignore'] = true;
            }
            array_push($items, $item);
        }

        /*
         * If localizedItems array contains elements,
         * create a new GeoJSON entry
         */
        $count = count($localizedItems);
        if ($count > 0) {

            /*
             * Initiate an empty GeoJSON object
             */
            $geojson = array(
                'type' => 'FeatureCollection',
                'features' => array()
            );

            /*
             * Add one feature per localized item
             */
            for ($i = 0; $i < $count; $i++) {
                array_push($geojson['features'], $localizedItems[$i]);
            }

            /*
             * Save GeoJSON file
             */
            $fileName = saveFile(json_encode($geojson), MSP_UPLOAD_DIR . $random . ".json");
            if ($fileName) {
                $item = array(
                    'url' => MSP_GETFILE_URL . $random . ".json" . $stream,
                    'type' => "Photography",
                    'id' => "---",
                    'extras' => array(
                        'hasIconAttribute' => true,
                        'title' => 'Photography#' . $random
                    )
                );
                array_push($items, $item);
            }
        }
    }

    /*
     * Upload is successfull
     */
    if (count($items) > 0) {

        $json = array(
            'items' => $items
        );
        echo json_encode($json);
    }
    /*
     * Error during upload
     */ else {
        $json = array(
            'error' => array(
                'message' => $error
            )
        );
        echo json_encode($json);
    }
}
?>