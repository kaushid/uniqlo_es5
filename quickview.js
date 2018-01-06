//unminified/quickview.js

'use strict';
var SPEC_DEBUG = 0;

if (!window.$qv)
    var $qv = {};

var qvJsonUrl = '//' + urlS3 + '.s3.amazonaws.com/json/';
var qvInventoryFetchUrl = qViewInventoryFetchUrl;
var qvStoreId = qViewStoreId;

$qv.popup = jQuery('#quickview-popup');
$qv.scriptWrapper = jQuery('#qv-scripts');
$qv.infoWrapper = jQuery('#quickview-prodinfo');
$qv.popup = jQuery('#quickview-popup');
$qv.qtyAvailability = jQuery('.quickview-addToCart #qtyAvail');
$qv.qtyOption = jQuery('#qvQtyOptions');
$qv.selectedQtyValue = jQuery('#qvQty');
$qv.stockInfo = jQuery('#stockInfo');
$qv.colorThumbnailImgWrapper = jQuery('#qvThumbnails');
$qv.largeImageWrapper = jQuery('#qvLargeImage');
$qv.zoomImageWrapper = jQuery('#qvZoomImage');
$qv.carouselLoader = jQuery('.quickview-carousel-loader');

var qv_colorArray = [], qv_noInventoryColorArray = [];
var qv_sizeArray = [], qv_sortedSizeArray = [], qv_consolidatedSizes = {};
var qv_lengthArray = [], qv_consolidatedLength = {};
var colorTempPromiseArray = [];
var swatch = 'catalog/product/swatch_image/noswatch.jpg', largeimage = 'catalog/product/swatch_image/noswatch.jpg', zoomimage = 'catalog/product/swatch_image/noswatch.jpg';


var carouselThumbAvailableImages = [];
// to sort sizes
function compare(a, b) {
    return parseInt(a.label) - parseInt(b.label);
}
/*Sorting Functions*/
// Sort numbers low to high (used by sortUnique())
function ascendNumeric(a, b) {
    var nA = parseFloat(a.label),
            nB = parseFloat(b.label);
    if (isNaN(nA) || isNaN(nB)) {
        nA = a;
        nB = b;
    }
    return nA === nB ? 0 : nA < nB ? -1 : 1;
}

// Remove duplicates and sort
function sortUnique(a, aRef) {
    return a.filter(function (s, i) {
        return (s && a.indexOf(s) === i);
    }).sort((aRef instanceof Array) ? function (a, b) {
        // Sort by reference string array
        var nA = aRef.indexOf(a),
                nB = aRef.indexOf(b);
        if (nA > -1 && nB > -1)
            return nA - nB;
        else
            return ascendNumeric(a, b);
    } : ascendNumeric);
}
/*Sorting Functions*/

function showQVPopup(popupflag) {
    if (popupflag) {
        $qv.popup.show();
        jQuery('body').addClass('no-scroll');
    } else {
        $qv.popup.hide();
        jQuery('body').removeClass('no-scroll');
        jQuery('.quickView').removeClass('clicked');
        jQuery('#qvLargeImage').show();
        jQuery('#qvZoomImage').hide();
    }
}
function initQuickViewModelCloseEvent() {
    $qv.popup.click(function (e) {
        var $target = jQuery(e.target);
        if ($target.closest('.quickview-content-wrapper').length) {
            if ($target.hasClass('quickview-close') || $target.parent().hasClass('quickview-close')) {
                showQVPopup(false);
            } else {
                return;
            }
        } else if ($target.hasClass('quickview-popup')) {
            showQVPopup(false);
        }
    });
    jQuery('body').keyup(function (e) {
        if (e.which === 27) {
            showQVPopup(false);
        }
    });
}

function getAjaxProdJsonData(modelCode) {
    if (SPEC_DEBUG)
        console.log('###Getting Product Json Data');
    return jQuery.getJSON(qvJsonUrl + modelCode + '.json');
}

function getAjaxProdInventoryJsonData(prodId, modelCode) {
    if (SPEC_DEBUG)
        console.log('###Getting Product Inventory Json Data');
    return jQuery.ajax({
        url: qvInventoryFetchUrl,
        type: 'GET',
        data: 'pid=' + prodId + '&model=' + modelCode + '&store=' + qvStoreId,
        dataType: 'json'
    });
}

function getQuickViewAllProdData(prodId, modelCode) {
    if (SPEC_DEBUG)
        console.log('###Getting Product Json + Inventory Json to append');
    jQuery.when(
            getAjaxProdJsonData(modelCode),
            getAjaxProdInventoryJsonData(prodId, modelCode)
            ).then(initQuickView);
}

function getQuickViewInventoryData(prodId, modelCode) {
    if (SPEC_DEBUG)
        console.log('###Getting Product Inventory Json to update');
    jQuery.when(
            getAjaxProdInventoryJsonData(prodId, modelCode)
            ).then(updateQuickView);
}
function loadImages(arrImagesSrc, colorKey) {
    return new Promise(function (resolve, reject) {
        var arrImages = [];
        function _loadImage(src, arr, imageImdex) {
            var img = new Image();
            img.onload = function () {
                //arr.push([src, img]);
                /* pushing imageindex that can be useful for sorting as order of final is not maintained 
                 * due to asynchronous nature of image loading
                 */
                //arr.push([src, imageImdex]);
                arr.push({
                    imageUrl: src,
                    imageIndex: imageImdex
                });
            };
            img.onerror = function () {
                //arr.push([src, null]);
                arr.push({
                    imageUrl: src,
                    imageIndex: null
                });
            };
            img.src = src;
        }
        arrImagesSrc.forEach(function (src, imageImdex) {
            _loadImage(src, arrImages, imageImdex);
        });
        var interval_id = setInterval(function () {
            if (arrImages.length == arrImagesSrc.length) {
                clearInterval(interval_id);
                var colObj = {
                    'arrImages': arrImages,
                    'colorKey': colorKey
                };
                resolve(colObj);
            }
        }, 300);
    });
}
var isDomHasClassCheck = function (domElem, className) {
    return new Promise(function (resolve, reject) {
        function recallUntil() {
            var intervalValue = setInterval(function () {
                if (jQuery(domElem).length > 0 && jQuery(domElem).hasClass(className)) {
                    clearInterval(intervalValue);
                    resolve($(domElem));
                }
                /*else {
                 recallUntil();
                 }*/
            }, 300);
        }
        recallUntil();
    });
};
function getImageFullUrl(targetImageArr) {
    var targetImageArrObj = targetImageArr;
    targetImageArrObj = jQuery.map(targetImageArrObj, function (item) {
        return baseMediaPath + item;
    });
    return targetImageArrObj;
}
jQuery.fn.resetZoom = function () {
    jQuery('#qvZoomImage').hide();
    jQuery('#qvLargeImage').show();
    jQuery('.zoomImage-draggable .draggable', $qv.zoomImageWrapper).removeAttr("style");
};
jQuery.fn.initZoomImage = function (targetLargeImage) {
    var zoomImage = targetLargeImage.attr('data-zoomimage');
    jQuery('.zoomImage-draggable', $qv.zoomImageWrapper).html('<img class="draggable ui-draggable" defaulttop="430px" defaultleft="215px" src="' + zoomImage + '"/>');
    jQuery('.zoomImage-draggable .draggable', $qv.zoomImageWrapper).draggable({
        start: function (event, ui) {
            jQuery('#prodImgZOOMTooltip').hide();
        }}
    );
    jQuery('#qvLargeImage').hide();
    jQuery('#qvZoomImage').show();

};
jQuery.fn.updateLargeImage = function (target) {
    jQuery.fn.resetZoom();
    var imageSrc = jQuery('a', target).data('largeimage');
    var zoomSrc = jQuery('a', target).data('zoomimage');
    $qv.zoomImageWrapper.html('');
    $qv.largeImageWrapper.html('');
    $qv.largeImageWrapper.append('<div class="largeImageWrapper" data-zoomimage="' + zoomSrc + '"></div>');
    var zoomWrapperHtml = '<div class="zoomImage-draggable-wrapper">';
    zoomWrapperHtml += '<div id="prodImgZOOMBack"><span>' + Translator.translate('Back') + '</span><span class="arrow"></span></div>';
    zoomWrapperHtml += '<div id="prodImgZOOMTooltip"><span>' + Translator.translate('Click and Drag') + '</span></div>';
    zoomWrapperHtml += '<div class="zoomImage-draggable"></div>';
    zoomWrapperHtml += '</div>';
    $qv.zoomImageWrapper.append(zoomWrapperHtml);
    jQuery('.largeImageWrapper', $qv.largeImageWrapper).html('');
    jQuery('.largeImageWrapper', $qv.largeImageWrapper).append('<img title="' + Translator.translate('Click To Zoom') + '" src="' + imageSrc + '"/>');
    jQuery('.largeImageWrapper', $qv.largeImageWrapper).click(function () {
        jQuery.fn.initZoomImage(jQuery(this));
    });
    jQuery('#prodImgZOOMBack').click(function () {
        jQuery.fn.resetZoom();
    });
};
jQuery.fn.updatePrice = function (colorCode, sizeCode, lengthCode) {
    var priceHtml = '';
    jQuery('.qview-pricebox').html('');
    var allSizes = $qv.allColors[colorCode].size;
    var sizeObj = "";
    if (lengthCode === undefined) {
        sizeObj = allSizes[sizeCode];
    } else {
        var lengthObj = allSizes[sizeCode]['length'];
        sizeObj = lengthObj[lengthCode];
    }
    if ((sizeObj.special_price !== undefined) && sizeObj.special_price !== null) {
        priceHtml += '<p class="old-price"><span class="price" id="old-price">' + qvPriceSymbol + sizeObj.price + '</span></p>';
        priceHtml += '<p class="special-price sp-rc-price"><span class="price" id="product-price">' + qvPriceSymbol + sizeObj.special_price + '</span></p>';
    } else {
        priceHtml += '<p class="special-price"><span class="price" id="product-price">' + qvPriceSymbol + sizeObj.price + '</span></p>';
    }
    jQuery('.qview-pricebox').html(priceHtml);
};
function buildColorThumbnailModelScriptHtml(prodJson, modelCode) {
    colorTempPromiseArray = [];
    return new Promise(function (resolve, reject) {
        var colorObj = prodJson; //prodJson['color'];
        var colorKeys = Object.keys(colorObj);
        for (var i = 0; i < colorKeys.length; i++) {
            var largeImages = colorObj[colorKeys[i]]['image']['thumbnail'];
            largeImages = getImageFullUrl(largeImages);
            loadImages(largeImages, colorKeys[i]).then(function (largeAvailableImagesArrObj) {
                //Promise code to ensure that carousel html is appended only once all the image availability are checked 
                var largeAvailableImagesArr = largeAvailableImagesArrObj.arrImages;
                //Sorting the asynchronously obtained largeimage array based on imageIndex
                largeAvailableImagesArr.sort(function (item1, item2) {
                    if (item1.imageIndex < item2.imageIndex)
                        return -1;
                    if (item1.imageIndex > item2.imageIndex)
                        return 1;
                    return 0;
                });
                var colorKey = largeAvailableImagesArrObj.colorKey;
                colorTempPromiseArray.push(colorKey);
                var index = 0;
                var colorHtml = "";
                colorHtml += '<div class="prodCarouselHtml prodCarouselHtml' + colorKey + '" data-colorcode="' + colorKey + '" >';
                for (var i = 0; i < largeAvailableImagesArr.length; i++) {
                    var arrObj = largeAvailableImagesArr[i];
                    if (arrObj.imageIndex !== null) {
                        var largeImage = arrObj.imageUrl.replace('thumbnail_image', 'large_image');
                        var zoomImage = largeImage.replace('large_image', 'zoom_image');
                        colorHtml += '<div class="qvThumbItem" data-index="' + arrObj.imageIndex + '">';
                        colorHtml += '<a data-zoomimage="' + zoomImage + '" data-largeimage="' + largeImage + '">';
                        colorHtml += '<img src="' + arrObj.imageUrl + '"/></a>';
                        colorHtml += '</div>';
                        index++;
                    }
                }
                colorHtml += '</div>';
                jQuery('#script-' + modelCode).append(colorHtml).addClass('colorCarouselHtmlAppended');
            });
        }
        var interval_id = setInterval(function () {
            if (colorKeys.length === colorTempPromiseArray.length) {
                clearInterval(interval_id);
                resolve("colorAppended");
            }
        }, 100);
    });
}

function initQuickView(prodData, inventoryData) {
    if (SPEC_DEBUG)
        console.log('###InitQuickView Called');
    var prodDataResponse = prodData[0];         // promise object response so data[0]
    var inventoryResponse = inventoryData[0];   // promise object response so data[0]   
    var clickModelCodeVal = jQuery('.quickView.clicked').data('modelcodevalue');
    var currentActiveQuickViewItem = jQuery('.quickView.clicked').closest('.category-products .item');
    var modelScript = '';
    if (!jQuery('#script-' + clickModelCodeVal).length) {
        var modelScript = '<div style="display:none !important;" id="script-' + clickModelCodeVal + '">';
        /*Static Data that can be grabbed from current Category Product*/
        if (jQuery(".tag", currentActiveQuickViewItem).length) {
            modelScript += jQuery('<div/>').append(jQuery(".tag", currentActiveQuickViewItem).clone()).html();
        }
        modelScript += jQuery('<div/>').append(jQuery('.product-name', currentActiveQuickViewItem).clone()).html();
        /* By default the price-box is the cloned Category product pricebox
         * This is updated for each #script-modelCodeValue on clicking on the size/length for particular color 
         */
        modelScript += jQuery('<div/>').append(jQuery('.price-box', currentActiveQuickViewItem).clone()).html();
        /*JSON ajax data*/
        var prodUrl = jQuery('.product-image', currentActiveQuickViewItem).attr('href');
        modelScript += '<div class="prod-url" data-prodUrl="' + prodUrl + '"></div>';
        modelScript += '<div class="prodOptions">' + JSON.stringify(prodDataResponse.result) + '</div>';
        modelScript += '<div class="inventoryOptions">' + JSON.stringify(inventoryResponse) + '</div>';
        modelScript += '</div>';
        $qv.scriptWrapper.append(modelScript);
    }
    showQuickViewPopup(clickModelCodeVal);
}
function updateQuickView(upDatedInventoryData) {
    if (SPEC_DEBUG)
        console.log('###UpdateQuickView Called');
    var upDatedInventoryResponse = upDatedInventoryData;
    var clickModelCodeVal = jQuery('.quickView.clicked').data('modelcodevalue');
    var modelScriptTag = jQuery('#script-' + clickModelCodeVal);
    if (modelScriptTag.length) {
        var inventroyOptionScriptHtml = jQuery('.inventoryOptions', modelScriptTag);
        inventroyOptionScriptHtml.html('');
        inventroyOptionScriptHtml.html(JSON.stringify(upDatedInventoryResponse));
        inventroyOptionScriptHtml.addClass('updatedInventory');
    }
    showQuickViewPopup(clickModelCodeVal);
}
function populateColorSizeLengthArray(modelCode) {
    $qv.prodOption = "", $qv.inventoryOptions = "", $qv.inventoryQtyOption = "", $qv.allColors = "";
    qv_colorArray = [];
    qv_noInventoryColorArray = [];
    qv_sizeArray = [];
    qv_sortedSizeArray = [];
    qv_lengthArray = [];
    qv_consolidatedSizes = {};
    qv_consolidatedLength = {};

    var modelScript = jQuery('#script-' + modelCode);
    $qv.prodOption = jQuery.parseJSON(modelScript.find('.prodOptions').text());
    $qv.inventoryOptions = jQuery.parseJSON(modelScript.find('.inventoryOptions').text());
    $qv.inventoryQtyOption = jQuery.parseJSON($qv.inventoryOptions['qtys']);
    $qv.allColors = $qv.prodOption.color;
    $qv.isLengthOptionEnabled = false;
    jQuery.each($qv.allColors, function (colorIndex, colorItem) {
        var colorInventory = $qv.inventoryQtyOption['options'];
        /* Only insert colors which have inventory 
         * In case we have a consolidated qty as 0 meaning none of the colors have any inventory
         * we are pushing it in "qv_noInventoryColorArray" , so that we can atleast show the colors but will make them disabled
         * */
        // check if color code from json exist in inventory json too            
        if (colorInventory[colorIndex] !== undefined && $qv.allColors[colorIndex] !== undefined) {
            if (colorInventory !== undefined && colorInventory[colorIndex] !== undefined && colorInventory[colorIndex].qty > 0) {
                qv_colorArray.push(colorItem.code);
            } else if (!$qv.inventoryOptions.consolidatedQty) {
                qv_noInventoryColorArray.push(colorItem.code);
            }

            /*
             * For size and length we are not checking any inventory
             * Inventory check will be done in the later part of code execution during (click & mousehover ) event binding
             */
            var colorSizeOption = colorItem.size;
            if (colorSizeOption !== undefined) {
                jQuery.each(colorSizeOption, function (sizeIndex, sizeItem) {
                    if (sizeItem.value && (jQuery.inArray(sizeItem.value, qv_sizeArray) < 0)) {
                        qv_sizeArray.push(sizeItem.value);
                        if (sizeItem.label === "No Control" || sizeItem.label === "no control") {
                            qv_consolidatedSizes[sizeItem.value] = "One Size";
                        } else {
                            qv_consolidatedSizes[sizeItem.value] = sizeItem.label;
                        }

                    }
                    var lengthOption = sizeItem['length'];
                    var noLengthOptionCheck = Array.isArray(lengthOption) && (lengthOption.length === 0);
                    if (lengthOption !== undefined && !noLengthOptionCheck) {
                        $qv.isLengthOptionEnabled = true;
                        jQuery.each(lengthOption, function (lengthIndex, lengthItem) {
                            if (lengthItem.value && (jQuery.inArray(lengthItem.value, qv_lengthArray) < 0)) {
                                qv_lengthArray.push(lengthItem.value);
                                qv_consolidatedLength[lengthItem.value] = lengthItem.label;
                            }
                        });
                    }
                });
            }
        }
    });
    qv_sortedSizeArray = sortUnique(qv_sizeArray, qvSizeOrderConfig);
    /* 
     * $qv.colorSizeAvailabilityObj - stores all the available color-to-size 2 way mapping 
     * that will be used for color and size event binding(click & mousehover)
     * 
     * $qv.sizeLengthAvailabilityObj - stores all the available size-to-length 2 way mapping
     * that will be used for length and size event binding(click & mousehover)
     */
    $qv.colorSizeAvailabilityObj = {
        "color": {},
        "size": {}
    };
    var qtyOptions = $qv.inventoryQtyOption['options'];
    jQuery.each(qtyOptions, function (colorCode, sizeOptionCodeObj) {
        if (sizeOptionCodeObj.qty > 0) {
            var sizeCodeArr = Object.keys(sizeOptionCodeObj);
            $qv.colorSizeAvailabilityObj.color[colorCode] = [];
            for (var i = 0; i < sizeCodeArr.length; i++) {
                if (sizeCodeArr[i] !== 'qty') {
                    if (parseInt(qtyOptions[colorCode][sizeCodeArr[i]].qty)) {
                        var ifSizeExist = jQuery.inArray(sizeCodeArr[i], $qv.colorSizeAvailabilityObj.color[colorCode]);
                        if (ifSizeExist < 0) {
                            $qv.colorSizeAvailabilityObj.color[colorCode].push(sizeCodeArr[i]);
                        }
                        //populating size with all available color array
                        if ($qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]] === undefined) {
                            $qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]] = [];
                            $qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]].push(colorCode);
                        } else {
                            var ifColorExist = jQuery.inArray(colorCode, $qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]]);
                            if (ifColorExist < 0) {
                                $qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]].push(colorCode);
                            }
                        }
                    } else {
                        if ($qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]] === undefined) {
                            $qv.colorSizeAvailabilityObj.size[sizeCodeArr[i]] = [];
                        }

                    }
                }
            }
        }
    });
    if ($qv.isLengthOptionEnabled) {
        $qv.sizeLengthAvailabilityObj = {
            "size": {},
            "slength": {}
        };
        jQuery.each(qtyOptions, function (colorCode, sizeOptionCodeObj) {
            if (sizeOptionCodeObj.qty > 0) {
                var sizeCodeArr = Object.keys(sizeOptionCodeObj);
                for (var i = 0; i < sizeCodeArr.length; i++) {
                    if (sizeCodeArr[i] !== 'qty') {
                        if ($qv.sizeLengthAvailabilityObj.size[sizeCodeArr[i]] === undefined) {
                            //Create or declare array for each respective size available
                            $qv.sizeLengthAvailabilityObj.size[sizeCodeArr[i]] = [];
                        }
                        var lengthObj = sizeOptionCodeObj[sizeCodeArr[i]];
                        var lengthKeys = Object.keys(lengthObj);
                        for (var j = 0; j < lengthKeys.length; j++) {
                            if (lengthKeys[j] !== 'qty') {
                                if (parseInt(lengthObj[lengthKeys[j]].qty)) {
                                    // check if the length code already exist to the respective size array
                                    var ifLengthExist = jQuery.inArray(lengthKeys[j], $qv.sizeLengthAvailabilityObj.size[sizeCodeArr[i]]);
                                    if (ifLengthExist < 0) {
                                        // avoid repetation if lengthCode , only push if it's not previously existing
                                        $qv.sizeLengthAvailabilityObj.size[sizeCodeArr[i]].push(lengthKeys[j]);
                                    }
                                    // code to add the corresponding mapped sizes inside the length object 
                                    if ($qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]] === undefined) {
                                        $qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]] = [];
                                        $qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]].push(sizeCodeArr[i]);
                                    } else {
                                        var ifSizeExist = jQuery.inArray(sizeCodeArr[i], $qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]]);
                                        //console.log(ifExist + ' '+sizeCodeArr[i]);
                                        if (ifSizeExist < 0) {
                                            $qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]].push(sizeCodeArr[i]);
                                        }
                                    }
                                } else {
                                    // even if qty dont exist still declare an empty array
                                    if ($qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]] === undefined) {
                                        $qv.sizeLengthAvailabilityObj.slength[lengthKeys[j]] = [];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}
function appendColorSwatches() {
    if (SPEC_DEBUG)
        console.log('### Appending Color Swatches');
    var colorObjArray = "";
    var noInventoryFlag = 'inventory';
    if (qv_colorArray.length) {
        colorObjArray = qv_colorArray;
        noInventoryFlag = 'inventory';
    } else if (!$qv.inventoryOptions.consolidatedQty) {
        colorObjArray = qv_noInventoryColorArray;
        noInventoryFlag = 'no-inventroy';
    }
    var colorHtmlWrapper = '<div class="qview-color-swatch-wrapper qview-swatch-wrapper">';
    colorHtmlWrapper += '<div class="chart-wrapper">';
    colorHtmlWrapper += '<div class="select-color-errormsg qv-errormsg" style="display:none;">' + Translator.translate('SELECT COLOR') + '</div>';
    colorHtmlWrapper += '<div class="label">' + Translator.translate('SELECT COLOR') + '</div>';
    colorHtmlWrapper += '<div class="selected-color selected-label" ><span>' + Translator.translate('Color') + ' :</span><span id="selectedColor"></span></div>';
    colorHtmlWrapper += '</div>';
    colorHtmlWrapper += '<ul class="listChip qview-listChip qview-listChip-color clearfix">';
    jQuery.each(colorObjArray, function (colorIndex, colorItem) {
        var color = $qv.allColors[colorItem];
        var swatchImage = '', largeImage = '', zoomImage = '';
        if (color.image !== undefined) {
            if (color.image.swatch !== undefined && color.image.swatch !== '') {
                swatchImage = baseMediaPath + color.image.swatch[0];
                swatch = color.image.swatch;
            }
            if (color.image.large !== undefined && color.image.large !== '') {
                largeImage = baseMediaPath + color.image.large[0];
                largeimage = color.image.large[0];
            }
            if (color.image.zoom !== undefined && color.image.zoom !== '') {
                zoomImage = baseMediaPath + color.image.zoom[0];
                zoomimage = color.image.zoom[0];
            }
        }
        var selectedClass = '';
        //var selectedClass = (colorIndex === 0) ? 'selected' : '';
        colorHtmlWrapper += '<li data-colorlabel="' + color.label.toLowerCase() + '" data-colorcode="' + color.code + '" class="' + noInventoryFlag + ' color ' + selectedClass + ' color-' + color.code + '" data-attributename="color">';
        colorHtmlWrapper += '<a data-largeimage="' + largeImage + '" data-zoomimage="' + zoomImage + '" data-colorcode="' + color.code + '"  title="' + color.label + '">';
        colorHtmlWrapper += '<img src="' + swatchImage + '"/>';
        colorHtmlWrapper += '<span></span>';
        colorHtmlWrapper += '</a></li>';
    });
    colorHtmlWrapper += '</ul>';
    colorHtmlWrapper += '<div>';
    $qv.infoWrapper.append(colorHtmlWrapper);
}
function appendSizeSwatches() {
    var sizeChartAttr = jQuery('.quickView.clicked').attr('data-sizechart');
    var sizeChartHtml = "", sizeChartLink = "";
    if (sizeChartAttr !== undefined && sizeChartAttr) {
        sizeChartLink = qvS3MediaUrl + jQuery('.quickView.clicked').attr('data-sizechart');
        sizeChartHtml = '<a href="javascript:void(window.open(\'' + sizeChartLink + '\', \'\', \'width=600, height=700, status=no, toolbar=no, menubar=no, location=no, resizable=yes, scrollbars=yes\'));"><span>' + Translator.translate('_SIZE CHART') + '</span><span class="arrow"></span></a>';
    }

    var sizeHtml = "";
    sizeHtml = '<div class="qview-size-swatch-wrapper qview-swatch-wrapper">';
    sizeHtml += '<div class="size-chart-wrapper chart-wrapper">';
    sizeHtml += '<div class="select-size-errormsg qv-errormsg" style="display:none;">' + Translator.translate('SELECT SIZE') + '</div>';
    sizeHtml += '<div class="label">' + Translator.translate('SELECT SIZE') + '</div>';
    if (sizeChartAttr !== undefined && sizeChartAttr) {
        sizeHtml += '<div class="size-chart">' + sizeChartHtml + '</div>';
    }
    sizeHtml += '</div>';
    sizeHtml += '<div class="selected-size selected-label"><span>' + Translator.translate('Size') + ' :</span><span id="selectedSize"></span></div>';
    sizeHtml += '<ul class="listChip qview-listChip qview-listChip-size clearfix" id="listChipSize">';
    jQuery.each(qv_sortedSizeArray, function (index, sizeItem) {
        var sizeTitle = qv_consolidatedSizes[sizeItem];
        sizeHtml += '<li data-sizecode="' + sizeItem + '" class="size size-index' + index + ' size-' + sizeItem + '"><a title="' + sizeTitle + '"><em>' + sizeTitle + '</em></a></li>';
    });
    sizeHtml += '</ul></div>';
    $qv.infoWrapper.append(sizeHtml);
}
function appendLengthSwatches() {
    var sizeChartAttr = jQuery('.quickView.clicked').attr('data-sizechart');
    var sizeChartHtml = "", sizeChartLink = "";
    if (sizeChartAttr !== undefined && sizeChartAttr) {
        sizeChartLink = qvS3MediaUrl + jQuery('.quickView.clicked').attr('data-sizechart');
        sizeChartHtml = '<a href="javascript:void(window.open(\'' + sizeChartLink + '\', \'\', \'width=600, height=700, status=no, toolbar=no, menubar=no, location=no, resizable=yes, scrollbars=yes\'));"><span>' + Translator.translate('_SIZE CHART') + '</span><span class="arrow"></span></a>';
    }
    if (SPEC_DEBUG)
        console.log("###Length Enabled");
    var lengthHtml = "";
    lengthHtml = '<div class="qview-length-swatch-wrapper qview-swatch-wrapper">';
    lengthHtml += '<div class="length-chart-wrapper chart-wrapper">';
    lengthHtml += '<div class="select-length-errormsg qv-errormsg" style="display:none;">' + Translator.translate('Select Length') + '</div>';
    lengthHtml += '<div class="label">' + Translator.translate('Select Length') + '</div>';
    if (sizeChartAttr !== undefined && sizeChartAttr) {
       lengthHtml += '<div class="size-chart">' + sizeChartHtml + '</div>';
    }    
    lengthHtml += '</div>';
    lengthHtml += '<div class="selected-length selected-label"><span>' + Translator.translate('Length') + ' :</span><span id="selectedLength"></span></div>';
    lengthHtml += '<ul class="listChip qview-listChip qview-listChip-length clearfix" id="listChipLength">';
    jQuery.each(qv_lengthArray, function (index, lengthItem) {
        var lengthTitle = qv_consolidatedLength[lengthItem];
        lengthHtml += '<li data-lengthcode="' + lengthItem + '" class="len length-' + lengthItem + ' length-index' + index + '" data-attributename="length">';
        lengthHtml += '<a title="' + lengthTitle + '"><em>' + lengthTitle + '</em></a></li>';
    });
    lengthHtml += '</ul></div>';
    $qv.infoWrapper.append(lengthHtml);
}
function resetQuickViewQtyDropDown() {
    if (SPEC_DEBUG)
        console.log('###QuickView Reset all Qty related previous setting');
    $qv.stockInfo.html('').hide();
    $qv.selectedQtyValue.attr('data-selectedqtyvalue', 1);
    $qv.selectedQtyValue.html('1');
    jQuery('li', $qv.qtyOption).removeClass('selected');
    jQuery('li:first', $qv.qtyOption).addClass('selected');
    $qv.qtyAvailability.val(0);
    jQuery('.qv-qtyHolder,.qvBtnCart').removeClass('active');
    $qv.qtyOption.hide();
    jQuery('.qvButtonWrapper #pdtid').val('');
}
function stockMessageUpdateHelper(qtySelectFlag) {
    if (SPEC_DEBUG)
        console.log('###Stock Checking');
    var qtyAvailability = parseInt($qv.qtyAvailability.val());
    var qtySelectBoxVal = parseInt($qv.selectedQtyValue.attr('data-selectedqtyvalue'));
    var selectedSku = jQuery('#pdtid').val();
    if (SPEC_DEBUG)
        console.log('###availability :' + qtyAvailability + ' , selectedQty : ' + qtySelectBoxVal + ' , sku :' + selectedSku);
    if (qtySelectFlag) {
        if (qtySelectBoxVal && qtyAvailability) {
            if (qtySelectBoxVal > qtyAvailability) {
                $qv.stockInfo.html(Translator.translate('There is not enough stock, only ' + $qv.qtyAvailability.val() + ' available.'));
                $qv.stockInfo.show();
                jQuery('.qvBtnCart').removeClass('active');
            } else {
                $qv.stockInfo.html('');
                $qv.stockInfo.hide();
                if (selectedSku !== undefined && selectedSku) {
                    jQuery('.qvBtnCart').addClass('active');
                } else {
                    jQuery('.qvBtnCart').removeClass('active');
                }
            }
        }
    } else if (qtyAvailability < 3 && qtyAvailability > 0) {
        $qv.stockInfo.html(Translator.translate('Low in stock'));
        $qv.stockInfo.show();
    }
    if (qtySelectBoxVal && (qtySelectBoxVal <= qtyAvailability) && selectedSku) {
        if (SPEC_DEBUG)
            console.log('###Ready for add to cart');
        jQuery('.qvBtnCart').addClass('active');
    } else {
        if (SPEC_DEBUG)
            console.log('###Not Ready for add to cart');
        jQuery('.qvBtnCart').removeClass('active');
    }
}
function initLightThumbnailSlider() {
    if (SPEC_DEBUG)
        console.log('###Slider initiated');
    var slider = jQuery('.thumbSlider', $qv.colorThumbnailImgWrapper).lightSlider({
        vertical: true,
        verticalHeight: 420,
        item: 5,
        slideMargin: 5,
        loop: false,
        pager: false,
        onSliderLoad: function ($slider) {
            var activeSelectedColor = jQuery('.qview-listChip-color li.color.selected');
            if (activeSelectedColor.length) {
                jQuery.fn.updateLargeImage(activeSelectedColor);
            } else {
                jQuery.fn.updateLargeImage(jQuery('.qview-listChip-color li.color:first'));
            }
            if (jQuery('.qvThumbItem', $slider).length > 5) {
                $qv.colorThumbnailImgWrapper.addClass('sliderActionActive');
            } else {
                $qv.colorThumbnailImgWrapper.removeClass('sliderActionActive');
            }
        },
        onAfterSlide: function ($slider) {
            //console.log($slider.find('.active').index());
        }
    });
    jQuery('#qvThumbnails .slideControls .lSlidePrev').click(function () {
        slider.goToPrevSlide();
    });
    jQuery('#qvThumbnails .slideControls .lSlideNext').click(function () {
        slider.goToNextSlide();
    });
    jQuery('.thumbSlider .qvThumbItem', $qv.colorThumbnailImgWrapper).click(function () {
        jQuery.fn.updateLargeImage(jQuery(this));
        jQuery.fn.resetZoom();
    });
}
function appendColorImageHtml(modelCode) {
    var scriptWrap = jQuery('#script-' + modelCode);
    $qv.colorThumbnailImgWrapper.html('');
    $qv.largeImageWrapper.html('');
    var sliderNavAction = '<div class="slideControls"><div class="lSlidePrev"></div><div class="lSlideNext"></div></div>';
    $qv.colorThumbnailImgWrapper.append(sliderNavAction);
    $qv.colorThumbnailImgWrapper.append('<div class="thumbSlider"></div>');
    var selectedColorCode = "";
    if (jQuery('.qview-listChip-color li.color.selected').length) {
        selectedColorCode = jQuery('.qview-listChip-color li.color.selected').data('colorcode');
    } else {
        selectedColorCode = jQuery('.qview-listChip-color li.color:first').data('colorcode');
    }
    var thumbnailHtml = jQuery('.prodCarouselHtml' + selectedColorCode, scriptWrap).html();
    jQuery('.thumbSlider', $qv.colorThumbnailImgWrapper).append(thumbnailHtml);
    initLightThumbnailSlider();
    $qv.carouselLoader.hide();
}
function quickViewColorSelectEventHandler(colorCode) {
    var selectColorLabel = jQuery('.qview-color-swatch-wrapper #selectedColor');
    var selectedColorItem = jQuery('.color-' + colorCode);
    var colorLabel = (typeof(selectedColorItem.data('colorlabel')) === 'string') ? selectedColorItem.data('colorlabel').toUpperCase() : selectedColorItem.data('colorlabel');
    selectColorLabel.html(colorCode + ' ' + colorLabel);
    jQuery('.qview-listChip-color li.color ,.qview-listChip-size li.size , .qview-listChip-length li.len').removeClass('enable disable');
    if ($qv.colorSizeAvailabilityObj['color'][colorCode] !== undefined && $qv.colorSizeAvailabilityObj['color'][colorCode].length) {
        var availableSizes = $qv.colorSizeAvailabilityObj['color'][colorCode];
        if (availableSizes.length) {
            for (var i = 0; i < availableSizes.length; i++) {
                jQuery('.qview-listChip-size li.size-' + availableSizes[i]).addClass('enable');
            }
        }
        jQuery('.qview-listChip-size li.size:not(.enable)').addClass('disable');
    } else {
        jQuery('.qview-listChip-size li.size:not(.enable)').addClass('disable');
    }
}
function quickViewSizeSelectEventHandler(sizeCode, hoverFlag) {
    if (!hoverFlag) {
        jQuery('#selectedSize').html(qv_consolidatedSizes[sizeCode]);
    }
    jQuery('.qview-listChip-color li.color ,.qview-listChip-length li.len').removeClass('enable disable');
    if ($qv.colorSizeAvailabilityObj['size'][sizeCode] !== undefined && $qv.colorSizeAvailabilityObj['size'][sizeCode].length) {
        var availableColorsForSize = $qv.colorSizeAvailabilityObj['size'][sizeCode];
        if (availableColorsForSize.length) {
            for (var i = 0; i < availableColorsForSize.length; i++) {
                jQuery('.qview-listChip-color li.color-' + availableColorsForSize[i]).addClass('enable');
            }
            jQuery('.qview-listChip-color li.color:not(.enable)').addClass('disable');
        }
    } else {
        jQuery('.qview-listChip-color li.color:not(.enable)').addClass('disable');
    }
    if ($qv.isLengthOptionEnabled) {
        var availableLengthForSizes = $qv.sizeLengthAvailabilityObj.size[sizeCode];
        jQuery.each(availableLengthForSizes, function (i, item) {
            jQuery('.qview-listChip-length li.length-' + item).addClass('enable');
        });
        jQuery('.qview-listChip-length li.len:not(.enable)').addClass('disable');
    }
}
function quickViewLengthHoverEvent(lengthCode) {
    var availableSizeArr = $qv.sizeLengthAvailabilityObj.slength[lengthCode];
    jQuery.each(availableSizeArr, function (index, item) {
        jQuery('.qview-listChip-size li.size-' + item).addClass('hasLength');
    });
    jQuery('.qview-listChip-size li.size:not(.hasLength)').addClass('noLength');
}
jQuery.fn.updateQuickViewQtyAvailability = function (colorCode, sizeCode, lengthCode) {
    if (SPEC_DEBUG)
        console.log('###Update quickview qty availability fields');
    var inventory = $qv.inventoryQtyOption['options'];
    var inStockQtyObj = "";
    if (lengthCode !== undefined) {
        inStockQtyObj = inventory[colorCode][sizeCode][lengthCode];
    } else {
        inStockQtyObj = inventory[colorCode][sizeCode];
    }
    if (inStockQtyObj !== undefined && parseInt(inStockQtyObj.qty)) {
        $qv.qtyAvailability.val(parseInt(inStockQtyObj.qty));
    }
};
jQuery.fn.updateAddToBagBtn = function (colorCode, sizeCode, lengthCode) {
    var allColorOptions = $qv.allColors;
    var inventory = $qv.inventoryQtyOption['options'];
    var colorObj = allColorOptions[colorCode];

    var inStockQtyObj = "";
    var sizeObj = "", lengthObj = "";
    if (lengthCode !== undefined) { //length available
        inStockQtyObj = inventory[colorCode][sizeCode][lengthCode];
        lengthObj = colorObj.size[sizeCode]['length'][lengthCode];

        if (inStockQtyObj !== undefined && parseInt(inStockQtyObj.qty)) {
            jQuery('#pdtid').val(lengthObj['pid']);
        }

    } else {
        inStockQtyObj = inventory[colorCode][sizeCode];
        sizeObj = colorObj.size[sizeCode];
        if (inStockQtyObj !== undefined && parseInt(inStockQtyObj.qty)) {
            jQuery('#pdtid').val(sizeObj['pid']);
        }
    }
};
function initQuickViewEventHandlers(modelCode) {
    var isMobile = (jQuery(window).width() < 768) ? 1 : 0;
    if (SPEC_DEBUG)
        console.log('###QuickView All Event Binding');
    resetQuickViewQtyDropDown();
    if (!$qv.inventoryOptions.consolidatedQty) {
        // No Inventory at all
        jQuery('.qview-listChip-size li.size,.qview-listChip-color li.color').addClass('disable');
        jQuery('#quickview-popup .item-unavailable').show();
        // hover showing image carousels
        var qvColorsItems = jQuery('.qview-listChip-color li.color');
        qvColorsItems.hover(function () {
            var $this = jQuery(this);
            jQuery.fn.updateLargeImage($this);
        }, function () {
            jQuery.fn.updateLargeImage(jQuery('.qview-listChip-color li.color:first'));
        });
    } else {
        jQuery('#quickview-popup .item-unavailable').hide();
        $qv.stockInfo.html('').hide();
        var qvColorsItems = jQuery('.qview-listChip-color li.color');

        qvColorsItems.click(function () {
            resetQuickViewQtyDropDown();
            $qv.stockInfo.html('').hide();
            var $this = jQuery(this);
            quickViewColorSelectEventHandler($this.data('colorcode'));
            jQuery.fn.updateLargeImage($this);
            if ($this.hasClass('inventory')) {
                jQuery('.select-color-errormsg').hide();
                qvColorsItems.removeClass('selected');
                $this.addClass('selected');
                jQuery('.qview-listChip-size li.size,.qview-listChip-length li.len').removeClass('selected');
            }
        });
        if (!isMobile) {
            qvColorsItems.hover(function () {
                //Mouse in event binding
                var $this = jQuery(this);
                quickViewColorSelectEventHandler($this.data('colorcode'));
                jQuery.fn.updateLargeImage($this);
            }, function () {
                //Mouse Out = Resetting
                var defaultSelectedColor = jQuery('.qview-listChip-color li.color.selected');
                if (defaultSelectedColor.length) {
                    jQuery.fn.updateLargeImage(defaultSelectedColor);
                    quickViewColorSelectEventHandler(defaultSelectedColor.data('colorcode'));
                }
            });
        }

        /*Size Eventlistener*/
        var qvSizeItems = jQuery('.qview-listChip-size li.size');
        qvSizeItems.click(function () {
            var isColorSelected = jQuery('.qview-listChip-color li.color.selected').length;
            if (!isColorSelected) {
                jQuery('.select-color-errormsg').show();
            } else {
                jQuery('.select-color-errormsg').hide();
            }
            resetQuickViewQtyDropDown();
            qvSizeItems.removeClass('selected');
            var $this = jQuery(this);
            quickViewSizeSelectEventHandler($this.data('sizecode'));
            if ($this.hasClass('enable')) {
                jQuery('.select-size-errormsg').hide();
                qvSizeItems.removeClass('selected');
                $this.addClass('selected');
                jQuery('#selectedLength').html('');
                jQuery('.qview-listChip-length li.len').removeClass('selected');
                if (!$qv.isLengthOptionEnabled && isColorSelected) {
                    var selectedColorCode = jQuery('.qview-listChip-color li.color.selected').data('colorcode');
                    var selectedSizeCode = jQuery('.qview-listChip-size li.size.selected').data('sizecode');
                    // jQuery.fn.updatePrice(colorCode,sizeCode,lengthCode)
                    if (selectedColorCode !== undefined && selectedSizeCode !== undefined) {
                        jQuery.fn.updatePrice(selectedColorCode, selectedSizeCode, undefined);
                        //upate all hidden field values for keeping thigs ready for add-to-bag
                        jQuery.fn.updateQuickViewQtyAvailability(selectedColorCode, selectedSizeCode, undefined);
                        jQuery.fn.updateAddToBagBtn(selectedColorCode, selectedSizeCode, undefined);
                        stockMessageUpdateHelper();
                    }
                }
            } else if (!$qv.isLengthOptionEnabled && !$this.hasClass('enable')) {
                $qv.stockInfo.html(Translator.translate('Out of stock'));
                $qv.stockInfo.show();
            }
        });
        if (!isMobile) {
            qvSizeItems.hover(function () {
                var $this = jQuery(this);
                quickViewSizeSelectEventHandler($this.data('sizecode'), true);
            }, function () {
                jQuery('.qview-listChip-color li.color').removeClass('disable');
                jQuery('.qview-listChip-length li.len').removeClass('enable disable');
                var defaultSelectedSize = jQuery('.qview-listChip-size li.size.enable.selected');
                if (defaultSelectedSize.length) {
                    quickViewSizeSelectEventHandler(defaultSelectedSize.data('sizecode'));
                }
            });
        }

        if ($qv.isLengthOptionEnabled) {
            var qvLengthItems = jQuery('.qview-listChip-length li.len');

            qvLengthItems.click(function () {
                resetQuickViewQtyDropDown();
                var $this = jQuery(this);
                var isSizeSelected = jQuery('.qview-listChip-size li.size.selected').length;
                var isColorSelected = jQuery('.qview-listChip-color li.color.selected').length;
                if ($this.hasClass('enable') && isSizeSelected) {
                    jQuery('.select-length-errormsg').hide();
                    jQuery('#selectedLength').html(qv_consolidatedLength[$this.data('lengthcode')]);
                    qvLengthItems.removeClass('selected');
                    $this.addClass('selected');

                    var selectedColorCode = jQuery('.qview-listChip-color li.color.selected').data('colorcode');
                    var selectedSizeCode = jQuery('.qview-listChip-size li.size.selected').data('sizecode');
                    var selectedLengthCode = jQuery('.qview-listChip-length li.len.selected').data('lengthcode');
                    // jQuery.fn.updatePrice(colorCode,sizeCode,lengthCode)
                    if (selectedColorCode !== undefined && selectedSizeCode !== undefined && selectedLengthCode !== undefined) {
                        jQuery.fn.updatePrice(selectedColorCode, selectedSizeCode, selectedLengthCode);
                        //upate all hidden field values for keeping thigs ready for add-to-bag
                        jQuery.fn.updateQuickViewQtyAvailability(selectedColorCode, selectedSizeCode, selectedLengthCode);
                        jQuery.fn.updateAddToBagBtn(selectedColorCode, selectedSizeCode, selectedLengthCode);
                        stockMessageUpdateHelper();
                    }
                } else if (!isSizeSelected || !isColorSelected) {
                    if (!isSizeSelected) {
                        if (SPEC_DEBUG)
                            console.log("please select size");
                        jQuery('#selectedLength').html('');
                        jQuery('.select-size-errormsg').show();
                    }
                    if (!isColorSelected) {
                        if (SPEC_DEBUG)
                            console.log("please select color");
                        jQuery('#selectedColor').html('');
                        jQuery('.select-color-errormsg').show();
                    }
                } else {
                    jQuery('#selectedLength').html('');
                    if (SPEC_DEBUG)
                        console.log("length not available");
                    $qv.stockInfo.html(Translator.translate('Out of stock'));
                    $qv.stockInfo.show();
                }
            });
            if (!isMobile) {
                qvLengthItems.hover(function () {
                    jQuery('#selectedLength').html('');
                    var $this = jQuery(this);
                    quickViewLengthHoverEvent($this.data('lengthcode'));
                }, function () {
                    jQuery('.qview-listChip-size li.size').removeClass('hasLength noLength');
                });
            }
        }
        jQuery('.qview-listChip-color li.color:first').trigger('click');
    }
}

function showQuickViewPopup(modelCode) {

    $qv.infoWrapper.html('');
    populateColorSizeLengthArray(modelCode);
    if (qv_colorArray.length || qv_noInventoryColorArray.length) {
        var modelScript = jQuery('#script-' + modelCode);
        if (jQuery('.tag', modelScript).length) {
            $qv.infoWrapper.append(jQuery('.tag', modelScript).clone());
        }
        $qv.infoWrapper.append(jQuery('.product-name', modelScript).clone());
        $qv.infoWrapper.append('<div class="item-unavailable" style="display:none;"><span>' + Translator.translate('Currently not available') + '</span></div>');
        $qv.infoWrapper.append('<div class="item-code-wrapper"><span class="label">' + Translator.translate('ITEM CODE') + ': ' + '</span><span class="modelcodeval">' + modelCode + '</span></div>');
        //default price html - this will get updated based on color and size selection- default pdp behaviour;
        $qv.infoWrapper.append(jQuery('.price-box', modelScript).clone().addClass('qview-pricebox'));
        jQuery('.qvLearMore').attr('href', jQuery('.prod-url', modelScript).attr('data-produrl'));
        appendColorSwatches();
        appendSizeSwatches();
        if ($qv.isLengthOptionEnabled) {
            appendLengthSwatches();
        }
        //all QuickView event binding
        initQuickViewEventHandlers(modelCode);
         $qv.carouselLoader.show();
        if (modelScript.hasClass('colorCarouselHtmlAppended')) {
            if (SPEC_DEBUG)
                console.log('colorCarouselHtmlAppended already appended');
            showQVPopup(true);
            modelScript.data("first-rendering", 0);
            appendColorImageHtml(modelCode);
        } else {
            showQVPopup(true);
            buildColorThumbnailModelScriptHtml($qv.allColors, modelCode).then(function (data) {
                if (SPEC_DEBUG)
                    console.log("First time thumbnail integration");
                modelScript.data("first-rendering", 1);
                appendColorImageHtml(modelCode);
            });
            /*isDomHasClassCheck('#script-' + modelCode, 'colorCarouselHtmlAppended').then(function (element) {
             
             });*/
        }

        if (!$qv.popup.data('popUpEventBinded')) {
            //Ensure that event binding happens only once and not each time we click quick view
            initQuickViewModelCloseEvent();
            $qv.popup.data('popUpEventBinded', true);
        }
    }
}
function initQtyDropDownEventHandler() {
    if (SPEC_DEBUG)
        console.log("###Quickview Qty dropdown event binding");
    jQuery('.qv-qtyHolder').click(function () {
        var $this = jQuery(this);
        if (parseInt($qv.qtyAvailability.val())) {
            $this.toggleClass('active');
            if ($this.hasClass('active')) {
                $qv.qtyOption.show();
            } else {
                $qv.qtyOption.hide();
            }
        } else {
            $qv.qtyOption.hide();
            if (SPEC_DEBUG)
                console.log("Either the item you selected is out of stock or you havn't selected any option.");
        }
    });
    jQuery('li', $qv.qtyOption).click(function () {
        var qtySelectFlag = true;
        var $this = jQuery(this);
        jQuery('li', $qv.qtyOption).removeClass('selected');
        $this.addClass('selected');
        $qv.selectedQtyValue.attr('data-selectedqtyvalue', $this.data('value'));
        $qv.selectedQtyValue.html($this.data('value'));
        $qv.qtyOption.hide();
        stockMessageUpdateHelper(qtySelectFlag);
    });
}
jQuery.fn.showErrorFlags = function () {
    var selectedColor = jQuery('.qview-listChip-color li.color.selected');
    var selectedSize = jQuery('.qview-listChip-size li.size.selected');
    if (!selectedColor.length) {
        jQuery('.select-color-errormsg').show();
    }
    if (!selectedSize.length) {
        jQuery('.select-size-errormsg').show();
    }
    if ($qv.isLengthOptionEnabled) {
        var selectedLength = jQuery('.qview-listChip-length li.len.selected');
        if (!selectedLength.length) {
            jQuery('.select-length-errormsg').show();
        }
    }
};
jQuery.updateMiniCart = function (ajaxResponse) {
    var headerMiniCart = jQuery('#navHeader .shop_bag');
    headerMiniCart.addClass('item_present');
    jQuery('.bag_qty', headerMiniCart).html(ajaxResponse.cartcount);
    jQuery('#cartcount #cqty', headerMiniCart).html(ajaxResponse.cartcount);
    jQuery('#cart_subtotal', headerMiniCart).html(ajaxResponse.cartsubtotal);
    jQuery('#gnav_cart_target', headerMiniCart).show();
    jQuery("html, body").animate({scrollTop: 0}, "slow");
    setTimeout(function () {
        jQuery('#gnav_cart_target', headerMiniCart).hide();
    }, 1000);

};
function initAddToBagClickEventHandler() {
    jQuery('.qvBtnCart').click(function () {
        var $this = jQuery(this);
        if (($this).hasClass('active')) {
            if (SPEC_DEBUG)
                console.log("All set to post data");
            $this.removeClass('active');
            $this.css('opacity', '0.3');
            var qvAddToCartAjaxUrl = qvStoreUrl + "checkout/cart/add/";
            var postData = {
                product: jQuery('#pdtid').val(),
                qty: parseInt($qv.selectedQtyValue.attr('data-selectedqtyvalue')),
                isAjax: 1
            };
            var request = jQuery.ajax({
                url: qvAddToCartAjaxUrl,
                method: "POST",
                data: postData
            });
            request.done(function (response) {
                var response = jQuery.parseJSON(response)
                if (response['status'].toLowerCase() === 'error') {
                    $this.addClass('active');
                    jQuery('.qvAjax-error-msg').html(response['message']);
                    jQuery('.qvAjax-error-msg').show();
                    setTimeout(function () {
                        jQuery('.qvAjax-error-msg').hide();
                    }, 3000);
                } else if (response['status'].toLowerCase() === 'success') {
                    jQuery.updateMiniCart(response);
                    showQVPopup(false);
                }
                $this.css('opacity', '');
            });
        } else {
            jQuery.fn.showErrorFlags();
        }
    });
}
jQuery.fn.initQuickView = function (e, targetElem) {
    var prodId = '', modelCodeVal = '';
    $qv.colorThumbnailImgWrapper.html('');
    $qv.largeImageWrapper.html('');
    jQuery('.qvBtnCart').removeClass('active');
    var $this = jQuery(targetElem);
    if (jQuery(e.target).is('.quickView')) {
        e.preventDefault();
        jQuery('.quickView').removeClass('clicked');
        var $qvBtn = jQuery('.quickView', $this);
        $qvBtn.addClass('clicked');
        prodId = $qvBtn.data('pid');
        modelCodeVal = $qvBtn.data('modelcodevalue');

        if (!(jQuery('#script-' + modelCodeVal, $qv.scriptWrapper).length)) {
            getQuickViewAllProdData(prodId, modelCodeVal);
        } else {
            getQuickViewInventoryData(prodId, modelCodeVal);
        }
    }
};
jQuery(document).ready(function () {
    if (isQuickViewEnabled) {
        jQuery('.category-products .products-grid a.product-image,.category-products .products-list a.product-image').click(function (e) {
            jQuery.fn.initQuickView(e, this);
        });
        initQtyDropDownEventHandler();
        initAddToBagClickEventHandler();
    } else {
        jQuery('.quickView').hide();
    }
});