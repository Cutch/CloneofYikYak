<?php
session_save_path("sesh");
session_start();

?>
<html>
<head>
<meta name="viewport" content="user-scalable=no" />
<script src="https://code.jquery.com/jquery-1.10.2.js"></script>
<script src="https://maps.googleapis.com/maps/api/js"></script>
<title>Yakity Yak</title>
<link rel="stylesheet" type="text/css" href="app.css">
<link rel="stylesheet" type="text/css" href="login.css">
<script>
var distSelect = <?php
	if(!isset($_SESSION['dist'])) $_SESSION['dist'] = 1;
	print $_SESSION['dist'];
?>;
function geoError() {
<?php
  if (!isset($_SESSION['lat'])){
	echo 'showPostalBox();';
  } else {
	echo "positionLL = [".$_SESSION['lat'].",".$_SESSION['lon']."];
	createMap(positionLL);";
  }
?>
}
</script>
<script type="text/javascript" src="app.js"></script>
<script type="text/javascript" src="login.js"></script>
</head>
<?php
session_save_path("sesh");
session_start();
if(isset($_SESSION['username'])){
	echo '<body onload="onLogin();"><div id="body">';
	echo file_get_contents("app.html");
	echo '</div></body>';
}else{
	echo '<body><div id="body">';
	echo file_get_contents("login.html");
	echo '</div></body>';
}
?>
</html>