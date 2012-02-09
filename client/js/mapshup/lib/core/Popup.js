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
 * mapshup Popup
 */
(function (msp) {

    msp.Popup = function (options) {

        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * Function callback called after popup is removed
         */
        this.callback = options.callback || null;
        
        /*
         * True to expand popup size to full window size
         */
        this.expand = options.hasOwnProperty("expand") ? options.expand : false;
        
        /*
         * True to hide popup when closing it instead of remove it
         */
        this.hideOnClose = msp.Util.getPropertyValue(options, "hideOnClose", false);
        
        /*
         * True to set this popup modal.
         * 
         * "In user interface design, a modal window is a child window
         * that requires users to interact with it before they can return
         * to operating the parent application"
         * http://en.wikipedia.org/wiki/Modal_window
         * 
         */
        this.modal = options.hasOwnProperty("modal") ? options.modal : false;
        
        /*
         * True to not set a popup header
         */
        this.noHeader = options.hasOwnProperty("noHeader") ? options.noHeader : false;
        
        /*
         * True to automatically resize popup on window size change
         */
        this.resize = options.hasOwnProperty("resize") ? options.resize : true;
        
        /*
         * Close button css modifier
         */
        this.cssClose = options.cssClose || {
            'top':'0px',
            'right':'0px'
        };
        
        /*
         * Parent scope for callback
         */
        this.scope = options.scope || this;
        
        /*
         * Initialize Popup object
         */
        this.init = function() {
            
            var h,
                id = msp.Util.getId(),
                self = this;
            
            /*
             * Set an empty modal mask
             */
            self.$m = $();
            
            /*
             * If popup if modal, set a semi transparent mask
             * under the popup
             */
            if (self.modal) {
                self.$m = msp.Util.$$('#modmask',msp.$container)
                .addClass("mask")
                .css(
                {
                    'position':'absolute',
                    'display':'none',
                    'left':'0',
                    'top':'0',
                    'width':'100%',
                    'height':'100%',
                    'z-index':'36000'
                });
            }
            
            /*
             * Popup structure
             * 
             * <div id="..." class="po">
             *      <div class="shadow">
             *          <div class="header"> // optional
             *          <div class="body">
             *      </div>
             *      <div class="close"></div>
             *  </div>
             */
            h = self.noHeader ? ''  : '<div class="header"></div>';
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$mcontainer).addClass('po').html('<div class="whole shadow">'+h+'<div class="body"></div></div>');

            /*
             * Expand popup or not expand ?
             */
            self.expand ? self.$d.addClass('poe') : self.$d.addClass('pone'); 
            
            /*
             * Set body and header reference
             */
            self.$b = $('.body', self.$d);
            self.$h = $('.header', self.$d);
            
            /*
             * Add a close button
             */
            self.$d.append('<div id="'+id+'" class="close"></div>');
            
            /*
             * Close window
             */
            $('#'+id).click(function() {
                self.hideOnClose ? self.hide() : self.remove();
            }).css(self.cssClose);
            
            /*
             * Compute popup position on window resize
             */
            msp.events.register("resizeend", self, function(scope) {
                scope.updatePosition(scope);
            });
            
            /*
             * Compute position on init
             */
            self.updatePosition(self);
            
            return self;
            
        };

        /*
         * Update position and size of div
         */
        this.updatePosition = function(scope) {
            
            var $c = msp.$container;
            
            /*
             * If window is not resizable, do nothing
             */
            if (!scope.resize) {
                return;
            }
            
            /*
             * Popup max height is equal to 50% of its container 
             */
            scope.$b.css({
                'max-height':Math.round(($c.height() - scope.$h.height()) / 2)
            });
            
            /*
             * Center the popup over its container 
             */
            scope.$d.css({
                'left': (($c.width() - scope.$d.width()) / 2 )
            });

        };
            
        /**
         * Hide popup
         */
        this.hide = function() {
            this.$d.hide();
            this.$m.hide();
        };
        
        /**
         * Remove popup
         */
        this.remove = function() {
            this.hide();
            if ($.isFunction(this.callback)) {
                this.callback(this.scope);
            }
            msp.remove(this);
        };
        
        /**
         * Show popup
         */
        this.show = function(a) {
            this.$d.show();
            this.$m.show();
        };

        /*
         * Initialize object
         */
        this.init();
        
        return this;
    }
    
    
})(window.msp);