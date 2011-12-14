-- ==================================================================
-- mapshup - Webmapping made easy
-- http://mapshup.info
--
-- Copyright Jérôme Gasperi, 2011.12.08
--
-- jerome[dot]gasperi[at]gmail[dot]com
--
-- This software is a computer program whose purpose is a webmapping application
-- to display and manipulate geographical data.
--
-- This software is governed by the CeCILL-B license under French law and
-- abiding by the rules of distribution of free software.  You can  use,
-- modify and/ or redistribute the software under the terms of the CeCILL-B
-- license as circulated by CEA, CNRS and INRIA at the following URL
-- "http://www.cecill.info".
--
-- As a counterpart to the access to the source code and  rights to copy,
-- modify and redistribute granted by the license, users are provided only
-- with a limited warranty  and the software's author,  the holder of the
-- economic rights,  and the successive licensors  have only  limited
-- liability.
--
-- In this respect, the user's attention is drawn to the risks associated
-- with loading,  using,  modifying and/or developing or reproducing the
-- software by the user in light of its specific status of free software,
-- that may mean  that it is complicated to manipulate,  and  that  also
-- therefore means  that it is reserved for developers  and  experienced
-- professionals having in-depth computer knowledge. Users are therefore
-- encouraged to load and test the software's suitability as regards their
-- requirements in conditions enabling the security of their systems and/or
-- data to be ensured and,  more generally, to use and operate it in the
-- same conditions as regards security.
--
-- The fact that you are presently reading this means that you have had
-- knowledge of the CeCILL-B license and that you accept its terms.
-- ==================================================================
--
-- Generate a 360*180 1x1 degrees grid over the
-- bounding box -180,-90,180,90
--
CREATE TABLE worldgrid (
    gid                 SERIAL PRIMARY KEY,
    visits              INTEGER DEFAULT 0,
    visits_normalized   FLOAT DEFAULT 0.0
);
SELECT AddGeometryColumn('worldgrid', 'the_geom', 4326, 'POLYGON', 2);
INSERT INTO worldgrid(the_geom)
SELECT ST_translate(ref.boxrep, lon.n*width, lat.n*height) As slice
FROM
(SELECT -180 AS xstart,
        -90 AS ystart,
        ST_SetSRID(CAST('BOX(-180 -90,-179 -89)' as box2d), 4326) AS boxrep,
        1 as width,
        1 as height) As ref,
        generate_series(1,360) as lon(n), generate_series(1,180) as lat(n);

CREATE INDEX idx_worldgrid_the_geom ON worldgrid USING gist(the_geom);
--CREATE INDEX idx_worldgrid_visits ON worldgrid USING ??;
