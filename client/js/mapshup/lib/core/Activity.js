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
 * mapshup Activity object
 */
(function(msp) {
    
    
    msp.Activity = function() {
        
        /*
         * Only one Activity object instance is created
         */
        if (msp.Activity._o) {
            return msp.Activity._o;
        }
        
        /**
         * Timer identifier
         */
        this.timer = 1;

        /**
         * Activity.png icon is made of 12 frames
         * from 1 to 12. Each frame is 40px height
         */
        this.frame = 1;
        
        /*
         * Hide activity div
         */
        this.hide = function() {
            this.$a.hide();
        };
         
        this.init = function() {
            
            var scope = this;
            
            /*
             * Set the container
             */
            this.$c = msp.$container;
            
            /*
             * Create activity div
             */
            this.$a = msp.Util.$$('#activity', this.$c).css(
            {
                'display':'none',
                'position':'fixed',
                'top':'50%',
                'left':'50%',
                'width':'40px',
                'height':'40px',
                'margin-top':'-20px',
                'margin-left':'0px',
                'overflow':'hidden',
                'z-index':'37000'
            }).html('<div></div>')
            
            /*
             * Set div content
             */
            this.$a.children().css({
                'position':'absolute',
                'top':'0',
                'left':'0',
                'width':'40px',
                'height':'480px',
                'background-image': "url('"+msp.Util.getImgUrl('activity.png')+"')" 
            });
            
            /*
             * Add event on resize
             */
            msp.events.register("resizeend", this, function(scope) {
                scope.$a.css({
                    'top': scope.$c.offset().top + (scope.$c.height() - scope.$a.height()) / 2,
                    'left': scope.$c.offset().left + (scope.$c.width() - scope.$a.width()) / 2
                });
            });
            
        };
    
        /*
         * Show activity div
         */
        this.show = function() {

            var self = this;
            
            /*
             * Remove timer
             */
            clearInterval(this.timer);

            /*
             * Show Activity icon
             */
            this.$a.show();
            
            /*
             * Respawn a timer of 66 ms
             */
            this.timer = setInterval(function() {

                /*
                 * If #activity is hidden, remove the timer
                 */
                if (!self.$a.is(':visible')){
                    clearInterval(self.timer);
                    return;
                }

                /*
                 * Iterate through Activity.png frames.
                 * Activity.png is made of 12 frames with a height of 40px
                 */
                $('div', self.$a).css('top', (self.frame * -40) + 'px');
                self.frame = (self.frame + 1) % 12;
            }, 66);
        };
        
        /*
         * Initialize object
         */
        this.init();
        
        /*
         * Create unique instance
         */
        msp.Activity._o = this;
        
        return this;
        
    }
    
})(window.msp);