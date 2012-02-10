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
-- users.sql
--
-- Create the tables used by the UserManagement plugin.
--
-- This table should be created within the mapshup database
--
-- ==================================================================

-- ==================
-- Table users
-- ==================
CREATE TABLE users (
    userid              SERIAL PRIMARY KEY,
    username            VARCHAR(32) UNIQUE NOT NULL,
    password            VARCHAR(32) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    lastcontextid       INTEGER DEFAULT -1,
    registrationdate    TIMESTAMP NOT NULL
);


