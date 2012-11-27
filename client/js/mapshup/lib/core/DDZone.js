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
 * Define a Drag&Drop zone
 */
(function (M) {
   
    M.DDZone = function(options) {

        /**
         * Zone reference
         */
        this.$d = [];
        
        /**
         * Dropped file reference
         */
        this.file = null;
        
        /**
         * Dropped file url
         */
        this.fileUrl = null;
        
        /**
         * Drag&Drop zone width
         */
        this.width = 'auto';
        
        /**
         * Drag&Drop zone height
         */
        this.height = 'auto';
        
        /**
         * Supported format
         * 
         * Array of object. Structure
         * 
         *      {
         *          mimeType: //
         *          encoding: //
         *          schema: //
         *      },
         * 
         */
        this.supportedFormats = [];
        
        /**
         * True to allow user to drop both file and url
         */
        this.allowUrl = true;
        
        /**
         * Maximum droped file size in Megabytes
         */
        this.maximumMegabytes = 5;
        
        /*
         * DDZone initialization
         * 
         * @param {Object} options
         */
        this.init = function(options) {
            
            var self = this;
            
            /*
             * Create a Drag&Drop zone under parent
             */
            this.$d = M.Util.$$('#'+M.Util.getId(), options.parent)
            .addClass('ddzone')
            .css({
                'min-height':'50px',
                width:options.width || this.width,
                height:options.height || this.height
            });
            
            /*
             * Only allow to drag files with a supported format and a 
             * size lower than the maximumMegabytes limit
             */
            this.supportedFormats = options.supportedFormats || this.supportedFormats;
            this.maximumMegabytes = options.maximumMegabytes || this.maximumMegabytes;
            this.title = options.title || "Drop file here";
            
            /*
             * Set file reference if one is already specified
             */
            this.file = options.file;
            this.fileUrl = options.fileUrl;
            
            /*
             * Callback functions
             */
            if ($.isFunction(options.success)) {
                this.success = options.success;
            }
            if ($.isFunction(options.error)) {
                this.error = options.error;
            }
            
            /*
             * Set HTML content
             */
            this.setContent();
            
            /*
             * Bind Drag&Drop events to the DD zone
             */
            this.$d.bind('dragleave',
                function(e) {
                    self.$d.removeClass('ddhover');
                    e.preventDefault();
                    e.stopPropagation();
                });

            this.$d.bind('dragover',
                function(e) {
                    self.$d.addClass('ddhover');
                    e.preventDefault();
                    e.stopPropagation();
                });

            this.$d.bind('drop',
                function(e) {

                    self.$d.removeClass('ddhover');

                    /*
                    * Stop events
                    */
                    e.preventDefault();
                    e.stopPropagation();

                    /*
                    * HTML5 : get dataTransfer object
                    */
                    var url, files = e.originalEvent.dataTransfer.files;

                    /*
                    * If there is no file, we assume that user dropped
                    * something else...a url for example !
                    */
                    if (files.length === 0 && self.allowUrl) {
                        url = e.originalEvent.dataTransfer.getData('Text');
                        if (M.Util.isUrl(url)) {
                            self.fileUrl = url;
                            
                            /*
                             * Refresh popup content
                             */
                            self.setContent();
                            self.success({
                                fileUrl:self.fileUrl
                            });
                            
                        }
                    }
                    else if (files.length > 1) {
                        M.Util.message(M.Util._("Error : drop only one file at a time"));
                    }
                    else if (!M.Util.isSupportedMimeType(self.supportedFormats, files[0].type)) {
                        M.Util.message(M.Util._("Error : mimeType is not supported")+ ' ['+files[0].type+']');
                    }
                    else if (files[0].size/1048576 > self.maximumMegabytes) {
                        M.Util.message(M.Util._("Error : file is to big"));
                    }
                    /*
                    * User dropped a valid file
                    */
                    else {
                        self.file = files[0];
                        
                        /*
                         * Refresh popup content
                         */
                        self.setContent();
                    
                        self.success({
                            file:self.file
                        });
                    }
                    
                });
            
        };
        
        /**
         * Get file size in Megabytes
         */
        this.getSize = function() {
            return this.file ? this.file.size/1048576 : 0; 
        };
        
        /**
         * Set Drag&Drop zone HTML content
         */
        this.setContent = function() {
            
            var i, l = this.supportedFormats.length;
            
            /*
             * If file or url had been dropped - show file info
             */
            if (this.file) {
                this.$d.html(this.file.name+'<br/><p class="smaller">'+M.Util._("Size")+': '+this.getSize()+'MB</p>');
            }
            else if (this.fileUrl){
                this.$d.html(this.fileUrl);
            }
            else {
                
                /*
                 * A simple title by default...
                 */
                this.$d.html(this.title);

                /*
                 * ...followed by all droppable supported formats
                 */
                if (l > 0) {
                    this.$d.append('<br/><p class="smaller bold">'+M.Util._("Supported mimeTypes")+'</p>');
                    for (i = 0; i < l; i++) {
                        this.$d.append('<font class="smaller">'+this.supportedFormats[i].mimeType+'</font>  ');
                    }
                }
            }
            
        };
        
        /*
         * Create unique object instance
         */
        this.init(options);

        return this;

    }
    
})(window.M);
