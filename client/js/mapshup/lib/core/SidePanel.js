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
 * Mapshup Side Panel
 * 
 * A side panel is a panel displayed at the left or right border of the Map
 * It pushes the map to the right or the left depending on its position
 */
(function(M) {

    M.SidePanel = function(options) {

        /*
         * Paranoid mode
         */
        options = options || {};

        /*
         * Panel width
         */
        this.w = M.Util.getPropertyValue(options, "w", 400);

        /**
         * Panel initialisation
         */
        this.init = function() {

            var self = this;

            /*
             * mapshup can have one and only one SidePanel
             * 
             * If an already initialized panel is requested then
             * it is returned instead of creating a new one
             *
             */
            if (M.SidePanel._o) {
                return M.SidePanel._o;
            }

            /*
             * Create a Panel div within M.$container
             * 
             * <div id="..." class="spn"></div>
             */
            self.$d = M.Util.$$('#' + M.Util.getId(), M.$container).addClass('spn').css({
                'right': -self.w,
                'height': '100%',
                'width': self.w
            });
        
            /*
             * Set a SidePanel reference
             */
            M.SidePanel._o = self;

            return self;

        };

        /**
         * Show the panel
         */
        this.show = function() {

            var self = this;

            /*
             * Set panel visibility
             */
            if (self.isVisible) {

                /*
                 * Panel is already shown
                 */
                return false;

            }

            /*
             * Show panel
             */
            self.$d.stop().animate({
                'right': 0
            },
            {
                duration: 200,
                queue: true,
                step: function(now, fx) {
                    M.$container.css('left', - now - self.w);
                },
                complete: function() {
                    M.Map.map.updateSize();
                }
            });

            /*
             * Set the visible status to true
             */
            self.isVisible = true;

            return true;

        };

        /*
         * Hide the panel
         */
        this.hide = function() {

            var self = this;

            /*
             * If Panel is not visible do nothing
             */
            if (!self.isVisible) {
                return false;
            }

            /*
             * Set visible status to false
             */
            self.isVisible = false;

            self.$d.stop().animate({
                'right': -self.w
            },
            {
                duration: 200,
                queue: true,
                step: function(now, fx) {
                    M.$container.css('left', - now - self.w);
                },
                complete: function() {
                    M.Map.map.updateSize();
                }
            });

            return true;

        };

        /*
         * Initialize object
         */
        return this.init();

    };
})(window.M);