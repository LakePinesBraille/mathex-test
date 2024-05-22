(() => {
  // Collect the query parameters
  var value = window.location.search;
  if ( value && value !== ee_settings.get( "ee-query-state" ) )
  {
    ee_settings.set( "ee-query-state", value );
  }
})();

const ee = (() => {
  /**
   * The equation editor user interface object.
   */
  const _ee = {};

  /**
   * The equation editor user interface onload handler.
   */
  _ee.onload = () => {
    const body = document.body;

    // Create the open file name element 
    const p = document.createElement( "p" );
    p.setAttribute( "class", "ee-file-name" );
    body.insertBefore( p, body.firstChild );
    open_file_panel = p;

    // Create the menu container element
    const div = document.createElement( "div" );
    div.setAttribute( "class", "ee-menu" );
    body.insertBefore( div, body.firstChild );
    menu_bar_panel = div;

    // Create the initial focus handler element
    const elt = document.createElement( "textarea" );
    elt.setAttribute( "class", "ee-init-panel" );
    elt.setAttribute( "aria-label", "equation" );
    elt.setAttribute( "tabindex", "-1" );
    elt.addEventListener( "blur", () => body.removeChild( elt ) );
    body.insertBefore( elt, body.firstChild );

    // Transfer the input focus to the focus handler element
    elt.focus();
  };

  /**
   * Initialize the equation editor user interface elements.
   */
  _ee.init = () => {
    if ( ! ee_settings.getNumber( "ee-width" ) )
    {
      ee_settings.reset();
    }

    addMarkup( ".ee-version", getVersion() );
    addMarkup( ".ee-timestamp", getTimestamp() );

    editor = EquationEditorAPI.getInstance( "RESPONSE" );
    if ( editor )
    {
      editor.model().setSystemClipboard( true );
      editor.setFocus();

      initMenus();
      initEvents();
      initContent();
    }
  };

  const LOG = msg => msg; // console.log( msg );
  const ALERT = msg => alert( msg );

  /**
   * Retrieve the equation editor component version.
   */
  const getVersion = () => {
    return EquationEditorAPI && EquationEditorAPI.version || "";
  };

  /**
   * Retrieve the equation editor component timestamp.
   */
  const getTimestamp = () => {
    return EquationEditorAPI && EquationEditorAPI.timeStamp || "";
  };

  /**
   * Retrieve the base URL of the equation editor user interface document.
   */
  const getDocBase = () => {
    // from the script tag
    const elt = document.querySelector( "script[src*='ee.js']" );
    const att = elt && elt.getAttribute( "src" ) || "";

    if ( /ee\.js$/.test( att ) )
    {
        return att.replace( "ee.js", "" );
    }

    // from the window location
    const href = window.location.href;

    if ( /ee\.html$/.test( href ) )
    {
        return href.replace( "ee.html", "" );
    }

    if ( /\/$/.test( href ) )
    {
        return href;
    }

    return "";
  };

  /**
   * Return true if the editor is run from the local filesystem.
   */
  const isEditorFromFile = () => /file:/.test( window.location.href );

  /**
   * Return true if the current url is an editor document.
   */
  const isDocument = url => /doc\//.test( url );

  /**
   * Return true if the current url is a tutorial.
   */
  const isTutorial = url => /edt\//.test( url );

  /**
   * Return true if the current url is a tutorial index page.
   */
  const isTutorialIndex = url => /edt\/.*0\.html/.test( url );

  /**
   * File dialog user interface options.
   */
  const file_options = {
    id : "equalize-editor",
    multiple : false,
    excludeAcceptAllOption : true,
    suggestedName : "untitled"
  };

  /**
   * File open/save file type options.
   */
  const open_types = { types : [ {
    description : "HTML + MathML Content",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  /**
   * HTML file save/export file type options.
   */
  const html_types = { types : [ {
    description : "HTML + MathML Presentation",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  /**
   * BRF file save/export file type options.
   */
  const brf_types = { types : [ {
    description : "Braille Ready File",
    accept : { "application/brf" : [ ".brf" ] }
  } ] };

  /**
   * BRL file save/export dialog user interface options.
   */
  const brl_types = { types : [ {
    description : "Unicode Braille File",
    accept : { "application/brl" : [ ".brl" ] }
  } ] };

  /**
   * Retrieve the default file dialog options.
   */
  const getFileOptions =
    ( file_types ) => Object.assign( {},
        { startIn: isEditorFromFile() ? last_file_handle : undefined },
        file_options, file_types );

  /**
   * Set the suggested file name dialog option.
   */
  const setFileOption = ( options, ftype ) => {
    var fname = last_file_handle && last_file_handle.name ||
        open_file_name || "untitled";

    fname = fname.replace( /^.*\//, "" );
    fname = fname.replace( /(-p)?\.[^.]*$/, "" );
    fname = fname + ( ftype || "" );

    options.suggestedName = fname;
  };

  /**
   * The menu bar panel.
   */
   var menu_bar_panel = null;

  /**
   * The open file name panel.
   */
  var open_file_panel = null;

  /**
   * The open file name.
   */
  var open_file_name = "";

  /**
   * The open file handle.
   */
  var open_file_handle = undefined;

  /**
   * The last file handle.
   */
  var last_file_handle = undefined;

  /**
   * The URL of the equation editor user interface document.
   */
  var src_URL = getDocBase();

  /**
   * The URL of the user interface document base.
   */
  var base_URL = "";

  /**
   * The URL of the user interface home document.
   */
  var home_URL = "";

  /**
   * The URL of the current open document.
   */
  var file_URL = "";

  /**
   * Update the menu bar panel.
   */
  const updateMenuBarPanel = () => {
    const panel = menu_bar_panel;
    const value = ee_settings.getBool( "ee-panel-all-panels" )
               && ee_settings.getBool( "ee-panel-app-menus" );

    if ( panel )
    {
      panel.style.display = value ? "block" : "none";
    }
  };

  /**
   * Update the open file name panel.
   */
  const updateOpenFilePanel = () => {
    const panel = open_file_panel;
    const name = open_file_name;
    const value = ee_settings.getBool( "ee-panel-all-panels" )
               && ee_settings.getBool( "ee-panel-open-file" );

    if ( panel )
    {
      panel.innerText = name;
      panel.style.display = name && value ? "block" : "none";
    }
  };

  /**
   * Set the open file name.
   */
  const setOpenFileName = ( name ) => {
    open_file_name = name;
    open_file_handle = undefined;
    last_file_handle = undefined;

    updateOpenFilePanel();
  };

  /**
   * Set the open file handle.
   */
  const setOpenFileHandle = ( handle ) => {
    setOpenFileName( handle.name );
    open_file_handle = handle;
    last_file_handle = handle;
  };

  /**
   * Set the open file data.
   */
  const setOpenFileData = ( name, data ) => {
    setOpenFileName( name );

    if ( data && data.href )
    {
      if ( isTutorial( data.href ) && !isTutorialIndex( data.href ) )
      {
        ee_settings.set( "ee-edt-last-page-href", data.href );
      }

      delete data.href;
      data.base = data.base || base_URL;
      data.home = data.home || home_URL;
      window.history.pushState( data, "" );
    }
  };

  /**
   * Update a view menu item check mark.
   */
  const updateCheckMark = ( key, s ) => {
    const val = ee_settings.getBool( key );
    const elt = document.querySelector( s );
    if ( elt )
    {
      if ( val )
      {
        $( elt ).addClass( "checked" );
      }
      else
      {
        $( elt ).removeClass( "checked" );
      }
    }
  };

  /**
   * Update the equation editor user interface panels.
   */
  const updatePanels = () => {
    updateCheckMark( "ee-panel-app-menus", "#panel_menus" );
    updateCheckMark( "ee-panel-open-file", "#panel_fname" );
    updateCheckMark( "ee-panel-quick-bar", "#panel_quick" );
    updateCheckMark( "ee-panel-side-bar", "#panel_side" );
    updateCheckMark( "ee-panel-braille-bar", "#panel_braille" );

    EquationEditorAPI.updateSettings();
    updateMenuBarPanel();
    updateOpenFilePanel();
    editor.setFocus();
  };

  /**
   * Update the equation editor input panel size.
   */
  const setPanelSize = ( value ) => {
    ee_settings.setBool( "ee-panel-all-panels", value );

    var firefox = /firefox/i.test( navigator.userAgent );
    const dh = 100;
    const dw = firefox ? 16 : 0;

    const hh = window.innerHeight - dh;
    const ww = window.innerWidth - dw;

    ee_settings.setNumber( "ee-height", hh );
    ee_settings.setNumber( "ee-width", ww );

    updatePanels();
  };

  /**
   * Combine a relative url with a document base value.
   */
  const combine_url = ( url, base ) => {
    if ( url.startsWith( base ) )
    {
        return url;
    }

    const suffix = base.replaceAll( /(\.\.\/)+/g, "/" );
    const prefix = base.substring( 0, base.length - suffix.length );
    return prefix + suffix + url;
  };

  /**
   * Retrieve the remote resource named in the query parameters.
   */
  const open_url = async ( data, fn, cb ) => {
    var obaseURL = base_URL;
    var ohomeURL = home_URL;
    var ofileURL = file_URL;

    base_URL = data.base && combine_url( data.base, src_URL ) || base_URL;
    home_URL = data.home || home_URL;
    file_URL = data.url && combine_url( data.url, base_URL || file_URL || src_URL ) || "";

    if ( ! file_URL )
    {
      ALERT( "Error opening file - url not found" );
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if ( xhr.readyState === 4 && xhr.status === 200 )
      {
        LOG( "Success opening file " + file_URL );
        fn( xhr.responseText );
        cb( file_URL, data );
      }
      else if ( xhr.readyState === 4 )
      {
        ALERT( "Error opening file " + file_URL );
        base_URL = obaseURL;
        home_URL = ohomeURL;
        file_URL = ofileURL;
      }
    }
    xhr.open( "GET", file_URL, true );
    xhr.setRequestHeader( "Editor-Query", "true" );
    xhr.setRequestHeader( "Cache-Control", "no-cache" );
    xhr.send();
  };

  /**
   * Process the query parameters from a link reference.
   */
  const get_query_data = ( href ) => {
    href = href.substring( href.indexOf( "?" ) );
    const params = new URLSearchParams( href );
    const data = { "state" : { "action" : "open", "href" : href } };

    if ( href.startsWith( "?state" ) )
    {
      // Long form - query state parameters
      Object.assign( data.state, JSON.parse( params.get( "state" ) ) );
    }

    else if ( href.startsWith( "?id" ) )
    {
      // Short form - Google Drive ID
      data.state.ids = [ params.get( "id" ) ];
    }

    else if ( href.startsWith( "?" ) )
    {
      // Short form - base + file URL
      const s = href.substring( 1 );
      const ix = s.lastIndexOf( "/" );
      if ( ix === -1 )
      {
        data.state.base = base_URL;
        data.state.url = s;
      }
      else
      {
        data.state.base = combine_url( s.substring( 0, ix + 1 ), base_URL );
        data.state.url = s.substring( ix + 1 );
        base_URL = data.state.base;
      }

      if ( isTutorial( href ) )
      {
        data.state.home = href;
      }
    }

    else
    {
      // Short form - remote resource URL
      data.state.url = href;
    }

    return data;
  };

  /**
   * Process the query parameters from a link reference.
   */
  const do_query_data = ( data ) => {
    if ( data && data.action === "open" && data.url )
    {
      // Open a remote web resource
      open_url( data, setContent, setOpenFileData );
      ee_drive.clear();
    }

    else if ( data && data.action === "open" && data.ids )
    {
      // Open a Google drive resource
      ee_drive.open_with( data, setContent, setOpenFileData );
    }

    else if ( data && data.action === "create" && data.folderId )
    {
      // Create a Google drive resource
      ee_drive.create_new( data, getContent, setOpenFileData );
    }

    else
    {
      // Create an empty document
      do_file_new();
    }
  };

  /**
   * Process the query parameters from a link reference.
   */
  const do_query_href = ( href ) => {
    const data = get_query_data( href );
    do_query_data( data.state );
  };

  /**
   * Process the query parameters from the document URL.
   */
  const do_query_state = () => {
    const href = ee_settings.get( "ee-query-state" );
    ee_settings.set( "ee-query-state", "" );

    do_query_href( href );

    if ( isTutorial( href ) || isDocument( href ) )
    {
      setPanelSize( false );
    }
    else
    {
      updatePanels();
    }
  };

  /**
   * Document markup constants.
   */

  const doc_type = '<!DOCTYPE html>\r\n';
  const html_otag = '<html>\r\n';
  const html_ctag = '</html>\r\n';
  const head_otag = '<head>\r\n';
  const head_ctag = '</head>\r\n';
  const body_otag = '<body>\r\n';
  const body_ctag = '</body>\r\n';
  const body_tag = '  <body>\r\n';
  const p_otag = '<p>\r\n';
  const p_ctag = '\r\n</p>\r\n';
  const pre_otag = '<pre>\r\n';
  const pre_ctag = '\r\n</pre>\r\n';

  const view_open = doc_type + html_otag + body_otag + pre_otag;
  const view_close = pre_ctag + body_ctag + html_ctag;

  const html_open = doc_type + html_otag + body_otag + p_otag;
  const html_close = p_ctag + body_ctag + html_ctag;

  const style_tag = '<link rel="stylesheet" type="text/css" href="eex.css"/>\r\n';
  const script_tag = '<script type="text/javascript" ' +
    'src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js' +
    '?config=MML_CHTML"></script>\r\n';
  const head_tag = head_otag + script_tag + head_ctag;

  /**
   * Insert document markup to set the font size.
   */
  const addFontSize = ( markup, key ) => {
    const sz = ee_settings.getNumber( key );
    if ( sz )
    {
      markup = markup.replace( "<body>",
        "<body style=\"font-size: " + sz + "pt\">" );
    }
    return markup;
  };

  /**
   * Insert document markup to view an HTML document.
   */
  const addViewMarkup = ( markup ) => {
    markup = markup.replaceAll( "&", "&amp;" );
    markup = markup.replaceAll( "<", "&lt;" );

    var result = view_open + markup + view_close;
    result = addFontSize( result, "ee-html-font-size" );

    return result;
  };

  /**
   * Insert document markup to invoke the MathJax library.
   */
  const addMathMarkup = ( markup, mathjax ) => {
    var result = markup;
    if ( mathjax )
    {
      result = result.replace( body_tag, head_tag + body_tag );
    }

    result = result.replace( head_ctag, style_tag + head_ctag );
    result = addFontSize( result, "ee-html-font-size" );

    return result;
  };

  /**
   * Insert document markup to view a BRL document.
   */
  const addBRLMarkup = ( markup ) => {
    var result = html_open + markup.replaceAll( "\n", "<br/>\r\n" ) + html_close;

    result = result.replace( body_otag, head_otag + style_tag + head_ctag + body_otag );
    result = addFontSize( result, "ee-brl-font-size" );

    result = result.replace( "<body", "<body class=\"brl\"" );

    return result;
  };

  /**
   * Retrieve document markup for BRF output.
   */
  const getBRFMarkup = () => {
    const markup = editor.formatAsciiBraille() + '\n';
    const result = markup.replaceAll( '\n', '\r\n' );
    return result;
  };

  /**
   * Retrieve document markup for BRL output.
   */
  const getBRLMarkup = () => {
    const markup = editor.formatBraille() + '\n';
    const result = markup.replaceAll( '\n\f', '\u2800\n' );
    return result;
  };

  /**
   * Retrieve a file handle for an open file operation.
   */
  const openFile = async ( options ) => {
    if ( window.showOpenFilePicker )
    {
      [ handle ] = await window.showOpenFilePicker( options );
      const file = await handle.getFile();
      setOpenFileHandle( handle );
      return file;
    }
    else
    {
      return new Promise( ( resolve ) => {
        const input = document.createElement( "input" );
        input.type = "file";
        input.addEventListener( "change", () => {
          const file = input.files[ 0 ];
          setOpenFileName( file.name );
          resolve( file );
        } );
        input.click();
      } );
    }
  };

  /**
   * Output document markup for a save file operation.
   */
  const saveFile = async ( options, markup, update, ftype ) => {
    setFileOption( options, ftype );

    if ( window.showSaveFilePicker )
    {
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();
      update && setOpenFileHandle( handle );
      await file.write( markup );
      await file.close();
    }
    else
    {
      const name = options.suggestedName + ( ftype ? "" : ".html" );
      const type = "application/html";
      const blob = new Blob( [ markup ], { type: type } );
      const a = document.createElement( "a" );
      a.download = name;
      a.href = URL.createObjectURL( blob );
      a.addEventListener( "click", () => {
        setTimeout( () => URL.revokeObjectURL( a.href ), 30000 );
      } );
      a.click();
    }
  };

  /**
   * Output document markup for a save file operation.
   */
  const saveThis = async ( markup ) => {
    if ( window.showSaveFilePicker )
    {
      const handle = open_file_handle;
      const file = await handle.createWritable();
      await file.write( markup );
      await file.close();
    }
    else
    {
      const name = open_file_handle.name;
      const type = "application/html";
      const blob = new Blob( [ markup ], { type: type } );
      const a = document.createElement( "a" );
      a.download = name;
      a.href = URL.createObjectURL( blob );
      a.addEventListener( "click", () => {
        setTimeout( () => URL.revokeObjectURL( a.href ), 30000 );
      } );
      a.click();
    }
  };

  /**
   * Move the equation editor cursor to the home position.
   */
  const moveToHome = () => {
    setTimeout( () => {
      editor.processTemplate( "ctrl-home" )
    }, 200 );
  };

  /**
   * Retrieve the equation editor content markup.
   */
  const getContent = () => {
    return editor.getContent();
  };

  /**
   * Set the equation editor content markup.
   */
  const setContent = ( value ) => {
    editor.setContent( value );
    editor.setFocus();
    moveToHome();
  };

  /**
   * Retrieve the active document link target.
   */
  const getLinkTarget = () => {
    var href = "";
    var select = window.editor.selection();
    var count = select.getHeadReferenceCount();
    for ( var i = 0; i < count && !href; i += 1 )
    {
      var elt = select.getHeadReference( i ).getContent();
      href = elt.getAttribute( "href" ) || "";
    }
    return href;
  };

  /**
   * Create an equation editor document link.
   */
  const createLink = ( fileName, fileId ) => {
    // null is dialog cancel, empty string is remove link
    if ( fileName !== null )
    {
      editor.createLink( fileName, fileId );
      editor.setFocus();
    }
  };

  /**
   * Retrieve the math markup from an equation editor document.
   */
  const getMathBits = ( value ) => {
    var result = [];
    var index = 0;
    var start = 0;
    var limit = 0;
    var data;

    while ( ( index = value.indexOf( "<math ", index ) ) != -1 )
    {
        // Remove the outer <math> tags
        start = value.indexOf( ">", index );
        limit = value.indexOf( "</math>", index );

        if ( start === -1 || limit === -1 )
        {
            break;
        }

        data = value.substring( start + 1, limit );
        index = limit;

        // Remove the outer <mtable> tags
        start = data.indexOf( "<mtable>" );
        limit = data.indexOf( "</mtable>" );

        if ( !( start === -1 || limit === -1 ) )
        {
            data = data.substring( start + 8, limit );
        }

        // Supply the outer <mtr> <mtd> tags
        start = data.indexOf( "<mtr>" );
        limit = data.indexOf( "</mtr>" );

        if ( start === -1 || limit === -1 )
        {
            data = "<mtr><mtd>" + data + "</mtd></mtr>";
        }
 
        result.push( data );
    }

    return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mtable>'
        + result.join() + '</mtable></math>';
  };

  /**
   * Handler method for the file > new operation.
   */
  const do_file_new = async ( event ) => {
    try {
      event && event.preventDefault();

      editor.processTemplate( "clear" );
      editor.setFocus();
      moveToHome();

      setOpenFileName( "" );
      home_URL = "";
      file_URL = "";

      setPanelSize( true );
      ee_drive.clear();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > open operation.
   */
  const do_file_open = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( open_types );
      const file = await openFile( options );
      const markup = await file.text();

      setContent( markup );
      ee_drive.clear();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > save operation.
   */
  const do_file_save = async ( event ) => {
    if ( ! open_file_handle )
    {
        do_file_save_as( event );
        return;
    }

    try {
      event && event.preventDefault();

      await saveThis( getContent() );
      ee_drive.clear();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > save as operation.
   */
  const do_file_save_as = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( open_types );
      await saveFile( options, getContent(), true );
      ee_drive.clear();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > link operation.
   */
  const do_file_link = async ( event ) => {
    try {
      event && event.preventDefault();
      createLink( prompt( "Link to file name", getLinkTarget() ) );
    }
    catch ( e )
    {
    }
  };

  const do_file_close = do_file_new;

  /**
   * Handler method for the file > save HTML operation.
   */
  const do_save_HTML = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( html_types );
      const mathjax = ee_settings.getBool( "ee-mathjax-on-save" );
      const markup = addMathMarkup( editor.getPresent(), mathjax );
      await saveFile( options, markup, false, "-p.html" );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > save BRF operation.
   */
  const do_save_BRF = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( brf_types );
      const markup = getBRFMarkup();
      await saveFile( options, markup, false, ".brf" );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > save BRL operation.
   */
  const do_save_BRL = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( brl_types );
      const markup = getBRLMarkup();
      await saveFile( options, markup, false, ".brl" );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > print preview operation.
   */
  const do_preview = async ( event ) => {
    try {
      event && event.preventDefault();

      const mathjax = ee_settings.getBool( "ee-mathjax-on-export" );
      const markup = addMathMarkup( editor.getPresent(), mathjax );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, ".html" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );

      if ( mathjax )
      {
        setTimeout( () => nwindow.MathJax.Hub.Startup.onload(), 100 );
      }
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > print HTML operation.
   */
  const do_print_HTML = async ( event ) => {
    try {
      event && event.preventDefault();

      const mathjax = ee_settings.getBool( "ee-mathjax-on-print" );
      const markup = addMathMarkup( editor.getPresent(), mathjax );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, ".html" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );

      if ( mathjax )
      {
        setTimeout( () => {
          nwindow.MathJax.Hub.Startup.onload();
          nwindow.MathJax.Hub.Queue( () => nwindow.print() );
        }, 100 );
      }
      else
      {
        setTimeout( () => nwindow.print(), 100 );
      }
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > print BRF operation.
   */
  const do_print_BRF = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = addViewMarkup( getBRFMarkup() );
      const nwindow = window.open( "" );

      const options = getFileOptions( brf_types );
      setFileOption( options, ".brf" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );

      setTimeout( () => nwindow.print(), 100 );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > print BRL operation.
   */
  const do_print_BRL = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = addBRLMarkup( getBRLMarkup() );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, ".brl" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );

      setTimeout( () => nwindow.print(), 100 );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > view source operation.
   */
  const do_view_source = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = addViewMarkup( getContent() );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, ".html" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > view HTML operation.
   */
  const do_view_HTML = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = addViewMarkup( editor.getPresent() );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, "-p.html" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > view BRF operation.
   */
  const do_view_BRF = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = addViewMarkup( getBRFMarkup() );
      const nwindow = window.open( "" );

      const options = getFileOptions( brf_types );
      setFileOption( options, ".brf" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > view BRL operation.
   */
  const do_view_BRL = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = addBRLMarkup( getBRLMarkup() );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, ".brl" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
      nwindow.document.addEventListener( "keydown", onEscapeChild( nwindow ) );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > open operation.
   */
  const do_drive_open = async ( event ) => {
    try {
      event && event.preventDefault();
      ee_drive.open( setContent, setOpenFileData );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save operation.
   */
  const do_drive_save = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( open_types );
      setFileOption( options );

      ee_drive.save( getContent, setOpenFileData, options );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save as operation.
   */
  const do_drive_save_as = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( open_types );
      setFileOption( options );

      ee_drive.save_as( getContent, setOpenFileData, options );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save replace operation.
   */
  const do_drive_save_replace = async ( event ) => {
    try {
      event && event.preventDefault();
      ee_drive.save_replace( getContent, setOpenFileData );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save HTML operation.
   */
  const do_drive_save_HTML = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( html_types );
      const mathjax = ee_settings.getBool( "ee-mathjax-on-save" );
      const markup = addMathMarkup( editor.getPresent(), mathjax );

      setFileOption( options, "-p.html" );
      ee_drive.save_as( () => markup, null, options );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save BRF operation.
   */
  const do_drive_save_BRF = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( brf_types );
      const markup = getBRFMarkup();

      setFileOption( options, ".brf" );
      ee_drive.save_as( () => markup, null, options );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save BRL operation.
   */
  const do_drive_save_BRL = async ( event ) => {
    try {
      event && event.preventDefault();

      const options = getFileOptions( brl_types );
      const markup = getBRLMarkup();

      setFileOption( options, ".brl" );
      ee_drive.save_as( () => markup, null, options );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > link operation.
   */
  const do_drive_link = async ( event ) => {
    try {
      event && event.preventDefault();
      ee_drive.link( createLink );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > install operation.
   */
  const do_drive_install = async ( event ) => {
    try {
      event && event.preventDefault();
      ee_drive.install();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > copy operation.
   */
  const do_edit_copy = async ( event ) => {
    try {
      event && event.preventDefault();
      editor.copy();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > paste operation.
   */
  const do_edit_paste = async ( event ) => {
    try {
      event && event.preventDefault();
      editor.paste();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > copy all operation.
   */
  const do_edit_copy_all = async ( event ) => {
    try {
      event && event.preventDefault();
      navigator.clipboard.writeText( getContent() );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > paste all operation.
   */
  const do_edit_paste_all = async ( event ) => {
    try {
      event && event.preventDefault();
      navigator.clipboard.readText().then( setContent );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > copy HTML operation.
   */
  const do_edit_copy_HTML = async ( event ) => {
    try {
      event && event.preventDefault();
      editor.copyPresent();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > copy all HTML operation.
   */
  const do_edit_copy_all_HTML = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = editor.getPresent();
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the edit > copy all math operation.
   */
  const do_edit_copy_all_math = async ( event ) => {
    try {
      event && event.preventDefault();

      const markup = getMathBits( editor.getPresent() );
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the panel > maximize menu operation.
   */
  const do_panel_maximize = async ( event ) => {
    event && event.preventDefault();

    const value = !ee_settings.getBool( "ee-panel-all-panels" );
    setPanelSize( value );
  };

  /**
   * Handler method for the panel > menus menu operation.
   */
  const do_panel_menus = async ( event ) => {
    event && event.preventDefault();

    if ( ee_settings.getBool( "ee-panel-all-panels" ) )
    {
      ee_settings.toggleBool( "ee-panel-app-menus" );
      updatePanels();
    }
    else
    {
      ee_settings.setBool( "ee-panel-app-menus", true );
      setPanelSize( true );
    }
  };

  /**
   * Handler method for the panel > file name menu operation.
   */
  const do_panel_fname = async ( event ) => {
    event && event.preventDefault();
    ee_settings.toggleBool( "ee-panel-open-file" );
    updatePanels();
  };

  /**
   * Handler method for the panel > quick buttons menu operation.
   */
  const do_panel_quick = async ( event ) => {
    event && event.preventDefault();
    ee_settings.toggleBool( "ee-panel-quick-bar" );
    updatePanels();
  };

  /**
   * Handler method for the panel > size palettes menu operation.
   */
  const do_panel_side = async ( event ) => {
    event && event.preventDefault();
    ee_settings.toggleBool( "ee-panel-side-bar" );
    updatePanels();
  };

  /**
   * Handler method for the panel > braille bar menu operation.
   */
  const do_panel_braille = async ( event ) => {
    event && event.preventDefault();
    ee_settings.toggleBool( "ee-panel-braille-bar" );
    updatePanels();
  };

  const edt_index = "doc/edt/0000.html";
  const edt_start = "doc/edt/0101.html";
  const basic_url = "doc/basic/Syllabus.html";

  const samples_url =
    'https://drive.google.com/drive/folders/1FrhoeG8olkVnCgB-F3d-edxvqnK-guPu?usp=sharing';

  /**
   * Handler method for the help > tutorial menu operation.
   */
  const do_help_tutorial_edt = async ( event ) => {
    try {
      event && event.preventDefault();

      var href = edt_start;

      if ( ee_settings.getBool( "ee-edt-show-last-page" ) )
      {
        href = ee_settings.get( "ee-edt-last-page-href" ) || href;
      }

      if ( href )
      {
        do_query_href( href );
        setPanelSize( false );
      }
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the help > Getting To Know menu operation.
   */
  const do_help_tutorial_gtk = async ( event ) => {
    try {
      event && event.preventDefault();

      var target = event && event.target || document.querySelector( "#getting" );
      var href = src_URL + target.getAttribute( "href" );

      if ( ee_settings.getBool( "ee-gtk-show-last-page" ) )
      {
        href = ee_settings.get( "ee-gtk-last-page-href" ) || href;
      }

      do_help_href( href );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the help > settings menu operation.
   */
  const do_help_settings = async ( event ) => {
    try {
      event && event.preventDefault();

      const href = event.target.getAttribute( "href" );
      const nwindow = do_help_href( href );

      nwindow && nwindow.addEventListener( "beforeunload", () => {
        EquationEditorAPI.updateSettings();
        updateMenuBarPanel();
        updateOpenFilePanel();
      } );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method to open specific help resources.
   */
  const do_help_href = ( href ) => {
    try {
      const src = href.startsWith( "http" ) ? href : src_URL + href;
      const nwindow = window.open( src );

      nwindow.addEventListener( "unload", () => {
        editor.setFocus();
      } );

      return nwindow;
    }
    catch ( e )
    {
      return null;
    }
  };

  /**
   * Handler method to open specific help resources.
   */
  const do_help_id = ( id ) => {
    const target = document.querySelector( id );
    const href = target.getAttribute( "href" );

    return do_help_href( href );
  };

  /**
   * Handler method for help menu operations.
   */
  const do_help = async ( event ) => {
    try {
      event && event.preventDefault();

      const href = event.target.getAttribute( "href" );
      do_help_href( href );
    }
    catch ( e )
    {
    }
  };

  /**
   * Tutorial index numbers.
   */

  const indexStart = 101;
  const indexLimit = 439;
  const skipIndex = {
    180: true,
    190: true,
    200: true,
    300: true,
    350: true,
    360: true,
    370: true,
    380: true,
    390: true,
    400: true
  };

  const getIndex = s => parseInt( s.replace( /.*([0-9]{4}).*/, "$1" ) );
  const nextHome = v => ( v % 10 === 1 ? v - 10 : v - v % 10 + 1 );
  const nextEnd = v => ( v % 10 === 9 ? v + 10 : v - v % 10 + 9 );
  const putIndex = v => ( "0000" + v.toString() ).substr( -4 );

  /**
   * Return the next index for the tutorial home key.
   */
  const nextHomeIndex = function ( url ) {
    var index = getIndex( url );
    index = index > indexStart ? nextHome( index ) : index;
    while ( skipIndex[ index - 1 ] )
    {
      index = nextHome( index );
    }
    return putIndex( index );
  };

  /**
   * Return the next index for the tutorial end key.
   */
  const nextEndIndex = function ( url ) {
    var index = getIndex( url );
    index = index < indexLimit ? nextEnd( index ) : index;
    while ( index === 109 || skipIndex[ index - 9 ] )
    {
      index = nextEnd( index );
    }
    return putIndex( index );
  };

  /**
   * Add markup to a user interface element.
   */
  const addMarkup = ( s, markup ) => {
    const elt = document.querySelector( s );
    if ( elt )
    {
      elt.innerHTML = markup;
    }
  };

  /**
   * Add a click handler to a user interface element.
   */
  const addClick = ( s, fn ) => {
    const elt = document.querySelector( s );
    if ( elt )
    {
      elt.onclick = fn;
    }
  };

  /**
   * Ignore alt key release events.
   */
  const onAltKey = ( event ) => {
    if ( event.altKey )
    {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };

  /**
   * Handler for menu key accelerators.
   */
  const onMenuKey = ( event ) => {
    const alt = event.altKey && event.shiftKey && ! event.ctrlKey;
    const key = event.code.replace( "Key", "" );

    var val = alt && menuKeys[ key ] || "";
    var elt = val && document.querySelector( val ) || null;

    const lst = $(".dropdown.open" ).find( ".dropdown-menu" ).find( "a" );
    const len = lst.length;
    const idx = lst.index( event.target );
    var nxt = null;

    if ( menu_bar_panel.contains( event.target ) )
    {
      if ( key === "ArrowLeft" )
      {
        elt = $( ".dropdown.open" ).prev( ".dropdown" ).find( "a" )[0];
        val = "#" + ( elt ? elt.id : "" );
      }

      if ( key === "ArrowRight" )
      {
        elt = $( ".dropdown.open" ).next( ".dropdown" ).find( "a" )[0];
        val = "#" + ( elt ? elt.id : "" );
      }

      if ( key === "ArrowUp" || key === "Tab" && event.shiftKey )
      {
        nxt = lst[ idx < 1 ? len - 1 : idx - 1 ] || null;
        val = "#" + ( nxt ? nxt.id : "" );
      }

      if ( key === "ArrowDown" || key === "Tab" && !event.shiftKey )
      {
        nxt = lst[ idx + 1 < len ? idx + 1 : 0 ] || null;
        val = "#" + ( nxt ? nxt.id : "" );
      }
    }

    if ( elt )
    {
      LOG( "menu " + val );
      event.stopImmediatePropagation();
      event.preventDefault();

      $( menu_bar_panel ).show();
      elt.click();
    }

    if ( nxt )
    {
      LOG( "next " + val );
      event.stopImmediatePropagation();
      event.preventDefault();

      nxt.focus();
    }
  };

  /**
   * Handler for menu item accelerators.
   */
  const onMenuItem = ( event ) => {
    const melt = $( ".dropdown.open" ).find( "a" )[ 0 ]
    const mkey = melt && melt.innerText[ 0 ] || "";
    const mval = menuItems[ mkey ] || {};

    const key = event.code.replace( "Key", "" );
    var val = mval[ key ] || "";
    var elt = val && document.querySelector( val ) || null;

    if ( menu_bar_panel.contains( event.target ) )
    {
      if ( key === "Enter" )
      {
        val = "#" + event.target.id;
        elt = event.target;
      }
    }

    if ( elt )
    {
      LOG( "item " + val );
      event.stopImmediatePropagation();
      event.preventDefault();

      elt.click();
      updateMenuBarPanel();
      editor.setFocus();
    }
  };

  /**
   * Handler to close the open drop down menu.
   */
  const onMenuClose = ( event ) => {
    const elt = $( ".dropdown.open" ).find( "a" )[0];

    if ( elt )
    {
      event && event.stopImmediatePropagation();
      event && event.preventDefault();

      LOG( "close #" + elt.id );
      elt.click();
      editor.setFocus();
    }
  };

  /**
   * Handler for the escape key.
   */
  const onEscapeKey = ( event ) => {
    if ( menu_bar_panel.contains( event.target ) )
    {
      onMenuClose();
      updateMenuBarPanel();
    }

    else if ( isTutorial( file_URL ) || isDocument( file_URL ) )
    {
      event.stopImmediatePropagation();
      event.preventDefault();

      do_file_new();
    }
  };

  /**
   * Handler for the escape key in a child window.
   */
  const onEscapeChild = ( nwindow ) => ( event ) => {
    if ( event.code === "Escape" )
    {
       nwindow.close();
    }
  };

  /**
   * Handler for the enter key.
   */
  const onEnterKey = ( event ) => {
    var href = getLinkTarget();
    var next = $( ".ee-input-panel a" ).filter(
      ( i, x ) => x.innerHTML === "[Alt+Enter]" ).attr( "href" );

    if ( event.altKey && ! event.ctrlKey )
    {
      // Next page, then current link, then right link
      href = next || href;
      if ( !href )
      {
        window.editor.selection().linkRight();
        href = getLinkTarget();
      }
    }

    if ( href )
    {
      event.stopImmediatePropagation();
      event.preventDefault();

      do_query_href( href );
    }
  };

  /**
   * Handler for the home key.
   */
  const onHomeKey = ( event ) => {
    event.stopImmediatePropagation();
    event.preventDefault();

    const index = nextHomeIndex( file_URL );
    const href = file_URL.replace( src_URL, "?" ).replace( /[0-9]{4}/, index );

    do_query_href( href );
  };

  /**
   * Handler for the end key.
   */
  const onEndKey = ( event ) => {
    event.stopImmediatePropagation();
    event.preventDefault();

    const index = nextEndIndex( file_URL );
    const href = file_URL.replace( src_URL, "?" ).replace( /[0-9]{4}/, index );

    do_query_href( href );
  };


  /**
   * Handler for the left key.
   */
  const onLeftKey = ( event ) => {
    event.stopImmediatePropagation();
    event.preventDefault();

    window.history.back();
  };

  /**
   * Handler for the right key.
   */
  const onRightKey = ( event ) => {
    event.stopImmediatePropagation();
    event.preventDefault();

    window.history.forward();
  };

  /**
   * Handler for editor user interface keys.
   */
  const onKeyDown = ( event ) => {
    const key = event.code;
    const alt = event.altKey && ! event.ctrlKey;

    if ( key === "Escape" )
    {
      onEscapeKey( event );
    }

    if ( key === "Enter" )
    {
      onEnterKey( event );
    }

    if ( key === "Home" && alt && isTutorial( file_URL ) )
    {
      onHomeKey( event );
    }

    if ( key === "End" && alt && isTutorial( file_URL ) )
    {
      onEndKey( event );
    }

    if ( key === "ArrowLeft" && alt )
    {
      onLeftKey( event );
    }

    if ( key === "ArrowRight" && alt )
    {
      onRightKey( event );
    }
  };

  /**
   * Handler for document link mouse down.
   */
  const onDocLink = ( event ) => {
    var target = event.target;
    while ( !target.href && target.parentNode.nodeType === 1 )
    {
      target = target.parentNode;
    }
    const href = target.getAttribute( "href" ) || "";

    if ( href )
    {
      event.stopImmediatePropagation();
      event.preventDefault();

      if ( base_URL )
      {
        do_query_href( href );
      }
      else
      {
        do_file_open();
      }
    }
  };

  /**
   * Handler for window history links.
   */
  const onPopHistory = ( event ) => {
    event.preventDefault();
    do_query_data( event.state );
  };

  const menu_markup =
'  <div class="navbar navbar-default" role="navigation">' +
'    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">' +
'      <ul class="nav navbar-nav">' +
'        <li class="dropdown">' +
'          <a href="#" id="file_menu" class="dropdown-toggle" data-toggle="dropdown" role="button"' +
'             aria-haspopup="true" aria-expanded="false" aria-label="File">F&#x0332;ile<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="new" aria-label="New">N&#x0332;ew</a></li>' +
'            <li><a href="#" id="open" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="save" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="saveAs" aria-label="Save As">Save A&#x0332;s</a></li>' +
'            <li><a href="#" id="view" aria-label="View Source">V&#x0332;iew Source</a></li>' +
'            <li><a href="#" id="preview" aria-label="Print Preview">Print Pr&#x0332;eview</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveHTML" aria-label="Save HTML">Save H&#x0332;TML</a></li>' +
'            <li><a href="#" id="viewHTML">View HTML</a></li>' +
'            <li><a href="#" id="printHTML" aria-label="Print HTML">P&#x0332;rint HTML</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRF" aria-label="Save BRF">Save B&#x0332;RF</a></li>' +
'            <li><a href="#" id="viewBRF">View BRF</a></li>' +
'            <li><a href="#" id="printBRF" aria-label="Emboss BRF">E&#x0332;mboss BRF</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRL">Save BRL</a></li>' +
'            <li><a href="#" id="viewBRL">View BRL</a></li>' +
'            <li><a href="#" id="printBRL">Print BRL</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="link" aria-label="Link">L&#x0332;ink</a></li>' +
'            <li><a href="#" id="close" aria-label="Close">C&#x0332;lose</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" id="drive_menu" class="dropdown-toggle" data-toggle="dropdown" role="button"' +
'             aria-haspopup="true" aria-expanded="false" aria-label="Drive">D&#x0332;rive<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="drive_open" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="drive_save" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="drive_saveAs" aria-label="Save As">Save A&#x0332;s</a></li>' +
'            <li><a href="#" id="drive_saveReplace" aria-label="Save Replace">Save R&#x0332;eplace</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="drive_saveHTML" aria-label="Save HTML">Save H&#x0332;TML</a></li>' +
'            <li><a href="#" id="drive_saveBRF" aria-label="Save BRF">Save B&#x0332;RF</a></li>' +
'            <li><a href="#" id="drive_saveBRL">Save BRL</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="drive_link" aria-label="Link">L&#x0332;ink</a></li>' +
'            <li><a href="#" id="drive_install" aria-label="Install">I&#x0332;nstall</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" id="edit_menu" class="dropdown-toggle" data-toggle="dropdown" role="button"' +
'             aria-haspopup="true" aria-expanded="false" aria-label="Edit">E&#x0332;dit<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="copy">Copy</a></li>' +
'            <li><a href="#" id="paste">Paste</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="copyAll">Copy All</a></li>' +
'            <li><a href="#" id="pasteAll">Paste All</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="copyHTML">Copy HTML</a></li>' +
'            <li><a href="#" id="copyAllHTML">Copy All HTML</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="copyAllMath">Copy All Math</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" id="panel_menu" class="dropdown-toggle" data-toggle="dropdown" role="button"' +
'             aria-haspopup="true" aria-expanded="false" aria-label="View">V&#x0332;iew<span class="caret"></span></a>' +
'          <ul class="dropdown-menu check">' +
'            <li><a href="#" id="panel_maximize" aria-label="Maximize">Max&#x0332;imize</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="panel_menus" aria-label="Menus">M&#x0332;enus</a></li>' +
'            <li><a href="#" id="panel_fname" aria-label="File Name">F&#x0332;ile Name</a></li>' +
'            <li><a href="#" id="panel_quick" aria-label="Quick Buttons">Q&#x0332;uick Buttons</a></li>' +
'            <li><a href="#" id="panel_side" aria-label="Side Palettes">S&#x0332;ide Palettes</a></li>' +
'            <li><a href="#" id="panel_braille" aria-label="Braille Bar">B&#x0332;raille Bar</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" id="help_menu" class="dropdown-toggle" data-toggle="dropdown" role="button"' +
'             aria-haspopup="true" aria-expanded="false" aria-label="Help">H&#x0332;elp<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="' + edt_start + '" id="welcome" aria-label="Welcome">W&#x0332;elcome</a></li>' +
'            <li><a href="' + basic_url + '" id="training" aria-label="Basic Training">B&#x0332;asic Training</a></li>' +
'            <li><a href="#" id="tutorial" aria-label="Tutorial">T&#x0332;utorial</a></li>' +
'            <li><a href="' + edt_index + '" id="index" aria-label="Index">I&#x0332;ndex</a></li>' +
'            <li><a href="ee-guide.html" id="guide" aria-label="Users Guide">U&#x0332;sers Guide</a></li>' +
'            <li><a href="gtk/intro.html" id="getting" aria-label="Getting To Know">Getting To K&#x0332;now</a></li>' +
'            <hr/>' +
'            <li><a href="' + samples_url + '" id="samples" aria-label="Samples">Sam&#x0332;ples</a></li>' +
'            <li><a href="ee-settings.html" id="settings" aria-label="Settings">Setting&#x0332;s</a></li>' +
'            <hr/>' +
'            <li><a href="ee-terms.pdf" id="terms">Terms of Service</a></li>' +
'            <li><a href="ee-privacy.pdf" id="privacy">Privacy Policy</a></li>' +
'            <hr/>' +
'            <li><a href="ee-about.html" id="about" aria-label="About">A&#x0332;bout</a></li>' +
'          </ul>' +
'        </li>' +
'      </ul>' +
'    </div>' +
'  </div>';

  /**
   * The menu accelerator keys.
   */
  const menuKeys = {
    F: "#file_menu",
    D: "#drive_menu",
    E: "#edit_menu",
    V: "#panel_menu",
    H: "#help_menu",

    X: "#panel_maximize",
    M: "#panel_menus",
    P: "#printHTML",
    I: "#index",
    T: "#tutorial"
  };

  /**
   * The menu item accelerator keys.
   */
  const menuItems = {
    F: {
      N: "#new",
      O: "#open",
      S: "#save",
      A: "#saveAs",
      V: "#view",
      R: "#preview",
      H: "#saveHTML",
      P: "#printHTML",
      B: "#saveBRF",
      E: "#printBRF",
      L: "#link",
      C: "#close"
    },
    D: {
      O: "#drive_open",
      S: "#drive_save",
      A: "#drive_saveAs",
      R: "#drive_saveReplace",
      H: "#drive_saveHTML",
      B: "#drive_saveBRF",
      L: "#drive_link",
      I: "#drive_install"
    },
    V: {
      X: "#panel_maximize",
      M: "#panel_menus",
      F: "#panel_fname",
      Q: "#panel_quick",
      S: "#panel_side",
      B: "#panel_braille"
    },
    H: {
      W: "#welcome",
      B: "#training",
      T: "#tutorial",
      I: "#index",
      U: "#guide",
      K: "#getting",
      M: "#samples",
      G: "#settings",
      A: "#about"
    }
  };

  /**
   * Construct the user interface menu elements.
   */
  const initMenus = () => {
    addMarkup( ".ee-menu", menu_markup );

    addClick( "#new", do_file_new );
    addClick( "#open", do_file_open );
    addClick( "#save", do_file_save );
    addClick( "#saveAs", do_file_save_as );
    addClick( "#view", do_view_source );
    addClick( "#preview", do_preview );
    addClick( "#link", do_file_link );
    addClick( "#saveHTML", do_save_HTML );
    addClick( "#viewHTML", do_view_HTML );
    addClick( "#printHTML", do_print_HTML );
    addClick( "#saveBRF", do_save_BRF );
    addClick( "#viewBRF", do_view_BRF );
    addClick( "#printBRF", do_print_BRF );
    addClick( "#saveBRL", do_save_BRL );
    addClick( "#viewBRL", do_view_BRL );
    addClick( "#printBRL", do_print_BRL );
    addClick( "#close", do_file_close );

    addClick( "#drive_open", do_drive_open );
    addClick( "#drive_save", do_drive_save );
    addClick( "#drive_saveAs", do_drive_save_as );
    addClick( "#drive_saveReplace", do_drive_save_replace );
    addClick( "#drive_saveHTML", do_drive_save_HTML );
    addClick( "#drive_saveBRF", do_drive_save_BRF );
    addClick( "#drive_saveBRL", do_drive_save_BRL );
    addClick( "#drive_link", do_drive_link );
    addClick( "#drive_install", do_drive_install );

    addClick( "#copy", do_edit_copy );
    addClick( "#paste", do_edit_paste );
    addClick( "#copyAll", do_edit_copy_all );
    addClick( "#pasteAll", do_edit_paste_all );
    addClick( "#copyHTML", do_edit_copy_HTML );
    addClick( "#copyAllHTML", do_edit_copy_all_HTML );
    addClick( "#copyAllMath", do_edit_copy_all_math );

    addClick( "#panel_maximize", do_panel_maximize );
    addClick( "#panel_menus", do_panel_menus );
    addClick( "#panel_fname", do_panel_fname );
    addClick( "#panel_quick", do_panel_quick );
    addClick( "#panel_side", do_panel_side );
    addClick( "#panel_braille", do_panel_braille );

    addClick( "#tutorial", do_help_tutorial_edt );
    addClick( "#getting", do_help_tutorial_gtk );
    addClick( "#settings", do_help_settings );
    addClick( "#samples", do_help );
    addClick( "#guide", do_help );
    addClick( "#about", do_help );

    addClick( "#terms", do_help );
    addClick( "#privacy", do_help );

    // Update equation editor user interface panels.
    updateMenuBarPanel();
    updateOpenFilePanel();
  };

  /**
   * Install the user interface event handlers.
   */
  const initEvents = () => {

    // Ignore alt key release events
    document.addEventListener( "keyup", onAltKey, true );
    document.addEventListener( "keypress", onAltKey, true );

    // Menu accelerator key down
    document.addEventListener( "keydown", onMenuKey, true );

    // Menu item accelerator key down
    document.addEventListener( "keydown", onMenuItem, true );

    // Editor user interface key down
    document.addEventListener( "keydown", onKeyDown, true );

    // Document link mouse down
    $( ".ee-input-panel" )[ 0 ].addEventListener( "mousedown", onDocLink, true );

    // Process window history links
    window.addEventListener( "popstate", onPopHistory );

    // Process window loss of focus
    window.addEventListener( "blur", onMenuClose );

    // Process input area gain of focus
    $( ".ee-input-panel" ).on( "focus", onMenuClose );

    // Close open menus on mouse leave
    $( ".dropdown-menu" ).on( "mouseleave", onMenuClose );
  };

  /**
   * Load the initial document content.
   */
  const initContent = () => {

    // Process the query parameters
    if ( ee_settings.get( "ee-query-state" ) )
    {
      do_query_state();
    }

    // Show the users guide (ee)
    else if ( ee_settings.getBool( "ee-show-users-guide" ) )
    {
      do_help_id( "#guide" );
    }

    // Show the tutorial screen (edt)
    else if ( ee_settings.getBool( "ee-edt-show-tutorial" ) )
    {
      do_help_tutorial_edt();
    }

    // Show the tutorial screen (gtk)
    else if ( ee_settings.getBool( "ee-gtk-show-tutorial" ) )
    {
      do_help_tutorial_gtk();
    }

    else if ( open_file_name || ee_settings.getBool( "ee-panel-all-panels" ) )
    {
      updatePanels();
    }

    else
    {
      setPanelSize( true );
    }
  };

  return _ee;
})();

document.addEventListener( "keydown", e => {
  if ( e.key === "Enter" )
  {
    const btn = document.querySelector( "#ok" );
    if ( btn )
    {
      save();
      done();
    }
    else if ( !window.editor )
    {
      window.close();
    }
  }

  if ( e.key === "Escape" )
  {
    if ( window.editor )
    {
      window.editor.setFocus();
    }
    else
    {
      window.close();
    }
  }
} );
