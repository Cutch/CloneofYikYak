<?php
session_save_path("sesh");
session_start();
$method = $_SERVER['REQUEST_METHOD'];
$dbconn = pg_connect("")
				or die('Could not connect: ' . pg_last_error());
switch ($method) {
  case 'PUT': // Login
    $putdata=file_get_contents('php://input');
	$_PUT = array();
	parse_str($putdata, $_PUT);
	pg_prepare($dbconn, "login", "SELECT username, id FROM yaklog WHERE username = $1 AND password = $2");
	$username = pg_escape_string($_PUT['username']);
	$password = pg_escape_string($_PUT['password']);
	$sql = pg_execute($dbconn, "login", array($username, $password));
	if(pg_num_rows($sql) > 0){
		$status = "ok";
		$errormessage = "none";
		$id = pg_fetch_result($sql, 0, 1);
		$_SESSION['username'] = $username;
		$_SESSION['userId'] = $id;
	}else{
		$status = "fail";
		$errormessage = "Login Failed";
	}
	$arr = array($status,$errormessage);
	print json_encode($arr);
    break;
  case 'GET': // Verify Register
	pg_prepare($dbconn, "testLog", "SELECT username, email, gender, city, province FROM yaklog WHERE username = $1 OR email = $2");
	$username = pg_escape_string($_GET['username']);
	$email = pg_escape_string($_GET['email']);
	$sql = pg_execute($dbconn, "testLog", array($username, $email));
	if(pg_num_rows($sql) > 0){
		$status = "fail";
		$usertest = pg_fetch_result($sql, 0, 0);
		$emailtest = pg_fetch_result($sql, 0, 1);
		$errormessage = (($usertest==$username)*2)+($emailtest==$email);
	}else{
		$status = "ok";
		$errormessage = 0;
	}
	$arr = array($status,$errormessage);
	print json_encode($arr);
    break;
  case 'POST': // Register
	pg_prepare($dbconn, "reg","INSERT INTO yaklog (username, password, email, gender, province, city) VALUES ($1, $2, $3, $4, $5, $6)");
	$username = pg_escape_string($_POST['username']);
	$password = pg_escape_string($_POST['password']);
	$email = pg_escape_string($_POST['email']);
	$gender = pg_escape_string($_POST['gender']);
	$province = pg_escape_string($_POST['province']);
	$city = pg_escape_string($_POST['city']);
	if($username == "" || $password == "" || $email == "" || $gender == "" || $province == "" || $city == ""){
		$status = "fail";
		$errormessage = "Blank Field."; // Outputted on hacking attempt, don't need to check
	}
	else{
		$sql = pg_execute($dbconn, "reg", array($username, $password, $email, $gender, $province, $city));
		if($sql){
			$status = "ok";
			$errormessage = "none";
			$_SESSION['username'] = $username;
		}else{
			$status = "fail";
			$errormessage = pg_last_error();
		}
	}
	$arr = array($status,$errormessage);
	print json_encode($arr);
    break;
}
pg_close($dbconn);
?>