#!/bin/bash
#
#  mapshup - Webmapping made easy
#
#  http://mapshup.info
# 
#  Copyright Jérôme Gasperi, 2014
# 
#  jerome[dot]gasperi[at]gmail[dot]com
# 
#  This software is a computer program whose purpose is a webmapping application
#  to display and manipulate geographical data.
# 
#  This software is governed by the CeCILL-B license under French law and
#  abiding by the rules of distribution of free software.  You can  use,
#  modify and/ or redistribute the software under the terms of the CeCILL-B
#  license as circulated by CEA, CNRS and INRIA at the following URL
#  "http://www.cecill.info".
# 
#  As a counterpart to the access to the source code and  rights to copy,
#  modify and redistribute granted by the license, users are provided only
#  with a limited warranty  and the software's author,  the holder of the
#  economic rights,  and the successive licensors  have only  limited
#  liability.
# 
#  In this respect, the user's attention is drawn to the risks associated
#  with loading,  using,  modifying and/or developing or reproducing the
#  software by the user in light of its specific status of free software,
#  that may mean  that it is complicated to manipulate,  and  that  also
#  therefore means  that it is reserved for developers  and  experienced
#  professionals having in-depth computer knowledge. Users are therefore
#  encouraged to load and test the software's suitability as regards their
#  requirements in conditions enabling the security of their systems and/or
#  data to be ensured and,  more generally, to use and operate it in the
#  same conditions as regards security.
# 
#  The fact that you are presently reading this means that you have had
#  knowledge of the CeCILL-B license and that you accept its terms.
#

#
# Default configuration
#
SRC=`pwd`
BUILDFILE=$SRC/client/js/mapshup/buildfile.txt
DEBUG=0
CONFIG=0
THEME=default

#
# Build options
#
usage="\n## mapshup build script ##\n\n"
usage+="\tUsage $0 -t <target directory> [-b <build file> -m <theme> -c <config file> -d]\n\n"
usage+="\tOptions:\n"
usage+="\t\t-t : target directory to build mapshup (accessible by Web server !) \n"
usage+="\t\t-b : dedicated buildfile.txt (see $SRC/client/js/mapshup/buildfile.txt) \n"
usage+="\t\t-m : theme name (default is "default")\n"
usage+="\t\t-c : javascript config file (see $SRC/client/js/mapshup/config/example.js)\n"
usage+="\t\t-d : keep an uncompressed javascript build to debug.js (for developpers only)\n"
while getopts "t:b:m:c:dh" options; do
    case $options in
        t ) TARGET=`echo $OPTARG`;;
        b ) BUILDFILE=`echo $OPTARG`;;
        d ) DEBUG=1;;
        m ) THEME=`echo $OPTARG`;;
        c ) CONFIG=`echo $OPTARG`;;
        h ) echo -e $usage;;
        \? ) echo -e $usage
            exit 1;;
        * ) echo -e $usage
            exit 1;;
    esac
done
if [ "$TARGET" = "" ]
then
    echo -e $usage
    exit 1
fi

if [ -d $TARGET ]
then
    echo "$TARGET directory already exists. Remove first before building mapshup !"
    exit 1
fi

echo -e " -> Compile mapshup to $TARGET directory"
$SRC/utils/packer/pack.sh $SRC $TARGET $THEME $CONFIG $BUILDFILE $DEBUG
rm -Rf $TARGET/s/README_INSTALL.txt
rm -Rf $TARGET/s/_installdb

echo -e " -> Build complete - see README.md for database installation\n"
