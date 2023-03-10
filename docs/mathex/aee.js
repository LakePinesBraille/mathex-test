const aee_onload = () => {
  const body = document.body;

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
    return editor && /math/.test( editor._initial );
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

  var last_file_handle;

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
  const head_tag = '  <head>\r\n' + script_tag + '  </head>\r\n';

  const getLocalSetting = function( key ) {
    return ( localStorage && localStorage[ key ] === "true" ) || false;
  };

  const getLocalSettingNumber = function( key ) {
    return ( localStorage && localStorage[ key ] ) || "";
  };

  const addBRLMarkup = function( markup ) {
    var result = html_open + markup.replaceAll( "\n", "<br/>\r\n" ) + html_close;

    var sz = getLocalSettingNumber( "aee-brl-font-size" );
    if ( sz )
    {
        result = result.replace( "<body>",
            "<body style=\"font-size: " + sz + "pt\">" );
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
    if ( type )
    {
      options.suggestedName = options.suggestedName + type;
    }
  };

  const saveFile = async ( options, markup, type ) => {
    exportFile( options, type );

    if ( window.showSaveFilePicker )
    {
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();
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

  const moveToEnd = function() {
    setTimeout( () => editor.processTemplate( "ctrl-end" ), 200 );
  };

  const do_close = async function( event ) {
    try {
      event.preventDefault();

      editor.processTemplate( "clear" );
      editor.setFocus();
      moveToEnd();
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

      editor.setContent( markup );
      editor.setFocus();
      moveToEnd();
    }
    catch ( e )
    {
    }
  };

  const do_save = async function( event ) {
    try {
      event.preventDefault();

      const options = getOpenOptions();
      const markup = editor.getContent();
      await saveFile( options, markup );
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
      exportFile( options, "-p" );

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

      const markup = addViewMarkup( editor.getContent() );
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

      const markup = editor.getContent();
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  const do_pasteAll = async function( event ) {
    try {
      event.preventDefault();

      navigator.clipboard.readText().then(
        ( markup ) => {
            editor.setContent( markup );
            editor.setFocus();
            moveToEnd();
        } );
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

      const src = getSource() + event.target.getAttribute( "href" );
      const nwindow = window.open( src );

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
      } )

      nwindow.addEventListener( "unload", () => {
        editor.setFocus();
      } )
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
'            <li><a href="#" id="open" accesskey="o" aria-label="Open">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="save" accesskey="s" aria-label="Save">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="view" accesskey="v" aria-label="View Source">V&#x0332;iew Source</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveHTML" aria-label="Save HTML">Save H&#x0332;TML</a></li>' +
'            <li><a href="#" id="exportHTML" accesskey="x" aria-label="Export HTML">Ex&#x0332;port HTML</a></li>' +
'            <li><a href="#" id="printHTML" accesskey="p" aria-label="Print HTML">P&#x0332;rint HTML</a></li>' +
'            <li><a href="#" id="viewHTML" aria-label="View HTML">View HTML</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRF" accesskey="b" aria-label="Save BRF">Save B&#x0332;RF</a></li>' +
'            <li><a href="#" id="viewBRF" aria-label="View BRF">View BRF</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="saveBRL" aria-label="Save BRL">Save BRL</a></li>' +
'            <li><a href="#" id="exportBRL" aria-label="Export BRL">Export BRL</a></li>' +
'            <li><a href="#" id="printBRL" aria-label="Print BRL">Print BRL</a></li>' +
'            <hr/>' +
'            <li><a href="#" id="close" accesskey="c" aria-label="Close">C&#x0332;lose</a></li>' +
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
'            <li><a href="aee-welcome.html" id="welcome" accesskey="w" aria-label="Welcome">W&#x0332;elcome</a></li>' +
'            <li><a href="aee-guide.html" id="guide" accesskey="u" aria-label="Users Guide">U&#x0332;sers Guide</a></li>' +
'            <li><a href="aee-settings.html" id="settings" accesskey="g" aria-label="Settings">Setting&#x0332;s</a></li>' +
'            <hr/>' +
'            <li><a href="aee-terms.pdf" target="_blank">Terms of Service</a></li>' +
'            <li><a href="aee-privacy.pdf" target="_blank">Privacy Policy</a></li>' +
'            <li><a href="aee-about.html" id="about" accesskey="a" aria-label="About">A&#x0332;bout</a></li>' +
'          </ul>' +
'        </li>' +
'      </ul>' +
'    </div>' +
'  </div>';

  addMarkup( ".ee-menu", menu_markup );
  addMarkup( ".ee-version", getVersion() );
  addMarkup( ".ee-timestamp", getTimestamp() );

  addClick( "#open", do_open );
  addClick( "#save", do_save );
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

  addClick( "#copy", do_copy );
  addClick( "#paste", do_paste );
  addClick( "#copyAll", do_copyAll );
  addClick( "#pasteAll", do_pasteAll );
  addClick( "#copyHTML", do_copyHTML );
  addClick( "#copyAllHTML", do_copyAllHTML );
  addClick( "#copyAllMath", do_copyAllMath );

  addClick( "#welcome", do_help );
  addClick( "#guide", do_help );
  addClick( "#about", do_help );

  addClick( "#settings", do_settings );

  const accel = {
    f: {
      o: "#open",
      s: "#save",
      v: "#view",
      h: "#saveHTML",
      x: "#exportHTML",
      p: "#printHTML",
      b: "#saveBRF",
      c: "#close" },
    h: {
      w: "#welcome",
      u: "#guide",
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
