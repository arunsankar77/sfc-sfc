({
    handleNewServiceAddress : function(component) {
        var urlEvent = $A.get("e.force:navigateToURL");
        urlEvent.setParams({
            "url": "/apex/ServiceAddressCreation?Id="+ component.get("v.accountRecord.Id")
        });
        urlEvent.fire();
    },
    handleC2C : function(component) {
        var Account = component.get("v.accountRecord");
        var navigateURL = "";
        if(Account.Territory__c.indexOf("CenturyLink") != -1 && (Account.Billing_Source__c == "CRIS" || Account.Billing_Source__c == "Ensemble")){    
            navigateURL = "http://handbook.corp.intranet/applications/twg/hb_development/chat/ensHandbook.html"; 
        }
        if(Account.Territory__c.indexOf("Qwest") != -1 && (Account.Billing_Source__c == "CRIS" || Account.Billing_Source__c == "Ensemble")){    
            navigateURL = "http://rmodkit.corp.intranet/clicktochat/EinsteinPage.html";
        }
        if(navigateURL == ""){
            
        }else{
            var urlEvent = $A.get("e.force:navigateToURL");
            urlEvent.setParams({
                "url": navigateURL
            });
            urlEvent.fire();
        }
    },
    handleUpdatetoTemporaryNoTreat : function(component) {
        var action = component.get("c.ChangeValuetoNT");
        action.setParams({ accid : component.get("v.accountRecord.Id") });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "title": "Success!",
                    "message": "Treatment has been updated successfully.",
                    "type": "success"
                });
                toastEvent.fire();
                $A.get('e.force:refreshView').fire();
            }else if (state === "INCOMPLETE") {
                // do something
            }else if (state === "ERROR") {
                    var errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            var toastEvent = $A.get("e.force:showToast");
                            toastEvent.setParams({
                                "title": "Error!",
                                "message": errors[0].message,
                                "type": "error"
                            });
                            toastEvent.fire();
                        }
                    } else {
                        var toastEvent = $A.get("e.force:showToast");
                        toastEvent.setParams({
                            "title": "Error!",
                            "message": "Unknown error",
                            "type": "error"
                        });
                        toastEvent.fire();
                    }
                }
        });
        $A.enqueueAction(action);
    }
})