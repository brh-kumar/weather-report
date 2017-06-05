$(document).ready(function(){
	var apiUrl = "https://api.apixu.com/v1/forecast.json?key=177d15a9bd724b8a934153041170406&q=";
	var lat;
	var lon;

	// To get latitude and longitude of the user's current location
	if (navigator.geolocation) {
    		navigator.geolocation.getCurrentPosition(getGeoCoords, errorInGetGeoLocation);
  	} 

	// Concatinating latitude and longitude with apiUrl to fetch data
	function getGeoCoords(position) {
		lat  = position.coords.latitude;
		lon = position.coords.longitude;
		fetchAndRenderData(apiUrl + lat + ',' + lon);
	}

	function errorInGetGeoLocation(e){
	    handleError({error: {message: (e && e.message === 'User denied Geolocation' && 'Please enable location acess') || 'Geolocation not found!'} })
	}
});

function fetchAndRenderData(url){
	var response = $.getJSON(url);
	
	response.complete(function(data) {
		if(data.status === 200){
			renderData(data.responseJSON);
		} else {
			handleError(data.responseJSON);
		}
	});
}

function handleError(data) {
	console.log(data)
	var dataContainer = $('.js-weather-data-container');
	dataContainer.append('<div class="error"><h2 class="text-center">' + (data && data.error && data.error.message) || 'Somthing went wrong please try again!' + '</h2></div>');

	$('.heading').addClass('hidden');
	$('#js-chart-container').addClass('hidden');
}

function renderData(data){
	var dataContainer = $('.js-weather-data-container');
	var currentWeatherContainer = $('.js-current-weather-container');
	var weatherInfo = '';
	var tempContainer = '';
	var hourData  = data.forecast.forecastday[0].hour;
	var maxAndMinTemp = getMinAndMaxTemp(hourData);
	var minTemp = maxAndMinTemp.min;
	var maxTemp = maxAndMinTemp.max; 
	
	// Rendering current weather info
	currentWeatherContainer.append('<div class="current-weather-info">Current weather info</div>');
	currentWeatherContainer.append('<div><img src="https:' + data.current.condition.icon + '"><div class="current-temp">' + data.current.temp_c + '&#8451</div></div>');
	currentWeatherContainer.append('<div class="">' + data.current.condition.text + '</div>');
	currentWeatherContainer.append('<div class="">' + getFormatedDate(data.current.last_updated_epoch, 'hh:mm:ss A  DD/MMM/YY ') + '</div>');
	currentWeatherContainer.append(
		'<table class="table table-bordered table-striped">'+
	    	'<tbody class="js-weather-info"></tbody>'+
		'</table>'
	);

	// Rendering location and other weather details inlcuding max temperature and min temperature of the day
    	weatherInfo = $('.js-weather-info');
	weatherInfo.append('<tr class="weather-info-row"><td>Min Temperature</td><td>' + minTemp.temp_c + '&#8451 ('+ getFormatedDate(minTemp.time_epoch, 'hh:mm A') + ')</td></tr>');
	weatherInfo.append('<tr class="weather-info-row"><td>Max Temperature</td><td>' + maxTemp.temp_c + '&#8451 ('+ getFormatedDate(maxTemp.time_epoch, 'hh:mm A')+ ')</td></tr>');
	weatherInfo.append('<tr class="weather-info-row"><td>Humidity</td><td>' + data.current.humidity + ' %</td></tr>');
	weatherInfo.append('<tr class="weather-info-row"><td>City</td><td>' + data.location.name + '</td></tr>');
	weatherInfo.append('<tr class="weather-info-row"><td>Religion</td><td>' + data.location.region + '</td></tr>');
	weatherInfo.append('<tr class="weather-info-row"><td>Country</td><td>' + data.location.country + '</td></tr>');
	weatherInfo.append('<tr class="weather-info-row"><td>Geo</td><td>' + data.location.lat + ', ' + data.location.lon + '</td></tr>');

	// Pass hourly data of the day to renderGraph function to render data with Highcharts
	renderGraph(hourData);

	// Sorting data according to temperature in increasing order
	hourData = _.sortBy(hourData, 'temp_c');

	// Redndering Temperature table with increasing temperature order 
	// Time - Time of the day
	// Degree Celsius - Temperature in degree celsius
	// Degree Fahrenheit - Temperature in degree fahrenheit
	dataContainer.append(
		'<table class="table table-bordered">'+
			'<thead>'+
			'<tr><th colspan="3">Temperature in Increasing Order</th></tr>'+
		      '<tr>'+
		        '<th>Time</th>'+
		        '<th>Degree Celsius (&#8451)</th>'+
		        '<th>Degree Fahrenheit (&#8457)</th>'+
		      '</tr>'+
	    	'</thead>'+
	    	'<tbody class="js-temp-container">'+
    		'</tbody>'+
		'</table>'
	);
	tempContainer = $('.js-temp-container');
	$.each(hourData, function(){
		tempContainer.append('<tr> class="temperature-row"><td>'+ getFormatedDate(this.time_epoch, 'hh:mm:ss A') + '</td><td>' + this.temp_c +' &#8451</td><td>' + this.temp_f +' &#8457</td></tr>')
	});
}

// To findout max and min temperature of the day
function getMinAndMaxTemp(list) {
	var doc = {};

	doc['max'] = doc['min'] = list[0];
	for (var i = 1; i < list.length; i++) {
		if (list[i].temp_c < doc.min.temp_c) doc['min']  = list[i];
	    	if (list[i].temp_c > doc.max.temp_c) doc['max'] = list[i];
	}

	return doc;
}

function getFormatedDate(value, format) {
	return moment.unix(value).format(format);
}

function renderGraph(data) {
	var chartData = {};

	// Formating the data acroding to the Highcharts params
	//  X Axis - temperature
	//  YAxis - time in hours
	data = data.map(function (elem) {
		return [elem.temp_c, parseInt(moment.unix(elem.time_epoch).format('H HH'))];
	});

	// Initializing the Highcharts  
	chartData['chart'] = { type: 'line' };
	chartData['title'] = { text: 'Temperature of the day' };
	
	// X Axis
	chartData['xAxis'] = {};
	chartData['xAxis']['title'] = { enabled: true, text: 'Temperature' };
	chartData['xAxis']['labels'] = {formatter: function () { return this.value + String.fromCharCode(176) + 'C'; } };
	chartData['xAxis']['maxPadding'] = 0.01;
	chartData['xAxis']['showLastLabel'] = true;	

	// Y Axis 
	chartData['yAxis'] = {};
	chartData['yAxis']['title'] = { text: 'Time of the day' };
	chartData['yAxis']['labels'] = { formatter: function () { return this.value + 'h'; } };
	chartData['yAxis']['min'] = 0;
	chartData['yAxis']['max'] = 24;
	chartData['yAxis']['tickInterval'] = 4;

	// Tooltips
	chartData['tooltip'] = {};
	chartData['tooltip']['crosshairs'] = true;
	chartData['tooltip']['headerFormat'] = '<b>{series.name}</b><br/>';
	chartData['tooltip']['pointFormat'] = '{point.x}' + String.fromCharCode(176) + 'C : {point.y}h';

	// Plot options and Series 
	chartData['plotOptions'] = { series: { step: 'right' } };
	chartData['series'] = [{name: 'Temperature', data: data}];

	Highcharts.chart('js-chart-container', chartData);
}