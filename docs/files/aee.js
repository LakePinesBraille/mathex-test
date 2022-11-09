const init = function() {
  editor = EquationEditorAPI.getInstance( "RESPONSE" );

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

  const script_tag = "    <script type=\"text/javascript\"" +
    " src=\"https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=MML_CHTML\">" +
    "</script>\r\n";
  const body_tag = "  <body>\r\n";
  const head_tag = "  <head>\r\n" + script_tag + "  </head>\r\n";

  const addMathJax = function( markup ) {
    return markup.replace( body_tag, head_tag + body_tag );
  };

  const addClick = function( s, fn ) {
    const elt = document.querySelector( s );
    if ( elt )
    {
      elt.onclick = fn;
    }
  };

  addClick( "#open", async () => {
    try {
      const options = getOpenOptions();
      [ handle ] = await window.showOpenFilePicker( options );
      const file = await handle.getFile();
      const markup = await file.text();

      editor.setContent( markup );
      editor.setFocus();
      editor.requestDone();
    }
    catch ( e )
    {
    }
  } );

  addClick( "#save", async () => {
    try {
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
  } );

  addClick( "#export", async () => {
    try {
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
  } );

  addClick( "#mathjax", async () => {
    try {
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
  } );
};
