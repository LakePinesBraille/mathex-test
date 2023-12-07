(() => {
  const load = function( k ) {
    const elt = document.querySelector( "#" + k );
    if ( elt && elt.type === "checkbox" ) {
      elt.checked = localStorage[ k ] !== "false";
      elt.addEventListener( "change", () => save( k ) );
      save( k );
    }
  };

  const save = function( k ) {
    const elt = document.querySelector( "#" + k );
    if ( elt && elt.type === "checkbox" ) {
      localStorage[ k ] = elt.checked ? "true" : "false";
    }
  };

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
    localStorage[ "gtk-last-page-href" ] = window.location.href;
    load( "gtk-show-last-page" );
    load( "gtk-show-tutorial" );
  }
})();
