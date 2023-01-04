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

  const script_tag = '    <script type="text/javascript" ' +
'src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js' +
'?config=MML_CHTML"></script>\r\n';
  const body_tag = '  <body>\r\n';
  const head_tag = '  <head>\r\n' + script_tag + '  </head>\r\n';

  const getLocalSetting = function( key ) {
    return ( localStorage && localStorage[ key ] === "true" ) || false;
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

  const saveFile = async ( options, markup ) => {
    if ( window.showSaveFilePicker )
    {
      if ( last_file_handle )
      {
        options.suggestedName = last_file_handle.name.replace( /\.[^.]*$/, "" );
      }
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

  const do_savePrint = async function( event ) {
    try {
      event.preventDefault();

      const options = getExportOptions();
      const mathjax = getLocalSetting( "aee-mathjax-on-save" );
      const markup = addMathJax( editor.getPresent(), mathjax );
      await saveFile( options, markup );
    }
    catch ( e )
    {
    }
  };

  const do_export = async function( event ) {
    try {
      event.preventDefault();

      const mathjax = getLocalSetting( "aee-mathjax-on-export" );
      const markup = addMathJax( editor.getPresent(), mathjax );
      const nwindow = window.open( "" );

      nwindow.document.write( markup );
      nwindow.document.title = "AEE - Export";

      if ( mathjax )
      {
        setTimeout( () => nwindow.MathJax.Hub.Startup.onload(), 100 );
      }
    }
    catch ( e )
    {
    }
  };

  const do_print = async function( event ) {
    try {
      event.preventDefault();

      const mathjax = getLocalSetting( "aee-mathjax-on-print" );
      const markup = addMathJax( editor.getPresent(), mathjax );
      const nwindow = window.open( "" );

      nwindow.document.write( markup );
      nwindow.document.title = "AEE - Print";

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

  const do_copyPrint = async function( event ) {
    try {
      event.preventDefault();
      editor.copyPresent();
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  const do_copyPrintAll = async function( event ) {
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

  const do_settings = async function( event ) {
    try {
      event.preventDefault();

      const src = getSource() + "aee-settings.html";
      const nwindow = window.open( src );

      nwindow.addEventListener( "beforeunload", () => {
        EquationEditorAPI.BrlAPI.updateBrailleRules();
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
'            <li><a href="#" id="open" accesskey="o">O&#x0332;pen</a></li>' +
'            <li><a href="#" id="save" accesskey="s">S&#x0332;ave</a></li>' +
'            <li><a href="#" id="saveBRF" accesskey="b">Save B&#x0332;RF</a></li>' +
'            <li><a href="#" id="savePrint">Sav&#x0332;e Print</a></li>' +
'            <li><a href="#" id="export" accesskey="x">Ex&#x0332;port</a></li>' +
'            <li><a href="#" id="print" accesskey="p">P&#x0332;rint</a></li>' +
'            <li><a href="#" id="close" accesskey="c">C&#x0332;lose</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="e">Edit<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="copy">Copy</a></li>' +
'            <li><a href="#" id="paste">Paste</a></li>' +
'            <li><a href="#" id="copyAll">Copy All</a></li>' +
'            <li><a href="#" id="pasteAll">Paste All</a></li>' +
'            <li><a href="#" id="copyPrint">Copy Print</a></li>' +
'            <li><a href="#" id="copyPrintAll">Copy Print All</a></li>' +
'            <li><a href="#" id="copyAllMath">Copy All Math</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" accesskey="h">Help<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="' + getSource() + 'aee-start.html" id="start" accesskey="g">G&#x0332;etting Started</a></li>' +
'            <li><a target="_blank" href="' + getSource() + 'aee-guide.html" id="guide" accesskey="u">U&#x0332;sers Guide</a></li>' +
'            <li><a href="#" id="settings" accesskey="z">Settings (z&#x0332;)</a></li>' +
'            <li><a target="_blank" href="' + getSource() + 'aee-about.html" id="about" accesskey="a">A&#x0332;bout</a></li>' +
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
  addClick( "#saveBRF", do_saveBRF );
  addClick( "#savePrint", do_savePrint );
  addClick( "#export", do_export );
  addClick( "#print", do_print );
  addClick( "#close", do_close );

  addClick( "#copy", do_copy );
  addClick( "#paste", do_paste );
  addClick( "#copyAll", do_copyAll );
  addClick( "#pasteAll", do_pasteAll );
  addClick( "#copyPrint", do_copyPrint );
  addClick( "#copyPrintAll", do_copyPrintAll );
  addClick( "#copyAllMath", do_copyAllMath );

  addClick( "#settings", do_settings );

  const accel = {
    f: {
      o: "#open",
      s: "#save",
      b: "#saveBRF",
      v: "#savePrint",
      x: "#export",
      p: "#print",
      c: "#close" },
    h: {
      g: "#start",
      u: "#guide",
      z: "#settings",
      a: "#about"
    }
  };

  document.addEventListener( "keydown", ( e ) => {
    if ( e.key === "Escape" )
    {
      editor.setFocus();
    }
    else
    {
      const x1 = accel[ e.target.getAttribute( "accesskey" ) ] || {};
      const x2 = x1[ e.key ] || "";
      const elt = x2 && document.querySelector( x2 ) || null;
      if ( elt )
      {
        elt.click();
        editor.setFocus();
      }
    }
  } );
};
