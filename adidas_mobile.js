var $el = {},  // Elements cache
  aMenus = [], // Array of menus
  isMobile,    // Mobile flag
  SPC_DEBUG = false, // Global flag to toggle logging
  pickUpStorePopupFlag = 0;

// Debouncing function from John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
var debounce = function(func, threshold, execAsap) {
  var timeout;
  return function debounced() {
    var obj = this,
      args = arguments;
    function delayed() {
      if (!execAsap) func.apply(obj, args);
      timeout = null;
    };
    if (timeout) clearTimeout(timeout);
    else if (execAsap) func.apply(obj, args);
    timeout = setTimeout(delayed, threshold || 300);
  };
};

// Add Number.round() that works around JavaScript's weird float handling
// Usage:
// var n = 1.005;
// n.round(2); // Outputs 1.01
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
Number.prototype.round = function(nDecimalPlaces) {
  return +(Math.round(this + 'e+' + nDecimalPlaces) + 'e-' + nDecimalPlaces);
};

// jQuery plugins
(function($) {
  // Smooth scroll-to
  $.fn.scrollHere = function(oOptions) {
    if (!this.length) return;
    oOptions = jQuery.extend({
        hash: this.attr('name') || '', // Append hash to URL?
        speed: 350 // Animation speed
      }, oOptions);
    jQuery('html,body').animate({
      scrollTop: this.offset().top - (isMobile ? 0 : jQuery('#header').height())
    }, oOptions.speed);
    if (oOptions.hash) {
      location.hash = oOptions.hash;
    }
  };
  // Smart resize using debounce()
  $.fn.smartResize = function(func, threshold, execAsap) {
    return func ? this.resize(debounce(func, threshold, execAsap)) : this.trigger(smartResize);
  };
})(jQuery);


/* Nav Accordion Plugin v1.1
************************************/
(function($) {
  $.fn.navAccordion = function(options) {
    this.each(function() {

      //Options
      var settings = $.extend({
        expandButtonText : "+", //Text inside of expand button
        collapseButtonText: "-",  //Text inside of collapse button
        selectedExpand: "true",   //Expand the selected channel
        selectedClass: "selected",  //Class that will be used to detect the currently selected channel - this will check the "parentElement" for this class (the parent <li> by default)
        multipleLevels: "true",  //Apply accordion to all levels - setting this to false will apply the accordion only to the first level
        buttonWidth: "20%",  //Width of accordion expand/collapse button as a percentage or pixels
        buttonPosition: "right",  //Position of button - 'right' is default - you can also choose 'left'
        slideSpeed: "fast",   //Speed of slide animation - "fast", "slow", or number in milliseconds such as 500
        parentElement: "li",  //Parent element type, class or ID - you don't need to change this if you're using a ul > li > ul pattern
        childElement: "ul",   //Child element type, class or ID - you don't need to change this if you're using a ul > li > ul pattern
        headersOnly: false,  //False is default - setting to true will make any link with sub-nav behave as if it were set to header only, making the link inaccessible - this option is useful if you are using the plugin for a non-navigation area
        headersOnlyCheck: false, // False is default - set to true to apply the accordion only to links that are set as "header only" (have no href)
        delayLink: false,  //Delay following the href of links until after the accordion the has expanded
        delayAmount: null //Time in milliseconds to delay before following href - will use "slideSpeed" by default if nothing else is set
      }, options);

      var container = this,
      //Multiple levels variable
        multi = settings.multipleLevels ? '': ' > ' + settings.childElement + ' > ';

      //Add class to container
      $(container)
        .addClass('accordion-nav');

      //Apply has-subnav class to lis with uls - also add accordion buttons with styles
      $(multi + settings.parentElement, container).each(function() {
        if ( ($(this).contents(settings.childElement).length > 0
          && settings.headersOnlyCheck == false) || (!($('> a', this).attr('href'))
          && settings.headersOnlyCheck == true) )
        {
          //Apply Class and styles to parent item
          $(this).addClass('has-subnav')
            .css('position', 'relative')
              .find('>a')
                .css('margin-' + settings.buttonPosition, settings.buttonWidth);

          //Add expand button elements
          $(' > ' + settings.childElement, this)
            .before('<span class="accordion-btn-wrap"><span class="accordion-btn accordion-collapsed">'
            + settings.expandButtonText + '</span><span class="accordion-btn accordion-expanded">'
            + settings.collapseButtonText + '</span></span>');

          //Apply Styles to expand button
          $('.accordion-btn-wrap', this)
            .css({
              'width': settings.buttonWidth,
              'position': 'absolute',
              'top': 0,
              'text-align': 'center',
              'cursor': 'pointer',
              'display': 'inline-block'
            })
            .css(settings.buttonPosition, 0);
          $('.accordion-btn ', this)
            .css({
              'display': 'inline-block',
              'width': '100%'
            });
          $('.accordion-expanded', this)
            .css('display', 'none');
        }

        //Apply styles to <a> tags that are set to header only
        if (!($('> a', this).attr('href')) || settings.headersOnly) {
          $(this)
            .addClass('accordion-header-only')
              .find('.accordion-btn-wrap')
                .css({
                  'width': '100%',
                  'text-align': settings.buttonPosition
                })
                .find('.accordion-btn ')
                  .css({
                    'width': settings.buttonWidth,
                    'text-align': 'center'
                  });
        }

        //Delay Link Mode
        if (settings.delayLink && !settings.headersOnly) {
          var currentThis = this,
            speed = settings.delayAmount != null ? settings.delayAmount : settings.slideSpeed;
          if (speed == "fast") {
            speed = 200;
          } else if (speed == "slow") {
            speed = 600;
          }
          $('> a', currentThis).on('click',function(e) {
            if (!$('> .accordion-btn-wrap', currentThis).hasClass("accordion-active")) {
              e.preventDefault();
              var href = $(this).attr('href');
              clickToggle($('> .accordion-btn-wrap', currentThis));
              //Go to link after delay
              setTimeout(function() {
                window.location = href;
              }, speed)
            }
          })
        }

      });

      var selectedNavAccordion = $(settings.parentElement + '.' + settings.selectedClass + ' > .accordion-btn-wrap', container);

      //Debounced Button height event listener
      var buttonheightResize = debounce(function() {
        //Run button height
        //buttonheight();
        //Expand Selected Channel
        expandSelected();
      }, 250);
      $(window).on('resize', buttonheightResize);

      //Set button heights
      buttonheight();

      //Expand Selected Channel
      expandSelected();

      //On click function
      $(container).on('click', '.accordion-btn-wrap', function(e) {
        e.preventDefault();
        clickToggle(this);
      });


      /* Functions
      *******************************/
        //Click Toggle function
        function clickToggle(element) {
          var nextChild = $(element).next(settings.childElement),
            currentExpandBtn = $('.accordion-expanded', element),
            currentCollapseBtn = $('.accordion-collapsed', element);
          if (nextChild.is(':visible')) {
            nextChild
              .slideUp(settings.slideSpeed);
            $(element)
              .removeClass('accordion-active');
            currentExpandBtn
              .css('display', 'none');
            currentCollapseBtn
              .css('display', 'inline-block');
          } else {
            $(element).closest(settings.childElement).find('.accordion-active')
              .removeClass('accordion-active')
              .next(settings.childElement)
                .slideUp(settings.slideSpeed).prev()
                .find('.accordion-expanded')
                  .css('display', 'none')
                  .parent().find('.accordion-collapsed')
                    .css('display', 'inline-block');
            $(element)
              .addClass('accordion-active');
            nextChild
              .slideToggle(settings.slideSpeed);
            currentExpandBtn
              .css('display', 'inline-block');
            currentCollapseBtn
              .css('display', 'none');
          }
        }

        //Expand Selected Channel Function
        function expandSelected() {
          if (settings.selectedExpand) {
            if (!settings.headersOnlyCheck) {
            selectedNavAccordion.find('.accordion-expanded')
              .css('display', 'inline-block');
            selectedNavAccordion.find('.accordion-collapsed')
              .css('display', 'none');
            selectedNavAccordion.addClass('accordion-active')
              .next(settings.childElement)
                .css('display', 'block');
            } else {
              $(settings.parentElement + '.' + settings.selectedClass + ' > ' + settings.childElement, container)
                .css('display', 'block');
            }
          }
        }

        //Accordion Button Height Function
        function buttonheight() {
          $('.accordion-btn', container).each(function() {
            //Show uls so heights are calculated correctly
            $(settings.parentElement + '.has-subnav > ' + settings.childElement, container)
              .css('display', 'block');

            //Calculate and set heights
            var parentItem = $(this).closest(settings.parentElement),
              lineheight =  $('> a', parentItem).innerHeight();
            $(this)
              .css({'line-height': lineheight + 'px', 'height': lineheight});

            //Hide uls under lis and reset expand/collapse buttons
            $(settings.parentElement + ((settings.headersOnlyCheck) ? ' ' : '.has-subnav > ') + settings.childElement, container)
              .css('display', 'none');
            $('.accordion-expanded')
              .css('display', 'none');
            $('.accordion-collapsed')
              .css('display', 'inline-block');
          })
        }

    });
  }
})(jQuery);

function GridToAvailableHeight() {
    if (typeof isCatalog!='undefined' || typeof isCatalogSearch!='undefined' ) {
     if (isCatalog || isCatalogSearch) {
     jQuery('.product-info-wrapper').height('');
     var elementHeights = jQuery('.product-info-wrapper').map(function() {
        return jQuery(this).height();
      }).get();

      // Math.max takes a variable number of arguments
      // `apply` is equivalent to passing each height as an argument
      var maxHeight = Math.max.apply(null, elementHeights);

      // Set each height to the max height
      jQuery('.product-info-wrapper').height(maxHeight);
      }
    }
}

//mobile cart count function
function updateMobileCartCount() {
    xtotal = +(jQuery('#cartCount').text());
    if (xtotal  > 0 ) {
        jQuery('div.mob-shopping-bag > a > span.bagcount').text('(' + xtotal + ')');
        jQuery('.minicarttotal div.bag strong').text(xtotal);
        setTimeout(
        function() {
            jQuery('.minicarttotal div.bag').css('top', '0');
        }, 750);
    }
}
// Handle RWD
function init() {
  var $win = jQuery(window);
  isMobile = $el.menuIcon && $el.menuIcon.is(':visible');

  if (iscycler) addMarginforCycler();

  if (isMobile && $win.data('wasMobile')===false) {
    //*** Resized from DESKTOP to MOBILE ***

    // Disable add-to-cart overlay on category page
    jQuery('.hover-active .product-block-close a').click();

  } else if (!isMobile && $win.data('wasMobile')===true) {
    //*** Resized from MOBILE to DESKTOP ***

    // Force grid layout on category page
    var $catRows = jQuery('.category-products.by-rows');
    if ($catRows.length) {
      jQuery('.category-products.by-rows').removeClass('by-rows').addClass('by-grid');
      $win.resize();  // Required to reset color slider
    }

    // Cycler (USP)
    if (iscycler) jQuery('#header, .header-container').css('cssText', '')

  }
  
  if(isMobile){
      setTimeout(function() {
        jQuery('.productimages .complete-look-articles-container').remove();
      }, 1000);
  } else {
      setTimeout(function() {
        jQuery('.complete-look-articles-container.onlymobile').remove();
      }, 1000);
  }

  // Breakpoint to toggle mobile banners = 480px
  if (!$win.data('lastWidth')) {
    // First load
    toggleBanners('body.cms-home #hero-banner-carousel', $win.width()<480);
  } else if ($win.width()<480 && $win.data('lastWidth')>=480) {
    // Switch to mobile banners
    toggleBanners('body.cms-home #hero-banner-carousel', true);
  } else if ($win.width()>=480 && $win.data('lastWidth')<480) {
    // Switch to desktop banners
    toggleBanners('body.cms-home #hero-banner-carousel', false);
  }

  $win.data('wasMobile', isMobile);
  setTimeout(function() {
    // Delay is required for reliability
    $win.data('lastWidth', $win.width());
  }, 500);
}

// Initiate color sliders (category page)
function initColorSlider() {
  jQuery('.color-slider').lightSlider({
    auto: false,    // Default: false
    controls: true, // Default: false
    item: 3,        // Default: 3
    loop: false,    // Default: false
    pager: false,   // Default: true
    slideMargin: 4, // Default: 10
    onSliderLoad: function($el) {
      $el.parent().parent().append($el.next('.lSAction').addClass('icons'));
    }
  });
}

function toggleBanners(sSelector, bMobile) {
  var re = bMobile ? /^(.+)\.(gif|jpg|png)$/i : /@mobile/,
    sReplace = bMobile ? '$1@mobile.$2' : '',
    nLoaded = 0,
    nTimer;
  // If bMobile, load mobile banners if available
  // Else load desktop banners
  jQuery(sSelector + ' img').each(function() {
    var $img = jQuery(this),
      sSrcOriginal = this.src,
      sSrc = this.src.replace(re, sReplace);
    $img.on({
      'load': function() {
        // Increment when first banner is loaded
        if ($img.parent().index()===1) ++nLoaded;
      },
      'error': function() {
        // Revert to original image if mobile version doesn't exist
        this.src = sSrcOriginal;
      }
    }).attr('src', sSrc);
  });
  nTimer = setInterval(function() {
    if (nLoaded) {
      // Trigger window resize event to refresh carousel when first banner is loaded (to get correct dimensions)
      jQuery(window).resize();
      clearInterval(nTimer);
    }
  }, 1000);

}

function addMarginforCycler() {
    if (jQuery(window).width() < 768)
          jQuery('#header, .header-container').css('cssText','margin-bottom:41px!important');
    else
        {
          jQuery('#header, .header-container').css('cssText','');
     }
}

jQuery.fn.homeCarouselInit = function(controlStatus){
	//controlStatus = true : Home Page Carousel otherwise Category Page 
	jQuery('#hero-banner-carousel').wrap('<div class="adi-home-main-banner"></div>');
	controlStatus = controlStatus || false ;
        var checkbodyClass = jQuery('body').hasClass('catalog-category-view');
        if(!checkbodyClass){
	jQuery('#hero-banner-carousel').lightSlider({
		auto: true,         // Default: false
		controls: controlStatus,    // Default: false
		item: 1,            // Default: 3
		loop: true,         // Default: false
		pager: true,        // Default: true
		pause: 4000,        // Default: 2000
		pauseOnHover: true, // Default: false
		slideMargin: 0,     // Default: 10
		onSliderLoad: function($el) {
			// Show when ready to prevent FOUC
			$el.css('visibility', 'visible');
			if(controlStatus){
				jQuery('#banner-loader').hide();
			}
			
		}
	});
    }
}
jQuery.fn.updateSaleCategory = function($parentRow){
	jQuery('.menu-section-item a#sale',$parentRow).each(function(){			
		var sale_loc = jQuery(this).attr('href');
		jQuery(this).closest('#sub-menu').append('<li class="menu-section"><h4><a href="'+ sale_loc +'">'+Translator.translate('SALE')+'</a></h4></li>');					
	});
};	
$el.isS3Ajax = false;
function buildMobileMenu(isSubmenu) {
	isSubmenu = isSubmenu || false;
	$el.isS3HomeAjax = isSubmenu;
  // Don't do anything if it's already built
  //if (jQuery('#mobile-menu').length) return;
  var sMenuHtml = '<ul id="mobile-menu">';
  // Build menus
  for (var i=0, imax=aMenus.length; i<imax; ++i) {
    var oMenu = aMenus[i];
    var dividerfinder = oMenu.divider;
    if (dividerfinder==undefined)
        dividerfinder = '';
    else
    {
        if (/divider/i.test(dividerfinder))
        { dividerfinder = 'hasdivider';}
        else
            dividerfinder='';
    }
      var hasitems = '';
      if (oMenu.sections) {
        hasitems='hasitems';
      }
    sMenuHtml += '<li class="menu number' + i + ' ' + dividerfinder + ' ' + hasitems +'"><h3><a href="' + oMenu.url + '">' + oMenu.title + '</a></h3>'

    if (oMenu.sections) {
      sMenuHtml += '<ul id="sub-menu">';
      // Build menu sections
      for (var j=0, jmax=oMenu.sections.length; j<jmax; ++j) {
        var oSection = oMenu.sections[j];
        sMenuHtml += '<li class="menu-section"><h4><a href="' + oSection.url + '">' + oSection.title + '</h4></a>';
        if (oSection.items) {
          sMenuHtml += '<ul>';
			//do not build All -- if url is not defined for ex remove all-featured if url is undefined
			if(typeof(oSection.url) != "undefined"){
				sMenuHtml += '<li class="menu-section-item"><a href="'+ oSection.url +'">'+ Translator.translate('All') + " " +oSection.title + '</a></li>';
			}
          // Build menu section items
          for (var k=0, kmax=oSection.items.length; k<kmax; ++k) {
			if(oSection.items[k].id.length){
				 sMenuHtml += '<li class="menu-section-item"><a href="' + oSection.items[k].url + '" id="'+oSection.items[k].id+'">' + oSection.items[k].title + '</a></li>';
			}else{
				 sMenuHtml += '<li class="menu-section-item"><a href="' + oSection.items[k].url + '">' + oSection.items[k].title + '</a></li>';
			}           
          }
          sMenuHtml += '</ul>';
        }
        sMenuHtml += '</li>';
      }
      sMenuHtml += '</ul>';
    }
    sMenuHtml += '</li>';
  }
  sMenuHtml += '</ul>';
  //Menu getting appended twice - fix
  if(!jQuery('.slider-content.mobile').find('#mobile-menu').length){
	jQuery('.slider-content.mobile').append(sMenuHtml);
	//Adding Sale Link
	jQuery.fn.updateSaleCategory('.slider-content.mobile');
  }
   //Added condition - if element exist than only append
	if(jQuery('#sub-navigation') && !jQuery('#sub-navigation').find('#mobile-menu').length){
		jQuery('#sub-navigation').append(sMenuHtml);
		//Adding Sale Link
		jQuery.fn.updateSaleCategory('#sub-navigation');
	}  
	
  //jQuery('li.hasdivider:not(:last)').append("<hr>");
  //jQuery('li.hasdivider:last').prepend("<hr>");
    var body = document.body,html = document.documentElement;
    //var height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );

    //jQuery('.slider-content.mobile').css('min-height',height);
    jQuery('#mobile-menu li.menu').navAccordion({
        expandButtonText: '<i class="fa fa-plus"></i>',
        collapseButtonText: '<i class="fa fa-minus"></i>'
  });

    var menuElement = jQuery('#mobile-menu li.menu h3 a');
 	var subMenuElement = jQuery('#mobile-menu li.menu li.menu-section h4 a');			
 			
	if(isSubmenu) {		
		menuElement = jQuery('#sub-navigation #mobile-menu li.menu h3 a');		
		subMenuElement = jQuery('#sub-navigation #mobile-menu li.menu li.menu-section h4 a');		
   }		
    menuElement.click(function(e) {
		if (jQuery(this).parent().parent().find('ul').length > 0) {
			e.preventDefault();
		}
		if (!jQuery(this).parent().parent().hasClass('active')) {
				if (jQuery('#mobile-menu li.menu.active').length>0) {
					jQuery('#mobile-menu li.menu.active').removeClass('active').find('.accordion-header-only').slideUp(300);

				}
				jQuery(this).parent().parent().toggleClass('active').find('.accordion-header-only').slideDown(150);

			}
		else
			{
				jQuery(this).parent().parent().toggleClass('active').find('.accordion-header-only').slideUp(150);
				resetInnerNav();
			}
    });

    subMenuElement.click(function(e) {
		if (jQuery(this).parent().parent().find('ul').length > 0) {
			e.preventDefault();
		}
		if (!jQuery(this).parent().parent().hasClass('active')) {
				if (jQuery('#mobile-menu li.menu li.menu-section.active').length>0) {
					jQuery('#mobile-menu li.menu li.menu-section.active').removeClass('active').find('ul').slideUp(300);

				}
				jQuery(this).parent().parent().toggleClass('active').find('ul').slideDown(150);
				jQuery(this).parent().find('accordion-btn-wrap').toggleClass('active-accordion');
				jQuery(this).parent().parent().find('.accordion-btn-wrap .accordion-btn.accordion-collapsed').hide();
				jQuery(this).parent().parent().find('.accordion-btn-wrap .accordion-btn.accordion-expanded').show();

			}
		else
			{
				jQuery(this).parent().parent().toggleClass('active').find('ul').slideUp(150);
				jQuery(this).parent().find('accordion-btn-wrap').toggleClass('active-accordion');
				jQuery(this).parent().parent().find('.accordion-btn-wrap .accordion-btn.accordion-expanded').hide();
				jQuery(this).parent().parent().find('.accordion-btn-wrap .accordion-btn.accordion-collapsed').show();
			}
    });

    function resetInnerNav() {
      jQuery(this).parent().parent().toggleClass('active').find('ul').slideUp(150);
      jQuery(this).parent().parent().find('.accordion-btn-wrap .accordion-btn.accordion-expanded').hide();
      jQuery(this).parent().parent().find('.accordion-btn-wrap .accordion-btn.accordion-collapsed').show();
    }	
}
/*
function initHeroSlider() {
// Initiate homepage/category hero carousel
  jQuery('#hero-banner-carousel').lightSlider({
    auto: true,         // Default: false
    controls: false,    // Default: false
    item: 1,            // Default: 3
    loop: true,         // Default: false
    pager: true,        // Default: true
    pause: 4000,        // Default: 2000
    pauseOnHover: true, // Default: false
    slideMargin: 0,     // Default: 10
    onSliderLoad: function($el) {
      // Show when ready to prevent FOUC
      $el.css('visibility', 'visible');
      jQuery('#banner-loader').hide();
    }
  });
}
*/

jQuery.fn.menuSlideEffect = function(){
	 jQuery('.hasitems h3 a').click(function() {
		  if (jQuery(this).parent().parent().hasClass('active')) {
				jQuery('.slider-content').css("z-index", "998");
				jQuery('html, body').animate({
					scrollTop: jQuery(this).offset().top-65			
				  }, 500, 'swing');
				console.log('Swing');
		  }
		  else
		  {
				jQuery('html, body').animate({
					scrollTop: jQuery('body').offset().top
				  }, 500, 'swing');
		  }
	});
 }
 
// NOTE: Consolidate everything in one .ready()

jQuery(document).ready(function() {
	//Homepage Html from s3 - Start
	if (jQuery('#home-static-content').length) {
		jQuery.ajax({ 
			url: homehtmlurl, 
			success: function(data) {
				jQuery(data).insertAfter('#home-static-content');
				//initHeroSlider();
				jQuery.fn.homeCarouselInit(true);
				buildMobileMenu(true);
				jQuery.fn.menuSlideEffect();
                                if(jQuery(window).width() < 768){
 					toggleBanners('body.cms-home #hero-banner-carousel', true);
 				}
			}
		});
	}
  // Cache elements
  $el.header = jQuery('#header');
  $el.menuIcon = jQuery('#navigation-slide-icon');
  $el.cycler = jQuery('.cta-cycler');
  $el.searchbox = jQuery('.searchfield-wrapper.mobile');
  // safari touch active styling enabled
  document.addEventListener("touchstart", function(){}, true);
  // Initiate
  init();
	
  if (iscycler && isMobile)
      {
          addMarginforCycler();
          cyclerstart();
      }

     //check and resize every product wrap element

    if (typeof isCatalog != 'undefined' || typeof isCatalogSearch != 'undefined') {
        if (isCatalog || isCatalogSearch) {
           setTimeout(function() {GridToAvailableHeight();}, 2000);
               jQuery('.btn-group button').click(function() {
               GridToAvailableHeight();
           });
    }
    }

   // Encapsulate megamenu into an object
  // NOTE: We do not need to capture the "shop all" links below each menu
  // section because they can be constructed from section.title and section.url

    //generate divider before mobile creates the mobile structure
	//updated for Thai Cat name
    var dskDivider = '<li class="separator desktop" style="display:inline-block"></li>';
	jQuery('#nav ul li.mm-item:nth-child(4)').append(divider);
    jQuery('#customMenu').prepend(divider);

    //generate menu-separator for desktop
  jQuery(dskDivider).insertAfter(jQuery('#nav ul li.mm-item:nth-child(4)'));
  jQuery(dskDivider).insertBefore(jQuery('#customMenu'));

  jQuery('#nav > ul.megamenu > li.mm-item').each(function(i) {
    // Loop through menus
    var $menu = jQuery(this);
    aMenus[i] = {};
    aMenus[i].title = jQuery.trim($menu.children('a').text());
    aMenus[i].url = $menu.children('a').attr('href');
    aMenus[i].divider = $menu.children('img').attr('src');
    aMenus[i].sections = [];  // Array of sections

    jQuery('.cateNaviLink-head', $menu).each(function(j) {
      // Loop through sections in the menu
      var $section = jQuery(this);
      aMenus[i].sections[j] = {};  // Section object
      aMenus[i].sections[j].title = jQuery.trim($section.text());
      aMenus[i].sections[j].url = jQuery('a', $section).attr('href');
      aMenus[i].sections[j].items = [];  // Array of items
      $section.nextUntil('.cateNaviLink-head', '.cateNaviLink').each(function(k) {
        // Loop through menu items in each section
        var $item = jQuery(this);
        aMenus[i].sections[j].items[k] = {};  // Item object
        aMenus[i].sections[j].items[k].title = jQuery.trim($item.find('a').text());
        aMenus[i].sections[j].items[k].url = $item.find('a').attr('href');
		aMenus[i].sections[j].items[k].id='';
		if(typeof $item.find('a').attr('id') != 'undefined'){
			aMenus[i].sections[j].items[k].id = $item.find('a').attr('id');
		}
		
      });
      // Add any section banners to the section object
      if ($section.next('a').length) aMenus[i].sections[j].image = $section.next('a').find('img').attr('src');
    });
    // Clean up if a menu has no sections
    if (!aMenus[i].sections.length) delete aMenus[i].sections;
  });

	// Build mobile menu
	buildMobileMenu();

	

  // Initiate homepage/category hero carousel
  /*jQuery('#hero-banner-carousel').lightSlider({
    auto: true,         // Default: false
    controls: false,    // Default: false
    item: 1,            // Default: 3
    loop: true,         // Default: false
    pager: true,        // Default: true
    pause: 4000,        // Default: 2000
    pauseOnHover: true, // Default: false
    slideMargin: 0,     // Default: 10
    onSliderLoad: function($el) {
      // Show when ready to prevent FOUC
      $el.css('visibility', 'visible');
    }
  });*/	
	if(jQuery('.cms-index-index').length){
		jQuery.fn.homeCarouselInit(true);
	}else{
		jQuery.fn.homeCarouselInit();
	}
	
	

  // Initiate color sliders (category page)
  initColorSlider();

  // Close overlay on clicking shadow
  jQuery('.hidden-pop-up, .location-modal-overlay, .pick-up-in-store-faq-overlay').click(function(e) {
    jQuery('.ui-dialog-titlebar-close, .ui-dialog-titlebar-close-icon, .ui-dialog-titlebar-close-notify').click();
  });

  //clone and mobile search functionality
  jQuery('#search-box-button').click(function() {
  if (!jQuery('.searchfield-wrapper #search_mini_form').length>0) {
  jQuery('.navigation-main-wrapper a#search-box-button').toggleClass('active');
//  jQuery('#search_mini_form').clone().appendTo('.searchfield-wrapper.mobile');
  jQuery('.searchfield-wrapper #top-search,.searchfield-wrapper .form-search p').remove();
  jQuery('.searchfield-wrapper .close.searchslide').remove();

  jQuery('.searchfield-wrapper .menuSlideWrapper .slideWrapper').removeClass('slideWrapper');
  jQuery('.searchfield-wrapper').show();

  jQuery('.searchfield-wrapper .menuSlideWrapper').slideDown(480,'swing');
  jQuery('.searchfield-wrapper input#search').focus();
  //initialize search button submission
  jQuery('.searchfield-wrapper .searchIcon').click(function() {
    if (!jQuery('.searchfield-wrapper input#search').val()=='') {
    jQuery('.searchfield-wrapper #search_mini_form').submit();
    }
    else
    {
    console.log('must have data to search...');
    }
  });
  }
  else
  {
      if (jQuery('.navigation-main-wrapper a#search-box-button').hasClass('active')) {
            jQuery('.navigation-main-wrapper a#search-box-button').toggleClass('active');
            jQuery('.searchfield-wrapper .menuSlideWrapper, .searchfield-wrapper').slideUp(300,'swing');
      }
      else {
            jQuery('.navigation-main-wrapper a#search-box-button').toggleClass('active');
            jQuery('.searchfield-wrapper').show();
            jQuery('.searchfield-wrapper .menuSlideWrapper').slideDown(480,'swing');
            jQuery('.searchfield-wrapper input#search').focus();
      }
  }
  });

//hamburger functionality

  jQuery('#icon-hamburger,.navigation-icon').click(function() {
      //check transition function
      jQuery(this).toggleClass('active');
	  jQuery('.slider-content.mobile').css('display','block');

      if (jQuery('#icon-hamburger').hasClass('active')) {
         scrollable=false;
          jQuery('.slider-content').css('left','0');
		  jQuery('.langswitcher').css('left','0');
          //jQuery('.menu-overlay').css('min-height', jQuery('.slider-content').height()).show();
          jQuery('html, body').animate({ scrollTop: 0 }, 0);
          jQuery('#footer, .footer-bot-bar, .footer-container, #sub-navigation,.col-main').hide();
      }
      else {
          var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend';
          if (iscycler) {
          jQuery('.cta-cycler').fadeIn(100);
          }
          jQuery('.slider-content').css('left','-100%');
		  jQuery('.langswitcher').css('left','-100%');
          jQuery('.slider-content').one(transitionEnd, function(event) {


          });
          jQuery('.menu-overlay').fadeOut();
          scrollable=true;
          jQuery('#footer, .footer-bot-bar, .footer-container, #sub-navigation, .col-main').show();
      }
  });
  // detect height 100% width of menu and add to current height of slide bar to ensure that no gap is showing up.
  jQuery('.slider-content .accordion-btn-wrap').click(function() {
     jQuery('.slider-content').css('cssText', 'left:0px!important');
     setTimeout(function() {
         var getHeight = jQuery('#mobile-menu').height();
         jQuery('.slider-content').css('cssText', 'height:calc(100% + ' + getHeight + 'px)!important;left:0px!important');
         jQuery('.slider-content li.menu.hasitems.active').click(function() {
            jQuery('.slider-content').css('cssText', 'left:0px!important');
         });
     }, 100);

 });
	jQuery.fn.menuSlideEffect();
 
    //login page mobile related javascripts
  if (typeof isloginpage != 'undefined') {
      if (isloginpage) {
          jQuery('.customer-account-login .account-login .content h2').append('<span><i></i></span>');
          jQuery('.registered-users h2 i').click(function() {
              jQuery('.registered-users .details').slideToggle();
              jQuery('.registered-users h2').toggleClass('active');
          });
          jQuery('.new-users h2 i').click(function() {
              jQuery('.new-users .details').slideToggle();
                jQuery('.new-users h2').toggleClass('active');
          });
      }
  }
  if (typeof isaddressbook != 'undefined') {
      if (isaddressbook) {
      }

  }

  //responsive tables from zurb foundation
  var switched = false;
  var updateTables = function() {
    if ((jQuery(window).width() < 951) && !switched ) {
      switched = true;
      jQuery("table.responsive").each(function(i, element) {
        splitTable(jQuery(element));
      });
      return true;
    }
    else if (switched && (jQuery(window).width() > 951)) {
      switched = false;
      jQuery("table.responsive").each(function(i, element) {
        unsplitTable(jQuery(element));
      });
    }
  };

  jQuery(window).load(updateTables);
  jQuery(window).on("redraw",function(){switched=false;updateTables();}); // An event to listen for
  jQuery(window).on("resize", updateTables);

  function splitTable(original)
  {
    original.wrap("<div class='table-wrapper' />");

    var copy = original.clone();
    copy.find("td:not(:first-child), th:not(:first-child)").css("display", "none");
    copy.removeClass("responsive");

    original.closest(".table-wrapper").append(copy);
    copy.wrap("<div class='pinned' />");
    original.wrap("<div class='scrollable' />");

    setCellHeights(original, copy);
  }

  function unsplitTable(original) {
    original.closest(".table-wrapper").find(".pinned").remove();
    original.unwrap();
    original.unwrap();
  }

  function setCellHeights(original, copy) {
    var tr = original.find('tr'),
        tr_copy = copy.find('tr'),
        heights = [];

    tr.each(function(index) {
      var self = jQuery(this),
          tx = self.find('th, td');

      tx.each(function() {
        var height = jQuery(this).outerHeight(true);
        heights[index] = heights[index] || 0;
        if (height > heights[index]) heights[index] = height;
      });

    });

    tr_copy.each(function(index) {
      jQuery(this).height(heights[index]);
    });
  }

  if (typeof ismyaccountpages != 'undefined') {
    if (ismyaccountpages) {
        jQuery('.col-left.sidebar').addClass('desktop').clone().insertAfter('.page-title').addClass('mobile-menu').addClass('mobile').removeClass('desktop').hide();
        jQuery('.my-account .page-title h1').click(function() {
            if(jQuery('.desktop').css('display')=='none'){
                jQuery('.my-account .col-left.sidebar.mobile-menu').slideToggle();
                jQuery('.page-title h1').toggleClass('active');
            }
        });
    }
  }
    //Mobile Language Selector
    jQuery.fn.initMobLanguageSelector();
}); // END .ready()
jQuery.fn.initMobLanguageSelector = function(){
    if(langSelectorFlag && !is_checkoutPage){
        var $targetLs = jQuery('.header-lg-selector');
        var $mobParent = jQuery('.mobile-language-swatcher .mob-lang-swatch-wrapper');
        //clone for mobile
        $targetLs.clone(true).appendTo($mobParent);
        
        var targetSwatcher = jQuery('.header-lg-selector > a',$mobParent);
        var lgSelector = jQuery('.lg-selector',$mobParent);
        targetSwatcher.live('click',function(e){
            e.preventDefault();
            var $this = jQuery(this);
            $this.toggleClass('expanded');
            lgSelector.slideToggle();
        });       
    }
}


//create condition if cycler should be shown.
function cyclerstart()  {
if (typeof iscycler != 'undefined') {
    (function() {
        var cta= jQuery(".cta-cycler ul li");
        var ctaIndex = -1;

        function showNextcta() {
            ++ctaIndex;
            cta.eq(ctaIndex % cta.length)
                .fadeIn(1000)
                .delay(1000)
                .fadeOut(1000, showNextcta);
        }
        showNextcta();
    })();
    }

if (typeof iscycleroverlay != 'undefined') {
    jQuery('.cta-cycler').click(function() {
        jQuery('.cta-overlay').fadeIn(1000);
    });
    jQuery('.cta-overlay .close, .cta-overlay .btn-close').click(function() {
        jQuery('.cta-overlay').fadeOut(1000);
    });
 }
}

// Set scroll position
jQuery(window).data('lastScroll', jQuery(window).scrollTop());
var scrollable=true;

//Handle PDP Zoom

// Handle PDP lightGallery close button getting hidden behind mobile menu
jQuery.fn.updateZoomActionIconTop = function(menuCollapseFlag){
	var pdpLGZoom = jQuery('.catalog-product-view .lg-start-zoom') ? jQuery('.catalog-product-view .lg-start-zoom') : "";	
	if(pdpLGZoom.length){
		menuCollapseFlag ? pdpLGZoom.addClass('top-collapsed') : pdpLGZoom.removeClass('top-collapsed') ;
	}
}

jQuery(window).scroll(function() {
	if (isMobile) {
    if (scrollable) {
      var $this = jQuery(this),
        nScrollTop = $this.scrollTop();
      if (nScrollTop < $this.data('lastScroll')) {
        $el.header.removeClass('collapsed');
        if (iscycler) $el.cycler.removeClass('collapsed');
        $el.searchbox.removeClass('collapsed');
        jQuery('body').removeClass('collapsed');		
      } else if (nScrollTop > 99) {
        $el.header.addClass('collapsed');
        if (iscycler) $el.cycler.addClass('collapsed');
        $el.searchbox.addClass('collapsed');
        jQuery('body').addClass('collapsed');		
      }
	  jQuery.fn.updateZoomActionIconTop($el.header.hasClass('collapsed'));
	  $this.data('lastScroll', nScrollTop);
    }
  }
});

jQuery(window).smartResize(init);