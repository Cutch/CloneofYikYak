jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};
function inputFocus(i){
	if(i.value==i.defaultValue){ i.value=""; i.style.color="#000000"; }
	else{ i.style.color="#000000"; }
}
function inputBlur(i){
	if(i.value==""){ i.value=i.defaultValue; i.style.color="#DCDCDC"; }
	else if(i.value==i.defaultValue){ i.style.color="#DCDCDC"; }
}
function registerKeyPress(event){
	if (event.keyCode==13){ 
		if(verified)
			register();
	}
}
function loginKeyPress(event){
	if (event.keyCode==13){ 
		login();
	}
}
function login(){
	var user=$('#username');
	var pass=$('#password');
	var json = {
		username: user.val(),
		password: pass.val()
	};
	$.ajax({
		url: 'login.php',
		data: json,
		type: 'PUT',
		dataType: "json",
		success: function(result) {
			if(result[0] == "ok"){
				loadPage("app.html");
			}else{
				$("#error").text(result[1]);
			}
		}
	});
}
var verified=false;
// Text Changed, reset to verify
function keypress(t){
	if(verified)
		$("#regButton").text("Verify");
	verified=false;
}
var checkmark = '<img class="errImg" src="img/check.png"/>';
var crossmark = '<img class="errImg" src="img/cross.png"/>';
function updateErrInfo(bool, fieldName){
	if(bool){
		var m = $("#"+fieldName+"marker");
		m.html(crossmark);
		m.visible();
		$("#"+fieldName+"check").show();
		return false;
	}else{
		var m = $("#"+fieldName+"marker");
		m.html(checkmark);
		m.visible();
		$("#"+fieldName+"check").hide();
		return true;
	}
}
var emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{2,4}$';
var passwordRegex = '^(?=.*\\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{4,}$';
var validate = [false, false, false, false, false];
function checkInput(input){
	switch(input.id){
		case "username":
			var json = { username: input.value };
			$.ajax({
				url: 'login.php',
				data: json,
				type: 'GET',
				dataType: "json",
				success: function(result) {
					var u = (result[1]&2)==2;					
					validate[0]=updateErrInfo(u || input.value == "Username", "username");
				}
			});
			break;
		case "password":
			validate[1]=updateErrInfo((input.value == "password" || input.value.length < 4 || input.value.match(passwordRegex) == null), "password");
			break;
		case "email":
			var json = { email: input.value };
			if(updateErrInfo(input.value == "E-Mail" || input.value.match(emailRegex) == null, "email"))
				$.ajax({
					url: 'login.php',
					data: json,
					type: 'GET',
					dataType: "json",
					success: function(result) {
						var e = (result[1]&1)==1;
						validate[2]=updateErrInfo(e, "email");
					}
				});
			break;
		case "gender":
			validate[3]=updateErrInfo(typeof $('input:radio[name=gender]:checked').val() === "undefined", "gender");
			break;
		case "province":
			province = input;
		case "city":
			if(typeof province === "undefined"){
				city = input;
				province = document.getElementById("province");
			}else
				city = document.getElementById("city");
			validate[4]=updateErrInfo(city.value == "City" || province.value == "", "city");
			break;
	}
	var i =0;
	verified = true;
	for(;i < 5; i++){
		if(!validate[i])verified=false;
	}
	if(verified) $("#regButton").text("Register");
}
function register(){
	if(!verified){
		$("input").each(function( i ) {
			checkInput($(this)[0]);
		});
		$("select").each(function( i ) {
			checkInput($(this)[0]);
		});
		return;
	}
	var username=$('#username');
	var password=$('#password');
	var email=$('#email');
	var gender=$('input:radio[name=gender]:checked');
	var province=$('#province');
	var city=$('#city');
	var json = {
		username: username.val(),
		password: password.val(),
		email: email.val(),
		gender: gender.val(),
		province: province.val(),
		city: city.val()
	};
	$.ajax({
		url: 'login.php',
		data: json,
		type: 'POST',
		dataType: "json",
		success: function(result) {
			if(result[0] == "ok"){
				loadPage("app.html");
			}else{
				$("#error").text(result[1]);
			}
		}
	});
}