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
 * WPS protocol reader implementation of OGC 05-007r7 and 08-091r6
 * 
 * See http://www.opengeospatial.org/standards/wps
 * 
 */
(function(msp) {
    
     
    /*
     * Initialize msp
     */
    msp = msp || {};
    
    /*
     * Initialize msp.WPS
     */
    msp.WPS = function() {
        
        /**
         * WPS Title - read from GetCapabilities document
         */
        this.title = null;
        
        /**
         * WPS Abstract - read from GetCapabilities document
         */
        this.description = null;
        
        /**
         * WPS Service Provider information - read from GetCapabilities document
         */
        this.serviceProvider = {};
        
        /**
         * List of msp.WPS.Process objects
         * for the current WPS instance
         */
        this.processes = [];
        
        /**
         * Get an xml GetCapabilities object and return
         * a javascript object
         * 
         * GetCapabilities structure is :
         * 
         * <wps:Capabilities service="WPS" xml:lang="en-EN" version="1.0.0" updateSequence="1352815432361">
         *      <ows:ServiceIdentification>
         *          [...See Service Identification below...]
         *      </ows:ServiceIdentification>
         *      <ows:ServiceProvider>
         *          [...See Service Provider below...]
         *      </ows:ServiceProvider>
         *      <ows:OperationsMetadata>
         *          [...See Operations Metadata below...]
         *      </ows:OperationsMetadata>
         *      <wps:ProcessOfferings>
         *          [...See Process below...]
         *      </wps:ProcessOfferings>
         *      <wps:Languages>
         *          [...]
         *      </wps:Languages>
         *      <wps:WSDL xlink:href=""/>
         *  </wps:Capabilities>
         * 
         */
        this.parseCapabilities = function(xml) {
            
            var self = this, capabilities = {};
            
            /*
             * jquery 1.7+ query selector using find('*') and filter()
             * See http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
             */
            $(xml).find('*').filter(function(){
                
                /*
                 * Service identification
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <ows:ServiceIdentification>
                 *      <ows:Title>WPS server</ows:Title>
                 *      <ows:Abstract>WPS server developed by XXX.</ows:Abstract>
                 *      <ows:Keywords>
                 *          <ows:Keyword>WPS</ows:Keyword>
                 *          <ows:Keyword>XXX</ows:Keyword>
                 *          <ows:Keyword>geoprocessing</ows:Keyword>
                 *      </ows:Keywords>
                 *      <ows:ServiceType>WPS</ows:ServiceType>
                 *      <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
                 *      <ows:Fees>NONE</ows:Fees>
                 *      <ows:AccessConstraints>NONE</ows:AccessConstraints>
                 * </ows:ServiceIdentification>
                 * 
                 * Note that this function only store :
                 *      Title
                 *      Abstract
                 *      
                 */
                if (msp.Util.stripNS(this.nodeName) === 'ServiceIdentification') {
                    
                    $(this).find('*').filter(function() {
                    
                        switch (msp.Util.stripNS(this.nodeName)) {
                            case 'Title':
                                self.title = $(this).text();
                                break;
                            case 'Abstract':
                                self.description = $(this).text();
                                break;
                        }
                        
                    });
                }
                
                /*
                 * Service Provider
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <ows:ServiceProvider>
                 *      <ows:ProviderName>mapshup</ows:ProviderName>
                 *      <ows:ProviderSite xlink:href="http://www.geomatys.com/"/>
                 *      <ows:ServiceContact>
                 *              <ows:IndividualName>Jerome Gasperi</ows:IndividualName>
                 *              <ows:PositionName>CEO</ows:PositionName>
                 *              <ows:ContactInfo>
                 *                  <ows:Phone>
                 *                      <ows:Voice>06 00 00 00 00</ows:Voice>
                 *                      <ows:Facsimile/>
                 *                  </ows:Phone>
                 *                  <ows:Address>
                 *                      <ows:DeliveryPoint>Somewhere</ows:DeliveryPoint>
                 *                      <ows:City>TOULOUSE</ows:City>
                 *                      <ows:AdministrativeArea>Haute-Garonne</ows:AdministrativeArea>
                 *                      <ows:PostalCode>31000</ows:PostalCode>
                 *                      <ows:Country>France</ows:Country>
                 *                      <ows:ElectronicMailAddress>jerome.gasperi@gmail.com</ows:ElectronicMailAddress>
                 *                  </ows:Address>
                 *              </ows:ContactInfo>
                 *     </ows:ServiceContact>
                 * </ows:ServiceProvider>
                 * 
                 * Note that this function only store the following
                 *      
                 *      {
                 *          name
                 *          site
                 *          contact:{
                 *              name
                 *              position
                 *              phone
                 *              address:{
                 *              
                 *              }
                 *          }
                 *      }
                 *              
                 *      
                 */
                else if (msp.Util.stripNS(this.nodeName) === 'ServiceProvider') {
                    
                    var contact = {}, address = {};
                    
                    /*
                     * Initialize serviceProvider
                     */
                    self.serviceProvider = {};
                    
                    $(this).find('*').filter(function() {
                        
                        switch (msp.Util.stripNS(this.nodeName)) {
                            case 'ProviderName':
                                self.serviceProvider.providerName = $(this).text();
                                break;
                            case 'ProviderSite':
                                self.serviceProvider.providerSite = $(this).text();
                                break;
                            /* ServiceContact*/
                            case 'ServiceContact':
                                $(this).children().each(function() {
                                    switch(msp.Util.stripNS(this.nodeName)) {
                                        case 'IndividualName':
                                            contact.name = $(this).text();
                                            break;
                                        case 'PositionName':
                                            contact.position = $(this).text();
                                            break;
                                        /* ContactInfo*/
                                        case 'ContactInfo':
                                            $(this).children().each(function() {
                                                switch(msp.Util.stripNS(this.nodeName)) {
                                                    /* Phone */
                                                    case 'Phone':
                                                        $(this).children().each(function() {
                                                            switch(msp.Util.stripNS(this.nodeName)) {
                                                                case 'Voice':
                                                                    contact.phone = $(this).text();
                                                                    break;
                                                            }
                                                        });                                                        
                                                        break;
                                                    /* Address */
                                                    case 'Address':
                                                        $(this).children().each(function() {
                                                            switch(msp.Util.stripNS(this.nodeName)) {
                                                                case 'DeliveryPoint':
                                                                    address.deliveryPoint = $(this).text();
                                                                    break;
                                                                case 'City':
                                                                    address.city = $(this).text();
                                                                    break;
                                                                case 'AdministrativeArea':
                                                                    address.administrativeArea = $(this).text();
                                                                    break;
                                                                case 'PostalCode':
                                                                    address.postalCode = $(this).text();
                                                                    break;
                                                                case 'Country':
                                                                    address.country = $(this).text();
                                                                    break;
                                                                case 'ElectronicMailAddress':
                                                                    address.email = $(this).text();
                                                                    break;
                                                            }
                                                        });
                                                        break;
                                                }
                                            });
                                            break;
                                    }
                                });
                                break;
                        }
                        
                    });
                    
                    self.serviceProvider.contact = contact || {};
                    self.serviceProvider.contact["address"] = address;
                }
                
                /*
                 * Get individual processes
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <wps:ProcessOfferings>
                 *      <wps:Process wps:processVersion="1.0.0">
                 *          <ows:Identifier>urn:ogc:cstl:wps:jts:intersection</ows:Identifier>
                 *          <ows:Title>Jts : Intersection</ows:Title>
                 *          <ows:Abstract>Computes a intersection Geometry between the source geometry (geom1) and the other (geom2).</ows:Abstract>
                 *      </wps:Process>
                 *      [...]
                 * </wps:ProcessOfferings>
                 * 
                 */
                else if (msp.Util.stripNS(this.nodeName) === 'Process') {
                    
                    var identifier, title, description;
                    
                    $(this).find('*').filter(function() {
                        
                        switch (msp.Util.stripNS(this.nodeName)) {
                            case 'Identifier':
                                identifier = $(this).text();
                                break;
                            case 'Title':
                                title = $(this).text();
                                break;
                            case 'Abstract':
                                description = $(this).text();
                                break;
                        }
                        
                    });
                    
                    self.addProcess(new msp.WPS.Process({
                        "identifier":identifier,
                        "title":title,
                        "description":description
                    }));
                    
                }
                
            });
            
            return capabilities
        };
        
        /**
        * Add process to this.processes list
        *
        * @param {Object} process : msp.WPS.Process object
        */
        this.addProcess = function(process) {
            
            /*
             * Paranoid mode
             */
            if (!process) {
                return false;
            }
            
            /*
             * Do not add an existing process twice
             */
            if (this.getProcess(process.identifier)) {
                return true;
            }
            
            /*
             * Effectively add a new process
             */
            $.extend(process,{
                wps:this
            });
            
            this.processes.push(process);
            
            return true;
            
        };
        
        /**
        * Get process from this.processes list based on its identifier
        *
        * @param {String} identifier : msp.WPS.Process object identifier
        */
        this.getProcess = function(identifier) {
            
            var i, process = null;
            
            for (i = this.processes.length; i--;) {
                if (this.processes[i].identifier === identifier) {
                    return this.processes[i];
                }
            }
            
            return process;
        };
        
    };
    
    /*
     * WPS Process
     */
    msp.WPS.Process = function(options) {
        
        /*
         * msp.WPS object reference
         */
        this.wps = null;
        
        /*
         * Process unique identifier 
         */
        this.identifier = null;
        
        /*
         * Process title
         */
        this.title = null;
        
        /*
         * Process abstract
         */
        this.description = null;
        
        
        this.init = function(options) {
            $.extend(this, options);
        };
        
        this.init(options);
        
        return this;
    };
    
})(window.msp);