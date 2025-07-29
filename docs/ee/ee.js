(() => {
  // Collect the query parameters
  var value = window.location.search;
  if ( value && value !== ee_settings.get( "ee-query-state" ) )
  {
    ee_settings.set( "ee-query-state", value );

    href = window.location.href;
    href = href.substring( 0, href.indexOf( "?" ) );

    window.history.replaceState( null, "", href );
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
    elt.setAttribute( "id", "ee-init-textarea" );
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

    setAppHome();
    setDocHome();

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
   * Retrieve the absolute URL path to the application home.
   */
  const getAppHome = () => {
    return ee_settings.get( "ee-app-home" );
  };

  /**
   * Set the absolute URL path to the application home.
   */
  const setAppHome = () => {
    const elt = document.querySelector( "script[src*='ee.js']" );
    const att = elt && elt.getAttribute( "src" ) || "";
    const uri = document.baseURI;
    const value = new URL( att.replace( "ee.js", "./" ), uri ).href;

    ee_settings.set( "ee-app-home", value );
  };

  /**
   * Retrieve the absolute URL path to the documentation home.
   */
  const getDocHome = () => {
    return ee_settings.get( "ee-doc-home" );
  };

  /**
   * Set the absolute URL path to the documentation home.
   */
  const setDocHome = () => {
    const app = getAppHome();
    const value =
        app.includes( "file:" ) ? "http://localhost/mathex-ee/html/ee/" :
        app.includes( "github.io" ) ? "https://www.lakepinesbraille.com/ee/" :
        app;

    ee_settings.set( "ee-doc-home", value + "doc/" );
  };

  /**
   * Return true if the current url is an editor document.
   */
  const isDocument = url => /doc\//.test( url );

  /**
   * Return true if the current url is a tutorial.
   */
  const isTutorial = url => /edt\//.test( url );

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
    description : "Equalize (HTML + MathML Content)",
    accept : { "application/html" : [ ".ee" ] }
  }, {
    description : "HTML (HTML + MathML Content)",
    accept : { "application/html" : [ ".html" ] }
  }, {
    description : "HTML (HTML + MathML Presentation)",
    accept : { "application/html" : [ ".html" ] }
  }, {
    description : "Markdown (ASCII math, LaTeX math)",
    accept : { "text/markdown" : [ ".md" ] }
  }, {
    description : "Text (ASCII math, LaTeX math)",
    accept : { "text/plain" : [ ".txt" ] }
  } ] };

  /**
   * File save file type options.
   */
  const save_types = { types : [ {
    description : "Equalize (HTML + MathML Content)",
    accept : { "application/html" : [ ".ee" ] }
  }, {
    description : "HTML (HTML + MathML Content)",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  /**
   * File save as file type options.
   */
  const save_as_types = {
    ".ee" : {
      description : "Equalize (HTML + MathML Content)",
      accept : { "application/html" : [ ".ee" ] }
    },
    ".html" : {
      description : "HTML + MathML Presentation",
      accept : { "application/html" : [ ".html" ] }
    },
    ".brf" : {
      description : "Braille Ready File",
      accept : { "application/brf" : [ ".brf" ] }
    },
    ".brl" : {
      description : "Unicode Braille File",
      accept : { "application/brl" : [ ".brl" ] }
    }
  };

  /**
   * File save as get markup methods.
   */
  const save_as_markup = {};

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
   * Settings file save/export file type options.
   */
  const settings_types = { types : [ {
    description : "Equalize Editor Settings",
    accept : { "application/html" : [ ".cfg" ] }
  } ], suggestedName : "ee" };

  /**
   * Retrieve the default file dialog options.
   */
  const getFileOptions =
    ( file_types ) => Object.assign( { startIn: open_file_handle },
        file_options, file_types );

  /**
   * Retrieve the file save dialog options.
   */
  const getSaveOptions = ( ftype ) => Object.assign( {},
    { startIn: open_file_handle }, file_options,
    { types : [ save_as_types[ ftype ] || save_as_types[ ".ee" ] ] } );

  /**
   * Get the suggested file name.
   */
  const getOpenFileName = ( options ) => {
    return open_file_handle && open_file_handle.name ||
        open_file_name || options && options.suggestedName || "untitled";
  };

  /**
   * Set the suggested file name dialog option.
   */
  const setFileOption = ( options, ftype ) => {
    var fname = getOpenFileName( options );

    fname = fname.replace( /^.*\//, "" );
    fname = fname.replace( /\.[^.]*$/, "" );
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
   * The URL of the current document base.
   */
  var base_URL = "";

  /**
   * The URL of the current open document.
   */
  var file_URL = "";

  /**
   * Update the menu bar panel.
   */
  const updateMenuBarPanel = () => {
    const panel = menu_bar_panel;
    const value = ee_settings.getBool( "ee-panel-app-menus" );
    const color = ee_settings.get( "ee-color-contrast" );

    if ( panel )
    {
      panel.style.display = value ? "block" : "none";
      panel.className = "ee-menu ee-" + color;
    }
  };

  /**
   * Update the open file name panel.
   */
  const updateOpenFilePanel = () => {
    const panel = open_file_panel;
    const name = open_file_name;
    const value = ee_settings.getBool( "ee-panel-open-file" );
    const color = ee_settings.get( "ee-color-contrast" );

    if ( panel )
    {
      panel.innerText = name;
      panel.style.display = name && value ? "block" : "none";
      panel.className = "ee-file-name ee-" + color;
    }
  };

  /**
   * Set the open file name.
   */
  const setOpenFileName = ( name ) => {
    open_file_name = name;
    open_file_handle = undefined;

    updateOpenFilePanel();
  };

  /**
   * Set the open file handle.
   */
  const setOpenFileHandle = ( handle ) => {
    setOpenFileName( handle.name );
    open_file_handle = handle;
  };

  /**
   * Set the open file data.
   */
  const setOpenFileData = ( name, data ) => {
    setOpenFileName( name );

    if ( data && data.href )
    {
      delete data.href;
      data.base = data.base || base_URL;
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
  const setPanelSize = () => {
    const dh = 100;
    const dw = 20;

    const hh = window.innerHeight - dh;
    const ww = window.innerWidth - dw;

    const xw = ww - ( ww % 44 );

    ee_settings.setNumber( "ee-height", hh );
    ee_settings.setNumber( "ee-width", xw );
  };

  /**
   * Retrieve the remote resource named in the query parameters.
   */
  const open_url = async ( data, fn, cb ) => {
    var obaseURL = base_URL;
    var ofileURL = file_URL;

    var app = getAppHome();

    base_URL = data.base && new URL( data.base, base_URL || app ).href || base_URL;
    file_URL = data.url && new URL( data.url, base_URL || file_URL || app ).href || "";

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
        const app = getAppHome();

        data.state.base = new URL( s.substring( 0, ix + 1 ), base_URL || app ).href;
        data.state.url = s.substring( ix + 1 );
        base_URL = data.state.base;
      }
    }

    else
    {
      // Short form - remote resource URL
      data.state.base = base_URL || app;
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

    if ( isDocument( href ) )
    {
      setPanelSize();
      do_panel_showOnly();
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

  /**
   * Insert document markup to set the font size.
   */
  const addFontSize = ( markup, key ) => {
    const sz = ee_settings.getNumber( key );
    if ( sz && sz !== "0" )
    {
      markup = markup.replace( "<body>",
        "<body style=\"font-size: " + sz + "pt\">" );
    }
    return markup;
  };

  /**
   * Insert document markup to save an HTML document.
   */
  const addSaveMarkup = ( markup, styles, mathjax ) => {
    var result = markup;

    if ( styles || mathjax )
    {
      result = result.replace( body_tag, head_otag + head_ctag + body_tag );
    }

    if ( styles )
    {
      result = result.replace( head_ctag, style_tag + head_ctag );
    }

    if ( mathjax )
    {
      result = result.replace( head_ctag, script_tag + head_ctag );
    }

    result = addFontSize( result, "ee-save-font-size" );

    return result;
  };

  /**
   * Insert document markup to view an HTML document.
   */
  const addViewMarkup = ( markup ) => {
    markup = markup.replaceAll( "&", "&amp;" );
    markup = markup.replaceAll( "<", "&lt;" );

    var result = view_open + markup + view_close;
    result = addFontSize( result, "ee-view-font-size" );

    return result;
  };

  /**
   * Insert document markup to print an HTML document.
   */
  const addPrintMarkup = ( markup, styles, mathjax ) => {
    var result = markup;

    if ( styles || mathjax )
    {
      result = result.replace( body_tag, head_otag + head_ctag + body_tag );
    }

    if ( styles )
    {
      result = result.replace( head_ctag, style_tag + head_ctag );
    }

    if ( mathjax )
    {
      result = result.replace( head_ctag, script_tag + head_ctag );
    }

    result = addFontSize( result, "ee-print-font-size" );

    return result;
  };

  /**
   * Insert document markup to view a BRF document.
   */
  const addBRFMarkup = ( markup ) => {
    markup = markup.replaceAll( "&", "&amp;" );
    markup = markup.replaceAll( "<", "&lt;" );

    var result = view_open + markup + view_close;
    result = addFontSize( result, "ee-brf-font-size" );

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
   * Retrieve document markup for HTML output.
   */
  const getHTMLMarkup = () => {
    const styles = ee_settings.getBool( "ee-css-styles-on-save" );
    const mathjax = ee_settings.getBool( "ee-mathjax-on-save" );
    const markup = addSaveMarkup( getPresent(), styles, mathjax );
    return markup;
  };
  save_as_markup[ ".html" ] = getHTMLMarkup;

  /**
   * Retrieve document markup for BRF output.
   */
  const getBRFMarkup = () => {
    const markup = editor.formatAsciiBraille() + '\n';
    const result = markup.replaceAll( '\n', '\r\n' );
    return result;
  };
  save_as_markup[ ".brf" ] = getBRFMarkup;

  /**
   * Retrieve document markup for BRL output.
   */
  const getBRLMarkup = () => {
    const markup = editor.formatBraille() + '\n';
    const result = markup.replaceAll( '\n\f', '\u2800\n' );
    return result;
  };
  save_as_markup[ ".brl" ] = getBRLMarkup;

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
  const saveFile = async ( options, markup, ftype ) => {
    if ( window.showSaveFilePicker )
    {
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();

      ( ftype === "ee" ) && setOpenFileHandle( handle );

      await file.write( markup );
      await file.close();
    }
    else
    {
      const name = options.suggestedName + ( ftype ? "" : ".ee" );
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
    editor._brailleBar.hideFocusWord();
    return editor.getContent();
  };
  save_as_markup[ ".ee" ] = getContent;

  /**
   * Set the equation editor content markup.
   */
  const setContent = ( value ) => {
    editor.setContent( value );
    editor.setFocus();
    moveToHome();
  };

  /**
   * Retrieve the equation editor presentation markup.
   */
  const getPresent = () => {
    editor._brailleBar.hideFocusWord();
    return editor.getPresent();
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
    if ( href.includes( "?state" ) )
    {
      href = href.substring( href.indexOf( "?" ) );
      href = href.replace( "?state=%7B%22action%22%3A%22open%22%2C%22ids%22%3A%5B%22", "?id=" );
      href = href.replace( "%22%5D%7D", "" );
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
      LOG( "#do_file_new" );

      editor.processTemplate( "clear" );
      editor.setFocus();
      moveToHome();

      setOpenFileName( "" );
      file_URL = "";

      setPanelSize();
      do_panel_showAll();
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
      LOG( "#do_file_open" );

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
        do_save_Source( event );
        return;
    }

    const fname = getOpenFileName();
    if ( !( fname.endsWith( ".ee" ) ||
            fname.endsWith( ".html" ) ) )
    {
        do_save_Source( event );
        return;
    }

    try {
      event && event.preventDefault();
      LOG( "#do_file_save" );

      await saveThis( getContent() );
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
      LOG( "#do_file_link" );

      createLink( prompt( "Link to file name", getLinkTarget() ) );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the settings > save operation.
   */
  const do_save_settings = async ( cb ) => {
    try {
      cb && cb();

      const options = getFileOptions( settings_types );
      await saveFile( options, ee_settings.save() );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the settings > load operation.
   */
  const do_load_settings = async ( cb ) => {
    try {
      const options = getFileOptions( settings_types );
      const file = await openFile( options );
      const markup = await file.text();

      ee_settings.load( markup );
      cb && cb();
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the file > save as operations.
   */
  const do_save_as = async ( event, ftype ) => {
    try {
      event && event.preventDefault();
      LOG( "#do_save_" + ftype );

      const options = getSaveOptions( ftype );
      setFileOption( options, ftype );

      const fn = save_as_markup[ ftype ] || save_as_markup[ ".ee" ];
      const markup = fn && fn() || "";

      saveFile( options, markup, ftype );
    }
    catch ( e )
    {
    }
  };

  const do_save_Source = ( event ) => do_save_as( event, ".ee" );
  const do_save_HTML = ( event ) => do_save_as( event, ".html" );
  const do_save_BRF = ( event ) => do_save_as( event, ".brf" );
  const do_save_BRL = ( event ) => do_save_as( event, ".brl" );

  /**
   * Handler method for the file > print Preview operation.
   */
  const do_print_Preview = async ( event ) => {
    try {
      event && event.preventDefault();
      LOG( "#do_print_Preview" );

      const styles = ee_settings.getBool( "ee-css-styles-on-export" );
      const mathjax = ee_settings.getBool( "ee-mathjax-on-export" );
      const markup = addPrintMarkup( getPresent(), styles, mathjax );
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
      LOG( "#do_print_HTML" );

      const styles = ee_settings.getBool( "ee-css-styles-on-print" );
      const mathjax = ee_settings.getBool( "ee-mathjax-on-print" );
      const markup = addPrintMarkup( getPresent(), styles, mathjax );
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
      LOG( "#do_print_BRF" );

      const markup = addBRFMarkup( getBRFMarkup() );
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
      LOG( "#do_print_BRL" );

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
   * Handler method for the file > view Source operation.
   */
  const do_view_Source = async ( event ) => {
    try {
      event && event.preventDefault();
      LOG( "#do_view_Source" );

      const markup = addViewMarkup( getContent() );
      const nwindow = window.open( "" );

      const options = getFileOptions( html_types );
      setFileOption( options, ".ee" );

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
      LOG( "#do_view_HTML" );

      const markup = addViewMarkup( getPresent() );
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
   * Handler method for the file > view BRF operation.
   */
  const do_view_BRF = async ( event ) => {
    try {
      event && event.preventDefault();
      LOG( "#do_view_BRF" );

      const markup = addBRFMarkup( getBRFMarkup() );
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
      LOG( "#do_view_BRL" );

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
      LOG( "#do_drive_open" );

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
      LOG( "#do_drive_save" );

      const options = getFileOptions( open_types );
      setFileOption( options );

      ee_drive.save( getContent, setOpenFileData, options );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the drive > save Source operation.
   */
  const do_drive_save_Source = async ( event ) => {
    try {
      event && event.preventDefault();
      LOG( "#do_drive_save_Source" );

      const options = getFileOptions( save_types );
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
      LOG( "#do_drive_save_replace" );

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
      LOG( "#do_drive_save_HTML" );

      const options = getFileOptions( html_types );
      const styles = ee_settings.getBool( "ee-css-styles-on-save" );
      const mathjax = ee_settings.getBool( "ee-mathjax-on-save" );
      const markup = addSaveMarkup( getPresent(), styles, mathjax );

      setFileOption( options, ".html" );
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
      LOG( "#do_drive_save_BRF" );

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
      LOG( "#do_drive_save_BRL" );

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
      LOG( "#do_drive_link" );

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
      LOG( "#do_drive_install" );

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

      const markup = getPresent();
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

      const markup = getMathBits( getPresent() );
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for the panel > show all panels menu operation.
   */
  const do_panel_showAll = async ( event ) => {
    event && event.preventDefault();

    ee_settings.setBool( "ee-panel-app-menus", true );
    ee_settings.setBool( "ee-panel-open-file", true );
    ee_settings.setBool( "ee-panel-quick-bar", true );
    ee_settings.setBool( "ee-panel-side-bar", true );
    ee_settings.setBool( "ee-panel-braille-bar", true );

    updatePanels();
  };

  /**
   * Handler method for the panel > show menus only menu operation.
   */
  const do_panel_showOnly = async ( event ) => {
    event && event.preventDefault();

    ee_settings.setBool( "ee-panel-app-menus", true );
    ee_settings.setBool( "ee-panel-open-file", false );
    ee_settings.setBool( "ee-panel-quick-bar", false );
    ee_settings.setBool( "ee-panel-side-bar", false );
    ee_settings.setBool( "ee-panel-braille-bar", false );

    updatePanels();
  };

  /**
   * Handler method for the panel > toggle all panels menu operation.
   */
  const do_panel_toggleAll = async ( event ) => {
    event && event.preventDefault();

    const value = ee_settings.getBool( "ee-panel-open-file" )
               || ee_settings.getBool( "ee-panel-quick-bar" )
               || ee_settings.getBool( "ee-panel-side-bar" )
               || ee_settings.getBool( "ee-panel-braille-bar" );

    if ( value )
    {
      do_panel_showOnly();
    }
    else
    {
      do_panel_showAll();
    }
  };

  /**
   * Handler method for the panel > hide all panels menu operation.
   */
  const do_panel_hideAll = async ( event ) => {
    event && event.preventDefault();

    ee_settings.setBool( "ee-panel-app-menus", false );
    ee_settings.setBool( "ee-panel-open-file", false );
    ee_settings.setBool( "ee-panel-quick-bar", false );
    ee_settings.setBool( "ee-panel-side-bar", false );
    ee_settings.setBool( "ee-panel-braille-bar", false );

    updatePanels();
  };

  /**
   * Handler method for the panel > menus menu operation.
   */
  const do_panel_menus = async ( event ) => {
    event && event.preventDefault();
    ee_settings.toggleBool( "ee-panel-app-menus" );
    updatePanels();
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
    ee_settings.check();
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

  /**
   * Handler method for the help > settings menu operation.
   */
  const do_help_settings = async ( event ) => {
    try {
      event && event.preventDefault();

      const att = event.target.getAttribute( "href" );
      const href = new URL( att, getAppHome() ).href;

      const nwindow = do_help_href( href );

      nwindow && nwindow.addEventListener( "beforeunload", () => {
        updatePanels();
      } );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for help menu operations.
   */
  const do_help = async ( event ) => {
    try {
      event && event.preventDefault();

      const att = event.target.getAttribute( "href" );
      const href = new URL( att, getAppHome() ).href;

      do_help_href( href );
    }
    catch ( e )
    {
    }
  };

  /**
   * Handler method for help document operations.
   */
  const do_help_doc = async ( event ) => {
    try {
      event && event.preventDefault();

      const att = event.target.getAttribute( "href" );
      const href = new URL( att, getDocHome() ).href;

      do_help_href( href );
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
      const nwindow = window.open( href );

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
  const nextHomeIndex = ( url ) => {
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
  const nextEndIndex = ( url ) => {
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
    if ( event.altKey || event.code.startsWith( "Alt" ) )
    {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };

  /**
   * Handler for menu key accelerators.
   */
  const onMenuKey = ( event ) => {
    var alt = event.altKey && event.shiftKey && ! event.ctrlKey;
    var key = event.code.replace( "Key", "" );

    var val = alt && menuKeys[ key ] || "";
    var elt = val && document.querySelector( val ) || null;

    if ( elt )
    {
      LOG( "menu item " + val );
      event.stopImmediatePropagation();
      event.preventDefault();

      $( menu_bar_panel ).show();
      elt.click();
      return;
    }

    if ( key === "Tab" )
    {
      key = event.shiftKey ? "ArrowLeft" : "ArrowRight";
    }


    const menubar_items = $( ".navbar-nav > li > a" );
    const dropdown_items = $( ".dropdown.open > ul > li > a" );
    const submenu_items = $( ".dropdown-submenu.open > ul > li > a" );

    const olst = menubar_items;
    const olen = olst.length;
    const oidx = olst.index( $( ".dropdown.open > a" ) );

    const lst = submenu_items.length ? submenu_items :
      dropdown_items.length ? dropdown_items : menubar_items;

    const old = event.target;
    const len = lst.length;
    const idx = lst.index( old );
    const top = olst.index( old );
    const mnu = old.id.endsWith( "_menu" );

    if ( menu_bar_panel.contains( old ) )
    {
      if ( key === "ArrowLeft" )
      {
        if ( submenu_items.length )
        {
          // Collapse the open submenu into its parent menu
          elt = $( ".dropdown-submenu.open > a" )[ 0 ];
        }
        else
        {
          // Move to the previous menu bar item
          elt = olst[ oidx < 1 ? olen - 1 : oidx - 1 ] || null;
        }
      }

      if ( key === "ArrowRight" )
      {
        if ( top === -1 && mnu && submenu_items.length === 0 )
        {
            // Expand the closed submenu out from its parent menu
            old.click();
            elt = $( old ).parent().find( "ul > li > a" )[0];
        }
        else
        {
          // Move to the next menu bar item
          elt = olst[ oidx + 1 < olen ? oidx + 1 : 0 ] || null;
        }
      }

      if ( key === "ArrowUp" )
      {
        // Move to the previous sibling
        elt = lst[ idx < 1 ? len - 1 : idx - 1 ] || null;
      }

      if ( key === "ArrowDown" )
      {
        // Move to the next sibling
        elt = lst[ idx + 1 < len ? idx + 1 : 0 ] || null;
      }

      if ( ( key === "Space" || key === "Enter" ) && mnu )
      {
        old.click();
        elt = $( old ).parent().find( "ul > li > a" )[0];
      }
    }

    if ( elt )
    {
      val = "#" + elt.id;

      LOG( "menu item " + val );
      event.stopImmediatePropagation();
      event.preventDefault();

      if ( olst.index( elt ) !== -1 )
      {
        // Open the next menu bar item
        elt.click();
      }

      else if ( elt.id.endsWith( "_menu" ) && submenu_items.length  )
      {
        // Close the open submenu
        onSubmenuClear();
      }

      elt.focus();
    }
  };

  /**
   * Handler for menu item accelerators.
   */
  const onMenuItem = ( event ) => {
    const mkey = $( ".dropdown-submenu.open" ).find( "a" ).attr( "id" ) ||
        $( ".dropdown.open" ).find( "a" ).attr( "id" ) || "";
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
    const target = event && event.target || null;

    if ( elt && target )
    {
      if ( target === window || ! menu_bar_panel.contains( target ) ||
           elt.parentNode.contains( target ) )
      {
        event && event.stopImmediatePropagation();
        event && event.preventDefault();

        LOG( "close #" + elt.id );
        elt.click();
        editor.setFocus();
      }
    }
  };

  /**
   * Handler for the escape key.
   */
  const onEscapeKey = ( event ) => {
    if ( menu_bar_panel.contains( event.target ) )
    {
      onMenuClose( event );
      updateMenuBarPanel();
    }

    else if ( isDocument( file_URL ) )
    {
      event.stopImmediatePropagation();
      event.preventDefault();

      setPanelSize();
      do_panel_showAll();

      window.close();
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
        window.editor.selection().tabRight();
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

    do_query_href( "?" + nextHomeIndex( file_URL ) + ".html" );
  };

  /**
   * Handler for the end key.
   */
  const onEndKey = ( event ) => {
    event.stopImmediatePropagation();
    event.preventDefault();

    do_query_href( "?" + nextEndIndex( file_URL ) + ".html" );
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
    const key = event.key;
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

    if ( href && href.startsWith( "?" ) )
    {
      event.stopImmediatePropagation();
      event.preventDefault();

      do_query_href( href );
    }
    else if ( href )
    {
      do_help_href( new URL( href, getAppHome() ).href );
    }
  };

  /**
   * Handler for window history links.
   */
  const onPopHistory = ( event ) => {
    event.preventDefault();
    do_query_data( event.state );
  };

  const samples_url =
    'https://drive.google.com/drive/folders/1FrhoeG8olkVnCgB-F3d-edxvqnK-guPu?usp=sharing';

  const menu_markup =
'  <div class="navbar navbar-default" role="navigation">' +
'    <div class="collapse navbar-collapse" id="navbar-collapse-1">' +
'      <ul class="nav navbar-nav">' +
'        <li class="dropdown">' +
'          <a href="#" id="file_menu" class="dropdown-toggle" data-toggle="dropdown" role="button"' +
'             aria-haspopup="true" aria-expanded="false" aria-label="File">F&#x0332;ile<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="new" aria-label="New">N&#x0332;ew</a></li>' +
'            <li><a href="#" id="open" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="save" aria-label="Save">S&#x0332;ave</a></li>' +
'            <hr/>' +
'            <li class="dropdown-submenu">' +
'              <a href="#" id="file_save_menu" tabindex="-1"' +
'                 class="dropdown-submenu-toggle" data-toggle="dropdown" role="button"' +
'                 aria-haspopup="true" aria-expanded="false" aria-label="Save As">Save A&#x0332;s<span class="caret"></span></a>' +
'              <ul class="dropdown-menu">' +
'                <li><a href="#" id="saveSource" aria-label="Source">S&#x0332;ource</a></li>' +
'                <li><a href="#" id="saveHTML" aria-label="HTML">H&#x0332;TML</a></li>' +
'                <li><a href="#" id="saveBRF" aria-label="BRF">BRF&#x0332;</a></li>' +
'                <li><a href="#" id="saveBRL" aria-label="BRL">BRL&#x0332;</a></li>' +
'              </ul>' +
'            </li>' +
'            <li class="dropdown-submenu">' +
'              <a href="#" id="file_view_menu" tabindex="-1"' +
'                 class="dropdown-submenu-toggle" data-toggle="dropdown" role="button"' +
'                 aria-haspopup="true" aria-expanded="false" aria-label="View">V&#x0332;iew<span class="caret"></span></a>' +
'              <ul class="dropdown-menu">' +
'                <li><a href="#" id="viewSource" aria-label="Source">S&#x0332;ource</a></li>' +
'                <li><a href="#" id="viewHTML" aria-label="HTML">H&#x0332;TML</a></li>' +
'                <li><a href="#" id="viewBRF" aria-label="BRF">BRF&#x0332;</a></li>' +
'                <li><a href="#" id="viewBRL" aria-label="BRL">BRL&#x0332;</a></li>' +
'              </ul>' +
'            </li>' +
'            <li class="dropdown-submenu">' +
'              <a href="#" id="file_print_menu" tabindex="-1"' +
'                 class="dropdown-submenu-toggle" data-toggle="dropdown" role="button"' +
'                 aria-haspopup="true" aria-expanded="false" aria-label="Print">P&#x0332;rint<span class="caret"></span></a>' +
'              <ul class="dropdown-menu">' +
'                <li><a href="#" id="printPreview" aria-label="Preview">P&#x0332;review</a></li>' +
'                <li><a href="#" id="printHTML" aria-label="HTML">H&#x0332;TML</a></li>' +
'                <li><a href="#" id="printBRF" aria-label="BRF">BRF&#x0332;</a></li>' +
'                <li><a href="#" id="printBRL" aria-label="BRL">BRL&#x0332;</a></li>' +
'              </ul>' +
'            </li>' +
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
'            <li class="dropdown-submenu">' +
'              <a href="#" id="drive_save_menu" tabindex="-1"' +
'                 class="dropdown-submenu-toggle" data-toggle="dropdown" role="button"' +
'                 aria-haspopup="true" aria-expanded="false" aria-label="Save As">Save A&#x0332;s<span class="caret"></span></a>' +
'              <ul class="dropdown-menu">' +
'                <li><a href="#" id="drive_saveSource" aria-label="Source">S&#x0332;ource</a></li>' +
'                <li><a href="#" id="drive_saveHTML" aria-label="HTML">H&#x0332;TML</a></li>' +
'                <li><a href="#" id="drive_saveBRF" aria-label="BRF">BRF&#x0332;</a></li>' +
'                <li><a href="#" id="drive_saveBRL" aria-label="BRL">BRL&#x0332;</a></li>' +
'              </ul>' +
'            </li>' +
'            <li><a href="#" id="drive_saveReplace" aria-label="Save Replace">Save R&#x0332;eplace</a></li>' +
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
'            <li><a href="#" id="panel_showAll" aria-label="Show All Panels">Show A&#x0332;ll Panels</a></li>' +
'            <li><a href="#" id="panel_showOnly" aria-label="Show Menus Only">Show Menus O&#x0332;nly</a></li>' +
'            <li><a href="#" id="panel_toggleAll" aria-label="Toggle All Panels">T&#x0332;oggle All Panels</a></li>' +
'            <li><a href="#" id="panel_hideAll" aria-label="Hide All Panels">H&#x0332;ide All Panels</a></li>' +
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
'            <li><a href="index.ee" id="documentation" aria-label="Documentation">D&#x0332;ocumentation</a></li>' +
'            <hr/>' +
'            <li><a href="config/index.html" id="configuration" aria-label="Configuration">C&#x0332;onfiguration</a></li>' +
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

    N: "#new",
    O: "#open",
    S: "#save",
    A: "#saveSource",
    P: "#printHTML",

    M: "#panel_menus",
    X: "#panel_toggleAll"
  };

  /**
   * The menu item accelerator keys.
   */
  const menuItems = {
    file_menu: {
      N: "#new",
      O: "#open",
      S: "#save",
      A: "#file_save_menu",
      V: "#file_view_menu",
      P: "#file_print_menu",
      L: "#link",
      C: "#close"
    },
    drive_menu: {
      O: "#drive_open",
      S: "#drive_save",
      A: "#drive_save_menu",
      R: "#drive_saveReplace",
      L: "#drive_link",
      I: "#drive_install"
    },
    view_menu: {
      A: "#panel_showAll",
      O: "#panel_showOnly",
      T: "#panel_toggleAll",
      H: "#panel_hideAll",
      M: "#panel_menus",
      F: "#panel_fname",
      Q: "#panel_quick",
      S: "#panel_side",
      B: "#panel_braille"
    },
    help_menu: {
      D: "#documentation",
      C: "#configuration",
      M: "#samples",
      G: "#settings",
      A: "#about"
    },
    file_save_menu: {
      S: "#saveSource",
      H: "#saveHTML",
      F: "#saveBRF",
      L: "#saveBRL"
    },
    file_view_menu: {
      S: "#viewSource",
      H: "#viewHTML",
      F: "#viewBRF",
      L: "#viewBRL"
    },
    file_print_menu: {
      P: "#printPreview",
      H: "#printHTML",
      F: "#printBRF",
      L: "#printBRL"
    },
    drive_save_menu: {
      S: "#drive_saveSource",
      H: "#drive_saveHTML",
      F: "#drive_saveBRF",
      L: "#drive_saveBRL"
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
    addClick( "#link", do_file_link );
    addClick( "#close", do_file_new );

    addClick( "#saveSource", do_save_Source );
    addClick( "#saveHTML", do_save_HTML );
    addClick( "#saveBRF", do_save_BRF );
    addClick( "#saveBRL", do_save_BRL );

    addClick( "#viewSource", do_view_Source );
    addClick( "#viewHTML", do_view_HTML );
    addClick( "#viewBRF", do_view_BRF );
    addClick( "#viewBRL", do_view_BRL );

    addClick( "#printPreview", do_print_Preview );
    addClick( "#printHTML", do_print_HTML );
    addClick( "#printBRF", do_print_BRF );
    addClick( "#printBRL", do_print_BRL );

    addClick( "#drive_open", do_drive_open );
    addClick( "#drive_save", do_drive_save );
    addClick( "#drive_saveReplace", do_drive_save_replace );
    addClick( "#drive_link", do_drive_link );
    addClick( "#drive_install", do_drive_install );

    addClick( "#drive_saveSource", do_drive_save_Source );
    addClick( "#drive_saveHTML", do_drive_save_HTML );
    addClick( "#drive_saveBRF", do_drive_save_BRF );
    addClick( "#drive_saveBRL", do_drive_save_BRL );

    addClick( "#copy", do_edit_copy );
    addClick( "#paste", do_edit_paste );
    addClick( "#copyAll", do_edit_copy_all );
    addClick( "#pasteAll", do_edit_paste_all );
    addClick( "#copyHTML", do_edit_copy_HTML );
    addClick( "#copyAllHTML", do_edit_copy_all_HTML );
    addClick( "#copyAllMath", do_edit_copy_all_math );

    addClick( "#panel_showAll", do_panel_showAll );
    addClick( "#panel_showOnly", do_panel_showOnly );
    addClick( "#panel_toggleAll", do_panel_toggleAll );
    addClick( "#panel_hideAll", do_panel_hideAll );
    addClick( "#panel_menus", do_panel_menus );
    addClick( "#panel_fname", do_panel_fname );
    addClick( "#panel_quick", do_panel_quick );
    addClick( "#panel_side", do_panel_side );
    addClick( "#panel_braille", do_panel_braille );

    addClick( "#documentation", do_help_doc );
    addClick( "#configuration", do_help );
    addClick( "#settings", do_help_settings );
    addClick( "#samples", do_help );

    addClick( "#terms", do_help );
    addClick( "#privacy", do_help );
    addClick( "#about", do_help );

    // Update equation editor user interface panels.
    updateMenuBarPanel();
    updateOpenFilePanel();
  };

  /**
   * Clear the submenus.
   */
  const onSubmenuClear = () => {
    $( ".dropdown-submenu ul" ).removeAttr( "style" );
    $( ".dropdown-submenu" ).removeClass( "open" );
  };

  /**
   * Toggle the submenu on click on the toggle link.
   */
  const onSubmenuClick = ( event ) => {
    onSubmenuClear();

    $( event.target ).next( "ul" ).toggle();
    $( event.target ).parent().addClass( "open" );

    event.stopPropagation();
    event.preventDefault();
  };

  /**
   * Remove focus after click on open drop down menu.
   */
  const onMenuClick = ( event ) => {
    const elt = $( ".dropdown.open" ).find( "a" )[0];
    if ( elt )
    {
      event.target.blur();
    }
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

    // Close open menus on mouse leave
    $( "a.dropdown-toggle" ).on( "click", onMenuClick );

    // Toggle the submenu on click on the toggle link
    $( "a.dropdown-submenu-toggle" ).on( "click", onSubmenuClick );

    // Clear the submenus on hiding the menus
    $( ".navbar-nav" ).on( "hidden.bs.dropdown", onSubmenuClear );
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

    else
    {
      setPanelSize();
      do_panel_showAll();
    }
  };

  _ee.saveSettings = do_save_settings;
  _ee.loadSettings = do_load_settings;
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
