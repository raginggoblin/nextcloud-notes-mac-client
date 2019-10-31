'use strict'

const i18n = require( './i18n.min' )

const { ipcRenderer, shell, remote } = require( 'electron' )
const path				= require( 'path' )
const Store				= require( 'electron-store' )
const store				= new Store()
const dialog			= remote.dialog
const dateFormat		= require( 'dateformat' )
const $					= require( 'jquery' )
const marked			= require( 'marked' )
const removeMarkdown	= require( 'remove-markdown' )
const pretty			= require( 'pretty' )
const fs				= require( 'fs-extra' )
const EasyMDE			= require( 'easymde' )
const hljs				= require( 'highlight.js' )
const entities			= require( 'html-entities' ).AllHtmlEntities
const log				= require( 'electron-log' )

let 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )

let database = new Store({
	name: 'database',
	notes: {}
})

let easymdeSetup = {
		
		element: $('#note')[0],
		autoDownloadFontAwesome: false,
		autofocus: false,
		forceSync: true,
		status: false,
		spellChecker: true,
		toolbar: [	
					{
						name: "Heading",
						action: EasyMDE.toggleHeadingSmaller,
						className: "icon-heading",
						title: i18n.t('app:toolbar.heading', 'Heading'),
					},
					'|',
					{
						name: "bold",
						action: EasyMDE.toggleBold,
						className: "icon-b",
						title: i18n.t('app:toolbar.bold', 'Bold'),
					},
					{
						name: "italic",
						action: EasyMDE.toggleItalic,
						className: "icon-i",
						title: i18n.t('app:toolbar.italic', 'Italic'),
					},
					{
						name: "srtikethrough",
						action: EasyMDE.toggleStrikethrough,
						className: "icon-del",
						title: i18n.t('app:toolbar.strikethrough', 'Strikethrough'),
					},
					'|',
					{
						name: "unordered-list",
						action: EasyMDE.toggleUnorderedList,
						className: "icon-ul",
						title: i18n.t('app:toolbar.ul', 'Generic List'),
					},
					{
						name: "ordered-list",
						action: EasyMDE.toggleOrderedList,
						className: "icon-ol",
						title: i18n.t('app:toolbar.ol', 'Numbered List'),
					},
					{
						name: "checklist",
						action: (e) => {
							e.codemirror.replaceSelection('- [ ]  ')
							e.codemirror.focus()
						},
						className: "icon-checklist",
						title: i18n.t('app:toolbar.checklist', 'Checkbox list (Cmd-⌥-^)'),
					},
					'|',
					{
						name: "link",
						action: EasyMDE.drawLink,
						className: "icon-a",
						title: i18n.t('app:toolbar.link', 'Create Link'),
					},
					{
						name: "image",
						action: EasyMDE.drawImage,
						className: "icon-img",
						title: i18n.t('app:toolbar.image', 'Insert Image'),
					},
					'|',
					{
						name: "code",
						action: EasyMDE.toggleCodeBlock,
						className: "icon-code",
						title: i18n.t('app:toolbar.code', 'Code'),
					},
					{
						name: "quote",
						action: EasyMDE.toggleBlockquote,
						className: "icon-blockquote",
						title: i18n.t('app:toolbar.quote', 'Quote'),
					},
					{
						name: "table",
						action: EasyMDE.drawTable,
						className: "icon-table",
						title: i18n.t('app:toolbar.table', 'Insert Table'),
					},
					{
						name: "horizontal-rule",
						action: EasyMDE.drawHorizontalRule,
						className: "icon-hr",
						title: i18n.t('app:toolbar.hr', 'Insert Horizontal Line'),
					},
				],
		shortcuts: {
			'toggleStrikethrough': 'Shift-Cmd-D',
			'toggleBlockquote': 'Cmd-\'',
			'drawTable': 'Cmd-T',
			'drawHorizontalRule': 'Cmd--',
			'cleanBlock': null,
			'toggleSideBySide': null,
			'toggleFullScreen': null,
			'togglePreview': null	
		},
		renderingConfig: {
			codeSyntaxHighlighting: true,
			hljs: hljs
		}
	}

let easymde,
	modal,
	firstLoad = true

easymde = new EasyMDE( easymdeSetup )


//note(dgmid): dateFormat i18n setup

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



//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipcRenderer.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): call notes api

function apiCall( call, id, body ) {
	
	let method
	
	switch( call ) {
		
		case 'new':
			method = 'POST'
		break
		
		case 'save':
		case 'update':
		case 'category':
			method = 'PUT'
		break
		
		case 'delete':
			method = 'DELETE'
		break
		
		default: //all, single or export
			method = 'GET'
	}
	
	let url = '/index.php/apps/notes/api/v0.2/notes',
	init = {
		
		method: method,
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json',
		},
		mode: 'cors',
		cache: 'no-cache',
		credentials: 'omit'
	}
	
	if( id ) { url += `/${id}` }
	if( body ) { init.body = JSON.stringify( body ) }
	
	log.info( `URL: ${server}${url}` )
	
	fetch(server + url, init).then(function(response) {
	
		if (response.ok) {
			
			log.info( 'response OK' )
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				i18n.t('app:dialog.error.server.title', 'Server connection error'),
				i18n.t('app:dialog.error.server.text', 'there was an error connecting to') + `:\n${server}`
			)
			
			log.error( response.error() )
		}
	
	}).then(function(message) {
		
		
		let notes = JSON.parse(message)
		
		
		if (notes['status'] == 'error') {
			
			dialog.showErrorBox(
				i18n.t('app:dialog.error.json.title', 'JSON parsing error'),
				i18n.t('app:dialog.error.json.text', 'An error occured parsing the notes')
			)
			
			log.error( notes['message'] )	
		
		} else {
			
			switch( call ) {
				
			case 'new': // create new note
				
				store.set('appInterface.selected', notes.id)
				$('#sidebar').html('')
				apiCall('all')
				
			break
			
			case 'save': // save note
				
				$('#sidebar').html('')
				apiCall('sidebar')
				
			break
			
			case 'update': // modify existing note
				
				$(`button[data-id="${id}"]`).removeData('favorite')
				$(`button[data-id="${id}"]`).attr('data-favorite', body.favorite)
			
			break
			
			case 'category':
			
				$('#sidebar').html('')
				apiCall('sidebar')
				
			break
			
			case 'delete': // delete note
				
				let selected = $('#sidebar li button.selected').attr('data-id')
				
				if( selected == id) {
					
					resetEditor()
					
					store.set( 'appInterface.selected', null )
					$('#note').attr('data-id', null)
					$('#time, #note').html('')
				}
				
				$('#sidebar').html('')
				apiCall('all')
			
			break
			
			case 'export':
				
				exportNote( notes )
				
			break
			
			case 'sidebar':
				
				listNotes( notes, 'sidebar' )
				
			break
			
			default: // get single note or all notes
				
				(id) ? displayNote( notes ) : listNotes( notes )
			}
		}
	
	}).catch( function( error ) {
		
		dialog.showErrorBox(
			i18n.t('app:dialog.error.server.title', 'Server connection error'),
			i18n.t('app:dialog.error.server.text', 'there was an error connecting to') + `:\n${server}`
		)
		
		log.error( error )
	})
}



//note reset editor

function resetEditor() {
	
	easymde.codemirror.setValue('')
	easymde.value('')
	$('.editor-preview').html('')
}



//note(dgmid): codeMirror - insert / wrap text

function insertTextAtCursor( text ) {
	
	let note = easymde.codemirror.getDoc()
	let cursor = note.getCursor()
	note.replaceRange(text, cursor)
}

function wrapTextToSelection( start, end ) {
	
	let note = easymde.codemirror.getDoc()
	let selection = note.getSelection()
	note.replaceSelection( start + selection + end )
}

function wrapBlockToCursor( start, end ) {
	
	let note = easymde.codemirror.getDoc()
	let cursor = note.getCursor()
	note.replaceRange(
`${start}

${end}`, cursor)
	
	cursor = note.getCursor()
	let line = cursor.line -1
	note.setCursor({ line: line })
}



//note(dgmid): build category list

function saveCategories( array ) {
	
	$('#categories').empty()
	
	let compressed = [],
	copy = array.slice(0),
	orderby = store.get( 'appSettings.ordercats' ),
	results = []
	
	if( orderby == null ) orderby = 'asc'
	
	for (var i = 0; i < array.length; i++) {
	
		var theCount = 0
		
		for (var w = 0; w < copy.length; w++) {
			
			if (array[i] == copy[w]) {
				
				theCount++
				delete copy[w]
			}
		}
		
		if (theCount > 0) {
			
			var a = new Object()
			a.value = array[i]
			a.count = theCount
			compressed.push(a)
		}
	}
	
	if( compressed.length > 1 ) {
		
		compressed.sort(function(x, y) {
			
			var itemX = x['value']
			var itemY = y['value']
			
			if( orderby === 'asc' ) {
				
				return (itemX < itemY) ? -1 : (itemX > itemY) ? 1 : 0
			
			} else {
				
				return (itemX > itemY) ? -1 : (itemX < itemY) ? 1 : 0
			}
		})
	}
	
	for ( let item of compressed ) {
		
		let theItem		= item.value,
			theID 		= theItem.replace(' ', '_')
		
		if( theItem.length > 0 ) {
		
			results.push( { "item": theItem , "catID": theID } )
			
			$('#categories').append(`<li><button class="custom" data-catid="${theID}" data-category="${theItem}" title="${theItem}">${theItem}</button></li>`)
		}
	}
	
	$(`.categories button[data-catid="${store.get('categories.selected')}"]`).addClass( 'selected' )
	
	showHideCategoryIcons()
	store.set( 'categories.list', results )
}



//note(dgmid): hide category icons when a custom category is selected

function showHideCategoryIcons() {
	
	if( $('.categories button.selected').hasClass( 'custom' ) ) {
		
		$('#sidebar').addClass( 'hidecats' )
		
	} else {
		
		$('#sidebar').removeClass( 'hidecats' )
	}
}



//note(dgmid): generate ordered sidebar entries

function listNotes( array, sidebar ) {
	
	if( sidebar !== null ) {
		
		database.set('notes', array)
	}
	
	const date = new Date()
	
	let sortby 	= store.get( 'appSettings.sortby' ),
		orderby = store.get( 'appSettings.orderby' ),
		allCats = []
	
	if( array.length > 1 ) {
		
		array.sort(function(x, y) {
			
			var itemX = x[sortby]
			var itemY = y[sortby]
			
			if( orderby === 'asc' ) {
				
				return (itemX < itemY) ? -1 : (itemX > itemY) ? 1 : 0
			
			} else {
				
				return (itemX > itemY) ? -1 : (itemX < itemY) ? 1 : 0
			}
		})
	}
	
	for ( let item of array ) {
		
		let theDate = new Date( item.modified ),
			formattedDate = formatDate( theDate.getTime() )
		
		let	catClass = ( item.category ) ? item.category.replace(' ', '_') : '##none##'
		
		let	theCat = ( item.category ) ? item.category : i18n.t('app:categories.none', 'Uncategorised')
		
		let plainTxt = removeMarkdown( item.content.replace(/(!\[.*\]\(.*\)|<[^>]*>|>|<)/g, ''))
		
		if( plainTxt ) {

			plainTxt = plainTxt.substr(0, 120).slice(item.title.length)
			
		} else {
			
			plainTxt = i18n.t('app:sidebar.notext', 'No additional text')
		}
		
		$('#sidebar').append(
		`<li>
			<button data-id="${item.id}" data-title="${item.title}" data-content="" data-catid="${catClass}" data-category="${item.category}" data-favorite="${item.favorite}">
				<span class="side-title">${item.title}</span>
				<span class="side-text">${formattedDate}&nbsp;&nbsp;<span class="excerpt">${plainTxt}</span></span>
				<span class="side-cat">${theCat}</span>
			</button>
		</li>
		`)
		
		allCats.push( item.category )
	}
	
	( sidebar ) ? getSelected( 'sidebar' ) : getSelected()
	
	saveCategories( allCats )
	selectCategory( store.get('categories.selected') )
}



//note(dgmid): formatDate

function formatDate( timestamp ) {
	
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
		return dateFormat( timestamp * 1000, 'dd/mm/yy' )
	}
}



//note(dgmid): display single note

function displayNote( note ) {
	
	let prep = i18n.t('app:date.titlebar', 'at'),
		date = dateFormat(note.modified * 1000, "d mmmm, yyyy"),
		time = dateFormat(note.modified * 1000, "HH:MM")
	
	$('#edit').removeClass('editing')
	
	$('#time').html( `${date} ${prep} ${time}` )
	
	if( easymde ) {
		
		easymde.toTextArea()
		easymde = null
	}
	
	easymde = new EasyMDE( easymdeSetup )
	toggleSpellcheck( store.get('appSettings.spellcheck') )	
	
	// register right click for notes menu
	
	easymde.codemirror.on( 'mousedown', function( instance, event ) {
		
		if( event.which === 3 ) {
			
			let selection = easymde.codemirror.doc.getSelection()
			
			ipcRenderer.send('show-notes-menu',
				{
					selection: selection,
					preview: false
				}
			)
			return
		}
	})
	
	$('#note').attr('data-id', note.id)
	easymde.value( note.content )
	easymde.codemirror.clearHistory()
	easymde.togglePreview()
	setCheckLists()
	
	$('time').fadeIn('fast')
	$('.loader').fadeOut(400, function() { $(this).remove() } )
	
	if( firstLoad === true ) {
		
		firstLoad = 1
		checkAppVersion()
	}
}



//note(dgmid): get selected note

function getSelected( sidebar ) {
	
	let selected = store.get( 'appInterface.selected' )
	
	if( selected ) {
		
		$(`button[data-id="${selected}"]`).addClass('selected').parent().prev().children().addClass('above-selected')
		
		if( !sidebar ) apiCall( 'single', selected )
	}
}



//note(dgmid): edit note

function editNote() {
	
	let selected = store.get( 'appInterface.selected' )
		
	if( selected ) {
		
		if( easymde.isPreviewActive() ) {
		
			$('#edit').attr('title', i18n.t('app:main.button.save', 'Save Note')).addClass('editing')
			easymde.togglePreview()
			easymde.codemirror.focus()
			
			
			// init checkboxes
			
			function initCheckboxes() {
				
				$('.cm-formatting-task').on("click", function (event) {
					
					event.stopPropagation()
					event.preventDefault()
					toggleEditorCheckboxes( $(this) )
				})
			}
			
			initCheckboxes()
			easymde.codemirror.on("changes", initCheckboxes)
			
			
			if( store.get('appSettings.cursor') == 'end' ) {
				
				easymde.codemirror.setCursor(easymde.codemirror.lineCount(), 0)
			}
		
		} else {
			
			if( easymde.codemirror.historySize().undo > 0 ) {
			
				let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {
								message: i18n.t('app:dialog.save.title', 'You have made changes to this note'),
								detail: i18n.t('app:dialog.save.text', 'Do you want to save them?'),
								buttons: [i18n.t('app:dialog.button.savechanges', 'Save changes'), i18n.t('app:dialog.button.cancel', 'Cancel')]
							})
				
				if( response === 0 ) {
					
					let content = easymde.value()
					
					easymde.codemirror.clearHistory()
					
					apiCall( 'save', selected, {"content": content, "modified": Math.floor(Date.now() / 1000) } )
					
				} else {
			
					while ( easymde.codemirror.historySize().undo > 0) easymde.codemirror.undo()
					
				}
			}
			
			easymde.togglePreview()
			$('#edit').attr('title', i18n.t('app:main.button.edit', 'Edit Note')).removeClass('editing').focus()
			setCheckLists()
		}
	}
}



//note(dgmid): toggle editor checkboxes - based on https://github.com/nextcloud/notes/issues/117

function toggleEditorCheckboxes( element ) {
	
	let doc 	= easymde.codemirror.getDoc(),
		index 	= element.parents( '.CodeMirror-line' ).index(),
		line 	= doc.getLineHandle( index )

	let newvalue = ( element.text() == '[x]' ) ? '[ ]' : '[x]'
	
	doc.replaceRange(
		newvalue,
		{line: index, ch: line.text.indexOf('[')},
		{line: index, ch: line.text.indexOf(']') + 1}
	)

	easymde.codemirror.execCommand( 'goLineEnd' )
}



//note(dgmid): save note

function saveNote( id ) {
	
		if(	!easymde.isPreviewActive() && easymde.codemirror.historySize().undo > 0 ) {
			
			let content = easymde.value()
						
			easymde.codemirror.clearHistory()
						
			apiCall( 'save', id, {"content": content, "modified": Math.floor(Date.now() / 1000) } )
		}
}



//note(dgmid): export note

function exportNote( note ) {
	
	const exportPath = store.get('exportPath')
	
	dialog.showSaveDialog(remote.getCurrentWindow(), {
			
			defaultPath: `${exportPath}/${note.title}`,
			buttonLabel: i18n.t('app:dialog.button.export', 'Export Note'),
			properties: [	'openDirectory',
							'createDirectory'
						],
			filters: [
				{	name:		i18n.t('app:dialog.format.html', 'html'),
					extensions:	['html']
				},
				{	name:		i18n.t('app:dialog.format.md', 'markdown'),
					extensions:	['md']
				},
				{	name:		i18n.t('app:dialog.format.txt', 'text'),
					extensions:	['txt']
				}
			]
		},		
		
		runExportProcess
	)
	
	function runExportProcess( filename ) {
		
		let exported,
			filetype
		
		switch( filename.split('.').pop() ) {
			
			case 'html':
				
				let html = marked( note.content )
				
				exported = pretty( `<!doctype html><html lang="${i18n.language}"><head><meta charset="utf-8" /><title>${note.title}</title></head><body>${html}</body></html>`, {ocd: true} )
				
				filetype = 'html'
				
			break
			
			case 'txt':
				
				exported = removeMarkdown( note.content )
				filetype = 'text'
			
			break
			
			default: //markdown
				
				exported = note.content
				filetype = 'markdown'
		}
		
		fs.outputFile(filename, exported)
		.then(() => fs.readFile(filename, 'utf8'))
		.then(data => {
			
			let exportNotification = new Notification('Nextcloud Notes Client', {
				
				body: i18n.t('app:notification.export.text', 'The note {{title}} has been exported as {{filetype}}', {title: note.title, filetype: filetype})
			})
		})
		
		.catch(err => {
			
			log.error( err )
		})
	}
}



//note(dgmid): delete check

function deleteCheck( id ) {
	
	let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {
							message: i18n.t('app:dialog.delete.title', 'Are you sure you want to delete this note?'),
							detail: i18n.t('app:dialog.delete.text', 'This operation is not reversable.'),
							buttons: [i18n.t('app:dialog.button.delete', 'Delete Note'), i18n.t('app:dialog.button.cancel', 'Cancel')]
						})
		
	if( response === 0 ) {
		
		apiCall( 'delete', id )
	}
}



//note(dgmid): apply zoom level

function applyZoom( level ) {
	
	$('.editor-preview').css({ "font-size": `${level/10}rem` })
}



//note(dgmid): toggle spellcheck

function toggleSpellcheck( state ) {
	
	( state ) ? $('.CodeMirror').addClass('spellcheck') : $('.CodeMirror').removeClass('spellcheck')
}



//note(dgmid): show / hide categories

function toggleCategories( state ) {
	
	$('#sidebar').toggleClass( 'showcats' )
}



//note(dgmid): set zoom slider

ipcRenderer.on('set-zoom-slider', (event, message) => {
	
	applyZoom( message )
})



//note(dgmid): reload sidebar

ipcRenderer.on('reload-sidebar', (event, message) => {
	
	if( message === 'login' || message === 'logout' ) {
	
		server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )
	
		log.info( `${message} completed` )
	}
	
	$('#sidebar').html('')
	apiCall('all')
})



//note(dgmid): spellcheck

ipcRenderer.on('spellcheck', (event, message) => {
	
	log.info(`spellcheck prefs ${message}`)
	
	toggleSpellcheck( message )
})



//note(dgmid): display categories

ipcRenderer.on('showcats', (event, message) => {
	
	toggleCategories( message )
})



//note(dgmid): update-theme

ipcRenderer.on('set-theme', (event, message) => {
	
	__setTheme()
})



//note(dgmid): toggle-sidebar

ipcRenderer.on('toggle-categories', (event, message) => {
	
	$('#frame, footer').toggleClass('slide')
	
	let cats = store.get( 'appInterface.categories' ) ? false : true
	store.set( 'appInterface.categories', cats )
})


//note(dgmid): modal

function openModal( url, width, height, resize ) {
	
	modal = new remote.BrowserWindow({
		
			parent: remote.getCurrentWindow(),
			modal: true,
			width: width,
			minWidth: width,
			maxWidth: width,
			height: height,
			minHeight: height,
			resizable: resize,
			show: false,
			frame: false,
			transparent: true,
			vibrancy: 'popover',
			webPreferences: {
			devTools: true,
				preload: path.join(__dirname, './preload.min.js'),
				nodeIntegration: true
			}	
		})
		
	modal.loadURL( url )
	
	modal.once('ready-to-show', () => {
		
		modal.show()
	})
}



//note(dgmid): log in modal

ipcRenderer.on('open-login-modal', (event, message) => {
	
	openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
})



//note(dgmid): close login modal

ipcRenderer.on('close-login-modal', (event, message) => {
	
	modal.close()
})



//note(dgmid): note menu commands

ipcRenderer.on('note', (event, message) => {
	
	let selected = store.get( 'appInterface.selected' )
	
	switch( message ) {
		
		case 'new':
			
			let body
			
			switch( store.get( 'categories.selected' ) ) {
			
				case '##all##':
				case '##none##':
					
					body = {
						"content": '# ' +  i18n.t('app:sidebar.new', 'New note')
					}
					
				break
				
				case '##fav##':
					
					body = {
						"content": '# ' +  i18n.t('app:sidebar.new', 'New note'),
						"favorite": true
					}
					
				break
				
				default:
					
					body = {
						"content": '# ' +  i18n.t('app:sidebar.new', 'New note'),
						"category": $('.categories li button.selected').data('category')
					}
			}
			
			apiCall( 'new', null, body )
			
		break
		
		case 'edit':
			if( selected ) editNote( selected )
		break
		
		case 'save':
			if( selected ) saveNote( selected )
		break
		
		case 'favorite':
			if( selected ) {
			
				let favorite = ( $(`#sidebar li button[data-id="${selected}"]`).attr('data-favorite') == 'true' ) ? false : true
			
				apiCall( 'update', selected, {"favorite": favorite} )
			}
		break
		
		case 'newcat':
			
			if( selected ) {
				openModal( 'file://' + __dirname + `/../html/new-category.html?id=${selected}`, 480, 180, false )
			}
		break
		
		break
		
		case 'export':
			if( selected ) apiCall( 'export', selected )
		break
		
		case 'delete':
			if( selected ) deleteCheck( selected )
		break
		
		case 'selectall':
			if( !easymde.isPreviewActive() ) easymde.codemirror.execCommand('selectAll')
		break
	}
})



//note(dgmid): markdown menu commands

ipcRenderer.on('markdown', (event, message) => {
	
	if( !easymde.isPreviewActive() ) {
		
		switch( message ) {
			
			case 'h1':
				easymde.toggleHeading1()
			break
			case 'h2':
				easymde.toggleHeading2()
			break
			case 'h3':
				easymde.toggleHeading3()
			break
			case 'h4':
				easymde.toggleHeading4()
			break
			case 'h5':
				easymde.toggleHeading5()
			break
			case 'h6':
				easymde.toggleHeading6()
			break
			case 'b':
				easymde.toggleBold()
			break
			case 'i':
				easymde.toggleItalic()
			break
			case 'del':
				easymde.toggleStrikethrough()
			break
			case 'ul':
				easymde.toggleUnorderedList()
			break
			case 'ol':
				easymde.toggleOrderedList()
			break
			case 'cl':
				easymde.codemirror.replaceSelection('- [ ]  ')
				easymde.codemirror.focus()
			break
			case 'a':
				easymde.drawLink()
			break
			case 'img':
				easymde.drawImage()
			break
			case 'code':
				easymde.toggleCodeBlock()
			break
			case 'blockquote':
				easymde.toggleBlockquote()
			break
			case 'table':
				easymde.drawTable()
			break
			case 'hr':
				easymde.drawHorizontalRule()
			break
		}
	}
})



//note(dgmid): html submenu menu commands

ipcRenderer.on('html', (event, message) => {
	
	
	if( !easymde.isPreviewActive() ) {
		
		switch( message ) {
			
			case 'small':
			case 'sup':
			case 'sub':
			case 'u':
			case 'mark':
				wrapTextToSelection( `<${message}>`, `</${message}>` )
			break
			case 'javascript':
			case 'json':
			case 'html':
			case 'css':
			case 'scss':
			case 'php':
			case 'objective-c':
			case 'c-like':
			case 'bash':
				wrapBlockToCursor( `\`\`\` ${message}`, `\`\`\`` )
			break
			case 'dl':
				insertTextAtCursor(
`<dl>
	<dt>${i18n.t('app:main.title', 'title')}</dt>
	<dd>${i18n.t('app:main.description', 'description')}</dd>
	<dt>${i18n.t('app:main.title', 'title')}</dt>
	<dd>${i18n.t('app:main.description', 'description')}</dd>
</dl>` )
			break
		}
	}
})



//note(dgmid): view menu - zoom levels

ipcRenderer.on('set-zoom-level', (event, message) => {
	
	let zoom = store.get( 'appSettings.zoom' )
	
	switch( message ) {
		
		case 1:
			zoom++
			if( zoom > 16 ) zoom = 16
		break
		
		case -1:
			zoom--
			if( zoom < 4 ) zoom = 4
		break
		
		default:
			zoom = 10
	}
	
	store.set( 'appSettings.zoom', zoom )
	applyZoom( zoom )
})



//note(dgmid): sidebar context menu commands

ipcRenderer.on('context-favorite', (event, message) => {
	
	let favorite 	= ( message.favorite == 'true' ) ? false : true,
		id 			= message.id
	
	apiCall( 'update', id, {"favorite": favorite} )
})


ipcRenderer.on('context-export', (event, id) => {
	
	apiCall( 'export', id )
})


ipcRenderer.on('context-delete', (event, id) => {
	
	deleteCheck( id )
})


ipcRenderer.on('context-category', (event, message) => {
	
	let id 			= parseInt( message.id ),
		category	= message.category,
		notes		= database.get('notes')
	
	let note = notes.find( x => x.id === id )
	
	apiCall( 'category', id, {
		
		"modified": 	note.modified,
		"content": 		note.content,
		"category":		category
	})
})


ipcRenderer.on('context-newcategory', (event, message) => {
	
	openModal( 'file://' + __dirname + `/../html/new-category.html?id=${message}`, 480, 180, false )
})



//note(dgmid): notes context menu commands

ipcRenderer.on('context-note-encode', (event, message) => {
	
	let encoded = entities.encode( message )
	easymde.codemirror.doc.replaceSelection( encoded )
})


ipcRenderer.on('context-note-decode', (event, message) => {
	
	let decoded = entities.decode( message )
	easymde.codemirror.doc.replaceSelection( decoded )
})



//note(dgmid): on click sidebar button

$('body').on('click', '#sidebar li button', function(event) {
	
	event.stopPropagation()
	
	let id = $(this).data('id')
	
	$('#time').html('').hide()
	$('main').append('<div class="loader"><div class="spinner"></div></div>')
	
	$('#sidebar li button').removeClass('selected').removeClass('above-selected')
	$(this).addClass('selected').parent().prev().children().addClass('above-selected')
	
	apiCall( 'single', id )
	
	store.set( 'appInterface.selected', id )
})



//note(dgmid): on right click sidebar button

$('body').on('mouseup', '#sidebar li button', function(event) {
	
	event.stopPropagation()
	
	let data = {
		'id': 		$(this).data('id'),
		'title': 	$(this).data('title'),
		'favorite': $(this).attr('data-favorite'),
		'category': $(this).attr('data-category'),
		'catID': 	$(this).attr('data-catid')
	}
	
	if( event.which === 3 ) {
		
		ipcRenderer.send('show-sidebar-menu', data )
		return
	}
})


$('body').on('focus', '#sidebar li button', function(event) {
	
	$(this).parent().prev().children().addClass('above-selected')
})


$('body').on('focusout', '#sidebar li button', function(event) {
	
	if( !$(this).hasClass('selected') ) {
		
		$(this).parent().prev().children().removeClass('above-selected')
	}
})



//note(dgmid): on click empty sidebar

$('body').on('mouseup', 'aside', function(event) {
	
	if( event.which === 3 ) {
	
		ipcRenderer.send('show-sidebar-menu', null )
	}
})



//note(dgmid): on click note preview

$('body').on('mouseup', '.editor-preview-active', function(event) {
	
	if( event.which === 3 ) {
		
		ipcRenderer.send('show-notes-menu',
			{
				selection: '',
				preview: true
			}
		)
	}
})



//note(dgmid): open links in default browser

$(document).on('click', 'a[href^="http"]', function(event) {
	
	event.preventDefault()
	shell.openExternal(this.href)
})



//note(dgmid): change category

$('body').on('click', '.categories button', function(event) {
	
	let cat = $(this).attr( 'data-category' ),
		catid = $(this).attr( 'data-catid' )
	
	$('.categories button').removeClass('selected')
	$(this).addClass('selected')
	
	store.set( 'categories.selected', catid )
	
	selectCategory( catid )
	showHideCategoryIcons()
})



//note(dgmid): select category in category sidebar

function selectCategory( catid ) {
	
	switch( catid ) {
		
		case '##all##':
			 
			$(`#sidebar li`).show()
			
		break
		
		case '##fav##':
			
			$(`#sidebar li`).hide()
			$(`#sidebar button[data-favorite='true']`).parent('li').show()
			
		break
		
		default:
			
			$(`#sidebar li`).hide()
			$(`#sidebar button[data-catid='${catid}']`).parent('li').show()	
		break
	}
}



//note(dgmid): keyboard arrow keys

document.addEventListener( 'keydown', function( event ) {
	
	if( easymde.isPreviewActive() ) {
		
		$('#sidebar button').blur()
		
		let items
		
		switch( event.which ) {
			
			case 38:
				items = $('#sidebar button.selected').parent('li').prevAll('li:visible')
				items.first().find('button').click()
			break
			
			case 40:
				items = $('#sidebar button.selected').parent('li').nextAll('li:visible')
				items.first().find('button').click()
			break
		}
	}
})



//note(dgmid): open links in browser

$('body').on('click', '#update', (event) => {
	
	event.preventDefault()
	
	let link = $('#update').attr( 'data-url' )
	
	shell.openExternal(link)
})



//note(dgmid): remove bullets from checkbox lists

function setCheckLists() {
	
	$('input[type="checkbox"]').parent().css('list-style-type', 'none')
}


//note(dgmid): check app version

function checkAppVersion() {
	
	const version 			= require('electron').remote.app.getVersion()
	const compareVersions	= require('compare-versions')
	
	$.getJSON( 'https://api.github.com/repos/dgmid/nextcloud-notes-mac-client/releases/latest', function( release ) {
		
		let latest = release.name
		
		log.info( `this version: ${version}` )
		log.info( `latest version: ${latest}` )
		
		if( compareVersions.compare( version, latest, '<' ) ) {
			
			$('#update').attr('data-url', `https://www.midwinter-dg.com/mac-apps/nextcloud-notes-client.html?app`).fadeIn('slow')
			$('#update-version').html( latest )
		}
		
		if( compareVersions.compare( version, latest, '>' ) ) {
						
			if( version.includes('-a') ) {
				
				$('header').append( `<span id="dev" class="α">DEV: v${version}</span>` )
				
			} else if ( version.includes('-b') ) {
				
				$('header').append( `<span id="dev" class="β">DEV: v${version}</span>` )
				
			} else {
				
				$('header').append( `<span id="dev">DEV: v${version}</span>` )
			}
			
			$('#dev').fadeIn('slow')
		}
	})
	.done( function() {
		
		log.info( `check release succeeded` )
	})
	.fail( function( jqXHR, textStatus, errorThrown ) {
		
		log.error( `check release failed ${textStatus}` )
	})
	.always( function() {
		
		log.info( `check release ended` )
	})
}



//note(dgmid): docready

$(document).ready(function() {
	
	//note(dgmid): set lang
	
	$('html').attr('lang', i18n.language)
	
	
	//note(dgmid): display categories in sidebar 
	
	if( store.get( 'appSettings.showcats' ) ) {
		
		$('#sidebar').addClass( 'showcats' )
	}
	
	
	//note(dgmid): toggle categories sidebar
	
	if( store.get( 'appInterface.categories' ) ) {
		
		$('#frame, footer').addClass( 'slide' )
	}
	
	//note(dgmid): set edit button title
	
	$('#edit').attr('title', i18n.t('app:main.button.edit', 'Edit Note'))
	
	
	//note(dgmid): set categories strings
	
	$('#cat-title').html( i18n.t('app:categories.title', 'Categories'))
	$('#cat-all').html( i18n.t('app:categories.all', 'All notes'))
	$('#cat-all').attr('title', i18n.t('app:categories.all', 'All notes'))
	$('#cat-fav').html( i18n.t('app:categories.fav', 'Favorites'))
	$('#cat-fav').attr('title', i18n.t('app:categories.fav', 'Favorites'))
	$('#cat-none').html( i18n.t('app:categories.none', 'Uncategorised'))
	$('#cat-none').attr('title', i18n.t('app:categories.none', 'Uncategorised'))
	$('#update-label').html( i18n.t('app:titlebar.update', 'Update Available'))
	
	
	//note(dgmid): check login
	
	if( !server || !username || !password ) {
		
		openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
		
	} else {
		
		apiCall('all')
	}
	
	
	//note(dgmid): edit save
	
	$('#edit').click(function() {
		
		editNote()
	})
})
