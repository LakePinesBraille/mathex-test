const aee_drive = () => {

  // Public release web domain
  const DOMAIN = /lakepinesbraille.com/;

  // Public release switch
  const RELEASE = DOMAIN.test( window.location.href );

  // Application ID
  const APP_ID = RELEASE ?
    "883559470760":
    "672950632126";

  // Developer API Key
  const API_KEY = RELEASE ?
    "AIzaSyDtPGhWx9PVRv8bSmw5p4B7eIXR3pBWP14":
    "AIzaSyDAYkar6kzLyqPzQ4s6FB1-p07DSYvs6Io";

  // API OAuth 2.0 Client ID
  const CLIENT_ID = RELEASE ?
    "883559470760-1j0r0d77n9h6ufi6m48e2gi5l67ndt12.apps.googleusercontent.com":
    "672950632126-naefg7fqulag2gvvumkb7as6l91clcll.apps.googleusercontent.com";

  // API Discovery Document URL
  const DISCOVERY_DOC =
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

  // API Authorization Scopes
  const SCOPES =
    "https://www.googleapis.com/auth/drive.file";

  // The URL to load the Google Client API library
  const GAPI_URL =
    "https://apis.google.com/js/api.js";

  // The URL to load the Google Identity Services
  const GIS_URL =
    "https://accounts.google.com/gsi/client";

  // The Google Identity Services token client
  let tokenClient = null;

  // The Google Identity Services access token
  let accessToken = null;

  // The Google Identity Services access token expiration time
  let expiryTime = null;

  // The most recent file name
  let fileName = null;

  // The file ID for the most recent file
  let fileId = "";

  const OK = { status : true };
  const ERR = msg => ( { status : false, message : msg } );
  const LOG = msg => msg; // console.log( msg );
  const ALERT = msg => alert( msg );

  /**
   * Load an external script file.
   */
  const loadScript = ( id, src ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( document.getElementById( id ) )
        {
          LOG( `Script file ${src} already loaded` );
          resolve( OK );
        }
        else
        {
          const elt = document.createElement( "script" );
          elt.id = id;
          elt.src = src;
          elt.type = "text/javascript";
          elt.async = true;

          elt.addEventListener( "load", () => {
            LOG( `Loaded script file ${src}` );
            resolve( OK );
          } );
          elt.addEventListener( "error", () => {
            reject( ERR( `Failed to load script file ${src}` ) );
          } );

          document.head.appendChild( elt );
        }
      }
      catch ( e ) {
        reject( e );
      }
    } );
  };

  /**
   * Load the Google Client API component libraries.
   */
  const loadGapi = ( libs ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( !( gapi && gapi.load ) )
        {
          reject( ERR( "Google API failed to load" ) );
        }
        else if ( gapi && gapi.client )
        {
            LOG( "Client libraries already loaded" );
            resolve( OK );
        }
        else
        {
          gapi.load( libs, {
            callback : () => {
              LOG( `Loaded client libraries ${libs}` );
              resolve( OK );
            },
            onerror : () => {
              reject( ERR( `Failed to load client libraries ${libs}` ) );
            }
          } );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Initialize the Google Client API component libraries.
   */
  const initGapi = () => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( !( gapi && gapi.client ) )
        {
          reject( ERR( "Google API client loading error" ) );
        }
        else if ( gapi.client.drive )
        {
          LOG( "Google API client already initialized" );
          resolve( OK );
        }
        else
        {
          gapi.client.init( {
            apiKey : API_KEY,
            discoveryDocs : [ DISCOVERY_DOC ] } )
          .then( () => {
            LOG( "Google API client initialized" );
            resolve( OK );
          } )
          .catch( ( e ) => {
            reject( e.error.message );
          } );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Initialize the Google Identity Services token client.
   */
  const initGis = () => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( !( google && google.accounts ) )
        {
          reject( ERR( "Google Identity Services failed to load" ) );
        }
        else if ( tokenClient )
        {
            LOG( "Token client already initialized" );
            resolve( tokenClient );
        }
        else
        {
          tokenClient = google.accounts.oauth2.initTokenClient( {
            client_id : CLIENT_ID,
            scope : SCOPES
          } );
          LOG( "Token client initialized" );
          resolve( tokenClient );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Request the Google Drive access token.
   */
  const requestAccess = () => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( ! tokenClient )
        {
          reject( ERR( "Failed to create token client" ) );
        }
        else if ( accessToken && ( new Date().getTime() < expiryTime.getTime() ) )
        {
          LOG( "Access token valid until " + expiryTime );
          resolve( accessToken );
        }
        else
        {
          if ( accessToken )
          {
            LOG( "Access token expired at " + expiryTime );
            accessToken = null;
            expiryTime = null;
          }
          tokenClient.callback = ( resp ) => {
            if ( resp.error )
            {
              reject( ERR( resp.error ) );
            }
            else
            {
              accessToken = resp.access_token;
              expiryTime = new Date( new Date().getTime() + resp.expires_in * 1000 );
              LOG( "Access token valid until " + expiryTime );
              resolve( accessToken );
            }
          };
          tokenClient.error_callback = ( resp ) => {
            if ( resp.message )
            {
              reject( ERR( resp.message ) );
            }
          };

          tokenClient.requestAccessToken( { prompt : "" } );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Request the Google Drive UI install.
   */
  const requestInstall = () => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( ! tokenClient )
        {
          reject( ERR( "Failed to create token client" ) );
        }
        else
        {
          tokenClient.callback = ( resp ) => {
            if ( resp.error )
            {
              reject( ERR( resp.error ) );
            }
            else
            {
              LOG( "Success installing AEE into Google Drive UI" );
              resolve( resp.accessToken );
            }
          };
          tokenClient.error_callback = ( resp ) => {
            if ( resp.message )
            {
              reject( ERR( resp.message ) );
            }
          };

          tokenClient.requestAccessToken( {
            scope: "https://www.googleapis.com/auth/drive.install",
            prompt : ""
          } );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Initialize access to the Google Drive files.
   */
  const init = () => Promise.resolve()
    .then( () => loadScript( "gapi-js", GAPI_URL ) )
    .then( () => loadScript( "gis-js", GIS_URL ) )
    .then( () => loadGapi( "client:picker" ) )
    .then( () => initGapi() )
    .then( () => initGis() )
    .then( () => LOG( "Google libraries initialized" ) );

  /**
   * Request access to the Google Drive files.
   */
  const request = () => init()
    .then( () => requestAccess() )
    .then( () => LOG( "Access granted" ) );

  /**
   * Wait for the window to receive the focus.
   */
  const waitForFocus = () => {
    return new Promise( ( resolve, reject ) => {
      try {
        window.addEventListener( "focus", () => {
          LOG( "Window received focus" );
          resolve( OK );
        } );
        window.setTimeout( () => {
          reject( ERR( "Window did not receive focus" ) );
        }, 1000 );
      }
      catch ( e ) {
        reject( e );
      }
    } );
  };

  /**
   * Create and display a file picker.
   */
  const createPicker = ( folders, title ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        if ( !( google && google.picker ) )
        {
          reject( ERR( "Google Picker library failed to load" ) );
        }
        else if ( ! accessToken )
        {
          reject( ERR( "Failed to create access token" ) );
        }
        else {
          const cb = ( data ) => {
            if ( data.action === google.picker.Action.CANCEL )
            {
              reject( ERR( "Google Picker dialog cancelled" ) );
            }
            if ( data.action === google.picker.Action.PICKED )
            {
              resolve( data );
            }
          };

          const type = folders ? "application/vnd.google-apps.folder" : "";

          const view = new google.picker.DocsView()
            .setMimeTypes( type )
            .setIncludeFolders( true )
            .setSelectFolderEnabled( folders )
            .setMode( google.picker.DocsViewMode.LIST );

          const picker = new google.picker.PickerBuilder()
            .setAppId( APP_ID )
            .setDeveloperKey( API_KEY )
            .setOAuthToken( accessToken )
            .setCallback( cb )
            .setTitle( title )
            .enableFeature( google.picker.Feature.NAV_HIDDEN )
            .addView( view )
            .build();

          picker.setVisible( true );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Process the picker results for drive open.
   */
  async function open_picked( data, fn, cb ) {
    const ofileName = fileName;
    const ofileId = fileId;

    const fileDoc = data[ google.picker.Response.DOCUMENTS ][ 0 ];

    fileName = fileDoc[ google.picker.Document.NAME ];
    fileId = fileDoc[ google.picker.Document.ID ];

    const result = await gapi.client.drive.files.get( {
      fileId : fileId,
      alt : "media"
    } );

    if ( result.status === 200 )
    {
      LOG( "Success opening file " + fileName );
      fn( result.body );
      cb( fileName );

      const query = "?state=%7B%22action%22%3A%22open%22%2C%22ids%22%3A%5B%22" + fileId + "%22%5D%7D";
      const params = new URLSearchParams( query );
      const data = JSON.parse( params.get( "state" ) );

      history.pushState( data, "", window.location.href );
    }
    else
    {
      LOG( "Error opening file " + fileName );
      fileName = ofileName;
      fileId = ofileId;
    }
  };

  /**
   * Process the picker results for drive save.
   */
  const save_picked = ( fn, cb ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        const uri = "https://www.googleapis.com/upload/drive/v3/files/";

        if ( confirm( "Replace existing file " + fileName + "?" ) )
        {
          var xhr = new XMLHttpRequest();
          xhr.addEventListener( "readystatechange", () => {
            if ( xhr.readyState === 4 && xhr.status === 200 )
            {
              LOG( "Success saving file " + fileName );
              cb( fileName );
              resolve( OK );
            }
            else if ( xhr.readyState === 4 )
            {
              reject( ERR( "Error replacing file " + fileName ) );
            }
          } );
          xhr.open( "PATCH", uri + fileId + "?uploadType=media" );
          xhr.setRequestHeader( "Authorization", "Bearer " + accessToken );
          xhr.send( new Blob( [ fn() ], { type: "text/html" } ) );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Process the picker results for drive save as.
   */
  const save_as_picked = ( data, fn, cb ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        const ofileName = fileName;
        const ofileId = fileId;

        const fileDoc = data[ google.picker.Response.DOCUMENTS ][ 0 ];

        fileName = fileDoc[ google.picker.Document.NAME ];
        fileId = fileDoc[ google.picker.Document.ID ];

        const uri = "https://www.googleapis.com/upload/drive/v3/files/";

        const nfileName = prompt( "Save file as", ofileName || "untitled.html" );
        if ( !nfileName )
        {
          fileName = ofileName;
          fileId = ofileId;

          reject( ERR( "File save as dialog cancelled" ) );
          return;
        }

        var metadata = {
          name : nfileName,
          mimeType : "text/html",
          parents : [ fileId ]
        };
        var form = new FormData();
        form.append( "metadata", new Blob( [ JSON.stringify( metadata ) ], {
          type : "application/json"
        } ) );
        form.append( "file", new Blob( [ fn() ], {
          type : "text/html"
        } ) );

        var xhr = new XMLHttpRequest();
        xhr.addEventListener( "readystatechange", () => {
          if ( xhr.readyState === 4 && xhr.status === 200 )
          {
            LOG( "Success saving file " + nfileName );
            cb( nfileName );

            fileName = nfileName;
            fileId = JSON.parse( xhr.response ).id;

            resolve( OK );
          }
          else if ( xhr.readyState === 4 )
          {
            fileName = ofileName;
            fileId = ofileId;

            reject( ERR( "Error saving new file " + nfileName ) );
          }
        } );
        xhr.open( "POST", uri + "?uploadType=multipart" );
        xhr.setRequestHeader( "Authorization", "Bearer " + accessToken );
        xhr.send( form );
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Process the picker results for drive save replace.
   */
  const save_replace_picked = ( data, fn, cb ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        const ofileName = fileName;
        const ofileId = fileId;

        const fileDoc = data[ google.picker.Response.DOCUMENTS ][ 0 ];

        fileName = fileDoc[ google.picker.Document.NAME ];
        fileId = fileDoc[ google.picker.Document.ID ];

        const uri = "https://www.googleapis.com/upload/drive/v3/files/";

        if ( confirm( "Replace existing file " + fileName + "?" ) )
        {
          var xhr = new XMLHttpRequest();
          xhr.addEventListener( "readystatechange", () => {
            if ( xhr.readyState === 4 && xhr.status === 200 )
            {
              LOG( "Success saving file " + fileName );
              cb( fileName );
              resolve( OK );
            }
            else if ( xhr.readyState === 4 )
            {
              fileName = ofileName;
              fileId = ofileId;

              reject( ERR( "Error replacing file " + fileName ) );
            }
          } );
          xhr.open( "PATCH", uri + fileId + "?uploadType=media" );
          xhr.setRequestHeader( "Authorization", "Bearer " + accessToken );
          xhr.send( new Blob( [ fn() ], { type: "text/html" } ) );
        }
        else
        {
          fileName = ofileName;
          fileId = ofileId;

          reject( ERR( "File save replace dialog cancelled" ) );
        }
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Process the picker results for drive open.
   */
  async function link_picked( data, fn ) {
    const ofileName = fileName;
    const ofileId = fileId;

    const fileDoc = data[ google.picker.Response.DOCUMENTS ][ 0 ];

    fileName = fileDoc[ google.picker.Document.NAME ];
    fileId = fileDoc[ google.picker.Document.ID ];

    fn( fileName, fileId );

    fileName = ofileName;
    fileId = ofileId;
  };

  /**
   * Process the query data for drive open with.
   */
  async function open_with( data, fn, cb ) {
    const ofileName = fileName;
    const ofileId = fileId;

    if ( ! data.ids[ 0 ] )
    {
      LOG( "Error opening file - id not found" );
      return;
    }

    const metadata = await gapi.client.drive.files.get( {
      fileId : data.ids[ 0 ]
    } );

    if ( metadata.status !== 200 )
    {
      LOG( "Error opening file - metadata not found" );
      return;
    }

    const md = JSON.parse( metadata.body );
    fileName = md.name;
    fileId = md.id;

    const result = await gapi.client.drive.files.get( {
      fileId : fileId,
      alt : "media"
    } );

    if ( result.status !== 200 )
    {
      fileName = ofileName;
      fileId = ofileId;

      LOG( "Error opening file " + fileName );
      return;
    }

    fn( result.body );
    cb( fileName );

    LOG( "Success opening file " + fileName );
  };

  /**
   * Process the query data for drive create new.
   */
  const create_new = ( data, fn, cb ) => {
    return new Promise( ( resolve, reject ) => {
      try {
        const ofileName = fileName;
        const ofileId = fileId;

        fileId = data.folderId;
        const uri = "https://www.googleapis.com/upload/drive/v3/files/";

        const nfileName = prompt( "Save file as", ofileName || "untitled.html" );
        if ( !nfileName )
        {
          fileName = ofileName;
          fileId = ofileId;

          reject( ERR( "File create new dialog cancelled" ) );
          return;
        }

        var metadata = {
          name : nfileName,
          mimeType : "text/html",
          parents : [ fileId ]
        };
        var form = new FormData();
        form.append( "metadata", new Blob( [ JSON.stringify( metadata ) ], {
          type : "application/json"
        } ) );
        form.append( "file", new Blob( [ fn() ], {
          type : "text/html"
        } ) );

        var xhr = new XMLHttpRequest();
        xhr.addEventListener( "readystatechange", () => {
          if ( xhr.readyState === 4 && xhr.status === 200 )
          {
            LOG( "Success creating file " + nfileName );
            cb( nfileName );

            fileName = nfileName;
            fileId = JSON.parse( xhr.response ).id;

            resolve( OK );
          }
          else if ( xhr.readyState === 4 )
          {
            fileName = ofileName;
            fileId = ofileId;

            reject( ERR( "Error creating new file " + nfileName ) );
          }
        } );
        xhr.open( "POST", uri + "?uploadType=multipart" );
        xhr.setRequestHeader( "Authorization", "Bearer " + accessToken );
        xhr.send( form );
      }
      catch ( e )
      {
        reject( e );
      }
    } );
  };

  /**
   * Open a file from Google Drive.
   */
  const drive_open = ( fn, cb ) => request()
    .then( () => createPicker( false, "Select a file to Open" ) )
    .then( ( data ) => open_picked( data, fn, cb ) )
    .catch( e => ALERT( e.message ) );

  /**
   * Save an existing file to Google Drive.
   */
  const drive_save = ( fn, cb ) => {
    if ( fileName && fileId ) {
      request()
        .then( () => save_picked( fn, cb ) )
        .catch( e => ALERT( e.message ) );
    }
    else {
      return drive_save_as( fn, cb );
    }
  };

  /**
   * Save a new file to Google Drive.
   */
  const drive_save_as = ( fn, cb ) => request()
    .then( () => createPicker( true, "Select a folder to Save into" ) )
    .then( ( data ) => save_as_picked( data, fn, cb ) )
    .catch( e => ALERT( e.message ) );

  /**
   * Save and replace an existing file on Google Drive.
   */
  const drive_save_replace = ( fn, cb ) => request()
    .then( () => createPicker( false, "Select a file to Replace" ) )
    .then( ( data ) => save_replace_picked( data, fn, cb ) )
    .catch( e => ALERT( e.message ) );

  /**
   * Create a document link to an existing file on Google Drive.
   */
  const drive_link = ( fn ) => request()
    .then( () => createPicker( false, "Select a file to Link to" ) )
    .then( ( data ) => link_picked( data, fn ) )
    .catch( e => ALERT( e.message ) );

  /**
   * Install into the Google Drive UI.
   */
  const drive_install = () => init()
    .then( () => requestInstall() )
    .then( () => ALERT( "AEE installed into Google Drive UI" ) )
    .catch( e => ALERT( e.message ) );

  /**
   * Process a Google Drive open with request.
   */
  const drive_open_with = ( data, fn, cb ) => request()
    .then( () => open_with( data, fn, cb ) )
    .catch( e => ALERT( e.message ) );

  /**
   * Process a Google Drive create new request..
   */
  const drive_create_new = ( data, fn, cb ) => request()
    .then( () => waitForFocus() )
    .then( () => create_new( data, fn, cb ) )
    .catch( e => ALERT( e.message ) );

  aee_drive.open = drive_open;
  aee_drive.save = drive_save;
  aee_drive.save_as = drive_save_as;
  aee_drive.save_replace = drive_save_replace;
  aee_drive.link = drive_link;
  aee_drive.install = drive_install;
  aee_drive.open_with = drive_open_with;
  aee_drive.create_new = drive_create_new;
};

aee_drive();
