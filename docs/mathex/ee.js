(() => {
  // Collect the query parameters
  if ( window.location.search && localStorage )
  {
    localStorage[ "ee-query-state" ] = window.location.search;
    window.location.href = window.location.origin + window.location.pathname;
  }
})();

const ee_settings = {
  "ee-show-welcome" : "false",
  "ee-show-users-guide" : "false",
  "edt-show-tutorial" : "true",
  "edt-show-last-page" : "true",
  "edt-index-page-href" : "?edt/0000.html",
  "edt-start-page-href" : "?edt/0101.html",
  "edt-last-page-href" : "",
  "gtk-show-tutorial" : "false",
  "gtk-show-last-page" : "false",
  "gtk-last-page-href" : "",
  "ee-width" : 0,
  "ee-height" : 0,
  "ee-input-qwerty" : "true",
  "ee-input-braille" : "false",
  "ee-input-home" : "false",
  "ee-panel-all-panels" : "true",
  "ee-panel-app-menus" : "true",
  "ee-panel-open-file" : "true",
  "ee-panel-quick-bar" : "true",
  "ee-panel-side-bar" : "true",
  "ee-panel-braille-bar" : "true",
  "ee-mathjax-on-save" : "false",
  "ee-mathjax-on-export" : "true",
  "ee-mathjax-on-print" : "true",
  "ee-screen-page-width" : 30,
  "ee-screen-page-height" : 4,
  "ee-screen-indent-first" : 1,
  "ee-screen-indent-runover" : 1,
  "ee-device-page-width" : 40,
  "ee-device-page-height" : 1,
  "ee-device-indent-first" : 1,
  "ee-device-indent-runover" : 1,
  "ee-file-page-width" : 40,
  "ee-file-page-height" : 25,
  "ee-file-page-numbers" : "true",
  "ee-file-indent-first" : 1,
  "ee-file-indent-runover" : 1,
  "ee-math-indent-first" : 3,
  "ee-math-indent-runover" : 5,
  "ee-html-font-size" : 18,
  "ee-brl-font-size" : 24,
  "fmt-heading-1": "center",
  "fmt-heading-2": "cell-5",
  "fmt-heading-3": "cell-7",
  "fmt-heading-4": "cell-7",
  "fmt-heading-5": "cell-7",
  "fmt-heading-6": "cell-7",
  "brl-rules-all-rules" : "true",
  "brl-rules-alphabetic-wordsigns" : "true",
  "brl-rules-strong-wordsigns" : "true",
  "brl-rules-strong-contractions" : "true",
  "brl-rules-strong-groupsigns" : "true",
  "brl-rules-lower-wordsigns" : "true",
  "brl-rules-lower-groupsigns" : "true",
  "brl-rules-initial-letter" : "true",
  "brl-rules-initial-letter-45" : "true",
  "brl-rules-initial-letter-456" : "true",
  "brl-rules-initial-letter-5" : "true",
  "brl-rules-final-letter" : "true",
  "brl-rules-final-letter-46" : "true",
  "brl-rules-final-letter-56" : "true",
  "brl-rules-shortforms" : "true"
};

const ee_reset = () => {
  localStorage = localStorage || {};
  localStorage.clear = localStorage.clear || function() { localStorage = {} };

  var key = "ee-panel-all-panels";
  var value = localStorage[ key ];

  localStorage.clear();
  for ( var k in ee_settings )
  {
    localStorage[ k ] = ee_settings[ k ];
  }

  localStorage[ key ] = value || localStorage[ key ];
};

const ee_onload = () => {
  const body = document.body;

  const p = document.createElement( "p" );
  p.setAttribute( "class", "ee-file-name" );
  body.insertBefore( p, body.firstChild );

  const div = document.createElement( "div" );
  div.setAttribute( "class", "ee-menu" );
  body.insertBefore( div, body.firstChild );

  const elt = document.createElement( "textarea" );
  elt.setAttribute( "class", "ee-init-panel" );
  elt.setAttribute( "aria-label", "equation" );
  elt.setAttribute( "tabindex", "-1" );

  elt.addEventListener( "blur", () => {
    body.removeChild( elt );
  } );

  body.insertBefore( elt, body.firstChild );
  elt.focus();
};

const ee_init = () => {
  editor = EquationEditorAPI.getInstance( "RESPONSE" );
  if ( editor )
  {
    editor.model().setSystemClipboard( true );
    editor.setFocus();
  }

  if ( !( localStorage && localStorage[ "ee-show-welcome" ] ) )
  {
    ee_reset();
  }

  const getDocBase = function() {
    // from the ee.js script tag
    const elt = document.querySelector( "script" );
    const att = elt && elt.getAttribute( "src" ) || "";

    if ( /ee\.js$/.test( att ) )
    {
        return att.replace( "ee.js", "" );
    }

    // from the ee.html window location
    const href = window.location.href;

    if ( /ee\.html$/.test( href ) )
    {
        return href.replace( "ee.html", "" );
    }

    if ( /\\$/.test( href ) )
    {
        return href;
    }

    return "";
  };

  const getVersion = function() {
    return EquationEditorAPI.version;
  };

  const getTimestamp = function() {
    return EquationEditorAPI.timeStamp;
  };

  const isMath = function() {
    return editor && !/html/.test( editor._initial );
  };

  const addMarkup = function( selector, markup ) {
    const elt = document.querySelector( selector );
    if ( elt )
    {
      elt.innerHTML = markup;
    }
  };

  const addClick = function( s, fn ) {
    const elt = document.querySelector( s );
    if ( elt )
    {
      elt.onclick = fn;
    }
  };

  const file_options = {
    multiple : false,
    excludeAcceptAllOption : true,
    suggestedName : "untitled"
  };

  const math_types = { types : [ {
    description : "MathML Content",
    accept : { "application/mathml-content+xml" : [ ".mml" ] }
  } ] };

  const math_export = { types : [ {
    description : "MathML Presentation",
    accept : { "application/mathml-presentation+xml" : [ ".mml" ] }
  } ] };

  const brf_export = { types : [ {
    description : "Braille Ready File",
    accept : { "application/brf" : [ ".brf" ] }
  } ] };

  const brl_export = { types : [ {
    description : "Braille HTML File",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  const text_types = { types : [ {
    description : "HTML + MathML Content",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  const text_export = { types : [ {
    description : "HTML + MathML Presentation",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  const LOG = msg => msg; // console.log( msg );
  const ALERT = msg => alert( msg );

  var src_URL = getDocBase();
  var base_URL = "";
  var home_URL = "";
  var file_URL = "";

  var edt_home = "?edt/0000.html";
  var edt_start = "?edt/0101.html";

  var last_file_elt = document.querySelector( ".ee-file-name" );
  var last_file_name = "";
  var last_file_mod = false;

  var last_file_handle = undefined;
  var last_open_handle = undefined;

  const updateFileName = function() {
    if ( last_file_elt )
    {
      var value = getLocalSetting( "ee-panel-all-panels" )
               && getLocalSetting( "ee-panel-open-file" );
      last_file_elt.innerText = last_file_name;
      last_file_elt.style.display = value && last_file_name ? "block" : "none";
    }
  };

  const setCleanFileName = function( name, data ) {
    setLastFileName( name );
    clearModFlag();

    if ( data && data.href )
    {
      if ( isTutorial( data.href ) )
      {
          localStorage[ "edt-last-page-href" ] = data.href;
      }

      delete data.href;
      data.base = data.base || base_URL;
      data.home = data.home || home_URL;
      window.history.pushState( data, "" );
    }
  };

  const setLastFileName = function( name ) {
    last_file_handle = undefined;
    last_open_handle = undefined;
    last_file_name = name;
    updateFileName();
  };

  const clearModFlag = function () {
    editor._initial = getContent();
    last_file_mod = false;
    updateFileName();
  };

  const updateModFlag = function() {
    if ( last_file_elt )
    {
      last_file_mod = ( getContent() !== editor._initial );
      updateFileName();
    }
  };

  const getOpenOptions = function() {
    return Object.assign( { startIn: last_file_handle }, file_options,
      isMath() ? math_types : text_types );
  };

  const getExportOptions = function() {
    return Object.assign( { startIn: last_file_handle }, file_options,
      isMath() ? math_export : text_export );
  };

  const getBRFOptions = function() {
    return Object.assign( { startIn: last_file_handle }, file_options, brf_export );
  };

  const getBRLOptions = function() {
    return Object.assign( { startIn: last_file_handle }, file_options, brl_export );
  };

  const html_otag = '<html>\r\n';
  const html_ctag = '</html>\r\n';
  const head_otag = '<head>\r\n';
  const head_ctag = '</head>\r\n';
  const body_otag = '<body>\r\n';
  const body_ctag = '</body>\r\n';
  const p_otag = '<p>\r\n';
  const p_ctag = '\r\n</p>\r\n';
  const pre_otag = '<pre>\r\n';
  const pre_ctag = '\r\n</pre>\r\n';

  const html_open = html_otag + body_otag + p_otag;
  const html_close = p_ctag + body_ctag + html_ctag;

  const view_open = html_otag + body_otag + pre_otag;
  const view_close = pre_ctag + body_ctag + html_ctag;

  const script_tag = '    <script type="text/javascript" ' +
'src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js' +
'?config=MML_CHTML"></script>\r\n';
  const body_tag = '  <body>\r\n';
  const head_tag = head_otag + script_tag + head_ctag;

  const style_tag = '<link rel="stylesheet" type="text/css" href="eex.css"/>\r\n';

  const samples_url =
    'https://drive.google.com/drive/folders/1FrhoeG8olkVnCgB-F3d-edxvqnK-guPu?usp=sharing';

  const getLocalSetting = function( key ) {
    return ( localStorage[ key ] === "true" ) || false;
  };

  const setLocalSetting = function( key, val ) {
    localStorage[ key ] = ( val ? "true" : "false" );
  };

  const toggleLocalSetting = function ( key ) {
    setLocalSetting( key, !getLocalSetting( key ) );
  };

  const getLocalSettingNumber = function( key ) {
    return ( localStorage[ key ] ) || "";
  };

  const setLocalSettingNumber = function( key, val ) {
    localStorage[ key ] = val;
  };

  const addBRLMarkup = function( markup ) {
    var result = html_open + markup.replaceAll( "\n", "<br/>\r\n" ) + html_close;

    result = result.replace( body_otag, head_otag + style_tag + head_ctag + body_otag );

    var sz = getLocalSettingNumber( "ee-brl-font-size" );
    if ( sz )
    {
        result = result.replace( "<body>",
            "<body class=\"brl\" style=\"font-size: " + sz + "pt\">" );
    }

    return result;
  };

  const addViewMarkup = function( markup ) {
    markup = markup.replaceAll( "&", "&amp;" );
    markup = markup.replaceAll( "<", "&lt;" );

    var result = view_open + markup + view_close;

    var sz = getLocalSettingNumber( "ee-html-font-size" );
    if ( sz )
    {
        result = result.replace( "<body>",
            "<body style=\"font-size: " + sz + "pt\">" );
    }

    return result;
  };

  const addMathJax = function( markup, mathjax ) {
    var result = markup;
    if ( mathjax )
    {
        if ( isMath() )
        {
            result = '<html>' + head_tag + body_tag + result + '  </body>\r\n</html>';
        }
        else
        {
            result = result.replace( body_tag, head_tag + body_tag );
        }
    }

    result = result.replace( head_ctag, style_tag + head_ctag );

    var sz = getLocalSettingNumber( "ee-html-font-size" );
    if ( sz )
    {
        result = result.replace( "<body>",
            "<body style=\"font-size: " + sz + "pt\">" );
    }

    return result;
  };

  const getMathBits = function( value ) {
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

  const openFile = async ( options ) => {
    if ( window.showOpenFilePicker )
    {
      [ handle ] = await window.showOpenFilePicker( options );
      const file = await handle.getFile();
      setLastFileName( handle.name );
      last_file_handle = handle;
      return file;
    }
    else
    {
      return new Promise( ( resolve ) => {
        const input = document.createElement( "input" );
        input.type = "file";
        input.addEventListener( "change", () => {
          const file = input.files[ 0 ];
          resolve( file );
        } );
        input.click();
      } );
    }
  };

  const exportFile = ( options, type ) => {
    if ( last_file_handle )
    {
      options.suggestedName =
        last_file_handle.name.replace( /(-p)?(-brl)?\.[^.]*$/, "" );
    }
    else if ( last_file_name )
    {
      options.suggestedName =
        last_file_name.replace( /(-p)?(-brl)?\.[^.]*$/, "" );
    }
    if ( type )
    {
      options.suggestedName = options.suggestedName + type;
    }
  };

  const saveThis = async ( markup ) => {
    if ( window.showSaveFilePicker )
    {
      const handle = last_open_handle;
      const file = await handle.createWritable();

      await file.write( markup );
      await file.close();
    }
    else
    {
      const name = last_open_handle.name;
      const type = isMath() ? "application/mathml+xml" : "application/html";
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

  const saveFile = async ( options, markup, type ) => {
    exportFile( options, type );

    if ( window.showSaveFilePicker )
    {
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();
      setLastFileName( handle.name );
      last_file_handle = handle;

      await file.write( markup );
      await file.close();
    }
    else
    {
      const name = options.suggestedName + ( isMath() ? ".mml" : ".html" );
      const type = isMath() ? "application/mathml+xml" : "application/html";
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

  const moveToHome = function() {
    setTimeout( () => {
        editor.processTemplate( "ctrl-home" )
    }, 200 );
  };

  const getContent = function() {
    return editor.getContent();
  };

  const setContent = function( value ) {
    editor.setContent( value );
    editor.setFocus();
    moveToHome();
  };

  const createLink = function( fileName, fileId ) {
    // null is dialog cancel, empty string is remove link
    if ( fileName !== null )
    {
      editor.createLink( fileName, fileId );
      editor.setFocus();
    }
  };

  const do_new = async function( event ) {
    try {
      event && event.preventDefault();

      editor.processTemplate( "clear" );
      editor.setFocus();
      moveToHome();

      setLastFileName( "" );
      clearModFlag();
      home_URL = "";
      file_URL = "";
    }
    catch ( e )
    {
    }
  };

  const do_open = async function( event ) {
    try {
      event.preventDefault();

      const options = getOpenOptions();
      const file = await openFile( options );
      const markup = await file.text();

      setContent( markup );

      clearModFlag();
      last_open_handle = last_file_handle;
    }
    catch ( e )
    {
    }
  };

  const do_close = do_new;

  const do_link = async function( event ) {
    try {
      event.preventDefault();
      createLink( prompt( "Link to file name", getCurrentLink() ) );
    }
    catch ( e )
    {
    }
  };

  const do_save = async function( event ) {
    if ( ! last_open_handle )
    {
        do_saveAs( event );
        return;
    }

    try {
      event.preventDefault();

      await saveThis( getContent() );

      clearModFlag();
    }
    catch ( e )
    {
    }
  };

  const do_saveAs = async function( event ) {
    try {
      event.preventDefault();

      const options = getOpenOptions();
      await saveFile( options, getContent() );

      clearModFlag();
      last_open_handle = last_file_handle;
    }
    catch ( e )
    {
    }
  };

  const do_saveHTML = async function( event ) {
    try {
      event.preventDefault();

      const options = getExportOptions();
      const mathjax = getLocalSetting( "ee-mathjax-on-save" );
      const markup = addMathJax( editor.getPresent(), mathjax );
      await saveFile( options, markup, "-p" );
    }
    catch ( e )
    {
    }
  };

  const do_saveBRF = async function( event ) {
    try {
      event.preventDefault();

      const options = getBRFOptions();
      const markup = editor.getAsciiBraille();
      await saveFile( options, markup );
    }
    catch ( e )
    {
    }
  };

  const do_saveBRL = async function( event ) {
    try {
      event.preventDefault();

      const options = getBRLOptions();
      const markup = addBRLMarkup( editor.getContractedBraille() );
      await saveFile( options, markup, "-brl" );
    }
    catch ( e )
    {
    }
  };

  const do_exportHTML = async function( event ) {
    try {
      event.preventDefault();

      const mathjax = getLocalSetting( "ee-mathjax-on-export" );
      const markup = addMathJax( editor.getPresent(), mathjax );
      const nwindow = window.open( "" );

      const options = getExportOptions();
      exportFile( options, "-p" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;

      if ( mathjax )
      {
        setTimeout( () => nwindow.MathJax.Hub.Startup.onload(), 100 );
      }
    }
    catch ( e )
    {
    }
  };

  const do_exportBRL = async function( event ) {
    try {
      event.preventDefault();

      const markup = addBRLMarkup( editor.getContractedBraille() );
      const nwindow = window.open( "" );

      const options = getExportOptions();
      exportFile( options, "-brl" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
    }
    catch ( e )
    {
    }
  };

  const do_printHTML = async function( event ) {
    try {
      event.preventDefault();

      const mathjax = getLocalSetting( "ee-mathjax-on-print" );
      const markup = addMathJax( editor.getPresent(), mathjax );
      const nwindow = window.open( "" );

      const options = getExportOptions();
      exportFile( options );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;

      if ( mathjax )
      {
        setTimeout( () => {
          nwindow.MathJax.Hub.Startup.onload();
          nwindow.MathJax.Hub.Queue( () => nwindow.print() );
        }, 100 );
      }
      else
      {
        nwindow.print();
      }
    }
    catch ( e )
    {
    }
  };

  const do_printBRL = async function( event ) {
    try {
      event.preventDefault();

      const markup = addBRLMarkup( editor.getContractedBraille() );
      const nwindow = window.open( "" );

      const options = getExportOptions();
      exportFile( options, "-brl" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;

      nwindow.print();
    }
    catch ( e )
    {
    }
  };

  const do_view = async function( event ) {
    try {
      event.preventDefault();

      const markup = addViewMarkup( getContent() );
      const nwindow = window.open( "" );

      const options = getExportOptions();
      exportFile( options );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
    }
    catch ( e )
    {
    }
  };

  const do_viewHTML = async function( event ) {
    try {
      event.preventDefault();

      const markup = addViewMarkup( editor.getPresent() );
      const nwindow = window.open( "" );

      const options = getExportOptions();
      exportFile( options, "-p" );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
    }
    catch ( e )
    {
    }
  };

  const do_viewBRF = async function( event ) {
    try {
      event.preventDefault();

      const markup = addViewMarkup( editor.getAsciiBraille() );
      const nwindow = window.open( "" );

      const options = getBRFOptions();
      exportFile( options );

      nwindow.document.write( markup );
      nwindow.document.title = options.suggestedName;
    }
    catch ( e )
    {
    }
  };

  const do_copy = async function( event ) {
    try {
      event.preventDefault();
      editor.copy();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  const do_paste = async function( event ) {
    try {
      event.preventDefault();
      editor.paste();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  const do_copyAll = async function( event ) {
    try {
      event.preventDefault();
      navigator.clipboard.writeText( getContent() );
    }
    catch ( e )
    {
    }
  };

  const do_pasteAll = async function( event ) {
    try {
      event.preventDefault();
      navigator.clipboard.readText().then( setContent );
    }
    catch ( e )
    {
    }
  };

  const do_copyHTML = async function( event ) {
    try {
      event.preventDefault();
      editor.copyPresent();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  const do_copyAllHTML = async function( event ) {
    try {
      event.preventDefault();

      const markup = editor.getPresent();
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  const do_copyAllMath = async function( event ) {
    try {
      event.preventDefault();

      const markup = getMathBits( editor.getPresent() );
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  const updateChecked = function ( key, s )
  {
    const val = getLocalSetting( key );
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

  const updatePanels = function () {
    updateChecked( "ee-panel-app-menus", "#panel_menus" );
    updateChecked( "ee-panel-open-file", "#panel_fname" );
    updateChecked( "ee-panel-quick-bar", "#panel_quick" );
    updateChecked( "ee-panel-side-bar", "#panel_side" );
    updateChecked( "ee-panel-braille-bar", "#panel_braille" );

    EquationEditorAPI.updateSettings();
    update_settings();
    updateFileName();
    editor.setFocus();
  };

  const setPanelSize = function ( value ) {
    setLocalSetting( "ee-panel-all-panels", value );

    const hh = window.innerHeight;
    const ww = window.innerWidth;
    setLocalSettingNumber( "ee-height", hh - 100 );
    setLocalSettingNumber( "ee-width", ww - ( ww % 44 ) );

    updatePanels();
  };

  const do_panel_maximize = async function ( event ) {
    event && event.preventDefault();

    const value = !getLocalSetting( "ee-panel-all-panels" );
    setPanelSize( value );
    updatePanels();
  };

  const do_panel_menus = async function ( event ) {
    event && event.preventDefault();

    if ( getLocalSetting( "ee-panel-all-panels" ) )
    {
      toggleLocalSetting( "ee-panel-app-menus" );
    }
    else
    {
      setLocalSetting( "ee-panel-app-menus", true );
      setPanelSize( true );
    }

    updatePanels();
  };

  const do_panel_fname = async function ( event ) {
    event && event.preventDefault();
    toggleLocalSetting( "ee-panel-open-file" );
    updatePanels();
  };

  const do_panel_quick = async function ( event ) {
    event && event.preventDefault();
    toggleLocalSetting( "ee-panel-quick-bar" );
    updatePanels();
  };

  const do_panel_side = async function ( event ) {
    event && event.preventDefault();
    toggleLocalSetting( "ee-panel-side-bar" );
    updatePanels();
  };

  const do_panel_braille = async function ( event ) {
    event && event.preventDefault();
    toggleLocalSetting( "ee-panel-braille-bar" );
    updatePanels();
  };

  const do_help_open = async function( href ) {
    try {
      const src = href.startsWith( "http" ) ? href : getDocBase() + href;
      const nwindow = window.open( src );

      nwindow.addEventListener( "unload", () => {
        editor.setFocus();
      } )
    }
    catch ( e )
    {
    }
  };

  const do_help = async function( event ) {
    try {
      event.preventDefault();

      const href = event.target.getAttribute( "href" );
      do_help_open( href );
    }
    catch ( e )
    {
    }
  };

  const do_welcome = async function ( event ) {
    try {
      event && event.preventDefault();

      const iframe = document.createElement( "iframe" );
      iframe.src = getDocBase() + "ee-welcome.html";

      iframe.onload = () => {
        iframe.contentWindow.onunload = () => {
          EquationEditorAPI.updateSettings();
          update_settings();
          editor.setFocus();
        };

        iframe.onblur = () => iframe.focus();
        iframe.focus();
      };

      document.body.appendChild( iframe );
    }
    catch ( e )
    {
    }
  };

  const do_tutorial_gtk = async function( event ) {
    try {
      event && event.preventDefault();

      var target = event && event.target || document.querySelector( "#tutorial" );
      var href = getDocBase() + target.getAttribute( "href" );

      if ( localStorage[ "gtk-last-page-href" ] &&
           localStorage[ "gtk-show-last-page" ] !== "false" )
      {
        href = localStorage[ "gtk-last-page-href" ];
      }

      const nwindow = window.open( href );
      nwindow.addEventListener( "unload", () => {
        editor.setFocus();
      } )
    }
    catch ( e )
    {
    }
  };

  const do_tutorial_edt = async function( event ) {
    try {
      event && event.preventDefault();

      var href = localStorage[ "edt-start-page-href" ] || edt_start;

      if ( localStorage[ "edt-last-page-href" ] &&
           localStorage[ "edt-show-last-page" ] !== "false" )
      {
        href = localStorage[ "edt-last-page-href" ];
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

  const do_settings = async function( event ) {
    try {
      event.preventDefault();

      const src = getDocBase() + event.target.getAttribute( "href" );
      const nwindow = window.open( src );

      nwindow.addEventListener( "beforeunload", () => {
        EquationEditorAPI.updateSettings();
        update_settings();
      } );

      nwindow.addEventListener( "unload", () => {
        editor.setFocus();
      } );
    }
    catch ( e )
    {
    }
  };

  const do_drive_open = async function( event ) {
    try {
      event.preventDefault();
      ee_drive.open( setContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_save = async function( event ) {
    try {
      event.preventDefault();
      ee_drive.save( getContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_saveAs = async function( event ) {
    try {
      event.preventDefault();
      ee_drive.save_as( getContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_saveReplace = async function( event ) {
    try {
      event.preventDefault();
      ee_drive.save_replace( getContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_link = async function( event ) {
    try {
      event.preventDefault();
      ee_drive.link( createLink );
    }
    catch ( e )
    {
    }
  };

  const do_drive_install = async function( event ) {
    try {
      event.preventDefault();
      ee_drive.install();
    }
    catch ( e )
    {
    }
  };

  // Return true if the current url is a tutorial
  const isTutorial = url => /edt\//.test( url );

  // Retrieve the active document link target
  const getCurrentLink = function () {
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

  const combine_url = function ( url, base ) {
    const suffix = base.replaceAll( /(\.\.\/)+/g, "/" );
    const prefix = base.substring( 0, base.length - suffix.length );
    return prefix + suffix + url;
  };

  // Retrieve a remote resouce
  const open_url = async function ( data, fn, cb ) {
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
    xhr.onreadystatechange = function() {
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
    xhr.setRequestHeader( "Cache-Control", "no-cache" );
    xhr.send();
  };

  // Process the query state data
  const do_query_data = function( data ) {
    if ( data && data.action === "open" && data.url )
    {
      // Open a remote web resource
      open_url( data, setContent, setCleanFileName );
    }

    else if ( data && data.action === "open" && data.ids )
    {
      // Open a Google drive resource
      ee_drive.open_with( data, setContent, setCleanFileName );
    }

    else if ( data && data.action === "create" && data.folderId )
    {
      // Create a Google drive resource
      ee_drive.create_new( data, getContent, setCleanFileName );
    }

    else
    {
      // Create an empty document
      do_new();
    }
  };

  // Process the query parameters
  const do_query_href = function( href ) {
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
      const ix = s.indexOf( "/" );
      if ( ix === -1 )
      {
        data.state.url = s;
      }
      else
      {
        data.state.base = s.substring( 0, ix + 1 );
        data.state.url = s.substring( ix + 1 );
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

    do_query_data( data.state );
  };

  const update_settings = function () {
    const panel = document.querySelector( ".ee-menu" );
    if ( panel )
    {
        const value = getLocalSetting( "ee-panel-all-panels" )
                   && getLocalSetting( "ee-panel-app-menus" );
        panel.style.display = value ? "block" : "none";
    }
  };

  const menu_markup =
'  <div class="navbar navbar-default" role="navigation">' +
'    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">' +
'      <ul class="nav navbar-nav">' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="f">File<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="new" aria-label="New">N&#x0332;ew</a></li>' +
'            <li><a href="#" id="open" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="save" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="saveAs" aria-label="Save As">Save A&#x0332;s</a></li>' +
'            <li><a href="#" id="view" aria-label="View Source">V&#x0332;iew Source</a></li>' +
'            <li><a href="#" id="link" aria-label="Link">L&#x0332;ink</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveHTML" aria-label="Save HTML">Save H&#x0332;TML</a></li>' +
'            <li><a href="#" id="exportHTML" aria-label="Export HTML">Ex&#x0332;port HTML</a></li>' +
'            <li><a href="#" id="printHTML" aria-label="Print HTML">P&#x0332;rint HTML</a></li>' +
'            <li><a href="#" id="viewHTML">View HTML</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRF" aria-label="Save BRF">Save B&#x0332;RF</a></li>' +
'            <li><a href="#" id="viewBRF">View BRF</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRL">Save BRL</a></li>' +
'            <li><a href="#" id="exportBRL">Export BRL</a></li>' +
'            <li><a href="#" id="printBRL">Print BRL</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="close" aria-label="Close">C&#x0332;lose</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="d">Drive<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="drive_open" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="drive_save" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="drive_saveAs" aria-label="Save As">Save A&#x0332;s</a></li>' +
'            <li><a href="#" id="drive_saveReplace" aria-label="Save Replace">Save R&#x0332;eplace</a></li>' +
'            <li><a href="#" id="drive_link" aria-label="Link">L&#x0332;ink</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="drive_install" aria-label="Install">I&#x0332;nstall</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="e">Edit<span class="caret"></span></a>' +
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
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="p">Panel<span class="caret"></span></a>' +
'          <ul class="dropdown-menu check">' +
'            <li><a href="#" id="panel_maximize" accesskey="x" aria-label="Maximize">Max&#x0332;imize</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="panel_menus" accesskey="m" aria-label="Menus">M&#x0332;enus</a></li>' +
'            <li><a href="#" id="panel_fname" aria-label="File Name">F&#x0332;ile Name</a></li>' +
'            <li><a href="#" id="panel_quick" aria-label="Quick Buttons">Q&#x0332;uick Buttons</a></li>' +
'            <li><a href="#" id="panel_side" aria-label="Side Palettes">S&#x0332;ide Palettes</a></li>' +
'            <li><a href="#" id="panel_braille" aria-label="Braille Bar">B&#x0332;raille Bar</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="h">Help<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="welcome" aria-label="Welcome">W&#x0332;elcome</a></li>' +
'            <li><a href="' + edt_start + '" id="tutorial" aria-label="Tutorial">T&#x0332;utorial</a></li>' +
'            <li><a href="ee-guide.html" id="guide" aria-label="Users Guide">U&#x0332;sers Guide</a></li>' +
'            <li><a href="gtk/intro.html" id="getting" aria-label="Getting To Know">Getting To K&#x0332;now</a></li>' +
'            <hr/>' +
'            <li><a href="' + samples_url + '" id="samples" aria-label="Samples">Sam&#x0332;ples</a></li>' +
'            <li><a href="ee-settings.html" id="settings" aria-label="Settings">Setting&#x0332;s</a></li>' +
'            <hr/>' +
'            <li><a href="ee-terms.pdf" target="_blank">Terms of Service</a></li>' +
'            <li><a href="ee-privacy.pdf" target="_blank">Privacy Policy</a></li>' +
'            <hr/>' +
'            <li><a href="ee-about.html" id="about">A&#x0332;bout</a></li>' +
'          </ul>' +
'        </li>' +
'      </ul>' +
'    </div>' +
'  </div>';

  addMarkup( ".ee-menu", menu_markup );
  addMarkup( ".ee-version", getVersion() );
  addMarkup( ".ee-timestamp", getTimestamp() );

  addClick( "#new", do_new );
  addClick( "#open", do_open );
  addClick( "#save", do_save );
  addClick( "#saveAs", do_saveAs );
  addClick( "#view", do_view );
  addClick( "#link", do_link );
  addClick( "#saveHTML", do_saveHTML );
  addClick( "#exportHTML", do_exportHTML );
  addClick( "#printHTML", do_printHTML );
  addClick( "#viewHTML", do_viewHTML );
  addClick( "#saveBRF", do_saveBRF );
  addClick( "#viewBRF", do_viewBRF );
  addClick( "#saveBRL", do_saveBRL );
  addClick( "#exportBRL", do_exportBRL );
  addClick( "#printBRL", do_printBRL );
  addClick( "#close", do_close );

  addClick( "#drive_open", do_drive_open );
  addClick( "#drive_save", do_drive_save );
  addClick( "#drive_saveAs", do_drive_saveAs );
  addClick( "#drive_saveReplace", do_drive_saveReplace );
  addClick( "#drive_link", do_drive_link );
  addClick( "#drive_install", do_drive_install );

  addClick( "#copy", do_copy );
  addClick( "#paste", do_paste );
  addClick( "#copyAll", do_copyAll );
  addClick( "#pasteAll", do_pasteAll );
  addClick( "#copyHTML", do_copyHTML );
  addClick( "#copyAllHTML", do_copyAllHTML );
  addClick( "#copyAllMath", do_copyAllMath );

  addClick( "#panel_maximize", do_panel_maximize );
  addClick( "#panel_menus", do_panel_menus );
  addClick( "#panel_fname", do_panel_fname );
  addClick( "#panel_quick", do_panel_quick );
  addClick( "#panel_side", do_panel_side );
  addClick( "#panel_braille", do_panel_braille );

  addClick( "#welcome", do_welcome );
  addClick( "#tutorial", do_tutorial_edt );
  addClick( "#getting", do_tutorial_gtk );
  addClick( "#settings", do_settings );
  addClick( "#samples", do_help );
  addClick( "#guide", do_help );
  addClick( "#about", do_help );

  $( ".dropdown-menu" ).mouseleave( function() {
    $( this ).closest( ".dropdown" ).click();
  } );

  update_settings();

  const accel = {
    f: {
      n: "#new",
      o: "#open",
      s: "#save",
      a: "#saveAs",
      v: "#view",
      l: "#link",
      h: "#saveHTML",
      x: "#exportHTML",
      p: "#printHTML",
      b: "#saveBRF",
      c: "#close"
    },
    d: {
      o: "#drive_open",
      s: "#drive_save",
      a: "#drive_saveAs",
      r: "#drive_saveReplace",
      l: "#drive_link",
      i: "#drive_install"
    },
    p: {
      x: "#panel_maximize",
      m: "#panel_menus",
      f: "#panel_fname",
      q: "#panel_quick",
      s: "#panel_side",
      b: "#panel_braille"
    },
    h: {
      w: "#welcome",
      t: "#tutorial",
      u: "#guide",
      k: "#getting",
      m: "#samples",
      g: "#settings",
      a: "#about"
    }
  };

  // Process access key events
  document.addEventListener( "keydown", e => {
    const x1 = accel[ e.target.getAttribute( "accesskey" ) ] || {};
    const x2 = x1[ e.key ] || "";
    const elt = x2 && document.querySelector( x2 ) || null;
    if ( elt )
    {
      elt.click();
      editor.setFocus();
    }
  } );

  // Process document link key down events
  const onKeyDown = e => {
    var result = false;
    var index = "";
    var href = getCurrentLink();
    var next = $( ".ee-input-panel a" ).filter(
        ( i, x ) => x.innerHTML === "[Alt+Enter]" ).attr( "href" ) || "";

    const indexStart = 101;
    const indexLimit = 119;

    const getIndex = s => parseInt( s.replace( /.*([0-9]{4}).*/, "$1" ) );
    const nextHome = v => ( v % 10 === 1 ? v - 10 : v - v % 10 + 1 );
    const nextEnd = v => ( v % 10 === 9 ? v + 10 : v - v % 10 + 9 );
    const fixIndex = v => Math.min( Math.max( v, indexStart ), indexLimit );
    const putIndex = v => ( "0000" + v.toString() ).substr( -4 );

    if ( e.key === "Escape" && isTutorial( file_URL ) &&
        !document.querySelector( ".ee-menu" ).contains( document.activeElement ) )
    {
      result = true;
      do_new();
      setPanelSize( true );
    }

    if ( e.key === "Escape" )
    {
        result = true;
        $( ".dropdown.open" ).click();
        updatePanels();
    }

    if ( e.key === "Enter" && e.altKey && !e.ctrlKey && isTutorial( file_URL ) )
    {
      href = next || href;
      if ( !href )
      {
        window.editor.selection().linkRight();
        href = getCurrentLink();
      }
    }

    if ( e.key === "Enter" && isTutorial( file_URL ) && href )
    {
      result = true;
      do_query_href( href );
    }

    if ( e.key === "Home" && e.altKey && !e.ctrlKey && isTutorial( file_URL ) )
    {
        result = true;
        index = putIndex( fixIndex( nextHome( getIndex( file_URL ) ) ) );
        href = file_URL.replace( src_URL, "?" )
            .replace( /[0-9]{4}/, index );
        do_query_href( href );
    }

    if ( e.key === "End" && e.altKey && !e.ctrlKey && isTutorial( file_URL ) )
    {
        result = true;
        index = putIndex( fixIndex( nextEnd( getIndex( file_URL ) ) ) );
        href = file_URL.replace( src_URL, "?" )
            .replace( /[0-9]{4}/, index );
        do_query_href( href );
    }

    if ( "FDEPH".indexOf( e.key ) !== -1 && e.altKey && !e.ctrlKey )
    {
        result = true;
        $( ".ee-menu" ).show();
    }

    if ( e.key === "I" && e.altKey && !e.ctrlKey )
    {
      href = localStorage[ "edt-index-page-href" ] || edt_home;
      if ( href )
      {
        result = true;
        do_query_href( href );
        setPanelSize( false );
      }
    }

    if ( e.key === "T" && e.altKey && !e.ctrlKey )
    {
      href = localStorage[ "edt-last-page-href" ] || edt_start;
      if ( href )
      {
        result = true;
        do_query_href( href );
        setPanelSize( false );
      }
    }

    if ( e.key === "ArrowLeft" && e.altKey && !e.ctrlKey )
    {
      result = true;
      window.history.back();
    }

    if ( e.key === "ArrowRight" && e.altKey && !e.ctrlKey )
    {
      result = true;
      window.history.forward();
    }

    if ( result )
    {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  };

  // Process document link key up events
  const onKeyUp = e => {
    if ( e.code === "AltLeft" || e.code === "AltRight" )
    {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  };

  // Process document link key press events
  const onKeyPress = onKeyUp;

  // Process document link mouse down events
  const onMouseDown = e => {
    var target = e.target;
    while ( !target.href && target.parentNode.nodeType === 1 )
    {
      target = target.parentNode;
    }
    const href = target.getAttribute( "href" ) || "";

    if ( href && href === getCurrentLink() )
    {
      e.stopImmediatePropagation();
      e.preventDefault();
      do_query_href( href );
    }
  };

  if ( window.editor )
  {
    document.addEventListener( "keydown", onKeyDown, true );
    document.addEventListener( "keyup", onKeyUp, true );
    document.addEventListener( "keypress", onKeyPress, true );
    document.addEventListener( "mousedown", onMouseDown, true );

    // Process history links
    window.addEventListener( "popstate", e => do_query_data( e.state ) );
  }

  // Process the query parameters
  if ( window.editor && localStorage[ "ee-query-state" ] )
  {
    const href = localStorage[ "ee-query-state" ]
    delete localStorage[ "ee-query-state" ];

    do_query_href( href );
    return;
  }

  // Show the welcome screen (ee)
  if ( window.editor && getLocalSetting( "ee-show-welcome" ) )
  {
    do_welcome();
  }

  // Show the users guide (ee)
  else if ( window.editor && getLocalSetting( "ee-show-users-guide" ) )
  {
    do_help_open( "ee-guide.html" );
  }

  // Show the tutorial screen (edt)
  else if ( window.editor && getLocalSetting( "edt-show-tutorial" ) )
  {
    do_tutorial_edt();
  }

  // Show the tutorial screen (gtk)
  else if ( window.editor && getLocalSetting( "gtk-show-tutorial" ) )
  {
    do_tutorial_gtk();
  }
};

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
    if ( window.parent !== window )
    {
        window.parent.document.querySelector( "iframe" ).remove();
    }
    else if ( window.editor )
    {
      window.editor.setFocus();
    }
    else
    {
      window.close();
    }
  }
} );
