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

  document.querySelectorAll( "a.host" ).forEach( ( elt ) => {
    elt.download = ( window.location.host || "localhost" ) + ".JCF";
  } );

  document.querySelectorAll( "code.host" ).forEach( ( elt ) => {
    elt.innerText = ( window.location.host || "localhost" ) + ".JCF";
  } );

  if ( localStorage )
  {
    localStorage[ "ee-gtk-last-page-href" ] = window.location.href;
  }
})();
