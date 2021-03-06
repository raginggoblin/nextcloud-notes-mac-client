'use strict'

const i18n 				= require( './i18n.min' )
const remote 			= require( 'electron' ).remote
const {ipcRenderer} 	= require( 'electron' )
const Store				= require( 'electron-store' )
const store				= new Store()
const Mousetrap 		= require( 'mousetrap' )

const $ 				= require( 'jquery' )
const jqueryI18next 	= require( 'jquery-i18next' )

jqueryI18next.init(i18n, $)

const log				= require( 'electron-log' )

const width = 120, height = 120

let	canvas 	= document.getElementById( 'table' ),
	context = canvas.getContext( '2d' )


//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipcRenderer.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): set lang & localize strings

$('html').attr('lang', i18n.language)
$('header').localize()
$('label').localize()
$('input').localize()
$('button').localize()



//note(dgmid): register kbd shortcut

Mousetrap.bind('command+.', function() {
	
	closeModal()
})



//note(dgmid): close modal

function closeModal() {
	
	const modal = remote.getCurrentWindow()
	modal.close()
}



//note(dgmid): update-theme

ipcRenderer.on('set-theme', (event, message) => {
	
	__setTheme()
})



function drawCanvas() {
	
	let columns = $('#columns').val(),
		rows 	= $('#rows').val()
	
	context.clearRect(1, 1, 118, 118)
	context.beginPath()
	
	context.moveTo( 120, 120 - 0.5 )
	context.lineTo( 0.5, 120 - 0.5 )
	
	context.moveTo( 120 - 0.5, 120 )
	context.lineTo( 120 - 0.5, 0.5 )
	
	for ( let x = 0; x <= width; x += (width/columns) ) {
		
		context.moveTo( 0.5 + Math.floor(x), 0 )
		context.lineTo( 0.5 + Math.floor(x), width )
	}

	for ( let x = 0; x <= height; x += (height / rows) ) {
		
		context.moveTo( 0, 0.5 + Math.floor(x) )
		context.lineTo( height, 0.5 + Math.floor(x) )
	}
	
	context.strokeStyle = 'black'
	context.stroke()
}








$(document).ready(function() {
	
	drawCanvas()
	
	$('body').on('keyup input change', 'input[type="number"]', function(event) {
		
		if ( event.target.value == '' ) {
			
			event.target.value = 1
		
		} else if( event.target.value > 50 ) {
			
			event.target.value = 50
		}
		
		drawCanvas()
	})
	
	//note(dgmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	//note(dgmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		
		let cols = $('#columns').val(),
			rows = $('#rows').val()
		
		ipcRenderer.send( 'table', {"cols": cols, "rows": rows} )
		closeModal()
	})
})
