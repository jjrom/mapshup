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
 * mapshup information panel
 */
(function (msp) {

    msp.Panel = function (options) {
        
        /*
         * Paranoid mode
         */
        options = options || {};
        
        /**
         * Panel height
         */
        this.h = options.h;
        
        /**
         * Padding
         */
        this.padding = {
            left:10,
            right:10
        };
        
        /**
         * Number of pixels from the top of the map to display the panel
         */
        this.top = msp.Util.getPropertyValue(options, "top", 20);
        
        /**
         * Panel width
         */
        this.w = msp.Util.getPropertyValue(options, "w", 320);
        
        /*
         * Callback function when panel is hidden
         */
        this.onclose = options.onclose;
        
        /*
         * Callback function when panel is shown
         */
        this.onshow = options.onshow;
        
        /*
         * Panel visibility
         */
        this.isVisible = false;
        
        /**
         * Panel initialisation
         */
        this.init = function() {
            
            var self = this;
            
            /*
             * Add map header height to top value
             */
            self.top += msp.$header.height();
 
            /*
             * Create a Panel div within msp.$container
             * 
             * Structure :
             *  <div class="pn"></div>
             *  
             * At initialization, the width is set and the panel is hidden
             */
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$container).addClass('pn').css({
                    'width':self.w + 'px',
                    'height':self.h ? self.h + 'px' : 'auto'
            }).hide();
            
            /*
             * Set the content object
             */
            self.$content = msp.Util.$$('#'+msp.Util.getId(), self.$d).css({
                'padding':'0px '+self.padding.right+'px 0px '+self.padding.left+'px'
            });
                
            /*
             * Panel width and height follow the width of the map 
             */
            msp.Map.events.register("resizeend", self, self.resize);
            
            return self;
            
        };

        /*
         * Resize panel
         */
        this.resize = function(scope) {
            
            if (scope.isVisible) {
                
                /*
                 * First is to compute panel height if it is not fixed
                 * 
                 * The maximum height is equal to the height of the map
                 * minus the top position and a margin of 50 pixels
                 */
                if (!scope.h) {
                    scope.$d.css({
                        'max-height':msp.$container.height() - scope.top - 50
                    })
                }

                /*
                 * Object with an 'expdbl' class have their height constrained
                 * by the panel height
                 */
                $('.expdbl', scope.$d).each(function(idx){
                
                    var $c = $(this);

                    /*
                     * Tricky part...This is awfull.
                     * 
                     * I really don't know how to do differently
                     * 
                     * 1. First set '.expdbl' class height to auto
                     * so the parent height can be computed (otherwise the height would be
                     * incorrectly computed).
                     * 2. Wait 1 ms
                     * 3. Then force the '.expdbl' class height relatively to
                     * the parent height
                     */
                    $c.css('height', 'auto');
                
                    setTimeout(function(){
                        $c.css('height', scope.$d.height() - $c.position().top);
                    }, 1);
                
                });
         
            }
        };
        
        /**
         * Add content to the panel
         * 
         * @input content : html content (optional)
         * @input classes : class name(s) to add to main item div (optional)
         * 
         * @return $d : jquery object reference of the created div
         */
        this.add = function(content, classes) {
            
            var self = this;
            
            /*
             * Set content if specified
             */
            self.$content.html('<div id="'+msp.Util.getId()+'" style="'+'width:'+(self.w - self.padding.left - self.padding.right)+'px;'+'"'+(classes ? ' class="'+classes+'"' : '')+'>'+(content || "")+'</div>');
            
            /*
             * Return the newly created item
             */
            return self.$content;
        };
        
        /*
         * Show the panel
         */
        this.show = function() {
            
            var self = this;
            
            /*
             * Show panel
             */
            self.$d.show();
            
            /*
             * Call onshow function if defined
             */
            if (!self.isVisible) {
            
                /*
                 * If onshow callback function is defined, call it
                 */
                if ($.isFunction(self.onshow)) {
                    self.onshow(self.scope);
                }
            
            }
            
            /*
             * Set the visible status to true
             */
            self.isVisible = true;
            
            /*
             * Compute the .expdbl class height
             */
            self.resize(self);
            
            return true;
            
        }
        
        /*
         * Hide the panel
         */
        this.hide = function() {
            
            var self = this;
            
            /*
             * Call onclose function if defined
             */
            if (self.isVisible) {
            
                /*
                 * If onshow callback function is defined, call it
                 */
                if ($.isFunction(self.onclose)) {
                    self.onclose(self.scope);
                }
            
            }
            
            /*
             * Hide the panel
             */
            self.$d.hide();
            
            /*
             * Set visible status to false
             */
            self.isVisible = false;
            
            return true;
            
        };
        
        /*
         * Properly clear panel jquery references
         * Should be call to force garbage collection
         */
        this.remove = function() {
            var self = this;
            self.$content.remove();
            self.$d.remove();
            delete self.$content;
            delete self.$d;
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };
})(window.msp);