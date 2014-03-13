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
 * Plugin ACAcIA
 *
 * Assisted Classification of eArth observation ImAges
 * 
 * @param {MapshupObject} M
 *
 */
(function(M) {

    M.Plugins.ACAcIA = function() {

        /*
         * Only one Acacia object instance is created
         */
        if (M.Plugins.ACAcIA._o) {
            return M.Plugins.ACAcIA._o;
        }
        
        /*
         * Classification process descriptor
         */
        this.classificationDescriptor = null;

        /*
         * Initialization
         */
        this.init = function(options) {

            var wps, self = this;

            /*
             * init options
             * 
             *      url: // Endpoint to OTB Web Processing Service
             *      processId: // WPS unique identifier for the OTB SVM classification process
             *      classes: // array of classification classes object
             *                  Structure of classification class object is 
             *                      {
             *                          className: // Name of the class (e.g. "Water")
             *                          classNumber: // Identifier of the class (e.g. "1")
             *                      }
             *      callback : // function to be called each time segmentation process is updated               
             */
            self.options = options || {};

            /*
             * Retrieve Classification description from server
             */
            if (self.options.url && self.options.processId) {

                /*
                 * Create a wps object
                 */
                wps = new M.WPS(self.options.url);

                /*
                 * Register GetCapabilites event
                 */
                wps.events.register("getcapabilities", this, function(scope, wps) {
                    wps.describeProcess({
                        identifier:scope.options.processId,
                        callback:scope.options.callback
                    });
                });

                /*
                 * Register DescribeProcess event
                 */
                wps.events.register("describeprocess", this, function(scope, descriptors) {
                    if ($.isArray(descriptors) && descriptors[0]) {

                        /*
                         * Store Process description
                         */
                        scope.classificationDescriptor = descriptors[0];

                        /*
                         * Add "Classify" item in menu
                         */
                        if (M.menu) {
                            M.menu.add([{
                                    id: M.Util.getId(),
                                    ic: "classify.png",
                                    ti: "Classify",
                                    cb: function() {
                                        self.showInfoPopup();
                                    }
                                }]);
                        }

                        /*
                         * Set a classes layer
                         */
                        self.classesLayer = new OpenLayers.Layer.Vector(M.Util.getId(), {
                            projection: M.Map.pc,
                            displayInLayerSwitcher: false,
                            styleMap: new OpenLayers.StyleMap({
                                'default': {
                                    pointRadius: 5,
                                    fillOpacity: 0.2,
                                    fillColor: 'darkgray',
                                    strokeColor:"#000",
                                    strokeWidth:1,
                                    label:"${className}",
                                    fontSize:15,
                                    fontColor:"#F00",
                                    fontStrokeColor:"#F00",
                                    fontStrokeWidth:0
                                }
                            })
                        });

                        /**
                         * Add ACAciA layer to Map object
                         */
                        M.Map.addLayer({
                            type: "Generic",
                            title: "ACAciA",
                            unremovable: true,
                            MLayer: true,
                            layer: self.classesLayer
                        });

                        /**
                         * Event on sketchcomplete
                         */
                        self.classesLayer.events.on({
                            "sketchcomplete": function(event) {
                                self.askForClassName(self, event);
                            }
                        });

                        /*
                         * Add ACAciA control to mapshup map
                         */
                        M.Map.map.addControl(new OpenLayers.Control.DrawFeature(self.classesLayer, OpenLayers.Handler.Polygon, {
                            id: "__CONTROL_ACACIA__"
                        }));

                        /*
                         * Register layersend event
                         */
                        M.Map.events.register("layersend", self, function(action, layer, scope) {

                            /*
                             * Each time a layer is added make sure Drawing layer is on top
                             */
                            if (action === "add" && scope.classesLayer) {
                                M.Map.Util.setLayerOnTop(scope.classesLayer);
                            }

                        });

                    }
                });

                /*
                 * Register Execute event
                 */
                wps.events.register("execute", this, function(scope, process) {
                    
                    /*
                     * Segmentation process
                     */
                    if (process.descriptor.identifier !== scope.options.processId) {
                        return false;
                    }
                
                   /*
                    * ProcessAccepted
                    *  => add a new process to the asynchronous manager
                    */
                    if (process.statusLocation && process.status === "ProcessAccepted") {
                        return M.apm ? M.apm.add(process) : null;
                    }
                    /*
                     * Asynchronous case - Bad implementation case
                     * 
                     * This case occurs when statusLocation attribute is not repeated within the
                     * process response located at statusLocation
                     */
                    else if (process.status === "ProcessStarted") {
                        return M.apm ? M.apm.update(process) : null;
                    }
                    /*
                     * Process failed - the very easy part :)
                     */
                    else if (process.status === "ProcessFailed") {
                        M.Util.message(process.descriptor.title + " : " + M.Util._("Process failed") + " - " + process.statusAbstract);
                        return false;
                    }

                    return M.apm ? M.apm.update(process) : null;

                });
            
                /*
                 * Retrieve Capabilities
                 */
                wps.getCapabilities();

            }

            return self;

        };

        /**
         * Show ACAcIA popup
         * 
         */
        this.showInfoPopup = function() {

            var self = this;

            if (!self.infoPopup) {

                var id = M.Util.getId(), inputImageDescriptor = self.classificationDescriptor.getInputDescription(self.options.inputImageId);

                self.infoPopup = new M.Popup({
                    modal: false,
                    centered: false,
                    noHeader: true,
                    hideOnClose: true,
                    autoSize: true,
                    unbounded: true,
                    onClose: function() {

                        /*
                         * Empty layer
                         */
                        self.clear();

                        /*
                         * Switch back to Map default control
                         */
                        M.Map.resetControl(self.control);
                        self.control = null;

                    },
                    body: '<span class="marged acacia">' + M.Util._("ACAcIA") + '&nbsp;&nbsp;<img class="hover middle" src="' + M.Util.getImgUrl('upload.png') + '" id="' + id + 'u" title="' + M.Util._("Set image url to classify") + '"/>&nbsp;&nbsp;<a href="#" class="button inline" id="' + id + '">' + M.Util._("Draw classes") + '</a>&nbsp;&nbsp;<a href="#" class="button inline" id="' + id + 'c">' + M.Util._("Clear") + '</a>&nbsp;&nbsp;<a href="#" class="button validate inline" id="' + id + 'p">' + M.Util._("Process") + '</a></span>'
                });
            
                /*
                 * Ask for value on click
                 */
                $('#' + id + "u")
                        .removeClass('hilite')
                        .addClass('warning')
                        .click(function(e) {

                    M.Util.askFor({
                        title: inputImageDescriptor.title,
                        dataType: "complexData",
                        defaultFormat: inputImageDescriptor.complexData["default"],
                        supportedFormats: inputImageDescriptor.complexData.supported,
                        upload: true, // Upload data to server to get a fileURL
                        callback: function(data) {

                            /*
                             * Data can only a file url since "upload" is set to true
                             * Store the fileUrl to object imageToClassifyUrl property
                             */
                            if (data.fileUrl) {
                                $('#' + id + "u").attr('title', data.fileUrl).addClass('hilite').removeClass('warning');
                                self.imageToClassifyUrl = data.fileUrl;
                            }

                        }
                    });

                    return false;
                });

                /*
                 * Draw classes action
                 */
                $('#' + id).click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self.drawClasses();
                    return false;
                });

                /*
                 * Clear classes action
                 */
                $('#' + id + 'c').click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self.clear();
                    return false;
                });

                /*
                 * Process layer
                 */
                $('#' + id + 'p').click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self.process();
                    self.infoPopup.hide();
                });

            }

            /*
             * Display popup
             */
            self.infoPopup.show();
            self.infoPopup.moveTo({
                x: M.$map.width() - self.infoPopup.$d.width() / 2 - 100,
                y: 5
            });

            return;

        };

        /**
         * Enter drawing classes mode
         */
        this.drawClasses = function() {

            var self = this;

            /*
             * First reset control
             */
            M.Map.resetControl(self.control);

            /*
             * Set active control to 'type' control
             */
            self.control = M.Map.Util.getControlById("__CONTROL_ACACIA__");

            if (self.control) {
                self.control.activate();
            }

        };

        /**
         * Function called when a feature is added
         * 
         * @param {Object} scope (this object)
         * @param {Object} event
         * 
         */
        this.askForClassName = function(scope, event) {

            /*
             * Show mask
             */
            M.mask.show(true);

            /*
             * Ask user description of newly created feature
             */
            var i, l, $s,
                id = M.Util.getId(),
                popup = new M.Popup({
                    modal: false,
                    centered: false,
                    noHeader: true,
                    autoSize: true,
                    followMap: false,
                    mapXY: event.feature.geometry.getBounds().getCenterLonLat(),
                    onClose: function() {
                        M.mask.hide();
                    },
                    body: '<form class="marged">What is it ?</br><span class="paddedleft"><select id="' + id + '"></select></span></br></br><div class="centered"><a href="#" class="button inline colored" id="' + id + 'ok">' + M.Util._("OK") + '</a></div></form>'
                });

            /*
             * Populate select form with classes described within the plugin options
             * (see configuration file)
             */
            $s = $('#' + id);

            for (i = 0, l = this.options.classes.length; i < l; i++) {
                (function($s, o) {
                    $s.append('<option cname="' + o.className + '" value="' + o.classNumber + '">' + o.className + '</option>');
                })($s, this.options.classes[i]);
            }

            /*
             * Select first class by default
             */
            $('option:first-child', $s).attr("selected", "selected");

            popup.show();

            /*
             * Store class value
             */
            $('#' + id + 'ok').click(function() {
                var f = event.feature;
                if (f) {
                    
                    /*
                     * Set className and classNumber properties to feature
                     * to send these values to the processing service
                     */
                    f.attributes.className = $(':selected', $s).attr("cname");
                    f.attributes.classNumber = $s.val();
                    
                    /* Redraw feature to update label with className value */
                    f.layer.drawFeature(f);
                    
                }
                if (popup) {
                    popup.remove();
                }
                M.mask.hide();
                return false;
            });

            return;

        };

        /*
         * Clear drawing layer
         */
        this.clear = function() {
            this.classesLayer.destroyFeatures();
        };

        /**
         * Launch asynchronous process classification
         * 
         * Process status could be one of the following :
         * 
         *      ProcessAccepted
         *      ProcessStarted
         *      ProcessPaused
         *      ProcessSucceeded
         *      ProcessFailed
         *      
         * @param {Object} options : options
         *                      {
         *                          parentId: // Unique identifier linked to this process (optional)
         *                                    // See OWS10.js
         *                      }
         * 
         */
        this.process = function(options) {
            
            var i, l, f, data = '';
            
            options = options || {};
            
            /*
             * First clear inputs
             */
            this.classificationDescriptor.clearInputs();
                    
            /*
             * Set the GML trainingList input parameter
             * 
             *  <wps:ComplexData mimeType="text/xml">
             *      <w:trainingList gml:id="trainingFeature" xmlns:w="constellation-sdi/WS/wps" xmlns:gml="http://www.opengis.net/gml" xsi:schemaLocation="wps http://localhost:8080/cstl-wrapper/webdav/default/schemas/trainingList.xsd" srsName="EPSG:4326">
             *          <w:trainingImage>http://constellation-wps.geomatys.com:8080/cstl-wrapper/webdav/default/QB_1_ortho.tif</w:trainingImage>
             *          <w:imageClass>
             *              <w:imageClassType>
             *                  <w:className>Water</w:className>
             *                  <w:classNumber>1</w:classNumber>
             *                  <w:classGeometry>
             *                      <gml:Polygon xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink"><gml:exterior><gml:LinearRing><gml:posList>1.400595208950612 43.623968330819316 1.40174075512119 43.623835046813859 1.401788873811428 43.622019122924279 1.400939303111765 43.621758390678423 1.400595208950612 43.623968330819316</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon>
             *                  </w:classGeometry>
             *              </w:imageClassType>
             *          </w:imageClass>
             *          <w:imageClass>
             *              ...
             *          </w:imageClass>
             *     </w:trainingList>
             *  </wps:ComplexData>
             *  
             */
            data = '<w:trainingList gml:id="trainingFeature" xsi:schemaLocation="' + this.options.trainingListSchemaLocation + '" xmlns:w="constellation-sdi/WS/wps" xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:4326">';
            if (this.imageToClassifyUrl) {
                data += '<w:trainingImage>' + this.imageToClassifyUrl.replace(/[&]/g, '&#038;') + '</w:trainingImage>';     
            }
            for (i = 0, l = this.classesLayer.features.length; i < l; i++ ) {
                f = this.classesLayer.features[i];
                data += '<w:imageClass><w:imageClassType><w:className>' + f.attributes.className + '</w:className><w:classNumber>' + f.attributes.classNumber + '</w:classNumber><w:classGeometry>' + M.Map.Util.GML.featureToGML(f) + '</w:classGeometry></w:imageClassType></w:imageClass>';
            }
            data += '</w:trainingList>';
            
            /*
             * Add image to classify url
             */
            this.classificationDescriptor.addInput({
                type:"ComplexData",
                identifier:this.options.inputImageId,
                fileUrl:this.imageToClassifyUrl
            });
        
            /*
             * Add sample ratio
             */
            this.classificationDescriptor.addInput({
                type:"LiteralData",
                identifier:this.options.sampleRatioId,
                data:0.5
            });
        
            /*
             * Add classification features
             *   {
             *          type: 'ComplexData'
             *          identifier: this.options.trainingListId
             *          data: // XML data
             *   }
             */
            this.classificationDescriptor.addInput({
                type:"ComplexData",
                identifier:this.options.trainingListId,
                data:data,
                format:{
                    mimeType:"text/xml"
                }
            });
        
            /*
             * Set output as WMS
             */
            this.classificationDescriptor.addOutput({
                type:"ComplexOutput",
                identifier:this.options.outputImageId,
                mimeType:"application/x-ogc-wms"
            });
        
            /*
             * Execute process asynchronously
             */
            this.classificationDescriptor.execute({
                storeExecute: true,
                parentId: options.parentId
            });
        };
          
        /*
         * Set unique instance
         */
        M.Plugins.ACAcIA._o = this;

        return this;
    };
})(window.M);