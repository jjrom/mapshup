#!/bin/sh

# DB infos
db=mapshup
superuser=postgres
user=mspuser
password=m2siUdRpYY023

###### ADMIN ACCOUNT CREATION ######
psql -U postgres -d template1 << EOF
CREATE USER $user WITH PASSWORD '$password' NOCREATEDB;
EOF

# POSTGIS path
postgis=/usr/share/postgresql/8.4/contrib/postgis-1.5/postgis.sql

# Projections path
projections=/usr/share/postgresql/8.4/contrib/postgis-1.5/spatial_ref_sys.sql

# Make db POSTGIS compliant
createdb $db -U $superuser --o $user
createlang -U $superuser plpgsql $db
psql -d $db -U $superuser -f $postgis
psql -d $db -U $superuser -f $projections

###### BEGIN : PLUGINS ######

# USERMANAGEMENT
psql -d $db -U $superuser -f ./plugins/usermanagement/users.sql
psql -d $db -U $superuser -f ./plugins/usermanagement/keywords.sql

# LOGGER
psql -d $db -U $superuser -f ./plugins/logger/countries.sql
psql -d $db -U $superuser -f ./plugins/logger/worldgrid.sql
psql -d $db -U $superuser -f ./plugins/logger/logger.sql

###### END   : PLUGINS ######

# FUNCTION

psql -U $superuser -d $db << EOF

GRANT ALL ON geometry_columns to $user;
GRANT SELECT on spatial_ref_sys to $user;

GRANT SELECT,INSERT,UPDATE ON logger TO $user;
GRANT SELECT,UPDATE ON logger_gid_seq TO $user;
GRANT SELECT,UPDATE ON stats TO $user;

GRANT SELECT,INSERT,UPDATE ON contexts TO $user;
GRANT SELECT,UPDATE ON contexts_gid_seq TO $user;

GRANT SELECT,INSERT,UPDATE ON users TO $user;
GRANT SELECT,UPDATE ON users_userid_seq TO $user;

GRANT SELECT,UPDATE ON countries TO $user;
GRANT SELECT ON visitedcountries TO $user;

GRANT SELECT,UPDATE ON worldgrid TO $user;
GRANT SELECT ON visitedworldgrid TO $user;

GRANT SELECT,INSERT,UPDATE ON keywords TO $user;
GRANT SELECT,UPDATE ON keywords_gid_seq TO $user;

EOF

# VACCUM
vacuumdb --full --analyze -U $superuser $db

