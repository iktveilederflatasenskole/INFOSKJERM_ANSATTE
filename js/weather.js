

$(document).ready(function() {
  $.simpleWeather({
    location: '',
    woeid: '865157', //865157
    unit: 'c',
    success: function(weather) {
      temp = +weather.forecast[0].high+'&deg';
      wcode = '<img class="weathericon" src="images/weathericons/' + weather.forecast[0].code + '.svg">';
      temp1 = +weather.forecast[1].high+'&deg';
      wcode1 = '<img class="weathericon" src="images/weathericons/'+weather.forecast[1].code+'.svg">';
      temp2 = +weather.forecast[2].high+'&deg';
      wcode2 = '<img class="weathericon" src="images/weathericons/'+weather.forecast[2].code+'.svg">';

      $(".temp").html(temp);
      $(".clim").html(wcode);
      $(".temp1").html(temp1);
      $(".clim1").html(wcode1);
      $(".temp2").html(temp2);
      $(".clim2").html(wcode2);
      
    },
    
    error: function(error) {
      $(".error").html('<p>' + error + '</p>');
    }
  });
});