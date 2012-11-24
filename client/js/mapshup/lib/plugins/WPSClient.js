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
 * Plugin WPSClient
 *
 * Assisted Classification of eArth observation ImAges
 *
 *********************************************/
(function(M) {
    
    M.Plugins.WPSClient = function() {
        
        /*
         * Only one WPSClient object instance is created
         */
        if (M.Plugins.WPSClient._o) {
            return M.Plugins.WPSClient._o;
        }
        
        /*
         * Hasmap of WPS sources items store by WPS endpoint url
         * 
         * Structure of an item 
         *      {
         *          panelItem: // reference to panelItem
         *          $d: // reference to the panel jquery container
         *          wps: // reference to a WPS object
         *      }
         */
        this.items = [];
        
        /*
         * Initialization
         */
        this.init = function (options) {

            var self = this;
            
            /*
             * init options
             */
            self.options = options || {};
            
            /*
             * If url are set - Retrieve GetCapabilities
             */
            if (self.options.urls) {
                if (!$.isArray(self.options.urls)) {
                    self.add(self.options.urls);
                }
                else {
                    for (var i = 0, l = self.options.urls.length; i < l; i++) {
                        self.add(self.options.urls[i]);
                    }
                }
                
            }
            
            return self;
            
        };
        
        /*
         * Add a wps source from url
         */
        this.add = function(url) {
            
            var wps;
            
            /*
             * If url is set - Retrieve GetCapabilities
             */
            if (url) {
                
                /*
                 * Create a wps object
                 */
                wps = new M.WPS(url);
                
                /*
                * Register GetCapabilites event
                */
                wps.events.register("getcapabilities", this, function(scope, wps) {
                    
                    /*
                     * Avoid multiple getcapabilities respawn
                     */
                    if (!scope.items[url]) {
                        
                        var id = M.Util.getId();
                        
                        /*
                         * Create a panel for this WPS
                         */
                        var panelItem = M.sp.add({
                            id:id,
                            icon:M.Util.getImgUrl('configure.png'),
                            title:wps.title,
                            classes:"wpsclient",
                            mask:true,
                            html:'<div style="float:left;width:40%;"><div class="info"></div><div class="processes"></div></div><div style="float:right;width:60%;"><div class="describe">'+M.Util._("No process selected")+'</div><form method="POST" action="#"><div class="puts"></div></form><div class="outputs"></div></div>'
                        });
                        
                        /*
                         * Add a wps item to WPSClient
                         * with input url as the hash key
                         */
                        scope.items[url] = {
                            $d:panelItem.$content,
                            panelItem:panelItem,
                            wps:wps
                        };
                    
                        /*
                        * Tell user that a new WPS panel is created
                        */
                        M.Util.message(M.Util._("WPS server successfully added"));
                        M.sp.show(panelItem);
                     
                    }   
                    
                    scope.updateCapabilitiesContent(scope.items[url]);
                    
                });
                
                /*
                * Register DescribeProcess event
                */
                wps.events.register("describeprocess", this, function(scope, processes) {
                    if ($.isArray(processes) && processes[0]) {
                        scope.updateDescribeProcessContent(processes[0]);
                    }
                });
            
                /*
                * Register Execute event
                */
                wps.events.register("execute", this, function(scope, process) {
                    scope.updateOutputContent(process);
                });
                
                /*
                 * Retrieve capabilities
                 */
                wps.getCapabilities();
            }
            
        };
        
        /*
         * Update content of input item.panelItem with GetCapabilities information 
         *           
         * Container structure 
         * 
         *      <div class="pnsi wpsclient">
         *          <div style='float:left'>
         *              <div class="info">
         *                  <div class="title"></div>
         *                  <div class="description"></div>
         *              </div>
         *              <div class="processes">
         *                  // Contains Processes list
         *              </div>
         *          </div>
         *          <div style='float:right'>
         *              <div class="describe">
         *                  // Contains description of selected process
         *                  <div class="execute">
         *                      // Execute process button
         *                  </div>
         *              </div>
         *              <form>
         *                  <div class="puts">
         *                      // Display interactive InputsData and OutputsData
         *                  </div>
         *              </form>
         *          </div>
         *          
         *  @param {Object} item
         */
        this.updateCapabilitiesContent = function(item) {
            
            var id = M.Util.getId(), process, identifier, $processes;
            
            /*
             * Set '.info' div
             * 
             * Display WPS server title and abstract.
             * Add a clickable action to display full GetCapabilities contact info within
             * a mapshup message popup
             * 
             */
            $('.info', item.$d).html('<h1><a href="'+item.wps.url+'" title="'+item.wps.url+'" target="_blank">'+item.wps.title+'</a></h1><p>'+item.wps["abstract"]+' <a href="#" id="'+id+'" class="button inline">&nbsp;+&nbsp;</a></p><br/><h1>'+M.Util._('Processes')+'</h1>');
            $('#'+id).click(function(){
                M.Util.message(item.wps.toHTML(), -1);
                return false;
            });
            
            /*
             * Set '.processes' div
             * 
             * Add a clickable button for each process within the GetCapabilities description
             * A click on a button launch the corresponding DescribeProcess and display it
             * 
             */
            $processes = $('.processes', item.$d);
            for (identifier in item.wps.processes) {
                id = M.Util.getId();
                process = item.wps.processes[identifier];
                $processes.append('<a href="#" jtitle="'+process['abstract']+'" id="'+id+'" class="button inline">'+process.title+'</a> ');
                (function(process,$id, item) {
                    $id.click(function() {
                        $('a', $(this).parent()).removeClass('active');
                        $(this).addClass('active');
                        item.wps.describeProcess(process.identifier);
                        return false;
                    });
                    M.tooltip.add($id, 's');
                })(process,$('#'+id), item);
            }
            
            /*
             * Add a nice scrollbar :)
             */
            //$processes.mCustomScrollbar();
            
        };
        
        /*
         * Update content of process description panel contained
         * within 'describe' CSS class
         * 
         *  @param {Object} process : M.WPS.Process 
         */
        this.updateDescribeProcessContent = function(process) {
            
            var type, putsDescription, i, j, l, id, $id, put, $list, executeId = M.Util.getId(), item = this.items[process.wps.url];
            
            /*
             * Set '.info' div
             * 
             * Display Process title and abstract.
             */
            $('.describe', item.$d).html('<h1 title="'+process.identifier+'">'+process.title+'</h1><p>'+process["abstract"]+'</p><div class="execute"><a href="#" id="'+executeId+'" class="button inline" jtitle="'+M.Util._("Execute process")+'">&nbsp;'+M.Util._('Execute')+'</a></div>');
            
            /*
             * Action on execute button
             */
            $('#'+executeId).click(function(){
                process.execute();
                return false;
            });
            M.tooltip.add($('#'+executeId), 'n', 20);
            
            /*
             * Set '.puts' div
             * 
             * Entering the awfully complicated part of the code :D
             * 
             * Three types of InputsData (OutputsData) exist :
             *  
             *      - complexData (complexOuput) : basically something to upload to the WPS server
             *                                     This could be an image, a geometry, etc.
             *                                     Since most implementation support only reference to 
             *                                     uploaded data, mapshup first upload drag&drop file
             *                                     to the mapshup server and then send back an url
             *                                     to the uploaded file that is referenced within
             *                                     the TODO
             *                                     
             *      
             *      - boundingBoxData (boundingBoxOutput) : an input bbox (i.e. a geometry)
             *      
             *      - literalData (literalOutput) : basically an input text form containing one of
             *                                      the supported dataType (Double, String, etc.)
             * 
             * 
             * HTML structures :
             *      <div class="puts">
             *          <div class="list">
             *              <div id="id">
             *                  <span class="title paddedright">Title (or identifier if title is null)</span>
             *              </p>
             *          </div>
             *      </div>      
             * 
             */
            $('.puts', item.$d).html('<h1>'+M.Util._('Set inputs')+'</h1><div class="list"></div>');
            $list = $('.list', $('.puts', item.$d));
            
            /*
             * Roll over dataInputs and processOutputs
             */
            type = 'input';
            putsDescription = process.dataInputsDescription;
            for (j = 0; j < 2; j++) {
                
                if (j === 1) {
                    type = 'output';
                    putsDescription = process.processOutputsDescription;
                }
                
                for (i = 0, l = putsDescription.length; i < l; i++) {

                    put = putsDescription[i];
                    id = M.Util.getId();

                    /*
                     * Create Input or Output div with a CSS 'input' class.
                     * The 'input' (or 'output') class is necessary since the pre-execute function
                     * will roll over each div with class 'input' (or 'output') to construct the
                     * execute query.
                     * 
                     */
                    $list.append('<div id="'+id+'" class="'+type+'"><span class="title paddedright" jtitle="'+put['abstract']+'">'+(put['title'] || put['identifier'])+' :</span></div>');

                    /*
                     * Attach Input identifier to the 'input' div
                     * This is done by using the jQuery .data() function
                     */
                    $id = $("#"+id).data('identifier', put['identifier']);

                    /*
                     * Add a tooltip on the input title
                     * This tooltip contains input abstract
                     */
                    M.tooltip.add($(".title", $id), 'w');

                    /*
                     * The hard part...
                     */
                    if (put.literalData) {
                        this.displayLiteralData(process, put, $id);
                    }
                    else if (put.literalOutput) {
                        this.displayLiteralOutput(process, put, $id);
                    }
                    else if (put.complexData) {
                        this.displayComplexData(process, put, $id);
                    }
                    else if (put.complexOutput) {
                        this.displayComplexOutput(process, put, $id);
                    }
                    else if (put.boundingBoxData) {
                        $id.append("// TODO");
                    }

                }
            }
            
            /*
             * Add nice scrollbars :)
             */
            //$inputsList.mCustomScrollbar();
        
        };
        
        /**
         * Update Output content
         */
        this.updateOutputContent = function(process) {
            
            var i, l, geoType, result, item = this.items[process.wps.url], $outputsList = $('.output', item.$d);
            
            if (!$.isArray(process.result)) {
                return false;
            }
            
            /*
             * Update each Output DOM element that are identified in the process.result array
             */
            for (i = 0, l = process.result.length; i < l; i++) {
                
                result = process.result[i];
                
                /*
                * Searh within jQuery data('identifier')
                */
                $outputsList.each(function(){
                    if ($(this).data('identifier') === result.identifier) {
                        $('#'+$(this).attr('id')+'v').html(result.data.value);
                    }
                });
                
                /*
                 * Add new features within WPSClient layer
                 */
                geoType = M.Map.Util.getGeoType(result.data["mimeType"]);
                if (geoType === 'GML') {
                    this.load(M.Map.Util.GML.toGeoJSON(result.data.value,{
                        title:process.title,
                        processid:process.identifier,
                        description:process["abstract"],
                        time:(new Date()).toISOString()
                    }));
                }
                
            }
            
            return true;
            
        };
        
        /**
         * Append form for LiteralData within $parent container
         * 
         * Structure of LiteralData
         * 
         *      {
         *          anyValue: // ???
         *          dataType: // dataType (mandatory)
	 *          defaultValue: // default value set in the input text box
         *          reference: // reference url for the dataType (display as link for dataType)
         *          UOMs:{
         *              default: // default Unit of Measure
         *              supported:[] // array of supported Units of Measure
         *      }
         *  
         *   Append the following structure to $parent
         *   
         *      <span id="id" class="hilite">literalData.defaultValue</span>
         *      
         *   
         *   IMPORTANT : jQuery .data() is used to store addtionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input object containing LiteralData
         *   @param {Object} $parent
         *      
         */
        this.displayLiteralData = function(process, put, $parent) {
            
            var type = 'input', data = put.literalData, id = M.Util.getId(), $id, $uom, $av, i, l, self = this;
            
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'LiteralData');
            
            /*
            * Set content i.e. add a 'Set value' action except if allowedValues is set.
            * In this case, set a select box with a finite list of elements
            */
            if (data.allowedValues) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'av"></select></span>');
                
                /*
                * Store allowedValues value for parent $parent on change selection within .data() store
                */
                $av = $('#'+id+'av').change(function(){
                    $parent.data('data', $(this).val());
                    self.setPuts(process, type);
                });
                     
                for (i = 0, l = data.allowedValues.length; i< l; i++) {
                    (function($av, v, d) {
                        
                        /*
                         * Add a new option in the select form
                         */
                        $av.append('<option value="'+v+'">'+v+'</option>');
                        
                        /*
                         * The default UOM is selected within the list of possible UOMs
                         */
                        if (v === d) {
                            $('option:last-child', $av).attr("selected", "selected").change();
                        }
                        
                    })($av, data.allowedValues[i].value, data.defaultValue);
                }
                $av.trigger('change');
            }
            else {
                $parent.append('<span id="'+id+'" class="hover" title="'+M.Util._("Change value")+'">'+(data.defaultValue || M.Util._("Not set"))+'</span>');
                $id = $('#'+id);
            }
            
            /*
             * Set the Units of Measure if specified
             */
            if (data.UOMs) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'uom"></select></span>');
                
                /*
                * Store UOM value for parent $parent on change selection within .data() store
                */
                $uom = $('#'+id+'uom').change(function(){
                    $parent.data('uom', $(this).val());
                    self.setPuts(process, type);
                });
                     
                for (i = 0, l = data.UOMs.supported.length; i< l; i++) {
                    (function($uom, v, d) {
                        
                        /*
                         * Add a new option in the select form
                         */
                        $uom.append('<option value="'+v+'">'+v+'</option>');
                        
                        /*
                         * The default UOM is selected within the list of possible UOMs
                         */
                        if (v === d) {
                            $('option:last-child', $uom).attr("selected", "selected").change();
                        }
                        
                    })($uom, data.UOMs.supported[i], data.UOMs["default"]);
                }
                
            }
            
            /*
             * This only make sense if $id is set (i.e. if there are no allowedValues select)
             */
            if ($id) {
                
                /*
                * Switch between hilite and warning classes depending
                * if input literealData has a default value or not
                */
                if (!data.defaultValue) {
                    $id.removeClass('hilite').addClass('warning');
                }
                else {
                    $id.addClass('hilite').removeClass('warning');
                    $parent.data('data', data.defaultValue);
                    self.setPuts(process, type);
                }

                /*
                 * Ask for value on click
                 */
                $id.click(function(e) {

                    M.Util.askFor({
                        title:put.title,
                        content:M.Util._("Enter a valid")+' <a href="'+data.reference+'" target="_blank">'+data.dataType+'</a>',
                        dataType:data.dataType,
                        /* TODO */
                        bounds:data.bounds,
                        size:5,
                        value:$id.text(),
                        callback:function(v){

                            /*
                             * Value is set
                             */
                            if (v) {

                                /*
                                 * Update link content text with
                                 * the new set value
                                 */
                                $id.html(v).addClass('hilite').removeClass('warning');

                                /*
                                  * Store new value and update process accordingly
                                  */
                                $parent.data('data', v);
                                self.setPuts(process, type);
                            }
                        }
                    });

                    return false;
                });
            
            }
            
        };
       
        /**
         * Append form for LiteralOutput within $parent container 
         * 
         *   Structure of LiteralOuput
         * 
         *      {
         *          anyValue: // ???
         *          dataType: // dataType (mandatory)
	 *          defaultValue: // default value set in the input text box
         *          reference: // reference url for the dataType (display as link for dataType)
         *          UOMs:{
         *              default: // default Unit of Measure
         *              supported:[] // array of supported Units of Measure
         *      }
         *      
         *   Append the following structure to $parent
         *   
         *      <span id="idt" class="hilite">literalData.defaultValue</span>
         *      
         *   
         *   IMPORTANT : jQuery .data() is used to store addtionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input or Output object containing LiteralData
         *   @param {Object} $parent
         *      
         */
        this.displayLiteralOutput = function(process, put, $parent) {
            
            var type = 'output', data = put.literalOutput, id = $parent.attr('id'), $uom, self = this;
            
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'LiteralOutput');
            
            /*
            * Set content i.e. add a 'Set value' action
            */
            $parent.append('<span id="'+id+'v" class="bold">---</span>');
            
            /*
             * Add output to process
             */
            self.setPuts(process, type);
            
            /*
             * Set the Units of Measure if specified
             */
            if (data.UOMs) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'vuom"></select></span>');
                
                /*
                * Store UOM value for parent $parent on change selection within .data() store
                */
                $uom = $('#'+id+'vuom').change(function(){
                    $parent.data('uom', $(this).val());
                    self.setPuts(process, type);
                });
                     
                for (var i = 0, l = data.UOMs.supported.length; i< l; i++) {
                    (function($uom, v, d) {
                        
                        /*
                         * Add a new option in the select form
                         */
                        $uom.append('<option value="'+v+'">'+v+'</option>');
                        
                        /*
                         * The default UOM is selected within the list of possible UOMs
                         */
                        if (v === d) {
                            $('option:last-child', $uom).attr("selected", "selected").change();
                        }
                        
                    })($uom, data.UOMs.supported[i], data.UOMs["default"]);
                }
                
            }

        };
        
        /**
         * Append form for ComplexData within $parent container 
         * 
         *  Structure of ComplexData 
         * 
         *      {
         *          maximumMegabytes: // ???
         *          default:{
         *              mimeType: //
         *              encoding: //
         *              schema: //
         *          },
         *          supported[
         *              {
         *                  mimeType: //
         *                  encoding: //
         *                  schema: //
         *              },
         *              ...
         *          ]
         *      }
         *  
         *   Append the following structure to $parent
         *   
         *      <span id="id" class="hilite">Not set</span>
         *      
         *   
         *   IMPORTANT : jQuery .data() is used to store addtionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input object containing ComplexData
         *   @param {Object} $parent
         *      
         */
        this.displayComplexData = function(process, put, $parent) {
            
            var type = 'input', data = put.complexData, id = M.Util.getId(), idgeoselect = M.Util.getId(), idgeodraw = M.Util.getId(), self = this;
            
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'ComplexData');
            
            /*
            * Set content i.e. add an 'Upload' action
            */
            $parent.append('<img class="hover middle" src="'+M.Util.getImgUrl('upload.png')+'" id="'+id+'" title="'+M.Util._("Upload")+'"/>');
            
            /*
             * Ask for value on click
             */
            $('#'+id)
            .removeClass('hilite')
            .addClass('warning')
            .click(function(e) {

                M.Util.askFor({
                    title:put.title,
                    dataType:"complexData",
                    defaultFormat:data["default"],
                    maximumMegabytes:data.maximumMegabytes,
                    supportedFormats:data.supported,
                    file:$parent.data('file'),
                    fileUrl:$parent.data('fileUrl'),
                    callback:function(data){
                       
                        /*
                         * Data can be either a File object or an url
                         */
                        if (data.file || data.fileUrl) {
                            
                            /*
                             * Update link content 
                             */
                            $('#'+id).attr('title', data.file ? data.file.name : data.fileUrl).addClass('hilite').removeClass('warning');
                            $('#'+idgeoselect).attr('title',M.Util._("Select feature on Map")).removeClass('hilite').addClass('warning');
                            
                            /*
                             * Store file or fileUrl within parent data cache
                             */
                            data.file ? $parent.removeData('fileUrl').data('file', data.file) : $parent.removeData('file').data('fileUrl', data.fileUrl);
                            
                            self.setPuts(process, type);
                            
                            alert("TODO : format ?");

                        }
                        
                    }
                });
                
                return false;
            });
            
            /*
             * Special case of Geometries 
             * 
             * If the mimeType of the ComplexData is one of the geographical
             * mimeTypes, then use can also choose one feature within the map :)
             * 
             */
            if (data["default"] && M.Map.Util.getGeoType(data["default"].mimeType)) {
                 
                $parent
                .append(' <img src="'+M.Util.getImgUrl('earth.png')+'" id="'+idgeoselect+'" class="hover middle" title="'+M.Util._("Select feature on Map")+'"/>')
                .append(' <img src="'+M.Util.getImgUrl('drawing.png')+'" id="'+idgeodraw+'" class="hover middle" title="'+M.Util._("Draw feature on Map")+'"/>');
                
                /*
                 * Select geometry within the map
                 */
                $('#'+idgeoselect)
                .removeClass('hilite')
                .addClass('warning')
                .click(function(e) {
                    
                    var $mask = self.items[process.wps.url].panelItem.$mask;
                    
                    /*
                     * Set a callback function on FeatureInfo
                     */
                    M.Map.featureInfo.bypassCallback = function(feature) {
                        
                        /*
                         * Hide mask
                         */
                        $mask.hide();
                        M.Map.featureInfo.bypassCallback = null;
                        
                        /*
                         * Update "Select on map" action display and store feature in the .data() cache
                         */
                        if (feature) {
                            
                            $('#'+id).attr('title',M.Util._("Upload")).removeClass('hilite').addClass('warning');
                            $('#'+idgeoselect).attr('title',M.Map.Util.Feature.getTitle(feature)).addClass('hilite').removeClass('warning');
                            
                            /*
                             * Store file or fileUrl within parent data cache
                             */
                            $parent
                            .removeData('fileUrl')
                            .data('data', M.Map.Util.Feature.toGeo(feature, data["default"]))
                            .data('format', data["default"]);
                            self.setPuts(process, type);
                            
                        }
                    };
                    
                    /*
                     * Show mask
                     */
                    $mask
                    .html('<div class="content">'+M.Util._("Select a feature on map")+' (<a href="#" class="cancel">'+M.Util._("Cancel")+'<a/>)</div>')
                    .show();
                    
                    /*
                     * Add a cancel action
                     */
                    $('.cancel', $mask).click(function(e) {
                        M.Map.featureInfo.bypassCallback = null;
                        $mask.hide();
                    });
                    
                    return false;
                });
                
                /*
                 * Draw geometry within the map
                 */
                $('#'+idgeodraw)
                .removeClass('hilite')
                .addClass('warning')
                .click(function(e) {
                    alert("This function is not available yet");
                });
                
            }
            
        };
        
        /**
         * Append form for complexOutput within $parent container 
         * 
         *   Structure of ComplexOuput
         * 
         *      {
         *          default: // default mimeType
         *          supported:[] // array of supported mimeType
         *      }
         *      
         *   Append the following structure to $parent for non geometrical output
         *   
         *      <span id="idv" class="hilite">---</span>
         *   
         *   For geometrical output (i.e. M.Map.Util.getGeoType(data["default"].mimeType) is not null)
         *   then nothing is appended to $parent container, since geometrical results are directly
         *   displayed within the map
         *   
         *   IMPORTANT : jQuery .data() is used to store additionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input or Output object containing ComplexOutput
         *   @param {Object} $parent
         *      
         */
        this.displayComplexOutput = function(process, put, $parent) {
            
            var type = 'output', data = put.complexOutput, id = $parent.attr('id'), self = this;
            
            /*
             * In any case store parent type and mimeType
             */
            $parent.data('mimeType', data["default"].mimeType)
            .data('type', 'ComplexOutput');
            
            /*
             * Geometrical output options are not displayed within $parent
             */
            if (M.Map.Util.getGeoType(data["default"].mimeType)){
                self.setPuts(process, type);
                $parent.hide();
            }
            else {
            
                /*
                 * Store Input type within $parent.data()
                 */
                $parent.append('<span id="'+id+'v" class="bold">---</span>');

                /*
                 * Add output to process
                 */
                self.setPuts(process, type);

                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'vmtype"></select></span>');

                /*
                * Store mimeType value for parent $parent on change selection within .data() store
                */
                $mtype = $('#'+id+'vmtype').change(function(){
                    $parent.data('mimeType', $(this).val());
                    self.setPuts(process, type);
                });

                for (var i = 0, l = data.supported.length; i< l; i++) {
                    (function($mtype, v, d) {

                        /*
                         * Add a new option in the select form
                         */
                        $mtype.append('<option value="'+v+'">'+v+'</option>');

                        /*
                         * The default mimeType is selected within the list of possible mimeTypes
                         */
                        if (v === d) {
                            $('option:last-child', $mtype).attr("selected", "selected").change();
                        }

                    })($mtype, data.supported[i].mimeType, data["default"].mimeType);
                }
            }
        };
        
        
        /**
         * Update inputs or outputs list for process
         * 
         * @param {Object} process
         * @param {String} type : 'input' or 'output'
         *
         */
        this.setPuts = function(process, type) {
            type === 'input' ? this.setInputs(process) : this.setOutputs(process);
        };
        
        /**
         * Update inputs list for process
         * 
         * @param {Object} process
         *
         */
        this.setInputs = function(process) {
            
            /*
             * Clear process list
             */
            process.clearInputs();
            
            /*
             * Populate process inputs list with
             * the .data() content of each process Input
             * identified by 'input' CSS class
             */
            $('.input', this.items[process.wps.url].$d).each(function(){
                process.addInput($(this).data());
            });
           
        };
        
        /**
         * Update outputs list for process
         * 
         * @param {Object} process
         *
         */
        this.setOutputs = function(process) {
            
            /*
             * Clear process list
             */
            process.clearOutputs();
            
            /*
             * Populate process outputs list with
             * the .data() content of each process Input
             * identified by 'input' CSS class
             */
            $('.output', this.items[process.wps.url].$d).each(function(){
                process.addOutput($(this).data());
            });
            
        };
        
        /*
         * Return layer to display Geometries results
         */
        this.getLayer = function() {
            
            if (this._layer) {
                return this._layer
            }
            
            this._layer = M.Map.addLayer({
                type:"GeoJSON",
                title:"WPS results",
                clusterized:false
            });
            
            return this._layer;
        };
        
        /*
         * Add GeoJSON features within WPS result layer
         * 
         * @param {String} data : a GeoJSON string
         */
        this.load = function(data) {
            
            if (M.Map.layerTypes["GeoJSON"]) {
                
                /*
                 * Add new feature(s) and center on it
                 */
                M.Map.layerTypes["GeoJSON"].load({
                    data:data,
                    layer:this.getLayer(),
                    zoomOnNew:true
                });
                
            }
            
        };
        
        /*
         * Set unique instance
         */
        M.Plugins.WPSClient._o = this;
        
        return this;
    };
})(window.M);