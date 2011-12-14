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
 * A class to read Exif tags within jpeg images
 * This class is inspired by
 * http://www.quietless.com/kitchen/extract-exif-data-using-php-to-display-gps-tagged-images-in-google-maps/
 * 
 */
class ExifReader {

    public function __construct() {

    }

    /**
     * Returns the EXIF data object of a single image
     */
    public function readImage($image) {
        $exif = exif_read_data($image, 0, true);
        if ($exif) {
            return $this->getFeature($exif);
        } else {
            return null;
        }
    }

    /**
     * Returns GPS latitude & longitude as decimal values
     * */
    private function getDate($exif) {
        return $exif['EXIF']['DateTimeOriginal'];
    }

    /**
     *  Return a GeoJSON feature
     */
    private function getFeature($exif) {

        $gps = $this->getGPS($exif);
        if ($gps != null) {
            return array(
                'type' => 'Feature',
                'geometry' => $this->pointToGeoJSONGeometry($gps[1], $gps[0]),
                'crs' => array(
                    'type' => 'EPSG',
                    'properties' => array('code' => '4326')
                ),
                'properties' => $this->getProperties($exif)
            );
        } else {
            return null;
        }
    }

    /**
     * Returns GPS latitude & longitude as decimal values
     */
    private function getGPS($exif) {
        if (!isset($exif['GPS'])) {
            return null;
        }
        $lat = $exif['GPS']['GPSLatitude'];
        $lng = $exif['GPS']['GPSLongitude'];
        if (!$lat || !$lng) {
            return null;
        }
        /*
         * Compute latitude values
         */
        $lat_degrees = $this->divide($lat[0]);
        $lat_minutes = $this->divide($lat[1]);
        $lat_seconds = $this->divide($lat[2]);
        $lat_hemi = $exif['GPS']['GPSLatitudeRef'];

        /*
         * Compute longitude values
         */
        $lng_degrees = $this->divide($lng[0]);
        $lng_minutes = $this->divide($lng[1]);
        $lng_seconds = $this->divide($lng[2]);
        $lng_hemi = $exif['GPS']['GPSLongitudeRef'];

        $lat_decimal = $this->toDecimal($lat_degrees, $lat_minutes, $lat_seconds, $lat_hemi);
        $lng_decimal = $this->toDecimal($lng_degrees, $lng_minutes, $lng_seconds, $lng_hemi);

        return array($lat_decimal, $lng_decimal);
    }

    /**
     * Return EXIF properties
     */
    private function getProperties($exif) {
        return array(
            'date' => $this->getDate($exif)
        );
    }

    private function toDecimal($deg, $min, $sec, $hemi) {
        $d = $deg + $min / 60 + $sec / 3600;
        return ($hemi == 'S' || $hemi == 'W') ? $d*= - 1 : $d;
    }

    private function divide($a) {
        // evaluate the string fraction and return a float //
        $e = explode('/', $a);
        // prevent division by zero //
        if (!$e[0] || !$e[1]) {
            return 0;
        } else {
            return $e[0] / $e[1];
        }
    }

    /**
     * Return GeoJSON point geometry from $lon lat
     * @param <float> $lon : longitude
     * @param <float> $lat : latitude
     */
    private function pointToGeoJSONGeometry($lon, $lat) {
        $geometry = array(
            'type' => 'Point',
            'coordinates' => array($lon, $lat)
        );

        return $geometry;
    }

}
?>