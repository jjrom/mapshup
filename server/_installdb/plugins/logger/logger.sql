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

-- ==================================================================
-- Logger.sql
--
-- Create the tables used by the Logger plugin.
--
-- This table should be created within the _msprowser database.
-- The _msprowser database name is defined by $DB_NAME within the
-- _msprowserConfig.php file
--
-- ==================================================================

-- ==================
-- Table logger :
-- Store :
--   - every _msprowser map extent visited by users
--   - every search sent by users
--
-- Nota : the userid should reference the userid in
-- the users table (see UserManagement plugin). However
-- there is no use of a foreign key because we want
-- no constraint between these two tables
-- ==================
CREATE TABLE logger (
    gid                 SERIAL PRIMARY KEY,
    ip                  VARCHAR(15),
    location            VARCHAR(255),
    searchurl           TEXT DEFAULT NULL,
    searchterms         TEXT DEFAULT NULL,
    searchservice       VARCHAR(50) DEFAULT NULL,
    userid              INTEGER DEFAULT -1,
    utc                 TIMESTAMP,
    zoom                INTEGER DEFAULT 1
);

-- ==================
-- Table stats :
-- Store statistical
-- information
-- ==================
CREATE TABLE stats (
    tablename      VARCHAR(20) PRIMARY KEY,
    maxvalue       INTEGER DEFAULT 1,
    sumvalue       INTEGER DEFAULT 0,
    lastupdate     TIMESTAMP DEFAULT '1900-01-01'
);

-- ==================
-- Table contexts :
-- Store contexts
-- information
-- ==================
CREATE TABLE contexts (
    gid                 SERIAL PRIMARY KEY,
    userid              INTEGER DEFAULT -1,
    location            VARCHAR(255),
    utc                 TIMESTAMP DEFAULT now(),
    context             TEXT,
    uid                 VARCHAR(255)
);

-- ==================
-- Table logger :
-- Store every _msprowser map extent visited
-- by users
-- ==================

-- ============================================================
-- GEOMETRY COLUMNS
-- ============================================================
-- =====
select AddGeometryColumn(
'logger',
'bbox',
'4326',
'POLYGON',
2
);

select AddGeometryColumn(
'logger',
'center',
'4326',
'POINT',
2
);

-- ================
-- Initialize stats
-- ================
ALTER TABLE countries ADD column visits INTEGER DEFAULT 0;
INSERT INTO stats (tableName) VALUES ('countries');
INSERT INTO stats (tableName) VALUES ('worldgrid');
INSERT INTO stats (tableName) VALUES ('keywords');

-- ================
-- Create view on countries
-- ================
CREATE VIEW visitedcountries AS
SELECT gid AS oid, the_geom AS the_geom, (100 * visits) / (SELECT maxvalue FROM stats WHERE tablename = 'countries') AS visitsnormalized
FROM countries;

INSERT INTO geometry_columns(f_table_catalog, f_table_schema, f_table_name, f_geometry_column, coord_dimension, srid, "type")
SELECT '', 'public', 'visitedcountries', 'the_geom', ST_CoordDim(the_geom), ST_SRID(the_geom), GeometryType(the_geom)
FROM public.visitedcountries LIMIT 1;

-- ================
-- Create view on worldgrid
-- ================
CREATE VIEW visitedworldgrid AS
SELECT gid AS oid, the_geom AS the_geom, (100 * visits) / (SELECT maxvalue FROM stats WHERE tablename = 'worldgrid') AS visitsnormalized
FROM worldgrid
WHERE visits <> 0;

INSERT INTO geometry_columns(f_table_catalog, f_table_schema, f_table_name, f_geometry_column, coord_dimension, srid, "type")
SELECT '', 'public', 'visitedworldgrid', 'the_geom', ST_CoordDim(the_geom), ST_SRID(the_geom), GeometryType(the_geom)
FROM public.visitedworldgrid LIMIT 1;




