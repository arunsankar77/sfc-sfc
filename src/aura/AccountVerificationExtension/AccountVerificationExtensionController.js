({
    doInit : function(component, event, helper){
        var action = component.get("c.invokeDVARCVVRequest");
        action.setParams({ strId : component.get("v.recordId") });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var tempAction = component.get("c.processDVARCVVResp");
                tempAction.setParams({ strId : component.get("v.recordId"),
                                      httpResponseBody : response.getReturnValue() });
                tempAction.setCallback(this, function(tempResponse) {
                    var tempState = tempResponse.getState();
                    if (tempState === "SUCCESS") {
                        var obj = tempResponse.getReturnValue();
                        if(obj.Error){
                            var toastEvent = $A.get("e.force:showToast");
                            toastEvent.setParams({
                                "title": "Error!",
                                "message": obj.Error,
                                "type": "error"
                            });
                            toastEvent.fire();
                        }else{
                            component.set("v.SSN",obj.maskedSsn);
                            component.set("v.Hint",obj.AuthenticationHint);
                            component.set("v.AuthenticationPin",obj.AuthenticationPin);
                        }
                        component.set("v.isCCVDone",true);
                        var DVARIAAction = component.get("c.CallDVAR_IA");
                        if(obj.DvarccvServiceAddr){
                            DVARIAAction.setParams({ strId : component.get("v.recordId"),
                                                    DvarccvServiceAddr : obj.DvarccvServiceAddr });
                        }else{
                            DVARIAAction.setParams({ strId : component.get("v.recordId"),
                                                    DvarccvServiceAddr : "" });
                        }
                        DVARIAAction.setCallback(this, function(DVARIAResponse) {
                            var DVARIAState = DVARIAResponse.getState();
                            if (DVARIAState === "SUCCESS") {
                                console.log('@@@loopQualDone');
                            }
                        });
                        $A.enqueueAction(DVARIAAction);
                    }
                });
                $A.enqueueAction(tempAction);
            }
        });
        $A.enqueueAction(action);
        helper.EPWFCall(component);
    }
});