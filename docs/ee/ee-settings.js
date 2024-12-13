/**
 * Equalize Editor local setting values.
 */
const ee_settings = (() => {
  const _ee = {};

  /**
   * The default local setting values.
   */
  _ee.settings = {};

  /**
   * The default symbol palette names.
   */
  _ee.palettes = {};

  /**
   * Return true for a local setting key name.
   */
  _ee.isKey = ( key ) => {
    return _ee.settings.hasOwnProperty( key );
  };

  /**
   * Retrieve a local setting default value.
   */
  _ee.def = ( key ) => {
    return _ee.settings[ key ];
  };

  /**
   * Assign a local setting default value.
   */
  _ee.setdef = ( key, value ) => {
    _ee.settings[ key ] = value;
  };

  /**
   * Retrieve a local setting value.
   */
  _ee.get = ( key ) => {
    return localStorage && localStorage[ key ] || _ee.def( key );
  };

  /**
   * Assign a local setting value.
   */
  _ee.set = ( key, value ) => {
    localStorage[ key ] = value;
  };

  /**
   * Remove a local setting value.
   */
  _ee.remove = ( key ) => {
    delete localStorage[ key ];
  };

  /**
   * Retrieve a boolean local setting value.
   */
  _ee.getBool = ( key ) => {
    return _ee.get( key ) !== "false";
  };

  /**
   * Assign a boolean local setting value.
   */
  _ee.setBool = ( key, value ) => {
    _ee.set( key, value ? "true" : "false" );
  };

  /**
   * Toggle a boolean local setting value.
   */
  _ee.toggleBool = ( key ) => {
    _ee.setBool( key, !_ee.getBool( key ) );
  };

  /**
   * Retrieve a numeric local setting value.
   */
  _ee.getNumber = ( key ) => {
    return _ee.get( key ) || "";
  };

  /**
   * Assign a numeric local setting value.
   */
  _ee.setNumber = ( key, value ) => {
    _ee.set( key, value );
  };

  /**
   * Create the local settings for the symbol palettes.
   */
  _ee.init = () => {
    for ( var k in _ee.palettes )
    {
      _ee.setdef( k + "-active", "true" );
      _ee.setdef( k + "-open", "false" );
    };
  };

  /**
   * Create the local storage objects.
   */
  _ee.setup = () => {
    localStorage = localStorage || {};
    localStorage.clear = localStorage.clear || ( () => localStorage = {} );
  };

  /**
   * Remove unknown local setting values.
   */
  _ee.clean = () => {
    for ( var key in localStorage )
    {
      if ( key.startsWith( "ee-" ) && !_ee.isKey( key ) )
      {
        _ee.remove( key );
      }
    }
  };

  /**
   * Assign default values for undefined setting values.
   */
  _ee.assign = () => {
    for ( var key in _ee.settings )
    {
      _ee.set( key, _ee.get( key ) );
    }
  };

  /**
   * Assign default values for all local setting values.
   */
  _ee.reset = () => {
    for ( var key in _ee.settings )
    {
      if ( !( key === "ee-app-home" || key === "ee-doc-home" ) )
        {
          _ee.set( key, _ee.def( key ) );
        }
    }
  };

  /**
   * Validate current values of local setting values.
   */
  _ee.check = () =>
  {
    if ( _ee.getBool( "ee-panel-side-bar" ) )
    {
      var key;

      // Unless any palette is active
      for ( key in _ee.palettes )
      {
        if ( _ee.getBool( key + "-active" ) )
        {
          return;
        }
      }

      // Mark all palettes as active
      for ( key in _ee.palettes )
      {
        _ee.setBool( key + "-active", true );
      }
    }
  };

  /**
   * The default local setting values.
   */
  _ee.settings = {
    "ee-app-home" : "",
    "ee-doc-home" : "",
    "ee-width" : 0,
    "ee-height" : 0,
    "ee-query-state" : "",
    "ee-input-qwerty" : "true",
    "ee-input-braille" : "false",
    "ee-input-home" : "false",
    "ee-panel-app-menus" : "true",
    "ee-panel-open-file" : "true",
    "ee-panel-quick-bar" : "true",
    "ee-panel-side-bar" : "true",
    "ee-panel-braille-bar" : "true",
    "ee-css-styles-on-save" : "false",
    "ee-css-styles-on-export" : "true",
    "ee-css-styles-on-print" : "true",
    "ee-mathjax-on-save" : "false",
    "ee-mathjax-on-export" : "true",
    "ee-mathjax-on-print" : "true",
    "ee-panel-page-width" : 24,
    "ee-panel-page-height" : 4,
    "ee-panel-indent-first" : 1,
    "ee-panel-indent-runover" : 1,
    "ee-linear-page-width" : 40,
    "ee-linear-page-height" : 1,
    "ee-linear-indent-first" : 1,
    "ee-linear-indent-runover" : 1,
    "ee-matrix-page-width" : 16,
    "ee-matrix-page-height" : 8,
    "ee-matrix-indent-first" : 1,
    "ee-matrix-indent-runover" : 1,
    "ee-file-page-width" : 40,
    "ee-file-page-height" : 25,
    "ee-file-page-numbers" : "true",
    "ee-file-indent-first" : 1,
    "ee-file-indent-runover" : 1,
    "ee-math-indent-first" : 3,
    "ee-math-indent-runover" : 5,
    "ee-math-display-short" : "true",
    "ee-html-font-size" : 18,
    "ee-brl-font-size" : 18,
    "ee-fmt-heading-1": "center",
    "ee-fmt-heading-2": "cell-5",
    "ee-fmt-heading-3": "cell-7",
    "ee-fmt-heading-4": "cell-7",
    "ee-fmt-heading-5": "cell-7",
    "ee-fmt-heading-6": "cell-7",
    "ee-brl-rules-all-rules" : "true",
    "ee-brl-rules-alphabetic-wordsigns" : "true",
    "ee-brl-rules-strong-wordsigns" : "true",
    "ee-brl-rules-strong-contractions" : "true",
    "ee-brl-rules-strong-groupsigns" : "true",
    "ee-brl-rules-lower-wordsigns" : "true",
    "ee-brl-rules-lower-groupsigns" : "true",
    "ee-brl-rules-initial-letter" : "true",
    "ee-brl-rules-initial-letter-45" : "true",
    "ee-brl-rules-initial-letter-456" : "true",
    "ee-brl-rules-initial-letter-5" : "true",
    "ee-brl-rules-final-letter" : "true",
    "ee-brl-rules-final-letter-46" : "true",
    "ee-brl-rules-final-letter-56" : "true",
    "ee-brl-rules-shortforms" : "true"
  };

  /**
   * The default symbol palette names.
   */
  _ee.palettes = {
    "ee-plt-palettes" : "All Palettes",
    "ee-plt-numbers" : "Numbers",
    "ee-plt-arithmetic" : "Arithmetic",
    "ee-plt-exponents" : "Exponents",
    "ee-plt-functions" : "Functions",
    "ee-plt-grouping" : "Grouping",
    "ee-plt-relations" : "Relations",
    "ee-plt-omissions" : "Omissions",
    "ee-plt-sets" : "Sets",
    "ee-plt-logic" : "Logic",
    "ee-plt-lines" : "Lines",
    "ee-plt-angles" : "Angles",
    "ee-plt-arrows" : "Arrows",
    "ee-plt-double-arrows" : "Double arrows",
    "ee-plt-trigonometry" : "Trigonometry",
    "ee-plt-hyperbolic" : "Hyperbolic",
    "ee-plt-series" : "Series",
    "ee-plt-scripts" : "Scripts",
    "ee-plt-shapes" : "Shapes",
    "ee-plt-circled" : "Circled",
    "ee-plt-squared" : "Squared",
    "ee-plt-headings" : "Headings",
    "ee-plt-style" : "Text styles",
    "ee-plt-unB" : "Units - Base",
    "ee-plt-unO" : "Units - Other",
    "ee-plt-unD" : "Units - Derived",
    "ee-plt-unC" : "Units - Composed",
    "ee-plt-unM" : "Units - Meter",
    "ee-plt-unG" : "Units - Gram",
    "ee-plt-unL" : "Units - Liter",
    "ee-plt-chH" : "Elements",
    "ee-plt-rmA" : "Latin (upper)",
    "ee-plt-rma" : "Latin (lower)",
    "ee-plt-rm0" : "Latin (digit)",
    "ee-plt-rmb" : "Latin (basic)",
    "ee-plt-rmx" : "Latin (extended)",
    "ee-plt-rmp" : "Latin (punctuation)",
    "ee-plt-rms" : "Latin (symbol)",
    "ee-plt-bfA" : "Bold (upper)",
    "ee-plt-bfa" : "Bold (lower)",
    "ee-plt-bf0" : "Bold (digit)",
    "ee-plt-itA" : "Italic (upper)",
    "ee-plt-ita" : "Italic (lower)",
    "ee-plt-biA" : "Bold Italic (upper)",
    "ee-plt-bia" : "Bold Italic (lower)",
    "ee-plt-scA" : "Script (upper)",
    "ee-plt-sca" : "Script (lower)",
    "ee-plt-scbfA" : "Bold Script (upper)",
    "ee-plt-scbfa" : "Bold Script (lower)",
    "ee-plt-frA" : "Fraktur (upper)",
    "ee-plt-fra" : "Fraktur (lower)",
    "ee-plt-frbfA" : "Bold Fraktur (upper)",
    "ee-plt-frbfa" : "Bold Fraktur (lower)",
    "ee-plt-bbA" : "Blackboard (upper)",
    "ee-plt-bba" : "Blackboard (lower)",
    "ee-plt-bb0" : "Blackboard (digit)",
    "ee-plt-ssA" : "Sans Serif (upper)",
    "ee-plt-ssa" : "Sans Serif (lower)",
    "ee-plt-ss0" : "Sans Serif (digit)",
    "ee-plt-ssbfA" : "Sans Serif Bold (upper)",
    "ee-plt-ssbfa" : "Sans Serif Bold (lower)",
    "ee-plt-ssbf0" : "Sans Serif Bold (digit)",
    "ee-plt-ssitA" : "Sans Serif Italic (upper)",
    "ee-plt-ssita" : "Sans Serif Italic (lower)",
    "ee-plt-ssbiA" : "Sans Bold Italic (upper)",
    "ee-plt-ssbia" : "Sans Bold Italic (lower)",
    "ee-plt-ttA" : "Monospace (upper)",
    "ee-plt-tta" : "Monospace (lower)",
    "ee-plt-tt0" : "Monospace (digit)",
    "ee-plt-calA" : "Caligraphic (upper)",
    "ee-plt-cala" : "Caligraphic (lower)",
    "ee-plt-hatA" : "Hat (upper)",
    "ee-plt-hata" : "Hat (lower)",
    "ee-plt-vecA" : "Vector (upper)",
    "ee-plt-veca" : "Vector (lower)",
    "ee-plt-cyCy" : "Cyrillic (upper)",
    "ee-plt-cycy" : "Cyrillic (lower)",
    "ee-plt-hbalef" : "Hebrew (letter)",
    "ee-plt-hbaleph" : "Hebrew (symbol)",
    "ee-plt-gkAlpha" : "Greek (upper)",
    "ee-plt-gkalpha" : "Greek (lower)",
    "ee-plt-gksymbol" : "Greek (symbol)",
    "ee-plt-bfAlpha" : "Greek Bold (upper)",
    "ee-plt-bfalpha" : "Greek Bold (lower)",
    "ee-plt-bfgreek" : "Greek Bold (symbol)",
    "ee-plt-itAlpha" : "Greek Italic (upper)",
    "ee-plt-italpha" : "Greek Italic (lower)",
    "ee-plt-itgreek" : "Greek Italic (symbol)",
    "ee-plt-biAlpha" : "Greek Bold Italic (upper)",
    "ee-plt-bialpha" : "Greek Bold Italic (lower)",
    "ee-plt-bigreek" : "Greek Bold Italic (symbol)",
    "ee-plt-ssbfAlpha" : "Greek Sans Bold (upper)",
    "ee-plt-ssbfalpha" : "Greek Sans Bold (lower)",
    "ee-plt-ssbfgreek" : "Greek Sans Bold (symbol)",
    "ee-plt-ssbiAlpha" : "Greek Sans BI (upper)",
    "ee-plt-ssbialpha" : "Greek Sans BI (lower)",
    "ee-plt-ssbigreek" : "Greek Sans BI (symbol)"
  };

  _ee.init();
  _ee.setup();
  _ee.clean();
  _ee.assign();
  _ee.check();

  return _ee;
})();
