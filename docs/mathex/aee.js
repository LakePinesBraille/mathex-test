const aee_init = function() {
  editor = EquationEditorAPI.getInstance( "RESPONSE" );

  const getVersion = function() {
    return EquationEditorAPI.version.replace( "-SNAPSHOT", "" );
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

  const text_types = { types : [ {
    description : "HTML + MathML Content",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  const text_export = { types : [ {
    description : "HTML + MathML Presentation",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  const text_mathjax = { types : [ {
    description : "HTML + MathJax + MathML Presentation",
    accept : { "application/html" : [ ".html" ] }
  } ] };

  const isMath = function() {
    return /math/.test( editor._initial );
  };

  const getOpenOptions = function() {
    return Object.assign( {}, file_options,
      isMath() ? math_types : text_types );
  };

  const getExportOptions = function() {
    return Object.assign( {}, file_options,
      isMath() ? math_export : text_export );
  };

  const getMathJaxOptions = function() {
    return Object.assign( {}, file_options, text_mathjax );
  };

  const script_tag = '    <script type="text/javascript" ' +
'src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js' +
'?config=MML_CHTML"></script>\r\n';
  const body_tag = '  <body>\r\n';
  const head_tag = '  <head>\r\n' + script_tag + '  </head>\r\n';

  const addMathJax = function( markup ) {
    return markup.replace( body_tag, head_tag + body_tag );
  };

  const do_open = async function( event ) {
    try {
      event.preventDefault();

      const options = getOpenOptions();
      [ handle ] = await window.showOpenFilePicker( options );
      const file = await handle.getFile();
      const markup = await file.text();

      editor.setContent( markup );
      editor.processTemplate( "ctrl-end" );
      editor.setFocus();
    }
    catch ( e )
    {
    }
  };

  const do_save = async function( event ) {
    try {
      event.preventDefault();

      const options = getOpenOptions();
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();
      const markup = editor.getContent();

      await file.write( markup );
      await file.close();
    }
    catch ( e )
    {
    }
  };

  const do_export = async function( event ) {
    try {
      event.preventDefault();

      const options = getExportOptions();
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();
      const markup = editor.getPresent();

      await file.write( markup );
      await file.close();
    }
    catch ( e )
    {
    }
  };

  const do_mathjax = async function( event ) {
    try {
      event.preventDefault();

      const options = getMathJaxOptions();
      const handle = await window.showSaveFilePicker( options );
      const file = await handle.createWritable();
      const markup = addMathJax( editor.getPresent() );

      await file.write( markup );
      await file.close();
    }
    catch ( e )
    {
    }
  };

  const do_copy = async function( event ) {
    try {
      event.preventDefault();

      const markup = editor.copy();
      navigator.clipboard.writeText( markup );
    }
    catch ( e )
    {
    }
  };

  const do_paste = async function( event ) {
    try {
      event.preventDefault();

      navigator.clipboard.readText().then(
        ( markup ) => {
            editor.paste( markup );
            editor.setFocus();
        } );
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
            editor.processTemplate( "ctrl-end" );
            editor.setFocus();
        } );
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
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">File<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="open">Open</a></li>' +
'            <li><a href="#" id="save">Save</a></li>' +
'            <li><a href="#" id="export">Save As Presentation</a></li>' +
( isMath() ? '' :
'            <li><a href="#" id="mathjax">Save As MathJax</a></li>' ) +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Edit<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="#" id="copy">Copy</a></li>' +
'            <li><a href="#" id="paste">Paste</a></li>' +
'            <li><a href="#" id="copyAll">Copy All</a></li>' +
'            <li><a href="#" id="pasteAll">Paste All</a></li>' +
'          </ul>' +
'        </li>' +
'        <li class="dropdown">' +
'          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Help<span class="caret"></span></a>' +
'          <ul class="dropdown-menu">' +
'            <li><a href="aee-help.html">Getting Started</a></li>' +
'          </ul>' +
'        </li>' +
'      </ul>' +
'    </div>' +
'  </div>';

  addMarkup( ".ee-menu", menu_markup );
  addMarkup( ".ee-version", getVersion() );

  addClick( "#open", do_open );
  addClick( "#save", do_save );
  addClick( "#export", do_export );
  addClick( "#mathjax", do_mathjax );

  addClick( "#copy", do_copy );
  addClick( "#paste", do_paste );
  addClick( "#copyAll", do_copyAll );
  addClick( "#pasteAll", do_pasteAll );
};
