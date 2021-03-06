'use strict'

const i18n			= require( './i18n.min' )
const dateFormat	= require( 'dateformat' )

const locale		= i18n.language



dateFormat.i18n = {
	dayNames: [
		i18n.t('date:sun', 'Sun'),
		i18n.t('date:mon', 'Mon'),
		i18n.t('date:tue', 'Tue'),
		i18n.t('date:wed', 'Wed'),
		i18n.t('date:thu', 'Thu'),
		i18n.t('date:fri', 'Fri'),
		i18n.t('date:sat', 'Sat'),
		i18n.t('date:sunday', 'Sunday'),
		i18n.t('date:monday', 'Monday'),
		i18n.t('date:tuesday', 'Tuesday'),
		i18n.t('date:wednesday', 'Wednesday'),
		i18n.t('date:thursday', 'Thursday'),
		i18n.t('date:friday', 'Friday'),
		i18n.t('date:saturday', 'Saturday')
	],
	monthNames: [
		i18n.t('date:jan', 'Jan'),
		i18n.t('date:feb', 'Feb'),
		i18n.t('date:mar', 'Mar'),
		i18n.t('date:apr', 'Apr'),
		i18n.t('date:_may', 'May'),
		i18n.t('date:jun', 'Jun'),
		i18n.t('date:jul', 'Jul'),
		i18n.t('date:aug', 'Aug'),
		i18n.t('date:sep', 'Sep'),
		i18n.t('date:oct', 'Oct'),
		i18n.t('date:nov', 'Nov'),
		i18n.t('date:dec', 'Dec'),
		i18n.t('date:january', 'January'),
		i18n.t('date:february', 'February'),
		i18n.t('date:march', 'March'),
		i18n.t('date:april', 'April'),
		i18n.t('date:may', 'May'),
		i18n.t('date:june', 'June'),
		i18n.t('date:july', 'July'),
		i18n.t('date:august', 'August'),
		i18n.t('date:september', 'September'),
		i18n.t('date:october', 'October'),
		i18n.t('date:november', 'November'),
		i18n.t('date:december', 'December')
	],
	timeNames: [
		i18n.t('date:a', 'a'),
		i18n.t('date:p', 'p'),
		i18n.t('date:am', 'am'),
		i18n.t('date:pm', 'pm'),
		i18n.t('date:_a', 'A'),
		i18n.t('date:_p', 'P'),
		i18n.t('date:_am', 'AM'),
		i18n.t('date:_pm', 'PM')
	]
}



module.exports.titlebarDate = function( timestamp ) {
	
	let date,
		time = dateFormat(timestamp * 1000, "HH:MM"),
		prep = i18n.t('date:at', 'at')
	
	if( locale.startsWith('de') ) {
		
		date = dateFormat(timestamp * 1000, "dd. mmmm yyyy")
		
	} else {
		
		date = dateFormat(timestamp * 1000, "d mmmm, yyyy")
	}
		
	return `${date} ${prep} ${time}`
}



module.exports.sidebarDate = function ( timestamp ) {
	
	let today		= new Date(),
		yesterday	= new Date(),
		week		= new Date()
	
	today.setHours( 0, 0, 0, 0 )
	yesterday.setHours( 0, 0, 0, 0 )
	yesterday.setDate( yesterday.getDate() - 1 )
	week.setHours( 0, 0, 0, 0 )
	week.setDate( week.getDate() - 7 )
	
	
	if( ( today.getTime() / 1000 ) < timestamp ) {
		
		//if today - show time
		return dateFormat( timestamp * 1000, 'H:MM' )
	
	} else if ( ( yesterday.getTime() / 1000 ) < timestamp ) {
		
		//if yesterday - show string
		return i18n.t('date:yesterday', 'yesterday')
	
	} else if ( ( week.getTime() / 1000 ) < timestamp ) {
		
		//if last week - show day
		return dateFormat( timestamp * 1000, 'dddd' )
	
	} else {
		
		//else - show date
		if( locale.startsWith('de') ) {
			
			return dateFormat( timestamp * 1000, 'dd.mm.yyyy' )
		
		} else {
			
			return dateFormat( timestamp * 1000, 'dd/mm/yy' )
		}
	}
}
