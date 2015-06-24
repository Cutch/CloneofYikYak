var positionLL = null;
var newRequest="1999-01-01";
var lastRequest=newRequest;
var oldestRequest=newRequest;
var firstRun=true;
var arr = Object.create(null);
function loadPage(page){
	$("input").each(function( i ) {
		var id = $(this).attr("id");
		if($(this).attr("type") == "radio"){
			arr[id] = this.checked;
		}else{
			arr[id] = $(this).val();
			arr[id+"d"] = this.defaultValue;
		}
	});
	$("select").each(function( i ) {
		var id = $(this).attr("id");
		arr[id] = this.selectedIndex;
	});
	$( "#body" ).load( page, function(){
		$("input").each(function( i ) {
			var id = $(this).attr("id");
			if($(this).attr("type") == "radio"){
				this.checked  = arr[id];
			}else{
				if ($(this).attr("id") in arr){
					$(this).val(arr[id]);
					$(this).css("color", "#000000");
					this.defaultValue = arr[id+"d"];
				}
				$(this).focus();
				$(this).blur();
			}
		});
		$("select").each(function( i ) {
			var id = $(this).attr("id");
			this.selectedIndex = arr[id];
		});
		if(page == "app.html"){
			onLogin();
		}
	} );
}
function postalKeyPress(event){
	if (event.keyCode==13){ 
		getLocFromPostal();
	}
}
function selectDist(){
	 document.getElementById("distIn").selectedIndex = distSelect;
}
function onLogin(){
	var wpid = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
	selectDist();
}
function geoSuccess(position) {
  positionLL = [position.coords.latitude,position.coords.longitude];
  createMap(positionLL);
}
var map;
var latLong;
function createMap(position) {  
	latLong = new google.maps.LatLng(position[0],position[1]);
	var mapOptions = {
		zoom: 14, center: latLong, mapTypeControl: false, panControl: false,
		zoomControl: false, scaleControl: false, draggable: false, scrollwheel: false
	};
	map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
	var marker = new google.maps.Marker({
		position: latLong,
		map: map,
		title: 'Location'
	});
	if(firstRun){getNewMessage();firstRun=false;}
	google.maps.event.addDomListener(window, 'resize', function() {
		map.setCenter(latLong);
	});
}
var geoOptions = {
  enableHighAccuracy: true, 
  maximumAge        : 30000, 
  timeout           : 27000
};
function getLocFromPostal(){
    $.get("https://geocoder.ca?postal="+document.getElementById('postalbox').value, function(data, status){
		var ll = $('strong:last', $(data)).html();
		positionLL=ll.split(", ");
		createMap(positionLL);
		hidePostalBox();
	});
}
function addMessage(){
	hideNewMessageForm();
	if(positionLL == null){
		alert("Waiting for position information.");
		return;
	}
	var msgBox=document.getElementById('message');
	var reply=document.getElementById('newMsg-reply').value;
	var json = {
		msg: msgBox.value,
		lat: positionLL[0],
		lon: positionLL[1],
		time: lastRequest,
		reply: reply
	};
	$.ajax({
		url: 'api.php',
		data: json,
		type: 'POST',
		dataType: "json",
		success: function(result) {
			if(result[0] == "fail"){
				alert(result[1]);
				loadPage("login.html");
			}
		}
	});
	msgBox.value="";
	rotate();
	if(reply == "-1")
		getNewMessage();
	else
		refreshReplyCount();
	$("#newMsg-reply").val(-1);
}
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}
var times = ["s", "m", "h", "d"];
function timeDiff(t){
	var x=0;
	var diff = Math.floor((Date.now()-t)/1000);
	if(diff/60 < 1)
		return diff+times[0];
	diff=Math.floor(diff/60);
	if(diff/60 < 1)
		return diff+times[1];
	diff=Math.floor(diff/60);
	if(diff/24 < 1)
		return diff+times[2];
	diff=Math.floor(diff/24);
	return diff+times[3];
}
function like(obj, like){
	var likeNum;
	if(like == 1)
		likeNum = $(obj).next().next();
	else
		likeNum = $(obj).prev().prev();
	var parent = obj.parentNode.parentNode;
	var json = {
		id: parent.id,
		like: like
	};
	$.ajax({
		url: 'api.php',
		data: json,
		type: 'PUT',
		dataType: "json",
		success: function(result) {
			alert(result);
			if(result[0] == "ok"){
				likeNum.text(parseInt(likeNum.text())+like);
			}
		}
	});
}
var loadedMsgs = [];
function refreshReplyCount(){
	if(loadedMsgs.length == 0) return;
	var string = loadedMsgs[0];
	var i =1;
	for(;i<loadedMsgs.length; i++){
		string+=","+loadedMsgs[i];
	}
	var json = {
		msgList: string,
		replyCheck: 1
	};
	$.ajax({
		url: 'api.php',
		data: json,
		type: 'GET',
		dataType: "json",
		success: function(result) {
			var i = 0;
			for (; i < result.length-2; i++) {
				s = result[i];
				if(s[2] != 0){
					var r = $("#"+s[0]).find("#reply-count");
					if(r.length){
						r.text(s[2]);	
					}
					else{
						$("#"+s[0]).find("#replyBox").html('<span class="dash">&nbsp&nbsp&#8212;&nbsp&nbsp</span><span onclick="getNewMessage('+s[0]+');" class="reply">Show Replies (<span id="reply-count">'+s[2]+'</span>)</span>');
					}
				}
			}
		}
	});
}
function hideReplies(id){
	var idDiv=$("#"+id);
	idDiv.next().html("");
	idDiv.find(".reply-toggle").text("Show").parent().attr("onclick", 'getNewMessage('+id+');rotate();');
	delete replyTimes[id];
	var i = 1;
	for(; i < replyRead.length; i++)
		if(replyRead[i] == id){
			replyRead.splice(i, 1);
			break;
		}
			
}
var replyRead = [-1];
var replyTimes = [];
function getNewMessage(id, t){
	var firstTimeReplyLoad = false;
	if(positionLL == null)
		return;
	var time;
	if(typeof id === "undefined"){
		var i = 1;
		id=replyRead[0];
		for(; i < replyRead.length; i++)
			id+=","+replyRead[i];
		time=lastRequest;
	}
	else {
		if(typeof replyTimes[id] === "undefined"){ // Happens first time "show replies" is clicked
			time=newRequest;
			replyRead.push(id);
			firstTimeReplyLoad = true;
		}
		$("#"+id).find(".reply-toggle").text("Hide").parent().attr("onclick", "hideReplies("+id+")");
	}
	var dist = $("#distIn").val();
	if(dist==0) dist = 999999;
	if(typeof t !== "undefined")time=t;
	var json = {
		lat: positionLL[0],
		lon: positionLL[1],
		dist: dist,
		time: time,
		reply: id
	};
	$.ajax({
		url: 'api.php',
		data: json,
		type: 'GET',
		dataType: "json",
		success: function(result) {
			var i=result.length-3;
			var i2=0;
			var html="";
			if(!firstTimeReplyLoad){
				epochLast = Date.parse(lastRequest);
				epochOld = Date.parse(oldestRequest);
			}
			for (; i >= 0; i--) {
				s = result[i];
				s[4] = s[4].replace(' ', 'T');
				if(!firstTimeReplyLoad){
					if(i == (result.length-3)){
						if(epochOld > Date.parse(s[4]))
							oldestRequest = s[4];
					}
					if(i == 0)
						if(epochLast < Date.parse(s[4]))
							lastRequest = s[4];
				}
				if(s[6] == "-1"){ // A posted Message
					loadedMsgs.push(s[5]);
					html+='<div class="msg-row" id='+s[5]+'>';
					var msg="";
					for (i2=8; i2 < s.length; i2++) msg+=s[i2];
					html+='<div class="msg">'+msg+'</div>';
					html+='<div class="sbs"><div class="time"><img src="img/clock.png"/><div id="diff" class="diff">'+timeDiff(Date.parse(s[4]))+'</div><div class="timestamp">'+Date.parse(s[4])+'</div></div>';
					html+='<div class="likes"><img class="likeButton" src="img/arrow-up.png" onclick="like(this, 1);"/><br><span>'+s[3]+'</span><br><img class="likeButton" onclick="like(this, -1);" src="img/arrow-down.png"/></div></div>';
					html+='<div class="namebox"><span class="name">'+s[0]+'</span><span class="dash">&nbsp&nbsp&#8212;&nbsp&nbsp</span><span onclick="replyTo(this, event);" class="reply">reply</span><span id="replyBox">';
					if(s[7] != 0)
						html+='<span class="dash">&nbsp&nbsp&#8212;&nbsp&nbsp</span><span onclick="getNewMessage('+s[5]+');rotate();" class="reply"><span class="reply-toggle">Show</span> Replies (<span id="reply-count">'+s[7]+'</span>)</span></div></span>';
					else
						html +='</span></div>';
					html+='</div><div id="reply-div"></div>';
					document.getElementById("messages").innerHTML=html+document.getElementById("messages").innerHTML;
				}else{ // A replied message
					if(firstTimeReplyLoad && i == 0){
						epochLast = Date.parse(lastRequest);
						if(epochLast < Date.parse(s[4]))
							lastRequest = s[4];
						replyTimes[id] = s[4];
					}
					var replyDiv = $("#"+s[6]).next();
					
					html+='<div class="reply-msg-row" id='+s[5]+'>';
					html+='<div class="reply-arrow"><img src="img/reply-arrow.png"/></div>';
					var msg="";
					for (i2=8; i2 < s.length; i2++) msg+=s[i2];
					html+='<div class="reply-msg">'+msg+'</div>';
					html+='<div class="sbs"><div class="reply-time"><img src="img/clock.png"/><div id="diff" class="diff">'+timeDiff(Date.parse(s[4]))+'</div><div class="timestamp">'+Date.parse(s[4])+'</div></div>';
					html+='<div class="likes"><img class="smallLikeButton" onclick="like(this, 1);" src="img/arrow-up.png"/><br><span>'+s[3]+'</span><br><img class="smallLikeButton" onclick="like(this, -1);" src="img/arrow-down.png"/></div></div>';
					html+='<div class="reply-namebox"><span class="name">'+s[0]+'</span></div>';
					html+='</div><div id="reply-div"></div>';
					replyDiv.html(html+replyDiv.html());
				}
				html = "";
			}
		}
	});
}
function distChange(){
	lastRequest=newRequest;
	oldestRequest=newRequest;
	firstRun=true;
	loadedMsgs = [];
	replyRead = [-1];
	replyTimes = [];
	document.getElementById("messages").innerHTML="";
	refreshMsg();
}
function replyTo(reply, event){
	var user = $(reply).prev().prev().text();
	var parent = reply.parentNode.parentNode;
	showNewMessageForm(event, "Reply to "+user, parent.id);
}
var rotating = false;
function rotate(){
	if(rotating)return;
    var refresh = $("#refresh");
    rotating = true;
    $({deg: 0}).animate({deg: 1440}, {
        duration: 2000,
        step: function(i){
            refresh.css({ transform: "rotate("+i+"deg)" });
        },
		complete:function(){
            rotating = false;
        }
    });
}
function updateLikes(id, likes){
	var json = {
		id: id,
		likes: likes
	};
	$.ajax({
		url: 'api.php',
		data: json,
		type: 'PUT',
		dataType: "json",
		success: function(result) {
			alert(result);
		}
	});
}
var newMsgShow=false;
function showNewMessageForm(event, title, replyId){
	if(typeof title === "undefined")title="New Message";
	if(typeof replyId === "undefined")replyId=-1;
	$("#newMsg-top").text(title);
	$("#newMsg-reply").val(replyId);
	if(!newMsgShow){
		$("#newMsg").slideToggle("slow", function(){
		$("#message").focus();
		});
	}
	newMsgShow=true;
	event.stopPropagation();
}
function hideNewMessageForm(){
	if(newMsgShow)
		$("#newMsg").slideToggle("slow");
	newMsgShow=false;
}
function textChanged(msg){
	document.getElementById("charLeft").innerHTML=200-msg.value.length;
}
function showPostalBox(){
	$("#postal-pos").show();
}
function hidePostalBox(){
	$("#postal-pos").hide();
}
function refreshMsg(){
	getNewMessage();
	rotate();
}
setTimeout(function(){
	setInterval(function(){ 
		refreshReplyCount();
	}, 30000);
}, 15000);
setInterval(function(){ 
	$(".diff").each(function( i ) {
		$(this).text(timeDiff($(this).next().text()));
	});
}, 30000); 
setInterval(function(){ 
	refreshMsg();
}, 60000); 
$(document).on('click', function(e){
	hideNewMessageForm();
});

/* Dev function to unset data */
function devUnset(){
	$.ajax({
		url: 'dev.php',
		type: 'POST',
		success: function(result) {
			alert("Refresh page now.");
		}
	});
}
function devLogout(){
	$.ajax({
		url: 'dev.php',
		type: 'Get',
		success: function(result) {
			alert("Refresh page now.");
		}
	});
}