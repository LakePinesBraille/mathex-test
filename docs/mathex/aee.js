(() => {
  // Collect the query parameters
  if ( window.location.search )
  {
    const params = new URLSearchParams( window.location.search );
    localStorage[ "aee-query-state" ] = params.get( "state" );
    window.location.href = window.location.origin + window.location.pathname;
  }
})();

const aee_onload = () => {
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

const aee_init = () => {
  editor = EquationEditorAPI.getInstance( "RESPONSE" );
  if ( editor )
  {
    editor.model().setSystemClipboard( true );
    editor.setFocus();
  }

  const getSource = function() {
    const elt = document.querySelector( "script" );
    const att = elt && elt.getAttribute( "src" ) || "";
    return ( /aee\.js$/.test( att ) ) ? att.replace( "aee.js", "" ) : "";
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

  var last_file_elt = document.querySelector( ".ee-file-name" );
  var last_file_name = "";
  var last_file_mod = false;

  var last_file_handle = undefined;
  var last_open_handle = undefined;

  const updateFileName = function() {
    if ( last_file_elt )
    {
      // const value = last_file_name + ( last_file_mod ? " (*)" : "" );
      const value = last_file_name;
      last_file_elt.innerText = value;
      last_file_elt.style.display = value ? "block" : "none";
    }
  };

  const setCleanFileName = function( name ) {
    setLastFileName( name );
    clearModFlag();
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

  const style_tag = '<style>\r\n' +
    '@font-face {\r\n' +
    '  font-family: aeeUBraille;\r\n' +
    '  src:url("css/fonts/aeeUBraille.ttf");\r\n' +
    '}\r\n' +
    '.brl, code {\r\n' +
    '  font-family:  aeeUBraille, Courier New, Segoe UI Symbol;\r\n' +
    '  font-weight:  600;\r\n' +
    '  color: #c7254e;\r\n' +
    '}\r\n' +
    '</style>\r\n';

  const samples_url =
    'https://drive.google.com/drive/folders/1FrhoeG8olkVnCgB-F3d-edxvqnK-guPu?usp=sharing';

  const getLocalSetting = function( key ) {
    return ( localStorage && localStorage[ key ] === "true" ) || false;
  };

  const getLocalSettingNumber = function( key ) {
    return ( localStorage && localStorage[ key ] ) || "";
  };

  const addBRLMarkup = function( markup ) {
    var result = html_open + markup.replaceAll( "\n", "<br/>\r\n" ) + html_close;

    result = result.replace( body_otag, head_otag + style_tag + head_ctag + body_otag );

    var sz = getLocalSettingNumber( "aee-brl-font-size" );
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

    var sz = getLocalSettingNumber( "aee-html-font-size" );
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

    var sz = getLocalSettingNumber( "aee-html-font-size" );
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
        editor.processTemplate( "home" )
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

  const do_new = async function( event ) {
    try {
      event.preventDefault();

      editor.processTemplate( "clear" );
      editor.setFocus();
      moveToHome();

      setLastFileName( "" );
      clearModFlag();
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
      const mathjax = getLocalSetting( "aee-mathjax-on-save" );
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

      const mathjax = getLocalSetting( "aee-mathjax-on-export" );
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

      const mathjax = getLocalSetting( "aee-mathjax-on-print" );
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

  const do_help = async function( event ) {
    try {
      event.preventDefault();

      const href = event.target.getAttribute( "href" );
      const src = href.startsWith( "http" ) ? href : getSource() + href;
      const nwindow = window.open( src );

      nwindow.addEventListener( "unload", () => {
        editor.setFocus();
      } )
    }
    catch ( e )
    {
    }
  };

  const do_welcome = async function ( event ) {
    try {
      event && event.preventDefault();

      const iframe = document.createElement( "iframe" );
      iframe.src = getSource() + "aee-welcome.html";

      iframe.onload = () => {
        iframe.contentWindow.onunload = () => {
          EquationEditorAPI.updateSettings();
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

  const do_tutorial = async function( event ) {
    try {
      event.preventDefault();

      var href = getSource() + event.target.getAttribute( "href" );
      if ( localStorage && localStorage[ "gtk-last-page-href" ] &&
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

  const do_settings = async function( event ) {
    try {
      event.preventDefault();

      const src = getSource() + event.target.getAttribute( "href" );
      const nwindow = window.open( src );

      nwindow.addEventListener( "beforeunload", () => {
        EquationEditorAPI.updateSettings();
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
      aee_drive.open( setContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_save = async function( event ) {
    try {
      event.preventDefault();
      aee_drive.save( getContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_saveAs = async function( event ) {
    try {
      event.preventDefault();
      aee_drive.save_as( getContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_saveReplace = async function( event ) {
    try {
      event.preventDefault();
      aee_drive.save_replace( getContent, setCleanFileName );
    }
    catch ( e )
    {
    }
  };

  const do_drive_install = async function( event ) {
    try {
      event.preventDefault();
      aee_drive.install();
    }
    catch ( e )
    {
    }
  };

  const menu_markup =
'  <div class="navbar navbar-default" role="navigation">' +
'    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">' +
'      <ul class="nav navbar-nav">' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="f">File<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="new" accesskey="n" aria-label="New">N&#x0332;ew</a></li>' +
'            <li><a href="#" id="open" accesskey="o" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="save" accesskey="s" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="saveAs" accesskey="a" aria-label="Save As">Save A&#x0332;s</a></li>' +
'            <li><a href="#" id="view" accesskey="v" aria-label="View Source">V&#x0332;iew Source</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveHTML">Save HTML</a></li>' +
'            <li><a href="#" id="exportHTML" accesskey="x" aria-label="Export HTML">Ex&#x0332;port HTML</a></li>' +
'            <li><a href="#" id="printHTML" accesskey="p" aria-label="Print HTML">P&#x0332;rint HTML</a></li>' +
'            <li><a href="#" id="viewHTML">View HTML</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRF" accesskey="b" aria-label="Save BRF">Save B&#x0332;RF</a></li>' +
'            <li><a href="#" id="viewBRF">View BRF</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRL">Save BRL</a></li>' +
'            <li><a href="#" id="exportBRL">Export BRL</a></li>' +
'            <li><a href="#" id="printBRL">Print BRL</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="close" accesskey="c" aria-label="Close">C&#x0332;lose</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="d">Drive<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="drive_open" accesskey="o" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="drive_save" accesskey="s" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="drive_saveAs" accesskey="a" aria-label="Save As">Save A&#x0332;s</a></li>' +
'            <li><a href="#" id="drive_saveReplace" accesskey="r" aria-label="Save Replace">Save R&#x0332;eplace</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="drive_install" accesskey="i" aria-label="Install">I&#x0332;nstall</a></li>' +
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
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="h">Help<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="welcome" accesskey="w" aria-label="Welcome">W&#x0332;elcome</a></li>' +
'            <li><a href="gtk/intro.html" id="tutorial" accesskey="t" aria-label="Tutorial">T&#x0332;utorial</a></li>' +
'            <li><a href="aee-guide.html" id="guide" accesskey="u" aria-label="Users Guide">U&#x0332;sers Guide</a></li>' +
'            <li><a href="' + samples_url + '" id="samples" accesskey="m" aria-label="Samples">Sam&#x0332;ples</a></li>' +
'            <li><a href="aee-settings.html" id="settings" accesskey="g" aria-label="Settings">Setting&#x0332;s</a></li>' +
'            <hr/>' +
'            <li><a href="aee-terms.pdf" target="_blank">Terms of Service</a></li>' +
'            <li><a href="aee-privacy.pdf" target="_blank">Privacy Policy</a></li>' +
'            <li><a href="aee-about.html" id="about">A&#x0332;bout</a></li>' +
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
  addClick( "#drive_install", do_drive_install );

  addClick( "#copy", do_copy );
  addClick( "#paste", do_paste );
  addClick( "#copyAll", do_copyAll );
  addClick( "#pasteAll", do_pasteAll );
  addClick( "#copyHTML", do_copyHTML );
  addClick( "#copyAllHTML", do_copyAllHTML );
  addClick( "#copyAllMath", do_copyAllMath );

  addClick( "#welcome", do_welcome );
  addClick( "#tutorial", do_tutorial );
  addClick( "#settings", do_settings );
  addClick( "#samples", do_help );
  addClick( "#guide", do_help );
  addClick( "#about", do_help );

  const accel = {
    f: {
      n: "#new",
      o: "#open",
      s: "#save",
      a: "#saveAs",
      v: "#view",
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
      i: "#drive_install"
    },
    h: {
      w: "#welcome",
      t: "#tutorial",
      u: "#guide",
      m: "#samples",
      g: "#settings",
      a: "#about"
    }
  };

  document.addEventListener( "keydown", ( e ) => {
    const x1 = accel[ e.target.getAttribute( "accesskey" ) ] || {};
    const x2 = x1[ e.key ] || "";
    const elt = x2 && document.querySelector( x2 ) || null;
    if ( elt )
    {
      elt.click();
      editor.setFocus();
    }
  } );

  // Process the query parameters
  if ( window.editor && localStorage &&
       localStorage[ "aee-query-state" ] )
  {
    const data = JSON.parse( localStorage[ "aee-query-state" ] );
    delete localStorage[ "aee-query-state" ];

    if ( data.action === "open" )
    {
      aee_drive.open_with( data, setContent, setCleanFileName );
    }
    if ( data.action === "create" )
    {
      aee_drive.create_new( data, getContent, setCleanFileName );
    }
    return;
  }

  // Show the welcome screen
  if ( window.editor && localStorage &&
       localStorage[ "gtk-show-welcome" ] !== "false" )
  {
    do_welcome();
  }

  if ( window.editor )
  {
    window.setInterval( updateModFlag, 1000 );
  }
};

document.addEventListener( "keydown", ( e ) => {
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
