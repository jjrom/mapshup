<?php
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

/*
 * Mandatory script !
 */
include_once 'config.php';
include_once 'functions/LightOpenID.class.php';

/*
 * User credentials are stored within the user session
 */
session_start();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>                    
        <title>mapshup login</title>
        <link rel="shortcut icon" href="./favicon.ico" />
    </head>
    <body>
        <!-- jquery -->
        <script type="text/javascript" src="js/mjquery/mjquery.js"></script>
        <script type="text/javascript">
            $(document).ready(function () {
                msp.load();
            });
        </script>
    </body>
</html>
<?php
/*
 * Launch an OpenID authentication request
 */
try {

    /*
     * The domain name is set to MSP_DOMAIN defined in
     * the config.php file
     */
    $openid = new LightOpenID(MSP_DOMAIN, array(
                'use_proxy' => MSP_USE_PROXY,
                'proxy_url' => MSP_PROXY_URL,
                'proxy_port' => MSP_PROXY_PORT,
                'proxy_user' => MSP_PROXY_USER,
                'proxy_password' => MSP_PROXY_PASSWORD));

    if (!$openid->mode) {

        if (isset($_GET['login'])) {
            $openid->identity = 'http://localhost/~jrom/oids/examples/server/server.php';
            //$openid->identity = 'https://www.google.com/accounts/o8/id';
            $openid->required = array(
                'namePerson/friendly',
                'namePerson/first',
                'namePerson/last',
                'contact/email'
            );
            header('Location: ' . $openid->authUrl());
        }
        /*
          if (isset($_POST['openid_identifier'])) {
          $openid->identity = $_POST['openid_identifier'];
          # The following two lines request email, full name, and a nickname
          # from the provider. Remove them if you don't need that data.
          $openid->required = array('contact/email');
          $openid->optional = array('namePerson', 'namePerson/friendly');
          header('Location: ' . $openid->authUrl());
          } */
        ?>
        <form action="?login" method="post">
            <button>Login with Google</button>
        </form>
        <!--
                <form action="" method="post">
                    OpenID: <input type="text" name="openid_identifier" /> <button>Submit</button>
                </form>
        -->
        <?php
    } else if ($openid->mode == 'cancel') {
        echo 'User has canceled authentication!';
    }
    
    /*
     * Authentication is valid
     * Store user information within :
     *  - the mapshup database for contexts saving
     *  - the user session to avoid systematic authentification 
     */
    else if ($openid->validate()) {

        /*
         * Get attributes
         */
        $openID_data = $openid->getAttributes();
        
        /*
         * Store user information in user session
         */
        $_SESSION["email"] = $openID_data["contact/email"];
        $_SESSION["firstName"] = $openID_data["namePerson/first"];
        $_SESSION["lastName"] = $openID_data["namePerson/last"];
        $_SESSION["userName"] = $openID_data["namePerson/friendly"];
        
        /*
         * Store user information in mapshup database
         */
        // TODO
        
        /*
         * Tell mapshup that user is authenticated
         */
        // TODO
        echo 'Hello ' . $_SESSION["userName"];
    }
} catch (ErrorException $e) {
    echo $e->getMessage();
}
?>