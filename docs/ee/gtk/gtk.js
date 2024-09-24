(() => {
  document.addEventListener( "keydown", ( e ) => {
    if ( e.key === "Enter" || e.key === "Escape" )
    {
      window.close();
    }
    if ( e.key === "Home" )
    {
      window.open( "intro.html", "_self" );
    }
    if ( e.key === "Backspace" )
    {
      history.back();
    }
  } );

  document.querySelector( "h1" ).addEventListener( "click", () => {
    window.open( "intro.html", "_self" );
  } );
})();
