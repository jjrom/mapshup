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
/*********************************************
 * PLUGIN: Navigation
 *
 * Add navigation tools
 * 
 *********************************************/
(function(msp) {
    
    msp.Plugins.Navigation = function() {
        
        /*
         * Only one Navigation object instance is created
         */
        if (msp.Plugins.Navigation._o) {
            return msp.Plugins.Navigation._o;
        }
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var pb,nb,tb,
            self = this;
            
            self.options = options || {};

            /*
             * Set options
             * Default toolbar is North East Vertical
             */
            $.extend(self.options, {
                home:msp.Util.getPropertyValue(self.options, "home", false),
                zoomin:msp.Util.getPropertyValue(self.options, "zoomin", true),
                zoomout:msp.Util.getPropertyValue(self.options, "zoomout", true),
                history:msp.Util.getPropertyValue(self.options, "history", true),
                limit:msp.Util.getPropertyValue(self.options, "limit", 10),
                position:msp.Util.getPropertyValue(self.options, "position", 'ne'),
                orientation:msp.Util.getPropertyValue(self.options, "orientation", 'v')
            });

            /*
             * Set the toolbar container
             */
            tb = new msp.Toolbar({
                position:self.options.position, 
                orientation:self.options.orientation
            });
            
            /*
             * Zoom in button
             */
            if (self.options.zoomin) {
                tb.add({
                    title:"+",
                    tt:"Zoom",
                    activable:false,
                    callback:function() {
                        msp.Map.map.setCenter(msp.Map.map.getCenter(), msp.Map.map.getZoom() + 1);
                    }
                });
            }

            /*
             * Zoom out button
             */
            if (self.options.zoomout) {
                tb.add({
                    title:"-",
                    tt:"Zoom out",
                    activable:false,
                    callback:function() {
                        msp.Map.map.setCenter(msp.Map.map.getCenter(), Math.max(msp.Map.map.getZoom() - 1, msp.Map.lowestZoomLevel));
                    }
                });
            }
            
            
            /*
             * Navigation history buttons
             */
            if (self.options.history) {
                
                /*
                 * Add previous item
                 */
                pb = tb.add({
                    title:"&laquo;",
                    tt:"Previous view",
                    activable:false,
                    callback:function() {
                        self.nh.previous();
                    }
                });
                
                /*
                 * "Pseudo" hide previous item
                 */
                pb.$d.addClass("inactive");
                
                /*
                 * Add next item
                 */
                nb = tb.add({
                    title:"&raquo;",
                    tt:"Next view",
                    activable:false,
                    callback:function() {
                        self.nh.next();
                    }
                });
                
                /*
                 * "Pseudo" hide next item
                 */
                nb.$d.addClass("inactive");
                
                /*
                 * Create an history object
                 */
                self.nh = (function(limit, pb, nb) {

                    /**
                     * Store navigation states for history
                     * 
                     * Structure of a state :
                     *   {
                     *      center,
                     *      resolution:,
                     *      projection:,
                     *      units:
                     *   }
                     * 
                     */
                    this.states = [];

                    /**
                     * Temporary navigation states for history
                     * 
                     * Structure of a state :
                     *   {
                     *      center,
                     *      resolution:,
                     *      projection:,
                     *      units:
                     *   }
                     * 
                     */
                    this.tmp = [];
                    
                    /**
                     * Current position in the history array
                     */
                    this.idx = 0;
                    
                    /**
                     * Maximum number of stored states (minimum is 2)
                     */
                    this.limit = Math.max(limit, 2);
                    
                    /**
                     * Previous item reference
                     */
                    this.pb = pb;
                    
                    /**
                     * Next item reference
                     */
                    this.nb = nb;
                    
                    /**
                     * Add a new extent in the history array
                     * 
                     * How ?
                     * 
                     * 1. First if states array is empty, add the first state
                     * 2. When a new state is given :
                     *      - if the state is identical to the current state then
                     *      the input state is discarded and function returns false.
                     *      This avoid duplicating storing of identical states
                     *      - if the state is not identical to the current state then :
                     *          a. if the position in the states array (idx) is the last
                     *          inserted then the state is added to the states and
                     *          the idx is set to the last position in the states array.
                     *          Eventually, if the limit of array size is reached, the
                     *          first element of the array is removed and as a consequence
                     *          the whole states array is shifted
                     *          b. otherwise, if the position in the states array is not
                     *          the last inserted then it's a bit tricky :)  
                     * 
                     * 
                     * @input state : state to be added to the navigation history (states) array
                     */
                    this.add = function(state) {
                        
                        var i,
                        self = this,
                        l = self.states.length,
                        k = self.tmp.length;
                        
                        /*
                         * Nothing is stored until mapshup is loaded
                         */
                        if (!msp.isLoaded) {
                            return false;
                        }
                            
                        /*
                         * First check that states array is not empty
                         */
                        if (l !== 0) {
                            
                            /*
                             * Avoid storing successive identical "history" extent
                             */
                            if (self.idx < l) {
                                if (state.center.equals(self.states[self.idx].center) && state.resolution === self.states[self.idx].resolution) {
                                    return false;
                                }
                            }
                        
                            /*
                             * idx is the not last inserted then join tmp array
                             * with states array
                             */
                            if (self.idx !== l - 1) {
                                
                                /*
                                 * Populate states array with tmp array states
                                 */
                                for (i = 0; i < k; i++) {

                                    self.states.push(self.tmp[i]);

                                    /*
                                     * Check that states size limit is not reached
                                     * otherwise discarded the first element
                                     */
                                    if (self.states.length > self.limit) {
                                        self.states.shift();
                                    }
                                }

                                /*
                                 * Clear tmp array
                                 */
                                self.tmp = [];
                            }
                        
                        }
                        
                        /*
                         * Add the input state at the end of the states array
                         */
                        self.states.push(state);
                        
                        /*
                         * If the array size reaches the limit,
                         * then removed the first array element
                         */
                        if (self.states.length > self.limit) {
                            self.states.shift();
                        }
                        
                        /*
                         * Set idx to the last array object
                         */
                        self.idx = self.states.length - 1;
                        
                        /*
                         * Hide the next item and show the previous one
                         */
                        self.showHide();
                        
                        return true;
                        
                    };
                    
                    /**
                     * Return the next extent in navigation history
                     */
                    this.next = function(){
                        
                        var self = this;
                        
                        /*
                         * Increment index
                         */
                        self.idx++;
                        
                        /*
                         * We did not reach the end of the array
                         * Then zoom to extent and store the state to the tmp array
                         */
                        if (self.idx < self.states.length) {
                            self.center(self.idx);
                        }
                        else {
                            self.idx = self.states.length - 1;
                        }
                        
                        /*
                         * Show/Hide next item
                         */
                        self.showHide();
                        
                    };

                    /**
                     * Return the previous extent in navigation history
                     */
                    this.previous = function() {
                        
                        var self = this;
                        
                        /*
                         * Decrement index
                         */
                        self.idx--;
                        
                        /*
                         * We did not reach the beginning of the array
                         * Then zoom to the state
                         */
                        if (self.idx >= 0) {
                            self.center(self.idx);
                        }
                        else {
                            self.idx = 0;
                        }
                        
                        /*
                         * Show/Hide previous button
                         */
                        self.showHide();
                        
                    };
                    
                    /**
                     * Set map to the navigation state defined by idx
                     */
                    this.center = function(idx) {
                        
                        var self = this,
                        s = self.states[idx];
                        
                        /*  
                         * Zoom to extent
                         */
                        msp.Map.map.setCenter(s.center, msp.Map.map.getZoomForResolution(s.resolution));
                            
                        /*
                         * Store the state to the tmp array
                         */
                        self.tmp.push(s);
                        
                        /*
                         * If the array size reaches the limit,
                         * then removed the first array element
                         */
                        if (self.tmp.length >= self.limit) {
                            self.tmp.shift();
                        }
                        
                    };
                    
                    /**
                     * Show/Hide next and previous item
                     */
                    this.showHide = function() {
                        
                        var self = this;
                        
                        /*
                         * Show/hide previous item
                         */
                        if (self.idx < 1) {
                            self.pb.$d.addClass('inactive');
                        }
                        else {
                            self.pb.$d.removeClass('inactive')
                        }
                        
                        /*
                         * Show/hide next item
                         */
                        if (self.idx >= self.states.length - 1) {
                            self.nb.$d.addClass('inactive');
                        }
                        else {
                            self.nb.$d.removeClass('inactive')
                        }
                        
                    };
                    
                    return this;

                })(self.options.limit, pb, nb);
                
                /*
                 * Register event - on map move, store the map extent in the states array
                 */
                msp.Map.events.register("moveend", self, function(map, scope) {
                    self.nh.add(msp.Map.getState());
                });
            }
            
            /*
             * Home button
             */
            if (self.options.home) {
                tb.add({
                    icon:"center.png",
                    tt:"Go back to the start view",
                    activable:false,
                    callback:function() {
                        var l = msp.Config["general"].location;
                        msp.Map.map.restrictedExtent ? msp.Map.map.zoomToExtent(msp.Map.map.restrictedExtent) : msp.Map.setCenter(msp.Map.Util.d2p(new OpenLayers.LonLat(l.lon,l.lat)), l.zoom, true);
                    }
                });
            }

            return this;

        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Navigation._o = this;
        
        return this;
    }
    
})(window.msp);