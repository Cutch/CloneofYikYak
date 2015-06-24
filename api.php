<?php
function addLikeToTable($dbconn, $userId, $msgId) {
	pg_prepare($dbconn, "insertLikes", "INSERT INTO yakLikes (userID, msgID) VALUES ($1, $2)");
	$sql = pg_execute($dbconn, "insertLikes", array($userId, $msgId));
	pg_prepare($dbconn, "updateLikes", "UPDATE yak SET likes=(likes+1) WHERE id = $1");
	$sql = pg_execute($dbconn, "updateLikes", array($msgId));
}
function removeLikeToTable($dbconn, $userId, $msgId) {
	pg_prepare($dbconn, "deleteLikes", "DELETE FROM yakLikes WHERE userID = $1 AND msgID = $2");
	$sql = pg_execute($dbconn, "deleteLikes", array($userId, $msgId));
	pg_prepare($dbconn, "updateLikes", "UPDATE yak SET likes=(likes-1) WHERE id = $1");
	$sql = pg_execute($dbconn, "updateLikes", array($msgId));
}
session_save_path("sesh");
session_start();
$method = $_SERVER['REQUEST_METHOD'];
$dbconn = pg_connect("")
				or die('Could not connect: ' . pg_last_error());
if(isset($_REQUEST['lat'])){
	$_SESSION['lat'] = $_REQUEST['lat'];
	$_SESSION['lon'] = $_REQUEST['lon'];
}
switch ($method) {
  case 'GET': // Get messages
    if(isset($_GET['replyCheck'])){ // Check for replies
		pg_prepare($dbconn, "getReplyMsg", "SELECT id, reply, numReply FROM yak WHERE reply = -1 AND id = ANY($1)");
		$msgList = pg_escape_string($_GET['msgList']);
		$sql = pg_execute($dbconn, "getReplyMsg", array("{".$msgList."}"));
		$arr = array();
		while($i = pg_fetch_row($sql)) {
			$arr[] = $i;
		}
		if($sql){
			$status = "ok";
			$errormessage = "none";
		}else{
			$status = "ok";
			$errormessage = pg_last_error();
		}
	}else{ // Get main forum messages / replies
		pg_prepare($dbconn, "getMsg", "SELECT name, lat, lon, likes, time, id, reply, numReply, msg FROM yak WHERE time > $1 AND reply = ANY($2) AND CASE WHEN reply = -1 THEN earth_distance(ll_to_earth(lat, lon), ll_to_earth($3, $4))/1000 < $5 ELSE TRUE END ORDER BY time DESC LIMIT 10");
		$time = pg_escape_string($_GET['time']);
		$reply = pg_escape_string($_GET['reply']);
		$lat = pg_escape_string($_GET['lat']);
		$lon = pg_escape_string($_GET['lon']);
		$dist = pg_escape_string($_GET['dist']);
		$sql = pg_execute($dbconn, "getMsg", array($time, "{".$reply."}", $lat, $lon, $dist));
		$arr = array();
		while($i = pg_fetch_row($sql)) {
			$arr[] = $i;
		}
		if($sql){
			$status = "ok";
			$errormessage = "";
		}else{
			$status = "ok";
			$errormessage = pg_last_error();
		}
	}
	$arr[] = $status;
	$arr[] = $errormessage;
	print json_encode($arr);
	break;
  case 'PUT': // Alter messages
    $putdata=file_get_contents('php://input');
	$_PUT = array();
	parse_str($putdata, $_PUT);
    if(!isset($_SESSION['username'])){
		$status = "fail";
		$errormessage = "Not Logged In.";
	}else{
		$msgId = pg_escape_string($_PUT['id']);
		$userId = pg_escape_string($_SESSION['userId']);
		$like = pg_escape_string($_PUT['like']);
		pg_prepare($dbconn, "checkLikes", "SELECT userID, msgID FROM yakLikes WHERE userID = $1 AND msgID = $2");
		$sql = pg_execute($dbconn, "checkLikes", array($userId, $msgId));
		if(pg_num_rows($sql) > 0){ // Check like in db
			if($like == "-1"){
				removeLikeToTable($dbconn, $userId, $msgId);
				$status = "ok";
				$errormessage = pg_last_error();
			}else{
				$status = "fail";
				$errormessage = "already liked";
			}
		}else {
			if($like == "-1"){
				$status = "fail";
				$errormessage = "already unliked";
			}else{
				addLikeToTable($dbconn, $userId, $msgId);
				$status = "ok";
				$errormessage = pg_last_error();
			}
		}
	}
	$arr = array($status,$errormessage);
	print json_encode($arr);
    break;
  case 'POST': // Add messages
    if(!isset($_SESSION['username'])){
		$status = "fail";
		$errormessage = "Not Logged In.";
	}else{
		pg_prepare($dbconn, "addMsg","INSERT INTO yak (name, msg, lat, lon, reply) VALUES ($1, $2, $3, $4, $5)");
		$user = pg_escape_string($_SESSION['username']);
		$msg = pg_escape_string($_POST['msg']);
		$lat = pg_escape_string($_POST['lat']);
		$lon = pg_escape_string($_POST['lon']);
		$reply = pg_escape_string($_POST['reply']);
		$sql = pg_execute($dbconn, "addMsg", array($user, $msg, $lat, $lon,$reply));
		if($sql){
			$status = "ok";
			$errormessage = "none";
			if($reply != "-1"){
				pg_prepare($dbconn, "updateMsg","UPDATE yak SET numReply=(numReply+1) WHERE id = $1");
				$sql = pg_execute($dbconn, "updateMsg", array($reply));
			}
		}else{
			$status = "ok";
			$errormessage = pg_last_error();
		}
	}
	$arr = array($status,$errormessage);
	print json_encode($arr);
    break;
}
pg_close($dbconn);
?>