#########################################
#
# mapshup - Webmapping made easy
# http://mapshup.info
#
# Copyright Jérôme Gasperi, 2011.12.08
#
# jerome[dot]gasperi[at]gmail[dot]com
#
# This software is a computer program whose purpose is a webmapping application
# to display and manipulate geographical data.
#
# This software is governed by the CeCILL-B license under French law and
# abiding by the rules of distribution of free software.  You can  use,
# modify and/ or redistribute the software under the terms of the CeCILL-B
# license as circulated by CEA, CNRS and INRIA at the following URL
# "http://www.cecill.info".
#
# As a counterpart to the access to the source code and  rights to copy,
# modify and redistribute granted by the license, users are provided only
# with a limited warranty  and the software's author,  the holder of the
# economic rights,  and the successive licensors  have only  limited
# liability.
#
# In this respect, the user's attention is drawn to the risks associated
# with loading,  using,  modifying and/or developing or reproducing the
# software by the user in light of its specific status of free software,
# that may mean  that it is complicated to manipulate,  and  that  also
# therefore means  that it is reserved for developers  and  experienced
# professionals having in-depth computer knowledge. Users are therefore
# encouraged to load and test the software's suitability as regards their
# requirements in conditions enabling the security of their systems and/or
# data to be ensured and,  more generally, to use and operate it in the
# same conditions as regards security.
#
# The fact that you are presently reading this means that you have had
# knowledge of the CeCILL-B license and that you accept its terms.
#
#########################################

mapshup server installation HOWTO
This document describes how to install the mapshup server

NOTE : the installation scripts are unix based. Windows server user should write
their own installation scripts.


1. Prerequesites

  Before installing, you need to double check that the following packages are installed :

	- Apache server
	- PHP > 5.0
	- PHP Curl
	- PostgreSQL > 8.3
	- PostGIS > 1.5
	- Mapserver > 5.0


2. Database installation

  # Go to _installdb directory
  cd _installdb

  # Edit install_mapshupdb.sh to put the right postgis paths if needed
  # Note : don't forget to remove mapshup database before launching the script
  
  # Launch installation script
  ./install_mapshupdb.sh


3. Server installation

  # copy everything under an Apache directory EXCEPT this README file and
  # the _installdb directory 

4. Server configuration

  # edit config.php file accordlingly to the current installation.


