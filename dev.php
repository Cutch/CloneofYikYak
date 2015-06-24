<?php
session_save_path("sesh");
session_start();
$method = $_SERVER['REQUEST_METHOD'];
switch ($method) {
  case 'GET': // Logout
	unset($_SESSION['username']);
	break;
  case 'PUT': // Alter messages
    break;
  case 'POST': // Remove position data
	unset($_SESSION['lat']);
	unset($_SESSION['lon']);
	$arr = array("ok");
	print json_encode($arr);
    break;
}
?>