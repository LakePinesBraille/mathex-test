const init = function() {
  const editor = EquationEditorAPI.getInstance( "RESPONSE" );

  const file_options = {
    multiple : false,
    excludeAcceptAllOption : true,
    suggestedName : "untitled html.html",
    types: [ {
      description: "HTML Files",
      accept: { "text/plain": [ ".html" ] }
    } ]
  };

  document.querySelector( "#load" ).onclick = async () => {
    [ handle ] = await window.showOpenFilePicker( file_options );
    const file = await handle.getFile();
    const content = await file.text();
    editor.setDocumentContent( content );
    editor.setFocus();
  };

  document.querySelector( "#save" ).onclick = async () => {
    const handle = await window.showSaveFilePicker( file_options );
    const file = await handle.createWritable();
    const content = editor.getDocumentContent();
    await file.write( content );
    await file.close();
  };
};