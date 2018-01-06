//unminified kebler_autocomplete.js

'use strict'
var kleber = {};
var maxCharLimit = 30;
var addressLine1 = '', addressLine2 = '', addressLine3 = '', tempAddressString = '';
var isAccRegistration = jQuery('.customer-account-create').length;
var isCheckout = jQuery('.onestepcheckout-index-index').length;
var addressEdit = jQuery('.customer-address-form').length;
var cusAccEdit = jQuery('.customer-account-edit').length;


function kleberInitialSetUp() {
    kleber.requestKey = klReqKey;
    kleber.autoCompleteAddressFieldClassName = "kleber-autocomplete-field";
    kleber.autoCompleteShippingAddressFieldClassName = "kleber-autocomplete-shipping-field";
    kleber.retrieve = {
        keyCodeLowCase: "retrieveaddress",
        method: "DataTools.Capture.Address.Predictive.AuPaf.RetrieveAddress"
    };
    kleber.search = {
        keyCodeLowCase: "searchaddress",
        method: "DataTools.Capture.Address.Predictive.AuPaf.SearchAddress"
    };
    kleber.getAjaxDataObj = function (kleberMethod, addressLineVal) {
        var dataObj = {};
        dataObj = {
            RequestKey: kleber.requestKey,
            OutputFormat: "json"
        };
        if (kleberMethod.toLowerCase() === kleber.retrieve.keyCodeLowCase) {
            //Reteieve Approach used
            dataObj.RecordId = addressLineVal;
            dataObj.Method = kleber.retrieve.method;
        } else if (kleberMethod.toLowerCase() === kleber.search.keyCodeLowCase) {
            dataObj.AddressLine = addressLineVal;
            dataObj.Method = kleber.search.method;
            dataObj.ResultLimit = '100';
        }
        return dataObj;
    };
}
/*
 * Function to populate the Address Fields (other pages + checkout page)
 */
function addressFieldPopulate(addressLineClass, addressValue) {
    var addressArray = addressValue.split(' ');
    tempAddressString = '', addressLine1 = '', addressLine2 = '', addressLine2 = '';
    for (var i = 0; i < addressArray.length; i++) {
        tempAddressString = tempAddressString + addressArray[i] + ' ';
        if (addressArray[i].length <= maxCharLimit) {
            if (tempAddressString.length <= maxCharLimit) {
                addressLine1 = addressLine1 + addressArray[i] + ' ';
            } else if (tempAddressString.length > addressLine1.length && addressLine2.length <= maxCharLimit) {
                addressLine2 = addressLine2 + addressArray[i] + ' ';
            } else if (tempAddressString.length > addressLine2.length && addressLine3.length <= maxCharLimit) {
                addressLine2 = addressLine3 + addressArray[i] + ' ';
            }
        }
    }
    jQuery.map(addressLineClass, function (item) {
        if ((item === kleber.autoCompleteAddressFieldClassName) || (item === kleber.autoCompleteShippingAddressFieldClassName)) {
            jQuery('.' + item).val(addressLine1.trim());
        } else if ((item === 'kleber-streetAdd2') || (item === 'kleber-shipping-streetAdd2')) {
            jQuery('.' + item).val(addressLine2.trim()).attr('readonly', 'readonly');
        } else if ((item === 'kleber-streetAdd3') || (item === 'kleber-shipping-streetAdd3')) {
            jQuery('.' + item).val(addressLine3.trim()).attr('readonly', 'readonly');
        }
    });
}
function initKleberAutoComplete(autoCompleteFields, className) {
    var addressClass = [kleber.autoCompleteAddressFieldClassName, 'kleber-streetAdd2', 'kleber-streetAdd3'];
    var suburbClass = 'kleber-suburb';
    var stateClass = 'kleber-state';
    var postCodeClass = 'kleber-autocomplete-postcode';
    if (className === kleber.autoCompleteShippingAddressFieldClassName) {
        var addressClass = [kleber.autoCompleteShippingAddressFieldClassName, 'kleber-shipping-streetAdd2', 'kleber-shipping-streetAdd3'];
        suburbClass = 'kleber-shipping-suburb';
        stateClass = 'kleber-shipping-state';
        postCodeClass = 'kleber-autocomplete-shipping-postcode';
    }
    jQuery.map(autoCompleteFields, function (item) {
        var kleberAutoCompledteTBox = jQuery(item);

        kleberAutoCompledteTBox.keyup(function () {
            if (!jQuery(this).val()) {
                /*
                 * Remove readonly if the user removes the Address Line 1 text(blank)
                 */
                jQuery.map(addressClass, function (item) {
                    jQuery('.' + item).val('').removeAttr('readonly');
                });
                jQuery('.' + suburbClass + ', .' + stateClass + ', .' + postCodeClass).val('').removeAttr('readonly');
                jQuery('select.' + stateClass).removeAttr('disabled');
            }
        });

        kleberAutoCompledteTBox.autocomplete({
            source: function (request, response) {

                /*Reset read only attribute : START */
                jQuery.map(addressClass, function (item) {
                    jQuery('.' + item).removeAttr('readonly');
                });
                jQuery('.' + suburbClass + ', .' + stateClass + ', .' + postCodeClass).removeAttr('readonly');
                jQuery('select.' + stateClass).removeAttr('disabled');
                /*Reset read only attribute : START */
                var ajaxDataObj = {};
                if (request.term.indexOf('AuPaf') === 0) {
                    /*
                     * DataTools.Capture.Address.Predictive.AuPaf.RetrieveAddress (Only supports Record IDs prefixed with 'AuPaf') 
                     */
                    ajaxDataObj = kleber.getAjaxDataObj('RetrieveAddress', request.term);
                } else {
                    ajaxDataObj = kleber.getAjaxDataObj('SearchAddress', request.term);
                }
                jQuery.ajax({
                    url: "//kleber.datatoolscloud.net.au/KleberWebService/DtKleberService.svc/ProcessQueryStringRequest",
                    dataType: "jsonp",
                    type: "GET",
                    contentType: "application/json; charset=utf-8",
                    data: ajaxDataObj,
                    success: function (data) {
                        response(jQuery.map(data.DtResponse.Result, function (item) {
                            var stateId = arraySearchForCode(regionCodeArray, item.State);
                            var output = item.AddressLine + ',' + item.Locality + ',' + stateId + ',' + item.Postcode;
                            return {
                                //label: output,
                                value: output,
                                Output: {
                                    addressLine1: {
                                        domClass: className,
                                        value: item.AddressLine
                                    },
                                    addressLine2: {
                                        domClass: suburbClass,
                                        value: item.Locality
                                    },
                                    addressLine3: {
                                        domClass: stateClass,
                                        value: stateId
                                    },
                                    postCode: {
                                        domClass: postCodeClass,
                                        value: item.Postcode
                                    }
                                }
                            };
                        }));
                    }
                });
            },
            select: function (event, ui) {
                //what happens on user address selection
                if (ui.item !== undefined && ui.item.Output !== undefined) {
                    setTimeout(function () {
                        jQuery.map(ui.item.Output, function (item) {
                            var ckoutBillingAddress = (item['domClass'] === kleber.autoCompleteAddressFieldClassName);
                            var ckoutShippingAddress = (item['domClass'] === kleber.autoCompleteShippingAddressFieldClassName);
                            if (ckoutBillingAddress || ckoutShippingAddress) {
                                addressFieldPopulate(addressClass, item['value']);
                            } else {
                                var domElem = jQuery('.' + item['domClass']);
                                if (domElem.length) {
                                    domElem.val(item['value']);
                                }
                            }

                        });
                        jQuery('.' + suburbClass + ', .' + stateClass + ', .' + postCodeClass).attr('readonly', 'readonly');
                        jQuery('select.'+stateClass).attr('disabled', 'disabled');
                    }, 50);
                }
            }
        }).autocomplete("widget").addClass("kleber-ui-component");
    });
}
function arraySearchForCode(arr, val) {
    arr = arr[regionCodeAS];
    for (var i = 0; i < arr.length; i++)
        if (arr[i].code === val)
            return arr[i].id;
    return false;
}
function addHiddenStateInput() {
    if (isCheckout) {
        if (jQuery('select[name="billing[region_id]"]').length) {
            var ckoutBillingStateDom = jQuery('select[name="billing[region_id]"]');
            var inputBillingHiddenDom = '<input type="hidden" class="kleber-state" name="billing[region_id]" value="">';
            jQuery(inputBillingHiddenDom).insertAfter(ckoutBillingStateDom);
            //Bind change event
            ckoutBillingStateDom.change(function () {
                jQuery('input[type="hidden"].kleber-state').val(ckoutBillingStateDom.val());
            });
        }
        if (jQuery('select[name="shipping[region_id]"]').length) {
            var ckoutShippingStateDom = jQuery('select[name="shipping[region_id]"]');
            var inputShippingHiddenDom = '<input type="hidden" class="kleber-shipping-state" name="shipping[region_id]" value="">';
            jQuery(inputShippingHiddenDom).insertAfter(ckoutShippingStateDom);
            //Bind change event
            ckoutShippingStateDom.change(function () {
                jQuery('input[type="hidden"].kleber-shipping-state').val(ckoutShippingStateDom.val());
            });
        }
    } else {
        var stateSelectDom = jQuery('select[name="region_id"]');
        var inputStateHidden = '<input type="hidden" class="kleber-state" name="region_id" value="">';
        jQuery(inputStateHidden).insertAfter(stateSelectDom);
        //Bind change event
        if (jQuery(stateSelectDom).val()) {
            jQuery('input[type="hidden"].kleber-state').val(jQuery(stateSelectDom).val());
        }
        jQuery(stateSelectDom).change(function () {
            jQuery('input[type="hidden"].kleber-state').val(jQuery(stateSelectDom).val());
        });
    }
}
jQuery(document).ready(function () {
    if (isAccRegistration || isCheckout || addressEdit || cusAccEdit) {
        //needed to add input hidden field for State as we need to disable the State SelectBox on Address Select
        addHiddenStateInput();
        //initial setup
        kleberInitialSetUp();
        //initiate the kleber code
        if (kleber.requestKey) {
            var keblerAutoField = jQuery('.' + kleber.autoCompleteAddressFieldClassName);
            var keblerAutoShippingField = jQuery('.' + kleber.autoCompleteShippingAddressFieldClassName);
            if (keblerAutoField.length) {
                initKleberAutoComplete(keblerAutoField, kleber.autoCompleteAddressFieldClassName);
            }
            if (keblerAutoShippingField.length) {
                initKleberAutoComplete(keblerAutoShippingField, kleber.autoCompleteShippingAddressFieldClassName);
            }
        }
    }
});