/**
 * Format Google Calendar JSON output into human readable list
 *
 * Copyright 2015, Milan Kacurak
 *
 */
var formatGoogleCalendar = (function() {

    'use strict';

    var config;

    //Gets JSON from Google Calendar and transfroms it into html list items and appends it to past or upcoming events list
    var init = function(settings) {
        var result = [];

        config = settings;

        //Get JSON, parse it, transform into list items and append it to past or upcoming events list
        jQuery.getJSON(settings.calendarUrl, function(data) {
            // Remove any cancelled events
            data.items.forEach(function removeCancelledEvents(item) {
                if (item && item.hasOwnProperty('status') && item.status !== 'cancelled') {
                    result.push(item);
                }
            });

            result.sort(comp).reverse();

            var pastCounter = 0,
                upcomingCounter = 0,
                pastResult = [],
                upcomingResult = [],
                upcomingResultTemp = [],
                $upcomingElem = jQuery(settings.upcomingSelector),
                $pastElem = jQuery(settings.pastSelector),
                i;

            if (settings.pastTopN === -1) {
                settings.pastTopN = result.length;
            }

            if (settings.upcomingTopN === -1) {
                settings.upcomingTopN = result.length;
            }

            if (settings.past === false) {
                settings.pastTopN = 0;
            }

            if (settings.upcoming === false) {
                settings.upcomingTopN = 0;
            }

            for (i in result) {

                if (isPast(result[i].end.dateTime || result[i].end.date)) {
                    if (pastCounter < settings.pastTopN) {
                       pastResult.push(result[i]);
                       pastCounter++;
                    }
                } else {
                    upcomingResultTemp.push(result[i]);
                }
            }

            upcomingResultTemp.reverse();

            for (i in upcomingResultTemp) {
                if (upcomingCounter < settings.upcomingTopN) {
                    upcomingResult.push(upcomingResultTemp[i]);
                    upcomingCounter++;
                }
            }

            for (i in pastResult) {
                $pastElem.append(transformationList(pastResult[i], settings.itemsTagName, settings.format));
            }

            for (i in upcomingResult) {
                $upcomingElem.append(transformationList(upcomingResult[i], settings.itemsTagName, settings.format));
            }

            if ($upcomingElem.children().length !== 0) {
                jQuery(settings.upcomingHeading).insertBefore($upcomingElem);
            }

            if ($pastElem.children().length !== 0) {
                jQuery(settings.pastHeading).insertBefore($pastElem);
            }

        });
    };

    //Compare dates
    var comp = function(a, b) {
        return new Date(a.start.dateTime || a.start.date).getTime() - new Date(b.start.dateTime || b.start.date).getTime();
    };

    //Overwrites defaultSettings values with overrideSettings and adds overrideSettings if non existent in defaultSettings
    var mergeOptions = function(defaultSettings, overrideSettings){
        var newObject = {},
            i;
        for (i in defaultSettings) {
            newObject[i] = defaultSettings[i];
        }
        for (i in overrideSettings) {
            newObject[i] = overrideSettings[i];
        }
        return newObject;
    };

    //Get all necessary data (dates, location, summary, description) and creates a list item
    var transformationList = function(result, tagName, format) {
        var dateStart = getDateInfo(result.start.dateTime || result.start.date),
            dateEnd = getDateInfo(result.end.dateTime || result.end.date),
            dateFormatted = getFormattedDate(dateStart, dateEnd),
            output = '<' + tagName + '>',
            summary = result.summary || '',
            description = result.description || '',
            newDescription = description.replace(/\n/g, "<br />") || '',
            location = result.location || '',
            i;

        for (i = 0; i < format.length; i++) {

            format[i] = format[i].toString();

            if (format[i] === '*summary*') {
                output = output.concat('<span class="summary">' + summary + '</span>' + '<br>');
            } else if (format[i] === '*date*') {
                output = output.concat('<span class="date">' + dateFormatted + '</span>' + '<br><br>');
            } else if (format[i] === '*description*') {
                output = output.concat('<span class="description">' + newDescription + '</span>' + '<br>');
            } else if (format[i] === '*location*') {
                output = output.concat('<span class="location">' + location + '</span>');
            } else {
                if ((format[i + 1] === '*location*' && location !== '') ||
                    (format[i + 1] === '*summary*' && summary !== '') ||
                    (format[i + 1] === '*date*' && dateFormatted !== '') ||
                    (format[i + 1] === '*description*' && description !== '')) {

                    output = output.concat(format[i]);
                }
            }
        }
        $("#eventsUpcoming").hide();

        return output + '</' + tagName + '>';
        
    };

    //Check if date is later then now
    var isPast = function(date) {
        var compareDate = new Date(date),
            now = new Date();

        if (now.getTime() > compareDate.getTime()) {
            return true;
        }

        return false;
    };

    //Get temp array with information abou day in followin format: [day number, month number, year]
    var getDateInfo = function(date) {
        date = new Date(date);
        return [date.getDate(), date.getMonth(), date.getFullYear(), date.getHours(), date.getMinutes()];
    };

    //Get month name according to index
    var getMonthName = function(month) {
        var monthNames = [
            'januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'
        ];

        return monthNames[month];
    };

    //Transformations for formatting date into human readable format
    var formatDateSameDay = function(dateStart, dateEnd) {
        var formattedTime = '';

        if (config.sameDayTimes) {
            formattedTime = getFormattedTime(dateStart) + ' - ' + getFormattedTime(dateEnd);
        }

        //day. month, time-time
        return dateStart[0] + '. ' + getMonthName(dateStart[1]) + ', ' + formattedTime;
    };

    var formatDateDifferentDay = function(dateStart, dateEnd) {
        //day. - day.
        return dateStart[0] + '. - ' + dateEnd[0] + '. ' + getMonthName(dateStart[1]);
    };

    var formatDateDifferentMonth = function(dateStart, dateEnd) {
        //day. month - day. month
        return dateStart[0] + '. ' + getMonthName(dateStart[1]) + ' - ' + dateEnd[0] + '. ' + getMonthName(dateEnd[1]) + ' - '
    };

    var formatDateDifferentYear = function(dateStart, dateEnd) {
        //day. month - day. month
        return dateStart[0] + '. ' + getMonthName(dateStart[1]) + '-' + dateEnd[0] + '. ' + getMonthName(dateEnd[1]);
    };

    //Check differences between dates and format them
    var getFormattedDate = function(dateStart, dateEnd) {
        var formattedDate = '';

        if (dateStart[0] === dateEnd[0]) {
            if (dateStart[1] === dateEnd[1]) {
                if (dateStart[2] === dateEnd[2]) {
                    //month day, year
                    formattedDate = formatDateSameDay(dateStart, dateEnd);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd);
                }
            } else {
                if (dateStart[2] === dateEnd[2]) {
                    //month day - month day, year
                    formattedDate = formatDateDifferentMonth(dateStart, dateEnd);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd);
                }
            }
        } else {
            if (dateStart[1] === dateEnd[1]) {
                if (dateStart[2] === dateEnd[2]) {
                    //month day-day, year
                    formattedDate = formatDateDifferentDay(dateStart, dateEnd);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd);
                }
            } else {
                if (dateStart[2] === dateEnd[2]) {
                    //month day - month day, year
                    formattedDate = formatDateDifferentMonth(dateStart, dateEnd);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd);
                }
            }
        }

        return formattedDate;
    };

    var getFormattedTime = function (date) {
        var formattedTime = '',
            // period = 'AM',
            hour = date[3],
            minute = date[4];

        // Handle afternoon.
        // if (hour >= 12) {
        //     period = 'PM';

        //     if (hour >= 13) {
        //         hour -= 12;
        //     }
        // }

        // Handle midnight.
        // if (hour === 0) {
        //     hour = 12;
        // }

        // Ensure 2-digit minute/hour value.
        hour = (hour < 10 ? '0' : '') + hour;
        minute = (minute < 10 ? '0' : '') + minute;

        // Format time.
        formattedTime = hour + ':' + minute;
        return formattedTime;
    };
    
    

    return {
        init: function (settingsOverride) {
            var settings = {
                calendarUrl: '',
                past: false,
                upcoming: true,
                sameDayTimes: true,
                pastTopN: -1,
                upcomingTopN: -1,
                itemsTagName: 'li',
                upcomingSelector: '#eventsUpcoming',
                pastSelector: '#events-past',
                upcomingHeading: '',
                pastHeading: '<h2>Past events</h2>',
                format: ['*summary*', '*date*', '*description*', '*location*'] //FORMATERING AV OUTPUT-REKKEFØLGE
            };

            settings = mergeOptions(settings, settingsOverride);

            init(settings);
        }
    };
})();

setTimeout(function () {
  $("#eventsUpcoming").fadeIn(500);
    var slideshow = $("#eventsUpcoming"),
        listItems = slideshow.children('li'),
        listLen = listItems.length,
        i = 0,
        // slideshowStart = function() {
        //   listItems.eq(0).fadeIn(500);
        // };
        changeList = function () {
            listItems.eq(i).fadeOut(0, function () {
                i += 1;
                if (i === listLen) {
                    i = 0;
                }
                listItems.eq(i).fadeIn(500);
            });
        };
    listItems.not(':first').hide();
    setInterval(changeList, 3000);

},1000);