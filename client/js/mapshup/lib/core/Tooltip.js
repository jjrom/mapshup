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
 * Tooltip object
 */
(function (M) {

    /**
     * Create Tooltip object
     * 
     * @param {jquery DOM Element} domelement : jquery DOM Element containing a jtitle attribute
     * @param {String} direction : direction of tooltip ('n','s','e','w')
     */
    M.Tooltip = function () {
        
        /*
         * Only one Tooltip object instance is created
         */
        if (M.Tooltip._o) {
            return M.Tooltip._o;
        }
        
        /*
         * Initialization
         */
        this.init = function() {
            
            /*
             * jTooltip div reference
             */
            this.$t = M.Util.$$('#tooltip');

            /*
             * Reference to the current element
             */
            this.c = null;
            
        };
       
        /**
         * Add a tooltip
         * 
         * @param {jquery DOM Element} domelement : jquery DOM Element containing a jtitle attribute
         * @param {String} direction : direction of tooltip ('n','s','e','w')
         * @param {integer} offset : offset in pixel to add
         */
        this.add = function(domelement, direction, offset) {
        
            var self = this;
            
            offset = offset || 0;
            
            /*
             * Add events on domelement for non touch device
             */
            if (!M.Util.device.touch) {

                domelement.hover(function(){

                    var domelement = $(this);

                    /*
                     * Paranoid mode
                     */
                    if (!domelement) {
                        return;
                    }

                    /*
                     * Set __currentdomelement
                     */
                    self.c = self.c || [""];

                    /*
                     * Optimization rules !
                     */
                    if (domelement[0] === self.c[0]) {
                        return;
                    }

                    /*
                     * Store the domelement
                     */
                    self.c = domelement;

                    /*
                     * Set tooltip content
                     */
                    self.$t.html('<div class="inner">'+domelement.attr("jtitle")+'</div>');

                    /*
                    * Compute tooltip position
                    */
                    var actualWidth = self.$t.width(),
                    actualHeight = self.$t.height(),
                    pos = {
                        top:domelement.offset().top,
                        left: domelement.offset().left,
                        width: domelement.width(),
                        height: domelement.height()
                    };

                    switch (direction) {
                        case 'n':
                            self.$t.css({
                                top: pos.top + pos.height + 5 + offset,
                                left: pos.left + pos.width / 2 - actualWidth / 2
                            });
                            break;
                        case 's':
                            self.$t.css({
                                top: pos.top - actualHeight - 20 - offset,
                                left: pos.left + pos.width / 2 - actualWidth / 2
                            });
                            break;
                        case 'e':
                            self.$t.css({
                                top: pos.top + pos.height / 2 - actualHeight / 2,
                                left: pos.left - actualWidth - 10 - offset
                            });
                            break;
                        case 'w':
                            self.$t.css({
                                top: pos.top + pos.height / 2 - actualHeight / 2,
                                left: pos.left + pos.width + 10 + offset
                            });
                            break;
                        case 'nw':
                            self.$t.css({
                                top: pos.top + pos.height + 5 + offset,
                                left: pos.left
                            });
                            break;
                    }

                    self.$t.show();

                }, function(){
                    self.remove();
                });
            }
           
        }
        
        /*
         * Remove tooltip
         */
        this.remove = function() {
            this.$t.hide();
            this.c = null;
        }
        
        /*
         * Initialize object
         */
        this.init();
        
        /*
         * Create unique instance
         */
        M.Tooltip._o = this;
        
        return this;
        
    }
    
})(window.M);