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
 * @requires OpenLayers/Strategy/Cluster.js
 */

/**
 * Class: OpenLayers.Strategy.PolygonCluster
 * Strategy for polygonal vector features clustering.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.PolygonCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {
    /**
     * Method: cluster
     * Cluster features based on some threshold distance.
     *
     * @param {Object} event : The event received when cluster
     *                         is called as a result of a moveend event.
     */
    cluster: function(event) {
        if ((!event || event.zoomChanged || (event && event.recluster)) && this.features) {
            var resolution = this.layer.map.getResolution();
            if (resolution !== this.resolution || !this.clustersExist() || (event && event.recluster)) {
                this.resolution = resolution;
                var clusters = [];
                var feature, clustered, cluster;
                for (var i = 0; i < this.features.length; ++i) {
                    feature = this.features[i];
                    
                    /*
                     * OpenLayers issue ? 
                     * Some feature have a null layer which cause serious trouble
                     * to mapshup...:( 
                     */
                    if (!feature.layer) {
                        feature.layer = this.layer;
                    }
                
                    if (feature.geometry) {
                        clustered = false;
                        for (var j = clusters.length - 1; j >= 0; --j) {
                            cluster = clusters[j];
                            if (this.shouldCluster(cluster, feature)) {
                                this.addToCluster(cluster, feature);
                                clustered = true;
                                break;
                            }
                        }
                        if (!clustered) {
                            clusters.push(this.createCluster(this.features[i]));
                        }
                    }
                }
                this.layer.removeAllFeatures();
                if (clusters.length > 0) {
                    if (this.threshold > 1) {
                        var clone = clusters.slice();
                        clusters = [];
                        var candidate;
                        for (var i = 0, len = clone.length; i < len; ++i) {
                            candidate = clone[i];
                            if (candidate.attributes.count < this.threshold) {
                                Array.prototype.push.apply(clusters, candidate.cluster);
                            } else {
                                clusters.push(candidate);
                            }
                        }
                    }
                    this.clustering = true;
                    // A legitimate feature addition could occur during this
                    // addFeatures call.  For clustering to behave well, features
                    // should be removed from a layer before requesting a new batch.
                    this.layer.addFeatures(clusters);
                    if (this.layer['_M']) {
                        this.layer['_M'].clusterType = "Polygon";
                    }
                    this.clustering = false;
                }
                this.clusters = clusters;
            }
        }
    },
    /**
     * Method: recluster
     * User-callable function to recluster features
     * Useful for instances where a clustering attribute (distance, threshold, ...) has changed
     */
    recluster: function() {
        var event = {"recluster": true};
        this.cluster(event);
    },
    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     *  @param {<OpenLayers.Feature.Vector>} cluster
     *  @param {<OpenLayers.Feature.Vector>} feature
     *
     *  @return The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature) {
        var cb = cluster.geometry.getBounds();
        var fb = feature.geometry.getBounds();
        if (!cb || !fb) {
            return false;
        }
        return cb.equals(fb);
    },
    /**
     * Method: createCluster
     * Given a feature, create a cluster.
     *
     * @param {<OpenLayers.Feature.Vector>} feature
     *
     * @return {<OpenLayers.Feature.Vector>} A cluster.
     */
    createCluster: function(feature) {
        var geom = feature.geometry.getBounds().toGeometry();
        var cluster = new OpenLayers.Feature.Vector(
                geom,{count: 1}
        );
        cluster.cluster = [feature];
        return cluster;
    },
    /**
     * Method: addToCluster
     * Add a feature to a cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     */
    addToCluster: function(cluster, feature) {
        cluster.cluster.push(feature);
        cluster.attributes.count += 1;
    },
    CLASS_NAME: "OpenLayers.Strategy.PolygonCluster"
});